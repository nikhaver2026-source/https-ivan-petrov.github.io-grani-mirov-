/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 180: ЧУВСТВИТЕЛЬНОСТЬ ЖЕСТОВ — ОТ САМОЙ МЯГКОЙ ДО САМОЙ СТРОГОЙ

   Просьба игрока: по умолчанию — средняя чувствительность; в настройках —
   пункт, который меняет её от самой мягкой до самой строгой, и он работает.
   Прежде пункт звался «Чуткость жестов», ступени — «очень чуткие … очень
   спокойные», и по названию было не понять, в какую сторону сдвигается рука.

   ЧТО ПРОВЕРЯЕТСЯ.
   1. Новый игрок получает среднюю ступень; игравший раньше — один раз тоже
      среднюю, а выбранное после этого не трогается.
   2. Пункт «Чувствительность жестов» стоит в разделе «Жесты»; пять ступеней
      идут от самой мягкой до самой строгой, и порог свайпа по этому порядку
      только уменьшается.
   3. Двойное касание по пункту переводит на следующую ступень, называет её
      с порогом и запоминает.
   4. Настоящими касаниями: на самой мягкой ведение пальцем на 45 пикселей
      ещё не свайп, на самой строгой ведение на 30 пикселей — уже свайп.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const errors=[];
 const открыть=async(сохранено)=>{
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(о=>{try{if(о)localStorage.setItem("gm29set",JSON.stringify(о));else localStorage.removeItem("gm29set");}catch(_){}},сохранено);
  await page.goto(process.argv[2]);await page.waitForTimeout(800);
  return page;};

 /* ── 1. умолчание и перенос ── */
 const состояние=p=>p.evaluate(()=>({ступень:settings.gestSens,v:settings.gestSensV,
  вПамяти:(JSON.parse(localStorage.getItem("gm29set")||"{}")||{}).gestSens}));
 let p=await открыть(null);const новый=await состояние(p);await p.close();
 p=await открыть({rate:5,rateFast:1,gestSens:"vhigh"});const старый=await состояние(p);await p.close();
 p=await открыть({rate:5,rateFast:1,gestSens:"vcalm",gestSensV:1});const выбрал=await состояние(p);await p.close();
 check('1. новый игрок получает среднюю ступень',новый.ступень==="norm"&&новый.v===1,новый);
 check('1б. игравший раньше один раз получает среднюю, и она ложится в сохранение',
  старый.ступень==="norm"&&старый.вПамяти==="norm"&&старый.v===1,старый);
 check('1в. выбранное игроком после этого не трогается',выбрал.ступень==="vcalm",выбрал);

 /* ── 2–3. пункт настроек ── */
 const page=await открыть(null);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(_){}});
 await page.waitForTimeout(600);
 const пункт=await page.evaluate(()=>{
  CMD.settings("gest");
  const sel=document.getElementById("setGestSens");
  const порядок=[...sel.options].map(o=>o.value);
  const пороги=порядок.map(id=>{settings.gestSens=id;return gestSwipePx();});
  settings.gestSens="norm";
  const группа=sel.closest(".set-group");
  return {раздел:группа&&группа.dataset.setGroup,видно:!!sel.offsetParent,порядок,пороги,
   первая:sel.options[0].textContent,последняя:sel.options[sel.options.length-1].textContent,
   значение:sel.value,имя:sel.getAttribute("aria-label")};});
 check('2. пункт «Чувствительность жестов» стоит в разделе «Жесты» и виден',
  пункт.раздел==="gest"&&пункт.видно&&/Чувствительность жестов/.test(пункт.имя)&&пункт.значение==="norm",пункт);
 check('2б. пять ступеней от самой мягкой до самой строгой, порог свайпа по порядку только уменьшается',
  пункт.порядок.join()==="vcalm,calm,norm,high,vhigh"&&/Самая мягкая/.test(пункт.первая)&&/Самая строгая/.test(пункт.последняя)
  &&пункт.пороги.every((v,i)=>i===0||v<пункт.пороги[i-1])&&пункт.пороги[0]===68&&пункт.пороги[2]===38&&пункт.пороги[4]===24,пункт);

 const шаги=await page.evaluate(()=>{
  const сказано=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{сказано.push(String(t));return s0(t,o);};
  const sel=document.getElementById("setGestSens");setCursor(sel,false);
  const путь=[];
  for(let i=0;i<5;i++){сказано.length=0;stepControl(sel);
   путь.push({ступень:settings.gestSens,порог:gestSwipePx(),сказано:сказано.join(" ").slice(0,400),
    вПамяти:(JSON.parse(localStorage.getItem("gm29set")||"{}")||{}).gestSens});}
  Speech.say=s0;return путь;});
 check('3. двойное касание по пункту ведёт по ступеням по кругу: строгая, самая строгая, самая мягкая, мягкая, средняя',
  шаги.map(x=>x.ступень).join()==="high,vhigh,vcalm,calm,norm",шаги.map(x=>x.ступень));
 check('3б. каждая ступень называется с порогом и запоминается',
  шаги.every(x=>/Чувствительность жестов/.test(x.сказано)&&/пиксел/.test(x.сказано)&&x.вПамяти===x.ступень),шаги);

 /* ── 4. настоящие касания ── */
 await page.evaluate(()=>{while(activeLayer())closeTopUI();
  window.__ходы=[];const было=window.move;window.move=function(d){window.__ходы.push(d);};window.__было=было;});
 const вести=async(dx)=>{
  const x=150,y=430;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  for(let i=1;i<=4;i++){await page.waitForTimeout(25);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+Math.round(dx*i/4),y,id:0}]});}
  await page.waitForTimeout(25);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(900);};
 const ходов=()=>page.evaluate(()=>window.__ходы.length);
 await page.evaluate(()=>gestSensSet("vcalm"));
 await вести(45);const мягко45=await ходов();
 await вести(90);const мягко90=await ходов();
 await page.evaluate(()=>{gestSensSet("vhigh");window.__ходы.length=0;});
 await вести(30);const строго30=await ходов();
 await page.evaluate(()=>{gestSensSet("norm");window.__ходы.length=0;});
 await вести(30);const средне30=await ходов();
 await вести(60);const средне60=await ходов();
 await page.evaluate(()=>{window.move=window.__было;});
 check('4. на самой мягкой ведение на 45 пикселей ещё не свайп, на 90 — свайп',мягко45===0&&мягко90===1,{мягко45,мягко90});
 check('4б. на самой строгой ведение на 30 пикселей — уже свайп',строго30===1,строго30);
 check('4в. на средней 30 пикселей — не свайп, 60 — свайп',средне30===0&&средне60===1,{средне30,средне60});

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
