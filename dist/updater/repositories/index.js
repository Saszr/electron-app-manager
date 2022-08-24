"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRepository = void 0;
const Github_1 = __importDefault(require("./Github"));
const Azure_1 = __importDefault(require("./Azure"));
const Swarm_1 = __importDefault(require("./Swarm"));
const Bintray_1 = __importDefault(require("./Bintray"));
exports.getRepository = (urlString, modifiers, filter, prefix) => {
    if (urlString.startsWith('https://github.com/')) {
        return new Github_1.default(urlString, {
            filter,
            prefix
        });
    }
    else if (urlString.startsWith('https://bintray.com')) {
        return new Bintray_1.default(urlString, {
            filter
        });
    }
    else if (urlString.includes('blob.core.windows.net')) {
        if (modifiers) {
            let mod = (release) => {
                let result = {};
                for (var m in modifiers) {
                    result[m] = modifiers[m](release);
                }
                return result;
            };
            return new Azure_1.default(urlString, {
                onReleaseParsed: mod,
                filter,
                prefix
            });
        }
        else {
            return new Azure_1.default(urlString, {
                filter,
                prefix
            });
        }
    }
    else if (urlString.includes('bzz:')) {
        return new Swarm_1.default(urlString);
    }
    else {
        throw new Error('No repository strategy found for url: ' + urlString);
    }
};
