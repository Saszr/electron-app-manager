/// <reference types="node" />
import { IRemoteRepository, IFetchOptions, IDownloadOptions } from './api/IRepository';
import Cache from './repositories/Cache';
import { IRelease, IInvalidRelease } from './api/IRelease';
import RepoBase from './api/RepoBase';
interface IUpdateInfo {
    updateAvailable: boolean;
    source: string;
    latest: IRelease | null;
}
interface IUpdaterOptions {
    repository: string;
    auto?: boolean;
    electron?: boolean;
    intervalMins?: number;
    cacheDir?: string;
    searchPaths?: string[];
    downloadDir?: string;
    modifiers?: {
        [key: string]: Function;
    };
    filter?: Function;
    prefix?: string;
}
export default class AppManager extends RepoBase {
    remote: IRemoteRepository;
    cache: Cache;
    private caches;
    checkUpdateHandler: any;
    private menuBuilder;
    private isElectron;
    private getRemoteReleasesCached;
    /**
     *
     */
    constructor({ repository, auto, electron, intervalMins, cacheDir, searchPaths, modifiers, filter, prefix }: IUpdaterOptions);
    private setupAutoUpdater;
    get repository(): string;
    get cacheDir(): string;
    get hotLoadedApp(): IRelease | null;
    cancelUpdateRoutine(): void;
    clearCache(): Promise<void>;
    checkForElectronUpdates(): Promise<IUpdateInfo>;
    checkForUpdates(): Promise<IUpdateInfo>;
    checkForUpdatesAndNotify(showNoUpdateDialog?: boolean): Promise<void>;
    _checkForAppUpdatesAndNotify({ version, download, dialogs }: {
        version?: string | undefined;
        download?: boolean | undefined;
        dialogs?: boolean | undefined;
    }): Promise<void>;
    getCachedReleases(): Promise<(IInvalidRelease | IRelease)[]>;
    getRemoteReleases({ sort, cached }?: IFetchOptions): Promise<any>;
    getReleases({ cached }?: IFetchOptions): Promise<any[]>;
    getLatestCached(options?: IFetchOptions): Promise<IRelease | null>;
    getLatestRemote(options?: IFetchOptions): Promise<IRelease | null>;
    getLatest(options?: IFetchOptions): Promise<IRelease | null>;
    private _getLatest;
    download(release: IRelease, { writePackageData, writeDetachedMetadata, targetDir, onProgress, extractPackage, // ignored if not written to disk (writePackageData)
    onExtractionProgress, }?: IDownloadOptions): Promise<{
        remote: boolean;
        location: string;
        name: string;
        displayName: string;
        fileName: string;
        commit: string | void;
        publishedDate: Date;
        version: string;
        displayVersion: string;
        platform?: string | undefined;
        arch?: string | undefined;
        isPrerelease?: boolean | undefined;
        channel: string | void;
        size: Number;
        tag: string;
        extractedPackagePath?: string | undefined;
        repository: string;
        error: void;
        signature?: string | undefined;
        metadata?: string | undefined;
    } | {
        location: string;
        remote: boolean;
        data: Buffer;
        name: string;
        displayName: string;
        fileName: string;
        commit: string | void;
        publishedDate: Date;
        version: string;
        displayVersion: string;
        platform?: string | undefined;
        arch?: string | undefined;
        isPrerelease?: boolean | undefined;
        channel: string | void;
        size: Number;
        tag: string;
        extractedPackagePath?: string | undefined;
        repository: string;
        error: void;
        signature?: string | undefined;
        metadata?: string | undefined;
    }>;
    load(pkgLocation: string): Promise<string>;
    _generateUrlForCachedRelease(release: IRelease): Promise<string>;
    static on(channel: string, cb: (...args: any[]) => void): any;
    createMenuTemplate(onReload: Function): Promise<{
        label: string;
        click: () => void;
        submenu: ({
            type: string;
            label?: undefined;
            submenu?: undefined;
            click?: undefined;
            id?: undefined;
            enabled?: undefined;
        } | {
            label: string;
            submenu: never[];
            type?: undefined;
            click?: undefined;
            id?: undefined;
            enabled?: undefined;
        } | {
            label: string;
            click: () => Promise<void>;
            type?: undefined;
            submenu?: undefined;
            id?: undefined;
            enabled?: undefined;
        } | {
            id: string;
            label: string;
            enabled: boolean;
            type?: undefined;
            submenu?: undefined;
            click?: undefined;
        })[];
    }>;
    updateMenuVersion(version: string): Promise<any>;
    getLocalPackage(release: IRelease): Promise<import("./AppPackage").default>;
    getEntries(release: IRelease): Promise<any>;
    getEntry(release: IRelease, entryPath: string): Promise<any>;
    extract(release: IRelease, onProgress?: Function): Promise<any>;
    static downloadJson(_url: string): Promise<any>;
}
export {};
