import {createServer as createViteServer,loadConfigFromFile} from 'vite';
import {createServer} from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync,readdirSync} from 'node:fs';
import {handleApi} from '../atlas/service.mjs';
try{process.loadEnvFile('.env.local')}catch{}
mkdirSync('work',{recursive:true});const sqlite=new DatabaseSync('work/atlas.sqlite');
sqlite.exec('CREATE TABLE IF NOT EXISTS atlas_local_migrations(name TEXT PRIMARY KEY)');
for(const name of readdirSync('drizzle').filter(n=>n.endsWith('.sql')).sort()){if(!sqlite.prepare('SELECT name FROM atlas_local_migrations WHERE name=?').get(name)){sqlite.exec(readFileSync('drizzle/'+name,'utf8'));sqlite.prepare('INSERT INTO atlas_local_migrations(name) VALUES(?)').run(name)}}
const wrap=(sql,args=[])=>({bind:(...values)=>wrap(sql,values),first:async()=>sqlite.prepare(sql).get(...args)??null,all:async()=>({results:sqlite.prepare(sql).all(...args)}),run:async()=>{const r=sqlite.prepare(sql).run(...args);return {success:true,meta:{changes:Number(r.changes)}}}});
const DB={prepare:wrap,batch:async statements=>{sqlite.exec('BEGIN');try{const res=[];for(const s of statements)res.push(await s.run());sqlite.exec('COMMIT');return res}catch(e){sqlite.exec('ROLLBACK');throw e}}};
const config=(await loadConfigFromFile({command:'serve',mode:'development'},'vite.atlas.config.mjs')).config;
const vite=await createViteServer({...config,configFile:false,server:{...config.server,middlewareMode:true},appType:'spa'});
const server=createServer(async(req,res)=>{
 if(req.url.startsWith('/api/')||req.url.startsWith('/media/')){
  try{
   const body=[];for await(const chunk of req)body.push(chunk);const url=`http://${req.headers.host}${req.url}`;
   const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(body),duplex:'half'}:{})});
   let response;
   if(req.url.startsWith('/media/')){const m=new URL(url).pathname.match(/^\/media\/(w92|w185|w342|w500|w1280)\/([A-Za-z0-9]+\.(?:jpg|png))$/);if(!m)response=new Response('Not found',{status:404});else{const r=await fetch(`https://image.tmdb.org/t/p/${m[1]}/${m[2]}`);response=new Response(r.body,{status:r.status,headers:{'Content-Type':r.headers.get('Content-Type')??'image/jpeg','Cache-Control':'public, max-age=86400'}})}}
   else response=await handleApi(request,{...process.env,DB},{waitUntil:p=>p.catch(e=>console.error('Background task failed',e.name))});
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));
  }catch(e){console.error('Preview request failed',e.name);res.writeHead(500);res.end('Preview request failed')}
 }else if(req.url==='/LICENSE'){res.writeHead(200,{'Content-Type':'text/plain'});res.end(readFileSync('LICENSE'))}
 else vite.middlewares(req,res);
});
server.listen(3000,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:3000'));
for(const event of ['SIGINT','SIGTERM'])process.on(event,()=>{server.close();vite.close();sqlite.close();process.exit()});
