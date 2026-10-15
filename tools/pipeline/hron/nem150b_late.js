/* ════════════════════════════════════════════════════════════════════════
   ТВАРИ НЕМОТЫ (15.0)
   Семь родов, что живут там, где гаснут имена. Своего боя и своего
   бестиария у них нет: они стоят в общем порядке тварей — голос вида, род,
   добыча, роль на поле схватки, — встают в полях Немоты вместо здешних зверей
   и в Немых штольнях по ярусам, а особенности их держатся в тех же местах,
   где держатся умения нежити: удар героя, удар твари, начало боя.
   У каждой есть способ одолеть: оружие и приёмы Тихой Меры работают всегда,
   чары школ — смотря по твари.
   ════════════════════════════════════════════════════════════════════════ */
const НЕМ_ТВАРИ=[
 {id:"nem_hound",n:"Немохвост",snd:"mgrowl",fx:"growl",biomes:[],min:2,max:12,нем:"hound",
  о:"хищник полей Немоты: длинное безволосое тело, хвост метёт траву без шороха",
  миф:"Звездочёты Предела писали, что немохвост — пёс, который однажды не смог залаять и ушёл искать свой голос туда, где голосов нет совсем.",
  кто:"Вольные Слухачи держат немохвостов на цепи у схронов: чужой к ним неслышно не подойдёт.",
  умения:["глушащий укус: две следующие чары школ вдвое дороже","идёт на звук: чара школы в поле Немоты может его позвать"],
  слабость:"«Приглушить» сбивает его со следа, «Купол тиши» прячет от его слуха"},
 {id:"nem_swarm",n:"Рой тиши",snd:"mhiss",fx:"hiss",biomes:[],min:1,max:9,нем:"swarm",
  о:"облако крошечных глухих мошек: где оно висит, звук вязнет, как в вате",
  миф:"Немые Братья говорят, что рой — это молитвы, которые не долетели, и потому он не жалит того, кто молчит.",
  кто:"Гильдия Тихой Меры собирает с роя тишь-смолу: ею пропитывают плащи тиши.",
  умения:["ватное тело: удар оружием вязнет и идёт вполсилы"],
  слабость:"«Развеять тишью» рассыпает рой клочьями — бьёт его тяжело, без всякой ваты"},
 {id:"nem_burnt",n:"Выгоревший",snd:"mwail",fx:"wail",biomes:[],min:3,max:13,нем:"burnt",
  о:"бывший маг, у которого Немота забрала имя чар: он помнит жесты и тянется к чужой мане, как замёрзший к огню",
  миф:"В Сильвене говорят: выгоревший не злой. Он пытается вспомнить, как звучало его заклинание, и ищет его в вас.",
  кто:"Приют Тишайших забирает выгоревших к себе и учит жить без магии; Коллегия Звона ищет, как вернуть им чары.",
  умения:["жадное касание: каждый удар забирает у вас три маны, ими он лечится"],
  слабость:"«Купол тиши» прячет вашу ману, и касание пусто; если Приют Тишайших вам доверяет, раненый выгоревший опускает руки"},
 {id:"nem_sparkeater",n:"Искроед",snd:"mhiss",fx:"hiss",biomes:[],min:2,max:12,нем:"eater",
  о:"плоская тварь с гребнем, похожим на камертон: ест остаточные импульсы — всё, что остаётся в воздухе после чар",
  миф:"Шестерёнщики, по преданию, держали искроедов в машинах вместо предохранителей: лишняя сила уходила в тварь, а не в пожар.",
  кто:"Безгласный Ряд платит за гребни искроедов: из них делают камертоны, что слышат чары за стеной.",
  умения:["ест чары: любая чара школ и удар маной идут ему в пищу и лечат его"],
  слабость:"оружие и приёмы Тихой Меры; «Погасить свойство» отнимает у него голод, и тогда ранят и чары"},
 {id:"nem_listener",n:"Слухач Немоты",snd:"mscreech",fx:"screech",biomes:[],min:2,max:11,нем:"listener",
  о:"разумный разведчик из тех, кто родился в Немоте: слышит шаг за сто шагов, а сам почти не слышен",
  миф:"Слухачи считают, что мир когда-то был тихим, а шум принесли люди с именами. Они не враги — они сторожа тишины.",
  кто:"Хранители Двери, говорят, платят слухачам за вести; Звёздная Мера пытается с ними говорить.",
  умения:["уходит раненым: на четверти здоровья бежит предупредить своих — упустите, и следующая тварь штолен выйдет сильнее"],
  слабость:"догнать: он быстр, но не вынослив"},
 {id:"nem_warden",n:"Страж-глушитель",snd:"mstomp",fx:"stomp",biomes:[],min:4,max:15,нем:"warden",
  о:"механизм Латунного Двора на трёх лапах; в груди у него глушитель, который давит чары вокруг",
  миф:"Латунный Двор продавал стражей державам как «вечный караул»: они не спят, не едят и не слушают приказов, кроме одного — молчать.",
  кто:"Драгошский Затвор чинит своих стражей и ставит их в казематы; Гильдия Тихой Меры разбирает диких на шестерни.",
  умения:["поле глушителя: пока он рядом, Немота вокруг вас на ступень глубже","медный панцирь: удар оружием на три слабее"],
  слабость:"«Перегрузить» — его глушитель лопается: урон вдвое, оцепенение, и поле гаснет; «Расшатать» снимает панцирь"},
 {id:"nem_lord",n:"Владыка Немоты",snd:"mwail",fx:"wail",biomes:[],min:9,max:18,нем:"lord",
  о:"сгусток тишины в облике безлицего человека; где он проходит, имена замолкают",
  миф:"Культ Молчаливого Бога зовёт его посланцем Старшей Зодчей, Стража Покрова — следом Безымянного, Гильдия — утечкой старой машины. Кто прав, не знает никто.",
  кто:"Живым его видели только те, кто спускался на седьмой ярус Немых штолен.",
  умения:["ест чары, как искроед","слово тишины: его чара гасит вашу ману","вбирает тишину: на половине здоровья один раз затягивает раны"],
  слабость:"Тихая Мера: «Купол тиши» гасит его слово, «Отвести» возвращает, «Погасить свойство» отнимает голод; оружие"}];
