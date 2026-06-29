const API_BASE = window.SLAYY_API_BASE || "";

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

function fmtTime(value) {
  if (!value) return "not sent yet";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatDate(date) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parsed);
}

function number(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function el(name, attrs = {}, children = []) {
  const node = document.createElement(name);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
    else if (key === "html") node.innerHTML = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.append(child);
  return node;
}

function svg(name, attrs = {}, children = []) {
  const node = document.createElementNS("http://www.w3.org/2000/svg", name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  for (const child of children) node.append(child);
  return node;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 6000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const response = await fetchWithTimeout(apiUrl(path), { ...options, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `request failed ${response.status}`);
    error.data = data;
    throw error;
  }
  return data;
}

function dailyFromSnapshots(snapshots = []) {
  const byDate = new Map();
  for (const snapshot of snapshots) {
    const date = snapshot.date || String(snapshot.capturedAt || "").slice(0, 10);
    if (!date) continue;
    const existing = byDate.get(date) || { date, addedWords: 0, deletedWords: 0, totalChangedWords: 0, netWords: 0, wordCount: 0, snapshots: 0 };
    existing.addedWords += Number(snapshot.addedWords || 0);
    existing.deletedWords += Number(snapshot.deletedWords || 0);
    existing.totalChangedWords = existing.addedWords + existing.deletedWords;
    existing.netWords += Number(snapshot.netWords || 0);
    existing.wordCount = Number(snapshot.wordCount || existing.wordCount || 0);
    existing.snapshots += 1;
    byDate.set(date, existing);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function latestSnapshot(state) {
  const snapshots = Array.isArray(state.snapshots) ? state.snapshots : [];
  return snapshots[snapshots.length - 1] || null;
}

const PAPER_EASE_ORDER = new Map([
  ["title", 10],
  ["claim discipline", 20],
  ["Results order", 30],
  ["limitations paragraph", 40],
  ["novelty sentence", 50],
  ["abstract arc", 60],
  ["avoid water analogy drift", 70],
  ["flexural-joint wording", 80],
  ["cell/module split", 90],
  ["overhang endpoint definition", 100],
  ["overhang reference lines", 110],
  ["large readable labels", 120],
  ["one claim per figure", 130],
  ["source consistency", 140],
  ["do not abandon pneumatics", 150],
  ["direct magnetic actuation boundary", 160],
  ["pulse circuit note", 170],
  ["student overlap", 180],
  ["print-reliability hinge note", 190],
  ["simulation-language cleanup", 200],
  ["single-cell mechanism", 210],
  ["upper/lower leg asymmetry", 220],
  ["cell figure", 230],
  ["module figure", 240],
  ["overhang figure", 250],
  ["cylindrical figures", 260],
  ["stiffness paragraph bridge", 270],
  ["module-bias evidence", 280],
  ["boundary-condition role", 290],
  ["expansion-ratio reality", 300],
  ["66-cell limit", 310],
  ["overhang requirement", 320],
  ["comparison paragraph", 330],
  ["quantitative spine", 340],
  ["Methods reproducibility", 350],
  ["manifold architecture", 360],
  ["threshold question", 370],
  ["node/mesh analysis", 380],
  ["physical EPM switching test", 390],
  ["editorial package", 400]
]);

function paperEaseRank(item, originalIndex) {
  const title = String(item.title || "").trim();
  if (PAPER_EASE_ORDER.has(title)) return PAPER_EASE_ORDER.get(title);
  const text = `${title} ${item.detail || ""}`.toLowerCase();
  let rank = 500 + originalIndex;
  if (/title|remove|avoid|clarify|state|replace/.test(text)) rank -= 80;
  if (/figure|caption|label|reference line|bracket/.test(text)) rank -= 30;
  if (/calculation|analysis|measure|run|test|methods|fabrication|reviewer|data\/code/.test(text)) rank += 100;
  return rank;
}

function paperActionItem(item, state = {}) {
  const title = String(item.title || "").trim();
  const detail = String(item.detail || title || "").replace(/\s+/g, " ").trim();
  const currentTitle = String(state.project?.manuscript || "").replace(/\s+/g, " ").trim();
  const titlePrefix = currentTitle ? `In the title line, replace "${currentTitle}"` : "In the title line, replace the current broad title";
  const actions = {
    "title": [`${titlePrefix} with "A printed pneumatic cell for morphing surfaces and reconfigurable soft robots."`, "Why it matters: the reader sees the concrete contribution before the abstract, instead of a broad field label."],
    "claim discipline": ["Search the abstract and Discussion for autonomy, closed-loop control, integrated valves, sensing, and full two-dimensional overhang claims; delete or soften anything not shown by the current prototypes.", "Why it matters: bounded claims make the paper stronger because the evidence and the words stop fighting each other."],
    "Results order": ["At the start of each Results subsection, make the first sentence a measured result or physical behavior, not a tour of what was built.", "Why it matters: readers should hit evidence first, then understand the build as the reason the evidence exists."],
    "limitations paragraph": ["In Discussion, add one direct limitations sentence naming external pressure, tubing, manual assembly, scale, speed, leakage, limited row overhang, no closed-loop control, and no integrated EPM valve yet.", "Why it matters: naming limits makes the real contribution more trustworthy, not weaker."],
    "novelty sentence": ["Near the end of the Introduction, add one sentence: one printed pneumatic unit is reused for both morphing surfaces and reconfigurable robot bodies.", "Why it matters: this gives the reader the paper's difference in one place."],
    "abstract arc": ["Rewrite the abstract in five beats: problem, approach, strongest real result, main limitation, and bounded claim.", "Why it matters: a clear abstract keeps the paper from reading like a project tour."],
    "avoid water analogy drift": ["In the overhang paragraph, keep only the material-deformation comparison; delete any sentence where the water analogy carries evidence instead of the prototype.", "Why it matters: the prototype has to prove the claim, not the metaphor."],
    "flexural-joint wording": ["Search for flexural hinge language; replace it with compliant-linkage wording that says the Sarrus legs bend as beams under inflation.", "Why it matters: this keeps the mechanism physically honest."],
    "cell/module split": ["Search for cell, module, array, layer, and topology; make cell mean one printed Sarrus-plus-PneuNet unit and module mean the 2 by 2 pneumatic grouping.", "Why it matters: readers cannot follow the mechanism if the part names move around."],
    "overhang endpoint definition": ["In the overhang text, caption, and figure annotation, name the two endpoints used for the approximately 1 cm overhang measurement.", "Why it matters: the overhang claim becomes checkable instead of vibes-based."],
    "overhang reference lines": ["Add a bracket or two vertical dashed lines on the overhang figure at the measurement endpoints.", "Why it matters: the figure should show the measurement without forcing the reader into the paragraph first."],
    "large readable labels": ["Increase angle markers, pressure labels, reference lines, and panel letters until they stay readable at printed caption scale.", "Why it matters: unreadable labels make good evidence look unfinished."],
    "one claim per figure": ["For each main figure caption, write one sentence that says the single claim the figure proves; delete panels or caption phrases that do not support that claim.", "Why it matters: each figure gets easier to defend when it has one job."],
    "source consistency": ["Check every caption number against the exported figures: pressure, expansion ratio, cell count, module count, angle, overhang length, and topology size.", "Why it matters: one wrong number can make the whole results section feel shaky."],
    "do not abandon pneumatics": ["In the EPM Discussion, keep air as the proven actuation platform and frame EPMs first as valve/manifold control for pneumatic cells.", "Why it matters: the paper should build from what worked, not jump to an unproven replacement."],
    "direct magnetic actuation boundary": ["If direct EPM actuation stays in the Discussion, mark it as future work that still needs range, force, scale, and heating data.", "Why it matters: this keeps speculation from looking like a demonstrated result."],
    "pulse circuit note": ["Describe the EPM as pulse-switched between stable states; remove wording that makes it sound continuously powered like a solenoid.", "Why it matters: the control idea only makes sense if the energy/state behavior is accurate."],
    "student overlap": ["Add a note only if it becomes a real cited design input: magnetic-soft-actuator student connection and split-magnet EPM concept.", "Why it matters: this preserves useful context without adding loose name-dropping."],
    "print-reliability hinge note": ["Add one Methods or Discussion sentence explaining that notch-like hinges were avoided because many cells must print reliably and thin unsupported hinge features become floppy or unreliable.", "Why it matters: it turns a design choice into engineering logic instead of an unexplained omission."],
    "simulation-language cleanup": ["Where the paper mentions ideal rigid-link or flexible-joint models, add one sentence saying the physical cell bends through compliant beams and distributed deformation.", "Why it matters: the model stays useful without pretending it is the exact physical cell."],
    "single-cell mechanism": ["In the first cell-mechanism paragraph, separate the cell from the module: cell equals monolithic Sarrus-linkage-plus-PneuNet unit; module equals 2 by 2 pneumatic grouping.", "Why it matters: the reader needs the basic unit before the larger robot arguments work."],
    "upper/lower leg asymmetry": ["In the module-bending paragraph, say the upper thin structural legs and lower thicker pneumatic-channel legs create directional bias; reuse upright-V and inverted-V wording from the figure.", "Why it matters: it connects what the reader sees to why the module bends."],
    "cell figure": ["In Figure 1 caption, explicitly label uncapped cell, capped cell, Sarrus linkage, PneuNet actuator, and cap role without describing module behavior.", "Why it matters: Figure 1 should teach the cell, not blur into the rest of the paper."],
    "module figure": ["In Figure 2 caption, make the directional-bias mechanism explicit: upper/lower leg pairs, single-module and two-module bending angles, and unactuated cross-section.", "Why it matters: the module figure should prove how expansion becomes bending."],
    "overhang figure": ["In the overhang figure/caption, add measurement references, layer labels, actuation pattern, cell count, and row state so the 1 cm claim can be checked visually.", "Why it matters: the strongest geometry claim should be readable directly from the figure."],
    "cylindrical figures": ["In bending, grasping, peristalsis, and rolling captions, say these are topology-level reconfigurations of the same module, not a separate actuator family.", "Why it matters: it makes the robot examples support one system claim instead of looking like separate demos."],
    "stiffness paragraph bridge": ["In the stiffness paragraph, connect the regimes to beam bending: early axial resistance, low-stiffness leg bending, then high-stiffness pneumatic-chamber compression.", "Why it matters: the mechanics section should explain the same physical story as the figures."],
    "module-bias evidence": ["Tie the 80 psi side views, angle plot, and V-shaped leg-pair annotations to one claim: asymmetric connection geometry converts expansion into repeatable convex bending.", "Why it matters: it turns several panels into one mechanism argument."],
    "boundary-condition role": ["In the overhang caption or paragraph, state whether the boundary helps or limits the overhang instead of leaving the constraint implicit.", "Why it matters: boundary conditions decide what the prototype actually proves."],
    "expansion-ratio reality": ["In the overhang section, say constrained modules may not reach ideal 2x expansion and connect leakage, actuation strength, and compression to the achieved shape.", "Why it matters: it prevents an ideal number from overstating the deformed structure."],
    "66-cell limit": ["Add one boundary sentence: 33-cell row, two opposed layers, 66 total cells, about 1 cm overhang, proof-of-principle row rather than full two-dimensional overhang surface.", "Why it matters: it makes the result impressive without pretending it is larger than it is."],
    "overhang requirement": ["Write the overhang requirement as physical variables: curvature relative to thickness, available length, local expansion ratio, boundary constraint, and convex/concave bending ability.", "Why it matters: the overhang becomes a design condition, not just a picture."],
    "comparison paragraph": ["In Introduction or Discussion, compare the closest prior systems by direct capability differences instead of citation lists alone.", "Why it matters: readers need to know what this system can do that nearby work cannot."],
    "quantitative spine": ["Make one pass through Results and add the hard-number chain where available: pressure, expansion ratio, stiffness regimes, bending angles, feature height, overhang length, load/object interaction, locomotion, repeats.", "Why it matters: numbers give the paper a backbone."],
    "Methods reproducibility": ["In Methods, add enough audit detail for fabrication, materials, print orientation, pressure control, measurement calibration, boundary conditions, and analysis scripts.", "Why it matters: reproducible methods make the results easier to trust."],
    "manifold architecture": ["Sketch or describe one pressure manifold feeding many cells, with each cell controlled by a small pulse-switched EPM valve.", "Why it matters: it turns the EPM idea into a plausible system architecture."],
    "threshold question": ["Add a short design-rule paragraph or calculation that states what curvature, length, thickness, and expansion combination makes an overhang possible.", "Why it matters: this answers the reader's obvious physical question before they get stuck."],
    "node/mesh analysis": ["Create a simple node-following or mesh analysis from planar state to overhang state so stretch, local bend, and length demand are visible.", "Why it matters: the geometry argument becomes inspectable instead of verbal."],
    "physical EPM switching test": ["Run the minimal EPM test: Alnico and NdFeB rods in a tube or constrained guide; record attraction/repulsion switching and whether the soft magnet twists.", "Why it matters: one small test separates a real actuation path from a cool idea."],
    "editorial package": ["Prepare the Science submission package: cover-letter line, graphical claim, suggested reviewers, competing-work comparison, and data/code availability.", "Why it matters: this is only useful after the paper itself is coherent, so it belongs at the end."]
  };
  const action = actions[title] || [detail, "Why it matters: this turns a source note into one visible paper move."];
  return { action: action[0], why: action[1] };
}

function paperChangeItems(state = {}) {
  const sections = Array.isArray(state.taskSections) ? state.taskSections : [];
  return sections.flatMap((section) => Array.isArray(section.items) ? section.items : [])
    .map((item, originalIndex) => ({
      ...paperActionItem(item, state),
      rank: paperEaseRank(item, originalIndex),
      originalIndex
    }))
    .filter((item) => item.action)
    .sort((left, right) => left.rank - right.rank || left.originalIndex - right.originalIndex)
    .map((item) => ({ action: item.action, why: item.why }))
    .filter(Boolean);
}

function renderPaperMeta(state) {
  const paperLine = document.getElementById("paperLine");
  const latest = latestSnapshot(state);
  const changes = paperChangeItems(state).length;
  if (!latest) {
    paperLine.textContent = `${number(changes)} comment and recording changes / no saved snapshot`;
    return;
  }
  paperLine.textContent = `${number(latest.wordCount)} words / latest ${formatDate(latest.date)} / ${number(changes)} comment and recording changes`;
}

function renderPaperGraph(state) {
  const graph = document.getElementById("wordGraph");
  const daily = Array.isArray(state.daily) && state.daily.length ? state.daily : dailyFromSnapshots(state.snapshots);
  graph.textContent = "";
  const compact = window.matchMedia("(max-width: 760px)").matches;
  const viewWidth = compact ? 430 : 920;
  graph.setAttribute("viewBox", `0 0 ${viewWidth} 280`);

  const margin = { left: compact ? 36 : 54, right: compact ? 18 : 24, top: 24, bottom: 40 };
  const width = viewWidth - margin.left - margin.right;
  const height = 280 - margin.top - margin.bottom;
  const baselineY = margin.top + height;
  const totalChanged = (day) => {
    const added = Math.abs(Number(day.addedWords || 0));
    const deleted = Math.abs(Number(day.deletedWords || 0));
    return Number(day.totalChangedWords || 0) || added + deleted;
  };
  const maxTotal = Math.max(10, ...daily.map(totalChanged));
  const scale = (height - 36) / maxTotal;

  graph.append(
    svg("line", { class: "axis-line", x1: margin.left, y1: baselineY, x2: margin.left + width, y2: baselineY }),
    svg("line", { class: "grid-line", x1: margin.left, y1: margin.top, x2: margin.left + width, y2: margin.top }),
    svg("line", { class: "grid-line", x1: margin.left, y1: margin.top + height / 2, x2: margin.left + width, y2: margin.top + height / 2 })
  );

  if (!daily.length) {
    graph.append(svg("text", { class: "empty-label", x: margin.left, y: baselineY - 18 }, [document.createTextNode("no snapshots yet")]));
    return;
  }

  const slot = width / Math.max(daily.length, 1);
  const barWidth = daily.length === 1 ? 72 : Math.min(42, Math.max(16, slot * 0.22));

  daily.forEach((day, index) => {
    const xCenter = margin.left + slot * index + slot / 2;
    const added = Math.abs(Number(day.addedWords || 0));
    const deleted = Math.abs(Number(day.deletedWords || 0));
    const total = totalChanged(day);
    const barHeight = Math.max(total * scale, total > 0 ? 2 : 0);

    if (!total) {
      graph.append(
        svg("circle", { cx: xCenter, cy: baselineY, r: 4, fill: "var(--paper)" }),
        svg("text", { class: "bar-label", x: xCenter, y: baselineY - 12, "text-anchor": "middle" }, [document.createTextNode("0")]),
        svg("text", { class: "tick-label", x: xCenter, y: 266, "text-anchor": "middle" }, [document.createTextNode(formatDate(day.date))])
      );
      return;
    }

    const deletedHeight = deleted > 0 ? Math.max((deleted / total) * barHeight, 2) : 0;
    const addedHeight = Math.max(barHeight - deletedHeight, added > 0 ? 2 : 0);
    const addedY = baselineY - barHeight;
    const deletedY = baselineY - deletedHeight;
    const segmentLabels = [];

    if (added && addedHeight >= 18) {
      segmentLabels.push(svg("text", {
        class: "segment-label",
        x: xCenter,
        y: addedY + addedHeight / 2 + 4,
        "text-anchor": "middle"
      }, [document.createTextNode(`+${number(added)}`)]));
    }
    if (deleted && deletedHeight >= 18) {
      segmentLabels.push(svg("text", {
        class: "segment-label",
        x: xCenter,
        y: deletedY + deletedHeight / 2 + 4,
        "text-anchor": "middle"
      }, [document.createTextNode(`-${number(deleted)}`)]));
    }

    graph.append(
      svg("rect", { x: xCenter - barWidth / 2, y: addedY, width: barWidth, height: addedHeight, class: "bar-added" }),
      svg("rect", { x: xCenter - barWidth / 2, y: deletedY, width: barWidth, height: deletedHeight, class: "bar-deleted" }),
      svg("text", { class: "bar-label changed", x: xCenter, y: baselineY - barHeight - 8, "text-anchor": "middle" }, [document.createTextNode(number(total))]),
      ...segmentLabels,
      svg("text", { class: "tick-label", x: xCenter, y: 266, "text-anchor": "middle" }, [document.createTextNode(formatDate(day.date))])
    );
  });
}

function renderPaperList(state) {
  const target = document.getElementById("paperChangeList");
  const items = paperChangeItems(state);
  target.textContent = "";
  if (!items.length) {
    target.append(el("li", { class: "paper-change-row" }, [
      el("span", { class: "paper-change-number" }, [document.createTextNode("0")]),
      el("p", {}, [document.createTextNode("no comment or recording changes in Paper state")])
    ]));
    return;
  }
  items.forEach((item, index) => {
    target.append(el("li", { class: "paper-change-row" }, [
      el("span", { class: "paper-change-number" }, [document.createTextNode(String(index + 1))]),
      el("div", { class: "paper-change-copy" }, [
        el("p", {}, [document.createTextNode(item.action)]),
        el("p", { class: "paper-change-why" }, [document.createTextNode(item.why)])
      ])
    ]));
  });
}

async function saveFeedback(eventId, value, card) {
  await api(`/api/slayy/events/${encodeURIComponent(eventId)}/feedback`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ feedback: value })
  });
  card.querySelectorAll("button[data-feedback]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.feedback === value);
  });
}

