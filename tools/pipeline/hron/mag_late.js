/* ════════════════════════════════════════════════════════════════════
   МАГИЯ ГРАНИ (14.5, ФАЗА V «БЕСКОНЕЧНОЙ ХРОНИКИ»)
   Десять новых школ встали в общие таблицы чар (плетение, Академия,
   гримуар, звуки) — здесь то, чего в бою не сотворишь: ОБРЯДЫ, которые
   действуют на мир (рынок, встречи, Надзор, погоду, логова, связи),
   ВЕДЬМОВСТВО — ковены, охотники на ведьм, порча со стадиями, признаками,
   распознанием и разными способами снятия, магические СВЯЗИ как вещи
   (найти, усилить, ослабить, разорвать; порчу — перенести на куклу), долги духам — и
   ЛЕГЕНДАРНЫЕ ВЕЩИ: у каждой создатель, история, пробуждение, цена, рост,
   влияние на владельца и способ уничтожения.
   Луна одна на весь мир — та же, что у Граней (двадцать восемь дней).
   В сохранении — G.mag: только то, что случилось с героем.
   ════════════════════════════════════════════════════════════════════ */
/* Порча: стадии с признаками и действием, откуда берётся, как снимается. */
const MAG_CURSES=[
 {id:"sglaz",n:"Сглаз",чарами:true,дней:6,откуда:"дурной глаз: ведьма-отступница, завистливый торговец или проклятая вещь",
  стадии:[{п:"мелкие неудачи: торговцы платят чуть меньше",эф:{продажа:0.95}},{п:"монеты уходят сквозь пальцы",эф:{продажа:0.92,золото:0.01}},
   {п:"твари чуют беду и бьют злее",эф:{продажа:0.9,золото:0.01,сила:1.1}},{п:"беда ходит следом: всё валится из рук",эф:{продажа:0.85,золото:0.02,сила:1.15}}],
  снять:[["чары","развеять порчу (Подавление чар или Ведьмовство)"],["кукла","перенести порчу на куклу и сжечь её"],["ковен","оберег ковена: вступившему — даром"]]},
 {id:"oathbreaker",n:"Клятвопреступник",чарами:false,дней:8,откуда:"нарушенная клятва державе",
  стадии:[{п:"слово больше не держит: держава холодна",эф:{держава:-1}},{п:"на рынках держав-свидетельниц цены выше",эф:{держава:-1,покупка:1.08}},
   {п:"свидетели клятвы отворачиваются",эф:{держава:-2,покупка:1.12}},{п:"само имя клятвопреступника режет слух",эф:{держава:-2,покупка:1.15,сила:1.1}}],
  снять:[["клятва","исполнить клятву: заслужить у державы доверие (отношение +15 от дня клятвы)"],["покаяние","покаяние в храме — двести золота"],["кукла","перенести порчу на куклу"]]},
 {id:"stolen",n:"Похищенное",чарами:false,дней:7,откуда:"вещь, взятая из проклятых руин",
  стадии:[{п:"вещь тянет к земле: сумка тяжелее",эф:{продажа:0.95}},{п:"ночью снится место, откуда она взята",эф:{продажа:0.92,сила:1.05}},
   {п:"хозяева вещи идут по следу",эф:{продажа:0.9,сила:1.12}},{п:"руины зовут: всё валится из рук",эф:{продажа:0.85,золото:0.01,сила:1.15}}],
  снять:[["вернуть","вернуть вещь туда, где она лежала"],["кукла","перенести порчу на куклу и сжечь её"]]},
 {id:"feud",n:"Родовая вражда",чарами:false,дней:8,откуда:"знатный дом, обиженный вашим подстрекательством",
  стадии:[{п:"дом шепчет о вас по дворам",эф:{держава:-1}},{п:"слуги дома мешают на рынках",эф:{держава:-1,покупка:1.08}},
   {п:"наёмники дома ищут встречи",эф:{держава:-2,покупка:1.1,сила:1.08}},{п:"кровная месть",эф:{держава:-2,покупка:1.12,сила:1.15}}],
  снять:[["мир","примирить роды: посредничать при дворе этой державы"],["дар","дар дому — сто пятьдесят золота"]]},
 {id:"debt",n:"Долг духу",чарами:false,дней:5,откуда:"сила, взятая у духа в долг и не возвращённая в срок",
  стадии:[{п:"дух напоминает о себе холодом",эф:{продажа:0.96}},{п:"дух забирает своё монетами",эф:{золото:0.015}},
   {п:"дух забирает своё силой",эф:{золото:0.02,сила:1.1}},{п:"дух не отпустит",эф:{золото:0.03,сила:1.15}}],
  снять:[["уплата","заплатить долг: сто пятьдесят золота в храме или святилище"]]},
 {id:"place",n:"Порча места",чарами:true,дней:6,откуда:"ночь в магической пустоши: место цепляется к пришлому",
  стадии:[{п:"во рту пепел пустоши",эф:{продажа:0.96}},{п:"сны о пустоши",эф:{продажа:0.94,сила:1.05}},
   {п:"пустошь тянет назад",эф:{продажа:0.9,сила:1.1}},{п:"пустошь прорастает в вас",эф:{продажа:0.88,золото:0.01,сила:1.15}}],
  снять:[["чары","развеять порчу"],["источник","уничтожить источник — духа пустоши (бой там, где порча взята)"]]},
 {id:"moon",n:"Лунная немота",чарами:true,дней:7,откуда:"обряд, проведённый не в ту луну",
  стадии:[{п:"чары звучат глуше",эф:{продажа:0.98}},{п:"луна смотрит косо",эф:{продажа:0.96}},{п:"немота крепнет",эф:{продажа:0.94,сила:1.05}},{п:"луна отвернулась",эф:{продажа:0.92,сила:1.08}}],
  снять:[["луна","дождаться полной луны и провести очищение"],["чары","развеять порчу"]]}];
const MAG_CURSE_BY_ID=Object.fromEntries(MAG_CURSES.map(c=>[c.id,c]));
/* Ковены: у каждого своя хозяйка, ремесло и место; вступают в свою луну. */
const MAG_COVENS=[
 {id:"ivy",n:"Ковен Плюща",хозяйка:"Матушка Ведана",ремесло:"травы и отвары",держава:"Вечная Чаща",луна:"полная",дар:"ведьмин отвар"},
 {id:"bone",n:"Ковен Костяной Луны",хозяйка:"Старая Ирга",ремесло:"кости и гадание",держава:"Хладная Стужа",луна:"новая",дар:"гадание на костях"},
 {id:"mirror",n:"Зеркальный ковен",хозяйка:"Сестра Ольвия",ремесло:"зеркала и двойники",держава:"Земли Туманов",луна:"полная",дар:"Зеркало Былого"},
 {id:"tide",n:"Ковен Приливов",хозяйка:"Морская ведьма Ирса",ремесло:"вода и луна",держава:"Вольные Острова",луна:"полная",дар:"лунная вода"},
 {id:"ash",n:"Ковен Пепла",хозяйка:"Горелая Марта",ремесло:"огонь и пепел",держава:"Сто Горнов",луна:"новая",дар:"пепельный оберег"},
 {id:"fen",n:"Ковен Тихой Топи",хозяйка:"Болотница Лиса",ремесло:"топь и сны",держава:null,материк:"temnoles",луна:"новая",дар:"сонный отвар"}];
