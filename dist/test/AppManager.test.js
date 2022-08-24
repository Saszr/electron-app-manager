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
const chai_1 = require("chai");
const AppManager_1 = __importDefault(require("../updater/AppManager"));
const nock_1 = __importDefault(require("nock"));
const fs_1 = __importDefault(require("fs"));
describe('App Manager', () => {
    const scope = nock_1.default('https://gethstore.blob.core.windows.net', { allowUnmocked: false })
        .persist()
        .head('/builds?restype=container&comp=list')
        .reply(200, 'ok')
        .persist() // don't remove interceptor after request -> always return mock obj
        .get('/builds?restype=container&comp=list')
        .reply(200, fs_1.default.readFileSync(__dirname + '/fixtures/azureReleases.xml'))
        .head('/builds/geth-alltools-windows-386-1.8.21-9dc5d1a9.zip').reply(200, 'ok')
        .get('/builds/geth-alltools-windows-386-1.8.21-9dc5d1a9.zip')
        .reply(200, fs_1.default.readFileSync(__dirname + '/fixtures/BinCache/geth-windows-amd64-1.8.20-24d727b6.exe'))
        //.reply(200, fs.readFileSync(__dirname+'/fixtures/BinCache/geth'))
        .head('/builds/geth-alltools-windows-386-1.8.21-9dc5d1a9.zip.asc').reply(200, 'ok')
        .get('/builds/geth-alltools-windows-386-1.8.21-9dc5d1a9.zip.asc')
        .reply(200, fs_1.default.readFileSync(__dirname + '/fixtures/geth-alltools-darwin-amd64-1.8.21-9dc5d1a9.tar.gz.asc'));
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
    const scope2 = nock_1.default("https://api.github.com", { allowUnmocked: true })
        .persist() // don't remove interceptor after request -> always return mock obj
        .get("/repos/ethereum/grid-ui/releases")
        .reply(200, shuffle(require('./fixtures/githubReleases1.json')));
    const cachePath = __dirname + '/fixtures/Cache/';
    describe('Releases', () => {
        it("combines and sorts cached and remote releases", function () {
            return __awaiter(this, void 0, void 0, function* () {
                const appManager = new AppManager_1.default({
                    repository: 'https://github.com/ethereum/grid-ui',
                    cacheDir: cachePath
                });
                let cached = yield appManager.getCachedReleases();
                chai_1.assert.equal(cached.length, 2);
                let remote = yield appManager.getRemoteReleases();
                chai_1.assert.equal(remote.length, 20);
                const releases = yield appManager.getReleases();
                // @ts-ignore
                const actualOrder = releases.map(r => r.version).join(',');
                chai_1.assert.equal(releases.length, 22);
                const expectedOrder = '0.1.19,0.1.19-alpha,0.1.19,0.1.10-alpha,0.1.9-alpha,0.1.9-alpha,0.1.9-alpha,0.1.9-alpha,0.1.9-alpha,0.1.9-alpha,0.1.9-alpha,0.1.9-alpha,0.1.9-alpha,0.1.9-alpha,0.1.5-alpha,0.1.3-alpha,0.1.3,0.1.2,0.1.2,0.1.1,0.1.0,0.1.0';
                chai_1.assert.equal(actualOrder, expectedOrder);
            });
        });
    });
    /*
    describe('Constructor', () => {
  
      it("detects the correct repo based on the given url", async function () {
        const githubUpdater = new AppManager({
          repository: 'https://github.com/ethereum/mist-ui'
        })
        assert.equal(githubUpdater.remote.name, 'Github')
    
        const azureUpdater = new AppManager({
          repository: 'https://gethstore.blob.core.windows.net/'
        })
        assert.equal(azureUpdater.remote.name, 'Azure')
      })
    
      it("throws an exception if the repo url is not supported", async function () {
        assert.throws(() => {
          const updater = new AppManager({
            repository: 'https://hitgub.com/ethereum/mist-ui'
          })
        })
      })
      
    })
  
    describe('Parser', () => {
  
      it("supports parser modifiers", async function () {
        const azureUpdater = new AppManager({
          repository: 'https://gethstore.blob.core.windows.net' + '/builds?restype=container&comp=list', // FIXME remove query params
          modifiers: {
            // @ts-ignore
            version: ({ version })  => version.split('-').slice(0, -1).join('-')
          },
          cacheDir: __dirname + '/fixtures/TestCache/'
        })
    
        const latest = await azureUpdater.getLatest()
        assert.equal(latest && latest.version, '1.8.21')
      })
      
    })
  
  
    describe('Cache', () => {
  
      it("finds the latest cached package", async function () {
        const azureUpdater = new AppManager({
          repository: 'https://gethstore.blob.core.windows.net/',
          cacheDir: __dirname + '/fixtures/PackageCache/'
        })
        const latest = await azureUpdater.getLatestCached()
        assert.equal(latest && latest.version, '0.1.19')
      })
  
    })
  
    describe('Web / Dev mode', () => {
  
      it("loads a web app by url in dev mode", async function () {
      
      })
  
    })
  
    describe('Downloader', () => {
  
      it("downloads the package if it isn't cached", async function () {
  
        const cachePath = __dirname + '/fixtures/TestCache/'
    
        const azureUpdater = new AppManager({
          repository: 'https://gethstore.blob.core.windows.net' + '/builds?restype=container&comp=list', // FIXME remove query params
          modifiers: {
            // @ts-ignore
            version: ({ version })  => version.split('-').slice(0, -1).join('-')
          },
          cacheDir: cachePath
        })
    
        const latest = await azureUpdater.getLatest()
    
        if(latest === null){
          throw new Error('latest should not be null')
        }
    
        assert.equal(latest.version, '1.8.21')
    
        await azureUpdater.download(latest)
    
        assert.isTrue(fs.existsSync(cachePath + latest.fileName))
    
      })
  
    })
    */
});
