#!/usr/bin/env python3
"""Render the offline Rift sound bank. Requires NumPy, SciPy and FFmpeg."""
import hashlib
from pathlib import Path
import subprocess

import numpy as np
from scipy import signal

RATE = 44100
DEST = Path(__file__).resolve().parents[1] / "sounds" / "rift"
FIELDS = ("ion", "mist", "frost", "crush", "null")
DEVICES = {
    "probe": (560, 820, 660),
    "mix": (212, 408),
    "seal": (310, 180),
    "carry": (145, 210),
    "ok": (440, 587, 698),
    "error": (380, 265),
    "bench": (206, 424, 790),
    "tune": (620, 730),
    "frame_sealed": (174, 248, 502),
    "frame_haul": (112, 218, 343),
    "frame_walk": (293, 634),
}


def time(seconds):
    return np.arange(round(seconds * RATE)) / RATE


def band(rng, size, low, high):
    sos = signal.butter(2, (low, high), fs=RATE, btype="bandpass", output="sos")
    texture = signal.sosfilt(sos, rng.standard_normal(size))
    return texture / max(0.01, float(np.std(texture)))


def env(t, attack, decay):
    return (1 - np.exp(-t / attack)) * np.exp(-t / decay)


def osc(freq):
    return np.sin(np.cumsum(np.broadcast_to(freq, np.shape(freq))) * (2 * np.pi / RATE))


def chirp(t, start, end):
    return signal.chirp(t, start, t[-1] or 1, end, method="linear", phi=-90)


def add(dst, src, offset):
    begin = round(offset * RATE)
    count = min(len(src), len(dst) - begin)
    if count > 0:
        dst[begin:begin + count] += src[:count]


def clang(t, pitch, decay):
    return sum(level * np.sin(2 * np.pi * mult * pitch * t) * env(t, 0.0014, decay / mult**0.34)
               for mult, level in ((1, 0.86), (2.14, 0.27), (3.48, 0.14), (5.21, 0.065)))


def field(name, rng, variation):
    t = time(1.45 + variation * 0.12)
    bed = band(rng, len(t), 160, 1600)
    if name == "ion":
        out = 0.22 * bed * env(t, 0.03, 0.27) + 0.12 * chirp(t, 730, 290) * env(t, 0.014, 0.34)
        for when in (0.02, 0.08, 0.22, 0.24, 0.41, 0.66):
            tap = time(0.10)
            spark = band(rng, len(tap), 1000, 6200) + 0.42 * chirp(tap, 2550, 920)
            add(out, spark * 0.28 * env(tap, 0.001, 0.013), when + rng.uniform(0, 0.04))
        return out
    if name == "mist":
        inhale = (0.42 + 0.58 * np.sin(2 * np.pi * (0.58 + variation * 0.12) * t)**2)
        out = (0.28 * band(rng, len(t), 460, 3300) + 0.19 * bed) * inhale * env(t, 0.16, 0.64)
        for when in (0.19, 0.51, 0.85):
            drop = time(0.23)
            add(out, 0.12 * chirp(drop, 370, 760) * env(drop, 0.002, 0.052), when)
        return out
    if name == "frost":
        out = 0.12 * bed * env(t, 0.15, 0.43)
        for when in (0.03, 0.18, 0.38, 0.40, 0.73):
            shards = time(0.42)
            snap = clang(shards, rng.uniform(480, 890), 0.095)
            add(out, (0.28 * snap + 0.16 * band(rng, len(shards), 1300, 5900)) *
                env(shards, 0.0008, 0.065), when)
        return out
    if name == "crush":
        out = np.zeros_like(t)
        for when, strength in ((0.03, 1), (0.23, 0.64), (0.61, 0.42)):
            hit = time(0.65)
            impact = (0.52 * chirp(hit, 170, 54) + 0.29 * band(rng, len(hit), 75, 520) +
                      0.23 * clang(hit, 270 + 28 * variation, 0.19))
            add(out, strength * impact * env(hit, 0.011, 0.16), when)
        return out
    low = 243 + 23 * variation
    return (0.39 * chirp(t, low, 71) + 0.2 * chirp(t, low * 1.035, 86) +
            0.14 * bed * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * t))) * env(t, 0.15, 0.48)


