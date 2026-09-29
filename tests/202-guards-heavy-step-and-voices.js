/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 202: СТРАЖА — ТЯЖЁЛЫЙ ШАГ В ЖЕЛЕЗЕ И ЖИВЫЕ ГОЛОСА

   Просьба игрока: «Исправь на более реалистичный звук у стражи, когда она
   ходит, — доспехов и оружия. Добавь стражникам голоса живые и различные
   реплики, когда они будут проходить мимо игрока. Добавь им звук тяжёлых
   шагов: они же в доспехах и с оружием».

   1. Свои записи железа стражника лежат в sounds/gear (FLAC, моно, 44,1 кГц)
      и названы в титрах: кольчуга, латы, ножны, вес сапога.
   2. Шаг стражника тяжёлый: пол места на треть тона ниже, на твёрдом полу —
      глухой вес удара; кольчуга звенит на каждом шаге, латы — через шаг,
      ножны — каждый четвёртый шаг.
   3. Шаги идут ровно, подряд через ходы, без рваной паузы; у одного
      стражника одна запись шага на каждую ногу.
   4. Горожанин ступает без железа и не ниже тоном; в деревне стража в коже.
   5. Остановился — железо коротко оседает, такт шага сброшен.
   6. У каждого стражника свой голос: строка звучит его записью (_v1, _v2),
      а если её нет — первой записанной.
   7. Все строки стражи записаны всеми голосами стражи, файлы на месте.
   8. Что скажет стражник, зависит от обстоятельств: ночь, раны, дождь,
      свой или недруг, земля за Гранью.
   9. Проходя мимо, стражник говорит своей записью, без оклика толпы
      поверх, и слышно его железо; голос игры не цитирует строку.
  10. Лишний звук обрывается, но не речь: реплику не глушат шаги.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');const fs=require('fs');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
