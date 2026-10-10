#!/usr/bin/env python3
"""Ищет и скачивает записи BigSoundBank (Joseph Sardin, CC0) тем же путём, что и
посетитель сайта.

Сайт с 2026 года отдаёт звук в два шага: форма «Download» на странице звука
ведёт на страницу ожидания «Download in progress», а на ней — форма dl-form
(/modules/telecharger.php) с полями защиты от ботов; через пять секунд
браузер сам отправляет её. Адрес страницы звука — с именем: /имя-sNNNN.html
(короткий /sNNNN.html уводит на главную).

Использование: bsb_search.py список папка
Строка списка: имя запрос | шаблон | сколько
  имя     — папка набора (bsb_…);
  запрос  — слова поиска (как в строке поиска сайта);
  шаблон  — регулярное выражение по имени страницы звука: из выдачи берутся
            только подходящие (на страницах есть ещё «новые» и «популярные»);
  сколько — сколько первых подходящих скачать.
В журнал пишется номер, имя страницы и имя файла: по ним записи отбираются.
"""
import http.cookiejar
import os
import re
import sys
import time
import urllib.parse
import urllib.request

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0 Safari/537.36")
BASE = "https://bigsoundbank.com"


def opener():
    jar = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    op.addheaders = [("User-Agent", UA), ("Accept-Language", "en-US,en;q=0.9")]
    return op


def fetch(op, url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers=headers or {})
    with op.open(req, timeout=180) as r:
        return r.geturl(), r.headers, r.read()


def search(op, q):
    url = f"{BASE}/search?" + urllib.parse.urlencode({"q": q})
    _, _, raw = fetch(op, url)
    page = raw.decode("utf-8", "replace")
    out = []
    for slug, num in re.findall(r'href=["\'](?:https://bigsoundbank\.com)?/([a-z0-9\-]+)-s(\d{3,5})\.html["\']', page):
        if (slug, num) not in out:
            out.append((slug, num))
    return out, page


def hidden_fields(html):
    out = {}
    for tag in re.findall(r"<input[^>]+>", html):
        name = re.search(r'name=["\']([^"\']+)["\']', tag)
        if not name:
            continue
        typ = re.search(r'type=["\']([^"\']+)["\']', tag)
        val = re.search(r'value=["\']([^"\']*)["\']', tag)
        if typ and typ.group(1).lower() in ("hidden", "text"):
            out[name.group(1)] = val.group(1) if val else ""
    return out


def download(op, slug, num, root, name):
    page_url = f"{BASE}/{slug}-s{int(num):04d}.html"
    final, _, raw = fetch(op, page_url)
    page = raw.decode("utf-8", "replace")
    title = re.search(r"<title>(.*?)</title>", page, re.S)
    title = re.sub(r"\s+", " ", title.group(1)).strip() if title else slug
    token = re.search(r'<meta name="csrf-token" content="([^"]+)"', page)
    token = token.group(1) if token else ""
    form = re.search(r'<form[^>]+action="https://bigsoundbank\.com/download\.php"[^>]*>(.*?)</form>', page, re.S)
    fields = hidden_fields(form.group(1)) if form else {}
    fields.update({"format": "wav", "button": "Download", "id": str(int(num))})
    if token:
        fields["csrf_token"] = token
    hdr = {"Referer": final, "Origin": BASE, "Content-Type": "application/x-www-form-urlencoded"}
    if token:
        hdr["X-CSRF-Token"] = token
    url, h, data = fetch(op, f"{BASE}/download.php", urllib.parse.urlencode(fields).encode(), hdr)
    if not h.get("Content-Type", "").startswith("text/html") and len(data) > 2000:
        return save(h, data, root, name, num, slug, title)
    wait = data.decode("utf-8", "replace")
    dl = re.search(r'<form[^>]+id="dl-form"[^>]+action="([^"]+)"[^>]*>(.*?)</form>', wait, re.S)
    if not dl:
        print(f"!! {name} #{num}: нет формы dl-form на странице ожидания ({len(data)} байт)", flush=True)
        return False
    action = urllib.parse.urljoin(url, dl.group(1))
    f2 = hidden_fields(dl.group(2))
    f2.setdefault("format", "wav")
    f2["antibot_hp"] = ""
    time.sleep(6.5)  # страница ждёт пять секунд, потом отправляет форму сама
    hdr2 = {"Referer": url, "Origin": BASE, "Content-Type": "application/x-www-form-urlencoded"}
    _, h2, data2 = fetch(op, action, urllib.parse.urlencode(f2).encode(), hdr2)
    ctype = h2.get("Content-Type", "")
    if ctype.startswith("text/html") or len(data2) < 2000:
        dbg = os.path.join(root, "bsb_debug")
        os.makedirs(dbg, exist_ok=True)
        open(os.path.join(dbg, f"{int(num):04d}_dl.html"), "wb").write(data2)
        print(f"!! {name} #{num}: вместо звука страница ({ctype}, {len(data2)} байт)", flush=True)
        return False
    return save(h2, data2, root, name, num, slug, title)


def save(h, data, root, name, num, slug, title):
    cd = h.get("Content-Disposition") or ""
    m = re.search(r'filename="?([^";]+)"?', cd)
    ext = ".wav"
    if m and "." in m.group(1):
        ext = os.path.splitext(m.group(1))[1].lower()[:5] or ".wav"
    fn = f"{int(num):04d}_{slug[:60]}{ext}"
    os.makedirs(os.path.join(root, name), exist_ok=True)
    open(os.path.join(root, name, fn), "wb").write(data)
    print(f"   ФАЙЛ {name} #{int(num):04d} {slug} | {title} | {fn} {len(data)} байт", flush=True)
    return True


def main(lst, root):
    op = opener()
    fetch(op, BASE + "/")  # сессия, как у посетителя
    taken = set()
    for line in open(lst, encoding="utf-8"):
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = [p.strip() for p in line.split("|")]
        head = parts[0].split(None, 1)
        name, q = head[0], head[1] if len(head) > 1 else ""
        pat = re.compile(parts[1] if len(parts) > 1 and parts[1] else ".", re.I)
        k = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 2
        print(f"== bsb {name}: «{q}»", flush=True)
        try:
            found, page = search(op, q)
        except Exception as e:  # noqa: BLE001
            print(f"!! поиск {name}: {e}", flush=True)
            continue
        good = [(s, n) for s, n in found if pat.search(s) and n not in taken]
        print(f"   выдача: {len(found)}, подходят: {', '.join(f'{s}-s{n}' for s, n in good[:12]) or 'нет'}", flush=True)
        if not found:
            dbg = os.path.join(root, "bsb_debug")
            os.makedirs(dbg, exist_ok=True)
            open(os.path.join(dbg, f"search_{name}.html"), "w", encoding="utf-8").write(page)
        got = 0
        for slug, num in good:
            if got >= k:
                break
            try:
                if download(op, slug, num, root, name):
                    got += 1
                    taken.add(num)
            except Exception as e:  # noqa: BLE001
                print(f"!! {name} #{num}: {e}", flush=True)
            time.sleep(1.5)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
