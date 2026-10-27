/* ════════ РОСТ ГЕРОЯ: ПОЗНАНИЕ МИРА (18.0) ════════
   Как было. Уровень требовал 50·L² опыта и больше ничего. Опыт за тварь не
   зависел ни от того, сколько таких вы уже одолели, ни от того, насколько
   она слабее вас. Путник, который просто шёл по миру и выигрывал бои, за
   три тысячи шагов (около часа игры) поднимался до одиннадцатого уровня, а
   ветвь «боевое мастерство» за то же время доходила до великого мастера.

   Как стало. Рост идёт от узнанного мира, а не от одного счёта побед:
   • уровень требует больше опыта: 100·L² + 5·L³;
   • с пятого уровня каждый следующий открывает познание мира — восемь
     граней (земли, места, твари, знания, боги и народы, магия, глубины,
     ремёсла). Чем выше уровень, тем больше познания и тем больше граней
     нужно тронуть: одним кругом по знакомым местам вверх не подняться.
     Опыт сверх предела не пропадает сразу: копится до полного уровня и
     идёт в дело, когда узнанное откроет путь;
   • опыт за тварь убывает с каждой следующей той же породы (1/(1 + 0,1·n), не ниже пятой части; порода
     забывается за дни) и почти пропадает за тварь много слабее героя;
     первая победа над новой породой — в полтора раза больше;
   • новое знание (рецепт, язык, обряд, слабость твари, реликвия, тайна)
     само приносит опыт;
   • ветви силы, умения Древа, ремёсла, мастерство и звери растут медленнее,
     а высокие ступени ветвей и Древа ждут уровня героя;
   • специализацию из книги понимает тот, кто знает чары её школы (правка
     основы в rebuild.py), и держит не больше одной на шесть уровней сверх первой. */
const РОСТ_ГРАНИ=[
 {id:"земли",  n:"земли",          о:"области, леса, державы, края преданий, где вы побывали",вес:2,
  совет:"уйдите в незнакомую область или край",
  счёт(){const k=o=>(o&&typeof o==="object")?Object.keys(o).length:0;
   return k(G.seenRegions)+k(G.seenRealms)+k(G.seenZones)+k(G.seenForests)
    +2*safeFn(()=>(typeof КанонКрай!=="undefined"?КанонКрай.ст().открыто.length:0),0);}},
 {id:"места",  n:"места",          о:"поселения и постройки, где вы побывали своими ногами",вес:0.25,
  совет:"зайдите в поселение или постройку, где ещё не бывали",
  счёт(){const k=G.known;if(!k||typeof k!=="object")return 0;let n=0;for(const x in k)if(k[x]&&k[x].v)n++;return n;}},
 {id:"твари",  n:"твари",          о:"породы тварей, которых вы одолели или изучили",вес:1,
  совет:"одолейте тварь, какой ещё не встречали",
  счёт(){return Object.keys(Рост.ст().уб).length+safeFn(()=>Lore.count("weak"),0);}},
 {id:"знания", n:"знания",         о:"рецепты, языки, обряды, реликвии и тайны",вес:1,
  совет:"узнайте рецепт, обряд, язык или тайну",
  счёт(){return Math.max(0,safeFn(()=>Lore.count()-Lore.count("map")-Lore.count("weak"),0));}},
 {id:"боги",   n:"боги и народы",  о:"боги, что вас знают, и народы, с которыми вы знакомы",вес:1.5,
  совет:"помолитесь незнакомому богу или сведите знакомство с новым народом",
  счёт(){const f=G.faith&&typeof G.faith==="object"?G.faith:{},r=G.rep&&typeof G.rep==="object"?G.rep:{};
   return Object.keys(f).filter(k=>Number(f[k])>0).length+Object.keys(r).filter(k=>Number(r[k])).length;}},
 {id:"магия",  n:"магия",          о:"школы, чьи чары вы знаете, и открытые специализации",вес:2,
  совет:"выучите чары новой школы",
  счёт(){const ш=new Set((Array.isArray(G.spells)?G.spells:[]).map(n=>SPELL_SCHOOL[n]||safeFn(()=>(SCHOOL_SPELL_BY_NAME[n]||{}).school,null)).filter(Boolean));
   return ш.size+(G.specBook&&typeof G.specBook==="object"?Object.keys(G.specBook).length:0);}},
 {id:"глубины",n:"глубины",        о:"самый глубокий ярус, до которого вы спускались",вес:1,
  совет:"спуститесь в подземелье глубже, чем бывали",
  счёт(){return Рост.глубина();}},
 {id:"дело",   n:"ремёсла и пути", о:"ремёсла, за которые вы взялись у мастера, и пути мастерства со второго ранга",вес:1.5,
  совет:"возьмитесь за новое ремесло или путь мастерства",
  счёт(){const m=G.mast&&typeof G.mast==="object"?G.mast:{};let n=Object.keys(m).filter(k=>m[k]&&Number(m[k].ур)>0).length;
   n+=safeFn(()=>{const н=Мастерство170.ст().н;return Object.keys(н).filter(k=>н[k]&&Number(н[k].р)>=2&&!(МСТ170_ПО_ID[k]&&МСТ170_ПО_ID[k].leg===k)).length;},0);return n;}}];
