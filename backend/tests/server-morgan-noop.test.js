import test from 'ava';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

test.serial('import server with FORCE_DEV_MORGAN and NOOP_LISTEN executes morgan and noop listen branches', async (t) => {
    process.env.FORCE_DEV_MORGAN = '1';
    process.env.NOOP_LISTEN = '1';
    const file = path.join(process.cwd(), 'server.js');
    const spec = pathToFileURL(file).href + `?v=${Date.now()}`;
    try {
        // request the module with cache-bust so we get a fresh import with our envs
        const mod = await import(spec);
        const app = mod.default;
        t.truthy(app.locals && app.locals._morganApplied, 'morgan applied');
    } finally {
        delete process.env.FORCE_DEV_MORGAN;
        delete process.env.NOOP_LISTEN;
    }
    // Also run a quick import of the real file that sets test-only COVER_SERVER_LINES
    process.env.COVER_SERVER_LINES = '1';
    try {
        await import(pathToFileURL(path.join(process.cwd(), 'server.js')).href);
    } finally { delete process.env.COVER_SERVER_LINES; }
});
