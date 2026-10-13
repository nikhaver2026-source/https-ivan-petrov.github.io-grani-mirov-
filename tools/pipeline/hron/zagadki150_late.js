/* ════════════════════════════════════════════════════════════════════════
   ЗАГАДКИ ВЕДУТ ДАЛЬШЕ, И У КАЖДОЙ ЕСТЬ НЕБОЛЬШАЯ ПОДСКАЗКА (15.0, просьба игрока)
   «Проверь, чтобы все загадки вели к чему-то — к продолжению или к тому, что
   натолкнёт на продолжение; и чтобы у трудной загадки была небольшая
   подсказка — не ответ, а намёк». Проверка нашла, где загадки обрывались:
   — логическая загадка яруса подземелья брала вопрос из списка загадок не в
     том виде и потому всегда была одной и той же запасной;
   — надпись у рычагов называла второй рычаг словами, которые подходили и к
     другому («светит ночью» — и Луна, и Звезда, а то и Ключ);
   — рунный, многорычажный и временной замки открывались только решённой
     загадкой своего яруса, а загадки на этом ярусе могло не быть вовсе;
   — механизм под комбинацией обещал, что код «знают жители или загадки», но
     ни житель, ни загадка его не давали;
   — награда «ход» при уже найденных ходах яруса была пустым щелчком засова,
     а «уникальная вещь», когда обе вещи уже взяты, — пустым словом;
   — говорящий череп чертога сам называл ответ своей загадки.
   Теперь:
   1. каждая решённая загадка яруса, кроме награды, говорит, что дальше:
      какой замок она отперла, комбинацию к механизму или код к кодовому
      замку, а нет такого — где следующая загадка подземелья;
   2. замку, которому нужна загадка яруса, она на этом ярусе всегда есть;
   3. подсказки: в окне загадки, головоломки чертога, запертого хода с
      загадкой, рунами или колоколами, у плиты-загадки, у черепа, у шута
      Кривой Короны и на зачёте Буревала — кнопка «Подсказка». Первая — намёк
      (где ключ к загадке или как её слушать), вторая — первый шаг или
      вычеркнутые неверные ответы. Ответа целиком подсказка не говорит;
   4. череп загадывает по-настоящему: угадали — называет пароль яруса (ответ
      привратнику, слово арки, мелодию, тайный ход или ключ к головоломке).
   ════════════════════════════════════════════════════════════════════════ */
