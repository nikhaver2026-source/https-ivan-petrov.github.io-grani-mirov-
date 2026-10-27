# apply_tests_k2.py — набор 344 считает тварей и вещи канона I отдельно от канона II (Альфа 1.5); набор 346 — в tests/.
import shutil
R = "/home/user/https-ivan-petrov.github.io-grani-mirov-/tests/"
p = R + "344-kanon-grani.js"
s = open(p, encoding="utf-8").read()
for a, b in [
    ('''const т=await p.evaluate(async()=>{const o={всего:КАНОН_ТВАРИ.length};''',
     '''const т=await p.evaluate(async()=>{const o={всего:(KN.creatures||[]).filter(c=>!c.канон2).length};  /* (Альфа 1.5) канон II считает набор 346 */'''),
    ('''const в=await p.evaluate(async()=>{const o={всего:КАНОН_ВЕЩИ.length};''',
     '''const в=await p.evaluate(async()=>{const o={всего:КАНОН_ВЕЩИ.filter(x=>!x.канон2).length};  /* (Альфа 1.5) канон II считает набор 346 */'''),
]:
    if b in s: continue
    assert s.count(a) == 1, a[:60]
    s = s.replace(a, b)
open(p, "w", encoding="utf-8").write(s)
shutil.copy("/root/S/kanon/346-predaniya-kraev.js", R + "346-predaniya-kraev.js")
print("наборы 344 и 346 готовы")
