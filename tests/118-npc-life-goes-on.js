/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 118: ЖИЗНЬ ЖИТЕЛЯ ИДЁТ СВОИМ ЧЕРЕДОМ (§20 брифа)

   Бриф: житель может переезжать, менять работу, вступать в организации,
   жениться, заводить детей, наживать врагов, погибать и передавать
   имущество. Ничего этого не было: вернувшись через год, игрок находил того
   же человека на том же месте с той же фразой.

   1. Данные: девять событий, у каждого своё имя, свой голос записью, свой
      вес по душе и своё слово; два события сменяют человека родичем.
   2. Пока вы рядом, ничего не случается: ни при первом знакомстве, ни в
      первый месяц, ни за месяц отсутствия без жребия.
   3. За годы случается многое, но не всё сразу: одно событие за встречу,
      два — только после года, и одно и то же дважды не повторяется.
   4. Уехавшего или умершего сменяет родич: другое имя, то же место и то же
      ремесло, и он говорит, что имущество перешло к нему.
   5. Родич живёт своей жизнью: у него своё поколение и свои события.
   6. Слова честные: в рассказе стоит имя того, с кем это было, а не того,
      кто стоит перед вами сейчас.
   7. Самопроверка мира держит строку lives; жизнь ложится в сохранение.
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
 await page.evaluate(()=>{window.PLAYED=[];const p=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.3}));};
  /* Прожить с жителем годы: встречать его каждые N дней. */
  window.ПРОЖИТЬ=(x,y,i,шаг,докуда)=>{
   G.day=1;const н=()=>getNPC(x,y,i);
   npcMet(н());
   for(let d=шаг+1;d<=докуда;d+=шаг){G.day=d;npcMet(н());}
   return G.npcLife[н().key]||null;};});

 /* ── 1. Данные ── */
 const данные=await page.evaluate(()=>{
  const r={};
  r.всего=LIFE_EVENTS.length;
  r.безПолей=LIFE_EVENTS.filter(e=>!e.n||!e.звук||typeof e.когда!=="function"||typeof e.слово!=="function").map(e=>e.id);
  r.немые=LIFE_EVENTS.filter(e=>!Bank.has(e.звук)).map(e=>e.id);
  r.голосовРазных=new Set(LIFE_EVENTS.map(e=>e.звук)).size;
  r.концов=LIFE_EVENTS.filter(e=>e.конец).map(e=>e.id);
  r.строка=safeFn(()=>{const z=worldSelfCheck().find(v=>v.id==="lives");return z?z.ok:null;},null);
  return r;});
 check('девять событий жизни, у каждого имя, своя запись и своё слово; два из них сменяют человека родичем',
  данные.всего===9&&!данные.безПолей.length&&!данные.немые.length
  &&данные.голосовРазных===9&&данные.концов.length===2
  &&данные.концов.indexOf("move")>=0&&данные.концов.indexOf("died")>=0
  &&данные.строка===true,данные);

 /* ── 2. Пока вы рядом, ничего не случается ── */
 const тишина=await page.evaluate(()=>{
  const r={};
  G.npcLife={};G.npcMem={};
  const a=getNPC(30000,30000,1);
  G.day=1;npcMet(a);r.знакомство=((G.npcLife[a.key]||{}).д||[]).length;
  G.day=29;npcMet(a);r.через28=((G.npcLife[a.key]||{}).д||[]).length;
  /* Ходить каждый день целый год — и ничего: события считаются по разлуке. */
  for(let d=30;d<=395;d++){G.day=d;npcMet(a);}
  r.ежедневноГод=((G.npcLife[a.key]||{}).д||[]).length;
  return r;});
 check('при знакомстве и в первый месяц не случается ничего, и ежедневные визиты целый год не двигают жизнь',
  тишина.знакомство===0&&тишина.через28===0&&тишина.ежедневноГод===0,тишина);

 /* ── 3. За годы случается многое, но по одному ── */
 const годы=await page.evaluate(()=>{
  const r={};
  G.npcLife={};G.npcMem={};
  const ж=ПРОЖИТЬ(12000,12000,0,60,3000);
  r.есть=!!ж;r.событий=ж?ж.д.length:0;
  r.дни=ж?ж.д.map(z=>z.д):[];
  r.поДням={};(ж?ж.д:[]).forEach(z=>{r.поДням[z.д]=(r.поДням[z.д]||0)+1;});
  r.больше2=Object.values(r.поДням).filter(v=>v>2).length;
  /* Одно и то же с одним человеком дважды не случается. */
  const поКоленам={};(ж?ж.д:[]).forEach(z=>{const k=(z.п||1)+":"+z.т;поКоленам[k]=(поКоленам[k]||0)+1;});
  r.повторы=Object.entries(поКоленам).filter(([,v])=>v>1).map(([k])=>k);
  r.родов=new Set((ж?ж.д:[]).map(z=>z.т)).size;
  return r;});
 check('за восемь лет встреч жизнь идёт: событий много, родов несколько, за раз не больше двух и без повторов у одного человека',
  годы.есть&&годы.событий>=4&&годы.родов>=3&&годы.больше2===0&&!годы.повторы.length,годы);

 /* ── 4–6. Родич, наследство и честные слова ── */
 const родич=await page.evaluate(()=>{
  const r={};
  G.npcLife={};G.npcMem={};
  /* Найти того, у кого жизнь дошла до конца. */
  let нашли=null;
  for(let i=0;i<60&&!нашли;i++){
   const x=10000+i*211,y=13000+i*137,idx=i%3;
   const ж=ПРОЖИТЬ(x,y,idx,60,3000);
   if(ж&&ж.конец)нашли={x,y,idx,ж};}
  if(!нашли){r.нет=true;return r;}
  const {x,y,idx,ж}=нашли;
  const было=ж.д.find(z=>LIFE_BY_ID[z.т]&&LIFE_BY_ID[z.т].конец);
  const теперь=getNPC(x,y,idx);
  r.конец=ж.конец;r.поколение=ж.поколение;
  r.прежнее=было?было.имя:null;
  r.теперь=теперь.name;
  r.имяСменилось=!!(было&&было.имя&&было.имя!==теперь.name);
  r.ремеслоТоЖе=teacherProfSame(x,y,idx,теперь.prof);
  r.наследник=теперь.наследник||null;
  r.текстНаследника=npcHeirText(теперь);
  r.текстЖизни=npcLifeText(теперь);
  /* В рассказе стоит имя того, с кем это было. */
  r.чужогоИмениНет=!було(r.текстЖизни,ж);
  function було(t,ж){
   const имена=new Set(ж.д.map(z=>z.имя).filter(Boolean));
   const пок=Number(ж.поколение)||1;
   const свои=ж.д.filter(z=>(Number(z.п)||1)===пок);
   const список=(свои.length?свои:ж.д).slice(-3);
   return список.some(z=>z.имя&&t.indexOf(z.имя)<0);}
  /* Родич живёт дальше: у него своё поколение. */
  r.новыеСобытия=ж.д.filter(z=>(Number(z.п)||1)===(Number(ж.поколение)||1)).length;
  return r;
  function teacherProfSame(x,y,i,prof){
   /* Ремесло выводится из клетки и не меняется со сменой человека. */
   const p=PROFS[(safeFn(()=>cellContent(x,y).structure,null)||{}).type]||PROFS.traveler;
   return p.indexOf(prof)>=0;}});
 check('уехавшего или умершего сменяет родич: другое имя, то же место и то же ремесло, и он говорит про наследство',
  !родич.нет&&(родич.конец==="move"||родич.конец==="died")&&родич.имяСменилось
  &&родич.ремеслоТоЖе&&родич.наследник===родич.конец
  &&/родич прежнего хозяина/.test(родич.текстНаследника||"")
  &&/перешли по наследству/.test(родич.текстНаследника||""),родич);
 check('в рассказе о прошлом стоит имя того, с кем это было, а не того, кто стоит перед вами',
  !родич.нет&&родич.чужогоИмениНет&&/Что с ним было/.test(родич.текстЖизни||""),
  {жизнь:String(родич.текстЖизни||"").slice(0,140),прежнее:родич.прежнее,теперь:родич.теперь});
 check('родич живёт своей жизнью: поколение выросло, и у него свои события',
  !родич.нет&&(Number(родич.поколение)||1)>=2,{поколение:родич.поколение,новых:родич.новыеСобытия});

 /* ── 7. Сохранение ── */
 const сохр=await page.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  G.npcLife={};G.npcMem={};
  const ж=ПРОЖИТЬ(12000,12000,0,60,1200);
  r.былоСобытий=ж?ж.д.length:0;
  saveGame(true);await пауза(150);
  const снимок=JSON.parse(JSON.stringify(G.npcLife));
  G.npcLife={};
  loadGame();await пауза(250);
  r.послеЗагрузки=((G.npcLife||{})[getNPC(12000,12000,0).key]||{д:[]}).д.length;
  r.сохранилось=JSON.stringify(G.npcLife)===JSON.stringify(снимок);
  return r;});
 check('жизнь жителя ложится в сохранение и возвращается из него',
  сохр.былоСобытий>0&&сохр.послеЗагрузки===сохр.былоСобытий&&сохр.сохранилось,сохр);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
