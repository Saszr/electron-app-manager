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
const downloader_1 = require("../lib/downloader");
const RepoBase_1 = __importDefault(require("../api/RepoBase"));
class Bintray extends RepoBase_1.default {
    constructor(repoUrl, options = {}) {
        super();
        this.name = 'bintray';
        this.filter = options && options.filter;
        const parts = repoUrl.split('/');
        this.packageName = parts.pop();
        this.repoName = parts.pop();
        this.subject = parts.pop();
        // this.repositoryUrl = 'https://api.bintray.com/packages/consensys/pegasys-repo/pantheon/files'
        this.repositoryUrl = `https://api.bintray.com/packages/${this.subject}/${this.repoName}/${this.packageName}`;
    }
    toRelease(pkgInfo) {
        const { name, // 'pantheon-0.8.2.tar.gz'
        // path, // 'pantheon-0.8.2.tar.gz'
        // repo, // pegasys-repo
        // package, // pantheon
        version, 
        // owner, // consensys
        created, size, sha1, sha256 } = pkgInfo;
        const displayName = name;
        const fileName = name;
        const commit = undefined;
        const publishedDate = Date.parse(created);
        const tag_name = version;
        const displayVersion = version;
        const platform = 'Java VM'; // FIXME
        const arch = '64 Bit'; // FIXME
        const isPrerelease = false;
        const channel = undefined;
        const location = `https://bintray.com/${this.subject}/${this.repoName}/download_file?file_path=${fileName}`;
        return {
            name,
            displayName: name,
            repository: this.repositoryUrl,
            fileName,
            commit,
            publishedDate,
            version,
            displayVersion,
            platform,
            arch,
            isPrerelease,
            channel,
            size,
            tag: tag_name,
            location,
            checksums: {
                sha1,
                sha256
            },
            error: undefined,
            remote: true
        };
    }
    getReleases(options) {
        return __awaiter(this, void 0, void 0, function* () {
            // https://bintray.com/docs/api/#_get_package_files does not seem to have prefix option
            const infoUrl = `https://api.bintray.com/packages/${this.subject}/${this.repoName}/${this.packageName}/files`;
            const packageInfo = yield downloader_1.downloadJson(infoUrl);
            let releases = packageInfo
                // FIXME hardcoded filter
                .filter((p) => !p.path.startsWith('tech'))
                .map(this.toRelease.bind(this));
            if (this.filter) {
                releases = releases.filter(this.filter);
            }
            // map signatures to releases
            releases = releases.filter((r) => !r.fileName.endsWith('.asc'));
            // console.log('package info', releases)
            return releases;
        });
    }
    getLatest(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const releases = yield this.getReleases(options);
            // @ts-ignore
            return releases[0];
        });
    }
    download(release, onProgress = (progress) => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { location } = release;
            console.log('download file from', location);
            try {
                const data = yield downloader_1.download(location, onProgress);
                return data;
            }
            catch (error) {
                console.log('error during download', error);
            }
            return Buffer.from('');
        });
    }
}
exports.default = Bintray;
