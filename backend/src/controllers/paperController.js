/**
 * 试卷控制器
 */
const Paper = require('../models/Paper');
const llmService = require('../services/llmService');

/**
 * 获取试卷列表
 */
exports.getPaperList = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    const papers = await Paper.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Paper.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        papers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 获取试卷详情
 */
exports.getPaperDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const paper = await Paper.findOne({ _id: id, userId }).populate('questions');

    if (!paper) {
      return res.status(404).json({ success: false, message: '试卷不存在' });
    }

    res.json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
};

/**
 * AI生成试卷
 */
exports.generatePaper = async (req, res, next) => {
  try {
    const { grade, subject, knowledgePoints, difficulty, questionCount, title } = req.body;
    const userId = req.user.id;

    // 调用LLM服务生成试卷
    const prompt = `
请为以下条件生成一套数学试卷：
- 年级：${grade}
- 科目：${subject}
- 知识点：${knowledgePoints.join('、')}
- 难度：${difficulty}
- 题量：${questionCount}道
- 标题：${title || '智能组卷'}

请按照以下JSON格式返回（只返回JSON，不要其他内容）：
{
  "title": "试卷标题",
  "questions": [
    {
      "type": "single/multiple/fill/subjective",
      "content": "题目内容",
      "options": ["A选项", "B选项", "C选项", "D选项"], // 选择题需要
      "answer": "答案",
      "analysis": "解题思路",
      "score": 分值
    }
  ]
}
    `;

    const result = await llmService.generateContent(prompt);

    if (!result.success) {
      return res.status(500).json({ success: false, message: '生成失败' });
    }

    res.json({
      success: true,
      data: {
        title: result.data.title,
        questions: result.data.questions,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 保存试卷
 */
exports.savePaper = async (req, res, next) => {
  try {
    const { title, questions, grade, subject, difficulty } = req.body;
    const userId = req.user.id;

    const paper = new Paper({
      userId,
      title,
      questions,
      grade,
      subject,
      difficulty,
    });

    await paper.save();

    res.json({ success: true, data: paper });
  } catch (error) {
    next(error);
  }
};

/**
 * 删除试卷
 */
exports.deletePaper = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const paper = await Paper.findOneAndDelete({ _id: id, userId });

    if (!paper) {
      return res.status(404).json({ success: false, message: '试卷不存在' });
    }

    res.json({ success: true, message: '删除成功' });
  } catch (error) {
    next(error);
  }
};
