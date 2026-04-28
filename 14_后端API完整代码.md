# 数学K12拍照解题APP - 后端API完整代码

> 文档版本：v1.0
> 创建时间：2026-04-28
> 说明：基于Express.js的完整后端API代码，包含认证、解题、错题本、AI组卷等核心服务

---

## 一、项目结构

```
backend/
├── src/
│   ├── index.js                 # 入口文件
│   ├── config/
│   │   └── index.js             # 配置文件
│   ├── middleware/
│   │   ├── auth.js              # 认证中间件
│   │   ├── rateLimit.js         # 限流中间件
│   │   └── errorHandler.js      # 错误处理
│   ├── routes/
│   │   ├── index.js             # 路由入口
│   │   ├── auth.js              # 认证路由
│   │   ├── question.js          # 题目路由
│   │   ├── wrongbook.js         # 错题本路由
│   │   └── paper.js             # 试卷路由
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── questionController.js
│   │   ├── wrongbookController.js
│   │   └── paperController.js
│   ├── services/
│   │   ├── ocrService.js        # OCR服务
│   │   ├── llmService.js       # LLM服务
│   │   ├── questionService.js  # 题库服务
│   │   └── paperService.js      # 组卷服务
│   ├── models/
│   │   ├── User.js
│   │   ├── Question.js
│   │   ├── WrongQuestion.js
│   │   └── Paper.js
│   └── utils/
│       ├── redis.js             # Redis客户端
│       ├── mongodb.js           # MongoDB连接
│       └── response.js          # 响应封装
├── package.json
└── .env
```

---

## 二、核心代码

### 2.1 入口文件

```javascript
// src/index.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { connectDB } = require('./utils/mongodb');
const { initRedis } = require('./utils/redis');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 请求日志
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// 路由
app.use('/api', routes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 启动服务
async function start() {
  try {
    await connectDB();
    await initRedis();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
```

### 2.2 配置文件

```javascript
// src/config/index.js
require('dotenv').config();

module.exports = {
  // 服务器配置
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // MongoDB配置
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/education_k12',

  // Redis配置
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: process.env.REDIS_PORT || 6379,

  // JWT配置
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // 第三方API配置
  OCR: {
    YOUDAO_APP_KEY: process.env.YOUDAO_APP_KEY,
    YOUDAO_APP_SECRET: process.env.YOUDAO_APP_SECRET,
  },
  LLM: {
    PROVIDER: process.env.LLM_PROVIDER || 'deepseek',
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_BASE_URL: 'https://api.deepseek.com/v1',
  },

  // 业务配置
  FREE_DAILY_COUNT: 10,           // 每日免费次数
  VIP_MONTHLY_PRICE: 29,          // 月度会员价格(元)
  VIP_YEARLY_PRICE: 199,          // 年度会员价格(元)

  // 限流配置
  RATE_LIMIT: {
    WINDOW_MS: 60 * 1000,          // 1分钟窗口
    MAX_REQUESTS: 100,            // 最大请求数
    SOLVE_LIMIT: 20,             // 解题接口限制(每小时)
  },
};
```

### 2.3 认证中间件

```javascript
// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const config = require('../config');
const { ErrorResponse } = require('../utils/response');
const User = require('../models/User');

/**
 * 认证中间件 - 验证JWT Token
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ErrorResponse(401, '请先登录');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.JWT_SECRET);

    const user = await User.findById(decoded.userId).select('-password');
    if (!user) {
      throw new ErrorResponse(401, '用户不存在');
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new ErrorResponse(401, 'Token无效'));
    } else if (error.name === 'TokenExpiredError') {
      next(new ErrorResponse(401, '登录已过期'));
    } else {
      next(error);
    }
  }
};

/**
 * 会员校验中间件
 */
const requireVip = (req, res, next) => {
  if (!req.user.is_vip) {
    return next(new ErrorResponse(403, '此功能需要开通会员'));
  }
  next();
};

/**
 * 每日免费次数校验
 */
const checkDailyLimit = async (req, res, next) => {
  const today = new Date().toISOString().split('T')[0];
  const key = `limit:daily:solve:${req.userId}:${today}`;

  const redis = require('../utils/redis');
  const count = await redis.get(key);

  if (count >= config.FREE_DAILY_COUNT && !req.user.is_vip) {
    return next(new ErrorResponse(429, '今日免费次数已用完，请明天再来或开通会员'));
  }

  // 计数+1
  await redis.incr(key);
  if (count === null) {
    await redis.expire(key, 86400); // 设置24小时过期
  }

  next();
};

module.exports = { authenticate, requireVip, checkDailyLimit };
```

