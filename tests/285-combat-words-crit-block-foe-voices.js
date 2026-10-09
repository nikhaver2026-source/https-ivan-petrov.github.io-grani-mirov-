/* ═══════════════════════════════════════════════════════════════════════
   НАБОР 285: 13.5 — БОЛЬШЕ СЛОВ ГЕРОЯ В БОЮ, СОКРУШИТЕЛЬНЫЙ УДАР И ЩИТ,
   ОТВЕТЫ РАЗУМНЫХ ТВАРЕЙ ИХ ГОЛОСАМИ

   Просьба игрока: расширить список фраз, которые герой говорит в бою, и
   дозаписать реплики персонажей, у которых их нет (чтобы не подхватывался
   сторонний синтезатор).

   1. Общих сутей (для всякой твари) больше прежних 174 — не меньше трёхсот;
      у каждого мига и тона — не меньше десяти строк (у новых — не меньше шести).
   2. Сокрушительный удар герой отмечает своим словом (миг crit), удар,
      принятый щитом, — своим (миг block); у героини — в женском роде.
   3. Разумная тварь отвечает в перепалке записью своего голоса, если строка
      записана (пулы foe_<род>_otvet и foe_<род>_kray), строкой — субтитр;
      если не записана — прежней сборной строкой голосом игры.
   ═══════════════════════════════════════════════════════════════════════ */
const {chromium}=require('playwright');
const results=[];const check=(n,c,e)=>results.push((c?'PASS':'FAIL')+' — '+n+(e!==undefined?' :: '+JSON.stringify(e):''));
(async()=>{
 const browser=await chromium.launch();
 const p=await (await browser.newContext()).newPage();
 const errors=[];p.on('pageerror',e=>errors.push(String(e)));
 await p.goto(process.argv[2]);await p.waitForTimeout(900);
 const r=await p.evaluate(async()=>{try{enterGame();}catch(_){}while(activeLayer())closeTopUI();window.maybeEvent=()=>{};
  settings.heroTalk=1;settings.speech=1;
  const out={};
  /* 1 */
  const все=new Set();let мало=[];
  for(const [миг,o] of Object.entries(ПЕР_СУТЬ))for(const тон of ПЕР_ТОНА){const a=o[тон]||[];a.forEach(x=>все.add(x));
   const нужно=(миг==="crit"||миг==="block")?6:10;if(a.length<нужно)мало.push(`${миг}/${тон}:${a.length}`);}
  out.сутей=все.size;out.мало=мало;
  /* 2 */
  const m={id:"wolf",n:"Волк",hp:60,lvl:1};G.inCombat=true;G.combat={m,hp:60,key:"0,0",alt:0};
  G.hero=Object.assign({},G.hero||{},{made:1,пол:"м",race:"human",voice:"rasalgethi"});
  const rnd=Math.random;Math.random=()=>0.01;
  Перепалка.было=0;Перепалка.last=null;Перепалка.удар(m,true);out.крит=Перепалка.last&&Перепалка.last.миг;out.критТекст=Перепалка.last&&Перепалка.last.t;
  G.hp=G.hpMax;Перепалка.было=0;Перепалка.last=null;Перепалка.рана(m,1,true);out.щит=Перепалка.last&&Перепалка.last.миг;
  G.hero.пол="ж";G.hero.voice="vindemiatrix";
  const жен=[];for(let i=0;i<40;i++){Перепалка.было=0;Перепалка.рана(m,1,true);if(Перепалка.last)жен.push(Перепалка.last.t);}
  Math.random=rnd;
  out.героиня=жен.find(t=>/Я закрыл/.test(t))||"";out.мужВЖен=жен.filter(t=>/Я закрылся/.test(t)).length;
  /* 3 */
  const разб=Object.assign({},MONSTERS.find(x=>x.id==="bandit")||{id:"bandit",n:"Разбойник"},{hp:60});G.combat={m:разб,hp:60,key:"0,0",alt:0};
  const пул=VOICE_NPC.foe_bandit_otvet;out.пул=пул?Object.keys(пул).length:0;
  const сыграно=[];const fs=Folk.реплика.bind(Folk);Folk.реплика=(роль,t,где,ж,o)=>{сыграно.push(роль);return true;};
  const сказано=[];const ns=Speech.say.bind(Speech);Speech.say=(t,o)=>{сказано.push(String(t));return true;};
  Перепалка.last=null;const ок=Перепалка.враг("ответ",разб);out.ответ={ок,роль:сыграно[0]||"",запись:Перепалка.last&&Перепалка.last.запись||null,голосом:сказано.length};
  Folk.реплика=fs;Speech.say=ns;G.combat=null;G.inCombat=false;
  return out;});
 check('1. сутей у героя больше прежнего, у каждого мига и тона достаточно строк',r.сутей>=300&&!r.мало.length,{сутей:r.сутей,мало:r.мало});
 check('2. сокрушительный удар и щит — свои слова героя; у героини — в женском роде',
  r.крит==="crit"&&r.щит==="block"&&r.мужВЖен===0,{крит:r.крит,критТекст:r.критТекст,щит:r.щит,героиня:r.героиня,мужВЖен:r.мужВЖен});
 check('3. тварь отвечает записью своего голоса (если строка записана), иначе — голосом игры',
  r.ответ.ок&&(r.пул?(r.ответ.роль==="foe_bandit_otvet"&&r.ответ.запись==="foe_bandit_otvet"):r.ответ.голосом>0),r);
 check('Ошибок страницы нет',errors.length===0,errors.slice(0,3));
 await browser.close();
 console.log(results.join('\n'));
 process.exit(results.some(r=>r.startsWith('FAIL'))?1:0);
})();
