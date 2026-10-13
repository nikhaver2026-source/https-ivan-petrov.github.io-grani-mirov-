# Фаза V: десять школ, которых не хватало до тридцати дисциплин мастер-промпта.
# Вставляются прямо в таблицы игры (школы, стихии, звуки, специализации, именные чары),
# чтобы их подхватили плетение, Академия, гримуар, учителя и все проверки — без второго пути.

SCHOOLS = [
 # id, имя, род, семейство, k, звук, голос, стихия
 ("chance",   "Вероятности",           "вероятностей", "контроль",  1.0,  "spell_cast",  "magic_shimmer",   "e_chaos"),
 ("mirror",   "Отражения",             "отражений",    "скрытность",1.0,  "spell_light", "oc_crystal_comm", "e_light"),
 ("witch",    "Ведьмовство",           "ведьмовства",  "контроль",  1.05, "spell_dark",  "wild_raven",      "e_dark"),
 ("oath",     "Клятвы и договоры",     "клятв",        "защита",    1.0,  "spell_light", "bell_small",      "e_order"),
 ("truename", "Истинные имена",        "имён",         "контроль",  1.05, "spell_cast",  "chant_ether",     "e_mind"),
 ("laws",     "Изменение законов",     "законов",      "контроль",  1.1,  "spell_cast",  "cast_timestop",   "e_space"),
 ("calamity", "Стихийные катастрофы",  "катастроф",    "урон",      1.2,  "cast_thunder","sky_thunder",     "e_storm"),
 ("sigil",    "Пространственные печати","печатей",     "защита",    1.0,  "spell_cast",  "arte_page",       "e_space"),
 ("counter",  "Подавление чар",        "подавления",   "защита",    1.0,  "spell_light", "oc_pshsh",        "e_order"),
 ("symbiont", "Симбиоз",               "симбиоза",     "исцеление", 0.95, "spell_cast",  "lug_bush",        "e_vine"),
]

AUDIO = {
 "chance":  dict(prep="arc_chimes",   charge="arc_rise",       cast="arc_cast",      travel="magic_woosh", impact="oc_glass_hit",    result="arc_shine",  fade="magic_shimmer"),
 "mirror":  dict(prep="oc_glass_hit", charge="arc_chimes",     cast="cast_teleport", travel="magic_woosh", impact="crystal_shatter", result="arc_shine",  fade="oc_crystal_comm"),
 "witch":   dict(prep="wild_raven",   charge="chant_ether",    cast="spell_dark",    travel="oc_rustle",   impact="dark_spell",      result="stk_goo",    fade="wraith_moan"),
 "oath":    dict(prep="bell_small",   charge="chant_ether",    cast="spell_light",   travel="arc_breath",  impact="oc_chain",        result="bell_big",   fade="stk_ward"),
 "truename":dict(prep="arc_breath",   charge="chant_ether",    cast="arc_cast",      travel="oc_soft_touch",impact="cast_timestop",  result="arc_shine",  fade="magic_shimmer"),
 "laws":    dict(prep="deep_stone",   charge="arc_rise",       cast="cast_timestop", travel="oc_warp",     impact="cast_quake",      result="stk_clock",  fade="deep_wind"),
 "calamity":dict(prep="sky_thunder",  charge="arc_rise",       cast="cast_thunder",  travel="lug_whoosh",  impact="stk_blast",       result="oc_quake",   fade="oc_wind"),
 "sigil":   dict(prep="arte_page",    charge="cast_shield",    cast="oc_chain",      travel="arc_cast",    impact="cast_block",      result="portal_open",fade="stk_ward"),
 "counter": dict(prep="oc_shield_block",charge="cast_shield",  cast="oc_pshsh",      travel="magic_woosh", impact="cast_block",      result="oc_smoke",   fade="stk_ward"),
 "symbiont":dict(prep="lug_bush",     charge="oc_organic_hit", cast="spell_cast",    travel="oc_rustle",   impact="plant_spell_hit", result="stk_goo",    fade="oc_chirp"),
}

