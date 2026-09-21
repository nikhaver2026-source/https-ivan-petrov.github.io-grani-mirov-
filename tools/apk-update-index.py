#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Заменить index.html внутри APK, не тронув ничего больше.

    python3 tools/apk-update-index.py старый.apk [index.html] [новый.apk]

Что делает и чего НЕ делает.

  • Находит внутри APK веб-страницу игры: assets/www/index.html,
    assets/index.html, www/index.html — или единственный */index.html под
    assets. Если кандидатов несколько, называет их и выходит: угадывать
    молча в таком деле нельзя.
  • Переписывает архив запись за записью, СОХРАНЯЯ способ упаковки каждой
    (STORED остаётся STORED). Это важно: resources.arsc и часть ресурсов
    Android читает отображением в память, и пережатие их ломает.
  • Выбрасывает старую подпись (META-INF/*.SF, *.RSA, *.DSA, *.EC,
    MANIFEST.MF): после правки она всё равно недействительна.
  • НЕ выравнивает и НЕ подписывает — это делает apk-update-index.sh рядом,
    потому что для этого нужны zipalign и apksigner.

Собранный этим скриптом APK без подписи не установится. Подпись будет ДРУГОЙ,
не той, которой подписан ваш прежний APK, поэтому установить его поверх нельзя:
сначала придётся удалить старую сборку, а вместе с ней — сохранения игры,
которые лежат в её личном хранилище.
"""
import io,os,re,sys,zipfile

КАНДИДАТЫ=["assets/www/index.html","assets/index.html","www/index.html",
           "assets/public/index.html","assets/dist/index.html"]
ПОДПИСЬ=re.compile(r'^META-INF/.*\.(SF|RSA|DSA|EC)$|^META-INF/MANIFEST\.MF$',re.I)

def найти(z):
    имена=z.namelist()
    for k in КАНДИДАТЫ:
        if k in имена: return k
    под=[n for n in имена if n.startswith("assets/") and n.endswith("/index.html")]
    под+=[n for n in имена if n=="index.html"]
    if len(под)==1: return под[0]
    if not под:
        raise SystemExit("index.html внутри APK не найден. Список записей под assets/:\n  "
                         +"\n  ".join([n for n in имена if n.startswith("assets/")][:40]))
    raise SystemExit("Кандидатов несколько, выберите руками и впишите в КАНДИДАТЫ:\n  "+"\n  ".join(под))

def main():
    if len(sys.argv)<2:
        raise SystemExit(__doc__)
    апк=sys.argv[1]
    новый_html=sys.argv[2] if len(sys.argv)>2 else "index.html"
    выход=sys.argv[3] if len(sys.argv)>3 else (os.path.splitext(апк)[0]+"-new.apk")
    if not os.path.exists(апк): raise SystemExit("Нет файла: "+апк)
    if not os.path.exists(новый_html): raise SystemExit("Нет файла: "+новый_html)
    данные=open(новый_html,"rb").read()

    with zipfile.ZipFile(апк,"r") as z:
        цель=найти(z)
        было=z.getinfo(цель)
        print("страница внутри APK: %s (%d байт)"%(цель,было.file_size))
        print("новая страница:      %s (%d байт)"%(новый_html,len(данные)))
        выброшено=0
        with zipfile.ZipFile(выход,"w",zipfile.ZIP_DEFLATED) as w:
            for i in z.infolist():
                if ПОДПИСЬ.match(i.filename):
                    выброшено+=1
                    continue
                тело=данные if i.filename==цель else z.read(i.filename)
                # Способ упаковки сохраняем: STORED остаётся STORED.
                зап=zipfile.ZipInfo(i.filename,date_time=i.date_time)
                зап.compress_type=i.compress_type
                зап.external_attr=i.external_attr
                зап.internal_attr=i.internal_attr
                зап.create_system=i.create_system
                w.writestr(зап,тело)
    print("старых записей подписи выброшено: %d"%выброшено)
    print("собрано без подписи: %s (%d байт)"%(выход,os.path.getsize(выход)))
    print("дальше — выравнивание и подпись: см. tools/apk-update-index.sh")

if __name__=="__main__":
    main()
