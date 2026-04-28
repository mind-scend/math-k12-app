/**
 * 测试环境设置
 */
const mongoose = require('mongoose');

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_key';
process.env.DB_NAME = 'math_k12_test';

// Mock数据库连接
beforeAll(async () => {
  // 测试时使用内存数据库或mock
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/math_k12_test');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

// 清理每个测试用例后的数据
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
