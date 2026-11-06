#!/usr/bin/env python3
"""Голос ОКО: нарезка записи пакета на реплики — по паузам и по услышанным словам.

Gemini в длинной записи (полсотни реплик, четыре минуты) путает время: отрезки
по его отметкам выходят по 0,1 с или на ползаписи. Поэтому время у него не
спрашиваем:
  1. запись делится на куски по паузам (тише порога не короче 0,25 с; щелчки
     короче 0,1 с — не куски);
  2. каждый кусок — отдельным звуком в запросе к Gemini (до 40 кусков за раз,
     у каждого свой номер): что в нём слышно;
  3. куски раскладываются по репликам по порядку (динамическое программирование):
     каждой реплике — подряд идущие куски, чьи слова лучше всего совпадают с её
     текстом; лишний кусок можно пропустить, выпавшую реплику — оставить пустой;
     граница реплики — середина паузы у её крайних кусков;
  4. проверка: каждый получившийся отрезок снова отдельным звуком — что в нём
     слышно. Модель иногда переносит слова в соседний кусок, и на стыке реплик
     граница могла бы сдвинуться; поэтому сходство считается по тому, что
     слышно в самом отрезке, — run.py принимает реплику при сходстве не ниже 0,8.
"""
import base64, difflib, io, json, os, re, wave
import numpy as np

GAP = 0.25        # пауза между кусками, с
PER_CALL = 40     # кусков в одном запросе
MAX_PIECES = 8    # кусков в одной реплике
CLICK = 0.1       # короче — щелчок, не кусок


def frames_db(x, sr):
    fr = int(sr * 0.01); m = len(x) // fr
    db = 20 * np.log10(np.sqrt(np.mean(x[:m * fr].reshape(m, fr) ** 2, axis=1)) + 1e-12)
    return fr, db


def pieces(x, sr, gap=GAP):
    """Куски речи между паузами: [(начало, конец)] в отсчётах; паузы по краям записи — не куски."""
    fr, db = frames_db(x, sr)
    quiet = db < max(-48.0, db.max() - 38.0)
    m, need = len(db), int(round(gap * 100))
    out, i, start = [], 0, None
    while i < m:
        if quiet[i]:
            j = i
            while j < m and quiet[j]:
                j += 1
            if start is not None and (j - i >= need or j == m):
                out.append((start * fr, i * fr))
                start = None
            i = j
        else:
            if start is None:
                start = i
            i += 1
    if start is not None:
        out.append((start * fr, m * fr))
    return [p for p in out if p[1] - p[0] >= CLICK * sr]


def wav_bytes(x, sr, rate=16000):
    if sr != rate:
        n = int(len(x) * rate / sr)
        x = np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x)
    b = io.BytesIO()
    with wave.open(b, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())
    return b.getvalue()


PROMPT = ("Выше — {n} кусков одной русской записи, по порядку, у каждого свой номер. "
          "Для каждого куска запиши дословно, что в нём слышно, — только его слова, без догадок о соседних кусках; "
          "если разборчивых слов нет — пустая строка. Ответ — только JSON-объект "
          '{{"1": "текст", "2": "текст", …}} со всеми номерами от 1 до {n}.')


HINT = ("Выше — {n} кусков одной русской записи, по порядку, у каждого свой номер. Голос читает по порядку "
        "реплики из этого списка (какую-то может пропустить или сказать иначе):\n{lines}\n\n"
        "Куски идут подряд: следующий начинается там, где кончился предыдущий. Для каждого куска запиши "
        "дословно, что слышно именно в нём, и номер реплики, к которой он относится (0 — разборчивых слов нет). "
        'Ответ — только JSON-объект {{"1": {{"line": номер, "text": "текст"}}, …}} со всеми номерами от 1 до {n}.')


