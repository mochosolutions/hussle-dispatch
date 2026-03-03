export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    // Resolve emotion to the workspace's own installation (not root node_modules).
    // @mui/styled-engine lives in root node_modules and requires @emotion/styled,
    // but @emotion/styled is only installed in the workspace, not the root.
    '^@emotion/styled$': '<rootDir>/node_modules/@emotion/styled',
    '^@emotion/styled/(.*)$': '<rootDir>/node_modules/@emotion/styled/$1',
    '^@emotion/react$': '<rootDir>/node_modules/@emotion/react',
    '^@emotion/react/(.*)$': '<rootDir>/node_modules/@emotion/react/$1',
    '^store$': '<rootDir>/src/store',
    '^store/(.*)$': '<rootDir>/src/store/$1',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
    '^components/(.*)$': '<rootDir>/src/components/$1',
    '^pages/(.*)$': '<rootDir>/src/pages/$1',
    '^hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^types/(.*)$': '<rootDir>/src/types/$1',
    '\\.(css|png|svg)$': 'identity-obj-proxy',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)', '**/*.test.(ts|tsx)'],
};
