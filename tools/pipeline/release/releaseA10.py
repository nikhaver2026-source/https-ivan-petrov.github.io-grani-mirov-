"""releaseA10.py — номер «Альфа 1.0» во всех местах (CLAUDE.md), новости и README. Запускать после releaseA10a.py.
По слову игрока (27 октября 2026): после 17.5 игра называется «Альфа 1.0».
Повторный запуск ничего не меняет. Число наборов для README — первым аргументом (по итогам полного прогона)."""
import re,json,sys
R="/home/user/https-ivan-petrov.github.io-grani-mirov-/";B="/root/S/hron/index_before_mater.html"
НАБОРОВ=sys.argv[1] if len(sys.argv)>1 else "всех"
V="Альфа 1.0"
def sub(path,a,b,n=None):
    s=open(path,encoding="utf-8").read();c=s.count(a)
    if c==0 and b in s:return 0
    if n is not None and c!=n:raise SystemExit(f"{path}: «{a}» встречается {c} раз, ждали {n}")
    if c==0:raise SystemExit(f"{path}: нет «{a}»")
    open(path,"w",encoding="utf-8").write(s.replace(a,b));return c
s=open(B,encoding="utf-8").read()
for a,b in [] if f"<title>Грань Миров. {V}</title>" in s else [("<title>Грань Миров. Версия 17.5</title>",f"<title>Грань Миров. {V}</title>"),
            ('opacity:.75">Версия 17.5</small>',f'opacity:.75">{V}</small>'),
            ('const WEB_VERSION="17.5",APP_VERSION="17.5";',f'const WEB_VERSION="{V}",APP_VERSION="{V}";'),
            ('const ANDROID_VERSION="17.5";',f'const ANDROID_VERSION="{V}";')]:
    if s.count(a)!=1:raise SystemExit("основа: "+a)
    s=s.replace(a,b)
NEWS=[
 ("Альфа 1.0: предания Грани","Новые школы магии и формы плетения, твари, питомцы и скакуны, вещи, умения и семнадцать краёв со своими людьми, богами и делами. Всё живёт в общем мире: встречи, бои, торговля, наставники, поселения."),
 ("Альфа 1.0: рост через познание мира","Уровни, ветви силы, Древо Граней, ремёсла, пути мастерства и звери растут заметно медленнее. С пятого уровня новый уровень требует узнавать мир. Окно «Герой», строка «Познание мира», — чего не хватает."),
 ("Альфа 1.0: опыт за тварь и за знание","Одна и та же порода приедается, тварь много слабее героя почти ничего не даёт, первая победа над новой породой — в полтора раза больше. Новый рецепт, язык, обряд или тайна сами приносят опыт."),
 ("Альфа 1.0: игра проверена и почищена","Полная проверка: сняты мёртвые команды и старые обработчики, которые тихо заменялись новыми, повторные обёртки сведены в одну. Игра ведёт себя как прежде, но работы у неё меньше."),
 ("Альфа 1.0: Android — постоянная подпись","Приложение подписано постоянным ключом. Поверх 17.5 эта версия не встанет: в 17.5 сделайте «Сохранить в файл», удалите игру, не оставляя данных, поставьте Альфу 1.0 и «Загрузить из файла».")]
for н,т in NEWS:
    assert len(н)<=70 and len(т)<=260,(н,len(т))
