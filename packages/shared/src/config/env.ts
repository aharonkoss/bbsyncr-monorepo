// Environment variables for both mobile and web
export const getApiBaseUrl = (): string => {
  // For React Native (mobile)
  if (typeof window === 'undefined') {
    return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';
  }
  
  // For Next.js (web)
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  return process.env.API_URL || 'http://localhost:3001';
};

export const API_CONFIG = {
  baseUrl: getApiBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};
