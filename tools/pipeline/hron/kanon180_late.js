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
safeFn(()=>{const s0=Undead.onStrike.bind(Undead);Undead.onStrike=function(m,mdmg){let d=s0(m,mdmg);
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
 return Math.max(0,d);};});
/* ход героя: яд, жала, бесы — жгут тварь; вскрытие и боль — сильнее удар */
safeFn(()=>{const h0=Undead.onHit.bind(Undead);Undead.onHit=function(m,dmg){let d=h0(m,dmg);
 try{const cb=G.combat;if(!cb)return d;let доп=0;const лог=t=>safeFn(()=>cbLog(t));
  if(cb.кнВскрытие&&d>0)d=Math.round(d*(1+cb.кнВскрытие));
  if((Number(cb.кнБоль)||0)>0&&d>0){d+=cb.кнБоль;cb.кнБоль=0;}
  if((Number(cb.кнЯд)||0)>0){cb.кнЯд--;доп+=2+Math.round(КанонОсобое.h()*0.3);}
  if((Number(cb.кнЖала)||0)>0){cb.кнЖала--;доп+=2;}
  if((Number(cb.кнБесы)||0)>0){cb.кнБесы--;доп+=3+Math.round(КанонОсобое.h()*0.4);}
  if(доп)лог(`Яд, жала и бесы: ещё −${доп}.`);d+=доп;}catch(_){}
 return d;};});
/* начало боя: узел и растяжка, поставленные заранее */
safeFn(()=>{const s0=Undead.onStart.bind(Undead);Undead.onStart=function(m){const r=s0(m);
 try{КанонБой.после(cb=>{
  if(buffActive("кн_узел")){delete G.buffs["кн_узел"];cb.путы=(Number(cb.путы)||0)+1;setTimeout(()=>safeFn(()=>narrate("Тварь начинает бой в узле: первый ход она потеряла.",{interrupt:false,cat:"combat"})),1500);}
  if(buffActive("кн_растяжка")){delete G.buffs["кн_растяжка"];cb.путы=(Number(cb.путы)||0)+1;Канон.звук("kn_str_pluck",{kind:"combat",gain:0.55});
   setTimeout(()=>safeFn(()=>narrate("Струна-растяжка зазвенела: вы готовы раньше, чем тварь.",{interrupt:false,cat:"combat"})),1200);}});}catch(_){}
 return r;};});
/* заём и прочие цены чар */
safeFn(()=>{const k0=Power.spellK.bind(Power);Power.spellK=function(sp){let k=k0(sp);if(buffActive("кн_долг"))k*=1.3;return k;};});
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
 подходят(t){const b=t||"";return КАНОН_ТВАРИ.filter(m=>m.кнБиомы.indexOf(b)>=0);},
 тихо(){return safeFn(()=>buffActive("тишина шага")||buffActive("морок")||buffActive("скрытность"),false);},
 слово(m){const s=Канон.ст();if(!s.твари||typeof s.твари!=="object")s.твари={};const перв=!s.твари[m.id];s.твари[m.id]=(Number(s.твари[m.id])||0)+1;
  const ум=(m.кнУм||[]).map(u=>this.УМ[u]).filter(Boolean);
  return перв?`${m.n} — ${m.о.charAt(0).toLowerCase()+m.о.slice(1).replace(/\.$/,"")}.${ум.length?` Повадки: ${ум.join("; ")}.`:""}`
   :`${m.n}${ум.length?`: ${ум.join("; ")}`:""}.`;}};
/* мир: изредка вместо здешнего зверя — тварь канона той же земли; в краях канона чаще (§12) */
safeFn(()=>{const b0=beastAt;beastAt=function(x,y,c,доля){const m=b0.apply(this,arguments);
 if(!m||G.dark||m.нем||m.кн)return m;
 try{const t=c&&c.terrain&&c.terrain[0];let p=0.16;const край=safeFn(()=>Канон.край&&Канон.край(x,y),null);if(край)p=0.6;
  if(hashName(x,y,18011)>=p)return m;
  let cand=край&&край.твари&&край.твари.length?край.твари.map(id=>КАНОН_ТВАРЬ[id]).filter(Boolean):КанонТвари.подходят(t);
  if(!cand.length)return m;const пик=cand[Math.floor(hashName(x,y,18012)*cand.length)%cand.length];
  if(КанонТвари.есть(пик,"слепой")&&КанонТвари.тихо())return m;
  return пик;}catch(_){return m;}};});
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
safeFn(()=>{const s0=Undead.onStart.bind(Undead);Undead.onStart=function(m){const r=s0(m);
 try{if(m&&m.кн)КанонБой.после(cb=>{
  if(КанонТвари.есть(m,"засада")&&!buffActive("кн_растяжка")&&!КанонТвари.тихо())cb.кнЗасада=1;
  if(КанонТвари.есть(m,"роет"))cb.кнСнизу=1;
  if(КанонТвари.есть(m,"гасит_свет")&&!buffActive("свет"))cb.кнТьма=1;
  if(КанонТвари.есть(m,"морок"))cb.кнМорок=2;
  setTimeout(()=>safeFn(()=>{if(G.combat===cb)narrate(КанонТвари.слово(m),{interrupt:false,cat:"combat"});}),1900);});}catch(_){}
 return r;};});
