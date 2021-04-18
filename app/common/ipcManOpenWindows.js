/**
 * ipcMan 開啟視窗
 *
 * PS: 2021-04-18 友: 因 macOS 在按下視窗左上角 「X」關閉後，winMain 變數值會被催毀，造成下面程式無法使用，所以改將 winMain 放入 global.winMain 來存取。
 */
const consoleTitle = '[/app/common/ipcManOpenWindows.js]';
const mySecurity = require('./mySecurity');
const {app, BrowserWindow, ipcMain} = require('electron');
const {
    width,
    height,
    rootFolderPath,
    appFolderPath,
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
} = require('./myConfig');   //設定檔 => global.i18n


module.exports = () => {

    /**
     * Renderer頁面發生錯誤時會將錯誤發送至這個事件
     */
    ipcMain.on('errorInWindow', function (event, error, url, line) {
        let consoleTitle2 = consoleTitle + `[ipcMain][errorInWindow]`;
        console.error(consoleTitle2, 'source:', event.sender.getURL());
        console.error(consoleTitle2, error, url, line);
    });


    /**
     * 重新載入伺服器清單 - ok
     */
    ipcMain.on('ipcMain_RenderList', async (event, param1) => {
        let consoleTitle2 = consoleTitle + '[ipcMain][ipcMain_RenderList]';
        console.log(consoleTitle2, 'param1:', param1);

        //PS: 呼叫 /index.html 重新載入 [店家清單] 資料
        global.winMain.webContents.send('ipcRenderer_RenderList', param1);

        global.winMain.show();  //顯示主視窗
    });


    /**
     * 伺服器版本管理 - TODO
     */
    ipcMain.on('openwin_form_server_jar', async (event, params) => {

        let consoleTitle2 = consoleTitle + '[ipcMain.on][openwin_form_server_jar]';
        console.log(consoleTitle2, 'params:', params);
        //....................................................................................
        //PS: 建立視窗
        let childWin = new BrowserWindow({
            backgroundColor: '#ffffff',  //背景色
            width: 600,
            height: 500,
            resizable: true,
            minimizable: false,
            maximizable: false,
            //alwaysOnTop: true,  //將視窗顯示在最上層 (PS: 不可設否則 Win10 Explorer會被蓋在下面)
            parent: global.winMain,    //父層
            //modal: true,        //Modal模式
            webPreferences: {
                devTools: isEnableDevTools,   //關閉開發工具
                contextIsolation: false,
                nodeIntegration: true,
                enableRemoteModule: true   //開啟 Renderer 可以使用 remote 方法
            }
        });
        childWin.setMenu(null);    //隱藏選單
        if (isShowDevTools.form_Friends) childWin.openDevTools();   //開啟 DevTools (Mac - Alt+Command+I)

        //....................................................................................
        //region 註冊事件
        /**
         * 攔截html的視窗標題異動
         */
        childWin.on('page-title-updated', function (e) {
            let constTitle3 = consoleTitle2 + '[childWin.on][page-title-updated]';
            e.preventDefault()
        });
        childWin.setTitle(`${global.i18n.__('WindowTitle.Friends')}`);  //變更視窗標題

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
        const url = `file://${appFolderPath()}/form_server_jar.html`;
        await childWin.loadURL(url);
        //console.log(consoleTitle2, 'done');

    });


    /**
     * 好友管理
     */
    ipcMain.on('openwin_friends', async (event, params) => {

        let consoleTitle2 = consoleTitle + '[ipcMain.on][openwin_friends]';
        console.log(consoleTitle2, 'params:', params);
        //....................................................................................
        //PS: 建立視窗
        let childWin = new BrowserWindow({
            backgroundColor: '#ffffff',  //背景色
            width: 600,
            height: 500,
            resizable: false,
            minimizable: false,
            maximizable: false,
            //alwaysOnTop: true,  //將視窗顯示在最上層 (PS: 不可設否則 Win10 Explorer會被蓋在下面)
            parent: global.winMain,    //父層
            //modal: true,        //Modal模式
            webPreferences: {
                devTools: isEnableDevTools,   //關閉開發工具
                contextIsolation: false,
                nodeIntegration: true,
                enableRemoteModule: true   //開啟 Renderer 可以使用 remote 方法
            }
        });
        childWin.setMenu(null);    //隱藏選單
        if (isShowDevTools.form_Friends) childWin.openDevTools();   //開啟 DevTools (Mac - Alt+Command+I)

        //....................................................................................
        //region 註冊事件
        /**
         * 攔截html的視窗標題異動
         */
        childWin.on('page-title-updated', function (e) {
            let constTitle3 = consoleTitle2 + '[childWin.on][page-title-updated]';
            e.preventDefault()
        });
        childWin.setTitle(`${global.i18n.__('WindowTitle.Friends')}`);  //變更視窗標題

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
            global.winMain.show();

            console.log(constTitle3, 'childWin');

        })
        //endregion
        //....................................................................................
        //PS: 載入主頁面
        const url = `file://${appFolderPath()}/form_friends.html`;
        await childWin.loadURL(url);
        //console.log(consoleTitle2, 'done');

    });


    /**
     * 偏好設定
     */
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
            parent: global.winMain,    //父層
            //modal: true,        //Modal模式
            webPreferences: {
                devTools: isEnableDevTools,   //關閉開發工具
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
        childWin.setTitle(`${global.i18n.__('WindowTitle.Preference')}`);  //變更視窗標題

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
        const url = `file://${appFolderPath()}/form_preference.html`;
        await childWin.loadURL(url);
        console.log(consoleTitle2, 'done');

    })


    /**
     * 開啟 [新增MC伺服器表單] 視窗 - ok
     */
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
            parent: global.winMain,    //父層
            //modal: true,        //Modal模式
            webPreferences: {
                devTools: isEnableDevTools,   //關閉開發工具
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
        childWin.setTitle(`${global.i18n.__('WindowTitle.Server')}`);  //變更視窗標題

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
        const url = `file://${appFolderPath()}/form_setting_server.html`;
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
            parent: global.winMain,    //父層
            //modal: true,        //Modal模式
            webPreferences: {
                devTools: isEnableDevTools,   //關閉開發工具
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
            e.preventDefault();
        });
        childWin.setTitle(`${global.i18n.__('WindowTitle.Map')}`);  //變更視窗標題

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
        const url = `file://${appFolderPath()}/form_setting_server_map.html`;
        await childWin.loadURL(url);

        console.log(consoleTitle2, 'done');

    });


    /**
     * 開popup - 伺服器LOG - ok
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
            maximizable: true,
            //alwaysOnTop: true,  //將視窗顯示在最上層 (PS: 不可設否則 Win10 Explorer會被蓋在下面)
            parent: global.winMain,    //父層
            //modal: true,   //Modal模式
            webPreferences: {
                devTools: isEnableDevTools,   //關閉開發工具
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
        childWin.setTitle(`${global.i18n.__('WindowTitle.Console logs')}`);  //變更視窗標題

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
        const url = `file://${appFolderPath()}/form_view_server_log.html`;
        await childWin.loadURL(url);
        console.log(consoleTitle2, 'done');

    });


}
