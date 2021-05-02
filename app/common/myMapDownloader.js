/**
 * 地圖下載/解壓縮檔 模組
 *
 * 2021-04-28 友
 */
const consoleTitle = '/app/common/myMapDownloader.js';
const path = require('path');
const fs = require('fs');
var rimraf = require("rimraf");   //移除目錄
require('./myString');            //字串處理模組

const electron = require('electron');
const myProgressBar = require('./myProgressBar');   //進度條
const myDownloader = require('./myDownloader');     //下載檔案模組
const AdmZip = require('adm-zip');   //https://www.npmjs.com/package/adm-zip

const isDev = global.isDev;
//console.log(consoleTitle, 'isDev:', isDev);


/**
 * 下載 地圖zip檔 - ok
 *
 * @param {string} url          下載的網址
 * @param {string} savePath     儲存路徑
 * @param {function} onProgress 下載進度
 * @param {function} onFinish   完成的回呼
 * @param {function} onError    失敗的回呼
 *
 * call: downloadAndInstall()
 */
let download = async (url, savePath, onProgress = () => null, onFinish = (savePath) => null, onError = (e) => null) => {

    const consoleTitle2 = consoleTitle + '[download]';

    return new Promise((res, rej) => {

        return myDownloader.downloadFile({
            remoteFile: url,
            localFile: savePath,
            onProgress
            // onProgress: function (received, total) {
            //     var percentage = (received * 100) / total;
            //     console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
            // }
        }).then(function () {

            //console.log(consoleTitle2, "File succesfully downloaded");

            if (onFinish) onFinish(savePath);
            return res(true);

        }).catch(e => {

            //console.log(consoleTitle2, 'error:', e);  //e: File not found!

            if (onError) onError(e);
            return res(false);

        });

    });

}


/**
 * 下載遠端地圖zip檔 + 解壓到地圖目錄內 - ok
 *
 * PS: 顯示 Progress
 *
 * @param map_folder_path  地圖 存放的 目錄路徑,eg: //Users/marge/minecraft/ServerLauncher/server/5/world
 * @param map_url          下載地圖的網址,eg: https://map.mc.tw/xxx.zip
 * @param map_info         地圖資訊: Object
 * @return {Promise<void>}
 *
 * call: ipcManOpenWindows.js
 */
