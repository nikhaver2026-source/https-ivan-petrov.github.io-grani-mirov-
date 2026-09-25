/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 186: ШАГИ ПО МЕСТУ, ДОСПЕХ ПО МАТЕРИАЛУ, СТРАЖА СЛЫШНА

   Жалобы игрока (версия 3.4).
   • «Практически во всех помещениях и вне их шаги одинаковые. В разных
     местах шаги должны быть разные, а в одном и том же — одинаковые, и
     зависеть от того, в доспехах ли игрок, в коже. Сейчас это не работает».
     Так и было: пол выбирался заново на каждой клетке, каждый третий шаг
     брался из чужого набора, доски и мрамор звучали одной записью, а
     доспех узнавался по роду вещи, который у всякой брони «Кольчуга», —
     кожаная броня звенела железом, а слой доспеха был на тридцать пять
     децибел тише шага.
   • «Если стража ходит, это должно быть слышно — и доспехи, и оружие».

   ЧТО ПРОВЕРЯЕТСЯ.
   1. В каждом месте пол один на весь ярус, у каждого рода постройки — свой.
   2. Шаг по одной поверхности всегда одной записью: случайного «дублёра»
      нет; у каждой поверхности своя запись.
   3. Доспех — по материалу вещи: «кожаная кольчуга» скрипит кожей,
      железная звенит кольчугой и тяжелее, без доспеха шуршит ткань,
      кованые сапоги лязгают, оружие постукивает о ножны.
   4. Записи снаряжения звучат в полную силу (пик не тише −3 дБ).
   5. Два трактира звучат своим тоном, в одном трактире тон один.
   6. Стражник ступает по полу своего места, звеня кольчугой и лязгая
      сапогами; в деревне стража в коже; горожанин — без железа.
   7. Слышны двое ближних из шагавших, а не только ближайший, и стража не
      звучит в картине мира тварью.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(900);
 await page.evaluate(()=>{try{Intro.stop();}catch(_){}try{enterGame();G.tutorDone=1;}catch(_){}while(activeLayer())closeTopUI();});

 /* ── 1. один пол на место ── */
 const пол=await page.evaluate(()=>{
  const out={},пёстрые=[];
  for(const st of Object.keys(PLACE_FLOOR)){
   G.place={kind:PLACE_KIND[st]||"house",bx:700,by:900,stype:st,name:"x",depth:0,x:1,y:1};
   const s=new Set();for(let x=1;x<20;x++)for(let y=1;y<14;y++){G.place.x=x;G.place.y=y;s.add(indoorSurface());}
   out[st]=[...s];if(s.size!==1)пёстрые.push(st);}
  const ярусы=[];
  for(let d=1;d<=5;d++){G.place={kind:"dungeon",bx:333,by:444,stype:"ruins",name:"x",depth:d,x:1,y:1};
   const s=new Set();for(let x=1;x<20;x++)for(let y=1;y<14;y++){G.place.x=x;G.place.y=y;s.add(indoorSurface());}
   ярусы.push([...s]);}
  G.place=null;return {out,пёстрые,ярусы};});
 const полы=Object.values(пол.out).map(a=>a[0]);
 check('1. в каждом месте пол один на весь ярус',пол.пёстрые.length===0&&пол.ярусы.every(a=>a.length===1),пол);
 check('1б. у каждого рода постройки свой пол',new Set(полы).size===полы.length,пол.out);

 /* ── 2. одна запись на поверхность ── */
 const шаг=await page.evaluate(()=>{
  const r={};const роли=new Set();
  for(let i=0;i<24;i++){playStep("plank");роли.add(G.lastStep&&G.lastStep.role);}
  r.доски=[...роли];
  const поРоли={};Object.entries(SURF_ROLE).forEach(([k,v])=>{(поРоли[v]=поРоли[v]||[]).push(k);});
  r.делят=Object.entries(поРоли).filter(([v,ks])=>ks.filter(k=>!STEP_LAYER[k]).length>1).map(([v,ks])=>v+":"+ks.join("/"));
  r.дублёр=typeof STEP_ALT!=="undefined";
  r.доскиМрамор=[SURF_ROLE.plank,SURF_ROLE.marble];
  return r;});
 check('2. шаг по доскам — всегда одна запись, случайного дублёра нет',шаг.доски.length===1&&!шаг.дублёр,шаг);
 check('2б. у каждой поверхности своя запись (общую делят только те, кого различает второй слой)',
  шаг.делят.length===0&&шаг.доскиМрамор[0]!==шаг.доскиМрамор[1],шаг);

 /* ── 3. доспех по материалу ── */
 const доспех=await page.evaluate(()=>{
  G.place=null;G.weather="Ясно";runState.active=false;
  const было={a:G.equip.armor,b:G.equip.boots,w:G.equip.weapon};
  const слои=p=>p.layers.map(l=>l[0]);
  G.equip.boots=null;G.equip.weapon=null;
  G.equip.armor={name:"Простая кожаная кольчуга",type:"Кольчуга",slot:"armor"};const кожа=stepProfile("stone");
  G.equip.armor={name:"Добротная железная кольчуга",type:"Кольчуга",slot:"armor"};const железо=stepProfile("stone");
  G.equip.armor=null;const ткань=stepProfile("stone");
  G.equip.boots={name:"Простые железные сапоги",type:"Сапоги",slot:"armor"};const сапоги=stepProfile("stone");
  G.equip.boots=null;G.equip.weapon={name:"Простой стальной меч",type:"Меч",slot:"weapon"};
  let ножны=false;for(let i=0;i<30&&!ножны;i++)ножны=slojiHas();
  function slojiHas(){return stepProfile("stone").layers.some(l=>l[0]==="gear_blade");}
  G.equip.armor=было.a;G.equip.boots=было.b;G.equip.weapon=было.w;
  return {кожа:[кожа.wear,слои(кожа)],железо:[железо.wear,слои(железо),железо.base],ткань:[ткань.wear,слои(ткань),ткань.base],
   сапоги:слои(сапоги),ножны,
   мат:[equipMaterial({name:"Простая кожаная кольчуга",type:"Кольчуга"}),equipMaterial({name:"Лунная кольчуга",type:"Кольчуга"}),equipMaterial({name:"Стёганый поддоспешник",type:"Кольчуга"})]};});
 check('3. кожаная броня скрипит кожей, хоть род её и «Кольчуга»',доспех.кожа[0]==="leather"&&доспех.кожа[1].includes("hero_step_leather")&&!доспех.кожа[1].includes("hero_step_metal"),доспех);
 check('3б. железная кольчуга звенит и ступает тяжелее; без доспеха шуршит ткань',
  доспех.железо[0]==="metal"&&доспех.железо[1].includes("hero_step_metal")&&доспех.железо[2]<доспех.ткань[2]&&доспех.ткань[1].includes("hero_step_cloth"),доспех);
 check('3в. кованые сапоги лязгают, оружие постукивает о ножны',доспех.сапоги.includes("gear_plate")&&доспех.ножны,доспех);
 check('3г. материал — по имени вещи: кожа, металл, ткань',доспех.мат.join()==="leather,metal,cloth",доспех.мат);

 /* ── 4. записи снаряжения слышны ── */
 const файлы=await page.evaluate(()=>["hero_step_metal","hero_step_leather","hero_step_cloth","gear_plate","gear_blade"].map(r=>SOUND_BANK[r].f).flat());
 const тихие=файлы.map(f=>{const o=spawnSync("ffmpeg",["-nostdin","-hide_banner","-i",path.join(__dirname,"..","sounds",f),"-af","volumedetect","-f","null","-"],{encoding:"utf8"}).stderr||"";
  const m=o.match(/max_volume: (-?[\d.]+) dB/);return {f,дБ:m?+m[1]:-99};}).filter(x=>x.дБ<-3);
 check('4. записи снаряжения звучат в полную силу',файлы.length>=29&&тихие.length===0,{файлов:файлы.length,тихие});

 /* ── 5. тон места ── */
 const тон=await page.evaluate(()=>{
  const t=[];for(const [bx,by] of [[700,900],[1800,2600],[4400,300]]){
   const p={kind:"house",bx,by,stype:"tavern",name:"x",depth:0,x:1,y:1};t.push(+placeStepTone(p).toFixed(3));}
  const p={kind:"house",bx:700,by:900,stype:"tavern",name:"x",depth:0,x:1,y:1};
  const один=new Set();for(let i=0;i<10;i++){p.x=i+1;один.add(placeStepTone(p));}
  return {t,один:один.size};});
 check('5. разные трактиры звучат своим тоном, в одном трактире тон один',new Set(тон.t).size>=2&&тон.один===1,тон);

 /* ── 6–7. стража ── */
 const стража=await page.evaluate(async()=>{
  const r={};
  const уровень=(stype)=>{
   Actors.stop();
   G.place={kind:PLACE_KIND[stype],bx:5000+stype.length*13,by:5200,stype,name:"Проба",depth:0,x:1,y:1};
   const lvl=curLevel();if(!lvl)return false;
   G.place.x=lvl.entry.x;G.place.y=lvl.entry.y;
   Actors.ensure();
   /* Свой ход живые делают по таймеру; здесь шаги зовутся вручную, чтобы
      чужой шаг не попал в замер. */
   clearInterval(Actors.iv);
   return Actors.list.length>0;};
  const звуки=[];const s0=Spatial.role.bind(Spatial);Spatial.role=(role,...a)=>{звуки.push(role);return s0(role,...a);};
  const b0=Bank.play.bind(Bank);Bank.play=(role,o)=>{звуки.push(role);return b0(role,o);};
  r.замок=уровень("castle");
  const g=Actors.list.find(a=>a.kind==="guard");const f=Actors.list.find(a=>a.kind==="folk");
  r.пол=indoorSurface();r.рольПола=SURF_ROLE[r.пол];
  if(g){звуки.length=0;Actors.step(g,2);await new Promise(t=>setTimeout(t,900));r.стражник=звуки.slice();r.след=Actors.lastStep;}
  if(f){звуки.length=0;Actors.step(f,2);await new Promise(t=>setTimeout(t,700));r.горожанин=звуки.slice();}
  /* Двое ближних шагавших — слышны оба. */
  const p=G.place;const люди=Actors.list.filter(a=>a.kind!=="mob");
  люди.forEach((a,i)=>{a.x=p.x+(i%2?1:-1);a.y=p.y+Math.floor(i/2)%3;});
  const шагали=[];const st0=Actors.step.bind(Actors);Actors.step=(a,d)=>{шагали.push(a.id);return true;};
  const fr0=Actors.free.bind(Actors);Actors.free=()=>true;
  Actors.tick();Actors.step=st0;Actors.free=fr0;r.шагали=шагали.length;
  /* В картине мира стража не звучит тварью. */
  r.твари=Scape.around().filter(o=>o.kind==="monster").length;
  r.деревня=уровень("village");
  const g2=Actors.list.find(a=>a.kind==="guard");r.деревняСнаряжение=g2?Actors.gear(g2):null;
  Spatial.role=s0;Bank.play=b0;G.place=null;return r;});
 check('6. стражник ступает по полу замка, звенит кольчугой и лязгает сапогами',
  стража.замок&&Array.isArray(стража.стражник)&&стража.стражник.includes(стража.рольПола)&&стража.стражник.includes("hero_step_metal")&&стража.стражник.includes("gear_plate"),стража);
 check('6б. горожанин ступает без железа; в деревне стража в коже',
  Array.isArray(стража.горожанин)&&стража.горожанин.length>=1&&!стража.горожанин.includes("hero_step_metal")
  &&стража.деревняСнаряжение&&стража.деревняСнаряжение.доспех==="hero_step_leather",стража);
 check('7. слышны двое ближних шагавших, а стража не звучит в картине мира тварью',стража.шагали===2&&стража.твари===0,стража);

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
