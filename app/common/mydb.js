/**
 * 初始化 sqlite 資料表
 *
 * 2021-04-06 友: 增加 migration
 * 2021-03-26 友
 */
const consoleTitle = '[/app/common/mydb.js]';
const mySqlite = require('../common/mySqlite');    //Sqlite3 DB模組
const {is} = require('electron-util');  //相關好用的函式庫
const path = require('path');


/**
 * Usage:
 *
 *    const mydb = new MyDB(app);  //初始化
 *    await mydb.open();           //開啟資料庫連線
 *    await mydb.migrationCheck(); //DB migration 檢查
 *    //await mydb.createTable();    //OR 建立資料表: 店家清單
 *    mydb.db.close();             //關閉資料庫連線
 *
 */
class MyDB {

    constructor(app) {

        let consoleTitle2 = consoleTitle + '[constructor]';

        this.instance
        this.db = null
        this.app = app;
        this.appVersion = app.getVersion();  //APP版本 - project.json version
        this.appPath = app.getAppPath();     //APP根目錄位置

        const dbfile = 'minecraft.db';

        //PS: 開發環境
        if (is.development) {
            this.dbPath = path.join(`${this.appPath}`, 'app', 'db', `${dbfile}`);  //sqlite db檔案路徑
        } else {
            const userDataPath = app.getPath('userData');  //PS：使用個人目錄來放存DB檔
            this.dbPath = path.join(`${userDataPath}`, `${dbfile}`);       //sqlite db檔案路徑
        }

        //console.log(consoleTitle2, '__dirname:', __dirname);  // xxx/app/common
        console.log(consoleTitle2, 'dbPath:', this.dbPath);

    }


    /**
     * 開啟資料庫連線 - ok
     *
     * @return {Promise<void>}
     */
    async open() {

        let consoleTitle2 = consoleTitle + '[open]';
        //console.log(consoleTitle2, 'this.dbPath:', this.dbPath);

        if (!this.db) {
            const db = mySqlite.getInstance();
            await db.connect(this.dbPath);

            this.db = db;
        }

    }


    /**
     * 關閉DB連線
     * @return {Promise<void>}
     */
    async close() {
        let consoleTitle2 = consoleTitle + '[close]';
        await this.db.close();  //關閉DB連線
    }

    /**
     * Table: 好友記錄檔
     */
    get tableSchema_friends() {

        let schema_100 = `-- 好友ID
                          friend_id  INTEGER PRIMARY KEY AUTOINCREMENT,

                          -- 英文帳號 
                          account    VARCHAR(50),

                          -- 名稱
                          name       VARCHAR(50),

                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP`;

        return schema_100;

    }

    /**
     * Table: 偏好設定檔
     */
    get tableSchema_setting() {

        let schema_100 = `setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
                          -- 資料庫版本
                          dbVersion  VARCHAR(10),
                          created_at DATETIME DEFAULT CURRENT_TIMESTAMP`;

        let schema_101 = `setting_id             INTEGER PRIMARY KEY AUTOINCREMENT,

                          -- AP版本
                          version                VARCHAR(10),

                          -- 當前使用的顯示語系,預設中文
                          locale                 VARCHAR(20) DEFAULT 'zh-TW',

                          -- 進階伺服器啟動: true=顯示伺服器LOG
                          isAdvance_Server_Start VARCHAR(5)  DEFAULT 'false',

                          created_at             DATETIME    DEFAULT CURRENT_TIMESTAMP`;

        return schema_101;

    }

