(function () {
  "use strict";

  const saveKey = "mushroom-boop-save-v1";
  const maxOfflineSeconds = 8 * 60 * 60;

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
    { id: "return", name: "Daily dew", desc: "Claim a daily dew reward.", req: state => state.dailyClaims >= 1 }
  ];

  const state = loadState();
  let lastTick = Date.now();
  let dirty = false;
  let displayedRate = incomePerSecond(state);
  let clickRateBurst = 0;

  const els = {};
  [
    "loopsValue", "rateValue", "baseRateValue", "tapValue", "seedButton", "orchardVisual", "machineList",
    "upgradeList", "rootstockValue", "prestigeHint", "prestigeButton", "dailyReward",
    "dailyButton", "focusValue", "focusButton", "boostHint", "machineCount", "upgradeCount",
    "achievementCount", "achievementList", "clicksValue", "lifetimeValue",
    "multiplierValue", "shareButton", "exportButton", "importButton", "saveDialog",
    "saveText", "dialogTitle", "dialogHelp", "copySaveButton", "loadSaveButton", "saveState"
  ].forEach(id => { els[id] = document.getElementById(id); });

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
      lastDaily: "",
      streak: 0,
      lastSaved: Date.now(),
      machines: Object.fromEntries(machines.map(machine => [machine.id, 0])),
      upgrades: [],
      achievements: []
    };
  }

  function loadState() {
    const fallback = defaultState();
    try {
      if (new URLSearchParams(window.location.search).has("reset")) {
        localStorage.removeItem(saveKey);
      }
      const raw = localStorage.getItem(saveKey);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      const merged = { ...fallback, ...parsed };
      merged.machines = { ...fallback.machines, ...(parsed.machines || {}) };
      merged.upgrades = Array.isArray(parsed.upgrades) ? parsed.upgrades : [];
      merged.achievements = Array.isArray(parsed.achievements) ? parsed.achievements : [];
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

  function rootBonus(target = state) {
    const base = hasUpgrade("prestige-soft", target) ? 0.23 : 0.15;
    return 1 + Number(target.rootstock || 0) * base;
  }

  function rateMultiplier(target = state) {
    let mult = rootBonus(target);
    upgrades.forEach(upgrade => {
      if (upgrade.kind === "rate" && hasUpgrade(upgrade.id, target)) mult *= upgrade.value;
    });
    if (Date.now() < Number(target.focusUntil || 0)) mult *= 2;
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
    return machine.base * Math.pow(machine.scale, Number(target.machines[machine.id] || 0));
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
    displayedRate = Math.max(displayedRate, incomePerSecond());
    markDirty();
    checkAchievements();
    render();
  }

  function graftGain() {
    if (state.lifetimeLoops < 1000000) return 0;
    return Math.max(1, Math.floor(Math.sqrt(state.lifetimeLoops / 1000000)));
  }

  function graft() {
    const gain = graftGain();
    if (gain <= 0) return;
    const keep = defaultState();
    state.rootstock += gain;
    state.loops = 0;
    state.totalLoops = 0;
    state.clicks = 0;
    state.focusUntil = 0;
    state.machines = keep.machines;
    state.upgrades = [];
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
    state.focusUntil = now + 10 * 60 * 1000;
    displayedRate = Math.max(displayedRate, incomePerSecond());
    els.boostHint.textContent = result.demo
      ? "Demo boost active. Configure rewarded AdMob IDs before App Store release."
      : "Reward boost active.";
    markDirty();
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
    addLoops(state, gained);
    recordSporeBurst(gained);
    state.clicks += 1;
    markDirty();
    checkAchievements();
    showPop(x, y, `+${format(gained)}`);
    showSporeBurst(x, y);
    if (navigator.vibrate) navigator.vibrate(10);
    els.seedButton.classList.add("is-pressed");
    window.setTimeout(() => els.seedButton.classList.remove("is-pressed"), 240);
    render();
  }

  function showPop(x, y, text) {
    const pop = document.createElement("span");
    pop.className = "pop";
    pop.textContent = text;
    pop.style.left = `${x}px`;
    pop.style.top = `${y}px`;
    document.body.appendChild(pop);
    window.setTimeout(() => pop.remove(), 780);
  }

  function showSporeBurst(x, y) {
    const count = window.matchMedia("(max-width: 620px)").matches ? 14 : 10;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
      const distance = 42 + Math.random() * 76;
      const spore = document.createElement("span");
      spore.className = "spore-pop";
      spore.style.left = `${x}px`;
      spore.style.top = `${y}px`;
      spore.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
      spore.style.setProperty("--dy", `${Math.sin(angle) * distance - 28}px`);
      spore.style.setProperty("--spin", `${Math.random() * 220 - 110}deg`);
      spore.style.setProperty("--size", `${6 + Math.random() * 8}px`);
      document.body.appendChild(spore);
      window.setTimeout(() => spore.remove(), 760);
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
    els.dialogHelp.textContent = "Paste a Mushroom Boop save code.";
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
      state.upgrades = Array.isArray(imported.upgrades) ? imported.upgrades : [];
      state.achievements = Array.isArray(imported.achievements) ? imported.achievements : [];
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
    const text = `I grew ${format(state.lifetimeLoops)} lifetime spores in Mushroom Boop. Play at https://aolabs.io/mushroom-boop/`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Mushroom Boop", text, url: "https://aolabs.io/mushroom-boop/" });
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
    els.rootstockValue.textContent = format(state.rootstock);
    els.prestigeButton.disabled = gain <= 0;
    els.prestigeButton.textContent = gain > 0 ? `bloom +${format(gain)}` : "bloom";
    els.prestigeHint.textContent = gain > 0
      ? `Reset for ${format(gain)} mycelium. Each mycelium permanently increases output.`
      : `Reach 1,000,000 lifetime spores to bloom the colony.`;
  }

  function renderFocus() {
    const remaining = Math.max(0, Number(state.focusUntil || 0) - Date.now());
    els.focusValue.textContent = remaining > 0 ? `${Math.ceil(remaining / 60000)}m left` : "inactive";
    els.focusButton.disabled = remaining > 0;
    els.focusButton.textContent = remaining > 0 ? "boost active" : "watch ad for boost";
  }

  function render() {
    els.loopsValue.textContent = format(state.loops);
    els.rateValue.textContent = format(displayedRate);
    els.baseRateValue.textContent = `base ${format(incomePerSecond())}`;
    els.tapValue.textContent = format(state.clicks);
    els.clicksValue.textContent = format(state.clicks);
    els.lifetimeValue.textContent = format(state.lifetimeLoops);
    els.multiplierValue.textContent = `${rateMultiplier().toFixed(rateMultiplier() >= 10 ? 1 : 2)}x`;
    els.machineCount.textContent = "spend spores";
    els.upgradeCount.textContent = `${state.upgrades.length} active`;
    els.achievementCount.textContent = `${state.achievements.length} unlocked`;
    renderMachines();
    renderUpgrades();
    renderAchievements();
    renderOrchard();
    renderDaily();
    renderPrestige();
    renderFocus();
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
  els.prestigeButton.addEventListener("click", graft);
  els.dailyButton.addEventListener("click", claimDaily);
  els.focusButton.addEventListener("click", useFocus);
  els.shareButton.addEventListener("click", shareScore);
  els.exportButton.addEventListener("click", exportSave);
  els.importButton.addEventListener("click", importSave);
  els.copySaveButton.addEventListener("click", copySaveCode);
  els.loadSaveButton.addEventListener("click", loadSaveCode);

  window.addEventListener("beforeunload", save);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") save();
  });

  checkAchievements();
  render();
  window.setInterval(tick, 1000);
  window.setInterval(() => { if (dirty) save(); }, 5000);

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
})();
