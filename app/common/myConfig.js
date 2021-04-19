const consoleTitle = '[/app/config.js]';
const {app, BrowserWindow, Menu, ipcMain, ipcRenderer} = require('electron');
const path = require('path');
const fs = require('fs');
const I18n = require('i18n-2');                            //https://www.npmjs.com/package/i18n
const {is} = require('electron-util');                     //相關好用的函式庫 https://github.com/sindresorhus/electron-util
const {autoUpdater} = require('electron-updater');         //PS: 以Github當升級來源-範本: https://github.com/iffy/electron-updater-example
const myAutoUpdater = require('./myAutoUpdater');          //檢測升級檔
const myMachineResource = require('./myMachineResource');  //取主機資源
const MyDB = require('./myDb');                            //初始化資料庫
const myDate = require('./myDate');                        //時間函式
const openAboutWindow = require('about-window').default;   //自訂 [關於]
const pkg = require('../../package.json');                 //package
const isOnline = require('is-online');                     //網路連線狀態: https://www.npmjs.com/package/is-online
const fetch = require('electron-fetch').default;           //https://www.npmjs.com/package/electron-fetch
const appVersion = app.getVersion();                       //當前使用的版本
const apiurl = pkg.apiurl;                                 //線上訊息API


//region 主視窗設定參數
const width = 1280;
const height = 720;

const isEnableDevTools = true;  //是否可啟用開發者工具

//是否顯示開發者工具
let isShowDevTools = {
    winMain: false,      //主視窗
    menu: false,         //選單
    form_Server: false,  //表單-新增/修改 MC伺服器
    form_Map: false,     //表單-新增/修改 MC伺服器地圖
    form_Log: false,     //表單-顯示 MC伺服器Log
    form_Friends: false  //表單-好友管理
}
// isShowDevTools.winMain = true;
// isShowDevTools.menu = true;
// isShowDevTools.form_Server = true;
// isShowDevTools.form_Map = true;
// isShowDevTools.form_Log = true;
// isShowDevTools.form_Friends = true;

//endregion


/**
 * 檢測網路是否連線
 *
 * @return {Promise<*>}
 */
let isNetworkOnline = async () => {
    let _isOnline = await isOnline({timeout: 3000});
    global.isNetworkOnline = _isOnline;  //放入全域
    return _isOnline;  //true or false
}

/**
 * 比較版號 是否 新版本 > 當前版本
 *
 * @param newVer      新版本
 * @param oldVer      當前版本
 * @return {boolean}  true=有新版本
 *
 * call: loadOnlineConfig()
 */
let versionCompare = (newVer, oldVer) => {

    let consoleTitle2 = consoleTitle + '[versionCompare]';
    let newVer2 = newVer.split('.').map((item) => item.padStart(2, '0')).join('.');
    let oldVer2 = oldVer.split('.').map((item) => item.padStart(2, '0')).join('.');

    let isNewVer = newVer2 > oldVer2;
    //console.log(consoleTitle2, newVer2, '>', oldVer2, '=', newVer2 > oldVer2);

    return isNewVer;

}

/**
 * 讀取線上設定檔
 */
