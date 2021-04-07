/*
  Sqlite3 模組

  參考: http://tw.gitbook.net/sqlite/sqlite_create_table.html - 教學
       https://zhuanlan.zhihu.com/p/74342573
       https://github.com/Harlan-ZhangDongXing/sqlite

  安裝: npm install sqlite3 --runtime=electron --target=11.3.0 --dist-url=https://atom.io/download/electron

  Usage:
    const Sqlite = require('./modules/sqlite3');  //Sqlite3 DB模組

    async created () {
       const db = Sqlite.getInstance();
       await db.connect('./db/data.db');
       await db.run('CREATE TABLE IF NOT EXISTS test(a int, b char)');
       await db.run(`INSERT INTO test VALUES(10, 'abcd')`);
       const response = await db.all('SELECT * FROM test');
       db.close();
    }

  2021-02-23 友
*/
let consoleTitle = '[/app/common/mySqlite.js]';
let mySqlite = require('sqlite3');
const sqlite = mySqlite.verbose();
const isdebug = false;


class Sqlite {

    constructor() {
        this.instance
        this.db = null
    }

    /**
     * 資料庫連線
     *
     * @param path
     * @return {Promise<unknown>}
     */
    connect(path) {

        let consoleTitle2 = consoleTitle + '[connect]';
        if (isdebug) console.log(consoleTitle2, path);

        return new Promise((resolve, reject) => {
            this.db = new sqlite.Database(path, (err) => {
                if (err === null) {
                    resolve(err)
                } else {
                    reject(err)
                }
            })

        })
    }

    /**
     * 執行單條sql
     *
     * PS: sqlite 無返回結果
     *
     * @param sql
     * @param params
     * @return {Promise<unknown>}
     */
    run(sql, params) {

        let consoleTitle2 = consoleTitle + '[run]';
        if (isdebug) console.log(consoleTitle2, sql, params);

        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err === null) {
                    resolve(err)
                } else {
                    reject(err)
                }
            })
        })
    }

    /**
     * 執行多條sql
     *
     * PS: sqlite 無返回結果
     *
     * @param sql
     * @return {Promise<unknown>}
     */
    exec(sql) {

        let consoleTitle2 = consoleTitle + '[exec]';
        if (isdebug) console.log(consoleTitle2, sql);

        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err === null) {
                    resolve(err)
                } else {
                    reject(err)
                }
            })
        })
    }

    /**
     * 查詢返回單一結果
     *
     * @param sql
     * @param params
     * @return {Promise<unknown>}
     */
    get(sql, params) {

        let consoleTitle2 = consoleTitle + '[get]';
        if (isdebug) console.log(consoleTitle2, sql, params);

        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }

    /**
     * 查詢返回全部結果 - Array
     *
     * @param sql
     * @param params
     * @return {Promise<unknown>}
     */
    all(sql, params) {

        let consoleTitle2 = consoleTitle + '[all]';
        if (isdebug) console.log(consoleTitle2, sql, params);

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, data) => {
                if (err) {
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
    }

    /**
     * 關閉資料庫連線
     */
    close() {
        this.db.close()
        let consoleTitle2 = consoleTitle + '[close]';
        if (isdebug) console.log(consoleTitle2);
    }

    /**
     * 單一建構實例
     *
     * @return {Sqlite}
     */
    static getInstance() {
        this.instance = this.instance ? this.instance : new Sqlite()
        return this.instance
    }

}

module.exports = Sqlite;
