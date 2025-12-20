import test from 'ava';
import userInfo from '../src/routes/info.js';

const findRoute = (router, path, method) => {
    for (const layer of router.stack) {
        if (!layer.route) continue;
        if (layer.route.path === path && layer.route.methods[method.toLowerCase()]) {
            return layer.route.stack.map(s => s.handle);
        }
    }
    return null;
};

const makeRes = (opts = {}) => {
    const res = { locals: {}, statusCode: 200, body: null };
    res.status = function (c) { this.statusCode = c; return this; };
    res.json = function (b) { this.body = b; return this; };
    res.send = function (b) { this.body = b; return this; };
    if (opts.throwOnSend) {
        res.send = function () { throw new Error('send-fail'); };
    }
    return res;
};

test('GET /hello catch branch when res.send throws', async (t) => {
    const handlers = findRoute(userInfo, '/hello', 'get');
    t.truthy(handlers);
    const handler = handlers[0];
    const req = {};
    const res = makeRes({ throwOnSend: true });
    await handler(req, res);
    t.is(res.statusCode, 500);
    t.deepEqual(res.body, { message: 'Something went wrong.' });
});
