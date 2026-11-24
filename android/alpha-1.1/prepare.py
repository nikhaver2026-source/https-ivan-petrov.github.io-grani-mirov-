import gzip
import hashlib
import json
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

BASE = (
    'https://raw.githubusercontent.com/nikhaver2026-source/'
    'https-ivan-petrov.github.io-grani-mirov-/bf5ec7eb71dbf71c8ac3a70418b23450083a9e4a/'
)


def fetch(path, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.is_file() and destination.stat().st_size:
        return
    temporary = destination.with_suffix(destination.suffix + '.part')
    try:
        for attempt in range(3):
            try:
                with urllib.request.urlopen(BASE + path, timeout=30) as response:
                    with temporary.open('wb') as out:
                        shutil.copyfileobj(response, out)
                temporary.replace(destination)
                return
            except urllib.error.HTTPError as error:
                if error.code == 404 or attempt == 2:
                    raise
            except OSError:
                if attempt == 2:
                    raise
            time.sleep(attempt + 1)
    finally:
        temporary.unlink(missing_ok=True)


def verify(path, expected):
    actual = hashlib.sha256(path.read_bytes()).hexdigest()
    if actual != expected:
        raise ValueError(f'Unexpected SHA-256 for {path}: {actual}')


inputs, web = (Path(arg).resolve() for arg in sys.argv[1:])
config = json.loads((inputs / 'assets.json').read_bytes())
cache = web.parent / 'base-assets'
with ThreadPoolExecutor(max_workers=12) as pool:
    downloads = [pool.submit(fetch, path, cache / path) for path in config['upstream']]
    for pending in downloads:
        pending.result()

for path in config['upstream']:
    if path not in config['original']:
        target = web / path
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(cache / path, target)

for path, digest in config['original'].items():
    verify(cache / path, digest)

shutil.copyfile(cache / 'index.html', web / 'index.html')
with gzip.open(inputs / 'index.patch.gz', 'rb') as patch:
    subprocess.run(['patch', '--batch', '--fuzz=0', '-p1', '-i', '/dev/stdin'],
                   cwd=web, check=True,
                   input=patch.read())
for old, bank in config['banks'].items():
    text = (cache / old).read_text(encoding='utf-8')
    header, body = text.split('=', 1)
    data = json.loads(body.rstrip().removesuffix(';'))
    data['p'].update(bank['additions'])
    data['top'] = bank['top']
    target = web / bank['file']
    target.parent.mkdir(parents=True, exist_ok=True)
    result = header + '=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n'
    target.write_text(result, encoding='utf-8')

shutil.copytree(inputs / 'new-sounds', web / 'sounds', dirs_exist_ok=True)
for path, digest in config['built'].items():
    verify(web / path, digest)
print(f'Game assets: {sum(path.stat().st_size for path in web.rglob("*") if path.is_file()):,} bytes')