/* Легендарные вещи: создатель, история, свойство, скрытая сила, пробуждение, цена, рост, влияние, уничтожение. */
const MAG_LEGENDS=[
 {id:"talker",n:"Медный Собеседник",создатель:"мастера Затонувшего Царства",история:"говорящая голова из меди: последняя, что помнит язык машин Царства до того, как море забрало его",
  где:"первый пробуждённый механизм руин на островах",свойство:"рассказывает, что за механизм перед вами и чем он жив",скрытое:"пускает древний механизм без ключа и без жертвы",
  пробуждение:"у руин на островах",цена:"десять маны за разговор",рост:["шепчет","говорит","поёт машинам"],влияние:"по ночам бормочет на мёртвом языке — спать рядом с ней тяжело",
  реакция:"учёные просят продать, жрецы — разбить",уничтожить:"переплавить в горне Сто Горнов — в любом их городе"},
 {id:"scales",n:"Весы Правды",создатель:"судья Аурис Справедливый",история:"весы, на которых взвешивали клятвы при первом престоле Средоточия; чаша с ложью тонет",
  где:"первое удавшееся посредничество при дворе",свойство:"в молве слышно, правда это или ложь",скрытое:"взвешивает чужое слово: о любой вести здесь — правдива ли она",
  пробуждение:"в державе, где идёт спор о престоле: там лгут больше всего",цена:"пять маны за взвешивание",рост:["дрожат","клонятся","не ошибаются"],
  влияние:"владелец сам перестаёт лгать — торговаться труднее (продажа на двадцатую часть хуже)",реакция:"при дворах уважают, на рынках сторонятся",уничтожить:"разбить на ступенях престола — в любом престольном городе"},
 {id:"compass",n:"Компас Сшивателей",создатель:"Сшиватели — те, кто пытался сшить Разрыв",история:"стрелка из застывшего света: показывает не на север, а на шов между мирами",
  где:"три известных узла Сети Граней",свойство:"показывает ближайший узел Сети",скрытое:"находит скрытые узлы, которых не видит чутьё",
  пробуждение:"у узла Сети",цена:"пятнадцать маны за поиск",рост:["дрожит","ведёт","видит сквозь Покров"],влияние:"тянет в чужие Грани: стоя на месте, владелец тоскует",
  реакция:"стражи Покрова требуют отдать",уничтожить:"оставить у узла Сети Граней: шов заберёт стрелку"},
 {id:"mirror",n:"Зеркало Былого",создатель:"первая хозяйка Зеркального ковена",история:"тёмное зеркало, в котором отражается не то, что есть, а то, что было на этом месте",
  где:"вступление в ковен (у Зеркального ковена — сразу)",свойство:"показывает, что было на этом месте в прежние эпохи",скрытое:"показывает и того, кто прошёл здесь последним",
  пробуждение:"в полную луну",цена:"двадцать маны за взгляд",рост:["мутное","ясное","глубокое"],влияние:"смотревший долго видит в нём и себя через годы",
  реакция:"охотники на ведьм ищут его особо",уничтожить:"разбить в новолуние"},
 {id:"key",n:"Ключ Шёпотов",создатель:"безымянный вор, обокравший пиратов",история:"ключ, который пираты Красных Парусов держали на дне сундука: он открывает то, что спрятано",
  где:"разорённая база пиратского братства",свойство:"слышит пустоту за стеной: тайный ход рядом",скрытое:"открывает найденный тайный ход в чертоге",
  пробуждение:"в новолуние в подземелье",цена:"двадцать маны за ход",рост:["шепчет","ведёт","отпирает"],влияние:"владелец не может пройти мимо запертой двери",
  реакция:"пираты всех морей ищут его",уничтожить:"бросить в открытое море с борта корабля"},
 {id:"crown",n:"Венец Распри",создатель:"мятежный дом, чьё имя стёрто",история:"тонкий обруч, который надевали самозванцы; кто носит его, тому верят дома — и его же травят",
  где:"претендент, которого вы поддержали, победил в споре о престоле",свойство:"поддержка претендента стоит вдвое меньше",скрытое:"доля вашего претендента растёт вдвое быстрее",
  пробуждение:"в державе, где идёт спор о престоле",цена:"сорок золота при каждом вмешательстве",рост:["блестит","горит","ослепляет"],
  влияние:"заговорщики тянутся к владельцу: в смутных державах твари и наёмники злее",реакция:"при дворах боятся и льстят",уничтожить:"отдать храму на переплавку — в храме или святилище"},
 {id:"sickle",n:"Лунный Серп",создатель:"жрица Двух Лун",история:"серп из лунного серебра: в полную луну режет и то, чего не берёт сталь",
  где:"поверженное морское чудище",свойство:"твари слабее в полную луну и сильнее в новую",скрытое:"в полную луну тварь теряет четверть сил с первого удара",
  пробуждение:"в полную луну",цена:"ничего, кроме луны",рост:["тусклый","светлый","лунный"],влияние:"в новолуние владельцу тревожно и холодно",
  реакция:"жрецы Двух Лун кланяются, прочие крестятся",уничтожить:"оставить на алтаре храма или святилища в новолуние"},
 {id:"storm",n:"Сердце Бури",создатель:"Огненная Гряда — сама земля",история:"камень, выброшенный вулканом: внутри стучит гроза",
  где:"обряд «Призвать бурю» у вулкана",свойство:"раз в семь дней зовёт бурю без обряда",скрытое:"буря Сердца не злит людей",
  пробуждение:"в грозу или у вулкана",цена:"тридцать маны",рост:["тлеет","гремит","бушует"],влияние:"рядом с владельцем портится погода",
  реакция:"крестьяне гонят, моряки просят продать",уничтожить:"бросить в жерло вулкана"}];
