/**
 * 智数学 - React Native 核心页面代码原型
 *
 * 项目结构：
 * src/
 * ├── components/     # 通用组件
 * ├── pages/         # 页面组件
 * ├── services/      # API服务
 * ├── stores/        # 状态管理
 * ├── utils/         # 工具函数
 * └── types/         # TypeScript类型定义
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  FlatList,
  Animated,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import axios from 'axios';

// ============================================
// 类型定义
// ============================================

interface Question {
  id: string;
  content: string;
  answer: string;
  solution_steps: string[];
  knowledge_points: string[];
  difficulty: number;
  similar_questions?: SimilarQuestion[];
  ai_tips?: string;
}

interface SimilarQuestion {
  id: string;
  content: string;
  answer: string;
  difficulty: number;
}

interface WrongQuestion {
  id: string;
  question_snapshot: {
    content: string;
    answer: string;
    knowledge_points: string[];
    difficulty: number;
  };
  mastery_level: number;
  review_count: number;
  next_review_at: string;
  error_type: string;
  created_at: string;
}

interface Paper {
  id: string;
  title: string;
  total_score: number;
  duration: number;
  status: 'pending' | 'active' | 'completed';
  created_at: string;
}

// ============================================
// 主题配置
// ============================================

const COLORS = {
  primary: '#4A90E2',
  success: '#52C41A',
  warning: '#FAAD14',
  error: '#FF4D4F',
  text: '#333333',
  textSecondary: '#666666',
  textLight: '#999999',
  background: '#F5F5F5',
  white: '#FFFFFF',
  border: '#E8E8E8',
};

const TYPOGRAPHY = {
  title: { fontSize: 20, fontWeight: 'bold' as const },
  heading: { fontSize: 17, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: 'normal' as const },
  caption: { fontSize: 13, fontWeight: 'normal' as const },
  small: { fontSize: 12, fontWeight: 'normal' as const },
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

// ============================================
// API 服务配置
// ============================================

const API_BASE_URL = 'https://api.mathapp.com/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// 添加请求拦截器
api.interceptors.request.use(
  (config) => {
    // 从本地存储获取token
    const token = ''; // TODO: 从storage获取
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// 通用组件
// ============================================

// Card 卡片组件
const Card: React.FC<{ children: React.ReactNode; style?: object }> = ({
  children,
  style,
}) => (
  <View style={[styles.card, style]}>{children}</View>
);

// Button 按钮组件
const Button: React.FC<{
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'large' | 'medium' | 'small';
  disabled?: boolean;
  loading?: boolean;
}> = ({ title, onPress, variant = 'primary', size = 'medium', disabled, loading }) => {
  const buttonStyles = [
    styles.button,
    styles[`button_${variant}`],
    styles[`button_${size}`],
    disabled && styles.button_disabled,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`]]}>
        {loading ? '加载中...' : title}
      </Text>
    </TouchableOpacity>
  );
};

// Tag 标签组件
const Tag: React.FC<{ label: string; color?: string; size?: 'small' | 'medium' }> = ({
  label,
  color = COLORS.primary,
  size = 'small',
}) => (
  <View style={[styles.tag, { backgroundColor: color + '20' }, size === 'small' && styles.tag_small]}>
    <Text style={[styles.tagText, { color }, size === 'small' && styles.tagText_small]}>
      {label}
    </Text>
  </View>
);

// Loading 加载组件
const Loading: React.FC<{ tip?: string }> = ({ tip = '加载中...' }) => (
  <View style={styles.loading}>
    <Text style={styles.loadingText}>{tip}</Text>
  </View>
);

// ============================================
// 页面组件
// ============================================

// ---------------------------------------------------------
// 1. 首页 (HomeScreen)
// ---------------------------------------------------------

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [userStats, setUserStats] = useState({
    streakDays: 12,
    wrongCount: 32,
    masteryRate: 75,
  });

  const quickActions = [
    { id: '1', icon: '📸', title: '拍照解题', subtitle: '一拍就会', route: 'Camera' },
    { id: '2', icon: '📚', title: '错题本', subtitle: `${userStats.wrongCount}题待复习`, route: 'WrongBook' },
    { id: '3', icon: '📝', title: 'AI组卷', subtitle: '智能生成', route: 'PaperGenerate' },
    { id: '4', icon: '📊', title: '学情分析', subtitle: '了解自己', route: 'Analytics' },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息区域 */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>😀</Text>
          </View>
          <View>
            <Text style={styles.greeting}>亲爱的同学，欢迎回来</Text>
            <Text style={styles.streak}>
              📅 连续学习 {userStats.streakDays} 天
            </Text>
          </View>
        </View>
      </View>

      {/* 核心拍照入口 */}
      <TouchableOpacity
        style={styles.mainEntry}
        onPress={() => navigation.navigate('Camera')}
        activeOpacity={0.8}
      >
        <Text style={styles.mainEntryIcon}>📸</Text>
        <Text style={styles.mainEntryTitle}>拍照解题</Text>
        <Text style={styles.mainEntrySubtitle}>一键拍照，秒出答案</Text>
      </TouchableOpacity>

      {/* 快捷功能入口 */}
      <View style={styles.quickActions}>
        {quickActions.slice(1).map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.quickAction}
            onPress={() => navigation.navigate(item.route)}
          >
            <Text style={styles.quickActionIcon}>{item.icon}</Text>
            <Text style={styles.quickActionTitle}>{item.title}</Text>
            <Text style={styles.quickActionSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 学情概览 */}
      <Card style={styles.statsCard}>
        <Text style={styles.sectionTitle}>📊 学情概览</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.masteryRate}%</Text>
            <Text style={styles.statLabel}>整体掌握</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.wrongCount}</Text>
            <Text style={styles.statLabel}>待复习</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>87%</Text>
            <Text style={styles.statLabel}>本周正确率</Text>
          </View>
        </View>
      </Card>

      {/* 底部导航栏占位 */}
      <View style={{ height: 80 }} />
    </ScrollView>
  );
};