def body(chunks, lines=None):
    """Тело запроса generateContent: куски по номерам и просьба записать услышанное;
    lines — тексты реплик пакета: с ними модель меньше сбивается в номерах кусков."""
    parts = []
    for i, b in enumerate(chunks):
        parts.append({"text": f"Кусок {i + 1}:"})
        parts.append({"inline_data": {"mime_type": "audio/wav", "data": base64.b64encode(b).decode()}})
    if lines:
        parts.append({"text": HINT.format(n=len(chunks), lines="\n".join(f"{j + 1}) {t}" for j, t in enumerate(lines)))})
    else:
        parts.append({"text": PROMPT.format(n=len(chunks))})
    return {"contents": [{"parts": parts}], "generationConfig": {"responseMimeType": "application/json", "temperature": 0}}


def parse(text, n):
    d = json.loads(text)
    if isinstance(d, list):
        d = {str(i + 1): t for i, t in enumerate(d)}
    out = []
    for i in range(n):
        t = d.get(str(i + 1), "")
        if isinstance(t, dict):
            t = t.get("text", "")
        out.append(t if isinstance(t, str) else "")
    return out


def norm(t):
    return re.sub(r"\s+", " ", re.sub(r"[^а-яё ]", " ", t.lower().replace("ё", "е"))).strip()


def ratio(a, b):
    return difflib.SequenceMatcher(None, a, b, autojunk=False).ratio() if (a or b) else 1.0


def group(heard, texts, kmax=MAX_PIECES, skip=0.05):
    """Куски по репликам: [(первый, последний)] или None для выпавшей реплики.
    Сумма сходств по репликам — наибольшая; пропуск куска со словами стоит skip."""
    P = [norm(h) for h in heard]
    L = [norm(t) for t in texts]
    n, m = len(L), len(P)
    NEG = -1e9
    best = [[NEG] * (m + 1) for _ in range(n + 1)]
    back = [[None] * (m + 1) for _ in range(n + 1)]
    best[0][0] = 0.0
    for j in range(n + 1):
        for i in range(m + 1):
            cur = best[j][i]
            if cur == NEG:
                continue
            if i < m:  # кусок никому: пустой — даром, со словами — за skip
                v = cur - (skip if P[i] else 0.0)
                if v > best[j][i + 1]:
                    best[j][i + 1], back[j][i + 1] = v, (j, i, "skip")
            if j < n:
                v = cur  # реплика выпала из записи
                if v > best[j + 1][i]:
                    best[j + 1][i], back[j + 1][i] = v, (j, i, "none")
                s = ""
                for k in range(i, min(m, i + kmax)):
                    s = (s + " " + P[k]).strip()
                    v = cur + ratio(s, L[j])
                    if v > best[j + 1][k + 1]:
                        best[j + 1][k + 1], back[j + 1][k + 1] = v, (j, i, "take")
    out, j, i = [None] * n, n, m
    while j or i:
        pj, pi, how = back[j][i]
        if how == "take":
            out[pj] = (pi, i - 1)
        j, i = pj, pi
    return out


def hear(x, sr, spans, asr, lines=None):
    """Что слышно в каждом отрезке [(начало, конец)] — по PER_CALL за запрос; None — нет ответа."""
    out = []
    for c in range(0, len(spans), PER_CALL):
        part = spans[c:c + PER_CALL]
        got = asr([wav_bytes(x[a:b], sr) for a, b in part], lines)
        if got is None or len(got) != len(part):
            return None
        out += got
    return out


def split(x, sr, texts, asr, gap=GAP, debug=None):
    """Запись пакета → по реплике: (отрезок, услышано, сходство); выпавшей — (None, "", 0).
    asr(список WAV-байт) → список услышанного или None (нет ответа)."""
    ps = pieces(x, sr, gap)
    if len(ps) < len(texts) // 2:
        return None
    heard = hear(x, sr, ps, asr, texts)
    if heard is None:
        return None
    g = group(heard, texts)
    spans = []
    for r in g:
        if r is None:
            spans.append(None); continue
        a, b = r
        lo = (ps[a - 1][1] + ps[a][0]) // 2 if a > 0 else max(0, ps[a][0] - int(sr * 0.2))
        hi = (ps[b][1] + ps[b + 1][0]) // 2 if b + 1 < len(ps) else min(len(x), ps[b][1] + int(sr * 0.4))
        spans.append((lo, hi))
    have = [sp for sp in spans if sp]
    check = hear(x, sr, have, asr) if have else []
    if check is None:
        return None
    if debug is not None:
        debug.update(pieces=[(round(a / sr, 2), round(b / sr, 2)) for a, b in ps], heard=heard, group=g, check=check)
    it, out = iter(check), []
    for t, sp in zip(texts, spans):
        if sp is None:
            out.append((None, "", 0.0)); continue
        h = next(it).strip()
        out.append((x[sp[0]:sp[1]], h, ratio(norm(h), norm(t))))
    return out