const Загадки150={
 /* порядок без общего генератора: тот же при каждом заходе */
 порядок(a,seed){return a.map((v,i)=>[hashName(i+1,Number(seed)||1,15023),v]).sort((p,q)=>p[0]-q[0]).map(z=>z[1]);},
 ОПИС:{"Солнце":"светит днём","Луна":"растёт и убывает","Звезда":"ведёт путников ночью","Ключ":"отпирает двери"},
 СТОРОНЫ_РОД:{"север":"севера","восток":"востока","юг":"юга","запад":"запада"},
 /* ── подземелье: доделка загадок при первом построении ── */
 доделать(s){const seed0=(Number(s.bx)||0)*7919+(Number(s.by)||0)*104729;
  for(const p of s.puzzles){
   if(p.type==="riddle"){const k=Math.floor(hashName(seed0+p.tier,String(p.id).length+p.tier*31,15011)*CH_RIDDLES.length)%CH_RIDDLES.length;const rr=CH_RIDDLES[k];
    p.q=rr[0];p.a=rr[1];p.opts=this.порядок([rr[1]].concat(rr[2]),seed0+k*13+p.tier);p.о=p.q;}
   if(p.type==="levers")this.рычаги(p);}
  /* замок, которому нужна загадка своего яруса, без неё не останется */
  for(const L of s.locks){const K=DEEP_LOCK_KINDS[L.kind];if(!K||(K.треб!=="puzzle"&&K.треб!=="timepz"))continue;const время=K.треб==="timepz";
   if(s.puzzles.some(p=>p.tier===L.tier&&(!время||p.type==="time")))continue;
   const тип=время?"time":L.kind==="levers"?"levers":"runes";
   const p=Deep.genPuzzle("pz_"+L.id,тип,L.tier,Deep.rng(seed0+L.tier*977+String(L.id).length*31+(время?7:1)));p.замок=L.id;if(тип==="levers")this.рычаги(p);s.puzzles.push(p);}},
 рычаги(p){if(!Array.isArray(p.ans)||p.ans.length<4||!p.sym)return;const S=p.sym.map(z=>z[0]);const о=this.ОПИС[S[p.ans[1]]];if(!о)return;
  p.о=`На стене выбито: «Сперва ${S[p.ans[0]]}, за ним то, что ${о}, потом ${S[p.ans[2]]}, последним — оставшееся».`;},
 /* ── подземелье: подсказки к загадке ── */
 депПодсказки(p){const S=k=>p.sym&&p.sym[k]?p.sym[k][0]:String(k);const D=["север","восток","юг","запад"];
  const лишние=(всего,верно,n)=>this.порядок(Array.from({length:всего},(_,k)=>k).filter(k=>k!==верно),String(p.id).length*17+p.tier*7+всего).slice(0,n);
  const ans=Array.isArray(p.ans)?p.ans:[];
  switch(p.type){
   case "bells":return [`Колокола звучат по одному, ${ans.length} ${plural(ans.length,"удар","удара","ударов")}; различайте их по высоте — от низкого колокола до стеклянного звона. Слушать можно сколько угодно раз.`,`Первым звучит ${S(ans[0])}.`];
   case "time":return ["Время здесь идёт назад: что прозвучало последним, то и нажимайте первым.",`Начните с того, что звучит последним: ${S(ans[ans.length-1])}.`];
   case "levers":return ["Надпись на стене и есть порядок: первый и третий рычаги названы прямо, второй — загадкой, четвёртый — тот, что останется.",
    "Как читать загадку надписи: Солнце светит днём, Луна растёт и убывает, Звезда ведёт путников ночью, Ключ отпирает двери."];
   case "weights":{const w=(p.w||[]).filter(x=>x<=p.target);const big=w.length?Math.max(...w):0;
    return [`Гири кладут по одной, одну и ту же можно положить не раз; перевесит чаша — гири скатятся, и всё сначала. Нужно ровно ${p.target}.`,
     big===p.target?"Хватит и одной гири.":`Начните с гири ${big}: останется добрать ${p.target-big}.`];}
   case "runes":return ["Надпись на полу и есть порядок: руны нажимают так, как они записаны, слева направо.",`Первая руна — ${S(ans[0])}.`];
   case "heat":{const cur=p.cur==null?p.start:p.cur;
    return ["Механизм откроется, когда стрелка встанет на середину: «нагреть» ведёт её к жару, «остудить» — к холоду.",
     cur?`Сейчас до середины ${Math.abs(cur)} ${plural(Math.abs(cur),"шаг","шага","шагов")}: ${cur>0?"остужайте":"нагревайте"}.`:"Стрелка уже на середине: сдвиньте её на шаг и верните."];}
   case "circuit":return ["След мастера и есть порядок: жилы включают так, как они записаны.",`Первая жила — ${S(ans[0])}.`];
   case "echo":return ["Отзвук шагов придёт трижды, каждый раз с одной стороны: спереди — север, справа — восток, сзади — юг, слева — запад. Лучше в наушниках.",
    `Первый отзвук — с ${this.СТОРОНЫ_РОД[D[ans[0]]]||"одной из сторон"}.`];
   case "riddle":{const w=this.порядок((p.opts||[]).filter(o=>o!==p.a),String(p.q||"").length+p.tier);
    return [`Один неверный ответ отпал: не «${w[0]}».`,`И ещё один: не «${w[1]}».`];}
   case "hollow":{const w=лишние(4,ans[0],2);
    return ["Пустая стена отзывается глухим деревянным стуком, сплошная — звонким камнем. Стены звучат по порядку: север, восток, юг, запад.",`Это не ${S(w[0])} и не ${S(w[1])}.`];}
   case "water":{const w=лишние(4,ans[0],2);
    return ["Ближний источник звучит громче и чётче, дальние — тише и глуше. Стороны звучат по порядку: север, восток, юг, запад.",`Вода не на ${D[w[0]]} и не на ${D[w[1]]}.`];}
   case "hum":{const w=лишние(3,ans[0],1);
    return ["Целый генератор гудит выше и ровнее, у поломанных гул ниже. Они звучат по порядку: первый, второй, третий.",`Это не ${S(w[0])}.`];}}
  return [];},
 вычеркнуто(p,x){if(p.type!=="riddle")return [];const L=Number((x.hint150||{})[p.id])||0;
  return this.порядок((p.opts||[]).filter(o=>o!==p.a),String(p.q||"").length+p.tier).slice(0,Math.min(2,L));},
 /* окно загадки: вычеркнутые ответы убраны, открытые подсказки видны, кнопка следующей */
 вДеп(D,s,x,p,html){const H=this.депПодсказки(p);if(!H.length)return html;const L=Math.min(H.length,Number((x.hint150||{})[p.id])||0);
  for(const o of this.вычеркнуто(p,x))html=html.split(D.btn(`pzans:${p.id}:${encodeURIComponent(o)}`,D.cap(o))).join("");
  /* только что открытая подсказка уже стоит первой строкой окна (итог действия) — второй раз её не пишем */
  let вст="";for(let i=0;i<L;i++){const т=`Подсказка ${i+1}: ${H[i]}`;if(D._note!==т)вст+=D.line(т);}
  if(L<H.length)вст+=D.btn("pzhint:"+p.id,L?"Ещё подсказка":"Подсказка",L?"Ещё подсказка: небольшая, не ответ":"Подсказка: небольшая, не ответ");
  const назад=D.btn("view","Назад");const i=html.lastIndexOf(назад);return i>=0?html.slice(0,i)+вст+html.slice(i):html+вст;},
 депПодсказка(id){const D=Deep;const s=D.here();const x=s&&D.st(s);const p=s&&s.puzzles.find(q=>q.id===id);if(!p||!x)return D.view();
  if(x.solved[id])return D.puzzle(id);const H=this.депПодсказки(p);if(!H.length)return D.puzzle(id);
  x.hint150=x.hint150&&typeof x.hint150==="object"?x.hint150:{};const L=Math.min(H.length,(Number(x.hint150[id])||0)+1);x.hint150[id]=L;
  safeFn(()=>Bank.play("uh_page",{gain:0.35,maxSec:2}));D._note=`Подсказка ${L}: ${H[L-1]}`;safeFn(()=>saveGame(true));return D.puzzle(id);},
 /* ── подземелье: что дальше после решённой загадки ── */
 дальше(D,s,x,p,знал){const t=[];
  /* замки, которые отперла именно эта загадка (а не решённая раньше на том же ярусе) */
  const отперт=s.locks.filter(L=>!x.locks[L.id]&&L.tier===p.tier&&x.know["lockpz"+L.id]&&!(знал&&знал.has("lockpz"+L.id)));
  if(отперт.length)t.push(`Где-то на этом ярусе щёлкнул ${отперт.map(L=>L.n).join(" и ")}: теперь ${отперт.length>1?"их":"его"} можно открыть`);
  else{const ряд=(a,b)=>Math.abs(a.tier-p.tier)-Math.abs(b.tier-p.tier)||a.tier-b.tier;
   const m=s.mechs.filter(m=>D.mst(x,m)==="combo"&&!x.know["mcode"+m.id]&&!x.code&&!x.know.consolecode).sort(ряд)[0];
   const L=!m&&!x.code&&s.locks.filter(L=>(DEEP_LOCK_KINDS[L.kind]||{}).треб==="code"&&!x.locks[L.id]&&!x.know["lock"+L.id]).sort(ряд)[0];
   if(m){x.know["mcode"+m.id]=1;t.push(`На обороте загадки выбита комбинация: она подходит к механизму «${DEEP_MECH_KINDS[m.kind].n}» на ${m.tier}-м ярусе — «Ввести комбинацию» у него теперь сработает`);}
   else if(L){x.know["lock"+L.id]=1;t.push(`В пазах загадки — три цифры: код к замку «${L.n}» на ${L.tier}-м ярусе`);}}
  if(!t.length){const q=s.puzzles.filter(q=>!x.solved[q.id]&&q.id!==p.id).sort((a,b)=>(a.tier<p.tier)-(b.tier<p.tier)||a.tier-b.tier)[0];
   t.push(q?`Следующая загадка этого подземелья — «${q.n}» на ${q.tier}-м ярусе`:"Все загадки этого подземелья решены");}
  return t.join(". ");},
 /* ── чертог: подсказки ── */
 ч(c){const r=c.r;if(!r.h150||typeof r.h150!=="object")r.h150={};return r.h150;},
 гдеКлюч(c,проверка,что){const room=c.F.rooms.find(q=>(q.objs||[]).some(проверка));if(!room)return `${что} в одной из прежних комнат яруса`;
  const o=room.objs.find(проверка);const был=!!((Chertog.fs(c.r.floor).r||{})[room.id]||{}).v;
  return `${o.t==="fresco"?"фреска":"надпись"} в комнате «${room.name}»${был?"":" — вы там ещё не были"}`;},
 чПодсказки(c){const pz=c.room.pz;if(!pz)return [];const id=c.room.id;
  const h1=`Ключ к головоломке — ${this.гдеКлюч(c,o=>o.hint===id&&(o.t==="inscription"||o.t==="fresco"),"надпись")}.`;let h2="";
  const сл=n=>this.порядок(n,c.r.i*31+c.r.floor*7+id);
  switch(pz.kind){
   case "levers":h2=`Первым опускают рычаг «${pz.ans[0]}».`;break;
   case "bells":h2=`Первым звучит ${CH_BELLS[pz.ans[0]][0]} колокол.`;break;
   case "runes":h2=`Первая руна — ${pz.ans[0]}.`;break;
   case "scales":h2=`Одна из нужных гирь — ${pz.w[0]}.`;break;
   case "mirrors":{const w=сл(CH_DIRS.filter(d=>d!==pz.ans));h2=`Луч ищет не ${w[0]} и не ${w[1]}.`;break;}
   case "stars":{const g=PANTHEON.find(x=>x.id===pz.ans);if(!g)break;const др=сл(PANTHEON.filter(x=>x.id!==pz.ans)).slice(0,2);
    h2=`Покровитель — один из трёх: ${сл([g].concat(др)).map(x=>x.n).join(", ")}.`;break;}
   case "dials":h2=`Первая цифра — ${pz.ans[0]}.`;break;
   case "tiles":h2=`Первый шаг — ${pz.ans[0]}.`;break;}
  return h2?[h1,h2]:[h1];},
 ходПодсказки(c,e){const eid=e.id;
  if(e.lock==="riddle"){const rr=CH_RIDDLES[e.riddle];if(!rr)return [];const w=this.порядок(rr[2],(Number(e.riddle)||0)*31+eid);
   return [`Привратник стирает с камня один неверный ответ: не «${w[0]}».`,`И ещё один: не «${w[1]}».`];}
  if(e.lock==="rune")return [`Слово открытия выбито здесь же, на ярусе: ${this.гдеКлюч(c,o=>o.word===eid&&o.t==="inscription","надпись")}.`,`Первая руна слова — ${e.word[0]}.`];
  if(e.lock==="note")return [`Мелодия нарисована здесь же, на ярусе: ${this.гдеКлюч(c,o=>o.melody===eid&&o.t==="fresco","фреска")}.`,`Первым звучит ${CH_BELLS[e.melody[0]][0]} колокол.`];
  return [];},
 вставить(html,назад,вст){const i=html.lastIndexOf(назад);return i>=0?html.slice(0,i)+вст+html.slice(i):html+вст;},
 строки(H,L,cmd,ещё,первая){let h="";for(let i=0;i<L&&i<H.length;i++)h+=Chertog.line(`Подсказка ${i+1}: ${H[i]}`);if(L<H.length)h+=Chertog.btn(cmd,L?ещё:первая);return h;},
 вХод(c,e,html){const H=this.ходПодсказки(c,e);if(!H.length)return html;const L=Math.min(H.length,Number(this.ч(c)[`e${c.r.floor}:${e.id}`])||0);
  if(e.lock==="riddle"){const rr=CH_RIDDLES[e.riddle];for(const o of this.порядок(rr[2],(Number(e.riddle)||0)*31+e.id).slice(0,L))html=html.split(Chertog.btn(`ans:${e.id}~${o}`,`Ответ: ${o}`)).join("");}
  return this.вставить(html,Chertog.btn("view","Назад, в комнату"),this.строки(H,L,`eh:${e.id}`,"Ещё подсказка к ходу","Подсказка к ходу"));},
 чПодсказка(){const c=Chertog.cur();if(!c||!c.room.pz||Chertog.rs(c.room.id).p)return Chertog.view();const H=this.чПодсказки(c);const k=`p${c.r.floor}:${c.room.id}`;
  const L=Math.min(H.length,(Number(this.ч(c)[k])||0)+1);this.ч(c)[k]=L;safeFn(()=>Bank.play("uh_page",{gain:0.35,maxSec:2}));Chertog.say(`Подсказка ${L}: ${H[L-1]}`);return Chertog.view();},
 ходПодсказка(eid){const c=Chertog.cur();const e=c&&c.F.edges[eid];if(!e||Chertog.isOpen(c,e))return Chertog.view();const H=this.ходПодсказки(c,e);if(!H.length)return Chertog.edgeView(eid);
  const k=`e${c.r.floor}:${eid}`;const L=Math.min(H.length,(Number(this.ч(c)[k])||0)+1);this.ч(c)[k]=L;safeFn(()=>Bank.play("uh_page",{gain:0.35,maxSec:2}));Chertog.say(`Подсказка ${L}: ${H[L-1]}`);return Chertog.edgeView(eid);},
 /* плита-загадка */
 плитаЗагадка(c){return CH_RIDDLES[(c.r.i+c.room.id)%CH_RIDDLES.length];},
 плитаВычерк(c){const q=this.плитаЗагадка(c);const L=Number(this.ч(c)[`t${c.r.floor}:${c.room.id}`])||0;return this.порядок(q[2],c.r.i*7+c.room.id*13).slice(0,Math.min(2,L));},
 /* ── говорящий череп: загадка по-настоящему ── */
 черепЗагадка(c,n,x){const занято=new Set((c.F.edges||[]).filter(e=>e.lock==="riddle").map(e=>e.riddle));
  занято.add((c.r.i+c.room.id)%CH_RIDDLES.length);let k=((Number(c.r.i)||0)*7+(Number(c.r.floor)||0)*13+(Number(n.id)||0)*5+(Number(x.skTry)||0)*11)%CH_RIDDLES.length;
  for(let i=0;i<CH_RIDDLES.length&&занято.has(k);i++)k=(k+1)%CH_RIDDLES.length;return {k,q:CH_RIDDLES[k]};},
 черепПодсказки(z){const w=this.порядок(z.q[2],z.k*17+3);return [`Череп скалится: «Не „${w[0]}“ — это я тебе даром говорю».`,`И щёлкает ещё раз: «И не „${w[1]}“».`];},
 череп(){const c=Chertog.cur();const n=c&&InstanceNPCSystem.at(c,c.room.id);if(!n||n.role!=="skull")return Chertog.view();const x=InstanceNPCSystem.ns(c,n);
  if(x.skWon){Chertog.say(`${n.n}: «Своё я отдал. Пароли этого яруса ты знаешь — ищи других черепов ниже».`);return Chertog.view();}
  const z=this.черепЗагадка(c,n,x);const L=Math.min(2,Number(x.skHint)||0);const H=this.черепПодсказки(z);const вычерк=this.порядок(z.q[2],z.k*17+3).slice(0,L);
  let h=Chertog.line(`${n.n} щёлкает челюстью: «Отгадаешь — скажу, что знаю: я помню пароли этого яруса. Слушай: ${z.q[0]}»`);
  for(const o of this.порядок([z.q[1]].concat(z.q[2]),z.k*7+1))if(вычерк.indexOf(o)<0)h+=Chertog.btn(`skans:${o}`,`Ответ: ${o}`);
  h+=this.строки(H,L,"skhint","Ещё подсказка","Подсказка");h+=Chertog.btn("view","Назад, в комнату");return Chertog.show("Загадки черепа",h);},
 черепПодсказка(){const c=Chertog.cur();const n=c&&InstanceNPCSystem.at(c,c.room.id);if(!n||n.role!=="skull")return Chertog.view();const x=InstanceNPCSystem.ns(c,n);
  const z=this.черепЗагадка(c,n,x);const H=this.черепПодсказки(z);x.skHint=Math.min(H.length,(Number(x.skHint)||0)+1);Chertog.say(`Подсказка ${x.skHint}: ${H[x.skHint-1]}`);return this.череп();},
 черепПароль(c){const r=c.r;
  const дверь=(c.F.edges||[]).find(e=>e.lock==="riddle"&&!Chertog.isOpen(c,e));if(дверь)return `«Немому привратнику ответь: „${CH_RIDDLES[дверь.riddle][1]}“ — и он отступит».`;
  const арка=(c.F.edges||[]).find(e=>e.lock==="rune"&&!Chertog.isOpen(c,e));if(арка)return `«Слово рунной арки — ${арка.word.join(" — ")}».`;
  const нота=(c.F.edges||[]).find(e=>e.lock==="note"&&!Chertog.isOpen(c,e));if(нота)return `«Нотная дверь просит: ${нота.melody.map(b=>CH_BELLS[b][0]).join(", ")}».`;
  const F=Chertog.fs(r.floor);const тайный=(c.F.edges||[]).find(e=>e.lock==="shadow"&&!F.e[e.id]&&!e.bypz&&!e.byseq);
  if(тайный)return `«А ещё здесь есть тайный ход». ${Chertog.findSecret(c,тайный,"череп")}`;
  const гол=(c.F.rooms||[]).find(q=>q.t==="puzzle"&&q.pz&&!(F.r[q.id]||{}).p);if(гол)return `«Головоломка в комнате «${гол.name}»: ${Chertog.hintText(гол.pz)}»`;
  const g=20+(Number(c.s&&c.s.level)||1)*4;G.gold=(Number(G.gold)||0)+g;return `«Паролей на этом ярусе не осталось — держи золото». ${g} золота.`;},
 черепОтвет(o){const c=Chertog.cur();const n=c&&InstanceNPCSystem.at(c,c.room.id);if(!n||n.role!=="skull")return Chertog.view();const x=InstanceNPCSystem.ns(c,n);
  if(x.skWon)return this.череп();const z=this.черепЗагадка(c,n,x);
  if(o===z.q[1]){x.skWon=1;x.att=Math.min(100,(Number(x.att)||0)+10);const т=this.черепПароль(c);Chertog.stat("загадок");
   Inst.emit("puzzleSolved",{i:c.r.i,f:c.r.floor,room:c.room.id});safeFn(()=>Bank.play("arc_shine",{gain:0.5,maxSec:2}));
   InstanceNPCSystem.remember(c,n);Chertog.say(`«${o}»! — ${n.n} клацает зубами. ${т}`);return Chertog.view();}
  x.skTry=(Number(x.skTry)||0)+1;x.skHint=0;Chertog.noise(1);Inst.emit("puzzleFailed",{i:c.r.i});
  Chertog.say(`«Мимо!» — ${n.n} хохочет так, что слышно по всему ярусу. Спросите снова — будет другая загадка.`);return Chertog.view();},
 /* ── Сплетение: шут и зачёт ── */
 шутЛишний(s){const r=SPL.riddles[s.riddleNow];if(!r)return -1;return this.порядок(r.ответы.map((_,i)=>i).filter(i=>i!==r.верно),Number(s.riddleDay)||1)[0];},
 зачётЛишний(s){const ex=SPL.exams[s.examNow];if(!ex)return -1;return this.порядок(ex.ответы.map((_,i)=>i).filter(i=>i!==ex.верно),Number(s.examDay)||1)[0];}};

