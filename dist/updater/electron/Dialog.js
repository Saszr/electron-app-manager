"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElectronDialogs = void 0;
const electron_1 = require("electron");
class ElectronDialogs {
    static displayUpdateFoundDialog(name, version, callback) {
        electron_1.dialog.showMessageBox({
            title: 'Update available',
            buttons: ['Ok', 'Cancel'],
            message: `
      Update found: ${name} (v${version}). 
      Press "Ok" to download it in the background.
      `
        }).then(({ response }) => {
            // response: Number - The index of the button that was clicked
            // console.log('user response to update:', response)
            const shouldInstall = response !== 1; // = index of 'cancel'
            callback(shouldInstall);
        });
    }
    static displayUpToDateDialog() {
        electron_1.dialog.showMessageBox({
            title: 'No update',
            message: 'You are using the latest version'
        });
    }
    static displayRestartForUpdateDialog(callback) {
        electron_1.dialog.showMessageBox({
            title: 'Install Updates',
            message: 'Updates downloaded, application will be quit for update...'
        }).then(({ response, checkboxChecked }) => {
            callback(response, checkboxChecked);
        });
    }
    static displayUpdateError(err) {
        electron_1.dialog.showMessageBox({
            title: 'Update Error',
            type: 'error',
            message: `
      An error occurred during update: 
      ${err ? err.message : '<unknown error>'}
      `
        });
    }
}
exports.ElectronDialogs = ElectronDialogs;
