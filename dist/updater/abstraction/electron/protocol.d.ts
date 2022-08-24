import IProtocol from '../IProtocol';
declare class Protocol implements IProtocol {
    registerProtocolHandler(scheme: string, handler: Function): void;
}
declare const _default: Protocol;
export default _default;