/* ═══ подземелье ═══ */
safeFn(()=>{const sp0=Deep.spec;Deep.spec=function(){const s=sp0.apply(this,arguments);
 if(s&&!s.з150){safeFn(()=>Загадки150.доделать(s));safeFn(()=>Object.defineProperty(s,"з150",{value:true}));}return s;};});
safeFn(()=>{const pz0=Deep.puzzle;Deep.puzzle=function(id){
 const s=safeFn(()=>this.here(),null);const x=s&&safeFn(()=>this.st(s),null);const p=s&&(s.puzzles||[]).find(q=>q.id===id);
 if(!p||!x||x.solved[id])return pz0.apply(this,arguments);
 const sh0=this.show;const D=this;this.show=function(title,html,сказать){if(title===p.n)html=safeFn(()=>Загадки150.вДеп(D,s,x,p,String(html)),html);return sh0.call(this,title,html,сказать);};
 try{return pz0.apply(this,arguments);}finally{this.show=sh0;}};});
safeFn(()=>{const c0=Deep.cmd;Deep.cmd=function(a){const t=String(a||"");
 if(t.indexOf("pzhint:")===0)return safeFn(()=>Загадки150.депПодсказка(t.slice(7)),false)||this.view();return c0.apply(this,arguments);};});
/* решённая загадка: награда настоящая и слово о том, что дальше */
safeFn(()=>{const ps0=Deep.pzSolve;Deep.pzSolve=function(s,x,p){
 if(!s||!x||!p)return ps0.apply(this,arguments);
 let ход="";if(p.reward==="ход"&&!s.secrets.some(q=>q.tier===p.tier&&!x.found[q.id])){
  const z=s.secrets.filter(q=>q.tier>p.tier&&!x.found[q.id]).sort((a,b)=>a.tier-b.tier)[0];
  if(z){x.found[z.id]=1;ход=`найден тайный путь: ${z.n} на ${z.tier}-м ярусе — ведёт к: ${z.gives}`;p.reward="ход150";}else p.reward="тайник";}
 const было=!!(x.sec&&x.sec.open);const знал=new Set(Object.keys(x.know||{}).filter(k=>k.indexOf("lockpz")===0));const say0=this.say;const D=this;
 this.say=function(t,o){let тт=String(t||"");
  if(/^Загадка решена!/.test(тт)){
   /* «открылся тайная дверь» — глагол по роду имени хода */
   тт=тт.replace(/открылся ([а-яё]+(?:ая|яя)) /,"открылась $1 ").replace(/открылся ([а-яё]+(?:ое|ее)) /,"открылось $1 ");
   if(ход)тт=тт.replace(/^Загадка решена!\s*/,"Загадка решена! "+ход+(/^Загадка решена!\s*[;.]/.test(тт)?"":"; "));
   if(/(^Загадка решена! |; )редкая вещь(?=[;.])/.test(тт)){const b=DEEP_BIOME_BY_ID[s.tiers[p.tier].b];const рес=b.ресурсы[2];G.inv[рес]=(Number(G.inv[рес])||0)+3;тт=тт.replace("редкая вещь",`${рес} ×3`);}
   const д=safeFn(()=>Загадки150.дальше(D,s,x,p,знал),"");
   const тайна=!было&&x.sec&&x.sec.open&&s.secret?` Решённые загадки сошлись: открыт путь в ${s.secret.n.toLowerCase()}.`:"";
   тт=тт.replace(/\s*$/,"")+(д?` ${д}.`:"")+тайна;}
  return say0.call(this,тт,o);};
 try{return ps0.apply(this,arguments);}finally{this.say=say0;}};});
