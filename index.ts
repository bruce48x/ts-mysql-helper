import { EventEmitter } from 'events';
import * as lodash from 'lodash';
import * as mysql from 'mysql';
import { Pool } from 'mysql';
import { Utils } from './utils';

export interface TsMysqlHelperConfig extends mysql.PoolConfig {
    logging: boolean;
    logger: any;
}

export class MysqlHelper extends EventEmitter {
    private static instance: MysqlHelper;

    static getInstance(mysqlConfig?: any) {
        if (!this.instance) {
            if (!mysqlConfig) {
                return;
            }
            this.instance = new MysqlHelper(mysqlConfig);
        }
        return this.instance;
    };

    private config: TsMysqlHelperConfig;
    private pool: Pool;

    private constructor(mysqlConfig?: any) {
        super();
        this.config = mysqlConfig;
        this.config.logging = !!this.config.logging;
        this.config.logger = this.config.logger || console;
        this.pool = mysql.createPool(mysqlConfig);
        this.pool.on('acquire', (conn) => {
            this.emit('acquire', conn);
        });
        this.pool.on('connection', (conn) => {
            this.emit('connection', conn);
        });
        this.pool.on('enqueue', () => {
            this.emit('enqueue');
        });
        this.pool.on('release', (conn) => {
            this.emit('release', conn);
        });
    };

    private _query(sql: string, args: any): Promise<{ results: any, fields: any }> {
        if (this.config.logging) {
            this.config.logger.log(sql, args);
        }
        return new Promise((resolve, reject) => {
            this.pool.getConnection(function (err, conn) {
                if (err) {
                    reject(err);
                    return;
                }
                conn.query(sql, args, function (err, results, fields) {
                    //释放连接
                    conn.release();
                    if (err) {
                        reject(err);
                        return;
                    }
                    //事件驱动回调
                    resolve({
                        results: results,
                        fields: fields
                    });
                });
            });
        });
    };

    /**
     * 除非有目前未提供的功能，否则不要使用这个函数
     * @param sql 
     * @param args 
     */
    async query(sql: string, args: any) {
        return await this._query(sql, args);
    }

    /**
     * 插入
     * @param table 表名
     * @param values
     */
    async insertInto(table: string, values: any): Promise<number> {
        const sql = Utils.sqlInsert(table);
        let { results } = await this._query(sql, values);
        return results.insertId;
    };

    /**
     * 批量插入
     * @param table 
     * @param fieldsArr 
     * @param valueArr 
     */
    async batchInsertInto(table: string, fieldsArr: Array<any>, valueArr: Array<any>) {
        const sql = Utils.sqlBatchInsert(table, fieldsArr);
        const { results } = await this._query(sql, [valueArr]);
        return results;
    }

    /**
     * replace
     * @param table 表名
     * @param values
     */
    async replaceInto(table: string, values: any) {
        const sql = Utils.sqlReplace(table);
        let { results } = await this._query(sql, values);
        return results.insertId;
    }

    /**
     * mysql select function
     * @param table 表名
     * @param fields 字段名
     * @param where
     * @param limit 限制取几条
     */
    async select(table: string, fields: Array<any>, where?: any, limit?: number, order?: any) {
        const { sql, args } = Utils.sqlSelect(table, fields, where, limit, order);
        let { results } = await this._query(sql, args);
        return results;
    };

    /**
     * mysql select function
     * @param table 表名
     * @param fields 字段名
     * @param where
     */
    async selectOne(table: string, fields: any[], where: any, order?: any) {
        let res = await this.select(table, fields, where, 1, order);
        return res[0];
    };

    /**
     * mysql update function
     * @param table
     * @param values
     * @param where
     */
    async update(table: string, values: any, where: any) {
        const { sql, args } = Utils.sqlUpdate(table, values, where);
        let { results } = await this._query(sql, args);
        return results;
    }

    /**
     * delete function
     * @param table
     * @param where
     * @param limit
     */
    async delete(table: string, where?: any, limit?: number) {
        const { sql, args } = Utils.sqlDelete(table, where, limit);
        let { results } = await this._query(sql, args);
        return results.affectedRows;
    }
}