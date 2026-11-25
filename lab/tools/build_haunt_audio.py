#!/usr/bin/env python3
"""Render the haunt bank offline. Requires NumPy, SciPy and FFmpeg."""

from hashlib import sha256
from pathlib import Path
import subprocess

import numpy as np
from scipy import signal

from build_rift_audio import RATE, add, band, chirp, clang, env, osc, time

DEST = Path(__file__).resolve().parents[1] / "sounds" / "haunt"

# Event onset, material, pitch and length. The order matches the source descriptions in deep_sys.js.
ORIGINS = (
    ((0, "boot", 83, .18), (.39, "boot", 68, .28), (.56, "metal", 254, .14)),
    ((0, "breath", 210, .54), (.65, "breath", 151, .71), (.90, "metal", 326, .32)),
    ((0, "scrape", 430, .65), (.51, "scrape", 560, .43), (1.02, "metal", 713, .21)),
    ((0, "wire", 482, .21), (.26, "wire", 370, .64), (.95, "wire", 423, .30)),
    ((0, "grit", 740, .31), (.30, "grit", 930, .49), (.81, "grit", 1110, .26)),
    ((0, "metal", 570, .14), (.19, "breath", 360, .45), (.78, "breath", 227, .86)),
    ((0, "glass", 598, .21), (.27, "scrape", 690, .32), (.68, "scrape", 629, .28), (1.16, "scrape", 528, .49)),
    ((0, "wire", 137, .40), (.44, "wire", 174, .35), (.87, "wire", 212, .38), (1.31, "boot", 128, .27)),
    ((0, "metal", 945, .27), (.31, "grit", 600, .17), (.62, "metal", 737, .46)),
    ((0, "scrape", 746, .5), (.56, "scrape", 785, .35), (1.05, "scrape", 688, .65)),
    ((0, "stretch", 171, .60), (.62, "breath", 596, .37), (1.04, "breath", 461, .34)),
    ((0, "boot", 147, .15), (.22, "boot", 169, .15), (.79, "boot", 141, .19), (.99, "stretch", 105, .28)),
    ((0, "scrape", 188, 1.42), (.35, "metal", 415, .22), (.91, "metal", 343, .35)),
    ((0, "glass", 888, .39), (.30, "glass", 623, .44), (.67, "glass", 504, .61)),
    ((0, "breath", 197, .4), (.45, "breath", 174, .49), (1.0, "breath", 145, .57)),
    ((0, "drop", 291, .20), (.19, "drop", 371, .18), (.32, "drop", 490, .25), (.62, "breath", 189, .75)),
    ((0, "grit", 536, .68), (.44, "metal", 516, .30), (.87, "metal", 385, .58)),
    ((0, "signal", 694, .22), (.29, "wire", 133, .89), (.85, "grit", 610, .51)),
    ((0, "metal", 368, .32), (.35, "metal", 584, .20), (.53, "metal", 469, .14), (.77, "stretch", 92, .64)),
    ((0, "boot", 91, .45), (.41, "boot", 76, .55), (.93, "boot", 63, .74)),
    ((0, "breath", 456, .71), (.33, "grit", 372, .27), (.79, "drop", 477, .22), (1.01, "breath", 309, .38)),
    ((0, "scrape", 205, .28), (.30, "scrape", 227, .33), (.67, "scrape", 259, .48), (1.16, "boot", 98, .16)),
    ((0, "signal", 527, .44), (.5, "throat", 124, .37), (1.03, "throat", 108, .45)),
    ((0, "grit", 672, .58), (.53, "metal", 288, .34), (.85, "grit", 718, .61)),
    ((0, "metal", 299, .46), (.32, "metal", 207, .78), (.60, "stretch", 99, .82)),
)

EVENTS = {
    "foot": ((0, "boot", 77, .36), (.19, "boot", 113, .38), (.45, "boot", 68, .42)),
    "air": ((0, "breath", 183, .91), (.22, "grit", 720, .48), (.67, "breath", 615, .36)),
    "arc": ((0, "wire", 620, .47), (.19, "wire", 880, .18), (.40, "wire", 1020, .24)),
    "sight": ((0, "stretch", 185, .81), (.18, "signal", 384, .53), (.69, "throat", 92, .27)),
    "return": ((0, "stretch", 155, .73), (.51, "boot", 63, .35)),
    "sample": ((0, "metal", 492, .14), (.18, "signal", 510, .16)),
    "catch": ((0, "metal", 222, .22), (.17, "metal", 425, .16)),
    "answer": ((0, "throat", 95, .60), (.49, "scrape", 162, .45)),
    "latch": ((0, "metal", 312, .18), (.14, "boot", 117, .28)),
    "verify": ((0, "signal", 391, .17), (.26, "signal", 521, .15)),
    "closed": ((0, "metal", 174, .25), (.15, "breath", 196, .31), (.44, "signal", 310, .33)),
    "reset": ((0, "metal", 472, .14), (.12, "wire", 303, .26)),
    "relay": ((0, "signal", 420, .16), (.22, "signal", 500, .21), (.58, "metal", 615, .14)),
    "listening": ((0, "throat", 115, .53), (.41, "stretch", 228, .31), (.70, "throat", 86, .55)),
    "treader": ((0, "boot", 69, .24), (.14, "throat", 62, .63), (.71, "boot", 64, .46)),
}


