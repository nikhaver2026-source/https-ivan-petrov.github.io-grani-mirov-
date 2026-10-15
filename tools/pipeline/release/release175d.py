"""release175d.py — Р3: правила очереди речи — таблицами, один в один с прежним каскадом условий.
_фильтры.до / _фильтры.после — почему фраза не звучит (имя правила кладётся в m.причина);
_правила — кто кого перебивает, если сейчас звучит фраза (первое подошедшее; имя — в m.правило);
_действия — что делает правило: оборвать / листание / сменить / в очередь / сразу.
Повторный запуск ничего не меняет."""
B="/root/S/hron/index_before_mater.html"
s=open(B,encoding="utf-8").read()
def rep(a,b,name):
    global s
    if b in s: return
    assert s.count(a)==1,("нет: "+name)
    s=s.replace(a,b);print(name)
rep("""  if(урон==="foe"&&settings.cbDmgFoe===0)return drop();
  if(урон==="me"&&settings.cbDmgMe===0)return drop();
  if(!user&&!речь&&!урон&&cls.pri>0&&settings.cbSpeech!==1&&safeFn(()=>G.inCombat&&!!G.combat,false))return drop();""",
"""  const о={user,речь,урон};
  for(const [имя,когда] of this._фильтры.до)if(когда(m,о)){m.причина=имя;return drop();}""","фильтры до")
rep("""   if(скупо&&settings.sayAchieve===0)return drop();""",
"""   if(скупо&&settings.sayAchieve===0){m.причина="достижения при краткой подробности выключены";return drop();}""","достижения")
rep("""  if(!user){
   if(settings.autoSpeech===0&&m.pri>=2&&!(m.cat==="achieve"&&settings.sayAchieve!==0))return drop();
   if(m.cat==="desc"&&settings.autoDescribe===0)return drop();
   /* Подсказки выключены: мир — только звуками; описания места и вещей идут лишь по запросу. */
   if((m.cat==="desc"||m.cat==="object")&&settings.hints===0&&!m.user)return drop();
   if(m.cat==="object"&&settings.describeObjects===0)return drop();
   if(settings.verbosity==="min"&&m.pri>=3)return drop();}""",
"""  if(!user)for(const [имя,когда] of this._фильтры.после)if(когда(m,о)){m.причина=имя;return drop();}""","фильтры после")
rep("""  if(typeof AudioLife!=="undefined"&&AudioLife.hushed)return drop();""",
"""  if(typeof AudioLife!=="undefined"&&AudioLife.hushed){m.причина="игра притихла";return drop();}""","притихла")
R0="""  const cur=this.current;
  if(cur&&this.speaking&&cur.herald&&!m.herald&&m.pri<=2&&!m.nav){this._cut(cur,"CANCELLED");this._pushFront(m);this._pump();return m;}
  if(cur&&this.speaking&&m.nav&&cur.pri>=1){
   /* ── ЛИСТАНИЕ ГЛАВНЕЕ (9.5.1, просьба игрока) ──
      Свайп по меню обрывает всё, кроме тревоги, как в TalkBack. Прежде пункт,
      пролистанный, пока звучало имя окна или важное сообщение, вставал в
      очередь за ним — и при быстром листании промежуточные пункты пропадали,
      а нужный звучал с опозданием. Оборванная весть сама вернётся в очередь. */
   this._cut(cur,"CANCELLED");this._dropQueued(2,"CANCELLED");this.queue=this.queue.filter(x=>!x.nav);this._pushFront(m);this._pump();return m;}
  if(cur&&this.speaking){
   /* Игрок листает или сам спросил — мир не перебивает его на полуслове:
      обычная весть мира ждёт, пока пункт договорён (важное и тревога — нет).
      Прежде случайная подсказка обрывала имя пункта, и при листании меню
      голос то и дело пропадал. */
   if((cur.nav||cur.user)&&!m.user&&!m.nav&&m.pri>=2){this._push(m);return m;}
   if(m.pri<cur.pri){this._cut(cur,"CANCELLED");this._pushFront(m);this._pump();return m;}
   if(m.pri>=2&&cur.pri<=1){if(m.interrupt)this._dropQueued(2,"CANCELLED");this._push(m);return m;}
   if(m.interrupt&&m.pri>=2&&cur.pri>=2){this._cut(cur,"CANCELLED");this._dropQueued(2,"CANCELLED");this._pushFront(m);this._pump();return m;}
   /* (15.5) Книга главнее речи окон: страница, которую игрок открыл, обрывает имя закрытого или открытого окна
      и «выбрано», а не ждёт их конца (тревогу, итог дела и вести — не трогает). */
   if(m.interrupt&&m.cat==="read"&&cur.pri>=1&&!cur.keep&&!cur.herald&&(cur.cat==="ui"||cur.cat==="menu"||cur.nav)){
    this._cut(cur,"CANCELLED");this._dropQueued(2,"CANCELLED");this._pushFront(m);this._pump();return m;}
   if(m.interrupt&&m.pri<=1){this._dropQueued(2,"CANCELLED");this._push(m);return m;}
   this._push(m);return m;}
  this._pushFront(m);this._pump();return m;},"""