const НЕМ_ТВАРЬ=Object.fromEntries(НЕМ_ТВАРИ.map(m=>[m.id,m]));
/* род — голос рода и роль на поле: зверь-хищник, ползучие, люди, механизм, дух-колдун */
Object.assign(FOE_FAMILY_ID,{nem_hound:"beast",nem_swarm:"crawler",nem_burnt:"humanoid",nem_sparkeater:"crawler",
 nem_listener:"humanoid",nem_warden:"construct",nem_lord:"spirit"});
/* голос вида: свободный голос своего рода, прежние раскладки не сдвигаются */
safeFn(()=>{const b0=FoeVoices.build.bind(FoeVoices);FoeVoices.build=function(){const map=b0();
 const key=c=>c.role+"#"+c.v+"@"+c.rate;const занято=new Set(Object.keys(map).map(id=>{const v=map[id];return v.idle+"#"+v.v+"@"+v.rate;}));
 for(const m of НЕМ_ТВАРИ){if(map[m.id])continue;const f=foeFamily(m);const pool=this.pool(f);if(!pool.length)continue;
  const sz=this.size(m);const высоты=FOE_VOICE_RATES.filter(r=>sz<0?r<=1.001:sz>0?r>=0.999:true).concat(FOE_VOICE_RATES);let c=null;
  выбор:for(const rate of высоты)for(const role of pool)for(let v=0;v<this.files(role);v++){const x={role,v,rate};if(!занято.has(key(x))){c=x;break выбор;}}
  if(!c)c={role:pool[0],v:0,rate:1};занято.add(key(c));
  const k=pool.indexOf(c.role),cry=pool[(k+1)%pool.length];
  map[m.id]={family:f,idle:c.role,v:c.v,rate:c.rate,cry,cryV:c.v%Math.max(1,this.files(cry))};}
 this.map=map;return map;};FoeVoices.map=null;});
/* добыча: своё с каждого рода */
Object.assign(SPOILS_BY_ID,{
 nem_hound:[["немой клык",0.3],["шкура немохвоста",0.15]],
 nem_swarm:[["тишь-смола",0.4]],
 nem_burnt:[["обрывок записей",0.3],["выжженный перстень",0.06]],
 nem_sparkeater:[["искроедов гребень",0.25],["жила искры",0.08]],
 nem_listener:[["слуховая трубка",0.15],["немой кварц",0.3]],
 nem_warden:[["шестерня Зодчих",0.35],["немой кварц",0.4],["холодное железо",0.25]],
 nem_lord:[["сердце Немоты",1],["осколок Шва",0.5]]});
