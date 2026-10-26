/* ═══════════════════════════════════════════════════════════════════════
   343 — ТИХИЙ БОЙ НЕ ГЛУШИТ ОКНА И ОТВЕТЫ НА НАЖАТИЯ (26 октября)
   Просьба игрока: «чтобы ничего не конфликтовало друг с другом… и не глючило».
   Проба журнала речи: в бою при тихом бое игрок открывал сумку — и игра
   молчала (окно, пункты, подробности, «окно закрыто» снимал фильтр
   «тихий бой»); молчал и ответ на собственное нажатие («Сбежать не вышло!»).
   Проверяется (тихий бой включён, как по умолчанию):
   1. Окно, открытое игроком в бою, называется; листание пунктов звучит;
      подробность о выбранном (пока окно открыто) — тоже; «окно закрыто» звучит.
   2. Ответ на нажатие игрока звучит: Enter без цели — «Здесь нет…»,
      попытка побега — её итог.
   3. Короткие боевые слова («Прыжок!», «Мимо!», где тварь) по-прежнему
      молчат — их передаёт звук.
   4. Фраза мира без нажатия игрока в тихом бою молчит, как прежде.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{window.__gvAuto=true;});
 await p.goto(process.argv[2]);await p.waitForTimeout(1200);
 await p.evaluate(()=>{enterGame();let k=0;while(activeLayer()&&k++<12)closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};settings.cbSpeech=0;
  const m=Object.assign({},MONSTERS.find(z=>z.id==="wolf")||MONSTERS[0],{hp:900,dmg:0,lvl:1,xp:5,gold:1});safeFn(()=>startCombat({x:G.x,y:G.y,monster:m}));
  window.__ен=[];const e0=Speech.enqueue;Speech.enqueue=function(t,o){const r=e0.apply(this,arguments);try{__ен.push({t:String(t),cat:r&&r.cat,nav:!!(o&&o.nav),st:r&&r.state,why:r&&r.причина||""});}catch(_){}return r;};});
 await p.waitForTimeout(800);
 const шаг=async(дело)=>{await p.evaluate(()=>{__ен.length=0;});await дело();await p.waitForTimeout(900);return p.evaluate(()=>__ен.slice());};
 const снят=x=>x.st==="DROPPED"&&x.why==="тихий бой";
 const откр=await шаг(()=>p.keyboard.press("i"));
 const лист=await шаг(()=>p.keyboard.press("ArrowDown"));
 const закр=await шаг(()=>p.keyboard.press("Escape"));
 const бой=await p.evaluate(()=>!!G.inCombat);
 const окно=откр.find(x=>/^Окно «/.test(x.t)),пункт=лист.find(x=>x.nav),подр=лист.find(x=>x.cat==="context"),закрыто=закр.find(x=>/закрыто/.test(x.t));
 check('1. в тихом бою окно, открытое игроком, называется; листание и подробность звучат; «окно закрыто» звучит',
  бой&&окно&&!снят(окно)&&пункт&&!снят(пункт)&&(!подр||!снят(подр))&&закрыто&&!снят(закрыто),{бой,окно,пункт,подр,закрыто});
 const вбой=()=>p.evaluate(()=>{if(G.inCombat)return;const m=Object.assign({},MONSTERS.find(z=>z.id==="wolf")||MONSTERS[0],{hp:900,dmg:0,lvl:1,xp:5,gold:1});safeFn(()=>startCombat({x:G.x,y:G.y,monster:m}));});
 await вбой();const энтер=await шаг(()=>p.keyboard.press("Enter"));
 await вбой();const побег=await шаг(()=>p.keyboard.press("Escape"));
 const ответЭ=энтер.find(x=>x.cat!=="combat"),ответыП=побег.filter(x=>x.cat!=="combat");
 check('2. ответ на нажатие игрока звучит (Enter без цели, попытка побега)',
  !!ответЭ&&!снят(ответЭ)&&ответыП.length>0&&ответыП.every(x=>!снят(x)),{ответЭ,ответыП});
 const боев=[];for(let i=0;i<6&&боев.length<2;i++){await вбой();боев.push(...(await шаг(()=>p.keyboard.press("ArrowDown"))).filter(x=>x.cat==="combat"&&!/−\d|здоровья/.test(x.t)));}
 check('3. короткие боевые слова в тихом бою молчат (их передаёт звук)',боев.length>0&&боев.every(снят),боев.slice(0,4));
 await вбой();await p.waitForTimeout(600);
 const мир=await p.evaluate(()=>{const r=Speech.enqueue("Где-то вдали воет волк.",{cat:"event",interrupt:false});return {бой:!!G.inCombat,st:r&&r.state,why:r&&r.причина};});
 check('4. фраза мира без нажатия игрока в тихом бою молчит, как прежде',мир.бой&&мир.st==="DROPPED"&&мир.why==="тихий бой",мир);
 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
