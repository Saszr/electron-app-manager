import { IRelease, IInvalidRelease, IReleaseExtended } from '../api/IRelease';
import { IRepository, IFetchOptions } from '../api/IRepository';
import RepoBase from '../api/RepoBase';
import AppPackage from '../AppPackage';
declare class Cache extends RepoBase implements IRepository {
    cacheDirPath: string;
    name: string;
    private getPackageCached;
    constructor(cacheDirPath: string);
    clear(): Promise<void>;
    toRelease(fileName: string): Promise<any>;
    getReleases({ sort, version }?: IFetchOptions): Promise<Array<(IRelease | IInvalidRelease)>>;
    getLatest(options?: IFetchOptions): Promise<IRelease | IReleaseExtended | null>;
    getPackage(release: IRelease): Promise<AppPackage>;
    getEntries(release: IRelease): Promise<any>;
    getEntry(release: IRelease, entryPath: string): Promise<any>;
    extract(release: IRelease, onProgress?: Function): Promise<any>;
}
export default Cache;
