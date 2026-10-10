/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 298: 14.6 — «ВЫБРОСИТЬ» СО СЧЁТОМ И ЩЕЛЧКИ ПОЛЗУНКА

   Просьбы игрока:
   — «встал на “Выбросить” — свайпом вверх или вниз выбираю, сколько
     выбросить: одну, две и так далее; так у всех вещей. В Windows —
     стрелками вправо и влево до “Выбросить”, вверх и вниз — сколько, Enter
     — подтвердить»;
   — «звук ползунка, и вверх, и вниз, не работает».
   1. Телефон: у стопки пункт «Выбросить: 1 из N»; свайп вверх — больше,
      вниз — меньше, со щелчком ползунка; двойное касание выбрасывает
      выбранное число.
   2. Windows: стрелки вправо доходят до «Выбросить», вверх и вниз — счёт,
      Enter выбрасывает столько.
   3. Одинаковые вещи в суме — одной строкой, и выбрасывается сколько
      выбрано.
   4. Щелчки ползунка и переключателя лежат в самой игре (сеть странице
      закрыта) и совпадают с записями sounds/ui; разобраны в память.
   5. Свайп по ползунку вверх и вниз — щелчок звучит сразу из памяти, а не
      новым плеером; щёлкает и переключатель.
   6. Сигналы интерфейса, которые игра звала как роль банка
      (Bank.play("ui_error")), звучат, а не молчат.
   7. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
