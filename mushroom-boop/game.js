(function () {
  "use strict";

  const saveKey = "mushroom-boop-save-v1";
  const leaderboardKey = "mushroom-boop-leaderboard-v1";
  const playerIdKey = "mushroom-boop-player-id-v1";
  const maxOfflineSeconds = 8 * 60 * 60;
  const bloomThreshold = 25000;
  const rushMax = 100;
  const rushSeconds = 20;
  const onlineConfig = window.MUSHROOM_BOOP_ONLINE || {};

  const machines = [
    { id: "plot", name: "Baby cap", base: 15, scale: 1.16, rate: 0.1, desc: "A tiny mushroom that releases a slow spore puff." },
    { id: "press", name: "Dew cup", base: 90, scale: 1.17, rate: 0.75, desc: "A leaf cup that feeds caps with steady morning dew." },
    { id: "clock", name: "Moss bed", base: 520, scale: 1.18, rate: 4.4, desc: "Soft moss where spores settle and sprout faster." },
    { id: "collector", name: "Fairy ring", base: 3200, scale: 1.19, rate: 23, desc: "A circle of caps that multiplies steady colony growth." },
    { id: "greenhouse", name: "Glowcap cluster", base: 18000, scale: 1.2, rate: 130, desc: "Bright caps that keep the colony fruiting at night." },
    { id: "rail", name: "Mycelium web", base: 112000, scale: 1.21, rate: 820, desc: "Underground threads that move nutrients across the colony." },
    { id: "relay", name: "Moonlit grove", base: 720000, scale: 1.22, rate: 5200, desc: "A late-game grove that releases huge moonlit spore clouds." }
  ];

  const upgrades = [
    { id: "tap-2", name: "Soft boop", cost: 120, req: state => state.totalLoops >= 80, desc: "Boop power x2.", kind: "tap", value: 2 },
    { id: "rate-1", name: "Damp moss", cost: 850, req: state => ownedTotal(state) >= 12, desc: "Colony output x1.5.", kind: "rate", value: 1.5 },
    { id: "tap-5", name: "Cap pat", cost: 5200, req: state => state.clicks >= 180, desc: "Boop power x2.5.", kind: "tap", value: 2.5 },
    { id: "rate-2", name: "Dew veins", cost: 36000, req: state => state.totalLoops >= 18000, desc: "Colony output x2.", kind: "rate", value: 2 },
    { id: "tap-rate", name: "Spore trail", cost: 160000, req: state => state.machines.press >= 12, desc: "Boop power grows with dew cups.", kind: "tapRoute", value: 0.08 },
    { id: "rate-3", name: "Moon glow", cost: 880000, req: state => state.totalLoops >= 420000, desc: "Colony output x2.25.", kind: "rate", value: 2.25 },
    { id: "prestige-soft", name: "Deep mycelium", cost: 4200000, req: state => state.rootstock >= 3, desc: "Mycelium bonus is stronger.", kind: "root", value: 0.08 }
  ];

  const achievements = [
    { id: "first-tap", name: "First spore", desc: "Boop once.", req: state => state.clicks >= 1 },
    { id: "hundred", name: "Hundred spores", desc: "Earn 100 lifetime spores.", req: state => state.lifetimeLoops >= 100 },
    { id: "machine-ten", name: "Tiny colony", desc: "Own 10 colony pieces.", req: state => ownedTotal(state) >= 10 },
    { id: "clicker", name: "Boop rhythm", desc: "Boop 250 times.", req: state => state.clicks >= 250 },
    { id: "million", name: "Million-spore meadow", desc: "Earn 1,000,000 lifetime spores.", req: state => state.lifetimeLoops >= 1000000 },
    { id: "rooted", name: "Mycelium", desc: "Bloom the colony once.", req: state => state.rootstock >= 1 },
    { id: "return", name: "Daily dew", desc: "Claim a daily dew reward.", req: state => state.dailyClaims >= 1 },
    { id: "rush", name: "Cap rush", desc: "Trigger a cap rush.", req: state => state.rushes >= 1 },
    { id: "quest", name: "Quest sprout", desc: "Claim a daily quest.", req: state => state.questsClaimed >= 1 }
  ];

  const perks = [
    { id: "spore-memory", name: "Spore memory", baseCost: 1, max: 10, desc: "Baseline spores/sec +18% per level." },
    { id: "soft-hands", name: "Soft hands", baseCost: 1, max: 10, desc: "Boop power +25% per level." },
    { id: "cheap-caps", name: "Frugal moss", baseCost: 2, max: 8, desc: "Colony pieces cost 6% less per level." },
    { id: "long-boost", name: "Long glow", baseCost: 2, max: 5, desc: "Reward boost lasts 2 more minutes per level." },
    { id: "starter-cap", name: "Starter cap", baseCost: 3, max: 1, desc: "Each bloom starts with one Baby cap." }
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

  const els = {};
  [
    "loopsValue", "rateValue", "baseRateValue", "tapValue", "seedButton", "orchardVisual", "machineList",
    "comboBadge",
    "upgradeList", "rootstockValue", "prestigeHint", "prestigeProgress", "prestigeButton", "dailyReward",
    "dailyButton", "focusValue", "focusButton", "boostHint", "machineCount", "upgradeCount",
    "rushValue", "rushHint", "rushProgress", "questState", "questList",
    "perkCount", "perkList", "leaderboardState", "leaderboardList", "playerName", "submitScoreButton",
    "achievementCount", "achievementList", "clicksValue", "runValue", "lifetimeValue",
    "multiplierValue", "shareButton", "exportButton", "importButton", "saveDialog",
    "saveText", "dialogTitle", "dialogHelp", "copySaveButton", "loadSaveButton", "saveState",
    "bottomTabs"
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
    return bloomThreshold * Math.pow(1.72, Number(target.rootstock || 0));
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
    state.rootstock += gain;
    state.loops = 0;
    state.totalLoops = 0;
    state.clicks = 0;
    state.focusUntil = 0;
    state.rushCharge = 0;
    state.rushUntil = 0;
    state.machines = keep.machines;
    state.perks = keptPerks;
    state.upgrades = [];
    state.achievements = keptAchievements;
    if (perkLevel("starter-cap", state) > 0) {
      state.machines.plot = 1;
      displayedRate = incomePerSecond();
    }
    clickRateBurst = 0;
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
    const boopTarget = 65 + Math.min(135, Number(state.rootstock || 0) * 10);
    const pieceTarget = Math.max(3, Math.min(18, 5 + Number(state.rootstock || 0)));
    const sporeTarget = Math.max(900, bloomRequirement() * 0.1);
    return [
      {
        id: "boops",
        name: "Boop burst",
        desc: `Boop ${format(boopTarget)} times today.`,
        current: Math.max(0, Number(state.clicks || 0) - Number(base.clicks || 0)),
        target: boopTarget,
        reward: Math.max(180, tapPower() * boopTarget * 2.5)
      },
      {
        id: "pieces",
        name: "Grow the grove",
        desc: `Buy ${format(pieceTarget)} colony pieces today.`,
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
    els.focusButton.textContent = "loading ad";
    const result = await requestRewardedBoost().catch(() => ({ rewarded: false }));
    if (!result.rewarded) {
      els.boostHint.textContent = "Reward ad was not completed. Boost stayed inactive.";
      renderFocus();
      return;
    }
    const boostMinutes = 10 + perkLevel("long-boost") * 2;
    state.focusUntil = now + boostMinutes * 60 * 1000;
    addRushCharge(35);
    displayedRate = Math.max(displayedRate, incomePerSecond());
    els.boostHint.textContent = result.demo
      ? "Demo boost active. Configure rewarded AdMob IDs before App Store release."
      : "Reward boost active.";
    markDirty();
    checkAchievements();
    render();
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
    comboCount = now - lastTapTime < 900 ? Math.min(99, comboCount + 1) : 1;
    lastTapTime = now;
    addLoops(state, gained);
    recordSporeBurst(gained);
    state.clicks += 1;
    addRushCharge(2 + Math.min(5, comboCount / 6));
    markDirty();
    checkAchievements();
    showPop(x, y, `+${format(gained)}`, comboCount);
    showSporeBurst(x, y);
    showTapImpact(x, y, rect, comboCount);
    renderCombo();
    if (navigator.vibrate) navigator.vibrate(10);
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

    window.setTimeout(() => ring.remove(), 620);
    window.setTimeout(() => flash.remove(), 440);
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
      boops: Math.floor(state.clicks),
      sporesPerSecond: Number(incomePerSecond().toFixed(3)),
      updatedAt: new Date().toISOString()
    };
  }

  function sortLeaderboard(entries) {
    return entries
      .filter(entry => entry && typeof entry === "object")
      .sort((a, b) => {
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
      els.upgradeList.innerHTML = `<article class="store-item"><div><h3>No charm ready</h3><p>Spend spores and grow colony pieces to reveal the next charm.</p></div></article>`;
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
    els.perkCount.textContent = `${active} active`;
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
        <em>${format(entry.mycelium || 0)} mycelium / ${format(entry.lifetimeSpores || 0)} spores / ${format(entry.sporesPerSecond || 0)}/s</em>
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

  function renderDaily() {
    const ready = state.lastDaily !== todayKey();
    els.dailyReward.textContent = ready ? `${state.streak ? `${state.streak + 1}x streak` : "ready"}` : `${state.streak}x claimed`;
    els.dailyButton.disabled = !ready;
  }

  function renderPrestige() {
    const gain = graftGain();
    const required = bloomRequirement();
    const progress = Math.max(0, Math.min(1, state.totalLoops / required));
    els.rootstockValue.textContent = format(state.rootstock);
    els.prestigeProgress.style.width = `${Math.round(progress * 100)}%`;
    els.prestigeButton.disabled = gain <= 0;
    els.prestigeButton.textContent = gain > 0 ? `bloom +${format(gain)}` : "bloom";
    els.prestigeHint.textContent = gain > 0
      ? `Reset for ${format(gain)} mycelium. Spend mycelium on permanent perks below.`
      : `Reach ${format(required)} spores this run to bloom the colony.`;
  }

  function renderFocus() {
    const remaining = Math.max(0, Number(state.focusUntil || 0) - Date.now());
    els.focusValue.textContent = remaining > 0 ? `${Math.ceil(remaining / 60000)}m left` : "inactive";
    els.focusButton.disabled = remaining > 0;
    els.focusButton.textContent = remaining > 0 ? "boost active" : "watch ad for boost";
  }

  function renderRush() {
    const remaining = rushRemaining();
    const charge = Math.max(0, Math.min(rushMax, Number(state.rushCharge || 0)));
    if (remaining > 0) {
      els.rushValue.textContent = `${Math.ceil(remaining / 1000)}s`;
      els.rushHint.textContent = "Cap rush active: x3 spores/sec and x2 boops.";
      els.rushProgress.style.width = "100%";
      els.rushProgress.classList.add("rush-active");
      return;
    }
    els.rushValue.textContent = `${Math.floor(charge)}%`;
    els.rushHint.textContent = "Tap, buy, claim, and boost to fill the meter.";
    els.rushProgress.style.width = `${charge}%`;
    els.rushProgress.classList.remove("rush-active");
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
    renderDaily();
    renderPrestige();
    renderFocus();
    renderRush();
    renderQuests();
    renderLeaderboard();
  }

  function tick() {
    const now = Date.now();
    const dt = Math.min(5, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;
    const earned = incomePerSecond() * dt;
    if (earned > 0) {
      addLoops(state, earned);
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
