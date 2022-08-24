import { IPackageEntry } from 'ethpkg';
export default class AppPackage {
    private pkg;
    private packagePath;
    initialized: boolean;
    constructor(packagePath: string);
    init(): Promise<this>;
    get isTar(): boolean;
    get isZip(): boolean;
    get isAsar(): boolean;
    get detachedMetadataPath(): string;
    get packageName(): string;
    get packageNameWithoutExtension(): string;
    /**
     * package is extracted in a directory next to package with same name
     * but without archive / package extension
     */
    get extractedPackagePath(): string;
    verify(): Promise<import("ethpkg/dist/IVerificationResult").IVerificationResult | null>;
    hasEmbeddedMetadata(): Promise<any>;
    hasDetachedMetadata(): any;
    getEmbeddedMetadata(): Promise<Object | null>;
    getDetachedMetadata(): Promise<Object | null>;
    getMetadata(): Promise<any>;
    getEntries(): Promise<IPackageEntry[]>;
    getEntry(entryPath: string): Promise<IPackageEntry | null>;
    private extractTemp;
    extract(onProgress?: Function): Promise<string>;
}
