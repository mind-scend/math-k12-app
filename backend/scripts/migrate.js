/**
 * 数据库迁移脚本
 * 运行: node scripts/migrate.js
 */

const mysql = require('mysql2/promise');
const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT) || 3306,
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'math_k12',
  multipleStatements: true,
};

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/math_k12';

async function migrate() {
  console.log('🚀 开始数据库迁移...\n');

  let mysqlConnection;
  let mongoConnection;

  try {
    // 1. MySQL迁移
    console.log('📦 迁移MySQL数据库...');
    mysqlConnection = await mysql.createConnection(MYSQL_CONFIG);

    // 读取并执行SQL文件
    const fs = require('fs');
    const path = require('path');
    const sqlFile = path.join(__dirname, '../migrations/001_init.sql');

    if (fs.existsSync(sqlFile)) {
      const sql = fs.readFileSync(sqlFile, 'utf8');
      await mysqlConnection.query(sql);
      console.log('✅ MySQL迁移完成\n');
    } else {
      console.log('⚠️ 未找到SQL迁移文件\n');
    }

    // 2. MongoDB迁移
    console.log('📦 迁移MongoDB数据库...');
    mongoConnection = await mongoose.connect(MONGO_URI);

    // 创建MongoDB索引
    const collections = ['users', 'questions', 'wrongquestions', 'generatedpapers'];

    for (const collName of collections) {
      try {
        const collection = mongoose.connection.collection(collName);
        // 创建基本索引
        if (collName === 'users') {
          await collection.createIndex({ phone: 1 }, { unique: true });
          await collection.createIndex({ createdAt: -1 });
        }
        if (collName === 'questions') {
          await collection.createIndex({ userId: 1, createdAt: -1 });
          await collection.createIndex({ knowledgePoints: 1 });
        }
        if (collName === 'wrongquestions') {
          await collection.createIndex({ userId: 1, mastered: 1 });
          await collection.createIndex({ userId: 1, lastWrongTime: -1 });
        }
        if (collName === 'generatedpapers') {
          await collection.createIndex({ userId: 1, createdAt: -1 });
        }
        console.log(`  ✅ ${collName} 索引创建完成`);
      } catch (err) {
        if (err.code !== 85) { // Index already exists
          console.log(`  ⚠️ ${collName} 索引创建失败:`, err.message);
        }
      }
    }

    console.log('\n✅ MongoDB迁移完成\n');

    console.log('═══════════════════════════════════════');
    console.log('       🎉 数据库迁移全部完成！');
    console.log('═══════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
    if (mongoConnection) {
      await mongoose.disconnect();
    }
  }
}

migrate();
