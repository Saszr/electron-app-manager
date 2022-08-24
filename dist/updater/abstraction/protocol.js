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
const is = {
    electron: () => {
        return 'electron' in process.versions;
    },
    yue: () => {
        return true;
    }
};
const RUNTIME = {
    ELECTRON: 'electron',
    YUE: 'yue',
    CARLO: 'carlo',
    UNKNOWN: 'unknown'
};
const abstraction = {
    runtime: () => {
        if (is.electron()) {
            return RUNTIME.ELECTRON;
        }
        else if (is.yue()) {
            return RUNTIME.YUE;
        }
        else {
            return RUNTIME.UNKNOWN;
        }
    }
};
class Protocol {
    constructor() {
        this.registerProtocolHandler = (scheme, handler, onError) => __awaiter(this, void 0, void 0, function* () {
            switch (abstraction.runtime()) {
                case RUNTIME.ELECTRON: {
                    const _protocol = require('./electron/protocol').default;
                    _protocol.registerProtocolHandler(scheme, handler);
                    break;
                }
                case RUNTIME.YUE: {
                    const _protocol = require('./yue/protocol').default;
                    _protocol.registerProtocolHandler(scheme, handler);
                }
            }
        });
    }
}
exports.default = new Protocol();
