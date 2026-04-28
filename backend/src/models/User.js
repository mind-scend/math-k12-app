/**
 * 用户模型
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    nickname: {
      type: String,
      required: true,
      maxlength: 20,
    },
    avatar: {
      type: String,
      default: '',
    },
    grade: {
      type: String,
      enum: ['初一', '初二', '初三', '高一', '高二', '高三'],
      default: '初一',
    },
    vipLevel: {
      type: String,
      enum: ['free', 'standard', 'premium'],
      default: 'free',
    },
    vipExpireTime: {
      type: Date,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    totalCorrect: {
      type: Number,
      default: 0,
    },
    streakDays: {
      type: Number,
      default: 0,
    },
    lastLoginAt: {
      type: Date,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    wechatOpenid: {
      type: String,
      sparse: true,
    },
    settings: {
      pushEnabled: { type: Boolean, default: true },
      soundEnabled: { type: Boolean, default: true },
      reminderTime: { type: String, default: '19:00' },
    },
  },
  {
    timestamps: true,
  }
);

// 索引
userSchema.index({ phone: 1 });
userSchema.index({ vipLevel: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = { User };
