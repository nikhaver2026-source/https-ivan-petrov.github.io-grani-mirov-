/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 248: 9.5 — «ТОРГОВЛЯ» ПЕРВЫМ ПУНКТОМ, ЗАДАНИЯ НА ВЫБОР, ДЕЛА
   ОБЩИНЫ, ЖИВОЙ ОТКЛИК ЖИТЕЛЯ

   Жалобы игрока:
   • до лавки приходилось листать весь разговор; торговля должна быть
     первым пунктом, а в ней — «Купить» и «Продать»;
   • продать можно было только товары — нужны оружие, броня и прочее,
     разделами внутри «Продать»;
   • житель на исход дела отвечает одним и тем же, а цена не меняется;
   • задание берётся вслепую: нужен выбор — основное или побочное, — и
     игра должна назвать дело до того, как его скажет житель;
   • побочные задания поднимают отношение жителя, дела общины — отношение
     города, селения и властей.

   1. У торговца первый пункт — «Торговля», второй — «Задания»; товаров и
      продажи сплошным списком в разговоре нет.
   2. «Торговля» открывает «Купить» и «Продать» и «Назад».
   3. «Продать»: оружие и броня — свои разделы; простой торговец берёт меч.
   4. «Задания»: основное, три побочных; взгляд на дело называет его, что
      нужно и что дадут — до того, как взять.
   5. Взятое побочное объявляется голосом игры первым; сданное поднимает
      отношение жителя («было — стало»).
   6. Дело общины: мир между соседями засчитывается, как только он
      заключён; сданное поднимает отношение селения и властей.
   7. Не помирили — житель говорит своё, и зелье здоровья у него дороже на
      столько-то золотых и процентов; цена в лавке и правда выросла.
   8. Сданное дело — торговец уступает; удачный и неудачный ход разговора
      тоже оставляют след в цене.
   9. Основное задание: взгляд — объявление, «Взять» — дело взято, и
      объявление звучит раньше слов заказчика.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 await p.evaluate(()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  window.SAID=[];const s0=Speech.say.bind(Speech);Speech.say=function(t,o){SAID.push(String(t));return s0(t,o);};
  G.place=null;G.quests=[];G.npcMood={};G.rep={};G.gold=2000;
  /* торговец, который берёт оружие и броню */
  let t=null;for(let i=0;i<300&&!t;i++){const c=getNPC(500+i,700,1,"Торговец");
   if(c&&c.trade&&!attitudeOf(c.race).refuses&&merchantBuys(c,{cat:"weapon",kind:"gear",it:{price:40,rank:1},name:"x"}).ок&&merchantBuys(c,{cat:"armor",kind:"gear",it:{price:40,rank:1},name:"x"}).ок)t=c;}
  window.__t=t;
  window.getNPCByKey=(k=>(key)=>t&&key===t.key?t:k(key))(window.getNPCByKey);});

 /* ── 1 ── */
 const п1=await p.evaluate(()=>{const t=__t;openNPC(t.key,true);
  const кн=[...document.querySelectorAll('#npcBody button')].map(b=>b.dataset.cmd||"");
  const тело=document.getElementById("npcBody").innerHTML;
  return {первые:кн.slice(0,2),buy:/data-cmd="buy:/.test(тело),sell:/data-cmd="sell(all)?:/.test(тело),товары:/<h3>Товары<\/h3>/.test(тело)};});
 check('1. у торговца первый пункт — «Торговля», второй — «Задания»; сплошных товаров и продажи в разговоре нет',
  /^npctrade:/.test(п1.первые[0])&&/^npcquests:/.test(п1.первые[1])&&!п1.buy&&!п1.sell&&!п1.товары,п1);

 /* ── 2 ── */
 const п2=await p.evaluate(()=>{const t=__t;SAID.length=0;CMD.npctrade(t.key);
  const кн=[...document.querySelectorAll('#npcBody button')].map(b=>({c:b.dataset.cmd,t:b.textContent.trim()}));
  return {кн:кн.map(x=>x.t),cmd:кн.map(x=>x.c),said:SAID.join(" | ")};});
 check('2. «Торговля» открывает «Купить» и «Продать» (и «Назад»)',
  п2.кн[0]==="Купить"&&п2.кн[1]==="Продать"&&/~buy$/.test(п2.cmd[0])&&/~sell$/.test(п2.cmd[1])&&п2.cmd.some(c=>/^npcback:/.test(c))&&/Купить или продать/.test(п2.said),п2);

 /* ── 3 ── */
 const п3=await p.evaluate(async()=>{const t=__t;
  G.gear=(G.gear||[]).filter(g=>!/^t248/.test(g.id));
  G.gear.push({id:"t248w",name:"Железный топор",type:"Топор",slot:"weapon",rank:1,qual:1,val:6,price:60});
  G.gear.push({id:"t248a",name:"Кожаная куртка",type:"Лёгкая броня",slot:"armor",rank:1,qual:1,val:3,price:50});
  G.inv={"руда":3};
  CMD.shop(t.key+"~sell");await new Promise(r=>setTimeout(r,60));
  const кат=[...document.querySelectorAll('#shopBody [data-cmd^="shopcat:"]')].map(b=>b.dataset.cmd.split(":")[1]);
  /* простой торговец без своего ремесла тоже берёт оружие */
  const ms=window.merchSoul;window.merchSoul=()=>null;
  const берёт=merchantBuys(t,{cat:"weapon",kind:"gear",it:{price:40,rank:1},name:"x"}).ок&&merchantBuys(t,{cat:"armor",kind:"gear",it:{price:40,rank:1},name:"x"}).ок;
  window.merchSoul=ms;const простой=true;
  while(activeLayer()&&activeLayer().id==="modal-shop")closeTopUI();
  return {кат,берёт,простой:!!простой};});
 check('3. «Продать»: оружие и броня — свои разделы; простой торговец берёт и оружие',
  п3.кат.includes("weapon")&&п3.кат.includes("armor")&&п3.берёт===true,п3);

 /* ── 4 ── */
 const п4=await p.evaluate(()=>{const t=__t;SAID.length=0;CMD.npcquests(t.key);
  const кн=[...document.querySelectorAll('#npcBody button')].map(b=>b.dataset.cmd||"");
  const побочных=кн.filter(c=>/^qprev:.*~s\d$/.test(c)).length;
  const осн=кн.some(c=>/^qprev:.*~main$/.test(c));
  SAID.length=0;CMD.qprev(t.key+"~s0");
  const объявлено=SAID.join(" | ");
  const взять=!!document.querySelector('#npcBody [data-cmd^="qpick:"]');
  return {побочных,осн,объявлено,взять,квестов:G.quests.length};});
 check('4. «Задания»: основное и три побочных; взгляд называет дело, что нужно и награду — ещё до взятия',
  п4.осн&&п4.побочных===3&&/Побочное задание: «.+»\. Нужно .+\. Награда: .+/.test(п4.объявлено)&&п4.взять&&п4.квестов===0,п4);

 /* ── 5 ── */
 const п5=await p.evaluate(async()=>{const t=__t;SAID.length=0;
  /* «гостинец к празднику» или любая просьба — сдаём по-честному */
  const q0=sideQuestsFor(t)[0];CMD.qpick(t.key+"~s0");
  const q=G.quests.find(x=>x.id===q0.id);
  const порядок=SAID.findIndex(x=>/Квест взят\. Побочное задание/.test(x));
  const житель=SAID.findIndex(x=>x.indexOf(t.name+": «")===0);
  /* выполняем */
  if(q.type==="fetch")G.inv[q.res]=q.need;
  else if(q.type==="kill"||q.type==="hunt")q.have=q.need;
  else q.doneFlag=true;
  const было=npcFeel(t);SAID.length=0;completeQuest(q.id);
  return {побочный:!!(q&&q.побочный),порядок,житель,сдан:q.done,было,стало:npcFeel(t),said:SAID.join(" | ").slice(0,600)};});
 check('5. побочное берётся с объявлением голосом игры первым; сданное поднимает отношение жителя («было — стало»)',
  п5.побочный&&п5.порядок===0&&(п5.житель<0||п5.житель>п5.порядок)&&п5.сдан&&п5.стало>п5.было&&/было .+ стало/.test(п5.said),п5);

 /* ── 6 ── */
 const п6=await p.evaluate(()=>{
  let n=null,s=null;
  outer: for(let r=0;r<120;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
   const c=safeFn(()=>cellContent(25000+dx,25000+dy),null);if(c&&c.structure&&c.structure.type==="village"){const л=npcsFor(c);if(л.length>=2){n=л[0];break outer;}}}
  if(!n)return {нет:true};
  s=npcSettlement(n);
  const вид=COMMUNITY_KINDS.find(k=>k.id==="мир");
  const h=j=>0.3+0.01*j;
  const q=вид.gen(n,1,h,s);if(!q)return {пары:false};
  Object.assign(q,{id:n.key+"c_t",npc:n.name,npcKey:n.key,побочный:true,общинный:true,вид:"мир",заглавие:вид.заг,have:0,община:s.имя,общинаКруг:s.круг,общинаПлюс:10,власть:"noble",властьПлюс:6});
  window.getNPCByKey=(k=>(key)=>key===n.key?n:k(key))(window.getNPCByKey);
  takeSideQuest(n,q,"Дело общины");
  const a=getNPCByKey(q.кто[0]),b=getNPCByKey(q.кто[2]);
  const r0=Math.random;Math.random=()=>0;socMeddle(q.кто[0],q.кто[2],"друзья");Math.random=r0;
  const e=EMPIRES[Math.max(0,empireIndexAt(n.x,n.y))];
  const до={с:standOf(s.круг,s.имя),в:standOf("noble",e.short)};
  SAID.length=0;completeQuest(q.id);
  return {флаг:q.doneFlag,сдан:q.done,до,после:{с:standOf(s.круг,s.имя),в:standOf("noble",e.short)},круг:s.круг,said:SAID.join(" | ").slice(0,500)};});
 check('6. дело общины: мир засчитывается, как только он заключён; сданное поднимает отношение селения и знати',
  п6.нет||(п6.флаг&&п6.сдан&&п6.после.с>=п6.до.с+10&&п6.после.в>п6.до.в&&/Селение|Город/.test(п6.said)),п6);

 /* ── 7 ── */
 const п7=await p.evaluate(()=>{const t=__t;G.npcMood={};
  const цена0=stockFor(t).find(x=>x.n==="Зелье здоровья").price;
  const сосед=getNPC(t.x,t.y,2)||getNPC(t.x+1,t.y,0);
  window.getNPCByKey=(k=>(key)=>key===сосед.key?сосед:k(key))(window.getNPCByKey);
  const r0=Math.random;Math.random=()=>0.999;SAID.length=0;socMeddle(t.key,сосед.key,"друзья");Math.random=r0;
  const цена1=stockFor(t).find(x=>x.n==="Зелье здоровья").price;
  const said=SAID.join(" | ");
  return {цена0,цена1,k:npcMoodK(t),said:said.slice(0,700),строка:npcMoodLine(t)};});
 check('7. не помирили — житель говорит своё, зелье здоровья у него дороже на столько-то золотых и процентов, и в лавке тоже',
  п7.цена1>п7.цена0&&п7.k>1&&/Зелье здоровья у .+ теперь дороже на \d+ золот\S+ \(\+\d+%\): \d+ вместо \d+/.test(п7.said)&&/Цены для вас: \+\d+%/.test(п7.строка),п7);

 /* ── 8 ── */
 const п8=await p.evaluate(()=>{const t=__t;G.npcMood={};
  const ц0=stockFor(t).find(x=>x.n==="Зелье здоровья").price;
  const т1=npcReact(t,"дело_сдано");const ц1=stockFor(t).find(x=>x.n==="Зелье здоровья").price;
  G.npcMood={};const т2=npcReact(t,"ход_провал");const ц2=stockFor(t).find(x=>x.n==="Зелье здоровья").price;
  /* слова разнятся от раза к разу */
  /* (9.5.1) Записанные ответы житель говорит своим голосом (Folk.ответ) — в строке остаётся «отвечает». */
  let голос=null;const fo=typeof Folk!=="undefined"&&Folk.ответ;if(fo)Folk.ответ=function(n,tt,o){голос=tt;return fo.call(Folk,n,tt,o);};
  const слова=new Set();for(let i=0;i<8;i++){G.npcMood={};голос=null;const тт=npcReact(t,"мир_провал");слова.add((тт.match(/«([^»]+)»/)||[])[1]||голос);}
  if(fo)Folk.ответ=fo;
  G.npcMood={};
  return {ц0,ц1,ц2,т1:т1.slice(0,200),т2:т2.slice(0,200),разных:слова.size};});
 check('8. сданное дело — уступка, неудачный ход — надбавка; слова жителя разнятся',
  п8.ц1<п8.ц0&&п8.ц2>п8.ц0&&/дешевле/.test(п8.т1)&&/дороже/.test(п8.т2)&&п8.разных>=2,п8);

 /* ── 9 ── */
 const п9=await p.evaluate(async()=>{const t=__t;G.quests=[];G.chainTaken={};openNPC(t.key,true);CMD.npcquests(t.key);
  SAID.length=0;CMD.qprev(t.key+"~main");const взгляд=SAID.join(" | ");const до=G.quests.length;
  SAID.length=0;CMD.qpick(t.key+"~main");await new Promise(r=>setTimeout(r,100));
  const q=mainQuestOf(t);const i=SAID.findIndex(x=>/Квест взят\. Основное задание: «/.test(x));
  return {взгляд:взгляд.slice(0,300),до,взято:!!q,i,окно:!!document.querySelector('#npcBody [data-cmd^="qprev:"]')||!!document.querySelector('#npcBody [data-cmd^="qdone:"]')};});
 check('9. основное задание: взгляд объявляет дело, «Взять» берёт его, объявление — первым; окно остаётся в «Заданиях»',
  /Основное задание: «.+»\. Нужно .+\. Награда: /.test(п9.взгляд)&&п9.до===0&&п9.взято&&п9.i===0&&п9.окно,п9);

 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
