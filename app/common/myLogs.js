/**
 * Logs 模組
 *
 * 2021-05-09 友
 */
const consoleTitle = '[/app/common/myLogs.js]';
const {app} = require('electron');
const path = require('path');
const log = require('electron-log');                       //Log
const {is} = require('electron-util');                     //相關好用的函式庫 https://github.com/sindresorhus/electron-util
const isDev = is.development;                              //開發與正式環境偵測
const appPath = app.getAppPath();                          //程式啟動目錄
const userDataPath = app.getPath('userData');        //PS：使用個人目錄來放存


//log.transports.console.level = false;  //不輸出
// 日志大小，默认：1048576（1M），达到最大上限后，备份文件并重命名为：main.old.log，有且仅有一个备份文件
//log.transports.file.maxSize = 1048576;

// 日誌檔名，默認：main.log
const logFileName = 'latest.log';
log.transports.file.fileName = logFileName;  //設定Log檔名

//PS: 開發環境
let logFilePath = path.join(`${isDev ? appPath : userDataPath}`, 'logs', `${logFileName}`);  //AP目錄下的檔案路徑
log.transports.file.resolvePath = () => logFilePath;
const logFile = log.transports.file.getFile();  //取得Log檔寫入的路徑

console.log = log.log;  //PS: 替換 console 的輸出