/* комбинация, которую дала загадка или назвал житель, принимается механизмом */
safeFn(()=>{const ma0=Deep.mechAct;Deep.mechAct=function(id,a){
 if(a!=="code")return ma0.apply(this,arguments);const s=safeFn(()=>this.here(),null);const x=s&&safeFn(()=>this.st(s),null);
 if(!x||!x.know||x.code||x.know.consolecode||!x.know["mcode"+id])return ma0.apply(this,arguments);
 x.know.consolecode=1;try{return ma0.apply(this,arguments);}finally{delete x.know.consolecode;}};});
/* житель, знающий машины, помнит и комбинацию к той, что заперта (и назначение машины — с заглавной после точки) */
safeFn(()=>{const ask0=Deep.ask;Deep.ask=function(id){
 const s=safeFn(()=>this.here(),null);const x=s&&safeFn(()=>this.st(s),null);const n=s&&x&&safeFn(()=>this.people(s,x).find(z=>z.id===id),null);
 if(!n||n.знает!=="mech")return ask0.apply(this,arguments);
 const m=s.mechs.find(m=>["damaged","repair","combo"].includes(this.mst(x,m)));
 const код=!!m&&this.mst(x,m)==="combo"&&!x.know["mcode"+m.id]&&!x.code;const имя=m?DEEP_MECH_KINDS[m.kind].n.toLowerCase():"";const say0=this.say;
 this.say=function(t,o){let тт=String(t||"");
  if(тт.indexOf(n.n+":")===0&&тт.indexOf("Не твоё дело")<0){тт=тт.replace(/(ярусе [^.«»]+\. )([а-яё])/,(_,a,b)=>a+b.toUpperCase());
   if(код&&тт.toLowerCase().indexOf(имя)>=0){x.know["mcode"+m.id]=1;тт+=" И добавляет: «Комбинацию я помню — запомни и ты». Теперь «Ввести комбинацию» у механизма сработает.";}}
  return say0.call(this,тт,o);};
 try{return ask0.apply(this,arguments);}finally{this.say=say0;}};});

