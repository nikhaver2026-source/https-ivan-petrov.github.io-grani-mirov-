/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 266: 10.0 — БОЕВОЕ СЛОВО ГЕРОЯ ЕГО ГОЛОСОМ, ТВАРИ ГОВОРЯТ РАЗНЕЕ

   Просьба игрока: записать реплики героя в бою (голосом Gemini, по голосу
   «Настроек персонажа») и разнообразить реплики разумных тварей в бою.

   1. Хеш фразы в игре совпадает с хешем записи (FNV-1a, 36-ричный).
   2. Опись HERO_FIGHT непуста, у каждой записи есть длительность, файлы
      лежат на месте.
   3. Голос с записями: герой в бою звучит записью (hero_f_…), строка —
      субтитром; голос без записей — прежняя сборная реплика голосом игры.
   4. У каждого из десяти родов разумных тварей строк больше прежнего:
      угроз и ударов не меньше десяти, крика боли и мольбы — семи, насмешки
      — шести, последних слов — пяти; ответов в перепалке — не меньше восьми.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');const fs=require('fs'),path=require('path');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 const r=await p.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  const out={};
  out.хеш=heroFightHash("Встань и дерись.");
  const голоса=Object.keys(HERO_FIGHT);out.голоса=голоса;
  const пути=[];голоса.forEach(v=>String(HERO_FIGHT[v]).split(" ").forEach(k=>пути.push(`hero_f_${k}_${v}_g`)));
  out.записей=пути.length;out.безДлины=пути.filter(x=>!(HERO_VOICE_LEN[x]>0.3)).length;
  const проба=пути.filter((x,i)=>i%Math.max(1,Math.floor(пути.length/6))===0).slice(0,6);
  out.проба=проба;
  /* бой: голос с записями и без */
  const m={id:"wolf",n:"Волк",hp:30,lvl:1};
  const сказано=[],голосом=[];const fs=Folk.сказать.bind(Folk),ns=window.narrate;
  Folk.сказать=(путь,n,o)=>{сказано.push(путь);return true;};
  const s0=Speech.say.bind(Speech);Speech.say=(t,o)=>{голосом.push(String(t));return true;};
  G.combat={m,hp:30};G.hero=G.hero||{};
  const v0=голоса[0];G.hero.voice=v0;G.hero.пол=HERO_VOICES.ж.some(x=>x.id===v0)?"ж":"м";
  let есть=0;for(let i=0;i<12;i++){Перепалка.было=0;if(Перепалка.сказать("start",m)&&Перепалка.last.запись)есть++;}
  out.записью=есть;out.путь=сказано[0]||"";out.субтитр=(document.getElementById("subText")||{}).textContent||"";
  const без=HERO_VOICES.м.concat(HERO_VOICES.ж).map(x=>x.id).find(id=>!HERO_FIGHT[id]);
  if(без){G.hero.voice=без;G.hero.пол=HERO_VOICES.ж.some(x=>x.id===без)?"ж":"м";голосом.length=0;сказано.length=0;Перепалка.было=0;
   out.безЗаписи={сказал:Перепалка.сказать("start",m),запись:Перепалка.last.запись,голосом:голосом.length,записей:сказано.length};}
  Folk.сказать=fs;Speech.say=s0;G.combat=null;
  /* твари */
  const мало=[];const нужно={start:10,attack:10,hurt:7,low:7,taunt:6,death:5};
  Object.keys(FOE_TALK_IDS).forEach(k=>Object.entries(нужно).forEach(([c,n])=>{const L=LIVE_LINES[`foe_${k}_${c}`]||[];if(L.length<n)мало.push(`${k}_${c}:${L.length}`);}));
  Object.entries(ПЕР_ВРАГ).forEach(([k,d])=>{if((d.ответ||[]).length<8)мало.push(`${k}_ответ:${d.ответ.length}`);});
  out.мало=мало;out.всего=Перепалка.всего();
  return out;});
 r.файлы=(r.проба||[]).map(x=>{try{return fs.statSync(path.join(__dirname,'..','sounds','voice_hero',x+'.flac')).size>2000;}catch(_){return false;}});
 check('1. хеш фразы в игре — как у записи',r.хеш==="1q8ez1f",r.хеш);
 check('2. опись боевых записей героя непуста, длительности есть, файлы на месте',
  r.записей>=100&&r.безДлины===0&&r.файлы.length>0&&r.файлы.every(Boolean),{записей:r.записей,безДлины:r.безДлины,файлы:r.файлы,голоса:r.голоса});
 check('3. с записью герой звучит своим голосом (hero_f_…) и субтитром; без записи — прежняя реплика голосом игры',
  r.записью>=10&&/^hero_f_/.test(r.путь)&&/^Вы: «/.test(r.субтитр)&&(!r.безЗаписи||(r.безЗаписи.сказал&&!r.безЗаписи.запись&&r.безЗаписи.голосом>0&&r.безЗаписи.записей===0)),r);
 check('4. у десяти родов разумных тварей строк больше прежнего',!r.мало.length&&r.всего.враги>1098,{мало:r.мало,всего:r.всего});
 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
