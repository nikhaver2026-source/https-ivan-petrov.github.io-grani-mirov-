/* ═══════════════════════════════════════════════════════════════════════════
   14.6: ИСПРАВЛЕНИЯ ПО ПРОСЬБАМ ИГРОКА
   ───────────────────────────────────────────────────────────────────────────
   1. Итог задания договаривается. Задания ярусов, чертогов, Сводов, Заморья,
      Сплетения, Перекроя и материков говорят итог («Загадка решена! 40
      золота…») и тем же действием открывают окно. Прежде имя окна обрывало
      итог на первом слове — игрок не слышал ни что сделано, ни награды.
      Теперь их реплики — «итог» (см. Speech.enqueue): окно звучит следом.
   2. Награды. За починку и запуск механизма яруса (генератор, клапан,
      шестерни…) — разовая награда: опыт, золото, материал яруса; за
      механизм чертога — опыт и золото. Решённая загадка и выполненное
      поручение яруса дают ещё и опыт.
   3. Вещи яруса у лестницы. Вещи (загадки, механизмы, замки, диковины —
      чаша для омовения, курганная дверь…) больше не встают вплотную к
      лестнице. А если вещь рядом, а игрок стоит на лестнице или у факела,
      двойное касание открывает вещь; лестница — кнопкой в её окне.
   4. Загадка яруса открывается двойным касанием сразу — без промежуточной
      карточки; вещь в двух шагах тоже отвечает на двойное касание.
   5. Слоты заклинаний: в любой из двенадцати слотов — любое изученное
      заклинание (новее, сильнее, массовое или точечное). Панель магии,
      «Сменить заклинание в слоте»; то же — «Магия» → «Слоты заклинаний».
   6. Шаги и крылья тварей — со своей стороны: в подземелье слышен каждый
      бродячий, сделавший шаг, а не один ближний; летучие хлопают крыльями,
      дух проносится вихрем; прыжок хищника в бою слышен с места
      приземления; голоса твари в начале боя — из её точки; пока идёт
      схватка, твари округи молчат.
   7. Приручение: корм ищется по всей сумке (вяленое мясо — тоже мясо);
      живого зверя можно приручить без боя; шаг на клетку зверя — встреча,
      а не бой: бой начинается, когда игрок вынимает оружие (хищник может
      напасть и сам, как прежде); не вышло — игра говорит почему.
   8. Клавиши Windows: Alt+цифра — слоты и вне боя; B — где цель маяка,
      Shift+B — погасить маяк; маяк не твердит расстояние словами.
   9. Зелья одного вида — одной стопкой; пьётся лучшая склянка.
  10. Щелчки ползунка и переключателя — из памяти, без задержки.
  11. «Выбросить» со счётом: свайп или стрелки вверх и вниз — сколько.
  12. Сигналы интерфейса не молчат и через Bank.play.
  13. Машина пространства: «Войти в кольца» запускает и переносит.
  14. Музыка подземелий: тёмная, и у каждого подземелья своя.
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── 1. Итог задания — «итог» для единого обработчика речи ── */
safeFn(()=>{const mods=[typeof Deep!=="undefined"?Deep:null,typeof Svody!=="undefined"?Svody:null,typeof Zamorye!=="undefined"?Zamorye:null,
  typeof Spletenie!=="undefined"?Spletenie:null,typeof Perekroy!=="undefined"?Perekroy:null,typeof Mater!=="undefined"?Mater:null];
 for(const M of mods){if(!M||typeof M.say!=="function")continue;const s0=M.say;M.say=function(t,o){return s0.call(this,t,Object.assign({итог:true},o||{}));};}});
safeFn(()=>{Chertog.say=function(t){if(t)narrate(t,{interrupt:true,итог:true});return t;};});

/* ── 2. Награды ── */
const FIX_GOLD=g=>`${g} ${plural(g,"золотой","золотых","золотых")}`;
/* Механизм яруса: первая починка, первый запуск, снятая порча или разобранный завал. */
function fixMechReward(s,x,m,before,st){
 try{
  const ok=st==="ok"||st==="active"||(st==="off"&&(before==="cursed"||before==="blocked"));
  if(!ok||before===st)return "";
  x.mrew=x.mrew||{};if(x.mrew[m.id])return "";x.mrew[m.id]=Number(G.day)||1;
  const tier=Math.max(1,Number(m.tier)||1);const xp=15+tier*5,g=10+tier*6;
  const b=safeFn(()=>DEEP_BIOME_BY_ID[s.tiers[tier].b],null);const res=b&&b.ресурсы&&b.ресурсы[1];
  G.xp=(Number(G.xp)||0)+xp;G.gold=(Number(G.gold)||0)+g;if(res)G.inv[res]=(Number(G.inv[res])||0)+2;
  safeFn(()=>checkLevelUp());safeFn(()=>Bank.play("arte_coins",{gain:0.45,maxSec:2}));
  return `Награда за работу: опыт +${xp}, ${FIX_GOLD(g)}${res?`, ${res} ×2`:""}.`;
 }catch(_){return "";}}
{const ma=Deep.mechAct;Deep.mechAct=function(id,a){
 const s=safeFn(()=>this.here(),null);const x=s&&safeFn(()=>this.st(s),null);const m=s&&s.mechs&&s.mechs.find(z=>z.id===id);
 if(!m||!x)return ma.apply(this,arguments);
 const before=this.mst(x,m);let extra="";const setM0=this.setM,say0=this.say;
 this.setM=function(xx,mm,st){const r=setM0.apply(this,arguments);if(mm===m&&!extra)extra=fixMechReward(s,x,m,before,st);return r;};
 this.say=function(t,o){if(extra){t=(t?String(t)+" ":"")+extra;extra="";}return say0.call(this,t,o);};
 try{return ma.apply(this,arguments);}
 finally{this.setM=setM0;this.say=say0;if(extra){const e=extra;extra="";this.say(e);}}};}
/* Загадка яруса: к награде — опыт. */
{const ps=Deep.pzSolve;Deep.pzSolve=function(s,x,p){
 const xp=20+Math.max(1,Number(p&&p.tier)||1)*6;G.xp=(Number(G.xp)||0)+xp;safeFn(()=>checkLevelUp());
 const say0=this.say;this.say=function(t,o){if(/^Загадка решена!/.test(String(t)))t=String(t).replace(/\.\s*$/,"")+`; опыт +${xp}.`;return say0.call(this,t,o);};
 try{return ps.apply(this,arguments);}finally{this.say=say0;}};}
/* Поручение яруса: к награде — опыт. */
{const qd=Deep.questDone;Deep.questDone=function(s,x,q,extra){
 const was=!!(q&&q.done);const r=qd.apply(this,arguments);
 if(r&&!was){const xp=30+Math.max(1,Number(q.tier)||1)*8;G.xp=(Number(G.xp)||0)+xp;safeFn(()=>checkLevelUp());
  return String(r).replace(" выполнено: ",` выполнено: опыт +${xp}; `);}
 return r;};}
/* Механизм чертога: первый запуск — опыт и золото. */
safeFn(()=>{const E=InstanceMechanismEngine;const set0=E.set;E.set=function(c,id,st,why){
 const prev=safeFn(()=>this.state(c,id),null);const r=set0.apply(this,arguments);
 try{if(st==="ACTIVE"&&prev!=="ACTIVE"&&prev!=="OVERLOADED"&&/запуск|почин|ремонт/.test(String(why||""))){
  const F=Chertog.fs(c.r.floor);F.mrew=F.mrew||{};
  if(!F.mrew[id]){F.mrew[id]=1;const lv=Math.max(1,Number(c.s&&c.s.level)||Number(G.level)||1);const xp=12+lv*3,g=8+lv*4;
   G.xp=(Number(G.xp)||0)+xp;G.gold=(Number(G.gold)||0)+g;safeFn(()=>checkLevelUp());
   return (r?String(r)+" ":"")+`Награда за механизм: опыт +${xp}, ${FIX_GOLD(g)}.`;}}}catch(_){}
 return r;};});
/* Головоломка чертога: к тайнику или ходу — опыт. */
safeFn(()=>{const P=InstancePuzzleEngine;const s0=P.solved;P.solved=function(c){
 const xp=15+Math.max(1,Number(c&&c.s&&c.s.level)||1)*4;G.xp=(Number(G.xp)||0)+xp;safeFn(()=>checkLevelUp());
 const cs=Chertog.say;Chertog.say=function(t){return cs.call(this,String(t||"")+` Опыт +${xp}.`);};
 try{return s0.apply(this,arguments);}finally{Chertog.say=cs;}};});

/* ── 3–4. Вещи яруса: двойное касание ── */
{const uh=Deep.useHere;Deep.useHere=function(){
 if(!this.on())return false;
 if(safeFn(()=>this.npcNear(1),null))return uh.apply(this,arguments);
 const r=safeFn(()=>this.elNear(2),null);if(!r)return uh.apply(this,arguments);
 if(r.e.t==="puzzle"){this.puzzle(r.e.ref.id);return true;}
 this.el(r.e.t+":"+(r.e.ref.id||""));return true;};}
/* На лестнице или у факела, а вещь яруса вплотную: двойное касание — вещи. */
{const uh3=useHere;useHere=function(){
 try{const p=G.place;
  if(p&&!G.ship&&!(Array.isArray(G.loot)&&G.loot.length)&&Deep.on()){const t=tileAt(curLevel(),p.x,p.y);
   if(t==="<"||t===">"||t==="T"){const r=Deep.elNear(1);
    if(r){if(r.e.t==="puzzle")Deep.puzzle(r.e.ref.id);else Deep.el(r.e.t+":"+(r.e.ref.id||""));return true;}}}}catch(_){}
 return uh3.apply(this,arguments);};}
/* Окно яруса на лестнице — с кнопкой самой лестницы. */
function fixStairTile(){try{const p=G.place;if(!p)return null;const t=tileAt(curLevel(),p.x,p.y);return t==="<"||t===">"?t:null;}catch(_){return null;}}
{const sh=Deep.show;Deep.show=function(title,html,сказать){
 const t=fixStairTile();
 if(t)html=String(html||"")+this.btn("stairs",t===">"?"Спуститься по лестнице":((Number(G.place.depth)||0)>0?"Подняться по лестнице":"Выйти наверх"));
 return sh.call(this,title,html,сказать);};}
{const dc=Deep.cmd;Deep.cmd=function(a){
 if(String(a||"")==="stairs"){const t=fixStairTile();safeFn(()=>closeTopUI());const dir=safeFn(()=>lastMoveDir,null)||"N";
  if(t===">")return startFlight(1,dir);if(t==="<")return (Number(G.place.depth)||0)>0?startFlight(-1,dir):leavePlace();
  narrate("Лестницы под ногами нет.",{interrupt:true});return false;}
 return dc.apply(this,arguments);};}

