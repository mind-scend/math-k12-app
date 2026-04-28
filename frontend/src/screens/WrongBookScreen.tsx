import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { questionApi } from '../services/api';

interface WrongQuestion {
  id: string;
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  knowledgePoints: string[];
  wrongCount: number;
  lastWrongTime: string;
  mastered: boolean;
}

const WrongBookScreen: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unmastered' | 'mastered'>('all');
  const [wrongQuestions, setWrongQuestions] = useState<WrongQuestion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWrongQuestions();
  }, [selectedFilter]);

  const fetchWrongQuestions = async () => {
    try {
      const response = await questionApi.getWrongBook({ page: 1, pageSize: 50 });
      setWrongQuestions(response.questions || []);
    } catch (error) {
      console.error('获取错题本失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWrongQuestions();
    setRefreshing(false);
  };

  const filteredQuestions = wrongQuestions.filter((q) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unmastered') return !q.mastered;
    if (selectedFilter === 'mastered') return q.mastered;
    return true;
  });

  const renderFilterItem = (filter: 'all' | 'unmastered' | 'mastered', label: string, count: number) => (
    <TouchableOpacity
      style={[styles.filterItem, selectedFilter === filter && styles.filterItemActive]}
      onPress={() => setSelectedFilter(filter)}
    >
      <Text style={[styles.filterText, selectedFilter === filter && styles.filterTextActive]}>
        {label}
      </Text>
      <View style={[styles.filterBadge, selectedFilter === filter && styles.filterBadgeActive]}>
        <Text style={[styles.filterBadgeText, selectedFilter === filter && styles.filterBadgeTextActive]}>
          {count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderItem = ({ item }: { item: WrongQuestion }) => (
    <TouchableOpacity style={styles.questionCard} activeOpacity={0.8}>
      <View style={styles.questionHeader}>
        <View style={styles.knowledgeTags}>
          {item.knowledgePoints.slice(0, 2).map((point, index) => (
            <View key={index} style={styles.knowledgeTag}>
              <Text style={styles.knowledgeTagText}>{point}</Text>
            </View>
          ))}
        </View>
        <View style={[styles.statusBadge, item.mastered ? styles.statusMastered : styles.statusUnmastered]}>
          <Text style={[styles.statusText, item.mastered ? styles.statusTextMastered : styles.statusTextUnmastered]}>
            {item.mastered ? '已掌握' : '待复习'}
          </Text>
        </View>
      </View>

      <Text style={styles.questionText} numberOfLines={3}>
        {item.questionText}
      </Text>

      <View style={styles.answerRow}>
        <View style={styles.answerItem}>
          <Text style={styles.answerLabel}>正确答案</Text>
          <Text style={[styles.answerText, styles.correctAnswer]}>{item.correctAnswer}</Text>
        </View>
        <View style={styles.answerItem}>
          <Text style={styles.answerLabel}>你的答案</Text>
          <Text style={[styles.answerText, styles.wrongAnswer]}>{item.userAnswer}</Text>
        </View>
      </View>

      <View style={styles.questionFooter}>
        <View style={styles.wrongCount}>
          <Icon name="refresh" size={14} color="#FF9500" />
          <Text style={styles.wrongCountText}>错误 {item.wrongCount} 次</Text>
        </View>
        <Text style={styles.lastWrongTime}>{item.lastWrongTime}</Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="play-circle" size={20} color="#4A90E2" />
          <Text style={styles.actionButtonText}>重新练习</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.actionButtonPrimary]}>
          <Icon name="checkmark-circle" size={20} color="#FFF" />
          <Text style={[styles.actionButtonText, styles.actionButtonTextPrimary]}>标记掌握</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="checkmark-circle" size={80} color="#34C759" />
      <Text style={styles.emptyTitle}>太棒了！</Text>
      <Text style={styles.emptySubtitle}>暂无错题，保持好成绩</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* 顶部标题 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>错题本</Text>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editButtonText}>编辑</Text>
        </TouchableOpacity>
      </View>

      {/* 统计数据 */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{wrongQuestions.length}</Text>
          <Text style={styles.statLabel}>总错题</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF9500' }]}>
            {wrongQuestions.filter((q) => !q.mastered).length}
          </Text>
          <Text style={styles.statLabel}>待复习</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#34C759' }]}>
            {wrongQuestions.filter((q) => q.mastered).length}
          </Text>
          <Text style={styles.statLabel}>已掌握</Text>
        </View>
      </View>

      {/* 筛选标签 */}
      <View style={styles.filterContainer}>
        {renderFilterItem('all', '全部', wrongQuestions.length)}
        {renderFilterItem(
          'unmastered',
          '待复习',
          wrongQuestions.filter((q) => !q.mastered).length
        )}
        {renderFilterItem(
          'mastered',
          '已掌握',
          wrongQuestions.filter((q) => q.mastered).length
        )}
      </View>

      {/* 错题列表 */}
      <FlatList
        data={filteredQuestions}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editButtonText: {
    fontSize: 15,
    color: '#4A90E2',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#FFF',
    marginTop: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#F0F0F0',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderRadius: 20,
    gap: 6,
  },
  filterItemActive: {
    backgroundColor: '#4A90E2',
  },
  filterText: {
    fontSize: 13,
    color: '#666',
  },
  filterTextActive: {
    color: '#FFF',
  },
  filterBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  filterBadgeText: {
    fontSize: 11,
    color: '#666',
  },
  filterBadgeTextActive: {
    color: '#FFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  questionCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  knowledgeTags: {
    flexDirection: 'row',
    gap: 6,
  },
  knowledgeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F4FF',
    borderRadius: 4,
  },
  knowledgeTagText: {
    fontSize: 11,
    color: '#4A90E2',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusMastered: {
    backgroundColor: '#E8FFE8',
  },
  statusUnmastered: {
    backgroundColor: '#FFF3E8',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusTextMastered: {
    color: '#34C759',
  },
  statusTextUnmastered: {
    color: '#FF9500',
  },
  questionText: {
    fontSize: 15,
    color: '#1A1A1A',
    lineHeight: 22,
    marginBottom: 12,
  },
  answerRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  answerItem: {
    flex: 1,
  },
  answerLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  answerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  correctAnswer: {
    color: '#34C759',
  },
  wrongAnswer: {
    color: '#FF3B30',
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  wrongCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  wrongCountText: {
    fontSize: 12,
    color: '#FF9500',
  },
  lastWrongTime: {
    fontSize: 12,
    color: '#999',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    backgroundColor: '#E8F4FF',
    borderRadius: 8,
  },
  actionButtonPrimary: {
    backgroundColor: '#4A90E2',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#4A90E2',
    fontWeight: '500',
  },
  actionButtonTextPrimary: {
    color: '#FFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
});

export default WrongBookScreen;
