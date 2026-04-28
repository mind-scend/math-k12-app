import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  RefreshControl,
  StatusBar,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootState } from '../store';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.user.user);
  const [refreshing, setRefreshing] = useState(false);

  // 下拉刷新
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 顶部区域 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {user?.nickname ? `你好，${user.nickname}` : '你好，同学'}
          </Text>
          <Text style={styles.subGreeting}>今天也要加油哦 💪</Text>
        </View>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={() => navigation.navigate('Main', { screen: 'Profile' } as any)}
        >
          <View style={styles.avatar}>
            <Icon name="person" size={24} color="#FFF" />
          </View>
          {user?.vipLevel !== 'free' && (
            <View style={styles.vipBadge}>
              <Icon name="star" size={10} color="#FFD700" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* VIP Banner */}
      {user?.vipLevel === 'free' && (
        <TouchableOpacity style={styles.vipBanner} activeOpacity={0.8}>
          <View style={styles.vipBannerLeft}>
            <Icon name="diamond" size={24} color="#FFD700" />
            <View style={styles.vipBannerText}>
              <Text style={styles.vipBannerTitle}>解锁全部功能</Text>
              <Text style={styles.vipBannerSubtitle}>体验AI智能组卷、无限练习</Text>
            </View>
          </View>
          <View style={styles.vipBannerRight}>
            <Text style={styles.vipBannerPrice}>¥29</Text>
            <Text style={styles.vipBannerUnit}>/月</Text>
          </View>
        </TouchableOpacity>
      )}

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 核心功能区 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>开始学习</Text>
          <View style={styles.mainFeatureGrid}>
            {/* 拍照解题 */}
            <TouchableOpacity
              style={[styles.featureCard, styles.featureCardLarge]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Camera')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#E8F4FF' }]}>
                <Icon name="camera" size={32} color="#4A90E2" />
              </View>
              <Text style={styles.featureTitle}>拍照解题</Text>
              <Text style={styles.featureDesc}>拍一拍，AI帮你讲</Text>
              <View style={styles.featureTag}>
                <Text style={styles.featureTagText}>AI精讲</Text>
              </View>
            </TouchableOpacity>

            {/* 错题本 */}
            <TouchableOpacity
              style={[styles.featureCard, styles.featureCardSmall]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('WrongBook')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#FFF3E8' }]}>
                <Icon name="book" size={28} color="#FF9500" />
              </View>
              <Text style={styles.featureTitleSmall}>错题本</Text>
              <Text style={styles.featureDescSmall}>
                {user?.totalQuestions || 0} 道错题待复习
              </Text>
            </TouchableOpacity>

            {/* AI组卷 */}
            <TouchableOpacity
              style={[styles.featureCard, styles.featureCardSmall]}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('PaperGenerate')}
            >
              <View style={[styles.featureIcon, { backgroundColor: '#E8FFE8' }]}>
                <Icon name="document-text" size={28} color="#34C759" />
              </View>
              <Text style={styles.featureTitleSmall}>AI组卷</Text>
              <Text style={styles.featureDescSmall}>智能生成专属试卷</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 学习统计 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>学习统计</Text>
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.totalQuestions || 0}</Text>
              <Text style={styles.statLabel}>累计解题</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {user?.totalQuestions
                  ? Math.round((user.totalCorrect / user.totalQuestions) * 100)
                  : 0}%
              </Text>
              <Text style={styles.statLabel}>正确率</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>连续天数</Text>
            </View>
          </View>
        </View>

        {/* 每日推荐 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>每日推荐</Text>
            <TouchableOpacity>
              <Text style={styles.moreLink}>查看更多</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendList}
          >
            {[1, 2, 3].map((item) => (
              <TouchableOpacity key={item} style={styles.recommendCard} activeOpacity={0.8}>
                <View style={styles.recommendImage}>
                  <Icon name="school" size={40} color="#4A90E2" />
                </View>
                <Text style={styles.recommendTitle}>初一数学期末模拟</Text>
                <Text style={styles.recommendMeta}>15道题 · 约30分钟</Text>
                <View style={styles.recommendTags}>
                  <View style={styles.recommendTag}>
                    <Text style={styles.recommendTagText}>有理数</Text>
                  </View>
                  <View style={[styles.recommendTag, styles.recommendTagBlue]}>
                    <Text style={[styles.recommendTagText, styles.recommendTagTextBlue]}>
                      中等难度
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 底部安全区 */}
        <View style={styles.bottomSafe} />
      </ScrollView>
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
    backgroundColor: '#FFFFFF',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subGreeting: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  avatarButton: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 12,
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
  },
  vipBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipBannerText: {
    marginLeft: 12,
  },
  vipBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFD700',
  },
  vipBannerSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  vipBannerRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  vipBannerPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  vipBannerUnit: {
    fontSize: 12,
    color: '#999',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  moreLink: {
    fontSize: 14,
    color: '#4A90E2',
  },
  mainFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  featureCardLarge: {
    width: '48%',
    height: 160,
  },
  featureCardSmall: {
    width: '48%',
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
  },
  featureDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  featureTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#E8F4FF',
    borderRadius: 4,
    marginTop: 8,
  },
  featureTagText: {
    fontSize: 10,
    color: '#4A90E2',
    fontWeight: '500',
  },
  featureTitleSmall: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginLeft: 12,
  },
  featureDescSmall: {
    fontSize: 12,
    color: '#666',
    marginLeft: 12,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4A90E2',
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
    alignSelf: 'center',
  },
  recommendList: {
    paddingRight: 20,
  },
  recommendCard: {
    width: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginRight: 12,
  },
  recommendImage: {
    width: '100%',
    height: 80,
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recommendTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 12,
  },
  recommendMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  recommendTags: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 6,
  },
  recommendTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#FFF3E8',
    borderRadius: 4,
  },
  recommendTagBlue: {
    backgroundColor: '#E8F4FF',
  },
  recommendTagText: {
    fontSize: 10,
    color: '#FF9500',
  },
  recommendTagTextBlue: {
    color: '#4A90E2',
  },
  bottomSafe: {
    height: 100,
  },
});

export default HomeScreen;