def creature(index, rng, variation):
    # Different articulations share the game's spatial filter and reverb.
    profiles = [
        (83, 110, 0.91, 290, 920, 12),   # scraping, low breath
        (260, 620, 1.39, 650, 2800, 18),  # torn rising screech
        (105, 49, 1.06, 140, 850, 7),    # two hard charges
        (195, 103, 1.50, 310, 1770, 23),  # oscillating false double
        (150, 58, 1.17, 370, 1160, 14),   # coughing intake
    ]
    start, end, length, low, high, grit = profiles[index]
    t = time(length + variation * 0.13)
    vowel = np.linspace(start + 9 * variation, end, len(t)) * (1 + 0.045 * np.sin(2 * np.pi * (5 + index) * t))
    throat = (0.42 * osc(vowel) + 0.18 * osc(vowel * 2.02) +
              0.09 * osc(vowel * 3.07) + 0.24 * band(rng, len(t), low, high))
    pulses = (0.62 + 0.38 * np.sin(2 * np.pi * grit * t)**2)
    if index == 3:
        pulses *= 0.30 + 0.70 * (np.sin(2 * np.pi * 4.2 * t)**2)
    if index == 2:
        pulses *= 0.37 + 0.63 * np.sin(2 * np.pi * 2.8 * t)**4
    out = throat * pulses * env(t, [0.06, 0.09, 0.016, 0.14, 0.038][index], 0.36 + 0.08 * index)
    tail = time(0.31)
    add(out, 0.13 * band(rng, len(tail), 450, 3100) * env(tail, 0.014, 0.08), length * 0.52)
    return out


def device(name, rng, variation):
    t = time(0.71 if name in ("mix", "seal", "bench") else 0.49)
    out = np.zeros_like(t)
    decay = 0.07 if name in ("tune", "probe", "ok", "error") else 0.13
    for j, pitch in enumerate(DEVICES[name]):
        tap = time(0.34)
        transient = clang(tap, pitch * (1 + 0.015 * variation), decay)
        texture = band(rng, len(tap), 600, 4500) * env(tap, 0.0012, 0.029)
        add(out, 0.39 * transient + (0.07 if name == "ok" else 0.16) * texture, 0.012 + j * 0.103)
    if name in ("mix", "bench", "carry") or name.startswith("frame_"):
        out += 0.19 * band(rng, len(t), 320, 2100) * env(t, 0.035, 0.16)
    if name == "seal":
        out += 0.24 * chirp(t, 124, 61) * env(t, 0.003, 0.16)
    return out


def write(name, take, wave):
    # Short room reflections, centered mono input for the game's real-time panner.
    wave = np.pad(wave, (0, round(RATE * 0.19)))
    room = wave.copy()
    for delay, gain in ((0.034, 0.12), (0.083, 0.07), (0.137, 0.04)):
        add(room, wave * gain, delay)
    room = signal.sosfilt(signal.butter(2, 42, fs=RATE, btype="highpass", output="sos"), room)
    edge = round(RATE * 0.008)
    room[:edge] *= np.linspace(0, 1, edge)
    room[-edge:] *= np.linspace(1, 0, edge)
    room *= 0.70 / np.max(np.abs(room))
    target = DEST / f"{name}_{take}.ogg"
    subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-f", "f32le",
                    "-ar", str(RATE), "-ac", "1", "-i", "pipe:0", "-map_metadata", "-1",
                    "-c:a", "libvorbis", "-q:a", "5", str(target)],
                   input=room.astype("<f4").tobytes(), check=True)


def main():
    DEST.mkdir(parents=True, exist_ok=True)
    names = (*FIELDS, *(f"beast{i}" for i in range(5)), *DEVICES)
    for name in names:
        for take in (1, 2):
            seed = int.from_bytes(hashlib.sha256(f"{name}:{take}".encode()).digest()[:8], "little")
            rng = np.random.default_rng(seed)
            if name in FIELDS:
                wave = field(name, rng, take - 1)
            elif name.startswith("beast"):
                wave = creature(int(name[-1]), rng, take - 1)
            else:
                wave = device(name, rng, take - 1)
            write(name, take, wave)


if __name__ == "__main__":
    main()
