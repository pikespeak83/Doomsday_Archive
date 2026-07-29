const cache = new Map();
let enabled = true;
let master = 1;

export function setSoundsEnabled(value) {
  enabled = value !== false;
}

export function setMasterVolume(value) {
  const v = Number(value);
  master = Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : 1;
}

export function playSound(name, volume = 0.5) {
  if (!enabled) return;
  try {
    let audio = cache.get(name);
    if (!audio) {
      audio = new Audio(`assets/sounds/${name}.ogg`);
      cache.set(name, audio);
    }
    audio.volume = Math.min(1, Math.max(0, volume * master));
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    // audio not available
  }
}
