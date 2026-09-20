/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 113: КРЕПОСТЬ-ОБЩИНА, ТАВЕРНА И РЕЙВЕНФОРДСКАЯ ДУГА

   1. Данные: четырнадцать частей крепости и семь служб со звуком и своим
      двором; семнадцать вещей таверны и девять её происшествий; двенадцать
      примет войны и шесть дел на дуге. Самопроверка мира знает все три.
   2. Служба крепости берёт из общего склада, звучит и пишется; на пустой
      склад честно отказывает.
   3. Осада уводит людей на стены: библиотека, мастерская, конюшни и склады
      закрыты, кухня, лечебница и арсенал открыты и стоят вдвое.
   4. Община ест каждый день; в осаде — втрое; пустой склад распускает
      гарнизон.
   5. Правка кромки и свежий конь — не слова: удар весомее, шаг короче.
   6. Таверна: семнадцать вещей на месте, происшествие случается само, в тот
      же час не повторяется, звучит и пишется в летопись.
   7. Дуга: фронт двигается сам за сутки сильнее, чем дело игрока; война
      поднимает цену; срытая дорога отнимает время; вне дуги дело отказывает.
   8. Окно «Живой мир» показывает дугу, меню действий — три новых строки.
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
 await page.evaluate(()=>{window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,Object.assign({},o||{},{gain:0,maxSec:0.4}));};
  window.JT=window.JT||[];const j=window.journal;window.journal=t=>{JT.push(String(t));return j(t);};});

 /* ── 1. данные ── */
 const данные=await page.evaluate(()=>{
  const r={};
  r.части=FORT_PARTS.length;r.естьНовые=["library","workshop"].every(id=>FORT_PARTS.some(p=>p.id===id));
  r.службы=FORT_SERVICES.length;
  r.службыОк=FORT_SERVICES.every(x=>SOUND_BANK[x.звук]&&FORT_PARTS.some(p=>p.id===x.часть)&&x.цена>0&&x.n&&x.о&&typeof x.дело==="function");
  r.вещи=(PROPS_BY_PLACE.tavern||[]).length;
  r.вещиОк=(PROPS_BY_PLACE.tavern||[]).every(id=>PROP_BY_ID[id]&&typeof PROP_BY_ID[id].use==="function");
  r.события=TAVERN_EVENTS.length;
  r.событияОк=TAVERN_EVENTS.every(x=>SOUND_BANK[x.звук]&&x.n&&x.о&&typeof x.дело==="function");
  r.приметы=WAR_FEATURES.length;r.приметыОк=WAR_FEATURES.every(x=>SOUND_BANK[x.звук]&&x.n&&x.о);
  r.дела=WAR_ACTS.length;r.делаОк=WAR_ACTS.every(x=>SOUND_BANK[x.звук]&&x.сдвиг>0&&x.n&&x.о);
  r.модули=["GARRISON","TAVERN","WARARC"].every(m=>!!Modules.get(m));
  const sc=worldSelfCheck();
  r.строки=["fort","tavern","wararc"].filter(id=>{const x=sc.find(y=>y.id===id);return !x||!x.ok;});
  return r;});
 check('у крепости четырнадцать частей, и среди них библиотека с мастерской; семь служб, у каждой свой двор, цена и звук',
  данные.части===14&&данные.естьНовые&&данные.службы===7&&данные.службыОк,данные);
 check('в таверне семнадцать вещей, и каждая отвечает делом; девять происшествий со звуком',
  данные.вещи===17&&данные.вещиОк&&данные.события===9&&данные.событияОк,данные);
 check('у дуги двенадцать примет войны и шесть дел со звуком; три модуля на месте, и самопроверка мира знает все три строки',
  данные.приметы===12&&данные.приметыОк&&данные.дела===6&&данные.делаОк&&данные.модули&&данные.строки.length===0,данные);

 /* ── 2. служба крепости берёт из склада ── */
 const служба=await page.evaluate(()=>{
  const r={};const f=FORTS[0];G.forts={};const st=Forts.state(f.id);
  st.owner="player";st.walls=100;st.supplies=100;st.garrison=20;st.siege=null;
  G.hp=1;G.hpMax=100;G.food=0;
  PLAYED.length=0;JT.length=0;
  const p=Garrison.open(f.id,"kitchen");r.цена=p.цена;r.можно=p.ok;
  r.текст=Garrison.use(f.id,"kitchen");
  r.склад=st.supplies;r.hp=G.hp;r.сытость=G.food;
  r.звук=PLAYED.includes("wild_hearth");r.летопись=JT.some(t=>/Служба крепости: горячая похлёбка/.test(t));
  /* пустой склад отказывает, и отказ называет число */
  st.supplies=1;const p2=Garrison.open(f.id,"infirmary");
  r.отказ=p2.ok===false&&/на складе 1 припасов, а нужно/i.test(p2.почему);
  r.отказТекст=Garrison.use(f.id,"infirmary");
  r.складПосле=st.supplies;
  /* пустая крепость никого не обслуживает */
  st.supplies=100;st.garrison=0;r.пустая=Garrison.open(f.id,"kitchen").ok===false;
  return r;});
 check('служба крепости берёт из общего склада, звучит, пишется в летопись и делает дело; на нехватку отвечает числом и ничего не тратит; пустая крепость не служит',
  служба.можно&&служба.цена===4&&служба.склад===96&&служба.hp>1&&служба.сытость>0&&служба.звук&&служба.летопись&&
  /Со склада ушло 4/.test(служба.текст)&&служба.отказ&&служба.складПосле===1&&служба.пустая,служба);

 /* ── 3. осада уводит людей на стены ── */
 const осада=await page.evaluate(()=>{
  const r={};const f=FORTS[1];G.forts={};const st=Forts.state(f.id);
  st.owner="player";st.walls=100;st.supplies=100;st.garrison=20;st.siege=null;
  r.тихо=Garrison.routes(f.id);
  r.доОсады=FORT_SERVICES.filter(x=>Garrison.open(f.id,x.id).ok).map(x=>x.id);
  r.ценаДо=Garrison.open(f.id,"kitchen").цена;
  st.siege={by:1,day:Number(G.day)||1};
  r.вОсаде=Garrison.routes(f.id);
  r.открыты=FORT_SERVICES.filter(x=>Garrison.open(f.id,x.id).ok).map(x=>x.id);
  r.ценаВОсаде=Garrison.open(f.id,"kitchen").цена;
  r.почемуБиблиотека=Garrison.open(f.id,"library").почему;
  /* пробитые стены — то же самое, и без осады */
  st.siege=null;st.walls=30;
  r.стены=FORT_SERVICES.filter(x=>Garrison.open(f.id,x.id).ok).map(x=>x.id);
  return r;});
 check('в тихой крепости открыты все семь служб; осада и пробитые стены уводят людей, и остаются только кухня, лечебница и арсенал — вдвое дороже, с названной причиной',
  осада.доОсады.length===7&&осада.ценаДо===4&&осада.открыты.join()==="kitchen,infirmary,arsenal"&&
  осада.ценаВОсаде===8&&/на стенах/.test(осада.почемуБиблиотека)&&осада.стены.join()==="kitchen,infirmary,arsenal"&&
  /по дворам/.test(осада.тихо)&&/на стены/.test(осада.вОсаде),осада);

 /* ── 4. община ест каждый день ── */
 const еда=await page.evaluate(()=>{
  const r={};G.forts={};const a=FORTS[2],b=FORTS[3];
  const sa=Forts.state(a.id),sb=Forts.state(b.id);
  sa.supplies=50;sa.garrison=20;sa.siege=null;
  sb.supplies=50;sb.garrison=20;sb.siege={by:1,day:1};
  Garrison.daily();
  r.тихая=sa.supplies;r.воюющая=sb.supplies;
  sb.supplies=1;const было=sb.garrison;Garrison.daily();
  r.голод=sb.supplies===0&&sb.garrison<было;r.гарнизон=sb.garrison;
  return r;});
 check('община ест каждый день: тихая крепость возвращает склад, осаждённая теряет втрое, а пустой склад распускает гарнизон',
  еда.тихая===51&&еда.воюющая===47&&еда.голод,еда);

 /* ── 5. заточка и конь — не слова ── */
 const дела=await page.evaluate(()=>{
  const r={};const f=FORTS[4];G.forts={};const st=Forts.state(f.id);
  st.owner="player";st.walls=100;st.supplies=100;st.garrison=20;st.siege=null;
  G.buffs={};G.str=10;G.equip=G.equip||{};G.equip.weapon={id:1,name:"Проба",type:"Меч",val:5};
  r.удар0=atk();Garrison.use(f.id,"workshop");r.заточка=buffActive("заточка");r.удар1=atk();
  G.buffs={};r.конь0=buffActive("конь");Garrison.use(f.id,"stables");r.конь1=buffActive("конь");
  /* арсенал вооружает безоружного и не отнимает лучшего */
  G.equip.weapon=null;Garrison.use(f.id,"arsenal");r.меч=G.equip.weapon&&G.equip.weapon.val;
  G.equip.weapon={id:2,name:"Свой",type:"Меч",val:40};const т=Garrison.use(f.id,"arsenal");
  r.неОтнял=G.equip.weapon.val===40&&/в арсенале хуже/.test(т);
  return r;});
 check('правка кромки прибавляет к удару, конюшни дают коня, арсенал вооружает безоружного и не отнимает лучшего клинка',
  дела.удар1===дела.удар0+3&&дела.заточка&&дела.конь0===false&&дела.конь1===true&&дела.меч===9&&дела.неОтнял,дела);

 /* ── 6. таверна ── */
 const таверна=await page.evaluate(()=>{
  const r={};G.tavern={};G.place={bx:11,by:13,stype:"tavern",depth:0,x:2,y:2,name:"Таверна пробы"};
  G.day=5;G.hour=12;
  r.внутри=Tavern.in();r.текст=Tavern.text();
  PLAYED.length=0;JT.length=0;SAID.length=0;
  r.первое=Tavern.happen();
  r.звук=PLAYED.length>0;r.летопись=JT.some(t=>/В таверне: /.test(t));r.сказано=SAID.some(t=>t.length>20);
  r.второе=Tavern.happen();
  G.hour=13;r.третье=Tavern.happen();
  r.силой=Tavern.happen("meal");
  /* все девять случаются, и каждое — своё */
  const тексты=TAVERN_EVENTS.map(e=>{G.tavern={};return String(Tavern.happen(e.id)||"");});
  r.всеРазные=new Set(тексты).size===9&&тексты.every(t=>t.length>30);
  G.place=null;r.снаружи=Tavern.happen();r.снаружиТекст=Tavern.text();
  return r;});
 check('таверна знает свои семнадцать вещей и девять происшествий; происшествие случается само, звучит, говорит и пишется; в тот же час не повторяется, в следующий — да',
  таверна.внутри&&/семнадцать|17 вещей/.test(таверна.текст)&&таверна.первое.length>30&&таверна.звук&&таверна.летопись&&
  таверна.сказано&&таверна.второе===""&&таверна.третье.length>30&&таверна.силой.length>30&&таверна.всеРазные&&
  таверна.снаружи===""&&/Таверны вокруг нет/.test(таверна.снаружиТекст),таверна);

 /* ── 7. дуга войны ── */
 const дуга=await page.evaluate(()=>{
  const r={};G.war=null;G.x=WAR_ARC.x;G.y=WAR_ARC.y;G.place=null;G.ship=null;G.day=20;G.gold=500;
  r.тут=!!WarArc.here();r.текст=WarArc.text();
  const st=WarArc.state();st.фронт=0;st.накал=60;st.дела={};st.день=G.day;
  PLAYED.length=0;JT.length=0;
  r.дело=WarArc.act("supply");r.послеДела=st.фронт;r.золото=G.gold;
  r.звук=PLAYED.includes("deep_cart");r.летопись=JT.some(t=>/Дуга: поднести припас/.test(t));
  r.дважды=WarArc.act("supply");
  /* война идёт и без игрока, и двигает фронт сильнее */
  st.фронт=0;G.day=21;const было=st.фронт;r.сама=WarArc.tick();r.сдвигСам=Math.abs(st.фронт-было);
  r.сдвигИгрока=Math.max(...WAR_ACTS.map(a=>a.сдвиг));
  /* цена и дорога */
  r.ценаВнутри=WarArc.priceK("железо");
  const дальше=WAR_ARC.x+WAR_ARC.r+50;
  r.ценаСнаружи=(()=>{const x=G.x;G.x=дальше;const k=WarArc.priceK("железо");G.x=x;return k;})();
  const срытая=(()=>{for(let i=0;i<4000;i++){const x=WAR_ARC.x-200+i%400,y=WAR_ARC.y-200+Math.floor(i/400);
    const f=WarArc.feature(x,y);if(f&&f.id==="broken")return [x,y];}return null;})();
  r.срытая=срытая?WarArc.roadK(срытая[0],срытая[1]):null;
  r.вДуге=WarArc.roadK(WAR_ARC.x,WAR_ARC.y);r.вне=WarArc.roadK(дальше,WAR_ARC.y);
  /* вне дуги дело отказывает */
  G.x=дальше;r.отказ=WarArc.act("supply");
  r.нетДела=WarArc.act("такого нет");
  return r;});
 check('дело на дуге двигает фронт, берёт плату, звучит и пишется; дважды в день не идёт; вне дуги честно отказывает',
  дуга.тут&&дуга.послеДела===3&&дуга.золото===460&&дуга.звук&&дуга.летопись&&/уже сделано/.test(дуга.дважды)&&
  /далеко отсюда/.test(дуга.отказ)&&/Такого дела/.test(дуга.нетДела),дуга);
 check('война идёт и без игрока: сутки двигают фронт сами, до шести делений, а одно дело игрока — не больше четырёх и только раз в сутки; в дуге дорожает железо, а срытая дорога отнимает время',
  дуга.сама&&дуга.сдвигСам<=6&&дуга.сдвигИгрока===4&&дуга.ценаВнутри>1&&дуга.ценаСнаружи===1&&
  дуга.срытая===1.25&&дуга.вДуге>=1.05&&дуга.вне===1,дуга);

 /* ── 8. окна и меню ── */
 const окна=await page.evaluate(async()=>{
  const r={};for(let i=0;i<20&&activeLayer();i++)closeTopUI();
  SAID.length=0;CMD.living();await new Promise(res=>setTimeout(res,120));
  r.живой=activeLayer()&&activeLayer().id;
  r.дуга=(document.getElementById("lwWar")||{}).innerHTML||"";
  r.кнопок=document.querySelectorAll('#lwWar [data-cmd^="waract:"]').length;
  for(let i=0;i<20&&activeLayer();i++)closeTopUI();
  /* окно крепости: службы видны кнопками */
  const f=FORTS[5];G.forts={};const st=Forts.state(f.id);
  st.owner="player";st.supplies=100;st.garrison=20;st.walls=100;st.siege=null;
  const h=Forts.windowHtml(f);
  r.служб=(h.match(/data-cmd="garrison:/g)||[]).length;r.заголовок=/Службы крепости/.test(h);
  const м=JSON.stringify(AM_GROUPS);
  r.меню=["garrison","tavern","war"].every(c=>м.includes('"'+c+'"'));
  SAID.length=0;CMD.war();r.сказаноВойна=SAID.some(t=>/Рейвенфордская дуга/.test(t));
  SAID.length=0;CMD.tavern();r.сказаноТаверна=SAID.some(t=>t.length>10);
  SAID.length=0;CMD.garrison();r.сказаноКрепость=SAID.some(t=>t.length>10);
  return r;});
 check('окно «Живой мир» показывает дугу с делами, окно крепости — семь служб кнопками, меню действий — три новые строки, и каждая команда отвечает вслух',
  окна.живой==="modal-living"&&окна.кнопок===6&&окна.служб===7&&окна.заголовок&&окна.меню&&
  окна.сказаноВойна&&окна.сказаноТаверна&&окна.сказаноКрепость,окна);

 check('страница без ошибок JavaScript',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(r=>console.log(r));
 const fails=results.filter(r=>r.startsWith('FAIL')).length;
 console.log(`\n${results.length-fails}/${results.length} passed`);
 process.exit(fails?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
