#!/usr/bin/env python3
"""Сборка звуков «Подземной лаборатории».

Из свободных записей, скачанных сборщиком (.github/workflows/sfx-fetch.yml,
выпуск sfx-inbox, заходы 1–3), собирает папку lab/sounds: режет, обрезает
тишину, выравнивает громкость, делает петли, переводит в OGG Vorbis; пишет
lab/js/sounds.js (что звучит и откуда) и lab/sounds/CREDITS.md (авторы и
лицензии каждой записи). Записи под CC BY-SA и GPL не берутся.

Запуск: python3 lab/tools/build_sounds.py <папка exA> <папка exB> <папка exC>
(распакованные архивы заходов 1, 2 и 3). Нужны ffmpeg (libvorbis) и numpy.
"""
import sys, os, glob, fnmatch, subprocess, json, re, hashlib
import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
LAB = os.path.dirname(HERE)
OUT = os.path.join(LAB, "sounds")
ROOTS = {}

# ── Наборы: автор, лицензия, страница ──
CC0 = "CC0 1.0"
PACKS = {
  "lab_scifi50": ("50 CC0 Sci-Fi SFX", "rubberduck", CC0, "https://opengameart.org/content/50-cc0-sci-fi-sfx"),
  "lab_scifi60": ("60 CC0 Sci-Fi SFX", "rubberduck", CC0, "https://opengameart.org/content/60-cc0-sci-fi-sfx"),
  "lab_scifi_k": ("Sci-fi Sounds", "Kenney", CC0, "https://opengameart.org/content/sci-fi-sounds"),
  "lab_digital63": ("63 Digital Sound Effects", "Kenney", CC0, "https://opengameart.org/content/63-digital-sound-effects-lasers-phasers-space-etc"),
  "lab_platformer": ("Platformer sounds", "yd", CC0, "https://opengameart.org/content/platformer-sounds-terminal-interaction-door-shots-bang-and-footsteps"),
  "lab_retrocomp": ("Retro computer noise", "OpenGameArt", CC0, "https://opengameart.org/content/retro-computer-noise"),
  "lab_ibeeps": ("Interface beeps", "OpenGameArt", CC0, "https://opengameart.org/content/interface-beeps"),
  "lab_mechclick": ("7 mechanical clicks and buzzes", "OpenGameArt", CC0, "https://opengameart.org/content/7-mechanical-clicks-and-buzzes"),
  "lab_shield": ("Space ship shield sounds", "OpenGameArt", CC0, "https://opengameart.org/content/space-ship-shield-sounds"),
  "lab_energy": ("Seamless energy emission loop", "OpenGameArt", CC0, "https://opengameart.org/content/seamless-energy-emission-loop"),
  "lab_laserburst": ("Laser weapon burst fire", "OpenGameArt", CC0, "https://opengameart.org/content/laser-weapon-burst-fire"),
  "lab_lentikula": ("Sci-Fi Weapon Shots SFX", "Lentikula", CC0, "https://lentikula.itch.io/sci-fi-weapon-shots-sfx-freecc0"),
  "lab_doomsday": ("Doomsday laser cannon", "OpenGameArt", CC0, "https://opengameart.org/content/doomsday-laser-cannon-sound-effect"),
  "lab_danger": ("Space impending danger", "OpenGameArt", CC0, "https://opengameart.org/content/space-impending-danger-sfx"),
  "lab_reload2": ("2 gun reloads", "starninjas", CC0, "https://opengameart.org/content/2-gun-reloads"),
  "lab_robotbird": ("Angry robot bird", "OpenGameArt", CC0, "https://opengameart.org/content/angry-robot-bird"),
  "lab_cyberlaugh": ("Evil cyber laugh", "OpenGameArt", CC0, "https://opengameart.org/content/evil-cyber-laugh"),
  "lab_machoff": ("Machine shutting down", "OpenGameArt", CC0, "https://opengameart.org/content/machine-shutting-down"),
  "lab_rts": ("Sci-fi RTS war unit sounds", "qubodup", CC0, "https://opengameart.org/content/sci-fi-rts-war-unit-sounds"),
  "lab_metalsteps": ("Metal footsteps on concrete", "OpenGameArt", CC0, "https://opengameart.org/content/metal-footsteps-on-concrete"),
  "lab_metalconc": ("Metal footsteps on concrete", "OpenGameArt", CC0, "https://opengameart.org/content/metal-footsteps-on-concrete"),
  "lab_electric": ("Electricity game sound pack", "OpenGameArt", CC0, "https://opengameart.org/content/electricity-game-sound-pack"),
  "lab_breaker": ("Circuit breaker", "OpenGameArt", CC0, "https://opengameart.org/content/sfx-circuit-breaker"),
  "lab_generator": ("Generator loop", "OpenGameArt", CC0, "https://opengameart.org/content/generator-loop"),
  "lab_overload": ("Overloading sound", "jwiese", "CC0 1.0 / CC BY 3.0", "https://opengameart.org/content/overloading-sound"),
  "lab_device": ("Electronic device loop", "qubodup", CC0, "https://opengameart.org/content/electronic-device-loop"),
  "lab_mechanical": ("Mechanical sounds", "OpenGameArt", CC0, "https://opengameart.org/content/mechanical-sounds"),
  "lab_engine2": ("Engine sounds 2", "OpenGameArt", CC0, "https://opengameart.org/content/engine-sounds2"),
  "lab_steam": ("Steam boiler loop", "OpenGameArt", CC0, "https://opengameart.org/content/steam-boiler-sound-loop"),
  "lab_winch": ("Chain winch sounds", "OpenGameArt", CC0, "https://opengameart.org/content/chain-winch-sounds"),
  "lab_eldoor": ("Elevator door", "OpenGameArt", CC0, "https://opengameart.org/content/elevatordoor"),
  "lab_elding": ("Elevator ding", "OpenGameArt", CC0, "https://opengameart.org/content/elevator-ding"),
  "lab_doorset": ("Door open / door close set", "qubodup", CC0, "https://opengameart.org/content/door-open-door-close-set"),
  "lab_irondoor": ("Iron door", "OpenGameArt", CC0, "https://opengameart.org/content/iron-door"),
  "lab_doorlock": ("Door lock sounds", "OpenGameArt", CC0, "https://opengameart.org/content/door-lock-sounds"),
  "lab_doorclose4": ("4 door closes", "starninjas", CC0, "https://opengameart.org/content/4-door-closes"),
  "lab_metalint": ("Metal interactions", "OpenGameArt", CC0, "https://opengameart.org/content/metal-interactions"),
  "lab_metalwood": ("100 CC0 metal and wood SFX", "rubberduck", CC0, "https://opengameart.org/content/100-cc0-metal-and-wood-sfx"),
  "lab_pings": ("31 pings and metal filing sounds", "OpenGameArt", CC0, "https://opengameart.org/content/31-pings-and-metal-filing-sounds"),
  "lab_sfx100": ("100 CC0 SFX", "rubberduck", CC0, "https://opengameart.org/content/100-cc0-sfx"),
  "lab_sfx100b": ("100 CC0 SFX #2", "rubberduck", CC0, "https://opengameart.org/content/100-cc0-sfx-2"),
  "lab_hits37": ("37 hits/punches", "independent.nu", CC0, "https://opengameart.org/content/37-hitspunches"),
  "lab_interface": ("Interface Sounds", "Kenney", CC0, "https://opengameart.org/content/interface-sounds"),
  "lab_clicks16": ("16 button clicks", "independent.nu", CC0, "https://opengameart.org/content/16-button-clicks"),
  "lab_alarm": ("Short alarm", "OpenGameArt", CC0, "https://opengameart.org/content/short-alarm"),
  "lab_drip": ("Dripping water loop", "OpenGameArt", CC0, "https://opengameart.org/content/dripping-water-loop"),
  "lab_darkamb": ("Dark ambiences", "OpenGameArt", CC0, "https://opengameart.org/content/dark-ambiences"),
  "lab_horroramb": ("Ambient horror", "OpenGameArt", CC0, "https://opengameart.org/content/ambient-horror"),
  "lab_heart": ("Heartbeat", "OpenGameArt", CC0, "https://opengameart.org/content/heartbeat-single-sound"),
  "lab_farboom": ("Explosion somewhere far", "OpenGameArt", CC0, "https://opengameart.org/content/explosion-somewhere-far"),
  "lab_creat80": ("80 CC0 creature SFX", "rubberduck", CC0, "https://opengameart.org/content/80-cc0-creature-sfx"),
  "lab_creat80b": ("80 CC0 creature SFX #2", "rubberduck", CC0, "https://opengameart.org/content/80-cc0-creture-sfx-2"),
  "lab_monpack1": ("Monster sound pack", "OpenGameArt", CC0, "https://opengameart.org/content/monster-sound-pack-volume-1"),
  "lab_monfx": ("Monster sound effects pack", "OpenGameArt", CC0, "https://opengameart.org/content/monster-sound-effects-pack"),
  "lab_monfx2": ("Monster sound effects 2", "OpenGameArt", CC0, "https://opengameart.org/content/monster-sound-effects-2"),
  "lab_snarls": ("Monster snarls", "OpenGameArt", CC0, "https://opengameart.org/content/monster-snarls"),
  "lab_growls16": ("16 monster growls", "starninjas", CC0, "https://opengameart.org/content/16-monster-growls"),
  "lab_deeproar": ("Deep monster roar", "OpenGameArt", CC0, "https://opengameart.org/content/cc0-deep-monster-roar"),
  "lab_mutfrog": ("Mutant frog", "OpenGameArt", CC0, "https://opengameart.org/content/mutant-frog"),
  "lab_slimy9": ("Slimy monster sounds", "OpenGameArt", CC0, "https://opengameart.org/content/slimy-monster-or-murder-sounds9"),
  "lab_slime10": ("10 slime/water monster", "starninjas", CC0, "https://opengameart.org/content/10-slimewater-monsterwater"),
  "lab_water40": ("40 CC0 water/splash/slime SFX", "rubberduck", CC0, "https://opengameart.org/content/40-cc0-water-splash-slime-sfx"),
  "lab_squish8": ("8 wet squish/slurp impacts", "independent.nu", CC0, "https://opengameart.org/content/8-wet-squish-slurp-impacts"),
  "lab_alien": ("Alien sounds", "OpenGameArt", CC0, "https://opengameart.org/content/alien-sounds"),
  "lab_pest": ("Small pest alien creature", "OpenGameArt", CC0, "https://opengameart.org/content/small-pest-aliencreature"),
  "lab_rat": ("Squeaky rat", "qubodup", CC0, "https://opengameart.org/content/squeaky-rat"),
  "lab_ghoul": ("Hungry ghoul", "OpenGameArt", CC0, "https://opengameart.org/content/hungry-ghoul"),
  "lab_troll": ("Big scary troll sounds", "OpenGameArt", CC0, "https://opengameart.org/content/big-scary-troll-sounds"),
  "lab_enemy": ("Enemy sounds", "OpenGameArt", CC0, "https://opengameart.org/content/enemy-sounds"),
  "lab_beings7": ("Some kind of beings sounds", "OpenGameArt", CC0, "https://opengameart.org/content/some-kind-of-beings-sounds7"),
  "lab_beast": ("Monster or beast sounds", "OpenGameArt", CC0, "https://opengameart.org/content/monster-or-beast-sounds"),
  "lab_spacesfx": ("Space sound effects", "OpenGameArt", CC0, "https://opengameart.org/content/space-sound-effects"),
  "lab_spaceshoot": ("Space shoot sounds", "OpenGameArt", CC0, "https://opengameart.org/content/space-shoot-sounds"),
  "lab_lasersfx": ("Laser sound effects", "OpenGameArt", CC0, "https://opengameart.org/content/laser-sound-effects"),
  "lab_laserbeam": ("Laser beam", "OpenGameArt", CC0, "https://opengameart.org/content/laser-beam"),
  "lab_warp": ("Warp engine engage", "OpenGameArt", CC0, "https://opengameart.org/content/warp-engine-engage-sound"),
  "lab_sonar": ("Sonar ping", "OpenGameArt", CC0, "https://opengameart.org/content/sonar-ping"),
  "lab_itemkey": ("Item pickup key", "OpenGameArt", CC0, "https://opengameart.org/content/item-pickup-key"),
  "lab_gem": ("Gem collect SFX", "OpenGameArt", CC0, "https://opengameart.org/content/gem-collect-sfx"),
  "lab_assorted7": ("7 assorted sound effects", "OpenGameArt", CC0, "https://opengameart.org/content/7-assorted-sound-effects-menu-level-up"),
  "lab_mini16": ("SFX: The Ultimate 2017 16 bit Mini pack", "OpenGameArt", CC0, "https://opengameart.org/content/sfx-the-ultimate-2017-16-bit-mini-pack"),
  "lab_rpg80": ("80 CC0 RPG SFX", "rubberduck", CC0, "https://opengameart.org/content/80-cc0-rpg-sfx"),
  "lab_secretcoin": ("Secret coin", "OpenGameArt", CC0, "https://opengameart.org/content/secret-coin"),
  "lab_coins8": ("10 8bit coin sounds", "OpenGameArt", CC0, "https://opengameart.org/content/10-8bit-coin-sounds"),
  "lab_blinker": ("Car blinker SFX", "OpenGameArt", CC0, "https://opengameart.org/content/car-blinker-sfx"),
  "lab_pingpong": ("3 ping pong sounds 8-bit", "OpenGameArt", CC0, "https://opengameart.org/content/3-ping-pong-sounds-8-bit-style"),
  "bsb_": ("BigSoundBank", "Joseph Sardin", CC0, "https://bigsoundbank.com"),
  "lab_git_freedoom": ("Freedoom", "Freedoom contributors", "BSD 3-Clause", "https://github.com/freedoom/freedoom"),
  "lab_git_es": ("Endless Sky (только записи в общественном достоянии)", "Endless Sky contributors", "Public domain", "https://github.com/endless-sky/endless-sky"),
  "lab_snowgravel": ("42 snow and gravel footsteps", "Corsica_S", CC0, "https://opengameart.org/content/42-snow-and-gravel-footsteps"),
  "lab_foot0": ("Footsteps", "OpenGameArt", CC0, "https://opengameart.org/content/footsteps-0"),
  "lab_stonesteps": ("Fantozzi's footsteps (grass/sand/stone)", "Fantozzi", CC0, "https://opengameart.org/content/fantozzis-footsteps-grasssand-stone"),
  "lab_snowwalk": ("Walking on snow", "OpenGameArt", CC0, "https://opengameart.org/content/walking-on-snow-sound"),
  "lab_robosteps": ("Robotic mechanic step sounds", "Lee Barkovich (via qubodup)", "CC BY 3.0", "https://opengameart.org/content/robotic-mechanic-step-sounds"),
  "lab_emfields": ("EM Fields Pack 1", "dklon", "CC BY 3.0", "https://opengameart.org/content/em-fields-pack-1"),
  "lab_comp9": ("9 sci-fi computer sounds and beeps", "Michel Baradari (via qubodup)", "CC BY 3.0", "https://opengameart.org/content/9-sci-fi-computer-sounds-and-beeps"),
  "lab_horrorlib": ("Horror Sound Effects Library", "Little Robot Sound Factory", "CC BY 3.0", "https://opengameart.org/content/horror-sound-effects-library"),
  "lab_ambpack": ("Ambience Pack 1: Sci-Fi Horror", "OpenGameArt", CC0, "https://opengameart.org/content/ambience-pack-1-sci-fi-horror"),
  "lab_horratm": ("Post Apocalyptic Wastelands", "Juhani Junkala", CC0, "https://opengameart.org/content/horror-atmosphere"),
  "lab_factory": ("Factory ambiance", "OpenGameArt", CC0, "https://opengameart.org/content/factory-ambiance"),
  "lab_elevreactor": ("Elevator to reactor", "OpenGameArt", CC0, "https://opengameart.org/content/elevator-to-reactor-loop"),
  "lab_heartmach": ("Heart of Machine", "Alexandr Zhelanov", "CC BY 3.0", "https://opengameart.org/content/heart-of-machine"),
  "lab_bleakterm": ("Bleak Terminal", "ruskerdax", CC0, "https://opengameart.org/content/bleak-terminal"),
  "lab_ghostsmach": ("Ghosts in the Machine", "ruskerdax", CC0, "https://opengameart.org/content/ghosts-in-the-machine"),
  "lab_creep": ("The Creep", "ruskerdax", CC0, "https://opengameart.org/content/the-creep"),
  "lab_menacing": ("Menacing Otherworld", "ruskerdax", CC0, "https://opengameart.org/content/menacing-otherworld"),
  "lab_desolate": ("Desolate", "Matthew Pablo", "CC BY 3.0", "https://opengameart.org/content/desolate"),
  "lab_searching": ("Searching", "OpenGameArt", CC0, "https://opengameart.org/content/searching"),
  "lab_insistent": ("Insistent", "OpenGameArt", CC0, "https://opengameart.org/content/insistent-background-loop"),
  "lab_werelost": ("We're lost", "OpenGameArt", CC0, "https://opengameart.org/content/were-lost"),
  "lab_lethal": ("Lethal Injection", "Marcelo Fernandez", "CC BY 3.0", "https://opengameart.org/content/lethal-injection"),
  "lab_shadows": ("Shadows Awaken Within", "OpenGameArt", CC0, "https://opengameart.org/content/shadows-awaken-within"),
  "lab_silent": ("The World Fell Silent", "OpenGameArt", CC0, "https://opengameart.org/content/the-world-fell-silent"),
  "lab_bleeding": ("Bleeding Out", "OpenGameArt", CC0, "https://opengameart.org/content/bleeding-out"),
  "lab_tomb": ("Forgotten tomb ambience", "OpenGameArt", CC0, "https://opengameart.org/content/forgoten-tomb-ambience"),
  "lab_torment": ("Realm of Torment", "OpenGameArt", CC0, "https://opengameart.org/content/realm-of-torment"),
  "lab_emptycity": ("Empty City", "OpenGameArt", CC0, "https://opengameart.org/content/emptycity-background-music"),
  "lab_ghostvoice": ("Ghost monster voice", "qubodup", CC0, "https://opengameart.org/content/ghost-monster-voice-moaning-growling"),
  "lab_bitvoice": ("Bitcrushed voice one-shots", "DavidW", "CC BY 3.0", "https://opengameart.org/content/bitcrushed-voice-one-shots"),
  "lab_atmoint": ("Atmospheric interaction sound pack", "OpenGameArt", CC0, "https://opengameart.org/content/atmospheric-interaction-sound-pack"),
  "lab_elevding": ("Elevator ding", "OpenGameArt", CC0, "https://opengameart.org/content/elevator-ding"),
  "lab_kimpact": ("Impact Sounds", "Kenney", CC0, "https://kenney.nl/assets/impact-sounds"),
}
# Записи Endless Sky под CC BY-SA и CC BY — не берём.
ES_BAN = ["heavy rocket hit", "meteor", "explosion huge", "thrasher", "point defense", "bounce", "clink", "fusion torch", "optical laser",
          "speckle", "atomic", "moonbeam", "ionic blast", "bimodal", "drag cannon", "overcharged pulse laser", "successor pulse laser",
          "asteroid crunch large", "hion", "archonteleport"]

