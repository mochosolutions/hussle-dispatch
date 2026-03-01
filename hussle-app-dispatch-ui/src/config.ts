const config = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  appName: 'Hussle Dispatch',
} as const;

export default config;
