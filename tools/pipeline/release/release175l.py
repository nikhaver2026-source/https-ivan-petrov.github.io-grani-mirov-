"""release175l.py — старые и дублирующие обработчики звука, мешавшие новым (после 17.5).

Жалоба игрока: «в некоторых локациях музыка либо звуки начинают глючить — включаться и не работать, или игра
тормозить»; решение игрока: «удали старые и дублирующие обработчики… проведи всё через единый обработчик звука,
чтобы не открывалось куча десятков плееров».
Замер по местам (проба audit/locprobe.js и audit/prof.js) показал:
 1. Старые слои местности amb0/amb1 (с поры синтеза) заводились одиннадцатью местами игры поверх фона места
    (канал «place»): на равнине и в лесу одна запись звучала дважды, в горах и топях — два-три фона разом, а
    каждая смена местности гасила слой и заводила заново. Слои удалены из всех мест; осталась одна функция
    ambLayers — она только снимает старые слои, а рисует их лишь в игре совсем без записей.
 2. Фон тёмных земель (пепел, кость, гниль, зеркало, жила, утопь, шрам) брался равнинный — там его и подменял
    старый слой. Теперь у каждой тёмной земли свой фон.
 3. На краю дороги и поля, вдоль опушки музыка, фон места, живой слой и фон звуковой картины гасли и заводились
    на каждом шаге. Теперь они идут по устоявшейся местности (Местность): новая вступает через три шага по ней
    или три секунды на ней; выход из постройки, причал, перенос — сразу.
 4. Бесшовная петля фона на каждом стыке заводила новый плеер (сеть, разбор, система звука телефона), а у каждой
    петли был свой таймер десять раз в секунду. Теперь петля держит два плеера на всё время (отыгравший ждёт
    следующего стыка), а все петли идут по общему такту (Такт).
 5. Одна и та же петля двумя каналами (пустыня: фон места и фон звуковой картины — одной записью) не заводится
    дважды; в дождь второй дождь поверх слоя погоды не звучит.
 6. Речь: прогрев двенадцатью плеерами разом, новый плеер на каждую фразу синтезатора до первого касания и на каждый
    записанный кусок голоса Gemini — теперь свои постоянные плееры (голос — не больше восьми, по кругу).
 7. Погода разыгрывалась заново на каждом пятом шаге (с поры, когда шаг двигал часы) — теперь держится четыре минуты.
 8. Загрузка сохранения в доме или городе включала тему пролога — теперь музыку места.
Повторный запуск ничего не меняет."""
B = "/root/S/hron/index_before_mater.html"
s = open(B, encoding="utf-8").read()
n0 = len(s)


def sub(a, b, n=1, mark=None):
    """заменить a на b ровно n раз; если b уже стоит (метка mark или сам b) — ничего не делать"""
    global s
    if (mark or b) in s:
        return
    assert s.count(a) == n, (s.count(a), a[:80])
    s = s.replace(a, b)


