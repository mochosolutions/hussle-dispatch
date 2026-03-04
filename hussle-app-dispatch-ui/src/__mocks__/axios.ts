// Mock axios instance for Jest tests — prevents import.meta.env issues from config.ts
// Typed as Record to avoid strict type requirements in mock context
const axiosInstance = {
  get: () => Promise.resolve({ data: null }),
  post: () => Promise.resolve({ data: null }),
  put: () => Promise.resolve({ data: null }),
  delete: () => Promise.resolve({ data: null }),
  interceptors: {
    response: {
      use: () => undefined,
    },
  },
};

export default axiosInstance;
