import axios from 'axios';
import config from '../config';

const axiosInstance = axios.create({
  baseURL: config.apiUrl,
  withCredentials: true,
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axios.post(`${config.apiUrl}/auth/refresh`, {}, { withCredentials: true });
        return axiosInstance(originalRequest);
      } catch {
        window.location.href = '/login';
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
