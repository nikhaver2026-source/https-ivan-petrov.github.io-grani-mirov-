"""release165.py — номер 16.5 во всех местах (CLAUDE.md), новости и README. Запускать ПОСЛЕ release160d.
Повторный запуск ничего не меняет."""
import re,json
R="/home/user/https-ivan-petrov.github.io-grani-mirov-/";B="/root/S/hron/index_before_mater.html"
def sub(path,a,b,n=None):
    s=open(path,encoding="utf-8").read();c=s.count(a)
    if c==0 and b in s:return 0   # уже 16.5 (повторный запуск)
    if n is not None and c!=n:raise SystemExit(f"{path}: «{a}» встречается {c} раз, ждали {n}")
    if c==0:raise SystemExit(f"{path}: нет «{a}»")
    open(path,"w",encoding="utf-8").write(s.replace(a,b));return c
s=open(B,encoding="utf-8").read()
for a,b in [] if "<title>Грань Миров. Версия 16.5</title>" in s else [("<title>Грань Миров. Версия 16.0</title>","<title>Грань Миров. Версия 16.5</title>"),
            ('opacity:.75">Версия 16.0</small>','opacity:.75">Версия 16.5</small>'),
            ('const WEB_VERSION="16.0",APP_VERSION="16.0";','const WEB_VERSION="16.5",APP_VERSION="16.5";'),
            ('const ANDROID_VERSION="16.0";','const ANDROID_VERSION="16.5";')]:
    if s.count(a)!=1:raise SystemExit("основа: "+a)
    s=s.replace(a,b)
# «Игровое поле» после закрытия окна или меню — по просьбе игрока этой фразы нет нигде
ПОЛЕ=[('safeFn(()=>narrate("Меню действий закрыто. Игровое поле.",{interrupt:true}));}','safeFn(()=>narrate("Меню действий закрыто.",{interrupt:true}));}'),
 ('const куда=низ?`Окно «${modalTitleText(низ)}»`:(gameActive()?"Игровое поле":"Главное меню");\n  narrate(имя?`Окно «${имя}» закрыто. ${куда}.`:`${куда}.`,{interrupt:true,pri:1,cat:"ui"});});}',
  'const куда=низ?`Окно «${modalTitleText(низ)}»`:(gameActive()?"":"Главное меню");\n  if(!имя&&!куда)return;\n  narrate(имя?`Окно «${имя}» закрыто.${куда?` ${куда}.`:""}`:`${куда}.`,{interrupt:true,pri:1,cat:"ui"});});}'),
 ('safeFn(()=>{narrate("Игровое поле.");look();});','safeFn(()=>look());'),
 ('narrate("Закрывать нечего: ни окна, ни меню сверху нет. Вы на игровом поле.");','narrate("Закрывать нечего: ни окна, ни меню сверху нет.");'),
 ('«Окно „Живой мир“ закрыто. Игровое поле»','«Окно „Живой мир“ закрыто»')]
for a,b in ПОЛЕ:
    if b in s and a not in s:continue
    if s.count(a)!=1:raise SystemExit("основа (поле): "+a[:60])
    s=s.replace(a,b)
NEWS=[
 ("версия 16.5: время, возрождение, карта и двери","Шаг внутри места больше не стоит времени. Павший очнётся на дороге у ближайшего поселения. В Windows: E — дверь, Shift+G — карта с координатами и маяком, Ctrl+G — свои метки. Двери стоят только в проёмах, тупиков за ними нет."),
 ("версия 16.5: здания, тайные ходы, растущие твари","Трактир в каждом поселении, в больших городах — аптека, кузница, мастерская, книжня, храм, казарма. Тайные ходы ведут в тоннели и катакомбы. Твари растут и учат навыки; Режиссёр решает и по ходу живой игры."),
 ("версия 16.5: верхом, выучка, загадки","Верхом шаг — две-три клетки, и в небе тоже, со взмахом крыла своего скакуна. Звероведение и езда растут от дела, выше четырёх — уроки у мастера. Загадка яруса открывается рядом с ней. Температурный механизм — четыре стрелки, три подсказки."),
 ("версия 16.5: звук подземелий и голоса","Под землёй только мрачная музыка, у каждого яруса свой фон. Двери, рычаги и удары звучат с эхом места. Голос богов — с неба. Слово твари громче, тварь с героем говорят по очереди. Шаг в лаз и на новый ярус не замирает.")]
for н,т in NEWS:
    assert len(н)<=70 and len(т)<=260,(н,len(т))
m=re.search(r"\nconst NEWS_V=NEWS\[NEWS.length-1\]\.v;",s)
if not m:raise SystemExit("нет NEWS_V")
last=max(int(x) for x in re.findall(r"\{v:(\d+),н:",s))
add="".join(f"\nNEWS.push({{v:{last+1+i},н:{json.dumps(н,ensure_ascii=False)},\n  т:{json.dumps(т,ensure_ascii=False)}}});" for i,(н,т) in enumerate(NEWS))
if NEWS[0][0] not in s:s=s[:m.start()]+add+s[m.start():]
for стар,нов in [(json.dumps("Верхом шаг — две-три клетки. Звероведение и верховая езда растут от дела, выше четырёх — уроки у мастера. Загадка яруса открывается рядом с ней. Температурный механизм — четыре стрелки, три подсказки со штрафом.",ensure_ascii=False),json.dumps(NEWS[2][1],ensure_ascii=False)),(json.dumps("Под землёй только мрачная музыка, у каждого яруса свой фон. Двери, рычаги и удары звучат с эхом места. Голос богов — с неба. Слово твари громче, и тварь с героем говорят по очереди.",ensure_ascii=False),json.dumps(NEWS[3][1],ensure_ascii=False))]:
    if стар in s:s=s.replace(стар,нов)
open(B,"w",encoding="utf-8").write(s)
sub(R+"android/app/build.gradle","versionName '16.0'","versionName '16.5'",1)
sub(R+"desktop/package.json",'"version": "16.0.0"','"version": "16.5.0"',1)
sub(R+"desktop/preload.js","version: '16.0'","version: '16.5'",1)
sub(R+"desktop/README.txt","Грань Миров 16.0","Грань Миров 16.5")
sub(R+".github/workflows/android.yml","16.0","16.5",11)
sub(R+".github/workflows/windows.yml","16.0","16.5",9)
sv=open(R+"sw.js",encoding="utf-8").read();mm=re.search(r'const SHELL="grani-shell-v(\d+)";',sv)
if int(mm.group(1))==76:sv=sv.replace(mm.group(0),'const SHELL="grani-shell-v77";');open(R+"sw.js","w",encoding="utf-8").write(sv)
sub(R+"tests/230-svody.js","версия 16.0","версия 16.5",1);sub(R+"tests/230-svody.js",'д.версия==="16.0"','д.версия==="16.5"',1)
rd=open(R+"README.md",encoding="utf-8").read()
if "## Версия 16.5" not in rd:
    head="""## Версия 16.5: время мира, возрождение, карта и двери, здания и тайные ходы, растущие твари, верховая езда и выучка, загадки, звук подземелий

Проверено полным прогоном всех наборов (326); новые наборы 326–329.

"""
    i=rd.index("## После 16.0 (в ветке, войдёт в следующую версию):")
    rd=rd[:i]+head+rd[i:]
    rd=rd.replace("## После 16.0 (в ветке, войдёт в следующую версию): ","### ")
    open(R+"README.md","w",encoding="utf-8").write(rd)
print("16.5 расставлена; новостей",len(NEWS),"с номера",last+1)
