/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — новое оружие (1.5).
   Сорок пять видов, на каждой глубине — свои: гвоздемёт и скальпель
   «Ковчега», кирка-отбойник и сигнальный пистолет «Глубины», костяной
   самострел и терновый хлыст Колыбели, зеркальный пистолет Отражения,
   штемпелятор «Отказано» Механизма, корневой бич и луч Истока. Новые
   свойства (бой — combat.js): bleed — кровотечение у живого (тактов),
   chain — разряд перескакивает на соседних (сколько раз), knock —
   отбрасывает на шаг, slow — замедляет (тактов), mark — метка: по цели
   бьют на четверть сильнее (тактов), drain — часть урона по живому
   возвращается здоровьем, silent — выстрел почти не слышно, crit —
   прибавка к шансу точного удара. Встречаются там же, где прежнее:
   у врагов, в оружейных стойках, на пунктах снабжения, в наградах;
   часть собирается у верстака (некоторые — по найденной схеме).
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = (typeof window !== "undefined" ? window.LAB : globalThis.LAB);
function W(id, depth, model, d) { if (LAB.WEAPONS[id]) return; LAB.WEAPONS[id] = d; LAB.WEAPON_DEPTH[id] = depth; LAB.MODEL[id] = model; }

/* ── «Ковчег»: то, что было под рукой, и то, что выдавали охране ── */
W("nailgun", 2, "ГМ", { n: "строительный гвоздемёт", g: "m", cls: "kinetic", ammo: "energy", dt: "kinetic", dmg: 8, rng: 5, spread: 0, cap: 16, cd: 380, snd: "w_gauss", sndRate: 1.6, bleed: 3, desc: "Монтажный гвоздемёт с пневмоприводом. Гвозди застревают в живом: тварь ещё несколько тактов истекает." });
W("scalpel", 3, "ЛС", { n: "лазерный скальпель", g: "m", cls: "melee", ammo: "none", dt: "laser", dmg: 11, rng: 1, spread: 1, cap: 0, cd: 380, snd: "w_cutter", sndRate: 1.4, crit: 0.15, bleed: 2, desc: "Хирургический скальпель с лазерной кромкой. Быстрый, точный, режет туда, где больнее." });
W("harpoongun", 3, "ПГ", { n: "пневмогарпун гидропоники", g: "m", cls: "gauss", ammo: "energy", dt: "kinetic", dmg: 17, rng: 6, spread: 0, cap: 4, cd: 900, snd: "w_gauss", sndRate: 0.85, knock: true, desc: "Гарпун для чистки баков от корней. Сбивает цель с ног и отталкивает на шаг." });
W("sprayer", 3, "РГ", { n: "распылитель гербицида", g: "m", cls: "bio", ammo: "energy", dt: "bio", dmg: 6, rng: 3, spread: 1, cap: 20, cd: 300, snd: "w_cryo", sndRate: 1.3, slow: 3, desc: "Ранцевый распылитель теплиц. Едкое облако жжёт живое и замедляет его." });
W("stunrod", 4, "РО", { n: "разрядник охраны «Оса»", g: "m", cls: "ion", ammo: "energy", dt: "shock", dmg: 10, rng: 4, spread: 0, cap: 10, cd: 600, snd: "w_ion", sndRate: 1.15, chain: 2, desc: "Табельный разрядник. Разряд перескакивает с цели на соседей — до двух раз." });
W("silencer_p", 5, "Ш", { n: "бесшумный пистолет «Шёпот»", g: "m", cls: "kinetic", ammo: "slug", dt: "kinetic", dmg: 13, rng: 7, spread: 0, cap: 8, cd: 520, snd: "w_gauss", sndRate: 1.8, silent: true, desc: "Пистолет особого отдела с глушителем. Выстрел почти не слышно ни тварям, ни ОКО." });
W("markrifle", 6, "ЦМ", { n: "целеуказатель «Метка»", g: "m", cls: "laser", ammo: "energy", dt: "laser", dmg: 10, rng: 11, spread: 0, cap: 10, cd: 600, snd: "w_laser", sndRate: 0.9, mark: 6, desc: "Лазерная винтовка с меткой: по помеченной цели любое оружие бьёт на четверть сильнее." });
W("arcrifle", 7, "ДР", { n: "дуговой разрядник", g: "m", cls: "ion", ammo: "energy", dt: "ion", dmg: 15, rng: 6, spread: 0, cap: 8, cd: 700, snd: "w_ion", sndRate: 0.9, chain: 3, desc: "Дуга ионизированного воздуха прыгает по машинам: до трёх целей за выстрел." });
W("shockhammer", 8, "УМ", { n: "ударный молот монтажника", g: "m", cls: "melee", ammo: "none", dt: "shock", dmg: 22, rng: 1, spread: 1, cap: 0, cd: 850, snd: "w_shock", sndRate: 0.8, knock: true, desc: "Молот с разрядником в бойке. Отбрасывает и оглушает током." });
W("leech", 9, "БП", { n: "биорезонатор «Пиявка»", g: "m", cls: "magnetron", ammo: "magnetron", dt: "magnetron", dmg: 14, rng: 4, spread: 1, cap: 8, cd: 600, snd: "w_magnetron", sndRate: 1.2, drain: 0.25, desc: "Опытный излучатель генетиков. Четверть урона по живому возвращается вам здоровьем." });
W("zarya", 10, "ЛЗ", { n: "лучемёт «Заря»", g: "m", cls: "laser", ammo: "energy", dt: "laser", dmg: 24, rng: 10, spread: 0, cap: 6, cd: 900, snd: "w_laser", sndRate: 0.8, pierce: true, desc: "Тяжёлый лазер реакторной охраны: луч прошивает всех на линии." });

