import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

async function secureStoreAvailable() {
  try {
    return !isWeb && (await SecureStore.isAvailableAsync());
  } catch {
    return false;
  }
}

const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export const storage = {
  async saveItem(key, value) {
    const useSecure = await secureStoreAvailable();
    if (useSecure) {
      await SecureStore.setItemAsync(key, value);
    } else {
      await AsyncStorage.setItem(key, value);
    }
  },

  async getItem(key) {
    const useSecure = await secureStoreAvailable();
    return useSecure
      ? await SecureStore.getItemAsync(key)
      : await AsyncStorage.getItem(key);
  },

  async deleteItem(key) {
    const useSecure = await secureStoreAvailable();
    if (useSecure) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await AsyncStorage.removeItem(key);
    }
  },

  async saveToken(token) {
    await this.saveItem(TOKEN_KEY, token);
  },

  async getToken() {
    return this.getItem(TOKEN_KEY);
  },

  async saveRefreshToken(token) {
    await this.saveItem(REFRESH_TOKEN_KEY, token);
  },

  async getRefreshToken() {
    return this.getItem(REFRESH_TOKEN_KEY);
  },

  async saveUser(user) {
    await this.saveItem(USER_KEY, JSON.stringify(user)); // ✅ Store user object
  },

  async getUser() {
    const userData = await this.getItem(USER_KEY);
    return userData ? JSON.parse(userData) : null; // ✅ Retrieve user object
  },

  async clearAll() {
    await this.deleteItem(TOKEN_KEY);
    await this.deleteItem(REFRESH_TOKEN_KEY);
    await this.deleteItem(USER_KEY);
  },
};
