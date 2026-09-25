/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 185: ФОНЫ ПОСТРОЕК БЕЗ ШВА, ХРАМ-КОЛОКОЛ, ГОЛОСА МЕСТ

   Жалобы и просьбы игрока (версия 3.4).
   • «Звук должен проигрываться непрерывно: сейчас слышно, как он
     проигрался, пауза, снова» — в кузнице, в трактире. Фон дома был
     очагом в 2,7 секунды, трактир — 3,9 секунды с секундой тишины.
   • «Разные фоновые звуки для трактира, становищ, храма, для всех зданий,
     320 кбит/с».
   • «Даже если записи короткие — стык незаметен: в это время кузнец или
     кто-то ещё произносит короткую фразу».
   • «В энциклопедии звук храма — голуби. Храм должен звучать храмом:
     колокол».

   ЧТО ПРОВЕРЯЕТСЯ.
   1. У каждого рода постройки свой долгий фон; у подземных мест — у входа;
      у всех восьми станов — свой; файлы разные.
   2. Каждый фон — Ogg Vorbis не ниже 320 кбит/с, стерео, от 30 секунд,
      громкость в пределах соседних фонов; конец сходится с началом без
      скачка (петля без шва).
   3. Фон трактира к ночи людный, днём тихий; становище ночью затихает.
   4. Под крышей второй слой снят: звучит один долгий фон.
   5. Бесшовная петля: на повороте фона запись сменяется с перекрёстным
      затуханием, и зовётся onSeam.
   6. На повороте фона место подаёт голос — короткую русскую фразу, — но
      только когда игра молчит; речь игры обрывает его.
   7. Храм — колокол и хор: роль ad_temple, маяк храма и сигнал b_temple —
      новые записи, голубей в описании нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');const fs=require('fs');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const SND=path.join(__dirname,'..','sounds');

function probe(f){
 const o=spawnSync('ffprobe',['-v','error','-show_entries','format=bit_rate,duration:stream=channels,codec_name','-of','json',path.join(SND,f)],{encoding:'utf8'});
 try{const j=JSON.parse(o.stdout);return {br:Math.round((+j.format.bit_rate||0)/1000),dur:+j.format.duration,ch:j.streams[0].channels,codec:j.streams[0].codec_name};}catch(_){return null;}}
function lufs(f){
 const o=spawnSync('ffmpeg',['-nostdin','-hide_banner','-i',path.join(SND,f),'-af','ebur128','-f','null','-'],{encoding:'utf8'}).stderr||'';
 const m=o.match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*Threshold/);return m?+m[1]:null;}
