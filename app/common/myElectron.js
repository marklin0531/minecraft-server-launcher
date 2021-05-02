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
const {BrowserWindow, Notification, dialog, screen, shell, clipboard} = require('electron');
//const si = require('systeminformation');  //第三方套件可以取得系統相關資訊
const {browserWindows, isEnableDevTools} = require('./myConfig');


//region browserWindow

/**
 * 建立視窗
 *
 * @param opts
 * @param opts.winName                   視窗名稱
 * @param opts.url                       視窗載入檔的路徑,eg: file://${appFolderPath()}/form_map_list.html
 * @param [opts.frame=true]              視窗邊框
 * @param [opts.show=true]               視窗顯示
 * @param [opts.winTitle=null]           視窗標題
 * @param [opts.width=750]               視窗寬
 * @param [opts.height=500]              視窗高
 * @param [opts.minWidth=750]            視窗最小寬
 * @param [opts.minHeight=500]           視窗最小高
 * @param [opts.parent]                  父層BrowserWindow
 * @param [opts.hideMenu=false]          隱藏主選單
 * @param [opts.resizable=true]          視窗縮放大小
 * @param [opts.minimizable=false]       視窗最小化
 * @param [opts.maximizable=false]       視窗最大化
 * @param [opts.alwaysOnTop=false]       視窗顯示於最上層
 * @param [opts.modal]                   視窗設為Modal
 * @param [opts.backgroundColor=#ffffff] 視窗背景色
 * @param [opts.isEnableDevTools=false]  開啟DevTools功能
 * @param [opts.openDevTools=false]      開啟DevTools視窗
 *
 * @param [opts.onLoad]                  回呼-頁面載入時
 * @param [opts.onClose]                 回呼-頁面關閉時
 *
 */
let createBrowserWindows = async (opts) => {

    let consoleTitle2 = consoleTitle + '[createBrowserWindows]';

    let width = opts.width || 750;
    let height = opts.height || 500;
    let minWidth = opts.minWidth || width;
    let minHeight = opts.minHeight || height;
    let onLoad = typeof opts.onLoad === 'function' ? opts.onLoad : (evt) => {
    };
    let onClose = typeof opts.onClose === 'function' ? opts.onClose : () => {
        this.win = null;
    };

    //過濾變數值並返回
    let getValue = (obj, defValue) => typeof obj === "undefined" ? defValue : obj;

    let frame = getValue(opts.frame, true);
    let show = getValue(opts.show, true);
    let resizable = getValue(opts.resizable, true);
    let minimizable = getValue(opts.minimizable, false);
    let maximizable = getValue(opts.maximizable, true);
    let alwaysOnTop = getValue(opts.alwaysOnTop, false);
    let isEnableDevTools = getValue(opts.isEnableDevTools, false);
    let openDevTools = getValue(opts.openDevTools, false);
    let hideMenu = getValue(opts.hideMenu, false);
    let modal = getValue(opts.modal, false);

    let win = new BrowserWindow({
        backgroundColor: opts.backgroundColor || '#ffffff',  //背景色
        width: width,
        height: height,
        minWidth: minWidth,    //最小寬
        minHeight: minHeight,  //最小高
        frame: frame,          //有邊框
        show: show,            //先隱藏
        resizable: resizable,
        minimizable: minimizable,
        maximizable: maximizable,
        alwaysOnTop: alwaysOnTop,       //將視窗顯示在最上層 (PS: 不可設否則 Win10 Explorer會被蓋在下面)
        parent: opts.parent || null,    //父層
        modal: modal,                   //Modal模式
        webPreferences: {
            devTools: isEnableDevTools,   //關閉開發工具
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true   //開啟 Renderer 可以使用 remote 方法
        }
    });
    if (hideMenu) win.setMenu(null);    //PS: 隱藏選單 (macOS 不會消失，win10會消失)
    if (openDevTools) win.openDevTools();   //開啟 DevTools (Mac - Alt+Command+I)

    //PS: 註冊視窗
    const winid = win.webContents.id;
    const winName = opts.winName;
    browserWindows.add(winName, winid);
    //console.log(consoleTitle2, 'webContents.id:', winid, ',global.BrowserWindows:', browserWindows.list());
    //console.log(consoleTitle2, 'webContents.id:', winid, ',global.BrowserWindows:', browserWindows.find(opts.winName));

    consoleTitle2 += `[${winName}]`;
    //....................................................................................
    //region 註冊事件

    onLoad = onLoad.bind({win});
    onClose = onClose.bind({win});

    //攔截html的視窗標題異動
    win.on('page-title-updated', function (e) {
        let constTitle3 = consoleTitle2 + '[win.on][page-title-updated]';
        e.preventDefault();
    });
    if (opts.winTitle) win.setTitle(opts.winTitle);  //變更視窗標題

    //一個框架中的文字載入完成後觸發該事件
    win.webContents.on('did-finish-load', onLoad);

    //視窗關閉中
    win.on('close', onClose);

    //視窗已關閉(win已被催毀)
    win.on('closed', () => {
        console.log(consoleTitle2, '[closed]');
    })

    //endregion
    //....................................................................................
    //PS: 載入頁面
    await win.loadURL(opts.url);
    //console.log(consoleTitle2, 'done');

    return win;

}

//endregion

//region clipboard

/**
 * 複制文字放到剪貼板
 *
 * @param text
 */
let copyTextToClipboard = function (text) {
    clipboard.writeText(text);
}

//endregion

//region Shell

/**
 * shell - Browser 開啟網址 - ok
 *
 * @param url    網址
 * @return {Promise<void>}
 */
let shellOpenExternal = async (url) => {
    await shell.openExternal(url);
}


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

let shellOpenUrl = function (url) {
    let consoleTitle2 = consoleTitle + '[shellOpenUrl]';
    console.log(consoleTitle2, url);
    shell.openExternal(url);  //PS: 開啟網頁
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

    createBrowserWindows,

    getDisplays,

    showNotification,

    showDialogMessage,

    showSaveDialog,

    showConfirmDialog,

    shellOpenUrl,
    shellOpenFolderPath,
    shellMoveItemToTrash,

    copyTextToClipboard

};
