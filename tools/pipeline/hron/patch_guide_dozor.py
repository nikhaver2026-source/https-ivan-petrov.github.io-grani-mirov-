# Руководство: ночной дозор со стражей (3 ноября 2026) — глава 144 «Ночной дозор со стражей».
# Только когда модуль дозора собран (dozor_late.js в сборке).
import os,sys
H=os.path.dirname(os.path.abspath(__file__))
K=os.path.join(H,'dozor_late.js')
if not os.path.exists(K) or 'const Дозор=' not in open(K,encoding='utf-8').read():
    print('dozor: модуля дозора нет, руководство не меняется');sys.exit(0)
sys.path.insert(0,os.path.join(os.path.dirname(H),'guide3'))
from guidelib import Guide
R='/home/user/https-ivan-petrov.github.io-grani-mirov-/'
g=Guide()
T144=[
 "ЧТО ЭТО. Ночью, с восьми вечера до пяти утра, у поселения со стражей можно выйти в ночной дозор: десятник и стражник, у каждого своё имя и голос, обходят с вами пять постов и возвращаются к воротам. Выйти — в деревне «Помочь по хозяйству», у ворот ночью «Пойти с ночным дозором вокруг стен» или меню действий, «Квесты», «Ночной дозор».",
 "МАЯК ДОЗОРА. Он звенит кольчугой, а не колокольчиком, с той стороны, где идёт десятник, и идёт за ним. B (на телефоне — жест «где цель маяка») называет, где стражник; Shift+B гасит маяк; навестись снова — окно «Ночной дозор» или выбор стражника в осмотре.",
 "ОБХОД. Держитесь не дальше трёх шагов: отстанете — десятник ждёт и зовёт. Ушли дальше двенадцати шагов или зашли под крышу — дозор уйдёт без вас. На постах порой тревога: лихие люди или волк. Обошли всё — плата, опыт и отношение поселения; снова — через двенадцать часов.",
]
SECS=((144,'Ночной дозор со стражей',T144),)
for n,title,T in SECS:
    if n not in g.by:g.new_chapter(n,title,T)
src=g.src[:g.a]+g.render()+g.src[g.e:]
def put(old,new,check):
    global src
    if check in src:return
    assert src.count(old)==1,old;src=src.replace(old,new)
put('141,142,143]]','141,142,143,144]]','143,144]]')
a=src.index('const GUIDE_SEC_NAME={')
for n,title,T in SECS:
    if f'{n}:"' not in src[a:a+9000]:
        src=src[:a]+src[a:].replace('const GUIDE_SEC_NAME={','const GUIDE_SEC_NAME={'+f'{n}:"{title}",',1)
open(R+'index.html','w',encoding='utf-8').write(src)
print('dozor: руководство обновлено, глава 144',sum(len(t) for _,_,T in SECS for t in T))
