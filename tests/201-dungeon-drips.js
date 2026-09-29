/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 201: КАПЕЛЬ ПОДЗЕМЕЛЬЯ ЗВУЧИТ ПОД СВОДОМ, А НЕ В ДОМЕ

   Жалоба: капли в подземелье звучали как в доме. Капель лежала сплошной
   записью в фоне яруса, а фон играет обычным плеером — мимо отзвука места.
   1. В фоне глубины и во втором живом слое под землёй сплошной капели нет.
   2. (4.3) И после этого игрок слышал «протечку крыши». Теперь в ярусе три
      места капели на полу, у каждого свой тон (ниже прежнего) и свой ритм.
   3. Капля звучит сверху в собственном долгом отклике свода, без отдельных
      щелчков-«отражений»; место капели не ходит за героем.
   5. Плоская запись частой капели под землёй больше не звучит ниоткуда.
   4. Наверху, в тайной палате и на ярусах пустоты капели нет.
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

 const фон=await page.evaluate(()=>{
  const было=G.place;const r={петли:[]};
  const l0=Bank.loop.bind(Bank);Bank.loop=function(ch,role,o){r.петли.push([ch,role]);return null;};
  settings.effects=1;settings.hrtf=1;
  for(const d of [1,2,3,5]){G.place={depth:d,bx:1,by:1,kind:"dungeon",stype:"ruins",x:5,y:5};try{bankUpdateAmbient();}catch(e){r.ошибка=String(e);}}
  Bank.loop=l0;G.place=было;
  r.вФоне=DEPTH_LOOP.includes("deep_drip");
  return r;});
 check('1. в фоне глубины и во втором живом слое под землёй нет сплошной капели',
  !фон.вФоне&&фон.петли.length>=4&&!фон.петли.some(([,role])=>role==="deep_drip"),фон);

 const капля=await page.evaluate(async()=>{
  const w=ms=>new Promise(res=>setTimeout(res,ms));
  const r={};
  G.place={depth:2,bx:1,by:1,kind:"dungeon",stype:"ruins",x:5,y:5};
  Room.set(null,true);r.акустика=Room.kind;
  const вызовы=[];const sa=Spatial.at.bind(Spatial);
  Spatial.at=function(path,dx,dy,o){вызовы.push({path:String(path),dx,dy,dz:o&&o.dz,wetK:o&&o.wetK,occl:o&&o.occl,rate:o&&o.rate,kind:o&&o.kind,conv:!!(o&&o.conv),t:Date.now()});return sa(path,dx,dy,o);};
  bankUpdateAmbient();r.идёт=!!Drips.timer;
  const места=Drips.place();const lvl=curLevel();
  r.мест=места.length;r.наПолу=места.every(m=>tileAt(lvl,m.x,m.y)===".");
  r.тонов=new Set(места.map(m=>m.rate.toFixed(3))).size;r.ниже=места.every(m=>m.rate<0.9);
  r.ритмы=места.map(m=>Math.round(m.период));
  const m0=места[0];
  вызовы.length=0;const t0=Date.now();
  r.капля=Drips.drop(m0);await w(900);
  const свои=вызовы.filter(x=>/waterdrop/.test(x.path));
  r.первая=свои[0];r.лишних=свои.slice(1).filter(x=>x.t-t0>200).length;
  /* герой отошёл на три шага — капель осталась на своём месте */
  G.place.x+=3;вызовы.length=0;Drips.drop(m0);
  r.сдвиг=вызовы[0]&&(r.первая.dx-вызовы[0].dx);
  G.place.x-=3;
  /* плоская частая капель под землёй больше не играет */
  const mk=Bank.make.bind(Bank);let плоско=0;Bank.make=function(f,...a){if(/drip|waterdrop/.test(String(f)))плоско++;return mk(f,...a);};
  вызовы.length=0;const el=Bank.play("deep_drip",{gain:0.5,maxSec:5});await w(2600);
  Bank.make=mk;
  r.заглушка=!!(el&&el.__drips);r.плоско=плоско;r.вместо=вызовы.filter(x=>/waterdrop/.test(x.path)&&x.conv).length;
  вызовы.length=0;const ro=Spatial.role("deep_drip",2,-3,{gain:0.3,maxSec:3});
  r.роль=ro===true&&вызовы.length>=1&&вызовы[0].conv&&вызовы[0].dx===2&&вызовы[0].dy===-3;
  Spatial.at=sa;
  return r;});
 check('2. (4.3) в ярусе три места капели на полу, у каждого свой тон — ниже прежнего — и свой ритм',
  капля.акустика==="dungeon"&&капля.идёт&&капля.мест===3&&капля.наПолу&&капля.тонов===3&&капля.ниже,капля);
 check('3. (4.3) капля — объёмный звук сверху, в долгом отклике свода (своя свёртка, отзвука больше самой капли), без отдельных щелчков-«отражений»; место капели не ходит за героем',
  капля.капля===true&&капля.первая&&капля.первая.dz>=2&&капля.первая.wetK>=3&&капля.первая.conv&&капля.первая.kind==="ambient"
  &&капля.лишних===0&&капля.сдвиг===3,капля);
 check('5. (4.3) под землёй плоской записи частой капели нет: её вызов уходит в капли свода — и из банка, и из объёмной роли',
  капля.заглушка&&капля.плоско===0&&капля.вместо>=2&&капля.роль,капля);

 const выкл=await page.evaluate(()=>{
  const r={};
  G.place=null;bankUpdateAmbient();r.наверху=!Drips.timer&&!Drips.on();
  G.place={depth:2,bx:1,by:1,kind:"dungeon",stype:"ruins",x:5,y:5,тайник:true};bankUpdateAmbient();r.палата=!Drips.timer&&!Drips.on();
  G.place={depth:70,bx:1,by:1,kind:"dungeon",stype:"ruins",x:5,y:5};bankUpdateAmbient();r.пустота=roomKind()==="d_void"&&!Drips.on();
  G.place=null;bankUpdateAmbient();
  return r;});
 check('4. наверху, в тайной палате и на ярусах пустоты капели нет',выкл.наверху&&выкл.палата&&выкл.пустота,выкл);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\n${results.filter(r=>r.startsWith('PASS')).length}/${results.length} passed`);
 await browser.close();
})();
