H='/tmp/claude-0/-home-user-https-ivan-petrov-github-io-grani-mirov-/27f5cebc-2d4b-556f-9c1f-bc733d69f26b/scratchpad/hron/'
early=open(H+'mater_early.js',encoding='utf-8').read()
import os, sys
PHASE=int(os.environ.get('PHASE','9'))
late=open(H+'mater_hydro.js',encoding='utf-8').read()+"\n"+open(H+'mater_mod.js',encoding='utf-8').read()+"\n"+open(H+'mater_hooks.js',encoding='utf-8').read()
if PHASE>=4:
    late+="\n"+open(H+'thr_late.js',encoding='utf-8').read()
if PHASE>=5:
    late+="\n"+open(H+'mag_late.js',encoding='utf-8').read()
if PHASE>=6:
    late+="\n"+open(H+'lc_late.js',encoding='utf-8').read()
if PHASE>=7:
    late+="\n"+open(H+'tales_late.js',encoding='utf-8').read()
if PHASE>=8:
    late+="\n"+open(H+'snd_late.js',encoding='utf-8').read()
if PHASE>=9:
    late+="\n"+open(H+'dircheck_late.js',encoding='utf-8').read()
    # 14.6: исправления по просьбам игрока (итог задания, награды, вещи у лестницы, слоты заклинаний).
    fx=open(H+'fix146_late.js',encoding='utf-8').read()
    # 14.6: щелчки ползунка и переключателя — в самой игре (сеть странице закрыта, fetch нельзя).
    import base64,json as _json,re as _re
    _ub=open(H+'index_before_mater.html',encoding='utf-8').read()
    _tik={}
    for _k in ("ui_slider_up","ui_slider_down","ui_toggle_on","ui_toggle_off"):
        _m=_re.search(r'\b'+_k+r':"([^"]+)"',_ub[_ub.index("const UI_BANK"):]);assert _m,_k
        _tik[_k]=base64.b64encode(open('/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds/'+_m.group(1),'rb').read()).decode()
    assert fx.count("/*@ТИК_ЗАПИСИ@*/{}")==1
    fx=fx.replace("/*@ТИК_ЗАПИСИ@*/{}",_json.dumps(_tik))
    late+="\n"+fx
    # 14.6: звери слышны — спутник, верховая езда, рост, еда; торговля со счётом.
    # Громкость записей зверей — по замеру (zv_level.py пишет zv_level.json).
    zv=open(H+'zv146_late.js',encoding='utf-8').read()
    _lv=_json.load(open(H+'zv_level.json',encoding='utf-8'))
    assert zv.count("/*@ZV_LEVEL@*/{}")==1 and len(_lv)>100
    zv=zv.replace("/*@ZV_LEVEL@*/{}",_json.dumps(_lv,ensure_ascii=False,separators=(",",":"),sort_keys=True))
    late+="\n"+zv
    # 15.0: голоса — новые реплики героя в разговоре, женское обращение жителей к героине
    # (данные — uni/uniapply.py → voice150_data.json; нет данных — модуль не ставится).
    if os.path.exists(H+'voice150_data.json'):
        vc=open(H+'voice150_late.js',encoding='utf-8').read();_vd=_json.load(open(H+'voice150_data.json',encoding='utf-8'))
        assert vc.count("/*@HERO_VARS@*/{}")==1 and vc.count("/*@FEM_NPC@*/{}")==1
        vc=vc.replace("/*@HERO_VARS@*/{}",_json.dumps(_vd.get("hero_vars",{}),ensure_ascii=False,separators=(",",":"),sort_keys=True))
        vc=vc.replace("/*@FEM_NPC@*/{}",_json.dumps(_vd.get("fem",{}),ensure_ascii=False,separators=(",",":"),sort_keys=True))
        late+="\n"+vc
    # 15.0: питомцы и маунты — посадка в седло, звук прежде слов, свой звук у ветвей развития, способности рода.
    if os.path.exists(H+'zv150_late.js'):
        late+="\n"+open(H+'zv150_late.js',encoding='utf-8').read()
    # 15.0: задания — десять побочных на день, новые роды дел, основное задание с целью.
    if os.path.exists(H+'q150_late.js'):
        late+="\n"+open(H+'q150_late.js',encoding='utf-8').read()
    # 14.7: двери закрыты — герой открывает сам; стража у ворот поселений с платой за вход;
    # «Постучаться / Открыть» у мастерских и служб; вход в сокровищницу; H и Shift+H в Windows.
    if os.path.exists(H+'door147_late.js'):
        late+="\n"+open(H+'door147_late.js',encoding='utf-8').read()
    # (15.0) древние подъёмники и Немота — Нулевой Предел: ядро, твари, вещи и люди, «Немая штольня»;
    # поиск под рукой, тайные ходы (лаз назван, вход шагом и касанием, после находки закрыт), завал не зря
    for f in ('lift150_late.js','nem150_late.js','nem150b_late.js','nem150c_late.js','nem150d_late.js','poisk150_late.js','taina150_late.js','zagadki150_late.js','zaval150_late.js','nem155_late.js','glub155_late.js','zver155_late.js','zvuk155_late.js','prolog155_late.js','svod155_late.js','zhivye155_late.js','torg160_late.js','konec155_late.js'):
        if os.path.exists(H+f):
            late+="\n"+open(H+f,encoding='utf-8').read()
