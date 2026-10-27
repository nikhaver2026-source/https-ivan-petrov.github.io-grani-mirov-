/* ════════════════════════════════════════════════════════════════════════
   КАНОН ГРАНИ (18.0) — переработка жанра, встроенная в мир
   Семнадцать пакетов канона (tools/kanon, docs/КАНОН.md): школы, формы и
   заклинания, твари, звери, вещи, люди, места, боги и ресурсы, написанные
   для Грани заново. Ничего не стоит особняком: всё входит в прежние
   таблицы и прежние двери — школы в SCHOOLS и академию, заклинания в общий
   список и тот же weaveAct, твари в общий порядок боя, звери в зверинец, и
   звучит через единый обработчик (Bank). Данные — kanon180_data.json
   (tools/kanon/kanon_build.py), их вставляет rebuild.py.
   ════════════════════════════════════════════════════════════════════════ */
const KN=/*@KANON180@*/{};
const Канон={
 данные:KN,
 now(){return (Number(G.day)||1)*24+(Number(G.hour)||0);},
 ст(){if(!G.kanon||typeof G.kanon!=="object"||Array.isArray(G.kanon))G.kanon={};return G.kanon;},
 звук(r,o){safeFn(()=>Bank.play(r,Object.assign({kind:"magic",gain:0.5,maxSec:3},o||{})));}};

/* ── 1. Новые записи (струны школы струн, хруст соли): в банке и в энциклопедии звуков ── */
safeFn(()=>{const D={kn_str_pluck:"Струнная магия: щипок натянутой струны",kn_str_chord:"Струнная магия: аккорд перебором, четыре струны",
  kn_str_gliss:"Струнная магия: струна скользит вверх и вниз",kn_str_hum:"Струнная магия: ровный гул натянутой струны",
  kn_salt:"Солёная магия: хруст крупной соли под пальцами"};
 for(const [r,files] of Object.entries(KN.sounds||{}))SOUND_BANK[r]={f:files,d:`${D[r]||r} (синтез, канон Грани)`};
 if(typeof ENC_FOLDER!=="undefined")ENC_FOLDER.kanon="magic";
 if(typeof BANK_CATS!=="undefined")BANK_CATS.kanon="Канон Грани: струны, соль и другие новые голоса чар";
 if(typeof BANK_GROUPS!=="undefined"){const g=BANK_GROUPS.find(g=>g.dirs&&g.dirs.includes("arcana"));if(g&&!g.dirs.includes("kanon"))g.dirs.push("kanon");}});

/* ── 2. Магия: двенадцать школ, сорок восемь специализаций, восемь форм ──
   Порядок важен: прежние номера гримуара (и вложенные в вещи чары, что их
   помнят) не должны сдвинуться. Поэтому новые школы, специализации и формы
   встают в конец своих списков, а гримуар сперва перечисляет прежние
   сочетания в прежнем порядке и только потом — новые. */
const КАНОН_СТАРЫХ_СПЕЦ=SPELL_SPECS.length,КАНОН_СТАРЫХ_ФОРМ=SPELL_FORMS.length;
safeFn(()=>{
 for(const f of KN.forms||[]){if(FORM_BY_ID[f.id])continue;
  const rec={id:f.id,n:f.n,имя:f.имя,род:f.род,дальность:f.дальность,радиус:f.радиус,подготовка:f.подготовка,откат:f.откат,база:f.база,
   сем:f.сем.slice(),урон:f.урон,целей:f.целей,держится:f.держится,звук:f.звук,о:f.о,ядро:Object.assign({},f.ядро),ход:f.ход,канон:true};
  SPELL_FORMS.push(rec);FORM_BY_ID[f.id]=rec;}
 for(const [c,forms] of Object.entries(KN.coreForms||{})){const core=CORE_BY_ID[c];if(!core)continue;
  for(const f of forms)if(core.формы.indexOf(f)<0)core.формы.push(f);}
 for(const s of KN.schools||[]){if(MSCHOOL_BY_ID[s.id])continue;
  const sc={id:s.id,n:s.n,род:s.род,сем:s.сем,k:s.k,звук:s.звук,голос:s.голос,канон:true};
  SCHOOLS.push(sc);MSCHOOL_BY_ID[s.id]=sc;
  const el=ELEM_BY_ID[s.elem];if(el){if(el.школы.indexOf(s.id)<0)el.школы.push(s.id);SCHOOL_ELEMENT[s.id]=s.elem;}
  SCHOOL_AUDIO[s.id]=Object.assign({},s.audio);
  const fac=FACULTY_BY_ID[s.fac];if(fac){if(!Array.isArray(fac.школы))fac.школы=[];if(fac.школы.indexOf(s.id)<0)fac.школы.push(s.id);}
  for(const sp of s.specs){if(SPEC_BY_ID[sp.id])continue;const r=Object.assign({},sp);SPELL_SPECS.push(r);SPEC_BY_ID[r.id]=r;}}
 /* гримуар: прежние сочетания — первыми и в прежнем порядке */
 grimBuild=function(){
  if(GRIM_INDEX)return GRIM_INDEX;
  const out=[];
  try{for(let проход=0;проход<2;проход++)
   for(let si=0;si<SPELL_SPECS.length;si++){const sp=SPELL_SPECS[si];
    for(let fi=0;fi<SPELL_FORMS.length;fi++){const старое=si<КАНОН_СТАРЫХ_СПЕЦ&&fi<КАНОН_СТАРЫХ_ФОРМ;if((проход===0)!==старое)continue;
     for(let mi=0;mi<SPELL_MODS.length;mi++){
      if(spellIncompat(sp.школа,SPELL_FORMS[fi].id,SPELL_MODS[mi].id,sp.ядро,sp.стихия))continue;
      out.push(si*1024+fi*32+mi);}}}}catch(_){}
  GRIM_INDEX=Uint32Array.from(out);return GRIM_INDEX;};
 GRIM_INDEX=null;});

/* ── 3. Заклинания канона ──
   Чары академии (по три у каждой новой школы, ступени 1–3) — в SCHOOL_SPELLS:
   их учат на своём факультете, как все чары школ. Остальные заклинания
   канона — у наставников канона: в общий список они входят так же, и
   творятся тем же жестом и тем же weaveAct, но выучить их можно только у
   того, кто их знает. */
const КАНОН_ЧАРЫ={};
safeFn(()=>{
 const вСписок=(sp,источник)=>{const sc=MSCHOOL_BY_ID[sp.school]||SCHOOLS[0];const f=FORM_BY_ID[sp.форма]||{};
  const rec=Object.assign({},sp,{price:0,школьное:true,custom:true,уровень:sp.ранг*3,радиус:f.радиус||0,дальность:f.дальность||0,
   звук:sc.звук,голос:f.ход==="whisper"?null:sc.голос,вид:`${sc.n.toLowerCase()} в форме ${f.род||sp.форма}`,источник});
  if(!SPELLS.some(x=>x.n===rec.n))SPELLS.push(rec);КАНОН_ЧАРЫ[rec.n]=rec;return rec;};
 for(const sp of KN.schoolSpells||[]){if(SCHOOL_SPELL_BY_NAME[sp.n])continue;
  const base={id:sp.id,n:sp.n,school:sp.school,форма:sp.форма,ранг:sp.ранг,сила:sp.сила,cost:sp.cost,откат:sp.откат,золото:sp.золото,о:sp.о,ядро:sp.ядро};
  if(sp.стихия)base.стихия=sp.стихия;if(sp.особое)base.особое=sp.особое;
  SCHOOL_SPELLS.push(base);SCHOOL_SPELL_BY_NAME[base.n]=base;вСписок(base,"школа");}
 for(const sp of KN.extraSpells||[]){
  const base={id:sp.id,n:sp.n,school:sp.school,форма:sp.форма,ранг:sp.ранг,сила:sp.сила,cost:sp.cost,откат:sp.откат,золото:sp.золото,о:sp.о,ядро:sp.ядро,канон:true};
  if(sp.стихия)base.стихия=sp.стихия;if(sp.особое)base.особое=sp.особое;if(sp.учитель)base.учитель=sp.учитель;
  вСписок(base,"наставник");}});
/* выучить заклинание канона у наставника: та же плата и те же требования ступени, что у чар школ */
const КанонЧары={
 все(){return Object.values(КАНОН_ЧАРЫ).filter(s=>s.источник==="наставник");},
 по(n){return КАНОН_ЧАРЫ[n]||null;},
 учит(имя){return this.все().filter(s=>s.учитель===имя);},
 цена(sp){const sc=MSCHOOL_BY_ID[sp.school]||SCHOOLS[0];return Math.round((Number(sp.золото)||40)*(Number(sc.k)||1)*1.2);},
 нельзя(sp){
  if(!sp)return "Такого заклинания нет.";
  if((G.spells||[]).indexOf(sp.n)>=0)return `«${sp.n}» вы уже знаете.`;
  const ветвь=safeFn(()=>branchRank("magic"),0)||0,ур=Number(G.level)||1;
  if(sp.ранг===3&&ветвь<5&&ур<14)return `«${sp.n}» третьей ступени: наставник учит ей с магической ветви от пятой ступени или с четырнадцатого уровня.`;
  if(sp.ранг===2&&ветвь<3&&ур<7)return `«${sp.n}» второй ступени: нужна магическая ветвь от третьей ступени или седьмой уровень.`;
  const ц=this.цена(sp);if((Number(G.gold)||0)<ц)return `За «${sp.n}» наставник просит ${ц} золота, у вас ${Number(G.gold)||0}.`;
  return "";},
 learn(n,кто){try{const sp=this.по(n);const бар=this.нельзя(sp);if(бар)return бар;
  const ц=this.цена(sp);G.gold=(Number(G.gold)||0)-ц;if(!Array.isArray(G.spells))G.spells=[];G.spells.push(sp.n);
  const sc=MSCHOOL_BY_ID[sp.school]||SCHOOLS[0];
  safeFn(()=>Bank.play(sc.голос||"magic_shimmer",{kind:"magic",gain:0.55,maxSec:4}));
  safeFn(()=>setTimeout(()=>safeFn(()=>eventTheme("achieve",{tier:sp.ранг>=3?"rare":"normal",gain:0.5})),420));
  safeFn(()=>journal(`Выучено у наставника${кто?` (${кто})`:""}: ${sp.n} (${sc.n}).`));
  safeFn(()=>Ledger.add("чары",`${sp.n}: ${sc.n}, ступень ${sp.ранг} — ${sp.о}`,кто||"наставник"));
  safeFn(()=>Lore.add("recipe",`spell:${sp.id}`,sp.n,`школа ${sc.n}`));
  safeFn(()=>registerCustomSpells());
  return `«${sp.n}» выучено: ${sp.о}. Школа ${sc.n}, ступень ${sp.ранг}, за ${ц} золота. Мана ${sp.cost}.`;
 }catch(_){return "Выучить не вышло.";}}};

/* ── 4. Поведение новых форм ──
   Отзвук бьёт ещё раз вполсилы через миг; нить делит действие со спутником;
   кольцо расходится тремя волнами; след держит тех, кто идёт следом; узел
   ждёт удара твари; петля повторяется; шёпот не выдаёт творящего (голоса
   школы нет); зарок держит своё втрое дольше, пока творящий не бежит.
   Всё — через тот же weaveAct, что у прочих чар: второго обработчика ядра нет. */
const КанонФормы={
 сила(sp){try{const el=spellElemOf(sp),md=modMerged(sp);return (Number(sp.сила)||1)*(md.пробой?(Number(el.k)||1):elemPower(el))*modPower(md)*safeFn(()=>Resonance.силаK(sp),1);}catch(_){return 1;}},
 ещё(sp,k,доля,слово,мс){const cb=G.combat;setTimeout(()=>safeFn(()=>{
   if(!G.inCombat||G.combat!==cb||!cb||cb.hp<=0)return;
   const sc=MSCHOOL_BY_ID[sp.school]||SCHOOLS[0],f=FORM_BY_ID[sp.форма],c=spellCoreOf(sp),el=spellElemOf(sp),md=modMerged(sp);
   safeFn(()=>Bank.play(f.звук||"magic_woosh",{kind:"magic",gain:0.38,maxSec:2}));
   const r=weaveAct(Object.assign({},sp,{__эхо:true}),sc,f,c,el,md,k*доля);
   if(r&&r!==" ")safeFn(()=>cbLog(`${слово}:${r}`));}),мс||1100);},
 спутники(fn){try{return (Zver.pets()||[]).filter(a=>!a.ранен).map(a=>{fn(a);return a.n;});}catch(_){return [];}},
 после(sp,out,было){
  const f=FORM_BY_ID[sp.форма];if(!f||!f.ход||out===" ")return "";
  const бой=G.inCombat&&G.combat,c=spellCoreOf(sp),k=this.сила(sp);let доп="";
  switch(f.ход){
   case "echo":if(бой&&["strike","curse","drain","bind","mark"].includes(c.id))this.ещё(sp,k,0.5,"Отзвук");
    else if(!бой&&c.id==="sense")safeFn(()=>pingSurroundings(6,10));break;
   case "thread":{const лечит=["heal","ward","bless"].includes(c.id);
    if(лечит){const n=this.спутники(a=>{if(c.id==="heal")Zver.cure(a,Math.round(Zver.hpMax(a)*0.25*k));else a.шкура=Math.max(Number(a.шкура)||0,2);});
     if(n.length)доп=` Нить тянется и к ${n.join(" и ")}: ${c.id==="heal"?"раны затягиваются и у спутника":"спутник тоже под защитой"}.`;}
    else if(бой&&c.id==="bind"){G.combat.путы=(Number(G.combat.путы)||0)+1;доп=" Нить держит крепче: ещё ход твари пропадает.";}
    break;}
   case "ring":if(бой&&["strike","curse","bind"].includes(c.id)){this.ещё(sp,k,0.7,"Вторая волна",900);this.ещё(sp,k,0.4,"Третья волна",1800);}
    else if(c.id==="heal"){const h=Math.round((6+(Number(G.level)||1))*k);G.hp=Math.min(G.hpMax,(Number(G.hp)||0)+h);доп=` Ещё две волны: здоровье плюс ${h}.`;}
    break;
   case "trail":if(бой){G.combat.кнСлед=Math.max(Number(G.combat.кнСлед)||0,2);доп=" След сбивает тварь: два её удара слабее на четверть.";}
    else{safeFn(()=>buffSet("кн_след",Math.max(1,Math.round(2*k))));доп=" След лёг за спиной: погоня собьётся.";}break;
   case "knot":if(бой){G.combat.кнУзел={k,ядро:c.id};доп=" Узел завязан: когда тварь ударит, она в нём и увязнет.";}
    else{safeFn(()=>buffSet("кн_узел",Math.max(2,Math.round(4*k))));доп=" Узел ждёт: первая тварь, что нападёт, начнёт бой связанной.";}break;
   case "loop":if(бой&&(Number(G.mana)||0)>=2){G.mana-=2;this.ещё(sp,k,0.6,"Петля повторилась",1500);}break;
   case "vow":{const now=Канон.now(),стали=[];
    for(const [id,до] of Object.entries(G.buffs||{})){const пр=Number((было||{})[id])||0;if(Number(до)>now&&Number(до)>пр){G.buffs[id]=now+(Number(до)-now)*3;стали.push(id);}}
    if(стали.length){Канон.ст().зарок={чары:sp.n,бафы:стали,до:Math.max(...стали.map(id=>Number(G.buffs[id])))};доп=" Зарок дан: действие продержится втрое дольше, пока вы ему верны.";}
    break;}}
  return доп;},
 /* бегство из боя нарушает зарок: всё, что он держал, гаснет */
 нарушить(почему){const s=Канон.ст();const z=s.зарок;if(!z||Number(z.до)<=Канон.now())return false;
  for(const id of z.бафы||[])if(G.buffs)delete G.buffs[id];s.зарок=null;
  Канон.звук("oc_drone_die",{gain:0.45});safeFn(()=>narrate(`Зарок «${z.чары}» нарушен${почему?`: ${почему}`:""} — его сила ушла.`,{interrupt:false}));return true;}};

/* ── 5. Особые действия заклинаний канона ──
   Ядро делает главное (удар, путы, оберег…); особое — то, чем именно эта
   чара отличается от прочих чар того же ядра. Каждое опирается на то, что
   уже есть в мире: тайники и пустоты за кладкой (Поиск150), жилы (Сырьё170),
   ловушки, звери-спутники, усиления (buffSet) и ход твари в бою. */