/* ── 5. Слоты заклинаний ── */
const MSLOT_N=12;
/* Слоты героя. Сначала — как было всегда: слот N держит N-е заклинание
   списка; дальше игрок ставит в любой слот любое изученное. */
function mslots(){
 if(!Array.isArray(G.mslots)||G.mslots.length!==MSLOT_N){const old=Array.isArray(G.mslots)?G.mslots:[];
  G.mslots=Array.from({length:MSLOT_N},(_,i)=>old[i]!==undefined?old[i]:(SPELLS[i]?SPELLS[i].n:null));}
 return G.mslots;}
/* Номер заклинания слота в общем списке (для castSpell); −1 — слот пуст. */
function mslotCat(i){const n=mslots()[i];if(!n)return -1;return SPELLS.findIndex(s=>s&&s.n===n);}
/* Как творить слот: жестом на телефоне, клавишей на компьютере. */
function mslotHow(i){
 if(safeFn(()=>isDesktopApp(),false)||GUIDE_PC)return `клавиша ${i<9?i+1:["0","минус","равно"][i-9]}`;
 const f=i<4?"одним пальцем":i<8?"двумя пальцами":"тремя пальцами";
 const d=i<8?["вверх","вправо","вниз","влево"]:["вверх","вправо","влево","вниз"];
 return `${f} ${d[i%4]} в панели магии`;}
function mspellInfo(sp){
 try{const sc=sp.school&&safeFn(()=>MSCHOOL_BY_ID[sp.school],null);const р=[];
  if(sc&&sc.n)р.push(`школа: ${String(sc.n).toLowerCase()}`);
  if(sp.d)р.push(String(sp.d));else if(sp.о)р.push(String(sp.о));
  return р.length?р.join("; ")+".":"";}catch(_){return "";}}
magicSlotSwipe=function(fingers,dir){
 const row=MAGIC_SLOT_MAP[fingers];if(!row||row[dir]===undefined)return false;
 const i=row[dir];const ci=mslotCat(i);const sp=SPELLS[ci];
 safeFn(()=>UI.natStep("ui_select",0.5,0.88+i*0.045));
 if(!sp){narrate(`Слот ${i+1} пуст. Заклинание в слот ставится в панели магии: «Сменить заклинание в слоте».`,{interrupt:true});return true;}
 narrate(`Слот ${i+1}: ${sp.n}.`,{interrupt:true});safeFn(()=>castSpell(ci));return true;};
safeOpenMagicPanel=function(mode){
 try{
  let m=document.getElementById("magicPanel");
  if(!m){
   m=document.createElement("div");m.id="magicPanel";m.className="overlay";m.hidden=true;m.setAttribute("role","dialog");m.setAttribute("aria-modal","true");m.setAttribute("aria-label","Панель магии");
   m.innerHTML='<div class="sheet"><h2>Магия</h2><div id="magicSlots" class="list"></div><p>Двенадцать слотов по свайпам: один палец — 1–4, два пальца — 5–8, три пальца — 9–12 (вверх, вправо, влево, вниз). Двойное касание четырьмя пальцами — закрыть.</p><button type="button" data-magic-close>Закрыть</button></div>';
   document.body.appendChild(m);m.querySelector('[data-magic-close]').addEventListener('click',()=>closeMagicPanel());}
  const был=!m.hidden;mode=mode||{};
  const list=m.querySelector('#magicSlots');list.innerHTML='';
  const known=Array.isArray(G.spells)?G.spells:[];
  safeFn(()=>registerCustomSpells());
  const S=mslots();
  const add=(text,speak,fn,idx)=>{const b=document.createElement('button');b.type='button';b.className='item';
   if(idx!=null&&idx>=0)b.dataset.magicIndex=idx;b.dataset.speak=speak;b.textContent=text;
   b.addEventListener('click',()=>{try{fn();}catch(e){narrate('Не удалось.');}});list.appendChild(b);return b;};
  const рез=sp=>known.includes(sp.n)?safeFn(()=>" Созвучие: "+Resonance.слово(sp)+".",""):"";
  let речь="";
  if(mode.pick!=null){
   /* Выбор заклинания для слота */
   const i=mode.pick;const cur=S[i];
   const мои=known.map(n=>SPELLS.find(s=>s&&s.n===n)).filter(Boolean);
   for(const sp of мои){const тут=cur===sp.n;
    add(`${sp.n}, мана ${sp.cost}${тут?" (сейчас в слоте)":""}`,`${sp.n}. Мана ${sp.cost}.${рез(sp)} ${mspellInfo(sp)} ${тут?"Уже в этом слоте.":`Поставить в слот ${i+1}.`}`.replace(/\s+/g," ").trim(),
     ()=>{S[i]=sp.n;safeFn(()=>saveGame(true));safeFn(()=>UI.nat("ui_activate",0.5));safeOpenMagicPanel({said:`В слоте ${i+1} теперь «${sp.n}»: ${mslotHow(i)}.`});});}
   if(!мои.length)add("Изученных заклинаний нет","Изученных заклинаний пока нет: их учат в Академии и у наставников, дают книги и свитки.",()=>{});
   if(cur)add(`Освободить слот ${i+1}`,`Освободить слот ${i+1}: «${cur}» уйдёт из слота, но останется изученным.`,
    ()=>{S[i]=null;safeFn(()=>saveGame(true));safeOpenMagicPanel({said:`Слот ${i+1} свободен.`});});
   add("Назад","Назад к слотам.",()=>safeOpenMagicPanel({slots:true}));
   речь=`Слот ${i+1}, ${mslotHow(i)}: ${cur?`сейчас «${cur}»`:"пуст"}. Выберите заклинание: изученных ${мои.length}.`;
  }else if(mode.slots){
   /* Двенадцать слотов — сменить любой */
   for(let i=0;i<MSLOT_N;i++){const n=S[i];
    add(`Слот ${i+1}: ${n||"пусто"} — сменить`,`Слот ${i+1}, ${mslotHow(i)}: ${n?`«${n}»${known.includes(n)?"":" (не изучено)"}`:"пусто"}. Двойное касание — выбрать другое заклинание.`,()=>safeOpenMagicPanel({pick:i}));}
   add("Назад","Назад к панели магии.",()=>safeOpenMagicPanel());
   речь="Смена заклинаний в слотах: выберите слот.";
  }else{
   /* Панель: слоты, смена, остальные заклинания, вложенные чары */
   for(let i=0;i<MSLOT_N;i++){const ci=mslotCat(i);const sp=SPELLS[ci];
    if(sp)add(`${i+1}. ${sp.n}${known.includes(sp.n)?'':' (не изучено)'}`,`Слот ${i+1}: ${sp.n}. Мана ${sp.cost}.${рез(sp)}`,()=>castSpell(ci),ci);
    else add(`${i+1}. пусто`,`Слот ${i+1} пуст. Двойное касание — поставить заклинание.`,()=>safeOpenMagicPanel({pick:i}));}
   add("Сменить заклинание в слоте","Сменить заклинание в слоте: в любой из двенадцати слотов — любое изученное заклинание.",()=>safeOpenMagicPanel({slots:true}));
   const вСлотах=new Set(S.filter(Boolean));
   SPELLS.forEach((sp,ci)=>{if(!sp||вСлотах.has(sp.n))return;const kn=known.includes(sp.n);
    add(`${sp.n}${kn?'':' (не изучено)'}`,`${sp.n}. Мана ${sp.cost}.${рез(sp)}${kn?"":" Не изучено."}`,()=>castSpell(ci),ci);});
   safeFn(()=>{const мои=chargedList();
    мои.forEach((it,k)=>{const c=CARRIER_BY_ID[it.вид];if(!c||!c.заряды)return;
     add(`${chargedName(it)} — ${it.заряд} из ${it.макс}`,chargedLine(it)+" Двойное касание — применить.",()=>{chargedUse(k);safeOpenMagicPanel();});});});
   речь=был?"":"Панель магии открыта. "+magicSlotHint();
  }
  m.hidden=false;if(!был){m.setAttribute('aria-hidden','false');UI.open();}
  const first=list.querySelector('button');if(first)first.focus();
  const п=[mode.said,речь].filter(Boolean).join(" ");if(п)narrate(п,{interrupt:true});
  return true;
 }catch(e){try{console.error('Magic panel recovery',e);narrate('Панель магии временно недоступна.');}catch(x){}return false;}};
/* «Магия» → «Слоты заклинаний»: сменить слот и вне боя. */
Object.assign(CMD,{mslots(){return safeOpenMagicPanel({slots:true});}});
safeFn(()=>{const g=AM_GROUPS.find(x=>x[0]==="Магия");if(g&&!g[1].some(z=>z[0]==="mslots"))g[1].unshift(["mslots","Слоты заклинаний"]);});
safeFn(()=>{const av=amAvailable;amAvailable=matKeep(av,function(cmd){if(cmd==="mslots")return true;return av.apply(this,arguments);});});

/* ── 6. Шаги и крылья тварей — со своей стороны ──
   Жалоба игрока: «не слышно, как некоторые монстры ходят или летают —
   справа, слева, спереди, сзади; слышен звук, а самого перемещения нет».
   Причины были такие. В подземелье звучал только ближний бродячий: прочие
   шли молча, а шаг ближнего повторялся, даже когда он стоял. Летучие
   ступали ногами, дух — двадцатисекундным сквозняком, у которого стороны не
   разобрать. Прыжок хищника в бою переносил тварь беззвучно. Рык «рядом
   кто-то движется» и часть голосов твари в начале боя звучали посередине
   головы. А голоса соседних тварей мира продолжали звучать поверх схватки и
   сбивали, где тот, с кем бьёшься. */
/* Чем звучит перемещение твари: шаг её рода, крылья летучей, вихрь духа.
   легко — без тяжёлой поступи громады (шаг на поле боя). */
function foeMoveRole(m,легко){
 try{
  if(!m)return null;
  const есть=r=>!!r&&safeFn(()=>Bank.has(r),false);
  const имя=String(m.id||"")+" "+String(m.база||"")+" "+String(m.n||"");
  const род=safeFn(()=>foeFamily(m),"beast");
  if(safeFn(()=>isMoth(m),false)||/bloodbat|(^|[_ ])bats?([_ ]|$)|нетопыр|летуч[а-яё]* мыш|кровав[а-яё]* мыш/i.test(имя))
   return есть("oc_bat_flutter")?"oc_bat_flutter":null;
  if(род==="spirit")return ["sv_shadow","magic_woosh"].find(есть)||null;
  if(род==="bird"||safeFn(()=>foeFlies(m),false))
   return (род==="dragon"?["wyrm_wing","sp_wings","raptor_wing"]:["raptor_wing","wyrm_wing"]).find(есть)||null;
  const prof=MONSTER_PROFILE[род]||{};
  if(!легко&&["giant","dragon","construct"].includes(род)&&есть("stomp"))return "stomp";
  return есть(prof.step)?prof.step:(есть("oc_step_hard")?"oc_step_hard":null);
 }catch(_){return null;}}
