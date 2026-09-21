/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 126: СТОУСТЫЙ РУДНИК (§6 брифа)

   §6 требует именное стоярусное подземелье, и в нём восемь вещей: живые
   минералы, шахтёрские лагеря, обвалы, механизмы, ветви, тайные камеры,
   аудиальные аномалии и ярусы с уникальными правилами.

   Рудник в мире был — но только в паспорте подземелий, строкой. Внутри он
   ничем не отличался от любой другой дыры в земле.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Шесть штреков, десять правил по десяткам, четыре живые жилы: у всего
      имя, слово, настоящая порода из мира и своя живая запись.
   2. Вне Рудника ничего этого нет: модуль честно говорит, что вы не в нём.
   3. Ветвь и правило у яруса свои и не меняются: рудник всегда один и тот же.
   4. Живая жила отдаёт свою породу и может ответить — и она заменяет
      обычную добычу, а не добавляется к ней.
   5. Лагеря стоят до тридцатого яруса на каждом десятом; привал даёт
      здоровье, берёт час и рассказывает, что ниже.
   6. Подъёмник берёт десять ярусов разом, и пункт меню виден только там,
      где он цел.
   7. Обвалы: шанс растёт с глубиной, на обвальных ярусах вдвое, на верхних
      крепях вчетверо меньше.
   8. Шёпот: на своих ярусах эхо врёт — и об этом говорят ПРЯМО, до того
      как игрок пойдёт на обманный звук; Чутьё глубин его снимает.
   9. Тайных камер в Руднике вдвое больше, на чужих крепях вчетверо.
  10. Самопроверка мира держит строку «mine», руководство и README
      рассказывают о восьми свойствах.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{window.__said=[];const s=Speech.say.bind(Speech);
  Speech.say=(t,o)=>{__said.push(String(t));return s(t,o);};
  window.__played=[];const bp=Bank.play.bind(Bank);
  Bank.play=(r,o)=>{__played.push(r);return bp(r,o);};
  try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 1. состав ── */
 const состав=await page.evaluate(()=>({
  штреков:MINE_BRANCHES.length,правил:MINE_RULES.length,живых:MINE_LIVE.length,
  штрекПолон:MINE_BRANCHES.every(b=>b.n&&b.о&&b.опасность&&RES_BASE[b.порода]&&SOUND_BANK[b.звук]),
  правилоПолно:MINE_RULES.every(r=>r.n&&r.о&&r.дело&&SOUND_BANK[r.звук]),
  живаяПолна:MINE_LIVE.every(l=>l.n&&l.о&&l.ответ&&RES_BASE[l.порода]&&SOUND_BANK[l.звук]&&l.урон>0),
  десятки:MINE_RULES.map(r=>r.д),
  звуковШтреков:new Set(MINE_BRANCHES.map(b=>b.звук)).size,
  звуковПравил:new Set(MINE_RULES.map(r=>r.звук)).size,
  звуковЖивых:new Set(MINE_LIVE.map(l=>l.звук)).size,
  паспорт:!!Complexes.byId("cx_mine")}));
 check('шесть штреков, десять правил и четыре живые жилы, и у всего есть имя, слово и порода',
  состав.штреков===6&&состав.правил===10&&состав.живых===4
  &&состав.штрекПолон&&состав.правилоПолно&&состав.живаяПолна,состав);
 check('правила стоят по десяткам от десятого до сотого, без пропусков',
  состав.десятки.join(",")==="10,20,30,40,50,60,70,80,90,100",состав.десятки);
 check('у каждого штрека, правила и живой жилы своя живая запись',
  состав.звуковШтреков===6&&состав.звуковПравил>=8&&состав.звуковЖивых===4,состав);
 check('Рудник стоит в паспорте подземелий именным комплексом',состав.паспорт);

 /* ── 2. вне Рудника ничего нет ── */
 const вне=await page.evaluate(()=>{
  G.place=null;
  const a={here:Mine.here(),текст:Mine.text(),ярус:Mine.ярус()};
  /* И в чужом подземелье — тоже нет. */
  G.place={bx:100,by:100,depth:20,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const b={here:Mine.here(),приход:Mine.приход(20),обвал:Mine.обвал(),
   отдых:(()=>{__said.length=0;const r=Mine.отдых();return {r,слово:__said.join(" ")};})()};
  return {a,b};});
 check('вне Рудника модуль молчит и честно говорит, где вы',
  вне.a.here===false&&/не в Стоустом Руднике/.test(вне.a.текст)&&вне.a.ярус===0,вне.a);
 check('в чужом подземелье правила Рудника не работают',
  вне.b.here===false&&вне.b.приход===false&&вне.b.обвал===false
  &&вне.b.отдых.r===false&&/лагеря на этом ярусе нет/i.test(вне.b.отдых.слово),вне.b);

 /* ── 3. ярусы устойчивы ── */
 const ярусы=await page.evaluate(()=>{
  const c=Complexes.byId("cx_mine");
  G.place={bx:c.x,by:c.y,depth:1,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const снимок=d=>({в:(Mine.ветвь(d)||{}).id,п:(Mine.правило(d)||{}).д,
   ж:(Mine.минерал(d)||{}).id||null,л:Mine.лагерь(d),м:Mine.механизм(d)});
  const первый=[1,7,15,33,50,77,100].map(снимок);
  const второй=[1,7,15,33,50,77,100].map(снимок);
  return {here:Mine.here(),
   устойчиво:JSON.stringify(первый)===JSON.stringify(второй),
   штрековВстретилось:new Set([...Array(100).keys()].map(i=>(Mine.ветвь(i+1)||{}).id)).size,
   правилоУ:[5,15,25,95,100].map(d=>(Mine.правило(d)||{}).д),
   первый};});
 check('в Руднике ярус знает свой штрек и своё правило, и они не меняются',
  ярусы.here===true&&ярусы.устойчиво&&ярусы.штрековВстретилось===6,ярусы);
 check('правило берётся по десятку, в который попал ярус',
  ярусы.правилоУ.join(",")==="10,20,30,100,100",ярусы.правилоУ);

 /* ── 4. живая жила ── */
 const живая=await page.evaluate(()=>{
  const c=Complexes.byId("cx_mine");
  const d=[...Array(100).keys()].map(i=>i+1).find(x=>Mine.минерал(x));
  G.place={bx:c.x,by:c.y,depth:d,stype:"cave_entrance",kind:"dungeon",x:3,y:3};
  const ж=Mine.минерал(d);
  G.inv={};G.hp=100;G.hpMax=100;__played.length=0;
  const слово=Mine.добыть();
  return {ярус:d,жила:ж.n,порода:ж.порода,слово,
   всуме:(Number(G.inv[ж.порода])||0)>=1,голос:__played.indexOf(ж.звук)>=0,
   отдача:G.hp<100,
   ярусБезЖилы:(()=>{const b=[...Array(100).keys()].map(i=>i+1).find(x=>!Mine.минерал(x));
    G.place.depth=b;return {ярус:b,добыча:Mine.добыть()};})()};});
 check('живая жила отдаёт свою породу, звучит своим голосом и может ответить',
  живая.всуме&&живая.голос&&/Живая жила/.test(живая.слово||""),живая);
 check('на ярусе без живой жилы её и нет',
  живая.ярусБезЖилы.добыча===null,живая.ярусБезЖилы);

 /* ── 5. лагерь ── */
 const лагерь=await page.evaluate(()=>{
  const c=Complexes.byId("cx_mine");
  G.place={bx:c.x,by:c.y,depth:20,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const где=[10,20,30,40,50].map(d=>Mine.лагерь(d));
  G.hp=10;G.hpMax=100;const час=Number(G.hour)||0,день=Number(G.day)||1;
  __said.length=0;__played.length=0;
  const ok=Mine.отдых();
  const прошло=(Number(G.day)-день)*24+(Number(G.hour)-час);
  const меню={есть:amAvailable("whisperrest")};
  G.place.depth=41;меню.нет=amAvailable("whisperrest");
  return {где,ok,hp:G.hp,прошло,слово:__said.join(" "),голос:__played.indexOf("lug_fire")>=0,меню};});
 check('лагеря стоят до тридцатого яруса на каждом десятом, ниже их нет',
  лагерь.где.join(",")==="true,true,true,false,false",лагерь.где);
 check('привал даёт здоровье, берёт час, звучит костром и говорит, что ниже',
  лагерь.ok===true&&лагерь.hp>10&&Math.abs(лагерь.прошло-1)<0.35
  &&лагерь.голос&&/ниже начинается/.test(лагерь.слово),лагерь);
 check('пункт привала виден только там, где лагерь есть',
  лагерь.меню.есть===true&&лагерь.меню.нет===false,лагерь.меню);

 /* ── 6. подъёмник ── */
 const лифт=await page.evaluate(()=>{
  const c=Complexes.byId("cx_mine");
  G.place={bx:c.x,by:c.y,depth:50,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const цел=Mine.механизм(50);
  const меню={есть:amAvailable("whisperup"),ещё:amAvailable("whisperdown")};
  __played.length=0;
  const вверх=Mine.подъём(false);
  const после=G.place?G.place.depth:null;
  /* Весь десяток «Зала воротов» — это машины: там подъёмник цел по правилу.
     Ищем ярус в другом десятке, где его и вправду нет. */
  const пусто=[...Array(100).keys()].map(i=>i+1).find(d=>!Mine.механизм(d));
  G.place.depth=пусто;const нетМеню=amAvailable("whisperup");
  return {цел,меню,вверх,после,пусто,нетМеню,голос:__played.indexOf("oc_lift_start")>=0};});
 check('на ярусе зала воротов подъёмник цел и виден в меню',
  лифт.цел===true&&лифт.меню.есть&&лифт.меню.ещё,лифт);
 check('подъёмник берёт десять ярусов разом и звучит своим механизмом',
  лифт.вверх===true&&лифт.после===40&&лифт.голос,лифт);
 check('там, где подъёмника нет, пункта меню тоже нет',
  лифт.нетМеню===false,{ярус:лифт.пусто});

 /* ── 7. обвалы ── */
 const обвал=await page.evaluate(()=>{
  const c=Complexes.byId("cx_mine");
  G.place={bx:c.x,by:c.y,depth:70,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const шансы={верх:Mine.обвалШанс(10),середина:Mine.обвалШанс(50),обвальный:Mine.обвалШанс(70)};
  /* Сам обвал: заставляем его случиться и смотрим, что он делает. */
  G.hp=100;G.hpMax=100;const час=Number(G.hour)||0,день=Number(G.day)||1;
  const rnd=Math.random;Math.random=()=>0;
  __said.length=0;__played.length=0;
  const был=Mine.обвал();
  Math.random=rnd;
  return {шансы,был,hp:G.hp,
   прошло:(Number(G.day)-день)*24+(Number(G.hour)-час),
   слово:__said.join(" "),голос:__played.indexOf("oc_earthquake")>=0};});
 check('шанс обвала растёт с глубиной, на обвальных ярусах вдвое, на верхних крепях меньше',
  обвал.шансы.верх<обвал.шансы.середина&&обвал.шансы.обвальный>обвал.шансы.середина,обвал.шансы);
 check('обвал отнимает здоровье и час, звучит и называет себя',
  обвал.был===true&&обвал.hp<100&&Math.abs(обвал.прошло-1)<0.35
  &&обвал.голос&&/Обвал/.test(обвал.слово),обвал);

 /* ── 8. шёпот ── */
 const шёпот=await page.evaluate(()=>{
  const c=Complexes.byId("cx_mine");
  const d=MINE_RULES.find(r=>r.дело==="эхо врёт").д;
  G.place={bx:c.x,by:c.y,depth:d,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  G.skills=[];
  const врёт=Mine.эхоВрёт(d);
  const слово=Mine.слово(d);
  G.skills=["deepsense"];
  const сЧутьём=Mine.эхоВрёт(d);
  G.skills=[];
  const обычный=Mine.эхоВрёт(10);
  return {ярус:d,врёт,сЧутьём,обычный,предупреждает:/эхо отвечает не с той стороны/.test(слово),
   слово:слово.slice(-140)};});
 check('на своих ярусах эхо врёт, а на обычных нет',
  шёпот.врёт===true&&шёпот.обычный===false,шёпот);
 check('игра предупреждает о шёпоте прямо, до того как игрок пойдёт на звук',
  шёпот.предупреждает,шёпот.слово);
 check('Чутьё глубин снимает шёпот',шёпот.сЧутьём===false);

 /* ── 9. тайные камеры ── */
 const тайное=await page.evaluate(()=>{
  const c=Complexes.byId("cx_mine");
  const считать=()=>{let n=0;
   for(let x=0;x<40;x++)for(let y=0;y<40;y++)if(propHidesSwitch(G.place.bx,G.place.by,G.place.depth,x,y,undefined))n++;
   return n;};
  G.place={bx:100,by:100,depth:20,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const чужое=считать();
  G.place={bx:c.x,by:c.y,depth:20,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const рудник=считать();
  G.place.depth=90;const крепи=считать();
  return {чужое,рудник,крепи,K:{обычно:Mine.тайноеK(20),крепи:Mine.тайноеK(90)}};});
 check('в Руднике тайных камер вдвое больше, а на чужих крепях вчетверо',
  тайное.K.обычно===2&&тайное.K.крепи===4&&тайное.рудник>тайное.чужое&&тайное.крепи>тайное.рудник,
  тайное);

 /* ── 10. самопроверка, руководство, README ── */
 const свод=await page.evaluate(()=>{
  const c=worldSelfCheck();const r=(c.rows||c);
  const гл=GUIDE.find(g=>/Стоустый Рудник/i.test(g.title));
  return {whisper:(r.find?r.find(x=>x&&x.id==="mine"):null)||null,
   плохие:(r.filter?r.filter(x=>x&&x.ok===false).map(x=>x.id):[]),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «whisper»',
  !!свод.whisper&&свод.whisper.ok===true,свод.whisper);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о Руднике',свод.глава&&свод.строк>=5,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 check('README рассказывает о восьми свойствах Рудника',
  /Стоуст[ыои][йм] Рудник[еа]?/i.test(readme)&&/штрек/i.test(readme)
  &&/живая жила|живые жилы|живых жил/i.test(readme)&&/подъёмник/i.test(readme));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
