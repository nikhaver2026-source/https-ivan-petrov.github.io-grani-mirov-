/* ════════════════════════════════════════════════════════════════════
   «Подземная лаборатория» — снабжение и торговля (Альфа 1.5).
   Пункт снабжения на каждом этаже: прилавок с товаром этого этажа (свой
   профиль у каждого этажа, свой набор на каждой глубине), заказ с
   поверхности с доставкой — кто и как везёт, зависит от глубины (см.
   LAB.SUPPLY в goods.js), — и скупка всего, что вы несёте: оружия,
   брони и комбинезонов, модулей, деталей, лекарств, еды, устройств,
   инструментов и ценностей. Та же скупка — у торговых терминалов и у
   выживших-торговцев.
   ════════════════════════════════════════════════════════════════════ */
(function () {
"use strict";
var LAB = window.LAB;
function gm() { return LAB.game; }
function G() { return LAB.game.G; }
function CUR() { return LAB.game.CUR; }
function say(t, o) { LAB.say(t, o); }
function A(name) { var a = LAB.atmos; if (a && typeof a[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return a[name].apply(a, args); } catch (e) { console.warn(e); } } return null; }
function UIx(name) { var u = LAB.ui; if (u && typeof u[name] === "function") { var args = Array.prototype.slice.call(arguments, 1); try { return u[name].apply(u, args); } catch (e) { console.warn(e); } } return null; }
function pl(n, a, b, c) { return gm().plural(n, a, b, c); }
function cr(n) { return n + " " + pl(n, "кредит", "кредита", "кредитов"); }
function now() { var g = G(); return g.min + g.day * 1440; }
function era() { return LAB.SUPPLY[LAB.supplyEra(G().L)]; }
function snd(id) { if (LAB.Bank && LAB.Bank.has && LAB.Bank.has(id)) A("play", id); }

/* ════════ ЧТО ЕСТЬ ЧТО ════════ */
/* Раздел вещи: еда, лекарства, защита, инструменты, ценности, детали, модули, устройства. */
function catOf(id) {
  var d = LAB.ITEMS[id];
  if (!d) return "";
  if (d.cat) return d.cat;
  if (d.kind === "food") return "food";
  if (d.kind === "part") return "part";
  if (d.kind === "wmodule") return "wmodule";
  if (["medkit_s", "medkit_l", "bandage", "antidote", "sorbent", "stim", "energy_d", "neuroblock"].indexOf(id) >= 0) return "med";
  if (d.fx && (d.fx.heal || d.fx.cure) && d.kind === "use" && !d.fx.shield) return "med";
  return "gadget";
}
LAB.itemCat = catOf;
var CAT_N = { implant: "Чипы имплантов", food: "Еда и напитки", med: "Лекарства", protect: "Защита", tool: "Инструменты", valuable: "Ценности", part: "Детали", wmodule: "Модули оружия", gadget: "Устройства и гранаты", trap: "Ловушки и мины", ammo: "Батареи и боеприпасы", weapon: "Оружие", armor: "Броня и комбинезоны" };
LAB.CAT_N = CAT_N;
/* Не продаются: то, без чего не пройти (ключи, пропуска — не вещи рюкзака), и образцы «Колыбели». */
function sellable(id) { var d = LAB.ITEMS[id]; return !!d && d.price > 0 && !d.nosell; }

/* ════════ ЦЕНЫ ════════ */
/* Скупка глубже платит больше, но мягче, чем растут цены прилавка. */
function depthSellK() { var k = gm().priceK ? gm().priceK() : 1; return 1 + (k - 1) * 0.6; }
function profBuy(prof, cat) { var p = LAB.SUPPLY_PROFILES[prof]; return p && p.buy && p.buy[cat] ? p.buy[cat] : 1; }
/* Торговец-выживший скупает своё дороже: медик — лекарства, инженер — детали, повар — еду. */
var NPC_BUY = { med: { med: 1.25, protect: 1.15 }, food: { food: 1.25 }, parts: { part: 1.25, tool: 1.15 }, ammo: { ammo: 1.25, weapon: 1.15 }, all: { valuable: 1.15 } };
function ctxK(ctx, cat) { return ctxK0(ctx, cat) * (LAB.ach && LAB.ach.has("trader") ? 1.1 : 1) * (1 + (LAB.implants ? LAB.implants.stat("sell") : 0)); /* (2.0) чип оценщика */ }
function ctxK0(ctx, cat) {
  if (!ctx) return 1;
  if (ctx.prof) return profBuy(ctx.prof, cat);
  if (ctx.npc && NPC_BUY[ctx.npc] && NPC_BUY[ctx.npc][cat]) return NPC_BUY[ctx.npc][cat];
  return ctx.who === "terminal" ? 0.9 : 1;
}
function itemSellPrice(id, ctx) {
  var d = LAB.ITEMS[id], cat = catOf(id);
  return Math.max(1, Math.round(d.price * (LAB.SELL_K[cat] || LAB.SELL_K[d.kind] || 0.4) * depthSellK() * ctxK(ctx, cat)));
}
function ammoSellPrice(k, ctx) { var a = LAB.AMMO[k]; return Math.max(1, Math.round((a.price || 30) * LAB.SELL_K.ammo * depthSellK() * ctxK(ctx, "ammo"))); }
function condOf(w) { return LAB.workshop && LAB.workshop.cond ? LAB.workshop.cond(w) : 100; }
function weaponSellPrice(w, ctx) {
  var c = condOf(w), mods = 0;
  if (w.mod) for (var m in w.mod) mods += w.mod[m] || 0;
  return Math.max(3, Math.round(LAB.weaponPrice(w) * LAB.SELL_K.weapon * (0.35 + 0.65 * Math.max(0, Math.min(100, c)) / 100) * (LAB.QUAL_MULT[w.qual] || 1) * ctxK(ctx, "weapon")) + mods * 12);
}
function armorValue(a) { var d = LAB.ARMORS[a.base] || { price: 50 }; return d.price * (LAB.QUAL_MULT[a.qual] || 1) * (1 + 0.04 * Math.max(0, (a.lvl || 1) - 1)); }
/* (2.0) изношенная броня — дешевле, как изношенное оружие */
function armorSellPrice(a, ctx) { var c = LAB.armorCond ? LAB.armorCond(a) : 100; return Math.max(3, Math.round(armorValue(a) * LAB.SELL_K.armor * (0.35 + 0.65 * c / 100) * ctxK(ctx, "armor")) + (a.up || 0) * 30); }
LAB.sellPrice = { item: itemSellPrice, ammo: ammoSellPrice, weapon: weaponSellPrice, armor: armorSellPrice };
function buyK() { return gm().priceK ? gm().priceK() : 1; }
function itemBuyPrice(id) { return Math.max(2, Math.round(LAB.ITEMS[id].price * buyK())); }
function ammoBuyPrice(k) { return Math.max(2, Math.round((LAB.AMMO[k].price || 30) * buyK() * (G().faction === "sec" ? 0.85 : 1))); }
function armorBuyPrice(a) { var L = G().L; return Math.round(armorValue(a) * (L <= 10 ? 1 + 0.15 * (L - 1) : 0.6 + 0.4 * LAB.wealth(L, G().F)) * (G().faction === "res" ? 0.8 : 1)); }
function weaponBuyPrice(w) { return Math.round(LAB.weaponPrice(w) * (LAB.QUAL_MULT[w.qual] || 1) * 1.1); }
function bpPrice(rc) { return Math.round((90 + 25 * (rc.minL || 1)) * Math.min(4, buyK())); }

/* ════════ СКУПКА ВСЕГО ════════
   ctx: { who: "supply" | "terminal" | "npc", prof — профиль пункта, npc —
   чем торгует выживший, name — заголовок }. Надетое и оружие в руках
   продаются после вопроса; последнее оружие не продаётся. */
function sellMenu(ctx, back) {
  ctx = ctx || { who: "terminal" };
  var build = function () { return sellCats(ctx, back); };
  UIx("menu", (ctx.name || "Скупка") + ". Кредитов " + G().credits, build(), { keep: true, rebuild: build });
}
function sellCats(ctx, back) {
  var g = G(), items = [], inv = {};
  Object.keys(g.inv).forEach(function (id) { if (g.inv[id] > 0 && sellable(id)) { var c = catOf(id); (inv[c] = inv[c] || []).push(id); } });
  if (g.weapons.length) items.push({ label: "Оружие: " + g.weapons.length + (g.weapons.length < 2 ? " — последнее не продаётся" : ""), fn: function () { sellWeapons(ctx, back); } });
  if (g.armors.length) items.push({ label: "Броня и комбинезоны: " + g.armors.length + (g.armor ? ", одна надета" : ""), fn: function () { sellArmors(ctx, back); } });
  ["implant", "wmodule", "part", "valuable", "med", "protect", "food", "gadget", "trap", "tool"].forEach(function (c) {
    var ids = inv[c]; if (!ids || !ids.length) return;
    var n = ids.reduce(function (a, k) { return a + (g.inv[k] || 0); }, 0);
    items.push({ label: CAT_N[c] + ": " + n + (ctxK(ctx, c) > 1.05 ? " — здесь платят дороже" : ""), fn: function () { sellItems(ctx, c, back); } });
  });
  var am = Object.keys(g.ammo).filter(function (k) { return g.ammo[k] > 0 && LAB.AMMO[k]; });
  if (am.length) items.push({ label: "Батареи и боеприпасы: " + am.reduce(function (a, k) { return a + g.ammo[k]; }, 0), fn: function () { sellAmmo(ctx, back); } });
  if (!items.length) items.push({ label: "Продавать нечего", disabled: true, fn: function () {} });
  items.push({ label: "Назад", fn: function () { if (back) back(); } });
  return items;
}
function soldSay(what, p) {
  A("play", "buy");
  say("Продано: " + what + ", " + cr(p) + ". Кредитов: " + G().credits + ".");
  if (LAB.ach) LAB.ach.ev("sold", p);
  gm().autosaveSoon();
}
function sellItems(ctx, cat, back) {
  var build = function () {
    var g = G(), items = [];
    Object.keys(g.inv).forEach(function (id) {
      if (!(g.inv[id] > 0) || !sellable(id) || catOf(id) !== cat) return;
      var p = itemSellPrice(id, ctx), d = LAB.ITEMS[id];
      items.push({ label: "Продать: " + d.n + " (у вас " + g.inv[id] + ") — " + cr(p), fn: function () {
        if (!(G().inv[id] > 0)) { say("Больше нет."); return; }
        G().inv[id]--; G().credits += p; soldSay(d.n.charAt(0).toLowerCase() + d.n.slice(1), p);
      } });
      if (g.inv[id] > 1) items.push({ label: "Продать все: " + d.n + " (" + g.inv[id] + ") — " + cr(p * g.inv[id]), fn: function () {
        var n = G().inv[id] || 0; if (!n) { say("Больше нет."); return; }
        G().inv[id] = 0; G().credits += p * n; soldSay(d.n.charAt(0).toLowerCase() + d.n.slice(1) + ", " + n + " шт.", p * n);
      } });
    });
    if (!items.length) items.push({ label: "Здесь больше нечего продать", disabled: true, fn: function () {} });
    items.push({ label: "Назад", fn: function () { sellMenu(ctx, back); } });
    return items;
  };
  UIx("menu", "Продать: " + (CAT_N[cat] || "").toLowerCase(), build(), { keep: true, rebuild: build });
}
function sellAmmo(ctx, back) {
  var build = function () {
    var g = G(), items = [];
    Object.keys(g.ammo).forEach(function (k) {
      if (!(g.ammo[k] > 0) || !LAB.AMMO[k]) return;
      var p = ammoSellPrice(k, ctx), nm = LAB.AMMO[k].n;
      items.push({ label: "Продать: " + nm + " (у вас " + g.ammo[k] + ") — " + cr(p), fn: function () {
        if (!(G().ammo[k] > 0)) { say("Больше нет."); return; }
        G().ammo[k]--; G().credits += p; soldSay(nm.charAt(0).toLowerCase() + nm.slice(1), p);
      } });
    });
    if (!items.length) items.push({ label: "Батарей больше нет", disabled: true, fn: function () {} });
    items.push({ label: "Назад", fn: function () { sellMenu(ctx, back); } });
    return items;
  };
  UIx("menu", "Продать: батареи и боеприпасы", build(), { keep: true, rebuild: build });
}
function sellWeapons(ctx, back) {
  var build = function () {
    var g = G(), items = [];
    g.weapons.forEach(function (w, i) {
      var p = weaponSellPrice(w, ctx), inHand = i === g.wi;
      items.push({ label: "Продать: " + w.name + (inHand ? ", в руках" : "") + ", состояние " + Math.round(condOf(w)) + " — " + cr(p), fn: function () {
        if (G().weapons.length < 2) { LAB.UI.error(); say("Это последнее оружие: без него не продают."); return; }
        var go = function () { removeWeapon(w); G().credits += p; soldSay(w.name, p); sellWeapons(ctx, back); };
        if (inHand || w.id === "w_start_crowbar") confirm((inHand ? w.name + " у вас в руках. " : "") + (w.id === "w_start_crowbar" ? "Монтировкой вскрывают запертые шкафчики. " : "") + "Продать за " + cr(p) + "?", go, function () { sellWeapons(ctx, back); });
        else go();
      } });
    });
    items.push({ label: "Назад", fn: function () { sellMenu(ctx, back); } });
    return items;
  };
  UIx("menu", "Продать оружие", build(), { keep: true, rebuild: build });
}
function removeWeapon(w) {
  var g = G(), i = g.weapons.indexOf(w);
  if (i < 0) return;
  var held = g.weapons[g.wi];
  g.weapons.splice(i, 1);
  if (held === w) { g.wi = 0; g.drawn = false; } else g.wi = Math.max(0, g.weapons.indexOf(held));
  if (g.wi >= g.weapons.length) g.wi = 0;
  /* модули с проданного оружия уходят вместе с ним — их цена в цене оружия */
}
function sellArmors(ctx, back) {
  var build = function () {
    var g = G(), items = [];
    g.armors.forEach(function (a) {
      var on = g.armor && g.armor.id === a.id, p = armorSellPrice(a, ctx);
      items.push({ label: "Продать: " + a.name + (on ? ", надета" : "") + " — " + cr(p), fn: function () {
        var go = function () {
          var k = G().armors.indexOf(a); if (k < 0) { say("Уже продано."); return; }
          if (G().armor && G().armor.id === a.id) {
            if (LAB.combat && LAB.combat.danger()) { LAB.UI.error(); say("Переодеваться в бою нельзя."); return; }
            G().armor = null; A("play", "armor_on");
          }
          G().armors.splice(k, 1); G().credits += p; soldSay(a.name, p); sellArmors(ctx, back);
        };
        if (on) confirm(a.name + " сейчас на вас. Снять и продать за " + cr(p) + "?", go, function () { sellArmors(ctx, back); });
        else go();
      } });
    });
    if (!items.length) items.push({ label: "Брони больше нет", disabled: true, fn: function () {} });
    items.push({ label: "Назад", fn: function () { sellMenu(ctx, back); } });
    return items;
  };
  UIx("menu", "Продать броню и комбинезоны", build(), { keep: true, rebuild: build });
}
function confirm(q, yes, no) {
  UIx("menu", q, [
    { label: "Да, продать", fn: yes },
    { label: "Нет", fn: function () { if (no) no(); } }
  ]);
}

/* ════════ ПУНКТ СНАБЖЕНИЯ ════════ */
/* Профиль пункта — по этажу: соседние этажи торгуют разным. */
function profileOf(o) {
  if (o.prof && LAB.SUPPLY_PROFILES[o.prof]) return o.prof;
  var h = LAB.hash32("prof:" + G().seed + ":" + G().L + ":" + G().F);
  return LAB.SUPPLY_PROFILE_IDS[h % LAB.SUPPLY_PROFILE_IDS.length];
}
/* Полка: чем торгуют на этой глубине — свежее (своей глубины) чаще. */
function shelfPool(L) {
  var out = [];
  for (var id in LAB.ITEMS) {
    var d = LAB.ITEMS[id];
    if (!d.price || d.surf || d.nosell || d.kind === "valuable" || id === "proto" || id === "okokey") continue;
    if (["food", "use", "throw", "deploy", "tool", "part", "wmodule", "trap"].indexOf(d.kind) < 0) continue;
    if (!LAB.srcOk(d, "buy")) continue; /* (2.0) только верстак или только находка — не на прилавке */
    var dep = d.depth || (d.kind === "part" ? LAB.PART_DEPTH[id] || 1 : 1);
    if (dep > L || dep >= 99) continue;
    var c = catOf(id);
    out.push({ id: id, cat: c, fresh: dep > L - (L > 10 ? 20 : 4) });
  }
  for (var ak in LAB.AMMO) { var a = LAB.AMMO[ak]; if ((a.depth || 1) <= L) out.push({ ammo: ak, cat: "ammo", fresh: (a.depth || 1) > L - 20 }); }
  return out;
}
function makeStock(o) {
  var g = G(), L = g.L, prof = profileOf(o), P = LAB.SUPPLY_PROFILES[prof];
  var r = LAB.Rng(g.seed, "supply:" + L + ":" + g.F + ":" + o.id + ":" + (objSt(o).restocks || 0));
  var pool = shelfPool(L), lines = [], used = {};
  var want = function (e) { return (P.want[e.cat === "wmodule" ? "gadget" : e.cat] || (e.cat === "gadget" && P.want.gadget) || 0.6) * (e.fresh ? 1.6 : 1); };
  var nLines = 12 + r.int(0, 4);
  for (var k = 0; k < nLines * 6 && lines.length < nLines; k++) {
    var tot = 0; pool.forEach(function (e) { if (!used[e.id || e.ammo]) tot += want(e); });
    if (tot <= 0) break;
    var x = r.next() * tot, pick = null;
    for (var i = 0; i < pool.length; i++) { var e = pool[i]; if (used[e.id || e.ammo]) continue; x -= want(e); if (x <= 0) { pick = e; break; } }
    if (!pick) break;
    used[pick.id || pick.ammo] = 1;
    var n = pick.cat === "food" || pick.cat === "ammo" ? r.int(2, 6) : pick.cat === "part" || pick.cat === "med" ? r.int(1, 4) : r.int(1, 2);
    lines.push(pick.ammo ? { ammo: pick.ammo, n: n } : { id: pick.id, n: n });
  }
  /* броня и комбинезоны: защитный пункт — костюмы от излучения и химии */
  var arm = [];
  var radPool = ["radcape", "radsuit", "hazmat", "reactorsuit"].filter(function (b) { return LAB.ARMORS[b] && LAB.ARMORS[b].depth <= Math.max(2, L); });
  if (prof === "guard" && radPool.length) arm.push(LAB.makeArmor(r.pick(radPool), LAB.foeLevel(L, g.F), 1 + r.int(0, 2), "sa1_" + CUR().key + o.id));
  if (prof === "guard" || prof === "all" || r.chance(0.5)) arm.push(LAB.genArmor(r, L, g.F, { id: "sa2_" + CUR().key + o.id }));
  if (prof !== "guard" && radPool.length && r.chance(0.35)) arm.push(LAB.makeArmor(r.pick(radPool), LAB.foeLevel(L, g.F), 1, "sa3_" + CUR().key + o.id));
  /* оружие: в оружейном пункте — два ствола, в общем — иногда один */
  var wpn = [];
  var nW = prof === "arms" ? 2 : prof === "all" && r.chance(0.5) ? 1 : 0;
  for (var wi = 0; wi < nW; wi++) wpn.push(LAB.genWeapon(r, L, g.F, { bonus: 0.05, channel: "buy" }));
  wpn.forEach(function (w, i) { w.id = "sw" + i + "_" + CUR().key + o.id; });
  /* схемы: одна — та, которой у вас нет */
  var bps = LAB.RECIPES.filter(function (rc) { return rc.bp && (rc.minL || 1) <= Math.max(L, 2) && !(g.bp && g.bp[rc.id]); });
  var bp = bps.length && (prof === "tech" || prof === "guard" || r.chance(0.4)) ? r.pick(bps).id : null;
  return { lines: lines, arm: arm, wpn: wpn, bp: bp, t: now(), prof: prof };
}
function objSt(o) { return gm().objState(o); }
function stockOf(o) {
  var st = objSt(o);
  /* товар пополняется: через четыре часа по часам комплекса — новый привоз */
  if (st.stock && now() - (st.stock.t || 0) >= 240) { st.restocks = (st.restocks || 0) + 1; st.stock = null; }
  if (!st.stock) st.stock = makeStock(o);
  return st.stock;
}
function lineName(e) { return e.ammo ? LAB.AMMO[e.ammo].n : LAB.ITEMS[e.id].n; }
function linePrice(e, prof) {
  var base = e.ammo ? ammoBuyPrice(e.ammo) : itemBuyPrice(e.id);
  var cat = e.ammo ? "ammo" : catOf(e.id);
  /* свой товар профиля — чуть дешевле */
  var P = LAB.SUPPLY_PROFILES[prof];
  return Math.max(2, Math.round(base * (P && P.want[cat] >= 3 ? 0.9 : 1)));
}
function postName(o) { return era().n; }
function postMenu(o) {
  snd("vend");
  var st = stockOf(o), prof = st.prof, P = LAB.SUPPLY_PROFILES[prof];
  if (LAB.ach) LAB.ach.ev("post", 1);
  var build = function () {
    var g = G(), items = [], ready = (g.orders || []).filter(function (q) { return q.st === "ready"; });
    if (ready.length) items.push({ label: "Забрать заказ: " + ready.map(function (q) { return q.name; }).join(", "), fn: function () { pickup(o); } });
    items.push({ label: "Прилавок: товар этажа, профиль — " + P.n, fn: function () { counterMenu(o); } });
    items.push({ label: "Заказать с поверхности: доставка " + deliveryText(), fn: function () { orderMenu(o); } });
    var way = (g.orders || []).filter(function (q) { return q.st === "way"; });
    if (way.length) items.push({ label: "Заказы в пути: " + way.length, keep: true, fn: function () { say(way.map(function (q) { var m = Math.max(0, q.due - now()); return q.name + " — примерно через " + m + " " + pl(m, "минуту", "минуты", "минут"); }).join(". ") + "."); } });
    items.push({ label: "Продать: сдать в возвратную капсулу", fn: function () { sellMenu({ who: "supply", prof: prof, name: "Скупка пункта снабжения" }, function () { postMenu(o); }); } });
    items.push({ label: "Как сюда приходят товары", keep: true, fn: function () { var e = era(); say(e.n + ". Профиль этажа — " + P.n + ": " + P.desc + ". " + e.how); } });
    items.push({ label: "Отойти", fn: function () {} });
    return items;
  };
  UIx("menu", postName(o) + ". Кредитов " + G().credits, build(), { keep: true, rebuild: build });
}
function counterMenu(o) {
  var st = stockOf(o), prof = st.prof;
  var build = function () {
    var items = [];
    st.lines.forEach(function (e) {
      if (!(e.n > 0)) return;
      var p = linePrice(e, prof);
      items.push({ label: lineName(e) + " — " + cr(p) + ", осталось " + e.n, fn: function () {
        if (!(e.n > 0)) { say("Это уже раскупили."); return; }
        if (G().credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + G().credits + "."); return; }
        G().credits -= p; e.n--;
        if (e.ammo) G().ammo[e.ammo] = (G().ammo[e.ammo] || 0) + 1; else G().inv[e.id] = (G().inv[e.id] || 0) + 1;
        A("play", "buy"); say("Куплено: " + lineName(e).toLowerCase() + ". Осталось " + cr(G().credits) + ".");
        if (LAB.ach) LAB.ach.ev("bought", p);
        gm().autosaveSoon();
      } });
    });
    st.arm.forEach(function (a, i) {
      if (!a) return;
      var p = armorBuyPrice(a);
      items.push({ label: "Броня: " + gm().armorLine(a) + " — " + cr(p), fn: function () {
        if (!st.arm[i]) { say("Уже продано."); return; }
        if (G().credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + G().credits + "."); return; }
        G().credits -= p; var got = st.arm[i]; st.arm[i] = null;
        A("play", "buy"); say("Куплено. " + gm().giveItem({ kind: "armor", a: got }, true) + " Осталось " + cr(G().credits) + ".");
        if (LAB.ach) LAB.ach.ev("bought", p);
        gm().autosaveSoon();
      } });
    });
    st.wpn.forEach(function (w, i) {
      if (!w) return;
      var p = weaponBuyPrice(w);
      items.push({ label: "Оружие: " + gm().weaponLine(w) + " — " + cr(p), fn: function () {
        if (!st.wpn[i]) { say("Уже продано."); return; }
        if (G().credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + G().credits + "."); return; }
        G().credits -= p; var got = st.wpn[i]; st.wpn[i] = null;
        A("play", "buy"); say("Куплено. " + gm().giveItem({ kind: "weapon", w: got }, true) + " Осталось " + cr(G().credits) + ".");
        if (LAB.ach) LAB.ach.ev("bought", p);
        gm().autosaveSoon();
      } });
    });
    if (st.bp && !(G().bp && G().bp[st.bp])) {
      var rc = LAB.RECIPES.filter(function (q) { return q.id === st.bp; })[0];
      if (rc) {
        var bpP = bpPrice(rc);
        items.push({ label: "Схема для мастерской: «" + rc.n + "» — " + cr(bpP), fn: function () {
          if (G().bp && G().bp[rc.id]) { say("Эта схема уже у вас."); return; }
          if (G().credits < bpP) { LAB.UI.error(); say("Не хватает кредитов: нужно " + bpP + ", у вас " + G().credits + "."); return; }
          G().credits -= bpP; G().bp = G().bp || {}; G().bp[rc.id] = 1; st.bp = null;
          A("play", "buy"); say("Схема «" + rc.n + "» записана в «Эхо»: её можно собрать у подходящего верстака. Осталось " + cr(G().credits) + ".");
          if (LAB.ach) LAB.ach.ev("bought", bpP);
          gm().autosaveSoon();
        } });
      }
    }
    if (items.length === 0) items.push({ label: "Прилавок пуст: новый привоз — через несколько часов", disabled: true, fn: function () {} });
    items.push({ label: "Назад", fn: function () { postMenu(o); } });
    return items;
  };
  UIx("menu", "Прилавок. Кредитов " + G().credits, build(), { keep: true, rebuild: build });
}