/* ── «Подножие»: инструмент «Глубины» сорокалетней давности ── */
W("g_pickaxe", 13, "КО", { n: "кирка-отбойник", g: "f", cls: "melee", ammo: "none", dt: "kinetic", dmg: 26, rng: 1, spread: 1, cap: 0, cd: 800, snd: "w_melee", sndRate: 0.7, crit: 0.1, bleed: 2, desc: "Пневматическая кирка забойщика. Тяжёлая, медленная, бьёт наверняка." });
W("g_flarepistol", 15, "СП", { n: "сигнальный пистолет горноспасателя", g: "m", cls: "thermo", ammo: "energy", dt: "thermo", dmg: 18, rng: 7, spread: 0, cap: 3, cd: 900, snd: "w_blaster_h", sndRate: 0.7, area: true, desc: "Электрическая ракетница: разряд батареи выбрасывает сгусток раскалённой плазмы — он вспыхивает у цели, как магниевая ракета, и обжигает всех рядом." });
W("g_charger", 16, "ШМ", { n: "шашечный метатель", g: "m", cls: "thermo", ammo: "g_seiscell", dt: "thermo", dmg: 30, rng: 5, spread: 0, cap: 2, cd: 1300, snd: "w_pcannon", sndRate: 0.8, area: true, knock: true, desc: "Метатель взрывных шашек для обрушения кровли. Отбрасывает всех рядом с целью." });
W("g_winchgun", 19, "ТЛ", { n: "тросомёт лебёдчика", g: "m", cls: "gauss", ammo: "energy", dt: "kinetic", dmg: 22, rng: 6, spread: 0, cap: 3, cd: 1000, snd: "w_gauss", sndRate: 0.7, slow: 4, pierce: true, desc: "Стальной трос с кошкой: прошивает и опутывает, цели вязнут." });
W("g_lampbeam", 20, "ЛК", { n: "луч коногонки", g: "m", cls: "laser", ammo: "energy", dt: "laser", dmg: 20, rng: 8, spread: 0, cap: 8, cd: 600, snd: "w_laser", sndRate: 1.1, mark: 4, desc: "Шахтёрская лампа, перемотанная в излучатель. Луч метит цель." });

