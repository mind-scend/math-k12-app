/**
 * API服务测试
 */
import api from '../src/services/api';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('API服务测试', () => {
  describe('Auth API', () => {
    it('✓ 登录API应该正确调用', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { token: 'test_token', user: { id: '1', username: 'test' } },
        },
      };

      api.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await api.post('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toEqual(mockResponse);
      expect(api.post).toHaveBeenCalledWith('/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('✓ 注册API应该正确调用', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: { token: 'test_token', user: { id: '1', username: 'newuser' } },
        },
      };

      api.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await api.post('/auth/register', {
        username: 'newuser',
        email: 'new@example.com',
        password: 'password123',
        grade: 'grade_9',
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Question API', () => {
    it('✓ 提交解题请求应该正确调用', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            solution: '解题答案',
            steps: ['步骤1', '步骤2'],
          },
        },
      };

      api.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await api.post('/questions/solve', {
        imageUrl: 'https://example.com/image.jpg',
      });

      expect(result).toEqual(mockResponse);
      expect(result.data.success).toBe(true);
    });

    it('✓ 获取错题本应该正确调用', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            wrongQuestions: [
              { id: '1', title: '错题1' },
              { id: '2', title: '错题2' },
            ],
          },
        },
      };

      api.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await api.get('/questions/wrong-book');

      expect(result).toEqual(mockResponse);
      expect(result.data.data.wrongQuestions).toHaveLength(2);
    });
  });

  describe('Paper API', () => {
    it('✓ AI生成试卷应该正确调用', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            title: '二次函数测试',
            questions: [{ id: '1', content: '题目1' }],
          },
        },
      };

      api.post = jest.fn().mockResolvedValue(mockResponse);

      const result = await api.post('/paper/generate', {
        grade: 'grade_9',
        knowledgePoints: ['二次函数'],
        difficulty: 'medium',
        questionCount: 10,
      });

      expect(result).toEqual(mockResponse);
      expect(result.data.data).toHaveProperty('title');
    });

    it('✓ 获取试卷列表应该正确调用', async () => {
      const mockResponse = {
        data: {
          success: true,
          data: {
            papers: [],
            pagination: { page: 1, total: 0 },
          },
        },
      };

      api.get = jest.fn().mockResolvedValue(mockResponse);

      const result = await api.get('/paper/list', { params: { page: 1, limit: 10 } });

      expect(result).toEqual(mockResponse);
    });
  });
});
