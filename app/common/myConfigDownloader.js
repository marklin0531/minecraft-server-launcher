/**
 * 下載 config.json 設定檔
 *
 * 2021-05-09 友
 */
const consoleTitle = '[/app/common/myConnfigDownloader.js]';
const myDownloader = require('./myDownloader');     //下載檔案模組


async function downloadOnlineConfig(url, savePath, onProgress = () => null, onFinish = (savePath) => null, onError = (e) => null) {

    let consoleTitle2 = consoleTitle + '[downloadOnlineConfig]';

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

            console.log(consoleTitle2, "File succesfully downloaded");

            if (onFinish) onFinish(savePath);
            return res(true);

        }).catch(e => {

            console.log(consoleTitle2, 'error:', e);  //e: File not found!

            if (onError) onError(e);
            return res(false);

        });

    });

}


module.exports = {
    downloadOnlineConfig
}
