/**
 * 后端组卷模块测试
 */
const request = require('supertest');
const app = require('../src/server');

describe('组卷模块 API 测试', () => {
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

  describe('POST /api/paper/generate - AI生成试卷', () => {
    it('✓ 应该能成功生成试卷', async () => {
      const res = await request(app)
        .post('/api/paper/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          grade: 'grade_9',
          subject: 'math',
          knowledgePoints: ['二次函数', '一元二次方程'],
          difficulty: 'medium',
          questionCount: 10,
          title: '二次函数单元测试',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('title');
      expect(res.body.data).toHaveProperty('questions');
      expect(Array.isArray(res.body.data.questions)).toBe(true);
    });

    it('✗ 未登录用户不应该生成试卷', async () => {
      const res = await request(app)
        .post('/api/paper/generate')
        .send({
          grade: 'grade_9',
          knowledgePoints: ['二次函数'],
          difficulty: 'medium',
          questionCount: 5,
        });

      expect(res.status).toBe(401);
    });

    it('✗ 缺少必填参数不应该生成试卷', async () => {
      const res = await request(app)
        .post('/api/paper/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          grade: 'grade_9',
          // 缺少 knowledgePoints, difficulty 等
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/paper/list - 试卷列表', () => {
    it('✓ 应该能获取试卷列表', async () => {
      const res = await request(app)
        .get('/api/paper/list')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('papers');
      expect(res.body.data).toHaveProperty('pagination');
    });
  });

  describe('POST /api/paper - 保存试卷', () => {
    it('✓ 应该能成功保存试卷', async () => {
      const res = await request(app)
        .post('/api/paper')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '测试试卷',
          questions: ['q1', 'q2', 'q3'],
          grade: 'grade_9',
          subject: 'math',
          difficulty: 'medium',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('title', '测试试卷');
    });
  });

  describe('DELETE /api/paper/:id - 删除试卷', () => {
    let paperId;

    beforeAll(async () => {
      // 创建试卷获取ID
      const createRes = await request(app)
        .post('/api/paper')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '待删除试卷',
          questions: [],
          grade: 'grade_9',
          subject: 'math',
        });
      paperId = createRes.body.data._id;
    });

    it('✓ 应该能成功删除试卷', async () => {
      const res = await request(app)
        .delete(`/api/paper/${paperId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('✗ 不应该删除不存在的试卷', async () => {
      const res = await request(app)
        .delete('/api/paper/nonexistent_id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
    });
  });
});
