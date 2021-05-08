/**
 * Electron - minecraft Server Launcher
 *
 * 圖片縮尺寸: https://promo.com/tools/image-resizer/
 * 圖片淡化: https://www.peko-step.com/en/tool/alphachannel_en.html
 *
 * 2021-03-25 友
 */
const consoleTitle = '[/app/index.js]';
const {app, BrowserWindow, ipcMain} = require('electron');
app.commandLine.appendSwitch("disable-renderer-backgrounding");  //2021-04-13 背景中仍不降低性能 - https://pracucci.com/electron-slow-background-performances.html
//....................................................................................
const {
    appTitle,
    width,
    height,
    loadOnlineConfig,
    find_java_home,
    regLocale,
    regAutoUpdater,
    regMenu,
    getPreference,
    migrationDB,
    getMachineResource,
    initDB,
    initLocale,
    isEnableDevTools,
    isShowDevTools,
    locales
} = require('./common/myConfig');   //設定檔 => global.i18n
regLocale();  //(一次性) 註冊-多國語系

require('./common/ipcManMCServer');    //註冊ipcMan事件
const ipcManOpenWindows = require('./common/ipcManOpenWindows');  //註冊Renderer事件
const mySecurity = require('./common/mySecurity');
const {createBrowserWindows} = require('./common/myElectron');
//....................................................................................
//region APP 監聽

/**
 * 全部視窗都關閉時觸發
 */
app.on('window-all-closed', () => {
    console.log(consoleTitle, '[app.on] window-all-closed');
    if (process.platform !== 'darwin') {
        app.quit();  //before-quit event will be emitted first
    }
})

/**
 * 重新啟動時觸發
 */
app.on('activate', async () => {
    console.log(consoleTitle, '[app.on] activate');

    //PS: 程式內的寫法需注意如果有 [註冊事件] ,在重啟時是否會重覆註冊的情況.

    if (BrowserWindow.getAllWindows().length === 0) {
        await init();        //初始化 Splash, DB, Resource...
        await createMain();  //初始化主視窗
    }
})


//PS: electron-context-menu 右鍵選單 就是使用此事件注入選單 (每個 BrowserWindow 都會有)
app.on('browser-window-created', (event, win) => {
    //console.log(consoleTitle, '[browser-window-created] win:', win);
});

//PS: cmd+Q 結束之前
app.on('before-quit', (event) => {
    console.log(consoleTitle, '[before-quit]');
    //event.preventDefault();   //預防 cmd+Q
});

//endregion
//....................................................................................
//region 攔截錯誤事件

process.on('SIGINT', (e) => {
    console.log(`[SIGINT]`, e);
});

process.on("uncaughtException", (e) => {
    console.error(consoleTitle, `[uncaughtException]`, e);
});

process.on("unhandledRejection", (e) => {
    console.error(consoleTitle, `[unhandledRejection]`, e);
});

//endregion
//....................................................................................
//region Splash視窗

let winSplash = null;
const splash = async () => {

    let consoleTitle2 = consoleTitle + '[splash]';

    let id = mySecurity.getRandom(0, 2);  //隨機取0~2的數字
    //console.log(consoleTitle2, `id:`, id);

    let splashData = [
        {
            id: 0,
            w: 306,
            h: 430
        },
        {
            id: 1,
            w: 376,
            h: 212
        },
        {
            id: 2,
            w: 550,
            h: 386
        }
    ]

    let _w = splashData[id].w;
    let _h = splashData[id].h;

    winSplash = await createBrowserWindows({
        winName: 'splash',       //視窗名稱
        winTitle: null,          //視窗標題
        url: `file://${__dirname}/splash-${id}.html`,  //視窗載入檔的路徑

        frame: false,      //無邊框
        show: true,        //視窗顯示
        hideMenu: true,    //選單不隱藏
        parent: null,      //父層BrowserWindow

        width: _w,         //視窗寬
        height: _h,        //視窗高
        minWidth: _w,      //視窗最小寬
        minHeight: _h,     //視窗最小高

        resizable: false,   //視窗縮放大小
        minimizable: false, //視窗最小化
        maximizable: false, //視窗最大化

        alwaysOnTop: true,  //視窗顯示於最上層
        modal: false,       //視窗設為Modal

        backgroundColor: '#ffffff',  //視窗背景色
        isEnableDevTools: false,     //關閉開發工具
        openDevTools: false,         //是否開啟開發工具視窗

        //視窗載入
        onLoad: function (event) {
            let consoleTitle3 = consoleTitle2 + '[win.on][did-finish-load]';
            //console.log(consoleTitle3, 'this:', this);
        },
        //視窗關閉
        onClose: function () {
            let consoleTitle3 = consoleTitle2 + '[win.on][close]';
            //console.log(consoleTitle3, 'this:', this);
            //console.log(consoleTitle3, 'this.win:', this.win);
        }
    })

}

