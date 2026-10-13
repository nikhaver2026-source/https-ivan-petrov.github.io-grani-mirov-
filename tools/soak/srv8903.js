/* srv8903.js — сервер игры для долгого прогона: отдаёт папку репозитория на порту 8903 (и под путём репозитория, как tests/run.js) */
const http=require("http"),fs=require("fs"),path=require("path");
const ROOT=path.resolve(__dirname,"..","..");const PREFIX="/"+path.basename(ROOT);
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/manifest+json",".png":"image/png",".mp3":"audio/mpeg",
 ".wav":"audio/wav",".flac":"audio/flac",".ogg":"audio/ogg",".md":"text/plain; charset=utf-8",".txt":"text/plain; charset=utf-8",".mjs":"text/javascript; charset=utf-8",
 ".wasm":"application/wasm",".tsv":"text/tab-separated-values; charset=utf-8",".onnx":"application/octet-stream"};
http.createServer((req,rq)=>{let url=decodeURIComponent(req.url.split("?")[0]);if(url.startsWith(PREFIX))url=url.slice(PREFIX.length);if(!url||url==="/")url="/index.html";
 const f=path.join(ROOT,url.replace(/^\/+/,""));if(!f.startsWith(ROOT)){rq.writeHead(403);rq.end();return;}
 fs.readFile(f,(e,data)=>{if(e){rq.writeHead(404,{"content-type":"text/plain"});rq.end("404");return;}
  rq.writeHead(200,{"content-type":TYPES[path.extname(f).toLowerCase()]||"application/octet-stream","x-content-type-options":"nosniff"});rq.end(data);});
}).listen(8903,"127.0.0.1",()=>console.log("8903"));
