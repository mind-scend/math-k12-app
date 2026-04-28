/**
 * 题目模型
 */

const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionImage: {
      type: String,
    },
    questionText: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    knowledgePoints: [
      {
        type: String,
      },
    ],
    steps: [
      {
        step: String,
        description: String,
      },
    ],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'solved', 'reviewed'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// 索引
questionSchema.index({ userId: 1, createdAt: -1 });
questionSchema.index({ knowledgePoints: 1 });
questionSchema.index({ difficulty: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = { Question };
