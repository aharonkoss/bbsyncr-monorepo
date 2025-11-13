// packages/shared/src/utils/storage/index.ts
export interface IStorage {
  getToken(): Promise<string | null>;
  saveToken(token: string): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  saveRefreshToken(token: string): Promise<void>;
  clearAll(): Promise<void>;
}
