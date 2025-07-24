module.exports = {
	apps: [
		{
			name: 'lynx-backend',
			script: './dist/src/main.js',
			instances: 1,
			autorestart: true,
			watch: false,
			max_memory_restart: '1G',
			env_production: {
				NODE_ENV: 'production',
				NODE_ENVIRONMENT: 'production',
			},
			error_file: './logs/err.log',
			out_file: './logs/out.log',
			log_file: './logs/combined.log',
			time: true,
			restart_delay: 3000,
			max_restarts: 10,
			merge_logs: true,
			log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
			min_uptime: '10s',
			kill_timeout: 5000,
		},
	],
}
