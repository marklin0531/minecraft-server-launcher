/**
 * ipcMan 操作伺服器
 */
const consoleTitle = '[/app/common/ipcManMCServer.js]';
const {app, BrowserWindow, ipcMain} = require('electron');
const myMCServerManager = require('./myMCServerManager');  //MC伺服器管理
const {
    width,
    height,
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


/**
 * 啟動MC伺服器 - 一般/進階 - ok
 */
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
            //await RenderList(param1);
            //PS: 載入清單 - 2021-04-16 改用觸發事件
            ipcMain.emit('ipcMain_RenderList', event, param1);
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


/**
 * 停止MC伺服器 - ok
 */
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
        //await RenderList(param1);
        //PS: 載入清單 - 2021-04-16 改用觸發事件
        ipcMain.emit('ipcMain_RenderList', event, param1);
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


/**
 * 重啟MC伺服器  ok
 */
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
        //await RenderList(param1);
        //PS: 載入清單 - 2021-04-16 改用觸發事件
        ipcMain.emit('ipcMain_RenderList', event, param1);
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


/**
 * MC伺服器使用的資源 - ok
 */
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

