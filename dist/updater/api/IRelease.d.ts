export interface IReleaseBase {
    name: string;
    error: string | void;
}
export interface IInvalidRelease extends IReleaseBase {
    error: string;
}
export interface IRelease extends IReleaseBase {
    name: string;
    displayName: string;
    fileName: string;
    commit: string | void;
    publishedDate: Date;
    version: string;
    displayVersion: string;
    platform?: string;
    arch?: string;
    isPrerelease?: boolean;
    channel: string | void;
    size: Number;
    tag: string;
    location: string;
    extractedPackagePath?: string;
    repository: string;
    error: void;
    signature?: string;
    metadata?: string;
    remote: boolean;
}
export interface IMetadata {
    name: string;
    icon: string;
    md5?: string;
    sha1?: string;
    sha256?: string;
    sha512?: string;
}
export interface IReleaseExtended extends IRelease {
    icon: string;
    checksums: {
        md5?: string;
        sha1?: string;
        sha256?: string;
        sha512?: string;
    };
    signature?: string;
}
interface Publisher {
    publisherId: string;
    publisherName: string;
    displayName: string;
    flags: string;
}
interface VersionInfo {
}
interface PackageStatistics {
    install: Number;
    ratingCount: Number;
    avgRating: Number;
}
export interface IAppPackage extends IReleaseBase {
    packageId: string;
    packageName: string;
    flags: string;
    releaseDate: Date;
    lastUpdated: Date;
    publishedDate: Date;
    shortDescription: string;
    logo: string;
    publishers: Array<Publisher>;
    statistics: PackageStatistics;
    versions: Array<VersionInfo>;
    readme: string;
    changelog: string;
    license: string;
}
export {};
