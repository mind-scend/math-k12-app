/**
 * 错题模型
 */

const mongoose = require('mongoose');

const wrongQuestionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    userAnswer: {
      type: String,
    },
    knowledgePoints: [
      {
        type: String,
      },
    ],
    wrongCount: {
      type: Number,
      default: 1,
    },
    lastWrongTime: {
      type: Date,
      default: Date.now,
    },
    mastered: {
      type: Boolean,
      default: false,
    },
    masteredTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// 索引
wrongQuestionSchema.index({ userId: 1, mastered: 1 });
wrongQuestionSchema.index({ userId: 1, lastWrongTime: -1 });

const WrongQuestion = mongoose.model('WrongQuestion', wrongQuestionSchema);

module.exports = { WrongQuestion };
