/**
 * Minecraft 伺服器 - 啟動器
 *
 * 2021-03-28 友
 */
const consoleTitle = '[/app/common/myMCLauncher.js]';
const wrap = require('minecraft-wrap');    //v1.3.0
const path = require('path');
const fs = require('fs');
const pidusage = require('pidusage');  //https://www.npmjs.com/package/pidusage
const byteSize = require('byte-size');


class myMCLauncher {

    /**
     * @param options                       MC伺服器設定值
     * @param options.server_id             伺服器ID
     * @param {object} options.serverDir                   伺服器目錄物作
     * @param {object} options.serverDir.appFolderPath     APP程式目錄
     * @param {string} options.serverDir.rootFolderPath    伺服器父層root目錄
     * @param {string} options.serverDir.serverFolderPath  伺服器目錄
     *
     * @param options.version               版本,eg: 1.13.2
     * @param options.motd                  x
     * @param options.server_port           x
     * @param options.level_name            x
     * @param options.ops                   x
     * @param options.level_seed            x
     * @param options.online_mode           x
     * @param options.gamemode              x
     * @param options.level_type            x
     * @param options.allow_nether          x
     * @param options.pvp                   x
     * @param options.difficulty            x
     * @param options.enable_command_block  x
     * @param options.spawn_monsters        x
     * @param options.generate_structures   x
     */
    constructor(options) {

        this.version = options.version;
        this.server_id = options.server_id;

        this.consoleTitle = consoleTitle + `[${this.server_id}][${this.version}]`;

        this.options = options;  //MC伺服器設定值

        //PS: 建立伺服器啟動
        this.jarFile = path.join(`${options.serverDir.jarFolderPath}`, `${this.version}.jar`);   //MC伺服器jar
        this.serverDir = `${options.serverDir.serverFolderPath}`;                  //伺服器檔案目錄
        this.Server = new wrap.WrapServer(this.jarFile, this.serverDir);           //PS: 建立伺服器啟動

        this.isRunning = false;   //伺服器是否執行中

        //預設 server.properties 欄位值
        this.defaultServerProps = {
            'generator-settings': '',
            'op-permission-level': '4',
            'allow-nether': 'true',
            'level-name': 'world',
            'enable-query': 'false',
            'allow-flight': 'false',
            'announce-player-achievements': true,
            'server-port': '25565',
            'level-type': 'DEFAULT',
            'enable-rcon': 'false',
            'force-gamemode': 'false',
            'level-seed': '',
            'server-ip': '',
            'max-build-height': '256',
            'spawn-npcs': 'true',
            'white-list': 'false',
            'spawn-animals': 'true',
            hardcore: 'false',
            'snooper-enabled': 'true',
            'online-mode': 'true',
            'resource-pack': '',
            pvp: 'true',
            difficulty: '1',
            'enable-command-block': 'false',
            gamemode: '0',
            'player-idle-timeout': '0',
            'max-players': '20',
            'spawn-monsters': 'true',
            'generate-structures': 'true',
            'view-distance': '10',
            'spawn-protection': '16',
            motd: 'A Minecraft Server'
        };

    }

    /**
     * 將DB設定值 轉成 取MC伺服器設定值
     *
     * @param {object} options  DB設定的 MC伺服器設定值
     * @return {{"level-name": *, motd: *, pvp: Document.pvp|string|*, "level-seed": *, "server-port": *, "allow-nether": Document.allow_nether|*, gamemode: Document.gamemode|string|*, "enable-command-block": Document.enable_command_block|*, "generate-structures": Document.generate_structures|*, difficulty: Document.difficulty|string|*, ops: string|*, "level-type": Document.level_type|*, "spawn-monsters": Document.spawn_monsters|*, "max-players", "online-mode": Document.online_mode|*, "allow-flight": *|boolean}}
     */
    getServerProperties(options) {

        let sp = options;  //MC伺服器設定值
        let properties = {
            'server-port': sp.server_port,
            motd: sp.motd,
            'online-mode': sp.online_mode,
            'allow-nether': sp.allow_nether,
            'level-name': sp.level_name,
            'level-type': sp.level_type,
            'level-seed': sp.level_seed,
            pvp: sp.pvp,
            difficulty: sp.difficulty,
            gamemode: sp.gamemode,
            'enable-command-block': sp.enable_command_block,
            'spawn-monsters': sp.spawn_monsters,
            'generate-structures': sp.generate_structures,
            'max-players': sp.max_players || 10,
            'allow-flight': sp.allow_flight !== undefined ? sp.allow_flight===1 : true,

            //PS: 新加的功能
            ops: sp.ops,              //管理者(逗號分隔)
            'view-distance': '8',    //視距，默認值是10。含義是玩家的視距也就是加載的區塊范圍
            'rcon.password':'',       //設定RCON遠程訪問的密碼（參見enable-rcon）。RCON：能允許其他應用程式透過網際網路與Minecraft伺服器連接並互動的遠程控制台協議。
            'rcon.port':'',           //設定RCON遠程訪問的埠號 (def: 25575)
            'enable-status': 'true',  //使伺服器在伺服器列表中看起來是「線上」的
        };

        return properties;

    }

