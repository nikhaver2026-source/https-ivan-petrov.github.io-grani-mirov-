# 14.6: записи зверей (sounds/zv, BigSoundBank, CC0) — роли банка.
# Общий список для rebuild.py (вставка в SOUND_BANK) и zv_level.py (замер громкости).
def _f(base, n, name=None):
    return [f"zv/{name or base}_{i:02d}.flac" for i in range(1, n + 1)]

ZV_ROLES = [
    ("zv_eat_herb", _f("zv_eat_herb", 2), "Питомец ест: травоядный жуёт морковь (BigSoundBank)"),
    ("zv_eat_crunch", _f("zv_eat_crunch", 3), "Питомец ест: хрустит яблоко, морковь, мелкая добыча (BigSoundBank)"),
    ("zv_eat_bone", _f("zv_eat_bone", 2), "Питомец ест: хищник грызёт мясо с костью (BigSoundBank)"),
    ("zv_purr", _f("zv_purr", 2), "Питомец: сытая кошка мурлычет (BigSoundBank)"),
    ("zv_pant", _f("zv_pant", 2), "Питомец: довольное дыхание собаки (BigSoundBank)"),
    ("zv_sniff", _f("zv_sniff", 2), "Питомец принюхивается: находка в пути (BigSoundBank)"),
    ("zv_neigh", _f("zv_neigh", 2), "Голос коня: ржание (BigSoundBank)"),
    ("zv_moo", _f("zv_moo", 2), "Голос тура: мычание (BigSoundBank)"),
    ("zv_bleat", _f("zv_goat", 2) + _f("zv_sheep", 1), "Голос барана: блеяние (BigSoundBank)"),
    ("zv_pig", _f("zv_pig", 2), "Голос кабана: хрюканье (BigSoundBank)"),
    ("zv_bark", _f("zv_bark", 2), "Голос гончей: лай (BigSoundBank)"),
    ("zv_wing", _f("zv_wing", 2), "Взмах крыльев: летучий спутник, полёт верхом (BigSoundBank)"),
    ("zv_ride_walk", _f("zv_ride_walk", 4), "Верхом шагом: копыта под седоком (BigSoundBank)"),
    ("zv_ride_trot", _f("zv_ride_trot", 3), "Верхом рысью: на бегу (BigSoundBank)"),
    ("zv_ride_gallop", _f("zv_ride_gallop", 4), "Верхом галопом: на бегу (BigSoundBank)"),
]


def bank_lines():
    import json
    return "".join(f' {k}:{{f:{json.dumps(f, ensure_ascii=False)},d:"{d}"}},\n' for k, f, d in ZV_ROLES)
