/**
 * 取主機資源
 */
let consoleTitle = '[/app/common/myMachineResource.js]';
const myDate = require('./myDate');         //日期處理
const publicIp = require('public-ip');      //取外網IP: https://www.npmjs.com/package/public-ip
const internalIp = require('internal-ip');  //取內網IP:
const isOnline = require('is-online');      //網路連線狀態: https://www.npmjs.com/package/is-online
const osu = require('node-os-utils');       //取主機資源: drive, memory, cpu

//let drive = osu.drive;
let cpu = osu.cpu;
let mem = osu.mem;


/**
 * 檢測網路狀態: true=連線 , false=無網路
 *
 * @return {Promise<*>}
 */
let networkStatus = async () => {

    let consoleTitle2 = consoleTitle + '[networkStatus]';

    let sdate = new Date();
    let isonline = await isOnline({timeout: 3000});
    let spendSecTimes = myDate.calculatorRunTimes(sdate).milliseconds;  //計算花費秒數
    console.log(consoleTitle2, 'isonline:', isonline, ` => 花費: ${spendSecTimes} 毫秒`);

    return isonline;  //true false

}



module.exports = {

    /**
     * 取主機資源
     *
     * @return {Promise<{memInfo: unknown, privateIP: string, cpuUsagePercentage: unknown, publicIP: *, cpuCount}>}
     */
    getMachineResource: async () => {

        let consoleTitle2 = consoleTitle + '[getMachineResource]';
        let sdate = new Date();  //啟始時間

        //CPU資訊
        let cpuCount = cpu.count(); // 8
        console.log(consoleTitle2, 'cpuCount:', cpuCount);  //12

        let cpuUsagePercentage = await (new Promise((resolve, reject) => {
            cpu.usage()
                .then(cpuPercentage => {
                    console.log(consoleTitle2, 'cpuPercentage:', cpuPercentage); // 10.38
                    return resolve(cpuPercentage);
                });
        }));

        //PS: 如果檔案放網路磁碟會發生錯誤
        // let driveInfo = await (new Promise((resolve, reject) => {
        //     drive.info()
        //         .then(info => {
        //             console.log(consoleTitle2, 'driveInfo:', info);
        //             /*drive info: {
        //               totalGb: '102.2',
        //               usedGb: '14.0',
        //               freeGb: '88.2',
        //               usedPercentage: '13.7',
        //               freePercentage: '86.3'
        //             }
        //             */
        //             return resolve(info);
        //         });
        // }));

        //記憶體資訊
        let memInfo = await (new Promise((resolve, reject) => {
            mem.info()
                .then(info => {
                    console.log(consoleTitle2, 'memInfo:', JSON.stringify(info));
                    /*memory info: {
                      totalMemMb: 32768,
                      usedMemMb: 23468.08,
                      freeMemMb: 9299.92,
                      usedMemPercentage: 71.62,
                      freeMemPercentage: 28.38
                    }
                    */
                    return resolve(info);
                });

        }));

        //網路IP 資訊
        let privateIP = "127.0.0.1";  //取內網IP
        let publicIP = null;  //取外網IP
        if (await networkStatus()) {

            let sdate1 = new Date();  //啟始時間
            privateIP = await internalIp.v4();
            let spendSecTimes1 = myDate.calculatorRunTimes(sdate1).milliseconds;  //計算花費秒數
            console.log(consoleTitle2, 'private_ip:', privateIP, ` => 花費: ${spendSecTimes1} 毫秒`);

            let sdate2 = new Date();  //啟始時間
            publicIP = await publicIp.v4({timeout: 2000});
            let spendSecTimes2 = myDate.calculatorRunTimes(sdate2).milliseconds;  //計算花費秒數
            console.log(consoleTitle2, 'public_ip:', publicIP, ` => 花費: ${spendSecTimes2} 毫秒`);

        } else {
            console.log(consoleTitle2, `=========== 網路未連線`);
        }

        let spendSecTimes = myDate.calculatorRunTimes(sdate).milliseconds;  //計算花費秒數
        console.log(consoleTitle2, `共花費: ${spendSecTimes} 毫秒`);

        //回傳結果
        return {
            cpuCount,
            cpuUsagePercentage,
            //driveInfo,
            memInfo,
            privateIP,
            publicIP
        }

    },


    networkStatus

}
