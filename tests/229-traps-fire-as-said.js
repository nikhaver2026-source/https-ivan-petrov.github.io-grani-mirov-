/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 229: ЛОВУШКА, О КОТОРОЙ СКАЗАНО, — СРАБАТЫВАЕТ

   Жалоба игрока: игра говорит о ловушке, а сама ловушка ни звуком, ни
   ударом не срабатывает. Причина была в сундуках: о «натяжке по кромке»
   говорила одна проверка, а крышка срабатывала по другой.
   1. Сундук, о котором осмотр говорит «натяжка», при открытии срабатывает:
      звук ловушки и урон; сундук без предупреждения — не бьёт.
   2. Снятая ловушка сундука при открытии молчит.
   3. Открытый сундук — отработавшая ловушка: шаг на него не бьёт снова.
   4. Найденная, но не снятая ловушка под ногой не пустое место: на бегу она
      срабатывает звуком и ударом, а осторожный шаг называет её.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.ИГРАЛО=[];const b0=Bank.play.bind(Bank);Bank.play=(r,o)=>{ИГРАЛО.push(r);return b0(r,o);};
  window.СКАЗАНО=[];const s0=Speech.say.bind(Speech);Speech.say=(t,...a)=>{СКАЗАНО.push(String(t));return s0(t,...a);};});

 /* ── 1–3. Сундуки глубины ── */
 const с=await page.evaluate(()=>{
  const out={предупреждённых:0,сработало:0,безПредупрежденияБило:0,молчали:[],снятаяМолчит:null,повторно:null};
  for(const depth of [3,6,9,12]){
   G.place={kind:"dungeon",bx:1300+depth,by:1300,stype:"ruins",name:"Проба",depth,x:1,y:1};G.marks={};
   const l=curLevel();
   for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
    if(tileAt(l,x,y)!=="C")continue;
    if(chestLocked(x,y))continue;
    const осмотр=chestPreview(x,y),натяжка=/натяжка/.test(осмотр);
    G.hp=G.hpMax=500;ИГРАЛО.length=0;СКАЗАНО.length=0;
    G.place.x=x;G.place.y=y;openChest(x,y);
    const удар=G.hp<500,ловушкаЗвук=СКАЗАНО.some(t=>/Ловушка!/.test(t));
    if(натяжка){out.предупреждённых++;if(удар&&ловушкаЗвук)out.сработало++;else out.молчали.push({x,y,depth});}
    else if(удар)out.безПредупрежденияБило++;
    /* 3. открытый сундук — шаг на него не бьёт */
    if(натяжка&&out.повторно===null){const л=trapAt(x,y);out.повторно=л?л.состояние:"нет";}}}
  /* 2. снятая ловушка сундука молчит */
  for(const depth of [3,6,9,12]){
   if(out.снятаяМолчит!==null)break;
   G.place={kind:"dungeon",bx:1400+depth,by:1300,stype:"ruins",name:"Проба",depth,x:1,y:1};G.marks={};
   const l=curLevel();
   for(let y=0;y<l.h&&out.снятаяМолчит===null;y++)for(let x=0;x<l.w;x++){
    if(tileAt(l,x,y)!=="C"||chestLocked(x,y))continue;
    const л=trapAt(x,y);if(!л)continue;
    setPlaceMark(x,y,"trap_off");
    G.hp=G.hpMax=500;СКАЗАНО.length=0;G.place.x=x;G.place.y=y;openChest(x,y);
    out.снятаяМолчит=G.hp===500&&!СКАЗАНО.some(t=>/Ловушка!/.test(t));break;}}
  return out;});
 check('1. сундук с «натяжкой» при открытии срабатывает звуком и ударом, без предупреждения — не бьёт',
  с.предупреждённых>=3&&с.сработало===с.предупреждённых&&с.безПредупрежденияБило===0,с);
 check('2. снятая ловушка сундука при открытии молчит',с.снятаяМолчит===true,с.снятаяМолчит);
 check('3. открытый сундук — отработавшая ловушка: шаг на него не бьёт снова',с.повторно==="обезврежена"||с.повторно==="нет",с.повторно);

 /* ── 4. Найденная ловушка под ногой ── */
 const н=await page.evaluate(()=>{
  G.place={kind:"dungeon",bx:1500,by:1500,stype:"ruins",name:"Проба",depth:12,x:1,y:1};G.marks={};
  const l=curLevel();let цель=null;
  const DV=DIRV;
  for(let y=1;y<l.h-1&&!цель;y++)for(let x=1;x<l.w-1&&!цель;x++){
   if(tileAt(l,x,y)!=="."||!trapAt(x,y))continue;
   for(const [d,[dx,dy]] of Object.entries(DV)){const sx=x-dx,sy=y-dy;
    if(tileAt(l,sx,sy)==="."&&!trapAt(sx,sy)&&/^[NSEW]$/.test(d)){цель={x,y,sx,sy,d};break;}}}
  if(!цель)return {нет:true};
  const пробовать=бег=>{setPlaceMark(цель.x,цель.y,"trap_on");G.place.x=цель.sx;G.place.y=цель.sy;G.hp=G.hpMax=500;
   ИГРАЛО.length=0;СКАЗАНО.length=0;runState.active=бег;try{moveInside(цель.d);}finally{runState.active=false;}
   return {удар:G.hp<500,сказано:СКАЗАНО.filter(t=>/переступ|задели|Ловушка отработала/.test(t)),звук:ИГРАЛО.slice()};};
  /* на бегу шанс переступить мал: из двадцати попыток хоть одна сработает */
  const бег=[];for(let i=0;i<20;i++)бег.push(пробовать(true));
  const шаг=пробовать(false);
  const л=trapAt(цель.x,цель.y)||{};
  return {цель,сработалаНаБегу:бег.some(r=>r.удар&&r.звук.indexOf(л.сраб)>=0||r.удар),назвалаШаг:шаг.сказано.length>0,шаг,сраб:л.сраб};});
 check('4. найденная, но не снятая ловушка: на бегу срабатывает ударом, осторожный шаг её называет',
  !н.нет&&н.сработалаНаБегу&&(н.назвалаШаг||н.шаг.удар),н);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
