/* ════════════════════════════════════════════════════════════════════════
   (15.0) ГОЛОСА: ГЕРОЙ ГОВОРИТ РАЗНО, ГЕРОИНЕ — ЖЕНСКОЕ ОБРАЩЕНИЕ
   Просьбы игрока: «фразы самого персонажа расширить, чтобы их было больше,
   они были разнообразнее, и записать голосами Gemini»; «игрок выбрал
   женский пол — значит, все реплики, разговоры с торговцами и прочее тоже
   женским голосом Gemini».
   1. К каждому из двадцати двух ходов разговора каждым из двенадцати
      голосов героя записано ещё до четырёх реплик (та же интонация хода);
      герой не повторяет ту же фразу дважды подряд.
   2. Строки жителей, обращённые к герою с родом («путник», «ты пришёл»),
      записаны голосами самих жителей и в женском обращении: героине житель,
      торговец, стражник и тварь говорят «путница», «ты пришла» своим
      голосом. Нет такой записи — строку читает голос игры в женском роде,
      мужского обращения героиня не слышит.
   ════════════════════════════════════════════════════════════════════════ */
const HERO_VOICE_VARS=/*@HERO_VARS@*/{};
const FEM_NPC=/*@FEM_NPC@*/{};
/* 1. Ходы разговора героя: прежняя запись и новые — по очереди, без повтора подряд. */
safeFn(()=>{
 const последний={};
 for(const [id,ходы] of Object.entries(HERO_VOICE_VARS))for(const [ход,vs] of Object.entries(ходы))
  for(const [n,d] of vs)safeFn(()=>{HERO_VOICE_LEN[`hero_${ход}_${n}_${id}`+VOICE_GEN]=d;});
 const h0=heroVoicePath;
 heroVoicePath=matKeep(h0,function(ход){
  const base=h0.apply(this,arguments);
  if(base===null)return base;
  const h=G.hero;const id=(h&&h.voice)||"algieba";
  const vs=((HERO_VOICE_VARS[id]||{})[ход]||[]).map(x=>x[0]);
  if(!vs.length)return base;
  const все=[0].concat(vs);const был=последний[id+":"+ход];
  const выбор=все.filter(n=>n!==был);
  const n=выбор[Math.floor(Math.random()*выбор.length)];
  последний[id+":"+ход]=n;
  return n?`hero_${ход}_${n}_${id}`+VOICE_GEN:base;});
});
/* 2. Женское обращение жителей: новые строки описи и их длительности. */
safeFn(()=>{
 for(const [роль,m] of Object.entries(FEM_NPC.lines||{})){
  const пул=VOICE_NPC[роль]||(VOICE_NPC[роль]={});
  for(const [t,r] of Object.entries(m))if(!пул[t])пул[t]=r;}
 Object.assign(VOICE_NPC_LEN,FEM_NPC.len||{});
});
/* Строка жителя для того, к кому он обращается: героине — запись с женским
   обращением (null — такой записи нет, строку читает голос игры), герою и
   строке без обращения — сама строка. */
function femLine(роль,t){
 try{
  if(!t||!Род.героиня())return t;
  const ж=Род.кГероине(t);if(ж===t)return t;
  return VOICE_NPC[роль]&&VOICE_NPC[роль][ж]?ж:null;
 }catch(_){return t;}}
safeFn(()=>{
 const r0=Folk.реплика;
 Folk.реплика=matKeep(r0,function(роль,строка,n,жен,o){
  const s=femLine(роль,строка);if(s===null)return false;
  return r0.call(this,роль,s,n,жен,o);});
 const d0=Folk.длинаОтвета;
 Folk.длинаОтвета=matKeep(d0,function(n,строка){
  const s=femLine("dlg",строка);return s===null?0:d0.call(this,n,s);});
});
/* Живая строка по делу: героине — своим голосом с женским обращением, если
   запись есть; иначе, как прежде, строка без обращения или голос игры. */
safeFn(()=>{
 const s0=npcSay;
 npcSay=matKeep(s0,function(n,роль,o){
  if(!safeFn(()=>Род.героиня(),false))return s0.apply(this,arguments);
  let t=liveLine(роль);if(!t)return {t:"",сказал:false};
  if(Род.кГероине(t)!==t&&femLine(роль,t)===null){
   const все=LIVE_LINES[роль]||[];
   const годные=все.filter(x=>Род.кГероине(x)===x||femLine(роль,x)!==null);
   if(годные.length)t=годные[Math.floor(Math.random()*годные.length)];}
  const показ=Род.жителя(n,t);
  const г=safeFn(()=>Folk.голос(n),null);
  const страж=/^guard_|^patrol/.test(роль);
  const гол=страж?Math.abs(Math.round(hashName(String((n&&n.key)||"").length,(n&&n.x)|0,4103)*3))%3:safeFn(()=>Folk.пара(n),0);
  const сказал=safeFn(()=>Folk.on(),false)&&liveRecorded(роль,t)&&femLine(роль,t)!==null
   &&!!safeFn(()=>Folk.реплика(роль,t,n,!страж&&Folk.жен(n),Object.assign({rate:страж?1:(г?г[1]:1)*safeFn(()=>Folk.тембр(n),1),всегда:true,голос:гол},o||{})),false);
  return {t:показ,сказал};});
});