### 2.4 认证控制器

```javascript
// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('../config');
const User = require('../models/User');
const { SuccessResponse } = require('../utils/response');

// 发送验证码（模拟，实际应接入短信服务）
const sendCode = async (req, res, next) => {
  try {
    const { phone } = req.body;

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 存入Redis，5分钟有效期
    const redis = require('../utils/redis');
    await redis.setex(`sms:code:${phone}`, 300, code);

    // 实际应调用短信API发送验证码
    console.log(`[SMS] 验证码已发送至 ${phone}: ${code}`);

    res.json(new SuccessResponse({ message: '验证码已发送' }));
  } catch (error) {
    next(error);
  }
};

// 注册
const register = async (req, res, next) => {
  try {
    const { phone, code, nickname, grade } = req.body;

    // 验证验证码
    const redis = require('../utils/redis');
    const storedCode = await redis.get(`sms:code:${phone}`);

    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ code: 'INVALID_CODE', message: '验证码错误或已过期' });
    }

    // 检查用户是否存在
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ code: 'USER_EXISTS', message: '该手机号已注册' });
    }

    // 创建用户
    const user = new User({
      phone,
      nickname: nickname || `用户${phone.slice(-4)}`,
      grade,
      daily_free_count: config.FREE_DAILY_COUNT,
    });
    await user.save();

    // 生成Token
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

    res.status(201).json(new SuccessResponse({
      token,
      user: {
        id: user._id,
        phone: user.phone,
        nickname: user.nickname,
        grade: user.grade,
        is_vip: user.is_vip,
        daily_free_count: user.daily_free_count,
      },
    }));
  } catch (error) {
    next(error);
  }
};

// 登录
const login = async (req, res, next) => {
  try {
    const { phone, code } = req.body;

    // 验证验证码
    const redis = require('../utils/redis');
    const storedCode = await redis.get(`sms:code:${phone}`);

    if (!storedCode || storedCode !== code) {
      return res.status(400).json({ code: 'INVALID_CODE', message: '验证码错误或已过期' });
    }

    // 查找或创建用户
    let user = await User.findOne({ phone });
    if (!user) {
      user = new User({
        phone,
        nickname: `用户${phone.slice(-4)}`,
        daily_free_count: config.FREE_DAILY_COUNT,
      });
      await user.save();
    }

    // 更新最后登录时间
    user.last_login_at = new Date();
    await user.save();

    // 生成Token
    const token = jwt.sign({ userId: user._id }, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

    res.json(new SuccessResponse({
      token,
      user: {
        id: user._id,
        phone: user.phone,
        nickname: user.nickname,
        grade: user.grade,
        is_vip: user.is_vip,
        daily_free_count: user.daily_free_count,
      },
    }));
  } catch (error) {
    next(error);
  }
};

// 获取用户信息
const getProfile = async (req, res, next) => {
  try {
    const user = req.user;
    res.json(new SuccessResponse({
      id: user._id,
      phone: user.phone,
      nickname: user.nickname,
      avatar_url: user.avatar_url,
      grade: user.grade,
      is_vip: user.is_vip,
      vip_expire_at: user.vip_expire_at,
      daily_free_count: user.daily_free_count,
      created_at: user.created_at,
    }));
  } catch (error) {
    next(error);
  }
};

// 更新用户信息
const updateProfile = async (req, res, next) => {
  try {
    const { nickname, avatar_url, grade } = req.body;
    const user = req.user;

    if (nickname !== undefined) user.nickname = nickname;
    if (avatar_url !== undefined) user.avatar_url = avatar_url;
    if (grade !== undefined) user.grade = grade;

    await user.save();

    res.json(new SuccessResponse({ message: '更新成功', user: { id: user._id, nickname: user.nickname, grade: user.grade } }));
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendCode,
  register,
  login,
  getProfile,
  updateProfile,
};
```

