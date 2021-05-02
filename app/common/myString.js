/**
 * 字串函式
 */

/**
 * 字串開頭是否包含某字串
 *
 * @param prefix
 * @return {boolean}
 */
String.prototype.startsWith = function (prefix) {
    return this.slice(0, prefix.length) === prefix;
};

/**
 * 字串結尾是否包含某字串
 *
 * @param suffix
 * @return {boolean}
 */
String.prototype.endsWith = function (suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
