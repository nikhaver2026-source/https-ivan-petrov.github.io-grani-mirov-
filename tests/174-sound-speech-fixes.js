/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 174: ЗВУК, РЕЧЬ, ВОЗРОЖДЕНИЕ И СТОРОНЫ

   Шесть поправок по жалобам игрока. Касания — настоящие события
   устройства (CDP).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Возрождение: павший в подземелье, на палубе или в небе очнётся у
      стен столицы, а не у той же лестницы вниз.
   2. Звук не пропадает: отыгравшая запись — объёмная, маяк, короткий звук
      банка — отдаёт плеер сразу; после трёхсот ударов о стену в подземелье
      плеер держат считанные элементы, и удар звучит по-прежнему.
   3. Шаги ровные: у каждой записи шага есть поправка громкости, тихие
      записи звучат через усилитель шины, громкие — прежним путём; камень —
      звонкий шаг, а не копия гравия; доски и мостки — ясный стук.
   4. Меч звучит записью: взмах не зовёт синтезатор, удар — один свист,
      один удар и один звук материала.
   5. Любое действие обрывает речь: свайп, касание по полю, многопальцевый
      жест, клавиша — даже посреди важного; ощупывание и речевой жест «два
      пальца вверх» — нет; настройка это выключает.
   6. Стороны как свайпы: без галочки «Стороны света» — «впереди справа»,
      «стена впереди», осмотр без «лицом на север»; в заданиях больше нет
      «иди на undefined».
   7. Настройки и руководство: два флажка, глава 97 в первой части, README
      и docs.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{window.__said=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{window.__said.push(String(t));return o(t,x);};
  settings.effects=1;settings.hrtf=1;});
 async function swipe(dx,dy,fingers=1,steps=6){
  const x=150,y=430;
  const pts=k=>Array.from({length:fingers},(_,i)=>({x:x+i*45+Math.round(dx*k/steps),y:y+Math.round(dy*k/steps),id:i}));
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts(0)});
  await page.waitForTimeout(16);
  for(let k=1;k<=steps;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts(k)});await page.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(250);}
 async function tap(x=195,y=430){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(60);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(250);}

 /* ── 1. Возрождение ── */
 const смерть=await page.evaluate(()=>{
  const r={};
  const один=(как)=>{
   while(activeLayer())closeTopUI();
   if(G.inCombat)endCombat();
   G.x=1500;G.y=1500;G.place=null;G.ship=null;G.alt=0;
   как();
   startCombat({x:G.x,y:G.y,monster:{id:"troll",n:"Тролль",lvl:3,hp:50,dmg:9,xp:1,gold:1}});
   window.__said=[];G.hp=0;defeat();
   const e=empireAt(G.x,G.y);
   return {место:G.place,палуба:G.ship,высота:G.alt,уСтолицы:G.x===e.cap.x&&G.y===e.cap.y,бой:G.inCombat,
    сказано:window.__said.filter(t=>/Поражение/.test(t)).join(" ")};};
  r.подземелье=один(()=>{G.place={kind:"dungeon",bx:1500,by:1500,stype:"ruins",name:"проба",depth:3,x:2,y:2};});
  r.палуба=один(()=>{G.ship={name:"Проба",toName:"Порт",left:3};});
  r.небо=один(()=>{G.alt=3;});
  G.hp=G.hpMax;
  return r;});
 check('1. павший в подземелье, на палубе и в небе очнётся у стен столицы, как и сказано',
  [смерть.подземелье,смерть.палуба,смерть.небо].every(x=>x.место===null&&x.палуба===null&&x.высота===0&&x.уСтолицы&&!x.бой&&/у стен столицы/.test(x.сказано)),смерть);

 /* ── 2. Звук не пропадает ── */
 const плееры=await page.evaluate(async()=>{
  const r={};
  const живые=[];const OA=window.Audio;
  window.Audio=function(...a){const el=new OA(...a);живые.push(el);return el;};window.Audio.prototype=OA.prototype;
  const держат=()=>живые.filter(el=>el.getAttribute("src")).length;
  /* объёмная запись и маяк отдают плеер по сроку */
  /* меряются ровно те элементы, что завели эти вызовы, — фон и голоса мира
     в это время живут своей жизнью */
  let n0=живые.length;
  Spatial.at("mg/hit_air_01.ogg",1,0,{maxSec:0.4});
  Bank.panned("mg/hit_air_02.ogg",{pan:0.3,gain:0.4,maxSec:0.4});
  let свои=живые.slice(n0);
  await new Promise(z=>setTimeout(z,900));
  r.объёмИМаяк={создано:свои.length,держат:свои.filter(el=>el.getAttribute("src")).length};
  /* короткий звук банка без срока отдаёт плеер, доиграв */
  n0=живые.length;
  Bank.play("hit_air",{gain:0.3});
  свои=живые.slice(n0);
  await new Promise(z=>setTimeout(z,2500));
  r.банк={создано:свои.length,держат:свои.filter(el=>el.getAttribute("src")).length};
  /* триста ударов о стену */
  const lvl=genLevel(1700,1700,2,"cave_entrance");let pos=null,dir=null;
  outer:for(let y=1;y<lvl.g.length-1;y++)for(let x=1;x<lvl.g[y].length-1;x++){if(lvl.g[y][x]!==".")continue;
   for(const d of ["N","S","E","W"]){const v=DIRV[d];if(tileAt(lvl,x+v[0],y+v[1])==="#"){pos={x,y};dir=d;break outer;}}}
  G.place={kind:"dungeon",bx:1700,by:1700,stype:"cave_entrance",name:"проба",depth:2,x:pos.x,y:pos.y};
  n0=живые.length;
  for(let i=0;i<300;i++){G.place.x=pos.x;G.place.y=pos.y;moveInside(dir);await new Promise(z=>setTimeout(z,15));}
  await new Promise(z=>setTimeout(z,3000));
  r.стена={создано:живые.length-n0,держат:живые.slice(n0).filter(el=>el.getAttribute("src")).length};
  /* и после этого удар о стену по-прежнему заводит запись */
  const до=живые.length;G.place.x=pos.x;G.place.y=pos.y;moveInside(dir);
  await new Promise(z=>setTimeout(z,200));
  r.послеУдар=живые.length>до&&!!живые[живые.length-1].getAttribute("src");
  window.Audio=OA;G.place=null;
  return r;});
 check('2. отыгравшие объёмная запись, маяк и звук банка отдают плеер сразу',
  плееры.объёмИМаяк.создано===2&&плееры.объёмИМаяк.держат===0&&плееры.банк.создано===1&&плееры.банк.держат===0,плееры);
 check('2. после трёхсот ударов о стену плеер держат считанные записи, и удар звучит по-прежнему',
  плееры.стена.создано>=250&&плееры.стена.держат<=12&&плееры.послеУдар===true,плееры.стена);

 /* ── 3. Шаги ровные ── */
 const шаги=await page.evaluate(()=>{
  const r={};
  const роли=new Set();
  [SURF_ROLE,STEP_ALT,SURF_FALLBACK,DARK_STEP_ROLE].forEach(t=>Object.values(t).forEach(x=>роли.add(x)));
  Object.values(STEP_LAYER).forEach(x=>роли.add(x[0]));
  ["hero_step_metal","hero_step_leather","hero_step_cloth","hero_step_echo"].forEach(x=>роли.add(x));
  const файлы=[...роли].flatMap(ro=>(SOUND_BANK[ro]||{f:[]}).f);
  r.безПоправки=файлы.filter(f=>typeof STEP_PEAK[f]!=="number");
  r.файлов=файлы.length;
  const k=файлы.map(f=>stepLevelK(f));
  r.размахДо=Math.round(Math.max(...файлы.map(f=>STEP_PEAK[f]))-Math.min(...файлы.map(f=>STEP_PEAK[f])));
  /* Поправка ведёт пик к цели, но не больше чем на +24 дБ: самые тихие слои
     (голос одежды, всплеск) дальше не тянутся, чтобы не поднимать шум. */
  r.послеПоправки=файлы.filter(f=>{const нужно=Math.min(STEP_TARGET-STEP_PEAK[f],20*Math.log10(16));
   return Math.abs(20*Math.log10(stepLevelK(f))-Math.max(нужно,20*Math.log10(0.25)))>0.6;}).length;
  r.вровень=файлы.filter(f=>STEP_PEAK[f]>=-27).every(f=>Math.abs(STEP_PEAK[f]+20*Math.log10(stepLevelK(f))-STEP_TARGET)<=0.6);
  /* тихая запись — через усилитель шины, громкая — прежним путём */
  const тихая=Object.keys(STEP_PEAK).find(f=>STEP_PEAK[f]<-20&&f.indexOf("tread_grass")<0)||"";
  const el1=playLeveled("oc_step_soft",{gain:0.5,maxSec:0.5});
  const el2=playLeveled("lug_step_stone",{gain:0.5,maxSec:0.5});
  r.тихаяУсилена=!!el1&&el1.__k>1;r.громкаяНеУсилена=!!el2&&el2.__k<=1;
  r.камень=SURF_ROLE.stone;r.доски=SURF_ROLE.plank;r.мостки=SURF_ROLE.bridge;
  r.копииКамня=!!SOUND_BANK.tread_rock;
  G.place=null;G.lastStep=null;
  playStep("stone");r.шагПоКамню=G.lastStep&&G.lastStep.role;
  return r;});
 check('3. у каждой записи шага есть поправка, и после неё все шаги звучат вровень',
  шаги.безПоправки.length===0&&шаги.файлов>90&&шаги.размахДо>=30&&шаги.послеПоправки===0&&шаги.вровень,шаги);
 check('3. тихий шаг идёт через усилитель, громкий — прежним путём',шаги.тихаяУсилена&&шаги.громкаяНеУсилена,шаги);
 check('3. камень — звонкий шаг, а не копия гравия; доски и мостки — ясный стук',
  шаги.камень==="lug_step_stone"&&шаги.доски==="oc_step_hard"&&шаги.мостки==="mtg_step_wood"&&!шаги.копииКамня
  &&/lug_step_stone|oc_step_hard/.test(шаги.шагПоКамню||""),шаги);

 /* ── 4. Меч ── */
 const меч=await page.evaluate(async()=>{
  const r={синтез:0};
  const orig={};["bladeSwing","daggerSwing","staffSwing","bowShot"].forEach(k=>{orig[k]=SFX.prototype[k];SFX.prototype[k]=function(...a){r.синтез++;return orig[k].apply(this,a);};});
  const игр=[];const OP=Bank.play.bind(Bank);Bank.play=(role,o)=>{игр.push(role);return OP(role,o);};
  if(G.inCombat)endCombat();G.place=null;G.ship=null;
  G.cleared[G.x+","+G.y]=1;
  const w=weaponList().find(x=>x&&/меч/i.test(String(x.name||"")))||weaponList()[0];G.equip.weapon=w;G.weaponDrawn=true;
  игр.length=0;weaponSwing("E");await new Promise(z=>setTimeout(z,400));
  r.взмах=игр.slice();
  G.hp=G.hpMax=900;
  startCombat({x:G.x,y:G.y,monster:{id:"troll",n:"Тролль",lvl:3,hp:500,dmg:1,xp:1,gold:1}},{dir:"E",close:true});
  G.combat.arena.readyAt=Date.now()+60000;G.combat.arena.swingAt=0;
  /* начало боя звучит своими голосами твари — даём им отзвучать */
  await new Promise(z=>setTimeout(z,1200));
  игр.length=0;weaponSwing("E");await new Promise(z=>setTimeout(z,700));
  const кл=WEAPON_SOUND[weaponClass()];
  r.удар=игр.slice();
  r.свистов=игр.filter(x=>(кл.swing||[]).indexOf(x)>=0||x==="hero_swing").length;
  r.ударов=игр.filter(x=>(кл.hit||[]).indexOf(x)>=0).length;
  const оружейные=new Set(Object.values(кл).flat().concat(["hero_swing","lug_impact"]));
  r.оружейных=игр.filter(x=>оружейные.has(x)).length;
  endCombat();
  Object.keys(orig).forEach(k=>{SFX.prototype[k]=orig[k];});Bank.play=OP;
  return r;});
 check('4. взмах мечом не зовёт синтезатор и звучит записью клинка',
  меч.синтез===0&&меч.взмах.some(x=>/blade_swing|lug_whoosh|oc_swing|lug_staff/.test(x)),меч);
 check('4. удар — один свист и один удар клинка, а не стопка из семи звуков',
  меч.свистов===1&&меч.ударов===1&&меч.оружейных<=4,меч);

 /* ── 5. Любое действие обрывает речь ── */
 await page.evaluate(()=>{
  window.FAKE={log:[],cancels:0,cur:null,
   speak(text,o){this.log.push(text);this.cur=o;setTimeout(()=>{try{o.onstart();}catch(e){}},0);return true;},
   cancel(){this.cancels++;this.cur=null;},speaking(){return !!this.cur;},
   end(){const o=this.cur;this.cur=null;if(o&&o.onend)o.onend();},reset(){this.log=[];this.cancels=0;this.cur=null;}};
  Speech.adapter=window.FAKE;Speech._chunk=t=>[String(t)];Speech.stop();Speech.recent.clear();
  settings.speech=1;settings.stopOnAction=1;
  while(activeLayer())closeTopUI();if(G.inCombat)endCombat();G.place=null;G.ship=null;G.weaponDrawn=false;});
 const говорит=(pri)=>page.evaluate(p=>{Speech.stop();FAKE.reset();Speech.recent.clear();
  Speech.say("Важная длинная весть, которую прежде свайп не обрывал "+Math.random(),{pri:p});
  return Speech.isSpeaking();},pri);
 const оборвано=()=>page.evaluate(()=>({говорит:Speech.isSpeaking()&&FAKE.log.length>0&&/Важная/.test((Speech.current||{}).text||""),отмен:FAKE.cancels}));
 const r5={};
 r5.идёт=await говорит(1);await swipe(150,0);r5.свайп=await оборвано();
 await говорит(0);await tap();r5.касание=await оборвано();
 await говорит(1);await swipe(0,-150,3);r5.триПальца=await оборвано();
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});
 await говорит(1);await page.keyboard.press("ArrowUp");r5.клавиша=await оборвано();
 /* два пальца вверх — «повторить или оборвать»: игра сама решает, и речь обрывается ИМ */
 await говорит(1);await swipe(0,-150,2);r5.двумяВверх=await page.evaluate(()=>({говорит:Speech.isSpeaking()&&/Важная/.test((Speech.current||{}).text||""),userStops:Speech.stats.userStops}));
 /* настройка выключает */
 await page.evaluate(()=>{settings.stopOnAction=0;});
 await говорит(1);await tap();r5.выключено=await оборвано();
 await page.evaluate(()=>{settings.stopOnAction=1;});
 check('5. свайп, касание по полю, жест тремя пальцами и клавиша обрывают даже важную речь',
  r5.идёт&&!r5.свайп.говорит&&!r5.касание.говорит&&!r5.триПальца.говорит&&!r5.клавиша.говорит,r5);
 check('5. два пальца вверх обрывают речь своим делом; с выключенной настройкой касание не обрывает',
  !r5.двумяВверх.говорит&&r5.выключено.говорит,r5);
 const ощуп=await page.evaluate(async()=>{
  /* ощупывание в окне: палец держит пункт, его имя не обрывается отрывом */
  CMD.settings();await new Promise(z=>setTimeout(z,300));
  const b=[...activeLayer().querySelectorAll('button')].find(x=>x.offsetParent);
  const rc=b.getBoundingClientRect();return {x:rc.x+rc.width/2,y:rc.y+rc.height/2};});
 await page.evaluate(()=>{Speech.stop();FAKE.reset();Speech.recent.clear();});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:ощуп.x,y:ощуп.y,id:0}]});
 await page.waitForTimeout(700);
 const имя=await page.evaluate(()=>({говорит:Speech.isSpeaking(),текст:(Speech.current||{}).text||""}));
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 await page.waitForTimeout(200);
 const послеОтрыва=await page.evaluate(()=>({говорит:Speech.isSpeaking(),текст:(Speech.current||{}).text||""}));
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});
 check('5. ощупывание не обрывает только что названное имя',
  имя.говорит&&послеОтрыва.говорит&&послеОтрыва.текст===имя.текст,{имя,послеОтрыва});

 /* ── 6. Стороны как свайпы ── */
 const стороны=await page.evaluate(()=>{
  const r={};Speech.adapter=null;
  settings.compass=1;r.сКомпасом=dirBetween(1,-1);r.сКомпасомГде=dirWhere("N");
  settings.compass=0;
  r.наискось=dirBetween(1,-1);r.прямо=dirBetween(0,-3);r.позадиСлева=dirBetween(-2,1);
  r.где=dirWhere("N");r.куда=dirWhither("E");r.слово=dirWord("S");
  /* стена впереди в подземелье */
  const lvl=genLevel(1700,1700,2,"cave_entrance");let pos=null;
  outer:for(let y=1;y<lvl.g.length-1;y++)for(let x=1;x<lvl.g[y].length-1;x++)if(lvl.g[y][x]==="."&&tileAt(lvl,x,y-1)==="#"){pos={x,y};break outer;}
  G.place={kind:"dungeon",bx:1700,by:1700,stype:"cave_entrance",name:"проба",depth:2,x:pos.x,y:pos.y};
  settings.hints=1;window.__said=[];moveInside("N");
  r.стена=window.__said.filter(t=>/Стена/.test(t)).slice(-1)[0]||"";
  r.проходы=describeHere(false);
  r.осмотр=Look.summary(Look.scan());
  G.place=null;
  /* задание «очисти округу» больше не говорит undefined */
  let плохих=0,убить=0;for(let i=0;i<400;i++){const q=safeFn(()=>questFor({name:"Проба",tier:1,x:900+i*3,y:1100+i,key:"проба"+i,race:"Люди"}),null);
   if(q&&q.type==="kill")убить++;if(q&&/undefined/.test(q.text||""))плохих++;}
  r.заданийСundefined=плохих;r.заданийУбить=убить;
  settings.compass=1;
  return r;});
 check('6. без сторон света — «впереди справа», «стена впереди», проходы и осмотр без севера',
  стороны.сКомпасом==="северо-восток"&&стороны.наискось==="впереди справа"&&стороны.прямо==="впереди"&&стороны.позадиСлева==="позади слева"
  &&стороны.где==="впереди"&&стороны.куда==="вправо"&&стороны.слово==="назад"&&стороны.стена==="Стена впереди."
  &&!/север|юг|запад|восток/.test(стороны.проходы)&&/^Осмотр\./.test(стороны.осмотр)&&!/лицом/.test(стороны.осмотр),стороны);
 check('6. в заданиях больше нет «иди на undefined»',стороны.заданийСundefined===0,стороны.заданийСundefined);

 /* ── 7. Настройки, руководство, документы ── */
 const н=await page.evaluate(()=>{
  const g=GUIDE_BY_NUM[97];
  return {флажкиЕсть:!!document.getElementById("setCompass")&&!!document.getElementById("setStopOnAction"),
   умолчания:settings.compass===1&&settings.stopOnAction===1,
   глава:g!==undefined&&GUIDE[g].body.length>=6,часть:g!==undefined&&guidePartOf(g)};});
 check('7. два флажка в настройках, глава 97 в первой части',н.флажкиЕсть&&н.умолчания&&н.глава&&/Часть I\./.test(н.часть),н);
 const root=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(root,'README.md'),'utf8');
 const docs=fs.readFileSync(path.join(root,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 check('7. README и docs/ВЗАИМОДЕЙСТВИЕ.md описывают поправки',/Любое действие обрывает речь/.test(readme)&&/Стороны как свайпы/.test(docs));

 console.log(results.join('\n'));
 console.log('Ошибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