### 2.5 解题控制器

```javascript
// src/controllers/questionController.js
const crypto = require('crypto');
const config = require('../config');
const { ErrorResponse, SuccessResponse } = require('../utils/response');
const ocrService = require('../services/ocrService');
const llmService = require('../services/llmService');
const questionService = require('../services/questionService');
const WrongQuestion = require('../models/WrongQuestion');
const User = require('../models/User');
const { authenticate, checkDailyLimit } = require('../middleware/auth');

// 拍照解题
const solve = [
  authenticate,
  checkDailyLimit,
  async (req, res, next) => {
    try {
      const { image_base64 } = req.body;
      const { grade } = req.user;

      // 1. OCR识别题目
      console.log('[Solve] 开始OCR识别...');
      const ocrResult = await ocrService.recognize(image_base64);
      const questionText = ocrResult.text;

      if (!questionText || questionText.length < 5) {
        throw new ErrorResponse(400, '未能识别到有效题目，请重新拍摄');
      }

      // 2. 检查题库是否有相同题目
      console.log('[Solve] 检查题库匹配...');
      const cachedResult = await questionService.findSimilar(questionText);
      if (cachedResult) {
        console.log('[Solve] 题库命中，直接返回');
        return res.json(new SuccessResponse({
          question_id: cachedResult._id,
          source: 'database',
          ...cachedResult.toObject(),
        }));
      }

      // 3. 调用LLM解题
      console.log('[Solve] 调用AI解题...');
      const solveResult = await llmService.solve(questionText, {
        grade,
        userHistory: await getUserRecentMistakes(req.userId),
      });

      // 4. 保存到题库（异步）
      questionService.save(questionText, solveResult).catch(console.error);

      // 5. 返回结果
      res.json(new SuccessResponse({
        question_id: `temp_${Date.now()}`,
        source: 'ai_generated',
        question: questionText,
        ...solveResult,
      }));
    } catch (error) {
      next(error);
    }
  },
];

// 获取相似题（举一反三）
const getSimilar = [
  authenticate,
  async (req, res, next) => {
    try {
      const { question_id, count = 3 } = req.query;

      const question = await questionService.findById(question_id);
      if (!question) {
        throw new ErrorResponse(404, '题目不存在');
      }

      const similarQuestions = await questionService.findSimilarQuestions(
        question.knowledge_points,
        question.difficulty,
        parseInt(count)
      );

      res.json(new SuccessResponse({
        original: question,
        similar: similarQuestions,
      }));
    } catch (error) {
      next(error);
    }
  },
];

// 获取用户近期错题（用于AI理解用户薄弱点）
async function getUserRecentMistakes(userId) {
  const mistakes = await WrongQuestion.find({ user_id: userId })
    .sort({ created_at: -1 })
    .limit(5)
    .select('content knowledge_points')
    .lean();

  return mistakes.map(m => ({
    question: m.content,
    knowledge: m.knowledge_points,
  }));
}

module.exports = { solve, getSimilar };
```

### 2.6 错题本控制器

