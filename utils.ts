import * as lodash from 'lodash';

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
        let keys, vals, args: Array<any> = [];
        keys = Object.keys(values);
        vals = Object.values(values);
        if (keys && keys.length > 0 && vals && vals.length > 0) {
            sql += ' ' + keys.join(' = ?, ') + ' = ?';
            args = [...vals];
        }
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

    static processWhere(where: any): IWhereResult {
        if (lodash.isEmpty(where)) {
            return {};
        }
        let condArgs: any[] = [];
        let condition: string[] = [];
        for (let cond in where) {
            if (!where.hasOwnProperty(cond)) {
                continue;
            }
            if (typeof where[cond] === 'object') {
                this.whereObject(cond, where[cond], condition, condArgs);
            } else {
                this.whereString(cond, where[cond], condition, condArgs);
            }
        }
        const sql = 'where ' + condition.join(' and ');
        return { sql, args: condArgs };
    }

    private static whereString(k: string | number, v: string | number, cond: any[], args: any[]) {
        cond.push(`${k} = ?`);
        args.push(v);
    }

    private static whereObject(k: string | number, v: any, cond: any[], args: any[]) {
        for (let i in v) {
            if (i === 'in') {
                const res = this.inStatement(v[i]);
                cond.push(`${k} ${res.sql}`);
                for (let o of res.args) {
                    args.push(o);
                }
                break;
            } else {
                args.push(v[i]);
                cond.push(`${k} ${i} ?`);
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