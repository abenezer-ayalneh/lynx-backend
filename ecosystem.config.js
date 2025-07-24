module.exports = {
	apps: [
		{
			name: 'lynx-backend',
			script: 'index.js',
			watch: true,
			ignore_watch: ['node_modules', '.git', 'err.log', 'out.log'],
			instances: 1,
			autorestart: true,
			max_memory_restart: '1G',
			env: {
				NODE_ENVIRONMENT: 'development',
			},
			env_production: {
				NODE_ENVIRONMENT: 'production',
			},
			error_file: 'err.log',
			out_file: 'out.log',
			time: true,
			restart_delay: 3000,
			max_restarts: 10,
			merge_logs: true,
		},
	],
}