/* ── Колыбель: то, что выросло и что сделали своими руками ── */
/* (3.7, нелогичность) с той глубины, где появляются иглы-жала (AMMO.k_needle, 26): прежде два уровня самострел был на один выстрел */
W("k_bonebow", 26, "КС", { n: "костяной самострел", g: "m", cls: "kinetic", ammo: "k_needle", dt: "kinetic", dmg: 22, rng: 8, spread: 0, cap: 1, cd: 1100, snd: "w_gauss", sndRate: 2.0, silent: true, crit: 0.2, desc: "Самострел из певчей кости. Бьёт беззвучно и точно, но перезаряжается после каждого выстрела." });
W("k_thornwhip", 25, "ТХ", { n: "терновый хлыст", g: "m", cls: "melee", ammo: "none", dt: "bio", dmg: 18, rng: 1, spread: 1, cap: 0, cd: 500, snd: "w_vibro", sndRate: 1.3, bleed: 4, desc: "Хлыст из живого терна. Шипы оставляют кровоточащие раны." });
W("k_resinspray", 27, "СБ", { n: "смоляной брызгомёт", g: "m", cls: "bio", ammo: "k_capsule", dt: "bio", dmg: 10, rng: 4, spread: 1, cap: 12, cd: 500, snd: "w_plasma", sndRate: 1.2, slow: 5, desc: "Горячая смола: обжигает и склеивает лапы и колёса." });
W("k_chorushorn", 29, "ПР", { n: "певчий рог", g: "m", cls: "sonic", ammo: "energy", dt: "sonic", dmg: 16, rng: 6, spread: 0, cap: 8, cd: 700, snd: "w_resonator", sndRate: 1.4, chain: 2, desc: "Рог Хора: нота отзывается в соседних целях." });
/* (3.7, нелогичность) прежде — «живой угорь в банке», но собирали его из соли, воска и проводов и
   заряжали батареей: теперь это то, что из них и выходит, — лейденская банка */
W("k_eeljar", 31, "ЛБ", { n: "солевая лейденская банка", g: "f", cls: "ion", ammo: "energy", dt: "shock", dmg: 18, rng: 3, spread: 1, cap: 6, cd: 650, snd: "w_ion", sndRate: 1.4, chain: 3, desc: "Стеклянная банка с рассолом звонкой соли, восковой пробкой и медными обкладками: копит заряд энергобатареи и отдаёт его разрядом, который скачет по трём целям." });
W("k_amberwand", 33, "ЯЖ", { n: "янтарный жезл", g: "m", cls: "phase", ammo: "energy", dt: "phase", dmg: 20, rng: 7, spread: 0, cap: 8, cd: 650, snd: "w_laser", sndRate: 0.7, mark: 5, drain: 0.15, desc: "Жезл из тёплой смолы: метит цель и возвращает часть силы." });
W("k_sling", 35, "ПК", { n: "праща с певчим камнем", g: "f", cls: "sonic", ammo: "none", dt: "sonic", dmg: 24, rng: 7, spread: 0, cap: 0, cd: 900, snd: "w_resonator", sndRate: 0.7, knock: true, desc: "Камень поёт в полёте и сбивает с ног. Заряжать не нужно: камень возвращается сам." });
W("k_hivespear", 37, "КУ", { n: "копьё улья", g: "n", cls: "melee", ammo: "none", dt: "nano", dmg: 30, rng: 1, spread: 1, cap: 0, cd: 650, snd: "w_vibro", sndRate: 0.9, bleed: 3, desc: "Наконечник из воска и хитина, в древке гудит рой." });
W("k_lumen", 39, "ФГ", { n: "фонарь глубоководья", g: "m", cls: "laser", ammo: "energy", dt: "laser", dmg: 26, rng: 10, spread: 0, cap: 5, cd: 900, snd: "w_laser", sndRate: 0.85, pierce: true, mark: 3, desc: "Светящийся орган глубоководной химеры в оправе. Свет здесь — оружие." });

