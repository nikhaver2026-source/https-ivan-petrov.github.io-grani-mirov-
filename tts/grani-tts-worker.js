/* ════════════════════════════════════════════════════════════════════════
   ВСТРОЕННЫЙ ГОЛОС ИГРЫ — РАБОЧИЙ ПОТОК
   ════════════════════════════════════════════════════════════════════════
   Русская речь без сети и без чужого сервера: нейросетевой голос Piper
   (VITS) считается прямо на устройстве, в отдельном потоке, чтобы игра не
   замирала, пока он думает.

   Путь фразы:
     текст → числа словами, знаки → слова → звуки (словарь игры, а для
     незнакомых слов — правила с ударением по окончанию) → номера звуков
     модели → модель → волна 22 050 Гц, по предложению, чтобы первое
     предложение звучало, пока считается второе.

   Составные части и их лицензии:
     модель ru_RU-denis-medium — Piper, данные CC0 (OHF-Voice/voice-datasets);
     onnxruntime-web — MIT (Microsoft);
     словарь звуков tts/ru-lex.tsv и таблица ударений tts/ru-stress.json —
       собраны для слов самой игры;
     разбор незнакомых слов tts/ru-g2p.js — свой, без eSpeak.
   Ни одной части под GPL.

   Сообщения:
     в поток  {type:"init", base, models:[url…]}
              {type:"speak", id, text, speed}
              {type:"cancel", id}
     из потока {type:"progress", loaded, total}
              {type:"ready"} | {type:"fail", error}
              {type:"audio", id, pcm(Float32Array), rate, last}
              {type:"done", id}
   ════════════════════════════════════════════════════════════════════════ */
let движок=null,сессия=null,словарь=null,карта=null,готово=false,отменён=new Set();

const КАРТА_ПО_УМОЛЧАНИЮ=(()=>{
 /* Общая карта звуков всех голосов Piper с разбором eSpeak: у голосов
    ru_RU она одна и та же. Если рядом с моделью лежит её .json, берётся он. */
 const s="_^$ !'(),-.:;?abcdefhijklmnopqrstuvwxyzæçðøħŋœǀǁǂǃɐɑɒɓɔɕɖɗɘəɚɛɜɞɟɠɡɢɣɤɥɦɧɨɪɫɬɭɮɯɰɱɲɳɴɵɶɸɹɺɻɽɾʀʁʂʃʄʈʉʊʋʌʍʎʏʐʑʒʔʕʘʙʛʜʝʟʡʢʲˈˌːˑ˞βθχᵻⱱ0123456789";
 const m={};[...s].forEach((c,i)=>{m[c]=[i];});
 ["̧","̃","̪","̯","̩","ʰ","ˤ","ε","↓","#","\"","↑"].forEach((c,i)=>{m[c]=[140+i];});
 return m;})();

/* ── служебные слова: так их произносит эталон голоса во фразе ── */
const СЛУЖЕБНЫЕ={во:"vˈo",с:"s",со:"sˈo",к:"k",ко:"kˈo",у:"u",о:"ˈo",об:"ˈop",обо:"ˈobʌ",на:"nə",
 за:"za",по:"pˈo",до:"dˈo",из:"ɪs",от:"ot",без:"bʲˈes",под:"pˈot",над:"nɑt",при:"prʲɪ",про:"prˈo",
 через:"tʃʲˈerʲis",для:"dɭʲɑ",не:"nʲɪ",ни:"nʲɪ",и:"ɪ",а:"a",но:"no",же:"ʒˈɛ",ли:"ɭʲˈɪ",бы:"by",
 что:"ʃto",как:"kˈɑk"};
const ГЛУХИЕ=/^(ˈ)?(p|t|k|f|s|ʃ|ts|tʃ|x|ɕ)/;

