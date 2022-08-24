"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sha1 = exports.md5 = void 0;
const crypto_1 = __importDefault(require("crypto"));
exports.md5 = (data) => crypto_1.default.createHash('md5').update(data).digest("hex");
exports.sha1 = (data) => crypto_1.default.createHash('sha1').update(data).digest("hex");
