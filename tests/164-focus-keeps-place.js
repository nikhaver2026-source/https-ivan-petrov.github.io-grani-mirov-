/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 164: ФОКУС НЕ УБЕГАЕТ В НАЧАЛО СПИСКА

   После всякого действия выбор сбрасывался: activateElement обнулял
   uiCursor, и следующий свайп начинал список заново. В окне настроек из
   сорока с лишним пунктов это значило сорок свайпов обратно — за каждую
   снятую галочку. Ни TalkBack, ни VoiceOver так не делают: фокус остаётся
   на том, что вы нажали, а если пункт исчез — переходит на соседний, на то
   же место в списке.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Сразу после действия выбран тот же пункт, а не первый в окне.
   2. Следующий свайп идёт ОТ него, а не от начала списка.
   3. Настоящими касаниями: свайп, двойное касание по галочке, свайп —
      выбор ушёл на один пункт вперёд, а не в начало.
   4. Десять действий подряд по одному пункту не сдвигают выбор ни разу.
   5. Пункт исчез из списка — выбор встаёт на то же МЕСТО, а не в начало.
   6. Исчезнувший пункт: новый выбор называется, не перебивая ответ действия.
   7. Действие само подвинуло выбор (перескок по разделам) — возврат его не
      откатывает.
   8. Действие закрыло окно — возврат ничего не трогает и не роняет игру.
   9. Действие открыло другое окно — выбор принадлежит новому окну.
  10. Ползунок и раньше держал фокус — держит и теперь.
  11. Меню действий: выполнили пункт, меню осталось — выбор на месте.
  12. Инвентарь: список перестроился — выбор на своём месте.
  13. Ключ пункта берётся по id, команде, разделу и первым словам.
  14. README и документы описывают удержание фокуса.
  15. Сдвиг выбора слышен настоящей записью; обе новые записи — без потерь,
      44,1 кГц, и записаны в титрах своей папки с лицензией.
  16. В основном файле не осталось ничего, до чего игра не доходит: всё, что
      не зовёт сама игра, — старое и должно уйти, даже если его трогает набор
      проверок. Словари и указатели, нужные одной проверке, живут в ней.
  17. Версия игры одна и та же везде: заголовок, заставка, руководство.
  18. Служебный работник поднимает кэш страницы и не трогает кэш записей.
  19. Восемь новых ролей на месте, все записи банка существуют на диске, а
      синтезированный писк остался только запасным путём.
  20. У нового источника записей есть титры, лицензия и таблица файлов.
  21. Ни одно имя звука, которое зовёт игра, не молчит: у каждого есть
      запись в банке, и у каждого маяка есть свой голос.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const cdp=await ctx.newCDPSession(page);
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(3000);
 await page.evaluate(()=>{
  window.СЛОВА=[];const о=Speech.say.bind(Speech);
  Speech.say=function(t,x){window.СЛОВА.push([String(t).slice(0,50),!(x&&x.interrupt===false)]);return о(t,x);};});
 const ждать=ms=>page.waitForTimeout(ms);
 const сброс=()=>page.evaluate(()=>{window.СЛОВА=[];});
 const закрыть=async()=>{await page.evaluate(()=>{try{for(let i=0;i<8&&activeLayer();i++)closeTopUI();}catch(e){}});await ждать(120);};
 /* Настройки — пунктами: замер идёт в том пункте, где лежит нужная настройка;
    без довода — список пунктов. */
 const настройки=async(g)=>{await закрыть();await page.evaluate(g=>CMD.settings(g||undefined),g||null);await ждать(300);};

 /* ── 1–2. тот же пункт, и свайп идёт от него ── */
 await настройки("sound");
 const место=await page.evaluate(async()=>{
  const lay=activeLayer();
  const цель=document.getElementById("setEffects");
  setCursor(цель,false);
  const до=cursorItems(lay).indexOf(uiCursor);
  activateElement(цель);
  await new Promise(z=>setTimeout(z,250));
  const после=cursorItems(lay).indexOf(uiCursor);
  const тот=uiCursor===цель;
  swipeNav("next");
  const дальше=cursorItems(lay).indexOf(uiCursor);
  return {до,после,тот,дальше,всего:cursorItems(lay).length};});
 check('1. сразу после действия выбран тот же пункт, а не первый в окне',
  место.тот&&место.после===место.до&&место.до>2,место);
 check('2. следующий свайп идёт от него, а не от начала списка',
  место.дальше===место.до+1,место);

 /* ── 3. то же настоящими касаниями ── */
 await настройки("sound");
 const свайп1=async(x,y,dx,dy)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
  for(let i=1;i<=5;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:Math.round(x+dx*i/5),y:Math.round(y+dy*i/5),id:1}]});await ждать(22);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await ждать(170);};
 const двойное=async(x,y)=>{
  for(let k=0;k<2;k++){
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
   await ждать(70);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await ждать(k?200:120);}};
 const пальцем=await page.evaluate(()=>{const l=activeLayer();return cursorItems(l).indexOf(uiCursor);});
 for(let i=0;i<4;i++)await свайп1(195,400,0,120);
 /* Заголовок раздела — пункт со своим делом: он уводит выбор к следующему
    разделу, и это правильно. Нам нужен обычный пункт, поэтому листаем
    дальше, пока под выбором заголовок. */
 for(let i=0;i<4;i++){
  const голова=await page.evaluate(()=>!!(uiCursor&&uiCursor.classList&&uiCursor.classList.contains(SEC_CLASS)));
  if(!голова)break;
  await свайп1(195,400,0,120);}
 const доКасания=await page.evaluate(()=>{const l=activeLayer();return {i:cursorItems(l).indexOf(uiCursor),
  имя:uiCursor&&(uiCursor.id||(uiCursor.textContent||"").trim().slice(0,20))};});
 await двойное(195,640);
 await ждать(250);
 const послеКасания=await page.evaluate(()=>{const l=activeLayer();return cursorItems(l).indexOf(uiCursor);});
 await свайп1(195,400,0,120);
 const послеСвайпа=await page.evaluate(()=>{const l=activeLayer();return cursorItems(l).indexOf(uiCursor);});
 check('3. настоящими касаниями: свайп, двойное касание, свайп — выбор ушёл на один пункт вперёд, а не в начало',
  доКасания.i>0&&послеКасания===доКасания.i&&послеСвайпа===доКасания.i+1,
  {пальцем,доКасания,послеКасания,послеСвайпа});

 /* ── 4. десять действий подряд ── */
 await настройки("ui");
 const десять=await page.evaluate(async()=>{
  const lay=activeLayer();
  const цель=document.getElementById("setHaptics")||document.getElementById("setEffects");
  setCursor(цель,false);
  const до=cursorItems(lay).indexOf(uiCursor);
  const места=[];
  for(let i=0;i<10;i++){activateElement(цель);await new Promise(z=>setTimeout(z,200));
   места.push(cursorItems(lay).indexOf(uiCursor));}
  return {до,места};});
 check('4. десять действий подряд по одному пункту не сдвигают выбор ни разу',
  десять.места.every(i=>i===десять.до)&&десять.до>0,десять);

 /* ── 5–6. пункт исчез ── */
 await закрыть();
 await page.evaluate(()=>{window.ЗВУК=[];const о=UI.nat.bind(UI);
  UI.nat=function(r,g){window.ЗВУК.push(String(r));return о(r,g);};});
 const исчез=await page.evaluate(async()=>{
  /* Окно со списком, из которого пункт можно убрать: делаем своё, в слое. */
  const m=document.getElementById("modal-settings");
  const sheet=m.querySelector(".sheet");
  const блок=document.createElement("div");блок.id="пробныйСписок";
  for(let i=1;i<=5;i++){
   const b=document.createElement("button");b.type="button";b.id="проба"+i;b.textContent="Пункт "+i;
   b.addEventListener("click",()=>{b.remove();});
   блок.appendChild(b);}
  sheet.insertBefore(блок,sheet.firstChild);
  CMD.settings();await new Promise(z=>setTimeout(z,200));
  const lay=activeLayer();
  const цель=document.getElementById("проба3");
  setCursor(цель,false);
  const до=cursorItems(lay).indexOf(uiCursor);
  window.СЛОВА=[];
  activateElement(цель);
  await new Promise(z=>setTimeout(z,300));
  const все=cursorItems(lay);
  const после=все.indexOf(uiCursor);
  const имя=uiCursor&&uiCursor.id;
  const слова=window.СЛОВА.slice();
  блок.remove();
  return {до,после,имя,длина:все.length,слова,звук:window.ЗВУК.slice()};});
 check('5. пункт исчез из списка — выбор встаёт на то же место, а не в начало',
  исчез.после===исчез.до&&исчез.имя==="проба4",исчез);
 check('6. новый выбор называется, и не перебивая ответ действия',
  исчез.слова.some(([t,перебил])=>/Пункт 4/.test(t)&&перебил===false),исчез.слова);

 check('6а. сдвиг выбора слышен настоящей записью',
  исчез.звук.indexOf("ui_refocus")>=0,исчез.звук);
 {
  const cp=require('child_process');
  const роли=await page.evaluate(()=>({split:UI_BANK.ui_split||"",refocus:UI_BANK.ui_refocus||""}));
  const пробы=[роли.split,роли.refocus].map(rel=>{
   const f=path.join(__dirname,'..','sounds',rel);
   if(!rel||!fs.existsSync(f))return {rel,нет:true};
   let код="",частота="";
   try{
    код=cp.execFileSync('ffprobe',['-v','error','-show_entries','stream=codec_name,sample_rate',
     '-of','csv=p=0',f],{encoding:'utf8',timeout:20000}).trim();
   }catch(_){}
   return {rel,байт:fs.statSync(f).size,код};});
  const кредиты=fs.readFileSync(path.join(__dirname,'..','sounds','oc','CREDITS.md'),'utf8');
  check('6б. обе новые записи лежат в банке, без потерь, 44,1 кГц, и записаны в титрах папки',
   пробы.every(x=>!x.нет&&x.байт>2000&&/^flac,44100/.test(x.код))
   &&/oc_ui_confirm_01/.test(кредиты)&&/oc_ui_shift_01/.test(кредиты)
   &&/CC BY 3\.0/.test(кредиты),{пробы,вТитрах:/oc_ui_confirm_01/.test(кредиты)});
 }

 /* ── 7. действие само подвинуло выбор ── */
 await настройки("sound");
 const сам=await page.evaluate(async()=>{
  const lay=activeLayer();
  const голова=lay.querySelector("h3."+SEC_CLASS);
  setCursor(голова,false);
  const до=cursorItems(lay).indexOf(uiCursor);
  activateElement(голова);            /* secjump уводит к следующему разделу */
  await new Promise(z=>setTimeout(z,300));
  const после=cursorItems(lay).indexOf(uiCursor);
  return {до,после,имя:uiCursor&&(uiCursor.dataset.secTitle||uiCursor.id||"")};});
 check('7. действие, которое само подвинуло выбор, возвратом не откатывается',
  сам.после>сам.до,сам);

 /* ── 8–9. окно закрылось и окно сменилось ── */
 await настройки();
 const закрылось=await page.evaluate(async()=>{
  const lay=activeLayer();
  const кн=lay.querySelector('[data-cmd="close"]')||lay.querySelector("button");
  setCursor(кн,false);
  activateElement(кн);
  await new Promise(z=>setTimeout(z,300));
  return {слой:activeLayer()&&activeLayer().id,курсор:!!uiCursor};});
 check('8. действие закрыло окно — возврат ничего не трогает и игра цела',
  закрылось.слой===null&&errors.length===0,закрылось);
 await закрыть();
 const сменилось=await page.evaluate(async()=>{
  CMD.settings();await new Promise(z=>setTimeout(z,200));
  const lay=activeLayer();
  const кн=lay.querySelector('[data-cmd="gestures"]')||lay.querySelector('[data-cmd="guide"]');
  if(!кн)return {нет:true};
  setCursor(кн,false);activateElement(кн);
  await new Promise(z=>setTimeout(z,350));
  const l2=activeLayer();
  return {слой:l2&&l2.id,свой:!!(l2&&uiCursor&&l2.contains(uiCursor))||!uiCursor};});
 check('9. действие открыло другое окно — выбор принадлежит новому окну',
  !!сменилось.нет||(сменилось.слой!=="modal-settings"&&сменилось.свой),сменилось);

 /* ── 10. ползунок ── */
 await настройки("tts");
 const ползунок=await page.evaluate(async()=>{
  const lay=activeLayer();
  const el=document.getElementById("setRate");
  setCursor(el,false);
  const до=Number(el.value),место=cursorItems(lay).indexOf(uiCursor);
  activateElement(el);
  await new Promise(z=>setTimeout(z,200));
  return {до,после:Number(el.value),место,теперь:cursorItems(lay).indexOf(uiCursor),тот:uiCursor===el};});
 check('10. ползунок держит фокус и меняет значение на шаг',
  ползунок.после!==ползунок.до&&ползунок.тот&&ползунок.теперь===ползунок.место,ползунок);

 /* ── 11. меню действий ── */
 await закрыть();
 const меню=await page.evaluate(async()=>{
  openActionMenu();await new Promise(z=>setTimeout(z,250));
  const lay=activeLayer();
  const голова=lay.querySelector("h3."+SEC_CLASS);
  if(!голова)return {нет:true};
  setCursor(голова,false);
  const до=cursorItems(lay).indexOf(uiCursor);
  activateElement(голова);            /* перескок к следующему разделу меню */
  await new Promise(z=>setTimeout(z,350));
  const l2=activeLayer();
  const тут=!!(l2&&l2.id==="actionMenu");
  return {до,тут,после:тут?cursorItems(l2).indexOf(uiCursor):-2,
   свой:!!(l2&&uiCursor&&l2.contains(uiCursor))};});
 check('11. меню действий: пункт выполнен, меню осталось и выбор в нём, а не потерян',
  !!меню.нет||(меню.тут&&меню.свой&&меню.после>меню.до),меню);

 /* ── 12. инвентарь ── */
 await закрыть();
 const инв=await page.evaluate(async()=>{
  G.inv={"руда":4,"травы":3,"дерево":2,"камень":5};
  CMD.inv();await new Promise(z=>setTimeout(z,250));
  const lay=activeLayer();
  const все=cursorItems(lay);
  const цель=все[Math.min(4,все.length-1)];
  setCursor(цель,false);
  const до=cursorItems(lay).indexOf(uiCursor);
  renderInventory();                 /* список перестроился сам по себе */
  await new Promise(z=>setTimeout(z,60));
  cursorRestore(cursorMark(цель),false);
  const l2=activeLayer();
  return {до,после:l2?cursorItems(l2).indexOf(uiCursor):-2,слой:l2&&l2.id};});
 check('12. инвентарь: список перестроился — выбор остался на своём месте',
  инв.слой==="modal-inventory"&&инв.после>=0&&Math.abs(инв.после-инв.до)<=1,инв);

 /* ── 13. ключ пункта ── */
 const ключи=await page.evaluate(()=>{
  const мк=t=>{const d=document.createElement("button");d.type="button";
   if(t.id)d.id=t.id;if(t.cmd)d.dataset.cmd=t.cmd;if(t.sec)d.dataset.secTitle=t.sec;
   if(t.text)d.textContent=t.text;return cursorKey(d);};
  return [мк({id:"кнопкаА"}),мк({cmd:"settings"}),мк({sec:"Громкость"}),мк({text:"  Вынуть   оружие  "})];});
 check('13. ключ пункта берётся по id, команде, разделу и первым словам',
  ключи[0]==="#кнопкаА"&&ключи[1]==="cmd:settings"&&ключи[2]==="sec:Громкость"
  &&ключи[3]==="text:Вынуть оружие",ключи);

 /* ── 14. документы ── */
 const корень=path.join(__dirname,'..');
 const readme=fs.readFileSync(path.join(корень,'README.md'),'utf8');
 const вз=fs.readFileSync(path.join(корень,'docs','ВЗАИМОДЕЙСТВИЕ.md'),'utf8');
 check('14. README и документы описывают удержание фокуса',
  /Фокус не убегает/i.test(readme)&&/cursorRestore/.test(вз),
  {readme:/Фокус не убегает/i.test(readme),вз:/cursorRestore/.test(вз)});

 /* ── 16. в основном файле не осталось невызываемых функций ── */
 {
  /* Прежнее правило прощало объявление, если его трогал хоть один набор
     проверок. Прощение копило мёртвый груз: двадцать объявлений жили только
     потому, что их звал тест, а игрок до них не доходил никогда. Правило
     стало простым — звать должна игра. Словарь, нужный одной проверке,
     живёт в самой проверке, а не в файле, который качает игрок. */
  const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const имена=[...new Set([
   ...[...src.matchAll(/^[ \t]*function ([A-Za-zА-Яа-яёЁ_$][A-Za-zА-Яа-яёЁ0-9_$]*)\s*\(/gm)].map(m=>m[1]),
   ...[...src.matchAll(/^const ([A-ZА-ЯЁ_][A-Z0-9А-ЯЁ_]*)\s*=/gm)].map(m=>m[1])])];
  /* Один проход по всему файлу вместо двух тысяч: имя после точки — это
     свойство чужого объекта, оно объявление не оживляет. */
  const счёт=new Map();
  for(const m of src.matchAll(/(\.?)([A-Za-zА-Яа-яёЁ_$][A-Za-zА-Яа-яёЁ0-9_$]*)/g))
   if(!m[1])счёт.set(m[2],(счёт.get(m[2])||0)+1);
  const мёртвые=имена.filter(n=>(счёт.get(n)||0)<=1);
  check('16. в основном файле не осталось ничего, до чего игра не доходит',
   мёртвые.length===0,{всего:имена.length,мёртвые:мёртвые.slice(0,12)});
 }

 /* ── 17. обновление доходит до вернувшегося игрока ── */
 {
  const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const sw=fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8');
  const версии=[...src.matchAll(/Alpha (\d+\.\d+\.\d+)/g)].map(m=>m[1]);
  const одна=версии.length>=3&&new Set(версии).size===1;
  const вИгре=await page.evaluate(()=>{
   const t=(document.title.match(/Alpha (\d+\.\d+\.\d+)/)||[])[1]||"";
   const h=((document.querySelector("h1")||{}).textContent||"").match(/Alpha (\d+\.\d+\.\d+)/);
   return {заголовок:t,заставка:h?h[1]:""};});
  check('17. версия игры одна и та же во всех местах файла и на заставке',
   одна&&вИгре.заголовок===версии[0]&&вИгре.заставка===версии[0]&&версии[0]!=="2.0.1",
   {версии:[...new Set(версии)],вИгре});
  /* Кэш страницы версионируется — иначе у зашедшего без сети навсегда осталась
     бы старая игра. Кэш записей НЕ версионируется: они неизменяемы, и 226 МБ
     звука перекачивать ради новой страницы незачем. */
  check('18. служебный работник поднимает кэш страницы и не трогает кэш записей',
   Number((sw.match(/const SHELL="grani-shell-v(\d+)"/)||[])[1]||0)>=3
   &&/const MEDIA="grani-v1-media"/.test(sw)
   &&/keys\.filter\(k=>k!==SHELL&&k!==MEDIA(&&k!==VOICE)?\)/.test(sw)
   &&/sounds\//.test(sw),
   {shell:(sw.match(/const SHELL="[^"]*"/)||[])[0],media:/grani-v1-media/.test(sw)});
 }

 /* ── 19. живая запись вместо писка ── */
 {
  const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const банк=await page.evaluate(()=>Object.entries(UI_BANK).map(([k,v])=>[k,v]));
  const нет=банк.filter(([,v])=>!fs.existsSync(path.join(__dirname,'..','sounds',v))).map(([k])=>k);
  const новые=["ui_arm","rank_up","bet_back","bounty","ui_hush","ui_magic_open","cards_deal","spell_learn"];
  const пропали=новые.filter(r=>!банк.some(([k])=>k===r));
  /* Синтезированный писк остался только запасным путём — когда папки со
     звуками рядом с игрой нет. Всякий UI.blip обязан стоять под проверкой
     «не нашлась живая запись». */
  const писки=[...src.matchAll(/UI\.blip\(/g)].length;
  const подЗапасом=[...src.matchAll(/if\(!UI\.nat\([^)]*\)\)UI\.blip\(/g)].length;
  check('19. восемь новых ролей на месте, все записи банка существуют, а писк остался только запасным путём',
   нет.length===0&&пропали.length===0&&писки===подЗапасом,
   {нет,пропали,писки,подЗапасом,всего:банк.length});
  const крAB=fs.readFileSync(path.join(__dirname,'..','sounds','ab','CREDITS.md'),'utf8');
  const лицAB=fs.existsSync(path.join(__dirname,'..','sounds','ab','LICENSE-CC-BY-SA-4.0.txt'));
  check('20. у нового источника есть титры с автором, лицензией и таблицей файлов, и текст лицензии рядом',
   /Ancient Beast/.test(крAB)&&/CC BY-SA 4\.0/.test(крAB)&&/ab_hush_01/.test(крAB)
   &&/ab_spell_learn_01/.test(крAB)&&лицAB
   &&/Ancient Beast/.test(src),
   {титры:/Ancient Beast/.test(крAB),лицензия:лицAB,вИгре:/Ancient Beast/.test(src)});
 }

 /* ── 21. ни одно имя звука не молчит ── */
 {
  const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const зовут=[...new Set([
   ...[...src.matchAll(/Bank\.play\("([A-Za-zА-Яа-яё0-9_]+)"/g)].map(m=>m[1]),
   ...[...src.matchAll(/Spatial\.at\("([A-Za-zА-Яа-яё0-9_]+)"/g)].map(m=>m[1]),
   ...[...src.matchAll(/UI\.nat\("([a-z_0-9]+)"/g)].map(m=>m[1]),
   ...[...src.matchAll(/UI\.natStep\("([a-z_0-9]+)"/g)].map(m=>m[1]),
  ])];
  /* Имя, которого нет ни в одном банке, — это молчание на месте события.
     Запасной путь через || его прячет, поэтому ищем не на слух, а по имени. */
  const молчат=await page.evaluate(список=>список.filter(role=>{
   let ok=false;
   try{ok=!!(Bank.has&&Bank.has(role));}catch(_){}
   if(!ok){try{ok=!!(typeof UI_BANK!=="undefined"&&UI_BANK[role]);}catch(_){}}
   return !ok;}),зовут);
  /* И маяки: у каждого либо роль с вариантами, либо прямая запись. */
  const маяки=await page.evaluate(()=>{
   const без=[];
   const все=new Set([...Object.keys(typeof BEACON_ROLE!=="undefined"?BEACON_ROLE:{}),
                      ...Object.keys(typeof BEACON_SAMPLE!=="undefined"?BEACON_SAMPLE:{})]);
   все.forEach(id=>{
    const r=(typeof BEACON_ROLE!=="undefined")&&BEACON_ROLE[id];
    const f=(typeof BEACON_SAMPLE!=="undefined")&&BEACON_SAMPLE[id];
    if(!(r&&Bank.has(r))&&!f)без.push(id);});
   return без;});
  check('21. ни одно имя звука, которое зовёт игра, не молчит, и у каждого маяка есть голос',
   молчат.length===0&&маяки.length===0,{зовут:зовут.length,молчат,маяки});
 }


 /* ── 22. вещь мира звучит живой записью, а не нотой инструмента ──
    Папки inst, orch, mood, relic, score, folk — отдельные ноты звукового
    шрифта FluidR3_GM, снятые по одной и сжатые в 58–64 кбит/с. Оркестру там
    место: он отмечает события. Но рык твари, лязг доспеха, спуск тетивы,
    обвал кладки, гул толпы и накат волны — вещи мира, и звучать они обязаны
    живой записью. Двадцать восемь таких имён держали свою ноту, хотя живая
    запись в банке уже лежала — под именем той роли, которой она и
    принадлежит. Имена слиты с этими ролями: имя вещи исчезло, звук остался
    живым, и ни одна запись не числится в двух ролях сразу. */
 {
  const ушли=["beast_roar","beast_growl","shriek","moan_deep","serpent_horn","howl_low",
   "hiss_high","blade_ring","axe_chop","bow_release","shield_block","armor_clank",
   "spear_thrust","march_low","watch_call","rune_square","spell_bolt","charm_chiff",
   "hex_charang","pad_hex","beast_breath","crowd_cheer","dawn_birds","guard_whistle",
   "isle_market","shore_wash","collapse","stone_low"];
  const живут=["brute_roar","oc_growl","raptor_cry","wraith_moan","wyrm_dark","wolf_howl",
   "serpent_hiss","lug_sword","craft_axe","battle_bow","battle_shield","lug_clank",
   "mg_spear","throng_march","guard_shout","oc_res_rune","oc_zap","spell_light","oc_trap_magic",
   "spell_dark","lug_snarl","throng_cry","wild_birds","ad_market_sel",
   "ad_wave_rocky","stk_crash","deep_3"];
  const итог=await page.evaluate(([ушли,живут])=>{
   const ноты=/^(inst|orch|mood|relic|score|folk|depth|beast|arms|spell)\//;
   /* Слова, которые называют вещь мира, а не инструмент и не тему. */
   const вещь=/рык|рёв|визг|шипен|лязг|обвал|тетив|поступь строя|оклик|рубящ|каменная толща|гул толпы|дыхание твари|накат|свисток|рассветные птицы|звон клинка|щит принял|начертание руны|боевой разряд|стон из глубины|змеиный зов|дуновение чар|металл порчи|свист выпада|островной торг|^вой$|^порча$/i;
   const нотой=Object.keys(SOUND_BANK).filter(r=>{
    const b=SOUND_BANK[r]||{};
    return вещь.test(b.d||"")&&(b.f||[]).some(x=>ноты.test(x));});
   const записи=[];
   const мимо=живут.filter(r=>{
    const b=SOUND_BANK[r];
    if(!b||!b.f||!b.f.length)return true;
    b.f.forEach(x=>записи.push(x));
    return b.f.some(x=>ноты.test(x));});
   const разделы=(typeof BANK_GROUPS!=="undefined"?BANK_GROUPS:[])
    .reduce((a,g)=>a.concat(g.dirs||[]),[]);
   const имена=(typeof BANK_CATS!=="undefined"?Object.keys(BANK_CATS):[]);
   return {нотой,мимо,записи,
           остались:ушли.filter(r=>!!SOUND_BANK[r]),
           опустевшие:["beast","depth"].filter(d=>разделы.includes(d)||имена.includes(d))};
  },[ушли,живут]);
  /* Ушедшие имена никто больше не зовёт: иначе звук пропал бы молча. */
  const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const зовут=ушли.filter(r=>new RegExp('(Bank\\.play|Spatial\\.(at|role)|Bank\\.has)\\("'+r+'"').test(src));
  /* И самих нот на диске больше нет: пустая папка — это старьё. */
  const нетПапок=!fs.existsSync(path.join(__dirname,'..','sounds','beast'))
               &&!fs.existsSync(path.join(__dirname,'..','sounds','depth'));
  const пропали=итог.записи.filter(x=>!fs.existsSync(path.join(__dirname,'..','sounds',x)));
  check('22. вещь мира звучит живой записью, а не нотой инструмента',
   итог.нотой.length===0&&итог.мимо.length===0&&итог.остались.length===0
   &&итог.опустевшие.length===0&&зовут.length===0&&нетПапок&&пропали.length===0,
   {нотой:итог.нотой,мимо:итог.мимо,остались:итог.остались,опустевшие:итог.опустевшие,
    зовут,нетПапок,записей:итог.записи.length,пропали:пропали.slice(0,4)});
 }


 /* ── 23. у каждого рода мест свой живой фон ──
    Войдя в место, игрок слышит его: деревню — скотиной и стройкой, порт —
    волной и колоколом, кузницу — молотом. Род места без своего набора звучит
    как чистое поле, и на слух место пропадает. Проверка требует набор
    каждому роду — светлому и тёмному — и следит, чтобы ни одно имя в этих
    наборах не оказалось пустым: имя, которого нет в банке, — это молчание. */
 {
  const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const роды=[...new Set([...src.matchAll(/structure=\{type:"([a-z_]+)"/g)].map(m=>m[1])
   .concat(["fortress","burg","shrine","ossuary","pit","spire","bazaar","den","hold"]))];
  const итог=await page.evaluate(роды=>{
   const сцена=(typeof LIVE_SCENE!=="undefined")?LIVE_SCENE:{};
   const нет=роды.filter(t=>!(сцена[t]&&сцена[t].length));
   const молчат=new Set();
   const пройти=н=>(н||[]).forEach(r=>{let ok=false;try{ok=!!Bank.has(r);}catch(_){}if(!ok)молчат.add(r);});
   Object.keys(сцена).forEach(k=>пройти(сцена[k]));
   (typeof LIVE_DEEP!=="undefined"?LIVE_DEEP:[]).forEach(пройти);
   return {нет,молчат:[...молчат],мест:Object.keys(сцена).length};},роды);
  /* Фон земель лежит внутри функции — его читаем из самого файла. */
  const кусок=src.slice(src.indexOf("набор={forest:"),src.indexOf("if(!набор"));
  const земли=[...new Set([...кусок.matchAll(/"([a-z_0-9]+)"/g)].map(m=>m[1]))];
  const молчатЗемли=await page.evaluate(с=>с.filter(r=>{
   let ok=false;try{ok=!!Bank.has(r);}catch(_){}return !ok;}),земли);
  check('23. у каждого рода мест свой живой фон, и ни одно имя в нём не молчит',
   итог.нет.length===0&&итог.молчат.length===0&&молчатЗемли.length===0,
   {родов:роды.length,мест:итог.мест,земель:земли.length,
    нет:итог.нет,молчат:итог.молчат,молчатЗемли});
 }


 /* ── 24. шаг — это шаг, а не удар по тарелке ──
    Папка sounds/surf целиком была собрана из хай-хэтов ударной установки
    (сэмплы Sonic Pi hat_* и tbd_perc_*), а «шаги по камню» и «шаги стражи»
    в nat — из таблы. Их переименовали в шаги, и каждый шаг по земле звучал
    тарелкой. Правило: всякая роль, которую зовёт система шагов, лежит в
    папке настоящих записей шагов и шорохов поверхности. */
 {
  const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const итог=await page.evaluate(()=>{
   const живые=/^(tread|steps|lug|oc|mtg|deep|hero|monsters|stk)\//;
   const роли=new Set();
   [SURF_ROLE,SURF_FALLBACK,STEP_ALT,DARK_STEP_ROLE].forEach(t=>Object.values(t).forEach(r=>роли.add(r)));
   Object.values(STEP_LAYER).forEach(([r])=>роли.add(r));
   ["hero_step_metal","hero_step_leather","hero_step_cloth","hero_step_echo","stomp"].forEach(r=>роли.add(r));
   const нет=[],мимо=[];
   роли.forEach(r=>{const b=SOUND_BANK[r];
    if(!b||!b.f||!b.f.length){нет.push(r);return;}
    if(b.f.some(x=>!живые.test(x)))мимо.push(r+": "+b.f[0]);});
   return {ролей:роли.size,нет,мимо};});
  const ударные=/"(surf\/[^"]+|nat\/(step_soft|step_stone|stomp)_[^"]+)"/.test(src);
  const папки=fs.existsSync(path.join(__dirname,'..','sounds','surf'));
  check('24. шаг звучит шагом: ни одна роль шага не стоит на ударном сэмпле',
   итог.нет.length===0&&итог.мимо.length===0&&!ударные&&!папки,
   {ролей:итог.ролей,нет:итог.нет,мимо:итог.мимо,ударныеВФайле:ударные,surfНаДиске:папки});
 }

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