let loadOnlineConfig = async () => {

    let consoleTitle2 = consoleTitle + '[loadOnlineConfig]';
    let sdate = new Date();

    //------------
    //PS: 下載線上的設定檔
    let configFile = `config.json`;   //設定檔檔名
    let configUrl = `${apiurl}/${configFile}?t=${myDate.timestamp()}`;
    let configFilePath = null;        //設定檔存放路徑
    let configDefaultFilePath = path.join(`${app.getAppPath()}`, `${configFile}`);  //AP目錄下的檔案路徑

    //PS: 開發環境
    if (is.development) {
        configFilePath = path.join(`${app.getAppPath()}`, `${configFile}`);  //AP目錄下的檔案路徑
    } else {
        const userDataPath = app.getPath('userData');  //PS：使用個人目錄來放存
        configFilePath = path.join(`${userDataPath}`, `${configFile}`);     //檔案路徑
    }
    console.log(consoleTitle2, 'configFilePath:', configFilePath);

    //------------
    let localConfig = null;  //預設檔內容

    //PS: 判斷是否存在本機的 userData 目錄下的 config.json (預設是不會有此檔案，需由下方下載後才有)
    let isExistConfigFile = fs.existsSync(configFilePath);
    if (!isExistConfigFile) {  //不存在
        localConfig = fs.readFileSync(configDefaultFilePath, {encoding:'utf-8'}); //改讀取 AP目錄下的檔案路徑
    } else {
        localConfig = fs.readFileSync(configFilePath, {encoding:'utf-8'});
    }
    //------------
    //PS: 讀取預設檔 - 寫入全域變數
    //console.log(consoleTitle2, 'localConfig:', localConfig);
    localConfig = JSON.parse(localConfig);       //字串轉JSON
    localConfig.thisAppVersion = appVersion;     //當前使用的版本
    localConfig.isNewVer = versionCompare(localConfig.latest, appVersion); //比對版號是否有新版本: true=有新版本
    localConfig.downloadUrl = pkg.downloadurl;   //下載的頁面
    global.config = localConfig;                 //放入全域

    //------------
    //PS: 網路連線中
    if (await isNetworkOnline()) {

        fetch(configUrl)
            .then(res => res.json())
            .then(onlineConfig => {

                //console.log(consoleTitle2, onlineConfig);
                //PS: Save to /config.json
                fs.writeFile(configFilePath, JSON.stringify(onlineConfig, null, 4), function (err) {
                    if (err) throw err;

                    console.log(consoleTitle2, 'Saved! =>', configFilePath);

                    let spendSecTimes = myDate.calculatorRunTimes(sdate).milliseconds;  //計算花費秒數
                    console.log(consoleTitle2, '=== End', new Date(), ` => 花費: ${spendSecTimes} 毫秒`);

                    //PS: 寫入全域變數
                    onlineConfig.thisAppVersion = appVersion;     //當前使用的版本
                    onlineConfig.isNewVer = versionCompare(onlineConfig.latest, appVersion); //比對版號是否有新版本: true=有新版本
                    onlineConfig.downloadUrl = pkg.downloadurl;   //下載的頁面
                    global.config = onlineConfig;                 //放入全域
                    //console.log(consoleTitle2, 'global.config:', global.config);

                });

            })
            .catch(err => {
                console.error(consoleTitle2, err);
            })

    } else {
        console.log(consoleTitle2, '網路未連線,無法下載 config.json =>', configUrl);
    }

}


/**
 * 支援的多國語系
 * en-US: 英文
 * zh-TW: 繁體
 */
let locales = ['zh-TW'];
global.locales = locales;


/**
 * 註冊 選單
 */
