import { EventEmitter } from 'events';
import * as lodash from 'lodash';
import * as mysql from 'mysql';
import { Pool } from 'mysql';
import { Utils } from './utils';

export interface ITsMysqlHelperConfig extends mysql.PoolConfig {
    name: string;
    logging: boolean;
    logger: any;
}

interface IQueryResult {
    results: any;
    fields: mysql.FieldInfo[];
}

interface IQueryOptions {
    sql: string;
    args: any;
    id?: string;
}

interface IInsertOptions {
    table: string;
    values: any;
    id?: string;
}

interface IBatchInsertOptions {
    table: string;
    fieldsArr: any[];
    valueArr: any[];
    id?: string;
}

interface IReplaceOptions {
    table: string;
    values: any;
    id?: string;
}

interface ISelectOptions {
    table: string;
    fields: any[];
    where?: TWhere;
    limit?: number;
    order?: any;
    id?: string;
}

interface ISelectOneOptions {
    table: string;
    fields: any[];
    where?: TWhere;
    order?: any;
    id?: string;
}

interface IUpdateOptions {
    table: string;
    values: any;
    where: TWhere;
    id?: string;
}

interface IDeleteOptions {
    table: string;
    where?: TWhere;
    limit?: number;
    id?: string;
}

interface IIncrementOptions {
    table: string;
    field: string;
    value: number;
    where: TWhere;
    id?: string;
}

