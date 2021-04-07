/**
 * 取主機資源
 */
let consoleTitle = '[/common/myMachineResource.js]';
const publicIp = require('public-ip');      //取外網IP: https://www.npmjs.com/package/public-ip
const internalIp = require('internal-ip');  //取內網IP:
const osu = require('node-os-utils');       //取主機資源: drive, memory, cpu

var drive = osu.drive;
var cpu = osu.cpu;
var mem = osu.mem;


module.exports = {

    getMachineResource: async () => {

        let consoleTitle2 = consoleTitle + '[getMachineResource]';
        console.log(consoleTitle2, `===========`, new Date());

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
        console.log(consoleTitle2, `===========`, new Date());

        //取內網IP
        let privateIP = await internalIp.v4();
        console.log(consoleTitle2, 'private_ip:', privateIP);
        //let privateIP = '192.168.1.127';

        console.log(consoleTitle2, `===========`, new Date());

        //取外網IP
        let publicIP = await publicIp.v4();
        console.log(consoleTitle2, 'public_ip:', publicIP);
        //let publicIP = '1.171.146.184';

        console.log(consoleTitle2, `===========`, new Date());


        //回傳結果
        return {
            cpuCount,
            cpuUsagePercentage,
            //driveInfo,
            memInfo,
            privateIP,
            publicIP
        }

    }

}
