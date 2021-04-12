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
const enums = require('./common/enums');
const mySecurity = require('./common/mySecurity');
const myMCServerManager = require('./common/myMCServerManager');  //MC伺服器管理
//....................................................................................
const {
    width,
    height,
    regLocale,
    regAutoUpdater,
    regMenu,
    getPreference,
    migrationDB,
    getMachineResource,
    initDB,
    initLocale,
    isDev,
    isShowDevTools,
    locales
} = require('./config');   //設定檔
regLocale();  //(一次性) 註冊-多國語系

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
//region 渲染進程呼叫主進程

//偏好設定
ipcMain.on('openwin_form_preference', async (event, params) => {

    let consoleTitle2 = consoleTitle + '[ipcMain.on][openwin_form_preference]';
    console.log(consoleTitle2, 'params:', params);
    //....................................................................................
    //PS: 建立視窗
    let childWin = new BrowserWindow({
        backgroundColor: '#ffffff',  //背景色
        width: 500,
        height: 340,
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
    childWin.setTitle(`${i18n.__('Menu.Preference')}`);  //變更視窗標題

    /**
     * 一個框架中的文字載入完成後觸發該事件
     */
    childWin.webContents.on('did-finish-load', (evt) => {

        let consoleTitle3 = consoleTitle2 + '[childWin.on][渲染][did-finish-load]';

        //PS: 傳遞訊息給 Renderer
        childWin.webContents.send('load', {});

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
    const url = `file://${__dirname}/form_preference.html`;
    await childWin.loadURL(url);
    console.log(consoleTitle2, 'done');

})


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

//啟動MC伺服器 - 一般/進階 - ok
ipcMain.on('server_start', async (event, param1) => {

    let server_id = param1.server_id;

    let preference = await getPreference();   //設定檔 - 取 [偏好設定]
    let isAdvance_Server_Start = preference.isAdvance_Server_Start;  //進階啟動

    let consoleTitle2 = consoleTitle + `[ipcMain][server_start][${server_id}]`;
    console.log(consoleTitle2, 'param1:', param1);
    console.log(consoleTitle2, 'preference:', preference);

    let mcServerManager = new myMCServerManager(server_id);   //建立伺服器管理實例
    let mcServerLauncher = await mcServerManager.server();   //取單一伺服器 MCLauncher instance實例

    //PS: 取 db 的 單一伺服器設定資料 (MC伺服器設定值)
    let serverOptions = mcServerLauncher.options;
    let gamerule_keepInventory = serverOptions.gamerule_keepInventory; //開啟防噴
    //console.log(consoleTitle2, `MC伺服器 => serverOptions:`, serverOptions);

    //PS： 進階啟動
    if (isAdvance_Server_Start === 'true') {

        //PS: OPEN MC LOG
        ipcMain.emit('openwin_view_server_log', event, {server_id});

    } else {  //一般啟動

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
                    } else {

                        //PS: 下指令給伺服器
                        //mcServerLauncher.Server.writeServer('/help' + '\n');
                        //mcServerLauncher.Server.writeServer('/list' + '\n');
                        if (gamerule_keepInventory === 'true') {
                            mcServerLauncher.Server.writeServer('/gamerule keepInventory true' + '\n');   //死亡後保留物品欄
                        }

                    }
                    await _doEnd();
                });

            }, 500);
        } else {
            await _doEnd();
        }

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
    //console.log(consoleTitle2, 'event:', event);
    console.log(consoleTitle2, 'param1:', param1);

    let server_id = param1.server_id;  //伺服器

    //新增或修改資料
    let isNew = !mySecurity.isInt(server_id);  //新增或修改資料

    //....................................................................................
    //PS: 建立視窗
    let childWin = new BrowserWindow({
        backgroundColor: '#ffffff',  //背景色
        width: 800,
        height: 400,
        resizable: true,
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
    childWin.setTitle(`Console logs`);  //變更視窗標題

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
            //devTools: false,   //關閉開發工具
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

    })
    //endregion
    //....................................................................................
    //PS: 載入主頁面
    const url = `file://${__dirname}/index.html`;
    //console.log(consoleTitle2, 'winMain 載入:', url);
    await winMain.loadURL(url);

    //....................................................................................
    winMain.show();          //主視窗
    winSplash.close();       //啟動畫面 結束

}
//endregion

//初始化 (可重覆載入)
let init = async () => {

    await splash();              //PS: 啟動畫面
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

        regAutoUpdater(winMain); //(一次性) 初始化自動更新

    }
);  //建立主視窗

//....................................................................................
