import axios, { AxiosInstance } from 'axios';

export const createHttpClient = (
  getToken: () => Promise<string | null>
): AxiosInstance => {
  const client = axios.create({
    timeout: 30000,
    withCredentials: true,
  });

  client.interceptors.request.use(
    async (config) => {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  return client;
};