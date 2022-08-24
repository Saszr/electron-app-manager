/// <reference types="node" />
import { IRelease, IInvalidRelease, IReleaseExtended } from '../api/IRelease';
import { IRemoteRepository, IFetchOptions } from '../api/IRepository';
import RepoBase from '../api/RepoBase';
interface AzureBlob {
    Name: Array<string>;
    Properties: Array<{
        'Last-Modified': Array<Date>;
        'Etag': Array<string>;
        'Content-Length': Array<string>;
        'Content-Type': Array<string>;
        'Content-MD5': Array<string>;
    }>;
}
declare class Azure extends RepoBase implements IRemoteRepository {
    repoUrl: string;
    onReleaseParsed: Function;
    name: string;
    filter: Function;
    constructor(repoUrl: string, options?: any);
    get repositoryUrl(): string;
    toRelease(releaseInfo: AzureBlob): IRelease;
    getReleases({ sort, filterInvalid, version }?: IFetchOptions): Promise<(IRelease | IInvalidRelease | IInvalidRelease)[]>;
    getLatest(options?: IFetchOptions): Promise<IRelease | IReleaseExtended | null>;
    download(release: IRelease, onProgress?: (progress: number) => void): Promise<Buffer>;
}
export default Azure;