const КанонОсобое={
 h(){return Number(G.level)||1;},
 спутники(fn){return КанонФормы.спутники(fn);},
 снять(ids){let n=0;for(const id of ids)if(G.buffs&&G.buffs[id]){delete G.buffs[id];n++;}return n;},
 д:{
  сквозь_стену(c){if(!G.place)return " Под открытым небом стен нет: эхо уходит вдаль.";const p=G.place,П=typeof Поиск150!=="undefined"?Поиск150:null;
   const т=П&&safeFn(()=>П.тайникРядом(p.x,p.y,4),null),пуст=П&&safeFn(()=>П.пустотаРядом(4),null);
   const сл=[];if(т)сл.push(`за кладкой тайник — ${П.где(т)}`);if(пуст)сл.push(`пустота в стене — ${П.где(пуст)}`);
   return сл.length?` Сквозь камень слышно: ${сл.join("; ")}.`:" Сквозь камень слышно только камень: тайников рядом нет.";},
  сигнал(c){if(c.бой)return "";safeFn(()=>buffSet("кн_растяжка",6));return " Струна натянута у стоянки: кто подкрадётся, тот зазвенит.";},
  спутникам(c){const n=this.спутники(a=>{Zver.cure(a,Math.round(Zver.hpMax(a)*0.15));a.ярость=Math.max(Number(a.ярость)||0,2);});
   return n.length?` ${n.join(" и ")} — тоже: спутник крепче и злее в бою.`:"";},
  спутнику(c){const n=this.спутники(a=>{a.шкура=Math.max(Number(a.шкура)||0,3);});return n.length?` Струна тянется и к ${n[0]}: спутник под защитой.`:"";},
  набат(c){if(!c.бой)return "";const m=c.cb.m||{};if((Number(m.lvl)||1)<КанонОсобое.h()){c.cb.путы=(Number(c.cb.путы)||0)+1;return " Набат оглушает тварь слабее вас: ход она теряет.";}return " Тварь крепка: набат её не валит.";},
  убежище(c){safeFn(()=>{buffSet("кн_убежище",Math.max(3,Math.round(6*c.k)));buffSet("морок",Math.max(2,Math.round(3*c.k)));});return " Здесь укрытие: твари обходят место, отдых крепче.";},
  привал(c){safeFn(()=>{buffSet("кн_убежище",Math.max(2,Math.round(4*c.k)));buffSet("тепло",4);});return " У огня тепло: холод не берёт, отдых крепче.";},
  немота(c){if(c.бой){c.cb.кнНемо=3;return " Под куполом тихо: тварь не колдует, и её удары на пятую часть слабее три хода.";}safeFn(()=>buffSet("тишина шага",3));return " Шаги стихли.";},
  обратный_путь(c){safeFn(()=>buffSet("кн_след",4));return " Тропа легла назад: погоня собьётся на развилке.";},
  подъём(c){if(c.бой)return "";safeFn(()=>buffSet("лёгкость",3));return " Петля держит вес: поклажа не тянет, по отвесу подниматься легче.";},
  кружить(c){if(c.бой){c.cb.путы=(Number(c.cb.путы)||0)+1;return " Тварь кружит на месте: ещё ход пропал.";}safeFn(()=>buffSet("морок",Math.round(4*c.k)));return " Тропа закручена: кто пойдёт следом, будет ходить кругами.";},
  запереть(c){safeFn(()=>buffSet("кн_засов",6));return " Засов лёг без ключа: незваное за дверь не войдёт.";},
  возрождение(c){const s=Канон.ст();s.узел={x:G.x,y:G.y,место:G.place?{bx:G.place.bx,by:G.place.by,depth:G.place.depth||0}:null,до:Канон.now()+24};
   return " Узел завязан на пороге: если падёте в эти сутки, очнётесь здесь.";},
  снять_страх(c){const n=КанонОсобое.снять(["страх","слепота","проклятие"]);return n?` Тёплое слово сняло ${n} ${plural(n,"тяжесть","тяжести","тяжестей")}.`:"";},
  возврат_урона(c){if(!c.бой)return "";c.cb.кнВозврат={доля:0.4,ходов:6};return " Долг записан: часть ударов твари вернётся ей.";},
  заём(c){safeFn(()=>buffSet("кн_долг",2));return " Сила взята в долг: два часа чары дороже на треть.";},
  ловушки(c){const л=safeFn(()=>trapFound(),null);if(л){safeFn(()=>setPlaceMark(л.x,л.y,"trap_off"));return ` Рой нашёл ${л.n} и облепил её: она не сработает.`;}return " Рой облетел путь: ловушек рядом нет.";},
  мёд(c){if(c.бой){c.cb.кнЖала=3;return " Пчёлы жалят тварь три хода.";}const s=Канон.ст();const день=Number(G.day)||1;
   if(s.мёд===день)return " Пчёлы сегодня уже водили вас к борти.";s.мёд=день;const что=Math.random()<0.6?"мёд":"трава";G.inv[что]=(Number(G.inv[что])||0)+1;
   return ` Пчёлы привели к ${что==="мёд"?"дуплу с мёдом":"цветущей поляне"}: ${что} плюс один.`;},
  уравнять(c){if(!c.бой)return "";const m=c.cb,доля=Math.round((Number(m.hp)||0)*0.1);m.hp=Math.max(1,(Number(m.hp)||0)-доля);
   const h=Math.round((Number(G.hpMax)||100)*0.1);G.hp=Math.min(G.hpMax,(Number(G.hp)||0)+h);safeFn(()=>updateCombat());
   return ` Чаши выровнялись: твари −${доля}, вам плюс ${h}.`;},
  обмен(c){if((Number(G.mana)||0)<(Number(G.manaMax)||0)*0.4&&(Number(G.hp)||0)>25){G.hp-=20;G.mana=Math.min(G.manaMax,(Number(G.mana)||0)+20);return " Весы переложили двадцать здоровья в ману.";}
   if((Number(G.hp)||0)<(Number(G.hpMax)||0)*0.4&&(Number(G.mana)||0)>20){G.mana-=20;G.hp=Math.min(G.hpMax,(Number(G.hp)||0)+20);return " Весы переложили двадцать маны в здоровье.";}return "";},
  от_яда(c){const n=КанонОсобое.снять(["яд","кровотечение","загрязнение"]);safeFn(()=>buffSet("перевязан",6));return n?" Соль выжгла яд из раны.":" Рана под солью чиста.";},
  руда(c){if(!G.place||!(Number(G.place.depth)>0))return " Под ногами — верхний слой: жила молчит.";const d=Number(G.place.depth)||0,С=typeof Сырьё170!=="undefined"?Сырьё170:null;
   if(!С)return "";const р=safeFn(()=>С.вглубь(d,(G.place.bx|0)*7+(G.place.x|0)*13+(G.place.y|0)),null);const s=Канон.ст(),кл=`${G.place.bx},${G.place.by},${d}`;
   if(р&&s.жила!==кл&&Math.random()<0.5){s.жила=кл;С.дать(р,1);return ` Жила откликнулась: ${р}, и кусок её у вас в руке.`;}return р?` В толще этого яруса звенит ${р}.`:"";},
  фундамент(c){if(c.бой){c.cb.кнФундамент=6;return " Вас не сдвинуть: шесть ходов удары твари на четверть слабее.";}safeFn(()=>buffSet("стойкость",6));return "";},
  починка(c){const п=safeFn(()=>Канон.починить&&Канон.починить(),null);return п||" Шов лёг на трещину: камень снова цел.";},
  без_бегства(c){if(!c.бой)return "";c.cb.кнУзелБоя=3;return " Узел невозврата: три хода никто не бежит — ни тварь, ни вы.";},
  выдать_скрытых(c){safeFn(()=>pingSurroundings(6,10));if(c.бой)c.cb.marked=true;return " Корни выдают каждый шаг вокруг.";},
  мана_за_добивание(c){return "";},
  дух_края(c){const t=safeFn(()=>cellContent(G.x,G.y).terrain[0],"")||"";
   if(/water|sea|coast|lake|river|swamp/.test(t)){G.hp=Math.min(G.hpMax,(Number(G.hp)||0)+Math.round(10*c.k));return " Пришёл дух воды: он лечит.";}
   if(/mount|hill|rock/.test(t)){safeFn(()=>buffSet("оберег",3));return " Пришёл дух гор: он держит удар.";}return " Пришёл дух степи: он бьёт.";},
  разобрать(c){const s=Канон.ст(),день=Number(G.day)||1;if(s.лом===день)return " Сегодня звёздный лом уже разобран.";s.лом=день;
   const r=Math.random()<0.15?"эфирная линза":"шестерня";G.inv[r]=(Number(G.inv[r])||0)+1;return ` Из лома вынута ${r}.`;},
  правда(c){if(!c.бой)return " Тот, кто говорит рядом, говорит правду: ложь слышна с дребезгом.";const m=c.cb.m||{};const L=safeFn(()=>MONSTER_LORE[m.id],null);
   return L?` Тварь отвечает: ${L.myth}`:` Тварь молчит, но её имя — ${m.n||"тварь"}.`;},
  перемирие(c){if(!c.бой)return "";const m=c.cb.m||{};if(/bandit|pirate|goblin|orc|human|разбойн|налёт/i.test(String(m.id)+" "+String(m.n))){endCombat();safeFn(()=>{refresh();resumeLocationMusic();});return " Разумный враг согласился на перемирие и ушёл.";}
   c.cb.путы=(Number(c.cb.путы)||0)+1;return " Тварь не разумеет слов, но и ударить не может: ход пропал.";},
  против_нежити(c){if(!c.бой||!(c.cb.m&&c.cb.m.нежить))return "";const d=Math.round((6+КанонОсобое.h())*c.k);c.cb.hp-=d;safeFn(()=>updateCombat());if(c.cb.hp<=0){victory();return " ";}return ` Полынь жжёт нежить: ещё −${d}.`;},
  яд(c){if(!c.бой)return "";c.cb.кнЯд=Math.max(Number(c.cb.кнЯд)||0,3);return " Яд будет жечь тварь ещё три хода.";},
  переправа(c){safeFn(()=>buffSet("кн_трап",2));return " Облачный трап держит: два часа можно идти над водой и пропастью.";},
  пеленг(c){const p=G.place,П=typeof Поиск150!=="undefined"?Поиск150:null;const т=p&&П&&safeFn(()=>П.тайникРядом(p.x,p.y,12),null);return т?` Пеленг: ближний тайник — ${П.где(т)}.`:" Пеленг молчит: в этих стенах тайников нет.";},
  промах_врага(c){safeFn(()=>buffSet("кн_жребий",4));return " Жребий под языком: пока вы молчите, каждый пятый удар врага уходит мимо.";},
  боль_в_силу(c){safeFn(()=>buffSet("кн_боль",4));return " Обет боли: каждый полученный удар прибавит силы следующему вашему.";},
  наёмники(c){const s=Канон.ст();s.наёмники=(Number(G.day)||1)+3;return " Наёмники у костра остались: ещё три дня без платы.";},
  сделка(c){if(!c.бой)return "";const m=c.cb.m||{};const ц=Math.round(10+(Number(m.lvl)||1)*8);
   if(/bandit|pirate|goblin|разбойн/i.test(String(m.id)+" "+String(m.n))&&(Number(G.gold)||0)>=ц){G.gold-=ц;endCombat();safeFn(()=>{refresh();resumeLocationMusic();});return ` Сделка: за ${ц} золота враг ушёл.`;}return "";},
  тление(c){if(!c.бой)return "";c.cb.кнЯд=Math.max(Number(c.cb.кнЯд)||0,3);return " Пепел тлеет на твари три хода.";},
  душа(c){if(!c.бой)return "";c.cb.кнДуша=true;return " Залог лёг: падёт тварь — её душа останется у вас.";},
  бесы(c){if(!c.бой)return "";c.cb.кнБесы=3;return " Из серы вылезли бесы: три хода они кусают тварь.";},
  кукла(c){if(!c.бой)return "";c.cb.кнКукла=Math.max(1,Math.round(2*c.k));return ` Деревянная кукла встала между вами: ${c.cb.кнКукла} ${plural(c.cb.кнКукла,"удар","удара","ударов")} она примет на себя.`;},
  облик(c){safeFn(()=>{buffSet("мощь",6);buffSet("чутьё",6);});return " Обличье зверя: сила и чутьё выше шесть часов.";},
  стена_копий(c){if(!c.бой)return "";c.cb.кнКопья=3;return " Стена копий: кто полезет к вам, тот на них и напорется.";},
  случай(c){if(!c.бой)return "";const r=Math.random();if(r<0.35){c.cb.путы=(Number(c.cb.путы)||0)+1;return " Карта шута: оглушение!";}
   if(r<0.65){const d=Math.round((8+КанонОсобое.h())*c.k);c.cb.hp-=d;safeFn(()=>updateCombat());if(c.cb.hp<=0){victory();return " ";}return ` Карта шута: огонь, −${d}.`;}
   if(r<0.85){c.cb.hp+=5;return " Карта шута подвела: тварь подлечилась.";}return " Карта шута: пусто.";},
  бестиарий(c){if(!c.бой)return "";const m=c.cb.m||{};const знаком=safeFn(()=>Bestiary&&Bestiary.seen&&Bestiary.seen(m.id),false);c.cb.кнВскрытие=знаком?0.5:0.3;return ` Слабое место видно: удары по твари сильнее на ${знаком?"половину":"треть"}.`;},
  подъём_питомца(c){const z=safeFn(()=>Zver.st().list.find(a=>a.ранен),null);if(z){Zver.cure(z,Zver.hpMax(z)*0.5);z.ранен=0;return ` ${z.n} поднялся и снова на ногах.`;}return " Поднимать некого: все спутники целы.";},
  кости(c){const s=Канон.ст();s.кости=(Number(s.кости)||0)+1;const П=typeof Поиск150!=="undefined"?Поиск150:null,p=G.place;const т=p&&П&&safeFn(()=>П.тайникРядом(p.x,p.y,8),null);
   return т?` Кости шепчут: здесь прятали — ${П.где(т)}.`:" Кости шепчут о том, кто здесь умер, но тайников рядом нет.";},
  приманка(c){if(c.бой){c.cb.кнСлед=Math.max(Number(c.cb.кнСлед)||0,3);return " Тварь рвётся по следу приманки: три её удара слабее.";}safeFn(()=>buffSet("морок",4));return " Приманка уводит зверей прочь от вас.";},
  упокой_нежити(c){if(!c.бой||!(c.cb.m&&c.cb.m.нежить))return "";c.cb.путы=(Number(c.cb.путы)||0)+3;return " Нежить засыпает: три хода она не шевельнётся.";},
  повтор_чары(c){const s=Канон.ст(),посл=G.lastSpellName&&SPELLS.find(x=>x.n===G.lastSpellName);
   if(!c.бой||!посл||посл.n===c.sp.n||s.зубрёжка===c.cb)return "";s.зубрёжка=c.cb;const цена=Math.round((Number(посл.cost)||6)*0.5);if((Number(G.mana)||0)<цена)return "";
   G.mana-=цена;const r=safeFn(()=>castCustomEffect(посл),"");safeFn(()=>mastGain&&mastGain("runes",1));return ` Повтор «${посл.n}» за полцены:${r}`;},
  закалка(c){safeFn(()=>{buffSet("стойкость",Math.round(4*c.k));buffSet("кн_закалка",10);});return " Доспех закалён: держит крепче, обвал его не мнёт.";},
  выгнать_роющих(c){if(!c.бой)return "";const m=c.cb.m||{};if(/worm|mole|dig|sand|червь|крот|точ|рою/i.test(String(m.id)+" "+String(m.n))){c.cb.путы=(Number(c.cb.путы)||0)+1;return " Роющую тварь выбило наверх: ход она теряет.";}return "";},
  закрыть_прорыв(c){const r=safeFn(()=>Канон.закрытьПрорыв&&Канон.закрытьПрорыв(),null);return r||" Узел лёг на края: малые разрывы рядом стягиваются.";},
  отражение_порчи(c){safeFn(()=>buffSet("кн_отражение",6));return " Следующая порча на вас вернётся к тому, кто её наслал.";},
  продление(c){const now=Канон.now();let n=0;for(const [id,до] of Object.entries(G.buffs||{}))if(Number(до)>now&&!/^кн_|страх|яд|проклятие|слепота|кровотечение/.test(id)){G.buffs[id]=Number(до)+4;n++;}
   return n?` Петля продлила ${n} ${plural(n,"усиление","усиления","усилений")} на четыре часа.`:"";},
  следы(c){const L=safeFn(()=>Actors.near(12),[])||[];return L.length?` Дерево помнит: рядом проходили — ${L.slice(0,4).map(a=>a.n||a.name||"кто-то").join(", ")}.`:" Дерево помнит только ветер: никто не проходил.";},
  предок(c){return c.бой?" Дух предка бьёт вместе с вами.":"";},
  отбросить(c){if(!c.бой)return "";c.cb.кнОтброс=1;return " Тварь отброшена: следующий её удар не достанет.";},
  наследие(c){safeFn(()=>buffSet("кн_наследие",Math.max(1,Math.round(2*c.k))));return " Нить наследия: умение предков с вами, ремесло идёт легче.";},
  дуэль(c){if(!c.бой)return "";c.cb.кнДуэль=true;return " Кольцо чести: никто не вмешается, победа принесёт славу.";},
  промывка(c){const n=КанонОсобое.снять(["проклятие","ломка","прогар"]);return n?" Жилы промыты: порча ушла.":" Жилы чисты.";},
  ядро(c){const r=["кристалл","эфирный кристалл"].find(x=>(Number(G.inv[x])||0)>0);if(!r)return " Ядра нет: раскалывать нечего, удар слабее.";
   G.inv[r]-=1;if(G.inv[r]<=0)delete G.inv[r];if(c.бой){const d=Math.round((10+КанонОсобое.h()*1.5)*c.k);c.cb.hp-=d;safeFn(()=>updateCombat());if(c.cb.hp<=0){victory();return " ";}return ` Осколки ядра: ещё −${d}.`;}return "";},
  пробой(c){return "";},
  держать_переход(c){safeFn(()=>buffSet("кн_переход",2));return " Узел держит переход: два часа он не схлопнется за отрядом.";},
  заслон_разума(c){const n=КанонОсобое.снять(["страх","морока","чужой голос"]);safeFn(()=>buffSet("кн_разум",Math.max(2,Math.round(8*c.k/3))));return " Заслон мыслей: страх и морок не входят.";},
  двойник(c){if(!c.бой)return "";c.cb.кнКукла=Math.max(Number(c.cb.кнКукла)||0,2);return " Двойник отвлекает тварь: два её удара уйдут в него.";},
  прогноз(c){const r=safeFn(()=>Канон.прогноз&&Канон.прогноз(),null);return r||" Шёпот беды тих: в ближайшие сутки краю ничто не грозит.";},
  стойкость_стихиям(c){safeFn(()=>buffSet("кн_буря",4));return " Зарок перед бурей: стихии бьют слабее, пока вы не отступите.";}},
 run(sp,out,k){const f=sp&&sp.особое&&this.д[sp.особое];if(!f)return "";const бой=!!(G.inCombat&&G.combat);
  try{return f.call(this,{sp,out,k,бой,cb:G.combat})||"";}catch(_){return "";}}};

/* ── 6. Обёртка сотворения: форма, особое, род формы в словах ── */
const КанонРечь={
 /* Слова ядер сложены под формы женского рода («Метка … разошлась»): у
    мужских и средних форм глагол был не в роде («Щит воздуха разошлась»).
    Поправляется для всех форм, прежних и новых. */
 РОД:{bolt:"ж",wave:"ж",ward:"м",mark:"ж",call:"м",beam:"м",cloud:"с",field:"с",chain:"ж",rain:"м",dome:"м",snare:"м",
  echoform:"м",thread:"ж",ring:"с",trail:"м",knot:"м",loop:"ж",whisper:"м",vow:"м"},
 ГЛ:[["разошлась","разошёлся","разошлось"],["вернула","вернул","вернуло"],["открыла","открыл","открыло"],["ушла","ушёл","ушло"],["прокатилась","прокатился","прокатилось"],["укрыла","укрыл","укрыло"]],
 род(sp,out){try{const f=FORM_BY_ID[sp&&sp.форма];const g=f&&this.РОД[f.id];if(!g||typeof out!=="string")return out;let s=out;
  /* «Метка легла…» — слова печати и метки, сложенные под форму «метка»: у прочих форм говорится сама форма */
  if(f.id!=="mark"){const лег={ж:"легла",м:"лёг",с:"легло"}[g],зап={ж:"запечатала",м:"запечатал",с:"запечатало"}[g];
   s=s.replace(/Метка легла/g,`${f.имя} ${лег}`).replace(/Метка (\S+) запечатала/g,`${f.имя} $1 ${зап}`);}
  if(g==="ж")return s;
  for(const [ж,м,с] of this.ГЛ){const re=new RegExp(`(${f.имя}[^.:]{0,40}?) ${ж}(?=[\\s.,:;!?]|$)`,"g");s=s.replace(re,`$1 ${g==="м"?м:с}`);}return s;}catch(_){return out;}}};
safeFn(()=>{const e0=castCustomEffect;castCustomEffect=function(sp){
 const было=Object.assign({},G.buffs||{});const out=e0.apply(this,arguments);
 try{if(typeof out!=="string"||!sp)return out;
  if(out===" "){if(sp.особое==="мана_за_добивание"){G.mana=Math.min(G.manaMax,(Number(G.mana)||0)+2);}
   if(G.combat&&G.combat.кнДуша){}return out;}
  const k=КанонФормы.сила(sp);
  let s=КанонРечь.род(sp,out)+КанонФормы.после(sp,out,было)+КанонОсобое.run(sp,out,k);
  if(sp.n)G.lastSpellName=sp.n;
  return s;}catch(_){return out;}};});

/* ── 7. Ход боя: следы, узлы, долги, купола и прочее, что легло на тварь ── */
/* Undead.onStart игра зовёт ДО того, как создан G.combat: всё, что кладётся на новый бой, ставится
   в очередь и исполняется сразу после startCombat — иначе флаги ложились бы на прошлый бой или в никуда. */
const КанонБой={очередь:[],после(fn){this.очередь.push(fn);}};
safeFn(()=>{const s0=startCombat;startCombat=function(c,opts){КанонБой.очередь=[];const r=s0.apply(this,arguments);const q=КанонБой.очередь;КанонБой.очередь=[];
 const cb=G.combat;if(cb&&G.inCombat)for(const fn of q)safeFn(()=>fn(cb));return r;};});
/* ── КанонЦепь: одна обёртка на каждую общую функцию (Альфа 1.0) ──
   Части канона (магия, твари, звери, вещи, умения) прежде оборачивали одни и те же функции заново, до пяти раз
   подряд: удар твари и героя, начало боя, силу чар, встречу в мире и победу. Теперь каждая часть кладёт свой шаг
   сюда, а обёртка у функции одна (в конце модуля). Шаги идут в прежнем порядке: что раньше вкладывалось глубже,
   то и выполняется раньше. Сбой одного шага не роняет остальные. */
const КанонЦепь={шаги:{onStrike:[],onHit:[],onStart:[],spellK:[],beastAt:[],victory:[]},шаг(где,f){this.шаги[где].push(f);}};
КанонЦепь.шаг("onStrike",function(m,d,mdmg){
 try{const cb=G.combat;if(!cb||!(d>0))return d;const лог=t=>safeFn(()=>cbLog(t));
  if(cb.кнУзел){const u=cb.кнУзел;cb.кнУзел=null;cb.путы=(Number(cb.путы)||0)+1;d=Math.round(d*0.5);Канон.звук("oc_chain",{kind:"combat",gain:0.5});лог("Тварь шагнула в узел: удар вполсилы, и следующий ход она теряет.");}
  if(cb.кнОтброс){cb.кнОтброс=0;лог("Отброшенная тварь не достала.");return 0;}
  if((Number(cb.кнКукла)||0)>0){cb.кнКукла--;Канон.звук("oc_wood_hit",{kind:"combat",gain:0.45});лог("Удар принят заступником.");return 0;}
  if(buffActive("кн_жребий")){cb.кнСчёт=(Number(cb.кнСчёт)||0)+1;if(cb.кнСчёт%5===0){лог("Жребий: удар врага ушёл мимо.");return 0;}}
  if((Number(cb.кнСлед)||0)>0){cb.кнСлед--;d=Math.round(d*0.75);}
  if((Number(cb.кнНемо)||0)>0){cb.кнНемо--;d=Math.round(d*0.8);}
  if((Number(cb.кнФундамент)||0)>0){cb.кнФундамент--;d=Math.round(d*0.75);}
  if(buffActive("кн_буря")&&/fire|storm|lightning|frost|огн|гроз|мороз|ледян/i.test(String(m&&m.id)+" "+String(m&&m.n)))d=Math.round(d*0.6);
  if(buffActive("кн_боль"))cb.кнБоль=Math.min(10,(Number(cb.кнБоль)||0)+1);
  if(cb.кнВозврат&&cb.кнВозврат.ходов>0){cb.кнВозврат.ходов--;const в=Math.max(1,Math.round(d*cb.кнВозврат.доля));cb.hp-=в;safeFn(()=>updateCombat());лог(`Долг взыскан: твари −${в}.`);
   if(cb.hp<=0)setTimeout(()=>safeFn(()=>{if(G.inCombat&&G.combat===cb)victory();}),300);}
  if((Number(cb.кнКопья)||0)>0){cb.кнКопья--;const в=Math.max(1,Math.round(3+КанонОсобое.h()*0.5));cb.hp-=в;safeFn(()=>updateCombat());лог(`Тварь напоролась на копья: −${в}.`);}
 }catch(_){}
 return Math.max(0,d);});
