#!/usr/bin/env python3
"""Значок «Подземной лаборатории»: шахта, уходящая вглубь (вложенные рамки),
в глубине — свет «Истока», по бокам — дуги звука («Эхо»).
Запуск: python3 lab/tools/make_icon.py  → lab/icon-512.png, lab/icon-192.png"""
import os, math
from PIL import Image, ImageDraw, ImageFilter
LAB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = 2048
img = Image.new("RGB", (S, S), (5, 6, 10))
px = img.load()
cx = cy = S / 2
# мягкий радиальный фон
bg = Image.new("RGB", (S, S))
d = ImageDraw.Draw(bg)
for r in range(int(S * 0.75), 0, -8):
    t = r / (S * 0.75)
    c = (int(5 + 22 * (1 - t) ** 2), int(6 + 26 * (1 - t) ** 2), int(10 + 40 * (1 - t) ** 2))
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
img = bg
d = ImageDraw.Draw(img)
# шахта: вложенные рамки, к центру — меньше и ярче
for k in range(7):
    t = k / 6
    half = S * (0.40 - 0.335 * (t ** 0.85))
    w = int(S * (0.022 - 0.012 * t))
    a = 0.35 + 0.65 * t
    col = (int(255 * a), int(176 * a), int(40 * a))
    rad = int(half * 0.18)
    d.rounded_rectangle([cx - half, cy - half, cx + half, cy + half], radius=rad, outline=col, width=w)
# свет в глубине
glow = Image.new("RGB", (S, S), (0, 0, 0))
g = ImageDraw.Draw(glow)
for r, c in [(S * 0.16, (90, 60, 10)), (S * 0.10, (200, 140, 30)), (S * 0.06, (255, 220, 120)), (S * 0.035, (255, 250, 230))]:
    g.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)
glow = glow.filter(ImageFilter.GaussianBlur(S * 0.02))
img = Image.composite(glow, img, glow.convert("L").point(lambda v: min(255, v * 2)))
d = ImageDraw.Draw(img)
# дуги звука слева и справа
for side in (-1, 1):
    for k, rr in enumerate([0.20, 0.27, 0.34]):
        r = S * rr
        box = [cx - r, cy - r, cx + r, cy + r]
        a0, a1 = (-35, 35) if side > 0 else (145, 215)
        col = (76, 211, 255) if k < 2 else (40, 140, 190)
        d.arc(box, a0, a1, fill=col, width=int(S * 0.018))
for size, name in [(512, "icon-512.png"), (192, "icon-192.png")]:
    img.resize((size, size), Image.LANCZOS).save(os.path.join(LAB, name), optimize=True)
print("ok")
