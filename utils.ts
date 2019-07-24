import * as lodash from 'lodash';
import { TWhere } from './index';

export interface IWhereResult {
    sql?: string;
    args?: any[];
}

export class Utils {
    static sqlInsert(table: string) {
        return `insert into ${table} set ?`;
    }

    static sqlBatchInsert(table: string, fieldsArr: any[]) {
        const fieldStr = fieldsArr.join(',');
        return `insert into ${table} (${fieldStr}) values ?`;
    }

    static sqlReplace(table: string) {
        return `replace into ${table} set ?`;
    }

    static sqlSelect(table: string, fields: any[], where?: any, limit?: number, order?: any) {
        let fieldsStr = fields.join(', ');
        let sql = `select ${fieldsStr} from ${table}`;
        let args: any[] = [];
        const res = Utils.processWhere(where);
        if (res.sql && res.args) {
            sql += ` ${res.sql}`;
            args = [...args, ...res.args];
        }
        if (order) {
            sql += ' ' + Utils.processOrder(order);
        }
        if (limit) {
            sql += ` limit ${limit}`;
        }
        return { sql, args };
    }

    static sqlUpdate(table: string, values: any, where: any) {
        let sql = `update ${table} set`;
        // 转 values 为 sql
        let args: Array<any> = [];
        let valStr = '';
        for (const field in values) {
            if (typeof values[field] == 'object') {
                // increment
                if (values[field].increment) {
                    valStr += ` ${field} = ${field} + ?,`;
                    args.push(values[field].increment);
                }
            } else {
                // 普通赋值
                valStr += ` ${field} = ?,`;
                args.push(values[field]);
            }
        }
        sql += valStr.slice(0, -1);
        // 转 where 为 sql
        const res = Utils.processWhere(where);
        if (res.sql && res.args) {
            sql += ` ${res.sql}`;
            args = [...args, ...res.args];
        }
        return { sql, args };
    }

    static sqlDelete(table: string, where?: any, limit?: number) {
        let sql = `delete from ${table}`;
        let args: Array<any> = [];
        if (where) {
            const res = this.processWhere(where);
            if (res.sql && res.args) {
                sql += ` ${res.sql}`;
                args = [...args, ...res.args];
            }
        }
        if (limit) {
            sql += ` limit ${limit}`;
        }
        return { sql, args };
    }

    static sqlIncrement(table: string, field: string, value: any, where: any) {
        let sql = `update ${table} set ${field} = ${field} + ?`;
        let args: Array<any> = [value];
        // 转 where 为 sql
        const res = Utils.processWhere(where);
        if (res.sql && res.args) {
            sql += ` ${res.sql}`;
            args = [...args, ...res.args];
        }
        return { sql, args };
    }

    static processWhere(where: TWhere): IWhereResult {
        if (lodash.isEmpty(where)) {
            return {};
        }
        let condArgs: any[] = [];
        let condition: string[] = [];
        for (let cond in where) {
            if (!where.hasOwnProperty(cond)) {
                continue;
            }
            const val = where[cond];
            if (typeof val == 'object') {
                this.whereObject(cond, val, condition, condArgs);
            } else {
                this.whereString(cond, val, condition, condArgs);
            }
        }
        const sql = 'where ' + condition.join(' and ');
        return { sql, args: condArgs };
    }

    private static whereString(key: string, val: string | number, cond: any[], args: any[]) {
        cond.push(`${key} = ?`);
        args.push(val);
    }

    private static whereObject(key: string, val: { [key: string]: any }, cond: any[], args: any[]) {
        for (let i in val) {
            if (i === 'in') {
                const res = this.inStatement(val[i]);
                cond.push(`${key} ${res.sql}`);
                for (let o of res.args) {
                    args.push(o);
                }
                break;
            } else {
                cond.push(`${key} ${i} ?`);
                args.push(val[i]);
            }
        }
    }

    static inStatement(conds: any[]): IWhereResult {
        if (!conds || conds.length < 1) {
            return {};
        }
        const cond = [];
        const args = [];
        for (let i of conds) {
            cond.push('?');
            args.push(i);
        }
        const sql = 'in (' + cond.join(',') + ')';
        return { sql, args };
    }

    static processOrder(order: any): string {
        if (!order || Object.keys(order).length < 1) {
            return '';
        }
        let sql = 'order by ';
        let keyArr = [];
        for (let i in order) {
            if (order[i] == 'desc') {
                keyArr.push(`${i} desc`);
            } else {
                keyArr.push(`${i} asc`);
            }
        }
        sql += keyArr.join(',');
        return sql;
    }
}