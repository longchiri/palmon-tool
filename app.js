// =====================================================
// Palmon Tool — Web Edition
// =====================================================
//
// 단일 페이지 앱. palmonDB.json 을 fetch 해서 메모리에 적재.
// 데스크톱 PyQt 버전의 로직(PlannerFixed + Calculator)을 그대로 JS로 포팅.
// =====================================================

"use strict";

// ===== 상수 =====
const BUILDING_ORDER = ["캠프", "분대", "연구대", "병원", "아미고 기지"];
const LEVEL_LABELS = {
  "캠프": "캠프",
  "분대": "분대(원정 파티)",
  "연구대": "연구대",
  "병원": "병원",
  "아미고 기지": "아미고 기지",
};
const SETTINGS_LEVEL_KEYS = {
  "캠프": "camp", "분대": "squad", "연구대": "research_lab",
  "병원": "hospital", "아미고 기지": "amigo_base",
};
const RESOURCE_LABELS = { gold: "골드", wood: "목재", steel: "강철" };
const RESOURCE_KEYS = ["gold", "wood", "steel"];
const BOX_TIERS = ["SR", "SSR", "UR"];
const POSITION_NAMES = ["총독", "수석 건축사", "과학자", "왕비"];
const TEMPLE_ROLE_NAMES = ["LV6 성전 건설 참모", "LV6 성전 건설 지휘관"];

const SPEEDUP_GROUPS = [
  { key: "general_speedups", title: "일반 가속" },
  { key: "build_speedups", title: "건설 가속" },
  { key: "research_speedups", title: "연구 가속" },
  { key: "training_speedups", title: "훈련 가속" },
  { key: "medical_speedups", title: "의료 가속" },
];

const DEFAULT_SPEEDUPS = { "8h": 28800, "3h": 10800, "1h": 3600, "5m": 300, "1m": 60 };

const PALMON_RESOURCE_ORDER = ["palmon_xp", "power", "gold", "steel", "wood"];
const PALMON_RESOURCE_LABELS = {
  palmon_xp: "팰몬 경험치",
  power: "전력",
  gold: "골드",
  steel: "강철",
  wood: "목재",
};

const BEAD_PER_WEAPON = 150;
const PROMO_PER_PALMON = 975;
const EVO_PER_PALMON = 300;
const EVO_VALUES = { "1진화": 20, "2진화": 40, "3진화": 80, "4진화": 160 };

// ───────── 라벨 툴팁 (i 버튼으로 표시될 in-game 출처) ─────────
const TOOLTIPS = {
  "VIP 레벨": "VIP 레벨",
  "직위": "왕국직위",
  "고효율 건축 I": "연구대 → 발전",
  "고효율 건축 II": "연구대 → 발전",
  "고효율 건축 III": "연구대 → 발전",
  "고효율 건축 IV": "연구대 → 발전",
  "초기기술": "길드 스킬",
  "소생기술": "길드 스킬",
  "건설자의 열정": "시즌 스킬",
  "건설 지원": "시즌 스킬",
  "참모 / 지휘관": "성전건설 참모 / 지휘관",
  "정교한 공예": "연구대 → 발전",
  "비용 절감": "시즌 스킬",
};

// ===== 전역 상태 =====
let DB = null;       // palmonDB.json
let BUFF_MAP = {};   // name -> buff

// ===== 헬퍼 =====
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);
const fmt = (n) => Number(n).toLocaleString("ko-KR");

function toast(msg) {
  const el = $("toast");
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const k in attrs) {
    if (k === "class") e.className = attrs[k];
    else if (k === "html") e.innerHTML = attrs[k];
    else if (k.startsWith("on")) e.addEventListener(k.slice(2), attrs[k]);
    else e.setAttribute(k, attrs[k]);
  }
  for (const c of children) {
    if (c == null) continue;
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  return e;
}

function secondsToText(seconds) {
  seconds = Math.max(0, Math.floor(seconds));
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const parts = [];
  if (days) parts.push(`${days}일`);
  if (hours || parts.length) parts.push(`${hours}시간`);
  if (minutes || parts.length) parts.push(`${minutes}분`);
  parts.push(`${secs}초`);
  return parts.join(" ");
}

// ===== Planner (PlannerFixed 로직) =====
function planUpgrades(currentLevels, targetCamp, buildings) {
  const steps = [];
  const state = { ...currentLevels };

  function ensureLevel(building, targetLevel) {
    const cur = state[building] || 0;
    if (cur >= targetLevel) return;
    const max = Math.max(...Object.keys(buildings[building]).map((x) => parseInt(x)));
    if (targetLevel > max) {
      throw new Error(`${building} 목표 레벨 ${targetLevel} 데이터가 없습니다. 최대 ${max}레벨까지 지원합니다.`);
    }

    while (state[building] < targetLevel) {
      const nextLevel = state[building] + 1;

      if (building !== "캠프" && nextLevel > (state["캠프"] || 0)) {
        ensureLevel("캠프", nextLevel);
      }

      const info = buildings[building][String(nextLevel)];
      if (!info) throw new Error(`${building} ${nextLevel}레벨 데이터가 없습니다.`);

      for (const req of info.requirements || []) {
        ensureLevel(req.building, parseInt(req.level));
      }

      const baseCost = {};
      for (const k in (info.cost || {})) baseCost[k] = Math.round(info.cost[k] * 1_000_000);
      const baseSeconds = Math.round((info.base_time_minutes || 0) * 3600);

      steps.push({
        building,
        fromLevel: state[building],
        toLevel: nextLevel,
        baseCost,
        baseSeconds,
      });
      state[building] = nextLevel;
    }
  }

  ensureLevel("캠프", targetCamp);
  return steps;
}

// ===== Calculator =====
function collectBuffs(selections) {
  let buildSpeedSum = 0;
  let fixedSecondsSum = 0;
  let resourceRateSum = 0;
  const details = [];

  function addBuff(name, level) {
    if (!level || level === "미적용") return;
    const buff = BUFF_MAP[name];
    if (!buff) return;
    const v = buff.values?.[level];
    if (!v) return;
    const rate = parseFloat(v.rate || 0);
    const fixedMin = parseFloat(v.fixed_minutes || 0);
    if (buff.effect_kind === "build_speed") {
      buildSpeedSum += rate;
      fixedSecondsSum += Math.round(fixedMin * 60);
    } else if (buff.effect_kind === "resource_reduction") {
      resourceRateSum += rate;
    }
    details.push({ name, level, value: v });
  }

  addBuff("VIP", selections.vip_level);
  for (const n in selections.research) addBuff(n, selections.research[n]);
  for (const n in selections.guild) addBuff(n, selections.guild[n]);
  for (const n in selections.season1) addBuff(n, selections.season1[n]);
  if (selections.position) addBuff(selections.position, "LV1");
  if (selections.administrator === "장인") addBuff("관리자", "장인");
  if (selections.payment?.["영구혜택"]) addBuff("영구혜택", "LV1");
  if (selections.payment?.["월간혜택"]) addBuff("월간혜택", "LV1");
  if (selections.lv6_occupation?.temple_build) addBuff("LV6 성전 건설 성지 보유", "LV1");
  if (selections.lv6_occupation?.coal_mine) addBuff("석탄 광산 6LV 보유", "LV1");
  if (selections.lv6_occupation?.role) addBuff(selections.lv6_occupation.role, "LV1");
  for (const n in (selections.resource_buffs || {})) addBuff(n, selections.resource_buffs[n]);

  return { buildSpeedSum, fixedSecondsSum, resourceRateSum, details };
}

