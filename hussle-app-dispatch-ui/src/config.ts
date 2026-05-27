const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

const config = {
  apiUrl,
  appName: 'Hussle Dispatch',
  map: {
    styleUrl: `${apiUrl}/api/v1/maps/style.json`,
  },
} as const;

export default config;