const MAG_LEGEND_BY_ID=Object.fromEntries(MAG_LEGENDS.map(l=>[l.id,l]));
const Magia={
 st(){if(!G.mag||typeof G.mag!=="object")G.mag={};const s=G.mag;
  for(const [k,v] of [["обр",{}],["эфф",{}],["охота",{}],["вещи",{}]])if(!s[k]||typeof s[k]!=="object"||Array.isArray(s[k]))s[k]=v;
  for(const k of ["пр","св","имена","печати","нет"])if(!Array.isArray(s[k]))s[k]=[];return s;},
 day(){return Number(G.day)||1;},
 hourT(){return this.day()*24+(Number(G.hour)||0);},
 q(t){return String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));},
 btn(cmd,label){return `<button type="button" class="item" data-cmd="mg:${cmd}" data-speak="${this.q(label)}">${this.q(label)}</button>`;},
 /* ── ЛУНА ── одна на весь мир */
 moon(){return safeFn(()=>Grani.moon(),((this.day()%28)+28)%28);},
 moonWord(){return safeFn(()=>Grani.moonWord(),"растущая");},
 /* ── ЗНАНИЕ ШКОЛЫ ── выученные чары этой школы, её специализация из книги или ковен для ведьмовства */
 knows(id){const sp=G.spells||[];
  if(SCHOOL_SPELLS.some(s=>s.school===id&&sp.includes(s.n)))return true;
  if(sp.some(n=>SPELL_SCHOOL[n]===id))return true;
  if(SPELL_SPECS.some(s=>s.школа===id&&safeFn(()=>bookSpecKnown(s.id),false)))return true;
  if(id==="witch"&&this.st().ков)return true;return false;},
 /* ── ДЕЙСТВУЮЩЕЕ ── */
 on(k){const e=this.st().эфф[k];return !!e&&this.hourT()<e.до;},
 set(k,часов,доп){this.st().эфф[k]=Object.assign({до:this.hourT()+часов},доп||{});},
 here(){return Math.max(0,safeFn(()=>empireIndexAt(G.x,G.y),0));},
 hasRes(рес){for(const k in рес||{})if((Number((G.inv||{})[k])||0)<рес[k])return false;return true;},
 takeRes(рес){if(!G.inv)G.inv={};for(const k in рес||{}){G.inv[k]=(Number(G.inv[k])||0)-рес[k];if(G.inv[k]<=0)delete G.inv[k];}},
 resText(рес){return Object.entries(рес||{}).map(([k,v])=>`${k} ×${v}`).join(", ");},
 /* Ведьмовство под запретом: набожный или жестокий правитель, сильный храм — опора престола. */
 witchBanned(i){i=i==null?this.here():i;const r=safeFn(()=>Throne.ruler(i),null),B=safeFn(()=>Throne.base(i),null);
  const tr=r?(THR_TRAITS[r.t]||{}).id:"";return tr==="набожный"||tr==="жестокий"||!!(B&&B.храм.нрав==="опора престола"&&safeFn(()=>Throne.church(i),0)>60);},
 /* ── ОБРЯДЫ ── */
 rites(){return MAG_RITES;},
 why(r){if(G.dark)return "За Гранью обряды светлого мира не ложатся.";if(G.inCombat)return "В бою обрядов не творят.";
  if(!this.knows(r.школа))return `Обряд школы «${(MSCHOOL_BY_ID[r.школа]||{n:r.школа}).n}»: сперва выучите её чары в Академии или найдите её специализацию в книге${r.школа==="witch"?", или вступите в ковен":""}.`;
  const s=this.st(),был=Number(s.обр[r.id])||0;if(r.откат&&this.day()-был<r.откат&&был)return `Этот обряд снова ляжет через ${r.откат-(this.day()-был)} ${plural(r.откат-(this.day()-был),"день","дня","дней")}.`;
  if((Number(G.mana)||0)<r.мана)return `Нужно ${r.мана} маны, у вас ${Number(G.mana)||0}.`;
  if(r.рес&&!this.hasRes(r.рес))return `Для обряда нужно: ${this.resText(r.рес)}.`;
  if(r.золото&&(Number(G.gold)||0)<r.золото)return `Нужно ${r.золото} золота.`;
  const w=r.можно?safeFn(()=>r.можно.call(this),null):null;return w||null;},
 rite(id){const r=MAG_RITES.find(x=>x.id===id);if(!r){narrate("Такого обряда нет.");return false;}
  const w=this.why(r);if(w){narrate(w);return false;}
  G.mana-=r.мана;if(r.рес)this.takeRes(r.рес);if(r.золото)G.gold-=r.золото;this.st().обр[r.id]=this.day();
  safeFn(()=>Bank.play((SCHOOL_AUDIO[r.школа]||{}).cast||"spell_cast",{kind:"magic",gain:0.55,maxSec:4}));
  let t=safeFn(()=>r.сделать.call(this),"")||"";
  /* луна: ведьмовской обряд не в свою луну может обернуться немотой */
  if(r.луна&&r.луна.indexOf(this.moonWord())<0&&!this.st().ков&&hashName(this.day(),id.length,9601)<0.5){this.curse("moon","обряд не в ту луну");t+=" Луна смотрела косо: на вас легла лунная немота.";}
  /* охотники на ведьм: в державе, где ведьмовство под запретом */
  if(r.школа==="witch"&&this.witchBanned()){const e=EMPIRES[this.here()],s=this.st();s.охота[e.short]=(Number(s.охота[e.short])||0)+1;
   t+=` В державе «${e.short}» ведьмовство под запретом: Орден Ясного Взора заметил вас (${s.охота[e.short]} из трёх).`;}
  safeFn(()=>journal(`Обряд «${r.n}»: ${t}`));narrate(t);safeFn(()=>saveGame(true));return true;},
 /* ── ПОРЧА ── */
 curses(){return this.st().пр;},
 curse(id,откуда,доп){const K=MAG_CURSE_BY_ID[id];if(!K)return null;const s=this.st();const было=s.пр.find(c=>c.id===id);if(было){было.ст=Math.min(4,было.ст+1);return было;}
  const c=Object.assign({id,ст:1,д:this.day(),от:откуда||K.откуда,узнано:false},доп||{});s.пр.push(c);
  s.св.push({id:"св_"+id+"_"+this.day(),вид:"проклятие",с:откуда||K.откуда,пр:id,сила:50,д:this.day(),тайная:true});
  safeFn(()=>Bank.play("wraith_moan",{gain:0.4,maxSec:3}));return c;},
 effect(k){let v=k==="продажа"||k==="покупка"||k==="сила"?1:0;for(const c of this.st().пр){const K=MAG_CURSE_BY_ID[c.id];if(!K)continue;const e=(K.стадии[c.ст-1]||{}).эф||{};
  if(e[k]==null)continue;if(k==="продажа")v=Math.min(v,e[k]);else if(k==="покупка"||k==="сила")v=Math.max(v,e[k]);else v+=e[k];}return v;},
 lift(id,как){const s=this.st(),c=s.пр.find(x=>x.id===id);if(!c)return false;s.пр=s.пр.filter(x=>x!==c);s.св=s.св.filter(b=>!(b.вид==="проклятие"&&b.пр===id));
  safeFn(()=>Bank.play("arc_shine",{gain:0.5,maxSec:3}));safeFn(()=>journal(`Снята порча «${MAG_CURSE_BY_ID[id].n}»: ${как}.`));return true;},
 signs(){return this.curses().map(c=>{const K=MAG_CURSE_BY_ID[c.id];return c.узнано?`${K.n}, стадия ${c.ст} из четырёх: ${K.стадии[c.ст-1].п}`:`неназванная порча: ${K.стадии[c.ст-1].п}`;});},
 /* распознать: обряд, Коллегия Незримого или ковен */
 diagnose(){const L=this.curses();if(!L.length)return "Порчи на вас нет.";L.forEach(c=>c.узнано=true);this.st().св.forEach(b=>{if(b.вид==="проклятие")b.тайная=false;});
  return L.map(c=>{const K=MAG_CURSE_BY_ID[c.id];return `${K.n} — откуда: ${c.от}; стадия ${c.ст} из четырёх (${K.стадии[c.ст-1].п}). Снять: ${K.снять.map(x=>x[1]).join("; ")}.`;}).join(" ");},
 /* способы снятия, у каждой порчи свои */
 tryLift(id,как){const c=this.curses().find(x=>x.id===id);const K=MAG_CURSE_BY_ID[id];if(!c||!K){narrate("Такой порчи на вас нет.");return false;}
  if(!K.снять.some(x=>x[0]===как)){narrate(`«${K.n}» так не снять. ${c.узнано?"Снимают так: "+K.снять.map(x=>x[1]).join("; ")+".":"Сначала узнайте, что это за порча."}`);return false;}
  const d=this.day(),i=this.here();
  if(как==="покаяние"||как==="уплата"||как==="дар"){const цена=как==="покаяние"?200:150;const вХраме=safeFn(()=>G.place&&["temple","shrine"].includes(G.place.stype),false);
   if(как!=="дар"&&!вХраме){narrate("Это делают в храме или святилище.");return false;}if((Number(G.gold)||0)<цена){narrate(`Нужно ${цена} золота.`);return false;}G.gold-=цена;}
  else if(как==="клятва"){const e=EMPIRES[c.держ]||EMPIRES[i];if(safeFn(()=>standOf("fact",e.short),0)<(Number(c.отн0)||0)+15){narrate(`Доверие державы «${e.short}» ещё не вернулось: нужно +15 к отношению с дня клятвы.`);return false;}}
  else if(как==="вернуть"){if(!c.место||Math.max(Math.abs(G.x-c.место.x),Math.abs(G.y-c.место.y))>3){narrate(c.место?`Вещь надо вернуть туда, где она лежала: ${safeFn(()=>dirFromDelta(c.место.x-G.x,c.место.y-G.y),"далеко")}.`:"Неизвестно, откуда вещь.");return false;}
   if(c.вещь){if(!((Number((G.inv||{})[c.вещь])||0)>0)){narrate(`Вернуть нужно саму вещь — «${c.вещь}», а её у вас нет. Остаётся кукла.`);return false;}G.inv[c.вещь]--;if(G.inv[c.вещь]<=0)delete G.inv[c.вещь];}}
  else if(как==="мир"){const j=Number(c.держ);if(!(Number.isFinite(j)&&safeFn(()=>Throne.st().ev.some(x=>x.i===j&&/герой примирил|Герой примирил/.test(x.t)&&x.d>=c.д),false))){narrate("Роды не примирены: помирите их при дворе той державы.");return false;}}
  else if(как==="луна"){if(this.moonWord()!=="полная"){narrate(`Очищение — только в полную луну; сейчас луна ${this.moonWord()}.`);return false;}if((Number(G.mana)||0)<20){narrate("Для очищения нужно двадцать маны.");return false;}G.mana-=20;}
  else if(как==="ковен"){if(!this.st().ков){narrate("Оберег ковена дают только своим.");return false;}}
  else if(как==="источник"){if(!c.источник||!c.источник.убит){narrate("Источник порчи ещё жив: дух пустоши ждёт там, где порча взята.");return false;}}
  else if(как==="чары"){if(!K.чарами){narrate(`«${K.n}» чарами не снимается.`);return false;}narrate("Для этого проведите обряд «Развеять порчу».");return false;}
  else if(как==="кукла"){narrate("Для этого проведите обряд «Перенести порчу на куклу».");return false;}
  this.lift(id,K.снять.find(x=>x[0]===как)[1]);narrate(`Порча «${K.n}» снята.`);safeFn(()=>saveGame(true));return true;},
 /* Проклятые руины: часть старых руин и все руины островов Великих Материков. */
 cursedRuin(x,y){return hashName(x,y,9608)<0.3||!!safeFn(()=>Mater.ruinNear(x,y,3),null);},
 /* ── СВЯЗИ ── */
 bonds(показатьТайные){return this.st().св.filter(b=>показатьТайные||!b.тайная);},
 bondAct(id,что){const s=this.st(),b=s.св.find(x=>x.id===id);if(!b){narrate("Такой связи нет.");return false;}
  if(что==="up"){if((Number(G.mana)||0)<10){narrate("Укрепить связь — десять маны.");return false;}G.mana-=10;b.сила=Math.min(100,b.сила+20);narrate(`Связь крепче: ${b.сила} из ста.`);}
  else if(что==="down"){b.сила=Math.max(0,b.сила-20);narrate(`Связь слабее: ${b.сила} из ста.`);if(b.вид==="проклятие"){const c=s.пр.find(x=>x.id===b.пр);if(c&&b.сила<=10&&c.ст>1){c.ст--;narrate("Порча отступила на стадию.");}}}
  else if(что==="cut"){
   if(b.вид==="проклятие"){narrate("Порчу так не разорвать: её снимают, а не рвут.");return false;}
   s.св=s.св.filter(x=>x!==b);
   if(b.вид==="клятва"){const c=this.curse("oathbreaker","нарушенная клятва державе",{держ:b.держ,отн0:b.отн0});narrate("Клятва разорвана. На вас легло: клятвопреступник.");}
   else if(b.вид==="долг"){this.curse("debt","разорванный долг духу");narrate("Долг не рвут: дух берёт своё порчей.");}
   else if(b.вид==="ковен"){s.ков=null;narrate("Ковен отпустил вас — и запомнил.");}
   else if(b.вид==="спутник"){delete s.эфф.спутник;narrate("Грибница засохла.");}
   else narrate("Связь разорвана.");}
  else return false;safeFn(()=>saveGame(true));return true;},
 /* ── КОВЕНЫ ── */
 covenPos(k){const K=MAG_COVENS.find(c=>c.id===k);if(!K)return null;let cx,cy;
  if(K.материк){const c=MAT_BY_ID[K.материк];cx=c.cx;cy=c.cy;}else{const e=EMPIRES.find(e=>e.short===K.держава)||EMPIRES[0];cx=e.cap.x;cy=e.cap.y;}
  const a=hashName(k.length*7,k.charCodeAt(0),9602)*Math.PI*2,r=600+hashName(k.charCodeAt(1),5,9603)*700;return {x:Math.round(cx+Math.cos(a)*r),y:Math.round(cy+Math.sin(a)*r)};},
 covenNear(){for(const K of MAG_COVENS){const p=this.covenPos(K.id);if(Math.max(Math.abs(G.x-p.x),Math.abs(G.y-p.y))<=150)return K;}return null;},
 join(k){const K=MAG_COVENS.find(c=>c.id===k),s=this.st();if(!K)return false;if(s.ков){narrate(`Вы уже в ковене: ${(MAG_COVENS.find(c=>c.id===s.ков)||{}).n}.`);return false;}
  if(this.covenNear()!==K){const p=this.covenPos(k);narrate(`${K.n} принимает только у себя: ${safeFn(()=>dirFromDelta(p.x-G.x,p.y-G.y),"далеко")}, ${Math.max(Math.abs(p.x-G.x),Math.abs(p.y-G.y))} шагов.`);return false;}
  if((Number(G.level)||1)<4){narrate("Ковен берёт с четвёртого уровня: младших хозяйка гонит домой.");return false;}
  if(this.moonWord()!==K.луна){narrate(`Посвящение — в ${K.луна==="полная"?"полную":"новую"} луну; сейчас луна ${this.moonWord()}.`);return false;}
  const рес={трава:2,кость:1};if(!this.hasRes(рес)){narrate(`Для посвящения нужны дары: ${this.resText(рес)}.`);return false;}
  this.takeRes(рес);s.ков=K.id;s.св.push({id:"св_ков_"+K.id,вид:"ковен",с:K.n,сила:60,д:this.day()});
  safeFn(()=>Bank.play("wild_raven",{gain:0.6,maxSec:3}));safeFn(()=>journal(`Посвящение: ${K.n}.`));
  if(K.id==="mirror"||!s.вещи.mirror)this.grant("mirror",`дар ковена: ${K.n}`);
  narrate(`${K.хозяйка} принимает вас в ${K.n}. Ремесло ковена — ${K.ремесло}. Ведьмовские обряды вам теперь открыты, а луна не мстит за ошибки.`);safeFn(()=>saveGame(true));return true;},
 /* Коллегия Незримого: учёные сверхъестественного — в любом городе */
 kollegia(что){const вГороде=safeFn(()=>!!isCityAt(G.place?G.place.bx:G.x,G.place?G.place.by:G.y),false);if(!вГороде){narrate("Коллегия Незримого держит приёмные в городах.");return false;}
  if(что==="diag"){if(!this.curses().length){narrate("Учёные Коллегии осмотрели вас: порчи нет. Денег не взяли.");return true;}if((Number(G.gold)||0)<60){narrate("Распознание в Коллегии — шестьдесят золота.");return false;}
   G.gold-=60;narrate("Коллегия Незримого: "+this.diagnose());return true;}
  if(что==="sell"){const n=Number((G.inv||{})["пепел порчи"])||0;if(!n){narrate("Коллегия покупает пепел сожжённой порчи — у вас его нет.");return false;}
   delete G.inv["пепел порчи"];G.gold=(Number(G.gold)||0)+80*n;narrate(`Коллегия купила пепел порчи: ${80*n} золота. Учёные записали, откуда он.`);return true;}
  return false;},
 /* ── ДОЛГ ДУХУ ── сила сейчас, плата потом */
 borrow(){const s=this.st();if(s.св.some(b=>b.вид==="долг")){narrate("Вы уже должны духу. Сначала верните прежний долг.");return false;}
  const вСвятилище=safeFn(()=>G.place&&["temple","shrine"].includes(G.place.stype),false);if(!вСвятилище){narrate("Духи дают в долг у святилищ и в храмах.");return false;}
  G.mana=(Number(G.manaMax)||100);s.св.push({id:"св_долг_"+this.day(),вид:"долг",с:"дух святилища",сила:70,д:this.day(),срок:this.day()+10,сумма:150});
  narrate("Дух святилища наполнил вас силой до краёв. Долг — сто пятьдесят золота, срок — десять дней. Не вернёте — дух возьмёт своё.");safeFn(()=>saveGame(true));return true;},
 repay(){const s=this.st(),b=s.св.find(x=>x.вид==="долг");if(!b){narrate("Долгов перед духами у вас нет.");return false;}
  const вСвятилище=safeFn(()=>G.place&&["temple","shrine"].includes(G.place.stype),false);if(!вСвятилище){narrate("Долг духу возвращают в святилище или храме.");return false;}
  if((Number(G.gold)||0)<b.сумма){narrate(`Долг — ${b.сумма} золота.`);return false;}G.gold-=b.сумма;s.св=s.св.filter(x=>x!==b);narrate("Дух принял плату. Долг закрыт.");safeFn(()=>saveGame(true));return true;},
 /* ── ЛЕГЕНДАРНЫЕ ВЕЩИ ── */
 has(id){return !!this.st().вещи[id];},
 grant(id,как){const s=this.st();if(s.вещи[id]||s.нет.includes(id))return false;const L=MAG_LEGEND_BY_ID[id];if(!L)return false;s.вещи[id]={д:this.day(),раз:0,проб:false,как:как||L.где};
  safeFn(()=>Bank.play("artifact_hum",{gain:0.6,maxSec:4}));safeFn(()=>journal(`Легендарная вещь: ${L.n} — ${как||L.где}.`));
  narrate(`Легендарная вещь: ${L.n}. ${L.история}.`,{interrupt:false});return true;},
 awake(id){const s=this.st(),v=s.вещи[id];if(!v)return false;if(v.проб)return true;const i=this.here();let ок=false;
  if(id==="talker")ок=!!safeFn(()=>Mater.ruinNear(G.x,G.y,5),null);
  else if(id==="scales")ок=!!safeFn(()=>Throne.crisis(i),null);
  else if(id==="compass")ок=safeFn(()=>Grani.nodesNear(G.x,G.y,3).length>0,false);
  else if(id==="mirror"||id==="sickle")ок=this.moonWord()==="полная";
  else if(id==="key")ок=this.moonWord()==="новая"&&!!(G.place&&G.place.depth>0);
  else if(id==="crown")ок=!!safeFn(()=>Throne.crisis(i),null);
  else if(id==="storm")ок=["Гроза","Ливень"].includes(safeFn(()=>Weather.cur,""))||!!safeFn(()=>Mater.volcanic(G.x,G.y),false);
  if(ок){v.проб=true;safeFn(()=>Bank.play("arc_shine",{gain:0.6,maxSec:3}));narrate(`${MAG_LEGEND_BY_ID[id].n} пробуждается: ${MAG_LEGEND_BY_ID[id].скрытое}.`,{interrupt:false});}
  return ок;},
 /* уничтожить: у каждой вещи своё место и свой час; уничтоженная больше не вернётся */
 destroyWhy(id){const L=MAG_LEGEND_BY_ID[id],i=this.here(),e=EMPIRES[i]||{};const вХраме=safeFn(()=>!!G.place&&["temple","shrine"].includes(G.place.stype),false);
  const можно={talker:()=>e.short==="Сто Горнов"&&!!safeFn(()=>isCityAt(G.place?G.place.bx:G.x,G.place?G.place.by:G.y),false),
   scales:()=>!!safeFn(()=>Throne.atCapital(i),false),compass:()=>safeFn(()=>Grani.nodesNear(G.x,G.y,3).length>0,false),
   mirror:()=>this.moonWord()==="новая",key:()=>!!G.ship,crown:()=>вХраме,sickle:()=>вХраме&&this.moonWord()==="новая",
   storm:()=>!!safeFn(()=>Mater.volcanic(G.x,G.y),false)}[id];
  return можно&&можно()?null:`${L.n}: так её не уничтожить. Уничтожают так: ${L.уничтожить}.`;},
 destroy(id){const s=this.st(),L=MAG_LEGEND_BY_ID[id];if(!s.вещи[id]||!L){narrate("Этой вещи у вас нет.");return false;}const w=this.destroyWhy(id);if(w){narrate(w);return false;}
  delete s.вещи[id];if(!s.нет.includes(id))s.нет.push(id);
  safeFn(()=>Bank.play("crystal_shatter",{gain:0.6,maxSec:3}));safeFn(()=>journal(`Уничтожена легендарная вещь: ${L.n}.`));
  narrate(`${L.n} уничтожена: ${L.уничтожить.replace(/ —.*$/,"")}. Её влияние ушло, а с ним и сила.`);safeFn(()=>saveGame(true));return true;},
 stage(id){const v=this.st().вещи[id];return v?(v.раз>=15?2:v.раз>=5?1:0):0;},
 use(id){const s=this.st(),v=s.вещи[id],L=MAG_LEGEND_BY_ID[id];if(!v||!L){narrate("Этой вещи у вас нет.");return false;}this.awake(id);
  /* вещь растёт от применения: на второй ступени берёт на четверть меньше маны, на третьей — вполовину */
  const мана=Math.round(({talker:10,scales:5,compass:15,mirror:20,key:20,storm:30}[id]||0)*(1-0.25*this.stage(id)));if((Number(G.mana)||0)<мана){narrate(`${L.n}: нужно ${мана} маны.`);return false;}
  let t="";
  if(id==="talker"){const n=safeFn(()=>Mater.ruinNear(G.x,G.y,3),null);if(!n){narrate("Механизмов рядом нет: Собеседник молчит.");return false;}
   t=`Медный Собеседник говорит с руинами «${n.a.n}»: ${n.a.руины||"здесь стоял город"}.`;if(v.проб&&["bezmolv","zatonuv"].indexOf(n.a.id)>=0){s.эфф.механизм={до:this.hourT()+1};safeFn(()=>Mater.mechanism());t+=" Механизм отзывается на голос.";}}
  else if(id==="scales"){const в=safeFn(()=>rumorsHere(G.x,G.y),[])||[];if(!в.length){narrate("Весам нечего взвешивать: вестей здесь нет.");return false;}
   const r=в[0],род=safeFn(()=>rumorClass(r),null);t=`Весы Правды: «${rumorText(r).текст}» — ${род?род.n:"неизвестно"}.`;}
  else if(id==="compass"){const L2=(safeFn(()=>Grani.nodesNear(G.x,G.y,v.проб?3000:1200),[])||[]).filter(n=>v.проб?true:!n.hidden);if(!L2.length){narrate("Стрелка Компаса кружит: узлов Сети поблизости нет.");return false;}
   const n=L2[0];if(v.проб&&n.hidden){const gs=safeFn(()=>Grani.st(),null);if(gs&&!gs.nodes[n.key])gs.nodes[n.key]={seen:this.day()};}
   t=`Компас Сшивателей: ${safeFn(()=>Grani.nodeName(n),"узел Сети")} — ${safeFn(()=>dirFromDelta(n.x-G.x,n.y-G.y),"рядом")}, ${n.d} шагов${n.hidden?"; узел скрыт от чутья, Компас видит его":""}.`;}
  else if(id==="mirror"){const рег=safeFn(()=>regionAt(G.x,G.y),null);const эп=safeFn(()=>(typeof HRON_ERAS!=="undefined"?HRON_ERAS:[]),[])||[];
   const э=эп.length?эп[Math.floor(hashName(G.x>>6,G.y>>6,9604)*эп.length)]:null;
   const соб=э&&Array.isArray(э.события)&&э.события.length?э.события[Math.floor(hashName(G.x>>4,G.y>>4,9610)*э.события.length)]:"";
   t=`Зеркало Былого: здесь лежит край «${рег?рег.n:"без имени"}»${рег&&рег.о?` — ${String(рег.о).replace(/\.$/,"")}`:""}${э?`; в пору, что зовётся «${э.n}» (${э.годы}), — ${соб||"здесь жили иначе"}${Array.isArray(э.народы)&&э.народы.length?`, и жили здесь ${э.народы.join(", ")}`:""}`:""}.`;
   if(v.проб){const след=(G.rumors||[]).filter(r=>Math.max(Math.abs(r.x-G.x),Math.abs(r.y-G.y))<40).slice(-1)[0];t+=след?` Последним здесь прошёл слух: «${rumorText(след).текст}».`:" Последним здесь прошли только вы.";}}
  else if(id==="key"){const c=safeFn(()=>Chertog.cur(),null);if(!c||!G.place||!(G.place.depth>0)){narrate("Ключ Шёпотов слушает: за этими стенами пустоты нет. Он оживает в чертогах и подземельях.");return false;}
   const F=safeFn(()=>Chertog.fs(c.r.floor),null),room=c.room;const e=room&&F?room.ex.map(id2=>c.F.edges[id2]).find(e2=>e2&&e2.lock==="shadow"&&!F.e[e2.id]):null;
   if(!e){t="Ключ Шёпотов: здесь тайного хода нет.";}else if(v.проб){safeFn(()=>Chertog.findSecret(c,e,"ключ"));t="Ключ Шёпотов нашёл тайный ход и отпер его.";}else t="Ключ Шёпотов шепчет: за этой стеной пусто — здесь тайный ход.";}
  else if(id==="storm"){const был=Number(v.буря)||0;if(был&&this.day()-был<7){narrate(`Сердце Бури отдыхает: ещё ${7-(this.day()-был)} ${plural(7-(this.day()-был),"день","дня","дней")}.`);return false;}
   v.буря=this.day();t=this.storm(v.проб?"Сердце Бури":"Сердце Бури, людям на беду");}
  else if(id==="crown"||id==="sickle"){narrate(`${L.n} действует сам: ${L.свойство}${v.проб?`; пробуждён: ${L.скрытое}`:""}.`);return true;}
  G.mana-=мана;v.раз++;const ст=this.stage(id);if(ст&&v.ростСказан!==ст){v.ростСказан=ст;t+=` ${L.n} растёт: теперь — «${L.рост[ст]}», и маны берёт меньше.`;}
  safeFn(()=>Bank.play("artifact_hum",{gain:0.5,maxSec:3}));narrate(t);safeFn(()=>saveGame(true));return true;},
 /* ── БУРЯ ── общая для обряда и Сердца */
 storm(кто){const i=this.here(),e=EMPIRES[i];safeFn(()=>Weather.set("Гроза"));this.st().эфф.буря={до:this.hourT()+48,держ:i,злая:!/^Сердце Бури$/.test(кто)};
  if(!/^Сердце Бури$/.test(кто))safeFn(()=>addStand("fact",e.short,-4));
  return `${кто} зовёт грозу над землёй державы «${e.short}»: двое суток набегов не будет, трава и ягоды дороже на седьмую часть${/^Сердце Бури$/.test(кто)?"":"; люди державы проклинают бурю (отношение −4)"}.`;},
 /* ── ДЕНЬ ── стадии порчи, долги, охотники на ведьм, рост вещей */
 tick(){const s=this.st(),d=this.day();if(s.дни===d)return;const n=Math.min(10,d-(Number(s.дни)||d));s.дни=d;if(!n)return;
  for(const c of s.пр){const K=MAG_CURSE_BY_ID[c.id];if(!K)continue;if(d-c.д>=K.дней*c.ст&&c.ст<4){c.ст++;narrate(`Порча крепнет: ${c.узнано?K.n+" — ":""}${K.стадии[c.ст-1].п}.`,{interrupt:false});}}
  const g=this.effect("золото");if(g>0){const п=Math.max(1,Math.round((Number(G.gold)||0)*g*n));G.gold=Math.max(0,(Number(G.gold)||0)-п);}
  const др=this.effect("держава");if(др<0){s.пр.filter(c=>c.держ!=null).forEach(c=>safeFn(()=>addStand("fact",EMPIRES[c.держ].short,др)));}
  for(const b of s.св.filter(b=>b.вид==="долг"&&d>b.срок)){s.св=s.св.filter(x=>x!==b);this.curse("debt","долг духу святилища не возвращён в срок");narrate("Срок долга вышел: дух святилища берёт своё порчей.",{interrupt:false});}
  for(const [k,v] of Object.entries(s.охота)){if(v>=3){s.охота[k]=0;const штраф=Math.min(Number(G.gold)||0,120);G.gold-=штраф;safeFn(()=>addStand("fact",k,-6));
   narrate(`Орден Ясного Взора в державе «${k}» нашёл вас: ${штраф?`штраф ${штраф} золота`:"золота у вас нет — на вас смотрят как на ведьму"}, держава отвернулась.`,{interrupt:false});}}
  if(s.эфф.удача&&!this.on("удача")&&!s.эфф.долгУдачи){s.эфф.долгУдачи={до:this.hourT()+24};delete s.эфф.удача;}
  if(s.эфф.спутник&&this.on("спутник")){if((Number((G.inv||{}).ягоды)||0)>0){G.inv.ягоды--;if(G.inv.ягоды<=0)delete G.inv.ягоды;}else{G.hp=Math.max(1,(Number(G.hp)||1)-3);}}
  for(const id of Object.keys(s.вещи))safeFn(()=>this.awake(id));},
 /* ── СЛОВА И ОКНО ── */
 statusText(){const s=this.st();const t=[];t.push(`Луна ${this.moonWord()}.`);if(s.ков)t.push(`Вы в ковене: ${(MAG_COVENS.find(c=>c.id===s.ков)||{}).n}.`);
  const з=this.signs();if(з.length)t.push(`На вас: ${з.join("; ")}.`);const b=this.bonds(false);if(b.length)t.push(`Связи: ${b.map(x=>`${x.вид} — ${x.с}, сила ${x.сила}`).join("; ")}.`);
  if(this.witchBanned())t.push(`В державе «${EMPIRES[this.here()].short}» ведьмовство под запретом.`);return t.join(" ");},
 home(){if(G.dark){narrate("За Гранью обряды светлого мира не ложатся.");return false;}
  let m=document.getElementById("modal-rites");
  if(!m){m=document.createElement("div");m.id="modal-rites";m.className="modal";m.hidden=true;m.setAttribute("role","dialog");m.setAttribute("aria-label","Обряды, связи и порча");
   m.innerHTML=`<div class="modal-box"><h2>Обряды, связи и порча</h2><div id="mgBody"></div><button type="button" class="item" data-cmd="closeModal">Закрыть</button></div>`;document.body.appendChild(m);}
  const s=this.st();let h=`<p tabindex="0">${this.q(this.statusText())}</p><h3>Обряды</h3>`;
  for(const r of MAG_RITES){const w=this.why(r);h+=`<p tabindex="0">${this.q(`${r.n} (${(MSCHOOL_BY_ID[r.школа]||{n:r.школа}).n}, ${r.мана} маны${r.рес?", "+this.resText(r.рес):""}${r.луна?", луна "+r.луна.join(" или "):""}): ${r.о}.${w?" Сейчас нельзя: "+w:""}`)}</p>`+(w?"":this.btn("rite:"+r.id,"Провести: "+r.n));}
  const пр=this.curses();if(пр.length){h+=`<h3>Порча</h3>`;пр.forEach(c=>{const K=MAG_CURSE_BY_ID[c.id];h+=`<p tabindex="0">${this.q(c.узнано?`${K.n}: стадия ${c.ст}; ${K.стадии[c.ст-1].п}. Снять: ${K.снять.map(x=>x[1]).join("; ")}.`:`Неназванная порча: ${K.стадии[c.ст-1].п}.`)}</p>`;
   if(c.узнано)K.снять.filter(x=>!["чары","кукла"].includes(x[0])).forEach(x=>{h+=this.btn(`lift:${c.id}:${x[0]}`,`Снять «${K.n}»: ${x[1]}`);});});}
  const св=this.bonds(false);if(св.length){h+=`<h3>Связи</h3>`;св.forEach(b=>{h+=`<p tabindex="0">${this.q(`${b.вид}: ${b.с}, сила ${b.сила} из ста`)}</p>`+this.btn(`bond:${b.id}:up`,"Укрепить (10 маны)")+this.btn(`bond:${b.id}:down`,"Ослабить")+(b.вид!=="проклятие"?this.btn(`bond:${b.id}:cut`,"Разорвать"):"");});}
  h+=`<h3>Ковены</h3>`;MAG_COVENS.forEach(K=>{const p=this.covenPos(K.id);h+=`<p tabindex="0">${this.q(`${K.n} — хозяйка ${K.хозяйка}, ремесло: ${K.ремесло}; посвящение в ${K.луна} луну; ${safeFn(()=>dirFromDelta(p.x-G.x,p.y-G.y),"далеко")}, ${Math.max(Math.abs(p.x-G.x),Math.abs(p.y-G.y))} шагов.`)}</p>`;
   if(!s.ков&&this.covenNear()===K)h+=this.btn("join:"+K.id,"Просить посвящения");});
  h+=`<h3>Коллегия Незримого и духи</h3>`+this.btn("kol:diag","Распознать порчу в Коллегии (60 золота, в городе)")+this.btn("kol:sell","Продать Коллегии пепел порчи")+this.btn("borrow","Взять силу у духа в долг (в святилище)")+this.btn("repay","Вернуть долг духу (в святилище)");
  m.querySelector("#mgBody").innerHTML=h;if(m.hidden)openModal("modal-rites");return true;},
 legendsHome(){let m=document.getElementById("modal-legends");
  if(!m){m=document.createElement("div");m.id="modal-legends";m.className="modal";m.hidden=true;m.setAttribute("role","dialog");m.setAttribute("aria-label","Легендарные вещи");
   m.innerHTML=`<div class="modal-box"><h2>Легендарные вещи</h2><div id="lgBody"></div><button type="button" class="item" data-cmd="closeModal">Закрыть</button></div>`;document.body.appendChild(m);}
  const s=this.st();let h="";
  for(const L of MAG_LEGENDS){const v=s.вещи[L.id];
   if(v){h+=`<h3>${this.q(L.n)}</h3><p tabindex="0">${this.q(`${L.история}. Создатель — ${L.создатель}. Свойство: ${L.свойство}. ${v.проб?"Пробуждена: "+L.скрытое:"Спит; пробуждается "+L.пробуждение}. Цена: ${L.цена}. Ступень — «${L.рост[this.stage(L.id)]}». Влияние на владельца: ${L.влияние}. Как смотрят люди: ${L.реакция}. Уничтожить: ${L.уничтожить}.`)}</p>`+this.btn("use:"+L.id,"Применить: "+L.n)+this.btn("des:"+L.id,"Уничтожить: "+L.n);}
   else if(s.нет.includes(L.id))h+=`<p tabindex="0">${this.q(`${L.n} — уничтожена вами.`)}</p>`;
   else h+=`<p tabindex="0">${this.q(`${L.n} — о ней ходят слухи: ${L.история}. Где искать: ${L.где}.`)}</p>`;}
  m.querySelector("#lgBody").innerHTML=h;if(m.hidden)openModal("modal-legends");return true;},
 cmd(a){const p=String(a||"").split(":"),k=p[0];let ok=false;
  if(k==="rite")ok=this.rite(p[1]);else if(k==="lift")ok=this.tryLift(p[1],p[2]);else if(k==="bond")ok=this.bondAct(p.slice(1,-1).join(":"),p[p.length-1]);
  else if(k==="join")ok=this.join(p[1]);else if(k==="kol")ok=this.kollegia(p[1]);else if(k==="borrow")ok=this.borrow();else if(k==="repay")ok=this.repay();
  else if(k==="use")ok=this.use(p[1]);else if(k==="des")ok=this.destroy(p[1]);else{narrate("Такого обряда или дела нет: откройте «Обряды, связи и порча» в разделе «Магия».");return false;}
  const m=document.getElementById("modal-rites");if(m&&!m.hidden)this.home();const l=document.getElementById("modal-legends");if(l&&!l.hidden)this.legendsHome();return ok;}};
