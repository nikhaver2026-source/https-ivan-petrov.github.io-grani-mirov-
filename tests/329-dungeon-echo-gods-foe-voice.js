/* ════════════════════════════════════════════════════════════════════════
   НАБОР 329: ЭХО ПОДЗЕМЕЛИЙ, ГОЛОС БОГОВ С НЕБА, ГОЛОС ТВАРИ ГРОМЧЕ И В
   СВОЙ ЧЕРЁД (после 16.0)

   1. Под землёй короткий звук банка (дверь, рычаг, удар) идёт каналом
      единой звуковой среды в отклик яруса; наверху, в поле, — простым
      плеером, как прежде.
   2. Слово бога и голос стихии идут в небесный отклик — где бы ни стоял
      герой, и в поле тоже.
   3. Слово духа в бою громче прежнего по меньшей мере в полтора раза.
   4. Тварь не говорит поверх героя: её слово начинается после реплики
      героя; реплика героя посреди слова твари ждёт его конца.
   5. Ошибок страницы нет.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,900):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};settings.effects=1;G.hour=12;try{Speech.primed=true;}catch(_){}
  AE.ensure();Room.ensure();
  window.__игр=[];const i0=ЗвукСреда.играть;ЗвукСреда.играть=function(url,о){const h=i0.apply(this,arguments);__игр.push({url:String(url),t:Date.now(),к:h&&h.канал});return h;};
  window.__канал=(часть)=>{const z=__игр.filter(x=>x.url.indexOf(часть)>=0).slice(-1)[0];if(!z||!z.к)return null;const к=z.к;
   return {t:z.t,wet:Math.round(к.wet.gain.value*100)/100,g:Math.round(к.g.gain.value*1000)/1000,вЗал:к.wetTo===Room.conv,вНебо:!!Небо165._c&&к.wetTo===Небо165._c};};});

 /* ── 1. Эхо под землёй ── */
 const э=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};
  G.place=null;G.ship=null;Room.set();await w(300);
  const n0=__игр.length;const el0=Bank.play("deep_stone",{gain:0.6,maxSec:2});o.поле={плеер:!!el0,каналом:__игр.length>n0};
  const c=(()=>{for(let x=1000;x<60000;x+=37)for(let y=1000;y<1400;y+=41){const cc=cellContent(x,y);if(cc.structure&&PLACE_KIND[cc.structure.type]==="dungeon")return {x,y,cc};}})();
  G.x=c.x;G.y=c.y;enterPlace(c.cc);await w(500);while(activeLayer())closeTopUI();Room.set();await w(300);
  const n1=__игр.length;const el1=Bank.play("deep_stone",{gain:0.6,maxSec:2});const f=__игр.slice(n1).find(x=>/deep_stone|deep\//.test(x.url))||__игр[n1];
  o.подземелье={плеер:!!el1,каналом:__игр.length>n1,канал:f&&f.к?{wet:Math.round(f.к.wet.gain.value*100)/100,вЗал:f.к.wetTo===Room.conv}:null,комната:Room.ak||Room.kind,отзвук:Math.round(Room.wet.gain.value*100)/100};
  return o;});
 check("1. Под землёй звук банка — каналом среды в отклик яруса; в поле — простым плеером",
  э.поле.плеер&&!э.поле.каналом&&э.подземелье.плеер&&э.подземелье.каналом&&э.подземелье.канал&&э.подземелье.канал.вЗал&&э.подземелье.канал.wet>=0.5&&э.подземелье.отзвук>0.2,э);

 /* ── 2. Боги ── */
 const б=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};
  while(G.place)leavePlace();while(activeLayer())closeTopUI();Room.set();await w(300);
  try{Speech.interrupt(1);}catch(_){}Folk.очередь.length=0;Folk.звучитДо=0;Folk.занятоДо=0;
  const id=Object.keys(GOD_SPEECH).find(g=>GOD_SPEECH_LEN["god_"+g+"_altar1"+VOICE_GEN]);o.бог=id;
  godSpeak(id,"altar1",{delay:0});await w(1500);o.слово=__канал("voice_god/");
  godVoice("storm",{gain:0.7,maxSec:3});await w(200);const roles=(SOUND_BANK[GOD_SOUND.storm]||{}).f||[];
  o.стихия=roles.map(f=>__канал(f.split("/").pop())).find(Boolean)||null;
  o.поле=Room.ak||Room.kind;return o;});
 check("2. Слово бога и голос стихии — в небесном отклике, и в поле тоже",
  !!б.слово&&б.слово.вНебо&&б.слово.wet>=0.8&&!!б.стихия&&б.стихия.вНебо,б);

 /* ── 3–4. Тварь: громче и в свой черёд ── */
 const т=await p.evaluate(async()=>{const w=ms=>new Promise(z=>setTimeout(z,ms));const o={};
  try{Speech.interrupt(1);}catch(_){}Folk.очередь.length=0;Folk.геройДо=0;Голос165.тварьДо=0;
  const роль=Object.keys(VOICE_NPC).find(k=>/^foe_spirit_/.test(k)&&Object.keys(VOICE_NPC[k]).length);const строка=Object.keys(VOICE_NPC[роль])[0];
  const файл=VOICE_NPC[роль][строка][0];o.роль=роль;
  const где={x:G.x,y:G.y-1};
  /* прежняя громкость: та же строка мимо обёртки рода */
  Folk.сказать(Folk.вариант(VOICE_NPC[роль][строка],0,false)+VOICE_GEN,где,{dir:VOICE_NPC_DIR,всегда:true,фон:true,чётко:true,maxSec:8,ждал165:1});await w(60);
  o.прежде=__канал(файл);await w(Math.round(Folk.длина(Folk.вариант(VOICE_NPC[роль][строка],0,false)+VOICE_GEN)*1000)+300);
  Голос165.тварьДо=0;Folk.реплика(роль,строка,где,false,{всегда:true,фон:true,чётко:true,голос:0,maxSec:8});await w(60);o.теперь=__канал(файл);
  await w(Math.round(Folk.длина(Folk.вариант(VOICE_NPC[роль][строка],0,false)+VOICE_GEN)*1000)+300);
  /* очередь: сперва герой, тварь — после */
  const герой=Object.keys(HERO_VOICE_LEN).find(k=>/^hero_/.test(k)&&HERO_VOICE_LEN[k]>1.2);o.герой=герой;
  Голос165.тварьДо=0;Folk.геройДо=0;const t0=Date.now();
  Folk.сказать(герой,null,{dir:HERO_VOICE_DIR,всегда:true});await w(50);
  Folk.реплика(роль,строка,где,false,{всегда:true,фон:true,чётко:true,голос:0,maxSec:8});
  await w(Math.round(HERO_VOICE_LEN[герой]*1000)+900);
  const h=__игр.filter(x=>x.url.indexOf(герой)>=0).slice(-1)[0],f=__игр.filter(x=>x.url.indexOf(файл)>=0).slice(-1)[0];
  o.геройНачал=h?h.t-t0:null;o.тварьНачала=f?f.t-t0:null;o.длинаГероя=Math.round(HERO_VOICE_LEN[герой]*1000);
  /* и наоборот: тварь говорит — реплика героя ждёт */
  await w(500);Голос165.тварьДо=0;Folk.геройДо=0;const t1=Date.now();
  Folk.реплика(роль,строка,где,false,{всегда:true,фон:true,чётко:true,голос:0,maxSec:8});await w(50);
  Folk.сказать(герой,null,{dir:HERO_VOICE_DIR,всегда:true});
  const длТвари=Math.round(Folk.длина(Folk.вариант(VOICE_NPC[роль][строка],0,false)+VOICE_GEN)*1000);
  await w(Math.min(3500,длТвари)+900);
  const f2=__игр.filter(x=>x.url.indexOf(файл)>=0).slice(-1)[0],h2=__игр.filter(x=>x.url.indexOf(герой)>=0).slice(-1)[0];
  o.тварь2=f2?f2.t-t1:null;o.герой2=h2?h2.t-t1:null;o.длинаТвари=длТвари;
  return o;});
 check("3. Слово духа в бою громче прежнего не меньше чем в полтора раза",
  !!т.прежде&&!!т.теперь&&т.теперь.g>=т.прежде.g*1.45,{прежде:т.прежде,теперь:т.теперь,роль:т.роль});
 check("4. Тварь и герой — по очереди: слово твари после реплики героя, реплика героя — после слова твари",
  т.геройНачал!=null&&т.тварьНачала!=null&&т.тварьНачала>=т.длинаГероя-100&&т.тварь2!=null&&т.герой2!=null&&т.герой2>=Math.min(3500,т.длинаТвари)-150,т);

 check("5. Ошибок страницы нет",errors.length===0,errors.slice(0,5));
 console.log(results.join("\n"));
 const failed=results.filter(r=>r.startsWith("FAIL")).length;console.log(`\n${results.length-failed}/${results.length} пройдено`);
 await browser.close();process.exit(failed?1:0);
})();
