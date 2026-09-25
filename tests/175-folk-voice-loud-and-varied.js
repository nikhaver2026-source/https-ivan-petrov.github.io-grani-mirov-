/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 175: ЖИТЕЛИ ГОВОРЯТ ГРОМЧЕ И ПО-РАЗНОМУ

   Жалоба игрока: реплики жителей тихие — торговец в подземелье еле слышен,
   — и однообразные.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Громче на деле: запись речи проигрывается и слушается анализатором на
      выходе игры. Новый путь громче прежнего не меньше чем на шесть
      децибел, под речью игры — не меньше чем на семь, и без перегруза:
      пик ниже нуля.
   2. Устройство: голос жителя идёт через сжатие; не приглушается под речь
      игры; не зависит от ползунка эффектов; отзвука ему меньше; стена его
      глушит, но не прячет. Плоский путь (без объёмного звука) тоже сжат.
   3. Подземный торговец: шум места вполголоса и без дублей — касса одна,
      тележка одна, маяк лавки не гремит поверх голоса; маяк жителя тише
      речи; описание костра и карточка — одной речью, а не обрывают друг
      друга; первой в карточке звучит фраза самого торговца.
   4. Тембр: у каждого жителя свой, в пределах ±5 %, и тот же при каждой
      встрече.
   5. Оклик меняется: первая встреча — народ и ремесло; дальше чередуется,
      подряд не повторяется; недруг отвечает отказом или угрозой, торговец
      — торгом.
   6. Прощание: закрыв окно жителя, герой слышит «Ступай с миром»; от
      холодного — ничего.
   7. Строки: пулы приветствий по ремеслу, месту и настрою; строки улицы
      втрое больше и не повторяются подряд.
   8. Голоса прохожих — каналом голосов и сжаты.
   9. Руководство, новости, README и docs.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const ROOT=path.resolve(__dirname,'..');
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(400);

 /* ── 1. Громкость на выходе ── */
 const гр=await page.evaluate(async()=>{
  settings.effects=1;settings.hrtf=1;settings.music=0;settings.ambVol=0;settings.fxVol=1;settings.masterVol=1;settings.npcVol=1;settings.duck=0.5;
  const c=AE.ensure();await c.resume();AE.applyVolumes();
  try{Bank.loops.forEach(l=>{try{l.el.pause();}catch(_){}});}catch(_){}
  try{Scape.stop();}catch(_){} try{Actors.stop();}catch(_){}
  const an=c.createAnalyser();an.fftSize=1024;AE.master.connect(an);
  const z=c.createGain();z.gain.value=0;an.connect(z);z.connect(c.destination);
  const buf=new Float32Array(an.fftSize);
  async function мер(fn,sec){
   await new Promise(r=>setTimeout(r,300));
   fn();
   const fr=[];let pk=0;const t0=performance.now();
   while(performance.now()-t0<sec*1000){
    an.getFloatTimeDomainData(buf);let sq=0;
    for(let i=0;i<buf.length;i++){const v=buf[i];sq+=v*v;if(Math.abs(v)>pk)pk=Math.abs(v);}
    fr.push(Math.sqrt(sq/buf.length));
    await new Promise(r=>setTimeout(r,20));}
   const g=fr.filter(x=>x>0.003);
   const rms=g.length?Math.sqrt(g.reduce((a,b)=>a+b*b,0)/g.length):0;
   const db=x=>x>0?Math.round(20*Math.log10(x)*10)/10:-99;
   return {rms:db(rms),peak:db(pk),кадров:g.length};}
  const f="voice/prof_torgovec.mp3";
  const r={};
  /* Прежний путь — ровно так, как его звали до правки. */
  r.прежде=await мер(()=>Spatial.at(f,0,1,{gain:0.95,kind:"npc",maxSec:5}),3.6);
  r.теперь=await мер(()=>Spatial.at(f,0,1,{gain:VOICE_MIX.gain,kind:"npc",voice:true,maxSec:5}),3.6);
  Speech.ducking=true;
  r.преждеПодРечью=await мер(()=>Spatial.at(f,0,1,{gain:0.95,kind:"npc",maxSec:5}),3.6);
  r.теперьПодРечью=await мер(()=>Spatial.at(f,0,1,{gain:VOICE_MIX.gain,kind:"npc",voice:true,maxSec:5}),3.6);
  Speech.ducking=false;
  an.disconnect();z.disconnect();
  return r;});
 check('голос жителя звучит на деле: анализатор слышит запись',
  гр.прежде.кадров>40&&гр.теперь.кадров>40,гр);
 check('новый путь громче прежнего не меньше чем на шесть децибел',
  гр.теперь.rms-гр.прежде.rms>=6,{прежде:гр.прежде.rms,теперь:гр.теперь.rms});
 check('под речью игры голос громче прежнего не меньше чем на семь децибел',
  гр.теперьПодРечью.rms-гр.преждеПодРечью.rms>=7,{прежде:гр.преждеПодРечью.rms,теперь:гр.теперьПодРечью.rms});
 check('без перегруза: пик голоса ниже нуля',
  гр.теперь.peak<0&&гр.теперьПодРечью.peak<0,{пик:гр.теперь.peak,подРечью:гр.теперьПодРечью.peak});

 /* ── 2. Устройство пути ── */
 const путь=await page.evaluate(async()=>{
  settings.effects=1;settings.hrtf=1;settings.fxVol=1;settings.masterVol=1;settings.npcVol=1;settings.duck=0.5;
  const r={};
  const f="voice/say_torg.mp3";
  const взять=()=>Spatial.live[Spatial.live.length-1];
  Speech.ducking=false;
  Spatial.at(f,0,1,{gain:1,kind:"npc",voice:true,maxSec:1});const a=взять();
  Speech.ducking=true;
  Spatial.at(f,0,1,{gain:1,kind:"npc",voice:true,maxSec:1});const b=взять();
  Spatial.at(f,0,1,{gain:1,kind:"npc",maxSec:1});const b2=взять();
  Speech.ducking=false;
  Spatial.at(f,0,1,{gain:1,kind:"npc",maxSec:1});const a2=взять();
  r.сжатие=!!(a&&a.сж&&a.сж.nodes[0] instanceof DynamicsCompressorNode);
  r.обычныйБезСжатия=!(a2&&a2.сж);
  r.безПриглушения=a&&b?Math.abs(a.g.gain.value-b.g.gain.value)<1e-6:false;
  r.обычныйПриглушён=a2&&b2?b2.g.gain.value<a2.g.gain.value:false;
  /* Подъём после сжатия и сама громкость реплики жителя (gain VOICE_MIX). */
  r.подъём=a&&a.сж?a.сж.nodes[1].gain.value:0;
  Spatial.at(f,0,1,{gain:VOICE_MIX.gain,kind:"npc",voice:true,maxSec:1});const a3=взять();
  r.выше1=a3?a3.g.gain.value>1&&r.подъём>1:false;
  r.отзвук=a&&a2?{голос:a.wet.gain.value,обычный:a2.wet.gain.value}:null;
  /* Ползунок эффектов голос не убавляет: шина эффектов делится обратно. */
  settings.fxVol=0.5;
  Spatial.at(f,0,1,{gain:1,kind:"npc",voice:true,maxSec:1});const c=взять();
  settings.fxVol=1;
  r.эффекты=a&&c?{полн:a.g.gain.value,пол:c.g.gain.value}:null;
  /* Ползунок «Голоса людей» — убавляет. */
  settings.npcVol=0.5;
  Spatial.at(f,0,1,{gain:1,kind:"npc",voice:true,maxSec:1});const d=взять();
  settings.npcVol=1;
  r.голоса=a&&d?{полн:a.g.gain.value,пол:d.g.gain.value}:null;
  /* За тремя стенами голос глуше, но потолок преграды — полторы. */
  Spatial.at(f,0,3,{gain:1,kind:"npc",voice:true,occl:3,maxSec:1});const e=взять();
  Spatial.at(f,0,3,{gain:1,kind:"npc",occl:3,maxSec:1});const e2=взять();
  r.стена={голос:e?e.occl:null,обычный:e2?e2.occl:null,фильтр:!!(e&&e.lp)};
  /* Расстояние: голос слабеет медленнее. */
  r.спад={голос:e?e.pan.rolloffFactor:null,обычный:e2?e2.pan.rolloffFactor:null};
  /* Плоский путь (объёмный звук выключен) — тоже через сжатие. */
  settings.hrtf=0;
  const el=Folk.плоско(f,{gain:VOICE_MIX.gain,maxSec:1,kind:"npc",voice:true});
  r.плоско=!!(el&&el.__voice);
  settings.hrtf=1;
  Spatial.stopAll();
  return r;});
 check('голос жителя идёт через сжатие, прочие звуки — нет',путь.сжатие&&путь.обычныйБезСжатия,путь);
 check('под речью игры голос не приглушается, а прочие звуки канала — да',
  путь.безПриглушения&&путь.обычныйПриглушён,путь);
 check('голос поднят выше единицы',путь.выше1,путь);
 check('отзвука голосу меньше, чем прочим звукам',
  путь.отзвук&&Math.abs(путь.отзвук.голос-путь.отзвук.обычный*0.4)<1e-6,путь.отзвук);
 check('ползунок эффектов голос не убавляет, ползунок «Голоса людей» — убавляет',
  путь.эффекты&&Math.abs(путь.эффекты.пол-путь.эффекты.полн*2)<1e-3
  &&путь.голоса&&Math.abs(путь.голоса.пол-путь.голоса.полн*0.5)<1e-3,{эффекты:путь.эффекты,голоса:путь.голоса});
 check('за стеной голос глуше, но слышен: преграда не больше полутора',
  путь.стена.голос===1.5&&путь.стена.обычный===3&&путь.стена.фильтр,путь.стена);
 check('с расстоянием голос слабеет медленнее стука',
  путь.спад.голос<путь.спад.обычный,путь.спад);
 check('без объёмного звука голос тоже идёт через сжатие',путь.плоско,путь);

 /* ── 3. Подземный торговец ── */
 const торг=await page.evaluate(async()=>{
  while(activeLayer())closeTopUI();
  settings.effects=1;settings.hrtf=1;settings.folk=1;
  const r={звуки:[],маяки:[],речь:[],голос:[]};
  const оP=Bank.play.bind(Bank),оB=window.beacon,оS=Speech.say.bind(Speech),оA=Spatial.at.bind(Spatial);
  Bank.play=(role,o)=>{r.звуки.push({role,gain:(o||{}).gain});return оP(role,o);};
  beacon=(id,pan,dist,k)=>{r.маяки.push({id,k:k===undefined?1:k});return оB(id,pan,dist,k);};
  Speech.say=(t,o)=>{r.речь.push(String(t));return оS(t,o);};
  Spatial.at=(p,dx,dy,o)=>{if(/^voice\//.test(p))r.голос.push({p,voice:!!(o&&o.voice)});return оA(p,dx,dy,o);};
  try{
   G.place={kind:"dungeon",depth:3,bx:300,by:300,x:5,y:5,name:"Проверка",levels:null};
   Folk.когда=0;Folk.было.clear();
   talkInside("P",6,5);
   await new Promise(res=>setTimeout(res,900));
  }finally{Bank.play=оP;beacon=оB;Speech.say=оS;Spatial.at=оA;}
  r.окно=!document.getElementById("modal-npc").hidden;
  while(activeLayer())closeTopUI();
  G.place=null;
  return r;});
 const место=торг.звуки.filter(z=>["shop_till","deep_cart"].indexOf(z.role)>=0);
 check('шум подземного торга вполголоса: ни касса, ни тележка не громче 0,3',
  место.length>=2&&место.every(z=>z.gain<=0.3),торг.звуки);
 check('касса и тележка звучат по одному разу',
  торг.звуки.filter(z=>z.role==="deep_cart").length===1&&торг.звуки.filter(z=>z.role==="shop_till").length===1,торг.звуки);
 check('маяк лавки с той же кассой больше не гремит поверх голоса',
  !торг.маяки.some(m=>m.id==="trader_deep"),торг.маяки);
 check('маяк жителя звучит тише его речи',
  торг.маяки.length===1&&торг.маяки[0].k<1,торг.маяки);
 check('торговец говорит голосом, через сжатие',
  торг.голос.length>=1&&торг.голос.every(g=>g.voice),торг.голос);
 const карточка=торг.речь.find(t=>/костёр/.test(t))||"";
 check('описание костра и карточка — одной речью, и первой в карточке звучит фраза торговца',
  торг.окно&&торг.речь.filter(t=>/костёр/.test(t)).length===1&&/«[^»]+»/.test(карточка)&&/Народ /.test(карточка),
  карточка.slice(0,260));

 /* ── 4. Тембр ── */
 const тембр=await page.evaluate(()=>{
  const все=[];
  for(let i=0;i<24;i++){const n=getNPC(100+i*7,200+i*3,i%3);все.push({k:n.key,t:Folk.тембр(n),t2:Folk.тембр(getNPCByKey(n.key)||n)});}
  return {разных:new Set(все.map(x=>x.t)).size,мин:Math.min(...все.map(x=>x.t)),макс:Math.max(...все.map(x=>x.t)),
   тотЖе:все.every(x=>x.t===x.t2)};});
 check('у каждого жителя свой тембр в пределах ±5 %, и тот же при каждой встрече',
  тембр.разных>=12&&тембр.мин>=0.95&&тембр.макс<=1.05&&тембр.тотЖе,тембр);

 /* ── 5. Оклик меняется ── */
 const оклик=await page.evaluate(async()=>{
  const r={};
  const сырой=n=>JSON.stringify(n);
  const n=getNPC(420,420,0,"Кузнец");
  r.первая=Folk.оклик(n,1);
  r.дальше=[2,3,4,5,6,7,8].map(k=>сырой(Folk.оклик(n,k)));
  r.подрядОдинаковых=r.дальше.filter((x,i)=>i>0&&x===r.дальше[i-1]).length;
  r.видов=new Set(r.дальше).size;
  /* Разные соседи на одной встрече — по-разному. */
  const соседи=[0,1,2,3,4,5,6,7].map(i=>сырой(Folk.оклик(getNPC(430+i*5,440,i%3),4)));
  r.соседейВидов=new Set(соседи).size;
  /* Торговец иногда набивает цену. */
  const т=getNPC(460,460,0,"Торговец");
  r.торг=[2,3,4,5,6,7].some(k=>сырой(Folk.оклик(т,k)).indexOf("torg")>=0);
  /* Недруг: народ героя испорчен до вражды. */
  const в=getNPC(480,480,0,"Кузнец");
  const было=G.rep?G.rep[в.race]:undefined;
  const repKey=(()=>{try{return raceInfo(в.race).id;}catch(_){return в.race;}})();
  const сохр=JSON.stringify(G.rep||{});
  G.rep=G.rep||{};G.rep[repKey]=-60;G.rep[в.race]=-60;
  r.настройВраг=Folk.настрой(в);
  r.враг=[1,2,3,4].map(k=>сырой(Folk.оклик(в,k)));
  r.врагЗло=r.враг.every(x=>/otkaz|ugroza/.test(x));
  /* И вживую: оклик на пятой встрече звучит по чередованию. */
  G.rep=JSON.parse(сохр);
  const ж=getNPC(500,500,0,"Лекарь");
  const слышно=[];const оA=Spatial.at.bind(Spatial),оF=Folk.плоско.bind(Folk);
  Spatial.at=(p,dx,dy,o)=>{if(/^voice\//.test(p))слышно.push(p);return оA(p,dx,dy,o);};
  Folk.плоско=(p,o)=>{слышно.push(p);return оF(p,o);};
  /* С версии 3.4 голоса жителей идут очередью и начинают, когда смолкнет
     голос игры: ждём оклик до восьми секунд, а не полторы. */
  const ждём=Folk.оклик(ж,5).map(х=>х[0]==="народ"?"race_"+Folk.голос(ж)[0]:х[0]==="ремесло"?"prof_"+VOICE_PROFS[ж.prof][0]:"say_"+х[1]);
  /* Очередь голосов от прежних шагов проверки снимаем: слушаем только этот оклик. */
  try{Speech.userCut();}catch(_){}try{Folk.смолкнуть(true);}catch(_){}слышно.length=0;
  try{Folk.когда=0;Folk.было.clear();npcVoice(ж,"оклик",5);
   for(let i=0;i<80&&!ждём.every(w=>слышно.some(p=>p.indexOf("voice/"+w)===0));i++)await new Promise(res=>setTimeout(res,100));}
  finally{Spatial.at=оA;Folk.плоско=оF;}
  r.живой={слышно:[...new Set(слышно)],ждём};
  r.живойСовпал=ждём.every(w=>слышно.some(p=>p.indexOf("voice/"+w)===0))&&слышно.length>0&&слышно[0].indexOf("voice/"+ждём[0])===0;
  return r;});
 check('первая встреча — знакомство: народ, затем ремесло',
  JSON.stringify(оклик.первая)===JSON.stringify([["народ"],["ремесло"]]),оклик.первая);
 check('дальше оклик чередуется и подряд не повторяется',
  оклик.видов>=3&&оклик.подрядОдинаковых===0,оклик.дальше);
 check('соседи на одной встрече окликают по-разному',оклик.соседейВидов>=3,оклик.соседейВидов);
 check('торговец набивает цену словом торга',оклик.торг);
 check('недруг отвечает отказом или угрозой — и на первой встрече тоже',
  оклик.настройВраг==="вражда"&&оклик.врагЗло,{настрой:оклик.настройВраг,оклик:оклик.враг});
 check('вживую оклик звучит по чередованию',оклик.живойСовпал,оклик.живой);

 /* ── 6. Прощание ── */
 const прощ=await page.evaluate(async()=>{
  while(activeLayer())closeTopUI();
  const r={};
  const слышно=[];const оA=Spatial.at.bind(Spatial),оF=Folk.плоско.bind(Folk);
  Spatial.at=(p,dx,dy,o)=>{if(/^voice\//.test(p))слышно.push(p);return оA(p,dx,dy,o);};
  Folk.плоско=(p,o)=>{слышно.push(p);return оF(p,o);};
  try{
   const n=getNPC(520,520,0,"Трактирщик");
   openNPC(n.key,true);
   await new Promise(res=>setTimeout(res,1200));
   Folk.когда=0;Folk.было.clear();слышно.length=0;
   closeModal(document.getElementById("modal-npc"));
   /* Голоса жителей идут очередью: прощание звучит, когда договорит голос
      игры о закрытом окне. Ждём его до восьми секунд. */
   const t0=Date.now();
   for(let i=0;i<80&&!слышно.length;i++)await new Promise(res=>setTimeout(res,100));
   r.ровно=слышно.slice();r.мс=Date.now()-t0;
   /* Холодный молчит. */
   const х=getNPC(540,540,0,"Трактирщик");
   const сохр=JSON.stringify(G.rep||{});
   const repKey=(()=>{try{return raceInfo(х.race).id;}catch(_){return х.race;}})();
   G.rep=G.rep||{};G.rep[repKey]=-6;G.rep[х.race]=-6;
   r.настрой=Folk.настрой(х);
   openNPC(х.key,true);
   await new Promise(res=>setTimeout(res,1200));
   Folk.когда=0;Folk.было.clear();слышно.length=0;
   closeModal(document.getElementById("modal-npc"));
   /* Молчит — значит, не звучит и тогда, когда прощание тёплого уже пришло бы. */
   await new Promise(res=>setTimeout(res,Math.max(3000,(r.мс||0)+1500)));
   r.холод=слышно.slice();
   G.rep=JSON.parse(сохр);
  }finally{Spatial.at=оA;Folk.плоско=оF;}
  while(activeLayer())closeTopUI();
  return r;});
 check('закрыв окно жителя, герой слышит прощание',
  прощ.ровно.length>=1&&прощ.ровно[0].indexOf("voice/say_proschanie")===0,прощ.ровно);
 check('холодный житель вслед молчит',прощ.настрой==="холод"&&прощ.холод.length===0,прощ);

 /* ── 7. Строки ── */
 const строки=await page.evaluate(()=>{
  const r={};
  r.пулов=Object.keys(NPC_GREET).length;
  r.фраз=Object.values(NPC_GREET).reduce((a,p)=>a+p.length,0);
  r.улица={горожане:FOLK_LINES.length,стража:GUARD_LINES.length,костёр:DEEP_TRADER.length};
  r.дубли=Object.values(NPC_GREET).flat().length-new Set(Object.values(NPC_GREET).flat()).size;
  /* Без повтора подряд и без возврата, пока не прозвучала половина. */
  Lines.недавно.clear();
  const seq=[];for(let i=0;i<240;i++)seq.push(Lines.pick("t175",FOLK_LINES));
  const пол=Math.floor(FOLK_LINES.length/2);
  let плохо=0;
  for(let i=1;i<seq.length;i++){const окно=seq.slice(Math.max(0,i-пол),i);if(окно.indexOf(seq[i])>=0)плохо++;}
  r.повторов=плохо;r.разных=new Set(seq).size;
  /* Фраза по ремеслу, месту и настрою. */
  const пул=(имя,ф)=>NPC_GREET[имя].indexOf(ф)>=0;
  G.place=null;G.dark=false;
  const кузнец=getNPC(600,600,0,"Кузнец");
  r.кузня=[0,1,2,3,4].every(()=>{const ф=npcGreeting(кузнец,1);return пул("кузня",ф)||пул("свой",ф);});
  G.place={kind:"dungeon",depth:4,bx:610,by:610,x:3,y:3,name:"Проверка"};
  const т=getNPC(610,610,0,"Торговец");
  r.глубь=[0,1,2,3,4].every(()=>{const ф=npcGreeting(т,1);return пул("глубь",ф)||пул("вражда",ф)||пул("холод",ф);});
  G.place=null;
  const в=getNPC(620,620,0,"Лекарь");
  const сохр=JSON.stringify(G.rep||{});
  const repKey=(()=>{try{return raceInfo(в.race).id;}catch(_){return в.race;}})();
  G.rep=G.rep||{};G.rep[repKey]=-60;G.rep[в.race]=-60;
  r.вражда=[0,1,2].every(()=>пул("вражда",npcGreeting(в,3)));
  G.rep=JSON.parse(сохр);
  return r;});
 check('фраз встречи больше сотни в четырнадцати пулах, без дублей',
  строки.пулов>=14&&строки.фраз>=100&&строки.дубли===0,{пулов:строки.пулов,фраз:строки.фраз,дубли:строки.дубли});
 check('строк улицы втрое больше: горожане, стража и подземные торговцы',
  строки.улица.горожане>=20&&строки.улица.стража>=15&&строки.улица.костёр>=12,строки.улица);
 check('строка не возвращается, пока не прозвучала половина остальных',
  строки.повторов===0&&строки.разных===строки.улица.горожане,{повторов:строки.повторов,разных:строки.разных});
 check('кузнец встречает словами кузни, подземный торговец — словами глуби, недруг гонит',
  строки.кузня&&строки.глубь&&строки.вражда,строки);

 /* ── 8. Голоса прохожих ── */
 const прох=await page.evaluate(()=>{
  const r=[];const оA=Spatial.at.bind(Spatial);
  Spatial.at=(p,dx,dy,o)=>{r.push({p,kind:(o||{}).kind,voice:!!(o||{}).voice,gain:(o||{}).gain});return true;};
  try{
   G.place={kind:"city",bx:700,by:700,x:5,y:5,name:"Ц"};
   Actors.voice({x:7,y:5},"throng_hail_m",{gain:0.5});
   Actors.voice({x:7,y:5},"hero_step_metal",{gain:0.45});
  }finally{Spatial.at=оA;G.place=null;}
  return r;});
 check('оклик прохожего — каналом голосов и сжат, шаг — прежним путём',
  прох.length===2&&прох[0].kind==="npc"&&прох[0].voice&&прох[0].gain<0.5&&!прох[1].voice,прох);

 /* ── 9. Руководство, новости, документы ── */
 const док=await page.evaluate(()=>{
  const гл=GUIDE.find(g=>/Глава 98\. Жители говорят громче/.test(g.title));
  const часть=GUIDE_PARTS.find(p=>p[2].indexOf(98)>=0);
  return {глава:!!гл,абзацев:гл?гл.body.length:0,часть:часть?часть[0]:null,news:NEWS_V,
   гл50:GUIDE.find(g=>/Глава 50\./.test(g.title)).body.some(t=>/глава 98/.test(t)),
   самопроверка:(()=>{const c=worldSelfCheck();const s=JSON.stringify(c);return s.indexOf('"folk"')>=0;})()};});
 check('глава 98 во второй части, и глава 50 на неё ссылается',
  док.глава&&док.абзацев>=7&&/Часть II/.test(док.часть||"")&&док.гл50,док);
 check('новость о голосах вошла в выпуск для вернувшихся (девятый и позже)',док.news>=9,док.news);
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const звук=fs.readFileSync(path.join(ROOT,'docs','ЗВУК.md'),'utf8');
 const вз=fs.readFileSync(path.join(ROOT,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 const tr=fs.readFileSync(path.join(ROOT,'tests','README.md'),'utf8');
 check('README, docs и список наборов знают о громких и разных голосах',
  /Жители говорят громче/.test(readme)&&/VOICE_MIX/.test(звук)&&/набор 175/.test(вз)&&/175-folk-voice-loud-and-varied/.test(tr));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