/* Второй слой шага («движение»): летучей и духу он не нужен — крылья и вихрь
   сами движение; костяк гремит костями, а не бьёт. */
function foeMoveLayer(m){
 try{const род=foeFamily(m);
  if(род==="spirit"||род==="bird"||safeFn(()=>foeFlies(m),false)||safeFn(()=>isMoth(m),false))return null;
  if(род==="bone")return Bank.has("zm_bone")?"zm_bone":null;
  return (MONSTER_PROFILE[род]||{}).move||null;}catch(_){return null;}}
/* Голос присутствия: «я здесь» — дыхание, шипение, шорох, хруст костей. */
function foePresence(m){
 try{const род=foeFamily(m);
  const V=FOE_VOCAL_BREATH[род]?safeFn(()=>FoeVoices.of(m),null):null;
  if(V&&Bank.has(V.idle))return {role:V.idle,o:{fixed:true,seed:V.v,rate:V.rate}};
  const prof=MONSTER_PROFILE[род]||{};
  const r=род==="bone"?(Bank.has("zm_bone")?"zm_bone":prof.step):(род==="humanoid"||род==="bird")?prof.move:prof.breath;
  return r&&r!=="deep_wind"&&Bank.has(r)?{role:r,o:{}}:null;}catch(_){return null;}}
let foeCueAt=0;
const ВИХРИ=new WeakMap();
/* Поле боя: шаг летучей — крылья, дух — вихрь (не чаще раза в три секунды,
   иначе вихрь сливается в ровный шум), костяк на ходу гремит костями. */
safeFn(()=>{const f0=foeProfileCue;
 foeProfileCue=matKeep(f0,function(m,cue,opts){
  if(m&&(cue==="step"||cue==="move")&&!(FOE_CUE_BY_ID[cue]&&FOE_CUE_BY_ID[cue][m.id])){
   const род=safeFn(()=>foeFamily(m),"beast");
   const летит=род==="bird"||safeFn(()=>foeFlies(m),false);
   let r=null;
   if(род==="spirit"){
    if(cue==="move"){const now=Date.now();if(now-(ВИХРИ.get(m)||0)<3000)return false;ВИХРИ.set(m,now);}
    r=foeMoveRole(m,true);}
   else if(летит&&cue==="step")r=foeMoveRole(m,true);
   else if(род==="bone"&&cue==="move")r=foeMoveLayer(m);
   if(r){
    if(!settings.effects||!Bank.enabled)return false;
    G.lastFoeCue={id:m.id,family:род,cue,role:r};foeCueAt=Date.now();
    return foeCue(r,Object.assign({gain:0.55,maxSec:cue==="step"?1.8:2.2,kind:"combat",pitchVar:0.05},opts||{}));}}
  const ok=f0.apply(this,arguments);if(ok)foeCueAt=Date.now();return ok;});});
/* Шаг игрока на поле боя: тварь отзывается со своего места — слышно, где
   она теперь, справа или слева, впереди или позади. Не чаще раза в 0,9 с и
   не поверх её собственного звука. */
safeFn(()=>{const st0=Arena.step;
 Arena.step=matKeep(st0,function(dir){
  const ok=st0.apply(this,arguments);
  safeFn(()=>{
   if(!ok||!G.inCombat||!G.combat||!settings.effects)return;const a=G.combat.arena;if(!a||a.wind)return;
   const now=Date.now();if(now-foeCueAt<600||now-(Number(a.слышна)||0)<900)return;a.слышна=now;
   const pr=foePresence(G.combat.m);if(!pr)return;
   const keep=G.lastFoeCue;foeCue(pr.role,Object.assign({gain:0.34,maxSec:1.6,kind:"combat"},pr.o));G.lastFoeCue=keep;});
  return ok;});});
/* Пять тварей со своими записями (дракон, паук, призрак, гоблин, огр)
   кричали посередине головы: запись шла мимо размещения. Теперь — из точки
   твари на поле боя. */
safeFn(()=>{const p0=playRealMonsterCue;
 playRealMonsterCue=matKeep(p0,function(m,cue,vol){
  try{
   const set=m&&REAL_MONSTER_SFX[m.id];if(vol===undefined)vol=0.7;
   const люди=(cue==="damage"||cue==="death")&&["bandit","pirate"].includes(safeFn(()=>FoeTalk.who(m),null));
   if(set&&set[cue]&&!люди&&settings.effects&&G.inCombat&&G.combat&&Spatial.on()){
    AE.ensure();const ctx=Spatial.ensure();
    if(ctx){const sp=foeSpot();
     safeFn(()=>monsterLayer(m,cue,vol));
     const s=new SFX();try{s.master.disconnect();}catch(_){}
     const pn=Spatial.node(sp.dx,sp.dy,sp.dz);s.master.connect(pn);pn.connect(s.bus);s.nodes.push(pn);
     s.sample(set[cue],0,vol);setTimeout(()=>{try{s.stop(.25);}catch(e){}},4200);
     foeCueAt=Date.now();return s;}}
  }catch(_){}
  return p0.apply(this,arguments);});});
/* Бродячие подземелья: слышен каждый, кто сделал шаг, — со своей клетки,
   ближние первыми, вразбивку, чтобы шаги не слипались; стоящий рядом
   изредка выдаёт себя дыханием. */
function mobSteps(A,nearest){
 const p=G.place;if(!p||!settings.effects)return;
 const рад=safeFn(()=>beastRad(),8);
 const все=A.list.filter(a=>a.kind==="mob").map(a=>({a,d:Math.max(Math.abs(a.x-p.x),Math.abs(a.y-p.y))}))
  .filter(o=>o.d<=рад).sort((x,y)=>x.d-y.d);
 /* До шести за ход, через 0,13 с друг за другом: ход живых длится полторы секунды. */
 const идут=все.filter(o=>o.a.шёл).slice(0,6);
 идут.forEach((o,i)=>{const go=()=>safeFn(()=>{if(!G.place||G.inCombat)return;const P=G.place;
   A.sound(o.a,Math.max(Math.abs(o.a.x-P.x),Math.abs(o.a.y-P.y)));});
  if(i)setTimeout(go,i*130);else go();});
 const стоит=все.find(o=>!o.a.шёл&&o.d<=3);
 if(стоит){стоит.a.дых=(Number(стоит.a.дых)||0)+1;if(стоит.a.дых%3===1)safeFn(()=>A.breath(стоит.a));}}
Actors.breath=function(a){
 const p=G.place;if(!p||!a||!settings.effects||!Bank.enabled)return false;
 const pr=foePresence(a.m);if(!pr)return false;
 const d=Math.max(Math.abs(a.x-p.x),Math.abs(a.y-p.y));
 return safeFn(()=>Spatial.role(pr.role,a.x-p.x,a.y-p.y,Object.assign({gain:Math.max(0.25,0.6-d*0.06),maxSec:2.4},pr.o)),false);};
/* Пока идёт схватка, округа молчит: голоса соседних тварей, колокола и
   маяки построек с их клеток мира путали, где тот, с кем бьёшься. Фон места
   остаётся, «Прислушаться» работает и в бою. */
safeFn(()=>{const tk0=Scape.tick;
 Scape.tick=matKeep(tk0,function(){if(G.inCombat&&G.combat)return 0;return tk0.apply(this,arguments);});});
/* Летучая тварь мира то подаёт голос, то бьёт крыльями — со своей высоты. */
safeFn(()=>{const ar0=Scape.around;
 Scape.around=matKeep(ar0,function(){
  const out=ar0.apply(this,arguments)||[];
  if(!G.place&&!G.inCombat)for(const o of out){
   if(o.kind!=="monster"||!(Number(o.dz)>0)||Math.random()<0.5)continue;
   const c=safeFn(()=>cellContent(G.x+o.dx,G.y+o.dy),null);const r=c&&c.monster?foeMoveRole(c.monster,true):null;
   if(r){o.role=r;o.voice=null;}}
  return out;});});

/* ── 7. Приручение ──
   Жалобы игрока: «мясо в инвентаре есть, а игра всё равно говорит, что
   требуется мясо»; «пусть игра говорит, почему не удаётся приручить — зверь
   мёртв или ещё что-то»; «дай приручать зверя вне боя, через меню
   действий; бой — по желанию игрока, когда он вынимает меч; зверь может
   напасть и сам, как прежде».
   Корм искался по одному слову: «мясо» — ровно так, а купленное у торговца
   «Вяленое мясо» или «Хлеб» с большой буквы корм не считались. Теперь корм
   ищется по всей сумке. Шаг на клетку зверя — встреча, а не бой: зверь
   насторожен, его можно приручить; вынули оружие — бой; хищник может
   броситься и сам. Каждый отказ назван: зверь пал в бою, ушёл, не зверь,
   слишком силён, нет корма, полны стойла, идёт бой, не повезло — и с каким
   шансом. */
const ZV_FOOD_ALIAS={мясо:/мяс/i,рыба:/рыб/i,хлеб:/хлеб|сухар/i,мёд:/мёд|^мед$/i,ягоды:/ягод/i,зерно:/зерн|овёс|овес|пшениц|ячмен/i,
 трава:/^трава$|^сено$|клевер/i,кость:/^кост/i,кристалл:/кристалл/i,эфир:/эфир/i};
/* Что в сумке годится этим кормом: сперва то, что зовётся ровно так, потом похожее; вещи — в последнюю очередь. */
function zvFoodRows(k){
 const want=String(k||"").toLowerCase(),re=ZV_FOOD_ALIAS[k];
 const rows=safeFn(()=>invAll(),[])||[];
 return rows.filter(r=>{
  if(!["res","rare","fish","plant","item"].includes(r.kind))return false;
  const n=String(r.name||"");if(/похл[её]бк|вытяжк|зелье|семен|саженц/i.test(n))return false;
  if(n.toLowerCase()===want)return true;
  if(k==="рыба"&&r.kind==="fish")return true;
  if(k==="трава"&&r.kind==="plant")return true;
  return !!(re&&re.test(n));})
  .sort((a,b)=>((String(b.name).toLowerCase()===want)-(String(a.name).toLowerCase()===want))||((a.kind==="item")-(b.kind==="item")));}