function applyTimeBuff(baseSeconds, buildSpeedSum, fixedSecondsSum) {
  const sped = Math.floor(baseSeconds / (1 + buildSpeedSum));
  return Math.max(0, sped - fixedSecondsSum);
}
function applyResourceBuff(baseCost, resourceRateSum) {
  const mult = Math.max(0, 1 + resourceRateSum);
  const out = {};
  for (const k in baseCost) out[k] = Math.max(0, Math.floor(baseCost[k] * mult));
  return out;
}

function calcTotalResourcesWithBoxes(campLevel, ownedResources, ownedBoxes) {
  const boxTable = DB.resource_boxes[String(campLevel)] || {};
  const totals = {};
  for (const rk of RESOURCE_KEYS) {
    let cur = parseInt(ownedResources[rk] || 0);
    let added = 0;
    for (const tier of BOX_TIERS) {
      const unit = parseInt(boxTable[tier]?.[rk] || 0);
      const cnt = parseInt(ownedBoxes[rk]?.[tier] || 0);
      added += unit * cnt;
    }
    totals[rk] = cur + added;
  }
  return totals;
}

// 자원상자 최적화: 3-tier 브루트포스
function optimizeResourceBoxes(campLevel, shortages, ownedBoxes) {
  const boxTable = DB.resource_boxes[String(campLevel)];
  const out = {};
  if (!boxTable) {
    for (const k of RESOURCE_KEYS) out[k] = { possible: false };
    return out;
  }

  for (const rk of RESOURCE_KEYS) {
    const shortage = Math.max(0, parseInt(shortages[rk] || 0));
    if (shortage <= 0) {
      out[rk] = { possible: true, open_counts: { SR: 0, SSR: 0, UR: 0 }, overage: 0 };
      continue;
    }
    // tiers desc by value
    let tiers = BOX_TIERS.map((tier) => ({
      tier,
      value: parseInt(boxTable[tier]?.[rk] || 0),
      count: parseInt(ownedBoxes[rk]?.[tier] || 0),
    }));
    if (tiers.every((t) => t.value <= 0 || t.count <= 0)) {
      out[rk] = { possible: false, open_counts: { SR: 0, SSR: 0, UR: 0 }, overage: 0 };
      continue;
    }
    tiers.sort((a, b) => b.value - a.value);
    const [t1, t2, t3] = tiers;

    let best = null;
    const max1 = t1.value === 0 ? t1.count : Math.min(t1.count, Math.max(0, Math.ceil(shortage / t1.value) + 2));
    for (let n1 = 0; n1 <= max1; n1++) {
      const total1 = n1 * t1.value;
      const rem1 = Math.max(0, shortage - total1);
      const max2 = t2.value === 0 ? t2.count : Math.min(t2.count, Math.max(0, Math.ceil(rem1 / t2.value) + 2));
      for (let n2 = 0; n2 <= max2; n2++) {
        const total2 = total1 + n2 * t2.value;
        const rem2 = Math.max(0, shortage - total2);
        let n3 = 0;
        if (rem2 > 0) {
          if (t3.value <= 0) continue;
          n3 = Math.ceil(rem2 / t3.value);
          if (n3 > t3.count) continue;
        }
        const total = total2 + n3 * t3.value;
        if (total < shortage) continue;
        const overage = total - shortage;
        const sum = n1 + n2 + n3;
        if (!best || overage < best.overage || (overage === best.overage && sum < best.sum)) {
          best = { overage, sum, counts: { [t1.tier]: n1, [t2.tier]: n2, [t3.tier]: n3 } };
        }
      }
    }
    if (best) {
      const open = { SR: 0, SSR: 0, UR: 0 };
      for (const tier in best.counts) open[tier] = best.counts[tier];
      out[rk] = { possible: true, open_counts: open, overage: best.overage };
    } else {
      out[rk] = { possible: false, open_counts: { SR: 0, SSR: 0, UR: 0 }, overage: 0 };
    }
  }
  return out;
}

// 가속권 최적화 — bounded DP
function boundedDP(counts, valuesMin, targetMin, allowOver) {
  const keys = Object.keys(valuesMin);
  const total = keys.reduce((s, k) => s + (valuesMin[k] || 0) * (counts[k] || 0), 0);
  if (total <= 0) return { coverage: -1, used: {} };
  const maxValue = Math.max(...keys.map((k) => valuesMin[k] || 0));
  const upper = allowOver ? Math.min(total, targetMin + maxValue) : total;

  const INF = 1e9;
  const dp = new Float64Array(upper + 1).fill(INF);
  dp[0] = 0;
  const prev = new Array(upper + 1).fill(null);

  for (const name of keys) {
    const value = valuesMin[name];
    let q = counts[name] || 0;
    if (q <= 0 || value <= 0) continue;
    let power = 1;
    const chunks = [];
    while (q > 0) {
      const take = Math.min(power, q);
      chunks.push(take);
      q -= take;
      power *= 2;
    }
    for (const chunk of chunks) {
      const cv = value * chunk;
      for (let t = upper; t >= cv; t--) {
        if (dp[t - cv] + chunk < dp[t]) {
          dp[t] = dp[t - cv] + chunk;
          prev[t] = { prevTotal: t - cv, name, chunk };
        }
      }
    }
  }

  let candidate = -1;
  if (allowOver) {
    for (let t = targetMin; t <= upper; t++) {
      if (dp[t] < INF) { candidate = t; break; }
    }
  } else {
    for (let t = Math.min(targetMin, upper); t >= 0; t--) {
      if (dp[t] < INF) { candidate = t; break; }
    }
  }
  if (candidate < 0) return { coverage: -1, used: {} };

  const used = {};
  for (const k of keys) used[k] = 0;
  let cur = candidate;
  while (cur > 0 && prev[cur]) {
    const p = prev[cur];
    used[p.name] += p.chunk;
    cur = p.prevTotal;
  }
  return { coverage: candidate, used };
}

function optimizeSpeedups(neededSeconds, ownedSpeedups, dispatchSeconds) {
  neededSeconds = Math.max(0, parseInt(neededSeconds || 0));
  const requiredMin = neededSeconds > 0 ? Math.ceil(neededSeconds / 60) : 0;

  const speedGroups = getSpeedupGroupMap();
  const buildValues = {};
  for (const k in speedGroups.build_speedups) buildValues[k] = Math.floor(speedGroups.build_speedups[k] / 60);
  const generalValues = {};
  for (const k in speedGroups.general_speedups) generalValues[k] = Math.floor(speedGroups.general_speedups[k] / 60);

  const dispatchMin = dispatchSeconds > 0 ? Math.ceil(dispatchSeconds / 60) : 0;
  if (dispatchMin > 0) generalValues["__dispatch__"] = dispatchMin;

  const buildCounts = {}; for (const k in buildValues) buildCounts[k] = parseInt(ownedSpeedups.build_speedups?.[k] || 0);
  const generalCounts = {}; for (const k in speedGroups.general_speedups) generalCounts[k] = parseInt(ownedSpeedups.general_speedups?.[k] || 0);
  if (dispatchMin > 0) generalCounts["__dispatch__"] = 1;

  const totalBuild = Object.keys(buildValues).reduce((s, k) => s + buildValues[k] * buildCounts[k], 0);
  const totalGeneral = Object.keys(generalValues).reduce((s, k) => s + generalValues[k] * generalCounts[k], 0);

  if (requiredMin <= 0) {
    return { possible: true, requiredSec: 0, usedBuild: {}, usedGeneral: {}, remainSec: 0 };
  }

  if (totalBuild >= requiredMin) {
    const r = boundedDP(buildCounts, buildValues, requiredMin, true);
    return {
      possible: true,
      requiredSec: requiredMin * 60,
      usedBuild: r.used,
      usedGeneral: {},
      remainSec: 0,
    };
  }

  const r1 = boundedDP(buildCounts, buildValues, requiredMin, false);
  const coveredBuild = r1.coverage < 0 ? 0 : r1.coverage;
  const remaining = Math.max(0, requiredMin - coveredBuild);

  if (totalGeneral < remaining) {
    return {
      possible: false,
      requiredSec: requiredMin * 60,
      usedBuild: r1.used,
      usedGeneral: { ...generalCounts },
      remainSec: Math.max(0, remaining - totalGeneral) * 60,
    };
  }

  const r2 = boundedDP(generalCounts, generalValues, remaining, true);
  return {
    possible: true,
    requiredSec: requiredMin * 60,
    usedBuild: r1.used,
    usedGeneral: r2.used,
    remainSec: 0,
  };
}

