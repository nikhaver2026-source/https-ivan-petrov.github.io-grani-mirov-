/* soak8.js URL секунд ЖУРНАЛ — долгая игра «как игрок» (не меньше полутора часов): всё, что есть в soak7, и свод загадок,
   тайны поселений, легенды, загадки ярусов, живые задания с поворотами. Бой перед эпизодом доводится до конца (не пропуск).
   • Игрок — настоящими клавишами (как soak6): ходьба, осмотр, окна с листанием и выбором, бой, оружие, зелья, чары,
     речь, паузы «послушать»; события мира включены.
   • Эпизоды по кругу, каждые ~2,5 минуты (каждый — с проверкой итога): задание жителя (взять → сделать игрой → сдать),
     загадка яруса (подсказка, неверный ответ, верный, награда, замок), чертог (загадка хода, головоломка), подземелье
     (вход, спуск, бой, окно яруса, выход), торговля, книга, сохранение и загрузка.
   • Пробы: отклик клавиши, контрольный звук, контрольная фраза, книга. Снимок раз в 30 с.
   • Ловля зависаний: профилировщик CDP идёт всё время кусками по 3 минуты; если в куске главный поток стоял дольше
     1,2 с — в журнал пишутся горячие функции именно этого промежутка.
   • Сторож речи: каждая запись журнала речи о стороже — с тем, что звучало.
   Журнал — строки JSON; в конце — сводка {итог:true}. */