let regMenu = async () => {

    let consoleTitle2 = consoleTitle + '[regMenu]';
    //console.log(consoleTitle2);

    const isMac = process.platform === 'darwin';
    const i18n = global.i18n;
    //console.log(consoleTitle2, 'i18n:', i18n);

    //關於
    let submenu_about = {
        //role: 'about',
        label: i18n.__('Menu.About'),
        click: function (item, focusedWindow) {
            let icon_path = path.join(app.getAppPath(), 'build', 'icons', '256x256.png');
            console.log('icon_path:', icon_path);
            openAboutWindow({
                win_options: {
                    width: 500,
                    title: i18n.__('Menu.About')
                },
                icon_path: icon_path,
                product_name: pkg.description,
                description: `作者: ${pkg.author}`,
                homepage: pkg.homepage,
                bug_report_url: pkg.bugs,
                bug_link_text: `錯誤回報`,
                license: pkg.license
                //use_version_info: true
            });
        }
    }

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

    //檢查更新
    let submenu_autoUpdate = {
        label: i18n.__('Menu.Check for Updates') + '...',  //檢查更新
        click: async function (item, focusedWindow) {
            await autoUpdater.checkForUpdates();
        }
    }

    //偏好設定
    let submenu_preference = {
        label: i18n.__('Menu.Preference') + '...',
        click: function (item, focusedWindow) {
            //開啟視窗
            ipcMain.emit('openwin_form_preference', this, {});
        }
    }

    let submenu_i18n_en = {
        label: i18n.__('Menu.English'),
        click: async function (item, focusedWindow) {
            i18n.setLocale('en-US')  //切換語系-英文
            console.log('Hello:', i18n.__('Hello'), i18n.__('Marge'));
            await global.MyDB.setLocale('en-US');
            regMenu();
            // app.relaunch();
            // app.exit();
        }
    }

    let submenu_i18n_zh = {
        label: i18n.__('Menu.Chinese'),
        click: async function (item, focusedWindow) {
            i18n.setLocale('zh-TW')  //切換語系-繁體
            console.log('Hello:', i18n.__('Hello'), i18n.__('Marge'));
            await global.MyDB.setLocale('zh-TW');
            regMenu();
            // app.relaunch();
            // app.exit();
        }
    }

    //PS: 必需把 編輯 的功能放入選單內，在表單的 input 欄位才有辦法 Copy,Paste,Cut,Select All
    const edit = {
        label: 'Edit',
        submenu: [
            {
                label: 'Undo',
                accelerator: 'CmdOrCtrl+Z',
                role: 'undo',
            },
            {
                label: 'Redo',
                accelerator: 'Shift+CmdOrCtrl+Z',
                role: 'redo',
            },
            {
                type: 'separator',
            },
            {
                label: 'Cut',
                accelerator: 'CmdOrCtrl+X',
                role: 'cut',
            },
            {
                label: 'Copy',
                accelerator: 'CmdOrCtrl+C',
                role: 'copy',
            },
            {
                label: 'Paste',
                accelerator: 'CmdOrCtrl+V',
                role: 'paste',
            },
            {
                label: 'Select All',
                accelerator: 'CmdOrCtrl+A',
                role: 'selectAll',
            },
        ],
    };


    let template = [
        // { role: 'appMenu' }
        ...(isMac ? [{
            label: i18n.__('Menu.Main Menu'),
            submenu: [
                submenu_about,
                submenu_preference,
                {type: 'separator'},
                //submenu_i18n_en,
                //submenu_i18n_zh,
                submenu_autoUpdate,
                {type: 'separator'},
                {role: 'services'},
                submenu_devtool,
                {type: 'separator'},
                {
                    role: 'quit',
                    label: i18n.__('Menu.Quit')
                }
            ]
        }] : [{
            label: i18n.__('Menu.Main'),
            submenu: [
                submenu_about,
                submenu_preference,
                {type: 'separator'},
                submenu_autoUpdate,
                submenu_devtool,
                {type: 'separator'},
                {
                    role: 'quit',
                    label: i18n.__('Menu.Quit')
                }
            ]
        }]),
        edit
    ];


    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);  //設定選單

}


