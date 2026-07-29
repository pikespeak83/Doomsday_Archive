const cache = new Map();
let enabled = true;

export function setSoundsEnabled(value) {
  enabled = value !== false;
}

export function playSound(name, volume = 0.5) {
  if (!enabled) return;
  try {
    let audio = cache.get(name);
    if (!audio) {
      audio = new Audio(`assets/sounds/${name}.ogg`);
      cache.set(name, audio);
    }
    audio.volume = volume;
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    // audio not available
  }
}
