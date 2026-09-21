/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 97: МИР ЗВУКАМИ, ЖЕСТЫ ДВУМЯ И ТРЕМЯ ПАЛЬЦАМИ, ИНВЕНТАРЬ ПО РАЗДЕЛАМ

   Подсказки, где что находится, выключаются в настройках: тогда описания
   после шага молчат, стена не называется, а проходы слышны ветром с их
   стороны, дверь — петлёй, ступени — камнем. Осмотреться — три пальца
   влево. Два пальца: вниз — взаимодействовать с найденным, вверх —
   повторить или оборвать речь, влево — карта места, вправо — журнал дел;
   тот же свайп окно закрывает. Три пальца вниз — инвентарь по разделам:
   двойное касание по вещи — о ней, свайп вверх или вниз на ней — действия
   по вещи и по месту.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Без подсказок шаг молчит, стена молчит, проходы слышны с их стороны;
      с подсказками всё называется.
   2. Два пальца вверх — повтор или стоп; влево — карта (открыть, закрыть);
      вправо — журнал (открыть, закрыть); вниз — действие с найденным.
   3. Три пальца вниз — инвентарь и его закрытие; влево — эхо-скан; вправо —
      «где я»; и всё это работает жестами поверх окна.
   4. Инвентарь разложен по разделам; двойное касание по вещи говорит о ней;
      свайп вверх на вещи открывает действия.
   5. Действия: зелье пьётся, склянка пьётся, руда выбрасывается по одной и
      вся, оружие надевается из сумы; у горна есть «плавить», у алтаря —
      «принести в дар» (и это растит благосклонность), у торговца — «продать».
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 const cdp=await ctx.newCDPSession(page);
 async function multiSwipe(n,dx,dy,steps=6){
  const pts=[];for(let i=0;i<n;i++)pts.push({x:100+i*45,y:450});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pts.map((p,i)=>({x:p.x,y:p.y,id:i}))});await page.waitForTimeout(30);
  for(let k=1;k<=steps;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:pts.map((p,i)=>({x:p.x+dx*k/steps,y:p.y+dy*k/steps,id:i}))});await page.waitForTimeout(18);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(200);}
 async function tap(x,y){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});await page.waitForTimeout(30);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(80);}
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  /* Принятое в очередь — то, что и вправду прозвучит: отброшенное распорядителем сюда не попадает. */
  window.SPOKEN=[];const ps=Speech._push.bind(Speech);Speech._push=function(m){SPOKEN.push(String(m&&m.text));return ps(m);};const pf=Speech._pushFront.bind(Speech);Speech._pushFront=function(m){SPOKEN.push(String(m&&m.text));return pf(m);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,o);};const sr=Spatial.role.bind(Spatial);Spatial.role=(r,dx,dy,o)=>{PLAYED.push("sp:"+r+":"+dx+","+dy);return sr(r,dx,dy,o);};
  window.LOG=[];const u=useHere;window.useHere=function(){LOG.push("useHere");return u.apply(this,arguments);};const sc=scanSpeak;window.scanSpeak=function(){LOG.push("scan");return sc.apply(this,arguments);};const lo=Look.open.bind(Look);Look.open=function(){LOG.push("scan");return lo();};
  const st=Speech.status.bind(Speech);Speech.status=function(){LOG.push("status");return st();};const rl=Speech.repeatLast.bind(Speech);Speech.repeatLast=function(){LOG.push("repeat");return rl();};
  G.place=null;G.ship=null;G.inCombat=false;G.combat=null;G.weaponDrawn=false;settings.fastTap=0;});

 /* ── 1. без подсказок ── */
 const подск=await page.evaluate(async()=>{
  const r={};let L=null,bx,by;for(bx=3;bx<40&&!L;bx++)for(by=3;by<40&&!L;by++){const l=genLevel(bx,by,2,"ruins");if(l&&l.entry)L=l;}bx--;by--;
  G.place={kind:"dungeon",bx,by,stype:"ruins",name:"м",depth:2,x:L.entry.x,y:L.entry.y};
  let dir=null,wall=null;for(const d of ["N","E","S","W"]){const t=tileAt(L,G.place.x+DIRV[d][0],G.place.y+DIRV[d][1]);if(t==="."&&!dir)dir=d;if(t==="#"&&!wall)wall=d;}
  settings.hints=0;PLAYED.length=0;SAID.length=0;SPOKEN.length=0;moveInside(dir);await new Promise(res=>setTimeout(res,900));
  r.шагСказ=SPOKEN.filter(t=>/Проход|Стена|Вы под землёй|Слой/.test(t));r.проходы=PLAYED.filter(x=>/^sp:(deep_wind|deep_stairs|oc_hinge|hall_gate)/.test(x));
  const p2={x:G.place.x,y:G.place.y};let wall2=null;for(const d of ["N","E","S","W"]){if(tileAt(L,p2.x+DIRV[d][0],p2.y+DIRV[d][1])==="#")wall2=d;}
  SPOKEN.length=0;if(wall2)moveInside(wall2);await new Promise(res=>setTimeout(res,200));r.стенаМолчит=SPOKEN.length===0;
  settings.hints=1;SAID.length=0;if(wall2)moveInside(wall2);r.стенаСказ=SAID.slice();
  SAID.length=0;let back=null;for(const d of ["N","E","S","W"]){if(tileAt(L,G.place.x+DIRV[d][0],G.place.y+DIRV[d][1])===".")back=d;}moveInside(back);await new Promise(res=>setTimeout(res,300));r.сПодсказками=SAID.length;
  r.чекбокс=!!document.getElementById("setHintMode")&&typeof setHintMode==="function"&&(setHintMode("sound"),settings.hints===0)&&(setHintMode("full"),settings.hints===1);
  return r;});
 check('1. без подсказок шаг и стена молчат, а проходы слышны с их стороны; с подсказками стена и шаг называются',
  подск.шагСказ.length===0&&подск.проходы.length>=1&&подск.стенаМолчит&&/Стена/.test(подск.стенаСказ.join(" "))&&подск.сПодсказками>=1&&подск.чекбокс,подск);

 /* ── 2. два пальца ── */
 await page.evaluate(()=>{Speech.stop();LOG.length=0;});
 await multiSwipe(2,0,-170);
 const повтор=await page.evaluate(()=>LOG.includes("repeat"));
 await multiSwipe(2,-170,0);const картаОткр=await page.evaluate(()=>!document.getElementById("modal-map").hidden);
 await multiSwipe(2,-170,0);const картаЗакр=await page.evaluate(()=>document.getElementById("modal-map").hidden);
 await multiSwipe(2,170,0);const журнОткр=await page.evaluate(()=>!document.getElementById("modal-quests").hidden);
 await multiSwipe(2,170,0);const журнЗакр=await page.evaluate(()=>document.getElementById("modal-quests").hidden);
 await page.evaluate(()=>{LOG.length=0;});await multiSwipe(2,0,170);const действие=await page.evaluate(()=>LOG.includes("useHere"));
 check('2. два пальца: вверх — повтор, влево — карта (открыть и закрыть), вправо — журнал (открыть и закрыть), вниз — действие с найденным',
  повтор&&картаОткр&&картаЗакр&&журнОткр&&журнЗакр&&действие,{повтор,картаОткр,картаЗакр,журнОткр,журнЗакр,действие});

 /* ── 3. три пальца ── */
 await page.evaluate(()=>{LOG.length=0;});
 await multiSwipe(3,0,170);const инвОткр=await page.evaluate(()=>!document.getElementById("modal-inventory").hidden);
 await multiSwipe(2,170,0);const журнПоверх=await page.evaluate(()=>!document.getElementById("modal-quests").hidden&&document.getElementById("modal-inventory").hidden);
 await multiSwipe(3,0,170);const инвПоверх=await page.evaluate(()=>!document.getElementById("modal-inventory").hidden);
 await multiSwipe(3,0,170);const инвЗакр=await page.evaluate(()=>document.getElementById("modal-inventory").hidden);
 await multiSwipe(3,-170,0);await page.evaluate(()=>{SAID.length=0;});await multiSwipe(3,170,0);
 const лог=await page.evaluate(()=>LOG.slice());const гдеЯ=await page.evaluate(()=>SAID.some(t=>/Вы здесь/.test(t)));
 check('3. три пальца: вниз — инвентарь и его закрытие, и поверх другого окна тоже; влево — эхо-скан; вправо — «где я»',
  инвОткр&&журнПоверх&&инвПоверх&&инвЗакр&&лог.includes("scan")&&гдеЯ,{инвОткр,журнПоверх,инвПоверх,инвЗакр,лог,гдеЯ});

 /* ── 4. инвентарь ── */
 const инв=await page.evaluate(()=>{
  G.inv={"руда":3,"рановник":1,"салака":2,"жемчуг":1};G.potions=[{id:"heal",q:1,стаб:0.9,день:G.day,срок:10}];G.items=["Зелье здоровья","Свиток: Искра"];
  toggleWindowGesture("modal-inventory");
  const r={секции:[...document.querySelectorAll("#invSections h3")].map(h=>h.textContent),кнопок:document.querySelectorAll('#invSections [data-cmd^="invpick:"]').length};
  const b=document.querySelector('#invSections [data-cmd="invpick:res:%D1%80%D1%83%D0%B4%D0%B0"]');b.scrollIntoView({block:"center"});
  /* Вещь выбирают свайпом или ощупыванием; одиночного касания одним пальцем в
     игре нет, и двойное подтверждает ВЫБРАННОЕ, а не то, куда попал палец. */
  setCursor(b,false);
  const rc=b.getBoundingClientRect();r.x=rc.left+10;r.y=rc.top+8;
  return r;});
 await tap(инв.x,инв.y);await tap(инв.x,инв.y);await page.waitForTimeout(200);
 const выбрано=await page.evaluate(()=>({sel:INV.sel,сказ:SAID.slice(-1)[0]}));
 await multiSwipe(1,0,-170);
 const действия=await page.evaluate(()=>({окно:!document.getElementById("modal-invact").hidden,список:[...document.querySelectorAll('#invActBody button')].map(b=>b.dataset.cmd.split(":")[1])}));
 check('4. инвентарь по разделам; двойное касание по вещи говорит о ней; свайп вверх на вещи открывает действия',
  инв.секции.length>=6&&инв.кнопок>=7&&выбрано.sel&&выбрано.sel.key==="руда"&&/руда: 3 шт/.test(выбрано.сказ)&&действия.окно&&действия.список.includes("look")&&действия.список.includes("drop"),{секции:инв.секции,выбрано,действия});

 /* ── 5. действия ── */
 const дела=await page.evaluate(()=>{
  const r={};G.hp=10;G.hpMax=100;
  invPick("potion","0");invDo("drink","potion","0");r.зелье=[G.hp,G.potions.length];
  invPick("item","0");invDo("drinkitem","item","0");r.склянка=[G.hp,G.items.length];
  invPick("res","руда");invDo("drop1","res","руда");r.руда1=G.inv["руда"];invDo("dropall","res","руда");r.рудаВсё=G.inv["руда"];
  const w=G.equip.weapon;G.gear=G.gear||[];const second={id:"t_sword",name:"Проверочный меч",type:"меч",slot:"weapon",rank:1,qual:1,val:3,price:10};G.gear.push(second);
  const gi=G.gear.indexOf(second);invPick("gear",String(gi));invDo("equip","gear",String(gi));r.надето=G.equip.weapon&&G.equip.weapon.name;
  /* контекст: горн, алтарь, торговец */
  G.inv["руда"]=5;
  let L=null;outer2: for(const st of ["forge","castle","village","clanhall"])for(let bx=3;bx<40;bx++)for(let by=3;by<40;by++){const l=safeFn(()=>genLevel(bx,by,0,st),null);if(!l)continue;for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(tileAt(l,x,y)==="F"){L={l,f:{x,y},bx,by,st};break outer2;}}
  if(L){G.place={kind:"house",bx:L.bx,by:L.by,stype:L.st,name:"Кузня",depth:0,x:L.f.x,y:L.f.y};r.горн=invActionList("res","руда").map(a=>a.id);r.горнГде=L.st;}
  let A=null;for(bx=3;bx<60&&!A;bx++)for(by=3;by<60&&!A;by++){const l=genLevel(bx,by,2,"ruins");if(l){for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(tileAt(l,x,y)==="A")A={l,x,y,bx,by};}}
  if(A){G.place={kind:"dungeon",bx:A.bx,by:A.by,stype:"ruins",name:"м",depth:2,x:A.x,y:A.y};G.faith={};G.inv["руда"]=5;r.алтарь=invActionList("res","руда").map(a=>a.id);invDo("offer","res","руда");r.вера=Object.values(G.faith).reduce((s,v)=>s+v,0);}
  G.place=null;
  let npc=null;outer: for(let rr=0;rr<80;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){const c=safeFn(()=>cellContent((WORLD>>1)+dx,(WORLD>>1)+dy),null);if(c&&c.structure){const n=safeFn(()=>npcsFor(c),[]).find(x=>x.trade);if(n){G.x=(WORLD>>1)+dx;G.y=(WORLD>>1)+dy;npc=n;break outer;}}}
  if(npc){G.inv["руда"]=5;r.торг=invActionList("res","руда").map(a=>a.id);}
  return r;});
 check('5а. зелье и склянка пьются, руда выбрасывается по одной и вся, меч из сумы надевается',
  дела.зелье[0]>10&&дела.зелье[1]===0&&дела.склянка[0]>дела.зелье[0]&&дела.склянка[1]===1&&дела.руда1===2&&дела.рудаВсё===undefined&&дела.надето==="Проверочный меч",дела);
 check('5б. у горна есть «плавить», у алтаря — «принести в дар» и благосклонность растёт, у торговца — «продать»',
  (дела.горн||[]).includes("melt")&&(дела.алтарь||[]).includes("offer")&&дела.вера>=1&&(дела.торг||[]).includes("sell"),{горн:дела.горн,алтарь:дела.алтарь,вера:дела.вера,торг:дела.торг});

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\nИтого: ${results.filter(r=>r.startsWith('PASS')).length}/${results.length}`);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
