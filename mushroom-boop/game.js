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
  const testPlayMode = new URLSearchParams(window.location.search).has("testplay");
  const publicGameUrl = window.location.hostname === "idleshroom.aolabs.io"
    ? "https://idleshroom.aolabs.io/"
    : "https://aolabs.io/idleshroom/";
  const environments = [
    { id: "sleeping-cap", name: "Sleeping Cap", biome: "morning" },
    { id: "dew-cap", name: "Dew Cap", biome: "morning" },
    { id: "tiny-grove", name: "Tiny Grove", biome: "grove" },
    { id: "lantern-ring", name: "Lantern Ring", biome: "lantern" },
    { id: "puff-meadow", name: "Puff Meadow", biome: "grove" },
    { id: "mooncap-hollow", name: "Mooncap Hollow", biome: "moon" },
    { id: "sporefall-garden", name: "Sporefall Garden", biome: "rain" },
    { id: "glowroot-village", name: "Glowroot Village", biome: "glow" },
    { id: "starcap-forest", name: "Starcap Forest", biome: "star" },
    { id: "rainwhisper-vale", name: "Rainwhisper Vale", biome: "rain" },
    { id: "honeycap-field", name: "Honeycap Field", biome: "honey" },
    { id: "mossbell-steps", name: "Mossbell Steps", biome: "grove" },
    { id: "velvet-hollow", name: "Velvet Hollow", biome: "velvet" },
    { id: "firefly-fen", name: "Firefly Fen", biome: "lantern" },
    { id: "bluecap-brook", name: "Bluecap Brook", biome: "brook" },
    { id: "sunspore-terrace", name: "Sunspore Terrace", biome: "honey" },
    { id: "cloudcap-ridge", name: "Cloudcap Ridge", biome: "cloud" },
    { id: "crystal-root", name: "Crystal Root", biome: "crystal" },
    { id: "ambercap-glade", name: "Ambercap Glade", biome: "honey" },
    { id: "dreamcap-pond", name: "Dreamcap Pond", biome: "brook" },
    { id: "aurora-mycelium", name: "Aurora Mycelium", biome: "aurora" },
    { id: "sugarcap-orchard", name: "Sugarcap Orchard", biome: "velvet" },
    { id: "bellcap-basin", name: "Bellcap Basin", biome: "brook" },
    { id: "wishroot-wood", name: "Wishroot Wood", biome: "star" },
    { id: "silver-spore-coast", name: "Silver Spore Coast", biome: "moon" },
    { id: "comet-cap-camp", name: "Comet Cap Camp", biome: "star" },
    { id: "prismcap-garden", name: "Prismcap Garden", biome: "crystal" },
    { id: "velvet-rainforest", name: "Velvet Rainforest", biome: "rain" },
    { id: "starlit-burrow", name: "Starlit Burrow", biome: "moon" },
    { id: "golden-spore-sea", name: "Golden Spore Sea", biome: "honey" },
    { id: "buttercap-crossing", name: "Buttercap Crossing", biome: "honey" },
    { id: "misty-morel-marsh", name: "Misty Morel Marsh", biome: "rain" },
    { id: "pebblecap-path", name: "Pebblecap Path", biome: "grove" },
    { id: "lullaby-log", name: "Lullaby Log", biome: "morning" },
    { id: "ribbonroot-ravine", name: "Ribbonroot Ravine", biome: "aurora" },
    { id: "cherrycap-grove", name: "Cherrycap Grove", biome: "velvet" },
    { id: "fiddlehead-fen", name: "Fiddlehead Fen", biome: "brook" },
    { id: "softlight-steppe", name: "Softlight Steppe", biome: "cloud" },
    { id: "bubblecap-bay", name: "Bubblecap Bay", biome: "brook" },
    { id: "embermoss-hollow", name: "Embermoss Hollow", biome: "lantern" },
    { id: "lumenleaf-loop", name: "Lumenleaf Loop", biome: "glow" },
    { id: "cocoa-cap-copse", name: "Cocoa Cap Copse", biome: "ancient" },
    { id: "snowdrop-sporefield", name: "Snowdrop Sporefield", biome: "cloud" },
    { id: "violetcap-vale", name: "Violetcap Vale", biome: "velvet" },
    { id: "taffycap-terrace", name: "Taffycap Terrace", biome: "honey" },
    { id: "willowspore-woods", name: "Willowspore Woods", biome: "grove" },
    { id: "teacup-hollow", name: "Teacup Hollow", biome: "morning" },
    { id: "marmalade-moss", name: "Marmalade Moss", biome: "honey" },
    { id: "raindrop-rootworks", name: "Raindrop Rootworks", biome: "rain" },
    { id: "pearlcap-pier", name: "Pearlcap Pier", biome: "brook" },
    { id: "satin-spore-glade", name: "Satin Spore Glade", biome: "velvet" },
    { id: "echo-cap-canyon", name: "Echo Cap Canyon", biome: "star" },
    { id: "honeydew-heights", name: "Honeydew Heights", biome: "honey" },
    { id: "lacecap-lagoon", name: "Lacecap Lagoon", biome: "brook" },
    { id: "cottoncap-cloudbank", name: "Cottoncap Cloudbank", biome: "cloud" },
    { id: "opal-root-grove", name: "Opal Root Grove", biome: "crystal" },
    { id: "firefly-orchard", name: "Firefly Orchard", biome: "lantern" },
    { id: "wishcap-waterfall", name: "Wishcap Waterfall", biome: "rain" },
    { id: "moonmilk-meadow", name: "Moonmilk Meadow", biome: "moon" },
    { id: "crystalcake-cavern", name: "Crystalcake Cavern", biome: "crystal" },
    { id: "sunbeam-sporehouse", name: "Sunbeam Sporehouse", biome: "honey" },
    { id: "velvet-star-nursery", name: "Velvet Star Nursery", biome: "aurora" },
    { id: "ancient-mycelium", name: "Ancient Mycelium", biome: "ancient" },
    { id: "forever-bloom", name: "Forever Bloom", biome: "aurora" }
  ];
  const meadowNames = environments.map(environment => environment.name);
  const clickMilestones = [
    { id: "wake", clicks: 10, name: "Dew freckles", reward: 28 },
    { id: "root-hum", clicks: 50, name: "Root hum", reward: 120 },
    { id: "first-chorus", clicks: 150, name: "Tiny chorus", reward: 520 },
    { id: "soft-glow", clicks: 300, name: "Soft glow", reward: 1800 },
    { id: "lantern-wake", clicks: 600, name: "Lantern wake", reward: 7200 },
    { id: "puff-parade", clicks: 1000, name: "Puff parade", reward: 26000 },
    { id: "moon-bells", clicks: 1500, name: "Moon bells", reward: 90000 },
    { id: "sporefall", clicks: 2500, name: "Sporefall", reward: 340000 },
    { id: "root-fireworks", clicks: 4000, name: "Root fireworks", reward: 1200000 },
    { id: "aurora-path", clicks: 6500, name: "Aurora path", reward: 4600000 },
    { id: "prism-rain", clicks: 10000, name: "Prism rain", reward: 18000000 },
    { id: "forever-garden", clicks: 15000, name: "Forever garden", reward: 72000000 },
    { id: "silver-season", clicks: 25000, name: "Silver season", reward: 290000000 },
    { id: "golden-season", clicks: 40000, name: "Golden season", reward: 1200000000 },
    { id: "ancient-season", clicks: 65000, name: "Ancient season", reward: 5200000000 },
    { id: "endless-season", clicks: 100000, name: "Endless season", reward: 24000000000 }
  ];

  const machines = [
    { id: "plot", name: "Root thread", base: 15, scale: 1.16, rate: 0.1, desc: "A soft root line that releases a slow spore pulse." },
    { id: "press", name: "Dew cup", base: 90, scale: 1.17, rate: 0.75, desc: "A leaf cup that feeds the cap with morning dew." },
    { id: "clock", name: "Lantern cap", base: 520, scale: 1.18, rate: 4.4, desc: "A glowing cap that keeps spores drifting at night." },
    { id: "collector", name: "Friend burrow", base: 3200, scale: 1.19, rate: 23, desc: "A tiny home where meadow helpers gather and nudge spores along." },
    { id: "greenhouse", name: "Rainleaf canopy", base: 18000, scale: 1.2, rate: 130, desc: "A broad leaf canopy that turns rain into spore showers." },
    { id: "rail", name: "Glowroot web", base: 112000, scale: 1.21, rate: 820, desc: "Bright mycelium paths that carry nutrients through the meadow." },
    { id: "relay", name: "Moonspore hollow", base: 720000, scale: 1.22, rate: 5200, desc: "A moonlit hollow that releases huge sleepy spore clouds." },
    { id: "bell", name: "Bellcap choir", base: 4800000, scale: 1.23, rate: 33000, desc: "A circle of tiny bells that chimes spores through the roots." },
    { id: "spring", name: "Dreamspring pool", base: 32000000, scale: 1.24, rate: 210000, desc: "A glowing pool that turns quiet idle time into drifting spores." },
    { id: "observatory", name: "Starcap observatory", base: 230000000, scale: 1.25, rate: 1400000, desc: "A little hilltop lens that catches constellations for the meadow." },
    { id: "aurora", name: "Aurora rootway", base: 1900000000, scale: 1.26, rate: 9500000, desc: "A ribbon of roots that keeps the whole forest shimmering." },
    { id: "heartwood", name: "Heartwood grove", base: 15000000000, scale: 1.27, rate: 65000000, desc: "An ancient warm grove that grows spores even through long breaks." }
  ];

  const machineArt = {
    plot: { className: "root-thread", label: "tiny root" },
    press: { className: "dew-cup", label: "dew cup" },
    clock: { className: "lantern-cap", label: "lantern cap" },
    collector: { className: "friend-burrow", label: "friend burrow" },
    greenhouse: { className: "rainleaf-canopy", label: "rainleaf" },
    rail: { className: "glowroot-web", label: "glowroot" },
    relay: { className: "moonspore-hollow", label: "moon hollow" },
    bell: { className: "bellcap-choir", label: "bellcap choir" },
    spring: { className: "dreamspring-pool", label: "dreamspring" },
    observatory: { className: "starcap-observatory", label: "starcap observatory" },
    aurora: { className: "aurora-rootway", label: "aurora rootway" },
    heartwood: { className: "heartwood-grove", label: "heartwood grove" }
  };

  const friendArt = {
    boops: { name: "Dew Beetle", className: "dew-beetle", promise: "Keeps the tap chorus bright." },
    pieces: { name: "Lantern Moth", className: "lantern-moth", promise: "Guides new meadow pieces home." },
    spores: { name: "Puff Sprite", className: "puff-sprite", promise: "Carries big spore clouds." }
  };

  const upgrades = [
    { id: "tap-2", name: "Dew touch", cost: 120, req: state => state.totalLoops >= 80, desc: "Each tap sends twice as many spores through the roots.", kind: "tap", value: 2 },
    { id: "rate-1", name: "Root chorus", cost: 850, req: state => ownedTotal(state) >= 12, desc: "Roots hum together for 1.5x spores/sec.", kind: "rate", value: 1.5 },
    { id: "tap-5", name: "Soft cap rhythm", cost: 5200, req: state => state.clicks >= 180, desc: "Tap power x2.5 when the cap is awake.", kind: "tap", value: 2.5 },
    { id: "rate-2", name: "Lantern pollen", cost: 36000, req: state => state.totalLoops >= 18000, desc: "Lantern caps double passive spores/sec.", kind: "rate", value: 2 },
    { id: "tap-rate", name: "Dewline trail", cost: 160000, req: state => state.machines.press >= 12, desc: "Tap power grows with every Dew cup.", kind: "tapRoute", value: 0.08 },
    { id: "rate-3", name: "Moonroot glow", cost: 880000, req: state => state.totalLoops >= 420000, desc: "Moonlit roots boost spores/sec x2.25.", kind: "rate", value: 2.25 },
    { id: "prestige-soft", name: "Ancient mycelium", cost: 4200000, req: state => state.rootstock >= 3, desc: "Great Bloom mycelium perks become stronger.", kind: "root", value: 0.08 },
    { id: "tap-echo", name: "Cap echo", cost: 12000000, req: state => state.clicks >= 1500, desc: "Every tap lands with a brighter echo. Tap power x2.2.", kind: "tap", value: 2.2 },
    { id: "rate-4", name: "Bellcap rhythm", cost: 42000000, req: state => Number(state.machines.bell || 0) >= 1, desc: "Bellcap choirs keep spores/sec x2.6.", kind: "rate", value: 2.6 },
    { id: "tap-route-2", name: "Dreamline trail", cost: 180000000, req: state => state.clicks >= 4000, desc: "Tap power grows with every Dreamspring pool.", kind: "tapMachine", machine: "spring", value: 0.12 },
    { id: "rate-5", name: "Aurora canopy", cost: 900000000, req: state => Number(state.meadowLevel || 1) >= 20, desc: "Aurora environments multiply spores/sec x3.", kind: "rate", value: 3 },
    { id: "tap-aurora", name: "Prism touch", cost: 5200000000, req: state => state.clicks >= 10000, desc: "Late-game taps glow harder. Tap power x3.", kind: "tap", value: 3 },
    { id: "rate-6", name: "Heartwood memory", cost: 22000000000, req: state => Number(state.machines.heartwood || 0) >= 1, desc: "Heartwood groves multiply spores/sec x3.5.", kind: "rate", value: 3.5 }
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
    { id: "quest", name: "Quest sprout", desc: "Claim a daily quest.", req: state => state.questsClaimed >= 1 },
    { id: "click-1000", name: "Thousand taps", desc: "Tap 1,000 times.", req: state => state.clicks >= 1000 },
    { id: "click-5000", name: "Five-thousand rhythm", desc: "Tap 5,000 times.", req: state => state.clicks >= 5000 },
    { id: "click-10000", name: "Ten-thousand shimmer", desc: "Tap 10,000 times.", req: state => state.clicks >= 10000 },
    { id: "env-16", name: "Far meadow", desc: "Reach environment 16.", req: state => Number(state.meadowLevel || 1) >= 16 },
    { id: "env-32", name: "Forever map", desc: "Reach environment 32.", req: state => Number(state.meadowLevel || 1) >= 32 },
    { id: "combo-25", name: "Cap rhythm", desc: "Reach a 25 tap combo.", req: state => Number(state.maxCombo || 0) >= 25 },
    { id: "combo-75", name: "Spore drummer", desc: "Reach a 75 tap combo.", req: state => Number(state.maxCombo || 0) >= 75 },
    { id: "machine-50", name: "Busy meadow", desc: "Own 50 meadow pieces.", req: state => ownedTotal(state) >= 50 },
    { id: "machine-150", name: "Tiny city", desc: "Own 150 meadow pieces.", req: state => ownedTotal(state) >= 150 },
    { id: "rate-100", name: "Soft engine", desc: "Reach 100 spores/sec.", req: state => incomePerSecond(state) >= 100 },
    { id: "rate-10k", name: "Root weather", desc: "Reach 10,000 spores/sec.", req: state => incomePerSecond(state) >= 10000 },
    { id: "bloom-3", name: "Third season", desc: "Great Bloom 3 times.", req: state => Number(state.bloomCount || 0) >= 3 },
    { id: "bloom-10", name: "Ancient seasons", desc: "Great Bloom 10 times.", req: state => Number(state.bloomCount || 0) >= 10 },
    { id: "streak-3", name: "Dew habit", desc: "Keep a 3 day dew streak.", req: state => Number(state.streak || 0) >= 3 },
    { id: "quest-day", name: "Friend day", desc: "Claim all 3 friend quests in a day.", req: state => Number(state.claimedQuests?.length || 0) >= 3 },
    { id: "rush-10", name: "Rush garden", desc: "Trigger 10 Spore Rushes.", req: state => Number(state.rushes || 0) >= 10 },
    { id: "env-64", name: "Full atlas", desc: "Reach environment 64.", req: state => Number(state.meadowLevel || 1) >= 64 }
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
  let ambientTimer = 0;
  let ambientStep = 0;
  let coreRenderQueued = false;
  let pressTimer = 0;
  let releaseLiftTimer = 0;
  let releaseSettleTimer = 0;
  let lastScenePulseAt = 0;
  let momentTimer = 0;
  let lastPointerTapAt = 0;

  const els = {};
  [
    "loopsValue", "rateValue", "tapValue", "nextGoalButton", "goalProgress", "seedButton", "orchardVisual", "machineList",
    "comboBadge",
    "upgradeList", "rootstockValue", "prestigeHint", "prestigeProgress", "prestigeButton", "dailyReward",
    "dailyButton", "focusValue", "focusButton", "boostHint", "machineCount", "upgradeCount",
    "rushValue", "rushHint", "rushProgress", "questState", "questList",
    "perkCount", "perkList", "leaderboardState", "leaderboardList", "playerName", "submitScoreButton",
    "achievementCount", "achievementList", "clicksValue", "runValue", "lifetimeValue", "seasonValue",
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
    if (next !== "play") {
      document.querySelector(".moment-banner")?.remove();
    }
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
      maxCombo: 0,
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
      claimedClickMilestones: [],
      questsClaimed: 0,
      offlineReward: 0,
      offlineSeconds: 0,
      lastReadyAction: "",
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
      merged.claimedClickMilestones = Array.isArray(parsed.claimedClickMilestones) ? parsed.claimedClickMilestones : [];
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
    if (earned > 0) {
      addLoops(target, earned);
      target.offlineReward = earned;
      target.offlineSeconds = elapsed;
    }
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

  function formatDuration(seconds) {
    const value = Math.max(0, Number(seconds) || 0);
    if (value < 90) return `${Math.round(value)}s`;
    if (value < 5400) return `${Math.round(value / 60)}m`;
    return `${Math.round(value / 3600)}h`;
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
    haptic([16, 20, 16]);
  }

  function haptic(pattern) {
    if (testPlayMode || !navigator.vibrate) return;
    const activation = navigator.userActivation;
    if (activation && !activation.isActive && !activation.hasBeenActive) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // Haptics are optional feedback; never let browser/device policy affect play.
    }
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

  function environmentForLevel(target = state, offset = 0) {
    const level = Math.max(1, Number(target.meadowLevel || 1) + offset);
    const index = (level - 1) % environments.length;
    const cycle = Math.floor((level - 1) / environments.length);
    const environment = environments[index];
    return {
      ...environment,
      level,
      cycle,
      label: cycle > 0 ? `${environment.name} ${cycle + 1}` : environment.name
    };
  }

  function meadowTitle(target = state, offset = 0) {
    return environmentForLevel(target, offset).label;
  }

  function clickMilestoneCount(target = state) {
    const clicks = Number(target.clicks || 0);
    return clickMilestones.filter(milestone => clicks >= milestone.clicks).length;
  }

  function nextClickMilestone(target = state) {
    const clicks = Number(target.clicks || 0);
    return clickMilestones.find(milestone => clicks < milestone.clicks);
  }

  function claimClickMilestones(target = state) {
    if (!Array.isArray(target.claimedClickMilestones)) target.claimedClickMilestones = [];
    let reward = 0;
    let latest = null;
    clickMilestones.forEach(milestone => {
      if (Number(target.clicks || 0) < milestone.clicks || target.claimedClickMilestones.includes(milestone.id)) return;
      const amount = Math.max(
        milestone.reward,
        tapPower(target) * milestone.clicks * 0.32 + incomePerSecond(target) * 18
      );
      target.claimedClickMilestones.push(milestone.id);
      addLoops(target, amount);
      addMeadowCare(amount * 0.12, target);
      addRushCharge(6 + Math.min(18, milestone.clicks / 1000), target);
      reward += amount;
      latest = milestone;
    });
    if (reward > 0) recordSporeBurst(reward);
    return { reward, latest };
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
    const milestone = nextClickMilestone(target);
    if (milestone) return { id: "forest", next: `${format(milestone.clicks - clicks)} taps to ${milestone.name}` };
    return { id: "forest", next: `next: ${meadowTitle(target, 1)}` };
  }

  function bloomGainFor(target = state) {
    const required = bloomRequirement(target);
    if (Number(target.totalLoops || 0) < required) return 0;
    return Math.max(1, Math.floor(Math.sqrt(Number(target.totalLoops || 0) / required)));
  }

  function nextAction(target = state) {
    const tutorial = tutorialStage(target);
    const earlyPiece = [...machines].reverse().find(machine => Number(target.loops || 0) >= machineCost(machine, target));
    const earlyCharm = upgrades.find(upgrade => !hasUpgrade(upgrade.id, target) && upgrade.req(target) && Number(target.loops || 0) >= upgrade.cost);
    const earlyPerk = perks.find(perk => perkLevel(perk.id, target) < perk.max && Number(target.rootstock || 0) >= perkCost(perk, target));
    if (tutorial.id !== "forest") {
      if (!earlyPiece && !earlyCharm && !earlyPerk) return { detail: tutorial.next, kind: "tap", ready: false };
    }

    const bloomGain = bloomGainFor(target);
    if (bloomGain > 0) {
      return { detail: `Great Bloom ready +${format(bloomGain)}`, kind: "bloom", ready: true };
    }

    const affordablePerk = earlyPerk || perks.find(perk => perkLevel(perk.id, target) < perk.max && Number(target.rootstock || 0) >= perkCost(perk, target));
    if (affordablePerk) {
      return { detail: `unlock ${affordablePerk.name}`, kind: "perk", ready: true };
    }

    const affordableCharm = earlyCharm || upgrades.find(upgrade => !hasUpgrade(upgrade.id, target) && upgrade.req(target) && Number(target.loops || 0) >= upgrade.cost);
    if (affordableCharm) {
      return { detail: `wake ${affordableCharm.name}`, kind: "charm", ready: true };
    }

    const affordablePiece = earlyPiece || [...machines].reverse().find(machine => Number(target.loops || 0) >= machineCost(machine, target));
    if (affordablePiece) {
      return { detail: `grow ${affordablePiece.name}`, kind: "piece", ready: true };
    }

    if (target.lastDaily !== todayKey() && ownedTotal(target) > 0) {
      return { detail: "daily dew ready", kind: "dew", ready: true };
    }

    const nextMilestone = nextClickMilestone(target);
    const nextPiece = machines.find(machine => Number(target.loops || 0) < machineCost(machine, target));
    const pieceNeed = nextPiece ? Math.max(0, machineCost(nextPiece, target) - Number(target.loops || 0)) : Infinity;
    const bloomNeed = Math.max(0, bloomRequirement(target) - Number(target.totalLoops || 0));

    if (nextMilestone && Number(nextMilestone.clicks || 0) - Number(target.clicks || 0) <= 90) {
      return { detail: `${format(nextMilestone.clicks - Number(target.clicks || 0))} taps to ${nextMilestone.name}`, kind: "tap", ready: false };
    }

    if (nextPiece && (pieceNeed <= bloomNeed || incomePerSecond(target) > 0)) {
      return { detail: `${format(pieceNeed)} spores to ${nextPiece.name}`, kind: "piece", ready: false };
    }

    return { detail: `${format(bloomNeed)} run spores to Great Bloom`, kind: "bloom", ready: false };
  }

  function compactGoalLabel(detail) {
    const text = String(detail || "");
    return text.replace(/^(\d+(?:\.\d+)?[KMBT]?) taps to .+$/i, "$1 taps");
  }

  function primaryGoal(target = state) {
    const tutorial = tutorialStage(target);
    const earlyPiece = [...machines].reverse().find(machine => Number(target.loops || 0) >= machineCost(machine, target));
    const earlyCharm = upgrades.find(upgrade => !hasUpgrade(upgrade.id, target) && upgrade.req(target) && Number(target.loops || 0) >= upgrade.cost);
    const earlyPerk = perks.find(perk => perkLevel(perk.id, target) < perk.max && Number(target.rootstock || 0) >= perkCost(perk, target));
    if (tutorial.id !== "forest") {
      if (!earlyPiece && !earlyCharm && !earlyPerk) return { label: compactGoalLabel(tutorial.next), detail: tutorial.next, kind: "tap", ready: false };
    }

    const bloomGain = bloomGainFor(target);
    if (bloomGain > 0) {
      return {
        label: `Bloom +${format(bloomGain)}`,
        detail: `Great Bloom for ${format(bloomGain)} mycelium`,
        kind: "bloom",
        ready: true
      };
    }

    const affordablePerk = earlyPerk || perks.find(perk => perkLevel(perk.id, target) < perk.max && Number(target.rootstock || 0) >= perkCost(perk, target));
    if (affordablePerk) {
      return {
        label: affordablePerk.name,
        detail: affordablePerk.desc,
        kind: "perk",
        id: affordablePerk.id,
        ready: true
      };
    }

    const affordableCharm = earlyCharm || upgrades.find(upgrade => !hasUpgrade(upgrade.id, target) && upgrade.req(target) && Number(target.loops || 0) >= upgrade.cost);
    if (affordableCharm) {
      return {
        label: `Wake ${affordableCharm.name}`,
        detail: affordableCharm.desc,
        kind: "charm",
        id: affordableCharm.id,
        ready: true
      };
    }

    const affordablePiece = earlyPiece || [...machines].reverse().find(machine => Number(target.loops || 0) >= machineCost(machine, target));
    if (affordablePiece) {
      return {
        label: `Grow ${affordablePiece.name}`,
        detail: `Adds +${format(affordablePiece.rate * rateMultiplier(target))}/sec`,
        kind: "piece",
        id: affordablePiece.id,
        ready: true
      };
    }

    if (target.lastDaily !== todayKey() && ownedTotal(target) > 0) {
      return { label: "Claim daily dew", detail: "Daily reward ready", kind: "dew", ready: true };
    }

    const nextPiece = machines.find(machine => Number(target.loops || 0) < machineCost(machine, target));
    if (nextPiece) {
      const needed = Math.max(0, machineCost(nextPiece, target) - Number(target.loops || 0));
      return {
        label: `${format(needed)} to ${nextPiece.name}`,
        detail: `Next growth: ${nextPiece.name}`,
        kind: "piece",
        id: nextPiece.id,
        ready: false
      };
    }

    const action = nextAction(target);
    return { label: action.detail, detail: action.detail, kind: action.kind, ready: action.ready };
  }

  function goalProgress(goal = primaryGoal(), target = state) {
    if (goal.ready) return 1;
    if (goal.kind === "piece" && goal.id) {
      const machine = machines.find(item => item.id === goal.id);
      return machine ? Number(target.loops || 0) / machineCost(machine, target) : 0;
    }
    if (goal.kind === "charm" && goal.id) {
      const upgrade = upgrades.find(item => item.id === goal.id);
      return upgrade ? Number(target.loops || 0) / upgrade.cost : 0;
    }
    if (goal.kind === "bloom") {
      return Number(target.totalLoops || 0) / bloomRequirement(target);
    }
    const tutorial = tutorialStage(target);
    const clicks = Number(target.clicks || 0);
    const tutorialTargets = { sleeping: 1, awake: 5, baby: 15, root: 25 };
    if (tutorialTargets[tutorial.id]) return clicks / tutorialTargets[tutorial.id];
    const milestone = nextClickMilestone(target);
    if (milestone?.clicks) return clicks / milestone.clicks;
    return 0;
  }

  function usePrimaryGoal() {
    const goal = primaryGoal();
    if (!goal.ready) return;
    if (goal.kind === "bloom") graft();
    if (goal.kind === "perk" && goal.id) buyPerk(goal.id);
    if (goal.kind === "charm" && goal.id) buyUpgrade(goal.id);
    if (goal.kind === "piece" && goal.id) buyMachine(goal.id);
    if (goal.kind === "dew") claimDaily();
    render();
  }

  function actionMomentTitle(action) {
    const labels = {
      dew: "dew ready",
      bloom: "Great Bloom ready",
      charm: "new charm ready",
      piece: "meadow piece ready"
    };
    return labels[action.kind] || "new goal ready";
  }

  function announceReadyAction() {
    const action = nextAction();
    if (!action.ready) {
      state.lastReadyAction = "";
      return;
    }
    if (Number(state.offlineReward || 0) > 0) return;
    const key = `${action.kind}:${action.detail}`;
    if (state.lastReadyAction === key) return;
    state.lastReadyAction = key;
    showMoment(actionMomentTitle(action), action.detail, action.kind === "bloom" ? "great" : "unlock");
    playTone(action.kind === "bloom" ? "great" : "unlock", 3);
    markDirty();
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
      if (upgrade.kind === "tapMachine" && hasUpgrade(upgrade.id, target)) {
        tap *= 1 + Number(target.machines?.[upgrade.machine] || 0) * upgrade.value;
      }
    });
    if (hasUpgrade("tap-rate", target)) {
      tap *= 1 + Number(target.machines.press || 0) * 0.08;
    }
    tap *= 1 + perkLevel("soft-hands", target) * 0.25;
    if (rushActive(target)) tap *= 2;
    return tap * rootBonus(target);
  }

  function comboTapMultiplier(combo = comboCount) {
    return 1 + Math.min(0.72, Math.max(0, Number(combo || 0) - 1) * 0.018);
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
    let latest = null;
    while (target.meadowBloom >= meadowRequirement(target) && blooms < 12) {
      const required = meadowRequirement(target);
      target.meadowBloom -= required;
      target.meadowLevel += 1;
      latest = environmentForLevel(target);
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
    return { blooms, reward, latest };
  }

  function recordSporeBurst(amount) {
    clickRateBurst += Math.max(0, Number(amount) || 0) * 1.35;
    displayedRate = Math.max(displayedRate, incomePerSecond() + clickRateBurst);
  }

  function visibleTapBurst() {
    return Math.max(0, displayedRate - incomePerSecond());
  }

  function renderCombo() {
    if (!els.comboBadge) return;
    if (comboCount <= 1) {
      els.comboBadge.textContent = "";
      els.comboBadge.className = "combo-badge";
      return;
    }
    const comboBonus = comboTapMultiplier(comboCount);
    els.comboBadge.textContent = comboBonus > 1.02
      ? `combo x${comboCount} +${Math.round((comboBonus - 1) * 100)}%`
      : `combo x${comboCount}`;
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
    playTone("buy", 4);
    showMoment(machine.name, `${format(incomePerSecond())} spores/sec`, "buy");
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
    playTone("unlock", 4);
    showMoment(upgrade.name, upgrade.desc, "unlock");
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
    playTone("unlock", 4);
    showMoment(perk.name, `level ${format(level + 1)}`, "unlock");
    markDirty();
    render();
  }

  function graftGain() {
    return bloomGainFor();
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
    state.claimedClickMilestones = [];
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
    showMoment("Great Bloom", `+${format(gain)} mycelium / season ${format(state.bloomCount + 1)}`, "great");
    haptic([18, 22, 18, 36]);
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
    playTone("dew", 4);
    showMoment("daily dew", `+${format(reward)} spores`, "dew");
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
    playTone("unlock", 5);
    showMoment(quest.name, `+${format(quest.reward)} spores`, "unlock");
    markDirty();
    checkAchievements();
    render();
  }

  async function requestRewardedBoost() {
    const ads = window.MUSHROOM_BOOP_ADS || {};
    const rewardId = String(ads.admob?.rewardedUnitId || "").trim();
    const nativeRewardedAd = window.MushroomBoopRewardedAd || window.Capacitor?.Plugins?.MushroomBoopRewardedAd;
    if (nativeRewardedAd?.show && rewardId) {
      return nativeRewardedAd.show({ adUnitId: rewardId });
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
    els.boostHint.textContent = "Spore Shower active.";
    playTone("shower");
    showMoment("Spore Shower", `${Math.round(boostMinutes)} minute boost`, "shower");
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
    startAmbient(audioContext);
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
    const ambience = ctx.createGain();
    const master = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();
    const reverb = ctx.createConvolver();
    const warmth = ctx.createBiquadFilter();

    dry.gain.value = .76;
    wet.gain.value = .18;
    ambience.gain.value = .3;
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
    ambience.connect(master);
    wet.connect(reverb);
    reverb.connect(master);
    master.connect(warmth);
    warmth.connect(compressor);
    compressor.connect(ctx.destination);

    audioGraph = { context: ctx, dry, wet, ambience };
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

  function playRootThump(ctx, when, volume, panValue = 0) {
    const out = outputNode(ctx, panValue);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(118, when);
    osc.frequency.exponentialRampToValueAtTime(74, when + .16);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(360, when);
    gain.gain.setValueAtTime(.0001, when);
    gain.gain.exponentialRampToValueAtTime(volume, when + .012);
    gain.gain.exponentialRampToValueAtTime(.0001, when + .18);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(out.input);
    osc.start(when);
    osc.stop(when + .21);
  }

  function ambientPalette() {
    const biome = document.body.dataset.biome || environmentForLevel().biome;
    const palettes = {
      morning: { root: 392, chord: [1, 5 / 4, 3 / 2], bell: 2, brush: 1800 },
      grove: { root: 349.23, chord: [1, 6 / 5, 3 / 2], bell: 15 / 8, brush: 1500 },
      lantern: { root: 329.63, chord: [1, 5 / 4, 15 / 8], bell: 3, brush: 2400 },
      glow: { root: 369.99, chord: [1, 5 / 4, 3 / 2], bell: 5 / 2, brush: 2600 },
      star: { root: 415.3, chord: [1, 9 / 8, 3 / 2], bell: 3, brush: 3200 },
      moon: { root: 293.66, chord: [1, 6 / 5, 8 / 5], bell: 12 / 5, brush: 1600 },
      rain: { root: 349.23, chord: [1, 5 / 4, 4 / 3], bell: 2, brush: 3900 },
      brook: { root: 440, chord: [1, 6 / 5, 3 / 2], bell: 9 / 4, brush: 4200 },
      honey: { root: 392, chord: [1, 5 / 4, 3 / 2], bell: 5 / 2, brush: 2100 },
      cloud: { root: 329.63, chord: [1, 4 / 3, 3 / 2], bell: 2, brush: 3100 },
      velvet: { root: 311.13, chord: [1, 6 / 5, 3 / 2], bell: 12 / 5, brush: 1900 },
      crystal: { root: 466.16, chord: [1, 5 / 4, 15 / 8], bell: 3, brush: 3500 },
      aurora: { root: 415.3, chord: [1, 6 / 5, 3 / 2, 15 / 8], bell: 3, brush: 3400 },
      ancient: { root: 261.63, chord: [1, 5 / 4, 3 / 2], bell: 2, brush: 1200 }
    };
    return palettes[biome] || palettes.grove;
  }

  function playAmbientChord(ctx, palette, when) {
    const graph = ensureAudioGraph(ctx);
    const seconds = rushActive() ? 1.1 : 2.65;
    palette.chord.forEach((ratio, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const tone = ctx.createBiquadFilter();
      const panValue = ((index / Math.max(1, palette.chord.length - 1)) - .5) * .5;
      const dryPan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const wetPan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const detune = centsToRatio((Math.random() * 7) - 3.5);
      osc.type = index % 2 ? "triangle" : "sine";
      osc.frequency.setValueAtTime(palette.root * ratio * detune, when);
      tone.type = "lowpass";
      tone.frequency.setValueAtTime(rushActive() ? 3100 : 1900, when);
      gain.gain.setValueAtTime(.0001, when);
      gain.gain.linearRampToValueAtTime(.008 + index * .0015, when + .32);
      gain.gain.exponentialRampToValueAtTime(.0001, when + seconds);
      osc.connect(tone);
      tone.connect(gain);
      if (dryPan && wetPan) {
        dryPan.pan.value = panValue;
        wetPan.pan.value = panValue * .55;
        gain.connect(dryPan);
        gain.connect(wetPan);
        dryPan.connect(graph.ambience);
        wetPan.connect(graph.wet);
      } else {
        gain.connect(graph.ambience);
        gain.connect(graph.wet);
      }
      osc.start(when);
      osc.stop(when + seconds + .06);
    });
  }

  function playAmbientPhrase(ctx) {
    if (!ctx || !state.soundOn || testPlayMode || document.visibilityState === "hidden") return;
    if (ctx.state === "suspended") return;
    const palette = ambientPalette();
    const now = ctx.currentTime + .02;
    ambientStep = (ambientStep + 1) % 16;
    playAmbientChord(ctx, palette, now);
    if (ambientStep % 4 === 0 || rushActive()) {
      playBell(ctx, palette.root * palette.bell, now + .52, rushActive() ? .72 : 1.05, rushActive() ? .018 : .012, .18);
    }
    if (ambientStep % 3 === 0 || ["rain", "brook", "cloud"].includes(document.body.dataset.biome || "")) {
      playBrush(ctx, now + .18, .42, .006, palette.brush, -.14);
    }
  }

  function startAmbient(ctx = audioContext) {
    if (!ctx || ambientTimer || !state.soundOn || testPlayMode) return;
    playAmbientPhrase(ctx);
    ambientTimer = window.setInterval(() => {
      if (!state.soundOn || !audioContext) {
        stopAmbient();
        return;
      }
      playAmbientPhrase(audioContext);
    }, 1950);
  }

  function stopAmbient() {
    if (!ambientTimer) return;
    window.clearInterval(ambientTimer);
    ambientTimer = 0;
  }

  function playTone(kind = "tap", strength = 1) {
    if (testPlayMode) return;
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
      playRootThump(ctx, now, Math.min(.022, volume * .42), pan * .35);
      playBrush(ctx, now, .045, volume * .48, 1450 + Math.random() * 600, pan * .6);
      playPluck(ctx, frequency, now + Math.random() * .01, .34, volume, pan);
      if (comboCount >= 7) playBell(ctx, frequency * 1.5, now + .035, .28, volume * .48, -pan);
      if (comboCount >= 18) playBell(ctx, frequency * 2, now + .09, .42, volume * .26, pan * .25);
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

    if (kind === "buy") {
      playRootThump(ctx, now, .026, pan * .2);
      playPluck(ctx, 392, now + .018, .36, .03, -.1);
      playPluck(ctx, 587.33, now + .07, .44, .024, .14);
      playBrush(ctx, now + .02, .12, .01, 1750, 0);
      return;
    }

    if (kind === "unlock") {
      [440, 554.37, 659.25, 880].forEach((frequency, index) => {
        playPluck(ctx, frequency, now + index * .052, .62, .036 - index * .004, (index - 1.5) * .11);
      });
      playBell(ctx, 1318.51, now + .18, .86, .026, .16);
      playBrush(ctx, now + .05, .22, .013, 2800, -.12);
      return;
    }

    if (kind === "dew") {
      playBrush(ctx, now, .28, .014, 4100, -.16);
      [523.25, 659.25, 783.99].forEach((frequency, index) => {
        playBell(ctx, frequency, now + index * .055, .58, .022, (index - 1) * .16);
      });
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
    if (state.soundOn) {
      const ctx = ensureAudio();
      if (ctx) startAmbient(ctx);
      playTone("great", 3);
    } else {
      stopAmbient();
    }
    renderSound();
  }

  function renderSound() {
    if (!els.soundButton) return;
    els.soundButton.classList.toggle("off", !state.soundOn);
    els.soundButton.setAttribute("aria-label", state.soundOn ? "sound on" : "sound off");
  }

  function showMoment(title, detail = "", kind = "bloom") {
    if (testPlayMode || !document.body) return;
    const host = document.querySelector(".phone-frame") || document.body;
    const existing = host.querySelector(".moment-banner");
    if (existing) existing.remove();
    const banner = document.createElement("div");
    banner.className = `moment-banner ${kind}`;
    banner.innerHTML = `
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}</span>
    `;
    host.appendChild(banner);
    window.clearTimeout(momentTimer);
    momentTimer = window.setTimeout(() => {
      banner.classList.add("leaving");
      window.setTimeout(() => banner.remove(), 420);
    }, 1850);
  }

  function showOfflineReturn() {
    const reward = Number(state.offlineReward || 0);
    if (reward <= 0) return;
    showMoment("welcome back", `+${format(reward)} spores / ${formatDuration(state.offlineSeconds)} away`, "dew");
    playTone("dew", 2);
    state.offlineReward = 0;
    state.offlineSeconds = 0;
    markDirty();
    window.setTimeout(announceReadyAction, 2100);
  }

  function checkAchievements() {
    const unlockedNow = [];
    achievements.forEach(achievement => {
      if (!state.achievements.includes(achievement.id) && achievement.req(state)) {
        state.achievements.push(achievement.id);
        unlockedNow.push(achievement);
      }
    });
    if (unlockedNow.length) {
      const latest = unlockedNow[unlockedNow.length - 1];
      showMoment(latest.name, "badge unlocked", "badge");
      playTone("unlock", 3 + unlockedNow.length);
    }
  }

  function clearSeedPress() {
    window.clearTimeout(pressTimer);
    window.clearTimeout(releaseLiftTimer);
    window.clearTimeout(releaseSettleTimer);
    els.seedButton.classList.remove("is-pressed", "is-pressing", "is-tapped", "is-lifting", "is-settling");
  }

  function cancelActivePress() {
    if (els.seedButton.classList.contains("is-pressing")) clearSeedPress();
  }

  function pressSeedButton(duration = 420, mode = "tap") {
    clearSeedPress();
    void els.seedButton.offsetWidth;
    if (mode === "press") {
      els.seedButton.classList.add("is-pressed", "is-pressing");
    } else {
      els.seedButton.classList.add("is-tapped", "is-lifting");
      releaseLiftTimer = window.setTimeout(() => {
        els.seedButton.classList.remove("is-lifting");
        els.seedButton.classList.add("is-settling");
      }, 160);
    }
    window.clearTimeout(pressTimer);
    pressTimer = window.setTimeout(clearSeedPress, duration);
  }

  function restartMotion(element, className, duration = 520) {
    if (!element) return;
    element.classList.remove(className);
    void element.offsetWidth;
    element.classList.add(className);
    window.setTimeout(() => element.classList.remove(className), duration);
  }

  function setSceneImpactVector(x, y) {
    if (!els.friendScene) return;
    const rect = els.friendScene.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.68;
    const nudgeX = Math.max(-4, Math.min(4, ((centerX - x) / Math.max(1, rect.width)) * 7));
    const nudgeY = Math.max(-4, Math.min(3, ((centerY - y) / Math.max(1, rect.height)) * 5 - 1));
    els.friendScene.style.setProperty("--impact-x", `${nudgeX.toFixed(2)}px`);
    els.friendScene.style.setProperty("--impact-y", `${nudgeY.toFixed(2)}px`);
  }

  function kickHud() {
    restartMotion(els.loopsValue, "value-kick", 720);
    restartMotion(els.tapValue, "value-kick", 720);
    restartMotion(els.nextGoalButton, "goal-kick", 760);
  }

  function holdPointer(event) {
    if (event?.pointerId == null || !els.seedButton.setPointerCapture) return;
    try {
      els.seedButton.setPointerCapture(event.pointerId);
    } catch (_error) {
      // Some browsers reject capture if the pointer has already ended.
    }
  }

  function releasePointer(event) {
    if (event?.pointerId == null || !els.seedButton.releasePointerCapture) return;
    try {
      if (els.seedButton.hasPointerCapture?.(event.pointerId)) els.seedButton.releasePointerCapture(event.pointerId);
    } catch (_error) {
      // Pointer capture can already be cleared by the browser.
    }
  }

  function tap(event) {
    const rect = els.seedButton.getBoundingClientRect();
    const x = event?.clientX || rect.left + rect.width / 2;
    const y = event?.clientY || rect.top + rect.height / 2;
    pressSeedButton(620, "tap");
    setSceneImpactVector(x, y);
    const now = Date.now();
    if (!state.firstTapAt) state.firstTapAt = now;
    comboCount = now - lastTapTime < 900 ? Math.min(99, comboCount + 1) : 1;
    lastTapTime = now;
    state.maxCombo = Math.max(Number(state.maxCombo || 0), comboCount);
    const gained = tapPower() * comboTapMultiplier(comboCount);
    addLoops(state, gained);
    const meadow = addMeadowCare(gained);
    recordSporeBurst(gained);
    state.clicks += 1;
    const milestone = claimClickMilestones();
    addRushCharge(2 + Math.min(5, comboCount / 6));
    markDirty();
    checkAchievements();
    const showFullImpact = !testPlayMode || state.clicks % 50 === 0;
    if (showFullImpact) showPop(x, y, `+${format(gained)}`, comboCount);
    if (milestone.reward > 0) {
      showPop(rect.left + rect.width / 2, rect.bottom - 16, `${milestone.latest.name} +${format(milestone.reward)}`, comboCount + 8);
      showMoment(milestone.latest.name, `+${format(milestone.reward)} spores`, "badge");
      playTone("bloom", comboCount + 2);
    }
    if (meadow.blooms > 0) {
      showPop(rect.left + rect.width / 2, rect.top + 24, `bloom +${format(meadow.reward)}`, comboCount + 8);
      showMoment(meadow.latest?.label || meadowTitle(), meadow.blooms > 1 ? `${meadow.blooms} meadow blooms` : "new meadow bloom", "meadow");
      playTone("bloom", comboCount);
    } else if (milestone.reward <= 0) {
      playTone("tap", comboCount);
    }
    if (showFullImpact) {
      showCounterFly(x, y);
      showSporeBurst(x, y);
      showTapImpact(x, y, rect, comboCount);
    }
    pulseScene(meadow.blooms > 0 ? "scene-bloomed" : "scene-impact");
    renderCombo();
    kickHud();
    haptic(meadow.blooms > 0 ? [12, 18, 18] : 10);
    requestRenderCore();
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

    const glint = document.createElement("span");
    glint.className = "cap-glint";
    els.seedButton.appendChild(glint);

    const streakCount = combo >= 8 ? 5 : 3;
    for (let i = 0; i < streakCount; i += 1) {
      const angle = -Math.PI / 2 + (i - (streakCount - 1) / 2) * 0.38 + (Math.random() - 0.5) * 0.14;
      const distance = 42 + Math.random() * 32 + Math.min(18, combo);
      const streak = document.createElement("span");
      streak.className = "tap-streak";
      streak.style.left = `${localX}px`;
      streak.style.top = `${localY}px`;
      streak.style.setProperty("--sx", `${Math.cos(angle) * distance}px`);
      streak.style.setProperty("--sy", `${Math.sin(angle) * distance - 18}px`);
      streak.style.setProperty("--rot", `${angle + Math.PI / 2}rad`);
      els.seedButton.appendChild(streak);
      window.setTimeout(() => streak.remove(), 720);
    }

    const petalCount = combo >= 8 ? 8 : 5;
    for (let i = 0; i < petalCount; i += 1) {
      const angle = (Math.PI * 2 * i) / petalCount + Math.random() * 0.28;
      const distance = 34 + Math.random() * 42 + Math.min(22, combo * 1.2);
      const petal = document.createElement("span");
      petal.className = `tap-petal petal-${i % 4}`;
      petal.style.left = `${localX}px`;
      petal.style.top = `${localY}px`;
      petal.style.setProperty("--px", `${Math.cos(angle) * distance}px`);
      petal.style.setProperty("--py", `${Math.sin(angle) * distance - 18}px`);
      petal.style.setProperty("--turn", `${Math.random() * 220 - 110}deg`);
      els.seedButton.appendChild(petal);
      window.setTimeout(() => petal.remove(), 740);
    }

    if (els.friendScene) {
      const sceneRect = els.friendScene.getBoundingClientRect();
      const pulse = document.createElement("span");
      pulse.className = `scene-pulse${combo >= 8 ? " hot" : ""}`;
      pulse.style.left = `${Math.max(0, Math.min(sceneRect.width, x - sceneRect.left))}px`;
      pulse.style.top = `${Math.max(0, Math.min(sceneRect.height, y - sceneRect.top))}px`;
      els.friendScene.appendChild(pulse);
      window.setTimeout(() => pulse.remove(), 660);
    }

    window.setTimeout(() => ring.remove(), 700);
    window.setTimeout(() => flash.remove(), 420);
    window.setTimeout(() => glint.remove(), 720);
  }

  function showCounterFly(x, y) {
    if (!els.loopsValue) return;
    const target = els.loopsValue.getBoundingClientRect();
    const targetX = target.left + target.width / 2;
    const targetY = target.top + target.height / 2;
    const count = comboCount >= 8 ? 4 : 3;
    for (let i = 0; i < count; i += 1) {
      const mote = document.createElement("span");
      const spread = (i - (count - 1) / 2) * 10;
      mote.className = "spore-fly";
      mote.style.left = `${x + spread}px`;
      mote.style.top = `${y + (Math.random() * 8 - 4)}px`;
      mote.style.setProperty("--tx", `${targetX - x - spread}px`);
      mote.style.setProperty("--ty", `${targetY - y}px`);
      mote.style.setProperty("--delay", `${i * 34}ms`);
      document.body.appendChild(mote);
      window.setTimeout(() => mote.remove(), 820 + i * 34);
    }
  }

  function pulseScene(className) {
    if (!els.friendScene) return;
    const now = Date.now();
    if (className === "scene-impact" && now - lastScenePulseAt < 70) return;
    lastScenePulseAt = now;
    els.friendScene.classList.remove("scene-tapped", "scene-impact", "scene-bloomed");
    void els.friendScene.offsetWidth;
    els.friendScene.classList.add(className);
    window.setTimeout(() => els.friendScene.classList.remove(className), className === "scene-bloomed" ? 680 : 300);
  }

  function showSporeBurst(x, y) {
    const mobile = window.matchMedia("(max-width: 620px)").matches;
    const count = mobile ? 8 : 6;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.45;
      const distance = 44 + Math.random() * (mobile ? 76 : 64);
      const spore = document.createElement("span");
      const sparkle = i % 3 === 0;
      spore.className = `${sparkle ? "spore-spark" : "spore-pop"}${comboCount >= 8 && !sparkle ? " big" : ""}`;
      spore.style.left = `${x}px`;
      spore.style.top = `${y}px`;
      spore.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      spore.style.setProperty("--dy", `${Math.sin(angle) * distance - 38}px`);
      spore.style.setProperty("--spin", `${Math.random() * 220 - 110}deg`);
      spore.style.setProperty("--size", `${sparkle ? 8 + Math.random() * 8 : 9 + Math.random() * 10}px`);
      document.body.appendChild(spore);
      window.setTimeout(() => spore.remove(), 820);
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
      state.claimedClickMilestones = Array.isArray(imported.claimedClickMilestones) ? imported.claimedClickMilestones : [];
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
    const text = `I grew ${format(state.lifetimeLoops)} lifetime spores in Idle Shroom. Play at ${publicGameUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Idle Shroom", text, url: publicGameUrl });
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
    const strongestAffordable = [...machines].reverse().find(machine => state.loops >= machineCost(machine));
    const nextLocked = machines.find(machine => state.loops < machineCost(machine));
    const nextLockedIndex = machines.findIndex(machine => machine.id === nextLocked?.id);
    const nextPreview = nextLockedIndex >= 0 ? machines[nextLockedIndex + 1] : null;
    const strongestOwned = [...machines].reverse().find(machine => Number(state.machines[machine.id] || 0) > 0);
    const visibleMachines = [];
    [strongestAffordable, nextLocked, nextPreview, strongestOwned, machines[0], machines[1]].forEach(machine => {
      if (machine && !visibleMachines.some(item => item.id === machine.id) && visibleMachines.length < 3) {
        visibleMachines.push(machine);
      }
    });
    const recommended = strongestAffordable || nextLocked || strongestOwned || visibleMachines[0];
    els.machineCount.textContent = nextLocked ? `next: ${nextLocked.name}` : "heartwood looping";
    els.machineList.innerHTML = visibleMachines.map(machine => {
      const cost = machineCost(machine);
      const count = Number(state.machines[machine.id] || 0);
      const disabled = state.loops < cost ? "disabled" : "";
      const progress = Math.max(0, Math.min(100, (state.loops / cost) * 100));
      const art = machineArt[machine.id] || { className: "root-thread", label: "meadow piece" };
      return `
        <article class="store-item garden-card ${machine.id === recommended?.id ? "recommended" : ""}" data-machine="${machine.id}">
          <span class="store-visual ${art.className}" aria-label="${art.label}">
            <i style="--progress:${Math.round(progress)}%"></i>
          </span>
          <div class="store-copy">
            <h3>${machine.name}</h3>
            <p>${machine.desc}</p>
            <span class="owned">${count} owned / +${format(machine.rate * rateMultiplier())}/sec</span>
          </div>
          <button type="button" data-buy-machine="${machine.id}" ${disabled}>${state.loops >= cost ? `grow ${format(cost)}` : `need ${format(cost)}`}</button>
        </article>
      `;
    }).join("");
  }

  function renderUpgrades() {
    const available = upgrades.filter(upgrade => !hasUpgrade(upgrade.id) && upgrade.req(state));
    if (!available.length) {
      els.upgradeList.innerHTML = `
        <article class="store-item charm-card waiting">
          <span class="store-visual charm-seed" aria-hidden="true"><i></i></span>
          <div class="store-copy">
            <h3>Next charm</h3>
            <p>Grow more meadow pieces to unlock a charm.</p>
            <span class="owned">no spend needed yet</span>
          </div>
        </article>
      `;
      return;
    }
    els.upgradeList.innerHTML = available.map(upgrade => {
      const disabled = state.loops < upgrade.cost ? "disabled" : "";
      return `
        <article class="store-item charm-card ${state.loops >= upgrade.cost ? "recommended" : ""}">
          <span class="store-visual charm-seed" aria-hidden="true"><i></i></span>
          <div class="store-copy">
            <h3>${upgrade.name}</h3>
            <p>${upgrade.desc}</p>
          </div>
          <button type="button" data-buy-upgrade="${upgrade.id}" ${disabled}>${state.loops >= upgrade.cost ? `wake ${format(upgrade.cost)}` : `need ${format(upgrade.cost)}`}</button>
        </article>
      `;
    }).join("");
  }

  function renderPerks() {
    const active = perks.reduce((sum, perk) => sum + perkLevel(perk.id), 0);
    els.perkCount.textContent = `${format(state.rootstock)} mycelium / ${active} perks`;
    if (Number(state.rootstock || 0) <= 0 && active <= 0) {
      els.perkList.innerHTML = `
        <article class="store-item mycelium-card waiting">
          <span class="store-visual mycelium-knot" aria-hidden="true"><i></i></span>
          <div class="store-copy">
            <h3>First Great Bloom</h3>
            <p>Reach ${format(bloomRequirement())} run spores. Reset into a stronger season.</p>
            <span class="owned">${format(Math.min(state.totalLoops, bloomRequirement()))}/${format(bloomRequirement())} run spores</span>
          </div>
        </article>
      `;
      return;
    }
    els.perkList.innerHTML = perks.map(perk => {
      const level = perkLevel(perk.id);
      const cost = perkCost(perk);
      const maxed = level >= perk.max;
      const disabled = maxed || state.rootstock < cost ? "disabled" : "";
      return `
        <article class="store-item mycelium-card ${!disabled ? "recommended" : ""}">
          <span class="store-visual mycelium-knot" aria-hidden="true"><i></i></span>
          <div class="store-copy">
            <h3>${perk.name}</h3>
            <p>${perk.desc}</p>
            <span class="owned">level ${level}/${perk.max}</span>
          </div>
          <button type="button" data-buy-perk="${perk.id}" ${disabled}>${maxed ? "max" : (state.rootstock >= cost ? `shape ${format(cost)}` : `need ${format(cost)}`)}</button>
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
      const goal = nextClickMilestone()
        ? `${format(nextClickMilestone().clicks - Number(state.clicks || 0))} taps to ${nextClickMilestone().name}`
        : `${format(Math.max(0, bloomRequirement() - Number(state.totalLoops || 0)))} spores to Great Bloom`;
      els.leaderboardList.innerHTML = `
        <article class="leaderboard-empty atlas-card">
          <strong>Current run</strong>
          <span>${format(state.bloomCount || 0)} blooms / ${format(state.rootstock || 0)} mycelium / ${format(state.lifetimeLoops || 0)} lifetime spores</span>
          <div class="atlas-stats" aria-hidden="true">
            <b>${format(state.clicks || 0)} taps</b>
            <b>${format(state.meadowLevel || 1)} meadow</b>
            <b>${format(state.maxCombo || 0)} combo</b>
          </div>
          <em>${goal}</em>
        </article>
      `;
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
    els.boostHint.textContent = remaining > 0
      ? `${format(5 + perkLevel("long-boost") * 1)}x spores/sec while the shower is open.`
      : "Call a 10 minute Spore Shower for a short growth burst.";
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
    const environment = environmentForLevel();
    els.meadowValue.textContent = `meadow ${format(state.meadowLevel || 1)}`;
    els.sessionMeadowValue.textContent = format(state.meadowLevel || 1);
    els.meadowName.textContent = environment.label;
    els.meadowMood.textContent = meadowMood();
    els.bloomProgress.style.width = `${Math.round(progress * 100)}%`;
    els.bloomNeed.textContent = `${format(Math.max(0, required - bloom))} care`;
    if (els.nextBloomName) {
      const action = nextAction();
      els.nextBloomName.textContent = action.detail;
      els.nextBloomName.dataset.ready = action.ready ? "true" : "false";
      els.nextBloomName.dataset.kind = action.kind;
    }
    if (els.rootRing) {
      els.rootRing.style.setProperty("--bloom", `${Math.round(progress * 100)}%`);
      els.rootRing.classList.toggle("ready", progress >= 0.98);
    }
    const mood = meadowMood();
    document.body.dataset.meadowMood = mood.replace(/\s+/g, "-");
    document.body.dataset.tutorial = tutorial.id;
    document.body.dataset.biome = environment.biome;
    document.body.dataset.environment = environment.id;
    document.body.dataset.clickStage = String(Math.min(16, clickMilestoneCount()));
    document.body.dataset.meadowTier = String(Math.min(8, Math.max(1, Math.ceil(Number(state.meadowLevel || 1) / 4))));
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
      const friend = friendArt[quest.id] || { name: quest.name, className: "dew-beetle", promise: quest.desc };
      return `
        <article class="quest-item friend-card ${done ? "ready" : ""} ${claimedQuest ? "claimed" : ""}" data-friend="${quest.id}">
          <span class="friend-token ${friend.className}" aria-hidden="true"><i></i></span>
          <div class="friend-copy">
            <h3>${friend.name}</h3>
            <p>${quest.name}: ${friend.promise}</p>
            <span class="owned">${format(Math.min(quest.current, quest.target))}/${format(quest.target)} / reward ${format(quest.reward)} spores</span>
            <div class="mini-progress" aria-hidden="true"><span style="width:${Math.round(progress * 100)}%"></span></div>
          </div>
          <button type="button" data-claim-quest="${quest.id}" ${!done || claimedQuest ? "disabled" : ""}>${claimedQuest ? "claimed" : "claim"}</button>
        </article>
      `;
    }).join("");
  }

  function renderCore() {
    const passiveRate = incomePerSecond();
    const tapBurst = visibleTapBurst();
    const goal = primaryGoal();
    els.loopsValue.textContent = format(state.loops);
    els.rateValue.textContent = format(passiveRate);
    if (els.nextGoalButton) {
      els.nextGoalButton.textContent = goal.label;
      els.nextGoalButton.disabled = !goal.ready;
      els.nextGoalButton.title = goal.detail;
      els.nextGoalButton.dataset.goalKind = goal.kind;
      els.nextGoalButton.dataset.ready = goal.ready ? "true" : "false";
      els.nextGoalButton.dataset.rate = passiveRate > 0 && tapBurst > 0.1 ? "burst" : passiveRate > 0 ? "idle" : "none";
    }
    if (els.goalProgress) {
      els.goalProgress.style.width = `${Math.round(Math.max(0, Math.min(1, goalProgress(goal))) * 100)}%`;
    }
    els.tapValue.textContent = format(state.clicks);
    if (els.seasonValue) {
      els.seasonValue.textContent = Number(state.rootstock || 0) > 0
        ? `${format(state.rootstock)} mycelium`
        : `season ${format(Number(state.bloomCount || 0) + 1)}`;
    }
    els.clicksValue.textContent = format(state.clicks);
    els.runValue.textContent = format(state.totalLoops);
    els.lifetimeValue.textContent = format(state.lifetimeLoops);
    els.multiplierValue.textContent = `${rateMultiplier().toFixed(rateMultiplier() >= 10 ? 1 : 2)}x`;
    els.upgradeCount.textContent = `${state.upgrades.length} active`;
    els.achievementCount.textContent = `${state.achievements.length} unlocked`;
    renderOrchard();
    renderCompanions();
    renderDaily();
    renderMeadow();
    renderPrestige();
    renderFocus();
    renderRush();
    renderSound();
    announceReadyAction();
  }

  function render() {
    renderCore();
    renderMachines();
    renderUpgrades();
    renderPerks();
    renderAchievements();
    renderQuests();
    renderLeaderboard();
  }

  function requestRenderCore() {
    if (coreRenderQueued) return;
    coreRenderQueued = true;
    const schedule = window.requestAnimationFrame || (callback => window.setTimeout(callback, 16));
    schedule(() => {
      coreRenderQueued = false;
      renderCore();
    });
  }

  function tick() {
    const now = Date.now();
    const dt = Math.min(5, Math.max(0, (now - lastTick) / 1000));
    lastTick = now;
    const earned = incomePerSecond() * dt;
    if (earned > 0) {
      addLoops(state, earned);
      const meadow = addMeadowCare(earned * 0.08);
      if (meadow.blooms > 0) {
        showMoment(meadow.latest?.label || meadowTitle(), meadow.blooms > 1 ? `${meadow.blooms} meadow blooms` : "new meadow bloom", "meadow");
        playTone("bloom", 2);
      }
      markDirty();
      checkAchievements();
    }
    updateDisplayedRate(dt);
    if (document.body.dataset.tab === "play") renderCore();
    else render();
  }

  els.seedButton.addEventListener("pointerdown", event => {
    holdPointer(event);
    pressSeedButton(900, "press");
  }, { passive: true });
  els.seedButton.addEventListener("pointerup", event => {
    releasePointer(event);
    lastPointerTapAt = Date.now();
    tap(event);
  }, { passive: true });
  els.seedButton.addEventListener("pointercancel", event => {
    releasePointer(event);
    clearSeedPress();
  }, { passive: true });
  els.seedButton.addEventListener("pointerleave", cancelActivePress, { passive: true });
  els.seedButton.addEventListener("click", event => {
    if (Date.now() - lastPointerTapAt < 420) return;
    tap(event);
  });
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
  if (els.nextGoalButton) els.nextGoalButton.addEventListener("click", usePrimaryGoal);
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
      if (tab) {
        setScreen(tab);
        render();
      }
    });
  }

  if (testPlayMode) {
    window.IDLESHROOM_TEST = {
      tapMany(count = 1) {
        const rect = els.seedButton.getBoundingClientRect();
        const event = {
          clientX: rect.left + rect.width / 2,
          clientY: rect.top + rect.height / 2
        };
        const total = Math.max(0, Math.min(100000, Number(count) || 0));
        for (let index = 0; index < total; index += 1) tap(event);
        renderCore();
        return this.metrics();
      },
      metrics() {
        return {
          taps: Number(state.clicks || 0),
          spores: Number(state.loops || 0),
          totalSpores: Number(state.totalLoops || 0),
          offlineReward: Number(state.offlineReward || 0),
          offlineSeconds: Number(state.offlineSeconds || 0),
          nextAction: nextAction().detail,
          nextActionReady: nextAction().ready,
          lastReadyAction: state.lastReadyAction || "",
          meadowLevel: Number(state.meadowLevel || 1),
          meadowName: meadowTitle(),
          achievements: state.achievements.length,
          maxCombo: Number(state.maxCombo || 0),
          sporesPerSecond: incomePerSecond(),
          scrollable: document.documentElement.scrollHeight > window.innerHeight + 1,
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1
        };
      }
    };
    const testParams = new URLSearchParams(window.location.search);
    const requestedOfflineMinutes = Number(testParams.get("simOfflineMinutes") || 0);
    if (requestedOfflineMinutes > 0) {
      state.soundOn = false;
      state.machines.plot = Math.max(Number(state.machines.plot || 0), 20);
      state.machines.press = Math.max(Number(state.machines.press || 0), 6);
      state.machines.clock = Math.max(Number(state.machines.clock || 0), 2);
      state.lastDaily = todayKey();
      state.lastSaved = Date.now() - requestedOfflineMinutes * 60 * 1000;
      applyOffline(state);
    }
    const requestedClicks = Number(testParams.get("simClicks") || 0);
    if (requestedClicks > 0) {
      const started = Date.now();
      const result = window.IDLESHROOM_TEST.tapMany(requestedClicks);
      document.body.dataset.testMetrics = JSON.stringify({
        elapsed: Date.now() - started,
        ...result
      });
    }
  }

  window.addEventListener("beforeunload", save);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      stopAmbient();
      save();
      return;
    }
    if (state.soundOn && audioContext) startAmbient(audioContext);
  });

  checkAchievements();
  setScreen(document.body.dataset.tab);
  loadLeaderboard();
  render();
  showOfflineReturn();
  window.setInterval(tick, 1000);
  window.setInterval(() => { if (dirty) save(); }, 5000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
})();