/* ═══ чертог ═══ */
safeFn(()=>{const P=InstancePuzzleEngine;const b0=P.buttons;P.buttons=function(c){let h=b0.apply(this,arguments);
 safeFn(()=>{const H=Загадки150.чПодсказки(c);const L=Math.min(H.length,Number(Загадки150.ч(c)[`p${c.r.floor}:${c.room.id}`])||0);
  h+=Загадки150.строки(H,L,"pzhint","Ещё подсказка к головоломке","Подсказка к головоломке");});
 return h;};});
/* головоломка решена: ключ — к какой двери, ход — в какой стене */
safeFn(()=>{const P=InstancePuzzleEngine;const s0=P.solved;P.solved=function(c){
 if(!c||!c.room)return s0.apply(this,arguments);const F=Chertog.fs(c.r.floor);let ключ=null,дверь=null;
 const give0=Chertog.give;
 if(c.room.pzReward==="key")Chertog.give=function(k,n){if(!ключ&&(k==="iron"||k==="bronze")){
   дверь=(c.F.edges||[]).find(e=>e.lock==="door"&&["iron","bone","bronze"].includes(e.need)&&F.e[e.id]!=="open"&&!(Chertog.key(e.need)>0))||null;
   if(дверь)k=дверь.need;ключ=k;}return give0.call(this,k,n);};
 const cs=Chertog.say;Chertog.say=function(t){let тт=String(t||"");
  if(ключ&&тт.indexOf("Из ниши выпал ключ.")>=0){const комн=дверь?c.F.rooms[дверь.a]:null;
   тт=тт.replace("Из ниши выпал ключ.",`Из ниши выпал ${CH_KEYS[ключ]}.`+(дверь?` Он подходит к запертой двери${комн?` в комнате «${комн.name}»`:""}.`:" Он пригодится у запертых дверей чертога."));}
  if(тт.indexOf("В стене открылся тайный ход.")>=0){const e=(c.F.edges||[]).find(e=>e.bypz===c.room.id);
   if(e){const d=safeFn(()=>Chertog.exitDir(c,e),"");const куда=c.F.rooms[e.a===c.room.id?e.b:e.a];if(d)тт=тт.replace("В стене открылся тайный ход.",`В стене открылся тайный ход: на ${d}${куда?`, в ${куда.name}`:""}.`);}}
  return cs.call(this,тт);};
 try{return s0.apply(this,arguments);}finally{Chertog.give=give0;Chertog.say=cs;}};});
