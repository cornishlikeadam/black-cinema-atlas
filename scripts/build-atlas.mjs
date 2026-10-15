import {build as viteBuild} from 'vite';
import {build} from 'esbuild';
import {mkdirSync,readFileSync,readdirSync,writeFileSync,cpSync} from 'node:fs';
import path from 'node:path';
await viteBuild({configFile:'vite.atlas.config.mjs'});
const assets={};const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
function collect(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())collect(file);else if(mime[path.extname(file)])assets['/'+path.relative('dist/client',file)]={body:readFileSync(file,'utf8'),type:mime[path.extname(file)]}}}
collect('dist/client');assets['/LICENSE']={body:readFileSync('LICENSE','utf8'),type:'text/plain; charset=utf-8'};
writeFileSync('atlas/generated-assets.mjs','export default '+JSON.stringify(assets)+';');
mkdirSync('dist/server',{recursive:true});await build({entryPoints:['atlas/worker.mjs'],outfile:'dist/server/index.js',bundle:true,minify:true,format:'esm',platform:'browser',target:'es2022'});
mkdirSync('dist/.openai',{recursive:true});cpSync('.openai/hosting.json','dist/.openai/hosting.json');cpSync('drizzle','dist/drizzle',{recursive:true});
console.log('Built cloud Worker, client assets, and database migrations.');