/* ── числа словами ── */
const ЕД=["","один","два","три","четыре","пять","шесть","семь","восемь","девять"];
const ЕДЖ=["","одна","две","три","четыре","пять","шесть","семь","восемь","девять"];
const НАДЦ=["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
const ДЕС=["","","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
const СОТ=["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];
function форма(n,ф){n=Math.abs(n)%100;const n1=n%10;if(n>10&&n<20)return ф[2];if(n1>1&&n1<5)return ф[1];if(n1===1)return ф[0];return ф[2];}
function тройка(n,жен){const r=[];const с=Math.floor(n/100),д=Math.floor(n%100/10),е=n%10;
 if(с)r.push(СОТ[с]);if(д===1)r.push(НАДЦ[е]);else{if(д)r.push(ДЕС[д]);if(е)r.push((жен?ЕДЖ:ЕД)[е]);}return r.join(" ");}
function числоСловами(n){
 n=Math.floor(Math.abs(n));if(n===0)return "ноль";
 const части=[];const ступени=[[1e9,["миллиард","миллиарда","миллиардов"],false],[1e6,["миллион","миллиона","миллионов"],false],[1e3,["тысяча","тысячи","тысяч"],true]];
 for(const [с,ф,жен] of ступени){if(n>=с){const k=Math.floor(n/с);части.push(тройка(k,жен)+" "+форма(k,ф));n%=с;}}
 if(n)части.push(тройка(n,false));
 return части.join(" ");}

/* ── латиница буквами кириллицы: редкие имена вроде ElevenLabs ── */
const ЛАТ={a:"а",b:"б",c:"к",d:"д",e:"е",f:"ф",g:"г",h:"х",i:"и",j:"дж",k:"к",l:"л",m:"м",n:"н",o:"о",p:"п",q:"к",r:"р",s:"с",t:"т",u:"у",v:"в",w:"в",x:"кс",y:"й",z:"з"};

function нормализовать(t){
 t=String(t||"");
 t=t.replace(/(\d+)[,.](\d+)/g,(m,a,b)=>`${числоСловами(+a)} и ${числоСловами(+b)}`)
  .replace(/\d+/g,m=>" "+числоСловами(+m)+" ")
  .replace(/%/g," процентов ").replace(/×/g," на ").replace(/\+/g," плюс ")
  .replace(/[A-Za-z]+/g,m=>m.toLowerCase().split("").map(c=>ЛАТ[c]||"").join(""))
  .replace(/[«»"“”„]/g,"").replace(/[—–]/g,",").replace(/…/g,".")
  .replace(/[()[\]{}]/g,",")
  .replace(/[^А-Яа-яЁё\s.,!?:;-]/g," ")
  .replace(/\s*([.,!?:;])\s*/g,"$1 ").replace(/([.,!?:;])[.,!?:;]+/g,"$1")
  .replace(/\s+/g," ").trim();
 return t;}

function слово(w){
 w=w.toLowerCase();
 if(словарь&&словарь.has(w))return словарь.get(w);
 if(w.includes("-"))return w.split("-").filter(Boolean).map(слово).join(" ");
 return self.RuG2P?self.RuG2P.g2p(w):"";}

/* Текст → предложения, каждое — строкой звуков. */
function звуки(текст){
 const t=нормализовать(текст);
 if(!t)return [];
 const предложения=t.match(/[^.!?]+[.!?]?/g)||[t];
 const out=[];
 for(const пр of предложения){
  const токены=пр.trim().match(/[А-Яа-яЁё]+(?:-[А-Яа-яЁё]+)*|[.,!?:;]/g)||[];
  let s="";
  for(let i=0;i<токены.length;i++){
   const ток=токены[i];
   if(/^[.,!?:;]$/.test(ток)){s=s.replace(/ $/,"")+ток+" ";continue;}
   const н=ток.toLowerCase();
   const следующее=токены[i+1]&&!/^[.,!?:;]$/.test(токены[i+1])?токены[i+1]:null;
   let p;
   if(следующее&&н==="в"){const сл=слово(следующее);p=ГЛУХИЕ.test(сл)?"f":"v";}
   else if(следующее&&СЛУЖЕБНЫЕ[н]!=null)p=СЛУЖЕБНЫЕ[н];
   else p=слово(н);
   if(p)s+=p+" ";}
  s=s.trim();
  if(s)out.push(s);}
 return out;}

function номера(s){
 const ids=[1,0];
 for(const c of s){const id=карта[c];if(!id)continue;ids.push(...id,0);}
 ids.push(2);
 return ids;}

async function скачать(url,наПрогресс){
 /* Модель кладётся в кэш устройства: второй раз её не качают. */
 let cache=null;
 try{cache=await caches.open("grani-tts-v1");const есть=await cache.match(url);if(есть)return await есть.arrayBuffer();}catch(_){}
 const r=await fetch(url);
 if(!r.ok)throw new Error("HTTP "+r.status);
 const всего=Number(r.headers.get("content-length"))||0;
 let буф;
 if(r.body&&r.body.getReader){
  const rd=r.body.getReader();const куски=[];let взято=0,последний=0;
  for(;;){const {done,value}=await rd.read();if(done)break;куски.push(value);взято+=value.length;
   if(Date.now()-последний>500){последний=Date.now();наПрогресс(взято,всего);}}
  буф=new Uint8Array(взято);let o=0;for(const k of куски){буф.set(k,o);o+=k.length;}
  буф=буф.buffer;
 }else буф=await r.arrayBuffer();
 try{if(cache)await cache.put(url,new Response(буф.slice(0),{headers:{"content-type":"application/octet-stream"}}));}catch(_){}
 return буф;}

async function init(base,models){
 importScripts(base+"ort/ort.wasm.min.js",base+"ru-g2p.js");
 движок=self.ort;
 движок.env.wasm.wasmPaths=base+"ort/";
 движок.env.wasm.numThreads=1;
 движок.env.wasm.proxy=false;
 const [лекс,удар]=await Promise.all([
  fetch(base+"ru-lex.tsv").then(r=>r.ok?r.text():""),
  fetch(base+"ru-stress.json").then(r=>r.ok?r.json():null).catch(()=>null)]);
 словарь=new Map();
 лекс.split("\n").forEach(l=>{const i=l.indexOf("\t");if(i>0)словарь.set(l.slice(0,i),l.slice(i+1));});
 if(удар&&self.RuG2P)self.RuG2P.setSuffixes(удар);
 карта=КАРТА_ПО_УМОЛЧАНИЮ;
 let последняяОшибка=null;
 for(const url of models){
  try{
   const буф=await скачать(url,(l,t)=>postMessage({type:"progress",loaded:l,total:t}));
   сессия=await движок.InferenceSession.create(буф,{executionProviders:["wasm"],graphOptimizationLevel:"all"});
   try{const j=await fetch(url+".json").then(r=>r.ok?r.json():null);if(j&&j.phoneme_id_map)карта=j.phoneme_id_map;}catch(_){}
   готово=true;postMessage({type:"ready",model:url});return;
  }catch(e){последняяОшибка=e;}}
 postMessage({type:"fail",error:String(последняяОшибка||"нет модели")});}

async function сказать(id,текст,speed){
 const части=звуки(текст);
 const ls=Math.max(0.25,Math.min(2,1/Math.max(0.5,+speed||1)));
 for(let i=0;i<части.length;i++){
  if(отменён.has(id))break;
  const ids=номера(части[i]);
  const input=new движок.Tensor("int64",BigInt64Array.from(ids.map(BigInt)),[1,ids.length]);
  const lens=new движок.Tensor("int64",BigInt64Array.from([BigInt(ids.length)]),[1]);
  const scales=new движок.Tensor("float32",Float32Array.from([0.667,ls,0.8]),[3]);
  const r=await сессия.run({input,input_lengths:lens,scales});
  if(отменён.has(id))break;
  const pcm=r.output.data;
  const копия=new Float32Array(pcm.length);копия.set(pcm);
  postMessage({type:"audio",id,pcm:копия,rate:22050,last:i===части.length-1},[копия.buffer]);}
 отменён.delete(id);
 postMessage({type:"done",id});}

onmessage=e=>{
 const m=e.data||{};
 if(m.type==="init")init(m.base,m.models||[]).catch(err=>postMessage({type:"fail",error:String(err)}));
 else if(m.type==="speak"){
  if(!готово){postMessage({type:"done",id:m.id,skipped:true});return;}
  сказать(m.id,m.text,m.speed).catch(err=>{postMessage({type:"error",id:m.id,error:String(err)});postMessage({type:"done",id:m.id});});}
 else if(m.type==="cancel")отменён.add(m.id);
 else if(m.type==="phonemes")postMessage({type:"phonemes",id:m.id,parts:(()=>{try{
  if(!словарь){/* разбор без модели — для проверки */}
  return звуки(m.text);}catch(err){return [String(err)];}})()});
 else if(m.type==="lexicon"){
  /* Только словарь и разбор, без модели: для проверок и для «прослушать разбор». */
  (async()=>{try{importScripts(m.base+"ru-g2p.js");
   const [лекс,удар]=await Promise.all([fetch(m.base+"ru-lex.tsv").then(r=>r.text()),fetch(m.base+"ru-stress.json").then(r=>r.json()).catch(()=>null)]);
   словарь=new Map();лекс.split("\n").forEach(l=>{const i=l.indexOf("\t");if(i>0)словарь.set(l.slice(0,i),l.slice(i+1));});
   if(удар)self.RuG2P.setSuffixes(удар);карта=КАРТА_ПО_УМОЛЧАНИЮ;
   postMessage({type:"lexicon",words:словарь.size});}catch(err){postMessage({type:"fail",error:String(err)});}})();}
};
