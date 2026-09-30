/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 216: 4.7 — КАЖДАЯ КЛАВИША ПО УМОЛЧАНИЮ ДЕЛАЕТ СВОЁ ДЕЛО

   Просьба игрока: проверить, что все заявленные клавиши выполняют
   назначенные им действия. Набор проходит по всей таблице KB_ACTIONS и
   нажимает каждое сочетание по умолчанию (оба, если их два) в своём
   положении — на поле или в бою — и смотрит, что случилось именно то
   действие: открылось своё окно, сработал свой ход жеста, свой удар, своё
   заклинание. Тот же проход (tests/216-all-default-keys.js, функция
   ПРОХОД) запускается и внутри приложения для Windows настоящими нажатиями
   (desktop/keycheck.js).

   Плюс — сохранение там, где стоит герой: сдвинулся по ярусу подземелья —
   через три секунды это уже в сохранении.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
/* Подготовка страницы: записи о том, что сработало. Окна открываются по-настоящему. */
const ПОДГОТОВКА=`(()=>{
 window.maybeEvent=()=>{};
 window.__rec=[];const R=t=>__rec.push(t);
 GEST_ACTIONS.forEach(a=>{if(a.__w)return;const f=a.делать;a.делать=function(){R("g:"+a.id);return f.apply(this,arguments);};a.__w=1;});
 window.fieldInteract=function(){R("interact");};
 window.drinkPotion=function(){R("potion");};
 window.fight=function(x){R("fight:"+x);};
 window.saveGame=function(){R("save");return true;};
 window.loadGame=function(){R("load");};
 window.exitGame=function(){R("exit");};
 window.castSpell=function(i){R("cast:"+i);};
 const st=Speech.status.bind(Speech);Speech.status=function(){R("speechstatus");};
 const kh=window.keyHelpText;window.keyHelpText=function(){R("keyhelp");return kh.apply(this,arguments);};
 return true;})()`;
