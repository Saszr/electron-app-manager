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
const path_1 = __importDefault(require("path"));
const chai_1 = require("chai");
const Cache_1 = __importDefault(require("../updater/repositories/Cache"));
describe('Cache', () => {
    const packageCacheDir = path_1.default.join(__dirname, 'fixtures', 'PackageCache');
    const detachedCacheDir = path_1.default.join(__dirname, 'fixtures', 'DetachedCache');
    describe('getReleases()', () => {
        it('returns all the releases from Cache directory on fs', () => __awaiter(void 0, void 0, void 0, function* () {
            const cache = new Cache_1.default(packageCacheDir);
            const releases = yield cache.getReleases();
            chai_1.assert.equal(releases.length, 1);
        }));
        it('detects detached metadata and parses it', () => __awaiter(void 0, void 0, void 0, function* () {
            const cache = new Cache_1.default(detachedCacheDir);
            const releases = yield cache.getReleases();
            const release = releases[0];
            // console.log('release', release)
            chai_1.assert.equal(release.checksums.md5, "c2ada7c395e8552c654ea89dfaa20def");
        }));
        it('detects embedded metadata and parses it', () => __awaiter(void 0, void 0, void 0, function* () {
            const cache = new Cache_1.default(detachedCacheDir);
            const releases = yield cache.getReleases();
            const release = releases[0];
            // console.log('release', release)
            chai_1.assert.equal(release.checksums.md5, "c2ada7c395e8552c654ea89dfaa20def");
        }));
        it.skip('finds metadata in zip files', () => __awaiter(void 0, void 0, void 0, function* () {
        }));
        it.skip('finds metadata in asar files', () => __awaiter(void 0, void 0, void 0, function* () {
        }));
        it('validates packages based on metadata', () => __awaiter(void 0, void 0, void 0, function* () {
            chai_1.assert.isTrue(false);
        }));
        it.skip('sorts releases using semver and return them descending (latest first)', () => __awaiter(void 0, void 0, void 0, function* () {
        }));
        it.skip("searches all paths when provided with the paths[] option", function () {
            return __awaiter(this, void 0, void 0, function* () {
            });
        });
    });
    describe('getLatest()', () => {
        it('returns only the latest ReleaseInfo from cache directory', () => __awaiter(void 0, void 0, void 0, function* () {
            const cache = new Cache_1.default(packageCacheDir);
            let release = yield cache.getLatest();
            chai_1.assert.equal(release.version, '0.1.19');
        }));
        it.skip('respects user settings for the latest package', () => __awaiter(void 0, void 0, void 0, function* () {
        }));
    });
});
