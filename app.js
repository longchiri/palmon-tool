// =====================================================
// ⚠️ 게시판 설정 — Pantry UUID 를 여기에 붙여넣으세요
// https://getpantry.cloud/ 에서 무료로 발급 (이메일 입력만, 계정 불필요)
// =====================================================
const PANTRY_ID = "d7f3296b-3c53-4aae-aff2-9388a4797dfc";
const PANTRY_BASKET = "palmon-board";

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
// 자원 이모지 — 사이트 전체에서 고정으로 사용
const RESOURCE_EMOJI = {
  gold: "💰",
  wood: "🪵",
  steel: "🧱",
  power: "⚡",
  palmon_xp: "🥚",
};
const RESOURCE_LABELS = {
  gold: "💰 골드",
  wood: "🪵 목재",
  steel: "🧱 강철",
};
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
  palmon_xp: "🥚 팰몬 경험치",
  power: "⚡ 전력",
  gold: "💰 골드",
  steel: "🧱 강철",
  wood: "🪵 목재",
};

const BEAD_PER_WEAPON = 150;
const BEAD_VALUES = {
  "1성": 10, "2성": 20, "3성": 30, "4성": 40, "5성": 50,
  "6성": 75, "7성": 100, "8성": 200, "9성": 300, "10성": 500,
};
// 초기화 환급 = 그 등급까지 만드는 데 들어간 누적 비용
const BEAD_RESET_REFUND = {
  "1성": 10, "2성": 30, "3성": 60, "4성": 100, "5성": 150,
  "6성": 225, "7성": 325, "8성": 525, "9성": 825, "10성": 1325,
};
const PROMO_PER_PALMON = 975;
const EVO_PER_PALMON = 300;
const EVO_VALUES = { "진화 1단계": 20, "진화 2단계": 40, "진화 3단계": 80, "진화 4단계": 160 };
// 초기화 환급 = 그 단계까지의 누적 비용 (해당 팰몬을 그 단계까지 만드는 데 들어간 정수 합)
const EVO_RESET_REFUND = { "진화 1단계": 20, "진화 2단계": 60, "진화 3단계": 140, "진화 4단계": 300 };

// 메가 진화 (진화 5~8단계) — 메가 진화석 사용
// 누적 비용 (해당 단계까지 만드는 데 들어간 메가 진화석 총합)
const MEGA_EVO_PER_PALMON = 160;  // 진화 8단계 1명 완성에 필요한 메가 진화석
const MEGA_EVO_RESET_REFUND = {
  "진화 5단계": 1,
  "진화 6단계": 40,
  "진화 7단계": 80,
  "진화 8단계": 160,
};
const ALL_EVO_STAGES = [
  "진화 1단계", "진화 2단계", "진화 3단계", "진화 4단계",
  "진화 5단계", "진화 6단계", "진화 7단계", "진화 8단계",
];
// 5~8단계 = 메가 진화 (메가 진화석 사용)
const isMegaEvoStage = (s) => ["진화 5단계","진화 6단계","진화 7단계","진화 8단계"].includes(s);
const getEvoStageCost = (s) => isMegaEvoStage(s) ? (MEGA_EVO_RESET_REFUND[s] || 0) : (EVO_RESET_REFUND[s] || 0);
// 화면 표시용 라벨 — 진화 5~8단계는 "메가진화 5~8단계" 로 보여줌 (내부 데이터 키는 그대로)
const displayEvoStage = (s) => isMegaEvoStage(s) ? s.replace("진화 ", "메가진화 ") : s;

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
  "작업파견 가속": "캠프평점 / 아래 예시사진 확인",
};

// ===== 전역 상태 =====
let DB = null;       // palmonDB.json
let BUFF_MAP = {};   // name -> buff

// ===== 헬퍼 =====
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);
const fmt = (n) => Number(n).toLocaleString("ko-KR");

// 입력칸 옆 한글 힌트 자동 업데이트
function updateInputKrHint(inputId) {
  const inp = document.getElementById(inputId);
  const hint = document.getElementById(inputId + "-kr");
  if (!inp || !hint) return;
  hint.textContent = fmtKR(parseInt(inp.value || 0));
}
function attachKrHints(ids) {
  ids.forEach((id) => {
    const inp = document.getElementById(id);
    if (!inp || inp.dataset.krAttached) return;
    inp.dataset.krAttached = "1";
    inp.addEventListener("input", () => updateInputKrHint(id));
    updateInputKrHint(id);
  });
}
function refreshAllKrHints() {
  ["res-gold","res-wood","res-steel","res-exp","tg-res-gold","tg-res-wood","tg-res-steel","tg-res-exp"].forEach(updateInputKrHint);
}

// 한글 자릿수 표기 — 1만 이상부터 "3억 5,530만 8천" 식으로
// 1만 미만이면 빈 문자열 반환
function fmtKR(n) {
  n = Number(n) || 0;
  if (n === 0) return "";
  const sign = n < 0 ? "-" : "";
  n = Math.abs(n);
  if (n < 10000) return "";  // 만 미만은 표시 안 함
  const jo   = Math.floor(n / 1000000000000);
  const eok  = Math.floor((n % 1000000000000) / 100000000);
  const man  = Math.floor((n % 100000000) / 10000);
  const cheon = Math.floor((n % 10000) / 1000);
  const parts = [];
  if (jo > 0) parts.push(`${jo.toLocaleString("ko-KR")}조`);
  if (eok > 0) parts.push(`${eok.toLocaleString("ko-KR")}억`);
  if (man > 0) parts.push(`${man.toLocaleString("ko-KR")}만`);
  if (cheon > 0 && jo === 0 && eok === 0) parts.push(`${cheon}천`);
  return sign + parts.join(" ");
}

// 숫자 + 한글 표기 (한글이 있을 때만 괄호로 추가)
function fmtWithKR(n) {
  const kr = fmtKR(n);
  return kr ? `${fmt(n)} <span class="num-kr">(${kr})</span>` : fmt(n);
}

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
  // 건물 레벨 — 컬럼별로 분리 렌더 (col-1: 캠프/병원/연구대, col-2: 분대/아미고 기지)
  const COL_1_BUILDINGS = ["캠프", "병원", "연구대"];
  const COL_2_BUILDINGS = ["분대", "아미고 기지"];
  const col1 = $("building-col-1");
  const col2 = $("building-col-2");
  // 호환: 옛 #building-levels 요소가 남아있다면 거기에도 작성
  const legacy = $("building-levels");
  if (col1) col1.innerHTML = "";
  if (col2) col2.innerHTML = "";
  if (legacy) legacy.innerHTML = "";

  const makeRow = (b) => {
    const max = Math.max(...Object.keys(DB.buildings[b] || {}).map((x) => parseInt(x)));
    const min = Math.min(...Object.keys(DB.buildings[b] || {}).map((x) => parseInt(x))) - 1;
    const range = [];
    for (let v = min; v <= max; v++) range.push(v);
    const sel = el("select", { id: `lv-${SETTINGS_LEVEL_KEYS[b]}` });
    sel.innerHTML = range.map((v) => `<option value="${v}" ${v === min ? "selected" : ""}>${v}</option>`).join("");
    return el("div", { class: "form-row" }, el("label", {}, LEVEL_LABELS[b]), sel);
  };

  if (col1 && col2) {
    for (const b of COL_1_BUILDINGS) col1.appendChild(makeRow(b));
    for (const b of COL_2_BUILDINGS) col2.appendChild(makeRow(b));
  } else if (legacy) {
    // 옛 레이아웃 fallback
    for (const b of BUILDING_ORDER) legacy.appendChild(makeRow(b));
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

function buildInventoryTab(opts) {
  opts = opts || {};
  const prefix = opts.prefix || "";   // e.g. "tg-" for target tab

  // 보유 자원 — 입력 옆에 한글 자릿수 힌트
  const ores = $(`${prefix}owned-resources`);
  if (ores) {
    ores.innerHTML = "";
    const mkRow = (label, id) => el("div", { class: "form-row" },
      el("label", {}, label),
      el("div", { class: "input-with-kr" },
        el("input", { type: "number", id, min: "0", value: "0", inputmode: "numeric" }),
        el("div", { class: "input-kr-hint", id: `${id}-kr` }, ""),
      ),
    );
    for (const rk of RESOURCE_KEYS) {
      ores.appendChild(mkRow(RESOURCE_LABELS[rk], `${prefix}res-${rk}`));
    }
    // 🥚 경험치 (팰몬 경험치) — RESOURCE_KEYS 외 별도 입력
    ores.appendChild(mkRow("🥚 경험치", `${prefix}res-exp`));
  }

  // 자원 상자 — 4열 grid (라벨 + SR + SSR + UR)
  const boxes = $(`${prefix}owned-boxes`);
  if (boxes) {
    boxes.innerHTML = "";
    const hdr = el("div", { class: "inv-box-grid" },
      el("div", {}),
      ...BOX_TIERS.map((t) => el("div", { class: `h tier tier-${t.toLowerCase()}`}, t))
    );
    boxes.appendChild(hdr);
    for (const rk of RESOURCE_KEYS) {
      const row = el("div", { class: "inv-box-grid" }, el("div", { class: "rk-label" }, RESOURCE_LABELS[rk]));
      for (const tier of BOX_TIERS) {
        row.appendChild(el("input", { type: "number", id: `${prefix}box-${rk}-${tier}`, min: "0", value: "0", inputmode: "numeric" }));
      }
      boxes.appendChild(row);
    }
    // 🥚 경험치 상자 — RESOURCE_KEYS 외 별도 행
    const expBoxRow = el("div", { class: "inv-box-grid" },
      el("div", { class: "rk-label", style: "color:var(--blue);font-weight:700;" }, "🥚 경험치")
    );
    for (const tier of BOX_TIERS) {
      expBoxRow.appendChild(el("input", { type: "number", id: `${prefix}box-exp-${tier}`, min: "0", value: "0", inputmode: "numeric" }));
    }
    boxes.appendChild(expBoxRow);
    // 커스텀 박스 — 깔 때 골드/목재/강철 중 선택 가능 (값은 동일)
    const customRow = el("div", { class: "inv-box-grid" },
      el("div", { class: "rk-label", style: "color:var(--amber);font-weight:700;" }, "📦 커스텀상자")
    );
    for (const tier of BOX_TIERS) {
      customRow.appendChild(el("input", { type: "number", id: `${prefix}box-custom-${tier}`, min: "0", value: "0", inputmode: "numeric" }));
    }
    boxes.appendChild(customRow);
  }

  // 가속권 — 컴팩트한 spd-grid 레이아웃
  const sg = getSpeedupGroupMap();
  const SPD_ORDER = ["8h", "3h", "1h", "5m", "1m"];
  for (const grp of SPEEDUP_GROUPS) {
    const containerId = prefix + grp.key.replace(/_speedups$/, "-speedups");
    const cont = $(containerId);
    if (!cont) continue;
    cont.innerHTML = "";
    const keys = Object.keys(sg[grp.key]);
    const sortedKeys = SPD_ORDER.filter((k) => keys.includes(k)).concat(keys.filter((k) => !SPD_ORDER.includes(k)));
    for (const k of sortedKeys) {
      const item = el("div", { class: "spd-item" },
        el("span", { class: "spd-label" }, k),
        el("input", { type: "number", id: `${prefix}spd-${grp.key}-${k}`, min: "0", value: "0", inputmode: "numeric" }),
      );
      cont.appendChild(item);
    }
  }
}

function buildPalmonTab() {
  // 캠프 콤보 — 내 캠프 레벨 / 비교 캠프 둘 다
  const levels = Object.keys(DB.resource_boxes || {}).map((x) => parseInt(x)).sort((a, b) => a - b);
  const maxLv = levels[levels.length - 1];
  const camp = $("palmon-camp");
  if (camp) {
    camp.innerHTML = "";
    for (const v of levels) {
      camp.innerHTML += `<option value="${v}" ${v === 20 ? "selected" : ""}>LV${v}</option>`;
    }
  }
  const cmpCamp = $("palmon-cmp-camp");
  if (cmpCamp) {
    cmpCamp.innerHTML = "";
    for (const v of levels) {
      cmpCamp.innerHTML += `<option value="${v}" ${v === maxLv ? "selected" : ""}>LV${v}</option>`;
    }
  }

  // 상자 입력 — palmon-box-grid (라벨 + SR/SSR/UR)
  const wrap = $("palmon-boxes");
  wrap.innerHTML = "";
  const hdr = el("div", { class: "palmon-box-grid" },
    el("div", {}),
    ...BOX_TIERS.map((t) => el("div", { class: `h tier tier-${t.toLowerCase()}`}, t))
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
function getOwnedResources(prefix) {
  prefix = prefix || "";
  return Object.fromEntries(RESOURCE_KEYS.map((k) => [k, parseInt($(`${prefix}res-${k}`)?.value || 0)]));
}
function getOwnedBoxes(prefix) {
  prefix = prefix || "";
  const out = {};
  for (const rk of RESOURCE_KEYS) {
    out[rk] = {};
    for (const t of BOX_TIERS) out[rk][t] = parseInt($(`${prefix}box-${rk}-${t}`)?.value || 0);
  }
  return out;
}
// 커스텀 박스 — 깔 때 골드/목재/강철 중 선택 가능 (모두 같은 값)
function getCustomBoxes(prefix) {
  prefix = prefix || "";
  const out = {};
  for (const t of BOX_TIERS) out[t] = parseInt($(`${prefix}box-custom-${t}`)?.value || 0);
  return out;
}
function getOwnedSpeedups(prefix) {
  prefix = prefix || "";
  const sg = getSpeedupGroupMap();
  const out = {};
  for (const grp of SPEEDUP_GROUPS) {
    out[grp.key] = {};
    for (const k of Object.keys(sg[grp.key])) {
      out[grp.key][k] = parseInt($(`${prefix}spd-${grp.key}-${k}`)?.value || 0);
    }
  }
  return out;
}

// ===== 계산 결과 =====
function calculate(opts) {
  opts = opts || {};
  const silent = opts.silent === true;          // 자동 트리거 시 alert 안 띄움
  const skipTabSwitch = opts.skipTabSwitch === true;  // 자동 트리거 시 탭 전환 안 함
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

    const ownedResources = getOwnedResources("tg-");
    const ownedBoxes = getOwnedBoxes("tg-");
    const customBoxes = getCustomBoxes("tg-");
    const totalOwnedWithBoxes = calcTotalResourcesWithBoxes(currentLevels["캠프"], ownedResources, ownedBoxes);
    const shortages = {};
    for (const k of RESOURCE_KEYS) shortages[k] = Math.max(0, totalFinal[k] - (totalOwnedWithBoxes[k] || 0));

    // 커스텀 박스 — 부족한 자원(가장 부족한 것부터)에 박스 개수로 그리디 분배
    // 골드/목재/강철 값이 동일하므로 boxTable[tier].gold 사용
    const _boxTbl = DB.resource_boxes[String(currentLevels["캠프"])] || {};
    const _tierVal = {
      UR: parseInt(_boxTbl.UR?.gold || 0),
      SSR: parseInt(_boxTbl.SSR?.gold || 0),
      SR: parseInt(_boxTbl.SR?.gold || 0),
    };
    const _remainCustom = { SR: customBoxes.SR || 0, SSR: customBoxes.SSR || 0, UR: customBoxes.UR || 0 };
    const customAlloc = {};   // resource -> { SR, SSR, UR } 박스 개수
    const customApplied = { gold: 0, wood: 0, steel: 0 };  // resource -> 더해진 자원량
    const _sortedShort = [...RESOURCE_KEYS].sort((a, b) => shortages[b] - shortages[a]);
    for (const k of _sortedShort) {
      customAlloc[k] = { SR: 0, SSR: 0, UR: 0 };
      let need = shortages[k];
      // 작은 박스(SR) 부터 소진 — UR 같은 고급 박스는 나중에 사용 (사용자 요청)
      for (const tier of ["SR", "SSR", "UR"]) {
        const v = _tierVal[tier];
        if (v <= 0) continue;
        while (need > 0 && _remainCustom[tier] > 0) {
          customAlloc[k][tier]++;
          _remainCustom[tier]--;
          customApplied[k] += v;
          need -= v;
        }
        if (need <= 0) break;
      }
      shortages[k] = Math.max(0, need);
      totalOwnedWithBoxes[k] += customApplied[k];
    }
    const customRemainBoxes = _remainCustom;  // 잉여 커스텀 박스 개수

    const boxRecOnly = {};
    for (const k of RESOURCE_KEYS) boxRecOnly[k] = Math.max(0, totalFinal[k] - (ownedResources[k] || 0));
    const boxResult = optimizeResourceBoxes(currentLevels["캠프"], boxRecOnly, ownedBoxes);
    for (const k of RESOURCE_KEYS) {
      if (totalFinal[k] > (totalOwnedWithBoxes[k] || 0)) {
        boxResult[k] = { possible: false, open_counts: { SR: 0, SSR: 0, UR: 0 }, overage: 0 };
      }
    }

    const ownedSpeedups = getOwnedSpeedups("tg-");
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
      customApplied, customAlloc, customRemainBoxes,
    });
    if (!skipTabSwitch) activateTab("t-result");
  } catch (e) {
    console.error(e);
    if (!silent) alert(e.message || String(e));
  }
}

// 자동 계산 (입력값 변경 시 — alert 안 띄우고 탭 전환도 안 함)
let _autoCalcTimer = null;
// 보유자원/가속 탭의 입력값을 목표캠프계산기 탭의 tg-* 입력으로 복사
function importInventoryToTarget() {
  // 자원
  for (const k of RESOURCE_KEYS) {
    const src = $(`res-${k}`);
    const dst = $(`tg-res-${k}`);
    if (src && dst) dst.value = src.value || 0;
  }
  // 상자
  for (const rk of RESOURCE_KEYS) {
    for (const t of BOX_TIERS) {
      const src = $(`box-${rk}-${t}`);
      const dst = $(`tg-box-${rk}-${t}`);
      if (src && dst) dst.value = src.value || 0;
    }
  }
  // 📦 커스텀상자 (SR/SSR/UR)
  for (const t of BOX_TIERS) {
    const src = $(`box-custom-${t}`);
    const dst = $(`tg-box-custom-${t}`);
    if (src && dst) dst.value = src.value || 0;
  }
  // 가속권 5종
  const sg = getSpeedupGroupMap();
  for (const grp of SPEEDUP_GROUPS) {
    for (const k of Object.keys(sg[grp.key])) {
      const src = $(`spd-${grp.key}-${k}`);
      const dst = $(`tg-spd-${grp.key}-${k}`);
      if (src && dst) dst.value = src.value || 0;
    }
  }
  autoCalculate();
  refreshAllKrHints();
  toast("보유자원/가속 데이터를 불러왔습니다");
}

