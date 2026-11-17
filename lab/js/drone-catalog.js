/* Каталог дрона. Рецепты и параметры отделены от команд и состояния корпуса. */
(function () {
"use strict";
var LAB = window.LAB;
var groups = {
  weapons: "Вооружение", sensors: "Разведка и навигация", service: "Медицина и ремонт",
  armor: "Защита корпуса", cargo: "Груз и ход", energy: "Энергоснабжение", control: "Управление"
};
var equipment = {}, ranks = {};
function add(id, name, group, tier, weight, need, description, measure, levels, options) {
  equipment[id] = Object.assign({ n: name, group: group, tier: tier, wt: weight, need: need, d: description }, options);
  ranks[id] = { n: measure, v: levels };
}
function weapon(id, name, tier, weight, need, text, power, range, cost, cycle, type, extra) {
  add(id, name, "weapons", tier, weight, need, text + " Дальность " + range + ", расход " + cost + ", перезарядка " + cycle + " тактов.",
      "Мощность на базовой глубине", power, { mount: true, weapon: Object.assign({ range: range, cost: cost, cycle: cycle, type: type }, extra) });
}
weapon("pulse", "Импульсный излучатель", 2, 1.1, { optic: 1, wire: 2, cap: 2 }, "Быстрый и экономный огонь по ближайшей цели.", [4,5,6], 6, 2, 5, "energy");
weapon("rail", "Рельсомёт «Стриж»", 4, 3, { servo: 2, magnet: 3, panel: 1, cap: 2 }, "Дальний одиночный выстрел, сильнее по бронированной цели.", [8,10,12], 10, 6, 15, "kinetic", { armored: 1.3 });
weapon("cryo", "Криопроектор", 3, 1.9, { cap: 2, ceramic: 1, supercond: 1, wire: 1 }, "Замедляет ближайшего врага холодом.", [4,6,7], 5, 5, 13, "cryo", { slow: 5 });
weapon("plasma", "Плазменная головка", 4, 2.6, { ceramic: 2, magnet: 2, powercell: 1 }, "Разогревает цель. По органике мощнее, по машине слабее.", [7,9,11], 4, 7, 16, "therm", { organic: 1.35, machine: 0.8 });
weapon("arc", "Дуговой каскад", 4, 2.2, { supercond: 2, relay: 1, cap: 3 }, "Основной импульс и ослабленный разряд по второй видимой цели рядом.", [5,6,8], 6, 6, 12, "shock", { chain: 3 });
weapon("sonic", "Акустический проектор", 3, 2, { panel: 1, cap: 2, wire: 2 }, "Короткий импульс нарушает ориентацию обычного врага.", [3,5,6], 4, 4, 10, "sonic", { blind: 4 });
weapon("ion", "Ионный подавитель", 3, 1.7, { relay: 2, cap: 2, chip: 1 }, "Выбирает только машины и ненадолго глушит их.", [4,6,8], 7, 5, 12, "emp", { target: "mech", slow: 4 });

function sensor(id, name, tier, need, target, text, range, cost) {
  add(id, name, "sensors", tier, 0.7, need, text + " Поиск по открытой линии.",
      "Радиус поиска в шагах", range, { scan: { target: target, cost: cost, cycle: 24 } });
}
sensor("life_array", "Биосканер", 2, { optic: 1, gel: 1, chip: 1 }, "living", "Отличает живых врагов по теплу и отмечает их маяками.", [8,10,12], 8);
sensor("machine_eye", "Датчик приводов", 2, { optic: 1, relay: 1, wire: 2 }, "machine", "Отмечает движущиеся машины.", [9,11,13], 8);
sensor("depot_scope", "Кладовой локатор", 2, { optic: 2, relay: 1 }, "stores", "Находит батареи, припасы и доступные точки снабжения.", [7,9,11], 7);
sensor("latch_scope", "Контурный глаз", 2, { lens: 1, servo: 1, chip: 1 }, "doors", "Слышит видимые двери и проходы, отмеченные на карте.", [8,10,13], 6);
sensor("lab_scope", "Локатор установок", 3, { optic: 2, relay: 2, chip: 1 }, "stations", "Показывает лабораторные столы, терминалы и верстаки.", [9,11,13], 7);
sensor("evac_scope", "Эвакуационный маяк", 3, { optic: 1, powercell: 1, wire: 2 }, "exits", "Помогает искать выходы и места лечения.", [9,12,15], 8);

function service(id, name, tier, need, method, supply, text, levels, cost) {
  add(id, name, "service", tier, 1.1, need, text + " Работает вне боя.",
      "Эффект за применение", levels, { service: { method: method, supply: supply, cost: cost, cycle: 28 } });
}
service("hemo", "Полевой перевязчик", 2, { gel: 1, servo: 1, wire: 1 }, "hemo", "bandage", "Расходует бинт, останавливает кровотечение и восстанавливает здоровье.", [12,16,20], 5);
service("purifier", "Токсикологический блок", 3, { gel: 2, chip: 1, rubber: 1 }, "tox", "sorbent", "Расходует сорбент и выводит токсины.", [26,34,42], 9);
service("insulator", "Нейроизолятор", 3, { ceramic: 1, panel: 1, wire: 2 }, "neuro", "neuroblock", "Расходует нейроблокатор и снижает нейронагрузку.", [30,40,50], 9);
service("welder", "Сварочный манипулятор", 3, { servo: 2, ceramic: 1, cell: 1 }, "weapon", "scrap", "За лом восстанавливает состояние выбранного оружия.", [10,15,20], 10);
service("selfkit", "Саморемонтный блок", 3, { servo: 2, rubber: 1, panel: 1 }, "self", "scrap", "За лом восстанавливает корпус выпущенного дрона.", [9,14,19], 8);
service("tailor", "Шовный блок", 2, { servo: 1, rubber: 2, wire: 2 }, "armor", "rubber", "За прорезиненную ткань чинит надетую броню.", [10,15,20], 8);

add("hull", "Композитный набор корпуса", "armor", 3, 2.5, { panel: 2, ceramic: 2, rubber: 1 }, "Альтернатива усиленному кожуху. Защищает корпус запасом прочности.", "Дополнительная прочность", [20,29,38], { hp: true, exclusive: "hull" });
add("mesh", "Демпферная решётка", "armor", 3, 1.8, { panel: 2, rubber: 2, servo: 1 }, "Смягчает получаемый дроном урон, пока он выпущен.", "Снижение урона в процентах", [12,18,24], { passive: "armor" });
add("reserve", "Резервная ячейка", "energy", 2, 0.6, { cell: 1, cap: 1, wire: 1 }, "Лёгкая альтернатива блоку накопителей.", "Дополнительная ёмкость", [21,30,42], { en: true, exclusive: "battery" });
add("regen", "Инерционный рекуператор", "energy", 3, 1.3, { servo: 1, cap: 2, magnet: 1 }, "На каждом этаже восстанавливает заряд после двадцати пройденных шагов. Срабатывает один раз на этаж.", "Восстановление заряда", [8,12,16], { passive: "recovery" });
add("sling", "Лёгкая подвеска", "cargo", 2, 0.8, { servo: 1, rubber: 2, scrap: 1 }, "Позволяет нести груз. Легче захвата, тяговый блок с ней несовместим.", "Килограммы основной тяги", [8,10,12], { passive: "capacity", exclusive: "cargo" });
add("stabilizer", "Балансир груза", "cargo", 3, 1.1, { servo: 2, rubber: 1, chip: 1 }, "С действующим захватом или подвеской уменьшает задержку шага при перегрузе.", "Сокращение задержки в миллисекундах", [25,40,55], { passive: "stride" });
add("baffle", "Тихая подвеска", "cargo", 2, 0.7, { rubber: 2, ceramic: 1 }, "Снижает шум, который даёт перегруз.", "Снижение шума", [1,2,3], { passive: "noise" });
add("link_amp", "Согласователь кабеля", "energy", 3, 0.9, { relay: 2, cap: 2, wire: 2 }, "Повышает пропускную способность полевого кабеля и уменьшает потери.", "Дополнительный объём передачи", [4,6,8], { passive: "transfer" });
add("charger", "Зарядный преобразователь", "energy", 3, 1, { powercell: 1, relay: 1, cap: 2 }, "Получает больше заряда от одной энергобатареи.", "Прибавка к заряду батареи", [8,12,16], { passive: "charge" });

var existing = {
  sensor: { group: "sensors" }, zapper: { group: "weapons" }, gun: { group: "weapons", mount: true }, arm: { group: "service" },
  screen: { group: "armor" }, cargo: { group: "cargo", exclusive: "cargo" }, scanner: { group: "sensors" },
  battery: { group: "energy", exclusive: "battery" }, boost: { group: "cargo" }, medic: { group: "service" },
  shell: { group: "armor", exclusive: "hull" }, nerve: { group: "control" }
};

/* Настройка действует на один совместимый узел. Положительная экономия уменьшает цену или задержку. */
var metrics = {
  firePower: ["мощность оружия",100,"%"], fireRange: ["дальность оружия",1," шаг."], fireSave: ["экономия выстрела",1," ед."],
  fireCycle: ["сокращение оружейной перезарядки",1," такт."], status: ["длительность помех",1," такт."],
  scanRange: ["радиус поиска",1," шаг."], scanSave: ["экономия поиска",1," ед."], scanCycle: ["сокращение задержки поиска",1," такт."], mark: ["время маяка",1," сек."],
  healPower: ["лечение",1," здоровья"], cleanPower: ["очистка",1," ед."], repairPower: ["ремонт",1," ед."], serviceSave: ["экономия обслуживания",1," ед."],
  serviceCycle: ["сокращение задержки обслуживания",1," такт."], guard: ["перехват урона экраном",100," п. п."], armor: ["смягчение урона корпусу",100," п. п."],
  capacity: ["основная тяга",1," кг"], haul: ["дополнительная тяга",1," кг"], stride: ["сокращение задержки шага",1," мс"], noise: ["приглушение перегруза",1," ед."],
  charge: ["заряд от батареи",1," ед."], commandSave: ["экономия команд",1," ед."], recovery: ["заряд рекуперации",1," ед."],
  transfer: ["предел передачи",1," ед."], transferLoss: ["эффективность передачи",100," п. п."]
};
var weapons = "gun pulse rail cryo plasma arc sonic ion";
var sensors = "sensor scanner life_array machine_eye depot_scope latch_scope lab_scope evac_scope";
var treatment = "hemo medic", cleaning = "purifier insulator", workshop = "arm welder selfkit tailor", serviceModes = treatment + " " + cleaning + " " + workshop;
var tuningRows = [
  ["stiff_bore","Жёсткая направляющая","gun pulse rail","firePower",.09],
  ["long_focus","Дальняя фокусировка","pulse rail ion","fireRange",2],
  ["short_coil","Короткий цикл","gun pulse arc","fireCycle",2],
  ["spent_case","Экономный импульс","pulse rail plasma","fireSave",1],
  ["shell_break","Пробой плотного корпуса","rail arc ion","firePower",.15,"armored"],
  ["water_jet","Тепловая развязка","plasma cryo","fireCycle",3],
  ["conductive_tip","Проводящий наконечник","arc ion zapper","status",2],
  ["delay_line","Сдвиг фазы","cryo sonic zapper","status",3],
  ["organic_lens","Контраст по органике","plasma sonic pulse","firePower",.14,"living"],
  ["machine_filter","Селектор машин","ion arc rail","firePower",.13,"machine"],
  ["wide_beam","Широкий обзор",sensors,"scanRange",2],
  ["relay_economy","Импульсный опрос",sensors,"scanSave",2],
  ["short_poll","Параллельный опрос","scanner depot_scope lab_scope","scanCycle",5],
  ["held_signal","Долгий маяк","sensor life_array machine_eye","mark",10],
  ["door_echo","Селектор проёмов","latch_scope evac_scope","scanRange",3],
  ["port_echo","Фаза установок","lab_scope depot_scope","scanRange",3],
  ["quiet_ping","Короткий импульс маяка","life_array machine_eye evac_scope","scanCycle",4],
  ["threshold_map","Калибровка коридора","sensor latch_scope","scanSave",3],
  ["deep_focus","Сменная оптика","scanner life_array depot_scope","scanRange",1],
  ["signal_cache","Кэш сигнала","machine_eye lab_scope evac_scope","scanSave",2],
  ["gel_unit","Дозированный гель",treatment,"healPower",6],
  ["quick_hem","Быстрая перевязка",treatment,"serviceCycle",6],
  ["bandage_guide","Мягкий податчик","hemo","serviceSave",2],
  ["med_valve","Экономичный клапан","medic","serviceSave",3],
  ["fine_membrane","Тонкая мембрана",cleaning,"cleanPower",8],
  ["clean_flush","Быстрый сброс",cleaning,"serviceCycle",8],
  ["smooth_grip","Микрозахват",workshop,"repairPower",4],
  ["joint_loop","Обход сустава","selfkit arm","serviceSave",1],
  ["weld_pulse","Импульсная доводка","welder","repairPower",6],
  ["fabric_feed","Ровный шов","tailor","serviceSave",2],
  ["shock_liner","Упругий вкладыш","hull shell mesh","armor",.06],
  ["porous_plate","Демпферная пластина","hull mesh","armor",.08],
  ["mesh_tension","Пружинная стяжка","mesh","armor",.1],
  ["shield_field","Расширение поля","screen","guard",.05],
  ["shield_focus","Сведение поля","screen","guard",.08],
  ["hinge_stop","Ограничители рывка","cargo sling","capacity",2],
  ["hook_pair","Двойной подвес","cargo","capacity",3],
  ["light_rings","Облегчённые кольца","sling","capacity",2],
  ["thrust_angle","Настройка угла тяги","boost","haul",3],
  ["elastic_line","Упругие стропы","cargo sling stabilizer","stride",25],
  ["rubber_sleeve","Тихие втулки","baffle stabilizer","noise",1],
  ["stiff_balance","Поперечная опора","stabilizer boost","stride",30],
  ["charge_curve","Кривая поглощения","battery reserve charger","charge",6],
  ["battery_bus","Чистый заряд","charger","charge",9],
  ["reserve_bus","Экономичная шина","battery reserve nerve","commandSave",1],
  ["flywheel","Облегчённый маховик","regen","recovery",5],
  ["return_path","Возврат на прямой","regen","recovery",8],
  ["bridge_wire","Широкий канал","link_amp","transfer",3],
  ["shielded_wire","Экранирование кабеля","link_amp","transferLoss",.05],
  ["balancing_cell","Согласованный накопитель","battery reserve link_amp","transfer",2]
];
var modifications = {};
tuningRows.forEach(function (row) {
  var tier = row[5] || Math.abs(row[4]) >= 8 ? 4 : 3;
  modifications[row[0]] = { n: row[1], fits: row[2].split(" "), metric: row[3], points: row[4], flag: row[5],
    tier: tier, need: tier === 4 ? { wire: 2, relay: 1, chip: 1 } : { wire: 1, scrap: 1, chip: 1 } };
});

/* Десять направлений по четыре специализации и десять по три.
   Идентификаторы четырёх прежних профилей сохраняются в старых записях. */
var branchRows = [
  ["recon","Тактическая разведка","scanRange",1,[
    ["scout","Разведчик","scanRange",1], ["tracker","Следопыт","mark",8], ["observer","Наблюдатель","scanCycle",5], ["sniffer","Пеленгатор","scanSave",2]
  ]],
  ["navigation","Ориентация в комплексе","scanCycle",2,[
    ["cartographer","Картограф","scanRange",2], ["corridor_guide","Проводник по галереям","scanSave",1], ["evac_guide","Наводчик эвакуации","scanRange",3,"evac_scope"], ["door_reader","Чтец контуров","scanRange",4,"latch_scope"]
  ]],
  ["salvage","Поиск снабжения","scanSave",1,[
    ["warehouse","Кладовой разведчик","scanRange",3,"depot_scope"], ["instrument_finder","Искатель установок","scanRange",3,"lab_scope"], ["battery_finder","Охотник за батареями","charge",8], ["supply_route","Снабженец маршрута","capacity",2]
  ]],
  ["ballistics","Прямая огневая поддержка","firePower",.05,[
    ["escort","Охранный","firePower",.07], ["breacher","Взломщик брони","firePower",.19,null,"armored"], ["point_shooter","Стрелок на короткой дистанции","firePower",.16,null,"close"], ["marksman","Дальний дозор","fireRange",2]
  ]],
  ["pulse_ops","Импульсное подавление","status",1,[
    ["ionist","Глушитель приводов","status",2,"ion"], ["cryo_keeper","Холодный дозор","status",2,"cryo"], ["sonic_op","Акустический оператор","status",2,"sonic"], ["arc_op","Оператор каскада","firePower",.14,"arc"]
  ]],
  ["intercept","Перехват целей","fireRange",1,[
    ["patrol","Сменный патруль","fireCycle",3], ["machine_hunt","Удержание машин","firePower",.11,null,"machine"], ["living_hunt","Удержание тварей","firePower",.11,null,"living"], ["long_stun","Дальний разряд","fireRange",3,"zapper"]
  ]],
  ["cooling","Оружейная автоматика","fireCycle",1,[
    ["buffer","Оператор буфера","fireSave",1], ["beam_keeper","Оператор плазмы","fireCycle",4,"plasma"], ["rail_controller","Оператор рельсомёта","fireCycle",4,"rail"], ["short_burst","Импульсный темп","firePower",.1,"pulse"]
  ]],
  ["repair","Полевой ремонт","repairPower",1,[
    ["support","Сервисный","serviceSave",2,"medic",null,["serviceSave",1,"arm"]], ["welder_tech","Оружейный техник","repairPower",5,"welder"], ["armorer","Бронник","repairPower",6,"tailor"], ["mechanic","Слесарь по корпусам","repairPower",5,"selfkit"]
  ]],
  ["medicine","Поддержка раненого","healPower",2,[
    ["field_medic","Полевой медик","healPower",4], ["triage","Сортировщик раненых","serviceCycle",5,"hemo"], ["trauma","Травматолог","healPower",7,"medic"], ["med_orderly","Санитар сопровождения","serviceSave",2,"hemo"]
  ]],
  ["cleansing","Детоксикация и нейрозащита","cleanPower",2,[
    ["toxicology","Токсиколог","cleanPower",7,"purifier"], ["neurotech","Нейротехник","cleanPower",7,"insulator"], ["filter_loop","Оператор фильтра","serviceSave",2,"purifier"], ["field_reset","Оператор нейросброса","serviceCycle",7,"insulator"]
  ]],
  ["guard","Перехват урона","guard",.02,[
    ["guardian","Щитовой напарник","guard",.04], ["armored_guard","Броневой дозор","armor",.05], ["skirmish_guard","Прикрытие рывка","guard",.06,null,"close"]
  ]],
  ["hullcraft","Живучесть корпуса","armor",.04,[
    ["hull_keeper","Смотритель корпуса","armor",.05], ["shock_keeper","Демпферный техник","armor",.06,null,"machine"], ["salvage_guard","Самовосстановление","repairPower",6,"selfkit"]
  ]],
  ["cargo","Перевозка груза","capacity",2,[
    ["cargo","Грузовой","stride",12], ["porter","Носильщик дальнего пути","capacity",2], ["light_porter","Лёгкий носильщик","capacity",4,"sling"]
  ]],
  ["traction","Тяга и баланс","haul",1,[
    ["lift_tech","Оператор тяги","haul",2], ["balance_tech","Балансировщик","stride",23], ["quiet_loader","Тихий грузчик","noise",1]
  ]],
  ["stealth","Тихое сопровождение","noise",1,[
    ["silent_step","Бесшумный ход","stride",18], ["quiet_scout","Тихий дозор","scanSave",2], ["sleeved","Демпфированный подвес","noise",2]
  ]],
  ["accumulator","Зарядка накопителей","charge",4,[
    ["rapid_charge","Быстрая зарядка","charge",6], ["cell_keeper","Хранитель элементов","commandSave",1], ["battery_trade","Полевой электрик","transfer",3]
  ]],
  ["circuits","Экономия электроники","commandSave",1,[
    ["control_loop","Оператор управляющей шины","serviceSave",1], ["scan_economy","Энергосберегающий поиск","scanSave",2], ["fire_economy","Дежурный огневой контур","fireSave",1]
  ]],
  ["reclaim","Рекуперация","recovery",1,[
    ["flywheel_op","Маховичный техник","recovery",5], ["reclaim_route","Маршрутный рекуператор","stride",16], ["reclaim_ground","Полевой восстановитель","charge",6]
  ]],
  ["grid","Передача энергии","transfer",2,[
    ["grid_op","Оператор силовой линии","transfer",3], ["loss_keeper","Мастер слабых потерь","transferLoss",.05], ["grid_medic","Электрик медслужбы","serviceSave",1]
  ]],
  ["diagnostics","Быстрое обслуживание","serviceCycle",2,[
    ["diagnostician","Диагност","serviceCycle",5], ["depot_tech","Техник снабжения","repairPower",3], ["recovery_medic","Дежурный восстановитель","healPower",3]
  ]]
];
var directions = {}, roles = {};
branchRows.forEach(function (row) {
  var dir = directions[row[0]] = { n: row[1], metric: row[2], points: row[3], roles: [] };
  row[4].forEach(function (spec, position) {
    var key = spec[0];
    roles[key] = { n: spec[1], direction: row[0], effects: [[spec[2], spec[3], spec[4], spec[5]]], level: [3,4,6,8][position],
      need: position < 2 ? { chip: 1, wire: 1 } : { chip: 2, wire: 2, relay: 1 } };
    if (spec[6]) roles[key].effects.push(spec[6]);
    dir.roles.push(key);
  });
});
/* Кампания открывает технические документы разных зон комплекса. Документ
   остаётся пригоден у верстака после возвращения с глубины. */
var programs = {};
var theatres = [
  ["relay","Релейный пост",4,"commandSave",1],
  ["shaft","Служебные шахты",8,"stride",14],
  ["watch","Дозор машин",13,"fireRange",1,"machine"],
  ["lab","Опытные лаборатории",20,"scanRange",2],
  ["store","Складские галереи",28,"capacity",2],
  ["hazard","Карантинные сектора",36,"cleanPower",6],
  ["breach","Аварийные шлюзы",45,"guard",.05],
  ["blackout","Резервное освещение",54,"scanSave",2,"dark"],
  ["repair","Ремонтные штольни",64,"repairPower",4],
  ["evac","Эвакуационные галереи",75,"healPower",5],
  ["grid","Энергетические магистрали",88,"transfer",3],
  ["fracture","Исток и разломы",104,"armor",.09],
  ["low","Нижние комплексы",128,"serviceCycle",6]
];
var plans = [
  { id: "route", n: "Маршрутный", shift: 0, scale: 1, bonus: ["scanCycle",2] },
  { id: "economy", n: "Резервный", shift: 2, scale: 0.65, bonus: ["commandSave",1] },
  { id: "field", n: "Усиленный", shift: 4, scale: 1.4, bonus: ["armor",.04], cost: 1 }
];
var followUps = [
  ["search","Опережающий поиск","scanRange",2], ["maintenance","Мастерская в пути","repairPower",3],
  ["aid","Дежурная помощь","healPower",3], ["battery","Дальний заряд","charge",5],
  ["haul","Грузы вылазки","capacity",2], ["attack","Ответный огонь","fireCycle",2],
  ["shield","Прикрытие перехода","guard",.035]
];
var schedules = [
  { id:"shift", n:"длинная смена", shift:0, gain:1, extra:["serviceCycle",3] },
  { id:"standby", n:"экономная вахта", shift:3, gain:.7, extra:["commandSave",1] },
  { id:"surge", n:"форсированный выход", shift:7, gain:1.5, extra:["scanSave",-1] }
];
Object.keys(directions).forEach(function (key, index) {
  var dir = directions[key];
  programs[key] = { family:key, n:dir.n, section:0, depth:1, scale:1, effects:[] };
  theatres.forEach(function (land, num) {
    plans.forEach(function (plan) {
      var id = key + "_" + land[0] + "_" + plan.id;
      programs[id] = { family:key, n:land[1] + ". " + plan.n + " вариант", section:1 + Math.floor(num / 4),
        depth:land[2] + plan.shift, level: Math.min(9, 3 + Math.floor(num / 2)), tier: Math.min(6, 3 + Math.floor(num / 4)),
        scale:plan.scale,
        effects:[[land[3], land[4] * plan.scale, null, land[5]], plan.bonus].concat(plan.cost ? [["commandSave", -plan.cost]] : []) };
    });
  });
  dir.nativeCount = dir.roles.length;
  followUps.forEach(function (focus, num) {
    schedules.forEach(function (schedule) {
      var id = key + "_" + focus[0] + "_" + schedule.id;
      roles[id] = { n:dir.n + ". " + focus[1] + ", " + schedule.n, direction:key, depth:5 + num * 17 + schedule.shift + index % 3,
        level:Math.min(9, 3 + num), tier:Math.min(6, 3 + Math.floor(num / 2)), need:{ chip:2, wire:2, relay:1 },
        effects:[[focus[2], focus[3] * schedule.gain], schedule.extra] };
      dir.roles.push(id);
    });
  });
  if (dir.roles.length < 25) {
    var id = key + "_chief";
    roles[id] = { n:dir.n + ". Ведущий оператор Нижних", direction:key, depth:132, level:9, tier:6, need:{ chip:3, wire:2, relay:2, supercond:1 },
      effects:[[dir.metric, dir.points * 1.7], ["transferLoss", .04]] };
    dir.roles.push(id);
  }
});
var tuneModes = [
  { id:"power", n:"форсированная", shift:6, scale:1.7, side:-1 },
  { id:"economy", n:"бережливая", shift:16, scale:.75, side:1 },
  { id:"reserve", n:"резервная", shift:35, scale:.9, extra:1.25 }
];
function secondary(metric) {
  if (/^fire|^status$/.test(metric)) return ["fireSave",1];
  if (/^scan|^mark$/.test(metric)) return ["scanSave",1];
  if (/^(heal|clean|repair|service)/.test(metric)) return ["serviceSave",1];
  if (/^(armor|guard)$/.test(metric)) return ["armor",.04];
  if (/^(haul|stride|noise|capacity)$/.test(metric)) return ["noise",1];
  return ["commandSave",1];
}
Object.keys(modifications).forEach(function (id, num) {
  var base = modifications[id];
  base.depth = base.tier === 4 ? 9 : 4;
  tuneModes.forEach(function (mode) {
    var extra = secondary(base.metric);
    var side = mode.side ? [extra[0], extra[1] * mode.side] : null;
    var code = id + "_" + mode.id;
    modifications[code] = Object.assign({}, base, { n:base.n + ". " + mode.n + " настройка",
      stage:mode.id, depth:base.depth + mode.shift + (num % 5) * 13, tier:Math.min(6, base.tier + (mode.extra ? 2 : 1)),
      level:mode.extra ? 7 : 4, need:mode.extra ? {wire:3, relay:2, chip:2, cap:1} : {wire:2, relay:1, chip:2},
      points:base.points * mode.scale, side:side, reactive:mode.extra ? base.points * mode.extra : 0 });
  });
});
var difficulty = {
  1: { offset:0, cost:0, energy:1, risk:1, tempo:1 },
  2: { offset:2, cost:1, energy:1.12, risk:1.12, tempo:1.10 },
  3: { offset:5, cost:2, energy:1.25, risk:1.26, tempo:1.20 },
  4: { offset:-2, cost:-1, energy:0.88, risk:.88, tempo:.90 }
};
Object.keys(equipment).forEach(function (k) {
  var md = equipment[k];
  md.depth = md.tier === 2 ? 2 : md.tier === 3 ? 7 : 15;
});
LAB.droneCatalog = { groups:groups, equipment:equipment, ranks:ranks, existing:existing, metrics:metrics,
  modifications:modifications, directions:directions, programs:programs, roles:roles, difficulty:difficulty };
})();
