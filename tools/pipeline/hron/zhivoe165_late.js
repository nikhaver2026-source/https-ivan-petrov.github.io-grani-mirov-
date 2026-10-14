/* ════════════════════════════════════════════════════════════════════════
   ЖИВОЕ: ТВАРИ РАСТУТ, РЕЖИССЁР ГРАНИ УМНЕЕТ (после 16.0)
   Просьбы игрока: «монстры со временем, особенно разумные, развиваются,
   прокачивают навыки и способности»; «расширь и усовершенствуй нейродвижок
   Режиссёр Грани».
   1. Рост тварей. У каждого рода тварей — свой опыт. Он растёт с днями мира
      (разумные — вдвое быстрее), с каждой их победой над героем, с каждым
      бегством героя и с гибелью сородичей: разумные учатся на чужой смерти.
      Ступень роста (до двенадцати) прибавляет уровень, здоровье и силу удара,
      а каждые две ступени разумный род (каждые три — зверь) осваивает навык:
      щит, засада, лечение ран, ярость, увёртливость, яд, зов стаи, чтение
      приёмов. Навыки работают в бою: засада бьёт первой, ярость больнее на
      излёте, яд добирает после удара, лечение затягивает раны, щит и
      увёртливость держат удар (у таких тварей больше сил). О новом навыке
      рода — весть в журнале. Боссов, стражей и владык рост не трогает.
   2. Режиссёр Грани, третье поколение.
      · Пульс: часы мира теперь идут с реальным временем, и сутки мира — это
        настоящие сутки; Режиссёр решал раз в сутки и почти замолкал. Теперь он
        решает ещё и каждые сорок минут живой игры — и учится на том, чем вы
        занимались после его решения.
      · Отклик: награда решению — не только время в игре, но и то, тронули ли
        вы сделанное им (вожака, тайный ход, весть) — так он понимает, что
        интересно именно вам.
      · Новые руки: вожак рода (род тварей крепнет и учит навык), тайный ход
        (слух о тайных катакомбах рядом — метка на карте), затишье (если вы
        часто гибнете, роды, что вас бьют, слабеют: Режиссёр бережёт игру), и
        рост тварей края.
      · В окне Режиссёра — раздел «Рост тварей» и «Пульс Режиссёра».
   ════════════════════════════════════════════════════════════════════════ */

const РОСТ_НАВЫКИ165=[
 {id:"щит",n:"держит щит"},{id:"засада",n:"нападает из засады"},{id:"лечение",n:"залечивает раны"},
 {id:"ярость",n:"звереет от ран"},{id:"уклонение",n:"уходит от ударов"},{id:"яд",n:"бьёт ядом"},
 {id:"стая",n:"зовёт своих"},{id:"чутьё",n:"читает ваши приёмы"}];
