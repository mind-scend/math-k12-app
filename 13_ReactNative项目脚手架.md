# 数学K12拍照解题APP - React Native项目脚手架

> 文档版本：v1.0
> 创建时间：2026-04-28
> 说明：一键初始化脚本 + 完整项目结构 + 核心配置

---

## 一、快速开始

### 1.1 环境要求

```bash
# Node.js >= 18.0
node --version  # v18.x 或更高

# React Native CLI
npm install -g react-native-cli

# iOS开发（Mac）
xcodebuild -version  # >= 15.0

# Android开发
java -version        # >= JDK 17
echo $ANDROID_HOME   # Android SDK路径

# Watchman（文件监控，提升性能）
brew install watchman
```

### 1.2 一键初始化

```bash
#!/bin/bash
#===========================================
# 数学K12拍照解题APP - 一键初始化脚本
# 使用方法: bash init-project.sh
#===========================================

set -e

PROJECT_NAME="MathK12App"
PROJECT_DIR="./MathK12App"

echo "🚀 开始初始化 MathK12 拍照解题APP..."

# 1. 检查环境
echo "📋 检查开发环境..."
command -v node >/dev/null 2>&1 || { echo "❌ Node.js 未安装"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm 未安装"; exit 1; }

# 2. 创建React Native项目
echo "📦 创建React Native项目..."
npx @react-native-community/cli init $PROJECT_NAME --skip-install

cd $PROJECT_NAME

# 3. 安装核心依赖
echo "📥 安装核心依赖..."
npm install \
  @react-navigation/native@^7.0.0 \
  @react-navigation/bottom-tabs@^7.0.0 \
  @react-navigation/native-stack@^7.0.0 \
  react-native-screens \
  react-native-safe-area-context \
  react-native-gesture-handler \
  react-native-reanimated \
  axios \
  crypto-js \
  @react-native-async-storage/async-storage \
  react-native-vector-icons \
  react-native-image-picker \
  react-native-markdown-display

# 4. 安装开发依赖
echo "🔧 安装开发依赖..."
npm install -D \
  @types/react \
  @types/node \
  typescript \
  eslint \
  prettier

# 5. 创建项目结构
echo "📁 创建项目结构..."
mkdir -p src/{api,components,hooks,navigation,screens,store,types,utils,assets}
mkdir -p src/screens/{Home,Camera,SolveResult,WrongBook,PaperGenerate,Profile,Login}
mkdir -p src/components/{common,question,paper}
mkdir -p src/store/slices
mkdir -p src/api/services
mkdir -p src/utils/{request,storage,validator}

# 6. 创建配置文件
echo "⚙️ 创建配置文件..."

cat > src/config/index.ts << 'EOF'
// API配置
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://api.mathk12.com/api';

export const API_TIMEOUT = 30000;

// AI服务配置
export const AI_CONFIG = {
  OCR_PROVIDER: 'youdao', // youdao | baidu
  LLM_PROVIDER: 'deepseek', // deepseek | zhipu
};

// 缓存配置
export const CACHE_CONFIG = {
  TOKEN_KEY: '@MathK12:Token',
  USER_KEY: '@MathK12:User',
  QUESTION_CACHE_TTL: 7 * 24 * 60 * 60 * 1000, // 7天
};

// 分页配置
export const PAGE_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
};

// 错误码
export const ERROR_CODES = {
  NETWORK_ERROR: 'E001',
  AUTH_EXPIRED: 'E002',
  SERVER_ERROR: 'E003',
  PARAMS_ERROR: 'E004',
};
EOF

# 7. 创建TypeScript配置
cat > tsconfig.json << 'EOF'
{
  "extends": "@react-native/typescript-config/tsconfig.json",
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@screens/*": ["src/screens/*"],
      "@utils/*": ["src/utils/*"],
      "@api/*": ["src/api/*"],
      "@store/*": ["src/store/*"],
      "@types/*": ["src/types/*"]
    },
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*", "index.js", "App.tsx"],
  "exclude": ["node_modules"]
}
EOF

# 8. 创建API请求封装
cat > src/utils/request.ts << 'EOF'
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, API_TIMEOUT, CACHE_CONFIG } from '../config';
import { APIError } from '../types/error';

class Request {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const token = await AsyncStorage.getItem(CACHE_CONFIG.TOKEN_KEY);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError<APIError>) => {
        const { response } = error;
        if (response?.status === 401) {
          await AsyncStorage.removeItem(CACHE_CONFIG.TOKEN_KEY);
          // 触发登录过期跳转
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError<APIError>): APIError {
    if (error.code === 'ECONNABORTED') {
      return { code: 'E001', message: '请求超时，请检查网络' };
    }
    return {
      code: response?.data?.code || 'E003',
      message: response?.data?.message || '服务器错误',
    };
  }

  async get<T>(url: string, params?: object): Promise<T> {
    return this.instance.get(url, { params });
  }

  async post<T>(url: string, data?: object): Promise<T> {
    return this.instance.post(url, data);
  }

  async put<T>(url: string, data?: object): Promise<T> {
    return this.instance.put(url, data);
  }

  async delete<T>(url: string, params?: object): Promise<T> {
    return this.instance.delete(url, { params });
  }
}

export const request = new Request();
EOF

echo "✅ 初始化完成！"
echo ""
echo "📝 下一步操作："
echo "  1. cd $PROJECT_NAME"
echo "  2. npm install"
echo "  3. npx react-native start"
echo "  4. npx react-native run-ios # iOS"
echo "  5. npx react-native run-android # Android"
```

