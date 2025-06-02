import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG } from '@/constants/api-config';

// Create a custom axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_CONFIG.MARKET_DATA_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': '*/*',
  }
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can modify the request config here
    // For example, add authentication tokens, logging, etc.
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Request Error:', error);
    }
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // You can modify the response here
    // For example, transform data, handle specific status codes, etc.
    if (process.env.NODE_ENV === 'development') {
      console.log(`API Response: ${response.status} ${response.config.url}`);
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('API Response Error:', error);
    }
    return Promise.reject(error);
  }
);

// Helper function to make GET requests
export const apiGet = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.get(url, config);
  return response.data;
};

// Helper function to make POST requests
export const apiPost = async <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
  const response: AxiosResponse<T> = await apiClient.post(url, data, config);
  return response.data;
};

export default apiClient;
