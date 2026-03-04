export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    // Resolve emotion to the workspace's own installation (not root node_modules).
    // @mui/styled-engine lives in root node_modules and requires @emotion/styled,
    // but @emotion/styled is only installed in the workspace, not the root.
    '^@emotion/styled$': '<rootDir>/node_modules/@emotion/styled',
    '^@emotion/styled/(.*)$': '<rootDir>/node_modules/@emotion/styled/$1',
    '^@emotion/react$': '<rootDir>/node_modules/@emotion/react',
    '^@emotion/react/(.*)$': '<rootDir>/node_modules/@emotion/react/$1',
    // Resolve testing-library to workspace installation to avoid version mismatches
    '^@testing-library/dom$': '<rootDir>/node_modules/@testing-library/dom',
    '^@testing-library/react$': '<rootDir>/node_modules/@testing-library/react',
    '^@testing-library/jest-dom$': '<rootDir>/node_modules/@testing-library/jest-dom',
    // Mock axios to avoid import.meta.env issues from config.ts
    // Must be listed before the generic utils/* pattern
    '^utils/axios$': '<rootDir>/src/__mocks__/axios.ts',
    // Path alias mappings
    '^store$': '<rootDir>/src/store',
    '^store/(.*)$': '<rootDir>/src/store/$1',
    '^utils/(.*)$': '<rootDir>/src/utils/$1',
    '^components/(.*)$': '<rootDir>/src/components/$1',
    '^pages/(.*)$': '<rootDir>/src/pages/$1',
    '^hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^types/(.*)$': '<rootDir>/src/types/$1',
    // mocho-ui subpath mappings
    '^@mocho/ui/redux$': '<rootDir>/../node_modules/@mocho/ui/dist/redux/index.cjs',
    '^@mocho/ui/components$': '<rootDir>/../node_modules/@mocho/ui/dist/components/index.cjs',
    '^@mocho/ui/forms$': '<rootDir>/../node_modules/@mocho/ui/dist/forms/index.cjs',
    '^@mocho/ui/hooks$': '<rootDir>/../node_modules/@mocho/ui/dist/hooks/index.cjs',
    '^@mocho/ui/utils$': '<rootDir>/../node_modules/@mocho/ui/dist/utils/index.cjs',
    '^@mocho/ui/types$': '<rootDir>/../node_modules/@mocho/ui/dist/types/index.cjs',
    '^@mocho/ui$': '<rootDir>/../node_modules/@mocho/ui/dist/index.cjs',
    '\\.(css|png|svg)$': '<rootDir>/node_modules/identity-obj-proxy',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)', '**/*.test.(ts|tsx)'],
};