/* Что ждём от действия. */
const ЖДЁМ=`(id)=>{
 const окна={inv:"modal-inventory",map:"modal-map",journal:"modal-quests",quests:null,char:null,craft:null,magic:"magicPanel",actions:"actionMenu",
  world:null,faction:null,news:null,rumours:null,politics:null,guide:"guideOverlay",settings:"modal-settings",enc:null,best:null,saves:null};
 if(id in окна)return {g:"g:"+id,окно:окна[id]};
 const свои={interact:"interact",potion:"potion",keyhelp:"keyhelp",quicksave:"save",quickload:"load",exit:"exit",speechstatus:"speechstatus",
  c_attack:"fight:atk",c_cast:"fight:magic",c_flee:"fight:flee",c_foe:null,c_self:null};
 if(id in свои)return {r:свои[id]};
 const m=/^slot(\\d+)$/.exec(id);if(m)return {r:"cast:"+(Number(m[1])-1)};
 return {g:"g:"+id};}`;
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await browser.newContext()).newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();});
 await page.evaluate(ПОДГОТОВКА);
 const список=await page.evaluate(()=>KB_ACTIONS.filter(a=>a.run).map(a=>({id:a.id,ctx:a.ctx,combos:keyCombosOf(a.id)})));
 const плохие=[];let нажатий=0;
 for(const a of список){
  for(const combo of a.combos){
   const parts=combo.split("+");const code=parts.pop();
   const mods={ctrlKey:parts.includes("Ctrl"),altKey:parts.includes("Alt"),shiftKey:parts.includes("Shift")};
   const r=await page.evaluate(([id,ctx,code,mods,ЖДЁМs])=>{
    const ЖДЁМ=eval(ЖДЁМs);
    while(activeLayer())closeTopUI();
    __rec.length=0;
    if(ctx==="combat"){G.inCombat=true;G.combat={m:{n:"волк",hp:10},hp:10};}else{G.inCombat=false;G.combat=null;}
    G.items=(G.items||[]).filter(x=>!/зель/i.test(x));if(id==="potion")G.items.push("Зелье здоровья");
    const key=code.startsWith("Key")?code.slice(3).toLowerCase():code.startsWith("Digit")?code.slice(5):code==="Space"?" ":code;
    document.dispatchEvent(new KeyboardEvent("keydown",Object.assign({code,key,bubbles:true,cancelable:true},mods)));
    const ж=ЖДЁМ(id);const слой=activeLayer();
    let ok=true,why="";
    if(ж.g&&!__rec.includes(ж.g)){ok=false;why="не сработал "+ж.g;}
    if(ж.r&&!__rec.includes(ж.r)){ok=false;why="не сработал "+ж.r;}
    if(ж.окно){const el=document.getElementById(ж.окно);if(!el||el.hidden){ok=false;why+=" окно "+ж.окно+" не открылось";}}
    if(ж.g===undefined&&ж.r===undefined&&!__rec.length&&!/^c_(foe|self)$/.test(id)){ok=false;why="ничего";}
    const rec=__rec.slice();
    G.inCombat=false;G.combat=null;
    while(activeLayer())closeTopUI();
    return {ok,why,rec,слой:слой&&слой.id};},[a.id,a.ctx,code,mods,ЖДЁМ]);
   нажатий++;
   if(!r.ok)плохие.push({id:a.id,combo,why:r.why,rec:r.rec});
  }}
 /* ходьба и бег: стрелки и WASD, с Shift — бег */
 const ходьба=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();G.inCombat=false;G.combat=null;G.weaponDrawn=false;
  const шаги=[];const m0=window.move;window.move=function(d){шаги.push(d);return true;};
  const out=[];
  KB_ACTIONS.filter(a=>a.ctx==="move").forEach(a=>keyCombosOf(a.id).forEach(combo=>{
   const key=combo.startsWith("Key")?combo.slice(3).toLowerCase():combo;
   шаги.length=0;
   document.dispatchEvent(new KeyboardEvent("keydown",{code:combo,key,bubbles:true,cancelable:true}));
   const шаг=шаги[0]===a.dir;
   шаги.length=0;
   document.dispatchEvent(new KeyboardEvent("keydown",{code:combo,key,shiftKey:true,bubbles:true,cancelable:true}));
   const бег=runState.active&&runState.dir===a.dir;
   document.dispatchEvent(new KeyboardEvent("keyup",{code:combo,key,bubbles:true}));
   const стоп=!runState.active;
   out.push({id:a.id,combo,шаг,бег,стоп});}));
  window.move=m0;return out;});
 const плохиеШаги=ходьба.filter(x=>!(x.шаг&&x.бег&&x.стоп));
 нажатий+=ходьба.length*2;
 check(`1. все клавиши по умолчанию делают своё дело (${нажатий} нажатий, ${список.length+4} действий)`,плохие.length===0&&!плохиеШаги.length&&нажатий>=70,{плохие:плохие.slice(0,10),плохиеШаги});

 /* ── 2. сохранение там, где стоит герой ── */
 const место=await page.evaluate(async()=>{
  location.hash="";const s0=window.saveGame;
  let found=null;for(let d=1;d<200&&!found;d++)for(let dx=-d;dx<=d&&!found;dx++)for(const dy of [-d,d]){const x=G.x+dx,y=G.y+dy;const c=cellContent(x,y);if(c.structure&&PLACE_KIND[c.structure.type]==="dungeon"){found={x,y};break;}}
  return {found:!!found};});
 await page.reload();await page.waitForTimeout(900);
 const сохр=await page.evaluate(async()=>{
  try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  let found=null;for(let d=1;d<200&&!found;d++)for(let dx=-d;dx<=d&&!found;dx++)for(const dy of [-d,d]){const x=G.x+dx,y=G.y+dy;const c=cellContent(x,y);if(c.structure&&PLACE_KIND[c.structure.type]==="dungeon"){found={x,y};break;}}
  G.x=found.x;G.y=found.y;enterPlace(cellContent(found.x,found.y));
  await new Promise(z=>setTimeout(z,3300));
  const было={x:G.place.x,y:G.place.y};
  for(const dir of ["E","S","W","N","E","E","S"]){move(dir);await new Promise(z=>setTimeout(z,300));}
  const стало={x:G.place.x,y:G.place.y,d:G.place.depth};
  await new Promise(z=>setTimeout(z,3300));
  const raw=JSON.parse(store.get(SAVE_KEY)||"{}");
  return {было,стало,вСохранении:raw.place&&{x:raw.place.x,y:raw.place.y,d:raw.place.depth}};});
 await page.reload();await page.waitForTimeout(900);
 const загрузка=await page.evaluate(async()=>{loadGame();await new Promise(z=>setTimeout(z,1200));return G.place&&{x:G.place.x,y:G.place.y,d:G.place.depth};});
 check('2. герой сохраняется там, где стоит: шаги по ярусу подземелья сами попадают в сохранение, и загрузка ставит туда же',
  !!сохр.вСохранении&&сохр.вСохранении.x===сохр.стало.x&&сохр.вСохранении.y===сохр.стало.y&&загрузка&&загрузка.x===сохр.стало.x&&загрузка.y===сохр.стало.y&&загрузка.d===сохр.стало.d,
  {сохр,загрузка});

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