/* Корм для рода: любимое первым. {k — вид корма, name — что именно в сумке} */
function zvFoodPick(f){for(const k of (f&&f.корм)||[]){const r=zvFoodRows(k)[0];if(r)return {k,name:r.name};}return null;}
function zvFoodTake(k){const r=zvFoodRows(k)[0];if(!r)return null;invRemoveItem(r);return r.name;}
/* Что взято — в винительном: «ест рыбу», «берёт траву», «сушёную рыбу». */
function zvFoodSay(k,взято){const n=String(взято||k);const t=n.toLowerCase()===k?k:n.toLowerCase();
 return t.split(" ").map(w=>/ая$/.test(w)?w.slice(0,-2)+"ую":/яя$/.test(w)?w.slice(0,-2)+"юю":/[^аеёиоуыэюя]а$/.test(w)?w.slice(0,-1)+"у":/[^аеёиоуыэюям]я$/.test(w)?w.slice(0,-1)+"ю":w).join(" ");}
function zvFoodWhere(){return " Корм продают в городском зверинце; вяленое мясо и хлеб — у торговцев.";}
/* Кормление питомцев — тем же поиском по сумке. */
Zver.feed=matKeep(Zver.feed,function(u){const a=this.byUid(u);if(!a)return "Такого зверя нет.";const f=this.fam(a);
 const есть=zvFoodPick(f);
 if(!есть)return `${a.n} ест ${f.корм.join(" или ")}, а такого в сумке нет.${zvFoodWhere()}`;
 if((Number(a.сыт)||0)>=95)return `${a.n} сыт${f.g==="ж"?"а":""} и отворачивается от корма.`;
 const k=есть.k,люб=k===f.корм[0];const взято=zvFoodTake(k);
 const голоден=(Number(a.сыт)||0)<20;a.сыт=Math.min(100,(Number(a.сыт)||0)+(люб?45:25));a.верн=Math.min(100,(Number(a.верн)||0)+(люб?6:3)+(голоден?4:0));   /* (15.0) голодный зверь благодарнее */
 /* звук еды — живые записи своим трактом (14.6, ZvSnd); фраза о новом уровне не пропадает */
 const рост=this.xp(a,люб?6:3)||"";if(!safeFn(()=>(ZvSnd.feed(a,k,люб),true),false)){this.play(f.звук,{gain:0.5});safeFn(()=>Bank.play("oc_munch",{gain:0.4,maxSec:2}));}
 return `${a.n} ест ${zvFoodSay(k,взято)}${люб?" — любимый корм":""}. Сытость ${Math.round(a.сыт)}, верность ${Math.round(a.верн)}.${рост}`;});
/* Живой зверь рядом: на своей клетке или вплотную — в мире; бродячий вплотную — в подземелье. */
function zvLiveBeast(){
 try{
  if(G.inCombat||G.ship)return null;
  const out=[];
  if(G.place){const p=G.place;
   for(const a of (Actors.list||[]))if(a.kind==="mob"){const d=Math.max(Math.abs(a.x-p.x),Math.abs(a.y-p.y));
    if(d<=1)out.push({m:a.m,где:"ярус",a,d});}}
  else for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
   const x=G.x+dx,y=G.y+dy;if(G.cleared[x+","+y])continue;
   const c=safeFn(()=>cellContent(x,y),null);const m=c&&c.monster;if(!m)continue;
   if(!safeFn(()=>foeReachable(m),true))continue;
   out.push({m,где:"мир",x,y,c,d:Math.max(Math.abs(dx),Math.abs(dy))});}
  out.sort((a,b)=>(!!Zver.tameFamilyFor(b.m)-!!Zver.tameFamilyFor(a.m))||a.d-b.d);
  return out[0]||null;
 }catch(_){return null;}}
const BeastMeet={cur:null,
 /* Шаг на клетку зверя: не бой сразу, а встреча — если зверь не бросится сам. */
 meet(c){
  try{
   const m=c&&c.monster;if(!m||G.inCombat||G.place||G.ship)return false;
   const fam=Zver.tameFamilyFor(m);if(!fam||m.boss)return false;
   if(G.weaponDrawn)return false;            /* оружие в руках — это и есть выбор боя */
   const f=ZV_FAMILY_BY_ID[fam]||{};
   const хищник=((f.роли||[]).indexOf("hunter")>=0);
   const злость=(хищник?0.3:0.12)+(safeFn(()=>isNight(),false)?0.1:0)+Math.max(0,((Number(m.lvl)||1)-(Number(G.level)||1))*0.03);
   if(Math.random()<Math.min(0.6,злость))return false;   /* зверь нападает сам — как прежде */
   this.cur={x:G.x,y:G.y,day:G.day,id:m.id};
   safeFn(()=>{const r=bankFoeRole(m);if(r)Spatial.role(r,0,-0.6,foeVoiceOpts(m,{gain:0.6,maxSec:3}));});
   const корм=(f.корм||[]).join(" или ");
   narrate(`Перед вами ${m.n}: зверь насторожен, но не нападает. Приручить — двойное касание или «Приручить зверя» в меню действий${корм?`, ест ${корм}`:""}. Бой — выньте оружие.`,{interrupt:true});
   return true;}catch(_){return false;}},
 here(){const b=this.cur;if(!b||b.day!==G.day||b.x!==G.x||b.y!==G.y||G.place||G.ship||G.inCombat)return null;
  const c=safeFn(()=>cellContent(G.x,G.y),null);if(!c||!c.monster||G.cleared[G.x+","+G.y])return null;return c;},
 fight(L,сказ){
  this.cur=null;if(G.inCombat)return false;
  if(сказ)narrate(сказ,{interrupt:true});
  if(L&&L.где==="ярус"&&L.a){safeFn(()=>Actors.attack(L.a));return true;}
  const c=L&&L.c?L.c:null;if(!c||!c.monster)return false;
  if(L.x!==G.x||L.y!==G.y){G.x=L.x;G.y=L.y;}
  startCombat(c,{close:true});safeFn(()=>refresh());return true;}};
/* Приручить живого зверя — без боя. */
function zvTameLive(L){
 const z=Zver,s=z.st(),m=L.m,имя=m.n||"Зверь";
 const fam=z.tameFamilyFor(m);
 if(!fam)return `${имя} — не зверь: людей, нежить, духов и демонов кормом не приручить.`;
 if(m.boss)return `${имя} — владыка этих мест: такого кормом не приручить.`;
 if(s.list.length>=z.cap())return `Стойла полны: зверей ${s.list.length} из ${z.cap()}. Отпустите кого-нибудь в зверинце.`;
 const ключ=L.где==="мир"?L.x+","+L.y:"a"+(L.a&&L.a.id);
 if(s.live&&s.live.key===ключ&&s.live.day===G.day&&s.live.tries>=3)return `${имя} больше не берёт корма из ваших рук: сегодня он не подпустит.`;
 const f=ZV_FAMILY_BY_ID[fam];
 const еда=zvFoodPick(f);
 if(!еда)return `${имя} ест ${f.корм.join(" или ")} — в сумке этого нет.${zvFoodWhere()}`;
 const lvl=L.где==="ярус"?Math.max(1,(Number(G.level)||1)+(Number(G.place&&G.place.depth)||1)-1):Math.max(1,Number(m.lvl)||1);
 const разн=lvl-(Number(G.level)||1);
 if(разн>=6)return `${имя} много сильнее вас — уровень ${lvl}: такой не подпустит. Подрастите или одолейте его в бою.`;
 const vs=ZV_VARIANTS.filter(v=>zvBreedOK(f,v));const p=safeFn(()=>Director.landVariant(),"wild");
 const v=vs.find(x=>x.id===p)||vs.find(x=>x.id==="wild")||vs[0];const breed=fam+"_"+v.id;const b=ZV_BREED_BY_ID[breed]||{};
 const люб=еда.k===f.корм[0];const взято=zvFoodTake(еда.k);const что=zvFoodSay(еда.k,взято);
 const шанс=Math.max(0.05,Math.min(0.8,0.3+0.02*(Number(G.level)||1)-0.06*(Number(b.ред)||0)+(люб?0.15:0)-0.04*Math.max(0,разн)));
 if(!s.live||s.live.key!==ключ||s.live.day!==G.day)s.live={key:ключ,day:G.day,tries:0};
 s.live.tries++;
 if(Math.random()<шанс){
  const a=z.make(breed,{lvl:Math.max(1,Math.round(lvl*0.7)),верн:35});s.live=null;BeastMeet.cur=null;
  /* зверь уходит с клетки — за вами */
  if(L.где==="мир"){G.cleared[L.x+","+L.y]=true;if(L.c)L.c.monster=null;}
  else Actors.list=Actors.list.filter(o=>o!==L.a);
  z.play(f.звук,{gain:0.7});safeFn(()=>z.fanfare());safeFn(()=>journal(`Приручён зверь: ${a.n}.`));safeFn(()=>Director.note("tame",a.n));
  return `${имя} берёт ${что} из рук — и остаётся с вами. Теперь это ваш зверь: ${a.n}, уровень ${a.lvl}.`;}
 const pct=Math.round(шанс*100);z.play(f.звук,{gain:0.55});
 /* Хищник может и броситься — бой, как прежде. */
 if((f.роли||[]).indexOf("hunter")>=0&&Math.random()<0.3){s.live=null;
  setTimeout(()=>safeFn(()=>BeastMeet.fight(L,"")),700);
  return `${имя} хватает ${что} — и скалится: не вышло, шанс был около ${pct} процентов. Зверь бросается на вас!`;}
 if(s.live.tries>=3)return `${имя} берёт ${что} и отходит: не вышло и в третий раз, шанс был около ${pct} процентов. Сегодня он больше не подпустит.`;
 return `${имя} берёт ${что}, но не подпускает ближе: не вышло, шанс был около ${pct} процентов. Можно попробовать ещё — или вынуть оружие.`;}
