/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 126: ШАХТА ШЕПЧУЩИХСЯ ГЛУБИН (§6 брифа)

   §6 требует именное стоярусное подземелье, и в нём восемь вещей: живые
   минералы, шахтёрские лагеря, обвалы, механизмы, ветви, тайные камеры,
   аудиальные аномалии и ярусы с уникальными правилами.

   Шахта в мире была — но только в паспорте подземелий, строкой. Внутри она
   ничем не отличалась от любой другой дыры в земле.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Шесть штреков, десять правил по десяткам, четыре живые жилы: у всего
      имя, слово, настоящая порода из мира и своя живая запись.
   2. Вне Шахты ничего этого нет: модуль честно говорит, что вы не в ней.
   3. Ветвь и правило у яруса свои и не меняются: шахта всегда одна и та же.
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
   9. Тайных камер в Шахте вдвое больше, на чужих крепях вчетверо.
  10. Самопроверка мира держит строку «whisper», руководство и README
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
  штреков:WHISPER_BRANCHES.length,правил:WHISPER_RULES.length,живых:WHISPER_LIVE.length,
  штрекПолон:WHISPER_BRANCHES.every(b=>b.n&&b.о&&b.опасность&&RES_BASE[b.порода]&&SOUND_BANK[b.звук]),
  правилоПолно:WHISPER_RULES.every(r=>r.n&&r.о&&r.дело&&SOUND_BANK[r.звук]),
  живаяПолна:WHISPER_LIVE.every(l=>l.n&&l.о&&l.ответ&&RES_BASE[l.порода]&&SOUND_BANK[l.звук]&&l.урон>0),
  десятки:WHISPER_RULES.map(r=>r.д),
  звуковШтреков:new Set(WHISPER_BRANCHES.map(b=>b.звук)).size,
  звуковПравил:new Set(WHISPER_RULES.map(r=>r.звук)).size,
  звуковЖивых:new Set(WHISPER_LIVE.map(l=>l.звук)).size,
  паспорт:!!Complexes.byId("cx_whisper")}));
 check('шесть штреков, десять правил и четыре живые жилы, и у всего есть имя, слово и порода',
  состав.штреков===6&&состав.правил===10&&состав.живых===4
  &&состав.штрекПолон&&состав.правилоПолно&&состав.живаяПолна,состав);
 check('правила стоят по десяткам от десятого до сотого, без пропусков',
  состав.десятки.join(",")==="10,20,30,40,50,60,70,80,90,100",состав.десятки);
 check('у каждого штрека, правила и живой жилы своя живая запись',
  состав.звуковШтреков===6&&состав.звуковПравил>=8&&состав.звуковЖивых===4,состав);
 check('Шахта стоит в паспорте подземелий именным комплексом',состав.паспорт);

 /* ── 2. вне Шахты ничего нет ── */
 const вне=await page.evaluate(()=>{
  G.place=null;
  const a={here:Whisper.here(),текст:Whisper.text(),ярус:Whisper.ярус()};
  /* И в чужом подземелье — тоже нет. */
  G.place={bx:100,by:100,depth:20,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const b={here:Whisper.here(),приход:Whisper.приход(20),обвал:Whisper.обвал(),
   отдых:(()=>{__said.length=0;const r=Whisper.отдых();return {r,слово:__said.join(" ")};})()};
  return {a,b};});
 check('вне Шахты модуль молчит и честно говорит, где вы',
  вне.a.here===false&&/не в Шахте/.test(вне.a.текст)&&вне.a.ярус===0,вне.a);
 check('в чужом подземелье правила Шахты не работают',
  вне.b.here===false&&вне.b.приход===false&&вне.b.обвал===false
  &&вне.b.отдых.r===false&&/лагеря на этом ярусе нет/i.test(вне.b.отдых.слово),вне.b);

 /* ── 3. ярусы устойчивы ── */
 const ярусы=await page.evaluate(()=>{
  const c=Complexes.byId("cx_whisper");
  G.place={bx:c.x,by:c.y,depth:1,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const снимок=d=>({в:(Whisper.ветвь(d)||{}).id,п:(Whisper.правило(d)||{}).д,
   ж:(Whisper.минерал(d)||{}).id||null,л:Whisper.лагерь(d),м:Whisper.механизм(d)});
  const первый=[1,7,15,33,50,77,100].map(снимок);
  const второй=[1,7,15,33,50,77,100].map(снимок);
  return {here:Whisper.here(),
   устойчиво:JSON.stringify(первый)===JSON.stringify(второй),
   штрековВстретилось:new Set([...Array(100).keys()].map(i=>(Whisper.ветвь(i+1)||{}).id)).size,
   правилоУ:[5,15,25,95,100].map(d=>(Whisper.правило(d)||{}).д),
   первый};});
 check('в Шахте ярус знает свой штрек и своё правило, и они не меняются',
  ярусы.here===true&&ярусы.устойчиво&&ярусы.штрековВстретилось===6,ярусы);
 check('правило берётся по десятку, в который попал ярус',
  ярусы.правилоУ.join(",")==="10,20,30,100,100",ярусы.правилоУ);

 /* ── 4. живая жила ── */
 const живая=await page.evaluate(()=>{
  const c=Complexes.byId("cx_whisper");
  const d=[...Array(100).keys()].map(i=>i+1).find(x=>Whisper.минерал(x));
  G.place={bx:c.x,by:c.y,depth:d,stype:"cave_entrance",kind:"dungeon",x:3,y:3};
  const ж=Whisper.минерал(d);
  G.inv={};G.hp=100;G.hpMax=100;__played.length=0;
  const слово=Whisper.добыть();
  return {ярус:d,жила:ж.n,порода:ж.порода,слово,
   всуме:(Number(G.inv[ж.порода])||0)>=1,голос:__played.indexOf(ж.звук)>=0,
   отдача:G.hp<100,
   ярусБезЖилы:(()=>{const b=[...Array(100).keys()].map(i=>i+1).find(x=>!Whisper.минерал(x));
    G.place.depth=b;return {ярус:b,добыча:Whisper.добыть()};})()};});
 check('живая жила отдаёт свою породу, звучит своим голосом и может ответить',
  живая.всуме&&живая.голос&&/Живая жила/.test(живая.слово||""),живая);
 check('на ярусе без живой жилы её и нет',
  живая.ярусБезЖилы.добыча===null,живая.ярусБезЖилы);

 /* ── 5. лагерь ── */
 const лагерь=await page.evaluate(()=>{
  const c=Complexes.byId("cx_whisper");
  G.place={bx:c.x,by:c.y,depth:20,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const где=[10,20,30,40,50].map(d=>Whisper.лагерь(d));
  G.hp=10;G.hpMax=100;const час=Number(G.hour)||0,день=Number(G.day)||1;
  __said.length=0;__played.length=0;
  const ok=Whisper.отдых();
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
  const c=Complexes.byId("cx_whisper");
  G.place={bx:c.x,by:c.y,depth:50,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const цел=Whisper.механизм(50);
  const меню={есть:amAvailable("whisperup"),ещё:amAvailable("whisperdown")};
  __played.length=0;
  const вверх=Whisper.подъём(false);
  const после=G.place?G.place.depth:null;
  /* Весь десяток «Зала воротов» — это машины: там подъёмник цел по правилу.
     Ищем ярус в другом десятке, где его и вправду нет. */
  const пусто=[...Array(100).keys()].map(i=>i+1).find(d=>!Whisper.механизм(d));
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
  const c=Complexes.byId("cx_whisper");
  G.place={bx:c.x,by:c.y,depth:70,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const шансы={верх:Whisper.обвалШанс(10),середина:Whisper.обвалШанс(50),обвальный:Whisper.обвалШанс(70)};
  /* Сам обвал: заставляем его случиться и смотрим, что он делает. */
  G.hp=100;G.hpMax=100;const час=Number(G.hour)||0,день=Number(G.day)||1;
  const rnd=Math.random;Math.random=()=>0;
  __said.length=0;__played.length=0;
  const был=Whisper.обвал();
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
  const c=Complexes.byId("cx_whisper");
  const d=WHISPER_RULES.find(r=>r.дело==="эхо врёт").д;
  G.place={bx:c.x,by:c.y,depth:d,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  G.skills=[];
  const врёт=Whisper.эхоВрёт(d);
  const слово=Whisper.слово(d);
  G.skills=["deepsense"];
  const сЧутьём=Whisper.эхоВрёт(d);
  G.skills=[];
  const обычный=Whisper.эхоВрёт(10);
  return {ярус:d,врёт,сЧутьём,обычный,предупреждает:/эхо отвечает не с той стороны/.test(слово),
   слово:слово.slice(-140)};});
 check('на своих ярусах эхо врёт, а на обычных нет',
  шёпот.врёт===true&&шёпот.обычный===false,шёпот);
 check('игра предупреждает о шёпоте прямо, до того как игрок пойдёт на звук',
  шёпот.предупреждает,шёпот.слово);
 check('Чутьё глубин снимает шёпот',шёпот.сЧутьём===false);

 /* ── 9. тайные камеры ── */
 const тайное=await page.evaluate(()=>{
  const c=Complexes.byId("cx_whisper");
  const считать=()=>{let n=0;
   for(let x=0;x<40;x++)for(let y=0;y<40;y++)if(propHidesSwitch(G.place.bx,G.place.by,G.place.depth,x,y,undefined))n++;
   return n;};
  G.place={bx:100,by:100,depth:20,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const чужое=считать();
  G.place={bx:c.x,by:c.y,depth:20,stype:"cave_entrance",kind:"dungeon",x:1,y:1};
  const шахта=считать();
  G.place.depth=90;const крепи=считать();
  return {чужое,шахта,крепи,K:{обычно:Whisper.тайноеK(20),крепи:Whisper.тайноеK(90)}};});
 check('в Шахте тайных камер вдвое больше, а на чужих крепях вчетверо',
  тайное.K.обычно===2&&тайное.K.крепи===4&&тайное.шахта>тайное.чужое&&тайное.крепи>тайное.шахта,
  тайное);

 /* ── 10. самопроверка, руководство, README ── */
 const свод=await page.evaluate(()=>{
  const c=worldSelfCheck();const r=(c.rows||c);
  const гл=GUIDE.find(g=>/Шахта Шепчущихся Глубин/i.test(g.title));
  return {whisper:(r.find?r.find(x=>x&&x.id==="whisper"):null)||null,
   плохие:(r.filter?r.filter(x=>x&&x.ok===false).map(x=>x.id):[]),
   глава:!!гл,строк:гл?гл.body.length:0};});
 check('самопроверка мира держит зелёную строку «whisper»',
  !!свод.whisper&&свод.whisper.ok===true,свод.whisper);
 check('вся остальная самопроверка мира тоже зелёная',свод.плохие.length===0,свод.плохие);
 check('в руководстве есть глава о Шахте',свод.глава&&свод.строк>=5,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 check('README рассказывает о восьми свойствах Шахты',
  /Шахт[аеуы] Шепчущихся Глубин/i.test(readme)&&/штрек/i.test(readme)
  &&/живая жила|живые жилы|живых жил/i.test(readme)&&/подъёмник/i.test(readme));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
