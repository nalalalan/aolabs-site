const statePaths = window.location.pathname.startsWith("/paper/")
  ? ["./state.json"]
  : ["/api/state", "./state.json"];

async function loadState() {
  for (const url of statePaths) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (response.ok) {
        const state = await response.json();
        if (window.location.pathname.startsWith("/paper/")) state.staticFallback = true;
        return state;
      }
    } catch {
      // Try the next route.
    }
  }
  throw new Error("state unavailable");
}

function formatDate(date) {
  const parsed = new Date(`${date}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(parsed);
}

function number(value) {
  return new Intl.NumberFormat("en-US").format(Number(value || 0));
}

function dailyFromSnapshots(snapshots = []) {
  const byDate = new Map();
  for (const snapshot of snapshots) {
    const date = snapshot.date || String(snapshot.capturedAt || "").slice(0, 10);
    if (!date) continue;
    const existing = byDate.get(date) || { date, addedWords: 0, deletedWords: 0, netWords: 0, wordCount: 0, snapshots: 0 };
    existing.addedWords += Number(snapshot.addedWords || 0);
    existing.deletedWords += Number(snapshot.deletedWords || 0);
    existing.netWords += Number(snapshot.netWords || 0);
    existing.wordCount = Number(snapshot.wordCount || existing.wordCount || 0);
    existing.snapshots += 1;
    byDate.set(date, existing);
  }
  return Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));
}

function el(name, attrs = {}, children = []) {
  const node = document.createElement(name);
  for (const [key, value] of Object.entries(attrs)) {
    if (key === "class") node.className = value;
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

function renderGraph(state) {
  const graph = document.getElementById("wordGraph");
  const daily = Array.isArray(state.daily) && state.daily.length ? state.daily : dailyFromSnapshots(state.snapshots);
  graph.textContent = "";
  graph.setAttribute("viewBox", "0 0 920 280");

  const margin = { left: 54, right: 24, top: 24, bottom: 40 };
  const width = 920 - margin.left - margin.right;
  const height = 280 - margin.top - margin.bottom;
  const centerY = margin.top + height / 2;
  const maxDelta = Math.max(10, ...daily.flatMap((day) => [Math.abs(day.addedWords || 0), Math.abs(day.deletedWords || 0)]));
  const scale = (height / 2 - 28) / maxDelta;

  graph.append(
    svg("line", { class: "axis-line", x1: margin.left, y1: centerY, x2: margin.left + width, y2: centerY }),
    svg("line", { class: "grid-line", x1: margin.left, y1: margin.top, x2: margin.left + width, y2: margin.top }),
    svg("line", { class: "grid-line", x1: margin.left, y1: margin.top + height, x2: margin.left + width, y2: margin.top + height })
  );

  if (!daily.length) {
    graph.append(svg("text", { class: "empty-label", x: margin.left, y: centerY - 18 }, [document.createTextNode("no snapshots yet")]));
    return;
  }

  const slot = width / Math.max(daily.length, 1);
  const barWidth = daily.length === 1 ? 72 : Math.min(42, Math.max(16, slot * 0.22));

  daily.forEach((day, index) => {
    const xCenter = margin.left + slot * index + slot / 2;
    const added = Number(day.addedWords || 0);
    const deleted = Number(day.deletedWords || 0);
    const addedHeight = Math.max(added * scale, added > 0 ? 2 : 0);
    const deletedHeight = Math.max(deleted * scale, deleted > 0 ? 2 : 0);

    if (!added && !deleted) {
      graph.append(
        svg("circle", { cx: xCenter, cy: centerY, r: 4, fill: "var(--paper)" }),
        svg("text", { class: "bar-label", x: xCenter, y: centerY - 12, "text-anchor": "middle" }, [document.createTextNode("0")]),
        svg("text", { class: "tick-label", x: xCenter, y: 266, "text-anchor": "middle" }, [document.createTextNode(formatDate(day.date))])
      );
      return;
    }

    graph.append(
      svg("rect", {
        x: xCenter - barWidth - 3,
        y: centerY - addedHeight,
        width: barWidth,
        height: addedHeight,
        class: "bar-added"
      }),
      svg("rect", {
        x: xCenter + 3,
        y: centerY,
        width: barWidth,
        height: deletedHeight,
        class: "bar-deleted"
      }),
      svg("text", { class: "bar-label added", x: xCenter - barWidth / 2 - 3, y: centerY - addedHeight - 8, "text-anchor": "middle" }, [document.createTextNode(added ? `+${number(added)}` : "0")]),
      svg("text", { class: "bar-label deleted", x: xCenter + barWidth / 2 + 3, y: centerY + deletedHeight + 18, "text-anchor": "middle" }, [document.createTextNode(deleted ? `-${number(deleted)}` : "0")]),
      svg("text", { class: "tick-label", x: xCenter, y: 266, "text-anchor": "middle" }, [document.createTextNode(formatDate(day.date))])
    );
  });
}

function renderTasks(state) {
  const target = document.getElementById("taskList");
  target.textContent = "";
  const sections = Array.isArray(state.taskSections) ? state.taskSections : [];
  for (const section of sections) {
    const rows = (section.items || []).map((item) => el("div", { class: "task-row" }, [
      el("p", { class: "task-title" }, [document.createTextNode(item.title || "")]),
      el("p", { class: "task-detail" }, [document.createTextNode(item.detail || "")])
    ]));
    target.append(el("section", { class: "task-section" }, [
      el("h3", {}, [document.createTextNode(section.title || "paper section")]),
      el("div", { class: "task-rows" }, rows)
    ]));
  }
}

function latestSnapshot(state) {
  const snapshots = Array.isArray(state.snapshots) ? state.snapshots : [];
  return snapshots[snapshots.length - 1] || null;
}

function refreshSummary(state = {}) {
  const refresh = state.refresh || {};
  if (state.staticFallback && !refresh.configured) return "static fallback";
  if (!refresh.configured) return "server refresh: token missing";
  if (refresh.status === "failed") return `server refresh failed: ${refresh.lastMessage || "check source"}`;
  if (refresh.status === "running") return "server refresh running";
  if (refresh.status === "captured") return "server refresh captured";
  if (refresh.status === "unchanged") return "server refresh current";
  return `server refresh every ${number(refresh.intervalMinutes || 60)} min`;
}

function renderMeta(state) {
  const latest = latestSnapshot(state);
  const snapshotCount = Array.isArray(state.snapshots) ? state.snapshots.length : 0;
  const sourceLine = document.getElementById("sourceLine");
  const snapshotSummary = document.getElementById("snapshotSummary");
  const queueMeta = document.getElementById("queueMeta");

  if (latest) {
    sourceLine.textContent = `${number(latest.wordCount)} words · latest ${formatDate(latest.date)} · ${latest.source}`;
    snapshotSummary.textContent = `${number(snapshotCount)} snapshots · ${refreshSummary(state)}`;
  } else {
    sourceLine.textContent = "no saved manuscript snapshot";
    snapshotSummary.textContent = `0 snapshots · ${refreshSummary(state)}`;
  }
  queueMeta.textContent = `${number((state.taskSections || []).reduce((total, section) => total + (section.items || []).length, 0))} changes`;
}

async function main() {
  try {
    const state = await loadState();
    renderMeta(state);
    renderGraph(state);
    renderTasks(state);
  } catch (error) {
    document.getElementById("sourceLine").textContent = "state unavailable";
    document.getElementById("taskList").append(el("p", { class: "task-detail" }, [document.createTextNode(String(error.message || error))]));
    renderGraph({ daily: [] });
  }
}

main();
