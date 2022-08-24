/// <reference types="node" />
import { IRelease, IInvalidRelease, IReleaseExtended } from '../api/IRelease';
import { IRemoteRepository, IFetchOptions } from '../api/IRepository';
import RepoBase from '../api/RepoBase';
declare class Swarm extends RepoBase implements IRemoteRepository {
    repositoryUrl: string;
    name: string;
    constructor(repoUrl: string);
    getReleases(options?: IFetchOptions | undefined): Promise<(IRelease | IInvalidRelease)[]>;
    getLatest(options?: IFetchOptions): Promise<IRelease | IReleaseExtended | null>;
    download(release: IRelease, onProgress?: (progress: number) => void): Promise<Buffer>;
}
export default Swarm;
