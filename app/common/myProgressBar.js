/**
 * ProgressBar
 *
 * https://www.npmjs.com/package/electron-progressbar
 * https://github.com/AndersonMamede/electron-progressbar/issues/8
 *
 * Created by 阿友 on 2021/02/23
 */
let consoleTitle = '[/app/common/myProgressBar.js]';
const ProgressBar = require('electron-progressbar');  //進度條遮罩


/**
 * 數字型進度條
 *
 * Usage:
 *
 *   let progressBarNumber = new myProgressBar.NumberBar({parentWin: childWin, text: '等候...'}); //數字型進度條
 *   progressBarNumber.show('Copying file $value of $maxValue...');  //設定顯示-數字進度文案
 *   let k=1, ik = 20;
 *   let interval = setInterval(() => {
 *      if (k <= 100) {
 *          k ++;
 *          progressBarNumber.progress(k);  //更新數字進度
 *      } else {
 *          clearInterval(interval);
 *          progressBarNumber.hide();
 *      }
 *   }, ik);
 */
class myProgressNumberBar {

    /**
     * 初始化
     *
     * @param options
     * @param [options.parentWin]
     * @param [options.backgroundColor]
     * @param [options.text]
     * @param [options.detail]
     * @param [options.maxValue]   數字進度最大值,預設: 100
     */
    constructor(options) {

        this.consoleTitle = consoleTitle + '[myProgressBarNumber]';
        let constTitle2 = this.consoleTitle + '[constructor]';
        if (!options) options = {};
        if (!options.backgroundColor) options.backgroundColor = '#ffffff';  //背景色
        if (!options.parentWin) options.parentWin = null;
        if (!options.text) options.text = `Preparing data...`;
        if (!options.detail) options.detail = `Copying file $value of $maxValue`;
        if (!options.maxValue) options.maxValue = 100;


        this.backgroundColor = options.backgroundColor;
        this.parentWin = options.parentWin;
        this.text = options.text;      //小標
        this.detail = options.detail;  //說明內容

        this.maxValue = options.maxValue;

        this.progressBar = null;

        //console.log(constTitle2, 'this:', this);

    }


    /**
     * 設定顯示-數字進度文案
     *
     * @param [detail]  數字進度說明內容,eg: Copying file $value of $maxValue
     * @param [text]    小標
     */
    show(detail, text) {

        let constTitle2 = this.consoleTitle + '[show]';

        //console.log(constTitle2, 'text:', text, ',detail:', detail, ',this.progressBar:', this.progressBar);

        if (detail) this.detail = detail;
        if (text) this.text = text;

        let _this = this;
        let progressBar = null;
        if (!this.progressBar) {

            //PS: 進度條遮罩
            progressBar = new ProgressBar({
                style: {
                    text: {
                        'overflow-y': 'hidden'  //text如為中文字時會出現scrollbar,所以加入此css
                    }
                },
                indeterminate: false,  //限文字+數字進度的訊息
                browserWindow: {
                    // width: 500,
                    // height: 500,
                    webPreferences: {
                        contextIsolation: false,  //PS: 必需有
                        nodeIntegration: true     //PS: 必需有
                    },
                    backgroundColor: this.backgroundColor,
                    parent: this.parentWin
                },
                text: this.text,         //小標
                detail: this.detail,     //說明內容
                maxValue: this.maxValue  //數字進度的最大值
            });

            progressBar
                .on('completed', function () {
                    console.info(constTitle2, `completed...`);
                    //progressBar.detail = '跑完了...';
                })

                .on('aborted', function (event) {
                    console.info(constTitle2, `我放棄了...`);
                })

                //進度
                .on('progress', function (value) {

                    var new_message = `${_this.detail}`;  //Copy 字串
                    //console.log(constTitle2, '[progress] new_message:', new_message, ',value:', value, ',progressBar.detail:', progressBar.detail);

                    new_message = new_message.replace(/\$value/, value);
                    new_message = new_message.replace(/\$maxValue/, progressBar.getOptions().maxValue);

                    //console.log(constTitle2, '[progress] new_message:', new_message);

                    progressBar.detail = new_message;
                });

            this.progressBar = progressBar;

        } else {

            this.progressBar.text = this.text;
            this.progressBar.detail = this.detail;

        }

        //console.log(constTitle2, 'this.progressBar:', this.progressBar);

    }