### 1.3 运行脚本

```bash
# 保存脚本并运行
curl -O https://raw.githubusercontent.com/your-repo/init-project.sh
chmod +x init-project.sh
./init-project.sh
```

---

## 二、项目结构

```
MathK12App/
├── src/
│   ├── api/                      # API服务层
│   │   ├── index.ts              # API统一导出
│   │   ├── services/
│   │   │   ├── auth.ts           # 登录注册
│   │   │   ├── question.ts       # 题目相关
│   │   │   ├── wrongbook.ts      # 错题本
│   │   │   ├── paper.ts          # 试卷生成
│   │   │   └── user.ts           # 用户信息
│   │   └── types/
│   │       └── api.d.ts          # API响应类型
│   │
│   ├── components/               # 组件库
│   │   ├── common/
│   │   │   ├── Button.tsx        # 按钮组件
│   │   │   ├── Input.tsx          # 输入框
│   │   │   ├── Loading.tsx        # 加载状态
│   │   │   ├── Empty.tsx          # 空状态
│   │   │   └── SafeArea.tsx       # 安全区域
│   │   ├── question/
│   │   │   ├── QuestionCard.tsx   # 题目卡片
│   │   │   ├── AnswerDisplay.tsx  # 答案展示
│   │   │   ├── SolutionSteps.tsx # 解题步骤
│   │   │   └── SimilarQuestions.tsx # 相似题推荐
│   │   └── paper/
│   │       ├── PaperPreview.tsx   # 试卷预览
│   │       ├── PaperItem.tsx      # 试卷题目
│   │       └── Timer.tsx           # 计时器
│   │
│   ├── navigation/               # 导航配置
│   │   ├── index.tsx             # 导航入口
│   │   ├── AuthNavigator.tsx     # 认证导航
│   │   ├── MainNavigator.tsx     # 主导航
│   │   └── types.ts              # 导航类型
│   │
│   ├── screens/                  # 页面
│   │   ├── Home/
│   │   │   └── HomeScreen.tsx    # 首页
│   │   ├── Camera/
│   │   │   └── CameraScreen.tsx  # 拍照解题
│   │   ├── SolveResult/
│   │   │   └── SolveResultScreen.tsx # 解题结果
│   │   ├── WrongBook/
│   │   │   └── WrongBookScreen.tsx  # 错题本
│   │   ├── PaperGenerate/
│   │   │   └── PaperGenerateScreen.tsx # AI组卷
│   │   ├── Profile/
│   │   │   └── ProfileScreen.tsx    # 个人中心
│   │   └── Login/
│   │       ├── LoginScreen.tsx      # 登录
│   │       └── RegisterScreen.tsx   # 注册
│   │
│   ├── store/                    # 状态管理
│   │   ├── index.ts              # store入口
│   │   └── slices/
│   │       ├── userSlice.ts      # 用户状态
│   │       ├── questionSlice.ts  # 题目状态
│   │       └── appSlice.ts       # 全局状态
│   │
│   ├── hooks/                    # 自定义Hooks
│   │   ├── useAuth.ts            # 认证Hook
│   │   ├── useQuestion.ts        # 题目Hook
│   │   ├── useWrongBook.ts       # 错题本Hook
│   │   └── useAI.ts              # AI功能Hook
│   │
│   ├── types/                   # TypeScript类型
│   │   ├── question.d.ts         # 题目类型
│   │   ├── user.d.ts            # 用户类型
│   │   ├── paper.d.ts           # 试卷类型
│   │   └── error.d.ts           # 错误类型
│   │
│   ├── utils/                   # 工具函数
│   │   ├── request.ts           # 请求封装
│   │   ├── storage.ts           # 本地存储
│   │   ├── validator.ts         # 表单验证
│   │   └── helpers.ts           # 辅助函数
│   │
│   ├── config/                  # 配置文件
│   │   └── index.ts             # 全局配置
│   │
│   └── assets/                  # 静态资源
│       ├── images/
│       └── icons/
│
├── index.js                      # 入口文件
├── App.tsx                       # 根组件
├── package.json
├── tsconfig.json
├── babel.config.js
├── metro.config.js
└── android/ & ios/              # 平台代码
```

