import test from 'ava';
import http from 'node:http';

test.serial('server error handler warns on EADDRINUSE and throws otherwise', async (t) => {
    const originalOn = http.Server.prototype.on;
    let captured;
    // Patch .on to capture the 'error' listener when server.js registers it
    http.Server.prototype.on = function (ev, listener) {
        if (ev === 'error') captured = listener;
        return originalOn.apply(this, arguments);
    };

    // Ensure listen is stubbed so module import won't bind ports
    process.env.STUB_HTTP_LISTEN = '1';
    // Force non-test branch to run
    const origNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    try {
        // Import module (runs top-level code and registers the error handler)
        await import('../server.js');
    } finally {
        // restore prototype and env
        http.Server.prototype.on = originalOn;
        delete process.env.STUB_HTTP_LISTEN;
        process.env.NODE_ENV = origNodeEnv;
    }

    t.truthy(captured, 'error handler was registered');

    // Should not throw for EADDRINUSE
    t.notThrows(() => captured({ code: 'EADDRINUSE' }));

    // Should throw for other errors
    const err = new Error('other');
    t.throws(() => captured(err), { instanceOf: Error });
});
