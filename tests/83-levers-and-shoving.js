/* ════════════════════════════════════════════════════════════════════════
   НАБОР 83: РЫЧАГ И СДВИНУТЫЙ КАМЕНЬ

   Спецификация просит от подземелья не только стен и сундуков: рычаг тянут,
   камень сдвигают, и под ними что-то есть. Рычага в мире не было вовсе, а
   тяжёлое можно было только осмотреть.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Рычаг есть в подземельях и руинах; он четырёх родов, и все четыре в
      мире встречаются; род клетки постоянен.
   2. Рычаг-палата отпирает дверь сокровищницы этого яруса; рычаг-сторож
      бьёт; мёртвый честно говорит, что тяга оборвана. Дважды не тянут.
   3. «Сдвинуть» есть у статуи, натёка, костей, жернова, поленницы, ящиков и
      бочек — и нет у стола, круга и шара.
   4. Под сдвинутым тайник находится наверняка; без тайника ответ честный.
   5. Ни одно из этих действий не молчит.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);

 /* ── 1. Рычаг в мире ── */
 const рычаги=await page.evaluate(()=>{
  const где={};const рода={};
  for(const [st,d] of [["ruins",6],["ruins",0],["tavern",0]]){
   let n=0;
   for(let i=0;i<60;i++){
    const bx=200+Math.floor(H(i*13,7,5)*40000),by=200+Math.floor(H(3,i*11,6)*40000);
    G.place={kind:d?"dungeon":"house",bx,by,stype:st,name:"П",depth:d,x:1,y:1};
    const l=curLevel();if(!l)continue;
    for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
     if(tileAt(l,x,y)!=="X")continue;
     const pr=propAt(x,y);
     if(pr&&pr.id==="lever"){n++;const k=leverKind(x,y);рода[k]=(рода[k]||0)+1;}}}
   где[st+"/"+d]=n;}
  G.place={kind:"dungeon",bx:1234,by:5678,stype:"ruins",name:"П",depth:6,x:1,y:1};
  const a=leverKind(3,3),b=leverKind(3,3);
  G.place=null;
  return {где,рода,повтор:a===b,естьВещь:!!PROP_BY_ID.lever};});
 check('рычаг есть в подземельях и в руинах, а в трактире его нет',
  рычаги.естьВещь&&рычаги.где["ruins/6"]>0&&рычаги.где["ruins/0"]>0&&рычаги.где["tavern/0"]===0,рычаги);
 check('рычаг четырёх родов, все четыре встречаются, и род клетки постоянен',
  ["палата","ход","ловушка","мёртвый"].every(k=>(рычаги.рода[k]||0)>0)&&рычаги.повтор,рычаги);

 /* ── 2. Что делает рычаг ── */
 const тяга=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  const найти=(род,нуженY)=>{
   /* Смотрим ВСЕ рычаги яруса, а не первый: мёртвых четверть, и первый
      попавшийся чаще оказывается другим. */
   for(let i=0;i<400;i++){
    const bx=200+Math.floor(H(i*13,7,5)*40000),by=200+Math.floor(H(3,i*11,6)*40000);
    G.place={kind:"dungeon",bx,by,stype:"ruins",name:"П",depth:3+(i%9),x:1,y:1};
    const l=curLevel();if(!l)continue;
    let палата=false,рычаг=null;
    for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
     const t=tileAt(l,x,y);
     if(t==="Y")палата=true;
     if(t==="X"&&!рычаг){const pr=propAt(x,y);if(pr&&pr.id==="lever"&&leverKind(x,y)===род)рычаг=[x,y];}}
    if(рычаг&&(!нуженY||палата)){G.place.x=рычаг[0];G.place.y=рычаг[1];return рычаг;}}
   return null;};
  const итог={};
  /* Палата. */
  const п=найти("палата",true);
  if(п){G.marks={};G.vaults={};G.propMarks={};
   const o={плитка:"X",вещь:"lever",x:п[0],y:п[1],n:"рычаг"};
   const l=curLevel();let дверь=null;
   for(let y=0;y<l.h&&!дверь;y++)for(let x=0;x<l.w&&!дверь;x++)if(tileAt(l,x,y)==="Y")дверь=[x,y];
   const до=vaultIsOpen(дверь[0],дверь[1]);
   IACT.pull.делать(o);
   const после=vaultIsOpen(дверь[0],дверь[1]);
   const n=сказ.length;
   IACT.pull.делать(o);
   итог.палата={до,после,дважды:/уже опущен/i.test(сказ.slice(n).join(" "))};}
  /* Сторож. */
  const с=найти("ловушка",false);
  if(с){G.marks={};G.propMarks={};G.hp=G.hpMax=200;
   const o={плитка:"X",вещь:"lever",x:с[0],y:с[1],n:"рычаг"};
   const n=сказ.length;
   IACT.pull.делать(o);
   итог.сторож={ударил:G.hp<200,сказал:/не запор/i.test(сказ.slice(n).join(" "))};}
  /* Мёртвый. */
  const м=найти("мёртвый",false);
  if(м){G.propMarks={};
   const o={плитка:"X",вещь:"lever",x:м[0],y:м[1],n:"рычаг"};
   const n=сказ.length;
   IACT.pull.делать(o);
   итог.мёртвый=/оборвана|не связан/i.test(сказ.slice(n).join(" "));}
  /* Ход: либо открыл, либо честно сказал, что ход не рядом. */
  const х=найти("ход",false);
  if(х){G.propMarks={};G.marks={};
   const o={плитка:"X",вещь:"lever",x:х[0],y:х[1],n:"рычаг"};
   const n=сказ.length;
   IACT.pull.делать(o);
   итог.ход=/за ней ход|ход не рядом/i.test(сказ.slice(n).join(" "));}
  Speech.say=был;G.place=null;
  return итог;});
 check('рычаг-палата отпирает дверь сокровищницы этого яруса, и второй раз его не потянуть',
  тяга.палата&&!тяга.палата.до&&тяга.палата.после&&тяга.палата.дважды,тяга.палата);
 check('рычаг-сторож бьёт и говорит, что это был не запор',
  тяга.сторож&&тяга.сторож.ударил&&тяга.сторож.сказал,тяга.сторож);
 check('мёртвый рычаг честно говорит, что тяга оборвана',тяга.мёртвый===true,тяга);
 check('рычаг-ход открывает ход или честно говорит, что хода рядом нет',тяга.ход===true,тяга);

 /* ── 3 и 4. Сдвинуть ── */
 const сдвиг=await page.evaluate(()=>{
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"dungeon",bx:1200,by:1200,stype:"ruins",name:"Низ",depth:5,x:1,y:1};
  const есть=(вещь)=>IACT.shove.можно({плитка:"X",вещь,x:1,y:1});
  const свои=SHOVE_PROPS.filter(есть).length;
  const чужие=["table","circle","orb","bookcase","hearth"].filter(есть);
  /* Ищем тяжёлую вещь, под которой спрятан тайник. */
  let цель=null,пустая=null;
  for(let i=0;i<80&&!(цель&&пустая);i++){
   const bx=200+Math.floor(H(i*13,7,5)*40000),by=200+Math.floor(H(3,i*11,6)*40000);
   G.place={kind:"dungeon",bx,by,stype:"ruins",name:"П",depth:4,x:1,y:1};
   G.stash={};
   const l=curLevel();if(!l)continue;
   for(let y=1;y<l.h-1&&!(цель&&пустая);y++)for(let x=1;x<l.w-1&&!(цель&&пустая);x++){
    if(tileAt(l,x,y)!=="X")continue;
    const pr=propAt(x,y);
    if(!pr||SHOVE_PROPS.indexOf(pr.id)<0)continue;
    const т=stashAt(x,y);
    if(т&&!цель)цель={bx:G.place.bx,by:G.place.by,x,y,вещь:pr.id};
    if(!т&&!пустая)пустая={bx:G.place.bx,by:G.place.by,x,y,вещь:pr.id};}}
  const итог={свои,чужие};
  if(цель){
   G.place={kind:"dungeon",bx:цель.bx,by:цель.by,stype:"ruins",name:"П",depth:4,x:цель.x,y:цель.y};
   G.stash={};G.marks={};
   const o={плитка:"X",вещь:цель.вещь,x:цель.x,y:цель.y,n:"тяжесть"};
   IACT.shove.делать(o);
   итог.нашёл=stashAt(цель.x,цель.y).состояние==="найден";
}
  if(пустая){
   G.place={kind:"dungeon",bx:пустая.bx,by:пустая.by,stype:"ruins",name:"П",depth:4,x:пустая.x,y:пустая.y};
   G.stash={};G.marks={};
   const час=G.day*24+G.hour;
   const n=сказ.length;
   IACT.shove.делать({плитка:"X",вещь:пустая.вещь,x:пустая.x,y:пустая.y,n:"тяжесть"});
   итог.пусто={сказал:/голый камень|за ней открывается ход/i.test(сказ.slice(n).join(" ")),время:G.day*24+G.hour>час};}
  Speech.say=был;G.place=null;
  return итог;});
 check('«Сдвинуть» есть у семи тяжёлых вещей и нет у стола, круга, шара, шкафа и очага',
  сдвиг.свои>=7&&сдвиг.чужие.length===0,сдвиг);
 check('под сдвинутой тяжестью тайник находится наверняка',сдвиг.нашёл===true,сдвиг);
 check('без тайника сдвиг отвечает честно и стоит времени',
  сдвиг.пусто&&сдвиг.пусто.сказал&&сдвиг.пусто.время,сдвиг);

 /* ── 5. Слышно ── */
 const слышно=await page.evaluate(()=>{
  const звуки=[];const bp=Bank.play.bind(Bank);Bank.play=(r,o)=>{звуки.push(r);return bp(r,o);};
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  G.place={kind:"dungeon",bx:1300,by:1300,stype:"ruins",name:"Низ",depth:5,x:2,y:2};
  G.propMarks={};G.marks={};G.stash={};
  const немые=[];
  for(const [id,o] of [["pull",{плитка:"X",вещь:"lever",x:6,y:6,n:"рычаг"}],
   ["pull",{плитка:"X",вещь:"lever",x:6,y:6,n:"рычаг"}],
   ["shove",{плитка:"X",вещь:"statue",x:7,y:7,n:"статуя"}],
   ["shove",{плитка:"X",вещь:"statue",x:7,y:7,n:"статуя"}]]){
   const з=звуки.length,р=сказ.length;
   safeFn(()=>IACT[id].делать(o));
   if(звуки.length===з||сказ.length===р)немые.push(id);}
  Bank.play=bp;Speech.say=был;G.place=null;
  return {немые};});
 check('рычаг и сдвиг звучат и говорят всегда, и во второй раз тоже',слышно.немые.length===0,слышно);

 check('за весь набор ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));
 await browser.close();
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(results.join('\n'));
 console.log(`\nИТОГО: ${results.length-bad.length} прошло, ${bad.length} провалено.`);
 process.exit(bad.length?1:0);
})();
