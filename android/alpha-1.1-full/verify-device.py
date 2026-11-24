"""Exercise the signed release and the update from the previous Android build."""
import re
import subprocess
import sys
import time
import xml.etree.ElementTree as ET
from zipfile import ZipFile

package = 'io.github.granimirov'
old, full = sys.argv[1:]
screen_file = '/sdcard/grani-full-check.xml'


def adb(*args, timeout=25, check=True):
    return subprocess.run(['adb',*args], text=True, timeout=timeout, check=check,
                          stdout=subprocess.PIPE, stderr=subprocess.STDOUT).stdout


def installed():
    text = adb('shell','dumpsys','package',package)
    date = re.search(r'firstInstallTime=(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})',text)
    code = re.search(r'versionCode=(\d+)',text)
    if not date or not code:
        raise RuntimeError('Missing installation identity')
    return date.group(1), int(code.group(1))


def label(node):
    return ' '.join(node.get(k,'') for k in ('text','content-desc','resource-id'))


def screen(*expected, seconds=50):
    stop = time.monotonic() + seconds
    names = []
    while time.monotonic() < stop:
        adb('shell','uiautomator','dump',screen_file,check=False)
        view = adb('shell','cat',screen_file,check=False)
        try:
            root = ET.fromstring(view)
        except ET.ParseError:
            continue
        names = [label(x) for x in root.iter('node')]
        if all(any(e in name for name in names) for e in expected):
            return root
    raise AssertionError(f'Expected UI {expected}; saw {names[-25:]}')


def activate(root, name):
    parents = {child:parent for parent in root.iter() for child in parent}
    for node in root.iter('node'):
        if name not in label(node):
            continue
        while node.get('clickable') == 'false' and node in parents and parents[node].tag == 'node':
            node = parents[node]
        box = [int(n) for n in re.findall(r'\d+',node.get('bounds',''))]
        if len(box)!=4 or box[2]<=box[0] or box[3]<=box[1]:
            continue
        x,y = (box[2]+box[0])//2,(box[3]+box[1])//2
        adb('shell','input','swipe',str(x),str(y),str(x),str(y),'680')
        time.sleep(.2)
        adb('shell',f'input tap {x} {y}; sleep 0.16; input tap {x} {y}')
        return
    raise AssertionError(f'No visible control {name}')


def advance(root, control, *destination):
    for index in range(3):
        activate(root,control)
        try:
            return screen(*destination,seconds=8)
        except AssertionError:
            if index==2:
                raise
            root = screen(control,seconds=8)


with ZipFile(full) as apk:
    last = next(i for i in reversed(apk.infolist()) if i.header_offset>2**32
                and i.filename.startswith('assets/www/sounds/') and i.filename.endswith('.flac'))
asset = last.filename.removeprefix('assets/')
print('Android', adb('shell','getprop','ro.build.version.release').strip(), flush=True)
adb('shell','wm','size','1080x2400')
adb('shell','wm','density','280')
adb('shell','settings','put','global','verifier_verify_adb_installs','0')
adb('shell','cmd','connectivity','airplane-mode','enable')
adb('shell','svc','wifi','disable')
adb('shell','svc','data','disable')
assert adb('shell','settings','get','global','airplane_mode_on').strip()=='1'
assert 'Success' in adb('install',old,timeout=90)
assert 'Status: ok' in adb('shell','am','start','-W','-n',package+'/.MainActivity')
old_date,old_code=installed()
screen('Альфа 1.1','Без пролога')
adb('shell','am','force-stop',package)
adb('root')
adb('wait-for-device')
time.sleep(2)
data='/data/data/'+package
owner=adb('shell','stat','-c','%u',data).strip()
assert owner.isdigit()
adb('shell', f'mkdir -p {data}/files; echo grani-preserved > {data}/files/update-mark; '
             f'chown {owner}:{owner} {data}/files {data}/files/update-mark; restorecon -R {data}/files')
assert 'Success' in adb('install','-r',full,timeout=420)
new_date,new_code=installed()
assert (old_date,new_code)==(new_date,40110001) and new_code>old_code
assert adb('shell','cat',data+'/files/update-mark').strip()=='grani-preserved'
adb('shell','ls',data+'/app_webview')
print(f'Updated {old_code} to {new_code}. Internal data survived.',flush=True)
adb('logcat','-c')
assert 'Status: ok' in adb('shell','am','start','-W','-n',package+'/.MainActivity',
                          '--es','grani_probe',asset)
title=screen('Альфа 1.1','Проверить звук','Без пролога')
probe=adb('logcat','-d','-s','GraniProbe:I','*:S')
assert f'ok {asset} {last.file_size}' in probe,probe
print(f'Read {last.file_size} bytes of offline FLAC at offset {last.header_offset}',flush=True)
hero=advance(title,'Без пролога','Настройки персонажа','Готово — в путь')
advance(hero,'Готово — в путь','Уровень 1','Опыт')
assert package not in adb('logcat','-d','-b','crash')
print('Entered the game in airplane mode after updating the exact release APK.',flush=True)
