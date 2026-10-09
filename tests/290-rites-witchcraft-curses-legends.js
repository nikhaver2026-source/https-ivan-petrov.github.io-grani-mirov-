/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 290: 14.5 — ОБРЯДЫ, ВЕДЬМОВСТВО, ПОРЧА И ЛЕГЕНДАРНЫЕ ВЕЩИ
   (ФАЗА V «БЕСКОНЕЧНОЙ ХРОНИКИ»)
   Мастер-промпт: «новые школы магии, ритуалы, проклятия, межмировые
   эффекты, рецепты и легендарные предметы»; ведьмовство — ковены, порча
   со стадиями, признаками, распознанием и несколькими способами снятия,
   связи как вещи мира, долги, охотники на ведьм, общества, изучающие
   сверхъестественное; легендарные вещи — происхождение, создатель,
   пробуждение, цена, рост, влияние на владельца, уничтожение.
    1. Десять новых школ полны: семейство, голос, семь слоёв настоящими
       записями, стихия, три именных чары, четыре специализации, у каждой
       есть заклинания в гримуаре.
    2. Луна одна на весь мир (та же, что у Сети Граней); обряд без знания
       школы и без маны объясняет, чего не хватает.
    3. Обряды действуют на мир: удача и долг удачи на рынке, зеркальная
       тропа против бед и Надзора, клятва державе, истинное имя, иная
       тяжесть, буря, печать логова, спутник-грибница.
    4. Все семь видов порчи приходят из своих источников: сглаз — от
       удачной сделки, похищенное — из проклятых руин, клятвопреступник и
       вражда — от подстрекательства, долг — от невозвращённого долга, порча
       места — ночью в пустоши, лунная немота — от обряда не в ту луну.
    5. Порча крепнет по стадиям и действует: цены, золото, держава, сила
       тварей; признаки слышны при осмотре; распознают обряд и Коллегия.
    6. Способы снятия — у каждой свои, и каждый работает: чары, кукла,
       ковен, доверие державы, покаяние, возврат вещи, примирение, дар,
       уплата, источник, полная луна; чужой способ объясняет, почему нет.
    7. Связи: укрепить, ослабить, разорвать — с последствиями; скрытые
       открывает обряд.
    8. Ковены: место у своей державы, посвящение с условиями; охотники на
       ведьм в державах с запретом; Коллегия Незримого; долг духу.
    9. Легендарные вещи: каждая приходит за своё дело, пробуждается в своём
       месте или луне, действует, растёт, влияет на владельца и
       уничтожается своим способом; уничтоженная не возвращается.
   10. Окна «Обряды, связи и порча» и «Легендарные вещи» озвучены; пункты
       меню; глава руководства; сохранение; ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();
  window.SAID=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{SAID.push(String(t));return o(t,x);};
  /* помощники набора: чистый лист магии, знание школы, луна, конец боя */
  window.М={
   чисто(){G.mag={};G.spells=[];G.mana=500;G.manaMax=500;G.gold=5000;G.inv={};G.place=null;G.ship=null;G.inCombat=false;G.combat=null;G.level=10;},
   знать(id){const s=SCHOOL_SPELLS.find(x=>x.school===id);if(!G.spells.includes(s.n))G.spells.push(s.n);},
   луна(w,от){for(let d=(от||Number(G.day)||1);d<(от||Number(G.day)||1)+60;d++){G.day=d;if(Magia.moonWord()===w)return d;}return null;},
   сказ(){return SAID.slice(-1)[0]||"";},
   /* тварь для проб — не волк: волку в наборе узнают истинное имя, и он уходит без боя */
   зверь(){return MONSTERS.find(x=>x.id&&x.id!=="wolf"&&!x.boss).id;},
   бой(m){const id=(m&&m.id)||М.зверь();const mm=Object.assign({},MONSTERS.find(x=>x.id===id)||MONSTERS[0],{hp:100,dmg:10,lvl:1,xp:1,gold:1},m||{});
    const ok=startCombat({x:G.x,y:G.y,monster:mm});return {ok,m:mm,cm:G.combat&&G.combat.m};},
   победа(){if(G.combat&&G.combat.m){G.combat.m.hp=0;safeFn(()=>victory());}G.inCombat=false;G.combat=null;while(activeLayer())closeTopUI();},
   /* сила твари при встрече: доля к такой же встрече без магии (прочие множители мира сокращаются) */
   сила(){const b=М.бой({hp:1000,dmg:100});const v=b.cm?b.cm.hp:null;safeFn(()=>endCombat());while(activeLayer())closeTopUI();return v;},
   столица(i){const c=EMPIRES[i].cap;G.place=null;G.x=c.x;G.y=c.y;},
   день(n){for(let k=0;k<(n||1);k++){Magia.st().дни=Number(G.day)||1;G.day=(Number(G.day)||1)+1;Magia.tick();}}};});

 /* ── 1. школы ── */
 const шк=await p.evaluate(()=>{const НОВЫЕ=["chance","mirror","witch","oath","truename","laws","calamity","sigil","counter","symbiont"];
  const СИНТЕЗ=/^(inst|orch|mood|relic|score|folk|depth)\//;const синт=r=>{const b=SOUND_BANK[r];return !b||!Array.isArray(b.f)||!b.f.length||b.f.some(f=>СИНТЕЗ.test(String(f)));};
  const плохо=[];
  for(const id of НОВЫЕ){const sc=MSCHOOL_BY_ID[id];if(!sc||!sc.сем||!sc.голос||!SOUND_BANK[sc.голос]){плохо.push(id);continue;}
   const a=SCHOOL_AUDIO[id]||{};SPELL_LAYERS.forEach(l=>{if(!a[l]||синт(a[l]))плохо.push(id+":"+l);});
   if(!elemOfSchool(id))плохо.push(id+":стихия");
   if(SchoolSpells.ofSchool(id).length!==3)плохо.push(id+":чары");
   const sp=specsOfSchool(id);if(sp.length!==4)плохо.push(id+":спец");
   if(new Set(sp.map(x=>x.ядро)).size!==4||new Set(sp.map(x=>x.стихия)).size!==4)плохо.push(id+":повтор");
   sp.forEach(x=>{if(!grimFind(id,x.id).length)плохо.push(x.id+":пусто");});}
  return {школ:SCHOOLS.length,плохо,дисциплин:НОВЫЕ.map(id=>MSCHOOL_BY_ID[id].n)};});
 check('1. десять новых школ полны: голос, семь слоёв записями, стихия, три чары, четыре специализации с заклинаниями в гримуаре',
  шк.школ===48&&шк.плохо.length===0,шк);

 /* ── 2. луна и знание ── */
 const лз=await p.evaluate(()=>{М.чисто();const r={};
  r.луна=Magia.moon()===Grani.moon()&&["новая","растущая","полная","убывающая"].includes(Magia.moonWord());
  const L=MAG_RITES.find(x=>x.id==="luck");r.безЗнания=Magia.why(L);
  М.знать("chance");G.mana=0;r.безМаны=Magia.why(L);G.mana=500;r.безДаров=Magia.why(L);
  r.ведьмаБез=Magia.why(MAG_RITES.find(x=>x.id==="read"));
  r.неСделан=Magia.rite("luck")===false&&/кристалл/.test(М.сказ());
  return r;});
 check('2. луна та же, что у Сети Граней; обряд без знания школы, маны или даров называет, чего не хватает',
  лз.луна&&/сперва выучите её чары/.test(лз.безЗнания)&&/Нужно 20 маны/.test(лз.безМаны)&&/кристалл ×1/.test(лз.безДаров)
  &&/вступите в ковен/.test(лз.ведьмаБез)&&лз.неСделан,лз);

 /* ── 3. обряды действуют на мир ── */
 const об=await p.evaluate(()=>{const r={};М.чисто();const i=12;М.столица(i);const d=Number(G.day)||1;G.hour=8;
  /* удача и долг удачи */
  М.знать("chance");G.inv.кристалл=1;const p0=sellPrice("кристалл",i,d);r.удачаОк=Magia.rite("luck");const p1=sellPrice("кристалл",i,d);
  Magia.st().эфф.удача.до=0;М.день(1);const p2=sellPrice("кристалл",i,Number(G.day));r.цены=[p0,p1,p2];
  r.удача=p1>p0&&Math.abs(p1-Math.round(p0*1.1))<=1;
  delete Magia.st().эфф.долгУдачи;r.безДолга=sellPrice("кристалл",i,Number(G.day));r.долг=p2<r.безДолга;
  /* зеркальная тропа */
  М.знать("mirror");G.inv.ракушка=1;r.зеркалоОк=Magia.rite("mirror");r.бедНет=maybeEvent()===false;r.надзорНет=Oversight.arrive()===false;
  /* клятва державе */
  М.знать("oath");const e=EMPIRES[i];G.wanted={[e.short]:2};const s0=standOf("fact",e.short);r.клятваОк=Magia.rite("oath");
  r.клятва=standOf("fact",e.short)>s0&&G.wanted[e.short]===1&&Magia.st().св.some(b=>b.вид==="клятва"&&b.держ===i);
  Magia.st().обр={};r.второйРаз=Magia.why(MAG_RITES.find(x=>x.id==="oath"));
  /* истинное имя: сначала победа, потом имя, потом тварь того рода чаще уходит */
  М.знать("truename");r.имяРано=Magia.why(MAG_RITES.find(x=>x.id==="name"));
  М.бой({id:"wolf"});М.победа();r.последняя=(Magia.st().последняя||{}).id;r.имяОк=Magia.rite("name");
  let ушла=false;for(let h=0;h<24&&!ушла;h++){G.hour=h;if(hashName(Magia.day(),h+"wolf".length,9605)<0.7){const b=М.бой({id:"wolf"});ушла=b.ok===false&&!G.inCombat&&/истинное имя/.test(М.сказ());}}
  G.hour=8;r.ушла=ушла;М.победа();
  /* иная тяжесть */
  М.знать("laws");{const h0=М.сила();r.тяжестьОк=Magia.rite("laws");const h1=М.сила();r.тяжесть=+(h1/h0).toFixed(3);}
  delete Magia.st().эфф.тяжесть;
  /* буря */
  М.знать("calamity");G.inv.трава=2;const t0=marketPrice("трава",i,Number(G.day)),st0=standOf("fact",e.short);r.буряОк=Magia.rite("storm");
  r.буря=[t0,marketPrice("трава",i,Number(G.day)),standOf("fact",e.short)-st0,raidAt(G.x,G.y,Number(G.day)),Weather.cur];
  /* печать логова */
  М.знать("sigil");G.inv.камень=2;r.печатьВне=Magia.why(MAG_RITES.find(x=>x.id==="seal"));
  G.place={bx:G.x,by:G.y,depth:2,stype:"dungeon"};r.печатьОк=Magia.rite("seal");r.логово=startInsideCombat(1,1)===false&&/Печать держит логово/.test(М.сказ());G.place=null;
  /* спутник-грибница */
  М.знать("symbiont");G.inv.грибы=3;r.спутникОк=Magia.rite("symb");G.hpMax=100;G.hp=40;М.бой();М.победа();r.послеБоя=G.hp;
  G.inv.ягоды=2;М.день(1);r.ягод=G.inv.ягоды;
  return r;});
 check('3а. удача: торговцы платят на десятую часть больше, назавтра — долг удачи',об.удачаОк&&об.удача&&об.долг,об.цены);
 check('3б. зеркальная тропа: случайные беды и стража Надзора обходят стороной',об.зеркалоОк&&об.бедНет&&об.надзорНет,об);
 check('3в. клятва державе: отношение растёт, одно нарушение прощено, клятва — связь; вторую той же державе не дают',
  об.клятваОк&&об.клятва&&/уже связаны клятвой/.test(об.второйРаз),об);
 check('3г. истинное имя узнают у той, с кем бились; услышав его, тварь уходит без боя',
  /сначала победите/.test(об.имяРано)&&об.последняя==="wolf"&&об.имяОк&&об.ушла,об);
 check('3д. иная тяжесть ослабляет тварь при встрече',об.тяжестьОк&&Math.abs(об.тяжесть-0.85)<0.01,об.тяжесть);
 check('3е. буря: трава дороже на седьмую часть, держава злится, набегов нет, над землёй гроза',
  об.буряОк&&об.буря[1]===Math.round(об.буря[0]*8/7)&&об.буря[2]<0&&об.буря[3]===null&&об.буря[4]==="Гроза",об.буря);
 check('3ж. печать: логово запечатывают изнутри, и тварь из него не выходит',/изнутри/.test(об.печатьВне)&&об.печатьОк&&об.логово,об);
 check('3з. грибница возвращает здоровье после боя и кормится ягодами',об.спутникОк&&об.послеБоя>=50&&об.ягод===1,[об.послеБоя,об.ягод]);

 /* ── 4–6. порча: источники, стадии, действие, распознание, снятие ── */
 const пр=await p.evaluate(()=>{const r={};М.чисто();const i=12;М.столица(i);G.hour=12;
  const есть=id=>Magia.curses().some(c=>c.id===id);
  /* сглаз: слишком удачная сделка */
  {let d0=null;for(let d=Number(G.day);d<Number(G.day)+200;d++)if(hashName(d,500,9609)<0.25){d0=d;break;}G.day=d0;
   const npc={name:"Торговец Проба",race:"люди"};noteSale(npc,100);r.малаяСделка=!есть("sglaz");noteSale(npc,500);r.сглаз=есть("sglaz");}
  /* признаки, осмотр, распознание */
  r.признак=Magia.signs()[0];SAID.length=0;look();r.осмотр=SAID.some(t=>/Признаки порчи: неназванная порча/.test(t));
  r.скрыта=!Magia.bonds(false).some(b=>b.вид==="проклятие");
  М.знать("witch");r.чтение=Magia.rite("read")&&/Сглаз — откуда: завистливый глаз торговца/.test(М.сказ());
  /* действие и стадии */
  const ц0=(()=>{const s=Magia.st().пр;Magia.st().пр=[];const v=sellPrice("кристалл",i,Number(G.day));Magia.st().пр=s;return v;})();
  r.цена=[ц0,sellPrice("кристалл",i,Number(G.day))];
  const c=Magia.curses()[0];c.д=Number(G.day)-6;G.gold=1000;Magia.st().дни=Number(G.day)-1;Magia.tick();r.стадия=c.ст;r.золото=G.gold;
  {const s=Magia.st().пр;Magia.st().пр=[];const h0=М.сила();Magia.st().пр=s;c.ст=3;r.сила=+(М.сила()/h0).toFixed(3);}
  /* чары снимают сглаз */
  М.знать("counter");r.развеять=Magia.rite("dispel")&&!есть("sglaz");
  Magia.st().обр={};r.нечегоРазвеять=Magia.why(MAG_RITES.find(x=>x.id==="dispel"));
  /* клятва + подстрекательство: клятвопреступник; подстрекательство обижает дом — вражда */
  М.знать("oath");Magia.rite("oath");
  let dd=null;for(let d=Number(G.day);d<Number(G.day)+200;d++)if(hashName(i,d,9607)<0.5){dd=d;break;}G.day=dd;
  r.подстрекнул=Throne.incite(i,0);r.клятвопреступник=есть("oathbreaker");r.вражда=есть("feud");
  r.клятваСнята=!Magia.st().св.some(b=>b.вид==="клятва");
  r.держава=(()=>{const s0=standOf("fact",EMPIRES[i].short);Magia.st().дни=Number(G.day)-1;Magia.tick();return standOf("fact",EMPIRES[i].short)-s0;})();
  /* кукла: клятвопреступника берёт, вражду — нет */
  r.чужойСпособ=Magia.tryLift("feud","кукла")===false&&/так не снять/.test(М.сказ());
  {const d=М.луна("новая");Magia.st().обр={};G.inv.трава=2;G.inv.кость=1;r.кукла=Magia.rite("doll")&&!есть("oathbreaker")&&G.inv["пепел порчи"]===1;}
  Magia.st().обр={};G.inv.трава=2;G.inv.кость=1;r.кукле=Magia.why(MAG_RITES.find(x=>x.id==="doll"));
  /* дар дому снимает вражду */
  {const c=Magia.curses().find(x=>x.id==="feud");c.узнано=true;G.gold=1000;r.дар=Magia.tryLift("feud","дар")&&!есть("feud")&&G.gold===850;}
  /* Коллегия: распознание за 60 в городе, пепел — 80 */
  {const g0=G.gold;r.коллегияПусто=Magia.kollegia("diag")&&G.gold===g0;r.пепел=Magia.kollegia("sell")&&G.gold===g0+80&&!G.inv["пепел порчи"];
   Magia.curse("feud","проба",{держ:i});r.коллегия=Magia.kollegia("diag")&&G.gold===g0+20&&/Родовая вражда — откуда: проба/.test(М.сказ());
   G.x+=3000;r.коллегияВне=Magia.kollegia("diag")===false&&/в городах/.test(М.сказ());М.столица(i);Magia.lift("feud","проба");}
  /* похищенное: знак из проклятых руин; вернуть — только саму вещь и на место */
  {let ру=null;{const a=MAT_ISLES.find(x=>x.id==="bezmolv");const q=matIslands(a)[0];const cc=safeFn(()=>cellContent(q.x,q.y),null);if(cc&&cc.structure&&cc.structure.type==="ruins"&&Magia.cursedRuin(q.x,q.y))ру={x:q.x,y:q.y};}
   r.руины=!!ру;if(ру){G.x=ру.x;G.y=ру.y;G.zoneTake={};SAID.length=0;look();r.знаки=SAID.some(t=>/место проклято/.test(t));
    const rnd=Math.random;Math.random=()=>0.9;r.знак=Res.fromRuins();Math.random=rnd;r.похищенное=есть("stolen");
    const c=Magia.curses().find(x=>x.id==="stolen");c.узнано=true;
    G.x+=50;r.далеко=Magia.tryLift("stolen","вернуть")===false;G.x=ру.x;
    const камень=G.inv["рунный камень"];delete G.inv["рунный камень"];r.безВещи=Magia.tryLift("stolen","вернуть")===false&&/саму вещь/.test(М.сказ());
    G.inv["рунный камень"]=камень;r.вернул=Magia.tryLift("stolen","вернуть")&&!есть("stolen")&&!G.inv["рунный камень"];}}
  /* долг духу: сила сейчас — порча потом */
  {М.столица(i);G.place={stype:"shrine",bx:G.x,by:G.y};G.mana=0;r.взял=Magia.borrow()&&G.mana===500;r.второйДолг=Magia.borrow()===false;
   G.place=null;G.day=Number(G.day)+11;Magia.st().дни=Number(G.day)-1;Magia.tick();r.долг=есть("debt")&&!Magia.st().св.some(b=>b.вид==="долг");
   const c=Magia.curses().find(x=>x.id==="debt");c.узнано=true;r.уплатаВне=Magia.tryLift("debt","уплата")===false;
   G.place={stype:"temple",bx:G.x,by:G.y};G.gold=1000;r.уплата=Magia.tryLift("debt","уплата")&&!есть("debt")&&G.gold===850;G.place=null;}
  /* порча места: ночь в магической пустоши; снимают победой над духом там же */
  /* магические пустоши лежат на Великих Материках */
  {let цель=null;const d=Number(G.day);for(const w of MAT_WASTES){if(цель)break;const x=Math.round(w.cx);const y0=Math.round(w.cy+w.r*0.35);
    for(let j=0;j<3000&&!цель;j++){const yy=y0+j;if(biomeAt(x,yy).id==="magic_waste"&&biomeAt(x,yy+1).id==="magic_waste"&&hashName(x,yy+d,9606)<0.04)цель={x,y:yy};}}
   r.пустошь=!!цель;if(цель){G.hour=23;G.x=цель.x;G.y=цель.y+1;G.place=null;Magia.set("зеркало",1);move("N");if(G.inCombat)safeFn(()=>endCombat());delete Magia.st().эфф.зеркало;r.порчаМеста=есть("place")&&G.y===цель.y;
    const c=Magia.curses().find(x=>x.id==="place");c.узнано=true;r.источникЖив=Magia.tryLift("place","источник")===false;
    М.бой();М.победа();r.источник=Magia.tryLift("place","источник")&&!есть("place");G.hour=12;}}
  /* лунная немота: ведьмовской обряд не в свою луну; снимают в полную луну */
  {Magia.st().ков=null;let d0=null;for(let d=Number(G.day);d<Number(G.day)+400;d++){G.day=d;if(Magia.moonWord()==="полная"&&hashName(d,"doll".length,9601)<0.5){d0=d;break;}}
   Magia.curse("sglaz","проба");Magia.st().обр={};G.inv.трава=2;G.inv.кость=1;r.немотаОбряд=Magia.rite("doll");r.немота=есть("moon");
   const c=Magia.curses().find(x=>x.id==="moon");c.узнано=true;G.mana=50;r.луна=Magia.tryLift("moon","луна")&&!есть("moon")&&G.mana===30;}
  /* клятвопреступник: доверие державы и покаяние */
  {const e=EMPIRES[i];Magia.curse("oathbreaker","проба",{держ:i,отн0:standOf("fact",e.short)});const c=Magia.curses().find(x=>x.id==="oathbreaker");c.узнано=true;
   r.довериеРано=Magia.tryLift("oathbreaker","клятва")===false;addStand("fact",e.short,16);r.доверие=Magia.tryLift("oathbreaker","клятва")&&!есть("oathbreaker");
   Magia.curse("oathbreaker","проба",{держ:i,отн0:999});Magia.curses().find(x=>x.id==="oathbreaker").узнано=true;
   G.place={stype:"temple",bx:G.x,by:G.y};G.gold=1000;r.покаяние=Magia.tryLift("oathbreaker","покаяние")&&G.gold===800;G.place=null;}
  return r;});
 check('4а. сглаз — от слишком удачной сделки: торговец провожает недобрым взглядом',пр.малаяСделка&&пр.сглаз,пр);
 check('4б. признаки слышны при осмотре, порча и её связь скрыты, пока не распознаны; обряд называет порчу и источник',
  /неназванная порча/.test(пр.признак)&&пр.осмотр&&пр.скрыта&&пр.чтение,пр);
 check('5. порча действует и крепнет: продажа дешевле, на второй стадии уходят монеты, на третьей тварь сильнее',
  пр.цена[1]<пр.цена[0]&&пр.стадия===2&&пр.золото<1000&&Math.abs(пр.сила-1.1)<0.01,[пр.цена,пр.стадия,пр.золото,пр.сила]);
 check('6а. чары развеивают сглаз; без такой порчи обряд не нужен',пр.развеять&&/Порчи, которую берут чары, на вас нет/.test(пр.нечегоРазвеять),пр);
 check('4в. подстрекательство при дворе, которому клялись: клятва нарушена — клятвопреступник; обиженный дом — родовая вражда; держава холодеет',
  пр.подстрекнул&&пр.клятвопреступник&&пр.вражда&&пр.клятваСнята&&пр.держава<0,пр);
 check('6б. кукла берёт клятвопреступника и оставляет пепел; вражду — нет, и чужой способ объясняется',
  пр.чужойСпособ&&пр.кукла&&/кукла не берёт/.test(пр.кукле),пр);
 check('6в. вражду снимает дар дому',пр.дар,пр);
 check('8а. Коллегия Незримого: распознаёт порчу в городе за шестьдесят, пустых не обирает, покупает пепел',
  пр.коллегияПусто&&пр.пепел&&пр.коллегия&&пр.коллегияВне,пр);
 check('4г+6г. похищенное — знак из проклятых руин (их выдают знаки на кладке); вернуть можно только саму вещь и на место',
  пр.руины&&пр.знаки&&/проклятой/.test(пр.знак)&&пр.похищенное&&пр.далеко&&пр.безВещи&&пр.вернул,пр);
 check('4д+6д. долг духу: полная мана сейчас, один долг за раз; не вернули в срок — порча; снимают уплатой в храме',
  пр.взял&&пр.второйДолг&&пр.долг&&пр.уплатаВне&&пр.уплата,пр);
 check('4е+6е. ночь в магической пустоши — порча места; снимают победой над духом там, где она взята',
  пр.пустошь&&пр.порчаМеста&&пр.источникЖив&&пр.источник,пр);
 check('4ж+6ж. ведьмовской обряд не в свою луну — лунная немота; её снимает очищение в полную луну',
  пр.немотаОбряд&&пр.немота&&пр.луна,пр);
 check('6з. клятвопреступника снимают вернувшееся доверие державы или покаяние в храме',пр.довериеРано&&пр.доверие&&пр.покаяние,пр);

 /* ── 7–8. связи, ковены, охотники ── */
 const св=await p.evaluate(()=>{const r={};М.чисто();const i=12;М.столица(i);
  М.знать("oath");Magia.rite("oath");const b=Magia.st().св.find(x=>x.вид==="клятва");
  G.mana=5;r.укрепитьБез=Magia.bondAct(b.id,"up")===false;G.mana=50;r.укрепить=Magia.bondAct(b.id,"up")&&b.сила===80;
  r.ослабить=Magia.bondAct(b.id,"down")&&b.сила===60;r.разорвать=Magia.bondAct(b.id,"cut")&&Magia.curses().some(c=>c.id==="oathbreaker");
  Magia.st().пр=[];Magia.st().св=[];
  /* порчу не рвут, но ослабленная связь откатывает стадию */
  const c=Magia.curse("sglaz","проба");c.ст=3;const pb=Magia.st().св.find(x=>x.вид==="проклятие");
  r.неРвут=Magia.bondAct(pb.id,"cut")===false;pb.сила=30;Magia.bondAct(pb.id,"down");r.откат=c.ст===2;
  r.скрытая=!Magia.bonds(false).some(x=>x.вид==="проклятие");М.знать("witch");r.чутьё=Magia.rite("bonds")&&/Открылось скрытых: 1/.test(М.сказ())&&Magia.bonds(false).some(x=>x.вид==="проклятие");
  /* ковены: место у своей державы */
  r.места=MAG_COVENS.map(K=>{const q=Magia.covenPos(K.id);let c;if(K.материк){const m=MAT_BY_ID[K.материк];c={x:m.cx,y:m.cy};}else{const e=EMPIRES.find(e=>e.short===K.держава);if(!e)return K.id+":нет державы";c=e.cap;}
   const d=Math.max(Math.abs(q.x-c.x),Math.abs(q.y-c.y));return d>=400&&d<=1400?"":K.id+":"+d;}).filter(Boolean);
  /* посвящение: далеко, мал уровень, не та луна, нет даров — каждый отказ объяснён */
  Magia.st().пр=[];Magia.st().св=[];Magia.st().ков=null;
  const K=MAG_COVENS.find(x=>x.id==="ivy");r.далеко=Magia.join("ivy")===false&&/принимает только у себя/.test(М.сказ());
  const q=Magia.covenPos("ivy");G.x=q.x;G.y=q.y;G.level=2;r.мал=Magia.join("ivy")===false&&/с четвёртого уровня/.test(М.сказ());G.level=10;
  М.луна("новая");r.нелуна=Magia.join("ivy")===false&&/Посвящение — в полную луну/.test(М.сказ());
  М.луна("полная");r.безДаров=Magia.join("ivy")===false&&/дары/.test(М.сказ());
  G.inv.трава=2;G.inv.кость=1;Magia.curse("sglaz","проба");Magia.curses()[0].узнано=true;
  r.принят=Magia.join("ivy")&&Magia.st().ков==="ivy"&&Magia.has("mirror");
  r.оберег=Magia.tryLift("sglaz","ковен")&&!Magia.curses().length;
  r.ведьмаБезЛуны=!Magia.why(MAG_RITES.find(x=>x.id==="read"));
  {let d0=null;for(let d=Number(G.day);d<Number(G.day)+200;d++)if(hashName(d,500,9609)<0.25){d0=d;break;}G.day=d0;noteSale({name:"Проба"},500);r.ковенБережёт=!Magia.curses().length;}
  const cb=Magia.st().св.find(x=>x.вид==="ковен");r.ушла=Magia.bondAct(cb.id,"cut")&&!Magia.st().ков;
  /* охотники на ведьм: держава с запретом */
  Magia.st().ков="ivy";const j=EMPIRES.findIndex((e,k)=>Magia.witchBanned(k));r.запрет=j>=0;
  if(j>=0){М.столица(j);const ej=EMPIRES[j];const s0=standOf("fact",ej.short);G.gold=1000;G.mana=500;for(let k=0;k<3;k++){Magia.st().обр={};Magia.rite("read");}
   r.замечен=Magia.st().охота[ej.short]===3&&/Орден Ясного Взора/.test(SAID.join(" "));Magia.st().дни=Number(G.day)-1;Magia.tick();
   r.штраф=G.gold===880&&standOf("fact",ej.short)<s0&&Magia.st().охота[ej.short]===0;
   r.безЗапрета=(()=>{const k=EMPIRES.findIndex((e,n)=>!Magia.witchBanned(n));М.столица(k);const sh=EMPIRES[k].short;Magia.st().обр={};Magia.rite("read");return !Magia.st().охота[sh];})();}
  /* разорванный долг — порча */
  Magia.st().пр=[];G.place={stype:"shrine",bx:G.x,by:G.y};Magia.borrow();G.place=null;const db=Magia.st().св.find(x=>x.вид==="долг");
  r.долгРвать=Magia.bondAct(db.id,"cut")&&Magia.curses().some(c=>c.id==="debt");
  return r;});
 check('7а. связь укрепляют маной, ослабляют, разрывают; разорванная клятва — клятвопреступник, разорванный долг — порча',
  св.укрепитьБез&&св.укрепить&&св.ослабить&&св.разорвать&&св.долгРвать,св);
 check('7б. порчу не рвут, но ослабленная связь откатывает стадию; скрытые связи открывает «Чутьё связей»',св.неРвут&&св.откат&&св.скрытая&&св.чутьё,св);
 check('8б. ковены стоят у своих держав; посвящение: на месте, с четвёртого уровня, в свою луну, за дары — каждый отказ объяснён',
  св.места.length===0&&св.далеко&&св.мал&&св.нелуна&&св.безДаров&&св.принят,св);
 check('8в. своя ведьма: оберег ковена снимает сглаз, луна не мстит, от завистливого глаза ковен бережёт; ковен отпускает',
  св.оберег&&св.ведьмаБезЛуны&&св.ковенБережёт&&св.ушла,св);
 check('8г. охотники на ведьм: где ведьмовство под запретом, Орден замечает обряды, на третий раз — штраф и гнев державы; где запрета нет — не замечает',
  св.запрет&&св.замечен&&св.штраф&&св.безЗапрета,св);

 /* ── 9. легендарные вещи ── */
 const лг=await p.evaluate(()=>{const r={};М.чисто();const s=()=>Magia.st();
  /* источники: каждая вещь — за своё дело */
  {const a=MAT_ISLES.find(x=>x.id==="zatonuv");const q=matIslands(a)[0];G.x=q.x;G.y=q.y;r.собеседник=Mater.mechanism()!==false&&Magia.has("talker");}
  {const ps=MAT_PIRATES[0];const st=Mater.pir(ps.id);st.сила=10;Mater.afterWin({пират:ps.id});r.ключ=!!st.разорена&&Magia.has("key");}
  {Mater.afterWin({чудище:MAT_MONSTERS[0].id,n:MAT_MONSTERS[0].n});r.серп=Magia.has("sickle");}
  {const gs=Grani.st();gs.nodes=gs.nodes||{};["п1","п2","п3"].forEach(k=>{gs.nodes[k]=gs.nodes[k]||{seen:1};});Director.worldDay();r.компас=Magia.has("compass");}
  {const i=EMPIRES.findIndex((e,k)=>k>=12&&!Throne.crisis(k));const d=Number(G.day);
   Throne.openCrisis(i,d,[{n:"Агния Проба",ж:1,b:d-30*360,l:1,г:0,t:1},{n:"Гордей Проба",ж:0,b:d-25*360,l:1,г:0,t:2}],"проба");
   М.столица(i);let ok=false;for(let h=0;h<24&&!ok;h++){G.hour=h;G.gold=1000;ok=Throne.mediate(i);}r.весы=ok&&Magia.has("scales");
   const j=EMPIRES.findIndex((e,k)=>k>=12&&!Throne.crisis(k));Throne.openCrisis(j,d,[{n:"Лада Проба",ж:1,b:d-30*360,l:1,г:0,t:1},{n:"Ратибор Проба",ж:0,b:d-25*360,l:1,г:0,t:2}],"проба");
   const C=Throne.crisis(j);Throne.st().infl[j+":"+C.cl[0].n]=30;C.cl[0].д=97;C.cl[1].д=3;Throne.crisisStep(j,d+1);r.венец=Magia.has("crown");}
  {let v=null;for(const c of MATERIKI){for(const w of (c.вулканы||[])){const pt=w.pts[0];if(Mater.volcanic(pt[0],pt[1])){v={x:pt[0],y:pt[1]};break;}}if(v)break;}
   r.вулкан=!!v;if(v){G.x=v.x;G.y=v.y;М.знать("calamity");G.inv.трава=2;s().обр={};r.сердце=Magia.rite("storm")&&Magia.has("storm");}}
  {const K=MAG_COVENS.find(x=>x.id==="bone");const q=Magia.covenPos("bone");G.x=q.x;G.y=q.y;М.луна("новая");G.inv.трава=2;G.inv.кость=1;s().вещи.mirror&&delete s().вещи.mirror;
   r.зеркало=Magia.join("bone")&&Magia.has("mirror");}
  r.всеВосемь=MAG_LEGENDS.every(L=>Magia.has(L.id));
  /* пробуждение — в своём месте или луне */
  М.луна("растущая");Magia.awake("sickle");r.серпСпит=!s().вещи.sickle.проб;М.луна("полная");r.серпПроснулся=Magia.awake("sickle")&&s().вещи.sickle.проб;
  /* действие */
  М.чисто.call(null);Object.assign(G.mag,{});
  return r;});
 check('9а. каждая из восьми вещей приходит за своё дело: механизм руин, база пиратов, морское чудище, три узла Сети, посредничество, победа претендента, буря у вулкана, ковен',
  лг.собеседник&&лг.ключ&&лг.серп&&лг.компас&&лг.весы&&лг.венец&&лг.вулкан&&лг.сердце&&лг.зеркало&&лг.всеВосемь,лг);
 check('9б. вещь пробуждается только в своём месте или в свою луну',лг.серпСпит&&лг.серпПроснулся,лг);

 const лд=await p.evaluate(()=>{const r={};М.чисто();const s=()=>Magia.st();MAG_LEGENDS.forEach(L=>Magia.grant(L.id,"проба"));const i=12;М.столица(i);
  /* влияние на владельца */
  {const v=s().вещи;const sc=v.scales;delete v.scales;const p0=sellPrice("кристалл",i,Number(G.day));v.scales=sc;r.весыТорг=sellPrice("кристалл",i,Number(G.day))<p0;}
  /* Серп: в тот же день — встреча без него и с ним (сила тварей зависит и от дня мира) */
  {const v=s().вещи,sk=v.sickle,cr=v.crown;sk.проб=false;delete v.crown;
   const мера=w=>{М.луна(w);delete v.sickle;const h0=М.сила();v.sickle=sk;return +(М.сила()/h0).toFixed(3);};
   r.серпПолная=мера("полная");r.серпНовая=мера("новая");v.crown=cr;}
  {const rnd=Math.random;let гроз=0;for(let k=0;k<200;k++)if(["Гроза","Ливень"].includes(rollWeather()))гроз++;const св=s().вещи.storm;delete s().вещи.storm;let без=0;for(let k=0;k<200;k++)if(["Гроза","Ливень"].includes(rollWeather()))без++;s().вещи.storm=св;r.погода=[гроз,без];}
  {const S=Survival.state();S.fatigue=80;const t=Survival.rest();r.сон=[S.fatigue,/бормотал/.test(t)];}
  /* действие вещей */
  {const a=MAT_ISLES.find(x=>x.id==="zatonuv");const q=matIslands(a)[0];G.x=q.x;G.y=q.y;G.mana=100;r.собеседник=Magia.use("talker")&&/Медный Собеседник говорит с руинами «Затонувшее Царство»/.test(М.сказ())&&G.mana===90;}
  {М.столица(i);G.mana=100;r.зеркало=Magia.use("mirror")&&/Зеркало Былого: здесь лежит край «[^»]+»/.test(М.сказ())&&/в пору, что зовётся «/.test(М.сказ());}
  {М.столица(i);G.mana=100;s().вещи.storm.буря=0;s().вещи.storm.проб=true;r.буря=Magia.use("storm")&&Weather.cur==="Гроза"&&!/проклинают/.test(М.сказ());r.буряОтдых=Magia.use("storm")===false&&/отдыхает/.test(М.сказ());}
  {М.столица(i);G.mana=100;const все=(Grani.nodesNear(G.x,G.y,60000)||[]).filter(x=>!x.hidden);if(все.length){G.x=все[0].x+7;G.y=все[0].y;}
   r.компас=все.length?Magia.use("compass")&&/Компас Сшивателей: /.test(М.сказ()):"узлов нет";М.столица(i);}
  {G.mana=100;const L=rumorsHere(G.x,G.y)||[];r.весы=L.length?Magia.use("scales")&&/Весы Правды: «/.test(М.сказ()):"вестей нет";}
  {G.place=null;r.ключВне=Magia.use("key")===false&&/оживает в чертогах/.test(М.сказ());}
  /* рост: от применения вещь растёт и берёт меньше маны */
  {const v=s().вещи.talker;v.раз=4;const a=MAT_ISLES.find(x=>x.id==="zatonuv");const q=matIslands(a)[0];G.x=q.x;G.y=q.y;G.mana=100;Magia.use("talker");
   r.рост=/растёт: теперь — «говорит», и маны берёт меньше/.test(М.сказ())&&Magia.stage("talker")===1;G.mana=100;Magia.use("talker");r.дешевле=G.mana===92;}
  /* уничтожение: только своим способом; уничтоженная не возвращается */
  {М.луна("растущая");r.неТак=Magia.destroy("mirror")===false&&/разбить в новолуние/.test(М.сказ());М.луна("новая");r.разбито=Magia.destroy("mirror")&&!Magia.has("mirror");
   r.неВернётся=Magia.grant("mirror","проба")===false&&!Magia.has("mirror");
   G.ship=null;r.ключНеТак=Magia.destroy("key")===false;G.ship={name:"Проба"};r.ключВМоре=Magia.destroy("key");G.ship=null;
   G.place={stype:"temple",bx:G.x,by:G.y};r.венецВХраме=Magia.destroy("crown");G.place=null;}
  return r;});
 check('9в. влияние на владельца: Весы мешают торговаться, Серп в полную луну ослабляет тварь, в новую — злит, Сердце Бури портит погоду, Собеседник не даёт выспаться',
  лд.весыТорг&&Math.abs(лд.серпПолная-0.85)<0.01&&Math.abs(лд.серпНовая-1.1)<0.01&&лд.погода[0]>лд.погода[1]&&лд.сон[1]&&лд.сон[0]>20,лд);
 check('9г. вещи действуют: Собеседник говорит с руинами, Зеркало показывает край и эпоху, Сердце зовёт бурю раз в семь дней, Компас и Весы отвечают, Ключ ждёт чертога',
  лд.собеседник&&лд.зеркало&&лд.буря&&лд.буряОтдых&&лд.компас!==false&&лд.весы!==false&&лд.ключВне,лд);
 check('9д. от применения вещь растёт и берёт меньше маны',лд.рост&&лд.дешевле,лд);
 check('9е. уничтожить вещь можно только её способом, и уничтоженная не возвращается',лд.неТак&&лд.разбито&&лд.неВернётся&&лд.ключНеТак&&лд.ключВМоре&&лд.венецВХраме,лд);

 /* ── 10. окна, меню, руководство, сохранение ── */
 const ок=await p.evaluate(()=>{const r={};М.чисто();М.столица(12);М.знать("chance");MAG_LEGENDS.slice(0,3).forEach(L=>Magia.grant(L.id,"проба"));Magia.curse("sglaz","проба");
  r.меню=amAvailable("rites")&&amAvailable("legends")&&AM_GROUPS.find(g=>g[0]==="Магия")[1].some(x=>x[0]==="rites")&&AM_GROUPS.find(g=>g[0]==="Магия")[1].some(x=>x[0]==="legends");
  CMD.rites();const m=document.getElementById("modal-rites");r.окно=!!m&&!m.hidden;
  const тело=m&&m.querySelector("#mgBody");r.немых=тело?тело.querySelectorAll('button:not([data-speak])').length:-1;r.кнопок=тело?тело.querySelectorAll('button[data-cmd^="mg:"]').length:0;
  r.текст=m?m.textContent:"";closeModal(m);
  CMD.legends();const l=document.getElementById("modal-legends");r.вещей=l?l.querySelectorAll("h3").length:0;r.слухов=l?(l.textContent.match(/о ней ходят слухи/g)||[]).length:0;
  r.уничт=l?l.querySelectorAll('button[data-cmd^="mg:des:"]').length:0;closeModal(l);
  SAID.length=0;CMD.mg("непонятное");r.немоНет=SAID.some(t=>/Такого обряда или дела нет/.test(t));
  r.глава=!!guideSec(/Обряды, ведьмовство, порча и легендарные вещи/);
  const до=JSON.stringify(G.mag);saveGame(true);const raw=localStorage.getItem(SAVE_KEY)||"";r.вСохранении=raw.indexOf('"mag"')>=0;
  G.mag={};loadGame();r.загружено=JSON.stringify(G.mag)===до;r.размер=до.length;
  return r;});
 check('10а. пункты «Обряды, связи и порча» и «Легендарные вещи» в разделе «Магия»; окна озвучены; непонятное дело не молчит',
  ок.меню&&ок.окно&&ок.немых===0&&ок.кнопок>=4&&/Луна /.test(ок.текст)&&/Коллегия Незримого/.test(ок.текст)&&ок.вещей===3&&ок.слухов===5&&ок.уничт===3&&ок.немоНет,ок);
 check('10б. глава руководства «Обряды, ведьмовство, порча и легендарные вещи»',ок.глава,ок);
 check('10в. порча, связи и вещи переживают сохранение, запись маленькая',ок.вСохранении&&ок.загружено&&ок.размер<4000,ок);
 check('10г. ошибок страницы нет',errors.length===0,errors.slice(0,3));

 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИтого: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
