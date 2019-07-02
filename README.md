# ts-mysql-helper
mysql 帮助类，需要 Node.js 8.0 以上版本

## Usage
### 初始化
```typescript
import { MysqlHelper } from 'ts-mysql-helper'
const mysqlConfig = {
    host: 'localhost',
    port: 3306,
    database: 'test'
    user: 'root',
    password: 123456,
    charset: 'utf8mb4'
};
const helper = MysqlHelper.getInstance(mysqlConfig);
```
### 查询一条数据
```typescript
const tableName = 'my_table';
const fields = ['name', 'age'];
const where = { id: 1 };
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const values = await helper.selectOne(tableName, fields, where);
        console.log(`val = ${values}`);
    } catch (err) {
        console.log(err.stack);
    }
}
```
### 查询多条数据
```typescript
const tableName = 'my_table';
const fields = ['name', 'age'];
const where = { id: 1 };
const limit = 1;
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const values = await helper.select(tableName, fields, where, limit);
        console.log(`val = ${values}`);
    } catch (err) {
        console.log(err.stack);
    }
}
```
### 更复杂的查询
```typescript
const tableName = 'my_table';
const fields = ['name', 'age'];
// 范围查询
const where = {id: {
    '>=': 1,
    '<': 10
}};
const limit = 1;
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const values = await helper.select(tableName, fields, where, limit);
        console.log(`val = ${values}`);
    } catch (err) {
        console.log(err.stack);
    }
}
```
```typescript
const tableName = 'my_table';
const fields = ['name', 'age'];
// order by 语句
const where = { id:1 };
const limit = 1;
const order = { id: 'desc' };
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const values = await helper.select(tableName, fields, where, limit, order);
        console.log(`val = ${values}`);
    } catch (err) {
        console.log(err.stack);
    }
}
```

### 插入数据
```typescript
const tableName = 'my_table';
const values = { name: 'bruce', age: 28 };
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const insertId = await helper.insertInto(tableName, values);
    } catch (err) {
        console.log(err.stack);
    }
}
```
### 批量插入数据
```typescript
const tableName = 'my_table';
const fieldsArr = ['name', 'age'];
const valueArr = [
    ['bruce', 28],
    ['chris', 29],
    ['doris', 30]
];
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const results = await helper.batchInsertInto(tableName, fieldsArr, valueArr);
        for (let r of results) {
            console.log('inserted id =', r.insertId);
        }
    } catch (err) {
        console.log(err.stack);
    }
}
```
### 插入或更新数据
```typescript
const tableName = 'my_table';
const values = { name: 'bruce', age: 28 };
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const insertId = await helper.replaceInto(tableName, values);
    } catch (err) {
        console.log(err.stack);
    }
}
```

### 更新数据 #1
```typescript
const tableName = 'my_table';
const values = { name: 'bruce' };
const where = { id: 1 };
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const results = await helper.update(tableName, values, where);
        console.log(`res = ${results}`);
    } catch (err) {
        console.log(err.stack);
    }
}
```

### 更新数据 #2
```typescript
const tableName = 'my_table';
// 设定自增
const values = { tagline: 'stay foolish', age: { increment: 1 } };
const where = { id: 1 };
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const results = await helper.update(tableName, values, where);
        console.log(`res = ${results}`);
    } catch (err) {
        console.log(err.stack);
    }
}
```

### 删除数据
```typescript
const tableName = 'my_table';
const where = { id: 1 };
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const affectedRows = await helper.delete(tableName, where);
        console.log(`res = ${affectedRows}`);
    } catch (err) {
        console.log(err.stack);
    }
}
```

### 自增
```typescript
const tableName = 'my_table';
const field = 'field1';
const value = 10;
const where = { id: 1 };
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const result = await helper.increment(tableName, field, value, where);
        console.log(`res = ${result}`);
    } catch (err) {
        console.log(err.stack);
    }
}
```

### 如果现有功能还无法满足需求，可以使用 query()
```typescript
const helper = MysqlHelper.getInstance();
async function main() {
    try {
        const rows = await helper.query('select * from my_table', {id: 1});
    } catch (err) {
        console.log(err.stack);
    }
}
```