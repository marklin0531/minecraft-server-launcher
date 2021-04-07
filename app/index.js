/**
 * Electron - minecraft Server Launcher
 *
 * 圖片縮尺寸: https://promo.com/tools/image-resizer/
 * 圖片淡化: https://www.peko-step.com/en/tool/alphachannel_en.html
 *
 * 2021-03-25 友
 */
const consoleTitle = '[/app/index.js]';
const {app, BrowserWindow, Menu, ipcMain} = require('electron');
const {is} = require('electron-util');    //https://github.com/sindresorhus/electron-util
const enums = require('./common/enums');
const mySecurity = require('./common/mySecurity');
const MyDB = require('./common/mydb');                            //初始化資料庫
const myMachineResource = require('./common/myMachineResource');  //取主機資源
const myMCServerManager = require('./common/myMCServerManager');  //MC伺服器管理

//PS: 以Github當升級來源-範本: https://github.com/iffy/electron-updater-example
const {autoUpdater} = require('electron-updater');
require('./common/autoUpdater');

//....................................................................................
//主視窗設定參數
const width = 1280;
const height = 720;
let winMain = null;   //主進程視窗

//是否顯示開發者工具
let isShowDevTools = {
    winMain: false,      //主視窗
    menu: false,         //選單
    form_Server: false,  //表單-新增/修改 MC伺服器
    form_Map: false,     //表單-新增/修改 MC伺服器地圖
    form_Log: false      //表單-顯示 MC伺服器Log
}
// isShowDevTools.winMain = true;
// isShowDevTools.menu = true;
// isShowDevTools.form_Server = true;
// isShowDevTools.form_Map = true;
// isShowDevTools.form_Log = true;

//....................................................................................
//region APP 監聽

/**
 * 全部視窗都關閉時觸發
 */
