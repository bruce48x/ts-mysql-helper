import { expect } from 'chai';
import 'mocha';
import { Utils, IWhereResult } from '../utils';

describe('测试 Utils，将各种参数转成 sql 语句', () => {
    describe('内部函数的测试', () => {
        it('单个简单条件', (done: Function) => {
            const where = { id: 1 };
            const { sql, args } = Utils.processWhere(where);
            expect(sql).to.equal('where id = ?');
            expect(args).to.eql([1]);
            done();
        });

        it('多个简单条件', (done: Function) => {
            const where = { id: 1, name: 'b' };
            const { sql, args } = Utils.processWhere(where);
            expect(sql).to.equal('where id = ? and name = ?');
            expect(args).to.eql([1, 'b']);
            done();
        });

        it('范围', (done: Function) => {
            const where = {
                id: {
                    '>=': 1,
                    '<=': 10
                }
            };
            const { sql } = Utils.processWhere(where);
            expect(sql).to.equal('where id >= ? and id <= ?');
            done();
        });

        it('in 语句', (done: Function) => {
            const where = {
                id: {
                    'in': [1, 3, 5]
                }
            };
            const { sql, args } = Utils.processWhere(where);
            expect(sql).to.equal('where id in (?,?,?)');
            expect(args).to.eql([1, 3, 5]);
            done();
        });

        it('inStatement()', (done: Function) => {
            const { sql, args } = Utils.inStatement([1, 3]);
            expect(sql).to.equal('in (?,?)');
            expect(args).to.eql([1, 3]);
            done();
        });
    });

    describe('sqlInsert() 方法', () => {
        it('sqlInsert()', (done: Function) => {
            const sql = Utils.sqlInsert('myTable');
            expect(sql).to.equal('insert into myTable set ?');
            done();
        });
    });

    describe('sqlBatchInsert() 方法', () => {
        it('sqlBatchInsert()', (done: Function) => {
            const sql = Utils.sqlBatchInsert('myTable', ['id', 'name', 'age']);
            expect(sql).to.equal('insert into myTable (id,name,age) values ?');
            done();
        });
    });

    describe('sqlReplace() 方法', () => {
        it('sqlReplace()', (done: Function) => {
            const sql = Utils.sqlReplace('myTable');
            expect(sql).to.equal('replace into myTable set ?');
            done();
        });
    });

    describe('sqlSelect() 方法', () => {
        it('sqlSelect() 1', (done: Function) => {
            const { sql, args } = Utils.sqlSelect('myTable', ['name', 'age', 'addr'], { id: 1 }, 1);
            expect(sql).to.equal('select name, age, addr from myTable where id = ? limit 1');
            expect(args).to.eql([1]);
            done();
        });

        it('sqlSelect() 2', (done: Function) => {
            const { sql, args } = Utils.sqlSelect('myTable', ['name', 'age', 'addr'], { id: { 'in': [1, 3, 5] } });
            expect(sql).to.equal('select name, age, addr from myTable where id in (?,?,?)');
            expect(args).to.eql([1, 3, 5]);
            done();
        });
    });

    describe('sqlUpdate() 方法', () => {
        it('sqlUpdate()', (done: Function) => {
            const { sql, args } = Utils.sqlUpdate('myTable', { age: 28, addr: 'xiamen' }, { id: 1 });
            expect(sql).to.equal('update myTable set age = ?, addr = ? where id = ?');
            expect(args).to.eql([28, 'xiamen', 1]);
            done();
        });
    });

    describe('sqlDelete() 方法', () => {
        it('sqlDelete() 1', (done: Function) => {
            const { sql, args } = Utils.sqlDelete('myTable');
            expect(sql).to.equal('delete from myTable');
            done();
        });

        it('sqlDelete() 2', (done: Function) => {
            const { sql, args } = Utils.sqlDelete('myTable', { id: 1 });
            expect(sql).to.equal('delete from myTable where id = ?');
            expect(args).to.eql([1]);
            done();
        });

        it('sqlDelete() 3', (done: Function) => {
            const { sql, args } = Utils.sqlDelete('myTable', {
                id: {
                    'in': [1, 3]
                }
            });
            expect(sql).to.equal('delete from myTable where id in (?,?)');
            expect(args).to.eql([1, 3]);
            done();
        });

        it('sqlDelete() 4', (done: Function) => {
            const { sql, args } = Utils.sqlDelete('myTable', { name: 'bruce' }, 5);
            expect(sql).to.equal('delete from myTable where name = ? limit 5');
            expect(args).to.eql(['bruce']);
            done();
        });
    });
});