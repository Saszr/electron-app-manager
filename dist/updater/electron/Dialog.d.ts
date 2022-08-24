export declare class ElectronDialogs {
    static displayUpdateFoundDialog(name: string, version: string, callback: Function): void;
    static displayUpToDateDialog(): void;
    static displayRestartForUpdateDialog(callback: (response: number, checkboxChecked: boolean) => void): void;
    static displayUpdateError(err: Error): void;
}
