"""dver_yarche.py — прежние записи двери ярче и громче (слово игрока 11.11.2026: «оставь прежний звук двери,
сделай его ярче — в игре его практически не слышно»).

Замер показал причину: «дверь закрывается» записана на −30 LUFS (почти тишина), «дверь отпирается» — на −26,
«дверь открывается» шла в игре на половинной громкости. Здесь из прежних записей делаются копии:
верх поднят полкой (+6,5 дБ выше 2,5 кГц), гул ниже 70 Гц срезан, громкость выставлена по замеру (BS.1770,
наибольшая мгновенная, как в zvuk_lufs.py), пики удержаны ограничителем не выше −1 дБ. Длина и сам звук — прежние.
Копии без потерь (FLAC, 48 кГц, 24 бит) ложатся рядом с исходниками с суффиксом «_y»; исходники не тронуты.
Роли банка переводит на копии модуль dver180_late.js. Запуск: python3.13 dver_yarche.py"""
import subprocess, numpy as np, soundfile as sf
from scipy.signal import lfilter, butter
SND = "/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds/"
SR = 48000
B1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]; A1 = [1.0, -1.69065929318241, 0.73248077421585]
B2 = [1.0, -2.0, 1.0]; A2 = [1.0, -1.99004745483398, 0.99007225036621]
# запись → (копия, громкость, LUFS)
СПИСОК = [("oc/oc_door_open_01.ogg", "oc/oc_door_open_01_y.flac", -11.5),
          ("oc/oc_door_open_02.ogg", "oc/oc_door_open_02_y.flac", -11.5),
          ("oc/oc_door_close_01.ogg", "oc/oc_door_close_01_y.flac", -14.0),
          ("oc/oc_door_close_02.ogg", "oc/oc_door_close_02_y.flac", -14.0),
          ("oc/oc_door_unlock_01.ogg", "oc/oc_door_unlock_01_y.flac", -16.0),
          ("deep/deep_door_01.ogg", "deep/deep_door_01_y.flac", -15.0)]

def читать(path):
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True)
    return np.frombuffer(p.stdout, dtype=np.float32).astype(np.float64)

def громкость(x):
    x = np.stack([x, x], axis=1); W, S = int(0.4 * SR), int(0.1 * SR)
    if len(x) < W: x = np.vstack([x, np.zeros((W - len(x), 2))])
    y = lfilter(B2, A2, lfilter(B1, A1, x, axis=0), axis=0); e = (y ** 2).sum(axis=1)
    c = np.concatenate([[0.0], np.cumsum(e)]); st = np.arange(0, len(e) - W + 1, S)
    return float(-0.691 + 10 * np.log10(max(1e-12, ((c[st + W] - c[st]) / W).max())))

def полка(x, f0=2500.0, дб=6.5, крутизна=0.8):
    A = 10 ** (дб / 40); w = 2 * np.pi * f0 / SR; cs, sn = np.cos(w), np.sin(w)
    q = 2 * np.sqrt(A) * (sn / 2 * np.sqrt((A + 1 / A) * (1 / крутизна - 1) + 2))
    b = np.array([A * ((A + 1) + (A - 1) * cs + q), -2 * A * ((A - 1) + (A + 1) * cs), A * ((A + 1) + (A - 1) * cs - q)])
    a = np.array([(A + 1) - (A - 1) * cs + q, 2 * ((A - 1) - (A + 1) * cs), (A + 1) - (A - 1) * cs - q])
    return lfilter(b / a[0], a / a[0], x)

def ограничить(x, потолок=10 ** (-1 / 20), окно=0.004, спад=0.06):
    """Ограничитель пиков с заглядом: усиление падает заранее и возвращается плавно."""
    n = int(окно * SR); pad = np.pad(np.abs(x), (n, n), mode="edge")
    m = np.max(np.lib.stride_tricks.sliding_window_view(pad, 2 * n + 1), axis=1)
    g = np.minimum(1.0, потолок / np.maximum(m, 1e-9)); k = np.exp(-1 / (спад * SR)); out = np.empty_like(g); cur = 1.0
    for i in range(len(g)):
        cur = min(g[i], 1 - (1 - cur) * k); out[i] = cur
    return x * out

def ярче(src, dst, цель):
    x = читать(SND + src); было = громкость(x)
    b, a = butter(2, 70 / (SR / 2), "high"); x = полка(lfilter(b, a, x))
    for _ in range(3): x = ограничить(x * 10 ** ((цель - громкость(x)) / 20))
    n = int(0.008 * SR); x[-n:] *= np.linspace(1, 0, n)
    sf.write(SND + dst, x.astype(np.float32), SR, subtype="PCM_24")
    print(f"{dst:32s} {len(x) / SR:4.2f} с  {было:6.1f} → {громкость(x):6.1f} LUFS, пик {20 * np.log10(np.abs(x).max()):5.1f} дБ")

if __name__ == "__main__":
    for src, dst, цель in СПИСОК: ярче(src, dst, цель)