// ---------------------------------------------------------
// 2. 拍照解题页面 (CameraScreen)
// ---------------------------------------------------------

export const CameraScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 拍照
  const handleTakePhoto = async () => {
    try {
      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.8,
        saveToPhotos: false,
      });

      if (result.assets && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
        setError(null);
      }
    } catch (err) {
      Alert.alert('错误', '无法打开相机，请检查权限设置');
    }
  };

  // 从相册选择
  const handlePickImage = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (result.assets && result.assets[0]?.uri) {
        setImageUri(result.assets[0].uri);
        setError(null);
      }
    } catch (err) {
      Alert.alert('错误', '无法读取相册');
    }
  };

  // 提交识别
  const handleSubmit = async () => {
    if (!imageUri) {
      Alert.alert('提示', '请先拍摄或选择图片');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // TODO: 调用API
      // const formData = new FormData();
      // formData.append('image', { uri: imageUri, type: 'image/jpeg', name: 'photo.jpg' });
      // const response = await api.post('/solve/capture', formData, {
      //   headers: { 'Content-Type': 'multipart/form-data' },
      // });

      // 模拟数据
      setTimeout(() => {
        const mockQuestion: Question = {
          id: 'q001',
          content: '已知二次函数 y=ax²+bx+c 的图像开口向下，且经过点(1,0)和(2,1)，求a的取值范围。',
          answer: 'a < -1',
          solution_steps: [
            '由开口向下得 a < 0',
            '将(1,0)代入：0 = a + b + c ...(1)',
            '将(2,1)代入：1 = 4a + 2b + c ...(2)',
            '(2)-(1)得：1 = 3a + b',
            '联立求解得 a < -1',
          ],
          knowledge_points: ['二次函数', '判别式', '图像与系数'],
          difficulty: 3,
          ai_tips: '本题易错点：需要同时考虑开口方向和与x轴交点条件',
          similar_questions: [
            { id: 's1', content: '变式题1...', answer: 'a > 0', difficulty: 2 },
            { id: 's2', content: '变式题2...', answer: 'a = 1', difficulty: 3 },
          ],
        };

        setQuestion(mockQuestion);
        setIsProcessing(false);
        navigation.navigate('SolveResult', { question: mockQuestion });
      }, 2000);
    } catch (err) {
      setIsProcessing(false);
      setError('识别失败，请重试');
    }
  };

  // 重新拍照
  const handleReset = () => {
    setImageUri(null);
    setQuestion(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      {/* 相机预览/图片显示区域 */}
      <View style={styles.cameraArea}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>对准题目拍摄</Text>
            <Text style={styles.placeholderHint}>确保光线充足，题目清晰</Text>
          </View>
        )}
      </View>

      {/* 拍照引导框 */}
      {!imageUri && (
        <View style={styles.guideFrame}>
          <View style={[styles.guideCorner, styles.guideCorner_tl]} />
          <View style={[styles.guideCorner, styles.guideCorner_tr]} />
          <View style={[styles.guideCorner, styles.guideCorner_bl]} />
          <View style={[styles.guideCorner, styles.guideCorner_br]} />
        </View>
      )}

      {/* 底部操作区 */}
      <View style={styles.bottomActions}>
        {imageUri ? (
          <>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <View style={styles.actionRow}>
              <Button
                title="重新拍摄"
                onPress={handleReset}
                variant="outline"
                size="medium"
              />
              <View style={{ width: SPACING.lg }} />
              <Button
                title="识别题目"
                onPress={handleSubmit}
                variant="primary"
                size="medium"
                loading={isProcessing}
              />
            </View>
          </>
        ) : (
          <View style={styles.captureActions}>
            <TouchableOpacity style={styles.captureButton} onPress={handlePickImage}>
              <Text style={styles.captureButtonIcon}>🖼️</Text>
              <Text style={styles.captureButtonText}>相册</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mainCaptureButton} onPress={handleTakePhoto}>
              <View style={styles.mainCaptureInner} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.captureButton}>
              <Text style={styles.captureButtonIcon}>📃</Text>
              <Text style={styles.captureButtonText}>历史</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ---------------------------------------------------------