```javascript
// src/controllers/wrongbookController.js
const WrongQuestion = require('../models/WrongQuestion');
const { authenticate } = require('../middleware/auth');
const { SuccessResponse, ErrorResponse } = require('../utils/response');

// 添加错题
const add = [
  authenticate,
  async (req, res, next) => {
    try {
      const { question_id, content, answer, knowledge_points, difficulty } = req.body;
      const userId = req.userId;

      // 检查是否已存在
      const existing = await WrongQuestion.findOne({
        user_id: userId,
        question_id,
      });

      if (existing) {
        return res.json(new SuccessResponse({ message: '已添加到错题本', wrong_question: existing }));
      }

      const wrongQuestion = new WrongQuestion({
        user_id: userId,
        question_id,
        content,
        answer,
        knowledge_points,
        difficulty,
        status: 'new', // new, practicing, mastered
      });

      await wrongQuestion.save();

      res.status(201).json(new SuccessResponse({
        message: '已添加到错题本',
        wrong_question: wrongQuestion,
      }));
    } catch (error) {
      next(error);
    }
  },
];

// 获取错题列表
const list = [
  authenticate,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 20, status, knowledge, difficulty } = req.query;
      const userId = req.userId;

      const query = { user_id: userId };
      if (status) query.status = status;
      if (knowledge) query.knowledge_points = knowledge;
      if (difficulty) query.difficulty = parseInt(difficulty);

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [questions, total] = await Promise.all([
        WrongQuestion.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        WrongQuestion.countDocuments(query),
      ]);

      res.json(new SuccessResponse({
        list: questions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      }));
    } catch (error) {
      next(error);
    }
  },
];

// 获取错题详情
const detail = [
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const question = await WrongQuestion.findOne({
        _id: id,
        user_id: userId,
      });

      if (!question) {
        throw new ErrorResponse(404, '错题不存在');
      }

      res.json(new SuccessResponse(question));
    } catch (error) {
      next(error);
    }
  },
];

// 更新错题状态
const updateStatus = [
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.userId;

      if (!['new', 'practicing', 'mastered'].includes(status)) {
        throw new ErrorResponse(400, '无效的状态');
      }

      const question = await WrongQuestion.findOneAndUpdate(
        { _id: id, user_id: userId },
        {
          status,
          ...(status === 'mastered' ? { mastered_at: new Date() } : {}),
        },
        { new: true }
      );

      if (!question) {
        throw new ErrorResponse(404, '错题不存在');
      }

      res.json(new SuccessResponse({ message: '状态已更新', question }));
    } catch (error) {
      next(error);
    }
  },
];

// 删除错题
const remove = [
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const result = await WrongQuestion.deleteOne({
        _id: id,
        user_id: userId,
      });

      if (result.deletedCount === 0) {
        throw new ErrorResponse(404, '错题不存在');
      }

      res.json(new SuccessResponse({ message: '已删除' }));
    } catch (error) {
      next(error);
    }
  },
];

// 获取知识点统计
const stats = [
  authenticate,
  async (req, res, next) => {
    try {
      const userId = req.userId;

      const stats = await WrongQuestion.aggregate([
        { $match: { user_id: userId } },
        { $unwind: '$knowledge_points' },
        {
          $group: {
            _id: '$knowledge_points',
            total: { $sum: 1 },
            mastered: {
              $sum: { $cond: [{ $eq: ['$status', 'mastered'] }, 1, 0] },
            },
            practicing: {
              $sum: { $cond: [{ $eq: ['$status', 'practicing'] }, 1, 0] },
            },
          },
        },
        {
          $project: {
            knowledge_point: '$_id',
            total: 1,
            mastered: 1,
            practicing: 1,
            unmastered: { $subtract: ['$total', { $add: ['$mastered', '$practicing'] }] },
            mastery_rate: {
              $multiply: [
                { $divide: ['$mastered', { $max: ['$total', 1] }] },
                100,
              ],
            },
          },
        },
        { $sort: { total: -1 } },
        { $limit: 20 },
      ]);

      res.json(new SuccessResponse({ stats }));
    } catch (error) {
      next(error);
    }
  },
];

module.exports = { add, list, detail, updateStatus, remove, stats };
```

