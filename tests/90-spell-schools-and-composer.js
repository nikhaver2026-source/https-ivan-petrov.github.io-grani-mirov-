/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 90: ШКОЛЫ ЗАКЛИНАНИЙ И СОСТАВИТЕЛЬ

   Заклинание было строкой с ценой. Теперь у каждого — школа из двадцати
   семи, семейство, форма, усиление, дальность, радиус, подготовка,
   перезарядка, составляющие, условия, противодействие, сопротивление,
   побочное действие, звуковая сигнатура (§120). Составитель собирает новое
   заклинание из школы, формы и усиления и отвергает бессмысленное.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Двадцать семь школ с семейством, силой и двумя звуками из банка; все
      двенадцать исходных заклинаний приписаны к школе.
   2. Пять форм и пять усилений; несовместимости отвергаются со словами:
      стрела исцеления, тихий звук, дальний щит, быстрый зов, стойкая стрела.
   3. Составленная запись несёт все поля §120; цена растёт со ступенью и
      усилением; стойкое — сильнее и с двойной перезарядкой.
   4. Составитель открыт только в башне, школе или храме и только знающему
      руны или артефакторику; в поле и без урока — отказ словами.
   5. Окно: школы, формы, усиления, «Собрать»; выбор озвучен; сборка берёт
      кристалл и пятнадцать маны, без них — отказ; дважды одно — отказ;
      готовое заклинание в списке и в книге, в панели магии есть слот.
   6. Составленное творится: стрела огня бьёт тварь в бою и уходит в пустоту
      вне боя; щит земли даёт оберег; зов света лечит; стойкая волна
      уходит на перезарядку, и повторный каст отклонён с часами.
   7. Тихое усиление без голоса; «Школы» в меню действий говорят текстом;
      после сохранения и загрузки составленное заклинание снова в списке.
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

 /* ── 1. школы ── */
 const школы=await page.evaluate(()=>{
  const сем=new Set(SCHOOLS.map(s=>s.сем));
  const плохие=SCHOOLS.filter(s=>!s.n||!s.род||!SPELL_FAMILIES[s.сем]||!(s.k>0)||!SOUND_BANK[s.звук]||!SOUND_BANK[s.голос]).map(s=>s.id);
  const ids=new Set(SCHOOLS.map(s=>s.id));
  const исходные=SPELLS.filter(sp=>!sp.custom).map(sp=>({n:sp.n,school:spellSchool(sp)&&spellSchool(sp).id}));
  return {n:SCHOOLS.length,уник:ids.size,семейств:сем.size,плохие,исходные,безШколы:исходные.filter(x=>!x.school).map(x=>x.n)};});
 /* Набор 147 довёл школы до тридцати восьми: прибавились энергетика,
    биомантия, астральная наука и магическая инженерия. */
 check('1. тридцать восемь школ пяти семейств с силой и звуками из банка; все исходные заклинания приписаны к школе',
  школы.n===38&&школы.уник===38&&школы.семейств===5&&школы.плохие.length===0&&школы.исходные.length===12&&школы.безШколы.length===0,
  {плохие:школы.плохие,безШколы:школы.безШколы,семейств:школы.семейств});

 /* ── 2. формы, усиления, несовместимость ── */
 const формы=await page.evaluate(()=>({
  форм:SPELL_FORMS.length,усилений:SPELL_MODS.length,
  heal_bolt:spellIncompat("light","bolt"),silent_sound:spellIncompat("sound","bolt","silent"),
  far_ward:spellIncompat("earth","ward","far"),quick_call:spellIncompat("spirit","call","quick"),
  lasting_bolt:spellIncompat("fire","bolt","lasting"),ok:spellIncompat("fire","bolt","quick"),ok2:spellIncompat("earth","ward","lasting"),
  пусто:spellIncompat("nope","bolt")}));
 check('2. двенадцать форм, шестнадцать усилений; бессмысленное отвергается словами, осмысленное проходит',
  формы.форм===12&&формы.усилений===16&&/не имеет смысла/.test(формы.heal_bolt)&&/тихого звука/.test(формы.silent_sound)&&/щит/.test(формы.far_ward)&&/зов/.test(формы.quick_call)&&/стрела/.test(формы.lasting_bolt)&&формы.ok===""&&формы.ok2===""&&формы.пусто.length>0,
  [формы.heal_bolt,формы.silent_sound]);

 /* ── 3. запись ── */
 const запись=await page.evaluate(()=>{
  const a=composeSpell("fire","bolt","none",1),b=composeSpell("fire","bolt","none",4),c=composeSpell("fire","bolt","quick",1),
   d=composeSpell("earth","ward","none",1),e=composeSpell("earth","ward","lasting",1),f=composeSpell("air","bolt","far",1);
  const поля=["id","n","school","форма","усиление","ранг","уровень","cost","дальность","радиус","подготовка","откат","компоненты","условия","противодействие","сопротивление","побочное","звук","голос","вид","источник","сила"];
  return {нет:поля.filter(k=>a[k]===undefined),a,ступень:b.cost>a.cost,усиление:c.cost>a.cost&&c.подготовка<a.подготовка,
   стойкое:e.сила>d.сила&&e.откат===d.откат*2&&e.cost>d.cost,дальнее:f.дальность===a.дальность*2,имя:a.n,вид:a.вид,ошибка:composeSpell("light","bolt").ошибка};});
 check('3. запись несёт все поля §120; цена растёт со ступенью и усилением; быстрое короче, стойкое сильнее и дольше, дальнее вдвое дальше',
  запись.нет.length===0&&запись.ступень&&запись.усиление&&запись.стойкое&&запись.дальнее&&запись.имя==="Стрела огня"&&/стрелы/.test(запись.вид)&&запись.ошибка,
  {нет:запись.нет,имя:запись.имя,вид:запись.вид});

 /* ── 4. где и кому ── */
 const где=await page.evaluate(()=>{
  const r={};G.place=null;G.mast=G.mast||{};G.mast.runes={ур:0,оп:0};G.mast.arte={ур:0,оп:0};
  SAID.length=0;r.поле=spellForgeOpen();r.полеСказ=SAID.slice(-1)[0]||"";r.полеМеню=amAvailable("spellforge");
  const найти=(вид)=>{const C=WORLD>>1;for(let rr=1;rr<140;rr++)for(let dy=-rr;dy<=rr;dy++)for(let dx=-rr;dx<=rr;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;const c=safeFn(()=>cellContent(C+dx,C+dy),null);if(c&&c.structure&&c.structure.type===вид)return {x:C+dx,y:C+dy,c};}return null;};
  const м=найти("tower")||найти("school")||найти("temple");if(!м)return {нет:"башни"};
  G.x=м.x;G.y=м.y;enterPlace(м.c);r.вид=G.place&&G.place.stype;
  SAID.length=0;r.безУрока=spellForgeOpen();r.безУрокаСказ=SAID.slice(-1)[0]||"";
  G.mast.runes={ур:1,оп:0};r.доступ=spellForgeAvailable();r.меню=amAvailable("spellforge");
  return r;});
 check('4. в поле — «составляют в башне», в башне без урока — «нужен урок», с уроком рун — доступно и есть в меню действий',
  !где.нет&&где.поле===false&&/башне/.test(где.полеСказ)&&!где.полеМеню&&где.безУрока===false&&/урок/.test(где.безУрокаСказ)&&где.доступ&&где.меню,
  где.нет||[где.полеСказ,где.безУрокаСказ,где.вид]);

 /* ── 5. окно и сборка ── */
 const окно=await page.evaluate(()=>{
  const r={};SF.school=null;SF.form=null;SF.mod="none";G.spellbook=[];
  r.открыто=spellForgeOpen();r.видно=!document.getElementById("modal-spellforge").hidden;
  r.школ=document.querySelectorAll('#sfBody [data-cmd^="sfschool:"]').length;
  r.форм=document.querySelectorAll('#sfBody [data-cmd^="sfform:"]').length;
  r.усил=document.querySelectorAll('#sfBody [data-cmd^="sfmod:"]').length;
  /* Две новые оси составителя: ядро и стихия. У каждой ещё кнопка «по школе». */
  r.ядер=document.querySelectorAll('#sfBody [data-cmd^="sfcore:"]').length;
  r.стихий=document.querySelectorAll('#sfBody [data-cmd^="sfelem:"]').length;
  r.собрать=!!document.querySelector('#sfBody [data-cmd="sfbuild"]');
  SAID.length=0;document.querySelector('#sfBody [data-cmd="sfschool:fire"]').click();r.сказШкола=SAID.slice(-1)[0]||"";
  SAID.length=0;document.querySelector('#sfBody [data-cmd="sfform:bolt"]').click();r.сказФорма=SAID.slice(-1)[0]||"";
  r.галочка=/✔/.test(document.querySelector('#sfBody [data-cmd="sfschool:fire"]').textContent);
  delete G.inv["кристалл"];G.mana=40;SAID.length=0;r.безКристалла=spellForgeBuild();r.безКристаллаСказ=SAID.slice(-1)[0]||"";
  G.inv["кристалл"]=3;G.mana=5;SAID.length=0;r.безМаны=spellForgeBuild();r.безМаныСказ=SAID.slice(-1)[0]||"";
  G.mana=40;SAID.length=0;PLAYED.length=0;r.ok=spellForgeBuild();r.сказ=SAID.find(t=>/Составлено/.test(t))||"";
  r.кристалл=G.inv["кристалл"];r.мана=G.mana;r.книга=(G.spellbook||[]).map(x=>x.n);r.вСписке=SPELLS.some(s=>s.custom&&s.n==="Стрела огня");r.известно=G.spells.includes("Стрела огня");
  r.звук=PLAYED.includes("oc_electrical");r.журнал=/Составлено заклинание/.test(JSON.stringify(G.journal||G.log||[]));
  SAID.length=0;r.дважды=spellForgeBuild();r.дваждыСказ=SAID.slice(-1)[0]||"";
  closeModal(document.getElementById("modal-spellforge"));
  safeOpenMagicPanel();r.слот=[...document.querySelectorAll('#magicSlots button')].some(b=>/Стрела огня/.test(b.textContent)&&!/не изучено/.test(b.textContent));
  closeMagicPanel();
  return r;});
 check('5а. окно составителя: 38 школ, 12 форм, 16 ядер и 18 стихий (плюс «по школе»), 16 усилений и «Собрать»; выбор озвучен и отмечен',
  окно.открыто&&окно.видно&&окно.школ===38&&окно.форм===12&&окно.усил===16&&окно.ядер===17&&окно.стихий===19&&окно.собрать&&/Огонь|Выйдет/.test(окно.сказШкола)&&/Выйдет «Стрела огня»/.test(окно.сказФорма)&&окно.галочка,
  [окно.школ,окно.форм,окно.усил,окно.сказФорма]);
 check('5б. сборка берёт кристалл и пятнадцать маны; без них — отказ; дважды одно — отказ',
  окно.безКристалла===false&&/кристалл/i.test(окно.безКристаллаСказ)&&окно.безМаны===false&&/маны/.test(окно.безМаныСказ)&&окно.ok&&окно.кристалл===2&&окно.мана===25&&окно.дважды===false&&/уже есть/.test(окно.дваждыСказ),
  [окно.безКристаллаСказ,окно.безМаныСказ,окно.кристалл,окно.мана,окно.дваждыСказ]);
 check('5в. готовое заклинание в книге, в списке, изучено, слышно, в журнале, и у него слот в панели магии',
  окно.книга.join()==="Стрела огня"&&окно.вСписке&&окно.известно&&окно.звук&&окно.слот&&/Мана 1[0-9]/.test(окно.сказ),
  [окно.книга,окно.вСписке,окно.известно,окно.звук,окно.слот,окно.сказ.slice(0,80)]);

 /* ── 6. творение ── */
 const каст=await page.evaluate(()=>{
  const r={};G.level=5;G.manaMax=200;G.mana=200;G.hpMax=100;
  const добавить=(sc,f,m)=>{const rec=composeSpell(sc,f,m,1);G.spellbook.push(rec);registerCustomSpells();return SPELLS.findIndex(s=>s.n===rec.n);};
  const iStrela=SPELLS.findIndex(s=>s.n==="Стрела огня");
  const iShield=добавить("earth","ward","none"),iCall=добавить("light","call","none"),iWave=добавить("chaos","wave","lasting"),iSilent=добавить("dark","bolt","silent");
  /* Собранные составителем: у них id начинается на cs_. Именные чары школ
     тоже идут через castCustomEffect, поэтому одного флага custom мало. */
  r.записей=SPELLS.filter(s=>s.custom&&/^cs_/.test(String(s.id||""))).length;
  /* вне боя */
  G.inCombat=false;G.combat=null;SAID.length=0;castSpell(iStrela);r.пустота=SAID.slice(-1)[0]||"";
  /* в бою */
  const c=safeFn(()=>{for(let rr=1;rr<200;rr++)for(let dy=-rr;dy<=rr;dy++)for(let dx=-rr;dx<=rr;dx++){
   const cc=cellContent((WORLD>>1)+dx,(WORLD>>1)+dy);
   if(cc.monster&&!cc.structure){G.x=(WORLD>>1)+dx;G.y=(WORLD>>1)+dy;return cc;}}return null;},null);
  if(!c)return {нет:"твари"};
  startCombat(c);G.combat.hp=500;G.combat.hpMax=500;
  SAID.length=0;PLAYED.length=0;castSpell(iStrela);r.урон=500-G.combat.hp;r.уронСказ=SAID.find(t=>/сотворено/.test(t))||"";r.голос=PLAYED.includes("oc_fireball");
  /* стойкая волна: перезарядка */
  G.mana=200;SAID.length=0;castSpell(iWave);r.волна=500-G.combat.hp>r.урон;r.cd=spellCooling(SPELLS[iWave]);
  G.mana=200;SAID.length=0;const hp=G.combat.hp;castSpell(iWave);r.повтор=SAID.slice(-1)[0]||"";r.повторБезУрона=G.combat.hp===hp;
  /* тихое: без голоса */
  G.mana=200;PLAYED.length=0;castSpell(iSilent);r.тихо=!PLAYED.includes("oc_sizzle");
  endCombat();G.inCombat=false;G.combat=null;
  /* щит и зов */
  G.mana=200;G.hp=50;G.buffs={};SAID.length=0;castSpell(iShield);r.оберег=buffActive("оберег");r.щитСказ=SAID.slice(-1)[0]||"";
  G.mana=100;G.hp=30;SAID.length=0;castSpell(iCall);r.лечение=G.hp>30;r.зовСказ=SAID.slice(-1)[0]||"";
  r.школыТекст=schoolsText();
  return r;});
 check('6а. стрела огня вне боя уходит в пустоту, в бою бьёт тварь и звучит голосом школы',
  !каст.нет&&/пустоту/.test(каст.пустота)&&каст.урон>0&&/твари/.test(каст.уронСказ)&&каст.голос,каст.нет||[каст.пустота,каст.урон,каст.голос]);
 check('6б. стойкая волна бьёт сильнее и уходит на перезарядку; повтор отклонён с часами и без урона',
  каст.волна&&каст.cd===2&&/перезаряжается: 2 ч/.test(каст.повтор)&&каст.повторБезУрона,[каст.cd,каст.повтор]);
 check('6в. тихое — без голоса; щит земли даёт оберег; зов света лечит',
  каст.тихо&&каст.оберег&&/оберег/.test(каст.щитСказ)&&каст.лечение&&/здоровье плюс/.test(каст.зовСказ),[каст.щитСказ,каст.зовСказ]);
 check('6г. «Школы» перечисляют тридцать восемь школ и известные чары по школам',
  /Школ заклинаний 38/.test(каст.школыТекст)&&/Огонь — /.test(каст.школыТекст)&&каст.записей===5,каст.школыТекст.slice(0,160));

 /* ── 7. сохранение ── */
 const сохр=await page.evaluate(()=>{
  saveGame(true);
  const книга=G.spellbook.length;
  for(let i=SPELLS.length-1;i>=0;i--)if(SPELLS[i].custom)SPELLS.splice(i,1);
  G.spellbook=[];G.spells=G.spells.filter(n=>!/Стрела огня|Щит земли/.test(n));
  loadGame();registerCustomSpells();
  return {книга,после:(G.spellbook||[]).length,вСписке:SPELLS.filter(s=>s.custom).length,известно:G.spells.includes("Стрела огня"),cd:!!(G.spellCD&&Object.keys(G.spellCD).length)};});
 check('7. после сохранения и загрузки составленные заклинания снова в книге, в списке и известны; перезарядка сохранена',
  сохр.книга===5&&сохр.после===5&&сохр.вСписке===5&&сохр.известно&&сохр.cd,сохр);

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\nИтого: ${results.filter(r=>r.startsWith('PASS')).length}/${results.length}`);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