/* удар героя оружием: панцирь, морок, тьма, сети, звон, реген, тревога */
safeFn(()=>{const h0=Undead.onHit.bind(Undead);Undead.onHit=function(m,dmg){let d=h0(m,dmg);
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
 return d;};});
/* удар твари: засада, снизу, яд, кража, оглушение, огонь, пора, память, чары */
safeFn(()=>{const s0=Undead.onStrike.bind(Undead);Undead.onStrike=function(m,mdmg){let d=s0(m,mdmg);
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
 return d;};});
/* чары по твари: смена уязвимости, зеркало, звон ломает стекло; шёпот твари дороже чары */
safeFn(()=>{const k0=bossDamageK;bossDamageK=function(kind,school){let k=k0.apply(this,arguments);
 try{const cb=G.combat,m=cb&&cb.m;if(!m||!m.кн||kind!=="spell")return k;
  if(КанонТвари.есть(m,"зеркало"))k*=0.6;
  if(КанонТвари.есть(m,"звон_ломает")&&["bell","strings","sound","echo"].indexOf(school)>=0)k*=2;
  if(КанонТвари.есть(m,"смена")){const сх=["fire","crystal","light"][Math.floor((Number(cb.кнХод)||0)%3)];k*=(school===сх||(сх==="crystal"&&school==="water"))?1.6:0.7;}}catch(_){}
 return k;};});
safeFn(()=>{const k0=Power.spellK.bind(Power);Power.spellK=function(sp){let k=k0(sp);const m=G.inCombat&&G.combat&&G.combat.m;if(m&&КанонТвари.есть(m,"путает_чары"))k*=1.2;return k;};});
/* ход боя: смена уязвимости вслух; украденное возвращается с победой */
safeFn(()=>{const u0=updateCombat;updateCombat=function(){const r=u0.apply(this,arguments);
 try{const cb=G.combat,m=cb&&cb.m;if(m&&m.кн&&КанонТвари.есть(m,"смена")){const ход=Math.floor((Number(cb.кнШаги)||0)/2);cb.кнШаги=(Number(cb.кнШаги)||0)+1;
  if(ход!==(Number(cb.кнХод)||0)){cb.кнХод=ход;safeFn(()=>cbLog(`${m.n} меняется: теперь её берёт ${["огонь","лёд","свет"][ход%3]}.`));}}}catch(_){}
 return r;};});
safeFn(()=>{const v0=victory;victory=function(){const m=G.combat&&G.combat.m;const r=v0.apply(this,arguments);
 try{if(m&&m.кн){const s=Канон.ст();const з=Number(s.украдено&&s.украдено[m.id])||0;if(з>0){s.украдено[m.id]=0;G.gold=(Number(G.gold)||0)+з;
   setTimeout(()=>safeFn(()=>narrate(`Украденное вернулось: ${з} золота.`,{interrupt:false})),1200);}
  if(m.кн)safeFn(()=>Lore.add("monster",`kn:${m.id}`,m.n,m.о));}}catch(_){}
 return r;};});
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
safeFn(()=>{const b0=beastAt;beastAt=function(x,y,c,доля){const m=b0.apply(this,arguments);if(!m)return m;
 try{if(buffActive("кн_убежище")&&Math.random()<0.85)return null;
  if(buffActive("кн_след")&&Math.random()<0.4)return null;
  if(КанонЗвери.есть("нежить_мимо","седло")&&/undead|spirit|bone/.test(String(safeFn(()=>foeFamily(m),""))))return null;}catch(_){}
 return m;};});
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
 const r=b0(id);if(x&&/теперь ваш/.test(String(r)))safeFn(()=>Lore.add&&Lore.add("zver",x.имя,x.о));return r;};});
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
safeFn(()=>{const s0=Undead.onStart.bind(Undead);Undead.onStart=function(m){const r=s0(m);
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
 return r;};});