const РОСТ_РАЗУМ165=["щит","засада","лечение","чутьё","стая","уклонение","ярость","яд"];
const РОСТ_ЗВЕРЬ165=["ярость","яд","уклонение","стая","засада","лечение","щит","чутьё"];
const Рост165={
 МАКС:12,
 st(){if(!G.rost165||typeof G.rost165!=="object"||Array.isArray(G.rost165))G.rost165={день:Number(G.day)||1,роды:{},вести:[]};
  const s=G.rost165;if(!s.роды||typeof s.роды!=="object")s.роды={};if(!Array.isArray(s.вести))s.вести=[];if(!Number.isFinite(Number(s.день)))s.день=Number(G.day)||1;return s;},
 род(m){return String((m&&(m.id||m.base||m.n))||"").slice(0,40);},
 особый(m){return !m||!!(m.boss||m.владыка||m.страж||m.unique||m.уник||m.guardian||m.noGrow165||/страж|владык|босс/i.test(String(m.n||"")));},
 разумный(m){const s=String((m&&((m.id||"")+" "+(m.n||"")))||"");
  if(/goblin|bandit|necroman|deathknight|vampire|ogre|troll|orc|cult|kobold|lich|witch|mage|knight|raider|scout|thief|brigand|разбойн|налётчик|лазутчик|колдун|чародей|жрец|культист|гоблин|орк|некромант|вампир|рыцар|страж|солдат|наёмн|контрабанд|ведьм/i.test(s))return true;
  return !!safeFn(()=>FoeTalk.who(m),false);},
 запись(m){const s=this.st();const k=this.род(m);if(!k)return null;
  if(!s.роды[k])s.роды[k]={n:String(m.n||k),опыт:0,ступень:0,навыки:[],разум:this.разумный(m)?1:0,побед:0,павших:0};
  return s.роды[k];},
 ступеньПо(опыт){return Math.min(this.МАКС,Math.floor(Math.sqrt(Math.max(0,опыт)/4)));},
 /* прибавить опыт роду; ступень и навыки — по опыту */
 опыт(m,n,почему){if(this.особый(m))return null;const z=this.запись(m);if(!z)return null;
  z.опыт=Math.round((z.опыт+(Number(n)||0)*(z.разум?1.6:1))*10)/10;if(z.опыт<0)z.опыт=0;
  const было=z.ступень;z.ступень=this.ступеньПо(z.опыт);
  if(z.ступень>было){const шаг=z.разум?2:3;const надо=Math.floor(z.ступень/шаг);const пор=z.разум?РОСТ_РАЗУМ165:РОСТ_ЗВЕРЬ165;
   while(z.навыки.length<надо&&z.навыки.length<пор.length){const н=пор.find(x=>!z.навыки.includes(x));if(!н)break;z.навыки.push(н);
    const nn=(РОСТ_НАВЫКИ165.find(x=>x.id===н)||{}).n||н;this.весть(`${z.n}: род вырос — ступень ${z.ступень}, научился: ${nn}${почему?` (${почему})`:""}.`);}
   if(z.навыки.length>=надо)this.весть(`${z.n}: род окреп — ступень роста ${z.ступень}${почему?` (${почему})`:""}.`,true);}
  return z;},
 весть(t,тихо){const s=this.st();s.вести.unshift(`День ${Number(G.day)||1}: ${t}`);if(s.вести.length>30)s.вести.length=30;
  safeFn(()=>journal(`Рост тварей: ${t}`));
  if(!тихо)setTimeout(()=>safeFn(()=>{if(!G.inCombat)narrate(`Вести о тварях: ${t}`,{interrupt:false});}),1500);},
 /* дни мира: все знакомые роды подрастают — разумные быстрее */
 дни(){const s=this.st();const d=Number(G.day)||1;if(d<=s.день){s.день=Math.min(s.день,d);return;}
  const дней=Math.min(30,d-s.день);s.день=d;if(Number(s.тишь)>=d)return;
  for(const k in s.роды){const z=s.роды[k];this.опыт({id:k,n:z.n},дней*(z.разум?1.2:0.7),"прошли дни");}},
 /* рост на бою: ступень → уровень, силы, удар; навыки — особые свойства */
 /* рост на бою: ступень → уровень, силы, удар; навыки — особые свойства. Тварь меняется на месте (исходные
    силы помнятся в _base165), чтобы прочие части игры узнавали её по ссылке; шаблоны без сил не трогаются */
 вырастить(m){if(this.особый(m)||!m||!(Number(m.hp)>0)||!Number.isFinite(Number(m.dmg)))return m;
  if(!m._base165)m._base165={lvl:m.lvl,hp:m.hp,dmg:m.dmg,xp:m.xp,gold:m.gold};const b=m._base165;
  const z=this.запись(m);const g=z?z.ступень:0;
  Object.assign(m,{lvl:b.lvl,hp:b.hp,dmg:b.dmg,xp:b.xp,gold:b.gold});delete m.рост165;delete m.навыки165;
  if(!g)return m;
  const щит=z.навыки.includes("щит"),ув=z.навыки.includes("уклонение"),стая=z.навыки.includes("стая");
  Object.assign(m,{lvl:(Number(b.lvl)||1)+Math.ceil(g/2),hp:Math.round((Number(b.hp)||20)*(1+0.07*g)*(щит?1.2:1)*(ув?1.12:1)*(стая?1.15:1)),
   dmg:(Number(b.dmg)||4)+Math.ceil(g*0.8),xp:Math.round((Number(b.xp)||20)*(1+0.1*g)),gold:Math.round((Number(b.gold)||5)*(1+0.08*g)),рост165:g,навыки165:z.навыки.slice()});
  return m;},
 слово(m){const g=Number(m&&m.рост165)||0;if(!g)return "";const н=(m.навыки165||[]).map(id=>(РОСТ_НАВЫКИ165.find(x=>x.id===id)||{}).n).filter(Boolean);
  return `Этот род вырос: ступень ${g}${н.length?`; ${н.join(", ")}`:""}.`;},
 /* вожак: Режиссёр выбирает род, тот крепнет сразу */
 вожак(){const s=this.st();const ks=Object.keys(s.роды);if(!ks.length)return "";
  const k=ks.sort((a,b)=>(s.роды[b].побед-s.роды[a].побед)||(s.роды[b].опыт-s.роды[a].опыт))[Math.floor(Math.random()*Math.min(3,ks.length))];
  const z=s.роды[k];const до=z.ступень;this.опыт({id:k,n:z.n},Math.max(8,(z.ступень+2)*(z.ступень+2)*4-z.опыт)/(z.разум?1.6:1),"объявился вожак");
  return `у рода «${z.n}» объявился вожак — род окреп${z.ступень>до?` до ступени ${z.ступень}`:""}.`;},
 /* затишье: роды, что чаще бьют героя, слабеют */
 затишье(){const s=this.st();const ks=Object.keys(s.роды).filter(k=>s.роды[k].побед>0).sort((a,b)=>s.роды[b].побед-s.роды[a].побед);
  /* никто героя не бил — притихнет сильнейший род, а нет и такого — день мира твари не растут */
  if(!ks.length){const все=Object.keys(s.роды).filter(k=>s.роды[k].опыт>0).sort((a,b)=>s.роды[b].опыт-s.роды[a].опыт);
   if(все.length){const z=s.роды[все[0]];z.опыт=Math.max(0,Math.round(z.опыт*0.8));z.ступень=this.ступеньПо(z.опыт);return `род «${z.n}» ушёл в глубь своих земель и притих: ступень роста ${z.ступень}.`;}
   s.тишь=(Number(G.day)||1)+1;return "в краях затишье: до завтрашнего дня твари не крепнут.";}
  const z=s.роды[ks[0]];z.опыт=Math.max(0,Math.round(z.опыт*0.6));z.ступень=this.ступеньПо(z.опыт);z.побед=Math.max(0,z.побед-1);
  return `род «${z.n}» понёс потери и притих: ступень роста ${z.ступень}.`;},
 край(){const s=this.st();const ks=Object.keys(s.роды);if(!ks.length)return "";let n=0;
  for(const k of ks){this.опыт({id:k,n:s.роды[k].n},2,"стаи края крепнут");n++;}
  return `твари края окрепли: ${n} ${plural(n,"род","рода","родов")} подросли.`;}};