const ROOT=path.join(__dirname,'..');
function probe(file){
 const p=spawnSync('ffprobe',['-v','error','-show_entries','stream=codec_name,channels,sample_rate','-of','json',file],{encoding:'utf8'});
 try{const s=JSON.parse(p.stdout).streams[0];return {c:s.codec_name,ch:s.channels,sr:+s.sample_rate};}catch(_){return null;}}
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 /* ── 1. записи железа ── */
 const банк=await page.evaluate(()=>["gear_guard_mail","gear_guard_plate","gear_guard_sword","gear_guard_thud"].map(r=>({r,f:(SOUND_BANK[r]||{}).f||[],раздел:roleSection(r)})));
 const титры=fs.readFileSync(path.join(ROOT,'sounds','gear','CREDITS.md'),'utf8');
 const плохие=[];банк.forEach(b=>b.f.forEach(f=>{const i=probe(path.join(ROOT,'sounds',f));
  if(!i||i.c!=='flac'||i.ch!==1||i.sr!==44100||титры.indexOf('`'+f.split('/')[1]+'`')<0)плохие.push({f,i});}));
 check('1. свои записи железа стражника: кольчуга, латы, ножны, вес сапога — FLAC моно 44,1 кГц, названы в титрах, раздел «шаги»',
  банк.every(b=>b.f.length>=4&&b.раздел==="steps")&&плохие.length===0,{банк:банк.map(b=>[b.r,b.f.length,b.раздел]),плохие:плохие.slice(0,3)});

 /* Город для проверок: стража и горожане, свой ход — вручную. */
 const готово=await page.evaluate(()=>{
  window.город=(stype)=>{
   Actors.stop();
   G.place={kind:PLACE_KIND[stype],bx:6100+stype.length*17,by:5300,stype,name:"Проба",depth:0,x:1,y:1};
   const lvl=curLevel();if(!lvl)return false;
   G.place.x=lvl.entry.x;G.place.y=lvl.entry.y;
   Actors.ensure();clearInterval(Actors.iv);Actors.iv=1;
   return Actors.list.length>0;};
  window.ЗВУКИ=[];const sa=Spatial.at.bind(Spatial);
  Spatial.at=function(p,dx,dy,o){ЗВУКИ.push({p:String(p),dx,dy,rate:o&&o.rate,voice:!!(o&&o.voice),t:Date.now()});return sa(p,dx,dy,o);};
  G.inCombat=false;G.combat=null;settings.effects=1;settings.hrtf=1;window.maybeEvent=()=>{};
  return город("castle");});
 check('0. замок со стражей готов',готово);

 /* ── 2–3. тяжёлый шаг, ровный ритм ── */
 const шаг=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  const g=Actors.list.find(a=>a.kind==="guard");if(!g)return null;
  g.x=G.place.x+2;g.y=G.place.y;g.шагДо=0;g.шаг=0;
  const пол=indoorSurface(),роль=SURF_ROLE[пол];
  const файлыПола=new Set(SOUND_BANK[роль].f);
  ЗВУКИ.length=0;
  /* Три хода подряд: стражник шёл все три. */
  for(let i=0;i<3;i++){Actors.step(g,2);await w(1500);}
  await w(300);
  const все=ЗВУКИ.slice();
  const полы=все.filter(x=>файлыПола.has(x.p)&&x.dx===2);
  const с=(re)=>все.filter(x=>re.test(x.p)).length;
  const инт=[];for(let i=1;i<полы.length;i++)инт.push(полы[i].t-полы[i-1].t);
  const ноги=new Set(полы.map(x=>x.p));
  return {пол,шагов:полы.length,тон:полы.map(x=>+Number(x.rate).toFixed(3)),темп:Actors.темп(g),инт,ноги:ноги.size,
   вес:с(/guard_thud/),кольчуга:с(/guard_mail/),латы:с(/guard_plate/),ножны:с(/guard_sword/),твёрдый:ACTOR_HARD_FLOOR.test(пол),след:Actors.lastStep};});
 check('2. шаг стражника тяжёлый: пол на треть тона ниже, вес удара на твёрдом полу; кольчуга на каждом шаге, латы через шаг, ножны раз в четыре шага',
  шаг&&шаг.шагов>=6&&шаг.тон.every(r=>r>0.8&&r<0.87)&&(!шаг.твёрдый||шаг.вес===шаг.шагов)&&шаг.кольчуга===шаг.шагов
  &&Math.abs(шаг.латы-шаг.шагов/2)<=0.5&&шаг.ножны>=1&&шаг.ножны<=Math.ceil(шаг.шагов/4),шаг);
 check('3. шаги идут ровно и подряд через ходы, без рваной паузы; у стражника одна запись шага на ногу',
  шаг&&шаг.инт.length>=5&&шаг.инт.every(d=>Math.abs(d-шаг.темп)<=45)&&шаг.ноги<=2&&шаг.темп>=630&&шаг.темп<=690,шаг&&{инт:шаг.инт,темп:шаг.темп,ноги:шаг.ноги});

 /* ── 4. горожанин и деревня ── */
 const прочие=await page.evaluate(async()=>{
  const w=ms=>new Promise(r=>setTimeout(r,ms));
  const r={};
  const f=Actors.list.find(a=>a.kind==="folk");
  if(f){f.x=G.place.x-2;f.y=G.place.y;f.шагДо=0;ЗВУКИ.length=0;Actors.step(f,2);await w(1300);
   /* Только то, что звучит с места горожанина: фон города сюда не попадает. */
   r.горожанин=ЗВУКИ.filter(x=>x.dx===-2&&x.dy===0).map(x=>({p:x.p,rate:x.rate}));}
  город("village");
  const g=Actors.list.find(a=>a.kind==="guard");
  if(g){g.x=G.place.x+1;g.y=G.place.y;g.шагДо=0;g.шаг=1;ЗВУКИ.length=0;Actors.step(g,1);await w(1300);
   r.деревня=ЗВУКИ.filter(x=>x.dx===1&&x.dy===0).map(x=>x.p);r.снаряжение=Actors.gear(g);}
  return r;});
 check('4. горожанин ступает без железа и не ниже тоном; в деревне стража в коже — скрип ремней, без кольчуги и лат',
  прочие.горожанин&&прочие.горожанин.length>=2&&!прочие.горожанин.some(x=>/^gear\//.test(x.p))
  &&прочие.горожанин.every(x=>!x.rate||x.rate>0.97)
  &&прочие.снаряжение&&прочие.снаряжение.доспех==="hero_step_leather"&&!прочие.снаряжение.латы
  &&прочие.деревня.some(p=>/gear_leather/.test(p))&&!прочие.деревня.some(p=>/guard_mail|guard_plate/.test(p)),прочие);

 /* ── 5. остановка ── */
 const стоп=await page.evaluate(async()=>{
  город("castle");
  const g=Actors.list.find(a=>a.kind==="guard");
  Actors.list=[g];g.x=G.place.x+2;g.y=G.place.y;g.шёлРаньше=true;g.шагДо=Date.now()+300;
  const fr=Actors.free.bind(Actors);Actors.free=()=>false;
  const st=Actors.step.bind(Actors);Actors.step=()=>true;
  Actors.lastSay=Date.now();ЗВУКИ.length=0;
  Actors.tick();
  Actors.free=fr;Actors.step=st;
  return {звон:ЗВУКИ.filter(x=>/guard_mail/.test(x.p)).map(x=>x.rate),такт:g.шагДо};});
 check('5. стражник встал — железо коротко оседает, такт шага сброшен',стоп.звон.length===1&&стоп.звон[0]<1&&стоп.такт===0,стоп);

 /* ── 6. свой голос ── */
 const голос=await page.evaluate(()=>{
  город("castle");
  const стражи=Actors.list.filter(a=>a.kind==="guard");
  const было=Folk.сказать,пути=[];
  Folk.сказать=function(путь){пути.push(путь);return true;};
  const стр=GUARD_LINES[0];
  const r={голоса:стражи.map(a=>a.голос)};
  [0,1,2].forEach(k=>Folk.реплика("guard",стр,{x:1,y:1},false,{голос:k}));
  /* Строка записана одним голосом — звучит он, чей бы голос ни просили. */
  VOICE_NPC.__проба={"x":["street_guard_0",0]};
  Folk.реплика("__проба","x",{x:1,y:1},false,{голос:2});
  /* Строка без записи первого голоса — звучит первый записанный. */
  VOICE_NPC.__проба={"x":["street_guard_0",0,6]};
  Folk.реплика("__проба","x",{x:1,y:1},false,{голос:0});
  delete VOICE_NPC.__проба;
  Folk.реплика("dark_guard",DARK_GUARD_LINES[0],{x:1,y:1},false,{голос:1});
  Folk.сказать=было;
  r.пути=пути;return r;});
 check('6. у каждого стражника свой голос: строка звучит его записью (_v1, _v2); нет его записи — первой записанной',
  new Set(голос.голоса.slice(0,3)).size===Math.min(3,голос.голоса.length)&&голос.голоса.every(k=>k>=0&&k<=2)
  &&голос.пути[0]==="street_guard_0_g"&&голос.пути[1]==="street_guard_0_v1_g"&&голос.пути[2]==="street_guard_0_v2_g"
  &&голос.пути[3]==="street_guard_0_g"&&голос.пути[4]==="street_guard_0_v1_g"&&голос.пути[5]==="street_darkguard_0_v1_g",голос);

 /* ── 7. все строки стражи — всеми голосами ── */
 const опись=await page.evaluate(()=>{
  const пулы={guard:GUARD_LINES,guard_night:GUARD_NIGHT_LINES,guard_friend:GUARD_FRIEND_LINES,guard_cold:GUARD_COLD_LINES,
   guard_hurt:GUARD_HURT_LINES,guard_rain:GUARD_RAIN_LINES,dark_guard:DARK_GUARD_LINES};
  const нет=[],файлы=[];let строк=0;
  for(const [р,арр] of Object.entries(пулы))арр.forEach(t=>{строк++;const e=VOICE_NPC[р]&&VOICE_NPC[р][t];
   const нужно=р==="dark_guard"?3:7;
   if(!e||((Number(e[2])||1)&нужно)!==нужно){нет.push(р+": "+t);return;}
   for(let k=0;k<3;k++)if((нужно>>k)&1)файлы.push(e[0]+(k?"_v"+k:"")+VOICE_GEN);});
  return {строк,нет,файлы,дни:GUARD_LINES.length,ночи:GUARD_NIGHT_LINES.length,лен:файлы.filter(f=>!(VOICE_NPC_LEN[f]>0))};});
 const безФайла=опись.файлы.filter(f=>!fs.existsSync(path.join(ROOT,'sounds','voice_npc',f+'.flac')));
 check('7. все строки стражи записаны всеми голосами стражи (три у стражи Грани, два у латников), файлы на месте',
  опись.строк>=80&&опись.дни>=40&&опись.ночи>=10&&опись.нет.length===0&&безФайла.length===0&&опись.лен.length===0,
  {строк:опись.строк,нет:опись.нет.slice(0,4),безФайла:безФайла.slice(0,3),безДлины:опись.лен.slice(0,3)});

 /* ── 8. обстоятельства ── */
 const повод=await page.evaluate(()=>{
  const r={};const R=Math.random,час=G.hour,hp=G.hp,пог=G.weather;
  Math.random=()=>0;
  G.hour=12;G.weather="Ясно";G.hp=Math.max(1,Math.floor(G.hpMax*0.2));r.ранен=Actors.guardLine(null,false).роль;
  G.hp=G.hpMax;G.weather="Дождь";r.дождь=Actors.guardLine(null,false).роль;
  G.weather="Ясно";G.hour=23;r.ночь=Actors.guardLine(null,false).роль;
  G.hour=12;r.день=Actors.guardLine(null,false).роль;
  r.свой=Actors.guardLine({id:"friend"},false).роль;r.недруг=Actors.guardLine({id:"hostile"},false).роль;
  r.грань=Actors.guardLine(null,true).роль;
  Math.random=()=>0.99;G.hour=12;r.деньСлучай=Actors.guardLine(null,false).роль;
  Math.random=R;G.hour=час;G.hp=hp;G.weather=пог;
  return r;});
 check('8. строка по обстоятельствам: раненому — к лекарю, под дождём — о сырости, ночью — ночной оклик, своему и недругу — своё, за Гранью — латник',
  повод.ранен==="guard_hurt"&&повод.дождь==="guard_rain"&&повод.ночь==="guard_night"&&повод.день==="guard"&&повод.свой==="guard_friend"
  &&повод.недруг==="guard_cold"&&повод.грань==="dark_guard"&&повод.деньСлучай==="guard",повод);

 /* ── 9. мимоходом ── */
 const мимо=await page.evaluate(()=>{
  город("castle");
  const g=Actors.list.find(a=>a.kind==="guard");
  Actors.list=[g];g.x=G.place.x+1;g.y=G.place.y;g.голос=2;
  const fr=Actors.free.bind(Actors);Actors.free=()=>false;
  const роли=[];const v0=Actors.voice.bind(Actors);Actors.voice=function(a,role,o){роли.push(role);return v0(a,role,o);};
  const было=Folk.сказать,пути=[];Folk.сказать=function(путь){пути.push(путь);return true;};
  const сказано=[];const ps=Speech._push.bind(Speech);Speech._push=function(m){сказано.push(String(m&&m.text));return ps(m);};
  const pf=Speech._pushFront.bind(Speech);Speech._pushFront=function(m){сказано.push(String(m&&m.text));return pf(m);};
  Actors.lastSay=0;Actors.tick();
  Actors.free=fr;Actors.voice=v0;Folk.сказать=было;Speech._push=ps;Speech._pushFront=pf;
  return {роли,пути,сказано:сказано.filter(t=>/проходит мимо/.test(t))};});
 check('9. проходя мимо, стражник говорит своей записью (свой голос), без оклика толпы поверх, звенит кольчугой; голос игры не цитирует строку',
  мимо.пути.length===1&&/_v2_g$/.test(мимо.пути[0])&&!мимо.роли.includes("throng_hail_m")&&!мимо.роли.includes("throng_lord")
  &&мимо.роли.includes("gear_guard_mail")&&мимо.сказано.length===1&&!/«/.test(мимо.сказано[0]),мимо);

 /* ── 10. речь не обрывают шаги ── */
 const речь=await page.evaluate(()=>{
  Spatial.stopAll();
  const стоп=[];const фальш=(voice,i)=>({voice,i,stop(){стоп.push(i);}});
  Spatial.live=[фальш(true,0)];for(let i=1;i<=12;i++)Spatial.live.push(фальш(false,i));
  Spatial.trim(10);
  const r={осталась:Spatial.live.some(o=>o.voice),стоп,длина:Spatial.live.length};
  Spatial.live=[];return r;});
 check('10. лишний звук обрывается, но не речь: реплику стражника не глушат шаги',речь.осталась&&речь.длина===10&&!речь.стоп.includes(0),речь);

 await page.evaluate(()=>{Actors.stop();G.place=null;});
 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\n${results.filter(r=>r.startsWith('PASS')).length}/${results.length} passed`);
 await browser.close();
})();