function renderEvent(event) {
  const card = el("article", { class: "event-card" });
  const score = event.score ? String(event.score) : "--";
  card.append(
    el("div", { class: "event-head" }, [
      el("div", {}, [
        el("h2", { class: "event-title" }, [document.createTextNode(event.eventName || event.subject || "slayy email")]),
        el("p", { class: "event-meta" }, [document.createTextNode(`${fmtTime(event.sentAt || event.createdAt)} / ${event.status || "pending"} / ${event.subject || ""}`)]),
        el("p", { class: "event-source" }, [document.createTextNode(event.sourceSummary || "paper progress")])
      ]),
      el("div", { class: "score" }, [
        el("span", {}, [document.createTextNode(event.scoreLabel || "slayy score")]),
        el("strong", {}, [document.createTextNode(score)])
      ])
    ]),
    el("div", { class: "email-body", html: event.bodyHtml || `<p>${event.bodyText || ""}</p>` }),
    el("div", { class: "feedback-row" }, [
      el("button", { type: "button", "data-feedback": "up", "aria-label": "thumbs up" }, [document.createTextNode("up")]),
      el("button", { type: "button", "data-feedback": "down", "aria-label": "thumbs down" }, [document.createTextNode("down")])
    ])
  );
  card.querySelectorAll("button[data-feedback]").forEach((button) => {
    button.classList.toggle("is-selected", button.dataset.feedback === event.feedback);
    button.addEventListener("click", () => saveFeedback(event.id, button.dataset.feedback, card).catch((error) => {
      document.getElementById("healthLine").textContent = error.message || "feedback failed";
    }));
  });
  return card;
}

function renderEvents(data) {
  const eventsTarget = document.getElementById("events");
  eventsTarget.textContent = "";
  if (!data.events.length) {
    eventsTarget.append(el("p", { class: "empty" }, [document.createTextNode("no slayy emails yet")]));
    return;
  }
  data.events.forEach((event) => eventsTarget.append(renderEvent(event)));
}

async function main() {
  const healthLine = document.getElementById("healthLine");
  try {
    const [health, eventsData, paperData] = await Promise.all([
      fetchWithTimeout(apiUrl("/api/slayy/health"), { cache: "no-store" }).then((response) => response.json()),
      api("/api/slayy/events"),
      api("/api/slayy/paper-state")
    ]);
    healthLine.textContent = `${health.events || 0} emails / ${health.pending || 0} pending / watcher ${health.autoWatch ? "on" : "manual"}`;
    renderEvents(eventsData);
    renderPaperMeta(paperData.state || {});
    renderPaperGraph(paperData.state || {});
    renderPaperList(paperData.state || {});
  } catch (error) {
    healthLine.textContent = error.message || "slayy unavailable";
    document.getElementById("paperLine").textContent = "paper unavailable";
    renderPaperGraph({ daily: [] });
    renderPaperList({ taskSections: [] });
  }
}

main();