safeFn(()=>{const ev0=Chertog.edgeView;Chertog.edgeView=function(eid){const c=this.cur();const e=c&&c.F.edges[eid];
 if(!e||!["riddle","rune","note"].includes(e.lock))return ev0.apply(this,arguments);
 const sh0=this.show;this.show=function(title,html){if(title==="Запертый ход")html=safeFn(()=>Загадки150.вХод(c,e,String(html)),html);return sh0.call(this,title,html);};
 try{return ev0.apply(this,arguments);}finally{this.show=sh0;}};});
safeFn(()=>{const T=InstanceTrapEngine;const b0=T.buttons;T.buttons=function(c){let h=b0.apply(this,arguments);
 safeFn(()=>{const t=this.def(c);const R=Chertog.rs(c.room.id);if(!t||!t.загадка||R.t!=="found")return;
  for(const o of Загадки150.плитаВычерк(c))h=h.split(Chertog.btn(`trap:ans~${o}`,`Ответить: ${o}`)).join("");
  const q=Загадки150.плитаЗагадка(c);const w=Загадки150.порядок(q[2],c.r.i*7+c.room.id*13);
  const H=[`На краю плиты стёрт один неверный ответ: не «${w[0]}».`,`И ещё один: не «${w[1]}».`];
  h+=Загадки150.строки(H,Math.min(2,Number(Загадки150.ч(c)[`t${c.r.floor}:${c.room.id}`])||0),"trap:hint","Ещё подсказка","Подсказка к загадке плиты");});
 return h;};
 const a0=T.act;T.act=function(how,val){if(how!=="hint")return a0.apply(this,arguments);const c=Chertog.cur();const t=c&&this.def(c);const R=c&&Chertog.rs(c.room.id);
  if(!t||!t.загадка||R.t!=="found")return Chertog.view();const k=`t${c.r.floor}:${c.room.id}`;const L=Math.min(2,(Number(Загадки150.ч(c)[k])||0)+1);Загадки150.ч(c)[k]=L;
  const q=Загадки150.плитаЗагадка(c);const w=Загадки150.порядок(q[2],c.r.i*7+c.room.id*13);
  Chertog.say(`Подсказка ${L}: ${L===1?`на краю плиты стёрт один неверный ответ: не «${w[0]}»`:`и ещё один: не «${w[1]}»`}.`);return Chertog.view();};});
