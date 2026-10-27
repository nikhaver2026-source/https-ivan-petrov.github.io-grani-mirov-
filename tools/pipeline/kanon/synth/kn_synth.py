"""kn_synth.py — новые записи канона синтезом (струны школы струн, хруст соли): щипок по Карплусу — Стронгу с резонансом корпуса,
аккорд, глиссандо, гул натянутой струны; хруст соли — зёрна шума с короткими щелчками. Громкость — к средней громкости
похожих записей банка (BS.1770, как zvuk_lufs.py). Пишет sounds/kanon/*.flac (44,1 кГц, 16 бит, моно)."""
import numpy as np, soundfile as sf, os, sys, json
sys.path.insert(0, "/root/S/hron"); import zvuk_lufs as ZL
SR = 44100; OUT = "/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds/kanon/"; os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(180)

def ks(f0, dur, bright=0.5, decay=0.996, pick=0.2):
    n = int(SR * dur); N = int(round(SR / f0)); buf = rng.uniform(-1, 1, N)
    # точка щипка: гребёнка убирает гармоники, кратные 1/pick
    p = max(1, int(N * pick)); buf = buf - np.roll(buf, p) * 0.9
    buf = np.convolve(buf, [bright, 1 - bright], mode="same")
    out = np.zeros(n); i = 0
    for t in range(n):
        out[t] = buf[i]; j = (i + 1) % N
        buf[i] = decay * (0.5 * (buf[i] + buf[j])); i = j
    return out

def body(x):  # резонанс деревянного корпуса: три полосы
    from scipy.signal import iirpeak, lfilter
    y = x * 0.6
    for f, q, g in ((110, 4, 0.5), (250, 6, 0.35), (520, 5, 0.25)):
        b, a = iirpeak(f, q, SR); y = y + g * lfilter(b, a, x)
    return y

def env(n, a=0.004, r=0.25):
    e = np.ones(n); A = int(a * SR); R = int(r * SR)
    e[:A] = np.linspace(0, 1, A); e[-R:] *= np.linspace(1, 0, R) ** 2; return e

def norm(x, target):
    x = x / (np.abs(x).max() + 1e-9) * 0.9
    tmp = OUT + "_tmp.flac"; sf.write(tmp, x.astype(np.float32), SR, subtype="PCM_16")
    l = ZL.mmax(tmp.replace(ZL.SND, "")); os.remove(tmp)
    if l is not None: x = x * 10 ** ((target - l) / 20)
    return np.clip(x, -0.99, 0.99)

def ref(roles):  # средняя громкость похожих записей банка
    b = ZL.bank(); vals = []
    for r in roles:
        for f in b.get(r, [])[:3]:
            v = ZL.mmax(f)
            if v is not None: vals.append(v)
    return float(np.mean(vals)) if vals else -18.0

def save(name, x, target):
    x = norm(x, target); sf.write(OUT + name, x.astype(np.float32), SR, subtype="PCM_16"); return "kanon/" + name

files = {}
T_str = ref(["sp_lg_string", "bell_small", "arc_chimes"]); T_salt = ref(["tread_sand", "tread_gravel", "oc_pshsh"])
print("цель струн", round(T_str, 1), "соли", round(T_salt, 1))
# щипки: три высоты (ре, ля, ми)
for i, f0 in enumerate((146.8, 220.0, 329.6), 1):
    x = body(ks(f0, 2.2, bright=0.45 + 0.1 * i, decay=0.9965)); x *= env(len(x), r=0.6)
    files.setdefault("kn_str_pluck", []).append(save(f"kn_str_pluck_0{i}.flac", x, T_str))
# аккорд: четыре струны с разбросом 25 мс (перебор)
for i, chord in enumerate(((98.0, 146.8, 196.0, 246.9), (110.0, 164.8, 220.0, 277.2)), 1):
    n = int(SR * 3.0); x = np.zeros(n)
    for k, f0 in enumerate(chord):
        s = body(ks(f0, 3.0 - 0.03 * k, bright=0.5, decay=0.9972)); off = int(0.025 * k * SR); x[off:off + len(s)] += s[:n - off] * (0.9 - 0.08 * k)
    x *= env(n, r=0.9); files.setdefault("kn_str_chord", []).append(save(f"kn_str_chord_0{i}.flac", x, T_str))
# глиссандо: щипок с плавным подъёмом высоты (переменная длина задержки)
for i, (fa, fb) in enumerate(((165.0, 330.0), (247.0, 185.0)), 1):
    n = int(SR * 1.6); x = np.zeros(n); N0 = SR / fa; buf = rng.uniform(-1, 1, int(SR / min(fa, fb)) + 2); L = len(buf); pos = 0.0
    hist = np.zeros(n + L)
    hist[:L] = buf
    for t in range(n):
        f = fa + (fb - fa) * min(1, t / (0.9 * SR)); d = SR / f
        k = t + L - d; k0 = int(k); fr = k - k0
        v = (1 - fr) * hist[k0] + fr * hist[k0 + 1]; v2 = (1 - fr) * hist[k0 - 1] + fr * hist[k0]
        hist[t + L] = 0.996 * 0.5 * (v + v2); x[t] = hist[t + L]
    x = body(x) * env(n, r=0.5); files.setdefault("kn_str_gliss", []).append(save(f"kn_str_gliss_0{i}.flac", x, T_str))
# гул натянутой струны: смычковая ровная нота с биениями
for i, f0 in enumerate((73.4, 110.0), 1):
    n = int(SR * 2.8); t = np.arange(n) / SR; x = np.zeros(n)
    for h in range(1, 9): x += (0.8 ** h) * np.sin(2 * np.pi * f0 * h * t * (1 + 0.0012 * np.sin(2 * np.pi * 0.7 * t)) + rng.uniform(0, 6.28))
    x *= (1 + 0.15 * np.sin(2 * np.pi * 3.1 * t)); x += 0.02 * rng.standard_normal(n)
    x = body(x) * env(n, a=0.35, r=0.9); files.setdefault("kn_str_hum", []).append(save(f"kn_str_hum_0{i}.flac", x, T_str - 3))
# хруст соли: зёрна шума (кристаллы ломаются под пальцами) — три варианта
from scipy.signal import butter, lfilter
for i in range(1, 4):
    n = int(SR * (0.7 + 0.15 * i)); x = np.zeros(n)
    for g in range(int(70 + 25 * i)):
        at = int(rng.uniform(0, n - 900)); L = int(rng.uniform(80, 700)); s = rng.standard_normal(L) * np.exp(-np.linspace(0, 6, L))
        x[at:at + L] += s * rng.uniform(0.2, 1.0)
    b, a = butter(2, [1800 / (SR / 2), 9000 / (SR / 2)], btype="band"); x = lfilter(b, a, x) * env(n, a=0.01, r=0.15)
    files.setdefault("kn_salt", []).append(save(f"kn_salt_0{i}.flac", x, T_salt))
json.dump(files, open("/root/S/kanon/synth/files.json", "w"), ensure_ascii=False, indent=1)
print(json.dumps(files, ensure_ascii=False))
