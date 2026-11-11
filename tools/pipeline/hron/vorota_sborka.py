"""vorota_sborka.py — записи ворот (слово игрока 11.11.2026: «найди качественный звук открытия и закрытия ворот,
аутентичный: ворота в деревню, в город и так далее… проверь, чтобы они были слышны»).

Игрок прослушал пробы и одобрил: ворота деревни, решётку, ворота города и замка (по два варианта каждого).
Отчего прежние ворота не были слышны: запись «ворота» при входе почти вся ниже 300 Гц (динамик телефона этого не
отдаёт), а связка шла на половинной громкости. Поэтому каждая запись здесь: гул ниже 60 Гц срезан, верх поднят полкой,
громкость выставлена по замеру (BS.1770, наибольшая мгновенная) и проверена ещё раз в полосе динамика телефона
(выше 300 Гц); пики удержаны ограничителем не выше −1 дБ. Итог — sounds/vorota/*.flac (48 кГц, 24 бит, моно).

Из чего собрано:
  деревня  — тяжёлая деревянная дверь амбара (№0538), засов амбара (№1539, №1540) — BigSoundBank, Joseph Sardin, CC0;
  город    — ворота городской стены 0 A.D. (Wildfire Games, CC BY-SA 3.0; sounds/ad, sounds/hall) и долгий скрип дерева
             под нагрузкой (Stendhal / Department64, CC0; sounds/fon);
  замок    — те же ворота 0 A.D., цепь тали и засов амбара (sounds/adv — BigSoundBank, CC0), скрип дерева;
  решётка  — цепь тали (sounds/adv) и большая железная створка (№2357, №2360 — BigSoundBank, CC0), проигранная медленнее.
Исходники BigSoundBank с номерами лежат в рабочей папке (RAW); страницы записей названы в sounds/vorota/CREDITS.md.
Запуск: python3.13 vorota_sborka.py"""
import os, subprocess, numpy as np, soundfile as sf
from fractions import Fraction
from scipy.signal import lfilter, butter, resample_poly
SND = "/home/user/https-ivan-petrov.github.io-grani-mirov-/sounds/"; RAW = "/root/S/dver/raw/"; OUT = SND + "vorota/"
SR = 48000
B1 = [1.53512485958697, -2.69169618940638, 1.19839281085285]; A1 = [1.0, -1.69065929318241, 0.73248077421585]
B2 = [1.0, -2.0, 1.0]; A2 = [1.0, -1.99004745483398, 0.99007225036621]
ЦЕЛЬ, ТЕЛЕФОН = -13.0, -19.0     # громкость записи; не тише этого — в полосе динамика телефона

def громкость(x):
    x = np.stack([x, x], axis=1); W, S = int(0.4 * SR), int(0.1 * SR)
    if len(x) < W: x = np.vstack([x, np.zeros((W - len(x), 2))])
    y = lfilter(B2, A2, lfilter(B1, A1, x, axis=0), axis=0); e = (y ** 2).sum(axis=1)
    c = np.concatenate([[0.0], np.cumsum(e)]); st = np.arange(0, len(e) - W + 1, S)
    return float(-0.691 + 10 * np.log10(max(1e-12, ((c[st + W] - c[st]) / W).max())))

def телефон(x):
    b, a = butter(4, 300 / (SR / 2), "high"); return громкость(lfilter(b, a, x))

def края(x, вход, спад):
    x = x.copy(); n1, n2 = max(1, int(вход * SR)), max(1, int(спад * SR))
    x[:n1] *= np.linspace(0, 1, n1); x[-n2:] *= np.cos(np.linspace(0, np.pi / 2, n2)) ** 2; return x

def сырой(номер, a, b, вход=0.004, спад=0.06):
    """отрезок записи BigSoundBank из рабочей папки"""
    x, sr = sf.read(RAW + номер + ".wav", always_2d=True); x = x.mean(axis=1)[int(a * sr):int(b * sr)]
    if sr != SR:
        f = Fraction(SR, sr); x = resample_poly(x, f.numerator, f.denominator)
    return края(x, вход, спад)

