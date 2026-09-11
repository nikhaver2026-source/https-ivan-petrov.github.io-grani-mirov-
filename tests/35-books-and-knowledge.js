/* ════════════════════════════════════════════════════════════════════════
   КНИГИ, ЗНАНИЯ И ОБСТАНОВКА

   Мир был полон вещей, на которые можно смотреть, и почти пуст для того,
   кто хочет в нём разобраться. Набор проверяет то, что это исправляет:
   реестр из без малого шести тысяч разных страниц, носители знаний в
   комнатах, три вида награды за изучение, одноразовые свитки из глубины,
   четырнадцать навыков и сорок с лишним предметов обстановки, с каждым из
   которых можно что-то сделать. Сама обстановка проверяется вглубь в наборе
   40: здесь только то, что она есть, полна и никого не роняет. Отдельно проверяется главное правило игры:
   одно касание называет, изучает только двойное.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 const cdp=await ctx.newCDPSession(page);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 const tap=async(x,y,ms=40)=>{
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(ms);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[{x,y,id:0}]});
  await page.waitForTimeout(140);};

 /* ── 1. Реестр: размер, целостность, уникальность ── */
 const reg=await page.evaluate(()=>{
  const total=knowTotal();
  const titles=new Set();const плохие=[];let абзацев=0;
  for(let i=0;i<total;i++){
   const e=knowEntry(i);
   if(!e){плохие.push(i+": страницы нет");continue;}
   if(!e.title||!e.body||!e.body.length){плохие.push(i+": пусто");continue;}
   if(e.body.some(x=>typeof x!=="string"||!x.trim())){плохие.push(i+": пустой абзац");continue;}
   if(/undefined|NaN|\[object/.test(e.title+" "+e.body.join(" "))){плохие.push(i+": "+e.title);continue;}
   абзацев+=e.body.length;
   titles.add(e.title);}
  return {total,уникальных:titles.size,плохие:плохие.slice(0,6),плохихВсего:плохие.length,абзацев,
   полок:KNOW_SHELVES.length,
   раскладка:knowLayout().rows.map(r=>({id:r.sh.id,предметов:r.subj.length,сторон:r.sh.asp.length}))};});
 check('в реестре около шести тысяч страниц',reg.total>=5000,reg.total);
 check('ни одна страница не пуста и не содержит дыр в подстановке',
  !reg.плохихВсего,{всего:reg.плохихВсего,примеры:reg.плохие});
 check('все заголовки страниц различны',reg.уникальных===reg.total,
  {уникальных:reg.уникальных,всего:reg.total});
 check('пятнадцать полок, у каждой свои предметы и стороны',
  reg.полок===15&&reg.раскладка.every(r=>r.предметов>=5&&r.сторон>=10),reg.раскладка);
 check('текста в реестре не меньше десяти тысяч абзацев',reg.абзацев>=10000,reg.абзацев);

 /* Один и тот же шкаф в одном и том же доме содержит одно и то же. */
 const стаб=await page.evaluate(()=>{
  G.place={kind:"house",bx:1234,by:567,stype:"school",name:"Проба",depth:0,x:3,y:4};
  const a=knowledgeAt(3,4),b=knowledgeAt(3,4);
  const c=knowledgeAt(5,6);
  G.place=null;
  return {одна:a&&b&&a.n===b.n&&a.obj.id===b.obj.id,другая:a&&c&&a.n!==c.n,
   имя:a&&a.obj.n,страница:a&&a.entry.title};});
 check('одна и та же клетка всегда содержит одну и ту же книгу',стаб.одна===true,стаб);
 check('соседняя клетка содержит другую',стаб.другая===true,стаб);

 /* ── 2. Носители знаний расставлены по миру ── */
 const место=await page.evaluate(()=>{
  const types=["castle","village","port","tavern","temple","forge","market","school",
   "clanhall","tower","ruins","cave_entrance"];
  const out={};const пусто=[];
  types.forEach((st,ti)=>{
   let K=0,X=0;
   for(let s=0;s<15;s++){
    const x=300+s*71+ti*911,y=400+s*43+ti*577;
    const l=genLevel(x,y,PLACE_KIND[st]==="dungeon"?1:0,st);
    for(let yy=0;yy<l.h;yy++)for(let x2=0;x2<l.w;x2++){
     if(l.g[yy][x2]==="K")K++;if(l.g[yy][x2]==="X")X++;}}
   out[st]={книг:+(K/15).toFixed(1),вещей:+(X/15).toFixed(1)};
   if(K<15)пусто.push(st+": книг "+K+" на 15 домов");
   if(X<15)пусто.push(st+": вещей "+X+" на 15 домов");});
  const глубина={};
  for(let d=1;d<=5;d++){let K=0;
   for(let s=0;s<10;s++){const l=genLevel(7000+s*13,8000+s*17,d,"ruins");
    for(let yy=0;yy<l.h;yy++)for(let x2=0;x2<l.w;x2++)if(l.g[yy][x2]==="K")K++;}
   глубина[d]=+(K/10).toFixed(1);}
  return {out,пусто,глубина};});
 check('в каждой постройке есть и книги, и обстановка',!место.пусто.length,место.пусто);
 check('в школе магии и башне книг больше, чем в кузнице',
  место.out.school.книг>место.out.forge.книг&&место.out.tower.книг>место.out.forge.книг,
  {школа:место.out.school.книг,башня:место.out.tower.книг,кузня:место.out.forge.книг});
 check('в подземельях книги есть на каждом ярусе, и глубже их больше',
  Object.values(место.глубина).every(v=>v>=1)&&место.глубина[5]>=место.глубина[1],место.глубина);

 /* ── 3. Изучение: три вида награды ── */
 const учёба=await page.evaluate(()=>{
  const said=[];const o=Speech.say;Speech.say=t=>said.push(String(t));
  const найти=(st,depth)=>{
   G.place=null;
   G.place={kind:depth?"dungeon":(PLACE_KIND[st]||"house"),bx:900,by:900,stype:st,
    name:"Проба",depth:depth||0,x:1,y:1};
   const l=curLevel();
   for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]==="K"){G.place.x=x;G.place.y=y;return true;}
   return false;};
  const out={};
  G.lore=[];G.skills=[];G.marks={};G.items=[];G.spells=["Искра"];
  out.нашли=найти("school",0);
  const до=knowRead().length;
  said.length=0;
  out.имяДо=tileLabel("K",G.place.x,G.place.y);
  useHere();
  out.прочитано=knowRead().length>до;
  out.имяПосле=tileLabel("K",G.place.x,G.place.y);
  out.окно=!document.getElementById("modal-read").hidden;
  out.реплика=said[0]||"";
  out.пунктовВокне=cursorItems(document.getElementById("modal-read")).length;
  const после=knowRead().length;
  useHere();
  out.повторНеДаётНового=knowRead().length===после;
  closeTopUI();
  out.закрылось=document.getElementById("modal-read").hidden;
  Speech.say=o;
  return out;});
 check('носитель знаний называется своим именем, а не «книги и свитки»',
  /полка|шкаф|стол|карт|пергамент|гримуар|скрижаль|том|ларь|аналой/i.test(учёба.имяДо),учёба.имяДо);
 check('двойное касание изучает и открывает окно чтения',
  учёба.прочитано===true&&учёба.окно===true,учёба);
 check('в окне чтения есть по чему ходить свайпом',учёба.пунктовВокне>=3,учёба.пунктовВокне);
 check('изученное помечается и второй раз награды не даёт',
  /изучено/i.test(учёба.имяПосле)&&учёба.повторНеДаётНового===true,
  {имя:учёба.имяПосле,повтор:учёба.повторНеДаётНового});
 check('книга закрывается штатным жестом закрытия',учёба.закрылось===true);
 check('изучение объявляется вслух с названием предмета',
  /Изучено/.test(учёба.реплика),учёба.реплика.slice(0,90));

 /* Три вида награды встречаются все: перебираем реестр целиком. */
 const виды=await page.evaluate(()=>{
  const c={lore:0,spell:0,skill:0,legend:0};
  const total=knowTotal();
  for(let i=0;i<total;i++){c[knowReward(i,0).type]++;}
  const глубоко={lore:0,spell:0,skill:0,legend:0};
  for(let i=0;i<total;i++){глубоко[knowReward(i,4).type]++;}
  return {наверху:c,вглубине:глубоко};});
 check('наверху попадаются знание, заклинание и навык, но не легендарный свиток',
  виды.наверху.lore>0&&виды.наверху.spell>0&&виды.наверху.skill>0&&виды.наверху.legend===0,виды.наверху);
 check('легендарные свитки бывают только в глубине',виды.вглубине.legend>0,виды.вглубине);

 /* ── 4. Навыки ── */
 const нав=await page.evaluate(()=>{
  const плохие=[];
  SKILLS.forEach(s=>{
   if(!s.n||!s.d)плохие.push(s.id+": нет имени или описания");
   G.skills=[];
   try{learnSkill(s.id);}catch(e){плохие.push(s.id+": "+e.message);}
   if(!hasSkill(s.id))плохие.push(s.id+": не выучился");
   G.skills=[];learnSkill(s.id);
   if(learnSkill(s.id)!==false)плохие.push(s.id+": выучился дважды");});
  /* Навыки должны быть слышны в карточке героя. */
  G.skills=["mining","bookman"];
  let вКарточке=false;
  try{renderCharacter();
   вКарточке=/Горное дело/.test(document.getElementById("charStats").textContent)
    &&/Книжник/.test(document.getElementById("charStats").textContent);}catch(e){плохие.push("карточка: "+e.message);}
  return {плохие,всего:SKILLS.length,вКарточке};});
 check('навыков четырнадцать, каждый учится один раз и имеет описание',
  !нав.плохие.length&&нав.всего===14,{плохие:нав.плохие.slice(0,4),всего:нав.всего});
 check('навыки перечисляются в карточке героя',нав.вКарточке===true);

 /* Навыки действительно работают, а не только числятся. */
 const дело=await page.evaluate(()=>{
  const out={};
  /* Горное дело: с руды берётся больше. */
  const собрать=()=>{
   G.place=null;G.ship=null;G.inv={};G.depleted={};
   for(let i=0;i<3000;i++){const x=(i*37)%WORLD,y=(i*53)%WORLD;
    const c=cellContent(x,y);
    if(c.res&&["руда","камень","кристалл"].includes(c.res.name)&&!c.structure&&!c.monster){
     G.x=x;G.y=y;gatherCurrent("tap");return Number(G.inv[c.res.name])||0;}}
   return null;};
  G.skills=[];out.безНавыка=собрать();
  G.skills=["mining"];out.сНавыком=собрать();
  /* Торг: покупка дешевле, продажа дороже. */
  G.skills=[];const b0=buyModifier(null),s0=tradeSellK("Люди");
  G.skills=["haggler"];const b1=buyModifier(null),s1=tradeSellK("Люди");
  out.торгПокупка=b1<b0;out.торгПродажа=s1>s0;
  /* Дыхание дороги: шаг отнимает меньше времени. */
  const шаг=()=>{G.place=null;G.ship=null;G.x=1000;G.y=1000;const h=G.hour;move("E");return G.hour-h;};
  G.skills=[];const t0=шаг();G.skills=["stamina"];const t1=шаг();
  out.время=t1<t0;
  /* Глубокий колодец: предельная мана выросла. */
  G.skills=[];G.manaMax=10;learnSkill("mana");out.мана=G.manaMax===20;
  G.skills=[];
  return out;});
 check('горное дело действительно прибавляет к добыче',
  дело.безНавыка!==null&&дело.сНавыком>дело.безНавыка,дело);
 check('торг сбивает цену покупки и поднимает цену продажи',
  дело.торгПокупка===true&&дело.торгПродажа===true,дело);
 check('дыхание дороги экономит время шага',дело.время===true);
 check('глубокий колодец поднимает предельную ману',дело.мана===true);

 /* ── 5. Одноразовые свитки ── */
 const свитки=await page.evaluate(()=>{
  const плохие=[];
  LEGEND_SPELLS.forEach(sp=>{
   if(!sp.n||!sp.d||typeof sp.run!=="function")плохие.push(sp.n+": неполон");
   G.skills=[];G.items=[legendItemName(sp.n)];G.hp=1;G.mana=0;G.inCombat=false;G.combat=null;
   try{readLegendScroll(sp.n);}catch(e){плохие.push(sp.n+": "+e.message);}
   if((G.items||[]).includes(legendItemName(sp.n)))плохие.push(sp.n+": не израсходовался");});
  /* Переписчик иногда сохраняет свиток. */
  G.skills=["scribe"];let уцелел=0;
  for(let i=0;i<200;i++){G.items=[legendItemName(LEGEND_SPELLS[0].n)];
   readLegendScroll(LEGEND_SPELLS[0].n);
   if((G.items||[]).length)уцелел++;}
  G.skills=[];G.items=[];
  return {плохие,всего:LEGEND_SPELLS.length,уцелел};});
 check('легендарных свитков восемь, каждый срабатывает и расходуется',
  !свитки.плохие.length&&свитки.всего===8,{плохие:свитки.плохие.slice(0,3),всего:свитки.всего});
 check('переписчик иногда сохраняет свиток, но не всегда',
  свитки.уцелел>0&&свитки.уцелел<200,свитки.уцелел);

 /* ── 6. Заклинания ── */
 const закл=await page.evaluate(()=>{
  const плохие=[];
  SPELLS.forEach((sp,i)=>{
   G.spells=SPELLS.map(x=>x.n);G.manaMax=99;G.mana=99;G.inCombat=false;G.combat=null;
   const до=G.mana;
   try{castSpell(i);}catch(e){плохие.push(sp.n+": "+e.message);}
   if(G.mana>=до)плохие.push(sp.n+": мана не потрачена");});
  return {плохие,всего:SPELLS.length,
   слотов:document.querySelectorAll("#magicSlots button").length};});
 check('двенадцать заклинаний, каждое творится и тратит ману',
  !закл.плохие.length&&закл.всего===12,{плохие:закл.плохие.slice(0,3),всего:закл.всего});

 /* ── 7. Обстановка ── */
 const вещи=await page.evaluate(()=>{
  const плохие=[];
  G.place={kind:"house",bx:900,by:900,stype:"tavern",name:"Проба",depth:0,x:2,y:2};
  PROPS.forEach(pr=>{
   if(!pr.n||typeof pr.use!=="function"){плохие.push(pr.id+": неполон");return;}
   try{pr.use();}catch(e){плохие.push(pr.id+": "+e.message);}});
  /* У каждой постройки свой набор вещей, и все они существуют. */
  const нет=[];
  Object.entries(PROPS_BY_PLACE).forEach(([k,ids])=>ids.forEach(id=>{if(!PROP_BY_ID[id])нет.push(k+"→"+id);}));
  Object.entries(KNOW_OBJ_BY_PLACE).forEach(([k,ids])=>ids.forEach(id=>{if(!KNOW_OBJ_BY_ID[id])нет.push(k+"→"+id);}));
  /* Названные игроком вещи должны быть на месте. */
  const обязательные=["table","rack","circle","orb"];
  const пропало=обязательные.filter(id=>!PROP_BY_ID[id]);
  G.place=null;
  return {плохие,всего:PROPS.length,нет,пропало};});
 check('сорок с лишним предметов обстановки, и каждый что-то делает',
  !вещи.плохие.length&&вещи.всего>=40,{плохие:вещи.плохие.slice(0,4),всего:вещи.всего});
 check('стол, стойка с оружием, магический круг и хрустальный шар на месте',
  !вещи.пропало.length,вещи.пропало);
 check('наборы вещей и книг для каждой постройки ссылаются на существующее',
  !вещи.нет.length,вещи.нет.slice(0,5));

 /* ── 8. Собрание знаний ── */
 const соб=await page.evaluate(()=>{
  G.lore=[0,1,400,1500,3000,5000,5700];
  openLore();
  const окно=!document.getElementById("modal-lore").hidden;
  const полок=document.querySelectorAll("#loreGrid button").length;
  const пунктов=cursorItems(document.getElementById("modal-lore")).length;
  const first=document.querySelector("#loreGrid button");if(first)first.click();
  const второй=!document.getElementById("loreOne").hidden;
  const страниц=document.querySelectorAll("#loreOneGrid button").length;
  const назад=closeLoreShelf();
  const вернулись=!document.getElementById("loreGrid").hidden;
  closeTopUI();
  const закрылось=document.getElementById("modal-lore").hidden;
  return {окно,полок,пунктов,второй,страниц,назад,вернулись,закрылось};});
 check('собрание открывается списком полок',соб.окно===true&&соб.полок>=4,соб);
 check('по собранию можно ходить свайпом',соб.пунктов>=4,соб.пунктов);
 check('полка раскрывается страницами и возвращает обратно',
  соб.второй===true&&соб.страниц>=1&&соб.назад===true&&соб.вернулись===true,соб);
 check('собрание закрывается штатным жестом',соб.закрылось===true);

 /* Пустое собрание не молчит, а объясняет, где искать книги. */
 const пусто=await page.evaluate(()=>{
  G.lore=[];openLore();
  const t=document.getElementById("loreHint").textContent;
  const кнопок=document.querySelectorAll("#loreGrid button").length;
  closeTopUI();return {t,кнопок};});
 check('пустое собрание объясняет, где искать книги',
  /полк|шкаф|комнат/i.test(пусто.t)&&пусто.кнопок>=1,пусто.t.slice(0,90));

 /* ── 9. Сохранения: собрание и навыки переживают перезагрузку ── */
 const сейв=await page.evaluate(()=>{
  G.lore=[5,6,7];G.skills=["mining","bookman"];
  saveGame(true);
  const было={lore:G.lore.slice(),skills:G.skills.slice()};
  G.lore=[];G.skills=[];
  loadGame();
  return {было,стало:{lore:(G.lore||[]).slice(),skills:(G.skills||[]).slice()}};});
 check('собрание и навыки сохраняются и возвращаются',
  JSON.stringify(сейв.было)===JSON.stringify(сейв.стало),сейв);

 /* Старое сохранение без собрания и навыков не роняет игру. */
 const старое=await page.evaluate(()=>{
  G.lore="мусор";G.skills=["нет такого навыка","mining"];
  try{loadGame();}catch(e){return {err:e.message};}
  return {lore:Array.isArray(G.lore),skills:(G.skills||[]).slice()};});
 check('сохранение без собрания и с чужим навыком чинится, а не роняет игру',
  старое.lore===true&&Array.isArray(старое.skills)&&старое.skills.indexOf("нет такого навыка")<0,старое);

 /* ── 10. Главное правило: одно касание только называет ── */
 await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.lore=[];G.marks={};
  G.place={kind:"house",bx:900,by:900,stype:"school",name:"Проба",depth:0,x:1,y:1};
  const l=curLevel();
  for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++)if(l.g[y][x]==="K"){G.place.x=x;G.place.y=y;return;}});
 await page.waitForTimeout(200);
 const одно=await page.evaluate(()=>knowRead().length);
 await tap(195,600);
 await page.waitForTimeout(400);
 const послеОдного=await page.evaluate(()=>({страниц:knowRead().length,окно:!document.getElementById("modal-read").hidden}));
 check('одно касание по полю ничего не изучает',
  послеОдного.страниц===одно&&послеОдного.окно===false,послеОдного);
 await tap(195,600);
 await page.waitForTimeout(600);
 const послеДвух=await page.evaluate(()=>({страниц:knowRead().length,окно:!document.getElementById("modal-read").hidden}));
 check('двойное касание по полю изучает книгу под ногами',
  послеДвух.страниц>одно&&послеДвух.окно===true,послеДвух);
 await page.evaluate(()=>{while(activeLayer())closeTopUI();});

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
