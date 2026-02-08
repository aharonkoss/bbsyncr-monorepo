import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.4.22:3001';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ CRITICAL: Send cookies with requests
});

// ✅ Request interceptor - Cookies are sent automatically
apiClient.interceptors.request.use(
  (config) => {
    // No need to manually add Authorization header
    // Cookies (httpOnly) are sent automatically with withCredentials: true
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.status, error.config?.url);
    
    if (error.response?.status === 401) {
      // Unauthorized - redirect to login
      console.log('🔒 Unauthorized - redirecting to login');
      
      // Get subdomain from current URL
      const pathname = window.location.pathname;
      const subdomainMatch = pathname.match(/^\/([^\/]+)\//);
      const subdomain = subdomainMatch ? subdomainMatch[1] : null;
      
      if (subdomain && subdomain !== 'admin') {
        window.location.href = `/${subdomain}/login`;
      } else {
        window.location.href = '/';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
