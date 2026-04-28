import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// API基础配置
const BASE_URL = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://api.mathk12.com/api/v1';

// 创建Axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  async (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Token过期，清除并跳转登录
          await AsyncStorage.removeItem('token');
          // 可以在这里触发导航到登录页
          break;
        case 429:
          console.warn('请求过于频繁，请稍后再试');
          break;
        case 500:
          console.error('服务器错误');
          break;
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

// API服务类
export const apiService = {
  // GET请求
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.get(url, config);
  },

  // POST请求
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.post(url, data, config);
  },

  // PUT请求
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.put(url, data, config);
  },

  // DELETE请求
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return apiClient.delete(url, config);
  },

  // 文件上传
  upload: async <T = any>(
    url: string,
    formData: FormData,
    onProgress?: (progress: number) => void
  ): Promise<T> => {
    return apiClient.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },
};

// 特定业务API
export const questionApi = {
  // 拍照解题
  solve: (imageUri: string) => {
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'question.jpg',
    } as any);
    return apiService.upload('/questions/solve', formData);
  },

  // 获取解题结果
  getSolveResult: (questionId: string) =>
    apiService.get(`/questions/${questionId}`),

  // 获取举一反三
  getSimilarQuestions: (questionId: string, count: number = 3) =>
    apiService.get(`/questions/${questionId}/similar`, { params: { count } }),

  // 提交答案
  submitAnswer: (questionId: string, answer: string) =>
    apiService.post(`/questions/${questionId}/answer`, { answer }),

  // 获取错题本
  getWrongBook: (params?: { page?: number; pageSize?: number }) =>
    apiService.get('/wrong-questions', { params }),

  // AI智能组卷
  generatePaper: (params: {
    topic?: string;
    difficulty?: string;
    questionCount?: number;
    grade?: string;
  }) => apiService.post('/papers/generate', params),

  // 获取历史试卷
  getPapers: (params?: { page?: number; pageSize?: number }) =>
    apiService.get('/papers', { params }),
};

export const subscriptionApi = {
  // 获取套餐列表
  getPlans: () => apiService.get('/subscriptions/plans'),

  // 购买套餐
  purchase: (planId: string, paymentMethod: string) =>
    apiService.post('/subscriptions/purchase', { planId, paymentMethod }),

  // 验证订阅状态
  verify: () => apiService.get('/subscriptions/verify'),
};

export default apiService;
