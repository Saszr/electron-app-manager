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
exports.checksumMd5 = exports.verifyPGP = void 0;
const { md5 } = require('../lib/hashes');
const fs = require('fs');
const openpgp = require('openpgp');
const verify = (options) => {
    return new Promise((resolve, reject) => {
        openpgp.verify(options).then(function (verified) {
            console.log('data ready');
            resolve(verified);
        });
    });
};
exports.verifyPGP = (fileName, pubKey, detachedSig) => __awaiter(void 0, void 0, void 0, function* () {
    const readableStream = fs.createReadStream(fileName);
    const options = {
        message: yield openpgp.message.fromBinary(readableStream),
        signature: yield openpgp.signature.readArmored(detachedSig),
        publicKeys: (yield openpgp.key.readArmored(pubKey)).keys // for verification
    };
    let verified = yield verify(options);
    yield openpgp.stream.readToEnd(verified.data);
    let validity = yield verified.signatures[0].verified;
    return validity;
});
exports.checksumMd5 = (fileName) => {
    const content = fs.readFileSync(fileName);
    let calculatedHash = md5(content);
    return calculatedHash;
};