# ── (30.10) Новый способ: запись с паузами «…» между репликами ──────────────────
# Gemini в одной записи путает номера кусков (до 40 за раз), и проверка ловила
# чужие реплики. Теперь run.py ставит между репликами отдельный кусок «…» с
# интонацией «две секунды полной тишины» (проба 30.10: длинные паузы на всех
# стыках), а режем мы сами:
#   1. куски речи по паузам (pieces);
#   2. раскладка кусков на реплики по порядку (динамическое программирование):
#      стык реплик любит длинную паузу, а длина отрезка — длину её текста
#      (скорость чтения — по всей записи);
#   3. проверка — группами по GROUP отрезков с их текстами: в коротком запросе
#      модель не сбивается в номерах, а если и собьётся, отрезок просто не
#      совпадёт со своим текстом и не пройдёт — чужой реплики в игре не будет.
GROUP = 6


def dp_cut(x, sr, texts, gap=GAP, w_gap=3.0, lam=4.0, pad=0.06):
    """Отрезки реплик [(начало, конец)] в отсчётах или None (кусков меньше реплик)."""
    ps = pieces(x, sr, gap)
    P, n = len(ps), len(texts)
    if not n or P < n:
        return None
    gaps = [(ps[i + 1][0] - ps[i][1]) / sr for i in range(P - 1)]
    span = (ps[-1][1] - ps[0][0]) / sr
    rate = max(0.03, (span - sum(sorted(gaps, reverse=True)[:n - 1])) / sum(max(1, len(t)) for t in texts))
    NEG = float("-inf")
    best = [[NEG] * (P + 1) for _ in range(n + 1)]
    back = [[-1] * (P + 1) for _ in range(n + 1)]
    best[0][0] = 0.0
    for k in range(1, n + 1):
        e = rate * max(1, len(texts[k - 1]))
        for j in range(k, P - (n - k) + 1):
            for a in range(k - 1, j):
                if best[k - 1][a] == NEG:
                    continue
                d = (ps[j - 1][1] - ps[a][0]) / sr
                sc = best[k - 1][a] - lam * np.log(d / e) ** 2 + (w_gap * np.log(max(0.05, gaps[a - 1])) if a else 0.0)
                if sc > best[k][j]:
                    best[k][j], back[k][j] = sc, a
    if best[n][P] == NEG:
        return None
    spans, j = [], P
    for k in range(n, 0, -1):
        a = back[k][j]
        spans.append((max(0, ps[a][0] - int(pad * sr)), min(len(x), ps[j - 1][1] + int(pad * sr))))
        j = a
    return spans[::-1]


def split_dp(x, sr, texts, asr, group=GROUP):
    """Запись пакета с паузами между репликами → по реплике (отрезок, услышано, сходство);
    None — не разрезать или «что слышно» не ответило (запись подождёт)."""
    spans = dp_cut(x, sr, texts)
    if spans is None:
        return None
    segs = [x[a:b] for a, b in spans]
    out = []
    for i in range(0, len(texts), group):
        part = texts[i:i + group]
        heard = asr([wav_bytes(s, sr) for s in segs[i:i + group]], part)
        if heard is None:
            return None
        for j, t in enumerate(part):
            h = heard[j] if j < len(heard) else ""
            out.append((segs[i + j], h, ratio(norm(h), norm(t))))
    return out


