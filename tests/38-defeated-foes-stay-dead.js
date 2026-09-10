/* ════════════════════════════════════════════════════════════════════════
   УБИТАЯ ТВАРЬ ОСТАЁТСЯ МЁРТВОЙ

   Победа над зверем в открытом мире не оставляла в игре никакого следа:
   cellContent выводит тварь из координат заново при каждом обращении, а
   G.cleared по-настоящему помечал только обысканные руины. Достаточно было
   после победы и сбора добычи, не убирая оружия, взмахнуть ещё раз в любую
   сторону — и та же тварь дралась снова, как будто и не умирала: полный бой,
   опыт и добыча по второму разу. Взмах оказался единственным местом в игре,
   где не спрашивали G.cleared.

   Здесь проверяется и обратное: гибель гостя случайного события и гибель
   жителя подземелья НЕ должны разгонять настоящего зверя с той же клетки —
   иначе одна стычка с разбойником в дороге очищала бы мир задаром.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 await page.evaluate(()=>{settings.effects=0;settings.music=0;
  window.__said=[];if(!window.__origSay)window.__origSay=Speech.say;
  Speech.say=t=>{window.__said.push(String(t));};});

 const прогон=await page.evaluate(async()=>{
  const out={};
  const силач=()=>{G.level=40;G.str=400;G.hp=G.hpMax=4000;
   G.equip.weapon={id:9,name:"Меч проверки",type:"Меч",val:200};G.weaponDrawn=true;};
  const найтиТварь=()=>{for(let r=0;r<300;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    const x=1000+dx,y=1000+dy;const c=cellContent(x,y);
    if(c.monster&&!c.structure&&!c.res)return {x,y};}return null;};
  const добить=async()=>{for(let i=0;i<25&&G.inCombat;i++){fight("atk");await new Promise(z=>setTimeout(z,15));}};

  /* ── Победа над хозяйкой клетки ── */
  const т=найтиТварь();
  if(!т)return {нетТвари:true};
  G.place=null;G.ship=null;G.x=т.x;G.y=т.y;силач();
  delete G.cleared[т.x+","+т.y];contentCache.clear();
  out.тварь=cellContent(т.x,т.y).monster.n;
  startCombat(cellContent(т.x,т.y));
  out.своя=G.combat.own===true;
  await добить();
  out.победа=!G.inCombat&&!!(G.loot&&G.loot.length);
  takeLoot();await new Promise(z=>setTimeout(z,60));
  out.послеПобеды={монстрВКлетке:!!cellContent(т.x,т.y).monster,
   очищена:!!G.cleared[т.x+","+т.y],оружиеВРуке:!!G.weaponDrawn};

  /* ── ТОТ САМЫЙ ЖЕСТ: взмах, не убирая оружия ── */
  const золото=G.gold,опыт=G.xp,уровень=G.level;
  window.__said=[];
  weaponSwing("E");await new Promise(z=>setTimeout(z,400));
  out.взмах={бой:!!G.inCombat,
   ожила:window.__said.some(t=>/Бой!|преграждает путь/.test(t)),
   опытТотЖе:G.xp===опыт&&G.level===уровень,
   золотоТоЖе:G.gold===золото,
   добычиНет:!(G.loot&&G.loot.length),
   сказано:window.__said.slice(0,3)};

  /* ── Взмах в каждую из четырёх сторон ── */
  let ожилаВСторону=null;
  for(const d of ["N","S","E","W"]){
   G.weaponDrawn=true;window.__said=[];
   weaponSwing(d);await new Promise(z=>setTimeout(z,180));
   if(G.inCombat||window.__said.some(t=>/Бой!|преграждает путь/.test(t))){ожилаВСторону=d;break;}}
  out.всеСтороны=ожилаВСторону;

  /* ── Возвращение на клетку своим ходом ── */
  G.x=т.x+3;G.y=т.y;window.__said=[];
  G.x=т.x;G.y=т.y;arrive("W");await new Promise(z=>setTimeout(z,150));
  out.возвращение={бой:!!G.inCombat,
   ожила:window.__said.some(t=>/Бой!|преграждает путь/.test(t))};

  /* ── Пережило очистку кэша клеток и перезагрузку сохранения ── */
  saveGame(true);loadGame();contentCache.clear();
  G.x=т.x;G.y=т.y;G.weaponDrawn=true;window.__said=[];
  weaponSwing("N");await new Promise(z=>setTimeout(z,300));
  out.послеЗагрузки={очищена:!!G.cleared[т.x+","+т.y],
   бой:!!G.inCombat,ожила:window.__said.some(t=>/Бой!|преграждает путь/.test(t))};

  /* ── Гость случайного события клетку не освобождает ── */
  contentCache.clear();
  const т2=найтиТварь();
  G.place=null;G.ship=null;G.x=т2.x;G.y=т2.y;силач();
  delete G.cleared[т2.x+","+т2.y];
  const хозяйка=cellContent(т2.x,т2.y).monster.n;
  startCombat({x:G.x,y:G.y,monster:{...MONSTERS[0],n:"Разбойник в дороге",lvl:2,hp:10,dmg:1,xp:5,gold:5}});
  const гостьСвоя=G.combat.own;
  await добить();takeLoot();await new Promise(z=>setTimeout(z,60));
  out.гость={своя:гостьСвоя,хозяйка,
   клеткаОчищена:!!G.cleared[т2.x+","+т2.y],
   хозяйкаНаМесте:!!cellContent(т2.x,т2.y).monster};

  /* ── Бой в подземелье клетку мира не освобождает ── */
  contentCache.clear();
  const т3=найтиТварь();
  G.x=т3.x;G.y=т3.y;delete G.cleared[т3.x+","+т3.y];
  G.place={kind:"dungeon",bx:т3.x,by:т3.y,stype:"ruins",name:"проверка",depth:2,x:2,y:2};
  силач();
  startCombat({x:G.x,y:G.y,monster:{...MONSTERS[0],n:"Житель глубины",lvl:2,hp:10,dmg:1,xp:5,gold:5}});
  const данжСвоя=G.combat.own;
  await добить();takeLoot();await new Promise(z=>setTimeout(z,60));
  out.данж={своя:данжСвоя,клеткаОчищена:!!G.cleared[т3.x+","+т3.y],
   хозяйкаНаМесте:!!cellContent(т3.x,т3.y).monster};
  G.place=null;G.inCombat=false;

  /* ── ЛОГОВО В ПОДЗЕМЕЛЬЕ ── */
  const lvl=genLevel(1700,1700,3,"cave_entrance");
  let логово=null;
  for(let y=0;y<lvl.g.length&&!логово;y++)for(let x=0;x<lvl.g[y].length;x++)
   if(lvl.g[y][x]==="M"){логово={x,y};break;}
  if(логово){
   const место=d=>({kind:"dungeon",bx:1700,by:1700,stype:"cave_entrance",name:"проверка",depth:d,x:логово.x,y:логово.y});
   /* «действие здесь», стоя на живом логове, обязано начать бой, а не
      объявить клетку пустой */
   G.marks={};G.hp=G.hpMax=4000;силач();
   G.place=место(3);G.inCombat=false;window.__said=[];
   useHere();await new Promise(z=>setTimeout(z,80));
   out.логовоПодНогами={бой:!!G.inCombat,
    пусто:window.__said.some(t=>/[Пп]од ногами пусто|Здесь пусто/.test(t)),
    плитка:tileAt(curLevel(),логово.x,логово.y)};
   /* победа помечает логово мёртвым, повтор боя не даёт */
   for(let i=0;i<25&&G.inCombat;i++){fight("atk");await new Promise(z=>setTimeout(z,15));}
   takeLoot();await new Promise(z=>setTimeout(z,60));
   const метка=placeMark(логово.x,логово.y);
   G.weaponDrawn=true;G.inCombat=false;window.__said=[];
   useHere();await new Promise(z=>setTimeout(z,60));
   const повторБой=!!G.inCombat;
   G.weaponDrawn=true;window.__said=[];
   weaponSwing("E");await new Promise(z=>setTimeout(z,300));
   out.логовоПослеПобеды={метка,плитка:tileAt(curLevel(),логово.x,логово.y),
    повторБой,взмахБой:!!G.inCombat};
   /* побег НЕ должен оставлять отметку «добиваем это логово» висеть:
      иначе победа на другой глубине помечает мёртвым чужое логово */
   G.marks={};G.hp=G.hpMax=4000;G.agi=200;
   G.place=место(3);G.inCombat=false;G.place.pendingKill=null;
   startInsideCombat(логово.x,логово.y);
   for(let i=0;i<40&&G.inCombat;i++){fight("flee");await new Promise(z=>setTimeout(z,15));}
   const меткаПослеПобега=G.place.pendingKill;
   G.place.x=curLevel().entry.x;G.place.y=curLevel().entry.y;
   changeDepth(1);
   const глубже=G.place.depth;
   силач();G.inCombat=false;
   startCombat({x:G.x,y:G.y,monster:{...MONSTERS[0],n:"Случайный",lvl:2,hp:10,dmg:1,xp:5,gold:5}});
   for(let i=0;i<25&&G.inCombat;i++){fight("atk");await new Promise(z=>setTimeout(z,15));}
   takeLoot();await new Promise(z=>setTimeout(z,60));
   out.побег={отметкаСнята:!меткаПослеПобега,глубже,
    чужаяПлиткаПомечена:G.marks[markKey(1700,1700,глубже,логово.x,логово.y)]||null,
    своеЛоговоЖиво:!G.marks[markKey(1700,1700,3,логово.x,логово.y)]};
  }
  G.place=null;G.inCombat=false;
  return out;});

 check('в мире нашлась тварь и бой с ней начался как с хозяйкой клетки',
  !прогон.нетТвари&&прогон.своя===true,{тварь:прогон.тварь,своя:прогон.своя});
 check('победа закончила бой и положила добычу',прогон.победа===true);
 check('после победы тварь исчезла с клетки, а клетка помечена очищенной',
  прогон.послеПобеды&&!прогон.послеПобеды.монстрВКлетке&&прогон.послеПобеды.очищена,
  прогон.послеПобеды);
 check('оружие осталось в руке — именно этот случай и ломался',
  прогон.послеПобеды&&прогон.послеПобеды.оружиеВРуке===true,прогон.послеПобеды);
 check('взмах оружием после победы НЕ поднимает убитую тварь',
  прогон.взмах&&!прогон.взмах.бой&&!прогон.взмах.ожила,прогон.взмах);
 check('второй бой не начислил ни опыта, ни золота, ни добычи',
  прогон.взмах&&прогон.взмах.опытТотЖе&&прогон.взмах.золотоТоЖе&&прогон.взмах.добычиНет,
  прогон.взмах);
 check('взмах в любую из четырёх сторон одинаково безопасен',
  прогон.всеСтороны===null,{ожилаВСторону:прогон.всеСтороны});
 check('возвращение на клетку своим ходом тоже не поднимает тварь',
  прогон.возвращение&&!прогон.возвращение.бой&&!прогон.возвращение.ожила,прогон.возвращение);
 check('смерть твари переживает очистку кэша клеток и перезагрузку сохранения',
  прогон.послеЗагрузки&&прогон.послеЗагрузки.очищена&&!прогон.послеЗагрузки.бой&&!прогон.послеЗагрузки.ожила,
  прогон.послеЗагрузки);
 check('гибель гостя случайного события не разгоняет хозяйку той же клетки',
  прогон.гость&&прогон.гость.своя===false&&!прогон.гость.клеткаОчищена&&прогон.гость.хозяйкаНаМесте,
  прогон.гость);
 check('бой в подземелье не освобождает клетку мира над ним',
  прогон.данж&&прогон.данж.своя===false&&!прогон.данж.клеткаОчищена&&прогон.данж.хозяйкаНаМесте,
  прогон.данж);

 check('живое логово под ногами начинает бой, а не объявляется пустой клеткой',
  прогон.логовоПодНогами&&прогон.логовоПодНогами.бой&&!прогон.логовоПодНогами.пусто,
  прогон.логовоПодНогами);
 check('убитое логово помечено мёртвым, стало полом и больше не нападает',
  прогон.логовоПослеПобеды&&прогон.логовоПослеПобеды.метка==="dead"&&
  прогон.логовоПослеПобеды.плитка==="."&&!прогон.логовоПослеПобеды.повторБой&&
  !прогон.логовоПослеПобеды.взмахБой,прогон.логовоПослеПобеды);
 check('побег из логова не оставляет отметку висеть на другой глубине',
  прогон.побег&&прогон.побег.отметкаСнята&&!прогон.побег.чужаяПлиткаПомечена&&
  прогон.побег.своеЛоговоЖиво,прогон.побег);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