open(H+'mater_late.js','w',encoding='utf-8').write(late)
R='/home/user/https-ivan-petrov.github.io-grani-mirov-/'
s=open(H+'index_before_mater.html',encoding='utf-8').read()
def rep(old,new,cnt=1):
    global s
    k=s.count(old);assert k==cnt,(old[:80],k);s=s.replace(old,new)
rep("const WORLD_MAX=1000000;","const WORLD_MAX=20000000;\n/* (14.5) Прежний край мира: полоса Перекроя кончается на миллионе, дальше — Великие Материки. */\nconst PRK_MAX=1000000;")
rep("const cap=l.ось===\"восток\"?{x:905000,y:Math.round(l.доля*WORLD_MAX)}","const cap=l.ось===\"восток\"?{x:905000,y:Math.round(l.доля*PRK_MAX)}")
rep(" if(x>=WORLD_MAX||y>=WORLD_MAX)return null;\n /* Глубже в полосе"," if(x>=PRK_MAX||y>=PRK_MAX)return null;\n /* Глубже в полосе")
rep(" const край=Math.min(1,(WORLD_MAX-Math.max(x,y))/9000);"," const край=Math.min(1,(PRK_MAX-Math.max(x,y))/9000);")
rep("const inPrk=(x,y)=>x>=PRK_EDGE||y>=PRK_EDGE;","const inPrk=(x,y)=>(x>=PRK_EDGE||y>=PRK_EDGE)&&x<PRK_MAX&&y<PRK_MAX;")
rep("capCells.add(e.cap.x*1048576+e.cap.y);}","capCells.add(e.cap.x*33554432+e.cap.y);}")
rep(" return capCells.has(x*1048576+y);}"," return capCells.has(x*33554432+y);}")
# Узлы решётки шума: значение узла — чистый хэш трёх чисел, и считать его дешевле, чем искать в таблице
# (прежний кэш со строковым ключом «зерно:x,y» был в десять с лишним раз медленнее самого хэша). Те же значения.
rep("/* Узлы решётки: соседние клетки делят одни и те же четыре угла, поэтому на\n   клетку приходится меньше одного нового узла. */\nconst latticeCache=new Map();\nfunction latticeVal(ix,iy,seed){\n const k=seed+\":\"+ix+\",\"+iy;\n let v=latticeCache.get(k);\n if(v===undefined){\n  v=hashName(ix,iy,seed);\n  if(latticeCache.size>240000)latticeCache.clear();\n  latticeCache.set(k,v);}\n return v;}",
    "/* Узлы решётки: значение узла — чистый хэш трёх чисел. Прежде узлы держались в\n   таблице со строковым ключом, но поиск в ней стоил в десять с лишним раз дороже\n   самого хэша: мир в двадцать миллионов клеток выводился медленно. (14.5) */\nfunction latticeVal(ix,iy,seed){return hashName(ix,iy,seed);}")
# Войны дня — чистая функция дня и сдвигов дипломатии: кэш держит последние тридцать два дня, а не один.
# Прежде цены и хозяйство, заглядывая в соседние дни, сбрасывали кэш друг другу, и войны всех ста держав
# пересчитывались десятки раз за один день мира.
rep(" const d=Number(day)||1;\n if(WARS_RAW_CACHE&&WARS_RAW_CACHE.day===d&&WARS_RAW_CACHE.nudge===warsNudgeKey())return WARS_RAW_CACHE.out;\n const out=warsBuild(d);\n WARS_RAW_CACHE={day:d,nudge:warsNudgeKey(),out};\n return out;}",
    " const d=Number(day)||1;const nk=warsNudgeKey();\n if(!WARS_RAW_CACHE||WARS_RAW_CACHE.nudge!==nk)WARS_RAW_CACHE={nudge:nk,days:new Map()};\n const был=WARS_RAW_CACHE.days.get(d);if(был)return был;\n const out=warsBuild(d);\n WARS_RAW_CACHE.days.set(d,out);if(WARS_RAW_CACHE.days.size>32)WARS_RAW_CACHE.days.delete(WARS_RAW_CACHE.days.keys().next().value);\n return out;}")
# Ключ кэша соседства держав: при шестидесяти четырёх и больше державах «min*64+max» совпадал у разных пар.
rep(" const k=Math.min(i,j)*64+Math.max(i,j);"," const k=Math.min(i,j)*1024+Math.max(i,j);")
# Водопой — дорогой множитель (обход соседних клеток), а нужен он только при выборе, КТО встретится, то есть
# клетке, что уже прошла жребий встречи (одной из десяти). Считается после жребия — ответ тот же самый.
rep("""  w*=0.55+1.6*у;
  w+=thirstPull(m,x,y,phase);
  return Math.max(0,w);});
 const сумма=веса.reduce((a,v)=>a+v,0);
 if(сумма<=0)return null;""","""  w*=0.55+1.6*у;
  return w;});""")
rep(""" if(жребий>=доля)return null;
 let бросок=hashName(x,y,32)*сумма,i=0;""",""" if(жребий>=доля)return null;
 /* (14.5) Водопой — после жребия: обход соседних клеток нужен только той клетке, где встреча
    уже выпала, и только чтобы решить, кто именно встретится. Ответ тот же, что прежде. */
 for(let j=0;j<веса.length;j++)веса[j]=Math.max(0,веса[j]+thirstPull(cand[j],x,y,phase));
 const сумма=веса.reduce((a,v)=>a+v,0);
 if(сумма<=0)return null;
 let бросок=hashName(x,y,32)*сумма,i=0;""")
