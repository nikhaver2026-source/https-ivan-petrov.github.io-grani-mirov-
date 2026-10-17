#!/usr/bin/env python3
"""Сборка звуков «Подземной лаборатории».

Из свободных записей, скачанных сборщиком (.github/workflows/sfx-fetch.yml,
выпуск sfx-inbox, заходы 1–4), собирает папку lab/sounds: режет, обрезает
тишину, выравнивает громкость, делает петли, переводит в OGG Vorbis; пишет
lab/js/sounds.js (что звучит и откуда) и lab/sounds/CREDITS.md (авторы и
лицензии каждой записи). Записи под CC BY-SA и GPL не берутся.

Запуск: python3 lab/tools/build_sounds.py <exA> <exB> <exC> <exD> [шаблоны id]
(распакованные архивы заходов 1–4; заход 4 — живые записи Freesound, CC0,
авторы и названия — tools/sfx-fetch/fs_lab.tsv). Нужны ffmpeg (libvorbis) и numpy.
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
  # (заход F) Музыка, которую слышно и на динамике телефона: прежние треки
  # почти целиком лежали ниже 400 Гц. Kevin MacLeod, файлы с Wikimedia Commons.
  "lab_km_shadow1": ("Shadowlands 1 - Horizon", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Shadowlands_1_-_Horizon_(ISRC_USUAN1700034).mp3"),
  "lab_km_scp5": ("SCP-x5x (Outer Thoughts)", "Kevin MacLeod (incompetech.com)", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:SCP-x5x_(Outer_Thoughts)_by_Kevin_MacLeod.ogg"),
  "lab_km_sanctum": ("Inner Sanctum", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Inner_Sanctum_(ISRC_USUAN1100196).mp3"),
  "lab_km_hive": ("The Hive", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:The_Hive_(ISRC_USUAN1100711).mp3"),
  "lab_km_metaphysik": ("Metaphysik", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Metaphysik_(ISRC_USUAN1400056).mp3"),
  "lab_km_beast": ("Heart of the Beast", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Heart_of_the_Beast_(ISRC_USUAN1100209).mp3"),
  "lab_km_chaosnp": ("Controlled Chaos - no percussion", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Controlled_Chaos_-_no_percussion_(ISRC_USUAN1200060).mp3"),
  "lab_km_icedemon": ("Ice Demon", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Ice_Demon_(ISRC_USUAN1200061).mp3"),
  "lab_km_lazarus": ("Return of Lazarus", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Return_of_Lazarus_(ISRC_USUAN1200090).mp3"),
  "lab_km_shadow6": ("Shadowlands 6 - The Pit", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Shadowlands_6_-_The_Pit_(ISRC_USUAN1700039).mp3"),
  "lab_km_shadow7": ("Shadowlands 7 - Codex", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Shadowlands_7_-_Codex_(ISRC_USUAN1700040).mp3"),
  # (заход H и запас захода F) Музыка глубоких блоков: по четыре трека на блок.
  "lab_km_celeste": ("Mary Celeste", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Mary_Celeste_(ISRC_USUAN1500016).mp3"),
  "lab_km_scp3": ("SCP-x3x (I Am Not OK)", "Kevin MacLeod (incompetech.com)", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Scp_X3x_(I_Am_Not_OK)_by_Kevin_MacLeod.ogg"),
  "lab_km_gathering": ("Gathering Darkness", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Gathering_Darkness_(ISRC_USUAN1100849).mp3"),
  "lab_km_scp4": ("SCP-x4x (Mind Leech)", "Kevin MacLeod (incompetech.com)", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:SCP-x4x_(Mind_Leech)_by_Kevin_MacLeod.ogg"),
  "lab_km_magicforest": ("Magic Forest", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Magic_Forest_(ISRC_USUAN1600044).mp3"),
  "lab_km_ascendingtheva": ("Ascending the Vale", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Ascending_the_Vale_(ISRC_USUAN1600064).mp3"),
  "lab_km_lightlessdawn": ("Lightless Dawn", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Lightless_Dawn_(ISRC_USUAN1100655).mp3"),
  "lab_km_shadow4": ("Shadowlands 4 - Breath", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Shadowlands_4_-_Breath_(ISRC_USUAN1700037).mp3"),
  "lab_km_frostwaltz": ("Frost Waltz", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Frost_Waltz_(ISRC_USUAN1100516).mp3"),
  "lab_km_ghoststory": ("Ghost Story", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Ghost_Story_(ISRC_USUAN1300034).mp3"),
  "lab_km_satiate": ("Satiate - only strings", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Satiate_-_only_strings_(ISRC_USUAN1200056).mp3"),
  "lab_km_darkestchild": ("Darkest Child", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Darkest_Child_(ISRC_USUAN1100783).mp3"),
  "lab_km_industrialmusi": ("Industrial Music Box", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Industrial_Music_Box_(ISRC_USUAN1100812).mp3"),
  "lab_km_klockworx": ("Klockworx", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Klockworx_(ISRC_USUAN1100392).mp3"),
  "lab_km_unrelenting": ("Unrelenting", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Unrelenting_(ISRC_USUAN1100029).mp3"),
  "lab_km_static": ("Static Motion", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Static_Motion_(ISRC_USUAN1200062).mp3"),
  "lab_km_numinousshine": ("Numinous Shine", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Numinous_Shine_(ISRC_USUAN1100129).mp3"),
  "lab_km_infiniteperspe": ("Infinite Perspective", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Infinite_Perspective_(ISRC_USUAN1500024).mp3"),
  "lab_km_bathedinthelig": ("Bathed in the Light", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Bathed_in_the_Light_(ISRC_USUAN1100308).mp3"),
  "lab_km_spacial": ("Spacial Winds", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Spacial_Winds_(ISRC_USUAN1100203).mp3"),
  # Заход J: спокойная музыка для капсул восстановления (1.3)
  "lab_cap_clair": ("Clair de lune", "Claude Debussy; исполняет Laurens Goedhart", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Clair_de_lune_(Claude_Debussy)_Suite_bergamasque.ogg"),
  "lab_cap_gymno": ("Gymnopédie No. 1", "Erik Satie; исполняет Robin Alciatore (Musopen)", "общественное достояние", "https://commons.wikimedia.org/wiki/File:Erik_Satie_-_gymnopedies_-_la_1_ere._lent_et_douloureux.ogg"),
  "lab_cap_remin": ("Reminiscing", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Reminiscing_(ISRC_USUAN1100097).mp3"),
  "lab_cap_medit": ("Meditation Impromptu 02", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Meditation_Impromptu_02_(ISRC_USUAN1100162).mp3"),
  "lab_cap_guitar": ("Guitar Gentle", "PeriTune (peritune.com)", "CC BY 4.0", "https://peritune.com/music/PerituneMaterial_Guitar_Gentle_an.mp3"),
  "lab_cap_canon": ("Canon in D Major", "Johann Pachelbel; исполняет Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Canon_in_D_Major_(ISRC_USUAN1100301).mp3"),
  "lab_cap_musicbox": ("Music-box Gentle2", "PeriTune (peritune.com)", "CC BY 4.0", "https://peritune.com/wp-content/uploads/2017/09/PerituneMaterial_Music-box_Gentle2.mp3"),
  "lab_cap_silver": ("Silver Blue Light", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Silver_Blue_Light_(ISRC_USUAN1100718).mp3"),
  "lab_cap_wholesome": ("Wholesome", "Kevin MacLeod (incompetech.com)", "CC BY 4.0", "https://commons.wikimedia.org/wiki/File:Wholesome_by_Kevin_MacLeod.ogg"),
  "lab_cap_teddy": ("Teddy Bear Waltz", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Teddy_Bear_Waltz_(ISRC_USUAN1700064).mp3"),
  "lab_cap_dreamer": ("Dreamer", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Dreamer_(ISRC_USUAN1600043).mp3"),
  "lab_cap_avec": ("Avec Soin", "Kevin MacLeod (incompetech.com)", "CC BY 3.0", "https://commons.wikimedia.org/wiki/File:Avec_Soin_(ISRC_USUAN1100860).mp3"),
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

# Заходы 4, E и G: записи Freesound (CC0 и CC BY) — у каждой свой автор,
# своя страница и своя лицензия.
FS_META = {}
_fs_tsv = os.path.join(os.path.dirname(LAB), "tools", "sfx-fetch", "fs_lab.tsv")
if os.path.exists(_fs_tsv):
    for _l in open(_fs_tsv, encoding="utf-8"):
        if not _l.strip() or _l.startswith("#"): continue
        _c = _l.rstrip("\n").split("\t")
        FS_META[_c[0]] = (_c[3], _c[2])
        # шестой столбец — лицензия записи (CC BY 3.0/4.0); пусто — CC0
        _lic = _c[5].strip() if len(_c) > 5 and _c[5].strip() else CC0
        if "SA" in _lic or "NC" in _lic: continue
        PACKS["fs:" + _c[0]] = (_c[3], _c[2], _lic, "https://freesound.org/s/%s/" % _c[0])

def FS(i, **o):
    return S("D", "lab_fsD", "%s_*" % i, **o)

def PITCH(f):
    """Высота (и темп) в f раз — независимо от частоты исходника."""
    return "aresample=44100,asetrate=%d,aresample=44100" % int(round(44100 * f))

def SPL(i, k, af=None, start=0, dur=None, **so):
    """Запись Freesound, поделённая по паузам: k самых громких частей."""
    o = {}
    if af: o["af"] = af
    if start: o["start"] = start
    if dur: o["dur"] = dur
    return ("split", FS(i, **o), k, so)

def L(src, off=0.0, g=1.0):
    """Слой сведения: источник, сдвиг (с), громкость."""
    return (src, off, g)

def pack_of(path):
    rel = path
    for k, root in ROOTS.items():
        if path.startswith(root):
            rel = os.path.relpath(path, root)
    m = re.match(r"^(\d+)_\d+-hq\.(ogg|mp3)$", os.path.basename(path))
    if m and "fs:" + m.group(1) in PACKS:
        return "fs:" + m.group(1), rel
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

# Слышимость на динамике телефона: доля энергии выше 350 Гц, дБ.
AUDIBLE_MIN = -9.0
def audible_db(a):
    m = a if a.ndim == 1 else a.mean(axis=1)
    P = np.abs(np.fft.rfft(m.astype(np.float64))) ** 2
    fr = np.fft.rfftfreq(len(m), 1.0 / SR)
    return float(10 * np.log10(max(1e-12, P[fr >= 350].sum()) / max(1e-12, P.sum())))

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

def segments(a, need, min_len=0.12, max_len=2.4, gap=0.10, thr_db=-30.0, skip=0):
    """Части записи между паузами: рык, выстрел, шаг — каждый отдельно.
    Берутся самые громкие, затем по порядку во времени."""
    m = np.abs(a if a.ndim == 1 else a.mean(axis=1))
    w = max(1, int(0.01 * SR))
    env = np.sqrt(np.convolve(m ** 2, np.ones(w) / w, mode="same"))
    pk = env.max() if env.size else 0
    if pk <= 0: return []
    on = env > pk * 10 ** (thr_db / 20)
    segs, i, n = [], 0, len(on)
    g = int(gap * SR)
    while i < n:
        if not on[i]: i += 1; continue
        j = i
        quiet = 0
        while j < n and quiet < g:
            quiet = quiet + 1 if not on[j] else 0
            j += 1
        e = j - quiet
        if (e - i) >= min_len * SR:
            s0 = max(0, i - int(0.006 * SR)); e0 = min(n, e + int(0.05 * SR))
            if e0 - s0 > max_len * SR: e0 = s0 + int(max_len * SR)
            segs.append((float(env[i:e].max()), s0, e0))
        i = j
    segs = segs[skip:]
    segs.sort(key=lambda t: -t[0])
    segs = sorted(segs[:need], key=lambda t: t[1])
    return [fade(a[s0:e0], 0.003, 0.06) for _, s0, e0 in segs]

def ffx(a, af):
    """Готовый звук через фильтр ffmpeg (яркость, насыщение) — без смены длины."""
    if not af: return a
    ch = 1 if a.ndim == 1 else 2
    cmd = ["ffmpeg", "-nostdin", "-loglevel", "error", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-i", "-",
           "-af", af, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"]
    raw = subprocess.run(cmd, input=a.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    out = np.frombuffer(raw, dtype=np.float32).copy()
    return out.reshape(-1, 2) if ch == 2 else out

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

# ═════ ШАГИ: пол везде металлический, у каждого уровня свой; звонко и ярко ═════
# (заход G) Прежние шаги звучали глухо — почти вся энергия ниже 200 Гц. Теперь
# подъём середины и верха и возбудитель гармоник: шаг слышно чётко и на
# динамике телефона, и он ясно отличается от удара о стену. Низ не срезается
# (в наушниках у шага остаётся вес) — убирается только гул ниже 50 Гц, а
# гулкая середина низа у глухих записей лишь чуть приглушается.
BRIGHT = "highpass=f=50,equalizer=f=2600:t=q:w=1.1:g=6,treble=g=5:f=5000,aexciter=amount=2:drive=7:freq=2500"
BRIGHT2 = "highpass=f=50,lowshelf=f=160:g=-4,equalizer=f=1800:t=q:w=1.0:g=7,equalizer=f=3600:t=q:w=1.2:g=6,treble=g=6:f=6000,aexciter=amount=3:drive=8:freq=2200"
E("step_plate", "step", [SPL(208101, 10, af=BRIGHT, min_len=0.05), FS(144103, af=BRIGHT), SPL(698697, 3, af=BRIGHT2, min_len=0.2)], n=10, mx=0.4)
E("step_sheet", "step", [SPL(462598, 10, af=BRIGHT, min_len=0.05)], n=8, mx=0.4)
E("step_wetmetal", "step", [SPL(253735, 9, af=BRIGHT2, min_len=0.15)], n=8, mx=0.45)
E("step_steel", "step", [SPL(696374, 8, af=BRIGHT2, min_len=0.15), FS(384656, af=BRIGHT)], n=8, mx=0.4)
E("step_checker", "step", [SPL(455058, 10, af=BRIGHT, min_len=0.06)], n=8, mx=0.35)
E("step_frost", "step", [SPL(834029, 10, af="highpass=f=60,treble=g=4,aexciter=amount=1.5:drive=6:freq=3000", min_len=0.06)], n=8, mx=0.35)
E("step_armor", "step", [SPL(809440, 7, af=BRIGHT2, min_len=0.08), SPL(215308, 3, af=BRIGHT, start=3.2, min_len=0.06)], n=8, mx=0.4)
E("step_catwalk", "step", [SPL(669095, 10, min_len=0.05, af="aexciter=amount=1:drive=5:freq=3000"), SPL(770804, 4, min_len=0.05)], n=9, mx=0.4)
E("step_deck", "step", [("slice", FS(148462, af=PITCH(0.96) + "," + BRIGHT2), 5), ("slice", FS(149454, af=PITCH(0.96) + "," + BRIGHT2), 4)], n=8, mx=0.45)
E("step_grate", "step", [SPL(398937, 10, min_len=0.08, af="highpass=f=50,treble=g=3:f=4000")], n=8, mx=0.4)
# Отзвук шага от стены рядом: короткий высокий щелчок — тише и выше самого шага.
E("step_echo", "step", [SPL(208101, 4, af="highpass=f=1100,treble=g=4:f=5000", min_len=0.05)], n=4, mx=0.18, v=0.8)
E("door_threshold", "step", [S(A, "lab_metalsteps*", "metal_steps_1[3-6].flac", af="asetrate=44100*0.7,aresample=44100")], n=3, v=0.6)

# ═════ СТЕНЫ И СТОЛКНОВЕНИЯ ═════
# Удар о стену — один и тот же звук: звонкий удар по стальному листу с
# гулом корпуса (заход G). Ниже — отдельный глухой слой, «тело» стены.
E("bump_wall", "mixv", [[L(FS(334680, start=0.5, dur=0.9)), L(FS(209772, start=0.2, dur=0.9), 0.0, 0.55), L(FS(42729, dur=0.6), 0.0, 0.25)]], mx=0.9, v=0.95, tgt=-15.0)
E("bump_wall_thud", "sfx", [FS(445775, start=0.6, dur=0.35)], n=1, mx=0.35, v=0.8)
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
# ═════ АВТОМАТЫ С НАПИТКАМИ, КОМПЬЮТЕРЫ, ЛЕСТНИЦЫ (заход 5, Freesound, CC0) ═════
E("coffee_brew", "sfx", [FS(161216, start=0.6, dur=3.0), FS(333948, start=8.8, dur=3.0)], n=2, mx=3.2, v=0.85)
E("coffee_idle", "sfx", [FS(153290, start=0.25, dur=1.0)], n=1, mx=1.1, v=0.6)
E("bcn_coffee", "bcn", [FS(153290, start=0.2, dur=0.45)], bus="beacon", v=0.5)
E("vend_coin", "sfx", [FS(696745, dur=1.3), FS(186391, start=1.25, dur=1.2)], n=2, mx=1.4, v=0.8)
E("can_drop", "sfx", [FS(250194, start=5.05, dur=1.15), FS(191457, start=4.6, dur=1.0)], n=2, mx=1.3, v=0.9)
E("can_open", "sfx", [SPL(418988, 2), FS(386887, start=1.05, dur=0.5)], n=3, mx=0.6, v=0.8)
E("vend_hum", "sfx", [FS(377633, start=0.5, dur=1.4)], n=1, mx=1.5, v=0.55)
E("bcn_drinks", "bcn", [FS(377633, start=2.0, dur=0.5)], bus="beacon", v=0.55)
E("vend_hit", "sfx", [SPL(637820, 3)], n=3, mx=0.7, v=0.95)
E("drink_sip", "sfx", [FS(320139, dur=2.3), FS(360475, start=0.3, dur=2.2)], n=2, mx=2.4, v=0.8)
E("drink_gulp", "sfx", [FS(187951, dur=2.0), FS(397611, dur=2.3)], n=2, mx=2.4, v=0.85)
E("chair_sit", "sfx", [FS(503634, start=0.45, dur=1.2), FS(147759, start=0.2, dur=0.5)], n=2, mx=1.3, v=0.75)
E("chair_up", "sfx", [FS(503634, start=2.25, dur=1.2), FS(431857, start=0.4, dur=1.1)], n=2, mx=1.3, v=0.75)
E("pc_boot", "sfx", [FS(415594, dur=2.6), FS(52050, start=0.6, dur=2.4)], n=2, mx=2.7, v=0.7)
E("pc_click", "sfx", [SPL(347544, 3), FS(79388, start=0.16, dur=0.5)], n=4, mx=0.6, v=0.6)
E("pc_type", "sfx", [FS(79388, start=0.16, dur=1.3), FS(331656, start=2.0, dur=1.3)], n=2, mx=1.4, v=0.6)
E("pc_ok", "sfx", [FS(250104)], n=1, mx=0.3, v=0.6)
E("pc_error", "mixv", [[L(FS(250104, af=PITCH(0.72))), L(FS(250104, af=PITCH(0.72)), 0.2, 0.9)]], mx=0.6, v=0.7)
E("bcn_pc", "bcn", [FS(250104, af=PITCH(1.25))], bus="beacon", v=0.45)
E("stair_step", "step", [SPL(365412, 10, min_len=0.12), ("slice", FS(452421), 4)], n=10, mx=0.55)
E("bump_rail", "sfx", [SPL(637820, 1, af=PITCH(1.35))], n=1, mx=0.5, v=0.7)
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
# (заход G) Мощнее и чище: у каждого выстрела — яркая атака (её слышно и на
# телефоне), тело выстрела и, у тяжёлых, низкий удар. Чем круче оружие, тем
# тяжелее звук: лёгкий бластер — хлёсткий «пиу», импульсный — сдвоенный,
# тяжёлый — с раскатом; глубже — слои мощи (w_power_*), их добавляет игра.
SAT = "volume=8dB,asoftclip=type=tanh,lowpass=f=2400"
E("w_melee", "mixv", [[L(FS(427979, start=0.25, dur=0.3)), L(FS(422513), 0.0, 0.8)],
                      [L(FS(427979, start=1.30, dur=0.3)), L(FS(422513, af=PITCH(0.9)), 0.0, 0.8)],
                      [L(FS(422513)), L(FS(427979, start=0.25, dur=0.3, af=PITCH(0.9)), 0.0, 0.6)],
                      [L(FS(427979, start=1.30, dur=0.3, af=PITCH(1.1))), L(FS(719636), 0.0, 0.5)]], mx=0.5,
  post="highpass=f=45,equalizer=f=1400:t=q:w=1.0:g=4,treble=g=3:f=4000")
# Дубинка с разрядником: тяжёлый замах и злой треск высокого напряжения с гулом тока.
E("w_shock", "mixv", [[L(FS(422513), 0.0, 0.7), L(FS(403252, start=0.70, dur=0.62), 0.04), L(FS(30933, start=0.0, dur=0.5, af="highpass=f=40"), 0.06, 0.55), L(FS(512471), 0.04, 0.8)],
                      [L(FS(719636), 0.0, 0.7), L(FS(403252, start=1.62, dur=0.55), 0.04), L(FS(19487, start=0.03, dur=0.6), 0.06, 0.6), L(FS(30933, start=1.6, dur=0.45, af="highpass=f=40"), 0.06, 0.5)],
                      [L(FS(427979, start=0.25, dur=0.3), 0.0, 0.7), L(FS(403252, start=2.20, dur=0.6), 0.04), L(FS(136542, dur=0.45), 0.08, 0.55), L(FS(30933, start=0.5, dur=0.45, af="highpass=f=40"), 0.06, 0.5)]], mx=1.0, tgt=-14.0)
E("w_shock_crack", "sfx", [SPL(556717, 2, min_len=0.1), FS(512471), FS(582631, start=0.1, dur=0.6), FS(19487, start=0.04, dur=0.4)], n=4, mx=0.6)
E("w_vibro", "mixv", [[L(FS(47125, start=0.06, dur=0.7)), L(FS(557194, start=0.06, dur=0.5), 0.0, 0.7), L(FS(427979, start=0.25, dur=0.3), 0.04, 0.5)],
                      [L(FS(47125, start=0.06, dur=0.7, af=PITCH(1.12))), L(FS(557194, start=0.1, dur=0.5, af=PITCH(1.1)), 0.0, 0.7), L(FS(422513), 0.03, 0.5)]], mx=0.75)
E("w_cutter", "mixv", [[L(FS(62925, start=0.17, dur=0.6)), L(FS(569901), 0.0, 0.6), L(FS(675752, start=7.2, dur=0.5), 0.05, 0.5)],
                       [L(FS(62925, start=1.20, dur=0.6)), L(FS(450768, dur=0.5), 0.0, 0.5), L(FS(244230, start=3.0, dur=0.5), 0.05, 0.5)]], mx=0.8)
# Бластеры — по нарастанию мощи.
E("w_blaster_s", "mixv", [[L(FS(466867, dur=0.5))], [L(FS(466834, dur=0.7))], [L(FS(77087, start=0.125, dur=0.6))],
                          [L(FS(466867, dur=0.5, af=PITCH(1.06))), L(FS(512471), 0.0, 0.25)]], mx=0.7)
E("w_blaster_p", "mixv", [[L(FS(214990, start=0.30, dur=0.6)), L(FS(39023, dur=0.35), 0.0, 0.45)],
                          [L(FS(214990, start=2.15, dur=0.6)), L(FS(39023, dur=0.35, af=PITCH(1.08)), 0.0, 0.45)],
                          [L(FS(214990, start=4.43, dur=0.6)), L(FS(569901, dur=0.3), 0.0, 0.35)],
                          [L(FS(620848, dur=0.62))], [L(FS(620848, start=0.72, dur=0.6))]], mx=0.75)
E("w_blaster_h", "mixv", [[L(FS(531861, start=0.1, dur=1.1)), L(FS(553418, start=0.04, dur=0.9, af=SAT), 0.02, 0.45)],
                          [L(FS(378185, dur=1.2)), L(FS(512471), 0.0, 0.3)],
                          [L(FS(420687, dur=1.3)), L(FS(222517, dur=0.9, af=SAT), 0.0, 0.3), L(FS(512471), 0.0, 0.35)]], mx=1.3, tgt=-14.0)
E("w_laser", "mixv", [[L(FS(376694, start=0.205, dur=0.8))],
                      [L(FS(234083, dur=0.7)), L(FS(376694, start=0.18, dur=0.5, af="highpass=f=800"), 0.0, 0.5)],
                      [L(FS(196914, dur=0.9)), L(FS(376694, start=0.18, dur=0.5, af="highpass=f=800," + PITCH(1.1)), 0.0, 0.45)]], mx=0.9)
E("w_ion", "mixv", [[L(FS(403253, start=0.9, dur=0.4), 0.0, 0.9), L(FS(814049, dur=0.6), 0.0, 0.7), L(FS(512471), 0.0, 0.4)],
                    [L(FS(403253, start=3.05, dur=0.5), 0.0, 0.9), L(FS(814049, start=0.6, dur=0.6), 0.0, 0.7)],
                    [L(FS(403253, start=5.98, dur=0.6), 0.0, 0.9), L(FS(110564, start=1.3, dur=0.5, af="highpass=f=40"), 0.0, 0.5), L(FS(556717, start=0.15, dur=0.45), 0.02, 0.5)]], mx=0.9)
E("w_plasma", "mixv", [[L(FS(450768, dur=0.8)), L(FS(175267, dur=0.5, af="highpass=f=300"), 0.0, 0.5)],
                       [L(FS(175267, dur=1.0)), L(FS(569901), 0.0, 0.5)],
                       [L(FS(15350, start=0.42, dur=0.8)), L(FS(450768, dur=0.4, af="highpass=f=400"), 0.0, 0.5)]], mx=1.0)
E("w_magnetron", "mixv", [[L(FS(330629, dur=0.9)), L(FS(264779), 0.0, 0.6), L(FS(209860, dur=0.5, af="highpass=f=200"), 0.0, 0.5)],
                          [L(FS(330629, dur=0.9, af=PITCH(1.1))), L(FS(265247, start=1.3, dur=0.4), 0.0, 0.5), L(FS(209860, start=0.5, dur=0.5, af="highpass=f=200"), 0.0, 0.5)]], mx=1.0)
E("w_resonator", "mixv", [[L(FS(244983), 0.0, 0.8), L(FS(66091, dur=1.0), 0.0, 0.6), L(FS(330629, dur=1.0, af=PITCH(0.75)), 0.0, 0.7)],
                          [L(FS(244983, af=PITCH(0.9)), 0.0, 0.8), L(FS(66091, start=2.0, dur=1.0, af=PITCH(1.12)), 0.0, 0.6), L(FS(330629, dur=1.0, af=PITCH(0.7)), 0.0, 0.7)]], mx=1.3)
# Позитрон: короткий втягивающий вдох — и удар аннигиляции.
E("w_positron", "mixv", [[L(FS(75329, start=1.0, dur=0.31), 0.0, 0.7), L(FS(155790), 0.26), L(FS(512471), 0.26, 0.4)],
                         [L(FS(121942, start=0.2, dur=0.4), 0.0, 0.6), L(FS(155790, af=PITCH(1.08))), L(FS(512471), 0.0, 0.4)]], mx=1.5, tgt=-14.0)
E("w_pcannon", "mixv", [[L(FS(160880, dur=2.2)), L(FS(553418, start=0.04, dur=1.6, af=SAT), 0.03, 0.6)],
                        [L(FS(807665, start=0.95, dur=1.0)), L(FS(39020, dur=1.7), 0.05, 0.8), L(FS(512471), 0.0, 0.4)],
                        [L(FS(807665, dur=0.95)), L(FS(104397, start=0.05, dur=1.7), 0.05, 0.7), L(FS(500546, start=0.62, dur=0.9), 0.0, 0.45)]], mx=2.2, tgt=-13.0)
E("w_gauss", "mixv", [[L(FS(767161, dur=1.2)), L(FS(394672, af=PITCH(1.12)), 0.0, 0.45)],
                      [L(FS(557515, start=0.5, dur=1.3))],
                      [L(FS(767161, dur=1.2, af=PITCH(0.92))), L(FS(553418, start=0.04, dur=1.0, af=SAT), 0.02, 0.45)]], mx=1.3, tgt=-14.0)
E("w_cryo", "mixv", [[L(FS(174436, dur=0.7)), L(FS(452645, start=0.6, dur=0.6), 0.05, 0.5)],
                     [L(FS(550267, dur=1.1)), L(FS(396447, start=0.4, dur=0.6), 0.0, 0.5)],
                     [L(FS(174436, dur=0.7, af=PITCH(0.9))), L(FS(550267, start=0.4, dur=0.7), 0.1, 0.5)]], mx=1.0)
E("w_thermo", "mixv", [[L(FS(459884, dur=0.8)), L(FS(472688, dur=0.6), 0.0, 0.6)],
                       [L(FS(395038, start=7.35, dur=0.8)), L(FS(472688, dur=0.6, af=PITCH(1.1)), 0.0, 0.5)],
                       [L(FS(459884, start=0.6, dur=0.8)), L(FS(260554, start=0.1, dur=0.6, af="highpass=f=40"), 0.0, 0.5)]], mx=0.9)
# Слои мощи: низкий удар (от второй ступени), треск разряда (от четвёртой),
# раскат (от шестой) — их добавляет atmos.js по силе оружия.
E("w_power_low", "sfx", [FS(553418, start=0.04, dur=1.3, af=SAT), FS(222517, dur=1.3, af=SAT), FS(39020, dur=1.2, af="lowpass=f=900," + SAT)], n=3, mx=1.4)
E("w_power_crack", "sfx", [FS(19487, start=0.03, dur=0.5), FS(556717, start=0.14, dur=0.5), FS(187363, start=1.05, dur=0.45), FS(512471)], n=4, mx=0.6)
E("w_power_tail", "sfx", [FS(222517, start=0.6, dur=2.2, af="lowpass=f=3000"), FS(553418, start=0.7, dur=2.0, af="lowpass=f=3000")], n=2, mx=2.2, v=0.9)
E("w_empty", "sfx", [FS(674568), FS(842748), FS(725402)], n=3, v=0.9, mx=0.4)
E("w_reload_e", "mixv", [[L(FS(679546, dur=1.0)), L(FS(196907, dur=1.0), 0.3, 0.4)],
                         [L(FS(645778, dur=0.9)), L(FS(213607, dur=0.4), 0.45, 0.6)]], mx=1.4)
E("w_reload_m", "sfx", [FS(674742)], mx=1.8)
E("w_reload_p", "mixv", [[L(FS(725397, start=2.0, dur=1.6)), L(FS(210878, start=3.0, dur=0.5), 1.1, 0.35)]], mx=2.0)
E("w_draw", "sfx", [FS(725400, start=1.35, dur=0.65)], mx=0.8)
E("w_holster", "sfx", [FS(725400, start=2.1, dur=0.35), FS(725400, start=0.0, dur=0.3)], n=2, mx=0.6)
E("w_switch", "sfx", [FS(725400, start=6.2, dur=0.5)], mx=0.6)

# ═════ ТУРЕЛИ, КАМЕРЫ, ОКО (заход G) ═════
E("turret_servo", "sfx", [FS(418881, dur=0.8), FS(264592, dur=0.9)], n=2, mx=0.9, v=0.8)
E("turret_lock", "sfx", [FS(189327, dur=1.3)], n=1, mx=1.3, v=0.7)
E("cam_spot", "mixv", [[L(FS(202530, start=0.08)), L(FS(18726), 0.05, 0.6)], [L(FS(202530, start=0.08, af=PITCH(1.12))), L(FS(18725, dur=0.6), 0.05, 0.6)]], mx=0.9, v=0.8)
E("oko_chime", "sfx", [FS(238428, dur=1.9), FS(244583, dur=2.9)], n=2, mx=3.0, v=0.85)
E("oko_alarm", "sfx", [FS(32088, dur=2.95), FS(54047)], n=2, mx=3.0, v=0.75)

# ═════ ПОПАДАНИЯ, ВЗРЫВЫ ═════
E("hit_metal", "sfx", [SPL(144444, 6, min_len=0.1), SPL(675951, 4, min_len=0.3)], n=8, mx=0.7)
E("hit_flesh", "sfx", [S(A, "lab_squish8*", "impactsplat0[78]*"), S(C, "lab_kimpact", "impactPunch_heavy_00[0-2].ogg"), FS(30931)], n=6, mx=0.7)
E("impact_wall", "sfx", [SPL(182262, 5, min_len=0.5)], n=4, mx=0.6)
E("impact_positron", "sfx", [S(A, "lab_git_es", "explosion tiny.flac")])
E("impact_wave", "sfx", [S(A, "lab_git_es", "ion impact.flac")], mx=0.9)
E("swing_miss", "sfx", [SPL(427979, 3, start=6.0, dur=8.0, min_len=0.08)], n=3, mx=0.5)
E("swing_by", "sfx", [FS(507466), FS(562191)], n=2, mx=0.5)
E("bullet_by", "mixv", [[L(FS(855248)), L(FS(507466), 0.0, 0.35)]], mx=0.5)
E("explosion_small", "sfx", [FS(336011), S(A, "lab_git_es", "explosion small.flac")], n=2, mx=1.5)
E("explosion_big", "sfx", [FS(490266), S(A, "lab_git_es", "explosion large.flac")], n=2, mx=2.6)
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
foe("rat", [SPL(217767, 4), SPL(574107, 3, af=PITCH(0.85))], [SPL(134791, 2, min_len=0.4), SPL(463789, 2, af=PITCH(0.8))], [SPL(536753, 2), SPL(485952, 1, af=PITCH(1.3))], [SPL(536753, 2, af=PITCH(0.9)), SPL(217767, 2, start=8.0, dur=8.0, af=PITCH(1.1))], [SPL(134791, 1, af=PITCH(0.8), min_len=0.4), SPL(574107, 1, af=PITCH(0.7), min_len=0.6)])
foe("roach", [SPL(811205, 3)], [SPL(811205, 2, af=PITCH(0.85)), SPL(547898, 2, start=1.0, dur=8.0)], [FS(380769, start=5.0, dur=1.0), SPL(811205, 1, af=PITCH(1.2))], [SPL(811205, 2, af=PITCH(1.25))], [SPL(547446, 2), FS(751340)])
foe("labmut", [SPL(769200, 4, af=PITCH(0.95)), SPL(130627, 2)], [FS(179345), FS(323819), FS(204820)], [SPL(181068, 4)], [FS(555426), SPL(633193, 2)], [FS(612699, start=1.3, dur=3.0), FS(108445)])
foe("slug", [SPL(680447, 3, start=6.0, dur=20.0, min_len=0.3), SPL(666969, 2, min_len=0.3)], [SPL(794272, 2, min_len=0.4), FS(516643)], [SPL(547446, 3)], [SPL(666969, 2, start=10.0, dur=10.0)], [FS(751340), SPL(680447, 1, af=PITCH(0.8), min_len=0.8)])
foe("vine", [SPL(666969, 3, start=4.0, dur=30.0, min_len=0.4), S(A, "lab_metalwood*", "wood_cracking_0[1-4].ogg", af="lowpass=f=2500")], [SPL(794272, 2, min_len=0.5)], [SPL(427979, 2, min_len=0.08), S(A, "lab_metalwood*", "wood_cracking_0[1-2].ogg")], [S(A, "lab_metalwood*", "wood_cracking_0[34].ogg")], [S(A, "lab_metalwood*", "wood_breaking_0[12].ogg")])
foe("spore", [SPL(680447, 3, start=8.0, dur=40.0, min_len=0.35, af=PITCH(0.8))], [FS(146963, af=PITCH(0.75))], [FS(485952, af=PITCH(0.7)), S(A, "lab_creat80_*", "spit_0[1-3].ogg")], [SPL(547446, 2, af=PITCH(0.8))], [SPL(680447, 1, min_len=1.0), FS(30931)])
foe("swamp", [FS(620080, af=PITCH(0.72)), SPL(352698, 2, af=PITCH(0.7))], [SPL(352698, 2, af=PITCH(0.78), min_len=0.4)], [SPL(404920, 2, start=5.0, dur=12.0, af=PITCH(0.85))], [SPL(344972, 2, af=PITCH(0.75))], [FS(344972, start=2.6, dur=2.0, af=PITCH(0.7))])
foe("chimera", [SPL(488348, 3, af=PITCH(0.95), min_len=0.8)], [SPL(69570, 2, start=11.0, dur=12.0)], [SPL(204609, 2), FS(204611)], [SPL(69571, 2)], [FS(366096, dur=4.0)])
foe("lizard", [FS(679954, af=PITCH(0.8)), SPL(363105, 2, af=PITCH(0.75))], [FS(255405)], [SPL(154641, 3)], [SPL(154641, 2, start=10.0, dur=10.0, af=PITCH(1.1))], [FS(734841)])
foe("weaver", [SPL(547898, 3, start=1.0, dur=10.0, af=PITCH(0.8))], [FS(146558)], [S(A, "lab_creat80_*", "spit_0[12].ogg"), SPL(811205, 1, af=PITCH(0.9))], [SPL(811205, 2, af=PITCH(1.1))], [FS(30931), SPL(547446, 1)])
foe("blind", [SPL(393518, 3, min_len=1.0)], [SPL(366837, 2)], [SPL(479380, 3)], [FS(354182, af=PITCH(1.15))], [FS(568000)])
foe("spark", [SPL(675752, 3, min_len=0.6)], [FS(188949, dur=2.0)], [SPL(403253, 2)], [FS(264779)], [FS(559621), FS(210878, dur=1.0)])
foe("frozen", [SPL(444444, 3, start=1.0, dur=20.0, min_len=0.8, af=PITCH(0.85))], [FS(467287, dur=3.0)], [S(A, "lab_creat80b*", "stomp_01.ogg"), FS(42201, dur=1.4)], [S(C, "lab_kimpact", "impactGlass_medium_00[0-1].ogg"), FS(567998)], [S(B, "bsb_lab_glass", "1591*"), FS(568000)])
foe("thawed", [FS(483592, start=2.0, dur=2.0), FS(483592, start=9.0, dur=2.0)], [FS(396797)], [SPL(181068, 2, start=12.0, dur=12.0)], [FS(567998, af=PITCH(1.05))], [S(A, "lab_squish8*", "impactsplat05*"), FS(30931)])
foe("soldier", [SPL(181068, 3, af=PITCH(0.82))], [FS(323819, af=PITCH(0.85))], [SPL(452154, 3)], [SPL(633193, 2, af=PITCH(0.85))], [FS(555426, af=PITCH(0.8)), FS(612699, start=1.4, dur=2.5, af=PITCH(0.85))], step=[SPL(698697, 4, af=PITCH(0.9), min_len=0.2)])
foe("phase", [S(C, "lab_ghostvoice*", "*GhostMoan0[15].flac")], [SPL(518297, 1, min_len=2.0)], [FS(565024, start=2.4, dur=2.3)], [FS(725210, dur=1.0)], [FS(813270, start=12.2, dur=2.6)])
foe("proto", [FS(240311, start=0.0, dur=2.0), FS(240311, start=6.0, dur=2.0)], [SPL(479380, 3, start=15.0, dur=20.0)], [SPL(479380, 2, start=0.0, dur=12.0)], [FS(354182)], [FS(366096, dur=5.0)], step=[SPL(809440, 3, af=PITCH(0.7), min_len=0.08)])
# общие голоса тварей
E("mutant_alert", "sfx", [SPL(769200, 3), FS(179345), FS(204820)], n=4, mx=1.8)
E("mutant_attack", "sfx", [SPL(204609, 1), FS(204610), FS(204611), SPL(154641, 2)], n=4, mx=1.2)
E("mutant_idle", "sfx", [SPL(393518, 2, min_len=1.0), SPL(769200, 2, start=14.0, dur=17.0)], n=4, mx=1.6)
E("mutant_hurt", "sfx", [FS(567998), FS(555426), SPL(633193, 2)], n=4, mx=1.0)
E("mutant_death", "sfx", [FS(559621), FS(568000), FS(734841)], n=3, mx=2.6)
E("mutant_step", "step", [("slice", FS(50724, af=PITCH(0.78)), 3), SPL(696374, 2, af=PITCH(0.75), min_len=0.15)], n=4, v=0.8)
E("mutant_summon", "sfx", [FS(240311, start=0.0, dur=3.0)], mx=3.0)

# ═════ РОБОТЫ ═════
foe("drone", [FS(387985, start=5.0, dur=1.8), FS(387985, start=20.0, dur=1.8), FS(854382, start=1.0, dur=1.8)], [FS(343366, start=0.0, dur=1.6), S(C, "lab_bitvoice*", "*aggro-00[12].mp3")], [FS(343366, start=2.0, dur=1.0)], [SPL(144444, 2, min_len=0.1)], [FS(675752, start=5.7, dur=1.0), S(A, "lab_git_es", "explosion tiny.flac")])
foe("spiderbot", [FS(723999, start=10.1, dur=0.8), FS(723999, start=11.6, dur=0.75), FS(740245)], [FS(740245, af=PITCH(1.2)), FS(505670)], [FS(406557, dur=0.6), SPL(687242, 2)], [SPL(144444, 2, min_len=0.1)], [FS(675752, start=7.0, dur=1.2)], step=[SPL(611355, 6, af=PITCH(1.25), min_len=0.06)], sv=0.8)
foe("repairbot", [FS(611356, start=4.0, dur=1.8)], [FS(611356, start=16.6, dur=1.2)], [FS(611356, start=19.8, dur=1.4)], [SPL(144444, 2, min_len=0.1)], [FS(675752, start=11.2, dur=1.5), S(A, "lab_git_es", "explosion small.flac")], step=[S(C, "lab_robosteps*", "robot[13].flac")])
foe("turret", [SPL(322021, 3, min_len=0.4)], [FS(322021, start=7.5, dur=1.2), S(A, "lab_digital63*", "pepSound3.mp3")], [FS(165042, start=1.0, dur=0.7), FS(165042, start=8.0, dur=0.7), FS(165042, start=15.0, dur=0.9)], [SPL(144444, 2, min_len=0.1)], [S(A, "lab_git_es", "explosion small.flac"), FS(336011)])
foe("guardbot", [FS(813066, dur=2.0), FS(813071, dur=2.0)], [FS(813062, dur=1.6), FS(813069, dur=1.6)], [FS(483536), FS(484036)], [SPL(675951, 2, min_len=0.3)], [FS(490266, dur=2.5)], step=[FS(813053), FS(813054)], sv=0.9)
foe("android", [SPL(824121, 3, start=8.9, dur=8.0, min_len=0.15)], [FS(813075), FS(813077, dur=1.8)], [FS(717584, start=0.25, dur=0.8), FS(803497)], [SPL(144444, 2, min_len=0.1)], [FS(210878, dur=1.5), FS(675752, start=14.4, dur=2.0)], step=[SPL(698697, 4, af=PITCH(0.95), min_len=0.2)], sv=0.7)
foe("watcher", [FS(813072, dur=2.2)], [FS(813067, dur=2.0)], [FS(244983)], [SPL(675951, 2, min_len=0.3)], [FS(490266, dur=2.0)], step=[SPL(342235, 4)])
foe("shieldbot", [S(A, "lab_shield*", "*- 4.flac")], [FS(813077, dur=1.6)], [FS(406557, dur=0.6)], [S(A, "lab_shield*", "*- 7.flac")], [S(A, "lab_git_es", "explosion medium.flac")], step=[FS(813055), FS(813056)])
foe("sapper", [S(A, "lab_ibeeps*", "beep-1[0-3].flac")], [S(C, "lab_bitvoice*", "*aggro-006.mp3")], [S(A, "lab_metalwood*", "metal_spring_02.ogg")], [SPL(144444, 1, min_len=0.1)], [S(A, "lab_git_es", "explosion medium.flac"), FS(336011)], step=[SPL(611355, 4, af=PITCH(1.5), min_len=0.06)], sv=0.5)
foe("hunter", [FS(505670), FS(740245, af=PITCH(0.9))], [FS(813074, dur=2.0)], [FS(406557, dur=0.5, af=PITCH(1.2)), SPL(687242, 1)], [SPL(144444, 2, min_len=0.1)], [FS(675752, start=16.7, dur=1.3)], step=[SPL(611355, 5, af=PITCH(1.1), min_len=0.06)], sv=0.6)
foe("mortar", [S(A, "lab_rts*", "artil.ready.flac")], [S(A, "lab_rts*", "artil.select.flac")], [S(A, "lab_rts*", "artil.action.flac")], [SPL(675951, 1, min_len=0.3)], [S(A, "lab_rts*", "artil.die.flac"), FS(490266, dur=2.0)], step=[FS(815039)])
E("mortar_fire", "sfx", [S(A, "lab_rts*", "artil.action.flac")], mx=1.6)
foe("relay", [S(A, "lab_scifi_k*", "computerNoise_003.ogg", dur=1.6)], [S(B, "bsb_lab_radio", "2618*", start=3.0, dur=1.8)], [S(A, "lab_git_freedoom", "dsradio.flac")], [S(A, "lab_scifi_k*", "forceField_00[23].ogg")], [S(A, "lab_electric_deathboom*", "*.flac")])
foe("micro", [FS(387985, start=30.0, dur=1.5, af=PITCH(1.6))], [S(A, "lab_creat80b*", "bug_0[5-7].ogg", af="asetrate=44100*1.5,aresample=44100")], [FS(264779, af=PITCH(1.4))], [S(A, "lab_interface*", "glitch_00[1-3].ogg")], [S(A, "lab_git_es", "explosion tiny.flac", af="asetrate=44100*1.4,aresample=44100")])
foe("titan", [FS(739197, start=0.4, dur=1.7, af=PITCH(0.8)), FS(813072, dur=2.0, af=PITCH(0.8))], [FS(813066, dur=2.0, af=PITCH(0.85))], [FS(162260, start=2.9, dur=2.0), FS(239138, dur=1.0)], [SPL(675951, 2, af=PITCH(0.8), min_len=0.3)], [FS(490266)], step=[SPL(837389, 4), SPL(342235, 2, af=PITCH(0.85))], sv=1.0)
# общие голоса роботов
E("robot_alert", "sfx", [FS(813062, dur=1.5), FS(813069, dur=1.5), FS(813075), S(C, "lab_bitvoice*", "*aggro-00[1-2].mp3")], n=5)
E("robot_attack", "sfx", [FS(717584, start=0.25, dur=0.8)])
E("robot_idle", "sfx", [SPL(824121, 2, start=8.9, dur=8.0, min_len=0.15), FS(723999, start=10.1, dur=0.8), FS(740245)], n=4, mx=1.2)
E("robot_hurt", "sfx", [SPL(144444, 4, min_len=0.1)], n=4, mx=0.7)
E("robot_death", "sfx", [FS(210878, dur=1.6), FS(490266, dur=2.0)], n=2, mx=2.0)
E("robot_step", "step", [SPL(611355, 4, min_len=0.06), FS(211957)], n=5, mx=0.7, v=0.85)
E("robot_radio", "sfx", [S(A, "lab_git_freedoom", "dsradio.flac"), S(C, "lab_comp9*", "tick.flac")], n=2)
E("robot_dodge", "sfx", [FS(740245, af=PITCH(1.3)), FS(505670, af=PITCH(1.2))], n=2)
E("robot_retreat", "sfx", [S(A, "lab_rts*", "destroyer.underattack.flac")])
E("robot_repair", "sfx", [S(A, "lab_metalwood*", "tools_1[0-2].ogg")], n=3)
E("robot_summon", "sfx", [S(A, "lab_digital63*", "powerUp8.mp3"), S(C, "lab_comp9*", "teleport.flac")], n=2)
E("robot_hello", "sfx", [S(B, "bsb_lab_robot", "1973*")])
E("npc_hello", "sfx", [S(A, "lab_creat80b*", "human_0[1-4].ogg")], n=4, v=0.7)
E("foe_aim", "sfx", [S(A, "lab_electric_charge.wav", "*.flac", start=0.0, dur=0.7)], v=0.9, mx=0.7)
E("foe_shot_energy", "mixv", [[L(FS(717585, start=0.6, dur=0.8)), L(FS(331240, start=6.4, dur=0.4), 0.0, 0.5)], [L(FS(392229)), L(FS(331240, start=8.0, dur=0.4), 0.0, 0.5)]], mx=0.9)
E("foe_shot_shock", "sfx", [FS(403253, start=7.05, dur=0.5), FS(403253, start=9.65, dur=0.5)], n=2, mx=0.7)
E("foe_shot_spit", "sfx", [S(A, "lab_creat80_*", "spit_0[1-3].ogg")], n=3)
E("foe_shot_cold", "sfx", [FS(371839, start=3.55, dur=0.6), FS(371839, start=7.6, dur=0.9)], n=2, mx=0.8)
E("foe_shot_phys", "sfx", [FS(482122), FS(239138, dur=1.0)], n=2, mx=1.2)
E("shield_up", "sfx", [S(A, "lab_shield*", "*- 4.flac")], mx=1.2)
E("shield_break", "sfx", [S(C, "lab_kimpact", "impactGlass_heavy_00[0-2].ogg"), S(A, "lab_shield*", "*- 9.flac")], n=3, mx=1.2)
E("shield_hit_foe", "sfx", [S(A, "lab_shield*", "*- 8.flac")], mx=0.8)
E("phase_out", "sfx", [S(A, "lab_digital63*", "phaseJump4.mp3")])
E("phase_in", "sfx", [S(A, "lab_git_freedoom", "dstelept.flac")])

E("w_magnetron_r", "mixv", [[L(FS(699655), 0.0, 0.8), L(FS(330629, dur=1.1, af=PITCH(0.85)), 0.0, 0.9), L(FS(209860, dur=0.8, af="highpass=f=150"), 0.05, 0.5)], [L(FS(699655, af=PITCH(1.06)), 0.0, 0.8), L(FS(330629, dur=1.1, af=PITCH(0.8)), 0.0, 0.9), L(FS(210878, start=0.5, dur=0.6), 0.0, 0.4)]], mx=1.3, tgt=-14.5)

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
E("ev_skitter", "sfx", [FS(380769, start=10.0, dur=1.5, af="lowpass=f=2500"), FS(380769, start=20.0, dur=1.5, af="lowpass=f=2500")], n=2)
E("ev_cry", "sfx", [S(C, "lab_horrorlib*", "Breath_Scared_0[5-9].mp3", af="lowpass=f=2400")], n=4)
E("ev_bubbles", "sfx", [S(A, "lab_water40*", "bubble_0[1-3].ogg")], n=3)
E("ev_rustle", "sfx", [S(A, "lab_metalwood*", "wood_cracking_0[1-4].ogg", af="lowpass=f=2000")], n=4)
E("ev_far_roar", "sfx", [SPL(69572, 2, start=10.0, dur=10.0, af="lowpass=f=1200"), FS(240311, start=0.0, dur=3.5, af="lowpass=f=900")], n=3, mx=4.0)
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

# ═════ МУЗЫКА (петли в памяти: моно, до 170 секунд; в памяти — только звучащая) ═════
# Каждая запись должна звучать и на динамике телефона: заметная доля звука —
# выше 350 Гц (проверка в сборке). Гул ниже динамик не играет — такой музыки
# игрок не слышит вовсе.
E("mus_menu", "music", [S(C, "lab_km_shadow1", "*.mp3", start=30)], v=1.0, max=170)
E("mus_prologue", "music", [S(C, "lab_km_scp5", "*.ogg", start=10)], v=1.0, max=170)
E("mus_l1", "music", [S(C, "lab_km_sanctum", "*.mp3", start=40)], v=1.0, max=170)
E("mus_l2", "music", [S(C, "lab_km_hive", "*.mp3", start=15)], v=1.0, max=170)
E("mus_l3", "music", [S(C, "lab_km_metaphysik", "*.mp3", start=90)], v=1.0, max=170)
E("mus_l4", "music", [S(C, "lab_km_beast", "*.mp3", start=125)], v=1.0, max=170)
E("mus_l5", "music", [S(C, "lab_km_chaosnp", "*.mp3", start=155)], v=1.0, max=170)
E("mus_l6", "music", [S(C, "lab_heartmach*", "*.ogg")], v=1.0)
E("mus_l7", "music", [S(C, "lab_km_icedemon", "*.mp3", start=65)], v=1.0, max=170)
E("mus_l8", "music", [S(C, "lab_km_lazarus", "*.mp3", start=60)], v=1.0, max=170)
E("mus_l9", "music", [S(C, "lab_km_shadow6", "*.mp3", start=30)], v=1.0, max=170)
E("mus_l10", "music", [S(C, "lab_torment_realm_of_torment_1.flac", "*.flac")], v=1.0)
E("mus_ending", "music", [S(C, "lab_km_shadow7", "*.mp3", start=15)], v=1.0, max=170)

# капсулы восстановления: спокойная музыка, по одной дорожке (1.3)
E("cap_mus_1", "music", [S(C, "lab_cap_clair", "*")], v=1.0, max=170)
E("cap_mus_2", "music", [S(C, "lab_cap_gymno", "*")], v=1.0, max=170)
E("cap_mus_3", "music", [S(C, "lab_cap_remin", "*")], v=1.0, max=170)
E("cap_mus_4", "music", [S(C, "lab_cap_medit", "*")], v=1.0, max=170)
E("cap_mus_5", "music", [S(C, "lab_cap_guitar", "*")], v=1.0, max=170)
E("cap_mus_6", "music", [S(C, "lab_cap_canon", "*")], v=1.0, max=170)
E("cap_mus_7", "music", [S(C, "lab_cap_musicbox", "*")], v=1.0, max=170)
E("cap_mus_8", "music", [S(C, "lab_cap_silver", "*")], v=1.0, max=170)
E("cap_mus_9", "music", [S(C, "lab_cap_wholesome", "*")], v=1.0, max=170)
E("cap_mus_10", "music", [S(C, "lab_cap_teddy", "*")], v=1.0, max=170)
E("cap_mus_11", "music", [S(C, "lab_cap_dreamer", "*")], v=1.0, max=170)
E("cap_mus_12", "music", [S(C, "lab_cap_avec", "*")], v=1.0, max=170)
# Музыка глубоких блоков (mus_b<блок>_<n>): блок I — гул земли и эхо, II — живой
# тёплый мир «Колыбели», III — холодное «Отражение», IV — ритм «Механизма», V — «Исток».
E("mus_b1_1", "music", [S(C, "lab_km_celeste", "*.mp3")], v=1.0, max=170)
E("mus_b1_2", "music", [S(C, "lab_km_scp3", "*.ogg", start=20)], v=1.0, max=170)
E("mus_b1_3", "music", [S(C, "lab_km_gathering", "*.mp3")], v=1.0, max=170)
E("mus_b1_4", "music", [S(C, "lab_km_scp4", "*.ogg", start=30)], v=1.0, max=170)
E("mus_b2_1", "music", [S(C, "lab_km_magicforest", "*.mp3", start=70)], v=1.0, max=170)
E("mus_b2_2", "music", [S(C, "lab_km_ascendingtheva", "*.mp3", start=25)], v=1.0, max=170)
E("mus_b2_3", "music", [S(C, "lab_km_lightlessdawn", "*.mp3", start=5)], v=1.0, max=170)
E("mus_b2_4", "music", [S(C, "lab_km_shadow4", "*.mp3", start=35)], v=1.0, max=170)
E("mus_b3_1", "music", [S(C, "lab_km_frostwaltz", "*.mp3")], v=1.0, max=170)
E("mus_b3_2", "music", [S(C, "lab_km_ghoststory", "*.mp3", start=5)], v=1.0, max=170)
E("mus_b3_3", "music", [S(C, "lab_km_satiate", "*.mp3")], v=1.0, max=170)
E("mus_b3_4", "music", [S(C, "lab_km_darkestchild", "*.mp3", start=45)], v=1.0, max=170)
E("mus_b4_1", "music", [S(C, "lab_km_industrialmusi", "*.mp3")], v=1.0, max=170)
E("mus_b4_2", "music", [S(C, "lab_km_klockworx", "*.mp3", start=65)], v=1.0, max=170)
E("mus_b4_3", "music", [S(C, "lab_km_unrelenting", "*.mp3")], v=1.0, max=170)
E("mus_b4_4", "music", [S(C, "lab_km_static", "*.mp3")], v=1.0, max=170)
E("mus_b5_1", "music", [S(C, "lab_km_numinousshine", "*.mp3", start=85)], v=1.0, max=170)
E("mus_b5_2", "music", [S(C, "lab_km_infiniteperspe", "*.mp3", start=45)], v=1.0, max=170)
E("mus_b5_3", "music", [S(C, "lab_km_bathedinthelig", "*.mp3")], v=1.0, max=170)
E("mus_b5_4", "music", [S(C, "lab_km_spacial", "*.mp3")], v=1.0, max=170)

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
GROUP = {"ui": "ui", "step": "step", "bcn": "bcn", "loop": "amb", "music": "mus", "voice": "fx", "sfx": "fx", "mix": "fx", "mixv": "fx", "seq": "fx", "gen": "fx"}
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
        elif kind == "mixv":
            # несколько вариантов, каждый — сведение слоёв (выстрел + разряд и т. п.)
            for var in sp["srcs"]:
                mix = None
                for layer, off, g in var:
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
                if mix is None: continue
                if sp["mx"]: mix = cap(mix, sp["mx"])
                mix = ffx(mix, o.get("post"))
                outs.append(fade(loudnorm(mix, o.get("tgt", TARGET["sfx"])), 0.003, 0.2))
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
                if isinstance(s, tuple) and s[0] == "split":
                    _, src, k = s[:3]
                    so = s[3] if len(s) > 3 else {}
                    fs = resolve(src)
                    if not fs: MISSING.append(id_ + " (split) " + str(src[1:4])); continue
                    path, lo = fs[0]
                    use(path)
                    a = decode(path, lo.get("start", 0), lo.get("dur", 60), ch=1, af=lo.get("af"))
                    for seg in segments(a, k, **so): items.append(("arr", cap(seg, sp["mx"] if sp["mx"] is not None else DEF_MAX.get(kind))))
                    continue
                if isinstance(s, tuple) and s[0] == "slice":
                    _, src, k = s
                    fs = resolve(src)
                    if not fs: MISSING.append(id_ + " (slice)"); continue
                    path, lo = fs[0]
                    use(path)
                    a = decode(path, lo.get("start", 0), lo.get("dur", 30), ch=1, af=lo.get("af"))
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
                        # Музыка — петля в памяти (не поток: поток в WebView молчит):
                        # моно, не длиннее 110 секунд, конец сведён в начало.
                        lo2 = dict(lo); lo2.setdefault("af", "highpass=f=55")
                        a = process_one(path, lo2, kind, None, ch=1)
                        mx_s = o.get("max", 110)
                        a = a[: int((mx_s + 4.0) * SR)]
                        a = loopify(a, 4.0)
                    else:
                        a = process_one(path, lo, kind, sp["mx"])
                if len(a) < int(0.02 * SR): continue
                if kind not in ("music", "loop"): a = ffx(a, o.get("post"))
                a = loudnorm(a, o.get("tgt", TARGET.get(kind, -16)))
                if kind == "music":
                    hear = audible_db(a)
                    print("   %s: на динамике телефона (выше 350 Гц) %.1f дБ" % (id_, hear))
                    if hear < AUDIBLE_MIN: MISSING.append("ТИХО НА ТЕЛЕФОНЕ %s: %.1f дБ выше 350 Гц (нужно не ниже %.0f)" % (id_, hear, AUDIBLE_MIN))
                outs.append(a)
        if not outs:
            MISSING.append("ПУСТО " + id_); continue
        if re.match(r"^(w_|step_|bump_wall)", id_) and not re.search(r"(_thud|_power_low|_power_tail)$", id_):
            hs = [audible_db(x) for x in outs]
            print("   %s: выше 350 Гц %.1f дБ (худший вариант %.1f)" % (id_, sum(hs) / len(hs), min(hs)))
            if min(hs) < -9.0: MISSING.append("ГЛУХО НА ТЕЛЕФОНЕ %s: %.1f дБ выше 350 Гц" % (id_, min(hs)))
        files = []
        for k, a in enumerate(outs):
            rel = "%s/%s_%d.ogg" % (grp, id_, k + 1)
            q = 3 if kind in ("music", "loop") else 4
            encode(a, os.path.join(OUT, rel), q)
            files.append(rel)
            total += os.path.getsize(os.path.join(OUT, rel))
        bus = sp["bus"] or {"ui": "ui", "bcn": "beacon", "loop": "amb", "music": "music"}.get(kind, "fx")
        out_defs[id_] = {"f": files, "o": {"v": round(sp["v"], 2), "bus": bus}}
        # длинные петли (музыка, фон уровня) держатся в памяти, только пока звучат
        if kind in ("loop", "music") and (kind == "music" or len(outs[0]) > 12 * SR): out_defs[id_]["o"]["long"] = True
        print("%-22s %d вар., %s" % (id_, len(files), kind))
    return out_defs, credits_used, total

def write_js(defs):
    # сразу — общее для всех уровней; голоса врагов, пол и события уровня грузит atmos.js
    core = [k for k in defs if re.match(r"^(ui_|bump_|door_|bcn_|pick_|near_|nav_|w_|hit_|impact_|card_|keypad|code_)", k)]
    lvl = re.compile(r"^(step_|amb_|room_|evl_|ev_|mus_)|_(idle|alert|attack|hurt|death|step)$")
    allids = [k for k, d in defs.items() if not d["o"].get("long") and not lvl.search(k)]
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
             "Все записи — свободные: CC0 (общественное достояние, в том числе записи Freesound —",
             "у каждой указан автор и страница), CC BY 3.0 и CC BY 4.0 (с указанием автора),",
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
              "- CC BY 4.0: https://creativecommons.org/licenses/by/4.0/",
              "- Freedoom (BSD 3-Clause): Copyright © 2001–2024 Contributors to the Freedoom project. All rights reserved. Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met: redistributions must retain the above copyright notice, this list of conditions and the disclaimer; neither the name of the Freedoom project nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission. THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS \"AS IS\" AND ANY EXPRESS OR IMPLIED WARRANTIES ARE DISCLAIMED.",
              "- Endless Sky: используются только записи, которые файл copyright проекта относит к общественному достоянию.", ""]
    with open(os.path.join(OUT, "CREDITS.md"), "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

if __name__ == "__main__":
    if len(sys.argv) < 5:
        print(__doc__); sys.exit(2)
    ROOTS.update({"A": os.path.abspath(sys.argv[1]), "B": os.path.abspath(sys.argv[2]), "C": os.path.abspath(sys.argv[3]), "D": os.path.abspath(sys.argv[4])})
    only = sys.argv[5:] if len(sys.argv) > 5 else None
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
