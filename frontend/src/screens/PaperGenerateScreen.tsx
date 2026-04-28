import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { questionApi } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type RouteProps = RouteProp<RootStackParamList, 'PaperGenerate'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GeneratedPaper {
  id: string;
  title: string;
  questionCount: number;
  estimatedTime: number;
  difficulty: string;
  topics: string[];
  questions: Array<{
    id: string;
    questionText: string;
    options?: string[];
  }>;
}

const PaperGenerateScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const initialTopic = route.params?.topic || '';

  const [topic, setTopic] = useState(initialTopic);
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(10);
  const [grade, setGrade] = useState('初一');
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState<GeneratedPaper | null>(null);

  const difficulties = [
    { key: 'easy', label: '简单', color: '#34C759' },
    { key: 'medium', label: '中等', color: '#FF9500' },
    { key: 'hard', label: '困难', color: '#FF3B30' },
  ];

  const grades = ['初一', '初二', '初三', '高一', '高二', '高三'];

  const handleGenerate = async () => {
    if (!topic.trim()) {
      Alert.alert('提示', '请输入知识点或题目要求');
      return;
    }

    setLoading(true);
    try {
      const response = await questionApi.generatePaper({
        topic,
        difficulty,
        questionCount,
        grade,
      });
      setPaper(response);
    } catch (error: any) {
      Alert.alert('生成失败', error.message || '试卷生成失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const topicSuggestions = [
    '一元二次方程',
    '二次函数',
    '三角形全等',
    '圆与直线',
    '概率统计',
    '因式分解',
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* 顶部 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI智能组卷</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {!paper ? (
          <>
            {/* 知识点输入 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>选择知识点</Text>
              <View style={styles.inputContainer}>
                <Icon name="search" size={20} color="#999" />
                <TextInput
                  style={styles.input}
                  placeholder="输入知识点，如：一元二次方程"
                  placeholderTextColor="#999"
                  value={topic}
                  onChangeText={setTopic}
                />
                {topic.length > 0 && (
                  <TouchableOpacity onPress={() => setTopic('')}>
                    <Icon name="close-circle" size={20} color="#999" />
                  </TouchableOpacity>
                )}
              </View>

              {/* 推荐标签 */}
              <View style={styles.suggestions}>
                {topicSuggestions.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.suggestionTag, topic === item && styles.suggestionTagActive]}
                    onPress={() => setTopic(item)}
                  >
                    <Text
                      style={[
                        styles.suggestionText,
                        topic === item && styles.suggestionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 年级选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>选择年级</Text>
              <View style={styles.optionGrid}>
                {grades.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={[styles.optionItem, grade === item && styles.optionItemActive]}
                    onPress={() => setGrade(item)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        grade === item && styles.optionTextActive,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 难度选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>选择难度</Text>
              <View style={styles.difficultyRow}>
                {difficulties.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    style={[
                      styles.difficultyItem,
                      difficulty === item.key && {
                        backgroundColor: item.color,
                        borderColor: item.color,
                      },
                    ]}
                    onPress={() => setDifficulty(item.key as any)}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        difficulty === item.key && styles.difficultyTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* 题量选择 */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>题目数量：{questionCount}道</Text>
              <View style={styles.sliderContainer}>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => setQuestionCount(Math.max(5, questionCount - 5))}
                >
                  <Icon name="remove" size={24} color="#4A90E2" />
                </TouchableOpacity>
                <View style={styles.sliderTrack}>
                  <View
                    style={[
                      styles.sliderFill,
                      { width: `${((questionCount - 5) / 25) * 100}%` },
                    ]}
                  />
                  {[5, 10, 15, 20, 25, 30].map((val) => (
                    <TouchableOpacity
                      key={val}
                      style={[
                        styles.sliderDot,
                        questionCount >= val && styles.sliderDotActive,
                      ]}
                      onPress={() => setQuestionCount(val)}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.sliderButton}
                  onPress={() => setQuestionCount(Math.min(30, questionCount + 5))}
                >
                  <Icon name="add" size={24} color="#4A90E2" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 预估信息 */}
            <View style={styles.infoCard}>
              <Icon name="information-circle" size={20} color="#4A90E2" />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>预估信息</Text>
                <Text style={styles.infoText}>
                  约 {Math.round(questionCount * 2)} 分钟 · {questionCount} 道题 ·{' '}
                  {difficulties.find((d) => d.key === difficulty)?.label} 难度
                </Text>
              </View>
            </View>
          </>
        ) : (
          /* 生成的试卷 */
          <View style={styles.paperSection}>
            <View style={styles.paperHeader}>
              <Text style={styles.paperTitle}>{paper.title}</Text>
              <View style={styles.paperMeta}>
                <View style={styles.paperMetaItem}>
                  <Icon name="document-text" size={14} color="#666" />
                  <Text style={styles.paperMetaText}>{paper.questionCount}道题</Text>
                </View>
                <View style={styles.paperMetaItem}>
                  <Icon name="time" size={14} color="#666" />
                  <Text style={styles.paperMetaText}>{paper.estimatedTime}分钟</Text>
                </View>
                <View style={[styles.paperDifficultyBadge, { backgroundColor: paper.difficulty === '中等' ? '#FFF3E8' : '#E8FFE8' }]}>
                  <Text style={[styles.paperDifficultyText, { color: paper.difficulty === '中等' ? '#FF9500' : '#34C759' }]}>
                    {paper.difficulty}
                  </Text>
                </View>
              </View>
            </View>

            {paper.questions.map((q, index) => (
              <View key={q.id} style={styles.paperQuestion}>
                <Text style={styles.questionNumber}>{index + 1}.</Text>
                <View style={styles.questionContent}>
                  <Text style={styles.questionText}>{q.questionText}</Text>
                  {q.options && (
                    <View style={styles.optionsList}>
                      {q.options.map((opt, i) => (
                        <Text key={i} style={styles.optionText}>
                          {String.fromCharCode(65 + i)}. {opt}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 底部按钮 */}
      <View style={styles.bottomBar}>
        {!paper ? (
          <TouchableOpacity
            style={[styles.generateButton, loading && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Icon name="bulb" size={20} color="#FFF" />
                <Text style={styles.generateButtonText}>AI生成试卷</Text>
              </>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.paperActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setPaper(null)}
            >
              <Text style={styles.actionButtonText}>重新生成</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonPrimary]}
            >
              <Icon name="play" size={20} color="#FFF" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>
                开始答题
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  headerRight: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 120,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
  },
  suggestions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  suggestionTag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  suggestionTagActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  suggestionText: {
    fontSize: 13,
    color: '#666',
  },
  suggestionTextActive: {
    color: '#FFF',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  optionItemActive: {
    backgroundColor: '#E8F4FF',
    borderColor: '#4A90E2',
  },
  optionText: {
    fontSize: 14,
    color: '#666',
  },
  optionTextActive: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  difficultyItem: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  difficultyText: {
    fontSize: 14,
    color: '#666',
  },
  difficultyTextActive: {
    color: '#FFF',
    fontWeight: '500',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sliderButton: {
    width: 44,
    height: 44,
    backgroundColor: '#E8F4FF',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'space-between',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sliderFill: {
    position: 'absolute',
    left: 0,
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 3,
  },
  sliderDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    zIndex: 1,
  },
  sliderDotActive: {
    borderColor: '#4A90E2',
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4A90E2',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  paperSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
  },
  paperHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  paperTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  paperMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paperMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  paperMetaText: {
    fontSize: 13,
    color: '#666',
  },
  paperDifficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  paperDifficultyText: {
    fontSize: 12,
    fontWeight: '500',
  },
  paperQuestion: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  questionNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    width: 24,
  },
  questionContent: {
    flex: 1,
  },
  questionText: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  optionsList: {
    marginTop: 8,
    gap: 4,
  },
  optionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 34,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  generateButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  paperActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 14,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  actionButtonPrimary: {
    backgroundColor: '#4A90E2',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
  },
  actionButtonTextPrimary: {
    color: '#FFF',
  },
});

export default PaperGenerateScreen;
