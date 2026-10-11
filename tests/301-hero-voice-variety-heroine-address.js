/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 301: ГЕРОЙ ГОВОРИТ РАЗНО, ГЕРОИНЕ — ЖЕНСКОЕ ОБРАЩЕНИЕ (15.0)

   Просьбы игрока: «фразы самого персонажа расширить, чтобы их было больше,
   они были разнообразнее, и записать голосами Gemini»; «выбрал женский пол —
   все реплики, разговоры с торговцами и прочее тоже женским голосом Gemini».
   1. К ходам разговора записаны новые реплики голосами героя; файлы на месте.
   2. Ход разговора звучит разными репликами, одна и та же — не подряд.
   3. Прежний голос (Уверенный): прежняя запись и новые; героиня с ним —
      голос игры, мужского голоса у героини нет.
   4. Строка жителя с обращением: героине — запись с женским обращением,
      герою — прежняя; нет женской записи — житель молчит, строку читает
      голос игры в женском роде.
   5. Живая строка по делу (npcSay): героине житель говорит её своим голосом.
   6. Приветствие и ответ в разговоре героине звучат записью с женским
      обращением (в коде нет запрета на запись строки с обращением).
   7. Ошибок страницы нет.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const SND=path.join(__dirname,'..','sounds');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e).slice(0,700):''));