/* ход героя: яд, жала, бесы — жгут тварь; вскрытие и боль — сильнее удар */
КанонЦепь.шаг("onHit",function(m,d,dmg){
 try{const cb=G.combat;if(!cb)return d;let доп=0;const лог=t=>safeFn(()=>cbLog(t));
  if(cb.кнВскрытие&&d>0)d=Math.round(d*(1+cb.кнВскрытие));
  if((Number(cb.кнБоль)||0)>0&&d>0){d+=cb.кнБоль;cb.кнБоль=0;}
  if((Number(cb.кнЯд)||0)>0){cb.кнЯд--;доп+=2+Math.round(КанонОсобое.h()*0.3);}
  if((Number(cb.кнЖала)||0)>0){cb.кнЖала--;доп+=2;}
  if((Number(cb.кнБесы)||0)>0){cb.кнБесы--;доп+=3+Math.round(КанонОсобое.h()*0.4);}
  if(доп)лог(`Яд, жала и бесы: ещё −${доп}.`);d+=доп;}catch(_){}
 return d;});
/* начало боя: узел и растяжка, поставленные заранее */
КанонЦепь.шаг("onStart",function(m,r){
 try{КанонБой.после(cb=>{
  if(buffActive("кн_узел")){delete G.buffs["кн_узел"];cb.путы=(Number(cb.путы)||0)+1;setTimeout(()=>safeFn(()=>narrate("Тварь начинает бой в узле: первый ход она потеряла.",{interrupt:false,cat:"combat"})),1500);}
  if(buffActive("кн_растяжка")){delete G.buffs["кн_растяжка"];cb.путы=(Number(cb.путы)||0)+1;Канон.звук("kn_str_pluck",{kind:"combat",gain:0.55});
   setTimeout(()=>safeFn(()=>narrate("Струна-растяжка зазвенела: вы готовы раньше, чем тварь.",{interrupt:false,cat:"combat"})),1200);}});}catch(_){}
 return r;});
/* заём и прочие цены чар */
КанонЦепь.шаг("spellK",function(sp,k){if(buffActive("кн_долг"))k*=1.3;return k;});
/* бегство: узел невозврата не пускает; удавшийся побег нарушает зарок */
safeFn(()=>{const f0=fight;fight=function(a){const cb=G.combat;
 if(a==="flee"&&cb&&(Number(cb.кнУзелБоя)||0)>0){cb.кнУзелБоя--;Канон.звук("oc_chain",{kind:"combat",gain:0.5});
  safeFn(()=>cbLog(`Узел невозврата держит: бежать нельзя ещё ${cb.кнУзелБоя} ${plural(cb.кнУзелБоя,"ход","хода","ходов")}.`));
  narrate("Узел невозврата держит: бежать нельзя.",{interrupt:false,cat:"combat"});return false;}
 return f0.apply(this,arguments);};});
safeFn(()=>{const o0=Director.onFlee.bind(Director);Director.onFlee=function(m){const r=o0(m);safeFn(()=>КанонФормы.нарушить("вы бежали из боя"));return r;};});
/* узел на пороге: павший в эти сутки встаёт у своего узла, а не у поселения */
safeFn(()=>{const d0=defeat;defeat=function(){const s=Канон.ст(),u=s.узел;const r=d0.apply(this,arguments);
 try{if(u&&Number(u.до)>Канон.now()&&!u.место&&!G.place){s.узел=null;G.x=u.x;G.y=u.y;
   safeFn(()=>contentCache&&contentCache.delete&&contentCache.delete(u.x+","+u.y));
   safeFn(()=>{const c=cellContent(G.x,G.y);ambLayers(c.terrain[0]);bankUpdateAmbient();});
   Канон.звук("oc_hinge",{gain:0.5});
   setTimeout(()=>safeFn(()=>narrate("Узел на пороге развязался: вы очнулись там, где его завязали.",{interrupt:false})),2600);
   safeFn(()=>journal("Очнулись у своего узла на пороге."));safeFn(()=>refresh());safeFn(()=>saveGame(true));}}catch(_){}
 return r;};});

/* ── 8. Твари канона ──
   Восемьдесят восемь тварей стоят в общем порядке боя, как твари Немоты:
   голос рода (свободный голос своего рода, прежние раскладки не сдвигаются),
   добыча (свой трофей и родовое), мифология, бестиарий; встают в своих
   землях — изредка вместо здешнего зверя (не вытесняя прежних), чаще в
   краях канона и в его подземельях. Умения — в тех же местах, где умения
   нежити: начало боя, удар героя, удар твари, цена и сила чар. */
const КАНОН_ТВАРИ=(KN.creatures||[]).map(t=>({id:t.id,n:t.n,snd:t.snd,fx:t.fx,biomes:[],кнБиомы:t.biomes,min:t.min,max:t.max,кн:true,
 кнУм:t.умения||[],о:t.о,механика:t.механика,род:t.род,трофей:t.трофей,нежить:!!t.нежить,fly:t.fly||0,роет:!!t.роет,бог:t.бог,кто:t.кто,звукО:t.звукО,пакет:t.пакет,цена:t.цена}));
const КАНОН_ТВАРЬ=Object.fromEntries(КАНОН_ТВАРИ.map(t=>[t.id,t]));
safeFn(()=>{for(const t of КАНОН_ТВАРИ){FOE_FAMILY_ID[t.id]=t.род;
  MONSTER_LORE[t.id]={god:t.бог,myth:t.о.charAt(0).toUpperCase()+t.о.slice(1),who:t.кто||"Люди этих мест обходят её стороной."};
  SPOILS_BY_ID[t.id]=[[t.трофей,0.35]];SPOIL_PRICE[t.трофей]=t.цена;
  safeFn(()=>{ITEM_LORE[t.трофей]={о:`трофей с твари «${t.n}»: ${t.о.charAt(0).toLowerCase()+t.о.slice(1).replace(/\.$/,"")}; скупают алхимики, мастера и зверинцы`,имя:`по твари, с которой его снимают, — «${t.n}»`};});}
 const k=RES_KINDS.find(x=>x.id==="trophy");if(k)for(const t of КАНОН_ТВАРИ){if(k.res.indexOf(t.трофей)<0)k.res.push(t.трофей);RES_KIND_BY_RES[t.трофей]=k;}});
/* голос вида: свободный голос своего рода — так же, как у тварей Немоты */
safeFn(()=>{const b0=FoeVoices.build.bind(FoeVoices);FoeVoices.build=function(){const map=b0();
 const key=c=>c.role+"#"+c.v+"@"+c.rate;const занято=new Set(Object.keys(map).map(id=>{const v=map[id];return v.idle+"#"+v.v+"@"+v.rate;}));
 for(const m of КАНОН_ТВАРИ){if(map[m.id])continue;const f=foeFamily(m);const pool=this.pool(f);if(!pool.length)continue;
  const sz=this.size(m);const высоты=FOE_VOICE_RATES.filter(r=>sz<0?r<=1.001:sz>0?r>=0.999:true).concat(FOE_VOICE_RATES);let c=null;
  выбор:for(const rate of высоты)for(const role of pool)for(let v=0;v<this.files(role);v++){const x={role,v,rate};if(!занято.has(key(x))){c=x;break выбор;}}
  if(!c)c={role:pool[0],v:0,rate:1};занято.add(key(c));
  const k=pool.indexOf(c.role),cry=pool[(k+1)%pool.length];
  map[m.id]={family:f,idle:c.role,v:c.v,rate:c.rate,cry,cryV:c.v%Math.max(1,this.files(cry))};}
 this.map=map;return map;};FoeVoices.map=null;});
const КанонТвари={
 УМ:{засада:"бьёт из засады: первый удар тяжелее",стая:"ходит стаей: крепче и зовёт своих",тревога:"поднимает тревогу: не одолеете быстро — придут свои",
  яд:"ядовита",ест_чары:"ест чары: пьёт ману и снимает усиления",вор:"ворует и бежит",смена:"меняет уязвимость каждый ход",зеркало:"отражает чары",
  звон_ломает:"звон колоколов и струн её ломает",панцирь:"в панцире: оружие берёт хуже",сети:"опутывает сетями",морок:"морок: удары проходят сквозь",
  гасит_свет:"гасит свет вокруг",роет:"роет и бьёт снизу",трус:"бежит, когда ранена",реген:"затягивает раны",путает_чары:"шёпот путает чары: они дороже",
  оглушает:"оглушает",пора:"в свою пору сильнее",держатель:"хозяин места: крепче всех",крадёт_память:"крадёт память: опыт уходит",огонь:"кусает огнём",
  слепой:"слепа: проходит мимо тихих",мирный:"не нападает сама"},
 есть(m,u){return !!(m&&m.кн&&(m.кнУм||[]).indexOf(u)>=0);},
 имя(m){return ((m&&КАНОН_ТВАРЬ[m.id])||m||{}).n||"тварь";},
 /* где водится: биом клетки по правилам мира, а в краях канона — их твари */
 подходят(t){const b=t||"";const к=this._по||(this._по={});return к[b]||(к[b]=КАНОН_ТВАРИ.filter(m=>m.кнБиомы.indexOf(b)>=0));},
 тихо(){return safeFn(()=>buffActive("тишина шага")||buffActive("морок")||buffActive("скрытность"),false);},
 слово(m){const s=Канон.ст();if(!s.твари||typeof s.твари!=="object")s.твари={};const перв=!s.твари[m.id];s.твари[m.id]=(Number(s.твари[m.id])||0)+1;
  const ум=(m.кнУм||[]).map(u=>this.УМ[u]).filter(Boolean);
  return перв?`${m.n} — ${m.о.charAt(0).toLowerCase()+m.о.slice(1).replace(/\.$/,"")}.${ум.length?` Повадки: ${ум.join("; ")}.`:""}`
   :`${m.n}${ум.length?`: ${ум.join("; ")}`:""}.`;}};
/* мир: изредка вместо здешнего зверя — тварь канона той же земли; в краях канона чаще (§12) */
КанонЦепь.шаг("beastAt",function(m,x,y,c,доля){
 if(!m||G.dark||m.нем||m.кн)return m;
 try{const ж=hashName(x,y,18011);if(ж>=0.6)return m;  /* (Альфа 1.5) сперва жребий: край ищется, только если он может решить */
  const t=c&&c.terrain&&c.terrain[0];const край=safeFn(()=>Канон.край&&Канон.край(x,y),null);if(ж>=(край?0.6:0.16))return m;
  let cand=край&&край.твари&&край.твари.length?край.твари.map(id=>КАНОН_ТВАРЬ[id]).filter(Boolean):КанонТвари.подходят(t);
  if(!cand.length)return m;const пик=cand[Math.floor(hashName(x,y,18012)*cand.length)%cand.length];
  if(КанонТвари.есть(пик,"слепой")&&КанонТвари.тихо())return m;
  return пик;}catch(_){return m;}});
/* подземелья: в пещерных ярусах изредка — пещерные твари канона; в подземельях канона — свои (§12) */
safeFn(()=>{const d0=dungeonPool;dungeonPool=function(base){const r=d0.apply(this,arguments);
 try{const p=G.place;if(!p||G.dark)return r;const своё=safeFn(()=>Канон.подземелье&&Канон.подземелье(p),null);
  if(своё&&своё.твари&&своё.твари.length){const из=своё.твари.map(id=>КАНОН_ТВАРЬ[id]).filter(Boolean);if(из.length)return r.concat(из,из,из);}
  const пещ=КанонТвари.подходят("cave");if(пещ.length&&hashName(p.bx|0,(p.by|0)+(Number(p.depth)||0),18021)<0.3)return r.concat([пещ[Math.floor(hashName(p.bx|0,p.by|0,18022)*пещ.length)%пещ.length]]);}catch(_){}
 return r;};});
/* ступени и сила: стая крепче, хозяин места — заметно */
safeFn(()=>{const p0=Undead.prep.bind(Undead);Undead.prep=function(m,depth){const r=p0(m,depth);
 try{if(r&&r.кн){if(КанонТвари.есть(r,"стая")){r.hp=Math.round(r.hp*1.4);r.xp=Math.round((Number(r.xp)||0)*1.4);}
   if(КанонТвари.есть(r,"держатель")){r.hp=Math.round(r.hp*1.6);r.dmg=Math.round((Number(r.dmg)||1)*1.2);r.xp=Math.round((Number(r.xp)||0)*1.8);r.gold=Math.round((Number(r.gold)||0)*1.6);}}}catch(_){}
 return r;};});
/* начало боя: кто это; засада, слепота, мирный нрав, свет */
КанонЦепь.шаг("onStart",function(m,r){
 try{if(m&&m.кн)КанонБой.после(cb=>{
  if(КанонТвари.есть(m,"засада")&&!buffActive("кн_растяжка")&&!КанонТвари.тихо())cb.кнЗасада=1;
  if(КанонТвари.есть(m,"роет"))cb.кнСнизу=1;
  if(КанонТвари.есть(m,"гасит_свет")&&!buffActive("свет"))cb.кнТьма=1;
  if(КанонТвари.есть(m,"морок"))cb.кнМорок=2;
  setTimeout(()=>safeFn(()=>{if(G.combat===cb)narrate(КанонТвари.слово(m),{interrupt:false,cat:"combat"});}),1900);});}catch(_){}
 return r;});
/* удар героя оружием: панцирь, морок, тьма, сети, звон, реген, тревога */
КанонЦепь.шаг("onHit",function(m,d,dmg){
 try{const cb=G.combat;if(!m||!m.кн||!cb||!(d>0))return d;const лог=t=>safeFn(()=>cbLog(t));
  if((Number(cb.кнМорок)||0)>0&&Math.random()<0.35){cb.кнМорок--;лог("Удар прошёл сквозь морок.");return 0;}
  if(cb.кнСетиГерой){cb.кнСетиГерой=0;d=Math.round(d*0.6);лог("Руки в сетях: удар слабее.");}
  if(cb.кнОглушён){cb.кнОглушён=0;d=Math.round(d*0.5);}
  if(cb.кнТьма)d=Math.round(d*0.85);
  if(КанонТвари.есть(m,"панцирь")&&!((Number(cb.zvBreak)||0)>0)){d=Math.max(1,Math.round(d*0.7));if(!cb.кнПанц){cb.кнПанц=1;лог(`${m.n} в панцире: оружие берёт хуже.`);}}
  if(КанонТвари.есть(m,"звон_ломает"))d=Math.max(1,Math.round(d*0.7));
  if(КанонТвари.есть(m,"реген")){const р=Math.max(1,Math.round((Number(m.hp)||40)*0.04));cb.hp=Math.min(Number(m.hp)||cb.hp,(Number(cb.hp)||0)+р);}
  if(КанонТвари.есть(m,"тревога")){cb.кнУдаров=(Number(cb.кнУдаров)||0)+1;if(cb.кнУдаров===3&&cb.hp>(Number(m.hp)||1)*0.3){cb.hp=Math.round(cb.hp*1.25);Канон.звук("guard_shout",{kind:"combat",gain:0.5});лог(`${m.n} поднял тревогу: на шум пришли свои, тварь крепче.`);}}
  if(КанонТвари.есть(m,"трус")&&cb.hp-d>0&&cb.hp-d<(Number(m.hp)||1)*0.2&&Math.random()<0.3){cb.кнБегство=1;}
 }catch(_){}
 return d;});
/* удар твари: засада, снизу, яд, кража, оглушение, огонь, пора, память, чары */
КанонЦепь.шаг("onStrike",function(m,d,mdmg){
 try{const cb=G.combat;if(!m||!m.кн||!cb)return d;const лог=t=>safeFn(()=>cbLog(t));
  if(КанонТвари.есть(m,"мирный"))return 0;
  if(cb.кнЗасада){cb.кнЗасада=0;d=Math.round(d*1.8);лог(`${m.n} бьёт из засады!`);}
  if(cb.кнСнизу){cb.кнСнизу=0;d=Math.round(d*1.5);лог(`${m.n} бьёт из-под земли.`);}
  if(КанонТвари.есть(m,"пора")&&safeFn(()=>isNight(),false))d=Math.round(d*1.3);
  if(КанонТвари.есть(m,"огонь"))d=Math.round(d*1.2);
  if(КанонТвари.есть(m,"яд")&&Math.random()<0.3){safeFn(()=>buffSet("яд",2));лог("Яд в ране.");}
  if(КанонТвари.есть(m,"сети")&&Math.random()<0.3){cb.кнСетиГерой=1;лог("Сеть легла на руки.");}
  if(КанонТвари.есть(m,"оглушает")&&Math.random()<0.2){cb.кнОглушён=1;лог("В ушах звенит: следующий удар выйдет слабее.");}
  if(КанонТвари.есть(m,"ест_чары")){const v=Math.min(3,Number(G.mana)||0);if(v>0){G.mana-=v;cb.hp=Math.min(Number(m.hp)||cb.hp,(Number(cb.hp)||0)+v);}
   for(const id of ["благословение","оберег","мощь"])if(buffActive(id)&&Math.random()<0.5){delete G.buffs[id];лог(`${m.n} съела ваше усиление.`);break;}}
  if(КанонТвари.есть(m,"крадёт_память")&&Math.random()<0.2){const x=Math.min(Number(G.xp)||0,(Number(G.level)||1)*3);if(x>0){G.xp-=x;лог(`${m.n} крадёт память: опыт −${x}.`);}}
  if(КанонТвари.есть(m,"вор")&&!safeFn(()=>КанонЗвери.есть("сторож"),false)&&Math.random()<0.2&&(Number(G.gold)||0)>0){const з=Math.min(Number(G.gold)||0,5+(Number(m.lvl)||1)*2);G.gold-=з;
   const s=Канон.ст();if(!s.украдено)s.украдено={};s.украдено[m.id]=(Number(s.украдено[m.id])||0)+з;
   лог(`${m.n} выхватила ${з} золота и бежит.`);cb.кнБегство=1;}
  if(cb.кнБегство){cb.кнБегство=0;setTimeout(()=>safeFn(()=>{if(G.inCombat&&G.combat===cb){endCombat();safeFn(()=>{refresh();resumeLocationMusic();});
    narrate(`${m.n} сбежала.`,{interrupt:false,cat:"combat"});}}),500);}
 }catch(_){}
 return d;});
/* чары по твари: смена уязвимости, зеркало, звон ломает стекло; шёпот твари дороже чары */
safeFn(()=>{const k0=bossDamageK;bossDamageK=function(kind,school){let k=k0.apply(this,arguments);
 try{const cb=G.combat,m=cb&&cb.m;if(!m||!m.кн||kind!=="spell")return k;
  if(КанонТвари.есть(m,"зеркало"))k*=0.6;
  if(КанонТвари.есть(m,"звон_ломает")&&["bell","strings","sound","echo"].indexOf(school)>=0)k*=2;
  if(КанонТвари.есть(m,"смена")){const сх=["fire","crystal","light"][Math.floor((Number(cb.кнХод)||0)%3)];k*=(school===сх||(сх==="crystal"&&school==="water"))?1.6:0.7;}}catch(_){}
 return k;};});
КанонЦепь.шаг("spellK",function(sp,k){const m=G.inCombat&&G.combat&&G.combat.m;if(m&&КанонТвари.есть(m,"путает_чары"))k*=1.2;return k;});
/* ход боя: смена уязвимости вслух; украденное возвращается с победой */
safeFn(()=>{const u0=updateCombat;updateCombat=function(){const r=u0.apply(this,arguments);
 try{const cb=G.combat,m=cb&&cb.m;if(m&&m.кн&&КанонТвари.есть(m,"смена")){const ход=Math.floor((Number(cb.кнШаги)||0)/2);cb.кнШаги=(Number(cb.кнШаги)||0)+1;
  if(ход!==(Number(cb.кнХод)||0)){cb.кнХод=ход;safeFn(()=>cbLog(`${m.n} меняется: теперь её берёт ${["огонь","лёд","свет"][ход%3]}.`));}}}catch(_){}
 return r;};});