Object.assign(SPOIL_PRICE,{"немой клык":30,"шкура немохвоста":45,"тишь-смола":40,"обрывок записей":20,"выжженный перстень":240,
 "искроедов гребень":70,"жила искры":120,"слуховая трубка":90,"шестерня Зодчих":110,"сердце Немоты":600,"осколок Шва":320});
/* карточки вещей Немоты: «что это» и «откуда имя» — как у всех ресурсов и трофеев мира */
safeFn(()=>Object.assign(ITEM_LORE,{
 "немой кварц":{о:"бледный кварц из жил Немых штолен и Боргинских копей; его находят и у слухачей, и в груди стражей-глушителей. Гильдия Тихой Меры делает из него переносные глушители и заряжает их",
  имя:"«немой» — потому что не звенит: ударь им о камень — и звука нет; боргинские рудокопы заметили, что в его забое молчит даже эхо"},
 "тишь-смола":{о:"густая смола роя тиши: застывая, она гасит звук; ею пропитывают плащи тиши и сшивают печати «Сшить»",имя:"по рою тиши, с которого её снимают; «тишь» — старое слово для безмолвия, как в Сильвенской Тиши"},
 "жила искры":{о:"светлая прожилка из нутра искроеда: в ней заперта сила чар, которую он съел и не успел погасить; из неё делают звонкие кристаллы и перстни впитывания",
  имя:"жила — потому что тянется в камне, как жила под кожей; искра — потому что в темноте она вспыхивает"},
 "осколок Шва":{о:"осколок, который остаётся от Владыки Немоты: с одной стороны тёплый, с другой холодный; редкая артефактная часть",имя:"Швом в Доме Звёздной Меры зовут край Немоты — место, где мир сшит неровно и у вещей кончаются имена"},
 "немой клык":{о:"клык немохвоста — тот, после укуса которого чары школ даются вдвое дороже",имя:"по немохвосту, который никогда не лает; охотники Сильвена говорят, что и клык его не звенит о камень"},
 "шкура немохвоста":{о:"безволосая серая шкура немохвоста, холодная на ощупь; ладонь по ней скользит без шороха",имя:"по зверю: немохвост метёт хвостом траву, и не слышно ни травинки"},
 "обрывок записей":{о:"клочок тетради, который выгоревший носит при себе: обрывки формул и чужих имён; Дом Звёздной Меры платит за каждый",имя:"записи — потому что в них записано то, что Немота отняла у мага"},
 "выжженный перстень":{о:"перстень мага, выгоревший изнутри: камень пуст, но оправа ещё помнит тепло маны",имя:"выжженный — Немотой: она выпила его силу, как пламя выпивает фитиль"},
 "искроедов гребень":{о:"гребень искроеда, похожий на камертон; Безгласный Ряд делает из таких камертоны, что слышат чары за стеной",имя:"по искроеду, который ест то, что остаётся в воздухе после чар"},
 "слуховая трубка":{о:"изогнутая костяная трубка слухача Немоты: ею он слушает землю",имя:"так назвали её мастера Гильдии: трубка, в которую слушают"},
 "шестерня Зодчих":{о:"медная шестерня из груди стража-глушителя; комендатура Драгоша берёт их для своих стражей",имя:"по клейму Зодчих на ободе: древних мастеров, чьи механизмы до сих пор крутятся в чертогах и штольнях"},
 "сердце Немоты":{о:"тихий холодный сгусток, что остаётся от Владыки Немоты; рядом с ним даже своё сердце бьётся тише",имя:"сердцем его зовут потому, что от Владыки остаётся только оно"}}));
/* вещества Немоты — не новый род ресурсов (у мира их ровно двадцать два), а прибавка к прежним: немой кварц и жила
   искры — кристаллы, тишь-смола с роя — трофей твари, как и всё снятое с тварей Немоты, осколок Шва — артефактная часть */
safeFn(()=>{const троф=["тишь-смола","немой клык","шкура немохвоста","обрывок записей","выжженный перстень","искроедов гребень","слуховая трубка","шестерня Зодчих","сердце Немоты"];
 const в=(id,rs)=>{const k=RES_KINDS.find(x=>x.id===id);if(k)rs.forEach(r=>{if(k.res.indexOf(r)<0)k.res.push(r);RES_KIND_BY_RES[r]=k;});};
 в("crystal",["немой кварц","жила искры"]);в("trophy",троф);в("artpart",["осколок Шва"]);});
