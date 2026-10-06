/* 9.5.4, просьбы игрока:
   1. Ниже третьего яруса заиграла «музыка, которой там быть не должно»:
      четвёртый ярус звучал «подводной» петлёй stk_deepsea — почти три минуты
      ритма и гармонии — и каналом фона, мимо выключенной музыки. Под землёй
      фон теперь — только гул, сквозняк и бездна; вход в игру из сохранения
      берёт тему по месту, а не по местности наверху.
   2. Встреча на дороге и нападение в тот же миг: окно встречи оставалось
      открытым поверх боя, её рассказ шёл первым, жесты уходили в окно.
      Теперь бой первичен: окно закрывается без слов, речь встречи
      обрывается, сама встреча ждёт и предлагается после боя; гибель её
      отменяет. */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.__tts=[];
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();settings.fastTap=0;while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};});

 /* ── 1. фон глубины ── */
 const глубь=await p.evaluate(()=>{
  const было=G.place;const роли=[];
  for(let d=1;d<=12;d++){G.place={kind:"dungeon",bx:G.x,by:G.y,stype:"ruins",name:"т",depth:d,x:1,y:1};роли.push(bankAmbientRole());}
  G.place=было;
  const src=String(enterGame);
  return {роли,нетПодводной:!DEPTH_LOOP.includes("stk_deepsea")&&роли.every(r=>r!=="stk_deepsea"),
   вход:/Music\.start\(locationMusicKey\(\)\)/.test(src)&&!/Music\.start\(c\.terrain\[0\]\)/.test(src)};});
 check('1. под землёй нет «подводной» петли, звучавшей музыкой: на всех ярусах гул, сквозняк и бездна',глубь.нетПодводной,глубь.роли);
 check('1б. вход в игру из сохранения берёт тему по месту героя',глубь.вход);

 /* ── 2. бой прежде встречи ── */
 const ev=await p.evaluate(async()=>{
  const пауза=ms=>new Promise(z=>setTimeout(z,ms));
  const r={};
  const c=eventContext();const e=EVENTS.find(x=>{try{return x.ok(c);}catch(_){return false;}});
  r.встреча=e&&e.id;
  openEvent(e,c);await пауза(200);
  r.окноДо=activeLayer()&&activeLayer().id;
  window.__tts.length=0;
  const m=Object.assign({},MONSTERS.find(x=>x.hp>10&&x.hp<60)||MONSTERS[0]);
  startCombat({x:G.x,y:G.y,monster:m});
  await пауза(300);
  r.слойВБою=activeLayer()?activeLayer().id:null;
  r.ждёт=!!EventHold.ждёт;r.curEvent=!!curEvent;
  r.сказаноВБою=window.__tts.slice();
  /* победа: встреча возвращается, когда добыча разобрана */
  G.hp=G.hpMax||30;if(G.combat)G.combat.hp=0;try{victory();}catch(err){r.ошибка=String(err);}
  await пауза(300);while(activeLayer())closeTopUI();window.__tts.length=0;
  await пауза(4500);
  r.после={слой:activeLayer()&&activeLayer().id,curEvent:!!curEvent,слово:window.__tts.find(t=>/Бой позади/.test(t))||""};
  while(activeLayer())closeTopUI();curEvent=null;
  /* гибель отменяет встречу */
  openEvent(e,c);await пауза(100);
  startCombat({x:G.x,y:G.y,monster:Object.assign({},m)});
  const ждалаДо=!!EventHold.ждёт;
  try{defeat();}catch(err){}
  await пауза(5000);
  r.гибель={ждалаДо,ждётПосле:!!EventHold.ждёт,окно:!!(document.getElementById("modal-event")&&!document.getElementById("modal-event").hidden)};
  return r;});
 check('2. бой закрывает окно встречи: жесты идут в бой, встреча ждёт',
  ev.окноДо==="modal-event"&&ev.слойВБою!=="modal-event"&&ev.ждёт&&!ev.curEvent,ev);
 check('2б. окно закрыто без лишних слов: «закрыто» не звучит, бой назван',
  !ev.сказаноВБою.some(t=>/Событие» закрыто/.test(t))&&ev.сказаноВБою.some(t=>/^Бой/.test(t)),ev.сказаноВБою);
 check('2в. после боя встреча предлагается снова, со словом «Бой позади»',
  ev.после.слой==="modal-event"&&ev.после.curEvent&&!!ev.после.слово,ev.после);
 check('2г. гибель героя встречу отменяет',ev.гибель.ждалаДо&&!ev.гибель.ждётПосле&&!ev.гибель.окно,ev.гибель);

 check('ошибок на странице нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
