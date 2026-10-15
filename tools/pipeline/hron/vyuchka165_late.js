/* ════════════════════════════════════════════════════════════════════════
   ВЕРХОМ — БЫСТРЕЕ, ВЫУЧКА ЗВЕРЕЙ — ТРУДНЕЕ (после 16.0)
   Просьбы игрока: «на маунтах передвижение то же самое, что и шагом — сделай
   действительно быстрее»; «обучение животного, питомца и скакунов делается
   очень легко — усложни: мастера, необходимый уровень самоучки, ресурсы,
   параметры».
   1. Верхом. По реальным часам шаг по миру и так не стоил времени, поэтому
      скакун, укорачивавший время шага, ничего не менял. Теперь шаг верхом —
      две клетки (летучий и самый быстрый скакун — три; ползучий и роющий —
      то две, то одну), опытный всадник (верховая езда 6) — на клетку
      дальше. Езда останавливается у поселения, постройки, зверя, в бою и
      у входа — мимо ничего не проскочить; проезжая клетка молчит, слышно
      то, где вы остановились.
   2. Выучка героя: два навыка — звероведение и верховая езда, от нуля до
      десяти. Растут от дела (приручать, кормить, чистить, развивать
      зверей; ездить), но самоучкой — только до четырёх: выше — уроки у
      мастера в зверинце города, за золото, корм или кожу и час времени,
      и лишь когда практики уже хватает на следующую ступень.
   3. Что требует выучки:
      • приручить: редкого зверя приручит лишь знающий — звероведение не
        меньше удвоенной редкости; шанс без навыка — чуть больше половины
        прежнего, с навыком 10 — прежний;
      • ветви развития: третья ступень — звероведение 2; четвёртая и
        пятая — только с наставником в зверинце города, звероведение 4 и 6,
        корм и плата;
      • навыки зверя растут медленнее у неумелого хозяина (от 0,6 до 1,4);
      • в седло: летучий — верховая езда 3, редкий — по редкости,
        легендарный — 6;
      • выучка скакуна тайных палат: верховая езда (1, 3, 5, 7, 9), кожа,
        а со ступени «выезженный» — только у берейтора в городе.
   ════════════════════════════════════════════════════════════════════════ */
const обёртка165v=(w,f0)=>{try{Object.defineProperty(w,"toString",{value:function(){return String(f0);},configurable:true,writable:true});}catch(_){}return w;};
const ВЫУЧКА_НАВЫКИ165={
 звер:{n:"Звероведение",о:"приручение, развитие и навыки зверей",мастер:"мастер-зверовод"},
 езда:{n:"Верховая езда",о:"седло, выучка скакунов и скорость верхом",мастер:"берейтор"}};
