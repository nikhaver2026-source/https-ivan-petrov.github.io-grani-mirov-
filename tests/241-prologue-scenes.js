/* ════════════════════════════════════════════════════════════════════════
   НАБОР 241: ПРОЛОГ ПО СЦЕНАМ (9.0)

   Просьба игрока: пролог листается свайпами вправо и влево, пропускается
   свайпом одним пальцем вверх (кнопка — на крайний случай); он длиннее и
   живее, связывает наш мир, начало, мифы о богах и появление героя; у сцен
   свои звуки по сторонам; голоса — для будущей записи.
   1. Сцен восемь; в тексте — наш мир, боги, Предтечи, державы, герой; у
      каждой сцены фон и не меньше четырёх звуков, все есть в банке, и они
      расставлены по сторонам (есть и слева, и справа).
   2. У персонажей пролога свои голоса; у каждой строки свой ключ записи.
   3. Свайп одним пальцем вправо — следующая сцена, влево — назад, вниз —
      повторить; звуки прежней сцены гаснут.
   4. Стрелки на компьютере делают то же.
   5. Свайп одним пальцем вверх пропускает пролог: игрок в мире, звуки пролога
      остановлены. Escape тоже пропускает.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d).slice(0,700)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 const cdp=await ctx.newCDPSession(page);
 async function swipe(dx,dy){
  const x=195,y=420,steps=6;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  for(let k=1;k<=steps;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*k/steps,y:y+dy*k/steps,id:0}]});await page.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(300);}

 /* ── 1–2 ── */
 const данные=await page.evaluate(()=>{const r={};
  r.сцен=PROLOGUE.length;
  const весь=PROLOGUE.map((s,i)=>Prologue.текст(i).join(" ")).join(" ");
  r.нашМир=/машины/.test(весь)&&/асфальт/.test(весь);r.боги=/богов двенадцать/.test(весь)&&/Мортана/.test(весь)&&/Морах/.test(весь);
  r.предтечи=/Предтечи/.test(весь);r.державы=/державы/.test(весь);r.герой=/Ты очнулся/.test(весь)&&/Неизбранными/.test(весь);
  r.звуки=PROLOGUE.map(s=>(s.звуки||[]).length);r.фон=PROLOGUE.every(s=>s.фон&&Bank.has(s.фон[0]));
  r.нетВБанке=[].concat(...PROLOGUE.map(s=>(s.звуки||[]).map(z=>z[1]))).filter(x=>!Bank.has(x));
  r.слева=PROLOGUE.every(s=>s.звуки.some(z=>z[2]<0));r.справа=PROLOGUE.every(s=>s.звуки.some(z=>z[2]>0));
  const кто=[].concat(...PROLOGUE.map(s=>s.строки.filter(x=>typeof x!=="string").map(x=>x.кто)));
  r.персонажи=[...new Set(кто)];r.безГолоса=r.персонажи.filter(k=>!PROLOGUE_CAST[k]||!PROLOGUE_CAST[k].голос);
  const ключи=[].concat(...PROLOGUE.map((s,i)=>s.строки.map((_,k)=>Prologue.ключ(i,k))));r.ключей=ключи.length;r.ключиРазные=new Set(ключи).size===ключи.length;
  return r;});
 check('1. восемь сцен: наш мир, боги, Предтечи, державы, пробуждение героя; у каждой фон и звуки по сторонам из банка',
  данные.сцен===8&&данные.нашМир&&данные.боги&&данные.предтечи&&данные.державы&&данные.герой&&данные.фон&&данные.звуки.every(n=>n>=4)&&!данные.нетВБанке.length&&данные.слева&&данные.справа,данные);
 check('2. у персонажей пролога свои голоса, у каждой строки свой ключ записи',данные.персонажи.length>=4&&!данные.безГолоса.length&&данные.ключиРазные,данные);

 /* ── 3 ── */
 await page.evaluate(()=>{window.__fx=[];const z=Prologue.звук.bind(Prologue);Prologue.звук=(r,dx,dy,g,s)=>{window.__fx.push([Prologue.i,r,dx]);return z(r,dx,dy,g,s);};
  window.__said=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{const m=o(t,x);window.__said.push(String(t));return m;};
  startIntro();});
 await page.waitForTimeout(700);
 const ж0=await page.evaluate(()=>({i:Prologue.i,активен:Prologue.active(),заголовок:document.querySelector("#prose h3").textContent,сказано:__said.slice(0,2)}));
 await swipe(160,0);const ж1=await page.evaluate(()=>({i:Prologue.i,заголовок:document.querySelector("#prose h3").textContent}));
 await swipe(160,0);await swipe(-160,0);const ж2=await page.evaluate(()=>Prologue.i);
 await page.evaluate(()=>{window.__said.length=0;});await swipe(0,160);
 const ж3=await page.evaluate(()=>({i:Prologue.i,сказано:__said.slice(0,4)}));
 await page.waitForTimeout(3500);
 const ж4=await page.evaluate(()=>({fx:__fx.filter(x=>x[0]===Prologue.i).length,чужие:__fx.filter(x=>x[0]!==Prologue.i&&x[0]!==0).length}));
 check('3. свайп вправо — дальше, влево — назад, вниз — повторить; звучат звуки своей сцены',
  ж0.i===0&&ж0.активен&&/Сцена 1 из 8/.test(ж0.заголовок)&&ж0.сказано.some(t=>/Свайп вправо — дальше/.test(t))
  &&ж1.i===1&&/Сцена 2 из 8/.test(ж1.заголовок)&&ж2===1&&ж3.i===1&&ж3.сказано.some(t=>/^Сцена 2 из 8/.test(t))&&ж4.fx>=2,{ж0,ж1,ж2,ж3,ж4});

 /* ── 4 ── */
 const кл=await page.evaluate(()=>{const жми=k=>document.dispatchEvent(new KeyboardEvent("keydown",{key:k,code:k,bubbles:true,cancelable:true}));
  const r={};жми("ArrowRight");r.вправо=Prologue.i;жми("ArrowLeft");r.влево=Prologue.i;жми("ArrowRight");жми("ArrowRight");r.ещё=Prologue.i;return r;});
 check('4. стрелки вправо и влево листают сцены',кл.вправо===2&&кл.влево===1&&кл.ещё===3,кл);

 /* ── 5 ── */
 await swipe(0,-160);
 const выход=await page.evaluate(()=>({игра:gameActive(),пролог:Prologue.active(),таймеров:Prologue.timers.length,фон:Bank.loops.has("prolog")}));
 check('5. свайп одним пальцем вверх пропускает пролог: игрок в мире, звуки пролога остановлены',выход.игра&&!выход.пролог&&выход.таймеров===0&&!выход.фон,выход);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
