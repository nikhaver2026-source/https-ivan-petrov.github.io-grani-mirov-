#!/usr/bin/env python3
"""Скачивает бесплатный набор с itch.io тем же путём, что и покупатель,
нажавший «Нет, спасибо, сразу к загрузкам»: ключ CSRF со страницы набора,
затем страница загрузок, затем у каждого файла свой одноразовый адрес.
Файлы, выложенные автором вне itch.io (Google Drive, Dropbox, MediaFire,
прямая ссылка), берутся по их ссылке. Лицензия набора — строка «LICENSE».

Использование: itch.py имя адрес_страницы папка
"""
import html
import http.cookiejar
import json
import os
import re
import sys
import urllib.parse
import urllib.request

UA = ("Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) "
      "Chrome/124.0 Safari/537.36")


def opener():
    jar = http.cookiejar.CookieJar()
    op = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    op.addheaders = [("User-Agent", UA), ("Accept-Language", "en-US,en;q=0.9")]
    return op


def fetch(op, url, data=None, headers=None):
    req = urllib.request.Request(url, data=data, headers=headers or {})
    with op.open(req, timeout=180) as r:
        return r.geturl(), r.headers, r.read()


def post_json(op, url, token, referer):
    body = urllib.parse.urlencode({"csrf_token": token}).encode()
    _, _, raw = fetch(op, url, body, {"X-Requested-With": "XMLHttpRequest",
                                      "Referer": referer})
    return json.loads(raw.decode("utf-8", "replace"))


def csrf(page):
    m = re.search(r'name="csrf_token"\s+value="([^"]+)"', page)
    return m.group(1) if m else None


def uploads(page):
    """Пары (номер файла, имя) по блокам <div class="upload">."""
    out, seen = [], set()
    for block in re.split(r'<div[^>]+class="upload\b', page)[1:]:
        uid = re.search(r'data-upload_id="(\d+)"', block)
        if not uid or uid.group(1) in seen:
            continue
        seen.add(uid.group(1))
        name = (re.search(r'<strong[^>]*title="([^"]+)"[^>]*class="name"', block)
                or re.search(r'<strong[^>]*class="name"[^>]*title="([^"]+)"', block)
                or re.search(r'class="name"[^>]*>([^<]+)<', block))
        out.append((uid.group(1), html.unescape(name.group(1)).strip() if name else None))
    if not out:  # кнопки без блоков — на странице самого набора
        for uid in re.findall(r'data-upload_id="(\d+)"', page):
            if uid not in seen:
                seen.add(uid)
                out.append((uid, None))
    return out


def safe(name):
    name = re.sub(r'[^\w.\- ]+', '_', name, flags=re.UNICODE).strip() or "file"
    return name[:120]


def disposition_name(headers):
    cd = headers.get("Content-Disposition") or ""
    m = re.search(r"filename\*=UTF-8''([^;]+)", cd)
    if m:
        return urllib.parse.unquote(m.group(1))
    m = re.search(r'filename="?([^";]+)"?', cd)
    return m.group(1) if m else None


def stream(op, url, folder, fallback):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with op.open(req, timeout=600) as r:
        ctype = r.headers.get("Content-Type", "")
        name = disposition_name(r.headers) or fallback or os.path.basename(
            urllib.parse.urlparse(r.geturl()).path) or "file"
        if ctype.startswith("text/html"):
            return None, r.read().decode("utf-8", "replace"), r.geturl()
        path = os.path.join(folder, safe(urllib.parse.unquote(name)))
        size = 0
        with open(path, "wb") as f:
            while True:
                chunk = r.read(1 << 20)
                if not chunk:
                    break
                f.write(chunk)
                size += len(chunk)
        print(f"   файл {os.path.basename(path)} {size} байт", flush=True)
        return path, None, r.geturl()


def gdrive_id(url):
    m = (re.search(r"/file/d/([\w-]{10,})", url) or re.search(r"[?&]id=([\w-]{10,})", url))
    return m.group(1) if m else None


def gdrive_folder(op, url):
    """Файлы открытой папки Google Drive: (id, имя) из кода страницы."""
    _, _, raw = fetch(op, url)
    page = raw.decode("utf-8", "replace").replace("\\x22", '"').replace("\\/", "/")
    found, seen = [], set()
    for fid, name in re.findall(r'\["([\w-]{25,})",\["[\w-]{20,}"\],"([^"]+\.[A-Za-z0-9]{2,5})"', page):
        if fid not in seen:
            seen.add(fid)
            found.append((fid, name))
    return found


def gdrive_file(op, fid, folder, name=None):
    url = f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t"
    path, page, _ = stream(op, url, folder, name)
    if path or not page:
        return path
    # Предупреждение «файл слишком велик для проверки»: форма с полями.
    act = re.search(r'<form[^>]+action="([^"]+)"', page)
    fields = dict(re.findall(r'<input[^>]+name="([^"]+)"[^>]+value="([^"]*)"', page))
    if act and fields:
        url = html.unescape(act.group(1)) + "?" + urllib.parse.urlencode(fields)
        path, page, _ = stream(op, url, folder, name)
    if not path:
        print(f"!! Google Drive не отдал файл {fid}", flush=True)
    return path