# ── 1. Одна функция старых слоев и Местность — сразу за таблицей живых петель (LIVE_LOOP) ──
sub(''' rain:"amb_rain",swamp:"amb_swamp"};''', ''' rain:"amb_rain",swamp:"amb_swamp"};
/* ── (17.5) СТАРЫЕ СЛОИ МЕСТНОСТИ ──
   Слои amb0 и amb1 остались от поры, когда фон рисовался синтезом. С записями их заводили одиннадцать мест игры
   поверх фона места (bankUpdateAmbient, канал «place»): равнина и лес звучали одной записью дважды, горы и топи —
   двумя-тремя фонами разом, а каждая смена местности гасила слой и заводила заново. Теперь фоном местности ведает
   одно место — канал «place»; слои остались только запасом для игры совсем без записей.
   terr — местность (null — только снять слои). */
function ambLayers(terr){
 safeFn(()=>{Play.stopKey("amb0");Play.stopKey("amb1");});
 if(!terr||!settings.effects||safeFn(()=>Bank.enabled,false))return;
 const a=(G.dark?(DARK_AMB[terr]||["wind"]):AMB[terr])||["wind"];
 Play.start("amb0",a[0],{loop:true});if(a[1])Play.start("amb1",a[1],{loop:true});}
/* ── (17.5) МЕСТНОСТЬ ДЛЯ ФОНА И МУЗЫКИ ──
   Идущий по краю дороги и поля или вдоль опушки менял местность на каждом шаге, и на каждом шаге гасли и заново
   заводились музыка, фон места, живой слой и фон звуковой картины — «звук глючит, включается и не работает».
   Теперь фон и музыка поверхности идут по устоявшейся местности: новая вступает, когда герой прошёл по ней три
   шага подряд или пробыл на ней три секунды. Прыжок — выход из постройки, причал, перенос — сразу. */
const Местность={т:null,канд:null,n:0,x:0,y:0,таймер:null,ШАГОВ:3,МС:3000,
 сырая(c){return c&&c.terrain?c.terrain[0]:null;},
 /* рядом — в пределах пяти клеток: шаг верхом и полёт (до четырёх клеток) — ещё шаг, а не прыжок */
 рядом(){return Math.max(Math.abs((G.x|0)-this.x),Math.abs((G.y|0)-this.y))<=5;},
 /* шаг по поверхности (arrive): true — устоявшаяся местность сменилась */
 шаг(c){const r=this.сырая(c);if(!r)return false;
  const прыжок=!this.рядом();this.x=G.x|0;this.y=G.y|0;
  if(!this.т||прыжок){const было=this.т;this.уст(r);return было!==r;}
  if(r===this.т){this.уст(r);return false;}
  if(r!==this.канд){this.канд=r;this.n=0;if(this.таймер)clearTimeout(this.таймер);
   this.таймер=setTimeout(()=>{this.таймер=null;safeFn(()=>this.дождался());},this.МС);}
  if(++this.n>=this.ШАГОВ){this.уст(r);return true;}
  return false;},
 уст(r){this.т=r;this.канд=null;this.n=0;if(this.таймер){clearTimeout(this.таймер);this.таймер=null;}},
 /* герой постоял на новой местности — она вступает и без шагов */
 дождался(){const к=this.канд;if(!к||G.place||G.ship||G.inCombat||!this.рядом())return;
  if(!safeFn(()=>gameActive(),true))return;
  if(this.сырая(safeFn(()=>cellContent(G.x,G.y),null))!==к)return;
  this.уст(к);ambLayers(к);Music.start(к);safeFn(()=>bankUpdateAmbient());},
 /* местность, по которой звучат фон и музыка здесь и сейчас */
 тек(c){c=c||safeFn(()=>cellContent(G.x,G.y),null);const r=this.сырая(c);
  if(!this.т||G.place||G.ship||!this.рядом())return r;
  return this.т;},
 /* край местности: под ногами уже другая, но она ещё не устоялась */
 ждёт(){return !!this.канд&&!G.place&&!G.ship&&this.рядом();}};''', mark="function ambLayers(terr){")

# ── 2. Старые слои — из всех мест игры ──
sub(''' safeFn(()=>{Play.stopKey("amb0");Play.stopKey("amb1");Bank.stop("live");Music.start("coast");bankUpdateAmbient();});''',
    ''' safeFn(()=>{ambLayers(null);Bank.stop("live");Music.start("coast");bankUpdateAmbient();});''')
sub('''  Play.stopKey("amb0");if(settings.effects)Play.start("amb0",(AMB[c.terrain[0]]||["sea"])[0],{loop:true});
  Music.start(c.terrain[0]);bankUpdateAmbient();});''',
    '''  ambLayers(c.terrain[0]);
  Music.start(c.terrain[0]);bankUpdateAmbient();});''')
sub(''' safeFn(()=>{Play.stopKey("amb0");Play.stopKey("amb1");
  if(settings.effects)Play.start("amb0",(AMB[c.terrain[0]]||["wind"])[0],{loop:true});
  Weather.resume();Music.start(c.terrain[0]);bankUpdateAmbient();});''',
    ''' safeFn(()=>{ambLayers(c.terrain[0]);
  Weather.resume();Music.start(c.terrain[0]);bankUpdateAmbient();});''')
sub('''  Play.stopKey("amb0");Play.stopKey("amb1");Weather.hush();''', '''  ambLayers(null);Weather.hush();''')
sub(''' safeFn(()=>{const c=cellContent(G.x,G.y);Play.stopKey("amb0");Play.stopKey("amb1");
  if(settings.effects)Play.start("amb0",(AMB[c.terrain[0]]||["wind"])[0],{loop:true});
  bankUpdateAmbient();});''',
    ''' safeFn(()=>{const c=cellContent(G.x,G.y);ambLayers(c.terrain[0]);
  bankUpdateAmbient();});''')
sub('''  safeFn(()=>{Play.start("amb0",(AMB[c.terrain[0]]||["wind"])[0],{loop:true});
   Music.start(c.terrain[0]);bankUpdateAmbient();});''',
    '''  safeFn(()=>{ambLayers(c.terrain[0]);
   Music.start(c.terrain[0]);bankUpdateAmbient();});''')
