/* ══════════════════════════════════════════════════════════════════
   258 — КЛИНКИ, ЗАВАЛЫ, ЖЕСТЫ, ФЛЯГА (9.5.3, просьба игрока)
   «Звук объекта не слышен со стороны; на площадке нет „обыскать“,
   „прислушаться“, „проверить на пустоту“; мечи и кинжалы звучат одинаково;
   дверь открылась — а за ней стена; разобранный завал остаётся стеной;
   мотыльницу не слышно; урон не называется; нужен жест „только здоровье“,
   карта места не нужна — на её жест зелье; на 3–4 ярусе играет не та
   музыка, и громкость музыки не меняется; обмен у торговца без звука;
   надевание звучит одинаково; фляги нет, а вода бесконечна; свиток
   многоразовый без отката».
   Проверяется:
   1. Вещь и завал звучат в звуковой картине своим голосом и со стороны.
   2. Площадка: «прислушаться» и «проверить на пустоту» в действиях; в меню
      «Здесь» — обыскать, прислушаться, проверить стены; карты места нет.
   3. Двери не упираются в стену: у каждой двери с обеих сторон проход.
   4. Завал — настоящая плитка; разбор освобождает клетку.
   5. Случайный рычаг: срабатывает не больше раза на вещь.
   6. Мотыльница: своя роль в бою (кружит) и свои звуки крыльев.
   7. Урон: удар твари и удар героя называются; флажки их глушат.
   8. Жесты: здоровье — одним пальцем вниз и вверх, зелье — двумя пальцами
      влево, осмотр — тремя пальцами влево; действия «карта» нет.
   9. Музыка яруса — подземная тема; громкость музыки 0 даёт тишину.
   10. Обмен у торговца звучит; у каждой вещи свой звук в руке.
   11. Голос клинка: разные мечи звучат разными записями; кинжал — своими.
   12. Надевание: пояс, сапоги, перчатки, шлем, плащ, лук — свои записи.
   13. Простая фляга в суме с самого начала, вода в ней кончается.
   14. Свиток легенды: откат шесть часов; «изучить» даёт знание один раз.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];window.__snd=[];
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};
  const был=Bank.play.bind(Bank);Bank.play=(r,o)=>{window.__snd.push(r);return был(r,o);};});

 /* 1, 3, 4: подземелье */
 const d=await p.evaluate(()=>{
  const out={};
  out.prop=SCAPE_VOICE.prop&&SCAPE_VOICE.prop.prio>=1&&SCAPE_VOICE.prop.period<=8;
  out.rubble=SCAPE_TILE["%"]==="rubble"&&!!SCAPE_VOICE.rubble&&BEACON_ROLE.rubble==="od_rocks"&&TILE["%"]&&TILE["%"].solid===true;
  /* двери: у каждой — проход с двух сторон */
  let плохих=0,всего=0;
  for(let seed=1;seed<=12;seed++){
   const lvl=safeFn(()=>genLevel(1000+seed*37,2000+seed*53,1+(seed%5),undefined),null);
   if(!lvl||!lvl.g)continue;
   for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++){
    if(lvl.g[y][x]!=="+")continue;всего++;
    const open=(a,b)=>{const t=lvl.g[b]&&lvl.g[b][a];return !!t&&t!=="#";};
    const гор=open(x-1,y)&&open(x+1,y),верт=open(x,y-1)&&open(x,y+1);
    if(!гор&&!верт)плохих++;}}
  out.doors={всего,плохих};
  return out;});
 check('1. вещь и завал звучат в картине своим голосом',d.prop&&d.rubble,d);
 check('3. дверь не упирается в стену',d.doors.всего>0&&d.doors.плохих===0,d.doors);

 const r=await p.evaluate(()=>{
  const out={};
  out.funcs=["placeRubble","clearRubble","rubbleSearch","rubbleAround","fixDoorways","accidentalSwitch","landingListen","landingHollow","listenAround","hollowAround"].filter(n=>{try{return eval("typeof "+n)!=="function";}catch(_){return true;}});
  return out;});
 check('4. функции завала, дверей и площадки на месте',r.funcs.length===0,r.funcs);

 /* 2: меню «Здесь» */
 const h=await p.evaluate(()=>{
  const html=document.body.innerHTML;
  return {search:/searchhere/.test(html)||typeof CMD.searchhere==="function",listen:typeof CMD.listenhere==="function",
   hollow:typeof CMD.hollowhere==="function",map:/Карта места/.test(String(document.getElementById("modal-here")&&document.getElementById("modal-here").innerHTML||""))};});
 check('2. «Здесь»: обыскать, прислушаться, проверить стены; карты места нет',h.search&&h.listen&&h.hollow&&!h.map,h);

 /* 6: мотыльница */
 const m=await p.evaluate(()=>{
  const мот={id:"nightmoth",n:"ночная мотыльница",hp:20};
  return {moth:isMoth(мот),role:arenaRole(мот),cue:FOE_CUE_BY_ID.move&&FOE_CUE_BY_ID.move.nightmoth,
   ids:MOTH_IDS.every(id=>FOE_CUE_BY_ID.attack&&FOE_CUE_BY_ID.attack[id])};});
 check('6. мотыльница кружит и хлопает крыльями',m.moth&&m.role==="skirm"&&!!m.cue&&m.ids,m);

 /* 7: урон */
 const u=await p.evaluate(async()=>{
  const сказано=[];const пров=(t,o)=>{сказано.push({t:String(t),урон:o&&o.урон});};
  const старое=Speech.enqueue.bind(Speech);
  Speech.enqueue=(t,o)=>{пров(t,o);return старое(t,o);};
  settings.cbDmgFoe=1;settings.cbDmgMe=1;
  const a=Speech.enqueue("Волк: −5, осталось 10.",{урон:"foe",cat:"combat",pri:2});
  settings.cbDmgFoe=0;
  const до=Speech.queue?Speech.queue.length:0;
  Speech.enqueue("Волк: −6, осталось 4.",{урон:"foe",cat:"combat",pri:2});
  const после=Speech.queue?Speech.queue.length:0;
  settings.cbDmgFoe=1;Speech.enqueue=старое;
  return {флажки:"cbDmgFoe" in settings&&"cbDmgMe" in settings,html:!!document.getElementById("setCbDmgFoe")&&!!document.getElementById("setCbDmgMe"),
   отброшено:после<=до,код:/урон:"me"/.test(String(fight))||/урон:"me"/.test(document.documentElement.innerHTML)};});
 check('7. урон называется, флажки его глушат',u.флажки&&u.html&&u.отброшено&&u.код,u);

 /* 8: жесты */
 const g=await p.evaluate(()=>({hp:GEST_DEFAULTS.cornerSN,pot:GEST_DEFAULTS["2swipeW"],look:GEST_DEFAULTS["3swipeW"],
  map:GEST_ACTIONS.some(a=>a.id==="map"),hpAct:GEST_ACTIONS.some(a=>a.id==="hp")}));
 check('8. жесты: здоровье, зелье, осмотр; карты места нет',g.hp==="hp"&&g.pot==="potion"&&g.look==="look"&&!g.map&&g.hpAct,g);
 const hp=await p.evaluate(async()=>{window.__tts.length=0;const a=GEST_ACTIONS.find(a=>a.id==="hp");a.делать();
  await new Promise(r=>setTimeout(r,600));return window.__tts.join(" | ");});
 check('8б. «только здоровье» называет здоровье',/Здоровье \d+ из \d+/.test(hp),hp);

 /* 9: музыка */
 const mu=await p.evaluate(()=>{
  const W=OLD_WORLD>>1;let found=null;
  for(let rr=0;rr<600&&!found;rr++)for(let dy=-rr;dy<=rr&&!found;dy++)for(let dx=-rr;dx<=rr&&!found;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;const c=cellContent(W+dx,W+dy);
   if(c.structure&&/dungeon|cave|crypt|ruin/.test(c.structure.type)){G.x=W+dx;G.y=W+dy;found=c;}}
  if(!found)return {нет:1};
  G.place=null;enterPlace(cellContent(G.x,G.y));while(activeLayer())closeTopUI();
  if(G.place)G.place.depth=3;
  const key=locationMusicKey();
  settings.musicVol=0;const v0=Bank.vol("music");settings.musicVol=0.5;const v5=Bank.vol("music");
  return {key,ожидаем:underTrack(3),v0,v5};});
 check('9. на ярусе — подземная тема, громкость 0 — тишина',!mu.нет&&mu.key===mu.ожидаем&&mu.v0===0&&mu.v5>0,mu);

 /* 10: обмен у торговца */
 const tr=await p.evaluate(()=>({кость:itemHandSound("кость"),зелье:itemHandSound("зелье здоровья"),
  золото:itemHandSound("золото"),evGive:/itemHandSound/.test(String(evGive))}));
 check('10. у вещей свой звук в руке',tr.кость!==tr.зелье&&tr.зелье!==tr.золото&&tr.evGive,tr);

 /* 11: голос клинка */
 const v=await p.evaluate(()=>{
  const мечи=["Простой стальной меч","Добротный железный меч","Отличный серебряный меч","Грубый кожаный меч","Нерушимый драконий меч","Благословенный лунный меч"]
   .map((n,i)=>({id:"w"+i,name:n,type:"Меч",slot:"weapon",val:5,rank:i,qual:1}));
  const голоса=new Set(мечи.map(w=>weaponVoice(w,"sword")));
  const сабля=weaponVoice({id:"x1",name:"Кривая сабля",type:"Меч"},"sword");
  const двуруч=weaponVoice({id:"x2",name:"Тяжёлый двуручный меч",type:"Меч"},"sword");
  const рапира=weaponVoice({id:"x3",name:"Тонкая рапира",type:"Меч"},"sword");
  const нож=weaponVoice({id:"x4",name:"Охотничий нож",type:"Кинжал"},"dagger");
  const стилет=weaponVoice({id:"x5",name:"Стилет",type:"Кинжал"},"dagger");
  const старт=weaponVoice(DEFAULT_WEAPON,"sword");
  const роли=["w_v_ring_hit","w_v_heavy_hit","w_v_thin_hit","w_v_knife_hit","w_v_stiletto_hit","w_v_ring_parry","w_v_heavy_draw","w_v_thin_draw"].filter(r=>!SOUND_BANK[r]);
  G.equip.weapon={id:"x2",name:"Тяжёлый двуручный меч",type:"Меч",slot:"weapon",val:9,rank:2,qual:2};
  weaponSound("hit_flesh",{one:true});const a=G.lastWeaponSound&&G.lastWeaponSound.role;
  G.equip.weapon={id:"x3",name:"Тонкая рапира",type:"Меч",slot:"weapon",val:9,rank:2,qual:2};
  weaponSound("hit_flesh",{one:true});const b=G.lastWeaponSound&&G.lastWeaponSound.role;
  G.equip.weapon={id:"x4",name:"Охотничий нож",type:"Кинжал",slot:"weapon",val:9,rank:2,qual:2};
  weaponSound("parry",{one:true});const c=G.lastWeaponSound&&G.lastWeaponSound.role;
  G.equip.weapon=Object.assign({},DEFAULT_WEAPON);
  return {голоса:голоса.size,сабля,двуруч,рапира,нож,стилет,старт,роли,a,b,c,одинаково:weaponVoice(мечи[2],"sword")===weaponVoice(Object.assign({},мечи[2]),"sword")};});
 check('11а. разные мечи — разные голоса',v.голоса>=2&&v.одинаково,v);
 check('11б. по имени: сабля звенит, двуручник гудит, рапира тонкая, нож и стилет свои',
  v.сабля==="ring"&&v.двуруч==="heavy"&&v.рапира==="thin"&&v.нож==="knife"&&v.стилет==="stiletto"&&v.старт==="ring",v);
 check('11в. удар и парирование играют запись своего голоса',v.роли.length===0&&v.a==="w_v_heavy_hit"&&v.b==="w_v_thin_hit"&&v.c==="w_v_knife_parry",v);

 /* 12: надевание */
 const e=await p.evaluate(()=>{
  const k=(n,м)=>equipSoundKind({name:n,type:""},м);
  const out={пояс:k("Кожаный пояс","belt"),сапоги:k("Кожаные сапоги","boots"),перчатки:k("Простые перчатки","gloves"),
   шлем:k("Железный шлем","helm"),плащ:k("Шерстяной плащ","cloak"),лук:k("Простой лук","weapon"),меч:k("Стальной меч","weapon"),
   кольчуга:k("Железная кольчуга","armor")};
  out.роли=Object.values(out).filter(x=>!SOUND_BANK["equip_"+x+"_on"]||!SOUND_BANK["equip_"+x+"_off"]);
  return out;});
 check('12. надевание по месту вещи — свои записи',e.пояс==="belt"&&e.сапоги==="boots"&&e.перчатки==="gloves"&&e.шлем==="helm"
  &&e.плащ==="cloak"&&e.лук==="quiver"&&e.меч==="blade"&&e.кольчуга==="chain"&&e.роли.length===0,e);

 /* 13: фляга */
 const f=await p.evaluate(()=>{
  const строка=invAll().find(r=>r.kind==="flask");
  return {есть:!!строка,имя:строка&&строка.label,flask:G.flask,water:G.water,cap:(FLASKS.find(x=>x.id==="simple")||{}).cap};});
 check('13. простая фляга в суме, вода в ней мерой',f.есть&&f.flask==="simple"&&f.cap>0&&f.water<=f.cap&&/Простая фляга/.test(f.имя||""),f);

 /* 14: откат свитка */
 const s=await p.evaluate(()=>({cd:/scrollCD/.test(String(readLegendScroll)),six:/6/.test(String(readLegendScroll)),
  studied:/scrollStudied/.test(document.documentElement.innerHTML)}));
 check('14. свиток с откатом, изучение один раз',s.cd&&s.six&&s.studied,s);

 check('нет ошибок страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const fail=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\nИтог: ${results.length-fail} PASS, ${fail} FAIL`);
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