function getSpeedupGroupMap() {
  const out = {};
  for (const g of SPEEDUP_GROUPS) {
    const raw = DB.speedups?.[g.key];
    if (raw) {
      const map = {};
      for (const k in raw) map[k] = parseInt(raw[k].seconds || 0);
      out[g.key] = map;
    } else {
      out[g.key] = { ...DEFAULT_SPEEDUPS };
    }
  }
  return out;
}

// ===== UI 빌더 =====
function makeLevelOptions(values, includeNone, defaultValue) {
  const opts = includeNone ? ["미적용", ...values] : values;
  return opts.map((v) => `<option value="${v}" ${v === defaultValue ? "selected" : ""}>${v}</option>`).join("");
}

function makeSelect(id, values, includeNone, defaultValue) {
  const sel = $(id);
  sel.innerHTML = makeLevelOptions(values, includeNone, defaultValue);
}

function buildLevelsTab() {
  // 건물 레벨
  const wrap = $("building-levels");
  wrap.innerHTML = "";
  for (const b of BUILDING_ORDER) {
    const max = Math.max(...Object.keys(DB.buildings[b] || {}).map((x) => parseInt(x)));
    const min = Math.min(...Object.keys(DB.buildings[b] || {}).map((x) => parseInt(x))) - 1;
    const range = [];
    for (let v = min; v <= max; v++) range.push(v);
    const sel = el("select", { id: `lv-${SETTINGS_LEVEL_KEYS[b]}` });
    sel.innerHTML = range.map((v) => `<option value="${v}" ${v === min ? "selected" : ""}>${v}</option>`).join("");
    const row = el("div", { class: "form-row" }, el("label", {}, LEVEL_LABELS[b]), sel);
    wrap.appendChild(row);
  }

  // 목표 캠프
  const campMax = Math.max(...Object.keys(DB.buildings["캠프"]).map((x) => parseInt(x)));
  const campMin = Math.min(...Object.keys(DB.buildings["캠프"]).map((x) => parseInt(x)));
  const tc = $("target-camp");
  tc.innerHTML = "";
  for (let v = campMin; v <= campMax; v++) {
    tc.innerHTML += `<option value="${v}" ${v === campMax ? "selected" : ""}>${v}</option>`;
  }

  // VIP
  makeSelect("b-vip", Object.keys(BUFF_MAP["VIP"].values), false, "LV1");

  // 연구
  buildBuffGroup("b-research", ["고효율 건축 I", "고효율 건축 II", "고효율 건축 III", "고효율 건축 IV"]);
  // 길드
  buildBuffGroup("b-guild", ["초기기술", "소생기술"]);
  // 시즌1
  buildBuffGroup("b-season1", ["건설자의 열정", "건설 지원"]);
  // 자원
  buildBuffGroup("b-resource", ["정교한 공예", "비용 절감"]);

  // 직위
  makeSelect("b-position", POSITION_NAMES, true, "미적용");
  // 참모 / 지휘관
  makeSelect("b-temple-role", TEMPLE_ROLE_NAMES, true, "미적용");
}

function buildBuffGroup(containerId, names) {
  const wrap = $(containerId);
  wrap.innerHTML = "";
  for (const name of names) {
    const buff = BUFF_MAP[name];
    if (!buff) continue;
    const sel = el("select", { id: `b-${nameToId(name)}` });
    sel.innerHTML = makeLevelOptions(Object.keys(buff.values), true, "미적용");
    wrap.appendChild(el("div", { class: "form-row" }, el("label", {}, name), sel));
  }
}

function nameToId(name) {
  return "buff-" + Array.from(name).map((c) => c.charCodeAt(0).toString(16)).join("");
}

function buildInventoryTab() {
  // 보유 자원
  const ores = $("owned-resources");
  ores.innerHTML = "";
  for (const rk of RESOURCE_KEYS) {
    ores.appendChild(el("div", { class: "form-row" },
      el("label", {}, RESOURCE_LABELS[rk]),
      el("input", { type: "number", id: `res-${rk}`, min: "0", value: "0", inputmode: "numeric" }),
    ));
  }

  // 자원 상자 — 4열 grid (라벨 + SR + SSR + UR)
  const boxes = $("owned-boxes");
  boxes.innerHTML = "";
  // 헤더
  const hdr = el("div", { class: "inv-box-grid" },
    el("div", {}),
    ...BOX_TIERS.map((t) => el("div", { class: "h" }, t))
  );
  boxes.appendChild(hdr);
  for (const rk of RESOURCE_KEYS) {
    const row = el("div", { class: "inv-box-grid" }, el("div", { class: "rk-label" }, RESOURCE_LABELS[rk]));
    for (const tier of BOX_TIERS) {
      row.appendChild(el("input", { type: "number", id: `box-${rk}-${tier}`, min: "0", value: "0", inputmode: "numeric" }));
    }
    boxes.appendChild(row);
  }

  // 가속권 — 컴팩트한 spd-grid 레이아웃
  const sg = getSpeedupGroupMap();
  // 표시 순서: 8h → 3h → 1h → 5m → 1m (큰 단위부터)
  const SPD_ORDER = ["8h", "3h", "1h", "5m", "1m"];
  for (const grp of SPEEDUP_GROUPS) {
    const containerId = grp.key.replace(/_speedups$/, "-speedups");
    const cont = $(containerId);
    if (!cont) continue;
    cont.innerHTML = "";
    const keys = Object.keys(sg[grp.key]);
    const sortedKeys = SPD_ORDER.filter((k) => keys.includes(k)).concat(keys.filter((k) => !SPD_ORDER.includes(k)));
    for (const k of sortedKeys) {
      const item = el("div", { class: "spd-item" },
        el("span", { class: "spd-label" }, k),
        el("input", { type: "number", id: `spd-${grp.key}-${k}`, min: "0", value: "0", inputmode: "numeric" }),
      );
      cont.appendChild(item);
    }
  }
}

