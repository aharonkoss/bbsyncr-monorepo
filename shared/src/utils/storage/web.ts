// packages/shared/src/utils/storage/web.ts
import { IStorage } from './index';

export const storage: IStorage = {
  getToken: async () => localStorage.getItem('token'),
  saveToken: async (token) => localStorage.setItem('token', token),
  // ... implement all methods
};