safeFn(()=>{const s0=Undead.onStrike.bind(Undead);Undead.onStrike=function(m,mdmg){let d=s0(m,mdmg);
 try{const cb=G.combat;if(!cb||!(d>0))return d;const лог=t=>safeFn(()=>cbLog(t));
  if(cb.кнОтЯда&&buffActive("яд")){cb.кнОтЯда=0;delete G.buffs["яд"];G.poisoned=null;safeFn(()=>Hv.cure("poison",3));лог(`${КанонЗвери.кто("снять_яд")} снимает с вас яд.`);}
  if(cb.кнМимо){cb.кнМимо=0;лог(`${КанонЗвери.кто("промах_первого")} кричит — первый удар твари уходит мимо.`);return 0;}
  if(cb.кнЗаслон){cb.кнЗаслон=0;лог(`${КанонДары.кто("заслон1")} гасит удар твари.`);Канон.звук("oc_wood_hit",{kind:"combat",gain:0.45});return 0;}
  const ч=КанонЗвери.доля("часть_удара");if(ч>0)d=Math.max(1,Math.round(d*(1-Math.min(0.4,ч))));
  if(КанонЗвери.есть("стихии_слабее","седло")&&/spirit|fiend|dragon/.test(String(safeFn(()=>foeFamily(m),""))))d=Math.max(1,Math.round(d*0.7));}catch(_){}
 return d;};});
safeFn(()=>{const h0=Undead.onHit.bind(Undead);Undead.onHit=function(m,dmg){let d=h0(m,dmg);
 try{const cb=G.combat;if(cb&&cb.кнЧуял&&d>0){cb.кнЧуял=0;d=Math.round(d*1.5);}}catch(_){}return d;};});
/* после победы: части, ядра, детали ловушек; удача — больше золота */
safeFn(()=>{const v0=victory;victory=function(){const cb=G.combat;const m=cb&&cb.m;const r=v0.apply(this,arguments);
 try{if(!m)return r;const сем=String(safeFn(()=>foeFamily(m),"")||"");const t=[];
  const доб=(k,ok)=>{if(!ok||!КанонДары.есть(k)||Math.random()>=0.4)return;const L=safeFn(()=>Spoils.roll(m),[])||[];const рес=L[0]||(сем==="construct"?"шестерня Зодчих":"кость");
   КанонЗвери.дать(рес,1);t.push(`${КанонДары.кто(k)}: с поля подобрано — ${рес}.`);};
  доб("части",true);доб("детали",/construct|humanoid/.test(сем));доб("ядро",!/humanoid/.test(сем));
  if(КанонЗвери.есть("удача")){const з=Math.max(1,Math.round((Number(m.gold)||10)*0.15));G.gold=(Number(G.gold)||0)+з;t.push(`Сорока приносит удачу: ещё ${з} золота.`);}
  if(t.length)setTimeout(()=>safeFn(()=>narrate(t.join(" "),{interrupt:false})),1600);}catch(_){}
 return r;};});
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
safeFn(()=>{const k0=Power.spellK.bind(Power);Power.spellK=function(sp){let k=k0(sp);const v=КанонВещи.школа(sp&&sp.school);if(v)k*=1+v;return k;};});
/* путь: тишина ночью и в лесу, добыча с промысла */
safeFn(()=>{const mg=mountGift;mountGift=function(k){let v=mg(k);
 try{if(k==="скрытность"){let доп=0;if(КанонВещи.есть("тишина_ночь")&&safeFn(()=>isNight(),false))доп+=0.25;
   if(КанонВещи.есть("скрытность_лес")&&(КанонЗвери.пора("лес")||КанонЗвери.пора("болото")))доп+=0.3;if(доп)return Math.min(0.8,(Number(v)||0)+доп);}
  if(k==="добыча"){const д=КанонВещи.мои().filter(a=>КанонВещи.особ(a,"добыча")!=null).length;if(д)return Math.round((Number(v)||0)+д);}}catch(_){}
 return v;};});
/* встречи: люди и звери реже, если вещь велит */
safeFn(()=>{const b0=beastAt;beastAt=function(x,y,c,доля){const m=b0.apply(this,arguments);if(!m)return m;
 try{const сем=String(safeFn(()=>foeFamily(m),"")||"");if(КанонВещи.есть("люди_мимо")&&сем==="humanoid"&&Math.random()<0.5)return null;
  if(КанонВещи.есть("звери_мирны")&&сем==="beast"&&Math.random()<0.4)return null;}catch(_){}return m;};});