const ROOT=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 const cdp=await ctx.newCDPSession(p);
 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:0}]});
 async function swipe(fx,fy,tx,ty){await touch('touchStart',fx,fy);for(let i=1;i<=6;i++){await touch('touchMove',fx+(tx-fx)*i/6,fy+(ty-fy)*i/6);await p.waitForTimeout(16);}await touch('touchEnd',tx,ty);await p.waitForTimeout(180);}
 async function tap(x,y){await touch('touchStart',x,y);await p.waitForTimeout(30);await touch('touchEnd',x,y);await p.waitForTimeout(60);}
 const вверх=()=>swipe(200,520,200,360),вниз=()=>swipe(200,360,200,520);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  /* narrate — константа страницы: слушаем единый обработчик речи. */
  window.СКАЗАНО=[];const e0=Speech.enqueue.bind(Speech);Speech.enqueue=function(t,o){СКАЗАНО.push(String(t));return e0(t,o);};
  window.ПОЛЗ=[];const sp=Sliders.play.bind(Sliders);Sliders.play=function(el,d){ПОЛЗ.push([+el.value,d]);return sp(el,d);};
  window.ЗАПУСК=[];const st0=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(){ЗАПУСК.push(this.buffer?+this.buffer.duration.toFixed(3):0);return st0.apply(this,arguments);};
  window.ПЛЕЕР=[];const p0=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){ПЛЕЕР.push(String(this.src).split("/").pop());return p0.apply(this,arguments);};
  window.спим=мс=>new Promise(r=>setTimeout(r,мс));});

 /* ── 1. Телефон ── */
 await p.evaluate(async()=>{G.inv["камень"]=7;CMD.inv();await спим(300);
  const row=invRow("res","камень");INV.cat=row.раздел;renderInventory();INV.sel={kind:"res",key:"камень"};
  invActions();await спим(250);
  const drop=[...document.querySelectorAll('#invActBody button')].find(b=>/^invdo:drop:/.test(b.dataset.cmd));setCursor(drop,true);ПОЛЗ.length=0;});
 const т0=await p.evaluate(()=>uiCursor&&uiCursor.textContent);
 await вверх();await вверх();const т2=await p.evaluate(()=>uiCursor&&uiCursor.textContent);
 await вниз();const т1=await p.evaluate(()=>uiCursor&&uiCursor.textContent);
 await вверх();await вверх();
 await p.evaluate(()=>{СКАЗАНО.length=0;});
 await tap(195,400);await tap(195,400);await p.waitForTimeout(500);
 const т=await p.evaluate(()=>({камня:G.inv["камень"],полз:ПОЛЗ.slice(),сказано:СКАЗАНО.filter(t=>/Выброшено/.test(t))}));
 check('1. телефон: «Выбросить: 1 из 7», свайп вверх — больше, вниз — меньше, со щелчком; двойное касание выбрасывает выбранное',
  т0==="Выбросить: 1 из 7"&&т2==="Выбросить: 3 из 7"&&т1==="Выбросить: 2 из 7"&&т.камня===3&&т.полз.length>=5
  &&т.сказано.some(s=>/камень ×4\. Осталось 3/.test(s)),{т0,т2,т1,т});

 /* ── 2. Windows ── */
 await p.evaluate(async()=>{while(activeLayer())closeTopUI();window.graniDesktop={};
  G.inv["камень"]=9;CMD.inv();await спим(300);
  const row=invRow("res","камень");INV.cat=row.раздел;renderInventory();await спим(200);
  const el=[...document.querySelectorAll('#modal-inventory [data-cmd^="invpick:res:"]')].find(b=>b.dataset.cmd==="invpick:res:"+encodeURIComponent("камень"));
  setCursor(el,true);});
 const key=async k=>{await p.keyboard.press(k);await p.waitForTimeout(120);};
 for(let i=0;i<12;i++){const id=await p.evaluate(()=>INV.kbAct&&INV.kbAct.id);if(id==="drop")break;await key("ArrowRight");}
 const наДроп=await p.evaluate(()=>({id:INV.kbAct&&INV.kbAct.id,сказано:СКАЗАНО.slice(-1)[0]||""}));
 await key("ArrowUp");await key("ArrowUp");await key("ArrowUp");await key("ArrowDown");
 const счёт=await p.evaluate(()=>({n:DropCount.n,сказано:СКАЗАНО.slice(-1)[0]||""}));
 await key("Enter");await p.waitForTimeout(400);
 const w=await p.evaluate(()=>({камня:G.inv["камень"],сказано:СКАЗАНО.filter(t=>/Выброшено/.test(t)).slice(-1)[0]||""}));
 check('2. Windows: стрелки вправо — до «Выбросить», вверх и вниз — сколько, Enter — выбросить',
  наДроп.id==="drop"&&/Выбросить: 1 из 9\. Стрелки вверх и вниз — сколько, Enter — выбросить/.test(наДроп.сказано)
  &&счёт.n===3&&/Выбросить: 3 из 9/.test(счёт.сказано)&&w.камня===6&&/камень ×3\. Осталось 6/.test(w.сказано),{наДроп,счёт,w});

 /* ── 3. Одинаковые вещи ── */
 const в=await p.evaluate(async()=>{while(activeLayer())closeTopUI();delete window.graniDesktop;
  const имя="Смоляной факел";G.items=G.items.filter(x=>x!==имя);for(let i=0;i<5;i++)G.items.push(имя);
  const строки=invAll().filter(r=>r.kind==="item"&&r.it===имя);const row=строки[0];
  DropCount.set(row.kind,row.key,2,DropCount.total(row));
  let сказано="";const a=ITEM_ACTIONS.find(x=>x.id==="drop");a.делать(row,{},t=>{сказано=t;});
  return {строк:строки.length,n:row&&row.n,осталось:G.items.filter(x=>x===имя).length,сказано};});
 check('3. одинаковые вещи в суме — одной строкой со счётом; выбрасывается выбранное число',
  в.строк===1&&в.n===5&&в.осталось===3&&/×2\. Осталось 3/.test(в.сказано),в);

 /* ── 4. Щелчки в самой игре ── */
 const з=await p.evaluate(async()=>{AE.ensure();Тик.загрузить();await спим(600);
  return {ключи:Object.keys(ТИК_ЗАПИСИ),буферы:Object.keys(Тик.buf),длины:Object.fromEntries(Object.entries(Тик.buf).map(([k,b])=>[k,+b.duration.toFixed(3)])),
   файлы:Object.fromEntries(Тик.ключи.map(k=>[k,UI_BANK[k]])),данные:Object.fromEntries(Object.entries(ТИК_ЗАПИСИ).map(([k,v])=>[k,v]))};});
 const совпадают=Object.entries(з.файлы).every(([k,f])=>з.данные[k]===fs.readFileSync(path.join(ROOT,'sounds',f)).toString('base64'));
 check('4. щелчки ползунка и переключателя — в самой игре, те же записи, что в sounds/ui, и разобраны в память',
  з.ключи.length===4&&з.буферы.length===4&&совпадают&&Object.values(з.длины).every(d=>d>0.05&&d<1),{ключи:з.ключи,буферы:з.буферы,длины:з.длины,совпадают});

 /* ── 5. Свайп по ползунку и переключатель ── */
 await p.evaluate(async()=>{while(activeLayer())closeTopUI();CMD.settings();await спим(400);
  const el=document.getElementById("setMusicVol");el.value=50;el.__был=50;setCursor(el,true);ЗАПУСК.length=0;ПЛЕЕР.length=0;Тик.журнал.length=0;});
 await вверх();await вниз();await вниз();
 const п=await p.evaluate(()=>({запуск:ЗАПУСК.slice(),плеер:ПЛЕЕР.filter(s=>/slider/.test(s)),журнал:Тик.журнал.map(x=>x[0]),значение:+document.getElementById("setMusicVol").value,длины:{up:+Тик.buf.ui_slider_up.duration.toFixed(3),down:+Тик.buf.ui_slider_down.duration.toFixed(3)}}));
 const пер=await p.evaluate(async()=>{ЗАПУСК.length=0;const ok=Звук.щелчок("ui_toggle_on",{gain:0.5});const off=Звук.щелчок("ui_toggle_off",{gain:0.5});
  return {ok,off,запуск:ЗАПУСК.slice(),длины:[+Тик.buf.ui_toggle_on.duration.toFixed(3),+Тик.buf.ui_toggle_off.duration.toFixed(3)]};});
 check('5. свайп по ползунку вверх и вниз — щелчок сразу из памяти, без нового плеера; переключатель щёлкает тоже',
  п.запуск.filter(d=>d===п.длины.up).length>=1&&п.запуск.filter(d=>d===п.длины.down).length>=2&&!п.плеер.length
  &&п.журнал.includes("ui/ui_slider_up.flac")&&п.журнал.includes("ui/ui_slider_down.flac")&&п.значение===45
  &&пер.ok&&пер.off&&пер.запуск.includes(пер.длины[0])&&пер.запуск.includes(пер.длины[1]),{п,пер});

 /* ── 6. Сигналы интерфейса, которые звали как роль банка, звучат ── */
 const с=await p.evaluate(()=>{const молчат=[];let всего=0;
  for(const k of Object.keys(UI_BANK)){if(Bank.has(k))continue;всего++;const el=Bank.play(k,{gain:0.01,maxSec:0.2});if(!el)молчат.push(k);}
  return {всего,молчат};});
 check('6. сигналы интерфейса (ошибка, успех, щелчок) звучат и через Bank.play, а не молчат',с.всего>=10&&!с.молчат.length,с);

 check('7. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