m=re.search(r"\nconst NEWS_V=NEWS\[NEWS.length-1\]\.v;",s)
if not m:raise SystemExit("нет NEWS_V")
last=max(int(x) for x in re.findall(r"\{v:(\d+),н:",s))
add="".join(f"\nNEWS.push({{v:{last+1+i},н:{json.dumps(н,ensure_ascii=False)},\n  т:{json.dumps(т,ensure_ascii=False)}}});" for i,(н,т) in enumerate(NEWS))
if NEWS[0][0] not in s:s=s[:m.start()]+add+s[m.start():]
open(B,"w",encoding="utf-8").write(s)
sub(R+"android/app/build.gradle","versionName '17.5'",f"versionName '{V}'",1)
sub(R+"desktop/package.json",'"version": "17.5.0"','"version": "1.0.0-alpha"',1)
sub(R+"desktop/preload.js","version: '17.5'",f"version: '{V}'",1)
sub(R+"desktop/README.txt","Грань Миров 17.5",f"Грань Миров {V}")
A=R+".github/workflows/android.yml"
sub(A,"grani-mirov-17.5-full.apk","grani-mirov-alpha-1.0-full.apk")
sub(A,"«Грань Миров» 17.5",f"«Грань Миров» {V}")
sub(A,"Грань Миров 17.5 для Android",f"Грань Миров {V} для Android")
W=R+".github/workflows/windows.yml"
sub(W,"GraniMirov-17.5-windows-full.zip","GraniMirov-alpha-1.0-windows-full.zip")
sub(W,"--app-version=17.5.0 --build-version=17.5.0.","--app-version=1.0.0 --build-version=1.0.0.",1)
sub(W,"«Грань Миров» 17.5",f"«Грань Миров» {V}")
sub(W,"Грань Миров 17.5 для Windows",f"Грань Миров {V} для Windows")
for p in (A,W):   # 17.5 остаётся только в заметке о переходе с прежней версии (поверх 17.5 не встанет)
    if re.search(r"17\.5(-|\.0| для)",open(p,encoding="utf-8").read()):raise SystemExit(p+": остался номер 17.5")
sv=open(R+"sw.js",encoding="utf-8").read();mm=re.search(r'const SHELL="grani-shell-v(\d+)";',sv)
if int(mm.group(1))==79:sv=sv.replace(mm.group(0),'const SHELL="grani-shell-v80";');open(R+"sw.js","w",encoding="utf-8").write(sv)
sub(R+"tests/230-svody.js","версия 17.5",f"версия {V}",1);sub(R+"tests/230-svody.js",'д.версия==="17.5"',f'д.версия==="{V}"',1)
rd=open(R+"README.md",encoding="utf-8").read()
ЗАГ=f"## {V}: предания Грани, рост через познание мира, полная проверка, постоянная подпись Android"
if ЗАГ not in rd:
    head=ЗАГ+"""

Первая альфа: после 17.5 игра называется «Альфа 1.0». Всё, что сделано после 17.5:

* **Предания Грани** — новые школы магии, формы плетения, заклинания, твари, питомцы и скакуны, вещи, умения,
  семнадцать краёв со своими людьми, богами и делами (`docs/КАНОН.md`).
* **Рост через познание мира** — уровни, ветви силы, Древо Граней, ремёсла, пути мастерства и звери растут
  примерно вдвое медленнее; с пятого уровня новый уровень требует узнавать мир (`docs/РОСТ.md`).
* **Полная проверка игры** — статический разбор всей страницы (`tools/pipeline/audit/audit.js`): сняты мёртвые
  команды и старые объявления, которые поздние модули тихо заменяли целиком; повторные обёртки одной функции в
  модуле канона сведены в одну (`КанонЦепь`); итог — `docs/ПРОВЕРКА.md`.
* **Android — постоянная подпись** из секретов репозитория (как у «Подземной лаборатории»). Поверх 17.5 эта
  версия не встанет: в 17.5 «Сохранить в файл», удалить игру, не оставляя данных, поставить Альфу 1.0 и
  «Загрузить из файла». Дальше обновления снова ставятся поверх.

Проверено полным прогоном """+НАБОРОВ+""" наборов; новые наборы 344 и 345.

"""
    i=rd.index("## Версия 17.5: свежая речь")
    rd=rd[:i]+head+rd[i:]
else:
    rd=re.sub(r"Проверено полным прогоном [^\n]* наборов; новые наборы 344 и 345\.","Проверено полным прогоном "+НАБОРОВ+" наборов; новые наборы 344 и 345.",rd,count=1)
open(R+"README.md","w",encoding="utf-8").write(rd)
print(f"{V} расставлена; новостей",len(NEWS),"с номера",last+1)
