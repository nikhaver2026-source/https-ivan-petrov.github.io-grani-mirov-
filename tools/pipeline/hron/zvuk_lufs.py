"""zvuk_lufs.py — З5 (17.5): громкость записей звуков по замеру, один раз.

1. Замер: для каждой роли SOUND_BANK, у которой больше одного варианта записи, каждый файл меряется по стандарту
   громкости BS.1770 (взвешивание K): наибольшая мгновенная громкость (окно 400 мс, шаг 100 мс; запись короче
   окна дополняется тишиной). Итог — /root/S/lufs/lufs.json {путь: LUFS}; уже измеренное не перемеряется.
2. Поправки: варианты одной роли выравниваются к средней громкости роли (среднее в децибелах), не больше чем на
   ±6 дБ; файл в нескольких ролях — по среднему из их поправок. Поправки меньше 0,5 дБ не пишутся.
   Итог — lufs175.json {путь: множитель}; rebuild.py вставляет его в edin175_late.js (ПОПРАВКА_ГРОМКОСТИ).
Запуск: python3 zvuk_lufs.py [замер|поправки] (без слова — оба шага)."""
import json, os, re, subprocess, sys
import numpy as np
from scipy.signal import lfilter
H = os.path.dirname(os.path.abspath(__file__)) + "/"
SND = "/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds/"
MEAS = "/root/S/lufs/lufs.json"
SR = 48000
B1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]; A1 = [1.0, -1.69065929318241, 0.73248077421585]
B2 = [1.0, -2.0, 1.0]; A2 = [1.0, -1.99004745483398, 0.99007225036621]
МАКС_ДБ, МИН_ДБ = 6.0, 0.5

def bank():
    s = open(H + "index_before_mater.html", encoding="utf-8").read(); b = {}
    for k, body in re.findall(r"\b([a-z][a-z0-9_]*):\{f:\[([^\]]*)\]", s):
        files = re.findall(r'"([^"]+)"', body)
        if files and k not in b: b[k] = files
    return b

def mmax(path):
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", SND + path, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True)
    if p.returncode != 0 or not p.stdout: return None
    x = np.frombuffer(p.stdout, dtype=np.float32).reshape(-1, 2).astype(np.float64)
    W, S = int(0.4 * SR), int(0.1 * SR)
    if len(x) < W: x = np.vstack([x, np.zeros((W - len(x), 2))])
    y = lfilter(B2, A2, lfilter(B1, A1, x, axis=0), axis=0)
    e = (y ** 2).sum(axis=1)
    c = np.concatenate([[0.0], np.cumsum(e)])
    st = np.arange(0, len(e) - W + 1, S)
    m = ((c[st + W] - c[st]) / W).max()
    return None if m <= 0 else round(float(-0.691 + 10 * np.log10(m)), 2)

def замер():
    b = bank(); files = sorted({f for v in b.values() if len(v) >= 2 for f in v})
    os.makedirs(os.path.dirname(MEAS), exist_ok=True)
    res = json.load(open(MEAS)) if os.path.exists(MEAS) else {}
    for i, f in enumerate(files):
        if f in res: continue
        try: res[f] = mmax(f)
        except Exception: res[f] = None
        if i % 100 == 0: json.dump(res, open(MEAS, "w"), ensure_ascii=False); print(i, len(files), flush=True)
    json.dump(res, open(MEAS, "w"), ensure_ascii=False, indent=0); print("замер готов:", len(res))

def поправки():
    b = bank(); L = json.load(open(MEAS)); сдвиги = {}
    for role, files in b.items():
        v = [(f, L.get(f)) for f in files if L.get(f) is not None]
        if len(v) < 2: continue
        среднее = sum(x for _, x in v) / len(v)
        for f, x in v: сдвиги.setdefault(f, []).append(max(-МАКС_ДБ, min(МАКС_ДБ, среднее - x)))
    out = {}
    for f, d in сдвиги.items():
        дб = sum(d) / len(d)
        if abs(дб) >= МИН_ДБ: out[f] = round(10 ** (дб / 20), 3)
    json.dump(out, open(H + "lufs175.json", "w"), ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    дбы = [20 * np.log10(k) for k in out.values()]
    print(f"поправок: {len(out)} из {len(сдвиги)}; подняты {sum(1 for x in дбы if x>0)}, опущены {sum(1 for x in дбы if x<0)};",
          f"медиана |сдвига| {np.median(np.abs(дбы)):.1f} дБ; упёрлись в ±{МАКС_ДБ:.0f} дБ: {sum(1 for x in дбы if abs(x)>=МАКС_ДБ-0.01)}")

if __name__ == "__main__":
    шаг = sys.argv[1] if len(sys.argv) > 1 else ""
    if шаг in ("", "замер"): замер()
    if шаг in ("", "поправки"): поправки()
