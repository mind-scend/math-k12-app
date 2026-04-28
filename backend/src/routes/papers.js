/**
 * 试卷路由
 * AI组卷相关接口
 */
const express = require('express');
const router = express.Router();
const paperController = require('../controllers/paperController');
const authMiddleware = require('../middleware/auth');

// 获取试卷列表
router.get('/list', authMiddleware, paperController.getPaperList);

// 获取试卷详情
router.get('/:id', authMiddleware, paperController.getPaperDetail);

// AI生成试卷
router.post('/generate', authMiddleware, paperController.generatePaper);

// 保存试卷
router.post('/', authMiddleware, paperController.savePaper);

// 删除试卷
router.delete('/:id', authMiddleware, paperController.deletePaper);

module.exports = router;
