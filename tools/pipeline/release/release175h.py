"""release175h.py — Р5: смысл фразы — меткой, а не по словам. В местах, откуда идёт больше всего речи (замер долгой
игрой: /root/S/t306/r5_sites.js), narrate получает явный вид: «result» — итог или отказ на действие игрока,
«context» — фоновая весть. Прежде вид угадывался: в такте шага итог мог стать «описанием места» и пропасть при
выключенных подсказках или обрезаться до первой фразы при минимальных. Угадывание по словам остаётся запасным
для остальных мест. Повторный запуск ничего не меняет."""
import re
H="/root/S/hron/"
МЕТКИ=[  # начало первого аргумента narrate(...) → вид
 ('`Экипировано оружие:',"result"),('"Паломничество не исполнено',"result"),('`Этот квест уже у вас.',"result"),
 ('`Куплено: ${item.gear',"result"),('"Идёт бой — не до сбора',"result"),('`Сегодня вы уже молились здесь',"result"),
 ('`Продано: ${res} — ${qty}',"result"),('"Заклинание не изучено."',"result"),('"Сначала завершите бой!"',"result"),
 ('`Шаг не проходит: сверху ${layerName',"result"),('`Создано: ${names[i]}.${куда}`',"result"),
 ('`${placeTitle()}. ${describeHere(true)} `',"result"),('`${c.terrain[1]}. ${c.terrain[2]} ${extra}`',"result"),
 ('"Здесь нечего делать. Осмотритесь или идите дальше."',"result"),('"Здесь нет ни входа, ни постройки, ни ресурса."',"result"),
 ('`${r.n} у вас уже есть — вторая не нужна.',"result"),('`Марш лестницы: ${n}',"result"),('`Под ногами пусто. Рядом:',"result"),
 ('`Вы вошли: ${placeTitle()}.${примета}',"result"),('`Молитва услышана. ${g.n}',"result"),('`Вы вышли наружу: ${name} остаётся позади.',"result"),
 ('"На этой клетке ресурсов нет."',"result"),('`Заклинание «${sp.n}» сотворено.',"result"),
 ('"На кладке руин — недобрые знаки',"context"),('`Узнано: ${k.n} — ${n||id}.',"context"),('`Народ «${raceName}» стал к вам теплее',"context"),
 ('startCraftText()',"context"),('`${e.n[0].toUpperCase()+e.n.slice(1)}. ${т}`',"context"),('`Записан рецепт: «${r.n}».',"context"),
 ('`${(STAND_SCOPE_BY_ID[scope]||{}).n||scope}',"context")]
def конец_вызова(s,i):
    """i — индекс '(' после narrate; вернуть индекс парной ')' и список запятых верхнего уровня"""
    глуб=0;запятые=[];j=i;стек=[]  # стек шаблонов: глубина фигурных скобок внутри ${...}
    while j<len(s):
        c=s[j]
        if c in "\"'":
            q=c;j+=1
            while s[j]!=q:
                j+=2 if s[j]=="\\" else 1
        elif c=="`":
            j+=1
            while True:
                if s[j]=="\\":j+=2;continue
                if s[j]=="`":break
                if s[j]=="$" and s[j+1]=="{":
                    k=конец_подстановки(s,j+2);j=k+1;continue
                j+=1
        elif c in "([{":глуб+=1
        elif c in ")]}":
            глуб-=1
            if глуб==0:return j,запятые
        elif c=="," and глуб==1:запятые.append(j)
        j+=1
    raise ValueError("нет конца вызова")
def конец_подстановки(s,j):
    """j — после '${'; вернуть индекс закрывающей '}'"""
    глуб=1
    while True:
        c=s[j]
        if c in "\"'":
            q=c;j+=1
            while s[j]!=q:j+=2 if s[j]=="\\" else 1
        elif c=="`":
            j+=1
            while True:
                if s[j]=="\\":j+=2;continue
                if s[j]=="`":break
                if s[j]=="$" and s[j+1]=="{":j=конец_подстановки(s,j+2)+1;continue
                j+=1
        elif c=="{":глуб+=1
        elif c=="}":
            глуб-=1
            if глуб==0:return j
        j+=1
import glob,os
файлы=["index_before_mater.html"]+[os.path.basename(f) for f in glob.glob(H+"*_late.js") if not f.endswith("mater_late.js")]
итого=0
for f in файлы:
    s=open(H+f,encoding="utf-8").read();правок=0
    for нач,вид in МЕТКИ:
        поз=0
        while True:
            i=s.find("narrate("+нач,поз)
            if i<0:break
            a=i+len("narrate")
            b,зап=конец_вызова(s,a)
            if not зап:
                s=s[:b]+',{cat:"'+вид+'"}'+s[b:];правок+=1
            else:
                арг=s[зап[0]+1:b].strip()
                if арг.startswith("{") and not re.search(r"\bcat\s*:",арг):
                    k=s.index("{",зап[0]);s=s[:k+1]+'cat:"'+вид+'",'+s[k+1:];правок+=1
            поз=i+8
    if правок:
        open(H+f,"w",encoding="utf-8").write(s);print(f,"меток:",правок);итого+=правок
print("всего меток:",итого)