### 2.7 AI组卷控制器

```javascript
// src/controllers/paperController.js
const Paper = require('../models/Paper');
const WrongQuestion = require('../models/WrongQuestion');
const llmService = require('../services/llmService');
const questionService = require('../services/questionService');
const { authenticate, requireVip } = require('../middleware/auth');
const { SuccessResponse, ErrorResponse } = require('../utils/response');

// 生成试卷
const generate = [
  authenticate,
  async (req, res, next) => {
    try {
      const { topic_ids, difficulty, count = 10, title } = req.body;
      const userId = req.userId;

      // 1. 获取用户薄弱知识点
      const weakPoints = await getUserWeakPoints(userId, topic_ids);

      // 2. 从题库获取同类题
      const baseQuestions = await questionService.getQuestionsByTopics(topic_ids, {
        difficulty,
        limit: Math.floor(count * 0.4), // 40%题库题
      });

      // 3. 调用AI生成个性化题
      const generatedQuestions = await llmService.generateQuestions({
        topics: topic_ids,
        weakPoints,
        count: Math.floor(count * 0.6), // 60%AI生成
        difficulty,
        userGrade: req.user.grade,
      });

      // 4. 整合试卷
      const questions = [
        ...baseQuestions.map(q => ({
          ...q,
          source: 'database',
          score: 10,
        })),
        ...generatedQuestions.map(q => ({
          ...q,
          source: 'ai_generated',
          score: 10,
        })),
      ];

      // 5. 创建试卷记录
      const paper = new Paper({
        user_id: userId,
        title: title || `专项测试-${topic_ids.join(',')}`,
        topic_ids,
        questions,
        difficulty,
        status: 'draft',
        total_score: questions.length * 10,
      });

      await paper.save();

      res.status(201).json(new SuccessResponse({
        paper_id: paper._id,
        title: paper.title,
        question_count: questions.length,
        total_score: paper.total_score,
        questions: questions.slice(0, 5), // 先返回5题预览
      }));
    } catch (error) {
      next(error);
    }
  },
];

// 获取试卷详情
const getPaper = [
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.userId;

      const paper = await Paper.findOne({ _id: id, user_id: userId });
      if (!paper) {
        throw new ErrorResponse(404, '试卷不存在');
      }

      res.json(new SuccessResponse(paper));
    } catch (error) {
      next(error);
    }
  },
];

// 获取试卷列表
const listPapers = [
  authenticate,
  async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const userId = req.userId;

      const query = { user_id: userId };
      if (status) query.status = status;

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [papers, total] = await Promise.all([
        Paper.find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('title topic_ids question_count total_score status created_at')
          .lean(),
        Paper.countDocuments(query),
      ]);

      res.json(new SuccessResponse({
        list: papers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      }));
    } catch (error) {
      next(error);
    }
  },
];

// 提交试卷答案
const submit = [
  authenticate,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { answers } = req.body; // { questionId: userAnswer }
      const userId = req.userId;

      const paper = await Paper.findOne({ _id: id, user_id: userId });
      if (!paper) {
        throw new ErrorResponse(404, '试卷不存在');
      }

      if (paper.status === 'completed') {
        throw new ErrorResponse(400, '试卷已提交，请勿重复提交');
      }

      // 批改试卷
      const gradingResult = await gradePaper(paper, answers);

      // 更新试卷状态
      paper.status = 'completed';
      paper.answers = answers;
      paper.grading_result = gradingResult;
      paper.completed_at = new Date();
      await paper.save();

      res.json(new SuccessResponse({
        message: '提交成功',
        result: gradingResult,
      }));
    } catch (error) {
      next(error);
    }
  },
];

// 获取用户薄弱知识点
async function getUserWeakPoints(userId, topicIds) {
  const weakPoints = await WrongQuestion.aggregate([
    { $match: { user_id: userId, knowledge_points: { $in: topicIds } } },
    {
      $group: {
        _id: '$knowledge_points',
        total: { $sum: 1 },
        mastered: {
          $sum: { $cond: [{ $eq: ['$status', 'mastered'] }, 1, 0] },
        },
      },
    },
    {
      $project: {
        knowledge: '$_id',
        weakness_score: {
          $subtract: [100, { $multiply: [{ $divide: ['$mastered', { $max: ['$total', 1] }] }, 100] }],
        },
      },
    },
    { $match: { weakness_score: { $gt: 30 } } }, // 掌握度<70%视为薄弱
    { $sort: { weakness_score: -1 } },
    { $limit: 5 },
  ]);

  return weakPoints;
}

// 批改试卷
async function gradePaper(paper, answers) {
  const results = [];
  let totalScore = 0;
  const correctCount = { database: 0, ai_generated: 0 };
  const totalCount = { database: 0, ai_generated: 0 };

  for (const question of paper.questions) {
    const userAnswer = answers[question._id.toString()];
    const isCorrect = normalizeAnswer(userAnswer) === normalizeAnswer(question.answer);

    totalCount[question.source]++;
    if (isCorrect) {
      correctCount[question.source]++;
      totalScore += question.score;
    }

    results.push({
      question_id: question._id,
      user_answer: userAnswer,
      correct_answer: question.answer,
      is_correct: isCorrect,
      score: isCorrect ? question.score : 0,
      error_type: isCorrect ? null : '答案错误',
    });
  }

  return {
    total_score: totalScore,
    max_score: paper.total_score,
    score_rate: Math.round((totalScore / paper.total_score) * 100),
    correct_count: {
      database: correctCount.database,
      ai_generated: correctCount.ai_generated,
      total: correctCount.database + correctCount.ai_generated,
    },
    total_count: {
      database: totalCount.database,
      ai_generated: totalCount.ai_generated,
      total: totalCount.database + totalCount.ai_generated,
    },
    details: results,
  };
}

// 答案标准化
function normalizeAnswer(answer) {
  if (!answer) return '';
  return answer.toString().replace(/\s+/g, '').toLowerCase();
}

module.exports = { generate, getPaper, listPapers, submit };
```

