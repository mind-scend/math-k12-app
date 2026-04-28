/**
 * 设置页面
 */
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type SettingsScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出当前账号吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '确定',
        onPress: () => {
          // TODO: 清除登录状态
          navigation.replace('Login');
        },
      },
    ]);
  };

  const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {showArrow && <Text style={styles.settingArrow}>›</Text>}
    </TouchableOpacity>
  );

  const Section = ({ title, children }: any) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* 用户信息 */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>小明</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.userName}>小明同学</Text>
          <Text style={styles.userLevel}>Lv.8 初中数学达人</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}>
          <Text style={styles.editBtnText}>编辑</Text>
        </TouchableOpacity>
      </View>

      {/* 通用设置 */}
      <Section title="通用设置">
        <SettingItem icon="🔔" title="消息通知" subtitle="接收推送和提醒" />
        <SettingItem icon="🌙" title="深色模式" subtitle="跟随系统" />
        <SettingItem icon="📶" title="网络设置" subtitle="自动检测" />
      </Section>

      {/* 学习设置 */}
      <Section title="学习设置">
        <SettingItem icon="📚" title="年级科目" subtitle="初三 · 数学" />
        <SettingItem icon="⏰" title="学习提醒" subtitle="每天20:00" />
        <SettingItem icon="🎯" title="每日目标" subtitle="20道题目" />
        <SettingItem icon="🔄" title="错题复习" subtitle="每隔3天" />
      </Section>

      {/* AI设置 */}
      <Section title="AI功能">
        <SettingItem icon="🤖" title="AI解题" subtitle="DeepSeek模型" />
        <SettingItem icon="📷" title="OCR识别" subtitle="百度OCR" />
      </Section>

      {/* 关于 */}
      <Section title="关于">
        <SettingItem icon="📖" title="使用帮助" />
        <SettingItem icon="📜" title="用户协议" />
        <SettingItem icon="🔒" title="隐私政策" />
        <SettingItem icon="⭐" title="给我们评分" />
        <SettingItem icon="ℹ️" title="关于我们" subtitle="版本 1.0.0" showArrow={false} />
      </Section>

      {/* 退出登录 */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>退出登录</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  profileCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#007AFF', padding: 20, marginBottom: 16 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 24, fontWeight: 'bold', color: '#007AFF' },
  profileInfo: { flex: 1, marginLeft: 16 },
  userName: { fontSize: 18, fontWeight: '600', color: '#fff' },
  userLevel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  editBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  editBtnText: { color: '#fff', fontSize: 13 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, color: '#666', paddingHorizontal: 16, paddingVertical: 8 },
  sectionContent: { backgroundColor: '#fff' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingIcon: { width: 36, height: 36, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center', justifyContent: 'center' },
  settingIconText: { fontSize: 18 },
  settingContent: { flex: 1, marginLeft: 12 },
  settingTitle: { fontSize: 15, color: '#333' },
  settingSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
  settingArrow: { fontSize: 20, color: '#ccc' },
  logoutBtn: { marginHorizontal: 16, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  logoutText: { fontSize: 16, color: '#FF3B30' },
  bottomPadding: { height: 30 },
});

export default SettingsScreen;