R1="""  /* Кто кого перебивает — по таблице правил ниже (_правила), первое подошедшее; в тишине — сразу. */
  const cur=this.current;
  const п=cur&&this.speaking?this._правила.find(r=>r.когда(m,cur)):this._правилоТишины;
  m.правило=п.имя;this._решает=п.имя;
  try{this._действия[п.делать].call(this,m,cur);}finally{this._решает=null;}
  return m;},
 /* ── ПРАВИЛА ОЧЕРЕДИ (17.5) ──
    Прежде — каскад условий внутри enqueue; теперь те же условия, в том же порядке, таблицей: у каждого
    правила имя (видно в журнале речи и звука) и своя проверка в наборе 339. */
 /* почему фраза не звучит: до разбора достижений (по важности, которую фразе дали) */
 _фильтры:{
  до:[
   /* (9.5.2) Урон вслух — по своим флажкам, и тихий бой его не глушит. */
   ["урон по твари не озвучивать",(m,о)=>о.урон==="foe"&&settings.cbDmgFoe===0],
   ["урон по вам не озвучивать",(m,о)=>о.урон==="me"&&settings.cbDmgMe===0],
   /* ТИХИЙ БОЙ (8.0): пока идёт бой — только то, о чём игрок спросил сам, слова твари и смертельная опасность */
   ["тихий бой",(m,о)=>!о.user&&!о.речь&&!о.урон&&m.pri>0&&settings.cbSpeech!==1&&safeFn(()=>G.inCombat&&!!G.combat,false)]],
  /* после разбора достижений, только для того, о чём игрок не просил */
  после:[
   ["автоозвучка выключена",(m,о)=>settings.autoSpeech===0&&m.pri>=2&&!(m.cat==="achieve"&&settings.sayAchieve!==0)],
   ["описания выключены",(m,о)=>m.cat==="desc"&&settings.autoDescribe===0],
   /* Подсказки выключены: мир — только звуками; описания места и вещей идут лишь по запросу. */
   ["подсказки выключены",(m,о)=>(m.cat==="desc"||m.cat==="object")&&settings.hints===0&&!m.user],
   ["описания предметов выключены",(m,о)=>m.cat==="object"&&settings.describeObjects===0],
   ["минимальная подробность",(m,о)=>settings.verbosity==="min"&&m.pri>=3]]},
 /* сейчас звучит фраза cur, пришла m: первое подошедшее правило решает */
 _правила:[
  /* ВЕСТНИК ПОСЛЕ ДЕЛА (6.0): весть уступает сведению о деле (до 2-й важности) и договорится следом */
  {имя:"весть уступает делу",когда:(m,cur)=>cur.herald&&!m.herald&&m.pri<=2&&!m.nav,делать:"оборвать"},
  /* ── ЛИСТАНИЕ ГЛАВНЕЕ (9.5.1, просьба игрока) ──
     Свайп по меню обрывает всё, кроме тревоги, как в TalkBack. Прежде пункт,
     пролистанный, пока звучало имя окна или важное сообщение, вставал в
     очередь за ним — и при быстром листании промежуточные пункты пропадали,
     а нужный звучал с опозданием. Оборванная весть сама вернётся в очередь. */
  {имя:"листание главнее",когда:(m,cur)=>m.nav&&cur.pri>=1,делать:"листание"},
  /* Игрок листает или сам спросил — мир не перебивает его на полуслове:
     обычная весть мира ждёт, пока пункт договорён (важное и тревога — нет).
     Прежде случайная подсказка обрывала имя пункта, и при листании меню
     голос то и дело пропадал. */
  {имя:"мир ждёт листания и просьбы",когда:(m,cur)=>(cur.nav||cur.user)&&!m.user&&!m.nav&&m.pri>=2,делать:"в очередь"},
  {имя:"важнее звучащего",когда:(m,cur)=>m.pri<cur.pri,делать:"оборвать"},
  {имя:"мелочь после важного",когда:(m,cur)=>m.pri>=2&&cur.pri<=1,делать:"в очередь, сняв мелочь, если перебивает"},
  {имя:"мелочь сменяет мелочь",когда:(m,cur)=>m.interrupt&&m.pri>=2&&cur.pri>=2,делать:"сменить"},
  /* (15.5) Книга главнее речи окон: страница, которую игрок открыл, обрывает имя закрытого или открытого окна
     и «выбрано», а не ждёт их конца (тревогу, итог дела и вести — не трогает). */
  {имя:"книга главнее окон",когда:(m,cur)=>m.interrupt&&m.cat==="read"&&cur.pri>=1&&!cur.keep&&!cur.herald&&(cur.cat==="ui"||cur.cat==="menu"||cur.nav),делать:"сменить"},
  {имя:"важное — следом, мелочь снять",когда:(m,cur)=>m.interrupt&&m.pri<=1,делать:"снять мелочь и в очередь"},
  {имя:"по порядку",когда:()=>true,делать:"в очередь"}],
 _правилоТишины:{имя:"в тишине — сразу",делать:"сразу"},
 _действия:{
  "оборвать"(m,cur){this._cut(cur,"CANCELLED");this._pushFront(m);this._pump();},
  "листание"(m,cur){this._cut(cur,"CANCELLED");this._dropQueued(2,"CANCELLED");this.queue=this.queue.filter(x=>!x.nav);this._pushFront(m);this._pump();},
  "сменить"(m,cur){this._cut(cur,"CANCELLED");this._dropQueued(2,"CANCELLED");this._pushFront(m);this._pump();},
  "в очередь"(m){this._push(m);},
  "в очередь, сняв мелочь, если перебивает"(m){if(m.interrupt)this._dropQueued(2,"CANCELLED");this._push(m);},
  "снять мелочь и в очередь"(m){this._dropQueued(2,"CANCELLED");this._push(m);},
  "сразу"(m){this._pushFront(m);this._pump();}},"""
rep(R0,R1,"правила маршрута")
open(B,"w",encoding="utf-8").write(s)