/* бой: рост при встрече, навыки в схватке */
safeFn(()=>{const s0=startCombat;startCombat=обёртка165(function(c,opts){
 try{const m=c&&c.monster;if(m&&!Рост165.особый(m)){Рост165.запись(m);Рост165.вырастить(m);}}catch(_){}
 const r=s0.apply(this,arguments);
 safeFn(()=>{const m=c&&c.monster;if(!m||!m.рост165||!G.combat||G.combat.m!==m)return;
  const сл=Рост165.слово(m);if(сл)setTimeout(()=>safeFn(()=>narrate(сл,{interrupt:false})),900);
  if((m.навыки165||[]).includes("засада"))setTimeout(()=>safeFn(()=>{if(G.combat&&G.combat.m===m&&G.inCombat){narrate("Удар из засады!",{interrupt:true});foeStrike({kind:"melee"});safeFn(()=>refresh());}}),1300);
  if((m.навыки165||[]).includes("лечение"))Рост165._лечить(m);});
 return r;},s0);});
Рост165._лечить=function(m){const t=setInterval(()=>{try{
  if(!G.inCombat||!G.combat||G.combat.m!==m){clearInterval(t);return;}
  if(safeFn(()=>activeLayer(),null))return;
  const max=Number(m.hp)||1,hp=Number(G.combat.hp)||0;
  if(hp>0&&hp<max*0.7){const d=Math.max(1,Math.round(max*0.06));G.combat.hp=Math.min(max,hp+d);
   narrate(`Противник залечивает раны: +${d}.`,{interrupt:false});safeFn(()=>refresh());}}catch(_){clearInterval(t);}},9000);};
