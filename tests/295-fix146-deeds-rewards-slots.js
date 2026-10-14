/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 295: 14.6 — ИТОГ ЗАДАНИЯ, НАГРАДЫ, ВЕЩИ У ЛЕСТНИЦЫ, СЛОТЫ ЗАКЛИНАНИЙ

   Просьбы игрока: «при выполнении квеста синтезатор не озвучивает, что
   сделано, потому что его перебивает другая фраза» — и так у всех новых
   квестов; «нет наград за квесты: зачем игрок чинит генератор или
   разгадывает музыкальную последовательность»; «у чаши омовения перед
   лестницей игра посылает на лестницу»; «открывать загадки двойным
   касанием, как сундуки»; «дай возможность менять заклинание в уже
   существующих слотах».
   1. Итог задания и окно того же действия: итог звучит целиком, окно —
      сразу за ним; новое действие игрока по-прежнему обрывает речь.
   2. Двойное касание у загадки яруса открывает саму загадку.
   3. Решённая загадка: итог с наградой и опытом звучит до окна.
   4. Механизм яруса: первая починка — награда (опыт, золото, материал),
      повторная — нет.
   5. Вещи яруса не стоят вплотную к лестнице и выходу.
   6. На лестнице с вещью вплотную двойное касание открывает вещь,
      а лестница — кнопкой в её окне.
   7. Слоты заклинаний: прежняя раскладка сохранена; в слот ставится любое
      изученное заклинание, и жест слота творит именно его; клавиша слота
      (Windows) — тоже; «Магия» → «Слоты заклинаний».
   8. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  /* обозы и дозоры на тракте говорят сами, в свой такт — проверке очереди речи они чужие (как в наборах 39, 205) */
  try{CaravanRoll.tick=()=>false;PatrolMarch.tick=()=>false;}catch(_){}G.level=14;G.hpMax=400;G.hp=400;G.mana=200;G.manaMax=200;G.gold=500;
  window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{window.__said.push(String(t));return s0(t,o);};
  /* синтезатор, который кончает фразу только по команде проверки */
  window.ДОСКАЗАНО=[];window.ОБОРВАНО=[];const f0=Speech._finish.bind(Speech);
  Speech._finish=(m,st,...r)=>{if(st==="COMPLETED")ДОСКАЗАНО.push(m.text);return f0(m,st,...r);};
  const c0=Speech._cut.bind(Speech);Speech._cut=(m,st)=>{if(m)ОБОРВАНО.push(m.text);return c0(m,st);};
  window.__a0=Speech._adapter.bind(Speech);
  window.ФАЛЬШ=()=>{Speech._adapter=()=>({speak:()=>true,cancel(){}});};window.НАСТОЯЩ=()=>{Speech._adapter=__a0;};
  window.ДОГОВОРИТЬ=async n=>{for(let i=0;i<(n||30);i++){if(Speech.current)Speech._finish(Speech.current,"COMPLETED");await new Promise(z=>setTimeout(z,30));if(!Speech.current&&!Speech.queue.length)break;}};});

 /* ── 1 ── */
 const р1=await p.evaluate(async()=>{Speech.stop();ФАЛЬШ();ДОСКАЗАНО.length=0;ОБОРВАНО.length=0;
  narrate("Загадка решена! 40 золотых; опыт +26.",{interrupt:false,итог:true});
  narrate("Ярус подземелья. Подземелье «Проба», ярус 3.",{interrupt:true,pri:1,cat:"ui"});
  await ДОГОВОРИТЬ();const один=ДОСКАЗАНО.slice(),обр=ОБОРВАНО.slice();
  /* новое действие (другой такт) обрывает как прежде */
  Speech.stop();ДОСКАЗАНО.length=0;ОБОРВАНО.length=0;
  narrate("Поручение «Проба» выполнено: опыт +38; +60 золота.",{interrupt:false,итог:true});
  await new Promise(z=>setTimeout(z,40));
  narrate("Меню действий.",{interrupt:true,pri:1,cat:"ui"});
  await ДОГОВОРИТЬ();const два=ДОСКАЗАНО.slice(),обр2=ОБОРВАНО.slice();Speech.stop();НАСТОЯЩ();
  return {один,обр,два,обр2};});
 check('1. итог и окно того же действия: итог целиком, окно следом; новое действие обрывает как прежде',
  р1.один.length===2&&/^Загадка решена/.test(р1.один[0])&&/^Ярус подземелья/.test(р1.один[1])&&!р1.обр.some(t=>/Загадка/.test(t))
  &&р1.два.length===1&&/^Меню действий/.test(р1.два[0])&&р1.обр2.some(t=>/Поручение/.test(t)),р1);

 /* вход в подземелье с загадками и механизмами */
 const вход=await p.evaluate(async()=>{let c=null;
  for(let x=1000;x<90000&&!c;x+=37)for(let y=1000;y<1600&&!c;y+=41){const cc=cellContent(x,y);
   if(cc.structure&&!cc.structure.onlyAir&&PLACE_KIND[cc.structure.type]==="dungeon"){const s=Deep.spec(x,y,cc.structure.type);
    if(s.N>=6&&s.puzzles.some(q=>["bells","levers","runes"].includes(q.type)&&q.tier<=s.N)&&s.mechs.length)c={x,y,t:cc.structure.type};}}
  if(!c)return {none:1};window.__dg=c;G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();
  const s=Deep.spec(c.x,c.y,c.t);const pz=s.puzzles.find(q=>["bells","levers","runes"].includes(q.type));
  changeDepth(pz.tier-G.place.depth,{bypass:true});await new Promise(r=>setTimeout(r,1500));while(activeLayer())closeTopUI();
  return {N:s.N,tier:pz.tier,pz:pz.id,type:pz.type};});
 check('подземелье с загадкой и механизмом найдено',!вход.none,вход);

 /* ── 2–3 ── */
 const р2=await p.evaluate(async()=>{const s=Deep.here();const x=Deep.st(s);const d=G.place.depth;
  const e=Deep.els(s,x,d).find(z=>z.t==="puzzle");const pz=e.ref;delete x.solved[pz.id];x.inp[pz.id]=[];
  G.place.x=e.x;G.place.y=e.y+((tileAt(curLevel(),e.x,e.y+1)==="#")?-1:1);
  const ok=useHere();const title=(document.getElementById("dpTitle")||{}).textContent||"";const body=(document.getElementById("dpBody")||{}).innerHTML||"";
  const xp0=Number(G.xp)||0;Speech.stop();ФАЛЬШ();ДОСКАЗАНО.length=0;ОБОРВАНО.length=0;__said.length=0;
  /* каждый шаг — отдельное касание игрока */
  const ans=pz.rev?pz.ans.slice().reverse():pz.ans;
  for(const k of ans.slice(0,-1)){Deep.cmd(`pzin:${pz.id}:${k}`);await new Promise(z=>setTimeout(z,40));}
  await ДОГОВОРИТЬ(40);ДОСКАЗАНО.length=0;ОБОРВАНО.length=0;
  Deep.cmd(`pzin:${pz.id}:${ans[ans.length-1]}`);
  await ДОГОВОРИТЬ(40);const said=__said.filter(t=>/Загадка решена/.test(t));const доск=ДОСКАЗАНО.slice();Speech.stop();НАСТОЯЩ();
  while(activeLayer())closeTopUI();
  return {ok,title,прямо:title===pz.n&&/pz(in|play|ans):/.test(body),solved:!!x.solved[pz.id],xp:(Number(G.xp)||0)-xp0,said,
   первым:доск.findIndex(t=>/Загадка решена/.test(t)),окно:доск.findIndex(t=>/^Ярус подземелья|^Звуковая|^Порядок|^Руны/.test(t)),доск:доск.slice(0,4)};});
 check('2. двойное касание у загадки открывает саму загадку',р2.ok&&р2.прямо,р2);
 check('3. решённая загадка: награда и опыт звучат целиком и раньше окна',р2.solved&&р2.xp>0&&р2.said.length===1&&/опыт \+\d+/.test(р2.said[0])
  &&р2.первым===0,р2);

 /* ── 4 ── */
 const р4=await p.evaluate(async()=>{const s=Deep.here();const x=Deep.st(s);let m=null;
  for(let i=1;i<=s.N&&!m;i++)m=s.mechs.find(z=>z.tier===i&&!["valve","pump","core","guard","door","space","lift"].includes(z.kind));
  if(!m)return {none:1};
  if(m.tier!==G.place.depth){changeDepth(m.tier-G.place.depth,{bypass:true});await new Promise(r=>setTimeout(r,1500));while(activeLayer())closeTopUI();}
  const e=Deep.els(s,x,m.tier).find(z=>z.t==="mech"&&z.ref.id===m.id);G.place.x=e.x;G.place.y=e.y;
  delete (x.mrew||{})[m.id];Deep.setM(x,m,"damaged");G.inv["древняя шестерня"]=3;
  const g0=G.gold,xp0=Number(G.xp)||0;__said.length=0;Deep.mechAct(m.id,"repair");const раз=__said.join(" | ");const st1=Deep.mst(x,m);
  const g1=G.gold,xp1=Number(G.xp)||0;
  Deep.setM(x,m,"damaged");__said.length=0;Deep.mechAct(m.id,"repair");const два=__said.join(" | ");
  while(activeLayer())closeTopUI();
  return {kind:m.kind,st1,раз:раз.slice(0,300),два:два.slice(0,300),gold:g1-g0,xp:xp1-xp0,again:(Number(G.xp)||0)-xp1};});
 check('4. механизм яруса: первая починка — награда (опыт, золото, материал), повторная — нет',!р4.none&&р4.st1==="ok"&&/Награда за работу: опыт \+\d+/.test(р4.раз)
  &&р4.gold>0&&р4.xp>0&&!/Награда за работу/.test(р4.два)&&р4.again===0,р4);

 /* ── 5 ── */
 const р5=await p.evaluate(()=>{const s=Deep.here();let bad=0,all=0;
  for(let i=1;i<=s.N;i++){const lvl=genLevel(s.bx,s.by,i,s.stype);Deep.posCache.delete(s.key+":"+i);
   for(const q of Deep.spots(s,i)){all++;for(let j=-1;j<=1;j++)for(let k=-1;k<=1;k++){const c=(lvl.g[q.y+j]||[])[q.x+k];if(c==="<"||c===">"||c==="G"){bad++;j=k=9;}}}}
  return {bad,all};});
 check('5. вещи яруса не стоят вплотную к лестнице и выходу',р5.all>0&&р5.bad===0,р5);

 /* ── 6 ── */
 const р6=await p.evaluate(async()=>{const s=Deep.here();const x=Deep.st(s);const d=G.place.depth;const lvl=curLevel();
  let st=null;for(let y=0;y<lvl.h&&!st;y++)for(let xx=0;xx<lvl.w&&!st;xx++)if(lvl.g[y][xx]==="<"||lvl.g[y][xx]===">")st={x:xx,y};
  const e=Deep.els(s,x,d).find(z=>z.t==="puzzle"||z.t==="mech"||z.t==="lock");
  G.place.x=st.x;G.place.y=st.y;const e0=Deep.elNear;Deep.elNear=()=>({e,d:1});
  let полёт=0;const sf=startFlight;startFlight=function(){полёт++;return true;};
  const depth0=G.place.depth;const ok=useHere();const title=(document.getElementById("dpTitle")||{}).textContent||"";const body=(document.getElementById("dpBody")||{}).innerHTML||"";
  const кнопка=/dp:stairs/.test(body);const до=полёт;Deep.cmd("stairs");const после=полёт;
  startFlight=sf;Deep.elNear=e0;while(activeLayer())closeTopUI();
  return {tile:lvl.g[st.y][st.x],ok,title,n:e.n,кнопка,до,после,depth:G.place.depth===depth0};});
 check('6. на лестнице с вещью вплотную двойное касание открывает вещь, лестница — кнопкой',р6.ok&&р6.до===0&&р6.кнопка&&р6.после===1&&р6.depth,р6);

 /* ── 7 ── */
 const р7=await p.evaluate(async()=>{G.place=null;while(activeLayer())closeTopUI();
  const ci=SPELLS.findIndex((sp,i)=>i>=12&&sp&&sp.n);const sp=SPELLS[ci];G.spells=Array.from(new Set((G.spells||[]).concat([SPELLS[0].n,sp.n])));
  delete G.mslots;const def=mslots().slice(0,3);
  const casts=[];const cs=castSpell;castSpell=function(i){casts.push(i);return true;};
  safeOpenMagicPanel({pick:0});const btn=[...document.querySelectorAll("#magicSlots button")].find(b=>b.textContent.startsWith(sp.n+","));
  if(btn)btn.click();const slot0=G.mslots[0];const panel=[...document.querySelectorAll("#magicSlots button")].map(b=>b.textContent).slice(0,13);
  closeMagicPanel();safeOpenMagicPanel();magicSlotSwipe(1,"N");const swipe=casts.slice();
  const kb=(KB_ACTIONS.find(a=>a.id==="slot1")||{}).run;casts.length=0;if(kb)kb();const клав=casts.slice();
  closeMagicPanel();castSpell=cs;
  const меню=AM_GROUPS.find(g=>g[0]==="Магия")[1].some(z=>z[0]==="mslots")&&amAvailable("mslots");
  return {def,ci,sp:sp.n,slot0,panel,swipe,клав,меню,сменить:panel.includes("Сменить заклинание в слоте")};});
 check('7. слоты заклинаний: прежняя раскладка; в слот — любое изученное; жест и клавиша творят его; «Магия» → «Слоты заклинаний»',
  р7.def[0]===await p.evaluate(()=>SPELLS[0].n)&&р7.slot0===р7.sp&&р7.panel[0].startsWith("1. "+р7.sp)&&р7.сменить&&р7.swipe[0]===р7.ci&&р7.клав[0]===р7.ci&&р7.меню,р7);

 check('8. ошибок страницы нет',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
