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
const RepoBase_1 = __importDefault(require("../api/RepoBase"));
const downloader_1 = require("../lib/downloader");
class Swarm extends RepoBase_1.default {
    constructor(repoUrl) {
        super();
        this.repositoryUrl = '';
        this.name = 'swarm';
    }
    getReleases(options) {
        throw new Error("Method not implemented.");
    }
    getLatest(options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            return {
                name: 'test',
                displayName: 'test',
                repository: 'testrepo',
                fileName: 'test.zip',
                commit: undefined,
                publishedDate: new Date(),
                version: '1.0.0',
                displayVersion: 'v1.0.0',
                channel: 'alpha',
                size: 100,
                tag: '1.0.0',
                location: 'test',
                error: undefined,
                remote: true
            };
        });
    }
    download(release, onProgress = (progress) => { }) {
        return __awaiter(this, void 0, void 0, function* () {
            const { location } = release;
            const data = yield downloader_1.download(location, onProgress);
            return data;
        });
    }
}
exports.default = Swarm;