const Выучка165={
 САМ:4,ВЕРХ:10,
 st(){if(!G.vy165||typeof G.vy165!=="object")G.vy165={};const s=G.vy165;
  for(const k in ВЫУЧКА_НАВЫКИ165){if(!s[k]||typeof s[k]!=="object")s[k]={};const z=s[k];
   if(!Number.isFinite(Number(z.xp)))z.xp=0;if(!Number.isFinite(Number(z.предел)))z.предел=this.САМ;}
  return s;},
 нужно(n){return 6*n*n;},
 поОпыту(xp){let n=0;while(n<this.ВЕРХ&&xp>=this.нужно(n+1))n++;return n;},
 ур(k){const z=this.st()[k];if(!z)return 0;return Math.min(Number(z.предел)||this.САМ,this.поОпыту(Number(z.xp)||0));},
 имя(k){return (ВЫУЧКА_НАВЫКИ165[k]||{n:k}).n;},
 /* практика: опыт растёт, ступень — до потолка самоучки или до взятого урока */
 опыт(k,n,тихо){const s=this.st();const z=s[k];if(!z||!(n>0))return this.ур(k);
  const до=this.ур(k);z.xp=Math.round((Number(z.xp)+n)*100)/100;const после=this.ур(k);
  const t=[];
  if(после>до)t.push(`${this.имя(k)}: ${после}.`);
  if(после>=z.предел&&z.предел<this.ВЕРХ&&this.поОпыту(z.xp)>z.предел&&!z.упор){z.упор=1;
   t.push(`${this.имя(k)}: самоучкой дальше не продвинуться — нужен ${ВЫУЧКА_НАВЫКИ165[k].мастер}. Уроки — в зверинце любого города.`);}
  if(t.length&&!тихо)safeFn(()=>narrate(t.join(" "),{interrupt:false}));
  return после;},
 /* урок у мастера: ступень выше потолка */
 цена(k,n){return {золото:30*n,корм:k==="звер"?n-3:0,кожа:k==="езда"?Math.ceil(n/3):0};},
 кормВсего(){return Object.values(ZV_FOOD).reduce((a,r)=>a+(Number(G.inv&&G.inv[r])||0),0);},
 кормВзять(n){const есть=Object.values(ZV_FOOD).map(r=>[r,Number(G.inv&&G.inv[r])||0]).filter(z=>z[1]>0).sort((a,b)=>b[1]-a[1]);
  for(const [r,c] of есть){if(n<=0)break;const взять=Math.min(c,n);invTake(r,взять);n-=взять;}},
 можноУрок(k){const z=this.st()[k];if(!z)return {нет:"Такого навыка нет."};const n=z.предел+1;
  if(z.предел>=this.ВЕРХ)return {нет:`${this.имя(k)}: десять из десяти — учить больше нечему.`};
  if(!safeFn(()=>Zver.inTown(),false))return {нет:`Урок даёт ${ВЫУЧКА_НАВЫКИ165[k].мастер} в зверинце города.`};
  if(this.поОпыту(z.xp)<n)return {нет:`${this.имя(k)}: для урока на ступень ${n} не хватает практики — ещё ${Math.ceil(this.нужно(n)-z.xp)} опыта. Мастер учит того, кто уже набил руку.`};
  const ц=this.цена(k,n);const нет=[];
  if((Number(G.gold)||0)<ц.золото)нет.push(`${ц.золото} золота (у вас ${Number(G.gold)||0})`);
  if(ц.корм&&this.кормВсего()<ц.корм)нет.push(`корма ×${ц.корм} (у вас ${this.кормВсего()})`);
  if(ц.кожа&&!invHas("кожа",ц.кожа))нет.push(`кожи ×${ц.кожа} (у вас ${Number(G.inv&&G.inv["кожа"])||0})`);
  if(нет.length)return {нет:`Урок на ступень ${n} стоит: ${нет.join(", ")}.`,ц,n};
  return {ц,n};},
 урок(k){const m=this.можноУрок(k);if(m.нет)return m.нет;const z=this.st()[k];const {ц,n}=m;
  G.gold-=ц.золото;if(ц.корм)this.кормВзять(ц.корм);if(ц.кожа)invTake("кожа",ц.кожа);
  z.предел=n;z.упор=0;safeFn(()=>Clock.advance(1));safeFn(()=>Bank.play("arte_coins",{gain:0.45,maxSec:2}));
  safeFn(()=>journal(`Урок у мастера: ${this.имя(k)} — ${this.ур(k)}.`));safeFn(()=>saveGame(true));
  const что=k==="звер"?"как подойти к пугливому зверю, когда давать корм и как ставить руку на холке":"посадку, повод и как вести скакуна рысью по камню и по броду";
  return `${ВЫУЧКА_НАВЫКИ165[k].мастер[0].toUpperCase()+ВЫУЧКА_НАВЫКИ165[k].мастер.slice(1)} занимается с вами час: ${что}. ${this.имя(k)} — ${this.ур(k)}, потолок теперь ${n}. Плата: ${ц.золото} золота${ц.корм?`, корм ×${ц.корм}`:""}${ц.кожа?`, кожа ×${ц.кожа}`:""}.`;},
 /* ── требования ── */
 цельПриручения(){try{const s=Zver.st();const o=s.tame;
  if(o&&o.day===G.day&&Math.abs(o.x-G.x)+Math.abs(o.y-G.y)<=2){const b=ZV_BREED_BY_ID[o.breed];return b?{n:b.n,ред:Number(b.ред)||0,f:ZV_FAMILY_BY_ID[b.fam]}:null;}
  if(o)return null;
  const L=safeFn(()=>zvLiveBeast(),null);if(!L||!L.m)return null;const fam=Zver.tameFamilyFor(L.m);if(!fam||L.m.boss)return null;const f=ZV_FAMILY_BY_ID[fam];
  const vs=ZV_VARIANTS.filter(v=>zvBreedOK(f,v));const p=safeFn(()=>Director.landVariant(),"wild");
  const v=vs.find(x=>x.id===p)||vs.find(x=>x.id==="wild")||vs[0];const b=(v&&ZV_BREED_BY_ID[fam+"_"+v.id])||{};
  return {n:L.m.n||b.n||"Зверь",ред:Number(b.ред)||0,f};}catch(_){return null;}},
 редкость(р){return safeFn(()=>ZV_RARITY[р],"")||"";},
 седло(a){const f=Zver.fam(a);if(!f||!f.ездовой)return 0;const b=ZV_BREED_BY_ID[a.breed]||{};let n=0;
  if(f.ход==="fly")n=3;const р=Number(b.ред)||0;if(р>=2)n=Math.max(n,р);if(Zver.legend(a))n=Math.max(n,6);return n;},
 ветвь(ст){return ст>=3?2*(ст-2):0;},
 ВЫЕЗДКА:[0,0,1,3,5,7,9],
 /* ── окно: выучка героя ── */
 раздел(){const s=this.st();const Z=Zver;let h=`<h3>Выучка героя</h3>`;
  for(const k in ВЫУЧКА_НАВЫКИ165){const z=s[k];const у=this.ур(k);const след=у+1;
   let хвост;
   if(у>=this.ВЕРХ)хвост="высшая ступень";
   else if(у>=z.предел)хвост=this.поОпыту(z.xp)>у?`практики хватает — нужен урок у мастера (${ВЫУЧКА_НАВЫКИ165[k].мастер}, зверинец города)`:`до ступени ${след} — ещё ${Math.ceil(this.нужно(след)-z.xp)} опыта, затем урок у мастера`;
   else хвост=`до ступени ${след} — ещё ${Math.ceil(this.нужно(след)-z.xp)} опыта`;
   h+=Z.line(`${this.имя(k)}: ${у} из десяти, самоучкой — до ${z.предел}; ${хвост}. ${ВЫУЧКА_НАВЫКИ165[k].о[0].toUpperCase()+ВЫУЧКА_НАВЫКИ165[k].о.slice(1)}.`);
   const m=this.можноУрок(k);
   if(safeFn(()=>Z.inTown(),false)&&z.предел<this.ВЕРХ){const ц=this.цена(k,z.предел+1);
    h+=`<button type="button" class="item" data-cmd="vy165:урок:${k}" data-speak="${Z.q(`Урок: ${this.имя(k)} до ${z.предел+1} — ${ц.золото} золота${ц.корм?`, корм ×${ц.корм}`:""}${ц.кожа?`, кожа ×${ц.кожа}`:""}${m.нет?". "+m.нет:""}`)}">${Z.q(`Урок: ${this.имя(k)} до ${z.предел+1} — ${ц.золото} золота${ц.корм?`, корм ×${ц.корм}`:""}${ц.кожа?`, кожа ×${ц.кожа}`:""}`)}</button>`;}}
  h+=Z.line("Что требует выучки. Приручить редкого зверя — звероведение не меньше удвоенной редкости; без навыка зверь идёт в руки вдвое реже. Третья ступень ветви развития — звероведение 2; четвёртая и пятая — только с наставником в зверинце города, звероведение 4 и 6, корм и плата. В седло летучего — верховая езда 3, редкого — по редкости, легендарного — 6. Выучка скакуна тайных палат — верховая езда, кожа, а со ступени «выезженный» — у берейтора в городе. Верхом шаг — две клетки (летучий и самый быстрый скакун — три), с верховой ездой 6 — на клетку больше.");
  return h;}};
