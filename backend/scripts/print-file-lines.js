import fs from 'fs';
const p = './server.js';
const content = fs.readFileSync(p,'utf8');
content.split('\n').forEach((l,i)=> console.log(`${i+1}: ${l}`));