КанонЦепь.шаг("victory",function(m,cb,r){
 try{if(m&&m.кн){const s=Канон.ст();const з=Number(s.украдено&&s.украдено[m.id])||0;if(з>0){s.украдено[m.id]=0;G.gold=(Number(G.gold)||0)+з;
   setTimeout(()=>safeFn(()=>narrate(`Украденное вернулось: ${з} золота.`,{interrupt:false})),1200);}
  /* пять побед над тварью канона — её повадки изучены: знание «слабость твари» */
  if(!s.твариПобед||typeof s.твариПобед!=="object")s.твариПобед={};s.твариПобед[m.id]=(Number(s.твариПобед[m.id])||0)+1;
  if(s.твариПобед[m.id]===5)safeFn(()=>Lore.add("weak",m.id,m.n,"пять побед: повадки изучены"));}}catch(_){}
 return r;});
/* бестиарий: твари канона отдельным разделом, с голосом вида */
CMD.knvoice=id=>{const m=КАНОН_ТВАРЬ[id];if(!m){narrate("Голос не найден.");return;}narrate(m.n);
 if(!safeFn(()=>foeProfileCue(m,"idle",{gain:0.7}),false))narrate(НЕТ_ЗАПИСИ,{interrupt:false});
 setTimeout(()=>safeFn(()=>foeProfileCue(m,"warcry",{gain:0.7})),1400);};
safeFn(()=>{const r0=renderBestiary;renderBestiary=function(){const r=r0.apply(this,arguments);
 safeFn(()=>{const el=document.getElementById("bestList");if(!el)return;const s=Канон.ст().твари||{};
  const видели=КАНОН_ТВАРИ.filter(m=>s[m.id]);
  el.insertAdjacentHTML("beforeend",`<h3>Твари канона Грани: встречено ${видели.length} из ${КАНОН_ТВАРИ.length}</h3>`+видели.map(m=>{
   const ум=(m.кнУм||[]).map(u=>КанонТвари.УМ[u]).filter(Boolean).join("; ");
   const speak=`${m.n}. Уровни ${m.min}–${m.max}. ${m.о} ${ум?`Повадки: ${ум}.`:""} ${m.механика?`Что о ней известно: ${m.механика}.`:""} Добыча: ${m.трофей}.`;
   return `<div class="list-line" tabindex="0" data-speak="${speak.replace(/"/g,"&quot;")}"><b>${m.n}</b> (уровни ${m.min}–${m.max}). ${m.о}<br>
   ${ум?`Повадки: ${ум}.<br>`:""}Добыча: ${m.трофей}.<button data-cmd="knvoice:${m.id}" data-speak="Прослушать голос: ${m.n}.">Прослушать голос</button></div>`;}).join(""));});
 return r;};});

/* ── 9. Баффы канона в деле ──
   Чары канона ставят баффы — здесь каждый получает своё действие в общих обработчиках игры:
   след сбивает погоню, убежище уводит тварей и крепит отдых, засов отнимает у твари первый ход,
   облачный трап смягчает падение в ловушку, узел перехода держит складку, заслон мыслей не пускает
   страх, отражение возвращает порчу, закалка держит обвал, нить наследия ускоряет ремесло. */
safeFn(()=>{const f0=Morpho.fleeK.bind(Morpho);Morpho.fleeK=function(m){let k=Number(f0(m))||0;
 if(buffActive("кн_след"))k+=0.5;k+=Number(safeFn(()=>КанонЗвери.бегство(),0))||0;return k;};});
КанонЦепь.шаг("beastAt",function(m,x,y,c,доля){if(!m)return m;
 try{if(buffActive("кн_убежище")&&Math.random()<0.85)return null;
  if(buffActive("кн_след")&&Math.random()<0.4)return null;
  if(КанонЗвери.есть("нежить_мимо","седло")&&/undead|spirit|bone/.test(String(safeFn(()=>foeFamily(m),""))))return null;}catch(_){}
 return m;});
safeFn(()=>{const b0=buffSet;buffSet=function(id,ч){
 try{if(id==="страх"&&buffActive("кн_разум"))return false;
  if(["проклятие","слепота","страх","загрязнение"].indexOf(id)>=0&&КанонБаффы.отразить(id))return false;
  if(КанонДары.есть("усиления_дольше")&&КанонБаффы.ДОБРЫЕ.indexOf(id)>=0)ч=(Number(ч)||1)+1;}catch(_){}
 return b0.call(this,id,ч);};});
safeFn(()=>{const a0=Hv.add.bind(Hv);Hv.add=function(id,stage,from,silent){
 if(id==="curse"&&safeFn(()=>КанонБаффы.отразить("порча"),false))return "Порча вернулась к тому, кто её наслал.";
 return a0(id,stage,from,silent);};});
const КанонБаффы={
 ДОБРЫЕ:["благословение","оберег","мощь","стойкость","скорость","чутьё","тишина шага","лёгкость","тепло","свет","морок","кн_разум","кн_след","кн_убежище","кн_закалка","кн_трап","кн_переход","кн_наследие"],
 отразить(что){if(!buffActive("кн_отражение")||!G.inCombat||!G.combat)return false;const cb=G.combat;delete G.buffs["кн_отражение"];
  const в=Math.max(3,Math.round((Number(cb.m&&cb.m.hp)||30)*0.12));cb.hp-=в;safeFn(()=>updateCombat());Канон.звук("oc_trap_magic",{kind:"combat",gain:0.5});
  safeFn(()=>cbLog(`Порча (${что}) вернулась к насланнику: твари −${в}.`));
  if(cb.hp<=0)setTimeout(()=>safeFn(()=>{if(G.inCombat&&G.combat===cb)victory();}),300);return true;}};
safeFn(()=>{const o0=Mine.обвал.bind(Mine);Mine.обвал=function(){if(!buffActive("кн_закалка"))return o0();const hp=G.hp;const r=o0();
 if(r&&G.hp<hp){G.hp=hp;setTimeout(()=>safeFn(()=>narrate("Закалённый доспех выдержал: камни не ранили.",{interrupt:false})),900);}return r;};});
safeFn(()=>{const s0=InstanceTrapEngine.spring.bind(InstanceTrapEngine);InstanceTrapEngine.spring=function(c,t){
 let tt=t,доп="";const hp=G.hp;
 try{if(t&&t.перенос&&buffActive("кн_переход")){tt=Object.assign({},t,{перенос:false});доп+=" Узел держит переход: складка не выбросила вас.";}}catch(_){}
 const трап=!!(t&&t.назад&&buffActive("кн_трап"));const r0=трап?Chertog.relic:null;
 if(трап)Chertog.relic=function(id){return id==="feather"?true:r0.apply(this,arguments);};
 let r;try{r=s0(c,tt);}finally{if(r0)Chertog.relic=r0;}
 try{if(трап)доп+=" Облачный трап держит: падение мягче.";
  if(G.hp<hp&&КанонЗвери.есть("ловушки")){const в=Math.round((hp-G.hp)*0.8);G.hp=Math.min(G.hpMax,G.hp+в);доп+=` ${КанонЗвери.кто("ловушки")} вовремя дёрнул вас: ловушка почти не ранила.`;}}catch(_){}
 if(typeof r==="string")return r+доп;if(доп)safeFn(()=>narrate(доп.trim(),{interrupt:false}));return r;};});
safeFn(()=>{const p0=Мастерство170.практика.bind(Мастерство170);Мастерство170.практика=function(id,o){const r=p0(id,o);
 try{if(buffActive("кн_наследие")&&!(o&&o.ок===false)&&Math.random()<0.2)p0(id,Object.assign({},o||{},{тег:"наследие"}));}catch(_){}return r;};});
/* разломы: шов на краях — твари разлома слабее */
safeFn(()=>{const p0=Undead.prep.bind(Undead);Undead.prep=function(m,depth){const r=p0(m,depth);
 try{if(r&&G.dark&&buffActive("кн_шов")){r.hp=Math.round(r.hp*0.8);r.dmg=Math.max(1,Math.round((Number(r.dmg)||1)*0.85));}}catch(_){}return r;};});
Object.assign(Канон,{
 /* мастерство починки: механизм чертога — на ступень целее; иначе — обычный шов */
 починить(){try{if(!Chertog.run())return null;const c=Chertog.cur();if(!c||!c.F||!c.F.mechs)return null;const E=InstanceMechanismEngine;
   const ids=Object.keys(c.F.mechs);const id=ids.find(x=>E.state(c,x)==="DAMAGED")||ids.find(x=>E.state(c,x)==="DESTROYED");if(!id)return null;
   const было=E.state(c,id);const t=E.set(c,id,было==="DAMAGED"?"ACTIVE":"DAMAGED","починка канона");const n=(MECH_KINDS[c.F.mechs[id].kind]||{}).n||"Механизм";
   return ` ${n}: ${было==="DAMAGED"?"трещины стянуты, механизм снова работает":"обломки собраны, механизм можно чинить дальше"}.${t?" "+t:""}`;}catch(_){return null;}},
 закрытьПрорыв(){safeFn(()=>{buffSet("кн_шов",6);if(!G.dark)buffSet("кн_убежище",3);});
  return G.dark?" Шов лёг на края разлома: шесть часов здешние твари слабее.":" Узел лёг на края: малые разрывы рядом стягиваются, три часа твари обходят это место.";},
 прогноз(){try{if(G.place||G.ship||G.dark)return null;let best=null;
   for(let r=3;r<=7;r+=2)for(const [dx,dy,имя] of [[0,-1,"к северу"],[1,-1,"к северо-востоку"],[1,0,"к востоку"],[1,1,"к юго-востоку"],[0,1,"к югу"],[-1,1,"к юго-западу"],[-1,0,"к западу"],[-1,-1,"к северо-западу"]]){
    const x=G.x+dx*r,y=G.y+dy*r;const c=safeFn(()=>cellContent(x,y),null);if(!c)continue;const m=safeFn(()=>beastAt(x,y,c,0.05),null);
    if(m&&(!best||(Number(m.lvl)||0)+(m.boss?50:0)>(Number(best.m.lvl)||0)+(best.m.boss?50:0)))best={m,имя,r};}
   if(!best)return " Шёпот беды тих: рядом никто не ждёт.";
   return ` Шёпот беды: ${best.имя}, шагах в ${best.r}, — ${best.m.n}${best.m.lvl?", уровень "+best.m.lvl:""}.`;}catch(_){return null;}}});

/* ── 10. Питомцы и скакуны канона ──
   68 зверей — каждый свой род с одной породой: характеристики, корм, роли и ход из канона,
   три способности (1, 6 и 12 уровень) со своими звуками, свой голос, рык, удар, шаг, езда и бег —
   ни один набор не повторяет родов игры и друг друга (kanon_pets.py). В магазинные списки и
   яйца они не попадают: таких зверей встречают в своих землях и приручают кормом («Приручить зверя»),
   изредка один продают в городском зверинце. Особенность у каждого своя и работает в деле. */
const КАНОН_ЗВЕРИ=KN.pets||[];
/* звуковой облик зверей канона — в своей таблице: ZV_SND остаётся за 46 родами игры (набор 299 их сверяет),
   ZvSnd.prof отдаёт облик канона своему зверю */
const КАНОН_ЗВ_СНД={};
safeFn(()=>{const p0=ZvSnd.prof.bind(ZvSnd);ZvSnd.prof=function(a){return (a&&КАНОН_ЗВ_СНД[a.fam])||p0(a);};});const КАНОН_ЗВЕРЬ=Object.fromEntries(КАНОН_ЗВЕРИ.map(x=>[x.id,x]));
for(const x of КАНОН_ЗВЕРИ){
 ZV_FAMILY_BY_ID[x.id]={id:x.id,n:x.род,g:x.g,ход:x.ход,р:x.р,ездовой:x.ездовой,корм:x.корм.slice(),роли:x.роли.slice(),звук:x.снд.г[0],сила:x.сила,стойк:x.стойк,
  ловк:x.ловк,чутьё:x.чутьё,о:`${x.о}. Особенность: ${x.особенность.replace(/\.$/,"")}`,кн:true};
 ZV_BREED_BY_ID[x.id]={id:x.id,fam:x.id,var:"kanon",n:x.имя,ред:x.ред,кн:true};
 КАНОН_ЗВ_СНД[x.id]=Object.assign({},x.снд);
 safeFn(()=>{ZV_ABIL150[x.id]=x.способности.map(a=>({n:a.n,эф:a.эф,ш:a.ш,ур:a.ур,зв:a.зв}));});
 ZV_ABILITIES[x.id]={n:x.способности[0].n,эф:x.способности[0].эф,ш:x.способности[0].ш};}
safeFn(()=>Object.assign(ZV_LEVEL,KN.zvLevel||{}));
const КанонЗвери={
 зверь(a){return a&&КАНОН_ЗВЕРЬ[a.fam]||null;},
 /* кто из зверей канона сейчас с героем: спутники и скакун под седлом */
 рядом(где){const out=[];safeFn(()=>{if(где!=="седло")for(const a of Zver.pets())if(this.зверь(a))out.push(a);
   const m=Zver.mount();if(m&&this.зверь(m)&&out.indexOf(m)<0&&где!=="спутник")out.push(m);});return out;},
 особ(a,k){const x=this.зверь(a);if(!x)return null;const o=x.особ.find(s=>s.split(":")[0]===k);return o?(o.split(":")[1]||"1"):null;},
 есть(k,где){if((Number(this.рядом(где).length)||0)===0)return false;return this.рядом(где).some(a=>this.особ(a,k)!=null&&(Number(a.сыт)||0)>=10);},
 кто(k){const a=this.рядом().find(a=>this.особ(a,k)!=null);return a?a.n:"Зверь";},
 доля(k){let v=0;for(const a of this.рядом())if((Number(a.сыт)||0)>=10){const o=this.особ(a,k);if(o!=null)v+=Number(o)||0;}return v;},
 бегство(){return this.есть("бегство","седло")?0.3:0;},
 рельеф(){return safeFn(()=>{const c=cellContent(G.x,G.y);const b=biomeAt(G.x,G.y);return String(c&&c.terrain&&c.terrain[0]||"")+" "+String(b&&(b.id||b)||"");},"");},
 полнолуние(){const d=(Number(G.day)||1)%28;return d>=13&&d<=15;},
 пора(c){if(!c)return true;const t=this.рельеф();
  switch(c){case "лес":return /forest|wood|jungle|grove|taiga/.test(t);case "степь":return /plain|steppe|grass|meadow/.test(t);
   case "пустыня":return /desert|dune|waste/.test(t);case "горы":return /mount|hill|rock|cliff|peak/.test(t);case "болото":return /swamp|marsh|bog|fen/.test(t);
   case "берег":return !!G.ship||/coast|beach|shore|reef|archip/.test(t);case "дорога":return /road/.test(t);
   case "пещера":return !!G.dark||!!(G.place&&(Number(G.place.depth)||0)>0)||/cave/.test(t);case "город":return !!safeFn(()=>Zver.inTown(),false);
   case "ночь":return !!safeFn(()=>isNight(),false);case "сумерки":{const h=(Number(G.hour)||0)%24;return (h>=5&&h<7)||(h>=19&&h<21);}
   case "гроза":return /гроз|storm|thunder|молни/i.test(safeFn(()=>JSON.stringify(Weather.cur||""),""));case "полнолуние":return this.полнолуние();}
  return false;},
 дар(a,k){const x=this.зверь(a);if(!x)return 0;let v=0;for(const [kk,vv,c] of x.дары)if(kk===k&&this.пора(c))v+=Number(vv)||0;return v;},
 /* что сказать о дарах по месту и поре — для окна зверя */
 дарыСловами(a){const x=this.зверь(a);if(!x)return [];const П={лес:"в лесу",степь:"в степи",пустыня:"в пустыне",горы:"в горах",болото:"на болоте",берег:"у моря",дорога:"на дороге",
   пещера:"под землёй",город:"в городе",ночь:"ночью",сумерки:"в сумерках",гроза:"в грозу",полнолуние:"в полнолуние"};
  const К={шаг:v=>v>0?`дорога короче`:`идёт медленнее`,скрытность:()=>"вы тише",море:()=>"морской путь короче",добыча:v=>`везёт добычи на ${v} больше`,скан:v=>`чует на ${v} ${plural(v,"клетку","клетки","клеток")} дальше`,
   крыло:v=>`поднимает на крыло до высоты ${v}`,ночь:()=>"видит ночью",урон:()=>"удар с разбега сильнее",стойк:v=>`стойкость +${v}`};
  return x.дары.map(([k,v,c])=>(К[k]?К[k](v):k)+(c?" "+(П[c]||c):"")).filter(Boolean);}};
/* дары зверя канона по месту и поре — поверх даров рода, облика, снаряжения */
safeFn(()=>{const g0=Zver.gift.bind(Zver);Zver.gift=function(a,k){const v=g0(a,k);const x=КанонЗвери.зверь(a);if(!x||k==="стойк")return v;
 let доп=КанонЗвери.дар(a,k);if(!доп)return v;if((Number(a.сыт)||0)<20&&k!=="крыло"&&k!=="ночь")доп/=2;
 let raw=v==null?0:(k==="шаг"||k==="море"?1-v:k==="урон"?v-1:v);raw+=доп;
 if(k==="шаг"||k==="скрытность"||k==="море")raw=Math.max(-0.25,Math.min(0.6,raw));if(k==="урон")raw=Math.min(0.5,raw);
 if(k==="добыча"||k==="скан"||k==="крыло")raw=Math.round(raw);
 if((k==="добыча"||k==="скан"||k==="крыло"||k==="ночь"||k==="скрытность")&&raw<=0)return v;
 if(k==="шаг"||k==="море")return Math.round((1-raw)*100)/100;if(k==="урон")return Math.round((1+raw)*100)/100;if(k==="ночь")return 1;
 return Math.round(raw*100)/100;};});
safeFn(()=>{const s0=Zver.stat.bind(Zver);Zver.stat=function(a,k){let v=s0(a,k);if(k==="стойк"&&КанонЗвери.зверь(a))v+=КанонЗвери.дар(a,"стойк");return v;};});
safeFn(()=>{const d0=Zver.dmg.bind(Zver);Zver.dmg=function(a){let v=d0(a);if(КанонЗвери.особ(a,"сила_полнолуние")!=null&&КанонЗвери.полнолуние())v*=2;return v;};});
/* спутник (не под седлом) тоже дарит чутьё, тишину, ночное зрение и поклажу */
safeFn(()=>{const mg=mountGift;mountGift=function(k){let v=mg(k);
 try{if(["скан","добыча","скрытность","ночь"].indexOf(k)<0)return v;let доп=0;
  for(const a of КанонЗвери.рядом("спутник")){if(ZV_FAMILY_BY_ID[a.fam].ездовой||(Number(a.сыт)||0)<20)continue;доп+=КанонЗвери.дар(a,k);}
  if(!доп)return v;if(k==="скрытность")return Math.min(0.8,(Number(v)||0)+доп);if(k==="ночь")return 1;return Math.round((Number(v)||0)+доп);}catch(_){return v;}};});
/* окно зверя: дары по месту и поре и уход по канону */
safeFn(()=>{const w0=Zver.giftWords.bind(Zver);Zver.giftWords=function(a){const out=w0(a);const x=КанонЗвери.зверь(a);
 if(x){for(const t of КанонЗвери.дарыСловами(a))if(out.indexOf(t)<0)out.push(t);}return out;};});
/* зверинец: изредка один зверь канона — дороже обычного и только опытному хозяину */
safeFn(()=>{const s0=Zver.shop.bind(Zver);Zver.shop=function(){const out=s0();
 try{const [x,y]=this.shopSeed();if(this.h(x,y,18101)<0.4&&КАНОН_ЗВЕРИ.length){const z=КАНОН_ЗВЕРИ[Math.floor(this.h(x,y,18102)*КАНОН_ЗВЕРИ.length)%КАНОН_ЗВЕРИ.length];
   const b=ZV_BREED_BY_ID[z.id];if(b&&out.indexOf(b)<0)out.push(b);}}catch(_){}return out;};});
safeFn(()=>{const p0=Zver.price.bind(Zver);Zver.price=function(b){const v=p0(b);return b&&b.кн?Math.round(v*1.5):v;};});
safeFn(()=>{const b0=Zver.buy.bind(Zver);Zver.buy=function(id){const x=КАНОН_ЗВЕРЬ[id];
 if(x&&(Number(G.level)||1)<x.ур)return `${x.имя} не пойдёт к новичку: он слушается хозяина не ниже ${x.ур}-го уровня.`;
 const r=b0(id);return r;};});
safeFn(()=>{const t0=Zver.tame.bind(Zver);Zver.tame=function(){const o=this.st().tame;const x=o&&КАНОН_ЗВЕРЬ[o.breed];
 if(x&&(Number(G.level)||1)<x.ур)return `${x.имя} берёт корм, но идти за вами не хочет: он слушается хозяина не ниже ${x.ур}-го уровня.`;
 return t0();};});
/* встреча в природе: раз в сутки, в своей земле, изредка — зверь канона, которого можно приручить */
safeFn(()=>{const k0=Zver.tick.bind(Zver);Zver.tick=function(){const s=this.st();const pos0=s.pos;const r=k0();
 try{КанонЗвери.шаг(pos0!==G.x+","+G.y);КанонЗвери.час();КанонВещи.час();}catch(_){}return r;};});
