/**
 * Electron 共用函式
 *
 * Usage:
 *   1.Main Process:
 *      const myElectron = require('./modules/myElectron');
 *
 *   2.Renderer Process:
 *      const {remote} = require('electron');
 *      const myElectron = remote.require('./modules/myElectron');
 *
 * Created by 阿友 on 2021/02/23
 */
let consoleTitle = '[/app/common/myElectron.js]';
const {Notification, dialog, screen, shell, clipboard} = require('electron');
//const si = require('systeminformation');  //第三方套件可以取得系統相關資訊


//region clipboard

/**
 * 複制文字放到剪貼板
 *
 * @param text
 */
let copyTextToClipboard = function(text) {

    clipboard.writeText(text);

}

//endregion

//region Shell

/**
 * shell - 將 目錄/檔案 丟到垃圾桶 - ok
 *
 * @param itemPath  完整目錄/檔案位置
 */
let shellMoveItemToTrash = async function (itemPath) {

    let consoleTitle2 = consoleTitle + '[shellMoveItemToTrash]';
    console.log(consoleTitle2, itemPath);    //`${app.getAppPath()}/server/8/world`
    await shell.trashItem(itemPath);

}

/**
 * shell - 檔案總管 開啟 目錄 - ok
 *
 * @param folderPath  完整目錄/檔案位置
 */
let shellOpenFolderPath = async function (folderPath) {

    let consoleTitle2 = consoleTitle + '[shellOpenFolderPath]';
    console.log(consoleTitle2, folderPath);    //`${app.getAppPath()}/server/8/world`
    //await shell.openPath(folderPath);
    await shell.showItemInFolder(folderPath);

}

//endregion


/**
 * 取 [螢幕] 相關資訊
 *
 * @return {Promise<{curScreenPoint: Electron.Point, curDisplay: Electron.Display, externalDisplay: T[], displays: Electron.Display[]}>}
 */
let getDisplays = async function () {

    let consoleTitle2 = consoleTitle + '[getDisplayScreens]';

    //全部螢幕清單
    const displays = screen.getAllDisplays();  //Array
    //console.log(consoleTitle2, 'displays:', displays);

    //取 [主要螢幕]
    const primaryDisplay = screen.getPrimaryDisplay();  //Object
    //console.log(consoleTitle2, 'primaryDisplay:', primaryDisplay);

    //取 [外接螢幕] 清單
    const externalDisplay = displays.filter((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0
    })
    //console.log(consoleTitle2, 'externalDisplay:', externalDisplay);

    //Mouse 目前所在 Point x,y
    let curScreenPoint = screen.getCursorScreenPoint();  //Object
    //console.log(consoleTitle2, 'curScreenPoint:', curScreenPoint);

    //將 Mouse 目前所在Point 轉成 screen
    let curMousePointAtScreen = screen.getDisplayMatching({
        x: curScreenPoint.x,
        y: curScreenPoint.y,
        width: 10,
        height: 10
    });
    //console.log(constTitle2, 'curDisplay:', curDisplay);

    //PS: 使用第三方套件可以取得 螢幕Model,但是無法對應 Electron screen 清單.
    //let graphs = await si.graphics();
    //console.log(consoleTitle2, 'graphs:', graphs);

    //回傳
    return {displays, primaryDisplay, externalDisplay, curMousePointAtScreen};

}


/**
 * 顯示系統通知訊息 - ok
 *
 * @param title
 * @param message
 */
let showNotification = function (title, message) {

    const notification = {
        title: title,
        body: message
    }

    new Notification(notification).show();

}


/**
 * 顯示Dialog訊息 - ok
 *
 * @param title
 * @param message
 */
let showDialogMessage = function (title, message) {

    dialog.showMessageBox(null, {title: title, message: message});

}


/**
 * 顯示Dialog選擇儲存到本地的檔案路徑 - ok
 *
 * @param filename  檔案名稱,eg: xxx.xls
 * @return {Promise<Electron.SaveDialogReturnValue>}
 */
let showSaveDialog = async function (filename) {

    return await dialog.showSaveDialog(null, {defaultPath: filename});

}

/**
 * 顯示Dialog確認視窗 - ok
 *
 * @param {object} options
 * @param {string} options.type     Dialog型式: "none", "info", "error", "question" or "warning"
 * @param {string} options.title    標題
 * @param {string} options.message  訊息
 * @param {string[]} options.buttons  按鈕集合
 * @return {number}
 *
 * Usage:
 *    //詢問是否確定刪除
 *    let btnClickIdx = myElectron.showConfirmDialog({type: 'warning', title: '移除', message: '確定要移除店家資料?', buttons: ["確定","取消"]});
 *    //btnClickIdx = 0 = 確定
 *    //btnClickIdx = 1 = 取消
 */
let showConfirmDialog = function (options) {

    let _type = options.type || 'warning';
    let _title = options.title || '標題';
    let _message = options.message || '訊息...';
    let _buttons = options.buttons || ["確定", "取消"];

    let btnClickIdx = dialog.showMessageBoxSync({type: _type, title: _title, message: _message, buttons: _buttons});
    //console.log(consoleTitle, 'btnClickIdx:', btnClickIdx);

    return btnClickIdx;  //返回點擊的 Button 索引位置

}


module.exports = {

    getDisplays,

    showNotification,

    showDialogMessage,

    showSaveDialog,

    showConfirmDialog,

    shellOpenFolderPath,
    shellMoveItemToTrash,

    copyTextToClipboard

};
