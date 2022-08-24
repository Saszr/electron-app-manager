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
const util_1 = require("../updater/util");
const chai_1 = require("chai");
describe('Utils', () => {
    it('sorts releases', () => __awaiter(void 0, void 0, void 0, function* () {
        let releases = [
            { version: '1.0.0-alpha', channel: 'alpha' },
            { version: '1.0.0-master', channel: 'master' },
            { version: '1.0.0-dev', channel: 'dev' },
            { version: '1.0.0-master', channel: 'master' },
            { version: '1.0.0', channel: 'dev' },
            { version: '1.0.0', channel: 'alpha' },
            { version: '1.0.0', channel: 'dev' },
            { version: '1.0.0-alpha', channel: 'alpha' },
            { version: '1.0.0', channel: 'dev' },
            { version: '1.0.0', channel: 'alpha' },
            { version: '1.0.0-nightly', channel: 'nightly' },
            { version: '1.0.0', channel: 'alpha' },
        ];
        let sorted = releases.sort(util_1.compareVersions);
        const result = sorted.map(r => r.channel).join(',');
        chai_1.assert.equal(result, 'master,master,nightly,alpha,alpha,alpha,alpha,alpha,dev,dev,dev,dev');
    }));
});
