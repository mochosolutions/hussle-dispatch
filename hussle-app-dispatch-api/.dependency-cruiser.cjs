module.exports = {
  forbidden: [
    {
      name: 'no-prisma-in-services',
      severity: 'error',
      from: {
        path: '^src/.+/services/',
      },
      to: {
        path: '^@prisma/client$',
      },
    },
    {
      name: 'no-repo-implementations-in-services',
      severity: 'error',
      from: {
        path: '^src/.+/services/',
      },
      to: {
        path: '^src/.+/repositories/',
      },
    },
    {
      name: 'no-services-to-controllers',
      severity: 'error',
      from: {
        path: '^src/.+/services/',
      },
      to: {
        path: '^src/.+/controllers/',
      },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: {
        circular: true,
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    includeOnly: '^src',
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
