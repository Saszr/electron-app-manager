/// <reference types="node" />
import { IRelease, IInvalidRelease } from "./api/IRelease";
import { WebContents } from 'electron';
export declare function parseXml(xml: string): Promise<unknown>;
export declare function extractVersion(str: string): string | undefined;
export declare function extractPlatform(str: string): "linux" | "windows" | "mac" | undefined;
export declare function extractArchitecture(str: string): string | undefined;
export declare function simplifyVersion(str: string): string;
export declare const compareVersions: (a: IRelease | IInvalidRelease | {
    version?: string;
    channel?: string;
}, b: IRelease | IInvalidRelease | {
    version?: string;
    channel?: string;
}) => 1 | 0 | -1;
export declare function isUrl(str: string): boolean;
export declare const getExtension: (fileName: string) => string;
export declare function hasSupportedExtension(fileName: string): boolean;
export declare const isRelease: <IRelease_1>(value: any) => value is IRelease_1;
export declare const getEthpkg: (app: IRelease | Buffer | string) => Promise<import("ethpkg").IPackage>;
export declare const isElectron: () => boolean;
export declare const isPackaged: () => boolean | undefined;
export declare const findWebContentsByTitle: (windowTitle: string) => Promise<WebContents>;
export declare const memoize: (fn: Function) => (...args: any[]) => Promise<any>;
export declare const generateHostnameForRelease: (release: IRelease) => Promise<string>;
export declare const getMimeType: (pathName: string) => string;