### 2.8 OCR服务

```javascript
// src/services/ocrService.js
const crypto = require('crypto');
const axios = require('axios');
const config = require('../config');

/**
 * 有道智云OCR识别
 * 数学公式识别准确率较高
 */
async function recognizeYoudao(imageBase64) {
  const API_URL = 'https://openapi.youdao.com/ocrapi';

  const params = {
    img: imageBase64,
    lang: 'auto',
    detectType: '10012', // 文档识别
    imageType: '1', // Base64
  };

  try {
    const response = await axios.post(API_URL, null, {
      params: {
        appKey: config.OCR.YOUDAO_APP_KEY,
        salt: Date.now().toString(),
        curtime: Math.round(Date.now() / 1000).toString(),
        sign: generateSign(params),
        signType: 'v3',
        ...params,
      },
    });

    if (response.data.errorCode !== '0') {
      throw new Error(`OCR识别失败: ${response.data.errorCode}`);
    }

    // 解析结果
    const result = response.data.result || {};
    return {
      text: result.text || '',
      angles: result.angles || [],
      confidence: result.confidence || 0.8,
    };
  } catch (error) {
    console.error('[OCR] 有道识别失败:', error.message);
    throw error;
  }
}

/**
 * 百度OCR识别（备用）
 */
async function recognizeBaidu(imageBase64) {
  const API_URL = 'https://aip.baidubce.com/rest/2.0/ocr/v1/formula';

  try {
    const response = await axios.post(APIUrl, {
      image: imageBase64,
      recognize_paragraph: true,
    });

    const result = response.data;
    if (result.error_msg) {
      throw new Error(`OCR识别失败: ${result.error_msg}`);
    }

    return {
      text: result.words_result?.map(w => w.words).join('\n') || '',
      confidence: 0.85,
    };
  } catch (error) {
    console.error('[OCR] 百度识别失败:', error.message);
    throw error;
  }
}

// 生成有道签名
function generateSign(params) {
  const appSecret = config.OCR.YOUDAO_APP_SECRET;
  const input = params.img.slice(0, 20) + params.img.slice(-10);
  const curtime = params.curtime;
  const salt = params.salt;
  const str = config.OCR.YOUDAO_APP_KEY + input + salt + curtime + appSecret;
  return crypto.createHash('sha256').update(str).digest('hex');
}

// 统一导出
async function recognize(imageBase64) {
  try {
    // 优先使用有道（数学公式识别更好）
    return await recognizeYoudao(imageBase64);
  } catch (error) {
    // 降级到百度
    console.log('[OCR] 降级到百度OCR...');
    return await recognizeBaidu(imageBase64);
  }
}

module.exports = { recognize };
```

