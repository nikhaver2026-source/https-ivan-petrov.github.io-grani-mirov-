"""release175c.py — Р4 в модулях: подмены Speech.say → обработчики цепочки речи (Speech.use / Speech.на_время).
Порядок постоянных обработчиков повторяет прежний порядок подмен: кто ставился позже, тот срабатывал раньше —
кавычки (основа) 10 < «звук прежде слов» zv150 20 < окно зверей zver155 30 < клавиша E put165 40.
Повторный запуск ничего не меняет."""
H="/root/S/hron/"
def patch(f,pairs):
    s=open(H+f,encoding="utf-8").read();n=0
    for a,b in pairs:
        if b in s: continue
        assert s.count(a)==1,(f,a[:80]);s=s.replace(a,b);n+=1
    open(H+f,"w",encoding="utf-8").write(s);print(f,"правок:",n)
patch("zv150_late.js",[
("""run(ms,fn,self,args){const s0=Speech.say;let первая=true;this.тихо++;
  Speech.say=function(t,o){if(первая&&!(o&&o.cat==="ui")){первая=false;const a=arguments,me=this;
    if(ms>0){setTimeout(()=>safeFn(()=>s0.apply(me,a)),ms);return true;}}return s0.apply(this,arguments);};
  try{return fn.apply(self,args||[]);}finally{Speech.say=s0;this.tihoOff();}},""",
"""run(ms,fn,self,args){let первая=true;this.тихо++;
  try{return Speech.на_время(()=>fn.apply(self,args||[]),function(t,o,дальше){if(первая&&!(o&&o.cat==="ui")){первая=false;
    if(ms>0){setTimeout(()=>safeFn(()=>дальше(t,o)),ms);return true;}}return дальше(t,o);},"звук прежде слов");}
  finally{this.tihoOff();}},"""),
("""const s0=Speech.say;Speech.say=function(t,o){if(o&&o.cat==="ui")return true;return s0.apply(this,arguments);};
 try{return sh0.apply(this,arguments);}finally{Speech.say=s0;}};});""",
"""const me=this,a=arguments;
 return Speech.на_время(()=>sh0.apply(me,a),(t,o,дальше)=>{if(o&&o.cat==="ui")return true;return дальше(t,o);},"окно обновляется молча");};});"""),
("""safeFn(()=>{const s0=Speech.say;Speech.say=function(t,o){
 if(ZvLater.text&&Date.now()-ZvLater.t<150&&String(t)===ZvLater.text){const ms=ZvLater.ms;ZvLater.text="";const a=arguments,me=this;setTimeout(()=>safeFn(()=>s0.apply(me,a)),ms);return true;}
 return s0.apply(this,arguments);};});""",
"""safeFn(()=>{Speech.use("посадка — звук прежде слов",function(t,o,дальше){
 if(ZvLater.text&&Date.now()-ZvLater.t<150&&String(t)===ZvLater.text){const ms=ZvLater.ms;ZvLater.text="";setTimeout(()=>safeFn(()=>дальше(t,o)),ms);return true;}
 return дальше(t,o);},20);});"""),
])
patch("door147_late.js",[
("""const sy0=Speech.say;let r;
 Speech.say=function(t,o){
  if(typeof t==="string"){""",
"""const me=this,a=arguments;
 return Speech.на_время(()=>mv0.apply(me,a),function(t,o,дальше){
  if(typeof t==="string"){"""),
("""  return sy0.apply(Speech,[t,o].concat(Array.prototype.slice.call(arguments,2)));};
 try{r=mv0.apply(this,arguments);}finally{Speech.say=sy0;}
 return r;};});""",
"""  return дальше(t,o);},"у ворот и дверей");};});"""),
])
patch("zver155_late.js",[
("""const sv=Speech.say;Speech.say=function(t,o){return sv.call(Speech,String(t).replace("отходит в сторону и ждёт","идёт рядом с вами"),o);};
 let r;try{r=dm0.apply(this,arguments);}finally{Speech.say=sv;}safeFn(()=>Маунт155.рядом("leg:"+id));return r;};});""",
"""const me=this,a=arguments;
 const r=Speech.на_время(()=>dm0.apply(me,a),(t,o,дальше)=>дальше(String(t).replace("отходит в сторону и ждёт","идёт рядом с вами"),o),"скакун идёт рядом");
 safeFn(()=>Маунт155.рядом("leg:"+id));return r;};});"""),
("""safeFn(()=>{const s0=Speech.say;Speech.say=function(t,o){
 try{if(ОкноЗвери155.открыто()&&ОкноЗвери155.фон(t,o)){
   ОкноЗвери155.очередь.push({s:String(t),t:Date.now()});if(ОкноЗвери155.очередь.length>12)ОкноЗвери155.очередь.shift();return true;}}catch(_){}
 return s0.apply(Speech,arguments);};});""",
"""safeFn(()=>{Speech.use("окно зверей — фон после",function(t,o,дальше){
 try{if(ОкноЗвери155.открыто()&&ОкноЗвери155.фон(t,o)){
   ОкноЗвери155.очередь.push({s:String(t),t:Date.now()});if(ОкноЗвери155.очередь.length>12)ОкноЗвери155.очередь.shift();return true;}}catch(_){}
 return дальше(t,o);},30);});"""),
])
patch("put165_late.js",[
("""const n0=Speech.say;let сказано=false;
 Speech.say=function(t){
  if(typeof t==="string"&&/^Поражение\\.\\.\\. Вы очнулись у стен столицы/.test(t)){сказано=true;
   t=t.replace(/Вы очнулись у стен столицы «[^»]*», под открытым небом\\./,Возрождение165.слова(ц));}
  const a=Array.prototype.slice.call(arguments);a[0]=t;return n0.apply(Speech,a);};
 let r;try{r=d0.apply(this,arguments);}finally{Speech.say=n0;}""",
"""let сказано=false;const me=this,аргументы=arguments;
 const r=Speech.на_время(()=>d0.apply(me,аргументы),function(t,o,дальше){
  if(typeof t==="string"&&/^Поражение\\.\\.\\. Вы очнулись у стен столицы/.test(t)){сказано=true;
   t=t.replace(/Вы очнулись у стен столицы «[^»]*», под открытым небом\\./,Возрождение165.слова(ц));}
  return дальше(t,o);},"очнулись у ближнего поселения");"""),
("""safeFn(()=>{const n0=Speech.say;Speech.say=function(t){
 if(typeof t==="string"&&safeFn(()=>isDesktopApp(),false)){const a=Array.prototype.slice.call(arguments);a[0]=ДверьE165.слова(t);return n0.apply(Speech,a);}
 return n0.apply(Speech,arguments);};});""",
"""safeFn(()=>{Speech.use("клавиша E вместо касаний",function(t,o,дальше){
 if(typeof t==="string"&&safeFn(()=>isDesktopApp(),false))return дальше(ДверьE165.слова(t),o);
 return дальше(t,o);},40);});"""),
])
patch("vyuchka165_late.js",[
("""const захват=[];const n0=Speech.say;
  if(!последний)Speech.say=function(){захват.push(Array.prototype.slice.call(arguments));return true;};
  Верхом165.i=i;try{r=m0.call(this,dir);}finally{Speech.say=n0;Верхом165.i=0;}""",
"""const захват=[];const me=this;
  Верхом165.i=i;try{r=последний?m0.call(me,dir):Speech.на_время(()=>m0.call(me,dir),(t,o)=>{захват.push([t,o]);return true;},"верхом — слова промежуточных клеток");}
  finally{Верхом165.i=0;}"""),
("""if(стоп){захват.forEach(a=>{try{n0.apply(Speech,a);}catch(_){}});break;}}""",
"""if(стоп){захват.forEach(a=>{try{Speech.say(a[0],a[1]);}catch(_){}});break;}}"""),
])