# ── (5.11) Нарезка по словам Whisper — на этой машине, без квоты ────────────────
# В спокойных интонациях (сад) паузы внутри реплик не короче пауз между репликами
# (около секунды и там и там), и раскладка по паузам (dp_cut) съезжала на реплику.
# А проверка «что слышно» с подсказкой (текстами реплик) пропускала отрезок с чужой
# фразой или без первого слова: модель писала подсказку, а не то, что звучит
# (выборка 5.11: брак у 7 % записанных). Теперь, если стоит faster-whisper:
#   1. Whisper слушает всю запись пакета без подсказки — слова с метками времени;
#   2. куски по паузам (pieces) получают слова, что звучат в них;
#   3. куски раскладываются по репликам по словам (group);
#   4. проверка — каждый отрезок отдельно тем же Whisper без подсказки: сходство не
#      ниже 0,8 и длина услышанного как у текста (same) — лишняя фраза соседа или
#      потерянное начало не проходят.
WHISPER = os.environ.get("OKOVOICE_WHISPER", "small")
PIECES_W = 14     # кусков в одной реплике при раскладке по словам (в саду пауз много)
_wm = None


def have_whisper():
    try:
        import faster_whisper  # noqa: F401
        return True
    except Exception:
        return False


def _model():
    global _wm
    if _wm is None:
        from faster_whisper import WhisperModel
        _wm = WhisperModel(WHISPER, device="cpu", compute_type="int8", cpu_threads=os.cpu_count() or 4)
    return _wm


# Whisper пишет числа цифрами («40 лет», «41 секунда»), а в репликах они словами — для сверки
# цифры произносятся словами (род и падеж не важны: сходство и так высокое). Запрет цифр в самом
# Whisper (suppress_tokens) пробовали 6.11: он начинал путать соседние слова и ронять куски.
_U = "ноль один два три четыре пять шесть семь восемь девять".split()
_T = ("десять одиннадцать двенадцать тринадцать четырнадцать пятнадцать шестнадцать семнадцать "
      "восемнадцать девятнадцать").split()
_D = ["", "", "двадцать", "тридцать", "сорок", "пятьдесят", "шестьдесят", "семьдесят", "восемьдесят", "девяносто"]
_H = ["", "сто", "двести", "триста", "четыреста", "пятьсот", "шестьсот", "семьсот", "восемьсот", "девятьсот"]


