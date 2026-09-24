/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 183: КАМНЕМЁТ, УДАР ПО БАШНЕ, НЕЖИТЬ, ПРИЗРАКИ И ВЗРЫВ — ЯРЧЕ

   Просьба игрока: звуки камнемёта, попадания по башне, нежити и части
   призраков заменить на более яркие и качественные, фэнтезийные; один из
   взрывов звучал очень плохо. И проверить, что звуки работают в игре.

   Что было. Выстрел камнемёта и попадание по башне лежали в банке, но игра
   их не звала ни разу. Нежить звучала записями в 22 кГц около 65–100
   кбит/с, стоны призраков — лязгом доспеха в 90 кбит/с, третий взрыв —
   54 кбит/с, два взрыва были космическими.

   ЧТО ПРОВЕРЯЕТСЯ.
   1. У всех десяти ролей только новые записи без потерь (FLAC), и прежних
      в банке больше нет.
   2. Каждая новая запись загружается, декодируется и звучит в полную силу:
      длиннее трети секунды, пик не тише −3 дБ.
   3. Игрок в осаждённой крепости слышит обстрел: выстрел камнемёта и удар
      камня в башню, и голос называет, сколько осталось от стен.
   4. Осада дальнего города звучит камнемётом и ударом в башню.
   5. Нежить, костяки и призраки в бою звучат новыми записями.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const {spawnSync}=require('child_process');const path=require('path');
const results=[];
const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));

const РОЛИ={siege_shot:3,tower_hit:4,foe_undead_die:2,foe_undead_hit:1,foe_undead_pain:1,
 foe_bone_die:1,foe_bone_pain:1,wraith_die:5,wraith_moan:3,oc_blast:1};
const СТАРЫЕ=["mg/siege_shot_01.ogg","mg/tower_hit_01.ogg","foe/foe_undead_die_01.ogg","foe/foe_undead_hit_01.ogg",
 "foe/foe_undead_pain_01.ogg","foe/foe_bone_die_01.ogg","mg/wraith_moan_01.ogg","mg/wraith_die_01.ogg",
 "oc/oc_blast_03.ogg","es/explosion_nuke.ogg","es/explosion_tiny.ogg"];

(async()=>{
 const browser=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await browser.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(process.argv[2]);await page.waitForTimeout(800);
 await page.evaluate(()=>{try{enterGame();G.tutorDone=1;}catch(_){}while(activeLayer())closeTopUI();});

 /* ── 1. банк ── */
 const банк=await page.evaluate(([роли,старые])=>{
  const все=[].concat(...Object.values(SOUND_BANK).map(r=>r.f));
  const новые={};for(const r of Object.keys(роли))новые[r]=SOUND_BANK[r].f.filter(f=>/\.flac$/.test(f));
  return {новые,остались:старые.filter(f=>все.includes(f)),
   boom:SOUND_BANK.es_boom.f.filter(f=>/^oc\/oc_blast_0[56]\.flac$/.test(f)).length};},[РОЛИ,СТАРЫЕ]);
 const нехватка=Object.keys(РОЛИ).filter(r=>банк.новые[r].length<РОЛИ[r]);
 check('1. у десяти ролей новые записи без потерь',нехватка.length===0,{нехватка,новые:банк.новые});
 check('1б. прежних записей в банке нет, в обвале и разломе — взрывы OpenClonk',
  банк.остались.length===0&&банк.boom===2,{остались:банк.остались,boom:банк.boom});

 /* ── 2. каждая запись декодируется и звучит в полную силу ── */
 const файлы=[...new Set([].concat(...Object.values(банк.новые),["oc/oc_blast_05.flac","oc/oc_blast_06.flac"]))];
 /* Страница грузит запись так же, как в игре, — аудиоэлементом; пик меряет
    ffmpeg по самому файлу. */
 const длины=await page.evaluate(файлы=>Promise.all(файлы.map(f=>new Promise(done=>{
  const a=new Audio("sounds/"+f);a.preload="auto";
  const t=setTimeout(()=>done({f,ошибка:"не загрузилась"}),10000);
  a.addEventListener("canplaythrough",()=>{clearTimeout(t);done({f,сек:+a.duration.toFixed(2)});},{once:true});
  a.addEventListener("error",()=>{clearTimeout(t);done({f,ошибка:"код "+((a.error&&a.error.code)||"?")});},{once:true});}))),файлы);
 const звук=длины.map(x=>{if(x.ошибка)return x;
  const o=spawnSync("ffmpeg",["-hide_banner","-i",path.join(__dirname,"..","sounds",x.f),"-af","volumedetect","-f","null","-"],{encoding:"utf8"}).stderr||"";
  const m=o.match(/max_volume: (-?[\d.]+) dB/);return {...x,дБ:m?+m[1]:-99};});
 const плохие=звук.filter(x=>x.ошибка||x.сек<0.33||x.дБ<-3);
 check('2. каждая новая запись загружается, декодируется и звучит в полную силу',
  звук.length>=23&&плохие.length===0,{всего:звук.length,плохие});

 /* ── 3. осаждённая крепость ── */
 const крепость=await page.evaluate(()=>{
  const f=FORTS[0];const st=Forts.state(f.id);
  st.owner=0;st.siege={by:1,day:1};st.walls=90;st.supplies=90;st.ward=0;
  G.place=null;G.ship=null;G.x=f.x;G.y=f.y;
  window.__роли=[];const b0=Bank.play.bind(Bank);Bank.play=(r,o)=>{window.__роли.push(r);return b0(r,o);};
  window.__said=[];const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{window.__said.push(String(t));return s0(t,o);};
  const тут=Forts.here();G.day=4;Forts.tick();
  return {тут:тут&&тут.id===f.id,стены:st.walls};});
 await page.waitForTimeout(2100);
 const обстрел=await page.evaluate(()=>({роли:window.__роли.slice(),сказано:window.__said.join(" ")}));
 check('3. в осаждённой крепости слышен выстрел камнемёта и удар камня в башню',
  крепость.тут&&обстрел.роли.some(r=>/^(siege_shot|siege_onager|oc_catapult)$/.test(r))&&обстрел.роли.includes("tower_hit"),
  {крепость,роли:обстрел.роли});
 check('3б. голос называет, сколько осталось от стен',
  new RegExp("Стены "+крепость.стены+" из ста").test(обстрел.сказано),обстрел.сказано.slice(0,200));

 /* ── 4. осада дальнего города звучит камнемётом и ударом в башню ── */
 const город=await page.evaluate(()=>{
  const src=document.documentElement.innerHTML;const i=src.indexOf("город под осадой");
  const кусок=src.slice(Math.max(0,i-900),i);
  return {камнемёт:/Bank\.play\("siege_shot"/.test(кусок),башня:/Bank\.play\("tower_hit"/.test(кусок)};});
 check('4. осада дальнего города звучит камнемётом и ударом в башню',город.камнемёт&&город.башня,город);

 /* ── 5. нежить, костяки и призраки в бою ── */
 const бой=await page.evaluate(()=>{
  const файл=r=>(SOUND_BANK[r]||{f:[]}).f.some(f=>/\.flac$/.test(f));
  const голоса=["bone","spirit","undead"].map(k=>({k,роли:Object.values(MONSTER_PROFILE[k]||{})}));
  return голоса.map(g=>({k:g.k,новые:g.роли.filter(r=>/^(foe_undead|foe_bone|wraith)_/.test(r)&&файл(r)).length}));});
 check('5. нежить, костяки и призраки в бою звучат новыми записями',бой.every(g=>g.новые>=2),бой);

 check('страница не бросила ни одной ошибки',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
