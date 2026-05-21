const state = {
  bpm: 96,
  beatsPerMeasure: 4,
  beatIndex: 0,
  nextBeatIndex: 0,
  isRunning: false,
  nextNoteTime: 0,
  schedulerTimer: null,
  audioContext: null,
  tapTimes: [],
  voice: "soft",
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
  beatLabel: document.querySelector("#beatLabel"),
  meterArm: document.querySelector("#meterArm"),
  statusText: document.querySelector("#statusText"),
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

function setBeat(index) {
  state.beatIndex = index % state.beatsPerMeasure;
  renderBeatDots();
  elements.beatLabel.textContent = state.isRunning
    ? `${state.beatIndex + 1} / ${state.beatsPerMeasure}`
    : "ready";
  const swing = state.beatIndex % 2 === 0 ? -21 : 21;
  elements.meterArm.style.transform = `translateX(-50%) rotate(${swing}deg)`;
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

function makeNoiseBuffer(audioContext, duration) {
  const sampleCount = Math.max(1, Math.floor(audioContext.sampleRate * duration));
  const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
  const channel = buffer.getChannelData(0);
  for (let index = 0; index < sampleCount; index += 1) {
    channel[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
  }
  return buffer;
}

function playMeow(time, accented) {
  const audioContext = state.audioContext;
  const profile = {
    soft: { start: 480, peak: 760, end: 390, gain: .34, length: .22 },
    bright: { start: 560, peak: 920, end: 430, gain: .38, length: .2 },
    tiny: { start: 720, peak: 1040, end: 620, gain: .25, length: .16 },
  }[state.voice] || { start: 480, peak: 760, end: 390, gain: .34, length: .22 };

  const length = accented ? profile.length + .045 : profile.length;
  const voiceGain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const oscillator = audioContext.createOscillator();
  const secondOscillator = audioContext.createOscillator();

  filter.type = "bandpass";
  filter.frequency.setValueAtTime(accented ? 1180 : 980, time);
  filter.Q.setValueAtTime(accented ? 7 : 5.5, time);

  oscillator.type = "sawtooth";
  oscillator.frequency.setValueAtTime(profile.start * (accented ? 1.08 : 1), time);
  oscillator.frequency.exponentialRampToValueAtTime(profile.peak * (accented ? 1.1 : 1), time + length * .32);
  oscillator.frequency.exponentialRampToValueAtTime(profile.end, time + length);

  secondOscillator.type = "triangle";
  secondOscillator.frequency.setValueAtTime(profile.start * .5, time);
  secondOscillator.frequency.exponentialRampToValueAtTime(profile.end * .58, time + length);

  voiceGain.gain.setValueAtTime(0.0001, time);
  voiceGain.gain.exponentialRampToValueAtTime(profile.gain * (accented ? 1.25 : 1), time + .018);
  voiceGain.gain.exponentialRampToValueAtTime(0.0001, time + length);

  oscillator.connect(filter);
  secondOscillator.connect(filter);
  filter.connect(voiceGain);
  voiceGain.connect(audioContext.destination);

  const noise = audioContext.createBufferSource();
  const noiseGain = audioContext.createGain();
  const noiseFilter = audioContext.createBiquadFilter();
  noise.buffer = makeNoiseBuffer(audioContext, .055);
  noiseFilter.type = "highpass";
  noiseFilter.frequency.setValueAtTime(1300, time);
  noiseGain.gain.setValueAtTime(accented ? .07 : .045, time);
  noiseGain.gain.exponentialRampToValueAtTime(.0001, time + .055);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(audioContext.destination);

  oscillator.start(time);
  secondOscillator.start(time);
  noise.start(time);
  oscillator.stop(time + length + .02);
  secondOscillator.stop(time + length + .02);
  noise.stop(time + .065);
}

function scheduleBeat(beatNumber, time) {
  const beatIndex = beatNumber % state.beatsPerMeasure;
  const accented = beatIndex === 0;
  playMeow(time, accented);

  const delay = Math.max(0, (time - state.audioContext.currentTime) * 1000);
  window.setTimeout(() => setBeat(beatIndex), delay);
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
  state.isRunning = true;
  state.beatIndex = 0;
  state.nextBeatIndex = 0;
  state.nextNoteTime = state.audioContext.currentTime + .045;
  elements.toggleButton.textContent = "stop";
  elements.toggleButton.setAttribute("aria-pressed", "true");
  elements.statusText.textContent = "meow is running";
  document.body.classList.add("is-running");
  scheduler();
  state.schedulerTimer = window.setInterval(scheduler, lookaheadMs);
}

function stop() {
  state.isRunning = false;
  window.clearInterval(state.schedulerTimer);
  state.schedulerTimer = null;
  elements.toggleButton.textContent = "start";
  elements.toggleButton.setAttribute("aria-pressed", "false");
  elements.statusText.textContent = "paused";
  document.body.classList.remove("is-running");
  setBeat(0);
  state.nextBeatIndex = 0;
  elements.meterArm.style.transform = "translateX(-50%) rotate(0deg)";
}

function toggle() {
  if (state.isRunning) {
    stop();
    return;
  }
  start().catch(() => {
    elements.statusText.textContent = "audio unavailable";
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
  elements.statusText.textContent = "tempo set from taps";
}

elements.toggleButton.addEventListener("click", toggle);
elements.tapButton.addEventListener("click", tapTempo);

elements.bpmRange.addEventListener("input", (event) => {
  setBpm(event.target.value);
});

elements.bpmInput.addEventListener("input", (event) => {
  setBpm(event.target.value);
});

document.querySelectorAll(".nudge").forEach((button) => {
  button.addEventListener("click", () => {
    setBpm(state.bpm + Number(button.dataset.nudge));
  });
});

document.querySelectorAll('input[name="beats"]').forEach((input) => {
  input.addEventListener("change", () => {
    state.beatsPerMeasure = Number(input.value);
    state.nextBeatIndex = 0;
    setBeat(0);
  });
});

document.querySelectorAll('input[name="voice"]').forEach((input) => {
  input.addEventListener("change", () => {
    state.voice = input.value;
  });
});

setBpm(state.bpm);
setBeat(0);

window.Meowtronome = {
  getState: () => ({
    bpm: state.bpm,
    beatsPerMeasure: state.beatsPerMeasure,
    isRunning: state.isRunning,
    voice: state.voice,
  }),
};
