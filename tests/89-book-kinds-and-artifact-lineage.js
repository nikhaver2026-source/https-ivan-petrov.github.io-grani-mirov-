/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 89: РОДЫ КНИГ, ЗНАНИЕ В РАЗГОВОРЕ И РОДОСЛОВНАЯ АРТЕФАКТОВ

   Страница реестра была одной и той же вещью в любом переплёте. Теперь у
   каждой свой род — дневник, трактат, учебник, полевой журнал, рецептурник,
   карта, летопись, запрещённый текст (§119). Род решает, что даёт чтение
   сверх опыта, а прочитанное меняет разговор с жителем. У артефактов —
   происхождение, создатель, история, материал и износ, который стирает
   вещь в бою и чинится у наковальни (§121).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Восемь родов; род страницы постоянен и берётся из пула её полки; по
      реестру встречаются все восемь.
   2. Дары родов: рецептурник учит паре веществ, карта кладёт примету,
      учебник растит ремесло только знающему, полевой журнал записывает
      тварь, летопись заводит весть, трактат прибавляет опыт; дар один раз.
   3. Чтение через studyPage произносит дар рода.
   4. Житель, о чьём народе читали, получает кнопку «Спросить»; первый
      вопрос растит имя у народа, второй — нет; о непрочитанном спросить
      нельзя.
   5. У артефакта родословная: происхождение, создатель, материал, история,
      постоянные по семени; износ переводит вещь через четыре состояния, и
      статы падают в ту же долю.
   6. Победа стирает работающие вещи; «Починить артефакт» — работа кузнеца
      второй ступени за руду, возвращает целость и слышна.
   7. Износ, дары книг и вопросы переживают сохранение.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{
  if(m.type()==='error'&&!/Failed to load resource|fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,o);};});

 /* ── 1. роды ── */
 const роды=await page.evaluate(()=>{
  const виды={};const L=knowLayout();let несовп=0,непост=0;
  for(let i=0;i<L.total;i+=7){
   const e=knowEntry(i);if(!e)continue;
   const k=bookKind(e),k2=bookKind(i);
   if(k.id!==k2.id)непост++;
   const пул=BOOK_SHELF_KINDS[e.shelf];if(пул&&!пул.includes(k.id))несовп++;
   виды[k.id]=(виды[k.id]||0)+1;}
  return {родов:BOOK_KINDS.length,видов:Object.keys(виды).length,виды,несовп,непост,полокСПулом:Object.keys(BOOK_SHELF_KINDS).length,полок:KNOW_SHELVES.length};});
 check('1. восемь родов, все встречаются, род постоянен и из пула своей полки',
  роды.родов===8&&роды.видов===8&&роды.несовп===0&&роды.непост===0&&роды.полокСПулом===роды.полок,роды);

 /* ── 2. дары ── */
 const дары=await page.evaluate(()=>{
  const L=knowLayout();const r={};
  const найти=id=>{for(let i=0;i<L.total;i++){const e=knowEntry(i);if(e&&bookKind(e).id===id)return {i,e};}return null;};
  G.level=20;G.x=WORLD>>1;G.y=WORLD>>1;G.bookGifts={};G.signs=[];G.beastNotes={};G.alch={};G.rumors=[];
  G.mast=G.mast||{};for(const k of ["smith","jewel","alchemy","runes","arte","cook","lang","demon"])G.mast[k]={ур:0,оп:0};
  /* рецептурник */
  const rc=найти("recipes");const зналДо=Object.keys(G.alch||{}).length;
  r.recipes=rc?bookKindGrant(rc.i,rc.e):"";r.recipesLearned=Object.keys(G.alch||{}).length>зналДо||/знаком/.test(r.recipes);
  /* карта */
  const mp=найти("map");r.map=mp?bookKindGrant(mp.i,mp.e):"";r.signs=(G.signs||[]).filter(s=>/^map_/.test(s.id)).length;
  /* учебник: без ремесла и с ремеслом */
  const tb=найти("textbook");r.textbookNo=tb?bookKindGrant(tb.i,tb.e):"";
  G.bookGifts={};for(const k of ["smith","jewel","alchemy","runes","arte","cook","lang"])G.mast[k]={ур:1,оп:0};
  const опДо=Object.values(G.mast).reduce((s,m)=>s+(m.оп||0),0);
  r.textbookYes=tb?bookKindGrant(tb.i,tb.e):"";r.mastGrew=Object.values(G.mast).reduce((s,m)=>s+(m.оп||0),0)>опДо||Object.values(G.mast).some(m=>m.ур>1);
  /* полевой журнал */
  const fl=найти("fieldlog");r.fieldlog=fl?bookKindGrant(fl.i,fl.e):"";r.beasts=Object.keys(G.beastNotes||{}).length;
  /* летопись */
  const ch=найти("chronicle");const вестейДо=(G.rumors||[]).length;r.chronicle=ch?bookKindGrant(ch.i,ch.e):"";r.rumorsGrew=(G.rumors||[]).length>вестейДо;
  /* трактат */
  const tr=найти("treatise");const xp=G.xp;r.treatise=tr?bookKindGrant(tr.i,tr.e):"";r.xpGrew=G.xp>xp;
  /* запрещённый */
  const fb=найти("forbidden");r.forbidden=fb?bookKindGrant(fb.i,fb.e):"";
  /* второй раз — пусто */
  r.again=tr?bookKindGrant(tr.i,tr.e):"x";
  return r;});
 check('2а. рецептурник учит паре веществ или говорит, что она знакома',/Рецепт/.test(дары.recipes)&&дары.recipesLearned,дары.recipes);
 check('2б. карта кладёт примету с точкой',/карта/i.test(дары.map)&&дары.signs>=1,дары.map);
 check('2в. учебник без первого урока не ложится, со ступенью — растит ремесло',/без первого урока/.test(дары.textbookNo)&&/растёт/.test(дары.textbookYes)&&дары.mastGrew,[дары.textbookNo,дары.textbookYes]);
 check('2г. полевой журнал записывает тварь',/журнал/.test(дары.fieldlog)&&дары.beasts>=1,дары.fieldlog);
 check('2д. летопись заводит весть, трактат прибавляет опыт, запрещённый текст жжёт',/Летопись/.test(дары.chronicle)&&дары.rumorsGrew&&/Трактат/.test(дары.treatise)&&дары.xpGrew&&/Запрещённый/.test(дары.forbidden),[дары.chronicle,дары.treatise]);
 check('2е. дар одной страницы даётся один раз',дары.again==="",дары.again);

 /* ── 3. чтение через studyPage ── */
 const чтение=await page.evaluate(()=>{
  const L=knowLayout();let n=-1;for(let i=0;i<L.total;i++){const e=knowEntry(i);if(e&&bookKind(e).id==="treatise"){n=i;break;}}
  G.lore=[];G.bookGifts={};SAID.length=0;
  studyPage(n,1,"Проверка.");
  return {n,said:SAID.find(t=>/Изучено/.test(t))||"",
   заголовок:(()=>{SAID.length=0;openReading(n,true);return SAID.join(" | ");})()};});
 check('3. чтение произносит дар рода, а заглавие называет род',/Трактат/.test(чтение.said)&&/трактат/i.test(чтение.заголовок),[чтение.said.slice(0,90),чтение.заголовок.slice(0,90)]);

 /* ── 4. знание в разговоре ── */
 const разговор=await page.evaluate(()=>{
  const r={};
  let npc=null;
  outer: for(let rr=0;rr<80;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){
   const c=safeFn(()=>cellContent((WORLD>>1)+dx,(WORLD>>1)+dy),null);
   if(c&&c.structure){const ns=safeFn(()=>npcsFor(c),[]);const n=ns.find(x=>x.race&&RACES_DB.some(r=>r.n===x.race));if(n){G.x=(WORLD>>1)+dx;G.y=(WORLD>>1)+dy;npc=n;break outer;}}}
  if(!npc)return {нет:"жителя"};
  r.race=npc.race;
  const L=knowLayout();const row=L.rows.find(x=>x.sh.id==="race");
  let num=-1;
  for(let i=row.from;i<row.from+row.n;i++){G.lore=[i];if(bookTopicsFor(npc).length){num=i;break;}}
  if(num<0)return {нет:"страницы",race:npc.race};
  G.lore=[];r.безЧтения=bookTopicsFor(npc).length;
  G.lore=[num];r.тем=bookTopicsFor(npc).length;r.тема=bookTopicsFor(npc)[0];
  openNPC(npc.key,true);
  r.кнопка=!!document.querySelector(`#npcBody [data-cmd="npcask:${npc.key}~${num}"]`);
  G.asked={};const репДо=repOf(npc.race);SAID.length=0;PLAYED.length=0;
  r.ok1=npcAskBook(npc.key,num);r.реп1=repOf(npc.race)-репДо;r.said1=SAID.slice(-1)[0]||"";r.звук=PLAYED.includes("uh_page");
  SAID.length=0;r.ok2=npcAskBook(npc.key,num);r.реп2=repOf(npc.race)-репДо;r.said2=SAID.slice(-1)[0]||"";
  G.lore=[];SAID.length=0;r.ok3=npcAskBook(npc.key,num);r.said3=SAID.slice(-1)[0]||"";
  r.asked=Object.keys(G.asked||{}).length;
  return r;});
 check('4а. о прочитанном народе жителя есть тема и кнопка «Спросить», без чтения — нет',
  !разговор.нет&&разговор.безЧтения===0&&разговор.тем===1&&разговор.кнопка&&разговор.тема&&разговор.тема.shelf==="race",разговор.нет||{race:разговор.race,тема:разговор.тема&&разговор.тема.title});
 check('4б. первый вопрос отвечает по книге, растит имя у народа и шуршит страницей; второй — без роста',
  разговор.ok1&&разговор.реп1===1&&/сближает/.test(разговор.said1)&&разговор.звук&&разговор.ok2&&разговор.реп2===1&&!/сближает/.test(разговор.said2)&&разговор.said2.length>10,
  [разговор.said1&&разговор.said1.slice(0,80),разговор.реп1,разговор.реп2]);
 check('4в. о непрочитанном спросить нельзя',разговор.ok3===false&&/не читали/.test(разговор.said3),разговор.said3);

 /* ── 5. родословная и износ ── */
 const род=await page.evaluate(()=>{
  G.level=99;G.dark=false;
  const a=ART.make({дом:"war",ранг:3,кач:3,seed:4242});
  const l1=artLore(a),l2=artLore(ART.make({дом:"war",ранг:3,кач:3,seed:4242}));
  const b=ART.make({дом:"war",ранг:3,кач:3,seed:9191});const lb=artLore(b);
  const поля=["происхождение","создатель","история","материал","состояние","доля"].every(k=>l1[k]!==undefined&&l1[k]!=="");
  const same=["происхождение","создатель","история","материал"].every(k=>l1[k]===l2[k]);
  const diff=["происхождение","создатель","история","материал"].some(k=>l1[k]!==lb[k]);
  const sum=x=>Object.values(ART.stats(x).статы).reduce((s,v)=>s+Math.abs(Number(v)||0),0);
  const цел=sum(a);const ряд=[0,12,30,60].map(w=>{a.износ=w;return {w,сост:artLore(a).состояние,доля:artLore(a).доля,k:+(sum(a)/цел).toFixed(2)};});
  a.износ=0;
  return {поля,same,diff,ряд,текст:artLoreText(a),описание:ART.describe(a),виды:new Set([ART_ORIGINS.length,ART_MAKERS.length,ART_HISTORY.length,ART_MATERIALS.length].map(x=>x>=5)).size};});
 check('5а. у артефакта происхождение, создатель, история и материал — постоянные по семени и разные у разных вещей',
  род.поля&&род.same&&род.diff&&род.виды===1,род.текст.slice(0,120));
 check('5б. износ ведёт через целую, потёртую, изношенную и ветхую, и статы падают вместе с долей',
  род.ряд.map(x=>x.сост).join(",")==="целая,потёртая,изношенная,ветхая"&&род.ряд.every((x,i)=>Math.abs(x.k-x.доля)<0.12&&(i===0||x.k<=род.ряд[i-1].k)),род.ряд);
 check('5в. описание вещи включает родословную',/Происхождение/.test(род.описание)&&/Состояние/.test(род.текст),род.описание.slice(0,140));

 /* ── 6. бой стирает, кузнец чинит ── */
 const бой=await page.evaluate(()=>{
  G.level=99;G.dark=false;G.inCombat=false;
  const a=ART.make({дом:"war",ранг:1,кач:2,seed:777});a.износ=11;G.artifacts=[a];
  const работает=ART.works(a);
  const c=safeFn(()=>{for(let r=1;r<200;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   const cc=cellContent((WORLD>>1)+dx,(WORLD>>1)+dy);
   if(cc.monster&&!cc.structure){G.x=(WORLD>>1)+dx;G.y=(WORLD>>1)+dy;return cc;}}return null;},null);
  if(!c)return {нет:"твари"};
  startCombat(c);G.combat.hp=0;SAID.length=0;victory();
  const после=Number(a.износ);const сказ=SAID.find(t=>/теперь потёртая/.test(t))||"";
  /* починка */
  G.mast=G.mast||{};G.mast.smith={ур:2,оп:0};G.inv["руда"]=3;
  const rnd=Math.random;Math.random=()=>0.999;SAID.length=0;PLAYED.length=0;
  const ok=techDo(TECH_BY_ID.mend,"anvil");Math.random=rnd;
  const мendСказ=SAID.find(t=>/починена/.test(t))||"";
  const t=TECH_BY_ID.mend;
  return {работает,до:11,после,сказ,ok,износ:a.износ,мendСказ,руда:G.inv["руда"],звук:PLAYED.includes("uh_smith"),
   ур:t.ур,маст:t.маст,станки:t.станки,берёт:t.берёт,нечего:artMend()};});
 check('6а. победа стирает работающую вещь на единицу и объявляет смену состояния',
  !бой.нет&&бой.работает&&бой.после===12&&/потёртая/.test(бой.сказ),бой.нет||[бой.после,бой.сказ]);
 check('6б. «Починить артефакт» — кузнец второй ступени у наковальни или горна за руду; вещь снова целая и это слышно',
  бой.ok&&бой.износ===0&&/починена/.test(бой.мendСказ)&&бой.руда===2&&бой.звук&&бой.ур===2&&бой.маст==="smith"&&бой.станки.includes("anvil")&&бой.берёт["руда"]===1&&/нечего/.test(бой.нечего),
  [бой.ok,бой.износ,бой.мendСказ,бой.руда,бой.звук]);

 /* ── 7. сохранение ── */
 const сохр=await page.evaluate(()=>{
  G.artifacts[0].износ=33;G.bookGifts={5:"treatise"};G.asked={"k|5":1};
  saveGame(true);const raw=localStorage.getItem(SAVE_KEY||"grani_save")||Object.keys(localStorage).map(k=>localStorage.getItem(k)).find(v=>/износ/.test(v||""))||"";
  return {износ:/"износ":33/.test(raw),дары:/bookGifts/.test(raw),вопросы:/asked/.test(raw)};});
 check('7. износ, дары книг и вопросы лежат в сохранении',сохр.износ&&сохр.дары&&сохр.вопросы,сохр);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\nИтого: ${results.filter(r=>r.startsWith('PASS')).length}/${results.length}`);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