/* Высокие ступени ветвей силы и умений Древа ждут уровня героя. */
const РОСТ_ВЕТВИ_ШАГИ=[0,30,110,320,850,2200,5000,11000];
const РОСТ_ВЕТВИ_УР=[0,0,4,10,18,28,40,55];
let РОСТ_ТИХО=0;   /* миг загрузки сохранения: знания, что достраиваются при загрузке, опыта не дают */
const Рост=Modules.register("ROST",{
 ВЕРСИЯ:1,grani:РОСТ_ГРАНИ,
 ст(){let g=G.рост180;if(!g||typeof g!=="object"||Array.isArray(g))g=G.рост180={};
  if(!g.уб||typeof g.уб!=="object"||Array.isArray(g.уб))g.уб={};
  for(const k of ["глуб","удерж","объявлено"])if(!Number.isFinite(Number(g[k])))g[k]=0;
  return g;},
 /* Сколько познания и сколько граней нужно, чтобы подняться до уровня L. */
 нужно(L){L=Number(L)||1;return L<5?0:Math.round(3*Math.pow(L-3,1.4));},
 граней(L){L=Number(L)||1;return L<8?1:L<12?3:L<20?4:L<30?5:L<45?6:L<65?7:8;},
 глубина(){const st=this.ст();const d=G.place&&!G.place.тайник?Number(G.place.depth)||0:0;if(d>st.глуб)st.глуб=d;return st.глуб;},
 _кэш:null,_кэшT:0,
 сброс(){this._кэш=null;},
 познание(){const t=Date.now();if(this._кэш&&t-this._кэшT<400)return this._кэш;
  const грани=РОСТ_ГРАНИ.map(g=>{const c=Math.max(0,Math.round(safeFn(()=>g.счёт(),0)||0));return {id:g.id,n:g.n,счёт:c,вклад:c*g.вес};});
  const всего=Math.floor(грани.reduce((a,g)=>a+g.вклад,0)+1e-9);
  this._кэш={всего,граней:грани.filter(g=>g.счёт>0).length,грани};this._кэшT=t;return this._кэш;},
 можно(L){const п=this.познание();return п.всего>=this.нужно(L)&&п.граней>=this.граней(L);},
 /* Предельный уровень, до которого пускает познание. */
 предел(){let L=Math.max(1,Number(G.level)||1);for(let k=0;k<300&&this.можно(L+1);k++)L++;return L;},
 /* Две самые слабые грани — подсказка, куда идти. */
 совет(){const п=this.познание();const s=п.грани.slice().sort((a,b)=>a.вклад-b.вклад||a.счёт-b.счёт).slice(0,2)
   .map(g=>РОСТ_ГРАНИ.find(x=>x.id===g.id).совет);return `Подскажу: ${s.join("; ")}.`;},
 нехватка(L){const п=this.познание();const н=this.нужно(L),гн=this.граней(L);const out=[];
  if(п.всего<н)out.push(`познание ${п.всего} из ${н}`);if(п.граней<гн)out.push(`граней тронуто ${п.граней} из ${гн}`);return out;},
 объявить(L){const нех=this.нехватка(L).join(", ");
  safeFn(()=>Bank.play("arte_page",{gain:0.45,maxSec:3}));
  narrate(`Опыта довольно для ${L}-го уровня, но мир вы знаете мало: ${нех}. ${this.совет()}`,{pri:1,key:"rost180",cat:"achieve",interrupt:false});
  safeFn(()=>journal(`Рост: ${L}-й уровень ждёт познания мира (${нех}).`));},
 /* Ворота уровня: вызывается перед каждым checkLevelUp. Опыт сверх предела
    держится в запасе (не больше одного полного уровня) и возвращается, когда
    узнанное откроет путь. */
 ворота(){const st=this.ст();const L=Math.max(1,Number(G.level)||1);
  if(st.удерж>0&&this.можно(L+1)){G.xp=(Number(G.xp)||0)+st.удерж;st.удерж=0;st.объявлено=0;
   narrate("Узнанное открыло путь дальше: опыт, что копился, пошёл в дело.",{cat:"achieve",interrupt:false});}
  const lim=this.предел();let x=Number(G.xp)||0,l=L;
  while(l<lim&&x>=xpNeed(l)){x-=xpNeed(l);l++;}
  if(l>=lim&&x>=xpNeed(l)){const лишнее=x-(xpNeed(l)-1);G.xp=(Number(G.xp)||0)-лишнее;
   st.удерж=Math.min(xpNeed(l),st.удерж+лишнее);
   if(st.объявлено!==l+1){st.объявлено=l+1;this.объявить(l+1);}}},
 /* Опыт за тварь: порода приедается, слабая тварь почти ничего не даёт, новая — в полтора раза больше. */
 убойK(m){const st=this.ст();const id=String(m.id||m.n||"?");const z=st.уб[id];const день=Number(G.day)||1;
  const n=z?Number(z.n)*Math.pow(0.93,Math.max(0,день-(Number(z.д)||день))):0;
  const новая=!z;const большой=!!(m.boss||m.uniq||m.dwMini);
  const kv=большой?1:Math.max(0.2,1/(1+0.1*n));
  const d=(Number(G.level)||1)-(Number(m.lvl)||Number(G.level)||1);
  const kl=d>2?Math.max(0.15,1-0.15*(d-2)):d<-1?1+0.07*Math.min(6,-d-1):1;
  return {k:kv*kl*(новая?1.5:1),новая,kv,kl};},
 убит(m){const st=this.ст();const id=String(m.id||m.n||"?");const z=st.уб[id];const день=Number(G.day)||1;
  const n=z?Number(z.n)*Math.pow(0.93,Math.max(0,день-(Number(z.д)||день))):0;
  st.уб[id]={n:Math.round((n+1)*100)/100,д:день,имя:String(m.n||id).slice(0,60)};this.сброс();
  if(!z)narrate(`Новая порода в познании мира: ${String(m.n||id).toLowerCase()}.`,{cat:"context",interrupt:false});},
 ветвьПредел(){const L=Number(G.level)||1;let lim=0;for(let i=0;i<РОСТ_ВЕТВИ_УР.length;i++)if(L>=РОСТ_ВЕТВИ_УР[i])lim=i;return lim;},
 древоПредел(){const L=Number(G.level)||1;return L<10?3:L<20?4:5;},
 текст(){const п=this.познание();const L=Math.max(1,Number(G.level)||1);const st=this.ст();
  const след=this.нужно(L+1)?`До ${L+1}-го уровня нужно познания ${this.нужно(L+1)} и граней ${this.граней(L+1)}.`:`До ${L+1}-го уровня познание ещё не спрашивают: оно нужно с пятого.`;
  return `Познание мира ${п.всего}, граней тронуто ${п.граней} из ${РОСТ_ГРАНИ.length}. ${след}`
   +(st.удерж>0?` Опыт ждёт познания: в запасе ${st.удерж}.`:"")
   +` ${п.грани.map(g=>`${g.n} — ${g.счёт}`).join(", ")}.`;}});
