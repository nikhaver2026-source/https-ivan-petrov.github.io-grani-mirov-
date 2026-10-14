/* ════════════════════════════════════════════════════════════════════════
   ПОДЗЕМЬЕ ЗВУЧИТ ЖУТКО И ПО-СВОЕМУ (после 16.0)
   Просьбы игрока: «на восьмом ярусе через какое-то время заиграла весёлая
   музыка — в подземелье должна быть жуткая; проверь все подземелья»;
   «звуки ярусов должны быть разными: звук поверхностей разный, а звуковой
   фон ярусов плюс-минус один и тот же».
   1. Весёлая музыка. Музыкальная роль с несколькими файлами играет их по
      кругу. На ярусе хозяина подземелья (последний ярус, у многих — восьмой)
      играла роль «бой с сильным»: после двух мрачных тем — бодрый «Boss» из
      Solarus; в бою — «Road to Victory». Под землёй теперь только мрачные
      роли: «бой с сильным» и «бой» — свои, без бодрых файлов, а любая не
      подземная тема (местность, город, затишье, заглавие) под землёй
      заменяется темой яруса. Синтез без записи под землёй — тёмный.
   2. Фон ярусов. Прежде с пятого по сотый ярус звучала одна петля. Теперь у
      яруса свой долгий фон по его породе (заброшенные ходы, затопленные залы,
      грибной лес, кузница, город, храм, кристаллы, склепы, лёд, живые своды,
      пепел, разлом, зеркала, остановленное время…) и второй слой, и соседние
      ярусы не звучат одинаково.
   ════════════════════════════════════════════════════════════════════════ */
safeFn(()=>{
 if(SOUND_BANK.mus_boss&&!SOUND_BANK.mus_boss_dark)SOUND_BANK.mus_boss_dark={f:SOUND_BANK.mus_boss.f.filter(f=>!/solarus|sol_boss/i.test(f)),d:"Бой с сильным под землёй: «It All Ends Here» (Ancient Beast) и тема Flare — без бодрых тем"};
 if(!SOUND_BANK.mus_battle_dark)SOUND_BANK.mus_battle_dark={f:["wesnoth/wn_primal_carnage.ogg","score/score_battle_01.ogg"],d:"Бой под землёй: «Primal Carnage» Скотта Бакли — погоня в темноте, и боевая тема Flare"};
 MUSIC_TRACK.boss_dark="mus_boss_dark";MUSIC_TRACK.battle_dark="mus_battle_dark";});
