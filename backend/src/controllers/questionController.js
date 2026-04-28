/**
 * 题目控制器
 */

const { v4: uuidv4 } = require('uuid');
const { Question } = require('../models/Question');
const { WrongQuestion } = require('../models/WrongQuestion');
const { User } = require('../models/User');
const { ocrService } = require('../services/ocrService');
const { llmService } = require('../services/llmService');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

// 拍照解题
exports.solve = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        code: 400,
        message: '请上传题目图片',
      });
    }

    // 1. OCR识别文字
    logger.info('开始OCR识别...');
    const ocrResult = await ocrService.recognize(imageFile.buffer);

    // 2. AI解题
    logger.info('开始AI解题...');
    const solveResult = await llmService.solveQuestion({
      questionText: ocrResult.text,
      grade: req.user.grade,
    });

    // 3. 保存题目记录
    const question = await Question.create({
      userId,
      questionImage: ocrResult.imageUrl,
      questionText: ocrResult.text,
      answer: solveResult.answer,
      explanation: solveResult.explanation,
      knowledgePoints: solveResult.knowledgePoints,
      steps: solveResult.steps,
      difficulty: solveResult.difficulty,
      status: 'solved',
    });

    // 4. 更新用户统计
    await User.findByIdAndUpdate(userId, {
      $inc: { totalQuestions: 1 },
    });

    // 5. 返回结果
    res.json({
      code: 200,
      message: '解题成功',
      data: {
        questionId: question._id,
        questionText: question.questionText,
        answer: question.answer,
        explanation: question.explanation,
        knowledgePoints: question.knowledgePoints,
        steps: question.steps,
      },
    });
  } catch (error) {
    logger.error('解题失败:', error);
    next(error);
  }
};

// 获取题目详情
exports.getQuestion = async (req, res, next) => {
  try {
    const { id } = req.params;

    // 先查缓存
    const cacheKey = `question:${id}`;
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      return res.json({
        code: 200,
        data: JSON.parse(cached),
      });
    }

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        code: 404,
        message: '题目不存在',
      });
    }

    const result = {
      id: question._id,
      questionText: question.questionText,
      questionImage: question.questionImage,
      answer: question.answer,
      explanation: question.explanation,
      knowledgePoints: question.knowledgePoints,
      steps: question.steps,
      difficulty: question.difficulty,
      createdAt: question.createdAt,
    };

    // 缓存结果
    await redisClient.setex(cacheKey, 3600, JSON.stringify(result));

    res.json({
      code: 200,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// 获取举一反三
exports.getSimilarQuestions = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { count = 3 } = req.query;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        code: 404,
        message: '题目不存在',
      });
    }

    // 生成相似题目
    const similarQuestions = await llmService.generateSimilarQuestions({
      originalQuestion: question.questionText,
      knowledgePoints: question.knowledgePoints,
      count: parseInt(count),
      grade: req.user.grade,
    });

    res.json({
      code: 200,
      data: {
        questions: similarQuestions,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 提交答案
exports.submitAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { answer } = req.body;

    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({
        code: 404,
        message: '题目不存在',
      });
    }

    // 判断是否正确（简化判断）
    const isCorrect = answer.trim().toLowerCase() === question.answer.trim().toLowerCase();

    // 更新用户统计
    if (isCorrect) {
      await User.findByIdAndUpdate(req.user.id, {
        $inc: { totalCorrect: 1 },
      });
    } else {
      // 记录错题
      await WrongQuestion.findOneAndUpdate(
        { userId: req.user.id, questionId: id },
        {
          $inc: { wrongCount: 1 },
          $set: { lastWrongTime: new Date() },
        },
        { upsert: true }
      );
    }

    res.json({
      code: 200,
      data: {
        isCorrect,
        correctAnswer: question.answer,
      },
    });
  } catch (error) {
    next(error);
  }
};

// 获取用户历史题目
exports.getUserQuestions = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;

    const questions = await Question.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));

    const total = await Question.countDocuments({ userId: req.user.id });

    res.json({
      code: 200,
      data: {
        questions: questions.map((q) => ({
          id: q._id,
          questionText: q.questionText,
          answer: q.answer,
          knowledgePoints: q.knowledgePoints,
          difficulty: q.difficulty,
          createdAt: q.createdAt,
        })),
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          pages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