---

## 三、核心文件代码

### 3.1 API服务层

```typescript
// src/api/index.ts - API统一导出
export * from './services/auth';
export * from './services/question';
export * from './services/wrongbook';
export * from './services/paper';
export * from './services/user';
```

```typescript
// src/api/services/question.ts - 题目服务
import { request } from '../../utils/request';
import { Question, SolveResult, SimilarQuestions } from '../../types/question';

// OCR识别 + 解答
export const solveQuestion = (params: {
  image_base64: string;
  grade?: number;
}) => {
  return request.post<SolveResult>('/question/solve', params);
};

// 获取题目详情
export const getQuestionDetail = (id: string) => {
  return request.get<Question>(`/question/${id}`);
};

// 获取相似题（举一反三）
export const getSimilarQuestions = (params: {
  question_id: string;
  count?: number;
}) => {
  return request.get<SimilarQuestions>('/question/similar', { params });
};

// 批量获取题目
export const getQuestions = (params: {
  page: number;
  limit: number;
  grade?: number;
  knowledge?: string;
  difficulty?: number;
}) => {
  return request.get<{ list: Question[]; total: number }>('/question/list', { params });
};
```

### 3.2 状态管理

```typescript
// src/store/index.ts - Redux Store
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';
import questionReducer from './slices/questionSlice';
import appReducer from './slices/appSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    question: questionReducer,
    app: appReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

```typescript
// src/store/slices/userSlice.ts - 用户状态
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { login, register, getUserInfo } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CACHE_CONFIG } from '../../config';

interface UserState {
  userInfo: User | null;
  token: string | null;
  isLoading: boolean;
  isVip: boolean;
  dailyFreeCount: number;
}

const initialState: UserState = {
  userInfo: null,
  token: null,
  isLoading: false,
  isVip: false,
  dailyFreeCount: 10,
};

export const loginAsync = createAsyncThunk(
  'user/login',
  async (params: { phone: string; code: string }) => {
    const res = await login(params);
    await AsyncStorage.setItem(CACHE_CONFIG.TOKEN_KEY, res.token);
    return res;
  }
);

export const getUserInfoAsync = createAsyncThunk('user/getInfo', async () => {
  return await getUserInfo();
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    logout: (state) => {
      state.userInfo = null;
      state.token = null;
      AsyncStorage.removeItem(CACHE_CONFIG.TOKEN_KEY);
    },
    decrementFreeCount: (state) => {
      if (state.dailyFreeCount > 0) {
        state.dailyFreeCount -= 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.userInfo = action.payload.user;
        state.isVip = action.payload.user.is_vip;
        state.dailyFreeCount = action.payload.user.daily_free_count;
      })
      .addCase(getUserInfoAsync.fulfilled, (state, action) => {
        state.userInfo = action.payload;
        state.isVip = action.payload.is_vip;
      });
  },
});