const Подземье165={
 /* бодрые файлы, которым под землёй не место */
 БОДРО:/solarus|sol_boss|road_to_victory|mus_plains|mus_town|mus_safe|tavern|village|market|title|prologue/i,
 тут(){const p=G.place;if(!p||G.ship)return false;return (Number(p.depth)||0)>0||!!p.тайник||PLACE_KIND[p.stype]==="dungeon";},
 глубина(){return Math.max(1,Number(G.place&&G.place.depth)||1);},
 мрачно(key){const role=MUSIC_TRACK[key]||(Music.NIGHT_ROLE||{})[key];const b=role&&SOUND_BANK[role];if(!b||!Array.isArray(b.f)||!b.f.length)return false;
  return !b.f.some(f=>this.БОДРО.test(f));},
 /* какую тему играть под землёй вместо той, что просили */
 ключ(key){
  if(key==="boss")return "boss_dark";
  if(key==="battle")return "battle_dark";
  if(/^(depth_|dk_|dc_|boss_dark|battle_dark)/.test(String(key))&&this.мрачно(key))return key;
  if(["mirror","rot","ash","tower_led","vein","bone","drown","scar"].includes(key)&&this.мрачно(key))return key;
  const свой=safeFn(()=>underTrack(this.глубина()),"depth_1");
  if(свой==="boss")return "boss_dark";
  return this.мрачно(свой)?свой:"depth_2";},
 /* ── фон ярусов ── */
 ПОРОДА:{abandoned:["deep_1","deep_wind"],flooded:["ad_river_med","oc_waterfall"],fungal:["deep_4","oc_boiling"],forge:["ad_fire_crackle","oc_steam"],
  city:["deep_3","oc_fan"],temple:["deep_5","stk_ward"],alien:["deep_4","oc_wind"],crystal:["oc_crystal_comm","oc_electrical"],
  ossuary:["amb_abyss","deep_5"],ice:["lug_wind","deep_wind"],living:["oc_boiling","deep_4"],ash:["ad_fire_crackle","oc_fire"],
  rift:["oc_electrical","amb_abyss"],mirror:["oc_electrical","stk_dark"],temporal:["stk_clock","stk_dark"],dream:["deep_5","amb_abyss"]},
 ПАЛИТРА:["deep_1","deep_wind","deep_2","stk_dark","deep_3","deep_4","amb_abyss","deep_5","oc_wind","ad_river_med","oc_fan","oc_steam","lug_wind","oc_boiling"],
 есть(r){return !!(r&&SOUND_BANK[r]&&safeFn(()=>Bank.has(r),false));},
 порода(p,d){return safeFn(()=>{if(!Deep.on())return null;const s=Deep.here();const t=s&&s.tiers&&s.tiers[d];return t?t.b:null;},null);},
 /* фоны ярусов подземелья — рядом сверху вниз: порода яруса задаёт свои фоны, а главный фон не повторяет
    ни одного из пяти ярусов выше — соседние ярусы звучат по-разному */
 _ряды:new Map(),
 ряд(p,D){const key=(p.bx|0)+","+(p.by|0)+","+(G.dark?1:0);let r=this._ряды.get(key);
  if(!r){if(this._ряды.size>40)this._ряды.clear();r=[null];this._ряды.set(key,r);}
  const пал=this.ПАЛИТРА.filter(x=>this.есть(x));if(!пал.length)return r;
  for(let d=r.length;d<=D;d++){
   const h=k=>Math.floor(hashName((p.bx|0)*7+d*13+k,(p.by|0)*11+d*5+k,16800+k)*1e6);
   const пара=(this.ПОРОДА[this.порода(p,d)]||[]).filter(x=>this.есть(x));
   const недавно=r.slice(Math.max(1,d-5),d).map(z=>z&&z.главный);
   const своя=пара.filter(x=>!недавно.includes(x));
   const чужая=пал.filter(x=>!недавно.includes(x)&&!пара.includes(x));
   const главный=своя.length?своя[h(1)%своя.length]:(чужая.length?чужая[h(2)%чужая.length]:пал[h(3)%пал.length]);
   const вт=пара.filter(x=>x!==главный).concat(пал.filter(x=>x!==главный&&!пара.includes(x)));
   const второй=вт.length?(пара.filter(x=>x!==главный)[0]||вт[h(4)%вт.length]):null;
   r[d]={главный,второй};}
  return r;},
 слои(p,d){d=Math.max(1,Math.min(200,Number(d)||1));return this.ряд(p,d)[d]||null;},
 /* синтез без записи: под землёй и для подземных тем — пещерный строй */
 синтез(t){return (/^(depth_|dk_|dc_|boss_dark|battle_dark)/.test(String(t))||safeFn(()=>this.тут(),false))?"cave":t;},
};
const обёртка165z=(w,f0)=>{try{Object.defineProperty(w,"toString",{value:function(){return String(f0);},configurable:true,writable:true});}catch(_){}return w;};
/* музыка: под землёй — только мрачная */
safeFn(()=>{const s0=Music.start;Music.start=обёртка165z(function(key){
 try{if(gameActive()&&Подземье165.тут())key=Подземье165.ключ(key);}catch(_){}
 return s0.call(this,key);},s0);});
safeFn(()=>{const b0=Music.buildLocation;Music.buildLocation=function(s,terrain){return b0.call(this,s,Подземье165.синтез(terrain));};});
/* фон: у яруса свой */
safeFn(()=>{const a0=bankAmbientRole;bankAmbientRole=обёртка165z(function(){
 try{const p=G.place;if(p&&(Number(p.depth)||0)>0&&!p.тайник&&!safeFn(()=>Grani.inFacet(),false)){
  const сл=Подземье165.слои(p,p.depth);if(сл&&сл.главный)return сл.главный;}}catch(_){}
 return a0.apply(this,arguments);},a0);});
safeFn(()=>{const l0=liveAmbient;liveAmbient=обёртка165z(function(seed){
 try{const p=G.place;if(p&&(Number(p.depth)||0)>0&&!p.тайник&&settings.effects&&Bank.enabled&&!safeFn(()=>Grani.inFacet(),false)){
  const ан=safeFn(()=>{const a=anomalyHere();return a&&a.фон;},null);const сл=Подземье165.слои(p,p.depth);
  const r=ан||(сл&&сл.второй);if(r){Bank.loop("live",r,{seed:Number(seed)||0,gain:0.55,kind:"ambient"});return;}}}catch(_){}
 return l0.apply(this,arguments);},l0);});