Object.assign(КанонЗвери,{
 шаг(сдвиг){if(!сдвиг||G.place||G.dark||G.ship||G.inCombat)return;const ст=Канон.ст();if(ст.встречаЗверя===G.day)return;if(Zver.st().tame)return;
  if(Math.random()>=0.004)return;const t=String(safeFn(()=>cellContent(G.x,G.y).terrain[0],"")||"");
  const есть=new Set(Zver.st().list.map(a=>a.fam));const cand=КАНОН_ЗВЕРИ.filter(x=>x.биомы.indexOf(t)>=0&&!есть.has(x.id));if(!cand.length)return;
  const x=cand[Math.floor(Math.random()*cand.length)];ст.встречаЗверя=G.day;
  Zver.st().tame={breed:x.id,lvl:Math.max(1,Math.min(Number(G.level)||1,x.ур+2)),x:G.x,y:G.y,day:G.day};
  safeFn(()=>ZvSnd.voice({fam:x.id,lvl:1},{gain:0.85}));
  setTimeout(()=>safeFn(()=>narrate(`Рядом ${x.имя}: ${x.о.charAt(0).toLowerCase()+x.о.slice(1)}. Его можно приручить кормом — «Приручить зверя». Ест: ${x.корм.join(" или ")}.${(Number(G.level)||1)<x.ур?` Пойдёт только к хозяину ${x.ур}-го уровня.`:""}`,{interrupt:false})),400);},
 /* часовые дела: лечение, находки дня, круги на привале */
 час(){if(G.inCombat)return;const now=Math.floor((Number(G.day)||1)*24+(Number(G.hour)||0));const ст=Канон.ст();if(ст.часЗверей===now)return;
  const было=Number(ст.часЗверей)||now;ст.часЗверей=now;const часов=Math.max(0,Math.min(6,now-было));if(!часов)return;
  const поз=(G.place?"p":"w")+G.x+","+G.y;const стоял=ст.позЧаса===поз;ст.позЧаса=поз;
  if(buffActive("кн_убежище")&&G.hp<G.hpMax)G.hp=Math.min(G.hpMax,G.hp+2*часов);
  const t=[];
  for(const a of this.рядом()){const x=this.зверь(a);if(!x||(Number(a.сыт)||0)<20)continue;
   const л=this.особ(a,"лечит_час");if(л!=null&&G.hp<G.hpMax){const h=(Number(л)||1)*часов;G.hp=Math.min(G.hpMax,G.hp+h);}
   /* на привале (час на месте): сторож будит при подкрадывании, вол держит тихий круг */
   if(стоял&&this.особ(a,"будит")!=null)safeFn(()=>buffSet("кн_засов",2));
   if(стоял&&this.особ(a,"убежище")!=null)safeFn(()=>buffSet("кн_разум",2));
   if(this.особ(a,"тепло")!=null)safeFn(()=>buffSet("тепло",2));
   if(!ст.дела||typeof ст.дела!=="object")ст.дела={};const ключ=a.uid+":"+G.day;if(ст.дела[ключ])continue;
   if(Math.random()>=0.25*часов)continue;const r=this.дело(a,x);if(r){ст.дела[ключ]=1;t.push(r);}}
  if(ст.дела){const ks=Object.keys(ст.дела);if(ks.length>60)for(const k of ks.slice(0,ks.length-60))delete ст.дела[k];}
  if(t.length)safeFn(()=>narrate(t.join(" "),{interrupt:false}));},
 дать(r,n){G.inv[r]=(Number(G.inv[r])||0)+(n||1);},
 /* одно дело дня: находка, весть, жила, вода, починка */
 дело(a,x){const k=o=>this.особ(a,o)!=null;const lvl=Number(a.lvl)||1;
  if(k("тайник")||(k("тайник_ночь")&&safeFn(()=>isNight(),false))){const з=4+Math.round(lvl*1.5+Math.random()*8);G.gold=(Number(G.gold)||0)+з;
   const рес=["самоцвет","кристалл","эфир","эссенция","рунный камень"][Math.floor(Math.random()*5)];this.дать(рес,1);safeFn(()=>Bank.play("oc_diamond",{gain:0.45,maxSec:2}));
   return `${a.n} откопал тайник: ${з} золота и ${рес}.`;}
  if(k("монета")){const з=2+Math.round(lvl+Math.random()*4);G.gold=(Number(G.gold)||0)+з;safeFn(()=>Bank.play("arte_coins",{gain:0.4,maxSec:2}));return `${a.n} притащил монеты: ${з} золота.`;}
  if(k("самоцвет")){this.дать("самоцвет",1);safeFn(()=>Bank.play("oc_diamond",{gain:0.45,maxSec:2}));return `${a.n} нашёл самоцвет.`;}
  if(k("коренья")){const р=Math.random()<0.5?"корень-лекарь":"грибы";this.дать(р,1);safeFn(()=>Bank.play("ad_leaves",{gain:0.4,maxSec:2}));return `${a.n} выкопал: ${р}.`;}
  if(k("жила")&&this.пора("пещера")){this.дать(Math.random()<0.6?"руда":"живая руда",1);safeFn(()=>Bank.play("oc_res_heavy",{gain:0.45,maxSec:2}));return `${a.n} указал жилу: руда в котомке.`;}
  if(k("вода")&&(Number(G.water)||0)<60){G.water=Math.min(safeFn(()=>waterCap(),100),(Number(G.water)||0)+30);safeFn(()=>Bank.play("step_water",{gain:0.5}));return `${a.n} учуял воду: фляга полнее.`;}
  if(k("весть")){const n={key:"зверь_"+a.uid+"_"+G.day,x:G.x,y:G.y,prof:"Странник",name:a.n};const L=safeFn(()=>Молва170._слухи(n,Number(G.day)||1),[])||[];
   if(L[0]){safeFn(()=>Молва170.запомнить(L[0]));return `${a.n} приносит весть: ${L[0].текст}`;}return "";}
  if(k("починка")){const r=safeFn(()=>Канон.починить(),null);if(r)return `${a.n} поработал:${r}`;return "";}
  return "";}});
/* бой: чутьё, первый удар, заслон, крик, стая, слабые бегут */
КанонЦепь.шаг("onStart",function(m,r){
 try{КанонБой.после(cb=>{const говор=[];
  if(buffActive("кн_засов")){delete G.buffs["кн_засов"];cb.путы=(Number(cb.путы)||0)+1;говор.push("Засов держит: тварь бьётся в запертое и теряет ход.");}
  const сем=String(safeFn(()=>foeFamily(m),"")||"");
  const чует=(k,ok)=>{if(!ok||!КанонДары.есть(k))return false;cb.кнЧуял=1;cb.кнЗасада=0;cb.кнСнизу=0;cb.кнМорок=0;
   говор.push(`${КанонДары.кто(k)}: тварь замечена заранее — ни засады, ни морока, первый удар ваш и сильнее.`);return true;};
  чует("чует_нечисть",/undead|spirit|bone/.test(сем))||чует("чует_бесов",/fiend/.test(сем))||
   чует("чует_морок",/spirit|fiend/.test(сем)||КанонТвари.есть(m,"морок")||КанонТвари.есть(m,"путает_чары"))||
   чует("чует_засаду",КанонТвари.есть(m,"засада")||КанонТвари.есть(m,"роет")||/crawler|deep/.test(сем));
  if(КанонЗвери.есть("первый_удар","седло")||КанонВещи.есть("первый_удар"))cb.кнЧуял=1;
  if(КанонЗвери.есть("промах_первого"))cb.кнМимо=1;
  if(КанонДары.есть("заслон1"))cb.кнЗаслон=1;
  if(КанонЗвери.есть("снять_яд"))cb.кнОтЯда=1;
  const ст=Канон.ст();if(КанонЗвери.есть("стая")&&ст.стая!==G.day){ст.стая=G.day;const в=Math.max(4,Math.round((Number(cb.hp)||30)*0.2));cb.hp-=в;
   Канон.звук("wolf_howl",{kind:"combat",gain:0.6});говор.push(`${КанонЗвери.кто("стая")} воет — стая выходит из чащи и рвёт тварь, −${в}.`);}
  if(КанонЗвери.есть("пугает_слабых")&&!m.boss&&(Number(m.lvl)||1)<=(Number(G.level)||1)-3&&Math.random()<0.5){const кто=КанонЗвери.кто("пугает_слабых");
   setTimeout(()=>safeFn(()=>{if(G.inCombat&&G.combat===cb){endCombat();safeFn(()=>{refresh();resumeLocationMusic();});narrate(`${кто} воет — и ${m.n} бежит без боя.`,{interrupt:false,cat:"combat"});}}),700);}
  if(говор.length)setTimeout(()=>safeFn(()=>{if(G.combat===cb)narrate(говор.join(" "),{interrupt:false,cat:"combat"});}),2600);});}catch(_){}
 return r;});
КанонЦепь.шаг("onStrike",function(m,d,mdmg){
 try{const cb=G.combat;if(!cb||!(d>0))return d;const лог=t=>safeFn(()=>cbLog(t));
  if(cb.кнОтЯда&&buffActive("яд")){cb.кнОтЯда=0;delete G.buffs["яд"];G.poisoned=null;safeFn(()=>Hv.cure("poison",3));лог(`${КанонЗвери.кто("снять_яд")} снимает с вас яд.`);}
  if(cb.кнМимо){cb.кнМимо=0;лог(`${КанонЗвери.кто("промах_первого")} кричит — первый удар твари уходит мимо.`);return 0;}
  if(cb.кнЗаслон){cb.кнЗаслон=0;лог(`${КанонДары.кто("заслон1")} гасит удар твари.`);Канон.звук("oc_wood_hit",{kind:"combat",gain:0.45});return 0;}
  const ч=КанонЗвери.доля("часть_удара");if(ч>0)d=Math.max(1,Math.round(d*(1-Math.min(0.4,ч))));
  if(КанонЗвери.есть("стихии_слабее","седло")&&/spirit|fiend|dragon/.test(String(safeFn(()=>foeFamily(m),""))))d=Math.max(1,Math.round(d*0.7));}catch(_){}
 return d;});
КанонЦепь.шаг("onHit",function(m,d,dmg){
 try{const cb=G.combat;if(cb&&cb.кнЧуял&&d>0){cb.кнЧуял=0;d=Math.round(d*1.5);}}catch(_){}return d;});
/* после победы: части, ядра, детали ловушек; удача — больше золота */
КанонЦепь.шаг("victory",function(m,cb,r){
 try{if(!m)return r;const сем=String(safeFn(()=>foeFamily(m),"")||"");const t=[];
  const доб=(k,ok)=>{if(!ok||!КанонДары.есть(k)||Math.random()>=0.4)return;const L=safeFn(()=>Spoils.roll(m),[])||[];const рес=L[0]||(сем==="construct"?"шестерня Зодчих":"кость");
   КанонЗвери.дать(рес,1);t.push(`${КанонДары.кто(k)}: с поля подобрано — ${рес}.`);};
  доб("части",true);доб("детали",/construct|humanoid/.test(сем));доб("ядро",!/humanoid/.test(сем));
  if(КанонЗвери.есть("удача")){const з=Math.max(1,Math.round((Number(m.gold)||10)*0.15));G.gold=(Number(G.gold)||0)+з;t.push(`Сорока приносит удачу: ещё ${з} золота.`);}
  if(t.length)setTimeout(()=>safeFn(()=>narrate(t.join(" "),{interrupt:false})),1600);}catch(_){}
 return r;});
/* сквозь стену, подкоп, завал: раз в сутки — через особое действие канона «сквозь стену» */
Object.assign(КанонЗвери,{
 проход(){const ст=Канон.ст();if(ст.проходЗверя===G.day)return "Сегодня зверь уже водил вас сквозь камень.";
  const a=this.рядом().find(a=>["сквозь","роет","завал"].some(k=>this.особ(a,k)!=null));if(!a)return "Рядом нет зверя, что ходит сквозь камень.";
  if(this.особ(a,"роет")!=null&&!this.пора("пещера"))return `${a.n} роет только под землёй.`;
  const r=safeFn(()=>КанонОсобое.д.сквозь_стену({k:1,бой:false,sp:{n:a.n}}),"")||"";ст.проходЗверя=G.day;return `${a.n} ведёт вас:${r||" здесь сквозь камень хода нет."}`;}});
safeFn(()=>{CMD.knpass=()=>{const t=КанонЗвери.проход();narrate(t,{interrupt:true});safeFn(()=>refresh());return true;};});
/* посольский и гербовый скакун, козёл-скалолаз: стража пропускает всадника без платы */
safeFn(()=>{const p0=Стража147.плата.bind(Стража147);Стража147.плата=function(c,цель){const r=p0(c,цель);
 try{if(r&&!r.отказ&&r.плата>0&&(КанонЗвери.есть("без_пошлины","седло")||КанонВещи.есть("без_пошлины"))){const a=Zver.mount();const з=КанонЗвери.есть("без_пошлины","седло")&&a?`под вами ${a.n} — такого всадника пропускают даром`:`при вас ${КанонВещи.кто("без_пошлины")} — её узнают и пропускают даром`;return Object.assign({},r,{плата:0,why:(r.why||[]).concat([з])});}}catch(_){}
 return r;};});
/* бестиарий зверинца: звери преданий — встреченные описаны целиком, прочие — где их искать */
Object.assign(КанонЗвери,{
 ГДЕ:{forest:"в лесах",plains:"в степях",road:"у дорог",swamp:"на болотах",mountains:"в горах",desert:"в пустынях",coast:"на побережьях",cave:"в пещерах"},
 бестиарий(){const s=Zver.st();const вид=КАНОН_ЗВЕРИ.filter(x=>s.seen[x.id]);
  let h=Zver.line(`Звери преданий Грани: ${КАНОН_ЗВЕРИ.length}, из них ездовых ${КАНОН_ЗВЕРИ.filter(x=>x.ездовой).length}. Встречено ${вид.length}. Их не разводят: встречают в своих землях и приручают кормом, изредка одного продают в городском зверинце.`);
  for(const x of КАНОН_ЗВЕРИ){const где=x.биомы.map(b=>this.ГДЕ[b]||b).join(", ");
   h+=Zver.line(s.seen[x.id]?`${x.имя} — ${x.род}, ${x.ездовой?"ездовой":"спутник"}. ${x.о}. Особенность: ${x.особенность.replace(/\.$/,"")}. Ест: ${x.корм.join(", ")}. Уход: ${x.уход.replace(/\.$/,"")}. Способности: ${x.способности.map(a=>a.n).join(", ")}.`
    :`${x.имя}: ещё не встречен. Говорят, водится ${где}; к хозяину ниже ${x.ур}-го уровня не идёт.`);}
  return h;}});
safeFn(()=>{const bv=Zver.bestView.bind(Zver);Zver.bestView=function(){const sh=this.show;
 this.show=function(t,h,...r){Zver.show=sh;return sh.call(Zver,t,h+safeFn(()=>КанонЗвери.бестиарий(),""),...r);};
 try{return bv();}finally{this.show=sh;}};});

/* ── 11. Вещи канона ──
   83 вещи — артефакты системы ART: направление, ранг из канона (он же требует уровень: легендарная
   слушается с 48-го, мифическая с 64-го), характеристики по рангу и своё дело — оно в описании вещи
   и работает через общие обработчики боя, пути и часа. Выпадают с хозяев мест канона, изредка —
   с прочих тварей канона; каждая вещь в мире одна. */
const КАНОН_ВЕЩИ=KN.items||[];const КАНОН_ВЕЩЬ=Object.fromEntries(КАНОН_ВЕЩИ.map(x=>[x.id,x]));
const КанонВещи={
 сделать(id){const x=КАНОН_ВЕЩЬ[id];if(!x)return null;const seed=1+Math.abs(Math.floor(hashName(x.ранг*31+7,x.имя.length*13,18301)*1e6));
  const a=ART.make({id:x.id,дом:x.дом,ранг:x.ранг,кач:3,имя:x.имя,откуда:"предание",seed});a.база=Object.assign({},x.база);a.кн=x.id;return a;},
 есть_у(id){return (G.artifacts||[]).some(a=>a&&a.кн===id);},
 дать(id,откуда){const x=КАНОН_ВЕЩЬ[id];if(!x||this.есть_у(id))return null;const a=this.сделать(id);if(откуда)a.откуда=откуда;ART.grant({готовая:a});
  safeFn(()=>Lore.add("relic",a.имя,a.имя,x.о));return a;},
 мои(){return (G.artifacts||[]).filter(a=>a&&a.кн&&КАНОН_ВЕЩЬ[a.кн]&&safeFn(()=>ART.works(a),false));},
 особ(a,k){const x=КАНОН_ВЕЩЬ[a.кн];if(!x)return null;const o=x.особ.find(s=>s.split(":")[0]===k);return o?(o.split(":").slice(1).join(":")||"1"):null;},
 есть(k){return this.мои().some(a=>this.особ(a,k)!=null);},
 кто(k){const a=this.мои().find(a=>this.особ(a,k)!=null);return a?a.имя:"Вещь";},
 доля(k){let v=0;for(const a of this.мои()){const o=this.особ(a,k);if(o!=null)v+=Number(o)||0;}return v;},
 школа(sid){let v=0;for(const a of this.мои())for(const o of КАНОН_ВЕЩЬ[a.кн].особ){const p=o.split(":");if(p[0]==="школа"&&p[1]===sid)v+=Number(p[2])||0;}return v;},
 ст(){const s=Канон.ст();if(!s.вещи||typeof s.вещи!=="object")s.вещи={};return s.вещи;},
 /* часовые дела вещей: укрытие на привале, лечение, свет, закалка, шов, разум; раз в сутки — весть, починка, звери */
 час(){if(G.inCombat||!this.мои().length)return;const now=Math.floor((Number(G.day)||1)*24+(Number(G.hour)||0));const s=this.ст();if(s.час===now)return;
  const было=Number(s.час)||now;s.час=now;const часов=Math.max(0,Math.min(6,now-было));if(!часов)return;
  const поз=(G.place?"p":"w")+G.x+","+G.y;const стоял=s.поз===поз;s.поз=поз;const t=[];
  if(стоял&&this.есть("убежище"))safeFn(()=>buffSet("кн_убежище",2));
  const л=this.доля("лечит_час");if(л>0&&G.hp<G.hpMax)G.hp=Math.min(G.hpMax,G.hp+л*часов);
  if(this.есть("свет"))safeFn(()=>buffSet("свет",2));if(this.есть("закалка"))safeFn(()=>buffSet("кн_закалка",2));
  if(this.есть("наследие"))safeFn(()=>buffSet("кн_наследие",2));if(this.есть("разум"))safeFn(()=>buffSet("кн_разум",2));
  if(G.dark&&this.есть("шов"))safeFn(()=>buffSet("кн_шов",2));
  if(s.день!==G.day){s.день=G.day;s.бегство=0;s.переиграть=0;s.манаЗапас=0;s.манаДень=0;s.заряды=5;
   if(this.есть("весть")){const n={key:"вещь_"+G.day,x:G.x,y:G.y,prof:"Трактирщик",name:this.кто("весть")};const L=safeFn(()=>Молва170._слухи(n,Number(G.day)||1),[])||[];
    if(L[0]){safeFn(()=>Молва170.запомнить(L[0]));t.push(`${this.кто("весть")}: свежий слух — ${L[0].текст}`);}}
   if(this.есть("починка")){const r=safeFn(()=>Канон.починить(),null);if(r)t.push(`${this.кто("починка")}:${r}`);}
   if(this.есть("питомцы"))for(const a of Zver.pets()){a.верн=Math.min(100,(Number(a.верн)||0)+5);safeFn(()=>Zver.cure(a,Zver.hpMax(a)*0.3));}
   if(this.есть("лечение_питомца")&&Zver.pets().length){for(const a of Zver.pets())safeFn(()=>{a.ранен=false;Zver.cure(a,Zver.hpMax(a));});t.push(`${this.кто("лечение_питомца")}: звери-спутники здоровы.`);}}
  if(t.length)safeFn(()=>narrate(t.join(" "),{interrupt:false}));}};
const КанонДары={
 есть(k,где){return КанонЗвери.есть(k,где)||(!где&&КанонВещи.есть(k));},
 кто(k){return КанонЗвери.есть(k)?КанонЗвери.кто(k):КанонВещи.кто(k);},
 доля(k){return КанонЗвери.доля(k)+КанонВещи.доля(k);}};
/* описание вещи называет её дело */
safeFn(()=>{const d0=ART.describe.bind(ART);ART.describe=function(a,кратко){const r=d0(a,кратко);const x=a&&a.кн&&КАНОН_ВЕЩЬ[a.кн];
 return x&&x.дело?`${r} Дело: ${x.дело}.`:r;};});
