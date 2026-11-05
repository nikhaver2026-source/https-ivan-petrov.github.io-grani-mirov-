/* srv8903.js — обычный сервер игры для наборов (без собирателя речи) */
const http=require("http"),fs=require("fs"),path=require("path");
const ROOT="/home/user/https-ivan-petrov.github.io-grani-mirov-";const PREFIX="/"+path.basename(ROOT);
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".json":"application/manifest+json",".png":"image/png",".mp3":"audio/mpeg",".wav":"audio/wav",".flac":"audio/flac",".ogg":"audio/ogg",".mjs":"text/javascript; charset=utf-8",".wasm":"application/wasm",".onnx":"application/octet-stream"};
http.createServer((req,rq)=>{let url=decodeURIComponent(req.url.split("?")[0]);if(url.startsWith(PREFIX))url=url.slice(PREFIX.length);if(!url||url==="/")url="/index.html";
 const f=path.join(ROOT,url.replace(/^\/+/,""));
 fs.readFile(f,(e,data)=>{if(e){rq.writeHead(404);rq.end("404");return;}rq.writeHead(200,{"content-type":TYPES[path.extname(f).toLowerCase()]||"application/octet-stream"});rq.end(data);});
}).listen(8903,"127.0.0.1",()=>console.log("8903"));