# Специализации: id, школа, имя, ядро, стихия, звук, о
SPECS = [
 # ядро — из тех, что подходят семейству школы; внутри школы ядра и стихии не повторяются
 ("mg_zhrebiy","chance","Жребий","mark","e_chaos","arc_chimes","метка удачи: следующий удар по цели вернее"),
 ("mg_podkova","chance","Подкова","mana","e_light","arc_shine","удача возвращает потраченное"),
 ("mg_sglaz_chisel","chance","Сглаз чисел","curse","e_dark","oc_glass_hit","у твари всё выпадает не так"),
 ("mg_razvilka","chance","Развилка","shift","e_time","magic_woosh","из двух исходов приходит лучший"),
 ("mg_dvoynik","mirror","Двойник","veil","e_light","oc_crystal_comm","бьют того, кого видят, а это не вы"),
 ("mg_zazerkalye","mirror","Зазеркалье","astral","e_space","cast_teleport","вы уходите за стекло, и мир смотрит сквозь вас"),
 ("mg_iznanka","mirror","Изнанка","shift","e_mind","magic_woosh","шаг в зеркало и выход из другого"),
 ("mg_otblesk","mirror","Отблеск","sense","e_ice","crystal_shatter","отблеск выдаёт спрятанное"),
 ("mg_sglaz","witch","Сглаз","curse","e_dark","dark_spell","дурной глаз: тварь бьёт слабее"),
 ("mg_nagovor","witch","Наговор","bind","e_spirit","chant_ether","нашёптанное слово вяжет крепче верёвки"),
 ("mg_nitka","witch","Оберег-нитка","seal","e_vine","oc_rustle","красная нитка запечатывает беду"),
 ("mg_otvar","witch","Ведьмин отвар","mana","e_water","stk_goo","горькое снадобье из котла возвращает силы"),
 ("mg_klyatva","oath","Клятва","bless","e_order","bell_small","данное слово само держит руку"),
 ("mg_dogovor","oath","Договор","bind","e_metal","oc_chain","кто нарушит — тот и платит"),
 ("mg_obet","oath","Обет","ward","e_light","stk_ward","отказ от малого даёт защиту в большом"),
 ("mg_rasplata","oath","Расплата","dispel","e_spirit","bell_big","нарушенное слово гасит чары врага"),
 ("mg_vlast_imeni","truename","Власть имени","bind","e_mind","chant_ether","названная тварь не может не слушать"),
 ("mg_uznat_imya","truename","Узнать имя","sense","e_spirit","arc_breath","имя слышно сквозь шум и ложь"),
 ("mg_steret_imya","truename","Стереть имя","shift","e_dark","oc_soft_touch","без имени вас не найти"),
 ("mg_narechenie","truename","Наречение","mark","e_order","arc_shine","названная тварь меченая"),
 ("mg_tyazhest","laws","Иная тяжесть","ease","e_space","deep_stone","вес стал другим: лёгкому легче, тяжёлому тяжелее"),
 ("mg_techenie","laws","Иное течение","bind","e_time","cast_timestop","время вокруг твари вязнет"),
 ("mg_tverd","laws","Иная твердь","seal","e_earth","cast_quake","земля под тварью твердеет, как камень"),
 ("mg_inoy_svet","laws","Иной свет","sense","e_light","magic_shimmer","свет ложится туда, где прячутся"),
 ("mg_burya","calamity","Буря","strike","e_storm","sky_thunder","небо падает на землю"),
 ("mg_tryasenie","calamity","Трясение","mark","e_earth","oc_quake","трещина метит тварь: следующий удар глубже"),
 ("mg_sel","calamity","Сель","bind","e_water","oc_splash","грязевой поток держит, как трясина"),
 ("mg_ognedozhd","calamity","Огненный дождь","curse","e_fire","oc_fireball","тварь горит и слабеет"),
 ("mg_zamok","sigil","Замок","seal","e_space","oc_chain","печать запирает и дверь, и тварь"),
 ("mg_yakor","sigil","Якорь","ward","e_order","portal_open","печать держит удар на месте"),
 ("mg_krug","sigil","Круг заточения","bind","e_metal","cast_block","из начертанного круга не выйти"),
 ("mg_pechat_razloma","sigil","Печать разлома","dispel","e_spirit","arte_page","разлом и чары гаснут под печатью"),
 ("mg_glush","counter","Глушь","dispel","e_order","oc_pshsh","чужие чары глохнут"),
 ("mg_otrazhenie_char","counter","Отражение чар","ward","e_light","cast_block","чары возвращаются тому, кто их бросил"),
 ("mg_nemota","counter","Немота","seal","e_mind","oc_smoke","у твари отнята её сила"),
 ("mg_gasilo","counter","Гасило","ease","e_ice","cast_shield","погашенные чары больше не давят"),
 ("mg_gribnitsa","symbiont","Грибница","heal","e_vine","plant_spell_hit","живая сеть под кожей затягивает раны"),
 ("mg_loza_kozha","symbiont","Лоза-кожа","ward","e_earth","lug_bush","лоза ложится поверх кожи"),
 ("mg_svetlyaki","symbiont","Светляки","mana","e_light","oc_chirp","свет светляков возвращает силы"),
 ("mg_soyuz_dush","symbiont","Союз душ","bless","e_spirit","oc_organic_hit","спутник делит с вами свою силу, душа к душе"),
]

