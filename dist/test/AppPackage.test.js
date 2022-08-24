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
const chai_1 = require("chai");
const AppPackage_1 = __importDefault(require("../updater/AppPackage"));
const tarPath = __dirname + '/fixtures/TarCache/' + 'geth-darwin-amd64-1.8.22-7fa3509e.tar.gz';
describe('AppPackage', () => {
    describe('ctor()', () => {
    });
    describe('getEntries()', () => {
        it('returns all entries from the package', () => __awaiter(void 0, void 0, void 0, function* () {
            let appPackage = yield new AppPackage_1.default(tarPath).init();
            let entries = yield appPackage.getEntries();
            chai_1.assert.isArray(entries);
            chai_1.assert.equal(entries.length, 3);
        }));
    });
    describe('getEntry()', () => __awaiter(void 0, void 0, void 0, function* () {
        it('returns the entry header and buffer from the package', () => __awaiter(void 0, void 0, void 0, function* () {
            let appPackage = yield new AppPackage_1.default(tarPath).init();
            let entry = yield appPackage.getEntry('geth-darwin-amd64-1.8.22-7fa3509e/geth');
            chai_1.assert.isNotNull(entry);
        }));
    }));
    describe('entry.getData()', () => {
        it('returns the entry header and buffer from the package', function () {
            return __awaiter(this, void 0, void 0, function* () {
                let appPackage = yield new AppPackage_1.default(tarPath).init();
                let entry = yield appPackage.getEntry('geth-darwin-amd64-1.8.22-7fa3509e/geth');
                chai_1.assert.isNotNull(entry);
                // @ts-ignore entry != null
                let data = yield entry.file.readContent();
                chai_1.assert.equal(data.length, 14346);
            });
        });
    });
    describe('extract()', () => {
        it.skip("extracts the package content to the same director", () => __awaiter(void 0, void 0, void 0, function* () {
            let packagePath = __dirname + '/fixtures/PackageCache/mist-ui-react_0.1.19b.zip';
            let appPackage = yield new AppPackage_1.default(packagePath).init();
            appPackage.extract();
        }));
    });
});