/* ── Отражение: стекло, фаза, повторы ── */
/* (3.7, нелогичность) с глубины фазовых ячеек (AMMO.o_phasecell, 44) */
W("o_mirrorpistol", 44, "ЗП", { n: "зеркальный пистолет", g: "m", cls: "phase", ammo: "o_phasecell", dt: "phase", dmg: 18, rng: 8, spread: 0, cap: 8, cd: 550, snd: "w_ion", sndRate: 1.5, crit: 0.2, desc: "Пуля выходит из ствола и из отражения ствола: одна из двух всегда находит цель точнее." });
W("o_shardwhip", 46, "ХО", { n: "хлыст из осколков", g: "m", cls: "melee", ammo: "none", dt: "phase", dmg: 26, rng: 1, spread: 1, cap: 0, cd: 520, snd: "w_vibro", sndRate: 1.5, bleed: 4, desc: "Нить амальгамы, унизанная зеркальными осколками." });
W("o_echorifle", 48, "Э2", { n: "повторитель «Эхо-2»", g: "m", cls: "sonic", ammo: "o_sonicell", dt: "sonic", dmg: 18, rng: 8, spread: 0, cap: 10, cd: 700, snd: "w_resonator", sndRate: 1.1, burst: 2, mark: 3, desc: "Каждый выстрел повторяется отзвуком и метит цель." });
W("o_rime", 50, "ИЗ", { n: "иней зеркал", g: "m", cls: "cryo", ammo: "energy", dt: "cryo", dmg: 20, rng: 6, spread: 1, cap: 6, cd: 750, snd: "w_cryo", sndRate: 0.8, freeze: 3, slow: 4, desc: "Холод отражения: замораживает, а оттаявшая цель ещё долго движется вяло." });
W("o_mutefork", 52, "НК", { n: "немой камертон", g: "m", cls: "melee", ammo: "none", dt: "sonic", dmg: 34, rng: 1, spread: 1, cap: 0, cd: 700, snd: "w_melee", sndRate: 0.85, silent: true, knock: true, desc: "Камертон, который звучит только внутри того, по кому ударили." });
W("o_twin", 55, "ДВ", { n: "двойник", g: "m", cls: "phase", ammo: "o_phasecell", dt: "phase", dmg: 22, rng: 8, spread: 0, cap: 8, cd: 800, snd: "w_positron", sndRate: 1.3, burst: 2, desc: "Стреляет и стреляет его отражение: два заряда за спуск." });
W("o_pupilbreaker", 58, "РЗ", { n: "разбиватель «Зрачка»", g: "m", cls: "ion", ammo: "o_sonicell", dt: "emp", dmg: 26, rng: 7, spread: 0, cap: 5, cd: 900, snd: "w_ion", sndRate: 0.75, chain: 3, stunMech: 2, desc: "Импульс, рассчитанный на отражённое ОКО: машины замирают, разряд скачет дальше." });

/* ── Механизм: канцелярия и литейная ── */
W("m_rivetstorm", 63, "КШ", { n: "клёпочный шторм", g: "m", cls: "gauss", ammo: "m_pulsecell", dt: "gauss", dmg: 12, rng: 7, spread: 0, cap: 18, cd: 600, snd: "w_gauss", sndRate: 1.5, burst: 3, desc: "Клепальная машина конвейера: три заклёпки за спуск." });
W("m_inkjet", 67, "ЧФ", { n: "чернильная форсунка", g: "f", cls: "nano", ammo: "m_nanocart", dt: "nano", dmg: 14, rng: 5, spread: 1, cap: 12, cd: 500, snd: "w_plasma", sndRate: 1.4, slow: 5, mark: 4, desc: "Форсунка машинописного бюро: чернила слепят оптику и вязнут в шарнирах." });
W("m_gearsaw", 69, "ШП", { n: "шестерёночная пила", g: "f", cls: "melee", ammo: "none", dt: "kinetic", dmg: 38, rng: 1, spread: 1, cap: 0, cd: 700, snd: "w_cutter", sndRate: 0.7, bleed: 2, desc: "Зубчатое колесо на рукояти, раскрученное пружиной." });
W("m_stamper", 72, "ШО", { n: "штемпелятор «Отказано»", g: "m", cls: "gauss", ammo: "m_pulsecell", dt: "gauss", dmg: 30, rng: 6, spread: 0, cap: 4, cd: 950, snd: "w_gauss", sndRate: 0.8, knock: true, stunMech: 2, desc: "Пневматический штемпель с резиновым словом «Отказано». Отбрасывает и сбивает машинам контур." });
W("m_tubegun", 75, "ПМ", { n: "пневмопочтовый метатель", g: "m", cls: "kinetic", ammo: "m_pulsecell", dt: "kinetic", dmg: 34, rng: 8, spread: 0, cap: 3, cd: 1100, snd: "w_pcannon", sndRate: 1.2, area: true, desc: "Латунная капсула пневмопочты на скорости поезда. Задевает всех рядом с целью." });
W("m_etalon", 79, "ЭК", { n: "эталонная винтовка Калибровщика", g: "f", cls: "laser", ammo: "energy", dt: "laser", dmg: 36, rng: 12, spread: 0, cap: 4, cd: 1000, snd: "w_laser", sndRate: 0.75, crit: 0.25, desc: "Луч, по которому выверяют все прицелы Механизма. Бьёт точнее всего, что вы держали." });