def material(name, pitch, duration, rng):
    t = time(duration)
    def noise(low, high):
        return band(rng, len(t), low, high)

    shape = env(t, .012, duration / 3)
    if name == "boot":
        return (chirp(t, pitch * 1.5, pitch * .7) * .8 + noise(180, 1350) * .28) * shape
    if name == "metal":
        return clang(t, pitch, duration / 3) + noise(850, 6000) * env(t, .001, .012) * .24
    if name == "breath":
        swell = np.sin(np.pi * t / duration)**1.35
        return (noise(160, pitch + 640) * .64 + noise(pitch * 2, pitch * 2 + 460) * .23) * swell
    if name == "wire":
        flicker = .2 + .8 * np.square(osc(np.full(len(t), 29 + pitch % 27)))
        return (chirp(t, pitch * 1.18, pitch * .73) * .52 + noise(800, 5900) * .42) * flicker * shape
    if name == "grit":
        return noise(240, 5300) * np.square(noise(22, 98)) * env(t, .028, duration / 2)
    if name == "scrape":
        slide = pitch * (1 + .08 * np.sin(2 * np.pi * 7 * t))
        return (osc(slide) * .52 + noise(470, 3350) * .48) * (noise(19, 100) * .25 + .65) * shape
    if name == "glass":
        return (clang(t, pitch, duration / 2.3) + np.roll(clang(t, pitch * 1.28, duration / 4), 93)) * .52
    if name == "drop":
        return chirp(t, pitch * .58, pitch * 2.8) * env(t, .003, .040) + noise(360, 2300) * shape * .22
    if name == "stretch":
        swell = (1 - np.exp(-t / (duration * .45))) * (1 - (t / duration)**6)
        return (chirp(t, pitch * 1.58, pitch * .57) * .7 + noise(120, 1500) * .3) * swell
    if name == "throat":
        # Formants over an irregular low reed. No intelligible voice or command.
        glottal = osc(pitch * (1 - .22 * t / duration + .043 * noise(20, 52)))
        formant = np.tanh(2.7 * glottal + .48 * noise(240, 1180))
        return (formant * .46 + noise(510, 730) * .25 + noise(1020, 1820) * .16) * env(t, .11, duration / 2)
    if name == "signal":
        return (osc(np.full(len(t), pitch)) + .19 * osc(np.full(len(t), pitch * 1.99))) * env(t, .014, duration / 2)
    raise ValueError(name)


def make_events():
    events = {f"origin{i}": e for i, e in enumerate(ORIGINS)}
    events.update(EVENTS)
    for i, holds in enumerate(((.12, .12, .29), (.12, .29, .12), (.29, .12, .12))):
        start = 0
        rhythm = []
        for length in holds:
            rhythm.append((start, "signal", 594, length))
            start += length + .12
        events[f"rhythm{i}"] = rhythm
    contacts = (("metal", 159), ("metal", 446), ("breath", 526))
    for i in range(3):
        sequence = [contacts[(i + j) % len(contacts)] for j in range(3)]
        events[f"contact{i}"] = [(j * .32, name, pitch, .26) for j, (name, pitch) in enumerate(sequence)]
    return events


def render(path, events):
    rng = np.random.default_rng(int.from_bytes(sha256(path.stem.encode()).digest()[:8], "little"))
    wave = np.zeros_like(time(max(start + length for start, _, _, length in events) + .19))
    for start, name, pitch, length in events:
        add(wave, material(name, pitch, length, rng), start)
    direct = wave.copy()
    for delay, level in ((.022, .11), (.057, .09), (.111, .045)):
        add(wave, direct * level, delay)
    wave = signal.sosfilt(signal.butter(2, [50, 7900], fs=RATE, btype="bandpass", output="sos"), wave)
    wave = np.tanh(wave * .95)
    fade = round(RATE * .014)
    wave[:fade] *= np.linspace(0, 1, fade)
    wave[-fade:] *= np.linspace(1, 0, fade)
    wave *= .68 / np.max(np.abs(wave))
    subprocess.run(["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-f", "f32le",
                    "-ar", str(RATE), "-ac", "1", "-i", "pipe:0", "-map_metadata", "-1",
                    "-c:a", "libvorbis", "-q:a", "5", str(path)],
                   input=wave.astype("<f4").tobytes(), check=True)


if __name__ == "__main__":
    DEST.mkdir(parents=True, exist_ok=True)
    for key, events in make_events().items():
        render(DEST / f"{key}.ogg", events)