/* ── ОБРЯДЫ ── что каждый делает с миром и чего стоит */
const MAG_RITES=[
 {id:"luck",школа:"chance",n:"Подкрутить жребий",мана:20,рес:{кристалл:1},откат:2,о:"до конца суток торговцы платят за ваш товар на десятую часть больше; назавтра — долг удачи: на двадцатую часть меньше",
  сделать(){this.set("удача",24-(Number(G.hour)||0));delete this.st().эфф.долгУдачи;return "Жребий подкручен: до конца суток торговцы платят больше. Удача вернётся долгом завтра.";}},
 {id:"mirror",школа:"mirror",n:"Зеркальная тропа",мана:25,рес:{ракушка:1},откат:3,о:"полсуток вас ищут не там: случайные беды обходят стороной, стража Надзора у ворот вас не узнаёт",
  сделать(){this.set("зеркало",12);return "Зеркальная тропа легла: полсуток вас ищут не там, где вы есть.";}},
 {id:"oath",школа:"oath",n:"Клятва державе",мана:15,золото:30,откат:1,о:"клятва державе, где вы стоите: отношение +8 и одно нарушение Надзора прощено; нарушите её подстрекательством при её дворе — станете клятвопреступником",
  можно(){const e=EMPIRES[this.here()];return this.st().св.some(b=>b.вид==="клятва"&&b.держ===this.here())?`Вы уже связаны клятвой с державой «${e.short}».`:null;},
  сделать(){const i=this.here(),e=EMPIRES[i];const отн0=safeFn(()=>standOf("fact",e.short),0);safeFn(()=>addStand("fact",e.short,8));
   if(G.wanted&&G.wanted[e.short]>0)G.wanted[e.short]--;this.st().св.push({id:"св_клятва_"+i+"_"+this.day(),вид:"клятва",с:`держава «${e.short}»`,держ:i,отн0,сила:60,д:this.day()});
   return `Клятва державе «${e.short}» дана: отношение выросло, одно нарушение Надзора прощено. Клятву держит связь — не нарушайте её.`;}},
 {id:"name",школа:"truename",n:"Узнать истинное имя",мана:30,откат:1,о:"имя твари того рода, с которым вы бились последним: такие твари, услышав имя, чаще уходят без боя",
  можно(){return this.st().последняя?null:"Имя узнают у той, с кем бились: сначала победите тварь.";},
  сделать(){const s=this.st(),m=s.последняя;if(!s.имена.includes(m.id))s.имена.push(m.id);if(s.имена.length>8)s.имена.shift();s.св.push({id:"св_имя_"+m.id,вид:"имя",с:`род «${m.n}»`,сила:50,д:this.day()});
   return `Истинное имя рода «${m.n}» узнано: такие твари, услышав его, чаще уходят без боя.`;}},
 {id:"laws",школа:"laws",n:"Иная тяжесть",мана:25,откат:1,о:"шесть часов тяжесть иная: твари вязнут в ней и бьют слабее, а вам легче",
  сделать(){this.set("тяжесть",6);return "Закон тяжести переписан на шесть часов: твари вокруг вас тяжелее, вы — легче.";}},
 {id:"storm",школа:"calamity",n:"Призвать бурю",мана:40,рес:{трава:2},откат:4,о:"гроза над землёй державы на двое суток: набегов на её деревни нет, трава и ягоды дороже на седьмую часть, люди державы злятся (−4)",
  сделать(){const t=this.storm("Обряд бури");if(safeFn(()=>Mater.volcanic(G.x,G.y),false))this.grant("storm","обряд бури у вулкана");return t;}},
 {id:"seal",школа:"sigil",n:"Запечатать логово",мана:30,рес:{камень:2},откат:2,о:"печать на месте, где вы стоите: десять дней твари не выходят здесь из логовищ",
  можно(){return G.place?null:"Логово запечатывают изнутри — в постройке, пещере или подземелье.";},
  сделать(){const p=G.place,k=`${p.bx},${p.by},${p.depth||0}`;const s=this.st();s.печати=s.печати.filter(x=>x.к!==k);s.печати.push({к:k,до:this.day()+10});if(s.печати.length>12)s.печати.shift();
   return "Печать легла: десять дней твари здесь из логовищ не выйдут.";}},
 {id:"dispel",школа:"counter",n:"Развеять порчу",мана:30,откат:1,о:"снимает порчу, которую берут чары: сглаз, порчу места, лунную немоту; клятвы, долги, вражду и похищенное так не снять",
  можно(){return this.curses().some(c=>MAG_CURSE_BY_ID[c.id].чарами)?null:"Порчи, которую берут чары, на вас нет.";},
  сделать(){const c=this.curses().find(c=>MAG_CURSE_BY_ID[c.id].чарами);this.lift(c.id,"развеяна чарами");const ост=this.curses();
   return `«${MAG_CURSE_BY_ID[c.id].n}» развеяна.${ост.length?` Остаётся то, что чарами не снять: ${ост.map(x=>x.узнано?MAG_CURSE_BY_ID[x.id].n:"неназванная порча").join(", ")}.`:""}`;}},
 {id:"symb",школа:"symbiont",n:"Вырастить спутника",мана:20,рес:{грибы:3},откат:3,о:"три дня грибница-спутник после каждого боя возвращает десятую часть здоровья; кормится ягодами, а без них — вашей кровью",
  сделать(){this.set("спутник",72);const s=this.st();s.св=s.св.filter(b=>b.вид!=="спутник");s.св.push({id:"св_спутник_"+this.day(),вид:"спутник",с:"грибница",сила:60,д:this.day()});
   return "Грибница прижилась: три дня после каждого боя она вернёт вам часть здоровья. Кормите её ягодами.";}},
 {id:"read",школа:"witch",n:"Прочесть порчу",мана:15,откат:0,о:"назовёт порчу, её источник, стадию и способы снятия",
  сделать(){return this.diagnose();}},
 {id:"doll",школа:"witch",n:"Перенести порчу на куклу",мана:35,рес:{трава:2,кость:1},луна:["новая","убывающая"],откат:1,о:"сглаз, клятвопреступничество или похищенное уходят в соломенную куклу, кукла сгорает, остаётся пепел порчи — его покупает Коллегия Незримого; долг, вражду, порчу места и лунную немоту кукла не берёт",
  можно(){return !this.curses().length?"Переносить нечего: порчи на вас нет.":this.curses().some(c=>MAG_CURSE_BY_ID[c.id].снять.some(x=>x[0]==="кукла"))?null:"Такую порчу кукла не берёт: снимите её её способом.";},
  сделать(){const c=this.curses().find(c=>MAG_CURSE_BY_ID[c.id].снять.some(x=>x[0]==="кукла"));const K=MAG_CURSE_BY_ID[c.id];this.lift(c.id,"перенесена на куклу и сожжена");if(!G.inv)G.inv={};G.inv["пепел порчи"]=(Number(G.inv["пепел порчи"])||0)+1;
   return `Порча ${c.узнано?`«${K.n}» `:""}ушла в куклу; кукла сгорела, остался пепел порчи.`;}},
 {id:"bonds",школа:"witch",n:"Чутьё связей",мана:20,откат:0,о:"показывает скрытые связи: кто держит вас и что",
  сделать(){const s=this.st();const скр=s.св.filter(b=>b.тайная);скр.forEach(b=>b.тайная=false);const все=s.св;
   return все.length?`Связи: ${все.map(b=>`${b.вид} — ${b.с}, сила ${b.сила}`).join("; ")}.${скр.length?` Открылось скрытых: ${скр.length}.`:""}`:"Связей на вас нет: ни долгов, ни клятв, ни порчи.";}}];