function autoCalculate() {
  if (_autoCalcTimer) clearTimeout(_autoCalcTimer);
  _autoCalcTimer = setTimeout(() => {
    calculate({ silent: true, skipTabSwitch: true });
  }, 120);
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
      <div class="tbl-wrap"><table class="tbl">${timeRows}</table></div>
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
      <td class="value amber">${fmtWithKR(r.totalFinal[k])}</td>
      <td class="value">${fmtWithKR(r.totalOwnedWithBoxes[k] || 0)}</td>
      <td class="value ${cls}">${fmtWithKR(short)}</td>
    </tr>`;
  }
  // 커스텀 박스 추천 카드 (별도) — 박스 개수로 표시
  const cAlloc = r.customAlloc || {};
  const cRemain = r.customRemainBoxes || {};
  const usedByResource = (k) => (cAlloc[k]?.SR || 0) + (cAlloc[k]?.SSR || 0) + (cAlloc[k]?.UR || 0);
  const totalUsedBoxes = usedByResource("gold") + usedByResource("wood") + usedByResource("steel");
  const totalRemainBoxes = (cRemain.SR || 0) + (cRemain.SSR || 0) + (cRemain.UR || 0);
  const totalCustomBoxes = totalUsedBoxes + totalRemainBoxes;

  // 결과 자원 카드 — 커스텀 분배는 자원상자 추천 카드의 "커스텀" 열로 이동됨
  const cardRes = `
    <div class="result-card" style="border-color:var(--amber);">
      <div class="card-title txt-amber">◆ 총 필요 자원</div>
      <div class="tbl-wrap"><table class="tbl">${resRows}</table></div>
    </div>`;

  // 커스텀상자 추천 카드 — 자원상자 추천에 통합됨 (아래 표의 "커스텀" 열 참조)

  // 4. 자원상자 + 📦 커스텀상자 추천 (C-2안 — 행 추가 형식)
  // 각 자원마다: 1) 일반 박스 행, 2) └ 커스텀 분배 행 (커스텀 갯수 0이 아닐 때만)
  let boxRows = `<tr><th></th><th class="tier tier-sr">SR</th><th class="tier tier-ssr">SSR</th><th class="tier tier-ur">UR</th><th>초과 자원</th></tr>`;
  for (const k of RESOURCE_KEYS) {
    const info = r.boxResult[k];
    // (1) 일반 자원상자 행
    if (info.possible) {
      boxRows += `<tr>
        <td class="label">${RESOURCE_LABELS[k]}</td>
        <td class="value tier-sr">${fmtN(info.open_counts.SR)}</td>
        <td class="value tier-ssr">${fmtN(info.open_counts.SSR)}</td>
        <td class="value tier-ur">${fmtN(info.open_counts.UR)}</td>
        <td class="value amber">${fmtN(info.overage)}</td>
      </tr>`;
    } else {
      boxRows += `<tr>
        <td class="label">${RESOURCE_LABELS[k]}</td>
        <td colspan="3" class="value red">해결 불가</td>
        <td></td>
      </tr>`;
    }
    // (2) 커스텀 분배 sub-row — 커스텀 갯수가 하나라도 있을 때만 추가
    const ca = (r.customAlloc && r.customAlloc[k]) || { SR: 0, SSR: 0, UR: 0 };
    const cTotal = (ca.UR || 0) + (ca.SSR || 0) + (ca.SR || 0);
    if (cTotal > 0) {
      boxRows += `<tr class="custom-sub-row" style="background:rgba(251,191,36,0.04);">
        <td class="label" style="color:var(--amber);font-weight:600;padding-left:24px;">└ 커스텀 분배</td>
        <td class="value tier-sr">${fmtN(ca.SR || 0)}</td>
        <td class="value tier-ssr">${fmtN(ca.SSR || 0)}</td>
        <td class="value tier-ur">${fmtN(ca.UR || 0)}</td>
        <td class="value txt-dim">-</td>
      </tr>`;
    }
  }

  // 상자가 필요 없는지 판단 — 일반/커스텀 모두 0이고 해결 불가도 없으면 카드 통째로 숨김
  const needAnyBox = RESOURCE_KEYS.some((k) => {
    const oc = r.boxResult[k]?.open_counts || {};
    const ca = (r.customAlloc && r.customAlloc[k]) || {};
    const hasOpen = (oc.SR || 0) + (oc.SSR || 0) + (oc.UR || 0) > 0;
    const hasCustom = (ca.SR || 0) + (ca.SSR || 0) + (ca.UR || 0) > 0;
    const unsolvable = r.boxResult[k]?.possible === false;
    return hasOpen || hasCustom || unsolvable;
  });

  const cardBox = needAnyBox ? `
    <div class="result-card" style="border-color:var(--blue);">
      <div class="card-title txt-blue">◆ 자원상자 + 커스텀상자 추천</div>
      <div class="tbl-wrap"><table class="tbl">${boxRows}</table></div>
      <p style="font-size:12.5px;margin:10px 0 0;padding:8px 10px;background:rgba(251,191,36,0.08);border-left:3px solid var(--amber);border-radius:4px;color:var(--amber);">
        ※ 각 자원 행 아래의 <b>└ 커스텀 분배</b> = 그 자원에 분배될 커스텀상자 갯수 (SR → SSR → UR 순으로 소진)
      </p>
    </div>` : "";

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
  const owned = parseInt($("bead-total").value || 0);

  // 1~10성 초기화 수량 → 환급 합산
  const resetCounts = {};
  let resetRefund = 0;
  const stars = ["1성","2성","3성","4성","5성","6성","7성","8성","9성","10성"];
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    const cnt = parseInt($(`bead-reset-${i+1}`)?.value || 0);
    resetCounts[s] = cnt;
    resetRefund += cnt * BEAD_RESET_REFUND[s];
  }

  const total = owned + resetRefund;
  const possible = Math.floor(total / BEAD_PER_WEAPON);
  const remain = total - possible * BEAD_PER_WEAPON;
  const color = possible > 0 ? "var(--green)" : "var(--red)";

  // 초기화 행 (값이 있을 때만 표시)
  let resetRows = "";
  for (const s of stars) {
    const cnt = resetCounts[s];
    if (cnt > 0) {
      const sub = cnt * BEAD_RESET_REFUND[s];
      resetRows += `<tr><td class="label txt-purple">초기화 ${s}</td><td class="value txt-purple">${fmt(cnt)} × ${BEAD_RESET_REFUND[s]} = +${fmt(sub)}</td></tr>`;
    }
  }
  if (resetRefund > 0) {
    resetRows += `<tr><td class="label txt-purple">초기화 환급 합계</td><td class="value txt-purple"><b>+${fmt(resetRefund)}</b></td></tr>`;
  }

  // 목표한 성급 (원하는 성급 드롭다운 기반)
  const beadTarget = $("bead-target")?.value || "5성";
  const beadTargetCost = BEAD_RESET_REFUND[beadTarget] || BEAD_PER_WEAPON;
  const beadTargetCount = beadTargetCost > 0 ? Math.floor(total / beadTargetCost) : 0;
  const beadTargetRemain = total - beadTargetCount * beadTargetCost;

  // 결과 카드 — 선택한 성급 기준으로 표시 (0이면 "부족" + 부족 갯수)
  const targetColor = beadTargetCount > 0 ? "var(--green)" : "var(--red)";
  const beadShortage = beadTargetCount === 0 ? Math.max(0, beadTargetCost - total) : 0;
  const beadBigDisplay = beadTargetCount > 0
    ? `<div class="big-number" style="color:${targetColor};">${fmt(beadTargetCount)}<span class="unit">개</span></div>`
    : `<div class="big-number" style="color:${targetColor};font-size:42px;">부족 <span class="unit" style="color:${targetColor};">${fmt(beadShortage)}개</span></div>`;
  // 완성 후 남은 양 — 부족할 때는 숨김
  const beadRemainRow = beadTargetCount > 0
    ? `<tr><td class="label">완성 후 남은 양</td><td class="value amber">${fmt(beadTargetRemain)}</td></tr>`
    : "";
  // 부족 갯수 — 부족할 때만 표시
  const beadShortageRow = beadTargetCount === 0 && beadShortage > 0
    ? `<tr><td class="label" style="color:var(--red);font-weight:700;">부족 갯수</td><td class="value red"><b>${fmt(beadShortage)}</b></td></tr>`
    : "";
  $("bead-result").innerHTML = `
    <div class="result-card strong" style="border-color:${targetColor};">
      <div class="card-title" style="color:${targetColor};text-align:center;">◆ 완성 가능 무기</div>
      <div style="text-align:center;"><span class="target-badge">🎯 ${beadTarget} 기준</span></div>
      ${beadBigDisplay}
      <div class="tbl-wrap"><table class="tbl">
        <tr><td class="label">보유 구슬</td><td class="value">${fmt(owned)}</td></tr>
        ${resetRows}
        <tr><td class="label">합계</td><td class="value amber"><b>${fmt(total)}</b></td></tr>
        <tr><td class="label">${beadTarget} 1개당 필요</td><td class="value">${fmt(beadTargetCost)}</td></tr>
        ${beadRemainRow}
        ${beadShortageRow}
      </table></div>
    </div>`;
}

function updateBeadTargetResult(total) {
  const out = $("bead-target-output");
  const sel = $("bead-target");
  if (!out || !sel) return;
  if (total == null) {
    const owned = parseInt($("bead-total").value || 0);
    const stars = ["1성","2성","3성","4성","5성","6성","7성","8성","9성","10성"];
    let refund = 0;
    for (let i = 0; i < stars.length; i++) {
      refund += parseInt($(`bead-reset-${i+1}`)?.value || 0) * BEAD_RESET_REFUND[stars[i]];
    }
    total = owned + refund;
  }
  const target = sel.value;
  const cost = BEAD_RESET_REFUND[target];
  const count = cost > 0 ? Math.floor(total / cost) : 0;
  const remain = total - count * cost;
  out.textContent = `${target} 무기 ${fmt(count)}개 완성 가능 (남은 갯수 ${fmt(remain)})`;
  out.classList.toggle("zero", count === 0);
}

// ===== 팰몬 진화 — 타입/메가 토글 상태 =====
// palmonType: 'regular' (기존 팰몬, 진화 정수 + 메가 진화석) | 'season' (시즌 팰몬, 오로라의 정수만)
// megaSupport: 진화 정수 카드용 메가진화 지원 여부
// energyMegaSupport: 에너지 구슬 카드용 메가진화 지원 여부 (진화 정수와 독립)
let __palmonType = "regular";
let __megaSupport = true;
let __energyMegaSupport = true;

function applyPalmonModeToDOM() {
  const card = document.getElementById("evo-card");
  if (!card) return;
  const isSeason = __palmonType === "season";
  const isRegularNoMega = __palmonType === "regular" && !__megaSupport;

  // 타입 클래스
  card.classList.toggle("ptype-season", isSeason);
  card.classList.toggle("no-mega", isRegularNoMega);

  // 이미지/라벨 전환
  const img = document.getElementById("primary-essence-img");
  const lbl = document.getElementById("primary-essence-label");
  if (img && lbl) {
    if (isSeason) {
      img.src = "aurora.png";
      img.alt = "오로라의 정수";
      lbl.textContent = "오로라의 정수";
    } else {
      img.src = "evo.png";
      img.alt = "진화 정수";
      lbl.textContent = "진화 정수";
    }
  }

  // 힌트 텍스트 전환
  const hint = document.getElementById("evo-hint");
  if (hint) {
    if (isSeason) {
      hint.innerHTML = "예) 오로라의 정수 100 + 진화 4단계 1마리 초기화 → 100 + 300 = 400 → 1명 완성 (남은 100)<br>🚫 시즌 팰몬 — 진화 5~8단계 (메가진화) <b>아직 미출시</b>. 출시되면 자동 활성화됩니다.";
    } else if (isRegularNoMega) {
      hint.innerHTML = "예) 진화 정수 100 + 진화 4단계 1마리 초기화 → 100 + 300 = 400 → 1명 완성 (남은 100)<br>📌 메가진화 미지원 모드 (1~4단계만)";
    } else {
      hint.innerHTML = "예) 진화 정수 100 + 진화 4단계 1마리 초기화 → 100 + 300 = 400 → 1명 완성 (남은 100)<br>📌 메가진화 (5~8단계)는 메가 진화석 사용 — 1 / 40 / 80 / 160";
    }
  }

  // 카드 제목
  const title = card.querySelector(".group-title");
  if (title) {
    title.textContent = isSeason ? "오로라의 정수 (시즌 팰몬)" : "진화 정수 (Evolution)";
  }

  // 드롭다운 처리:
  //  - 시즌: 5~8단계 disabled + optgroup 라벨 "(미출시)"
  //  - 기존 + 메가 미지원: 5~8단계 disabled + optgroup 라벨 "(미지원)"
  //  - 메가가 비활성이면 현재 선택값 5~8단계면 4단계로 자동 리셋
  const sel = document.getElementById("evo-target");
  const megaOpt = document.getElementById("mega-optgroup");
  const megaInactive = isSeason || isRegularNoMega;
  if (megaOpt) {
    megaOpt.label = isSeason ? "── 메가진화 (미출시) ──"
                  : isRegularNoMega ? "── 메가진화 (미지원) ──"
                  : "── 메가진화 ──";
    Array.from(megaOpt.querySelectorAll("option")).forEach((opt) => {
      opt.disabled = megaInactive;
    });
  }
  if (sel && megaInactive && ["진화 5단계","진화 6단계","진화 7단계","진화 8단계"].includes(sel.value)) {
    sel.value = "진화 4단계";
  }

  // 메가 입력칸 비활성화 (시즌 모드만 — 기존+미지원은 카드 자체가 숨겨짐)
  const megaInputIds = ["mega-evo-total", "evo-reset-5", "evo-reset-6", "evo-reset-7", "evo-reset-8"];
  megaInputIds.forEach((id) => {
    const inp = document.getElementById(id);
    if (inp) {
      inp.disabled = isSeason;
      if (isSeason) inp.value = 0;
    }
  });

  // 메가 지원 토글 라벨 — 진화 정수 카드용
  const mtBtn = document.getElementById("mega-support-toggle");
  if (mtBtn) {
    mtBtn.classList.toggle("active", __megaSupport);
    mtBtn.textContent = __megaSupport ? "메가진화 지원 ✓" : "메가진화 미지원";
  }
  // 메가 지원 토글 라벨 — 에너지 구슬 카드용 (독립)
  const emtBtn = document.getElementById("energy-mega-support-toggle");
  if (emtBtn) {
    emtBtn.classList.toggle("active", __energyMegaSupport);
    emtBtn.textContent = __energyMegaSupport ? "메가진화 지원 ✓" : "메가진화 미지원";
  }

  // 에너지 구슬 드롭다운에 메가 비활성 상태 반영
  applyEnergyMegaSupport();

  // 타입 버튼 active 상태
  document.querySelectorAll(".ptype-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.ptype === __palmonType);
  });
}

// 에너지 구슬 드롭다운 옵션 — 자체 메가진화 토글(__energyMegaSupport) 또는 시즌 팰몬일 때 비활성
function applyEnergyMegaSupport() {
  const isSeason = __palmonType === "season";
  const megaInactive = (!__energyMegaSupport) || isSeason;
  const curSel = document.getElementById("energy-current");
  const tgtSel = document.getElementById("energy-target");
  if (!curSel || !tgtSel) return;
  const megaGroups = new Set(["mega5","mega6","mega7","mega8","skill"]);
  const isMegaIdx = (idx) => idx >= 0 && idx < ENERGY_STAGES.length && megaGroups.has(ENERGY_STAGES[idx].group);

  // 옵션 disable 처리
  [curSel, tgtSel].forEach((sel) => {
    Array.from(sel.querySelectorAll("option")).forEach((opt) => {
      const v = parseInt(opt.value);
      if (Number.isFinite(v) && isMegaIdx(v)) opt.disabled = megaInactive;
    });
  });

  // 선택된 값이 비활성 메가 단계면 마지막 evo 단계로 리셋
  const lastEvoIdx = ENERGY_STAGES.findIndex((_, i, arr) =>
    i === arr.length - 1 || arr[i + 1].group === "mega5"
  );
  if (megaInactive) {
    if (isMegaIdx(parseInt(curSel.value))) curSel.value = String(lastEvoIdx);
    if (isMegaIdx(parseInt(tgtSel.value))) tgtSel.value = String(lastEvoIdx);
    updateEnergy();
  }

  // 힌트 텍스트
  const hint = document.getElementById("energy-hint");
  if (hint) {
    if (isSeason) {
      hint.innerHTML = "🚫 시즌 팰몬 — 진화 5~8단계 (메가진화) 미출시. 출시되면 자동 활성화됩니다.";
    } else if (!__energyMegaSupport) {
      hint.innerHTML = "📌 메가진화 미지원 모드 — 진화 1단계~4단계만 계산 가능 (총 22 소단계)";
    } else {
      hint.innerHTML = "예) 진화 1단계 1번 → 메가 스킬해금 = 800,000개 필요 · 각 소단계당 10번 강화";
    }
  }
}

function setupPalmonModeToggles() {
  // 타입 버튼
  document.querySelectorAll(".ptype-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      __palmonType = btn.dataset.ptype || "regular";
      try { localStorage.setItem("palmon_palmon_type", __palmonType); } catch {}
      applyPalmonModeToDOM();
      updateEssence();
    });
  });
  // 메가 지원 토글 — 진화 정수 카드 (1~8단계 진화 정수만 영향)
  const mt = document.getElementById("mega-support-toggle");
  if (mt) {
    mt.addEventListener("click", () => {
      __megaSupport = !__megaSupport;
      try { localStorage.setItem("palmon_mega_support", String(__megaSupport)); } catch {}
      applyPalmonModeToDOM();
      updateEssence();
    });
  }
  // 메가 지원 토글 — 에너지 구슬 카드 (5~8단계 + 메가스킬해금만 영향, 독립)
  const emt = document.getElementById("energy-mega-support-toggle");
  if (emt) {
    emt.addEventListener("click", () => {
      __energyMegaSupport = !__energyMegaSupport;
      try { localStorage.setItem("palmon_energy_mega_support", String(__energyMegaSupport)); } catch {}
      applyPalmonModeToDOM();
    });
  }
  // 저장된 상태 복원
  try {
    const t = localStorage.getItem("palmon_palmon_type");
    const m = localStorage.getItem("palmon_mega_support");
    const em = localStorage.getItem("palmon_energy_mega_support");
    if (t === "regular" || t === "season") __palmonType = t;
    if (m === "false") __megaSupport = false;
    if (em === "false") __energyMegaSupport = false;
  } catch {}
  applyPalmonModeToDOM();
}

// ===== 팰몬 진화 =====
function updateEssence() {
  const promoOwned = parseInt($("promo-total").value || 0);
  const promoPeople = Math.floor(promoOwned / PROMO_PER_PALMON);
  const promoRemain = promoOwned - promoPeople * PROMO_PER_PALMON;

  // 진화 정수 (일반) 입력
  const evoOwned = parseInt($("evo-total")?.value || 0);
  const resetCountsRegular = {
    "진화 1단계": parseInt($("evo-reset-1")?.value || 0),
    "진화 2단계": parseInt($("evo-reset-2")?.value || 0),
    "진화 3단계": parseInt($("evo-reset-3")?.value || 0),
    "진화 4단계": parseInt($("evo-reset-4")?.value || 0),
  };
  let evoResetSum = 0;
  for (const stage in resetCountsRegular) evoResetSum += resetCountsRegular[stage] * EVO_RESET_REFUND[stage];
  const evoTotal = evoOwned + evoResetSum;
  const evoPeople = Math.floor(evoTotal / EVO_PER_PALMON);

  // 메가 진화석 입력 (진화 5~8단계)
  const megaOwned = parseInt($("mega-evo-total")?.value || 0);
  const resetCountsMega = {
    "진화 5단계": parseInt($("evo-reset-5")?.value || 0),
    "진화 6단계": parseInt($("evo-reset-6")?.value || 0),
    "진화 7단계": parseInt($("evo-reset-7")?.value || 0),
    "진화 8단계": parseInt($("evo-reset-8")?.value || 0),
  };
  let megaResetSum = 0;
  for (const stage in resetCountsMega) megaResetSum += resetCountsMega[stage] * (MEGA_EVO_RESET_REFUND[stage] || 0);
  const megaTotal = megaOwned + megaResetSum;

  const fullSet = Math.min(promoPeople, evoPeople);

  // 한 카드로 통합 — 0이면 "부족 + 부족갯수" 표시
  function bigCard(headline, count, color, rows, shortage = 0) {
    const bigDisplay = count > 0
      ? `<div class="big-number" style="color:${color};">${fmt(count)}<span class="unit">명</span></div>`
      : `<div class="big-number" style="color:${color};font-size:42px;">부족 <span class="unit" style="color:${color};">${fmt(shortage)}개</span></div>`;
    const shortageRow = (count === 0 && shortage > 0)
      ? `<tr><td class="label" style="color:var(--red);font-weight:700;">부족 갯수</td><td class="value red"><b>${fmt(shortage)}</b></td></tr>`
      : "";
    return `
      <div class="result-card strong" style="border-color:${color};">
        <div class="card-title" style="color:${color};text-align:center;">◆ ${headline}</div>
        ${bigDisplay}
        <div class="tbl-wrap"><table class="tbl">${rows}${shortageRow}</table></div>
      </div>`;
  }

  const promoColor = promoPeople > 0 ? "var(--green)" : "var(--red)";
  const promoShortage = promoPeople === 0 ? Math.max(0, PROMO_PER_PALMON - promoOwned) : 0;
  const promoRemainRow = promoPeople > 0
    ? `<tr><td class="label">완성 후 남은 양</td><td class="value amber">${fmt(promoRemain)}</td></tr>`
    : "";
  const promoRows = `
    <tr><td class="label">보유</td><td class="value">${fmt(promoOwned)}</td></tr>
    <tr><td class="label">1명 승급 필요</td><td class="value">${fmt(PROMO_PER_PALMON)}</td></tr>
    ${promoRemainRow}`;
  const promoCard = bigCard("승급 가능 팰몬", promoPeople, promoColor, promoRows, promoShortage);

  // 목표한 진화 (원하는 진화 드롭다운 기반) — 일반(1~4) vs 메가(5~8) 분기
  const evoTarget = $("evo-target")?.value || "진화 4단계";
  const isMega = isMegaEvoStage(evoTarget);
  const isSeason = __palmonType === "season";
  const evoEssenceName = isSeason ? "오로라의 정수" : "진화 정수";

  // 남은 자원으로 가능한 다른 단계 인원 breakdown (1~4단계 기준)
  function makeBreakdown(remainEvoEssence, skipStage) {
    if (remainEvoEssence <= 0) return "";
    const parts = [];
    for (const stage of ["진화 1단계","진화 2단계","진화 3단계","진화 4단계"]) {
      if (stage === skipStage) continue;
      const cost = EVO_RESET_REFUND[stage];
      if (cost > 0) {
        const possible = Math.floor(remainEvoEssence / cost);
        if (possible > 0) parts.push(`${stage} <b>${fmt(possible)}명</b>`);
      }
    }
    if (parts.length === 0) return "";
    return `<tr><td colspan="2" style="padding:8px 4px 2px;border-top:1px dashed var(--border);"><div class="txt-dim" style="font-size:11.5px;line-height:1.6;">💡 남은 ${evoEssenceName} <b>${fmt(remainEvoEssence)}</b>로 추가 가능: ${parts.join(" / ")}</div></td></tr>`;
  }

  // 초기화 환급 행 - 일반(1~4) 진화 정수
  function makeEvoResetRows() {
    let r = "";
    for (const stage of ["진화 1단계","진화 2단계","진화 3단계","진화 4단계"]) {
      const cnt = resetCountsRegular[stage];
      const refund = EVO_RESET_REFUND[stage];
      if (cnt > 0 && refund > 0) {
        const sub = cnt * refund;
        r += `<tr><td class="label txt-purple">↻ ${stage}</td><td class="value txt-purple">${fmt(cnt)} × ${refund} = +${fmt(sub)}</td></tr>`;
      }
    }
    if (evoResetSum > 0) {
      r += `<tr><td class="label txt-purple">초기화 환급 합계</td><td class="value txt-purple"><b>+${fmt(evoResetSum)}</b></td></tr>`;
    }
    return r;
  }
  // 초기화 환급 행 - 메가(5~8) 메가 진화석
  function makeMegaResetRows() {
    let r = "";
    for (const stage of ["진화 5단계","진화 6단계","진화 7단계","진화 8단계"]) {
      const cnt = resetCountsMega[stage];
      const refund = MEGA_EVO_RESET_REFUND[stage];
      if (cnt > 0 && refund > 0) {
        const sub = cnt * refund;
        r += `<tr><td class="label txt-amber">↻ ${displayEvoStage(stage)}</td><td class="value txt-amber">${fmt(cnt)} × ${refund} = +${fmt(sub)}</td></tr>`;
      }
    }
    if (megaResetSum > 0) {
      r += `<tr><td class="label txt-amber">초기화 환급 합계</td><td class="value txt-amber"><b>+${fmt(megaResetSum)}</b></td></tr>`;
    }
    return r;
  }

  let evoCard;
  if (isMega) {
    // ━━ 메가 진화 (5~8단계) — 진화 정수(4단계 전제, 300) + 메가 진화석(target cost) 동시 필요 ━━
    const megaCost = MEGA_EVO_RESET_REFUND[evoTarget] || 0;
    const evoPrereq = EVO_PER_PALMON;  // 300 = 4단계 1명 = 메가 진입 전제
    const byEvo  = evoPrereq > 0 ? Math.floor(evoTotal / evoPrereq) : 0;
    const byMega = megaCost > 0 ? Math.floor(megaTotal / megaCost) : 0;
    const count = Math.min(byEvo, byMega);
    const usedEvo = count * evoPrereq;
    const usedMega = count * megaCost;
    const remainEvo = evoTotal - usedEvo;
    const remainMega = megaTotal - usedMega;
    const color = count > 0 ? "var(--green)" : "var(--red)";

    // 부족 안내 / 추가 가능 안내
    let limitRow = "";
    if (count === 0) {
      const evoLack  = Math.max(0, evoPrereq - evoTotal);
      const megaLack = Math.max(0, megaCost - megaTotal);
      const pieces = [];
      if (evoLack > 0)  pieces.push(`💜 진화 정수 <b>${fmt(evoLack)}개</b> 부족`);
      if (megaLack > 0) pieces.push(`💎 메가 진화석 <b>${fmt(megaLack)}개</b> 부족`);
      if (pieces.length) limitRow = `<tr><td colspan="2" style="text-align:center;color:var(--red);padding:8px 0 4px;font-size:13px;border-top:1px dashed var(--border);">⚠️ ${pieces.join(" · ")}</td></tr>`;
    } else if (byEvo < byMega) {
      const extra = (byMega - count) * evoPrereq - remainEvo;
      if (extra > 0) limitRow = `<tr><td colspan="2" style="text-align:center;color:var(--amber);padding:6px 0 4px;font-size:12px;border-top:1px dashed var(--border);">📊 진화 정수 <b>${fmt(extra)}개</b> 더 모으면 +${byMega - count}명 완성 가능</td></tr>`;
    } else if (byMega < byEvo) {
      const extra = (byEvo - count) * megaCost - remainMega;
      if (extra > 0) limitRow = `<tr><td colspan="2" style="text-align:center;color:var(--amber);padding:6px 0 4px;font-size:12px;border-top:1px dashed var(--border);">📊 메가 진화석 <b>${fmt(extra)}개</b> 더 모으면 +${byEvo - count}명 완성 가능</td></tr>`;
    }

    const bigDisplay = count > 0
      ? `<div class="big-number" style="color:${color};">${fmt(count)}<span class="unit">명</span></div>`
      : `<div class="big-number" style="color:${color};font-size:30px;">부족</div>`;

    const evoUsedRow = count > 0
      ? `<tr><td class="label">사용 / 남음</td><td class="value">-${fmt(usedEvo)} / <span class="amber">${fmt(remainEvo)}</span></td></tr>`
      : "";
    const megaUsedRow = count > 0
      ? `<tr><td class="label">사용 / 남음</td><td class="value">-${fmt(usedMega)} / <span class="amber">${fmt(remainMega)}</span></td></tr>`
      : "";

    evoCard = `
      <div class="result-card strong" style="border-color:${color};">
        <div class="card-title" style="color:${color};text-align:center;">◆ 진화 가능 팰몬</div>
        <div style="text-align:center;"><span class="target-badge">🎯 ${displayEvoStage(evoTarget)} 기준</span></div>
        ${bigDisplay}
        <div class="tbl-wrap"><table class="tbl">
          <tr><td colspan="2" class="txt-purple" style="padding:4px 4px 2px;font-size:11.5px;font-weight:700;">💜 ${evoEssenceName} (4단계 전제)</td></tr>
          <tr><td class="label">보유</td><td class="value">${fmt(evoOwned)}</td></tr>
          ${makeEvoResetRows()}
          <tr><td class="label">합계</td><td class="value txt-purple"><b>${fmt(evoTotal)}</b></td></tr>
          <tr><td class="label">4단계 1명 필요</td><td class="value">${fmt(evoPrereq)}</td></tr>
          <tr><td class="label">가능 인원</td><td class="value txt-purple"><b>${fmt(byEvo)}명</b></td></tr>
          ${evoUsedRow}
          ${count > 0 ? makeBreakdown(remainEvo, null) : ""}

          <tr><td colspan="2" class="txt-amber" style="padding:10px 4px 2px;font-size:11.5px;font-weight:700;border-top:1px dashed var(--border);">💎 메가 진화석 (${displayEvoStage(evoTarget)})</td></tr>
          <tr><td class="label">보유</td><td class="value">${fmt(megaOwned)}</td></tr>
          ${makeMegaResetRows()}
          <tr><td class="label">합계</td><td class="value txt-amber"><b>${fmt(megaTotal)}</b></td></tr>
          <tr><td class="label">${displayEvoStage(evoTarget)} 1명 필요</td><td class="value">${fmt(megaCost)}</td></tr>
          <tr><td class="label">가능 인원</td><td class="value txt-amber"><b>${fmt(byMega)}명</b></td></tr>
          ${megaUsedRow}

          ${limitRow}
        </table></div>
      </div>`;
  } else {
    // ━━ 일반 진화 (1~4단계) — 진화 정수만 ━━
    const targetCost = EVO_RESET_REFUND[evoTarget] || 0;
    const count = targetCost > 0 ? Math.floor(evoTotal / targetCost) : 0;
    const remain = evoTotal - count * targetCost;
    const color = count > 0 ? "var(--green)" : "var(--red)";
    const shortage = count === 0 ? Math.max(0, targetCost - evoTotal) : 0;
    const bigDisplay = count > 0
      ? `<div class="big-number" style="color:${color};">${fmt(count)}<span class="unit">명</span></div>`
      : `<div class="big-number" style="color:${color};font-size:42px;">부족 <span class="unit" style="color:${color};">${fmt(shortage)}개</span></div>`;
    const remainRow = count > 0
      ? `<tr><td class="label">완성 후 남은 양</td><td class="value amber">${fmt(remain)}</td></tr>`
      : "";
    const shortageRow = count === 0
      ? `<tr><td class="label" style="color:var(--red);font-weight:700;">부족 갯수</td><td class="value red"><b>${fmt(shortage)}</b></td></tr>`
      : "";
    evoCard = `
      <div class="result-card strong" style="border-color:${color};">
        <div class="card-title" style="color:${color};text-align:center;">◆ 진화 가능 팰몬</div>
        <div style="text-align:center;"><span class="target-badge ${isSeason ? '' : 'purple'}">🎯 ${displayEvoStage(evoTarget)} 기준</span></div>
        ${bigDisplay}
        <div class="tbl-wrap"><table class="tbl">
          <tr><td class="label">보유 ${evoEssenceName}</td><td class="value">${fmt(evoOwned)}</td></tr>
          ${makeEvoResetRows()}
          <tr><td class="label">합계</td><td class="value amber"><b>${fmt(evoTotal)}</b></td></tr>
          <tr><td class="label">${displayEvoStage(evoTarget)} 1명 필요</td><td class="value">${fmt(targetCost)}</td></tr>
          ${remainRow}
          ${shortageRow}
          ${count > 0 ? makeBreakdown(remain, evoTarget) : ""}
        </table></div>
      </div>`;
  }

  const fullColor = fullSet > 0 ? "var(--green)" : "var(--red)";
  const fullCard = `
    <div class="result-card" style="text-align:center;">
      <div class="card-title" style="color:${fullColor};">◆ 풀세팅 완성 인원 (승급 ∩ 진화)</div>
      <div style="margin-top:6px;">풀세팅 완성: <b style="color:${fullColor};font-size:24px;margin-left:6px;">${fmt(fullSet)}명</b></div>
    </div>`;

  // 분리 슬롯에 렌더 (각 행의 결과 칸으로)
  if ($("promo-result-slot")) $("promo-result-slot").innerHTML = promoCard;
  if ($("evo-result-slot")) $("evo-result-slot").innerHTML = evoCard;
  if ($("fullset-result-slot")) $("fullset-result-slot").innerHTML = "";   // 풀세팅 카드 제거
  // 폴백 (구 버전 호환)
  if ($("essence-result")) $("essence-result").innerHTML = promoCard + evoCard;
}

function updateEvoTargetResult(total) {
  const out = $("evo-target-output");
  const sel = $("evo-target");
  if (!out || !sel) return;
  if (total == null) {
    const owned = parseInt($("evo-total").value || 0);
    let refund = 0;
    for (const stage of ["진화 1단계","진화 2단계","진화 3단계","진화 4단계"]) {
      const idx = stage[0];
      refund += parseInt($(`evo-reset-${idx}`)?.value || 0) * EVO_RESET_REFUND[stage];
    }
    total = owned + refund;
  }
  const target = sel.value;
  const cost = EVO_RESET_REFUND[target];
  const count = cost > 0 ? Math.floor(total / cost) : 0;
  const remain = total - count * cost;
  out.textContent = `${target} ${fmt(count)}마리 완성 가능 (남은 갯수 ${fmt(remain)})`;
  out.classList.toggle("zero", count === 0);
}

// ===== 자원상자 비교하기 =====
// =====================================================
// 🌰 스킬열매 / 경험치 계산기
// =====================================================
// 레벨당 비용 (per-level cost). 인덱스 N = Lv (N+1) 도달 비용
// 예) EXP_PER_LEVEL[29] = Lv 29 → Lv 30 으로 가는 비용 (스킬: 9000)
// Lv X → Lv Y 비용 = arr[X] + arr[X+1] + ... + arr[Y-1]
const EXP_PER_LEVEL = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400, 1600, 1800, 2000, 2200, 2400, 2700, 3000, 3500, 4000, 5000, 6000, 7000, 8000, 9000, 10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000, 21000, 22000, 23000, 24000, 25000, 26000, 27000, 28000, 29000, 30000, 32000, 34000, 36000, 38000, 40000, 42000, 44000, 46000, 48000, 50000, 53000, 56000, 59000, 62000, 65000, 68000, 71000, 74000, 77000, 80000, 84000, 88000, 92000, 96000, 100000, 104000, 108000, 112000, 116000, 120000, 125000, 130000, 135000, 140000, 145000, 150000, 155000, 160000, 165000, 170000, 175000, 180000, 185000, 190000, 195000, 200000, 205000, 210000, 215000, 220000, 240000, 260000, 280000, 300000, 320000, 340000, 360000, 380000, 400000, 420000, 458000, 496000, 534000, 572000, 610000, 648000, 686000, 724000, 762000, 800000, 850000, 900000, 950000, 1000000, 1050000, 1100000, 1150000, 1200000, 1250000, 1300000, 1400000, 1500000, 1600000, 1700000, 1800000, 1900000, 2000000, 2100000, 2200000, 2300000, 2450000, 2600000, 2750000, 2900000, 3050000, 3200000, 3350000, 3500000, 3650000, 3800000, 4000000, 4200000, 4400000, 4600000, 4800000, 5000000, 5200000, 5400000, 5600000, 5800000, 6050000, 6300000, 6550000, 6800000, 7050000, 7300000, 7550000, 7800000, 8050000, 8300000, 8650000, 9000000, 9350000, 9700000, 10050000, 10400000, 10750000, 11100000, 11450000, 11800000, 12150000, 12538000, 12942000, 13356000, 13782000, 14218000, 14669000, 15129000, 15603000, 16089000, 16588000, 17100000, 17625000, 18164000, 18716000, 19282000, 19863000, 20458000, 21068000, 21693000, 22333000, 22988000, 23659000, 24347000, 25051000, 25770000, 26508000, 27262000, 28033000, 28823000, 29629000, 30456000, 31299000, 32162000, 33044000, 33945000, 34866000, 35807000, 36769000, 37750000, 38753000, 39778000, 40823000, 41891000, 42981000, 44093000, 45228000, 46387000, 47568000, 48774000, 50004000, 51258000, 52537000, 53842000, 55172000, 56527000, 57910000, 59318000, 60754000, 62217000, 63708000, 65226000, 66773000, 68350000, 69954000, 71589000, 73253000, 74949000, 76673000, 78431000, 80218000, 82038000, 83891000, 85775000, 87693000, 89645000, 91629000, 93650000, 95703000, 97793000, 99917000, 102077000, 104275000, 106508000, 108780000, 111089000, 113435000, 115821000, 118246000, 120709000, 123214000, 125757000, 128343000, 130968000, 133637000, 136347000, 139099000, 141896000, 144734000, 147618000, 150547000, 153519000, 156537000, 159602000, 162713000, 165871000, 169076000, 172329000, 175631000, 178982000, 182382000, 185832000, 189333000, 192884000, 196487000, 200143000, 203850000, 207611000, 211426000, 215519000];
const SKILL_PER_LEVEL = [0, 100, 200, 300, 400, 600, 800, 1000, 1200, 1400, 1700, 2000, 2300, 2600, 2900, 3200, 3500, 3800, 4100, 4400, 4700, 5000, 5500, 6000, 6500, 7000, 7500, 8000, 8500, 9000];

function buildSkillExpTab() {
  // 드롭다운 옵션 채우기
  const buildOpts = (max, defCurrent, defTarget) => {
    let opts = "";
    for (let lv = 1; lv <= max; lv++) {
      opts += `<option value="${lv}">${lv}</option>`;
    }
    return opts;
  };
  if ($("exp-current")) {
    $("exp-current").innerHTML = buildOpts(300);
    $("exp-target").innerHTML = buildOpts(300);
    $("exp-current").value = "1";
    $("exp-target").value = "300";
    $("exp-current").addEventListener("change", updateSkillExp);
    $("exp-target").addEventListener("change", updateSkillExp);
  }
  if ($("skill-current")) {
    $("skill-current").innerHTML = buildOpts(30);
    $("skill-target").innerHTML = buildOpts(30);
    $("skill-current").value = "1";
    $("skill-target").value = "30";
    $("skill-current").addEventListener("change", updateSkillExp);
    $("skill-target").addEventListener("change", updateSkillExp);
  }
  updateSkillExp();
}

// Lv from → Lv to 비용 = arr[from] + arr[from+1] + ... + arr[to-1]
function costRange(arr, fromLv, toLv) {
  if (toLv <= fromLv) return 0;
  let sum = 0;
  for (let i = fromLv; i < toLv && i < arr.length; i++) sum += arr[i] || 0;
  return sum;
}

function updateSkillExp() {
  // 경험치
  const expCur = parseInt($("exp-current")?.value || 1);
  const expTgt = parseInt($("exp-target")?.value || 290);
  // Lv 1 → 현재 Lv 누적 / Lv 1 → 목표 Lv 누적 / 필요량 (현재 → 목표)
  const expCumulCur = costRange(EXP_PER_LEVEL, 1, expCur);
  const expCumulTgt = costRange(EXP_PER_LEVEL, 1, expTgt);
  const expNeeded = costRange(EXP_PER_LEVEL, expCur, expTgt);
  const expColor = expNeeded === 0 ? "var(--text-dim)" : "var(--blue)";

  // 🥚 보유자원 탭에서 입력한 경험치 + 상자 데이터 활용
  const ownedExp = parseInt($("res-exp")?.value || 0);
  const ownedExpBoxes = {
    SR: parseInt($("box-exp-SR")?.value || 0),
    SSR: parseInt($("box-exp-SSR")?.value || 0),
    UR: parseInt($("box-exp-UR")?.value || 0),
  };
  const ownedAnything = ownedExp > 0 || ownedExpBoxes.SR > 0 || ownedExpBoxes.SSR > 0 || ownedExpBoxes.UR > 0;

  // 상자당 EXP — 현재 캠프 레벨 (목표캠프계산기) 또는 기본 LV 20
  const expCamp = parseInt($("lv-camp")?.value || 20);
  const rb = (DB && DB.resource_boxes) ? (DB.resource_boxes[String(expCamp)] || DB.resource_boxes["20"]) : null;
  const perBox = {
    SR: rb?.SR?.palmon_xp || 140000,
    SSR: rb?.SSR?.palmon_xp || 1111000,
    UR: rb?.UR?.palmon_xp || 3358000,
  };

  // 보유 상자 모두 깠을 때 얻는 EXP
  const expFromBoxes = ownedExpBoxes.SR * perBox.SR + ownedExpBoxes.SSR * perBox.SSR + ownedExpBoxes.UR * perBox.UR;
  const totalAvailable = ownedExp + expFromBoxes;
  const shortage = Math.max(0, expNeeded - totalAvailable);

  // 부족분을 채우기 위한 상자 추천 (그리디: UR → SSR → SR)
  function recommendBoxes(needed) {
    if (needed <= 0) return null;
    let rem = needed;
    const useUR = Math.min(ownedExpBoxes.UR, Math.ceil(rem / perBox.UR));
    rem -= useUR * perBox.UR;
    const useSSR = rem > 0 ? Math.min(ownedExpBoxes.SSR, Math.ceil(rem / perBox.SSR)) : 0;
    rem -= useSSR * perBox.SSR;
    const useSR = rem > 0 ? Math.min(ownedExpBoxes.SR, Math.ceil(rem / perBox.SR)) : 0;
    rem -= useSR * perBox.SR;
    return { useUR, useSSR, useSR, remaining: Math.max(0, rem) };
  }
  // 보유 상자로 채울 수 있는 만큼 추천
  const rec = recommendBoxes(Math.max(0, expNeeded - ownedExp));

  // 추천 표시 HTML
  let recommendHtml = "";
  if (expNeeded > 0 && ownedAnything) {
    const totalBoxesUsed = (rec?.useUR || 0) + (rec?.useSSR || 0) + (rec?.useSR || 0);
    const stillShort = rec?.remaining || 0;
    const okColor = stillShort === 0 ? "var(--green)" : "var(--red)";
    recommendHtml = `
      <div class="exp-recommend" style="margin-top:14px;padding:12px 14px;background:rgba(96,165,250,0.06);border:1px solid rgba(96,165,250,0.35);border-radius:10px;">
        <div style="color:var(--blue);font-weight:800;font-size:13px;margin-bottom:8px;">📦 상자 추천 (LV${expCamp} 기준)</div>
        <table class="tbl" style="margin:0;">
          <tr><td class="label">보유 경험치</td><td class="value">${fmt(ownedExp)}</td></tr>
          <tr><td class="label">📦 상자 추천</td><td class="value" style="font-weight:700;color:var(--blue);">
            ${rec && totalBoxesUsed > 0 ? [
              rec.useUR > 0 ? `<span class="tier-ur">UR ${rec.useUR}개</span>` : "",
              rec.useSSR > 0 ? `<span class="tier-ssr">SSR ${rec.useSSR}개</span>` : "",
              rec.useSR > 0 ? `<span class="tier-sr">SR ${rec.useSR}개</span>` : "",
            ].filter(Boolean).join(" + ") : "<span class='txt-dim'>상자 없음</span>"}
          </td></tr>
          <tr><td class="label" style="color:${okColor};font-weight:700;">${stillShort === 0 ? "✅ 충분" : "⚠️ 부족"}</td>
              <td class="value" style="color:${okColor};font-weight:800;">${stillShort === 0 ? "OK" : "${fmt(stillShort)} 더 필요"}</td></tr>
        </table>
        <div class="txt-dim" style="font-size:11.5px;margin-top:8px;line-height:1.5;">
          상자 1개당: <span class="tier-ur">UR ${fmt(perBox.UR)}</span> · <span class="tier-ssr">SSR ${fmt(perBox.SSR)}</span> · <span class="tier-sr">SR ${fmt(perBox.SR)}</span>
        </div>
      </div>`;
    // template literal nested 문제 — `stillShort` 값 직접 삽입
    recommendHtml = recommendHtml.replace("${fmt(stillShort)} 더 필요", `${fmt(stillShort)} 더 필요`);
  } else if (expNeeded > 0) {
    recommendHtml = `
      <div class="exp-recommend" style="margin-top:14px;padding:10px 14px;background:rgba(148,163,184,0.08);border:1px dashed rgba(148,163,184,0.4);border-radius:10px;font-size:12px;color:var(--text-dim);text-align:center;">
        💡 <b style="color:var(--text);">📦 보유자원/가속 계산하기</b> 탭에서 경험치 / 상자 보유 수량을 입력하면 여기에 <b style="color:var(--blue);">상자 추천</b>이 표시됩니다.
      </div>`;
  }

  const expSlot = $("exp-result-slot");
  if (expSlot) {
    expSlot.innerHTML = `
      <div class="result-card strong" style="border-color:${expColor};">
        <div class="card-title" style="color:${expColor};text-align:center;">🌟 필요 경험치</div>
        <div style="text-align:center;"><span class="target-badge">🎯 Lv ${expCur} → ${expTgt}</span></div>
        <div class="big-number" style="color:${expColor};">${fmt(expNeeded)}</div>
        <div class="tbl-wrap"><table class="tbl">
          <tr><td class="label">Lv 1 → ${expCur} 누적</td><td class="value">${fmt(expCumulCur)}</td></tr>
          <tr><td class="label">Lv 1 → ${expTgt} 누적</td><td class="value amber"><b>${fmt(expCumulTgt)}</b></td></tr>
          <tr><td class="label" style="color:${expColor};font-weight:700;">필요 경험치 (Lv ${expCur} → ${expTgt})</td><td class="value" style="color:${expColor};font-weight:800;">${fmt(expNeeded)}</td></tr>
        </table></div>
        ${recommendHtml}
      </div>`;
  }

  // 스킬 열매
  const skCur = parseInt($("skill-current")?.value || 1);
  const skTgt = parseInt($("skill-target")?.value || 30);
  const skCumulCur = costRange(SKILL_PER_LEVEL, 1, skCur);
  const skCumulTgt = costRange(SKILL_PER_LEVEL, 1, skTgt);
  const skNeeded = costRange(SKILL_PER_LEVEL, skCur, skTgt);
  const skColor = skNeeded === 0 ? "var(--text-dim)" : "var(--green)";
  const skSlot = $("skill-result-slot");
  if (skSlot) {
    skSlot.innerHTML = `
      <div class="result-card strong" style="border-color:${skColor};">
        <div class="card-title" style="color:${skColor};text-align:center;">🌰 필요 스킬 열매</div>
        <div style="text-align:center;"><span class="target-badge">🎯 Lv ${skCur} → ${skTgt}</span></div>
        <div class="big-number" style="color:${skColor};">${fmt(skNeeded)}<span class="unit">개</span></div>
        <div class="tbl-wrap"><table class="tbl">
          <tr><td class="label">Lv 1 → ${skCur} 누적</td><td class="value">${fmt(skCumulCur)}</td></tr>
          <tr><td class="label">Lv 1 → ${skTgt} 누적</td><td class="value amber"><b>${fmt(skCumulTgt)}</b></td></tr>
          <tr><td class="label" style="color:${skColor};font-weight:700;">필요 갯수 (Lv ${skCur} → ${skTgt})</td><td class="value" style="color:${skColor};font-weight:800;">${fmt(skNeeded)}개</td></tr>
        </table></div>
      </div>`;
  }
}

// ════════════════════════════════════════════════════════════════
// 🌰 열매상자 시뮬레이터
// ════════════════════════════════════════════════════════════════
// 각 row 확률은 1/22 단위 (총 22 weight)
// 합계: 레전드 8/22 (36.36%), 에픽 10/22 (45.45%), 레어 4/22 (18.19%)
const FRUITBOX_DROPS = [
  { tier: "레전드", tierKey: "ur",  qty: 5,  weight: 2, label: "레전드 스킬 열매" },
  { tier: "레전드", tierKey: "ur",  qty: 10, weight: 4, label: "레전드 스킬 열매" },
  { tier: "레전드", tierKey: "ur",  qty: 15, weight: 2, label: "레전드 스킬 열매" },
  { tier: "에픽",   tierKey: "ssr", qty: 5,  weight: 2, label: "에픽 스킬 열매"   },
  { tier: "에픽",   tierKey: "ssr", qty: 10, weight: 6, label: "에픽 스킬 열매"   },
  { tier: "에픽",   tierKey: "ssr", qty: 15, weight: 2, label: "에픽 스킬 열매"   },
  { tier: "레어",   tierKey: "sr",  qty: 5,  weight: 1, label: "레어 스킬 열매"   },
  { tier: "레어",   tierKey: "sr",  qty: 10, weight: 2, label: "레어 스킬 열매"   },
  { tier: "레어",   tierKey: "sr",  qty: 15, weight: 1, label: "레어 스킬 열매"   },
];
const FRUITBOX_TOTAL_WEIGHT = FRUITBOX_DROPS.reduce((s, d) => s + d.weight, 0);

// ════════════════════════════════════════════════════════════════
// 🌟 오로라 소환 시뮬레이터
// ════════════════════════════════════════════════════════════════
// Mode 1: 팰몬 미보유 — 친밀도 시스템 (1200 도달 자동 획득, 0.13% 직접)
// Mode 2: 팰몬 보유 — 친밀도 없음, 아이템만 분배
// 가중치: 1만분율 기준
const SUMMON_MODE1_DROPS = [
  { id: "target",   label: "⭐ 원하는 팰몬",       qty: 1,  weight: 13,   pct: 0.13,  intimacy: 0, isTarget: true, color: "var(--green)" },
  { id: "custom",   label: "📦 커스텀상자",        qty: 2,  weight: 999,  pct: 9.99,  intimacy: 2 },
  { id: "power",    label: "⚡ 전력 보물상자",     qty: 2,  weight: 999,  pct: 9.99,  intimacy: 1 },
  { id: "frag1",    label: "🟡 팰몬조각",          qty: 1,  weight: 1498, pct: 14.98, intimacy: 1 },
  { id: "frag2",    label: "🟡 팰몬조각",          qty: 2,  weight: 499,  pct: 4.99,  intimacy: 2 },
  { id: "fruit",    label: "🌰 스킬 열매",         qty: 50, weight: 1199, pct: 11.99, intimacy: 2 },
  { id: "wood",     label: "🪵 목판 보물상자",     qty: 1,  weight: 1199, pct: 11.99, intimacy: 1 },
  { id: "steel",    label: "⚙️ 강철 보물상자",     qty: 1,  weight: 1199, pct: 11.99, intimacy: 1 },
  { id: "gold",     label: "🪙 골드 보물상자",     qty: 1,  weight: 1199, pct: 11.99, intimacy: 1 },
  { id: "expbox",   label: "🥚 경험치 보물상자",   qty: 1,  weight: 1199, pct: 11.99, intimacy: 1 },
];
const SUMMON_MODE1_TOTAL_WEIGHT = SUMMON_MODE1_DROPS.reduce((s, d) => s + d.weight, 0);  // 10001

const SUMMON_MODE2_DROPS = [
  { id: "gem",      label: "✨ 오로라 정수",       qty: 5,  weight: 5,    pct: 0.5,  color: "var(--purple)" },
  { id: "custom",   label: "📦 커스텀상자",        qty: 2,  weight: 100,  pct: 10.0 },
  { id: "power",    label: "⚡ 전력 보물상자",     qty: 2,  weight: 100,  pct: 10.0 },
  { id: "frag1",    label: "🟡 팰몬조각",          qty: 1,  weight: 165,  pct: 16.5 },
  { id: "frag2",    label: "🟡 팰몬조각",          qty: 2,  weight: 30,   pct: 3.0 },
  { id: "fruit",    label: "🌰 스킬 열매",         qty: 50, weight: 120,  pct: 12.0 },
  { id: "wood",     label: "🪵 목판 보물상자",     qty: 1,  weight: 120,  pct: 12.0 },
  { id: "steel",    label: "⚙️ 강철 보물상자",     qty: 1,  weight: 120,  pct: 12.0 },
  { id: "gold",     label: "🪙 골드 보물상자",     qty: 1,  weight: 120,  pct: 12.0 },
  { id: "expbox",   label: "🥚 경험치 보물상자",   qty: 1,  weight: 120,  pct: 12.0 },
];
const SUMMON_MODE2_TOTAL_WEIGHT = SUMMON_MODE2_DROPS.reduce((s, d) => s + d.weight, 0);  // 1000

// 평균 친밀도 획득 per 소환 (Mode 1, 직접 획득 포함 안 함)
// = sum(intimacy * pct) for all non-target items
const SUMMON_AVG_INTIMACY_PER_PULL = SUMMON_MODE1_DROPS
  .filter((d) => !d.isTarget)
  .reduce((s, d) => s + (d.intimacy || 0) * (d.weight / SUMMON_MODE1_TOTAL_WEIGHT), 0);
// ≈ 1.848

// 신화 팰몬 보유 여부 상태 (토글)
let __summonHasTarget = false;

function applySummonToggleToDOM() {
  // 토글 버튼 active 상태
  document.querySelectorAll("#summon-card .ptype-btn").forEach((b) => {
    const isOwned = b.dataset.summonType === "owned";
    b.classList.toggle("active", isOwned === __summonHasTarget);
  });
  // 친밀도 입력칸 표시/숨김 (보유면 숨김)
  const intRow = $("summon-intimacy-row");
  if (intRow) intRow.style.display = __summonHasTarget ? "none" : "";
}

function updateSummonNeedInfo() {
  const box = $("summon-need-info");
  if (!box) return;
  const intimacy = Math.min(1200, Math.max(0, parseInt($("summon-intimacy")?.value || 0)));
  const hasTarget = __summonHasTarget;

  if (hasTarget) {
    box.innerHTML = `
      <div>✨ <b>신화 팰몬 보유 모드</b></div>
      <div style="font-size:13px;font-weight:600;margin-top:3px;color:var(--amber);">친밀도 무관 — 그냥 아이템만 뽑힘</div>`;
    box.style.background = "rgba(251,191,36,0.08)";
    box.style.borderColor = "rgba(251,191,36,0.3)";
    box.style.color = "var(--amber)";
    return;
  }

  if (intimacy >= 1200) {
    box.innerHTML = `
      <div>🎉 <b>친밀도 만피!</b></div>
      <div style="font-size:14px;font-weight:700;margin-top:3px;color:var(--green);">1회 소환 시 즉시 획득 가능</div>`;
    box.style.background = "rgba(34,197,94,0.08)";
    box.style.borderColor = "rgba(34,197,94,0.4)";
    box.style.color = "var(--green)";
    return;
  }

  const remain = 1200 - intimacy;
  const expected = Math.ceil(remain / SUMMON_AVG_INTIMACY_PER_PULL);  // 예상값 (평균)
  const ceiling = remain;  // 천장 (최악: 모든 풀 +1만 받아도 도달)

  box.innerHTML = `
    <div>📊 <b>예상 필요 구슬</b> (친밀도 ${fmt(intimacy)} → 1200, 남은 ${fmt(remain)})</div>
    <div style="font-size:14px;font-weight:700;margin-top:3px;color:var(--blue);">
      예상값: <b>${fmt(expected)}개</b>
      <span style="margin:0 10px;color:var(--text-dim);">·</span>
      천장: <b style="color:var(--amber);">${fmt(ceiling)}개</b>
    </div>`;
  box.style.background = "rgba(96,165,250,0.08)";
  box.style.borderColor = "rgba(96,165,250,0.3)";
  box.style.color = "var(--blue)";
}

function buildSummonTab() {
  if (!$("summon-count")) return;
  renderSummonIdle();

  $("summon-roll").addEventListener("click", () => {
    const count = Math.max(0, parseInt($("summon-count").value || 0));
    const startIntimacy = Math.min(1200, Math.max(0, parseInt($("summon-intimacy").value || 0)));
    const hasTarget = __summonHasTarget;
    if (count <= 0) { renderSummonIdle(); return; }
    const result = simulateSummon(count, startIntimacy, hasTarget);
    renderSummonResult(result, hasTarget, startIntimacy);
  });

  // 신화 팰몬 보유/미보유 토글
  document.querySelectorAll("#summon-card .ptype-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      __summonHasTarget = btn.dataset.summonType === "owned";
      applySummonToggleToDOM();
      updateSummonNeedInfo();
    });
  });
  applySummonToggleToDOM();

  // 실시간 필요 구슬 계산 (친밀도 변경 시)
  ["summon-intimacy"].forEach((id) => {
    const el = $(id);
    if (el) el.addEventListener("input", updateSummonNeedInfo);
  });
  updateSummonNeedInfo();

  if ($("summon-prob-toggle")) {
    $("summon-prob-toggle").addEventListener("click", () => {
      const tbl = $("summon-prob-table");
      const btn = $("summon-prob-toggle");
      if (!tbl) return;
      const isHidden = tbl.style.display === "none";
      tbl.style.display = isHidden ? "block" : "none";
      btn.textContent = isHidden ? "📊 확률표 숨기기" : "📊 확률표 보기";
    });
  }
}

function rollSummonOne(drops, totalWeight) {
  let r = Math.floor(Math.random() * totalWeight);
  for (let i = 0; i < drops.length; i++) {
    r -= drops[i].weight;
    if (r < 0) return drops[i];
  }
  return drops[drops.length - 1];
}

function simulateSummon(currency, startIntimacy, hasTarget) {
  const itemCounts = {};   // id → count
  let summonsUsed = 0;
  let intimacy = startIntimacy;
  let gotTarget = false;
  let gotBy = "";  // "direct" | "intimacy" | "none"

  const drops = hasTarget ? SUMMON_MODE2_DROPS : SUMMON_MODE1_DROPS;
  const totalWeight = hasTarget ? SUMMON_MODE2_TOTAL_WEIGHT : SUMMON_MODE1_TOTAL_WEIGHT;

  while (summonsUsed < currency) {
    summonsUsed++;
    const item = rollSummonOne(drops, totalWeight);

    if (item.isTarget) {
      // Mode 1 직접 획득
      gotTarget = true;
      gotBy = "direct";
      itemCounts[item.id] = (itemCounts[item.id] || 0) + 1;
      break;
    }

    // 아이템 카운트 증가
    itemCounts[item.id] = (itemCounts[item.id] || 0) + 1;

    if (!hasTarget) {
      // 친밀도 증가
      intimacy += (item.intimacy || 0);
      if (intimacy >= 1200) {
        gotTarget = true;
        gotBy = "intimacy";
        break;
      }
    }
  }

  return {
    summonsUsed,
    finalIntimacy: intimacy,
    gotTarget,
    gotBy,
    itemCounts,
    hasTarget,
    currencyRemain: currency - summonsUsed,
  };
}

function renderSummonIdle() {
  const slot = $("summon-result-slot");
  if (!slot) return;
  slot.innerHTML = `
    <div class="result-card" style="text-align:center;">
      <div class="card-title" style="color:var(--text-dim);">◆ 시뮬레이션 결과</div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:140px;">
        <p class="txt-dim" style="margin:0;font-size:13.5px;line-height:1.9;">
          🌟 보유 오로라 구슬 + 현재 친밀도 입력 후<br>
          ✅ <b>시뮬레이션 시작</b> 버튼을 눌러주세요.
        </p>
      </div>
    </div>`;
}

function renderSummonResult(result, hasTarget, startIntimacy) {
  const slot = $("summon-result-slot");
  if (!slot) return;

  const drops = hasTarget ? SUMMON_MODE2_DROPS : SUMMON_MODE1_DROPS;

  // 받은 아이템 목록 (등급별)
  const itemRows = [];
  for (const d of drops) {
    const cnt = result.itemCounts[d.id] || 0;
    if (cnt > 0) {
      const total = cnt * d.qty;
      const c = d.color || "var(--text)";
      itemRows.push(`<tr>
        <td><b style="color:${c};">${d.label}</b></td>
        <td class="value">${fmt(cnt)}회</td>
        <td class="value amber"><b>${fmt(total)}개</b></td>
      </tr>`);
    }
  }

  // 결과 색상 & 메시지
  let color, headlineMsg, subMsg;
  if (result.gotTarget) {
    color = "var(--green)";
    if (result.gotBy === "direct") {
      headlineMsg = `🎉 직접 획득!`;
      subMsg = `0.13% 확률을 뚫고 ${result.summonsUsed}회 만에 획득!`;
    } else {
      headlineMsg = `✅ 친밀도 만피로 획득!`;
      subMsg = `친밀도 1200 도달로 ${result.summonsUsed}회 만에 획득`;
    }
  } else if (hasTarget) {
    color = "var(--amber)";
    headlineMsg = `📦 ${fmt(result.summonsUsed)}회 소환`;
    subMsg = `신화 팰몬 보유 모드 — 아이템 ${result.summonsUsed}개 분배 결과`;
  } else {
    color = "var(--red)";
    headlineMsg = `😢 미획득`;
    subMsg = `구슬 ${fmt(result.summonsUsed)}개 모두 소진 — 친밀도 ${fmt(result.finalIntimacy)}/1200 에서 멈춤`;
  }

  // 친밀도 게이지 (Mode 1 only)
  let intimacyBar = "";
  if (!hasTarget) {
    const pct = Math.min(100, (result.finalIntimacy / 1200) * 100);
    intimacyBar = `
      <div style="margin:10px 0 6px;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:6px;">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-dim);margin-bottom:4px;">
          <span>친밀도 (${fmt(startIntimacy)} → ${fmt(result.finalIntimacy)})</span>
          <span><b style="color:${result.finalIntimacy >= 1200 ? 'var(--green)' : 'var(--amber)'};">${fmt(result.finalIntimacy)} / 1200</b></span>
        </div>
        <div style="background:#2a3441;border-radius:4px;height:8px;overflow:hidden;">
          <div style="background:${result.finalIntimacy >= 1200 ? 'var(--green)' : 'var(--amber)'};height:100%;width:${pct}%;transition:width 0.3s;"></div>
        </div>
      </div>`;
  }

  slot.innerHTML = `
    <div class="result-card strong" style="border-color:${color};">
      <div class="card-title" style="color:${color};text-align:center;">◆ 시뮬레이션 결과</div>
      <div class="big-number" style="color:${color};font-size:24px;">${headlineMsg}</div>
      <p class="txt-dim" style="font-size:12.5px;text-align:center;margin:0 0 8px;">${subMsg}</p>
      ${intimacyBar}
      <div class="tbl-wrap" style="margin-top:8px;"><table class="tbl">
        <tr><td class="label">소환 횟수</td><td class="value amber"><b>${fmt(result.summonsUsed)}회</b></td></tr>
        <tr><td class="label">남은 구슬</td><td class="value">${fmt(result.currencyRemain)}개</td></tr>
      </table></div>
      <h4 style="font-size:12.5px;margin:12px 0 4px;color:var(--text-dim);">📋 받은 아이템</h4>
      <div class="tbl-wrap"><table class="tbl">
        <thead><tr>
          <th style="text-align:left;">아이템</th>
          <th>횟수</th>
          <th>총 갯수</th>
        </tr></thead>
        <tbody>${itemRows.length > 0 ? itemRows.join("") : `<tr><td colspan="3" style="text-align:center;color:var(--text-dim);padding:18px 0;">아무 것도 못 받았습니다 🥲</td></tr>`}</tbody>
      </table></div>
      <p style="margin:14px 0 0;padding:10px 12px;background:rgba(248,113,113,0.1);border-left:4px solid var(--red);border-radius:6px;font-size:12.5px;line-height:1.5;color:var(--red);text-align:left;">
        ⚠️ <b>항상 랜덤한 결과입니다. 너무 믿지 마세요.</b>
      </p>
    </div>`;
}

function buildFruitBoxTab() {
  if (!$("fruitbox-count")) return;
  // 초기 결과창 (안내)
  renderFruitBoxIdle();

  // 확인하기 버튼
  $("fruitbox-roll").addEventListener("click", () => {
    const n = Math.max(0, parseInt($("fruitbox-count").value || 0));
    if (n <= 0) { renderFruitBoxIdle(); return; }
    const counts = rollFruitBoxes(n);
    renderFruitBoxResult(n, counts);
  });

  // 확률표 토글
  if ($("fruitbox-prob-toggle")) {
    $("fruitbox-prob-toggle").addEventListener("click", () => {
      const tbl = $("fruitbox-prob-table");
      const btn = $("fruitbox-prob-toggle");
      if (!tbl) return;
      const isHidden = tbl.style.display === "none";
      tbl.style.display = isHidden ? "block" : "none";
      btn.textContent = isHidden ? "📊 확률표 숨기기" : "📊 확률표 보기";
    });
  }
}

function rollFruitBoxes(n) {
  // n개 상자 → 각 row 별로 실제 굴린 횟수 카운트
  const counts = FRUITBOX_DROPS.map(() => 0);
  for (let i = 0; i < n; i++) {
    let r = Math.floor(Math.random() * FRUITBOX_TOTAL_WEIGHT);
    for (let j = 0; j < FRUITBOX_DROPS.length; j++) {
      r -= FRUITBOX_DROPS[j].weight;
      if (r < 0) { counts[j]++; break; }
    }
  }
  return counts;
}

function renderFruitBoxIdle() {
  const slot = $("fruitbox-result-slot");
  if (!slot) return;
  slot.innerHTML = `
    <div class="result-card" style="text-align:center;">
      <div class="card-title" style="color:var(--text-dim);">◆ 시뮬레이션 결과</div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:140px;">
        <p class="txt-dim" style="margin:0;font-size:13.5px;line-height:1.9;">
          🌰 보유 수량을 입력하고<br>
          ✅ <b>확인하기</b> 버튼을 눌러주세요.
        </p>
      </div>
    </div>`;
}

// ════════════════════════════════════════════════════════════════
// 🎁 미스테리박스 시뮬레이터
// ════════════════════════════════════════════════════════════════
// 가중치 base = 10000 (각 확률 × 100)
// 합계: 2*200 + 25 + 10 + 1 + 10 + 100 + 10 + 5*100 + 250 + 3*2898 = 10000 ✓
const MYSTERYBOX_DROPS = [
  { label: "🧭 보물찾기 나침반",       qty: 1,    weight: 200,  pct: 2.00  },
  { label: "✈️ 비행선 갱신권",         qty: 1,    weight: 200,  pct: 2.00  },
  { label: "🥚 팰몬 알",                qty: 1,    weight: 25,   pct: 0.25  },
  { label: "🟡 UR 팰몬 만능 증표",     qty: 1,    weight: 10,   pct: 0.10, color: "var(--amber)" },
  { label: "💎 다이아 (5,000)",         qty: 5000, weight: 1,    pct: 0.01, color: "var(--purple)" },
  { label: "💎 다이아 (50)",            qty: 50,   weight: 10,   pct: 0.10  },
  { label: "💎 다이아 (10)",            qty: 10,   weight: 100,  pct: 1.00  },
  { label: "🗿 화려한 조각상 보물상자", qty: 1,    weight: 10,   pct: 0.10  },
  { label: "⚡ 5분 일반 가속",          qty: 5,    weight: 100,  pct: 1.00  },
  { label: "🏗️ 5분 건설 가속",         qty: 5,    weight: 100,  pct: 1.00  },
  { label: "🔬 5분 연구 가속",          qty: 5,    weight: 100,  pct: 1.00  },
  { label: "⚔️ 5분 훈련 가속",         qty: 5,    weight: 100,  pct: 1.00  },
  { label: "🩹 5분 의료 가속",          qty: 5,    weight: 100,  pct: 1.00  },
  { label: "💠 강화 결정(소)",          qty: 100,  weight: 250,  pct: 2.50  },
  { label: "🪵 10K 목판 보물상자",      qty: 1,    weight: 2898, pct: 28.98 },
  { label: "⚙️ 10K 강철 보물상자",      qty: 1,    weight: 2898, pct: 28.98 },
  { label: "🪙 10K 골드 보물상자",      qty: 1,    weight: 2898, pct: 28.98 },
];
const MYSTERYBOX_TOTAL_WEIGHT = MYSTERYBOX_DROPS.reduce((s, d) => s + d.weight, 0);

function buildMysteryBoxTab() {
  if (!$("mysterybox-count")) return;
  renderMysteryBoxIdle();

  $("mysterybox-roll").addEventListener("click", () => {
    const n = Math.max(0, parseInt($("mysterybox-count").value || 0));
    if (n <= 0) { renderMysteryBoxIdle(); return; }
    const counts = rollMysteryBoxes(n);
    renderMysteryBoxResult(n, counts);
  });

  if ($("mysterybox-prob-toggle")) {
    $("mysterybox-prob-toggle").addEventListener("click", () => {
      const tbl = $("mysterybox-prob-table");
      const btn = $("mysterybox-prob-toggle");
      if (!tbl) return;
      const isHidden = tbl.style.display === "none";
      tbl.style.display = isHidden ? "block" : "none";
      btn.textContent = isHidden ? "📊 확률표 숨기기" : "📊 확률표 보기";
    });
  }
}

function rollMysteryBoxes(n) {
  const counts = MYSTERYBOX_DROPS.map(() => 0);
  for (let i = 0; i < n; i++) {
    let r = Math.floor(Math.random() * MYSTERYBOX_TOTAL_WEIGHT);
    for (let j = 0; j < MYSTERYBOX_DROPS.length; j++) {
      r -= MYSTERYBOX_DROPS[j].weight;
      if (r < 0) { counts[j]++; break; }
    }
  }
  return counts;
}

function renderMysteryBoxIdle() {
  const slot = $("mysterybox-result-slot");
  if (!slot) return;
  slot.innerHTML = `
    <div class="result-card" style="text-align:center;">
      <div class="card-title" style="color:var(--text-dim);">◆ 시뮬레이션 결과</div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:140px;">
        <p class="txt-dim" style="margin:0;font-size:13.5px;line-height:1.9;">
          🎁 보유 수량을 입력하고<br>
          ✅ <b>확인하기</b> 버튼을 눌러주세요.
        </p>
      </div>
    </div>`;
}

function renderMysteryBoxResult(n, rowCounts) {
  const slot = $("mysterybox-result-slot");
  if (!slot) return;

  // 받은 아이템만 표시 (0회 받은 건 숨김) — 받은 횟수 많은 순으로 정렬
  const got = [];
  rowCounts.forEach((c, i) => {
    if (c > 0) got.push({ ...MYSTERYBOX_DROPS[i], count: c, total: c * MYSTERYBOX_DROPS[i].qty });
  });
  got.sort((a, b) => b.count - a.count);

  let rows = "";
  if (got.length === 0) {
    rows = `<tr><td colspan="3" style="text-align:center;color:var(--text-dim);padding:18px 0;">아무 것도 못 받았습니다 🥲</td></tr>`;
  } else {
    for (const g of got) {
      const c = g.color || "var(--text)";
      rows += `<tr>
        <td><b style="color:${c};">${g.label}</b></td>
        <td class="value">${fmt(g.count)}회</td>
        <td class="value amber"><b>${fmt(g.total)}개</b></td>
      </tr>`;
    }
  }

  slot.innerHTML = `
    <div class="result-card strong" style="border-color:var(--amber);">
      <div class="card-title" style="color:var(--amber);text-align:center;">◆ 시뮬레이션 결과 (${fmt(n)}상자 개봉)</div>
      <div class="tbl-wrap" style="margin-top:8px;"><table class="tbl">
        <thead><tr>
          <th style="text-align:left;">아이템</th>
          <th>받은 횟수</th>
          <th>총 갯수</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p style="margin:14px 0 0;padding:10px 12px;background:rgba(248,113,113,0.1);border-left:4px solid var(--red);border-radius:6px;font-size:12.5px;line-height:1.5;color:var(--red);text-align:left;">
        ⚠️ <b>항상 랜덤한 결과입니다. 너무 믿지 마세요.</b>
      </p>
    </div>`;
}

// ════════════════════════════════════════════════════════════════
// 🪖 개선장군 보급 시뮬레이터
// ════════════════════════════════════════════════════════════════
// 가중치 base = 10000 (각 확률 × 100), 합계 10001 (반올림 오차 0.01%)
const SUPPLY_DROPS = [
  { label: "🟡 UR 팰몬 만능 증표",     qty: 1,     weight: 100,  pct: 1.00,  color: "var(--amber)" },
  { label: "🥚 팰몬 알",                qty: 10,    weight: 10,   pct: 0.10 },
  { label: "🥚 팰몬 알",                qty: 1,     weight: 150,  pct: 1.50 },
  { label: "💎 다이아 (10,000)",        qty: 10000, weight: 1,    pct: 0.01, color: "var(--purple)" },
  { label: "💎 다이아 (500)",           qty: 500,   weight: 10,   pct: 0.10, color: "var(--purple)" },
  { label: "💎 다이아 (50)",            qty: 50,    weight: 250,  pct: 2.50 },
  { label: "💎 다이아 (10)",            qty: 10,    weight: 1000, pct: 10.00 },
  { label: "🎖️ 개선 훈장 (1,000)",      qty: 1000,  weight: 8,    pct: 0.08 },
  { label: "🎖️ 개선 훈장 (200)",        qty: 200,   weight: 10,   pct: 0.10 },
  { label: "🎖️ 개선 훈장 (10)",         qty: 10,    weight: 500,  pct: 5.00 },
  { label: "🗿 화려한 조각상 보물상자", qty: 1,     weight: 5,    pct: 0.05 },
  { label: "💠 강화 결정(소)",          qty: 200,   weight: 500,  pct: 5.00 },
  { label: "⚡ 5분 일반 가속",          qty: 5,     weight: 100,  pct: 1.00 },
  { label: "🏗️ 5분 건설 가속",         qty: 5,     weight: 100,  pct: 1.00 },
  { label: "🩹 5분 의료 가속",          qty: 5,     weight: 100,  pct: 1.00 },
  { label: "🔬 5분 연구 가속",          qty: 5,     weight: 100,  pct: 1.00 },
  { label: "⚔️ 5분 훈련 가속",         qty: 5,     weight: 100,  pct: 1.00 },
  { label: "🪵 목판 레벨 보물상자",     qty: 1,     weight: 2319, pct: 23.19 },
  { label: "⚙️ 강철 레벨 보물상자",     qty: 1,     weight: 2319, pct: 23.19 },
  { label: "🪙 골드 레벨 보물상자",     qty: 1,     weight: 2319, pct: 23.19 },
];
const SUPPLY_TOTAL_WEIGHT = SUPPLY_DROPS.reduce((s, d) => s + d.weight, 0);

function buildSupplyTab() {
  if (!$("supply-count")) return;
  renderSupplyIdle();

  $("supply-roll").addEventListener("click", () => {
    const n = Math.max(0, parseInt($("supply-count").value || 0));
    if (n <= 0) { renderSupplyIdle(); return; }
    const counts = rollSupplyBoxes(n);
    renderSupplyResult(n, counts);
  });

  if ($("supply-prob-toggle")) {
    $("supply-prob-toggle").addEventListener("click", () => {
      const tbl = $("supply-prob-table");
      const btn = $("supply-prob-toggle");
      if (!tbl) return;
      const isHidden = tbl.style.display === "none";
      tbl.style.display = isHidden ? "block" : "none";
      btn.textContent = isHidden ? "📊 확률표 숨기기" : "📊 확률표 보기";
    });
  }
}

function rollSupplyBoxes(n) {
  const counts = SUPPLY_DROPS.map(() => 0);
  for (let i = 0; i < n; i++) {
    let r = Math.floor(Math.random() * SUPPLY_TOTAL_WEIGHT);
    for (let j = 0; j < SUPPLY_DROPS.length; j++) {
      r -= SUPPLY_DROPS[j].weight;
      if (r < 0) { counts[j]++; break; }
    }
  }
  return counts;
}

function renderSupplyIdle() {
  const slot = $("supply-result-slot");
  if (!slot) return;
  slot.innerHTML = `
    <div class="result-card" style="text-align:center;">
      <div class="card-title" style="color:var(--text-dim);">◆ 시뮬레이션 결과</div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:140px;">
        <p class="txt-dim" style="margin:0;font-size:13.5px;line-height:1.9;">
          🪖 보유 수량을 입력하고<br>
          ✅ <b>확인하기</b> 버튼을 눌러주세요.
        </p>
      </div>
    </div>`;
}

function renderSupplyResult(n, rowCounts) {
  const slot = $("supply-result-slot");
  if (!slot) return;

  const got = [];
  rowCounts.forEach((c, i) => {
    if (c > 0) got.push({ ...SUPPLY_DROPS[i], count: c, total: c * SUPPLY_DROPS[i].qty });
  });
  got.sort((a, b) => b.count - a.count);

  let rows = "";
  if (got.length === 0) {
    rows = `<tr><td colspan="3" style="text-align:center;color:var(--text-dim);padding:18px 0;">아무 것도 못 받았습니다 🥲</td></tr>`;
  } else {
    for (const g of got) {
      const c = g.color || "var(--text)";
      rows += `<tr>
        <td><b style="color:${c};">${g.label}</b></td>
        <td class="value">${fmt(g.count)}회</td>
        <td class="value amber"><b>${fmt(g.total)}개</b></td>
      </tr>`;
    }
  }

  slot.innerHTML = `
    <div class="result-card strong" style="border-color:var(--amber);">
      <div class="card-title" style="color:var(--amber);text-align:center;">◆ 시뮬레이션 결과 (${fmt(n)}상자 개봉)</div>
      <div class="tbl-wrap" style="margin-top:8px;"><table class="tbl">
        <thead><tr>
          <th style="text-align:left;">아이템</th>
          <th>받은 횟수</th>
          <th>총 갯수</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p style="margin:14px 0 0;padding:10px 12px;background:rgba(248,113,113,0.1);border-left:4px solid var(--red);border-radius:6px;font-size:12.5px;line-height:1.5;color:var(--red);text-align:left;">
        ⚠️ <b>항상 랜덤한 결과입니다. 너무 믿지 마세요.</b>
      </p>
    </div>`;
}

// ════════════════════════════════════════════════════════════════
// 🦅 이글아이 보물상자 시뮬레이터
// ════════════════════════════════════════════════════════════════
// 가중치 base = 10000 (3.35% → 335, 2.79% → 279, 41.9% → 4190)
// 합계: 4×335 + 279 + 2×4190 = 1340 + 279 + 8380 = 9999 (99.99%)
const EAGLEBOX_DROPS = [
  { label: "💧 물의 조각상 정수",      qty: 1,   weight: 335,  pct: 3.35  },
  { label: "🔥 불의 조각상 정수",      qty: 1,   weight: 335,  pct: 3.35  },
  { label: "🪨 바위의 조각상 정수",    qty: 1,   weight: 335,  pct: 3.35  },
  { label: "⚡ 전기의 조각상 정수",    qty: 1,   weight: 335,  pct: 3.35  },
  { label: "🟡 UR 팰몬 만능 증표",    qty: 1,   weight: 279,  pct: 2.79, color: "var(--amber)" },
  { label: "💠 강화 결정(소)",         qty: 100, weight: 4190, pct: 41.90 },
  { label: "🎯 10 AP",                 qty: 1,   weight: 4190, pct: 41.90 },
];
const EAGLEBOX_TOTAL_WEIGHT = EAGLEBOX_DROPS.reduce((s, d) => s + d.weight, 0);

function buildEagleBoxTab() {
  if (!$("eaglebox-count")) return;
  renderEagleBoxIdle();

  $("eaglebox-roll").addEventListener("click", () => {
    const n = Math.max(0, parseInt($("eaglebox-count").value || 0));
    if (n <= 0) { renderEagleBoxIdle(); return; }
    const counts = rollEagleBoxes(n);
    renderEagleBoxResult(n, counts);
  });

  if ($("eaglebox-prob-toggle")) {
    $("eaglebox-prob-toggle").addEventListener("click", () => {
      const tbl = $("eaglebox-prob-table");
      const btn = $("eaglebox-prob-toggle");
      if (!tbl) return;
      const isHidden = tbl.style.display === "none";
      tbl.style.display = isHidden ? "block" : "none";
      btn.textContent = isHidden ? "📊 확률표 숨기기" : "📊 확률표 보기";
    });
  }
}

function rollEagleBoxes(n) {
  const counts = EAGLEBOX_DROPS.map(() => 0);
  for (let i = 0; i < n; i++) {
    let r = Math.floor(Math.random() * EAGLEBOX_TOTAL_WEIGHT);
    for (let j = 0; j < EAGLEBOX_DROPS.length; j++) {
      r -= EAGLEBOX_DROPS[j].weight;
      if (r < 0) { counts[j]++; break; }
    }
  }
  return counts;
}

function renderEagleBoxIdle() {
  const slot = $("eaglebox-result-slot");
  if (!slot) return;
  slot.innerHTML = `
    <div class="result-card" style="text-align:center;">
      <div class="card-title" style="color:var(--text-dim);">◆ 시뮬레이션 결과</div>
      <div style="flex:1;display:flex;align-items:center;justify-content:center;min-height:140px;">
        <p class="txt-dim" style="margin:0;font-size:13.5px;line-height:1.9;">
          🦅 보유 수량을 입력하고<br>
          ✅ <b>확인하기</b> 버튼을 눌러주세요.
        </p>
      </div>
    </div>`;
}

function renderEagleBoxResult(n, rowCounts) {
  const slot = $("eaglebox-result-slot");
  if (!slot) return;

  const got = [];
  rowCounts.forEach((c, i) => {
    if (c > 0) got.push({ ...EAGLEBOX_DROPS[i], count: c, total: c * EAGLEBOX_DROPS[i].qty });
  });
  got.sort((a, b) => b.count - a.count);

  let rows = "";
  if (got.length === 0) {
    rows = `<tr><td colspan="3" style="text-align:center;color:var(--text-dim);padding:18px 0;">아무 것도 못 받았습니다 🥲</td></tr>`;
  } else {
    for (const g of got) {
      const c = g.color || "var(--text)";
      rows += `<tr>
        <td><b style="color:${c};">${g.label}</b></td>
        <td class="value">${fmt(g.count)}회</td>
        <td class="value amber"><b>${fmt(g.total)}개</b></td>
      </tr>`;
    }
  }

  slot.innerHTML = `
    <div class="result-card strong" style="border-color:var(--amber);">
      <div class="card-title" style="color:var(--amber);text-align:center;">◆ 시뮬레이션 결과 (${fmt(n)}상자 개봉)</div>
      <div class="tbl-wrap" style="margin-top:8px;"><table class="tbl">
        <thead><tr>
          <th style="text-align:left;">아이템</th>
          <th>받은 횟수</th>
          <th>총 갯수</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p style="margin:14px 0 0;padding:10px 12px;background:rgba(248,113,113,0.1);border-left:4px solid var(--red);border-radius:6px;font-size:12.5px;line-height:1.5;color:var(--red);text-align:left;">
        ⚠️ <b>항상 랜덤한 결과입니다. 너무 믿지 마세요.</b>
      </p>
    </div>`;
}

function renderFruitBoxResult(n, rowCounts) {
  const slot = $("fruitbox-result-slot");
  if (!slot) return;

  // 등급별 합계
  const tierSum = { 레전드: 0, 에픽: 0, 레어: 0 };
  rowCounts.forEach((c, i) => {
    const d = FRUITBOX_DROPS[i];
    tierSum[d.tier] += c * d.qty;
  });

  const tierColor = { 레전드: "var(--amber)", 에픽: "var(--purple)", 레어: "var(--blue)" };
  const tierEmoji = { 레전드: "🟡", 에픽: "🟣", 레어: "🔵" };
  const tierImg = {
    레전드: "fruit_ur.png",
    에픽:   "fruit_ssr.png",
    레어:   "fruit_sr.png",
  };

  // 3행 (UR/SSR/SR) — 이미지 + 갯수
  let rows = "";
  for (const t of ["레전드", "에픽", "레어"]) {
    rows += `
      <div class="fruit-result-row" style="display:flex;align-items:center;gap:14px;padding:12px 6px;border-top:1px solid #2a3441;">
        <img src="${tierImg[t]}" alt="${t}" class="fruit-result-img" onerror="this.style.display='none';this.nextElementSibling.style.display='inline-flex';">
        <span class="fruit-result-img-fallback" style="display:none;width:56px;height:56px;align-items:center;justify-content:center;font-size:32px;background:rgba(255,255,255,0.04);border-radius:8px;flex-shrink:0;">${tierEmoji[t]}</span>
        <div style="flex:1;min-width:0;">
          <div style="color:${tierColor[t]};font-weight:800;font-size:14px;">${tierEmoji[t]} ${t} 스킬 열매</div>
        </div>
        <div style="color:${tierColor[t]};font-weight:800;font-size:22px;white-space:nowrap;">${fmt(tierSum[t])}<span style="font-size:13px;opacity:0.85;margin-left:2px;">개</span></div>
      </div>`;
  }

  slot.innerHTML = `
    <div class="result-card strong" style="border-color:var(--amber);">
      <div class="card-title" style="color:var(--amber);text-align:center;">◆ 시뮬레이션 결과 (${fmt(n)}상자 개봉)</div>
      <div style="margin-top:8px;">${rows}</div>
      <p style="margin:14px 0 0;padding:10px 12px;background:rgba(248,113,113,0.1);border-left:4px solid var(--red);border-radius:6px;font-size:12.5px;line-height:1.5;color:var(--red);text-align:left;">
        ⚠️ <b>항상 랜덤한 결과입니다. 너무 믿지 마세요.</b>
      </p>
    </div>`;
}

// ════════════════════════════════════════════════════════════════
// 🔮 에너지 구슬 계산기
// ════════════════════════════════════════════════════════════════
// 각 소단계당 에너지 구슬 필요량 (10번 강화 = 표시값)
const ENERGY_STAGES = [
  // 진화 1단계 (4 sub-steps) — 30,000
  { id: "evo1-1", group: "evo1", label: "진화 1단계 1번", cost: 6000  },
  { id: "evo1-2", group: "evo1", label: "진화 1단계 2번", cost: 7000  },
  { id: "evo1-3", group: "evo1", label: "진화 1단계 3번", cost: 8000  },
  { id: "evo1-4", group: "evo1", label: "진화 1단계 4번", cost: 9000  },
  // 진화 2단계 (6 sub-steps) — 60,000
  { id: "evo2-1", group: "evo2", label: "진화 2단계 1번", cost: 9000  },
  { id: "evo2-2", group: "evo2", label: "진화 2단계 2번", cost: 9000  },
  { id: "evo2-3", group: "evo2", label: "진화 2단계 3번", cost: 10000 },
  { id: "evo2-4", group: "evo2", label: "진화 2단계 4번", cost: 10000 },
  { id: "evo2-5", group: "evo2", label: "진화 2단계 5번", cost: 11000 },
  { id: "evo2-6", group: "evo2", label: "진화 2단계 6번", cost: 11000 },
  // 진화 3단계 (6 sub-steps) — 90,000
  { id: "evo3-1", group: "evo3", label: "진화 3단계 1번", cost: 12000 },
  { id: "evo3-2", group: "evo3", label: "진화 3단계 2번", cost: 13000 },
  { id: "evo3-3", group: "evo3", label: "진화 3단계 3번", cost: 14000 },
  { id: "evo3-4", group: "evo3", label: "진화 3단계 4번", cost: 15000 },
  { id: "evo3-5", group: "evo3", label: "진화 3단계 5번", cost: 17000 },
  { id: "evo3-6", group: "evo3", label: "진화 3단계 6번", cost: 19000 },
  // 진화 4단계 (6 sub-steps) — 220,000
  { id: "evo4-1", group: "evo4", label: "진화 4단계 1번", cost: 22000 },
  { id: "evo4-2", group: "evo4", label: "진화 4단계 2번", cost: 26000 },
  { id: "evo4-3", group: "evo4", label: "진화 4단계 3번", cost: 30000 },
  { id: "evo4-4", group: "evo4", label: "진화 4단계 4번", cost: 38000 },
  { id: "evo4-5", group: "evo4", label: "진화 4단계 5번", cost: 46000 },
  { id: "evo4-6", group: "evo4", label: "진화 4단계 6번", cost: 58000 },
  // 메가진화 5단계 (3 sub-steps) — 30,000
  { id: "mega5-1", group: "mega5", label: "메가진화 5단계 1번", cost: 9000  },
  { id: "mega5-2", group: "mega5", label: "메가진화 5단계 2번", cost: 10000 },
  { id: "mega5-3", group: "mega5", label: "메가진화 5단계 3번", cost: 11000 },
  // 메가진화 6단계 (5 sub-steps) — 60,000
  { id: "mega6-1", group: "mega6", label: "메가진화 6단계 1번", cost: 11000 },
  { id: "mega6-2", group: "mega6", label: "메가진화 6단계 2번", cost: 11500 },
  { id: "mega6-3", group: "mega6", label: "메가진화 6단계 3번", cost: 12000 },
  { id: "mega6-4", group: "mega6", label: "메가진화 6단계 4번", cost: 12500 },
  { id: "mega6-5", group: "mega6", label: "메가진화 6단계 5번", cost: 13000 },
  // 메가진화 7단계 (6 sub-steps) — 90,000
  { id: "mega7-1", group: "mega7", label: "메가진화 7단계 1번", cost: 13000 },
  { id: "mega7-2", group: "mega7", label: "메가진화 7단계 2번", cost: 13500 },
  { id: "mega7-3", group: "mega7", label: "메가진화 7단계 3번", cost: 14000 },
  { id: "mega7-4", group: "mega7", label: "메가진화 7단계 4번", cost: 15000 },
  { id: "mega7-5", group: "mega7", label: "메가진화 7단계 5번", cost: 16500 },
  { id: "mega7-6", group: "mega7", label: "메가진화 7단계 6번", cost: 18000 },
  // 메가진화 8단계 (5 sub-steps) — 162,000
  { id: "mega8-1", group: "mega8", label: "메가진화 8단계 1번", cost: 22000 },
  { id: "mega8-2", group: "mega8", label: "메가진화 8단계 2번", cost: 26000 },
  { id: "mega8-3", group: "mega8", label: "메가진화 8단계 3번", cost: 30000 },
  { id: "mega8-4", group: "mega8", label: "메가진화 8단계 4번", cost: 38000 },
  { id: "mega8-5", group: "mega8", label: "메가진화 8단계 5번", cost: 46000 },
  // 메가 스킬해금 — 58,000
  { id: "skill",   group: "skill", label: "메가 스킬해금", cost: 58000 },
];
const ENERGY_TOTAL = ENERGY_STAGES.reduce((s, x) => s + x.cost, 0); // 800,000

function buildEnergyTab() {
  if (!$("energy-current") || !$("energy-target")) return;

  // 드롭다운 옵션 구성:
  // - 현재 단계: "처음 시작" (idx=-1) + 모든 단계 (idx=0~41)
  // - 목표 단계: 모든 단계 (idx=0~41)
  const curSel = $("energy-current");
  const tgtSel = $("energy-target");
  curSel.innerHTML = `<option value="-1">처음 시작 (진화 1-1 이전)</option>` +
    ENERGY_STAGES.map((s, i) => `<option value="${i}">${s.label} 완료</option>`).join("");
  tgtSel.innerHTML = ENERGY_STAGES.map((s, i) => `<option value="${i}">${s.label}</option>`).join("");

  // 기본값 — 처음 시작 → 메가 스킬해금
  curSel.value = "-1";
  tgtSel.value = String(ENERGY_STAGES.length - 1);

  curSel.addEventListener("change", updateEnergy);
  tgtSel.addEventListener("change", updateEnergy);
  if ($("energy-owned")) $("energy-owned").addEventListener("input", updateEnergy);

  // 메가진화 미지원 상태 동기화 (진화 정수 카드와 공유)
  if (typeof applyEnergyMegaSupport === "function") applyEnergyMegaSupport();
  updateEnergy();
}

function updateEnergy() {
  const curIdx = parseInt($("energy-current")?.value ?? -1);
  const tgtIdx = parseInt($("energy-target")?.value ?? 0);
  const owned  = parseInt($("energy-owned")?.value || 0);

  // 필요량 = sum from (curIdx+1) to tgtIdx inclusive
  let needed = 0;
  const detailRows = [];
  if (tgtIdx > curIdx) {
    for (let i = curIdx + 1; i <= tgtIdx && i < ENERGY_STAGES.length; i++) {
      needed += ENERGY_STAGES[i].cost;
    }
  }

  // 결과 카드
  const slot = $("energy-result-slot");
  if (!slot) return;

  if (tgtIdx <= curIdx) {
    slot.innerHTML = `
      <div class="result-card" style="border-color:var(--green);text-align:center;">
        <div class="card-title" style="color:var(--green);">◆ 필요 에너지 구슬</div>
        <div class="big-number" style="color:var(--green);">완료 ✓</div>
        <p class="txt-dim" style="font-size:13px;margin:10px 0 0;">목표 단계가 현재 단계보다 같거나 이전입니다. 추가 에너지 구슬 불필요.</p>
      </div>`;
    return;
  }

  const enough = owned >= needed;
  const color = enough ? "var(--green)" : "var(--red)";
  const shortage = Math.max(0, needed - owned);
  const surplus = Math.max(0, owned - needed);

  const bigDisplay = enough
    ? `<div class="big-number" style="color:${color};">${fmt(needed)}<span class="unit">개</span></div>`
    : `<div class="big-number" style="color:${color};font-size:42px;">부족 <span class="unit" style="color:${color};">${fmt(shortage)}개</span></div>`;

  const surplusRow = enough && owned > 0
    ? `<tr><td class="label">보유 - 필요 (남는 양)</td><td class="value amber">${fmt(surplus)}</td></tr>`
    : "";
  const shortageRow = (!enough)
    ? `<tr><td class="label" style="color:var(--red);font-weight:700;">부족 갯수</td><td class="value red"><b>${fmt(shortage)}</b></td></tr>`
    : "";

  const curLabel = curIdx < 0 ? "처음 시작" : `${ENERGY_STAGES[curIdx].label} 완료`;
  const tgtLabel = ENERGY_STAGES[tgtIdx].label;

  slot.innerHTML = `
    <div class="result-card strong" style="border-color:${color};">
      <div class="card-title" style="color:${color};text-align:center;">◆ 필요 에너지 구슬</div>
      <div style="text-align:center;"><span class="target-badge ${enough ? 'green' : 'red'}">🎯 ${curLabel} → ${tgtLabel}</span></div>
      ${bigDisplay}
      <div class="tbl-wrap"><table class="tbl">
        <tr><td class="label">필요 합계</td><td class="value amber"><b>${fmt(needed)}</b></td></tr>
        <tr><td class="label">보유</td><td class="value">${fmt(owned)}</td></tr>
        ${shortageRow}
        ${surplusRow}
      </table></div>
    </div>`;
}

function updatePalmon() {
  const baseLevel = parseInt($("palmon-camp").value);
  const maxLevel = Math.max(...Object.keys(DB.resource_boxes).map((x) => parseInt(x)));
  // 비교 캠프 — 사용자가 선택한 값 사용 (드롭다운). 없으면 폴백.
  const cmpSel = $("palmon-cmp-camp");
  let cmpLevel = cmpSel ? parseInt(cmpSel.value) : maxLevel;
  if (!cmpLevel || isNaN(cmpLevel)) cmpLevel = maxLevel;

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
    baseRows += `<tr><td class="label">${PALMON_RESOURCE_LABELS[rk]}</td><td class="value amber">${fmtWithKR(baseTotals[rk])}</td></tr>`;
  }
  const cardBase = `
    <div class="result-card strong" style="border-color:var(--amber);">
      <div class="card-title txt-amber">◆ 캠프 LV${baseLevel} 기준 합산</div>
      <div class="tbl-wrap"><table class="tbl">${baseRows}</table></div>
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
        <td class="value">${fmtWithKR(cmp)}</td>
        <td class="value ${cls}">${sign}${fmtWithKR(Math.abs(diff))}</td>
        <td class="value ${cls}">${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%</td>
      </tr>`;
    }
    cardCmp = `
      <div class="result-card" style="border-color:var(--blue);">
        <div class="card-title txt-blue">◆ 캠프 LV${cmpLevel} 기준 (LV${baseLevel} 대비 증가)</div>
        <div class="tbl-wrap"><table class="tbl">${cmpRows}</table></div>
      </div>`;
  }

  // 카드 3: 단위값
  const tbl = DB.resource_boxes[String(baseLevel)] || {};
  let unitRows = `<tr><th></th>`;
  for (const t of BOX_TIERS) unitRows += `<th class="tier tier-${t.toLowerCase()}">${t}</th>`;
  unitRows += `</tr>`;
  for (const rk of PALMON_RESOURCE_ORDER) {
    let r = `<td class="label">${PALMON_RESOURCE_LABELS[rk]}</td>`;
    for (const t of BOX_TIERS) {
      const unit = parseInt(tbl[t]?.[rk] || 0);
      r += `<td class="value tier-${t.toLowerCase()}">${fmt(unit)}</td>`;
    }
    unitRows += `<tr>${r}</tr>`;
  }
  const cardUnit = `
    <div class="result-card">
      <div class="card-title txt-dim">● 단위값 (상자 1개당, LV${baseLevel})</div>
      <div class="tbl-wrap"><table class="tbl">${unitRows}</table></div>
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
      <td class="value amber">= ${fmtWithKR(after)}</td>
    </tr>`;
  }
  // 🥚 경험치 — DB 의 resource_boxes[camp].{SR,SSR,UR}.palmon_xp 사용
  {
    const expCur = parseInt($("res-exp")?.value || 0);
    const expBoxes = {
      SR: parseInt($("box-exp-SR")?.value || 0),
      SSR: parseInt($("box-exp-SSR")?.value || 0),
      UR: parseInt($("box-exp-UR")?.value || 0),
    };
    const rb = DB.resource_boxes?.[String(camp)] || DB.resource_boxes?.["20"] || {};
    const perBox = {
      SR: rb.SR?.palmon_xp || 0,
      SSR: rb.SSR?.palmon_xp || 0,
      UR: rb.UR?.palmon_xp || 0,
    };
    const expFromBoxes = expBoxes.SR * perBox.SR + expBoxes.SSR * perBox.SSR + expBoxes.UR * perBox.UR;
    const expTotal = expCur + expFromBoxes;
    rows += `<tr>
      <td class="label" style="color:var(--blue);">🥚 경험치</td>
      <td class="value">${fmtWithKR(expCur)}</td>
      <td class="value">+ ${fmt(expFromBoxes)}</td>
      <td class="value" style="color:var(--blue);font-weight:800;">= ${fmtWithKR(expTotal)}</td>
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
        <div class="card-title txt-dim" style="margin-bottom:6px;font-size:14px;font-weight:700;">상자 전부 개봉 시 자원</div>
        ${resTable}
      </div>
      <div>
        <div class="card-title txt-dim" style="margin-bottom:6px;font-size:14px;font-weight:700;">가속권 종류별 총합</div>
        ${spdTable}
      </div>
    </div>`;
}

// ===== 탭 그룹 정의 (2차 메뉴) =====
const TAB_GROUPS = {
  "g-construction": {
    icon: "🏗️",
    label: "건설 관련",
    tabs: [
      { id: "t-result", icon: "🎯", label: "목표캠프계산기" },
    ],
  },
  "g-palmon": {
    icon: "💎",
    label: "팰몬 관련",
    tabs: [
      { id: "t-bead",     icon: "💎", label: "걸작 구슬" },
      { id: "t-essence",  icon: "✨", label: "팰몬 진화" },
      { id: "t-skillexp", icon: "🌰", label: "스킬열매 / 경험치" },
    ],
  },
  "g-resource": {
    icon: "💰",
    label: "자원 관련",
    tabs: [
      { id: "t-inventory", icon: "📦", label: "보유자원/가속 계산하기" },
      { id: "t-palmon",    icon: "📊", label: "캠프별 자원상자 비교" },
    ],
  },
  "g-boxsim": {
    icon: "📦",
    label: "시뮬레이터",
    tabs: [
      { id: "t-summon",      icon: "🌟", label: "오로라 소환" },
      { id: "t-megasummon",  icon: "🌌", label: "메가 팰몬 뽑기" },
      { id: "t-fruitbox",    icon: "🌰", label: "열매상자" },
      { id: "t-supply",      icon: "🪖", label: "개선장군 보급" },
      { id: "t-mysterybox",  icon: "🎁", label: "미스테리박스" },
      { id: "t-eaglebox",    icon: "🦅", label: "이글아이 보물상자" },
    ],
  },
};
// 탭 ID → 그룹 ID 역매핑
const TAB_TO_GROUP = (() => {
  const m = {};
  for (const [gid, g] of Object.entries(TAB_GROUPS)) {
    for (const t of g.tabs) m[t.id] = gid;
  }
  return m;
})();

// 서브 탭 바 렌더 + 활성화
function renderSubTabs(groupId, activeTabId) {
  const wrap = document.getElementById("sub-tabs-wrap");
  const bc = document.getElementById("sub-breadcrumb");
  const bar = document.getElementById("sub-tabs");
  if (!wrap || !bc || !bar) return;
  const g = TAB_GROUPS[groupId];
  if (!g) { wrap.style.display = "none"; return; }
  wrap.style.display = "";
  const activeTab = g.tabs.find((t) => t.id === activeTabId) || g.tabs[0];
  bc.innerHTML = `<span class="crumb-group">${g.icon} ${g.label}</span> <span class="crumb-sep">/</span> <span class="crumb-current">${activeTab.icon} ${activeTab.label}</span>`;
  bar.innerHTML = "";
  for (const t of g.tabs) {
    const b = document.createElement("button");
    b.className = "sub-tab" + (t.id === activeTab.id ? " active" : "");
    b.textContent = `${t.icon} ${t.label}`;
    b.addEventListener("click", () => activateTab(t.id));
    bar.appendChild(b);
  }
}

// ===== 탭 전환 =====
function activateTab(tabId) {
  // 1차 탭(그룹 포함)의 active 상태
  $$(".tab").forEach((t) => {
    t.classList.remove("active", "group-active");
    if (t.dataset.tab === tabId) t.classList.add("active");
  });
  // 패널 활성화
  $$(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === tabId));
  // 그룹 처리
  const groupId = TAB_TO_GROUP[tabId];
  if (groupId) {
    // 그룹 탭 버튼 강조
    const gbtn = document.querySelector(`.tab.tab-group[data-group="${groupId}"]`);
    if (gbtn) gbtn.classList.add("group-active");
    // 서브 탭 바 렌더
    renderSubTabs(groupId, tabId);
  } else {
    // 단독 탭 — 서브 탭 바 숨김
    const wrap = document.getElementById("sub-tabs-wrap");
    if (wrap) wrap.style.display = "none";
  }
  // 마지막으로 본 탭 기억
  try {
    localStorage.setItem("palmon_last_tab", tabId);
    // 그룹 내 마지막 탭도 기록
    if (groupId) localStorage.setItem(`palmon_last_tab_in_${groupId}`, tabId);
  } catch (_) {}
}

// 그룹 탭 클릭 핸들러 — 그룹의 마지막 본 탭 또는 첫 번째 탭으로 이동
function activateGroup(groupId) {
  const g = TAB_GROUPS[groupId];
  if (!g) return;
  // 그룹 내 마지막으로 본 탭 복원
  let target = null;
  try {
    const lastInGroup = localStorage.getItem(`palmon_last_tab_in_${groupId}`);
    if (lastInGroup && g.tabs.some((t) => t.id === lastInGroup)) target = lastInGroup;
  } catch {}
  if (!target) target = g.tabs[0].id;
  activateTab(target);
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
    target_owned_resources: getOwnedResources("tg-"),
    target_owned_resource_boxes: getOwnedBoxes("tg-"),
    target_owned_speedups: getOwnedSpeedups("tg-"),
    custom_boxes: getCustomBoxes(""),
    target_custom_boxes: getCustomBoxes("tg-"),
    time_buffs_selection: getTimeBuffsSelection(),
    resource_buffs_selection: getResourceBuffsSelection(),
    bead_total: parseInt($("bead-total").value || 0),
    bead_resets: Object.fromEntries(
      ["1성","2성","3성","4성","5성","6성","7성","8성","9성","10성"]
        .map((s, i) => [s, parseInt($(`bead-reset-${i+1}`).value || 0)])
    ),
    essence_palmon_type: __palmonType,
    essence_mega_support: __megaSupport,
    essence_promo_total: parseInt($("promo-total").value || 0),
    essence_evo_total: parseInt($("evo-total").value || 0),
    essence_evo_resets: {
      "진화 1단계": parseInt($("evo-reset-1").value || 0),
      "진화 2단계": parseInt($("evo-reset-2").value || 0),
      "진화 3단계": parseInt($("evo-reset-3").value || 0),
      "진화 4단계": parseInt($("evo-reset-4").value || 0),
    },
    essence_mega_evo_total: parseInt($("mega-evo-total")?.value || 0),
    essence_mega_evo_resets: {
      "진화 5단계": parseInt($("evo-reset-5")?.value || 0),
      "진화 6단계": parseInt($("evo-reset-6")?.value || 0),
      "진화 7단계": parseInt($("evo-reset-7")?.value || 0),
      "진화 8단계": parseInt($("evo-reset-8")?.value || 0),
    },
    palmon_res_camp: parseInt($("palmon-camp").value),
    palmon_res_boxes: Object.fromEntries(PALMON_RESOURCE_ORDER.map((rk) => [rk, Object.fromEntries(BOX_TIERS.map((t) => [t, parseInt($(`pbox-${rk}-${t}`).value || 0)]))])),
    // 🥚 경험치 (팰몬 경험치) 및 EXP 상자 (보유자원/가속 계산하기 탭)
    owned_exp: parseInt($("res-exp")?.value || 0),
    owned_exp_boxes: Object.fromEntries(BOX_TIERS.map((t) => [t, parseInt($(`box-exp-${t}`)?.value || 0)])),
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
  // 목표캠프계산기 탭의 자체 인벤토리 (tg- prefix) 복원
  // (이전 포맷 호환: target_* 키가 없으면 owned_*에서 가져옴 — 기존 저장 파일은 자동 동일 적용)
  const tgRes = p.target_owned_resources || p.owned_resources || {};
  const tgBoxes = p.target_owned_resource_boxes || p.owned_resource_boxes || {};
  const tgSpd = p.target_owned_speedups || p.owned_speedups || {};
  for (const k of RESOURCE_KEYS) if (tgRes[k] != null && $(`tg-res-${k}`)) $(`tg-res-${k}`).value = tgRes[k];
  for (const rk of RESOURCE_KEYS) for (const t of BOX_TIERS) {
    const v = tgBoxes[rk]?.[t];
    if (v != null && $(`tg-box-${rk}-${t}`)) $(`tg-box-${rk}-${t}`).value = v;
  }
  for (const grp of SPEEDUP_GROUPS) for (const k in (tgSpd[grp.key] || {})) {
    const id = `tg-spd-${grp.key}-${k}`;
    if ($(id)) $(id).value = tgSpd[grp.key][k];
  }
  // 커스텀 박스 복원 (양쪽 탭)
  const cBoxes = p.custom_boxes || {};
  const tgCBoxes = p.target_custom_boxes || p.custom_boxes || {};
  for (const t of BOX_TIERS) {
    if (cBoxes[t] != null && $(`box-custom-${t}`)) $(`box-custom-${t}`).value = cBoxes[t];
    if (tgCBoxes[t] != null && $(`tg-box-custom-${t}`)) $(`tg-box-custom-${t}`).value = tgCBoxes[t];
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
  // 구슬 1~10성 초기화 수량
  if (p.bead_resets) {
    const stars = ["1성","2성","3성","4성","5성","6성","7성","8성","9성","10성"];
    for (let i = 0; i < stars.length; i++) {
      const v = parseInt(p.bead_resets[stars[i]] || 0);
      const el = $(`bead-reset-${i+1}`);
      if (el) el.value = v;
    }
  }

  // 팰몬 타입 / 메가 지원 복원
  if (p.essence_palmon_type === "season" || p.essence_palmon_type === "regular") {
    __palmonType = p.essence_palmon_type;
  }
  if (typeof p.essence_mega_support === "boolean") {
    __megaSupport = p.essence_mega_support;
  }
  applyPalmonModeToDOM();

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
  const RESET_IDS = { "진화 1단계": "evo-reset-1", "진화 2단계": "evo-reset-2", "진화 3단계": "evo-reset-3", "진화 4단계": "evo-reset-4" };
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

  // 메가 진화석 + 초기화 (진화 5~8단계 = 메가) 복원
  if ($("mega-evo-total")) $("mega-evo-total").value = parseInt(p.essence_mega_evo_total || 0);
  const MEGA_RESET_IDS = { "진화 5단계": "evo-reset-5", "진화 6단계": "evo-reset-6", "진화 7단계": "evo-reset-7", "진화 8단계": "evo-reset-8" };
  if (p.essence_mega_evo_resets) {
    for (const stage in MEGA_RESET_IDS) {
      const el = $(MEGA_RESET_IDS[stage]);
      if (el) el.value = parseInt(p.essence_mega_evo_resets[stage] || 0);
    }
  }
  if (p.palmon_res_camp != null) $("palmon-camp").value = p.palmon_res_camp;
  for (const rk of PALMON_RESOURCE_ORDER) for (const t of BOX_TIERS) {
    const v = p.palmon_res_boxes?.[rk]?.[t];
    if (v != null) $(`pbox-${rk}-${t}`).value = v;
  }
  // 🥚 경험치 / EXP 상자 복원
  if (p.owned_exp != null && $("res-exp")) $("res-exp").value = parseInt(p.owned_exp || 0);
  if (p.owned_exp_boxes) {
    for (const t of BOX_TIERS) {
      const v = p.owned_exp_boxes[t];
      if (v != null && $(`box-exp-${t}`)) $(`box-exp-${t}`).value = parseInt(v || 0);
    }
  }

  updateInventorySummary();
  updateBead();
  updateEssence();
  updatePalmon();
  buildSkillExpTab();
  buildEnergyTab();
  buildSummonTab();
  buildFruitBoxTab();
  buildSupplyTab();
  buildMysteryBoxTab();
  buildEagleBoxTab();
  refreshAllKrHints();
}

// 커스텀 닉네임 입력 모달 — iOS Chrome 등에서 prompt() 가 차단되는 경우 대응
function askNickname(defaultValue = "") {
  return new Promise((resolve) => {
    // 기존 모달이 있으면 제거
    document.getElementById("__nickname-modal")?.remove();

    const overlay = document.createElement("div");
    overlay.id = "__nickname-modal";
    overlay.className = "nickname-modal-overlay";
    overlay.innerHTML = `
      <div class="nickname-modal">
        <div class="nickname-modal-title">💾 설정 저장</div>
        <div class="nickname-modal-desc">저장할 닉네임을 입력해주세요<br>
          <span class="nickname-modal-hint">파일명: <code>PAL_닉네임_오늘날짜.json</code></span>
        </div>
        <input type="text" id="__nickname-input" class="nickname-modal-input"
          maxlength="30" placeholder="예) 롱칠 / Python" autocomplete="off" autocapitalize="off"
          value="${(defaultValue || "").replace(/"/g, "&quot;")}">
        <div class="nickname-modal-actions">
          <button class="btn btn-ghost" id="__nickname-cancel">취소</button>
          <button class="btn btn-primary" id="__nickname-ok">저장</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    const input = overlay.querySelector("#__nickname-input");
    const okBtn = overlay.querySelector("#__nickname-ok");
    const cancelBtn = overlay.querySelector("#__nickname-cancel");

    const close = (val) => {
      overlay.remove();
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      resolve(val);
    };
    const onKey = (e) => {
      if (e.key === "Escape") close(null);
      if (e.key === "Enter") close(input.value);
    };
    document.addEventListener("keydown", onKey);
    okBtn.addEventListener("click", () => close(input.value));
    cancelBtn.addEventListener("click", () => close(null));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) close(null); });

    // 모바일/데스크탑 모두 자동 포커스 + 텍스트 선택
    setTimeout(() => {
      input.focus();
      try { input.select(); } catch (_) {}
    }, 50);
  });
}

