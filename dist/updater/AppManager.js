"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Cache_1 = __importDefault(require("./repositories/Cache"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const url_1 = __importDefault(require("url"));
const RepoBase_1 = __importDefault(require("./api/RepoBase"));
const menu_1 = __importDefault(require("./electron/menu"));
const repositories_1 = require("./repositories");
const util_1 = require("./util");
const downloader_1 = require("./lib/downloader");
let autoUpdater, CancellationToken = null;
let dialogs = null;
if (util_1.isElectron()) {
    try {
        let eu = require("electron-updater");
        autoUpdater = eu.autoUpdater;
        CancellationToken = eu.CancellationToken;
        dialogs = require('./electron/Dialog').ElectronDialogs;
    }
    catch (error) {
        console.log('error during require of electron modules', error && error.message /*, error*/);
    }
}
const SOURCES = {
    CACHE: 'Cache',
    HOTLOADER: 'HotLoader',
    ELECTRON: 'Electron'
};
class AppManager extends RepoBase_1.default {
    /**
     *
     */
    constructor({ repository, auto = true, electron = false, intervalMins = 15, cacheDir, searchPaths = [], modifiers, filter, prefix }) {
        super();
        this.isElectron = false;
        this.remote = repositories_1.getRepository(repository, modifiers, filter, prefix);
        this.getRemoteReleasesCached = util_1.memoize(this.remote.getReleases.bind(this.remote));
        this.menuBuilder = new menu_1.default(this);
        // there should only be one cache directory so that some things
        // can work (e.g. download) automatically. However, we might need to look for 
        // packages in multiple locations. This is what searchPaths is for
        if (cacheDir) {
            this.cache = new Cache_1.default(cacheDir);
        }
        else {
            this.cache = new Cache_1.default(process.cwd());
        }
        this.caches = [this.cache];
        if (searchPaths) {
            searchPaths.forEach(searchPath => {
                try {
                    this.caches.push(new Cache_1.default(searchPath));
                }
                catch (error) {
                    console.log('WARNING: could not search in search path: ' + searchPath);
                }
            });
        }
        this.checkForUpdates = this.checkForUpdates.bind(this);
        // order important: needs to be set before auto update routine
        if (electron) {
            this.isElectron = electron;
            this.setupAutoUpdater();
        }
        if (auto) {
            if (intervalMins <= 5 || intervalMins > (24 * 60)) {
                throw new Error(`Interval ${intervalMins} (min) is unreasonable or not within api limits`);
            }
            let intervalMs = intervalMins * 60 * 1000;
            // start update routine
            this.checkUpdateHandler = setInterval(this.checkForUpdatesAndNotify.bind(this), intervalMs);
            // first run with small delay so that dialog doesn't block app start
            setTimeout(() => {
                this.checkForUpdatesAndNotify();
            }, 1 * 60 * 1000);
        }
    }
    setupAutoUpdater() {
        // silence autoUpdater -> we will use events and our logging instead
        autoUpdater.logger = {
            info: () => { },
            warn: () => { },
            error: () => { },
        };
        autoUpdater.allowDowngrade = false;
        autoUpdater.autoDownload = false;
        // autoUpdater.autoInstallOnAppQuit = false
        autoUpdater.on('checking-for-update', () => {
            this.emit('checking-for-update');
        });
        autoUpdater.on('update-available', (info) => {
            this.emit('update-available');
        });
        autoUpdater.on('update-not-available', (info) => {
            this.emit('update-not-available');
        });
        autoUpdater.on('error', (err) => {
            this.emit('error', err);
            if (!dialogs) {
                return;
            }
            dialogs.displayUpdateError(err);
        });
        autoUpdater.on('download-progress', (progressObj) => {
        });
        autoUpdater.on('update-downloaded', (info) => {
            this.emit('update-downloaded');
        });
    }
    get repository() {
        return this.remote.repositoryUrl;
    }
    get cacheDir() {
        return this.cache.cacheDirPath;
    }
    get hotLoadedApp() {
        return null; // FIXME
        /*
        if(this.hotLoader.currentApp === null) {
          return null
        }
        let hotLoaded = this.hotLoader.currentApp
        // this is important to determine the source of the latest release
        hotLoaded.repository = SOURCES.HOTLOADER
        return hotLoaded
        */
    }
    cancelUpdateRoutine() {
        if (!this.checkUpdateHandler) {
            return;
        }
        clearInterval(this.checkUpdateHandler);
    }
    clearCache() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.caches) {
                for (const cache of this.caches) {
                    yield cache.clear();
                }
            }
            else {
                return this.cache.clear();
            }
        });
    }
    checkForElectronUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            // doesn't work in dev mode without 'dev-app-update.yml': 
            // https://github.com/electron-userland/electron-builder/issues/1505
            try {
                // use electron's autoUpdater to check for updates
                // https://electronjs.org/docs/api/auto-updater#autoupdatercheckforupdates
                const updateCheckResult = yield autoUpdater.checkForUpdates();
                // no updates available
                // FIXME hack: we are using the presence of the cancellationToken to determine if an update is available according to
                // https://github.com/electron-userland/electron-builder/blob/master/packages/electron-updater/src/AppUpdater.ts#L382
                // we could also use `downloadPromise` which would be null though if auto-download is set to false
                if (!updateCheckResult || !updateCheckResult.cancellationToken) {
                    console.log('electron update not found', updateCheckResult);
                    return {
                        updateAvailable: false,
                        source: SOURCES.ELECTRON,
                        latest: null
                    };
                }
                // https://www.electron.build/auto-update#updateinfo
                let { updateInfo } = updateCheckResult;
                console.log('update found', updateInfo);
                let { version, releaseName, releaseNotes, releaseDate, stagingPercentage } = updateInfo;
                return {
                    updateAvailable: true,
                    source: SOURCES.ELECTRON,
                    // FIXME properly convert electron-builders updateInfo to IRelease
                    latest: {
                        name: releaseName,
                        displayName: releaseName,
                        version,
                        displayVersion: version,
                        channel: 'production',
                        fileName: '',
                        commit: '',
                        size: 0,
                        publishedDate: releaseDate,
                        tag: '',
                        location: '',
                        repository: '',
                        error: undefined,
                        remote: true
                    }
                };
            }
            catch (error) {
                console.log('electron-builder updater error' /*, error*/);
            }
            return {
                updateAvailable: false,
                source: SOURCES.ELECTRON,
                latest: null
            };
        });
    }
    checkForUpdates() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isElectron) {
                return this.checkForElectronUpdates();
            }
            // else: ui / app updater
            const latest = yield this.getLatest();
            if (latest === null) {
                return {
                    updateAvailable: false,
                    source: '',
                    latest: null
                };
            }
            // latest release is not from remote -> no updates necessary
            if (latest.repository === SOURCES.CACHE || latest.repository === SOURCES.HOTLOADER) {
                return {
                    updateAvailable: false,
                    source: latest.repository,
                    latest: latest,
                };
            }
            return {
                updateAvailable: true,
                source: latest.repository,
                latest
            };
        });
    }
    checkForUpdatesAndNotify(showNoUpdateDialog = false) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.isElectron) {
                this.emit('checking-for-update');
                const { updateAvailable, latest } = yield this.checkForUpdates();
                // in case of application packages the default is to
                // just silently download updates in the background
                if (updateAvailable && latest !== null) {
                    this.emit('update-available', latest);
                    this.download(latest);
                }
                else {
                    this.emit('update-not-available');
                }
                return;
            }
            // isPackaged is a safe guard for
            // https://electronjs.org/docs/api/auto-updater#macos
            // "Note: Your application must be signed for automatic updates on macOS. This is a requirement of Squirrel.Mac"
            if (!util_1.isPackaged()) {
                console.log('updater cannot be executed on unsigned applications - routine cancelled');
                this.cancelUpdateRoutine();
                return;
            }
            if (!dialogs) {
                // TODO handle without dialog
                console.warn('dialogs not set');
                return;
            }
            const { updateAvailable, latest } = yield this.checkForUpdates();
            // console.log('update info:', updateAvailable, latest)
            // display "no update found" dialog if there is no update or "latest" version
            if (!updateAvailable || !latest) {
                if (dialogs && showNoUpdateDialog) {
                    dialogs.displayUpToDateDialog();
                }
                return;
            }
            // there is a later version: use info from latest for "update found" dialog
            let { displayName, version } = latest;
            dialogs.displayUpdateFoundDialog(displayName, version, (shouldInstall) => __awaiter(this, void 0, void 0, function* () {
                if (!shouldInstall) {
                    console.log('user skipped update');
                    return;
                }
                // TODO check if we can use UpdateInfo instead
                const cancellationToken = new CancellationToken();
                try {
                    yield autoUpdater.downloadUpdate(cancellationToken);
                    dialogs.displayRestartForUpdateDialog(() => {
                        // https://github.com/electron-userland/electron-builder/issues/3402#issuecomment-436913714
                        // "you need to wrap quitAndInstall in setImmediate if called from dialog"
                        setImmediate(() => autoUpdater.quitAndInstall());
                    });
                }
                catch (error) {
                    dialogs.displayUpdateError(error);
                }
            }));
        });
    }
    /* TODO only temp solution for custom protocol
      replace with AppManager's routine
      not possible now because it would only emit events but the main app
      has no listeners registered on the AppManager instance in custom protocol handler.
      --> needs dialogs
      the next problem is that a targetVersion cannot be specified
    */
    _checkForAppUpdatesAndNotify({ version = undefined, download = false, dialogs = false }) {
        return __awaiter(this, void 0, void 0, function* () {
            // checks remote and cache for release
            let release = yield this.getLatest({
                version,
                download: false // we set to false to be able to distinguish local vs remote
            });
            // if release.remote -> remote has newer version
            if (release && release.remote && download) {
                // download release in background
                release = yield this.download(release, {
                    writePackageData: true,
                });
            }
            if (release && dialogs) {
                // TODO display info of newer version to user
                console.log('update found!', release.version);
                // TODO dialogs.displayReloadForUpdateDialog()
            }
        });
    }
    getCachedReleases() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache.getReleases();
        });
    }
    getRemoteReleases({ sort = true, cached = true } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (cached) {
                return this.getRemoteReleasesCached({ sort });
            }
            return this.remote.getReleases({ sort });
        });
    }
    getReleases({ cached } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const cachedReleases = yield this.cache.getReleases({ sort: false });
            const remoteReleases = yield this.getRemoteReleases({ sort: false, cached });
            const allReleases = [
                ...cachedReleases,
                ...remoteReleases
            ];
            return allReleases.sort(this.compareVersions);
        });
    }
    getLatestCached(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.caches) {
                let promises = this.caches.map(c => c.getLatest(options));
                let latest = yield Promise.all(promises);
                return this._getLatest(latest);
            }
            return this.cache.getLatest(options);
        });
    }
    getLatestRemote(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let { filter, download, verify } = options;
            let release = yield this.remote.getLatest(options);
            if (release === null) {
                return null;
            }
            const { name } = release;
            if (release && download) {
                const { downloadOptions } = options;
                const downloadResult = yield this.download(release, downloadOptions);
                /*if (downloadResult && verify && !downloadResult.verificationResult) {
                  throw new Error(`Error: External package ${name} has no verification info.`)
                }*/
                return downloadResult;
            }
            return release;
        });
    }
    getLatest(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filter, download, verify, version } = options;
            const latestCached = yield this.getLatestCached({
                version
            });
            const latestRemote = yield this.getLatestRemote({
                filter,
                download: false,
                version,
                verify
            });
            const latestHotLoaded = this.hotLoadedApp;
            const latest = this._getLatest([latestCached, latestHotLoaded, latestRemote]);
            if (latest && latest.remote && download) {
                const { downloadOptions } = options;
                const downloadResult = yield this.download(latest, downloadOptions);
                /*if (downloadResult && verify && !downloadResult.verificationResult) {
                  throw new Error(`Error: External package ${name} has no verification info.`)
                }*/
                return downloadResult;
            }
            return latest;
        });
    }
    _getLatest(_releases) {
        // remove null, undefined
        let releases = [..._releases].filter(this.notEmpty);
        if (releases.length <= 0) {
            return null;
        }
        releases = releases.sort(this.compareVersions);
        // handle the common case of remote and local  (cached)
        // having same version. in this case we want to always return cached
        if (releases.length > 1) {
            if (releases[0].version === releases[1].version) {
                if (releases[0].remote && !releases[1].remote) {
                    return releases[1];
                }
            }
        }
        // to determine from where the latest release comes use the repository tag on the release
        return releases[0];
    }
    download(release, { writePackageData = true, writeDetachedMetadata = true, targetDir = this.cache.cacheDirPath, onProgress = (progress, release) => { }, extractPackage = false, // ignored if not written to disk (writePackageData)
    onExtractionProgress = () => { }, } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let pp = 0;
            let _onProgress = (p) => {
                let pn = Math.floor(p * 100);
                if (pn > pp) {
                    pp = pn;
                    // console.log(`downloading update..  ${pn}%`)
                    this.emit('update-progress', release, pn);
                    if (onProgress) {
                        onProgress(pn, release);
                    }
                }
            };
            const packageData = yield this.remote.download(release, _onProgress);
            const location = path_1.default.join(targetDir, release.fileName);
            // verify package signature: TODO we can enforce a policy here that invalid
            // packages are not even written to disk
            // const pkg = await getEthpkg(packageData)
            // const verificationResult = await pkgsign.verify(pkg!)
            if (writePackageData) {
                if (writeDetachedMetadata) {
                    const detachedMetadataPath = path_1.default.join(targetDir, release.fileName + '.metadata.json');
                    fs_1.default.writeFileSync(detachedMetadataPath, JSON.stringify(release, null, 2));
                }
                // TODO patch package metadata if it doesn't exist
                // TODO write to .temp and rename to minimize risk of corrupted downloads
                fs_1.default.writeFileSync(location, packageData);
                let releaseDownloaded = Object.assign(Object.assign({}, release), { remote: false, location });
                if (extractPackage) {
                    const extractedPackagePath = yield this.extract(releaseDownloaded, onExtractionProgress);
                    releaseDownloaded.extractedPackagePath = extractedPackagePath;
                }
                this.emit('update-downloaded', release);
                return releaseDownloaded;
            }
            else {
                this.emit('update-downloaded', release);
                return Object.assign(Object.assign({}, release), { location: 'memory', remote: false, data: packageData });
            }
        });
    }
    load(pkgLocation) {
        return __awaiter(this, void 0, void 0, function* () {
            /*
            const module  = await ModuleRegistry.addFromFile(pkgLocation)
            const moduleId = ''
            const protocol = 'package:'
            const appUrl = url.format({
              slashes: true,
              protocol,
              pathname: `${moduleId}.mod/index.html`
            })
            return appUrl
            */
            return '';
        });
    }
    _generateUrlForCachedRelease(release) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO register release as hot-loaded release
            // generate stable / deterministic url: this is important for reliable local storage even if
            // same module is loaded from file or hosted location
            // this is also important to avoid collision attacks
            // wee also need to avoid that multiple packages access same storage as it would be the
            // case with github.com/owner/repo/moduleId/index.html
            const hostname = yield util_1.generateHostnameForRelease(release);
            const protocol = 'package:';
            const appUrl = url_1.default.format({
                slashes: true,
                protocol,
                pathname: `${hostname}/index.html`
            });
            return appUrl;
        });
    }
    static on(channel, cb) {
        if (channel === 'menu-available') {
            // ModuleRegistry.on('menu-available', cb)
        }
        else {
            throw new Error('unsupported event type: ' + channel);
        }
    }
    createMenuTemplate(onReload) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.menuBuilder.createMenuTemplate(onReload);
        });
    }
    updateMenuVersion(version) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.menuBuilder.updateMenuVersion(version);
        });
    }
    getLocalPackage(release) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache.getPackage(release);
        });
    }
    getEntries(release) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache.getEntries(release);
        });
    }
    getEntry(release, entryPath) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache.getEntry(release, entryPath);
        });
    }
    extract(release, onProgress) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.cache.extract(release, onProgress);
        });
    }
    static downloadJson(_url) {
        return __awaiter(this, void 0, void 0, function* () {
            return downloader_1.downloadJson(_url);
        });
    }
}
exports.default = AppManager;