/* «Приручить зверя»: поверженный, что остался ждать; живой рядом; иначе — почему нельзя. */
Zver.tame=matKeep(Zver.tame,function(){
 const s=this.st();
 if(G.inCombat&&G.combat)return `Идёт бой${G.combat.m&&G.combat.m.n?` с «${G.combat.m.n}»`:""}: в схватке не приручают. Зверя приручают живым до боя — подойдите без оружия — или поверженного после победы.`;
 const o=s.tame;
 if(o&&(o.day!==G.day||Math.abs(o.x-G.x)+Math.abs(o.y-G.y)>2)){s.tame=null;
  const L0=zvLiveBeast();if(L0)return zvTameLive(L0);
  return "Поверженный зверь ушёл, не дождавшись: он ждёт только до конца дня и только рядом с местом боя.";}
 if(o){
  const b=ZV_BREED_BY_ID[o.breed],f=ZV_FAMILY_BY_ID[b.fam];
  const еда=zvFoodPick(f);
  if(!еда)return `${b.n} ест ${f.корм.join(" или ")} — в сумке этого нет; без корма к нему не подойти.${zvFoodWhere()}`;
  if(s.list.length>=this.cap())return `Стойла полны: зверей ${s.list.length} из ${this.cap()}. Отпустите кого-нибудь в зверинце.`;
  const люб=еда.k===f.корм[0];const взято=zvFoodTake(еда.k);const что=zvFoodSay(еда.k,взято);
  const шанс=Math.min(0.9,0.45+0.02*(Number(G.level)||1)-0.06*b.ред+(люб?0.15:0));
  if(Math.random()>шанс){o.tries=(Number(o.tries)||0)+1;this.play(f.звук);const pct=Math.round(шанс*100);
   if(o.tries>=3){s.tame=null;return `${b.n} берёт ${что} и уходит в сторону: не вышло и в третий раз, шанс был около ${pct} процентов. Зверь ушёл.`;}
   return `${b.n} берёт ${что}, но не подпускает: не вышло, шанс был около ${pct} процентов. Можно попробовать ещё, попыток осталось ${3-o.tries}.`;}
  s.tame=null;const a=this.make(o.breed,{lvl:o.lvl,верн:45});this.play(f.звук,{gain:0.7});
  safeFn(()=>journal(`Приручён зверь: ${a.n}.`));safeFn(()=>Director.note("tame",a.n));
  return `${a.n} берёт ${что} из рук и идёт за вами. Теперь он ваш: уровень ${a.lvl}.`;}
 const L=zvLiveBeast();if(L)return zvTameLive(L);
 const d=s.lastDead;
 if(d&&d.day===G.day&&Math.abs(d.x-G.x)+Math.abs(d.y-G.y)<=3)
  return `${d.n} пал в бою — мёртвого не приручить. Приручают живого: подойдите к зверю без оружия; или поверженного — если после победы он остался ждать.`;
 return "Рядом нет зверя. Приручают живого: подойдите к зверю без оружия и выберите «Приручить зверя»; или поверженного — если после победы он остался ждать.";});
/* Павший зверь запоминается: «Приручить зверя» скажет, что он пал. */
Zver.onWin=matKeep(Zver.onWin,(w0=>function(m){const r=w0.apply(this,arguments);
 safeFn(()=>{const s=this.st();if(s.tame)s.lastDead=null;else if(m&&this.tameFamilyFor(m))s.lastDead={n:m.n||"Зверь",day:G.day,x:G.x,y:G.y};});
 return r;})(Zver.onWin));
/* «Приручить зверя» в меню действий — всегда: даже когда приручать некого, игрок слышит почему. */
safeFn(()=>{const av=amAvailable;amAvailable=matKeep(av,function(cmd){if(cmd==="zvtame")return true;return av.apply(this,arguments);});});
/* Оружие вынуто при встрече со зверем — бой, по воле игрока. */
safeFn(()=>{const d0=drawWeapon;drawWeapon=matKeep(d0,function(){const был=!!G.weaponDrawn;const r=d0.apply(this,arguments);
 if(r&&!был&&G.weaponDrawn&&BeastMeet.here())setTimeout(()=>safeFn(()=>{const c=BeastMeet.here();if(!c||G.inCombat||!G.weaponDrawn)return;
  BeastMeet.fight({где:"мир",c,x:G.x,y:G.y},`${c.monster.n} видит клинок и бросается на вас!`);}),700);
 return r;});});
/* Двойное касание при встрече со зверем — приручить. */
safeFn(()=>{const u0=useHere;useHere=matKeep(u0,function(){
 if(BeastMeet.here()){safeFn(()=>CMD.zvtame());return true;}
 return u0.apply(this,arguments);});});

/* ── 8. Клавиши приложения для Windows ──
   Жалоба игрока: «клавиши “Выпить зелье” — Alt+1 один вид зелий, Alt+2
   второй — не срабатывают». Слоты быстрого доступа с клавиатуры работали
   только в бою: вне боя Alt с цифрой молчал, хотя сам слот пьётся и там.
   Теперь Alt+1 … Alt+равно — слоты всюду, в бою и вне боя.
   Вторая просьба: «Shift+B — погасить маяк, B — направление до цели; пусть
   сторону и расстояние называет клавиша, а не постоянное объявление, —
   маяк и так звенит». B теперь называет цель маяка, её сторону и
   расстояние и подаёт один удар маяка с её стороны; Shift+B гасит маяк.
   Сам маяк по-прежнему говорит только «цель рядом», когда дошли. */
function beaconWhere(){
 const t=safeFn(()=>TargetBeacon.t,null);
 if(!t){narrate("Маяк не горит: цели нет. Выберите её в осмотре — свайп двумя пальцами влево или клавиша V — или на карте.",{interrupt:true,cat:"ui",user:true});return true;}
 if(t.place!==TargetBeacon.here()){TargetBeacon.stop(true);narrate("Маяк цели снят: цель осталась позади, в другом месте.",{interrupt:true,cat:"ui",user:true});return true;}
 const r=TargetBeacon.rel();if(!r)return true;
 if(TargetBeacon.reached(r)){TargetBeacon.arrive(r);return true;}
 TargetBeacon.n++;setTimeout(()=>safeFn(()=>TargetBeacon.ping(r,true)),300);
 narrate(`Цель: ${t.n}, ${stepWords(r.d)}, ${dirAtWord(r.dx,r.dy)}.`,{interrupt:true,cat:"approach",user:true});
 return true;}
safeFn(()=>{if(!GEST_ACTION_BY_ID.beaconwhere){
 const a={id:"beaconwhere",n:"где цель маяка",о:"сторона и расстояние до цели и один удар маяка",делать:()=>{beaconWhere();return true;}};
 const i=GEST_ACTIONS.findIndex(x=>x.id==="beaconoff");GEST_ACTIONS.splice(i>=0?i:GEST_ACTIONS.length,0,a);GEST_ACTION_BY_ID.beaconwhere=a;}});
/* Таблица клавиш объявлена ниже по файлу: правим её, когда весь сценарий прочитан. */
Promise.resolve().then(()=>safeFn(()=>{
 const off=KB_BY_ID.beaconoff;if(off)off.def=["Shift+KeyB"];
 if(!KB_BY_ID.beaconwhere){const a={id:"beaconwhere",g:"Мир",n:"где цель маяка",о:"сторона и расстояние до цели",def:["KeyB"],ctx:"any",run:KB_GEST("beaconwhere")};
  const i=KB_ACTIONS.findIndex(x=>x.id==="beaconoff");KB_ACTIONS.splice(i>=0?i:KB_ACTIONS.length,0,a);KB_BY_ID.beaconwhere=a;}
 /* Подписи прежние: их текст записан голосом Gemini; что слоты работают и вне боя, говорит руководство. */
KB_ACTIONS.forEach(a=>{if(/^c_slot\d+$/.test(a.id))a.ctx="any";});}));

/* ── 9. Зелья одного вида — одной стопкой ──
   Просьба игрока: «все зелья, которые игрок подбирает, — в одной стопке, как
   зелье здоровья; сейчас они по отдельности, и нужное приходится искать».
   Каждая склянка помнит своё качество и срок, поэтому хранится отдельно, но
   в котомке и в окне «Зелья» зелья одного вида теперь — одна строка со
   счётом: «зелье восстанавливающее ману: 5 шт.». Выпить, продать, передать —
   берётся лучшая годная склянка; выбросить — сколько скажете, начиная с
   худшей. */
function potionKey(rec){return String(rec&&rec.id||"")+"|"+String(rec&&rec.имя||"");}
/* Лучшая — годная, затем крепче, затем та, что раньше выдохнется. */
function potionBetter(a,b){
 const ea=!!safeFn(()=>potionExpired(a),false),eb=!!safeFn(()=>potionExpired(b),false);
 if(ea!==eb)return ea?1:-1;
 const qa=Number(a&&a.q)||1,qb=Number(b&&b.q)||1;if(qa!==qb)return qb-qa;
 return ((Number(a.день)||0)+(Number(a.срок)||0))-((Number(b.день)||0)+(Number(b.срок)||0));}
function potionGroup(rec){const k=potionKey(rec);return potionsOf().filter(x=>x&&potionKey(x)===k).sort(potionBetter);}
function potionStackWords(g){
 const best=g[0];const разные=new Set(g.map(x=>potionQualityWord(x.q))).size>1;
 const выд=g.filter(x=>safeFn(()=>potionExpired(x),false)).length;
 return `${g.length} шт., ${разные?"лучшее — ":""}${potionQualityWord(best.q)}${выд?`, выдохлось ${выд}`:""}`;}
safeFn(()=>{const ia0=invAll;invAll=matKeep(ia0,function(){
 const rows=ia0.apply(this,arguments);if(!Array.isArray(rows))return rows;
 const L=potionsOf();const было=new Set();const out=[];
 for(const r of rows){
  if(r.kind!=="potion"||!r.it){out.push(r);continue;}
  const k=potionKey(r.it);if(было.has(k))continue;было.add(k);
  const g=potionGroup(r.it);if(g.length<2){out.push(r);continue;}
  const c=(typeof INV_SECTION_BY_ID!=="undefined"&&(INV_SECTION_BY_ID[r.раздел]||INV_SECTION_BY_ID.other))||{з:""};
  out.push(Object.assign({},r,{key:String(L.indexOf(g[0])),it:g[0],n:g.length,group:g,label:`${c.з} ${r.name}: ${potionStackWords(g)}`}));}
 return out;});});
/* Выбросить из стопки — сколько сказано, начиная с худшей склянки. */
safeFn(()=>{const d0=invDropN;invDropN=matKeep(d0,function(row,n,done){
 if(row&&row.kind==="potion"&&Array.isArray(row.group)&&row.group.length>1&&row.cat!=="quest"){
  const L=potionsOf();const k=Math.max(1,Math.min(row.group.length,Number(n)||1));
  row.group.slice(-k).forEach(rec=>{const i=L.indexOf(rec);if(i>=0)L.splice(i,1);});
  safeFn(()=>Bank.play("oc_bubble",{gain:0.4,maxSec:1}));
  return done(`Выброшено: ${row.name} ×${k}. Осталось ${row.group.length-k}.`);}
 return d0.apply(this,arguments);});});
