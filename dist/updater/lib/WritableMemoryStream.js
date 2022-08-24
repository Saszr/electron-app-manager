"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const stream_1 = __importDefault(require("stream"));
class WMStrm extends stream_1.default.Writable {
    constructor() {
        super();
        this.data = [];
        this.buffer = undefined;
        this.data = [];
        this.once('finish', () => {
            // it seems that if data ony contains one item concat takes significantly longer
            // which uncovered a race condition of stream events
            this.buffer = this.data.length === 1 ? this.data.pop() : Buffer.concat(this.data);
        });
    }
    // for 30 MB file this takes .3 sec
    _write(chunk, enc, cb) {
        this.data.push(chunk);
        cb();
    }
}
exports.default = WMStrm;
