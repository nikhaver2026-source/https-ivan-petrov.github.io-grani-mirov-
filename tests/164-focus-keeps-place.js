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
  16. В основном файле не осталось ни одной невызываемой функции: всё, что
      не зовёт ни игра, ни один набор проверок, — старое и должно уйти.
  17. Версия игры одна и та же везде: заголовок, заставка, руководство.
  18. Служебный работник поднимает кэш страницы и не трогает кэш записей.
  19. Восемь новых ролей на месте, все записи банка существуют на диске, а
      синтезированный писк остался только запасным путём.
  20. У нового источника записей есть титры, лицензия и таблица файлов.
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
 const настройки=async()=>{await закрыть();await page.evaluate(()=>CMD.settings());await ждать(300);};

 /* ── 1–2. тот же пункт, и свайп идёт от него ── */
 await настройки();
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
 await настройки();
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
 await настройки();
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
 await настройки();
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
 await настройки();
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
  const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
  const тесты=fs.readdirSync(__dirname).filter(f=>/\.js$/.test(f))
   .map(f=>fs.readFileSync(path.join(__dirname,f),'utf8')).join('\n');
  const имена=[...new Set([...src.matchAll(/^[ \t]*function ([A-Za-zА-Яа-яёЁ_$][A-Za-zА-Яа-яёЁ0-9_$]*)\s*\(/gm)].map(m=>m[1]))];
  const мёртвые=имена.filter(n=>{
   const re=new RegExp('(?<![A-Za-zА-Яа-яёЁ0-9_$.])'+n.replace(/[$]/g,'\\$&')+'(?![A-Za-zА-Яа-яёЁ0-9_$])','g');
   const вИгре=(src.match(re)||[]).length;
   if(вИгре>1)return false;              /* кто-то её зовёт */
   return !(тесты.match(re)||[]).length; /* и ни один набор её не трогает */
  });
  check('16. в основном файле не осталось ни одной невызываемой функции',
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
   /const SHELL="grani-shell-v2"/.test(sw)&&/const MEDIA="grani-v1-media"/.test(sw)
   &&/keys\.filter\(k=>k!==SHELL&&k!==MEDIA\)/.test(sw)
   &&/sounds\//.test(sw),
   {shell:/grani-shell-v2/.test(sw),media:/grani-v1-media/.test(sw)});
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

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
