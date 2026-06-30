const API_BASE = window.SLAYY_API_BASE || "";
const SET_ASIDE_STORAGE_KEY = "slayy.paper.setAside.v1";
const APPROVED_DONE_STORAGE_KEY = "slayy.paper.approvedDone.v1";
const KEEP_OPEN_STORAGE_KEY = "slayy.paper.keepOpen.v1";

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

function signedNumber(value) {
  const numeric = Number(value || 0);
  if (numeric > 0) return `+${number(numeric)}`;
  if (numeric < 0) return `-${number(Math.abs(numeric))}`;
  return "0";
}

const HISTORY_TERM_STOP_WORDS = new Set([
  "a", "all", "also", "an", "and", "any", "are", "as", "at", "be", "been", "being", "between",
  "by", "can", "could", "does", "during", "either", "for", "from", "had", "has", "have", "however",
  "in", "into", "is", "it", "its", "not", "of", "on", "or", "out", "that", "the", "there", "these",
  "this", "through", "to", "using", "via", "was", "were", "which", "while", "with", "would"
]);

function cleanHistoryTerm(item = {}) {
  const word = String(item.word || item || "").trim().toLowerCase();
  if (word.length < 3 || HISTORY_TERM_STOP_WORDS.has(word)) return null;
  return { word, count: Number(item.count || 1) };
}

function historyTerms(terms = [], max = 4) {
  return terms
    .map(cleanHistoryTerm)
    .filter(Boolean)
    .sort((left, right) => right.count - left.count || left.word.localeCompare(right.word))
    .slice(0, max);
}

function quoteHistoryTerms(terms = []) {
  const words = terms.map((term) => `"${term.word.toUpperCase()}"`);
  if (!words.length) return "";
  if (words.length === 1) return words[0];
  if (words.length === 2) return `${words[0]} and ${words[1]}`;
  return `${words.slice(0, -1).join(", ")}, and ${words[words.length - 1]}`;
}

function hasHistoryTerm(terms = [], words = []) {
  const set = new Set(terms.map((term) => term.word));
  return words.some((word) => set.has(word));
}

function revisionMovementSentence(mood, addedWords, deletedWords, netWords) {
  const movement = `${number(addedWords)} words went in and ${number(deletedWords)} came out`;
  if (mood === "cleanup") {
    return `Damn yes, this improved the paper. ${movement}, so the draft got ${number(Math.abs(netWords))} words tighter.`;
  }
  if (mood === "build") {
    return `Damn yes, this improved the paper. ${movement}, so the draft gained ${number(Math.abs(netWords))} words of new structure.`;
  }
  return `Damn yes, this improved the paper. ${movement}, so this was a real sentence-level rewrite.`;
}

function revisionTermSentence(addedTerms = [], deletedTerms = []) {
  const parts = [];
  const added = quoteHistoryTerms(addedTerms);
  const deleted = quoteHistoryTerms(deletedTerms);
  if (added) parts.push(`You added ${added}`);
  if (deleted) parts.push(`you cut ${deleted}`);
  return parts.length ? `${parts.join("; ")}.` : "";
}

function revisionImpactSentence(addedTerms = [], deletedTerms = [], mood = "rewrite") {
  if (hasHistoryTerm(addedTerms, ["actuated", "behavior", "biasing", "double", "modules"])) {
    return "That helps a lot because the reader now sees actuated behavior and module biasing instead of having to guess the mechanism from broad architecture language.";
  }
  if (hasHistoryTerm(addedTerms, ["printed", "sheets", "cells", "actuation"])) {
    return "That helps a lot because the contribution reads more like a printed physical system and less like an abstract platform claim.";
  }
  if (hasHistoryTerm(addedTerms, ["buckle", "downwards", "constraints", "pressures"]) || hasHistoryTerm(deletedTerms, ["plane", "buckling", "pneumatic"])) {
    return "That helps a lot because buckling direction, actuation, constraints, and pressure become easier to defend as physical behavior.";
  }
  if (hasHistoryTerm(addedTerms, ["prototype", "pressure", "caption"]) || hasHistoryTerm(deletedTerms, ["autonomy", "framework", "allowing", "systems"])) {
    return "That helps a lot because the paper moves away from broad promise language and toward prototype evidence a reader can check.";
  }
  if (hasHistoryTerm(addedTerms, ["figure", "caption", "upper", "lower", "bias"])) {
    return "That helps a lot because the figure language carries more of the mechanism instead of leaving the reader to infer it.";
  }
  if (mood === "cleanup") {
    return "That helps a lot because the draft has less filler between the reader and the real mechanism.";
  }
  if (mood === "build") {
    return "That helps a lot because the paper gained concrete material the next revision can shape.";
  }
  return "That helps a lot because the argument changed at the sentence level, not just in the word count.";
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

function readStorageKeySet(storageKey) {
  try {
    const value = window.localStorage.getItem(storageKey);
    const parsed = value ? JSON.parse(value) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function writeStorageKeySet(storageKey, keys) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(Array.from(keys)));
  } catch {
    // Local storage is a convenience for task ordering; the list still works without it.
  }
}

