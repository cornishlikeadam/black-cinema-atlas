// Exercises a new anonymous session; never reads local or hosted credentials.
import {writeFileSync} from 'node:fs';
const base=new URL(process.argv[2]??process.env.ATLAS_URL??'http://localhost:3000').origin;
let cookie='';const jar=new Map(),checks=[];
async function api(path,method='GET',body){const r=await fetch(base+path,{method,headers:{Origin:base,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(110000)});for(const entry of r.headers.getSetCookie()){const pair=entry.split(';')[0],i=pair.indexOf('=');jar.set(pair.slice(0,i),pair.slice(i+1))}cookie=[...jar].map(([k,v])=>k+'='+v).join('; ');const d=await r.json();if(!r.ok)throw new Error(`${path}: ${r.status} ${d.error}`);return d}
async function check(name,fn){try{const detail=await fn();checks.push({name,pass:true,...detail})}catch(e){checks.push({name,pass:false,error:e.message})}}
let film;
await check('Cloud services',async()=>{const d=await api('/api/status');if(!d.ai||!d.movies||!d.database)throw new Error('Missing cloud binding');return {sms_enabled:d.sms}});
await check('Search',async()=>{film=(await api('/api/films?q=Moonlight')).films[0];if(film?.title!=='Moonlight')throw new Error('Expected Moonlight')});
await check('Live movie data',async()=>{const d=await api(`/api/films/${film.id}?region=US`);if(d.stale||!d.providers.length)throw new Error('Live provider lookup did not succeed');return {providers:d.providers.length}});
await check('D1 preferences',async()=>{await api('/api/profile','PUT',{watchlist:[film.id],region:'GB'});const p=await api('/api/profile');if(p.region!=='GB'||p.watchlist[0]!==film.id)throw new Error('Preferences not persisted')});
await check('Shared group vote',async()=>{const g=await api('/api/groups','POST',{name:'Verification movie night',mood:'funny',time:120,group:[{name:'Viewer',interests:'comedy'}]}),d=await api('/api/groups/'+g.id),pick=d.recommendations.options[0];const vote=await api('/api/groups/'+g.id+'/vote','POST',{film_id:pick.id});if(!vote.votes.some(v=>v.film_id===pick.id&&v.count===1))throw new Error('Vote not persisted')});
if(process.argv.includes('--chat')){
 await check('Live AI tools',async()=>{const d=await api('/api/chat','POST',{message:'Recommend one 1990s Black love story from the Atlas and explain why. No spoilers.'});if(!d.tools_used.length||!d.films.length)throw new Error('No grounded film tools');return {tools:d.tools_used,response:d.message}});
 await check('Conversation history',async()=>{const d=await api('/api/history');if(d.messages.length!==2)throw new Error('History not persisted')});
 await api('/api/history','DELETE');
}
await api('/api/profile','PUT',{watchlist:[],region:'US'});
const report={at:new Date().toISOString(),url:base,checks};console.log(JSON.stringify(report,null,2));
if(process.env.ATLAS_SMOKE_OUTPUT)writeFileSync(process.env.ATLAS_SMOKE_OUTPUT,JSON.stringify(report,null,2)+'\n');
if(checks.some(c=>!c.pass))process.exitCode=1;