def _say3(n):
    h, r = divmod(n, 100)
    out = [_H[h]] if h else []
    if 10 <= r < 20:
        out.append(_T[r - 10])
    else:
        if r >= 20:
            out.append(_D[r // 10])
        if r % 10 or not out:
            out.append(_U[r % 10])
    return " ".join(out)


def _say(n):
    if n >= 10 ** 6:
        return str(n)
    th, r = divmod(n, 1000)
    if not th:
        return _say3(r)
    t = th % 10
    word = "тысяч" if 11 <= th % 100 <= 14 or t in (0, 5, 6, 7, 8, 9) else "тысяча" if t == 1 else "тысячи"
    return " ".join(w for w in (_say3(th), word, _say3(r) if r else "") if w)


def spell(text):
    """Цифры — словами: «41 секунда» → «сорок один секунда»."""
    return re.sub(r"\d+", lambda m: " " + _say(int(m.group())) + " ", text)


def speech(text):
    """То, что голос произносит: без ремарок в скобках — «…опасно… (помехи) …» читается без «помех»."""
    return re.sub(r"\([^)]*\)", " ", text)


def to16k(x, sr):
    if sr == 16000:
        return x.astype(np.float32)
    n = int(len(x) * 16000 / sr)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def words(x, sr):
    """Слова записи [(начало, конец, слово)] в секундах — Whisper без подсказки."""
    sg, _ = _model().transcribe(to16k(x, sr), language="ru", word_timestamps=True, beam_size=5,
                                vad_filter=False, condition_on_previous_text=False)
    return [(w.start, w.end, w.word) for s in sg for w in (s.words or [])]


def listen(x, sr):
    """Что слышно в отрезке — Whisper без подсказки."""
    sg, _ = _model().transcribe(to16k(x, sr), language="ru", beam_size=5, vad_filter=False,
                                condition_on_previous_text=False)
    return re.sub(r"\s+", " ", spell(" ".join(s.text.strip() for s in sg))).strip()


def variants(text):
    """Как реплику могли прочесть: без ремарок в скобках и с ремаркой вслух — голос то
    пропускает «(помехи)», то говорит «помехи», как и синтезатор в игре; верно и то и другое."""
    a, b = speech(text), re.sub(r"[()]", " ", text)
    return [a] if norm(a) == norm(b) else [a, b]


def _gaps1(heard, text):
    a, b = norm(heard), norm(text)
    return ratio(a, b), abs(len(a) - len(b)), abs(len(a.split()) - len(b.split())), len(b)


def gaps(heard, text):
    """(сходство, разница в буквах, разница в словах) услышанного и текста — по лучшему прочтению."""
    return max((_gaps1(heard, t) for t in variants(text)), key=lambda g: (g[0], -g[1]))[:3]


def same(heard, text, sim=0.8):
    """Услышанное — это текст реплики: похоже, длина та же и слов столько же (лишняя фраза
    соседа, потерянное начало или конец меняют длину, даже когда сходство ещё высокое)."""
    return any(s >= sim and dc <= max(4, 0.12 * n) and dw <= 1
               for s, dc, dw, n in (_gaps1(heard, t) for t in variants(text)))


def flawed(heard, text):
    """Брак записанной реплики: чужое (сходство ниже 0,7), длина не та или нет двух слов и
    больше (проба 5.11: «…носитель: оно слушает» без «оно слушает» — минус 10 букв из 54).
    Мягче, чем same: одно недослышанное Whisper'ом слово — ещё не брак."""
    return all(s < 0.7 or dc > max(5, 0.2 * n) or (dw >= 2 and dc >= 8)
               for s, dc, dw, n in (_gaps1(heard, t) for t in variants(text)))


def split_words(x, sr, texts, ws=None, only=None):
    """Запись пакета → по реплике (отрезок, услышано, сходство); выпавшей — (None, "", 0.0).
    ws — слова Whisper (words), если уже есть; only — номера реплик, которые проверять
    (остальным — отрезок без проверки: услышано "", сходство 0). None — в записи нет речи."""
    ps = pieces(x, sr)
    if not ps:
        return None
    if ws is None:
        ws = words(x, sr)
    st = np.array([p[0] for p in ps]); en = np.array([p[1] for p in ps])
    heard = [""] * len(ps); nw = [0] * len(ps)
    for a, b, w in ws:
        mid = (a + b) / 2 * sr
        inside = np.where((st <= mid) & (en >= mid))[0]
        i = int(inside[0]) if len(inside) else int(np.argmin(np.minimum(abs(st - mid), abs(en - mid))))
        heard[i] = (heard[i] + spell(w)).strip()      # слова Whisper начинаются с пробела; цифры — словами
        nw[i] += 1
    # (6.11) в длинной записи Whisper иногда роняет целые куски («Замок поддался.» — и сразу через
    # семь секунд «Сорок…»): кусок, где слов явно меньше, чем успел бы сказать голос, слушаем отдельно
    for i, (a, b) in enumerate(ps):
        d = (b - a) / sr
        if d >= 0.3 and nw[i] < 0.8 * d:
            h = spell(listen(x[a:b], sr))
            if len(norm(h)) > len(norm(heard[i])):
                heard[i] = h
    out = []
    for j, (t, r) in enumerate(zip(texts, group(heard, [speech(t) for t in texts], kmax=PIECES_W))):
        if r is None:
            out.append((None, "", 0.0)); continue
        a, b = r
        lo = (ps[a - 1][1] + ps[a][0]) // 2 if a > 0 else max(0, ps[a][0] - int(sr * 0.2))
        hi = (ps[b][1] + ps[b + 1][0]) // 2 if b + 1 < len(ps) else min(len(x), ps[b][1] + int(sr * 0.4))
        if only is not None and j not in only:
            out.append((x[lo:hi], "", 0.0)); continue
        h = listen(x[lo:hi], sr)
        out.append((x[lo:hi], h, gaps(h, t)[0]))
    return out