/* ════════ ЗАКАЗ С ПОВЕРХНОСТИ ════════
   Заказ оплачивается сразу и приходит через время (по часам комплекса:
   шаг — минута); забрать его можно в любом пункте снабжения. Пока на
   этаже тревога, ОКО держит заслонки магистрали закрытыми. */
function deliveryMins() { var e = era(); return Math.max(10, Math.round(e.mins(G().L))); }
function deliveryText() { var m = era() === LAB.SUPPLY[5] ? "непредсказуемая" : "примерно через " + deliveryMins() + " " + pl(deliveryMins(), "минуту", "минуты", "минут"); return m; }
function surfaceCatalog() {
  var L = G().L, out = [];
  for (var id in LAB.ITEMS) { var d = LAB.ITEMS[id]; if (d.surf) out.push({ id: id }); }
  ["medkit_s", "medkit_l", "trauma", "antirad", "iodine", "radaway", "respirator", "dosimeter", "tape", "decoder", "lockpick", "jammer", "filter", "wrepair", "fieldkit", "repairkit", "engkit", "toolkit", "wirecutters", "lead", "rubber", "filtercart"].forEach(function (id) { var d = LAB.ITEMS[id]; if (d && (d.depth || 1) <= Math.max(L, 3)) out.push({ id: id }); });
  ["energy", "magnetron", "slug"].forEach(function (k) { if (LAB.AMMO[k] && (LAB.AMMO[k].depth || 1) <= L + 1) out.push({ ammo: k }); });
  ["radcape", "radsuit", "hazmat", "reactorsuit"].forEach(function (b) { if (LAB.ARMORS[b] && LAB.ARMORS[b].depth <= Math.max(L, 2) + 1) out.push({ armor: b }); });
  return out;
}
function orderPrice(e) {
  var mk = era().markup;
  if (e.armor) return Math.round(LAB.ARMORS[e.armor].price * (G().L <= 10 ? 1 + 0.15 * (G().L - 1) : 0.6 + 0.4 * LAB.wealth(G().L, G().F)) * mk);
  return Math.round((e.ammo ? ammoBuyPrice(e.ammo) : itemBuyPrice(e.id)) * mk);
}
function orderName(e) { return e.armor ? LAB.ARMORS[e.armor].n.charAt(0).toUpperCase() + LAB.ARMORS[e.armor].n.slice(1) : e.ammo ? LAB.AMMO[e.ammo].n : LAB.ITEMS[e.id].n; }
function orderMenu(o) {
  var build = function () {
    var g = G(), items = [], pend = (g.orders || []).filter(function (q) { return q.st !== "done"; }).length;
    surfaceCatalog().forEach(function (e) {
      var p = orderPrice(e), nm = orderName(e);
      items.push({ label: nm + (e.id && LAB.ITEMS[e.id].surf ? ", с поверхности" : "") + " — " + cr(p), fn: function () {
        if ((G().orders || []).filter(function (q) { return q.st !== "done"; }).length >= 4) { LAB.UI.error(); say("В пути уже четыре заказа: магистраль больше не берёт. Заберите прибывшие."); return; }
        if (G().credits < p) { LAB.UI.error(); say("Не хватает кредитов: нужно " + p + ", у вас " + G().credits + "."); return; }
        G().credits -= p;
        var q = { id: "q" + Date.now().toString(36) + Math.floor(Math.random() * 1e4), name: nm, item: e.id || null, ammo: e.ammo || null, armor: e.armor || null, due: now() + deliveryMins(), st: "way", era: LAB.supplyEra(G().L) };
        (G().orders = G().orders || []).push(q);
        snd("pneumo_send"); A("play", "term_ok");
        say(era().ord + " " + nm + ": " + cr(p) + " списано, доставка " + deliveryText() + ". Забрать — в любом пункте снабжения.");
        if (LAB.ach) LAB.ach.ev("order", 1);
        gm().autosaveSoon();
      } });
    });
    items.unshift({ label: "В пути и ждут: " + pend + " из 4. Кредитов " + g.credits, disabled: true, fn: function () {} });
    items.push({ label: "Назад", fn: function () { postMenu(o); } });
    return items;
  };
  UIx("menu", "Заказ с поверхности", build(), { keep: true, rebuild: build });
}
function pickup(o) {
  var g = G(), got = [];
  (g.orders || []).forEach(function (q) {
    if (q.st !== "ready") return;
    q.st = "done";
    if (q.armor) got.push(gm().giveItem({ kind: "armor", a: LAB.makeArmor(q.armor, LAB.foeLevel(g.L, g.F), 2) }, true));
    else if (q.ammo) got.push(gm().giveItem({ kind: "ammo", ammo: q.ammo, n: 1 }, true));
    else if (q.item) got.push(gm().giveItem({ kind: "item", item: q.item, n: 1 }, true));
  });
  g.orders = (g.orders || []).filter(function (q) { return q.st !== "done"; });
  if (!got.length) { say("Прибывших капсул нет."); return; }
  A("play", "pickup"); snd("pneumo_open");
  say("Вы открыли капсулу. " + got.join(" "));
  if (LAB.ach) LAB.ach.ev("delivered", got.length);
  gm().autosaveSoon();
  postMenu(o);
}
/* Время идёт (шаг — минута): прибывшие капсулы объявляются; при тревоге ОКО держит заслонки. */
var lastHeld = 0;
function tick() {
  var g = G();
  if (!g || !g.orders || !g.orders.length) return;
  var t = now(), arrived = [];
  g.orders.forEach(function (q) {
    if (q.st !== "way" || q.due > t) return;
    var lv = LAB.oko ? LAB.oko.level() : 0;
    if (lv >= 3 && lv <= 5) {
      q.due = t + 15;
      if (Date.now() - lastHeld > 30000) { lastHeld = Date.now(); say("ОКО закрыло заслонки магистрали снабжения: пока на этаже тревога, капсулы стоят.", { prio: "event" }); }
      return;
    }
    q.st = "ready"; arrived.push(q.name);
  });
  if (arrived.length) {
    var e = LAB.SUPPLY[(g.orders.filter(function (q) { return q.st === "ready"; })[0] || {}).era || LAB.supplyEra(g.L)] || era();
    snd("pneumo_arrive");
    say(e.arrive + " Заказ прибыл: " + arrived.join(", ") + ". Забрать — в любом пункте снабжения.", { prio: "event" });
  }
}

LAB.supply = {
  postMenu: postMenu, sellMenu: sellMenu, tick: tick, catOf: catOf, stockOf: stockOf, profileOf: profileOf,
  itemSellPrice: itemSellPrice, weaponSellPrice: weaponSellPrice, armorSellPrice: armorSellPrice, ammoSellPrice: ammoSellPrice,
  surfaceCatalog: surfaceCatalog, orderPrice: orderPrice, deliveryMins: deliveryMins, now: now
};
})();