def игра(путь, a=0.0, b=None, вход=0.01, спад=0.12):
    """отрезок записи, уже лежащей в игре"""
    p = subprocess.run(["ffmpeg", "-v", "error", "-i", SND + путь, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True)
    x = np.frombuffer(p.stdout, dtype=np.float32).astype(np.float64)
    return края(x[int(a * SR):int(b * SR) if b else len(x)], вход, спад)

def пик(x, дб): return x * (10 ** (дб / 20) / max(1e-9, np.abs(x).max()))

def медл(x, k):
    """проиграть медленнее (k<1): звук ниже и длиннее — створка больше и тяжелее"""
    f = Fraction(1 / k).limit_denominator(40); return resample_poly(x, f.numerator, f.denominator)

def сложить(части):
    n = max(int(t * SR) + len(x) for x, t in части); y = np.zeros(n)
    for x, t in части: y[int(t * SR):int(t * SR) + len(x)] += x
    return y

def полка(x, f0, дб, крутизна=0.8):
    A = 10 ** (дб / 40); w = 2 * np.pi * f0 / SR; cs, sn = np.cos(w), np.sin(w)
    q = 2 * np.sqrt(A) * (sn / 2 * np.sqrt((A + 1 / A) * (1 / крутизна - 1) + 2))
    b = np.array([A * ((A + 1) + (A - 1) * cs + q), -2 * A * ((A - 1) + (A + 1) * cs), A * ((A + 1) + (A - 1) * cs - q)])
    a = np.array([(A + 1) - (A - 1) * cs + q, 2 * ((A - 1) - (A + 1) * cs), (A + 1) - (A - 1) * cs - q])
    return lfilter(b / a[0], a / a[0], x)

def ограничить(x, потолок=10 ** (-1 / 20), окно=0.004, спад=0.06):
    n = int(окно * SR); pad = np.pad(np.abs(x), (n, n), mode="edge")
    m = np.max(np.lib.stride_tricks.sliding_window_view(pad, 2 * n + 1), axis=1)
    g = np.minimum(1.0, потолок / np.maximum(m, 1e-9)); k = np.exp(-1 / (спад * SR)); out = np.empty_like(g); cur = 1.0
    for i in range(len(g)):
        cur = min(g[i], 1 - (1 - cur) * k); out[i] = cur
    return x * out

def слышно(x):
    """срез гула, полка верха, громкость по замеру; если в полосе телефона тихо — верх поднимается ещё"""
    b, a = butter(2, 60 / (SR / 2), "high"); x = lfilter(b, a, x); верх = 4.0
    while True:
        y = полка(x, 2200.0, верх)
        for _ in range(3): y = ограничить(y * 10 ** ((ЦЕЛЬ - громкость(y)) / 20))
        if телефон(y) >= ТЕЛЕФОН or верх >= 13: return y, верх
        верх += 3.0

ЗАПИСИ = {
 # ── деревня: деревянные ворота на петлях, засов ──
 "vr_village_open_01":  lambda: сложить([(пик(сырой("1539", 0.10, 1.25, спад=0.12), -7), 0), (пик(сырой("0538", 13.64, 16.06), -1), 0.95)]),
 "vr_village_open_02":  lambda: сложить([(пик(сырой("0538", 9.73, 10.98), -5), 0), (пик(сырой("0538", 1.98, 4.80, спад=0.35), -1), 1.05)]),
 "vr_village_close_01": lambda: сложить([(пик(сырой("0538", 26.42, 28.58), -1), 0), (пик(сырой("1540", 0.56, 1.95), -6), 1.75)]),
 "vr_village_close_02": lambda: сложить([(пик(сырой("0538", 34.29, 35.95), -1), 0), (пик(сырой("0538", 30.55, 31.94), -5), 1.35)]),
 # ── город: ворота городской стены; второй вариант — со скрипом больших петель ──
 "vr_city_open_01":  lambda: игра("ad/ad_gate_open_01.ogg", 0.2, 4.5, спад=0.3),
 "vr_city_open_02":  lambda: сложить([(пик(игра("fon/fon_ship_creak_01.flac", 0.1, 2.6, спад=0.4), -7), 0), (пик(игра("ad/ad_gate_open_02.ogg", 0.5, 5.3, спад=0.4), -1), 0.35)]),
 "vr_city_close_01": lambda: игра("ad/ad_gate_close_01.ogg", 0.7, 5.2, спад=0.3),
 "vr_city_close_02": lambda: сложить([(пик(игра("fon/fon_ship_creak_01.flac", 2.2, 3.9, спад=0.3), -9), 0), (пик(игра("ad/ad_gate_close_02.ogg", 0.0, 3.6, спад=0.3), -2), 0.3), (пик(игра("hall/hall_gate_01.ogg", 0.0, 2.4, спад=0.5), -2), 2.5)]),
 # ── замок: цепь ворота и тяжёлые створки; второй вариант — засов, скрип петель, створки ──
 "vr_castle_open_01":  lambda: сложить([(пик(игра("adv/adv_chain_01.flac", 0.0, 1.7, спад=0.2), -9), 0), (пик(игра("ad/ad_gate_open_02.ogg", 0.5, 5.3, спад=0.4), -1), 1.1)]),
 "vr_castle_open_02":  lambda: сложить([(пик(игра("adv/adv_unlock_02.flac", 0.0, 1.4, спад=0.15), -7), 0), (пик(игра("fon/fon_ship_creak_01.flac", 0.1, 2.6, спад=0.4), -8), 1.0), (пик(игра("ad/ad_gate_open_01.ogg", 0.9, 4.5, спад=0.3), -1), 1.3)]),
 "vr_castle_close_01": lambda: сложить([(пик(игра("ad/ad_gate_close_01.ogg", 0.7, 5.2, спад=0.3), -1), 0), (пик(игра("adv/adv_chain_03.flac", 0.3, 1.6, спад=0.2), -11), 3.6)]),
 "vr_castle_close_02": lambda: сложить([(пик(игра("ad/ad_gate_close_02.ogg", 0.0, 3.6, спад=0.3), -2), 0), (пик(игра("hall/hall_gate_01.ogg", 0.0, 2.4, спад=0.5), -1), 2.2), (пик(игра("adv/adv_unlock_02.flac", 0.0, 1.4, спад=0.15), -8), 3.7)]),
 # ── решётка: цепь и скрип железа вверх; цепь и удар вниз ──
 "vr_grate_up_01":   lambda: сложить([(пик(игра("adv/adv_chain_02.flac", 0.0, 2.2, спад=0.15), -6), 0), (пик(медл(сырой("2357", 0.16, 1.62), 0.6), -9), 0.9)]),
 "vr_grate_down_01": lambda: сложить([(пик(игра("adv/adv_chain_03.flac", 0.0, 1.2, спад=0.15), -8), 0), (пик(медл(сырой("2360", 0.14, 1.75, спад=0.25), 0.7), -3), 0.9)]),
}

if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for k, f in ЗАПИСИ.items():
        x, верх = слышно(f()); sf.write(OUT + k + ".flac", x.astype(np.float32), SR, subtype="PCM_24")
        print(f"{k:20s} {len(x) / SR:4.2f} с  {громкость(x):6.1f} LUFS, в полосе телефона {телефон(x):6.1f}, пик {20 * np.log10(np.abs(x).max()):5.1f} дБ, верх +{верх:.0f} дБ")