/* Опыт из двух склянок одной стопки: вторая — следующая склянка, а не та же. */
safeFn(()=>{const m0=mixDo;mixDo=matKeep(m0,function(a,b,place){
 try{if(a&&b&&a.row&&b.row&&a.row.kind==="potion"&&b.row.kind==="potion"&&a.row.key===b.row.key&&Array.isArray(a.row.group)&&a.row.group.length>1){
  const rec=a.row.group[1];b=Object.assign({},b,{row:Object.assign({},b.row,{key:String(potionsOf().indexOf(rec)),it:rec,group:null})});}}catch(_){}
 return m0.call(this,a,b,place);});});
/* Слот быстрого доступа и Q пьют лучшую годную склянку вида. */
safeFn(()=>{const c0=cbDrink;cbDrink=matKeep(c0,function(x){
 if(x&&x.kind==="potion"){const L=potionsOf();const g=L.filter(r=>r&&r.id===x.id).sort(potionBetter);
  if(g.length){const бой=!!(G.inCombat&&G.combat);safeFn(()=>drinkPotion(L.indexOf(g[0]),true));if(бой)safeFn(()=>updateCombat());return true;}}
 return c0.apply(this,arguments);});});
/* Окно «Зелья» — тоже стопками. */
safeFn(()=>{const r0=renderPotions;renderPotions=matKeep(r0,function(){
 r0.apply(this,arguments);
 try{
  const box=document.getElementById("potBody");if(!box)return;
  const L=potionsOf();const q=t=>String(t).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;");
  const стопки=[];const было=new Set();
  L.forEach(rec=>{if(!rec)return;const k=potionKey(rec);if(было.has(k))return;было.add(k);стопки.push(potionGroup(rec));});
  const кнопки=[...box.querySelectorAll('[data-cmd^="drinkpotion:"]')];if(!кнопки.length)return;
  const html=стопки.map(g=>{const rec=g[0],i=L.indexOf(rec),pt=POTION_BY_ID[rec.id]||{n:rec.id},exp=safeFn(()=>potionExpired(rec),false);
   const имя=rec.имя?potionName(rec):"Зелье "+pt.n;
   const сколько=g.length>1?`: ${potionStackWords(g)}`:`: качество ${potionQualityWord(rec.q)}`;
   const speak=`${имя}${rec.id==="brew"&&rec.смесь&&rec.смесь.о?` — ${rec.смесь.о}`:""}${сколько}, устойчивость ${Math.round(rec.стаб*100)} из ста, ${exp?"выдохлось":"годно до "+(rec.день+rec.срок)+"-го дня"}.`;
   return `<button class="item" data-cmd="drinkpotion:${i}" data-speak="${q(speak)} Выпить.">${q(potionName(rec))}${g.length>1?` ×${g.length}`:""} — ${potionQualityWord(rec.q)}, ${Math.round(rec.стаб*100)}/100${exp?", выдохлось":""}</button>`;}).join("");
  const tmp=document.createElement("div");tmp.innerHTML=html;
  кнопки[0].before(...tmp.childNodes);кнопки.forEach(b=>b.remove());
  const шапка=box.querySelector(".list-line");if(шапка&&стопки.length!==L.length){const t=`Зелий в сумке: ${L.length}, видов ${стопки.length}.`;шапка.textContent=шапка.textContent.replace(/Зелий в сумке: \d+\./,t);
   шапка.dataset.speak=String(шапка.dataset.speak||"").replace(/В сумке \d+\./,`В сумке ${L.length}, видов ${стопки.length}.`);}
 }catch(_){}});});

/* ── 10. Щелчки интерфейса — без задержки ──
   Жалоба игрока: «звук ползунка — и вверх, и вниз — не работает». Тик
   ползунка и щелчок переключателя загружались новым плеером при каждом
   касании; на телефоне плеер открывается сотни миллисекунд, а слово с новым
   значением идёт сразу — и речь телефона глушит запоздавший тик. Теперь
   четыре записи щелчков (ползунок вверх и вниз, переключатель вкл и выкл)
   лежат в самой игре (ТИК_ЗАПИСИ, вставляются при сборке из sounds/ui):
   сеть странице закрыта (connect-src 'none'), а так их не надо качать.
   Они разобраны в память с первым касанием и звучат в тот же миг, раньше
   слова. Пока память не готова, работает прежний путь. */
const ТИК_ЗАПИСИ=/*@ТИК_ЗАПИСИ@*/{};
const Тик={buf:{},ждёт:{},журнал:[],
 ключи:["ui_slider_up","ui_slider_down","ui_toggle_on","ui_toggle_off"],
 загрузить(){const ctx=safeFn(()=>AE.ctx,null);if(!ctx||typeof atob!=="function")return;
  for(const k of this.ключи){if(this.buf[k]||this.ждёт[k])continue;const b64=ТИК_ЗАПИСИ[k];if(!b64)continue;this.ждёт[k]=1;
   try{const bin=atob(b64);const u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    const ок=b=>{this.buf[k]=b;},нет=()=>{this.ждёт[k]=0;};
    const pr=ctx.decodeAudioData(u.buffer,ок,нет);if(pr&&typeof pr.catch==="function")pr.catch(нет);}catch(_){this.ждёт[k]=0;}}},
 играть(k,о){const ctx=safeFn(()=>AE.ctx,null),b=this.buf[k];if(!ctx||!b||ctx.state!=="running")return false;
  try{const v=Math.min(1,Number(settings.uiVol)===0?0:(Number(settings.uiVol)||0.9))*safeFn(()=>Bank.master(),1)*(о.gain===undefined?0.55:о.gain);
   const src=ctx.createBufferSource();src.buffer=b;src.playbackRate.value=Math.max(0.5,Math.min(2,Number(о.rate)||1));
   const g=ctx.createGain();g.gain.value=v;src.connect(g);g.connect(ctx.destination);src.start();return true;}catch(_){return false;}}};
safeFn(()=>{const щ0=Звук.щелчок.bind(Звук);
 Звук.щелчок=function(ключ,о){о=о||{};Тик.журнал.push([UI_BANK[ключ],о.rate||0]);if(Тик.журнал.length>40)Тик.журнал.shift();
  if(Тик.играть(ключ,о))return true;safeFn(()=>Тик.загрузить());return щ0(ключ,о);};});
/* Разобрать щелчки заранее: сразу, если звук уже открыт, и с первым касанием или клавишей. */
safeFn(()=>{safeFn(()=>Тик.загрузить());const раз=()=>setTimeout(()=>safeFn(()=>{AE.ensure();Тик.загрузить();}),50);
 ["pointerdown","keydown","touchend"].forEach(t=>document.addEventListener(t,раз,{once:true,capture:true}));});

/* ── 11. «Выбросить» — сколько, свайпом или стрелками ──
   Просьба игрока: «встал на “Выбросить” — свайпом вверх или вниз выбираю,
   сколько выбросить: одну, две и так далее; так у всех вещей; в Windows —
   стрелками вверх и вниз, подтверждение — Enter». Прежнее окно «Выбросить
   сколько?» к тому же не работало: выбор «Несколько: 5» отвечал «такой
   вещи уже нет» (номер в команде путался с родом вещи).
   Теперь у стопки (ресурсы, травы, рыба, детали, зелья, одинаковые вещи)
   пункт «Выбросить» сам держит счёт: «Выбросить: 1 из 7». Свайп вверх или
   вниз (стрелки вверх и вниз) — больше или меньше, двойное касание (Enter)
   — выбросить столько. Одинаковые вещи в суме — тоже одной строкой. */
const DropCount={kind:null,key:null,n:1,max:1,
 total(row){if(!row)return 1;if(Array.isArray(row.group))return row.group.length;return Math.max(1,Number(row.n)||1);},
 set(kind,key,n,max){this.kind=kind;this.key=key;this.max=max;this.n=Math.max(1,Math.min(max,n));},
 of(kind,key){return this.kind===kind&&this.key===key?this.n:null;},
 on(el){return !!(el&&el.dataset&&el.dataset.dropmax&&/^invdo:drop:/.test(el.dataset.cmd||""));},
 hint:"Свайп вверх или вниз — сколько, двойное касание — выбросить.",
 /* кнопка «Выбросить» в окне действий */
 nudge(d){const el=uiCursor;if(!this.on(el))return false;const max=+el.dataset.dropmax;let n=(+el.dataset.dropn||1)+d;
  const край=n<1||n>max;n=Math.max(1,Math.min(max,n));el.dataset.dropn=String(n);
  const p=el.dataset.cmd.split(":");const kind=p[2],key=decodeURIComponent(p.slice(3).join(":"));this.set(kind,key,n,max);
  el.textContent=`Выбросить: ${n} из ${max}`;el.dataset.speak=`Выбросить: ${n} из ${max}. ${isDesktopApp()?"Стрелки вверх и вниз — сколько, Enter — выбросить.":this.hint}`;
  safeFn(()=>Sliders.play({min:1,max,value:n},d));
  narrate(`${n} из ${max}${край?(d>0?". Это вся стопка":". Меньше одной не выбросить"):""}.`,{interrupt:true,cat:"ui"});return true;},
 /* Windows: стрелки вверх и вниз на «Выбросить» в разделе инвентаря */
 keyNudge(d){const a=INV.kbAct;if(!a||a.id!=="drop")return false;const row=invRow(a.kind,a.key);const max=this.total(row);if(max<2)return false;
  let n=(this.of(a.kind,a.key)||1)+d;const край=n<1||n>max;n=Math.max(1,Math.min(max,n));this.set(a.kind,a.key,n,max);
  safeFn(()=>Sliders.play({min:1,max,value:n},d));
  narrate(`Выбросить: ${n} из ${max}${край?(d>0?". Это вся стопка":". Меньше одной не выбросить"):""}. Enter — выбросить.`,{interrupt:true,cat:"ui"});return true;}};
/* Окно действий: у стопки пункт «Выбросить» — со счётом. */
safeFn(()=>{const a0=invActions;invActions=matKeep(a0,function(){
 const r=a0.apply(this,arguments);
 safeFn(()=>{const sel=INV.sel;if(!sel)return;const row=invRow(sel.kind,sel.key);const max=DropCount.total(row);if(max<2)return;
  const el=[...document.querySelectorAll('#invActBody button')].find(b=>/^invdo:drop:/.test(b.dataset.cmd||""));if(!el)return;
  DropCount.set(sel.kind,sel.key,1,max);el.dataset.dropmax=String(max);el.dataset.dropn="1";el.textContent=`Выбросить: 1 из ${max}`;
  el.dataset.speak=`Выбросить: 1 из ${max}. ${isDesktopApp()?"Стрелки вверх и вниз — сколько, Enter — выбросить.":DropCount.hint}`;});
 return r;});});
