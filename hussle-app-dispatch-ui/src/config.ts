const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';
const wsUrl = import.meta.env.VITE_WS_URL ?? apiUrl;

const config = {
  apiUrl,
  wsUrl,
  appName: 'Hussle Dispatch',
  map: {
    styleUrl: `${apiUrl}/api/v1/maps/style.json`,
  },
} as const;

export default config;
