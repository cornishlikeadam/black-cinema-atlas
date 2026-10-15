import {useEffect,useRef,useState} from 'react';
import voroforce from '../voroforce/index.js';
import display from '../app/vf/config/display/display.ts';
import simulation from '../app/vf/config/simulation/index.ts';
import {poster} from './graph.mjs';
function image(url){return new Promise(resolve=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=()=>resolve(null);img.src=url})}
export default function AtlasCanvas({films,onSelect,onFallback,cluster}){
 const el=useRef(null),select=useRef(onSelect),[loading,setLoading]=useState(true),[hover,setHover]=useState(null);select.current=onSelect;
 useEffect(()=>{
  let engine,dead=false,objectUrl;
  setLoading(true);
  const ordered=[...films];
  if(cluster==='director')ordered.sort((a,b)=>(a.people.find(p=>p.role==='DIRECTED')?.name??'').localeCompare(b.people.find(p=>p.role==='DIRECTED')?.name??''));
  if(cluster==='theme')ordered.sort((a,b)=>(a.themes[0]??'').localeCompare(b.themes[0]??''));
  if(ordered.length<4){onFallback();return}
  const initialize=async()=>{
   const cols=12,rows=Math.ceil(ordered.length/cols),tileW=128,tileH=192;
   const canvas=document.createElement('canvas');canvas.width=cols*tileW;canvas.height=rows*tileH;const ctx=canvas.getContext('2d');
   await Promise.all(ordered.map(async(f,i)=>{const img=f.poster_path?await image(`/media/w185${f.poster_path}`):null;if(dead)return;const x=(i%cols)*tileW,y=Math.floor(i/cols)*tileH;ctx.fillStyle='#22261f';ctx.fillRect(x,y,tileW,tileH);if(img)ctx.drawImage(img,x,y,tileW,tileH);else{ctx.fillStyle='#eadbb8';ctx.font='13px serif';const words=f.title.split(' ');words.forEach((w,j)=>ctx.fillText(w,x+10,y+45+j*17,110))}}));
   if(dead)return;
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));objectUrl=URL.createObjectURL(blob);
   const scene=structuredClone({main:display.scene.main});
   for(const uniform of Object.values(scene.main.uniforms)){uniform.value=uniform.value??uniform.modes?.default?.value??uniform.themes?.default?.value??0}
   scene.main.uniforms.fBorderThicknessMod.value=.65;scene.main.uniforms.fBorderRoundnessMod.value=.55;scene.main.uniforms.fRippleMod.value=0;scene.main.uniforms.fNoiseOctaveMod.value=0;
   engine=voroforce(el.current,{cells:ordered.length,multiThreading:{enabled:false,renderInParallel:false},media:{enabled:true,preload:'first',compressionFormat:'rgba',baseUrl:'',versions:[0,1,2].map(()=>({cols,rows,width:canvas.width,height:canvas.height,layers:1,layerSrcFormat:()=>objectUrl,type:'compressed-grid'}))},lattice:{enabled:true,aspect:2/3},controls:{autoFocusCenter:{enabled:true,random:false},freezeOnShake:{enabled:false},freezeOnJolt:{enabled:false},zoom:{enabled:true,min:.8,max:2},maxSpeed:4,ease:.12},display:{scene:{...scene,post:{enabled:false}}},simulation,handleVisibilityChange:{enabled:false},devTools:{enabled:false}});
   engine.controls.listen('focused',({cell})=>{if(!dead)setHover(ordered[cell?.id]??null)});
   engine.controls.listen('selected',({cell})=>{if(!dead&&ordered[cell?.id]){select.current(ordered[cell.id]);engine.controls.deselect()}});
   engine.loader.listen('preloaded',()=>{if(!dead)setLoading(false)});
   setLoading(false);
  };
  initialize().catch(error=>{console.error('Atlas renderer:',error?.message);if(!dead)onFallback()});
  return()=>{dead=true;try{engine?.dispose()}catch{};el.current?.replaceChildren();if(objectUrl)URL.revokeObjectURL(objectUrl)};
 },[films,cluster]);
 return <div className="canvas-wrap"><div ref={el} className="voroforce" role="img" aria-label="Interactive Voronoi atlas of film posters. Use Posters view for keyboard browsing."/>{loading&&<div className="canvas-loading"><span className="spinner"/>Gathering the stories…</div>}{!loading&&hover&&<div className="hover-film"><span>{hover.year} · {hover.genres[0]}</span><strong>{hover.title}</strong><span>Click to explore its connections ↗</span></div>}<div className="canvas-caption">Move to explore · Click a film · Switch to Posters for a still view</div></div>
}
