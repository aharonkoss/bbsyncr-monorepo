// packages/shared/src/utils/storage/mobile.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { IStorage } from './index';

export const storage: IStorage = {
  getToken: () => AsyncStorage.getItem('token'),
  saveToken: (token) => AsyncStorage.setItem('token', token),
  // ... implement all methods
};
