(function () {
  "use strict";

  const saveKey = "mushroom-boop-save-v1";
  const leaderboardKey = "mushroom-boop-leaderboard-v1";
  const playerIdKey = "mushroom-boop-player-id-v1";
  const maxOfflineSeconds = 8 * 60 * 60;
  const greatBloomRequirements = [100000, 750000, 5000000, 40000000];
  const rushMax = 100;
  const rushSeconds = 20;
  const onlineConfig = window.MUSHROOM_BOOP_ONLINE || {};
  const meadowNames = [
    "Sleeping Cap",
    "Dew Cap",
    "Tiny Grove",
    "Lantern Ring",
    "Puff Meadow",
    "Mooncap Hollow",
    "Sporefall Garden",
    "Glowroot Village",
    "Starcap Forest",
    "Ancient Mycelium"
  ];

  const machines = [
    { id: "plot", name: "Root thread", base: 15, scale: 1.16, rate: 0.1, desc: "A soft root line that releases a slow spore pulse." },
    { id: "press", name: "Dew cup", base: 90, scale: 1.17, rate: 0.75, desc: "A leaf cup that feeds the cap with morning dew." },
    { id: "clock", name: "Lantern cap", base: 520, scale: 1.18, rate: 4.4, desc: "A glowing cap that keeps spores drifting at night." },
    { id: "collector", name: "Friend burrow", base: 3200, scale: 1.19, rate: 23, desc: "A tiny home where meadow helpers gather and nudge spores along." },
    { id: "greenhouse", name: "Rainleaf canopy", base: 18000, scale: 1.2, rate: 130, desc: "A broad leaf canopy that turns rain into spore showers." },
    { id: "rail", name: "Glowroot web", base: 112000, scale: 1.21, rate: 820, desc: "Bright mycelium paths that carry nutrients through the meadow." },
    { id: "relay", name: "Moonspore hollow", base: 720000, scale: 1.22, rate: 5200, desc: "A moonlit hollow that releases huge sleepy spore clouds." }
  ];

  const upgrades = [
    { id: "tap-2", name: "Dew touch", cost: 120, req: state => state.totalLoops >= 80, desc: "Each tap sends twice as many spores through the roots.", kind: "tap", value: 2 },
    { id: "rate-1", name: "Root chorus", cost: 850, req: state => ownedTotal(state) >= 12, desc: "Roots hum together for 1.5x spores/sec.", kind: "rate", value: 1.5 },
    { id: "tap-5", name: "Soft cap rhythm", cost: 5200, req: state => state.clicks >= 180, desc: "Tap power x2.5 when the cap is awake.", kind: "tap", value: 2.5 },
    { id: "rate-2", name: "Lantern pollen", cost: 36000, req: state => state.totalLoops >= 18000, desc: "Lantern caps double passive spores/sec.", kind: "rate", value: 2 },
    { id: "tap-rate", name: "Dewline trail", cost: 160000, req: state => state.machines.press >= 12, desc: "Tap power grows with every Dew cup.", kind: "tapRoute", value: 0.08 },
    { id: "rate-3", name: "Moonroot glow", cost: 880000, req: state => state.totalLoops >= 420000, desc: "Moonlit roots boost spores/sec x2.25.", kind: "rate", value: 2.25 },
    { id: "prestige-soft", name: "Ancient mycelium", cost: 4200000, req: state => state.rootstock >= 3, desc: "Great Bloom mycelium perks become stronger.", kind: "root", value: 0.08 }
  ];

  const achievements = [
    { id: "first-tap", name: "First spore", desc: "Tap once.", req: state => state.clicks >= 1 },
    { id: "hundred", name: "Hundred spores", desc: "Earn 100 lifetime spores.", req: state => state.lifetimeLoops >= 100 },
    { id: "machine-ten", name: "Tiny meadow", desc: "Own 10 meadow pieces.", req: state => ownedTotal(state) >= 10 },
    { id: "clicker", name: "Tap rhythm", desc: "Tap 250 times.", req: state => state.clicks >= 250 },
    { id: "million", name: "Million-spore meadow", desc: "Earn 1,000,000 lifetime spores.", req: state => state.lifetimeLoops >= 1000000 },
    { id: "rooted", name: "Great Bloom", desc: "Release the meadow into a stronger season.", req: state => Number(state.bloomCount || 0) >= 1 },
    { id: "return", name: "Daily dew", desc: "Claim a daily dew reward.", req: state => state.dailyClaims >= 1 },
    { id: "rush", name: "Spore Rush", desc: "Trigger a Spore Rush.", req: state => state.rushes >= 1 },
    { id: "quest", name: "Quest sprout", desc: "Claim a daily quest.", req: state => state.questsClaimed >= 1 }
  ];

  const perks = [
    { id: "spore-memory", name: "Season memory", baseCost: 1, max: 10, desc: "Baseline spores/sec +18% per level." },
    { id: "soft-hands", name: "Soft touch", baseCost: 1, max: 10, desc: "Tap power +25% per level." },
    { id: "cheap-caps", name: "Frugal roots", baseCost: 2, max: 8, desc: "Roots, dew, friends, and lanterns cost 6% less per level." },
    { id: "long-boost", name: "Long Spore Shower", baseCost: 2, max: 5, desc: "Spore Shower lasts 2 more minutes per level." },
    { id: "starter-cap", name: "Starter friend", baseCost: 3, max: 1, desc: "Each Great Bloom starts with one Root thread." }
  ];

  const state = loadState();
  let lastTick = Date.now();
  let dirty = false;
  let displayedRate = incomePerSecond(state);
  let clickRateBurst = 0;
  let lastTapTime = 0;
  let comboCount = 0;
  let comboTimer = 0;
  let leaderboardEntries = [];
  let leaderboardStatus = "";
  let leaderboardSubmitting = false;
  let audioContext = null;
  let audioGraph = null;
  let melodyStep = 0;

  const els = {};
  [
    "loopsValue", "rateValue", "baseRateValue", "tapValue", "seedButton", "orchardVisual", "machineList",
    "comboBadge",
    "upgradeList", "rootstockValue", "prestigeHint", "prestigeProgress", "prestigeButton", "dailyReward",
    "dailyButton", "focusValue", "focusButton", "boostHint", "machineCount", "upgradeCount",
    "rushValue", "rushHint", "rushProgress", "questState", "questList",
    "perkCount", "perkList", "leaderboardState", "leaderboardList", "playerName", "submitScoreButton",
    "achievementCount", "achievementList", "clicksValue", "runValue", "lifetimeValue",
    "multiplierValue", "sessionMeadowValue", "shareButton", "exportButton", "importButton", "saveDialog",
    "saveText", "dialogTitle", "dialogHelp", "copySaveButton", "loadSaveButton", "saveState",
    "bottomTabs", "friendScene", "companionRow", "rushOrbit", "rootRing", "soundButton",
    "meadowValue", "meadowName", "meadowMood", "bloomProgress", "bloomNeed", "nextBloomName",
    "dewSkillButton", "boostSkillButton", "bloomSkillButton"
  ].forEach(id => { els[id] = document.getElementById(id); });

  function setScreen(tab) {
    const screens = new Set(["play", "store", "quests", "board"]);
    const next = screens.has(tab) ? tab : "play";
    document.body.dataset.tab = next;
    if (!els.bottomTabs) return;
    els.bottomTabs.querySelectorAll("[data-tab-target]").forEach(button => {
      button.setAttribute("aria-pressed", button.dataset.tabTarget === next ? "true" : "false");
    });
  }

  function defaultState() {
    return {
      version: 1,
      loops: 0,
      totalLoops: 0,
      lifetimeLoops: 0,
      clicks: 0,
      rootstock: 0,
      dailyClaims: 0,
      focusUntil: 0,
      rushCharge: 0,
      rushUntil: 0,
      rushes: 0,
      bloomCount: 0,
      meadowLevel: 1,
      meadowBloom: 0,
      firstTapAt: 0,
      firstBloomSeconds: 0,
      bestFirstBloomSeconds: 0,
      soundOn: true,
      lastDaily: "",
      streak: 0,
      questDay: "",
      questBaselines: { clicks: 0, spores: 0, pieces: 0 },
      claimedQuests: [],
      questsClaimed: 0,
      lastSaved: Date.now(),
      machines: Object.fromEntries(machines.map(machine => [machine.id, 0])),
      perks: Object.fromEntries(perks.map(perk => [perk.id, 0])),
      upgrades: [],
      achievements: []
    };
  }

  function loadState() {
    const fallback = defaultState();
    try {
      if (new URLSearchParams(window.location.search).has("reset")) {
        localStorage.removeItem(saveKey);
        localStorage.removeItem(leaderboardKey);
      }
      const raw = localStorage.getItem(saveKey);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      const merged = { ...fallback, ...parsed };
      merged.machines = { ...fallback.machines, ...(parsed.machines || {}) };
      merged.perks = { ...fallback.perks, ...(parsed.perks || {}) };
      merged.questBaselines = { ...fallback.questBaselines, ...(parsed.questBaselines || {}) };
      merged.upgrades = Array.isArray(parsed.upgrades) ? parsed.upgrades : [];
      merged.achievements = Array.isArray(parsed.achievements) ? parsed.achievements : [];
      merged.claimedQuests = Array.isArray(parsed.claimedQuests) ? parsed.claimedQuests : [];
      applyOffline(merged);
      return merged;
    } catch {
      return fallback;
    }
  }

  function applyOffline(target) {
    const now = Date.now();
    const elapsed = Math.max(0, Math.min(maxOfflineSeconds, (now - Number(target.lastSaved || now)) / 1000));
    if (elapsed < 30) return;
    const earned = incomePerSecond(target) * elapsed * 0.55;
    if (earned > 0) addLoops(target, earned);
  }

  function save() {
    state.lastSaved = Date.now();
    localStorage.setItem(saveKey, JSON.stringify(state));
    dirty = false;
    els.saveState.textContent = "saved";
  }

  function markDirty() {
    dirty = true;
    els.saveState.textContent = "saving";
  }

  function format(value) {
    const number = Number(value) || 0;
    if (number > 0 && number < 1) {
      return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    }
    if (number < 10 && number % 1) {
      return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    }
    if (number < 1000) return number.toFixed(number % 1 ? 1 : 0);
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 }).format(number);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function todayKey(offsetDays = 0) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().slice(0, 10);
  }

  function ownedTotal(target = state) {
    return Object.values(target.machines || {}).reduce((sum, count) => sum + Number(count || 0), 0);
  }

  function hasUpgrade(id, target = state) {
    return target.upgrades.includes(id);
  }

  function perkLevel(id, target = state) {
    return Number(target.perks?.[id] || 0);
  }

  function perkCost(perk, target = state) {
    return perk.baseCost + perkLevel(perk.id, target);
  }

  function rushActive(target = state) {
    return Date.now() < Number(target.rushUntil || 0);
  }

  function rushRemaining(target = state) {
    return Math.max(0, Number(target.rushUntil || 0) - Date.now());
  }

  function rushMultiplier(target = state) {
    return rushActive(target) ? 3 : 1;
  }

  function activateRush(target = state) {
    target.rushCharge = 0;
    target.rushUntil = Date.now() + rushSeconds * 1000;
    target.rushes = Number(target.rushes || 0) + 1;
    displayedRate = Math.max(displayedRate, incomePerSecond(target));
    if (navigator.vibrate) navigator.vibrate([16, 20, 16]);
  }

  function addRushCharge(amount, target = state) {
    if (rushActive(target)) return;
    target.rushCharge = Math.min(rushMax, Number(target.rushCharge || 0) + amount);
    if (target.rushCharge >= rushMax) {
      activateRush(target);
    }
  }

  function bloomRequirement(target = state) {
    const count = Math.max(0, Number(target.bloomCount || 0));
    if (count < greatBloomRequirements.length) return greatBloomRequirements[count];
    const last = greatBloomRequirements[greatBloomRequirements.length - 1];
    return Math.round(last * Math.pow(7.5, count - greatBloomRequirements.length + 1));
  }

  function meadowRequirement(target = state) {
    const level = Math.max(1, Number(target.meadowLevel || 1));
    return Math.round((18 + level * 7) * Math.pow(1.14, level - 1) * rootBonus(target));
  }

  function meadowTitle(target = state, offset = 0) {
    const level = Math.max(1, Number(target.meadowLevel || 1) + offset);
    return meadowNames[(level - 1) % meadowNames.length];
  }

  function meadowMood(target = state) {
    const tutorial = tutorialStage(target);
    if (tutorial.id === "sleeping") return "sleeping";
    if (tutorial.id === "awake") return "awake";
    if (tutorial.id === "friend") return "Dew Beetle";
    if (rushActive(target)) return "glowing";
    const progress = Math.max(0, Math.min(1, Number(target.meadowBloom || 0) / meadowRequirement(target)));
    if (progress >= 0.82) return "nearly blooming";
    if (progress >= 0.45) return "wiggly";
    if (Number(target.meadowLevel || 1) >= 4) return "happy";
    return "soft glow";
  }

  function tutorialStage(target = state) {
    const clicks = Number(target.clicks || 0);
    if (clicks <= 0) return { id: "sleeping", next: "tap to wake" };
    if (clicks < 5) return { id: "awake", next: `${5 - clicks} taps to baby cap` };
    if (clicks < 15) return { id: "baby", next: `${15 - clicks} taps to root glow` };
    if (clicks < 25) return { id: "root", next: `${25 - clicks} taps to Dew Beetle` };
    if (Number(target.meadowLevel || 1) < 2) return { id: "friend", next: "care ring is waking" };
    return { id: "forest", next: `next: ${meadowTitle(target, 1)}` };
  }

  function rootBonus(target = state) {
    const base = hasUpgrade("prestige-soft", target) ? 0.23 : 0.15;
    return 1 + Number(target.rootstock || 0) * base;
  }

  function rateMultiplier(target = state) {
    let mult = rootBonus(target);
    mult *= 1 + perkLevel("spore-memory", target) * 0.18;
    upgrades.forEach(upgrade => {
      if (upgrade.kind === "rate" && hasUpgrade(upgrade.id, target)) mult *= upgrade.value;
    });
    if (Date.now() < Number(target.focusUntil || 0)) mult *= 2;
    mult *= rushMultiplier(target);
    return mult;
  }

  function tapPower(target = state) {
    let tap = 1;
    upgrades.forEach(upgrade => {
      if (upgrade.kind === "tap" && hasUpgrade(upgrade.id, target)) tap *= upgrade.value;
    });
    if (hasUpgrade("tap-rate", target)) {
      tap *= 1 + Number(target.machines.press || 0) * 0.08;
    }
    tap *= 1 + perkLevel("soft-hands", target) * 0.25;
    if (rushActive(target)) tap *= 2;
    return tap * rootBonus(target);
  }

  function incomePerSecond(target = state) {
    const machineBase = machines.reduce((sum, machine) => {
      return sum + Number(target.machines[machine.id] || 0) * machine.rate;
    }, 0);
    return machineBase * rateMultiplier(target);
  }

  function addMeadowCare(amount, target = state) {
    target.meadowLevel = Math.max(1, Number(target.meadowLevel || 1));
    target.meadowBloom = Math.max(0, Number(target.meadowBloom || 0)) + Math.max(0, Number(amount) || 0);
    let blooms = 0;
    let reward = 0;
    while (target.meadowBloom >= meadowRequirement(target) && blooms < 12) {
      const required = meadowRequirement(target);
      target.meadowBloom -= required;
      target.meadowLevel += 1;
      const bloomReward = Math.max(25, required * (0.55 + rootBonus(target) * 0.18));
      addLoops(target, bloomReward);
      reward += bloomReward;
      blooms += 1;
    }
    if (blooms > 0) {
      if (!target.firstBloomSeconds && target.firstTapAt) {
        target.firstBloomSeconds = Math.max(1, Math.round((Date.now() - target.firstTapAt) / 1000));
        target.bestFirstBloomSeconds = target.bestFirstBloomSeconds
          ? Math.min(Number(target.bestFirstBloomSeconds), target.firstBloomSeconds)
          : target.firstBloomSeconds;
      }
      recordSporeBurst(reward);
      addRushCharge(12 + blooms * 3, target);
    }
    return { blooms, reward };
  }

  function recordSporeBurst(amount) {
    clickRateBurst += Math.max(0, Number(amount) || 0) * 1.35;
    displayedRate = Math.max(displayedRate, incomePerSecond() + clickRateBurst);
  }

  function renderCombo() {
    if (!els.comboBadge) return;
    if (comboCount <= 1) {
      els.comboBadge.textContent = "";
      els.comboBadge.className = "combo-badge";
      return;
    }
    els.comboBadge.textContent = `combo x${comboCount}`;
    els.comboBadge.className = `combo-badge show${comboCount >= 12 ? " hot" : ""}`;
    window.clearTimeout(comboTimer);
    comboTimer = window.setTimeout(() => {
      comboCount = 0;
      renderCombo();
    }, 1100);
  }

  function updateDisplayedRate(dt) {
    clickRateBurst *= Math.pow(0.72, dt);
    const baseline = incomePerSecond();
    const target = baseline + clickRateBurst;
    const smoothing = displayedRate > target ? 0.7 : 0.38;
    displayedRate += (target - displayedRate) * Math.min(1, dt * smoothing);
    if (clickRateBurst < 0.01 && Math.abs(displayedRate - baseline) < 0.01) {
      clickRateBurst = 0;
      displayedRate = baseline;
    }
  }

  function machineCost(machine, target = state) {
    return machine.base
      * Math.pow(machine.scale, Number(target.machines[machine.id] || 0))
      * Math.pow(0.94, perkLevel("cheap-caps", target));
  }

  function addLoops(target, amount) {
    target.loops += amount;
    target.totalLoops += amount;
    target.lifetimeLoops += amount;
  }

  function buyMachine(id) {
    const machine = machines.find(item => item.id === id);
    const cost = machineCost(machine);
    if (!machine || state.loops < cost) return;
    state.loops -= cost;
    state.machines[id] += 1;
    addRushCharge(4);
    displayedRate = Math.max(displayedRate, incomePerSecond());
    markDirty();
    checkAchievements();
    render();
  }

  function buyUpgrade(id) {
    const upgrade = upgrades.find(item => item.id === id);
    if (!upgrade || hasUpgrade(id) || !upgrade.req(state) || state.loops < upgrade.cost) return;
    state.loops -= upgrade.cost;
    state.upgrades.push(id);
    addRushCharge(12);
    displayedRate = Math.max(displayedRate, incomePerSecond());
    markDirty();
    checkAchievements();
    render();
  }

  function buyPerk(id) {
    const perk = perks.find(item => item.id === id);
    if (!perk) return;
    const level = perkLevel(id);
    const cost = perkCost(perk);
    if (level >= perk.max || state.rootstock < cost) return;
    state.rootstock -= cost;
    state.perks[id] = level + 1;
    if (id === "starter-cap" && state.machines.plot < 1) {
      state.machines.plot = 1;
    }
    displayedRate = Math.max(displayedRate, incomePerSecond());
    markDirty();
    render();
  }

  function graftGain() {
    const required = bloomRequirement();
    if (state.totalLoops < required) return 0;
    return Math.max(1, Math.floor(Math.sqrt(state.totalLoops / required)));
  }

  function graft() {
    const gain = graftGain();
    if (gain <= 0) return;
    const keep = defaultState();
    const keptPerks = { ...keep.perks, ...(state.perks || {}) };
    const keptAchievements = Array.isArray(state.achievements) ? [...state.achievements] : [];
    const bestFirstBloomSeconds = Number(state.bestFirstBloomSeconds || 0);
    state.rootstock += gain;
    state.bloomCount = Number(state.bloomCount || 0) + 1;
    state.loops = 0;
    state.totalLoops = 0;
    state.clicks = 0;
    state.focusUntil = 0;
    state.rushCharge = 0;
    state.rushUntil = 0;
    state.meadowLevel = 1;
    state.meadowBloom = 0;
    state.firstTapAt = 0;
    state.firstBloomSeconds = 0;
    state.bestFirstBloomSeconds = bestFirstBloomSeconds;
    state.machines = keep.machines;
    state.perks = keptPerks;
    state.upgrades = [];
    state.achievements = keptAchievements;
    if (perkLevel("starter-cap", state) > 0) {
      state.machines.plot = 1;
      displayedRate = incomePerSecond();
    }
    clickRateBurst = 0;
    playTone("great");
    if (navigator.vibrate) navigator.vibrate([18, 22, 18, 36]);
    markDirty();
    checkAchievements();
    save();
    render();
  }

  function claimDaily() {
    const today = todayKey();
    if (state.lastDaily === today) return;
    state.streak = state.lastDaily === todayKey(-1) ? state.streak + 1 : 1;
    state.lastDaily = today;
    state.dailyClaims += 1;
    const reward = Math.max(50, incomePerSecond() * 600 + tapPower() * 25) * Math.max(1, state.streak);
    addLoops(state, reward);
    recordSporeBurst(reward);
    addRushCharge(18);
    markDirty();
    checkAchievements();
    render();
  }

  function ensureDailyQuestState() {
    const today = todayKey();
    if (state.questDay === today && state.questBaselines && Array.isArray(state.claimedQuests)) return;
    state.questDay = today;
    state.questBaselines = {
      clicks: Number(state.clicks || 0),
      spores: Number(state.lifetimeLoops || 0),
      pieces: ownedTotal(state)
    };
    state.claimedQuests = [];
    markDirty();
  }

  function questDefinitions() {
    ensureDailyQuestState();
    const base = state.questBaselines || { clicks: 0, spores: 0, pieces: 0 };
    const tapTarget = 65 + Math.min(135, Number(state.rootstock || 0) * 10);
    const pieceTarget = Math.max(3, Math.min(18, 5 + Number(state.rootstock || 0)));
    const sporeTarget = Math.max(900, bloomRequirement() * 0.1);
    return [
      {
        id: "boops",
        name: "Tap chorus",
        desc: `Tap ${format(tapTarget)} times today.`,
        current: Math.max(0, Number(state.clicks || 0) - Number(base.clicks || 0)),
        target: tapTarget,
        reward: Math.max(180, tapPower() * tapTarget * 2.5)
      },
      {
        id: "pieces",
        name: "Grow the grove",
        desc: `Buy ${format(pieceTarget)} meadow pieces today.`,
        current: Math.max(0, ownedTotal(state) - Number(base.pieces || 0)),
        target: pieceTarget,
        reward: Math.max(450, incomePerSecond() * 240 + tapPower() * 80)
      },
      {
        id: "spores",
        name: "Spore sprint",
        desc: `Earn ${format(sporeTarget)} spores today.`,
        current: Math.max(0, Number(state.lifetimeLoops || 0) - Number(base.spores || 0)),
        target: sporeTarget,
        reward: Math.max(600, sporeTarget * 0.22)
      }
    ];
  }

  function claimQuest(id) {
    const quest = questDefinitions().find(item => item.id === id);
    if (!quest || state.claimedQuests.includes(id) || quest.current < quest.target) return;
    state.claimedQuests.push(id);
    state.questsClaimed = Number(state.questsClaimed || 0) + 1;
    addLoops(state, quest.reward);
    recordSporeBurst(quest.reward);
    addRushCharge(25);
    markDirty();
    checkAchievements();
    render();
  }

  async function requestRewardedBoost() {
    const ads = window.MUSHROOM_BOOP_ADS || {};
    const rewardId = String(ads.admob?.rewardedUnitId || "").trim();
    if (window.MushroomBoopRewardedAd?.show && rewardId) {
      return window.MushroomBoopRewardedAd.show({ adUnitId: rewardId });
    }
    return { rewarded: true, demo: true };
  }

  async function useFocus() {
    const now = Date.now();
    if (now < Number(state.focusUntil || 0)) return;
    els.focusButton.disabled = true;
    els.focusButton.textContent = "calling shower";
    const result = await requestRewardedBoost().catch(() => ({ rewarded: false }));
    if (!result.rewarded) {
      els.boostHint.textContent = "Reward ad was not completed. Spore Shower stayed inactive.";
      renderFocus();
      return;
    }
    const boostMinutes = 10 + perkLevel("long-boost") * 2;
    state.focusUntil = now + boostMinutes * 60 * 1000;
    addRushCharge(35);
    displayedRate = Math.max(displayedRate, incomePerSecond());
    els.boostHint.textContent = result.demo
      ? "Demo Spore Shower active. Configure rewarded AdMob IDs before App Store release."
      : "Spore Shower active.";
    playTone("shower");
    markDirty();
    checkAchievements();
    render();
  }

  function ensureAudio() {
    if (!state.soundOn) return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) audioContext = new AudioCtx();
    if (audioContext.state === "suspended") audioContext.resume().catch(() => {});
    ensureAudioGraph(audioContext);
    return audioContext;
  }

  function createNoiseBuffer(ctx, seconds = 0.16) {
    const length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      const fade = 1 - i / length;
      data[i] = (Math.random() * 2 - 1) * fade * fade;
    }
    return buffer;
  }

  function createReverbBuffer(ctx) {
    const seconds = 1.65;
    const length = Math.floor(ctx.sampleRate * seconds);
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        const fade = 1 - i / length;
        data[i] = (Math.random() * 2 - 1) * fade * fade * (channel ? .82 : 1);
      }
    }
    return buffer;
  }

  function ensureAudioGraph(ctx) {
    if (audioGraph?.context === ctx) return audioGraph;
    const dry = ctx.createGain();
    const wet = ctx.createGain();
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    const reverb = ctx.createConvolver();
    const warmth = ctx.createBiquadFilter();

    dry.gain.value = .76;
    wet.gain.value = .18;
    master.gain.value = .78;
    compressor.threshold.value = -22;
    compressor.knee.value = 20;
    compressor.ratio.value = 3;
    compressor.attack.value = .01;
    compressor.release.value = .22;
    warmth.type = "lowpass";
    warmth.frequency.value = 6800;
    warmth.Q.value = .45;
    reverb.buffer = createReverbBuffer(ctx);

    dry.connect(master);
    wet.connect(reverb);
    reverb.connect(master);
    master.connect(warmth);
    warmth.connect(compressor);
    compressor.connect(ctx.destination);

    audioGraph = { context: ctx, dry, wet };
    return audioGraph;
  }

  function outputNode(ctx, panValue = 0) {
    const graph = ensureAudioGraph(ctx);
    if (!ctx.createStereoPanner) return { input: graph.dry, wet: graph.wet };
    const dryPan = ctx.createStereoPanner();
    const wetPan = ctx.createStereoPanner();
    dryPan.pan.value = panValue;
    wetPan.pan.value = panValue * .55;
    dryPan.connect(graph.dry);
    wetPan.connect(graph.wet);
    return { input: dryPan, wet: wetPan };
  }

  function centsToRatio(cents) {
    return Math.pow(2, cents / 1200);
  }

  function playBrush(ctx, when, seconds, volume, filterFrequency, panValue = 0) {
    const source = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    const out = outputNode(ctx, panValue);
    source.buffer = createNoiseBuffer(ctx, seconds);
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(filterFrequency, when);
    filter.Q.value = 2.6;
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + .008);
    gain.gain.exponentialRampToValueAtTime(.0001, when + seconds);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(out.input);
    gain.connect(out.wet);
    source.start(when);
    source.stop(when + seconds + .03);
  }

  function playPluck(ctx, frequency, when, seconds, volume, panValue = 0) {
    const out = outputNode(ctx, panValue);
    const body = ctx.createOscillator();
    const air = ctx.createOscillator();
    const bodyGain = ctx.createGain();
    const airGain = ctx.createGain();
    const tone = ctx.createBiquadFilter();
    const detune = centsToRatio((Math.random() * 10) - 5);

    body.type = "triangle";
    air.type = "sine";
    body.frequency.setValueAtTime(frequency * detune, when);
    air.frequency.setValueAtTime(frequency * 2.01 * centsToRatio((Math.random() * 8) - 4), when);
    tone.type = "lowpass";
    tone.frequency.setValueAtTime(4200, when);
    tone.frequency.exponentialRampToValueAtTime(1500, when + seconds);
    bodyGain.gain.setValueAtTime(.0001, when);
    bodyGain.gain.exponentialRampToValueAtTime(volume, when + .012);
    bodyGain.gain.exponentialRampToValueAtTime(.0001, when + seconds);
    airGain.gain.setValueAtTime(.0001, when + .006);
    airGain.gain.exponentialRampToValueAtTime(volume * .22, when + .025);
    airGain.gain.exponentialRampToValueAtTime(.0001, when + seconds * .72);

    body.connect(bodyGain);
    air.connect(airGain);
    bodyGain.connect(tone);
    airGain.connect(tone);
    tone.connect(out.input);
    tone.connect(out.wet);
    body.start(when);
    air.start(when + .004);
    body.stop(when + seconds + .04);
    air.stop(when + seconds + .04);
  }

  function playBell(ctx, frequency, when, seconds, volume, panValue = 0) {
    const out = outputNode(ctx, panValue);
    [1, 2.02, 3.01].forEach((partial, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = index === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(frequency * partial * centsToRatio((Math.random() * 7) - 3.5), when);
      gain.gain.setValueAtTime(.0001, when);
      gain.gain.exponentialRampToValueAtTime(volume / (index + 1.6), when + .018 + index * .006);
      gain.gain.exponentialRampToValueAtTime(.0001, when + seconds * (1 - index * .12));
      osc.connect(gain);
      gain.connect(out.input);
      gain.connect(out.wet);
      osc.start(when);
      osc.stop(when + seconds + .04);
    });
  }

  function playTone(kind = "tap", strength = 1) {
    const ctx = ensureAudio();
    if (!ctx) return;
    const now = ctx.currentTime;
    const scale = [392, 440, 493.88, 587.33, 659.25, 783.99, 880, 987.77];
    const bloomChord = [523.25, 659.25, 783.99, 1046.5];
    const pan = (Math.random() * .46) - .23;

    if (kind === "tap") {
      melodyStep = (melodyStep + 1) % 64;
      const frequency = scale[(melodyStep + Math.floor(comboCount / 3)) % scale.length];
      const volume = Math.min(.052, .026 + Math.min(12, strength) * .0026);
      playBrush(ctx, now, .045, volume * .48, 1450 + Math.random() * 600, pan * .6);
      playPluck(ctx, frequency, now + Math.random() * .01, .34, volume, pan);
      if (comboCount >= 7) playBell(ctx, frequency * 1.5, now + .035, .28, volume * .48, -pan);
      return;
    }

    if (kind === "bloom") {
      bloomChord.forEach((frequency, index) => {
        playPluck(ctx, frequency, now + index * .045, .56, .052 - index * .006, (index - 1.5) * .12);
      });
      playBrush(ctx, now + .02, .18, .018, 2400, .12);
      playBell(ctx, 1318.51, now + .15, .75, .034, -.18);
      return;
    }

    if (kind === "shower") {
      for (let i = 0; i < 9; i += 1) {
        const frequency = scale[(i * 2 + melodyStep) % scale.length] * (i > 5 ? 1.5 : 1);
        playBell(ctx, frequency, now + i * .052 + Math.random() * .018, .68, .022, (i - 4) * .07);
      }
      playBrush(ctx, now, .42, .02, 3200, 0);
      return;
    }

    if (kind === "great") {
      [261.63, 392, 523.25, 659.25, 783.99].forEach((frequency, index) => {
        playPluck(ctx, frequency, now + index * .07, 1.05, .058 - index * .004, (index - 2) * .08);
      });
      [1046.5, 1318.51, 1567.98].forEach((frequency, index) => {
        playBell(ctx, frequency, now + .28 + index * .12, 1.1, .028, (index - 1) * .2);
      });
      playBrush(ctx, now + .12, .55, .026, 1800, 0);
      return;
    }

    playPluck(ctx, 523.25, now, .3, .028, pan);
  }

  function toggleSound() {
    state.soundOn = !state.soundOn;
    markDirty();
    if (state.soundOn) playTone("tap", 4);
    renderSound();
  }

  function renderSound() {
    if (!els.soundButton) return;
    els.soundButton.classList.toggle("off", !state.soundOn);
    els.soundButton.setAttribute("aria-label", state.soundOn ? "sound on" : "sound off");
  }

  function checkAchievements() {
    achievements.forEach(achievement => {
      if (!state.achievements.includes(achievement.id) && achievement.req(state)) {
        state.achievements.push(achievement.id);
      }
    });
  }

  function tap(event) {
    const gained = tapPower();
    const rect = els.seedButton.getBoundingClientRect();
    const x = event?.clientX || rect.left + rect.width / 2;
    const y = event?.clientY || rect.top + rect.height / 2;
    const now = Date.now();
    if (!state.firstTapAt) state.firstTapAt = now;
    comboCount = now - lastTapTime < 900 ? Math.min(99, comboCount + 1) : 1;
    lastTapTime = now;
    addLoops(state, gained);
    const meadow = addMeadowCare(gained);
    recordSporeBurst(gained);
    state.clicks += 1;
    addRushCharge(2 + Math.min(5, comboCount / 6));
    markDirty();
    checkAchievements();
    showPop(x, y, `+${format(gained)}`, comboCount);
    if (meadow.blooms > 0) {
      showPop(rect.left + rect.width / 2, rect.top + 24, `bloom +${format(meadow.reward)}`, comboCount + 8);
      playTone("bloom", comboCount);
    } else {
      playTone("tap", comboCount);
    }
    showSporeBurst(x, y);
    showTapImpact(x, y, rect, comboCount);
    pulseScene(meadow.blooms > 0 ? "scene-bloomed" : "scene-tapped");
    renderCombo();
    if (navigator.vibrate) navigator.vibrate(meadow.blooms > 0 ? [12, 18, 18] : 10);
    els.seedButton.classList.add("is-pressed");
    window.setTimeout(() => els.seedButton.classList.remove("is-pressed"), 320);
    render();
  }

  function showPop(x, y, text, combo = 1) {
    const pop = document.createElement("span");
    pop.className = `pop${combo >= 6 ? " pop-hot" : ""}`;
    pop.textContent = text;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    document.body.appendChild(pop);
    window.setTimeout(() => pop.remove(), 900);
  }

  function showTapImpact(x, y, rect, combo = 1) {
    const localX = Math.max(0, Math.min(rect.width, x - rect.left));
    const localY = Math.max(0, Math.min(rect.height, y - rect.top));
    const ring = document.createElement("span");
    ring.className = `tap-ring${combo >= 8 ? " hot" : ""}`;
    ring.style.left = `${localX}px`;
    ring.style.top = `${localY}px`;
    els.seedButton.appendChild(ring);

    const flash = document.createElement("span");
    flash.className = "tap-flash";
    els.seedButton.appendChild(flash);

    if (els.friendScene) {
      const sceneRect = els.friendScene.getBoundingClientRect();
      const pulse = document.createElement("span");
      pulse.className = `scene-pulse${combo >= 8 ? " hot" : ""}`;
      pulse.style.left = `${Math.max(0, Math.min(sceneRect.width, x - sceneRect.left))}px`;
      pulse.style.top = `${Math.max(0, Math.min(sceneRect.height, y - sceneRect.top))}px`;
      els.friendScene.appendChild(pulse);
      window.setTimeout(() => pulse.remove(), 720);
    }

    window.setTimeout(() => ring.remove(), 620);
    window.setTimeout(() => flash.remove(), 440);
  }

  function pulseScene(className) {
    if (!els.friendScene) return;
    els.friendScene.classList.remove("scene-tapped", "scene-bloomed");
    void els.friendScene.offsetWidth;
    els.friendScene.classList.add(className);
    window.setTimeout(() => els.friendScene.classList.remove(className), className === "scene-bloomed" ? 920 : 360);
  }

  function showSporeBurst(x, y) {
    const mobile = window.matchMedia("(max-width: 620px)").matches;
    const count = mobile ? 16 : 12;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.45;
      const distance = 44 + Math.random() * (mobile ? 86 : 74);
      const spore = document.createElement("span");
      const sparkle = i % 3 === 0;
      spore.className = `${sparkle ? "spore-spark" : "spore-pop"}${comboCount >= 8 && !sparkle ? " big" : ""}`;
      spore.style.left = `${x}px`;
      spore.style.top = `${y}px`;
      spore.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      spore.style.setProperty("--dy", `${Math.sin(angle) * distance - 28}px`);
      spore.style.setProperty("--spin", `${Math.random() * 220 - 110}deg`);
      spore.style.setProperty("--size", `${sparkle ? 7 + Math.random() * 9 : 7 + Math.random() * 11}px`);
      document.body.appendChild(spore);
      window.setTimeout(() => spore.remove(), 900);
    }
  }

  function exportSave() {
    const code = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    els.dialogTitle.textContent = "export save";
    els.dialogHelp.textContent = "Copy this save code somewhere safe.";
    els.saveText.value = code;
    els.loadSaveButton.style.display = "none";
    els.copySaveButton.style.display = "";
    els.saveDialog.showModal();
  }

  function importSave() {
    els.dialogTitle.textContent = "import save";
    els.dialogHelp.textContent = "Paste an Idle Shroom save code.";
    els.saveText.value = "";
    els.loadSaveButton.style.display = "";
    els.copySaveButton.style.display = "none";
    els.saveDialog.showModal();
  }

  function loadSaveCode() {
    try {
      const imported = JSON.parse(decodeURIComponent(escape(atob(els.saveText.value.trim()))));
      const fallback = defaultState();
      Object.keys(state).forEach(key => delete state[key]);
      Object.assign(state, fallback, imported);
      state.machines = { ...fallback.machines, ...(imported.machines || {}) };
      state.perks = { ...fallback.perks, ...(imported.perks || {}) };
      state.questBaselines = { ...fallback.questBaselines, ...(imported.questBaselines || {}) };
      state.upgrades = Array.isArray(imported.upgrades) ? imported.upgrades : [];
      state.achievements = Array.isArray(imported.achievements) ? imported.achievements : [];
      state.claimedQuests = Array.isArray(imported.claimedQuests) ? imported.claimedQuests : [];
      save();
      render();
      els.saveDialog.close();
    } catch {
      els.dialogHelp.textContent = "That save code did not load.";
    }
  }

  async function copySaveCode() {
    try {
      await navigator.clipboard.writeText(els.saveText.value);
      els.dialogHelp.textContent = "Copied.";
    } catch {
      els.saveText.select();
      document.execCommand("copy");
      els.dialogHelp.textContent = "Copied.";
    }
  }

  async function shareScore() {
    const text = `I grew ${format(state.lifetimeLoops)} lifetime spores in Idle Shroom. Play at https://idleshroom.aolabs.io/`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Idle Shroom", text, url: "https://idleshroom.aolabs.io/" });
        return;
      } catch {
        /* fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      els.saveState.textContent = "share copied";
    } catch {
      els.saveState.textContent = "share ready";
    }
  }

  function leaderboardEndpoint() {
    return String(onlineConfig.leaderboardEndpoint || "").trim();
  }

  function playerName() {
    return String(els.playerName.value || "").trim().slice(0, 18) || "local cap";
  }

  function playerId() {
    try {
      const existing = localStorage.getItem(playerIdKey);
      if (existing) return existing;
      const created = crypto.randomUUID ? crypto.randomUUID() : `player-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      localStorage.setItem(playerIdKey, created);
      return created;
    } catch {
      return `session-${Date.now().toString(36)}`;
    }
  }

  function scorePayload() {
    return {
      playerId: playerId(),
      name: playerName(),
      lifetimeSpores: Math.floor(state.lifetimeLoops),
      spores: Math.floor(state.loops),
      mycelium: Math.floor(state.rootstock),
      greatBlooms: Math.floor(state.bloomCount || 0),
      boops: Math.floor(state.clicks),
      sporesPerSecond: Number(incomePerSecond().toFixed(3)),
      fastestFirstBloomSeconds: Math.floor(state.bestFirstBloomSeconds || state.firstBloomSeconds || 0),
      updatedAt: new Date().toISOString()
    };
  }

  function sortLeaderboard(entries) {
    return entries
      .filter(entry => entry && typeof entry === "object")
      .sort((a, b) => {
        const bloomDiff = Number(b.greatBlooms || b.mycelium || 0) - Number(a.greatBlooms || a.mycelium || 0);
        if (bloomDiff) return bloomDiff;
        const myceliumDiff = Number(b.mycelium || 0) - Number(a.mycelium || 0);
        if (myceliumDiff) return myceliumDiff;
        return Number(b.lifetimeSpores || 0) - Number(a.lifetimeSpores || 0);
      })
      .slice(0, 10);
  }

  function loadLocalLeaderboard() {
    try {
      const entries = JSON.parse(localStorage.getItem(leaderboardKey) || "[]");
      return Array.isArray(entries) ? sortLeaderboard(entries) : [];
    } catch {
      return [];
    }
  }

  function saveLocalLeaderboard(entries) {
    localStorage.setItem(leaderboardKey, JSON.stringify(sortLeaderboard(entries)));
  }

  async function loadLeaderboard() {
    const endpoint = leaderboardEndpoint();
    if (!endpoint) {
      leaderboardEntries = loadLocalLeaderboard();
      leaderboardStatus = "local board";
      renderLeaderboard();
      return;
    }
    try {
      const response = await fetch(endpoint, { headers: { "Accept": "application/json" } });
      if (!response.ok) throw new Error("leaderboard unavailable");
      const data = await response.json();
      leaderboardEntries = sortLeaderboard(Array.isArray(data) ? data : data.scores || []);
      leaderboardStatus = "global board";
    } catch {
      leaderboardEntries = loadLocalLeaderboard();
      leaderboardStatus = "local fallback";
    }
    renderLeaderboard();
  }

  async function submitScore() {
    const payload = scorePayload();
    const endpoint = leaderboardEndpoint();
    leaderboardSubmitting = true;
    renderLeaderboard();
    if (endpoint) {
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error("score rejected");
        const data = await response.json();
        leaderboardEntries = sortLeaderboard(data.scores || []);
        leaderboardStatus = data.rank ? `rank #${data.rank}` : "score saved";
        leaderboardSubmitting = false;
        renderLeaderboard();
        window.setTimeout(() => {
          leaderboardStatus = "global board";
          renderLeaderboard();
        }, 1600);
        return;
      } catch {
        leaderboardStatus = "local fallback";
      }
    }
    leaderboardEntries = sortLeaderboard([...loadLocalLeaderboard(), payload]);
    saveLocalLeaderboard(leaderboardEntries);
    leaderboardSubmitting = false;
    renderLeaderboard();
  }

  function renderMachines() {
    els.machineList.innerHTML = machines.map(machine => {
      const cost = machineCost(machine);
      const count = Number(state.machines[machine.id] || 0);
      const disabled = state.loops < cost ? "disabled" : "";
      return `
        <article class="store-item">
          <div>
            <h3>${machine.name}</h3>
            <p>${machine.desc}</p>
            <span class="owned">${count} owned / ${format(machine.rate * rateMultiplier())} spores/sec each</span>
          </div>
          <button type="button" data-buy-machine="${machine.id}" ${disabled}>${format(cost)} spores</button>
        </article>
      `;
    }).join("");
  }

  function renderUpgrades() {
    const available = upgrades.filter(upgrade => !hasUpgrade(upgrade.id) && upgrade.req(state));
    if (!available.length) {
      els.upgradeList.innerHTML = `<article class="store-item"><div><h3>No charm ready</h3><p>Spend spores and grow meadow pieces to reveal the next charm.</p></div></article>`;
      return;
    }
    els.upgradeList.innerHTML = available.map(upgrade => {
      const disabled = state.loops < upgrade.cost ? "disabled" : "";
      return `
        <article class="store-item">
          <div>
            <h3>${upgrade.name}</h3>
            <p>${upgrade.desc}</p>
          </div>
          <button type="button" data-buy-upgrade="${upgrade.id}" ${disabled}>${format(upgrade.cost)} spores</button>
        </article>
      `;
    }).join("");
  }

  function renderPerks() {
    const active = perks.reduce((sum, perk) => sum + perkLevel(perk.id), 0);
    els.perkCount.textContent = `${format(state.rootstock)} mycelium / ${active} perks`;
    els.perkList.innerHTML = perks.map(perk => {
      const level = perkLevel(perk.id);
      const cost = perkCost(perk);
      const maxed = level >= perk.max;
      const disabled = maxed || state.rootstock < cost ? "disabled" : "";
      return `
        <article class="store-item">
          <div>
            <h3>${perk.name}</h3>
            <p>${perk.desc}</p>
            <span class="owned">level ${level}/${perk.max}</span>
          </div>
          <button type="button" data-buy-perk="${perk.id}" ${disabled}>${maxed ? "max" : `${format(cost)} mycelium`}</button>
        </article>
      `;
    }).join("");
  }

  function renderLeaderboard() {
    const endpoint = leaderboardEndpoint();
    els.leaderboardState.textContent = leaderboardStatus || (endpoint ? "global board" : "local board");
    els.submitScoreButton.disabled = leaderboardSubmitting;
    els.submitScoreButton.textContent = leaderboardSubmitting ? "submitting" : "submit score";
    if (!leaderboardEntries.length) {
      els.leaderboardList.innerHTML = `<article class="leaderboard-empty">No scores yet. Submit after a run.</article>`;
      return;
    }
    els.leaderboardList.innerHTML = sortLeaderboard(leaderboardEntries).map((entry, index) => `
      <article class="leaderboard-row">
        <strong>${index + 1}</strong>
        <span>${escapeHtml(entry.name || "local cap")}</span>
        <em>${format(entry.greatBlooms || 0)} blooms / ${format(entry.mycelium || 0)} mycelium / ${format(entry.lifetimeSpores || 0)} spores</em>
      </article>
    `).join("");
  }

  function renderAchievements() {
    els.achievementList.innerHTML = achievements.map(achievement => {
      const unlocked = state.achievements.includes(achievement.id);
      return `
        <article class="achievement ${unlocked ? "unlocked" : ""}">
          <span class="badge-dot" aria-hidden="true"></span>
          <div>
            <strong>${achievement.name}</strong>
            <span>${achievement.desc}</span>
          </div>
        </article>
      `;
    }).join("");
  }

  function renderOrchard() {
    const total = Math.min(24, Math.floor(ownedTotal() / 2) + (state.loops >= 100 ? 1 : 0));
    if (!els.orchardVisual.childElementCount) {
      els.orchardVisual.innerHTML = Array.from({ length: 24 }, () => `<span class="sprout"></span>`).join("");
    }
    Array.from(els.orchardVisual.children).forEach((child, index) => {
      child.classList.toggle("live", index < total);
    });
  }

  function renderCompanions() {
    if (!els.companionRow) return;
    if (!els.companionRow.childElementCount) {
      els.companionRow.innerHTML = Array.from({ length: 6 }, (_, index) => (
        `<span class="companion companion-${index + 1}"><i></i></span>`
      )).join("");
    }
    const active = Math.min(6, Math.max(1, Math.ceil((state.meadowLevel || 1) / 2) + Math.floor(ownedTotal() / 10)));
    Array.from(els.companionRow.children).forEach((child, index) => {
      child.classList.toggle("live", index < active);
    });
  }

  function renderDaily() {
    const ready = state.lastDaily !== todayKey();
    els.dailyReward.textContent = ready ? `${state.streak ? `${state.streak + 1}x streak` : "ready"}` : `${state.streak}x claimed`;
    els.dailyButton.disabled = !ready;
    if (els.dewSkillButton) {
      els.dewSkillButton.disabled = !ready;
      els.dewSkillButton.textContent = ready ? "dew" : "dew done";
      els.dewSkillButton.dataset.ready = ready ? "true" : "false";
    }
  }

  function renderPrestige() {
    const gain = graftGain();
    const required = bloomRequirement();
    const progress = Math.max(0, Math.min(1, state.totalLoops / required));
    els.rootstockValue.textContent = format(state.rootstock);
    els.prestigeProgress.style.width = `${Math.round(progress * 100)}%`;
    els.prestigeButton.disabled = gain <= 0;
    els.prestigeButton.textContent = gain > 0 ? `Great Bloom +${format(gain)}` : "Great Bloom";
    if (els.bloomSkillButton) {
      els.bloomSkillButton.disabled = gain <= 0;
      els.bloomSkillButton.textContent = gain > 0 ? `Bloom +${format(gain)}` : "Great Bloom";
      els.bloomSkillButton.dataset.ready = gain > 0 ? "true" : "false";
    }
    els.prestigeHint.textContent = gain > 0
      ? `Release this season for ${format(gain)} mycelium. Permanent perks stay.`
      : `Reach ${format(required)} run spores for Great Bloom ${format(Number(state.bloomCount || 0) + 1)}.`;
  }

  function renderFocus() {
    const remaining = Math.max(0, Number(state.focusUntil || 0) - Date.now());
    els.focusValue.textContent = remaining > 0 ? `${Math.ceil(remaining / 60000)}m left` : "inactive";
    els.focusButton.disabled = remaining > 0;
    els.focusButton.textContent = remaining > 0 ? "shower active" : "call shower";
    if (els.boostSkillButton) {
      els.boostSkillButton.disabled = remaining > 0;
      els.boostSkillButton.textContent = remaining > 0 ? `${Math.ceil(remaining / 60000)}m` : "shower";
      els.boostSkillButton.dataset.ready = remaining > 0 ? "active" : "true";
    }
  }

  function renderRush() {
    const remaining = rushRemaining();
    const charge = Math.max(0, Math.min(rushMax, Number(state.rushCharge || 0)));
    if (remaining > 0) {
      els.rushValue.textContent = `${Math.ceil(remaining / 1000)}s`;
      els.rushHint.textContent = "Spore Rush active: x3 spores/sec and x2 taps.";
      els.rushProgress.style.width = "100%";
      els.rushProgress.classList.add("rush-active");
      if (els.rushOrbit) {
        els.rushOrbit.style.setProperty("--rush", "100%");
        els.rushOrbit.classList.add("active");
      }
      return;
    }
    els.rushValue.textContent = `${Math.floor(charge)}%`;
    els.rushHint.textContent = "Tap, grow, claim, and call showers to fill the meter.";
    els.rushProgress.style.width = `${charge}%`;
    els.rushProgress.classList.remove("rush-active");
    if (els.rushOrbit) {
      els.rushOrbit.style.setProperty("--rush", `${charge}%`);
      els.rushOrbit.classList.remove("active");
    }
  }

  function renderMeadow() {
    const required = meadowRequirement();
    const bloom = Math.max(0, Number(state.meadowBloom || 0));
    const progress = Math.max(0, Math.min(1, bloom / required));
    const tutorial = tutorialStage();
    els.meadowValue.textContent = `meadow ${format(state.meadowLevel || 1)}`;
    els.sessionMeadowValue.textContent = format(state.meadowLevel || 1);
    els.meadowName.textContent = meadowTitle();
    els.meadowMood.textContent = meadowMood();
    els.bloomProgress.style.width = `${Math.round(progress * 100)}%`;
    els.bloomNeed.textContent = `${format(Math.max(0, required - bloom))} care`;
    if (els.nextBloomName) els.nextBloomName.textContent = tutorial.next || `next: ${meadowTitle(state, 1)}`;
    if (els.rootRing) {
      els.rootRing.style.setProperty("--bloom", `${Math.round(progress * 100)}%`);
      els.rootRing.classList.toggle("ready", progress >= 0.98);
    }
    const mood = meadowMood();
    document.body.dataset.meadowMood = mood.replace(/\s+/g, "-");
    document.body.dataset.tutorial = tutorial.id;
    if (els.friendScene) {
      els.friendScene.dataset.mood = mood;
      els.friendScene.setAttribute("aria-label", `${meadowTitle()} ${mood}`);
    }
  }

  function renderQuests() {
    const quests = questDefinitions();
    const claimed = quests.filter(quest => state.claimedQuests.includes(quest.id)).length;
    els.questState.textContent = `${claimed}/${quests.length} claimed`;
    els.questList.innerHTML = quests.map(quest => {
      const done = quest.current >= quest.target;
      const claimedQuest = state.claimedQuests.includes(quest.id);
      const progress = Math.max(0, Math.min(1, quest.current / quest.target));
      return `
        <article class="quest-item ${done ? "ready" : ""} ${claimedQuest ? "claimed" : ""}">
          <div>
            <h3>${quest.name}</h3>
            <p>${quest.desc}</p>
            <span class="owned">${format(Math.min(quest.current, quest.target))}/${format(quest.target)} / reward ${format(quest.reward)} spores</span>
            <div class="mini-progress" aria-hidden="true"><span style="width:${Math.round(progress * 100)}%"></span></div>
          </div>
          <button type="button" data-claim-quest="${quest.id}" ${!done || claimedQuest ? "disabled" : ""}>${claimedQuest ? "claimed" : "claim"}</button>
        </article>
      `;
    }).join("");
  }

  function render() {
    els.loopsValue.textContent = format(state.loops);
    els.rateValue.textContent = format(displayedRate);
    els.baseRateValue.textContent = `base ${format(incomePerSecond())}`;
    els.tapValue.textContent = format(state.clicks);
    els.clicksValue.textContent = format(state.clicks);
    els.runValue.textContent = format(state.totalLoops);
    els.lifetimeValue.textContent = format(state.lifetimeLoops);
    els.multiplierValue.textContent = `${rateMultiplier().toFixed(rateMultiplier() >= 10 ? 1 : 2)}x`;
    els.machineCount.textContent = "spend spores";
    els.upgradeCount.textContent = `${state.upgrades.length} active`;
    els.achievementCount.textContent = `${state.achievements.length} unlocked`;
    renderMachines();
    renderUpgrades();
    renderPerks();
    renderAchievements();
    renderOrchard();
    renderCompanions();
    renderDaily();
    renderMeadow();
    renderPrestige();
    renderFocus();
    renderRush();
    renderQuests();
    renderLeaderboard();
    renderSound();
  }

  function tick() {
    const now = Date.now();
    const dt = Math.min(5, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;
    const earned = incomePerSecond() * dt;
    if (earned > 0) {
      addLoops(state, earned);
      addMeadowCare(earned * 0.08);
      markDirty();
      checkAchievements();
    }
    updateDisplayedRate(dt);
    render();
  }

  els.seedButton.addEventListener("click", tap);
  els.machineList.addEventListener("click", event => {
    const id = event.target.closest("button")?.dataset.buyMachine;
    if (id) buyMachine(id);
  });
  els.upgradeList.addEventListener("click", event => {
    const id = event.target.closest("button")?.dataset.buyUpgrade;
    if (id) buyUpgrade(id);
  });
  els.perkList.addEventListener("click", event => {
    const id = event.target.closest("button")?.dataset.buyPerk;
    if (id) buyPerk(id);
  });
  els.questList.addEventListener("click", event => {
    const id = event.target.closest("button")?.dataset.claimQuest;
    if (id) claimQuest(id);
  });
  els.prestigeButton.addEventListener("click", graft);
  els.dailyButton.addEventListener("click", claimDaily);
  els.focusButton.addEventListener("click", useFocus);
  els.dewSkillButton.addEventListener("click", claimDaily);
  els.boostSkillButton.addEventListener("click", useFocus);
  els.bloomSkillButton.addEventListener("click", graft);
  if (els.soundButton) els.soundButton.addEventListener("click", toggleSound);
  els.shareButton.addEventListener("click", shareScore);
  els.exportButton.addEventListener("click", exportSave);
  els.importButton.addEventListener("click", importSave);
  els.copySaveButton.addEventListener("click", copySaveCode);
  els.loadSaveButton.addEventListener("click", loadSaveCode);
  els.submitScoreButton.addEventListener("click", submitScore);
  if (els.bottomTabs) {
    els.bottomTabs.addEventListener("click", event => {
      const tab = event.target.closest("button")?.dataset.tabTarget;
      if (tab) setScreen(tab);
    });
  }

  window.addEventListener("beforeunload", save);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });

  checkAchievements();
  setScreen(document.body.dataset.tab);
  loadLeaderboard();
  render();
  window.setInterval(tick, 1000);
  window.setInterval(() => { if (dirty) save(); }, 5000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
})();
