/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 178: ЖИТЕЛИ ГОВОРЯТ ПО-РАЗНОМУ

   Жалоба игрока: у многих жителей почти одинаковые варианты разговора и
   одинаковые сведения о народе. Так и было. Рассказ «Поговорить» был свой
   только у десяти ремёсел из сорока шести — остальные говорили две общие
   фразы; о народе каждый говорил одну из семи готовых строк досье, и все
   эльфы подряд — слово в слово; «История» и «Взгляд» в карточке брались из
   восьми строк на весь мир; на ход разговора у всех был один ответ.

   ЧТО ПРОВЕРЯЕТСЯ.

   1. О своём народе каждый говорит своё: у тридцати жителей одного народа
      почти все слова разные, а у одного жителя от разговора к разговору
      сдвигается сторона. Прежней строки «О моём народе говорят так» нет.
   2. У каждого из сорок шести ремёсел свой рассказ — не меньше трёх
      историй, и общей заглушки «говорит о своей жизни, о дороге» не звучит.
   3. «История» и «Взгляд» — по сорок восемь строк, и у соседей они разные.
   4. Ответ на ход разговора звучит разными словами: у разных жителей и у
      одного и того же в разные разговоры; у жадного — слова жадного.
   5. Карточка жителя называет его собственный взгляд на свой народ.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch();
 const ctx=await browser.newContext({hasTouch:true,isMobile:true,viewport:{width:390,height:780}});
 const page=await ctx.newPage();
 const errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ServiceWorker/i.test(m.text()))errors.push('console: '+m.text());});
 await page.goto(process.argv[2]);
 await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(e){}});
 await page.waitForTimeout(800);

 const r=await page.evaluate(()=>{
  const out={};
  /* ── 1. народ ── */
  const по={};
  for(let x=100;x<12000;x+=13){const n=getNPC(x,(x*7)%1999,0);if(n)(по[n.race]=по[n.race]||[]).push(n);}
  const раса=Object.keys(по).sort((a,b)=>по[b].length-по[a].length)[0];
  const ж=по[раса].slice(0,30);
  const взгляды=ж.map(n=>raceView(n,0));
  out.народ={раса,жителей:ж.length,разных:new Set(взгляды).size,
   старая:взгляды.filter(t=>/О моём народе говорят так/.test(t)).length,
   сдвиг:ж.filter(n=>raceView(n,1)!==raceView(n,2)).length,
   пример:взгляды.slice(0,2)};
  /* ── 2. ремёсла ── */
  const сказано=[];const было=Speech.say;Speech.say=t=>{сказано.push(String(t));};
  const заглушки=[];
  Object.keys(VOICE_PROFS).forEach((проф,i)=>{
   const n=getNPC(500+i*17,700+i*5,0,проф);
   сказано.length=0;
   safeFn(()=>{if(G.langsKnown)Object.keys(LANG_BY_ID||{}).forEach(k=>G.langsKnown[k]=100);});
   tellNPCStory(n);
   const т=сказано.join(" ");
   if(/говорит о своей жизни, о дороге|У каждого путника есть история/.test(т))заглушки.push(проф);});
  Speech.say=было;
  const рассказов=Object.keys(VOICE_PROFS).map(p=>(PROF_STORIES[p]||[]).length);
  out.ремёсла={всего:Object.keys(VOICE_PROFS).length,заглушки,
   безСвоих:Object.keys(VOICE_PROFS).filter(p=>!PROF_STORIES[p]&&!["Правитель","Стражник","Торговец","Кузнец","Старейшина","Целительница","Трактирщик","Магистр","Жрец","Странник"].includes(p))};
  /* ── 3. история и взгляд ── */
  const соседи=[];for(let i=0;i<60;i++)соседи.push(getNPC(200+i*13,300+i*7,0));
  out.карточка={историй:LIFE.length,взглядов:VIEWS.length,
   разныхИсторий:new Set(соседи.map(n=>n.life)).size,разныхВзглядов:new Set(соседи.map(n=>n.view)).size};
  /* ── 4. ответы на ходы ── */
  const ходы=ж.map(n=>dlgOutcome(n,DLG_MOVE_BY_ID.ubedit,true,10).слова);
  const один=ж[0];const mem=memOf(один.key);
  const разы=[];for(let k=0;k<6;k++){if(mem)mem.разг=k;разы.push(dlgOutcome(один,DLG_MOVE_BY_ID.ubedit,false,-10).слова);}
  const жадный=[];for(let x=0;x<4000&&жадный.length<1;x+=11){const n=getNPC(x,x%777,0);const d=npcSoul(n);if(d&&d.нрав.id==="zhad")жадный.push(n);}
  let жадныхСлов=0;
  if(жадный[0]){const m2=memOf(жадный[0].key);
   for(let k=0;k<12;k++){if(m2)m2.разг=k;const t=dlgOutcome(жадный[0],DLG_MOVE_BY_ID.torg,true,10).слова;
    if(/Режете меня без ножа/.test(t))жадныхСлов++;}}
  out.ответы={разныхУЖителей:new Set(ходы).size,разныхУОдного:new Set(разы).size,жадныхСлов,естьЖадный:!!жадный[0],
   пример:ходы.slice(0,3)};
  /* ── 5. карточка ── */
  safeFn(()=>{while(activeLayer())closeTopUI();});
  openNPC(ж[1].key,true);
  const body=document.getElementById("npcBody");
  out.вКарточке=!!body&&/О своём народе:/.test(body.textContent);
  safeFn(()=>{while(activeLayer())closeTopUI();});
  return out;});

 check('1. о своём народе каждый говорит своё: у тридцати жителей одного народа почти все слова разные',
  r.народ.жителей>=20&&r.народ.разных>=r.народ.жителей-3&&r.народ.старая===0,r.народ);
 check('1б. у одного жителя от разговора к разговору сдвигается сторона народа',
  r.народ.сдвиг>=r.народ.жителей*0.8,{сдвиг:r.народ.сдвиг,из:r.народ.жителей});
 check('2. у каждого из сорока шести ремёсел свой рассказ, общей заглушки нет',
  r.ремёсла.всего===46&&r.ремёсла.заглушки.length===0&&r.ремёсла.безСвоих.length===0,r.ремёсла);
 check('3. «История» и «Взгляд» — по сорок восемь строк, у соседей они разные',
  r.карточка.историй===48&&r.карточка.взглядов===48&&r.карточка.разныхИсторий>=30&&r.карточка.разныхВзглядов>=30,r.карточка);
 check('4. ответ на ход разговора звучит разными словами у разных жителей',
  r.ответы.разныхУЖителей>=8,r.ответы);
 check('4б. и у одного жителя в разные разговоры',r.ответы.разныхУОдного>=3,r.ответы);
 check('4в. у жадного — слова жадного',!r.ответы.естьЖадный||r.ответы.жадныхСлов>=1,r.ответы);
 check('5. карточка жителя называет его собственный взгляд на свой народ',r.вКарточке===true,r.вКарточке);
 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));

 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
