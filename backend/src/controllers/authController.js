/**
 * 认证控制器
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { User } = require('../models/User');
const { generateToken, generateRefreshToken } = require('../utils/jwt');
const { sendSMS } = require('../services/smsService');
const { redisClient } = require('../config/redis');
const logger = require('../utils/logger');

// 发送验证码
exports.sendCode = async (req, res, next) => {
  try {
    const { phone, type = 'login' } = req.body;

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 存储验证码到Redis（5分钟有效）
    const cacheKey = `sms:code:${phone}`;
    await redisClient.setex(cacheKey, 300, code);

    // 记录验证码（生产环境真实发送）
    if (process.env.NODE_ENV === 'production') {
      await sendSMS(phone, code);
    } else {
      logger.info(`[测试环境] 手机号 ${phone} 的验证码: ${code}`);
    }

    res.json({
      code: 200,
      message: '验证码已发送',
      data: { expiresIn: 300 },
    });
  } catch (error) {
    next(error);
  }
};

// 登录
exports.login = async (req, res, next) => {
  try {
    const { phone, code } = req.body;

    // 验证验证码
    const cacheKey = `sms:code:${phone}`;
    const cachedCode = await redisClient.get(cacheKey);

    if (!cachedCode || cachedCode !== code) {
      return res.status(401).json({
        code: 401,
        message: '验证码错误或已过期',
      });
    }

    // 清除验证码
    await redisClient.del(cacheKey);

    // 查找或创建用户
    let user = await User.findOne({ phone });

    if (!user) {
      // 新用户自动注册
      user = await User.create({
        phone,
        nickname: `用户${phone.slice(-4)}`,
        grade: '初一',
        vipLevel: 'free',
      });
    }

    // 更新登录信息
    user.lastLoginAt = new Date();
    user.loginCount += 1;
    await user.save();

    // 生成Token
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          grade: user.grade,
          vipLevel: user.vipLevel,
          vipExpireTime: user.vipExpireTime,
          totalQuestions: user.totalQuestions,
          totalCorrect: user.totalCorrect,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 注册
exports.register = async (req, res, next) => {
  try {
    const { phone, code, nickname, grade } = req.body;

    // 验证验证码
    const cacheKey = `sms:code:${phone}`;
    const cachedCode = await redisClient.get(cacheKey);

    if (!cachedCode || cachedCode !== code) {
      return res.status(401).json({
        code: 401,
        message: '验证码错误或已过期',
      });
    }

    // 清除验证码
    await redisClient.del(cacheKey);

    // 检查手机号是否已注册
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        code: 400,
        message: '该手机号已注册，请直接登录',
      });
    }

    // 创建用户
    const user = await User.create({
      phone,
      nickname,
      grade,
      vipLevel: 'free',
    });

    // 生成Token
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      code: 200,
      message: '注册成功',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          grade: user.grade,
          vipLevel: user.vipLevel,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 微信登录
exports.wechatLogin = async (req, res, next) => {
  try {
    const { code } = req.body;

    let user = await User.findOne({ wechatOpenid: code });

    if (!user) {
      user = await User.create({
        phone: `wx_${code}`,
        nickname: '微信用户',
        wechatOpenid: code,
        vipLevel: 'free',
      });
    }

    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    res.json({
      code: 200,
      message: '登录成功',
      data: {
        token,
        refreshToken,
        user: {
          id: user._id,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
          vipLevel: user.vipLevel,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// 刷新Token
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        code: 400,
        message: '缺少refreshToken',
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const newToken = generateToken(decoded.userId);

    res.json({
      code: 200,
      message: '刷新成功',
      data: { token: newToken },
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: 'refreshToken已过期，请重新登录',
      });
    }
    next(error);
  }
};
