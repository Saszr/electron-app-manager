/// <reference types="node" />
import { IRelease, IInvalidRelease, IReleaseExtended } from '../api/IRelease';
import { IRemoteRepository, IFetchOptions } from '../api/IRepository';
import RepoBase from '../api/RepoBase';
export default class Bintray extends RepoBase implements IRemoteRepository {
    name: string;
    repositoryUrl: string;
    private filter;
    private subject;
    private packageName;
    private repoName;
    constructor(repoUrl: string, options?: any);
    private toRelease;
    getReleases(options?: IFetchOptions | undefined): Promise<(IRelease | IInvalidRelease)[]>;
    getLatest(options?: IFetchOptions): Promise<IRelease | IReleaseExtended | null>;
    download(release: IRelease, onProgress?: (progress: number) => void): Promise<Buffer>;
}
