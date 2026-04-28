import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

// 导入页面
import HomeScreen from '../screens/HomeScreen';
import CameraScreen from '../screens/CameraScreen';
import SolveResultScreen from '../screens/SolveResultScreen';
import WrongBookScreen from '../screens/WrongBookScreen';
import PaperGenerateScreen from '../screens/PaperGenerateScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';

// 类型定义
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Camera: undefined;
  SolveResult: { questionId: string; imageUrl?: string };
  PaperGenerate: { topic?: string; difficulty?: string };
};

export type MainTabParamList = {
  Home: undefined;
  WrongBook: undefined;
  Generate: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab图标组件
const TabIcon: React.FC<{ name: string; focused: boolean }> = ({ name, focused }) => (
  <View style={styles.tabIconContainer}>
    <Icon
      name={name}
      size={24}
      color={focused ? '#4A90E2' : '#999'}
    />
    {focused && <View style={styles.activeIndicator} />}
  </View>
);

// 主Tab导航
const MainTabs: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: '首页',
          tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="WrongBook"
        component={WrongBookScreen}
        options={{
          tabBarLabel: '错题本',
          tabBarIcon: ({ focused }) => <TabIcon name="book" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Generate"
        component={PaperGenerateScreen}
        options={{
          tabBarLabel: 'AI组卷',
          tabBarIcon: ({ focused }) => <TabIcon name="document-text" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: '我的',
          tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
};

// 根导航
export const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen
        name="Camera"
        component={CameraScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="SolveResult" component={SolveResultScreen} />
      <Stack.Screen name="PaperGenerate" component={PaperGenerateScreen} />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    height: 85,
    paddingBottom: 25,
    paddingTop: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4A90E2',
    marginTop: 4,
  },
});
