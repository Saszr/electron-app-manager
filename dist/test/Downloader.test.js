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
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const downloader_1 = require("../updater/lib/downloader");
describe('Downloader', function () {
    this.timeout(120 * 1000);
    it.skip('throws on 404', () => __awaiter(this, void 0, void 0, function* () {
        const onProgress = (progress) => { };
        const result = yield downloader_1.download('https://httpstat.us/404', onProgress);
        console.log('result', result);
        chai_1.assert.equal(1, 1);
    }));
    it('downloads from bintray', () => __awaiter(this, void 0, void 0, function* () {
        console.time('download time');
        const onProgress = (progress) => {
            // console.log('progress', progress)
        };
        const location = 'https://bintray.com/consensys/pegasys-repo/download_file?file_path=pantheon-1.1.4.tar.gz';
        const result = yield downloader_1.download(location, onProgress, 0, {
            parallel: 0
        });
        console.timeEnd('download time');
        chai_1.assert.equal(result.length, 35104796);
    }));
});
