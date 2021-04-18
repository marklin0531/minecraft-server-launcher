/**
 * 伺服器管理
 *
 * 2021-03-29 友
 */
const consoleTitle = '[/app/common/myMCServerManager.js]';
const electron = require('electron');
const {app} = electron;
const {is} = require('electron-util');
const getPort = require('get-port');  //取可使用的埠號 - https://github.com/sindresorhus/get-port
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');
const myMCLauncher = require('./myMCLauncher');             //啟動器
const myProgressBar = require('../common/myProgressBar');   //進度條


const isInt = (value) => {
    return !isNaN(value) && (function (x) {
        return (x | 0) === x;
    })(parseFloat(value))
}


/**
 * TODO Usage:
 */
class myMCServerManager {

    constructor(server_id) {

        let consoleTitle2 = consoleTitle + '[constructor]';

        this.isDev = is.development;             //開發環境
        this.server_id = server_id;              //伺服器ID
        this.serverKey = `server_${server_id}`;  //伺服器Key 名稱

        let winMain = electron.BrowserWindow.getFocusedWindow();  //PS： 取當前Focus 的視窗
        this.progressBarText = new myProgressBar.TextBar({parentWin: winMain, text: '執行'});  //文字型進度條

        //MC伺服器檔案存放目錄
        this.appFolderPath = null;      //eg: /Users/marge/data/NAS-HOME/minecraft/nodejs-dev/ServerLauncher
        this.rootFolderPath = null;     //eg: /Users/marge/data/NAS-HOME/minecraft/nodejs-dev/ServerLauncher/server
        this.serverFolderPath = null;   //eg: /Users/marge/data/NAS-HOME/minecraft/nodejs-dev/ServerLauncher/server/56
        this.getServerFolder();         //取得MC伺服器目錄

    }


    /**
     * 取得MC伺服器目錄 - ok
     * PS: 切換 Production 使用 UserData Folder
     *
     * @return {string}
     *
     * call: constructor()   x _initLauncher()
     */
    getServerFolder() {

        let consoleTitle2 = consoleTitle + '[getServerFolder]';

        let userDataPath = app.getPath('userData');  //PS: 使用者的應用程式資料存放目錄 (package.json => name)
        //console.log(consoleTitle2, 'userDataPath:', userDataPath);  //userDataPath: /Users/marge/Library/Application Support/minecraft-server-launcher

        //開發環境
        if (this.isDev) {
            userDataPath = app.getAppPath();  //userDataPath: /Users/marge/data/NAS-HOME/minecraft/nodejs-dev/ServerLauncher
        }

        //PS: 放入 this
        //"/Applications/minecraft Server Launcher.app/Contents/Resources/app.asar/1.12.2.jar"
        this.appFolderPath = `${app.getAppPath()}`; //AP 應用程式執行目錄,eg: /Applications/minecraft Server Launcher.app/Contents/Resources/app.asar

        //打包後的路徑上二層
        if (this.appFolderPath.indexOf('asar') !== -1) {
            this.appFolderPath = path.join(this.appFolderPath, '../../');  //eg: /Applications/minecraft Server Launcher.app/Contents
        }

        this.jarFolderPath = path.join(`${this.appFolderPath}`, 'server');     //存放伺服器Jar檔的目錄,eg: /Applications/minecraft Server Launcher.app/Contents/server
        this.rootFolderPath = path.join(`${userDataPath}`, 'server');          //存放伺服器資料的主目錄
        this.serverFolderPath = path.join(`${this.rootFolderPath}`, `${this.server_id}`);  //存放每台伺服器資料的目錄

        //console.log(consoleTitle2, 'appFolderPath:', this.appFolderPath, ',jarFolderPath:', this.jarFolderPath, ',rootFolderPath:', this.rootFolderPath, ',serverFolderPath:', this.serverFolderPath);
        //rootFolderPath: /Users/marge/data/NAS-HOME/minecraft/nodejs-dev/ServerLauncher/server
        //serverFolderPath: /Users/marge/data/NAS-HOME/minecraft/nodejs-dev/ServerLauncher/server/12

        return {
            appFolderPath: this.appFolderPath,
            jarFolderPath: this.jarFolderPath,
            rootFolderPath: this.rootFolderPath,
            serverFolderPath: this.serverFolderPath
        };

    }


    /**
     * 取可安裝的 MC伺服器版本清單 - ok
     *
     * @return {Promise<void>}
     */
    static getVersionList() {

        let consoleTitle2 = consoleTitle + `[getVersionList]`;
        //let versions = require('../versions.json').versions;
        let config = global.config;
        let versions = config.versions;

        //console.log(consoleTitle2, 'versions:', versions);

        // let data = [];
        // versions.forEach(item => {
        //     //console.log(item.v);
        //     data.push(`${item.s}-${item.v}`);
        // })

        return versions;

    }


