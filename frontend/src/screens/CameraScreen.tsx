import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { launchCamera, launchImageLibrary, CameraOptions, ImageLibraryOptions } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { questionApi } from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CameraScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // 拍照
  const takePhoto = useCallback(async () => {
    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      includeBase64: false,
    };

    try {
      const result = await launchCamera(options);
      if (result.assets && result.assets[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
        await uploadAndSolve(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('错误', '相机启动失败，请检查相机权限');
    }
  }, []);

  // 从相册选择
  const selectFromGallery = useCallback(async () => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1200,
      maxHeight: 1200,
      includeBase64: false,
    };

    try {
      const result = await launchImageLibrary(options);
      if (result.assets && result.assets[0]?.uri) {
        setSelectedImage(result.assets[0].uri);
        await uploadAndSolve(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('错误', '相册访问失败，请检查相册权限');
    }
  }, []);

  // 上传并解题
  const uploadAndSolve = async (imageUri: string) => {
    setLoading(true);
    setUploading(true);
    setProgress(0);

    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await questionApi.solve(imageUri);

      clearInterval(progressInterval);
      setProgress(100);
      setUploading(false);

      // 跳转到结果页
      navigation.replace('SolveResult', {
        questionId: response.questionId,
        imageUrl: imageUri,
      });
    } catch (error: any) {
      setUploading(false);
      Alert.alert(
        '解题失败',
        error.message || '抱歉，题目识别失败，请重新拍照或尝试手动输入',
        [
          { text: '重试', onPress: () => setSelectedImage(null) },
          { text: '取消', style: 'cancel' },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#1A1A1A" />

      {/* 顶部导航 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={28} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>拍照解题</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 相机预览区域 */}
      <View style={styles.cameraArea}>
        {!selectedImage ? (
          <View style={styles.placeholderContainer}>
            <View style={styles.placeholderFrame}>
              <Icon name="camera" size={64} color="#666" />
              <Text style={styles.placeholderText}>将题目放入框内</Text>
              <Text style={styles.placeholderHint}>
                确保题目清晰、光线充足
              </Text>
            </View>
            {/* 参考线 */}
            <View style={[styles.guideLine, styles.guideLineTop]} />
            <View style={[styles.guideLine, styles.guideLineBottom]} />
            <View style={[styles.guideLine, styles.guideLineLeft]} />
            <View style={[styles.guideLine, styles.guideLineRight]} />
          </View>
        ) : (
          <Image source={{ uri: selectedImage }} style={styles.previewImage} />
        )}

        {/* 上传中遮罩 */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4A90E2" />
            <Text style={styles.loadingText}>
              {uploading ? `正在上传...${progress}%` : 'AI正在解题中...'}
            </Text>
            {uploading && (
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${progress}%` }]}
                />
              </View>
            )}
          </View>
        )}
      </View>

      {/* 底部操作区 */}
      <View style={styles.bottomArea}>
        {!loading && (
          <>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={selectFromGallery}
              activeOpacity={0.8}
            >
              <Icon name="images" size={28} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePhoto}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner}>
                <Icon name="camera" size={36} color="#FFF" />
              </View>
            </TouchableOpacity>

            <View style={styles.spacer} />
          </>
        )}

        {/* 提示文字 */}
        <Text style={styles.tipText}>
          拍照时尽量让题目清晰可见，避免倾斜和阴影
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    color: '#FFF',
  },
  headerRight: {
    width: 44,
  },
  cameraArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderContainer: {
    width: '85%',
    aspectRatio: 3 / 4,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  placeholderFrame: {
    width: '100%',
    height: '100%',
    backgroundColor: '#2A2A2A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#444',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 18,
    color: '#FFF',
    marginTop: 16,
  },
  placeholderHint: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  guideLine: {
    position: 'absolute',
    backgroundColor: '#4A90E2',
  },
  guideLineTop: {
    top: -10,
    left: '10%',
    right: '10%',
    height: 2,
  },
  guideLineBottom: {
    bottom: -10,
    left: '10%',
    right: '10%',
    height: 2,
  },
  guideLineLeft: {
    left: -10,
    top: '20%',
    bottom: '20%',
    width: 2,
  },
  guideLineRight: {
    right: -10,
    top: '20%',
    bottom: '20%',
    width: 2,
  },
  previewImage: {
    width: '85%',
    aspectRatio: 3 / 4,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFF',
    marginTop: 20,
  },
  progressBar: {
    width: '60%',
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4A90E2',
    borderRadius: 2,
  },
  bottomArea: {
    paddingHorizontal: 40,
    paddingVertical: 30,
    alignItems: 'center',
  },
  galleryButton: {
    position: 'absolute',
    left: 40,
    bottom: 50,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4A90E2',
    borderWidth: 3,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spacer: {
    width: 56,
  },
  tipText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 16,
  },
});

export default CameraScreen;
