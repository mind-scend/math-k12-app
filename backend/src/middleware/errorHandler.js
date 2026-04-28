/**
 * 错误处理中间件
 */

const logger = require('../utils/logger');

// 统一错误处理
const errorHandler = (err, req, res, next) => {
  logger.error('请求错误:', {
    url: req.originalUrl,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });

  // Multer错误
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      code: 400,
      message: '文件大小超过限制（最大10MB）',
    });
  }

  if (err.message && err.message.includes('只能上传图片')) {
    return res.status(400).json({
      code: 400,
      message: err.message,
    });
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      code: 400,
      message: messages.join(', '),
    });
  }

  // MongoDB重复键错误
  if (err.code === 11000) {
    return res.status(400).json({
      code: 400,
      message: '数据已存在',
    });
  }

  // 默认错误
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    code: statusCode,
    message: statusCode === 500 ? '服务器内部错误' : err.message || '请求失败',
  });
};

// 404处理
const notFoundHandler = (req, res) => {
  res.status(404).json({
    code: 404,
    message: '接口不存在',
  });
};

module.exports = { errorHandler, notFoundHandler };
