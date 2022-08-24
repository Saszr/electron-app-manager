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
exports.createMenu = exports.createCheckUpdateMenu = exports.createSwitchVersionMenu = void 0;
const electron_1 = require("electron");
const semver_1 = __importDefault(require("semver"));
const VALID_CHANNELS = [
    'dev',
    'ci',
    'alpha',
    'beta',
    'nightly',
    'production',
    'master',
    'release',
];
const showDialog = (title, message, buttonHandler = {}) => {
    // TODO make sure this does not introduce memory leaks.. use weak map?
    return new Promise((resolve, reject) => {
        const buttons = Object.keys(buttonHandler);
        electron_1.dialog.showMessageBox({
            title,
            message,
            buttons,
        })
            .then(({ response }) => {
            const button = buttons[response];
            console.log('response was', response, button);
            try {
                if (typeof buttonHandler[button] === 'function') {
                    console.log('button handler found and called');
                    (buttonHandler[button])();
                }
            }
            catch (error) {
                reject(error);
            }
            resolve();
        });
    });
};
// TODO remove redundant definition
const SOURCES = {
    CACHE: 'Cache',
    HOTLOADER: 'HotLoader'
};
const isRemoteSource = (source) => source && source !== SOURCES.CACHE && source !== SOURCES.HOTLOADER;
exports.createSwitchVersionMenu = (releases, onSwitchVersion, options = {
    limit: 15 // limit per channel
}) => {
    const { limit } = options;
    releases = releases.slice(0, Math.min(releases.length - 1, 100));
    // create it this way to get "stable" order
    let channelMenu = {
        'release': [],
        'production': [],
        'master': [],
        'nightly': [],
        'alpha': [],
        'beta': [],
        'dev': [],
        'ci': [],
        'unknown': [],
    };
    // @ts-ignore
    releases.forEach((release) => {
        let { version, channel } = release;
        if (!channel) {
            channel = 'unknown';
        }
        const releaseItem = {
            label: release.tag,
            click: () => __awaiter(void 0, void 0, void 0, function* () {
                let title = 'Switch Version';
                let message = `Do you want to load version ${version}?`;
                showDialog(title, message, {
                    'ok': () => {
                        console.log('switch now');
                        onSwitchVersion(version);
                    },
                    'cancel': () => {
                    },
                });
            })
        };
        if (channelMenu[channel].length < limit) {
            channelMenu[channel].push(releaseItem);
        }
    });
    let channels = Object.keys(channelMenu);
    // remove channels without items
    channels.forEach(channel => {
        if (channelMenu[channel].length <= 0) {
            delete channelMenu[channel];
        }
    });
    // if all items are lacking channel info don't create submenu
    channels = Object.keys(channelMenu);
    if (channels.length === 1 && channels[0] === 'unknown') {
        return channelMenu['unknown'];
    }
    // convert channel struct to submenu
    return channels.map(label => ({
        label,
        submenu: [...channelMenu[label]]
    }));
};
exports.createCheckUpdateMenu = (currentVersion, getLatest) => {
    return {
        label: 'Check Update',
        click: () => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const latest = yield getLatest();
                if (latest && semver_1.default.lt(currentVersion, latest.version)) {
                    yield showDialog('Update Found', `Update Found:\n\n${latest.name} - ${latest.version}\n\n${latest.location}\n\n`, {
                        'update': () => __awaiter(void 0, void 0, void 0, function* () {
                            // FIXME const appUrl = await this.appManager.hotLoad(latest)
                            // onReload(appUrl)
                        }),
                        'cancel': () => {
                            // do nothing
                        }
                    });
                }
                else {
                    showDialog('Update not found', 'Update not found');
                }
            }
            catch (error) {
                console.log('error during update check', error);
                showDialog('Update Error', 'Update Error');
                return;
            }
        })
    };
};
exports.createMenu = (name, version, repo, onSwitchVersion) => __awaiter(void 0, void 0, void 0, function* () {
    const releases = yield repo.getReleases();
    const sub = {
        label: name,
        submenu: [
            exports.createCheckUpdateMenu(version, repo.getLatest.bind(repo)),
            { type: 'separator' },
            {
                label: 'Switch Version',
                submenu: exports.createSwitchVersionMenu(releases, onSwitchVersion)
            },
            { type: 'separator' },
            {
                label: 'Open Cache',
                click: function () {
                    console.log('open cache');
                    // shell.showItemInFolder(this.appManager.cacheDir) 
                }
            },
            { type: 'separator' },
            {
                id: 'version',
                label: version,
                enabled: false
            },
        ]
    };
    const menuTemplate = {
        label: 'Updater',
        click: () => { },
        submenu: [sub]
    };
    return menuTemplate;
});
class MenuBuilder {
    constructor(appManager) {
        this.appManager = appManager;
    }
    createMenuTemplate(onReload) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.menuTemplate) {
                console.log('cached menu template found');
            }
            const menuTemplate = {
                label: 'Updater',
                click: () => { },
                submenu: [
                    // await this.createCheckUpdateMenu(onReload),
                    { type: 'separator' },
                    {
                        label: 'Switch Version',
                        submenu: [] //await this.createSwitchVersionMenu(onReload)
                    },
                    {
                        label: 'HotLoad Latest',
                        click: () => __awaiter(this, void 0, void 0, function* () {
                            // FIXME const hotUrl = await this.appManager.hotLoadLatest()
                            // FIXME onReload(hotUrl)
                        })
                    },
                    { type: 'separator' },
                    {
                        label: 'Open Cache',
                        click: () => __awaiter(this, void 0, void 0, function* () { electron_1.shell.showItemInFolder(this.appManager.cacheDir); })
                    },
                    { type: 'separator' },
                    {
                        id: 'version',
                        label: 'Version not set',
                        enabled: false
                    },
                ]
            };
            // cache menu template
            this.menuTemplate = menuTemplate;
            return menuTemplate;
        });
    }
    updateMenuVersion(version) {
        return __awaiter(this, void 0, void 0, function* () {
            let menuTemplate = this.menuTemplate;
            if (!menuTemplate) {
                throw new Error('menu needs to be created before it can be updated');
            }
            const vMenuItem = menuTemplate.submenu.find((mItem) => mItem.id === 'version');
            if (vMenuItem) {
                vMenuItem.label = `Version ${version}`;
            }
            return menuTemplate;
        });
    }
}
exports.default = MenuBuilder;
