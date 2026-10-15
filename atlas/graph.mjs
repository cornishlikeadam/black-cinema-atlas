export const normalize = value => String(value ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
export const poster = (path,size='w342') => path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
export function graphIndex(films) {
 const nodes=new Map(),edges=[],adj=new Map();
 const node=(id,label,type)=>{if(!nodes.has(id))nodes.set(id,{id,label,type});return id};
 const edge=(a,b,type,source)=>{edges.push({source:a,target:b,type,provenance:source});for(const [x,y] of [[a,b],[b,a]]){if(!adj.has(x))adj.set(x,[]);adj.get(x).push({id:y,type,provenance:source})}};
 for(const f of films){const id=node(`film:${f.id}`,f.title,'Film');
  for(const p of f.people??[])edge(node(`person:${p.id}`,p.name,'Person'),id,p.role,'TMDB credits');
  for(const [field,type,kind] of [['genres','HAS_GENRE','Genre'],['themes','HAS_THEME','Theme'],['cities','SET_IN','City']])for(const v of f[field]??[])edge(id,node(`${kind.toLowerCase()}:${v}`,v,kind),type,field==='genres'?'TMDB':'Atlas editorial');
  edge(id,node(`decade:${f.decade}`,f.decade,'Decade'),'IN_DECADE','Release date');
 }
 return {nodes,edges,adj};
}
export function sharedConnections(a,b){
 const result=[];
 for(const pa of a.people??[]){const pb=(b.people??[]).find(p=>p.id===pa.id && p.role===pa.role);if(pb)result.push({type:pa.role,label:pa.name,source:'TMDB credits',weight:pa.role==='DIRECTED'?8:pa.role==='ACTED_IN'?3:2})}
 for(const [field,type,weight] of [['themes','HAS_THEME',2],['cities','SET_IN',2],['genres','HAS_GENRE',0.8]])for(const v of a[field]??[])if((b[field]??[]).includes(v))result.push({type,label:v,source:field==='genres'?'TMDB':'Atlas editorial',weight});
 if(a.decade===b.decade)result.push({type:'IN_DECADE',label:a.decade,source:'Release date',weight:0.5});
 return result.sort((x,y)=>y.weight-x.weight);
}
export function connections(films,id,type='all'){
 const f=films.find(f=>f.id===Number(id));if(!f)return [];
 return films.filter(x=>x.id!==f.id).map(other=>{const shared=sharedConnections(f,other).filter(x=>type==='all'||x.type===type);return {film:other,shared,score:shared.reduce((s,x)=>s+x.weight,0)}}).filter(x=>x.shared.length).sort((a,b)=>b.score-a.score).slice(0,18);
}
export function findPath(index,a,b){
 const start=`film:${a}`,goal=`film:${b}`,q=[[start]],seen=new Set([start]);
 for(let i=0;i<q.length&&i<6000;i++){const path=q[i],last=path.at(-1);if(last===goal)return path.map(id=>index.nodes.get(id));if(path.length>=7)continue;for(const e of index.adj.get(last)??[])if(!seen.has(e.id)){seen.add(e.id);q.push([...path,e.id])}}
 return [];
}
export function filterFilms(films,filters={}){
 const query=normalize(filters.q??filters.query),tokens=query.split(' ').filter(Boolean);
 return films.filter(f=>{
  const hay=normalize([f.title,f.year,f.decade,...f.genres,...f.themes,...f.cities,...f.people.map(p=>p.name)].join(' '));
  return (!query||tokens.every(t=>hay.includes(t)))&&(!filters.decade||f.decade===filters.decade)&&(!filters.genre||f.genres.includes(filters.genre))&&(!filters.theme||f.themes.includes(filters.theme))&&(!filters.city||f.cities.includes(filters.city))&&(!filters.person||f.people.some(p=>String(p.id)===String(filters.person)))&&(!Number(filters.max_runtime)||(f.runtime>0&&f.runtime<=Number(filters.max_runtime)));
 });
}
const moods={funny:['Comedy'],romantic:['Romance'],thrilling:['Thriller','Horror'],inspiring:['History','Sports','Excellence','Resilience'],family:['Animation','Family'],thoughtful:['Drama','Identity','Art']};
export function rankFilms(films,args={}){
 const likes=(args.liked_ids??[]).map(Number),liked=films.filter(f=>likes.includes(f.id));
 let pool=filterFilms(films,{...(args.filters??{}),max_runtime:args.time??args.max_runtime});
 const wanted=moods[normalize(args.mood)]??String(args.mood??'').split(/[ ,]+/).filter(Boolean);
 const group=args.group??[];
 return pool.filter(f=>!likes.includes(f.id)).map(f=>{
  let score=f.rating/4,reasons=[];
  const hit=[...f.genres,...f.themes].filter(v=>wanted.some(w=>normalize(v).includes(normalize(w))));
  if(hit.length){score+=hit.length*3;reasons.push(`Matches your ${args.mood} mood: ${hit.join(', ')}`)}
  if(args.time)reasons.push(`${f.runtime} minutes fits your ${args.time}-minute window`);
  for(const l of liked){const shared=sharedConnections(l,f).slice(0,2);if(shared.length){score+=shared.reduce((s,x)=>s+x.weight,0);reasons.push(`Connected to ${l.title} through ${shared.map(x=>x.label).join(' and ')}`)}}
  const matches=group.map(member=>{const interests=String(member.interests??member).split(',').map(normalize).filter(Boolean);return interests.filter(v=>normalize([...f.genres,...f.themes,...f.people.map(p=>p.name)].join(' ')).includes(v)).length});
  if(matches.length){score+=Math.min(...matches)*4+matches.reduce((a,b)=>a+b,0);reasons.push(`${matches.filter(Boolean).length} of ${matches.length} viewers have matching interests`)}
  if(!reasons.length)reasons.push(`${f.genres.slice(0,2).join(' / ')} from the ${f.decade} collection`);
  return {film:f,score,reasons};
 }).sort((a,b)=>b.score-a.score);
}
