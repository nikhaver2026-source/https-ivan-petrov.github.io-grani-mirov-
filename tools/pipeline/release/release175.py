"""release175.py — номер 17.5 во всех местах (CLAUDE.md), новости и README. Запускать после release175a–k.
Повторный запуск ничего не меняет. Число наборов для README — первым аргументом (по итогам полного прогона)."""
import re,json,sys
R="/home/user/https-ivan-petrov.github.io-grani-mirov-/";B="/root/S/hron/index_before_mater.html"
НАБОРОВ=sys.argv[1] if len(sys.argv)>1 else "всех"
def sub(path,a,b,n=None):
    s=open(path,encoding="utf-8").read();c=s.count(a)
    if c==0 and b in s:return 0
    if n is not None and c!=n:raise SystemExit(f"{path}: «{a}» встречается {c} раз, ждали {n}")
    if c==0:raise SystemExit(f"{path}: нет «{a}»")
    open(path,"w",encoding="utf-8").write(s.replace(a,b));return c
s=open(B,encoding="utf-8").read()
for a,b in [] if "<title>Грань Миров. Версия 17.5</title>" in s else [("<title>Грань Миров. Версия 17.0</title>","<title>Грань Миров. Версия 17.5</title>"),
            ('opacity:.75">Версия 17.0</small>','opacity:.75">Версия 17.5</small>'),
            ('const WEB_VERSION="17.0",APP_VERSION="17.0";','const WEB_VERSION="17.5",APP_VERSION="17.5";'),
            ('const ANDROID_VERSION="17.0";','const ANDROID_VERSION="17.5";')]:
    if s.count(a)!=1:raise SystemExit("основа: "+a)
    s=s.replace(a,b)
NEWS=[
 ("версия 17.5: свежая речь, один голос на фразу","События мира не читаются хвостом: звучат свежие, устаревшие снимаются. Предложение говорит один голос — запись или синтезатор, без смеси. Между фразами музыка не поднимается на миг. Записи голоса звучат из памяти, без задержки."),
 ("версия 17.5: звук ровнее, динамик телефона","Громкость вариантов одного звука выровнена по замеру: шаг или крик не прыгают. Режим «Динамик телефона» в настройках громкости: тихие звуки мира слышны на маленьком динамике. Фон места меняется сразу, днём и ночью — свой."),
 ("версия 17.5: журнал речи и звука","Меню действий, раздел «Звук», пункт «Журнал речи и звука»: сколько фраз сказано, сколько снято и почему, какие звуки не прозвучали. «Сохранить журнал в файл» — если что-то не прозвучало, пришлите этот файл."),
 ("версия 17.5: без «Сначала завершите бой»","Из боя можно сбежать, убежать от твари или уйти «Покровом тени» — фраза, будто бой надо непременно закончить, убрана отовсюду: шаг, лаз, подъёмник, лестница, рыбалка, узел Сети."),
 ("версия 17.5: Android — файлы и обновление","«Сохранить в файл» кладёт файл в «Загрузки», «Загрузить из файла» открывает выбор файла телефона. Старый голосовой пакет больше не занимает память. Удаляя игру, Android предлагает оставить сохранения.")]
for н,т in NEWS:
    assert len(н)<=70 and len(т)<=260,(н,len(т))
m=re.search(r"\nconst NEWS_V=NEWS\[NEWS.length-1\]\.v;",s)
if not m:raise SystemExit("нет NEWS_V")
last=max(int(x) for x in re.findall(r"\{v:(\d+),н:",s))
add="".join(f"\nNEWS.push({{v:{last+1+i},н:{json.dumps(н,ensure_ascii=False)},\n  т:{json.dumps(т,ensure_ascii=False)}}});" for i,(н,т) in enumerate(NEWS))
if NEWS[0][0] not in s:s=s[:m.start()]+add+s[m.start():]
open(B,"w",encoding="utf-8").write(s)
sub(R+"android/app/build.gradle","versionName '17.0'","versionName '17.5'",1)
sub(R+"desktop/package.json",'"version": "17.0.0"','"version": "17.5.0"',1)
sub(R+"desktop/preload.js","version: '17.0'","version: '17.5'",1)
sub(R+"desktop/README.txt","Грань Миров 17.0","Грань Миров 17.5")
sub(R+".github/workflows/android.yml","17.0","17.5",14)
sub(R+".github/workflows/windows.yml","17.0","17.5",9)
sv=open(R+"sw.js",encoding="utf-8").read();mm=re.search(r'const SHELL="grani-shell-v(\d+)";',sv)
if int(mm.group(1))==78:sv=sv.replace(mm.group(0),'const SHELL="grani-shell-v79";');open(R+"sw.js","w",encoding="utf-8").write(sv)
sub(R+"tests/230-svody.js","версия 17.0","версия 17.5",1);sub(R+"tests/230-svody.js",'д.версия==="17.0"','д.версия==="17.5"',1)
rd=open(R+"README.md",encoding="utf-8").read()
rd=rd.replace("## Версия 17.0, продолжение: установка на Android и файлы на телефоне","## Версия 17.5: установка на Android и файлы на телефоне",1)
rd=rd.replace("## Версия 17.0, продолжение: единые обработчики речи и звука — по разбору","## Версия 17.5: единые обработчики речи и звука — по разбору",1)
ЗАГ="## Версия 17.5: свежая речь, ровный звук, журнал речи и звука, Android — файлы и обновление"
if ЗАГ not in rd:
    head=ЗАГ+"""

Все обновления, сделанные после выхода 17.0: единые обработчики речи и звука по разбору (части Р1–Р6, З1–З6, О1 —
см. раздел ниже), без фразы «Сначала завершите бой», приложение Android (файлы в «Загрузки», выбор файла, старый
голосовой пакет больше не занимает память, сохранения переживают удаление) и сборка, которая сама проверяет
установку поверх прежней версии, ключ подписи и запуск на Android 12, 15 и 16. Пять новостей в игре.

Проверено полным прогоном """+НАБОРОВ+""" наборов; новые наборы 339 и 340.

"""
    i=rd.index("## Версия 17.5: установка на Android")
    rd=rd[:i]+head+rd[i:]
else:
    rd=re.sub(r"Проверено полным прогоном [^\n]* наборов; новые наборы 339 и 340\.","Проверено полным прогоном "+НАБОРОВ+" наборов; новые наборы 339 и 340.",rd,count=1)
open(R+"README.md","w",encoding="utf-8").write(rd)
print("17.5 расставлена; новостей",len(NEWS),"с номера",last+1)
