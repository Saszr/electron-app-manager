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
const downloader_1 = require("../lib/downloader");
const util_1 = require("../util");
const semver_1 = __importDefault(require("semver"));
const { extractVersion, parseXml } = require('../util');
const SUPPORTED_EXTENSIONS = ['.zip', '.tar.gz', '.tar'];
// https://docs.microsoft.com/en-us/rest/api/storageservices/blob-service-rest-api
class Azure extends RepoBase_1.default {
    constructor(repoUrl, options = {}) {
        super();
        this.name = 'Azure';
        const { prefix } = options;
        // FIXME check that only host name provided or parse
        this.repoUrl = repoUrl + '/builds?restype=container&comp=list' + (prefix ? `&prefix=${prefix}` : '');
        this.onReleaseParsed = options && options.onReleaseParsed;
        this.filter = options && options.filter;
        this.toRelease = this.toRelease.bind(this);
    }
    get repositoryUrl() {
        return this.repoUrl;
    }
    toRelease(releaseInfo) {
        /* unhandled:
          'Content-Encoding': [ '' ],
          'Content-Language': [ '' ],
          'Cache-Control': [ '' ],
          'Content-Disposition': [ '' ],
          'BlobType': [ 'BlockBlob' ],
          'LeaseStatus': [ 'unlocked' ],
          'LeaseState': [ 'available' ]
        */
        const fileName = releaseInfo.Name[0];
        let ext = util_1.getExtension(fileName);
        const name = fileName.slice(0, -ext.length);
        const Properties = releaseInfo.Properties[0];
        const lastModified = Properties['Last-Modified'][0];
        const etag = Properties['Etag'][0];
        const size = Properties['Content-Length'][0];
        const contentType = Properties['Content-Type'][0];
        const md5 = Properties['Content-MD5'][0];
        const version = semver_1.default.clean(extractVersion(name) || '') || '';
        const displayVersion = util_1.simplifyVersion(version);
        const platform = util_1.extractPlatform(name);
        const arch = util_1.extractArchitecture(name);
        let _release = {};
        // give client the chance to define their own parser
        if (this.onReleaseParsed) {
            _release = this.onReleaseParsed({
                name,
                fileName,
                version,
                size,
                lastModified,
                contentType
            });
        }
        let md5AtoB = Buffer.from(md5, 'base64').toString('binary');
        md5AtoB = md5AtoB.split('').map(char => ('0' + char.charCodeAt(0).toString(16)).slice(-2)).join('');
        if (version === '') {
            // console.log('bad format: ', name)
        }
        // FIXME use url parser
        let baseUrl = this.repoUrl.split("?").shift();
        const location = `${baseUrl}/${fileName}`;
        let release = Object.assign(Object.assign({ name,
            fileName,
            version,
            displayVersion,
            platform,
            arch, tag: version, commit: undefined, size, channel: undefined, location: location, error: undefined, checksums: {
                md5: md5AtoB
            } }, _release), { remote: true });
        return release;
    }
    getReleases({ sort = true, filterInvalid = true, version } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.time('download')
            let result = yield downloader_1.download(this.repoUrl);
            // console.timeEnd('download') // 1502.350ms
            // console.time('parse')
            let parsed;
            try {
                parsed = yield parseXml(result);
            }
            catch (error) {
                console.log('error: release feed could not be parsed: ', result);
                return [];
            }
            // console.timeEnd('parse') // 93.232ms
            const blobs = parsed.EnumerationResults.Blobs[0].Blob;
            if (!blobs) {
                return [];
            }
            // console.time('convert')
            let releases = blobs.map(this.toRelease);
            // console.timeEnd('convert') // 11.369ms
            // scan to create client specific mapping ansd filter
            let mapping = {};
            const packages = [];
            releases.forEach((release) => {
                let { fileName, version } = release;
                let isExtensionSupported = util_1.hasSupportedExtension(fileName);
                if (fileName && fileName.endsWith('.asc')) {
                    mapping[fileName] = release;
                }
                else if (isExtensionSupported && version) {
                    // TODO client-defined filter
                    if (this.filter) {
                        if (this.filter(release)) {
                            packages.push(release);
                        }
                    }
                    else {
                        packages.push(release);
                    }
                }
                else {
                    // console.log('ignored', fileName)
                }
            });
            // 2nd iteration to apply mapping
            // console.log('mapping', mapping)
            packages.forEach((release) => {
                // construct lookup key
                const k = release.fileName + '.asc';
                if (mapping[k]) {
                    release.signature = mapping[k].location;
                }
            });
            // filter invalid versions
            if (version) {
                // @ts-ignore
                releases = releases.filter(release => semver_1.default.satisfies(semver_1.default.coerce(release.version).version, version));
            }
            /*
            signatures.forEach(signature => { });
            const packages = releases
            .filter((release : any) => ! (release.fileName.endsWith('.asc') || release.fileName.includes('unstable')))
            .filter((release : any) => release.fileName.endsWith('.zip') && release.version )
            */
            // console.log('filtered', packages.map(r => r.version))
            let sorted = packages.sort(this.compareVersions);
            return sorted;
        });
    }
    getLatest(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let releases = yield this.getReleases({
                version: options.version
            });
            if (releases.length <= 0) {
                return null;
            }
            const release = releases[0];
            if (release.signature) {
                const signatureData = yield downloader_1.download(release.signature);
                if (signatureData) {
                    release.signature = signatureData.toString();
                }
            }
            return release;
        });
    }
    download(release, onProgress = (progress) => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { location } = release;
            let data = yield downloader_1.download(location, onProgress);
            return data;
        });
    }
}
exports.default = Azure;
