"""Rebuild the exact release page and overlay the approved new voice recordings."""
from pathlib import Path
import hashlib
import gzip
import json
import shutil
import subprocess
import sys

project, build = map(lambda s: Path(s).resolve(), sys.argv[1:])
original = project / 'android/alpha-1.1/inputs'
web = build / 'web'
web.mkdir()
settings = json.loads((original / 'assets.json').read_text())

def verify(path, digest):
    if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
        raise SystemExit(f'Content check failed for {path}')

def apply_patch(path):
    with gzip.open(path, 'rb') as file:
        subprocess.run(['patch', '--batch', '--fuzz=0', '-p1'], cwd=web,
                       input=file.read(), check=True)

for name in ('index.html', 'sw.js', 'manifest.json', 'icon-192.png', 'icon-512.png'):
    shutil.copyfile(project / name, web / name)
verify(web/'index.html', settings['original']['index.html'])
apply_patch(original / 'index.patch.gz')
verify(web/'index.html', settings['built']['index.html'])
apply_patch(Path(__file__).resolve().parent / 'speech.patch.gz')
verify(web/'index.html', (Path(__file__).resolve().parent/'html.sha256').read_text().strip())

overlay = build / 'overlay'
shutil.copytree(original / 'new-sounds', overlay)
for source, bank in settings['banks'].items():
    root_file = project / source
    verify(root_file, settings['original'][source])
    text = root_file.read_text()
    prefix, body = text.split('=', 1)
    data = json.loads(body.strip().removesuffix(';'))
    data['p'].update(bank['additions'])
    data['top'] = bank['top']
    destination = overlay / Path(bank['file']).relative_to('sounds')
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(prefix + '=' + json.dumps(data,ensure_ascii=False,separators=(',',':')) + ';\n')
for path, sha in settings['built'].items():
    if path.startswith('sounds/'):
        verify(overlay / Path(path).relative_to('sounds'),sha)
