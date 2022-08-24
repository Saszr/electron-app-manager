/// <reference types="node" />
import { IRelease, IInvalidRelease, IMetadata, IReleaseExtended } from '../api/IRelease';
import { IRemoteRepository, IFetchOptions } from '../api/IRepository';
import RepoBase from '../api/RepoBase';
declare class Github extends RepoBase implements IRemoteRepository {
    private client;
    private _repositoryUrl;
    private owner;
    private repo;
    private prefixFilter?;
    private filter;
    name: string;
    constructor(repoUrl: string, options?: any);
    get repositoryUrl(): string;
    private assetToRelease;
    private toRelease;
    getMetadata(release: IRelease): Promise<IMetadata | null>;
    private extendWithMetadata;
    getReleases({ sort, filterInvalid, version }?: IFetchOptions): Promise<Array<(IRelease | IInvalidRelease)>>;
    getLatest(options?: IFetchOptions): Promise<IRelease | IReleaseExtended | null>;
    download(release: IRelease, onProgress?: (progress: number) => void): Promise<Buffer>;
}
export default Github;
