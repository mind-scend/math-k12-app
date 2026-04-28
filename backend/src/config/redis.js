/**
 * Redis配置
 */

const Redis = require('ioredis');

let redisClient = null;

/**
 * 连接Redis
 */
async function connectRedis() {
  if (redisClient) return redisClient;

  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: (times) => {
      if (times > 3) {
        console.error('Redis连接失败');
        return null;
      }
      return Math.min(times * 100, 3000);
    },
    maxRetriesPerRequest: 3,
  });

  redisClient.on('connect', () => {
    console.log('✅ Redis已连接');
  });

  redisClient.on('error', (err) => {
    console.error('Redis错误:', err.message);
  });

  // 等待连接
  await new Promise((resolve, reject) => {
    redisClient.once('ready', resolve);
    redisClient.once('error', reject);
  });

  return redisClient;
}

/**
 * 获取Redis客户端
 */
function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis未连接');
  }
  return redisClient;
}

/**
 * 关闭Redis连接
 */
async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

// 扩展Redis客户端，添加常用方法
if (redisClient) {
  redisClient.get = async (key) => {
    const client = getRedisClient();
    const value = await client.get(key);
    return value;
  };

  redisClient.setex = async (key, seconds, value) => {
    const client = getRedisClient();
    await client.setex(key, seconds, value);
  };
}

module.exports = {
  connectRedis,
  getRedisClient,
  closeRedis,
  redisClient: {
    get: async (key) => {
      if (!redisClient) return null;
      return redisClient.get(key);
    },
    setex: async (key, seconds, value) => {
      if (!redisClient) return;
      await redisClient.setex(key, seconds, value);
    },
    del: async (key) => {
      if (!redisClient) return;
      await redisClient.del(key);
    },
  },
};