async function saveSettings() {
  // 닉네임 — 커스텀 모달 사용 (iOS Chrome 등에서 prompt() 차단 회피)
  const storedNick = localStorage.getItem("palmon_nickname") || "";
  const input = await askNickname(storedNick);
  if (input === null) { toast("저장 취소됨"); return; }
  const nickname = input.trim().replace(/[\s/\\:*?"<>|]+/g, "_");
  if (!nickname) { toast("닉네임을 입력해주세요"); return; }
  localStorage.setItem("palmon_nickname", nickname);

  // 데이터 + 파일명
  const payload = buildSettingsPayload();
  payload._nickname = nickname;
  localStorage.setItem("palmon_settings", JSON.stringify(payload));

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, "0");
  const dd = String(today.getDate()).padStart(2, "0");
  const filename = `PAL_${nickname}_${yyyy}-${mm}-${dd}.json`;

  const jsonStr = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid;

  // 1차: File System Access API (데스크탑 Chrome/Edge) — 폴더 고정 가능
  if (!isMobile && window.showSaveFilePicker) {
    try {
      window._palmonDirHandle = window._palmonDirHandle || null;
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        startIn: window._palmonDirHandle || "downloads",
        types: [{ description: "Palmon Tool 설정", accept: { "application/json": [".json"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonStr);
      await writable.close();
      toast(`저장됨: ${filename}`);
      return;
    } catch (e) {
      if (e.name === "AbortError") { toast("저장 취소됨"); return; }
      console.warn("showSaveFilePicker 실패, 다음 방법 시도:", e);
    }
  }

  let attemptedShare = false;

  // 모바일 1순위: Web Share API — 사용자가 저장 위치 직접 선택 (Files, 드라이브, 카톡 등)
  // → 이렇게 하면 "파일을 못 찾는" 문제가 사라집니다
  if (isMobile) {
    try {
      const file = new File([blob], filename, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        attemptedShare = true;
        await navigator.share({ files: [file], title: filename, text: "Palmon Tool 설정" });
        toast(`✅ 저장 완료: ${filename}`);
        return;
      }
    } catch (e) {
      if (e.name === "AbortError") { toast("저장 취소됨"); return; }
      console.warn("Web Share 실패, 다운로드로 폴백:", e);
    }
  }

  // 2차: 일반 다운로드 — 위치 안내 메시지 포함
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      if (a.parentNode) a.parentNode.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1500);
    // 모바일 사용자에게 파일 위치 안내
    if (isIOS) {
      toast(`✅ 저장됨 — 파일 앱 > 다운로드`);
    } else if (isAndroid) {
      toast(`✅ 저장됨 — 내 파일 > Download`);
    } else {
      toast(`저장됨: ${filename}`);
    }
    return;
  } catch (e) {
    console.warn("다운로드 실패, 공유 시도:", e);
  }

  // 3차: Web Share API (위에서 시도 안 했을 때 마지막 시도)
  if (!attemptedShare) {
    try {
      const file = new File([blob], filename, { type: "application/json" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        attemptedShare = true;
        await navigator.share({ files: [file], title: filename, text: filename });
        toast(`공유 완료: ${filename}`);
        return;
      }
    } catch (e) {
      if (e.name === "AbortError") { toast("공유 취소됨"); return; }
      console.warn("Web Share 실패, 최종 폴백:", e);
    }
  }

  // 4차 최종 폴백: 새 탭에 열어서 사용자가 직접 저장 (iOS Safari 구버전)
  try {
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank");
    if (!w) {
      alert("저장 파일을 새 탭에서 열겠습니다.\n(파일을 길게 눌러 '다른 이름으로 저장' 해주세요)");
      location.href = url;
    } else {
      toast("새 탭에서 파일을 길게 눌러 저장해주세요");
    }
  } catch (e) {
    alert(
      "저장에 실패했습니다.\n" +
      "브라우저 설정에서 파일 다운로드 권한을 확인해주세요.\n\n" +
      "에러: " + (e.message || e) +
      (attemptedShare ? "\n(공유 시도 후 다운로드 실패)" : "")
    );
  }
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
// =====================================================
// 게시판 (Pantry API) — 다중 게시판 지원
// =====================================================
let CURRENT_BOARD_ID = "general";   // 현재 선택된 게시판
const BOARDS_META_BASKET = "palmon-boards-meta";
const PANTRY_BASKET_FOR = (boardId) => `palmon-board-${boardId}`;
const PANTRY_URL = (basket) => `https://getpantry.cloud/apiv1/pantry/${PANTRY_ID}/basket/${basket}`;

// ── 캐시 (속도 최적화) ─────────────────────────────────
// 1) 메모리 캐시: 짧은 시간(15초) 내 동일 요청은 fetch 안 함
// 2) localStorage 캐시: 페이지 새로고침 후에도 즉시 렌더 → 백그라운드 fetch
const BOARD_MEM_CACHE = {};   // basket → { data, t }
const BOARD_FETCH_TTL = 15000;  // 15초
const BOARD_INFLIGHT = {};    // basket → Promise (중복 요청 방지)
const LS_BOARDS_LIST = "palmon_cache_boards_list";
const LS_BOARD_POSTS = (id) => `palmon_cache_board_posts_${id}`;

function lsGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

function boardIsConfigured() {
  return !!(PANTRY_ID && PANTRY_ID.length > 10);
}

// 공통 GET — 메모리 캐시 + 중복 요청 합치기
async function boardFetchBasket(basket, { force = false } = {}) {
  const mem = BOARD_MEM_CACHE[basket];
  if (!force && mem && (Date.now() - mem.t < BOARD_FETCH_TTL)) {
    return mem.data;
  }
  if (BOARD_INFLIGHT[basket]) return BOARD_INFLIGHT[basket];
  const p = (async () => {
    const res = await fetch(PANTRY_URL(basket), { cache: "no-store" });
    if (res.status === 400 || res.status === 404) return { __empty: true };
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    BOARD_MEM_CACHE[basket] = { data, t: Date.now() };
    return data;
  })().finally(() => { delete BOARD_INFLIGHT[basket]; });
  BOARD_INFLIGHT[basket] = p;
  return p;
}

// 게시판 목록 (메타) 로드/저장
async function boardLoadList({ force = false } = {}) {
  if (!boardIsConfigured()) return null;
  try {
    const data = await boardFetchBasket(BOARDS_META_BASKET, { force });
    if (data.__empty) {
      const defaults = [{ id: "general", name: "자유 게시판", t: Date.now() }];
      await boardSaveList(defaults);
      return defaults;
    }
    const boards = Array.isArray(data.boards) ? data.boards : [];
    const out = boards.length > 0 ? boards : [{ id: "general", name: "자유 게시판", t: Date.now() }];
    lsSet(LS_BOARDS_LIST, out);
    return out;
  } catch (e) {
    console.error("게시판 목록 로드 실패:", e);
    return null;
  }
}
// 캐시(메모리/로컬)에서 즉시 — 없으면 null
function boardLoadListCached() {
  const mem = BOARD_MEM_CACHE[BOARDS_META_BASKET];
  if (mem && mem.data && !mem.data.__empty) {
    return Array.isArray(mem.data.boards) ? mem.data.boards : null;
  }
  return lsGet(LS_BOARDS_LIST);
}

async function boardSaveList(boards) {
  if (!boardIsConfigured()) throw new Error("PANTRY_ID 미설정");
  const res = await fetch(PANTRY_URL(BOARDS_META_BASKET), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ boards }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // 캐시 갱신
  BOARD_MEM_CACHE[BOARDS_META_BASKET] = { data: { boards }, t: Date.now() };
  lsSet(LS_BOARDS_LIST, boards);
}

// 현재 선택된 게시판의 글 로드/저장
async function boardLoadPosts({ force = false } = {}) {
  if (!boardIsConfigured()) return null;
  const basket = PANTRY_BASKET_FOR(CURRENT_BOARD_ID);
  try {
    const data = await boardFetchBasket(basket, { force });
    const posts = data.__empty ? [] : (Array.isArray(data.posts) ? data.posts : []);
    lsSet(LS_BOARD_POSTS(CURRENT_BOARD_ID), posts);
    return posts;
  } catch (e) {
    console.error("게시글 로드 실패:", e);
    return null;
  }
}
// 캐시에서 즉시 — 없으면 null
function boardLoadPostsCached() {
  const basket = PANTRY_BASKET_FOR(CURRENT_BOARD_ID);
  const mem = BOARD_MEM_CACHE[basket];
  if (mem && mem.data && !mem.data.__empty) {
    return Array.isArray(mem.data.posts) ? mem.data.posts : null;
  }
  return lsGet(LS_BOARD_POSTS(CURRENT_BOARD_ID));
}

async function boardSavePosts(posts) {
  if (!boardIsConfigured()) throw new Error("PANTRY_ID 미설정");
  const basket = PANTRY_BASKET_FOR(CURRENT_BOARD_ID);
  const res = await fetch(PANTRY_URL(basket), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ posts }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // 캐시 갱신
  BOARD_MEM_CACHE[basket] = { data: { posts }, t: Date.now() };
  lsSet(LS_BOARD_POSTS(CURRENT_BOARD_ID), posts);
}

// 게시판 생성
async function boardCreateNew() {
  const name = prompt("새 게시판 이름을 입력해주세요\n(예: 공략 / 거래 / 길드모집)");
  if (!name || !name.trim()) return;
  const trimmed = name.trim();
  if (trimmed.length > 20) { alert("게시판 이름은 20자 이하"); return; }
  const id = "b_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  try {
    const list = (await boardLoadList()) || [];
    list.push({ id, name: trimmed, t: Date.now() });
    await boardSaveList(list);
    CURRENT_BOARD_ID = id;
    localStorage.setItem("palmon_current_board", id);
    await boardRefreshList();
    boardRefresh();
    toast(`게시판 "${trimmed}" 생성됨`);
  } catch (e) {
    alert("생성 실패: " + (e.message || e));
  }
}

// 현재 게시판 삭제
async function boardDeleteCurrent() {
  const list = (await boardLoadList()) || [];
  const cur = list.find((b) => b.id === CURRENT_BOARD_ID);
  if (!cur) return;
  if (list.length <= 1) { alert("마지막 게시판은 삭제할 수 없습니다"); return; }
  if (!confirm(`"${cur.name}" 게시판과 그 안의 모든 글을 영구 삭제할까요?`)) return;
  try {
    // 메타에서 제거
    const newList = list.filter((b) => b.id !== CURRENT_BOARD_ID);
    await boardSaveList(newList);
    // 글 바스켓 삭제
    try {
      await fetch(PANTRY_URL(PANTRY_BASKET_FOR(CURRENT_BOARD_ID)), { method: "DELETE" });
    } catch (_) {}
    // 첫번째 게시판으로 전환
    CURRENT_BOARD_ID = newList[0].id;
    localStorage.setItem("palmon_current_board", CURRENT_BOARD_ID);
    await boardRefreshList();
    boardRefresh();
    toast(`"${cur.name}" 게시판 삭제됨`);
  } catch (e) {
    alert("삭제 실패: " + (e.message || e));
  }
}

// 게시판 정렬: 고정(pin) → pin 시각 DESC (최근 고정 먼저), 미고정 → 원래 순서
function boardSortForDisplay(list) {
  const arr = list.map((b, i) => ({ ...b, __idx: i }));
  arr.sort((a, b) => {
    const pa = a.pin || 0, pb = b.pin || 0;
    if (pa && pb) return pb - pa;  // 둘 다 고정 → 최근 고정 먼저
    if (pa) return -1;
    if (pb) return 1;
    return a.__idx - b.__idx;       // 둘 다 미고정 → 원래 순서
  });
  return arr;
}

// 게시판 카테고리 탭 — DOM 렌더 (고정된 게시판 먼저)
function boardRenderCatTabs(list) {
  const tabs = $("board-cat-tabs");
  if (!tabs) return;
  const sorted = boardSortForDisplay(list);
  tabs.innerHTML = sorted.map((b) => {
    const pinned = !!b.pin;
    const pinIcon = pinned ? `<span class="board-cat-pin" title="고정됨">📌</span>` : "";
    return `<button class="board-cat ${b.id === CURRENT_BOARD_ID ? "active" : ""} ${pinned ? "pinned" : ""}" data-id="${escapeHtml(b.id)}">${pinIcon}${escapeHtml(b.name)}</button>`;
  }).join("") + `<button class="board-cat board-cat-add" id="btn-board-create-inline">+</button>`;
  tabs.querySelectorAll(".board-cat").forEach((btn) => {
    if (btn.id === "btn-board-create-inline") {
      btn.addEventListener("click", boardCreateNew);
    } else {
      btn.addEventListener("click", () => {
        CURRENT_BOARD_ID = btn.dataset.id;
        localStorage.setItem("palmon_current_board", CURRENT_BOARD_ID);
        boardShowList();
      });
      // 우클릭 → 컨텍스트 메뉴 (고정/해제)
      btn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        CURRENT_BOARD_ID = btn.dataset.id;
        localStorage.setItem("palmon_current_board", CURRENT_BOARD_ID);
        boardTogglePinCurrent();
      });
    }
  });
}

// 현재 선택된 게시판 고정 / 해제
async function boardTogglePinCurrent() {
  try {
    const list = (await boardLoadList()) || [];
    const idx = list.findIndex((b) => b.id === CURRENT_BOARD_ID);
    if (idx < 0) { alert("게시판을 찾을 수 없습니다"); return; }
    const cur = list[idx];
    if (cur.pin) {
      delete cur.pin;
      toast(`"${cur.name}" 고정 해제됨`);
    } else {
      cur.pin = Date.now();   // 최근 고정이 가장 앞에 오도록 타임스탬프 기록
      toast(`"${cur.name}" 게시판 상단 고정됨 📌`);
    }
    await boardSaveList(list);
    await boardRefreshList({ force: true });
  } catch (e) {
    alert("고정 처리 실패: " + (e.message || e));
  }
}

// 게시판 카테고리 탭 갱신 — 캐시 즉시 + 백그라운드 갱신
async function boardRefreshList({ force = false } = {}) {
  // 1) 캐시가 있으면 즉시 렌더
  const cached = boardLoadListCached();
  if (cached) boardRenderCatTabs(cached);
  // 2) 백그라운드(또는 force)에서 fresh 로드
  const fresh = await boardLoadList({ force });
  if (fresh && JSON.stringify(fresh) !== JSON.stringify(cached)) {
    boardRenderCatTabs(fresh);
  }
}

// 뷰 전환 헬퍼 — 캐시 즉시 + 병렬 백그라운드 갱신
function boardShowList() {
  $("board-list-view").style.display = "";
  $("board-write-view").style.display = "none";
  $("board-detail-view").style.display = "none";
  // 카테고리 탭 + 글 목록 동시 갱신 (각자 캐시 즉시 표시 → 백그라운드 fetch)
  boardRefreshList();
  boardRefresh();
}
function boardShowWrite() {
  $("board-list-view").style.display = "none";
  $("board-write-view").style.display = "";
  $("board-detail-view").style.display = "none";
  // 서버/닉네임 자동 채움
  const ss = localStorage.getItem("palmon_board_server");
  const sn = localStorage.getItem("palmon_board_nick");
  if (ss && !$("board-server").value) $("board-server").value = ss;
  if (sn && !$("board-nickname").value) $("board-nickname").value = sn;
}
function boardShowDetail(post) {
  $("board-list-view").style.display = "none";
  $("board-write-view").style.display = "none";
  $("board-detail-view").style.display = "";
  boardRenderDetail(post);
  // 댓글 폼 서버/닉네임 자동 채움
  const ss = localStorage.getItem("palmon_board_server");
  const sn = localStorage.getItem("palmon_board_nick");
  if (ss && !$("comment-server").value) $("comment-server").value = ss;
  if (sn && !$("comment-nickname").value) $("comment-nickname").value = sn;
  // 조회수 증가 (이미 본 글은 스킵 — 브라우저 단위 중복 방지)
  boardIncrementView(post.id);
}

// 조회수 — 같은 사용자(브라우저)는 한 번만 카운트
const LS_BOARD_VIEWED = "palmon_board_viewed_posts";
function boardHasViewed(postId) {
  try {
    const arr = JSON.parse(localStorage.getItem(LS_BOARD_VIEWED) || "[]");
    return Array.isArray(arr) && arr.includes(postId);
  } catch { return false; }
}
function boardMarkViewed(postId) {
  try {
    let arr = JSON.parse(localStorage.getItem(LS_BOARD_VIEWED) || "[]");
    if (!Array.isArray(arr)) arr = [];
    if (!arr.includes(postId)) {
      arr.push(postId);
      // localStorage 크기 제어: 최근 500개만 유지
      if (arr.length > 500) arr = arr.slice(arr.length - 500);
      localStorage.setItem(LS_BOARD_VIEWED, JSON.stringify(arr));
    }
  } catch {}
}
async function boardIncrementView(postId) {
  if (!postId) return;
  if (boardHasViewed(postId)) return;       // 같은 사용자 → 무시
  boardMarkViewed(postId);                  // 먼저 마킹 (네트워크 실패해도 재시도 안 함)
  try {
    const posts = (await boardLoadPosts()) || [];
    const idx = posts.findIndex((p) => p.id === postId);
    if (idx < 0) return;
    posts[idx].v = (posts[idx].v || 0) + 1;
    await boardSavePosts(posts);
  } catch (e) {
    console.warn("조회수 증가 실패:", e);
  }
}

let CURRENT_POST_ID = null;

function boardRenderDetail(post) {
  CURRENT_POST_ID = post.id;
  const myId = boardGetAuthorId();
  const isMine = post.a === myId;
  const img = post.img
    ? `<div style="margin-top:14px;"><img class="board-post-img" src="${escapeHtml(post.img)}" alt="게시글 이미지" title="클릭하면 크게 보기" style="max-width:100%;max-height:600px;border-radius:8px;display:block;cursor:zoom-in;"></div>`
    : "";
  $("board-detail-content").innerHTML = `
    <div class="group-title">📄 게시글</div>
    <div class="board-detail-head">
      <span class="board-server">${escapeHtml(formatServer(post.server))}</span>
      <span class="board-nick">${escapeHtml(post.nick || "익명")}</span>
      ${isMine ? `<button class="btn btn-ghost board-del" data-id="${escapeHtml(post.id)}" style="padding:4px 10px;font-size:12px;margin-left:auto;">🗑️ 삭제</button>` : ""}
    </div>
    <div class="board-detail-title">${escapeHtml(post.title || "")}</div>
    <div class="board-detail-content-text">${escapeHtml(post.content || "").replace(/\n/g, "<br>")}</div>
    ${img}
    <div class="board-time-foot">${formatBoardTime(post.t)}</div>
  `;
  // 삭제 버튼 바인딩
  const delBtn = $("board-detail-content").querySelector(".board-del");
  if (delBtn) {
    delBtn.addEventListener("click", () => boardDeletePost(delBtn.dataset.id));
  }
  // 이미지 클릭 → 라이트박스
  const imgEl = $("board-detail-content").querySelector(".board-post-img");
  if (imgEl) {
    imgEl.addEventListener("click", () => boardOpenImageLightbox(post.img));
  }
  // 댓글 렌더
  boardRenderComments(post.comments || []);
}

// 이미지 라이트박스 — 클릭 시 화면 가득 확대해서 보기
function boardOpenImageLightbox(src) {
  if (!src) return;
  // 기존 오버레이가 있으면 제거 (중복 방지)
  document.getElementById("__board-lightbox")?.remove();

  const overlay = document.createElement("div");
  overlay.id = "__board-lightbox";
  overlay.className = "board-lightbox";
  overlay.innerHTML = `
    <button class="board-lightbox-close" type="button" title="닫기 (Esc)" aria-label="닫기">×</button>
    <div class="board-lightbox-hint">클릭/ESC: 닫기 · 드래그로 이동 · 휠/핀치: 확대</div>
    <img class="board-lightbox-img" src="${escapeHtml(src)}" alt="">
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const imgEl = overlay.querySelector(".board-lightbox-img");
  let scale = 1, tx = 0, ty = 0;
  let dragging = false, dragStartX = 0, dragStartY = 0, dragOrigTx = 0, dragOrigTy = 0;
  let lastTouchDist = 0;

  const applyTransform = () => {
    imgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  };

  // 닫기
  const close = () => {
    overlay.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  overlay.querySelector(".board-lightbox-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });

  // 휠 줌
  overlay.addEventListener("wheel", (e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.15 : 0.15;
    const newScale = Math.min(6, Math.max(1, scale + delta));
    if (newScale === 1) { tx = 0; ty = 0; }
    scale = newScale;
    applyTransform();
  }, { passive: false });

  // 더블 클릭 → 1.0 ↔ 2.5 토글
  imgEl.addEventListener("dblclick", (e) => {
    e.stopPropagation();
    if (scale > 1) { scale = 1; tx = 0; ty = 0; }
    else { scale = 2.5; }
    applyTransform();
  });

  // 드래그 (확대 상태에서 이동)
  imgEl.addEventListener("mousedown", (e) => {
    if (scale <= 1) return;
    dragging = true;
    dragStartX = e.clientX; dragStartY = e.clientY;
    dragOrigTx = tx; dragOrigTy = ty;
    imgEl.style.cursor = "grabbing";
    e.preventDefault();
  });
  window.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    tx = dragOrigTx + (e.clientX - dragStartX);
    ty = dragOrigTy + (e.clientY - dragStartY);
    applyTransform();
  });
  window.addEventListener("mouseup", () => { dragging = false; imgEl.style.cursor = ""; });

  // 모바일 핀치 줌
  imgEl.addEventListener("touchstart", (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastTouchDist = Math.hypot(dx, dy);
    } else if (e.touches.length === 1 && scale > 1) {
      dragging = true;
      dragStartX = e.touches[0].clientX;
      dragStartY = e.touches[0].clientY;
      dragOrigTx = tx; dragOrigTy = ty;
    }
  }, { passive: true });
  imgEl.addEventListener("touchmove", (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const d = Math.hypot(dx, dy);
      if (lastTouchDist) {
        const newScale = Math.min(6, Math.max(1, scale * (d / lastTouchDist)));
        if (newScale === 1) { tx = 0; ty = 0; }
        scale = newScale;
        applyTransform();
      }
      lastTouchDist = d;
      e.preventDefault();
    } else if (e.touches.length === 1 && dragging) {
      tx = dragOrigTx + (e.touches[0].clientX - dragStartX);
      ty = dragOrigTy + (e.touches[0].clientY - dragStartY);
      applyTransform();
      e.preventDefault();
    }
  }, { passive: false });
  imgEl.addEventListener("touchend", () => { dragging = false; lastTouchDist = 0; });
}

function boardRenderComments(comments) {
  const listEl = $("board-comments-list");
  if (!listEl) return;
  if (!Array.isArray(comments) || comments.length === 0) {
    listEl.innerHTML = `<p class="txt-mute" style="text-align:center;padding:20px;font-size:13px;">아직 댓글이 없습니다.</p>`;
    return;
  }
  const myId = boardGetAuthorId();
  // 시간순 (오래된 → 최신)
  comments.sort((a, b) => (a.t || 0) - (b.t || 0));
  listEl.innerHTML = comments.map((c) => {
    const isMine = c.a === myId;
    return `
      <div class="board-comment" data-id="${escapeHtml(c.id || "")}">
        <div class="board-comment-head">
          <span class="board-server">${escapeHtml(formatServer(c.server))}</span>
          <span class="board-nick">${escapeHtml(c.nick || "익명")}</span>
          <span class="board-time">${formatBoardTime(c.t)}</span>
          ${isMine ? `<button class="btn btn-ghost comment-del" data-id="${escapeHtml(c.id || "")}" style="padding:2px 8px;font-size:11px;margin-left:auto;">🗑️</button>` : ""}
        </div>
        <div class="board-comment-content">${escapeHtml(c.content || "").replace(/\n/g, "<br>")}</div>
      </div>`;
  }).join("");
  // 댓글 삭제 핸들러
  listEl.querySelectorAll(".comment-del").forEach((btn) => {
    btn.addEventListener("click", () => boardDeleteComment(btn.dataset.id));
  });
}

async function boardCommentSubmit() {
  if (!boardIsConfigured()) { alert("PANTRY_ID 미설정"); return; }
  if (!CURRENT_POST_ID) return;
  const server = $("comment-server").value.trim();
  const nick = $("comment-nickname").value.trim();
  const content = $("comment-content").value.trim();
  if (!server) { alert("서버를 입력해주세요"); return; }
  if (!nick) { alert("닉네임을 입력해주세요"); return; }
  if (!content) { alert("댓글 내용을 입력해주세요"); return; }

  const submitBtn = $("btn-comment-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "작성 중...";
  try {
    const posts = (await boardLoadPosts()) || [];
    const idx = posts.findIndex((p) => p.id === CURRENT_POST_ID);
    if (idx < 0) throw new Error("게시글을 찾을 수 없습니다");
    if (!Array.isArray(posts[idx].comments)) posts[idx].comments = [];
    posts[idx].comments.push({
      id: "c_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      a: boardGetAuthorId(),
      server, nick, content,
      t: Date.now(),
    });
    await boardSavePosts(posts);
    // 서버/닉네임 저장 (다음 댓글 작성 시 자동 채움)
    localStorage.setItem("palmon_board_server", server);
    localStorage.setItem("palmon_board_nick", nick);
    $("comment-content").value = "";
    toast("댓글 작성됨");
    boardRenderDetail(posts[idx]);  // 댓글 갱신
  } catch (e) {
    alert("댓글 작성 실패: " + (e.message || e));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "💬 댓글 작성";
  }
}

async function boardDeleteComment(commentId) {
  if (!confirm("이 댓글을 삭제할까요?")) return;
  try {
    const posts = (await boardLoadPosts()) || [];
    const idx = posts.findIndex((p) => p.id === CURRENT_POST_ID);
    if (idx < 0) return;
    const myId = boardGetAuthorId();
    posts[idx].comments = (posts[idx].comments || []).filter((c) => !(c.id === commentId && c.a === myId));
    await boardSavePosts(posts);
    toast("댓글 삭제됨");
    boardRenderDetail(posts[idx]);
  } catch (e) {
    alert("삭제 실패: " + (e.message || e));
  }
}

// 이미지 리사이즈 (최대 800px, base64 반환)
function boardResizeImage(file, maxSize) {
  maxSize = maxSize || 800;
  return new Promise((resolve, reject) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > maxSize || h > maxSize) {
          const ratio = Math.min(maxSize / w, maxSize / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        // JPEG 로 압축 (PNG 보다 훨씬 작음)
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 작성자 ID — 같은 브라우저에서만 자기 글 삭제 가능
function boardGetAuthorId() {
  let id = localStorage.getItem("palmon_author_id");
  if (!id) {
    id = "u_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem("palmon_author_id", id);
  }
  return id;
}

// HTML escape (XSS 방지)
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function formatBoardTime(ts) {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

// 게시글 목록 → DOM 렌더 (재사용)
function boardRenderPosts(posts) {
  const statusEl = $("board-status");
  const tbody = $("board-list-body");
  if (!tbody) return;
  posts = posts.slice().sort((a, b) => (b.t || 0) - (a.t || 0));
  if (posts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="txt-mute" style="text-align:center;padding:30px;">아직 게시글이 없습니다. 첫 글을 작성해보세요!</td></tr>`;
    if (statusEl) statusEl.textContent = `총 0개`;
    return;
  }
  tbody.innerHTML = posts.map((p, i) => {
    const num = posts.length - i;
    const imgIcon = p.img ? `<span class="post-icon" title="이미지">🖼️</span>` : "";
    const cmtCount = (p.comments || []).length;
    const cmtIcon = cmtCount > 0 ? ` <span class="post-cmt-cnt">[${cmtCount}]</span>` : "";
    const views = p.v || 0;
    const today = new Date();
    const postDate = new Date(p.t || 0);
    const isToday = today.toDateString() === postDate.toDateString();
    const dateStr = isToday
      ? `${String(postDate.getHours()).padStart(2,"0")}:${String(postDate.getMinutes()).padStart(2,"0")}`
      : `${String(postDate.getMonth()+1).padStart(2,"0")}-${String(postDate.getDate()).padStart(2,"0")}`;
    return `
      <tr class="board-row" data-id="${escapeHtml(p.id || "")}">
        <td class="col-num">${num}</td>
        <td class="col-title">${imgIcon}${escapeHtml(p.title || "")}${cmtIcon}</td>
        <td class="col-author">${escapeHtml(p.nick || "익명")}</td>
        <td class="col-server">${escapeHtml(formatServer(p.server))}</td>
        <td class="col-views">${views}</td>
        <td class="col-date">${dateStr}</td>
      </tr>`;
  }).join("");
  if (statusEl) statusEl.textContent = `총 ${posts.length}개`;
  // 행 클릭 → 상세 보기
  tbody.querySelectorAll(".board-row").forEach((row) => {
    row.addEventListener("click", () => {
      const id = row.dataset.id;
      const post = posts.find((p) => p.id === id);
      if (post) boardShowDetail(post);
    });
  });
}