/* чары своей школы сильнее */
КанонЦепь.шаг("spellK",function(sp,k){const v=КанонВещи.школа(sp&&sp.school);if(v)k*=1+v;return k;});
/* путь: тишина ночью и в лесу, добыча с промысла */
safeFn(()=>{const mg=mountGift;mountGift=function(k){let v=mg(k);
 try{if(k==="скрытность"){let доп=0;if(КанонВещи.есть("тишина_ночь")&&safeFn(()=>isNight(),false))доп+=0.25;
   if(КанонВещи.есть("скрытность_лес")&&(КанонЗвери.пора("лес")||КанонЗвери.пора("болото")))доп+=0.3;if(доп)return Math.min(0.8,(Number(v)||0)+доп);}
  if(k==="добыча"){const д=КанонВещи.мои().filter(a=>КанонВещи.особ(a,"добыча")!=null).length;if(д)return Math.round((Number(v)||0)+д);}}catch(_){}
 return v;};});
/* встречи: люди и звери реже, если вещь велит */
КанонЦепь.шаг("beastAt",function(m,x,y,c,доля){if(!m)return m;
 try{const сем=String(safeFn(()=>foeFamily(m),"")||"");if(КанонВещи.есть("люди_мимо")&&сем==="humanoid"&&Math.random()<0.5)return null;
  if(КанонВещи.есть("звери_мирны")&&сем==="beast"&&Math.random()<0.4)return null;}catch(_){}return m;});
safeFn(()=>{const a0=Hv.add.bind(Hv);Hv.add=function(id,stage,from,silent){if(id==="disease"&&КанонВещи.есть("без_мора"))return "";return a0(id,stage,from,silent);};});
/* бегство: раз в сутки — наверняка */
safeFn(()=>{const f0=Morpho.fleeK.bind(Morpho);Morpho.fleeK=function(m){let k=Number(f0(m))||0;if(КанонВещи.есть("бегство_раз")&&!КанонВещи.ст().бегство)k+=2;return k;};});
safeFn(()=>{const o0=Director.onFlee.bind(Director);Director.onFlee=function(m){const r=o0(m);safeFn(()=>{if(КанонВещи.есть("бегство_раз")&&!КанонВещи.ст().бегство){КанонВещи.ст().бегство=1;
  narrate(`${КанонВещи.кто("бегство_раз")} унесла вас из боя.`,{interrupt:false});}});return r;};});
/* удар героя: против нечисти и слияния, полнолуние, счёт побед */
КанонЦепь.шаг("onHit",function(m,d,dmg){
 try{if(!(d>0)||!КанонВещи.мои().length)return d;const сем=String(safeFn(()=>foeFamily(m),"")||"");
  if(КанонВещи.есть("против_нечисти")&&/undead|spirit|fiend|bone/.test(сем))d=Math.round(d*1.33);
  if(КанонВещи.есть("против_слияния")&&m&&m.кн&&String(m.пакет||"")==="17")d=Math.round(d*1.33);
  if(КанонВещи.есть("полнолуние_сила")&&КанонЗвери.полнолуние())d=Math.round(d*1.2);
  if(КанонВещи.есть("урон_за_победы"))d+=Math.min(15,Math.floor((Number(КанонВещи.ст().побед)||0)/50));}catch(_){}
 return d;});
/* удар твари: заряды, переигрыш, испуг побеждённых, раны, хрупкость, чары твари, мана из запаса */
КанонЦепь.шаг("onStrike",function(m,d,mdmg){
 try{const cb=G.combat;if(!cb||!(d>0)||!КанонВещи.мои().length)return d;const s=КанонВещи.ст();const лог=t=>safeFn(()=>cbLog(t));const сем=String(safeFn(()=>foeFamily(m),"")||"");
  if(КанонВещи.есть("щит_заряды")){if(s.заряды==null)s.заряды=5;if(s.заряды>0){s.заряды--;лог(`${КанонВещи.кто("щит_заряды")}: заряд гасит удар, осталось ${s.заряды}.`);return 0;}}
  if(КанонВещи.есть("отражение")&&/spirit|fiend|dragon/.test(сем)&&Math.random()<0.1){лог(`${КанонВещи.кто("отражение")} гасит чары твари.`);return 0;}
  if(КанонВещи.есть("испуг_побеждённых")&&m&&(Number((s.побеждено||{})[m.id])||0)>0)d=Math.max(1,Math.round(d*0.85));
  if(КанонВещи.есть("хрупкий"))d=Math.round(d*1.1);
  if(КанонВещи.есть("стойк_за_раны")){if(d>=(Number(G.hpMax)||100)*0.25)s.раны=(Number(s.раны)||0)+1;d=Math.max(1,d-Math.min(6,Math.floor((Number(s.раны)||0)/10)));}
  if(d>=G.hp&&КанонВещи.есть("переиграть")&&!s.переиграть){s.переиграть=1;d=Math.max(0,G.hp-1);лог(`${КанонВещи.кто("переиграть")}: смертельный удар прошёл вскользь.`);}
  const мало=(Number(G.mana)||0)<(Number(G.manaMax)||10)*0.2;
  if(мало&&КанонВещи.есть("мана_раз")&&(Number(G.day)||1)>=(Number(s.манаРаз)||0)+3){s.манаРаз=Number(G.day)||1;G.mana=G.manaMax;лог(`${КанонВещи.кто("мана_раз")}: мана вернулась вся.`);}
  else if(мало&&КанонВещи.есть("мана_запас")&&!s.манаЗапас){s.манаЗапас=1;G.mana=Math.min(G.manaMax,(Number(G.mana)||0)+КанонВещи.доля("мана_запас"));лог(`${КанонВещи.кто("мана_запас")} отдаёт запас маны.`);}
  else if(мало&&КанонВещи.есть("мана_день")&&!s.манаДень){s.манаДень=1;G.mana=Math.min(G.manaMax,(Number(G.mana)||0)+КанонВещи.доля("мана_день"));лог(`${КанонВещи.кто("мана_день")}: сила рода — мана прибыла.`);}}catch(_){}
 return d;});
/* победа: счёт павших (мана навсегда, копильник), побеждённые, вещь канона с хозяина места */
КанонЦепь.шаг("victory",function(m,cb,r){
 try{if(!m)return r;const s=КанонВещи.ст();const t=[];s.побед=(Number(s.побед)||0)+1;if(!s.побеждено||typeof s.побеждено!=="object")s.побеждено={};
  if(m.id){s.побеждено[m.id]=(Number(s.побеждено[m.id])||0)+1;const ks=Object.keys(s.побеждено);if(ks.length>400)delete s.побеждено[ks[0]];}
  if(КанонВещи.есть("мана_за_павших")){s.павших=(Number(s.павших)||0)+1;if(s.павших%10===0&&(Number(s.маныДоб)||0)<20){s.маныДоб=(Number(s.маныДоб)||0)+1;G.manaMax=(Number(G.manaMax)||0)+1;t.push(`${КанонВещи.кто("мана_за_павших")}: мана навсегда +1.`);}}
  if(КанонВещи.есть("копильник")){s.копил=(Number(s.копил)||0)+1;if(s.копил>=20){s.копил=0;G.mana=G.manaMax;t.push(`${КанонВещи.кто("копильник")} полон: мана вся.`);}}
  if(m.кн){const держ=КанонТвари.есть(m,"держатель");if(Math.random()<(держ?0.25:0.015)){const свои=КАНОН_ВЕЩИ.filter(x=>!КанонВещи.есть_у(x.id)&&(!m.пакет||x.пакет===m.пакет));
    const из=свои.length?свои:КАНОН_ВЕЩИ.filter(x=>!КанонВещи.есть_у(x.id));if(из.length){const x=из[Math.floor(Math.random()*из.length)];const a=КанонВещи.дать(x.id,m.n);
     if(a)t.push(`С твари — вещь из преданий: ${a.имя}. ${x.о}.${safeFn(()=>ART.works(a),true)?"":" Пока не слушается: ей нужен опыт посильнее."}`);}}}
  if(t.length)setTimeout(()=>safeFn(()=>narrate(t.join(" "),{interrupt:false})),2200);}catch(_){}
 return r;});

/* ── 12. Края канона ──
   Каждый из 17 пакетов канона — край: земля со своими поселениями, зданиями, объектами, подземельями,
   народами, богами, ресурсами, зверями и людьми. Край открывается постепенно — как новая земля Режиссёра
   (Neuro.newLand), а если Режиссёр молчит, раз в четыре дня сам; сперва тихие края, потом опасные.
   В поселении края «Действие здесь» открывает его: люди учат умениям и чарам, торгуют вещами края,
   приносят вести, дают дела; здания и объекты помогают раз в сутки; в святилище — дар богу края.
   Умения канона — постоянные: прибавки к характеристикам и своё дело в общих обработчиках. */
const КАНОН_КРАЯ=KN.world||[];const КАНОН_КРАЙ=Object.fromEntries(КАНОН_КРАЯ.map(k=>[k.id,k]));
const КАНОН_УМЕНИЯ=KN.skills||[];const КАНОН_УМЕНИЕ=Object.fromEntries(КАНОН_УМЕНИЯ.map(u=>[u.id,u]));
const КАНОН_ЛЮДИ={};for(const k of КАНОН_КРАЯ)for(const c of k.люди)КАНОН_ЛЮДИ[c.id]=Object.assign({край:k.id},c);
const КанонУмения={
 мои(){const s=Канон.ст();if(!Array.isArray(s.умения))s.умения=[];return s.умения.map(id=>КАНОН_УМЕНИЕ[id]).filter(Boolean);},
 есть_у(id){return this.мои().some(u=>u.id===id);},
 особ(u,k){const o=u.особ.find(s=>s.split(":")[0]===k);return o?(o.split(":").slice(1).join(":")||"1"):null;},
 есть(k){return this.мои().some(u=>this.особ(u,k)!=null);},
 кто(k){const u=this.мои().find(u=>this.особ(u,k)!=null);return u?`Умение «${u.имя}»`:"Умение";},
 доля(k){let v=0;for(const u of this.мои()){const o=this.особ(u,k);if(o!=null)v+=Number(o)||0;}return v;},
 школа(sid){let v=0;for(const u of this.мои())for(const o of u.особ){const p=o.split(":");if(p[0]==="школа"&&p[1]===sid)v+=Number(p[2])||0;}return v;},
 стат(k){let v=0;for(const u of this.мои())v+=Number((u.стат||{})[k])||0;if(k==="удача"){const s=Канон.ст();if(this.есть("удача_после_смерти")&&Number(s.удачаДо)>=(Number(G.day)||1))v+=0.05;}return v;},
 /* с какого уровня и за сколько учит: умения края — по порядку у наставника, каждое следующее позже */
 условие(c,id){const i=Math.max(0,(c.учит||[]).indexOf(id));const ур=3+i*4+Math.max(0,(КАНОН_КРАЙ[c.край]||{}).опасность-1)*2;return {ур,цена:50+ур*25};},
 учить(cid,id){const c=КАНОН_ЛЮДИ[cid],u=КАНОН_УМЕНИЕ[id];if(!c||!u)return "Такого учения нет.";if(this.есть_у(id))return `«${u.имя}» вы уже знаете.`;
  const {ур,цена}=this.условие(c,id);if((Number(G.level)||1)<ур)return `${c.имя}: «Рано тебе, приходи, как наберёшься опыта» — нужен ${ур}-й уровень.`;
  if((Number(G.gold)||0)<цена)return `${c.имя} учит «${u.имя}» за ${цена} золота, у вас ${G.gold}.`;
  G.gold-=цена;Канон.ст().умения.push(id);safeFn(()=>Lore.add("recipe",`kn_skill:${u.id}`,`умение «${u.имя}»`,c.имя));safeFn(()=>journal(`Умение канона: ${u.имя} (учил${/а$|я$/.test(c.имя.split(" ")[0])?"а":""} ${c.имя}).`));
  Канон.звук("arte_page",{gain:0.5});return `${c.имя} учит вас: «${u.имя}». ${u.о}. Дело: ${u.дело}.`;},
 /* часовые и суточные дела умений */
 час(){if(G.inCombat||!this.мои().length)return;const s=Канон.ст();if(!s.ум||typeof s.ум!=="object")s.ум={};const st=s.ум;const now=Math.floor((Number(G.day)||1)*24+(Number(G.hour)||0));
  if(st.час===now)return;const было=Number(st.час)||now;st.час=now;const часов=Math.max(0,Math.min(6,now-было));if(!часов)return;const t=[];
  const поз=(G.place?"p":"w")+G.x+","+G.y;const стоял=st.поз===поз;st.поз=поз;
  if(стоял&&this.есть("убежище"))safeFn(()=>buffSet("кн_убежище",2));if(this.есть("наследие"))safeFn(()=>buffSet("кн_наследие",2));
  if(this.есть("разум"))safeFn(()=>buffSet("кн_разум",2));if(G.dark&&this.есть("шов"))safeFn(()=>buffSet("кн_шов",2));
  if(this.есть("травы")&&!G.place&&(КанонЗвери.пора("лес")||КанонЗвери.пора("степь"))&&Math.random()<0.15*часов){const р=["трава","ягоды","грибы"][Math.floor(Math.random()*3)];G.inv[р]=(Number(G.inv[р])||0)+1;t.push(`Травяная память: под ногами — ${р}, подобрано.`);}
  if(st.день!==G.day){st.день=G.day;
   if(this.есть("весть")){const n={key:"умение_"+G.day,x:G.x,y:G.y,prof:"Странник",name:"слух"};const L=safeFn(()=>Молва170._слухи(n,Number(G.day)||1),[])||[];
    if(L[0]){safeFn(()=>Молва170.запомнить(L[0]));t.push(`Слух дня: ${L[0].текст}`);}}
   if(this.есть("мёд")){const k=safeFn(()=>ZV_FOOD["мёд"],"мёд")||"мёд";G.inv[k]=(Number(G.inv[k])||0)+1;t.push("Борть дала мёд.");}
   if(this.есть("монета")){const з=5+Math.round((Number(G.level)||1)*1.5);G.gold=(Number(G.gold)||0)+з;t.push(`Жалованье рода: ${з} золота.`);}}
  if(t.length)safeFn(()=>narrate(t.join(" "),{interrupt:false}));}};
/* умения — в общий помощник даров (звери, вещи, умения) */
КанонДары.есть=function(k,где){return КанонЗвери.есть(k,где)||(!где&&(КанонВещи.есть(k)||КанонУмения.есть(k)));};
КанонДары.кто=function(k){return КанонЗвери.есть(k)?КанонЗвери.кто(k):КанонВещи.есть(k)?КанонВещи.кто(k):КанонУмения.кто(k);};
КанонДары.доля=function(k){return КанонЗвери.доля(k)+КанонВещи.доля(k)+КанонУмения.доля(k);};
/* прибавки умений — в единый счёт характеристик */
safeFn(()=>{const s0=ART.sum.bind(ART);ART.sum=function(stat){let v=s0(stat);const d=КанонУмения.стат(stat);if(d){v+=d;const st=ART_STAT_BY_ID[stat];if(st)v=Math.max(-st.предел,Math.min(st.предел,v));
  v=st&&st.ед==="доля"?Math.round(v*1000)/1000:Math.round(v);}return v;};});
КанонЦепь.шаг("spellK",function(sp,k){const v=КанонУмения.школа(sp&&sp.school);if(v)k*=1+v;return k;});
safeFn(()=>{const x0=Zver.xp.bind(Zver);Zver.xp=function(a,n){if(КанонУмения.есть("питомцы_опыт"))n=Math.round((Number(n)||0)*1.25);return x0(a,n);};});
/* умения в бою: отчаяние, палуба, камень; одиночка; переигрыш и раны — как у вещей */
КанонЦепь.шаг("onHit",function(m,d,dmg){
 try{if(!(d>0)||!КанонУмения.мои().length)return d;const сем=String(safeFn(()=>foeFamily(m),"")||"");
  if(КанонУмения.есть("отчаяние")&&G.hp<G.hpMax/3)d=Math.round(d*1.25);if(КанонУмения.есть("палуба")&&G.ship)d=Math.round(d*1.15);
  if(КанонУмения.есть("против_камня")&&/construct|giant/.test(сем))d=Math.round(d*1.33);
  if(КанонУмения.есть("полнолуние_сила")&&КанонЗвери.полнолуние())d=Math.round(d*1.2);}catch(_){}return d;});
КанонЦепь.шаг("onStrike",function(m,d,mdmg){
 try{if(!(d>0)||!КанонУмения.мои().length)return d;const s=Канон.ст();if(!s.ум||typeof s.ум!=="object")s.ум={};const st=s.ум;const лог=t=>safeFn(()=>cbLog(t));
  if(КанонУмения.есть("одиночка")&&!Zver.pets().length)d=Math.max(1,Math.round(d*0.9));
  if(КанонУмения.есть("испуг_побеждённых")&&m&&(Number(((КанонВещи.ст().побеждено)||{})[m.id])||0)>0)d=Math.max(1,Math.round(d*0.85));
  if(КанонУмения.есть("стойк_за_раны")){if(d>=(Number(G.hpMax)||100)*0.25)st.раны=(Number(st.раны)||0)+1;d=Math.max(1,d-Math.min(6,Math.floor((Number(st.раны)||0)/10)));}
  if(d>=G.hp&&КанонУмения.есть("переиграть")&&st.переиграть!==G.day){st.переиграть=G.day;d=Math.max(0,G.hp-1);лог(`${КанонУмения.кто("переиграть")}: смертельный удар прошёл вскользь.`);}}catch(_){}
 return d;});
/* победа: новизна (первая победа над видом — опыт вдвое), мана за павших, дела людей края */
КанонЦепь.шаг("victory",{до:function(m,cb){return m?(Number(((КанонВещи.ст().побеждено)||{})[m.id])||0):1;},после:function(m,cb,r,было){
 try{if(!m)return r;const t=[];
  if(КанонУмения.есть("новизна")&&было===0){const x=Math.max(1,Math.round(Number(m.xp)||((Number(m.lvl)||1)*4)));G.xp=(Number(G.xp)||0)+x;t.push(`Первопроход: новый вид — ещё ${x} опыта.`);safeFn(()=>checkLevelUp&&checkLevelUp());}
  if(КанонУмения.есть("мана_за_павших")){const s=Канон.ст();if(!s.ум)s.ум={};s.ум.павших=(Number(s.ум.павших)||0)+1;if(s.ум.павших%10===0&&(Number(s.ум.маныДоб)||0)<20){s.ум.маныДоб=(Number(s.ум.маныДоб)||0)+1;G.manaMax=(Number(G.manaMax)||0)+1;t.push("Жилы силы: мана навсегда +1.");}}
  const д=Канон.ст().дела||{};for(const [cid,z] of Object.entries(д))if(z&&!z.сделано&&z.тварь===m.id){z.сделано=1;const c=КАНОН_ЛЮДИ[cid];t.push(`Дело исполнено: ${z.n} повержен${/а$/.test(z.n.split(" ")[0])?"а":""}. Вернитесь к ${c?c.имя:"заказчику"} за наградой.`);}
  if(t.length)setTimeout(()=>safeFn(()=>narrate(t.join(" "),{interrupt:false})),2600);}catch(_){}return r;}});