    /**
     * Table: 伺服器記錄檔
     */
    get tableSchema_server() {

        let schema_100 = `-- 伺服器ID
                          server_id            INTEGER PRIMARY KEY AUTOINCREMENT,

                          -- 伺服器介紹
                          motd                 VARCHAR(150),

                          -- 伺服器版本
                          version              VARCHAR(50),

                          -- 伺服器連接埠
                          server_port          VARCHAR(10)  DEFAULT '25565',

                          -- 地圖的目錄
                          level_name           VARCHAR(50),

                          -- OP管理者
                          ops                  TEXT         DEFAULT NULL,

                          -- 地圖種子碼
                          level_seed           VARCHAR(100) DEFAULT NULL,

                          -- 開啟正版驗證
                          online_mode          INTEGER      DEFAULT 0,

                          -- 遊戲模式
                          gamemode             INTEGER      DEFAULT 0,

                          -- 地圖生成模式
                          level_type           VARCHAR(10)  DEFAULT 'DEFAULT',

                          -- 遊戲人數
                          max_players          INTEGER      DEFAULT 10,

                          -- 地獄傳送門
                          allow_nether         INTEGER      DEFAULT 1,

                          -- 開啟玩家打玩家
                          pvp                  INTEGER      DEFAULT 1,

                          -- 開啟飛行
                          allow_flight         INTEGER      DEFAULT 1,

                          -- 難度設定
                          difficulty           INTEGER      DEFAULT 0,

                          -- 啟用命令塊
                          enable_command_block INTEGER      DEFAULT 0,

                          -- 是否出現怪物
                          spawn_monsters       INTEGER      DEFAULT 0,

                          -- 生成村莊、遺跡、廢棄礦坑
                          generate_structures  INTEGER      DEFAULT 0,

                          created_at           DATETIME     DEFAULT CURRENT_TIMESTAMP`;

        let schema_101 = `-- 伺服器ID
                          server_id              INTEGER PRIMARY KEY AUTOINCREMENT,

                          -- 伺服器介紹
                          motd                   VARCHAR(150),

                          -- 伺服器版本
                          version                VARCHAR(50),

                          -- 伺服器連接埠
                          server_port            VARCHAR(10)  DEFAULT '25565',

                          -- 地圖的目錄
                          level_name             VARCHAR(50),

                          -- OP管理者
                          ops                    TEXT         DEFAULT NULL,

                          -- 地圖種子碼
                          level_seed             VARCHAR(100) DEFAULT NULL,

                          -- 開啟正版驗證
                          online_mode            VARCHAR(5)   DEFAULT 'false',

                          -- 遊戲模式
                          gamemode               VARCHAR(5)   DEFAULT 'false',

                          -- 地圖生成模式
                          level_type             VARCHAR(10)  DEFAULT 'DEFAULT',

                          -- 遊戲人數
                          max_players            INTEGER      DEFAULT 10,

                          -- 地獄傳送門
                          allow_nether           VARCHAR(5)   DEFAULT 'true',

                          -- 開啟玩家打玩家
                          pvp                    VARCHAR(5)   DEFAULT 'true',

                          -- 開啟飛行
                          allow_flight           VARCHAR(5)   DEFAULT 'true',

                          -- 難度設定
                          difficulty             VARCHAR(5)   DEFAULT 'false',

                          -- 啟用命令塊
                          enable_command_block   VARCHAR(5)   DEFAULT 'false',

                          -- 是否出現怪物
                          spawn_monsters         VARCHAR(5)   DEFAULT 'false',

                          -- 生成村莊、遺跡、廢棄礦坑
                          generate_structures    VARCHAR(5)   DEFAULT 'false',

                          -- 開啟防噴 (伺服器指令) - v1.0.1
                          gamerule_keepInventory VARCHAR(5)   DEFAULT 'false',

                          created_at             DATETIME     DEFAULT CURRENT_TIMESTAMP`;

        return schema_101;

    }

    /**
     * 建立資料表: 伺服器清單 - ok
     */
    async createTable() {

        let consoleTitle2 = consoleTitle + '[createTable]';
        console.log(consoleTitle2);

        await this.open();  //開啟資料庫連線


        //PS: 設定檔
        let sqlCreateTable_Setting_new = `CREATE TABLE IF NOT EXISTS setting (${this.tableSchema_setting})`;
        await this.db.run(sqlCreateTable_Setting_new);

        //PS: MC伺服器設定值
        let sqlCreateTable_Server_new = `CREATE TABLE IF NOT EXISTS server (${this.tableSchema_server})`;
        await this.db.run(sqlCreateTable_Server_new);

        //PS: 好友名單
        let sqlCreateTable_Friends_new = `CREATE TABLE IF NOT EXISTS friends (${this.tableSchema_friends})`;
        await this.db.run(sqlCreateTable_Friends_new);

    }

