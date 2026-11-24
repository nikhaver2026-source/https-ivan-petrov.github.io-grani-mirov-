"""Pack the complete sound tree into ZIP64 and validate the signed result."""
from pathlib import Path
import argparse
import json
import os
import re
import subprocess
import zipfile

PREFIX = 'assets/www/sounds/'


def archive_sounds(project, overlay):
    files = subprocess.check_output(['git','-C',str(project),'ls-files','-z','--','sounds/'])
    paths = [Path(os.fsdecode(p)) for p in files.split(b'\0') if p]
    if len(paths) < 80000:
        raise SystemExit(f'Incomplete sound checkout ({len(paths)} files)')
    inventory = {p.relative_to('sounds').as_posix(): project / p for p in paths}
    for item in overlay.rglob('*'):
        if item.is_file():
            inventory[item.relative_to(overlay).as_posix()] = item
    if sum(p.stat().st_size for p in inventory.values()) <= (1 << 32):
        raise SystemExit('Sound inventory is too small for the complete edition')
    return inventory


def pack(config):
    source = archive_sounds(config.project,config.overlay)
    with zipfile.ZipFile(config.core) as src, zipfile.ZipFile(config.apk,'w',allowZip64=True) as out:
        for info in src.infolist():
            if info.filename.startswith('META-INF/') or info.filename.startswith(PREFIX):
                continue
            data = src.read(info)
            entry = zipfile.ZipInfo(info.filename, date_time=info.date_time)
            entry.external_attr = info.external_attr
            out.writestr(entry,data,compress_type=zipfile.ZIP_STORED)
        for name,path in sorted(source.items()):
            if path.is_symlink() or not path.is_file():
                raise ValueError(f'Missing or unexpected audio asset: {path}')
            out.write(path, PREFIX+name, compress_type=zipfile.ZIP_STORED)
    with zipfile.ZipFile(config.apk) as apk:
        inventory = {i.filename:[i.file_size,i.CRC] for i in apk.infolist()}
    config.inventory.write_text(json.dumps(inventory,separators=(',',':')))
    print(f'Stored {len(source)} sound assets, {config.apk.stat().st_size} bytes before signing')


def verify(config):
    expected = json.loads(config.inventory.read_text())
    with zipfile.ZipFile(config.apk) as apk:
        files = apk.infolist()
        names = [entry.filename for entry in files]
        if len(names)!=len(set(names)):
            raise ValueError('The APK contains duplicate entries')
        actual = {i.filename:[i.file_size,i.CRC] for i in files if not i.filename.startswith('META-INF/')}
        if expected != actual or any(i.compress_type != zipfile.ZIP_STORED for i in files if i.filename in expected):
            raise ValueError('Signing altered content or storage method')
        bad = apk.testzip()
        if bad:
            raise ValueError(f'Bad APK CRC: {bad}')
        sounds = [i for i in files if i.filename.startswith(PREFIX)]
        banks = {
            'gvoice/bank_51.js': ('gvoice/','p'),
            'gvoice_f/bank_f51.js': ('gvoice_f/','p'),
            'gvoice_pack/m/bank.js': ('gvoice_pack/m/','p'),
            'gvoice_pack/f/bank.js': ('gvoice_pack/f/','p'),
        }
        entries = set(names)
        missing = []
        for bank,(directory,key) in banks.items():
            value=apk.read(PREFIX+bank).decode()
            data=json.loads(value[value.index('{'):value.rindex('}')+1])[key]
            missing.extend((bank, filename) for filename in set(data.values())
                           if PREFIX+directory+filename+'.flac' not in entries)
        if missing:
            raise ValueError(f'Unresolved speech-bank audio: {missing[:8]} ({len(missing)} missing)')
        beyond = next((entry for entry in reversed(sounds)
                       if entry.header_offset > (1<<32) and entry.filename.endswith(('.flac','.ogg','.mp3','.wav'))),None)
        if beyond is None:
            raise ValueError('No audio past the ZIP64 boundary')
        print(f'Complete APK: {config.apk.stat().st_size} bytes, {len(sounds)} sound assets, uncompressed entries, CRC and banks verified')
        print(f'ZIP64 test asset: {beyond.filename} {beyond.file_size} {beyond.header_offset}')


parser = argparse.ArgumentParser()
parser.add_argument('--apk',type=Path,required=True)
parser.add_argument('--inventory',type=Path,required=True)
parser.add_argument('--verify',action='store_true')
parser.add_argument('--project',type=Path)
parser.add_argument('--overlay',type=Path)
parser.add_argument('--core',type=Path)
args=parser.parse_args()
(verify if args.verify else pack)(args)
