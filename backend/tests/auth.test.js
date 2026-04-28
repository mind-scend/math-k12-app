/**
 * 后端认证模块测试
 */
const request = require('supertest');
const app = require('../src/server');
const User = require('../src/models/User');

describe('认证模块 API 测试', () => {
  beforeAll(async () => {
    // 测试前清理数据库
    await User.deleteMany({});
  });

  afterAll(async () => {
    // 关闭连接
    await mongoose.connection.close();
  });

  describe('POST /api/auth/register - 用户注册', () => {
    it('✓ 应该成功注册新用户', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
          grade: 'grade_9',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('username', 'testuser');
    });

    it('✗ 不应该注册重复邮箱的用户', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'anotheruser',
          email: 'test@example.com',
          password: 'Password123!',
          grade: 'grade_9',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('该邮箱已被注册');
    });

    it('✗ 不应该注册密码格式错误的用户', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: '123',
          grade: 'grade_9',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login - 用户登录', () => {
    beforeAll(async () => {
      // 创建测试用户
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'Password123!',
          grade: 'grade_9',
        });
    });

    it('✓ 应该成功登录', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data.user).toHaveProperty('email', 'login@example.com');
    });

    it('✗ 不应该使用错误密码登录', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('邮箱或密码错误');
    });

    it('✗ 不应该登录不存在的用户', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'Password123!',
        });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile - 获取用户信息', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'Password123!',
        });
      token = res.body.data.token;
    });

    it('✓ 已登录用户应该能获取自己的信息', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email', 'login@example.com');
    });

    it('✗ 未登录用户不应该获取信息', async () => {
      const res = await request(app).get('/api/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('✗ Token无效时不应该获取信息', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
