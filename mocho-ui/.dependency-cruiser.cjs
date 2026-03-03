/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
	forbidden: [
		{
			name: 'no-circular',
			severity: 'error',
			comment: 'Disallow circular dependencies in shared UI package',
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
		tsConfig: {
			fileName: 'tsconfig.json',
		},
	},
};
