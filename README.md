# 智数学 - AI数学拍照解题APP

> 基于React Native + Express的K12数学学习平台

## 🎯 项目简介

智数学是一款面向K12学生的AI数学学习应用，支持拍照搜题、智能解题、错题本管理和AI智能组卷。

## ✨ 核心功能

| 功能 | 描述 |
|------|------|
| 📷 拍照搜题 | 一键拍照，AI智能识别题目并返回解题步骤 |
| 📚 错题本 | 自动收录错题，分类管理，定期复习提醒 |
| 🎯 AI组卷 | 根据知识点和难度智能生成练习试卷 |
| 📊 学习报告 | 可视化学习数据，追踪学习进度 |

## 🛠️ 技术栈

### 前端
- React Native 0.76 (Expo)
- TypeScript
- Redux Toolkit
- React Navigation
- Lottie动画

### 后端
- Node.js + Express
- MySQL 8.0
- Redis
- DeepSeek API (LLM)
- 百度OCR

## 📁 项目结构

```
├── frontend/          # React Native前端
│   ├── src/
│   │   ├── screens/   # 页面组件
│   │   ├── components/# 公共组件
│   │   ├── services/  # API服务
│   │   ├── store/     # Redux状态
│   │   └── navigation/# 路由配置
│   └── package.json
│
├── backend/           # Express后端
│   ├── src/
│   │   ├── routes/    # 路由
│   │   ├── controllers/# 控制器
│   │   ├── services/  # 业务逻辑
│   │   ├── models/    # 数据模型
│   │   └── middleware/# 中间件
│   ├── migrations/    # 数据库迁移
│   └── package.json
│
├── deploy/            # 部署配置
│   ├── docker-compose.yml
│   └── nginx/
│
└── docs/              # 产品文档
```

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- MySQL 8.0
- Redis 6.0
- Docker (可选)

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd math-k12-app
```

### 2. 配置后端

```bash
cd backend

# 复制环境变量配置
cp .env.example .env

# 编辑 .env 填入以下配置：
# - 数据库连接信息
# - Redis连接信息
# - DeepSeek API Key
# - 百度OCR API Key
# - JWT密钥

# 安装依赖
npm install

# 初始化数据库
npm run migrate

# 启动开发服务器
npm run dev
```

### 3. 配置前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm start
```

### 4. Docker部署

```bash
# 一键启动所有服务
docker-compose up -d
```

## 🔑 环境变量

### 后端 (.env)

| 变量名 | 描述 | 示例 |
|--------|------|------|
| PORT | 服务端口 | 3000 |
| NODE_ENV | 运行环境 | development |
| DB_HOST | 数据库主机 | localhost |
| DB_PORT | 数据库端口 | 3306 |
| DB_USER | 数据库用户 | root |
| DB_PASSWORD | 数据库密码 | - |
| DB_NAME | 数据库名 | math_k12 |
| REDIS_URL | Redis连接地址 | redis://localhost:6379 |
| JWT_SECRET | JWT密钥 | your-secret-key |
| DEEPSEEK_API_KEY | DeepSeek API | sk-xxx |
| BAIDU_OCR_APP_ID | 百度OCR AppID | - |
| BAIDU_OCR_API_KEY | 百度OCR API Key | - |
| BAIDU_OCR_SECRET_KEY | 百度OCR Secret | - |

## 📱 编译构建

### Android

```bash
cd frontend
npm run build:android
```

### iOS

```bash
cd frontend
npm run ios
```

## 🧪 测试

```bash
# 后端测试
cd backend
npm test

# 前端测试
cd frontend
npm test
```

## 📄 API文档

### 认证模块

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/refresh | 刷新Token |
| GET | /api/auth/profile | 获取用户信息 |

### 题目模块

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/questions/ocr | OCR识别 |
| POST | /api/questions/solve | 智能解题 |
| GET | /api/questions/history | 解题历史 |
| POST | /api/questions/wrong | 添加错题 |
| GET | /api/questions/wrong-book | 错题本 |

### 组卷模块

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/paper/generate | AI生成试卷 |
| GET | /api/paper/list | 试卷列表 |
| GET | /api/paper/:id | 试卷详情 |

## 📊 数据库表

- `users` - 用户表
- `questions` - 题目表
- `solve_records` - 解题记录表
- `wrong_questions` - 错题表
- `papers` - 试卷表
- `paper_questions` - 试卷题目关联表

## 🔒 安全

- JWT Token认证
- 密码bcrypt加密
- 请求频率限制
- CORS跨域配置

## 📝 License

MIT License