    /**
     * 隱藏
     */
    hide() {

        let constTitle2 = this.consoleTitle + '[hide]';
        //console.log(constTitle2);

        if (this.progressBar) {
            this.progressBar.setCompleted();
            this.progressBar = null;
        }

    }


    /**
     * 更新數字進度
     *
     * @param value 數字
     */
    progress(value) {

        if (!this.progressBar.isCompleted()) {
            this.progressBar.value = value;
        }

    }


}


/**
 * 文字型進度條
 *
 * Usage:
 *
 *   let progressBarText = new myProgressBar.TextBar({parentWin: childWin, text: '等候...'});     //文字型進度條
 *   progressBarText.show('檢測登入狀態...');
 *   setTimeout(() => progressBarText.show('檢測登入狀態2222...'), 3000);
 *   setTimeout(() => progressBarText.hide(), 10000);
 */
class myProgressTextBar {

    /**
     * 初始化
     *
     * @param options
     * @param [options.parentWin]
     * @param [options.backgroundColor]
     * @param [options.text]              小標
     * @param [options.detail]            說明內容
     *
     */
    constructor(options) {

        this.consoleTitle = consoleTitle + '[myProgressBarText]';
        let constTitle2 = this.consoleTitle + '[constructor]';
        if (!options) options = {};
        if (!options.backgroundColor) options.backgroundColor = '#ffffff';  //背景色
        if (!options.parentWin) options.parentWin = null;
        if (!options.text) options.text = `Preparing data...`;
        if (!options.detail) options.detail = `Wait...`;

        this.backgroundColor = options.backgroundColor;
        this.parentWin = options.parentWin;
        this.text = options.text;      //小標
        this.detail = options.detail;  //說明內容
        this.progressBar = null;

        //console.log(constTitle2, 'this:', this);

    }


    /**
     * 顯示
     *
     * @param [detail]  說明內容
     * @param [text]    小標
     */
    show(detail, text) {

        let constTitle2 = this.consoleTitle + '[show]';

        //console.log(constTitle2, 'text:', text, ',detail:', detail, ',this.progressBar:', this.progressBar);

        if (detail) this.detail = detail;
        if (text) this.text = text;


        let progressBar = null;
        if (!this.progressBar) {

            //PS: 進度條遮罩
            progressBar = new ProgressBar({
                style: {
                    text: {
                        'overflow-y': 'hidden'  //text如為中文字時會出現scrollbar,所以加入此css
                    }
                },
                //indeterminate: true,  //限文字訊息的進度
                browserWindow: {
                    // width: 500,
                    // height: 500,
                    webPreferences: {
                        contextIsolation: false,  //PS: 必需有
                        nodeIntegration: true     //PS: 必需有
                    },
                    backgroundColor: this.backgroundColor,
                    parent: this.parentWin
                },
                text: this.text || 'text',      //小標
                detail: this.detail || 'detail'   //說明內容
            });

            progressBar
                .on('completed', function () {
                    console.info(constTitle2, `completed...`);
                    //progressBar.detail = '跑完了，好累人o,o ...讓我休息一下...';
                })

                .on('aborted', function (event) {
                    console.info(constTitle2, `我放棄了...`);
                });

            this.progressBar = progressBar;

        } else {

            this.progressBar.text = this.text;
            this.progressBar.detail = this.detail;

        }

        //console.log(constTitle2, 'this.progressBar:', this.progressBar);

    }


    /**
     * 隱藏
     */
    hide() {

        let constTitle2 = this.consoleTitle + '[hide]';
        //console.log(constTitle2);

        if (this.progressBar) {
            this.progressBar.setCompleted();
            this.progressBar = null;
        }

    }

}


module.exports = {

    /**
     * 文字型進度條
     */
    TextBar: myProgressTextBar,

    /**
     * 數字型進度條
     */
    NumberBar: myProgressNumberBar

};

