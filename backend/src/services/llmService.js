/**
 * LLM服务 - AI解题
 */

const axios = require('axios');
const logger = require('../utils/logger');

// DeepSeek配置
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_BASE_URL = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com';
const DEEPSEEK_MODEL = 'deepseek-chat';

// 解题Prompt模板
const SOLVE_QUESTION_PROMPT = `你是位经验丰富的数学老师，擅长用清晰易懂的方式讲解数学题目。

请解答以下数学题，并提供详细的解题步骤和知识点分析。

题目：{question}

年级：{grade}

请以JSON格式返回，字段如下：
{
  "answer": "正确答案",
  "explanation": "详细解析",
  "steps": [
    {"step": 1, "description": "步骤描述"},
    {"step": 2, "description": "步骤描述"}
  ],
  "knowledgePoints": ["知识点1", "知识点2"],
  "difficulty": "easy/medium/hard"
}`;

// 举一反三Prompt模板
const SIMILAR_QUESTION_PROMPT = `你是位经验丰富的数学老师，擅长出一题多变。

基于以下原题，请生成{count}道相似但有变化的练习题。

原题：{originalQuestion}
知识点：{knowledgePoints}
年级：{grade}

请以JSON格式返回：
{
  "questions": [
    {
      "questionText": "题目描述",
      "options": ["A选项", "B选项", "C选项", "D选项"],
      "answer": "正确答案",
      "hint": "解题提示"
    }
  ]
}`;

/**
 * 调用DeepSeek API
 */
async function callDeepSeek(messages, temperature = 0.7) {
  try {
    const response = await axios.post(
      `${DEEPSEEK_BASE_URL}/chat/completions`,
      {
        model: DEEPSEEK_MODEL,
        messages,
        temperature,
        max_tokens: 2000,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        timeout: 30000,
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    logger.error('DeepSeek API调用失败:', error.message);
    throw new Error('AI服务暂时不可用，请稍后重试');
  }
}

/**
 * 解决数学题
 */
exports.solveQuestion = async ({ questionText, grade }) => {
  try {
    const prompt = SOLVE_QUESTION_PROMPT
      .replace('{question}', questionText)
      .replace('{grade}', grade);

    const messages = [
      { role: 'system', content: '你是一位专业的数学老师，请用JSON格式回答。' },
      { role: 'user', content: prompt },
    ];

    const response = await callDeepSeek(messages);

    // 解析JSON响应
    let result;
    try {
      // 尝试提取JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('无法解析AI响应');
      }
    } catch (parseError) {
      logger.warn('JSON解析失败，使用备用方案:', response);
      // 备用方案：返回基本结构
      result = {
        answer: '解析中...',
        explanation: response,
        steps: [{ step: 1, description: '详见上方解析' }],
        knowledgePoints: ['数学'],
        difficulty: 'medium',
      };
    }

    return result;
  } catch (error) {
    logger.error('解题失败:', error);
    throw error;
  }
};

/**
 * 生成相似题目（举一反三）
 */
exports.generateSimilarQuestions = async ({ originalQuestion, knowledgePoints, count, grade }) => {
  try {
    const prompt = SIMILAR_QUESTION_PROMPT
      .replace('{originalQuestion}', originalQuestion)
      .replace('{knowledgePoints}', knowledgePoints.join(', '))
      .replace('{count}', count.toString())
      .replace('{grade}', grade);

    const messages = [
      { role: 'system', content: '你是一位专业的数学老师，请用JSON格式回答。' },
      { role: 'user', content: prompt },
    ];

    const response = await callDeepSeek(messages, 0.8);

    // 解析JSON响应
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result.questions || [];
    }

    return [];
  } catch (error) {
    logger.error('生成相似题目失败:', error);
    return [];
  }
};

/**
 * AI智能组卷
 */
exports.generatePaper = async ({ topic, difficulty, questionCount, grade }) => {
  try {
    const prompt = `你是位经验丰富的数学老师。

请为${grade}学生生成一套关于"${topic}"的练习卷。

要求：
- 共${questionCount}道题
- 难度：${difficulty === 'easy' ? '简单' : difficulty === 'medium' ? '中等' : '困难'}
- 题型包括选择题、填空题和解答题
- 题目不能重复，考察角度要多样化

请以JSON格式返回：
{
  "title": "练习卷标题",
  "questions": [
    {
      "type": "choice/fill/解答",
      "questionText": "题目内容",
      "options": ["A选项", "B选项", "C选项", "D选项"],
      "answer": "正确答案",
      "analysis": "题目分析"
    }
  ]
}`;

    const messages = [
      { role: 'system', content: '你是一位专业的数学老师，请用JSON格式回答。' },
      { role: 'user', content: prompt },
    ];

    const response = await callDeepSeek(messages, 0.7);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('生成试卷失败');
  } catch (error) {
    logger.error('AI组卷失败:', error);
    throw error;
  }
};
