/* ════════════════════════════════════════════════════════════════════════
   НАБОР 78: ДЕМОНОЛОГИЯ — СУЩНОСТИ, ОБРЯДЫ И ПОСЛЕДСТВИЯ

   Демонология была двумя кнопками у круга: начертить печать и заключить
   договор. С кем договор — не спрашивали; что за печать — не говорили;
   ошибиться было нельзя, потому что ошибаться было не в чем.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Сущностей двенадцать, у каждой ранг, род, признак, дар и цена.
   2. Обрядов шесть, и у каждого свои требования: компоненты, время, место,
      подготовка, знания, энергия и — для высших — помощники.
   3. Отказ называет КАЖДОЕ невыполненное требование словами. Незрячему
      «не выходит» бесполезно.
   4. Нельзя звать неисследованное, нельзя договариваться без призыва,
      нельзя держать два договора.
   5. Печать и помощники и вправду снижают долю срыва.
   6. Срыв даёт одержимость, и она вправду ест здоровье с часами.
   7. Изгнание снимает одержимость, договор и званого.
   8. Договор даёт дар на сутки и берёт названную цену по окончании.
   9. Всё это переживает сохранение, звучит и читается вслух.
   ════════════════════════════════════════════════════════════════════════ */
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

 /* ── 1. Сущности ── */
 const сущности=await page.evaluate(()=>{
  const плохие=DEMONS.filter(d=>!d.id||!d.n||!d.признак||!d.дар||!d.дарО||!d.цена||!d.ценаО
   ||!(d.ранг>=1&&d.ранг<=5)||!d.род).map(d=>d.id||"?");
  const коротко=DEMONS.filter(d=>String(d.признак).length<25||String(d.дарО).length<30
   ||String(d.ценаО).length<25).map(d=>d.id);
  return {всего:DEMONS.length,плохие,коротко,
   ранги:[...new Set(DEMONS.map(d=>d.ранг))].sort(),
   рода:[...new Set(DEMONS.map(d=>d.род))].length,
   даров:[...new Set(DEMONS.map(d=>d.дар))].length,
   цен:[...new Set(DEMONS.map(d=>d.цена))].length};});
 check('сущностей двенадцать, у каждой ранг, род, признак, дар и цена',
  сущности.всего>=12&&сущности.плохие.length===0,сущности);
 check('признак, дар и цена — объяснения, а не отписки',сущности.коротко.length===0,сущности);
 check('ранги от первого до пятого, рода разные, и дар с ценой у каждой свои',
  сущности.ранги.length>=5&&сущности.рода>=4&&сущности.даров>=10&&сущности.цен>=10,сущности);

 /* ── 2 и 3. Обряды и их требования ── */
 const обряды=await page.evaluate(()=>{
  /* Круг и кадильница стоят не в каждой башне: их надо найти. Помощник —
     тот же поиск, только по месту, где рядом живёт кто-то живой. */
  const встать=(нужно)=>{
   const ids=нужно==="круг"?["circle","orb"]:["censer","cauldron"];
   for(let i=0;i<60;i++){
    const bx=1000+i*137,by=900+i*211;
    for(const st of ["tower","school","spire","temple"]){
     G.place={kind:"house",bx,by,stype:st,name:"Проба",depth:0,x:1,y:1};
     const l=curLevel();if(!l)continue;
     for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
      if(tileAt(l,x,y)!=="X")continue;
      const pr=propAt(x,y);
      if(pr&&ids.indexOf(pr.id)>=0){G.place.x=x;G.place.y=y;return true;}}}}
   G.place=null;return false;};
  const плохие=RITES.filter(r=>!r.id||!r.n||!r.о||!(r.часы>0)||!(r.мана>=0)||!(r.ур>=1)).map(r=>r.id||"?");
  /* Ничего нет: ни ступени, ни припаса, ни маны, ни места, ни печати. */
  G.mast={};G.mana=0;G.place=null;G.buffs={};
  for(const k of Object.keys(G.inv))delete G.inv[k];
  G.demon={изучены:{},договор:null,одержим:null};
  const пусто=RITES.map(r=>({id:r.id,нет:riteLacks(r.id,"cold")}));
  /* Всё есть. */
  G.mast={demon:{ур:5,оп:0,дел:0}};G.mana=G.manaMax=400;
  for(const k of ["кость","камень","трава","кристалл"])G.inv[k]=20;
  G.demon.изучены={cold:1};
  buffSet("оберег",6);
  const встали=встать("круг");
  /* Позовём сущность, чтобы договор тоже был возможен: порядок обрядов
     проверяется до платы, и без призыва договор честно откажет. */
  buffSet("званый",3);G.demon.званый="cold";
  const сВсем=RITES.map(r=>({id:r.id,нет:riteLacks(r.id,"cold")}));
  /* А высшая сущность и у круга попросит помощника. */
  const высшая=riteLacks("summon","night");
  return {всего:RITES.length,плохие,пусто,сВсем,встали,высшая,
   требований:[...new Set(RITES.map(r=>[
    Object.keys(r.берёт||{}).length?"компоненты":null,r.часы?"время":null,r.место?"место":null,
    r.печать?"подготовка":null,r.ур?"знания":null,r.мана?"энергия":null].filter(Boolean).join(",")))]};});
 check('обрядов шесть, и у каждого имя, объяснение, время, мана и ступень',
  обряды.всего>=6&&обряды.плохие.length===0,обряды);
 check('когда нет ничего, отказ называет сразу несколько нехваток, а не одну',
  обряды.пусто.every(z=>z.нет.length>=2)
  &&обряды.пусто.some(z=>z.нет.length>=4),обряды.пусто);
 check('нехватки названы словами: ступень, припас, мана, место, печать',
  (()=>{const всё=обряды.пусто.map(z=>z.нет.join("; ")).join(" | ");
   return /ступень/.test(всё)&&/маны/.test(всё)&&/круг|кадильниц/.test(всё)
    &&/печат/.test(всё)&&/кость|трава|кристалл|камень/.test(всё);})(),обряды.пусто);
 check('когда всё на месте, обряды у круга больше ничего не просят',
  обряды.встали&&обряды.сВсем.filter(z=>z.id!=="banish").every(z=>z.нет.length===0),
  {встали:обряды.встали,сВсем:обряды.сВсем});
 check('а сущность высшего ранга и у круга потребует помощника',
  обряды.высшая.some(z=>/помощник/.test(z)),обряды.высшая);

 /* ── 4. Порядок обрядов ── */
 const порядок=await page.evaluate(()=>{
  /* Круг и кадильница стоят не в каждой башне: их надо найти. Помощник —
     тот же поиск, только по месту, где рядом живёт кто-то живой. */
  const встать=(нужно)=>{
   const ids=нужно==="круг"?["circle","orb"]:["censer","cauldron"];
   for(let i=0;i<60;i++){
    const bx=1000+i*137,by=900+i*211;
    for(const st of ["tower","school","spire","temple"]){
     G.place={kind:"house",bx,by,stype:st,name:"Проба",depth:0,x:1,y:1};
     const l=curLevel();if(!l)continue;
     for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
      if(tileAt(l,x,y)!=="X")continue;
      const pr=propAt(x,y);
      if(pr&&ids.indexOf(pr.id)>=0){G.place.x=x;G.place.y=y;return true;}}}}
   G.place=null;return false;};
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  const нольСрыва=Math.random;Math.random=()=>0.999;   /* обряды не срываются */
  G.mast={demon:{ур:5,оп:0,дел:0}};G.mana=G.manaMax=999;
  for(const k of ["кость","камень","трава","кристалл"])G.inv[k]=99;
  G.demon={изучены:{},договор:null,одержим:null};G.buffs={};
  const встали=встать("круг");
  /* Звать неисследованное нельзя. */
  riteDo("seal");
  const зовБезЗнания=riteDo("summon","cold");
  /* Исследуем и зовём. */
  const исследовал=riteDo("learn","cold");
  const знаком=demonKnown("cold");
  /* Договор без призыва невозможен. */
  const догБезЗова=riteDo("contract","cold");
  const позвал=riteDo("summon","cold");
  const договор=riteDo("contract","cold");
  const естьДоговор=!!demonPact();
  const дар=buffActive("дар_стужа");
  /* Двух договоров не держат. */
  riteDo("learn","pipe");riteDo("summon","pipe");
  const доПрипаса=Object.values(G.inv).reduce((a,b)=>a+b,0);
  const второй=riteDo("contract","pipe");
  const послеПрипаса=Object.values(G.inv).reduce((a,b)=>a+b,0);
  Math.random=нольСрыва;
  Speech.say=был;
  const t=сказ.join(" ");
  return {встали,зовБезЗнания,исследовал,знаком,догБезЗова,позвал,договор,естьДоговор,дар,второй,
   припасЦел:доПрипаса===послеПрипаса,
   объяснил:/не исследована/.test(t)&&/не позван/.test(t)&&/двух разом/i.test(t)};});
 check('звать неисследованную сущность нельзя, а после исследования — можно',
  порядок.зовБезЗнания===false&&порядок.исследовал===true&&порядок.знаком&&порядок.позвал===true,порядок);
 check('договор без призыва не заключить',порядок.догБезЗова===false,порядок);
 check('после призыва договор заключается и даёт дар',
  порядок.договор===true&&порядок.естьДоговор&&порядок.дар,порядок);
 check('двух договоров разом не держат, и каждый отказ объяснён',
  порядок.второй===false&&порядок.объяснил,порядок);
 check('отказ приходит до платы: припас на несостоявшийся обряд не сгорает',
  порядок.припасЦел,порядок);

 /* ── 5. Печать и помощники держат обряд ── */
 const риск=await page.evaluate(()=>{
  G.mast={demon:{ур:2,оп:0,дел:0}};G.buffs={};G.place=null;
  const безПечати=riteRisk("summon","mirror");
  buffSet("оберег",6);
  const сПечатью=riteRisk("summon","mirror");
  const низкийРанг=riteRisk("summon","pipe");
  const высокийРанг=riteRisk("summon","mirror");
  const ступень=(()=>{G.mast={demon:{ур:5,оп:0,дел:0}};return riteRisk("summon","mirror");})();
  return {безПечати,сПечатью,низкийРанг,высокийРанг,ступень};});
 check('печать снижает долю срыва',риск.сПечатью<риск.безПечати,риск);
 check('чем выше ранг сущности, тем чаще срыв; чем выше ступень — тем реже',
  риск.высокийРанг>риск.низкийРанг&&риск.ступень<риск.высокийРанг,риск);

 /* ── 6 и 7. Срыв, одержимость, изгнание ── */
 const срыв=await page.evaluate(()=>{
  /* Круг и кадильница стоят не в каждой башне: их надо найти. Помощник —
     тот же поиск, только по месту, где рядом живёт кто-то живой. */
  const встать=(нужно)=>{
   const ids=нужно==="круг"?["circle","orb"]:["censer","cauldron"];
   for(let i=0;i<60;i++){
    const bx=1000+i*137,by=900+i*211;
    for(const st of ["tower","school","spire","temple"]){
     G.place={kind:"house",bx,by,stype:st,name:"Проба",depth:0,x:1,y:1};
     const l=curLevel();if(!l)continue;
     for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
      if(tileAt(l,x,y)!=="X")continue;
      const pr=propAt(x,y);
      if(pr&&ids.indexOf(pr.id)>=0){G.place.x=x;G.place.y=y;return true;}}}}
   G.place=null;return false;};
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  const r=Math.random;Math.random=()=>0.0001;         /* всё срывается */
  G.mast={demon:{ур:3,оп:0,дел:0}};G.mana=G.manaMax=999;G.hp=G.hpMax=200;
  for(const k of ["кость","камень","трава","кристалл"])G.inv[k]=99;
  G.demon={изучены:{ash:1},договор:null,одержим:null};G.buffs={};G.inCombat=false;
  const укруга=встать("круг");
  buffSet("оберег",6);
  const сорвался=riteDo("summon","ash");
  const од=demonPossessed();
  /* Одержимость ест здоровье с часами — и только с часами. */
  const hp1=G.hp;
  const съела0=demonUpkeep();
  G.hour+=3;while(G.hour>=24){G.hour-=24;G.day++;}
  const съела3=demonUpkeep();
  const hp2=G.hp;
  /* Изгнание её снимает. */
  G.mana=999;G.inv["трава"]=99;
  /* Изгоняют у кадильницы или чана: их тоже надо найти. */
  const укадила=встать("кадильница");
  const нехватка=riteLacks("banish",null);
  Math.random=()=>0.999;
  const изгнал=укадила?riteDo("banish",null):false;
  const послеИзгнания=demonPossessed();
  Math.random=r;
  Speech.say=был;
  const t=сказ.join(" ");
  return {укруга,сорвался,одержим:!!од,съела0,съела3,убыло:hp1-hp2,укадила,нехватка,изгнал,
   послеИзгнания:!!послеИзгнания,
   сказалПроОдержимость:/[Оо]держимость/.test(t)};});
 check('сорванный обряд оставляет одержимость, и об этом говорят прямо',
  срыв.сорвался===true&&срыв.одержим&&срыв.сказалПроОдержимость,срыв);
 check('одержимость ест здоровье по часам, а не по тикам',
  срыв.съела0===0&&срыв.съела3>0&&срыв.убыло>0,срыв);
 check('изгнание у кадильницы снимает одержимость',
  срыв.укадила&&срыв.изгнал===true&&срыв.послеИзгнания===false,срыв);

 /* ── 8. Договор берёт названную цену ── */
 const цена=await page.evaluate(()=>{
  /* Круг и кадильница стоят не в каждой башне: их надо найти. Помощник —
     тот же поиск, только по месту, где рядом живёт кто-то живой. */
  const встать=(нужно)=>{
   const ids=нужно==="круг"?["circle","orb"]:["censer","cauldron"];
   for(let i=0;i<60;i++){
    const bx=1000+i*137,by=900+i*211;
    for(const st of ["tower","school","spire","temple"]){
     G.place={kind:"house",bx,by,stype:st,name:"Проба",depth:0,x:1,y:1};
     const l=curLevel();if(!l)continue;
     for(let y=0;y<l.h;y++)for(let x=0;x<l.w;x++){
      if(tileAt(l,x,y)!=="X")continue;
      const pr=propAt(x,y);
      if(pr&&ids.indexOf(pr.id)>=0){G.place.x=x;G.place.y=y;return true;}}}}
   G.place=null;return false;};
  const сказ=[];const был=Speech.say;Speech.say=(t,o)=>{сказ.push(String(t));return был.call(Speech,t,o);};
  const r=Math.random;Math.random=()=>0.999;
  G.mast={demon:{ур:5,оп:0,дел:0}};G.mana=G.manaMax=999;G.hp=G.hpMax=200;
  G.gold=10000;G.water=200;
  for(const k of ["кость","камень","трава","кристалл"])G.inv[k]=99;
  G.demon={изучены:{},договор:null,одержим:null};G.buffs={};
  const укруга=встать("круг");
  riteDo("seal");riteDo("learn","debt");riteDo("summon","debt");
  riteDo("contract","debt");
  const золДо=G.gold;
  const дар=buffActive("дар_счёт");
  /* Сутки прошли — цена взята сама, без спроса. */
  G.hour+=26;while(G.hour>=24){G.hour-=24;G.day++;}
  const ещё=demonPact();
  const золПосле=G.gold;
  Math.random=r;Speech.say=был;
  const t=сказ.join(" ");
  return {укруга,дар,ещё:!!ещё,золДо,золПосле,взяли:золДо-золПосле,
   назвалЦену:/[Цц]ена/.test(t),сказалПроДолг:/[Дд]олг/.test(t)};});
 check('договор даёт дар на сутки и называет цену заранее',цена.дар&&цена.назвалЦену,цена);
 check('по окончании суток договор закрывается сам и цена берётся по-настоящему',
  цена.ещё===false&&цена.взяли>0&&цена.сказалПроДолг,цена);

 /* ── 9. Окно, меню, сохранение ── */
 const окно=await page.evaluate(()=>{
  G.mast={};G.demon={изучены:{},договор:null,одержим:null};
  const безРемесла=amAvailable("demonology");
  demonPossess("pipe",10);
  const одержимому=amAvailable("demonology");
  G.demon.одержим=null;
  G.mast={demon:{ур:3,оп:0,дел:0}};
  const сРемеслом=amAvailable("demonology");
  openDemon();
  const обрядов=document.querySelectorAll('#demonBody [data-cmd^="rite:"]').length;
  const сущностей=document.querySelectorAll('#demonBody [data-cmd^="demonpick:"]').length;
  const b=document.querySelector('[data-cmd="demonpick:cold"]');if(b)b.click();
  const выбран=(G.demon||{}).выбран;
  const речи=[...document.querySelectorAll("#demonBody [data-speak]")].map(z=>z.getAttribute("data-speak")||"");
  /* Сохранение. */
  G.demon.изучены={cold:1,pipe:1};
  G.demon.договор={кто:"cold",дар:"стужа",цена:"тепло",до:(G.day)*24+G.hour+10};
  saveGame(true);
  const d=JSON.parse(localStorage.getItem(SAVE_KEY));
  return {безРемесла,одержимому,сРемеслом,обрядов,сущностей,выбран,
   речей:речи.length,короткие:речи.filter(z=>z.length<30).length,
   безДыр:речи.every(z=>!/undefined|NaN|\[object/.test(z)),
   вСейве:!!(d&&d.demon&&d.demon.изучены&&d.demon.изучены.cold&&d.demon.договор)};});
 check('пункт меню закрыт для неучившегося, но открыт для одержимого: изгонять надо и ему',
  окно.безРемесла===false&&окно.одержимому===true&&окно.сРемеслом===true,окно);
 check('в окне все шесть обрядов и все двенадцать сущностей, и выбор работает',
  окно.обрядов>=6&&окно.сущностей>=12&&окно.выбран==="cold",окно);
 check('всё в окне озвучено объяснениями, без служебного мусора',
  окно.речей>=15&&окно.короткие===0&&окно.безДыр,окно);
 check('исследованное и договор переживают сохранение',окно.вСейве,окно);

 check('за весь набор ни одной ошибки в консоли',errors.length===0,errors.slice(0,3));
 await browser.close();
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(results.join('\n'));
 console.log(`\nИТОГО: ${results.length-bad.length} прошло, ${bad.length} провалено.`);
 process.exit(bad.length?1:0);
})();