    /**
     * 記錄 [全部伺服器啟動器實例] - ok
     *
     * @return {{}}
     */
    get serverLaunchers() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][serverLaunchers 屬性]`;

        //console.log(consoleTitle2, 'global.serverLaunchers 1:', global.serverLaunchers);

        //PS: 記錄每台伺服器啟動器實例
        if (!global.serverLaunchers) global.serverLaunchers = {};

        //console.log(consoleTitle2, '[全部實例] global.serverLaunchers 2:', global.serverLaunchers);

        return global.serverLaunchers;

    }


    //region 地圖目錄

    /**
     * 讀取 [伺服器目錄下的] - [地圖目錄] 清單 - ok
     *
     * call: getAvailableMapFolder()
     */
    async getWorldFolders() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][getWorldFolders]`;

        const isDirectory = source => fs.lstatSync(source).isDirectory();  //檢查path是否為目錄
        const getDirectories = source => fs.readdirSync(source).map(name => path.join(source, name)).filter(isDirectory);

        let worldFolders = [];  //地圖目錄清單

        let _serverLauncher = this.getServerLauncher();   //取單一伺服器啟動器實例
        let _serverProperties = _serverLauncher.options;  //PS: 取出設定值
        let level_name = _serverProperties.level_name;    //當前設定使用的地圖目錄
        //console.log(consoleTitle2, 'level_name:', level_name);

        let serverFolderPath = this.serverFolderPath;        //伺服器目錄
        let Directories = getDirectories(serverFolderPath);  //[]
        //console.log(consoleTitle2, 'getDirectories:', Directories);

        let _worldFolders = [];
        for (const [idx, _folder] of Directories.entries()) {
            let _folder_name = path.basename(_folder).toLowerCase();     //取目錄名稱
            _worldFolders.push(_folder_name);  //只放目錄名稱，下面要做排序
        }
        //重新排序
        _worldFolders.sort((a, b) => {

            let x = a.replace(/world/g, '');
            let y = b.replace(/world/g, '');

            if (!isInt(x)) x = '';
            if (!isInt(y)) y = '';
            if (x.length === 0) {
                x = (a.toLowerCase() === 'world') ? 0 : x = 999999;
            }
            if (y.length === 0) {
                y = (b.toLowerCase() === 'world') ? 0 : y = 999999;
            }

            //console.log('x:', x, ',y:', y);
            return x - y;

        });
        //console.log(consoleTitle2, '_worldFolders:', _worldFolders);

        let _id = 0;
        for (const [idx, _folder_name] of _worldFolders.entries()) {

            //console.log(consoleTitle2, '_folder_name:', _folder_name);

            //目錄名稱包含 world 才放入清單
            if (_folder_name.includes('world')) {

                const _folder_total_files = fs.readdirSync(path.join(`${serverFolderPath}`, `${_folder_name}`)).length;  //目錄下的檔案數
                let hasFiles = _folder_total_files > 0;
                let isWorldFolder = _folder_name === 'world';   //true=預設的world目錄
                let isSelected = level_name === _folder_name;   //true=當前使用的地圖目錄
                let isClearable = true;    //true=可清空目錄
                let isRemoveable = true;   //true=可刪除目錄

                if (isWorldFolder) isRemoveable = false;  //不可刪除 - 預設的world目錄
                if (!hasFiles) isClearable = false;   //不可清空 - 空目錄
                //if (isClearable && isSelected) isClearable = false;  //不可清空 - 當前使用的地圖目錄

                _id++;
                worldFolders.push({
                    _id: _id,
                    folder: _folder_name,
                    hasFiles: hasFiles,
                    clearable: isClearable,
                    selected: isSelected,
                    removeable: isRemoveable
                });
            }

        }

        //PS: 尚無任何 world 地圖目錄,寫入一筆 [預設的 world]
        if (worldFolders.length === 0) worldFolders.push({
            _id: _id,
            folder: 'world',
            hasFiles: false,
            clearable: false,
            selected: true,
            removeable: false
        });  //預設目錄
        //console.log(consoleTitle2, 'worldFolders:', worldFolders);

        return worldFolders;  //[{_id: 0, folder: 'world', hasFiles: false, clearable: false, selected: true, removeable: false}]

    }

    /**
     * 取可用的 地圖目錄 - ok
     *
     * @return {Promise<void>}
     */
    async getAvailableMapFolder() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][getAvailableMapFolder]`;

        let used_world_folder = [];  //['world'];
        let _getWorldFolders = await this.getWorldFolders();  //[{folder: 'world', selected: true, removeable: false}]
        _getWorldFolders.forEach(item => {
            used_world_folder.push(item.folder);
        });


        let _getAvailableFolder = async () => {

            let start_folder = used_world_folder.length > 0 ? used_world_folder[0] : 'world1';  //啟始目錄
            let next_folder = start_folder.toLowerCase();  //下個目錄
            let available_folder = null;     //可用目錄
            do {

                let sortId = next_folder.replace(/world/g, '');
                if (sortId.length === 0) sortId = 1;
                //console.log(consoleTitle2, 'next_folder:', next_folder, ',sortId:', sortId);

                let folderIdx = parseInt(sortId) + 1;
                //console.log(consoleTitle2, 'folderIdx:', folderIdx);

                next_folder = `world${folderIdx}`;

                let isExist = used_world_folder.indexOf(next_folder) !== -1;
                //console.log(consoleTitle2, `start_folder: ${start_folder} ,next_folder: ${next_folder} ,isExist: ${isExist}`);

                if (!isExist) {
                    available_folder = next_folder;
                }

            } while (!available_folder);

            used_world_folder.push(available_folder);  //放入已使用的陣列
            //used_world_folder.sort();  //重新排序

            //console.log(consoleTitle2, 'available_folder:', available_folder);
            return available_folder;

        }

        let available_folder = await _getAvailableFolder();
        //console.log(consoleTitle2, 'available_folder:', available_folder);

        return available_folder;

    }

    /**
     * 建立地圖目錄 - ok
     *
     * @param folderName
     *
     * call: _initLauncher()
     */
    createMapFolder(folderName) {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][createMapFolder]`;
        let _folderPath = path.join(`${this.serverFolderPath}`, `${folderName}`);

        console.log(consoleTitle2, `建立 伺服器地圖目錄: ${_folderPath}`);
        mkdirp.sync(_folderPath);

    }

    /**
     * 移除地圖目錄 - ok
     *
     * @param folderName
     *
     * call:
     */
    removeMapFolder(folderName) {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][removeMapFolder]`;
        let _folderPath = path.join(`${this.serverFolderPath}`, `${folderName}`);

        console.log(consoleTitle2, `移除 伺服器地圖目錄: ${_folderPath}`);
        rimraf.sync(_folderPath);

    }

    /**
     * 清空地圖目錄 - ok
     * PS: 不會丟入垃圾桶,要丟入垃圾桶要使用 Electron 的 shell.trashItem(path)
     *
     * @param folderName
     */
    clearMapFolder(folderName) {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][clearMapFolder]`;
        let _folderPath = path.join(`${this.serverFolderPath}`, `${folderName}`);

        console.log(consoleTitle2, `清空 伺服器地圖目錄: ${_folderPath}`);
        rimraf.sync(_folderPath);

    }

    //endregion


    //region 伺服器PORT

    /**
     * 取 db 的伺服器設定 PORT 清單 - ok
     *
     * @return {Promise<void>}
     *
     * call: getAvailableServerPort()
     */
    async getServerUsedPortList() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][getServerUsedPortList]`;

        let used_server_port = [];
        let serverUsedPortList = await global.MyDB.getServerUsedPortList();

        serverUsedPortList.forEach((item, idx) => {
            used_server_port.push(item.server_port);
        });

        //console.log(consoleTitle2, 'used_server_port:', used_server_port);
        return used_server_port;

    }

    /**
     * 取可用的 server_port 號 - ok
     *
     * @return {Promise<void>}
     */
    async getAvailableServerPort() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][getAvailableServerPort]`;

        let used_server_port = await this.getServerUsedPortList(); //[25565, 25566];
        console.log(consoleTitle2, 'used_server_port:', used_server_port);

        let _getAvailablePort = async () => {

            let start_port = used_server_port.length > 0 ? used_server_port[0] : 25564;  //啟始PORT
            let next_port = start_port;  //結束PORT
            let available_port = null;    //可用PORT
            do {

                next_port++;
                let isExist = used_server_port.indexOf(next_port.toString()) !== -1;
                console.log(consoleTitle2, `start_port: ${start_port} ,next_port: ${next_port} ,isExist: ${isExist}`);

                if (!isExist) {

                    //PS: 檢查 PORT 是否被 Listen
                    let _port = await getPort({port: next_port});
                    console.log(consoleTitle2, `未Listen的_port: ${_port} ,next_port: ${next_port} ,isExist: ${isExist}`);

                    if (_port === next_port) {
                        available_port = next_port;
                    }

                }

            } while (!available_port);

            used_server_port.push(available_port);  //放入已使用的陣列
            used_server_port.sort();  //重新排序

            //console.log(consoleTitle2, 'available_port:', available_port);
            return available_port;

        }

        let available_port = await _getAvailablePort();
        console.log(consoleTitle2, 'available_port:', available_port);

        return available_port;

    }

    //endregion


    /**
     * 取 db 的單一伺服器設定資料 - ok
     *
     * @return {Promise<void>}
     *
     * call: resetLauncherOptions(), _initLauncher()
     */
    async getServerData() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][getServerData]`;

        console.log(consoleTitle2, `DB - 取伺服器設定資料`);
        let serverData = await global.MyDB.getServer(this.server_id);

        //PS: 增加 [MC伺服器目錄] 到屬性內
        serverData.serverDir = {
            jarFolderPath: this.jarFolderPath,
            appFolderPath: this.appFolderPath,
            rootFolderPath: this.rootFolderPath,
            serverFolderPath: this.serverFolderPath
        };

        //console.log(consoleTitle2, `serverData:`, serverData);

        return serverData;

    }


    //region 啟動器 + 設定檔

    /**
     * 更新 Launcher 的 [MC伺服器設定值] -
     * 更新伺服器設定檔: server.properties, ops.txt
     *
     * @return {Promise<void>}
     */
    async resetLauncherOptions() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][resetLauncherOptions]`;

        //PS: 取 db 的 單一伺服器設定資料 (MC伺服器設定值)
        let serverData = await this.getServerData();
        let _serverLauncher = this.getServerLauncher();

        _serverLauncher.writeServerProperties(serverData);  //寫入 server.properties
        console.log(consoleTitle2, '_serverLauncher.options:', _serverLauncher.options);

    }

    /**
     * 取單一伺服器啟動器實例 - ok
     *
     * call: server(), resetLauncherOptions()
     */
    getServerLauncher() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][getServerLauncher]`;

        let _serverLauncher = this.serverLaunchers[this.serverKey];
        //console.log(consoleTitle2, `取單一伺服器啟動器實例 _serverLauncher[${this.server_id}]:`, _serverLauncher);

        return _serverLauncher;  //myMCLauncher Class
    }

    //endregion


    /**
     * 初始化伺服器啟動器實例 - ok
     *
     * call: server()
     */
    async _initLauncher() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][_initLauncher]`;

        //-------
        //PS: 建立 伺服器目錄,這樣 [設定地圖] 的表單才能用 - ok
        if (!fs.existsSync(this.serverFolderPath)) {
            console.log(consoleTitle2, `建立 伺服器目錄: ${this.serverFolderPath}`);
            //fs.mkdirSync(this.serverFolderPath);
            mkdirp.sync(this.serverFolderPath);

            this.createMapFolder('world');  //建立 伺服器地圖目錄
        }
        //-------

        //PS: 取 db 的 單一伺服器設定資料 (MC伺服器設定值)
        let serverData = await this.getServerData();
        console.log(consoleTitle2, `初始化-MC伺服器啟動器實例 => serverData:`, serverData);

        //PS: * 初始化伺服器啟動器實例 並 儲存實例 - ok
        return this.serverLaunchers[this.serverKey] = new myMCLauncher(serverData);  //放入Global共用變數

    }


    /**
     * 取單一伺服器 MCLauncher instance實例 - ok
     *
     * @return {*}
     *
     * call: /ServerLauncher/app/index.html
     */
    async server() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][server]`;
        console.log(consoleTitle2, `=============== start`);

        //PS: 是否已有 單一伺服器啟動器實例
        let _serverLauncher = this.getServerLauncher();
        //console.log(consoleTitle2, `是否已有單一伺服器啟動器實例: _serverLauncher:`, _serverLauncher);

        if (_serverLauncher) {
            console.log(consoleTitle2, `伺服器啟動器實例-已存在`);
            return _serverLauncher;  //PS： 回傳現有實例
        }

        //PS: 第一次建立 伺服器啟動器實例
        console.log(consoleTitle2, `建立-伺服器啟動器實例`);
        _serverLauncher = await this._initLauncher();    //初始化伺服器啟動器實例

        console.log(consoleTitle2, `=============== end`);


        //回傳 伺服器啟動器實例
        return _serverLauncher;   // myMCLauncher Class

    }


    /**
     * 銷毀單一伺服器管理 - TODO
     */
    destroy() {

        let consoleTitle2 = consoleTitle + `[${this.server_id}][destroy]`;

        //TODO: Stop MCLauncher

        delete this.serverLauncher[this.serverKey];

    }

}


module.exports = myMCServerManager;