function buildPalmonTab() {
  // 캠프 콤보
  const camp = $("palmon-camp");
  camp.innerHTML = "";
  const levels = Object.keys(DB.resource_boxes || {}).map((x) => parseInt(x)).sort((a, b) => a - b);
  for (const v of levels) {
    camp.innerHTML += `<option value="${v}" ${v === 20 ? "selected" : ""}>LV${v}</option>`;
  }

  // 상자 입력 — palmon-box-grid (라벨 + SR/SSR/UR)
  const wrap = $("palmon-boxes");
  wrap.innerHTML = "";
  const hdr = el("div", { class: "palmon-box-grid" },
    el("div", {}),
    ...BOX_TIERS.map((t) => el("div", { class: "h" }, t))
  );
  wrap.appendChild(hdr);
  for (const rk of PALMON_RESOURCE_ORDER) {
    const row = el("div", { class: "palmon-box-grid" }, el("div", { class: "rk-label" }, PALMON_RESOURCE_LABELS[rk]));
    for (const tier of BOX_TIERS) {
      row.appendChild(el("input", { type: "number", id: `pbox-${rk}-${tier}`, min: "0", value: "0", inputmode: "numeric" }));
    }
    wrap.appendChild(row);
  }
}

// ===== 입력 수집 =====
function getCurrentLevels() {
  const out = {};
  for (const b of BUILDING_ORDER) out[b] = parseInt($(`lv-${SETTINGS_LEVEL_KEYS[b]}`).value);
  return out;
}
function getTimeBuffsSelection() {
  const get = (id) => $(id).value;
  return {
    vip_level: get("b-vip"),
    research: Object.fromEntries(["고효율 건축 I", "고효율 건축 II", "고효율 건축 III", "고효율 건축 IV"].map((n) => [n, get(`b-${nameToId(n)}`)])),
    guild: Object.fromEntries(["초기기술", "소생기술"].map((n) => [n, get(`b-${nameToId(n)}`)])),
    season1: Object.fromEntries(["건설자의 열정", "건설 지원"].map((n) => [n, get(`b-${nameToId(n)}`)])),
    position: get("b-position") === "미적용" ? null : get("b-position"),
    administrator: $("b-administrator").checked ? "장인" : null,
    payment: {
      "영구혜택": $("b-pay-perm").checked,
      "월간혜택": $("b-pay-month").checked,
    },
    lv6_occupation: {
      temple_build: $("b-temple").checked,
      coal_mine: $("b-coal").checked,
      role: get("b-temple-role") === "미적용" ? null : get("b-temple-role"),
    },
    task_dispatch_free_acceleration: {
      hours: parseInt($("b-dispatch-h").value || 0),
      minutes: parseInt($("b-dispatch-m").value || 0),
      seconds: parseInt($("b-dispatch-s").value || 0),
    },
  };
}
function getResourceBuffsSelection() {
  return Object.fromEntries(["정교한 공예", "비용 절감"].map((n) => [n, $(`b-${nameToId(n)}`).value]));
}
function getOwnedResources() {
  return Object.fromEntries(RESOURCE_KEYS.map((k) => [k, parseInt($(`res-${k}`).value || 0)]));
}
function getOwnedBoxes() {
  const out = {};
  for (const rk of RESOURCE_KEYS) {
    out[rk] = {};
    for (const t of BOX_TIERS) out[rk][t] = parseInt($(`box-${rk}-${t}`).value || 0);
  }
  return out;
}
function getOwnedSpeedups() {
  const sg = getSpeedupGroupMap();
  const out = {};
  for (const grp of SPEEDUP_GROUPS) {
    out[grp.key] = {};
    for (const k of Object.keys(sg[grp.key])) {
      out[grp.key][k] = parseInt($(`spd-${grp.key}-${k}`)?.value || 0);
    }
  }
  return out;
}

// ===== 계산 결과 =====
function calculate() {
  try {
    const currentLevels = getCurrentLevels();
    const targetCamp = parseInt($("target-camp").value);

    // 검증
    for (const b of ["분대", "연구대", "병원", "아미고 기지"]) {
      if (currentLevels[b] > currentLevels["캠프"]) {
        throw new Error(`${LEVEL_LABELS[b]} 레벨은 현재 캠프 레벨보다 높을 수 없습니다.`);
      }
    }
    if (targetCamp < currentLevels["캠프"]) {
      throw new Error("목표 캠프 레벨은 현재 캠프 레벨 이상이어야 합니다.");
    }

    const timeSel = getTimeBuffsSelection();
    const resSel = getResourceBuffsSelection();
    const merged = { ...timeSel, resource_buffs: resSel };
    const { buildSpeedSum, fixedSecondsSum, resourceRateSum } = collectBuffs(merged);
    const dispatchSeconds =
      timeSel.task_dispatch_free_acceleration.hours * 3600 +
      timeSel.task_dispatch_free_acceleration.minutes * 60 +
      timeSel.task_dispatch_free_acceleration.seconds;

    const steps = planUpgrades(currentLevels, targetCamp, DB.buildings);

    const totalBase = { gold: 0, wood: 0, steel: 0 };
    const totalFinal = { gold: 0, wood: 0, steel: 0 };
    let totalBaseSec = 0;
    let totalFinalSec = 0;
    for (const step of steps) {
      const buffedCost = applyResourceBuff(step.baseCost, resourceRateSum);
      const buffedTime = applyTimeBuff(step.baseSeconds, buildSpeedSum, fixedSecondsSum);
      for (const k of RESOURCE_KEYS) {
        totalBase[k] += step.baseCost[k] || 0;
        totalFinal[k] += buffedCost[k] || 0;
      }
      totalBaseSec += step.baseSeconds;
      totalFinalSec += buffedTime;
    }

    const ownedResources = getOwnedResources();
    const ownedBoxes = getOwnedBoxes();
    const totalOwnedWithBoxes = calcTotalResourcesWithBoxes(currentLevels["캠프"], ownedResources, ownedBoxes);
    const shortages = {};
    for (const k of RESOURCE_KEYS) shortages[k] = Math.max(0, totalFinal[k] - (totalOwnedWithBoxes[k] || 0));

    const boxRecOnly = {};
    for (const k of RESOURCE_KEYS) boxRecOnly[k] = Math.max(0, totalFinal[k] - (ownedResources[k] || 0));
    const boxResult = optimizeResourceBoxes(currentLevels["캠프"], boxRecOnly, ownedBoxes);
    for (const k of RESOURCE_KEYS) {
      if (totalFinal[k] > (totalOwnedWithBoxes[k] || 0)) {
        boxResult[k] = { possible: false, open_counts: { SR: 0, SSR: 0, UR: 0 }, overage: 0 };
      }
    }

    const ownedSpeedups = getOwnedSpeedups();
    const sp = optimizeSpeedups(totalFinalSec, ownedSpeedups, dispatchSeconds);
    const speedGroups = getSpeedupGroupMap();
    const usedBuildSec = Object.keys(sp.usedBuild || {}).reduce((s, k) => s + (speedGroups.build_speedups[k] || 0) * (sp.usedBuild[k] || 0), 0);
    const usedGeneralSec = Object.keys(sp.usedGeneral || {}).reduce((s, k) => s + (k === "__dispatch__" ? 0 : (speedGroups.general_speedups[k] || 0) * (sp.usedGeneral[k] || 0)), 0);
    const totalBuildSec = Object.keys(speedGroups.build_speedups).reduce((s, k) => s + (speedGroups.build_speedups[k] || 0) * (ownedSpeedups.build_speedups?.[k] || 0), 0);
    const totalGeneralSec = Object.keys(speedGroups.general_speedups).reduce((s, k) => s + (speedGroups.general_speedups[k] || 0) * (ownedSpeedups.general_speedups?.[k] || 0), 0);
    const remainBuild = Math.max(0, totalBuildSec - usedBuildSec);
    const remainGeneral = Math.max(0, totalGeneralSec - usedGeneralSec);

    renderResult({
      currentCamp: currentLevels["캠프"],
      targetCamp,
      totalBaseSec,
      totalFinalSec,
      totalFinal,
      totalOwnedWithBoxes,
      shortages,
      boxResult,
      requiredSec: sp.requiredSec,
      remainSec: sp.remainSec,
      possible: sp.possible,
      usedBuildSec, usedGeneralSec, remainBuild, remainGeneral,
      buildSpeedSum, fixedSecondsSum, dispatchSeconds, resourceRateSum,
    });
    activateTab("t-result");
  } catch (e) {
    console.error(e);
    alert(e.message || String(e));
  }
}