/* ── опыт уровня ── (сама формула — правка основы: const xpNeed) */
/* ── ворота перед повышением ── */
safeFn(()=>{const c0=checkLevelUp;checkLevelUp=function(){safeFn(()=>Рост.ворота());return c0.apply(this,arguments);};});
/* ── победа: опыт по породе и силе, новая порода — в познание ── */
safeFn(()=>{const v0=victory;victory=function(){const cb=G.combat;const m=cb&&cb.m;
 if(m&&!m.__рост180){m.__рост180=1;const k=safeFn(()=>Рост.убойK(m),{k:1});m.__xp180=Number(m.xp)||0;m.xp=Math.max(1,Math.round((Number(m.xp)||0)*k.k));}
 const r=v0.apply(this,arguments);
 if(m&&!m.__учтён180&&!(G.inCombat&&G.combat===cb)){m.__учтён180=1;safeFn(()=>Рост.убит(m));
  if(Рост.ст().удерж>0)safeFn(()=>checkLevelUp());}
 return r;};});
/* ── новое знание: опыт и проверка ворот ── */
safeFn(()=>{const a0=Lore.add;Lore.add=function(род,id,n,откуда){const r=a0.apply(this,arguments);
 if(r){Рост.сброс();
  if(род!=="map"&&Date.now()-РОСТ_ТИХО>4000&&safeFn(()=>gameActive(),false)){
   G.xp=(Number(G.xp)||0)+safeFn(()=>xpGain(8+2*(Number(G.level)||1)),10);safeFn(()=>checkLevelUp());}
  else if(Рост.ст().удерж>0)safeFn(()=>checkLevelUp());}
 return r;};});
