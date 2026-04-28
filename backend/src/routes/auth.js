/**
 * 认证路由 - 登录注册
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authController = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');

// 发送验证码
router.post(
  '/send-code',
  authLimiter,
  [
    body('phone')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入正确的手机号'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: 400, message: errors.array()[0].msg });
    }
    authController.sendCode(req, res, next);
  }
);

// 登录
router.post(
  '/login',
  authLimiter,
  [
    body('phone')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入正确的手机号'),
    body('code')
      .isLength({ min: 4, max: 6 })
      .withMessage('验证码为4-6位数字'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: 400, message: errors.array()[0].msg });
    }
    authController.login(req, res, next);
  }
);

// 注册
router.post(
  '/register',
  authLimiter,
  [
    body('phone')
      .matches(/^1[3-9]\d{9}$/)
      .withMessage('请输入正确的手机号'),
    body('code')
      .isLength({ min: 4, max: 6 })
      .withMessage('验证码为4-6位数字'),
    body('nickname')
      .trim()
      .isLength({ min: 2, max: 20 })
      .withMessage('昵称长度为2-20个字符'),
    body('grade')
      .isIn(['初一', '初二', '初三', '高一', '高二', '高三'])
      .withMessage('请选择正确的年级'),
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ code: 400, message: errors.array()[0].msg });
    }
    authController.register(req, res, next);
  }
);

// 微信登录
router.post('/wechat-login', authLimiter, authController.wechatLogin);

// 刷新Token
router.post('/refresh-token', authController.refreshToken);

module.exports = router;