function renderResult(r) {
  const fmtN = (n) => fmt(n);
  const saved = Math.max(0, r.totalBaseSec - r.totalFinalSec);
  const savedPct = r.totalBaseSec ? (saved / r.totalBaseSec * 100).toFixed(1) : 0;

  // 1. 목표 정보
  const cardTarget = `
    <div class="result-card strong" style="border-color:var(--amber);">
      <div class="card-title txt-amber">◆ 목표 정보</div>
      <div style="margin-top:8px;">
        <span class="txt-dim">현재 캠프</span>
        <span style="font-size:22px;font-weight:700;margin:0 10px;">LV${r.currentCamp}</span>
        <span class="txt-amber" style="font-size:20px;margin:0 6px;">→</span>
        <span class="txt-dim">목표 캠프</span>
        <span class="txt-amber" style="font-size:22px;font-weight:700;margin-left:10px;">LV${r.targetCamp}</span>
      </div>
    </div>`;

  // 2. 시간
  let timeRows = `
    <tr><td class="label">기본 시간</td><td class="value">${secondsToText(r.totalBaseSec)}</td></tr>
    <tr><td class="label">버프 적용 후</td><td class="value green" style="font-size:16px;">${secondsToText(r.totalFinalSec)}</td></tr>`;
  if (saved > 0) {
    timeRows += `<tr><td class="label">절감 시간</td><td class="value amber">−${secondsToText(saved)} (${savedPct}%)</td></tr>`;
  }
  const cardTime = `
    <div class="result-card" style="border-color:var(--green);">
      <div class="card-title txt-green">◆ 총 필요 시간</div>
      <div class="tbl-wrap"><table class="tbl">${timeRows}</table>
    </div>`;

  // 3. 자원
  let resRows = `
    <tr>
      <th></th><th>필요</th><th>보유</th><th>부족</th>
    </tr>`;
  for (const k of RESOURCE_KEYS) {
    const short = r.shortages[k];
    const cls = short > 0 ? "red" : "green";
    resRows += `<tr>
      <td class="label">${RESOURCE_LABELS[k]}</td>
      <td class="value amber">${fmtN(r.totalFinal[k])}</td>
      <td class="value">${fmtN(r.totalOwnedWithBoxes[k] || 0)}</td>
      <td class="value ${cls}">${fmtN(short)}</td>
    </tr>`;
  }
  const cardRes = `
    <div class="result-card" style="border-color:var(--amber);">
      <div class="card-title txt-amber">◆ 총 필요 자원</div>
      <div class="tbl-wrap"><table class="tbl">${resRows}</table>
    </div>`;

  // 4. 자원상자
  let boxRows = `<tr><th></th><th>SR</th><th>SSR</th><th>UR</th><th>초과</th></tr>`;
  for (const k of RESOURCE_KEYS) {
    const info = r.boxResult[k];
    if (info.possible) {
      boxRows += `<tr>
        <td class="label">${RESOURCE_LABELS[k]}</td>
        <td class="value">${fmtN(info.open_counts.SR)}</td>
        <td class="value">${fmtN(info.open_counts.SSR)}</td>
        <td class="value">${fmtN(info.open_counts.UR)}</td>
        <td class="value amber">${fmtN(info.overage)}</td>
      </tr>`;
    } else {
      boxRows += `<tr>
        <td class="label">${RESOURCE_LABELS[k]}</td>
        <td colspan="4" class="value red">해결 불가</td>
      </tr>`;
    }
  }
  const cardBox = `
    <div class="result-card" style="border-color:var(--blue);">
      <div class="card-title txt-blue">◆ 자원상자 추천</div>
      <div class="tbl-wrap"><table class="tbl">${boxRows}</table>
    </div>`;

  // 5. 가속권
  const possibleBadge = r.possible
    ? `<span class="badge green">OK</span>`
    : `<span class="badge red">부족</span>`;
  const spdColor = r.remainSec > 0 ? "var(--red)" : "var(--green)";
  const cardSpd = `
    <div class="result-card" style="border-color:${spdColor};">
      <div class="card-title" style="color:${spdColor};">◆ 가속권 사용 결과</div>
      <div class="tbl-wrap"><table class="tbl">
        <tr><td class="label">필요한 총 가속</td><td class="value amber">${secondsToText(r.requiredSec)}</td></tr>
        <tr><td class="label">가속 가능 여부</td><td class="value">${possibleBadge}</td></tr>
        <tr><td class="label">사용한 건설 가속</td><td class="value">${secondsToText(r.usedBuildSec)}</td></tr>
        <tr><td class="label">남는 건설 가속</td><td class="value green">${secondsToText(r.remainBuild)}</td></tr>
        <tr><td class="label">사용한 일반 가속</td><td class="value">${secondsToText(r.usedGeneralSec)}</td></tr>
        <tr><td class="label">남는 일반 가속</td><td class="value green">${secondsToText(r.remainGeneral)}</td></tr>
        <tr><td class="label">추가로 필요한 가속</td><td class="value ${r.remainSec > 0 ? "red" : "green"}">${secondsToText(r.remainSec)}</td></tr>
      </table></div>
    </div>`;

  // 6. 버프 요약
  const cardBuff = `
    <div class="result-card" style="border-color:var(--purple);">
      <div class="card-title txt-purple">◆ 적용 버프 요약</div>
      <div class="tbl-wrap"><table class="tbl">
        <tr><td class="label">건설속도 합계</td><td class="value green" style="font-size:16px;">${(r.buildSpeedSum*100).toFixed(2)}%</td></tr>
        <tr><td class="label">고정 시간 차감 합계</td><td class="value">${secondsToText(r.fixedSecondsSum + r.dispatchSeconds)}</td></tr>
        <tr><td class="label">자원 감소 합계</td><td class="value txt-purple" style="font-size:16px;">${(Math.abs(r.resourceRateSum)*100).toFixed(2)}%</td></tr>
      </table></div>
    </div>`;

  $("result-output").innerHTML = cardTarget + cardTime + cardRes + cardBox + cardSpd + cardBuff;
}

// ===== 걸작 구슬 =====
function updateBead() {
  const total = parseInt($("bead-total").value || 0);
  const possible = Math.floor(total / BEAD_PER_WEAPON);
  const remain = total - possible * BEAD_PER_WEAPON;
  const color = possible > 0 ? "var(--green)" : "var(--red)";
  $("bead-result").innerHTML = `
    <div class="result-card strong" style="border-color:${color};text-align:center;">
      <div class="card-title" style="color:${color};">◆ 완성 가능 무기</div>
      <div class="big-number" style="color:${color};">${fmt(possible)}<span class="unit">개</span></div>
    </div>
    <div class="result-card">
      <div class="tbl-wrap"><table class="tbl">
        <tr><td class="label">보유 구슬</td><td class="value">${fmt(total)}</td></tr>
        <tr><td class="label">무기 1개당 필요</td><td class="value">${fmt(BEAD_PER_WEAPON)}</td></tr>
        <tr><td class="label">완성 후 남은 양</td><td class="value amber">${fmt(remain)}</td></tr>
      </table></div>
    </div>`;
}