const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const SEC=Number(process.argv[3]||6300);const LOG=process.argv[4];fs.writeFileSync(LOG,"");const W=o=>fs.appendFileSync(LOG,JSON.stringify(o)+"\n");
 const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 const page=await (await b.newContext({viewport:{width:1000,height:800}})).newPage();const cdp=await page.context().newCDPSession(page);
 let T0=Date.now();const tt=()=>Math.round((Date.now()-T0)/1000);
 const errs=[];page.on('pageerror',e=>{errs.push({t:tt(),e:String(e).slice(0,300)});W({ошибка:true,t:tt(),e:String(e).slice(0,300)});});
 page.on('console',m=>{if(m.type()==='error'&&!/fetching the script|ServiceWorker|Failed to load resource|net::ERR/i.test(m.text())){errs.push({t:tt(),e:'console: '+m.text().slice(0,300)});W({ошибка:true,t:tt(),e:'console: '+m.text().slice(0,300)});}});
 await page.addInitScript(()=>{window.__gvAuto=true;
  const C=window.__снд={узлы:0,аудио:0,играют:new Set(),инт:new Map(),plays:[]};
  for(const P of [window.BaseAudioContext&&BaseAudioContext.prototype,window.AudioContext&&AudioContext.prototype].filter(Boolean))
   for(const k of Object.getOwnPropertyNames(P))if(/^create/.test(k)&&typeof P[k]==="function"&&!P[k].__w){const f=P[k];const w=function(){C.узлы++;return f.apply(this,arguments);};w.__w=1;P[k]=w;}
  const A0=window.Audio;window.Audio=function(){C.аудио++;return new A0(...arguments);};window.Audio.prototype=A0.prototype;
  const pl=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=function(){C.играют.add(this);
   C.plays.push({t:performance.now(),src:String(this.getAttribute("src")||this.currentSrc||""),el:this});if(C.plays.length>400)C.plays.splice(0,200);return pl.apply(this,arguments);};
  const si=window.setInterval,ci=window.clearInterval;
  window.setInterval=function(f,ms){const id=si.apply(this,arguments);C.инт.set(id,String(new Error().stack).split("\n")[2].trim().replace(/\(?http[^ ]*index.html:/,"@").slice(0,60));return id;};
  window.clearInterval=function(id){C.инт.delete(id);return ci.apply(this,arguments);};
  /* задержка главного потока; стоянки дольше 1,2 с — с точным временем */
  window.__лаг={макс:0,сумма:0,n:0,свыше200:0,свыше1000:0};window.__стоянки=[];let пред=performance.now();
  si(()=>{const t=performance.now();const l=t-пред-50;пред=t;const L=window.__лаг;if(l>L.макс)L.макс=l;L.сумма+=Math.max(0,l);L.n++;if(l>200)L.свыше200++;if(l>1000)L.свыше1000++;
   if(l>1200)window.__стоянки.push({конец:t,длина:l});},50);});
 await page.goto(process.argv[2]);await page.waitForTimeout(2500);T0=Date.now();
 const жди=ms=>page.waitForTimeout(ms);const клав=async k=>{try{await page.keyboard.press(k);}catch(_){}};
 const сост=()=>page.evaluate(()=>{const L=safeFn(()=>activeLayer(),null);const ae=document.activeElement;
  return {игра:safeFn(()=>gameActive(),false),пролог:!document.getElementById("screen-intro").hidden,слой:L?(L.id||L.className||"слой"):null,
   бой:!!G.inCombat,место:G.place?G.place.kind:null,hp:G.hp,hpMax:G.hpMax,фокус:ae&&ae!==document.body?String(ae.textContent||ae.getAttribute("aria-label")||"").trim().slice(0,60):""};});
 /* ── пролог: минута первой части, затем Escape ── */
 await page.evaluate(()=>{settings.effects=1;settings.music=1;settings.scape=1;safeFn(()=>Speech.gvLoad());safeFn(()=>ESpeak.load());startIntro();});
 await жди(60000);await клав("Escape");await жди(2500);
 await page.evaluate(async()=>{if(!safeFn(()=>gameActive(),false)){try{enterGame();}catch(_){}}
  safeFn(()=>{const s=Zver.st();const br=ZV_BREEDS.find(x=>x.fam==="phoenix");const a=Zver.make(br.id);s.list.push(a);s.pets=[a.uid];a.сыт=99;a.верн=99;
   const bh=ZV_BREEDS.find(x=>x.fam==="horse");const h=Zver.make(bh.id);s.list.push(h);h.сыт=99;h.верн=99;});
  /* журнал речи о стороже — с контекстом */
  window.__сторож=[];const з0=Речь.записать.bind(Речь);Речь.записать=function(путь,что,текст){
   if(/сторож|уронил|немой|не зазвучал/i.test(String(что)))window.__сторож.push({t:Math.round(performance.now()/1000),путь,что:String(что).slice(0,80),текст:String(текст||"").slice(0,60),
    сейчас:Speech.current?String(Speech.current.text).slice(0,50):null,адаптер:safeFn(()=>Speech._adapter().name,"?")});
   if(window.__сторож.length>300)window.__сторож.splice(0,100);return з0(путь,что,текст);};
  await new Promise(q=>setTimeout(q,1500));});
 W({старт:true,пролог:await page.evaluate(()=>({игра:safeFn(()=>gameActive(),false),ширь:typeof ПрологШирь!=="undefined"}))});
 /* ── эпизоды (в странице) ── */
 await page.evaluate(()=>{
  const ждать=ms=>new Promise(q=>setTimeout(q,ms));
  const закрыть=()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();};
  const кнопки=sel=>[...document.querySelectorAll(sel+" [data-cmd]")].map(b=>({cmd:b.dataset.cmd,t:b.textContent.trim()}));
  const подз=()=>{if(window.__пз)return window.__пз;const out=[];for(let x=1000;x<90000&&out.length<300;x+=37)for(let y=1000;y<1600&&out.length<300;y+=41){const cc=cellContent(x,y);
   if(cc.structure&&!cc.structure.onlyAir&&PLACE_KIND[cc.structure.type]==="dungeon")out.push({x,y,t:cc.structure.type});}return (window.__пз=out);};
  const житель=()=>{for(let rr=0;rr<70;rr++)for(let dx=-rr;dx<=rr;dx++)for(let dy=-rr;dy<=rr;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;
    const c=safeFn(()=>cellContent(G.x+dx,G.y+dy),null);if(!c||!c.structure)continue;const L=safeFn(()=>npcsFor(c),[])||[];
    const n=L.find(n=>!GUARD_RE.test(String(n.prof||"")));if(n)return n;}return null;};
  const добить=async()=>{let k=0;while(G.inCombat&&k++<80){G.hp=Math.max(G.hp,Math.round(G.hpMax*0.7));safeFn(()=>fight("attack"));await ждать(250);}
   if(G.inCombat)safeFn(()=>{G.combat.hp=0;victory();});закрыть();};
  const бойДоКонца=async(m,лимит)=>{startCombat({x:G.x,y:G.y,monster:m});let k=0;while(G.inCombat&&k++<(лимит||60)){G.hp=Math.max(G.hp,Math.round(G.hpMax*0.7));fight("attack");await ждать(250);}
   if(G.inCombat){safeFn(()=>{G.combat.hp=0;victory();});}return !G.inCombat;};
  /* поиски для эпизодов — заранее, до замеров: подземелья мира и ходы чертогов с загадкой */
  подз();
  window.__чертоги=[];for(let k=0;k<CH_N&&window.__чертоги.length<6;k++){const i=(k*37+11)%CH_N;const s=Chertog.spec(i);if(s.type==="group"||s.type==="raid"||s.unique)continue;
   for(let f=0;f<s.floors;f++){InstanceGenerator._fc=new Map();const F=InstanceGenerator.floor(i,f,1);const e=F.edges.find(e=>e.lock==="riddle");if(e){window.__чертоги.push({i,f,x:e});break;}}}
  window.__места=[];{const виды={};for(let r=1;r<220&&window.__места.length<60;r+=3)for(let dx=-r;dx<=r;dx+=3)for(const dy of [-r,r]){const x=G.x+dx,y=G.y+dy;const cc=safeFn(()=>cellContent(x,y),null);
    const st=cc&&cc.structure;if(!st||!СВОД_ПО_ТИПУ[st.type]||safeFn(()=>airOnly(st.type),false))continue;if((виды[st.type]||0)>=6)continue;виды[st.type]=(виды[st.type]||0)+1;window.__места.push({x,y,t:st.type,n:st.name});}}
  window.__столицы=window.__места.filter(m=>m.t==="castle"||m.t==="citadel");
  /* столицы — из списка именных городов (почти все — замки), ближние первыми */
  safeFn(()=>{for(const c of NAMED_CITIES.slice().sort((a,b)=>(Math.abs(a.x-G.x)+Math.abs(a.y-G.y))-(Math.abs(b.x-G.x)+Math.abs(b.y-G.y)))){if(window.__столицы.length>=8)break;
   const st=cellContent(c.x,c.y).structure;if(st&&(st.type==="castle"||st.type==="citadel")&&!window.__столицы.some(m=>m.x===c.x&&m.y===c.y))window.__столицы.push({x:c.x,y:c.y,t:st.type,n:st.name});}});window.__поселения=window.__места.filter(m=>PLACE_KIND[m.t]==="city");
  /* решатель загадок свода — как сыграл бы игрок: иногда ошибка, звук дослушивается до конца */
  window.__решить=async(z,живо)=>{const ж=ms=>new Promise(q=>setTimeout(q,ms));
   if(z.ui==="выбор"){if(живо&&Math.random()<0.3){const н=z.opts.findIndex(o=>o!==z.ans);if(н>=0){CMD.rd("a:"+н);await ж(700);}}
    if(z.звук){CMD.rd("play");await ж(900+(z.звук.n||6)*900);}CMD.rd("a:"+z.opts.indexOf(z.ans));return;}
   if(z.ui==="ряд"){if(СводИгра.можноСлушать(z)){CMD.rd("play");await ж(900+z.ans.length*800+600);}for(const k of z.ans){CMD.rd("i:"+k);await ж(живо?260:30);}return;}
   const п=z.шаги;let ходы=[];if(п.вид==="кувшины")ходы=СводШаги.кувшины.решить(п.a,п.b,п.t);else if(п.вид==="переправа")ходы=["2","0","1","2","3","0","2"];
   else if(п.вид==="мост"){const t=п.t;ходы=2*t[1]<=t[0]+t[2]?["01","0","23","1","01"]:["03","0","02","0","01"];}
   else if(п.вид==="ханой"){const h=(n,a,b,c)=>{if(!n)return;h(n-1,a,c,b);ходы.push(`${a}${c}`);h(n-1,b,a,c);};h(п.n,п.с,[0,1,2].find(x=>x!==п.с&&x!==п.ц),п.ц);}
   else if(п.вид==="монета"){CMD.rd("s:"+encodeURIComponent("w1-3|4-6"));await ж(400);const и=СводИгра.сост[z.id].итоги[0];const куч=/равновесии/.test(и)?[7,8,9]:/левая/.test(и)?[1,2,3]:[4,5,6];
    CMD.rd("s:"+encodeURIComponent(`w${куч[0]}|${куч[1]}`));await ж(400);const и2=СводИгра.сост[z.id].итоги[1];CMD.rd("s:n"+(/равновесии/.test(и2)?куч[2]:/левая/.test(и2)?куч[0]:куч[1]));return;}
   for(const д of ходы){CMD.rd("s:"+encodeURIComponent(д));await ж(живо?200:20);}};
  window.__окноЗ=()=>{const m=document.getElementById("modal-zag");if(!m||m.hidden)return null;return {заголовок:document.getElementById("zagTitle").textContent,кнопки:[...document.querySelectorAll("#zagBody [data-cmd]")].map(b=>({cmd:b.dataset.cmd,t:b.textContent.trim()}))};};
  window.__событие=()=>{const m=document.getElementById("modal-event");return m&&!m.hidden?{заголовок:document.getElementById("eventTitle").textContent,выбор:(curEvent&&curEvent.choices||[]).map(c=>c.l)}:null;};
  window.__загадки=[];for(const d of подз()){if(window.__загадки.length>=40)break;const s=Deep.spec(d.x,d.y,d.t);const p=s.puzzles.find(q=>q.type==="riddle"||(q.ans&&q.ans.length&&q.sym));if(p)window.__загадки.push({d,p:p.id,tier:p.tier,type:p.type});}
  window.ЭП={
   /* задание жителя: взять → сделать игрой → сдать */
   async квест(){const r={};закрыть();await добить();G.place=null;
    if(openQuests().length>=QUEST_LIMIT-2){G.quests=G.quests.filter(q=>q.done).concat(openQuests().slice(-8));}
    const n=житель();if(!n)return {skip:"нет жителя"};r.житель=n.name;
    npcQuestsView(n.key);const кн=кнопки("#npcBody").filter(b=>/^qprev:.*~s\d/.test(b.cmd));r.побочных=кн.length;закрыть();
    const список=sideQuestsFor(n);const МОЖНО=["kill_fam","night_kill","elite","dng_depth","dng_chest","explore","zone_kill","dng_kill"];
    const i=список.findIndex(q=>МОЖНО.includes(q.type)&&!(G.quests||[]).some(x=>x.id===q.id));if(i<0)return Object.assign(r,{skip:"нет подходящего"});
    const q0=список[i];r.род=q0.type;r.заглавие=q0.заглавие;
    npcQuestPreview(n.key,"s"+i);const взял=npcQuestPick(n.key,"s"+i);закрыть();const q=(G.quests||[]).find(x=>x.id===q0.id);
    r.взял=!!взял&&!!q;if(!q)return Object.assign(r,{ok:false,почему:"не взялось"});
    const мон=(pred,lvl)=>Object.assign({},MONSTERS.find(pred)||MONSTERS[0],{lvl:lvl||Math.max(1,G.level),hp:30,dmg:2,xp:5,gold:2});
    const нужно=()=>Math.max(1,Number(q.need)||1);let ход=0;
    while(!Q150.сделано(q)&&ход++<14){
     if(q.type==="kill_fam")await бойДоКонца(мон(m=>foeFamily(m)===q.fam));
     else if(q.type==="night_kill"){G.hour=23;await бойДоКонца(мон(m=>m.id==="wolf"));G.hour=12;}
     else if(q.type==="elite")await бойДоКонца(мон(m=>m.id==="wolf",(Number(q.lvl)||G.level)+1));
     else if(q.type==="zone_kill"){G.x=q.tx+1;G.y=q.ty;await бойДоКонца(мон(m=>m.id==="wolf"));}
     else if(q.type==="dng_kill"){G.place={kind:"dungeon",bx:q.bx,by:q.by,depth:Math.max(1,q.depth),x:2,y:2,name:"Подземелье"};safeFn(()=>curLevel());await бойДоКонца(мон(m=>m.id==="wolf"));G.place=null;}
     else if(q.type==="dng_depth"){G.place={kind:"dungeon",bx:q.bx||1,by:q.by||1,depth:q.depth,x:2,y:2,name:"Подземелье"};safeFn(()=>curLevel());Q150.onDepth();G.place=null;}
     else if(q.type==="dng_chest"){G.place={kind:"dungeon",bx:1,by:1,depth:1,x:2,y:2,name:"Подземелье"};Q150.onChest();G.place=null;}
     else if(q.type==="explore"){for(const [x,y] of (q.pts||[])){G.x=x;G.y=y;Q150.onStep();}}
     await ждать(150);}
    r.сделано=Q150.сделано(q);const g0=G.gold,x0=G.xp;completeQuest(q.id);закрыть();r.сдано=!!q.done;r.золото=G.gold-g0;r.опыт=(G.xp-x0)||0;
    r.ok=r.взял&&r.сделано&&r.сдано&&(r.золото>0||r.опыт>0||true);return r;},
   /* загадка яруса: подсказка, неверный ответ, верный, награда, замок */
   async загадка(){const r={};закрыть();await добить();const ЗГ=window.__загадки||[];const hit=ЗГ.length?ЗГ[(window.__згИ=(window.__згИ||0)+1)%ЗГ.length]:null;
    if(!hit)return {skip:"нет загадки"};
    G.place={kind:"dungeon",bx:hit.d.x,by:hit.d.y,stype:hit.d.t,depth:hit.tier,x:2,y:2,name:"Подземелье"};safeFn(()=>curLevel());const s=Deep.here();const x=Deep.st(s);
    const p=s.puzzles.find(q=>q.id===hit.p);r.род=p.type;r.ярус=hit.tier;delete x.solved[p.id];x.inp[p.id]=[];
    const near0=Deep.near;Deep.near=()=>true;
    try{Deep.puzzle(p.id);let к=кнопки("#dpBody");r.кнопок=к.length;
     if(к.some(b=>b.cmd==="dp:pzhint:"+p.id)){Deep.cmd("pzhint:"+p.id);r.подсказка=true;}
     if(p.type==="riddle"){const неверн=p.opts.find(o=>o!==p.a);if(неверн)Deep.pzAns(p.id,encodeURIComponent(неверн));r.послеНеверного=!x.solved[p.id];Deep.pzAns(p.id,encodeURIComponent(p.a));}
     else{if(["bells","time","echo","water","hollow","hum"].includes(p.type))Deep.pzPlay(p.id);await ждать(300);
      if(p.type==="heat"){let k=0;while(!x.solved[p.id]&&k++<30){const cur=p.cur==null?p.start:p.cur;Deep.pzIn(p.id,cur<p.target?0:1);}}
      else if(p.type==="weights"){/* подобрать гири жадно */const idx=p.w.map((w,i)=>[w,i]).sort((a,b)=>b[0]-a[0]);let sum=0;for(const [w,i] of idx){if(sum+w<=p.target){Deep.pzIn(p.id,i);sum+=w;if(x.solved[p.id])break;}}}
      else{const ans=p.rev?p.ans.slice().reverse():p.ans;const Lz=p.type==="circuit"?3:ans.length;for(let j=0;j<Lz;j++)Deep.pzIn(p.id,ans[j]);}}
     r.решена=!!x.solved[p.id];
     /* замок яруса, которому нужна загадка */
     const lk=s.locks.find(L=>L.tier===p.tier&&DEEP_LOCK_KINDS[L.kind].треб==="puzzle");
     if(lk){delete x.locks[lk.id];Deep.lockTry(lk.id,"use");r.замок=!!x.locks[lk.id];}
    }finally{Deep.near=near0;закрыть();}
    G.place=null;r.ok=r.решена&&(r.замок!==false);return r;},
   /* чертог: загадка запертого хода и подсказка головоломки */
   async чертог(){const r={};закрыть();await добить();
    const найти=(pred,from)=>{for(let k=0;k<CH_N;k++){const i=((from||0)+k*37)%CH_N;const s=Chertog.spec(i);if(s.type==="group"||s.type==="raid"||s.unique)continue;for(let f=0;f<s.floors;f++){InstanceGenerator._fc=new Map();const F=InstanceGenerator.floor(i,f,1);const x=pred(F,s);if(x)return {i,f,x};}}return null;};
    const ЧГ=window.__чертоги||[];const h=ЧГ.length?ЧГ[(window.__чгИ=(window.__чгИ||0)+1)%ЧГ.length]:null;if(!h)return {skip:"нет хода с загадкой"};
    const s=Chertog.spec(h.i);const сохр={level:G.level,hpMax:G.hpMax,hp:G.hp,mana:G.mana,manaMax:G.manaMax,gold:G.gold,x:G.x,y:G.y};
    const стч=Chertog.st();const сеал0=стч.seal;G.level=Math.max(Number(G.level)||1,Number(s.level)||1);стч.seal=Math.max(Number(стч.seal)||0,Number(s.rank)||0);
    try{G.place=null;InstanceGenerator._fc=new Map();const отв=Chertog.enter({i:h.i,x:G.x,y:G.y},0);r.вход=typeof отв==="string"?отв.slice(0,80):"";const run=Chertog.run();r.вошёл=!!run;if(!run)return Object.assign(r,{ok:false,почему:"не вошёл"});
     run.floor=h.f;run.room=h.x.a;InstanceGenerator._fc=new Map();закрыть();const e=h.x;
     Chertog.edgeView(e.id);const верный="Ответ: "+CH_RIDDLES[e.riddle][1];const к=кнопки("#chBody").filter(b=>/^ch:ans:/.test(b.cmd));r.ответов=к.length;
     const кн=к.find(b=>b.t===верный);if(кн)Chertog.cmd(кн.cmd.slice(3));r.открыт=!!safeFn(()=>Chertog.isOpen(Chertog.cur(),e),false);
     Chertog.view();r.окно=кнопки("#chBody").length;
    }finally{safeFn(()=>Chertog.leave());закрыть();Object.assign(G,сохр);стч.seal=сеал0;G.place=null;}
    r.ok=r.вошёл&&r.ответов>=2&&r.открыт;return r;},
   /* подземелье: вход, спуск, бой, окно яруса, выход */
   async подземелье(){const r={};закрыть();await добить();const L=подз();const роды=[...new Set(L.map(x=>x.t))];
    const род=роды[(window.__пзИ=(window.__пзИ||0)+1)%роды.length];const из=L.filter(x=>x.t===род);const d=из[Math.floor(Math.random()*из.length)];r.род=род;
    const x0=G.x,y0=G.y;G.place=null;G.x=d.x;G.y=d.y;enterPlace(cellContent(d.x,d.y));закрыть();r.вошёл=!!G.place;if(!G.place)return Object.assign(r,{ok:false});
    const N=safeFn(()=>Deep.here().N,1);let спуск=0;for(let k=0;k<Math.min(3,N);k++){const d0=G.place.depth;changeDepth(1,{bypass:true});закрыть();if(G.place&&G.place.depth>d0)спуск++;await ждать(400);}
    r.ярусов=N;r.спуск=спуск;r.бой=await бойДоКонца(Object.assign({},MONSTERS.find(z=>z.id==="spider")||MONSTERS[3],{hp:30,dmg:3,lvl:Math.max(1,G.level),xp:10,gold:3}));
    safeFn(()=>CMD.deep());r.окно=кнопки("#dpBody").length;safeFn(()=>CMD.dp("listen"));await ждать(500);закрыть();
    for(let k=0;k<6&&G.place&&G.place.depth>0;k++){changeDepth(-1,{bypass:true});закрыть();}if(G.place)leavePlace();закрыть();r.вышел=!G.place;
    r.ok=r.вошёл&&r.бой&&r.окно>3&&r.вышел;return r;},
   /* торговля: у торговца купить одну вещь — окно, раздел, товар, «Купить», подтверждение */
   async торг(){const r={};закрыть();await добить();G.gold=Math.max(G.gold,500);
    let c=null,n=null;for(let rr=0;rr<120&&!n;rr++)for(let dx=-rr;dx<=rr&&!n;dx++)for(let dy=-rr;dy<=rr&&!n;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;const cc=safeFn(()=>cellContent(G.x+dx,G.y+dy),null);
     if(cc&&cc.structure&&PLACE_KIND[cc.structure.type]==="city"){const t=(safeFn(()=>npcsFor(cc),[])||[]).find(z=>z.trade);if(t){c={x:G.x+dx,y:G.y+dy};n=t;}}}
    if(!n)return {skip:"нет торговца"};G.x=c.x;G.y=c.y;G.place=null;r.торговец=n.name;const g0=G.gold;
    r.открыто=!!safeFn(()=>openTrade(n.key),false);r.окно=String(safeFn(()=>activeLayer().id,""));await ждать(300);
    safeFn(()=>CMD.shopcat("all"));await ждать(150);safeFn(()=>CMD.shopitem("0"));await ждать(150);safeFn(()=>CMD.shopask("buy:1"));await ждать(150);safeFn(()=>CMD.shopyes());await ждать(300);
    r.потрачено=g0-G.gold;закрыть();r.ok=r.открыто&&r.окно==="modal-shop"&&r.потрачено>0;return r;},
   /* здание: войти в постройку другого рода, пройтись, тронуть вещи, поговорить, выйти */
   async здание(){const r={};закрыть();await добить();const виды=window.__видыЗданий||(window.__видыЗданий={});
    let c=null,best=null;for(let rr=1;rr<120&&!c;rr++)for(let dx=-rr;dx<=rr&&!c;dx++)for(let dy=-rr;dy<=rr&&!c;dy++){if(Math.max(Math.abs(dx),Math.abs(dy))!==rr)continue;
     const cc=safeFn(()=>cellContent(G.x+dx,G.y+dy),null);if(!cc||!cc.structure||cc.structure.onlyAir)continue;const k=PLACE_KIND[cc.structure.type];if(k!=="house"&&k!=="city")continue;
     const t=cc.structure.type;if(!виды[t]){c={x:G.x+dx,y:G.y+dy,t};}else if(!best)best={x:G.x+dx,y:G.y+dy,t};}
    c=c||best;if(!c)return {skip:"нет построек рядом"};виды[c.t]=(виды[c.t]||0)+1;r.род=c.t;
    G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));закрыть();r.вошёл=!!G.place;if(!G.place)return Object.assign(r,{ok:false});
    r.место=G.place.kind;let шагов=0,дел=0;
    for(let k=0;k<14;k++){if(safeFn(()=>activeLayer(),null))закрыть();if(G.inCombat)await добить();if(!G.place)break;const d=["N","E","S","W"][Math.floor(Math.random()*4)];const x0=G.place.x,y0=G.place.y;safeFn(()=>moveInside(d));if(G.place&&(G.place.x!==x0||G.place.y!==y0))шагов++;
     if(Math.random()<0.35){safeFn(()=>interactHere());дел++;await ждать(150);закрыть();}await ждать(120);if(!G.place)break;}
    r.шагов=шагов;r.действий=дел;r.жителей=safeFn(()=>(Actors.list||[]).filter(a=>!a.m).length,0);
    if(G.place)leavePlace();закрыть();r.вышел=!G.place;r.ok=r.вошёл&&r.вышел&&r.шагов>0;return r;},
   /* загадки места: поселение или постройка — три загадки (простая, средняя, сложная), разные места */
   async загадкиМеста(){const r={};закрыть();await добить();const М=window.__места||[];if(!М.length)return {skip:"нет мест"};
    const m=М[(window.__мИ=(window.__мИ||0)+1)%М.length];safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=m.x;G.y=m.y;r.род=m.t;
    CMD.zagadki();await ждать(500);const ок=__окноЗ();r.окно=ок&&ок.заголовок;if(!ок)return Object.assign(r,{ok:false,почему:"окно не открылось"});
    const темы=СводИгра.м.темы;const тема=темы[(window.__тИ=(window.__тИ||0)+1)%темы.length];if(тема!==темы[0]){CMD.rd("t:"+тема);await ждать(400);}r.тема=тема;
    const zs=СводИгра.список.slice();r.загадок=zs.length;let решено=0;const мех=[];
    for(let i=0;i<zs.length;i++){const z=zs[i];if(СводИгра.решена(z)){решено++;continue;}CMD.rd("z:"+i);await ждать(700);
     if(Math.random()<0.4&&(z.hints||[]).length){CMD.rd("h");await ждать(500);}
     await __решить(z,true);await ждать(400);if(СводИгра.решена(z)){решено++;мех.push(z.мех);}CMD.rd("back");await ждать(300);}
    r.решено=решено;r.мех=мех;r.всего=СводИгра.ст().всего;закрыть();r.ok=r.загадок===3&&решено===3;return r;},
   /* загадки города: войти в именной город, встать в постройке (кузница, трактир, молельня…) — её загадки; на улице — площадные */
   async загадкиГорода(){const r={};закрыть();await добить();const НГ=(typeof NAMED_CITIES!=="undefined"?NAMED_CITIES:[]).slice(0,30);if(!НГ.length)return {skip:"нет городов"};
    const c=НГ[(window.__гИ=(window.__гИ||0)+1)%НГ.length];safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=c.x;G.y=c.y;enterPlace(cellContent(c.x,c.y));закрыть();await добить();
    if(!G.place||G.place.kind!=="city")return Object.assign(r,{ok:false,почему:"не вошёл в город"});const lvl=curLevel();r.город=G.place.name;
    const ТАЙЛЫ=["F","V","A","K","H","D","S","L","B","J"];const надо=ТАЙЛЫ[(window.__гИ)%ТАЙЛЫ.length];let где=null;
    for(const t of [надо].concat(ТАЙЛЫ)){for(let y=1;y<lvl.h-1&&!где;y++)for(let x=1;x<lvl.w-1&&!где;x++){if(lvl.g[y][x]!==t)continue;
      for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const tt=lvl.g[y+dy]&&lvl.g[y+dy][x+dx];if(tt==="."){где={x:x+dx,y:y+dy,t};break;}}}if(где)break;}
    if(где){G.place.x=где.x;G.place.y=где.y;}r.тайл=где&&где.t;const м=СводИгра.место();r.тема=м&&м.темы[0];
    CMD.zagadki();await ждать(500);const ок=__окноЗ();r.окно=ок&&ок.заголовок;if(!ок){if(G.place)leavePlace();return Object.assign(r,{ok:false,почему:"окно не открылось"});}
    const zs=СводИгра.список.slice();let решено=0;for(let i=0;i<zs.length;i++){const z=zs[i];if(!СводИгра.решена(z)){CMD.rd("z:"+i);await ждать(600);await __решить(z,true);await ждать(400);CMD.rd("back");await ждать(300);}if(СводИгра.решена(z))решено++;}
    r.решено=решено;закрыть();safeFn(()=>{if(G.place)leavePlace();});закрыть();r.ok=!!ок&&решено===zs.length&&zs.length===3&&(!где||r.тема!=="площадь");return r;},
   /* тайна поселения: шаги по местам до развязки */
   async тайна(){const r={};закрыть();await добить();const П=window.__поселения||[];if(!П.length)return {skip:"нет поселений"};
    for(let попытка=0;попытка<П.length;попытка++){const m=П[(window.__тайнаИ=(window.__тайнаИ||0)+1)%П.length];safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=m.x;G.y=m.y;
     const м=СводИгра.место();if(!м||!м.поселение)continue;const тн=СводИгра.тайна(м.поселение);if(тн.конец)continue;r.где=m.n;r.тайна=СВОД_ТАЙНЫ[тн.t].n;const ш=СводИгра.шагиТайны(тн);r.шагов=ш.length;r.дно=!!тн.дно;
     CMD.zagadki();await ждать(400);let k=0;while(!тн.конец&&k++<8){const шаг=СводИгра.шагиТайны(тн)[тн.шаг];const где=СводИгра.темаШага(шаг,м);CMD.rd("t:"+где);await ждать(400);
      if(!__окноЗ().кнопки.some(b=>b.cmd==="rd:my")){r.почему="нет кнопки шага";break;}CMD.rd("my");await ждать(1800);const z=СводИгра.z;if(!z){r.почему="не открылась";break;}await __решить(z,true);await ждать(600);CMD.rd("back");await ждать(300);}
     r.конец=!!тн.конец;закрыть();r.ok=r.конец;return r;}
    return {skip:"все тайны рядом разгаданы"};},
   /* живое задание: взять, поворот в пути или при сдаче, сделать, сдать, выбрать развязку */
   async живое(){const r={};закрыть();await добить();const П=(window.__поселения||[]).filter(m=>m.t==="village");if(!П.length)return {skip:"нет деревень"};
    const m=П[(window.__жИ=(window.__жИ||0)+1)%П.length];safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=m.x;G.y=m.y;
    const n=(npcsFor(cellContent(m.x,m.y))||[]).find(z=>!GUARD_RE.test(String(z.prof||"")));if(!n)return {skip:"нет жителя"};r.житель=n.name;
    if(openQuests().length>=QUEST_LIMIT-2){G.quests=G.quests.filter(q=>q.done).concat(openQuests().slice(-8));}
    const L=sideQuestsFor(n);const МОЖНО=["svod_n","svod_mech","svod_courier","svod_taina","kill_fam","night_kill","elite"];const i=L.findIndex(q=>МОЖНО.includes(q.type));if(i<0)return {skip:"нет подходящего"};
    const q0=L[i];r.заглавие=q0.заглавие;r.род=q0.type;npcQuestPreview(n.key,"s"+i);await ждать(600);npcQuestPick(n.key,"s"+i);await ждать(600);закрыть();const q=G.quests.find(x=>x.id===q0.id);
    if(!q)return Object.assign(r,{ok:false,почему:"не взялось"});const ПОВ=Живые.ПОВОРОТЫ;q.поворот=ПОВ[(window.__пИ=(window.__пИ||0)+1)%ПОВ.length];r.поворот=q.поворот;
    if(Живые.В_ПУТИ.has(q.поворот)){q.поворотШаг=6;q.шагов=0;let шаг=0;const СВОИ=/^(Засада!|Попутчик)$/;r.чужие=[];
     while(шаг++<40){const e0=__событие();if(e0&&СВОИ.test(e0.заголовок))break;if(e0){r.чужие.push(e0.заголовок);resolveEvent(0);await ждать(400);await добить();continue;}
      if(G.inCombat){await добить();continue;}if(safeFn(()=>activeLayer(),null)){const l=activeLayer();r.чужие.push(l.id||"слой");закрыть();await ждать(200);continue;}
      safeFn(()=>move(["N","E","S","W"][шаг%4]));await ждать(250);}
     const ev=__событие();r.вПути=ev&&СВОИ.test(ev.заголовок)?ev.заголовок:null;if(ev){const выб=ev.выбор;const k=q.поворот==="засада"?выб.findIndex(x=>/^Откупиться|^Заговорить/.test(x)):0;resolveEvent(Math.max(0,k));await ждать(700);
      const ev2=__событие();if(ev2&&ev2.заголовок==="Спор загадкой"){const z=Живые._спор;resolveEvent(ev2.выбор.findIndex(x=>x.toLowerCase()===String(z.ans).toLowerCase()));}await ждать(500);}
     await добить();G.x=m.x;G.y=m.y;}
    /* сделать */
    const М=["народ","счёт","ряд","пов","час"];
    if(q.type==="svod_n"){let k=0;while(!Живые.сделано(q)&&k++<6){const z=Свод.загадка("п",Свод.номерПо("п",М[k%М.length],Живые.h(q.id,k)));СводИгра.открыть(z,{вид:"место"});await ждать(500);await __решить(z,true);await ждать(300);}}
    else if(q.type==="svod_mech"||q.type==="svod_courier"){let k=0;while(!Живые.шифрОк(q)&&k++<6){const z=Свод.загадка("п",Свод.номерПо("п",q.мех[k%q.мех.length],Живые.h(q.id,k,"м")));СводИгра.открыть(z,{вид:"место"});await ждать(500);await __решить(z,true);await ждать(300);}
     if(q.type==="svod_courier"){G.x=q.tx;G.y=q.ty;Живые.гонец();G.x=m.x;G.y=m.y;}}
    else if(q.type==="svod_taina"){const м=СводИгра.место();const тн=СводИгра.тайна(м.поселение);let k=0;while(!тн.конец&&k++<8){const шаг=СводИгра.шагиТайны(тн)[тн.шаг];CMD.rd("t:"+СводИгра.темаШага(шаг,м));CMD.rd("my");await ждать(1500);if(СводИгра.z)await __решить(СводИгра.z,false);await ждать(300);}}
    else{const мон=Object.assign({},MONSTERS.find(z=>q.type!=="kill_fam"||foeFamily(z)===q.fam)||MONSTERS[0],{lvl:(Number(q.lvl)||G.level)+(q.type==="elite"?1:0),hp:30,dmg:2,xp:5,gold:2});let k=0;
     while(!Q150.сделано(q)&&k++<6){if(q.type==="night_kill")G.hour=23;await бойДоКонца(мон);G.hour=12;}}
    закрыть();r.сделано=q.type.startsWith("svod_")?Живые.сделано(q):Q150.сделано(q);const g0=G.gold;completeQuest(q.id);r.сдано=!!q.done;await ждать(2300);
    const ev=__событие();r.приСдаче=ev&&ev.заголовок;if(ev){const выб=ev.выбор;resolveEvent((window.__вИ=(window.__вИ||0)+1)%выб.length);await ждать(700);
     const ev2=__событие();if(ev2&&ev2.заголовок==="Спор загадкой"){const z=Живые._спор;const ok=Math.random()<0.7;const ii=ev2.выбор.findIndex(x=>ok?x.toLowerCase()===String(z.ans).toLowerCase():x.toLowerCase()!==String(z.ans).toLowerCase());resolveEvent(Math.max(0,ii));}await ждать(500);}
    r.золото=G.gold-g0;закрыть();r.ok=r.сделано&&r.сдано&&(!Живые.В_ПУТИ.has(r.поворот)||!!r.вПути)&&(Живые.В_ПУТИ.has(r.поворот)||!!r.приСдаче);return r;},
   /* загадки яруса: подземелье, окно яруса, три загадки свода подземелий */
   async ярусСвода(){const r={};закрыть();await добить();const L=подз();if(!L.length)return {skip:"нет подземелий"};const d=L[(window.__ясИ=(window.__ясИ||0)+7)%L.length];r.род=d.t;
    safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=d.x;G.y=d.y;enterPlace(cellContent(d.x,d.y));закрыть();if(!G.place)return Object.assign(r,{ok:false,почему:"не вошёл"});
    const глуб=1+((window.__ясИ/7)|0)%3;for(let k=0;k<глуб&&G.place&&(!Deep.on()||Deep.tierNo()<глуб);k++){changeDepth(1,{bypass:true});закрыть();await добить();}
    r.ярус=safeFn(()=>Deep.tierNo(),0);if(!safeFn(()=>Deep.on(),false)){if(G.place)leavePlace();return Object.assign(r,{skip:"ярус не свода"});}
    safeFn(()=>CMD.deep());await ждать(500);r.кнопка=[...document.querySelectorAll("#dpBody [data-cmd]")].some(b=>b.dataset.cmd==="rd:deep");CMD.rd("deep");await ждать(500);
    const zs=СводИгра.список.slice();let решено=0;for(let i=0;i<zs.length;i++){const z=zs[i];if(!СводИгра.решена(z)){CMD.rd("z:"+i);await ждать(600);await __решить(z,true);await ждать(400);CMD.rd("back");await ждать(300);}if(СводИгра.решена(z))решено++;}
    r.решено=решено;r.тайник=!!(G.свод.тайник&&СводИгра.м&&G.свод.тайник[СводИгра.м.ключ]);закрыть();
    for(let k=0;k<8&&G.place&&G.place.depth>0;k++){changeDepth(-1,{bypass:true});закрыть();}if(G.place)leavePlace();закрыть();r.ok=r.кнопка&&решено===zs.length&&zs.length===3&&r.тайник;return r;},
   /* легенда у столицы: ошибка — с первой загадки; разгадана — дар */
   async легенда(){const r={};закрыть();await добить();const С=window.__столицы||[];if(!С.length)return {skip:"нет столиц"};
    for(let попытка=0;попытка<С.length;попытка++){const m=С[(window.__лИ=(window.__лИ||0)+1)%С.length];safeFn(()=>{if(G.place)leavePlace();});G.place=null;G.x=m.x;G.y=m.y;
     CMD.zagadki();await ждать(400);const кн=(__окноЗ()||{кнопки:[]}).кнопки.find(b=>/^rd:leg:/.test(b.cmd));if(!кн){закрыть();continue;}
     CMD.rd(кн.cmd.slice(3));await ждать(1500);const L=СводИгра.ctx&&СводИгра.ctx.L;if(!L){закрыть();continue;}r.легенда=L.n;r.загадок=L.z.length;const ошибкаНа=Math.random()<0.5?1:-1;let k=0;
     while(!(G.свод.лег[L.id]||{}).готово&&k++<L.z.length*2+2){const z=СводИгра.z;if(!z)break;const i=(G.свод.лег[L.id]||{}).i||0;
      if(i===ошибкаНа&&!r.ошибка){r.ошибка=true;CMD.rd("a:"+z.opts.findIndex(o=>o!==z.ans));await ждать(800);continue;}CMD.rd("a:"+z.opts.indexOf(z.ans));await ждать(900);}
     r.разгадана=!!(G.свод.лег[L.id]||{}).готово;r.дар=Number(G.inv[L.дар])||0;закрыть();r.ok=r.разгадана&&r.дар>0;return r;}
    return {skip:"легенды рядом разгаданы"};},
   /* сохранение и загрузка: герой и дела — те же */
   async сохранение(){const r={};закрыть();await добить();const до={ур:G.level,дел:(G.quests||[]).length,x:G.x,y:G.y,золото:G.gold,загадок:(G.свод||{}).всего||0};
    saveGame(false);await ждать(300);loadGame();await ждать(1500);закрыть();const после={ур:G.level,дел:(G.quests||[]).length,x:G.x,y:G.y,золото:G.gold,загадок:(G.свод||{}).всего||0};
    r.до=до;r.после=после;r.ok=до.ур===после.ур&&до.дел===после.дел&&до.загадок===после.загадок&&до.x===после.x&&до.y===после.y&&до.золото===после.золото&&safeFn(()=>gameActive(),false);return r;}};});
 /* ── снимок ── */
 const снимок=async(t,сборка)=>{let heapGC=null;
  if(сборка){try{await cdp.send('HeapProfiler.collectGarbage');}catch(_){}heapGC=await page.evaluate(()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):0);}
  let dom=null;try{dom=await cdp.send('Memory.getDOMCounters');}catch(_){}
  const o=await page.evaluate(t=>{const C=window.__снд;const игр=[...C.играют].filter(e=>!e.paused&&!e.ended);C.играют=new Set(игр);
   const инт={};for(const v of C.инт.values())инт[v]=(инт[v]||0)+1;const L=window.__лаг;
   const r={t,лагМакс:Math.round(L.макс),лагСред:L.n?+(L.сумма/L.n).toFixed(1):0,лаг200:L.свыше200,лаг1000:L.свыше1000,узлов:C.узлы,аудио:C.аудио,играют:игр.length,
    интервалов:C.инт.size,петель:safeFn(()=>Bank.loops.size,-1),выстрелов:safeFn(()=>Bank.shots.length,-1),среда:safeFn(()=>ЗвукСреда.заняты(),-1),
    краж:safeFn(()=>ЗвукСреда.счёт.краж,-1),live:safeFn(()=>Spatial.live.length,-1),движок:safeFn(()=>AE.ctx.state,"?"),
    heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1e6):0,сохранение:safeFn(()=>Math.round((localStorage.getItem("grani_save")||localStorage.getItem(Object.keys(localStorage).find(k=>/save/i.test(k))||"")||"").length/1024),-1),
    речь:{говорит:!!Speech.speaking,очередь:Speech.queue.length,текущее:Speech.current?String(Speech.current.text).slice(0,50):null,
     сказано:Speech.stats.spoken,оборвано:Speech.stats.cut,сброшено:Speech.stats.dropped,спасено:Speech.stats.rescued||0,повтор:Speech.stats.retried||0},
    гул:typeof Гул155!=='undefined'?{L:+Гул155.теснота().L.toFixed(2),n:Гул155.теснота().n}:null,инт:Object.entries(инт).sort((a,b)=>b[1]-a[1]).slice(0,3),
    герой:{ур:G.level,hp:G.hp,hpMax:G.hpMax,место:G.place?G.place.kind+(G.place.depth?":"+G.place.depth:""):(G.inCombat?"бой":"мир"),час:Math.round(G.hour||0),день:G.day,золото:G.gold,дел:openQuests().length},
    акустика:safeFn(()=>Room.kind,null),слой:safeFn(()=>{const l=activeLayer();return l?(l.id||"слой"):null;},null)};
   window.__лаг={макс:0,сумма:0,n:0,свыше200:0,свыше1000:0};return r;},t);
  o.dom=dom;o.heapGC=heapGC;return o;};
 /* ── профилировщик кусками ── */
 await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:4000});
 let профС=null;const профСтарт=async()=>{await cdp.send('Profiler.start');профС=await page.evaluate(()=>performance.now());};
 const профСтоп=async()=>{let prof;try{prof=(await cdp.send('Profiler.stop')).profile;}catch(_){return;}
  const ст=await page.evaluate(()=>{const s=window.__стоянки.slice();window.__стоянки=[];return s;});if(!ст.length)return;
  /* время образцов в часах страницы: первый образец ≈ начало профиля ≈ профС */
  const t0us=prof.startTime;let acc=0;const times=prof.timeDeltas.map(d=>(acc+=d));const byId=new Map(prof.nodes.map(n=>[n.id,n]));
  const родитель=new Map();for(const n of prof.nodes)for(const c of (n.children||[]))родитель.set(c,n.id);
  for(const s of ст){const a=s.конец-s.длина,bnd=s.конец;const self=new Map(),стеки=new Map();
   prof.samples.forEach((id,i)=>{const pt=профС+(times[i])/1000;if(pt<a||pt>bnd)return;const n=byId.get(id);if(!n)return;const f=n.callFrame;if(/^\((idle|program|garbage collector)\)$/.test(f.functionName))return;
    const k=(f.functionName||"(анон)")+"@"+f.lineNumber;self.set(k,(self.get(k)||0)+1);
    let стек=[],cur=id,g=0;while(cur&&g++<14){const nn=byId.get(cur);if(!nn)break;const ff=nn.callFrame;if(ff.functionName&&!/^\(/.test(ff.functionName))стек.push(ff.functionName+"@"+ff.lineNumber);cur=родитель.get(cur);}
    const sk=стек.slice(0,8).join(" < ");стеки.set(sk,(стеки.get(sk)||0)+1);});
   W({стоянка:true,t:tt(),длина:Math.round(s.длина),горячие:[...self.entries()].sort((x,y)=>y[1]-x[1]).slice(0,10),стеки:[...стеки.entries()].sort((x,y)=>y[1]-x[1]).slice(0,4)});}};
 await профСтарт();let следПроф=180;
 /* ── пробы ── */
 const ПРОБЫ={клавиша:[],звук:[],речь:[],книга:[]};
 const речьПосле=(мс)=>`(async()=>{const t0=window.__t0;const до=performance.now()+${мс};
   while(performance.now()<до){const x=window.__снд.plays.find(p=>p.t>=t0&&/gvoice|blob:|\\.wav/.test(p.src)&&!p.el.paused&&p.el.currentTime>0);
    if(x)return Math.round(performance.now()-t0);await new Promise(q=>setTimeout(q,10));}return null;})()`;
 const пробаКлавиши=async()=>{const s=await сост();if(!s.игра||s.слой||s.бой)return;await page.evaluate(()=>{safeFn(()=>Speech.stop());});await жди(400);
  await page.evaluate(()=>{window.__t0=performance.now();});await клав("KeyH");ПРОБЫ.клавиша.push(await page.evaluate(речьПосле(5000)));};
 const пробаЗвука=async()=>{ПРОБЫ.звук.push(await page.evaluate(async()=>{const t0=performance.now();const f=Vary.file("ui_activate")||Vary.file("oc_ui_select");
   if(!Spatial.at(f,1,0,{gain:0.4,maxSec:1}))return -1;
   while(performance.now()-t0<3000){const x=window.__снд.plays.find(p=>p.t>=t0&&!p.el.paused&&p.el.currentTime>0);if(x)return Math.round(performance.now()-t0);await new Promise(q=>setTimeout(q,10));}return null;}));};
 const пробаРечи=async()=>{const s=await сост();if(s.слой)return;ПРОБЫ.речь.push(await page.evaluate(async()=>{window.__t0=performance.now();let конец=null;const t0=window.__t0;
   const m=Speech.say("Проверка речи. Сумка, карта, журнал.",{interrupt:true,pri:1,onDone:()=>{конец=performance.now()-t0;}});let начало=null;
   while(performance.now()-t0<12000&&конец==null){if(начало==null){const x=window.__снд.plays.find(p=>p.t>=t0&&/gvoice|blob:|\.wav/.test(p.src)&&!p.el.paused&&p.el.currentTime>0);if(x)начало=performance.now()-t0;}await new Promise(q=>setTimeout(q,10));}
   return {начало:начало==null?null:Math.round(начало),конец:конец==null?null:Math.round(конец),итог:m&&m.state};}));};
 const пробаКниги=async()=>{const s=await сост();if(!s.игра||s.бой)return false;await page.evaluate(()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();});await жди(300);
  const n=await page.evaluate(()=>{const L=knowLayout();const n=Math.floor(Math.random()*L.total);window.__t0=performance.now();return openReading(n,true)?n:-1;});
  if(n<0)return false;ПРОБЫ.книга.push(await page.evaluate(речьПосле(8000)));await жди(4000+Math.random()*9000);await клав("Escape");await жди(400);return true;};
 /* ── игрок ── */
 const ОПАСНО=/выход|выйти|новая игра|удалить|сброс|загрузить|сохранени|отпустить|выбросить|продать вс|начать заново|закрыть игру|вернуться в главное/i;
 const счёт={клавиш:0,окон:0,боёв:0,мест:0,книг:0,сохранений:0,загрузок:0,выходВМеню:0,застрял:0};let слойС=0,слойИмя=null,боеС=0;
 const шаг=async(t)=>{const s=await сост();
  if(!s.игра&&!s.пролог){счёт.выходВМеню++;await page.evaluate(()=>{try{enterGame();}catch(_){}let k=0;while(activeLayer()&&k++<12)closeTopUI();});return;}
  if(s.hp!=null&&s.hpMax&&s.hp<s.hpMax*0.35)await page.evaluate(()=>{G.hp=Math.round(G.hpMax*0.8);});
  if(s.слой){if(s.слой!==слойИмя){слойИмя=s.слой;слойС=Date.now();}
   if(Date.now()-слойС>(12000+Math.random()*15000)){await клав("Escape");if(Date.now()-слойС>180000){счёт.застрял++;W({застрял:true,t,слой:s.слой});await page.evaluate(()=>{let k=0;while(activeLayer()&&k++<12)closeTopUI();});}return;}
   const r=Math.random();if(r<0.55)await клав(Math.random()<0.8?"ArrowDown":"ArrowUp");
   else if(r<0.75){if(!ОПАСНО.test(s.фокус)&&!/actionMenu|modal-settings|modal-saves/.test(s.слой))await клав("Enter");else await клав("ArrowDown");}
   else if(r<0.85)await клав("Escape");else await жди(1500+Math.random()*2500);счёт.клавиш++;return;}
  слойИмя=null;
  if(s.бой){if(!боеС)боеС=Date.now();счёт.клавиш++;if(Date.now()-боеС>90000){await клав("Backspace");return;}const r=Math.random();
   if(r<0.55)await клав("Space");else if(r<0.75)await клав("KeyF");else if(r<0.83)await клав("KeyT");else if(r<0.9)await клав("KeyH");
   else if(r<0.95)await клав("Digit"+(1+Math.floor(Math.random()*3)));else if(r<0.98)await клав("KeyQ");else await клав("Backspace");return;}
  if(боеС){боеС=0;счёт.боёв++;}
  const r=Math.random();счёт.клавиш++;
  if(r<0.42){const k=["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"][Math.floor(Math.random()*4)];const n=1+Math.floor(Math.random()*5);for(let i=0;i<n;i++){await клав(k);await жди(260+Math.random()*300);}}
  else if(r<0.52)await клав(["KeyV","KeyN","KeyG","KeyH","Tab"][Math.floor(Math.random()*5)]);
  else if(r<0.58)await клав(Math.random()<0.7?"KeyE":"Enter");
  else if(r<0.61)await клав("KeyF");
  else if(r<0.71){счёт.окон++;await клав(["KeyI","KeyJ","KeyL","KeyC","KeyK","KeyX","KeyO","KeyY","F1","F3","F4","KeyM"][Math.floor(Math.random()*12)]);}
  else if(r<0.73)await клав("KeyR");else if(r<0.745)await клав("KeyQ");else if(r<0.765)await клав("Digit"+(1+Math.floor(Math.random()*3)));
  else if(r<0.79)await клав(["Space","Alt+KeyR","Control"][Math.floor(Math.random()*3)]);
  else if(r<0.81){const м=await page.evaluate(()=>{try{if(G.place){if(Math.random()<0.25){leavePlace();return "вышел";}return null;}
     const c=cellContent(G.x,G.y);if(c.structure&&PLACE_KIND[c.structure.type]){enterPlace(c);return "вошёл";}}catch(_){}return null;});if(м)счёт.мест++;}
  else if(r<0.825)await page.evaluate(()=>{try{if(!G.inCombat&&!G.place){const m={...MONSTERS[Math.floor(Math.random()*30)],lvl:Math.max(1,G.level),hp:40,dmg:2,xp:5,gold:1};startCombat({x:G.x,y:G.y,monster:m});}}catch(_){}});
  else if(r<0.83){await клав("F5");счёт.сохранений++;}
  else if(r<0.84)await page.evaluate(()=>{safeFn(()=>{const s=Zver.st();const h=s.list.find(x=>x.fam==="horse");if(h){const m=Zver.mount()?Zver.dismount():Zver.ride(h.uid);if(m)narrate(m);}});});
  else await page.evaluate(async()=>{const до=performance.now()+4000+Math.random()*12000;while(performance.now()<до&&(Speech.speaking||Speech.queue.length))await new Promise(q=>setTimeout(q,200));});};
 /* ── круг эпизодов ── */
 const КРУГ=process.env.EPS?process.env.EPS.split(","):["квест","загадкиМеста","здание","живое","подземелье","тайна","загадкиГорода","чертог","живое","торг","ярусСвода","легенда","загадка","сохранение"];const ЭП_ИНТ=Number(process.env.EPI||150);let эпИ=0;const ЭПИТОГ={};
 const эпизод=async(t)=>{const имя=КРУГ[эпИ++%КРУГ.length];const t0=Date.now();let r;
  try{r=await page.evaluate(async имя=>{try{return await ЭП[имя]();}catch(e){return {ok:false,err:String(e&&e.stack||e).slice(0,400)};}},имя);}catch(e){r={ok:false,err:"evaluate: "+String(e).slice(0,200)};}
  const d=Date.now()-t0;const E=ЭПИТОГ[имя]=ЭПИТОГ[имя]||{n:0,ok:0,skip:0,fail:0,сбои:[]};E.n++;if(r&&r.skip)E.skip++;else if(r&&r.ok)E.ok++;else{E.fail++;if(E.сбои.length<6)E.сбои.push({t,r});}
  W({эпизод:имя,t,мс:d,r});};
 const t0=Date.now();let next=0,nextGC=0,nextKey=45,nextSnd=75,nextSpk=105,nextBook=135,nextEp=60;let текС=null,текТ=0;const завис=[];
 while((Date.now()-t0)/1000<SEC){const t=Math.round((Date.now()-t0)/1000);
  try{await шаг(t);}catch(e){W({игрокСбой:true,t,e:String(e).slice(0,200)});}
  if(t>=nextEp){nextEp=t+ЭП_ИНТ;await эпизод(t);}
  if(t>=nextKey){nextKey=t+60;await пробаКлавиши();}
  if(t>=nextSnd){nextSnd=t+60;await пробаЗвука();}
  if(t>=nextSpk){nextSpk=t+120;await пробаРечи();}
  if(t>=nextBook){nextBook=t+90;if(await пробаКниги())счёт.книг++;}
  if(t>=следПроф){следПроф=t+180;await профСтоп();await профСтарт();}
  if(t>=next){const сборка=t>=nextGC;if(сборка)nextGC=t+600;const o=await снимок(t,сборка);o.счёт={...счёт};o.ошибок=errs.length;
   if(o.речь.говорит&&o.речь.текущее&&o.речь.текущее===текС){if(t-текТ>60){завис.push([t,o.речь.текущее]);W({зависРечь:true,t,текст:o.речь.текущее});}}else{текС=o.речь.текущее;текТ=t;}
   W(o);next=t+30;}
  await жди(350+Math.random()*700);}
 await профСтоп();
 const сторож=await page.evaluate(()=>window.__сторож.slice(-60));
 const сорт=a=>a.filter(x=>x!=null&&x>=0).sort((x,y)=>x-y),п=(a,q)=>{const s=сорт(a);return s.length?s[Math.min(s.length-1,Math.floor(s.length*q))]:null;};
 const пол=a=>{const h=Math.floor(a.length/2);return [a.slice(0,h),a.slice(h)];};const [к1,к2]=пол(ПРОБЫ.клавиша),[кн1,кн2]=пол(ПРОБЫ.книга),[р1,р2]=пол(ПРОБЫ.речь.map(x=>x.начало));
 W({итог:true,сек:SEC,счёт,эпизоды:ЭПИТОГ,
  клавиша:{n:ПРОБЫ.клавиша.length,нет:ПРОБЫ.клавиша.filter(x=>x==null).length,мед:п(ПРОБЫ.клавиша,0.5),п95:п(ПРОБЫ.клавиша,0.95),макс:п(ПРОБЫ.клавиша,1),первая:п(к1,0.5),вторая:п(к2,0.5)},
  книга:{n:ПРОБЫ.книга.length,нет:ПРОБЫ.книга.filter(x=>x==null).length,мед:п(ПРОБЫ.книга,0.5),п95:п(ПРОБЫ.книга,0.95),макс:п(ПРОБЫ.книга,1),первая:п(кн1,0.5),вторая:п(кн2,0.5)},
  звук:{n:ПРОБЫ.звук.length,нет:ПРОБЫ.звук.filter(x=>x==null||x<0).length,мед:п(ПРОБЫ.звук,0.5),макс:п(ПРОБЫ.звук,1)},
  речь:{n:ПРОБЫ.речь.length,перебита:ПРОБЫ.речь.filter(x=>x.итог!=="COMPLETED").length,неНачалась:ПРОБЫ.речь.filter(x=>x.начало==null&&x.итог==="COMPLETED").length,
   мед:п(ПРОБЫ.речь.map(x=>x.начало),0.5),макс:п(ПРОБЫ.речь.map(x=>x.начало),1),первая:п(р1,0.5),вторая:п(р2,0.5)},
  завис,ошибок:errs.length,ошибки:errs.slice(0,15),сторож:сторож.slice(-30)});
 await b.close();})();
