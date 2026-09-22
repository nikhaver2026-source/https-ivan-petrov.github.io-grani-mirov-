/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 96: ВЕЩИ, ДЕЙСТВИЯ И ЧАРЫ ЗВУЧАТ ЗАПИСЯМИ, А НЕ ИНСТРУМЕНТАМИ

   Музыка осталась там, где ей место: маяки мест, награды, достижения,
   опыт, уровень и события. Всё, с чем игрок взаимодействует, — книги,
   сундуки, алтари, находки, монеты, обозы, порталы, чары, звери рядом,
   проповедники, погода — отвечает настоящими записями.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. В коде действий с предметами нет ролей инструментов: чтение, сундук,
      алтарь, тайник, клад, находка вещи, покупка, улов, обоз, разговор в
      доме, порталы, «действие здесь», ловушки, погода, чары.
   2. Чтение страницы шуршит страницей и переплётом; покупка звенит
      монетами; открытие сундука — крышкой и металлом; чары — стихией.
   3. Заменяющие роли настоящие: лежат в папках записей, а не в папках
      инструментов, и у каждой есть файл на диске.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.PLAYED=[];const p=Bank.play.bind(Bank);Bank.play=(r,o)=>{PLAYED.push(String(r));return p(r,o);};});

 /* ── 1. статика: в коде действий нет инструментов ── */
 const МУЗЫКА=/"(relic_xylo|relic_organ|relic_sing|treasure_spark|spark_glock|glade_marimba|swamp_kalimba|charm_celesta|charm_bell|chant_calliope|hex_charang|spell_harp|harp_light|harp_high|xylo_coin|clarinet_market|clarinet_shadow|caravan_sitar|piano_dark|chase_tremolo|pad_dread|pad_halo|pad_sanctum|pad_rift|pad_hearth|pad_dream|contrabass_dread|sneak_pizz|harmonium_low|harmonium_drone|temple_choir|temple_organ|fx_blessing|fx_haze|fx_rain|omen_swell|crypt_organ|lute_tavern|tuba_forge|signal_beep|market_dulcimer)"/;
 const статика=await page.evaluate(()=>{
  const fns={studyPage,studyKnowledge,openChest,useAltar,takeSecret,takeTreasure,findArtifact,caravanBuy,hookFish,meetCaravan,talkInside,discoverPortal,portalTravel,useHere,pigeonPost,announceClosed,castSpell,fight,gatherCurrent,sellResource,buyLot};
  const out={};for(const k in fns)out[k]=String(fns[k]);return out;});
 const нарушили=Object.keys(статика).filter(k=>МУЗЫКА.test(статика[k])).map(k=>k+": "+(статика[k].match(МУЗЫКА)||[])[1]);
 check('1. в коде действий с предметами, чарами, торгом и боем нет ролей инструментов',нарушили.length===0,нарушили);

 /* ── 2. динамика ── */
 const дин=await page.evaluate(async()=>{
  const r={};
  G.lore=[];G.bookGifts={};PLAYED.length=0;studyPage(7,0,"Проверка.");r.чтение=PLAYED.slice();
  const L=safeFn(()=>{for(let bx=3;bx<40;bx++)for(let by=3;by<40;by++){const l=genLevel(bx,by,2,"ruins");if(l&&l.entry)return {l,bx,by};}return null;},null);
  r.сундук=[];
  if(L){G.place={kind:"dungeon",bx:L.bx,by:L.by,stype:"ruins",name:"м",depth:2,x:L.l.entry.x,y:L.l.entry.y};
   let c=null;for(let y=0;y<L.l.h&&!c;y++)for(let x=0;x<L.l.w&&!c;x++)if(tileAt(L.l,x,y)==="C")c={x,y};
   if(c){G.marks={};PLAYED.length=0;openChest(c.x,c.y);r.сундук=PLAYED.slice();}
   G.place=null;}
  G.spells=G.spells||[];if(!G.spells.includes("Огненный шар"))G.spells.push("Огненный шар");G.mana=100;G.manaMax=100;
  /* Даём отзвучать отложенным звукам сундука и награды за чтение. */
  await new Promise(res=>setTimeout(res,1600));
  PLAYED.length=0;castSpell(SPELLS.findIndex(s=>s.n==="Огненный шар"));await new Promise(res=>setTimeout(res,900));r.чары=PLAYED.slice();
  return r;});
 const инстр=/xylo|glock|marimba|celesta|calliope|charang|harp|clarinet|sitar|piano|tremolo|pad_|contrabass|pizz|harmonium|organ|dulcimer|relic_/;
 check('2а. чтение страницы шуршит страницей и переплётом, без инструментов',дин.чтение.includes("uh_page")&&дин.чтение.includes("arte_book")&&!дин.чтение.some(x=>инстр.test(x)),дин.чтение);
 check('2б. сундук открывается крышкой и звенит металлом или монетами, без арфы и органа',дин.сундук.length>0&&!дин.сундук.some(x=>инстр.test(x)),дин.сундук);
 check('2в. чары звучат стихией, а не челестой',дин.чары.includes("cast_fire")&&!дин.чары.some(x=>инстр.test(x)),дин.чары);

 /* ── 3. заменяющие роли настоящие ── */
 const роли=["uh_page","arte_page","arte_gem","arte_metal","arte_coins","artifact_hum","oc_chest_open","choir","ad_temple","uh_chapel","bell_small","market_slap","forge_hammer","deep_cart","hall_house","market_tap","ad_trade","beasts_camel","hero_heart","lug_growl","lug_snarl","oc_growl","ad_leaves","lug_bush","oc_glass_hit","cast_heal","cast_shock","cast_ice","cast_fire","magic_woosh","magic_shimmer","es_magic","wraith_voice","oc_warp","raptor_wing","mtg_door_close","amb_fire","dread","stk_rain","sky_gust","amb_wind","clang_splash"];
 const файлы=await page.evaluate(роли=>роли.map(r=>[r,(SOUND_BANK[r]&&SOUND_BANK[r].f||[])[0]||null]),роли);
 const dir=path.dirname(process.argv[2].replace(/^http:\/\/[^/]+\//,'/home/user/'));
 const плохие=файлы.filter(([r,f])=>!f||/^(inst|orch|mood|relic|score|folk|depth)\//.test(f)||!fs.existsSync(path.join('/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds',f.replace(/%d/,'1'))));
 check('3. заменяющие роли — записи из папок мира, и файл каждой лежит на диске',плохие.length===0,плохие.slice(0,6));

 check('без ошибок страницы',errors.length===0,errors.slice(0,3));
 console.log(results.join('\n'));
 console.log(`\nИтого: ${results.filter(r=>r.startsWith('PASS')).length}/${results.length}`);
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
