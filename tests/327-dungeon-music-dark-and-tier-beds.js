/* ════════════════════════════════════════════════════════════════════════
   НАБОР 327: ПОДЗЕМЬЕ — ТОЛЬКО ЖУТКАЯ МУЗЫКА, У КАЖДОГО ЯРУСА СВОЙ ФОН
   (после 16.0)

   Просьбы игрока: «на восьмом ярусе через какое-то время заиграла весёлая
   музыка — в подземелье должна быть жуткая; проверь все подземелья»;
   «звук поверхностей разный, а фон ярусов плюс-минус один — сделай разным».

   1. Все подземелья (по шестьдесят мест каждого рода подземелья, ярусы 1–12,
      и глубокие — до сотого): тема яруса — роль, в которой нет ни одного
      бодрого файла (Solarus «Boss», «Road to Victory», темы местностей,
      города, затишья, заглавия). Роль с несколькими файлами играет их по
      кругу — проверяются все файлы.
   2. Ярус хозяина подземелья (бой с сильным), бой под землёй, затишье и тема
      местности, запрошенные под землёй, — тоже мрачные; наверху бой — прежний.
   3. Фон ярусов: на ярусах 1–12 у одного подземелья больше пяти разных
      главных фонов, и соседние ярусы не звучат одним фоном; второй слой не
      совпадает с главным.
   4. Синтез без записи под землёй — тёмный (пещерный строй).
   5. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};settings.music=1;settings.bgMusic=1;});

 const м=await p.evaluate(()=>{
  const БОДРО=/solarus|sol_boss|road_to_victory|mus_plains|mus_town|mus_safe|tavern|village|market|title|prologue/i;
  const роль=k=>MUSIC_TRACK[k]||k;const файлы=k=>((SOUND_BANK[роль(k)]||{}).f)||[];
  const плохие=[];const тем=new Set();let ярусов=0,мест=0;
  const роды=Object.keys(PLACE_KIND).filter(t=>PLACE_KIND[t]==="dungeon");
  const сыграно=[];const s0=Bank.loop.bind(Bank);
  Bank.loop=function(ch,r,o){if(ch==="score")сыграно.push(r);return null;};
  for(const st of роды)for(let i=0;i<60;i++){const bx=24000+i*131+st.length*17,by=26000-i*97;мест++;
   for(const d of [1,2,3,4,5,6,7,8,9,10,11,12,25,45,70,95]){
    G.place={kind:"dungeon",bx,by,stype:st,name:"т",depth:d,x:1,y:1};Music.current=null;Music.track=null;сыграно.length=0;
    Music.start(locationMusicKey());ярусов++;
    const r=сыграно[0];if(r)тем.add(r);
    const ф=((SOUND_BANK[r]||{}).f)||[];if(!r||ф.some(f=>БОДРО.test(f)))плохие.push({st,d,r,ф:ф.filter(f=>БОДРО.test(f))});}}
  /* бой, бой с сильным, затишье, местность и заглавие под землёй */
  const просьбы={};for(const k of ["battle","boss","safe","plains","town","prologue","pl_tavern"]){
   G.place={kind:"dungeon",bx:24001,by:26001,stype:"cave_entrance",name:"т",depth:8,x:1,y:1};Music.current=null;Music.track=null;сыграно.length=0;
   Music.start(k);const r=сыграно[0];просьбы[k]={r,бодро:(((SOUND_BANK[r]||{}).f)||[]).filter(f=>БОДРО.test(f))};}
  G.place=null;Music.current=null;Music.track=null;сыграно.length=0;Music.start("battle");const наверху=сыграно[0];
  Bank.loop=s0;
  return {мест,ярусов,тем:[...тем],плохие:плохие.slice(0,6),плохихВсего:плохие.length,просьбы,наверху};});
 check("1. Все подземелья, все ярусы: тема яруса без бодрых файлов",м.плохихВсего===0&&м.ярусов>1000,{мест:м.мест,ярусов:м.ярусов,тем:м.тем,плохие:м.плохие});
 check("2. Под землёй бой, бой с сильным, затишье, местность — мрачные; наверху бой прежний",
  Object.values(м.просьбы).every(z=>z.r&&!z.бодро.length)&&м.просьбы.boss.r==="mus_boss_dark"&&м.просьбы.battle.r==="mus_battle_dark"&&м.наверху==="mus_battle",{просьбы:м.просьбы,наверху:м.наверху});

 const ф=await p.evaluate(()=>{const o={подземелий:0,мало:[],соседи:[],слой:[]};
  for(let i=0;i<30;i++){const bx=25000+i*211,by=24000+i*157;o.подземелий++;
   G.place={kind:"dungeon",bx,by,stype:"cave_entrance",name:"т",depth:1,x:1,y:1};
   const гл=[];for(let d=1;d<=12;d++){G.place.depth=d;const сл=Подземье165.слои(G.place,d);const r=bankAmbientRole();гл.push(r);
    if(сл&&сл.второй===r)o.слой.push({i,d,r});}
   if(new Set(гл).size<=5)o.мало.push({i,гл});
   for(let d=1;d<12;d++)if(гл[d]===гл[d-1])o.соседи.push({i,d:d+1,r:гл[d]});}
  G.place=null;return o;});
 check("3. Фон ярусов: разный у ярусов, соседи не совпадают, второй слой свой",ф.мало.length===0&&ф.соседи.length===0&&ф.слой.length===0,ф);

 const с=await p.evaluate(()=>{const o={};G.place={kind:"dungeon",bx:1,by:1,stype:"cave_entrance",name:"т",depth:3,x:1,y:1};
  o.под=Подземье165.синтез("depth_1");o.подМест=Подземье165.синтез("plains");G.place=null;o.наверху=Подземье165.синтез("plains");o.темаЯруса=Подземье165.синтез("depth_2");return o;});
 check("4. Синтез без записи под землёй — тёмный (пещерный строй)",с.под==="cave"&&с.подМест==="cave"&&с.наверху==="plains"&&с.темаЯруса==="cave",с);

 check("5. Ошибок страницы нет",errors.length===0,errors.slice(0,5));
 console.log(results.join("\n"));
 const failed=results.filter(r=>r.startsWith("FAIL")).length;console.log(`\n${results.length-failed}/${results.length} пройдено`);
 await browser.close();process.exit(failed?1:0);
})();
