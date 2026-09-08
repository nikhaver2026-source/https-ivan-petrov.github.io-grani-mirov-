const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780},acceptDownloads:true});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 // 1. Обрезка следов мира
 const prune=await page.evaluate(()=>{
  for(let i=0;i<9000;i++){G.marks["b"+i+":1,1"]="open";G.cleared[i+",1"]=true;G.visited[i+",2"]=1;}
  G.prayed={};for(let i=0;i<900;i++)G.prayed["p"+i]=i%3?1:G.day;
  const before={marks:Object.keys(G.marks).length,cleared:Object.keys(G.cleared).length,
   visited:Object.keys(G.visited).length,prayed:Object.keys(G.prayed).length};
  pruneState(false);
  const after={marks:Object.keys(G.marks).length,cleared:Object.keys(G.cleared).length,
   visited:Object.keys(G.visited).length,prayed:Object.keys(G.prayed).length};
  // свежайшие следы остаются
  const keptNewest=!!G.marks["b8999:1,1"];
  pruneState(true);
  const hard={marks:Object.keys(G.marks).length,cleared:Object.keys(G.cleared).length};
  return {before,after,hard,keptNewest};});
 check('следы мира обрезаются до разумного числа',
  prune.after.marks===3000&&prune.after.cleared===1500&&prune.after.visited===1500&&prune.after.prayed<=400,prune.after);
 check('обрезка оставляет самые свежие следы, а не самые старые',prune.keptNewest===true);
 check('жёсткая обрезка чистит сильнее',prune.hard.marks===600&&prune.hard.cleared===300,prune.hard);

 // 2. Провал записи слышен, а не выдаётся за успех
 const fail=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  const realSet=store.set;
  store.set=()=>false;                       // хранилище «переполнено»
  G.saveBroken=false;
  const ok=saveGame(false);
  store.set=realSet;
  Speech.say=o;
  return {ok,said,broken:G.saveBroken};});
 check('при переполнении игра честно говорит, что НЕ сохранилась',
  fail.ok===false&&fail.broken===true&&fail.said.some(t=>/НЕ сохранена|не удалось/i.test(t)),fail.said.slice(0,2));

 // 3. Вторая попытка после жёсткой обрезки
 const retry=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  const realSet=store.set;let calls=0;
  store.set=(k,v)=>{calls++;return calls>1?realSet.call(store,k,v):false;}; // первый раз не влезло
  G.saveBroken=false;
  for(let i=0;i<5000;i++)G.marks["z"+i+":1,1"]="open";
  const ok=saveGame(true);
  store.set=realSet;
  Speech.say=o;
  return {ok,calls,marks:Object.keys(G.marks).length,said};});
 check('после неудачи игра подрезает состояние и сохраняется со второй попытки',
  retry.ok===true&&retry.calls>=2&&retry.marks<=600,{попыток:retry.calls,следов:retry.marks});

 // 4. Слоты: запись, чтение, очистка
 const slots=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  G.gold=777;G.day=42;G.level=9;
  const w=saveToSlot(2);
  const m=saveMeta(store.get(slotKey(2)));
  G.gold=1;G.day=1;G.level=1;
  const r=loadFromSlot(2);
  const back={gold:G.gold,day:G.day,level:G.level};
  const empty=loadFromSlot(3);
  deleteSlot(2);
  const gone=!store.get(slotKey(2));
  Speech.say=o;
  return {w,m,back,empty,gone,said:said.slice(0,6)};});
 check('слот записывается и читается обратно',slots.w===true&&slots.back.gold===777&&slots.back.day===42&&slots.back.level===9,slots.back);
 check('в слоте видно, что за игра: день, уровень, золото, место',
  !!slots.m&&slots.m.day===42&&slots.m.level===9&&slots.m.gold===777&&!!slots.m.place,slots.m);
 check('пустой слот не грузится, очистка работает',slots.empty===false&&slots.gone===true);

 // 5. Испорченный файл не ломает игру
 const bad=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(t);
  const g0=G.gold;
  const r1=applySave("{это не json",'файл');
  const r2=applySave('{"a":1}','файл');
  const r3=applySave('[]','файл');
  Speech.say=o;
  return {r1,r2,r3,goldSafe:G.gold===g0,said};});
 check('повреждённое или чужое сохранение отклоняется, а игра остаётся целой',
  bad.r1===false&&bad.r2===false&&bad.r3===false&&bad.goldSafe===true,bad.said.slice(0,3));

 // 6. Окно сохранений собирается и все кнопки живые
 const ui=await page.evaluate(()=>{
  CMD.saves();
  const body=document.getElementById("savesBody");
  const cmds=[...body.querySelectorAll("[data-cmd]")].map(b=>b.dataset.cmd);
  const speak=[...body.querySelectorAll("[data-speak]")].length;
  const known=cmds.every(c=>typeof CMD[c.split(":")[0]]==="function");
  const open=!!activeLayer()&&activeLayer().id==="modal-saves";
  closeTopUI();
  return {cmds,known,speak,open};});
 check('окно сохранений открывается, все его кнопки известны игре',
  ui.open===true&&ui.known===true&&ui.cmds.length>=6&&ui.speak>=4,{кнопок:ui.cmds.length,озвучено:ui.speak});

 // 7. Выгрузка в файл действительно отдаёт файл
 const waitDl=page.waitForEvent('download',{timeout:9000}).catch(()=>null);
 await page.evaluate(()=>exportSaveFile());
 const d=await waitDl;
 let got=null;
 if(d){
  const fs=require('fs');const pth=await d.path();
  const txt=pth?fs.readFileSync(pth,'utf8'):"";
  let valid=false;try{const j=JSON.parse(txt);valid=typeof j.x==="number"&&typeof j.day==="number"&&typeof j.savedAt==="number";}catch(_){}
  got={name:d.suggestedFilename(),valid,bytes:txt.length};}
 check('игра выгружается в файл, и файл — настоящее сохранение',
  !!got&&got.valid===true&&/\.json$/.test(got.name||""),got);

 // 8. Файл возвращается обратно в игру
 if(got){
  const back=await page.evaluate(async()=>{
   const fs=null;return null;});
 }
 const roundtrip=await page.evaluate(async()=>{
  // тот же путь, что и при выборе файла: строка из файла проходит через applySave
  G.gold=4242;G.day=77;
  const raw=serializeSave();
  G.gold=0;G.day=1;
  const ok=applySave(raw,"файл");
  return {ok,gold:G.gold,day:G.day};});
 check('сохранение из файла возвращает игру как была',
  roundtrip.ok===true&&roundtrip.gold===4242&&roundtrip.day===77,roundtrip);

 check('ни одной ошибки страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
