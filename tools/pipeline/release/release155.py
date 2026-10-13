"""release155.py — номер 15.5 во всех местах (CLAUDE.md), новости и README. Запускать ПОСЛЕ выпуска 15.0.
Повторный запуск ничего не меняет."""
import re,json
R="/home/user/https-ivan-petrov.github.io-grani-mirov-/";B="/tmp/claude-0/-home-user-https-ivan-petrov-github-io-grani-mirov-/27f5cebc-2d4b-556f-9c1f-bc733d69f26b/scratchpad/hron/index_before_mater.html"
def sub(path,a,b,n=None):
    s=open(path,encoding="utf-8").read();c=s.count(a)
    if c==0 and b in s:return 0   # уже 15.5 (повторный запуск)
    if n is not None and c!=n:raise SystemExit(f"{path}: «{a}» встречается {c} раз, ждали {n}")
    if c==0:raise SystemExit(f"{path}: нет «{a}»")
    open(path,"w",encoding="utf-8").write(s.replace(a,b));return c
s=open(B,encoding="utf-8").read()
for a,b in [] if "<title>Грань Миров. Версия 15.5</title>" in s else [("<title>Грань Миров. Версия 15.0</title>","<title>Грань Миров. Версия 15.5</title>"),
            ('opacity:.75">Версия 15.0</small>','opacity:.75">Версия 15.5</small>'),
            ('const WEB_VERSION="15.0",APP_VERSION="15.0";','const WEB_VERSION="15.5",APP_VERSION="15.5";'),
            ('const ANDROID_VERSION="15.0";','const ANDROID_VERSION="15.5";')]:
    if s.count(a)!=1:raise SystemExit("основа: "+a)
    s=s.replace(a,b)
NEWS=[
 ("версия 15.5: Шов под штольнями","Второй акт «Немоты»: на седьмом ярусе Немых штолен дышит Шов, рубец Разрыва. Сшить его обрядом в три шага, оставить дышать по слову Вольных Слухачей или отколоть осколки — решаете вы; поле копей, Нуль и Владыка слушаются Шва."),
 ("версия 15.5: твари Немоты — собой","В Немых штольнях твари Немоты больше не получают чужих имён и навыков Глуби: страж-глушитель так и зовётся в бою и бьётся своими приёмами.")]
for н,т in NEWS:
    assert len(н)<=70 and len(т)<=260,(н,len(т))
m=re.search(r"\nconst NEWS_V=NEWS\[NEWS.length-1\]\.v;",s)
if not m:raise SystemExit("нет NEWS_V")
last=max(int(x) for x in re.findall(r"\{v:(\d+),н:",s))
add="".join(f"\nNEWS.push({{v:{last+1+i},н:{json.dumps(н,ensure_ascii=False)},\n  т:{json.dumps(т,ensure_ascii=False)}}});" for i,(н,т) in enumerate(NEWS))
if NEWS[0][0] not in s:s=s[:m.start()]+add+s[m.start():]
open(B,"w",encoding="utf-8").write(s)
sub(R+"android/app/build.gradle","versionName '15.0'","versionName '15.5'",1)
sub(R+"desktop/package.json",'"version": "15.0.0"','"version": "15.5.0"',1)
sub(R+"desktop/preload.js","version: '15.0'","version: '15.5'",1)
sub(R+"desktop/README.txt","Грань Миров 15.0","Грань Миров 15.5")
sub(R+".github/workflows/android.yml","15.0","15.5")
sub(R+".github/workflows/windows.yml","15.0","15.5")
sv=open(R+"sw.js",encoding="utf-8").read();mm=re.search(r'const SHELL="grani-shell-v(\d+)";',sv)
if int(mm.group(1))==72:sv=sv.replace(mm.group(0),'const SHELL="grani-shell-v73";');open(R+"sw.js","w",encoding="utf-8").write(sv)
sub(R+"tests/230-svody.js","версия 15.0","версия 15.5",1);sub(R+"tests/230-svody.js",'д.версия==="15.0"','д.версия==="15.5"',1)
rd=open(R+"README.md",encoding="utf-8").read()
if "## Версия 15.5" not in rd:
    sec="""## Версия 15.5: «Шов под штольнями» — второй акт «Немоты»

- **«Шов под штольнями».** Глушитель на четвёртом ярусе держал Шов — рубец Разрыва на седьмом ярусе Немых штолен.
  Дело даёт тот, кому вы отчитались в первом акте, или Ваэль; камертон на седьмом ярусе называет сторону и шаги до Шва.
  Сшить, оставить дышать или отколоть два осколка — у каждого исхода свои последствия: поле Боргинских копей, Нуль
  нижних ярусов и Владыка слушаются Шва, ордена отвечают по-своему. Набор 316.
- **Обряд «Сшить Шов».** Три шага: найти края (нитью — точно, камертоном — приблизительно, рукой — опасно), смазать
  двумя кусками тишь-смолы или тремя немого кварца, стянуть приёмом «Сшить» или печатью. Ошибка у краёв, кривой шов,
  который расходится через семь дней, открытие в последний миг и право прервать на любом шаге. Набор 316.
- **Умолка и Вольные Слухачи.** Старшая слухачка на шестом ярусе: с нитью показывает старый рубец Шва, за слово
  оставить Шов дышать Слухачи больше не нападают; нарушенное слово и нападение помнят. Два новых свидетельства в
  хронике — «Старый рубец Шва» и «Голос за Швом». Набор 316.
- **Твари Немоты — собой.** В Немых штольнях Глубь больше не даёт тварям Немоты чужих имён и навыков. Набор 316.
- Подробно — `docs/НЕМОТА.md`, раздел 19; глава руководства 123.

"""
    rd=rd.replace("## Версия 15.0:",sec+"## Версия 15.0:",1)
    open(R+"README.md","w",encoding="utf-8").write(rd)
print("15.5 расставлена; новостей",len(NEWS),"с номера",last+1)