CMD.vy165=function(a){const [что,k]=String(a||"").split(":");
 if(что==="урок"&&ВЫУЧКА_НАВЫКИ165[k]){const t=Выучка165.урок(k);safeFn(()=>Zver.home());narrate(t,{interrupt:true});return true;}
 safeFn(()=>Zver.home());return true;};
/* окно «Зверинец»: раздел выучки героя */
safeFn(()=>{const h0=Zver.home;Zver.home=обёртка165v(function(){const self=this;const s0=self.show;
 self.show=function(t,h,c){return s0.call(this,t,h+safeFn(()=>Выучка165.раздел(),""),c);};
 try{return h0.apply(this,arguments);}finally{self.show=s0;}},h0);});

/* ── приручение ── */
safeFn(()=>{const t0=Zver.tame;Zver.tame=обёртка165v(function(){
 const ц=G.inCombat?null:Выучка165.цельПриручения();
 /* прежние отказы (нет корма, полны стойла) — как были; знание спрашивается, когда дело дошло до попытки */
 const готово=ц&&ц.f&&!!safeFn(()=>zvFoodPick(ц.f),null)&&this.st().list.length<this.cap();
 if(готово){const нужно=2*ц.ред,есть=Выучка165.ур("звер");
  if(есть<нужно)return `${ц.n} — ${(Выучка165.редкость(ц.ред)||"редкий").toLowerCase()} зверь: такого подпустит лишь знающий — нужно звероведение ${нужно}, у вас ${есть}. Звероведение растёт от дела: приручайте простых зверей, кормите и чистите своих; выше четырёх — уроки у мастера в зверинце города.`;}
 const s=this.st();const n0=s.list.length;const k=0.55+0.045*Выучка165.ур("звер");
 const r0=Math.random;let первый=true;
 if(ц)Math.random=function(){const r=r0.call(Math);if(первый){первый=false;return Math.min(0.9999,r/k);}return r;};
 let res;try{res=t0.apply(this,arguments);}finally{Math.random=r0;}
 if(ц){if(this.st().list.length>n0)Выучка165.опыт("звер",4+2*ц.ред);else if(/не вышло|не подпускает|отходит|скалится/.test(String(res)))Выучка165.опыт("звер",1);}
 return res;},t0);});
