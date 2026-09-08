#!/usr/bin/env node
/* ════════════════════════════════════════════════════════════════════════
   ПРОГОН ВСЕХ ПРОВЕРОК «ГРАНИ МИРОВ»

   Поднимает локальный сервер (он нужен: часть проверок слушает записи и
   служебного работника, а те работают только по http) и по очереди
   запускает каждый набор из этой папки, передавая ему адрес игры.

   Запуск:
     node tests/run.js              — все наборы
     node tests/run.js test16       — только названные
     node tests/run.js --file       — прогнать ещё и по file://, как у игрока,
                                      открывшего игру одним файлом
   ════════════════════════════════════════════════════════════════════════ */
const http=require("http"),fs=require("fs"),path=require("path"),{spawn}=require("child_process");
const ROOT=path.resolve(__dirname,"..");
/* Игра выложена на GitHub Pages не в корне, а по имени репозитория. Прогон
   повторяет это: так проверяются и относительные пути, и область служебного
   работника — ровно то, что ломается при переезде на подпуть. */
const PREFIX="/"+path.basename(ROOT);
const TYPES={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",
 ".json":"application/manifest+json",".png":"image/png",".mp3":"audio/mpeg",
 ".wav":"audio/wav",".flac":"audio/flac",".ogg":"audio/ogg",".md":"text/plain; charset=utf-8",
 ".txt":"text/plain; charset=utf-8"};

function serve(){
 return new Promise(res=>{
  const srv=http.createServer((req,rq)=>{
   let url=decodeURIComponent(req.url.split("?")[0]);
   if(url.startsWith(PREFIX))url=url.slice(PREFIX.length);
   if(!url||url==="/")url="/index.html";
   let f=path.join(ROOT,url.replace(/^\/+/,""));
   if(!f.startsWith(ROOT)){rq.writeHead(403);rq.end();return;}
   fs.readFile(f,(e,data)=>{
    if(e){rq.writeHead(404,{"content-type":"text/plain"});rq.end("404");return;}
    rq.writeHead(200,{"content-type":TYPES[path.extname(f).toLowerCase()]||"application/octet-stream",
     "x-content-type-options":"nosniff"});
    rq.end(data);});
  });
  srv.listen(0,"127.0.0.1",()=>res({srv,port:srv.address().port}));
 });
}

function runOne(file,url){
 return new Promise(res=>{
  const p=spawn(process.execPath,[file,url],{cwd:ROOT});
  let out="",err="";
  p.stdout.on("data",d=>out+=d);p.stderr.on("data",d=>err+=d);
  p.on("close",code=>{
   const pass=(out.match(/^PASS/gm)||[]).length;
   const fail=(out.match(/^FAIL/gm)||[]).length;
   res({pass,fail,code,out,err});});
 });
}

(async()=>{
 const args=process.argv.slice(2);
 const alsoFile=args.includes("--file");
 const only=args.filter(a=>!a.startsWith("--"));
 let files=fs.readdirSync(__dirname).filter(f=>/^\d+-.*\.js$/.test(f)).sort();
 if(only.length)files=files.filter(f=>only.some(o=>f.includes(o)));
 if(!files.length){console.error("Наборы не найдены.");process.exit(2);}

 const {srv,port}=await serve();
 const url=`http://127.0.0.1:${port}${PREFIX}/index.html`;
 let pass=0,fail=0,broken=[];
 console.log(`Игра: ${url}\nНаборов: ${files.length}\n`);
 for(const f of files){
  const r=await runOne(path.join(__dirname,f),url);
  pass+=r.pass;fail+=r.fail;
  const bad=r.fail>0||(r.code!==0&&r.pass===0);
  if(bad)broken.push(f);
  console.log(`${bad?"✗":"✓"} ${f.padEnd(18)} ${r.pass} прошло, ${r.fail} провалено`);
  if(r.fail)console.log(r.out.split("\n").filter(l=>l.startsWith("FAIL")).map(l=>"    "+l).join("\n"));
  if(r.code!==0&&r.pass===0&&r.err)console.log("    "+r.err.split("\n").slice(0,4).join("\n    "));
 }
 if(alsoFile){
  console.log("\nТо же самое по file:// — как у игрока с одним файлом:");
  const fileUrl="file://"+path.join(ROOT,"index.html");
  for(const f of files){
   const r=await runOne(path.join(__dirname,f),fileUrl);
   pass+=r.pass;fail+=r.fail;
   const bad=r.fail>0||(r.code!==0&&r.pass===0);
   if(bad)broken.push(f+" (file://)");
   console.log(`${bad?"✗":"✓"} ${f.padEnd(18)} ${r.pass} прошло, ${r.fail} провалено`);
   if(r.fail)console.log(r.out.split("\n").filter(l=>l.startsWith("FAIL")).map(l=>"    "+l).join("\n"));
  }
 }
 srv.close();
 console.log(`\nИТОГО: ${pass} проверок прошло, ${fail} провалено.`);
 if(broken.length)console.log("Сломано: "+broken.join(", "));
 process.exit(fail||broken.length?1:0);
})();
