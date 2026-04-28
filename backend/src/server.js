/**
 * 数学K12后端服务入口
 * 智数学 - AI拍照解题后端API
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// 导入路由
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const questionRoutes = require('./routes/questions');
const wrongQuestionRoutes = require('./routes/wrongQuestions');
const paperRoutes = require('./routes/papers');
const subscriptionRoutes = require('./routes/subscriptions');

// 导入中间件
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

// 导入数据库连接
const { connectDB } = require('./config/database');
const { connectRedis } = require('./config/redis');

const app = express();
const PORT = process.env.PORT || 3000;

// 安全中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// 请求日志
app.use(requestLogger);

// 限流
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
});
app.use('/api/', limiter);

// 解析JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/questions', questionRoutes);
app.use('/api/v1/wrong-questions', wrongQuestionRoutes);
app.use('/api/v1/papers', paperRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 错误处理
app.use(errorHandler);

// 启动服务器
async function startServer() {
  try {
    // 连接数据库
    await connectDB();
    console.log('✅ MySQL数据库连接成功');

    // 连接Redis
    await connectRedis();
    console.log('✅ Redis连接成功');

    // 启动监听
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════╗
║     智数学后端服务启动成功                  ║
╠════════════════════════════════════════════╣
║  环境: ${process.env.NODE_ENV || 'development'}
║  端口: ${PORT}
║  地址: http://localhost:${PORT}
║  API:  http://localhost:${PORT}/api/v1
╚════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
