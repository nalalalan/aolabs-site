const meowSources = [
  { url: "./assets/meow-warm.mp3", type: "audio/mpeg" },
  { url: "./assets/meow-warm.ogg", type: "audio/ogg" },
];

const meowSourceUrl = (() => {
  const audio = document.createElement("audio");
  const source = meowSources.find((candidate) => audio.canPlayType(candidate.type));
  return (source || meowSources[0]).url;
})();

const state = {
  bpm: 96,
  beatsPerMeasure: 4,
  beatIndex: 0,
  nextBeatIndex: 0,
  isRunning: false,
  nextNoteTime: 0,
  schedulerTimer: null,
  beatPulseTimer: null,
  audioContext: null,
  meowBuffer: null,
  meowBytesPromise: null,
  tapTimes: [],
};

const lookaheadMs = 25;
const scheduleAheadSeconds = 0.12;

const elements = {
  bpmValue: document.querySelector("#bpmValue"),
  bpmRange: document.querySelector("#bpmRange"),
  bpmInput: document.querySelector("#bpmInput"),
  toggleButton: document.querySelector("#toggleButton"),
  tapButton: document.querySelector("#tapButton"),
  beatDots: document.querySelector("#beatDots"),
  catDancer: document.querySelector("#catDancer"),
  catFramePrevious: document.querySelector("#catFramePrevious"),
  catFrameCurrent: document.querySelector("#catFrameCurrent"),
  statusText: document.querySelector("#statusText"),
};

const posePhrases = {
  2: [2, 7],
  3: [1, 3, 6],
  4: [1, 2, 4, 7],
};

function clampBpm(value) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return state.bpm;
  return Math.min(220, Math.max(40, number));
}

function secondsPerBeat() {
  return 60 / state.bpm;
}

function setBpm(value) {
  state.bpm = clampBpm(value);
  elements.bpmValue.textContent = String(state.bpm);
  elements.bpmRange.value = String(state.bpm);
  elements.bpmInput.value = String(state.bpm);
  document.documentElement.style.setProperty(
    "--motion-ms",
    `${Math.round(Math.min(720, Math.max(260, secondsPerBeat() * 920)))}ms`
  );
}

function renderBeatDots() {
  elements.beatDots.style.setProperty("--beats", state.beatsPerMeasure);
  elements.beatDots.replaceChildren(
    ...Array.from({ length: state.beatsPerMeasure }, (_, index) => {
      const dot = document.createElement("span");
      dot.className = "beat-dot";
      if (index === state.beatIndex) dot.classList.add("active");
      return dot;
    })
  );
}

function cueDanceMotion(beatNumber) {
  const motionIndex = beatNumber % state.beatsPerMeasure;
  const phrase = posePhrases[state.beatsPerMeasure] || posePhrases[4];
  const nextPose = phrase[motionIndex];
  const previousPose = Number(elements.catDancer.dataset.pose || 1);

  elements.catDancer.dataset.motion = String(motionIndex + 1);
  elements.catDancer.dataset.pose = String(nextPose);
  elements.catDancer.classList.remove("motion-1", "motion-2", "motion-3", "motion-4");
  elements.catDancer.classList.add(`motion-${motionIndex + 1}`);
  elements.catFramePrevious.className = `cat-frame previous pose-${previousPose} visible`;
  elements.catFrameCurrent.className = `cat-frame current pose-${nextPose}`;
  window.requestAnimationFrame(() => {
    elements.catFramePrevious.classList.remove("visible");
  });
}

function pulseCat(beatNumber) {
  cueDanceMotion(beatNumber);
  document.body.classList.add("is-beating");
  elements.catDancer.style.setProperty("--dance-dir", beatNumber % 2 === 0 ? "-1" : "1");
  window.clearTimeout(state.beatPulseTimer);
  state.beatPulseTimer = window.setTimeout(() => {
    document.body.classList.remove("is-beating");
  }, Math.min(260, Math.max(140, secondsPerBeat() * 260)));
}

function setBeat(index, beatNumber = index) {
  state.beatIndex = index % state.beatsPerMeasure;
  renderBeatDots();
  if (state.isRunning) {
    pulseCat(beatNumber);
  } else {
    cueDanceMotion(beatNumber);
  }
}

function ensureAudio() {
  if (!state.audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContextClass();
  }
  if (state.audioContext.state === "suspended") {
    return state.audioContext.resume();
  }
  return Promise.resolve();
}

function fetchMeowBytes() {
  if (!state.meowBytesPromise) {
    state.meowBytesPromise = fetch(meowSourceUrl).then((response) => {
      if (!response.ok) throw new Error("meow sample unavailable");
      return response.arrayBuffer();
    });
  }
  return state.meowBytesPromise;
}

function decodeAudioData(audioContext, arrayBuffer) {
  return new Promise((resolve, reject) => {
    const promise = audioContext.decodeAudioData(arrayBuffer, resolve, reject);
    if (promise && typeof promise.then === "function") {
      promise.then(resolve, reject);
    }
  });
}

