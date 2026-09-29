/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 208: ЗЕЛЬЯ ЗДОРОВЬЯ И ТРЕБОВАНИЯ ВЕЩЕЙ

   Жалобы игрока (4.3):
   — купленное у торговца зелье здоровья лежит не в зельях, и выпить его
     нельзя (еду съесть можно);
   — вещь с требованием выше характеристики героя надевается без спроса.

   1. Купленное зелье здоровья — в разделе «Зелья», у него есть «Выпить»,
      выпитое лечит и убывает; еда остаётся в расходниках.
   2. В бою «зелье» тратит настоящее зелье здоровья из сумки.
   3. У вещи своя характеристика: латы и тяжёлое оружие — сила, лук и
      перчатки — ловкость, кольцо, браслет, посох — разум.
   4. Не хватает единицы — надевается (с оговоркой); больше — отказ словом
      и звуком, вещь остаётся в сумке; то же с оружием в руку.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(500);
 await page.evaluate(()=>{window.SAID=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){SAID.push(String(t));return s0(t,o);};
  window.PLAYED=[];const p0=Bank.play.bind(Bank);Bank.play=function(r,o){PLAYED.push(r);return p0(r,o);};
  window.maybeEvent=()=>{};settings.effects=1;G.inCombat=false;G.combat=null;});

 /* ── 1–2. зелья ── */
 const зелье=await page.evaluate(()=>{
  const r={};
  const n=getNPC(500,500,0,"Торговец");G.gold=500;G.inv={};G.items=[];
  const st=stockFor(n);const iP=st.findIndex(x=>x.n==="Зелье здоровья"),iF=st.findIndex(x=>x.n==="Еда в дорогу");
  buyItem(n.key,iP);buyItem(n.key,iP);buyItem(n.key,iF);
  const rows=invAll();const pr=rows.find(x=>x.name==="Зелье здоровья"),fr=rows.find(x=>x.name==="Еда в дорогу");
  r.раздел=pr&&pr.раздел;r.род=pr&&pr.cat;r.еда=fr&&fr.раздел;
  r.действия=pr?invActionList(pr.kind,pr.key).map(a=>a.id):[];
  G.hpMax=100;G.hp=50;
  r.выпито=invDo("drink",pr.kind,pr.key);
  r.hp=G.hp;r.осталось=Number(G.inv["Зелье здоровья"])||0;
  /* бой */
  G.hp=40;G.water=0;
  const m=MONSTERS.find(x=>/wolf/.test(x.id))||MONSTERS[0];
  const cb={m,hp:30,maxHp:30,log:[]};G.combat=cb;G.inCombat=true;
  const лог=[];const cl0=window.cbLog;window.cbLog=t=>{лог.push(String(t));try{return cl0(t);}catch(_){}};
  try{fight("potion");}catch(e){r.ошибкаБоя=String(e);}
  window.cbLog=cl0;
  r.бойЛог=лог.slice(0,3);r.бойОсталось=Number(G.inv["Зелье здоровья"])||0;
  G.combat=null;G.inCombat=false;
  return r;});
 check('1. купленное зелье здоровья — в разделе «Зелья», его можно выпить, оно лечит и убывает; еда — в расходниках',
  зелье.раздел==="potion"&&зелье.род==="potion"&&зелье.еда==="consumable"&&зелье.действия.includes("drink")&&зелье.hp===65&&зелье.осталось===1,зелье);
 check('2. в бою «зелье» тратит зелье здоровья из сумки, а не воду',зелье.бойОсталось===0&&зелье.бойЛог.some(t=>/Зелье здоровья: \+15/.test(t)),зелье);

 /* ── 3–4. требования ── */
 const вещи=await page.evaluate(()=>{
  const r={};
  const лат={name:"Стальные латы",type:"Латы",slot:"armor",val:8,rank:2,qual:0};      /* 6+6 = 12 */
  const лук={name:"Ясеневый лук",type:"Лук",slot:"weapon",val:6,rank:1,qual:0};
  const кольцо={name:"Серебряное кольцо",type:"Кольцо",slot:"acc",val:2,rank:1,qual:0};
  const браслет={name:"Браслет стража",type:"Браслет",slot:"acc",val:2,rank:2,qual:0};  /* разум 12 */
  const посох={name:"Дубовый посох",type:"Посох",slot:"weapon",val:5,rank:0,qual:0};
  const перч={name:"Кожаные перчатки",type:"Перчатки",slot:"acc",val:1,rank:0,qual:0};
  r.род={латы:itemReq(лат).stat,лук:itemReq(лук).stat,кольцо:itemReq(кольцо).stat,браслет:itemReq(браслет).stat,посох:itemReq(посох).stat,перчатки:itemReq(перч).stat};
  r.браслетN=itemReq(браслет).n;
  const надеть=(w)=>{G.gear.push(w);SAID.length=0;PLAYED.length=0;const row=invAll().find(x=>x.kind==="gear"&&x.it===w);
   const m=invWearPlace(row);let msg="";invWearDo(row,m,t=>{msg=t;return t;});
   return {msg,надето:Object.values(G.equip).includes(w),звук:PLAYED.slice()};};
  G.equip=Object.assign({},G.equip);
  G.mind=11;r.впритык=надеть(браслет);                  /* 11 при нужных 12 — наденет */
  G.equip.bracelet=null;G.gear=G.gear.filter(x=>x!==браслет);
  G.mind=10;r.мало=надеть(Object.assign({},браслет));   /* 10 — нет */
  G.str=12;r.латы=надеть(лат);
  /* оружие в руку */
  G.agi=3;const тяжёлый={name:"Боевой лук",type:"Лук",slot:"weapon",val:9,rank:3,qual:1};G.gear.push(тяжёлый);
  const i=weaponList().findIndex(x=>x===тяжёлый);SAID.length=0;PLAYED.length=0;
  r.оружие={ok:equipWeaponIndex(i),вРуке:G.equip.weapon===тяжёлый,слово:SAID.join(" "),звук:PLAYED.slice()};
  r.описание=invBrief("gear",String(G.gear.indexOf(тяжёлый)));
  return r;});
 check('3. у вещи своя характеристика: латы — сила, лук и перчатки — ловкость, кольцо, браслет и посох — разум',
  вещи.род.латы==="str"&&вещи.род.лук==="agi"&&вещи.род.перчатки==="agi"&&вещи.род.кольцо==="mind"&&вещи.род.браслет==="mind"&&вещи.род.посох==="mind"&&вещи.браслетN===12,вещи.род);
 check('4. не хватает единицы — надевается; больше — отказ словом и звуком, вещь в сумке; оружие не по силам в руку не идёт; в описании — требование и характеристика',
  вещи.впритык.надето&&/впритык/.test(вещи.впритык.msg)&&!вещи.мало.надето&&/Не надеть/.test(вещи.мало.msg)&&/разума 12/.test(вещи.мало.msg)
  &&вещи.мало.звук.some(x=>/dull/.test(x))&&вещи.латы.надето&&вещи.оружие.ok===false&&!вещи.оружие.вРуке&&/Не надеть/.test(вещи.оружие.слово)
  &&/Требование: ловкость/.test(вещи.описание),вещи);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