app.on('window-all-closed', () => {
    console.log(consoleTitle, '[app] window-all-closed');
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

/**
 * 重新啟動時觸發
 */
app.on('activate', () => {
    console.log(consoleTitle, '[app] activate');
    if (BrowserWindow.getAllWindows().length === 0) {
        //createWindow()
        createMain();
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
//region 渲染進程呼叫主進程
//....................................................................................
//呼叫 /index.html 重新載入 [伺服器清單] 資料
let RenderList = (params) => {

    let consoleTitle2 = consoleTitle + '[RenderList]';
    console.log(consoleTitle2, 'params:', params);

    //PS: 呼叫 /index.html 重新載入 [店家清單] 資料
    winMain.webContents.send('ipcRenderer_RenderList', `from [${consoleTitle2}]`);

}

//重新載入伺服器清單 - ok
//call: /app/form_store.html
ipcMain.on('ipcMain_RenderList', async (event, param1) => {
    let consoleTitle2 = consoleTitle + '[ipcMain][ipcMain_RenderList]';
    console.log(consoleTitle2, 'param1:', param1);
    RenderList(param1);  //Reload Data
    winMain.show();  //顯示主視窗
});

ipcMain.on('errorInWindow', function (event, error, url, line) {
    let consoleTitle2 = consoleTitle + `[ipcMain][errorInWindow]`;
    console.error(consoleTitle2, 'source:', event.sender.getURL());
    console.error(consoleTitle2, error, url, line);
});


//region MC伺服器操作 - Start, Stop, Restart, Stats

//MC伺服器使用的資源 - ok
ipcMain.on('server_stats', async (event, param1) => {

    let server_id = param1.server_id;

    let consoleTitle2 = consoleTitle + `[ipcMain][server_stats][${server_id}]`;
    console.log(consoleTitle2, 'param1:', param1);

    let mcServerManager = new myMCServerManager(server_id);   //建立伺服器管理實例
    let _mcServerLauncher = await mcServerManager.server();   //PS: 取單一伺服器啟動器實例

    if (_mcServerLauncher.isRunning) {
        let _stats = await _mcServerLauncher.stats();
        console.log(consoleTitle2, '_stats:', _stats);
    }

});


//啟動MC伺服器 - ok
ipcMain.on('server_start', async (event, param1) => {

    let server_id = param1.server_id;

    let consoleTitle2 = consoleTitle + `[ipcMain][server_start][${server_id}]`;
    console.log(consoleTitle2, 'param1:', param1);

    let mcServerManager = new myMCServerManager(server_id);   //建立伺服器管理實例
    mcServerManager.progressBarText.show('啟動伺服器中...');

    let _mcServerLauncher = await mcServerManager.server();   //PS: 取單一伺服器啟動器實例
    console.log(consoleTitle2, '_mcServerLauncher:', _mcServerLauncher);

    let _msg = `成功啟動了伺服器`;

    let _doEnd = async () => {
        mcServerManager.progressBarText.show(_msg);
        setTimeout(() => mcServerManager.progressBarText.hide(), 1500);

        //PS: 重新載入清單
        await RenderList(param1);
    }

    if (!_mcServerLauncher.isRunning) {
        setTimeout(async () => {

            //PS: Launcher啟動伺服器
            _mcServerLauncher.start(async function (err) {
                if (err) {
                    console.log(consoleTitle2, err);
                    mcServerManager.progressBarText.show(`啟動伺服器失敗`);
                }
                await _doEnd();
            });

        }, 500);
    } else {
        await _doEnd();
    }

});


//停止MC伺服器 - ok
ipcMain.on('server_stop', async (event, param1) => {

    let server_id = param1.server_id;

    let consoleTitle2 = consoleTitle + `[ipcMain][server_stop][${server_id}]`;
    console.log(consoleTitle2, 'param1:', param1);

    let mcServerManager = new myMCServerManager(server_id);   //建立伺服器管理實例
    mcServerManager.progressBarText.show('停止伺服器中...');

    let _mcServerLauncher = await mcServerManager.server();   //PS: 取單一伺服器啟動器實例

    let _msg = `成功結束了伺服器`;

    let _doEnd = async () => {
        mcServerManager.progressBarText.show(_msg);
        setTimeout(() => mcServerManager.progressBarText.hide(), 1500);

        //PS: 重新載入清單
        await RenderList(param1);
    }

    if (_mcServerLauncher.isRunning) {
        setTimeout(async () => {

            //PS: Launcher停止伺服器
            _mcServerLauncher.stop(async function (err) {
                if (err) {
                    console.log(consoleTitle2, err);
                    mcServerManager.progressBarText.show(`停止伺服器失敗`);
                }
                await _doEnd();
            });

        }, 500);
    } else {
        await _doEnd();
    }

});


//重啟MC伺服器  ok
ipcMain.on('server_restart', async (event, param1) => {

    let server_id = param1.server_id;

    let consoleTitle2 = consoleTitle + `[ipcMain][server_restart][${server_id}]`;
    console.log(consoleTitle2, 'param1:', param1);

    let mcServerManager = new myMCServerManager(server_id);   //建立伺服器管理實例
    mcServerManager.progressBarText.show('重啟伺服器中...');

    let _mcServerLauncher = await mcServerManager.server();   //PS: 取單一伺服器啟動器實例
    let _msg = `重新啟動了伺服器`;

    let _doEnd = async () => {
        mcServerManager.progressBarText.show(_msg);
        setTimeout(() => mcServerManager.progressBarText.hide(), 1500);

        //PS: 重新載入清單
        await RenderList(param1);
    }

    //PS: 先停
    let _stop = await (new Promise((resolve, reject) => {
        if (_mcServerLauncher.isRunning) {
            //PS: Launcher停止伺服器
            console.log(consoleTitle2, `停止伺服器中...`);
            _mcServerLauncher.stop(async function (err) {
                if (err) {
                    console.log(consoleTitle2, `結束伺服器時發生錯誤: ${err.message}`);
                    return resolve(false);
                }
                console.log(consoleTitle2, `成功結束了伺服器`);
                return resolve(true);
            });
        } else {
            return resolve(true);
        }
    }));

    //PS: 再啟動
    let _start = await (new Promise((resolve, reject) => {
        //PS: Launcher啟動伺服器
        console.log(consoleTitle2, `啟動伺服器中...`);
        _mcServerLauncher.start(async function (err) {
            if (err) {
                console.log(consoleTitle2, `啟動伺服器時發生錯誤: ${err.message}`);
                return resolve(false);
            }
            console.log(consoleTitle2, `成功啟動了伺服器`);
            return resolve(true);
        });
    }));

    if (!_start) _msg = `無法重新啟動伺服器`;
    await _doEnd();

});

//endregion


//region MC伺服器表單 - 新增, 地圖, Log

//開啟 [新增MC伺服器表單] 視窗 - ok
//call: /index.html
ipcMain.on('openwin_setting_server', async (event, param1) => {

    let consoleTitle2 = consoleTitle + '[ipcMain][openwin_setting_server]';
    console.log(consoleTitle2, 'param1:', param1);

    let server_id = param1.server_id;  //伺服器
    let isNew = !mySecurity.isInt(server_id);  //新增或修改資料

    //....................................................................................
    //PS: 建立視窗
    let childWin = new BrowserWindow({
        backgroundColor: '#ffffff',  //背景色
        width: 500,
        height: height,
        resizable: false,
        minimizable: false,
        maximizable: false,
        //alwaysOnTop: true,  //將視窗顯示在最上層 (PS: 不可設否則 Win10 Explorer會被蓋在下面)
        parent: winMain,    //父層
        //modal: true,        //Modal模式
        webPreferences: {
            //devTools: false,   //關閉開發工具
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true   //開啟 Renderer 可以使用 remote 方法
        }
    });

    childWin.setMenu(null);    //隱藏選單
    if (isShowDevTools.form_Server) childWin.openDevTools();   //開啟 DevTools (Mac - Alt+Command+I)

    //....................................................................................
    //region 註冊事件
    /**
     * 攔截html的視窗標題異動
     */
    childWin.on('page-title-updated', function (e) {
        let constTitle3 = consoleTitle2 + '[childWin.on][page-title-updated]';
        //console.log(constTitle3);
        e.preventDefault()
    });
    childWin.setTitle(`${enums.project.title} - ${isNew ? '新增' : '修改'}伺服器`);  //變更視窗標題

    /**
     * 一個框架中的文字載入完成後觸發該事件
     */
    childWin.webContents.on('did-finish-load', (evt) => {

        let consoleTitle3 = consoleTitle2 + '[childWin.on][渲染][did-finish-load]';

        //PS: 傳遞訊息給 Renderer
        childWin.webContents.send('load', {server_id});

    });

    //視窗關閉
    childWin.on('closed', () => {

        let constTitle3 = consoleTitle2 + '[childWin.on][closed]';

        childWin = null;
        console.log(constTitle3, 'childWin');

    })
    //endregion
    //....................................................................................
    //PS: 載入主頁面
    const url = `file://${__dirname}/form_setting_server.html`;
    await childWin.loadURL(url);
    console.log(consoleTitle2, 'done');

});


/**
 * 開popup - 設定MC伺服器地圖 - ok
 */
ipcMain.on('openwin_setting_server_map', async (event, param1) => {

    let consoleTitle2 = consoleTitle + '[ipcMain][openwin_setting_server_map]';
    console.log(consoleTitle2, 'param1:', param1);

    let server_id = param1.server_id;  //伺服器
    let isNew = !mySecurity.isInt(server_id);  //新增或修改資料

    //....................................................................................
    //PS: 建立視窗
    let childWin = new BrowserWindow({
        backgroundColor: '#ffffff',  //背景色
        width: 700,
        height: 500,
        resizable: false,
        minimizable: false,
        maximizable: false,
        //alwaysOnTop: true,  //將視窗顯示在最上層 (PS: 不可設否則 Win10 Explorer會被蓋在下面)
        parent: winMain,    //父層
        //modal: true,        //Modal模式
        webPreferences: {
            //devTools: false,   //關閉開發工具
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true   //開啟 Renderer 可以使用 remote 方法
        }
    });

    childWin.setMenu(null);    //隱藏選單
    if (isShowDevTools.form_Map) childWin.openDevTools();   //開啟 DevTools (Mac - Alt+Command+I)

    //....................................................................................
    //region 註冊事件
    /**
     * 攔截html的視窗標題異動
     */
    childWin.on('page-title-updated', function (e) {
        let constTitle3 = consoleTitle2 + '[childWin.on][page-title-updated]';
        //console.log(constTitle3);
        e.preventDefault();
    });
    childWin.setTitle(`${enums.project.title} - 設定伺服器地圖`);  //變更視窗標題

    /**
     * 一個框架中的文字載入完成後觸發該事件
     */
    childWin.webContents.on('did-finish-load', (evt) => {

        let consoleTitle3 = consoleTitle2 + '[childWin.on][渲染][did-finish-load]';

        //PS: 傳遞訊息給 Renderer
        childWin.webContents.send('load', {server_id});

    });

    //視窗關閉
    childWin.on('closed', () => {

        let constTitle3 = consoleTitle2 + '[childWin.on][closed]';

        childWin = null;
        console.log(constTitle3, 'childWin');

    })
    //endregion
    //....................................................................................
    //PS: 載入主頁面
    const url = `file://${__dirname}/form_setting_server_map.html`;
    await childWin.loadURL(url);

    console.log(consoleTitle2, 'done');

});


/**
 * 開popup - 伺服器LOG - TODO
 */
ipcMain.on('openwin_view_server_log', async (event, param1) => {

    let consoleTitle2 = consoleTitle + '[ipcMain][openwin_view_server_log]';
    console.log(consoleTitle2, 'param1:', param1);

    let server_id = param1.server_id;  //伺服器

    //新增或修改資料
    let isNew = !mySecurity.isInt(server_id);  //新增或修改資料

    //....................................................................................
    //PS: 建立視窗
    let childWin = new BrowserWindow({
        backgroundColor: '#ffffff',  //背景色
        width: 500,
        height: height,
        resizable: false,
        minimizable: false,
        maximizable: false,
        //alwaysOnTop: true,  //將視窗顯示在最上層 (PS: 不可設否則 Win10 Explorer會被蓋在下面)
        parent: winMain,    //父層
        //modal: true,   //Modal模式
        webPreferences: {
            //devTools: false,   //關閉開發工具
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true   //開啟 Renderer 可以使用 remote 方法
        }
    });

    childWin.setMenu(null);    //隱藏選單
    if (isShowDevTools.form_Log) childWin.openDevTools();   //開啟 DevTools (Mac - Alt+Command+I)

    //....................................................................................
    //region 註冊事件
    /**
     * 攔截html的視窗標題異動
     */
    childWin.on('page-title-updated', function (e) {
        let constTitle3 = consoleTitle2 + '[childWin.on][page-title-updated]';
        //console.log(constTitle3);
        e.preventDefault()
    });
    childWin.setTitle(`${enums.project.title} - ${isNew ? '新增' : '修改'}伺服器LOG`);  //變更視窗標題

    /**
     * 一個框架中的文字載入完成後觸發該事件
     */
    childWin.webContents.on('did-finish-load', (evt) => {

        let consoleTitle3 = consoleTitle2 + '[childWin.on][渲染][did-finish-load]';

        //PS: 傳遞訊息給 Renderer
        childWin.webContents.send('load', {server_id});

    });

    //視窗關閉
    childWin.on('closed', () => {

        let constTitle3 = consoleTitle2 + '[childWin.on][closed]';

        childWin = null;
        console.log(constTitle3, 'childWin');

    })
    //endregion
    //....................................................................................
    //PS: 載入主頁面
    const url = `file://${__dirname}/form_view_server_log.html`;
    await childWin.loadURL(url);
    console.log(consoleTitle2, 'done');

});

//endregion

//endregion

//....................................................................................
//region 初始化

/**
 * 初始化 資料庫 - ok
 */
let initDBSetting = async () => {

    let consoleTitle2 = consoleTitle + '[initDBSetting]';

    console.log(consoleTitle2, '開啟資料庫連線');
    const mydb = new MyDB(app);  //初始化
    await mydb.open();              //開啟資料庫連線
    await mydb.migrationCheck();    //DB migration 檢查

    return mydb;

}

/**
 * 初始化 選單
 */
let initMenu = () => {

    let consoleTitle2 = consoleTitle + '[initMenu]';
    //console.log(consoleTitle2);

    const isMac = process.platform === 'darwin';

    /**
     * 註冊鍵盤快捷鍵
     * 其中：label: '切換開發者工具',這個可以在釋出時註釋掉
     */
    let submenu_devtool = {
        label: '切換開發者工具',
        visible: isShowDevTools.menu,  //是否顯示
        accelerator: (function () {
            if (process.platform === 'darwin') {
                return 'Alt+Command+I'
            } else {
                return 'Ctrl+Shift+I'
            }
        })(),
        click: function (item, focusedWindow) {
            if (focusedWindow) {
                focusedWindow.toggleDevTools()
            }
        }
    }

    let submenu_autoUpdate = {
        label: '檢查更新',
        click: function (item, focusedWindow) {
            autoUpdater.checkForUpdates();
        }
    }

    let template = [
        // { role: 'appMenu' }
        ...(isMac ? [{
            label: '選單',
            submenu: [
                {role: 'about', label: '關於'},
                //submenu_autoUpdate,
                {type: 'separator'},
                {role: 'services'},
                submenu_devtool,
                {type: 'separator'},
                {role: 'quit', label: '離開'}
            ]
        }] : [{
            label: '選單',
            submenu: [
                {role: 'about', label: '關於'},
                //submenu_autoUpdate,
                submenu_devtool,
                {type: 'separator'},
                {role: 'quit', label: '結束'}
            ]
        }])
    ];

    //if (!global.isDev) {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu) // 設定選單部分
    //}

}

//endregion

//....................................................................................
//region TODO: 自動升級

// autoUpdater.on('download-progress', function (progressObj) {
//     winMain.setProgressBar(progressObj.percent.toFixed(2) / 100);
//     winMain.setTitle('已下载：' + progressObj.percent.toFixed(2) + '%')
// });

//autoUpdater.checkForUpdates();

//....................................................................................
//region Loading 視窗

let winSplash = null;

const splash = async () => {

    let consoleTitle2 = consoleTitle + '[splash]';

    let id = mySecurity.getRandom(0, 2);  //取0~2的數字
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
            //devTools: false,   //關閉開發工具
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
const createMain = async () => {

    let constTitle2 = consoleTitle + '[createMain]';

    //PS: 啟動畫面
    await splash();

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
            //devTools: false,   //關閉開發工具
            contextIsolation: false,
            nodeIntegration: true,
            enableRemoteModule: true   //開啟 Renderer 可以使用 remote 方法
        }
    });
    if (isShowDevTools.winMain) winMain.openDevTools();  //開啟 DevTools (Mac - Alt+Command+I)

    //....................................................................................
    //region PS: 註冊事件
    /**
     * 攔截html的視窗標題異動
     */
    winMain.on('page-title-updated', function (e) {
        let constTitle3 = consoleTitle + '[winMain.on][page-title-updated]';
        e.preventDefault();
    });
    winMain.setTitle(`${enums.project.title}`);  //變更視窗標題

    //視窗關閉
    winMain.on('closed', () => {

        let constTitle3 = consoleTitle + '[winMain.on][closed]';

        //關閉所有子視窗
        for (let window of BrowserWindow.getAllWindows()) {
            if (window !== winMain) window.close();
        }

        //關閉DB連線
        global.MyDB.close();

        winMain = null;
        //console.log(constTitle3, 'winMain');

    })

    //endregion

    //....................................................................................
    /**
     * 初始化 / 共用變數 - (TODO: 改在 splash 執行)
     */
    global.MyDB = await initDBSetting();  //建立資料表,Demo Account, DB物件放入共用區
    global.isDev = is.development;                //開發與正式環境偵測
    global.machineResource = await myMachineResource.getMachineResource();  //取主機資源

    //....................................................................................
    //PS: 載入主頁面
    const url = `file://${__dirname}/index.html`;
    //console.log(constTitle2, 'winMain 載入:', url);
    await winMain.loadURL(url);

    //....................................................................................
    initMenu();          //初始化選單
    winMain.show();      //主視窗
    winSplash.close();   //啟動畫面 結束

}
//endregion

app.whenReady().then(createMain);  //建立主視窗

//....................................................................................
