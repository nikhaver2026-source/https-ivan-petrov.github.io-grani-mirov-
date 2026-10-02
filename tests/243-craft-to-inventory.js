/* ════════════════════════════════════════════════════════════════════════
   НАБОР 243: СДЕЛАННОЕ РЕМЕСЛОМ — В СВОЙ РАЗДЕЛ КОТОМКИ (8.5)

   Жалоба игрока: каменное копьё после создания не появлялось в оружии,
   зелье — в зельях.
   1. Каменное копьё ложится в раздел «Оружие», его можно взять в руку, и
      звучит оно как копьё.
   2. Травяной отвар ложится в раздел «Зелья» и в окно зелий; выпитый, лечит.
   3. Отвар у очага («Сварить отвар») тоже ложится в «Зелья», а не
      выпивается на месте; выпитый, возвращает и здоровье, и силу.
   4. Факел, удочка и сеть видны в котомке; голос называет раздел.
   ════════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
(async()=>{
 const results=[];const check=(n,ok,d)=>results.push(`${ok?'PASS':'FAIL'} — ${n} :: ${JSON.stringify(d).slice(0,700)}`);
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{enterGame();window.__said=[];const o=Speech.say.bind(Speech);Speech.say=(t,x)=>{window.__said.push(String(t));return o(t,x);};});
 await page.waitForTimeout(300);

 const r1=await page.evaluate(()=>{
  Object.assign(G.inv,{камень:10,дерево:10,трава:20,ягоды:10});const силаДо=G.str;
  CMD.craftdo(0);
  const ряд=invAll().find(r=>r.name==="Каменное копьё");
  const сказано=__said.filter(t=>/Создано: Каменное копьё/.test(t)).pop()||"";
  let класс=null;if(ряд){G.equip.weapon=ряд.it;класс=weaponClass();}
  return {есть:!!ряд,kind:ряд&&ряд.kind,раздел:ряд&&ряд.раздел,n:ряд&&(INV_SECTION_BY_ID[ряд.раздел]||{}).n,класс,сила:G.str-силаДо,сказано};});
 check('1. каменное копьё — в разделе «Оружие», в руке звучит как копьё',r1.есть&&r1.kind==="gear"&&r1.раздел==="weapon"&&r1.класс==="spear"&&/Оружие/.test(r1.сказано),r1);

 const r2=await page.evaluate(()=>{
  const до=potionsOf().length;CMD.craftdo(1);
  const ряд=invAll().find(r=>r.kind==="potion"&&/травяной отвар/.test(r.name));
  openPotions();const окно=document.getElementById("potBody").textContent;closeModal&&safeFn(()=>closeTopUI());
  G.hp=Math.max(1,Math.round(G.hpMax/3));const hp0=G.hp;
  const i=potionsOf().findIndex(r=>r.имя==="травяной отвар");drinkPotion(i);
  const сказано=__said.filter(t=>/Создано: Травяной отвар/.test(t)).pop()||"";
  return {прибавилось:potionsOf().length-до+1,раздел:ряд&&ряд.раздел,вОкне:/травяной отвар/.test(окно),лечит:G.hp-hp0,сказано};});
 check('2. травяной отвар — в разделе «Зелья» и в окне зелий; выпитый, лечит',r2.раздел==="potion"&&r2.вОкне&&r2.лечит>0&&/Зелья/.test(r2.сказано),r2);

 const r3b=await page.evaluate(()=>{
  /* Ветка «brew» после удачной работы: вызываем её путь напрямую. */
  const до=potionsOf().length;G.hp=Math.max(1,Math.round(G.hpMax/4));G.mana=0;const hp0=G.hp;
  const rec=potionGive("heal",{q:1.3,мана:0.5,имя:"крепкий отвар"});
  const ряд=invAll().find(r=>r.kind==="potion"&&/крепкий отвар/.test(r.name));
  drinkPotion(potionsOf().indexOf(rec));
  const src=document.documentElement.innerHTML;
  return {легло:!!ряд&&ряд.раздел==="potion",здоровье:G.hp-hp0,сила:G.mana,
   неНаМесте:!/отвар выпит на месте/.test(src)&&/potionGive\("heal",\{q:1\.3,мана:0\.5,имя:"крепкий отвар"\}\)/.test(src)};});
 check('3. отвар у очага ложится в «Зелья»; выпитый, даёт здоровье и силу',r3b.легло&&r3b.здоровье>0&&r3b.сила>0&&r3b.неНаМесте,r3b);

 const r4=await page.evaluate(()=>{__said.length=0;const o={};
  [2,3,4].forEach(i=>{CMD.craftdo(i);});
  ["Факел","Удочка","Рыболовная сеть"].forEach(n=>{const r=invAll().find(x=>x.name===n);o[n]=r?(INV_SECTION_BY_ID[r.раздел]||{}).n:null;});
  o.сказано=__said.filter(t=>/Создано/.test(t));return o;});
 check('4. факел, удочка и сеть видны в котомке; голос называет раздел',r4["Факел"]&&r4["Удочка"]&&r4["Рыболовная сеть"]&&r4.сказано.length===3&&r4.сказано.every(t=>/раздел «/.test(t)),r4);

 check('без ошибок на странице',!errors.length,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const bad=results.filter(r=>r.startsWith('FAIL'));
 console.log(`\nИТОГ: ${results.length-bad.length}/${results.length}`);
 process.exit(bad.length?1:0);
})();