export const { setToken, logout, decrementFreeCount } = userSlice.actions;
export default userSlice.reducer;
```

### 3.3 导航配置

```typescript
// src/navigation/types.ts - 导航类型
import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  WrongBookTab: undefined;
  PaperTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  Camera: undefined;
  SolveResult: { questionId: string };
};
```

```typescript
// src/navigation/index.tsx - 导航入口
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { RootStackParamList, AuthStackParamList, MainTabParamList } from './types';
import { RootState } from '../store';

// Screens
import LoginScreen from '../screens/Login/LoginScreen';
import RegisterScreen from '../screens/Login/RegisterScreen';
import HomeScreen from '../screens/Home/HomeScreen';
import CameraScreen from '../screens/Camera/CameraScreen';
import SolveResultScreen from '../screens/SolveResult/SolveResultScreen';
import WrongBookScreen from '../screens/WrongBook/WrongBookScreen';
import PaperGenerateScreen from '../screens/PaperGenerate/PaperGenerateScreen';
import ProfileScreen from '../screens/Profile/ProfileScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen name="Home" component={HomeScreen} />
      <HomeStack.Screen name="Camera" component={CameraScreen} options={{ headerShown: false }} />
      <HomeStack.Screen name="SolveResult" component={SolveResultScreen} />
    </HomeStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          if (route.name === 'WrongBookTab') iconName = 'book';
          else if (route.name === 'PaperTab') iconName = 'description';
          else if (route.name === 'ProfileTab') iconName = 'person';
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeStackNavigator} options={{ title: '首页' }} />
      <Tab.Screen name="WrongBookTab" component={WrongBookScreen} options={{ title: '错题本' }} />
      <Tab.Screen name="PaperTab" component={PaperGenerateScreen} options={{ title: 'AI组卷' }} />
      <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: '我的' }} />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  const { token } = useSelector((state: RootState) => state.user);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {token ? (
          <RootStack.Screen name="Main" component={MainNavigator} />
        ) : (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
```

### 3.4 核心页面代码

```typescript
// src/screens/Home/HomeScreen.tsx - 首页
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from '../components/common/SafeArea';
import { HomeStackParamList } from '../navigation/types';
import { RootState } from '../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { userInfo, isVip, dailyFreeCount } = useSelector((state: RootState) => state.user);

  return (
    <SafeAreaView>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* 头部区域 */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>你好，{userInfo?.nickname || '同学'}</Text>
            <Text style={styles.grade}>年级：{userInfo?.grade || '未设置'}</Text>
          </View>
          {isVip ? (
            <View style={styles.vipBadge}>
              <Icon name="stars" size={16} color="#FFD700" />
              <Text style={styles.vipText}>会员</Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.vipButton}>
              <Text style={styles.vipButtonText}>开通会员</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 今日免费次数 */}
        <View style={styles.freeCountCard}>
          <View style={styles.freeCountInfo}>
            <Text style={styles.freeCountTitle}>今日免费解题</Text>
            <Text style={styles.freeCountNumber}>{dailyFreeCount}</Text>
            <Text style={styles.freeCountUnit}>次</Text>
          </View>
          {!isVip && (
            <TouchableOpacity style={styles.getMoreButton}>
              <Text style={styles.getMoreText}>获取更多次数 →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 拍照解题入口 */}
        <TouchableOpacity
          style={styles.cameraButton}
          onPress={() => navigation.navigate('Camera')}
          activeOpacity={0.8}
        >
          <View style={styles.cameraIconContainer}>
            <Icon name="camera-alt" size={48} color="#FFF" />
          </View>
          <View style={styles.cameraTextContainer}>
            <Text style={styles.cameraTitle}>拍照解题</Text>
            <Text style={styles.cameraSubtitle}>拍一拍，答案即刻呈现</Text>
          </View>
          <Icon name="chevron-right" size={32} color="#FFF" />
        </TouchableOpacity>

        {/* 功能入口 */}
        <View style={styles.featureGrid}>
          <TouchableOpacity
            style={styles.featureItem}
            onPress={() => {/* 跳错题本 */}}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#E3F2FD' }]}>
              <Icon name="book" size={28} color="#1976D2" />
            </View>
            <Text style={styles.featureText}>错题本</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureItem}
            onPress={() => {/* 跳AI组卷 */}}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#FFF3E0' }]}>
              <Icon name="description" size={28} color="#FF9800" />
            </View>
            <Text style={styles.featureText}>AI组卷</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureItem}
            onPress={() => {/* 跳练习 */}}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#E8F5E9' }]}>
              <Icon name="fitness-center" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.featureText}>专项练习</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.featureItem}
            onPress={() => {/* 跳排行榜 */}}
          >
            <View style={[styles.featureIcon, { backgroundColor: '#FCE4EC' }]}>
              <Icon name="leaderboard" size={28} color="#E91E63" />
            </View>
            <Text style={styles.featureText}>排行榜</Text>
          </TouchableOpacity>
        </View>

        {/* 学习数据 */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>本周学习数据</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>12</Text>
              <Text style={styles.statLabel}>解题数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8</Text>
              <Text style={styles.statLabel}>错题数</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>85%</Text>
              <Text style={styles.statLabel}>正确率</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  grade: { fontSize: 14, color: '#666', marginTop: 4 },
  vipBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  vipText: { color: '#FFD700', fontWeight: 'bold', marginLeft: 4 },
  vipButton: { backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
  vipButtonText: { color: '#FFF', fontWeight: 'bold' },
  freeCountCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, marginBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  freeCountInfo: { flexDirection: 'row', alignItems: 'baseline' },
  freeCountTitle: { fontSize: 14, color: '#666', marginRight: 8 },
  freeCountNumber: { fontSize: 36, fontWeight: 'bold', color: '#667eea' },
  freeCountUnit: { fontSize: 14, color: '#666', marginLeft: 4 },
  getMoreButton: { backgroundColor: '#F5F6FA', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  getMoreText: { color: '#667eea', fontWeight: '600' },
  cameraButton: { backgroundColor: '#667eea', borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cameraIconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  cameraTextContainer: { flex: 1, marginLeft: 16 },
  cameraTitle: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  cameraSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  featureItem: { width: '48%', backgroundColor: '#FFF', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  featureIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  featureText: { fontSize: 14, color: '#333', fontWeight: '500' },
  statsCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  statsTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 16 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#667eea' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
});
```

```typescript
// src/screens/Camera/CameraScreen.tsx - 拍照解题
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { launchCamera, launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { solveQuestion } from '../../api/question';
import { decrementFreeCount } from '../../store/slices/userSlice';
import { HomeStackParamList } from '../../navigation/types';
import { RootState } from '../../store';

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'Camera'>;

export default function CameraScreen() {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const { dailyFreeCount, isVip } = useSelector((state: RootState) => state.user);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSolving, setIsSolving] = useState(false);

  const handleTakePhoto = async () => {
    if (!isVip && dailyFreeCount <= 0) {
      Alert.alert('提示', '今日免费次数已用完，开通会员获得无限次数', [
        { text: '取消', style: 'cancel' },
        { text: '开通会员', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    const result: ImagePickerResponse = await launchCamera({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1080,
      maxHeight: 1920,
      includeBase64: true,
    });

    if (result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri!);
      setIsLoading(false);
    }
  };

  const handleSelectFromGallery = async () => {
    const result: ImagePickerResponse = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1080,
      maxHeight: 1920,
      includeBase64: true,
    });

    if (result.assets && result.assets[0]) {
      setImageUri(result.assets[0].uri!);
    }
  };

  const handleSolve = async () => {
    if (!imageUri) {
      Alert.alert('提示', '请先拍摄或选择题目图片');
      return;
    }

    setIsSolving(true);
    try {
      const base64 = imageUri.replace('data:image/jpeg;base64,', '');
      const res = await solveQuestion({ image_base64: base64 });

      if (!isVip) {
        dispatch(decrementFreeCount());
      }

      navigation.navigate('SolveResult', { questionId: res.question_id });
    } catch (error: any) {
      Alert.alert('解题失败', error.message || '请重试');
    } finally {
      setIsSolving(false);
    }
  };

  const handleClear = () => {
    setImageUri(null);
  };

  return (
    <View style={styles.container}>
      {/* 顶部导航 */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>拍照解题</Text>
        <View style={styles.placeholder} />
      </SafeAreaView>

      {/* 预览区域 */}
      <View style={styles.previewContainer}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
        ) : (
          <View style={styles.placeholderContainer}>
            <Icon name="add-a-photo" size={80} color="#CCC" />
            <Text style={styles.placeholderText}>拍摄或选择题目图片</Text>
          </View>
        )}
      </View>

      {/* 操作按钮 */}
      <View style={styles.buttonContainer}>
        {imageUri ? (
          <>
            <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
              <Icon name="delete" size={24} color="#FF5252" />
              <Text style={styles.clearButtonText}>清除</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.solveButton} onPress={handleSolve} disabled={isSolving}>
              {isSolving ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Icon name="search" size={24} color="#FFF" />
                  <Text style={styles.solveButtonText}>开始解题</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.galleryButton} onPress={handleSelectFromGallery}>
              <Icon name="photo-library" size={24} color="#667eea" />
              <Text style={styles.galleryButtonText}>相册</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureButton} onPress={handleTakePhoto}>
              <View style={styles.captureButtonInner}>
                <Icon name="camera-alt" size={32} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </>
        )}
      </View>

      {/* 提示 */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>拍照技巧</Text>
        <Text style={styles.tipsText}>• 确保光线充足，画面清晰</Text>
        <Text style={styles.tipsText}>• 尽量让题目充满画面</Text>
        <Text style={styles.tipsText}>• 避免拍摄到手指或其他遮挡</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A1A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  backButton: { padding: 8 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  placeholder: { width: 40 },
  previewContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', margin: 16 },
  previewImage: { width: '100%', height: '100%', borderRadius: 16 },
  placeholderContainer: { alignItems: 'center' },
  placeholderText: { color: '#666', marginTop: 16, fontSize: 16 },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 30, paddingHorizontal: 20 },
  galleryButton: { alignItems: 'center' },
  galleryButtonText: { color: '#667eea', marginTop: 4, fontSize: 12 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#667eea' },
  captureButtonInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#667eea', justifyContent: 'center', alignItems: 'center' },
  clearButton: { alignItems: 'center' },
  clearButtonText: { color: '#FF5252', marginTop: 4, fontSize: 12 },
  solveButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#667eea', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 30 },
  solveButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  tipsContainer: { backgroundColor: '#2A2A2A', margin: 16, padding: 16, borderRadius: 12 },
  tipsTitle: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  tipsText: { color: '#999', fontSize: 12, marginBottom: 4 },
});
```

---

## 四、依赖清单

```json
{
  "dependencies": {
    "@react-native-async-storage/async-storage": "^2.0.0",
    "@react-navigation/bottom-tabs": "^7.0.0",
    "@react-navigation/native": "^7.0.0",
    "@react-navigation/native-stack": "^7.0.0",
    "@reduxjs/toolkit": "^2.0.0",
    "axios": "^1.6.0",
    "react": "^18.2.0",
    "react-native": "0.75.0",
    "react-native-gesture-handler": "^2.18.0",
    "react-native-image-picker": "^7.1.0",
    "react-native-reanimated": "^3.15.0",
    "react-native-safe-area-context": "^4.10.0",
    "react-native-screens": "^4.0.0",
    "react-native-vector-icons": "^10.0.0",
    "react-redux": "^9.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 五、常见问题

### Q1: iOS真机调试白屏？
```bash
# 清除缓存并重新安装
cd ios && rm -rf Pods && pod install && cd ..
npx react-native start --reset-cache
```

### Q2: Android打包失败？
```bash
# 检查JAVA_HOME
echo $JAVA_HOME

# 重新构建
cd android && ./gradlew clean && ./gradlew assembleRelease
```

### Q3: Metro无法连接？
```bash
# 重启Metro
npx react-native start --reset-cache

# 检查端口占用
lsof -i :8081
```

---

**下一步：**
1. 运行 `npm install`
2. 配置 `.env` 文件（API地址等）
3. 启动 `npx react-native start`
4. 运行 `npx react-native run-ios` 或 `run-android`
