import AppManager from "../AppManager";
import { IRepository } from '../api/IRepository';
export declare const createSwitchVersionMenu: (releases: any, onSwitchVersion: Function, options?: {
    limit: number;
}) => Object[];
export declare const createCheckUpdateMenu: (currentVersion: string, getLatest: Function) => {
    label: string;
    click: () => Promise<void>;
};
export declare const createMenu: (name: string, version: string, repo: IRepository, onSwitchVersion: Function) => Promise<{
    label: string;
    click: () => void;
    submenu: {
        label: string;
        submenu: ({
            type: string;
            label?: undefined;
            submenu?: undefined;
            click?: undefined;
            id?: undefined;
            enabled?: undefined;
        } | {
            label: string;
            submenu: Object[];
            type?: undefined;
            click?: undefined;
            id?: undefined;
            enabled?: undefined;
        } | {
            label: string;
            click: () => void;
            type?: undefined;
            submenu?: undefined;
            id?: undefined;
            enabled?: undefined;
        } | {
            id: string;
            label: string;
            enabled: boolean;
            type?: undefined;
            submenu?: undefined;
            click?: undefined;
        })[];
    }[];
}>;
declare class MenuBuilder {
    menuTemplate: any;
    appManager: AppManager;
    constructor(appManager: AppManager);
    createMenuTemplate(onReload: Function): Promise<{
        label: string;
        click: () => void;
        submenu: ({
            type: string;
            label?: undefined;
            submenu?: undefined;
            click?: undefined;
            id?: undefined;
            enabled?: undefined;
        } | {
            label: string;
            submenu: never[];
            type?: undefined;
            click?: undefined;
            id?: undefined;
            enabled?: undefined;
        } | {
            label: string;
            click: () => Promise<void>;
            type?: undefined;
            submenu?: undefined;
            id?: undefined;
            enabled?: undefined;
        } | {
            id: string;
            label: string;
            enabled: boolean;
            type?: undefined;
            submenu?: undefined;
            click?: undefined;
        })[];
    }>;
    updateMenuVersion(version: string): Promise<any>;
}
export default MenuBuilder;
