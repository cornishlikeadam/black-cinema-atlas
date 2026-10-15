import {handleApi} from './service.mjs';
import assets from './generated-assets.mjs';
export default {async fetch(request,env,ctx){
 const url=new URL(request.url);
 if(url.pathname.startsWith('/api/'))return handleApi(request,env,ctx);
 const match=url.pathname.match(/^\/media\/(w92|w185|w342|w500|w1280)\/([A-Za-z0-9]+\.(?:jpg|png))$/);
 if(match){const res=await fetch(`https://image.tmdb.org/t/p/${match[1]}/${match[2]}`,{cf:{cacheTtl:86400,cacheEverything:true}});return new Response(res.body,{status:res.status,headers:{'Content-Type':res.headers.get('Content-Type')??'image/jpeg','Cache-Control':'public,max-age=86400','X-Content-Type-Options':'nosniff'}})}
 const asset=assets[url.pathname]??(!url.pathname.includes('.')?assets['/index.html']:null);
 if(!asset)return new Response('Not found',{status:404});
 const headers={'Content-Type':asset.type,'X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=()','Cache-Control':url.pathname.startsWith('/assets/')?'public,max-age=31536000,immutable':'no-cache'};
 if(asset.type.startsWith('text/html'))headers['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: blob: https://image.tmdb.org; connect-src 'self' blob:; worker-src 'self' blob:; frame-ancestors 'self' https://chatgpt.com https://*.chatgpt.com; base-uri 'self'; form-action 'self'";
 return new Response(request.method==='HEAD'?null:asset.body,{headers});
}};