sub(''' if(settings.effects&&openSky()&&!G.place)Play.start("amb0",(AMB[c.terrain[0]]||["wind"])[0],{loop:true});''',
    ''' if(openSky()&&!G.place)ambLayers(c.terrain[0]);''')

# ── 3. arrive(): старые слои прочь, фон и музыка — по устоявшейся местности ──
sub(''' const terrChanged=!lastArrive||lastArrive.terrain[0]!==c.terrain[0];
 if(terrChanged||!lastArrive||lastEmp!==c.empire.name){
  Play.stopKey("amb0");Play.stopKey("amb1");
  const a=(G.dark?(DARK_AMB[c.terrain[0]]||["wind"]):AMB[c.terrain[0]])||["wind"];
  if(settings.effects){Play.start("amb0",a[0],{loop:true});
   if(a[1])Play.start("amb1",a[1],{loop:true});}
''', ''' const terrChanged=!lastArrive||lastArrive.terrain[0]!==c.terrain[0];
 /* (17.5) Фон и музыка поверхности — по устоявшейся местности (Местность): на краю дороги и поля они не
    переключаются на каждом шаге. */
 const фонСменился=Местность.шаг(c);
 if(terrChanged||!lastArrive||lastEmp!==c.empire.name){
''')
sub('''  if(terrChanged)safeFn(()=>{const v={forest:"wild_birds",swamp:"amb_swamp",''',
    '''  if(фонСменился)safeFn(()=>{const v={forest:"wild_birds",swamp:"amb_swamp",''')
sub('''   plains:"ad_day",road:"tread_gravel"}[c.terrain[0]];''', '''   plains:"ad_day",road:"tread_gravel"}[Местность.тек(c)];''')
sub('''  const empChanged=lastEmp!==c.empire.name;
  Music.start(c.terrain[0]);safeFn(()=>bankUpdateAmbient());lastEmp=c.empire.name;''',
    '''  const empChanged=lastEmp!==c.empire.name;
  if(фонСменился||empChanged||!lastArrive){const т=Местность.тек(c);ambLayers(т);Music.start(т);safeFn(()=>bankUpdateAmbient());}
  lastEmp=c.empire.name;''')
sub('''    (w.length?`Идёт война с державами: ${w.map(x=>EMPIRES[x.a===i?x.b:x.a].short).join(", ")}.`:"Держава ни с кем не воюет."),{interrupt:false});});}
 safeFn(()=>ДальнийКруг.шаг(c));''',
    '''    (w.length?`Идёт война с державами: ${w.map(x=>EMPIRES[x.a===i?x.b:x.a].short).join(", ")}.`:"Держава ни с кем не воюет."),{interrupt:false});});}
 /* местность устоялась шагом по ней же — фон и музыка сменяются теперь */
 else if(фонСменился){const т=Местность.тек(c);ambLayers(т);Music.start(т);safeFn(()=>bankUpdateAmbient());}
 safeFn(()=>ДальнийКруг.шаг(c));''')

# ── 4. Фон места: устоявшаяся местность, свой фон у тёмных земель ──
sub('''   plains:"amb_plains",road:"amb_road",coast:"sea_calm",cave:"deep_wind"}[c.terrain[0]]||"amb_plains";''',
    '''   plains:"amb_plains",road:"amb_road",coast:"sea_calm",cave:"deep_wind"}[Местность.тек(c)]
   /* (17.5) Тёмные земли: пепел и шрам — ветер, кость, зеркало и жила — пещерный гул, гниль — топь, утопь —
      вода. Прежде они звучали равниной, и это прикрывал старый слой местности. */
   ||((typeof DARK_AMB!=="undefined"&&DARK_AMB[Местность.тек(c)])?LIVE_LOOP[DARK_AMB[Местность.тек(c)][0]]:null)||"amb_plains";''')

# ── 5. Живой слой: устоявшаяся местность; в дождь второго дождя нет ──
sub('''   const t=cellContent(G.x,G.y).terrain[0];
   if(G.weather==="Гроза")role="sky_thunder";
   else if(G.weather==="Дождь")role=pick(["wild_rain","ad_rain_long","oc_rain"]);''',
    '''   const t=Местность.тек();
   if(G.weather==="Гроза")role="sky_thunder";
   /* (17.5) Дождь уже звучит слоем погоды (Weather, канал «слой:w1»): второй дождь поверх — лишний плеер и каша.
      У ливня своей петли погоды нет — его долгий шум идёт живым слоем. */
   else if(G.weather==="Дождь"&&!safeFn(()=>Weather.hushed,false)){Bank.stop("live");return;}
   else if(G.weather==="Ливень")role=pick(["ad_rain_long","wild_rain","oc_rain"]);''')