    /**
     * 更新 options 設定值
     * 儲存 server.properties 檔案
     * 儲存 ops.txt 檔案
     *
     * @param {object} options  DB設定的 MC伺服器設定值
     */
    writeServerProperties(options) {

        let consoleTitle2 = this.consoleTitle + '[writeServerProperties]';

        this.options = options;   //PS: 更新設定值

        //PS: 伺服器目錄存在
        if (fs.existsSync(this.serverDir)) {

            //---------
            //PS: 重新寫入 server.properties
            let spPath = path.join(this.serverDir, 'server.properties');
            let propOverrides = this.getServerProperties(options);

            const props = {}
            Object.keys(this.defaultServerProps).forEach(prop => {
                props[prop] = this.defaultServerProps[prop]
            })
            Object.keys(propOverrides).forEach(prop => {
                props[prop] = propOverrides[prop]
            })

            let spData = Object.keys(props).map(prop => prop + '=' + props[prop] + '\n').join('');

            console.log(consoleTitle2, 'spPath:', spPath);
            console.log(consoleTitle2, 'spData:', spData);

            fs.writeFileSync(spPath, spData);

            //---------
            //PS: 重新寫入 ops.txt
            console.log(consoleTitle2, '=== propOverrides.ops:', propOverrides.ops);

            try {
                fs.unlinkSync(path.join(`${this.serverDir}`, `ops.json`));
                fs.unlinkSync(path.join(`${this.serverDir}`, `ops.txt.converted`));
            } catch (e) {
            }

            if (propOverrides.ops.length > 0) {
                let opsPath = path.join(this.serverDir, 'ops.txt');
                console.log(consoleTitle2, '=== opsPath:', opsPath);
                fs.writeFileSync(opsPath, propOverrides.ops.split(',').join('\n'));
            } else {
                let opsPath = path.join(this.serverDir, 'ops.json');
                console.log(consoleTitle2, '=== opsPath:', opsPath);
                fs.writeFileSync(opsPath, '[]');
            }
            //---------

        }

    }


    /**
     * 啟動
     */
    start(doneStart) {

        let consoleTitle2 = this.consoleTitle + '[start]';

        let self = this;
        let _Server = this.Server;

        //輸出 伺服器 log
        _Server.on('line', function (line) {
            console.log(consoleTitle2, 'log:', line);
        });

        //PS: 取 MC伺服器設定值
        let propOverrides = this.getServerProperties(this.options);

        //PS: 啟動伺服器
        _Server.startServer(propOverrides, function (err) {

            if (err) {

                self.isRunning = false;  //伺服器停止
                console.log(consoleTitle2, err);

            } else {

                console.log(consoleTitle2, 'Server Started !');

                self.isRunning = true;  //伺服器啟動

                //PS: 測試下命令
                // https://github.com/mononz/Minecraft-NodeJS
                //_Server.writeServer('/help' + '\n');
                _Server.writeServer('/list' + '\n');

            }

            //console.log(consoleTitle2, '_Server:', _Server);
            //console.log(consoleTitle2, '_Server.mcServer:', _Server.mcServer);

            //PS: 回呼
            if (doneStart) doneStart(err);

        });

    }


    /**
     * 停止
     */
    stop(doneStop) {

        let consoleTitle2 = this.consoleTitle + '[stop]';

        let self = this;

        this.Server.stopServer(function (err) {

            if (err) {
                console.log(consoleTitle2, err);
                //return;
            } else {
                console.log(consoleTitle2, 'Server Stopped!');
                self.isRunning = false;  //伺服器停止
            }

            //PS: 回呼
            if (doneStop) doneStop(err);

        });

    }


    /**
     * 取 start() 的 java 使用資源 - ok
     * PS: 必需在 start() 之後才能使用此函式
     *
     * @return {Promise<*>}
     */
    async stats() {

        if (this.Server.mcServer) {

            //PS: 取 pid
            let pid = this.Server.mcServer.pid;

            const _stats = await pidusage(pid);
            if (_stats) {
                let _memory = byteSize(_stats.memory);    //將 bytes 數字轉成 kb, MB
                _stats.memory = `${_memory.value}${_memory.unit}`;
            }
            //_stats: {
            //   cpu: 10.0,            // percentage (from 0 to 100*vcore)
            //   memory: 357306368,    // bytes
            //   ppid: 312,            // PPID
            //   pid: 727,             // PID
            //   ctime: 867000,        // ms user + system time
            //   elapsed: 6650000,     // ms since the start of the process
            //   timestamp: 864000000  // ms since epoch
            // }
            return _stats;

        }

        return null;

    }

}


module.exports = myMCLauncher;
