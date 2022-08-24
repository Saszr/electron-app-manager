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
exports.generateHostnameForRelease = exports.memoize = exports.findWebContentsByTitle = exports.isPackaged = exports.isElectron = exports.getEthpkg = exports.isRelease = exports.hasSupportedExtension = exports.getExtension = exports.isUrl = exports.compareVersions = exports.simplifyVersion = exports.extractArchitecture = exports.extractPlatform = exports.extractVersion = exports.parseXml = void 0;
const path_1 = __importDefault(require("path"));
// @ts-ignore
const xml2js_1 = require("xml2js");
const ethpkg_1 = require("ethpkg");
const downloader_1 = require("./lib/downloader");
const semver_1 = __importDefault(require("semver"));
const hashes_1 = require("./lib/hashes");
function parseXml(xml) {
    return new Promise((resolve, reject) => {
        xml2js_1.parseString(xml, (err, result) => {
            if (err)
                return reject(err);
            resolve(result);
        });
    });
}
exports.parseXml = parseXml;
const semverMatcher = /\bv?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[\da-z-]+(?:\.[\da-z-]+)*)?(?:\+[\da-z-]+(?:\.[\da-z-]+)*)?\b/ig;
// https://github.com/sindresorhus/semver-regex
function extractVersion(str) {
    semverMatcher.lastIndex = 0;
    let result = semverMatcher.exec(str);
    return result && result.length > 0 ? result[0] : undefined;
}
exports.extractVersion = extractVersion;
// heuristic to extract platform (display) name
function extractPlatform(str) {
    str = str.toLowerCase();
    if (str.includes('win32') || str.includes('windows')) {
        return 'windows';
    }
    if (str.includes('darwin') || str.includes('mac') || str.includes('macos')) {
        return 'mac';
    }
    if (str.includes('linux')) {
        return 'linux';
    }
    return undefined;
}
exports.extractPlatform = extractPlatform;
/*
* https://askubuntu.com/questions/54296/difference-between-the-i386-download-and-the-amd64
* amd64 and intel64 are compatible
* TODO but we might want to distinguish arm chips etc
* https://en.wikipedia.org/wiki/ARM_architecture#Cores
*/
const ARCH = {
    'ARM32': '32 Bit',
    // all arm are 32 since ARMv8-A they are 64/32
    'ARM64': '64 Bit',
    'B32': '32 Bit',
    // TODO use this notation?
    'B3264': '32/64 Bit',
    'B64': '64 Bit'
};
// heuristic to extract platform architecture (display) name
function extractArchitecture(str) {
    try {
        // FIXME remove extension first
        str = str.toLowerCase();
        let name = str;
        // FIXME this heuristic wil fail for binaries with names like winrar
        // FIXME we can probably re-use the result from extractPlatform here for perf
        let isWindows = name.includes('windows') || name.includes('win');
        const parts = str.split(/[\s_-]+/);
        for (str of parts) {
            if (isWindows) {
                if (str.includes('386')) {
                    return ARCH.B32;
                }
                if (str.includes('amd64')) {
                    return ARCH.B64;
                }
                if (str.includes('win32')) {
                    return ARCH.B32;
                }
            }
            if (str.includes('x86-64')) {
                return ARCH.B64;
            }
            if (str.includes('x86')) {
                return ARCH.B32;
            }
            if (str.includes('ia32')) {
                return ARCH.B32;
            }
            if (str === 'arm64') {
                return ARCH.ARM64;
            }
            if (str === 'amd64') {
                return ARCH.ARM64;
            }
            if (str === 'arm') {
                return ARCH.ARM32;
            }
        }
        return undefined;
    }
    catch (error) {
        return undefined;
    }
}
exports.extractArchitecture = extractArchitecture;
// 0.4.4-Unstable-0bc45194 -> v0.4.4
function simplifyVersion(str) {
    var n = str.indexOf('-');
    str = str.substring(0, n != -1 ? n : str.length);
    return `v${str}`;
}
exports.simplifyVersion = simplifyVersion;
const REALEASE_CHANNEL = {
    dev: -1,
    ci: -1,
    alpha: 0,
    beta: 1,
    nightly: 2,
    production: 3,
    master: 4,
    release: 4,
};
exports.compareVersions = (a, b) => {
    if (!('version' in a) || !a.version)
        return -1;
    if (!('version' in b) || !b.version)
        return 1;
    // don't let semver apply its "channel logic": 
    // coerce to apply custom channel logic on same versions (same before "-channel")
    let av = semver_1.default.coerce(a.version);
    let bv = semver_1.default.coerce(b.version);
    // @ts-ignore
    const semComp = semver_1.default.compare(bv, av);
    if (semComp === 0) {
        const channelA = REALEASE_CHANNEL[a.channel || ''];
        const channelB = REALEASE_CHANNEL[b.channel || ''];
        if (channelA === undefined)
            return -1;
        if (channelB === undefined)
            return 1;
        if (channelA > channelB)
            return -1;
        if (channelB > channelA)
            return 1;
        return 0;
    }
    return semComp;
};
function isUrl(str) {
    var urlRegex = '^(?!mailto:)(?:(?:http|https|ftp)://)(?:\\S+(?::\\S*)?@)?(?:(?:(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}(?:\\.(?:[0-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))|(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*(?:\\.(?:[a-z\\u00a1-\\uffff]{2,})))|localhost)(?::\\d{2,5})?(?:(/|\\?|#)[^\\s]*)?$';
    var url = new RegExp(urlRegex, 'i');
    return str.length < 2083 && url.test(str);
}
exports.isUrl = isUrl;
const SUPPORTED_EXTENSIONS = ['.zip', '.tar.gz', '.tgz', '.tar'];
// this helper is especially used to support .tar.gz
exports.getExtension = (fileName) => {
    for (let i = 0; i < SUPPORTED_EXTENSIONS.length; i++) {
        const ext = SUPPORTED_EXTENSIONS[i];
        if (fileName.endsWith(ext)) {
            return ext;
        }
    }
    return path_1.default.extname(fileName);
};
function hasSupportedExtension(fileName) {
    const ext = exports.getExtension(fileName);
    return SUPPORTED_EXTENSIONS.includes(ext);
}
exports.hasSupportedExtension = hasSupportedExtension;
exports.isRelease = (value) => {
    return value !== null && value !== undefined && !value.error && value.version;
};
exports.getEthpkg = (app) => __awaiter(void 0, void 0, void 0, function* () {
    let pkg;
    if (Buffer.isBuffer(app)) {
        return ethpkg_1.pkgsign.loadPackage(app);
    }
    else if (typeof app === 'string') {
        if (isUrl(app)) {
            const appBuf = yield downloader_1.download(app);
            return ethpkg_1.pkgsign.loadPackage(appBuf);
        }
        else {
            return ethpkg_1.pkgsign.loadPackage(app);
        }
    }
    else if (exports.isRelease(app)) {
        // TODO if local
        return ethpkg_1.pkgsign.loadPackage(app.location);
    }
    else {
        throw new Error('unsupported package format');
    }
});
exports.isElectron = () => {
    // Renderer process
    // @ts-ignore
    if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
        return true;
    }
    // Main process
    // @ts-ignore Property 'electron' does not exist on type 'ProcessVersions'
    if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
        return true;
    }
    // Detect the user agent when the `nodeIntegration` option is set to true
    if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
        return true;
    }
    return false;
};
exports.isPackaged = () => {
    try {
        const electron = require('electron');
        const app = electron.app || electron.remote.app;
        return app.isPackaged;
    }
    catch (error) {
        return false;
    }
};
exports.findWebContentsByTitle = (windowTitle) => new Promise((resolve, reject) => {
    const { webContents } = require('electron');
    let _webContents = webContents.getAllWebContents();
    const assignListeners = (fun) => {
        _webContents.forEach((w) => {
            w.on('page-title-updated', fun);
        });
    };
    const removeListeners = (fun) => {
        _webContents.forEach((w) => {
            w.removeListener('page-title-updated', fun);
        });
    };
    const rendererDetection = function ({ sender: webContents }, title) {
        if (title === windowTitle) {
            // found the webContents instance that is rendering the splash:
            removeListeners(rendererDetection);
            resolve(webContents);
        }
    };
    // we assign a listener to each webcontent to detect where the title changes
    assignListeners(rendererDetection);
});
// TODO implement expiration
// TODO implement persistence
exports.memoize = (fn) => {
    let cache = {};
    return (...args) => __awaiter(void 0, void 0, void 0, function* () {
        const n = hashes_1.md5(JSON.stringify(args));
        if (n in cache) {
            return cache[n];
        }
        else {
            let result = undefined;
            try {
                result = yield fn(...args);
            }
            catch (error) {
                console.log('error in memoize', error);
                throw error;
            }
            cache[n] = result;
            return result;
        }
    });
};
exports.generateHostnameForRelease = (release) => __awaiter(void 0, void 0, void 0, function* () {
    // TODO construct stable uid independent of version number and release origin (e.g. github, cache)
    // construct mId based on package metadata not based on backend strategy
    // const pkg = await this.getLocalPackage(release)
    // const metadata = await pkg.getMetadata()
    // const { name } = metadata
    const { name } = release;
    // this should only be done for signed packages
    // name is the only property that stays fix however it is a very weak way
    // to generate the id since packages are not registered centrally
    const host = hashes_1.md5(name); // hash to eliminate special chars
    return `${host}.mod`;
});