// 3. 解题结果页面 (SolveResultScreen)
// ---------------------------------------------------------

export const SolveResultScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { question } = route.params as { question: Question };
  const [showSolutions, setShowSolutions] = useState(false);
  const [showSimilar, setShowSimilar] = useState(false);

  // 收藏到错题本
  const handleAddToWrongBook = async () => {
    try {
      // TODO: 调用API
      Alert.alert('成功', '已添加到错题本');
    } catch (err) {
      Alert.alert('错误', '添加失败，请重试');
    }
  };

  // 举一反三
  const handleSimilarPractice = () => {
    navigation.navigate('SimilarPractice', { question });
  };

  return (
    <ScrollView style={styles.container}>
      {/* 题目卡片 */}
      <Card style={styles.questionCard}>
        <Text style={styles.questionLabel}>📝 题目</Text>
        <Text style={styles.questionContent}>{question.content}</Text>
        <View style={styles.difficultyRow}>
          <Text style={styles.difficultyLabel}>难度：</Text>
          {[1, 2, 3, 4, 5].map((level) => (
            <Text key={level} style={styles.difficultyStar}>
              {level <= question.difficulty ? '⭐' : '☆'}
            </Text>
          ))}
        </View>
      </Card>

      {/* 答案卡片 */}
      <Card style={styles.answerCard}>
        <Text style={styles.answerLabel}>✅ 正确答案</Text>
        <Text style={styles.answerText}>{question.answer}</Text>
      </Card>

      {/* 详细解答 */}
      <Card style={styles.solutionCard}>
        <TouchableOpacity
          style={styles.solutionHeader}
          onPress={() => setShowSolutions(!showSolutions)}
        >
          <Text style={styles.solutionLabel}>📖 详细解答</Text>
          <Text style={styles.expandIcon}>{showSolutions ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showSolutions && (
          <View style={styles.solutionSteps}>
            {question.solution_steps.map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>

      {/* AI易错提示 */}
      {question.ai_tips && (
        <Card style={styles.tipsCard}>
          <Text style={styles.tipsLabel}>💡 AI易错提示</Text>
          <Text style={styles.tipsText}>{question.ai_tips}</Text>
        </Card>
      )}

      {/* 知识点 */}
      <Card style={styles.knowledgeCard}>
        <Text style={styles.knowledgeLabel}>🔑 关联知识点</Text>
        <View style={styles.knowledgeTags}>
          {question.knowledge_points.map((kp, index) => (
            <Tag key={index} label={kp} color={COLORS.primary} />
          ))}
        </View>
      </Card>

      {/* 操作按钮 */}
      <View style={styles.actionButtons}>
        <Button
          title="📚 收藏到错题本"
          onPress={handleAddToWrongBook}
          variant="outline"
          size="large"
        />
        <View style={{ height: SPACING.md }} />
        <Button
          title="💡 举一反三练习"
          onPress={handleSimilarPractice}
          variant="primary"
          size="large"
        />
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
};

// ---------------------------------------------------------
// 4. 错题本列表页面 (WrongBookScreen)
// ---------------------------------------------------------

export const WrongBookScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'need_review' | 'mastered'>('all');
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWrongQuestions();
  }, [activeTab]);

  const loadWrongQuestions = async () => {
    setLoading(true);
    try {
      // TODO: 调用API
      // const response = await api.get('/wrongbook/list', { params: { type: activeTab } });

      // 模拟数据
      setTimeout(() => {
        const mockData: WrongQuestion[] = [
          {
            id: 'w1',
            question_snapshot: {
              content: '已知二次函数 y=ax²+bx+c 的图像开口向下...',
              answer: 'a < -1',
              knowledge_points: ['二次函数', '判别式'],
              difficulty: 3,
            },
            mastery_level: 0.75,
            review_count: 3,
            next_review_at: '2026-05-01',
            error_type: 'concept_confusion',
            created_at: '2026-04-15',
          },
          {
            id: 'w2',
            question_snapshot: {
              content: '用配方法解方程 x²+4x+1=0...',
              answer: 'x = -2 ± √3',
              knowledge_points: ['配方法', '一元二次方程'],
              difficulty: 2,
            },
            mastery_level: 0.45,
            review_count: 1,
            next_review_at: '2026-04-29',
            error_type: 'calculation_error',
            created_at: '2026-04-18',
          },
          {
            id: 'w3',
            question_snapshot: {
              content: '已知三角形三边长度...',
              answer: '不能构成三角形',
              knowledge_points: ['三角形', '勾股定理'],
              difficulty: 2,
            },
            mastery_level: 0.60,
            review_count: 2,
            next_review_at: '2026-04-30',
            error_type: 'careless_mistake',
            created_at: '2026-04-10',
          },
        ];
        setWrongQuestions(mockData);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setLoading(false);
    }
  };

  const tabs = [
    { key: 'all', label: '全部', count: 32 },
    { key: 'need_review', label: '待复习', count: 17 },
    { key: 'mastered', label: '已掌握', count: 15 },
  ];

  const getMasteryColor = (level: number) => {
    if (level >= 0.8) return COLORS.success;
    if (level >= 0.5) return COLORS.warning;
    return COLORS.error;
  };

  const renderItem = ({ item }: { item: WrongQuestion }) => (
    <TouchableOpacity
      style={styles.wrongItem}
      onPress={() => navigation.navigate('WrongDetail', { question: item })}
    >
      <View style={styles.wrongItemHeader}>
        <Text style={styles.wrongItemDate}>{item.created_at}</Text>
        <Tag
          label={item.error_type === 'concept_confusion' ? '概念混淆' : '计算错误'}
          color={COLORS.error}
          size="small"
        />
      </View>
      <Text style={styles.wrongItemContent} numberOfLines={2}>
        {item.question_snapshot.content}
      </Text>
      <View style={styles.wrongItemFooter}>
        <View style={styles.masteryBar}>
          <View
            style={[
              styles.masteryProgress,
              {
                width: `${item.mastery_level * 100}%`,
                backgroundColor: getMasteryColor(item.mastery_level),
              },
            ]}
          />
        </View>
        <Text style={styles.masteryText}>
          掌握度 {Math.round(item.mastery_level * 100)}%
        </Text>
      </View>
      <View style={styles.wrongItemMeta}>
        <Text style={styles.metaText}>复习 {item.review_count} 次</Text>
        <Text style={styles.metaText}>
          下次 {item.next_review_at}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 统计概览 */}
      <View style={styles.statsOverview}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxValue}>32</Text>
          <Text style={styles.statBoxLabel}>错题</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxValue, { color: COLORS.success }]}>15</Text>
          <Text style={styles.statBoxLabel}>已掌握</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statBoxValue, { color: COLORS.warning }]}>17</Text>
          <Text style={styles.statBoxLabel}>待复习</Text>
        </View>
      </View>

      {/* 标签切换 */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </Text>
            <Text style={[styles.tabCount, activeTab === tab.key && styles.tabCountActive]}>
              {tab.count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 错题列表 */}
      {loading ? (
        <Loading tip="加载中..." />
      ) : (
        <FlatList
          data={wrongQuestions}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={loadWrongQuestions}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>🎉 没有待复习的错题</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

// ---------------------------------------------------------
// 5. AI智能组卷页面 (PaperGenerateScreen)
// ---------------------------------------------------------

export const PaperGenerateScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [options, setOptions] = useState({
    paperCount: 1,
    questionCount: 15,
    duration: 60,
    difficulty: 'medium',
    includeWrongBook: true,
    wrongBookCount: 5,
    aiGeneratedCount: 8,
    includeDiagnosis: true,
  });

  const [papers, setPapers] = useState<Paper[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      // TODO: 调用API
      // const response = await api.post('/paper/generate', options);

      // 模拟生成
      setTimeout(() => {
        const newPaper: Paper = {
          id: 'paper_' + Date.now(),
          title: '二次函数专项测试卷',
          total_score: 100,
          duration: options.duration,
          status: 'pending',
          created_at: new Date().toISOString().split('T')[0],
        };
        setPapers([newPaper, ...papers]);
        setIsGenerating(false);
        navigation.navigate('PaperPreview', { paper: newPaper });
      }, 3000);
    } catch (err) {
      setIsGenerating(false);
      Alert.alert('错误', '生成失败，请重试');
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* AI智能组卷入口 */}
      <Card style={styles.generateCard}>
        <Text style={styles.generateTitle}>🧠 AI智能组卷</Text>
        <Text style={styles.generateDesc}>
          根据你的错题本和学习情况，自动生成个性化试卷
        </Text>

        {/* 题目数量 */}
        <View style={styles.optionItem}>
          <Text style={styles.optionLabel}>题目数量</Text>
          <View style={styles.optionSelector}>
            {[10, 12, 15, 18, 20].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.optionButton,
                  options.questionCount === num && styles.optionButtonActive,
                ]}
                onPress={() => setOptions({ ...options, questionCount: num })}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    options.questionCount === num && styles.optionButtonTextActive,
                  ]}
                >
                  {num}题
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 考试时长 */}
        <View style={styles.optionItem}>
          <Text style={styles.optionLabel}>考试时长</Text>
          <View style={styles.optionSelector}>
            {[30, 45, 60, 90, 120].map((min) => (
              <TouchableOpacity
                key={min}
                style={[
                  styles.optionButton,
                  options.duration === min && styles.optionButtonActive,
                ]}
                onPress={() => setOptions({ ...options, duration: min })}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    options.duration === min && styles.optionButtonTextActive,
                  ]}
                >
                  {min}分钟
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 难度偏好 */}
        <View style={styles.optionItem}>
          <Text style={styles.optionLabel}>难度偏好</Text>
          <View style={styles.optionSelector}>
            {['easy', 'medium', 'hard'].map((diff) => (
              <TouchableOpacity
                key={diff}
                style={[
                  styles.optionButton,
                  options.difficulty === diff && styles.optionButtonActive,
                ]}
                onPress={() => setOptions({ ...options, difficulty: diff })}
              >
                <Text
                  style={[
                    styles.optionButtonText,
                    options.difficulty === diff && styles.optionButtonTextActive,
                  ]}
                >
                  {diff === 'easy' ? '简单' : diff === 'medium' ? '中等' : '困难'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 包含错题本题目 */}
        <TouchableOpacity
          style={styles.switchItem}
          onPress={() => setOptions({ ...options, includeWrongBook: !options.includeWrongBook })}
        >
          <Text style={styles.optionLabel}>包含错题本题目</Text>
          <View style={[styles.switch, options.includeWrongBook && styles.switchActive]}>
            <View style={[styles.switchThumb, options.includeWrongBook && styles.switchThumbActive]} />
          </View>
        </TouchableOpacity>

        {/* 生成按钮 */}
        <Button
          title="🎯 开始生成试卷"
          onPress={handleGenerate}
          variant="primary"
          size="large"
          loading={isGenerating}
        />
      </Card>

      {/* 历史试卷 */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>📋 历史试卷</Text>
        {papers.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>还没有生成的试卷</Text>
          </View>
        ) : (
          papers.map((paper) => (
            <TouchableOpacity
              key={paper.id}
              style={styles.paperItem}
              onPress={() => navigation.navigate('PaperPreview', { paper })}
            >
              <View>
                <Text style={styles.paperTitle}>{paper.title}</Text>
                <Text style={styles.paperMeta}>
                  {paper.total_score}分 | {paper.duration}分钟 | {paper.created_at}
                </Text>
              </View>
              <View style={styles.paperStatus}>
                <Text
                  style={[
                    styles.paperStatusText,
                    { color: paper.status === 'completed' ? COLORS.success : COLORS.warning },
                  ]}
                >
                  {paper.status === 'completed' ? '已完成' : '待做'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
};

// ============================================
// 样式定义
// ============================================

const styles = StyleSheet.create({
  // 通用
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // 首页
  header: {
    padding: SPACING.xl,
    paddingTop: 60,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: 28,
  },
  greeting: {
    ...TYPOGRAPHY.heading,
    color: COLORS.white,
  },
  streak: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  mainEntry: {
    backgroundColor: COLORS.primary,
    margin: SPACING.lg,
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  mainEntryIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  mainEntryTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.white,
  },
  mainEntrySubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
  },
  quickAction: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    marginRight: '4%',
  },
  quickActionIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  quickActionTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.text,
  },
  quickActionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statsCard: {
    marginTop: SPACING.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    ...TYPOGRAPHY.title,
    color: COLORS.primary,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // 拍照页面
  cameraArea: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  placeholder: {
    alignItems: 'center',
  },
  placeholderIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  placeholderText: {
    ...TYPOGRAPHY.heading,
    color: COLORS.white,
  },
  placeholderHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    opacity: 0.7,
    marginTop: 4,
  },
  guideFrame: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    right: '10%',
    bottom: '35%',
  },
  guideCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
  },
  guideCorner_tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  guideCorner_tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  guideCorner_bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  guideCorner_br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  bottomActions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    padding: SPACING.lg,
  },
  captureActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  captureButtonIcon: {
    fontSize: 28,
  },
  captureButtonText: {
    ...TYPOGRAPHY.small,
    color: COLORS.white,
    marginTop: 4,
  },
  mainCaptureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
  },
  mainCaptureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  errorText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.error,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },

  // 按钮
  button: {
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button_primary: {
    backgroundColor: COLORS.primary,
  },
  button_secondary: {
    backgroundColor: COLORS.background,
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  button_large: {
    height: 48,
    paddingHorizontal: 24,
  },
  button_medium: {
    height: 40,
    paddingHorizontal: 20,
  },
  button_small: {
    height: 32,
    paddingHorizontal: 16,
  },
  button_disabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  buttonText_primary: {
    color: COLORS.white,
  },
  buttonText_secondary: {
    color: COLORS.text,
  },
  buttonText_outline: {
    color: COLORS.primary,
  },

  // 标签
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 6,
    marginBottom: 4,
  },
  tag_small: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    ...TYPOGRAPHY.caption,
  },
  tagText_small: {
    ...TYPOGRAPHY.small,
  },

  // 加载
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },

  // 解题结果
  questionCard: {
    marginTop: SPACING.lg,
  },
  questionLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  questionContent: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 24,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  difficultyLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginRight: 4,
  },
  difficultyStar: {
    fontSize: 14,
    marginRight: 2,
  },
  answerCard: {
    backgroundColor: COLORS.success + '15',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
  },
  answerLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginBottom: SPACING.sm,
  },
  answerText: {
    ...TYPOGRAPHY.heading,
    color: COLORS.success,
  },
  solutionCard: {},
  solutionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  solutionLabel: {
    ...TYPOGRAPHY.heading,
    color: COLORS.text,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  solutionSteps: {
    marginTop: SPACING.md,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    ...TYPOGRAPHY.small,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  tipsCard: {
    backgroundColor: COLORS.warning + '15',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  tipsLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    marginBottom: SPACING.sm,
  },
  tipsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  knowledgeCard: {},
  knowledgeLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  knowledgeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  actionButtons: {
    margin: SPACING.lg,
    marginTop: SPACING.xl,
  },

  // 错题本
  statsOverview: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statBoxValue: {
    ...TYPOGRAPHY.title,
    color: COLORS.primary,
  },
  statBoxLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.md,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '15',
  },
  tabText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  tabCount: {
    ...TYPOGRAPHY.small,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  tabCountActive: {
    color: COLORS.primary,
  },
  listContent: {
    padding: SPACING.lg,
  },
  wrongItem: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  wrongItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  wrongItemDate: {
    ...TYPOGRAPHY.small,
    color: COLORS.textLight,
  },
  wrongItemContent: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  wrongItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  masteryBar: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginRight: SPACING.md,
  },
  masteryProgress: {
    height: '100%',
    borderRadius: 3,
  },
  masteryText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textSecondary,
    width: 70,
  },
  wrongItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  metaText: {
    ...TYPOGRAPHY.small,
    color: COLORS.textLight,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },

  // 组卷页面
  generateCard: {
    marginTop: SPACING.lg,
  },
  generateTitle: {
    ...TYPOGRAPHY.title,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  generateDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  optionItem: {
    marginBottom: SPACING.lg,
  },
  optionLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  optionSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    marginBottom: 8,
  },
  optionButtonActive: {
    backgroundColor: COLORS.primary,
  },
  optionButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  optionButtonTextActive: {
    color: COLORS.white,
  },
  switchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  switch: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    padding: 2,
  },
  switchActive: {
    backgroundColor: COLORS.primary,
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  switchThumbActive: {
    transform: [{ translateX: 22 }],
  },
  historySection: {
    padding: SPACING.lg,
  },
  paperItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 12,
    marginBottom: SPACING.md,
  },
  paperTitle: {
    ...TYPOGRAPHY.heading,
    color: COLORS.text,
  },
  paperMeta: {
    ...TYPOGRAPHY.small,
    color: COLORS.textLight,
    marginTop: 4,
  },
  paperStatus: {},
  paperStatusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
});

export default {
  HomeScreen,
  CameraScreen,
  SolveResultScreen,
  WrongBookScreen,
  PaperGenerateScreen,
};
