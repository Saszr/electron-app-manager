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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const semver_1 = __importDefault(require("semver"));
const AppPackage_1 = __importDefault(require("../AppPackage"));
const util_1 = require("../util");
// for different caching strategies see
// https://serviceworke.rs/caching-strategies.html
class Cache extends RepoBase_1.default {
    constructor(cacheDirPath) {
        super();
        this.name = 'Cache';
        this.cacheDirPath = cacheDirPath;
        if (!fs_1.default.existsSync(cacheDirPath)) {
            fs_1.default.mkdirSync(cacheDirPath, {
                recursive: true
            });
        }
        this.getPackageCached = util_1.memoize(this.getPackage.bind(this));
    }
    clear() {
        return __awaiter(this, void 0, void 0, function* () {
            const files = fs_1.default.readdirSync(this.cacheDirPath);
            for (const file of files) {
                fs_1.default.unlinkSync(path_1.default.join(this.cacheDirPath, file));
            }
        });
    }
    toRelease(fileName) {
        return __awaiter(this, void 0, void 0, function* () {
            const name = path_1.default.parse(fileName).name;
            const location = path_1.default.join(this.cacheDirPath, fileName);
            if (!util_1.hasSupportedExtension(fileName)) {
                return {
                    name,
                    error: 'Unsupported package extension: ' + fileName
                };
            }
            let release = {
                // FIX: name must not be a different one across remote / local strategies
                // in order to have stable generated origins
                // name,
                fileName,
                location
            };
            let appPackage;
            try {
                appPackage = yield this.getPackageCached(release);
            }
            catch (error) {
                console.log('error in cached package', error);
                return {
                    name,
                    error
                };
            }
            if (appPackage === undefined) {
                return {
                    name,
                    error: new Error('Could not parse package ' + release.location)
                };
            }
            const metadata = yield appPackage.getMetadata();
            if (!metadata) {
                console.log('package has no metadata', fileName);
                return {
                    name,
                    error: 'No metadata: ' + fileName
                };
            }
            // const verificationResult = await appPackage.verify()
            if (metadata.signature) {
                //console.log('signature found', release.signature)
                //let result = await verifyPGP(binFileName, pubKeyBuildServer, metadata.signature)
                //console.log('is sig ok?', result)
            }
            const extractedPackagePath = fs_1.default.existsSync(appPackage.extractedPackagePath) ? appPackage.extractedPackagePath : undefined;
            // console.log('metadata', metadata)
            // order is important or location e.g. would be url
            release = Object.assign(Object.assign(Object.assign({}, metadata), release), { extractedPackagePath, 
                /// verificationResult,
                remote: false });
            return release;
        });
    }
    getReleases({ sort = true, version = undefined } = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let files = fs_1.default.readdirSync(this.cacheDirPath);
            files = files.filter(util_1.hasSupportedExtension);
            const filesFound = files && files.length > 0;
            if (!filesFound) {
                return [];
            }
            let releases = files.map((file) => __awaiter(this, void 0, void 0, function* () { return this.toRelease(file); }));
            releases = yield Promise.all(releases);
            if (version) {
                // @ts-ignore
                releases = releases.filter(release => semver_1.default.satisfies(semver_1.default.coerce(release.version).version, version));
            }
            let faulty = releases.filter(release => ('error' in release));
            if (faulty && faulty.length > 0) {
                console.log(`detected ${faulty.length} corrupted releases in cache`);
            }
            releases = releases.filter(release => !('error' in release));
            // @ts-ignore
            return sort ? releases.sort(this.compareVersions) : releases;
        });
    }
    getLatest(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            let releases = yield this.getReleases({
                version: options.version
            });
            const filtered = releases.filter(r => !('error' in r));
            if (filtered.length === 0) {
                return null;
            }
            filtered[0].repository = 'Cache';
            return filtered[0];
        });
    }
    getPackage(release) {
        return __awaiter(this, void 0, void 0, function* () {
            console.time('load ' + release.location);
            const appPackage = yield new AppPackage_1.default(release.location).init();
            console.timeEnd('load ' + release.location);
            return appPackage;
        });
    }
    getEntries(release) {
        return __awaiter(this, void 0, void 0, function* () {
            const appPackage = yield this.getPackageCached(release);
            return appPackage.getEntries();
        });
    }
    getEntry(release, entryPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const appPackage = yield this.getPackageCached(release);
            return appPackage.getEntry(entryPath);
        });
    }
    extract(release, onProgress) {
        return __awaiter(this, void 0, void 0, function* () {
            const appPackage = yield this.getPackageCached(release);
            return appPackage.extract(onProgress);
        });
    }
}
exports.default = Cache;
