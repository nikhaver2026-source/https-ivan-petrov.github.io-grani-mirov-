/* srv8907.js — сервер игры для сбора фраз: как srv8903, но в index.html вставлен собиратель речи.
   POST /__collect — строки JSON в /root/S/gvrec/collect.txt. */
const http=require("http"),fs=require("fs"),path=require("path");
const ROOT="/home/user/https-ivan-petrov.github.io-grani-mirov-";const PREFIX="/"+path.basename(ROOT);
const OUT="/root/S/gvrec/collect.txt";
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/manifest+json",".png":"image/png",".mp3":"audio/mpeg",
 ".wav":"audio/wav",".flac":"audio/flac",".ogg":"audio/ogg",".md":"text/plain; charset=utf-8",".txt":"text/plain; charset=utf-8",".mjs":"text/javascript; charset=utf-8",
 ".wasm":"application/wasm",".tsv":"text/tab-separated-values; charset=utf-8",".onnx":"application/octet-stream"};
const SNIP=`<script>(function(){try{
 const was=new Set(),buf=[];const add=t=>{t=String(t==null?"":t).trim();if(!t||t.length>600||was.has(t))return;was.add(t);buf.push(t);};
 const flush=()=>{if(!buf.length)return;const b=JSON.stringify(buf.splice(0));try{fetch("/__collect",{method:"POST",body:b,keepalive:true});}catch(_){}};
 setInterval(flush,3000);addEventListener("pagehide",flush);
 const hook=()=>{if(typeof Speech==="undefined"||Speech.__collect)return false;Speech.__collect=true;
  const orig=Speech.say;let cur=orig;let внутри=false;const wrapped=function(t){if(внутри)return orig.apply(this,arguments);внутри=true;try{try{add(t);}catch(_){}return cur.apply(this,arguments);}finally{внутри=false;}};
  Object.defineProperty(Speech,"say",{configurable:true,get(){return wrapped;},set(f){cur=(f===wrapped)?orig:f;}});
  
  return true;};
 if(!hook())document.addEventListener("DOMContentLoaded",hook);
 setInterval(()=>{try{hook();document.querySelectorAll("[data-speak]").forEach(e=>add(e.getAttribute("data-speak")));}catch(_){}},2500);
}catch(_){}})();</script>`;
http.createServer((req,rq)=>{let url=decodeURIComponent(req.url.split("?")[0]);if(url.startsWith(PREFIX))url=url.slice(PREFIX.length);if(!url||url==="/")url="/index.html";
 if(url==="/__collect"&&req.method==="POST"){let d="";req.on("data",c=>{d+=c;if(d.length>4e6)req.destroy();});req.on("end",()=>{try{JSON.parse(d);fs.appendFileSync(OUT,d+"\n");}catch(_){}rq.writeHead(204);rq.end();});return;}
 const f=path.join(ROOT,url.replace(/^\/+/,""));if(!f.startsWith(ROOT)){rq.writeHead(403);rq.end();return;}
 fs.readFile(f,(e,data)=>{if(e){rq.writeHead(404,{"content-type":"text/plain"});rq.end("404");return;}
  if(url==="/index.html"){const s=data.toString("utf8");const i=s.lastIndexOf("</body>");data=Buffer.from(i>0?s.slice(0,i)+SNIP+s.slice(i):s+SNIP,"utf8");}
  rq.writeHead(200,{"content-type":TYPES[path.extname(f).toLowerCase()]||"application/octet-stream","x-content-type-options":"nosniff"});rq.end(data);});
}).listen(8907,"127.0.0.1",()=>console.log("8907"));
