/**
 * 註冊ipcMan事件 - 開啟視窗
 *
 * PS: 2021-04-18 友: 因 macOS 在按下視窗左上角 「X」關閉後，winMain 變數值會被催毀，造成下面程式無法使用，所以改將 winMain 放入 global.winMain 來存取。
 */
const consoleTitle = '[/app/common/ipcManOpenWindows.js]';
const path = require('path');
var rimraf = require("rimraf");   //移除目錄
const {app, BrowserWindow, ipcMain} = require('electron');
require('@electron/remote/main').initialize();
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
    isEnableDevTools,
    isShowDevTools,
    locales,
    browserWindows,
    serverVersionsCheckFileExist
} = require('./myConfig');   //設定檔 => global.i18n

const {createBrowserWindows} = require('./myElectron');
const myMapDownloader = require('./myMapDownloader');   //地圖下載
const myMCDownloader = require('./myMCDownloader');     //伺服器下載


const reloadHomePage = (param) => {
    //PS: 呼叫 /index.html Renderer 重新載入 [店家清單] 資料
    global.winMain.webContents.send('load', param);
}


module.exports = () => {

    //region init

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
     *
     * call: 給 .html 呼叫
     */
    ipcMain.on('ipcMain_RenderList', async (event, param1) => {
        let consoleTitle2 = consoleTitle + '[ipcMain][ipcMain_RenderList]';
        console.log(consoleTitle2, 'param1:', param1);

        //PS: 呼叫 /index.html Renderer 重新載入 [店家清單] 資料
        //global.winMain.webContents.send('load', param1);
        reloadHomePage(param1);
        global.winMain.show();  //顯示主視窗
    });
    //endregion


    //region -- [其它執行類] --


    /**
     * 移除 伺服器JAR檔案 - ok
     *
     * call: /app/form_server_jar.html
     */
    ipcMain.on('ipcMain_jar_remove', async (event, params) => {

        let consoleTitle2 = consoleTitle + '[ipcMain][ipcMain_jar_remove]';
        console.log(consoleTitle2, 'params:', params);

        //----------------------
        //PS: 讀取 JAR 設定檔
        let _id = params._id;

        const _version = global.config.versions[_id];
        let server = _version.s;      //伺服器類型: Vanilla
        let version = _version.v;     //伺服器版本: 1.16.5
        let hasJar = _version.hasJar; //true, false
        let jarFilePath = _version.jar; //Jar Path

        //----------------------
        //PS: 移除 JAR 檔案 - ok
        console.log(consoleTitle2, '[移除JAR檔案] jarFilePath:', jarFilePath);
        rimraf.sync(jarFilePath);

        let removeResult = true;  //移除成功

        if (removeResult) {
            serverVersionsCheckFileExist();   //PS: 重新檢測檔案是否存在
            reloadHomePage();  //PS: 呼叫 /index.html Renderer 重新載入 [店家清單] 資料
        }

        //----------------------
        //PS: 回覆 ipcRenderer.sendSync()
        console.log(consoleTitle2, '回覆 ipcRenderer.sendSync() => removeResult:', removeResult);
        event.returnValue = removeResult;  //PS: 回傳給 ipcRenderer.sendSync() => true=成功

    });


    /**
     * 下載 伺服器JAR檔案 - ok
     *
     * call: /app/form_server_jar.html
     */
    ipcMain.on('ipcMain_jar_install', async (event, params) => {

        let consoleTitle2 = consoleTitle + '[ipcMain][ipcMain_jar_install]';
        console.log(consoleTitle2, 'params:', params);

        //----------------------
        //PS: 讀取 JAR 設定檔
        let _id = params._id;

        const _version = global.config.versions[_id];
        let server = _version.s;      //伺服器類型: Vanilla
        let version = _version.v;     //伺服器版本: 1.16.5
        let hasJar = _version.hasJar; //true, false
        let save_path = _version.jar; //Jar Path

        //----------------------
        //PS: 下載 伺服器JAR 檔案
        let downloadResult = await myMCDownloader.downloadAndInstall(server, version, save_path);

        if (downloadResult) {
            serverVersionsCheckFileExist();   //PS: 重新檢測檔案是否存在
            reloadHomePage();  //PS: 呼叫 /index.html Renderer 重新載入 [店家清單] 資料
        }

        //----------------------
        //PS: 回覆 ipcRenderer.sendSync()
        console.log(consoleTitle2, '回覆 ipcRenderer.sendSync() => downloadResult:', downloadResult);
        event.returnValue = downloadResult;  //PS: 回傳給 ipcRenderer.sendSync() => true=Success下載成功

    });

    /**
     * 下載地圖zip檔 - ok
     *
     * call: /app/form_map_list.html
     */
    ipcMain.on('ipcMain_map_download', async (event, params) => {

        let consoleTitle2 = consoleTitle + '[ipcMain][ipcMain_map_download]';
        console.log(consoleTitle2, 'params:', params);

        const server_id = params.SERVER_DATA.server_id;      //伺服器ID
        const server_version = params.SERVER_DATA.version;   //伺服器版本
        const SERVER_FolderPath = params.SERVER_FolderPath;  //伺服器目錄
        const map_folder = params.map_folder;                //地圖目錄

        //地圖資訊
        const map_info = params.map_info;  //Object
        const downloadUrl = map_info.downloadUrl;              //地圖下載URL
        /*params: {
          SERVER_DATA: {
            server_id: 5,
            motd: 'A Minecraft Server',
            server: 'Vanilla',
            version: '1.12.2',
            server_port: '25565',
            level_name: 'world2',
            ops: 'jamie0324,roy0111',
            level_seed: '',
            online_mode: 'false',
            gamemode: '0',
            level_type: 'DEFAULT',
            max_players: 5,
            allow_nether: 'true',
            pvp: 'true',
            allow_flight: 'true',
            difficulty: '1',
            enable_command_block: 'true',
            spawn_monsters: 'true',
            generate_structures: 'true',
            gamerule_keepInventory: 'true',
            created_at: '2021-04-25 02:56:40',
            logo: '/Users/marge/data/NAS-HOME/minecraft/nodejs-dev/ServerLauncher/app/images/version/1.12.jpg'
          },
          SERVER_FolderPath: '/Users/marge/data/NAS-HOME/minecraft/nodejs-dev/ServerLauncher/server/5',
          selected_worldFolder: {
            _id: 3,
            folder: 'world3',
            hasFiles: true,
            clearable: true,
            selected: false,
            removeable: true
          },
          map_folder: 'world3',
          downloadUrl: 'https://ijaminecraft.com/download/map/oneblock/IJAMinecrafts-OneBlock-1-16-4.zip'
        }
        */

        //PS: 下載zip + Progress
        const map_folder_path = path.join(SERVER_FolderPath, map_folder);  //地圖 存放的 目錄路徑
        const map_url = downloadUrl;    //地圖下載的網址
        console.log(consoleTitle2, 'map_folder_path:', map_folder_path);
        console.log(consoleTitle2, 'map_url:', map_url);
        let downloadAndInstallResult = await myMapDownloader.downloadAndInstall(map_folder_path, map_url, map_info);

        //PS: 回覆 ipcRenderer.sendSync()
        console.log(consoleTitle2, '回覆 ipcRenderer.sendSync() => downloadAndInstallResult:', downloadAndInstallResult);
        event.returnValue = downloadAndInstallResult;  //PS: 回傳給 ipcRenderer.sendSync() => true=Success下載地圖+安裝

    });

    //endregion


    //region -- [視窗開啟] --

    /**
     * 地圖下載 - ok
     * call: /app/form_setting_server_map.html
     */
    ipcMain.on('form_map_list', async (event, params) => {

        let consoleTitle2 = consoleTitle + '[ipcMain.on][form_map_list]';
        console.log(consoleTitle2, 'params:', params);

        const winName = 'form_map_list';  //視窗名稱
        let width = 750, height = 500;
        let bw = await createBrowserWindows({
            winName: winName,                     //視窗名稱
            winTitle: `${global.i18n.__('WindowTitle.MapDownload')}`,  //視窗標題
            url: `file://${appFolderPath()}/form_map_list.html`,  //視窗載入檔的路徑

            show: true,       //視窗不隱藏
            hideMenu: true,   //選單不顯示
            parent: global.winMain,      //父層BrowserWindow

            width: width,       //視窗寬
            height: height,     //視窗高
            minWidth: width,    //視窗最小寬
            minHeight: height,  //視窗最小高

            resizable: true,    //視窗縮放大小
            minimizable: false, //視窗最小化
            maximizable: true,  //視窗最大化

            alwaysOnTop: false,  //視窗顯示於最上層
            modal: false,        //視窗設為Modal

            backgroundColor: '#ffffff',  //視窗背景色
            isEnableDevTools,   //關閉開發工具
            openDevTools: isShowDevTools[winName],  //是否開啟開發工具視窗

            //視窗載入
            onLoad: function (event) {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][did-finish-load]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'params:', params);

                //PS: 2021-04-18 改用傳遞訊息給 Renderer: index.html
                this.win.webContents.send('load', params);

            },
            //視窗關閉
            onClose: function () {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][close]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'this.win:', this.win);

                //催毀自己 (其實BrowserWindow自己會催毀)

            }
        })

    });


    /**
     * 伺服器版本管理 - ok
     */
    ipcMain.on('form_server_jar', async (event, params) => {

        let consoleTitle2 = consoleTitle + '[ipcMain.on][form_server_jar]';
        console.log(consoleTitle2, 'params:', params);

        const winName = 'form_server_jar';  //視窗名稱
        let width = 650, height = 500;
        let bw = await createBrowserWindows({
            winName: winName,                     //視窗名稱
            winTitle: `${global.i18n.__('WindowTitle.ServerVersions')}`,  //視窗標題
            url: `file://${appFolderPath()}/form_server_jar.html`,  //視窗載入檔的路徑

            show: true,       //視窗不隱藏
            hideMenu: true,   //選單不顯示
            parent: global.winMain,      //父層BrowserWindow

            width: width,       //視窗寬
            height: height,     //視窗高
            minWidth: width,    //視窗最小寬
            minHeight: height,  //視窗最小高

            resizable: false,    //視窗縮放大小
            minimizable: false,  //視窗最小化
            maximizable: false,  //視窗最大化

            alwaysOnTop: false,  //視窗顯示於最上層
            modal: false,        //視窗設為Modal

            backgroundColor: '#ffffff',  //視窗背景色
            isEnableDevTools,   //關閉開發工具
            openDevTools: isShowDevTools[winName],  //是否開啟開發工具視窗

            //視窗載入
            onLoad: function (event) {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][did-finish-load]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'params:', params);

                //PS: 2021-04-18 改用傳遞訊息給 Renderer: index.html
                this.win.webContents.send('load', params);

            },
            //視窗關閉
            onClose: function () {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][close]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'this.win:', this.win);

                //催毀自己 (其實BrowserWindow自己會催毀)

            }
        })

    });


    /**
     * 好友管理 - ok
     */
    ipcMain.on('form_friends', async (event, params) => {

        let consoleTitle2 = consoleTitle + '[ipcMain.on][form_friends]';
        console.log(consoleTitle2, 'params:', params);

        const winName = 'form_friends';  //視窗名稱
        let width = 600, height = 500;
        let bw = await createBrowserWindows({
            winName: winName,                     //視窗名稱
            winTitle: `${global.i18n.__('WindowTitle.Friends')}`,  //視窗標題
            url: `file://${appFolderPath()}/form_friends.html`,  //視窗載入檔的路徑

            show: true,       //視窗不隱藏
            hideMenu: true,   //選單不顯示
            parent: global.winMain,      //父層BrowserWindow

            width: width,       //視窗寬
            height: height,     //視窗高
            minWidth: width,    //視窗最小寬
            minHeight: height,  //視窗最小高

            resizable: false,    //視窗縮放大小
            minimizable: false,  //視窗最小化
            maximizable: false,  //視窗最大化

            alwaysOnTop: false,  //視窗顯示於最上層
            modal: false,        //視窗設為Modal

            backgroundColor: '#ffffff',  //視窗背景色
            isEnableDevTools,   //關閉開發工具
            openDevTools: isShowDevTools[winName],  //是否開啟開發工具視窗

            //視窗載入
            onLoad: function (event) {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][did-finish-load]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'params:', params);

                //PS: 2021-04-18 改用傳遞訊息給 Renderer: index.html
                this.win.webContents.send('load', params);

            },
            //視窗關閉
            onClose: function () {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][close]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'this.win:', this.win);

                global.winMain.show();

                //催毀自己 (其實BrowserWindow自己會催毀)

            }
        })

    });


    /**
     * 偏好設定 - ok
     */
    ipcMain.on('form_preference', async (event, params) => {

        let consoleTitle2 = consoleTitle + '[ipcMain.on][form_preference]';
        console.log(consoleTitle2, 'params:', params);

        const winName = 'form_preference';  //視窗名稱
        let width = 500, height = 340;
        let bw = await createBrowserWindows({
            winName: winName,                     //視窗名稱
            winTitle: `${global.i18n.__('WindowTitle.Preference')}`,  //視窗標題
            url: `file://${appFolderPath()}/form_preference.html`,  //視窗載入檔的路徑

            show: true,       //視窗不隱藏
            hideMenu: true,   //選單不顯示
            parent: global.winMain,      //父層BrowserWindow

            width: width,       //視窗寬
            height: height,     //視窗高
            minWidth: width,    //視窗最小寬
            minHeight: height,  //視窗最小高

            resizable: false,    //視窗縮放大小
            minimizable: false,  //視窗最小化
            maximizable: false,  //視窗最大化

            alwaysOnTop: false,  //視窗顯示於最上層
            modal: false,        //視窗設為Modal

            backgroundColor: '#ffffff',  //視窗背景色
            isEnableDevTools,   //關閉開發工具
            openDevTools: isShowDevTools[winName],  //是否開啟開發工具視窗

            //視窗載入
            onLoad: function (event) {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][did-finish-load]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'params:', params);

                //PS: 2021-04-18 改用傳遞訊息給 Renderer: index.html
                this.win.webContents.send('load', params);

            },
            //視窗關閉
            onClose: function () {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][close]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'this.win:', this.win);

                //催毀自己 (其實BrowserWindow自己會催毀)

            }
        })

    })


    /**
     * 開啟 [新增MC伺服器表單] 視窗 - ok
     */
    ipcMain.on('form_setting_server', async (event, param1) => {

        let consoleTitle2 = consoleTitle + '[ipcMain][form_setting_server]';
        console.log(consoleTitle2, 'param1:', param1);

        let server_id = param1.server_id;  //伺服器
        const winName = 'form_setting_server';  //視窗名稱
        let width = 500, height = 700;
        let bw = await createBrowserWindows({
            winName: winName,                     //視窗名稱
            winTitle: `${global.i18n.__('WindowTitle.Server')}`,  //視窗標題
            url: `file://${appFolderPath()}/form_setting_server.html`,  //視窗載入檔的路徑

            show: true,       //視窗不隱藏
            hideMenu: true,   //選單不顯示
            parent: global.winMain,      //父層BrowserWindow

            width: width,       //視窗寬
            height: height,     //視窗高
            minWidth: width,    //視窗最小寬
            minHeight: height,  //視窗最小高

            resizable: false,    //視窗縮放大小
            minimizable: false,  //視窗最小化
            maximizable: false,  //視窗最大化

            alwaysOnTop: false,  //視窗顯示於最上層
            modal: false,        //視窗設為Modal

            backgroundColor: '#ffffff',  //視窗背景色
            isEnableDevTools,   //關閉開發工具
            openDevTools: isShowDevTools[winName],  //是否開啟開發工具視窗

            //視窗載入
            onLoad: function (event) {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][did-finish-load]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'params:', params);

                //PS: 2021-04-18 改用傳遞訊息給 Renderer: index.html
                this.win.webContents.send('load', {server_id});

            },
            //視窗關閉
            onClose: function () {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][close]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'this.win:', this.win);

                //催毀自己 (其實BrowserWindow自己會催毀)

            }
        })

    });


    /**
     * 開popup - 設定MC伺服器地圖 - ok
     */
    ipcMain.on('form_setting_server_map', async (event, param1) => {

        let consoleTitle2 = consoleTitle + '[ipcMain][form_setting_server_map]';
        console.log(consoleTitle2, 'param1:', param1);

        let server_id = param1.server_id;  //伺服器
        const winName = 'form_setting_server_map';  //視窗名稱
        let width = 700, height = 500;
        let bw = await createBrowserWindows({
            winName: winName,                     //視窗名稱
            winTitle: `${global.i18n.__('WindowTitle.Map')}`,  //視窗標題
            url: `file://${appFolderPath()}/form_setting_server_map.html`,  //視窗載入檔的路徑

            show: true,       //視窗不隱藏
            hideMenu: true,   //選單不顯示
            parent: global.winMain,      //父層BrowserWindow

            width: width,       //視窗寬
            height: height,     //視窗高
            minWidth: width,    //視窗最小寬
            minHeight: height,  //視窗最小高

            resizable: false,    //視窗縮放大小
            minimizable: false,  //視窗最小化
            maximizable: false,  //視窗最大化

            alwaysOnTop: false,  //視窗顯示於最上層
            modal: false,        //視窗設為Modal

            backgroundColor: '#ffffff',  //視窗背景色
            isEnableDevTools,   //關閉開發工具
            openDevTools: isShowDevTools[winName],  //是否開啟開發工具視窗

            //視窗載入
            onLoad: function (event) {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][did-finish-load]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'params:', params);

                //PS: 2021-04-18 改用傳遞訊息給 Renderer: index.html
                this.win.webContents.send('load', {server_id});

            },
            //視窗關閉
            onClose: function () {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][close]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'this.win:', this.win);

                //催毀自己 (其實BrowserWindow自己會催毀)

            }
        })

    });


    /**
     * 開popup - 伺服器LOG - ok
     */
    ipcMain.on('form_view_server_log', async (event, param1) => {

        let consoleTitle2 = consoleTitle + '[ipcMain][form_view_server_log]';
        //console.log(consoleTitle2, 'event:', event);
        console.log(consoleTitle2, 'param1:', param1);

        let server_id = param1.server_id;        //伺服器
        const winName = 'form_view_server_log';  //視窗名稱
        let width = 800, height = 500;
        let bw = await createBrowserWindows({
            winName: winName,                     //視窗名稱
            winTitle: `${global.i18n.__('WindowTitle.Console logs')}`,  //視窗標題
            url: `file://${appFolderPath()}/form_view_server_log.html`,  //視窗載入檔的路徑

            show: true,       //視窗不隱藏
            hideMenu: true,   //選單不顯示
            parent: global.winMain,      //父層BrowserWindow

            width: width,       //視窗寬
            height: height,     //視窗高
            minWidth: width,    //視窗最小寬
            minHeight: height,  //視窗最小高

            resizable: true,     //視窗縮放大小
            minimizable: false,  //視窗最小化
            maximizable: true,   //視窗最大化

            alwaysOnTop: false,  //視窗顯示於最上層
            modal: false,        //視窗設為Modal

            backgroundColor: '#ffffff',  //視窗背景色
            isEnableDevTools,   //關閉開發工具
            openDevTools: isShowDevTools[winName],  //是否開啟開發工具視窗

            //視窗載入
            onLoad: function (event) {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][did-finish-load]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'params:', params);

                //PS: 2021-04-18 改用傳遞訊息給 Renderer: index.html
                this.win.webContents.send('load', {server_id});

            },
            //視窗關閉
            onClose: function () {

                let consoleTitle3 = consoleTitle2 + '[winMain.on][close]';
                //console.log(consoleTitle3, 'this:', this);
                //console.log(consoleTitle3, 'this.win:', this.win);

                reloadHomePage();  //PS: 呼叫 /index.html Renderer 重新載入 [店家清單] 資料

            }
        })

    });


    //endregion

}
