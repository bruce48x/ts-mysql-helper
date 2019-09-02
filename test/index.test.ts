import { Utils, IWhereResult } from '../utils';
import * as request from 'supertest';
import { MysqlHelper } from '../index';

describe('测试 Utils，将各种参数转成 sql 语句', () => {
    describe('内部函数的测试', () => {
        it('单个简单条件', async () => {
            const where = { id: 1 };
            const { sql, args } = Utils.processWhere(where);
            expect(sql).toBe('where id = ?');
            expect(args).toStrictEqual([1]);
        });

        it('多个简单条件', async () => {
            const where = { id: 1, name: 'b' };
            const { sql, args } = Utils.processWhere(where);
            expect(sql).toBe('where id = ? and name = ?');
            expect(args).toStrictEqual([1, 'b']);
        });

        it('范围', async () => {
            const where = {
                id: {
                    '>=': 1,
                    '<=': 10
                }
            };
            const { sql } = Utils.processWhere(where);
            expect(sql).toBe('where id >= ? and id <= ?');
        });

        it('in 语句', async () => {
            const where = {
                id: {
                    'in': [1, 3, 5]
                }
            };
            const { sql, args } = Utils.processWhere(where);
            expect(sql).toBe('where id in (?,?,?)');
            expect(args).toStrictEqual([1, 3, 5]);
        });

        it('inStatement()', async () => {
            const { sql, args } = Utils.inStatement([1, 3]);
            expect(sql).toBe('in (?,?)');
            expect(args).toStrictEqual([1, 3]);
        });

        it('order 语句 #1', async () => {
            const sql = Utils.processOrder({ username: 'desc' });
            expect(sql).toBe('order by username desc');
        });

        it('order 语句 #2', async () => {
            const sql = Utils.processOrder({ username: 'dlislij##' });
            expect(sql).toBe('order by username asc');
        });

        it('order 语句 #3', async () => {
            const userId = 1;
            const username = 'ha';
            const sql = Utils.processOrder({ username, userId });
            expect(sql).toBe('order by username asc,userId asc');
        });
    });

    describe('sqlInsert() 方法', () => {
        it('sqlInsert() #1', async () => {
            const { sql } = Utils.sqlInsert('myTable');
            expect(sql).toBe('insert into myTable set ?');
        });

        it('sqlInsert() #2 onDuplicate', () => {
            const { sql, args } = Utils.sqlInsert('myTable', true, { b: 2 });
            expect(sql).toBe('insert into myTable set ? on duplicate key update b = ?');
        });
    });

    describe('sqlBatchInsert() 方法', () => {
        it('sqlBatchInsert()', async () => {
            const sql = Utils.sqlBatchInsert('myTable', ['id', 'name', 'age']);
            expect(sql).toBe('insert into myTable (id,name,age) values ?');
        });
    });

    describe('sqlReplace() 方法', () => {
        it('sqlReplace()', async () => {
            const sql = Utils.sqlReplace('myTable');
            expect(sql).toBe('replace into myTable set ?');
        });
    });

    describe('sqlSelect() 方法', () => {
        it('sqlSelect() #1', async () => {
            const { sql, args } = Utils.sqlSelect('myTable', ['name', 'age', 'addr'], { id: 1 }, 1);
            expect(sql).toBe('select name, age, addr from myTable where id = ? limit 1');
            expect(args).toStrictEqual([1]);
        });

        it('sqlSelect() #2', async () => {
            const { sql, args } = Utils.sqlSelect('myTable', ['name', 'age', 'addr'], { id: { 'in': [1, 3, 5] } });
            expect(sql).toBe('select name, age, addr from myTable where id in (?,?,?)');
            expect(args).toStrictEqual([1, 3, 5]);
        });

        it('sqlSelect() #3', async () => {
            const { sql, args } = Utils.sqlSelect('myTable', ['name', 'age', 'addr'], { id: { 'in': [1, 3, 5] } }, null, { age: 'desc' });
            expect(sql).toBe('select name, age, addr from myTable where id in (?,?,?) order by age desc');
            expect(args).toStrictEqual([1, 3, 5]);
        });

        it('sqlSelect() #4', async () => {
            const { sql, args } = Utils.sqlSelect('myTable', ['name', 'age', 'addr'], {}, null, { age: 'desc' });
            expect(sql).toBe('select name, age, addr from myTable order by age desc');
        });
    });

    describe('sqlUpdate() 方法', () => {
        it('sqlUpdate() #1', async () => {
            const { sql, args } = Utils.sqlUpdate('myTable', { age: 28, addr: 'xiamen' }, { id: 1 });
            expect(sql).toBe('update myTable set age = ?, addr = ? where id = ?');
            expect(args).toStrictEqual([28, 'xiamen', 1]);
        });

        it('sqlUpdate() #2', async () => {
            const { sql, args } = Utils.sqlUpdate('myTable', { age: { increment: 1 }, addr: 'xiamen' }, { id: 1 });
            expect(sql).toBe('update myTable set age = age + ?, addr = ? where id = ?');
            expect(args).toStrictEqual([1, 'xiamen', 1]);
        });
    });

    describe('sqlDelete() 方法', () => {
        it('sqlDelete() #1', async () => {
            const { sql, args } = Utils.sqlDelete('myTable');
            expect(sql).toBe('delete from myTable');
        });

        it('sqlDelete() #2', async () => {
            const { sql, args } = Utils.sqlDelete('myTable', { id: 1 });
            expect(sql).toBe('delete from myTable where id = ?');
            expect(args).toStrictEqual([1]);
        });

        it('sqlDelete() #3', async () => {
            const { sql, args } = Utils.sqlDelete('myTable', {
                id: {
                    'in': [1, 3]
                }
            });
            expect(sql).toBe('delete from myTable where id in (?,?)');
            expect(args).toStrictEqual([1, 3]);
        });

        it('sqlDelete() #4', async () => {
            const { sql, args } = Utils.sqlDelete('myTable', { name: 'bruce' }, 5);
            expect(sql).toBe('delete from myTable where name = ? limit 5');
            expect(args).toStrictEqual(['bruce']);
        });
    });

    describe('sqlIncrement() 方法', () => {
        it('sqlIncrement() #1', async () => {
            const { sql, args } = Utils.sqlIncrement('myTable', 'field1', 10, { id: 1 });
            expect(sql).toBe('update myTable set field1 = field1 + ? where id = ?');
            expect(args).toStrictEqual([10, 1]);
        });
    });

    describe('真实测试', () => {
        it('test #1', async () => {
            // const helper = MysqlHelper.getInstance({
            //     name: 'default',
            //     host: '',
            //     port: 3306,
            //     user: '',
            //     password: '',
            //     charset: 'utf8mb4',
            //     database: '',
            // });
            // const res = await helper.selectOne({ table: 'account_table', fields: ['userId', 'createAt'], where: { userId: 10000 } });
            // expect(res).toBeDefined();
        });

        it('test #2', async () => {
            // const helper = MysqlHelper.getInstance();
            // helper.addPool({
            //     name: 'default2',
            //     host: '',
            //     port: 3306,
            //     user: '',
            //     password: '',
            //     charset: 'utf8mb4',
            //     database: '',
            // });
            // const res = await helper.insertInto({ table: 'user_name_table', values: { userId: 10000, userName: 'fromUnitTest' }, onDuplicate: true, id: 'default2' });
            // expect(res).toBeDefined();
        })
    });
});