const API_BASE = window.SLAYY_API_BASE || "https://slayy-aolabs-io-production.up.railway.app";
const params = new URLSearchParams(window.location.search);
const access = params.get("access") || localStorage.getItem("slayy-access") || "";
if (access) localStorage.setItem("slayy-access", access);

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

async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  if (access) headers.set("x-slayy-access-token", access);
  const response = await fetchWithTimeout(apiUrl(path), { ...options, headers, cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `request failed ${response.status}`);
    error.data = data;
    throw error;
  }
  return data;
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

async function main() {
  const healthLine = document.getElementById("healthLine");
  const lockedPanel = document.getElementById("lockedPanel");
  const eventsTarget = document.getElementById("events");
  try {
    const health = await fetchWithTimeout(apiUrl("/api/slayy/health"), { cache: "no-store" }).then((response) => response.json());
    healthLine.textContent = `${health.events || 0} emails · ${health.pending || 0} pending · watcher ${health.autoWatch ? "on" : "manual"}`;
    const data = await api("/api/slayy/events");
    lockedPanel.hidden = true;
    eventsTarget.textContent = "";
    if (!data.events.length) {
      eventsTarget.append(el("p", { class: "empty" }, [document.createTextNode("no slayy emails yet")]));
      return;
    }
    data.events.forEach((event) => eventsTarget.append(renderEvent(event)));
  } catch (error) {
    if (error.data?.locked || /access token/i.test(error.message || "")) {
      healthLine.textContent = "archive locked";
      lockedPanel.hidden = false;
      eventsTarget.textContent = "";
      return;
    }
    healthLine.textContent = "slayy server unavailable";
    lockedPanel.hidden = false;
    eventsTarget.textContent = "";
  }
}

main();
