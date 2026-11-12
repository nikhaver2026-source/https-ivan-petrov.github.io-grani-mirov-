/* cap_selo.js URL — сбор новых фраз поселений для записи голосами (сервер-сборщик 8907).
   Слободы, дома, вещи, жители и дела руками принесли в игру сотни новых фраз; наборы проверок говорят лишь малую часть.
   Здесь герой обходит деревню, порт и именной город: план места, стук в каждую дверь днём и ночью, каждая вещь дома и
   двора, разговор с каждым жителем и его карточка, а затем каждое из дел — просьба, отказ без инструмента, подсказки,
   вся работа по шагам и сдача. Всё сказанное сборщик пишет в collect.txt; очередь записи строит gvqueue.py. */
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch();const p=await (await browser.newContext()).newPage();
 const errors=[];p.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1200);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.w=ms=>new Promise(z=>setTimeout(z,ms));
  window.закрыть=()=>{for(let i=0;i<8&&activeLayer();i++)closeTopUI();};
  window.__найти=(вид,именной)=>{const C=OLD_WORLD>>1;for(let rr=1;rr<400;rr++)for(let dy=-rr;dy<=rr;dy++)for(let dx=-rr;dx<=rr;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;
   const c=safeFn(()=>cellContent(C+dx,C+dy),null);if(!c||!c.structure||c.structure.type!==вид)continue;
   if(именной!=null&&!!safeFn(()=>cityAt(C+dx,C+dy),null)!==именной)continue;return {x:C+dx,y:C+dy,c};}return null;};
  window.__на=(x,y)=>{G.place.x=x;G.place.y=y;};});
 const итог=[];
 const какие=(process.argv[3]||"village,port,castle,burg").split(",");
 for(const [вид,именной] of [["village",null],["port",null],["castle",true],["burg",null]].filter(z=>какие.includes(z[0]))){
  const r=await p.evaluate(async([вид,именной])=>{const r={вид,дел:0,сдано:0,вещей:0,жителей:0,ошибки:[]};
   const В=__найти(вид,именной);if(!В)return Object.assign(r,{нет:true});
   G.place=null;G.x=В.x;G.y=В.y;G.hour=12;G.gold=5000;G.hp=Math.max(1,(G.hpMax||100)-20);
   enterPlace({x:В.x,y:В.y,structure:В.c.structure});await w(600);закрыть();let lvl=curLevel();
   const назад=async()=>{if(G.place)return;r.вылетов=(r.вылетов||0)+1;G.x=В.x;G.y=В.y;enterPlace({x:В.x,y:В.y,structure:В.c.structure});await w(500);закрыть();lvl=curLevel();};
   if(!lvl||!lvl.дома180)return Object.assign(r,{безСлободы:true});
   r.место=G.place.name;r.дворов=lvl.дома180.length;
   safeFn(()=>cityPlan());await w(500);закрыть();
   /* ── дома: стук, вещи, жители ── */
   const дома=lvl.дома180.slice(0,вид==="village"?20:12);
   for(const д of дома){try{await назад();
     const ул={x:д.дверь.x,y:д.дверь.y-д.s};__на(ул.x,ул.y);safeFn(()=>narrate(whereInCity(),{interrupt:true}));
     G.hour=12;safeFn(()=>Стук147.стук(д.n,false,()=>{},{жилой:true}));await w(1500);
     G.hour=23;safeFn(()=>Стук147.стук(д.n,false,()=>{},{жилой:true,отношение:0}));await w(1500);G.hour=12;
     for(const id of Object.keys(д.где||{}))for(const c of (д.где[id]||[]).slice(0,1)){__на(c.x,c.y);safeFn(()=>narrate(whereInCity(),{interrupt:false}));safeFn(()=>useHere());await w(120);закрыть();r.вещей++;}
     for(const k of д.люди){const q=lvl.люди180[k];if(!q||!q.где)continue;__на(q.где.x,q.где.y);safeFn(()=>talkInside("N",q.где.x,q.где.y));await w(250);закрыть();
      safeFn(()=>openNPC(q.key));await w(200);закрыть();r.жителей++;}
    }catch(e){r.ошибки.push("дом:"+String(e).slice(0,80));}}
   /* ── дела: каждое по разу ── */
   const люди=()=>Object.values(lvl.люди180).filter(q=>q&&q.где&&q.дом>=0);
   const всёДать=T=>{if(!Array.isArray(G.items))G.items=[];(T.инстр||[]).forEach(гр=>{if(!G.items.includes(гр[0]))G.items.push(гр[0]);});
    Object.entries(T.мат||{}).forEach(([k,v])=>{G.inv[k]=(Number(G.inv[k])||0)+v+2;});};
   for(const T of ДЕЛА180){try{
     await назад();Дела180.ст().список=[];Дела180.ст().люди={};let t=null,жит=null;
     /* сперва тот, кому дело к лицу (как назначает игра), иначе любой, у кого оно выходит */
     const подходит=q=>!!safeFn(()=>T.кто(q,lvl.дома180[q.дом],lvl),false);
     for(const q of люди().filter(подходит).concat(люди().filter(q=>!подходит(q)))){t=safeFn(()=>Дела180.создать(q,lvl,T),null);if(t){жит=q;if(!подходит(q))r.нелицо=(r.нелицо||0)+1;break;}}
     if(!t)continue;r.дел++;
     /* просьба — как говорит её игра; без инструмента — что нужно */
     const было=G.items.slice();G.items=G.items.filter(x=>!(T.инстр||[]).some(гр=>гр.includes(x)));
     const нет=Дела180.нетИнстр(T),мат=Дела180.нетМат(T);const нужно=[].concat((T.инстр||[]).map(гр=>гр.join(" или ").toLowerCase()),Object.entries(T.мат||{}).map(([k,v])=>`${k} ×${v}`));
     narrate(`${жит.имя}, ${String(жит.prof).toLowerCase()}: ${t.текст}. Дело: «${T.n}».${нужно.length?` Нужно: ${нужно.join(", ")}${нет.length||мат.length?` — не хватает: ${нет.concat(мат).join(", ")}; инструмент — у лавочника или в «Крафте»`:" — всё при вас"}.`:""} Награда — золото, опыт и доброе слово по всему ${t.кл==="деревня"?"селу":"городу"}.`,{interrupt:true});await w(150);
     Дела180._ждёт=t;Дела180.взять();await w(150);закрыть();
     safeFn(()=>Дела180.маяк(t.id));await w(150);закрыть();
     /* первая попытка работы без инструмента — отказ */
     let c=safeFn(()=>Дела180.цель(t),null);if(c&&G.place){__на(c.x,c.y);safeFn(()=>useHere());await w(120);закрыть();}
     G.items=было;всёДать(T);
     safeFn(()=>Дела180.состояние(t.id));await w(120);закрыть();
     for(let шаг=0;шаг<70&&!t.сдано&&!t.брошено;шаг++){const z=t.стадии[t.i];
      if(z&&z.вид==="принести")G.inv[z.ресурс]=(Number(G.inv[z.ресурс])||0)+z.сколько;
      if(z&&z.вид==="стеречь")G.hour=22;
      if(z&&z.ждать){t.ждатьС=-1e9;}
      if(!G.place){r.ошибки.push(T.id+":вылет на шаге "+шаг+" ("+(z&&z.вид)+")");break;}
      c=safeFn(()=>Дела180.цель(t),null);if(!c)break;__на(c.x,c.y);
      if(!z||z.вид==="отдать"||z.вид==="принести")safeFn(()=>talkInside("N",c.x,c.y));else safeFn(()=>useHere());
      await w(90);закрыть();
      if(шаг%6===5)safeFn(()=>narrate(Дела180.подсказка(t),{interrupt:false}));}
     G.hour=12;if(t.сдано)r.сдано++;
     /* дело брошено — тоже фраза */
     if(!t.сдано){safeFn(()=>Дела180.бросить(t.id));await w(100);}
    }catch(e){r.ошибки.push(T.id+":"+String(e).slice(0,80));}}
   /* ── доска дел, список заданий, выход ── */
   await назад();Дела180.ст().список=[];Дела180.ст().люди={};
   safeFn(()=>Дела180.доска(lvl,G.place.name));await w(600);закрыть();
   const первый=люди()[0];if(первый){safeFn(()=>Дела180.предложить(первый.key));await w(300);if(curEvent&&curEvent.choices)safeFn(()=>resolveEvent(1));await w(200);закрыть();
    safeFn(()=>Дела180.предложить(первый.key));await w(300);if(curEvent&&curEvent.choices)safeFn(()=>resolveEvent(0));await w(200);закрыть();
    safeFn(()=>Дела180.предложить(первый.key));await w(300);закрыть();safeFn(()=>renderQuests());await w(300);закрыть();}
   safeFn(()=>leavePlace());await w(700);закрыть();G.place=null;
   return r;},[вид,именной]);
  итог.push(r);await p.waitForTimeout(3500);}
 console.log(JSON.stringify(итог));console.log("ошибок страницы:",errors.length,errors.slice(0,3).join(" | "));
 await browser.close();
})();
