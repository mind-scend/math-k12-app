/**
 * 学习报告页面
 * 展示用户的学习数据统计
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type ReportScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

interface StudyStats {
  totalQuestions: number;
  correctRate: number;
  studyTime: number;
  streakDays: number;
  weakPoints: string[];
  strongPoints: string[];
  weeklyData: { day: string; count: number }[];
  topicDistribution: { topic: string; count: number; rate: number }[];
}

const ReportScreen: React.FC<ReportScreenProps> = ({ navigation }) => {
  const [stats, setStats] = useState<StudyStats | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    // TODO: 从API加载数据
    const mockStats: StudyStats = {
      totalQuestions: 1250,
      correctRate: 78.5,
      studyTime: 42.5,
      streakDays: 15,
      weakPoints: ['二次函数', '三角函数', '解析几何'],
      strongPoints: ['一元一次方程', '平面几何', '概率统计'],
      weeklyData: [
        { day: '周一', count: 45 },
        { day: '周二', count: 62 },
        { day: '周三', count: 38 },
        { day: '周四', count: 55 },
        { day: '周五', count: 70 },
        { day: '周六', count: 85 },
        { day: '周日', count: 50 },
      ],
      topicDistribution: [
        { topic: '代数', count: 450, rate: 36 },
        { topic: '几何', count: 380, rate: 30 },
        { topic: '函数', count: 250, rate: 20 },
        { topic: '概率', count: 120, rate: 10 },
        { topic: '其他', count: 50, rate: 4 },
      ],
    };
    setStats(mockStats);
  };

  if (!stats) {
    return <View style={styles.container}><Text style={styles.loadingText}>加载中...</Text></View>;
  }

  const maxCount = Math.max(...stats.weeklyData.map((d) => d.count));

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 顶部标题 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>学习报告</Text>
        <Text style={styles.headerSubtitle}>2026年4月第4周</Text>
      </View>

      {/* 核心数据卡片 */}
      <View style={styles.coreStats}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.totalQuestions}</Text>
          <Text style={styles.statLabel}>累计做题</Text>
        </View>
        <View style={[styles.statCard, styles.statCardHighlight]}>
          <Text style={[styles.statValue, styles.statValueHighlight]}>{stats.correctRate}%</Text>
          <Text style={[styles.statLabel, styles.statLabelHighlight]}>正确率</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{stats.studyTime}h</Text>
          <Text style={styles.statLabel}>学习时长</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>{stats.streakDays}天</Text>
          <Text style={styles.statLabel}>连续学习</Text>
        </View>
      </View>

      {/* 本周趋势图 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📈 本周学习趋势</Text>
        <View style={styles.chartCard}>
          <View style={styles.barChart}>
            {stats.weeklyData.map((item, index) => (
              <View key={index} style={styles.barContainer}>
                <View style={styles.barWrapper}>
                  <View
                    style={[
                      styles.bar,
                      { height: `${(item.count / maxCount) * 100}%` },
                      index === 5 && styles.barHighlight,
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.day}</Text>
                <Text style={styles.barValue}>{item.count}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 知识点分布 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📚 知识点分布</Text>
        <View style={styles.chartCard}>
          {stats.topicDistribution.map((item, index) => (
            <View key={index} style={styles.topicRow}>
              <Text style={styles.topicName}>{item.topic}</Text>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBar, { width: `${item.rate}%` }]} />
              </View>
              <Text style={styles.topicCount}>{item.count}题</Text>
              <Text style={styles.topicRate}>{item.rate}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 薄弱/强项分析 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🎯 知识点掌握情况</Text>
        <View style={styles.analysisCard}>
          <View style={styles.analysisSection}>
            <Text style={styles.weakTitle}>⚠️ 需要加强</Text>
            <View style={styles.tagContainer}>
              {stats.weakPoints.map((point, index) => (
                <View key={index} style={styles.weakTag}>
                  <Text style={styles.weakTagText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
          <View style={styles.analysisSection}>
            <Text style={styles.strongTitle}>✨ 掌握良好</Text>
            <View style={styles.tagContainer}>
              {stats.strongPoints.map((point, index) => (
                <View key={index} style={styles.strongTag}>
                  <Text style={styles.strongTagText}>{point}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* 学习建议 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 学习建议</Text>
        <View style={styles.suggestionCard}>
          <Text style={styles.suggestionText}>
            1. 二次函数是本周的薄弱点，建议每天做5道相关练习{'\n\n'}
            2. 周末学习时间最长，建议保持这个节奏{'\n\n'}
            3. 解析几何需要加强图形的理解能力{'\n\n'}
            4. 继续保持连续学习的好习惯！
          </Text>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingText: { textAlign: 'center', marginTop: 100, fontSize: 16, color: '#666' },
  header: { padding: 20, backgroundColor: '#007AFF' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  coreStats: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, marginTop: -30 },
  statCard: { width: (width - 48) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 16, margin: 6, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  statCardHighlight: { backgroundColor: '#007AFF' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  statValueHighlight: { color: '#fff' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  statLabelHighlight: { color: 'rgba(255,255,255,0.8)' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  chartCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  barChart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150, paddingTop: 20 },
  barContainer: { flex: 1, alignItems: 'center' },
  barWrapper: { height: 120, width: 24, justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: '#E8F4FF', borderRadius: 4, minHeight: 8 },
  barHighlight: { backgroundColor: '#007AFF' },
  barLabel: { fontSize: 10, color: '#666', marginTop: 4 },
  barValue: { fontSize: 10, color: '#999', marginTop: 2 },
  topicRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  topicName: { width: 50, fontSize: 13, color: '#333' },
  progressBarContainer: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, marginHorizontal: 8 },
  progressBar: { height: '100%', backgroundColor: '#007AFF', borderRadius: 4 },
  topicCount: { width: 50, fontSize: 12, color: '#666', textAlign: 'right' },
  topicRate: { width: 40, fontSize: 12, color: '#999', textAlign: 'right' },
  analysisCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  analysisSection: { marginBottom: 16 },
  weakTitle: { fontSize: 14, color: '#FF3B30', marginBottom: 8 },
  strongTitle: { fontSize: 14, color: '#34C759', marginBottom: 8 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  weakTag: { backgroundColor: '#FFE4E4', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  weakTagText: { fontSize: 13, color: '#FF3B30' },
  strongTag: { backgroundColor: '#E8F8ED', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  strongTagText: { fontSize: 13, color: '#34C759' },
  suggestionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  suggestionText: { fontSize: 14, lineHeight: 22, color: '#333' },
  bottomPadding: { height: 30 },
});

export default ReportScreen;