/* ── ветви развития: третья ступень — знание, четвёртая и пятая — наставник, корм и плата ── */
safeFn(()=>{const g0=Zver.grow;Zver.grow=обёртка165v(function(u,br){const a=this.byUid(u);const b=ZV_BRANCHES.find(x=>x.id===br);
 if(!a||!b||this.spent(a)>=this.points(a)||(a.ветви[br]||0)>=5)return g0.apply(this,arguments);
 const ст=(a.ветви[br]||0)+1;const нужно=Выучка165.ветвь(ст),есть=Выучка165.ур("звер");const имя=this.branchName(a,b);
 if(есть<нужно)return `${a.n}: ступень ${ст} ветви «${имя}» — это уже выучка, а не сноровка: нужно звероведение ${нужно}, у вас ${есть}.`;
 let корм=0,плата=0;
 if(ст>=4){if(!this.inTown())return `${a.n}: ступень ${ст} ветви «${имя}» ставят только с наставником — в зверинце города.`;
  корм=ст-2;плата=20*ст;
  if(Выучка165.кормВсего()<корм)return `${a.n}: на ступень ${ст} наставник берёт корм ×${корм} на занятия, у вас ${Выучка165.кормВсего()}.`;
  if((Number(G.gold)||0)<плата)return `${a.n}: наставник за ступень ${ст} берёт ${плата} золота, у вас ${Number(G.gold)||0}.`;}
 const до=this.spent(a);const r=g0.apply(this,arguments);
 if(this.spent(a)>до){if(корм)Выучка165.кормВзять(корм);if(плата)G.gold-=плата;Выучка165.опыт("звер",2*ст);
  return r+(ст>=4?` Наставник взял ${плата} золота и корм ×${корм}.`:"");}
 return r;},g0);});