    /**
     * DB 升級 -
     *
     * PS: 記得升級完後要異動 setting.version 的版號為當前版本
     *
     * @return {Promise<void>}
     */
    async migration() {

        let consoleTitle2 = consoleTitle + '[migration]';

        //PS: 取當前 APP 的版本,對前一個版本做migration
        switch (this.appVersion) {
            case '1.0.0':  //初始版本
                //setting - 只有 dbVersion 欄位
                let sql1 = `insert into setting (dbVersion) values ('1.0.0')`;
                await this.db.exec(sql1, []);  //一次執行多條SQL
                break;

            case '1.0.1':
                //升級 1.0.0 的 DB

                //===
                try {

                    console.log(consoleTitle2, '升級資料表: server => 更新欄位型態、新增 [gamerule_keepInventory]');

                    //PS: 保留上一版的欄位資料
                    let fields = `motd, version, server_port, level_name, ops, level_seed, online_mode,
                    gamemode, level_type, max_players, allow_nether, pvp, allow_flight,
                    difficulty, enable_command_block, spawn_monsters, generate_structures`;

                    let sqlg = [
                        `drop table if exists server_dg_tmp;`,
                        `create table server_dg_tmp (${this.tableSchema_server});`,
                        `insert into server_dg_tmp (${fields}) Select ${fields} From server;`,
                        `drop table server;`,
                        `alter table server_dg_tmp rename to server;`
                    ];
                    await this.db.exec(sqlg.join('\n'), []);  //一次執行多條SQL

                } catch (e) {
                    console.error(consoleTitle2, e.message);
                }
                //===

                //PS: 必需留在最後面做異動
                try {

                    console.log(consoleTitle2, '升級資料表: setting => dbVersion 更名為 version，新增欄位: locale、isAdvance_Server_Start');

                    let sqlg = [
                        `drop table if exists setting_dg_tmp;`,
                        `create table setting_dg_tmp (${this.tableSchema_setting});`,
                        `insert into setting_dg_tmp (version) values ('${this.appVersion}');`,
                        `drop table setting;`,
                        `alter table setting_dg_tmp rename to setting;`
                    ];
                    await this.db.exec(sqlg.join('\n'), []);  //一次執行多條SQL

                } catch (e) {
                    console.error(consoleTitle2, e.message);
                }

                break;

            default:

                console.log(consoleTitle2, '無升級資料表');

                //PS: 沒有更新DB的都只做 setting.version 更新, migrationCheck() 才不會每次啟動時都做更新.
                let sqlu = `Update setting Set version = ?`;
                await this.db.run(sqlu, [this.appVersion]);

                break;
        }

    }


    /**
     * DB migration 檢查 - ok
     *
     * @return {Promise<void>}
     */
    async migrationCheck() {

        let consoleTitle2 = consoleTitle + '[migrationCheck]';
        console.log(consoleTitle2, `app Version: ${this.appVersion}`);


        //PS: 先建資料表 - createTable()
        await this.createTable();


        //PS: 檢查是否有此 app 新版本的設定資料
        let setting = await this.getSetting();
        if (setting) {
            //有 this.appVersion, 不做更新
            console.log(consoleTitle2, '無需升級DB');
        } else {
            //setting 無此版本

            //執行 - migration
            await this.migration();
        }

    }


    /**
     * 取當前版本 - 設定值資料 - ok
     *
     * @return {Promise<*>}
     *
     * call: migrationCheck()
     * call: /app/config.js => initLocale()
     * call: /app/form_preference.html
     */
    async getSetting() {

        let consoleTitle2 = consoleTitle + '[getSetting]';

        try {
            let sql = `Select *
                       From setting
                       Where version = ?`;
            //console.log(consoleTitle2, 'sql:', sql, this.appVersion);
            let data = await this.db.get(sql, [this.appVersion]);  //取最新版本
            console.log(consoleTitle2, data);

            global.Setting = data;   //PS: 共用

            return data;

        } catch (e) {
            console.error(consoleTitle2, e.message);
            return null;
        }

    }