/* ── Исток: звук, корни и свет ── */
W("i_rootwhip", 83, "КБ", { n: "корневой бич", g: "m", cls: "melee", ammo: "none", dt: "bio", dmg: 36, rng: 1, spread: 1, cap: 0, cd: 600, snd: "w_vibro", sndRate: 0.75, slow: 4, drain: 0.2, desc: "Живой корень: оплетает, замедляет и тянет из раны силу вам." });
W("i_beepistol", 86, "УП", { n: "улей-пистоль", g: "m", cls: "nano", ammo: "energy", dt: "nano", dmg: 14, rng: 6, spread: 0, cap: 12, cd: 600, snd: "w_blaster_p", sndRate: 1.5, burst: 3, chain: 1, desc: "Механические пчёлы вылетают роем и жалят соседей цели." });
W("i_soundknot", 88, "УР", { n: "узловой резонатор", g: "m", cls: "sonic", ammo: "i_gravcell", dt: "sonic", dmg: 40, rng: 8, spread: 0, cap: 4, cd: 1000, snd: "w_resonator", sndRate: 0.65, chain: 3, desc: "Узел твёрдого звука: развязывается в цели и звенит в соседних." });
W("i_lightseed", 91, "СС", { n: "семя света", g: "n", cls: "positron", ammo: "positron", dt: "positron", dmg: 50, rng: 9, spread: 0, cap: 2, cd: 1300, snd: "w_pcannon", sndRate: 1.35, area: true, mark: 4, desc: "Семя, которое прорастает вспышкой: жжёт цель и всё рядом и метит уцелевших." });
W("i_hushblade", 94, "КТ", { n: "клинок тишины", g: "m", cls: "melee", ammo: "none", dt: "phase", dmg: 46, rng: 1, spread: 1, cap: 0, cd: 520, snd: "w_vibro", sndRate: 0.6, silent: true, crit: 0.2, desc: "Лезвие гасит звук вокруг себя. Удар не слышен даже вам." });
W("i_gardenstaff", 97, "ПС", { n: "посох садовника", g: "m", cls: "grav", ammo: "i_gravcell", dt: "grav", dmg: 44, rng: 8, spread: 0, cap: 5, cd: 900, snd: "w_resonator", sndRate: 0.9, knock: true, slow: 4, desc: "Тяжёлый посох с землёй в набалдашнике: сила тяжести сбивает и прижимает к полу." });
W("i_sourcebeam", 99, "ЛИ", { n: "луч Истока", g: "m", cls: "positron", ammo: "i_quarkcell", dt: "positron", dmg: 60, rng: 12, spread: 0, cap: 2, cd: 1500, snd: "w_positron", sndRate: 0.7, pierce: true, noarmor: true, desc: "Чистый свет реактора, собранный в линию. Насквозь, без брони, без пощады." });