safeFn(()=>{const f0=foeStrike;foeStrike=обёртка165(function(o){const cb=G.combat;const m=cb&&cb.m;const до=Number(G.hp)||0;
 const r=f0.apply(this,arguments);
 try{const н=(m&&m.навыки165)||[];if(!н.length||!G.combat||G.combat.m!==m)return r;
  const урон=Math.max(0,до-(Number(G.hp)||0));if(!урон||!(G.hp>0))return r;
  let доп=0;
  if(н.includes("ярость")&&(Number(cb.hp)||0)<(Number(m.hp)||1)*0.4)доп+=Math.round(урон*0.3);
  if(н.includes("яд")&&Math.random()<0.4){доп+=1+Math.floor(Math.random()*3);safeFn(()=>narrate("Яд жжёт рану.",{interrupt:false}));}
  if(доп>0)G.hp=Math.max(1,(Number(G.hp)||1)-доп);}catch(_){}
 return r;},f0);});
/* чутьё: тот же приём трижды подряд — тварь его читает, урон по ней меньше */
safeFn(()=>{const f0=fight;fight=обёртка165(function(a){const cb=G.combat;const m=cb&&cb.m;const hp0=cb?Number(cb.hp)||0:0;const был=!!G.inCombat;
 const r=f0.apply(this,arguments);
 try{
  if(был&&a==="flee"&&!G.inCombat&&m)Рост165.опыт(m,2,"ушли от героя");
  if(m&&G.combat&&G.combat.m===m&&G.inCombat&&(m.навыки165||[]).includes("чутьё")){
   const ряд=cb.ряд165||(cb.ряд165=[]);ряд.push(a);if(ряд.length>3)ряд.shift();
   const d=hp0-(Number(G.combat.hp)||0);
   if(d>0&&ряд.length===3&&ряд.every(x=>x===a)){const назад=Math.round(d*0.3);G.combat.hp+=назад;
    if(!cb.чутьёБыло){cb.чутьёБыло=1;narrate("Противник читает ваш приём: тот же удар раз за разом проходит слабее. Смените приём.",{interrupt:false});}}}}catch(_){}
 return r;},f0);});
safeFn(()=>{const d0=defeat;defeat=обёртка165(function(){const cb=G.combat;const m=cb&&cb.m;
 safeFn(()=>{if(m&&!Рост165.особый(m)){const z=Рост165.запись(m);if(z)z.побед=(Number(z.побед)||0)+1;Рост165.опыт(m,6,"победили героя");
  const D=Режиссёр165.st();D.гибели.push(Date.now());if(D.гибели.length>10)D.гибели.shift();}});
 return d0.apply(this,arguments);},d0);});
