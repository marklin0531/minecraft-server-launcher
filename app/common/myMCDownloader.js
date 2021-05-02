/**
 * Minecraft Vanilla jar 下載模組
 *
 * 2021-05-01 友
 */
const consoleTitle = '[/app/common/myMCDownloader.js]';
const path = require('path');
const electron = require('electron');
const myProgressBar = require('./myProgressBar');   //進度條
const myDownloader = require('./myDownloader');
const mcVerUrl = `https://launchermeta.mojang.com/mc/game/version_manifest.json`;
const isDev = global.isDev;
//console.log(consoleTitle, 'isDev:', isDev);


/**
 * 取 [某版本] 的 Client/Server 下載檔資訊 - ok
 *
 * @param version   版本: eg: 1.16.5
 * @return {Promise<{server: (*|(function(): *)|net.Server|Http2Server|Http2SecureServer), client: (*|null)}|null>}
 *
 * call: getServerJar()
 */
let getVersionInfo = async (version) => {

    let consoleTitle2 = consoleTitle + '[getVersionInfo]';

    //PS: 取 minecraft [全部版本] 的清單
    let versionsList = await myDownloader.getFileContent(mcVerUrl);
    //console.log('versionsList:', versionsList);

    if (versionsList) {

        versionsList = JSON.parse(versionsList);  //轉JSON物件

        //PS: 找出要下載的 [版本資訊檔] 的URL - JSON檔
        const versionInfos = versionsList.versions.find(({id}) => id === version);
        //console.log('versionInfos:', versionInfos);
        /*versionInfos: {
          id: '1.16.5',
          type: 'release',
          url: 'https://launchermeta.mojang.com/v1/packages/436877ffaef948954053e1a78a366b8b7c204a91/1.16.5.json',
          time: '2021-01-14T16:09:14+00:00',
          releaseTime: '2021-01-14T16:05:32+00:00'
        }
        */

        if (versionInfos) {

            //PS: 下載版本資訊檔的JSON內容
            let verInfoUrl = versionInfos.url;  //https://launchermeta.mojang.com/v1/packages/436877ffaef948954053e1a78a366b8b7c204a91/1.16.5.json
            let versionsInfoCont = await myDownloader.getFileContent(verInfoUrl);
            //console.log('versionsInfoCont:', versionsInfoCont);

            if (versionsInfoCont) {

                versionsInfoCont = JSON.parse(versionsInfoCont);  //轉JSON物件
                const versionsInfoDownloads = versionsInfoCont.downloads;
                const mc_client = versionsInfoDownloads.client;  //{sha1, size, url}
                const mc_server = versionsInfoDownloads.server;  //{sha1, size, url}

                //console.log('mc_client:', mc_client);
                /*mc_client: {
                  sha1: '37fd3c903861eeff3bc24b71eed48f828b5269c8',
                  size: 17547153,
                  url: 'https://launcher.mojang.com/v1/objects/37fd3c903861eeff3bc24b71eed48f828b5269c8/client.jar'
                }
                */

                //console.log('mc_server:', mc_server);
                /*mc_server: {
                  sha1: '1b557e7b033b583cd9f66746b7a9ab1ec1673ced',
                  size: 37962360,
                  url: 'https://launcher.mojang.com/v1/objects/1b557e7b033b583cd9f66746b7a9ab1ec1673ced/server.jar'
                }
                */

                let result = {
                    client: mc_client,
                    server: mc_server
                }
                return result;

            }

        }

    }

    return null;

}


/**
 * 下載 Client/Server Jar檔 - ok
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

    let consoleTitle2 = consoleTitle + '[download]';

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
            return res(true);  //成功

        }).catch(e => {

            //console.log(consoleTitle2, 'error:', e);  //e: File not found!

            if (onError) onError(e);
            return res(false);  //失敗

        });

    });

}


/**
 * 下載 伺服器JAR - ok
 *
 * PS: 顯示 Progress
 *
 * @param server            伺服器類型: Vanilla
 * @param version           伺服器版本: 1.16.5
 * @param save_path         JAR存放目錄: /Users/marge/minecraft/ServerLauncher/server/Vanilla-1.12.2.jar
 * @return {Promise<void>}
 *
 * call: /app/common/ipcManOpenWindows.js
 */
let downloadAndInstall = async (server, version, save_path) => {

    let consoleTitle2 = consoleTitle + `[downloadAndInstall][${server}-${version}]`;

    //PS: 進度條
    let focusWinMain = electron.BrowserWindow.getFocusedWindow();  //PS： 取當前Focus 的視窗
    let progressBarNumber = new myProgressBar.NumberBar({parentWin: focusWinMain, text: '等候...'}); //數字型進度條
    progressBarNumber.show('下載完成 $value of $maxValue %');  //設定顯示-數字進度文案
    progressBarNumber.progress(0);  //更新數字進度


    //region 支援各類型的伺服器安裝

    //PS: 下載Vanilla (原味)
    let downloadVanilla = async (server, version, save_path) => {

        let consoleTitle3 = consoleTitle2 + '[downloadVanilla]';

        console.log(consoleTitle3, '========= Start');
        let verInfo = await getVersionInfo(version);  //取伺服器資料

        console.log(consoleTitle3, 'verInfo:', verInfo);
        console.log(consoleTitle3, '========= End');

        if (verInfo) {

            console.log(consoleTitle3, '========= Start Download Jar');

            const _save_path = save_path;             //存檔路徑
            const _server_url = verInfo.server.url;   //下載網址
            console.log(consoleTitle3, '_server_url:', _server_url);
            console.log(consoleTitle3, '_save_path:', _save_path);

            //PS: 開始下載
            let downloadResult = await download(_server_url, _save_path,
                //下載進度
                function (received, total) {

                    if (total) {
                        var percentage = (received * 100) / total;
                        if (isDev) console.log(consoleTitle3, '[下載進度-onProgress]', percentage + "% | " + received + " bytes out of " + total + " bytes.");
                        progressBarNumber.progress(Math.floor(percentage));  //更新數字進度
                    } else {
                        //console.error(consoleTitle3, '下載失敗');
                    }

                },
                //下載完成
                (save_path) => {

                    console.log(consoleTitle3, '[下載完成-onFinish] map_save_path:', save_path);
                    progressBarNumber.show('下載完成');

                },
                //下載出錯
                (e) => {

                    console.error(consoleTitle3, '[下載失敗-onError]', e);
                    progressBarNumber.show('下載失敗');

                }

            );
            console.log(consoleTitle3, '[下載結果] downloadResult:', downloadResult);
            //----------------------
            progressBarNumber.hide();  //關閉進度條

            return downloadResult;  //true=下載成功，false=下載失敗

        }

        return false;

    }

    //TODO: 下載Forge
    let downloadForge = async (server, version, save_path) => {

        progressBarNumber.show('尚未支援此伺服器類型');

        return false;  //未支援
    }

    //endregion


    //PS: 下載不同的伺服器類型
    switch (server) {
        case 'Vanilla':

            return await downloadVanilla(server, version, save_path);  //true=下載成功，false=下載失敗

        case 'Forge':

            return await downloadForge(server, version, save_path);

        default:

            progressBarNumber.show('不支援此伺服器類型');
            setTimeout(() => progressBarNumber.hide(), 10000);  //關閉進度條

            return false;

    }

}


module.exports = {
    getVersionInfo,
    download,

    downloadAndInstall
}