# ── 6. Звуковая картина: край местности не дёргает фон; капель не просим каждый удар ──
sub('''   const key=role?kind+":"+role+":"+(ночь?"n":"d"):null;
   if(key===this.bedKind)return;''',
    '''   const key=role?kind+":"+role+":"+(ночь?"n":"d"):null;
   /* (17.5) Край местности: под ногами уже другая, но она ещё не устоялась (Местность) — фон не дёргаем. */
   if(this.bedKind&&safeFn(()=>Местность.ждёт(),false))return;
   /* Та же петля уже звучит другим каналом (Bank.loop второй копии не заводит) — канал картины пуст, и фон
      картины заведётся на ближайшем ударе часов, когда та петля смолкнет. Капель под землёй — места свода
      (Drips), а не петля: её не просим каждый удар. */
   if(key===this.bedKind&&(!role||role==="cave_leak"||!Bank.has(role)||Bank.loops.has("scape")))return;''')

# ── 7. Петли банка: два плеера на петлю, общий такт, без второй копии ──
sub(''' kill(el){try{if(!el)return;el.__stopped=true;el.pause();el.removeAttribute("src");el.load();}catch(_){}},''',
    ''' kill(el){try{if(!el)return;el.__stopped=true;el.pause();el.removeAttribute("src");el.load();}catch(_){}},
 /* (17.5) Плеер, доигравший свою часть бесшовной петли, не выбрасывается, а ждёт следующего стыка той же петли:
    петля держит два плеера на всё время, а не заводит новый на каждом стыке (на телефоне новый плеер — это сеть,
    разбор записи и система звука; в местах с короткими фонами их заводились десятки). Звук из памяти
    (ЗвукИзПамяти) плеера не держит — его просто отпускаем. */
 _запас(rec,el){if(!el)return;if(el.__память||rec.запас){this.kill(el);return;}
  try{el.__stopped=true;el.pause();}catch(_){this.kill(el);return;}rec.запас=el;},
 _снова(rec,f,v){const el=rec.запас;if(!el)return null;rec.запас=null;
  try{const url=this.url(f);el.__stopped=false;el.loop=false;el.muted=false;el.volume=Math.max(0,Math.min(1,v));
   if(el.getAttribute("src")!==url)el.src=url;else el.currentTime=0;
   Звук.играть(el,"петля");return el;}
  catch(_){this.kill(el);return null;}},''', mark=" _запас(rec,el){")
sub(''' stop(channel){const cur=this.loops.get(channel);
  if(cur){this.kill(cur.el);if(cur.el2)this.kill(cur.el2);''',
    ''' stop(channel){const cur=this.loops.get(channel);
  if(cur){this.kill(cur.el);if(cur.el2)this.kill(cur.el2);if(cur.запас){this.kill(cur.запас);cur.запас=null;}''')
sub('''   if(!cur.fading)cur.el.volume=Math.max(0,Math.min(1,this.vol(kind)*cur.gain));return cur.el;}
  this.stop(channel);''',
    '''   if(!cur.fading)cur.el.volume=Math.max(0,Math.min(1,this.vol(kind)*cur.gain));return cur.el;}
  /* (17.5) Та же петля уже звучит другим каналом фона (место, живой слой, звуковая картина, погода) — второй копии
     не заводим: прежде пустыня звучала одной записью дважды (фон места и фон звуковой картины). */
  const фон=к=>к==="place"||к==="live"||к==="scape"||/^слой:/.test(к);
  if(!музыка&&фон(channel))for(const [к,r] of this.loops)if(к!==channel&&фон(к)&&r&&r.role===role&&r.el){this.stop(channel);return r.el;}
  this.stop(channel);''')
sub('''  const заводи=(f,v)=>{
   const el=this.make(f,v,false);if(!el)return null;''',
    '''  const заводи=(f,v)=>{
   const el=this._снова(rec,f,v)||this.make(f,v,false);if(!el)return null;''')
sub('''    this.kill(el);rec.el=ne;rec.el2=null;rec.file=nf;rec.fading=false;};''',
    '''    this._запас(rec,el);rec.el=ne;rec.el2=null;rec.file=nf;rec.fading=false;};''')
sub('''  rec.timer=setInterval(()=>safeFn(тик),100);
  return rec.el;},''',
    '''  /* (17.5) все петли — по общему такту (Такт): одно пробуждение на все, а не свой таймер у каждой */
  rec.timer=Такт.каждые(100,()=>safeFn(тик),"петля "+channel);
  return rec.el;},''')

