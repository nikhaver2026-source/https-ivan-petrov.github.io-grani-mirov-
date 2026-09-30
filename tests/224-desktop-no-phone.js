/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 224: ПРИЛОЖЕНИЕ ДЛЯ WINDOWS — БЕЗ ТЕЛЕФОННОГО, ДЕЙСТВИЯ С ВЕЩЬЮ С КЛАВИАТУРЫ

   Страница открывается так, как её открывает приложение (есть graniDesktop).
   1. В настройках нет разделов жестов, точности касаний, ощупывания и
      вибрации; пункт «Управление» назван «Клавиши», раздел «Клавиатура» есть.
   2. В руководстве нет глав о жестах и точности касаний.
   3. Каждый пункт настроек открывается без ошибок.
   4. В разделе инвентаря Enter на вещи открывает «Действия с вещью»,
      клавиша действия — тоже; пробел читает карточку; подсказка говорит
      про Enter, а не про свайп.
   5. В браузере (без graniDesktop) всё телефонное на месте.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,600):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext();
 await ctx.addInitScript(()=>{window.graniDesktop={version:'6.0',platform:'win32',quit(){}};});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(1200);
 await page.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.SAID=[];const n0=Speech.say.bind(Speech);Speech.say=(t,...a)=>{SAID.push(String(t));return n0(t,...a);};});

 const н=await page.evaluate(()=>{
  const gest=document.querySelector('.set-group[data-set-group="gest"]');
  const скрыт=id=>{const i=document.getElementById(id);const l=i&&i.closest("label");return !l||l.hidden;};
  return {разделы:[...gest.querySelectorAll('.sec-head')].map(h=>h.textContent.trim()),
   нетЖестов:!document.getElementById("gestRow")&&!document.getElementById("gestCombatRow")&&!document.getElementById("setGestSens")&&!document.getElementById("setTapWindow"),
   ощупывание:скрыт("setExplore"),вибрация:скрыт("setHaptics"),пункт:SET_GROUP_BY_ID.gest.n,
   клавиши:!!document.getElementById("keyRow"),
   чтец:(document.getElementById("setSrMode").closest("label").textContent||"").slice(0,60)};});
 check('1. в настройках нет жестов, точности касаний, ощупывания и вибрации; пункт «Клавиши» с клавиатурой',
  н.разделы.join()==="Клавиатура"&&н.нетЖестов&&н.ощупывание&&н.вибрация&&н.пункт==="Клавиши"&&н.клавиши&&!/VoiceOver|TalkBack/.test(н.чтец),н);

 const г=await page.evaluate(()=>({жесты:GUIDE_SECS.some(x=>/^Жесты$/.test(x.t)),точность:GUIDE_SECS.some(x=>/^Точность жестов/.test(x.t)),
  клавиши:GUIDE_SECS.some(x=>/клавиш/i.test(x.t)),глав:GUIDE.length}));
 check('2. в руководстве нет глав о жестах и точности касаний, глава о клавишах есть',!г.жесты&&!г.точность&&г.клавиши,г);

 const о=await page.evaluate(()=>{const было=[];
  openModal("modal-settings");
  SET_GROUPS.forEach(g=>{try{setGroupOpen(g.id,false);было.push(g.id+":"+setGroupCount(g.id));setShowMenu(null,false);}catch(e){было.push(g.id+"!"+e);}});
  while(activeLayer())closeTopUI();return было;});
 check('3. каждый пункт настроек открывается, и в нём есть что настроить',о.every(x=>/:\d+$/.test(x)&&!/:0$/.test(x)),о);

 const и=await page.evaluate(()=>{
  normalizeWeaponState();CMD.inv();
  const cats=[...document.querySelectorAll('#modal-inventory [data-cmd^="invcat:"]')];
  const cat=cats.find(b=>/оруж/i.test(b.textContent)&&!b.classList.contains("empty"))||cats.find(b=>!b.classList.contains("empty"));
  activateElement(cat);const it=document.querySelector('#modal-inventory [data-cmd^="invpick:"]');setCursor(it,true);
  return {вещь:it&&it.textContent.trim(),подсказка:it&&it.dataset.speak};});
 await page.keyboard.press('Enter');await page.waitForTimeout(300);
 const д1=await page.evaluate(()=>({окно:activeLayer()&&activeLayer().id,дела:[...document.querySelectorAll('#invActBody [data-cmd^="invdo:"]')].length}));
 await page.evaluate(()=>{closeTopUI();const it=document.querySelector('#modal-inventory [data-cmd^="invpick:"]');setCursor(it,true);SAID.length=0;});
 await page.keyboard.press('e');await page.waitForTimeout(300);
 const д2=await page.evaluate(()=>({окно:activeLayer()&&activeLayer().id}));
 await page.evaluate(()=>{closeTopUI();const it=document.querySelector('#modal-inventory [data-cmd^="invpick:"]');setCursor(it,true);SAID.length=0;});
 await page.keyboard.press(' ');await page.waitForTimeout(300);
 const д3=await page.evaluate(()=>({окно:activeLayer()&&activeLayer().id,сказано:SAID.join(" ").slice(0,120)}));
 check('4. в разделе инвентаря Enter и клавиша действия открывают «Действия с вещью», пробел читает карточку; подсказка про Enter',
  д1.окно==="modal-invact"&&д1.дела>0&&д2.окно==="modal-invact"&&д3.окно==="modal-inventory"&&д3.сказано.length>5&&/Enter — действия/.test(и.подсказка||""),{и,д1,д2,д3});

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));

 /* ── 5: браузер без приложения ── */
 const p2=await (await browser.newContext()).newPage();
 await p2.goto(process.argv[2]);await p2.waitForTimeout(1200);
 const веб=await p2.evaluate(()=>({разделы:[...document.querySelectorAll('.set-group[data-set-group="gest"] .sec-head')].map(h=>h.textContent.trim()),
  жесты:GUIDE_SECS.some(x=>/^Жесты$/.test(x.t)),пункт:SET_GROUP_BY_ID.gest.n}));
 check('5. в браузере жесты, точность касаний и глава «Жесты» на месте',веб.разделы.length===4&&веб.жесты&&веб.пункт==="Управление",веб);
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
