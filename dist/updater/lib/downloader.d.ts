/// <reference types="node" />
import http from 'http';
export declare function request(method: string, _url: string, opts?: {}): Promise<http.IncomingMessage>;
export declare function downloadStreamToBuffer(response: http.IncomingMessage, progress?: (p: number) => void): Promise<Buffer>;
export declare function download(_url: string, onProgress?: (progress: number) => void, redirectCount?: number, options?: {
    parallel: number;
}): Promise<Buffer>;
export declare function downloadJson(_url: string): Promise<any>;
