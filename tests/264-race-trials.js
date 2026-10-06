/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 264: 10.0 — ИСПЫТАНИЯ КРОВИ ОТКРЫВАЮТ ВЫБОР РЕДКИХ РАС

   Просьба игрока: выбор редких рас и выше закрыт; его открывают уникальные
   квесты в особых подземельях (с двадцатого яруса), связанные с механизмами
   древних и зельями; легендарные и божественные — на девяностом ярусе
   божественных подземелий, сложным квестом с божественными ресурсами и
   готовкой. Закрытую расу видно, но выбрать нельзя: звучат ярус и имя квеста.

   1. Обычные и необычные открыты, редкие и выше закрыты; выбор закрытой —
      отказ с ярусом и названием испытания; в окне выбора она «закрыто».
   2. Четыре испытания: ярусы 20, 40, 90, 90; не во всех подземельях.
   3. «Ржавая Печь»: механизм на ярусе 20, рецепт, нехватка, эликсир; эликсир
      открывает редкие (в настройках), можно сменить расу сейчас.
   4. «Светоносный Котёл»: источники на ярусах 86–88, трапеза у огня,
      механизм на ярусе 90, эликсир — легендарные. «Первый Венец» молчит до
      легендарных.
   5. Звуки испытаний есть в банке, зелья испытаний существуют.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.__said=[];const n0=Speech.say.bind(Speech);Speech.say=function(t,o){__said.push(String(t));return n0(t,o);};
  settings.raceUnlock=1;G.raceChosen=0;G.level=1;G.quests=[];G.day=1;
  const st=Object.keys(PLACE_KIND).filter(k=>PLACE_KIND[k]==="dungeon");window.__f={};window.__all=0;window.__spec=0;
  for(let i=0;i<4000;i++){const bx=10000+i*97,by=20000+i*61;for(const s of st){__all++;const t=raceTrialDungeon(bx,by,s);if(t){__spec++;if(!__f[t.id])__f[t.id]={bx,by,s};}}}
  window.__mech=(f,d)=>{G.place={kind:"dungeon",bx:f.bx,by:f.by,stype:f.s,name:"x",depth:d,x:1,y:1};const l=curLevel();
   for(let y=1;y<l.h-1;y++)for(let x=1;x<l.w-1;x++)if(tileAt(l,x,y)==="I"){G.place.x=x;G.place.y=y;return {x,y};}return null;};});

 const п1=await p.evaluate(()=>{const r={};
  r.откр=[0,1].every(raceRankOpen)&&![2,3,4,5].some(raceRankOpen);
  const rare=RACES_DB.find(x=>x.rank===2);__said.length=0;r.выбор=startRacePick(rare.id);r.сказ=__said.slice(-1)[0]||"";
  openModal("modal-racepick");renderRacePick();const b=document.querySelector(`#racePickBody [data-cmd="racepick:${rare.id}"]`);r.кнопка=b&&b.textContent;closeModal(document.getElementById("modal-racepick"));
  const com=RACES_DB.find(x=>x.rank===0);r.обычная=startRacePick(com.id);G.raceChosen=0;return r;});
 check('1. обычные и необычные открыты, редкие и выше — нет; закрытая раса видна, выбор — отказ с ярусом и названием испытания',
  п1.откр&&п1.выбор===false&&/яруса 20/.test(п1.сказ)&&/«Ржавая Печь»/.test(п1.сказ)&&/закрыто/.test(п1.кнопка||"")&&п1.обычная,п1);

 const п2=await p.evaluate(()=>({ярусы:RACE_TRIALS.map(t=>t.ярус),ранги:RACE_TRIALS.map(t=>t.ранг),найдено:Object.keys(__f).sort(),доля:__spec/__all}));
 check('2. четыре испытания на ярусах 20, 40, 90, 90 для рангов 2–5; особые подземелья есть, но их меньше половины',
  п2.ярусы.join()==="20,40,90,90"&&п2.ранги.join()==="2,3,4,5"&&п2.найдено.length===4&&п2.доля>0&&п2.доля<0.5,п2);

 const п3=await p.evaluate(()=>{const r={};const pos=__mech(__f.rust,20);r.есть=!!pos;r.имя=pos&&tileLabel("I",pos.x,pos.y);
  __said.length=0;raceTrialUse();r.рецепт=__said.slice(-1)[0]||"";raceTrialUse();r.нехватка=__said.slice(-1)[0]||"";
  G.inv["кристалл"]=3;G.potions=[];potionGive("mana");G.items=[];raceTrialUse();r.эликсир=G.items.includes("Эликсир ржавой крови");r.кристаллов=G.inv["кристалл"]||0;
  const row=invAll().find(x=>x.name==="Эликсир ржавой крови");invDo("drink",row.kind,row.key);
  r.открыто=settings.raceUnlock===2&&raceRankOpen(2)&&!raceRankOpen(3);r.сменить=startRaceOpen();
  const rare=RACES_DB.find(x=>x.rank===2);G.place=null;r.выбрано=startRacePick(rare.id)&&G.race===rare.n;return r;});
 check('3. «Ржавая Печь»: механизм на ярусе 20, рецепт, нехватка, эликсир из кристаллов и зелья маны; выпитый — редкие открыты, расу можно сменить',
  п3.есть&&п3.имя==="Ржавая Печь древних"&&/кристалл ×3/.test(п3.рецепт)&&/Не хватает/.test(п3.нехватка)&&п3.эликсир&&п3.кристаллов===0&&п3.открыто&&п3.сменить&&п3.выбрано,п3);

 const п4=await p.evaluate(()=>{const r={};settings.raceUnlock=3;G.items=["Жареные грибы"];G.potions=[];G.inv={};
  const t=RACE_TRIAL_BY_ID.lumen;
  for(const d of [86,87,88]){__mech(__f.lumen,d);raceTrialUse();}
  r.ресурсы=Object.values(t.источники).every(x=>G.inv[x]===1);
  r.безОгня=trialCookReady(t,new Set(["statue"]));r.уОгня=trialCookReady(t,new Set(["brazier"]));
  r.готово=trialCook(t);r.трапеза=G.items.includes("Светоносная трапеза");
  __mech(__f.lumen,90);raceTrialUse();potionGive("clearblood");raceTrialUse();r.эликсир=G.items.includes("Эликсир светоносной крови");
  r.пить=trialDrink("Эликсир светоносной крови");r.открыто=raceRankOpen(4)&&!raceRankOpen(5);
  settings.raceUnlock=3;__mech(__f.crown,90);__said.length=0;raceTrialUse();r.венец=__said.slice(-1)[0]||"";
  G.place=null;settings.raceUnlock=1;return r;});
 check('4. «Светоносный Котёл»: ресурсы с ярусов 86–88, трапеза только у огня, эликсир — легендарные; «Первый Венец» молчит до легендарных',
  п4.ресурсы&&!п4.безОгня&&п4.уОгня&&п4.трапеза&&п4.эликсир&&п4.открыто&&/легендарные/.test(п4.венец),п4);

 const п5=await p.evaluate(()=>{const нет=[];RACE_TRIALS.forEach(t=>{(t.звук||[]).forEach(z=>{if(!SOUND_BANK[z])нет.push(z);});(t.зелья||[]).forEach(id=>{if(!POTION_BY_ID[id])нет.push(id);});});return нет;});
 check('5. звуки испытаний есть в банке, зелья испытаний существуют',!п5.length,п5);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
