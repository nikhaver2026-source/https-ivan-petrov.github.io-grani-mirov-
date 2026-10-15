"""release175b.py — единые обработчики (Р4): речь игры — одной цепочкой обработчиков вместо подмены Speech.say.

Прежде модули на время подменяли Speech.say (собрать фразы верхом, отложить слова после звука, заменить жесты на
клавиши, отдать «кавычки» голосу персонажа) и возвращали сохранённую функцию; порядок подмен зависел от порядка
модулей, а вложенная подмена, вернувшая не свою функцию, могла потерять соседнюю. Теперь у речи цепочка:
  Speech.use(имя, обработчик(t, o, дальше), порядок) — постоянный обработчик (больший порядок — раньше в цепочке);
  Speech.на_время(fn, обработчик, имя) — обработчик только на время fn, первым в цепочке; снимается сам, по себе.
Обработчик либо передаёт фразу дальше (дальше(t, o) — можно изменённую или позже), либо оставляет у себя.
Здесь же две подмены основы переведены на цепочку: отложенные фразы после «Изучено» и голоса чертогов в «кавычках».
Повторный запуск ничего не меняет."""
B = "/root/S/hron/index_before_mater.html"
s = open(B, encoding="utf-8").read()
SAY0 = "\n say(text,o){return this.enqueue(text,o);},"
SAY1 = """
 /* ── ЦЕПОЧКА РЕЧИ (17.5) ──
    Фраза проходит обработчики цепочки по порядку (временные — первыми), каждый передаёт её дальше или оставляет
    у себя; последним — очередь речи. Модули больше не подменяют Speech.say. */
 _цепь:[],_цепьN:0,
 say:Object.assign(function(text,o){const ц=this._цепь;if(!ц.length)return this.enqueue(text,o);
  const список=ц.slice();let i=0;const self=this;
  const дальше=function(t,oo){while(i<список.length){const з=список[i++];if(з.снят)continue;
    return з.fn.call(self,t,oo,дальше);}return self.enqueue(t,oo);};
  return дальше(text,o);},{цепьРечи:true}),
 use(имя,fn,порядок){const з={имя:String(имя||"обработчик"),fn,порядок:Number(порядок)||0,n:++this._цепьN,снят:false};
  this._цепь.push(з);this._цепь.sort((a,b)=>b.порядок-a.порядок||b.n-a.n);
  return ()=>{з.снят=true;this._цепь=this._цепь.filter(x=>x!==з);};},
 /* Speech.say подменили снаружи (прослушка проверочного набора, чужая обёртка) — временный обработчик ложится
    поверх подмены, как прежде; сама игра Speech.say больше не подменяет. */
 на_время(fn,обработчик,имя){const self=this;
  if(!(this.say&&this.say.цепьРечи)){const s0=this.say;
   this.say=function(t,o){return обработчик.call(self,t,o,(tt,oo)=>s0.call(self,tt,oo));};
   try{return fn();}finally{this.say=s0;}}
  const снять=this.use(имя||"на время",обработчик,1e9);try{return fn();}finally{снять();}},"""
if "цепьРечи:true" not in s:
    assert s.count(SAY0) == 1, "нет say"
    s = s.replace(SAY0, SAY1)
    print("цепочка речи: добавлена")
Q0 = """{const s0=Speech.say.bind(Speech);Speech.say=function(t,o){
  try{if(typeof t==="string"&&t.indexOf("«")>=0&&safeFn(()=>Folk.on(),false)){let сыграно=false;
   const t2=t.replace(/\\s*[:—]?\\s*«([^»]+)»([.!?…]?)/g,(m,q)=>{if(сыграно)return m;const f=chVoiceLine(q);if(!f)return m;
    if(safeFn(()=>Folk.сказать(f+VOICE_GEN,null,{dir:VOICE_NPC_DIR,всегда:true}),false)){сыграно=true;return " ";}return m;});
   if(сыграно){const r=t2.replace(/\\s+([.,!?…])/g,"$1").replace(/\\s{2,}/g," ").replace(/[:,—]\\s*$/,".").trim();
    if(!r||/^[.!?…]+$/.test(r))return "VOICED";return s0(r,o);}}}catch(_){}
  return s0(t,o);};}"""
Q1 = """Speech.use("голоса чертогов в кавычках",function(t,o,дальше){
  try{if(typeof t==="string"&&t.indexOf("«")>=0&&safeFn(()=>Folk.on(),false)){let сыграно=false;
   const t2=t.replace(/\\s*[:—]?\\s*«([^»]+)»([.!?…]?)/g,(m,q)=>{if(сыграно)return m;const f=chVoiceLine(q);if(!f)return m;
    if(safeFn(()=>Folk.сказать(f+VOICE_GEN,null,{dir:VOICE_NPC_DIR,всегда:true}),false)){сыграно=true;return " ";}return m;});
   if(сыграно){const r=t2.replace(/\\s+([.,!?…])/g,"$1").replace(/\\s{2,}/g," ").replace(/[:,—]\\s*$/,".").trim();
    if(!r||/^[.!?…]+$/.test(r))return "VOICED";return дальше(r,o);}}}catch(_){}
  return дальше(t,o);},10);"""
if Q1 not in s:
    assert s.count(Q0) == 1, "нет обёртки кавычек"
    s = s.replace(Q0, Q1); print("кавычки: обработчик цепочки")
K0 = """const отложено=[];const прежнееSay=Speech.say;
 Speech.say=(t,o)=>{отложено.push([t,Object.assign({},o||{},{interrupt:false})]);};
 let награда="";
 try{награда=knowGrant(k.n,k.reward);}finally{Speech.say=прежнееSay;}"""
K1 = """const отложено=[];let награда="";
 Speech.на_время(()=>{награда=knowGrant(k.n,k.reward);},(t,o)=>{отложено.push([t,Object.assign({},o||{},{interrupt:false})]);},"изучено — сначала главное");"""
if K1 not in s:
    assert s.count(K0) == 1, "нет отложенных фраз «Изучено»"
    s = s.replace(K0, K1); print("«Изучено»: временный обработчик")
open(B, "w", encoding="utf-8").write(s)