# Именные чары школ: по три на школу (ступени 1–3), форма — из тех, что подходят семейству школы.
STEP = {1: (0.9, 6, 0, 40), 2: (1.15, 11, 2, 120), 3: (1.45, 17, 5, 300)}
SPELLS = [
 ("chance",1,"Подброшенная монета","mark","метка удачи: следующий удар по цели вернее"),
 ("chance",2,"Кривой жребий","cloud","облако неудач: твари промахиваются и сбиваются"),
 ("chance",3,"Развилка судьбы","call","из двух исходов боя приходит лучший"),
 ("mirror",1,"Зеркальный двойник","ward","двойник из света принимает удар на себя"),
 ("mirror",2,"Изнанка зеркала","mark","метит тварь: её удар уходит в отражение"),
 ("mirror",3,"Зеркальный купол","dome","купол отражений: чужой удар уходит мимо"),
 ("witch",1,"Сглаз","mark","дурной глаз: тварь бьёт слабее и промахивается"),
 ("witch",2,"Наговор на нитку","snare","нитка с наговором держит тварь на месте"),
 ("witch",3,"Шабашный круг","field","круг ковена: в нём ведьма сильнее, а тварь слабее"),
 ("oath",1,"Слово на крови","ward","данное слово держит удар"),
 ("oath",2,"Договорная печать","snare","договор связывает тварь: ударит — получит сама"),
 ("oath",3,"Клятва предков","dome","свидетели клятвы встают кругом"),
 ("truename",1,"Названное имя","mark","тварь, названная по имени, открывается удару"),
 ("truename",2,"Повеление именем","call","тварь, названная по имени, не может ослушаться"),
 ("truename",3,"Стёртое имя","beam","луч стирает имя: тварь забывает, кто она"),
 ("laws",1,"Иная тяжесть","field","в этом поле вес другой: тварь вязнет"),
 ("laws",2,"Остановленный миг","snare","закон времени дал трещину: тварь застывает"),
 ("laws",3,"Переписанная твердь","wave","волна меняет саму землю под ногами"),
 ("calamity",1,"Грозовой удар","bolt","молния бьёт с ясного неба"),
 ("calamity",2,"Сель","wave","грязевой поток сносит всех рядом"),
 ("calamity",3,"Огненный ливень","rain","с неба льётся огонь"),
 ("sigil",1,"Печать замка","mark","печать запирает тварь: не уйдёт и не подойдёт"),
 ("sigil",2,"Круг заточения","snare","из начертанного круга не выйти"),
 ("sigil",3,"Печать места","field","место запечатано: внутри держится ваша сила"),
 ("counter",1,"Глушь","ward","чужие чары глохнут у щита"),
 ("counter",2,"Немота","beam","луч отнимает у твари её силу"),
 ("counter",3,"Зеркало отказа","dome","купол возвращает чужие чары обратно"),
 ("symbiont",1,"Грибница","ward","грибница под кожей затягивает раны"),
 ("symbiont",2,"Лоза-союзник","call","лоза приходит на зов и держит вас"),
 ("symbiont",3,"Рой светляков","rain","светляки садятся на раны и жалят тварей"),
]