safeFn(()=>{const a0=InstanceNPCSystem.act;InstanceNPCSystem.act=function(a){if(a==="riddle")return Загадки150.череп();return a0.apply(this,arguments);};});
safeFn(()=>{const c0=Chertog.cmd;Chertog.cmd=function(a){const [k,arg]=String(a||"").split(":");const p=String(arg||"").split("~");
 switch(k){case "pzhint":return Загадки150.чПодсказка();case "eh":return Загадки150.ходПодсказка(+p[0]);
  case "skans":return Загадки150.черепОтвет(p[0]);case "skhint":return Загадки150.черепПодсказка();}
 return c0.apply(this,arguments);};});
/* стук: в этой комнате сплошной камень — но слышно, из какой соседней комнаты эхо пустое */
safeFn(()=>{const k0=Chertog.knock;Chertog.knock=function(){const c=this.cur();const cs=this.say;
 this.say=function(t){let тт=String(t||"");if(тт==="Стены отвечают плотным камнем."&&c){const F=Chertog.fs(c.r.floor);
   for(const eid of c.room.ex){const e=c.F.edges[eid];if(!e||!Chertog.isOpen(c,e))continue;const др=e.a===c.room.id?e.b:e.a;const room=c.F.rooms[др];if(!room)continue;
    const есть=room.ex.some(id=>{const z=c.F.edges[id];return z&&z.lock==="shadow"&&!F.e[z.id]&&!z.bypz&&!z.byseq&&["falsewall","hidden","door","stairs"].includes(z.sk);});
    if(есть){тт=`Здесь стены отвечают плотным камнем. Но из хода на ${Chertog.exitDir(c,e)} эхо возвращается пустым: в соседней комнате за кладкой есть ход — простучите стены там.`;break;}}}
  return cs.call(this,тт);};
 try{return k0.apply(this,arguments);}finally{this.say=cs;}};});

