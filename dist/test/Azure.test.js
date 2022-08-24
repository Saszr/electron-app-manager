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
const fs_1 = __importDefault(require("fs"));
const chai_1 = require("chai");
const Azure_1 = __importDefault(require("../updater/repositories/Azure"));
const nock_1 = __importDefault(require("nock"));
describe.skip('Azure', () => {
    const repoUrl = 'https://gethstore.blob.core.windows.net/builds?restype=container&comp=list';
    const scope = nock_1.default('https://gethstore.blob.core.windows.net', { allowUnmocked: false })
        .persist()
        .head('/builds?restype=container&comp=list')
        .reply(200, 'ok')
        .persist() // don't remove interceptor after request -> always return mock obj
        .get('/builds?restype=container&comp=list')
        .reply(200, fs_1.default.readFileSync(__dirname + '/fixtures/azureReleases.xml'))
        .head('/builds/geth-alltools-windows-386-1.8.21-9dc5d1a9.zip').reply(200, 'ok')
        .get('/builds/geth-alltools-windows-386-1.8.21-9dc5d1a9.zip')
        .reply(200, fs_1.default.readFileSync(__dirname + '/fixtures/BinCache/geth'))
        .head('/builds/geth-alltools-windows-386-1.8.21-9dc5d1a9.zip.asc').reply(200, 'ok')
        .get('/builds/geth-alltools-windows-386-1.8.21-9dc5d1a9.zip.asc')
        .reply(200, fs_1.default.readFileSync(__dirname + '/fixtures/geth-alltools-darwin-amd64-1.8.21-9dc5d1a9.tar.gz.asc'));
    const releaseModifier = (release) => {
        // remove commit id from version:
        const version = release.version.split('-').slice(0, -1).join('-');
        // return only values here that should be overwritten
        return {
            version
        };
    };
    describe('getReleases()', () => {
        it('returns all the releases from Azure API', () => __awaiter(void 0, void 0, void 0, function* () {
            const azure = new Azure_1.default(repoUrl);
            const releases = yield azure.getReleases();
            chai_1.assert.equal(releases.length, 194);
        }));
        it.skip('sorts releases using semver and return them descending (latest first)', () => __awaiter(void 0, void 0, void 0, function* () {
            const azure = new Azure_1.default(repoUrl);
            const releases = yield azure.getReleases();
            let names = releases.map(rel => rel.name).join('\n');
        }));
        it('merges detached metadata urls into metadata fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const azure = new Azure_1.default(repoUrl);
            const releases = yield azure.getReleases();
            let release = releases[10];
            chai_1.assert.equal(release.signature, 'https://gethstore.blob.core.windows.net/builds/geth-windows-386-1.8.19-dae82f09.zip.asc');
        }));
    });
    describe('getLatest()', () => {
        it('returns only the latest ReleaseInfo from Azure API', () => __awaiter(void 0, void 0, void 0, function* () {
            const azure = new Azure_1.default(repoUrl);
            let release = yield azure.getLatest();
            chai_1.assert.equal(release.version, '1.8.21-9dc5d1a9');
        }));
        it('applies a modifier to overwrite release-parser defaults', () => __awaiter(void 0, void 0, void 0, function* () {
            const azure = new Azure_1.default(repoUrl, {
                onReleaseParsed: releaseModifier
            });
            let release = yield azure.getLatest();
            chai_1.assert.equal(release.version, '1.8.21');
        }));
        it('merges detached metadata content into metadata fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const azure = new Azure_1.default(repoUrl, {
                onReleaseParsed: releaseModifier
            });
            let release = yield azure.getLatest();
            chai_1.assert.equal(release.signature, fs_1.default.readFileSync(__dirname + '/fixtures/geth-alltools-darwin-amd64-1.8.21-9dc5d1a9.tar.gz.asc', 'utf8'));
        }));
    });
    describe('download()', () => {
        it('downloads the release', function () {
            return __awaiter(this, void 0, void 0, function* () {
                const azure = new Azure_1.default(repoUrl, {
                    onReleaseParsed: releaseModifier
                });
                let release = yield azure.getLatest();
                let bin = yield azure.download(release);
                chai_1.assert.equal(bin.length, release.size);
            });
        });
    });
});
