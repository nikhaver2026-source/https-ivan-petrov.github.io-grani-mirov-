const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 const reqs=[];page.on('request',r=>{if(/\/sounds\//.test(r.url()))reqs.push(r.url().split('/sounds/')[1]);});
 await page.goto(process.argv[2]);await page.waitForTimeout(700);
 await page.evaluate(()=>enterGame());await page.waitForTimeout(300);

 // 1. Банк вырос: новые роли и голоса чудовищ
 const b=await page.evaluate(()=>{
  const roles=Object.keys(SOUND_BANK);
  const files=roles.flatMap(r=>SOUND_BANK[r].f);
  const species=Object.keys(MONSTER_BANK);
  const cues=species.flatMap(sp=>Object.keys(MONSTER_BANK[sp]).map(c=>sp+"_"+c));
  const noDesc=roles.filter(r=>!SOUND_BANK[r].d);
  return {roles:roles.length,files:files.length,dup:files.filter((v,i,a)=>a.indexOf(v)!==i).length,
   species:species.length,cues:cues.length,noDesc:noDesc.length,
   cats:[...new Set(files.map(f=>f.split("/")[0]))].sort()};});
 check('банк вырос: роли, файлы, разделы',b.roles>=57&&b.files>=179&&b.dup===0&&b.noDesc===0,b);
 check('голоса восьми существ с полным набором реплик',b.species===8&&b.cues>=40,{s:b.species,c:b.cues});

 // 2. Каждому чудовищу игры сопоставлен голос
 const voices=await page.evaluate(()=>{
  const miss=MONSTERS.filter(m=>!MONSTER_VOICE[m.id]).map(m=>m.id);
  const seaMiss=SEA_MONSTERS.filter(m=>!MONSTER_BANK[m.voice]).map(m=>m.id);
  const pirMiss=PIRATE_CREWS.filter(c=>!MONSTER_BANK[c.voice]).map(c=>c.n);
  const badVoice=Object.entries(MONSTER_VOICE).filter(([k,v])=>!MONSTER_BANK[v]).map(([k])=>k);
  return {miss,seaMiss,pirMiss,badVoice};});
 check('у всех чудовищ, тварей и ватаг есть существующий голос',
  !voices.miss.length&&!voices.seaMiss.length&&!voices.pirMiss.length&&!voices.badVoice.length,voices);

 // 3. Файлы новых записей читаются
 const avail=await page.evaluate(async()=>{
  const paths=["monsters/Dragon_Emerge.wav","monsters/Ghost_Death.wav","fantasy/gold_01.mp3",
   "fantasy/trap_01.mp3","steps/step_water_01.mp3","fantasy/jingle_win_01.mp3"];
  const res=[];
  for(const f of paths){
   const ok=await new Promise(r=>{const a=new Audio("sounds/"+f);
    a.addEventListener("loadedmetadata",()=>r(a.duration),{once:true});
    a.addEventListener("error",()=>r(null),{once:true});setTimeout(()=>r(null),5000);});
   res.push({f:f.split("/")[1],ok:!!ok,d:ok&&Math.round(ok*100)/100});}
  return res;});
 check('новые записи лежат по путям и читаются',avail.every(a=>a.ok),avail.map(a=>a.f+":"+(a.ok?a.d+"с":"нет")));

 // 4. Реплика чудовища подбирается по виду
 const cue=await page.evaluate(()=>{
  const out={};
  ["wolf","wraith","kraken","dragon","bandit"].forEach(id=>{
   const el=bankMonsterCue({id},"emerge",0.5);
   out[id]=el?el.src.split("/sounds/")[1]:null;});
  return out;});
 check('реплика появления берётся по виду чудовища',
  cue.wolf&&cue.wraith&&cue.kraken&&cue.dragon&&/Ghost/.test(cue.wraith)&&/Dragon/.test(cue.dragon),cue);

 // 5. Морской бестиарий и пираты
 const sea=await page.evaluate(()=>({
  monsters:SEA_MONSTERS.length,crews:PIRATE_CREWS.length,
  fullMyth:SEA_MONSTERS.every(m=>m.myth&&m.who&&m.min<m.max),
  crewCreed:PIRATE_CREWS.every(c=>c.creed&&c.min<c.max),
  foe:(()=>{G.level=6;const f=makeSeaFoe(SEA_MONSTERS[0],0);return {n:f.n,lvl:f.lvl,hp:f.hp,gold:f.gold};})()}));
 check('морской бестиарий и пиратские ватаги описаны',sea.monsters===8&&sea.crews===5&&sea.fullMyth&&sea.crewCreed,sea);
 check('морской противник строится под уровень игрока',sea.foe.lvl>=5&&sea.foe.hp>0&&sea.foe.gold>0,sea.foe);

 // 6. Встреча с пиратами: окно и все исходы
 const pir=await page.evaluate(()=>{
  const p=findPorts(G.x,G.y,60,8)[0];G.x=p.x;G.y=p.y;G.place=null;G.gold=1000;G.hp=100;
  openHarbor();const btn=document.querySelector('[data-cmd^="board:"]');CMD.board(btn.dataset.cmd.split(":")[1]);
  const crew=PIRATE_CREWS[0];
  meetPirates(crew);
  const m=document.getElementById("modal-pirate");
  const opts=[...document.querySelectorAll('#pirateBody [data-cmd^="pir:"]')].map(b=>b.dataset.cmd.split(":")[1]);
  const g0=G.gold;
  CMD.pir("pay");
  const paid=g0-G.gold;
  return {open:!!m&&!m.hidden,opts,paid,closed:document.getElementById("modal-pirate").hidden,gold:G.gold};});
 check('пираты открывают окно с выбором и откуп работает',pir.opts.includes("fight")&&pir.opts.includes("run")&&pir.paid>0&&pir.closed,pir);

 const outcomes=await page.evaluate(()=>{
  const res={};
  const crew=PIRATE_CREWS[1];
  // отдать груз
  G.inv={"руда":4,"кость":2};meetPirates(crew);CMD.pir("cargo");
  res.cargo=Object.keys(G.inv).filter(k=>Number(G.inv[k])>0).length===0;
  // бой
  G.inCombat=false;meetPirates(crew);CMD.pir("fight");
  res.fight=!!G.inCombat;res.foe=G.combat&&G.combat.m.n;
  if(G.inCombat)endCombat();
  // бегство
  let ran=0,caught=0;
  for(let i=0;i<12;i++){meetPirates(crew);const hp=G.hp;CMD.pir("run");
   if(G.inCombat){caught++;endCombat();}else ran++;}
  res.ran=ran;res.caught=caught;
  return res;});
 check('исходы встречи: груз, бой, бегство',outcomes.cargo&&outcomes.fight&&(outcomes.ran+outcomes.caught)===12,outcomes);

 // 7. Морские события порождают тварей
 const evs=await page.evaluate(()=>{
  const p=findPorts(G.x,G.y,60,8)[0];G.x=p.x;G.y=p.y;G.gold=5000;G.hp=100;G.inCombat=false;
  openHarbor();const btn=document.querySelector('[data-cmd^="board:"]');CMD.board(btn.dataset.cmd.split(":")[1]);
  let fights=0,pirates=0,other=0,bad=0;
  for(let i=0;i<120;i++){
   G.ship.leg=i;G.ship.war=i%2===0;
   const before=G.inCombat;
   const fired=maybeSeaEvent();
   if(G.inCombat){fights++;if(/боцман|Мертвец/.test(G.combat.m.n))pirates++;endCombat();}
   else if(fired)other++;
   if(!(G.hp>0)||!Number.isFinite(G.gold))bad++;
   const m=document.getElementById("modal-pirate");if(m&&!m.hidden){pirates++;curPirates=null;closeModal(m);}
  }
  return {fights,pirates,other,bad};});
 check('в море встречаются и твари, и пираты, и мирные события',evs.fights>0&&evs.pirates>0&&evs.other>0&&evs.bad===0,evs);

 // 8. Бестиарий показывает морские разделы
 const best=await page.evaluate(()=>{
  G.ship=null;while(activeLayer())handleTwoFingerTap();
  CMD.best();
  const t=document.getElementById("bestList").textContent;
  return {sea:/Морские твари/.test(t),pir:/Пиратские ватаги/.test(t),
   voices:document.querySelectorAll('[data-cmd^="seavoice:"]').length};});
 check('бестиарий содержит морских тварей и ватаги с голосами',best.sea&&best.pir&&best.voices===13,best);

 // 9. Ловушки в сундуках глубины
 const trap=await page.evaluate(()=>{
  let trapped=0,hpLost=0;
  for(let i=0;i<40;i++){
   G.place={kind:"dungeon",bx:1000+i,by:1000,stype:"ruins",name:"т",depth:3,x:1,y:1};
   G.marks={};G.hp=100;G.gold=0;
   openChest(3+i%5,4+i%3);
   if(G.hp<100){trapped++;hpLost+=100-G.hp;}}
  return {trapped,avg:trapped?Math.round(hpLost/trapped):0};});
 check('часть глубоких сундуков оказывается с ловушкой',trap.trapped>0&&trap.trapped<40&&trap.avg>0,trap);

 // 10. Энциклопедия перечисляет пополненный банк
 const enc=await page.evaluate(()=>{
  G.place=null;while(activeLayer())handleTwoFingerTap();
  CMD.encyc();
  return {cards:document.querySelectorAll('#bankGrid .sound-card').length,
   heads:document.querySelectorAll('#bankGrid h3').length};});
 check('энциклопедия перечисляет все роли банка',enc.cards>=57&&enc.heads>=9,enc);

 console.log(results.join('\n'));
 console.log('\nЗапрошено файлов звука: '+reqs.length+' (например '+reqs.slice(0,3).join(', ')+')');
 console.log('Ошибки страницы: '+(errors.length?errors.slice(0,5).join('\n'):'нет'));
 await browser.close();
 process.exit(results.some(r=>r.startsWith('FAIL'))||errors.length?1:0);
})();
