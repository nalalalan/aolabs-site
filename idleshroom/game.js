(function () {
  "use strict";

  const runningNativeApp = Boolean(
    window.Capacitor?.isNativePlatform?.() || window.Capacitor?.getPlatform?.() === "android"
  );
  if (runningNativeApp && document.body) {
    document.body.classList.add("native-app");
  }

  const saveKey = "mushroom-boop-save-v1";
  const leaderboardKey = "mushroom-boop-leaderboard-v1";
  const playerIdKey = "mushroom-boop-player-id-v1";
  const maxOfflineSeconds = 8 * 60 * 60;
  const greatBloomRequirements = [100000, 750000, 5000000, 40000000];
  const rushMax = 100;
  const rushSeconds = 20;
  const onlineConfig = window.IDLE_SHROOM_ONLINE || window.MUSHROOM_BOOP_ONLINE || {};
  const testPlayMode = new URLSearchParams(window.location.search).has("testplay");
  const publicGameUrl = window.location.hostname === "idleshroom.aolabs.io"
    ? "https://idleshroom.aolabs.io/"
    : "https://aolabs.io/idleshroom/";
  const environments = [
    { id: "dewdrop-meadow", name: "Dewdrop Meadow", biome: "morning" },
    { id: "mossy-log", name: "Mossy Log", biome: "grove" },
    { id: "hollow-stump", name: "Hollow Stump", biome: "ancient" },
    { id: "fairy-ring-grove", name: "Fairy Ring Grove", biome: "lantern" },
    { id: "root-maze", name: "Root Maze", biome: "rain" },
    { id: "glowcap-cavern", name: "Glowcap Cavern", biome: "glow" },
    { id: "rotwood-cathedral", name: "Rotwood Cathedral", biome: "moon" },
    { id: "compost-abyss", name: "Compost Abyss", biome: "ancient" },
    { id: "mooncap-marsh", name: "Mooncap Marsh", biome: "velvet" },
    { id: "mycelial-core", name: "Mycelial Core", biome: "aurora" }
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
    { id: "silver-season", clicks: 25000, name: "Silver Bloom", reward: 290000000 },
    { id: "golden-season", clicks: 40000, name: "Golden Bloom", reward: 1200000000 },
    { id: "ancient-season", clicks: 65000, name: "Ancient Bloom", reward: 5200000000 },
    { id: "endless-season", clicks: 100000, name: "Endless Bloom", reward: 24000000000 }
  ];

  const machines = [
    { id: "plot", name: "Button Buddies", base: 10, scale: 1.15, rate: 0.12, desc: "Tiny starter shrooms that slap enemies with little caps." },
    { id: "press", name: "Cap Knights", base: 55, scale: 1.16, rate: 0.55, desc: "Leaf-shield swordsmen that hop forward, slash, and jump back." },
    { id: "clock", name: "Puffball Bombers", base: 320, scale: 1.17, rate: 3.2, desc: "Round puffballs that inflate, sneeze, and launch spore bombs." },
    { id: "collector", name: "Glowshroom Mages", base: 1900, scale: 1.18, rate: 18, desc: "Blue-purple casters that fire bioluminescent spores and sigils." },
    { id: "greenhouse", name: "Death-Cap Assassins", base: 12000, scale: 1.19, rate: 110, desc: "Fast black-and-red shrooms that vanish and strike behind bosses." },
    { id: "rail", name: "Shelf-Fungus Guardians", base: 78000, scale: 1.2, rate: 720, desc: "Heavy bark-shield fungi that slam threats with slow huge hits." },
    { id: "relay", name: "Morel Monks", base: 520000, scale: 1.21, rate: 4600, desc: "Wrinkly elder shrooms that meditate and boost the colony rhythm." },
    { id: "bell", name: "Chanterelle Archers", base: 3600000, scale: 1.22, rate: 30000, desc: "Golden bow shrooms that fire volleys of glowing needle-spores." },
    { id: "spring", name: "Truffle Miners", base: 26000000, scale: 1.23, rate: 210000, desc: "Round workers that dig up nutrients, relic caps, and goo." },
    { id: "observatory", name: "Mycelium Beasts", base: 210000000, scale: 1.24, rate: 1500000, desc: "Root-covered fungal animals that stomp, bite, and lash." },
    { id: "aurora", name: "The Ancient Cap", base: 1900000000, scale: 1.25, rate: 12000000, desc: "A massive old mushroom spirit whose attacks shake the screen." },
    { id: "heartwood", name: "Worldroot Engine", base: 17000000000, scale: 1.26, rate: 88000000, desc: "Late-game mycelium machinery for Great Overgrowth scale." }
  ];

  const machineArt = {
    plot: { className: "root-thread button-buddies", label: "button buddies" },
    press: { className: "dew-cup cap-knights", label: "cap knights" },
    clock: { className: "lantern-cap puffball-bombers", label: "puffball bombers" },
    collector: { className: "friend-burrow glowshroom-mages", label: "glowshroom mages" },
    greenhouse: { className: "rainleaf-canopy deathcap-assassins", label: "death-cap assassins" },
    rail: { className: "glowroot-web shelf-guardians", label: "shelf-fungus guardians" },
    relay: { className: "moonspore-hollow morel-monks", label: "morel monks" },
    bell: { className: "bellcap-choir chanterelle-archers", label: "chanterelle archers" },
    spring: { className: "dreamspring-pool truffle-miners", label: "truffle miners" },
    observatory: { className: "starcap-observatory mycelium-beasts", label: "mycelium beasts" },
    aurora: { className: "aurora-rootway ancient-cap", label: "the ancient cap" },
    heartwood: { className: "heartwood-grove worldroot-engine", label: "worldroot engine" }
  };

  const friendArt = {
    boops: { name: "Button Buddy", className: "dew-beetle", promise: "Keeps the front line slapping." },
    pieces: { name: "Cap Knight", className: "lantern-moth", promise: "Turns upgrades into visible squad growth." },
    spores: { name: "Puffball Bomber", className: "puff-sprite", promise: "Carries big nutrient bursts." }
  };

  const combatWavesPerStage = 10;
  const bossSeconds = 30;
  const enemyRoster = [
    { id: "sap-beetle", name: "Sap Beetle", variant: 0 },
    { id: "moss-slug", name: "Moss Slug", variant: 1 },
    { id: "root-mite", name: "Root Mite", variant: 2 },
    { id: "mold-wisp", name: "Mold Wisp", variant: 3 },
    { id: "hungry-shrew", name: "Hungry Shrew", variant: 4 },
    { id: "garden-boot", name: "Garden Boot", variant: 5 },
    { id: "dry-spirit", name: "Drought Spirit", variant: 6 },
    { id: "lawnmower-spark", name: "Lawnmower Spark", variant: 7 }
  ];
  const bossRoster = [
    { id: "king-sluggo", name: "King Sluggo", variant: 8 },
    { id: "beetle-baron", name: "The Beetle Baron", variant: 9 },
    { id: "rotjaw-worm", name: "Rotjaw Worm", variant: 10 },
    { id: "gardener-hand", name: "The Gardener", variant: 11 },
    { id: "boot-of-doom", name: "Boot of Doom", variant: 12 },
    { id: "mower-titan", name: "Lawn Mower Titan", variant: 13 },
    { id: "salt-priest-snail", name: "Salt Priest Snail", variant: 14 },
    { id: "drought-witch", name: "The Drought Witch", variant: 15 },
    { id: "mold-hydra", name: "Mold Hydra", variant: 16 },
    { id: "surface-god", name: "The Surface God", variant: 17 }
  ];
  const rareSpawns = [
    { id: "golden-beetle", name: "Golden Beetle", enemyId: "golden-beetle", variant: 9, duration: 18, health: 0.68, reward: "nutrients", desc: "Bursts into a huge nutrient pile." },
    { id: "crystal-slug", name: "Crystal Slug", enemyId: "crystal-slug", variant: 14, duration: 22, health: 1.25, reward: "relicCaps", desc: "Drops Relic Caps for artifact upgrades." },
    { id: "wandering-truffle", name: "Wandering Truffle", enemyId: "wandering-truffle", variant: 2, duration: 16, health: 0.82, reward: "mutationGoo", desc: "Drops Mutation Goo for shroom evolution." },
    { id: "spore-thief", name: "Spore Thief", enemyId: "spore-thief", variant: 6, duration: 12, health: 0.48, reward: "mixed", desc: "Runs fast. Catch it before it escapes." },
    { id: "ancient-snail", name: "Ancient Snail", enemyId: "ancient-snail", variant: 14, duration: 28, health: 1.9, reward: "ancientSpores", desc: "Very tanky, but carries Ancient Spores." }
  ];

  const allyMilestones = [10, 25, 50, 100, 250, 500, 1000, 2500];
  const milestoneText = {
    10: "damage boost",
    25: "new visual detail",
    50: "special passive",
    100: "evolved attack",
    250: "colony-wide bonus",
    500: "mutation form",
    1000: "ancient form",
    2500: "repeating power spike"
  };

  const shroomForms = [
    { id: "sprout", name: "Sprout Shroom", req: target => bestCombatDepth(target) < 12 && ancientSporePower(target) < 1 },
    { id: "capblade", name: "Capblade Shroom", req: target => bestCombatDepth(target) >= 12 || Number(target.clicks || 0) >= 140 },
    { id: "sporeheart", name: "Sporeheart Shroom", req: target => bestCombatDepth(target) >= 35 || Number(target.bloomCount || 0) >= 1 },
    { id: "mycelium-lord", name: "Mycelium Lord", req: target => bestCombatDepth(target) >= 80 || ancientSporePower(target) >= 8 },
    { id: "bloom-king", name: "Bloom King", req: target => bestCombatDepth(target) >= 160 || Number(target.bloomCount || 0) >= 5 },
    { id: "fungal-god", name: "Ancient Fungal God", req: target => bestCombatDepth(target) >= 320 || ancientSporePower(target) >= 40 }
  ];

  const relics = [
    { id: "elder-spore-crown", name: "Elder Spore Crown", req: target => Number(target.bossDefeats || 0) >= 1, desc: "Tap damage rises with every Spore Bloom." },
    { id: "rotwood-idol", name: "Rotwood Idol", req: target => bestCombatDepth(target) >= 24, desc: "All shroom allies gain more passive damage." },
    { id: "moonlit-mycelium", name: "Moonlit Mycelium", req: target => Number(target.bloomCount || 0) >= 1, desc: "Idle power keeps glowing after resets." },
    { id: "compost-chalice", name: "Compost Chalice", req: target => Number(target.bossDefeats || 0) >= 4, desc: "Bosses drop bigger nutrient piles." },
    { id: "fairy-ring-compass", name: "Fairy Ring Compass", req: target => bestCombatDepth(target) >= 55, desc: "Spore Bloom starts future runs deeper." },
    { id: "salt-cracked-shell", name: "Salt-Cracked Shell", req: target => Number(target.bossDefeats || 0) >= 8, desc: "Extra damage against slug and snail bosses." },
    { id: "lantern-mold", name: "Lantern Mold", req: target => Number(target.dailyClaims || 0) >= 2, desc: "Offline workers bring back more nutrients." },
    { id: "rootbone-drum", name: "Rootbone Drum", req: target => Number(target.rushes || 0) >= 3, desc: "Active skill cooldowns shorten." },
    { id: "sporeglass-lens", name: "Sporeglass Lens", req: target => Number(target.maxCombo || 0) >= 40, desc: "Taps crit harder during long combos." },
    { id: "ancient-capstone", name: "Ancient Capstone", req: target => bestCombatDepth(target) >= 120, desc: "Boss damage scales with the whole colony." }
  ];

  const mutations = [
    { id: "ironcap-knights", name: "Ironcap Knights", family: "Cap Knights", machine: "press", level: 25, desc: "More boss damage and acorn armor." },
    { id: "volcanic-puffball", name: "Volcanic Puffball", family: "Puffball Bombers", machine: "clock", level: 25, desc: "Bombs leave larger glowing blast clouds." },
    { id: "moon-mage", name: "Moon Mage", family: "Glowshroom Mages", machine: "collector", level: 25, desc: "Spells hit harder in boss fights." },
    { id: "ghostcap-knight", name: "Ghostcap Knights", family: "Cap Knights", machine: "press", level: 50, desc: "Slashes can duplicate into ghost spores." },
    { id: "poison-puffball", name: "Poison Puffball", family: "Puffball Bombers", machine: "clock", level: 50, desc: "Puff clouds keep damaging enemies after impact." },
    { id: "truffle-deepminers", name: "Deep Truffle Miners", family: "Truffle Miners", machine: "spring", level: 25, desc: "Dig up more Relic Caps and Mutation Goo." },
    { id: "rootbeast-alpha", name: "Rootbeast Alpha", family: "Mycelium Beasts", machine: "observatory", level: 10, desc: "Stomps shake the whole playfield." }
  ];

  const worldRegions = [
    { id: "forest-floor", name: "Forest Floor", depth: 1 },
    { id: "deep-woods", name: "Deep Woods", depth: 80 },
    { id: "ancient-garden", name: "Ancient Garden", depth: 160 },
    { id: "moonlit-swamp", name: "Moonlit Swamp", depth: 260 },
    { id: "crystal-caverns", name: "Crystal Caverns", depth: 380 },
    { id: "giants-backyard", name: "Giant's Backyard", depth: 540 },
    { id: "forgotten-greenhouse", name: "Forgotten Greenhouse", depth: 720 },
    { id: "rotwood-kingdom", name: "Rotwood Kingdom", depth: 950 },
    { id: "underground-ocean", name: "Underground Ocean", depth: 1250 },
    { id: "spore-moon", name: "Spore Moon", depth: 1600 }
  ];

  const activeSkills = [
    { id: "spore-storm", button: "stormSkillButton", short: "Storm", name: "Spore Storm", cooldown: 28, unlock: () => true, desc: "Rapid spores shred the current enemy.", damage: target => tapPower(target) * 20 + combatDps(target) * 2.2 },
    { id: "root-grasp", button: "rootSkillButton", short: "Roots", name: "Root Grasp", cooldown: 36, unlock: target => bestCombatDepth(target) >= 6 || ownedTotal(target) >= 8, desc: "Roots wrap the target and amplify damage.", damage: target => tapPower(target) * 26 + combatDps(target) * 2.6 },
    { id: "nutrient-frenzy", button: "frenzySkillButton", short: "Frenzy", name: "Nutrient Frenzy", cooldown: 44, unlock: target => ownedTotal(target) >= 18, desc: "A short rain of glowing nutrients.", reward: target => Math.max(enemyReward(target) * 1.7, incomePerSecond(target) * 30 + tapPower(target) * 40) },
    { id: "puffball-barrage", button: "barrageSkillButton", short: "Barrage", name: "Puffball Barrage", cooldown: 52, unlock: target => Number(target.machines.clock || 0) > 0 || bestCombatDepth(target) >= 16, desc: "Puffball bombs burst across the boss lane.", damage: target => tapPower(target) * 36 + Number(target.machines.clock || 0) * 18 * rootBonus(target) + combatDps(target) * 3.5 },
    { id: "fairy-ring", button: "ringSkillButton", short: "Ring", name: "Fairy Ring", cooldown: 58, unlock: target => bestCombatDepth(target) >= 28 || Number(target.bloomCount || 0) >= 1, desc: "A glowing crit ring opens under the enemy.", damage: target => tapPower(target) * 44 + combatDps(target) * 4.2 },
    { id: "ancient-bloom", button: "ancientSkillButton", short: "Ancient", name: "Ancient Bloom", cooldown: 80, unlock: target => ancientSporePower(target) > 0 || bestCombatDepth(target) >= 45, desc: "The whole colony exhales a huge fungal blast.", damage: target => tapPower(target) * 92 + combatDps(target) * 8 + ancientSporePower(target) * 120 }
  ];

  const upgrades = [
    { id: "tap-2", name: "Cap Slash", cost: 120, req: state => state.totalLoops >= 80, desc: "Taps hit twice as hard and puff more nutrients loose.", kind: "tap", value: 2 },
    { id: "rate-1", name: "Marching Caps", cost: 850, req: state => ownedTotal(state) >= 12, desc: "All shroom allies deal 1.5x idle damage.", kind: "rate", value: 1.5 },
    { id: "tap-5", name: "Spore Knuckles", cost: 5200, req: state => state.clicks >= 180, desc: "Tap power x2.5 when the First Shroom is awake.", kind: "tap", value: 2.5 },
    { id: "rate-2", name: "Glowcap Volley", cost: 36000, req: state => state.totalLoops >= 18000, desc: "Glowshroom magic doubles passive damage.", kind: "rate", value: 2 },
    { id: "tap-rate", name: "Puffball Recoil", cost: 160000, req: state => state.machines.clock >= 12, desc: "Tap power grows with every Puffball Bomber.", kind: "tapRoute", value: 0.08 },
    { id: "rate-3", name: "Root War Drum", cost: 880000, req: state => state.totalLoops >= 420000, desc: "The colony's march boosts idle damage x2.25.", kind: "rate", value: 2.25 },
    { id: "prestige-soft", name: "Ancient Spores", cost: 4200000, req: state => state.rootstock >= 3, desc: "Spore Bloom perks become stronger.", kind: "root", value: 0.08 },
    { id: "tap-echo", name: "Boing Combo", cost: 12000000, req: state => state.clicks >= 1500, desc: "Every tap lands with a wetter bounce. Tap power x2.2.", kind: "tap", value: 2.2 },
    { id: "rate-4", name: "Barkplate Line", cost: 42000000, req: state => Number(state.machines.bell || 0) >= 1, desc: "Barkplate Guardians boost idle damage x2.6.", kind: "rate", value: 2.6 },
    { id: "tap-route-2", name: "Truffle Spores", cost: 180000000, req: state => state.clicks >= 4000, desc: "Tap power grows with every Truffle Miner.", kind: "tapMachine", machine: "spring", value: 0.12 },
    { id: "rate-5", name: "Cavern Army", cost: 900000000, req: state => Number(state.meadowLevel || 1) >= 20, desc: "Deep zones multiply idle damage x3.", kind: "rate", value: 3 },
    { id: "tap-aurora", name: "Core Pulse", cost: 5200000000, req: state => state.clicks >= 10000, desc: "Late-game taps glow harder. Tap power x3.", kind: "tap", value: 3 },
    { id: "rate-6", name: "Empire Heart", cost: 22000000000, req: state => Number(state.machines.heartwood || 0) >= 1, desc: "Ancient Spore Engines multiply idle damage x3.5.", kind: "rate", value: 3.5 }
  ];

  const achievements = [
    { id: "first-tap", name: "First Puff", desc: "Tap once.", req: state => state.clicks >= 1 },
    { id: "hundred", name: "Hundred nutrients", desc: "Earn 100 lifetime nutrients.", req: state => state.lifetimeLoops >= 100 },
    { id: "machine-ten", name: "Tiny squad", desc: "Own 10 shroom allies.", req: state => ownedTotal(state) >= 10 },
    { id: "clicker", name: "Tap rhythm", desc: "Tap 250 times.", req: state => state.clicks >= 250 },
    { id: "million", name: "Million-nutrient colony", desc: "Earn 1,000,000 lifetime nutrients.", req: state => state.lifetimeLoops >= 1000000 },
    { id: "rooted", name: "Spore Bloom", desc: "Release the colony into a stronger run.", req: state => Number(state.bloomCount || 0) >= 1 },
    { id: "return", name: "Daily goals", desc: "Claim a daily goal reward.", req: state => state.dailyClaims >= 1 },
    { id: "rush", name: "Spore Pressure", desc: "Trigger Spore Pressure.", req: state => state.rushes >= 1 },
    { id: "quest", name: "Quest sprout", desc: "Claim a daily quest.", req: state => state.questsClaimed >= 1 },
    { id: "click-1000", name: "Thousand taps", desc: "Tap 1,000 times.", req: state => state.clicks >= 1000 },
    { id: "click-5000", name: "Five-thousand rhythm", desc: "Tap 5,000 times.", req: state => state.clicks >= 5000 },
    { id: "click-10000", name: "Ten-thousand shimmer", desc: "Tap 10,000 times.", req: state => state.clicks >= 10000 },
    { id: "env-16", name: "Deep zone", desc: "Reach depth 16.", req: state => Number(state.meadowLevel || 1) >= 16 },
    { id: "env-32", name: "Buried map", desc: "Reach depth 32.", req: state => Number(state.meadowLevel || 1) >= 32 },
    { id: "combo-25", name: "Cap rhythm", desc: "Reach a 25 tap combo.", req: state => Number(state.maxCombo || 0) >= 25 },
    { id: "combo-75", name: "Spore drummer", desc: "Reach a 75 tap combo.", req: state => Number(state.maxCombo || 0) >= 75 },
    { id: "machine-50", name: "Busy colony", desc: "Own 50 shroom allies.", req: state => ownedTotal(state) >= 50 },
    { id: "machine-150", name: "Tiny empire", desc: "Own 150 shroom allies.", req: state => ownedTotal(state) >= 150 },
    { id: "combat-stage-5", name: "First boss cap", desc: "Reach stage 1-10.", req: state => bestCombatDepth(state) >= 10 },
    { id: "combat-stage-25", name: "Deep trail", desc: "Reach stage 3-10.", req: state => bestCombatDepth(state) >= 30 },
    { id: "combat-boss-10", name: "Boss breaker", desc: "Beat 10 boss caps.", req: state => Number(state.bossDefeats || 0) >= 10 },
    { id: "rare-first", name: "Rare catch", desc: "Defeat a rare spawn.", req: state => Number(state.rareDefeats || 0) >= 1 },
    { id: "rare-five", name: "Truffle hunter", desc: "Defeat 5 rare spawns.", req: state => Number(state.rareDefeats || 0) >= 5 },
    { id: "rate-100", name: "Soft engine", desc: "Reach 100 idle damage/sec.", req: state => incomePerSecond(state) >= 100 },
    { id: "rate-10k", name: "Root weather", desc: "Reach 10,000 idle damage/sec.", req: state => incomePerSecond(state) >= 10000 },
    { id: "bloom-3", name: "Third Bloom", desc: "Spore Bloom 3 times.", req: state => Number(state.bloomCount || 0) >= 3 },
    { id: "bloom-10", name: "Ancient blooms", desc: "Spore Bloom 10 times.", req: state => Number(state.bloomCount || 0) >= 10 },
    { id: "streak-3", name: "Daily goal streak", desc: "Keep a 3 day goal streak.", req: state => Number(state.streak || 0) >= 3 },
    { id: "quest-day", name: "Colony day", desc: "Claim all 3 daily goals in a day.", req: state => Number(state.claimedQuests?.length || 0) >= 3 },
    { id: "rush-10", name: "Pressure colony", desc: "Trigger Spore Pressure 10 times.", req: state => Number(state.rushes || 0) >= 10 },
    { id: "env-64", name: "Full empire", desc: "Reach depth 64.", req: state => Number(state.meadowLevel || 1) >= 64 }
  ];

  const perks = [
    { id: "spore-memory", name: "Ancient Memory", baseCost: 1, max: 10, desc: "Baseline idle damage +18% per level." },
    { id: "soft-hands", name: "Stronger Cap", baseCost: 1, max: 10, desc: "Tap power +25% per level." },
    { id: "cheap-caps", name: "Root Economy", baseCost: 2, max: 8, desc: "Shroom allies and charms cost 6% less per level." },
    { id: "long-boost", name: "Long Frenzy", baseCost: 2, max: 5, desc: "Nutrient Frenzy lasts 2 more minutes per level." },
    { id: "starter-cap", name: "Starting Buddies", baseCost: 3, max: 1, desc: "Each Spore Bloom starts with three Button Buddies." }
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
  let battleAnimationFrame = 0;
  let battleLastFrame = 0;
  let empireRoadSignature = "";
  const battleEvents = [];
  const battleSpriteAtlasPath = "./sprites/idle-shroom-sprite-atlas-20260527.png";
  const battleSpriteAtlasBase = 1254;
  const battleSpriteAtlas = new Image();
  let battleSpriteReady = false;
  const battleSprites = {
    firstShroom: { source: [37, 117, 277, 268] },
    capblade: { source: [314, 88, 271, 297] },
    buttonBuddy: { source: [664, 208, 228, 174] },
    capKnight: { source: [940, 131, 282, 264] },
    puffball: { source: [21, 568, 293, 268] },
    mage: { source: [341, 496, 286, 340] },
    sapBeetle: { source: [667, 598, 242, 169] },
    mossSlug: { source: [965, 529, 265, 240] },
    gardenBoot: { source: [24, 836, 246, 307] },
    kingSluggo: { source: [314, 836, 313, 308] },
    mowerTitan: { source: [627, 852, 297, 297] },
    bloomBurst: { source: [956, 887, 279, 255] }
  };

  battleSpriteAtlas.decoding = "async";
  battleSpriteAtlas.addEventListener("load", () => {
    battleSpriteReady = true;
  });
  battleSpriteAtlas.src = battleSpriteAtlasPath;
  window.__idleShroomSpriteStatus = () => ({
    ready: battleSpriteReady,
    complete: battleSpriteAtlas.complete,
    width: battleSpriteAtlas.naturalWidth || 0,
    height: battleSpriteAtlas.naturalHeight || 0,
    path: battleSpriteAtlasPath
  });

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
    "bottomTabs", "friendScene", "companionRow", "colonyLayer", "rushOrbit", "rootRing", "soundButton",
    "battleCanvas",
    "combatStrip", "stageLabel", "enemyName", "enemyHpLabel", "enemyHpBar", "bossTimer", "enemyTarget", "bloomCallout",
    "meadowValue", "meadowName", "meadowMood", "bloomProgress", "bloomNeed", "nextBloomName",
    "ancientSporesValue", "essenceValue", "relicCapsValue", "mutationGooValue",
    "empireRoad", "formBadge", "empireNextTitle", "empireNextDetail", "empireNextMeter", "empireRoadTrack",
    "stormSkillButton", "rootSkillButton", "frenzySkillButton", "barrageSkillButton", "ringSkillButton", "ancientSkillButton",
    "relicState", "relicList", "mutationState", "mutationList", "mapState", "networkList",
    "dewSkillButton", "boostSkillButton", "bloomSkillButton"
  ].forEach(id => { els[id] = document.getElementById(id); });

  function setScreen(tab) {
    const screens = new Set(["play", "store", "systems", "quests", "board"]);
    const next = screens.has(tab) ? tab : "play";
    document.body.dataset.tab = next;
    if (next !== "play") {
      document.querySelectorAll(".moment-banner, .pop, .damage-number").forEach(element => element.remove());
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
      lifetimeRootstock: 0,
      lastBloomGain: 0,
      postBloomBoostUntil: 0,
      dailyClaims: 0,
      focusUntil: 0,
      rushCharge: 0,
      rushUntil: 0,
      rushes: 0,
      bloomCount: 0,
      combatStage: 1,
      combatWave: 1,
      enemyHp: 0,
      enemyMaxHp: 0,
      enemyKey: "",
      bossDeadline: 0,
      enemyDefeats: 0,
      bossDefeats: 0,
      bossFails: 0,
      defeatedBossIds: [],
      foundRelicIds: [],
      relicLevels: Object.fromEntries(relics.map(relic => [relic.id, 0])),
      spentRelicCaps: 0,
      bonusRelicCaps: 0,
      activeMutations: [],
      spentMutationGoo: 0,
      bonusMutationGoo: 0,
      rareSpawn: null,
      rareDefeats: 0,
      bestCombatDepth: 1,
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
      skillCooldowns: {},
      lastSkillCast: "",
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
      if (!raw) {
        ensureCombatState(fallback);
        return fallback;
      }
      const parsed = JSON.parse(raw);
      const merged = { ...fallback, ...parsed };
      merged.machines = { ...fallback.machines, ...(parsed.machines || {}) };
      merged.perks = { ...fallback.perks, ...(parsed.perks || {}) };
      merged.questBaselines = { ...fallback.questBaselines, ...(parsed.questBaselines || {}) };
      merged.skillCooldowns = { ...fallback.skillCooldowns, ...(parsed.skillCooldowns || {}) };
      merged.relicLevels = { ...fallback.relicLevels, ...(parsed.relicLevels || {}) };
      merged.upgrades = Array.isArray(parsed.upgrades) ? parsed.upgrades : [];
      merged.achievements = Array.isArray(parsed.achievements) ? parsed.achievements : [];
      merged.claimedQuests = Array.isArray(parsed.claimedQuests) ? parsed.claimedQuests : [];
      merged.claimedClickMilestones = Array.isArray(parsed.claimedClickMilestones) ? parsed.claimedClickMilestones : [];
      merged.defeatedBossIds = Array.isArray(parsed.defeatedBossIds) ? parsed.defeatedBossIds : [];
      merged.foundRelicIds = Array.isArray(parsed.foundRelicIds) ? parsed.foundRelicIds : [];
      merged.activeMutations = Array.isArray(parsed.activeMutations) ? parsed.activeMutations : [];
      merged.spentRelicCaps = Math.max(0, Number(parsed.spentRelicCaps || 0));
      merged.bonusRelicCaps = Math.max(0, Number(parsed.bonusRelicCaps || 0));
      merged.spentMutationGoo = Math.max(0, Number(parsed.spentMutationGoo || 0));
      merged.bonusMutationGoo = Math.max(0, Number(parsed.bonusMutationGoo || 0));
      merged.rareSpawn = parsed.rareSpawn && typeof parsed.rareSpawn === "object" ? parsed.rareSpawn : null;
      merged.rareDefeats = Math.max(0, Number(parsed.rareDefeats || 0));
      merged.lifetimeRootstock = Math.max(
        Number(parsed.lifetimeRootstock || 0),
        Number(parsed.rootstock || 0),
        Number(parsed.bloomCount || 0)
      );
      merged.lastBloomGain = Number(parsed.lastBloomGain || 0);
      merged.postBloomBoostUntil = Number(parsed.postBloomBoostUntil || 0);
      ensureCombatState(merged);
      applyOffline(merged);
      return merged;
    } catch {
      ensureCombatState(fallback);
      return fallback;
    }
  }

  function applyOffline(target) {
    const now = Date.now();
    const elapsed = Math.max(0, Math.min(maxOfflineSeconds, (now - Number(target.lastSaved || now)) / 1000));
    if (elapsed < 30) return;
    const offlineMult = 1 + relicLevel("lantern-mold", target) * 0.08;
    const earned = incomePerSecond(target) * elapsed * 0.55 * offlineMult;
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
    const sign = number < 0 ? "-" : "";
    const absolute = Math.abs(number);
    if (number > 0 && number < 1) {
      return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    }
    if (absolute < 10 && number % 1) {
      return number.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    }
    if (absolute < 1000) return number.toFixed(number % 1 ? 1 : 0);
    const suffixes = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc", "Ud", "Dd", "Td", "Qad"];
    const tier = Math.min(suffixes.length - 1, Math.floor(Math.log10(absolute) / 3));
    const scaled = absolute / Math.pow(1000, tier);
    const digits = scaled >= 100 ? 0 : scaled >= 10 ? 1 : 2;
    return `${sign}${scaled.toFixed(digits).replace(/\.0+$|(\.\d*[1-9])0+$/, "$1")}${suffixes[tier]}`;
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

  function ancientSpores(target = state) {
    return Math.max(0, Number(target.rootstock || 0));
  }

  function ancientSporePower(target = state) {
    return Math.max(
      Math.max(0, Number(target.lifetimeRootstock || 0)),
      Math.max(0, Number(target.rootstock || 0))
    );
  }

  function postBloomSurgeActive(target = state) {
    return Date.now() < Number(target.postBloomBoostUntil || 0);
  }

  function myceliumEssence(target = state) {
    return Math.max(0, Math.floor(Number(target.bloomCount || 0) * 7 + bestCombatDepth(target) / 14 + ownedTotal(target) / 32));
  }

  function relicCapsEarned(target = state) {
    const base = Number(target.bossDefeats || 0) * 3 + bestCombatDepth(target) / 20 + Number(target.bloomCount || 0);
    const rare = Math.max(0, Number(target.bonusRelicCaps || 0));
    const minerMult = mutationActive("truffle-deepminers", target) ? 1.25 : 1;
    return Math.max(0, Math.floor(base * minerMult + rare));
  }

  function relicCaps(target = state) {
    return Math.max(0, relicCapsEarned(target) - Math.floor(Number(target.spentRelicCaps || 0)));
  }

  function mutationGooEarned(target = state) {
    const base = Number(target.enemyDefeats || 0) / 16 + ownedTotal(target) / 18 + Number(target.bloomCount || 0) * 4;
    const rare = Math.max(0, Number(target.bonusMutationGoo || 0));
    const minerMult = mutationActive("truffle-deepminers", target) ? 1.2 : 1;
    return Math.max(0, Math.floor(base * minerMult + rare));
  }

  function mutationGoo(target = state) {
    return Math.max(0, mutationGooEarned(target) - Math.floor(Number(target.spentMutationGoo || 0)));
  }

  function currentShroomForm(target = state) {
    return [...shroomForms].reverse().find(form => form.req(target)) || shroomForms[0];
  }

  function colonyTier(target = state) {
    return Math.max(1, Math.min(9, Math.floor(ownedTotal(target) / 9) + Math.floor(bestCombatDepth(target) / 22) + Math.floor(Number(target.bloomCount || 0) / 2) + 1));
  }

  function currentWorldRegion(target = state) {
    const depth = bestCombatDepth(target);
    return [...worldRegions].reverse().find(region => depth >= region.depth) || worldRegions[0];
  }

  function nextWorldRegion(target = state) {
    const depth = bestCombatDepth(target);
    return worldRegions.find(region => depth < region.depth) || null;
  }

  function nextAllyMilestone(count) {
    const owned = Math.max(0, Number(count || 0));
    return allyMilestones.find(milestone => owned < milestone)
      || Math.ceil((owned + 1) / 2500) * 2500;
  }

  function allyMilestoneCopy(count) {
    const next = nextAllyMilestone(count);
    return `next ${format(next)}: ${milestoneText[next] || "power spike"}`;
  }

  function relicUnlocked(relic, target = state) {
    return (Array.isArray(target.foundRelicIds) && target.foundRelicIds.includes(relic.id)) || Boolean(relic.req(target));
  }

  function recordNewRelics(target = state) {
    if (!Array.isArray(target.foundRelicIds)) target.foundRelicIds = [];
    const newlyFound = [];
    relics.forEach(relic => {
      if (relic.req(target) && !target.foundRelicIds.includes(relic.id)) {
        target.foundRelicIds.push(relic.id);
        newlyFound.push(relic);
      }
    });
    return newlyFound;
  }

  function mutationUnlocked(mutation, target = state) {
    return Number(target.machines?.[mutation.machine] || 0) >= mutation.level;
  }

  function relicLevel(id, target = state) {
    const levels = target?.relicLevels || {};
    return Math.max(0, Math.floor(Number(levels[id] || 0)));
  }

  function relicUpgradeCost(relic, target = state) {
    const index = Math.max(0, relics.findIndex(item => item.id === relic.id));
    return Math.max(1, Math.ceil((relicLevel(relic.id, target) + 1) * (2 + Math.min(6, index))));
  }

  function mutationActive(id, target = state) {
    return Array.isArray(target?.activeMutations) && target.activeMutations.includes(id);
  }

  function activeMutationsForMachine(machineId, target = state) {
    return mutations.filter(mutation => mutation.machine === machineId && mutationActive(mutation.id, target));
  }

  function mutationCost(mutation) {
    const index = Math.max(0, mutations.findIndex(item => item.id === mutation.id));
    return 3 + index * 2 + Math.floor(Number(mutation.level || 0) / 25);
  }

  function rareSpawnDefinition(id) {
    return rareSpawns.find(item => item.id === id) || null;
  }

  function rareSpawnActive(target = state) {
    const spawn = target?.rareSpawn;
    if (!spawn || typeof spawn !== "object") return false;
    return Date.now() < Number(spawn.expiresAt || 0) && Number(spawn.hp || 0) > 0;
  }

  function activeRareSpawn(target = state) {
    return rareSpawnActive(target) ? target.rareSpawn : null;
  }

  function rareSpawnEnemy(spawn = activeRareSpawn()) {
    const rare = rareSpawnDefinition(spawn?.id);
    if (!rare) return null;
    return {
      id: rare.enemyId,
      name: rare.name,
      variant: rare.variant,
      rareId: rare.id
    };
  }

  function rareSpawnMaxHealth(rare, target = state) {
    const base = Math.max(enemyMaxHealth(target), tapPower(target) * 12 + combatDps(target) * 1.5 + 18);
    return Math.max(12, Math.round(base * Number(rare?.health || 1)));
  }

  function rareSpawnReward(rare, target = state) {
    const rewardBase = Math.max(enemyReward(target), tapPower(target) * 16 + incomePerSecond(target) * 12 + 40);
    const depth = Math.max(1, bestCombatDepth(target));
    if (rare.reward === "nutrients") return { nutrients: rewardBase * 8 };
    if (rare.reward === "relicCaps") return { relicCaps: Math.max(2, Math.floor(2 + depth / 45 + Number(target.bloomCount || 0))) };
    if (rare.reward === "mutationGoo") return { mutationGoo: Math.max(3, Math.floor(3 + ownedTotal(target) / 45 + Number(target.bloomCount || 0) * 2)) };
    if (rare.reward === "ancientSpores") return { ancientSpores: Math.max(1, Math.floor(1 + Number(target.bloomCount || 0) / 4)) };
    return {
      nutrients: rewardBase * 3,
      relicCaps: Math.max(1, Math.floor(1 + depth / 90)),
      mutationGoo: Math.max(1, Math.floor(1 + ownedTotal(target) / 80))
    };
  }

  function rareRewardText(reward) {
    const parts = [];
    if (reward.nutrients) parts.push(`${format(reward.nutrients)} nutrients`);
    if (reward.relicCaps) parts.push(`${format(reward.relicCaps)} Relic Caps`);
    if (reward.mutationGoo) parts.push(`${format(reward.mutationGoo)} Mutation Goo`);
    if (reward.ancientSpores) parts.push(`${format(reward.ancientSpores)} Ancient Spores`);
    return parts.join(" / ") || "rare reward";
  }

  function spawnRare(id = "") {
    if (rareSpawnActive()) return false;
    const rare = rareSpawnDefinition(id) || rareSpawns[Math.floor(Math.random() * rareSpawns.length)];
    if (!rare) return false;
    const maxHp = rareSpawnMaxHealth(rare);
    state.rareSpawn = {
      id: rare.id,
      hp: maxHp,
      maxHp,
      createdAt: Date.now(),
      expiresAt: Date.now() + rare.duration * 1000
    };
    pushBattleEvent("rare-arrive", { rare: rare.id, duration: 900 });
    showMoment(rare.name, rare.desc, "unlock");
    playTone("unlock", 4);
    markDirty();
    return true;
  }

  function maybeSpawnRare(trigger = "defeat") {
    if (rareSpawnActive()) return false;
    const defeats = Math.max(0, Number(state.enemyDefeats || 0));
    const bosses = Math.max(0, Number(state.bossDefeats || 0));
    if (trigger === "boss" && bosses > 0 && bosses % 5 === 0) {
      const rare = rareSpawns[(bosses + Number(state.bloomCount || 0)) % rareSpawns.length];
      return spawnRare(rare.id);
    }
    if (trigger === "defeat" && defeats > 0 && defeats % 19 === 0) {
      const rare = rareSpawns[(Math.floor(defeats / 19) + combatStage(state)) % rareSpawns.length];
      return spawnRare(rare.id);
    }
    return false;
  }

  function expireRareSpawn() {
    const spawn = state.rareSpawn;
    if (!spawn || rareSpawnActive()) return false;
    const rare = rareSpawnDefinition(spawn.id);
    state.rareSpawn = null;
    if (rare) showMoment(`${rare.name} escaped`, "watch for the next rare spawn", "combat");
    markDirty();
    return true;
  }

  function claimRareSpawn(spawn = activeRareSpawn()) {
    const rare = rareSpawnDefinition(spawn?.id);
    if (!rare) return { defeated: false, reward: {} };
    const reward = rareSpawnReward(rare);
    if (reward.nutrients) {
      addLoops(state, reward.nutrients);
      addMeadowCare(reward.nutrients * 0.14);
      recordSporeBurst(reward.nutrients);
    }
    if (reward.relicCaps) state.bonusRelicCaps = Math.max(0, Number(state.bonusRelicCaps || 0)) + reward.relicCaps;
    if (reward.mutationGoo) state.bonusMutationGoo = Math.max(0, Number(state.bonusMutationGoo || 0)) + reward.mutationGoo;
    if (reward.ancientSpores) {
      state.rootstock = Math.max(0, Number(state.rootstock || 0)) + reward.ancientSpores;
      state.lifetimeRootstock = Math.max(ancientSporePower(state), Number(state.lifetimeRootstock || 0) + reward.ancientSpores);
    }
    state.rareDefeats = Math.max(0, Number(state.rareDefeats || 0)) + 1;
    state.rareSpawn = null;
    pushBattleEvent("rare", { rare: rare.id, duration: 1400 });
    addRushCharge(20);
    playTone("great", 6);
    showMoment(rare.name, rareRewardText(reward), "great");
    pulseScene("scene-bloomed");
    return { defeated: true, reward };
  }

  function damageRareSpawn(amount, options = {}) {
    const spawn = activeRareSpawn();
    if (!spawn) return { changed: false, defeated: false, reward: {} };
    const damage = Math.max(0, Number(amount) || 0);
    if (damage <= 0) return { changed: false, defeated: false, reward: {} };
    spawn.hp = Math.max(0, Number(spawn.hp || 0) - damage);
    if (options.visual !== false) {
      pushBattleEvent("rare-hit", { rare: spawn.id, hot: options.hot, duration: 520 });
      showDamageNumber(damage, Boolean(options.hot));
    }
    if (spawn.hp <= 0) return claimRareSpawn(spawn);
    return { changed: true, defeated: false, reward: {} };
  }

  function bossDamageMultiplier(target = state) {
    let mult = 1 + relicLevel("ancient-capstone", target) * 0.1 + relicLevel("salt-cracked-shell", target) * 0.08;
    if (mutationActive("ironcap-knights", target)) mult *= 1.35;
    if (mutationActive("moon-mage", target)) mult *= 1.25;
    if (mutationActive("rootbeast-alpha", target)) mult *= 1.22;
    return mult;
  }

  function combatStage(target = state) {
    return Math.max(1, Math.floor(Number(target.combatStage || target.stage || 1)));
  }

  function combatWave(target = state) {
    return Math.max(1, Math.min(combatWavesPerStage, Math.floor(Number(target.combatWave || target.wave || 1))));
  }

  function combatDepth(target = state) {
    return (combatStage(target) - 1) * combatWavesPerStage + combatWave(target);
  }

  function bestCombatDepth(target = state) {
    return Math.max(combatDepth(target), Math.floor(Number(target.bestCombatDepth || 1)));
  }

  function combatDepthLabel(depth = 1) {
    const value = Math.max(1, Math.floor(Number(depth) || 1));
    const stage = Math.floor((value - 1) / combatWavesPerStage) + 1;
    const wave = ((value - 1) % combatWavesPerStage) + 1;
    return `${format(stage)}-${wave}`;
  }

  function combatLabel(target = state) {
    return `${format(combatStage(target))}-${combatWave(target)}`;
  }

  function isBossWave(target = state) {
    return combatWave(target) >= combatWavesPerStage;
  }

  function enemyForCombat(target = state) {
    const roster = isBossWave(target) ? bossRoster : enemyRoster;
    const index = isBossWave(target)
      ? (combatStage(target) - 1) % roster.length
      : (combatDepth(target) - 1) % roster.length;
    return roster[index];
  }

  function combatEnemyKey(target = state) {
    return `${combatStage(target)}:${combatWave(target)}`;
  }

  function enemyMaxHealth(target = state) {
    const stage = combatStage(target);
    const wave = combatWave(target);
    const depth = combatDepth(target);
    const depthScale = Math.pow(1.27, Math.max(0, depth - 1));
    const waveScale = 1 + (wave - 1) * 0.18;
    const seasonScale = Math.pow(1.035, Math.max(0, Number(target.bloomCount || 0)));
    const bossScale = isBossWave(target) ? 5.6 : 1;
    return Math.max(4, Math.round((5 + stage * 1.5) * depthScale * waveScale * seasonScale * bossScale));
  }

  function enemyReward(target = state) {
    const maxHp = Math.max(1, Number(target.enemyMaxHp || enemyMaxHealth(target)));
    const boss = isBossWave(target);
    const depthBonus = 1 + combatDepth(target) * 0.045;
    const chalice = 1 + relicLevel("compost-chalice", target) * (boss ? 0.1 : 0.045);
    return Math.max(boss ? 45 : 10, Math.round(maxHp * (boss ? 1.45 : 1.7) * depthBonus * rootBonus(target) * chalice));
  }

  function ensureCombatState(target = state) {
    target.combatStage = combatStage(target);
    target.combatWave = combatWave(target);
    target.bestCombatDepth = Math.max(bestCombatDepth(target), combatDepth(target));
    const key = combatEnemyKey(target);
    const expectedMax = enemyMaxHealth(target);
    if (target.enemyKey !== key || !Number.isFinite(Number(target.enemyHp)) || !Number.isFinite(Number(target.enemyMaxHp)) || Number(target.enemyMaxHp || 0) <= 0) {
      target.enemyKey = key;
      target.enemyMaxHp = expectedMax;
      target.enemyHp = expectedMax;
    } else {
      target.enemyMaxHp = Math.max(1, Number(target.enemyMaxHp || expectedMax));
      target.enemyHp = Math.max(0, Math.min(Number(target.enemyHp || target.enemyMaxHp), target.enemyMaxHp));
    }
    if (isBossWave(target)) {
      if (!Number(target.bossDeadline || 0)) target.bossDeadline = Date.now() + bossSeconds * 1000;
    } else {
      target.bossDeadline = 0;
    }
  }

  function advanceCombat(target = state) {
    if (combatWave(target) >= combatWavesPerStage) {
      target.combatStage = combatStage(target) + 1;
      target.combatWave = 1;
    } else {
      target.combatWave = combatWave(target) + 1;
    }
    target.enemyKey = "";
    target.bossDeadline = 0;
    ensureCombatState(target);
  }

  function combatDps(target = state) {
    const idleRate = incomePerSecond(target);
    const helperPressure = idleRate * 0.62;
    const capPulse = tapPower(target) * Math.max(0, ownedTotal(target)) * 0.025;
    let mult = rushActive(target) ? 1.25 : 1;
    if (isBossWave(target)) mult *= bossDamageMultiplier(target);
    if (mutationActive("poison-puffball", target)) mult *= 1.16;
    return (helperPressure + capPulse) * mult;
  }

  function showEnemyReward(reward, defeatedName, boss = false) {
    if (!els.enemyTarget) return;
    const rect = els.enemyTarget.getBoundingClientRect();
    showPop(rect.left + rect.width / 2, rect.top + rect.height * 0.34, `+${format(reward)}`, boss ? 14 : 7);
    showMoment(boss ? `${defeatedName} down` : defeatedName, `+${format(reward)} nutrients`, boss ? "great" : "buy");
  }

  function showDamageNumber(amount, hot = false) {
    if (!els.enemyTarget || testPlayMode) return;
    const rect = els.enemyTarget.getBoundingClientRect();
    const pop = document.createElement("span");
    pop.className = `damage-number${hot ? " hot" : ""}`;
    pop.textContent = `-${format(amount)}`;
    pop.style.left = `${rect.left + rect.width * (0.44 + Math.random() * 0.18)}px`;
    pop.style.top = `${rect.top + rect.height * (0.22 + Math.random() * 0.18)}px`;
    document.body.appendChild(pop);
    window.setTimeout(() => pop.remove(), 680);
  }

  function showDamageSlash(hot = false) {
    if (!els.friendScene || !els.enemyTarget || testPlayMode) return;
    const sceneRect = els.friendScene.getBoundingClientRect();
    const enemyRect = els.enemyTarget.getBoundingClientRect();
    const slash = document.createElement("span");
    slash.className = `damage-slash${hot ? " hot" : ""}`;
    slash.style.left = `${enemyRect.left - sceneRect.left + enemyRect.width / 2}px`;
    slash.style.top = `${enemyRect.top - sceneRect.top + enemyRect.height / 2}px`;
    els.friendScene.appendChild(slash);
    window.setTimeout(() => slash.remove(), 420);
  }

  function defeatEnemy(target = state, visual = true) {
    ensureCombatState(target);
    const defeated = enemyForCombat(target);
    const boss = isBossWave(target);
    const reward = enemyReward(target);
    addLoops(target, reward);
    addMeadowCare(reward * (boss ? 0.18 : 0.1), target);
    recordSporeBurst(reward);
    target.enemyDefeats = Number(target.enemyDefeats || 0) + 1;
    if (boss) {
      target.bossDefeats = Number(target.bossDefeats || 0) + 1;
      if (!Array.isArray(target.defeatedBossIds)) target.defeatedBossIds = [];
      if (!target.defeatedBossIds.includes(defeated.id)) target.defeatedBossIds.push(defeated.id);
    }
    const rareArrived = maybeSpawnRare(boss ? "boss" : "defeat");
    advanceCombat(target);
    target.bestCombatDepth = Math.max(bestCombatDepth(target), combatDepth(target));
    if (visual) {
      pushBattleEvent("defeat", { boss, duration: boss ? 1400 : 900 });
      restartMotion(els.enemyTarget, "enemy-defeated", boss ? 760 : 520);
      showEnemyReward(reward, defeated.name, boss);
      playTone(boss ? "great" : "buy", boss ? 6 : 3);
      pulseScene(boss ? "scene-bloomed" : "scene-impact");
      if (rareArrived) pulseScene("scene-bloomed");
    }
    return { reward, boss, name: defeated.name };
  }

  function damageEnemy(amount, options = {}) {
    ensureCombatState(state);
    const damage = Math.max(0, Number(amount) || 0);
    if (damage <= 0) return { changed: false, defeated: 0, reward: 0 };
    const visual = options.visual !== false;
    if (visual) {
      pushBattleEvent("hit", { hot: options.hot || comboCount >= 8 || isBossWave(state), duration: 520 });
      restartMotion(els.enemyTarget, "enemy-hit", 260);
      showDamageNumber(damage, damage >= Math.max(5, Number(state.enemyMaxHp || 1) * 0.18));
      showDamageSlash(options.hot || comboCount >= 8 || isBossWave(state));
    }
    let remaining = damage;
    let defeated = 0;
    let reward = 0;
    let guard = 0;
    while (remaining > 0 && guard < 6) {
      guard += 1;
      const before = Number(state.enemyHp || state.enemyMaxHp || enemyMaxHealth(state));
      state.enemyHp = Math.max(0, before - remaining);
      if (state.enemyHp > 0) break;
      const overflow = Math.max(0, remaining - before);
      const result = defeatEnemy(state, visual && defeated < 2);
      defeated += 1;
      reward += result.reward;
      remaining = overflow * 0.28;
      if (remaining < 1) break;
    }
    return { changed: true, defeated, reward };
  }

  function handleBossTimeout(target = state) {
    ensureCombatState(target);
    if (!isBossWave(target)) return false;
    const remaining = Number(target.bossDeadline || 0) - Date.now();
    if (remaining > 0 || Number(target.enemyHp || 0) <= 0) return false;
    target.bossFails = Number(target.bossFails || 0) + 1;
    target.combatWave = Math.max(1, combatWavesPerStage - 1);
    target.enemyKey = "";
    target.bossDeadline = 0;
    ensureCombatState(target);
    showMoment("boss cap escaped", "clear one wave and retry", "great");
    playTone("bloom", 2);
    haptic([8, 20, 8]);
    return true;
  }

  function combatGoal(target = state) {
    ensureCombatState(target);
    const rareSpawn = activeRareSpawn(target);
    if (rareSpawn) {
      const rare = rareSpawnDefinition(rareSpawn.id);
      const hp = Math.max(0, Number(rareSpawn.hp || 0));
      const maxHp = Math.max(1, Number(rareSpawn.maxHp || hp || 1));
      const seconds = Math.max(0, Math.ceil((Number(rareSpawn.expiresAt || 0) - Date.now()) / 1000));
      return {
        label: `Rare ${seconds}s`,
        detail: `${rare?.name || "Rare Spawn"} ${format(hp)} hp`,
        kind: "combat",
        ready: false,
        progress: 1 - Math.max(0, Math.min(1, hp / maxHp))
      };
    }
    const enemy = enemyForCombat(target);
    const hp = Math.max(0, Number(target.enemyHp || 0));
    const maxHp = Math.max(1, Number(target.enemyMaxHp || enemyMaxHealth(target)));
    const progress = 1 - Math.max(0, Math.min(1, hp / maxHp));
    if (isBossWave(target)) {
      const seconds = Math.max(0, Math.ceil((Number(target.bossDeadline || 0) - Date.now()) / 1000));
      return {
        label: `Boss ${seconds}s`,
        detail: `${enemy.name} ${format(hp)} hp`,
        kind: "combat",
        ready: false,
        progress
      };
    }
    return {
      label: `Stage ${combatLabel(target)}`,
      detail: `${enemy.name} ${format(hp)} hp`,
      kind: "combat",
      ready: false,
      progress
    };
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
    return Math.round((420 + level * 180) * Math.pow(1.34, level - 1) * rootBonus(target));
  }

  function environmentForLevel(target = state, offset = 0) {
    const level = Math.max(1, Number(target.meadowLevel || 1) + offset);
    const zoneDepth = Math.floor((level - 1) / 4);
    const index = zoneDepth % environments.length;
    const cycle = Math.floor(zoneDepth / environments.length);
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
    if (tutorial.id === "friend") return "Cap Knight";
    if (isBossWave(target)) return "boss fight";
    if (rushActive(target)) return "glowing";
    const progress = Math.max(0, Math.min(1, Number(target.meadowBloom || 0) / meadowRequirement(target)));
    if (progress >= 0.82) return "roots surging";
    if (progress >= 0.45) return "wiggly";
    if (Number(target.meadowLevel || 1) >= 4) return "happy";
    return "soft glow";
  }

  function tutorialStage(target = state) {
    const clicks = Number(target.clicks || 0);
    if (clicks <= 0) return { id: "sleeping", next: "tap to wake" };
    if (clicks < 5) return { id: "awake", next: `${5 - clicks} taps to First Shroom` };
    if (clicks < 15) return { id: "baby", next: `${15 - clicks} taps to root glow` };
    if (clicks < 25) return { id: "root", next: `${25 - clicks} taps to Cap Knight` };
    if (Number(target.meadowLevel || 1) < 2) return { id: "friend", next: "root ring is waking" };
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
      return { detail: `Spore Bloom ready +${format(bloomGain)}`, kind: "bloom", ready: true };
    }

    const affordableRelic = relics.find(relic => relicUnlocked(relic, target) && relicCaps(target) >= relicUpgradeCost(relic, target));
    if (affordableRelic) {
      return { detail: `upgrade ${affordableRelic.name}`, kind: "relic", id: affordableRelic.id, ready: true };
    }

    const affordableMutation = mutations.find(mutation => mutationUnlocked(mutation, target) && !mutationActive(mutation.id, target) && mutationGoo(target) >= mutationCost(mutation));
    if (affordableMutation) {
      return { detail: `mutate ${affordableMutation.name}`, kind: "mutation", id: affordableMutation.id, ready: true };
    }

    const affordablePerk = earlyPerk || perks.find(perk => perkLevel(perk.id, target) < perk.max && Number(target.rootstock || 0) >= perkCost(perk, target));
    if (affordablePerk) {
      return { detail: `unlock ${affordablePerk.name}`, kind: "perk", ready: true };
    }

    const firstSessionAlly = machines.slice(0, 3).find(machine => {
      return Number(target.machines?.[machine.id] || 0) <= 0 && Number(target.loops || 0) >= machineCost(machine, target);
    });
    if (firstSessionAlly) {
      return { detail: `recruit ${firstSessionAlly.name}`, kind: "piece", ready: true };
    }

    const affordableCharm = earlyCharm || upgrades.find(upgrade => !hasUpgrade(upgrade.id, target) && upgrade.req(target) && Number(target.loops || 0) >= upgrade.cost);
    if (affordableCharm) {
      return { detail: `wake ${affordableCharm.name}`, kind: "charm", ready: true };
    }

    const affordablePiece = earlyPiece || [...machines].reverse().find(machine => Number(target.loops || 0) >= machineCost(machine, target));
    if (affordablePiece) {
      return { detail: `recruit ${affordablePiece.name}`, kind: "piece", ready: true };
    }

    if (target.lastDaily !== todayKey() && ownedTotal(target) > 0) {
      return { detail: "daily goal ready", kind: "dew", ready: true };
    }

    const fight = combatGoal(target);
    if (isBossWave(target) || Number(target.enemyHp || 0) < Number(target.enemyMaxHp || 1)) {
      return { detail: fight.detail, kind: "combat", ready: false };
    }

    const nextMilestone = nextClickMilestone(target);
    const nextPiece = machines.find(machine => Number(target.loops || 0) < machineCost(machine, target));
    const pieceNeed = nextPiece ? Math.max(0, machineCost(nextPiece, target) - Number(target.loops || 0)) : Infinity;
    const bloomNeed = Math.max(0, bloomRequirement(target) - Number(target.totalLoops || 0));

    if (nextMilestone && Number(nextMilestone.clicks || 0) - Number(target.clicks || 0) <= 90) {
      return { detail: `${format(nextMilestone.clicks - Number(target.clicks || 0))} taps to ${nextMilestone.name}`, kind: "tap", ready: false };
    }

    if (nextPiece && (pieceNeed <= bloomNeed || incomePerSecond(target) > 0)) {
      return { detail: `${format(pieceNeed)} nutrients to ${nextPiece.name}`, kind: "piece", ready: false };
    }

    return { detail: `${format(bloomNeed)} run nutrients to Spore Bloom`, kind: "bloom", ready: false };
  }

  function compactGoalLabel(detail) {
    const text = String(detail || "");
    return text.replace(/^(\d+(?:\.\d+)?[A-Za-z]*) taps to .+$/i, "$1 taps");
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
        detail: `Spore Bloom for ${format(bloomGain)} Ancient Spores`,
        kind: "bloom",
        ready: true
      };
    }

    const affordableRelic = relics.find(relic => relicUnlocked(relic, target) && relicCaps(target) >= relicUpgradeCost(relic, target));
    if (affordableRelic) {
      return {
        label: affordableRelic.name,
        detail: `Relic level ${format(relicLevel(affordableRelic.id, target) + 1)}`,
        kind: "relic",
        id: affordableRelic.id,
        ready: true
      };
    }

    const affordableMutation = mutations.find(mutation => mutationUnlocked(mutation, target) && !mutationActive(mutation.id, target) && mutationGoo(target) >= mutationCost(mutation));
    if (affordableMutation) {
      return {
        label: affordableMutation.name,
        detail: affordableMutation.desc,
        kind: "mutation",
        id: affordableMutation.id,
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

    const firstSessionAlly = machines.slice(0, 3).find(machine => {
      return Number(target.machines?.[machine.id] || 0) <= 0 && Number(target.loops || 0) >= machineCost(machine, target);
    });
    if (firstSessionAlly) {
      return {
        label: `Recruit ${firstSessionAlly.name}`,
        detail: `Adds +${format(firstSessionAlly.rate * rateMultiplier(target))} idle damage/sec`,
        kind: "piece",
        id: firstSessionAlly.id,
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
        label: `Recruit ${affordablePiece.name}`,
        detail: `Adds +${format(affordablePiece.rate * rateMultiplier(target))} idle damage/sec`,
        kind: "piece",
        id: affordablePiece.id,
        ready: true
      };
    }

    if (target.lastDaily !== todayKey() && ownedTotal(target) > 0) {
      return { label: "Claim daily goal", detail: "Daily reward ready", kind: "dew", ready: true };
    }

    const fight = combatGoal(target);
    if (isBossWave(target) || Number(target.enemyHp || 0) < Number(target.enemyMaxHp || 1) || !nextClickMilestone(target)) {
      return fight;
    }

    const nextPiece = machines.find(machine => Number(target.loops || 0) < machineCost(machine, target));
    if (nextPiece) {
      const needed = Math.max(0, machineCost(nextPiece, target) - Number(target.loops || 0));
      return {
        label: `${format(needed)} to ${nextPiece.name}`,
        detail: `Next ally: ${nextPiece.name}`,
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
    if (goal.kind === "combat") {
      return Number(goal.progress || combatGoal(target).progress || 0);
    }
    const tutorial = tutorialStage(target);
    const clicks = Number(target.clicks || 0);
    const tutorialTargets = { sleeping: 1, awake: 5, baby: 15, root: 25 };
    if (tutorialTargets[tutorial.id]) return clicks / tutorialTargets[tutorial.id];
    const milestone = nextClickMilestone(target);
    if (milestone?.clicks) return clicks / milestone.clicks;
    return 0;
  }

  function clampProgress(value) {
    return Math.max(0, Math.min(1, Number(value) || 0));
  }

  function nextShroomForm(target = state) {
    const current = currentShroomForm(target);
    const currentIndex = shroomForms.findIndex(form => form.id === current.id);
    return shroomForms[currentIndex + 1] || null;
  }

  function shroomFormProgress(formId, target = state) {
    const depth = bestCombatDepth(target);
    const clicks = Number(target.clicks || 0);
    const blooms = Number(target.bloomCount || 0);
    const ancient = ancientSporePower(target);
    const checks = {
      capblade: Math.max(depth / 12, clicks / 140),
      sporeheart: Math.max(depth / 35, blooms / 1),
      "mycelium-lord": Math.max(depth / 80, ancient / 8),
      "bloom-king": Math.max(depth / 160, blooms / 5),
      "fungal-god": Math.max(depth / 320, ancient / 40)
    };
    return clampProgress(checks[formId] ?? 1);
  }

  function shroomFormDetail(formId, target = state) {
    const depth = bestCombatDepth(target);
    const clicks = Number(target.clicks || 0);
    const blooms = Number(target.bloomCount || 0);
    const ancient = ancientSporePower(target);
    if (formId === "capblade") return `${format(Math.max(0, 12 - depth))} depth or ${format(Math.max(0, 140 - clicks))} taps`;
    if (formId === "sporeheart") return `${format(Math.max(0, 35 - depth))} depth or first Spore Bloom`;
    if (formId === "mycelium-lord") return `${format(Math.max(0, 80 - depth))} depth or ${format(Math.max(0, 8 - ancient))} ancient power`;
    if (formId === "bloom-king") return `${format(Math.max(0, 5 - blooms))} blooms or ${format(Math.max(0, 160 - depth))} depth`;
    if (formId === "fungal-god") return `${format(Math.max(0, 40 - ancient))} ancient power or ${format(Math.max(0, 320 - depth))} depth`;
    return "ancient form reached";
  }

  function allyEmpireGoal(target = state) {
    const loops = Number(target.loops || 0);
    const firstLocked = machines.find(machine => Number(target.machines?.[machine.id] || 0) <= 0);
    if (firstLocked) {
      const cost = machineCost(firstLocked, target);
      return {
        kind: "ally",
        label: firstLocked.name.replace(/^The /, ""),
        title: `Grow ${firstLocked.name}`,
        detail: `${format(Math.max(0, cost - loops))} nutrients to new ally`,
        progress: clampProgress(loops / Math.max(1, cost))
      };
    }

    let best = null;
    machines.forEach(machine => {
      const owned = Math.max(0, Number(target.machines?.[machine.id] || 0));
      if (owned <= 0) return;
      const next = nextAllyMilestone(owned);
      const remaining = Math.max(1, next - owned);
      const progress = clampProgress(owned / Math.max(1, next));
      if (!best || remaining < best.remaining || progress > best.progress) {
        best = {
          kind: "ally",
          label: machine.name.replace(/^The /, ""),
          title: `${machine.name} ${format(owned)}/${format(next)}`,
          detail: `${format(remaining)} levels to ${milestoneText[next] || "power spike"}`,
          progress,
          remaining
        };
      }
    });
    return best || {
      kind: "ally",
      label: "Button Buddies",
      title: "Grow Button Buddies",
      detail: "First automatic shroom ally",
      progress: 0
    };
  }

  function bossEmpireGoal(target = state) {
    ensureCombatState(target);
    const stage = combatStage(target);
    const boss = bossRoster[(stage - 1) % bossRoster.length];
    if (isBossWave(target)) {
      const hp = Math.max(0, Number(target.enemyHp || 0));
      const maxHp = Math.max(1, Number(target.enemyMaxHp || enemyMaxHealth(target)));
      const seconds = Math.max(0, Math.ceil((Number(target.bossDeadline || 0) - Date.now()) / 1000));
      return {
        kind: "boss",
        label: boss.name,
        title: `Defeat ${boss.name}`,
        detail: `${seconds}s / ${format(hp)} hp`,
        progress: clampProgress(1 - hp / maxHp)
      };
    }
    const wavesLeft = Math.max(0, combatWavesPerStage - combatWave(target));
    return {
      kind: "boss",
      label: boss.name,
      title: `Boss: ${boss.name}`,
      detail: `${format(wavesLeft)} waves to boss`,
      progress: clampProgress((combatWave(target) - 1) / Math.max(1, combatWavesPerStage - 1))
    };
  }

  function relicProgress(relic, target = state) {
    const checks = {
      "elder-spore-crown": Number(target.bossDefeats || 0) / 1,
      "rotwood-idol": bestCombatDepth(target) / 24,
      "moonlit-mycelium": Number(target.bloomCount || 0) / 1,
      "compost-chalice": Number(target.bossDefeats || 0) / 4,
      "fairy-ring-compass": bestCombatDepth(target) / 55,
      "salt-cracked-shell": Number(target.bossDefeats || 0) / 8,
      "lantern-mold": Number(target.dailyClaims || 0) / 2,
      "rootbone-drum": Number(target.rushes || 0) / 3,
      "sporeglass-lens": Number(target.maxCombo || 0) / 40,
      "ancient-capstone": bestCombatDepth(target) / 120
    };
    return clampProgress(checks[relic.id] ?? 0);
  }

  function systemEmpireGoal(target = state) {
    const readyMutation = mutations.find(mutation => mutationUnlocked(mutation, target) && !mutationActive(mutation.id, target) && mutationGoo(target) >= mutationCost(mutation));
    if (readyMutation) {
      return {
        kind: "mutation",
        label: readyMutation.name,
        title: `Mutate ${readyMutation.name}`,
        detail: readyMutation.desc,
        progress: 1,
        ready: true
      };
    }

    const readyRelic = relics.find(relic => relicUnlocked(relic, target) && relicCaps(target) >= relicUpgradeCost(relic, target));
    if (readyRelic) {
      return {
        kind: "relic",
        label: readyRelic.name,
        title: `Upgrade ${readyRelic.name}`,
        detail: `Relic level ${format(relicLevel(readyRelic.id, target) + 1)}`,
        progress: 1,
        ready: true
      };
    }

    const nextMutation = mutations.find(mutation => !mutationActive(mutation.id, target));
    const nextRelic = relics.find(relic => !relicUnlocked(relic, target));
    if (nextMutation && mutationUnlocked(nextMutation, target)) {
      const cost = mutationCost(nextMutation);
      return {
        kind: "mutation",
        label: nextMutation.name,
        title: `Mutation: ${nextMutation.name}`,
        detail: `${format(Math.max(0, cost - mutationGoo(target)))} Mutation Goo needed`,
        progress: clampProgress(mutationGoo(target) / Math.max(1, cost))
      };
    }
    if (nextMutation) {
      const level = Math.max(0, Number(target.machines?.[nextMutation.machine] || 0));
      return {
        kind: "mutation",
        label: nextMutation.name,
        title: `Mutation: ${nextMutation.name}`,
        detail: `${format(Math.max(0, nextMutation.level - level))} ${nextMutation.family} levels needed`,
        progress: clampProgress(level / Math.max(1, nextMutation.level))
      };
    }
    if (nextRelic) {
      return {
        kind: "relic",
        label: nextRelic.name,
        title: `Relic: ${nextRelic.name}`,
        detail: nextRelic.desc,
        progress: relicProgress(nextRelic, target)
      };
    }
    const lowestRelic = [...relics].sort((a, b) => relicLevel(a.id, target) - relicLevel(b.id, target))[0];
    return {
      kind: "relic",
      label: lowestRelic?.name || "Relics",
      title: `Relic: ${lowestRelic?.name || "Ancient cache"}`,
      detail: `${format(relicCaps(target))} Relic Caps held`,
      progress: lowestRelic ? clampProgress(relicCaps(target) / Math.max(1, relicUpgradeCost(lowestRelic, target))) : 1
    };
  }

  function bloomEmpireGoal(target = state) {
    const gain = bloomGainFor(target);
    const required = bloomRequirement(target);
    return {
      kind: "bloom",
      label: "Spore Bloom",
      title: gain > 0 ? `Spore Bloom +${format(gain)}` : "Spore Bloom",
      detail: gain > 0 ? "Release the colony. Return stronger." : `${format(Math.max(0, required - Number(target.totalLoops || 0)))} run nutrients needed`,
      progress: gain > 0 ? 1 : clampProgress(Number(target.totalLoops || 0) / Math.max(1, required)),
      ready: gain > 0
    };
  }

  function worldEmpireGoal(target = state) {
    const current = currentWorldRegion(target);
    const next = nextWorldRegion(target);
    if (!next) {
      return {
        kind: "world",
        label: current.name,
        title: current.name,
        detail: "world layer conquered",
        progress: 1
      };
    }
    const depth = bestCombatDepth(target);
    const currentDepth = Math.max(1, Number(current.depth || 1));
    const range = Math.max(1, Number(next.depth || currentDepth + 1) - currentDepth);
    return {
      kind: "world",
      label: next.name,
      title: `Spread to ${next.name}`,
      detail: `${format(Math.max(0, next.depth - depth))} depths left`,
      progress: clampProgress((depth - currentDepth) / range)
    };
  }

  function nextEmpireGoal(target = state) {
    const rareSpawn = activeRareSpawn(target);
    if (rareSpawn) {
      const rare = rareSpawnDefinition(rareSpawn.id);
      const hp = Math.max(0, Number(rareSpawn.hp || 0));
      const maxHp = Math.max(1, Number(rareSpawn.maxHp || hp || 1));
      const seconds = Math.max(0, Math.ceil((Number(rareSpawn.expiresAt || 0) - Date.now()) / 1000));
      return {
        kind: "rare",
        title: `Catch ${rare?.name || "Rare Spawn"}`,
        detail: `${seconds}s / ${format(hp)} hp / ${rare?.desc || "rare reward"}`,
        progress: clampProgress(1 - hp / maxHp),
        ready: false
      };
    }

    const tutorial = tutorialStage(target);
    if (tutorial.id !== "forest") {
      return {
        kind: "form",
        title: tutorial.next,
        detail: "First Shroom is waking.",
        progress: goalProgress(primaryGoal(target), target),
        ready: false
      };
    }

    const bloom = bloomEmpireGoal(target);
    if (bloom.ready) return bloom;

    const system = systemEmpireGoal(target);
    if (system.ready) return system;

    if (isBossWave(target)) return bossEmpireGoal(target);

    const form = nextShroomForm(target);
    if (form) {
      const progress = shroomFormProgress(form.id, target);
      if (progress >= 0.28 || bestCombatDepth(target) < 45) {
        return {
          kind: "form",
          title: `Evolve: ${form.name}`,
          detail: shroomFormDetail(form.id, target),
          progress
        };
      }
    }

    const ally = allyEmpireGoal(target);
    const boss = bossEmpireGoal(target);
    if (ally.progress < 1 && (ally.progress >= boss.progress || boss.progress < 0.55)) return ally;
    if (boss.progress < 1) return boss;
    if (system.progress < 1) return system;
    return worldEmpireGoal(target).progress < 1 ? worldEmpireGoal(target) : bloom;
  }

  function empireRoadNodes(target = state) {
    const currentForm = currentShroomForm(target);
    const form = nextShroomForm(target);
    const formProgress = form ? shroomFormProgress(form.id, target) : 1;
    const ally = allyEmpireGoal(target);
    const boss = bossEmpireGoal(target);
    const system = systemEmpireGoal(target);
    const bloom = bloomEmpireGoal(target);
    const world = worldEmpireGoal(target);
    return [
      { kind: "form", label: currentForm.name.replace(" Shroom", ""), progress: form ? formProgress : 1 },
      { ...ally, label: ally.label.replace("Button Buddies", "Buddies").replace("Puffball Bombers", "Puffballs") },
      { ...boss, label: boss.label.replace(/^The /, "").replace("Lawn Mower Titan", "Mower Titan") },
      { ...system, label: system.label.replace(/^The /, "").replace("Elder Spore Crown", "Spore Crown").replace("Volcanic Puffball", "Volcanic Puff") },
      bloom,
      { ...world, label: world.label.replace("Forgotten Greenhouse", "Greenhouse").replace("Underground Ocean", "Ocean") }
    ];
  }

  function usePrimaryGoal() {
    const goal = primaryGoal();
    if (!goal.ready) return;
    if (goal.kind === "bloom") graft();
    if (goal.kind === "perk" && goal.id) buyPerk(goal.id);
    if (goal.kind === "charm" && goal.id) buyUpgrade(goal.id);
    if (goal.kind === "piece" && goal.id) buyMachine(goal.id);
    if (goal.kind === "relic" && goal.id) upgradeRelic(goal.id);
    if (goal.kind === "mutation" && goal.id) activateMutation(goal.id);
    if (goal.kind === "dew") claimDaily();
    render();
  }

  function actionMomentTitle(action) {
    const labels = {
      dew: "daily goal ready",
      bloom: "Spore Bloom ready",
      charm: "new charm ready",
      piece: "shroom ally ready",
      relic: "relic upgrade ready",
      mutation: "mutation ready",
      combat: "fight"
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
    return 1 + ancientSporePower(target) * base + relicLevel("elder-spore-crown", target) * 0.035;
  }

  function rateMultiplier(target = state) {
    let mult = rootBonus(target);
    mult *= 1 + perkLevel("spore-memory", target) * 0.18;
    mult *= 1 + relicLevel("rotwood-idol", target) * 0.08 + relicLevel("moonlit-mycelium", target) * 0.07;
    if (mutationActive("volcanic-puffball", target)) mult *= 1.18;
    if (mutationActive("rootbeast-alpha", target)) mult *= 1.22;
    upgrades.forEach(upgrade => {
      if (upgrade.kind === "rate" && hasUpgrade(upgrade.id, target)) mult *= upgrade.value;
    });
    if (Date.now() < Number(target.focusUntil || 0)) mult *= 2;
    if (postBloomSurgeActive(target)) mult *= 2.5;
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
      tap *= 1 + Number(target.machines.clock || 0) * 0.08;
    }
    tap *= 1 + perkLevel("soft-hands", target) * 0.25;
    tap *= 1 + relicLevel("sporeglass-lens", target) * 0.055;
    if (mutationActive("ghostcap-knight", target)) tap *= 1.18;
    if (rushActive(target)) tap *= 2;
    if (postBloomSurgeActive(target)) tap *= 3;
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
    const count = Number(state.machines[id] || 0);
    const milestone = allyMilestones.includes(count);
    pushBattleEvent("upgrade", { machine: id, milestone, duration: milestone ? 1200 : 760 });
    addRushCharge(4);
    displayedRate = Math.max(displayedRate, incomePerSecond());
    playTone(milestone ? "unlock" : "buy", milestone ? 6 : 4);
    showMoment(
      milestone ? `${machine.name} evolved` : machine.name,
      milestone ? `${milestoneText[count] || "power spike"} unlocked` : `${format(incomePerSecond())} idle damage/sec`,
      milestone ? "unlock" : "buy"
    );
    if (milestone) pulseScene("scene-bloomed");
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

  function upgradeRelic(id) {
    const relic = relics.find(item => item.id === id);
    if (!relic || !relicUnlocked(relic)) return;
    const cost = relicUpgradeCost(relic);
    if (relicCaps() < cost) return;
    if (!state.relicLevels || typeof state.relicLevels !== "object") {
      state.relicLevels = Object.fromEntries(relics.map(item => [item.id, 0]));
    }
    state.spentRelicCaps = Math.max(0, Number(state.spentRelicCaps || 0)) + cost;
    state.relicLevels[id] = relicLevel(id) + 1;
    pushBattleEvent("relic", { relic: id, duration: 1300 });
    addRushCharge(9);
    displayedRate = Math.max(displayedRate, incomePerSecond());
    playTone("unlock", 5);
    showMoment(relic.name, `level ${format(state.relicLevels[id])}`, "unlock");
    pulseScene("scene-bloomed");
    markDirty();
    render();
  }

  function activateMutation(id) {
    const mutation = mutations.find(item => item.id === id);
    if (!mutation || !mutationUnlocked(mutation) || mutationActive(id)) return;
    const cost = mutationCost(mutation);
    if (mutationGoo() < cost) return;
    if (!Array.isArray(state.activeMutations)) state.activeMutations = [];
    state.spentMutationGoo = Math.max(0, Number(state.spentMutationGoo || 0)) + cost;
    state.activeMutations.push(id);
    pushBattleEvent("mutation", { mutation: id, duration: 1500 });
    addRushCharge(14);
    displayedRate = Math.max(displayedRate, incomePerSecond());
    playTone("great", 5);
    showMoment(mutation.name, mutation.desc, "great");
    pulseScene("scene-bloomed");
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
    const keptBossIds = Array.isArray(state.defeatedBossIds) ? [...state.defeatedBossIds] : [];
    const keptRelicIds = Array.isArray(state.foundRelicIds) ? [...state.foundRelicIds] : [];
    const bestFirstBloomSeconds = Number(state.bestFirstBloomSeconds || 0);
    const totalAncientPower = ancientSporePower(state) + gain;
    state.rootstock += gain;
    state.lifetimeRootstock = totalAncientPower;
    state.lastBloomGain = gain;
    state.postBloomBoostUntil = Date.now() + 22000;
    state.bloomCount = Number(state.bloomCount || 0) + 1;
    state.loops = 0;
    state.totalLoops = 0;
    state.clicks = 0;
    state.focusUntil = 0;
    state.rushCharge = 0;
    state.rushUntil = 0;
    state.skillCooldowns = {};
    state.lastSkillCast = "";
    state.meadowLevel = 1;
    state.meadowBloom = 0;
    state.combatStage = 1;
    state.combatWave = 1;
    state.enemyHp = 0;
    state.enemyMaxHp = 0;
    state.enemyKey = "";
    state.bossDeadline = 0;
    state.claimedClickMilestones = [];
    state.firstTapAt = 0;
    state.firstBloomSeconds = 0;
    state.bestFirstBloomSeconds = bestFirstBloomSeconds;
    state.machines = keep.machines;
    state.perks = keptPerks;
    state.upgrades = [];
    state.achievements = keptAchievements;
    state.defeatedBossIds = keptBossIds;
    state.foundRelicIds = keptRelicIds;
    if (perkLevel("starter-cap", state) > 0) {
      state.machines.plot = 3;
      displayedRate = incomePerSecond();
    }
    ensureCombatState(state);
    clickRateBurst = 0;
    pushBattleEvent("bloom", { duration: 1900 });
    playTone("great");
    showMoment("Spore Bloom", `+${format(gain)} Ancient Spores / bloom ${format(state.bloomCount)}`, "great");
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
    showMoment("daily goal", `+${format(reward)} nutrients`, "dew");
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
    const ancientPower = ancientSporePower();
    const tapTarget = 65 + Math.min(135, ancientPower * 10);
    const pieceTarget = Math.max(3, Math.min(18, 5 + ancientPower));
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
        name: "Recruit allies",
        desc: `Recruit ${format(pieceTarget)} shroom allies today.`,
        current: Math.max(0, ownedTotal(state) - Number(base.pieces || 0)),
        target: pieceTarget,
        reward: Math.max(450, incomePerSecond() * 240 + tapPower() * 80)
      },
      {
        id: "spores",
        name: "Nutrient sprint",
        desc: `Earn ${format(sporeTarget)} nutrients today.`,
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
    showMoment(quest.name, `+${format(quest.reward)} nutrients`, "unlock");
    markDirty();
    checkAchievements();
    render();
  }

  async function requestRewardedBoost() {
    const ads = window.IDLE_SHROOM_ADS || window.MUSHROOM_BOOP_ADS || {};
    const rewardId = String(ads.admob?.rewardedUnitId || "").trim();
    const nativeRewardedAd = window.IdleShroomRewardedAd || window.MushroomBoopRewardedAd || window.Capacitor?.Plugins?.IdleShroomRewardedAd || window.Capacitor?.Plugins?.MushroomBoopRewardedAd;
    if (nativeRewardedAd?.show && rewardId) {
      return nativeRewardedAd.show({ adUnitId: rewardId });
    }
    return { rewarded: true, demo: true };
  }

  async function useFocus() {
    const now = Date.now();
    if (now < Number(state.focusUntil || 0)) return;
    els.focusButton.disabled = true;
    els.focusButton.textContent = "calling storm";
    const result = await requestRewardedBoost().catch(() => ({ rewarded: false }));
    if (!result.rewarded) {
      els.boostHint.textContent = "Reward ad was not completed. Nutrient Frenzy stayed inactive.";
      renderFocus();
      return;
    }
    const boostMinutes = 10 + perkLevel("long-boost") * 2;
    state.focusUntil = now + boostMinutes * 60 * 1000;
    addRushCharge(35);
    displayedRate = Math.max(displayedRate, incomePerSecond());
    els.boostHint.textContent = "Nutrient Frenzy active.";
    playTone("shower");
    showMoment("Nutrient Frenzy", `${Math.round(boostMinutes)} minute boost`, "shower");
    markDirty();
    checkAchievements();
    render();
  }

  function skillCooldown(skill, target = state) {
    const rootbone = 1 - Math.min(0.38, relicLevel("rootbone-drum", target) * 0.045);
    return Math.max(10, skill.cooldown * rootbone);
  }

  function skillRemaining(skill, target = state) {
    return Math.max(0, Number(target.skillCooldowns?.[skill.id] || 0) - Date.now());
  }

  function skillUnlocked(skill, target = state) {
    return !skill.unlock || skill.unlock(target);
  }

  function renderSkills() {
    activeSkills.forEach(skill => {
      const button = els[skill.button];
      if (!button) return;
      const unlocked = skillUnlocked(skill);
      const remainingMs = skillRemaining(skill);
      const ready = unlocked && remainingMs <= 0;
      button.disabled = !ready;
      button.textContent = remainingMs > 0 ? `${skill.short} ${Math.ceil(remainingMs / 1000)}s` : skill.short;
      button.title = unlocked ? `${skill.name}: ${skill.desc}` : `${skill.name} unlocks as the colony grows.`;
      button.dataset.ready = ready ? "true" : remainingMs > 0 ? "active" : "false";
      button.dataset.locked = unlocked ? "false" : "true";
      button.dataset.skill = skill.id;
    });
  }

  function useActiveSkill(id) {
    const skill = activeSkills.find(item => item.id === id);
    if (!skill || !skillUnlocked(skill) || skillRemaining(skill) > 0) return;
    if (!state.skillCooldowns || typeof state.skillCooldowns !== "object") state.skillCooldowns = {};
    ensureCombatState(state);
    let detail = "";
    if (skill.reward) {
      const reward = Math.max(0, skill.reward(state));
      addLoops(state, reward);
      addMeadowCare(reward * 0.12);
      recordSporeBurst(reward);
      detail = `+${format(reward)} nutrients`;
      showEnemyReward(reward, skill.name, false);
      playTone("dew", 5);
    } else {
      const damage = Math.max(1, skill.damage(state));
      const result = damageEnemy(damage, { hot: true, visual: true });
      detail = result.defeated > 0 ? `${format(result.reward)} nutrients dropped` : `-${format(damage)} damage`;
      playTone(skill.id === "ancient-bloom" ? "great" : "shower", 6);
    }
    state.skillCooldowns[skill.id] = Date.now() + skillCooldown(skill) * 1000;
    state.lastSkillCast = skill.id;
    pushBattleEvent("skill", { skill: skill.id, duration: skill.id === "ancient-bloom" ? 1500 : 980 });
    addRushCharge(skill.id === "ancient-bloom" ? 30 : 15);
    pulseScene(skill.id === "ancient-bloom" ? "scene-bloomed" : "scene-impact");
    showMoment(skill.name, detail, skill.id === "ancient-bloom" ? "great" : "unlock");
    haptic(skill.id === "ancient-bloom" ? [18, 24, 18, 42] : [10, 18, 10]);
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
    showMoment("welcome back", `+${format(reward)} nutrients / ${formatDuration(state.offlineSeconds)} away`, "dew");
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
    const foundRelics = recordNewRelics(state);
    if (unlockedNow.length) {
      const latest = unlockedNow[unlockedNow.length - 1];
      showMoment(latest.name, "badge unlocked", "badge");
      playTone("unlock", 3 + unlockedNow.length);
    }
    if (foundRelics.length) {
      const latestRelic = foundRelics[foundRelics.length - 1];
      pushBattleEvent("relic", { relic: latestRelic.id, duration: 1400 });
      showMoment(latestRelic.name, "relic found", "unlock");
      playTone("unlock", 5 + foundRelics.length);
      markDirty();
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
    const showFullImpact = !testPlayMode || state.clicks % 50 === 0;
    const gained = tapPower() * comboTapMultiplier(comboCount);
    const rareHit = damageRareSpawn(gained * 1.35, { hot: comboCount >= 8, visual: showFullImpact });
    const combat = damageEnemy(rareHit.changed ? gained * 0.35 : gained, { hot: comboCount >= 8, visual: showFullImpact && !rareHit.defeated });
    if (showFullImpact) pushBattleEvent("tap", { hot: comboCount >= 8, duration: comboCount >= 8 ? 720 : 560 });
    addLoops(state, gained);
    const meadow = addMeadowCare(gained);
    recordSporeBurst(gained);
    state.clicks += 1;
    const milestone = claimClickMilestones();
    addRushCharge(2 + Math.min(5, comboCount / 6));
    markDirty();
    checkAchievements();
    if (showFullImpact) showPop(x, y, `+${format(gained)}`, comboCount);
    if (milestone.reward > 0) {
      showPop(rect.left + rect.width / 2, rect.bottom - 16, `${milestone.latest.name} +${format(milestone.reward)}`, comboCount + 8);
      showMoment(milestone.latest.name, `+${format(milestone.reward)} nutrients`, "badge");
      playTone("bloom", comboCount + 2);
    }
    if (meadow.blooms > 0) {
      showPop(rect.left + rect.width / 2, rect.top + 24, `bloom +${format(meadow.reward)}`, comboCount + 8);
      showMoment(meadow.latest?.label || meadowTitle(), meadow.blooms > 1 ? `${meadow.blooms} zone surges` : "new zone surge", "meadow");
      playTone("bloom", comboCount);
    } else if (rareHit.defeated) {
      addRushCharge(12);
    } else if (combat.defeated > 0) {
      addRushCharge(5 + Math.min(10, combat.defeated * 2));
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

  function pushBattleEvent(kind, detail = {}) {
    if (testPlayMode) return;
    battleEvents.push({
      kind,
      createdAt: performance.now(),
      duration: detail.duration || (kind === "bloom" ? 1900 : kind === "defeat" ? 1100 : 760),
      ...detail
    });
    while (battleEvents.length > 70) battleEvents.shift();
  }

  function startBattleRenderer() {
    if (!els.battleCanvas || battleAnimationFrame) return;
    const step = now => {
      drawBattleFrame(now);
      battleAnimationFrame = window.requestAnimationFrame(step);
    };
    battleAnimationFrame = window.requestAnimationFrame(step);
  }

  function fitBattleCanvas(canvas, rect) {
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
  }

  function fillGlow(ctx, x, y, radius, color, alpha = 1) {
    if (!Number.isFinite(radius) || radius <= 0) return;
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, color.replace(")", `, ${alpha})`).replace("rgb", "rgba"));
    gradient.addColorStop(1, color.replace(")", ", 0)").replace("rgb", "rgba"));
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawAtlasSprite(ctx, key, x, y, width, height, options = {}) {
    const sprite = battleSprites[key];
    if (!sprite || !battleSpriteReady || !battleSpriteAtlas.naturalWidth) return false;
    const scaleX = battleSpriteAtlas.naturalWidth / battleSpriteAtlasBase;
    const scaleY = battleSpriteAtlas.naturalHeight / battleSpriteAtlasBase;
    const [sx, sy, sw, sh] = sprite.source;
    const sourceRatio = sw / Math.max(1, sh);
    const targetRatio = width / Math.max(1, height);
    let drawWidth = width;
    let drawHeight = height;
    if (sourceRatio > targetRatio) {
      drawHeight = width / sourceRatio;
    } else {
      drawWidth = height * sourceRatio;
    }
    const offsetX = Number(options.offsetX || 0);
    const offsetY = Number(options.offsetY || 0);
    ctx.save();
    ctx.globalAlpha *= options.alpha === undefined ? 1 : options.alpha;
    ctx.translate(x + offsetX, y + offsetY);
    if (options.rotation) ctx.rotate(options.rotation);
    if (options.flip) ctx.scale(-1, 1);
    ctx.drawImage(
      battleSpriteAtlas,
      sx * scaleX,
      sy * scaleY,
      sw * scaleX,
      sh * scaleY,
      -drawWidth / 2,
      -drawHeight / 2,
      drawWidth,
      drawHeight
    );
    ctx.restore();
    return true;
  }

  function spriteKeyForEnemy(enemy, boss) {
    const id = enemy?.id || "";
    if (id.includes("mower")) return "mowerTitan";
    if (id.includes("boot") || id.includes("gardener")) return "gardenBoot";
    if (id.includes("sluggo")) return "kingSluggo";
    if (id.includes("slug") || id.includes("snail")) return boss ? "kingSluggo" : "mossSlug";
    if (id.includes("beetle") || id.includes("mite")) return "sapBeetle";
    return "";
  }

  function spriteKeyForAlly(type) {
    return {
      plot: "buttonBuddy",
      spring: "buttonBuddy",
      press: "capKnight",
      greenhouse: "capKnight",
      rail: "capKnight",
      clock: "puffball",
      collector: "mage",
      relay: "mage",
      bell: "mage",
      aurora: "mage"
    }[type] || "";
  }

  function colorForEnemy(enemy, boss) {
    const colors = [
      ["#79d95f", "#2f7138", "#ffe680"],
      ["#a6d87a", "#5b7c45", "#eaffb3"],
      ["#caa06a", "#6f4432", "#ffe09a"],
      ["#8b76ff", "#352b82", "#dec8ff"],
      ["#d98573", "#70382f", "#ffe09a"],
      ["#9aa093", "#303a34", "#f3f1c4"],
      ["#7ed2c8", "#244f55", "#d2fff8"],
      ["#c4cc75", "#4e5a25", "#fff08d"],
      ["#b6e07a", "#4f7438", "#ffd961"],
      ["#7f7ad9", "#273064", "#e2dbff"],
      ["#c47d5a", "#563020", "#fff0ac"],
      ["#efb77e", "#6d4130", "#ffe0a3"],
      ["#87694f", "#2e2721", "#fff2bd"],
      ["#b74c3c", "#3e3e36", "#ffe064"],
      ["#b4c48b", "#536d52", "#f8ffc6"],
      ["#cdb179", "#51442e", "#ffe39d"],
      ["#83bb69", "#243b25", "#cfff8c"],
      ["#a7a0a0", "#3a3a40", "#f5e6c6"]
    ];
    const base = colors[enemy.variant % colors.length] || colors[0];
    return boss ? [base[0], base[1], "#fff0a6"] : base;
  }

  function drawEnemyShape(ctx, enemy, x, y, size, now, boss, hitPulse) {
    const [a, b, c] = colorForEnemy(enemy, boss);
    const wobble = Math.sin(now / 260) * (boss ? 3 : 2);
    const stomp = boss ? Math.sin(now / 180) * 2 : 0;
    ctx.save();
    ctx.translate(x, y + stomp);
    ctx.scale(1 + hitPulse * 0.08, 1 - hitPulse * 0.06);
    ctx.rotate((Math.sin(now / 470) * 0.025) + wobble * 0.002);
    fillGlow(ctx, 0, 8, size * 1.25, "rgb(180, 255, 128)", boss ? .22 : .13);
    ctx.fillStyle = "rgba(0,0,0,.28)";
    ctx.beginPath();
    ctx.ellipse(0, size * .55, size * .72, size * .18, 0, 0, Math.PI * 2);
    ctx.fill();

    const spriteKey = spriteKeyForEnemy(enemy, boss);
    if (spriteKey) {
      const tall = spriteKey === "gardenBoot";
      const mower = spriteKey === "mowerTitan";
      const slugBoss = spriteKey === "kingSluggo";
      const width = size * (mower ? 2.65 : tall ? 2 : slugBoss ? 2.65 : 2.25);
      const height = size * (mower ? 2.25 : tall ? 2.75 : slugBoss ? 2.35 : 1.85);
      const offsetY = tall ? -size * .12 : mower ? -size * .02 : spriteKey === "sapBeetle" ? -size * .03 : 0;
      if (drawAtlasSprite(ctx, spriteKey, 0, -size * .04, width, height, { offsetY })) {
        if (hitPulse > 0) {
          ctx.globalAlpha = hitPulse;
          ctx.strokeStyle = "#fff6b9";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.ellipse(0, 0, size * .86, size * .62, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
        return;
      }
    }

    if (enemy.id.includes("slug") || enemy.id.includes("snail") || enemy.id.includes("sluggo")) {
      const body = ctx.createLinearGradient(-size, -size * .15, size, size * .45);
      body.addColorStop(0, a);
      body.addColorStop(1, b);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, size * .15, size * .72, size * .42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = c;
      [-.3, .28].forEach(side => {
        ctx.beginPath();
        ctx.moveTo(size * side, -size * .22);
        ctx.quadraticCurveTo(size * (side - .08), -size * .68, size * (side + .03), -size * .78);
        ctx.lineWidth = Math.max(2, size * .035);
        ctx.strokeStyle = a;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(size * (side + .03), -size * .8, size * .06, 0, Math.PI * 2);
        ctx.fill();
      });
      if (boss) drawTinyCrown(ctx, -size * .05, -size * .6, size * .28);
    } else if (enemy.id.includes("boot")) {
      ctx.fillStyle = b;
      roundedRect(ctx, -size * .42, -size * .58, size * .5, size * .88, size * .12);
      ctx.fill();
      ctx.fillStyle = a;
      roundedRect(ctx, -size * .38, size * .02, size * .94, size * .34, size * .12);
      ctx.fill();
      ctx.fillStyle = c;
      ctx.fillRect(-size * .3, -size * .42, size * .28, size * .05);
      ctx.fillRect(-size * .3, -size * .24, size * .28, size * .05);
    } else if (enemy.id.includes("mower")) {
      ctx.fillStyle = b;
      roundedRect(ctx, -size * .68, -size * .25, size * 1.2, size * .48, size * .14);
      ctx.fill();
      ctx.fillStyle = a;
      roundedRect(ctx, -size * .5, -size * .5, size * .8, size * .38, size * .12);
      ctx.fill();
      ctx.strokeStyle = c;
      ctx.lineWidth = size * .045;
      ctx.beginPath();
      ctx.moveTo(size * .2, -size * .46);
      ctx.lineTo(size * .7, -size * .82);
      ctx.stroke();
      [-.35, .35].forEach(side => {
        ctx.fillStyle = "#1b211d";
        ctx.beginPath();
        ctx.arc(size * side, size * .27, size * .16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = c;
        ctx.stroke();
      });
    } else {
      const body = ctx.createLinearGradient(0, -size * .55, 0, size * .5);
      body.addColorStop(0, a);
      body.addColorStop(1, b);
      ctx.fillStyle = body;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * .58, size * .46, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,210,.36)";
      ctx.lineWidth = Math.max(2, size * .035);
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * size * .17, -size * .42);
        ctx.quadraticCurveTo(i * size * .11, 0, i * size * .17, size * .43);
        ctx.stroke();
      }
      for (let side of [-1, 1]) {
        for (let i = 0; i < 3; i += 1) {
          ctx.strokeStyle = b;
          ctx.beginPath();
          ctx.moveTo(side * size * .38, -size * .18 + i * size * .18);
          ctx.lineTo(side * size * (.58 + i * .04), -size * .28 + i * size * .24);
          ctx.stroke();
        }
      }
      ctx.fillStyle = c;
      [-.18, .18].forEach(ex => {
        ctx.beginPath();
        ctx.arc(size * ex, -size * .12, size * .055, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    if (hitPulse > 0) {
      ctx.globalAlpha = hitPulse;
      ctx.strokeStyle = "#fff6b9";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.ellipse(0, 0, size * .68, size * .52, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawTinyCrown(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = "#ffd95e";
    ctx.beginPath();
    ctx.moveTo(-size * .5, size * .18);
    ctx.lineTo(-size * .38, -size * .25);
    ctx.lineTo(-size * .14, size * .02);
    ctx.lineTo(0, -size * .35);
    ctx.lineTo(size * .14, size * .02);
    ctx.lineTo(size * .38, -size * .25);
    ctx.lineTo(size * .5, size * .18);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawFirstShroom(ctx, x, y, scale, now, form, tapPulse) {
    const breath = Math.sin(now / 520) * 0.035;
    const lift = Math.sin(now / 640) * 3 - tapPulse * 10;
    const god = form.id === "fungal-god";
    const lord = form.id === "mycelium-lord" || form.id === "bloom-king" || god;
    ctx.save();
    ctx.translate(x, y + lift);
    ctx.scale(scale * (1 + tapPulse * .05), scale * (1 + breath - tapPulse * .06));
    fillGlow(ctx, 0, -24, god ? 92 : 58, god ? "rgb(163, 125, 255)" : "rgb(255, 214, 92)", god ? .26 : .18);
    ctx.fillStyle = "rgba(0,0,0,.34)";
    ctx.beginPath();
    ctx.ellipse(0, 46, 42, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    const heroSpriteKey = form.id === "sprout" ? "firstShroom" : "capblade";
    if (drawAtlasSprite(ctx, heroSpriteKey, 0, 0, god ? 132 : 118, god ? 145 : 132, { offsetY: god ? -2 : 0 })) {
      if (tapPulse > 0) {
        ctx.strokeStyle = "rgba(255, 241, 159, .9)";
        ctx.lineWidth = 5;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(24, -35 - tapPulse * 18);
        ctx.quadraticCurveTo(54, -50 - tapPulse * 26, 71, -18 - tapPulse * 12);
        ctx.stroke();
        for (let i = 0; i < 9; i += 1) {
          ctx.fillStyle = i % 2 ? "#baff86" : "#fff1a4";
          ctx.beginPath();
          ctx.arc(-34 + i * 9, -44 - Math.sin(i + tapPulse * 8) * 7, 2.5 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (form.id === "sporeheart" || form.id === "bloom-king" || god) {
        fillGlow(ctx, 0, -24, god ? 104 : 72, god ? "rgb(166, 125, 255)" : "rgb(132, 255, 118)", god ? .16 : .12);
      }
      if (lord) {
        ctx.strokeStyle = "rgba(126, 255, 117, .76)";
        ctx.lineWidth = 3;
        for (let i = -2; i <= 2; i += 1) {
          ctx.beginPath();
          ctx.moveTo(i * 9, 42);
          ctx.quadraticCurveTo(i * 18, 58, i * 36, 70 + Math.sin(now / 300 + i) * 5);
          ctx.stroke();
        }
      }
      if (form.id === "bloom-king" || god) drawTinyCrown(ctx, 0, -62, 26);
      ctx.restore();
      return;
    }

    ctx.strokeStyle = "#5e3924";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(21, 4);
    ctx.lineTo(43, -32 - tapPulse * 8);
    ctx.stroke();
    ctx.strokeStyle = "#e8c47a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(39, -31 - tapPulse * 8);
    ctx.lineTo(55, -41 - tapPulse * 12);
    ctx.stroke();

    const stem = ctx.createLinearGradient(0, -12, 0, 46);
    stem.addColorStop(0, "#fff2bc");
    stem.addColorStop(1, "#d2ab72");
    ctx.fillStyle = stem;
    roundedRect(ctx, -22, -8, 44, 58, 22);
    ctx.fill();

    const cap = ctx.createLinearGradient(0, -60, 0, -10);
    cap.addColorStop(0, form.id === "sporeheart" ? "#ff6969" : form.id === "bloom-king" ? "#e7aa45" : "#ef4f55");
    cap.addColorStop(1, form.id === "fungal-god" ? "#8d67e7" : "#b83236");
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.ellipse(0, -28, 48, 31, 0, Math.PI, 0);
    ctx.quadraticCurveTo(44, -18, 28, -7);
    ctx.quadraticCurveTo(0, 3, -28, -7);
    ctx.quadraticCurveTo(-44, -18, -48, -28);
    ctx.fill();
    ctx.fillStyle = "#fff6bf";
    [-20, 4, 25].forEach((spot, index) => {
      ctx.globalAlpha = .9 - index * .12;
      ctx.beginPath();
      ctx.arc(spot, -31 - index * 3, 5 + index * 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#171510";
    ctx.beginPath();
    ctx.ellipse(-9, 12, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(11, 11, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#171510";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-15, 4);
    ctx.lineTo(-6, 7);
    ctx.moveTo(5, 7);
    ctx.lineTo(16, 3);
    ctx.stroke();
    if (lord) {
      ctx.strokeStyle = "rgba(126, 255, 117, .76)";
      ctx.lineWidth = 3;
      for (let i = -2; i <= 2; i += 1) {
        ctx.beginPath();
        ctx.moveTo(i * 9, 42);
        ctx.quadraticCurveTo(i * 18, 58, i * 36, 70 + Math.sin(now / 300 + i) * 5);
        ctx.stroke();
      }
    }
    if (form.id === "bloom-king" || god) drawTinyCrown(ctx, 0, -58, 28);
    ctx.restore();
  }

  function drawAlly(ctx, x, y, size, type, now, index, active) {
    const attack = active ? Math.max(0, Math.sin(now / (520 + index * 40) + index) * 1.4) : 0;
    const mutationGlow = activeMutationsForMachine(type).length > 0;
    ctx.save();
    ctx.translate(x, y - attack * 8);
    ctx.scale(size, size * (1 + attack * .04));
    ctx.fillStyle = "rgba(0,0,0,.25)";
    ctx.beginPath();
    ctx.ellipse(0, 19, 18, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    if (mutationGlow) {
      fillGlow(ctx, 0, -8, 34 + attack * 7, type === "clock" ? "rgb(255, 170, 80)" : type === "collector" ? "rgb(139, 226, 255)" : "rgb(155, 255, 116)", .18);
      ctx.strokeStyle = type === "clock" ? "rgba(255, 204, 106, .66)" : "rgba(153, 255, 119, .58)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, -8, 25 + Math.sin(now / 280 + index) * 3, 0, Math.PI * 2);
      ctx.stroke();
    }

    const allySpriteKey = spriteKeyForAlly(type);
    if (allySpriteKey) {
      const targetSize = allySpriteKey === "mage" ? [56, 67] : allySpriteKey === "capKnight" ? [58, 58] : allySpriteKey === "puffball" ? [54, 50] : [48, 45];
      if (drawAtlasSprite(ctx, allySpriteKey, 0, 0, targetSize[0], targetSize[1], { offsetY: allySpriteKey === "mage" ? -3 : 0, flip: index % 2 === 1 })) {
        if (type === "press" || type === "greenhouse" || type === "rail") {
          ctx.strokeStyle = "rgba(255, 235, 143, .86)";
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(9, 2);
          ctx.lineTo(24 + attack * 9, -12 - attack * 9);
          ctx.stroke();
        }
        if (type === "clock" || type === "collector" || type === "bell" || type === "relay" || type === "aurora") {
          fillGlow(ctx, 24 + attack * 10, -18 - attack * 12, 10 + attack * 5, type === "collector" || type === "aurora" ? "rgb(142, 234, 255)" : "rgb(255, 238, 146)", .42);
        }
        if (mutationGlow) {
          ctx.globalCompositeOperation = "screen";
          fillGlow(ctx, 0, -10, 28 + attack * 8, "rgb(186, 255, 122)", .2);
          ctx.globalCompositeOperation = "source-over";
        }
        ctx.restore();
        return;
      }
    }

    const palette = {
      plot: ["#e85052", "#fff0ba"],
      press: ["#d84b42", "#e7c87f"],
      clock: ["#e8efe2", "#fff6cc"],
      collector: ["#8378ff", "#bff2ff"],
      greenhouse: ["#3a2027", "#d0524a"],
      rail: ["#a56f3f", "#edcf88"],
      relay: ["#a68561", "#e8d6a5"],
      bell: ["#f1bf4a", "#ffe3a6"],
      spring: ["#7b5944", "#d8bb84"],
      observatory: ["#6fbd73", "#684a34"],
      aurora: ["#a47bff", "#fff0a6"],
      heartwood: ["#78d67c", "#d9b073"]
    };
    const [cap, stem] = palette[type] || palette.plot;
    ctx.fillStyle = stem;
    roundedRect(ctx, -8, -2, 16, 24, 8);
    ctx.fill();
    ctx.fillStyle = cap;
    ctx.beginPath();
    ctx.ellipse(0, -5, 18, 13, 0, Math.PI, 0);
    ctx.quadraticCurveTo(15, 2, 8, 7);
    ctx.quadraticCurveTo(0, 11, -8, 7);
    ctx.quadraticCurveTo(-15, 2, -18, -5);
    ctx.fill();
    ctx.fillStyle = "#fff6c4";
    ctx.beginPath();
    ctx.arc(-5, -7, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#172015";
    ctx.beginPath();
    ctx.arc(-4, 8, 2, 0, Math.PI * 2);
    ctx.arc(5, 8, 2, 0, Math.PI * 2);
    ctx.fill();
    if (type === "press" || type === "greenhouse") {
      ctx.strokeStyle = type === "greenhouse" ? "#1d1620" : "#5f3922";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(10, 4);
      ctx.lineTo(23 + attack * 8, -10 - attack * 8);
      ctx.stroke();
    }
    if (type === "clock" || type === "collector" || type === "bell") {
      ctx.strokeStyle = type === "collector" ? "#93f1ff" : "#fff2a4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, -6);
      ctx.quadraticCurveTo(20 + attack * 8, -18 - attack * 12, 32 + attack * 14, -24 - attack * 16);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawCapHouse(ctx, x, y, size, capColor, stemColor, now, index) {
    const breathe = 1 + Math.sin(now / 900 + index) * .025;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size * breathe, size);
    ctx.fillStyle = "rgba(0,0,0,.22)";
    ctx.beginPath();
    ctx.ellipse(0, 25, 34, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = stemColor;
    roundedRect(ctx, -17, -4, 34, 34, 12);
    ctx.fill();
    ctx.fillStyle = capColor;
    ctx.beginPath();
    ctx.ellipse(0, -4, 34, 18, 0, Math.PI, 0);
    ctx.quadraticCurveTo(29, 3, 17, 11);
    ctx.quadraticCurveTo(0, 18, -17, 11);
    ctx.quadraticCurveTo(-29, 3, -34, -4);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 248, 182, .9)";
    [-14, 3, 18].forEach((spot, spotIndex) => {
      ctx.beginPath();
      ctx.arc(spot, -7 - spotIndex, 3 + spotIndex * .7, 0, Math.PI * 2);
      ctx.fill();
    });
    fillGlow(ctx, 0, 13, 22, "rgb(255, 219, 103)", .18);
    ctx.restore();
  }

  function drawSporeVent(ctx, x, y, size, now, index) {
    const puff = (Math.sin(now / 520 + index * 1.7) + 1) / 2;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(size, size);
    ctx.fillStyle = "#66472c";
    roundedRect(ctx, -7, -30, 14, 38, 7);
    ctx.fill();
    ctx.fillStyle = "#e8d58a";
    ctx.beginPath();
    ctx.ellipse(0, -32, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i += 1) {
      ctx.globalAlpha = (.55 - i * .07) * puff;
      ctx.fillStyle = i % 2 ? "#a8ff91" : "#fff1a2";
      ctx.beginPath();
      ctx.arc((i - 2) * 7, -48 - puff * 20 - i * 5, 3 + (i % 2), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawWorkerShroom(ctx, x, y, size, now, index) {
    const step = Math.sin(now / 230 + index * 1.3) * 3;
    ctx.save();
    ctx.translate(x, y + step);
    ctx.scale(size, size);
    ctx.fillStyle = "rgba(0,0,0,.2)";
    ctx.beginPath();
    ctx.ellipse(0, 15, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f1d49d";
    roundedRect(ctx, -6, -1, 12, 18, 6);
    ctx.fill();
    ctx.fillStyle = index % 3 === 0 ? "#ef5754" : index % 3 === 1 ? "#f1bf4a" : "#7bcf78";
    ctx.beginPath();
    ctx.ellipse(0, -2, 14, 10, 0, Math.PI, 0);
    ctx.quadraticCurveTo(10, 3, 5, 8);
    ctx.quadraticCurveTo(0, 11, -5, 8);
    ctx.quadraticCurveTo(-10, 3, -14, -2);
    ctx.fill();
    ctx.fillStyle = "#ffe56f";
    ctx.beginPath();
    ctx.arc(14, -10 + Math.sin(now / 340 + index) * 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawBossTrophies(ctx, width, height, now) {
    const defeatedIds = Array.isArray(state.defeatedBossIds) ? state.defeatedBossIds : [];
    const bossDefeats = Number(state.bossDefeats || 0);
    if (bossDefeats <= 0 && defeatedIds.length <= 0) return;
    const baseY = height * .9;
    ctx.save();
    ctx.globalAlpha = .78;
    if (defeatedIds.includes("king-sluggo") || bossDefeats >= 1) {
      drawAtlasSprite(ctx, "kingSluggo", width * .18, baseY - 4, 70, 44, { alpha: .46, rotation: -.08 });
      drawTinyCrown(ctx, width * .18, baseY - 35 + Math.sin(now / 640) * 2, 16);
    }
    if (defeatedIds.includes("boot-of-doom") || bossDefeats >= 5) {
      drawAtlasSprite(ctx, "gardenBoot", width * .77, baseY - 3, 58, 72, { alpha: .52, rotation: .08 });
      ctx.strokeStyle = "rgba(141, 255, 129, .55)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width * .74, baseY + 20);
      ctx.quadraticCurveTo(width * .77, baseY - 6, width * .81, baseY - 29);
      ctx.stroke();
    }
    if (defeatedIds.includes("mower-titan") || bossDefeats >= 6) {
      drawAtlasSprite(ctx, "mowerTitan", width * .5, baseY - 6, 78, 58, { alpha: .54, rotation: -.04 });
      fillGlow(ctx, width * .5, baseY - 13, 42, "rgb(141, 255, 129)", .12);
    }
    ctx.restore();
  }

  function drawColonyBack(ctx, width, height, now, tier, owned) {
    const floorY = height * .79;
    const spread = Math.min(9, tier + Math.floor(owned / 4) + Math.floor(Number(state.bossDefeats || 0) / 2));
    ctx.save();
    const soil = ctx.createLinearGradient(0, floorY - 20, 0, height);
    soil.addColorStop(0, "rgba(23, 34, 17, .14)");
    soil.addColorStop(.35, "rgba(24, 28, 13, .55)");
    soil.addColorStop(1, "rgba(7, 8, 4, .92)");
    ctx.fillStyle = soil;
    ctx.fillRect(0, floorY - 30, width, height - floorY + 35);

    ctx.strokeStyle = `rgba(139, 255, 120, ${.1 + Math.min(.2, tier * .02 + owned * .0014)})`;
    ctx.lineWidth = Math.max(1.2, width * .0035);
    ctx.lineCap = "round";
    for (let i = 0; i < 6 + spread; i += 1) {
      const startX = width * ((i * .137 + .08) % .92);
      const endX = width * ((i * .233 + .14) % .86 + .05);
      const startY = height * (.97 - (i % 4) * .04);
      const endY = height * (.72 - Math.min(.08, spread * .006) + (i % 3) * .026);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.bezierCurveTo(startX + Math.sin(i) * 52, height * .86, endX - Math.cos(i) * 44, height * .79, endX, endY);
      ctx.stroke();
    }

    const houseCount = Math.min(12, 2 + Math.floor(owned / 3) + Math.floor(spread / 2));
    const capColors = ["#d94c47", "#f1bf4a", "#7b71dd", "#ec6a56", "#78c673"];
    for (let i = 0; i < houseCount; i += 1) {
      const x = width * (.1 + ((i * .173) % .78));
      const y = height * (.88 - (i % 3) * .055);
      const size = .58 + Math.min(.38, spread * .025) + (i % 3) * .05;
      drawCapHouse(ctx, x, y, size, capColors[i % capColors.length], i % 2 ? "#ffe3a8" : "#f4d096", now, i);
    }

    const ventCount = Math.min(7, Math.floor(owned / 5) + Math.floor(spread / 3));
    for (let i = 0; i < ventCount; i += 1) {
      drawSporeVent(ctx, width * (.16 + ((i * .19) % .68)), height * (.9 - (i % 2) * .08), .62 + spread * .02, now, i);
    }
    drawBossTrophies(ctx, width, height, now);
    ctx.restore();
  }

  function drawColonyFront(ctx, width, height, now, tier, owned) {
    ctx.save();
    const workers = Math.min(12, Math.max(1, 1 + Math.floor(owned / 2) + Math.floor(Number(state.bossDefeats || 0) / 1.5)));
    for (let i = 0; i < workers; i += 1) {
      const lane = i % 3;
      const travel = ((now / (4200 + i * 280)) + i * .17) % 1;
      const x = width * (.08 + travel * .84);
      const y = height * (.91 - lane * .035);
      drawWorkerShroom(ctx, x, y, .72 + Math.min(.16, tier * .015), now, i);
    }
    if (tier >= 2 || owned >= 8) {
      ctx.strokeStyle = "rgba(255, 218, 103, .58)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width * .1, height * .83);
      ctx.quadraticCurveTo(width * .34, height * .78, width * .56, height * .84);
      ctx.quadraticCurveTo(width * .74, height * .89, width * .9, height * .82);
      ctx.stroke();
      for (let i = 0; i < 7; i += 1) {
        fillGlow(ctx, width * (.14 + i * .12), height * (.83 + Math.sin(now / 500 + i) * .012), 9, "rgb(255, 229, 119)", .2);
      }
    }
    ctx.restore();
  }

  function drawBattleEvents(ctx, width, height, now) {
    for (let index = battleEvents.length - 1; index >= 0; index -= 1) {
      const event = battleEvents[index];
      const t = (now - event.createdAt) / event.duration;
      if (t >= 1) {
        battleEvents.splice(index, 1);
        continue;
      }
      const ease = 1 - Math.pow(1 - t, 3);
      const enemyX = width * .5;
      const enemyY = height * .27;
      const heroX = width * .5;
      const heroY = height * .75;
      ctx.save();
      if (event.kind === "tap" || event.kind === "hit") {
        ctx.globalAlpha = 1 - t;
        ctx.strokeStyle = event.hot ? "#fff1a0" : "#b9ff99";
        ctx.lineWidth = event.hot ? 6 : 4;
        ctx.beginPath();
        ctx.moveTo(heroX + 24, heroY - 70);
        ctx.quadraticCurveTo(width * .58, height * .48, enemyX + Math.sin(t * 18) * 20, enemyY);
        ctx.stroke();
        for (let i = 0; i < 10; i += 1) {
          const angle = (i / 10) * Math.PI * 2 + event.createdAt * .001;
          const radius = 12 + ease * (event.hot ? 92 : 58) + (i % 3) * 5;
          ctx.fillStyle = i % 3 === 0 ? "#fff6bd" : "#aaff89";
          ctx.beginPath();
          ctx.arc(enemyX + Math.cos(angle) * radius, enemyY + Math.sin(angle) * radius * .7, Math.max(1, 4 - t * 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (event.kind === "skill") {
        ctx.globalAlpha = .85 * (1 - t);
        const skill = event.skill || "";
        if (skill === "root-grasp") {
          ctx.strokeStyle = "#8fff84";
          ctx.lineWidth = 5;
          for (let i = -3; i <= 3; i += 1) {
            ctx.beginPath();
            ctx.moveTo(width * (.5 + i * .06), height);
            ctx.quadraticCurveTo(width * (.5 + i * .03), height * .56, enemyX + i * 8, enemyY + 18);
            ctx.stroke();
          }
        } else if (skill === "puffball-barrage") {
          for (let i = 0; i < 7; i += 1) {
            fillGlow(ctx, width * (.16 + i * .12), height * (.2 + Math.sin(i + t * 4) * .06), 42 + ease * 34, "rgb(255, 244, 181)", .42);
          }
        } else if (skill === "fairy-ring") {
          ctx.strokeStyle = "#caff89";
          ctx.lineWidth = 7;
          ctx.beginPath();
          ctx.ellipse(enemyX, enemyY + 24, 96 + ease * 20, 32 + ease * 8, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (skill === "ancient-bloom") {
          fillGlow(ctx, width / 2, height / 2, Math.max(width, height) * (1.1 + ease * .4), "rgb(210, 179, 255)", .32 * (1 - t));
          ctx.strokeStyle = "#fff1a6";
          ctx.lineWidth = 4;
          for (let i = 0; i < 18; i += 1) {
            const angle = (Math.PI * 2 * i) / 18 + ease * 4;
            ctx.beginPath();
            ctx.moveTo(width / 2, height * .73);
            ctx.lineTo(width / 2 + Math.cos(angle) * width * ease, height * .73 + Math.sin(angle) * height * ease);
            ctx.stroke();
          }
        } else {
          fillGlow(ctx, enemyX, enemyY, 100 + ease * 70, "rgb(168, 255, 132)", .32 * (1 - t));
        }
      }
      if (event.kind === "rare-arrive") {
        ctx.globalAlpha = 1 - t;
        fillGlow(ctx, enemyX, enemyY, 96 + ease * 90, "rgb(255, 232, 111)", .34 * (1 - t));
        ctx.strokeStyle = "rgba(255, 246, 176, .9)";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(enemyX, enemyY + 6, 88 + ease * 42, 26 + ease * 10, 0, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 16; i += 1) {
          const angle = i / 16 * Math.PI * 2 + ease * 3;
          ctx.fillStyle = i % 2 ? "#fff1a2" : "#92ff83";
          ctx.beginPath();
          ctx.arc(enemyX + Math.cos(angle) * (36 + ease * 80), enemyY + Math.sin(angle) * (22 + ease * 46), 2.8 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (event.kind === "rare-hit") {
        ctx.globalAlpha = .85 * (1 - t);
        ctx.strokeStyle = event.hot ? "#fff0a6" : "#baff82";
        ctx.lineWidth = event.hot ? 6 : 4;
        ctx.beginPath();
        ctx.ellipse(enemyX, enemyY + 2, 76 + ease * 28, 38 + ease * 12, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (event.kind === "rare") {
        ctx.globalAlpha = 1 - t;
        fillGlow(ctx, enemyX, enemyY, 190 * ease, "rgb(255, 221, 95)", .5 * (1 - t));
        drawAtlasSprite(ctx, "bloomBurst", enemyX, enemyY + 12, 190 * (0.5 + ease * .45), 135 * (0.5 + ease * .45), { alpha: .76 * (1 - t), rotation: -ease * .45 });
        for (let i = 0; i < 30; i += 1) {
          const angle = i * 1.618 + ease * 5;
          const r = ease * (38 + (i % 7) * 18);
          ctx.fillStyle = i % 3 === 0 ? "#8dff7e" : "#fff1a6";
          ctx.beginPath();
          ctx.arc(enemyX + Math.cos(angle) * r, enemyY + Math.sin(angle) * r * .65 + ease * 58, 3 + (i % 4), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (event.kind === "defeat") {
        ctx.globalAlpha = 1 - t;
        fillGlow(ctx, enemyX, enemyY, (event.boss ? 170 : 110) * ease, "rgb(255, 219, 103)", event.boss ? .46 : .3);
        drawAtlasSprite(ctx, "bloomBurst", enemyX, enemyY + 18, (event.boss ? 210 : 140) * (0.55 + ease * .45), (event.boss ? 150 : 104) * (0.55 + ease * .45), { alpha: .72 * (1 - t), rotation: ease * .5 });
        for (let i = 0; i < (event.boss ? 26 : 14); i += 1) {
          const angle = (i / (event.boss ? 26 : 14)) * Math.PI * 2;
          const r = ease * (event.boss ? 180 : 110);
          ctx.fillStyle = i % 2 ? "#fff0a4" : "#83e56e";
          ctx.beginPath();
          ctx.arc(enemyX + Math.cos(angle) * r, enemyY + Math.sin(angle) * r * .72 + ease * 42, 3 + (i % 4), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (event.kind === "upgrade") {
        ctx.globalAlpha = 1 - t;
        fillGlow(ctx, heroX, heroY, 130 * ease, "rgb(152, 255, 130)", .24);
        const allySprite = spriteKeyForAlly(event.machine || "plot");
        drawAtlasSprite(ctx, allySprite, width * .5, height * (.76 - ease * .08), 80 + ease * 32, 72 + ease * 24, {
          alpha: .58 * (1 - t),
          rotation: Math.sin(ease * Math.PI * 2) * .08
        });
        for (let i = 0; i < 12; i += 1) {
          ctx.fillStyle = i % 2 ? "#ffe77a" : "#baff83";
          ctx.beginPath();
          ctx.arc(width * (.18 + (i % 6) * .13), height * (.92 - ease * .2 - Math.floor(i / 6) * .08), 3 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (event.kind === "relic") {
        ctx.globalAlpha = 1 - t;
        const relicX = width * .5;
        const relicY = height * (.55 - ease * .08);
        fillGlow(ctx, relicX, relicY, 86 + ease * 60, "rgb(255, 219, 103)", .36 * (1 - t));
        ctx.fillStyle = "#f6d46f";
        ctx.strokeStyle = "rgba(255, 253, 224, .86)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(relicX, relicY - 30);
        ctx.lineTo(relicX + 28, relicY - 2);
        ctx.lineTo(relicX + 18, relicY + 32);
        ctx.lineTo(relicX - 18, relicY + 32);
        ctx.lineTo(relicX - 28, relicY - 2);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        for (let i = 0; i < 12; i += 1) {
          const angle = i / 12 * Math.PI * 2 + ease * 2;
          ctx.fillStyle = i % 2 ? "#fff0a6" : "#9cff80";
          ctx.beginPath();
          ctx.arc(relicX + Math.cos(angle) * (48 + ease * 46), relicY + Math.sin(angle) * (28 + ease * 24), 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (event.kind === "mutation") {
        ctx.globalAlpha = .92 * (1 - t);
        const pulseX = width * .5;
        const pulseY = height * (.72 - ease * .12);
        fillGlow(ctx, pulseX, pulseY, 120 + ease * 90, "rgb(141, 255, 106)", .28 * (1 - t));
        ctx.strokeStyle = "rgba(198, 255, 137, .84)";
        ctx.lineWidth = 5;
        for (let i = -4; i <= 4; i += 1) {
          ctx.beginPath();
          ctx.moveTo(width * (.5 + i * .045), height);
          ctx.quadraticCurveTo(width * (.5 + i * .02), height * (.82 - ease * .18), pulseX + i * 13, pulseY);
          ctx.stroke();
        }
        for (let i = 0; i < 16; i += 1) {
          const angle = i / 16 * Math.PI * 2 + ease * 3;
          ctx.fillStyle = i % 2 ? "#fff5ad" : "#8eff7b";
          ctx.beginPath();
          ctx.arc(pulseX + Math.cos(angle) * (32 + ease * 70), pulseY + Math.sin(angle) * (18 + ease * 38), 3 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      if (event.kind === "bloom") {
        ctx.globalAlpha = 1 - t;
        fillGlow(ctx, width / 2, height / 2, Math.max(width, height) * (1.2 + ease), "rgb(210, 178, 255)", .52);
        drawAtlasSprite(ctx, "bloomBurst", width / 2, height * .55, width * (.56 + ease * .3), height * (.34 + ease * .2), { alpha: .78 * (1 - t), rotation: ease * .8 });
        for (let i = 0; i < 44; i += 1) {
          const angle = i * 1.618 + ease * 6;
          const r = ease * Math.max(width, height) * (.08 + (i % 9) * .055);
          ctx.fillStyle = i % 3 ? "#fff0a6" : "#a8ff97";
          ctx.beginPath();
          ctx.arc(width / 2 + Math.cos(angle) * r, height * .72 + Math.sin(angle) * r, 2 + (i % 4), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  function drawBattleFrame(now) {
    if (!els.battleCanvas || !els.friendScene) return;
    const rect = els.friendScene.getBoundingClientRect();
    if (rect.width <= 1 || rect.height <= 1) return;
    const ctx = fitBattleCanvas(els.battleCanvas, rect);
    const width = rect.width;
    const height = rect.height;
    const dt = Math.min(64, battleLastFrame ? now - battleLastFrame : 16);
    battleLastFrame = now;
    ctx.clearRect(0, 0, width, height);

    const tier = colonyTier();
    const owned = ownedTotal();
    const boss = isBossWave();
    const rareSpawn = activeRareSpawn();
    const enemy = rareSpawnEnemy(rareSpawn) || enemyForCombat();
    const visibleBoss = boss && !rareSpawn;
    const hp = rareSpawn ? Math.max(0, Number(rareSpawn.hp || 0)) : Math.max(0, Number(state.enemyHp || 0));
    const maxHp = rareSpawn ? Math.max(1, Number(rareSpawn.maxHp || rareSpawn.hp || 1)) : Math.max(1, Number(state.enemyMaxHp || enemyMaxHealth(state)));
    const hitPulse = Math.max(0, 1 - (now - (battleEvents.filter(event => event.kind === "tap" || event.kind === "hit").at(-1)?.createdAt || -1000)) / 260);

    const lowerMask = ctx.createLinearGradient(0, height * .44, 0, height);
    lowerMask.addColorStop(0, "rgba(7, 16, 10, .04)");
    lowerMask.addColorStop(.4, "rgba(8, 16, 10, .55)");
    lowerMask.addColorStop(1, "rgba(3, 7, 5, .88)");
    ctx.fillStyle = lowerMask;
    ctx.fillRect(0, height * .42, width, height * .58);

    for (let i = 0; i < 26; i += 1) {
      const drift = ((now * (.006 + (i % 5) * .001) + i * 47) % (height + 80)) - 40;
      const x = (Math.sin(i * 12.989) * 43758.5453 % 1 + 1) % 1 * width;
      const y = height - drift;
      ctx.fillStyle = i % 4 === 0 ? "rgba(142, 228, 255, .42)" : "rgba(255, 239, 158, .38)";
      ctx.beginPath();
      ctx.arc(x, y, 1.3 + (i % 3) * .7, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = `rgba(139, 255, 120, ${.08 + Math.min(.16, tier * .018 + owned * .001)})`;
    ctx.lineWidth = 1.35;
    for (let i = 0; i < 5 + Math.floor(tier * .7); i += 1) {
      const startX = width * (.1 + (i % 5) * .2);
      const startY = height * (.88 - (i % 3) * .08);
      ctx.beginPath();
      ctx.moveTo(startX, height);
      ctx.bezierCurveTo(startX - 46, startY, width * (.2 + (i % 4) * .18), height * (.76 - (i % 2) * .045), width * (.5 + Math.sin(i) * .28), height * (.64 - Math.min(.08, tier * .008)));
      ctx.stroke();
    }

    drawColonyBack(ctx, width, height, now, tier, owned);

    const enemyX = width * .5;
    const enemyY = height * (visibleBoss ? .3 : .28);
    drawEnemyShape(ctx, enemy, enemyX, enemyY, rareSpawn ? Math.min(74, width * .18) : visibleBoss ? Math.min(88, width * .2) : Math.min(62, width * .16), now, visibleBoss || enemy.id.includes("ancient-snail"), hitPulse);
    if (rareSpawn) {
      const rare = rareSpawnDefinition(rareSpawn.id);
      const seconds = Math.max(0, Math.ceil((Number(rareSpawn.expiresAt || 0) - Date.now()) / 1000));
      ctx.save();
      ctx.globalAlpha = .92;
      const tagWidth = Math.min(width - 48, 210);
      roundedRect(ctx, enemyX - tagWidth / 2, enemyY + 58, tagWidth, 28, 14);
      ctx.fillStyle = "rgba(7, 19, 10, .82)";
      ctx.fill();
      ctx.fillStyle = "#fff3a6";
      ctx.font = "800 11px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${rare?.name || "Rare Spawn"} / ${seconds}s`, enemyX, enemyY + 76);
      ctx.restore();
    }

    const idleShots = Math.min(8, Math.floor(owned / 3));
    for (let i = 0; i < idleShots; i += 1) {
      const phase = ((now / (900 + i * 71)) + i * .19) % 1;
      if (phase < .54) {
        const sx = width * (.18 + (i % 6) * .13);
        const sy = height * (.76 + (i % 2) * .06);
        const tx = sx + (enemyX - sx) * phase / .54;
        const ty = sy + (enemyY - sy) * phase / .54 - Math.sin(phase * Math.PI) * 60;
        fillGlow(ctx, tx, ty, 10, i % 3 ? "rgb(178, 255, 133)" : "rgb(151, 224, 255)", .45);
      }
    }

    const machineOrder = machines.map(machine => machine.id);
    const visibleAllies = machineOrder.filter(id => Number(state.machines[id] || 0) > 0).slice(0, 10);
    visibleAllies.forEach((id, index) => {
      const row = index % 2;
      const x = width * (.12 + ((index % 5) / 4) * .76) + (row ? width * .05 : 0);
      const y = height * (.8 + row * .075);
      const allyCount = Number(state.machines[id] || 0);
      const size = id === "observatory" || id === "aurora" ? 1.18 : .86 + Math.min(.32, allyCount / 58);
      const swarm = Math.min(7, 1 + Math.floor(Math.sqrt(allyCount) / 2));
      for (let cluster = 0; cluster < swarm; cluster += 1) {
        const ox = (cluster - (swarm - 1) / 2) * Math.min(18, width * .038);
        const oy = (cluster % 2) * 12 - Math.floor(cluster / 2) * 4;
        drawAlly(ctx, x + ox, y + oy, size * (cluster ? .78 : 1), id, now, index + cluster * .37, true);
      }
      if ([10, 25, 50, 100, 250, 500, 1000].some(level => allyCount >= level)) {
        fillGlow(ctx, x, y - 24, 28 + Math.min(34, allyCount / 12), "rgb(255, 225, 112)", .16);
      }
    });

    const heroScale = Math.max(.76, Math.min(1.05, width / 430)) * (1 + Math.min(.12, ancientSporePower() * .008));
    drawFirstShroom(ctx, width * .5, height * .77, heroScale, now, currentShroomForm(), hitPulse);

    drawColonyFront(ctx, width, height, now, tier, owned);

    drawBattleEvents(ctx, width, height, now);

    if (visibleBoss) {
      ctx.save();
      ctx.globalAlpha = .16 + Math.sin(now / 160) * .05;
      ctx.fillStyle = "#ffd35c";
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
    if (dt > 1000) battleLastFrame = now;
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
      state.defeatedBossIds = Array.isArray(imported.defeatedBossIds) ? imported.defeatedBossIds : [];
      state.foundRelicIds = Array.isArray(imported.foundRelicIds) ? imported.foundRelicIds : [];
      state.relicLevels = { ...fallback.relicLevels, ...(imported.relicLevels || {}) };
      state.spentRelicCaps = Math.max(0, Number(imported.spentRelicCaps || 0));
      state.bonusRelicCaps = Math.max(0, Number(imported.bonusRelicCaps || 0));
      state.activeMutations = Array.isArray(imported.activeMutations) ? imported.activeMutations : [];
      state.spentMutationGoo = Math.max(0, Number(imported.spentMutationGoo || 0));
      state.bonusMutationGoo = Math.max(0, Number(imported.bonusMutationGoo || 0));
      state.rareSpawn = imported.rareSpawn && typeof imported.rareSpawn === "object" ? imported.rareSpawn : null;
      state.rareDefeats = Math.max(0, Number(imported.rareDefeats || 0));
      state.lifetimeRootstock = Math.max(
        Number(imported.lifetimeRootstock || 0),
        Number(imported.rootstock || 0),
        Number(imported.bloomCount || 0)
      );
      state.lastBloomGain = Number(imported.lastBloomGain || 0);
      state.postBloomBoostUntil = Number(imported.postBloomBoostUntil || 0);
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
    const text = `I grew ${format(state.lifetimeLoops)} lifetime nutrients in Idle Shroom. Play at ${publicGameUrl}`;
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
      mycelium: Math.floor(ancientSporePower()),
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
    const strongestOwned = [...machines].reverse().find(machine => Number(state.machines[machine.id] || 0) > 0);
    const firstLockedIndex = nextLocked ? machines.findIndex(machine => machine.id === nextLocked.id) : machines.length;
    const visibleMachines = machines.filter((machine, index) => {
      const count = Number(state.machines[machine.id] || 0);
      return count > 0 || index <= firstLockedIndex + 1 || state.loops >= machineCost(machine) * 0.35;
    });
    const recommended = strongestAffordable || nextLocked || strongestOwned || visibleMachines[0];
    els.machineCount.textContent = nextLocked ? `next: ${nextLocked.name}` : "heartwood looping";
    els.machineList.innerHTML = visibleMachines.map(machine => {
      const cost = machineCost(machine);
      const count = Number(state.machines[machine.id] || 0);
      const disabled = state.loops < cost ? "disabled" : "";
      const progress = Math.max(0, Math.min(100, (state.loops / cost) * 100));
      const art = machineArt[machine.id] || { className: "root-thread", label: "shroom ally" };
      const dps = count * machine.rate * rateMultiplier();
      const milestone = allyMilestoneCopy(count);
      return `
        <article class="store-item garden-card ${machine.id === recommended?.id ? "recommended" : ""}" data-machine="${machine.id}">
          <span class="store-visual ${art.className}" aria-label="${art.label}">
            <i style="--progress:${Math.round(progress)}%"></i>
          </span>
          <div class="store-copy">
            <h3>${machine.name}</h3>
            <p>${machine.desc}</p>
            <span class="owned">level ${format(count)} / +${format(dps)}/sec</span>
            <span class="milestone-copy">${milestone}</span>
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
            <p>Recruit more allies to unlock a charm.</p>
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
    els.perkCount.textContent = `${format(state.rootstock)} spendable / ${format(ancientSporePower())} earned / ${active} perks`;
    if (Number(state.rootstock || 0) <= 0 && active <= 0) {
      els.perkList.innerHTML = `
        <article class="store-item mycelium-card waiting">
          <span class="store-visual mycelium-knot" aria-hidden="true"><i></i></span>
          <div class="store-copy">
            <h3>First Spore Bloom</h3>
            <p>Reach ${format(bloomRequirement())} run nutrients. Restart stronger with Ancient Spores.</p>
            <span class="owned">${format(Math.min(state.totalLoops, bloomRequirement()))}/${format(bloomRequirement())} run nutrients</span>
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

  function renderRelicSystems() {
    const caps = relicCaps();
    const unlocked = relics.filter(relic => relicUnlocked(relic));
    if (els.relicState) els.relicState.textContent = `${unlocked.length}/${relics.length} relics / ${format(caps)} caps`;
    if (els.relicList) {
      els.relicList.innerHTML = relics.map((relic, index) => {
        const found = relicUnlocked(relic);
        const level = relicLevel(relic.id);
        const cost = relicUpgradeCost(relic);
        const canUpgrade = found && caps >= cost;
        return `
          <article class="system-item relic-item ${found ? "unlocked" : "locked"}">
            <span class="system-glyph relic-glyph relic-${index % 5}" aria-hidden="true"></span>
            <div>
              <h3>${found ? relic.name : "Unfound relic"}</h3>
              <p>${found ? relic.desc : "Defeat bosses and push deeper to uncover this artifact."}</p>
              <span>${found ? `level ${format(level)} / next ${format(cost)} caps` : "locked"}</span>
            </div>
            <button type="button" data-upgrade-relic="${relic.id}" ${canUpgrade ? "" : "disabled"}>
              ${found ? (canUpgrade ? "upgrade" : `need ${format(cost)}`) : "locked"}
            </button>
          </article>
        `;
      }).join("");
    }

    const activeMutationList = mutations.filter(mutation => mutationActive(mutation.id));
    if (els.mutationState) els.mutationState.textContent = `${activeMutationList.length}/${mutations.length} active / ${format(mutationGoo())} goo`;
    if (els.mutationList) {
      els.mutationList.innerHTML = mutations.map((mutation, index) => {
        const ready = mutationUnlocked(mutation);
        const active = mutationActive(mutation.id);
        const count = Number(state.machines?.[mutation.machine] || 0);
        const cost = mutationCost(mutation);
        const canMutate = ready && !active && mutationGoo() >= cost;
        return `
          <article class="system-item mutation-item ${ready ? "unlocked" : "locked"} ${active ? "active" : ""}">
            <span class="system-glyph mutation-glyph mutation-${index % 4}" aria-hidden="true"></span>
            <div>
              <h3>${ready ? mutation.name : mutation.family}</h3>
              <p>${ready ? mutation.desc : `Grow ${mutation.family} to level ${format(mutation.level)}.`}</p>
              <span>${active ? "mutation active" : ready ? `${format(cost)} Mutation Goo` : `${format(count)}/${format(mutation.level)} levels`}</span>
            </div>
            <button type="button" data-activate-mutation="${mutation.id}" ${canMutate ? "" : "disabled"}>
              ${active ? "active" : ready ? (canMutate ? "mutate" : `need ${format(cost)}`) : "locked"}
            </button>
          </article>
        `;
      }).join("");
    }

    const region = currentWorldRegion();
    const nextRegion = nextWorldRegion();
    if (els.mapState) {
      els.mapState.textContent = nextRegion
        ? `${region.name} -> ${nextRegion.name}`
        : "Spore Moon claimed";
    }
    if (els.networkList) {
      els.networkList.innerHTML = worldRegions.map(regionItem => {
        const reached = bestCombatDepth() >= regionItem.depth;
        const next = !reached && regionItem === nextRegion;
        return `
          <article class="network-node ${reached ? "reached" : ""} ${next ? "next" : ""}">
            <span aria-hidden="true"></span>
            <div>
              <strong>${regionItem.name}</strong>
              <em>${reached ? "covered in mycelium" : `depth ${format(regionItem.depth)}`}</em>
            </div>
          </article>
        `;
      }).join("");
    }
  }

  function renderLeaderboard() {
    const endpoint = leaderboardEndpoint();
    els.leaderboardState.textContent = leaderboardStatus || (endpoint ? "global board" : "local board");
    els.submitScoreButton.disabled = leaderboardSubmitting;
    els.submitScoreButton.textContent = leaderboardSubmitting ? "submitting" : "submit score";
    if (!leaderboardEntries.length) {
      const goal = nextClickMilestone()
        ? `${format(nextClickMilestone().clicks - Number(state.clicks || 0))} taps to ${nextClickMilestone().name}`
        : `${format(Math.max(0, bloomRequirement() - Number(state.totalLoops || 0)))} nutrients to Spore Bloom`;
      els.leaderboardList.innerHTML = `
        <article class="leaderboard-empty atlas-card">
          <strong>Current run</strong>
          <span>${format(state.bloomCount || 0)} blooms / ${format(ancientSporePower())} ancient power / ${format(state.lifetimeLoops || 0)} lifetime nutrients</span>
          <div class="atlas-stats" aria-hidden="true">
            <b>${format(state.clicks || 0)} taps</b>
            <b>${format(state.meadowLevel || 1)} depth</b>
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
        <em>${format(entry.greatBlooms || 0)} blooms / ${format(entry.mycelium || 0)} ancient power / ${format(entry.lifetimeSpores || 0)} nutrients</em>
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
      const companionTypes = [
        "button-buddy", "cap-knight", "puffball-bomber", "glowshroom-mage", "deathcap-assassin",
        "shelf-guardian", "morel-monk", "chanterelle-archer", "truffle-miner", "mycelium-beast"
      ];
      els.companionRow.innerHTML = companionTypes.map((type, index) => (
        `<span class="companion companion-${index + 1} ${type}" data-ally="${type}"><i></i></span>`
      )).join("");
    }
    const active = Math.min(10, Math.max(1, Math.ceil((state.meadowLevel || 1) / 2) + Math.floor(ownedTotal() / 8)));
    Array.from(els.companionRow.children).forEach((child, index) => {
      child.classList.toggle("live", index < active);
    });
  }

  function renderColonyLayer() {
    if (!els.colonyLayer) return;
    const tier = colonyTier();
    const liveCount = Math.min(els.colonyLayer.children.length, 2 + tier + Math.floor(ownedTotal() / 18));
    Array.from(els.colonyLayer.children).forEach((child, index) => {
      child.classList.toggle("live", index < liveCount);
    });
  }

  function renderCurrencies() {
    if (els.ancientSporesValue) els.ancientSporesValue.textContent = format(ancientSpores());
    if (els.essenceValue) els.essenceValue.textContent = format(myceliumEssence());
    if (els.relicCapsValue) els.relicCapsValue.textContent = format(relicCaps());
    if (els.mutationGooValue) els.mutationGooValue.textContent = format(mutationGoo());
    const form = currentShroomForm();
    const region = currentWorldRegion();
    document.body.dataset.shroomForm = form.id;
    document.body.dataset.colonyTier = String(colonyTier());
    document.body.dataset.worldRegion = region.id;
    if (els.seedButton) els.seedButton.setAttribute("aria-label", `${form.name}, tap to release spores`);
  }

  function renderEmpireRoad() {
    if (!els.empireRoad) return;
    const goal = nextEmpireGoal();
    const form = currentShroomForm();
    const progress = clampProgress(goal.progress);
    els.empireRoad.dataset.kind = goal.kind || "colony";
    els.empireRoad.dataset.ready = goal.ready ? "true" : "false";
    if (els.formBadge) els.formBadge.textContent = form.name;
    if (els.empireNextTitle) els.empireNextTitle.textContent = goal.title || "Grow the colony";
    if (els.empireNextDetail) els.empireNextDetail.textContent = goal.detail || "Next colony milestone";
    if (els.empireNextMeter) els.empireNextMeter.style.width = `${Math.round(progress * 100)}%`;
    if (!els.empireRoadTrack) return;

    const nodes = empireRoadNodes();
    const signature = nodes.map(node => [
      node.kind,
      node.label,
      Math.round(clampProgress(node.progress) * 20),
      node.ready ? "ready" : "",
      node.kind === goal.kind ? "active" : ""
    ].join(":")).join("|");
    if (signature === empireRoadSignature) return;
    empireRoadSignature = signature;
    els.empireRoadTrack.innerHTML = nodes.map(node => {
      const pct = Math.round(clampProgress(node.progress) * 100);
      const active = node.kind === goal.kind;
      const ready = node.ready || pct >= 100;
      const className = `road-node ${active ? "active" : ""} ${ready ? "ready" : ""}`;
      return `
        <span class="${className}" data-kind="${escapeHtml(node.kind)}" style="--road-progress:${pct}%">
          <i></i>
          <em>${escapeHtml(node.label)}</em>
        </span>
      `;
    }).join("");
  }

  function renderDaily() {
    const ready = state.lastDaily !== todayKey();
    els.dailyReward.textContent = ready ? `${state.streak ? `${state.streak + 1}x streak` : "ready"}` : `${state.streak}x claimed`;
    els.dailyButton.disabled = !ready;
    if (els.dewSkillButton) {
      els.dewSkillButton.disabled = !ready;
      els.dewSkillButton.textContent = ready ? "daily" : "done";
      els.dewSkillButton.dataset.ready = ready ? "true" : "false";
    }
  }

  function renderPrestige() {
    const gain = graftGain();
    const required = bloomRequirement();
    const progress = Math.max(0, Math.min(1, state.totalLoops / required));
    const surgeSeconds = Math.max(0, Math.ceil((Number(state.postBloomBoostUntil || 0) - Date.now()) / 1000));
    els.rootstockValue.textContent = format(state.rootstock);
    els.prestigeProgress.style.width = `${Math.round(progress * 100)}%`;
    els.prestigeButton.disabled = gain <= 0;
    els.prestigeButton.textContent = gain > 0 ? `Spore Bloom +${format(gain)}` : "Spore Bloom";
    if (els.bloomSkillButton) {
      els.bloomSkillButton.disabled = gain <= 0;
      els.bloomSkillButton.textContent = gain > 0 ? `Bloom +${format(gain)}` : "Spore Bloom";
      els.bloomSkillButton.dataset.ready = gain > 0 ? "true" : "false";
    }
    els.prestigeHint.textContent = surgeSeconds > 0
      ? `Reborn surge ${surgeSeconds}s. Old walls should melt now.`
      : gain > 0
        ? `Release this colony for ${format(gain)} Ancient Spores. Lifetime power stays even after spending.`
        : `Reach ${format(required)} run nutrients for Spore Bloom ${format(Number(state.bloomCount || 0) + 1)}. Permanent power ${format(ancientSporePower())}.`;
  }

  function renderFocus() {
    const remaining = Math.max(0, Number(state.focusUntil || 0) - Date.now());
    els.focusValue.textContent = remaining > 0 ? `${Math.ceil(remaining / 60000)}m left` : "inactive";
    els.boostHint.textContent = remaining > 0
      ? "2x idle damage while the colony surge is open."
      : "Start a 10 minute idle surge when you want to push.";
    els.focusButton.disabled = remaining > 0;
    els.focusButton.textContent = remaining > 0 ? "surge active" : "start surge";
    if (els.boostSkillButton) {
      els.boostSkillButton.disabled = remaining > 0;
      els.boostSkillButton.textContent = remaining > 0 ? `${Math.ceil(remaining / 60000)}m` : "storm";
      els.boostSkillButton.dataset.ready = remaining > 0 ? "active" : "true";
    }
  }

  function renderRush() {
    const remaining = rushRemaining();
    const charge = Math.max(0, Math.min(rushMax, Number(state.rushCharge || 0)));
    if (remaining > 0) {
      els.rushValue.textContent = `${Math.ceil(remaining / 1000)}s`;
      els.rushHint.textContent = "Spore Pressure active: x3 idle damage and x2 taps.";
      els.rushProgress.style.width = "100%";
      els.rushProgress.classList.add("rush-active");
      if (els.rushOrbit) {
        els.rushOrbit.style.setProperty("--rush", "100%");
        els.rushOrbit.classList.add("active");
      }
      return;
    }
    els.rushValue.textContent = `${Math.floor(charge)}%`;
    els.rushHint.textContent = "Tap, grow allies, claim goals, and fire skills to fill the meter.";
    els.rushProgress.style.width = `${charge}%`;
    els.rushProgress.classList.remove("rush-active");
    if (els.rushOrbit) {
      els.rushOrbit.style.setProperty("--rush", `${charge}%`);
      els.rushOrbit.classList.remove("active");
    }
  }

  function renderCombat() {
    ensureCombatState(state);
    const rareSpawn = activeRareSpawn();
    const rareEnemy = rareSpawnEnemy(rareSpawn);
    const enemy = rareEnemy || enemyForCombat(state);
    const hp = rareSpawn ? Math.max(0, Number(rareSpawn.hp || 0)) : Math.max(0, Number(state.enemyHp || 0));
    const maxHp = rareSpawn ? Math.max(1, Number(rareSpawn.maxHp || rareSpawn.hp || 1)) : Math.max(1, Number(state.enemyMaxHp || enemyMaxHealth(state)));
    const progress = Math.max(0, Math.min(1, hp / maxHp));
    const boss = isBossWave(state);
    const remaining = rareSpawn
      ? Math.max(0, Math.ceil((Number(rareSpawn.expiresAt || 0) - Date.now()) / 1000))
      : boss ? Math.max(0, Math.ceil((Number(state.bossDeadline || 0) - Date.now()) / 1000)) : 0;
    if (els.stageLabel) els.stageLabel.textContent = rareSpawn ? "rare spawn" : boss ? `boss ${combatLabel()}` : `stage ${combatLabel()}`;
    if (els.enemyName) els.enemyName.textContent = enemy.name;
    if (els.enemyHpLabel) els.enemyHpLabel.textContent = `${format(hp)} / ${format(maxHp)} hp`;
    if (els.enemyHpBar) {
      els.enemyHpBar.style.width = `${Math.round(progress * 100)}%`;
      els.enemyHpBar.style.setProperty("--danger", `${Math.round((1 - progress) * 100)}%`);
    }
    if (els.bossTimer) {
      els.bossTimer.textContent = rareSpawn || boss ? `${remaining}s` : "";
      els.bossTimer.hidden = !(rareSpawn || boss);
    }
    if (els.combatStrip) {
      els.combatStrip.dataset.boss = boss && !rareSpawn ? "true" : "false";
      els.combatStrip.dataset.rare = rareSpawn ? "true" : "false";
      els.combatStrip.dataset.enemy = enemy.id;
      els.combatStrip.style.setProperty("--enemy-health", `${Math.round(progress * 100)}%`);
    }
    if (els.enemyTarget) {
      els.enemyTarget.dataset.boss = boss && !rareSpawn ? "true" : "false";
      els.enemyTarget.dataset.rare = rareSpawn ? "true" : "false";
      els.enemyTarget.dataset.variant = String(enemy.variant);
      els.enemyTarget.setAttribute("aria-label", `${enemy.name} ${format(hp)} hp`);
      els.enemyTarget.style.setProperty("--enemy-health", `${Math.round(progress * 100)}%`);
    }
    if (els.friendScene) {
      els.friendScene.dataset.boss = boss && !rareSpawn ? "true" : "false";
      els.friendScene.dataset.rare = rareSpawn ? "true" : "false";
      els.friendScene.dataset.enemy = enemy.id;
    }
  }

  function renderMeadow() {
    const required = meadowRequirement();
    const bloom = Math.max(0, Number(state.meadowBloom || 0));
    const progress = Math.max(0, Math.min(1, bloom / required));
    const tutorial = tutorialStage();
    const environment = environmentForLevel();
    els.meadowValue.textContent = `depth ${format(state.meadowLevel || 1)}`;
    els.sessionMeadowValue.textContent = format(state.meadowLevel || 1);
    els.meadowName.textContent = environment.label;
    els.meadowMood.textContent = meadowMood();
    els.bloomProgress.style.width = `${Math.round(progress * 100)}%`;
    els.bloomNeed.textContent = `${format(Math.max(0, required - bloom))} growth`;
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
      els.friendScene.setAttribute("aria-label", `${meadowTitle()} ${mood} ${enemyForCombat().name}`);
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
            <span class="owned">${format(Math.min(quest.current, quest.target))}/${format(quest.target)} / reward ${format(quest.reward)} nutrients</span>
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
    const bloomReady = graftGain() > 0;
    document.body.dataset.bloomReady = bloomReady ? "true" : "false";
    document.body.dataset.bloomSurge = postBloomSurgeActive() ? "true" : "false";
    renderCurrencies();
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
    els.tapValue.textContent = combatLabel();
    if (els.seasonValue) {
      els.seasonValue.textContent = ancientSporePower() > 0
        ? `${format(ancientSporePower())} ancient power`
        : `bloom ${format(Number(state.bloomCount || 0) + 1)}`;
    }
    els.clicksValue.textContent = format(state.clicks);
    els.runValue.textContent = format(state.totalLoops);
    els.lifetimeValue.textContent = format(state.lifetimeLoops);
    els.multiplierValue.textContent = `${rateMultiplier().toFixed(rateMultiplier() >= 10 ? 1 : 2)}x`;
    els.upgradeCount.textContent = `${state.upgrades.length} active`;
    els.achievementCount.textContent = `${state.achievements.length} unlocked`;
    renderOrchard();
    renderCompanions();
    renderColonyLayer();
    renderEmpireRoad();
    renderDaily();
    renderCombat();
    renderMeadow();
    renderPrestige();
    renderFocus();
    renderSkills();
    renderRush();
    renderSound();
    announceReadyAction();
  }

  function render() {
    renderCore();
    renderMachines();
    renderUpgrades();
    renderPerks();
    renderRelicSystems();
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
    const rareExpired = expireRareSpawn();
    const bossTimedOut = handleBossTimeout(state);
    const rareHit = damageRareSpawn(combatDps() * dt * 0.18, { visual: false });
    const dealt = damageEnemy(combatDps() * dt, { visual: false });
    const earned = incomePerSecond() * dt;
    if (earned > 0) {
      addLoops(state, earned);
      const meadow = addMeadowCare(earned * 0.08);
      if (meadow.blooms > 0) {
        showMoment(meadow.latest?.label || meadowTitle(), meadow.blooms > 1 ? `${meadow.blooms} zone surges` : "new zone surge", "meadow");
        playTone("bloom", 2);
      }
      markDirty();
      checkAchievements();
    } else if (dealt.changed || bossTimedOut || rareHit.changed || rareExpired) {
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
  if (els.friendScene) {
    els.friendScene.addEventListener("pointerup", event => {
      if (event.target.closest?.("#seedButton, #bloomCallout")) return;
      lastPointerTapAt = Date.now();
      tap(event);
    }, { passive: true });
    els.friendScene.addEventListener("click", event => {
      if (event.target.closest?.("#seedButton, #bloomCallout") || Date.now() - lastPointerTapAt < 420) return;
      tap(event);
    });
  }
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
  if (els.relicList) {
    els.relicList.addEventListener("click", event => {
      const id = event.target.closest("button")?.dataset.upgradeRelic;
      if (id) upgradeRelic(id);
    });
  }
  if (els.mutationList) {
    els.mutationList.addEventListener("click", event => {
      const id = event.target.closest("button")?.dataset.activateMutation;
      if (id) activateMutation(id);
    });
  }
  els.prestigeButton.addEventListener("click", graft);
  if (els.bloomCallout) els.bloomCallout.addEventListener("click", graft);
  if (els.nextGoalButton) els.nextGoalButton.addEventListener("click", usePrimaryGoal);
  els.dailyButton.addEventListener("click", claimDaily);
  els.focusButton.addEventListener("click", useFocus);
  activeSkills.forEach(skill => {
    const button = els[skill.button];
    if (button) button.addEventListener("click", () => useActiveSkill(skill.id));
  });
  if (els.dewSkillButton) els.dewSkillButton.addEventListener("click", claimDaily);
  if (els.boostSkillButton) els.boostSkillButton.addEventListener("click", useFocus);
  if (els.bloomSkillButton) els.bloomSkillButton.addEventListener("click", graft);
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
          bloomCount: Number(state.bloomCount || 0),
          offlineReward: Number(state.offlineReward || 0),
          offlineSeconds: Number(state.offlineSeconds || 0),
          nextAction: nextAction().detail,
          nextActionReady: nextAction().ready,
          lastReadyAction: state.lastReadyAction || "",
          combatStage: combatStage(),
          combatWave: combatWave(),
          combatLabel: combatLabel(),
          enemyName: enemyForCombat().name,
          enemyHp: Number(state.enemyHp || 0),
          enemyMaxHp: Number(state.enemyMaxHp || 0),
          boss: isBossWave(),
          bossDefeats: Number(state.bossDefeats || 0),
          defeatedBossIds: Array.isArray(state.defeatedBossIds) ? state.defeatedBossIds.length : 0,
          meadowLevel: Number(state.meadowLevel || 1),
          meadowName: meadowTitle(),
          ownedAllies: ownedTotal(),
          colonyTier: colonyTier(),
          shroomForm: currentShroomForm().name,
          ancientSpores: ancientSpores(),
          ancientPower: ancientSporePower(),
          lastBloomGain: Number(state.lastBloomGain || 0),
          postBloomSurgeActive: postBloomSurgeActive(),
          myceliumEssence: myceliumEssence(),
          relicCaps: relicCaps(),
          relicCapsEarned: relicCapsEarned(),
          spentRelicCaps: Number(state.spentRelicCaps || 0),
          bonusRelicCaps: Number(state.bonusRelicCaps || 0),
          relicLevelsTotal: Object.values(state.relicLevels || {}).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0),
          mutationGoo: mutationGoo(),
          mutationGooEarned: mutationGooEarned(),
          spentMutationGoo: Number(state.spentMutationGoo || 0),
          bonusMutationGoo: Number(state.bonusMutationGoo || 0),
          unlockedRelics: relics.filter(relic => relicUnlocked(relic)).length,
          foundRelics: Array.isArray(state.foundRelicIds) ? state.foundRelicIds.length : 0,
          readyMutations: mutations.filter(mutation => mutationUnlocked(mutation)).length,
          activeMutations: Array.isArray(state.activeMutations) ? state.activeMutations.length : 0,
          rareActive: rareSpawnActive(),
          rareName: rareSpawnDefinition(activeRareSpawn()?.id)?.name || "",
          rareHp: Number(activeRareSpawn()?.hp || 0),
          rareDefeats: Number(state.rareDefeats || 0),
          worldRegion: currentWorldRegion().name,
          achievements: state.achievements.length,
          maxCombo: Number(state.maxCombo || 0),
          sporesPerSecond: incomePerSecond(),
          scrollable: document.documentElement.scrollHeight > window.innerHeight + 1,
          overflowX: document.documentElement.scrollWidth > window.innerWidth + 1
        };
      },
      seedSystems() {
        state.soundOn = false;
        state.machines.press = Math.max(Number(state.machines.press || 0), 55);
        state.machines.clock = Math.max(Number(state.machines.clock || 0), 55);
        state.machines.collector = Math.max(Number(state.machines.collector || 0), 35);
        state.machines.spring = Math.max(Number(state.machines.spring || 0), 30);
        state.machines.observatory = Math.max(Number(state.machines.observatory || 0), 12);
        state.bossDefeats = Math.max(Number(state.bossDefeats || 0), 12);
        state.enemyDefeats = Math.max(Number(state.enemyDefeats || 0), 900);
        state.bestCombatDepth = Math.max(bestCombatDepth(), 140);
        state.bloomCount = Math.max(Number(state.bloomCount || 0), 2);
        state.rootstock = Math.max(Number(state.rootstock || 0), 8);
        state.lifetimeRootstock = Math.max(Number(state.lifetimeRootstock || 0), Number(state.rootstock || 0));
        recordNewRelics(state);
        ensureCombatState(state);
        markDirty();
        render();
        return this.metrics();
      },
      forceRare(id = "wandering-truffle", hp = 0) {
        state.soundOn = false;
        spawnRare(id);
        if (state.rareSpawn && Number(hp) > 0) {
          state.rareSpawn.hp = Number(hp);
          state.rareSpawn.maxHp = Math.max(Number(hp), 1);
        }
        render();
        return this.metrics();
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
  startBattleRenderer();
  showOfflineReturn();
  window.setInterval(tick, 1000);
  window.setInterval(() => { if (dirty) save(); }, 5000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
})();
