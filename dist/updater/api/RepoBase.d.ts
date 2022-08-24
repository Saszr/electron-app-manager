/// <reference types="node" />
import { IRelease, IInvalidRelease } from './IRelease';
import { EventEmitter } from 'events';
declare class RepoBase extends EventEmitter {
    compareVersions(a: IRelease | IInvalidRelease, b: IRelease | IInvalidRelease): 1 | 0 | -1;
    protected normalizeTag(tag: string): string;
    protected sortReleases(releases: Array<IRelease | IInvalidRelease>): (IInvalidRelease | IRelease)[];
    protected notEmpty<IRelease>(value: IRelease | null | undefined): value is IRelease;
}
export default RepoBase;
