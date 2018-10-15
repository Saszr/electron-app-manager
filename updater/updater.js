const { EventEmitter } = require('events')
const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const CacheRepo = require('./repositories/LocalCache')
const GithubRepo = require('./repositories/Github')
const semver = require('semver')

const { app } = require('electron')

function shasum(data, alg) {
  return crypto
    .createHash(alg || 'sha256')
    .update(data)
    .digest('hex');
}

/* release / package struct
{
  name: 'short name of package'
  version: 'e.g. 1.0.1 not v1.0.1_alpha2_xyz'
  tag: 'e.g. v1.0.1_alpha2_xyz'
  channel: 'alpha | beta | release | ...'
  filePath: 'the path to an asar file'
  downloadUrl: 'if remote: the url to fetch asar'
  error: 'set when invalid'

  checksums:

  dependencies: 'future'
  notes: 'future'
}
*/

class AppUpdater extends EventEmitter {
  constructor(options) {
    super()

    const { repo } = options

    this.repo = repo

    this.cache = new CacheRepo(this.downloadDir)
    if (repo.startsWith('https://github.com/')) {
      this.remote = new GithubRepo(repo)
    }

    if (this.remote == null) {
      throw new Error('No repository strategy available for ' + repo)
    }

    this.log = console

    this.showDialog = (options.useDialog === true)

    this.checkForUpdates = this.checkForUpdates.bind(this)

    if (options.auto === true) {
      if (options.interval <= 5 || options.interval > (24 * 60)) {
        throw new Error(`Interval ${options.interval} (min) is unreasonable or not within rate limits`)
      }
      let intervalMin = options.interval || 15
      let intervalSec = intervalMin * 60
      let intervalMs = intervalSec * 1000
      this._startUpdateRoutine(intervalMs)
    }
  }
  get downloadDir() {
    // TODO this can cause timing problems if app is not ready yet:
    let userDataPath = app.getPath('userData')
    let downloadDir = path.join(userDataPath, 'releases')
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir)
    }
    return downloadDir
  }
  async _startUpdateRoutine(interval) {
    if (this.checkHandler) {
      throw new Error('Update routine was started multiple times')
    }
    let errorCounter = 0

    const check = async () => {
      let latest = await this.checkForUpdates()
      if (latest && latest.version) {
        console.log('update found: downloading ', latest.version);
        try {
          let download = await this.downloadUpdate(latest)

        } catch (error) {
          errorCounter++
          console.error(error)
        }
      }
    }

    check()
    this.checkHandler = setInterval(check, interval)
  }
  async checkForUpdates() {
    this.log.log('checking for updates at ', this.repo)

    // first check the cache
    let latestCached
    try {
      latestCached = await this.cache.getLatest()
    } catch (error) {
      console.error(error)
      return null
    }
    this.log.log('latest version in cache is: ', latestCached ? latestCached.version : 'nothing cached')

    // check remote for an updated version
    let latestBackend = await this.remote.getLatest()
    if (
      latestBackend &&
      (!latestCached || semver.gt(latestBackend.version, latestCached.version))
    ) {
      this.emit('update-available', latestBackend)
    } else {
      this.emit('update-not-available', latestCached)
      this.log.log('cache has latest')
    }

    return latestBackend

  }
  async checkIntegrity() {
    return true
    /*
    const { filePath, checksums } = release;
    // TODO promisify await
    let data;
    try {
      data = fso.readFileSync(filePath);
    } catch (error) {
      console.log('error during integrity check', error)
      return false;
    }
    const checksumsDownload = {
      sha1: shasum(data, 'sha1'),
      sha256: shasum(data, 'sha256'),
      sha512: shasum(data, 'sha512')
    };
    let isValid = true;
    for (let alg in checksumsDownload) {
      isValid &= checksumsDownload[alg] === checksums[alg];
    }
    return isValid;
    */
  }
  async downloadUpdate(update) {

    const downloadDir = this.downloadDir
    const filename = `${update.name}.asar`
    const dest = path.join(downloadDir, filename)

    // console.log('download update ', update)
    // console.log('download update to', dest)

    let pp = 0;
    let onProgress = p => {
      let pn = Math.floor(p * 100);
      if (pn > pp) {
        pp = pn;
        // console.log(`downloading update..  ${pn}%`)
        this.emit('update-progress', update, pn);
      }
    };

    try {

      let filePath = await this.remote.download(update, dest, onProgress)
      let release = Object.assign({}, update, {
        filePath
      })

      // if release has no checksum metadata try to fetch
      // TODO remove this
      if (release.checksums === undefined) {
        release = await this.remote.extendWithMetadata(release);
      }

      // TODO verify integratiy and authenticity
      let isValid = await this.checkIntegrity(release);
      if (!isValid) {
        this.emit('update-invalid', update);
        console.log('update is invalid')
        // TODO delete here? - only necessary if data was written
        return;
      }

      this.emit('update-downloaded', release)
      return release;

    } catch (error) {
      console.log('error during download:', error.message);
      return Object.assign(
        {
          error: error.message
        },
        update
      )
    }
  }
}

module.exports = AppUpdater