/**
 * 下載檔案模組
 *
 * 參考：https://ourcodeworld.com/articles/read/228/how-to-download-a-webfile-with-electron-save-it-and-show-download-progress
 *
 * 2021-04-19 友
 */
const consoleTitle = '/app/common/myDownloader.js';
var request = require('request');
var fs = require('fs');


/**
 * Promise based download file method
 *
 * @param configuration
 * @param {string} configuration.remoteFile
 * @param {string} configuration.localFile
 * @param {callback} configuration.onProgress
 *
 * @return Promise<*>
 */
function downloadFile(configuration){

    let consoleTitle2 = consoleTitle + '[downloadFile]';

    return new Promise(function(resolve, reject){
        // Save variable to know progress
        var received_bytes = 0;
        var total_bytes = 0;

        var req = request({
            method: 'GET',
            uri: configuration.remoteFile
        });

        var out = fs.createWriteStream(configuration.localFile);
        req.pipe(out);

        req.on('response', function ( data ) {

            console.log(consoleTitle2, 'response statusCode:', data.statusCode);

            if (data.statusCode !== 200) {
                return reject('File not found!');
            }

            // Change the total bytes value to get progress later.
            total_bytes = parseInt(data.headers['content-length']);
        });

        // Get progress if callback exists
        if(configuration.hasOwnProperty("onProgress")){
            req.on('data', function(chunk) {
                // Update the received bytes
                received_bytes += chunk.length;

                configuration.onProgress(received_bytes, total_bytes);
            });
        }else{
            req.on('data', function(chunk) {
                // Update the received bytes
                received_bytes += chunk.length;
            });
        }

        req.on('end', function() {
            resolve();
        });
    });
}


/**
 * 同步 [METHOD: GET] 下載檔案內容
 *
 * @param url
 * @return {Promise<unknown>}
 *
 * Usage:
 *   let versionsList = await myDownloader.getFileContentSync(mcVerUrl);
 */
const getFileContent = async (url) => {

    let consoleTitle2 = consoleTitle + '[getFileContent]';
    let result = await (_getFileContent(url).then((body) => {
        //console.log(consoleTitle2, body);
        return body;
    }).catch(e => {
        console.error(consoleTitle2, e);
        return null;
    }));

    return result;

}

/**
 * Promise 包 request - 取檔案內容
 *
 * @param url
 * @return {Promise<unknown>}
 * @private
 */
const _getFileContent = (url) => {

    let consoleTitle2 = consoleTitle + '[_getFileContent]';

    return new Promise(function(resolve, reject){

        request(url, function (error, response, body) {

            if (error) {
                //console.error('error:', error); // Print the error if one occurred
                return reject(error);
            }

            if (response && response.statusCode !== 200) {
                return reject(`${response.statusCode} ${response.statusMessage}`);
            }
            //console.log('response:', response);
            //console.log('statusCode:', response && response.statusCode, response.statusMessage); // Print the response status code if a response was received
            //console.log('body:', body); // Print the HTML for the Google homepage.

            return resolve(body);

        });

    });

}



//Usage:
// downloadFile({
//     remoteFile: "https://launcher.mojang.com/v1/objects/1b557e7b033b583cd9f66746b7a9ab1ec1673ced/server.jar",
//     localFile: "./1.16.5.jar",
//     onProgress: function (received,total){
//         var percentage = (received * 100) / total;
//         console.log(percentage + "% | " + received + " bytes out of " + total + " bytes.");
//     }
// }).then(function(){
//     console.log("File succesfully downloaded");
// });


module.exports = {
    getFileContent,
    downloadFile
};