/* Windows: дошли стрелками до «Выбросить» у стопки — счёт с одной, подсказка. */
safeFn(()=>{const k0=invKeyAction;invKeyAction=matKeep(k0,function(d){
 const r=k0.apply(this,arguments);
 safeFn(()=>{const a=INV.kbAct;if(!a||a.id!=="drop")return;const row=invRow(a.kind,a.key);const max=DropCount.total(row);if(max<2)return;
  DropCount.set(a.kind,a.key,1,max);narrate(`Выбросить: 1 из ${max}. Стрелки вверх и вниз — сколько, Enter — выбросить.`,{interrupt:true});});
 return r;});});
/* Само действие: у стопки выбрасывается выбранное число, без лишнего окна. */
safeFn(()=>{const a=ITEM_ACTIONS.find(x=>x.id==="drop");if(!a)return;const d0=a.делать;
 a.делать=function(row,ctx,done){const max=DropCount.total(row);
  if(max>1&&row.cat!=="quest"){const n=DropCount.of(row.kind,row.key)||1;DropCount.kind=null;return invDropN(row,n,done);}
  return d0.apply(this,arguments);};});
/* Команда окна подтверждения «dropn:N» больше не путает число с родом вещи. */
safeFn(()=>{const c0=CMD.invdo;CMD.invdo=function(arg){const p=String(arg).split(":");
 if(p[0]==="dropn"&&/^\d+$/.test(p[1]||""))return invDo("dropn:"+p[1],p[2],p.slice(3).join(":"));
 return c0.apply(this,arguments);};});
/* Одинаковые вещи в суме (факелы, верёвки, отмычки) — одной строкой со счётом. */
safeFn(()=>{const ia1=invAll;invAll=matKeep(ia1,function(){
 const rows=ia1.apply(this,arguments);if(!Array.isArray(rows))return rows;
 const сч={};for(const r of rows)if(r.kind==="item"&&typeof r.it==="string")сч[r.it]=(сч[r.it]||0)+1;
 const было=new Set();const out=[];
 for(const r of rows){
  if(r.kind!=="item"||typeof r.it!=="string"||сч[r.it]<2){out.push(r);continue;}
  if(было.has(r.it))continue;было.add(r.it);
  const все=rows.filter(x=>x.kind==="item"&&x.it===r.it);
  const c=(typeof INV_SECTION_BY_ID!=="undefined"&&(INV_SECTION_BY_ID[r.раздел]||INV_SECTION_BY_ID.other))||{з:""};
  out.push(Object.assign({},r,{n:все.length,group:все.map(x=>Number(x.key)),label:`${c.з} ${r.name}: ${все.length} шт.`}));}
 return out;});});
/* Выбросить несколько одинаковых вещей. */
safeFn(()=>{const d1=invDropN;invDropN=matKeep(d1,function(row,n,done){
 if(row&&row.kind==="item"&&typeof row.it==="string"&&Array.isArray(row.group)&&row.group.length>1&&row.cat!=="quest"){
  const k=Math.max(1,Math.min(row.group.length,Number(n)||1));let снято=0;
  for(let i=G.items.length-1;i>=0&&снято<k;i--)if(G.items[i]===row.it){G.items.splice(i,1);снято++;}
  safeFn(()=>Bank.play("mtg_place",{gain:0.4,maxSec:1}));
  return done(`Выброшено: ${row.name} ×${снято}. Осталось ${row.group.length-снято}.`);}
 return d1.apply(this,arguments);});});

/* Строка стопки находится по номеру любой её вещи или склянки: действие идёт
   над той самой, что назвали, — «съесть» последние жареные грибы, выпить
   именно эту склянку. Прежде номер не первой вещи стопки отвечал «такой вещи
   уже нет», и сделанная еда не давала своей силы. */
safeFn(()=>{const r0=invRow;invRow=matKeep(r0,function(kind,key){
 const r=r0.apply(this,arguments);if(r)return r;
 try{const k=decodeURIComponent(String(key||""));if(!/^\d+$/.test(k))return null;const i=Number(k);
  if(kind==="item"&&typeof G.items[i]==="string"){const row=invAll().find(x=>x.kind==="item"&&Array.isArray(x.group)&&x.group.includes(i));
   if(row)return Object.assign({},row,{key:k,it:G.items[i],n:1,group:null});}
  if(kind==="potion"){const rec=potionsOf()[i];const row=rec&&invAll().find(x=>x.kind==="potion"&&Array.isArray(x.group)&&x.group.includes(rec));
   if(row)return Object.assign({},row,{key:k,it:rec,n:1,group:null});}}catch(_){}
 return null;});});

/* ── 12. Звуки, что молчали ──
   Проверка всех звуков энциклопедии и игры. Записи все на месте и читаются,
   но часть звуков игрок не слышал:
   • сигналы интерфейса (ошибка, успех, щелчок переключателя) кое-где звали
     как роль банка — Bank.play("ui_error") — и молчали: такой роли в банке
     нет, это запись сигналов. Теперь Bank.play находит и сигналы;
   • у части записей в начале была тишина — до шестнадцати секунд у
     часовни, восемь у «голоса бездны», почти секунда у тетивы, — а звучат
     они в игре одну-две секунды: звук кончался раньше, чем начинался. Тишина
     срезана в самих записях;
   • часть вариантов одной роли была тише соседних на 8–20 дБ: тот же звук
     то слышен, то нет. Тихие варианты подняты до соседей (до −3 дБ пика,
     без перегруза). */
safeFn(()=>{const p0=Bank.play.bind(Bank);
 Bank.play=function(role,o){if(!this.has(role)&&typeof UI_BANK!=="undefined"&&UI_BANK[role])return this.file(UI_BANK[role],Object.assign({kind:"ui"},o||{}));return p0(role,o);};});

/* ── 13. Машина пространства: «Войти в кольца» ──
   Жалоба игрока: починил машину изменения пространства («Тихоня»), нажал
   «Войти в кольца» — ничего не произошло. Так и было: починка делает машину
   исправной, а кольца пускали только запущенную; кнопки «Запустить» у этой
   машины не было вовсе, и игра отвечала «Машина стоит» — без причины и без
   выхода. Теперь:
   • у исправной или остановленной машины есть «Запустить», а «Войти в
     кольца» сама запускает её и уводит сквозь ярусы;
   • не идут кольца — игра говорит почему и что сделать: сломана — нужна
     шестерня, порча, завал, комбинация, перегрузка;
   • на последнем ярусе кольца ведут вверх (прежде ход «на тот же ярус»
     молчал); при осмотре слышно, куда они ведут;
   • у перегруженного механизма есть «Остановить» (прежде только у
     работающего, и перегруженный оставался таким навсегда);
   • машина, передача, консоль, дверь, турель и платформа — в женском роде
     («машина исправна, теперь её можно запустить»), ядро — в среднем. */
const DEEP_MECH_ROD={gear:"ж",platform:"ж",console:"ж",door:"ж",turret:"ж",space:"ж",core:"с"};
function deepMechRod(kind,t){
 const r=DEEP_MECH_ROD[kind];if(!r||!t)return t;const ж=r==="ж";
 return String(t)
  .replace(/ исправен\. Теперь его можно запустить\./,ж?" исправна. Теперь её можно запустить.":" исправно. Теперь его можно запустить.")
  .replace(/ (запущен|остановлен|перегружен)([.:])/g,(q,w,p)=>" "+w+(ж?"а":"о")+p)
  .replace(/^Он и так не работает\./,ж?"Она и так не работает.":"Оно и так не работает.")
  .replace(/^Он не заблокирован\./,ж?"Она не заблокирована.":"Оно не заблокировано.")
  .replace(/^Порчи на нём нет\./,ж?"Порчи на ней нет.":"Порчи на нём нет.")
  .replace(/: он не работает\./,ж?": она не работает.":": оно не работает.")
  .replace(/ или он работает\./,ж?" или она работает.":" или оно работает.");}
/* Куда ведут кольца: на три яруса вниз, а с последнего — на три вверх. */
function deepRingsTo(s,m){const N=Math.max(1,Number(s.N)||1),i=Math.max(1,Number(m.tier)||1);return i<N?Math.min(N,i+3):Math.max(1,i-3);}
const DEEP_RINGS_WHY={
 damaged:"Кольца стоят: машина сломана. Нужна деталь — древняя шестерня; почините машину, и кольца пойдут",
 repair:"Кольца стоят: машина ждёт починки. Нужна деталь — древняя шестерня",
 cursed:"Кольца не идут: на машине порча. Снимите её чарой света (8 маны) или святой водой глубин",
 blocked:"Кольца не идут: машину завалило. Сначала разберите завал",
 combo:"Кольца заперты комбинацией: сначала введите её — код знают жители и загадки яруса",
 overloaded:"Кольца перегружены и бьют искрами: остановите машину и запустите снова"};
function deepRings(s,x,m){
 const K=DEEP_MECH_KINDS.space;const st=this.mst(x,m);const d=this.tierNo();
 if(d!==m.tier){this.say(`Эта машина — на ${m.tier}-м ярусе.`);return this.view();}
 const e=this.els(s,x,m.tier).find(q=>q.t==="mech"&&q.ref.id===m.id);
 if(e&&!this.near(e)){this.say(`До машины ${this.where(e)}. Включите маяк.`);return this.el("mech:"+m.id);}
 const why=DEEP_RINGS_WHY[st];
 if(why){safeFn(()=>Bank.play("oc_lock",{gain:0.4,maxSec:2}));this.say(why+".");return this.el("mech:"+m.id);}
 const to=deepRingsTo(s,m);
 if(to===d){this.say("Кольцам некуда вести: в этом подземелье один ярус.");return this.el("mech:"+m.id);}
 let пуск="",награда="";
 if(st!=="active"){this.setM(x,m,"active");пуск="Вы запускаете машину: кольца набирают ход. ";награда=safeFn(()=>fixMechReward(s,x,m,st,"active"),"")||"";}
 safeFn(()=>Bank.play(K.звук,{gain:0.6,maxSec:3}));
 const t=`${пуск}Кольца сходятся, и пустота открывает ход: ${to>d?"вниз":"вверх"}, на ${to}-й ярус.${награда?" "+награда:""}`;
 this.chron(x,`кольца машины пространства перенесли путника с ${d}-го на ${to}-й ярус`);
 safeFn(()=>closeTopUI());this.say(t);this.style(x,"mech");
 const ok=this.go(to);
 if(ok)setTimeout(()=>safeFn(()=>Bank.play(Bank.has("deep_portal")?"deep_portal":"portal_open",{gain:0.5,maxSec:3})),350);
 else this.say("Ход не открылся: кольца разошлись впустую.");
 return ok;}
{const ma=Deep.mechAct;Deep.mechAct=function(id,a){
 const s=safeFn(()=>this.here(),null);const x=s&&safeFn(()=>this.st(s),null);const m=s&&s.mechs&&s.mechs.find(z=>z.id===id);
 if(!m||!x)return ma.apply(this,arguments);
 if(a==="space"&&m.kind==="space")return deepRings.call(this,s,x,m);
 const say0=this.say;
 this.say=function(t,o){t=deepMechRod(m.kind,t);
  if(m.kind==="space"&&t){
   if(a==="look")t=String(t)+` Кольца ведут ${deepRingsTo(s,m)>m.tier?"вниз":"вверх"}, на ${deepRingsTo(s,m)}-й ярус.`;
   if(a==="on"&&/запущена\./.test(t))t=String(t).replace(/запущена\./,"запущена: кольца вращаются. «Войти в кольца» — и ход откроется.");}
  return say0.call(this,t,o);};
 try{return ma.apply(this,arguments);}finally{this.say=say0;}};}
