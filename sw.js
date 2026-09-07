/* ════════════════════════════════════════════════════════════════════════
   СЛУЖЕБНЫЙ РАБОТНИК «ГРАНИ МИРОВ»
   Раньше страница пыталась зарегистрировать sw.js, которого в репозитории не
   было: на каждой загрузке с GitHub Pages браузер получал 404 и писал ошибку
   в консоль. Теперь работник настоящий и делает две полезные вещи.

   1. Игра открывается без сети. Страница кладётся в кэш при установке, а
      дальше берётся «сначала сеть, потом кэш»: обновление на Pages доходит
      сразу, но если сети нет — игра всё равно запускается.
   2. Звуки не качаются дважды. Записи в sounds/ неизменяемы, поэтому для них
      порядок обратный: сначала кэш, потом сеть. Первый раз запись приходит с
      сервера и остаётся на устройстве; дальше маяк звучит мгновенно и работает
      в самолёте.

   Важно про Range. Браузер просит любую запись через <audio> с заголовком
   Range: bytes=0- — то есть кусками. Ответ 206 в Cache Storage класть нельзя,
   это ошибка, а просто пропускать такие запросы мимо кэша нельзя тем более:
   тогда в кэш не попадёт вообще ни одна запись. Поэтому работник сам ходит за
   целым файлом (обычным запросом, без Range), кладёт его в кэш и уже из кэша
   собирает игроку тот кусок, который тот попросил.
   ════════════════════════════════════════════════════════════════════════ */
const VERSION="grani-v1";
const SHELL=VERSION+"-shell";
const MEDIA=VERSION+"-media";
const SHELL_FILES=["./","./index.html","./manifest.json"];

self.addEventListener("install",e=>{
 e.waitUntil((async()=>{
  try{const c=await caches.open(SHELL);await c.addAll(SHELL_FILES);}catch(_){}
  self.skipWaiting();
 })());
});

self.addEventListener("activate",e=>{
 e.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==SHELL&&k!==MEDIA).map(k=>caches.delete(k)));
  await self.clients.claim();
 })());
});

self.addEventListener("fetch",e=>{
 const req=e.request;
 if(req.method!=="GET")return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;
 /* Записи неизменяемы: сначала кэш, потом сеть, с поддержкой кусков. */
 if(url.pathname.includes("/sounds/")){e.respondWith(media(req,url));return;}

 /* Частичная загрузка чего-то другого — мимо кэша, как есть. */
 if(req.headers.has("range"))return;

 /* Страница и всё остальное: сначала сеть, потом кэш. */
 e.respondWith((async()=>{
  try{
   const res=await fetch(req);
   if(res&&res.ok&&res.status===200&&(req.mode==="navigate"||url.pathname.endsWith(".html")||url.pathname.endsWith("/")||url.pathname.endsWith("manifest.json"))){
    const c=await caches.open(SHELL);c.put(req,res.clone()).catch(()=>{});}
   return res;
  }catch(err){
   const hit=await caches.match(req)||await caches.match("./index.html");
   if(hit)return hit;
   throw err;}
 })());
});

/* ── Запись целиком в кэше, игроку — запрошенный кусок ── */
async function media(req,url){
 const key=new Request(url.origin+url.pathname,{credentials:"same-origin"});
 const range=req.headers.get("range");
 let res=null;
 try{
  const c=await caches.open(MEDIA);
  res=await c.match(key);
  if(!res){
   const net=await fetch(key);
   if(!net||!net.ok||net.status!==200)return net;
   try{await c.put(key,net.clone());}catch(_){}
   res=net;}
 }catch(err){
  /* Кэш недоступен или сети нет — пробуем как есть. */
  try{return await fetch(req);}catch(_){ if(res)return res; throw err;}
 }
 if(!range)return res;
 try{
  const buf=await res.clone().arrayBuffer();
  const total=buf.byteLength;
  const m=/bytes=(\d*)-(\d*)/.exec(range)||[];
  let start=m[1]?parseInt(m[1],10):0;
  let end=m[2]?parseInt(m[2],10):total-1;
  if(!isFinite(start)||start<0||start>=total)start=0;
  if(!isFinite(end)||end>=total||end<start)end=total-1;
  const part=buf.slice(start,end+1);
  return new Response(part,{status:206,statusText:"Partial Content",headers:{
   "Content-Type":res.headers.get("Content-Type")||"application/octet-stream",
   "Content-Length":String(part.byteLength),
   "Content-Range":"bytes "+start+"-"+end+"/"+total,
   "Accept-Ranges":"bytes"}});
 }catch(_){return res;}
}
