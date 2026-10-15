"""release175g.py — З2 (дополнение): фон пещеры и подземелья в звуковой картине (Scape.bed) просит сразу «cave_leak» —
ровно то, во что Bank.loop и так переводит «deep_drip»: под землёй это капли свода (Drips), наверху — долгая
пещерная запись. Поведение то же, но теперь, когда фон меняется сразу при смене места, ни один вызов не просит
сплошную капель. Повторный запуск ничего не меняет."""
B="/root/S/hron/index_before_mater.html"
s=open(B,encoding="utf-8").read()
a='''    kind==="cave"||kind==="dungeon"?"deep_drip":'''
b='''    kind==="cave"||kind==="dungeon"?"cave_leak":'''
if b not in s:
    assert s.count(a)==1,"нет фона пещеры"
    s=s.replace(a,b);print("фон пещеры: cave_leak")
open(B,"w",encoding="utf-8").write(s)
