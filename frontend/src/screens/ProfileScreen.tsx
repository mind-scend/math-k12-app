import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootState } from '../store';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const user = useSelector((state: RootState) => state.user.user);

  const menuItems = [
    { icon: 'person', title: '个人信息', route: 'Profile' },
    { icon: 'diamond', title: '会员中心', route: 'Profile' },
    { icon: 'time', title: '历史记录', route: 'Profile' },
    { icon: 'settings', title: '设置', route: 'Profile' },
    { icon: 'help-circle', title: '帮助与反馈', route: 'Profile' },
    { icon: 'information-circle', title: '关于我们', route: 'Profile' },
  ];

  const getVipBadgeColor = (level: string) => {
    switch (level) {
      case 'premium':
        return '#FFD700';
      case 'standard':
        return '#C0C0C0';
      default:
        return '#999';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7FA" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 用户信息卡片 */}
        <View style={styles.profileCard}>
          <View style={styles.userInfo}>
            <View style={styles.avatarContainer}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Icon name="person" size={32} color="#FFF" />
                </View>
              )}
              {user?.vipLevel !== 'free' && (
                <View
                  style={[
                    styles.vipBadge,
                    { backgroundColor: getVipBadgeColor(user.vipLevel) },
                  ]}
                >
                  <Icon name="star" size={12} color="#FFF" />
                </View>
              )}
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.nickname}>
                {user?.nickname || '点击登录'}
              </Text>
              <Text style={styles.phone}>
                {user?.phone || '登录后享受更多功能'}
              </Text>
              {user?.vipLevel !== 'free' && (
                <View style={styles.vipTag}>
                  <Text style={styles.vipTagText}>
                    {user?.vipLevel === 'premium' ? '旗舰会员' : '标准会员'}
                  </Text>
                  <Text style={styles.vipExpireText}>
                    {' '}
                    · 到期 {user?.vipExpireTime || '—'}
                  </Text>
                </View>
              )}
            </View>
            {user?.vipLevel === 'free' && (
              <TouchableOpacity style={styles.upgradeButton}>
                <Text style={styles.upgradeButtonText}>开通会员</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* 学习统计 */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user?.totalQuestions || 0}</Text>
              <Text style={styles.statLabel}>累计解题</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {user?.totalQuestions
                  ? Math.round((user.totalCorrect / user.totalQuestions) * 100)
                  : 0}
                %
              </Text>
              <Text style={styles.statLabel}>正确率</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>7</Text>
              <Text style={styles.statLabel}>连续打卡</Text>
            </View>
          </View>
        </View>

        {/* 功能菜单 */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              activeOpacity={0.8}
            >
              <View style={styles.menuItemLeft}>
                <View style={styles.menuIcon}>
                  <Icon name={item.icon} size={22} color="#4A90E2" />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Icon name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
          ))}
        </View>

        {/* 退出登录 */}
        {user && (
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8}>
            <Text style={styles.logoutButtonText}>退出登录</Text>
          </TouchableOpacity>
        )}

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
  profileCard: {
    backgroundColor: '#FFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vipBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  userDetails: {
    flex: 1,
    marginLeft: 16,
  },
  nickname: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  phone: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  vipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  vipTagText: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '500',
  },
  vipExpireText: {
    fontSize: 12,
    color: '#999',
  },
  upgradeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFD700',
    borderRadius: 16,
  },
  upgradeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#F0F0F0',
  },
  menuSection: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E8F4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuTitle: {
    fontSize: 15,
    color: '#1A1A1A',
    marginLeft: 12,
  },
  logoutButton: {
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: 15,
    color: '#FF3B30',
  },
  bottomSafe: {
    height: 100,
  },
});

export default ProfileScreen;
