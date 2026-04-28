/**
 * 数据库配置
 */

const mysql = require('mysql2/promise');
const mongoose = require('mongoose');

let mysqlPool = null;
let mongoConnection = null;

/**
 * 连接MySQL
 */
async function connectMySQL() {
  if (mysqlPool) return mysqlPool;

  mysqlPool = mysql.createPool({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT) || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'math_k12',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });

  // 测试连接
  const connection = await mysqlPool.getConnection();
  connection.release();

  return mysqlPool;
}

/**
 * 连接MongoDB
 */
async function connectMongoDB() {
  if (mongoConnection) return mongoConnection;

  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/math_k12';

  mongoose.set('strictQuery', false);

  mongoConnection = await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB连接错误:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB连接断开，正在重连...');
  });

  return mongoConnection;
}

/**
 * 统一数据库连接
 */
async function connectDB() {
  await connectMySQL();
  await connectMongoDB();
}

/**
 * 获取MySQL连接池
 */
function getMySQLPool() {
  if (!mysqlPool) {
    throw new Error('MySQL未连接');
  }
  return mysqlPool;
}

/**
 * 获取MySQL连接
 */
async function getMySQLConnection() {
  const pool = getMySQLPool();
  return pool.getConnection();
}

/**
 * 关闭数据库连接
 */
async function closeDB() {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
  if (mongoConnection) {
    await mongoose.disconnect();
    mongoConnection = null;
  }
}

module.exports = {
  connectDB,
  connectMySQL,
  connectMongoDB,
  getMySQLPool,
  getMySQLConnection,
  closeDB,
};