/* цены немого кварца, жилы искры, тишь-смолы и осколка Шва стоят в основе, до заморозки RES_BASE */
/* ── кто где водится ── */
const НемТвари={
 штольни(p){p=p||G.place;return !!(p&&!G.dark&&p.bx===24936&&p.by===25289);},
 /* поле: чем глубже Немота, тем чаще её твари вместо здешних зверей */
 поле(d){return d>=3?["nem_hound","nem_burnt","nem_sparkeater","nem_hound"]:d>=2?["nem_hound","nem_swarm","nem_burnt"]:["nem_hound","nem_swarm"];},
 ярус(dd){dd=Number(dd)||1;return dd<=1?["nem_swarm","nem_listener","nem_swarm"]:dd===2?["nem_swarm","nem_listener","nem_sparkeater"]
  :dd===3?["nem_sparkeater","nem_listener","nem_burnt"]:dd===4?["nem_burnt","nem_sparkeater","nem_warden","nem_listener"]
  :dd<=6?["nem_warden","nem_burnt","nem_sparkeater","nem_listener"]:["nem_warden","nem_sparkeater","nem_burnt"];},
 /* глубокие ярусы любых подземелий, где Немота уже глушь: к прежним тварям прибавляются её */
 глубь(){return ["nem_sparkeater","nem_warden","nem_burnt"];},
 из(ids){return ids.map(id=>НЕМ_ТВАРЬ[id]).filter(Boolean);},
 имя(m){return ((m&&НЕМ_ТВАРЬ[m.id])||m||{}).n||"тварь";},
 ест(cb){return !!(cb&&cb.m&&(cb.m.нем==="eater"||cb.m.нем==="lord")&&!cb.немГолодСнят);},
 /* страж шахты в Немых штольнях: на седьмом ярусе — Владыка */
 страж(d){d=Math.max(1,Number(d)||1);const h=k=>hashName(24936*7+d*13+k,25289*11+d*5+k*3,15200+k);
  /* страж шахты — тот, кого оружием одолеть можно и без приёмов: рой и бегущий слухач стражами не стоят */
  const пул=d<=1?["nem_listener"]:d===2?["nem_listener","nem_sparkeater"]:d===3?["nem_sparkeater","nem_burnt"]:["nem_warden","nem_burnt"];
  const m0=d>=7?НЕМ_ТВАРЬ.nem_lord:НЕМ_ТВАРЬ[пул[Math.floor(h(1)*пул.length)%пул.length]];
  const вес=safeFn(()=>depthWeight(d),1);const lvl=d>=7?16:Math.max(2,Math.round(2+d*1.6+h(3)*2));
  const титул=d>=7?"":GUARD_TITLES[Math.floor(h(2)*GUARD_TITLES.length)%GUARD_TITLES.length];
  return {...m0,n:d>=7?"Владыка Немоты, хозяин дна Немых штолен":`${титул} штолен: ${m0.n.charAt(0).toLowerCase()+m0.n.slice(1)}`,страж:true,ярус:d,ранг:"обычный",усилен:false,
   lvl,hp:Math.round((70+lvl*22)*вес*(d>=7?1.6:1)*safeFn(()=>diff().foeHp,1)),dmg:Math.round((7+lvl*2.2)*Math.min(2.2,вес)),
   xp:Math.round((60+lvl*26)*вес*(d>=7?2:1)),gold:Math.round((40+lvl*14)*вес)};},
 /* первая встреча — всё о твари; потом коротко: умения и чем её взять */
 слово(m){const s=Немота.ст();if(!s.твари||typeof s.твари!=="object")s.твари={};const t=НЕМ_ТВАРЬ[m.id]||m;const перв=!s.твари[m.id];s.твари[m.id]=(Number(s.твари[m.id])||0)+1;
  return перв?`Тварь Немоты — ${t.n.charAt(0).toLowerCase()+t.n.slice(1)}, ${t.о}. Умения: ${t.умения.join("; ")}. Чем взять: ${t.слабость}.`
   :`${t.n}: ${t.умения.map(u=>u.split(":")[0]).join(", ")}. Чем взять: ${t.слабость}.`;},
 /* на звук чары в поле Немоты приходит немохвост */
 зов(){try{if(G.inCombat||G.place||G.ship||G.dark)return false;const d=Немота.здесь();if(d<2)return false;
  const s=Немота.ст();const now=(Number(G.day)||1)*24+(Number(G.hour)||0);if(Number(s.зов)>now)return false;
  if(Math.random()>=0.12)return false;s.зов=now+3;
  const t=НЕМ_ТВАРЬ.nem_hound;const lv=Math.max(t.min,Math.min(t.max,(Number(G.level)||1)+Math.floor(Math.random()*2)));
  const m={...t,lvl:lv,hp:Math.round((20+lv*8)*safeFn(()=>diff().foeHp,1)),dmg:3+lv*2,xp:15+lv*10,gold:5+lv*4};
  safeFn(()=>Bank.play("lug_snarl",{gain:0.5,maxSec:3}));
  narrate("Чара отозвалась в Немоте — и на её звук из травы вышел немохвост.",{interrupt:true});
  setTimeout(()=>safeFn(()=>{if(!G.inCombat&&!G.place)startCombat({x:G.x,y:G.y,monster:m},{});}),1200);return true;}catch(_){return false;}}};
