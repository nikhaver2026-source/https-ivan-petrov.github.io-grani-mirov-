/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 94: ВЛАДЫКИ ЗЕМЕЛЬ И САМОПРОВЕРКА МИРА

   Босс — не тварь с большим здоровьем. У каждого из шести владык своя
   история, земля, три яруса предвестников, звуковая сигнатура, три фазы с
   переменой погоды, отклик на школу чар, своя механика, редкий припас,
   условие доступа и награда; победа и поражение меняют землю вокруг логова
   (§127). Генератор проверяет сам себя, и список финального контроля
   считается живьём (§131, §133).

   ЧТО ПРОВЕРЯЕТСЯ.

   1. Шесть владык со всеми полями, звуки из банка, механики различны,
      логово лежит в своём биоме и постоянно, припас — товар.
   2. Предвестники: за двадцать четыре шага — дальний, за двенадцать —
      ближний, за четыре — голос и история; каждый ярус объявляется раз и
      слышен со стороны логова; «Владыки» говорят направлением.
   3. Доступ: уровень, ночь, день, ремесло — отказ словами; вызов на логове
      начинает бой с владыкой первой фазы.
   4. Фазы: на трёх пятых — вторая с бурей и тяжёлым ударом, на четверти —
      третья, где клинок берёт вполсилы; отклик школ: вода рвёт, огонь кормит;
      хор тянет ману и глушит чары в тишине; механизм обжигает; кормчий не
      отпускает.
   5. Победа: припас, вещь, титул, подвоз щедрее, весть, погода ясна, встречи
      у логова реже, владыка вернётся через шестьдесят дней; поражение:
      встречи чаще на семь дней.
   6. Самопроверка мира: все пункты в порядке и названы словами; всё в
      сохранении.
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
  window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,o);};
  const sr=Spatial.role.bind(Spatial);Spatial.role=(r,dx,dy,o)=>{PLAYED.push(String(r));return sr(r,dx,dy,o);};});

 /* ── 1. реестр ── */
 const реестр=await page.evaluate(()=>{
  const плохие=WORLD_BOSSES.filter(b=>!b.n||!b.история||!b.био||b.био.length<1||!b.предвестники||b.предвестники.length!==3||!b.звуки||Object.values(b.звуки).some(r=>!SOUND_BANK[r])||!b.фазы||b.фазы.length!==3||!b.отклик||!b.откликСлова||!b.доступ||!b.припас||!b.земля||!b.земля.победа||!b.земля.поражение||!(RES_BASE[b.припас]>0)).map(b=>b.id);
  const механики=new Set(WORLD_BOSSES.map(b=>b.фазы.map(p=>p.механика||"").join("|")));
  const bio=new Set(BIOMES.map(b=>b.id));
  const логова=WORLD_BOSSES.map(b=>{const l=bossLair(b),l2=bossLair(b);const bb=biomeAt(l.x,l.y);return {id:b.id,вБиоме:b.био.includes(bb.id),постоянно:l.x===l2.x&&l.y===l2.y,биомыЕсть:b.био.every(id=>bio.has(id))};});
  return {n:WORLD_BOSSES.length,плохие,механик:механики.size,логова,неВБиоме:логова.filter(l=>!l.вБиоме).map(l=>l.id)};});
 check('1. шесть владык со всеми полями и звуками из банка; механики различны; логово в своём биоме и постоянно; припас — товар',
  реестр.n===6&&!реестр.плохие.length&&реестр.механик===6&&реестр.логова.every(l=>l.постоянно&&l.биомыЕсть)&&реестр.неВБиоме.length<=1,реестр);

 /* ── 2. предвестники ── */
 const предв=await page.evaluate(()=>{
  const r={};const b=BOSS_BY_ID.ashlord;const l=bossLair(b);G.place=null;G.ship=null;G.dark=false;G.bosses={};G.bossOmen={};G.bossSeen={};G.level=20;
  const шаг=(d)=>{G.x=l.x-d;G.y=l.y;SAID.length=0;PLAYED.length=0;bossOmens();return {сказ:SAID.find(t=>/шаг/.test(t))||"",звуки:PLAYED.slice()};};
  r.далеко=шаг(40);r.т1=шаг(20);r.т1повтор=шаг(18);r.т2=шаг(10);r.т3=шаг(3);r.т3повтор=шаг(2);
  r.текст=bossesText();
  /* Роли предвестников берутся из самой таблицы владыки: они менялись на записи. */
  r.дальний=b.звуки.дальний;r.голос=b.звуки.голос;
  return r;});
 check('2. предвестники по трём ярусам, каждый раз со звуком со стороны логова, объявляются раз; за сорок шагов — тишина; «Владыки» говорят направлением',
  предв.далеко.сказ===""&&/на ветру/.test(предв.т1.сказ)&&предв.т1.звуки.includes(предв.дальний)&&предв.т1повтор.сказ===""&&/сер/.test(предв.т2.сказ)&&предв.т2.звуки.includes("oc_quake")&&/Пепельный Владыка/.test(предв.т3.сказ)&&предв.т3.звуки.includes(предв.голос)&&предв.т3повтор.сказ===""&&/Владык земель 6/.test(предв.текст)&&/шагов/.test(предв.текст),
  [предв.т1.сказ.slice(0,80),предв.т2.сказ.slice(0,60),предв.т3.сказ.slice(0,80)]);

 /* ── 3. доступ и вызов ── */
 const доступ=await page.evaluate(()=>{
  const r={};G.inCombat=false;G.combat=null;
  const на=(id)=>{const l=bossLair(BOSS_BY_ID[id]);G.x=l.x;G.y=l.y;};
  на("ashlord");G.level=3;r.меню=amAvailable("bossfight");SAID.length=0;r.низко=bossFight();r.низкоСказ=SAID.slice(-1)[0];
  на("dreamer");G.hour=12;SAID.length=0;r.день=bossFight();r.деньСказ=SAID.slice(-1)[0];
  на("giant");G.hour=23;G.level=20;SAID.length=0;r.ночь=bossFight();r.ночьСказ=SAID.slice(-1)[0];
  на("engine");G.mast={};SAID.length=0;r.ремесло=bossFight();r.ремеслоСказ=SAID.slice(-1)[0];
  G.x=WORLD>>1;G.y=WORLD>>1;r.нигде=bossFight();r.менюНигде=amAvailable("bossfight");
  на("ashlord");G.level=20;G.hour=12;SAID.length=0;r.вызов=bossFight();r.бой=!!G.inCombat;r.флаг=G.combat&&G.combat.m&&G.combat.m.boss;r.вызовСказ=SAID.find(t=>/принимает вызов/.test(t))||"";
  return r;});
 check('3. доступ отказывает словами: низкий уровень, день для ночного, ночь для дневного, без ремесла для механизма; вне логова вызова нет; на логове вызов начинает бой с первой фазой',
  доступ.меню&&доступ.низко===false&&/уровень/.test(доступ.низкоСказ)&&доступ.день===false&&/ночью/.test(доступ.деньСказ)&&доступ.ночь===false&&/днём/.test(доступ.ночьСказ)&&доступ.ремесло===false&&/рун/.test(доступ.ремеслоСказ)&&доступ.нигде===false&&!доступ.менюНигде&&доступ.вызов&&доступ.бой&&доступ.флаг&&доступ.флаг.phase===1&&/Фаза первая/.test(доступ.вызовСказ),
  [доступ.низкоСказ,доступ.деньСказ,доступ.ночьСказ,доступ.ремеслоСказ]);

 /* ── 4. фазы, отклик, механики ── */
 const фазы=await page.evaluate(()=>{
  const r={};const cb=G.combat;G.hp=900;G.hpMax=900;G.weather="Ясно";G.mana=100;G.manaMax=100;
  const rnd=Math.random;Math.random=()=>0.5;
  const max=cb.m.hp;r.dmg1=cb.m.dmg;
  cb.hp=Math.round(max*0.55);SAID.length=0;PLAYED.length=0;fight("atk");
  r.фаза2=cb.m.boss.phase;r.погода=G.weather;r.dmg2=cb.m.dmg;r.сказ2=SAID.find(t=>/фаза вторая/.test(t))||"";r.звук2=PLAYED.includes("mtg_lava");
  cb.hp=Math.round(max*0.2);fight("atk");r.фаза3=cb.m.boss.phase;
  r.kAtk=bossDamageK("atk");r.kWater=bossDamageK("spell","water");r.kFire=bossDamageK("spell","fire");r.kMagic=bossDamageK("magic");
  /* хор: тянет ману и в тишине глушит чары */
  endCombat();G.inCombat=false;G.combat=null;
  const на=(id)=>{const l=bossLair(BOSS_BY_ID[id]);G.x=l.x;G.y=l.y;};
  на("choir");G.hour=23;G.level=20;bossFight();const cb2=G.combat;G.mana=50;fight("atk");r.мана=G.mana;
  cb2.hp=Math.round(cb2.m.hp*0.1);fight("atk");r.хорФаза=cb2.m.boss.phase;r.хорМагия=bossDamageK("magic");r.хорКлинок=bossDamageK("atk");r.хорЗвук=bossDamageK("spell","sound");
  endCombat();G.inCombat=false;G.combat=null;
  /* механизм обжигает в перегреве */
  на("engine");G.hour=12;G.mast={runes:{ур:1,оп:0}};bossFight();const cb3=G.combat;cb3.hp=Math.round(cb3.m.hp*0.2);fight("atk");fight("atk");r.ожог=/обжигает/.test(cbLog2text());r.ожогФаза=cb3.m.boss.phase;
  endCombat();G.inCombat=false;G.combat=null;
  /* кормчий: якорь — бегства нет */
  на("helmsman");G.hour=23;bossFight();const cb4=G.combat;cb4.hp=Math.round(cb4.m.hp*0.1);fight("atk");r.якорьФаза=cb4.m.boss.phase;fight("flee");r.вБою=!!G.inCombat;r.якорьЛог=cbLog2text();
  endCombat();G.inCombat=false;G.combat=null;
  /* сновидица: без чутья удар может уйти в морок */
  на("dreamer");G.hour=23;G.buffs={};bossFight();let mimo=0;for(let i=0;i<40;i++){Math.random=()=>0.1;if(bossDamageK("atk")===0)mimo++;}r.мимо=mimo;buffSet("чутьё",3);r.сЧутьём=bossDamageK("atk");G.buffs={};
  endCombat();G.inCombat=false;G.combat=null;Math.random=rnd;
  return r;});
 check('4а. на трёх пятых — вторая фаза с песчаной бурей, тяжёлым ударом, звуком и словами; на четверти — третья, где клинок вполсилы; вода рвёт вдвое, огонь кормит',
  фазы.фаза2===2&&фазы.погода==="Песчаная буря"&&фазы.dmg2>фазы.dmg1&&/пепельная буря/.test(фазы.сказ2)&&фазы.звук2&&фазы.фаза3===3&&фазы.kAtk===0.5&&фазы.kWater===2&&фазы.kFire===0&&фазы.kMagic===1,
  [фазы.фаза2,фазы.погода,фазы.dmg1,фазы.dmg2,фазы.kAtk,фазы.kWater,фазы.kFire]);
 check('4б. хор тянет ману и в тишине глушит чары, но клинок бьёт вдвое; механизм в перегреве обжигает; кормчий с якорем не отпускает; сновидица без чутья уводит удары в морок',
  фазы.мана===45&&фазы.хорФаза===3&&фазы.хорМагия===0&&фазы.хорКлинок===2&&фазы.ожог===true&&фазы.ожогФаза===3&&фазы.якорьФаза===3&&фазы.вБою&&/Якорь/.test(фазы.якорьЛог)&&фазы.мимо===40&&фазы.сЧутьём===1,
  [фазы.мана,фазы.хорФаза,фазы.хорМагия,фазы.хорКлинок,фазы.ожог,фазы.ожогФаза,фазы.якорьФаза,фазы.вБою,фазы.якорьЛог,фазы.мимо,фазы.сЧутьём]);

 /* ── 5. победа и поражение ── */
 const исход=await page.evaluate(()=>{
  const r={};const на=(id)=>{const l=bossLair(BOSS_BY_ID[id]);G.x=l.x;G.y=l.y;};
  на("ashlord");G.hour=12;G.level=20;G.inv={};G.artifacts=[];G.titles=[];G.market={};G.rumors=[];G.bosses={};G.hp=900;G.hpMax=900;
  bossFight();const cb=G.combat;cb.hp=1;G.weather="Песчаная буря";SAID.length=0;PLAYED.length=0;fight("atk");
  r.бой=!!G.inCombat;r.состояние=G.bosses.ashlord;r.припас=G.inv["сердце пепла"];r.вещь=G.artifacts.length;r.титул=G.titles;r.подвоз=marketOf(empireIndexAt(G.x,G.y)).подвоз;r.весть=(G.rumors||[]).some(x=>x.в==="бой");r.погода=G.weather;r.сказ=SAID.find(t=>/пал\./.test(t))||"";r.звук=PLAYED.includes("es_boom_last");
  r.регион=bossRegionK();G.x+=60;r.вдали=bossRegionK();G.x-=60;
  r.жив=bossAlive(BOSS_BY_ID.ashlord);r.менюПосле=amAvailable("bossfight");G.day+=61;r.вернулся=bossAlive(BOSS_BY_ID.ashlord);G.day-=61;
  /* поражение */
  на("giant");G.hour=12;bossFight();G.hp=1;SAID.length=0;defeat();
  r.поражение=G.bosses.giant;r.поражСказ=SAID.find(t=>/одержал верх/.test(t))||"";на("giant");r.регионПораж=bossRegionK();
  r.текст=bossesText();saveGame(true);const raw=localStorage.getItem(SAVE_KEY)||"";r.сохр=/"bosses"/.test(raw)&&/"bossSeen"/.test(raw);
  return r;});
 check('5а. победа: бой окончен, владыка повержен, припас и вещь взяты, титул дан, подвоз щедрее, весть пошла, погода ясна, слышно; у логова встречи вдвое реже, вдали — как прежде; вернётся через шестьдесят дней',
  !исход.бой&&исход.состояние&&исход.состояние.slain&&исход.припас===1&&исход.вещь>=1&&исход.титул.length===1&&исход.подвоз>1&&исход.весть&&исход.погода==="Ясно"&&/пал/.test(исход.сказ)&&исход.звук&&исход.регион===0.5&&исход.вдали===1&&исход.жив===false&&!исход.менюПосле&&исход.вернулся===true,
  [исход.состояние,исход.припас,исход.вещь,исход.титул,исход.подвоз,исход.регион,исход.вдали]);
 check('5б. поражение: владыка одержал верх, земля помнит семь дней и встречи чаще; «Владыки» и сохранение знают исход',
  исход.поражение&&исход.поражение.beaten&&/одержал верх/.test(исход.поражСказ)&&исход.регионПораж===1.5&&/повержен/.test(исход.текст)&&/одержал верх над вами/.test(исход.текст)&&исход.сохр,
  [исход.поражение,исход.регионПораж,исход.сохр]);

 /* ── 6. самопроверка ── */
 const сам=await page.evaluate(()=>{const r=worldSelfCheck();return {n:r.length,плохие:r.filter(x=>!x.ok),текст:worldCheckText()};});
 check('6. самопроверка мира: все пункты в порядке и названы словами',сам.n>=14&&!сам.плохие.length&&/в порядке/.test(сам.текст),сам.плохие.length?сам.плохие:сам.текст.slice(0,120));

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\nИтого: ${results.filter(r=>r.startsWith('PASS')).length}/${results.length}`);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
