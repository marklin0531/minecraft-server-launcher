/**
 * 安全函式
 *
 * 2021-02-26 友
 */
class Security {


    //產生min到max之間的亂數
    static getRandom(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * 從字串左邊開始取N個字
     *
     * @param str
     * @param num
     * @return {string}
     */
    static left(str, num) {
        return str.substring(0, num)
    }


    /**
     * 從字串右邊開始取N個字
     *
     * @param str
     * @param num
     * @return {string}
     */
    static right(str, num) {
        return str.substring(str.length - num, str.length)
    }


    static isInt(value) {
        var x = parseFloat(value);
        return !isNaN(value) && (x | 0) === x;
    }


    /**
     * 是否為 空字串
     *
     * @param str
     * @return {boolean}
     */
    static isEmpty(str) {

        return (!str || 0 === str.length);

    }


    /**
     * 是否為 Array
     *
     * @param obj
     * @return {boolean}
     */
    static isArray(obj) {

        // if (obj.constructor.name === 'Array') {
        //     return true;
        // }

        return Array.isArray(obj);

    }


    /**
     * 是否為 undefined
     *
     * @param obj
     * @return {boolean}
     */
    static isUndefined(obj) {

        return obj === undefined;

    }


    /**
     * 是否為 Object
     *
     * @param obj
     * @return {boolean}
     */
    static isObject(obj) {
        return obj !== null && typeof obj === 'object';
    }


    /**
     * 字串長度過長(漢字=2字元,英數=1字元)
     *
     * @param string - 中英字串
     * @param int - 限制中文長度
     * @return {bool}
     */
    static isStringTooLong(str, len) {

        let _str = str.replace(/[^\x00-\xff]/g, "**");
        let _strlen = _str.length / 2;   //才是中文的長度
        //console.log('isStringTooLong:', _str, _strlen , len);

        return _strlen > len;

    }

}

module.exports = Security;