/* ── навыки зверя растут от дела — у умелого хозяина быстрее ── */
safeFn(()=>{const s0=Zver.skillUp;Zver.skillUp=обёртка165v(function(a,k,n){
 const м=0.6+0.08*Выучка165.ур("звер");return s0.call(this,a,k,(Number(n)||0)*м);},s0);});
/* ── уход растит звероведение (и езду — у скакуна) ── */
safeFn(()=>{const f0=Zver.feed;Zver.feed=обёртка165v(function(u){const a=this.byUid(u);const с0=a?Number(a.сыт)||0:0;const r=f0.apply(this,arguments);
 if(a&&(Number(a.сыт)||0)>с0)Выучка165.опыт("звер",0.5,true);return r;},f0);});
safeFn(()=>{const c0=Stable.mountCare;Stable.mountCare=обёртка165v(function(k){const r=c0.apply(this,arguments);
 if(/чистите/.test(String(r))){Выучка165.опыт("звер",0.4,true);Выучка165.опыт("езда",0.6,true);}return r;},c0);});
/* ── в седло ── */
safeFn(()=>{const r0=Zver.ride;Zver.ride=обёртка165v(function(u){const a=this.byUid(u);
 if(a&&this.st().mount!==a.uid){const нужно=Выучка165.седло(a),есть=Выучка165.ур("езда");
  if(есть<нужно){const f=this.fam(a);const почему=this.legend(a)?"легендарный скакун":f&&f.ход==="fly"?"летучий скакун":"норовистый редкий скакун";
   return `${a.n} — ${почему}: в седле на нём удержится лишь умелый — нужна верховая езда ${нужно}, у вас ${есть}. Учитесь на смирных скакунах; выше четырёх — уроки у берейтора в зверинце города.`;}}
 return r0.apply(this,arguments);},r0);});
/* ── выучка скакуна тайных палат ── */
safeFn(()=>{const t0=Stable.train;Stable.train=обёртка165v(function(id){const lv=this.legLv(id);if(lv>=5||!MOUNT_BY_ID[id])return t0.apply(this,arguments);
 const ц=lv+1;const нужно=Выучка165.ВЫЕЗДКА[ц],есть=Выучка165.ур("езда");const имя=MOUNT_TRAIN[ц].n;
 if(есть<нужно)return `Выучка «${имя}»: скакуна учит седок — нужна верховая езда ${нужно}, у вас ${есть}.`;
 if(ц>=3&&!safeFn(()=>Zver.inTown(),false))return `Выучка «${имя}» — работа берейтора: только в зверинце города.`;
 const кожа=ц>=2?ц-1:0;if(кожа&&!invHas("кожа",кожа))return `Выучка «${имя}»: на сбрую и занятия нужна кожа ×${кожа}, у вас ${Number(G.inv&&G.inv["кожа"])||0}.`;
 const r=t0.apply(this,arguments);
 if(this.legLv(id)>lv){if(кожа)invTake("кожа",кожа);Выучка165.опыт("езда",3*ц);return r+(кожа?` Ушло кожи: ${кожа}.`:"");}
 return r;},t0);});

/* ── 1. Верхом — быстрее ── */
const Верхом165={
 чёт:false,
 /* в воздухе — только на летучем скакуне (он и несёт быстрее); i — какая клетка действия идёт */
 i:0,
 можно(){if(!(gameActive()&&!G.place&&!G.ship&&!G.inCombat&&!G.chStair&&safeFn(()=>Stable.riding(),null)))return false;
  if(safeFn(()=>inFlight(),false)){const M=this.скакун();return !!M&&safeFn(()=>Stable.moveOf(M),"walk")==="fly";}
  return true;},
 скакун(){return safeFn(()=>ZvWalk.mount(),null);},
 клеток(){const M=this.скакун();if(!M)return 1;const ход=safeFn(()=>Stable.moveOf(M),"walk");let n=2;
  if(ход==="fly")n=3;
  const дар=(M.m&&M.m.дар)||{};if(Number(дар.шаг)>0&&Number(дар.шаг)<=0.5)n=Math.max(n,3);
  const опытный=Выучка165.ур("езда")>=6;if(опытный)n++;
  if((ход==="crawl"||ход==="dig")&&!опытный){this.чёт=!this.чёт;n=this.чёт?2:1;}
  return Math.min(n,ход==="fly"?4:3);},
 /* на этой клетке есть что-то, мимо чего не проезжают */
 стоять(x,y){const c=safeFn(()=>cellContent(x,y),null);if(!c)return true;
  return !!(c.structure||(c.monster&&!(G.cleared&&G.cleared[x+","+y]))||safeFn(()=>BeastMeet.here(),null));}};