function readSetAsideKeys() {
  return readStorageKeySet(SET_ASIDE_STORAGE_KEY);
}

function writeSetAsideKeys(keys) {
  writeStorageKeySet(SET_ASIDE_STORAGE_KEY, keys);
}

function readApprovedDoneKeys() {
  return readStorageKeySet(APPROVED_DONE_STORAGE_KEY);
}

function writeApprovedDoneKeys(keys) {
  writeStorageKeySet(APPROVED_DONE_STORAGE_KEY, keys);
}

function readKeepOpenKeys() {
  return readStorageKeySet(KEEP_OPEN_STORAGE_KEY);
}

function writeKeepOpenKeys(keys) {
  writeStorageKeySet(KEEP_OPEN_STORAGE_KEY, keys);
}

function taskKey(item = {}) {
  return String(item.title || item.detail || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

function versionTime(value, date) {
  if (value) return fmtTime(value);
  if (date) return formatDate(date);
  return "undated";
}

function revisionMood(addedWords, deletedWords, netWords) {
  if (!addedWords && !deletedWords && !netWords) return "checkpoint";
  if (deletedWords > addedWords * 1.5) return "cleanup";
  if (addedWords > deletedWords * 1.5) return "build";
  return "rewrite";
}

function revisionSummarySentence(mood, addedWords, deletedWords, netWords) {
  return revisionMovementSentence(mood, addedWords, deletedWords, netWords);
}

function snapshotChangeText(snapshot = {}, index = 0, historyDiffsById = new Map()) {
  const versionNumber = index + 1;
  const captured = versionTime(snapshot.capturedAt, snapshot.date);
  const diff = historyDiffsById.get(snapshot.id) || {};
  const wordCount = number(diff.wordCount || snapshot.wordCount);
  const addedWords = Number(diff.addedWords ?? snapshot.addedWords ?? 0);
  const deletedWords = Number(diff.deletedWords ?? snapshot.deletedWords ?? 0);
  const netWords = Number(diff.netWords ?? snapshot.netWords ?? 0);

  if (index === 0 || !diff.previousSnapshotId) {
    return `paper version ${versionNumber}, ${captured}. This started the saved paper history at ${wordCount} words, so every later improvement has a clean before-and-after.`;
  }

  if (!addedWords && !deletedWords && !netWords) {
    return `paper version ${versionNumber}, ${captured}. Saved checkpoint; manuscript words did not move from version ${versionNumber - 1}. That still helps because the history proves this refresh was a no-op, not lost work. ${wordCount} words total.`;
  }
  const mood = revisionMood(addedWords, deletedWords, netWords);
  const addedTerms = historyTerms(diff.addedTerms || snapshot.addedTerms || []);
  const deletedTerms = historyTerms(diff.deletedTerms || snapshot.deletedTerms || []);
  return [
    `paper version ${versionNumber}, ${captured}.`,
    revisionSummarySentence(mood, addedWords, deletedWords, netWords),
    revisionTermSentence(addedTerms, deletedTerms),
    revisionImpactSentence(addedTerms, deletedTerms, mood),
    `${wordCount} words total.`
  ].filter(Boolean).join(" ");
}

function snapshotVersionRecords(state = {}, historyDiffs = []) {
  const snapshots = Array.isArray(state.snapshots) ? state.snapshots : [];
  const historyDiffsById = new Map(historyDiffs.map((diff) => [diff.snapshotId, diff]));
  return snapshots.map((snapshot, index) => ({
    kind: "snapshot",
    versionIndex: index + 1,
    sortAt: snapshot.capturedAt || `${snapshot.date || ""}T12:00:00`,
    text: snapshotChangeText(snapshot, index, historyDiffsById)
  }));
}

function emailVersionRecords(events = [], historyDiffsById = new Map()) {
  return events
    .filter((event) => event.sentAt || event.status === "sent")
    .map((event) => {
      const version = event.paperVersion || {};
      const score = event.score ? `${event.scoreLabel || "score"} ${event.score}/10` : "score saved";
      const snapshotId = version.snapshotId || (Array.isArray(event.sourceSnapshotIds) ? event.sourceSnapshotIds[0] : "");
      const diff = historyDiffsById.get(snapshotId) || {};
      const addedWords = Number(event.addedWords || diff.addedWords || 0);
      const deletedWords = Number(event.deletedWords || diff.deletedWords || 0);
      const totalChangedWords = Number(event.totalChangedWords || addedWords + deletedWords || 0);
      const addedTerms = historyTerms(diff.addedTerms || event.addedTerms || []);
      const deletedTerms = historyTerms(diff.deletedTerms || event.deletedTerms || []);
      const termSentence = revisionTermSentence(addedTerms, deletedTerms);
      const mood = revisionMood(addedWords, deletedWords, Number(diff.netWords || version.netWords || 0));
      const movement = totalChangedWords && (addedWords || deletedWords)
        ? `It celebrated ${number(totalChangedWords)} words of paper movement, with ${number(addedWords)} in and ${number(deletedWords)} out.`
        : totalChangedWords === 1
        ? `It saved one tiny paper touch in the archive.`
        : `It saved the paper-work checkpoint.`;
      const impact = termSentence ? revisionImpactSentence(addedTerms, deletedTerms, mood) : "That helps because the progress receipt makes the paper movement easier to see later.";
      const receiptText = [movement, termSentence, impact].filter(Boolean).join(" ");
      return {
        kind: "email",
        sortAt: event.sentAt || event.createdAt || "",
        text: `hype email saved, ${versionTime(event.sentAt || event.createdAt, version.date)}. ${score}. ${receiptText}`
      };
    });
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

const DIFF_STOP_WORDS = new Set([
  "about", "above", "after", "also", "and", "are", "because", "been", "before", "being", "between", "both",
  "can", "claim", "claims", "current", "delete", "detail", "does", "each", "from", "have", "into", "make",
  "makes", "more", "only", "paper", "paragraph", "reader", "readers", "remove", "replace", "section", "sentence",
  "should", "state", "that", "the", "their", "then", "these", "this", "through", "under", "until", "using",
  "what", "when", "where", "which", "while", "with", "without", "word", "words", "write"
]);

const BROAD_DIFF_WORDS = new Set(["actuation", "arrays", "bodies", "cell", "cells", "configuration", "larger", "printed", "same", "single"]);

function escapePattern(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeDiffWord(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9-]/g, "").trim();
}

function diffTermEntries(diff = {}) {
  return [...(Array.isArray(diff.addedTerms) ? diff.addedTerms : []), ...(Array.isArray(diff.deletedTerms) ? diff.deletedTerms : [])]
    .map((entry) => ({
      word: normalizeDiffWord(entry.word),
      count: Math.max(1, Number(entry.count || 1))
    }))
    .filter((entry) => entry.word.length > 3 && !DIFF_STOP_WORDS.has(entry.word));
}

function termMatchesText(term, text) {
  const forms = new Set([term]);
  if (term.endsWith("s")) forms.add(term.slice(0, -1));
  else forms.add(`${term}s`);
  return Array.from(forms).some((form) => new RegExp(`\\b${escapePattern(form)}\\b`, "i").test(text));
}

function hasDiffTerm(termSet, ...terms) {
  return terms.some((term) => {
    const normalized = normalizeDiffWord(term);
    return termSet.has(normalized) || termSet.has(`${normalized}s`) || (normalized.endsWith("s") && termSet.has(normalized.slice(0, -1)));
  });
}

function possibleAddressedForItem(item = {}, diff = {}) {
  if (!diff || !diff.changed) return null;
  if (item.title === "title") return null;
  const terms = diffTermEntries(diff);
  if (!terms.length) return null;
  const termSet = new Set(terms.map((entry) => entry.word));
  const text = `${item.title || ""} ${item.action || ""} ${item.edit || ""} ${item.why || ""}`.toLowerCase();
  const matched = [];
  let score = 0;
  let taskSpecific = false;

  for (const entry of terms) {
    if (BROAD_DIFF_WORDS.has(entry.word)) continue;
    if (!termMatchesText(entry.word, text)) continue;
    matched.push(entry.word);
    score += Math.min(3, entry.count) + (entry.word.length > 6 ? 1 : 0);
  }

  if (item.title === "novelty sentence" && hasDiffTerm(termSet, "printed") && hasDiffTerm(termSet, "cell", "cells") && hasDiffTerm(termSet, "bodies")) {
    taskSpecific = true;
    score += 6;
    for (const word of ["printed", "cells", "bodies"]) if (!matched.includes(word)) matched.push(word);
  }

  if ((item.title === "cell/module split" || item.title === "single-cell mechanism") && hasDiffTerm(termSet, "cell", "cells") && hasDiffTerm(termSet, "printed", "single")) {
    taskSpecific = true;
    score += 4;
    for (const word of ["printed", "cells"]) if (!matched.includes(word)) matched.push(word);
  }

  const uniqueMatches = Array.from(new Set(matched)).slice(0, 5);
  if ((!taskSpecific && score < 8) || uniqueMatches.length < 2) return null;
  return {
    score,
    reason: `latest Paper diff touched ${uniqueMatches.join(", ")}`
  };
}

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

function paperEditText(title, currentTitle, detail) {
  const titleText = currentTitle || "current broad title";
  const edits = {
    "title": `The current title is ${titleText}. No forced replacement title; when it feels worth touching, write one in your own words that names the printed pneumatic cell and the surface/robot uses it actually demonstrates.`,
    "claim discipline": "replace unsupported strong claims with bounded phrases like demonstrated prototypes, row-scale overhang, future integrated valves, and future closed-loop control.",
    "Results order": "change subsection openers from build-tour sentences to result sentences such as At 80 psi, the module bends repeatably because asymmetric legs convert expansion into curvature.",
    "limitations paragraph": "use the Discussion sentence Current limits include external pressure, tubing, manual assembly, scale, speed, leakage, row-scale overhang, no closed-loop control, and no integrated EPM valves.",
    "novelty sentence": "use the Introduction sentence The same printed pneumatic cell supports both morphing surfaces and reconfigurable soft robot bodies.",
    "abstract arc": "make the abstract five sentences in order: problem, approach, strongest result, main limit, bounded claim.",
    "avoid water analogy drift": "delete analogy-led proof sentences; keep only prototype-led sentences about stacked layers bending and curling under differential expansion.",
    "flexural-joint wording": "replace flexural hinge with compliant Sarrus legs that bend as beams under inflation.",
    "cell/module split": "define cell = one printed Sarrus-plus-PneuNet unit; define module = 2 by 2 pneumatic grouping.",
    "overhang endpoint definition": "define the overhang in text and caption as measured from the constrained layer edge to the free tip of the curled row.",
    "overhang reference lines": "add two dashed vertical measurement lines or one bracket at the overhang endpoints in the figure.",
    "large readable labels": "increase pressure labels, angle labels, reference lines, and panel letters until they stay readable in the printed PDF.",
    "one claim per figure": "start each caption with This figure shows... followed by the one claim that figure proves.",
    "source consistency": "compare every caption number against the exported figure labels and replace mismatched pressure, count, angle, and overhang values.",
    "do not abandon pneumatics": "write EPMs as valve/manifold control for the pneumatic system, not as a replacement for pneumatic actuation.",
    "direct magnetic actuation boundary": "mark direct magnetic actuation as future work unless range, force, scale, and heating data are added.",
    "pulse circuit note": "replace continuously powered electromagnet wording with pulse-switched EPM states.",
    "student overlap": "add the magnetic-soft-actuator student connection only as a cited design input, not as an unsupported paper claim.",
    "print-reliability hinge note": "add that notch-like hinges were avoided because many cells must print reliably and thin unsupported hinge features become floppy.",
    "simulation-language cleanup": "add that the physical cell bends through compliant beams and distributed deformation, while the model is an abstraction.",
    "single-cell mechanism": "rewrite the first mechanism paragraph so the cell is the printed Sarrus-plus-PneuNet unit and the module is the 2 by 2 grouping.",
    "upper/lower leg asymmetry": "add upper thin structural legs and lower thicker pneumatic-channel legs create directional bias.",
    "cell figure": "label uncapped cell, capped cell, Sarrus linkage, PneuNet actuator, and cap role in Figure 1 caption.",
    "module figure": "label upper/lower leg pairs, one-module bending, two-module bending, and unactuated cross-section in Figure 2 caption.",
    "overhang figure": "add measurement endpoints, layer labels, actuation pattern, cell count, and row state to the overhang caption.",
    "cylindrical figures": "add that bending, grasping, peristalsis, and rolling are topology-level reconfigurations of the same module.",
    "stiffness paragraph bridge": "connect stiffness regimes to early axial resistance, then leg bending, then pneumatic-chamber compression.",
    "module-bias evidence": "write one sentence tying 80 psi side views, angle plot, and V-shaped annotations to repeatable convex bending.",
    "boundary-condition role": "add whether the boundary constraint helps generate the overhang or limits the achieved shape.",
    "expansion-ratio reality": "add that constrained modules may not reach ideal 2x expansion in the deformed overhang row.",
    "66-cell limit": "write that the boundary is a 33-cell row, two opposed layers, 66 total cells, about 1 cm overhang, and a proof-of-principle row.",
    "overhang requirement": "list curvature/thickness, available length, local expansion ratio, boundary constraint, and convex/concave bending in one overhang-requirement sentence.",
    "comparison paragraph": "replace citation-list comparison with direct capability differences against the closest systems.",
    "quantitative spine": "add the available numbers into Results: pressure, expansion, stiffness, bending angle, feature height, overhang length, load/object interaction, locomotion, repeats.",
    "Methods reproducibility": "add fabrication, materials, print orientation, pressure control, calibration, boundary conditions, and analysis-script details.",
    "manifold architecture": "describe one pressure manifold feeding many cells, with each cell controlled by a pulse-switched EPM valve.",
    "threshold question": "add a short design-rule calculation for what curvature, length, thickness, and expansion make overhang possible.",
    "node/mesh analysis": "add a node-following or mesh panel/table that compares planar state to overhang state.",
    "physical EPM switching test": "record attraction/repulsion switching and soft-magnet twisting for Alnico and NdFeB rods in a constrained guide.",
    "editorial package": "draft the cover-letter line, graphical claim, suggested reviewers, comparison paragraph, and data/code availability text."
  };
  return edits[title] || `${detail}`;
}

function paperActionItem(item, state = {}) {
  const title = String(item.title || "").trim();
  const detail = String(item.detail || title || "").replace(/\s+/g, " ").trim();
  const currentTitle = String(state.project?.manuscript || "").replace(/\s+/g, " ").trim();
  const actions = {
    "title": ["Set this title task aside if it feels fake. If you come back to it, write a title in your own words that names the physical cell and what it demonstrates.", "A forced title will sound fake; a title you own will make the paper easier to enter and defend."],
    "claim discipline": ["Search the abstract and Discussion for autonomy, closed-loop control, integrated valves, sensing, and full two-dimensional overhang claims; delete or soften anything not shown by the current prototypes.", "bounded claims make the paper stronger because the evidence and the words stop fighting each other."],
    "Results order": ["At the start of each Results subsection, make the first sentence a measured result or physical behavior, not a tour of what was built.", "readers should hit evidence first, then understand the build as the reason the evidence exists."],
    "limitations paragraph": ["In Discussion, add one direct limitations sentence naming external pressure, tubing, manual assembly, scale, speed, leakage, limited row overhang, no closed-loop control, and no integrated EPM valve yet.", "naming limits makes the real contribution more trustworthy, not weaker."],
    "novelty sentence": ["Near the end of the Introduction, add the sentence one printed pneumatic unit is reused for both morphing surfaces and reconfigurable soft robot bodies.", "this gives the reader the paper's difference in one place."],
    "abstract arc": ["Rewrite the abstract in five beats: problem, approach, strongest real result, main limitation, and bounded claim.", "a clear abstract keeps the paper from reading like a project tour."],
    "avoid water analogy drift": ["In the overhang paragraph, keep only the material-deformation comparison; delete any sentence where the water analogy carries evidence instead of the prototype.", "the prototype has to prove the claim, not the metaphor."],
    "flexural-joint wording": ["Search for flexural hinge language; replace it with compliant-linkage wording that says the Sarrus legs bend as beams under inflation.", "this keeps the mechanism physically honest."],
    "cell/module split": ["Search for cell, module, array, layer, and topology; make cell mean one printed Sarrus-plus-PneuNet unit and module mean the 2 by 2 pneumatic grouping.", "readers cannot follow the mechanism if the part names move around."],
    "overhang endpoint definition": ["In the overhang text, caption, and figure annotation, name the two endpoints used for the approximately 1 cm overhang measurement.", "the overhang claim becomes checkable instead of vibes-based."],
    "overhang reference lines": ["Add a bracket or two vertical dashed lines on the overhang figure at the measurement endpoints.", "the figure should show the measurement without forcing the reader into the paragraph first."],
    "large readable labels": ["Increase angle markers, pressure labels, reference lines, and panel letters until they stay readable at printed caption scale.", "unreadable labels make good evidence look unfinished."],
    "one claim per figure": ["For each main figure caption, write one sentence that says the single claim the figure proves; delete panels or caption phrases that do not support that claim.", "each figure gets easier to defend when it has one job."],
    "source consistency": ["Check every caption number against the exported figures: pressure, expansion ratio, cell count, module count, angle, overhang length, and topology size.", "one wrong number can make the whole results section feel shaky."],
    "do not abandon pneumatics": ["In the EPM Discussion, keep air as the proven actuation platform and frame EPMs first as valve/manifold control for pneumatic cells.", "the paper should build from what worked, not jump to an unproven replacement."],
    "direct magnetic actuation boundary": ["If direct EPM actuation stays in the Discussion, mark it as future work that still needs range, force, scale, and heating data.", "this keeps speculation from looking like a demonstrated result."],
    "pulse circuit note": ["Describe the EPM as pulse-switched between stable states; remove wording that makes it sound continuously powered like a solenoid.", "the control idea only makes sense if the energy/state behavior is accurate."],
    "student overlap": ["Add a note only if it becomes a real cited design input: magnetic-soft-actuator student connection and split-magnet EPM concept.", "this preserves useful context without adding loose name-dropping."],
    "print-reliability hinge note": ["Add one Methods or Discussion sentence explaining that notch-like hinges were avoided because many cells must print reliably and thin unsupported hinge features become floppy or unreliable.", "it turns a design choice into engineering logic instead of an unexplained omission."],
    "simulation-language cleanup": ["Where the paper mentions ideal rigid-link or flexible-joint models, add one sentence saying the physical cell bends through compliant beams and distributed deformation.", "the model stays useful without pretending it is the exact physical cell."],
    "single-cell mechanism": ["In the first cell-mechanism paragraph, separate the cell from the module: cell equals monolithic Sarrus-linkage-plus-PneuNet unit; module equals 2 by 2 pneumatic grouping.", "the reader needs the basic unit before the larger robot arguments work."],
    "upper/lower leg asymmetry": ["In the module-bending paragraph, say the upper thin structural legs and lower thicker pneumatic-channel legs create directional bias; reuse upright-V and inverted-V wording from the figure.", "it connects what the reader sees to why the module bends."],
    "cell figure": ["In Figure 1 caption, explicitly label uncapped cell, capped cell, Sarrus linkage, PneuNet actuator, and cap role without describing module behavior.", "Figure 1 should teach the cell, not blur into the rest of the paper."],
    "module figure": ["In Figure 2 caption, make the directional-bias mechanism explicit by naming upper/lower leg pairs, single-module and two-module bending angles, and unactuated cross-section.", "the module figure should prove how expansion becomes bending."],
    "overhang figure": ["In the overhang figure/caption, add measurement references, layer labels, actuation pattern, cell count, and row state so the 1 cm claim can be checked visually.", "the strongest geometry claim should be readable directly from the figure."],
    "cylindrical figures": ["In bending, grasping, peristalsis, and rolling captions, say these are topology-level reconfigurations of the same module, not a separate actuator family.", "it makes the robot examples support one system claim instead of looking like separate demos."],
    "stiffness paragraph bridge": ["In the stiffness paragraph, connect the regimes to beam bending: early axial resistance, low-stiffness leg bending, then high-stiffness pneumatic-chamber compression.", "the mechanics section should explain the same physical story as the figures."],
    "module-bias evidence": ["Tie the 80 psi side views, angle plot, and V-shaped leg-pair annotations to one claim: asymmetric connection geometry converts expansion into repeatable convex bending.", "it turns several panels into one mechanism argument."],
    "boundary-condition role": ["In the overhang caption or paragraph, state whether the boundary helps or limits the overhang instead of leaving the constraint implicit.", "boundary conditions decide what the prototype actually proves."],
    "expansion-ratio reality": ["In the overhang section, say constrained modules may not reach ideal 2x expansion and connect leakage, actuation strength, and compression to the achieved shape.", "it prevents an ideal number from overstating the deformed structure."],
    "66-cell limit": ["Add one boundary sentence saying this is a 33-cell row, two opposed layers, 66 total cells, about 1 cm overhang, and a proof-of-principle row rather than a full two-dimensional overhang surface.", "it makes the result impressive without pretending it is larger than it is."],
    "overhang requirement": ["Write the overhang requirement as physical variables: curvature relative to thickness, available length, local expansion ratio, boundary constraint, and convex/concave bending ability.", "the overhang becomes a design condition, not just a picture."],
    "comparison paragraph": ["In Introduction or Discussion, compare the closest prior systems by direct capability differences instead of citation lists alone.", "readers need to know what this system can do that nearby work cannot."],
    "quantitative spine": ["Make one pass through Results and add the hard-number chain where available: pressure, expansion ratio, stiffness regimes, bending angles, feature height, overhang length, load/object interaction, locomotion, repeats.", "numbers give the paper a backbone."],
    "Methods reproducibility": ["In Methods, add enough audit detail for fabrication, materials, print orientation, pressure control, measurement calibration, boundary conditions, and analysis scripts.", "reproducible methods make the results easier to trust."],
    "manifold architecture": ["Sketch or describe one pressure manifold feeding many cells, with each cell controlled by a small pulse-switched EPM valve.", "it turns the EPM idea into a plausible system architecture."],
    "threshold question": ["Add a short design-rule paragraph or calculation that states what curvature, length, thickness, and expansion combination makes an overhang possible.", "this answers the reader's obvious physical question before they get stuck."],
    "node/mesh analysis": ["Create a simple node-following or mesh analysis from planar state to overhang state so stretch, local bend, and length demand are visible.", "the geometry argument becomes inspectable instead of verbal."],
    "physical EPM switching test": ["Run the minimal EPM test: Alnico and NdFeB rods in a tube or constrained guide; record attraction/repulsion switching and whether the soft magnet twists.", "one small test separates a real actuation path from a cool idea."],
    "editorial package": ["Prepare the Science submission package: cover-letter line, graphical claim, suggested reviewers, competing-work comparison, and data/code availability.", "this is only useful after the paper itself is coherent, so it belongs at the end."]
  };
  const action = actions[title] || [detail, "this turns a source note into one visible paper move."];
  return { action: action[0], edit: paperEditText(title, currentTitle, detail), why: action[1] };
}

function oneLayerTaskText(item = {}) {
  return [item.action, item.edit, item.why]
    .map((part) => String(part || "").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((part) => {
      const sentence = part.replace(/[.!?]*$/, "");
      return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}.`;
    })
    .join(" ");
}

function paperChangeItems(state = {}, diff = {}) {
  const sections = Array.isArray(state.taskSections) ? state.taskSections : [];
  return sections.flatMap((section) => Array.isArray(section.items) ? section.items : [])
    .map((item, originalIndex) => {
      const base = {
        key: taskKey(item),
        title: String(item.title || "").trim(),
        ...paperActionItem(item, state),
        rank: paperEaseRank(item, originalIndex),
        originalIndex
      };
      return { ...base, addressed: possibleAddressedForItem(base, diff) };
    })
    .filter((item) => item.action)
    .sort((left, right) => left.rank - right.rank || left.originalIndex - right.originalIndex)
    .map((item) => ({ key: item.key, title: item.title, action: item.action, edit: item.edit, why: item.why, rank: item.rank, originalIndex: item.originalIndex, addressed: item.addressed }))
    .filter(Boolean);
}

function renderPaperMeta(state) {
  const paperLine = document.getElementById("paperLine");
  const latest = latestSnapshot(state);
  const changes = paperChangeItems(state).length;
  if (!latest) {
    paperLine.textContent = `${number(changes)} changes / no saved snapshot`;
    return;
  }
  paperLine.textContent = `${number(latest.wordCount)} words / latest ${formatDate(latest.date)} / ${number(changes)} changes`;
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

function renderPaperVersions(state, events = [], historyDiffs = []) {
  const target = document.getElementById("paperVersionList");
  const line = document.getElementById("versionLine");
  const historyDiffsById = new Map(historyDiffs.map((diff) => [diff.snapshotId, diff]));
  const records = [
    ...snapshotVersionRecords(state, historyDiffs),
    ...emailVersionRecords(events, historyDiffsById)
  ].sort((left, right) => {
    if (left.kind === "snapshot" && right.kind === "snapshot") {
      return Number(right.versionIndex || 0) - Number(left.versionIndex || 0);
    }
    return new Date(right.sortAt || 0).getTime() - new Date(left.sortAt || 0).getTime();
  });
  target.textContent = "";
  if (line) line.textContent = `${number(records.length)} versions / newest first`;
  if (!records.length) {
    target.append(el("li", { class: "paper-version-row" }, [
      el("span", { class: "paper-version-number" }, [document.createTextNode("0")]),
      el("p", { class: "paper-version-description" }, [document.createTextNode("No Paper snapshots or sent-email versions yet.")])
    ]));
    return;
  }
  records.slice(0, 80).forEach((record, index) => {
    target.append(el("li", { class: `paper-version-row is-${record.kind}` }, [
      el("span", { class: "paper-version-number" }, [document.createTextNode(String(index + 1))]),
      el("p", { class: "paper-version-description" }, [document.createTextNode(record.text)])
    ]));
  });
}

function makePaperListButton(text, className, ariaLabel, onClick) {
  const button = el("button", {
    type: "button",
    class: `paper-change-side-button ${className}`.trim(),
    "aria-label": ariaLabel
  }, [document.createTextNode(text)]);
  button.addEventListener("click", onClick);
  return button;
}

function renderPaperList(state, diff = {}) {
  const target = document.getElementById("paperChangeList");
  const setAsideKeys = readSetAsideKeys();
  const doneKeys = readApprovedDoneKeys();
  const keepOpenKeys = readKeepOpenKeys();
  const openItems = paperChangeItems(state, diff).filter((item) => !doneKeys.has(item.key));
  const reviewKeys = new Set(openItems
    .filter((item) => item.addressed && !keepOpenKeys.has(item.key) && !setAsideKeys.has(item.key))
    .sort((left, right) => right.addressed.score - left.addressed.score || left.rank - right.rank)
    .slice(0, 2)
    .map((item) => item.key));
  const items = openItems
    .sort((left, right) => {
      const leftReview = reviewKeys.has(left.key) ? 0 : 1;
      const rightReview = reviewKeys.has(right.key) ? 0 : 1;
      const leftAside = setAsideKeys.has(left.key) ? 1 : 0;
      const rightAside = setAsideKeys.has(right.key) ? 1 : 0;
      return leftReview - rightReview || leftAside - rightAside || left.rank - right.rank || left.originalIndex - right.originalIndex;
    });
  target.textContent = "";
  if (!items.length) {
    target.append(el("li", { class: "paper-change-row" }, [
      el("span", { class: "paper-change-number" }, [document.createTextNode("0")]),
      el("p", { class: "paper-change-description" }, [document.createTextNode("No open Paper changes. Approved done items are only hidden in this browser.")])
    ]));
    return;
  }
  items.forEach((item, index) => {
    const isSetAside = setAsideKeys.has(item.key);
    const isReview = reviewKeys.has(item.key);
    const actions = el("div", { class: "paper-change-actions" });
    if (isReview) {
      actions.append(
        makePaperListButton("done", "is-done", "approve task as done", () => {
          const nextDone = readApprovedDoneKeys();
          const nextKeep = readKeepOpenKeys();
          const nextAside = readSetAsideKeys();
          nextDone.add(item.key);
          nextKeep.delete(item.key);
          nextAside.delete(item.key);
          writeApprovedDoneKeys(nextDone);
          writeKeepOpenKeys(nextKeep);
          writeSetAsideKeys(nextAside);
          renderPaperList(state, diff);
        }),
        makePaperListButton("keep", "is-keep", "keep task open", () => {
          const nextKeep = readKeepOpenKeys();
          nextKeep.add(item.key);
          writeKeepOpenKeys(nextKeep);
          renderPaperList(state, diff);
        })
      );
    }
    actions.append(makePaperListButton(isSetAside ? "bring back" : "set aside", isSetAside ? "is-set-aside" : "", isSetAside ? "bring task back" : "set task aside", () => {
      const nextKeys = readSetAsideKeys();
      if (nextKeys.has(item.key)) nextKeys.delete(item.key);
      else nextKeys.add(item.key);
      writeSetAsideKeys(nextKeys);
      renderPaperList(state, diff);
    }));
    const text = oneLayerTaskText(item);
    target.append(el("li", { class: `paper-change-row${isSetAside ? " is-set-aside" : ""}${isReview ? " is-review" : ""}` }, [
      el("span", { class: "paper-change-number" }, [document.createTextNode(String(index + 1))]),
      el("p", { class: "paper-change-description" }, [document.createTextNode(text)]),
      actions
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
        el("p", { class: "event-source" }, [document.createTextNode(event.sourceSummary || "manuscript work")])
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
    const [health, eventsData, paperData, diffData, historyDiffData] = await Promise.all([
      fetchWithTimeout(apiUrl("/api/slayy/health"), { cache: "no-store" }).then((response) => response.json()),
      api("/api/slayy/events"),
      api("/api/slayy/paper-state"),
      api("/api/slayy/paper-diff").catch(() => ({ diff: {} })),
      api("/api/slayy/paper-history-diffs").catch(() => ({ diffs: [] }))
    ]);
    const paperDiff = diffData.diff || {};
    const paperHistoryDiffs = Array.isArray(historyDiffData.diffs) ? historyDiffData.diffs : [];
    healthLine.textContent = `${health.events || 0} emails / ${health.pending || 0} pending / watcher ${health.autoWatch ? "on" : "manual"}`;
    renderEvents(eventsData);
    renderPaperMeta(paperData.state || {});
    renderPaperGraph(paperData.state || {});
    renderPaperVersions(paperData.state || {}, eventsData.events || [], paperHistoryDiffs);
    renderPaperList(paperData.state || {}, paperDiff);
  } catch (error) {
    healthLine.textContent = error.message || "slayy unavailable";
    document.getElementById("paperLine").textContent = "paper unavailable";
    const versionLine = document.getElementById("versionLine");
    if (versionLine) versionLine.textContent = "paper unavailable";
    renderPaperGraph({ daily: [] });
    renderPaperVersions({}, []);
    renderPaperList({ taskSections: [] }, {});
  }
}

main();