# Водопой: кольцо ближайшей воды (1–3 клетки) — одно на клетку, а не на каждую тварь-кандидата. Прежде ночью
# каждая жаждущая тварь заново обходила до сорока восьми соседних клеток, и на Великих Материках, где рельеф
# дорог, клетки ночью считались впятеро дольше, чем днём. Тот же ответ.
rep(""" const жажда=Number(m.вода)||0;
 if(жажда<=0||phase==="день")return 0;
 for(let r=1;r<=3;r++)
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
   const c=safeFn(()=>terrainAt(x+dx,y+dy),null);
   if(c&&c[0]==="coast")return жажда*(1-(r-1)/3);}
 return 0;}""",""" const жажда=Number(m.вода)||0;
 if(жажда<=0||phase==="день")return 0;
 const r=waterRing(x,y);
 return r?жажда*(1-(r-1)/3):0;}
/* (14.5) Кольцо ближайшей воды вокруг клетки: 1–3, или 0 — воды нет. Оно одно для всех тварей
   клетки, поэтому считается один раз и помнится (рельеф мира не меняется). */
const WATER_RING=new Map();
function waterRing(x,y){
 const k=x+","+y;const был=WATER_RING.get(k);if(был!==undefined)return был;
 let v=0;
 найти:for(let r=1;r<=3;r++)
  for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
   if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
   const c=safeFn(()=>terrainAt(x+dx,y+dy),null);
   if(c&&c[0]==="coast"){v=r;break найти;}}
 if(WATER_RING.size>=40000)WATER_RING.clear();
 WATER_RING.set(k,v);return v;}""")
if PHASE>=4:
    # Фаза IV: державы одного материка — соседи (могут воевать); у материков своя доля войн, как у Круга, Заморья и Сплетения.
    rep(" let r;\n if(A.дальний&&B.дальний)r=Math.hypot(A.cap.x-B.cap.x,A.cap.y-B.cap.y)<0.25*WORLD;",
        " let r;\n /* 14.5: державы Великих Материков соседствуют внутри своего материка; через океан войска не ходят. */\n if(A.материк||B.материк)r=!!A.материк&&A.материк===B.материк;\n else if(A.дальний&&B.дальний)r=Math.hypot(A.cap.x-B.cap.x,A.cap.y-B.cap.y)<0.25*WORLD;")
    rep(" const круг=w=>EMPIRES[w.a].дальний&&EMPIRES[w.b].дальний&&!EMPIRES[w.a].заморье&&!EMPIRES[w.b].заморье&&!EMPIRES[w.a].сплетение&&!EMPIRES[w.b].сплетение;",
        " const круг=w=>EMPIRES[w.a].дальний&&EMPIRES[w.b].дальний&&!EMPIRES[w.a].заморье&&!EMPIRES[w.b].заморье&&!EMPIRES[w.a].сплетение&&!EMPIRES[w.b].сплетение&&!EMPIRES[w.a].материк&&!EMPIRES[w.b].материк;\n /* 14.5: войны Великих Материков — между державами одного материка, своя доля. */\n const мат=w=>EMPIRES[w.a].материк&&EMPIRES[w.b].материк;")
    rep(",ужать(out.filter(спл),SPL_REALMS.length));}",",ужать(out.filter(спл),SPL_REALMS.length),ужать(out.filter(мат),EMPIRES.filter(e=>e.материк).length));}")
# Своды не подменяют своей тварью владыку течения: это сюжетный противник легенды, а не встречный зверь.
rep("  if(!m||m.boss||m.дуэль||m.синдикат||m.путь)return m;\n  const sb=SVD_SEABEAST_BY_ID[m.id];","  if(!m||m.boss||m.дуэль||m.синдикат||m.путь||(m.dw&&m.dw.lord))return m;\n  const sb=SVD_SEABEAST_BY_ID[m.id];")
# Сеть Граней: у места «Грань» свой долгий фон — воздух её класса; без известной Грани — стабильная.
rep('PLACE_KIND.gran="gran";\n','PLACE_KIND.gran="gran";\n/* Свой долгий фон у Грани: воздух её класса (стабильная звенит подвесками, искажённая плывёт…); без известной Грани — стабильная. */\nSOUND_BANK.bed_gran={f:["hron/bed_gran.ogg"],d:"Грань: воздух чужого мира, приглушённый, как сквозь стены"};PLACE_BED.gran="bed_gran";\n{const pb0=placeBed;placeBed=matKeep(pb0,function(p){if(p&&p.stype==="gran"&&p.gran&&!((Number(p.depth)||0)>0)){const z=safeFn(()=>Grani.cls(Grani.facet(p.gran.id)).звук,null);if(z&&Bank.has(z))return z;}return pb0.apply(this,arguments);});}\n')
if PHASE>=5:
    # Фаза V: десять новых школ — прямо в таблицы чар (школы, стихии, звуки, специализации, именные чары).
    sys.path.insert(0,H)
    import mag_data
    mag_data.patch(s,rep)
