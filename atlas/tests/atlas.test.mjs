import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
import {createHmac} from 'node:crypto';
import catalog from '../data/catalog.json' with {type:'json'};
import {filterFilms,graphIndex,findPath,connections,rankFilms} from '../graph.mjs';
import {handleApi,consumeLimit,verifyTwilio,chat} from '../service.mjs';
function database(){
 const sqlite=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sqlite.exec(readFileSync('drizzle/'+f,'utf8'));
 const prepare=(sql,args=[])=>({bind:(...values)=>prepare(sql,values),first:async()=>sqlite.prepare(sql).get(...args)??null,all:async()=>({results:sqlite.prepare(sql).all(...args)}),run:async()=>({success:true,meta:{changes:Number(sqlite.prepare(sql).run(...args).changes)}})});
 return {prepare,batch:async statements=>{sqlite.exec('BEGIN');try{const res=[];for(const s of statements)res.push(await s.run());sqlite.exec('COMMIT');return res}catch(e){sqlite.exec('ROLLBACK');throw e}},close:()=>sqlite.close()};
}
const origin='https://atlas.example';
const request=(path,method='GET',body,cookie,headers={})=>new Request(origin+path,{method,headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{}),...headers},...(body!==undefined?{body:JSON.stringify(body)}:{})});
const moon=catalog.find(f=>f.title==='Moonlight');
test('catalog has stable unique IDs and accurate constrained search',()=>{
 assert.ok(catalog.length>=95);assert.equal(new Set(catalog.map(f=>f.id)).size,catalog.length);
 assert.ok(filterFilms(catalog,{q:'Denzel Washington'}).every(f=>f.people.some(p=>p.name==='Denzel Washington')));
 const short=filterFilms(catalog,{max_runtime:100});assert.ok(short.length>0);assert.ok(short.every(f=>f.runtime>0&&f.runtime<=100));
 assert.equal(filterFilms(catalog,{q:'Moonlight'})[0].id,moon.id);
});
test('graph preserves credit provenance and discovers paths',()=>{
 const films=filterFilms(catalog,{q:'Spike Lee'}),a=films[0],b=films[1],index=graphIndex(catalog);
 assert.ok(connections(catalog,a.id,'DIRECTED').some(r=>r.shared.some(s=>s.label==='Spike Lee')));
 const path=findPath(index,a.id,b.id);assert.equal(path[0].id,`film:${a.id}`);assert.equal(path.at(-1).id,`film:${b.id}`);
 assert.ok(index.edges.some(e=>e.type==='DIRECTED'&&e.provenance==='TMDB credits'));
});
test('recommendations enforce time and explain taste connections',()=>{
 const options=rankFilms(catalog,{time:100,liked_ids:[moon.id],mood:'thoughtful',group:[{name:'A',interests:'drama'},{name:'B',interests:'identity'}]});
 assert.ok(options.length);assert.ok(options.every(r=>r.film.runtime<=100&&r.film.id!==moon.id&&r.reasons.length));
});
test('server preferences persist and guest sessions remain isolated',async()=>{
 const DB=database(),env={DB};try{
  const first=await handleApi(request('/api/profile'),env),cookie=first.headers.get('Set-Cookie').split(';')[0];assert.match(cookie,/atlas_sid=/);assert.match(first.headers.get('Set-Cookie'),/HttpOnly/);
  const saved=await handleApi(request('/api/profile','PUT',{watchlist:[moon.id,moon.id,-1],region:'GB'},cookie),env);assert.deepEqual((await saved.json()).watchlist,[moon.id]);
  assert.equal((await (await handleApi(request('/api/profile','GET',undefined,cookie),env)).json()).region,'GB');
  assert.deepEqual((await (await handleApi(request('/api/profile'),env)).json()).watchlist,[]);
 }finally{DB.close()}
});
test('API rejects foreign origins, invalid bodies, missing films and unsigned SMS',async()=>{
 const DB=database(),env={DB};try{
  assert.equal((await handleApi(request('/api/profile','PUT',{},undefined,{Origin:'https://evil.example'}),env)).status,403);
  assert.equal((await handleApi(request('/api/profile','PUT',null),env)).status,400);
  assert.equal((await handleApi(request('/api/profile','PUT',{watchlist:'bad'}),env)).status,400);
  assert.equal((await handleApi(request('/api/films/0'),env)).status,404);
  assert.equal((await handleApi(request('/api/sms','POST',{}),{...env,SMS_ENABLED:'true',TWILIO_AUTH_TOKEN:'test',TWILIO_PHONE_NUMBER:'+15550000000'})).status,403);
 }finally{DB.close()}
});
test('group votes upsert once per guest, and shared links expose no identities',async()=>{
 const DB=database(),env={DB};try{
  const res=await handleApi(request('/api/groups','POST',{mood:'funny',time:120,group:[{name:'A',interests:'comedy'}]}),env),cookie=res.headers.get('Set-Cookie').split(';')[0],g=await res.json();assert.equal(res.status,200);
  const film=catalog.find(f=>f.runtime<=120);
  for(let i=0;i<2;i++)assert.equal((await handleApi(request(`/api/groups/${g.id}/vote`,'POST',{film_id:film.id},cookie),env)).status,200);
  const shared=await (await handleApi(request(`/api/groups/${g.id}`),env)).json();assert.equal(shared.votes[0].count,1);assert.equal(shared.owner_id,undefined);assert.equal(shared.user_id,undefined);
 }finally{DB.close()}
});
test('atomic counters enforce caps',async()=>{const DB=database();try{await consumeLimit({DB},'test',1,60000);await assert.rejects(consumeLimit({DB},'test',1,60000),e=>e.status===429)}finally{DB.close()}});
test('Twilio signature binds URL and form; STOP and duplicate messages never send',async()=>{
 const DB=database(),token='test-secret',url=origin+'/api/sms',params=new URLSearchParams({AccountSid:'ACtest',To:'+15550000000',From:'+15551111111',MessageSid:'SM'+'a'.repeat(32),Body:'STOP'});
 const payload=url+[...params.keys()].sort().map(k=>k+params.get(k)).join(''),signature=createHmac('sha1',token).update(payload).digest('base64');
 assert.equal(await verifyTwilio(token,url,params,signature),true);assert.equal(await verifyTwilio(token,url+'/wrong',params,signature),false);
 const env={DB,PUBLIC_ORIGIN:origin,SMS_ENABLED:'true',TWILIO_AUTH_TOKEN:token,TWILIO_PHONE_NUMBER:'+15550000000',TWILIO_ACCOUNT_SID:'ACtest'};
 try{for(let i=0;i<2;i++){const req=new Request(url,{method:'POST',headers:{'x-twilio-signature':signature,'Content-Type':'application/x-www-form-urlencoded'},body:params.toString()});const res=await handleApi(req,env,{waitUntil:()=>assert.fail('STOP must not send')});assert.equal(res.status,200);assert.match(await res.text(),/<Response><\/Response>/)}}finally{DB.close()}
});
test('guide performs tool round-trip and persists history without exposing secrets',async()=>{
 const DB=database(),savedFetch=globalThis.fetch;let calls=0;
 globalThis.fetch=async(url,opts)=>{assert.match(url,/generativelanguage.googleapis.com/);const body=JSON.parse(opts.body);calls++;if(calls===1)return Response.json({candidates:[{content:{role:'model',parts:[{functionCall:{name:'search_films',args:{query:'Moonlight'}}}]}}]});assert.equal(body.contents.at(-1).parts[0].functionResponse.response.result.films[0].id,moon.id);return Response.json({candidates:[{content:{role:'model',parts:[{text:'Moonlight (2016) is a thoughtful coming-of-age story.'}]}}]})};
 try{const answer=await chat({DB,GEMINI_API_KEY:'fake-key'},'guest:test','A thoughtful film');assert.equal(calls,2);assert.deepEqual(answer.tools_used,['search_films']);assert.equal(answer.films[0].id,moon.id);assert.ok(!JSON.stringify(answer).includes('fake-key'));assert.equal((await DB.prepare('SELECT COUNT(*) AS n FROM messages').first()).n,2)}finally{globalThis.fetch=savedFetch;DB.close()}
});
