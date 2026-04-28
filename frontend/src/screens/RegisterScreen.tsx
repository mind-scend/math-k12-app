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
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { register } from '../store/slices/userSlice';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const grades = ['初一', '初二', '初三', '高一', '高二', '高三'];

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('初一');
  const [countdown, setCountdown] = useState(0);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

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

  const handleRegister = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      Alert.alert('提示', '请输入正确的手机号');
      return;
    }
    if (!/^\d{4,6}$/.test(code)) {
      Alert.alert('提示', '请输入4-6位验证码');
      return;
    }
    if (!nickname.trim()) {
      Alert.alert('提示', '请输入昵称');
      return;
    }

    setLoading(true);
    try {
      await dispatch(
        register({ phone, code, nickname: nickname.trim(), grade: selectedGrade }) as any
      );
    } catch (error) {
      Alert.alert('注册失败', '请检查信息是否正确');
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

        {/* 步骤指示器 */}
        <View style={styles.stepIndicator}>
          {[1, 2].map((s) => (
            <View key={s} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  step >= s && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    step >= s && styles.stepNumberActive,
                  ]}
                >
                  {s}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  step >= s && styles.stepLabelActive,
                ]}
              >
                {s === 1 ? '验证手机' : '完善信息'}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 步骤1：手机验证 */}
          {step === 1 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>验证手机号</Text>
              <Text style={styles.subtitle}>
                用于登录和接收重要通知
              </Text>

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
                    <Text
                      style={[
                        styles.codeButtonText,
                        countdown > 0 && styles.codeButtonTextDisabled,
                      ]}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.nextButton, !phone && styles.nextButtonDisabled]}
                onPress={() => setStep(2)}
                disabled={!phone || !code}
              >
                <Text style={styles.nextButtonText}>下一步</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 步骤2：完善信息 */}
          {step === 2 && (
            <View style={styles.stepContent}>
              <Text style={styles.title}>完善信息</Text>
              <Text style={styles.subtitle}>
                昵称和年级帮助我们给你推荐更合适的内容
              </Text>

              <View style={styles.inputContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>昵称</Text>
                  <TextInput
                    style={styles.inputFull}
                    placeholder="给自己起个昵称"
                    placeholderTextColor="#999"
                    value={nickname}
                    onChangeText={setNickname}
                    maxLength={20}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>年级</Text>
                  <View style={styles.gradeGrid}>
                    {grades.map((grade) => (
                      <TouchableOpacity
                        key={grade}
                        style={[
                          styles.gradeItem,
                          selectedGrade === grade && styles.gradeItemActive,
                        ]}
                        onPress={() => setSelectedGrade(grade)}
                      >
                        <Text
                          style={[
                            styles.gradeText,
                            selectedGrade === grade && styles.gradeTextActive,
                          ]}
                        >
                          {grade}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                <Text style={styles.registerButtonText}>
                  {loading ? '注册中...' : '完成注册'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backStepButton}
                onPress={() => setStep(1)}
              >
                <Icon name="arrow-back" size={16} color="#4A90E2" />
                <Text style={styles.backStepText}>返回上一步</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>

        {/* 用户协议 */}
        <Text style={styles.agreementText}>
          注册即表示同意
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
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 60,
    marginTop: 20,
    marginBottom: 40,
  },
  stepItem: {
    alignItems: 'center',
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#4A90E2',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
  },
  stepNumberActive: {
    color: '#FFF',
  },
  stepLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  stepLabelActive: {
    color: '#4A90E2',
  },
  stepContent: {
    flex: 1,
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
    marginBottom: 32,
  },
  inputContainer: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
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
    fontSize: 16,
    color: '#1A1A1A',
  },
  inputFull: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
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
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gradeItem: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  gradeItemActive: {
    backgroundColor: '#E8F4FF',
    borderColor: '#4A90E2',
  },
  gradeText: {
    fontSize: 14,
    color: '#666',
  },
  gradeTextActive: {
    color: '#4A90E2',
    fontWeight: '500',
  },
  nextButton: {
    height: 56,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  registerButton: {
    height: 56,
    backgroundColor: '#4A90E2',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFF',
  },
  backStepButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    marginTop: 16,
  },
  backStepText: {
    fontSize: 14,
    color: '#4A90E2',
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

export default RegisterScreen;