if PHASE>=9:
    # 14.6: итог дела договаривается — реплика «итог» того же действия не обрывается окном.
    rep("enqueue(text,{interrupt=true,onDone=null,pri=null,cat=null,key=null,ttl=null,user=false,persistent=false,ждать=0,nav=false,речь=false,урон=null}={}){",
        "enqueue(text,{interrupt=true,onDone=null,pri=null,cat=null,key=null,ttl=null,user=false,persistent=false,ждать=0,nav=false,речь=false,урон=null,итог=false}={}){")
    rep("   interrupt:interrupt!==false,createdAt:Date.now(),ttl:ttl!=null?Number(ttl):(this.TTL[cls.pri]||0),onDone,state:\"QUEUED\",parts:null};\n  /* (15.0) Живая область для чтеца экрана",
        "   interrupt:interrupt!==false,createdAt:Date.now(),ttl:ttl!=null?Number(ttl):(this.TTL[cls.pri]||0),onDone,state:\"QUEUED\",parts:null};\n  m.task=this._task();m.keep=!!итог;\n  /* (15.0) Живая область для чтеца экрана")
    rep("  const cur=this.current;\n  if(cur&&this.speaking&&cur.herald",
        "  const cur=this.current;\n"
        "  /* ── ИТОГ ДЕЛА ДОГОВАРИВАЕТСЯ (14.6, просьба игрока) ──\n"
        "     Задание яруса, чертога или Сводов говорит итог («Загадка решена! 40\n"
        "     золота…»), и тем же действием открывается окно. Прежде имя окна\n"
        "     обрывало итог на первом слове: игрок не слышал, что сделано и что\n"
        "     получено. Теперь реплика-итог того же действия не обрывается и не\n"
        "     выпадает из очереди: окно звучит сразу за ней. */\n"
        "  const тотЖе=x=>!!x&&x.keep&&x.task===m.task&&x.state!==\"CANCELLED\";\n"
        "  if(!m.nav&&!m.keep&&(тотЖе(cur)||this.queue.some(тотЖе))){\n"
        "   for(const x of [cur,...this.queue])if(тотЖе(x)&&x.pri>m.pri){x.pri=m.pri;x.ttl=this.TTL[m.pri]||0;}\n"
        "   if(cur&&this.speaking&&cur.task!==m.task&&(m.pri<cur.pri||(m.interrupt&&m.pri>=2&&cur.pri>=2)))this._cut(cur,\"CANCELLED\");\n"
        "   if(m.interrupt){const keep=[],gone=[];this.queue.forEach(x=>(x.task!==m.task&&x.pri>=2&&!x.persistent?gone:keep).push(x));this.queue=keep;\n"
        "    gone.forEach(x=>{x.state=\"CANCELLED\";this.stats.dropped++;if(x.onDone)setTimeout(()=>{try{x.onDone();}catch(e){}},10);});}\n"
        "   this._push(m);this._pump();return m;}\n"
        "  if(cur&&this.speaking&&cur.herald")
    rep(" _push(m){m.state=\"QUEUED\";",
        " /* (14.6) Одно действие — один такт речи: реплики, сказанные в нём, узнают друг друга. */\n"
        " _task(){if(!this._taskOpen){this._taskOpen=true;this._taskId=(this._taskId||0)+1;const f=()=>{this._taskOpen=false;};try{queueMicrotask(f);}catch(_){Promise.resolve().then(f);}}return this._taskId;},\n"
        " _push(m){m.state=\"QUEUED\";")
    # 14.6: вещи яруса — не вплотную к лестнице и выходу.
    rep("  if(lvl){for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++)if(lvl.g[y][x]===\".\")out.push({x,y});}\n  const R=this.rng(hashName(s.bx+i*31,s.by+i*17,7531)*4294967296);",
        "  if(lvl){const бок=(x,y)=>{for(let j=-1;j<=1;j++)for(let k=-1;k<=1;k++){const c=(lvl.g[y+j]||[])[x+k];if(c===\"<\"||c===\">\"||c===\"G\")return true;}return false;};\n"
        "   for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++)if(lvl.g[y][x]===\".\"&&!бок(x,y))out.push({x,y});\n"
        "   if(!out.length)for(let y=1;y<lvl.h-1;y++)for(let x=1;x<lvl.w-1;x++)if(lvl.g[y][x]===\".\")out.push({x,y});}\n"
        "  const R=this.rng(hashName(s.bx+i*31,s.by+i*17,7531)*4294967296);")
    # 14.6: клавиши слотов (Windows) — по слотам героя.
    rep("KB_CASTSLOT=i=>()=>{const sp=SPELLS[i];","KB_CASTSLOT=i=>()=>{const ci=mslotCat(i);const sp=SPELLS[ci];")
    rep("narrate(`Слот ${i+1}: ${sp.n}.`,{interrupt:true});safeFn(()=>castSpell(i));return true;};",
        "narrate(`Слот ${i+1}: ${sp.n}.`,{interrupt:true});safeFn(()=>castSpell(ci));return true;};")
