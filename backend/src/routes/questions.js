/**
 * 题目路由 - 拍照解题
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const questionController = require('../controllers/questionController');
const { authenticate } = require('../middleware/auth');

// 配置上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只能上传图片文件'));
    }
  },
});

// 拍照解题
router.post(
  '/solve',
  authenticate,
  upload.single('image'),
  questionController.solve
);

// 获取解题结果
router.get('/:id', authenticate, questionController.getQuestion);

// 获取举一反三
router.get('/:id/similar', authenticate, questionController.getSimilarQuestions);

// 提交答案
router.post('/:id/answer', authenticate, questionController.submitAnswer);

// 获取用户历史题目
router.get('/', authenticate, questionController.getUserQuestions);

module.exports = router;