/* ═══ Сплетение: шут Кривой Короны и зачёт Буревала ═══ */
safeFn(()=>{const mv0=Spletenie.mView;Spletenie.mView=function(id){if(id!=="korona"&&id!=="buria")return mv0.apply(this,arguments);
 const s=this.st();const sh0=this.show;const S=this;
 this.show=function(title,html,сказать){html=String(html);
  safeFn(()=>{if(id==="korona"&&s.riddleNow!=null&&SPL.riddles[s.riddleNow]){const r=SPL.riddles[s.riddleNow];
    if(s.riddleHint===s.riddleDay){const i=Загадки150.шутЛишний(s);html=html.split(S.btn("riddle:"+i,r.ответы[i])).join("")+S.line(`Подсказка: шут подмигнул — только не «${r.ответы[i]}».`);}
    else html+=S.btn("riddlehint","Подсказка к загадке шута","Подсказка к загадке шута: небольшая, не ответ");}
   if(id==="buria"&&s.examNow!=null&&SPL.exams[s.examNow]){const ex=SPL.exams[s.examNow];
    if(s.examHint===s.examDay){const i=Загадки150.зачётЛишний(s);html=html.split(S.btn("exam:"+i,ex.ответы[i])).join("")+S.line(`Подсказка: сосед по скамье шепнул — точно не «${ex.ответы[i]}».`);}
    else html+=S.btn("examhint","Подсказка к зачёту","Подсказка к зачёту: небольшая, не ответ");}});
  return sh0.call(this,title,html,сказать);};
 try{return mv0.apply(this,arguments);}finally{this.show=sh0;}};});
safeFn(()=>{const c0=Spletenie.cmd;Spletenie.cmd=function(a){const [act]=String(a||"").split(":");
 if(act==="riddlehint"){const s=this.st();const r=s.riddleNow!=null?SPL.riddles[s.riddleNow]:null;if(r){s.riddleHint=s.riddleDay;const i=Загадки150.шутЛишний(s);
   narrate(`Шут подмигивает: «Только не „${r.ответы[i]}“!»`,{interrupt:true,итог:true});safeFn(()=>saveGame(true));}return this.mView("korona");}
 if(act==="examhint"){const s=this.st();const ex=s.examNow!=null?SPL.exams[s.examNow]:null;if(ex){s.examHint=s.examDay;const i=Загадки150.зачётЛишний(s);
   narrate(`Сосед по скамье шепчет: «Точно не „${ex.ответы[i]}“».`,{interrupt:true,итог:true});safeFn(()=>saveGame(true));}return this.mView("buria");}
 return c0.apply(this,arguments);};});
/* что дальше после ответа шуту и экзаменатору */
safeFn(()=>{const r0=Spletenie.riddleAnswer;Spletenie.riddleAnswer=function(i){const s=this.st();const был=s.riddleNow!=null&&!!SPL.riddles[s.riddleNow];const t=r0.apply(this,arguments);
 return был?String(t)+(/^Верно!/.test(String(t))?" Милость Шута Последнего Слова растёт.":"")+" Следующую загадку шут загадает через два дня, в землях Короны.":t;};});
safeFn(()=>{const e0=Spletenie.examAnswer;Spletenie.examAnswer=function(i){const s=this.st();const t=e0.apply(this,arguments);
 if(/^Зачёт сдан/.test(String(t))){const n=Number(s.exams)||0;if(n<5)return String(t)+` Зачётов сдано: ${n} из пяти — за пятый академия выдаёт диплом. Следующий зачёт — через три дня.`;}
 return t;};});
