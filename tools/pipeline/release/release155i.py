"""release155i.py — основа: Spatial.at принимает lp (срез верха, Гц) — воздух у дальнего звука пролога (ширь,
глубина и высота пролога, prolog155_late.js). Срез за преградой и срез воздуха — меньший из двух. Повторный запуск
ничего не меняет."""
H="/tmp/claude-0/-home-user-https-ivan-petrov-github-io-grani-mirov-/27f5cebc-2d4b-556f-9c1f-bc733d69f26b/scratchpad/hron/index_before_mater.html"
s=open(H,encoding="utf-8").read();n=0
pairs=[(' at(path,dx,dy,{dz=0,gain=1,maxSec=3,roll=1.1,kind="fx",prio=null,occl=null,rate=0,voice=false,wetK=1,conv=null}={}){',
' /* (15.5) lp — свой срез верха, Гц (воздух у дальнего звука пролога); за преградой берётся меньший из двух. */\n at(path,dx,dy,{dz=0,gain=1,maxSec=3,roll=1.1,kind="fx",prio=null,occl=null,rate=0,voice=false,wetK=1,conv=null,lp=0}={}){'),
('    lp:прегр>0?Math.max(300,9000/(1+прегр*2.2)):0,gain:громк,dry:"room",wet:мокро,conv:conv||null,rate:(rate&&rate!==1)?rate:1});',
 '    lp:(()=>{const a=прегр>0?Math.max(300,9000/(1+прегр*2.2)):0,b=Number(lp)>0?Number(lp):0;return a&&b?Math.min(a,b):(a||b);})(),gain:громк,dry:"room",wet:мокро,conv:conv||null,rate:(rate&&rate!==1)?rate:1});')]
for a,b in pairs:
    if b in s:continue
    assert a in s,a[:60];s=s.replace(a,b,1);n+=1
open(H,"w",encoding="utf-8").write(s);print("index_before_mater.html правок",n)
# ── (15.5) то, на что игрок перешёл сам, и строки книги звучат целиком при любой подробности речи ──
s=open(H,encoding="utf-8").read();n=0
pairs=[('   if(m.user||m.pri<=1||m.cat==="achieve"||m.cat==="approach"||v==="normal"||v==="full")return text;',
'   /* (15.5) Листание самого игрока (nav) и строки книги (read) — целиком при любой подробности: «краткая» и\n      «минимальная» сокращают речь мира, а не то, на что игрок перешёл сам; прежде строка книги обрезалась до\n      одной-двух фраз, и казалось, что книга открылась не полностью. */\n   if(m.user||m.nav||m.cat==="read"||m.pri<=1||m.cat==="achieve"||m.cat==="approach"||v==="normal"||v==="full")return text;'),
('  b.addEventListener("click",()=>narrate(t));\n  body.appendChild(b);});',
 '  b.addEventListener("click",()=>narrate(t,{interrupt:true,cat:"read",user:true}));\n  body.appendChild(b);});')]
for a,b in pairs:
    if b in s:continue
    assert a in s,a[:60];s=s.replace(a,b,1);n+=1
open(H,"w",encoding="utf-8").write(s);print("index_before_mater.html правок (подробность)",n)
# ── (15.5) голос Gemini, отдавший кусок запасному синтезатору целиком, звучит для сторожа речи, пока звучит запасной ──
s=open(H,encoding="utf-8").read();n=0
pairs=[('    if(g.state!=="ready")return запас?запас.speak(text,o):false;',
'''    /* (15.5) Кусок целиком у запасного синтезатора — голос Gemini «идёт», пока тот звучит: иначе общий сторож речи
       видел тишину и через полторы-две секунды снимал кусок страницы (остаток книги терялся). */
    const целиком=()=>{if(!запас)return false;const мой=++ток;стоп();идёт=true;послШаг=Date.now();
     const ok=запас.speak(text,Object.assign({},o,{onend(){if(мой===ток)идёт=false;if(o.onend)o.onend();},onerror(){if(мой===ток)идёт=false;if(o.onerror)o.onerror();}}));
     if(!ok&&мой===ток)идёт=false;return ok;};
    if(g.state!=="ready")return целиком();'''),
('    if(!части.some(x=>x.url))return запас?запас.speak(text,o):false;','    if(!части.some(x=>x.url))return целиком();')]
for a,b in pairs:
    if b in s:continue
    assert a in s,a[:60];s=s.replace(a,b,1);n+=1
