/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 98: ЯДРО ЗВУКА — КАНАЛЫ, ВАРИАТИВНОСТЬ, ПРИОРИТЕТЫ, ПРЕГРАДЫ

   ТЗ по звуку: музыка — событие, звук — действие, атмосфера — мир,
   пространство — физика, речь — сведения. Здесь проверяется ядро:

   1. Каналов девять, у каждого своя громкость, и ни один не роняет другой:
      бой, чары и голоса людей идут своими ползунками; общая громкость
      множит всё; речь не трогает мир.
   2. Система вариативности: одна и та же запись не звучит подряд — ни у
      роли с двумя вариантами, ни у роли с восемью; разброс скорости даёт
      разные скорости у одного файла.
   3. Приоритеты: при потоке звуков уступают низкие и дальние, а важный
      близкий остаётся; предел голосов держится.
   4. Преграды: за стеной звук глуше и тише, чем по прямой; чужой ярус —
      перекрытие; открытая линия — без преград.
   5. Фоновая музыка мест по умолчанию молчит в игре; включённая — звучит;
      музыка событий при этом не выключена.
   6. Бой, чары и люди звучат своими каналами, а не общим «миром».
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 /* ── 1. Каналы ── */
 const каналы=await page.evaluate(()=>{
  const виды=["music","event","ambient","ui","combat","magic","npc","fx","world","чужой"];
  const по={};виды.forEach(k=>по[k]=Bank.chanOf(k));
  const было={...settings};
  const снимок=()=>({music:Bank.vol("music"),amb:Bank.vol("ambient"),ui:Bank.vol("ui"),combat:Bank.vol("combat"),magic:Bank.vol("magic"),npc:Bank.vol("npc"),fx:Bank.vol("fx")});
  Object.assign(settings,{effects:1,music:1,masterVol:1,fxVol:1,ambVol:0.8,uiVol:0.9,musicVol:1,combatVol:1,magicVol:1,npcVol:1,voiceVol:1});
  const база=снимок();
  settings.combatVol=0.3;const бой=снимок();
  settings.combatVol=1;settings.magicVol=0.2;const чары=снимок();
  settings.magicVol=1;settings.npcVol=0.5;const люди=снимок();
  settings.npcVol=1;settings.masterVol=0.5;const общая=снимок();
  settings.masterVol=1;settings.voiceVol=0.1;settings.rate=4;const речь=снимок();
  Object.assign(settings,было);
  const близко=(a,b)=>Math.abs(a-b)<1e-6;
  return {по,
   бойСвой:близко(бой.combat,база.combat*0.3)&&близко(бой.fx,база.fx)&&близко(бой.amb,база.amb)&&близко(бой.music,база.music),
   чарыСвои:близко(чары.magic,база.magic*0.2)&&близко(чары.combat,база.combat)&&близко(чары.fx,база.fx),
   людиСвои:близко(люди.npc,база.npc*0.5)&&близко(люди.fx,база.fx)&&близко(люди.ui,база.ui),
   общаяМножит:Object.keys(база).every(k=>близко(общая[k],база[k]*0.5)),
   речьНеТрогает:Object.keys(база).every(k=>близко(речь[k],база[k])),
   ползунки:["setMasterVol","setCombatVol","setMagicVol","setNpcVol","setBgMusic"].filter(id=>!document.getElementById(id))};});
 check('девять видов разложены по каналам: бой, чары и люди — свои',
  каналы.по.combat==="combat"&&каналы.по.magic==="magic"&&каналы.по.npc==="npc"&&каналы.по.event==="world"&&каналы.по["чужой"]==="world",каналы.по);
 check('ползунок боя двигает только бой',каналы.бойСвой);
 check('ползунок чар двигает только чары',каналы.чарыСвои);
 check('ползунок голосов людей двигает только людей',каналы.людиСвои);
 check('общая громкость множит все каналы',каналы.общаяМножит);
 check('громкость и скорость речи не трогают ни один канал звука',каналы.речьНеТрогает);
 check('в настройках есть общая громкость, бой, чары, голоса и фоновая музыка',!каналы.ползунки.length,каналы.ползунки);

 /* ── 2. Вариативность ── */
 const вар=await page.evaluate(()=>{
  const роли=Object.keys(SOUND_BANK);
  const две=роли.find(r=>SOUND_BANK[r].f.length===2);
  const много=роли.find(r=>SOUND_BANK[r].f.length>=6);
  const прогон=(r,n)=>{Vary.reset(r);const из=[];for(let i=0;i<n;i++){Bank.play(r,{gain:0,maxSec:0.2});из.push(Vary.last(r));}return из;};
  const a=прогон(две,20),b=прогон(много,40);
  const подряд=x=>x.some((v,i)=>i>0&&v===x[i-1]);
  const охват=new Set(b).size;
  const скорости=new Set();for(let i=0;i<12;i++){const el=Bank.play(две,{gain:0,maxSec:0.2,pitchVar:0.08});if(el)скорости.add(+el.playbackRate.toFixed(3));}
  const ровно=Bank.play(две,{gain:0,maxSec:0.2});
  const фикс=[];for(let i=0;i<5;i++){const el=Bank.play(много,{gain:0,maxSec:0.2,fixed:true,seed:3});фикс.push(el&&el.__file);}
  return {две,много,a,b,подрядДве:подряд(a),подрядМного:подряд(b),охват,всего:SOUND_BANK[много].f.length,
   скоростей:скорости.size,ровноОдин:ровно&&ровно.playbackRate===1,фиксОдин:new Set(фикс).size===1};});
 check('роль с двумя записями чередует их, а не бьёт одной',!вар.подрядДве,{роль:вар.две,ряд:вар.a.slice(0,10)});
 check('роль с многими записями не повторяет вариант подряд и обходит все',!вар.подрядМного&&вар.охват===вар.всего,{роль:вар.много,охват:вар.охват,всего:вар.всего});
 check('разброс скорости даёт разные скорости одной записи',вар.скоростей>=6,вар.скоростей);
 check('без разброса запись идёт ровно; fixed с семенем даёт один и тот же файл',вар.ровноОдин&&вар.фиксОдин);

 /* ── 3. Приоритеты ── */
 const прио=await page.evaluate(()=>{
  Bank.stopAll();Voices.dropped=0;
  const роль=Object.keys(SOUND_BANK).find(r=>SOUND_BANK[r].f.length>=2);
  for(let i=0;i<Voices.MAX+6;i++)Bank.play(роль,{gain:0,maxSec:5,kind:"ambient",dist:8+i});
  const низких=Voices.count();
  const важный=Bank.play(роль,{gain:0,maxSec:5,kind:"combat",prio:"high",dist:0});
  const ещё=[];for(let i=0;i<6;i++)ещё.push(Bank.play(роль,{gain:0,maxSec:5,kind:"ambient",dist:12}));
  const живВажный=Voices.list.some(r=>r.el===важный)&&!важный.__stopped;
  const предел=Voices.count()<=Voices.MAX;
  const прио={amb:Voices.prioOf("ambient"),fx:Voices.prioOf("fx"),combat:Voices.prioOf("combat"),ui:Voices.prioOf("ui"),явно:Voices.prioOf("ambient","high")};
  const сброшено=Voices.dropped;
  Bank.stopAll();
  return {низких,живВажный,предел,прио,сброшено,после:Voices.count()};});
 check('поток фоновых голосов не превышает предела',прио.низких<=прио.низких&&прио.предел,{было:прио.низких,предел:prioMax(прио)});
 check('важный близкий голос переживает шесть новых фоновых',прио.живВажный);
 check('при переполнении уступают, а не молчат: сброшенных больше нуля',прио.сброшено>0,прио.сброшено);
 check('приоритеты: фон ниже мира, мир ниже боя и меню; явный приоритет перебивает канал',
  прио.прио.amb<прио.прио.fx&&прио.прио.fx<прио.прио.combat&&прио.прио.ui===прио.прио.combat&&прио.прио.явно===2,прио.прио);
 check('остановить всё очищает список голосов',прио.после===0,прио.после);
 function prioMax(p){return p.предел?'ok':'over';}

 /* ── 4. Преграды ── */
 const прегр=await page.evaluate(()=>{
  /* Заходим внутрь постройки, чтобы был план уровня со стенами. */
  outer: for(let r=1;r<60;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){
   const c=cellContent(G.x+dx,G.y+dy);
   if(c.structure&&PLACE_KIND[c.structure.type]){G.x+=dx;G.y+=dy;break outer;}}
  G.place=null;useHere();
  if(!G.place)return {нетМеста:true};
  const lvl=curLevel(),p=G.place;
  /* Ищем точку, откуда по прямой на восток есть стена, и точку с открытой линией. */
  let заСтеной=null,открыто=null;
  for(let y=1;y<lvl.h-1&&!(заСтеной&&открыто);y++)for(let x=1;x<lvl.w-6&&!(заСтеной&&открыто);x++){
   if(tileAt(lvl,x,y)!==".")continue;
   const линия=[1,2,3,4].map(i=>tileAt(lvl,x+i,y));
   if(!заСтеной&&линия.slice(0,3).includes("#")&&tileAt(lvl,x+4,y)!==undefined)заСтеной={x,y};
   if(!открыто&&линия.every(t=>t==="."))открыто={x,y};}
  const роль=Object.keys(SOUND_BANK).find(r=>SOUND_BANK[r].f.length>=1);
  const мер=(pt,dx,dy,dz)=>{p.x=pt.x;p.y=pt.y;Spatial.lastOccl=-1;
   const ok=Spatial.role(роль,dx,dy,{dz:dz||0,gain:0.01,maxSec:0.5});
   const rec=Spatial.live[Spatial.live.length-1];
   return {ok,occl:Spatial.lastOccl,lp:!!(rec&&rec.lp),freq:rec&&rec.lp?rec.lp.frequency.value:null,gain:rec?rec.g.gain.value:null};};
  const стена=заСтеной?мер(заСтеной,4,0,0):null;
  const прямо=открыто?мер(открыто,4,0,0):null;
  const ярус=открыто?мер(открыто,2,0,1):null;
  const считает=Spatial.occlusion(0,0,0)===0;
  Spatial.stopAll();
  return {заСтеной,открыто,стена,прямо,ярус,считает,вкл:Spatial.on()};});
 if(прегр.нетМеста)check('преграды: не нашлось постройки для проверки',false,прегр);
 else{
  check('объёмный звук включён для проверки преград',прегр.вкл);
  check('за стеной есть преграда, фильтр верха и звук тише',
   прегр.стена&&прегр.стена.ok&&прегр.стена.occl>0&&прегр.стена.lp&&прегр.стена.freq<6000&&прегр.прямо&&прегр.стена.gain<прегр.прямо.gain,{стена:прегр.стена,прямо:прегр.прямо});
  check('по открытой линии преград нет и фильтра нет',прегр.прямо&&прегр.прямо.ok&&прегр.прямо.occl===0&&!прегр.прямо.lp,прегр.прямо);
  check('чужой ярус считается перекрытием',прегр.ярус&&прегр.ярус.occl>=1.5&&прегр.ярус.lp,прегр.ярус);
  check('нулевое смещение — без преград',прегр.считает);}

 /* ── 5. Фоновая музыка по выбору ── */
 const фон=await page.evaluate(()=>{
  const было=settings.bgMusic;
  settings.music=1;settings.bgMusic=0;Music.stop();Music.start("forest");const молчит=!Music.track&&!Music.sfx;
  settings.bgMusic=1;Music.stop();Music.start("forest");const звучит=!!Music.track;Music.stop();
  settings.bgMusic=было;
  const событие=eventTheme("levelup",{gain:0});
  const канал=Bank.chanOf("event");
  return {молчит,звучит,умолч:Number(settings.bgMusic)||0,событие,канал,поле:!!document.getElementById("setBgMusic")};});
 check('в игре фоновая музыка мест молчит, пока её не включили',фон.молчит&&фон.умолч===0,фон);
 check('включённая фоновая музыка звучит записью темы',фон.звучит);
 check('звук события при этом на месте и идёт каналом мира, а не музыки',фон.событие===true&&фон.канал==="world",фон);

 /* ── 6. Бой, чары и люди — своими каналами ── */
 const кто=await page.evaluate(async()=>{
  const виды=[];const o=Bank.play;Bank.play=function(r,opts){виды.push([r,(opts&&opts.kind)||"fx"]);return o.call(this,r,Object.assign({},opts||{},{gain:0,maxSec:0.3}));};
  const oa=Spatial.at;Spatial.at=function(f,dx,dy,opts){виды.push([f,(opts&&opts.kind)||"fx"]);return oa.call(this,f,dx,dy,opts);};
  G.equip=G.equip||{};G.equip.weapon=G.equip.weapon||{name:"Меч",type:"Меч"};
  weaponSwingSound(true);playWeaponCombatSfx(true,"E",8);playWoundSfx(9);
  const бой=виды.slice();виды.length=0;
  G.mana=99;G.spells=G.spells||[];if(!G.spells.includes(SPELLS[0].n))G.spells.push(SPELLS[0].n);
  castSpell(0);
  /* Слои заклинания разнесены во времени: ждём их все. */
  await new Promise(z=>setTimeout(z,1900));
  /* Считаем только слои самой школы: живая картина и шаги звучат сами по себе. */
  const слои=SPELL_LAYERS.map(l=>(SCHOOL_AUDIO[G.lastSpell.school]||SCHOOL_AUDIO.generic)[l]||SCHOOL_AUDIO.generic[l]);
  const чары=виды.filter(x=>слои.includes(x[0]));виды.length=0;
  npcCue({x:G.x+1,y:G.y},"throng_hail_m");
  const люди=виды.slice();
  Bank.play=o;Spatial.at=oa;Bank.stopAll();
  const доля=(arr,k)=>arr.length?arr.filter(x=>x[1]===k).length/arr.length:0;
  return {бой:бой.length,бойДоля:доля(бой,"combat"),чары:чары.length,чарыДоля:доля(чары,"magic"),люди:люди.map(x=>x[1])};});
 check('удары, замахи и раны идут каналом боя',кто.бой>=4&&кто.бойДоля>=0.8,{звуков:кто.бой,доля:кто.бойДоля});
 check('заклинание идёт каналом чар',кто.чары>=3&&кто.чарыДоля>=0.8,{звуков:кто.чары,доля:кто.чарыДоля});
 check('голос человека идёт каналом людей',кто.люди.length>=1&&кто.люди.every(k=>k==="npc"),кто.люди);

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const passed=results.filter(r=>r.startsWith('PASS')).length;
 console.log(`ИТОГО: ${passed} из ${results.length}`);
 process.exit(passed===results.length?0:1);
})().catch(e=>{console.error(e);process.exit(2);});
