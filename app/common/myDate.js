/*
時間函式
 */

// 對Date的擴充套件，將 Date 轉化為指定格式的String
// 月(M)、日(d)、小時(h)、分(m)、秒(s)、季度(q) 可以用 1-2 個佔位符，
// 年(y)可以用 1-4 個佔位符，毫秒(S)只能用 1 個佔位符(是 1-3 位的數字)
// 例子：
// (new Date()).format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).format("yyyy-M-d hⓜ️s.S")   ==> 2006-7-2 8:9:4.18
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小時
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" +  k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length === 1) ? (o[k]) : (("00" +  o[k]).substr(("" + o[k]).length)));
    return fmt;
}


/**
 * 取 yyyy-mm-dd 日期 - ok
 *
 * @param date
 * @returns {string}
 */
var yyymmdd = function (date) {

    var mm = date.getMonth() + 1; // getMonth() is zero-based
    var dd = date.getDate();

    return [date.getFullYear(),
        (mm > 9 ? '' : '0') + mm,
        (dd > 9 ? '' : '0') + dd
    ].join('');

};


/**
 * 計算程式執行時間 - ok
 *
 * @param sdate -- 啟始時間: new Date()
 * @returns {{sdate: *, seconds: number, minutes: number, edate: Date}}
 */
var calculatorRunTimes = function (sdate) {

    if (!sdate) sdate = new Date();
    var edate = new Date();  //結束時間
    var dateDiff = edate.getTime() - sdate.getTime(); //时间差秒

    //计算出相差天数
    var days = Math.floor(dateDiff / (24 * 3600 * 1000));

    //计算出小时数
    var leave1 = dateDiff % (24 * 3600 * 1000);  //计算天数后剩余的毫秒数
    var hours = Math.floor(leave1 / (3600 * 1000));

    //计算相差分钟数
    var leave2 = leave1 % (3600 * 1000);        //计算小时数后剩余的毫秒数
    var minutes = Math.floor(leave2 / (60 * 1000));

    //计算相差秒数
    var leave3 = leave2 % (60 * 1000);     //计算分钟数后剩余的毫秒数
    var seconds = Math.round(leave3 / 1000);
    //alert("时间差" + days + "天" + hours + "时" + minutes + "分" + seconds + "秒");


    //毫秒
    let edate_ms = edate.getTime();   //結束時間-毫秒
    let sdate_ms = sdate.getTime();   //起始時間-毫秒

    return {
        sdate: sdate,                       //起始時間
        edate: edate,                       //結束時間
        minutes: minutes,                   //分
        seconds: seconds,                   //秒
        edate_ms: edate_ms,                 //結束時間-毫秒
        sdate_ms: sdate_ms,                 //起始時間-毫秒
        milliseconds: edate_ms - sdate_ms   //毫秒
    }

};


/**
 * console.log 顯示程式執行時間 - ok
 *
 * @param sdate -- 啟始時間: new Date()
 */
var console_showEndTime = function (sdate) {

    var runtimes = calculatorRunTimes(sdate);

    console.log('----------[使 用 時 間]----------');
    console.log('啟始時間:', runtimes.sdate);
    console.log('結束時間:', runtimes.edate);
    console.log('經過時間:', runtimes.minutes + "分" + runtimes.seconds + "秒");

};

module.exports = {
    console_showEndTime: console_showEndTime,
    calculatorRunTimes: calculatorRunTimes,
    yyymmdd: yyymmdd
};
