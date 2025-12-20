import http from 'node:http';
import express from 'express';
import got from 'got';
import userRoutes from './src/routes/user.js';

const app = express();
app.use(express.json());
app.use((req,res,next)=>{ res.locals.user = { id: '507f1f77bcf86cd799439011', role:'admin' }; req.user = { isAdmin: true }; next(); });
app.use('/api', userRoutes);

const server = http.createServer(app).listen(()=>{
    const { port } = server.address();
    (async ()=>{
        try{
            const client = got.extend({ responseType: 'json', prefixUrl: `http://localhost:${port}`, throwHttpErrors: false });
            let r = await client.post('api/advanced-search', { json: { query: 'admin query term' } });
            console.log('admin query status', r.statusCode, r.body);

            r = await client.post('api/advanced-search', { json: { options: { sort: 'desc' } } });
            console.log('sort desc status', r.statusCode, r.body);

            r = await client.post('api/advanced-search', { json: { filters: { deleted: true } } });
            console.log('filters.deleted status', r.statusCode, r.body);
        } catch(e){
            console.error('ERR', e);
        } finally {
            server.close();
        }
    })();
});
