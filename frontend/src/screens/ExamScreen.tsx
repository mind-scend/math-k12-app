/**
 * 考试练习页面
 * 支持计时练习、模拟考试
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ExamScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

interface Question {
  id: string;
  type: 'single' | 'multiple' | 'fill' | 'subjective';
  content: string;
  options?: string[];
  correctAnswer: string | string[];
  score: number;
}

interface Exam {
  id: string;
  title: string;
  duration: number;
  totalScore: number;
  questions: Question[];
}

const ExamScreen: React.FC<ExamScreenProps> = ({ navigation }) => {
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadExam();
  }, []);

  useEffect(() => {
    if (!exam || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, timeLeft]);

  const loadExam = async () => {
    const mockExam: Exam = {
      id: 'exam_001',
      title: '二次函数单元测试',
      duration: 60,
      totalScore: 100,
      questions: [
        {
          id: 'q1',
          type: 'single',
          content: '已知抛物线 y = ax² + bx + c，a > 0，则该抛物线的开口方向是？',
          options: ['向上', '向下', '向左', '向右'],
          correctAnswer: '向上',
          score: 10,
        },
        {
          id: 'q2',
          type: 'single',
          content: '二次函数 y = (x-2)² + 3 的顶点坐标是？',
          options: ['(2, 3)', '(-2, 3)', '(2, -3)', '(-2, -3)'],
          correctAnswer: '(2, 3)',
          score: 10,
        },
        {
          id: 'q3',
          type: 'multiple',
          content: '下列关于二次函数 y = x² - 4x + 3 的说法正确的是？',
          options: ['开口向上', '与x轴交于(1,0)和(3,0)', '对称轴是x=2', '顶点坐标是(2,-1)'],
          correctAnswer: ['A', 'B', 'C'],
          score: 15,
        },
        {
          id: 'q4',
          type: 'fill',
          content: '若二次函数 y = ax² + bx + c 的判别式 Δ = b² - 4ac = 0，则它与x轴有____个交点。',
          correctAnswer: '1',
          score: 10,
        },
        {
          id: 'q5',
          type: 'subjective',
          content: '已知二次函数 y = -x² + 4x - 3。\n(1) 求顶点坐标和对称轴；\n(2) 求函数的最大值；\n(3) 当 x 为何值时，y > 0？',
          correctAnswer: '',
          score: 25,
        },
      ],
    };
    setExam(mockExam);
    setTimeLeft(mockExam.duration * 60);
  };

  const handleAnswer = (questionId: string, answer: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (isSubmitting) return;
    Alert.alert('确认提交', '提交后将无法修改答案，是否确认提交？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确认提交',
        onPress: async () => {
          setIsSubmitting(true);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          navigation.navigate('ExamResult', { examId: exam?.id, answers });
          setIsSubmitting(false);
        },
      },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentQuestion = exam?.questions[currentIndex];

  if (!exam || !currentQuestion) {
    return <View style={styles.container}><Text style={styles.loadingText}>加载中...</Text></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← 返回</Text>
        </TouchableOpacity>
        <Text style={styles.examTitle}>{exam.title}</Text>
        <View style={[styles.timer, timeLeft < 300 && styles.timerWarning]}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((currentIndex + 1) / exam.questions.length) * 100}%` }]} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.questionNav}>
        {exam.questions.map((q, index) => (
          <TouchableOpacity
            key={q.id}
            style={[styles.navItem, index === currentIndex && styles.navItemActive, answers[q.id] !== undefined && styles.navItemAnswered]}
            onPress={() => setCurrentIndex(index)}
          >
            <Text style={[styles.navItemText, index === currentIndex && styles.navItemTextActive]}>{index + 1}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.questionContent}>
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionType}>
              {currentQuestion.type === 'single' && '单选题'}
              {currentQuestion.type === 'multiple' && '多选题'}
              {currentQuestion.type === 'fill' && '填空题'}
              {currentQuestion.type === 'subjective' && '解答题'}
            </Text>
            <Text style={styles.questionScore}>{currentQuestion.score}分</Text>
          </View>
          <Text style={styles.questionText}>{currentQuestion.content}</Text>

          {(currentQuestion.type === 'single' || currentQuestion.type === 'multiple') && currentQuestion.options && (
            <View style={styles.optionsContainer}>
              {currentQuestion.options.map((option, index) => {
                const isSelected = Array.isArray(answers[currentQuestion.id])
                  ? answers[currentQuestion.id].includes(String.fromCharCode(65 + index))
                  : answers[currentQuestion.id] === String.fromCharCode(65 + index);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => {
                      if (currentQuestion.type === 'single') {
                        handleAnswer(currentQuestion.id, String.fromCharCode(65 + index));
                      } else {
                        const current = answers[currentQuestion.id] || [];
                        const value = String.fromCharCode(65 + index);
                        if (current.includes(value)) {
                          handleAnswer(currentQuestion.id, current.filter((v: string) => v !== value));
                        } else {
                          handleAnswer(currentQuestion.id, [...current, value]);
                        }
                      }
                    }}
                  >
                    <View style={[styles.optionCircle, isSelected && styles.optionCircleSelected]}>
                      <Text style={[styles.optionLetter, isSelected && styles.optionLetterSelected]}>{String.fromCharCode(65 + index)}</Text>
                    </View>
                    <Text style={styles.optionText}>{option}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {(currentQuestion.type === 'fill' || currentQuestion.type === 'subjective') && (
            <View style={styles.answerInput}>
              <Text style={styles.inputLabel}>你的答案：</Text>
              <TouchableOpacity style={styles.inputField} onPress={() => Alert.prompt('输入答案', '', (text) => text !== null && handleAnswer(currentQuestion.id, text))}>
                <Text style={answers[currentQuestion.id] ? styles.inputText : styles.inputPlaceholder}>
                  {answers[currentQuestion.id] || '点击输入答案'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={[styles.btn, styles.btnSecondary]} onPress={() => setCurrentIndex((prev) => Math.max(0, prev - 1))} disabled={currentIndex === 0}>
          <Text style={styles.btnSecondaryText}>上一题</Text>
        </TouchableOpacity>
        {currentIndex === exam.questions.length - 1 ? (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSubmit} disabled={isSubmitting}>
            <Text style={styles.btnPrimaryText}>{isSubmitting ? '提交中...' : '提交试卷'}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={() => setCurrentIndex((prev) => prev + 1)}>
            <Text style={styles.btnPrimaryText}>下一题</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingText: { textAlign: 'center', marginTop: 100, fontSize: 16, color: '#666' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { fontSize: 16, color: '#007AFF' },
  examTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  timer: { backgroundColor: '#f0f0f0', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  timerWarning: { backgroundColor: '#FFE4E4' },
  timerText: { fontSize: 16, fontWeight: '600', color: '#333' },
  progressBar: { height: 4, backgroundColor: '#E5E5E5' },
  progressFill: { height: '100%', backgroundColor: '#007AFF' },
  questionNav: { backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  navItem: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f0f0f0', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  navItemActive: { backgroundColor: '#007AFF' },
  navItemAnswered: { borderWidth: 2, borderColor: '#34C759' },
  navItemText: { fontSize: 14, color: '#666' },
  navItemTextActive: { color: '#fff' },
  questionContent: { flex: 1, padding: 16 },
  questionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  questionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  questionType: { fontSize: 12, color: '#007AFF', backgroundColor: '#E8F4FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  questionScore: { fontSize: 12, color: '#FF9500', backgroundColor: '#FFF4E6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  questionText: { fontSize: 16, lineHeight: 24, color: '#333', marginBottom: 20 },
  optionsContainer: { gap: 12 },
  option: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  optionSelected: { backgroundColor: '#E8F4FF', borderColor: '#007AFF' },
  optionCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fff', borderWidth: 2, borderColor: '#ddd', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionCircleSelected: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  optionLetter: { fontSize: 14, fontWeight: '600', color: '#666' },
  optionLetterSelected: { color: '#fff' },
  optionText: { flex: 1, fontSize: 15, color: '#333' },
  answerInput: { marginTop: 8 },
  inputLabel: { fontSize: 14, color: '#666', marginBottom: 8 },
  inputField: { backgroundColor: '#f8f8f8', borderRadius: 8, borderWidth: 1, borderColor: '#ddd', padding: 16, minHeight: 120 },
  inputText: { fontSize: 15, color: '#333' },
  inputPlaceholder: { fontSize: 15, color: '#999' },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee', gap: 12 },
  btn: { flex: 1, paddingVertical: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: '#007AFF' },
  btnPrimaryText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  btnSecondary: { backgroundColor: '#f0f0f0' },
  btnSecondaryText: { fontSize: 16, fontWeight: '600', color: '#666' },
});

export default ExamScreen;