### 2.9 LLM服务

```javascript
// src/services/llmService.js
const axios = require('axios');
const config = require('../config');

/**
 * DeepSeek LLM调用
 */
async function callDeepSeek(messages, options = {}) {
  const response = await axios.post(
    `${config.LLM.DEEPSEEK_BASE_URL}/chat/completions`,
    {
      model: 'deepseek-chat',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      stream: options.stream || false,
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.LLM.DEEPSEEK_API_KEY}`,
      },
    }
  );

  return response.data;
}

/**
 * 拍照解题
 */
async function solve(questionText, context = {}) {
  const prompt = `你是初三数学教师，擅长解题和讲解。

题目：${questionText}

请给出：
1. 详细解题步骤（每步标注得分点）
2. 多种解法（如有）
3. 易错点提示
4. 举一反三变式题2道

输出JSON格式：
{
  "solutions": [
    {
      "method": "解法名称",
      "steps": ["步骤1", "步骤2"],
      "scoring_points": ["步骤1得分", "步骤2得分"]
    }
  ],
  "tips": ["易错点提示"],
  "similar_questions": [
    {"question": "变式题1", "answer": "答案1"}
  ],
  "knowledge_points": ["知识点1"]
}`;

  const response = await callDeepSeek([
    { role: 'system', content: '你是一位专业、耐心的数学教师。' },
    { role: 'user', content: prompt },
  ]);

  const content = response.choices[0].message.content;

  try {
    // 提取JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('无法解析AI响应');
  } catch (error) {
    console.error('[LLM] 解析失败:', error.message);
    // 返回降级结果
    return {
      solutions: [{ method: 'AI解析', steps: [content], scoring_points: ['10分'] }],
      tips: ['请参考AI给出的解答'],
      similar_questions: [],
      knowledge_points: [],
    };
  }
}

/**
 * 生成个性化题目
 */
async function generateQuestions(params) {
  const { topics, weakPoints, count, difficulty, userGrade } = params;

  const prompt = `你是初三数学教师，基于学生薄弱点生成个性化练习题。

学生薄弱知识点：
${weakPoints.map(w => `- ${w.knowledge}: 掌握度${100 - w.weakness_score}%`).join('\n')}

要求：
1. 生成${count}道针对性练习题
2. 难度：${difficulty || '中等'}
3. 每道题要有诊断价值（能暴露学生思维漏洞）
4. 确保题目与薄弱知识点相关

输出JSON格式：
{
  "questions": [
    {
      "content": "题目内容",
      "answer": "答案",
      "difficulty": 3,
      "knowledge_points": ["知识点"],
      "diagnosis_point": "诊断目的"
    }
  ]
}`;

  const response = await callDeepSeek([
    { role: 'system', content: '你是一位专业数学教师，擅长设计有诊断价值的练习题。' },
    { role: 'user', content: prompt },
  ]);

  const content = response.choices[0].message.content;

  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result.questions || [];
    }
    return [];
  } catch (error) {
    console.error('[LLM] 生成题目失败:', error.message);
    return [];
  }
}

