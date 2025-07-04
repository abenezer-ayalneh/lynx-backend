const TIMEZONES: Record<string, { offset: string; name: string }> = {
	'America/New_York': {
		offset: 'UTC-05:00',
		name: 'EST (Eastern Standard Time)',
	},
	'America/Chicago': {
		offset: 'UTC-06:00',
		name: 'CST (Central Standard Time)',
	},
	'America/Denver': {
		offset: 'UTC-07:00',
		name: 'MST (Mountain Standard Time)',
	},
	'America/Los_Angeles': {
		offset: 'UTC-08:00',
		name: 'PST (Pacific Standard Time)',
	},
}

export default TIMEZONES
