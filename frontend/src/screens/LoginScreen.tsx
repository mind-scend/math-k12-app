import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { login } from '../store/slices/userSlice';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);

  const sendCode = () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    Alert.alert('提示', '验证码已发送');
  };

  const handleLogin = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
    if (!/^\d{4,6}$/.test(code)) {
      Alert.alert('提示', '请输入4-6位验证码');
      return;
    }

    setLoading(true);
    try {
      await dispatch(login({ phone, code }) as any);
    } catch (error) {
      Alert.alert('登录失败', '请检查验证码是否正确');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* 返回按钮 */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={28} color="#1A1A1A" />
        </TouchableOpacity>

        {/* 标题 */}
        <View style={styles.header}>
          <Text style={styles.title}>欢迎回来</Text>
          <Text style={styles.subtitle}>登录后享受更多功能</Text>
        </View>

        {/* 手机号输入 */}
        <View style={styles.inputContainer}>
          <View style={styles.phoneInput}>
            <Text style={styles.phonePrefix}>+86</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入手机号"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={11}
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* 验证码输入 */}
          <View style={styles.codeInputRow}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="请输入验证码"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={6}
              value={code}
              onChangeText={setCode}
            />
            <TouchableOpacity
              style={[styles.codeButton, countdown > 0 && styles.codeButtonDisabled]}
              onPress={sendCode}
              disabled={countdown > 0}
            >
              <Text style={[styles.codeButtonText, countdown > 0 && styles.codeButtonTextDisabled]}>
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 登录按钮 */}
        <TouchableOpacity
          style={[styles.loginButton, loading && styles.loginButtonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading ? '登录中...' : '登录'}
          </Text>
        </TouchableOpacity>

        {/* 注册入口 */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>还没有账号？</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>立即注册</Text>
          </TouchableOpacity>
        </View>

        {/* 其他登录方式 */}
        <View style={styles.otherLogin}>
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>其他登录方式</Text>
            <View style={styles.dividerLine} />
          </View>
          <View style={styles.otherLoginButtons}>
            <TouchableOpacity style={styles.otherLoginButton}>
              <Icon name="logo-wechat" size={28} color="#07C160" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.otherLoginButton}>
              <Icon name="logo-apple" size={28} color="#1A1A1A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 用户协议 */}
        <Text style={styles.agreementText}>
          登录即表示同意
          <Text style={styles.agreementLink}>《用户协议》</Text>
          和
          <Text style={styles.agreementLink}>《隐私政策》</Text>
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    marginTop: 8,
  },
  header: {
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A1A1A',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginTop: 8,
  },
  inputContainer: {
    gap: 16,
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  phonePrefix: {
    fontSize: 16,
    color: '#1A1A1A',
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  codeInputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  codeButton: {
    width: 120,
    height: 56,
    backgroundColor: '#E8F4FF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeButtonDisabled: {
    backgroundColor: '#F0F0F0',
  },
  codeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A90E2',
  },
  codeButtonTextDisabled: {
    color: '#999',
  },
  loginButton: {
    height: 56,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  registerText: {
    fontSize: 14,
    color: '#666',
  },
  registerLink: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '500',
  },
  otherLogin: {
    marginTop: 40,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 13,
    color: '#999',
  },
  otherLoginButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 24,
  },
  otherLoginButton: {
    width: 56,
    height: 56,
    backgroundColor: '#F5F7FA',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agreementText: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  agreementLink: {
    color: '#4A90E2',
  },
});

export default LoginScreen;