export type TWhere = { [key: string]: string | number | boolean | { [key: string]: any } };

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

    private config: ITsMysqlHelperConfig | ITsMysqlHelperConfig[];
    private poolCluster: mysql.PoolCluster;
    private logging: boolean;
    private logger: any;

    private constructor(mysqlConfig?: ITsMysqlHelperConfig | ITsMysqlHelperConfig[]) {
        super();
        this.config = mysqlConfig;
        if (mysqlConfig instanceof Array) {
            this.config = mysqlConfig;
        } else {
            this.config = [mysqlConfig];
        }
        this.logging = this.config[0].logging;
        this.logger = this.config[0].logger;
        this.poolCluster = mysql.createPoolCluster();
        for (const cnf of this.config) {
            this.poolCluster.add(cnf.name, cnf);
        }
    };

    private _query(sql: string, args: any, id?: string): Promise<IQueryResult> {
        if (this.logging) {
            this.logger.log(sql, args);
        }
        return new Promise((resolve, reject) => {
            const callback = function (err: mysql.MysqlError, conn: mysql.PoolConnection) {
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
                        results,
                        fields
                    });
                });
            };
            if (id) {
                this.poolCluster.getConnection(id, callback);
            } else {
                this.poolCluster.getConnection(callback);
            }
        });
    };

    /**
     * 除非有目前未提供的功能，否则不要使用这个函数
     * @param sql 
     * @param args 
     */
    async query(sql: IQueryOptions): Promise<IQueryResult>;
    async query(sql: string, args: any, id?: string): Promise<IQueryResult>;
    async query(sql: string | IQueryOptions, args?: any, id?: string) {
        if (typeof sql == 'object') {
            return await this._query(sql.sql, sql.args, sql.id);
        } else {
            return await this._query(sql, args, id);
        }
    }

    /**
     * 插入
     * @param table 表名
     * @param values
     */
    async insertInto(table: IInsertOptions): Promise<number>;
    async insertInto(table: string, values: any, id?: string): Promise<number>;
    async insertInto(table: string | IInsertOptions, values?: any, id?: string) {
        if (typeof table == 'object') {
            const sql = Utils.sqlInsert(table.table);
            let { results } = await this._query(sql, table.values, table.id);
            return results.insertId;
        } else {
            const sql = Utils.sqlInsert(table);
            let { results } = await this._query(sql, values, id);
            return results.insertId;
        }
    };

    /**
     * 批量插入
     * @param table 
     * @param fieldsArr 
     * @param valueArr 
     */
    async batchInsertInto(table: IBatchInsertOptions): Promise<any>
    async batchInsertInto(table: string, fieldsArr: any[], valueArr: any[], id?: string): Promise<any>
    async batchInsertInto(table: string | IBatchInsertOptions, fieldsArr?: any[], valueArr?: any[], id?: string) {
        if (typeof table == 'object') {
            const sql = Utils.sqlBatchInsert(table.table, table.fieldsArr);
            const { results } = await this._query(sql, [table.valueArr], table.id);
            return results;
        } else {
            const sql = Utils.sqlBatchInsert(table, fieldsArr);
            const { results } = await this._query(sql, [valueArr], id);
            return results;
        }
    }

    /**
     * replace
     * @param table 表名
     * @param values
     */
    async replaceInto(table: IReplaceOptions): Promise<any>
    async replaceInto(table: string, values: any, id?: string): Promise<any>
    async replaceInto(table: string | IReplaceOptions, values?: any, id?: string) {
        if (typeof table == 'object') {
            const sql = Utils.sqlReplace(table.table);
            let { results } = await this._query(sql, table.values, table.id);
            return results.insertId;
        } else {
            const sql = Utils.sqlReplace(table);
            let { results } = await this._query(sql, values, id);
            return results.insertId;
        }
    }

    /**
     * mysql select function
     * @param table 表名
     * @param fields 字段名
     * @param where
     * @param limit 限制取几条
     */
    async select(table: ISelectOptions): Promise<any>
    async select(table: string, fields: any[], where?: any, limit?: number, order?: any, id?: string): Promise<any>
    async select(table: string | ISelectOptions, fields?: any[], where?: any, limit?: number, order?: any, id?: string) {
        if (typeof table == 'object') {
            const { sql, args } = Utils.sqlSelect(table.table, table.fields, table.where, table.limit, table.order);
            let { results } = await this._query(sql, args, table.id);
            return results;
        } else {
            const { sql, args } = Utils.sqlSelect(table, fields, where, limit, order);
            let { results } = await this._query(sql, args, id);
            return results;
        }
    };

    /**
     * mysql select function
     * @param table 表名
     * @param fields 字段名
     * @param where
     */
    async selectOne(table: ISelectOneOptions): Promise<any>
    async selectOne(table: string, fields: any[], where: any, order?: any, id?: string): Promise<any>
    async selectOne(table: string | ISelectOneOptions, fields?: any[], where?: any, order?: any, id?: string) {
        if (typeof table == 'object') {
            let res = await this.select(table.table, table.fields, table.where, 1, table.order, table.id);
            return res[0];
        } else {
            let res = await this.select(table, fields, where, 1, order, id);
            return res[0];
        }
    };

    /**
     * mysql update function
     * @param table
     * @param values
     * @param where
     */
    async update(table: IUpdateOptions): Promise<any>
    async update(table: string, values: any, where: any, id?: string): Promise<any>
    async update(table: string | IUpdateOptions, values?: any, where?: any, id?: string) {
        if (typeof table == 'object') {
            const { sql, args } = Utils.sqlUpdate(table.table, table.values, table.where);
            let { results } = await this._query(sql, args, table.id);
            return results;
        } else {
            const { sql, args } = Utils.sqlUpdate(table, values, where);
            let { results } = await this._query(sql, args, id);
            return results;
        }
    }

    /**
     * delete function
     * @param table
     * @param where
     * @param limit
     */
    async delete(table: IDeleteOptions): Promise<any>
    async delete(table: string, where?: any, limit?: number, id?: string): Promise<any>
    async delete(table: string | IDeleteOptions, where?: any, limit?: number, id?: string) {
        if (typeof table == 'object') {
            const { sql, args } = Utils.sqlDelete(table.table, table.where, table.limit);
            let { results } = await this._query(sql, args, table.id);
            return results.affectedRows;
        } else {
            const { sql, args } = Utils.sqlDelete(table, where, limit);
            let { results } = await this._query(sql, args, id);
            return results.affectedRows;
        }
    }

    /**
     * 让某字段自增
     * @param table 
     */
    async increment(table: IIncrementOptions): Promise<any>
    async increment(table: string, field: string, value: number, where: any, id?: string): Promise<any>
    async increment(table: string | IIncrementOptions, field?: string, value?: number, where?: any, id?: string) {
        if (typeof table == 'object') {
            const { sql, args } = Utils.sqlIncrement(table.table, table.field, table.value, table.where);
            const { results } = await this._query(sql, args, table.id);
            return results;
        } else {
            const { sql, args } = Utils.sqlIncrement(table, field, value, where);
            const { results } = await this._query(sql, args, id);
            return results;
        }
    }
}