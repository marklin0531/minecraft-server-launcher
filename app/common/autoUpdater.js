const {dialog} = require('electron');
const {autoUpdater} = require('electron-updater');

//let updater
//autoUpdater.autoDownload = false

autoUpdater.on('error', (error) => {
    dialog.showErrorBox('Error: ', error == null ? "unknown" : (error.stack || error).toString())
})

autoUpdater.on('update-available', (info) => {
    dialog.showMessageBox({
        type: 'info',
        title: '更新提示',
        message: '發現有新版本' + info.version + '，是否更新?',
        buttons: ['更新', '不了'],
        cancelId: 1,
    }).then(index => {
        if (index.response === 0) {
            autoUpdater.downloadUpdate();
        } else {
            //updater.enabled = true
            //updater = null
        }
    })
})

autoUpdater.on('update-not-available', () => {
    dialog.showMessageBox({
        title: '提示',
        message: '暫無更新'
    })
    // updater.enabled = false
    // updater = null
})

autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
        type: 'info',
        title: '安裝更新',
        buttons: ['安裝', '稍候安裝'],
        message: '安裝檔已經下載完畢，是否現在安裝？',
        cancelId: 1,
    }).then(index => {
        if (index.response === 0) {
            autoUpdater.quitAndInstall();
        }
    })
})

// export this to MenuItem click callback
// export function checkForUpdates(menuItem, focusedWindow, event) {
//     updater = menuItem
//     updater.enabled = false
//     autoUpdater.checkForUpdates()
// }