def external(op, url, folder, name):
    host = urllib.parse.urlparse(url).netloc.lower()
    print(f"   внешняя ссылка: {url}", flush=True)
    if "drive.google.com" in host or "docs.google.com" in host:
        if "/folders/" in url:
            items = gdrive_folder(op, url)
            print(f"   папка Google Drive: {len(items)} файлов", flush=True)
            for fid, nm in items:
                gdrive_file(op, fid, folder, nm)
            return
        fid = gdrive_id(url)
        if fid:
            gdrive_file(op, fid, folder, name)
            return
    if "dropbox.com" in host:
        url = re.sub(r"([?&])dl=0", r"\1dl=1", url)
        if "dl=1" not in url:
            url += ("&" if "?" in url else "?") + "dl=1"
    if "mediafire.com" in host:
        _, _, raw = fetch(op, url)
        m = re.search(r'href="(https://download[^"]+mediafire\.com/[^"]+)"', raw.decode("utf-8", "replace"))
        if not m:
            print("!! MediaFire: нет прямой ссылки", flush=True)
            return
        url = m.group(1)
    path, page, final = stream(op, url, folder, name)
    if not path:
        print(f"!! вместо файла пришла страница ({final}); ссылки на ней:", flush=True)
        for link in sorted(set(re.findall(r'href="(https?://[^"]+)"', page or "")))[:40]:
            print("   ", link, flush=True)


def main(name, page_url, root):
    op = opener()
    game = page_url.rstrip("/")
    folder = os.path.join(root, name)
    os.makedirs(folder, exist_ok=True)
    _, _, raw = fetch(op, game)
    page = raw.decode("utf-8", "replace")
    lic = re.search(r'itch\.io/game-assets/assets-([a-z0-9-]+)', page)
    print(f"LICENSE {name} {game} {lic.group(1) if lic else '?'}", flush=True)
    token = csrf(page)
    items, key, referer, template = uploads(page), None, game, None
    # «Назови свою цену» (кнопка ведёт на /purchase) и страницы без кнопок:
    # ключ загрузки выдаёт download_url — как после «Нет, спасибо».
    if "/purchase" in page or not items:
        try:
            info = post_json(op, game + "/download_url", token, game)
        except Exception as e:  # noqa: BLE001
            info = {"errors": [str(e)]}
        durl = info.get("url")
        if durl:
            # Ключ — base64 с подписью: «+» в строке запроса стал бы пробелом,
            # поэтому ключ раскодируется и кодируется заново целиком.
            key = urllib.parse.quote(urllib.parse.unquote(durl.rstrip("/").split("/")[-1].split("?")[0]), safe="")
            print(f"   страница загрузок: {durl[:160]}", flush=True)
            _, _, raw = fetch(op, durl)
            dpage = raw.decode("utf-8", "replace")
            token = csrf(dpage) or token
            items = uploads(dpage) or items
            referer = durl
            print(f"   ключ загрузки получен ({len(key)} знаков)", flush=True)
            # Страница загрузок сама называет адрес выдачи файла (шаблон с
            # {upload_id}): берём его, а страницу кладём рядом для разбора.
            with open(os.path.join(folder, "_download_page.html"), "w", encoding="utf-8") as f:
                f.write(dpage)
            for m in list(re.finditer(r'"([^"]*\\?/file\\?/[^"]*)"', dpage))[:6]:
                t = m.group(1).replace("\\/", "/")
                print(f"   шаблон на странице: {t[:200]}", flush=True)
                if "upload_id" in t and template is None:
                    template = t
            for m in list(re.finditer(r'.{0,80}(?:download_key|"key"|key=).{0,120}', dpage))[:6]:
                print(f"   ключ на странице: {m.group(0)[:220]}", flush=True)
        elif not items:
            print(f"!! нет страницы загрузок: {info}", flush=True)
            return 1
        else:
            print(f"   download_url не ответил ({info}); пробую прямые кнопки", flush=True)
    print(f"   файлов в наборе: {len(items)}", flush=True)
    for uid, nm in items:
        if template:
            api = re.sub(r"\{upload_id\}|%7Bupload_id%7D|:upload_id", uid, template)
            if api.startswith("/"):
                api = game.split("/", 3)[0] + "//" + game.split("/", 3)[2] + api
        elif key:
            api = f"{game}/file/{uid}?source=game_download&key={key}"
        else:
            api = f"{game}/file/{uid}?source=view_game&as_props=1&after_download_lightbox=true"
        try:
            info = post_json(op, api, token, referer)
        except Exception as e:  # noqa: BLE001 — один файл не валит весь набор
            print(f"!! файл {uid} ({nm}): {e}", flush=True)
            continue
        url = info.get("url")
        if not url:
            print(f"!! файл {uid} ({nm}): ответ без адреса {info}", flush=True)
            continue
        host = urllib.parse.urlparse(url).netloc.lower()
        print(f"== {nm or uid} ({host})", flush=True)
        try:
            if info.get("external") or not re.search(r"itch|hwcdn|r2\.cloudflarestorage|amazonaws", host):
                external(op, url, folder, nm)
            else:
                stream(op, url, folder, nm)
        except Exception as e:  # noqa: BLE001
            print(f"!! {nm or uid}: {e}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1], sys.argv[2], sys.argv[3]))
