/**
 * 历史记录页面
 * 展示解题历史和练习记录
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type HistoryScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

interface HistoryItem {
  id: string;
  type: 'solve' | 'exam' | 'wrong';
  title: string;
  date: string;
  status: 'completed' | 'pending';
  score?: number;
  questionCount?: number;
}

const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'solve' | 'exam'>('all');
  const [history, setHistory] = useState<HistoryItem[]>([
    { id: '1', type: 'solve', title: '二次函数专项练习', date: '2026-04-28 15:30', status: 'completed', score: 85 },
    { id: '2', type: 'exam', title: '二次函数单元测试', date: '2026-04-27 10:00', status: 'completed', score: 78, questionCount: 20 },
    { id: '3', type: 'solve', title: '拍照解题 - 几何证明', date: '2026-04-26 20:15', status: 'completed', score: 100 },
    { id: '4', type: 'solve', title: '拍照解题 - 方程求解', date: '2026-04-25 18:45', status: 'completed', score: 90 },
    { id: '5', type: 'exam', title: '期中模拟考试', date: '2026-04-24 09:00', status: 'completed', score: 72, questionCount: 30 },
    { id: '6', type: 'wrong', title: '错题复习任务', date: '2026-04-23 19:00', status: 'pending' },
  ]);

  const filteredHistory = activeTab === 'all' ? history : history.filter((item) => item.type === activeTab);

  const TypeIcon = ({ type }: { type: string }) => {
    const icons: Record<string, string> = { solve: '📷', exam: '📝', wrong: '📕' };
    return <Text style={styles.typeIcon}>{icons[type] || '📄'}</Text>;
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => {
        if (item.type === 'exam') {
          navigation.navigate('ExamResult', { examId: item.id });
        } else if (item.type === 'solve') {
          navigation.navigate('SolveResult', { recordId: item.id });
        } else {
          navigation.navigate('WrongBook');
        }
      }}
    >
      <TypeIcon type={item.type} />
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>{item.date}</Text>
      </View>
      <View style={styles.itemRight}>
        {item.score !== undefined && (
          <View style={[styles.scoreBadge, item.score >= 80 ? styles.scoreGood : item.score >= 60 ? styles.scoreMedium : styles.scoreBad]}>
            <Text style={styles.scoreText}>{item.score}分</Text>
          </View>
        )}
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Tab切换 */}
      <View style={styles.tabBar}>
        {(['all', 'solve', 'exam'] as const).map((tab) => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'all' ? '全部' : tab === 'solve' ? '拍照解题' : '考试练习'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 历史列表 */}
      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无记录</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabBar: { flexDirection: 'row', backgroundColor: '#fff', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#007AFF', fontWeight: '600' },
  listContent: { padding: 16 },
  historyItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 2 },
  typeIcon: { fontSize: 24 },
  itemContent: { flex: 1, marginLeft: 12 },
  itemTitle: { fontSize: 15, fontWeight: '500', color: '#333' },
  itemDate: { fontSize: 12, color: '#999', marginTop: 4 },
  itemRight: { flexDirection: 'row', alignItems: 'center' },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginRight: 8 },
  scoreGood: { backgroundColor: '#E8F8ED' },
  scoreMedium: { backgroundColor: '#FFF4E6' },
  scoreBad: { backgroundColor: '#FFE4E4' },
  scoreText: { fontSize: 12, fontWeight: '600' },
  arrow: { fontSize: 20, color: '#ccc' },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 50 },
});

export default HistoryScreen;
