/**
 * 后端题目模块测试
 */
const request = require('supertest');
const app = require('../src/server');

describe('题目模块 API 测试', () => {
  let authToken;

  beforeAll(async () => {
    // 登录获取token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });
    authToken = loginRes.body.data.token;
  });

  describe('POST /api/questions/solve - 智能解题', () => {
    it('✓ 应该能成功提交解题请求', async () => {
      const res = await request(app)
        .post('/api/questions/solve')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          imageUrl: 'https://example.com/question.jpg',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('solution');
      expect(res.body.data).toHaveProperty('steps');
    });

    it('✗ 未登录用户不应该提交解题请求', async () => {
      const res = await request(app)
        .post('/api/questions/solve')
        .send({
          imageUrl: 'https://example.com/question.jpg',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/questions/history - 获取解题历史', () => {
    it('✓ 应该能获取解题历史列表', async () => {
      const res = await request(app)
        .get('/api/questions/history')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('records');
      expect(Array.isArray(res.body.data.records)).toBe(true);
    });
  });

  describe('POST /api/questions/wrong - 添加错题', () => {
    it('✓ 应该能成功添加错题', async () => {
      const res = await request(app)
        .post('/api/questions/wrong')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          questionId: 'question_001',
          wrongAnswer: 'B',
          correctAnswer: 'A',
          knowledgePoints: ['二次函数'],
          reason: '对顶点坐标理解有误',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('questionId', 'question_001');
    });
  });

  describe('GET /api/questions/wrong-book - 错题本', () => {
    it('✓ 应该能获取错题本列表', async () => {
      const res = await request(app)
        .get('/api/questions/wrong-book')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 20 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.wrongQuestions)).toBe(true);
    });
  });
});