def js(v):
    import json
    return json.dumps(v, ensure_ascii=False)

def schools_js():
    out = []
    for (i, n, r, sem, k, zv, gl, _el) in SCHOOLS:
        out.append(f' {{id:"{i}",n:"{n}",род:"{r}",сем:"{sem}",k:{k},звук:"{zv}",голос:"{gl}"}}')
    return ",\n /* 14.5, фаза V: десять школ, которых не хватало до тридцати дисциплин. */\n" + ",\n".join(out)

def specs_js():
    return "\n /* 14.5, фаза V: по четыре специализации у новых школ. */\n" + "\n".join(
        f' {{id:"{i}",школа:"{sc}",n:"{n}",ядро:"{c}",стихия:"{e}",звук:"{z}",\n  о:"{o}"}},' for (i, sc, n, c, e, z, o) in SPECS)

def spells_js():
    rows = []
    for (sc, st, n, f, o) in SPELLS:
        p, cost, cd, g = STEP[st]
        rows.append(f' {{id:"ss_{sc}_{st}",n:"{n}",school:"{sc}",форма:"{f}",ранг:{st},сила:{p},cost:{cost},откат:{cd},золото:{g},\n  о:"{o}"}}')
    return "/* 14.5, фаза V: три именных чары у каждой из десяти новых школ. */\nSCHOOL_SPELLS.push(\n" + ",\n".join(rows) + ");\n"

def audio_js():
    return ",\n /* 14.5, фаза V */\n" + ",\n".join(
        f' {i}:{{' + ",".join(f'{k}:"{v}"' for k, v in a.items()) + '}' for i, a in AUDIO.items())

def patch(s, rep):
    # школы
    rep('голос:"oc_electrical"}];\nconst MSCHOOL_BY_ID', 'голос:"oc_electrical"}' + schools_js() + '];\nconst MSCHOOL_BY_ID')
    # стихии новых школ
    by_el = {}
    for (i, *_rest) in SCHOOLS:
        by_el.setdefault(_rest[-1], []).append(i)
    import re
    for el, ids in by_el.items():
        m = re.search(r'\{id:"' + el + r'",[^\n]*?школы:\[([^\]]*)\]', s)
        assert m, el
        old = m.group(0)
        new = old[:-1] + ',' + ','.join(f'"{i}"' for i in ids) + ']'
        rep(old, new)
        s = s.replace(old, new)
    # специализации
    rep('о:"работает только у того, кому положено"},];\nconst SPEC_BY_ID', 'о:"работает только у того, кому положено"},' + specs_js() + '];\nconst SPEC_BY_ID')
    # именные чары
    rep('\nconst SCHOOL_SPELL_BY_NAME=', '\n' + spells_js() + 'const SCHOOL_SPELL_BY_NAME=')
    # звуки школ
    rep('result:"artifact_hum",fade:"oc_pshsh"}};\n', 'result:"artifact_hum",fade:"oc_pshsh"}' + audio_js() + '};\n')
    # самопроверки мира считают от числа школ, а не держат прежние числа
    rep('ok("schoolspells",SCHOOL_SPELLS.length===114', 'ok("schoolspells",SCHOOL_SPELLS.length===SCHOOLS.length*3')
    rep('&&new Set(SCHOOL_SPELLS.map(s=>s.n)).size===114', '&&new Set(SCHOOL_SPELLS.map(s=>s.n)).size===SCHOOL_SPELLS.length')
    rep('"Чары школ: по три у каждой из тридцати четырёх, форма подходит семейству', '"Чары школ: по три у каждой школы, форма подходит семейству')
    rep('ok("grimoire",SPELL_SPECS.length===152&&SCHOOLS.length===38', 'ok("grimoire",SPELL_SPECS.length===SCHOOLS.length*4&&SCHOOLS.length>=38')
    rep('`Гримуар: 152 специализации у 38 школ,', '`Гримуар: ${SPELL_SPECS.length} специализаций у ${SCHOOLS.length} школ,')