if PHASE>=9:
    # 14.6: шаг на клетку зверя — встреча, а не бой (бой — когда игрок вынимает оружие; зверь может напасть и сам).
    rep("  stopRun();startCombat(c);refresh();return;}\n if(c.structure){structureDoorSfx",
        "  stopRun();\n  /* (14.6) Зверь, которого можно приручить, не бросается всякий раз: это встреча, бой — по воле игрока. */\n  if(safeFn(()=>BeastMeet.meet(c),false)){refresh();return;}\n  startCombat(c);refresh();return;}\n if(c.structure){structureDoorSfx")
    # 14.6: бродячие подземелья слышны все, кто шагнул, — со своей клетки; рык «рядом» — оттуда, где тварь.
    rep('  if(nearest&&nearest.a.kind==="mob"&&nearest.d<=safeFn(()=>beastRad(),8))this.sound(nearest.a,nearest.d);',
        '  /* (14.6) Слышен каждый бродячий, сделавший шаг, — со своей клетки; стоящий рядом изредка дышит. */\n  safeFn(()=>mobSteps(this,nearest));')
    rep('    safeFn(()=>Bank.play("lug_growl",{gain:0.6,maxSec:5}));',
        '    safeFn(()=>Actors.voice(a,"lug_growl",{gain:0.6,maxSec:5}));')
    rep('    const шагРоль=["giant","dragon","construct"].includes(род)&&Bank.has("stomp")?"stomp":(prof.step&&Bank.has(prof.step)?prof.step:"oc_step_hard");',
        '    /* (14.6) Летучая хлопает крыльями, дух проносится вихрем — не ступает ногами. */\n'
        '    const шагРоль=safeFn(()=>foeMoveRole(a.m),null)||(["giant","dragon","construct"].includes(род)&&Bank.has("stomp")?"stomp":(prof.step&&Bank.has(prof.step)?prof.step:"oc_step_hard"));\n'
        '    const движ=safeFn(()=>foeMoveLayer(a.m),prof.move);')
    rep('    if(prof.move&&Bank.has(prof.move)&&a.шн%2===0)setTimeout(()=>safeFn(()=>Spatial.role(prof.move,dx,dy,{gain:g2*0.8,maxSec:1.6})),170);',
        '    if(движ&&Bank.has(движ)&&a.шн%2===0)setTimeout(()=>safeFn(()=>Spatial.role(движ,dx,dy,{gain:g2*0.8,maxSec:1.6})),170);')
    rep('    this.lastMobStep={id:a.m&&a.m.id,роль:шагРоль,движение:prof.move||null,gain:g2,t:Date.now()};',
        '    this.lastMobStep={id:a.m&&a.m.id,роль:шагРоль,движение:движ||null,gain:g2,t:Date.now()};')
    # 14.6: прыжок хищника на поле боя слышен с места приземления.
    rep("   /* Прыжок — туда, где вы стояли: тварь приземляется рядом с той клеткой. */\n"
        "   for(let i=0;i<2&&Math.max(Math.abs(a.fx-w.tx),Math.abs(a.fy-w.ty))>1;i++){\n"
        "    const dx=Math.sign(w.tx-a.fx),dy=Math.sign(w.ty-a.fy);\n"
        "    if(this.canStep(a,a.fx+dx,a.fy+dy)){a.fx+=dx;a.fy+=dy;}else break;}\n"
        "   hit=a.px===w.tx&&a.py===w.ty&&this.dist(a)<=1;}",
        "   /* Прыжок — туда, где вы стояли: тварь приземляется рядом с той клеткой. */\n"
        "   let прыг=false;\n"
        "   for(let i=0;i<2&&Math.max(Math.abs(a.fx-w.tx),Math.abs(a.fy-w.ty))>1;i++){\n"
        "    const dx=Math.sign(w.tx-a.fx),dy=Math.sign(w.ty-a.fy);\n"
        "    if(this.canStep(a,a.fx+dx,a.fy+dy)){a.fx+=dx;a.fy+=dy;прыг=true;}else break;}\n"
        "   /* (14.6) Приземление слышно с нового места: тварь не переносится молча. */\n"
        "   if(прыг)safeFn(()=>foeProfileCue(m,\"step\",{gain:0.8}));\n"
        "   hit=a.px===w.tx&&a.py===w.ty&&this.dist(a)<=1;}")
    # 14.6: голоса твари в начале боя — из её точки, а не посередине головы.
    rep('Bank.play("od_undead",{kind:"combat",seed:m.lvl,gain:0.5,maxSec:6})','foeCue("od_undead",{kind:"combat",seed:m.lvl,gain:0.5,maxSec:6})')
    rep('Bank.play("brute_step",{kind:"combat",seed:m.lvl,gain:0.55,maxSec:4})','foeCue("brute_step",{kind:"combat",seed:m.lvl,gain:0.55,maxSec:4})')
    rep('Bank.play("brute_roar",{kind:"combat",seed:m.lvl,gain:0.75,maxSec:6})','foeCue("brute_roar",{kind:"combat",seed:m.lvl,gain:0.75,maxSec:6})')
    rep('Bank.play("oc_growl",{kind:"combat",gain:0.55,maxSec:5})','foeCue("oc_growl",{kind:"combat",gain:0.55,maxSec:5})')
    # 14.6: летучая тварь в глуши — крылья, а не шаги.
    rep("  const gain=Math.max(0.2,0.7-d*0.08);\n  if(Spatial.at(f,dx,dy,{gain,maxSec:2.4}))return;",
        "  const gain=Math.max(0.2,0.7-d*0.08);\n"
        "  /* (14.6) Летучая тварь слышна крыльями со своей высоты, дух — вихрем. */\n"
        "  const крыл=(foeFamily(m)===\"bird\"||foeFamily(m)===\"spirit\"||safeFn(()=>foeFlies(m),false)||safeFn(()=>isMoth(m),false))?safeFn(()=>foeMoveRole(m,true),null):null;\n"
        "  if(крыл&&Spatial.role(крыл,dx,dy,{gain,maxSec:2.4,dz:safeFn(()=>foeAlt(m),0)}))return;\n"
        "  if(Spatial.at(f,dx,dy,{gain,maxSec:2.4}))return;")
