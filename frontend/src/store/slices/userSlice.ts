import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  grade: string;
  vipLevel: 'free' | 'standard' | 'premium';
  vipExpireTime?: string;
  totalQuestions: number;
  totalCorrect: number;
  createdAt: string;
}

interface UserState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UserState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

// 异步Thunks
export const login = createAsyncThunk(
  'user/login',
  async ({ phone, code }: { phone: string; code: string }, { rejectWithValue }) => {
    try {
      const response = await apiService.post('/auth/login', { phone, code });
      await AsyncStorage.setItem('token', response.token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '登录失败');
    }
  }
);

export const register = createAsyncThunk(
  'user/register',
  async (
    { phone, code, nickname, grade }: { phone: string; code: string; nickname: string; grade: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiService.post('/auth/register', { phone, code, nickname, grade });
      await AsyncStorage.setItem('token', response.token);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '注册失败');
    }
  }
);

export const fetchUserInfo = createAsyncThunk(
  'user/fetchUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiService.get('/user/info');
      return response;
    } catch (error: any) {
      return rejectWithValue(error.message || '获取用户信息失败');
    }
  }
);

export const logout = createAsyncThunk('user/logout', async () => {
  await AsyncStorage.removeItem('token');
  return null;
});

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch User Info
      .addCase(fetchUserInfo.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { setUser, setToken, clearError } = userSlice.actions;
export default userSlice.reducer;