//endregion
//....................................................................................
//region 主視窗

let winMain = null;   //主進程視窗
const createMain = async () => {

    let consoleTitle2 = consoleTitle + '[createMain]';
    console.log(consoleTitle2);

    let winName = 'index';                   //視窗名稱
    winMain = await createBrowserWindows({
        winName: winName,                       //視窗名稱
        winTitle: `${appTitle}`,                //視窗標題
        url: `file://${__dirname}/index.html`,  //視窗載入檔的路徑

        show: false,       //視窗先隱藏
        hideMenu: false,   //選單不隱藏
        parent: null,      //父層BrowserWindow

        width: width,             //視窗寬
        height: height,           //視窗高
        minWidth: width / 2.5,    //視窗最小寬
        minHeight: height / 1.5,  //視窗最小高

        resizable: true,   //視窗縮放大小
        minimizable: true, //視窗最小化
        maximizable: true, //視窗最大化

        alwaysOnTop: false,  //視窗顯示於最上層
        modal: false,        //視窗設為Modal

        backgroundColor: '#ffffff',  //視窗背景色
        isEnableDevTools,   //關閉開發工具
        openDevTools: isShowDevTools[winName],  //是否開啟開發工具視窗

        //視窗載入
        onLoad: function (event) {

            let consoleTitle3 = consoleTitle2 + '[winMain.on][did-finish-load]';
            //console.log(consoleTitle3, 'this:', this);

            //PS: (X) 載入清單 - 2021-04-16 改用觸發事件
            //ipcMain.emit('ipcMain_RenderList', event, {});

            //PS: 2021-04-18 改用傳遞訊息給 Renderer: index.html
            this.win.webContents.send('load', {});

        },
        //視窗關閉
        onClose: function () {

            let consoleTitle3 = consoleTitle2 + '[winMain.on][close]';
            //console.log(consoleTitle3, 'this:', this);
            //console.log(consoleTitle3, 'this.win:', this.win);
            //console.log(consoleTitle3, 'global.winMain:', global.winMain);

            //關閉所有子視窗
            for (let window of BrowserWindow.getAllWindows()) {
                if (window !== global.winMain) window.close();
            }

            //關閉DB連線
            global.MyDB.close();

            //催毀自己 (其實BrowserWindow自己會催毀)
            global.winMain = null;

        }
    })
    //....................................................................................
    global.winMain = winMain; //放入全域，讓 ipcManOpenWinndows.js/myAutoUpdater.js 使用
    winMain.show();           //主視窗
    winSplash.close();        //啟動畫面 結束

}
//endregion
//....................................................................................
//初始化 (可重覆載入)
let init = async () => {

    await splash();              //PS: 啟動畫面

    await loadOnlineConfig();    //PS: 讀取放在線上的 Github 倉庫內的設定檔 config.json
    find_java_home();            //找尋系統內是否有安裝 java

    await initDB(app);           //建立資料表, Migration, Setting讀取
    await migrationDB();         //資料庫升級檢查
    await initLocale();          //初始化 語系,載入使用者選擇的語系
    await getMachineResource();  //取主機資源: Public Ip, Private Ip, MemoryInfo, CpuInfo
    regMenu();                   //註冊選單

}

app.whenReady().then(async () => {

        //PS: APP activate 重新啟動時也會呼叫
        await init();        //初始化 Splash, DB, Resource...
        await createMain();  //初始化主視窗

        ipcManOpenWindows(); //註冊監聽

        regAutoUpdater();    //(一次性) 初始化自動更新

    }
);  //建立主視窗
//....................................................................................