let downloadAndInstall = async (map_folder_path, map_url, map_info) => {

    const consoleTitle2 = consoleTitle + '[downloadAndInstall]';

    const server_folder = path.resolve(map_folder_path, '..');     //取上一層目錄： 伺服器目錄
    const map_filename = map_url.split('/').reverse()[0];          //地圖檔名
    let map_save_path = path.join(server_folder, map_filename);    //下載地圖的存放位置
    console.log(consoleTitle2, 'map_save_path:', map_save_path);   // /Users/marge/minecraft/ServerLauncher/server/5/IJAMinecrafts-OneBlock-1-16-4.zip

    //PS: 進度條
    let focusWinMain = electron.BrowserWindow.getFocusedWindow();  //PS： 取當前Focus 的視窗
    let progressBarNumber = new myProgressBar.NumberBar({parentWin: focusWinMain, text: '等候...'}); //數字型進度條
    progressBarNumber.show('下載完成 $value of $maxValue %');  //設定顯示-數字進度文案
    progressBarNumber.progress(0);  //更新數字進度

    //----------------------
    /**
     * PS: 安裝zip檔案的地圖 - ok
     *
     * @param sourceZipFile  來源 zip 檔
     * @param targetFolder   目的的解壓目錄
     *
     * call: downloadStart()
     */
    const install = (sourceZipFile, targetFolder) => {

        let consoleTitle3 = consoleTitle2 + '[install]';
        console.log(consoleTitle3, sourceZipFile, ' to ', targetFolder);

        //PS: 移除地圖目錄內的檔案 - ok
        console.log(consoleTitle3, '[移除地圖目錄] targetFolder:', targetFolder);
        rimraf.sync(targetFolder);

        //----------------------
        //region -- [解壓 zip] -- ok
        try {

            const zip = new AdmZip(sourceZipFile);
            let isZipHasMainFolder = true;
            let zipEntryName = null;

            for (let [idx, entry] of zip.getEntries().entries()) {

                var entryName = entry.entryName;           //全名 - 目錄 OR 目錄＋檔名
                let entryFilename = entry.name;            //檔名
                let entryIsDirectory = entry.isDirectory;  //true=目錄, false=檔案

                zipEntryName = entryName;

                //console.log(entry);
                /*{
                  entryName: [Getter/Setter],
                  rawEntryName: [Getter],
                  extra: [Getter/Setter],
                  comment: [Getter/Setter],
                  name: [Getter],
                  isDirectory: [Getter],
                  getCompressedData: [Function: getCompressedData],
                  getCompressedDataAsync: [Function: getCompressedDataAsync],
                  setData: [Function: setData],
                  getData: [Function: getData],
                  getDataAsync: [Function: getDataAsync],
                  attr: [Getter/Setter],
                  header: [Getter/Setter],
                  packHeader: [Function: packHeader],
                  toString: [Function: toString]
                }
                */
                //console.log(entryName, ',', entryFilename, ',', entryIsDirectory);

                if (!entryIsDirectory) {
                    //PS: 檢查這二個檔案的存放路徑是否在 zip 的根目錄下
                    if (entryName.startsWith('level.dat') || entryName.startsWith('session.lock')) {
                        if (entryName === entryFilename) {  //true = 地圖檔是放在zip根目錄下
                            isZipHasMainFolder = false;    //false=代表zip檔的根目錄已是地圖檔案
                            break;
                        }
                    }
                }

            }

            //PS: 地圖檔是放在zip內的某個目錄下
            //console.log('isZipHasMainFolder:', isZipHasMainFolder);
            if (isZipHasMainFolder) {

                let zipMainFolder = zipEntryName.split('/')[0];  //取第1個目錄，eg: OneBlock by IJAMinecraft (1.16.4)
                console.log(consoleTitle3, `[地圖檔是放在zip內的「${zipMainFolder}」目錄下]`);

                //PS: 解壓到 server/5 目錄下，目錄為 /server/5/OneBlock by IJAMinecraft (1.16.4)
                console.log(consoleTitle3, '[解壓zip檔] =>', server_folder);
                zip.extractAllTo(server_folder, true);  // PS: /Users/marge/data/NAS-HOME/minecraft/nodejs-dev/ServerLauncher/server/5/OneBlock by IJAMinecraft (1.16.4)

                //PS: Rename Folder - ok
                try {

                    const map_zip_folder = path.join(server_folder, zipMainFolder);
                    console.log(consoleTitle3, '[zip目錄更名]', map_zip_folder, '=>', targetFolder);

                    fs.renameSync(map_zip_folder, targetFolder);

                } catch (err) {
                    console.error(consoleTitle3, '[zip目錄更名]', err);
                }

            } else {

                //PS: 地圖檔是放在zip根目錄下
                console.log(consoleTitle3, `[地圖檔是放在zip內的「根」目錄下]`);
                console.log(consoleTitle3, '[解壓zip檔] =>', targetFolder);

                //PS: 直接寫入地圖目錄 - ok
                zip.extractAllTo(targetFolder, true);  // PS: /Users/marge/data/NAS-HOME/minecraft/nodejs-dev/ServerLauncher/server/5/OneBlock by IJAMinecraft (1.16.4)

            }

        } catch (e) {
            progressBarNumber.show('下載失敗，請重新再下載看看...');
        }
        //endregion

    }

    //----------------------
    //PS: 下載地圖 - ok
    const downloadStart = async () => {

        //----------------------
        //true = 下載完成
        let downloadResult = await download(map_url, map_save_path,
            //下載進度
            (received, total) => {

                if (total) {
                    var percentage = (received * 100) / total;
                    if (isDev) console.log(consoleTitle2, '[下載進度-onProgress]', percentage + "% | " + received + " bytes out of " + total + " bytes.");
                    progressBarNumber.progress(Math.floor(percentage));  //更新數字進度
                } else {
                    //console.error(consoleTitle2, '下載失敗');
                }

            },
            //下載完成
            (map_save_path) => {

                console.log(consoleTitle2, '[下載完成-onFinish] map_save_path:', map_save_path);
                progressBarNumber.show('下載完成');

                //-----------
                progressBarNumber.show('地圖安裝中...');

                //PS: unzip to map folder
                install(map_save_path, map_folder_path);

                //PS: 寫入地圖記錄檔 map_info.json
                let map_info_data = Object.assign({}, map_info, {
                    install_date: new Date()
                });
                map_info_data = JSON.stringify(map_info_data, null, 2);
                let map_info_filepath = path.join(map_folder_path, 'map_info.json');
                console.log(consoleTitle2, '[寫入地圖記錄檔]', map_info_filepath);
                fs.writeFileSync(map_info_filepath, map_info_data);

                //
                progressBarNumber.show('地圖安裝完成');
                //-----------

            },
            //下載出錯
            (e) => {

                console.error(consoleTitle2, '[下載失敗-onError]', e);
                progressBarNumber.show('下載失敗');

            }
        );

        //PS: 模擬已下載成功
        // let downloadResult = true;
        // map_save_path = path.join('.', 'factionwar1.zip');  //有目錄
        console.log(consoleTitle2, '[下載結果] downloadResult:', downloadResult);
        //----------------------
        if (downloadResult) {
        }
        //----------------------
        //PS: 移除 zip 檔案 - ok
        console.log(consoleTitle2, '[移除zip地圖檔] map_save_path:', map_save_path);
        rimraf.sync(map_save_path);
        //----------------------
        progressBarNumber.hide();  //關閉進度條

        return downloadResult;  //true=下載成功，false=下載失敗
    }
    return await downloadStart();  //true=下載成功，false=下載失敗

}


module.exports = {
    download,
    downloadAndInstall
}