// ===== 팰몬 진화 =====
function updateEssence() {
  const promoOwned = parseInt($("promo-total").value || 0);
  const promoPeople = Math.floor(promoOwned / PROMO_PER_PALMON);
  const promoRemain = promoOwned - promoPeople * PROMO_PER_PALMON;

  const evoOwned = parseInt($("evo-total").value || 0);

  // 4단계별 초기화 수량 입력 → 합산
  const resetCounts = {
    "1진화": parseInt($("evo-reset-1").value || 0),
    "2진화": parseInt($("evo-reset-2").value || 0),
    "3진화": parseInt($("evo-reset-3").value || 0),
    "4진화": parseInt($("evo-reset-4").value || 0),
  };
  let evoReset = 0;
  for (const stage in resetCounts) evoReset += resetCounts[stage] * EVO_VALUES[stage];
  const evoTotal = evoOwned + evoReset;
  const evoPeople = Math.floor(evoTotal / EVO_PER_PALMON);
  const evoRemain = evoTotal - evoPeople * EVO_PER_PALMON;

  const fullSet = Math.min(promoPeople, evoPeople);

  function bigCard(headline, count, color, rows) {
    return `
      <div class="result-card strong" style="border-color:${color};">
        <div class="card-title" style="color:${color};text-align:center;">◆ ${headline}</div>
        <div class="big-number" style="color:${color};">${fmt(count)}<span class="unit">명</span></div>
        <div class="tbl-wrap"><table class="tbl">${rows}</table></div>
      </div>`;
  }

  const promoColor = promoPeople > 0 ? "var(--green)" : "var(--red)";
  const promoRows = `
    <tr><td class="label">보유</td><td class="value">${fmt(promoOwned)}</td></tr>
    <tr><td class="label">1명 승급 필요</td><td class="value">${fmt(PROMO_PER_PALMON)}</td></tr>
    <tr><td class="label">완성 후 남은 양</td><td class="value amber">${fmt(promoRemain)}</td></tr>`;
  const promoCard = bigCard("승급 완성 가능 인원", promoPeople, promoColor, promoRows);

  // 4단계 초기화 행 추가
  let resetRows = "";
  for (const stage of ["1진화", "2진화", "3진화", "4진화"]) {
    const cnt = resetCounts[stage];
    if (cnt > 0) {
      const sub = cnt * EVO_VALUES[stage];
      resetRows += `<tr><td class="label txt-purple">초기화 ${stage}</td><td class="value txt-purple">${fmt(cnt)} × ${EVO_VALUES[stage]} = +${fmt(sub)}</td></tr>`;
    }
  }
  if (evoReset > 0) {
    resetRows += `<tr><td class="label txt-purple">초기화 환급 합계</td><td class="value txt-purple"><b>+${fmt(evoReset)}</b></td></tr>`;
  }

  const evoColor = evoPeople > 0 ? "var(--green)" : "var(--red)";
  const evoRows = `
    <tr><td class="label">보유</td><td class="value">${fmt(evoOwned)}</td></tr>
    ${resetRows}
    <tr><td class="label">합계</td><td class="value amber"><b>${fmt(evoTotal)}</b></td></tr>
    <tr><td class="label">1명 진화 필요</td><td class="value">${fmt(EVO_PER_PALMON)}</td></tr>
    <tr><td class="label">완성 후 남은 양</td><td class="value amber">${fmt(evoRemain)}</td></tr>`;
  const evoCard = bigCard("진화 완성 가능 인원", evoPeople, evoColor, evoRows);

  const fullColor = fullSet > 0 ? "var(--green)" : "var(--red)";
  const fullCard = `
    <div class="result-card" style="text-align:center;">
      <div class="card-title" style="color:${fullColor};">◆ 풀세팅 완성 인원 (승급 ∩ 진화)</div>
      <div style="margin-top:6px;">풀세팅 완성: <b style="color:${fullColor};font-size:24px;margin-left:6px;">${fmt(fullSet)}명</b></div>
    </div>`;

  $("essence-result").innerHTML = promoCard + evoCard + fullCard;
}

// ===== 팰몬 XP / 자원 합산 =====
function updatePalmon() {
  const baseLevel = parseInt($("palmon-camp").value);
  const maxLevel = Math.max(...Object.keys(DB.resource_boxes).map((x) => parseInt(x)));
  const cmpLevel = Math.min(30, maxLevel);

  function totalsAt(level) {
    const tbl = DB.resource_boxes[String(level)] || {};
    const out = {};
    for (const rk of PALMON_RESOURCE_ORDER) {
      let sum = 0;
      for (const tier of BOX_TIERS) {
        const unit = parseInt(tbl[tier]?.[rk] || 0);
        const cnt = parseInt($(`pbox-${rk}-${tier}`)?.value || 0);
        sum += unit * cnt;
      }
      out[rk] = sum;
    }
    return out;
  }
  const baseTotals = totalsAt(baseLevel);
  const cmpTotals = totalsAt(cmpLevel);

  // 카드 1: 합산
  let baseRows = "";
  for (const rk of PALMON_RESOURCE_ORDER) {
    baseRows += `<tr><td class="label">${PALMON_RESOURCE_LABELS[rk]}</td><td class="value amber">${fmt(baseTotals[rk])}</td></tr>`;
  }
  const cardBase = `
    <div class="result-card strong" style="border-color:var(--amber);">
      <div class="card-title txt-amber">◆ 캠프 LV${baseLevel} 기준 합산</div>
      <div class="tbl-wrap"><table class="tbl">${baseRows}</table>
    </div>`;

  // 카드 2: 비교 (필요 시)
  let cardCmp = "";
  if (cmpLevel !== baseLevel) {
    let cmpRows = `<tr><th></th><th>합산</th><th>증가량</th><th>%</th></tr>`;
    for (const rk of PALMON_RESOURCE_ORDER) {
      const base = baseTotals[rk];
      const cmp = cmpTotals[rk];
      const diff = cmp - base;
      const pct = base > 0 ? (diff / base * 100) : 0;
      const cls = diff > 0 ? "green" : diff < 0 ? "red" : "label";
      const sign = diff >= 0 ? "+" : "−";
      cmpRows += `<tr>
        <td class="label">${PALMON_RESOURCE_LABELS[rk]}</td>
        <td class="value">${fmt(cmp)}</td>
        <td class="value ${cls}">${sign}${fmt(Math.abs(diff))}</td>
        <td class="value ${cls}">${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%</td>
      </tr>`;
    }
    cardCmp = `
      <div class="result-card" style="border-color:var(--blue);">
        <div class="card-title txt-blue">◆ 캠프 LV${cmpLevel} 기준 (LV${baseLevel} 대비 증가)</div>
        <div class="tbl-wrap"><table class="tbl">${cmpRows}</table>
      </div>`;
  }

  // 카드 3: 단위값
  const tbl = DB.resource_boxes[String(baseLevel)] || {};
  let unitRows = `<tr><th></th>`;
  for (const t of BOX_TIERS) unitRows += `<th>${t}</th>`;
  unitRows += `</tr>`;
  for (const rk of PALMON_RESOURCE_ORDER) {
    let r = `<td class="label">${PALMON_RESOURCE_LABELS[rk]}</td>`;
    for (const t of BOX_TIERS) {
      const unit = parseInt(tbl[t]?.[rk] || 0);
      r += `<td class="value">${fmt(unit)}</td>`;
    }
    unitRows += `<tr>${r}</tr>`;
  }
  const cardUnit = `
    <div class="result-card">
      <div class="card-title txt-dim">● 단위값 (상자 1개당, LV${baseLevel})</div>
      <div class="tbl-wrap"><table class="tbl">${unitRows}</table>
    </div>`;

  $("palmon-result").innerHTML = cardBase + cardCmp + cardUnit;
}

