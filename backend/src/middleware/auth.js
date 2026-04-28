/**
 * 认证中间件
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models/User');

// 验证Token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        code: 401,
        message: '请先登录',
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        code: 401,
        message: '用户不存在',
      });
    }

    req.user = {
      id: user._id,
      phone: user.phone,
      grade: user.grade,
      vipLevel: user.vipLevel,
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        code: 401,
        message: '登录已过期，请重新登录',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        code: 401,
        message: '无效的登录凭证',
      });
    }
    next(error);
  }
};

// VIP权限验证
const requireVIP = (level = 'standard') => {
  return (req, res, next) => {
    const vipLevels = { free: 0, standard: 1, premium: 2 };
    const userLevel = vipLevels[req.user.vipLevel] || 0;
    const requiredLevel = vipLevels[level] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        code: 403,
        message: '请开通会员后使用该功能',
      });
    }

    next();
  };
};

module.exports = { authenticate, requireVIP };
