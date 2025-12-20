import test from 'ava';
import userRoutes from '../src/routes/user.js';
import { User } from '../src/models/index.js';

const findRoute = (router, path, method) => {
    for (const layer of router.stack) {
        if (!layer.route) continue;
        if (layer.route.path === path && layer.route.methods[method.toLowerCase()]) {
            return layer.route.stack.map(s => s.handle);
        }
    }
    return null;
};

const makeRes = () => {
    const res = { locals: {}, statusCode: 200, body: null };
    res.status = function (c) { this.statusCode = c; return this; };
    res.json = function (b) { this.body = b; return this; };
    return res;
};

const patch = (obj, name, impl) => {
    const orig = obj[name];
    obj[name] = impl;
    return () => { obj[name] = orig; };
};

test('GET / -> 403 when no user (requireAdmin branch)', async (t) => {
    const handlers = findRoute(userRoutes, '/', 'get');
    t.truthy(handlers);
    const handler = handlers[0];
    const req = {};
    const res = makeRes();
    await handler(req, res);
    t.is(res.statusCode, 403);
    t.deepEqual(res.body, { message: 'Forbidden' });
});

test('GET / -> returns users from User.find when non-test and admin', async (t) => {
    process.env.FORCE_NON_TEST = 'true';
    const restore = patch(User, 'find', () => Promise.resolve([{ username: 'h' }]));
    const handlers = findRoute(userRoutes, '/', 'get');
    const handler = handlers[0];
    const req = {};
    const res = makeRes();
    res.locals.user = { id: 'x', role: 'admin' };
    try {
        await handler(req, res);
        t.deepEqual(res.body, { success: true, users: [{ username: 'h' }] });
    } finally { restore(); delete process.env.FORCE_NON_TEST; }
});

test('POST / (invite handler) - catches findOne throw and returns error.body', async (t) => {
    process.env.FORCE_NON_TEST = 'true';
    const handlers = findRoute(userRoutes, '/', 'post');
    t.truthy(handlers);
    const handler = handlers[handlers.length - 1];
    const restore = patch(User, 'findOne', () => { throw { body: 'bad-invite' }; });
    const req = { body: { email: 'ex@x' } };
    const res = makeRes();
    res.locals.user = { id: 'x', role: 'admin' };
    try {
        await handler(req, res);
        t.false(res.body.success);
        t.is(res.body.message, 'bad-invite');
    } finally { restore(); delete process.env.FORCE_NON_TEST; }
});
