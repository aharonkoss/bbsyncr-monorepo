// Configuration for API base URL
export const API_CONFIG = {
  // In production (Vercel), use relative path (will be rewritten to api.bbsynr.com)
  // In development, use localhost
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 
           (typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
             ? '/api'  // Production: relative path for Vercel rewrites
             : 'http://localhost:3001/api'), // Development: direct to local API
  timeout: 30000,
};