def pack_of(path):
    rel = path
    for k, root in ROOTS.items():
        if path.startswith(root):
            rel = os.path.relpath(path, root)
    top = rel.split(os.sep)[0]
    best = None
    for k in PACKS:
        if top.startswith(k) and (best is None or len(k) > len(best)):
            best = k
    return best, rel

# ── поиск исходников ──
def find(R, pack, pat):
    root = ROOTS[R]
    out = []
    for d in sorted(glob.glob(os.path.join(root, pack))):
        if os.path.isfile(d):
            if fnmatch.fnmatch(os.path.basename(d).lower(), pat.lower()): out.append(d)
            continue
        for dp, dn, fn in os.walk(d):
            for f in fn:
                if fnmatch.fnmatch(f.lower(), pat.lower()):
                    out.append(os.path.join(dp, f))
    # без потерь лучше: если рядом есть .flac с тем же именем — берём его
    stems = {}
    for p in out:
        st = os.path.splitext(p)[0].replace("/Ogg/", "/").replace("/Wav/", "/")
        ext = os.path.splitext(p)[1].lower()
        rank = {".flac": 0, ".wav": 1, ".ogg": 2, ".mp3": 3}.get(ext, 4)
        if st not in stems or rank < stems[st][0]:
            stems[st] = (rank, p)
    res = sorted(v[1] for v in stems.values())
    res = [p for p in res if not any(b in os.path.basename(p).lower() for b in ES_BAN) or "lab_git_es" not in p]
    return res

def S(R, pack, pat, **o):
    return ("src", R, pack, pat, o)