safeFn(()=>{const l0=loadGame;loadGame=function(){РОСТ_ТИХО=Date.now();Рост.сброс();return l0.apply(this,arguments);};});
/* ── новые земли и глубины открывают ворота сразу ── */
safeFn(()=>{const d0=deed;deed=function(k){const r=d0.apply(this,arguments);
 if(k==="regions"||k==="forests"||k==="houses"){Рост.сброс();if(G.рост180&&G.рост180.удерж>0)safeFn(()=>checkLevelUp());}
 return r;};});
safeFn(()=>{const s0=descend;descend=function(){const r=s0.apply(this,arguments);const st=Рост.ст();const было=st.глуб;
 if(Рост.глубина()>было){Рост.сброс();if(st.удерж>0)safeFn(()=>checkLevelUp());}return r;};});
/* ── ветви силы: круче ступени, высокие — с уровня героя ── */
safeFn(()=>{РОСТ_ВЕТВИ_ШАГИ.forEach((v,i)=>{BRANCH_STEPS[i]=v;});
 const b0=branchRank;branchRank=function(id){const r=b0.apply(this,arguments);return Math.min(r,Рост.ветвьПредел());};
 const t0=branchesText;branchesText=function(){const s=t0.apply(this,arguments);const lim=Рост.ветвьПредел();
  if(lim>=7)return s;const след=РОСТ_ВЕТВИ_УР[lim+1];
  return `${s} Ступень «${BRANCH_RANKS[lim+1]}» и выше откроется с ${след}-го уровня героя.`;};});
/* ── Древо Граней: пороги со второй ступени в два с половиной раза выше; четвёртая — с 10-го уровня, пятая — с 20-го ── */
safeFn(()=>{TREE_LEAVES.forEach(l=>{if(Array.isArray(l.шаги)&&!l.__рост180){l.__рост180=1;l.шаги=l.шаги.map((v,i)=>i?Math.round(v*2.5):v);}});
 const s0=Tree.ступень;Tree.ступень=function(id){return Math.min(s0.apply(this,arguments),Рост.древоПредел());};});
/* ── ремёсла: ступень ремесла дороже ── */
safeFn(()=>{mastNeed=function(ур){ур=Number(ур)||0;return 40+45*ур*ур;};});
/* ── мастерство: ступень пути вдвое дороже (прежде 1 + 0,12 на ранг) ── */
safeFn(()=>{Мастерство170.цена=function(р){return 2+0.25*Math.max(0,(Number(р)||1)-1);};});
/* ── звери: уровень зверя дороже ── */
safeFn(()=>{Zver.need=function(a){const l=Number(a&&a.lvl)||1;return 40+30*l+l*l;};});
/* ── окно «Герой»: познание мира рядом с четырьмя осями ── */
safeFn(()=>{const h0=axesHtml;axesHtml=function(){const h=h0.apply(this,arguments);
 const t=safeFn(()=>Рост.текст(),"");if(!t)return h;
 return h+`<div class="list-line" tabindex="0" data-speak="${t.replace(/"/g,"&quot;")}">• <b>Познание мира</b> — ${t}</div>`;};});
