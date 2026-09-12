/* ════════════════════════════════════════════════════════════════════════
   ТЁМНЫЕ ИМПЕРИИ, НЕБО ЗА ГРАНЬЮ И СТО ЯРУСОВ

   Тёмные земли были дикими: боги, народы и дела — но ни власти, ни неба, ни
   дна. Теперь там восемь империй, которые воюют и заключают союзы куда злее,
   чем державы Грани; тридцать тварей тёмного неба, каждая со своей высотой и
   своей школой чар; двадцать летающих народов; двадцать семь богов; десять
   кланов и шесть школ, где учат не за золото, а за долю и кровь; и сто
   ярусов глубины, разбитых на десять кругов — чем ниже, тем злее и богаче.

   Здесь проверяется, что всё это есть, различимо, находится в мире и звучит
   по-своему: у каждого круга свой пол и свой отклик, у каждого тёмного места
   своя акустика и свой голос.
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
  Speech.say=t=>{window.__said.push(String(t));};
  window.речь=()=>window.__said.join(' ');});

 /* ── 1. Реестры ── */
 const реестр=await page.evaluate(()=>{
  const беды=[];
  const ids=new Set();
  DARK_EMPIRES.forEach(e=>{
   if(ids.has(e.id))беды.push("двойная империя "+e.id);ids.add(e.id);
   ["n","short","gov","econ","war"].forEach(k=>{if(!e[k]||e[k].length<4)беды.push(e.id+": нет "+k);});
   if(!DARK_GOD_BY_ID[e.god])беды.push(e.id+": нет бога "+e.god);
   if(!e.дань||!e.дань.length)беды.push(e.id+": нечем платить дань");});
  DARK_CLANS.forEach(c=>{if(!DARK_GOD_BY_ID[c.god])беды.push("клан "+c.id+": нет бога");
   if(!c.дело||c.дело.length<10)беды.push("клан "+c.id+": нет дела");});
  DARK_MAGIC.forEach(m=>{if(!m.n||!m.звук||!m.след)беды.push("школа чар "+m.id);
   if(!SOUND_BANK[m.звук]&&!BEACONS[m.звук])беды.push("школа чар "+m.id+": нет звука "+m.звук);});
  DARK_SCHOOLS.forEach(sc=>{
   if(sc.ступени.length!==3)беды.push(sc.id+": ступеней "+sc.ступени.length);
   if(!DARK_PLACES[sc.дом])беды.push(sc.id+": неведомый дом "+sc.дом);
   if(!DARK_CLAN_BY_ID[sc.клан])беды.push(sc.id+": нет клана "+sc.клан);
   sc.ступени.forEach(ст=>{
    const g=ст.даёт||{};
    if(g.навык&&!SKILL_BY_ID[g.навык])беды.push(sc.id+": нет навыка "+g.навык);
    if(g.умение&&!ABILITY_BY_ID[g.умение])беды.push(sc.id+": нет умения "+g.умение);});});
  DARK_FLY_RACES.forEach(r=>{if(!(r.fly>0&&r.fly<=4))беды.push("народ "+r.id+": потолок "+r.fly);});
  darkFliers().forEach(m=>{
   if(!DARK_MAGIC_BY_ID[m.magic])беды.push("тварь "+m.id+": нет школы чар "+m.magic);
   if(!(m.fly>0&&m.fly<=4))беды.push("тварь "+m.id+": высота "+m.fly);});
  return {империй:DARK_EMPIRES.length,богов:DARK_GODS.length,народов:DARK_RACES.length,
   летающихНародов:DARK_FLY_RACES.length,тварей:DARK_MONSTERS.length,
   летающихТварей:darkFliers().length,школЧар:DARK_MAGIC.length,кланов:DARK_CLANS.length,
   школ:DARK_SCHOOLS.length,ярусов:DARK_MAX_DEPTH,кругов:DARK_CIRCLES.length,беды};});
 check('восемь тёмных империй, десять кланов и шесть школ',
  реестр.империй===8&&реестр.кланов===10&&реестр.школ===6,реестр);
 check('двадцать семь тёмных богов и пятьдесят два народа, из них двадцать летающих',
  реестр.богов===27&&реестр.народов===52&&реестр.летающихНародов===20,реестр);
 check('тридцать тварей тёмного неба и не меньше пятнадцати школ тёмной магии',
  реестр.летающихТварей===30&&реестр.школЧар>=15,реестр);
 check('сто ярусов глубины в десяти кругах',
  реестр.ярусов===100&&реестр.кругов===10,реестр);
 check('в реестрах нет дыр',реестр.беды.length===0,реестр.беды.slice(0,6));

 /* ── 2. Войны за Гранью злее ── */
 const политика=await page.evaluate(()=>{
  const тьма=[],свет=[],союзы=[];
  for(let d=1;d<400;d+=3){
   тьма.push(darkWarsAt(d).length);свет.push(warsAt(d).length);союзы.push(darkPactsAt(d).length);}
  const ср=a=>a.reduce((x,y)=>x+y,0)/a.length;
  /* Каждая империя когда-нибудь да воюет, и причины разные. */
  const причины=new Set(),воевали=new Set();
  for(let d=1;d<400;d++)darkWarsAt(d).forEach(w=>{причины.add(w.cause);воевали.add(w.a);воевали.add(w.b);});
  const слово=darkPoliticsText(11);
  return {тьма:+ср(тьма).toFixed(2),свет:+ср(свет).toFixed(2),союзы:+ср(союзы).toFixed(2),
   причин:причины.size,воевали:воевали.size,слово:слово.slice(0,200),
   естьДань:/Дань побеждённого/.test(слово)};});
 check('войн за Гранью заметно больше, чем на Грани',
  политика.тьма>политика.свет*1.5,политика);
 check('союзы за Гранью есть, но они короткие',политика.союзы>0,политика);
 check('воюют все восемь империй, и причин у войн много',
  политика.воевали===8&&политика.причин>=8,политика);
 check('о войнах говорят словами, и в них названа дань побеждённого',
  политика.естьДань===true,{слово:политика.слово});

 /* ── 3. Империи, притоны и оплоты стоят в мире ── */
 const мир=await page.evaluate(()=>{
  G.dark=true;G.place=null;
  const места=new Set();const империи=new Set();
  /* Постройки за Гранью редки: чтобы увидеть все семь видов, обойти надо
     не девять тысяч клеток, а полсотни тысяч. */
  let построек=0;
  for(let x=0;x<2000;x+=7)for(let y=0;y<2000;y+=53){
   const c=darkCell(x,y);
   if(c.structure){места.add(c.structure.type);построек++;}}
  for(let i=0;i<400;i++)империи.add(darkEmpireAt((i*37)%2000,(i*71)%2000).id);
  /* школы находятся в своих домах */
  const школы=new Set();
  for(let i=0;i<600;i++)for(const st of ["pit","ossuary","spire","shrine","bazaar"]){
   const sc=safeFn(()=>darkSchoolAt(100+i*3,200+i*5,st),null);
   if(sc)школы.add(sc.id);}
  G.dark=false;
  return {мест:[...места],построек,империй:империи.size,школ:школы.size};});
 check('все восемь империй занимают свои земли',мир.империй===8,мир);
 check('в тёмных землях стоят и притоны, и оплоты кланов',
  мир.мест.indexOf("den")>=0&&мир.мест.indexOf("hold")>=0&&мир.мест.length>=6,мир.мест);
 check('все шесть тёмных школ находятся в мире',мир.школ===6,мир);

 /* ── 4. Дела по уровням, направлениям и войнам ── */
 const дела=await page.evaluate(()=>{
  G.dark=true;G.place=null;G.day=7;
  const уровни=new Set(),направления=new Set();
  let сВойной=0,всего=0;
  for(let i=0;i<300;i++){
   const x=100+i*6,y=200+i*11;
   for(const prof of ["Служка","Обрядчик","Шепчущий","Надсмотрщик","Счётчик костей","Меняла клятв"]){
    const n=getNPC(x,y,0,prof);
    const q=safeFn(()=>questFor(n),null);
    if(!q)continue;
    всего++;
    уровни.add(q.уровень);направления.add(q.направление);
    if(q.империя)сВойной++;}}
  G.dark=false;
  return {всего,уровни:[...уровни].sort(),направлений:направления.size,сВойной};});
 check('дела за Гранью бывают разных уровней',
  дела.уровни.length>=3&&дела.уровни[0]>=1&&дела.уровни[дела.уровни.length-1]<=5,дела.уровни);
 check('у дел есть направления: война, обряд, интрига, счёт и торг',
  дела.направлений>=4,дела);
 check('часть дел прямо связана с войной империй',дела.сВойной>0,дела);

 /* ── 5. Небо за Гранью ── */
 const небо=await page.evaluate(()=>{
  G.dark=true;
  let летунов=0,наземных=0;const высоты=new Set(),школы=new Set();
  for(let i=0;i<4000;i++){
   const c=darkCell((i*31)%2000,(i*67+3)%2000);
   if(!c.monster)continue;
   if((Number(c.monster.alt)||0)>0){летунов++;высоты.add(c.monster.alt);школы.add(c.monster.magic);}
   else наземных++;}
  /* Удар крылатой твари считается по её школе чар. */
  const пример=darkSkyMonsterAt(500,500);
  const школа=пример&&DARK_MAGIC_BY_ID[пример.magic];
  G.dark=false;
  return {летунов,наземных,высот:[...высоты].sort(),школ:школы.size,
   пример:пример&&{имя:пример.n,высота:пример.alt,школа:пример.magic,урон:пример.dmg},
   есть:!!школа};});
 check('небо за Гранью населено: летающих тварей встречается много',
  небо.летунов>100&&небо.наземных>100,{летунов:небо.летунов,наземных:небо.наземных});
 check('у тварей неба разные высоты и разные школы чар',
  небо.высот.length>=3&&небо.школ>=6,небо);
 check('удар крылатой твари считается по её школе чар',небо.есть===true&&небо.пример.урон>0,небо.пример);

 /* ── 6. Сто ярусов ── */
 const глубина=await page.evaluate(()=>{
  G.dark=true;
  const круги=new Set(),полы=new Set(),отклики=new Set();
  for(let d=1;d<=100;d++){
   круги.add(darkCircle(d).n);
   G.place={kind:"dungeon",bx:300,by:300,stype:"pit",depth:d,name:"п",x:1,y:1};
   полы.add(indoorSurface());
   отклики.add(roomKind());}
  const вес=[1,25,50,75,100].map(d=>+darkDepthWeight(d).toFixed(2));
  /* Глубже сотого хода нет, а на Грани — глубже пятого. */
  G.place={kind:"dungeon",bx:300,by:300,stype:"pit",depth:100,name:"п",x:1,y:1};
  const пределТьма=maxDepthHere();
  G.dark=false;G.place=null;
  const пределСвет=maxDepthHere();
  return {кругов:круги.size,полов:полы.size,откликов:отклики.size,вес,пределТьма,пределСвет};});
 check('сто ярусов разбиты на десять кругов, и у каждого свой пол',
  глубина.кругов===10&&глубина.полов>=6,глубина);
 check('у кругов глубины своя акустика',глубина.откликов>=6,глубина);
 check('чем ниже, тем злее: вес глубины растёт',
  глубина.вес[0]<глубина.вес[4]&&глубина.вес[4]>5,глубина.вес);
 check('за Гранью сто ярусов, на Грани — пять',
  глубина.пределТьма===100&&глубина.пределСвет===5,глубина);

 /* ── 7. Тёмные школы берут кровью ── */
 const школа=await page.evaluate(()=>{
  while(activeLayer())closeTopUI();
  G.dark=true;G.place=null;G.gold=9000;G.level=20;G.hp=200;G.hpMax=200;
  G.schools={};G.abilities=[];G.skills=[];
  let точка=null;
  for(let i=0;i<6000&&!точка;i++){
   const x=(i*53)%2000,y=(i*97+11)%2000;
   const c=darkCell(x,y);
   if(c.structure&&["pit","ossuary","spire","shrine","bazaar"].includes(c.structure.type))точка={x,y,st:c.structure};}
  if(!точка){G.dark=false;return {пропуск:true};}
  enterPlace({x:точка.x,y:точка.y,structure:точка.st});
  const sc=darkSchoolHere();
  if(!sc){while(activeLayer())closeTopUI();G.place=null;G.dark=false;return {нетШколы:true};}
  const hp0=G.hp,g0=G.gold;
  window.__said=[];
  const шаги=[trainDarkSchool(sc.id),trainDarkSchool(sc.id),trainDarkSchool(sc.id),trainDarkSchool(sc.id)];
  const слово=речь();
  /* Учиться можно только в доме школы. */
  while(activeLayer())closeTopUI();G.place=null;
  const вПоле=trainDarkSchool(sc.id);
  const итог={шаги,вПоле,ступень:darkSchoolStep(sc.id),
   кровь:G.hp<hp0,золото:G.gold<g0,
   дары:(G.abilities||[]).length+(G.skills||[]).length,
   слово:слово.slice(0,140)};
  G.dark=false;
  return итог;});
 check('тёмная школа берёт ступени по порядку и только у себя дома',
  школа.шаги&&школа.шаги[0]===true&&школа.шаги[3]===false&&школа.вПоле===false&&школа.ступень===3,школа);
 check('за ступень тёмной школы платят золотом и кровью',
  школа.кровь===true&&школа.золото===true&&/кров/i.test(школа.слово||""),школа);
 check('тёмная школа даёт умения и навыки',школа.дары>=3,школа);

 /* ── 8. Звук: новые записи и акустика мест ── */
 const звук=await page.evaluate(()=>{
  const mtg=Object.keys(SOUND_BANK).filter(k=>k.startsWith("mtg_"));
  const файлы=[...new Set(mtg.flatMap(k=>SOUND_BANK[k].f))];
  const чужие=файлы.filter(f=>!f.startsWith("mtg/"));
  const беды=[];
  ["shrine","ossuary","pit","spire","bazaar","den","hold"].forEach(st=>{
   const г=LIVE_SCENE[st];
   if(!г||!г.length)беды.push(st+": нет голосов");
   else г.forEach(r=>{if(!SOUND_BANK[r])беды.push(st+": нет роли "+r);});});
  const тёмныеОтклики=Object.keys(ROOM).filter(k=>k.startsWith("d_"));
  const безИмени=тёмныеОтклики.filter(k=>!ROOM[k].n);
  return {ролей:mtg.length,файлов:файлы.length,чужие,беды,
   вКаталоге:!!BANK_CATS.mtg,вГруппе:BANK_GROUPS.some(g=>(g.dirs||[]).includes("mtg")),
   тёмныхОткликов:тёмныеОтклики.length,безИмени};});
 check('новые записи вошли в банк ролями и попали в энциклопедию',
  звук.ролей>=30&&звук.файлов>=90&&звук.чужие.length===0&&
  звук.вКаталоге===true&&звук.вГруппе===true,звук);
 check('у каждого тёмного места свои живые голоса, и все они существуют',
  звук.беды.length===0,звук.беды.slice(0,4));
 check('у тёмных мест и кругов свои отклики, и у каждого есть имя',
  звук.тёмныхОткликов>=12&&звук.безИмени.length===0,звук);

 check('игра не выбрасывала ошибок за весь прогон',errors.length===0,errors.slice(0,3));

 console.log(results.join('\n'));
 console.log('ИТОГО: '+results.filter(r=>r.startsWith('PASS')).length+' из '+results.length);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