# ── обработка звука ──
def decode(path, start=0.0, dur=None, ch=1, af=None):
    cmd = ["ffmpeg", "-nostdin", "-loglevel", "error"]
    if start: cmd += ["-ss", str(start)]
    if dur: cmd += ["-t", str(dur)]
    cmd += ["-i", path]
    if af: cmd += ["-af", af]
    cmd += ["-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).copy()
    if ch == 2: a = a.reshape(-1, 2)
    return a

def db(x): return 20 * np.log10(max(1e-9, x))
def peak(a): return float(np.max(np.abs(a))) if a.size else 0.0
def rms_active(a):
    m = a if a.ndim == 1 else a.mean(axis=1)
    if not m.size: return 1e-9
    fr = 1024
    n = max(1, len(m) // fr)
    fr_rms = np.sqrt(np.mean(m[: n * fr].reshape(n, fr) ** 2, axis=1)) if len(m) >= fr else np.array([np.sqrt(np.mean(m ** 2))])
    top = np.max(fr_rms) if fr_rms.size else 0
    act = fr_rms[fr_rms > top * 0.1]
    return float(np.sqrt(np.mean(act ** 2))) if act.size else 1e-9

def trim(a, thr_db=-45.0, keep_tail=0.03):
    m = np.abs(a if a.ndim == 1 else a.max(axis=1))
    p = m.max() if m.size else 0
    if p <= 0: return a
    thr = p * 10 ** (thr_db / 20)
    idx = np.where(m > thr)[0]
    if not idx.size: return a
    s = max(0, idx[0] - int(0.004 * SR))
    e = min(len(m), idx[-1] + int(keep_tail * SR))
    return a[s:e]

def fade(a, fin=0.003, fout=0.03):
    n = len(a)
    fi, fo = min(n // 2, int(fin * SR)), min(n // 2, int(fout * SR))
    env = np.ones(n, dtype=np.float32)
    if fi > 0: env[:fi] = np.linspace(0, 1, fi)
    if fo > 0: env[-fo:] = np.linspace(1, 0, fo) ** 1.5
    return a * (env if a.ndim == 1 else env[:, None])

def cap(a, mx, fo=0.12):
    if mx and len(a) > mx * SR:
        a = a[: int(mx * SR)]
        a = fade(a, 0.003, fo)
    return a

def loudnorm(a, target_db, peak_db=-2.0):
    r = rms_active(a)
    g = 10 ** (target_db / 20) / max(r, 1e-6)
    a = a * g
    p = peak(a)
    lim = 10 ** (peak_db / 20)
    if p > lim:
        # мягкий ограничитель: громкие пики сжимаем, остальное не трогаем
        a = np.tanh(a / lim * 1.2) / np.tanh(1.2) * lim
    return a.astype(np.float32)

def loopify(a, xf):
    n = int(xf * SR)
    if len(a) <= 2 * n: return a
    head, tail = a[:n], a[-n:]
    t = np.linspace(0, 1, n, dtype=np.float32)
    if a.ndim == 2: t = t[:, None]
    mixed = head * np.sqrt(t) + tail * np.sqrt(1 - t)
    return np.concatenate([mixed, a[n:-n]])

def onsets(a, need, min_gap=0.22, length=0.38):
    m = np.abs(a if a.ndim == 1 else a.mean(axis=1))
    w = int(0.008 * SR)
    env = np.convolve(m, np.ones(w) / w, mode="same")
    thr = np.percentile(env, 92)
    out, last = [], -1e9
    i = 0
    step = int(0.002 * SR)
    while i < len(env):
        if env[i] > thr and i - last > min_gap * SR:
            out.append(i); last = i
        i += step
    if len(out) > need:
        pick = np.linspace(0, len(out) - 1, need).astype(int)
        out = [out[k] for k in pick]
    res = []
    for s in out:
        s0 = max(0, s - int(0.012 * SR))
        seg = a[s0: s0 + int(length * SR)]
        res.append(fade(seg, 0.002, 0.08))
    return res

def encode(a, path, q):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    ch = 1 if a.ndim == 1 else 2
    cmd = ["ffmpeg", "-nostdin", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-i", "-",
           "-c:a", "libvorbis", "-q:a", str(q), path]
    subprocess.run(cmd, input=a.astype(np.float32).tobytes(), check=True)

# ── что собирать ──
# kind: sfx (короткий звук), step, bcn (маяк), ui, loop (петля), music (дорожка для потока)
TARGET = {"sfx": -16.0, "step": -21.0, "bcn": -19.0, "ui": -20.0, "loop": -22.0, "music": -18.0, "voice": -16.0}
DEF_MAX = {"sfx": 2.6, "step": 0.45, "bcn": 0.6, "ui": 0.9, "loop": None, "music": None, "voice": 2.0}
SPEC = {}
def E(id_, kind, srcs, v=1.0, bus=None, n=None, mx=None, **o):
    SPEC[id_] = dict(kind=kind, srcs=srcs, v=v, bus=bus, n=n, mx=mx, o=o)

A, B, C = "A", "B", "C"
# ═════ ИНТЕРФЕЙС ═════
E("ui_click", "ui", [S(A, "lab_interface*", "click_001.ogg"), S(A, "lab_interface*", "select_00[12].ogg")], v=0.7, bus="ui")
E("ui_move", "ui", [S(A, "lab_interface*", "select_00[78].ogg"), S(A, "lab_interface*", "tick_004.ogg")], v=0.55, bus="ui")
E("ui_open", "ui", [S(A, "lab_interface*", "open_00[12].ogg"), S(A, "lab_interface*", "maximize_002.ogg")], v=0.7, bus="ui")
E("ui_close", "ui", [S(A, "lab_interface*", "close_00[12].ogg"), S(A, "lab_interface*", "minimize_002.ogg")], v=0.7, bus="ui")
E("ui_ok", "ui", [S(A, "lab_interface*", "confirmation_00[13].ogg")], v=0.8, bus="ui")
E("ui_error", "ui", [S(A, "lab_interface*", "error_00[46].ogg")], v=0.8, bus="ui")
E("ui_levelup", "ui", [S(B, "lab_assorted7*", "Level Up.mp3")], v=0.8, bus="ui", mx=3.5)
E("near_tick", "ui", [S(A, "lab_interface*", "tick_002.ogg"), S(A, "lab_interface*", "pluck_002.ogg")], v=0.45, bus="ui")
E("nav_ping", "gen", "sonar", v=0.9, bus="ui")

# ═════ ШАГИ: у каждого уровня свой пол ═════
E("step_tile", "step", [S(C, "lab_stonesteps*", "Fantozzi-Stone*.flac", af="highpass=f=180,treble=g=3")], n=6)
E("step_carpet", "step", [S(C, "lab_kimpact", "footstep_carpet_*.ogg")], n=5)
E("step_water", "step", [S(A, "lab_sfx100b*", "*footstep_wet_*.ogg"), S(A, "lab_water40*", "splash_1[05].ogg"), S(A, "lab_water40*", "splash_09.ogg")], n=6, mx=0.55)
E("step_vinyl", "step", [S(C, "lab_foot0*", "0[1-6]-footstep*.ogg", af="highpass=f=150,equalizer=f=2600:t=q:w=1.2:g=4")], n=6)
E("step_metal", "step", [S(A, "lab_metalsteps*", "metal_steps_0[1-9].flac"), S(A, "lab_metalsteps*", "metal_steps_1[0-2].flac")], n=10)
E("step_grate", "step", [S(A, "lab_platformer*", "steps_*.ogg"), S(A, "lab_metalsteps*", "metal_steps_2[0-5].flac", af="asetrate=44100*0.82,aresample=44100,equalizer=f=900:t=q:w=2:g=6")], n=8, mx=0.5)
E("step_ice", "step", [S(C, "lab_kimpact", "footstep_snow_*.ogg"), S(C, "lab_snowwalk*", "SnowWalk*.ogg"), S(C, "lab_snowgravel*", "*gravel_and_ice_0[1-4].flac")], n=10, mx=0.5)
E("step_concrete", "step", [S(C, "lab_kimpact", "footstep_concrete_*.ogg"), ("slice", S(B, "bsb_lab_stepconcrete", "1318*"), 6)], n=11)
E("step_gravel", "step", [S(C, "lab_snowgravel*", "*snow_covered_gravel_0[1-8].flac"), S(C, "lab_stonesteps*", "Fantozzi-Sand*.flac")], n=12, mx=0.55)
E("step_flesh", "step", [S(A, "lab_water40*", "slime_0[1-8].ogg"), S(A, "lab_slime10*", "slime.[16].ogg")], n=10, mx=0.45, v=0.9)
E("door_threshold", "step", [S(A, "lab_metalsteps*", "metal_steps_1[3-6].flac", af="asetrate=44100*0.7,aresample=44100")], n=3, v=0.6)

# ═════ СТЕНЫ И СТОЛКНОВЕНИЯ ═════
E("bump_wall", "sfx", [S(C, "lab_kimpact", "impactMetal_heavy_*.ogg"), S(A, "lab_metalwood*", "metal_hit_0[1-5].ogg"), S(C, "lab_kimpact", "impactPlate_heavy_00[0-2].ogg")], n=10, mx=0.8, v=0.95)
E("bump_body", "sfx", [S(C, "lab_kimpact", "impactPunch_medium_*.ogg")], n=4, v=0.8)
E("bump_furniture", "sfx", [S(C, "lab_kimpact", "impactPlank_medium_*.ogg"), S(C, "lab_kimpact", "impactTin_medium_*.ogg")], n=6, v=0.75)
E("bump_device", "sfx", [S(C, "lab_kimpact", "impactPlate_light_*.ogg"), S(C, "lab_kimpact", "impactGlass_light_00[0-1].ogg")], n=5, v=0.75)
E("door_knock", "sfx", [S(C, "lab_kimpact", "impactMetal_medium_*.ogg")], n=4, v=0.8)

# ═════ ДВЕРИ, ЗАМКИ, ШЛЮЗЫ ═════
E("door_auto_open", "sfx", [S(A, "lab_scifi_k*", "doorOpen_00*.ogg")], n=3)
E("door_auto_close", "sfx", [S(A, "lab_scifi_k*", "doorClose_00*.ogg")], n=3)
E("door_hatch_open", "sfx", [S(A, "lab_git_freedoom", "dsdoropn.flac"), S(A, "lab_sfx100b*", "*door_0[13].ogg")], n=3, mx=1.8)
E("door_hatch_close", "sfx", [S(A, "lab_git_freedoom", "dsdorcls.flac"), S(A, "lab_sfx100_*", "door_close_0[12].ogg")], n=3, mx=1.8)
E("door_heavy_open", "sfx", [S(A, "lab_git_freedoom", "dsbdopn.flac"), S(B, "bsb_lab_door_auto", "1803*", start=0.4, dur=3.2)], n=2, mx=3.2)
E("door_heavy_close", "sfx", [S(A, "lab_git_freedoom", "dsbdcls.flac"), S(A, "lab_irondoor*", "*.ogg"), S(B, "bsb_lab_door_auto", "1804*", start=0.3, dur=3.0)], n=3, mx=3.0)
E("door_secret_open", "sfx", [S(A, "lab_metalwood*", "metal_open_01.ogg"), S(A, "lab_winch*", "*Marker #2.flac")], n=2, mx=2.0)
E("door_secret_close", "sfx", [S(A, "lab_metalwood*", "metal_close_01.ogg")], n=1)
E("door_locked", "sfx", [S(A, "lab_doorlock*", "LockedDoorHandleJiggle.flac"), S(A, "lab_metalint*", "metal_interaction2.flac")], n=2, v=0.85)
E("door_unlock", "sfx", [S(A, "lab_doorlock*", "UnlockDoor.flac"), S(A, "lab_metalwood*", "lock_open_01.ogg")], n=2)
E("card_ok", "sfx", [S(A, "lab_digital63*", "highUp.mp3"), S(A, "lab_scifi50*", "terminal_05.ogg")], n=2, v=0.8)
E("card_fail", "sfx", [S(A, "lab_digital63*", "lowDown.mp3"), S(A, "lab_mechclick*", "buzzerr-01.flac")], n=2, v=0.8)
E("keypad", "sfx", [S(A, "lab_mechclick*", "mechanical_button-01.flac"), S(A, "lab_clicks16*", "button0[1-3]*")], n=4, v=0.6, mx=0.4)
E("code_ok", "sfx", [S(A, "lab_digital63*", "threeTone1.mp3")], v=0.8)
E("code_fail", "sfx", [S(A, "lab_digital63*", "lowThreeTone.mp3")], v=0.8)
E("secret_open", "sfx", [S(A, "lab_winch*", "*Marker #3.flac"), S(A, "lab_metalwood*", "metal_open_01.ogg")], n=2, mx=2.2)
E("rubble_hit", "sfx", [S(A, "lab_sfx100b*", "*stones_0[1-3].ogg"), S(C, "lab_kimpact", "impactMining_00[0-2].ogg")], n=5)
E("draft", "sfx", [S(A, "lab_sfx100b*", "*air_0[12].ogg")], n=2, mx=2.5, v=0.7)
E("gate_card", "sfx", [S(A, "lab_digital63*", "zapThreeToneUp.mp3")], v=0.85)
E("gate_open", "sfx", [S(B, "bsb_lab_door_auto", "1803*", start=0.2, dur=5.5), S(C, "lab_horrorlib*", "Gate_Open_00.mp3")], n=2, mx=5.5, v=1.0)
E("gate_ride", "sfx", [S(B, "bsb_lab_elevator", "1712*", start=4.0, dur=6.0)], mx=6.0, v=0.9)
E("gate_seal", "mix", [(S(B, "bsb_lab_door_auto", "1804*", start=20.5, dur=5.5), 0.0, 1.0), (S(C, "lab_kimpact", "impactBell_heavy_001.ogg", af="asetrate=44100*0.6,aresample=44100"), 0.9, 0.9), (S(A, "lab_git_freedoom", "dsbdcls.flac"), 0.6, 0.8), (S(A, "lab_git_es", "explosion large.flac", af="lowpass=f=500"), 1.0, 0.7)], v=1.0)
E("gate_hum", "sfx", [S(A, "lab_scifi_k*", "spaceEngineLow_000.ogg")], mx=3.0, v=0.8)
E("gate_knock", "sfx", [S(C, "lab_kimpact", "impactMetal_heavy_00[13].ogg", af="asetrate=44100*0.7,aresample=44100")], n=2)
E("elev_call", "sfx", [S(A, "lab_metalint*", "metal_button_press1.flac")])
E("elev_ding", "sfx", [S(A, "lab_elding*", "*.ogg")])
E("elev_ride", "sfx", [S(B, "bsb_lab_elevator", "1711*", start=2.0, dur=5.0)], mx=5.0, v=0.85)
E("stairs_down", "seq", [S(A, "lab_metalsteps*", "metal_steps_0[2-9].flac")], gap=0.34, count=7, rate_from=1.0, rate_to=0.9, v=0.9)
E("stairs_up", "seq", [S(A, "lab_metalsteps*", "metal_steps_1[0-7].flac")], gap=0.38, count=7, rate_from=0.92, rate_to=1.02, v=0.9)
E("capsule_close", "sfx", [S(A, "lab_sfx100_*", "microwave_door_close.ogg")])
E("capsule_hum", "sfx", [S(A, "lab_scifi_k*", "computerNoise_002.ogg")], mx=3.0, v=0.6)

# ═════ ТЕРМИНАЛЫ, УСТАНОВКИ, МАСТЕРСКАЯ ═════
E("term_on", "sfx", [S(A, "lab_scifi50*", "terminal_0[1-3].ogg"), S(C, "lab_comp9*", "itempick1.flac")], n=4, v=0.8)
E("term_off", "sfx", [S(A, "lab_scifi50*", "terminal_04.ogg"), S(C, "lab_comp9*", "itemback.flac")], n=2, v=0.8)
E("term_beep", "sfx", [S(A, "lab_scifi50*", "terminal_0[6-9].ogg")], n=4, v=0.7)
E("term_ok", "sfx", [S(A, "lab_digital63*", "powerUp[24].mp3")], n=2, v=0.8)
E("term_err", "sfx", [S(A, "lab_scifi50*", "retro_beep_06.ogg"), S(C, "lab_comp9*", "acid6.flac")], n=2, v=0.8)
E("vend", "sfx", [S(A, "lab_sfx100_*", "machine_0[1-3].ogg")], n=3)
E("buy", "sfx", [S(B, "lab_rpg80*", "item_coins_0[1-3].ogg")], n=3, v=0.8)
E("workbench", "sfx", [S(A, "lab_metalwood*", "tools_0[1-4].ogg")], n=4)
E("craft", "seq", [S(A, "lab_metalwood*", "tools_*.ogg")], gap=0.42, count=4, v=0.9)
E("craft_armor", "seq", [S(A, "lab_metalwood*", "hammer_0[1-4].ogg"), S(A, "lab_metalwood*", "metal_sheet_0[1-3].ogg")], gap=0.36, count=6, v=0.9)
E("craft_off", "sfx", [S(A, "lab_metalwood*", "tools_07.ogg")])
E("heal", "sfx", [S(A, "lab_digital63*", "powerUp3.mp3")], v=0.8)
E("inject", "sfx", [S(A, "lab_sfx100b*", "*air_03.ogg")], v=0.9)
E("paper", "sfx", [S(A, "lab_sfx100_*", "paper_0[1-4].ogg")], n=4)
E("pry", "sfx", [S(A, "lab_metalwood*", "tools_04.ogg"), S(A, "lab_metalwood*", "metal_spring_01.ogg")], n=2)
E("open_crate", "sfx", [S(A, "lab_sfx100_*", "wooded_box_open.ogg"), S(B, "lab_rpg80*", "item_wood_01.ogg")], n=2)
E("open_locker", "sfx", [S(A, "lab_metalwood*", "metal_open_01.ogg"), S(A, "lab_sfx100_*", "door_close_04.ogg")], n=2, mx=1.4)
E("open_safe", "sfx", [S(A, "lab_doorlock*", "UnlockDoor.flac"), S(A, "lab_metalwood*", "lock_open_01.ogg")], n=2)
E("open_desk", "sfx", [S(A, "lab_sfx100b*", "*wood_0[1-3].ogg")], n=3)
E("search_body", "sfx", [S(B, "lab_rpg80*", "item_misc_0[1-3].ogg"), S(A, "lab_sfx100_*", "paper_02.ogg")], n=3)
E("mag_hum_short", "sfx", [S(C, "lab_atmoint*", "magnet_on.flac"), S(C, "lab_emfields*", "EM Fields 01.flac", start=2, dur=2.5)], n=3, mx=2.5)
E("mag_on", "sfx", [S(C, "lab_atmoint*", "magnet_start.flac")], n=2, mx=2.5)
E("mag_overload", "sfx", [S(A, "lab_overload*", "overloading.flac")], mx=4.0)
E("power_on", "sfx", [S(A, "lab_breaker*", "switch on.flac"), S(B, "bsb_lab_electric", "1092*", start=0.0, dur=2.0)], n=2, mx=2.0)
E("pos_hum_short", "sfx", [S(C, "lab_atmoint*", "anchor_action.flac")], n=2, mx=2.4)
E("pos_ok", "sfx", [S(A, "lab_digital63*", "zapTwoTone.mp3")])
E("pos_fail", "sfx", [S(A, "lab_electric_death_1*", "*.flac")], mx=1.8)
E("pos_pulse", "sfx", [S(A, "lab_git_es", "harmonic jump.flac")], mx=3.5)
E("reactor_hum_short", "sfx", [S(A, "lab_scifi_k*", "spaceEngineLarge_000.ogg")], mx=3.0)
E("scan", "sfx", [S(A, "lab_git_es", "scan~.flac")], mx=1.4)
E("scan_soft", "sfx", [S(A, "lab_digital63*", "phaserUp1.mp3")], v=0.6)
E("radio", "sfx", [S(A, "lab_git_freedoom", "dsradio.flac"), S(B, "bsb_lab_radio", "2618*", start=1.0, dur=1.6)], n=2)
E("alarm_short", "sfx", [S(A, "lab_alarm_*", "*.ogg")])
E("jam", "sfx", [S(A, "lab_digital63*", "spaceTrash1.mp3")], mx=1.4)
E("tk_pull", "sfx", [S(A, "lab_digital63*", "phaserDown1.mp3")])
E("cloak_off", "sfx", [S(A, "lab_digital63*", "phaseJump3.mp3")])
E("shield_hit", "sfx", [S(A, "lab_shield*", "*- 2.flac"), S(A, "lab_shield*", "*- 6.flac")], n=2, mx=1.0)
E("shield_full", "sfx", [S(A, "lab_shield*", "*- 5.flac")], mx=1.0, v=0.6)
E("deflect", "sfx", [S(A, "lab_shield*", "*- 3.flac")], mx=0.9)
E("armor_on", "sfx", [S(B, "lab_rpg80*", "chain_0[12].ogg"), S(B, "lab_rpg80*", "metal_02.ogg")], n=3)
E("armor_off", "sfx", [S(B, "lab_rpg80*", "chain_03.ogg")], mx=0.9)
E("poisoned", "sfx", [S(A, "lab_creat80_*", "cough_0[1-3].ogg")], n=3)
E("poison_tick", "sfx", [S(C, "lab_horrorlib*", "Breath_Scared_0[1-4].mp3")], n=4, v=0.5, mx=1.2)
E("web_hit", "sfx", [S(A, "lab_slime10*", "slime.[23].ogg")], n=2)
E("web_stuck", "sfx", [S(A, "lab_water40*", "slime_09.ogg")])
E("implant_scan", "sfx", [S(A, "lab_git_es", "scan~.flac")], mx=1.4)
E("implant_regen", "sfx", [S(A, "lab_digital63*", "powerUp1.mp3")])
E("implant_empulse", "sfx", [S(A, "lab_electric_deathboom*", "*.flac")], mx=2.5)
E("implant_shield", "sfx", [S(A, "lab_shield*", "*- 1.flac")], mx=1.6)
E("implant_haste", "sfx", [S(A, "lab_digital63*", "phaserUp3.mp3")])
E("implant_thermal", "sfx", [S(A, "lab_git_es", "flamethrower~.flac")], mx=1.4)
E("implant_cloak", "sfx", [S(A, "lab_digital63*", "phaseJump1.mp3")])
E("implant_echo", "gen", "sonar_wide", v=0.9)
E("implant_tk", "sfx", [S(A, "lab_digital63*", "phaserDown3.mp3")])
E("implant_freeze", "sfx", [S(A, "lab_git_es", "stagnation beam~.flac")], mx=1.6)
E("implant_pbolt", "sfx", [S(A, "lab_git_es", "neutron bolt.flac")], mx=1.6)
E("paper_turn", "sfx", [S(A, "lab_sfx100_*", "paper_0[34].ogg")], n=2)

# ═════ ПОДОБРАТЬ: у каждого рода вещей свой звук ═════
E("pick_med", "ui", [S(B, "lab_assorted7*", "Item Pickup.mp3")], bus="ui")
E("pick_stim", "ui", [S(A, "lab_sfx100_*", "glass_02.ogg")], bus="ui")
E("pick_bat", "ui", [S(A, "lab_digital63*", "powerUp[45].mp3")], n=2, bus="ui")
E("pick_mag", "ui", [S(A, "lab_digital63*", "phaserUp[56].mp3")], n=2, bus="ui")
E("pick_pos", "ui", [S(A, "lab_git_es", "proton.flac")], bus="ui")
E("pick_gren", "ui", [S(B, "lab_rpg80*", "metal_03.ogg")], bus="ui")
E("pick_plate", "ui", [S(B, "lab_rpg80*", "metal_01.ogg")], bus="ui")
E("pick_part", "ui", [S(B, "lab_rpg80*", "item_misc_0[4-6].ogg")], n=3, bus="ui")
E("pick_cr", "ui", [S(B, "lab_coins8*", "coin[1-4].flac")], n=4, bus="ui")
E("pick_weapon", "ui", [S(A, "lab_git_freedoom", "dswpnup.flac"), S(B, "bsb_lab_gun", "1987*")], n=2, bus="ui")
E("pick_armor", "ui", [S(B, "lab_rpg80*", "chain_0[12].ogg")], n=2, bus="ui")
E("pick_pass", "ui", [S(B, "lab_itemkey*", "*key*")], bus="ui")
E("pick_liftpass", "ui", [S(A, "lab_elding*", "*.ogg")], bus="ui")
E("pick_gatecard", "ui", [S(B, "lab_secretcoin*", "odd_coin.flac")], bus="ui", mx=2.0, v=1.0)
E("pick_corekey", "ui", [S(B, "lab_gem*", "gem-gather-stereo-reverb.flac")], bus="ui", mx=1.6)
E("pick_key", "ui", [S(A, "lab_metalwood*", "keys_0[1-3].ogg")], n=3, bus="ui")
E("pick_note", "ui", [S(A, "lab_sfx100_*", "paper_01.ogg")], bus="ui")
E("pick_sample", "ui", [S(A, "lab_water40*", "bubble_0[13].ogg")], n=2, bus="ui")
E("pick_chip", "ui", [S(A, "lab_scifi50*", "retro_beep_01.ogg")], bus="ui")
E("pick_decoder", "ui", [S(A, "lab_scifi50*", "terminal_02.ogg")], bus="ui")

# ═════ МАЯКИ ═════
E("bcn_med", "bcn", [S(A, "lab_ibeeps*", "beep-02.flac")], mx=0.35, bus="beacon")
E("bcn_stim", "bcn", [S(A, "lab_interface*", "glass_002.ogg")], bus="beacon")
E("bcn_bat", "bcn", [S(A, "lab_digital63*", "pepSound1.mp3")], bus="beacon")
E("bcn_mag", "bcn", [S(A, "lab_digital63*", "phaserUp7.mp3")], bus="beacon")
E("bcn_pos", "bcn", [S(A, "lab_digital63*", "phaseJump2.mp3")], bus="beacon")
E("bcn_gren", "bcn", [S(B, "lab_pingpong*", "*beeep*")], bus="beacon")
E("bcn_plate", "bcn", [S(A, "lab_interface*", "bong_001.ogg")], bus="beacon")
E("bcn_part", "bcn", [S(A, "lab_interface*", "pluck_001.ogg")], bus="beacon")
E("bcn_cr", "bcn", [S(B, "lab_coins8*", "coin6.flac")], bus="beacon")
E("bcn_weapon", "bcn", [S(B, "lab_rpg80*", "blade_01.ogg")], bus="beacon")
E("bcn_armor", "bcn", [S(B, "lab_rpg80*", "chain_01.ogg")], mx=0.35, bus="beacon")
E("bcn_pass", "bcn", [S(A, "lab_interface*", "question_002.ogg")], bus="beacon")
E("bcn_liftpass", "bcn", [S(A, "lab_interface*", "maximize_003.ogg")], bus="beacon")
E("bcn_gatecard", "bcn", [S(B, "lab_gem*", "gem-gather-orig.flac")], v=1.15, bus="beacon")
E("bcn_corekey", "bcn", [S(B, "lab_secretcoin*", "odd_coin.flac")], mx=0.7, bus="beacon")
E("bcn_key", "bcn", [S(A, "lab_metalwood*", "keys_04.ogg")], mx=0.38, bus="beacon")
E("bcn_note", "bcn", [S(A, "lab_sfx100_*", "paper_02.ogg")], mx=0.3, bus="beacon")
E("bcn_sample", "bcn", [S(A, "lab_water40*", "bubble_02.ogg")], bus="beacon")
E("bcn_chip", "bcn", [S(A, "lab_scifi50*", "retro_beep_02.ogg")], bus="beacon")
E("bcn_decoder", "bcn", [S(A, "lab_scifi50*", "terminal_07.ogg")], bus="beacon")
E("bcn_stairs", "bcn", [S(A, "lab_sfx100b*", "*air_02.ogg")], mx=1.1, bus="beacon", v=0.9)
E("bcn_stairs_up", "bcn", [S(A, "lab_sfx100b*", "*air_02.ogg", af="asetrate=44100*1.25,aresample=44100")], mx=0.9, bus="beacon", v=0.8)
E("bcn_elevator", "bcn", [S(A, "lab_scifi_k*", "engineCircular_000.ogg")], mx=0.9, bus="beacon")
E("bcn_gate", "bcn", [S(A, "lab_scifi_k*", "spaceEngineLow_001.ogg")], mx=1.3, bus="beacon", v=1.1)
E("bcn_reactor", "bcn", [S(A, "lab_scifi_k*", "spaceEngineLarge_002.ogg")], mx=1.4, bus="beacon", v=1.1)
E("bcn_terminal", "bcn", [S(A, "lab_scifi50*", "terminal_03.ogg")], bus="beacon")
E("bcn_magnetron", "bcn", [S(C, "lab_emfields*", "EM Fields 03.flac", start=4, dur=0.9)], bus="beacon")
E("bcn_positron", "bcn", [S(A, "lab_git_es", "particle.flac")], mx=0.6, bus="beacon")
E("bcn_capsule", "bcn", [S(A, "lab_scifi_k*", "forceField_000.ogg")], mx=0.7, bus="beacon", v=0.8)
E("bcn_vending", "bcn", [S(A, "lab_sfx100_*", "machine_02.ogg")], bus="beacon")
E("bcn_workbench", "bcn", [S(A, "lab_metalwood*", "tools_09.ogg")], bus="beacon")
E("bcn_medst", "bcn", [S(A, "lab_ibeeps*", "beep-09.flac")], mx=0.35, bus="beacon")
E("bcn_charger", "bcn", [S(B, "bsb_lab_neon", "2143*")], bus="beacon")
E("bcn_implantlab", "bcn", [S(A, "lab_digital63*", "twoTone2.mp3")], mx=0.7, bus="beacon")
E("bcn_hq", "bcn", [S(A, "lab_git_freedoom", "dsradio.flac")], bus="beacon")
E("bcn_safe", "bcn", [S(A, "lab_sfx100_*", "key_open_02.ogg")], bus="beacon")
E("bcn_robot_npc", "bcn", [S(B, "bsb_lab_robot", "1981*")], bus="beacon")
E("bcn_survivor", "bcn", [S(A, "lab_creat80_*", "cough_02.ogg")], bus="beacon")
E("bcn_default", "bcn", [S(A, "lab_interface*", "tick_001.ogg")], bus="beacon")

# ═════ ОРУЖИЕ ГЕРОЯ ═════
E("w_melee", "sfx", [S(A, "lab_metalint*", "metal_swing1.flac"), S(B, "lab_rpg80*", "blade_0[23].ogg")], n=3)
E("w_shock", "sfx", [S(A, "lab_electric_groundhit*", "*.flac"), S(B, "bsb_lab_electric", "3442*")], n=2)
E("w_vibro", "sfx", [S(A, "lab_git_es", "slicer~.flac")], mx=0.7)
E("w_cutter", "sfx", [S(A, "lab_git_es", "mining laser~.flac")], mx=0.7)
E("w_blaster_s", "sfx", [S(A, "lab_git_es", "blaster.flac"), S(B, "bsb_lab_laser", "17[56]*")], n=3)
E("w_blaster_p", "sfx", [S(A, "lab_git_es", "pulse.flac"), S(A, "lab_git_es", "mod blaster.flac")], n=2)
E("w_blaster_h", "sfx", [S(A, "lab_git_es", "heavy blaster.flac"), S(B, "bsb_lab_laser", "1761*")], n=2)
E("w_laser", "sfx", [S(A, "lab_lentikula", "Laser Rifle [1-3].flac")], n=3, mx=0.9)
E("w_ion", "sfx", [S(A, "lab_git_es", "ion small~.flac"), S(A, "lab_git_es", "ion medium~.flac")], n=2, mx=0.8)
E("w_plasma", "sfx", [S(A, "lab_git_es", "plasma.flac"), S(A, "lab_git_freedoom", "dsplasma.flac")], n=2, mx=1.0)
E("w_magnetron", "sfx", [S(A, "lab_digital63*", "laser[123].mp3")], n=3, mx=0.9)
E("w_resonator", "sfx", [S(A, "lab_git_es", "disruptor~.flac")], mx=1.2)
E("w_positron", "sfx", [S(A, "lab_git_es", "neutron bolt.flac"), S(A, "lab_git_es", "proton.flac")], n=2, mx=1.1)
E("w_pcannon", "sfx", [S(A, "lab_git_freedoom", "dsbfg.flac"), S(A, "lab_git_es", "fusion blast.flac")], n=2, mx=2.2)
E("w_gauss", "sfx", [S(A, "lab_git_es", "javelin.flac"), S(A, "lab_git_es", "piercer.flac")], n=2, mx=1.0)
E("w_cryo", "sfx", [S(B, "bsb_lab_hiss", "3019*")], mx=0.8)
E("w_thermo", "sfx", [S(A, "lab_git_es", "flamethrower~.flac")], mx=0.8)
E("w_empty", "sfx", [S(A, "lab_mechclick*", "buzzerr-01.flac"), S(A, "lab_interface*", "click_005.ogg")], n=2, v=0.8)
E("w_reload_e", "sfx", [S(A, "lab_reload2*", "gun_reload.1.ogg")])
E("w_reload_m", "sfx", [S(A, "lab_reload2*", "gun_reload.2.ogg")])
E("w_reload_p", "sfx", [S(A, "lab_digital63*", "powerUp1.mp3")])
E("w_draw", "sfx", [S(A, "lab_git_freedoom", "dswpnup.flac")])
E("w_holster", "sfx", [S(B, "lab_rpg80*", "metal_03.ogg")])
E("w_switch", "sfx", [S(A, "lab_git_freedoom", "dssgcock.flac")])

# ═════ ПОПАДАНИЯ, ВЗРЫВЫ ═════
E("hit_metal", "sfx", [S(A, "lab_scifi_k*", "impactMetal_00*.ogg"), S(C, "lab_kimpact", "impactMetal_light_00[0-2].ogg")], n=8, mx=0.7)
E("hit_flesh", "sfx", [S(A, "lab_squish8*", "impactsplat0[78]*"), S(C, "lab_kimpact", "impactPunch_heavy_00[0-2].ogg")], n=5, mx=0.7)
E("impact_wall", "sfx", [S(A, "lab_sfx100b*", "*metal_hit_02.ogg"), S(A, "lab_sfx100_*", "hit_0[12].ogg")], n=3, mx=0.5)
E("impact_positron", "sfx", [S(A, "lab_git_es", "explosion tiny.flac")])
E("impact_wave", "sfx", [S(A, "lab_git_es", "ion impact.flac")], mx=0.9)
E("swing_miss", "sfx", [S(B, "lab_rpg80*", "blade_02.ogg")])
E("swing_by", "sfx", [S(B, "lab_rpg80*", "blade_03.ogg")])
E("bullet_by", "sfx", [S(A, "lab_digital63*", "phaserDown2.mp3")])
E("explosion_small", "sfx", [S(A, "lab_git_es", "explosion small.flac"), S(A, "lab_git_es", "explosion medium.flac")], n=2, mx=1.5)
E("explosion_big", "sfx", [S(A, "lab_git_es", "explosion large.flac"), S(A, "lab_git_es", "final explosion small.flac")], n=2, mx=2.6)
E("emp_blast", "sfx", [S(A, "lab_git_es", "ion impact.flac"), S(A, "lab_electric_deathboom*", "*.flac")], n=2, mx=2.0)
E("acid_burst", "sfx", [S(A, "lab_squish8*", "impactsplat05*")], mx=1.5)
E("grenade_throw", "sfx", [S(B, "lab_rpg80*", "blade_01.ogg")])
E("grenade_land", "sfx", [S(A, "lab_metalwood*", "metal_hit_04.ogg")])
E("shell_whistle", "sfx", [S(A, "lab_git_es", "rocket.flac")], mx=1.6)
E("mine_set", "sfx", [S(A, "lab_git_es", "mine deploy.flac")])
E("mine_beep", "bcn", [S(B, "lab_pingpong*", "*peeeeeep*")], bus="beacon")
E("loot_drop", "sfx", [S(A, "lab_interface*", "drop_00[23].ogg")], n=2, v=0.7)
E("debris", "sfx", [S(A, "lab_metalwood*", "metal_falling_02.ogg"), S(B, "lab_rpg80*", "stones_04.ogg")], n=2)

# ═════ ГЕРОЙ ═════
E("hurt_phys", "sfx", [S(A, "lab_hits37*", "hit0[1-6]*")], n=6, mx=0.8)
E("hurt_energy", "sfx", [S(A, "lab_digital63*", "zap[12].mp3")], n=2, mx=0.7)
E("hurt_shock", "sfx", [S(B, "bsb_lab_electric", "3442*"), S(A, "lab_electric_groundhit*", "*.flac")], n=2)
E("hurt_chem", "sfx", [S(A, "lab_squish8*", "impactsplat0[34]*")], n=2, mx=0.8)
E("hurt_therm", "sfx", [S(B, "bsb_lab_hiss", "3011*")], mx=0.8)
E("hurt_field", "sfx", [S(A, "lab_digital63*", "spaceTrash2.mp3")], mx=0.8)
E("player_pain", "voice", [S(A, "lab_git_freedoom", "dsplpain.flac"), S(A, "lab_git_freedoom", "dsoof.flac")], n=2)
E("player_death", "voice", [S(A, "lab_git_freedoom", "dspldeth.flac")])
E("heartbeat", "loop", [S(A, "lab_heart*", "*.flac")], seg=(0, 4.0), xf=0.05, v=0.8)

# ═════ МУТАНТЫ ═════
def foe(name, idle, alert, attack, hurt, death, step=None, **o):
    E(name + "_idle", "sfx", idle, n=4, mx=2.0, v=o.get("v", 1))
    E(name + "_alert", "sfx", alert, n=3, mx=2.2, v=o.get("v", 1))
    E(name + "_attack", "sfx", attack, n=3, mx=1.4, v=o.get("v", 1))
    E(name + "_hurt", "sfx", hurt, n=3, mx=1.0, v=o.get("v", 1))
    E(name + "_death", "sfx", death, n=2, mx=2.6, v=o.get("v", 1))
    if step: E(name + "_step", "step", step, n=4, mx=0.7, v=o.get("sv", 0.9))
foe("rat", [S(A, "lab_creat80_*", "cute_0[1-4].ogg", af="asetrate=44100*1.3,aresample=44100")], [S(A, "lab_rat*", "*Pain.flac")], [S(A, "lab_rat*", "*Attack.flac")], [S(A, "lab_rat*", "*Pain.flac")], [S(A, "lab_rat*", "*Death.flac")])
foe("roach", [S(A, "lab_creat80_*", "bug_0[1-4].ogg")], [S(A, "lab_creat80b*", "bug_0[5-7].ogg")], [S(A, "lab_creat80b*", "bug_0[89].ogg"), S(A, "lab_creat80b*", "bug_10.ogg")], [S(A, "lab_creat80b*", "bug_1[1-3].ogg")], [S(A, "lab_creat80b*", "die_01.ogg")])
foe("labmut", [S(A, "lab_git_freedoom", "dsposact.flac"), S(C, "lab_horrorlib*", "Zombie_0[13].mp3")], [S(A, "lab_git_freedoom", "dsposit[1-3].flac")], [S(A, "lab_creat80_*", "grunt_0[1-3].ogg")], [S(A, "lab_git_freedoom", "dspopain.flac")], [S(A, "lab_git_freedoom", "dspodth[1-3].flac")])
foe("slug", [S(A, "lab_slimy9*", "*.mp3")], [S(A, "lab_water40*", "slime_1[0-2].ogg")], [S(A, "lab_squish8*", "impactsplat0[12]*")], [S(A, "lab_slime10*", "slime.[45].ogg")], [S(A, "lab_squish8*", "impactsplat06*")])
foe("vine", [S(A, "lab_creat80_*", "weird_0[1-3].ogg")], [S(A, "lab_creat80_*", "weird_0[45].ogg")], [S(B, "lab_rpg80*", "blade_03.ogg"), S(A, "lab_metalwood*", "wood_cracking_0[1-2].ogg")], [S(A, "lab_metalwood*", "wood_cracking_0[34].ogg")], [S(A, "lab_metalwood*", "wood_breaking_0[12].ogg")])
foe("spore", [S(A, "lab_creat80_*", "burble_0[12].ogg")], [S(A, "lab_creat80_*", "burp_0[12].ogg")], [S(A, "lab_creat80_*", "spit_0[1-3].ogg")], [S(A, "lab_creat80_*", "cough_0[13].ogg")], [S(A, "lab_squish8*", "impactsplat0[45]*")])
foe("swamp", [S(A, "lab_troll*", "troll-idle*", start=2, dur=2)], [S(A, "lab_creat80_*", "troll_0[1-3].ogg")], [S(A, "lab_creat80_*", "grunt_0[45].ogg")], [S(A, "lab_creat80_*", "hurt_0[12].ogg")], [S(A, "lab_creat80b*", "die_04.ogg")])
foe("chimera", [S(A, "lab_git_freedoom", "dsdmact.flac")], [S(A, "lab_git_freedoom", "dssgtsit.flac"), S(A, "lab_creat80_*", "roar_02.ogg")], [S(A, "lab_git_freedoom", "dssgtatk.flac"), S(A, "lab_git_freedoom", "dsclaw.flac")], [S(A, "lab_git_freedoom", "dsdmpain.flac")], [S(A, "lab_git_freedoom", "dssgtdth.flac")])
foe("lizard", [S(A, "lab_growls16*", "monster.[1-4].ogg")], [S(A, "lab_creat80_*", "monster_0[1-3].ogg")], [S(A, "lab_creat80b*", "attack_0[2-4].ogg")], [S(A, "lab_creat80_*", "hurt_0[3-5].ogg")], [S(A, "lab_creat80b*", "die_0[23].ogg")])
foe("weaver", [S(A, "lab_creat80b*", "bug_0[5-7].ogg", af="asetrate=44100*0.75,aresample=44100")], [S(A, "lab_creat80_*", "alien_0[1-3].ogg")], [S(A, "lab_creat80_*", "spit_0[12].ogg")], [S(A, "lab_creat80b*", "bug_1[23].ogg")], [S(A, "lab_creat80b*", "die_01.ogg", af="asetrate=44100*0.8,aresample=44100")])
foe("blind", [S(A, "lab_beast*", "Beast Growl [12].flac")], [S(A, "lab_beast*", "Beast Growl [345].flac")], [S(A, "lab_beast*", "Demon Growl.flac")], [S(A, "lab_beast*", "Yucky Beast [1-3].flac")], [S(A, "lab_beast*", "Dieing Beast.flac")])
foe("spark", [S(A, "lab_electric_crackle*", "*.flac")], [S(A, "lab_creat80_*", "monster_0[45].ogg")], [S(A, "lab_electric_groundhit*", "*.flac"), S(B, "bsb_lab_electric", "3442*")], [S(A, "lab_creat80_*", "hurt_0[34].ogg")], [S(A, "lab_electric_death_1*", "*.flac")])
foe("frozen", [S(A, "lab_creat80_*", "monster_0[67].ogg", af="asetrate=44100*0.8,aresample=44100")], [S(A, "lab_creat80b*", "roar_0[45].ogg", af="asetrate=44100*0.8,aresample=44100")], [S(A, "lab_creat80b*", "stomp_01.ogg")], [S(C, "lab_kimpact", "impactGlass_medium_00[0-1].ogg")], [S(B, "bsb_lab_glass", "1591*"), S(C, "lab_kimpact", "impactGlass_heavy_00[0-1].ogg")])
foe("thawed", [S(A, "lab_creat80_*", "weird_0[1-3].ogg", af="asetrate=44100*0.9,aresample=44100")], [S(A, "lab_creat80_*", "scream_0[12].ogg")], [S(A, "lab_creat80b*", "attack_0[34].ogg")], [S(A, "lab_creat80_*", "hurt_0[12].ogg")], [S(A, "lab_squish8*", "impactsplat05*")])
foe("soldier", [S(A, "lab_git_freedoom", "dsposact.flac", af="asetrate=44100*0.85,aresample=44100")], [S(A, "lab_git_freedoom", "dssssit.flac"), S(A, "lab_git_freedoom", "dsposit2.flac", af="asetrate=44100*0.85,aresample=44100")], [S(A, "lab_git_es", "blaster.flac", af="asetrate=44100*0.85,aresample=44100")], [S(A, "lab_git_freedoom", "dspopain.flac", af="asetrate=44100*0.85,aresample=44100")], [S(A, "lab_git_freedoom", "dsssdth.flac")], step=[S(C, "lab_kimpact", "footstep_concrete_*.ogg", af="asetrate=44100*0.85,aresample=44100")])
foe("phase", [S(C, "lab_ghostvoice*", "*GhostMoan0[15].flac")], [S(A, "lab_git_freedoom", "dscacsit.flac")], [S(A, "lab_digital63*", "phaseJump[45].mp3")], [S(C, "lab_ghostvoice*", "*GhostMoan02.flac")], [S(A, "lab_git_freedoom", "dscacdth.flac")])
foe("proto", [S(C, "lab_horrorlib*", "Monster_0[13].mp3")], [S(A, "lab_git_freedoom", "dsbrssit.flac"), S(A, "lab_git_freedoom", "dskntsit.flac")], [S(A, "lab_git_freedoom", "dsclaw.flac", af="asetrate=44100*0.8,aresample=44100")], [S(C, "lab_horrorlib*", "Monster_06.mp3")], [S(A, "lab_git_freedoom", "dsbrsdth.flac"), S(A, "lab_git_freedoom", "dskntdth.flac")], step=[S(A, "lab_creat80b*", "stomp_01.ogg")])
# общие голоса тварей
E("mutant_alert", "sfx", [S(A, "lab_growls16*", "monster.[5-9].ogg")], n=4, mx=1.8)
E("mutant_attack", "sfx", [S(A, "lab_creat80b*", "attack_0[1-5].ogg")], n=4, mx=1.2)
E("mutant_idle", "sfx", [S(A, "lab_monfx2*", "monster-[1-6].flac")], n=5, mx=1.4)
E("mutant_hurt", "sfx", [S(A, "lab_creat80_*", "hurt_0[1-5].ogg")], n=4)
E("mutant_death", "sfx", [S(A, "lab_creat80b*", "die_0[1-4].ogg")], n=4)
E("mutant_step", "step", [S(A, "lab_sfx100b*", "*footstep_0[12].ogg", af="asetrate=44100*0.8,aresample=44100,lowpass=f=2500")], n=2, v=0.8)
E("mutant_summon", "sfx", [S(A, "lab_creat80_*", "howl.ogg")])

# ═════ РОБОТЫ ═════
foe("drone", [S(B, "bsb_lab_robot", "19[78][13]*")], [S(C, "lab_bitvoice*", "*aggro-00[1-3].mp3")], [S(A, "lab_git_es", "locust blaster.flac"), S(A, "lab_git_es", "pulse.flac", af="asetrate=44100*1.15,aresample=44100")], [S(A, "lab_scifi_k*", "impactMetal_00[34].ogg")], [S(A, "lab_git_es", "explosion tiny.flac")])
foe("spiderbot", [S(A, "lab_git_freedoom", "dsbspact.flac")], [S(A, "lab_git_freedoom", "dsbspsit.flac")], [S(A, "lab_metalwood*", "metal_spring_0[12].ogg"), S(B, "lab_rpg80*", "blade_01.ogg")], [S(A, "lab_scifi_k*", "impactMetal_00[12].ogg")], [S(A, "lab_git_freedoom", "dsbspdth.flac")], step=[S(A, "lab_git_freedoom", "dsbspwlk.flac")], sv=0.8)
foe("repairbot", [S(A, "lab_git_freedoom", "dssawidl.flac")], [S(A, "lab_git_freedoom", "dssawup.flac")], [S(A, "lab_git_freedoom", "dssawful.flac"), S(A, "lab_git_freedoom", "dssawhit.flac")], [S(A, "lab_scifi_k*", "impactMetal_00[01].ogg")], [S(A, "lab_git_es", "explosion small.flac")], step=[S(C, "lab_robosteps*", "robot[13].flac")])
foe("turret", [S(A, "lab_mechanical_mech*", "*.flac")], [S(A, "lab_digital63*", "pepSound3.mp3"), S(C, "lab_bitvoice*", "*aggro-00[45].mp3")], [S(A, "lab_git_es", "gatling.flac"), S(A, "lab_git_es", "repeater.flac")], [S(C, "lab_kimpact", "impactMetal_medium_00[1-2].ogg")], [S(A, "lab_git_es", "explosion small.flac")])
foe("guardbot", [S(A, "lab_rts*", "destroyer.select.flac")], [S(A, "lab_rts*", "destroyer.ready.flac"), S(B, "bsb_lab_robot", "1973*")], [S(A, "lab_git_es", "heavy blaster.flac")], [S(A, "lab_scifi_k*", "impactMetal_00[03].ogg")], [S(A, "lab_rts*", "destroyer.die.flac")], step=[S(C, "lab_robosteps*", "robotstep[1-4].flac")], sv=0.9)
foe("android", [S(B, "bsb_lab_scifi", "1976*"), S(B, "bsb_lab_robot", "1975*")], [S(B, "bsb_lab_scifi", "1980*"), S(A, "lab_robot1*", "*.mp3")], [S(A, "lab_git_es", "mod blaster.flac")], [S(A, "lab_scifi_k*", "impactMetal_00[24].ogg")], [S(A, "lab_electric_death_1*", "*.flac")], step=[S(A, "lab_metalsteps*", "metal_steps_1[5-9].flac", af="asetrate=44100*0.9,aresample=44100")], sv=0.7)
foe("watcher", [S(A, "lab_mechanical_mech*", "*.flac", af="asetrate=44100*0.7,aresample=44100")], [S(A, "lab_git_freedoom", "dscybsit.flac")], [S(C, "lab_kimpact", "impactMetal_heavy_00[0-2].ogg", af="asetrate=44100*0.6,aresample=44100")], [S(A, "lab_scifi_k*", "impactMetal_00[13].ogg")], [S(A, "lab_git_freedoom", "dscybdth.flac")], step=[S(A, "lab_git_freedoom", "dshoof.flac")])
foe("shieldbot", [S(A, "lab_shield*", "*- 4.flac")], [S(A, "lab_rts*", "artil.select.flac")], [S(C, "lab_kimpact", "impactMetal_heavy_00[34].ogg")], [S(A, "lab_shield*", "*- 7.flac")], [S(A, "lab_git_es", "explosion medium.flac")], step=[S(C, "lab_robosteps*", "robotstep[34].flac")])
foe("sapper", [S(A, "lab_ibeeps*", "beep-1[0-3].flac")], [S(C, "lab_bitvoice*", "*aggro-006.mp3")], [S(A, "lab_metalwood*", "metal_spring_02.ogg")], [S(A, "lab_scifi_k*", "impactMetal_004.ogg")], [S(A, "lab_git_es", "explosion medium.flac")], step=[S(A, "lab_winch*", "*Marker #[56].flac")], sv=0.5)
foe("hunter", [S(A, "lab_robotbird*", "*.flac", start=0.0, dur=1.2)], [S(A, "lab_robotbird*", "*.flac", start=1.2, dur=1.4)], [S(B, "lab_rpg80*", "blade_0[12].ogg"), S(C, "lab_kimpact", "impactPunch_heavy_00[3-4].ogg")], [S(A, "lab_scifi_k*", "impactMetal_00[23].ogg")], [S(A, "lab_electric_death*", "*.flac", af="asetrate=44100*1.2,aresample=44100")], step=[S(A, "lab_git_freedoom", "dsbspwlk.flac", af="asetrate=44100*1.35,aresample=44100")], sv=0.6)
foe("mortar", [S(A, "lab_rts*", "artil.ready.flac")], [S(A, "lab_rts*", "artil.select.flac")], [S(A, "lab_rts*", "artil.action.flac")], [S(A, "lab_scifi_k*", "impactMetal_00[01].ogg")], [S(A, "lab_rts*", "artil.die.flac")], step=[S(C, "lab_robosteps*", "robot2.flac")])
E("mortar_fire", "sfx", [S(A, "lab_rts*", "artil.action.flac")], mx=1.6)
foe("relay", [S(A, "lab_scifi_k*", "computerNoise_003.ogg", dur=1.6)], [S(B, "bsb_lab_radio", "2618*", start=3.0, dur=1.8)], [S(A, "lab_git_freedoom", "dsradio.flac")], [S(A, "lab_scifi_k*", "forceField_00[23].ogg")], [S(A, "lab_electric_deathboom*", "*.flac")])
foe("micro", [S(B, "bsb_lab_insect", "1000*", start=1.0, dur=1.4)], [S(A, "lab_creat80b*", "bug_0[5-7].ogg", af="asetrate=44100*1.5,aresample=44100")], [S(A, "lab_scifi_k*", "laserSmall_00[0-2].ogg")], [S(A, "lab_interface*", "glitch_00[1-3].ogg")], [S(A, "lab_git_es", "explosion tiny.flac", af="asetrate=44100*1.4,aresample=44100")])
foe("titan", [S(C, "lab_robosteps*", "robotstand.flac")], [S(A, "lab_git_freedoom", "dsspisit.flac")], [S(A, "lab_git_freedoom", "dsmanatk.flac"), S(A, "lab_git_es", "plasma discharger.flac")], [S(C, "lab_kimpact", "impactMetal_heavy_00[0-2].ogg")], [S(A, "lab_git_freedoom", "dsspidth.flac")], step=[S(C, "lab_robosteps*", "robotstomp.flac"), S(A, "lab_git_freedoom", "dshoof.flac", af="asetrate=44100*0.75,aresample=44100")], sv=1.0)
# общие голоса роботов
E("robot_alert", "sfx", [S(C, "lab_bitvoice*", "*aggro-00[1-6].mp3"), S(A, "lab_digital63*", "pepSound[23].mp3")], n=6)
E("robot_attack", "sfx", [S(A, "lab_git_es", "blaster.flac", af="asetrate=44100*0.9,aresample=44100")])
E("robot_idle", "sfx", [S(B, "bsb_lab_robot", "19*"), S(A, "lab_mechanical_mech*", "*.flac")], n=5, mx=1.2)
E("robot_hurt", "sfx", [S(A, "lab_scifi_k*", "impactMetal_00*.ogg")], n=4, mx=0.7)
E("robot_death", "sfx", [S(A, "lab_git_es", "explosion small.flac"), S(A, "lab_electric_death_1*", "*.flac")], n=2, mx=2.0)
E("robot_step", "step", [S(C, "lab_robosteps*", "robotstep[1-4].flac"), S(A, "lab_mechanical_mech*", "*.flac")], n=6, mx=0.7, v=0.85)
E("robot_radio", "sfx", [S(A, "lab_git_freedoom", "dsradio.flac"), S(C, "lab_comp9*", "tick.flac")], n=2)
E("robot_dodge", "sfx", [S(A, "lab_mechanical_mech*", "*.flac", af="asetrate=44100*1.3,aresample=44100")], n=2)
E("robot_retreat", "sfx", [S(A, "lab_rts*", "destroyer.underattack.flac")])
E("robot_repair", "sfx", [S(A, "lab_metalwood*", "tools_1[0-2].ogg")], n=3)
E("robot_summon", "sfx", [S(A, "lab_digital63*", "powerUp8.mp3"), S(C, "lab_comp9*", "teleport.flac")], n=2)
E("robot_hello", "sfx", [S(B, "bsb_lab_robot", "1973*")])
E("npc_hello", "sfx", [S(A, "lab_creat80b*", "human_0[1-4].ogg")], n=4, v=0.7)
E("foe_aim", "sfx", [S(A, "lab_electric_charge.wav", "*.flac", start=0.0, dur=0.7)], v=0.9, mx=0.7)
E("foe_shot_energy", "sfx", [S(A, "lab_git_es", "blaster.flac", af="asetrate=44100*0.8,aresample=44100")])
E("foe_shot_shock", "sfx", [S(A, "lab_electric_groundhit*", "*.flac")])
E("foe_shot_spit", "sfx", [S(A, "lab_creat80_*", "spit_0[1-3].ogg")], n=3)
E("foe_shot_cold", "sfx", [S(B, "bsb_lab_hiss", "3019*")], mx=0.8)
E("foe_shot_phys", "sfx", [S(A, "lab_git_es", "gatling.flac")])
E("shield_up", "sfx", [S(A, "lab_shield*", "*- 4.flac")], mx=1.2)
E("shield_break", "sfx", [S(C, "lab_kimpact", "impactGlass_heavy_00[0-2].ogg"), S(A, "lab_shield*", "*- 9.flac")], n=3, mx=1.2)
E("shield_hit_foe", "sfx", [S(A, "lab_shield*", "*- 8.flac")], mx=0.8)
E("phase_out", "sfx", [S(A, "lab_digital63*", "phaseJump4.mp3")])
E("phase_in", "sfx", [S(A, "lab_git_freedoom", "dstelept.flac")])

# ═════ ФОН: уровни, помещения, события ═════
E("amb_l1", "loop", [S(B, "bsb_lab_vent", "3598*")], seg=(5, 36), xf=3.0, ch=2, v=0.8)
E("amb_l2", "loop", [S(B, "bsb_lab_vent", "1233*")], seg=(0.5, 17), xf=2.0, ch=2, v=0.8)
E("amb_l3", "loop", [S(A, "lab_drip_atmos*", "*.flac")], seg=(0, 20), xf=2.0, ch=2, v=0.9)
E("amb_l4", "loop", [S(C, "lab_ambpack_Infestation*", "*.mp3")], seg=(2, 44), xf=4.0, ch=2, v=0.9)
E("amb_l5", "loop", [S(C, "lab_factory*", "Factory.ogg")], seg=(10, 50), xf=4.0, ch=2, v=0.9)
E("amb_l6", "loop", [S(C, "lab_horrorlib*", "Evil_Machine_Loop_00.mp3")], seg=(0, 9.6), xf=0.6, ch=2, v=0.8)
E("amb_l7", "loop", [S(C, "lab_ambpack_The_20Surreal*", "*.mp3")], seg=(4, 50), xf=4.0, ch=2, v=0.9)
E("amb_l8", "loop", [S(C, "lab_ambpack_Cage*", "*.mp3")], seg=(4, 50), xf=4.0, ch=2, v=0.9)
E("amb_l9", "loop", [S(C, "lab_emfields*", "EM Fields 07.flac")], seg=(1, 32), xf=3.0, v=0.7)
E("amb_l10", "loop", [S(C, "lab_horrorlib*", "Ambience_MonstersBelly_00.mp3")], seg=(2, 55), xf=4.0, ch=2, v=1.0)
E("room_server", "loop", [S(A, "lab_scifi_k*", "computerNoise_000.ogg")], seg=(0, 5), xf=0.5, v=0.6)
E("room_radio", "loop", [S(A, "lab_retrocomp*", "*.mp3")], seg=(10, 14), xf=1.0, v=0.5)
E("room_generator", "loop", [S(A, "lab_steam_generator*", "*.flac")], seg=(1, 18), xf=1.5, v=0.8)
E("room_transformer", "loop", [S(B, "bsb_lab_transformer", "2118*")], seg=(0.5, 9), xf=1.0, v=0.6)
E("room_magnetron", "loop", [S(C, "lab_emfields*", "EM Fields 01.flac")], seg=(1, 18), xf=2.0, v=0.7)
E("room_electric", "loop", [S(C, "lab_emfields*", "EM Fields 04.flac")], seg=(1, 11), xf=1.0, v=0.6)
E("room_hum", "loop", [S(A, "lab_device*", "*.flac")], seg=(0, 1.7), xf=0.2, v=0.5)
E("room_cryo", "loop", [S(B, "bsb_lab_compressor", "1487*")], seg=(4, 22), xf=2.0, v=0.6)
E("room_compressor", "loop", [S(B, "bsb_lab_compressor", "3092*")], seg=(4, 22), xf=2.0, v=0.6)
E("room_drip", "loop", [S(C, "lab_horrorlib*", "Blood_Dripping_Loop_00.mp3")], seg=(0, 15), xf=1.0, v=0.7)
E("room_bubbles", "loop", [S(A, "lab_water40*", "loop_bubbles_02.ogg")], seg=(0, 7.2), xf=0.8, v=0.6)
E("room_pumps", "loop", [S(A, "lab_sfx100b*", "*loop_machine_01.ogg")], seg=(0, 7.4), xf=0.6, v=0.6)
E("room_creatures", "loop", [S(A, "lab_ghoul*", "*.ogg")], seg=(2, 20), xf=2.0, v=0.4)
E("room_incubator", "loop", [S(A, "lab_scifi50*", "loop_ambient_weird.ogg")], seg=(0, 3.1), xf=0.4, v=0.5)
E("room_factory", "loop", [S(A, "lab_scifi50*", "loop_machine_02.ogg")], seg=(0, 3.1), xf=0.3, v=0.6)
E("room_ring", "loop", [S(A, "lab_scifi_k*", "engineCircular_001.ogg")], seg=(0, 5), xf=0.6, v=0.6)
E("room_reactor", "loop", [S(A, "lab_scifi_k*", "spaceEngineLarge_001.ogg")], seg=(0, 5), xf=0.6, v=0.8)
E("room_fridge", "loop", [S(B, "bsb_lab_microwave", "2376*")], seg=(2, 10), xf=1.0, v=0.4)
E("room_fountain", "loop", [S(A, "lab_water40*", "loop_water_02.ogg")], seg=(0, 7), xf=0.8, v=0.5)
E("room_medical", "loop", [S(A, "lab_scifi50*", "loop_machine_03.ogg")], seg=(0, 4.6), xf=0.4, v=0.4)
E("room_elevator", "loop", [S(A, "lab_scifi_k*", "engineCircular_003.ogg")], seg=(0, 5), xf=0.6, v=0.5)
E("room_gate", "loop", [S(A, "lab_scifi_k*", "spaceEngineLow_002.ogg")], seg=(0, 5), xf=0.6, v=0.7)
E("room_stairwell", "loop", [S(A, "lab_sfx100b*", "*loop_ambient_02.ogg")], seg=(0, 3), xf=0.4, v=0.5)
E("room_corridor", "loop", [S(B, "bsb_lab_vent", "1032*")], seg=(1, 18), xf=2.0, v=0.4)
# далёкие события комплекса
E("ev_metal_groan", "sfx", [S(A, "lab_pings*", "*Marker #[1-9].flac"), S(A, "lab_pings*", "*Marker #1[0-9].flac")], n=12, mx=4.5)
E("ev_vent_rattle", "sfx", [S(A, "lab_metalwood*", "metal_sheet_0[46].ogg"), S(A, "lab_metalwood*", "misc_0[1-3].ogg")], n=4)
E("ev_far_door", "sfx", [S(A, "lab_git_freedoom", "dsdorcls.flac", af="lowpass=f=1200"), S(A, "lab_git_freedoom", "dsbdcls.flac", af="lowpass=f=1000")], n=2)
E("ev_far_scream", "sfx", [S(C, "lab_horrorlib*", "Scream_Male_0[1-4].mp3", af="lowpass=f=2400"), S(B, "bsb_lab_scream", "1662*", af="lowpass=f=2200")], n=5)
E("ev_pipe_knock", "sfx", [S(A, "lab_metalwood*", "hammer_0[1-4].ogg", af="lowpass=f=1600")], n=4)
E("ev_robot_far", "sfx", [S(A, "lab_rts*", "*.select.flac", af="lowpass=f=1800"), S(B, "bsb_lab_robot", "19[78]*", af="lowpass=f=1800")], n=4)
E("ev_drip", "sfx", [S(C, "lab_horrorlib*", "Blood_Drip_0[0-6].mp3")], n=6)
E("ev_skitter", "sfx", [S(A, "lab_creat80b*", "bug_0[5-9].ogg", af="lowpass=f=2500")], n=4)
E("ev_cry", "sfx", [S(C, "lab_horrorlib*", "Breath_Scared_0[5-9].mp3", af="lowpass=f=2400")], n=4)
E("ev_bubbles", "sfx", [S(A, "lab_water40*", "bubble_0[1-3].ogg")], n=3)
E("ev_rustle", "sfx", [S(A, "lab_metalwood*", "wood_cracking_0[1-4].ogg", af="lowpass=f=2000")], n=4)
E("ev_far_roar", "sfx", [S(A, "lab_deeproar*", "*.flac", af="lowpass=f=1200"), S(A, "lab_troll*", "troll-roars*", start=0, dur=3, af="lowpass=f=1100")], n=2, mx=4.0)
E("ev_steam", "sfx", [S(B, "bsb_lab_hiss", "30*")], n=2, mx=2.5)
E("ev_glass", "sfx", [S(A, "lab_sfx100_*", "glass_0[45].ogg")], n=2)
E("ev_heart", "sfx", [S(A, "lab_heart*", "*.flac")], mx=2.2)
E("ev_servo", "sfx", [S(A, "lab_mechanical_mech*", "*.flac", af="lowpass=f=2000")], n=2)
E("ev_factory_clank", "sfx", [S(A, "lab_metalwood*", "metal_slam_01.ogg", af="lowpass=f=1500"), S(A, "lab_mechanical_clank*", "*.flac", af="lowpass=f=1500")], n=2)
E("ev_alarm_far", "sfx", [S(A, "lab_git_es", "alarm.flac", af="lowpass=f=1400")], mx=2.6)
E("ev_electric", "sfx", [S(B, "bsb_lab_electric", "3442*"), S(B, "bsb_lab_neon", "2146*")], n=2)
E("ev_transformer", "sfx", [S(B, "bsb_lab_transformer", "2119*", start=2, dur=2.5)], mx=2.5)
E("ev_far_boom", "sfx", [S(A, "lab_farboom*", "*.mp3")], mx=3.0)
E("ev_ice_crack", "sfx", [S(C, "lab_kimpact", "impactGlass_light_00[2-4].ogg", af="asetrate=44100*0.7,aresample=44100")], n=3)
E("ev_wind", "sfx", [S(A, "lab_sfx100b*", "*air_01.ogg")], mx=2.6)
E("ev_far_shots", "sfx", [S(A, "lab_laserburst*", "*.mp3", af="lowpass=f=1500")], mx=1.0)
E("ev_ring_whine", "sfx", [S(A, "lab_digital63*", "laser[89].mp3", af="lowpass=f=3000")], n=2)
E("ev_phase", "sfx", [S(A, "lab_digital63*", "phaseJump[1-5].mp3", af="lowpass=f=2500")], n=3)
E("ev_rift_pulse", "sfx", [S(A, "lab_git_es", "gravity well~.flac", start=1.0, dur=3.0)], mx=3.0)
E("ev_whisper", "sfx", [S(A, "lab_beast*", "Children Spirit Sounds.flac", start=0.5, dur=3.5), S(C, "lab_ghostvoice*", "*GhostMoan0[34].flac")], n=3, mx=3.8)
E("ev_quake", "sfx", [S(B, "bsb_lab_rumble", "3114*")], mx=4.5)
E("ev_alarm_start", "sfx", [S(A, "lab_git_es", "alarm.flac")], mx=2.6)
E("evl_alarm", "loop", [S(B, "bsb_lab_siren", "3411*")], seg=(0, 5.2), xf=0.2, v=0.4)
E("evl_dark", "loop", [S(A, "lab_horroramb*", "*.flac")], seg=(0, 22), xf=2.0, v=0.5)
E("evl_surge", "loop", [S(C, "lab_emfields*", "EM Fields 06.flac")], seg=(1, 16), xf=1.5, v=0.5)
E("evl_steam", "loop", [S(B, "bsb_lab_steam", "3016*")], seg=(20, 16), xf=2.0, v=0.4)
E("evl_quake", "loop", [S(B, "bsb_lab_rumble", "3114*")], seg=(0, 10), xf=2.0, v=0.4)

# ═════ МУЗЫКА (идёт потоком, не грузится в память целиком) ═════
E("mus_menu", "music", [S(C, "lab_menacing*", "*.mp3")], v=1.0)
E("mus_prologue", "music", [S(C, "lab_bleakterm*", "*.mp3")], v=1.0)
E("mus_l1", "music", [S(C, "lab_searching*", "*.ogg")], v=1.0)
E("mus_l2", "music", [S(C, "lab_emptycity*", "*.ogg")], v=1.0)
E("mus_l3", "music", [S(C, "lab_silent_dirty_rain_loop*", "*.flac")], v=1.0)
E("mus_l4", "music", [S(C, "lab_creep*", "*.mp3")], v=1.0)
E("mus_l5", "music", [S(C, "lab_insistent*", "*.ogg")], v=1.0)
E("mus_l6", "music", [S(C, "lab_heartmach*", "*.ogg")], v=1.0)
E("mus_l7", "music", [S(C, "lab_silent_the_world*", "*.flac")], v=1.0)
E("mus_l8", "music", [S(C, "lab_elevreactor*", "*.mp3")], v=1.0)
E("mus_l9", "music", [S(C, "lab_ghostsmach*", "*.mp3")], v=1.0)
E("mus_l10", "music", [S(C, "lab_torment_realm_of_torment_1.flac", "*.flac")], v=1.0)
E("mus_ending", "music", [S(C, "lab_desolate*", "Desolate Part I.mp3")], v=1.0)

# ═════ СИНТЕЗ: звуки, которых нет в наборах ═════
def gen(name):
    t = np.arange(int(1.6 * SR)) / SR
    if name in ("sonar", "sonar_wide"):
        f0 = 1250 if name == "sonar" else 900
        f = f0 * (1 - 0.06 * t)
        ph = 2 * np.pi * np.cumsum(f) / SR
        a = np.sin(ph) * np.exp(-t * 4.5) * (1 - np.exp(-t * 400))
        a += 0.35 * np.sin(2 * ph) * np.exp(-t * 7)
        out = np.zeros(len(a) + int(0.5 * SR), dtype=np.float32)
        out[: len(a)] += a
        for k, (d, g) in enumerate([(0.18, 0.35), (0.36, 0.18)]):
            o = int(d * SR); out[o: o + len(a)] += a * g
        return fade(out.astype(np.float32), 0.002, 0.3)
    raise SystemExit("нет синтеза " + name)

# ═════ СБОРКА ═════
GROUP = {"ui": "ui", "step": "step", "bcn": "bcn", "loop": "amb", "music": "mus", "voice": "fx", "sfx": "fx", "mix": "fx", "seq": "fx", "gen": "fx"}
MISSING = []
def resolve(src):
    _, R, pack, pat, o = src
    files = find(R, pack, pat)
    return [(f, o) for f in files]

def process_one(path, o, kind, mx, ch=1):
    a = decode(path, o.get("start", 0), o.get("dur"), ch=ch, af=o.get("af"))
    if kind in ("loop", "music"):
        return a
    a = trim(a)
    a = cap(a, mx if mx is not None else DEF_MAX.get(kind))
    a = fade(a, 0.003, 0.04)
    return a

def resample(a, rate):
    if abs(rate - 1) < 1e-3: return a
    n = int(len(a) / rate)
    x = np.linspace(0, len(a) - 1, n)
    if a.ndim == 1: return np.interp(x, np.arange(len(a)), a).astype(np.float32)
    return np.stack([np.interp(x, np.arange(len(a)), a[:, c]) for c in range(a.shape[1])], axis=1).astype(np.float32)

def build():
    out_defs, credits_used = {}, {}
    total = 0
    for id_, sp in SPEC.items():
        kind, v, n = sp["kind"], sp["v"], sp["n"]
        o = sp["o"]
        grp = GROUP[kind]
        outs = []
        def use(path):
            pk, rel = pack_of(path)
            credits_used.setdefault(pk, set()).add(rel)
        if kind == "gen":
            outs.append(loudnorm(gen(sp["srcs"]), TARGET["sfx"]))
        elif kind == "mix":
            mix = None
            for layer, off, g in sp["srcs"]:
                fs = resolve(layer)
                if not fs: MISSING.append(id_ + ": " + str(layer[1:4])); continue
                path, lo = fs[0]
                use(path)
                a = process_one(path, lo, "sfx", 6.0)
                a = loudnorm(a, -18) * g
                pad = int(off * SR)
                need = pad + len(a)
                if mix is None: mix = np.zeros(need, dtype=np.float32)
                if len(mix) < need: mix = np.concatenate([mix, np.zeros(need - len(mix), dtype=np.float32)])
                mix[pad: pad + len(a)] += a
            outs.append(fade(loudnorm(mix, TARGET["sfx"]), 0.003, 0.3))
        elif kind == "seq":
            fs = []
            for s in sp["srcs"]: fs += resolve(s)
            if not fs: MISSING.append(id_); continue
            cnt, gap = o.get("count", 6), o.get("gap", 0.35)
            r0, r1 = o.get("rate_from", 1.0), o.get("rate_to", 1.0)
            seq = np.zeros(int((cnt * gap + 1.2) * SR), dtype=np.float32)
            rng = np.random.RandomState(int(hashlib.md5(id_.encode()).hexdigest()[:6], 16))
            for k in range(cnt):
                path, lo = fs[rng.randint(len(fs))]
                use(path)
                a = process_one(path, lo, "sfx", 0.6)
                a = resample(a, r0 + (r1 - r0) * k / max(1, cnt - 1))
                a = loudnorm(a, -20) * (0.8 + 0.2 * rng.rand())
                p = int((k * gap + rng.rand() * 0.04) * SR)
                seq[p: p + len(a)] += a[: len(seq) - p]
            outs.append(fade(loudnorm(trim(seq), TARGET["sfx"]), 0.003, 0.2))
        else:
            items = []
            for s in sp["srcs"]:
                if isinstance(s, tuple) and s[0] == "slice":
                    _, src, k = s
                    fs = resolve(src)
                    if not fs: MISSING.append(id_ + " (slice)"); continue
                    path, lo = fs[0]
                    use(path)
                    a = decode(path, 0, 30, ch=1)
                    for seg in onsets(a, k): items.append(("arr", seg))
                    continue
                fs = resolve(s)
                if not fs: MISSING.append(id_ + ": " + str(s[1:4])); continue
                for f in fs: items.append(("file", f))
            if n and len(items) > n:
                pick = np.linspace(0, len(items) - 1, n).astype(int)
                items = [items[k] for k in pick]
            for typ, it in items:
                if typ == "arr":
                    a = it
                else:
                    path, lo = it
                    use(path)
                    if kind == "loop":
                        st, du = o.get("seg", (0, 20))
                        lo2 = dict(lo); lo2["start"] = lo.get("start", 0) + st; lo2["dur"] = du + o.get("xf", 1.0)
                        a = process_one(path, lo2, kind, None, ch=o.get("ch", 1))
                        a = loopify(a, o.get("xf", 1.0))
                    elif kind == "music":
                        a = process_one(path, lo, kind, None, ch=2)
                        a = fade(a, 0.5, 3.0)
                    else:
                        a = process_one(path, lo, kind, sp["mx"])
                if len(a) < int(0.02 * SR): continue
                a = loudnorm(a, TARGET.get(kind, -16))
                outs.append(a)
        if not outs:
            MISSING.append("ПУСТО " + id_); continue
        files = []
        for k, a in enumerate(outs):
            rel = "%s/%s_%d.ogg" % (grp, id_, k + 1)
            q = 2 if kind == "music" else (3 if kind == "loop" else 4)
            encode(a, os.path.join(OUT, rel), q)
            files.append(rel)
            total += os.path.getsize(os.path.join(OUT, rel))
        bus = sp["bus"] or {"ui": "ui", "bcn": "beacon", "loop": "amb", "music": "music"}.get(kind, "fx")
        out_defs[id_] = {"f": files, "o": {"v": round(sp["v"], 2), "bus": bus}}
        if kind in ("loop", "music"): out_defs[id_]["o"]["stream"] = kind == "music" or len(outs[0]) > 12 * SR
        print("%-22s %d вар., %s" % (id_, len(files), kind))
    return out_defs, credits_used, total

def write_js(defs):
    # сразу — общее для всех уровней; голоса врагов, пол и события уровня грузит atmos.js
    core = [k for k in defs if re.match(r"^(ui_|bump_|door_|bcn_|pick_|near_|nav_|w_|hit_|impact_|card_|keypad|code_)", k)]
    lvl = re.compile(r"^(step_|amb_|room_|evl_|ev_|mus_)|_(idle|alert|attack|hurt|death|step)$")
    allids = [k for k, d in defs.items() if not d["o"].get("stream") and not lvl.search(k)]
    js = ["/* Записи «Подземной лаборатории»: что звучит и откуда. Файл собран",
          "   lab/tools/build_sounds.py — правьте сборщик, а не этот файл. */",
          "(function () {", "\"use strict\";", "var LAB = window.LAB;",
          "LAB.SND = " + json.dumps(defs, ensure_ascii=False, separators=(",", ":")) + ";",
          "LAB.SOUND_CORE = " + json.dumps(core) + ";",
          "LAB.SOUND_ALL = " + json.dumps(allids) + ";",
          "LAB.registerSounds = function () {",
          "  for (var id in LAB.SND) { var d = LAB.SND[id]; LAB.Bank.def(id, d.f, d.o || {}); }",
          "};", "})();", ""]
    with open(os.path.join(LAB, "js", "sounds.js"), "w", encoding="utf-8") as f:
        f.write("\n".join(js))

def write_credits(used):
    lines = ["# Звуки «Подземной лаборатории»", "",
             "Все записи — свободные: CC0 (общественное достояние), CC BY 3.0 (с указанием автора),",
             "BSD 3-Clause (Freedoom) и общественное достояние (часть записей Endless Sky).",
             "Записи под CC BY-SA и GPL не используются. Звуки обрезаны, выровнены по громкости,",
             "часть — замедлена или ускорена, петли сведены с перекрёстным затуханием;",
             "сборщик — lab/tools/build_sounds.py.", ""]
    for pk in sorted(used, key=lambda k: PACKS.get(k, ("",))[0].lower()):
        name, author, lic, url = PACKS.get(pk, (pk, "?", "?", ""))
        lines.append("## %s" % name)
        lines.append("")
        lines.append("Автор: %s. Лицензия: %s. Источник: %s" % (author, lic, url))
        lines.append("")
        files = sorted(used[pk])
        lines.append("Файлы: " + ", ".join("`%s`" % os.path.basename(f) for f in files[:60]) + (" и ещё %d" % (len(files) - 60) if len(files) > 60 else ""))
        lines.append("")
    lines += ["## Лицензии", "",
              "- CC0 1.0: https://creativecommons.org/publicdomain/zero/1.0/",
              "- CC BY 3.0: https://creativecommons.org/licenses/by/3.0/",
              "- Freedoom (BSD 3-Clause): Copyright © 2001–2024 Contributors to the Freedoom project. All rights reserved. Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met: redistributions must retain the above copyright notice, this list of conditions and the disclaimer; neither the name of the Freedoom project nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES ARE DISCLAIMED.",
              "- Endless Sky: используются только записи, которые файл copyright проекта относит к общественному достоянию.", ""]
    with open(os.path.join(OUT, "CREDITS.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(__doc__); sys.exit(2)
    ROOTS.update({"A": os.path.abspath(sys.argv[1]), "B": os.path.abspath(sys.argv[2]), "C": os.path.abspath(sys.argv[3])})
    only = sys.argv[4:] if len(sys.argv) > 4 else None
    if only:
        for k in list(SPEC):
            if not any(fnmatch.fnmatch(k, p) for p in only): del SPEC[k]
    else:
        for d in ("ui", "step", "bcn", "amb", "mus", "fx"):
            for f in glob.glob(os.path.join(OUT, d, "*.ogg")): os.remove(f)
    defs, used, total = build()
    if not only:
        write_js(defs)
        write_credits(used)
    print("записей: %d, файлов: %d, %.1f МБ" % (len(defs), sum(len(d["f"]) for d in defs.values()), total / 1e6))
    if MISSING: print("НЕ НАЙДЕНО:\n  " + "\n  ".join(MISSING))