safeFn(()=>{const v0=victory;victory=обёртка165(function(){const cb=G.combat;const m=cb&&cb.m;
 safeFn(()=>{if(m&&!Рост165.особый(m)){const z=Рост165.запись(m);if(z){z.павших=(Number(z.павших)||0)+1;
   /* разумные учатся на гибели сородичей, звери — едва */
   Рост165.опыт(m,z.разум?1:0.3,z.разум?"учатся на гибели сородичей":"");}
  if(m.рост165)Режиссёр165.тронул("champion");}});
 return v0.apply(this,arguments);},v0);});
safeFn(()=>{const t0=Clock.tick;Clock.tick=function(){const r=t0.apply(this,arguments);safeFn(()=>Рост165.дни());safeFn(()=>Режиссёр165.тик());return r;};});

/* ── 2. Режиссёр Грани, третье поколение ── */
const РЕЖ_РУКИ165=["champion","secret","calm","growth"];
safeFn(()=>{for(const a of РЕЖ_РУКИ165)if(!NEURO_ARMS.includes(a))NEURO_ARMS.push(a);
 if(typeof NEURO_ARM_N==="object"){NEURO_ARM_N.champion="вожак рода";NEURO_ARM_N.secret="тайный ход";NEURO_ARM_N.calm="затишье";NEURO_ARM_N.growth="рост тварей";}});
const Режиссёр165={
 ПУЛЬС:40,   /* минут живой игры между решениями */
 st(){if(!G.dir165||typeof G.dir165!=="object")G.dir165={};const s=G.dir165;
  if(!Number.isFinite(Number(s.мин)))s.мин=0;if(!Array.isArray(s.гибели))s.гибели=[];if(!s.тронул||typeof s.тронул!=="object")s.тронул={};
  if(!Array.isArray(s.журнал))s.журнал=[];if(!Number.isFinite(Number(s.пульсов)))s.пульсов=0;return s;},
 last:0,
 активность(){try{const n=Neuro.st();return (n.today||[]).reduce((a,v)=>a+(Number(v)||0),0)+(n.act||[]).reduce((a,v)=>a+(Number(v)||0),0)*0;}catch(_){return 0;}},
 тронул(arm){const s=this.st();s.тронул[arm]=(Number(s.тронул[arm])||0)+1;},
 /* живая игра копит минуты; полный круг — решение */
 тик(){const сейчас=Date.now();const dt=this.last?(сейчас-this.last)/60000:0;this.last=сейчас;
  if(!(dt>0)||dt>2||document.hidden||!safeFn(()=>gameActive(),false)||!safeFn(()=>Director.on(),false))return false;
  const s=this.st();s.мин=Math.round((s.мин+dt)*1000)/1000;
  if(s.мин<this.ПУЛЬС||G.inCombat||safeFn(()=>activeLayer(),null))return false;
  s.мин=0;return this.пульс();},
 пульс(){const s=this.st();const N=Neuro;const n=N.st();
  const акт=this.активность();
  /* награда прошлому решению пульса: насколько вы были заняты и тронули ли сделанное */
  if(s.ждёт&&Array.isArray(s.ждёт.x)){const дел=Math.max(0,акт-(Number(s.ждёт.акт)||0));
   const тронул=Number(s.тронул[s.ждёт.a]||0)>0?1:0;
   const r=Math.max(0,Math.min(1,Math.min(1,дел/25)*0.6+тронул*0.4));
   safeFn(()=>N.remember(s.ждёт.x,s.ждёт.a,r));safeFn(()=>N.meta(r));safeFn(()=>N.train(24));
   s.журнал.unshift({день:Number(G.day)||1,рука:s.ждёт.a,награда:Math.round(r*100)/100});if(s.журнал.length>12)s.журнал.length=12;}
  s.тронул={};
  const x=N.feats();
  /* часто гибнете — затишье в приоритете */
  const час=Date.now()-3600000;const гибли=s.гибели.filter(t=>t>час).length;
  let arm=гибли>=2&&N.possible("calm")?"calm":N.pickArm(x);
  const what=safeFn(()=>N.forge(arm),"");
  s.ждёт={x,a:arm,акт:this.активность()};s.пульсов=(Number(s.пульсов)||0)+1;
  if(what){n.lastNovel=Number(G.day)||1;safeFn(()=>narrate(`Вести мира: ${what}`,{interrupt:false}));}
  safeFn(()=>N.growCheck());safeFn(()=>saveGame(true));
  return true;}};