if PHASE>=9:
    # 14.6: руководство — B называет цель маяка, Shift+B гасит; слоты Alt+цифра — в бою и вне боя.
    rep("H — состояние героя. B — погасить маяк цели. Цифры",
        "H — состояние героя. B — где цель маяка: сторона и расстояние и один удар маяка; Shift+B — погасить маяк. Цифры")
    rep("— сразу слоты быстрого доступа с первого по двенадцатый (вещь ставится в слот из инвентаря, «В слот быстрого доступа»)",
        "— сразу слоты быстрого доступа с первого по двенадцатый, в бою и вне боя (вещь ставится в слот из инвентаря, «В слот быстрого доступа»)")
    rep("Снять раньше — пункт «Снять цель и маяк» в том же окне.",
        "Снять раньше — пункт «Снять цель и маяк» в том же окне. Маяк не объявляет себя словами по дороге: где цель, называет клавиша B на компьютере (Shift+B гасит маяк) и жест «что рядом».")
if PHASE>=9:
    # 14.6: самопроверка — жестовых действий тридцать семь («где цель маяка»).
    rep("   &&GEST_ACTIONS.length===36&&new Set(GEST_ACTIONS.map(a=>a.id)).size===36",
        "   /* (14.6) Тридцать седьмое — «где цель маяка». */\n   &&GEST_ACTIONS.length===37&&new Set(GEST_ACTIONS.map(a=>a.id)).size===37")
if PHASE>=9:
    # 14.6: «Выбросить» со счётом — свайп вверх или вниз на этом пункте выбирает, сколько выбросить.
    rep("  /* (8.0) На ползунке громкости, скорости или высоты свайп вверх прибавляет,",
        "  /* (14.6) «Выбросить» у стопки: свайп вверх или вниз — сколько выбросить, двойное касание — выбросить. */\n"
        "  if(swipe&&(dir==='N'||dir==='S')&&layer.id==='modal-invact'&&safeFn(()=>DropCount.on(uiCursor),false)){safeFn(()=>DropCount.nudge(dir==='N'?1:-1));return;}\n"
        "  /* (8.0) На ползунке громкости, скорости или высоты свайп вверх прибавляет,")
    # 14.6: то же стрелками в приложении для Windows — в разделе инвентаря и в окне действий.
    rep(' if(layer.id==="modal-inventory"&&(k==="ArrowUp"||k==="ArrowDown"))safeFn(()=>{INV.kbAct=null;});',
        ' /* (14.6) «Выбросить» у стопки: стрелки вверх и вниз — сколько выбросить, Enter — выбросить. */\n'
        ' if((k==="ArrowUp"||k==="ArrowDown")&&!e.shiftKey&&!e.ctrlKey&&!e.altKey&&safeFn(()=>layer.id==="modal-invact"?DropCount.nudge(k==="ArrowUp"?1:-1):layer.id==="modal-inventory"?DropCount.keyNudge(k==="ArrowUp"?1:-1):false,false)){e.preventDefault();return true;}\n'
        ' if(layer.id==="modal-inventory"&&(k==="ArrowUp"||k==="ArrowDown"))safeFn(()=>{INV.kbAct=null;});')
