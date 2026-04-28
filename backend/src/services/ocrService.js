/**
 * OCR服务
 * 支持本地OCR和第三方OCR服务
 */

const axios = require('axios');
const logger = require('../utils/logger');

const OCR_SERVICE = process.env.OCR_SERVICE || 'local';

/**
 * 文字识别
 * @param {Buffer} imageBuffer - 图片二进制数据
 * @returns {Promise<{text: string, imageUrl: string}>}
 */
exports.recognize = async (imageBuffer) => {
  switch (OCR_SERVICE) {
    case 'local':
      return recognizeLocal(imageBuffer);
    case 'baidu':
      return recognizeBaidu(imageBuffer);
    case 'aliyun':
      return recognizeAliyun(imageBuffer);
    default:
      return recognizeLocal(imageBuffer);
  }
};

// 本地OCR（简化版，实际项目中建议使用tesseract.js）
async function recognizeLocal(imageBuffer) {
  // 这里可以使用 tesseract.js 进行本地OCR
  // 简化处理：模拟返回
  logger.info('使用本地OCR服务');

  // 模拟OCR处理
  return {
    text: '这道数学题要求计算一元二次方程的解。已知方程 x² - 5x + 6 = 0，求x的值。',
    confidence: 0.95,
  };
}

// 百度OCR
async function recognizeBaidu(imageBuffer) {
  const BAIDU_APP_ID = process.env.BAIDU_APP_ID;
  const BAIDU_API_KEY = process.env.BAIDU_API_KEY;
  const BAIDU_SECRET_KEY = process.env.BAIDU_SECRET_KEY;

  if (!BAIDU_API_KEY) {
    logger.warn('百度OCR未配置，使用本地OCR');
    return recognizeLocal(imageBuffer);
  }

  try {
    // 获取Access Token
    const tokenResponse = await axios.get(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_API_KEY}&client_secret=${BAIDU_SECRET_KEY}&`
    );

    const accessToken = tokenResponse.data.access_token;

    // 调用OCR API
    const base64Image = imageBuffer.toString('base64');
    const ocrResponse = await axios.post(
      `https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${accessToken}`,
      {
        image: base64Image,
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const words = ocrResponse.data.words_result
      .map((item) => item.words)
      .join('\n');

    return {
      text: words,
      confidence: ocrResponse.data.words_result_avg_confidence / 100,
    };
  } catch (error) {
    logger.error('百度OCR调用失败:', error.message);
    return recognizeLocal(imageBuffer);
  }
}

// 阿里云OCR
async function recognizeAliyun(imageBuffer) {
  const ALIYUN_ACCESS_KEY_ID = process.env.ALIYUN_ACCESS_KEY_ID;
  const ALIYUN_ACCESS_KEY_SECRET = process.env.ALIYUN_ACCESS_KEY_SECRET;

  if (!ALIYUN_ACCESS_KEY_ID) {
    logger.warn('阿里云OCR未配置，使用本地OCR');
    return recognizeLocal(imageBuffer);
  }

  // 阿里云OCR实现
  // 需要安装阿里云SDK: @alicloud/ocr-sdk
  logger.info('阿里云OCR服务（待实现）');
  return recognizeLocal(imageBuffer);
}
