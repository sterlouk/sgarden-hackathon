process.env.FORCE_DEV_MORGAN = '1';
process.env.SKIP_INIT = '1';
process.env.NODE_ENV = 'test';

import('../server.js')
	.then((mod) => {
		const app = mod.default;
		console.log('morganApplied=', !!(app && app.locals && app.locals._morganApplied));
		process.exit(app && app.locals && app.locals._morganApplied ? 0 : 2);
	})
	.catch((err) => {
		console.error(err);
		process.exit(1);
	});