safeFn(()=>{const m0=move;move=обёртка165v(function(dir){
 if(!DIRV[dir]||activeLayer()||!Верхом165.можно())return m0.apply(this,arguments);
 const n=Верхом165.клеток();if(n<=1)return m0.apply(this,arguments);
 let r;
 for(let i=0;i<n;i++){const x0=G.x,y0=G.y;const последний=i===n-1;const захват=[];const me=this;
  Верхом165.i=i;try{r=последний?m0.call(me,dir):Speech.на_время(()=>m0.call(me,dir),(t,o)=>{захват.push([t,o]);return true;},"верхом — слова промежуточных клеток");}
  finally{Верхом165.i=0;}
  if(i===0)Выучка165.опыт("езда",0.2,true);
  if(последний)break;
  const сдвиг=G.x!==x0||G.y!==y0;
  const стоп=!сдвиг||!Верхом165.можно()||!!activeLayer()||(G.atDoor&&G.atDoor.x===G.x&&G.atDoor.y===G.y)||Верхом165.стоять(G.x,G.y);
  if(стоп){захват.forEach(a=>{try{Speech.say(a[0],a[1]);}catch(_){}});break;}}
 return r;},m0);});

/* ── Полёт: быстрее и своим крылом (просьба игрока) ──
   «При полёте перемещение тоже должно идти быстрее, и слышен должен быть звук самого полёта — крыльев: у феникса
   свой, у другого летучего маунта — свой; у ползающего — свой звук, по маунту».
   Прежде в воздухе шаг шёл по клетке и молча: ни крыла скакуна, ни своего крыла — только ветер да изредка голос
   неба; а верхом в воздухе езда по две-три клетки и вовсе выключалась. Теперь на летучем скакуне и в небе шаг —
   три клетки (опытный всадник — четыре), и каждая клетка звучит взмахом именно этого крыла: рух — тяжёлым махом с
   порывом, грифон — орлиным, виверна и дракон — перепончатым с жаром, пегас — лёгким махом, скат — веером,
   стрекоза — жужжанием. Свои крылья героя тоже слышны каждым взмахом, у каждого крылатого народа свои: феникс —
   крыло с треском пламени на каждом махе, гарпия и аракокра — птичье, фея — трепет и звон, сильф — ветер, дракониды,
   вирмы и прародители — перепонка с гулом. Клетки одного действия звучат одна за другой, ритмом маха или бега, а не
   разом — и на земле: шаг ползающего, роющего, ходячего скакуна, каждый своим звуком рода. */
