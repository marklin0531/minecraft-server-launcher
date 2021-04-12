const {dialog, shell, BrowserWindow} = require('electron');
const {autoUpdater} = require('electron-updater');
const pkg = require('../../package.json');
const myProgressBar = require('./myProgressBar');   //進度條
const myMachineResource = require('./myMachineResource');

// https://www.jianshu.com/p/15bde714e198
// https://wangdaodao.com/20210204/electron-updater.html

// PS: 本地 publish 到 github 需使用 Github TOKEN
// [Mac/Linux - Env]
// export GH_TOKEN="<YOUR_TOKEN_HERE>"

// [Windows - PowerShell]
// [Environment]::SetEnvironmentVariable("GH_TOKEN","<YOUR_TOKEN_HERE>","User")

let consoleTitle = '[/app/common/autoUpdater.js]';
const checkUpdate = (win) => {

    let consoleTitle2 = consoleTitle + '[checkUpdate]';
    let i18n = global.i18n;
    //let winMain = BrowserWindow.getFocusedWindow();  //PS： 取當前Focus 的視窗

    const autoUpdater_progressBarText = new myProgressBar.TextBar({parentWin: null, text: '執行'});  //文字型進度條

    autoUpdater.autoDownload = false;  //PS: 更改為不自動下載
    //處理更新操作
    const returnData = {
        error: {
            status: -1,
            msg: '更新時發生意外，無法進行正常更新!'
        },
        checking: {
            status: 0,
            msg: '正在檢查更新...'
        },
        updateAva: {
            status: 1,
            msg: '正在升級...'
        },
        updateNotAva: {
            status: 2,
            msg: '開始載入...'
        }
    };

    //console.log(consoleTitle2, 'win:', win);
    //console.log(consoleTitle2, 'global.i18n:', global.i18n);
    //console.log(consoleTitle2, 'autoUpdater:', autoUpdater);


    //PS: 也可以在這設定更新地址
    // autoUpdater.setFeedURL({
    //     provider: 'generic',
    //     url: updateConfig.download
    // })

    //發生錯誤 - 事件在最後面才被觸發
    autoUpdater.on('error', (error) => {
        console.log(consoleTitle, '[error] stack:', error.stack);
        //console.log(consoleTitle, '[error] message:', error.message);

        // if (error.message.indexOf('DISCONNECTED') !== -1) {
        //     console.log(consoleTitle,'[error] 網路未連線');
        // }
        //dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
    })

    //顯示訊息
    function sendStatusToWindow(text) {
        let consoleTitle3 = consoleTitle2 + '[sendStatusToWindow]';
        console.log(consoleTitle3, text);
        //win.webContents.send('autoUpdater_message', text);  //傳給Renderer
    }

    //1.检查事件
    autoUpdater.on('checking-for-update', async (e) => {

        console.log(consoleTitle, '[checking-for-update]');
        //sendStatusToWindow('Checking for update...');
        //console.log(consoleTitle2, 'autoUpdater_progressBarText:', autoUpdater_progressBarText);

        autoUpdater_progressBarText.parentWin = BrowserWindow.getFocusedWindow();  //PS： 取當前Focus 的視窗
        autoUpdater_progressBarText.text = i18n.__('Run');
        autoUpdater_progressBarText.show(`${i18n.__('autoUpdater.Checking for Updates')}...`);

        if (await myMachineResource.networkStatus()) {
        } else {
            dialog.showMessageBox(win,{
                title: i18n.__('Notice'),
                message: `${i18n.__('autoUpdater.Disconnected Cannot Check for Updates')}...`
            })
            autoUpdater_progressBarText.hide();
        }

    })

    //有新版本可下載
    autoUpdater.on('update-available', (info) => {
        //sendStatusToWindow('update-available...');

        dialog.showMessageBox(win,{
            type: 'info',
            title: i18n.__('autoUpdater.Update available'),  //'新版本提醒',
            message: '發現有新版本' + info.version + '，是否更新?',
            buttons: ['更新', '不了'],
            cancelId: 1,
        }).then(index => {
            if (index.response === 0) {
                shell.openExternal(`${pkg.repository.url}/releases`);  //PS: 開啟Github Release頁
                //autoUpdater.downloadUpdate();  //下載
            } else {
            }
        })

        autoUpdater_progressBarText.hide();
    })

    //無新版本
    autoUpdater.on('update-not-available', () => {

        //PS: 需加 win ，否則在 win10 內訊息視窗會被主視窗蓋掉
        dialog.showMessageBox(win, {
            title: i18n.__('Notice'),
            message: i18n.__('autoUpdater.Update not available')  //'暫無更新'
        })

        autoUpdater_progressBarText.hide();
        //sendStatusToWindow('update-not-available...');
    })

    //下載進度
    autoUpdater.on('download-progress', (progress) => {
        //console.log('progress:', progress);
        /*{
          total: 253195479,
          delta: 10911798,
          transferred: 237198657,
          percent: 93.68202700017405,
          bytesPerSecond: 3017987
        }
        */
        //sendStatusToWindow('Download progress...');
    })

    //下載完成，詢問是否安裝
    autoUpdater.on('update-downloaded', () => {
        dialog.showMessageBox(win,{
            type: 'info',
            title: '安裝更新',
            buttons: ['安裝', '稍候安裝'],
            message: '安裝檔已經下載完畢，是否現在安裝？',
            cancelId: 1,
        }).then(index => {
            if (index.response === 0) {
                myAutoUpdater.quitAndInstall();
            }
        })
    })

}

module.exports = checkUpdate;
