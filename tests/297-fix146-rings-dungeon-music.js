/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 297: 14.6 — КОЛЬЦА МАШИНЫ ПРОСТРАНСТВА И МУЗЫКА ПОДЗЕМЕЛИЙ

   Просьбы игрока:
   — «нашёл машину изменения пространства “Тихоня”, починил, нажал “Войти в
     кольца” — и ничего не произошло»;
   — «в некоторых подземельях и подземных крепостях музыка слишком весёлая,
     а должна быть устрашающей, подземной; и у каждого подземелья — своя».
   1. Починенная машина: в окне есть «Запустить»; «Войти в кольца» сама
      запускает её и уводит на три яруса вниз; фраза в женском роде.
   2. С последнего яруса кольца ведут вверх; при осмотре слышно, куда.
   3. Не идут кольца — сказано почему: сломана, порча, завал, комбинация,
      перегрузка; ярус не меняется. У перегруженной есть «Остановить».
   4. Под землёй ни одной весёлой темы; новые тёмные темы лежат на месте,
      в 320 кбит/с и в описи; весёлые не пропали — звучат наверху.
   5. У подземелий разная музыка: первые ярусы звучат разными темами, у
      каждого подземелья свой набор; соседние пояса темой не повторяются;
      выбор всегда один и тот же.
   6. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),cp=require('child_process');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  G.level=12;G.hpMax=9999;G.hp=9999;
  /* narrate — константа страницы: слушаем единый обработчик речи. */
  window.СКАЗАНО=[];const e0=Speech.enqueue.bind(Speech);Speech.enqueue=function(t,o){СКАЗАНО.push(String(t));return e0(t,o);};
  window.кнопки=()=>[...document.querySelectorAll('#dpBody [data-cmd^="dp:"]')].map(q=>q.textContent);
  window.спим=мс=>new Promise(r=>setTimeout(r,мс));
  /* Подземелье с машиной пространства не на последнем ярусе. */
  window.вМашину=async(последний)=>{
   for(let x=1000;x<120000;x+=37)for(let y=1000;y<1600;y+=41){const cc=cellContent(x,y);if(!(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon"))continue;
    const s=Deep.spec(x,y,cc.structure.type);const m=s.mechs.find(q=>q.kind==="space"&&(последний?true:q.tier<s.N&&q.tier+3<=s.N));
    if(!m)continue;
    G.place=null;G.x=x;G.y=y;safeFn(()=>enterPlace(cellContent(x,y)));while(activeLayer())closeTopUI();
    if(!G.place)continue;           /* вход не открылся (занято, ночь, страж) — следующее подземелье */
    if(G.place.depth===0)changeDepth(1,{bypass:true});
    await спим(300);if(!Deep.on())continue;
    const S=Deep.here();const X=Deep.st(S);const M=S.mechs.find(q=>q.id===m.id);
    if(последний)M.tier=S.N;   /* та же машина, но на дне: куда поведут кольца */
    if(G.place.depth!==M.tier){Deep.go(M.tier);await спим(300);}
    const e=Deep.els(S,X,M.tier).find(q=>q.t==="mech"&&q.ref.id===M.id);G.place.x=e.x;G.place.y=e.y;
    return {S,X,M};}
   return null;};});

 /* ── 1. Починка и вход в кольца ── */
 const к=await p.evaluate(async()=>{const w=await вМашину(false);if(!w)return {нет:1};const {S,X,M}=w;
  X.mech[M.id]="damaged";G.inv["древняя шестерня"]=1;
  СКАЗАНО.length=0;CMD.dp("m:"+M.id+":repair");await спим(200);
  const починка=СКАЗАНО.slice(),после=кнопки(),сост=Deep.mst(X,M);
  СКАЗАНО.length=0;const до=G.place.depth;CMD.dp("m:"+M.id+":space");await спим(400);
  return {до,после:G.place.depth,N:S.N,tier:M.tier,починка,кнопки:после,сост,стало:Deep.mst(X,M),кольца:СКАЗАНО.slice(0,3)};});
 check('1. починенная машина: «Запустить» в окне; «Войти в кольца» запускает её и уводит на три яруса вниз; фраза в женском роде',
  !к.нет&&к.сост==="ok"&&к.кнопки.includes("Запустить")&&к.кнопки.includes("Войти в кольца")
  &&к.починка.some(t=>/исправна\. Теперь её можно запустить/.test(t))&&!к.починка.some(t=>/исправен|его можно/.test(t))
  &&к.после===к.tier+3&&к.стало==="active"&&к.кольца.some(t=>/запускаете машину.*вниз, на \d+-й ярус/.test(t)),к);

 /* ── 2. С последнего яруса — вверх; осмотр говорит куда ── */
 const в=await p.evaluate(async()=>{const w=await вМашину(true);if(!w)return {нет:1};const {S,X,M}=w;
  X.mech[M.id]="active";СКАЗАНО.length=0;CMD.dp("m:"+M.id+":look");await спим(150);const осмотр=СКАЗАНО.slice(0,2);
  СКАЗАНО.length=0;const до=G.place.depth;CMD.dp("m:"+M.id+":space");await спим(400);
  return {до,после:G.place.depth,N:S.N,осмотр,кольца:СКАЗАНО.slice(0,3)};});
 check('2. с последнего яруса кольца ведут вверх, и осмотр это называет',
  !в.нет&&в.до===в.N&&в.после===Math.max(1,в.N-3)&&в.осмотр.some(t=>/Кольца ведут вверх, на \d+-й ярус/.test(t))&&в.кольца.some(t=>/вверх, на \d+-й ярус/.test(t)),в);

 /* ── 3. Не идут — почему ── */
 const п=await p.evaluate(async()=>{const w=await вМашину(false);if(!w)return {нет:1};const {X,M}=w;const r={};
  for(const st of ["damaged","cursed","blocked","combo","overloaded"]){X.mech[M.id]=st;СКАЗАНО.length=0;const до=G.place.depth;
   CMD.dp("m:"+M.id+":space");await спим(120);r[st]={сказано:СКАЗАНО.find(t=>/Кольца/.test(t))||"",остался:G.place.depth===до,кнопки:кнопки()};}
  return r;});
 check('3. кольца не идут — игра говорит почему и что сделать; у перегруженной есть «Остановить»',
  !п.нет&&/шестерня/.test(п.damaged.сказано)&&/порча/.test(п.cursed.сказано)&&/завал/.test(п.blocked.сказано)
  &&/комбинаци/.test(п.combo.сказано)&&/перегружены/.test(п.overloaded.сказано)
  &&Object.values(п).every(v=>v.остался)&&п.overloaded.кнопки.includes("Остановить"),п);
 await p.evaluate(()=>{while(activeLayer())closeTopUI();});

 /* ── 4. Под землёй — ни одной весёлой темы ── */
 const т=await p.evaluate(()=>{
  const ВЕСЁЛЫЕ=/sol_neptune|mg_mus_egypt|mg_mus_indian|ev_ghoulish_fun|wy_germanic_theme_3\.ogg|st_treasure_hunter/;
  const под=Object.keys(MUSIC_TRACK).filter(k=>/^dk_|^depth_|^pl_(ruins|cave_entrance|ossuary|pit)$/.test(k));
  const весёлые=под.filter(k=>(SOUND_BANK[MUSIC_TRACK[k]]||{f:[]}).f.some(f=>ВЕСЁЛЫЕ.test(f)));
  const все=[];Object.values(MUSIC_TRACK).forEach(r=>(SOUND_BANK[r]||{f:[]}).f.forEach(f=>все.push(f)));
  const наверху=["solarus/sol_neptune.ogg","mg/mg_mus_egypt.ogg","mg/mg_mus_indian.ogg","evol/ev_ghoulish_fun.ogg","wyrmsun/wy_germanic_theme_3.ogg","stendhal/st_treasure_hunter.ogg","score/score_wind_01.ogg"].filter(f=>!все.includes(f));
  const новые=все.filter(f=>/^wesnoth\//.test(f));
  return {под:под.length,весёлые,наверху,новые,крепость:SOUND_BANK.mus_dk_fort.f};});
 const папка=path.join(ROOT,'sounds','wesnoth');
 const опись=fs.existsSync(path.join(папка,'CREDITS.md'))?fs.readFileSync(path.join(папка,'CREDITS.md'),'utf8'):'';
 const файлы=т.новые.map(f=>{const п=path.join(ROOT,'sounds',f);let кбит=0;
  try{кбит=Math.round(parseInt(cp.execFileSync('ffprobe',['-v','error','-show_entries','format=bit_rate','-of','csv=p=0',п],{encoding:'utf8'}).trim(),10)/1000);}catch(_){}
  return {f,есть:fs.existsSync(п),кбит,вОписи:опись.includes('`'+path.basename(f)+'`')};});
 check('4. под землёй ни одной весёлой темы; тёмные темы на месте, 320 кбит/с и в описи; весёлые звучат наверху',
  т.под>=20&&!т.весёлые.length&&!т.наверху.length&&т.новые.length>=7&&файлы.every(x=>x.есть&&x.кбит>=315&&x.вОписи)
  &&fs.existsSync(path.join(папка,'LICENSE-CC-BY-SA-4.0.txt'))&&/wesnoth\/wn_juggernaut/.test(т.крепость.join()),{т,файлы});

 /* ── 5. У каждого подземелья своя музыка ── */
 const м=await p.evaluate(()=>{const g0=G.place;const first={};let n=0,соседи=0,нетТемы=[],разныхНаборов=new Set(),устойчиво=true;
  for(let x=1000;x<200000&&n<60;x+=97)for(let y=1000;y<1800&&n<60;y+=89){const c=cellContent(x,y);if(!(c.structure&&PLACE_KIND[c.structure.type]==="dungeon"))continue;
   const st=c.structure.type;const s=Deep.spec(x,y,st);n++;G.place={bx:x,by:y,stype:st,depth:1,kind:"dungeon",x:0,y:0};
   const keys=[];let прежний=null,band=null;
   for(let d=1;d<=s.N;d++){G.place.depth=d;const k=underTrack(d);if(underTrack(d)!==k)устойчиво=false;keys.push(k);
    if(!MUSIC_TRACK[k]||!Bank.has(MUSIC_TRACK[k]))нетТемы.push(k);
    const b=s.tiers[d].band;if(b!==band&&band!==null&&k===прежний&&k!=="boss")соседи++;if(b!==band){прежний=k;band=b;}}
   first[keys[0]]=(first[keys[0]]||0)+1;разныхНаборов.add([...new Set(keys)].join(","));}
  G.place=g0;const tot=Object.values(first).reduce((a,v)=>a+v,0);
  return {n,разныхПервых:Object.keys(first).length,совпадение:+Object.values(first).reduce((a,v)=>a+(v/tot)**2,0).toFixed(3),
   соседи,нетТемы:[...new Set(нетТемы)],наборов:разныхНаборов.size,устойчиво,first};});
 check('5. у подземелий разная музыка: первые ярусы — разными темами, у каждого свой набор, соседние пояса не повторяются, выбор устойчив',
  м.n>=30&&м.разныхПервых>=8&&м.совпадение<0.25&&м.наборов>=м.n*0.9&&м.соседи===0&&!м.нетТемы.length&&м.устойчиво,м);

 /* ── 5б. Вход в подземелье (верх, до первого яруса) — своя тема места или близкая тёмная, по месту в мире ── */
 const вх=await p.evaluate(()=>{const g0=G.place;const r={};
  for(const t of Object.keys(DEEP_GATE_POOL)){const st=t.slice(3);const keys=[];let устойчиво=true,вПуле=true,ярус=true;
   for(let i=0;i<40;i++){G.place={bx:1000+i*131,by:2000+i*77,stype:st,depth:0,kind:"dungeon",x:0,y:0};
    const k=deepGateKey(t);if(deepGateKey(t)!==k)устойчиво=false;if(!DEEP_GATE_POOL[t].includes(k)||!MUSIC_TRACK[k])вПуле=false;keys.push(k);
    G.place.depth=2;if(deepGateKey(t)!==t)ярус=false;}
   r[t]={разных:new Set(keys).size,устойчиво,вПуле,ярус};}
  G.place=g0;return r;});
 check('5б. вход в подземелье звучит по-своему: у руин, зева, костницы и ямы — своя тема или близкая тёмная, по месту; на ярусах — тема яруса',
  Object.keys(вх).length===4&&Object.values(вх).every(x=>x.разных>=2&&x.устойчиво&&x.вПуле&&x.ярус),вх);

 check('6. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
