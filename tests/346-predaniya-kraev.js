/* ════════════════════════════════════════════════════════════════════════
   НАБОР 346: ПРЕДАНИЯ КРАЁВ (КАНОН II, Альфа 1.5)

   Просьба игрока: «тех же авторов заново, с полной переработкой: монстры, города,
   артефакты, ресурсы, озёра, реки, моря, горы, архипелаги; расы, народы, боги,
   подводный мир».
   1. Данные: в каждом из семнадцати краёв — места природы (от трёх, всегда с подводьем); шестьдесят семь тварей II
      (глубинные — только в подводье), пятьдесят одна вещь II, семнадцать городов
      с кварталами, расы и народы, боги; у каждого подводья — водоём и хозяин.
   2. Режиссёр открывает край — вокруг земли ложатся его места природы, и слово о них
      звучит; места в пределах мира.
   3. Подход к месту: слово о нём и знание (грань «земли» растёт).
   4. «Действие здесь» у места — его окно: дар, сбор ресурса, нырок; дар раз в сутки.
   5. Опасность места: холод ранит без тепла, с теплом — нет.
   6. Подводье: без дыхания нырок стоит здоровья; хозяин глубины встречает первого
      гостя; победа даёт клад, ресурс и тайну; второй нырок — без боя.
   7. Острова архипелага: лодка за золото, свой дар у острова.
   8. Город края II: кварталы с дарами, раса и народ (знакомство — знание), дело знатока края.
   9. Старое сохранение: край, открытый до преданий, получает места природы и город.
  10. Карта с координатами называет место природы; твари II встают в крае;
      вещь с дыханием даёт нырять без риска.
  11. «Действие здесь» не перехватывает постройку и ресурс.
  12. Глава руководства 143; ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1200);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  G.place=null;G.ship=null;G.inCombat=false;G.level=30;G.gold=99999;G.mana=999;G.manaMax=999;G.buffs={};
  window.спим=мс=>new Promise(r=>setTimeout(r,мс));
  window.СКАЗАНО=[];const e0=Speech.enqueue;Speech.enqueue=function(t,o){СКАЗАНО.push(String(t));return e0.apply(this,arguments);};
  window.ОКНО=null;const oe=openEvent;window.openEvent0=oe;openEvent=function(spec){ОКНО={title:spec.title(),text:spec.text?spec.text():"",choices:spec.choices()};return true;};
  window.ВЫБОР=re=>{const c=ОКНО&&ОКНО.choices.find(c=>re.test(c.l));if(c)c.run();return !!c;};
  /* клетка без постройки и ресурса — для мест природы */
  window.ПУСТО=()=>{const cc=window.__cc0||cellContent;window.__cc0=cc;cellContent=(x,y)=>{const c=cc(x,y);return Object.assign({},c,{structure:null,res:null,monster:null});};};
  window.ВЕРНУТЬ=()=>{if(window.__cc0)cellContent=window.__cc0;};});

 /* ── 1. Данные ── */
 const д=await p.evaluate(()=>{const o={краёв:КАНОН_КРАЯ.length};o.сГео=КАНОН_КРАЯ.filter(k=>(k.гео||[]).length>=3&&k.гео.some(f=>f.вид==="подводье")).length;
  o.тварей2=КАНОН_ТВАРИ.filter(t=>(KN.creatures.find(c=>c.id===t.id)||{}).канон2).length;
  o.глубинных2=KN.creatures.filter(c=>c.канон2&&c.глубь).length;o.глубинныхВКрае=КАНОН_КРАЯ.reduce((a,k)=>a+k.твари.filter(id=>(KN.creatures.find(c=>c.id===id)||{}).глубь).length,0);
  o.вещей2=КАНОН_ВЕЩИ.filter(x=>x.канон2).length;o.городов=КАНОН_КРАЯ.filter(k=>k.поселения.some(s=>s.канон2&&(s.кварталы||[]).length>=3)).length;
  o.рас=КАНОН_КРАЯ.filter(k=>k.народы.some(p=>p.канон2&&p.раса)).length;o.народов2=КАНОН_КРАЯ.filter(k=>k.народы.some(p=>p.канон2&&!p.раса)).length;
  o.богов2=КАНОН_КРАЯ.filter(k=>k.боги.some(b=>b.канон2)).length;
  const подв=Object.values(КАНОН_ГЕО).filter(f=>f.вид==="подводье");o.подводий=подв.length;
  o.подводьеБезХозяина=подв.filter(d=>!d.водоём||!КАНОН_ГЕО[d.водоём]||!d.тварь||!КАНОН_ТВАРЬ[d.тварь]).map(d=>d.имя);
  o.виды=[...new Set(Object.values(КАНОН_ГЕО).map(f=>f.вид))].sort();
  o.эфБезДела=Object.values(КАНОН_ГЕО).filter(f=>f.эф&&!КанонМесто.ЭФ[f.эф]).map(f=>f.имя);
  o.звукБез=Object.values(КАНОН_ГЕО).filter(f=>f.звукО&&!Bank.has(f.звукО)).map(f=>f.имя);
  o.ресурсБез=Object.values(КАНОН_ГЕО).filter(f=>f.ресурс&&!КАНОН_РЕС[f.ресурс]).map(f=>f.имя);
  return o;});
 check('1. семнадцать краёв с местами природы; 67 тварей II (глубинные не в крае), 51 вещь, 17 городов с кварталами, расы, народы, боги; у подводий водоём и хозяин; дары, звуки, ресурсы на месте',
  д.краёв===17&&д.сГео===17&&д.тварей2===67&&д.глубинных2>=10&&д.глубинныхВКрае===0&&д.вещей2===51&&д.городов===17&&д.рас===17&&д.народов2===17&&д.богов2===17
  &&д.подводий===17&&!д.подводьеБезХозяина.length&&д.виды.join()==="архипелаг,горы,море,озеро,подводье,река"&&!д.эфБезДела.length&&!д.звукБез.length&&!д.ресурсБез.length,д);

 /* ── 2. Открытие края ── */
 const о=await p.evaluate(async()=>{const o={};const k=КанонКрай.следующий();o.край=k&&k.имя;const t=Neuro.newLand(Neuro.gen().n++,Math.random);
  o.слово=/Открылся край/.test(t)&&/Вокруг — /.test(t);const g=КанонГео.ст();const м=g.места.filter(m=>m.край===k.id);
  o.мест=м.length;o.ждали=k.гео.filter(f=>f.вид!=="подводье").length;o.вМире=м.every(m=>m.x>=0&&m.y>=0&&m.x<WORLD_MAX&&m.y<WORLD_MAX);
  const land=G.gen.lands.find(l=>l.кн===k.id);o.рядом=м.every(m=>Math.abs(m.x-land.x)+Math.abs(m.y-land.y)<=30);
  o.город=G.gen.places.some(p=>p.кнКрай===k.id&&k.поселения.find(s=>s.id===p.кн&&s.канон2));
  window.КРАЙ=k.id;return o;});
 check('2. Режиссёр открывает край: слово о местах природы; места легли вокруг земли и в пределах мира; город края на месте',
  о.слово&&о.мест===о.ждали&&о.мест>=2&&о.вМире&&о.рядом&&о.город,о);

 /* ── 3. Подход к месту ── */
 const п=await p.evaluate(async()=>{const o={};const k=КАНОН_КРАЙ[КРАЙ];const f=k.гео.find(f=>f.вид==="озеро"||f.вид==="река");const m=КанонГео.ст().места.find(m=>m.id===f.id);
  const p0=Рост.познание().грани.find(g=>g.id==="земли").счёт;G.x=m.x;G.y=m.y;СКАЗАНО.length=0;КанонГео.ст().тут=null;КанонГео.шаг();await спим(1100);
  o.слово=СКАЗАНО.some(t=>t.indexOf(f.имя)>=0&&/Действие здесь/.test(t));o.знание=Lore.has("map",`kn2:${f.id}`);Рост.сброс();
  o.грань=[p0,Рост.познание().грани.find(g=>g.id==="земли").счёт];window.МЕСТО=f.id;return o;});
 check('3. подход к месту: слово о нём, знание и грань «земли» растёт',п.слово&&п.знание&&п.грань[1]>п.грань[0],п);

 /* ── 4. Окно места и дар раз в сутки ── */
 const ок=await p.evaluate(async()=>{const o={};const f=КАНОН_ГЕО[МЕСТО];ПУСТО();ОКНО=null;useHere();o.окно=!!ОКНО&&ОКНО.title===f.имя;
  o.кнопки=ОКНО?ОКНО.choices.map(c=>c.l.split(" — ")[0]):[];G.buffs={};const hp=G.hp;
  o.дар=ВЫБОР(/^(Испить|Переправиться)/);o.сутки=КанонГео.ст().дар[f.id]===G.day;СКАЗАНО.length=0;useHere();ВЫБОР(/^(Испить|Переправиться)/);
  o.второй=СКАЗАНО.some(t=>/уже отдало/.test(t));
  if(f.ресурс){const r=КАНОН_РЕС[f.ресурс];const n0=Number(G.inv[r.имя])||0;useHere();ВЫБОР(/^Собрать/);o.сбор=(Number(G.inv[r.имя])||0)>n0;}else o.сбор=true;
  ВЕРНУТЬ();return o;});
 check('4. «Действие здесь» у места — окно: дар, сбор; дар даётся раз в сутки',ок.окно&&ок.дар&&ок.сутки&&ок.второй&&ок.сбор,ок);

 /* ── 5. Опасность ── */
 const оп=await p.evaluate(()=>{const o={};G.buffs={};G.hp=G.hpMax;const a=КанонГео.опасность("холод");o.без=G.hp<G.hpMax;o.текст1=a;
  G.hp=G.hpMax;buffSet("тепло",4);const b=КанонГео.опасность("холод");o.с=G.hp===G.hpMax;o.текст2=b;G.buffs={};
  G.hour=10;const h0=G.hour;КанонГео.опасность("топь");o.топь=G.hour>h0;return o;});
 check('5. опасность места: холод ранит без тепла и щадит с ним; топь отнимает час',оп.без&&оп.с&&оп.топь,оп);

 /* ── 6. Подводье ── */
 const пв=await p.evaluate(async()=>{const o={};const d=Object.values(КАНОН_ГЕО).find(f=>f.вид==="подводье"&&(Number(f.глубина)||1)>=2&&(f.нужно||"дыхание")==="дыхание");
  const w=КАНОН_ГЕО[d.водоём],k=КАНОН_КРАЙ[d.край];G.buffs={};G.artifacts=[];G.hp=G.hpMax;delete КанонГео.ст().хозяин[d.id];delete КанонГео.ст().дар[d.id];
  o.неГотов=!КанонГео.готов(d);КанонГео.нырнуть(d,w,k);o.цена=G.hp<G.hpMax;o.тайна=Lore.has("secret",`kn2deep:${d.id}`);await спим(1900);
  o.бой=!!(G.inCombat&&G.combat&&G.combat.m&&G.combat.m.кнНырок===d.id);o.хозяин=G.combat&&G.combat.m&&G.combat.m.n;
  const з0=G.gold;if(G.inCombat){G.combat.hp=0;victory();}await спим(2900);o.победа=КанонГео.ст().хозяин[d.id]===G.day;o.клад=G.gold>з0;
  o.второй=false;G.hp=G.hpMax;КанонГео.нырнуть(d,w,k);await спим(1900);o.второйБезБоя=!G.inCombat;if(G.inCombat)endCombat();
  /* вещь с дыханием */
  const x=КАНОН_ВЕЩИ.find(x=>x.канон2&&x.особ.indexOf("дыхание")>=0);if(x){G.level=60;КанонВещи.дать(x.id,"проба");o.дыхание=КанонГео.готов(d);G.artifacts=[];G.level=30;}else o.дыхание="нет вещи";
  return o;});
 check('6. подводье: без дыхания нырок стоит здоровья; хозяин встречает; победа — клад и тайна; второй нырок без боя; вещь с дыханием спасает',
  пв.неГотов&&пв.цена&&пв.тайна&&пв.бой&&пв.победа&&пв.клад&&пв.второйБезБоя&&пв.дыхание===true,пв);

 /* ── 7. Острова ── */
 const ос=await p.evaluate(()=>{const o={};const f=Object.values(КАНОН_ГЕО).find(f=>f.вид==="архипелаг"&&(f.острова||[]).some(q=>q.эф!=="клад"));const k=КАНОН_КРАЙ[f.край];
  const q=f.острова.find(q=>q.эф!=="клад");  /* остров с кладом сам даёт золото — плату за лодку меряем на другом */delete КанонГео.ст().дар[q.id];G.buffs={};const з0=G.gold;КанонГео.остров(f,q,k);o.лодка=з0-G.gold;o.был=!!КанонГео.ст().был[q.id];
  o.второй=(()=>{const з1=G.gold;КанонГео.остров(f,q,k);return G.gold===з1;})();return o;});
 check('7. острова: лодка за пять золота, остров запомнен, второй раз за сутки — без платы и дара',ос.лодка===5&&ос.был&&ос.второй,ос);

 /* ── 8. Город края II ── */
 const г=await p.evaluate(async()=>{const o={};const k=КАНОН_КРАЙ[КРАЙ];const s=k.поселения.find(s=>s.канон2);const pl=G.gen.places.find(p=>p.кн===s.id);
  G.x=pl.x;G.y=pl.y;ОКНО=null;useHere();o.окно=!!ОКНО&&ОКНО.title===s.имя;o.кварталы=ОКНО?ОКНО.choices.filter(c=>/^Квартал: /.test(c.l)).length:0;
  o.раса=ОКНО?ОКНО.choices.some(c=>/^Раса: /.test(c.l)):false;o.народ=ОКНО?ОКНО.choices.some(c=>/^Народ: /.test(c.l)):false;
  ВЫБОР(/^Квартал: /);o.квартал=СКАЗАНО.length>0;useHere();ВЫБОР(/^Раса: /);const r=k.народы.find(p=>p.канон2&&p.раса);o.язык=Lore.has("tongue",`kn2:${r.id}`);
  /* дело знатока края */
  const c=k.люди.find(c=>c.канон2&&c.дело);КанонМесто.человек(c.id);ВЫБОР(/^Взять дело/);const t=КАНОН_ТВАРЬ[c.дело.тварь];
  startCombat({x:G.x,y:G.y,monster:Object.assign({},t,{lvl:3,hp:20,dmg:1,xp:5,gold:1})},{});await спим(200);G.combat.hp=0;victory();await спим(2800);
  КанонМесто.человек(c.id);const з0=G.gold;ВЫБОР(/^Сдать дело/);o.награда=G.gold-з0;return o;});
 check('8. город края II: окно с кварталами, расой и народом; квартал помогает; знакомство с расой — знание; дело знатока края сдано',
  г.окно&&г.кварталы>=3&&г.раса&&г.народ&&г.квартал&&г.язык&&г.награда>0,г);

 /* ── 9. Старое сохранение ── */
 const ст=await p.evaluate(()=>{const o={};const k=КАНОН_КРАЙ[КРАЙ];const g=КанонГео.ст();g.места=g.места.filter(m=>m.край!==k.id);g.сверено=-1;
  const s=k.поселения.find(s=>s.канон2);G.gen.places=G.gen.places.filter(p=>p.кн!==s.id);
  КанонГео.доразместить();o.места=g.места.filter(m=>m.край===k.id).length;o.город=G.gen.places.some(p=>p.кн===s.id);
  const n=g.места.length;КанонГео.доразместить();o.безПовтора=g.места.length===n&&G.gen.places.filter(p=>p.кн===s.id).length===1;return o;});
 check('9. старое сохранение: краю возвращаются места природы и город, без повторов',ст.места>=2&&ст.город&&ст.безПовтора,ст);

 /* ── 10. Карта, твари в крае ── */
 const кт=await p.evaluate(()=>{const o={};const f=КАНОН_ГЕО[МЕСТО];const m=КанонГео.ст().места.find(m=>m.id===f.id);Карта165.мир=true;
  o.карта=Карта165.что(m.x,m.y).indexOf(f.имя)>=0;const k=КАНОН_КРАЙ[КРАЙ];const land=G.gen.lands.find(l=>l.кн===k.id);
  const свои=new Set(KN.creatures.filter(c=>c.канон2&&c.пакет===k.пакет&&!c.глубь).map(c=>c.id));let n=0;
  for(let i=0;i<300;i++){const x=land.x+(i%11)-5,y=land.y+Math.floor(i/11)%11-5;const mm=safeFn(()=>beastAt(x,y,cellContent(x,y),1),null);if(mm&&свои.has(mm.id))n++;}
  o.твариII=n;return o;});
 check('10. карта с координатами называет место; твари края II встают в своём крае',кт.карта&&кт.твариII>0,кт);

 /* ── 11. «Действие здесь» не перехватывает постройку ── */
 const пх=await p.evaluate(()=>{const o={};G.loot=null;G.chStair=null;G.inCombat=false;const f=КАНОН_ГЕО[МЕСТО];const m=КанонГео.ст().места.find(m=>m.id===f.id);G.x=m.x;G.y=m.y;
  const cc=cellContent;cellContent=(x,y)=>Object.assign({},cc(x,y),{structure:{type:"ruin",name:"Развалины"}});o.свободно=КанонГео.свободно();cellContent=cc;
  const cc2=cellContent;cellContent=(x,y)=>Object.assign({},cc2(x,y),{structure:null,res:null});o.свободноПусто=КанонГео.свободно();cellContent=cc2;return o;});
 check('11. «Действие здесь» уходит месту природы только там, где нет постройки и ресурса',!пх.свободно&&пх.свободноПусто,пх);

 /* ── 12. Руководство и ошибки ── */
 const рк=await p.evaluate(()=>({имя:GUIDE_SEC_NAME[143]||""}));
 check('12. глава руководства 143 о преданиях краёв',/Предания краёв/.test(рк.имя),рк);
 check('13. ошибок страницы нет',errors.length===0,errors.slice(0,5));
 results.forEach(r=>console.log(r));await browser.close();process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
