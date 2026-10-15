"""release175i.py — З4 (дополнение): дело общего такта снимается и привычным clearInterval(ручка) — так его
останавливают чужой код и проверочные наборы; Такт.снять(ручка) понимает и ручку такта, и число таймера.
Повторный запуск ничего не меняет."""
B="/root/S/hron/index_before_mater.html"
s=open(B,encoding="utf-8").read()
def rep(a,b,name):
    global s
    if b in s: return
    assert s.count(a)==1,("нет: "+name)
    s=s.replace(a,b);print(name)
rep('''  this.дела.push(д);this.завести();const self=this;
  return function снять(){if(д.снят)return;д.снят=true;self.дела=self.дела.filter(x=>x!==д);self.завести();};},''',
'''  this.дела.push(д);this.завести();const self=this;
  const снять=function снять(){if(д.снят)return;д.снят=true;self.дела=self.дела.filter(x=>x!==д);self.завести();};
  снять.такт=true;return снять;},
 /* снять дело по ручке: ручка такта или число обычного таймера */
 снять(h){if(typeof h==="function"&&h.такт)h();else if(h!=null)clearInterval(h);},''',"Такт.снять")
rep('''try{document.addEventListener("visibilitychange",()=>{
 if(!document.hidden){const now=Date.now();Такт.проснулся=now;for(const д of Такт.дела)if(д.след<now)д.след=now;}
 Такт.завести();});}catch(_){}''','''try{document.addEventListener("visibilitychange",()=>{
 if(!document.hidden){const now=Date.now();Такт.проснулся=now;for(const д of Такт.дела)if(д.след<now)д.след=now;}
 Такт.завести();});}catch(_){}
/* clearInterval(ручка такта) снимает дело такта — как снимал свой таймер прежде */
try{const ci0=window.clearInterval;window.clearInterval=function(h){if(typeof h==="function"&&h.такт){h();return;}return ci0.apply(this,arguments);};}catch(_){}''',"clearInterval")
rep(''' stop(){if(this.iv){this.iv();this.iv=null;}this.key=null;this.list=[];},''',''' stop(){if(this.iv){Такт.снять(this.iv);this.iv=null;}this.key=null;this.list=[];},''',"живые: стоп")
rep('''  if(this.iv){this.iv();this.iv=null;}
  this.key=k;this.list=[];''','''  if(this.iv){Такт.снять(this.iv);this.iv=null;}
  this.key=k;this.list=[];''',"живые: заново")
rep(''' stop(){if(this.iv){this.iv();this.iv=null;}},
 /* Фон места звучит со сторон''',''' stop(){if(this.iv){Такт.снять(this.iv);this.iv=null;}},
 /* Фон места звучит со сторон''',"фон чертога: стоп")
open(B,"w",encoding="utf-8").write(s)
