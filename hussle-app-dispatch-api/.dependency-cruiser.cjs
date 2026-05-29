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
    {
      // app.ts must not import startBackground or any module subscriber-init
      // aggregator. Those are worker-role concerns — importing them in the api
      // entrypoint would start subscribers in the HTTP-only process.
      // Note: src/index.ts legitimately imports startBackground (worker/all
      // paths) and is intentionally excluded from this rule's `from` scope.
      name: 'no-background-in-api',
      severity: 'error',
      from: {
        path: '^src/app\\.ts$',
      },
      to: {
        path: '^src/startBackground\\.ts$',
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
