/* ══════════════════════════════════════════════════════════════════
   257 — ОБЪЕКТЫ, ПОДЗЕМЕЛЬЯ, ЛЕСТНИЦЫ, ГОЛОС (9.5.2, просьба игрока)
   «На каждое касание открывается меню действий; постучать, осмотреть —
   ничего не происходит; трофей „слеза призрака“ объявлен, но в добыче его
   нет; шаги в подземельях — как по траве; лестницы звучат одинаково;
   обыск площадки ничего не даёт; ловушки не работают; голоса сверху не
   отдаляются на марше; при мужском голосе Gemini часть пунктов — женским».
   Проверяется:
   1. Касание по вещи — само дело (вещь звучит и рассказывает), а не список;
      «постучать» и «осмотреть» отвечают, ответ не обрывает перечень.
   2. Трофей с твари лежит в добыче и после сбора — в котомке.
   3. Шаги подземелий: ни травы, ни «земли»; у каждого рода своя порода.
   4. Лестница звучит родом подземелья; в доме — деревом.
   5. Площадка марша — объект с делом «обыскать», обыск даёт находку,
      второй раз — «уже обыскали».
   6. Фон и голоса покидаемого яруса стихают с каждой ступенью.
   7. Ловушка срабатывает: урон и сообщение без очереди.
   8. Вестник выключен: всё звучит выбранным голосом; пункт меню со словом
      «Достижения» не уходит вестнику.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];window.__snd=[];
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};
  const был=Bank.play.bind(Bank);Bank.play=(r,o)=>{window.__snd.push(r);return был(r,o);};});

 /* 1: вещь в трактире */
 const о=await p.evaluate(async()=>{
  const W=OLD_WORLD>>1;let found=null;
  for(let r=0;r<500&&!found;r++)for(let dy=-r;dy<=r&&!found;dy++)for(let dx=-r;dx<=r&&!found;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;const c=cellContent(W+dx,W+dy);
   if(c.structure&&c.structure.type==="tavern"){G.x=W+dx;G.y=W+dy;found=c;}}
  G.place=null;enterPlace(cellContent(G.x,G.y));while(activeLayer())closeTopUI();
  const lvl=curLevel(),pl=G.place;let spot=null;
  for(let y=0;y<lvl.h&&!spot;y++)for(let x=0;x<lvl.w&&!spot;x++)if(tileAt(lvl,x,y)==="X")
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(!spot&&tileAt(lvl,x+dx,y+dy)===".")spot={x:x+dx,y:y+dy,vx:x,vy:y};
  if(!spot)return {нет:"вещи"};
  pl.x=spot.x;pl.y=spot.y;await new Promise(r=>setTimeout(r,2500));
  const сказано=[];const say=Speech.say.bind(Speech);Speech.say=(t,o)=>{сказано.push(String(t));return say(t,o);};
  objList=objectsHere(true);const j=objList.findIndex(o=>o.плитка==="X");if(j<0)return {нет:"в списке"};
  Speech.stop({user:false});window.__tts.length=0;window.__snd.length=0;сказано.length=0;
  objMainAct(j);await new Promise(r=>setTimeout(r,1500));
  const касание={tts:сказано.slice(),snd:window.__snd.slice(),окно:activeLayer()&&activeLayer().id};
  while(activeLayer())closeTopUI();objList=objectsHere(true);const k=objList.findIndex(o=>o.плитка==="X");
  openObjActions(k);await new Promise(r=>setTimeout(r,300));
  const ответ=async id=>{Speech.stop({user:false});window.__tts.length=0;window.__snd.length=0;сказано.length=0;CMD.objact(k+":"+id);
   await new Promise(r=>setTimeout(r,1500));return {tts:сказано.slice(),snd:window.__snd.slice()};};
  const стук=await ответ("knock"),взгляд=await ответ("look");
  Speech.say=say;while(activeLayer())closeTopUI();
  return {касание,стук,взгляд,вещь:propAt(spot.vx,spot.vy).id};});
 check('1а. касание по вещи — её дело сразу, без списка действий',!о.нет&&о.касание.tts.length>0&&о.касание.окно!=="modal-objact"
  &&!о.касание.tts.some(t=>/^Действия|выберите действие/i.test(t)),о);
 check('1б. «постучать» и «осмотреть» отвечают звуком и словами',!о.нет&&о.стук.tts.length>0&&о.стук.snd.length>0&&о.взгляд.tts.length>0,о.нет?о:{стук:о.стук,взгляд:о.взгляд});
 check('1в. ответ на действие не обрывается перечнем действий',!о.нет&&!о.стук.tts.some(t=>/^(Постучать|Осмотреть)[.,]/.test(t)&&t.length<40),о.нет?о:о.стук.tts);

 /* 2: трофей */
 const т=await p.evaluate(()=>{
  G.place=null;G.inCombat=false;G.loot=[];
  const m0=(typeof UNDEAD_MONSTERS!=="undefined"&&UNDEAD_MONSTERS.find(m=>m.id==="wraith"))||MONSTERS.find(m=>m.id==="wraith");
  if(!m0)return {нет:"призрака"};
  G.combat={m:{...m0,lvl:5,hp:0,dmg:5,xp:10,gold:5},own:false};G.inCombat=true;
  const rnd=Math.random;Math.random=()=>0.01;try{victory();}finally{Math.random=rnd;}
  const добыча=(G.loot||[]).filter(l=>l.трофей).map(l=>l.name);
  const до={};добыча.forEach(n=>до[n]=Number(G.inv[n])||0);
  takeLoot();while(activeLayer())closeTopUI();
  return {добыча,вКотомке:добыча.every(n=>(Number(G.inv[n])||0)>до[n])};});
 check('2. трофей с твари — в добыче и после сбора в котомке',!т.нет&&т.добыча.length>0&&т.вКотомке,т);

 /* 3–4: шаги и лестницы подземелий */
 const ш=await p.evaluate(()=>{
  const места=[];
  for(let x=1000;x<90000&&места.length<6;x+=37)for(let y=1000;y<1400&&места.length<6;y+=41){
   const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon"){const k=dungeonKindAt(x,y,cc.structure.type);
    if(k&&!места.find(m=>m.k===k.id))места.push({x,y,k:k.id});}}
  const out={};let роли=new Set(),лестницы=new Set(),сухо=[];
  for(const m of места){G.place=null;G.x=m.x;G.y=m.y;enterPlace(cellContent(m.x,m.y));while(activeLayer())closeTopUI();
   const pl=G.place;if(!pl)continue;const rec=[];
   for(const d of [1,2,3,4]){pl.depth=d;const пов=indoorSurface();rec.push(пов);роли.add(пов);}
   лестницы.add(stairSet().join("/"));out[m.k]=rec;
   if(rec.some(s=>s==="grass"||s==="dirt"||s==="tallgrass"||s==="leaves"))сухо.push(m.k);}
  const всеРоли=[].concat(...Object.values(STAIR_SET)).concat(Object.values(DUNGEON_FLOOR).flat().map(s=>SURF_ROLE[s]));
  const безЗаписи=[...new Set(всеРоли)].filter(r=>!r||!SOUND_BANK[r]);
  /* дом: лестница — дерево */
  G.place={stype:"tavern",depth:0,bx:1,by:1};const дом=stairSet().join("/");G.place=null;
  return {out,трава:сухо,пород:роли.size,лестниц:лестницы.size,безЗаписи,дом,дерево:STAIR_SET.wood.join("/")};});
 check('3а. в подземельях шаги не по траве и не по «земле»',Object.keys(ш.out).length>=3&&ш.трава.length===0,ш);
 check('3б. у разных подземелий и ярусов разные породы',ш.пород>=4,ш.out);
 check('4а. лестницы разных подземелий звучат по-разному',ш.лестниц>=2,ш);
 check('4б. у всех шагов и лестниц есть записи в банке; в доме лестница деревянная',ш.безЗаписи.length===0&&ш.дом===ш.дерево,{безЗаписи:ш.безЗаписи,дом:ш.дом});

 /* 5–6: марш, площадка, отдаление */
 const м=await p.evaluate(async()=>{
  let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1400&&!c;y+=41){const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")c={x,y};}
  G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();
  const pl=G.place,lvl=curLevel();
  for(let y=0;y<lvl.h;y++)for(let x=0;x<lvl.w;x++)if(tileAt(lvl,x,y)===">"){pl.x=x;pl.y=y;}
  safeFn(()=>markGuardianDead(pl.bx,pl.by,pl.depth));if(G.inCombat){G.inCombat=false;G.combat=null;}
  const v0=Bank.vol("ambient"),n0=Bank.vol("npc");
  startFlight(1,"S");if(!G.flight)return {нет:"марша"};
  const dd=G.flight.md||"S";const громк=[];
  for(let i=1;i<=5;i++){flightStep(dd);громк.push(Bank.vol("ambient"));}
  const npc5=Bank.vol("npc");
  objList=objectsHere();const j=objList.findIndex(o=>o.вид==="landing");
  const дела=j>=0?actionsFor(objList[j]).map(a=>a.id):[];
  const золото=G.gold,вещи=JSON.stringify(G.inv).length+G.gear.length;
  Speech.stop({user:false});window.__tts.length=0;
  if(j>=0)objMainAct(j);await new Promise(r=>setTimeout(r,1200));
  const обыск=window.__tts.slice();
  window.__tts.length=0;if(j>=0)CMD.objact(j+":landsearch");await new Promise(r=>setTimeout(r,900));
  const второй=window.__tts.slice();
  /* на ступени, не на площадке, — площадки нет */
  flightStep(dd);const наСтупени=objectsHere().filter(o=>o.вид==="landing").length;
  G.flight=null;Bank.refresh();const после=Bank.vol("ambient");while(activeLayer())closeTopUI();
  return {v0,n0,громк,npc5,дела,обыск,второй,наСтупени,после,нашли:G.gold!==золото||JSON.stringify(G.inv).length+G.gear.length!==вещи};});
 check('5а. площадка марша — объект с делом «обыскать»',!м.нет&&м.дела.includes("landsearch"),м);
 check('5б. обыск площадки отвечает находкой или «ничего не нашлось»',!м.нет&&м.обыск.some(t=>/плит|ниш|стен|площадк|под ступенью/i.test(t)),м.обыск);
 check('5в. второй обыск — «уже обыскали»; на ступени площадки нет',!м.нет&&м.второй.some(t=>/уже обыскали/.test(t))&&м.наСтупени===0,{второй:м.второй,наСтупени:м.наСтупени});
 const г=м.громк||[];
 check('6. фон и голоса яруса стихают с каждой ступенью и возвращаются',!м.нет&&г.every((v,i)=>i===0||v<г[i-1])&&г[4]<м.v0*0.8&&м.npc5<м.n0*0.8&&Math.abs(м.после-м.v0)<1e-6,
  {v0:м.v0,громк:г,n0:м.n0,npc5:м.npc5,после:м.после});

 /* 7: ловушка */
 const л=await p.evaluate(async()=>{
  let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1400&&!c;y+=41){const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")c={x,y};}
  G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();
  let нашли=null;
  for(let d=1;d<=5&&!нашли;d++){const pl=G.place;pl.depth=d;const lvl=curLevel();
   for(let y=1;y<lvl.h-1&&!нашли;y++)for(let x=1;x<lvl.w-1&&!нашли;x++){const t=trapAt(x,y);
    if(t&&t.состояние==="не найдена")for(const [dx,dy,dir] of [[-1,0,"E"],[1,0,"W"],[0,-1,"S"],[0,1,"N"]])
     if(!нашли&&tileAt(lvl,x+dx,y+dy)===".")нашли={x,y,sx:x+dx,sy:y+dy,dir,d};}}
  if(!нашли)return {нет:"ловушки"};
  const pl=G.place;pl.depth=нашли.d;pl.x=нашли.sx;pl.y=нашли.sy;G.inCombat=false;G.combat=null;
  G.hp=G.maxHp||100;const hp0=G.hp;await new Promise(r=>setTimeout(r,600));
  Speech.stop({user:false});window.__tts.length=0;window.__snd.length=0;window.lastMoveAt=0;
  const say=Speech.say.bind(Speech);let pri=null;Speech.say=(t,o)=>{if(pri===null&&o&&o.interrupt&&o.pri===1)pri=t;return say(t,o);};
  moveInside(нашли.dir);await new Promise(r=>setTimeout(r,2000));Speech.say=say;
  return {hp:[hp0,G.hp],pos:[pl.x,pl.y],цель:[нашли.x,нашли.y],tts:window.__tts.slice(0,4),snd:window.__snd.slice(0,8),pri};});
 check('7. ловушка срабатывает: урон, звук и сообщение без очереди',!л.нет&&л.hp[1]<л.hp[0]&&л.tts.length>0&&!!л.pri,л);

 /* 8: голос */
 const г8=await p.evaluate(()=>{
  const out={};
  for(const v of ["m","f"]){settings.gvVoice=v;
   Speech.current={herald:true,cat:"event"};const h=Speech.GVOICE;Speech.current=null;
   out[v]={вестник:h===Speech.gvMain(),главный:Speech.gvMain()===Speech.GVOICES[v]};}
  settings.gvVoice="m";
  let cat=null;const был=Speech.enqueue.bind(Speech);
  Speech.enqueue=function(m){const r=был(m);cat=m.cat;return r;};
  Speech.say("Достижения: 12 из 40",{nav:true,interrupt:true});
  Speech.enqueue=был;Speech.stop({user:false});
  out.пункт=cat;out.вкл=GV_HERALD_ON;return out;});
 check('8а. вестник не звучит своим голосом: вести — выбранным (мужской и женский)',г8.m.вестник&&г8.f.вестник&&г8.m.главный&&г8.f.главный&&г8.вкл===false,г8);
 check('8б. пункт меню «Достижения» не уходит вестнику',г8.пункт!=="achieve",г8);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