const Полёт165={
 /* крыло рода из зверинца: мах и призвук; каждый — через сколько махов призвук */
 РОД:{roc:{к:["raptor_wing","zv_wing"],з:["sky_gust"],каждый:3},griffin:{к:["raptor_wing"],з:["lug_whoosh"],каждый:3},
  wyvern:{к:["wyrm_wing"],з:["deep_wind"],каждый:3},drake:{к:["wyrm_wing","sp_wings"],з:["oc_fire","ad_fire_sizzle"],каждый:3},
  pegasus:{к:["zv_wing"],з:["sky_wind"],каждый:4},skyray:{к:["oc_fan","sky_gust"],з:["sky_wind"],каждый:3},
  dragonfly:{к:["sp_buzz","oc_mosquito"],з:["sp_hum"],каждый:3},phoenix:{к:["zv_wing"],з:["ad_fire_crackle","lug_fire","oc_inflame"],каждый:1},
  hawk:{к:["raptor_wing"]},owl:{к:["oc_bat_flutter"]},bat:{к:["oc_bat_flutter"]},raven:{к:["lug_whoosh"]},moth:{к:["sp_hum"]}},
 /* свои крылья крылатого народа */
 НАРОД:{phoenix:{к:["zv_wing"],з:["ad_fire_crackle","lug_fire","oc_inflame"],каждый:1},harpy:{к:["raptor_wing"],з:["lug_whoosh"],каждый:3},
  fae:{к:["sp_wings"],з:["sp_hum","arc_chimes"],каждый:2},aarakocra:{к:["raptor_wing"],з:["sky_wind"],каждый:4},
  pegasus:{к:["zv_wing"],з:["sky_wind"],каждый:4},sylph:{к:["zv_wing","oc_wind"],з:["wild_wind","sky_wind"],каждый:2},
  dragonborn:{к:["wyrm_wing"],з:["deep_wind"],каждый:4},stormwyrm:{к:["wyrm_wing"],з:["sky_gust","sky_thunder"],каждый:3},
  progenitor:{к:["wyrm_wing"],з:["deep_wind","oc_fire"],каждый:3}},
 n:0,
 /* чьё крыло несёт: летучий скакун (зверь зверинца, скакун тайных палат) или свои крылья героя */
 крыло(){const M=safeFn(()=>ZvWalk.mount(),null);
  if(M&&M.kind==="zv"){const f=safeFn(()=>Zver.fam(M.a),null);
   if(f&&f.ход==="fly"){const п=this.РОД[f.id];const p=ZvSnd.prof(M.a);return Object.assign({к:p.е||p.ш||["zv_wing"],каждый:4},п||{},{rate:ZvSnd.rate(M.a),чьё:"скакун"});}}
  if(M&&M.kind!=="zv"&&M.m&&(M.m.дар||{}).крыло){const L=typeof ZV_LEGRIDE150!=="undefined"&&ZV_LEGRIDE150[M.m.id];
   if(L)return {к:L.е,з:L.а,каждый:L.ак||3,чьё:"скакун"};const n=String(M.m.n||"");
   const п=/феникс/i.test(n)?this.РОД.phoenix:/дракон|вирм|виверн/i.test(n)?this.РОД.drake:{к:["zv_wing","raptor_wing"],з:["sky_gust"],каждый:4};
   return Object.assign({},п,{чьё:"скакун"});}
  const r=safeFn(()=>raceInfo(G.race),null);const п=r&&this.НАРОД[r.id];
  return Object.assign({к:[safeFn(()=>wingRole(),"raptor_wing")],каждый:4},п||{},{чьё:"герой"});},
 /* взмах на клетку неба: клетки одного действия — одна за другой */
 мах(){if(!safeFn(()=>inFlight(),false))return;const w=this.крыло();this.n++;const t=(Number(Верхом165.i)||0)*130;const pos={dx:0,dy:0.1};
  ZvSnd.later(t,()=>ZvSnd.play(w.к,Object.assign({maxSec:1.1,gain:w.чьё==="герой"?0.62:0.85,rate:w.rate||1},pos)));
  if(w.з&&this.n%(w.каждый||3)===0)ZvSnd.later(t+90,()=>ZvSnd.play(w.з,Object.assign({maxSec:1,gain:0.42},pos)));}};
safeFn(()=>{const w0=wingBeat;wingBeat=обёртка165v(function(){const r=w0.apply(this,arguments);safeFn(()=>Полёт165.мах());return r;},w0);});
/* взлёт верхом на летучем — крылом скакуна, а не своим */
safeFn(()=>{const r0=wingRole;wingRole=обёртка165v(function(){const w=safeFn(()=>Полёт165.крыло(),null);
 if(w&&w.чьё==="скакун"&&w.к&&w.к.length)return w.к[0];return r0.apply(this,arguments);},r0);});
/* на земле клетки одного действия верхом звучат по очереди, ритмом хода */
safeFn(()=>{const r0=ZvWalk.ride;ZvWalk.ride=function(M){const i=Number(Верхом165.i)||0;
 if(i>0){const self=this;ZvSnd.later(i*120,()=>safeFn(()=>r0.call(self,M)));return true;}return r0.apply(this,arguments);};});
