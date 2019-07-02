import 'mocha';
const assert = require('assert');
import { Utils, IWhereResult } from '../utils';

describe('测试 Utils，将各种参数转成 sql 语句', () => {
    describe('内部函数的测试', async () => {
        it('单个简单条件', async () => {
            const where = { id: 1 };
            const { sql, args } = Utils.processWhere(where);
            assert(sql == 'where id = ?');
            assert.deepEqual(args, [1]);
        });

        it('多个简单条件', async () => {
            const where = { id: 1, name: 'b' };
            const { sql, args } = Utils.processWhere(where);
            assert(sql == 'where id = ? and name = ?');
            assert.deepEqual(args, [1, 'b']);
        });

        it('范围', async () => {
            const where = {
                id: {
                    '>=': 1,
                    '<=': 10
                }
            };
            const { sql } = Utils.processWhere(where);
            assert(sql == 'where id >= ? and id <= ?');
        });

        it('in 语句', async () => {
            const where = {
                id: {
                    'in': [1, 3, 5]
                }
            };
            const { sql, args } = Utils.processWhere(where);
            assert(sql == 'where id in (?,?,?)');
            assert.deepEqual(args, [1, 3, 5]);
        });

        it('inStatement()', async () => {
            const { sql, args } = Utils.inStatement([1, 3]);
            assert(sql == 'in (?,?)');
            assert.deepEqual(args, [1, 3]);
        });

        it('order 语句 #1', async () => {
            const sql = Utils.processOrder({ username: 'desc' });
            assert(sql == 'order by username desc');
        });

        it('order 语句 #2', async () => {
            const sql = Utils.processOrder({ username: 'dlislij##' });
            assert(sql == 'order by username asc');
        });

        it('order 语句 #3', async () => {
            const userId = 1;
            const username = 'ha';
            const sql = Utils.processOrder({ username, userId });
            assert(sql == 'order by username asc,userId asc');
        });
    });

    describe('sqlInsert() 方法', async () => {
        it('sqlInsert()', async () => {
            const sql = Utils.sqlInsert('myTable');
            assert(sql == 'insert into myTable set ?');
        });
    });

    describe('sqlBatchInsert() 方法', async () => {
        it('sqlBatchInsert()', async () => {
            const sql = Utils.sqlBatchInsert('myTable', ['id', 'name', 'age']);
            assert(sql == 'insert into myTable (id,name,age) values ?');
        });
    });

    describe('sqlReplace() 方法', async () => {
        it('sqlReplace()', async () => {
            const sql = Utils.sqlReplace('myTable');
            assert(sql == 'replace into myTable set ?');
        });
    });

    describe('sqlSelect() 方法', async () => {
        it('sqlSelect() #1', async () => {
            const { sql, args } = Utils.sqlSelect('myTable', ['name', 'age', 'addr'], { id: 1 }, 1);
            assert(sql == 'select name, age, addr from myTable where id = ? limit 1');
            assert.deepEqual(args, [1]);
        });

        it('sqlSelect() #2', async () => {
            const { sql, args } = Utils.sqlSelect('myTable', ['name', 'age', 'addr'], { id: { 'in': [1, 3, 5] } });
            assert(sql == 'select name, age, addr from myTable where id in (?,?,?)');
            assert.deepEqual(args, [1, 3, 5]);
        });

        it('sqlSelect() #3', async () => {
            const { sql, args } = Utils.sqlSelect('myTable', ['name', 'age', 'addr'], { id: { 'in': [1, 3, 5] } }, null, { age: 'desc' });
            assert(sql == 'select name, age, addr from myTable where id in (?,?,?) order by age desc');
            assert.deepEqual(args, [1, 3, 5]);
        });

        it('sqlSelect() #4', async () => {
            const { sql, args } = Utils.sqlSelect('myTable', ['name', 'age', 'addr'], {}, null, { age: 'desc' });
            assert(sql == 'select name, age, addr from myTable order by age desc');
        });
    });

    describe('sqlUpdate() 方法', async () => {
        it('sqlUpdate() #1', async () => {
            const { sql, args } = Utils.sqlUpdate('myTable', { age: 28, addr: 'xiamen' }, { id: 1 });
            assert(sql == 'update myTable set age = ?, addr = ? where id = ?');
            assert.deepEqual(args, [28, 'xiamen', 1]);
        });

        it('sqlUpdate() #2', async () => {
            const { sql, args } = Utils.sqlUpdate('myTable', { age: { increment: 1 }, addr: 'xiamen' }, { id: 1 });
            assert(sql == 'update myTable set age = age + ?, addr = ? where id = ?');
            assert.deepEqual(args, [1, 'xiamen', 1]);
        });
    });

    describe('sqlDelete() 方法', async () => {
        it('sqlDelete() #1', async () => {
            const { sql, args } = Utils.sqlDelete('myTable');
            assert(sql == 'delete from myTable');
        });

        it('sqlDelete() #2', async () => {
            const { sql, args } = Utils.sqlDelete('myTable', { id: 1 });
            assert(sql == 'delete from myTable where id = ?');
            assert.deepEqual(args, [1]);
        });

        it('sqlDelete() #3', async () => {
            const { sql, args } = Utils.sqlDelete('myTable', {
                id: {
                    'in': [1, 3]
                }
            });
            assert(sql == 'delete from myTable where id in (?,?)');
            assert.deepEqual(args, [1, 3]);
        });

        it('sqlDelete() #4', async () => {
            const { sql, args } = Utils.sqlDelete('myTable', { name: 'bruce' }, 5);
            assert(sql == 'delete from myTable where name = ? limit 5');
            assert.deepEqual(args, ['bruce']);
        });
    });

    describe('sqlIncrement() 方法', async () => {
        it('sqlIncrement() #1', async () => {
            const { sql, args } = Utils.sqlIncrement('myTable', 'field1', 10, { id: 1 });
            assert(sql == 'update myTable set field1 = field1 + ? where id = ?');
            assert.deepEqual(args, [10, 1]);
        });
    });
});