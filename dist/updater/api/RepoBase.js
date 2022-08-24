"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const util_1 = require("../util");
const semver = require('semver');
class RepoBase extends events_1.EventEmitter {
    compareVersions(a, b) {
        return util_1.compareVersions(a, b);
    }
    normalizeTag(tag) {
        if (tag[0] == 'v')
            tag = tag.slice(1);
        return tag;
    }
    sortReleases(releases) {
        return releases.sort(this.compareVersions);
    }
    notEmpty(value) {
        return value !== null && value !== undefined;
    }
}
exports.default = RepoBase;