async function boardRefresh({ force = false } = {}) {
  const statusEl = $("board-status");
  const tbody = $("board-list-body");
  if (!tbody) return;

  if (!boardIsConfigured()) {
    $("board-setup-warn").style.display = "";
    tbody.innerHTML = `<tr><td colspan="6" class="txt-mute" style="text-align:center;padding:30px;">PANTRY_ID 설정 후 새로고침해주세요.</td></tr>`;
    if (statusEl) statusEl.textContent = "";
    return;
  }
  $("board-setup-warn").style.display = "none";

  // 1) 캐시 있으면 즉시 표시 (체감 속도 핵심)
  const cached = boardLoadPostsCached();
  if (cached && cached.length >= 0) {
    boardRenderPosts(cached);
    if (statusEl) statusEl.textContent = `총 ${cached.length}개 · 새로고침 중…`;
  } else if (statusEl) {
    statusEl.textContent = "불러오는 중...";
  }

  // 2) 백그라운드(또는 force)에서 fresh 로드 → 결과가 다르면 다시 렌더
  const posts = await boardLoadPosts({ force });
  if (posts === null) {
    if (statusEl) statusEl.textContent = cached ? `총 ${cached.length}개 · ⚠️ 갱신 실패` : "❌ 불러오기 실패";
    return;
  }
  // 캐시와 동일하면 다시 그리지 않음(깜빡임 방지)
  if (!cached || JSON.stringify(posts) !== JSON.stringify(cached)) {
    boardRenderPosts(posts);
  } else if (statusEl) {
    statusEl.textContent = `총 ${posts.length}개`;
  }
}

