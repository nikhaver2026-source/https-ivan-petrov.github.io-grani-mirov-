const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await b.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);
 const out=await page.evaluate(()=>{
  const bad=[];const push=(что,где,деталь)=>bad.push({что,где,деталь:String(деталь)});
  const R={};
  const godIds=new Set(PANTHEON.map(g=>g.id));
  const clanNames=new Set(CLANS), raceNames=new Set(ALL_RACE_NAMES);
  const empNames=new Set(EMPIRES.map(e=>e.name)), empShort=new Set(EMPIRES.map(e=>e.short));
  const terrainKeys=new Set(Object.keys(RESBYT).concat(["coast","swamp","sea"]));
  const soundKeys=new Set(Object.keys(SOUNDS));
  const bankRoles=new Set(Object.keys(SOUND_BANK));
  R.боги=PANTHEON.length;R.кланы=CLANS.length;R.народы=ALL_RACE_NAMES.length;
  R.державы=EMPIRES.length;R.чудовища=MONSTERS.length;R.события=EVENTS.length;
  R.сцен=soundKeys.size;R.ролейБанка=bankRoles.size;

  // ── боги: соперники и взаимность ──
  PANTHEON.forEach(g=>{
   if(!godIds.has(g.rival))push("соперник бога не существует",g.n,g.rival);
   const r=GOD_BY_ID[g.rival];
   if(r&&r.rival!==g.id)push("соперничество не взаимно",g.n+" ("+g.id+")",`${g.id}→${g.rival}, а ${r.id}→${r.rival}`);
   if(!clanNames.has(g.clan))push("клан бога не найден",g.n,g.clan);
  });

  // ── кланы ──
  CLAN_DB.forEach(c=>{
   if(!godIds.has(c.god))push("бог клана не существует",c.n,c.god);
   if(!raceNames.has(c.race))push("народ клана не существует",c.n,c.race);
   if(c.foe&&clanNames.has(c.foe)===false&&!/^нет/i.test(c.foe))push("враг клана не найден",c.n,c.foe);
   if(c.foe===c.n)push("клан враждует сам с собой",c.n,c.foe);
  });

  // ── народы ──
  RACES_DB.forEach(r=>{
   if(!godIds.has(r.god))push("бог народа не существует",r.n,r.god);
   if(!clanNames.has(r.clan))push("клан народа не найден",r.n,r.clan);
   if(!empNames.has(r.emp)&&!empShort.has(r.emp)&&!/вне держав/i.test(r.emp))
    push("держава народа не найдена",r.n,r.emp);
   (r.home||[]).forEach(t=>{if(!terrainKeys.has(t))push("народ живёт в несуществующей местности",r.n,t);});
   (r.res||[]).forEach(x=>{if(!LAND_RES.includes(x))push("народ собирает несобираемый ресурс",r.n,x);});
   if(r.rank===undefined||r.rank<0||r.rank>4)push("странный ранг народа",r.n,r.rank);
  });

  // ── державы ──
  EMPIRES.forEach(e=>{
   if(!godIds.has(e.god))push("бог державы не существует",e.name,e.god);
   if(!raceNames.has(e.race))push("правящий народ державы не существует",e.name,e.race);
   (e.races||[]).forEach(n=>{if(!raceNames.has(n))push("народ державы не существует",e.name,n);});
   (e.terrains||[]).forEach(t=>{if(!terrainKeys.has(t))push("местность державы не существует",e.name,t);});
   (e.exports||[]).concat(e.imports||[]).forEach(x=>{
    if(!LAND_RES.includes(x))push("держава торгует несуществующим ресурсом",e.name,x);});
   const общ=(e.exports||[]).filter(x=>(e.imports||[]).includes(x));
   if(общ.length)push("держава и вывозит, и ввозит одно и то же",e.name,общ.join(", "));
   // правящий народ должен числиться среди народов державы
   if(e.race&&e.races&&!e.races.includes(e.race))push("правящего народа нет в списке народов державы",e.name,e.race);
  });
  // народ считает державу своей — а держава его своим?
  RACES_DB.forEach(r=>{
   if(/вне держав/i.test(r.emp||""))return;
   const e=EMPIRES.find(x=>x.name===r.emp||x.short===r.emp);
   if(e&&!(e.races||[]).includes(r.n))push("народ числит себя в державе, а держава его не знает",r.n,r.emp);
  });

  // ── чудовища ──
  const mid=new Set();
  MONSTERS.forEach(m=>{
   if(mid.has(m.id))push("два чудовища с одним ключом",m.n,m.id);
   mid.add(m.id);
   if(m.min>m.max)push("нижний уровень чудовища выше верхнего",m.n,m.min+">"+m.max);
   (m.biomes||[]).forEach(t=>{if(!terrainKeys.has(t))push("чудовище водится в несуществующей местности",m.n,t);});
   if(!soundKeys.has(m.snd))push("у чудовища нет звуковой сцены для «Прослушать»",m.n,m.snd);
  });

  // ── события ──
  const eid=new Set();
  EVENTS.forEach(e=>{
   if(eid.has(e.id))push("два события с одним ключом",e.id,"");
   eid.add(e.id);
   if(e.snd&&!bankRoles.has(e.snd))push("у события нет такой роли звука",e.id,e.snd);
   try{const ch=e.choices(eventContext());
    if(!ch||!ch.length)push("событие без единого выбора",e.id,"");
    (ch||[]).forEach((c,i)=>{if(!c.l)push("выбор без подписи",e.id,i);
     if(typeof c.run!=="function")push("выбор без действия",e.id,c.l||i);});
   }catch(err){push("выборы события падают",e.id,err.message);}
  });

  // ── цепочки заданий: шаги строятся и осмысленны ──
  const ctx0={god:PANTHEON[0],tier:1,race:"Люди",clan:CLANS[0],emp:EMPIRES[0],
   npc:{race:"Люди",prof:"Жрец",key:"k"},city:null};
  Object.entries(CHAIN_DB).forEach(([k,ch])=>{
   if(!ch.n)push("у цепочки нет имени",k,"");
   (ch.steps||[]).forEach((mk,i)=>{
    if(typeof mk!=="function"){push("шаг цепочки не функция",k,i);return;}
    let st;try{st=mk(ctx0);}catch(err){push("шаг цепочки падает",k,i+": "+err.message);return;}
    if(!st||!st.text)push("шаг цепочки без текста",k,i);
    if(!st.type)push("шаг цепочки без типа",k,i);
    if(!st.reward||(!st.reward.gold&&!st.reward.xp))push("шаг цепочки без награды",k,i);
    if(st.type==="fetch"&&!LAND_RES.includes(st.res))push("шаг просит несобираемый ресурс",k,st.res);
    if(st.need!==undefined&&(st.need<=0||st.need>20))push("странное количество в шаге",k,i+": "+st.need);
   });
  });

  // ── звуковые сцены: у каждой имя, описание и построение ──
  Object.entries(SOUNDS).forEach(([k,s])=>{
   ["name","icon","desc"].forEach(f=>{if(!s[f])push("у звуковой сцены нет поля",k,f);});
   if(typeof s.build!=="function")push("у звуковой сцены нет построения",k,"");
   if(!s.dur||s.dur<=0)push("у звуковой сцены нет длительности",k,s.dur);
  });

  // ── банк: описания и файлы ──
  Object.entries(SOUND_BANK).forEach(([k,e])=>{
   if(!e.d)push("роль банка без описания",k,"");
   if(!e.f||!e.f.length)push("роль банка без файлов",k,"");
  });

  // ── заклинания ──
  SPELLS.forEach(s=>{if(!s.n||s.cost===undefined)push("у заклинания пустое поле",s.n||"?","n/cost");});

  return {R,нарушений:bad.length,bad};
 });
 console.log(JSON.stringify(out,null,1));
 console.log("ошибки страницы:",errs.slice(0,3));
 await b.close();})();