safeFn(()=>{const d0=defeat;defeat=function(){const r=d0.apply(this,arguments);try{if(КанонУмения.есть("удача_после_смерти"))Канон.ст().удачаДо=(Number(G.day)||1)+1;}catch(_){}return r;};});
/* ── открытие края ── */
const КанонКрай={
 ст(){const s=Канон.ст();if(!s.края||typeof s.края!=="object")s.края={открыто:[],день:0};if(!Array.isArray(s.края.открыто))s.края.открыто=[];return s.края;},
 следующий(){const о=new Set(this.ст().открыто);const lvl=Number(G.level)||1;
  const L=КАНОН_КРАЯ.filter(k=>!о.has(k.id)).sort((a,b)=>a.опасность-b.опасность||(a.пакет<b.пакет?-1:1));
  return L.find(k=>k.опасность<=2+Math.floor(lvl/8))||null;},
 /* земля, её поселения (места Режиссёра), народы, боги, ресурсы, звери */
 открыть(k,R){if(!k)return "";R=R||Math.random;const g=Neuro.gen();
  const ang=R()*Math.PI*2,d=30+Math.round(R()*50);const x=Math.round((Number(G.x)||0)+Math.cos(ang)*d),y=Math.round((Number(G.y)||0)+Math.sin(ang)*d);
  const land={id:"gl_"+(g.n++),n:k.имя,terr:k.terr,x,y,r:10,fam:k.fam,опасность:k.опасность,день:Number(G.day)||1,res:null,кн:k.id};g.lands.push(land);
  const people=this.наполнить(k,land,R,ang);const гео=safeFn(()=>КанонГео.разместить(k,land,R),[])||[];
  const s=this.ст();s.открыто.push(k.id);s.день=Number(G.day)||1;safeFn(()=>Neuro.chron(`открылся край — ${k.имя}`));
  safeFn(()=>Lore.add("map",`kn_land:${k.id}`,k.имя,"край открылся"));safeFn(()=>journal(`Открылся край: ${k.имя}.`));Канон.звук("sv_god_omen",{gain:0.45});
  const где=safeFn(()=>Director.where(x-G.x,y-G.y),"")||"вдали";
  return `Открылся край — ${k.имя}, ${где}, около ${d} шагов: ${k.о.charAt(0).toLowerCase()+k.о.slice(1)}. Там ${k.поселения.map(p=>p.имя).join(" и ")}${people.length?`; живут ${people.map(p=>"«"+p.n+"»").join(", ")}`:""}${k.боги.length?`; молятся ${k.боги.map(b=>b.имя).join(" и ")}`:""}.${гео.length?` Вокруг — ${гео.map(f=>f.имя).join(", ")}.`:""}`;},
 /* народы, боги, ресурсы, поселения и звери края; что уже есть в мире — не повторяется (так дополняются и старые сохранения) */
 наполнить(k,land,R,ang){const g=Neuro.gen();R=R||Math.random;ang=Number(ang)||0;const x=land.x,y=land.y;
  for(const a of ["places","gods","pets","peoples","res"])if(!Array.isArray(g[a]))g[a]=[];
  const people=[];for(const p of k.народы){let rec=g.peoples.find(q=>q.кн===p.id);
   if(!rec){rec={id:"gn_"+(g.n++),kind:"people",n:p.имя,ethos:safeFn(()=>NEURO_ETHOS_IDS[0],"trade"),тяга:[],вождь:"",земля:land.id,род:null,держава:null,реп:0,день:Number(G.day)||1,кн:p.id};
    safeFn(()=>{rec.тяга=NEURO_ETHOS[rec.ethos].тяга.slice();});g.peoples.push(rec);}people.push(rec);}
  for(const b of k.боги){if(g.gods.some(q=>q.кн===b.id))continue;g.gods.push({id:"gg_"+(g.n++),n:b.имя,дар:MIX_BUFF_WORD[b.дар]?b.дар:"удача",нрав:"древний",культ:people[0]?people[0].id:null,вера:0,день:Number(G.day)||1,кн:b.id});}
  for(const r of k.ресурсы){if(g.res.some(q=>q.n===r.имя))continue;const rec={id:"gr_"+(g.n++),n:r.имя,ниши:r.ниши.slice(),цена:r.цена,земля:land.id,кто:k.имя,где:"в землях «"+k.имя+"»",x,y,день:Number(G.day)||1,кн:r.id};
   g.res.push(rec);safeFn(()=>Neuro.regRes(rec));if(!land.res)land.res=r.имя;}
  k.поселения.forEach((p,i)=>{if(g.places.some(q=>q.кн===p.id))return;const a=ang+Math.PI*(0.3+0.9*i),dd=3+Math.round(R()*5);
   g.places.push({id:"gc_"+(g.n++),kind:NEURO_PLACE[p.kind]?p.kind:"деревня",n:p.имя,x:x+Math.round(Math.cos(a)*dd),y:y+Math.round(Math.sin(a)*dd),r:2,народ:people[i%Math.max(1,people.length)]?people[i%people.length].id:null,день:Number(G.day)||1,кн:p.id,кнКрай:k.id});});
  for(const z of k.звери){if(g.pets.some(q=>q.кн===z.id))continue;const b=ZV_BREED_BY_ID[z.fam+"_wild"];if(!b)continue;g.pets.push({id:"gz_"+(g.n++),n:`${z.имя} — ${b.n.toLowerCase()}`,имя:z.имя,breed:b.id,mount:!!ZV_FAMILY_BY_ID[z.fam].ездовой,
   lvl:1+Math.floor((Number(G.level)||1)/4),цена:(ZV_FAMILY_BY_ID[z.fam].ездовой?160:80)+Math.round(R()*60),кто:k.поселения[0]?k.поселения[0].имя:k.имя,p:people[0]?people[0].id:null,x,y,где:"в землях «"+k.имя+"»",день:Number(G.day)||1,кн:z.id});}
  return people;},
 /* где мы: край по земле Режиссёра с меткой канона */
 здесь(x,y){const g=G.gen;if(!g||!Array.isArray(g.lands))return null;const l=g.lands.find(l=>l.кн&&Math.abs(l.x-x)+Math.abs(l.y-y)<=l.r);return l?КАНОН_КРАЙ[l.кн]:null;},
 место(){const p=safeFn(()=>Neuro.placeHere(),null);if(!p||!p.кн)return null;const k=КАНОН_КРАЙ[p.кнКрай];if(!k)return null;const s=k.поселения.find(x=>x.id===p.кн);return s?{p,k,s}:null;},
 день(){if(G.inCombat)return;safeFn(()=>КанонГео.доразместить());const s=this.ст();const d=Number(G.day)||1;if(!s.день)s.день=d;if(d-s.день<4)return;const k=this.следующий();if(!k)return;
  const t=this.открыть(k);if(t)safeFn(()=>narrate(t,{interrupt:false}));}};
/* Режиссёр: новая земля — край канона, пока они не кончатся */
safeFn(()=>{const l0=Neuro.newLand.bind(Neuro);Neuro.newLand=function(id,R){const k=КанонКрай.следующий();if(k)return КанонКрай.открыть(k,R);return l0(id,R);};});
/* края говорят о себе: где водятся их твари, какие подземелья у них */
Object.assign(Канон,{
 край(x,y){const k=КанонКрай.здесь(x,y);return k?{твари:k.твари,имя:k.имя}:null;},
 подземелье(p){if(!p)return null;const k=КанонКрай.здесь(Number(p.bx)||G.x,Number(p.by)||G.y);if(!k||!k.подземелья.length)return null;
  const d=k.подземелья[Math.floor(hashName(Number(p.bx)||0,Number(p.by)||0,18401)*k.подземелья.length)%k.подземелья.length];
  const s=Канон.ст();if(!s.подз||typeof s.подз!=="object")s.подз={};const ключ=(p.bx|0)+","+(p.by|0);
  if(!s.подз[ключ]){s.подз[ключ]=d.id;setTimeout(()=>safeFn(()=>narrate(`${d.имя}: ${d.о.charAt(0).toLowerCase()+d.о.slice(1)}.${d.ловушка?` Говорят, здесь ловушки: ${d.ловушка}.`:""}`,{interrupt:false})),1500);}
  return {твари:d.твари.length?d.твари:k.твари,имя:d.имя};}});
/* прибытие в поселение края: слово о нём и кто здесь */
safeFn(()=>{const p0=Neuro.placeStep.bind(Neuro);Neuro.placeStep=function(){const st=Neuro.st();const было=st.inPlace;const r=p0();
 try{const м=КанонКрай.место();if(м&&было!==м.p.id){setTimeout(()=>safeFn(()=>narrate(`${м.s.о}. ${м.k.люди.length?`Здесь: ${м.k.люди.slice(0,4).map(c=>c.имя).join(", ")}.`:""} «Действие здесь» — войти.`,{interrupt:false})),900);}}catch(_){}
 safeFn(()=>КанонГео.шаг());return r;};});
/* «Действие здесь» в поселении края — его окно */
safeFn(()=>{const u0=useHere;useHere=function(){const м=!G.inCombat&&!G.place&&!G.ship?КанонКрай.место():null;if(м){КанонМесто.окно(м);return true;}
 const гео=!G.inCombat&&!G.place&&!G.ship&&КанонГео.свободно()?КанонГео.здесь():null;if(гео){КанонГео.окно(гео);return true;}return u0.apply(this,arguments);};});
const КанонМесто={
 цена(x){return Math.max(30,Math.round(safeFn(()=>ART.price(КанонВещи.сделать(x.id)),100)*1.2));},
 окно(м){const {k,s}=м;const ч=[];
  for(const c of k.люди)ч.push({l:`Поговорить: ${c.имя}, ${c.роль}`,run:()=>this.человек(c.id)});
  for(const b of k.здания)ч.push({l:`Зайти: ${b.имя}`,run:()=>this.помощь(b,"здание")});
  for(const o of k.объекты.slice(0,6))ч.push({l:`Осмотреть: ${o.имя}`,run:()=>this.помощь(o,"объект")});
  for(const b of k.боги){const g=(Neuro.gen().gods||[]).find(x=>x.кн===b.id);if(g)ч.push({l:`Помолиться: ${b.имя}`,run:()=>{const t=safeFn(()=>Neuro.offer(g.id),"");narrate(`${b.о}.${b.запрет?` Завет: не ${b.запрет}.`:""} ${t}`,{interrupt:true});}});}
  for(const q of (s.кварталы||[]))ч.push({l:`Квартал: ${q.имя} — ${q.о}`,run:()=>this.помощь(q,"квартал")});
  if(s.кварталы)for(const p of k.народы.filter(p=>p.канон2))ч.push({l:`${p.раса?"Раса":"Народ"}: ${p.имя}`,run:()=>this.народ(p,k)});
  ч.push({l:"Уйти",run:()=>{}});
  выбор147(s.имя,`${s.о}. Край — ${k.имя}.${s.правитель?` Правит ${s.правитель}.`:""} ${s.товар?`Здесь в ходу: ${s.товар}${s.нужда?`; нужда — ${s.нужда}`:""}.`:""}`,ч);},
 /* народ или раса края II: слово о них, знакомство — знание; раз в сутки их дар */
 народ(p,k){const s=Канон.ст();if(!s.народы2||typeof s.народы2!=="object")s.народы2={};const перв=!s.народы2[p.id];s.народы2[p.id]=Number(G.day)||1;
  if(перв)safeFn(()=>p.раса?Lore.add("tongue",`kn2:${p.id}`,`${p.язык||"говор"} — ${p.имя}`,k.имя):Lore.add("rite",`kn2:${p.id}`,`обычаи: ${p.имя}`,k.имя));
  const t=[`${p.имя}: ${p.о.charAt(0).toLowerCase()+p.о.slice(1)}.`];if(p.облик)t.push(`Облик: ${p.облик}.`);if(p.язык)t.push(`Говорят: ${p.язык}.`);if(p.дар)t.push(`Их дар: ${p.дар}.`);
  if(p.эф&&КанонМесто.ЭФ[p.эф]){const ключ="нд_"+p.id+":"+G.day;if(!s.помощь||typeof s.помощь!=="object")s.помощь={};if(!s.помощь[ключ]){s.помощь[ключ]=1;t.push(КанонМесто.ЭФ[p.эф]());}}
  Канон.звук(p.звукО||"hall_market",{kind:"world",gain:0.4,maxSec:3});narrate(t.join(" "),{interrupt:true});},
 человек(cid){const c=КАНОН_ЛЮДИ[cid];if(!c)return;const ч=[];const s=Канон.ст();
  for(const id of c.учит){const u=КАНОН_УМЕНИЕ[id];if(!u)continue;const {ур,цена}=КанонУмения.условие(c,id);
   ч.push({l:КанонУмения.есть_у(id)?`Умение «${u.имя}» — уже знаете`:`Учиться: «${u.имя}» — ${цена} золота, с ${ур}-го уровня. ${u.дело}`,run:()=>{narrate(КанонУмения.учить(cid,id),{interrupt:true});safeFn(()=>saveGame(true));}});}
  for(const n of c.чары){const sp=safeFn(()=>КанонЧары.по(n),null)||(SPELLS||[]).find(x=>x.n===n);if(!sp)continue;const знаю=(G.spells||[]).indexOf(n)>=0;
   ч.push({l:знаю?`Чары «${n}» — уже знаете`:`Учиться чарам: «${n}» — ${safeFn(()=>КанонЧары.цена(sp),sp.золото||100)} золота`,run:()=>{narrate(safeFn(()=>КанонЧары.learn(n,c.имя),"Не вышло."),{interrupt:true});safeFn(()=>saveGame(true));}});}
  for(const id of c.продаёт){const x=КАНОН_ВЕЩЬ[id];if(!x||КанонВещи.есть_у(id))continue;const ц=this.цена(x);
   ч.push({l:`Купить: ${x.имя} — ${ц} золота. ${x.дело||x.о}`,run:()=>{if((Number(G.gold)||0)<ц){narrate(`${x.имя} стоит ${ц} золота, у вас ${G.gold}.`,{interrupt:true});return;}
    G.gold-=ц;const a=КанонВещи.дать(id,c.имя);safeFn(()=>Bank.play("arte_coins",{gain:0.5,maxSec:2}));narrate(a?`${x.имя} теперь ваша. ${safeFn(()=>ART.describe(a,true),"")}`:"Не вышло.",{interrupt:true});safeFn(()=>saveGame(true));}});}
  if(c.весть){if(!s.вести||typeof s.вести!=="object")s.вести={};ч.push({l:s.вести[cid]===G.day?"Весть — сегодня уже рассказал":"Расспросить о новостях",run:()=>{if(s.вести[cid]===G.day){narrate(`${c.имя}: «Всё, что знал, сказал».`,{interrupt:true});return;}
    s.вести[cid]=G.day;const n={key:"кн_"+cid+"_"+G.day,x:G.x,y:G.y,prof:"Странник",name:c.имя};const L=safeFn(()=>Молва170._слухи(n,Number(G.day)||1),[])||[];
    if(L[0]){safeFn(()=>Молва170.запомнить(L[0]));narrate(`${c.имя}: ${L[0].текст}`,{interrupt:true});}else narrate(`${c.имя}: «Тихо нынче в округе».`,{interrupt:true});}});}
  if(c.дело){if(!s.дела||typeof s.дела!=="object")s.дела={};const z=s.дела[cid];
   if(!z)ч.push({l:`Взять дело: одолеть ${c.дело.n} — награда ${c.дело.награда} золота`,run:()=>{s.дела[cid]=Object.assign({},c.дело,{взято:G.day});safeFn(()=>journal(`Дело от ${c.имя}: одолеть ${c.дело.n}.`));narrate(`${c.имя}: «${c.дело.n} — вот моя беда. Одолей — и награда твоя».`,{interrupt:true});}});
   else if(z.сделано&&!z.сдано)ч.push({l:`Сдать дело: ${z.n} повержен`,run:()=>{z.сдано=1;G.gold=(Number(G.gold)||0)+z.награда;safeFn(()=>Bank.play("arte_coins",{gain:0.6,maxSec:2}));
    const k=КАНОН_КРАЙ[c.край];const из=(KN.items||[]).filter(x=>x.пакет===k.пакет&&!КанонВещи.есть_у(x.id)&&x.ранг<=Math.max(2,Math.floor((Number(G.level)||1)/8)));let доп="";
    if(из.length&&Math.random()<0.5){const x=из[Math.floor(Math.random()*из.length)];const a=КанонВещи.дать(x.id,c.имя);if(a)доп=` И сверх того — ${a.имя}.`;}
    narrate(`${c.имя} платит ${z.награда} золота.${доп}`,{interrupt:true});safeFn(()=>saveGame(true));}});
   else if(!z.сделано)ч.push({l:`Дело: одолеть ${z.n} — ещё не исполнено`,run:()=>narrate(`${c.имя}: «${z.n} всё ещё ходит по нашей земле».`,{interrupt:true})});}
  ч.push({l:"Назад",run:()=>{const м=КанонКрай.место();if(м)this.окно(м);}});
  выбор147(c.имя,`${c.о}. ${c.нрав?`Нрав — ${c.нрав}.`:""}`,ч);},
 /* здание или объект: раз в сутки помогает — по своему делу */
 помощь(o,вид){const s=Канон.ст();if(!s.помощь||typeof s.помощь!=="object")s.помощь={};const ключ=o.id+":"+G.day;
  if(s.помощь[ключ]){narrate(`${o.имя}: ${o.о}. Сегодня здесь уже помогли.`,{interrupt:true});return;}s.помощь[ключ]=1;
  const ks=Object.keys(s.помощь);if(ks.length>120)for(const k of ks.slice(0,ks.length-120))delete s.помощь[k];
  const эф=КанонМесто.ЭФ[o.эф]||КанонМесто.ЭФ.чутьё;const t=эф();Канон.звук(вид==="здание"?"oc_door_open":"oc_soft_touch",{gain:0.45});
  narrate(`${o.имя}: ${o.о}. ${t}`,{interrupt:true});safeFn(()=>Lore.add("map",`kn_place:${o.id}`,o.имя,"осмотрено"));},
 ЭФ:{
  лечение(){const h=Math.round(G.hpMax*0.3);G.hp=Math.min(G.hpMax,G.hp+h);return `Раны затянулись: здоровья +${h}.`;},
  мана(){const v=Math.round((Number(G.manaMax)||10)*0.4);G.mana=Math.min(G.manaMax,(Number(G.mana)||0)+v);return `Сила вернулась: маны +${v}.`;},
  весть(){const n={key:"место_"+G.x+"_"+G.y+"_"+G.day,x:G.x,y:G.y,prof:"Трактирщик",name:"место"};const L=safeFn(()=>Молва170._слухи(n,Number(G.day)||1),[])||[];
   if(L[0]){safeFn(()=>Молва170.запомнить(L[0]));return `Здесь говорят: ${L[0].текст}`;}return "Здесь тихо.";},
  стойкость(){safeFn(()=>buffSet("стойкость",6));return "Шесть часов защита выше.";},оберег(){safeFn(()=>buffSet("оберег",6));return "Шесть часов проклятия и духи бьют вполсилы.";},
  мощь(){safeFn(()=>buffSet("мощь",6));return "Шесть часов удар сильнее.";},тишина(){safeFn(()=>buffSet("тишина шага",6));return "Шесть часов шаг беззвучен.";},
  чутьё(){safeFn(()=>buffSet("чутьё",6));return "Шесть часов слух шире.";},тепло(){safeFn(()=>buffSet("тепло",6));return "Шесть часов стужа не вредит.";},
  клад(){const з=5+Math.round((Number(G.level)||1)*2+Math.random()*10);G.gold=(Number(G.gold)||0)+з;return `Нашлось ${з} золота.`;},
  свет(){safeFn(()=>buffSet("свет",6));return "Шесть часов с вами свет: тьма не гасит его.";},убежище(){safeFn(()=>buffSet("кн_убежище",4));return "Четыре часа здесь укрытие: твари обходят.";},
  разум(){safeFn(()=>buffSet("кн_разум",6));return "Шесть часов страх и морок не входят.";},след(){safeFn(()=>buffSet("кн_след",4));return "Четыре часа погоня собьётся со следа.";}}};
/* часы краёв: открытие нового раз в четыре дня, умения */
safeFn(()=>{const k0=Zver.tick.bind(Zver);Zver.tick=function(){const r=k0();try{КанонКрай.день();КанонУмения.час();}catch(_){}return r;};});

/* чертог, открытый Режиссёром рядом с краем канона, — один из чертогов этого края */
safeFn(()=>{const c0=InstanceDirectorIntegration.createNear.bind(InstanceDirectorIntegration);InstanceDirectorIntegration.createNear=function(why){const c=c0(why);
 try{const k=c&&КанонКрай.здесь(G.x,G.y);if(k&&k.чертоги.length){const s=КанонКрай.ст();if(!Array.isArray(s.чертоги))s.чертоги=[];
   const h=k.чертоги.find(x=>s.чертоги.indexOf(x.id)<0);if(h){s.чертоги.push(h.id);c.n=h.имя;c.кн=h.id;c.о=h.о;
    setTimeout(()=>safeFn(()=>narrate(`${h.имя}: ${h.о.charAt(0).toLowerCase()+h.о.slice(1)}.`,{interrupt:false})),1800);safeFn(()=>Lore.add("map",`kn_hall:${h.id}`,h.имя,"чертог края"));}}}catch(_){}
 return c;};});
/* окно зверя канона: если зверь ходит сквозь камень — кнопка «Пройти сквозь камень» */
safeFn(()=>{const b0=Zver.beastView.bind(Zver);Zver.beastView=function(u){const r=b0(u);
 try{const a=this.byUid(u);if(a&&["сквозь","роет","завал"].some(k=>КанонЗвери.особ(a,k)!=null)){const box=document.getElementById("zvBody");
   if(box&&!box.querySelector('[data-cmd="knpass"]'))box.insertAdjacentHTML("afterbegin",`<button type="button" class="item" data-cmd="knpass" data-speak="Пройти сквозь камень со зверем: раз в сутки">Пройти сквозь камень со зверем</button>`);}}catch(_){}
 return r;};});