async function boardSubmit() {
  if (!boardIsConfigured()) { alert("PANTRY_ID 가 설정되지 않았습니다. app.js 맨 위를 확인해주세요."); return; }
  const server = $("board-server").value.trim();
  const nick = $("board-nickname").value.trim();
  const title = $("board-title").value.trim();
  const content = $("board-content").value.trim();
  const fileInput = $("board-image");
  const file = fileInput?.files?.[0];

  if (!server) { alert("서버를 입력해주세요"); return; }
  if (!nick) { alert("닉네임을 입력해주세요"); return; }
  if (!title) { alert("제목을 입력해주세요"); return; }
  if (!content) { alert("내용을 입력해주세요"); return; }

  const submitBtn = $("btn-post-submit");
  submitBtn.disabled = true;
  submitBtn.textContent = "작성 중...";

  try {
    let img = null;
    if (file) {
      if (file.size > 10 * 1024 * 1024) { alert("이미지가 너무 큽니다 (10MB 이하)"); throw new Error("이미지 용량 초과"); }
      img = await boardResizeImage(file, 800);
    }

    const posts = (await boardLoadPosts()) || [];
    const newPost = {
      id: "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      a: boardGetAuthorId(),
      server, nick, title, content, img,
      t: Date.now(),
    };
    posts.push(newPost);
    // 최근 200개만 유지 (용량 관리)
    if (posts.length > 200) posts.splice(0, posts.length - 200);
    await boardSavePosts(posts);

    // 폼 초기화
    $("board-title").value = "";
    $("board-content").value = "";
    if (fileInput) fileInput.value = "";
    $("board-image-preview").innerHTML = "";
    // 서버/닉네임은 유지 (재입력 편의) — 한번 적으면 이 브라우저 고정
    localStorage.setItem("palmon_board_server", server);
    localStorage.setItem("palmon_board_nick", nick);
    toast("게시글 작성됨");
    boardShowList();   // 목록 뷰로 돌아가기
  } catch (e) {
    console.error(e);
    alert("작성 실패: " + (e.message || e));
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "📝 작성";
  }
}

