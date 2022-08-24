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
const RepoBase_1 = __importDefault(require("../api/RepoBase"));
// @ts-ignore
const downloader_1 = require("../lib/downloader");
const semver_1 = __importDefault(require("semver"));
const rest_1 = require("@octokit/rest");
const path_1 = __importDefault(require("path"));
const util_1 = require("../util");
class Github extends RepoBase_1.default {
    constructor(repoUrl, options = {}) {
        super();
        this.name = 'Github';
        // WARNING: For unauthenticated requests, the rate limit allows for up to 60 requests per hour.
        if (process.env.GITHUB_TOKEN && typeof process.env.GITHUB_TOKEN === 'string') {
            this.client = new rest_1.Octokit({
                // @ts-ignore
                auth: process.env.GITHUB_TOKEN
            });
        }
        else {
            this.client = new rest_1.Octokit();
        }
        this.filter = options && options.filter;
        this.prefixFilter = options && options.prefix;
        this._repositoryUrl = repoUrl;
        let parts = repoUrl.split('/');
        let l = parts.length;
        this.owner = parts[l - 2];
        this.repo = parts[l - 1].replace('.git', '');
    }
    get repositoryUrl() {
        return this._repositoryUrl;
    }
    assetToRelease(asset, { releaseName, tag_name, branch, version, displayVersion, channel, isPrerelease }) {
        const { name: assetName, browser_download_url: assetUrl, size, download_count } = asset;
        const packageName = assetName && path_1.default.basename(assetName);
        const name = releaseName;
        const platform = util_1.extractPlatform(name);
        const arch = util_1.extractArchitecture(name);
        return {
            name,
            displayName: name,
            repository: this.repositoryUrl,
            fileName: assetName,
            commit: branch,
            publishedDate: new Date(),
            version,
            displayVersion,
            platform,
            arch,
            isPrerelease,
            channel,
            size,
            tag: tag_name,
            location: assetUrl,
            error: undefined,
            remote: true
        };
    }
    toRelease(releaseInfo) {
        const { 
        /*
        url,
        assets_url,
        html_url,
        upload_url,
        tarball_url,
        zipball_url,
        id,
        node_id,
        tag_name,
        target_commitish,
        name,
        body,
        draft,
        prerelease,
        created_at,
        published_at,
        author,
        assets,
        */
        // name : releaseName,
        tag_name, target_commitish: branch } = releaseInfo;
        const releaseName = this.repo; // use repo name as release name for stable origins
        const segments = tag_name.split('_');
        const versionTag = segments[0];
        const version = this.normalizeTag(versionTag);
        const displayVersion = util_1.simplifyVersion(version);
        const isPrerelease = releaseInfo.draft || releaseInfo.prerelease;
        if (!semver_1.default.valid(version)) {
            return [{
                    name: tag_name,
                    error: 'parse error / invalid version: ' + versionTag
                }];
        }
        const prereleaseInfo = semver_1.default.prerelease(version);
        const channel = prereleaseInfo ? prereleaseInfo[0] : 'dev';
        // let metadata = releaseInfo.assets.find(release => release.name === 'metadata.json')
        if (!releaseInfo.assets) {
            return [{
                    name: tag_name,
                    error: 'release does not contain any assets'
                }];
        }
        let { assets } = releaseInfo;
        if (this.prefixFilter !== undefined && assets) {
            // @ts-ignore
            assets = assets.filter(asset => asset.name.includes(this.prefixFilter));
        }
        assets = assets.filter((asset) => util_1.hasSupportedExtension(asset.name));
        if (assets.length <= 0) {
            return [{
                    name: tag_name,
                    error: 'release does not contain any app packages (.asar or .zip)'
                }];
        }
        let releases = assets.map((a) => this.assetToRelease(a, {
            releaseName,
            tag_name,
            branch,
            version,
            displayVersion,
            channel,
            isPrerelease
        }));
        if (this.filter) {
            // @ts-ignore
            releases = releases.filter(this.filter); // includes filter
        }
        // console.log('releases of assets', releases)
        return releases;
    }
    getMetadata(release) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const meta = yield downloader_1.downloadJson(`https://github.com/${this.owner}/${this.repo}/releases/download/${release.tag}/metadata.json`);
                if (meta.error) {
                    return null;
                }
                const { name, icon, md5, sha1, sha256, sha512 } = meta;
                return {
                    name,
                    icon,
                    md5,
                    sha1,
                    sha256,
                    sha512
                };
            }
            catch (error) {
                console.log('metadata download failed', error.message);
                return null;
            }
        });
    }
    extendWithMetadata(release) {
        return __awaiter(this, void 0, void 0, function* () {
            let meta = yield this.getMetadata(release);
            if (!meta) {
                return Object.assign({}, release);
            }
            // return *full release* info
            const { name, icon, md5, sha1, sha256, sha512 } = meta;
            return Object.assign(Object.assign({}, release), { 
                // overwrite with name from metadata for better quality
                name,
                icon, 
                // FIXME
                displayName: name, checksums: {
                    md5,
                    sha1,
                    sha256,
                    sha512
                } });
        });
    }
    /*
    async getChannels() {
      let releases = this.getReleases();
      let channelsAll = releases.map(release => release.channel);
      const channels = new Set(channelsAll);
      return channels;
    }
    */
    getReleases({ sort = true, filterInvalid = true, version } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // FIXME use pagination
            try {
                let releaseInfo = yield this.client.repos.listReleases({
                    owner: this.owner,
                    repo: this.repo
                });
                // convert to proper format
                let releases = releaseInfo.data.map(this.toRelease.bind(this)).reduce((prev, cur) => {
                    return prev.concat(cur);
                });
                if (version) {
                    // @ts-ignore
                    releases = releases.filter(release => semver_1.default.satisfies(semver_1.default.coerce(release.version).version, version));
                }
                // filter invalid releases
                if (filterInvalid) {
                    releases = releases.filter(util_1.isRelease);
                }
                // @ts-ignore generate test data
                // console.log('latest releases unsorted\n', releases.map(r => `{ version: '${r.version}', channel: '${r.channel}' }`).slice(0, 5).join(',\n'))
                return sort ? this.sortReleases(releases) : releases;
            }
            catch (error) {
                console.log('could not retrieve releases list from github', error.message);
                // FIXME handle API errors such as rate-limits
                return [];
            }
        });
    }
    getLatest(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // the latest uploaded release ( /latest api route ) is not necessarily the latest version
            // might only be a patch fix for previous version
            let releases = yield this.getReleases({
                version: options.version
            });
            if (releases.length <= 0) {
                return null;
            }
            let temp = releases[0];
            // is invalid release
            if (temp.error !== undefined) {
                return null;
            }
            let latest = temp;
            let release = yield this.extendWithMetadata(latest);
            if (release.error) {
                return null;
            }
            return release;
        });
    }
    download(release, onProgress = (progress) => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { location } = release;
            const data = yield downloader_1.download(location, onProgress);
            return data;
        });
    }
}
exports.default = Github;
