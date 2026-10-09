/* ══════════════════════════════════════════════════════════════════
   259 — РУКОВОДСТВО ПО НЫНЕШНЕМУ МИРУ И ЭНЦИКЛОПЕДИЯ ЗВУКОВ (9.5.3)
   «Обнови руководство: расы, народы, боги — чтобы старого ничего не
   осталось». «В энциклопедии звуков повторное нажатие запускает звук
   поверх первого; не все звуки соответствуют своему профилю; некоторые
   в игре вообще не звучат».
   Проверяется:
   1. Руководство: народы, боги, державы и жесты — по нынешнему миру, без
      старых чисел и без истории правок.
   2. Каталог «Народы Грани» считает расы сам, а не называет «сорок шесть».
   3. Прослушивание: повторное касание по звучащей записи её останавливает,
      касание по другой гасит прежнюю — звуки не накладываются.
   4. Разделы энциклопедии по смыслу: клинки — в бою, зелья — в вещах,
      ловушки и твари «Сводов» — в ловушках и чудовищах.
   5. Чужие звуки ушли: гиперпривод, ракеты, торпеды, лазер; на их месте
      записи JC Sounds, а щелчок в сорок тысячных — отсчёт ловушки.
   6. Записи, которые игра не играла: меч к поясу и рёв пепельной рыси
      звучат в игре; у крабов и моли Сводов свои голоса.
   ══════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'..');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.addInitScript(()=>{
  try{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true});}catch(_){}
  window.GraniTTS={speak(t,r,v,id){setTimeout(()=>window.GraniTTSDone&&window.GraniTTSDone(id),20);},
   stop(){},isSpeaking(){return false;},getVoices(){return "[]";},setVoice(){},hasStart(){return false;}};});
 await p.goto(process.argv[2]);await p.waitForTimeout(900);

 /* 1. Руководство */
 const g=await p.evaluate(()=>{
  const всё=GUIDE.map(x=>x.title+"\n"+x.body.join("\n")).join("\n");
  const имена=GUIDE.map(x=>[x.title].concat((x.secs||[]).map(s=>s.t)).join(" | ")).join(" | ");
  /* (14.5) Числа мира руководство считает само — по тем же спискам, что и игра. */
  const ч=(n,р)=>числоСловом(n,р);
  const числа=["Держав в мире "+ч(EMPIRES.length+DARK_EMPIRES.length,"ж")+".",
   "Мир Грани населяют "+ч(RACES_DB.length,"ж")+" "+plural(RACES_DB.length,"раса","расы","рас"),
   "Богов в мире "+ч(PANTHEON.length+Gods.all().length+DARK_GODS.length,"м")+": "+ч(PANTHEON.length,"м"),
   "Школ заклинаний в игре "+ч(SCHOOLS.length,"ж")];
  return {всё,имена,числа,слова:[ч(81,"ж"),ч(159,"ж"),ч(129,"м"),ч(10000,"м"),ч(2,"ж"),ч(1,"с"),ч(1000001,"м")]};});
 const надо=[/Народы Грани/,/Великие боги/,/УМОЛЧАНИЯ\. Два пальца/,/КАКИЕ ДЕЙСТВИЯ\. Взаимодействие/,/свайп тремя пальцами влево\) выберите/,
  /Свайп влево — выпить зелье здоровья/,/Десять ступеней: простой/,/Крыло есть у двадцати рас/];
 const нельзя=[/(^|[^а-яё])семьдесят од/i,/Сорок шесть народов/i,/Двенадцать богов/,/Свайп влево — карта места/,/Пятнадцать привязок/,
  /ТРИДЦАТЬ ТРИ ДЕЙСТВИЯ/,/\((?:с )?\d\.\d\)/,/Карта локации/,/Эхо-скан переехал/,/тридцать четыр/i,/две тысячи клеток/,
  /Восемь держав живут/,/у каждой из восьми/,/спросить капитана/,/раньше все они были/,/не было вовсе/,/НЕ БЫЛО ВОВСЕ/,
  /по-прежнему/,/как было раньше/,/как прежде/,/одним пальцем вниз, затем вверх \(самая редкая/,
  /\{\{/,/Держав в мире семьдесят три/,/сто пятьдесят одна раса/,/Богов в мире сто двадцать один/];
 const нет=надо.filter(r=>!r.test(g.всё+g.имена)).map(String).concat(g.числа.filter(t=>g.всё.indexOf(t)<0));
 const есть=нельзя.filter(r=>r.test(g.всё)).map(String);
 check('1. руководство — по нынешнему миру: народы, боги, державы, жесты; числа мира — подсчётом',нет.length===0,нет);
 check('1в. числа словами согласуются с родом',g.слова.join("|")==="восемьдесят одна|сто пятьдесят девять|сто двадцать девять|десять тысяч|две|одно|один миллион один",g.слова);
 check('1б. в руководстве нет старых чисел и истории правок',есть.length===0,есть);

 /* 2. Каталог народов */
 const c=await p.evaluate(()=>{CMD.races();const f=document.getElementById("raceFilter");
  const t=f?f.textContent:"";closeTopUI();
  return {t,n:RACES_DB.length,hint:document.querySelector("#modal-races .hint")?.textContent||""};});
 check('2. каталог «Народы Грани» считает расы сам',c.t.includes("Все "+c.n)&&!/46|сорок шесть/i.test(c.t+c.hint),c);

 /* 3. Прослушивание без наложения */
 const e=await p.evaluate(async()=>{
  CMD.encyc();openEncycCat("combat","Бой и оружие");
  const карты=[...document.querySelectorAll("#encycOneGrid .sound-card")].filter(b=>!b.dataset.scene);
  const до=Bank.shots.length;
  карты[0].click();const h1=EncPreview.h;const k1=EncPreview.key;
  карты[0].click();const после=EncPreview.h;
  карты[0].click();const h2=EncPreview.h;
  карты[1].click();const h3=EncPreview.h;
  const r={карт:карты.length,первый:!!h1,ключ:k1,остановлен:после===null&&!!(h1&&(h1.__stopped||h1.stopped)),
   снова:!!h2&&h2!==h1,другой:!!h3&&h3!==h2&&!!(h2.__stopped||h2.stopped),
   говорит:/прослушать или остановить/.test(карты[0].dataset.speak||"")};
  closeEncycCat();const висит=EncPreview.h;closeTopUI();
  r.закрытие=висит===null;return r;});
 check('3. повторное касание останавливает запись, другая гасит прежнюю, закрытие глушит',
  e.первый&&e.остановлен&&e.снова&&e.другой&&e.говорит&&e.закрытие,e);

 /* 4. Разделы по смыслу */
 const s=await p.evaluate(()=>{
  const в=(re,сек)=>Object.keys(SOUND_BANK).filter(r=>re.test(r)&&roleSection(r)!==сек);
  return {клинки:в(/^w_/,"combat"),зелья:в(/^potion_/,"items"),ловушки:в(/^sv_trap_/,"traps"),
   твари:в(/^sv_(wolf_snarl|were_growl|snake|serpent|lamia|beast_roar|beast_snarl)$/,"monsters"),
   боги:в(/^sv_god_/,"gods"),
   земли:Object.keys(SOUND_BANK).filter(r=>roleSection(r)==="amb_land"&&/^(w_|potion_|sv_|sv2_)/.test(r))};});
 check('4. разделы энциклопедии по смыслу: клинки, зелья, ловушки, твари и боги Сводов',
  Object.values(s).every(a=>a.length===0),s);

 /* 5. Чужие звуки ушли, новые на месте */
 const z=await p.evaluate(()=>{
  const все=Object.values(SOUND_BANK).reduce((a,b)=>a.concat(b.f),[]);
  return {чужие:все.filter(f=>/hyperdrive|jump_drive|jump_in\.|jump_out\.|torpedo|rocket|missile|mining_laser|gridfire|\/explosion_large|\/explosion_medium|gunpowder_burning|mg\/build_work_0|oc_trap_time_01/.test(f)),
   jc:["es_gate","es_jump","es_hit","es_plasma","mtg_explode","oc_trap_time"].filter(r=>!SOUND_BANK[r].f.some(f=>/^jcfx\//.test(f))),
   стройка:SOUND_BANK.build_work.f};});
 const файлы=["teleport_in","teleport_out","power_hum_01","power_hum_02","impact_01","impact_02","impact_03","blast_01","blast_02","blast_03","trap_tick_01","trap_tick_02"]
  .filter(n=>!fs.existsSync(path.join(ROOT,"sounds","jcfx",n+".flac")));
 const титры=fs.existsSync(path.join(ROOT,"sounds","jcfx","CREDITS.md"))&&/Credit: JC\s*Sounds/.test(fs.readFileSync(path.join(ROOT,"sounds","jcfx","CREDITS.md"),"utf8"));
 check('5. чужих звуков нет, записи JC Sounds на месте и в титрах',z.чужие.length===0&&z.jc.length===0&&файлы.length===0&&титры&&z.стройка.length>=3,{z,файлы,титры});

 /* 6. Записи, которых игра не играла */
 const u=await p.evaluate(()=>{
  enterGame();
  const звук=id=>{const re=new RegExp('\\{id:"'+id+'",[^\\n]*?звук:"([a-z0-9_]+)"');const m=re.exec(document.documentElement.innerHTML);return m&&m[1];};
  const was=Bank.play.bind(Bank);let last=null;Bank.play=(r,o)=>{last=r;return was(r,o);};
  equipSound({name:"Стальной меч",slot:"weapon",kind:"weapon"},"weapon",true);const меч=last;
  equipSound({name:"Кинжал",slot:"weapon",kind:"weapon"},"weapon",true);const кинжал=last;
  Bank.play=was;
  return {меч,кинжал,рысь:звук("sv_ashcat"),краб:звук("sv_shellcrab"),моль:звук("sv_starmoth"),знаменосец:звук("sv_bannerghost")};});
 check('6. меч к поясу и рёв рыси звучат в игре; у крабов, моли и знаменосца свои голоса',
  u.меч==="w_sword_equip"&&u.кинжал!=="w_sword_equip"&&u.рысь==="sv_beast_roar"&&u.краб==="sv2_chitter"&&u.моль==="oc_bat_flutter"&&u.знаменосец==="ghost_wail",u);

 check('нет ошибок страницы',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 const fail=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\nИтог: ${results.length-fail} PASS, ${fail} FAIL`);
 process.exit(fail?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