async function boardDeletePost(id) {
  if (!confirm("이 게시글을 삭제할까요?")) return;
  try {
    const posts = (await boardLoadPosts()) || [];
    const myId = boardGetAuthorId();
    const idx = posts.findIndex((p) => p.id === id && p.a === myId);
    if (idx < 0) { alert("내 글이 아니거나 이미 삭제됨"); return; }
    posts.splice(idx, 1);
    await boardSavePosts(posts);
    toast("삭제됨");
    boardRefresh();
  } catch (e) {
    alert("삭제 실패: " + (e.message || e));
  }
}

function boardClearForm() {
  $("board-title").value = "";
  $("board-content").value = "";
  const fi = $("board-image");
  if (fi) fi.value = "";
  $("board-image-preview").innerHTML = "";
}

function boardSetupListeners() {
  if (!$("btn-post-submit")) return;
  // 서버/닉네임 복원 (글쓰기 + 댓글)
  const ss = localStorage.getItem("palmon_board_server");
  const sn = localStorage.getItem("palmon_board_nick");
  if (ss) {
    if ($("board-server")) $("board-server").value = ss;
    if ($("comment-server")) $("comment-server").value = ss;
  }
  if (sn) {
    if ($("board-nickname")) $("board-nickname").value = sn;
    if ($("comment-nickname")) $("comment-nickname").value = sn;
  }

  // 현재 게시판 복원
  const savedBoard = localStorage.getItem("palmon_current_board");
  if (savedBoard) CURRENT_BOARD_ID = savedBoard;

  // 글쓰기 / 작성
  $("btn-post-submit").addEventListener("click", boardSubmit);
  $("btn-write-open")?.addEventListener("click", boardShowWrite);
  $("btn-write-cancel")?.addEventListener("click", boardShowList);
  $("btn-back-list")?.addEventListener("click", boardShowList);

  // 새로고침 / 게시판 고정 / 게시판 삭제 — 새로고침 버튼은 캐시 무시(force)
  $("btn-board-refresh").addEventListener("click", () => {
    boardRefreshList({ force: true });
    boardRefresh({ force: true });
  });
  $("btn-board-pin-cat")?.addEventListener("click", boardTogglePinCurrent);
  $("btn-board-delete-cat")?.addEventListener("click", boardDeleteCurrent);

  // 댓글 작성
  $("btn-comment-submit")?.addEventListener("click", boardCommentSubmit);

  // 이미지 미리보기
  $("board-image")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    const previewEl = $("board-image-preview");
    if (!file) { previewEl.innerHTML = ""; return; }
    try {
      const dataUrl = await boardResizeImage(file, 800);
      previewEl.innerHTML = `<img src="${dataUrl}" alt="" style="max-width:200px;max-height:200px;border-radius:6px;border:1px solid var(--border);"><div class="txt-mute" style="font-size:11px;margin-top:4px;">미리보기 (업로드 시 800px 로 자동 축소)</div>`;
    } catch (err) {
      previewEl.innerHTML = `<span class="txt-red" style="font-size:12px;">이미지 처리 실패</span>`;
    }
  });

  // 게시판 탭 클릭 시 표시 — 캐시 즉시 + 백그라운드 fresh
  // (boardShowList 내부에서 캐시→DOM 즉시, 그 다음 fetch 가 비동기로 갱신)
  document.querySelector('.tab[data-tab="t-board"]')?.addEventListener("click", () => {
    boardShowList();
  });

  // 페이지 로드 직후 백그라운드 prefetch — 사용자가 탭 누르기 전 미리 받아둠
  if (boardIsConfigured()) {
    setTimeout(() => {
      boardLoadList().then(() => boardLoadPosts()).catch(() => {});
    }, 600);
  }
}

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

    buildLevelsTab();              // 레벨/버프는 이제 t-result 안에 있음
    buildInventoryTab();           // 보유자원/가속 계산하기 탭 (#t-inventory)
    buildInventoryTab({ prefix: "tg-" });  // 목표캠프계산기 탭의 자체 인벤토리 (#t-result)
    // 한글 자릿수 힌트 부착 (보유 자원 입력칸)
    attachKrHints(["res-gold","res-wood","res-steel","res-exp","tg-res-gold","tg-res-wood","tg-res-steel","tg-res-exp"]);
    buildPalmonTab();
    applyTooltips();

    // 이벤트 바인딩
    $$(".tab").forEach((t) => t.addEventListener("click", () => {
      if (t.dataset.group) activateGroup(t.dataset.group);
      else if (t.dataset.tab) activateTab(t.dataset.tab);
    }));
    $("btn-save").addEventListener("click", saveSettings);
    $("btn-load").addEventListener("click", () => $("file-load").click());
    $("file-load").addEventListener("change", (e) => { if (e.target.files[0]) loadSettings(e.target.files[0]); });
    $("btn-reset").addEventListener("click", resetAll);
    $("btn-import-inv")?.addEventListener("click", importInventoryToTarget);
    // 🎯 목표캠프계산기로 바로 이동 (보유자원 탭에서 호출)
    $("goto-result-btn")?.addEventListener("click", () => {
      importInventoryToTarget();
      activateTab("t-result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    // 📦 보유자원/가속 계산기로 바로 이동 (목표캠프계산기 탭에서 호출)
    $("goto-inventory-btn")?.addEventListener("click", () => {
      activateTab("t-inventory");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    // 로고 클릭 시 사용법 탭으로 이동
    $("logo-link")?.addEventListener("click", () => activateTab("t-help"));

    // 자동 업데이트 (구슬/진화/팰몬자원/요약)
    $("bead-total").addEventListener("input", updateBead);
    for (let i = 1; i <= 10; i++) {
      const el = $(`bead-reset-${i}`);
      if (el) el.addEventListener("input", updateBead);
    }
    // 원하는 성급/진화 필터 — 결과 카드까지 함께 갱신
    $("bead-target")?.addEventListener("change", () => updateBead());
    $("evo-target")?.addEventListener("change", () => updateEssence());
    ["promo-total","evo-total","mega-evo-total",
     "evo-reset-1","evo-reset-2","evo-reset-3","evo-reset-4",
     "evo-reset-5","evo-reset-6","evo-reset-7","evo-reset-8"
    ].forEach((id) => $(id)?.addEventListener("input", updateEssence));
    $("palmon-camp").addEventListener("change", updatePalmon);
    $("palmon-cmp-camp")?.addEventListener("change", updatePalmon);
    PALMON_RESOURCE_ORDER.forEach((rk) => BOX_TIERS.forEach((t) => $(`pbox-${rk}-${t}`).addEventListener("input", updatePalmon)));
    // 인벤토리 요약
    const invIds = [];
    RESOURCE_KEYS.forEach((k) => invIds.push(`res-${k}`));
    RESOURCE_KEYS.forEach((rk) => BOX_TIERS.forEach((t) => invIds.push(`box-${rk}-${t}`)));
    // 🥚 경험치 — 보유자원 + 상자 입력
    invIds.push("res-exp");
    BOX_TIERS.forEach((t) => invIds.push(`box-exp-${t}`));
    const sg = getSpeedupGroupMap();
    SPEEDUP_GROUPS.forEach((grp) => Object.keys(sg[grp.key]).forEach((k) => invIds.push(`spd-${grp.key}-${k}`)));
    invIds.forEach((id) => $(id) && $(id).addEventListener("input", () => {
      updateInventorySummary();
      // 경험치 / 경험치 상자 입력 시 EXP 계산기도 자동 갱신
      if (id === "res-exp" || id.startsWith("box-exp-")) updateSkillExp();
    }));
    $("lv-camp").addEventListener("change", () => {
      updateInventorySummary();
      updateSkillExp();   // 캠프 변경 시 상자당 EXP 값도 변경됨
    });

    // 목표캠프계산기 탭의 모든 입력 변경 시 자동 계산
    ["input", "change"].forEach((evt) => {
      document.addEventListener(evt, (e) => {
        if (!e.target.closest) return;
        if (e.target.closest("#t-result")) {
          autoCalculate();
        }
      });
    });

    // 자동 로드 + 초기 렌더
    autoLoadFromLocalStorage();
    updateBead();
    updateEssence();
    updatePalmon();
    buildSkillExpTab();
    buildEnergyTab();
    buildSummonTab();
    buildFruitBoxTab();
    buildSupplyTab();
    buildMysteryBoxTab();
    buildEagleBoxTab();
    setupPalmonModeToggles();
    updateInventorySummary();
    autoCalculate();
    // 게시판 초기화
    boardSetupListeners();
    // 새로고침 시 마지막으로 본 탭 복원 — activateTab() 호출하여 그룹/서브탭 로직 함께 작동
    try {
      const lastTab = window.__INITIAL_TAB || localStorage.getItem("palmon_last_tab");
      // 인라인 head 스타일 제거 — 이후 탭 클릭 시 정상 동작
      const initStyle = document.getElementById("__initial-tab-style");
      if (initStyle) initStyle.remove();
      if (lastTab && document.getElementById(lastTab) && lastTab !== "t-help") {
        // 애니메이션 임시 비활성 (첫 화면 깜빡임 방지)
        $$(".tab-panel").forEach((p) => { p.style.animation = "none"; });
        activateTab(lastTab);
        requestAnimationFrame(() => {
          $$(".tab-panel").forEach((p) => { p.style.animation = ""; });
        });
      } else {
        // 사용법 탭 기본 활성 — 그래도 active 클래스는 정렬
        activateTab("t-help");
      }
    } catch (e) {
      console.warn("탭 복원 실패:", e);
      try { activateTab("t-help"); } catch {}
    }
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

// =====================================================
// 모험가대회 배너 — 왼쪽에서 슬라이드 인
// =====================================================
// 5개 이벤트가 4시간 단위로 회전, 매주 +2 오프셋
const ADV_EVENT_CYCLE = ["건물레벨업", "아미고 훈련", "기술연구", "AP소모", "팰몬강화"];
const ADV_EVENT_ICONS = {
  "건물레벨업": "🏗️",
  "아미고 훈련": "🐾",
  "기술연구": "🔬",
  "AP소모": "⚔️",
  "팰몬강화": "✨",
};
const ADV_EVENT_COLORS = {
  "건물레벨업": "#fbbf24",  // amber
  "아미고 훈련": "#a78bfa",  // purple
  "기술연구": "#60a5fa",    // blue
  "AP소모": "#f87171",      // red
  "팰몬강화": "#34d399",    // green
};
// 앵커: 2026-05-11 (월) 11:00 KST = 첫 슬롯 (건물레벨업)
const ADV_ANCHOR_TS = new Date("2026-05-11T11:00:00+09:00").getTime();
const ADV_SLOT_MS = 4 * 60 * 60 * 1000;  // 4시간

function getCurrentAdvEvent() {
  const now = Date.now();
  const slotIndex = Math.floor((now - ADV_ANCHOR_TS) / ADV_SLOT_MS);
  const eventIdx = ((slotIndex % 5) + 5) % 5;
  const nextSlotStart = ADV_ANCHOR_TS + (slotIndex + 1) * ADV_SLOT_MS;
  const remainingMs = nextSlotStart - now;
  return {
    current: ADV_EVENT_CYCLE[eventIdx],
    next: ADV_EVENT_CYCLE[(eventIdx + 1) % 5],
    remainingMs,
    slotIndex,
    nextStartTime: new Date(nextSlotStart),
  };
}

function fmtAdvCountdown(ms) {
  if (ms <= 0) return "곧 시작";
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

let _advBannerInterval = null;
let _advLastRenderedSlot = null;
let _advAutoShrinkTimer = null;
const ADV_MOBILE_AUTO_SHRINK_MS = 5000;   // 모바일: 5초 후 자동 축소
function isAdvMobile() {
  return window.innerWidth <= 639 || /Mobile|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function renderAdvBanner({ force = false } = {}) {
  const banner = document.getElementById("event-banner");
  const reopenBtn = document.getElementById("event-banner-reopen");
  if (!banner) return;
  const info = getCurrentAdvEvent();

  // 닫혔는지 확인 — 같은 슬롯에서 닫았고 1시간 안 지났으면 숨김
  let isHidden = false;
  if (!force) {
    try {
      const closeData = JSON.parse(localStorage.getItem("palmon_adv_banner_closed") || "null");
      if (closeData && closeData.slot === info.slotIndex) {
        const elapsed = Date.now() - closeData.t;
        if (elapsed < 60 * 60 * 1000) isHidden = true;
      }
    } catch {}
  }

  if (isHidden) {
    banner.classList.remove("show");
    if (reopenBtn) reopenBtn.style.display = "";
    return;
  }
  if (reopenBtn) reopenBtn.style.display = "none";

  // 이미 같은 슬롯이면 카운트다운만 갱신
  if (_advLastRenderedSlot === info.slotIndex && banner.classList.contains("show")) {
    const cd = banner.querySelector(".event-banner-countdown");
    if (cd) cd.innerHTML = `⏱ 종료까지 <b>${fmtAdvCountdown(info.remainingMs)}</b>`;
    return;
  }

  _advLastRenderedSlot = info.slotIndex;

  const curIcon = ADV_EVENT_ICONS[info.current] || "🎯";
  const nextIcon = ADV_EVENT_ICONS[info.next] || "▶";
  const curColor = ADV_EVENT_COLORS[info.current] || "#fbbf24";
  const nextColor = ADV_EVENT_COLORS[info.next] || "#94a3b8";
  const nextStartHHMM = `${String(info.nextStartTime.getHours()).padStart(2, "0")}:${String(info.nextStartTime.getMinutes()).padStart(2, "0")}`;

  banner.style.setProperty("--cur-color", curColor);
  banner.style.setProperty("--next-color", nextColor);
  banner.innerHTML = `
    <button class="event-banner-close" type="button" aria-label="닫기">×</button>
    <div class="event-banner-title">🏆 모험가대회</div>
    <div class="event-banner-current">
      <span class="event-icon-lg">${curIcon}</span>
      <div class="event-current-info">
        <div class="event-name-row">
          <span class="event-name">${escapeHtml(info.current)}</span>
          <span class="event-status">진행중</span>
        </div>
        <div class="event-banner-countdown">⏱ 종료까지 <b>${fmtAdvCountdown(info.remainingMs)}</b></div>
      </div>
    </div>
    <div class="event-banner-divider"></div>
    <div class="event-banner-next">
      <span class="event-icon-sm">${nextIcon}</span>
      다음 <span class="next-name">${escapeHtml(info.next)}</span>
      <span class="next-time">${nextStartHHMM}~</span>
    </div>
    <button class="event-banner-more" type="button">📅 오늘 일정 더보기</button>
  `;
  // 슬라이드 인
  setTimeout(() => banner.classList.add("show"), 30);

  // 더보기 버튼 — 오늘 일정 전체 모달 열기
  banner.querySelector(".event-banner-more")?.addEventListener("click", () => {
    openAdvScheduleModal();
  });

  // 닫기 버튼 — × 즉시 축소 (모바일/PC 모두)
  banner.querySelector(".event-banner-close").addEventListener("click", () => {
    if (_advAutoShrinkTimer) { clearTimeout(_advAutoShrinkTimer); _advAutoShrinkTimer = null; }
    banner.classList.remove("show");
    if (reopenBtn) reopenBtn.style.display = "";
    try {
      localStorage.setItem("palmon_adv_banner_closed", JSON.stringify({
        slot: info.slotIndex,
        t: Date.now(),
      }));
    } catch {}
  });

  // 모바일: 5초 후 자동으로 트로피로 축소
  if (_advAutoShrinkTimer) { clearTimeout(_advAutoShrinkTimer); _advAutoShrinkTimer = null; }
  if (isAdvMobile()) {
    _advAutoShrinkTimer = setTimeout(() => {
      banner.classList.remove("show");
      if (reopenBtn) reopenBtn.style.display = "";
      _advAutoShrinkTimer = null;
      // 자동 축소는 "closed" 상태를 저장하지 않음 — 트로피로 다시 열 수 있게
    }, ADV_MOBILE_AUTO_SHRINK_MS);
  }
}

// 오늘 전체 일정 모달 — 더보기 버튼 클릭 시
function openAdvScheduleModal() {
  document.getElementById("__adv-modal")?.remove();

  // 오늘 시작되는 6개 슬롯 계산 (11시, 15시, 19시, 23시, 다음날 3시, 다음날 7시)
  const now = new Date();
  // "오늘"의 기준 시작: 오늘 날짜 11:00 (KST)
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 11, 0, 0).getTime();
  // 만약 현재 시각이 11시 전이면 어제 11시부터 (어제 슬롯이 오늘 7시까지 이어짐)
  const cycleBase = now.getTime() < todayStart ? todayStart - 24 * 60 * 60 * 1000 : todayStart;

  // 6개 슬롯 정보 만들기 (4시간씩)
  const slots = [];
  for (let i = 0; i < 6; i++) {
    const slotStartTs = cycleBase + i * ADV_SLOT_MS;
    const slotIdx = Math.floor((slotStartTs - ADV_ANCHOR_TS) / ADV_SLOT_MS);
    const evIdx = ((slotIdx % 5) + 5) % 5;
    const evName = ADV_EVENT_CYCLE[evIdx];
    const slotDate = new Date(slotStartTs);
    const slotEnd = new Date(slotStartTs + ADV_SLOT_MS);
    const isOngoing = now >= slotDate && now < slotEnd;
    const isPast = now >= slotEnd;
    slots.push({
      slotIdx, evName, slotDate, slotEnd, isOngoing, isPast,
      hh: String(slotDate.getHours()).padStart(2, "0"),
      mm: String(slotDate.getMinutes()).padStart(2, "0"),
      endHh: String(slotEnd.getHours()).padStart(2, "0"),
      endMm: String(slotEnd.getMinutes()).padStart(2, "0"),
    });
  }

  // 오늘 날짜 + 요일
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dateLabel = `${now.getMonth() + 1}월 ${now.getDate()}일 (${dayNames[now.getDay()]})`;

  // 슬롯 행 HTML
  let rowsHtml = "";
  for (const s of slots) {
    const icon = ADV_EVENT_ICONS[s.evName] || "🎯";
    const color = ADV_EVENT_COLORS[s.evName] || "#fbbf24";
    const statusBadge = s.isOngoing
      ? `<span class="adv-modal-badge ongoing">진행중</span>`
      : s.isPast
        ? `<span class="adv-modal-badge past">종료</span>`
        : `<span class="adv-modal-badge upcoming">예정</span>`;
    rowsHtml += `
      <div class="adv-modal-row ${s.isOngoing ? "is-ongoing" : ""} ${s.isPast ? "is-past" : ""}">
        <div class="adv-modal-time">${s.hh}:${s.mm} ~ ${s.endHh}:${s.endMm}</div>
        <div class="adv-modal-event" style="--ev-color: ${color};">
          <span class="adv-modal-icon">${icon}</span>
          <span class="adv-modal-name">${escapeHtml(s.evName)}</span>
        </div>
        <div class="adv-modal-status">${statusBadge}</div>
      </div>`;
  }

  const overlay = document.createElement("div");
  overlay.id = "__adv-modal";
  overlay.className = "adv-modal-overlay";
  overlay.innerHTML = `
    <div class="adv-modal">
      <button class="adv-modal-close" type="button" aria-label="닫기">×</button>
      <div class="adv-modal-header">
        <div class="adv-modal-title">🏆 오늘 모험가대회 일정</div>
        <div class="adv-modal-date">${dateLabel}</div>
      </div>
      <div class="adv-modal-list">
        ${rowsHtml}
      </div>
      <div class="adv-modal-footer">
        <div class="adv-modal-cycle">
          이벤트 사이클: 🏗️ 건물레벨업 → 🐾 아미고 훈련 → 🔬 기술연구 → ⚔️ AP소모 → ✨ 팰몬강화 (4시간마다 회전)
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  const close = () => {
    overlay.remove();
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
  };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  overlay.querySelector(".adv-modal-close").addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
}

function startAdvBanner() {
  // 첫 표시
  setTimeout(() => renderAdvBanner(), 800);
  // 30초마다 카운트다운/슬롯 변경 체크
  if (_advBannerInterval) clearInterval(_advBannerInterval);
  _advBannerInterval = setInterval(() => renderAdvBanner(), 30000);
  // 다시 보기 버튼 — 트로피 누르면 배너 다시 펼침 (모바일은 다시 5초 후 자동 축소)
  const reopenBtn = document.getElementById("event-banner-reopen");
  if (reopenBtn) {
    reopenBtn.addEventListener("click", () => {
      try { localStorage.removeItem("palmon_adv_banner_closed"); } catch {}
      _advLastRenderedSlot = null;
      if (_advAutoShrinkTimer) { clearTimeout(_advAutoShrinkTimer); _advAutoShrinkTimer = null; }
      renderAdvBanner({ force: true });
    });
  }
}
startAdvBanner();

// 서버명 표시 헬퍼 — 입력 시 # 안 써도 자동으로 # 붙이고, 이미 있으면 그대로
function formatServer(s) {
  const v = (s || "").toString().trim();
  if (!v) return "#?";
  // 앞에 있는 # 모두 제거 → 정확히 # 한 개만 붙임
  return "#" + v.replace(/^#+/, "");
}

// =====================================================
// 숫자 입력 클릭 시 기존 값 자동 선택 — 0 위에 1 누르면 10 되는 문제 해결
// =====================================================
function setupAutoSelectInputs() {
  // focus 시 전체 선택 (이벤트 위임 — 동적 생성된 input 도 포함)
  document.addEventListener("focusin", (e) => {
    const el = e.target;
    if (el && el.matches && el.matches('input[type="number"], input[type="text"].auto-select')) {
      // 모바일에서 키보드 뜨기 전에 select() 호출 → 다음 프레임으로 미룸
      requestAnimationFrame(() => {
        try { el.select(); } catch (_) {}
      });
    }
  });
  // iOS Safari/Chrome: click 후 caret 만 이동하는 경우 대비
  document.addEventListener("click", (e) => {
    const el = e.target;
    if (el && el.matches && el.matches('input[type="number"]')) {
      // 이미 포커스된 input 의 caret 만 이동시키는 경우, 현재 값이 0 이면 비우기
      if (document.activeElement === el && el.value === "0") {
        // 첫 클릭 시 빈 상태로 시작 → 새 숫자 입력 시 0 이 사라짐
        try { el.select(); } catch (_) {}
      }
    }
  }, true);
}
setupAutoSelectInputs();

// =====================================================
// 사용법 탭 — 최신 업데이트 3개 자동 표시
// =====================================================
function renderLatestUpdates() {
  const listEl = document.getElementById("latest-updates-list");
  const verEl = document.getElementById("latest-updates-version");
  const moreEl = document.getElementById("latest-updates-more");
  if (!listEl) return;

  // changelog 탭의 첫번째 entry (= 최신 버전)에서 항목 3개 가져오기
  const firstEntry = document.querySelector("#t-changelog .changelog-entry");
  if (!firstEntry) return;

  // 버전 타이틀
  const titleEl = firstEntry.querySelector(".group-title");
  if (verEl && titleEl) verEl.textContent = `(${titleEl.textContent})`;

  // 최신 3개 항목
  const items = firstEntry.querySelectorAll(".cl-item");
  listEl.innerHTML = "";
  const max = Math.min(3, items.length);
  for (let i = 0; i < max; i++) {
    const cloned = items[i].cloneNode(true);
    listEl.appendChild(cloned);
  }
  if (items.length === 0) {
    listEl.innerHTML = `<p class="txt-dim" style="font-size:13px;margin:8px 0;">아직 업데이트 내역이 없습니다.</p>`;
  }

  // 전체 보기 링크 → 업데이트 현황 탭으로 이동
  if (moreEl) {
    moreEl.onclick = (e) => {
      e.preventDefault();
      activateTab("t-changelog");
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
  }
}
// 페이지 로드 후 즉시 실행 (DOMContentLoaded 이후)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", renderLatestUpdates);
} else {
  renderLatestUpdates();
}

// 헤더 높이를 CSS 변수로 노출 → 탭바 sticky 위치 자동 계산
function updateHeaderHeight() {
  const h = document.querySelector(".header")?.offsetHeight || 56;
  document.documentElement.style.setProperty("--header-h", h + "px");
}
window.addEventListener("load", updateHeaderHeight);
window.addEventListener("resize", updateHeaderHeight);
// 폰트 로딩 후에도 갱신
setTimeout(updateHeaderHeight, 300);
setTimeout(updateHeaderHeight, 1000);
