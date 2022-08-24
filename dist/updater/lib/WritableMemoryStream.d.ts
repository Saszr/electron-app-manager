/// <reference types="node" />
import stream from 'stream';
export default class WMStrm extends stream.Writable {
    buffer: Buffer | undefined;
    data: any[];
    constructor();
    _write(chunk: any, enc: string, cb: Function): void;
}