async function loadMeowSample() {
  if (state.meowBuffer) return state.meowBuffer;
  elements.statusText.textContent = "loading cat sound";
  const bytes = await fetchMeowBytes();
  state.meowBuffer = await decodeAudioData(state.audioContext, bytes.slice(0));
  elements.statusText.textContent = "real cat sound ready";
  return state.meowBuffer;
}

function playMeow(time, accented) {
  const audioContext = state.audioContext;
  if (!audioContext || !state.meowBuffer) return;

  const source = audioContext.createBufferSource();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const playbackRate = accented ? 0.96 : 1;
  const maxLength = Math.min(0.82, Math.max(0.34, secondsPerBeat() * 1.16));
  const playFor = Math.min(state.meowBuffer.duration / playbackRate, maxLength);

  source.buffer = state.meowBuffer;
  source.playbackRate.setValueAtTime(playbackRate, time);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(accented ? 4200 : 3900, time);
  filter.Q.setValueAtTime(0.28, time);

  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(accented ? 0.54 : 0.42, time + 0.026);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + playFor);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  source.start(time, 0);
  source.stop(time + playFor + 0.015);
}

function scheduleBeat(beatNumber, time) {
  const beatIndex = beatNumber % state.beatsPerMeasure;
  playMeow(time, beatIndex === 0);

  const delay = Math.max(0, (time - state.audioContext.currentTime) * 1000);
  window.setTimeout(() => setBeat(beatIndex, beatNumber), delay);
}

function scheduler() {
  while (state.nextNoteTime < state.audioContext.currentTime + scheduleAheadSeconds) {
    scheduleBeat(state.nextBeatIndex, state.nextNoteTime);
    state.nextBeatIndex = (state.nextBeatIndex + 1) % state.beatsPerMeasure;
    state.nextNoteTime += secondsPerBeat();
  }
}

async function start() {
  await ensureAudio();
  await loadMeowSample();
  state.isRunning = true;
  state.beatIndex = 0;
  state.nextBeatIndex = 0;
  state.nextNoteTime = state.audioContext.currentTime + 0.045;
  cueDanceMotion(0);
  elements.catDancer.dataset.motion = "1";
  elements.toggleButton.textContent = "stop";
  elements.toggleButton.setAttribute("aria-pressed", "true");
  elements.statusText.textContent = "meowing";
  document.body.classList.add("is-running");
  scheduler();
  state.schedulerTimer = window.setInterval(scheduler, lookaheadMs);
}

function stop() {
  state.isRunning = false;
  window.clearInterval(state.schedulerTimer);
  window.clearTimeout(state.beatPulseTimer);
  state.schedulerTimer = null;
  state.beatPulseTimer = null;
  elements.toggleButton.textContent = "start";
  elements.toggleButton.setAttribute("aria-pressed", "false");
  elements.statusText.textContent = "paused";
  document.body.classList.remove("is-running", "is-beating");
  setBeat(0);
  state.nextBeatIndex = 0;
}

function toggle() {
  if (state.isRunning) {
    stop();
    return;
  }
  start().catch(() => {
    elements.statusText.textContent = "cat sound unavailable";
  });
}

function tapTempo() {
  const now = performance.now();
  state.tapTimes = state.tapTimes.filter((time) => now - time < 2400);
  state.tapTimes.push(now);
  if (state.tapTimes.length < 2) {
    elements.statusText.textContent = "tap again";
    return;
  }

  const intervals = [];
  for (let index = 1; index < state.tapTimes.length; index += 1) {
    intervals.push(state.tapTimes[index] - state.tapTimes[index - 1]);
  }
  const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
  setBpm(Math.round(60000 / average));
  elements.statusText.textContent = "tempo set";
}

fetchMeowBytes().catch(() => {
  elements.statusText.textContent = "cat sound unavailable";
});

elements.toggleButton.addEventListener("click", toggle);
elements.tapButton.addEventListener("click", tapTempo);

elements.bpmRange.addEventListener("input", (event) => {
  setBpm(event.target.value);
});

elements.bpmInput.addEventListener("input", (event) => {
  setBpm(event.target.value);
});

document.querySelectorAll('input[name="beats"]').forEach((input) => {
  input.addEventListener("change", () => {
    state.beatsPerMeasure = Number(input.value);
    state.nextBeatIndex = 0;
    setBeat(0);
  });
});

setBpm(state.bpm);
setBeat(0);

window.Meowtronome = {
  getState: () => ({
    bpm: state.bpm,
    beatsPerMeasure: state.beatsPerMeasure,
    dancePhraseBeats: state.beatsPerMeasure,
    isRunning: state.isRunning,
    sampleLoaded: Boolean(state.meowBuffer),
    sampleUrl: meowSourceUrl,
  }),
};