/* поля Немоты: вместо здешнего зверя — тварь Немоты (тот же жребий клетки, та же частота встреч) */
safeFn(()=>{const b0=beastAt;beastAt=function(x,y,c,доля){const m=b0.apply(this,arguments);
 if(!m||G.dark)return m;try{const d=Немота.мир(x,y);if(d<1)return m;
  if(hashName(x,y,15011)>=(d>=2?0.75:0.4))return m;const ids=НемТвари.поле(d);
  return НЕМ_ТВАРЬ[ids[Math.floor(hashName(x,y,15012)*ids.length)%ids.length]]||m;}catch(_){return m;}};});
/* подземелья: Немые штольни — свои твари по ярусам; глубокие ярусы с Немотой — вперемешку с прежними */
safeFn(()=>{const d0=dungeonPool;dungeonPool=function(base){const r=d0.apply(this,arguments);
 try{const p=G.place;if(!p||G.dark)return r;if(НемТвари.штольни(p))return НемТвари.из(НемТвари.ярус(p.depth));
  if(Немота.ярус(Number(p.depth)||0)>=2)return r.concat(НемТвари.из(НемТвари.глубь()));}catch(_){}
 return r;};});
safeFn(()=>{const g0=guardianAt;guardianAt=function(bx,by,depth){if(!G.dark&&bx===24936&&by===25289){const g=safeFn(()=>НемТвари.страж(depth),null);if(g)return g;}
 return g0.apply(this,arguments);};});
/* Глубь даёт тварям яруса породы и имена своего круга; у тварей Немоты свои имена и приёмы — их она не перекраивает:
   иначе страж-глушитель дрался бы под именем чужой породы и с чужими навыками поверх своих */
safeFn(()=>{const o0=Deep.onCombat.bind(Deep);Deep.onCombat=function(m,c){if(m&&m.нем)return;return o0(m,c);};});
/* сила по роду и тревога слухачей: тварь, которую предупредили, ждёт вас сильнее */
safeFn(()=>{const p0=Undead.prep.bind(Undead);Undead.prep=function(m,depth){const r=p0(m,depth);
 try{if(r&&r.нем&&!r.страж){const k={swarm:[0.7,0.8],eater:[0.85,0.9],warden:[1.4,1.1],burnt:[1,1],hound:[1,1],listener:[0.8,0.9],lord:[2,1.2]}[r.нем]||[1,1];
   r.hp=Math.max(5,Math.round(r.hp*k[0]));r.dmg=Math.max(1,Math.round(r.dmg*k[1]));
   const s=Немота.ст();if(НемТвари.штольни()&&(Number(s.тревога)||0)>0){s.тревога--;r.lvl+=2;r.hp=Math.round(r.hp*1.25);r.dmg+=4;r.предупреждён=true;}}}catch(_){}
 return r;};});
/* начало боя: что это за тварь и чем её взять */
safeFn(()=>{const s0=Undead.onStart.bind(Undead);Undead.onStart=function(m){const r=s0(m);
 if(m&&m.нем)setTimeout(()=>safeFn(()=>{if(G.combat&&G.combat.m===m)narrate((m.предупреждён?"Слухач предупредил своих: эта тварь ждала вас. ":"")+НемТвари.слово(m),{interrupt:false,cat:"combat"});}),1900);
 return r;};});
