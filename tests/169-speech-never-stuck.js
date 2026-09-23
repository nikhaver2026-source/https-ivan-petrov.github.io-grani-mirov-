/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 169: РЕЧЬ НЕ ЗАСТРЕВАЕТ, ОКНО СОБЫТИЯ ГОВОРИТ ВСЕГДА

   Две жалобы игрока. Первая: после длинного перечня в инвентаре или
   после события синтезатор «вылетал» и дальше молчал. Причина — игра
   ждала от синтезатора конца фразы вечно, а конец иногда не приходит:
   Chrome теряет его, если высказывание собрал сборщик мусора, Android
   глохнет после «паузы и продолжения», которыми игра будила настольный
   Chrome. Вторая: при минимальных подсказках окно встречи в пути молчало —
   встреча открывается в такте шага, и её текст считался «описанием места».

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Синтезатор начал фразу и замолчал, не прислав конца, — следующая
      реплика всё равно звучит, и быстро.
   2. Синтезатор «говорит» вечно и не кончает — сторож снимает кусок, и
      очередь идёт дальше.
   3. Длинный перечень из многих кусков, в котором синтезатор теряет конец
      каждого куска, дочитывается до конца, а следом звучит новая реплика.
   4. Ошибка синтезатора на середине длинного текста не глушит остальные
      куски.
   5. Встреча, открытая в такте шага, при минимальных подсказках читается
      целиком: название, текст и число вариантов.
   6. То же при подсказках «только звук».
   7. На телефоне (Android) игра не ставит синтезатор на паузу.
   8. Высказывание синтезатора устройства держится ссылкой до конца фразы.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(2000);

 /* Поддельный синтезатор: записывает, что ему дали, и ведёт себя так, как
    велено — кончает сразу, молчит без конца, говорит вечно или падает. */
 const поставить=род=>page.evaluate(род=>{
  while(activeLayer())closeTopUI();
  Speech.stop({user:false});
  settings.speech=1;settings.rate=5;
  window.__сказано=[];window.__род=род;
  const а={name:род==="silent"?"web":"fake",
   speak(t,o){window.__сказано.push(t);
    if(o.onstart)setTimeout(o.onstart,5);
    const r=window.__род;
    if(r==="ok")setTimeout(()=>{if(o.onend)o.onend();},30);
    else if(r==="error-once"){window.__род="ok";setTimeout(()=>{if(o.onerror)o.onerror();},30);}
    /* silent и forever не присылают ничего */
    return true;},
   cancel(){},speaking(){return window.__род==="forever";}};
  Speech.adapter=а;Speech._kind=Speech._wantKind();
  return true;},род);
 const ждать=async(cond,ms)=>{const t0=Date.now();while(Date.now()-t0<ms){if(await page.evaluate(cond))return Date.now()-t0;await page.waitForTimeout(200);}return -1;};

 /* ── 1. замолчал без конца ── */
 await поставить("silent");
 await page.evaluate(()=>{Speech.say("Первая фраза без конца.",{pri:2});Speech.say("Вторая фраза.",{pri:2,interrupt:false});});
 const t1=await ждать(()=>window.__сказано.includes("Вторая фраза."),6000);
 check('1. синтезатор замолчал, не прислав конца, — следующая реплика звучит через пару секунд',t1>=0&&t1<4500,{мс:t1,сказано:await page.evaluate(()=>window.__сказано)});

 /* ── 2. говорит вечно ── */
 await поставить("forever");
 await page.evaluate(()=>{Speech.say("Короткая вечная фраза.",{pri:2});Speech.say("После вечной.",{pri:2,interrupt:false,ttl:30000});});
 const t2=await ждать(()=>window.__сказано.includes("После вечной."),12000);
 check('2. кусок, который не кончается, снимает сторож, и очередь идёт дальше',t2>=0,{мс:t2});

 /* ── 3. длинный перечень ── */
 await поставить("silent");
 const длинный=Array.from({length:8},(_,i)=>`Вещь номер ${i+1}: меч из закалённой стали с рунами на клинке, лежит в суме и весит два фунта`).join(". ")+".";
 const кусков=await page.evaluate(t=>Speech._chunk(t).length,длинный);
 await page.evaluate(t=>{Speech.say(t,{pri:2,user:true});Speech.say("Следом новая реплика.",{pri:2,interrupt:false,ttl:60000});},длинный);
 const t3=await ждать(()=>window.__сказано.includes("Следом новая реплика."),кусков*2600+4000);
 const дочитано=await page.evaluate(()=>window.__сказано.length);
 check('3. длинный перечень, в котором теряется конец каждого куска, дочитывается, и следом звучит новая реплика',
  кусков>=4&&t3>=0&&дочитано>=кусков+1,{кусков,дочитано,мс:t3});

 /* ── 4. ошибка на середине ── */
 await поставить("ok");
 await page.evaluate(t=>{window.__род="ok";Speech.say(t,{pri:2,user:true});
  /* второй кусок упадёт */
  const было=Speech.adapter.speak;let n=0;
  Speech.adapter.speak=function(x,o){n++;if(n===2){window.__сказано.push(x);setTimeout(()=>o.onerror&&o.onerror(),20);return true;}return было.call(this,x,o);};},длинный);
 await page.evaluate(n=>{window.__надо=n;},кусков);
 const t4=await ждать(()=>window.__сказано.length>=window.__надо,8000);
 check('4. ошибка синтезатора на середине длинного текста не глушит остальные куски',t4>=0,{сказано:await page.evaluate(()=>window.__сказано.length),кусков});

 /* ── 5–6. окно встречи в такте шага ── */
 const встреча=async режим=>{
  await поставить("ok");
  return page.evaluate(async режим=>{
   setHintMode(режим);
   G.place=null;G.lastEventAt=0;curEvent=null;
   const c=eventContext();const e=EVENTS.find(x=>x.id==="holyday");
   /* как в шаге: такт помечен «описанием места», и в нём же открывается встреча */
   Speech.ctxTag("desc");openEvent(e,c);
   await new Promise(r=>setTimeout(r,1500));
   const всё=window.__сказано.join(" | ");
   const текст=e.text(c);
   const r={режим,название:всё.includes(e.title(c)),текст:всё.includes(текст.split(". ")[1]||текст),
    варианты:/Вариантов:/.test(всё),начало:всё.slice(0,200)};
   while(activeLayer())closeTopUI();setHintMode("full");
   return r;},режим);};
 const мин=await встреча("min");
 check('5. встреча, открытая в такте шага, при минимальных подсказках читается целиком',мин.название&&мин.текст&&мин.варианты,мин);
 const звук=await встреча("sound");
 check('6. и при подсказках «только звук» тоже',звук.название&&звук.текст&&звук.варианты,звук);

 /* ── 8. ссылка на высказывание ── */
 const держит=await page.evaluate(()=>{
  Speech.stop({user:false});Speech.adapter=null;Speech._kind=null;
  const a=Speech._webAdapter();a.speak("проверка",{rate:1,volume:0});const ok=!!Speech._utt&&Speech._utt.text==="проверка";a.cancel();return ok;});
 check('8. высказывание синтезатора устройства держится ссылкой до конца фразы',держит);

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));

 /* ── 7. телефон ── */
 const ctx2=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780},
  userAgent:"Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36"});
 const p2=await ctx2.newPage();
 await p2.goto(process.argv[2]);await p2.waitForTimeout(800);
 const пауза=await p2.evaluate(()=>{Speech._stopKeepAlive();Speech._keepAlive();const r=!!Speech.keepAlive;Speech._stopKeepAlive();return r;});
 check('7. на Android игра не ставит синтезатор на паузу: этот приём там глушит речь',пауза===false,{keepAlive:пауза});

 await browser.close();
 results.forEach(r=>console.log(r));
 const f=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
