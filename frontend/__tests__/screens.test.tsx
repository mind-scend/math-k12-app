/**
 * Redux Store测试
 */
import { configureStore } from '@reduxjs/toolkit';
import userReducer, {
  setUser,
  setToken,
  clearUser,
  selectUser,
  selectIsLoggedIn,
} from '../src/store/slices/userSlice';

describe('Redux Store测试', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        user: userReducer,
      },
    });
  });

  describe('User Slice', () => {
    it('✓ 应该设置用户信息', () => {
      const userData = {
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        grade: 'grade_9',
      };

      store.dispatch(setUser(userData));
      const state = store.getState().user;

      expect(state.user).toEqual(userData);
      expect(state.isLoggedIn).toBe(true);
    });

    it('✓ 应该设置Token', () => {
      const token = 'test_token_12345';

      store.dispatch(setToken(token));
      const state = store.getState().user;

      expect(state.token).toBe(token);
    });

    it('✓ 应该清除用户信息', () => {
      // 先设置用户
      store.dispatch(setUser({ id: '123', username: 'test' }));
      store.dispatch(setToken('token'));

      // 再清除
      store.dispatch(clearUser());
      const state = store.getState().user;

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoggedIn).toBe(false);
    });

    it('✓ selectUser选择器应该正确工作', () => {
      store.dispatch(setUser({ id: '123', username: 'test' }));

      const user = selectUser(store.getState());
      expect(user).toEqual({ id: '123', username: 'test' });
    });

    it('✓ selectIsLoggedIn选择器应该正确工作', () => {
      expect(selectIsLoggedIn(store.getState())).toBe(false);

      store.dispatch(setUser({ id: '123' }));
      expect(selectIsLoggedIn(store.getState())).toBe(true);
    });
  });

  describe('Store集成', () => {
    it('✓ 完整的登录流程应该正确更新状态', () => {
      // 初始状态
      expect(store.getState().user.isLoggedIn).toBe(false);

      // 登录
      store.dispatch(setUser({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
      }));
      store.dispatch(setToken('jwt_token'));

      // 验证状态
      const state = store.getState().user;
      expect(state.isLoggedIn).toBe(true);
      expect(state.token).toBe('jwt_token');
      expect(state.user.email).toBe('test@example.com');
    });

    it('✓ 登出流程应该重置状态', () => {
      // 登录状态
      store.dispatch(setUser({ id: '123' }));
      store.dispatch(setToken('token'));

      // 登出
      store.dispatch(clearUser());

      // 验证状态已重置
      const state = store.getState().user;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isLoggedIn).toBe(false);
    });
  });
});
