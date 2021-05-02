/**
 * 給 html Renderer 使用
 */
const _consoleTitle = '[/app/initRenderer.js]';
//region 舊寫法-Deprecated - Electron 已捨棄
// const {remote, ipcRenderer} = require('electron');
// const {app, dialog} = remote;
//endregion

const path = require('path');
const {ipcRenderer} = require('electron');
const remote = require('@electron/remote');
const {app, dialog} = remote;

//PS: 攔截錯誤送給 main process
window.onerror = function (error, url, line) {
    ipcRenderer.send('errorInWindow', error, url, line);
};

const locales = remote.getGlobal('locales');                       //取 [支援的語系] 清單: Array
let i18n = remote.getGlobal('i18n');                               //多國語系轉換
const myElectron = remote.require('./common/myElectron');
const Mustache = require('mustache');                                    //樣版引擎 https://github.com/janl/mustache.js
const mydb = remote.getGlobal('MyDB');                             //資料庫模組
const machineResource = remote.getGlobal('machineResource');       //取主機資源
const myMCServerManager = remote.require('./common/myMCServerManager');  //MC伺服器管理 (html 內會用到)
const {browserWindows} = remote.require('./common/myConfig');            //html 內會用到 (html 內會用到)

//....................................................................................
const config = remote.getGlobal('config');  //設定檔
const isNetworkOnline = remote.getGlobal('isNetworkOnline');
const isFindJavaHome = remote.getGlobal('isFindJavaHome');
console.log(_consoleTitle, 'isNetworkOnline:', isNetworkOnline, ',isFindJavaHome:', isFindJavaHome);
console.log(_consoleTitle, 'global.config:', config);

//....................................................................................
//PS: 複制文字到剪貼簿
let copyTextToClipboard = (text) => {
    myElectron.copyTextToClipboard(text);
    myElectron.showDialogMessage('Copy', `已將 ${text} 複制到剪貼簿囉`);
}

//....................................................................................
//PS: 粗估推算主機資源可啟動的伺服器數目 (1Server*1GB RAM)
let predictionCanStartServerTotal = () => {
    let consoleTitle2 = _consoleTitle + '[predictionCanStartServerTotal]';

    let canStartServerTotal = Math.floor((machineResource.memInfo.freeMemMb - 300) / 1024);

    //let msg = `根據電腦資源推算，建議最多啟動 ${canStartServerTotal}台伺服器`;
    let msg = i18n.__('predictionCanStartServerTotal %d', canStartServerTotal);
    if (canStartServerTotal < 1) {
        //msg = `電腦資源不足，不建議啟動伺服器，以免當機`;
        msg = i18n.__('predictionCanStartServerTotal_low');
    }

    document.getElementById('predictionCanStartServerTotal').innerHTML = msg;
}

//....................................................................................
