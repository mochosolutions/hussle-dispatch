/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Disallow circular dependencies in UI package',
      from: {},
      to: {
        circular: true,
      },
    },
    {
      name: 'no-impure-engine-imports',
      severity: 'error',
      comment:
        'carrier-portal-v2 engine module must remain pure: files under engine/ may only ' +
        'import from other engine/ files. Importing redux, sagas, components, or any ' +
        'non-engine module breaks the pure-function contract that enables 100% unit-test ' +
        'coverage. Move the dependency out of engine/ or invert the call site.',
      from: {
        path: '^src/features/carrier-portal-v2/engine/',
        pathNot: [
          '^src/features/carrier-portal-v2/engine/__tests__/',
        ],
      },
      to: {
        pathNot: [
          '^src/features/carrier-portal-v2/engine/',
          // node built-ins and external packages start with an alpha char or @;
          // path imports start with ./ or ../ — only those are restricted to engine/.
          '^[a-z@]',
        ],
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsConfig: {
      fileName: 'tsconfig.json',
    },
  },
};
