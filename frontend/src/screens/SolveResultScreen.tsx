import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { questionApi } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type RouteProps = RouteProp<RootStackParamList, 'SolveResult'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Question {
  id: string;
  questionText: string;
  questionImage?: string;
  answer: string;
  explanation: string;
  knowledgePoints: string[];
  similarQuestions?: Array<{
    id: string;
    questionText: string;
    options?: string[];
    answer: string;
  }>;
  userAnswer?: string;
  isCorrect?: boolean;
}

const SolveResultScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { questionId, imageUrl } = route.params;

  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState<'answer' | 'similar' | 'knowledge'>('answer');
  const [similarLoading, setSimilarLoading] = useState(false);

  useEffect(() => {
    fetchQuestion();
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      const response = await questionApi.getSolveResult(questionId);
      setQuestion(response);
    } catch (error) {
      console.error('获取题目失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSimilarQuestions = async () => {
    setSimilarLoading(true);
    try {
      const response = await questionApi.getSimilarQuestions(questionId, 3);
      setQuestion((prev) =>
        prev ? { ...prev, similarQuestions: response.questions } : null
      );
    } catch (error) {
      console.error('获取举一反三失败:', error);
    } finally {
      setSimilarLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>AI正在分析题目...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!question) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color="#FF3B30" />
          <Text style={styles.errorText}>题目加载失败</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>重新拍照</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-back" size={28} color="#1A1A1A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>解题结果</Text>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={() => {}}
        >
          <Icon name="share-outline" size={24} color="#1A1A1A" />
        </TouchableOpacity>
      </View>

      {/* 原图预览 */}
      {imageUrl && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: imageUrl }} style={styles.previewImage} />
        </View>
      )}

      {/* Tab切换 */}
      <View style={styles.tabContainer}>
        {['answer', 'similar', 'knowledge'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab as any);
              if (tab === 'similar') loadSimilarQuestions();
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab === 'answer'
                ? '答案解析'
                : tab === 'similar'
                ? '举一反三'
                : '知识点'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 内容区域 */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {activeTab === 'answer' && (
          <View style={styles.answerSection}>
            {/* 正确答案 */}
            <View style={styles.answerCard}>
              <View style={styles.answerHeader}>
                <Icon name="checkmark-circle" size={24} color="#34C759" />
                <Text style={styles.answerTitle}>正确答案</Text>
              </View>
              <Text style={styles.answerText}>{question.answer}</Text>
            </View>

            {/* 你的答案 */}
            {question.userAnswer && (
              <View
                style={[
                  styles.answerCard,
                  question.isCorrect ? styles.answerCorrect : styles.answerWrong,
                ]}
              >
                <View style={styles.answerHeader}>
                  <Icon
                    name={question.isCorrect ? 'checkmark-circle' : 'close-circle'}
                    size={24}
                    color={question.isCorrect ? '#34C759' : '#FF3B30'}
                  />
                  <Text style={styles.answerTitle}>
                    你的答案 {question.isCorrect ? '✓ 正确' : '✗ 错误'}
                  </Text>
                </View>
                <Text style={styles.answerText}>{question.userAnswer}</Text>
              </View>
            )}

            {/* 详细解析 */}
            <View style={styles.explanationCard}>
              <View style={styles.explanationHeader}>
                <Icon name="bulb" size={24} color="#FF9500" />
                <Text style={styles.explanationTitle}>详细解析</Text>
              </View>
              <Text style={styles.explanationText}>{question.explanation}</Text>
            </View>

            {/* 解题步骤 */}
            <View style={styles.stepsCard}>
              <Text style={styles.stepsTitle}>解题步骤</Text>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepText}>理解题意，找出已知条件和求解目标</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepText}>分析题目类型，选择合适的解题方法</Text>
              </View>
              <View style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepText}>按照步骤逐步计算，注意细节</Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'similar' && (
          <View style={styles.similarSection}>
            <View style={styles.similarHeader}>
              <Text style={styles.similarTitle}>举一反三</Text>
              <Text style={styles.similarSubtitle}>
                掌握了原题？来试试同类型的题目吧
              </Text>
            </View>

            {similarLoading ? (
              <ActivityIndicator size="small" color="#4A90E2" />
            ) : (
              question.similarQuestions?.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.similarCard}
                  activeOpacity={0.8}
                >
                  <View style={styles.similarCardHeader}>
                    <Text style={styles.similarQuestionNum}>变式 {index + 1}</Text>
                    <View style={styles.difficultyBadge}>
                      <Text style={styles.difficultyText}>中等</Text>
                    </View>
                  </View>
                  <Text style={styles.similarQuestionText}>{item.questionText}</Text>
                  {item.options && (
                    <View style={styles.optionsContainer}>
                      {item.options.map((opt, i) => (
                        <View key={i} style={styles.optionItem}>
                          <Text style={styles.optionLabel}>
                            {String.fromCharCode(65 + i)}.
                          </Text>
                          <Text style={styles.optionText}>{opt}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <TouchableOpacity style={styles.tryButton}>
                    <Text style={styles.tryButtonText}>点击作答</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {activeTab === 'knowledge' && (
          <View style={styles.knowledgeSection}>
            <Text style={styles.knowledgeTitle}>涉及知识点</Text>
            <View style={styles.knowledgeTags}>
              {question.knowledgePoints.map((point, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.knowledgeTag}
                  activeOpacity={0.8}
                >
                  <Icon name="bookmark" size={16} color="#4A90E2" />
                  <Text style={styles.knowledgeTagText}>{point}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.knowledgeTip}>
              <Icon name="information-circle" size={20} color="#4A90E2" />
              <Text style={styles.knowledgeTipText}>
                建议复习相关知识点后再做练习，巩固理解
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 底部操作栏 */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Camera')}
        >
          <Icon name="camera" size={24} color="#4A90E2" />
          <Text style={styles.bottomButtonText}>继续拍照</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomButton, styles.bottomButtonPrimary]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('PaperGenerate', {
              topic: question.knowledgePoints[0],
            })
          }
        >
          <Icon name="document-text" size={24} color="#FFF" />
          <Text style={[styles.bottomButtonText, styles.bottomButtonTextPrimary]}>
            生成练习卷
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 15,
    color: '#FFF',
    fontWeight: '500',
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
  shareButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePreview: {
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  previewImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 24,
  },
  tab: {
    paddingVertical: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#4A90E2',
  },
  tabText: {
    fontSize: 15,
    color: '#666',
  },
  tabTextActive: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  answerSection: {
    gap: 12,
  },
  answerCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  answerCorrect: {
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  answerWrong: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  answerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  answerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  answerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  explanationCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  explanationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  explanationText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 24,
  },
  stepsCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A90E2',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  similarSection: {
    gap: 16,
  },
  similarHeader: {
    marginBottom: 8,
  },
  similarTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  similarSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  similarCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  similarCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  similarQuestionNum: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '500',
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF3E8',
    borderRadius: 4,
  },
  difficultyText: {
    fontSize: 11,
    color: '#FF9500',
  },
  similarQuestionText: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
  },
  optionsContainer: {
    marginTop: 12,
  },
  optionItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 14,
    color: '#666',
    width: 20,
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  tryButton: {
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#E8F4FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  tryButtonText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  knowledgeSection: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
  },
  knowledgeTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  knowledgeTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  knowledgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E8F4FF',
    borderRadius: 8,
  },
  knowledgeTagText: {
    fontSize: 13,
    color: '#4A90E2',
  },
  knowledgeTip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
    padding: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
  },
  knowledgeTipText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 20,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 34,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  bottomButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
  },
  bottomButtonPrimary: {
    backgroundColor: '#4A90E2',
  },
  bottomButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4A90E2',
  },
  bottomButtonTextPrimary: {
    color: '#FFF',
  },
});

export default SolveResultScreen;