/* ── ВСТРАИВАНИЕ ── */
{const wd7=Director.worldDay;Director.worldDay=matKeep(wd7,function(){const r=wd7.apply(this,arguments);safeFn(()=>Magia.tick());return r;});}
/* Рынок: удача, долг удачи, порча и Весы Правды меняют то, что вам платят; порча — и то, что берут с вас. */
{const sp7=sellPrice;sellPrice=matKeep(sp7,function(res,idx,day,npc){let v=sp7.apply(this,arguments);if(!Number.isFinite(v))return v;
 safeFn(()=>{const M=Magia;if(M.on("удача"))v*=1.1;else if(M.on("долгУдачи"))v*=0.95;v*=M.effect("продажа");if(M.has("scales"))v*=0.95;});return Math.max(1,Math.round(v));});}
{const tb7=tradeBuyK;tradeBuyK=matKeep(tb7,function(){return tb7.apply(this,arguments)*safeFn(()=>Magia.effect("покупка"),1);});}
/* Буря: набегов на деревни державы нет, трава и ягоды дороже. */
{const ra7=raidAt;raidAt=matKeep(ra7,function(x,y,day){const b=safeFn(()=>Magia.st().эфф.буря,null);if(b&&Magia.on("буря")&&safeFn(()=>empireIndexAt(x,y),-1)===b.держ)return null;return ra7.apply(this,arguments);});}
{const mp7=marketPrice;marketPrice=matKeep(mp7,function(res,idx,day){const v=mp7.apply(this,arguments);const b=safeFn(()=>Magia.st().эфф.буря,null);
 if(b&&Number(idx)===b.держ&&(res==="трава"||res==="ягоды")&&safeFn(()=>Magia.on("буря"),false)&&Number.isFinite(v))return Math.round(v*8/7);return v;});}
