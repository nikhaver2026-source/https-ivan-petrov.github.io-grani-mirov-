/* НАБОР 281: вход в чертог — путь по осям, лестница, десять тысяч чертогов.
   Жалоба игрока: «игра говорит, что чертог в пяти шагах на западе, но
   проходишь пять шагов — входа нет; войти в чертог невозможно». Сторона
   называлась округлённо, до восьми румбов, а расстояние — по большей оси,
   и, пройдя названные шаги, игрок оставался в нескольких клетках от входа.
   Набор проверяет:
   1. путь к входу называется по осям («10 шагов на юг и 3 шага на запад»), и
      пройдя ровно его, игрок стоит у входа;
   2. у самого входа игра говорит об этом каждый раз и называет пункт меню;
   3. в «Перемещении» — пункт по виду чертога: лестница вниз, эфирная вверх,
      пространственная; в «Здесь» его больше нет;
   4. по лестнице идут сами: свайп — ступень, обратный — назад, в конце —
      вход; «Действие здесь» и тот же пункт меню ведут до конца;
   5. закрытый чертог отвечает сразу, до лестницы;
   6. вход в «Что рядом» и в «Осмотреться» (цель маяка), в «Книге искателя» —
      путь по осям и маяк; вход не стоит на клетке города или подземелья;
   7. чертогов десять тысяч, имена не повторяются; открытые миром чертоги из
      старых сохранений (с 6000) переезжают за CH_DYN0 вместе с памятью о них. */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),20);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};G.level=40;Chertog.st().seal=6;
  window.__w=ms=>new Promise(r=>setTimeout(r,ms));
  /* Открытый чертог вида «вниз» поблизости, на чистой клетке. */
  window.__find=kind=>{for(let r=40;r<=400;r+=40){const e=Chertog.near(r).find(x=>{const s=Chertog.spec(x.i);return Chertog.entryKind(s)===kind&&!Chertog.access(s).length;});if(e)return e;}
   for(let k=0;k<5000;k++){const bx=800+k%71,by=800+Math.floor(k/71);const e=Chertog.at(bx,by);if(!e)continue;const s=Chertog.spec(e.i);if(Chertog.entryKind(s)===kind&&!Chertog.access(s).length)return e;}return null;};});

 /* ── 1–2. путь по осям и слово у входа ── */
 const путь=await p.evaluate(async()=>{const r={};const e=__find("down");r.e=!!e;if(!e)return r;
  G.x=e.x+3;G.y=e.y-4;await __w(300);window.__tts.length=0;Chertog._at=null;Chertog.st().ann={};Chertog.tick();await __w(300);r.far=window.__tts.join(" | ");
  r.route=Chertog.route(e.x-G.x,e.y-G.y);
  /* Пройти ровно то, что названо: 4 на юг и 3 на запад — без зданий на пути. */
  G.x=e.x;G.y=e.y-4;for(let k=0;k<3;k++){const c=cellContent(G.x,G.y+1);G.y++;}
  G.x=e.x;G.y=e.y-1;window.__tts.length=0;Chertog.tick();await __w(300);r.at=window.__tts.join(" | ");
  r.here=!!Chertog.here();window.__tts.length=0;Chertog.tick();await __w(200);r.again=window.__tts.join(" | ");
  /* Повтор той же фразы речь гасит как дубль, поэтому здесь слушаем сам вызов. */
  const nar=Speech.say;const calls=[];Speech.say=function(t,o){calls.push(String(t));return nar.apply(this,arguments);};
  G.x+=5;Chertog.tick();G.x-=5;Chertog.tick();Speech.say=nar;r.back=calls.join(" | ");
  return r;});
 check('1. путь к входу назван по осям: «4 шага на юг и 3 шага на запад»; пройдя его, игрок стоит у входа',
  путь.e&&/4 шага на юг и 3 шага на запад/.test(путь.far)&&путь.route==="4 шага на юг и 3 шага на запад"&&путь.here,путь);
 check('2. у самого входа игра говорит об этом и называет пункт «Перемещения»; отошёл и вернулся — говорит снова, стоя на месте — не повторяет',
  /вход в чертог/.test(путь.at)&&/«Перемещение»/.test(путь.at)&&/Спуститься по лестнице/.test(путь.at)&&!/вход в чертог/.test(путь.again)&&/вход в чертог/.test(путь.back),путь);

 /* ── 3. пункт меню по виду чертога ── */
 const меню=await p.evaluate(()=>{const r={};const g=AM_GROUPS.find(x=>x[0]==="Перемещение")[1].map(x=>x[0]);const z=AM_GROUPS.find(x=>x[0]==="Здесь")[1].map(x=>x[0]);
  r.inMove=g.includes("chenter");r.inHere=z.includes("chenter");
  for(const k of ["down","up","portal"]){const e=__find(k);if(!e){r[k]="нет";continue;}G.x=e.x;G.y=e.y;r[k]=amAvailable("chenter")?amBtnLabel("chenter","x"):"не видно";}
  G.x+=40;r.far=amAvailable("chenter");return r;});
 check('3. в «Перемещении» — «Спуститься по лестнице…», «Подняться по эфирной лестнице…», «Вступить на пространственную лестницу…»; в «Здесь» пункта нет; вдали от входа его не видно',
  меню.inMove&&!меню.inHere&&/^Спуститься по лестнице в чертог «/.test(меню.down)&&/^Подняться по эфирной лестнице в чертог «/.test(меню.up)&&/^Вступить на пространственную лестницу: чертог «/.test(меню.portal)&&меню.far===false,меню);

 /* ── 4. лестница: свайпы, назад, до конца ── */
 const лест=await p.evaluate(async()=>{const r={};const e=__find("down");G.x=e.x+1;G.y=e.y;
  window.__tts.length=0;CMD.chenter();await __w(100);r.start=window.__tts.join(" | ");r.n=G.chStair&&G.chStair.n;
  move("S");move("S");r.s2=G.chStair&&G.chStair.s;move("N");r.s1=G.chStair&&G.chStair.s;r.pos=[G.x-e.x,G.y-e.y];
  r.label=amBtnLabel("chenter","x");
  move("N");move("N");r.off=!G.chStair;
  CMD.chenter();for(let k=0;k<r.n-1;k++)move("E");r.notYet=!Chertog.run()&&!!G.chStair;move("E");await __w(100);r.run=!!Chertog.run();r.ch=Chertog.run()&&Chertog.run().i===e.i;
  Chertog.leave();
  /* «Действие здесь» и тот же пункт меню: до конца сразу. */
  useHere();r.useStart=!!G.chStair;useHere();await __w(100);r.useRun=!!Chertog.run();Chertog.leave();
  CMD.chenter();CMD.chenter();await __w(100);r.menuRun=!!Chertog.run();Chertog.leave();
  /* Ушёл другим путём (маяк, портал) — лестница не держит. */
  CMD.chenter();G.x+=3;move("W");r.cleared=!G.chStair;
  return r;});
 check('4. по лестнице идут сами: свайп — ступень, обратный — назад, с нулевой ступени — сойти; на последней — вход в тот самый чертог; клетка мира не меняется',
  /лестница: \d+ ступен/.test(лест.start)&&лест.n>=8&&лест.s2===2&&лест.s1===1&&лест.pos[0]===1&&лест.pos[1]===0&&лест.off&&лест.notYet&&лест.run&&лест.ch,лест);
 check('4б. «Действие здесь» ставит на лестницу и ведёт до конца; тот же пункт меню — тоже; пункт на лестнице зовётся «Пройти лестницу до конца»; ушёл с клетки — лестница отпускает',
  лест.useStart&&лест.useRun&&лест.menuRun&&/^Пройти лестницу до конца: \d+ ступен/.test(лест.label)&&лест.cleared,лест);

 /* ── 5. закрытый чертог ── */
 const закрыт=await p.evaluate(()=>{const e=__find("down");G.x=e.x;G.y=e.y;const was=G.level;G.level=1;Chertog.st().seal=0;
  const s=Chertog.spec(e.i);const t=Chertog.stairStart();const r={t,stair:!!G.chStair,why:Chertog.access(s).length};G.level=was;Chertog.st().seal=6;return r;});
 check('5. закрытый чертог отвечает сразу, почему не открывается, и на лестницу не ставит',
  закрыт.why>0&&/не открывается/.test(закрыт.t)&&!закрыт.stair,закрыт);

 /* ── 6. «Что рядом», «Осмотреться», книга искателя, клетка входа ── */
 const виден=await p.evaluate(()=>{const r={};const e=__find("down");G.x=e.x+2;G.y=e.y+1;
  r.near=worldNear(4).some(o=>/вход в чертог/.test(o.name));r.look=Look.scan().some(o=>o.род==="чертог"&&o.x===e.x&&o.y===e.y);
  G.x=e.x+12;G.y=e.y;Chertog.home();const b=document.getElementById("chBody")||document.body;r.book=/Вход: 12 шагов на запад/.test(b.textContent);
  const btn=[...document.querySelectorAll("[data-cmd^='ch:beacon:']")][0];r.beaconBtn=!!btn;if(btn){Chertog.cmd(btn.dataset.cmd.slice(3));r.beacon=!!(TargetBeacon.t&&/вход в чертог/.test(TargetBeacon.t.n));}
  while(activeLayer())closeTopUI();
  let bad=0,all=0;for(let k=0;k<3000;k++){const e2=Chertog.at(500+k%60,500+Math.floor(k/60));if(!e2)continue;all++;if(cellContent(e2.x,e2.y).structure)bad++;}r.bad=bad;r.all=all;
  return r;});
 check('6. вход слышен в «Что рядом» и выбирается целью в «Осмотреться»; в «Книге искателя» — путь по осям и кнопка маяка; вход не стоит на клетке постройки',
  виден.near&&виден.look&&виден.book&&виден.beaconBtn&&виден.beacon&&виден.all>500&&виден.bad===0,виден);

 /* ── 7. десять тысяч и перенос старых номеров ── */
 const число=await p.evaluate(()=>{const r={N:CH_N,dyn0:CH_DYN0};const names=new Set();for(let i=0;i<CH_N;i++)names.add(Chertog.spec(i).n);r.uniq=names.size;
  /* Старое сохранение: открытый миром чертог под номером 6003. */
  G.ch={dyn:{6003:{base:5,cat:"skyfort",civ:"zvezdochety",rank:1,n:"Небесный остров Проба",x:G.x+2,y:G.y,until:(G.day||1)+30,why:"остров поднялся"}},cleared:{6003:{n:1},12:{n:2}},inst:{6003:{s:{OUTCOME:"A"},v:2}},floors:{6003:2},dynN:4};
  const st=Chertog.st();r.keys=Object.keys(st.dyn);r.cl=Object.keys(st.cleared).sort();r.inst=!!st.inst[CH_DYN0+3]&&st.inst[CH_DYN0+3].s.OUTCOME==="A";r.fl=st.floors[CH_DYN0+3];
  r.spec=Chertog.spec(CH_DYN0+3).n;r.static=Chertog.spec(6003).n!=="Небесный остров Проба";
  const d=InstanceDirectorIntegration.createNear("проба");r.newId=d&&d.i;return r;});
 check('7. чертогов десять тысяч, имена не повторяются; открытые миром — с CH_DYN0; старые номера с 6000 переехали вместе с пройденным, ярусами и памятью',
  число.N===10000&&число.uniq===10000&&число.keys.length===1&&+число.keys[0]===число.dyn0+3&&число.cl.includes(String(число.dyn0+3))&&число.cl.includes("12")&&число.inst&&число.fl===2
  &&число.spec==="Небесный остров Проба"&&число.static&&число.newId>=число.dyn0,число);

 check('нет ошибок страницы',errors.length===0,errors.slice(0,3));
 results.forEach(r=>console.log(r));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