function seam(f){
 const o=spawnSync('ffmpeg',['-v','error','-i',path.join(SND,f),'-f','f32le','-ac','2','-'],{maxBuffer:64*1024*1024});
 const b=o.stdout;const x=new Float32Array(b.buffer,b.byteOffset,Math.floor(b.length/4));
 const n=x.length/2;const at=(i,c)=>x[((i+n)%n)*2+c];
 const скачок=Math.max(Math.abs(at(0,0)-at(n-1,0)),Math.abs(at(0,1)-at(n-1,1)));
 let сосед=0;for(let i=-300;i<300;i++){if(i===-1)continue;
  for(let c=0;c<2;c++)сосед=Math.max(сосед,Math.abs(at(i+1,c)-at(i,c)));}
 return {скачок:+скачок.toFixed(4),сосед:+сосед.toFixed(4)};}

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 await page.evaluate(()=>{try{Intro.stop();}catch(_){}try{enterGame();G.tutorDone=1;}catch(_){}while(activeLayer())closeTopUI();});

 /* ── 1. свой фон у каждого места ── */
 const фоны=await page.evaluate(()=>{
  const out={места:{},станы:{},входы:{},файлы:[]};
  const виды=Object.keys(PLACE_KIND).filter(k=>PLACE_KIND[k]&&PLACE_KIND[k]!=="dungeon");
  for(const st of виды){
   G.place={kind:PLACE_KIND[st],bx:1200,by:1300,stype:st,name:"x",depth:0,x:1,y:1};
   out.места[st]=bankAmbientRole();}
  G.place=null;
  for(const k of CAMP_KINDS.map(k=>k.id))out.станы[k]=CAMP_BED[k]&&SOUND_BANK[CAMP_BED[k]]?CAMP_BED[k]:null;
  for(const st of Object.keys(PLACE_KIND).filter(k=>PLACE_KIND[k]==="dungeon"))out.входы[st]=STRUCT_BED[st]||null;
  out.файлы=Object.keys(SOUND_BANK).filter(r=>/^bed_/.test(r)).map(r=>SOUND_BANK[r].f).flat();
  return out;});
 const безФона=Object.entries(фоны.места).filter(([,r])=>!/^bed_/.test(r));
 const одинаковые=Object.values(фоны.места).filter(r=>/^bed_/.test(r));
 check('1. у каждого рода постройки свой долгий фон',
  безФона.length===0&&new Set(одинаковые).size===одинаковые.length,{безФона,места:фоны.места});
 check('1б. у всех восьми станов и у входа в каждое подземное место — свой фон',
  Object.values(фоны.станы).every(Boolean)&&Object.keys(фоны.станы).length===8&&Object.values(фоны.входы).every(Boolean),{станы:фоны.станы,входы:фоны.входы});

 /* ── 2. качество и шов ── */
 const плохие=[];const громкость=[];
 for(const f of фоны.файлы){
  const p=probe(f);const l=lufs(f);const ш=seam(f);громкость.push(l);
  if(!p||p.codec!=="vorbis"||p.br<320||p.ch!==2||p.dur<29.5)плохие.push({f,p});
  if(l===null||l<-27.5||l>-22.5)плохие.push({f,lufs:l});
  if(ш.скачок>Math.max(ш.сосед,0.002))плохие.push({f,шов:ш});}
 check('2. фоны — Ogg Vorbis от 320 кбит/с, стерео, от 30 секунд, ровной громкости, без шва на стыке',
  фоны.файлы.length>=36&&плохие.length===0,{файлов:фоны.файлы.length,плохие:плохие.slice(0,5),
   громкость:[Math.min(...громкость),Math.max(...громкость)]});

 /* ── 3–4. время суток и один слой ── */
 const пора=await page.evaluate(()=>{
  const r={};const loops=[];const o=Bank.loop.bind(Bank);
  Bank.loop=(ch,role,op)=>{loops.push([ch,role]);return o(ch,role,op);};
  G.place={kind:"house",bx:1200,by:1300,stype:"tavern",name:"x",depth:0,x:1,y:1};
  G.hour=12;r.трактирДнём=bankAmbientRole();G.hour=22;r.трактирНочью=bankAmbientRole();
  G.place.stype="warcamp";G.hour=12;r.станДнём=bankAmbientRole();G.hour=23;r.станНочью=bankAmbientRole();
  G.hour=12;G.place.stype="forge";loops.length=0;bankUpdateAmbient();
  r.слои=loops.map(l=>l.join(":"));r.живой=Bank.loops.has("live");
  Bank.loop=o;return r;});
 check('3. трактир к ночи людный, днём тихий; становище ночью затихает',
  пора.трактирДнём==="bed_tavern_quiet"&&пора.трактирНочью==="bed_tavern"&&пора.станДнём==="bed_warcamp"&&пора.станНочью==="bed_warcamp_night",пора);
 check('4. под крышей звучит один долгий фон: второго слоя нет',
  пора.слои.some(x=>x==="place:bed_forge")&&!пора.слои.some(x=>/^live:/.test(x))&&!пора.живой,пора.слои);

 /* ── 5. бесшовная петля и onSeam ── */
 const петля=await page.evaluate(async()=>{
  const швы=[];const было=Bank.onSeam;Bank.onSeam=(ch,role,rec)=>{швы.push([ch,role]);};
  const el=Bank.loop("place","bed_school",{seed:1,gain:0.5,kind:"ambient"});
  const rec=Bank.loops.get("place");
  await new Promise(r=>{if(el.readyState>=1)r();else el.addEventListener("loadedmetadata",r,{once:true});setTimeout(r,4000);});
  try{el.currentTime=Math.max(0,el.duration-1.2);}catch(_){}
  const t0=Date.now();let видели2=false;
  while(Date.now()-t0<6000){await new Promise(r=>setTimeout(r,100));if(rec.el2)видели2=true;if(rec.seams>0&&!rec.fading)break;}
  const r={seams:rec.seams,видели2,швы:швы.slice(),бесшовный:!!rec.seamless,играет:rec.el&&!rec.el.paused};
  Bank.onSeam=было;Bank.stop("place");return r;});
 check('5. поворот петли: две записи с перекрёстным затуханием, и зовётся onSeam',
  петля.бесшовный&&петля.seams>=1&&петля.видели2&&петля.швы.some(s=>s[0]==="place"),петля);

 /* ── 6. голос места на повороте ── */
 const голос=await page.evaluate(async()=>{
  const r={};
  G.place={kind:"house",bx:1200,by:1300,stype:"forge",name:"Кузница",depth:0,x:1,y:1};
  while(activeLayer())closeTopUI();
  Speech.stop({user:false});PlaceVoice.last=0;PlaceVoice.речьДо=0;
  const played=[];const s0=Spatial.role.bind(Spatial);Spatial.role=(role,...a)=>{played.push(role);return s0(role,...a);};
  const b0=Bank.play.bind(Bank);Bank.play=(role,o)=>{played.push(role);return b0(role,o);};
  r.роль=PlaceVoice.role();
  Bank.onSeam("place","bed_forge",{});r.сказал=played.includes("pv_forge");
  /* Игра говорит — голос места молчит. */
  played.length=0;PlaceVoice.last=0;
  Speech.say("Проверка речи игры.",{interrupt:true});
  Bank.onSeam("place","bed_forge",{});r.молчитПодРечью=!played.includes("pv_forge");
  /* Заговорила игра — голос места обрывается. */
  Speech.stop({user:false});PlaceVoice.last=0;PlaceVoice.речьДо=0;
  Bank.onSeam("place","bed_forge",{});const был=!!(PlaceVoice.rec||PlaceVoice.el);
  Speech.say("Игра снова говорит.",{interrupt:true});r.оборван=был&&!PlaceVoice.rec&&!PlaceVoice.el;
  Spatial.role=s0;Bank.play=b0;
  r.места=Object.entries(PLACE_VOICE).filter(([,v])=>SOUND_BANK[v]&&SOUND_BANK[v].f.length>=3).length;
  r.всего=Object.keys(PLACE_VOICE).length;
  r.станы=Object.values(CAMP_VOICE).every(v=>SOUND_BANK[v]&&SOUND_BANK[v].f.length>=3);
  r.файлы=Object.keys(SOUND_BANK).filter(k=>/^pv_/.test(k)).map(k=>SOUND_BANK[k].f).flat();
  G.place=null;return r;});
 check('6. на повороте фона кузнец подаёт голос',голос.роль==="pv_forge"&&голос.сказал,голос);
 check('6б. пока говорит игра, голос места молчит, а заговорившая игра его обрывает',голос.молчитПодРечью&&голос.оборван,голос);
 check('6в. у каждого места и стана не меньше трёх фраз',голос.места===голос.всего&&голос.станы,{мест:голос.места,всего:голос.всего});
 const фразы=голос.файлы.map(f=>({f,p:probe(f)}));
 const плохиеФразы=фразы.filter(x=>!x.p||x.p.br<315||x.p.dur<0.5||x.p.dur>6);
 check('6г. фразы — MP3 320 кбит/с, от полусекунды до шести секунд',фразы.length>=120&&плохиеФразы.length===0,
  {фраз:фразы.length,плохие:плохиеФразы.slice(0,4)});

 /* ── 7. храм ── */
 const храм=await page.evaluate(()=>({f:SOUND_BANK.ad_temple.f,d:SOUND_BANK.ad_temple.d,маяк:BEACON_SAMPLE.temple,сигнал:UI_BANK.b_temple,
  сцена:LIVE_SCENE.temple,окрестность:AMBIENCE_SET.temple.spots.map(x=>x[0])}));
 const храмФайлы=храм.f.map(f=>({f,p:probe(f),есть:fs.existsSync(path.join(SND,f))}));
 check('7. храм звучит колоколом и хором: новые записи без потерь, голубей нет',
  храм.f.every(f=>/^bed\/temple_hall_0\d\.flac$/.test(f))&&храмФайлы.every(x=>x.есть&&x.p&&x.p.codec==="flac"&&x.p.dur>4)
  &&/колокол/.test(храм.d)&&!/голуб/.test(храм.d)&&!fs.existsSync(path.join(SND,"ad/ad_temple_01.flac")),{храм,храмФайлы});
 check('7б. маяк и сигнал храма — тот же колокол; сцены храма — колокола, без джингла постройки и немой часовни',
  храм.маяк==="bed/temple_hall_01.flac"&&храм.сигнал==="bed/temple_hall_01.flac"
  &&!храм.сцена.includes("hall_temple")&&!храм.окрестность.includes("uh_chapel"),храм);

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