/* Зеркальная тропа: случайные беды обходят, стража Надзора не узнаёт у ворот. */
{const me7=maybeEvent;maybeEvent=matKeep(me7,function(){if(safeFn(()=>Magia.on("зеркало"),false))return false;return me7.apply(this,arguments);});}
{const oa7=Oversight.arrive.bind(Oversight);Oversight.arrive=matKeep(oa7,function(){if(safeFn(()=>Magia.on("зеркало"),false))return false;return oa7.apply(this,arguments);});}
/* Бой: истинное имя, иная тяжесть, порча, Лунный Серп и Венец Распри меняют тварь при встрече. */
{const sc7=startCombat;startCombat=matKeep(sc7,function(o){safeFn(()=>{const m=o&&o.monster;if(!m||m.boss||m.dw&&m.dw.lord)return;const M=Magia,s=M.st();
  if(s.имена.includes(m.id)&&hashName(M.day(),(Number(G.hour)||0)+String(m.id).length,9605)<0.7){m.__ушла=true;return;}
  let k=M.effect("сила");if(M.on("тяжесть"))k*=0.85;if(M.has("crown")&&safeFn(()=>Throne.crisis(M.here()),null))k*=1.1;
  if(M.has("sickle")){const w=M.moonWord();k*=w==="полная"?(s.вещи.sickle.проб?0.75:0.85):w==="новая"?1.1:1;}
  if(k!==1){m.dmg=Math.max(1,Math.round((Number(m.dmg)||1)*k));m.hp=Math.max(1,Math.round((Number(m.hp)||1)*k));}});
 const m=o&&o.monster;if(m&&m.__ушла){delete m.__ушла;narrate(`«${m.n}» слышит своё истинное имя и уходит, не приняв боя.`);return false;}
 return sc7.apply(this,arguments);});}
