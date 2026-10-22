/* ════════════════════════════════════════════════════════════════════════
   СТОРОЖ ФОНА (22 октября)
   Просьба игрока: «чтобы фоны разных локаций работали как надо и не
   отваливались». Проба мест (tools/soak/probes/zvuk_locprobe.js) показала:
   после переноса из яруса наверх фон и живой слой подземелья (река,
   водопад) и музыка яруса звучали дальше, пока герой не дошёл до новой
   местности. Место сменяется многими путями: вход и выход, ярус, обоз,
   сеть переходов, возрождение, выход из Грани, тайный выход, загрузка; часть
   путей обновляет фон, часть — нет (выход из Грани и переход сетью — только
   refresh()).
   Теперь у фона есть сторож: при каждом обновлении фона места запоминается
   подпись места (наверху, на палубе, постройка, ярус); если подпись
   сменилась, а фон не обновлялся, — при следующем refresh() или в пределах
   полутора секунд фон, живой слой и музыка ставятся по новому месту. Бой,
   пролог и чертог ведут свой звук сами — их сторож не трогает.
   ════════════════════════════════════════════════════════════════════════ */
const ФонСтраж={подпись:null,было:null,счёт:0,
 текущая(){
  const p=G.place;
  if(!p)return G.ship?"палуба":"верх";
  return ["место",p.kind||"",p.stype||"",p.name||"",p.bx,p.by,Number(p.depth)||0].join(":");},
 отметить(){this.подпись=this.текущая();},
 занят(){return !entered||G.inCombat||safeFn(()=>Prologue.active(),false)||safeFn(()=>Chertog.inside(),false);},
 проверить(почему){
  try{
   if(this.занят())return false;
   const п=this.текущая();
   if(this.подпись===null){this.подпись=п;return false;}
   if(п===this.подпись)return false;
   const из=this.подпись;this.подпись=п;
   if(!G.place&&!G.ship){const c=safeFn(()=>cellContent(G.x,G.y),null);
    if(c)safeFn(()=>ambLayers(c.terrain[0]));safeFn(()=>Weather.resume());}
   safeFn(()=>bankUpdateAmbient());
   safeFn(()=>resumeLocationMusic());
   this.счёт++;this.было={почему:String(почему||""),из,в:п,t:Date.now()};
   return true;
  }catch(_){return false;}}};

safeFn(()=>{const b0=bankUpdateAmbient;bankUpdateAmbient=function(){const r=b0.apply(this,arguments);safeFn(()=>ФонСтраж.отметить());return r;};});
safeFn(()=>{const r0=refresh;refresh=function(){const r=r0.apply(this,arguments);safeFn(()=>ФонСтраж.проверить("refresh"));return r;};});
safeFn(()=>Такт.каждые(1500,()=>ФонСтраж.проверить("часы"),"сторож фона"));