/* слухач бежит раненым */
safeFn(()=>{const i0=Arena.init.bind(Arena);Arena.init=function(cb,opts){const a=i0(cb,opts);if(a&&cb&&cb.m&&cb.m.нем==="listener"&&!cb.m.страж)a.coward=true;return a;};});
safeFn(()=>{const e0=Arena.foeEscaped.bind(Arena);Arena.foeEscaped=function(){const m=G.combat&&G.combat.m;const r=e0();
 if(m&&m.нем==="listener"){const s=Немота.ст();s.тревога=Math.min(3,(Number(s.тревога)||0)+1);
  setTimeout(()=>safeFn(()=>narrate("Слухач ушёл предупредить своих: в Немых штольнях о вас теперь знают.",{interrupt:false})),900);}
 return r;};});
/* удар героя оружием */
safeFn(()=>{const h0=Undead.onHit.bind(Undead);Undead.onHit=function(m,dmg){let d=h0(m,dmg);
 try{const cb=G.combat;if(!m||!m.нем||!cb)return d;
  if(m.нем==="swarm"&&d>0){d=Math.max(1,Math.round(d*0.5));if(!cb.немВата){cb.немВата=1;safeFn(()=>cbLog("Клинок вязнет в рое: удар вполсилы."));}}
  if(m.нем==="warden"&&d>0&&!((Number(cb.zvBreak)||0)>0)){d=Math.max(1,d-3);if(!cb.немПанцирь){cb.немПанцирь=1;safeFn(()=>cbLog("Медный панцирь стража гасит удар: на три слабее."));}}}catch(_){}
 return d;};});
/* удар твари по герою */
safeFn(()=>{const f0=foeStrike;foeStrike=matKeep(f0,function(o){const cb=G.combat;if(cb)cb.немРод=(o&&o.kind)||"melee";return f0.apply(this,arguments);});});
safeFn(()=>{const s0=Undead.onStrike.bind(Undead);Undead.onStrike=function(m,mdmg){let d=s0(m,mdmg);
 try{const cb=G.combat;if(!m||!m.нем||!cb)return d;const род=cb.немРод||"melee";
  switch(m.нем){
   case "hound":if(Math.random()<0.35){cb.немЗаглушка=2;safeFn(()=>{Bank.play("oc_drone_die",{kind:"combat",gain:0.45,maxSec:2});cbLog("Глушащий укус: две следующие чары школ — вдвое дороже.");});}break;
   case "burnt":{if((Number(cb.немКупол)||0)>0){safeFn(()=>cbLog("Жадное касание ищет вашу ману — купол тиши её прячет."));break;}
    const v=Math.min(3,Number(G.mana)||0);if(v>0){G.mana-=v;cb.hp=Math.min(Number(m.hp)||cb.hp,(Number(cb.hp)||0)+v);
     safeFn(()=>{Bank.play("magic_hum",{kind:"combat",gain:0.4,maxSec:2});cbLog(`Жадное касание: мана −${v}, выгоревший пьёт её.`);});}break;}
   case "lord":if(род==="bolt"){const v=Math.min(6,Number(G.mana)||0);if(v>0){G.mana-=v;safeFn(()=>{Bank.play("stk_dark",{kind:"combat",gain:0.5,maxSec:3});cbLog(`Слово тишины: мана −${v}.`);});}}break;}}catch(_){}
 return d;};});
/* Владыка — колдун: «Перегрузить» рвёт его канал */
safeFn(()=>{const м0=Немота.маг.bind(Немота);Немота.маг=function(m){return !!(m&&m.нем==="lord")||м0(m);};});
/* поле глушителя: пока страж цел и рядом, Немота вокруг на ступень глубже */
safeFn(()=>{const з0=Немота.здесь.bind(Немота);Немота.здесь=function(){const d=з0();
 const cb=G.inCombat&&G.combat;if(cb&&cb.m&&cb.m.нем==="warden"&&!cb.немСломан)return Math.min(5,d+1);return d;};});
/* глушащий укус: чары школ вдвое дороже */
safeFn(()=>{const k0=Power.spellK.bind(Power);Power.spellK=function(sp){const k=k0(sp);
 if(G.inCombat&&G.combat&&(Number(G.combat.немЗаглушка)||0)>0&&!Немота.тихое(sp))return k*2;return k;};});