/* новые руки: что они делают и когда возможны */
safeFn(()=>{const f0=Neuro.forge;Neuro.forge=function(arm){
 if(arm==="champion")return Рост165.вожак()||"";
 if(arm==="calm")return Рост165.затишье()||"";
 if(arm==="growth")return Рост165.край()||"";
 if(arm==="secret")return safeFn(()=>typeof Тайны165!=="undefined"?Тайны165.слух():"","")||"";
 return f0.apply(this,arguments);};});
safeFn(()=>{const p0=Neuro.possible;Neuro.possible=function(a){
 if(a==="champion"||a==="growth")return Object.keys(Рост165.st().роды).length>0;
 if(a==="calm")return Object.values(Рост165.st().роды).some(z=>z.побед>0)||Режиссёр165.st().гибели.length>0;
 if(a==="secret")return typeof Тайны165!=="undefined";
 return p0.apply(this,arguments);};});
safeFn(()=>{const p0=Neuro.prior;Neuro.prior=function(){const r=p0.apply(this,arguments)||{};
 try{const a=Neuro.st().act;const s=i=>Math.min(0.15,(Number(a[i])||0)/40);r.champion=s(0)*0.8;r.growth=s(0)*0.4;r.secret=s(5)*0.5+s(9)*0.5;
  const час=Date.now()-3600000;r.calm=Режиссёр165.st().гибели.filter(t=>t>час).length*0.1;}catch(_){}
 return r;};});
/* окно Режиссёра: рост тварей и пульс */
safeFn(()=>{const v0=Neuro.view;Neuro.view=function(){const r=v0.apply(this,arguments);
 safeFn(()=>{const box=document.getElementById("dirBody");if(!box||box.querySelector("[data-r165]"))return;const D=Director;
  const s=Рост165.st();const роды=Object.values(s.роды).filter(z=>z.ступень>0).sort((a,b)=>b.ступень-a.ступень).slice(0,10);
  let h=`<h3 data-r165="1">Рост тварей</h3>`;
  if(!роды.length)h+=D.line("Пока ни один род тварей не вырос: встречи, дни мира и победы над вами растят их.");
  else роды.forEach(z=>{h+=D.line(`${z.n}: ступень ${z.ступень}${z.разум?", разумный род":""}${z.навыки.length?`; умеет: ${z.навыки.map(id=>(РОСТ_НАВЫКИ165.find(x=>x.id===id)||{}).n||id).join(", ")}`:""}. Побед над вами ${z.побед}, павших ${z.павших}.`);});
  s.вести.slice(0,4).forEach(t=>{h+=D.line(t);});
  const R=Режиссёр165.st();
  h+=`<h3>Пульс Режиссёра</h3>`+D.line(`Решает каждые ${Режиссёр165.ПУЛЬС} минут живой игры и раз в сутки мира. До следующего решения — ${Math.max(0,Math.round(Режиссёр165.ПУЛЬС-R.мин))} мин. Решений пульса: ${R.пульсов}.`);
  R.журнал.slice(0,4).forEach(z=>{h+=D.line(`День ${z.день}: ${(typeof NEURO_ARM_N==="object"&&NEURO_ARM_N[z.рука])||z.рука}, отклик ${Math.round(z.награда*100)} из ста.`);});
  box.insertAdjacentHTML("beforeend",h);});
 return r;};});
