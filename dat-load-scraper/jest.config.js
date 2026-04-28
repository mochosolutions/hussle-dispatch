module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  testMatch: ['<rootDir>/src/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  globals: {
    'process.env.API_URL': 'http://localhost:3001',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react',
          module: 'commonjs',
          target: 'es2019',
          moduleResolution: 'node',
          esModuleInterop: true,
          resolveJsonModule: true,
          types: ['jest', 'node', 'chrome'],
        },
        diagnostics: { ignoreCodes: [7006, 7019, 7034, 7053] },
      },
    ],
  },
};
