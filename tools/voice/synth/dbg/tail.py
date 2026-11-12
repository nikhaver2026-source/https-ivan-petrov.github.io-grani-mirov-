#!/usr/bin/env python3.13
"""tail.py "фраза" [мс] [веса-json] [метка] — конец фразы по кадрам 5 мс: уровень, высота, доля голоса (периодичность),
наклон спектра (верх к низу). Видно, где кончается гласный, как он гаснет, есть ли хрип (высота прыгает или падает
вдвое, периодичность низкая) и ступень на шве."""
import sys, os, json, math, numpy as np, soundfile as sf
sys.path.insert(0, "/root/S/us2")
os.environ.setdefault("SYNTH_EXCLUDE", "/root/S/us2/test_set.json:/root/S/us2/test_set400.json")
import engine as E
SR = 24000
def период(s, lo=70, hi=400):
    """высота и периодичность окна по нормированной автокорреляции"""
    s = s - s.mean(); e = float(np.dot(s, s))
    if e < 1e-9: return 0.0, 0.0
    a, b = int(SR / hi), int(SR / lo); best, bl = 0.0, 0
    for l in range(a, min(b, len(s) - 1)):
        x, y = s[:-l], s[l:]; d = math.sqrt(float(np.dot(x, x)) * float(np.dot(y, y))) + 1e-12
        r = float(np.dot(x, y)) / d
        if r > best: best, bl = r, l
    return (SR / bl if bl else 0.0), best
def наклон(s):
    w = np.abs(np.fft.rfft(s * np.hanning(len(s)))) ** 2; f = np.fft.rfftfreq(len(s), 1 / SR)
    н = w[(f > 100) & (f < 1500)].sum() + 1e-12; в = w[(f > 3000) & (f < 9000)].sum() + 1e-12
    return 10 * math.log10(в / н)
def разбор(x, мс=260, швы=()):
    N = int(SR * 0.03); h = int(SR * 0.005); a = max(0, len(x) - int(SR * мс / 1000))
    for k in range(a, len(x) - N // 3, h):
        s = x[k:k + N]; 
        if len(s) < N: s = np.r_[s, np.zeros(N - len(s))]
        f, r = период(s); t = (k + N / 2) / SR
        шов = "  ← шов" if any(abs(p / SR - t) < 0.0026 for p in швы) else ""
        print(f"   {t:6.3f} с  {E._db(x[k + N // 2 - h:k + N // 2 + h]):6.1f} дБ  {f:5.0f} Гц  голос {r:4.2f}  верх/низ {наклон(s):6.1f}{шов}")
if __name__ == "__main__":
    S = E.Синтезатор("m", json.loads(sys.argv[3]) if len(sys.argv) > 3 and sys.argv[3] not in ("", "-") else None)
    r = S.сказать(sys.argv[1]); x = np.asarray(r[0] if isinstance(r, tuple) else r, dtype=np.float64)
    print(f"«{sys.argv[1]}»: {len(x) / SR:.3f} с; швы {[round(p / SR, 3) for p in S.стыки]}")
    разбор(x, int(sys.argv[2]) if len(sys.argv) > 2 else 260, S.стыки)
    if len(sys.argv) > 4: sf.write(f"/root/S/us2/out12/{sys.argv[4]}.flac", x.astype(np.float32), SR)
