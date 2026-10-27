/* probe_kraya.js — края канона: открытие, поселение, люди, умения, вещи, дела, здания, боги. */
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const p=await (await b.newContext()).newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker|fetching the script/i.test(m.text()))errs.push('console: '+m.text());});
 await p.goto(process.argv[2]||'http://127.0.0.1:8903/https-ivan-petrov.github.io-grani-mirov-/index.html');await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();while(activeLayer())closeTopUI();window.maybeEvent=()=>{};G.level=30;G.gold=99999;G.place=null;G.ship=null;});await p.waitForTimeout(600);
 const r=await p.evaluate(async()=>{const o={};const сказ=[];const e0=Speech.enqueue;Speech.enqueue=function(t){сказ.push(String(t));return e0.apply(this,arguments);};
  o.краёв=КАНОН_КРАЯ.length;o.умений=КАНОН_УМЕНИЯ.length;
  /* Режиссёр открывает землю — это край канона */
  const k=КанонКрай.следующий();o.первый=k&&k.имя;o.открытие=Neuro.newLand(Neuro.gen().n++,Math.random);
  const g=Neuro.gen();const pl=g.places.find(x=>x.кнКрай===k.id);o.мест=g.places.filter(x=>x.кн).length;o.богов=g.gods.filter(x=>x.кн).length;o.ресурсов=g.res.filter(x=>x.кн).length;
  o.край=!!Канон.край(g.lands.find(l=>l.кн===k.id).x,g.lands.find(l=>l.кн===k.id).y);
  /* герой в поселении */
  G.x=pl.x;G.y=pl.y;Neuro.placeStep();await new Promise(r=>setTimeout(r,1100));o.прибытие=сказ.slice(-1)[0];
  const м=КанонКрай.место();o.место=м&&м.s.имя;
  /* окно места и человека */
  let ev=null;const oe=openEvent;openEvent=function(spec){ev={title:spec.title(),text:spec.text(),choices:spec.choices().map(c=>c.l),run:spec.choices()};return true;};
  useHere();o.окно={t:ev&&ev.title,выборов:ev&&ev.choices.length,перв:ev&&ev.choices.slice(0,6)};
  const учитель=k.люди.find(c=>c.учит.length);КанонМесто.человек(учитель.id);o.человек={t:ev.title,выборы:ev.choices.slice(0,8)};
  const i=ev.choices.findIndex(l=>/^Учиться: /.test(l));const g0=G.gold;if(i>=0)ev.run[i].run();o.умениеВыучено=КанонУмения.мои().map(u=>u.имя);o.платаЗаУмение=g0-G.gold;
  const j=ev.choices.findIndex(l=>/^Учиться чарам/.test(l));if(j>=0){ev.run[j].run();o.чары=сказ.slice(-1)[0];}
  /* торговец */
  const торг=k.люди.find(c=>c.продаёт.length);if(торг){КанонМесто.человек(торг.id);const q=ev.choices.findIndex(l=>/^Купить/.test(l));if(q>=0){ev.run[q].run();o.куплено=сказ.slice(-1)[0].slice(0,160);}}
  /* дело */
  const даёт=k.люди.find(c=>c.дело);if(даёт){КанонМесто.человек(даёт.id);const q=ev.choices.findIndex(l=>/^Взять дело/.test(l));ev.run[q].run();o.дело=Канон.ст().дела[даёт.id];
   const t=КАНОН_ТВАРЬ[даёт.дело.тварь];const m=Object.assign({},t,{lvl:3,hp:20,dmg:1,xp:5,gold:5});startCombat({x:G.x,y:G.y,monster:m},{});await new Promise(r=>setTimeout(r,300));
   G.combat.hp=0;victory();await new Promise(r=>setTimeout(r,2800));o.делоСделано=!!Канон.ст().дела[даёт.id].сделано;
   КанонМесто.человек(даёт.id);const s2=ev.choices.findIndex(l=>/^Сдать дело/.test(l));const з0=G.gold;if(s2>=0)ev.run[s2].run();o.наградаДело=G.gold-з0;}
  /* здание и бог */
  if(k.здания[0]){КанонМесто.помощь(k.здания[0],"здание");o.здание=сказ.slice(-1)[0].slice(0,200);}
  const бог=g.gods.find(x=>x.кн);if(бог)o.молитва=Neuro.offer(бог.id);
  /* умение в деле: прибавка к характеристикам */
  o.статУмений=["здоровье","удача","сила","чутьё"].map(s=>s+":"+КанонУмения.стат(s));
  openEvent=oe;Speech.enqueue=e0;
  /* все края открываются по очереди */
  G.level=60;let n=1;for(let t=0;t<30;t++){const kk=КанонКрай.следующий();if(!kk)break;КанонКрай.открыть(kk);n++;}o.всегоОткрыто=КанонКрай.ст().открыто.length;
  o.людейВсего=Object.keys(КАНОН_ЛЮДИ).length;o.учатВсе=КАНОН_УМЕНИЯ.every(u=>Object.values(КАНОН_ЛЮДИ).some(c=>c.учит.indexOf(u.id)>=0));
  o.чарыВсе=(KN.extraSpells||[]).every(s=>Object.values(КАНОН_ЛЮДИ).some(c=>c.чары.indexOf(s.n)>=0));
  return o;});
 console.log(JSON.stringify(r,null,1));console.log("ошибок страницы",errs.length,errs.slice(0,6));await b.close();})();