safeFn(()=>{const a0=Hv.add.bind(Hv);Hv.add=function(id,stage,from,silent){if(id==="disease"&&КанонВещи.есть("без_мора"))return "";return a0(id,stage,from,silent);};});
/* бегство: раз в сутки — наверняка */
safeFn(()=>{const f0=Morpho.fleeK.bind(Morpho);Morpho.fleeK=function(m){let k=Number(f0(m))||0;if(КанонВещи.есть("бегство_раз")&&!КанонВещи.ст().бегство)k+=2;return k;};});
safeFn(()=>{const o0=Director.onFlee.bind(Director);Director.onFlee=function(m){const r=o0(m);safeFn(()=>{if(КанонВещи.есть("бегство_раз")&&!КанонВещи.ст().бегство){КанонВещи.ст().бегство=1;
  narrate(`${КанонВещи.кто("бегство_раз")} унесла вас из боя.`,{interrupt:false});}});return r;};});
/* удар героя: против нечисти и слияния, полнолуние, счёт побед */
safeFn(()=>{const h0=Undead.onHit.bind(Undead);Undead.onHit=function(m,dmg){let d=h0(m,dmg);
 try{if(!(d>0)||!КанонВещи.мои().length)return d;const сем=String(safeFn(()=>foeFamily(m),"")||"");
  if(КанонВещи.есть("против_нечисти")&&/undead|spirit|fiend|bone/.test(сем))d=Math.round(d*1.33);
  if(КанонВещи.есть("против_слияния")&&m&&m.кн&&String(m.пакет||"")==="17")d=Math.round(d*1.33);
  if(КанонВещи.есть("полнолуние_сила")&&КанонЗвери.полнолуние())d=Math.round(d*1.2);
  if(КанонВещи.есть("урон_за_победы"))d+=Math.min(15,Math.floor((Number(КанонВещи.ст().побед)||0)/50));}catch(_){}
 return d;};});
/* удар твари: заряды, переигрыш, испуг побеждённых, раны, хрупкость, чары твари, мана из запаса */
safeFn(()=>{const s0=Undead.onStrike.bind(Undead);Undead.onStrike=function(m,mdmg){let d=s0(m,mdmg);
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
 return d;};});
/* победа: счёт павших (мана навсегда, копильник), побеждённые, вещь канона с хозяина места */
safeFn(()=>{const v0=victory;victory=function(){const cb=G.combat;const m=cb&&cb.m;const r=v0.apply(this,arguments);
 try{if(!m)return r;const s=КанонВещи.ст();const t=[];s.побед=(Number(s.побед)||0)+1;if(!s.побеждено||typeof s.побеждено!=="object")s.побеждено={};
  if(m.id){s.побеждено[m.id]=(Number(s.побеждено[m.id])||0)+1;const ks=Object.keys(s.побеждено);if(ks.length>400)delete s.побеждено[ks[0]];}
  if(КанонВещи.есть("мана_за_павших")){s.павших=(Number(s.павших)||0)+1;if(s.павших%10===0&&(Number(s.маныДоб)||0)<20){s.маныДоб=(Number(s.маныДоб)||0)+1;G.manaMax=(Number(G.manaMax)||0)+1;t.push(`${КанонВещи.кто("мана_за_павших")}: мана навсегда +1.`);}}
  if(КанонВещи.есть("копильник")){s.копил=(Number(s.копил)||0)+1;if(s.копил>=20){s.копил=0;G.mana=G.manaMax;t.push(`${КанонВещи.кто("копильник")} полон: мана вся.`);}}
  if(m.кн){const держ=КанонТвари.есть(m,"держатель");if(Math.random()<(держ?0.25:0.015)){const свои=КАНОН_ВЕЩИ.filter(x=>!КанонВещи.есть_у(x.id)&&(!m.пакет||x.пакет===m.пакет));
    const из=свои.length?свои:КАНОН_ВЕЩИ.filter(x=>!КанонВещи.есть_у(x.id));if(из.length){const x=из[Math.floor(Math.random()*из.length)];const a=КанонВещи.дать(x.id,m.n);
     if(a)t.push(`С твари — вещь из преданий: ${a.имя}. ${x.о}.${safeFn(()=>ART.works(a),true)?"":" Пока не слушается: ей нужен опыт посильнее."}`);}}}
  if(t.length)setTimeout(()=>safeFn(()=>narrate(t.join(" "),{interrupt:false})),2200);}catch(_){}
 return r;};});
