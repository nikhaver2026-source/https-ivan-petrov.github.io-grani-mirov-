#!/usr/bin/env python3.13
"""voicedjoin.py N [веса…] — ровность голоса на швах «гласный/сонорный — гласный/сонорный»: периодичность (макс.
норм. автокорреляции на лагах 2,5–12 мс) в окне 20 мс у точки шва и в 30–50 мс по сторонам; синтез против живых
границ с теми же парами звуков."""
import sys, os, json, random, collections
import numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
SR = 24000
def пер(x):
    x = x - x.mean(); r = np.correlate(x, x, "full")[len(x) - 1:]; r = r / (r[0] + 1e-12); return float(r[60:290].max())
def мера(y, p):
    if p - 1440 < 0 or p + 1440 > len(y): return None
    ц = пер(y[p - 240:p + 240]); с = 0.5 * (пер(y[p - 1200:p - 720]) + пер(y[p + 720:p + 1200]))
    return ц, с
N = int(sys.argv[1]); фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:N]; ЗВ = {"гг", "гс", "сг", "сс"}
for арг in (sys.argv[2:] or ["{}"]):
    S = E.Синтезатор("m", json.loads(арг)); V = S.V; r = []; пары = collections.Counter(); по_виду = {}
    for ф in фразы:
        for от in E.текст_в_отрезки(ф):
            x, res, кс = S.отрезок(от["w"], от["end"])
            for k, p in enumerate(S.стыки_отрезка):
                пара = (S._край_вид(кс[k], -1) or "?") + (S._край_вид(кс[k + 1], 0) or "?")
                if пара not in ЗВ: continue
                m = мера(x, p)
                if m:
                    r.append(m); пары[пара] += 1; по_виду.setdefault(S.виды_отрезка[k], []).append(m)
                    # звонкость соседей в источнике: что шло после левого куска и до правого
                    def сосед_зв(кусок, сторона):
                        ri, s_, e_, j, вид, o = кусок; rr = V.recs[ri]
                        if вид != "o" or "ph" not in rr: return "?"
                        ws = rr["w"]
                        if сторона < 0:
                            if j + 1 >= len(ws) or ws[j][4] > 0.03: return "пауза"
                            return S._класс_звука(rr["ph"][j + 1][0][0])
                        j0 = next((q for q in range(j, -1, -1) if abs(ws[q][1] - s_) < 0.03), None)
                        if j0 is None or j0 == 0 or ws[j0][3] > 0.03: return "пауза"
                        return S._класс_звука(rr["ph"][j0 - 1][-1][0])
                    зл, зп = сосед_зв(кс[k], -1), сосед_зв(кс[k + 1], 0)
                    ключ = "источник: " + ("звонкий" if зл in ("г", "с") else зл) + " / " + ("звонкий" if зп in ("г", "с") else зп)
                    по_виду.setdefault(ключ, []).append(m)
    r = np.array(r); print(f"синтез {арг}: звонких швов {len(r)}, периодичность у точки {r[:, 0].mean():.3f}, по сторонам {r[:, 1].mean():.3f}, провал {np.mean(r[:, 1] - r[:, 0]):+.3f}; у точки < 0,5: {np.mean(r[:, 0] < 0.5):.1%}", flush=True)
    for вид, v in по_виду.items(): v = np.array(v); print(f"   {вид}: {len(v)}, у точки {v[:, 0].mean():.3f}, по сторонам {v[:, 1].mean():.3f}")
random.seed(3); ж = []; нужно = dict(пары); тр = 0
while sum(нужно.values()) > 0 and тр < 300000:
    тр += 1; ri = random.randrange(len(V.recs)); rr = V.recs[ri]
    if "ph" not in rr or len(rr["w"]) < 2 or ri in V.искл_ri: continue
    j = random.randrange(len(rr["w"]) - 1)
    if rr["w"][j][4] > 0.005: continue
    пара = (S._класс_звука(rr["ph"][j][-1][0]) or "?") + (S._класс_звука(rr["ph"][j + 1][0][0]) or "?")
    if нужно.get(пара, 0) <= 0: continue
    m = мера(V.звук(ri), int(rr["w"][j][2] * SR))
    if m: ж.append(m); нужно[пара] -= 1
ж = np.array(ж); print(f"живая речь: границ {len(ж)}, периодичность у точки {ж[:, 0].mean():.3f}, по сторонам {ж[:, 1].mean():.3f}, провал {np.mean(ж[:, 1] - ж[:, 0]):+.3f}; у точки < 0,5: {np.mean(ж[:, 0] < 0.5):.1%}")
