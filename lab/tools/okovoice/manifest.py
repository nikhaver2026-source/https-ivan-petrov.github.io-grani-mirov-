#!/usr/bin/env python3
"""Голос ОКО: список записанных реплик для игры — js/oko_voiced.js.

    python3 lab/tools/okovoice/manifest.py

Смотрит sounds/oko/m и sounds/oko/f: <отпечаток>.mp3 — реплика, w_<имя>.mp3 —
шёпот для эха. Игра (js/okovoice.js) говорит записью только то, что есть в
этом списке; остальное — синтезатором.

ready — записаны все реплики (lines.json) обоими голосами. Пока нет, игра
говорит синтезатором, настроек голоса ОКО не показывает, а сборки (Android,
Windows) не берут sounds/oko: голос ОКО входит в игру только целиком.
"""
import json, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..")
SND = os.path.join(ROOT, "sounds", "oko")
OUT = os.path.join(ROOT, "js", "oko_voiced.js")
LINES = os.path.join(os.path.dirname(os.path.abspath(__file__)), "lines.json")


def key(t):
    """Отпечаток текста — как в игре (okovoice.js, key) и в run.py."""
    h = 0x811c9dc5
    for ch in re.sub(r"\s+", " ", str(t)).strip():
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xFFFFFFFF
    return "%08x" % h


def fem_map():
    s = open(os.path.join(ROOT, "js", "oko_fem.js"), encoding="utf-8").read()
    return json.loads(s[s.index("LAB.OKO_FEM = ") + len("LAB.OKO_FEM = "):s.rindex(";")])


def missing(m, f):
    """Сколько реплик ещё без записи: (мужской, женский). Женский голос говорит о себе
    в женском роде (oko_fem.js), Зрачок — словами как есть (run.py, todo)."""
    lines, fem = json.load(open(LINES, encoding="utf-8")), fem_map()
    need_m = {key(x["text"]) for x in lines}
    need_f = {key(x["text"] if x["kind"] == "pupil" else fem.get(x["text"], x["text"])) for x in lines}
    return len(need_m - set(m)), len(need_f - set(f))


def scan(v):
    d = os.path.join(SND, v)
    keys, wh = [], []
    for f in sorted(os.listdir(d)) if os.path.isdir(d) else []:
        m = re.fullmatch(r"([0-9a-f]{8})\.mp3", f)
        if m:
            keys.append(m.group(1))
        m = re.fullmatch(r"w_([a-z]+)\.mp3", f)
        if m:
            wh.append(m.group(1))
    return keys, wh


def main():
    m, wm = scan("m")
    f, wf = scan("f")
    lm, lf = missing(m, f)
    ready = not lm and not lf
    def chunk(keys):
        lines = [" ".join(keys[i:i + 12]) for i in range(0, len(keys), 12)]
        return '"' + ' " +\n    "'.join(lines) + '"' if lines else '""'
    js = (
        "/* «Подземная лаборатория» — записанные реплики ОКО (js/okovoice.js).\n"
        "   Собирает lab/tools/okovoice/manifest.py по папкам sounds/oko/m и sounds/oko/f:\n"
        "   отпечатки текстов реплик (FNV-1a), у каждого — запись <отпечаток>.mp3; w — шёпот для эха.\n"
        "   Руками не править. */\n"
        "window.LAB = window.LAB || {};\n"
        "LAB.OKO_VOICED = {\n"
        f"  /* мужской голос: {len(m)} реплик */\n"
        f"  m: {chunk(m)},\n"
        f"  /* женский голос: {len(f)} реплик */\n"
        f"  f: {chunk(f)},\n"
        f"  w: {{ m: \"{' '.join(wm)}\", f: \"{' '.join(wf)}\" }},\n"
        "  /* записаны ли все реплики обоими голосами: нет — голос ОКО в игре и в сборках не участвует */\n"
        f"  ready: {'true' if ready else 'false'}\n"
        "};\n"
    )
    open(OUT, "w", encoding="utf-8").write(js)
    print(f"oko_voiced.js: мужской — {len(m)}, женский — {len(f)}, шёпот — {len(wm)}/{len(wf)}; "
          + ("записаны все реплики" if ready else f"без записи: мужской — {lm}, женский — {lf}"))


if __name__ == "__main__":
    main()