if PHASE>=9:
    # 14.6: музыка подземелий — весёлые темы под землёй сменили тёмные из The Battle for Wesnoth,
    # весёлые ушли наверх (пустыня, побережье, лагерь, война, дорога, горы, тёмный базар).
    rep(' mus_dk_fort:{f:["wyrmsun/wy_germanic_theme_3.ogg"],d:"Подземная крепость: третья германская тема (Wyrmsun)"},',
        ' mus_dk_fort:{f:["wesnoth/wn_juggernaut.ogg"],d:"Подземная крепость: «Juggernaut» Скотта Бакли (The Battle for Wesnoth) — тяжёлая поступь во тьме"},')
    rep(' mus_dk_lab:{f:["evol/ev_ghoulish_fun.ogg"],d:"Лаборатория: «Ghoulish Fun» Эрика Матиаса (Evol Online)"},',
        ' mus_dk_lab:{f:["wesnoth/wn_decoherence.ogg"],d:"Лаборатория: «Decoherence» Скотта Бакли (The Battle for Wesnoth) — холодный гул и тревога"},')
    rep(' mus_dk_living:{f:["mg/mg_mus_indian.ogg"],d:"Живое: барабанная тема индейцев (MegaGlest)"},',
        ' mus_dk_living:{f:["wesnoth/wn_primal_carnage.ogg"],d:"Живое: «Primal Carnage» Скотта Бакли (The Battle for Wesnoth) — погоня в темноте"},')
    rep(' mus_dk_temple:{f:["mg/mg_mus_egypt.ogg"],d:"Древний храм: египетская тема (MegaGlest)"},',
        ' mus_dk_temple:{f:["wesnoth/wn_cry_from_elensefar.ogg"],d:"Древний храм: «Cry from Elensefar» (pluft, The Battle for Wesnoth)"},')
    rep(' mus_dk_water:{f:["solarus/sol_neptune.ogg"],d:"Водное: «Neptune» (Solarus)"},',
        ' mus_dk_water:{f:["wesnoth/wn_phase_shift.ogg"],d:"Водное: «Phase Shift» Скотта Бакли (The Battle for Wesnoth) — тёмная вода"},')
    rep(' mus_dk_air:{f:["score/score_wind_01.ogg"],d:"Воздушное: пустой ветер Flare"},',
        ' mus_dk_air:{f:["wesnoth/wn_scary_ambient_wind.ogg"],d:"Воздушное: «Scary Ambient Wind» Александра Желанова (The Battle for Wesnoth)"},')
    rep(' mus_dk_necropolis:{f:["wyrmsun/wy_germanic_theme_3_night.ogg"],d:"Некрополь: ночная часть третьей германской темы (Wyrmsun)"},',
        ' mus_dk_necropolis:{f:["wesnoth/wn_undead_siege.ogg","wyrmsun/wy_germanic_theme_3_night.ogg"],d:"Некрополь: «Undead Siege» Томека Щенсного (The Battle for Wesnoth) и ночная часть третьей германской темы (Wyrmsun)"},')
    rep(' mus_pl_ruins:{f:["ab/ab_mus_tale_of_the_ruins.ogg","stendhal/st_treasure_hunter.ogg"],d:"Руины: «Tale of the Ruins» (Ancient Beast) и «Treasure Hunter» (Stendhal)"},',
        ' mus_pl_ruins:{f:["ab/ab_mus_tale_of_the_ruins.ogg"],d:"Руины: «Tale of the Ruins» (Ancient Beast)"},')
    rep(' mus_pl_warcamp:{f:["wyrmsun/wy_germanic_theme.ogg"],d:"Походный лагерь: германская тема (Wyrmsun)"},',
        ' mus_pl_warcamp:{f:["wyrmsun/wy_germanic_theme.ogg","wyrmsun/wy_germanic_theme_3.ogg"],d:"Походный лагерь: германская тема (Wyrmsun) и третья германская тема"},')
    rep(' mus_pl_bazaar:{f:["mg/mg_mus_persian.ogg"],d:"Тёмный базар: тема персов (MegaGlest)"},',
        ' mus_pl_bazaar:{f:["mg/mg_mus_persian.ogg","evol/ev_ghoulish_fun.ogg"],d:"Тёмный базар: тема персов (MegaGlest) и «Ghoulish Fun» Эрика Матиаса (Evol Online)"},')
    rep(' mus_war:{f:["ab/ab_mus_incoming_siege.ogg","tmw/tmw_dramatic.ogg"],d:"Смута и война: «Incoming Siege» (Ancient Beast) и «Dramatic» (The Mana World)"},',
        ' mus_war:{f:["ab/ab_mus_incoming_siege.ogg","tmw/tmw_dramatic.ogg","mg/mg_mus_indian.ogg"],d:"Смута и война: «Incoming Siege» (Ancient Beast) и «Dramatic» (The Mana World) и барабанная тема индейцев (MegaGlest)"},')
    rep(' mus_desert:{f:["ab/ab_mus_city_of_sand.ogg"],d:"Пустыня: «City of Sand» (Ancient Beast)"},',
        ' mus_desert:{f:["ab/ab_mus_city_of_sand.ogg","mg/mg_mus_egypt.ogg"],d:"Пустыня: «City of Sand» (Ancient Beast) и египетская тема (MegaGlest)"},')
    rep(' mus_coast:{f:["evol/ev_dimonds_cove.ogg"],d:"Побережье: «Dimond\'s Cove» (The Mana World / Evol Online)"},',
        ' mus_coast:{f:["evol/ev_dimonds_cove.ogg","solarus/sol_neptune.ogg"],d:"Побережье: «Dimond\'s Cove» (The Mana World / Evol Online) и «Neptune» (Solarus)"},')
    rep(' mus_mountains:{f:["solarus/sol_mountains.ogg"],d:"Горы: «Mountains» Эдуардо Дуэньяса (Solarus)"},',
        ' mus_mountains:{f:["solarus/sol_mountains.ogg","score/score_wind_01.ogg"],d:"Горы: «Mountains» Эдуардо Дуэньяса (Solarus) и пустой ветер Flare"},')
    rep(' mus_road:{f:["ab/ab_mus_wind_run.ogg","score/score_road_01.ogg"],d:"Дорога: «Wind Run» Тэда Миллера (Ancient Beast) и тема простора Flare"},',
        ' mus_road:{f:["ab/ab_mus_wind_run.ogg","score/score_road_01.ogg","stendhal/st_treasure_hunter.ogg"],d:"Дорога: «Wind Run» Тэда Миллера (Ancient Beast) и тема простора Flare и «Treasure Hunter» (Stendhal)"},')
if PHASE>=9:
    # 14.6: тёмные темы подземелий из The Battle for Wesnoth — в разделе «Музыка мест» энциклопедии.
    rep(' {n:"Музыка мест",icon:"", dirs:["score","stendhal","solarus","valyria","wyrmsun","evol","tmw","ab","intro"]},',
        ' {n:"Музыка мест",icon:"", dirs:["score","stendhal","solarus","valyria","wyrmsun","evol","tmw","ab","intro","wesnoth"]},')