/* чары школ — пища искроеда и Владыки; на звук чары в поле Немоты приходит немохвост */
safeFn(()=>{const c0=castSpell;castSpell=function(i){const sp=SPELLS[i];const cb=G.combat;
 try{if(sp&&G.inCombat&&НемТвари.ест(cb)&&!Немота.тихое(sp)&&G.spells&&G.spells.includes(sp.n)&&!(sp.custom&&safeFn(()=>spellCooling(sp),0))){
   const цена=Math.max(1,Math.round((Number(sp.cost)||1)*Немота.ступень(Немота.здесь()).цена));
   if((Number(G.mana)||0)>=цена){G.mana-=цена;const сыт=Math.max(2,Math.round(цена*1.5));cb.hp=Math.min(Number(cb.m.hp)||cb.hp,(Number(cb.hp)||0)+сыт);
    safeFn(()=>{Bank.play("magic_shimmer",{kind:"combat",gain:0.5,maxSec:2});setTimeout(()=>safeFn(()=>Bank.play("oc_drone_die",{kind:"combat",gain:0.5,maxSec:2})),300);});
    narrate(`${НемТвари.имя(cb.m)} втянул вашу чару, как воду: «${sp.n}» ушла ему в пищу, +${сыт} к его здоровью. Против него — оружие и приёмы Тихой Меры; «Погасить свойство» отнимет у него голод.`,{interrupt:true,cat:"combat"});
    safeFn(()=>{updateCombat();refresh();if(G.combat&&G.combat.arena&&!Arena.live())Arena.foeTurn();});return;}}}catch(_){}
 const мана0=Number(G.mana)||0;const r=c0.apply(this,arguments);
 safeFn(()=>{const потрачено=(Number(G.mana)||0)<мана0;if(!потрачено||!sp||Немота.тихое(sp))return;
  if(cb&&G.combat===cb&&(Number(cb.немЗаглушка)||0)>0)cb.немЗаглушка--;
  if(!G.inCombat)НемТвари.зов();});
 return r;};});
/* удар маной — тоже пища */
safeFn(()=>{const f0=fight;fight=function(a){const cb=G.combat;
 try{if(a==="magic"&&НемТвари.ест(cb)){const цена=Math.max(3,8-safeFn(()=>Tree.чарыK("цена"),0)-(safeFn(()=>buffActive("deepbreath"),false)?2:0));
   if((Number(G.mana)||0)>=цена){G.mana-=цена;const сыт=Math.max(2,Math.round(цена*1.5));cb.hp=Math.min(Number(cb.m.hp)||cb.hp,(Number(cb.hp)||0)+сыт);
    safeFn(()=>Bank.play("magic_shimmer",{kind:"combat",gain:0.5,maxSec:2}));
    cbLog(`${НемТвари.имя(cb.m)} съел удар маной: +${сыт} к его здоровью.`);narrate(cbLog2text());
    const ответ=safeFn(()=>Arena.reply(a),"strike");if(ответ==="strike")foeStrike({kind:"melee",counter:true});
    safeFn(()=>{updateCombat();refresh();});return;}}}catch(_){}
 return f0.apply(this,arguments);};});
/* приёмы Тихой Меры против тварей Немоты */
safeFn(()=>{const t0=Тишь.сделать.bind(Тишь);Тишь.сделать=function(sp){const cb=G.combat;const m=cb&&G.inCombat&&cb.m;
 if(m&&m.нем){
  if(sp.ядро==="quench"&&(m.нем==="eater"||m.нем==="lord")&&!cb.немГолодСнят){cb.немГолодСнят=true;this.звук("oc_pshsh",0.5);
   return ` ${m.нем==="eater"?"Гребень искроеда потух":"Тишина вокруг Владыки дрогнула"}: голод погашен — теперь ${m.нем==="eater"?"его":"Владыку"} ранят и чары.`;}
  if(sp.ядро==="overload"&&m.нем==="warden"){const d=Math.max(6,Math.round((16+(Number(m.lvl)||1)*4)*this.сила(sp)));cb.hp=Math.max(0,(Number(cb.hp)||0)-d);cb.svStun=(Number(cb.svStun)||0)+2;cb.немСломан=true;
   this.звук("oc_electrical",0.6);safeFn(()=>updateCombat());if(cb.hp<=0)setTimeout(()=>safeFn(()=>{if(G.combat===cb)victory();}),50);
   return ` Глушитель в груди стража лопнул: −${d}, страж оцепенел на два хода, его поле погасло.`;}}
 return t0(sp);};});
