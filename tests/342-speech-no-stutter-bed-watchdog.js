/* ═══════════════════════════════════════════════════════════════════════
   342 — РЕЧЬ НЕ ЗАИКАЕТСЯ, ФОН НЕ ОСТАЁТСЯ ОТ ПРЕЖНЕГО МЕСТА (22 октября)
   Просьба игрока: «чтобы вся речь обрабатывалась единым обработчиком речи,
   чтобы нигде ничего не затыкалось, не заикалось… чтобы фоны разных
   локаций работали как надо и не отваливались».
   Проверяется:
   1. Длинное описание места, повторённое через 1,4 с (герой топчется у
      лестницы), не начинается заново; через 7 с — звучит.
   2. Короткое «Стена на севере.» — окно прежнее: через 1,3 с звучит снова.
   3. Бой и запрос игрока не снимаются: повторный удар с тем же текстом —
      новое событие, повтор по просьбе игрока — его право.
   4. Сторож фона: перенос из яруса наверх без выхода из места — фон и
      живой слой яруса сменяются фоном поверхности.
   5. Сторож не вмешивается в бой.
   6. В бою на лестнице «действие здесь» не заводит марш лестницы с начала
      на каждое нажатие, а говорит, что сначала надо отбиться; отказ самой
      шахты (у дна — «Глубже хода нет») звучит и в бою, как прежде.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];const ctx=await browser.newContext();
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{window.__gvAuto=true;window.__tts=[];
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.GraniTTS={speak(t,r,v,id){window.__tts.push(String(t));setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),40);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{enterGame();while(activeLayer())closeTopUI();G.tutorDone=1;window.maybeEvent=()=>{};});

 /* время речи — своё: Date.now сдвигается вручную */
 const речь=await p.evaluate(()=>{const t0=Date.now();let dt=0;const d0=Date.now;Date.now=()=>t0+dt;
  const L="Под ногами пусто. Рядом: лестница вверх на северо-востоке, два шага, и завал на западе.";
  const ст=(t,o)=>{const m=Speech.enqueue(t,Object.assign({interrupt:true},o));return m&&m.state;};
  const r={};
  r.первая=ст(L,{cat:"desc"});dt=1400;r.через14=ст(L,{cat:"desc"});dt=2800;r.через28=ст(L,{cat:"desc"});dt=7200;r.через72=ст(L,{cat:"desc"});
  dt=20000;r.стена1=ст("Стена на севере.",{cat:"desc"});dt=21300;r.стена2=ст("Стена на севере.",{cat:"desc"});
  dt=40000;const Б="Волк кусает вас: минус пять здоровья, осталось сорок.";r.бой1=ст(Б,{cat:"combat"});dt=41400;r.бой2=ст(Б,{cat:"combat"});
  dt=60000;r.игрок1=ст(L,{cat:"desc",user:true});dt=61400;r.игрок2=ст(L,{cat:"desc",user:true});
  Date.now=d0;return r;});
 check('1. длинное описание через 1,4 и 2,8 с не начинается заново',речь.через14==="DEDUPED"&&речь.через28==="DEDUPED"&&речь.первая!=="DEDUPED",речь);
 check('1. через 7 с то же описание звучит',речь.через72!=="DEDUPED",речь);
 check('2. короткое «Стена на севере.» через 1,3 с звучит снова (окно прежнее)',речь.стена2!=="DEDUPED"&&речь.стена1!=="DEDUPED",речь);
 check('3. повторный удар в бою с тем же текстом не снимается',речь.бой2!=="DEDUPED",речь);
 check('3. повтор по просьбе игрока не снимается',речь.игрок2!=="DEDUPED",речь);

 /* сторож фона: в ярусе, затем перенос наверх без выхода из места */
 const фон=await p.evaluate(()=>{let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1400&&!c;y+=41){const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")c={x,y};}
  G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();if(G.inCombat){G.inCombat=false;G.combat=null;}
  const роль=()=>{const r=Bank.loops.get("place");return r&&r.role;};
  const внизу={место:роль(),глуб:G.place&&G.place.depth,роль:bankAmbientRole()};
  const счёт0=ФонСтраж.счёт;
  G.place=null;G.x=c.x+3;G.y=c.y+3;safeFn(()=>refresh());
  const наверху={место:роль(),ожидалось:bankAmbientRole(),счёт:ФонСтраж.счёт-счёт0,было:ФонСтраж.было};
  return {внизу,наверху};});
 check('4. в ярусе звучит фон яруса',фон.внизу.место&&фон.внизу.место===фон.внизу.роль,фон.внизу);
 check('4. после переноса наверх фон — поверхности, а не яруса',фон.наверху.место===фон.наверху.ожидалось&&фон.наверху.место!==фон.внизу.место&&фон.наверху.счёт>=1,фон.наверху);

 const бой=await p.evaluate(()=>{const п0=ФонСтраж.подпись;G.inCombat=true;G.place={kind:"dungeon",name:"проба",bx:1,by:1,depth:2};
  const r=ФонСтраж.проверить("проба");G.inCombat=false;G.place=null;ФонСтраж.подпись=п0;return {r};});
 check('5. в бою сторож фона не вмешивается',бой.r===false,бой);

 /* 6. в бою на лестнице «действие здесь» не заводит марш, а говорит, что сначала — отбиться */
 const лест=await p.evaluate(()=>{let c=null;for(let x=1000;x<60000&&!c;x+=37)for(let y=1000;y<1400&&!c;y+=41){const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")c={x,y};}
  G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));while(activeLayer())closeTopUI();if(G.inCombat){safeFn(()=>endCombat());}
  const на=tileAt(curLevel(),G.place.x,G.place.y);G.flight=null;window.__said=[];if(!Speech.__said0){Speech.__said0=Speech.say.bind(Speech);Speech.say=function(t,o){window.__said.push(String(t));return Speech.__said0(t,o);};}
  const m=Object.assign({},MONSTERS.find(z=>z.id==="goblin")||MONSTERS[0],{hp:300,dmg:1,lvl:1,xp:5,gold:1});safeFn(()=>startCombat({x:G.x,y:G.y,monster:m}));
  return {на,бой:!!G.inCombat};});
 for(let i=0;i<3;i++){await p.keyboard.press("Enter");await p.waitForTimeout(400);}
 /* сказанное проверяется целиком: под нагрузкой после ответа успевает прозвучать длинный рассказ, и хвост строки его вытесняет */
 const лест2=await p.evaluate(()=>({бой:!!G.inCombat,марш:!!G.flight,отбиться:window.__said.some(t=>/В бою по лестнице не уйти/.test(t)),
  маршСказан:window.__said.some(t=>/Марш лестницы/.test(t)),сказано:window.__said.join(" | ").slice(-300)}));
 check('6. в бою на лестнице марш не начинается и сказано, что сначала — отбиться',лест.на==="<"&&лест.бой&&!лест2.марш&&лест2.отбиться&&!лест2.маршСказан,{лест,лест2});

 /* 6б. (23 октября) отказ самой шахты в бою звучит, как прежде: у дна — «Глубже хода нет», а не «в бою не уйти» */
 const дно=await p.evaluate(()=>{const pl=G.place;const было=window.maxDepthHere;window.maxDepthHere=()=>pl.depth;
  const бой0=G.inCombat;G.inCombat=true;G.flight=null;window.__said=[];const r=startFlight(1,"N");
  window.maxDepthHere=было;G.inCombat=бой0;return {r,марш:!!G.flight,сказано:window.__said.join(" | ").slice(-300)};});
 check('6б. в бою у дна шахты сказано «Глубже хода нет», а не про бой',дно.r===false&&!дно.марш&&/Глубже хода нет|Дно/.test(дно.сказано)&&!/В бою по лестнице/.test(дно.сказано),дно);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
