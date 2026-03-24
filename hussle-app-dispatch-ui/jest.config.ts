export default {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['./jest.setup.ts'],
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: 'tsconfig.test.json',
        diagnostics: false,
        astTransformers: {
          before: ['./jest.importMetaTransformer.ts'],
        },
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
    '^features/(.*)$': '<rootDir>/src/features/$1',
    '^mocho/(.*)$': '<rootDir>/src/mocho/$1',
    // mocho-ui subpath mappings (local source, mirrors tsconfig paths)
    '^@mocho/ui/redux$': '<rootDir>/src/mocho/redux',
    '^@mocho/ui/components$': '<rootDir>/src/mocho/components',
    '^@mocho/ui/forms$': '<rootDir>/src/mocho/forms',
    '^@mocho/ui/hooks$': '<rootDir>/src/mocho/hooks',
    '^@mocho/ui/utils$': '<rootDir>/src/mocho/utils',
    '^@mocho/ui/types$': '<rootDir>/src/mocho/types',
    '^@mocho/ui$': '<rootDir>/src/mocho',
    '\\.(css|png|svg)$': '<rootDir>/node_modules/identity-obj-proxy',
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)', '**/*.test.(ts|tsx)'],
};