// ===== 보유 자원/상자/가속권 — 요약 =====
function updateInventorySummary() {
  const camp = parseInt($("lv-camp")?.value || 20);
  const ownedRes = getOwnedResources();
  const ownedBoxes = getOwnedBoxes();
  const ownedSpd = getOwnedSpeedups();

  const totalsWithBox = calcTotalResourcesWithBoxes(camp, ownedRes, ownedBoxes);
  const sg = getSpeedupGroupMap();

  let rows = "";
  for (const rk of RESOURCE_KEYS) {
    const cur = ownedRes[rk] || 0;
    const after = totalsWithBox[rk] || 0;
    const added = after - cur;
    rows += `<tr>
      <td class="label">${RESOURCE_LABELS[rk]}</td>
      <td class="value">${fmt(cur)}</td>
      <td class="value">+ ${fmt(added)}</td>
      <td class="value amber">= ${fmt(after)}</td>
    </tr>`;
  }
  let resTable = `<div class="tbl-wrap"><table class="tbl">
    <tr><th></th><th>현재</th><th>상자</th><th>총합</th></tr>${rows}</table></div>`;

  let spdRows = "";
  for (const grp of SPEEDUP_GROUPS) {
    let sec = 0;
    for (const k of Object.keys(sg[grp.key])) sec += (ownedSpd[grp.key]?.[k] || 0) * sg[grp.key][k];
    spdRows += `<tr><td class="label">${grp.title}</td><td class="value">${secondsToText(sec)}</td></tr>`;
  }
  let spdTable = `<div class="tbl-wrap"><table class="tbl">${spdRows}</table></div>`;

  $("inventory-summary").innerHTML = `
    <div class="grid-2">
      <div>
        <div class="card-title txt-dim" style="margin-bottom:4px;">상자 전부 개봉 시 자원</div>
        ${resTable}
      </div>
      <div>
        <div class="card-title txt-dim" style="margin-bottom:4px;">가속권 종류별 총합</div>
        ${spdTable}
      </div>
    </div>`;
}

// ===== 탭 전환 =====
function activateTab(tabId) {
  $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tabId));
  $$(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === tabId));
}

// ===== 저장 / 불러오기 (JSON 다운로드 / 업로드) =====
function buildSettingsPayload() {
  return {
    language: "ko",
    current_levels: Object.fromEntries(BUILDING_ORDER.map((b) => [SETTINGS_LEVEL_KEYS[b], parseInt($(`lv-${SETTINGS_LEVEL_KEYS[b]}`).value)])),
    target: { camp: parseInt($("target-camp").value) },
    owned_resources: getOwnedResources(),
    owned_resource_boxes: getOwnedBoxes(),
    owned_speedups: getOwnedSpeedups(),
    time_buffs_selection: getTimeBuffsSelection(),
    resource_buffs_selection: getResourceBuffsSelection(),
    bead_total: parseInt($("bead-total").value || 0),
    essence_promo_total: parseInt($("promo-total").value || 0),
    essence_evo_total: parseInt($("evo-total").value || 0),
    essence_evo_resets: {
      "1진화": parseInt($("evo-reset-1").value || 0),
      "2진화": parseInt($("evo-reset-2").value || 0),
      "3진화": parseInt($("evo-reset-3").value || 0),
      "4진화": parseInt($("evo-reset-4").value || 0),
    },
    palmon_res_camp: parseInt($("palmon-camp").value),
    palmon_res_boxes: Object.fromEntries(PALMON_RESOURCE_ORDER.map((rk) => [rk, Object.fromEntries(BOX_TIERS.map((t) => [t, parseInt($(`pbox-${rk}-${t}`).value || 0)]))])),
  };
}

function applySettingsPayload(p) {
  if (p.current_levels) {
    for (const b of BUILDING_ORDER) {
      const k = SETTINGS_LEVEL_KEYS[b];
      if (p.current_levels[k] != null) $(`lv-${k}`).value = p.current_levels[k];
    }
  }
  if (p.target?.camp != null) $("target-camp").value = p.target.camp;
  for (const k of RESOURCE_KEYS) if (p.owned_resources?.[k] != null) $(`res-${k}`).value = p.owned_resources[k];
  for (const rk of RESOURCE_KEYS) for (const t of BOX_TIERS) {
    const v = p.owned_resource_boxes?.[rk]?.[t];
    if (v != null) $(`box-${rk}-${t}`).value = v;
  }
  for (const grp of SPEEDUP_GROUPS) for (const k in (p.owned_speedups?.[grp.key] || {})) {
    const id = `spd-${grp.key}-${k}`;
    if ($(id)) $(id).value = p.owned_speedups[grp.key][k];
  }
  const ts = p.time_buffs_selection || {};
  if (ts.vip_level) $("b-vip").value = ts.vip_level;
  for (const n in (ts.research || {})) if ($(`b-${nameToId(n)}`)) $(`b-${nameToId(n)}`).value = ts.research[n];
  for (const n in (ts.guild || {})) if ($(`b-${nameToId(n)}`)) $(`b-${nameToId(n)}`).value = ts.guild[n];
  for (const n in (ts.season1 || {})) if ($(`b-${nameToId(n)}`)) $(`b-${nameToId(n)}`).value = ts.season1[n];
  $("b-position").value = ts.position || "미적용";
  $("b-administrator").checked = ts.administrator === "장인";
  $("b-pay-perm").checked = !!ts.payment?.["영구혜택"];
  $("b-pay-month").checked = !!ts.payment?.["월간혜택"];
  $("b-temple").checked = !!ts.lv6_occupation?.temple_build;
  $("b-coal").checked = !!ts.lv6_occupation?.coal_mine;
  $("b-temple-role").value = ts.lv6_occupation?.role || "미적용";
  if (ts.task_dispatch_free_acceleration) {
    $("b-dispatch-h").value = ts.task_dispatch_free_acceleration.hours || 0;
    $("b-dispatch-m").value = ts.task_dispatch_free_acceleration.minutes || 0;
    $("b-dispatch-s").value = ts.task_dispatch_free_acceleration.seconds || 0;
  }
  for (const n in (p.resource_buffs_selection || {})) if ($(`b-${nameToId(n)}`)) $(`b-${nameToId(n)}`).value = p.resource_buffs_selection[n];
  // 새 탭 — 단일 합계 + 이전 포맷 마이그레이션
  let bt = p.bead_total;
  if (bt == null && p.beads) {
    const BV = { "1성":10,"2성":20,"3성":30,"4성":40,"5성":50 };
    bt = 0; for (const s in p.beads) bt += (parseInt(p.beads[s])||0) * (BV[s]||0);
  }
  $("bead-total").value = bt || 0;

  let pt = p.essence_promo_total;
  if (pt == null && p.essence_promo) {
    const PV = { "1성":25,"2성":50,"3성":100,"4성":300,"5성":500 };
    pt = 0; for (const s in p.essence_promo) pt += (parseInt(p.essence_promo[s])||0) * (PV[s]||0);
  }
  $("promo-total").value = pt || 0;

  let et = p.essence_evo_total;
  if (et == null && p.essence_evo) {
    et = 0; for (const s in p.essence_evo) et += (parseInt(p.essence_evo[s])||0) * (EVO_VALUES[s]||0);
  }
  $("evo-total").value = et || 0;

  // 4단계 초기화 수량 복원 (+ 이전 단일-필터 포맷 호환)
  const RESET_IDS = { "1진화": "evo-reset-1", "2진화": "evo-reset-2", "3진화": "evo-reset-3", "4진화": "evo-reset-4" };
  if (p.essence_evo_resets) {
    for (const stage in RESET_IDS) {
      $(RESET_IDS[stage]).value = parseInt(p.essence_evo_resets[stage] || 0);
    }
  } else if (p.essence_evo_reset_filter) {
    // 이전 포맷: 단일 stage + count → 해당 단계에만 값을 채움
    const s = p.essence_evo_reset_filter.stage;
    const c = parseInt(p.essence_evo_reset_filter.count || 0);
    if (s && RESET_IDS[s]) $(RESET_IDS[s]).value = c;
  }
  if (p.palmon_res_camp != null) $("palmon-camp").value = p.palmon_res_camp;
  for (const rk of PALMON_RESOURCE_ORDER) for (const t of BOX_TIERS) {
    const v = p.palmon_res_boxes?.[rk]?.[t];
    if (v != null) $(`pbox-${rk}-${t}`).value = v;
  }

  updateInventorySummary();
  updateBead();
  updateEssence();
  updatePalmon();
}