/* Победа: какой род тварей был последним (для истинного имени); спутник возвращает здоровье. */
victory=matKeep(victory,(vi7=>function(){const m=G.combat&&G.combat.m;const r=vi7.apply(this,arguments);
 safeFn(()=>{if(m&&m.id&&!m.boss)Magia.st().последняя={id:m.id,n:m.n};if(Magia.on("спутник")){G.hp=Math.min(Number(G.hpMax)||100,(Number(G.hp)||0)+Math.round((Number(G.hpMax)||100)*0.1));}
  /* порча места: дух пустоши повержен там, где порча взята */
  const c=Magia.curses().find(x=>x.id==="place"&&x.источник&&!x.источник.убит);if(c&&Math.max(Math.abs(G.x-c.источник.x),Math.abs(G.y-c.источник.y))<=30)c.источник.убит=true;});return r;})(victory));
/* Печать: из запечатанного логова твари не выходят. */
{const si7=startInsideCombat;startInsideCombat=matKeep(si7,function(x,y){const p=G.place;
 if(p&&safeFn(()=>Magia.st().печати.some(z=>z.к===`${p.bx},${p.by},${p.depth||0}`&&z.до>=Magia.day()),false)){narrate("Печать держит логово: тварь не выходит.");return false;}return si7.apply(this,arguments);});}
