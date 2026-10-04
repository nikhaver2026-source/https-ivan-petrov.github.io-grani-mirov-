/* ══════════════════════════════════════════════════════════════════
   253 — БЫСТРОЕ ЛИСТАНИЕ НЕ ГЛОТАЕТ ПУНКТЫ (9.5.1, просьба игрока)
   «Быстро хожу свайпами по меню — какой-то пункт голос проглатывает,
   и приходится возвращаться». Проверяется:
   1. Мост Android: остановка прежнего пункта не уходит в синтезатор
      ПОСЛЕ новой фразы — иначе запоздалый stop() снимал уже новый пункт.
      Отменённый пункт без новой фразы всё же останавливается.
   2. Десять свайпов подряд по меню (каждые 40 мс): последний пункт
      звучит, а фразы прежних не висят в очереди.
   3. Запись находится и в склеенной фразе: «Здоровье — одно касание…
      (на компьютере — H)» звучит записью целиком, а не кусками.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};});

 /* ── 1 ── */
 const п1=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const лог=[];window.GraniTTS={speak(t){лог.push("speak:"+t);},stop(){лог.push("stop");},isSpeaking(){return false;}};
  const a=Speech._nativeAdapter();
  a.speak("Первый пункт",{rate:1,volume:1});a.cancel();a.speak("Второй пункт",{rate:1,volume:1});
  await w(150);const подряд=лог.slice();
  лог.length=0;a.cancel();await w(150);const одна=лог.slice();
  return {подряд,одна};});
 check('1. мост Android: при переходе на новый пункт остановка не снимает новую фразу; одиночная отмена останавливает',
  п1.подряд.join("|")==="speak:Первый пункт|speak:Второй пункт"&&п1.одна.join("|")==="stop",п1);

 /* ── 2 ── */
 const п2=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  const сказано=[];const FAKE={cur:null,speak(t,o){сказано.push(t);this.cur=o;setTimeout(()=>{try{o.onstart();}catch(_){}},0);return true;},
   cancel(){this.cur=null;},speaking(){return !!this.cur;}};
  const было=Speech.adapter;Speech.adapter=FAKE;Speech._chunk=t=>[String(t)];Speech.stop();
  try{Folk.смолкнуть(true);}catch(_){}
  while(activeLayer())closeTopUI();CMD.settings();await w(300);
  const lay=navLayer();const items=cursorItems(lay).slice(0,10);
  for(const el of items){setCursor(el,true,false);await w(40);}
  await w(200);
  const последний=speakTextOf?((items[items.length-1].dataset.speak||items[items.length-1].getAttribute("aria-label")||items[items.length-1].textContent||"").trim().slice(0,12)):"";
  const ок=сказано.length>0&&сказано[сказано.length-1].includes(последний);
  const очередь=Speech.queue.length;
  while(activeLayer())closeTopUI();Speech.adapter=было;
  return {пунктов:items.length,сказано:сказано.length,последний,ок,очередь};});
 check('2. десять свайпов подряд: последний пункт звучит, прежние не копятся в очереди',
  п2.пунктов>=5&&п2.ок&&п2.очередь===0,п2);

 /* ── 3 ── */
 const п3=await p.evaluate(async()=>{
  settings.gvVoice="m";Speech.gvLoad();for(let i=0;i<60&&!(Speech.GVOICES.m.map);i++)await new Promise(z=>setTimeout(z,100));
  const t="Здоровье — одно касание двумя пальцами с вынутым оружием (на компьютере — H)";
  const ч=Speech.gvParts(t).map(x=>[x.t,!!x.url]);
  return {ч,всё:ч.every(x=>x[1])};});
 check('3. запись находится и через тире внутри скобок: фраза звучит записью без синтезатора',п3.всё,п3);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