function saveSettings() {
  // localStorage + download
  const payload = buildSettingsPayload();
  localStorage.setItem("palmon_settings", JSON.stringify(payload));

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `palmon_settings_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("설정 저장됨 (localStorage + 다운로드)");
}

function loadSettings(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const p = JSON.parse(e.target.result);
      applySettingsPayload(p);
      toast("설정 불러옴");
    } catch (err) {
      alert("JSON 파일을 읽지 못했습니다: " + err.message);
    }
  };
  reader.readAsText(file);
}

function autoLoadFromLocalStorage() {
  const raw = localStorage.getItem("palmon_settings");
  if (!raw) return;
  try { applySettingsPayload(JSON.parse(raw)); } catch (_) {}
}

function resetAll() {
  if (!confirm("모든 입력을 초기화할까요?")) return;
  localStorage.removeItem("palmon_settings");
  location.reload();
}

// ===== 라벨 툴팁 + 인라인 hint 적용 =====
function applyTooltips() {
  document.querySelectorAll(".form-row > label").forEach((lbl) => {
    if (lbl.classList.contains("check-row")) return;
    const text = (lbl.textContent || "").trim();
    if (!TOOLTIPS[text]) return;
    // 라벨에 i 버튼 + 인라인 hint 추가 (한 덩어리로 라벨 내부에)
    const tip = TOOLTIPS[text];
    lbl.innerHTML =
      `<span class="label-text">${text}</span>` +
      `<button type="button" class="info" tabindex="0" data-tip="${tip}" aria-label="${text} 정보">i</button>` +
      `<span class="hint-text">${tip}</span>`;
  });
  // 모바일에서 i 버튼 탭으로 툴팁 토글
  document.addEventListener("click", (e) => {
    const target = e.target.closest(".info");
    document.querySelectorAll(".info.active").forEach((el) => {
      if (el !== target) el.classList.remove("active");
    });
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      target.classList.toggle("active");
    }
  });
}

// ===== 초기 적재 =====
async function bootstrap() {
  try {
    const res = await fetch("palmonDB.json");
    if (!res.ok) throw new Error("palmonDB.json 로드 실패 (" + res.status + ")");
    DB = await res.json();
    BUFF_MAP = {};
    for (const buff of DB.buffs) BUFF_MAP[buff.name] = buff;
    // 관리자 보정 (PyQt 버전과 동일)
    if (!BUFF_MAP["관리자"]) {
      const b = { group: "관리자", name: "관리자", effect_kind: "build_speed", values: { "장인": { rate: 0.02 } } };
      DB.buffs.push(b);
      BUFF_MAP[b.name] = b;
    }
    if (BUFF_MAP["LV6 성전 건설 참모"]) BUFF_MAP["LV6 성전 건설 참모"].values = { "LV1": { rate: 0.02 } };
    if (BUFF_MAP["LV6 성전 건설 지휘관"]) BUFF_MAP["LV6 성전 건설 지휘관"].values = { "LV1": { rate: 0.01 } };

    buildLevelsTab();
    buildInventoryTab();
    buildPalmonTab();
    applyTooltips();

    // 이벤트 바인딩
    $$(".tab").forEach((t) => t.addEventListener("click", () => activateTab(t.dataset.tab)));
    $("btn-calc").addEventListener("click", calculate);
    $("btn-save").addEventListener("click", saveSettings);
    $("btn-load").addEventListener("click", () => $("file-load").click());
    $("file-load").addEventListener("change", (e) => { if (e.target.files[0]) loadSettings(e.target.files[0]); });
    $("btn-reset").addEventListener("click", resetAll);

    // 자동 업데이트 (구슬/진화/팰몬자원/요약)
    $("bead-total").addEventListener("input", updateBead);
    ["promo-total","evo-total","evo-reset-1","evo-reset-2","evo-reset-3","evo-reset-4"].forEach((id) => $(id).addEventListener("input", updateEssence));
    $("palmon-camp").addEventListener("change", updatePalmon);
    PALMON_RESOURCE_ORDER.forEach((rk) => BOX_TIERS.forEach((t) => $(`pbox-${rk}-${t}`).addEventListener("input", updatePalmon)));
    // 인벤토리 요약
    const invIds = [];
    RESOURCE_KEYS.forEach((k) => invIds.push(`res-${k}`));
    RESOURCE_KEYS.forEach((rk) => BOX_TIERS.forEach((t) => invIds.push(`box-${rk}-${t}`)));
    const sg = getSpeedupGroupMap();
    SPEEDUP_GROUPS.forEach((grp) => Object.keys(sg[grp.key]).forEach((k) => invIds.push(`spd-${grp.key}-${k}`)));
    invIds.forEach((id) => $(id) && $(id).addEventListener("input", updateInventorySummary));
    $("lv-camp").addEventListener("change", updateInventorySummary);

    // 자동 로드 + 초기 렌더
    autoLoadFromLocalStorage();
    updateBead();
    updateEssence();
    updatePalmon();
    updateInventorySummary();
  } catch (err) {
    console.error(err);
    document.querySelector(".container").innerHTML = `
      <div class="result-card" style="border-color:var(--red);text-align:center;padding:40px;">
        <div class="card-title txt-red" style="font-size:18px;">❌ 로드 실패</div>
        <p>${err.message}</p>
        <p class="txt-dim" style="font-size:12px;">로컬에서 열 때는 <code>file://</code> 프로토콜에서 fetch가 막힐 수 있습니다. 간단히 <code>python3 -m http.server</code> 로 띄워주세요.</p>
      </div>`;
  }
}

bootstrap();