module.exports = { solve, generateQuestions };
```

### 2.10 路由配置

```javascript
// src/routes/index.js
const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const questionRoutes = require('./question');
const wrongbookRoutes = require('./wrongbook');
const paperRoutes = require('./paper');

router.use('/auth', authRoutes);
router.use('/question', questionRoutes);
router.use('/wrongbook', wrongbookRoutes);
router.use('/paper', paperRoutes);

module.exports = router;
```

```javascript
// src/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/send-code', authController.sendCode);
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);

module.exports = router;
```

```javascript
// src/routes/question.js
const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

router.post('/solve', questionController.solve);
router.get('/similar', questionController.getSimilar);

module.exports = router;
```

```javascript
// src/routes/wrongbook.js
const express = require('express');
const router = express.Router();
const wrongbookController = require('../controllers/wrongbookController');

router.post('/', wrongbookController.add);
router.get('/', wrongbookController.list);
router.get('/stats', wrongbookController.stats);
router.get('/:id', wrongbookController.detail);
router.put('/:id/status', wrongbookController.updateStatus);
router.delete('/:id', wrongbookController.remove);

module.exports = router;
```

```javascript
// src/routes/paper.js
const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');

router.post('/generate', paperController.generate);
router.get('/', paperController.listPapers);
router.get('/:id', paperController.getPaper);
router.post('/:id/submit', paperController.submit);

module.exports = router;
```

---

## 三、数据库模型

```javascript
// src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true },
  password: { type: String, default: null }, // 短信登录无需密码
  nickname: { type: String, default: '' },
  avatar_url: { type: String, default: '' },
  grade: { type: Number, default: 0 }, // 0未知,1-6小学,7-9初中,10-12高中
  role: { type: String, enum: ['student', 'parent', 'teacher'], default: 'student' },

  // 会员相关
  is_vip: { type: Boolean, default: false },
  vip_expire_at: { type: Date, default: null },
  member_level: { type: String, enum: ['experience', 'standard', 'flagship'], default: null },

  // 次数相关
  daily_free_count: { type: Number, default: 10 },
  last_reset_date: { type: String, default: null }, // YYYY-MM-DD

  // 时间戳
  last_login_at: { type: Date, default: Date.now },
}, { timestamps: true });

// 重置每日免费次数
userSchema.methods.resetDailyCount = async function() {
  const today = new Date().toISOString().split('T')[0];
  if (this.last_reset_date !== today) {
    this.daily_free_count = 10;
    this.last_reset_date = today;
    await this.save();
  }
};

module.exports = mongoose.model('User', userSchema);
```

---

## 四、快速部署

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑.env填入API密钥

# 3. 启动开发服务器
npm run dev

# 4. PM2生产部署
pm2 start src/index.js --name mathk12-backend
pm2 save
pm2 startup
```

---

## 五、API文档摘要

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | /api/auth/send-code | 发送验证码 | 否 |
| POST | /api/auth/register | 注册 | 否 |
| POST | /api/auth/login | 登录 | 否 |
| GET | /api/auth/profile | 获取用户信息 | 是 |
| POST | /api/question/solve | 拍照解题 | 是 |
| GET | /api/question/similar | 相似题推荐 | 是 |
| POST | /api/wrongbook | 添加错题 | 是 |
| GET | /api/wrongbook | 错题列表 | 是 |
| GET | /api/wrongbook/stats | 知识点统计 | 是 |
| POST | /api/paper/generate | AI生成试卷 | 是 |
| GET | /api/paper | 试卷列表 | 是 |
| POST | /api/paper/:id/submit | 提交试卷 | 是 |
