#!/usr/bin/env node
import express from 'express';

// Ensure this process runs as non-test env to hit non-test branches
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

import userRoutes from '../../src/routes/user.js';
import { User } from '../../src/models/index.js';

// Read stub mode from env
const stub = process.env.STUB_CASE || '';
const stubFindAll = process.env.STUB_FIND_ALL === 'true';
const stubRoleUpdate = process.env.STUB_ROLE_UPDATE || '';

// Patch model methods based on requested stub behavior
if (stubFindAll) {
    User.find = async () => [{ username: 'listuser' }];
}

if (stub === 'profile-notfound') {
    User.findById = (id) => ({ select: async () => null });
}

if (stub === 'profile-found') {
    User.findById = (id) => ({ select: async () => ({ _id: id, username: 'found', email: 'f@example.com', role: 'user', lastActiveAt: new Date() }) });
}

if (stub === 'userdetails-notfound') {
    User.findById = (id) => ({ select: async () => null });
}

if (stubRoleUpdate === 'notfound') {
    User.findByIdAndUpdate = async (id, data) => null;
}

if (stubRoleUpdate === 'found') {
    User.findByIdAndUpdate = async (id, data) => ({ _id: id, role: data.role });
}

const app = express();
app.use(express.json());
// Always set an admin authenticated user
app.use((req,res,next)=>{ res.locals.user = { id: '507f1f77bcf86cd799439011', role:'admin' }; next(); });
app.use('/api', userRoutes);

const server = app.listen(process.env.PORT || 0, () => {
    const { port } = server.address();
    // communicate port via stdout
    // eslint-disable-next-line no-console
    console.log('LISTENING:' + port);
});
