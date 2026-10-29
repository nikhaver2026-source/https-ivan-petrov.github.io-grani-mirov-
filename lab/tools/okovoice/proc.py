#!/usr/bin/env python3
"""Голос ОКО: обработка одной записанной реплики для игры.

    python3 proc.py ВХОД.wav ВЫХОД.mp3            — реплика
    python3 proc.py ВХОД.wav ВЫХОД.mp3 --whisper  — шёпот для эха

Реплика (одобрено 29.10, голоса Alnilam и Achernar):
  • механика — кольцевая модуляция 40 Гц (12 %) и короткий металлический
    гребень 5,5 мм;
  • второй голос в глубине — та же реплика на семь полутонов ниже
    (rubberband), глуше (ФНЧ 2,2 кГц), на 25 мс позже, громкость 0,22;
  • эхо — три затухающих повтора 130/270/420 мс, громкость 0,18/0,09/0,035,
    каждый темнее (ФНЧ 4200/3000/2000 Гц);
  • громкость −18 LUFS (замер EBU R128, линейное усиление, пики —
    ограничителем на −3 дБ, до трёх проходов), MP3 моно 24 кГц 64 кбит/с.
Шёпот: только ФНЧ 3,6 кГц и та же громкость (в игре он звучит в 0,22 от
реплики, слева или справа, и ему отвечает второй шёпот — okovoice.js).
Нужны ffmpeg с rubberband, numpy и scipy.
"""
import json, os, subprocess, sys, tempfile, wave
import numpy as np
from scipy.signal import lfilter


def read(path):
    with wave.open(path, "rb") as w:
        sr, n, ch = w.getframerate(), w.getnframes(), w.getnchannels()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32768.0
    if ch > 1:
        x = x.reshape(-1, ch).mean(axis=1)
    return sr, x


def write(path, sr, x):
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


def onepole_lp(x, sr, f):
    a = 1 - np.exp(-2 * np.pi * f / sr)
    return lfilter([a], [1, a - 1], x).astype(np.float32)


def lp2(x, sr, f):
    """ФНЧ второго порядка (два однополюсных подряд) — для эха и второго голоса."""
    return onepole_lp(onepole_lp(x, sr, f), sr, f)


def mech(x, sr, ring=0.12, comb=0.35):
    t = np.arange(len(x)) / sr
    rm = x * np.sin(2 * np.pi * 40 * t)
    d = int(sr * 0.0055)
    y = x.copy()
    for k in range(d, len(y), d):
        e = min(len(y), k + d)
        y[k:e] += 0.22 * y[k - d:e - d]
    return x + ring * rm + comb * (y - x)


def rubber(x, sr, pitch):
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
        write(a, sr, x)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", a, "-af", f"rubberband=pitch={pitch}", b], check=True)
        _, y = read(b)
    return y[:len(x)] if len(y) >= len(x) else np.pad(y, (0, len(x) - len(y)))


def shadow(x, sr, g=0.22):
    s = lp2(rubber(x, sr, 0.667), sr, 2200)
    d = int(sr * 0.025)
    return np.concatenate([np.zeros(d, np.float32), s]) * g


def echo(x, sr):
    taps = [(0.130, 0.18, 4200), (0.270, 0.09, 3000), (0.420, 0.035, 2000)]
    out = np.zeros(len(x) + int(sr * 0.7), np.float32)
    out[:len(x)] += x
    for dl, g, f in taps:
        i = int(sr * dl)
        out[i:i + len(x)] += lp2(x, sr, f) * g
    return out


def loudness(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", path, "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True)
    I = peak = None
    for line in r.stderr.splitlines()[::-1]:
        line = line.strip()
        if I is None and line.startswith("I:"):
            I = float(line.split()[1])
        if peak is None and line.startswith("Peak:"):
            peak = float(line.split()[1])
    return I, peak


def finish(y, sr, out, target=-18.0):
    """Громкость −18 LUFS: замер EBU R128, линейное усиление, пики — ограничителем
    с упреждением на −3 дБ (запас на выброс кодера MP3), до трёх проходов замера.
    Затем MP3 моно 24 кГц 64 кбит/с."""
    with tempfile.TemporaryDirectory() as d:
        a, b = os.path.join(d, "a.wav"), os.path.join(d, "b.wav")
        y = y / max(1e-6, np.abs(y).max()) * 0.5
        gain = 1.0
        for _ in range(3):
            write(a, sr, y * gain)
            subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", a, "-af",
                            "alimiter=limit=0.708:attack=5:release=50:level=disabled", b], check=True)
            I, _ = loudness(b)
            if I is None or I < -70 or abs(I - target) < 0.3:
                break
            gain *= 10 ** ((target - I) / 20)
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", b, "-ar", "24000", "-ac", "1",
                        "-c:a", "libmp3lame", "-b:a", "64k", out], check=True)


def trim(x, sr):
    """Тишину по краям — прочь (оставить 30 мс спереди и 60 мс сзади)."""
    fr = int(sr * 0.01); m = len(x) // fr
    if m < 3:
        return x
    db = 20 * np.log10(np.sqrt(np.mean(x[:m * fr].reshape(m, fr) ** 2, axis=1)) + 1e-12)
    on = np.where(db > max(db.max() - 42, -60))[0]
    if not len(on):
        return x
    return x[max(0, on[0] * fr - int(sr * 0.03)):min(len(x), (on[-1] + 1) * fr + int(sr * 0.06))]


def process(src, out, whisper=False):
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    sr, x = read(src)
    x = trim(x, sr)
    if whisper:
        y = lp2(x, sr, 3600)
    else:
        y = mech(x, sr)
        sh = shadow(x, sr)
        z = np.zeros(max(len(y), len(sh)), np.float32)
        z[:len(y)] += y; z[:len(sh)] += sh
        y = echo(z, sr)
    finish(y, sr, out)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    process(sys.argv[1], sys.argv[2], "--whisper" in sys.argv[3:])