# ── 8. Речь: без лишних плееров ──
# Первые двенадцать записей голоса прогревались двенадцатью плеерами разом (на Android каждый — системный плеер);
# прогрев кэша — простым запросом, без плеера. На диске (приложение Windows) прогревать нечего.
sub('''    (j.top||[]).slice(0,12).forEach(id=>{try{const a=new Audio(g.dir+id+".flac");a.preload="auto";a.load();}catch(_){}});}''',
    '''    /* (17.5) прогрев кэша — запросом, без плеера: двенадцать плееров разом на телефоне — двенадцать системных плееров */
    (j.top||[]).slice(0,12).forEach(id=>{try{if(typeof fetch==="function"&&/^https?:$/.test(location.protocol))fetch(g.dir+id+".flac").catch(()=>{});}catch(_){}});}''')
# Синтезатор eSpeak до первого касания заводил новый плеер на каждую фразу — теперь один свой плеер на все фразы.
sub('''const a=(self._плеер&&self._открыто&&self._открыто.плеер)?self._плеер:new Audio();''',
    '''const a=(self._плеер&&self._открыто&&self._открыто.плеер)?self._плеер:(self._плеерЕ||(self._плеерЕ=new Audio()));''', n=2)

# ── 9. Голос Gemini: восемь плееров по кругу ──
# На каждый записанный кусок фразы заводился новый плеер (до восьми про запас), а вытесненный выбрасывался: за сорок
# секунд игры — около сотни новых плееров. Теперь пул полон — самый давний плеер (не звучащий) берёт новую запись.
sub('''  const аудио=url=>{let a=пул.get(url);
   if(a){пул.delete(url);пул.set(url,a);return a;}
   a=Плееры.взять(url);a.preload="auto";пул.set(url,a);''',
    '''  const аудио=url=>{let a=пул.get(url);
   if(a){пул.delete(url);пул.set(url,a);return a;}
   /* (17.5) Пул полон — самый давний плеер (не тот, что звучит) берёт новую запись, а не уходит на свалку: голос
      держит не больше восьми плееров на всю игру, а не заводит новый на каждый кусок фразы. */
   if(пул.size>=8)for(const [k,v] of пул){if(v===эл)continue;пул.delete(k);
    try{v.onended=null;v.onerror=null;v.__stopped=true;v.pause();v.__stopped=false;v.loop=false;v.muted=false;v.src=url;a=v;}catch(_){a=null;}
    break;}
   if(!a)a=Плееры.взять(url);a.preload="auto";пул.set(url,a);''')

# ── 10. Погода не скачет каждые пять шагов ──
# На каждом шаге погода с вероятностью в пятую часть разыгрывалась заново — с поры, когда шаг двигал часы. С тех пор
# время идёт по реальным часам, а погода менялась каждые несколько шагов (семь смен за полминуты ходьбы): дождь и
# ветер заводились и гасли, раскаты и порывы звучали поверх. Теперь сменившаяся на ходу погода держится не меньше
# четырёх минут.
sub(''' if(Math.random()<0.2){const w=rollWeather();if(w!==G.weather){G.weather=w;Weather.set(w);''',
    ''' /* (17.5) погода держится не меньше четырёх минут (Weather.ПОКОЙ): прежде она менялась каждые несколько шагов */
 if(Math.random()<0.2&&Date.now()-(Number(Weather.сменаВ)||0)>=Weather.ПОКОЙ){const w=rollWeather();if(w!==G.weather){G.weather=w;Weather.set(w);Weather.сменаВ=Date.now();''')
sub(''' set(w){this.clear();this.cur=w;safeFn(()=>deed("weathers"));''',
    ''' ПОКОЙ:240000,сменаВ:0,
 set(w){this.clear();this.cur=w;safeFn(()=>deed("weathers"));''')

# ── 11. Загрузка сохранения в доме или городе — музыка места, а не пролога ──
# Загрузка из слота или файла шла старым путём: под крышей дома и в городе включалась тема пролога. Тему выбирает
# та же функция, что и при входе в игру (locationMusicKey): ярус, башня, город, дом.
sub('''   safeFn(()=>Music.start(G.place.depth>0?underTrack(G.place.depth):"prologue"));''',
    '''   /* (17.5) тема — по месту, как при входе в игру: прежде в доме и городе звучала тема пролога */
   safeFn(()=>Music.start(locationMusicKey()));''')

open(B, "w", encoding="utf-8").write(s)
print("основа: старые обработчики звука —", "без изменений" if len(s) == n0 else f"правки внесены ({len(s)-n0:+d} знаков)")
