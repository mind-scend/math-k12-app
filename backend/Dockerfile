# ===============================================
# 后端 Dockerfile - 数学K12 APP
# ===============================================

FROM node:18-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# ===============================================
# 生产镜像
# ===============================================
FROM node:18-alpine

WORKDIR /app

# 安全配置
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制依赖
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# 复制源代码
COPY --chown=nodejs:nodejs . .

# 切换用户
USER nodejs

# 环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# 启动命令
EXPOSE 3000
CMD ["node", "src/server.js"]
