/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 151: ДЕВЯТЬ СЛАГАЕМЫХ НАЙДЕННОЙ ВЕЩИ (§20 мастер-промпта)

   §20: BASE_ITEM + MATERIAL + QUALITY + RARITY + REGION + DUNGEON +
   CREATOR + HISTORY + RANDOM_PROPERTIES, и правило: «один и тот же
   базовый меч не должен всегда иметь одинаковые характеристики».

   genLoot давал четыре первых: род вещи, качество, редкость и выведенное
   из них число. Остальных пяти не было вовсе.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Отделки двенадцать родов, у каждой звук настоящей записью, берега
      множителей и хоть один слот; каждому слоту годятся минимум три.
   2. Отделка зовётся по слоту: рукоять, подбой, вставка.
   3. Свойств восемь, и каждое что-то делает, а не украшает карточку.
   4. Создателей и историй по дюжине, и все разные.
   5. У всякой находки все девять слагаемых, и отделка годится её слоту.
   6. Всё выводится из семени: та же клетка даёт ту же вещь.
   7. Соседние клетки дают разные вещи: сочетаний сотни, все двенадцать
      отделок встречаются, вещей без отделки нет.
   8. Редкость и качество не тронуты: распределение прежнее.
   9. Свойств тем больше, чем выше редкость, но никогда больше трёх.
  10. Свойства работают: утяжелённое поднимает требование силы,
      облегчённое опускает, закалённое замедляет износ.
  11. Голос вещи берётся от отделки.
  12. Карточка называет все девять слагаемых одной связной фразой.
  13. Самопроверка мира держит строку «loot»; модуль, глава, README, docs.
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
 await page.evaluate(()=>{try{enterGame();}catch(e){}});
 await page.waitForTimeout(300);

 /* ── 1–4. Состав ── */
 const состав=await page.evaluate(()=>{
  const СИНТЕЗ=/^(inst|orch|mood|relic|score|folk|depth)\//;
  const синтез=роль=>{const b=SOUND_BANK[роль];
   return !b||!Array.isArray(b.f)||!b.f.length||b.f.some(f=>СИНТЕЗ.test(String(f)));};
  const плохие=LOOT_FITTINGS.filter(x=>!(x.n&&x.род&&x.о&&x.k>0&&x.ц>0&&(x.слоты||[]).length));
  const синт=LOOT_FITTINGS.filter(x=>синтез(x.звук)).map(x=>x.id);
  const слоты={weapon:fitFor("weapon").length,armor:fitFor("armor").length,acc:fitFor("acc").length};
  const пустые=LOOT_TRAITS.filter(t=>!(t.n&&t.о&&(t.val||t.ц!==1||t.треб||t.износ))).map(t=>t.id);
  return {отделок:LOOT_FITTINGS.length,уник:new Set(LOOT_FITTINGS.map(x=>x.id)).size,
   плохие:плохие.map(x=>x.id),синт,слоты,
   части:FITTING_PART,
   свойств:LOOT_TRAITS.length,уникС:new Set(LOOT_TRAITS.map(x=>x.id)).size,пустые,
   мастеров:LOOT_SMITHS.length,уникМ:new Set(LOOT_SMITHS).size,
   историй:LOOT_TALES.length,уникИ:new Set(LOOT_TALES).size};});
 check('отделки двенадцать родов, все со звуком настоящей записью и в берегах, каждому слоту не меньше трёх',
  состав.отделок===12&&состав.уник===12&&состав.плохие.length===0&&состав.синт.length===0
  &&состав.слоты.weapon>=3&&состав.слоты.armor>=3&&состав.слоты.acc>=3,состав);
 check('отделка зовётся по слоту: рукоять, подбой, вставка',
  состав.части.weapon==="Рукоять"&&состав.части.armor==="Подбой"&&состав.части.acc==="Вставка",состав.части);
 check('свойств восемь, и каждое что-то делает',
  состав.свойств===8&&состав.уникС===8&&состав.пустые.length===0,состав);
 check('создателей и историй по дюжине, и все разные',
  состав.мастеров===12&&состав.уникМ===12&&состав.историй===12&&состав.уникИ===12,состав);

 /* ── 5–7. Девять слагаемых, семя и разнообразие ── */
 const вещи=await page.evaluate(()=>{
  const неполные=[],чужаяОтделка=[];
  const сочет=new Set(),отд={},свойства={};
  let безОтделки=0,безМастера=0,безПовести=0;
  for(let i=0;i<4000;i++){
   const it=genLoot(100+i%61,300+Math.floor(i/61),i*11+5,15);
   if(!it){неполные.push(i);continue;}
   if(!it.отделка)безОтделки++;
   if(!it.мастер)безМастера++;
   if(!it.повесть)безПовести++;
   if(!Number.isFinite(it.край))неполные.push("край"+i);
   if(!Array.isArray(it.черты))неполные.push("черты"+i);
   const f=FITTING_BY_ID[it.отделка];
   if(f&&f.слоты.indexOf(it.slot)<0)чужаяОтделка.push([it.type,it.отделка]);
   отд[it.отделка]=(отд[it.отделка]||0)+1;
   (it.черты||[]).forEach(c=>{свойства[c]=(свойства[c]||0)+1;});
   сочет.add(`${it.type}|${it.отделка}|${(it.черты||[]).join(",")}`);}
  /* Семя: тот же бросок — та же вещь. */
  const a=genLoot(1234,5678,7,12),b=genLoot(1234,5678,7,12);
  const тоЖе=a.name===b.name&&a.val===b.val&&a.отделка===b.отделка
   &&a.мастер===b.мастер&&a.повесть===b.повесть
   &&(a.черты||[]).join()===(b.черты||[]).join();
  /* Соседняя клетка — другая вещь хотя бы иногда. */
  const c=genLoot(1235,5678,7,12);
  return {неполных:неполные.length,чужих:чужаяОтделка.slice(0,3),чужихВсего:чужаяОтделка.length,
   безОтделки,безМастера,безПовести,
   сочетаний:сочет.size,отделокВстретилось:Object.keys(отд).length,
   свойствВстретилось:Object.keys(свойства).length,
   тоЖе,соседняя:c.отделка!==a.отделка||c.val!==a.val||c.type!==a.type};});
 check('у всякой находки все девять слагаемых, и отделка годится её слоту',
  вещи.неполных===0&&вещи.безОтделки===0&&вещи.безМастера===0&&вещи.безПовести===0
  &&вещи.чужихВсего===0,вещи);
 check('та же клетка и тот же бросок дают ту же вещь, соседняя — другую',
  вещи.тоЖе&&вещи.соседняя,вещи);
 check('сочетаний сотни, все двенадцать отделок встречаются, все восемь свойств тоже',
  вещи.сочетаний>=300&&вещи.отделокВстретилось===12&&вещи.свойствВстретилось===8,вещи);

 /* ── 8–9. Редкость не тронута, свойств не больше трёх ── */
 const редкость=await page.evaluate(()=>{
  const счёт=lvl=>{const m={};let максЧерт=0,перебор=0;
   for(let i=0;i<6000;i++){const it=genLoot(100+i%79,200+Math.floor(i/79),i*7+3,lvl);
    m[it.rank]=(m[it.rank]||0)+1;
    const n=(it.черты||[]).length;
    if(n>максЧерт)максЧерт=n;
    if(n>3)перебор++;
    /* низкая редкость — мало свойств */
    if(it.rank<=1&&n>2)перебор++;}
   return {m,максЧерт,перебор};};
  const ур1=счёт(1),ур40=счёт(40);
  const пот=o=>Math.max(...Object.keys(o.m).map(Number));
  /* Свойств у высокой редкости в среднем больше, чем у низкой. */
  const средн=(lo,hi)=>{let s=0,n=0;
   for(let i=0;i<4000;i++){const it=genLoot(400+i%53,900+Math.floor(i/53),i*13+1,40);
    if(it.rank>=lo&&it.rank<=hi){s+=(it.черты||[]).length;n++;}}
   return n?s/n:0;};
  return {потолок1:пот(ур1),потолок40:пот(ур40),
   максЧерт:Math.max(ур1.максЧерт,ур40.максЧерт),
   перебор:ур1.перебор+ур40.перебор,
   низкие:+средн(0,1).toFixed(2),высокие:+средн(4,9).toFixed(2)};});
 check('редкость не тронута: потолок на первом уровне прежний, на сороковом выше',
  редкость.потолок1===5&&редкость.потолок40>5,редкость);
 check('свойств тем больше, чем выше редкость, но никогда больше трёх',
  редкость.максЧерт<=3&&редкость.перебор===0&&редкость.высокие>редкость.низкие,редкость);

 /* ── 10–11. Свойства работают, голос от отделки ── */
 const дело=await page.evaluate(()=>{
  const баз={rank:2,qual:2};
  const треб=[itemStrReq(баз),itemStrReq(Object.assign({},баз,{треб:2})),
              itemStrReq(Object.assign({},баз,{треб:-2}))];
  /* Износ: закалённое снашивается медленнее. */
  const было={weapon:{name:"проба",type:"Меч",val:5,сост:100,стойкость:0}};
  const крепк={weapon:{name:"проба",type:"Меч",val:5,сост:100,стойкость:1}};
  let обыч=0,стойк=0;
  for(let i=0;i<60;i++){G.equip=JSON.parse(JSON.stringify(было));gearWear();обыч+=100-G.equip.weapon.сост;}
  for(let i=0;i<60;i++){G.equip=JSON.parse(JSON.stringify(крепк));gearWear();стойк+=100-G.equip.weapon.сост;}
  G.equip={};
  /* Голос: отделка решает. */
  const г=[itemVoice({type:"Меч",отделка:"bone"}),itemVoice({type:"Меч",отделка:"silk"}),
           itemVoice({type:"Меч"})];
  return {треб,обыч,стойк,г};});
 check('свойства работают: утяжелённое требует силы больше, облегчённое меньше, закалённое снашивается медленнее',
  дело.треб[1]>дело.треб[0]&&дело.треб[2]<дело.треб[0]&&дело.стойк<дело.обыч,дело);
 check('голос вещи берётся от отделки, а без неё — от рода вещи',
  дело.г[0]==="arte_heavy"&&дело.г[1]==="arte_cloth"&&дело.г[2]==="arte_metal",дело.г);

 /* ── 12. Карточка ── */
 const карточка=await page.evaluate(()=>{
  const it=genLoot(1234,5678,7,12);
  const стр=lootDesc(it);
  const f=FITTING_BY_ID[it.отделка];
  return {стр,длина:стр.length,
   естьОтделка:стр.indexOf(f.род)>=0,
   естьЧасть:["Рукоять","Подбой","Вставка"].some(w=>стр.indexOf(w)>=0),
   естьКрай:/Найдено в области/.test(стр),
   естьМастер:стр.toLowerCase().indexOf(it.мастер.toLowerCase())>=0,
   естьПовесть:стр.toLowerCase().indexOf(it.повесть.slice(0,14).toLowerCase())>=0,
   естьРанг:/Ранг /.test(стр),естьКачество:/качество /.test(стр),
   естьСвойства:/Свойств/.test(стр)};});
 check('карточка называет все девять слагаемых одной связной фразой',
  карточка.длина>100&&карточка.естьОтделка&&карточка.естьЧасть&&карточка.естьКрай
  &&карточка.естьМастер&&карточка.естьПовесть&&карточка.естьРанг
  &&карточка.естьКачество&&карточка.естьСвойства,карточка);

 /* ── 13. Самопроверка, модуль, глава ── */
 const свод=await page.evaluate(()=>{
  const rows=worldSelfCheck();
  const r=rows.find(x=>x.id==="loot");
  const гл=GUIDE.find(g=>/Девять слагаемых/i.test(g.title));
  const L=Modules.get("LOOT");
  return {строка:!!r,ок:r&&r.ok===true,
   красные:rows.filter(x=>!x.ok).map(x=>x.id),
   модуль:!!L,отделок:L?L.fittings.length:0,
   текст:L?String(L.text()).slice(0,60):"",
   глава:!!гл,строкГлавы:гл?гл.body.length:0};});
 check('самопроверка мира держит строку «loot» и вся зелена',
  свод.строка&&свод.ок&&свод.красные.length===0,свод);
 check('модуль LOOT зарегистрирован и отвечает',
  свод.модуль&&свод.отделок===12&&свод.текст.length>20,свод);
 check('в руководстве есть глава о девяти слагаемых',свод.глава&&свод.строкГлавы>=6,свод);

 const ROOT=path.resolve(__dirname,'..');
 const readme=fs.readFileSync(path.join(ROOT,'README.md'),'utf8');
 const mir=fs.readFileSync(path.join(ROOT,'docs','МИР.md'),'utf8');
 check('README рассказывает о девяти слагаемых и отделке',
  /Девять слагаемых/i.test(readme)&&/отделка/i.test(readme)
  &&/кость исполина/i.test(readme)&&/создатель/i.test(readme));
 check('docs/МИР.md держит устройство находки',
  /LOOT_FITTINGS/.test(mir)&&/lootFittingFor/.test(mir)&&/LOOT_TRAITS/.test(mir)
  &&/FITTING_PART/.test(mir));

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