/* ── 13. Предания краёв: места природы (Альфа 1.5) ──
   Канон II лёг в те же семнадцать краёв. Вокруг земли края — его озеро, река, горы, море с островами, а под водой —
   подводье со своим хозяином. Подойдёте к месту — слово о нём, и оно идёт в познание мира (грань «земли»).
   «Действие здесь» у места — его окно: испить и окунуться, переправиться, подняться на перевал, выйти к воде,
   сплавать к острову, собрать здешний ресурс, нырнуть. Дар места — раз в сутки (те же дары, что у зданий края).
   У мест свои опасности: холод, обвал, яд, буря, топь, глубина, ветер, туман — от них берегут усиления и вещи.
   Подводье: нужно дыхание (свет, тепло — где глубже и темнее); без него нырок стоит здоровья. Хозяин глубины
   встречает первого гостя; одолеете — клад, ресурс и тайна глубин, а дальше подводье даёт свой дар раз в сутки.
   Города края II — его поселения: в окне города — кварталы с дарами, народы и расы края. */
const КАНОН_ГЕО={};const КАНОН_РЕС={};
for(const k of КАНОН_КРАЯ){for(const f of (k.гео||[]))КАНОН_ГЕО[f.id]=Object.assign({край:k.id},f);for(const r of (k.ресурсы||[]))КАНОН_РЕС[r.id]=r;}
const КанонГео={
 ОПАС:{холод:"холод",обвал:"обвалы",яд:"ядовитые испарения",буря:"бури",топь:"топь",глубина:"глубина",ветер:"сильный ветер",туман:"туман"},
 ДЕЛО:{озеро:"испить и окунуться",река:"переправиться",горы:"подняться на перевал",море:"выйти к воде",архипелаг:"сплавать к островам"},
 ст(){const s=Канон.ст();if(!s.гео||typeof s.гео!=="object"||Array.isArray(s.гео))s.гео={};const g=s.гео;
  if(!Array.isArray(g.места))g.места=[];for(const k of ["был","дар","хозяин","сбор"])if(!g[k]||typeof g[k]!=="object"||Array.isArray(g[k]))g[k]={};return g;},
 /* места природы края — вокруг его земли: ближе озеро и река, дальше горы, ещё дальше море и острова */
 разместить(k,land,R){if(!k||!land||!Array.isArray(k.гео)||!k.гео.length)return [];const g=this.ст();if(g.места.some(m=>m.край===k.id))return [];
  if(!R){let s=((Math.abs(Number(land.x)|0)*73856093)^(Math.abs(Number(land.y)|0)*19349663))%2147483647||7;R=()=>{s=(s*16807)%2147483647;return s/2147483647;};}
  const св=k.гео.filter(f=>f.вид!=="подводье");const out=[];const a0=R()*Math.PI*2;const W=safeFn(()=>WORLD_MAX,1e9)||1e9;
  св.forEach((f,i)=>{const a=a0+i*2*Math.PI/Math.max(1,св.length)+(R()-0.5)*0.4;
   const d=f.вид==="архипелаг"?16+Math.round(R()*3):f.вид==="море"?12+Math.round(R()*3):f.вид==="горы"?8+Math.round(R()*3):4+Math.round(R()*4);
   const r=f.вид==="море"?4:f.вид==="горы"||f.вид==="архипелаг"?3:2;
   const x=Math.max(0,Math.min(W-1,Math.round(Number(land.x)+Math.cos(a)*d))),y=Math.max(0,Math.min(W-1,Math.round(Number(land.y)+Math.sin(a)*d)));
   g.места.push({id:f.id,край:k.id,x,y,r});out.push(f);});
  return out;},
 /* старые сохранения: краю, открытому до преданий, — его места природы, народы, боги, ресурсы и город */
 доразместить(){const g=G.gen;if(!g||!Array.isArray(g.lands))return;const st=this.ст();if(st.сверено===g.lands.length)return;st.сверено=g.lands.length;
  for(const l of g.lands){if(!l||!l.кн)continue;const k=КАНОН_КРАЙ[l.кн];if(!k||st.места.some(m=>m.край===k.id))continue;
   safeFn(()=>КанонКрай.наполнить(k,l,null,0));this.разместить(k,l,null);}},
 здесь(x,y){x=x==null?G.x:x;y=y==null?G.y:y;let best=null,bd=1e9;
  for(const m of this.ст().места){const d=Math.abs(m.x-x)+Math.abs(m.y-y);if(d<=m.r&&d<bd){bd=d;best=m;}}
  if(!best)return null;const f=КАНОН_ГЕО[best.id],k=КАНОН_КРАЙ[best.край];return f&&k?{m:best,f,k}:null;},
 счёт(){return Object.keys(this.ст().был).length;},
 /* «Действие здесь» уходит месту природы, только где нет ни постройки, ни ресурса, ни чертога, ни добычи */
 свободно(){if(G.loot&&Array.isArray(G.loot)&&G.loot.length)return false;if(G.chStair||safeFn(()=>inFlight(),false))return false;
  const c=safeFn(()=>cellContent(G.x,G.y),null);if(!c||c.structure||c.res)return false;return !safeFn(()=>Chertog.here(),null);},
 дарСлово(эф){const t={лечение:"раны затянутся",мана:"сила вернётся",весть:"здешний слух",стойкость:"защита выше",оберег:"оберег от проклятий",мощь:"удар сильнее",
  тишина:"шаг беззвучен",чутьё:"слух шире",тепло:"стужа не вредит",клад:"можно найти золото",свет:"свет во тьме",убежище:"укрытие от тварей",разум:"морок не входит",след:"погоня собьётся со следа"};return t[эф]||"дар места";},
 /* подход к месту: слово о нём, в первый раз — знание */
 шаг(){if(G.inCombat||G.place)return;const h=this.здесь();const g=this.ст();if(!h){g.тут=null;return;}if(g.тут===h.m.id)return;g.тут=h.m.id;
  const {f,k}=h;const перв=!g.был[f.id];
  if(перв){g.был[f.id]=Number(G.day)||1;safeFn(()=>Lore.add("map",`kn2:${f.id}`,f.имя,`край «${k.имя}»`));safeFn(()=>Рост.сброс());
   safeFn(()=>journal(`Место края «${k.имя}»: ${f.имя}.`));if(Рост.ст().удерж>0)safeFn(()=>checkLevelUp());}
  Канон.звук(f.звукО||"amb_water",{kind:"world",gain:0.4,maxSec:4});
  const что=this.ДЕЛО[f.вид]||"осмотреться";
  const t=перв?`${f.имя}: ${f.о.charAt(0).toLowerCase()+f.о.slice(1)}. ${f.механика?mixCap(f.механика)+". ":""}«Действие здесь» — ${что}.`
   :`${f.имя}. «Действие здесь» — ${что}.`;
  setTimeout(()=>safeFn(()=>narrate(t,{interrupt:false})),700);},
 /* опасность места — чем грозит и что бережёт */
 опасность(o){if(!o)return "";const есть=b=>!!safeFn(()=>buffActive(b),false);const ст=k=>Number(safeFn(()=>ART.sum(k),0))||0;
  const рана=p=>{const d=Math.max(1,Math.round((Number(G.hpMax)||100)*p));G.hp=Math.max(1,(Number(G.hp)||1)-d);return d;};
  if(o==="холод")return есть("тепло")||ст("сопр_лёд")>=0.2?" Холод не взял: вы в тепле.":` Холод пробрал до костей: здоровья −${рана(0.08)}.`;
  if(o==="обвал")return КанонДары.есть("закалка")?" Сорвались камни, но закалка уберегла.":Math.random()<0.5?` Сорвался камень: здоровья −${рана(0.1)}.`:" Камни шуршат над головой, но обошлось.";
  if(o==="яд")return ст("сопр_яд")>=0.2?" Ядовитые испарения вам нипочём.":` Ядовитые испарения жгут горло: здоровья −${рана(0.06)}.`;
  if(o==="буря")return есть("стойкость")?" Буря бьёт, но вы стоите.":` Буря сбила с ног: здоровья −${рана(0.06)}.`;
  if(o==="ветер")return есть("лёгкость")||есть("стойкость")?" Ветер рвёт плащ, но вы держитесь.":Math.random()<0.5?` Порыв ветра швырнул о камни: здоровья −${рана(0.05)}.`:" Ветер едва не сбил с ног.";
  if(o==="топь"){if(есть("лёгкость"))return " Лёгкий шаг не вяз в топи.";G.hour=(Number(G.hour)||0)+1;return " Топь держала за ноги: ушёл час.";}
  if(o==="туман"){if(есть("чутьё")||КанонДары.есть("чует_засаду"))return " Туман густой, но слух ведёт верно.";G.hour=(Number(G.hour)||0)+1;return " В тумане плутали час.";}
  return "";},
 /* окно места */
 окно(h){const {f,k}=h;const g=this.ст();const сег=Number(G.day)||1;const ч=[];const сегодня=g.дар[f.id]===сег;
  const дар=сегодня?"сегодня дар уже взят":this.дарСлово(f.эф);
  if(f.вид==="озеро")ч.push({l:`Испить и окунуться — ${дар}`,run:()=>this.дар(f,k)});
  if(f.вид==="река")ч.push({l:`Переправиться ${f.переправа==="брод"?"вброд":f.переправа==="паром"?"на пароме — 3 золота":"по мосту"} — ${дар}`,run:()=>this.дар(f,k)});
  if(f.вид==="горы")ч.push({l:`Подняться${f.перевал?` на ${f.перевал}`:" на перевал"} — ${дар}`,run:()=>this.дар(f,k)});
  if(f.вид==="море")ч.push({l:`Выйти к воде — ${дар}`,run:()=>this.дар(f,k)});
  if(f.вид==="архипелаг")for(const q of f.острова||[])ч.push({l:`Сплавать: ${q.имя} — ${q.о}; ${g.дар[q.id]===сег?"сегодня там уже были":this.дарСлово(q.эф)}${G.ship?"":" (лодка — 5 золота)"}`,run:()=>this.остров(f,q,k)});
  if(f.ресурс&&КАНОН_РЕС[f.ресурс]){const r=КАНОН_РЕС[f.ресурс];ч.push({l:g.сбор[f.id]===сег?`Собрать: ${r.имя} — сегодня уже собрано`:`Собрать: ${r.имя}`,run:()=>this.собрать(f,r,k)});}
  if(f.подводье&&КАНОН_ГЕО[f.подводье]){const d=КАНОН_ГЕО[f.подводье];const хоз=!g.хозяин[d.id]&&d.тварь&&КАНОН_ТВАРЬ[d.тварь];
   ч.push({l:`Нырнуть: ${d.имя} — глубина ${Number(d.глубина)||1}, нужно ${this.нужно(d)}${хоз?`; там хозяин — ${хоз.n}`:""}`,run:()=>this.нырнуть(d,f,k)});}
  if(f.архипелаг&&КАНОН_ГЕО[f.архипелаг])ч.push({l:`Острова: ${КАНОН_ГЕО[f.архипелаг].имя} — ${this.куда(f.архипелаг)}`,run:()=>narrate(`${КАНОН_ГЕО[f.архипелаг].имя}: ${this.куда(f.архипелаг)}.`,{interrupt:true})});
  ч.push({l:"Уйти",run:()=>{}});
  выбор147(f.имя,`${f.о}. Край — ${k.имя}.${f.опасность?` Здесь опасно: ${this.ОПАС[f.опасность]||f.опасность}.`:""}`,ч);},
 куда(id){const m=this.ст().места.find(x=>x.id===id);if(!m)return "далеко";const d=Math.max(Math.abs(m.x-G.x),Math.abs(m.y-G.y));
  return `${safeFn(()=>stepWords(d),d+" шагов")} ${safeFn(()=>dirAtWord(m.x-G.x,m.y-G.y),"")}`.trim();},
 /* дар места: раз в сутки; опасность — всякий раз */
 дар(f,k){const g=this.ст();const сег=Number(G.day)||1;
  if(f.вид==="река"&&f.переправа==="паром"&&!G.ship){if((Number(G.gold)||0)<3){narrate("Паромщик берёт 3 золота, а у вас меньше.",{interrupt:true});return;}G.gold-=3;}
  const оп=this.опасность(f.опасность);
  if(g.дар[f.id]===сег){narrate(`${f.имя}: сегодня место свой дар уже отдало.${оп}`,{interrupt:true});return;}
  g.дар[f.id]=сег;const t=(КанонМесто.ЭФ[f.эф]||КанонМесто.ЭФ.чутьё)();
  Канон.звук(f.звукО||"amb_water",{kind:"world",gain:0.5,maxSec:4});
  narrate(`${f.имя}: ${t}${оп}`,{interrupt:true});safeFn(()=>saveGame(true));},
 остров(f,q,k){const g=this.ст();const сег=Number(G.day)||1;
  if(g.дар[q.id]===сег){narrate(`${q.имя}: сегодня вы там уже были.`,{interrupt:true});return;}
  if(!G.ship){if((Number(G.gold)||0)<5){narrate(`Лодочник везёт на ${q.имя} за 5 золота, а у вас меньше.`,{interrupt:true});return;}G.gold-=5;}
  g.дар[q.id]=сег;const перв=!g.был[q.id];if(перв){g.был[q.id]=сег;safeFn(()=>Lore.add("map",`kn2:${q.id}`,q.имя,`острова «${f.имя}»`));safeFn(()=>Рост.сброс());}
  const t=(КанонМесто.ЭФ[q.эф]||КанонМесто.ЭФ.чутьё)();const оп=this.опасность(f.опасность);
  Канон.звук("ship_creak",{kind:"world",gain:0.45,maxSec:3});
  narrate(`${q.имя}: ${q.о}. ${t}${оп}`,{interrupt:true});safeFn(()=>saveGame(true));},
 собрать(f,r,k){const g=this.ст();const сег=Number(G.day)||1;
  if(g.сбор[f.id]===сег){narrate(`${r.имя}: сегодня здесь уже собрано, приходите завтра.`,{interrupt:true});return;}
  g.сбор[f.id]=сег;const n=1+(Math.random()<0.35?1:0)+(КанонДары.есть("добыча")?1:0);G.inv[r.имя]=(Number(G.inv[r.имя])||0)+n;
  Канон.звук("oc_soft_touch",{kind:"world",gain:0.45});narrate(`Собрано: ${r.имя}, ${n}. ${r.о}.`,{interrupt:true});safeFn(()=>saveGame(true));},
 /* подводье */
 нужно(d){return {дыхание:"дыхание",свет:"свет",тепло:"тепло"}[d.нужно||"дыхание"]||"дыхание";},
 готов(d){const н=d.нужно||"дыхание";const есть=b=>!!safeFn(()=>buffActive(b),false);
  if(н==="свет")return есть("свет")||есть("ночное зрение")||КанонДары.есть("свет");
  if(н==="тепло")return есть("тепло")||(Number(safeFn(()=>ART.sum("сопр_лёд"),0))||0)>=0.2;
  return есть("дыхание")||КанонДары.есть("дыхание")||(Number(d.глубина)||1)<=1;},
 нырнуть(d,f,k){if(G.inCombat)return;const g=this.ст();const гл=Number(d.глубина)||1;const т=[];
  if(!this.готов(d)){const dmg=Math.max(1,Math.round((Number(G.hpMax)||100)*0.12*гл));
   const совет={дыхание:"зелье дыхания или вещь, что даёт дышать под водой",свет:"свет — зелье, чары или фонарь",тепло:"тепло — зелье или вещь от стужи"}[d.нужно||"дыхание"];
   if((Number(G.hp)||0)<=dmg+1){narrate(`${d.имя}: на глубину ${гл} так не дотянуть — нужно ${совет}.`,{interrupt:true});return;}
   G.hp-=dmg;т.push(`Без ${this.нужно(d)==="дыхание"?"запаса дыхания":this.нужно(d)==="свет"?"света":"тепла"} тяжело: здоровья −${dmg}.`);}
  Канон.звук(d.звукО||"oc_bubble",{kind:"world",gain:0.5,maxSec:4});
  if(!g.был[d.id]){g.был[d.id]=Number(G.day)||1;safeFn(()=>Lore.add("secret",`kn2deep:${d.id}`,d.имя,`подводье края «${k.имя}»`));safeFn(()=>Рост.сброс());}
  const хоз=!g.хозяин[d.id]&&d.тварь&&КАНОН_ТВАРЬ[d.тварь];
  if(хоз){const L=Number(G.level)||1;const lvl=Math.max(хоз.min,Math.min(хоз.max,хоз.min+Math.floor(L/3)));
   const m=Object.assign({},хоз,{lvl,hp:Math.round((20+lvl*8)*safeFn(()=>diff().foeHp,1)*1.3),dmg:3+lvl*2,xp:15+lvl*10,gold:5+lvl*4,стаей:1,кнНырок:d.id});
   narrate(`${т.join(" ")} ${d.имя}: ${d.о.charAt(0).toLowerCase()+d.о.slice(1)}. Из глубины поднимается хозяин — ${хоз.n}!`.trim(),{interrupt:true});
   setTimeout(()=>safeFn(()=>{if(!G.inCombat)startCombat({x:G.x,y:G.y,monster:m},{});}),1600);return;}
  narrate(`${т.join(" ")} ${this.награда(d,k,false)}`.trim(),{interrupt:true});safeFn(()=>saveGame(true));},
 награда(d,k,победа){const g=this.ст();const сег=Number(G.day)||1;const т=[];
  if(победа){g.хозяин[d.id]=сег;const з=20+Math.round((Number(G.level)||1)*5);G.gold=(Number(G.gold)||0)+з;т.push(`Хозяин глубины повержен. На дне — клад: ${з} золота.`);
   const из=(d.клад||[]).filter(id=>КАНОН_ВЕЩЬ[id]&&!КанонВещи.есть_у(id));
   if(из.length){const a=КанонВещи.дать(из[Math.floor(Math.random()*из.length)],d.имя);if(a)т.push(`И ещё — ${a.имя}.`);}
   safeFn(()=>journal(`Подводье «${d.имя}»: хозяин глубины повержен.`));}
  if(g.дар[d.id]!==сег){g.дар[d.id]=сег;т.push((КанонМесто.ЭФ[d.эф]||КанонМесто.ЭФ.клад)());}else if(!победа)т.push(`${d.имя}: тихо, сегодня глубина свой дар уже отдала.`);
  const r=d.ресурс&&КАНОН_РЕС[d.ресурс];if(r&&g.сбор[d.id]!==сег){g.сбор[d.id]=сег;G.inv[r.имя]=(Number(G.inv[r.имя])||0)+1;т.push(`Со дна — ${r.имя}.`);}
  return т.join(" ");}};
/* победа над хозяином глубины — клад и дар подводья */
КанонЦепь.шаг("victory",function(m,cb,r){try{if(m&&m.кнНырок){const d=КАНОН_ГЕО[m.кнНырок];const k=d&&КАНОН_КРАЙ[d.край];
 if(d&&k){const t=КанонГео.награда(d,k,true);setTimeout(()=>safeFn(()=>narrate(t,{interrupt:false})),2400);}}}catch(_){}return r;});
/* карта с координатами: места природы краёв видны на своих клетках */
safeFn(()=>{const ч0=Карта165.что.bind(Карта165);Карта165.что=function(x,y){const s=ч0(x,y);
 try{if(this.мир){const h=КанонГео.здесь(x,y);if(h)return s?`${s}, ${h.f.вид} «${h.f.имя}»`:`${h.f.вид} «${h.f.имя}»`;}}catch(_){}return s;};});

/* ── КанонЦепь: обёртки — по одной на функцию ── */
safeFn(()=>{const s0=Undead.onStrike.bind(Undead);Undead.onStrike=function(m,mdmg){let d=s0(m,mdmg);
 for(const f of КанонЦепь.шаги.onStrike){try{d=f(m,d,mdmg);}catch(_){}}return d;};});
safeFn(()=>{const h0=Undead.onHit.bind(Undead);Undead.onHit=function(m,dmg){let d=h0(m,dmg);
 for(const f of КанонЦепь.шаги.onHit){try{d=f(m,d,dmg);}catch(_){}}return d;};});
safeFn(()=>{const s0=Undead.onStart.bind(Undead);Undead.onStart=function(m){let r=s0(m);
 for(const f of КанонЦепь.шаги.onStart){try{r=f(m,r);}catch(_){}}return r;};});
safeFn(()=>{const k0=Power.spellK.bind(Power);Power.spellK=function(sp){let k=k0(sp);
 for(const f of КанонЦепь.шаги.spellK){try{k=f(sp,k);}catch(_){}}return k;};});
safeFn(()=>{const b0=beastAt;beastAt=function(x,y,c,доля){let m=b0.apply(this,arguments);
 for(const f of КанонЦепь.шаги.beastAt){try{m=f(m,x,y,c,доля);}catch(_){}}return m;};});
safeFn(()=>{const v0=victory;victory=function(){const cb=G.combat;const m=cb&&cb.m;const Ш=КанонЦепь.шаги.victory;
 const до=Ш.map(h=>{try{return h.до?h.до(m,cb):undefined;}catch(_){return undefined;}});
 const r=v0.apply(this,arguments);
 Ш.forEach((h,i)=>{try{(h.после||h)(m,cb,r,до[i]);}catch(_){}});return r;};});