/* Кнопки окна механизма: «Запустить» у машины пространства, «Остановить» у перегруженного. */
{const el0=Deep.el;Deep.el=function(id){
 const [t,rid]=String(id).split(":");
 if(t!=="mech")return el0.apply(this,arguments);
 const s=safeFn(()=>this.here(),null);const x=s&&safeFn(()=>this.st(s),null);const m=s&&s.mechs&&s.mechs.find(z=>String(z.id)===rid);
 if(!m||!x||m.tier!==this.tierNo())return el0.apply(this,arguments);
 const st=this.mst(x,m);let доп="";
 if(m.kind==="space"&&["ok","off"].includes(st))доп+=this.btn(`m:${m.id}:on`,"Запустить");
 if(st==="overloaded"&&!["guard","door"].includes(m.kind))доп+=this.btn(`m:${m.id}:off`,"Остановить");
 if(!доп)return el0.apply(this,arguments);
 const show0=this.show;
 this.show=function(title,html,сказать){
  const k=String(html).indexOf(`data-cmd="dp:m:${m.id}:look"`);const end=k>=0?String(html).indexOf("</button>",k):-1;
  html=end>=0?String(html).slice(0,end+9)+доп+String(html).slice(end+9):String(html)+доп;
  return show0.call(this,title,html,сказать);};
 try{return el0.apply(this,arguments);}finally{this.show=show0;}};}

/* ── 14. Музыка подземелий: тёмная, и у каждого своя ──
   Просьба игрока: в части подземелий и подземных крепостей музыка слишком
   весёлая, а должна быть устрашающей, подземной; и у каждого подземелья —
   своя. Так и было: ярус звучал темой своей породы, а среди тех тем были
   египетская (храм), барабаны индейцев (грибной лес и живые своды),
   «Neptune» (затопленные залы), германская тема (подземная крепость),
   «Ghoulish Fun» (лаборатория), а у руин — «Treasure Hunter». И одна порода
   звучала одинаково во всех подземельях мира.
   • Весёлые темы ушли под землёй на тёмные из The Battle for Wesnoth
     (CC BY-SA 4.0, sounds/wesnoth): «Juggernaut», «Decoherence», «Primal
     Carnage», «Phase Shift» Скотта Бакли, «Cry from Elensefar» (pluft),
     «Undead Siege» (mctom) и «Scary Ambient Wind» Александра Желанова.
     Прежние весёлые не пропали — они звучат наверху: в пустыне, на
     побережье, в походном лагере, на войне, на дороге, в горах (сама
     таблица SOUND_BANK поправлена при сборке, см. rebuild.py).
   • У каждого подземелья свой набор: тему пояса ярусов подземелье выбирает
     из тёмных тем, близких его породе, и из темы своего рода (крепость,
     некрополь, лаборатория…), — по своему месту в мире, всегда одинаково.
     Два соседних пояса одного подземелья одной темой не звучат. Владыка на
     дне — по-прежнему своей темой боя. */
/* Тёмные темы, близкие породе яруса: из них и из темы рода выбирает подземелье. */
const DEEP_MUSIC_POOL={
 depth_1:["depth_1","dk_catacomb","depth_2","dk_tomb","pl_shrine"],
 dk_water:["dk_water","drown","dk_undercity","depth_4"],
 dk_living:["dk_living","rot","vein","dk_time"],
 dk_mine:["dk_mine","dk_fort","pl_pit","depth_2"],
 dk_undercity:["dk_undercity","dk_fort","scar","depth_3"],
 dk_temple:["dk_temple","pl_shrine","dk_tomb","dk_lab"],
 mirror:["mirror","dk_rift","dk_tower","tower_led"],
 dk_necropolis:["dk_necropolis","pl_ossuary","dk_catacomb","bone"],
 tower_led:["tower_led","dk_air","depth_4","mirror"],
 rot:["rot","dk_living","vein","pl_ossuary"],
 ash:["ash","vein","dk_fort","scar"],
 dk_rift:["dk_rift","dk_lab","depth_5","dk_tower"],
 dk_time:["dk_time","mirror","dk_air","depth_4"],
 depth_5:["depth_5","dk_time","dk_air","depth_3"]};
const DeepMusic={plans:new Map(),
 есть(k){return !!(k&&MUSIC_TRACK[k]&&SOUND_BANK[MUSIC_TRACK[k]]&&SOUND_BANK[MUSIC_TRACK[k]].f.length);},
 /* План подземелья: пояс ярусов → тема. Считается раз и навсегда по месту. */
 plan(s){
  const key=String(s.key||(s.bx+","+s.by));if(this.plans.has(key))return this.plans.get(key);
  const kind=safeFn(()=>dungeonKindHere(),null);const род=kind?"dk_"+kind.id:null;
  const out={};let прежняя=null;
  for(let i=1;i<=s.N;i++){const t=s.tiers[i];if(!t||out[t.band]!==undefined)continue;
   const b=DEEP_BIOME_BY_ID[t.b];const base=b&&b.музыка;
   const pool=[...new Set([base,...(DEEP_MUSIC_POOL[base]||[]),род])].filter(k=>this.есть(k));
   if(!pool.length){out[t.band]=null;continue;}
   const n=Math.floor(hashName((Number(s.bx)||0)*7+t.band*131,(Number(s.by)||0)*11+t.band*17,7717)*pool.length)%pool.length;
   let k=pool[n];if(k===прежняя&&pool.length>1)k=pool[(n+1)%pool.length];
   out[t.band]=k;прежняя=k;}
  this.plans.set(key,out);return out;},
 key(s,d,base){const t=s&&s.tiers&&s.tiers[d];if(!t)return base;const k=this.plan(s)[t.band];return k||base;}};
safeFn(()=>{const t0=Deep.track;Deep.track=function(d){
 const k=t0.apply(this,arguments);
 if(!k||k==="boss"||k==="depth_abyss")return k;
 return safeFn(()=>DeepMusic.key(this.here(),Number(d)||0,k),k)||k;};});
/* Вход в подземелье — верх, до первого яруса, — тоже звучит по-своему: у руин,
   рудничного зева, костницы и ямы — своя тема места или одна из близких
   тёмных, по месту в мире; один и тот же вход — всегда одной темой. */
const DEEP_GATE_POOL={pl_ruins:["pl_ruins","dk_tomb","depth_3","pl_shrine"],
 pl_cave_entrance:["pl_cave_entrance","dk_mine","depth_2","drown"],
 pl_ossuary:["pl_ossuary","dk_necropolis","bone","dk_catacomb"],
 pl_pit:["pl_pit","vein","dk_fort","scar"]};
function deepGateKey(t){try{const p=G.place;if(!p||(Number(p.depth)||0)>0||"pl_"+p.stype!==t)return t;
 const pool=(DEEP_GATE_POOL[t]||[]).filter(k=>DeepMusic.есть(k));if(pool.length<2)return t;
 return pool[Math.floor(hashName((Number(p.bx)||0)*5+3,(Number(p.by)||0)*7+1,7719)*pool.length)%pool.length];}catch(_){return t;}}
safeFn(()=>{const s0=Music.start;Music.start=function(t){return s0.call(this,DEEP_GATE_POOL[t]?deepGateKey(t):t);};});

/* ── 15. Голос игры — по полу героя ──
   Просьба игрока: «выбрал женский пол героя — значит, и голос Gemini
   женский: все реплики, разговоры с торговцами и прочее». Встроенный голос
   Gemini (мужской или женский) прежде всегда начинался мужским, и героиню
   вела мужская речь. Теперь, пока игрок сам не выбрал голос в настройках,
   голос игры идёт за полом героя: героиня — женский голос Gemini, герой —
   мужской. Выбор в настройках («Выбор голоса») остаётся выбором игрока и
   больше не перекрывается. Голос героини в разговорах и в бою — её
   собственный, из женских голосов героя. */
function gvVoiceFollowHero(h,сейчас){
 try{
  h=h||G.hero;if(!h||!(h.made||сейчас))return false;
  if(settings.gvVoiceManual||settings.gvVoice==="e")return false;
  const v=h.пол==="ж"?"f":"m";if(settings.gvVoice===v)return false;
  settings.gvVoice=v;safeFn(()=>saveSettings());
  safeFn(()=>{const g=document.getElementById("setGvVoice");if(g)g.value=v;});
  return true;}catch(_){return false;}}
/* Пол выбран в окне героя — голос игры следом (своё слово он скажет уже новым голосом). */
safeFn(()=>{const s0=heroSet;heroSet=matKeep(s0,function(what,a){
 if(what==="sex"&&(a==="м"||a==="ж")&&!safeFn(()=>heroLocked(),false))safeFn(()=>gvVoiceFollowHero(Object.assign({},heroEnsure(),{пол:a}),true));
 return s0.apply(this,arguments);});});
/* «Готово» в окне героя: голос выбран до слов «Герой готов». */
safeFn(()=>{const d0=heroDone;heroDone=matKeep(d0,function(){safeFn(()=>gvVoiceFollowHero(heroEnsure(),true));return d0.apply(this,arguments);});});
/* Загрузка сохранения: героиня — женский голос, если игрок не выбирал сам. */
safeFn(()=>{const a0=applySave;applySave=matKeep(a0,function(){const r=a0.apply(this,arguments);safeFn(()=>gvVoiceFollowHero());return r;});});
/* Голос, выбранный в настройках, — выбор игрока: дальше пол героя его не меняет. */
safeFn(()=>document.addEventListener("change",e=>{const t=e.target;if(t&&t.id==="setGvVoice"){settings.gvVoiceManual=1;safeFn(()=>saveSettings());}},true));