safeFn(()=>{const e0=castCustomEffect;castCustomEffect=function(sp){const cb=G.combat;
 if(sp&&sp.тихое&&sp.ядро==="dispel"&&G.inCombat&&cb&&cb.m&&cb.m.нем==="swarm"){const d=Math.max(12,Math.round((18+(Number(G.level)||1)*5)*Тишь.сила(sp)));
  cb.hp=Math.max(0,(Number(cb.hp)||0)-d);safeFn(()=>{Bank.play("oc_gust",{kind:"magic",gain:0.55,maxSec:2});updateCombat();});
  if(cb.hp<=0){narrate(`Заклинание «${sp.n}» сотворено. Рой рассыпался в пыль: −${d}.`,{cat:"result"});victory();return " ";}
  return ` Рой рассыпается клочьями: −${d}.`;}
 return e0.apply(this,arguments);};});
/* перемены по ходу боя: Владыка вбирает тишину, выгоревший опускает руки */
safeFn(()=>{const u0=updateCombat;updateCombat=function(){const r=u0.apply(this,arguments);
 try{const cb=G.combat;const m=cb&&cb.m;if(!m||!m.нем||!(cb.hp>0))return r;
  if(m.нем==="lord"&&!cb.немВобрал&&cb.hp<=(Number(m.hp)||1)*0.5){cb.немВобрал=true;
   setTimeout(()=>safeFn(()=>{if(G.combat!==cb||!(cb.hp>0))return;const v=Math.round((Number(m.hp)||10)*0.15);cb.hp=Math.min(Number(m.hp)||cb.hp,cb.hp+v);
    safeFn(()=>Bank.play("stk_dark",{kind:"combat",gain:0.6,maxSec:4}));narrate(`${m.n} вбирает тишину: раны затягиваются, +${v}.`,{interrupt:false,cat:"combat"});safeFn(()=>u0());}),700);}
  if(m.нем==="burnt"&&!cb.немСдался&&cb.hp<=(Number(m.hp)||1)*0.25&&standOf("guild","priyut")>=25){cb.немСдался=true;
   setTimeout(()=>safeFn(()=>{if(G.combat!==cb)return;endCombat();G.xp=(Number(G.xp)||0)+Math.round((Number(m.xp)||20)/2);addStand("guild","priyut",3,true);
    safeFn(()=>Bank.play("od_heal",{gain:0.45,maxSec:3}));
    narrate("Выгоревший опускает руки и садится на землю: он узнал знак Приюта Тишайших. Вы отпускаете его — Приют заберёт. Бой окончен, половина опыта ваша.",{interrupt:true});
    journal("Выгоревший отпущен: Приют Тишайших заберёт его.");safeFn(()=>{refresh();resumeLocationMusic();saveGame(true);});}),600);}}catch(_){}
 return r;};});
/* бестиарий: твари Немоты отдельным разделом, с голосом вида */
CMD.nemvoice=id=>{const m=НЕМ_ТВАРЬ[id];if(!m){narrate("Голос не найден.");return;}narrate(m.n);
 if(!safeFn(()=>foeProfileCue(m,"idle",{gain:0.7}),false))narrate(НЕТ_ЗАПИСИ,{interrupt:false});
 setTimeout(()=>safeFn(()=>foeProfileCue(m,"warcry",{gain:0.7})),1400);};
safeFn(()=>{const r0=renderBestiary;renderBestiary=function(){const r=r0.apply(this,arguments);
 safeFn(()=>{const el=document.getElementById("bestList");if(!el)return;
  el.insertAdjacentHTML("beforeend",`<h3>Твари Немоты</h3>`+НЕМ_ТВАРИ.map(m=>{
   const speak=`${m.n}. Уровни ${m.min}–${m.max}. ${m.о.charAt(0).toUpperCase()+m.о.slice(1)}. Умения: ${m.умения.join("; ")}. Чем взять: ${m.слабость}. Происхождение: ${m.миф} ${m.кто}`;
   return `<div class="list-line" tabindex="0" data-speak="${speak.replace(/"/g,"&quot;")}"><b>${m.n}</b> (уровни ${m.min}–${m.max}). ${m.о.charAt(0).toUpperCase()+m.о.slice(1)}.<br>
   Умения: ${m.умения.join("; ")}.<br>Чем взять: ${m.слабость}.<br>Происхождение: ${m.миф}<br>Кто рядом: ${m.кто}
   <button data-cmd="nemvoice:${m.id}" data-speak="Прослушать голос: ${m.n}.">Прослушать голос</button></div>`;}).join(""));});
 return r;};});
