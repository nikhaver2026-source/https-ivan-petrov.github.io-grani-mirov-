/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 201: КАПЕЛЬ ПОДЗЕМЕЛЬЯ ЗВУЧИТ ПОД СВОДОМ, А НЕ В ДОМЕ

   Жалоба: капли в подземелье звучали как в доме. Капель лежала сплошной
   записью в фоне яруса, а фон играет обычным плеером — мимо отзвука места.
   1. В фоне глубины и во втором живом слое под землёй сплошной капели нет.
   2. Под землёй идёт своя капель: каждая капля — объёмный звук в точке свода
      (чуть сверху), через отзвук яруса с большой долей эха, и за ней два
      поздних отражения от дальних стен — тише и глуше.
   3. Высота капель разная (скорость записи разная), точки разные.
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
  Spatial.at=function(path,dx,dy,o){вызовы.push({path:String(path),dx,dy,dz:o&&o.dz,wetK:o&&o.wetK,occl:o&&o.occl,rate:o&&o.rate,kind:o&&o.kind,t:Date.now()});return sa(path,dx,dy,o);};
  bankUpdateAmbient();r.идёт=!!Drips.timer;
  const t0=Date.now();
  r.капля=Drips.drop();await w(1100);
  const свои=вызовы.filter(x=>/waterdrop/.test(x.path));
  r.первая=свои[0];r.отражения=свои.slice(1).filter(x=>x.occl>=1).map(x=>({occl:x.occl,wetK:x.wetK,через:x.t-t0}));
  /* Десять капель — разные точки и разная высота. */
  вызовы.length=0;for(let i=0;i<10;i++)Drips.drop();await w(50);
  const первые=вызовы.filter(x=>/waterdrop/.test(x.path)&&x.occl===0);
  r.точек=new Set(первые.map(x=>x.dx+","+x.dy)).size;r.высот=new Set(первые.map(x=>x.rate.toFixed(3))).size;
  Spatial.at=sa;
  return r;});
 check('2. капля — объёмный звук чуть сверху, через отзвук подземелья с большой долей эха, и за ней поздние отражения, глуше',
  капля.акустика==="dungeon"&&капля.идёт&&капля.капля===true&&капля.первая&&капля.первая.dz>0&&капля.первая.wetK>=2&&капля.первая.kind==="ambient"
  &&капля.отражения.length>=2&&капля.отражения.every(x=>x.wetK>капля.первая.wetK&&x.через>=150),капля);
 check('3. капли падают в разных точках свода и звучат на разной высоте',капля.точек>=8&&капля.высот>=8,капля);

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
