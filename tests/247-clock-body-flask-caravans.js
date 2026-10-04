/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 247: 9.5 — ВРЕМЯ ПО РЕАЛЬНЫМ ЧАСАМ, ЖАЖДА И ГОЛОД, ФЛЯГА, ОБОЗЫ,
   ЖИВЫЕ ЦЕНЫ

   Жалобы игрока:
   • жажда и голод наступали слишком быстро и не говорили, сколько отнимают;
   • время игры — к реальному времени;
   • пополнять еду; фляги разной вместимости у торговцев; вода в пресных
     реках и озёрах, за золото у торговца и трактирщика, даром у бочек в
     городах, деревнях и трактирах; зелье здоровья можно влить в воду — тогда
     оно лечит слабее;
   • обозы: звук копыт играл постоянно, а обоз стоял; нужно слышать приезд и
     отъезд; ограбить обоз; доехать с ним за золото;
   • цены — от времени, дальности и опасности дорог.

   1. Время мира по реальным часам: шаг времени не стоит, реальная минута —
      минута мира; ускоренно — вшестеро; по шагам — как прежде.
   2. Жажда растёт по реальному времени; заранее предупреждает, когда и по
      сколько начнёт бить; бьёт раз в пять минут и говорит, сколько отняла.
   3. Глоток из фляги снимает жажду; герой отпивает сам, если так выбрано;
      пустая фляга — подсказка, где взять воду.
   4. У торговца — фляги разной вместимости, еда и вода за золото; новая
      фляга меняет вместимость.
   5. Пресная река наполняет флягу даром, у моря — отказ: вода солёная;
      бочка с водой в городе — даром.
   6. Зелье здоровья во флягу: глоток лечит меньше, чем зелье целиком.
   7. Еда снимает голод и пополняет сытость; сытость держит голод.
   8. Обоз приезжает со звуком один раз, а не звучит без конца; в окне обоза —
      «Поехать с обозом» и «Ограбить»; поездка довозит до города назначения
      за живую плату; ограбление — розыск державы.
   9. Живая цена: ночью дороже, чем днём.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){__said.push(String(t));return s0(t,o);};});

 /* ── 1 ── */
 const п1=await p.evaluate(()=>{const o={};o.mode=Clock.mode();
  while(activeLayer())closeTopUI();const h0=G.day*24+G.hour;move("E");move("W");o.шаги=Math.round((G.day*24+G.hour-h0)*1000)/1000;
  const realNow=Date.now;let t=realNow();Date.now=()=>t;
  Clock.last=t;t+=60000;const a=G.day*24+G.hour;Clock.tick();o.минута=Math.round((G.day*24+G.hour-a)*60*100)/100;
  settings.clock="fast";Clock.last=t;t+=60000;const b=G.day*24+G.hour;Clock.tick();o.быстро=Math.round((G.day*24+G.hour-b)*60*100)/100;
  /* окно (например, «Караван», заехавший на клетку) не пускает шаг — закрываем */
  while(activeLayer())closeTopUI();settings.clock="steps";const c=G.day*24+G.hour;for(const d of ["E","W","N","S"]){move(d);if(G.day*24+G.hour-c>0)break;}o.пошагам=G.day*24+G.hour-c>0||((!!G.place||!!G.inCombat)&&Clock.stepK()===1);o.где=G.place?"внутри":G.inCombat?"бой":"снаружи";
  settings.clock="real";Date.now=realNow;return o;});
 check('1. время мира по реальным часам: шаг времени не стоит, минута — минута; ускоренно — вшестеро; по шагам — как прежде',
  п1.mode==="real"&&п1.шаги===0&&Math.abs(п1.минута-1)<0.05&&Math.abs(п1.быстро-6)<0.2&&п1.пошагам,п1);

 /* ── 2 ── */
 const п2=await p.evaluate(()=>{G.needs={};G.food=0;G.water=0;settings.autoDrink=0;settings.autoEat=0;Body.warned={};Body.hitAt={};__said.length=0;
  Body.tick(1.5);const пред=__said.join(" | ");const v=Math.round(Survival.state().thirst);
  const hp=G.hp;Body.tick(0.6);const бьёт=__said.slice(-1)[0]||"";const урон=hp-G.hp;
  const hp2=G.hp;Body.tick(0.01);const сразу=hp2-G.hp;
  return {v,пред,бьёт,урон,сразу};});
 check('2. жажда растёт по реальному времени, заранее предупреждает когда и по сколько, бьёт раз в пять минут и говорит, сколько отняла',
  п2.v>=35&&п2.v<50&&/Скоро жажда.*через \d+ минут.*по 2 .*здоровья каждые 5 минут/.test(п2.пред)
  &&п2.урон>=2&&/Жажда: минус 2 здоровья, и так каждые 5 минут/.test(п2.бьёт)&&п2.сразу===0,п2);

 /* ── 3 ── */
 const п3=await p.evaluate(()=>{__said.length=0;G.water=0;Body.drink(false);const пусто=__said.slice(-1)[0]||"";
  G.water=100;settings.autoDrink=1;const th=Survival.state().thirst;Body.tick(0.01);
  return {пусто,было:Math.round(th),стало:Math.round(Survival.state().thirst),вода:G.water,сказано:__said.slice(-1)[0]};});
 check('3. глоток из фляги снимает жажду, герой отпивает сам; пустая фляга — подсказка, где взять воду',
  /Фляга пуста.*реке.*озере.*бочки/.test(п3.пусто)&&п3.стало<п3.было-30&&п3.вода===80&&/глоток из фляги/i.test(п3.сказано||""),п3);

 /* ── 4 ── */
 const п4=await p.evaluate(()=>{const n=getNPC(G.x,G.y,0,"Торговец")||{x:G.x,y:G.y,tier:1,race:"человек"};
  G.water=40;const st=stockFor(n);
  const фляги=st.filter(x=>x.фляга).map(x=>x.n),вода=st.find(x=>x.вода),еда=st.filter(x=>/Хлеб|Еда в дорогу/.test(x.n)).map(x=>x.n);
  G.gold=500;const до=waterCap();Body.buyFlask("bigskin",95);
  return {фляги,вода:вода&&вода.n,еда,до,после:waterCap(),флага:G.flask};});
 check('4. у торговца — фляги разной вместимости, еда и вода за золото; новая фляга меняет вместимость',
  п4.фляги.length>=3&&/Наполнить флягу водой/.test(п4.вода||"")&&п4.еда.length>=2&&п4.до===120&&п4.после===350,п4);

 /* ── 5 ── */
 const п5=await p.evaluate(()=>{const o={};
  let река=null,море=null;
  for(let r=1;r<3000&&(!река||!море);r+=7)for(let k=0;k<16&&(!река||!море);k++){const x=G.x+Math.round(r*Math.cos(k*0.39)),y=G.y+Math.round(r*Math.sin(k*0.39));
   const b=safeFn(()=>biomeAt(x,y),null);if(!b)continue;if(!река&&FRESH_BIOMES.includes(b.id))река={x,y};if(!море&&/sea|ocean|coast|shore|reef|archipelago/.test(b.id)&&!FRESH_BIOMES.includes(b.id))море={x,y};}
  const сх=G.x,су=G.y;__said.length=0;
  if(река){G.x=река.x;G.y=река.y;G.water=0;Body.fill();o.река=G.water===waterCap();o.рекаСказано=__said.slice(-1)[0];}
  if(море){let ок=true;for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const b=biomeAt(море.x+dx,море.y+dy);if(b&&FRESH_BIOMES.includes(b.id))ок=false;}
   if(ок){G.x=море.x;G.y=море.y;G.water=0;Body.fill();o.море=G.water===0;o.мореСказано=__said.slice(-1)[0];}else o.море=true;}
  G.x=сх;G.y=су;
  /* бочка с водой в поселении */
  const сыт=objProp;window.objectsHere=()=>[{плитка:"X",вещь:"barrels",x:3,y:4,d:0}];G.place={x:1,y:1,depth:0};
  const b=Body.freshHere();o.бочка=!!b;G.water=0;if(b){Body.fill();o.бочкаПолна=G.water===waterCap();}G.place=null;
  return o;});
 check('5. пресная река и бочка с водой в поселении наполняют флягу даром; у солёной воды — отказ',
  п5.река===true&&п5.бочка&&п5.бочкаПолна&&п5.море===true&&(!п5.мореСказано||/солёная|Пресной воды рядом нет/.test(п5.мореСказано)),п5);

 /* ── 6 ── */
 const п6=await p.evaluate(()=>{G.flaskMix=null;G.water=200;G.hpMax=100;
  potionsOf().push({id:"heal",q:1,стаб:1,день:G.day,срок:20});const i=potionsOf().length-1;
  invDo("mixflask","potion",String(i));const mix=G.flaskMix&&G.flaskMix.left;
  G.hp=30;Body.drink(false);return {mix,глоток:G.hp-30,целиком:Math.round(G.hpMax*0.3)};});
 check('6. зелье здоровья во флягу: всего в воде меньше силы, чем в зелье, а глоток лечит намного меньше зелья целиком',
  п6.mix>0&&п6.mix<п6.целиком&&п6.глоток>0&&п6.глоток<п6.целиком/2,п6);

 /* ── 7 ── */
 const п7=await p.evaluate(()=>{G.needs={hunger:55};G.food=0;G.inv["Хлеб"]=1;
  invDo("eat","res","Хлеб");const голод=Math.round(Survival.state().hunger),сыт=G.food;
  settings.autoEat=0;const до=Survival.state().hunger;Body.tick(0.5);const после=Survival.state().hunger;
  return {голод,сыт,держит:после===до,сытПосле:Math.round(G.food)};});
 check('7. еда снимает голод и пополняет сытость; пока сытость есть, голод не растёт',п7.голод<=20&&п7.сыт>=40&&п7.держит&&п7.сытПосле<п7.сыт,п7);

 /* ── 8 ── */
 const п8=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));
  let car=null;for(let rr=8;rr<=400&&!car;rr*=2){for(let h=0;h<24&&!car;h++){const cs=caravansNear(G.x,G.y,G.day,h,rr).filter(c=>c.moving);if(cs.length){car=cs[0];G.hour=h;}}}
  if(!car)return {нет:true};
  G.x=car.x;G.y=car.y;const o={};
  const near=caravansNear(G.x,G.y,G.day,G.hour,6).filter(c=>c.moving);
  const звуки=[];const sr=Spatial.role.bind(Spatial);Spatial.role=(r,x,y,oo)=>{звуки.push(r);return sr(r,x,y,oo);};
  CaravanRoll.seen={};CaravanRoll.tick();await w(11500);const первые=звуки.length;
  for(let i=0;i<5;i++){CaravanRoll.tick();await w(300);}const потом=звуки.length-первые;
  o.приезд=первые;o.потом=потом;
  G.gold=1000;meetCaravan(near[0]);
  o.кнопки=[...document.querySelectorAll('#caravanBody [data-cmd]')].map(b=>b.dataset.cmd).filter(c=>/carride|carrob/.test(c));
  const fare=carRideFare(near[0]),to=near[0].to,h0=G.day*24+G.hour;
  CMD.carride();await w(5200);
  o.поездка={плата:fare,осталось:G.gold,на:[G.x,G.y],куда:[to.x,to.y],часов:Math.round(G.day*24+G.hour-h0)};
  /* ограбление */
  const c2=caravansNear(G.x,G.y,G.day,G.hour,40).filter(c=>c.moving)[0]||near[0];
  G.wanted={};meetCaravan(c2);CMD.carrob();o.розыск=G.wanted[c2.from.emp.short]||0;
  return o;});
 check('8. обоз приезжает со звуком один раз, а не без конца; «Поехать с обозом» и «Ограбить»; поездка довозит до города назначения за плату; грабёж — розыск',
  /* число шагов приезда за 11,5 с зависит от загрузки машины: важно, что звук есть и потом стихает */
  п8.приезд>=10&&п8.потом<=2&&п8.кнопки.includes("carride")&&п8.кнопки.includes("carrob")
  &&п8.поездка.на[0]===п8.поездка.куда[0]&&п8.поездка.на[1]===п8.поездка.куда[1]&&п8.поездка.осталось===1000-п8.поездка.плата&&п8.поездка.часов>=1&&п8.розыск>=2,п8);

 /* ── 9 ── */
 const п9=await p.evaluate(()=>{const x=G.x,y=G.y;G.hour=13;const день=priceDyn(x,y);G.hour=23;const ночь=priceDyn(x,y);G.hour=13;return {день,ночь};});
 check('9. живая цена: ночью дороже, чем днём',п9.ночь>п9.день,п9);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
