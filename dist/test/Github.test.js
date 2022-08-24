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
const Github_1 = __importDefault(require("../updater/repositories/Github"));
const chai_1 = require("chai");
const nock_1 = __importDefault(require("nock"));
describe('Github', () => {
    /**
     * Shuffles array in place.
     * @param {Array} a items An array containing the items.
     */
    function shuffle(a) {
        var j, x, i;
        for (i = a.length - 1; i > 0; i--) {
            j = Math.floor(Math.random() * (i + 1));
            x = a[i];
            a[i] = a[j];
            a[j] = x;
        }
        return a;
    }
    const scope = nock_1.default("https://api.github.com", { allowUnmocked: true })
        .persist() // don't remove interceptor after request -> always return mock obj
        .get("/repos/ethereum/mist-ui/releases")
        .reply(200, shuffle(require('./fixtures/githubReleases1.json')));
    const scope2 = nock_1.default("https://github.com", { allowUnmocked: true })
        .persist()
        .head("/ethereum/mist-ui/releases/download/v0.1.19-alpha_1544698606/metadata.json")
        .reply(200, 'ok')
        .persist()
        .get("/ethereum/mist-ui/releases/download/v0.1.19-alpha_1544698606/metadata.json")
        .reply(200, require('./fixtures/metadata.json'));
    const repo = "https://github.com/ethereum/mist-ui";
    const githubRepo = new Github_1.default(repo);
    describe('getReleases()', () => {
        it('returns all the releases from Github API', () => __awaiter(void 0, void 0, void 0, function* () {
            let releases = yield githubRepo.getReleases();
            chai_1.assert.equal(releases.length, 21);
        }));
        it('sorts releases using semver and return them descending (latest first)', () => __awaiter(void 0, void 0, void 0, function* () {
            // releases are returned in a shuffled order by the mock server
            let releases = yield githubRepo.getReleases();
            let sortedVersions = '0.1.19-alpha, 0.1.10-alpha, 0.1.9-alpha, 0.1.9-alpha, 0.1.9-alpha, 0.1.9-alpha, 0.1.9-alpha, 0.1.9-alpha, 0.1.9-alpha, 0.1.9-alpha, 0.1.9-alpha, 0.1.9-alpha, 0.1.5-alpha, 0.1.3, 0.1.3-alpha, 0.1.2, 0.1.2, 0.1.1, 0.1.0, 0.1.0, no version';
            let versions = releases.map((r) => r.version || 'no version').join(', ');
            chai_1.assert.equal(versions, sortedVersions);
        }));
        it.skip("handles pagination", function () {
            return __awaiter(this, void 0, void 0, function* () {
            });
        });
    });
    describe('getLatest()', () => {
        it('returns only the latest ReleaseInfo from Github API', () => __awaiter(void 0, void 0, void 0, function* () {
            let release = yield githubRepo.getLatest();
            chai_1.assert.equal(release.version, '0.1.19-alpha');
        }));
        it('returns ReleaseInfoExtended if detached metadata.json present in assets', () => __awaiter(void 0, void 0, void 0, function* () {
            let release = yield githubRepo.getLatest();
            const sha512 = '047bb4e33fb42e953db1978eb1b320fb4615d6dacb9ae0369179c15eb3ed37fe5b6a0030c35abf1738ffac9e0417e63771c189f2ac690cc3f5259daa222b4390';
            chai_1.assert.equal(release.checksums.sha512, sha512);
        }));
        it('handles deleted or non-existent repos', () => __awaiter(void 0, void 0, void 0, function* () {
            const repo = "https://github.com/foo/bazbaz";
            const badGithubRepo = new Github_1.default(repo);
            const latest = badGithubRepo.getLatest();
            chai_1.assert.property(latest, 'error');
        }));
        it('handles moved repos', () => __awaiter(void 0, void 0, void 0, function* () {
        }));
    });
    describe('getVersion(version : string)', () => {
        it.skip('returns the ReleaseInfo for the specified version', () => __awaiter(void 0, void 0, void 0, function* () {
        }));
    });
    describe('getMetadata(IReleaseInfo release)', () => {
        it('returns the (detached | included | hosted) IMetadata for a given IReleaseInfo', () => __awaiter(void 0, void 0, void 0, function* () {
            let releases = yield githubRepo.getReleases();
            let latest = releases[0];
            let meta = yield githubRepo.getMetadata(latest);
            if (meta === null)
                throw new Error('metadata is null');
            const sha512 = '047bb4e33fb42e953db1978eb1b320fb4615d6dacb9ae0369179c15eb3ed37fe5b6a0030c35abf1738ffac9e0417e63771c189f2ac690cc3f5259daa222b4390';
            chai_1.assert.equal(meta.sha512, sha512);
        }));
    });
    describe('download(IReleaseInfo release)', () => {
        it.skip('downloads the package for a given ReleaseInfo', () => __awaiter(void 0, void 0, void 0, function* () {
        }));
    });
});