open(H,"w",encoding="utf-8").write(s);print("index_before_mater.html правок (Gemini целиком)",n)
# ── (15.5) eSpeak: латиница — русскими буквами (английского словаря в сборке нет: «Bad data en_dict» и немые слова) ──
s=open(H,encoding="utf-8").read();n=0
pairs=[(' wav(text,rate,vol,sex){const w=this.w;if(!w)return null;this.setSex(sex);',
''' /* (15.5) Латиница — русскими буквами: у русского голоса eSpeak слово латиницей уходит в английский словарь,
    а его в сборке нет (вырезан ради веса) — синтезатор писал «Bad data en_dict» и молчал на этом слове.
    Клавиши называются как принято (F1 — «эф один», Shift — «шифт»), сокращения — по буквам, прочее — по звукам. */
 КЛАВИШИ:{esc:"эскейп",escape:"эскейп",enter:"энтер",shift:"шифт",ctrl:"контрол",control:"контрол",alt:"альт",tab:"таб",space:"пробел",
  backspace:"бэкспейс",delete:"делит",del:"делит",home:"хоум",end:"энд",pageup:"пейдж ап",pagedown:"пейдж даун",insert:"инсерт",
  windows:"виндоус",nvda:"эн вэ дэ а",jaws:"джоуз",gemini:"джемини",espeak:"и спик",android:"андроид",iphone:"айфон",voiceover:"войс овер",talkback:"токбэк"},
 БУКВЫ:{a:"эй",b:"би",c:"си",d:"ди",e:"и",f:"эф",g:"джи",h:"эйч",i:"ай",j:"джей",k:"кей",l:"эл",m:"эм",n:"эн",o:"оу",p:"пи",q:"кью",r:"ар",s:"эс",t:"ти",u:"ю",v:"ви",w:"дабл ю",x:"экс",y:"уай",z:"зед"},
 ЦИФРЫ:["ноль","один","два","три","четыре","пять","шесть","семь","восемь","девять","десять","одиннадцать","двенадцать"],
 кир(t){t=String(t==null?"":t);if(!/[A-Za-z]/.test(t))return t;const self=this;
  return t.replace(/[A-Za-z]+(?:\\d+)?/g,w=>{const k=w.toLowerCase();if(self.КЛАВИШИ[k])return self.КЛАВИШИ[k];
   const f=k.match(/^f(\\d{1,2})$/);if(f&&+f[1]>=1&&+f[1]<=12)return "эф "+self.ЦИФРЫ[+f[1]];
   const буквы=w.replace(/\\d+$/,""),хвост=w.slice(буквы.length);
   if(буквы.length<=4&&буквы===буквы.toUpperCase()||буквы.length===1)return буквы.toLowerCase().split("").map(c=>self.БУКВЫ[c]||c).join(" ")+(хвост?" "+хвост:"");
   const пары=[["sch","ш"],["sh","ш"],["ch","ч"],["th","т"],["ph","ф"],["oo","у"],["ee","и"],["kh","х"],["zh","ж"],["ya","я"],["yu","ю"],["yo","ё"],["ts","ц"]];
   let x=буквы.toLowerCase();for(const [a,b] of пары)x=x.split(a).join(b);
   const М={a:"а",b:"б",c:"к",d:"д",e:"е",f:"ф",g:"г",h:"х",i:"и",j:"дж",k:"к",l:"л",m:"м",n:"н",o:"о",p:"п",q:"к",r:"р",s:"с",t:"т",u:"у",v:"в",w:"в",x:"кс",y:"и",z:"з"};
   return x.split("").map(c=>М[c]||c).join("")+(хвост?" "+хвост:"");});},
 wav(text,rate,vol,sex){const w=this.w;if(!w)return null;this.setSex(sex);text=this.кир(text);''')]
for a,b in pairs:
    if b in s:continue
    assert a in s,a[:60];s=s.replace(a,b,1);n+=1
open(H,"w",encoding="utf-8").write(s);print("index_before_mater.html правок (eSpeak латиница)",n)