if PHASE>=9:
    rep(' solarus:"Музыка мест: темы Solarus — простор, горы, пещеры, деревня, замок и башни",\n',
        ' solarus:"Музыка мест: темы Solarus — простор, горы, пещеры, деревня, замок и башни",\n'
        ' wesnoth:"Музыка подземелий: тёмные темы The Battle for Wesnoth — крепость, лаборатория, храм, некрополь, вода, ветер, живые своды",\n')
if PHASE>=9:
    # 14.6: записи зверей (sounds/zv, BigSoundBank, CC0): еда, голоса, мурлыканье, нюх, крылья, копыта под седоком.
    sys.path.insert(0,H)
    from zv_roles import bank_lines as _zv_lines
    rep(' oc_munch:{f:["oc/oc_munch_01.ogg"],d:"кто-то жуёт"},\n',
        ' oc_munch:{f:["oc/oc_munch_01.ogg"],d:"кто-то жуёт"},\n'+_zv_lines())
    rep(' {n:"Твари, звери и птицы",   icon:"", dirs:["foe","beasts","creatures"]},',
        ' {n:"Твари, звери и птицы",   icon:"", dirs:["foe","beasts","creatures","zv"]},')
    rep(' beasts:"Звери и птицы",\n',
        ' beasts:"Звери и птицы",\n zv:"Питомцы и маунты: еда, голоса, мурлыканье, нюх, крылья, копыта под седоком",\n')
if PHASE>=9:
    # 14.6: торговля — сколько купить или продать: свайп вверх или вниз по товару; в Windows стрелки, пробел — карточка.
    rep("  /* (8.0) На ползунке громкости, скорости или высоты свайп вверх прибавляет,",
        "  /* (14.6) Торговля: на товаре свайп вверх или вниз — сколько купить или продать, двойное касание — сделка. */\n"
        "  if(swipe&&(dir==='N'||dir==='S')&&layer.id==='modal-shop'&&safeFn(()=>ShopCount.on(uiCursor),false)){safeFn(()=>ShopCount.nudge(dir==='N'?1:-1));return;}\n"
        "  /* (после 16.0) Ползунок счёта везде, где покупают и продают: обоз, карточка товара, торг Глуби, Кузница нового, Гильдия. */\n"
        "  if(swipe&&(dir==='N'||dir==='S')&&safeFn(()=>CountRow.on(uiCursor)&&layer.contains(uiCursor),false)){safeFn(()=>CountRow.nudge(dir==='N'?1:-1));return;}\n"
        "  /* (8.0) На ползунке громкости, скорости или высоты свайп вверх прибавляет,")
    rep(' if(layer.id==="modal-inventory"&&(k==="ArrowUp"||k==="ArrowDown"))safeFn(()=>{INV.kbAct=null;});',
        ' /* (14.6) Торговля: стрелки вверх и вниз на товаре — сколько, Enter — сделка, пробел — карточка товара. */\n'
        ' if(layer.id==="modal-shop"&&!e.shiftKey&&!e.ctrlKey&&!e.altKey&&safeFn(()=>ShopCount.on(uiCursor)&&layer.contains(uiCursor),false)){\n'
        '  if(k==="ArrowUp"||k==="ArrowDown"){e.preventDefault();safeFn(()=>ShopCount.nudge(k==="ArrowUp"?1:-1));return true;}\n'
        '  if(e.code==="Space"){e.preventDefault();safeFn(()=>shopItemCard(uiCursor.dataset.cmd.split(":")[1]));return true;}}\n'
        ' /* (после 16.0) Ползунок счёта везде: стрелки вверх и вниз — сколько, Enter — сделка. */\n'
        ' if((k==="ArrowUp"||k==="ArrowDown")&&!e.shiftKey&&!e.ctrlKey&&!e.altKey&&safeFn(()=>CountRow.on(uiCursor)&&layer.contains(uiCursor),false)){e.preventDefault();safeFn(()=>CountRow.nudge(k==="ArrowUp"?1:-1));return true;}\n'
        ' if(layer.id==="modal-inventory"&&(k==="ArrowUp"||k==="ArrowDown"))safeFn(()=>{INV.kbAct=null;});')
fr="[EMPIRES,MONSTERS,RACES,URACES,UDESC,CLANS,VIEWS,LIFE,RUMORS,SYL,SYL2,VILL_A,VILL_B,TAV_A,TAV_B,"
rep(fr,early.rstrip()+"\n"+fr)
if PHASE>=9 and os.path.exists(H+'voice150_data.json'):
    rep('&&!(Род.героиня()&&Род.кГероине(привет)!==привет);','&&!(Род.героиня()&&Род.кГероине(привет)!==привет&&(typeof femLine!=="function"||femLine("greet",привет)===null));')
    rep('const своимГолосом=голосом&&!!(цитата&&VOICE_NPC.dlg&&VOICE_NPC.dlg[цитата]);','const своимГолосом=голосом&&!!(цитата&&VOICE_NPC.dlg&&VOICE_NPC.dlg[цитата])&&(typeof femLine!=="function"||femLine("dlg",цитата)!==null);')
anchor="\n\n/* ════════ СОХРАНЕНИЕ ════════ */"
rep(anchor,"\n"+late.rstrip()+"\n"+anchor)
import sys
extra=sys.argv[1] if len(sys.argv)>1 else ""
if extra=="trace":
    rep("<script>","<script>window.__matTrace=1;",1) if s.count("<script>")==1 else None
open(R+'index.html','w',encoding='utf-8').write(s)
print("собрано")
