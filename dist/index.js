"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPackageProtocol = void 0;
const CustomProtocols_1 = require("./updater/lib/CustomProtocols");
var AppManager_1 = require("./updater/AppManager");
Object.defineProperty(exports, "AppManager", { enumerable: true, get: function () { return AppManager_1.default; } });
__exportStar(require("./updater/lib/downloader"), exports);
exports.registerPackageProtocol = (cacheDir) => {
    const { protocol, app } = require('electron');
    /**
     // https://github.com/electron/electron/blob/master/docs/api/protocol.md
      By default web storage apis (localStorage, sessionStorage, webSQL, indexedDB, cookies) are disabled
      for non standard schemes.
      So in general if you want to register a custom protocol to replace the http protocol,
      you have to register it as a standard scheme.
      -> needs to be registered before app.onReady
    */
    // @ts-ignore
    if (protocol.registerStandardSchemes && typeof protocol.registerStandardSchemes === 'function') {
        // @ts-ignore
        protocol.registerStandardSchemes(['package'], { secure: true });
    }
    else {
        protocol.registerSchemesAsPrivileged([
            { scheme: 'package', privileges: { standard: true, secure: true, supportFetchAPI: true } }
        ]);
    }
    CustomProtocols_1.registerHotLoadProtocol(cacheDir);
};