/* ── Сборка у верстака: простое — сразу, сложное — по найденной схеме ── */
var REC = [
  { id: "w_nailgun", out: "weapon:nailgun", n: "Строительный гвоздемёт", need: { scrap: 3, wire: 1, servo: 1, cap: 1 }, cls: "base", minL: 2 },
  { id: "w_sprayer", out: "weapon:sprayer", n: "Распылитель гербицида", need: { reagent: 2, rubber: 1, scrap: 2 }, cls: "base", minL: 3 },
  { id: "w_scalpel", out: "weapon:scalpel", n: "Лазерный скальпель", need: { lens: 2, cap: 1, cell: 1 }, cls: "spec", bp: true, minL: 3 },
  { id: "w_stunrod", out: "weapon:stunrod", n: "Разрядник охраны «Оса»", need: { cap: 3, wire: 2, relay: 1, scrap: 1 }, cls: "spec", minL: 4 },
  { id: "w_silencer", out: "weapon:silencer_p", n: "Бесшумный пистолет «Шёпот»", need: { scrap: 3, magnet: 1, rubber: 2, servo: 1 }, cls: "spec", bp: true, minL: 5 },
  { id: "w_shockhammer", out: "weapon:shockhammer", n: "Ударный молот монтажника", need: { scrap: 5, cap: 2, wire: 2, panel: 1 }, cls: "spec", minL: 8 },
  { id: "g_r_pickaxe", out: "weapon:g_pickaxe", n: "Кирка-отбойник", need: { scrap: 4, g_hydrocyl: 1, servo: 1 }, cls: "base", minL: 13 },
  { id: "g_r_lampbeam", out: "weapon:g_lampbeam", n: "Луч коногонки", need: { g_tube: 2, lens: 1, cell: 1, g_mica: 1 }, cls: "spec", bp: true, minL: 20 },
  { id: "k_r_thornwhip", out: "weapon:k_thornwhip", n: "Терновый хлыст", need: { k_root: 1, k_resin: 1, k_chitin: 1 }, cls: "base", minL: 29 },
  { id: "k_r_bonebow", out: "weapon:k_bonebow", n: "Костяной самострел", need: { k_bone: 2, k_resin: 1, wire: 1 }, cls: "spec", bp: true, minL: 37 },
  { id: "k_r_eeljar", out: "weapon:k_eeljar", n: "Солевая лейденская банка", need: { k_salt: 2, k_wax: 1, wire: 2 }, cls: "spec", minL: 32 },
  { id: "o_r_shardwhip", out: "weapon:o_shardwhip", n: "Хлыст из осколков", need: { o_glass: 2, o_silver: 1, wire: 1 }, cls: "base", minL: 46 },
  { id: "o_r_rime", out: "weapon:o_rime", n: "Иней зеркал", need: { o_quartz: 1, o_echoshard: 1, cap: 2, reagent: 2 }, cls: "spec", bp: true, minL: 50 },
  { id: "m_r_gearsaw", out: "weapon:m_gearsaw", n: "Шестерёночная пила", need: { m_gear: 3, m_casting: 1, servo: 1 }, cls: "base", minL: 69 },
  { id: "m_r_stamper", out: "weapon:m_stamper", n: "Штемпелятор «Отказано»", need: { m_casting: 2, m_relay: 2, g_hydrocyl: 1, m_okochip: 1 }, cls: "spec", bp: true, minL: 72 },
  { id: "i_r_rootwhip", out: "weapon:i_rootwhip", n: "Корневой бич", need: { i_treefiber: 2, k_root: 1, i_omegagel: 1 }, cls: "spec", minL: 89 },
  { id: "i_r_gardenstaff", out: "weapon:i_gardenstaff", n: "Посох садовника", need: { i_treefiber: 2, i_soundlump: 2, i_timesand: 1, m_gear: 2 }, cls: "exp", bp: true, minL: 97 }
];
/* (3.5) Рецепт встаёт в список, когда все его детали уже есть. Сервопривод, ячейка, реле
   и защитная панель появляются в workshop.js, а он подключается позже, — прежде восемь
   рецептов (гвоздемёт, лазерный скальпель, «Оса», «Шёпот», ударный молот, кирка-отбойник,
   луч коногонки, шестерёночная пила) в игру не попадали. Мастерская, добавив детали,
   зовёт LAB.armsLate — и остальные рецепты встают в список. */
function register() {
  REC.forEach(function (rc) {
    for (var k in rc.need) if (!LAB.ITEMS[k]) return;
    if (!LAB.RECIPES.some(function (q) { return q.id === rc.id; })) LAB.RECIPES.push(rc);
  });
}
register();
LAB.armsLate = register;
})();
