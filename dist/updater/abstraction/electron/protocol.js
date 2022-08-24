"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url = require('url');
const { app, protocol } = require('electron');
function getFilePath(request) {
    const uri = url.parse(request.url);
    // TODO uri.pathname would be the preferred way
    // but caused issues when the protocol scheme was set as standard
    // let filePath = decodeURIComponent(uri.pathname)
    let filePath = request.url.replace(uri.protocol, '');
    while (filePath && filePath.startsWith('/')) {
        filePath = filePath.slice(1);
    }
    /*
    let qParamsIndex = filePath.indexOf('?')
    if(qParamsIndex > -1) {
      filePath = filePath.substring(0, qParamsIndex)
    }
    */
    // pathname has a leading '/' on Win32 for some reason
    /*
    if (filePath && process.platform === 'win32') {
      filePath = filePath.startsWith('/') ? filePath.slice(1) : filePath
    }
    */
    return filePath;
}
class Protocol {
    registerProtocolHandler(scheme, handler) {
        const init = () => {
            // TODO intercepting not the same as registering
            // console.log('register protocol handler for', scheme)
            if (scheme === 'file') {
                protocol.interceptBufferProtocol('file', (request, cb) => {
                    const fileUri = getFilePath(request);
                    handler(fileUri, cb);
                });
            }
            else {
                protocol.registerBufferProtocol(scheme, (request, cb) => {
                    const fileUri = getFilePath(request);
                    handler(fileUri, cb);
                });
            }
        };
        if (app.isReady()) {
            init();
        }
        else
            (app.once('ready', init));
    }
}
exports.default = new Protocol();