//匯出
module.exports = {

    width,
    height,

    appVersion,
    isNetworkOnline,
    loadOnlineConfig,

    /**
     * AP 程式目錄
     *
     * call: /app/common/ipcManOpenWindows.js
     */
    appFolderPath: () => {
        return path.join(app.getAppPath(), 'app');  //eg: /Users/marge/minecraft/ServerLauncher + '/' + app
    },

    isEnableDevTools,
    isShowDevTools,

    isDev: () => {
        global.isDev = is.development;          //開發與正式環境偵測
        return global.isDev;
    },

    /**
     * 找尋系統內是否有安裝 java
     */
    find_java_home: () => {

        let consoleTitle2 = consoleTitle + '[find_java_home]';

        require('find-java-home')((err, java_home) => {
            if (err) {
                global.isFindJavaHome = false;
                console.error(consoleTitle2, 'find-java-home => err:', err);
            } else {
                global.isFindJavaHome = true;
                console.log(consoleTitle2, 'java_home:', java_home);
            }
        });

    },

    //支援的 多國語系 清單
    locales,

    /**
     * 註冊 多國語系
     * PS: 只載入語系資料，預設使用繁體中文
     */
    regLocale: async () => {

        let consoleTitle2 = consoleTitle + '[regLocale]';

        const i18n = new I18n({
            extension: '.json',
            defaultLocale: 'zh-TW',   //預設繁體
            locales: locales,   //['en-US', 'zh-TW'],
            directory: path.join(app.getAppPath(), 'app', 'locales')
        });

        global.i18n = i18n;
        //console.log(consoleTitle2, 'global.i18n:', global.i18n);

        //let locale = i18n.getLocale()  //取當前語系
        //i18n.setLocale('zh-TW')     //切換語系-繁體
        //i18n.setLocale('en-US')     //切換語系-英文
        //console.log('Hello:', i18n.__('Hello'), i18n.__('Marge'));

    },


    /**
     * 初始化 資料庫
     */
    initDB: async (app) => {

        let consoleTitle2 = consoleTitle + '[initDB]';
        console.log(consoleTitle2, '開啟資料庫連線');

        const mydb = new MyDB(app);     //初始化
        await mydb.open();              //開啟資料庫連線

        global.MyDB = mydb;

        return mydb;

    },

    /**
     * 資料庫升級檢查
     */
    migrationDB: async () => {

        let consoleTitle2 = consoleTitle + '[migrationDB]';
        console.log(consoleTitle2, '資料庫升級檢查');

        await global.MyDB.migrationCheck();    //DB migration 檢查

    },


    /**
     * 初始化 語系,載入使用者選擇的語系
     */
    initLocale: async () => {

        let consoleTitle2 = consoleTitle + '[initLocale]';
        console.log(consoleTitle2);

        /**
         * 當前 APP 設定檔
         */
        let appSetting = await global.MyDB.getSetting();
        //console.log(consoleTitle2, 'appSetting:', appSetting);
        if (appSetting) {
            global.i18n.setLocale(appSetting.locale);  //PS: 切換語系
        }
        console.log(consoleTitle2, '目前語系:', global.i18n.getLocale());

    },

    /**
     * 取主機資源: Public Ip, Private Ip, MemoryInfo, CpuInfo
     */
    getMachineResource: async () => {
        global.machineResource = await myMachineResource.getMachineResource();  //取主機資源
    },


    /**
     * 註冊 選單
     */
    regMenu,


    /**
     * 註冊 自動更新
     *
     * @return {Promise<void>}
     */
    regAutoUpdater: async () => {

        let winMain = global.winMain;   //改讀取全域變數

        myAutoUpdater();  //初始化自動更新

        /**
         * 顯示下載進度
         */
        autoUpdater.on('download-progress', function (progress) {
            /*{
              total: 253195479,
              delta: 10911798,
              transferred: 237198657,
              percent: 93.68202700017405,
              bytesPerSecond: 3017987
            }
            */
            winMain.setProgressBar(progress.percent.toFixed(2) / 100);
            winMain.setTitle('已下載：' + progress.percent.toFixed(2) + '%');

            //TODO: 下載完畢後 Title 需自行改回.
        });

    },


    /**
     * 取 [偏好設定]
     *
     * @return {Promise<void>}
     */
    getPreference: async () => {

        let consoleTitle2 = consoleTitle + '[getPreference]';
        console.log(consoleTitle2);

        const Setting = global.Setting;
        console.log(consoleTitle2, 'Setting:', Setting);

        return {
            isAdvance_Server_Start: Setting.isAdvance_Server_Start
        }

    }


}
