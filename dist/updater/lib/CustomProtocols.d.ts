export declare const loadRemoteApp: (repoUrl: string, targetVersion?: string | undefined, onProgress?: (app: any, progress: number) => void) => Promise<string>;
/**
 * TODO things to consider:
 * this is *magic* and magic is usually not a good thing
 * it will overwrite other interceptors - it seems there can only be one which might be a bug
 * this will only allow to read from one zip which is probably intended
 * it will also completely deactivate fs access for files outside the zip which could be a good thing
 */
export declare const registerHotLoadProtocol: (_cacheDir?: string | undefined) => string | undefined;