    /**
     * 改變語系設定 - ok
     *
     * @param locale    語系: en, zh-tw
     *
     * @return {Promise<void>}
     */
    async setLocale(locale) {
        let consoleTitle2 = consoleTitle + '[setLocale]';
        let sql = `Update setting
                   Set locale = ?
                   Where version = ?`;
        await this.db.run(sql, [locale, this.appVersion]);
    }


    /**
     * 取 Minecraft 各版本的Logo圖示 - ok
     *
     * @param version
     * @return {string}
     * @private
     *
     * call: getServer(), getServerList()
     */
    _getMinecraftVersionJpg(version) {
        let logo = path.join(this.appPath, 'app', 'images', 'version', version.substring(0, 4) + '.jpg');
        return logo;
    }

    /**
     * 取 單一筆 伺服器資料 - ok
     *
     * @param {int}    server_id  伺服器ID
     * @return {Promise<void>}
     */
    async getServer(server_id) {

        let consoleTitle2 = consoleTitle + '[getServer]';
        //console.log(consoleTitle2, 'server_id:', server_id);

        let sql = `Select *
                   From server
                   Where server_id = ?`;
        let data = await this.db.get(sql, [server_id]);

        if (data) {
            data.logo = this._getMinecraftVersionJpg(data.version);   //'./images/version/' + item.version.substring(0, 4) + '-1.jpg';
        }
        //console.log(consoleTitle2, 'data:', data);

        return data;

    }

    /**
     * 取伺服器清單 - ok
     *
     * @return {Promise<*>}
     */
    async getServerList() {

        let consoleTitle2 = consoleTitle + '[getServerList]';
        //console.log(consoleTitle2);

        let sql = `Select *
                   From server
                   Where server_id > 0`;
        let data = await this.db.all(sql);

        data.forEach(item => {
            item.logo = this._getMinecraftVersionJpg(item.version);   //'./images/version/' + item.version.substring(0, 4) + '-1.jpg';
        })
        //console.log(consoleTitle2, 'data:', data);

        return data;

    }


    /**
     * 取伺服器PORT清單 - ok
     *
     * @return {Promise<*>}
     */
    async getServerUsedPortList() {

        let consoleTitle2 = consoleTitle + '[getServerUsedPortList]';
        console.log(consoleTitle2);

        let sql = `Select server_port
                   From server`;
        let data = await this.db.all(sql);

        return data;

    }


    /**
     * 取最新一筆的伺服器資料 - ok
     *
     * @return {Promise<*>}
     */
    async getLastServer() {

        let consoleTitle2 = consoleTitle + '[getLastServer]';
        console.log(consoleTitle2);

        let sql = `Select *
                   From server
                   Order by server_id desc
                   limit 1;`;
        let data = await this.db.get(sql);

        return data;

    }

    /**
     * 刪除伺服器資料 - ok
     *
     * @param {int}    server_id  伺服器ID
     * @return {Promise<void>}
     */
    async destroy_server(server_id) {

        let consoleTitle2 = consoleTitle + '[destroy_server]';
        //console.log(consoleTitle2, 'server_id:', server_id);

        await this.open();  //開啟資料庫連線

        //清空
        let sqlDelete = `Delete
                         From server
                         Where server_id = ?`;
        await this.db.run(sqlDelete, [server_id]);

        console.log(consoleTitle2, 'server_id:', server_id, 'done');

    }


    /**
     * 變更地圖 - ok
     *
     * @param server_id     伺服器ID
     * @param level_name    地圖目錄名稱
     * @return {Promise<void>}
     */
    async change_level_name(server_id, level_name) {

        let consoleTitle2 = consoleTitle + '[change_level_name]';
        console.log(consoleTitle2, 'server_id:', server_id, ',level_name:', level_name);

        let sqlu = `Update server
                    Set level_name = ?
                    Where server_id = ?`;
        await this.db.run(sqlu, [level_name, server_id]);

    }

}


module.exports = MyDB;