/* Ночь в магической пустоши — порча места; вещь из проклятых руин — похищенное. */
{const mv7=move;move=matKeep(mv7,function(){const r=mv7.apply(this,arguments);safeFn(()=>{if(G.place||G.dark)return;const b=biomeAt(G.x,G.y).id;
  if(b==="magic_waste"&&isNight()&&!Magia.curses().some(c=>c.id==="place")&&hashName(G.x,G.y+Magia.day(),9606)<0.04)
   {const c=Magia.curse("place","ночь в магической пустоши");if(c)c.источник={x:G.x,y:G.y,убит:false};narrate("Пустошь цепляется к пришлому: во рту пепел.",{interrupt:false});}});return r;});}
/* Клятва: подстрекать дом при дворе державы, которой клялись, — нарушение; подстрекательство обижает дом — родовая вражда. */
{const ti7=Throne.incite.bind(Throne);Throne.incite=matKeep(ti7,function(i,k){const ok=ti7(i,k);safeFn(()=>{if(!ok)return;const s=Magia.st();
  const b=s.св.find(x=>x.вид==="клятва"&&x.держ===Number(i));if(b){s.св=s.св.filter(x=>x!==b);Magia.curse("oathbreaker",`клятва державе «${EMPIRES[i].short}» нарушена подстрекательством`,{держ:Number(i),отн0:b.отн0});narrate("Клятва нарушена: на вас легло — клятвопреступник.",{interrupt:false});}
  if(hashName(Number(i),Magia.day(),9607)<0.5&&!Magia.curses().some(c=>c.id==="feud"))Magia.curse("feud",`${Throne.base(Number(i)).дома[Number(k)].n} не простил подстрекательства`,{держ:Number(i)});});return ok;});}
/* Посредничество при дворе — Весы Правды; победа поддержанного претендента — Венец Распри; Венец удешевляет поддержку. */
{const tm7=Throne.mediate.bind(Throne);Throne.mediate=matKeep(tm7,function(i){const ok=tm7(i);if(ok)safeFn(()=>Magia.grant("scales","первое удавшееся посредничество"));return ok;});}
{const tc7=Throne.crown.bind(Throne);Throne.crown=matKeep(tc7,function(i,d,heir,text){const r=tc7(i,d,heir,text);
 safeFn(()=>{if(heir&&(Throne.st().infl[i+":"+heir.n]||0)>=25&&/Спор о престоле|примирил/.test(String(text||"")))Magia.grant("crown",`победа претендента, за которого вы стояли (${heir.n})`);});return r;});}
{const ts7=Throne.support.bind(Throne);Throne.support=matKeep(ts7,function(i,k){if(!safeFn(()=>Magia.has("crown"),false))return ts7(i,k);
 const g0=Number(G.gold)||0;G.gold=g0+75;const ok=ts7(i,k);if(!ok){G.gold=g0;return ok;}
 safeFn(()=>{const C=Throne.crisis(i);if(C&&Magia.st().вещи.crown.проб){const c=C.cl[Number(k)];c.д=Math.min(99,c.д+8);C.cl[1-Number(k)].д=100-c.д;}});return ok;});}
/* Механизм руин — Медный Собеседник; разорённая база пиратов — Ключ Шёпотов; морское чудище — Лунный Серп. */
{const mm7=Mater.mechanism.bind(Mater);Mater.mechanism=matKeep(mm7,function(){const r=mm7();if(r)safeFn(()=>Magia.grant("talker","первый пробуждённый механизм руин"));return r;});}
{const aw7=Mater.afterWin.bind(Mater);Mater.afterWin=matKeep(aw7,function(m){const r=aw7(m);
 safeFn(()=>{if(m&&m.чудище)Magia.grant("sickle","поверженное морское чудище");if(m&&m.пират){const st=Mater.pir(m.пират);if(st&&st.разорена)Magia.grant("key","разорённая база пиратского братства");}});return r;});}
/* Влияние вещей на владельца: рядом с Сердцем Бури портится погода, Медный Собеседник не даёт выспаться. */
{const rw7=rollWeather;rollWeather=matKeep(rw7,function(){const w=rw7.apply(this,arguments);
 if(safeFn(()=>Magia.has("storm"),false)&&Math.random()<0.3&&!["Снег","Метель"].includes(w))return Math.random()<0.5?"Гроза":"Ливень";return w;});}
{const sr7=Survival.rest.bind(Survival);Survival.rest=matKeep(sr7,function(){const t=sr7();if(!safeFn(()=>Magia.has("talker"),false))return t;
 safeFn(()=>{const S=Survival.state();if(Number.isFinite(Number(S.fatigue)))S.fatigue=Math.min(100,Number(S.fatigue)+25);});return t+" Медный Собеседник бормотал всю ночь: сон вышел неглубоким, усталость сошла не вся.";});}
/* Узлы Сети: три известных — Компас Сшивателей. */
{const gd7=Director.worldDay;Director.worldDay=matKeep(gd7,function(){const r=gd7.apply(this,arguments);safeFn(()=>{if(Object.keys(Grani.st().nodes||{}).length>=3)Magia.grant("compass","три известных узла Сети Граней");});return r;});}
/* Молва: с Весами Правды слышно, правда ли весть. */
{const rt7=rumorText;rumorText=matKeep(rt7,function(r){const t=rt7.apply(this,arguments);safeFn(()=>{if(t&&Magia.has("scales")){const род=rumorClass(r);if(род&&!/\(Весы:/.test(t.текст))t.текст+=` (Весы: ${род.n})`;}});return t;});}
/* «Осмотреться»: признаки порчи слышны; проклятые руины выдают себя знаками на кладке. */
{const lk7=look;look=matKeep(lk7,function(){const r=lk7.apply(this,arguments);safeFn(()=>{if(G.dark)return;const з=Magia.signs();if(з.length)narrate(`Признаки порчи: ${з.join("; ")}.`,{interrupt:false});
  const вРуинах=G.place?G.place.stype==="ruins":!!safeFn(()=>{const c=cellContent(G.x,G.y);return c.structure&&c.structure.type==="ruins";},false);
  if(вРуинах&&Magia.cursedRuin(G.place?G.place.bx:G.x,G.place?G.place.by:G.y))narrate("На кладке руин — недобрые знаки: место проклято. Взятое отсюда потянет назад.",{cat:"context",interrupt:false});});return r;});}
/* Сглаз: слишком удачная сделка — и торговец провожает недобрым взглядом. Ковен бережёт своих. */
{const ns7=noteSale;noteSale=matKeep(ns7,function(npc,золота){const r=ns7.apply(this,arguments);safeFn(()=>{const M=Magia;if((Number(золота)||0)<400||M.st().ков||M.curses().some(c=>c.id==="sglaz"))return;
  if(hashName(M.day(),Math.round(Number(золота)),9609)<0.25){M.curse("sglaz",`завистливый глаз торговца${npc&&npc.name?" "+npc.name:""}: слишком удачная сделка`);narrate("Торговец проводил вас недобрым взглядом: сделка вышла слишком удачной.",{interrupt:false});}});return r;});}
/* Похищенное: знак, вынутый из проклятой кладки, тянет руины за собой. */
{const fr7=Res.fromRuins.bind(Res);Res.fromRuins=matKeep(fr7,function(){const до=Number((G.inv||{})["рунный камень"])||0;let t=fr7();
 safeFn(()=>{if((Number((G.inv||{})["рунный камень"])||0)<=до)return;const x=G.place?G.place.bx:G.x,y=G.place?G.place.by:G.y;
  if(!Magia.cursedRuin(x,y)||Magia.curses().some(c=>c.id==="stolen"))return;
  Magia.curse("stolen","знак из проклятой кладки",{место:{x,y},вещь:"рунный камень"});t+=" Кладка была проклятой: знак тянет назад, к руинам.";});return t;});}
Object.assign(CMD,{rites(){Magia.home();},legends(){Magia.legendsHome();},mg(a){if(!a)return Magia.home();Magia.cmd(a);}});
{const av7=amAvailable;amAvailable=matKeep(av7,function(cmd){if(cmd==="rites"||cmd==="legends")return !G.dark;return av7.apply(this,arguments);});}
safeFn(()=>{const g=AM_GROUPS.find(x=>x[0]==="Магия");g[1].push(["rites","Обряды, связи и порча"],["legends","Легендарные вещи"]);});
