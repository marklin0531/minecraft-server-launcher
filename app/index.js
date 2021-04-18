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
const ipcManOpenWindows = require('./common/ipcManOpenWindows');
const ipcManMCServer = require('./common/ipcManMCServer');
const enums = require('./common/enums');
const mySecurity = require('./common/mySecurity');
//....................................................................................
const {
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
    isDev,
    isEnableDevTools,
    isShowDevTools,
    locales
} = require('./common/myConfig');   //設定檔 => global.i18n
regLocale();  //(一次性) 註冊-多國語系

//2021-04-13 背景中仍不降低性能 - https://pracucci.com/electron-slow-background-performances.html
app.commandLine.appendSwitch("disable-renderer-backgrounding");
//....................................................................................
//region APP 監聽

/**
 * 全部視窗都關閉時觸發
 */
app.on('window-all-closed', () => {
    console.log(consoleTitle, '[app] window-all-closed');
    if (process.platform !== 'darwin') {
        app.quit();  //before-quit event will be emitted first
    }
})

/**
 * 重新啟動時觸發
 */
app.on('activate', async () => {
    console.log(consoleTitle, '[app] activate');

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
//region Loading 視窗

let winSplash = null;
const splash = async () => {

    let consoleTitle2 = consoleTitle + '[splash]';

    let id = mySecurity.getRandom(0, 2);  //隨機取0~2的數字
    console.log(consoleTitle2, `id:`, id);

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

    winSplash = new BrowserWindow({
        backgroundColor: '#ffffff',  //背景色
        width: splashData[id].w,
        height: splashData[id].h,
        frame: false,       //無框
        resizable: false,   //不可改變視窗大小
        alwaysOnTop: true,  //將視窗顯示在最上層
        //parent: winMain,    //父層
        //modal: true,       //Modal模式
        webPreferences: {
            devTools: isEnableDevTools,   //關閉開發工具
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true   //開啟 Renderer 可以使用 remote 方法
        }
    });

    //視窗關閉
    winSplash.on('closed', () => {
        let constTitle3 = consoleTitle2 + '[winSplash.on][closed]';
        winSplash = null;
        //console.log(constTitle3, 'winSplash');
    })

    //PS: 載入主頁面
    const url = `file://${__dirname}/splash-${id}.html`;
    //console.log(consoleTitle2, 'winSplash 載入:', url);
    await winSplash.loadURL(url);

}

//endregion

//....................................................................................
//region 主視窗

let winMain = null;   //主進程視窗
const createMain = async () => {

    let consoleTitle2 = consoleTitle + '[createMain]';
    console.log(consoleTitle2);

    //....................................................................................
    //PS: 建立視窗
    winMain = new BrowserWindow({
        backgroundColor: '#ffffff',  //背景色
        width: width,
        height: height,
        minWidth: width / 2.5,    //最小寬
        minHeight: height / 1.5,  //最小高
        show: false,    //先隱藏
        webPreferences: {
            devTools: isEnableDevTools,   //關閉開發工具
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true   //開啟 Renderer 可以使用 remote 方法
        }
    });
    //winMain.setMenu(null);    //隱藏選單 (macOS 不會消失，win10會消失)
    if (isShowDevTools.winMain) winMain.openDevTools();  //開啟 DevTools (Mac - Alt+Command+I)

    //....................................................................................
    //region PS: 註冊事件
    /**
     * 攔截html的視窗標題異動
     */
    winMain.on('page-title-updated', function (e) {
        let constTitle3 = consoleTitle2 + '[winMain.on][page-title-updated]';
        e.preventDefault();
    });
    winMain.setTitle(`${enums.project.title}`);  //變更視窗標題

    //視窗關閉
    winMain.on('closed', () => {

        let constTitle3 = consoleTitle2 + '[winMain.on][closed]';

        //關閉所有子視窗
        for (let window of BrowserWindow.getAllWindows()) {
            if (window !== winMain) window.close();
        }

        //關閉DB連線
        global.MyDB.close();

        winMain = null;
        //console.log(constTitle3, 'winMain');

    });

    /**
     * 一個框架中的文字載入完成後觸發該事件
     */
    winMain.webContents.on('did-finish-load', async (event) => {

        let consoleTitle3 = consoleTitle2 + '[winMain.on][渲染][did-finish-load]';

        //PS: (X) 載入清單 - 2021-04-16 改用觸發事件
        //ipcMain.emit('ipcMain_RenderList', event, {});

        //PS: 2021-04-18 改用傳遞訊息給 Renderer
        winMain.webContents.send('load', {});

    });
    //endregion
    //....................................................................................
    //PS: 載入主頁面
    const url = `file://${__dirname}/index.html`;
    //console.log(consoleTitle2, 'winMain 載入:', url);
    await winMain.loadURL(url);

    //....................................................................................
    global.winMain = winMain; //放入全域，讓 ipcManOpenWinndows.js/myAutoUpdater.js 使用
    winMain.show();           //主視窗
    winSplash.close();        //啟動畫面 結束

}
//endregion

//初始化 (可重覆載入)
let init = async () => {

    await splash();              //PS: 啟動畫面

    await loadOnlineConfig();    //讀取線上的設定檔
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