(async()=>{
 const browser=await chromium.launch();
 const errors=[];
 const p=await (await browser.newContext()).newPage();p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(1000);
 const r=await p.evaluate(()=>{const r={};
  r.голосов=Object.keys(HERO_VOICE_VARS).length;
  r.реплик=Object.values(HERO_VOICE_VARS).reduce((s,m)=>s+Object.values(m).reduce((a,v)=>a+v.length,0),0);
  r.файлы=[];for(const [id,m] of Object.entries(HERO_VOICE_VARS))for(const [ход,vs] of Object.entries(m))for(const [n] of vs)r.файлы.push(`hero_${ход}_${n}_${id}`+VOICE_GEN);
  r.безДлины=r.файлы.filter(f=>!(HERO_VOICE_LEN[f]>0)).length;
  /* 2. голос с вариантами */
  G.hero=null;const h=heroEnsure();h.made=1;
  const [id,ходы]=Object.entries(HERO_VOICE_VARS).find(([id])=>id!=="algieba")||[];
  if(id){const ход=Object.keys(ходы)[0];h.voice=id;h.пол=["kore","aoede","autonoe","vindemiatrix","pulcherrima","laomedeia"].includes(id)?"ж":"м";
   const seq=[];for(let i=0;i<40;i++)seq.push(heroVoicePath(ход));
   r.ход={id,ход,разных:new Set(seq).size,подряд:seq.some((x,i)=>i&&x===seq[i-1]),пример:seq.slice(0,4)};}
  /* 3. прежний голос */
  h.voice="algieba";h.пол="м";const a=new Set();for(let i=0;i<30;i++)a.add(heroVoicePath("torg"));r.алгиеба=[...a];
  h.пол="ж";r.героиняАлгиеба=heroVoicePath("torg");
  /* 4. женское обращение */
  const fem=FEM_NPC.lines||{};r.строкГероине=Object.values(fem).reduce((s,m)=>s+Object.keys(m).length,0);
  let пара=null;
  for(const [роль,m] of Object.entries(fem)){for(const ж of Object.keys(m)){
   const t=Object.keys(VOICE_NPC[роль]||{}).find(x=>x!==ж&&Род.кГероине(x)===ж);if(t){пара={роль,t,ж,файл:m[ж][0]};break;}}if(пара)break;}
  r.пара=пара;
  let без=null;
  for(const [роль,m] of Object.entries(VOICE_NPC)){if(!m||typeof m!=="object"||Array.isArray(m))continue;
   for(const t of Object.keys(m)){const ж=Род.кГероине(t);if(ж!==t&&!m[ж]){без={роль,t};break;}}if(без)break;}
  r.без=без;
  const said=[];const s0=Folk.сказать;Folk.сказать=function(f){said.push(String(f));return true;};
  try{
   h.voice="kore";h.пол="ж";
   if(пара){r.героиня={femLine:femLine(пара.роль,пара.t),реплика:Folk.реплика(пара.роль,пара.t,null,false,{всегда:true}),файл:said[said.length-1]};}
   if(без){said.length=0;r.героиняБез={femLine:femLine(без.роль,без.t),реплика:Folk.реплика(без.роль,без.t,null,false,{всегда:true}),звук:said.length};}
   h.voice="schedar";h.пол="м";
   if(пара){said.length=0;r.герой={femLine:femLine(пара.роль,пара.t),реплика:Folk.реплика(пара.роль,пара.t,null,false,{всегда:true}),файл:said[said.length-1]};}
   /* 5. живая строка по делу */
   const живая=Object.entries(fem).find(([роль])=>Array.isArray(LIVE_LINES[роль]));
   if(живая){const [роль,m]=живая;const ж=Object.keys(m)[0];const t=(LIVE_LINES[роль]||[]).find(x=>Род.кГероине(x)===ж);
    if(t){h.voice="kore";h.пол="ж";const l0=liveLine;liveLine=()=>t;const f0=settings.folk,e0=settings.effects;settings.folk=1;settings.effects=1;said.length=0;
     try{const n={key:"набор301",name:"Житель",x:G.x|0,y:G.y|0,race:"Люди"};const res=npcSay(n,роль,{});r.живая={роль,t,ж,res,файл:said[said.length-1]||null,folkOn:Folk.on()};}
     finally{liveLine=l0;settings.folk=f0;settings.effects=e0;}}}
  }finally{Folk.сказать=s0;}
  /* 6. приветствие и ответ */
  const src=document.documentElement.innerHTML;
  r.приветствие=src.includes('femLine("greet",привет)');r.ответ=src.includes('femLine("dlg",цитата)');
  return r;});
 /* файлы на диске */
 const нетФайлов=r.файлы.filter(f=>!fs.existsSync(path.join(SND,'voice_hero',f+'.flac')));
 let нетЖен=[];
 if(r.пара){const base=r.пара.файл;const d=['voice_npc','gvoice_pack/npc'].find(d=>fs.existsSync(path.join(SND,d,base+'_g.flac'))||fs.existsSync(path.join(SND,d,base+'_v2_g.flac')));if(!d)нетЖен.push(base);}
 check('1. новые реплики героя записаны (голосов, реплик), длительности и файлы на месте',
  r.голосов>=10&&r.реплик>=500&&r.безДлины===0&&нетФайлов.length===0,{голосов:r.голосов,реплик:r.реплик,безДлины:r.безДлины,нетФайлов:нетФайлов.slice(0,5)});
 check('2. ход разговора звучит разными репликами, одна и та же — не подряд',
  r.ход&&r.ход.разных>=3&&!r.ход.подряд,r.ход);
 check('3. Уверенный: прежняя запись и новые; героиня с ним — голос игры',
  r.алгиеба.includes("")&&r.алгиеба.length>=2&&r.героиняАлгиеба===null,{алгиеба:r.алгиеба,героиня:r.героиняАлгиеба});
 check('4а. героине — запись с женским обращением своим голосом жителя',
  r.пара&&r.героиня&&r.героиня.femLine===r.пара.ж&&r.героиня.реплика===true&&new RegExp('^'+r.пара.файл).test(r.героиня.файл||"")&&нетЖен.length===0,{пара:r.пара,героиня:r.героиня,нетЖен});
 check('4б. герою — прежняя запись',
  r.герой&&r.герой.femLine===r.пара.t&&r.герой.реплика===true&&!/_hn/.test(r.герой.файл||""),r.герой);
 check('4в. нет женской записи — житель молчит (строку читает голос игры)',
  !r.без||(r.героиняБез.femLine===null&&r.героиняБез.реплика===false&&r.героиняБез.звук===0),{без:r.без,героиня:r.героиняБез});
 check('5. живая строка по делу: героине — своим голосом с женским обращением',
  !r.живая||(r.живая.res&&r.живая.res.сказал===true&&/_hn/.test(r.живая.файл||"")),r.живая);
 check('6. приветствие и ответ в разговоре: запись с женским обращением годится героине',r.приветствие&&r.ответ,{приветствие:r.приветствие,ответ:r.ответ});
 check('7. ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 results.forEach(x=>console.log(x));
 const f=results.filter(x=>x.startsWith('FAIL')).length;
 console.log(`\n${results.length-f}/${results.length} passed`);
 process.exit(f?1:0);
})().catch(e=>{console.error(e);process.exit(2);});
