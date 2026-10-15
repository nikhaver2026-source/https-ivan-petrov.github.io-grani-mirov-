"""release175e.py — З4: одни часы. Общий такт (Такт) для дел звука, речи и живого мира вместо отдельного таймера
у каждого; пока игра свёрнута, такт замирает. В основе: определение Такта, звуковая картина (Scape), живые вокруг
(Actors), фон чертогов (InstanceAudioEngine). Повторный запуск ничего не меняет."""
B="/root/S/hron/index_before_mater.html"
s=open(B,encoding="utf-8").read()
def rep(a,b,name):
    global s
    if b in s: return
    assert s.count(a)==1,("нет: "+name)
    s=s.replace(a,b);print(name)
T='''/* ── ОДНИ ЧАСЫ (17.5) ──
   Общий такт для дел звука, речи и живого мира вместо отдельного таймера у каждого: Такт.каждые(мс, дело, имя)
   ставит дело и возвращает «снять». Таймер один и заводится на ближайшее дело; дела, подошедшие почти вместе
   (в пределах 40 мс), выполняются за одно пробуждение. Пока игра свёрнута, такт замирает (кроме дел с вФоне):
   звук и так притушен, а батарея телефона цела; вернулась игра — просроченные дела идут сразу. */
const Такт={дела:[],т:null,проснулся:0,ДОПУСК:40,
 каждые(мс,fn,имя,о){const п=Math.max(16,Number(мс)||0);
  const д={мс:п,fn,имя:String(имя||"дело"),след:Date.now()+п,вФоне:!!(о&&о.вФоне),снят:false};
  this.дела.push(д);this.завести();const self=this;
  return function снять(){if(д.снят)return;д.снят=true;self.дела=self.дела.filter(x=>x!==д);self.завести();};},
 скрыто(){try{return typeof document!=="undefined"&&!!document.hidden;}catch(_){return false;}},
 завести(){if(this.т){clearTimeout(this.т);this.т=null;}
  const скр=this.скрыто();let след=Infinity;
  for(const д of this.дела)if(!скр||д.вФоне)след=Math.min(след,д.след);
  if(след===Infinity)return;
  this.т=setTimeout(()=>{this.т=null;this.тик();},Math.max(0,след-Date.now()));},
 тик(){const now=Date.now(),скр=this.скрыто();
  for(const д of this.дела.slice()){if(д.снят||(скр&&!д.вФоне)||д.след>now+this.ДОПУСК)continue;
   д.след+=д.мс;if(д.след<=now)д.след=now+д.мс;
   try{д.fn();}catch(e){try{console.warn("[Такт] "+д.имя,e);}catch(_){}}}
  this.завести();},
 список(){return this.дела.map(д=>({имя:д.имя,мс:д.мс,вФоне:д.вФоне}));}};
try{document.addEventListener("visibilitychange",()=>{
 if(!document.hidden){const now=Date.now();Такт.проснулся=now;for(const д of Такт.дела)if(д.след<now)д.след=now;}
 Такт.завести();});}catch(_){}
const Speech={voice:null,keepAlive:null,'''
rep("const Speech={voice:null,keepAlive:null,",T,"Такт")
rep('''  this.timer=setInterval(()=>safeFn(()=>{
   /* (10.0) Мир звучит, только пока на экране сам мир''','''  this.timer=Такт.каждые(1500,()=>safeFn(()=>{
   /* (10.0) Мир звучит, только пока на экране сам мир''',"звуковая картина: начало")
rep('''safeFn(()=>PatrolMarch.tick());safeFn(()=>CaravanRoll.tick());}),1500);},''','''safeFn(()=>PatrolMarch.tick());safeFn(()=>CaravanRoll.tick());}),"звуковая картина");},''',"звуковая картина: конец")
rep(''' stop(){if(this.iv){clearInterval(this.iv);this.iv=null;}this.key=null;this.list=[];},''',''' stop(){if(this.iv){this.iv();this.iv=null;}this.key=null;this.list=[];},''',"живые: стоп")
rep('''  if(this.iv){clearInterval(this.iv);this.iv=null;}
  this.key=k;this.list=[];''','''  if(this.iv){this.iv();this.iv=null;}
  this.key=k;this.list=[];''',"живые: заново")
rep('''  this.iv=setInterval(()=>safeFn(()=>Actors.tick()),1500);},''','''  this.iv=Такт.каждые(1500,()=>safeFn(()=>Actors.tick()),"живые вокруг");},''',"живые: пуск")
rep(''' start(){this.stop();this.iv=setInterval(()=>safeFn(()=>this.amb()),9000);},
 stop(){if(this.iv){clearInterval(this.iv);this.iv=null;}},
 /* Фон места звучит со сторон''',''' start(){this.stop();this.iv=Такт.каждые(9000,()=>safeFn(()=>this.amb()),"фон чертога");},
 stop(){if(this.iv){this.iv();this.iv=null;}},
 /* Фон места звучит со сторон''',"фон чертога")
open(B,"w",encoding="utf-8").write(s)
H="/root/S/hron/"
def patch(f,pairs):
    t=open(H+f,encoding="utf-8").read();n=0
    for a,b in pairs:
        if b in t: continue
        assert t.count(a)==1,(f,a[:60]);t=t.replace(a,b);n+=1
    open(H+f,"w",encoding="utf-8").write(t);print(f,"правок:",n)
patch("zvuk155_late.js",[("safeFn(()=>{setInterval(()=>safeFn(()=>Гул155.тик()),350);});","safeFn(()=>{Такт.каждые(350,()=>safeFn(()=>Гул155.тик()),\"гул места\");});")])
patch("zver155_late.js",[("safeFn(()=>{setInterval(()=>safeFn(()=>ОкноЗвери155.сброс()),1000);});","safeFn(()=>{Такт.каждые(1000,()=>safeFn(()=>ОкноЗвери155.сброс()),\"окно зверей — вести после\");});")])
patch("edin175_late.js",[("if(!this.т)this.т=setInterval(()=>this.обход(),1000);","if(!this.т)this.т=Такт.каждые(1000,()=>this.обход(),\"сторож звука\");"),
 ("this.ждут=ост;if(!ост.length){clearInterval(this.т);this.т=null;}}};","this.ждут=ост;if(!ост.length&&this.т){this.т();this.т=null;}}};"),
 ("  for(const з of this.ждут){if(з.ok)continue;const el=з.el;","  for(const з of this.ждут){if(з.ok)continue;const el=з.el;\n   /* звук, поставленный до сворачивания игры, не судим: свёрнутая игра притушила его сама */\n   if(з.t<(Такт.проснулся||0))continue;")])
