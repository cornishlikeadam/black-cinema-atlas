import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react-swc';
import glsl from 'vite-plugin-glsl';
import {resolve} from 'node:path';
export default defineConfig({root:resolve('atlas'),publicDir:false,plugins:[react(),glsl()],resolve:{alias:{'√':resolve('voroforce')}},build:{outDir:resolve('dist/client'),emptyOutDir:true},server:{host:'127.0.0.1',port:3000,fs:{allow:[process.cwd()]}}});
