#!/usr/bin/env python3.13
"""seamstat.py N [веса…] — швы между словами на N фразах против живых границ слов: по парам «вид звука слева — вид
звука справа» (г — гласный, с — сонорный, з — звонкий согласный, к — глухой) и по виду шва: провал громкости у точки,
скачок спектра (к обычному внутри речи), ступенька громкости и высоты. Где синтез дальше всего от живой речи — там и
слышна негладкость. Плюс переходы между отрезками: разница громкости и высоты соседних отрезков."""
import sys, os, json, math, random, collections, numpy as np
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
SR = 24000; h = int(SR * 0.005); N_ = int(SR * 0.02)
def db(x): return 10 * math.log10(float(np.mean(np.asarray(x, np.float64) ** 2)) + 1e-10)
def мерки(y, p, обычно):
    if p - 1680 < 0 or p + 1680 > len(y): return None
    ц = db(y[p - 240:p + 240]); л = db(y[p - 1440:p - 720]); п = db(y[p + 720:p + 1440])
    if max(л, п) < -45: return None
    кадры = [y[k:k + N_] for k in range(p - 3 * h - N_ // 2, p + 3 * h - N_ // 2 + 1, h)]
    M = np.array([E._mfcc(c)[1:] for c in кадры]); сп = float(np.linalg.norm(np.diff(M, axis=0), axis=1).max()) / обычно
    def f0(a, b):
        s = y[a:b]; v = [E._yin_f0(s[i:i + 720]) for i in range(0, len(s) - 720 + 1, 240)]; v = [q for q in v if q > 0]
        return float(np.median(v)) if v else 0.0
    fл, fп = f0(p - 1680, p - 120), f0(p + 120, p + 1680)
    return dict(провал=ц - max(л, п), спектр=сп, ступень=abs(п - л), высота=abs(12 * math.log2(fп / fл)) if fл > 0 and fп > 0 else None)
def обычный(y):
    кадры = [y[k:k + N_] for k in range(0, len(y) - N_, h)]
    if len(кадры) < 10: return None
    M = np.array([E._mfcc(c)[1:] for c in кадры]); En = np.array([db(c) for c in кадры]); пт = np.r_[0, np.linalg.norm(np.diff(M, axis=0), axis=1)]
    г = En > En.max() - 30; return float(np.median(пт[г])) if г.sum() > 5 else None
def сводка(имя, d, минимум=25):
    print(имя)
    for k, v in sorted(d.items(), key=lambda z: -len(z[1])):
        if len(v) < минимум: continue
        пр = np.array([m["провал"] for m in v]); сп = np.array([m["спектр"] for m in v]); ст = np.array([m["ступень"] for m in v]); вс = np.array([m["высота"] for m in v if m["высота"] is not None])
        print(f"   {str(k):34s} {len(v):5d} | провал {пр.mean():+5.1f} дБ, < −6 дБ {np.mean(пр < -6):4.0%} | спектр {np.median(сп):4.1f}, > 3 {np.mean(сп > 3):4.0%} | ступень {np.median(ст):4.1f} дБ | высота {np.median(вс) if len(вс) else float('nan'):4.1f} пт, > 3 пт {np.mean(вс > 3) if len(вс) else float('nan'):4.0%}")
if __name__ == "__main__":
    N = int(sys.argv[1]); фразы = json.load(open("/root/S/us2/test_set400.json", encoding="utf-8"))[:N]
    for арг in (sys.argv[2:] or ["{}"]):
        S = E.Синтезатор("m", json.loads(арг)); V = S.V; пары = collections.defaultdict(list); виды = collections.defaultdict(list); меж = []
        for ф in фразы:
            пред = None; S._рег_пред = None
            for от in E.текст_в_отрезки(ф):
                x, res, кс = S.отрезок(от["w"], от["end"]); x = np.asarray(x, np.float64); об = обычный(x)
                гр = x[np.abs(x) > 0.05 * np.abs(x).max()] if len(x) else x
                ур = db(гр) if len(гр) > 200 else None
                v = [E._yin_f0(x[i:i + 720]) for i in range(0, len(x) - 720 + 1, 480)]; v = [q for q in v if q > 0]; выс = float(np.median(v)) if len(v) > 3 else None
                if пред and ур is not None and пред[0] is not None: меж.append((abs(ур - пред[0]), abs(12 * math.log2(выс / пред[1])) if выс and пред[1] else None))
                пред = (ур, выс)
                if об is None: continue
                for k, p in enumerate(S.стыки_отрезка):
                    m = мерки(x, p, об)
                    if m is None: continue
                    л, п = кс[k], кс[k + 1]
                    if л[4] == "o" and п[4] == "o":
                        пары[(S._край_вид(л, -1), S._край_вид(п, 0))].append(m)
                    виды[S.виды_отрезка[k]].append(m)
        print(f"== синтез {арг}")
        сводка(" по виду шва:", виды); сводка(" слово|слово по звукам на краях (слева, справа):", пары)
        а = np.array([m[0] for m in меж]); б = np.array([m[1] for m in меж if m[1] is not None])
        print(f" между отрезками: {len(а)}; разница громкости медиана {np.median(а):.1f} дБ, > 3 дБ {np.mean(а > 3):.0%}; высота медиана {np.median(б):.1f} пт, > 3 пт {np.mean(б > 3):.0%}")
    # живые границы слов
    random.seed(3); ж = collections.defaultdict(list); n = 0; кл = E.Синтезатор._класс_звука
    while n < 2500:
        ri = random.randrange(len(V.recs)); r = V.recs[ri]
        if "ph" not in r or len(r["w"]) < 2 or ri in V.искл_ri: continue
        j = random.randrange(len(r["w"]) - 1)
        if r["w"][j][4] > 0.005 or not r["ph"][j] or not r["ph"][j + 1]: continue
        y = np.asarray(V.звук(ri), np.float64); об = обычный(y)
        if об is None: continue
        m = мерки(y, int(r["w"][j][2] * SR), об)
        if m is None: continue
        ж[(кл(r["ph"][j][-1][0]), кл(r["ph"][j + 1][0][0]))].append(m); ж["все"].append(m); n += 1
    сводка("== живая речь: границы слов без паузы:", ж)
