# ===============================================
# React Native APP Dockerfile (Android APK构建)
# ===============================================

FROM node:18-alpine AS builder

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci

# 复制源代码
COPY . .

# 构建Web版本（用于Web容器部署）
RUN npm run web:build || echo "Web build skipped"

# ===============================================
# Nginx 服务
# ===============================================
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制Nginx配置
COPY deploy/nginx/app.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
