import test from "ava";
import mongoose from "mongoose";

test.serial("init uses mongoose.connect and returns connection on success", async (t) => {
    // ensure mock envs are unset
    delete process.env.MOCK_MONGO;

    const originalConnect = mongoose.connect;
    mongoose.connect = async (url) => ({ real: true, url });

    const init = (await import("../src/utils/mongoose.js")).default;
    const conn = await init();
    t.truthy(conn && conn.real === true);

    mongoose.connect = originalConnect;
});

test.serial("init catches mongoose.connect rejection and returns null", async (t) => {
    delete process.env.MOCK_MONGO;

    const originalConnect = mongoose.connect;
    mongoose.connect = async () => { throw new Error("network failure"); };

    const init = (await import("../src/utils/mongoose.js")).default;
    const conn = await init();
    t.is(conn, null);

    mongoose.connect = originalConnect;
});
