// Pleasant, non-intrusive Web Audio sound effects + "67" Secret Hangar Meme Beat & Victory Fanfare

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('heli_sound_muted') === 'true';
    this.masterGain = null;
    this.isPlaying67 = false;
    this.track67 = null;
    this.fadeInterval67 = null;
    this.maxPlayVolume67 = 0.15; // Тихая, комфортная громкость
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.28, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn("Web Audio not supported", e);
    }
  }

  resume() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateRotorSound() {}

  // Soft warm air swoosh when starting autopilot flight
  playTakeoff() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.32);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.08, t + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Pleasant ambient chord on landing (warm sine triad)
  playLanding() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [349.23, 440.0, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const startTime = t + idx * 0.055;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.07, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.75);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });
  }

  // Gentle crystal bell chime when collecting a star
  playStarCollect() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      const startTime = t + idx * 0.05;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.09, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.45);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  // Triumphant fanfare when all 10 checkpoints/stars are collected!
  playVictoryFanfare() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    // C5 -> E5 -> G5 -> C6 -> E6 -> G6 chordal celebration
    const sequence = [
      { f: 523.25, d: 0.0, len: 0.25 },
      { f: 659.25, d: 0.11, len: 0.25 },
      { f: 783.99, d: 0.22, len: 0.25 },
      { f: 1046.50, d: 0.34, len: 0.85 },
      { f: 1318.51, d: 0.46, len: 0.95 },
      { f: 1567.98, d: 0.58, len: 1.25 }
    ];
    sequence.forEach((note) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const start = t + note.d;
      osc.frequency.setValueAtTime(note.f, start);

      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.14, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.len);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(start);
      osc.stop(start + note.len + 0.05);
    });
  }

  // Secret Sky Hangar "67" Real Track: Gazan - 67 (Six Seven), max 20s with smooth fade-out & quiet volume
  start67MemeBeat() {
    if (this.isPlaying67) return;
    this.isPlaying67 = true;
    this.resume();

    if (this.fadeInterval67) {
      clearInterval(this.fadeInterval67);
      this.fadeInterval67 = null;
    }

    if (!this.track67) {
      this.track67 = new Audio('./assets/gazan-67.mp3');
      this.track67.preload = 'auto';
    }

    try {
      this.track67.currentTime = 0;
      this.track67.volume = 0;
      this.track67.muted = this.isMuted;
      const playPromise = this.track67.play();
      if (playPromise && typeof playPromise.catch === 'function') {
        playPromise.catch(() => {});
      }

      const startTime = performance.now();
      const maxDurationSec = 20.0; // Максимум 20 секунд проигрывания
      const fadeOutStartSec = 15.5; // Плавное затухание последние 4.5 секунды
      const fadeInEndSec = 1.0;

      this.fadeInterval67 = setInterval(() => {
        if (!this.isPlaying67 || !this.track67) {
          clearInterval(this.fadeInterval67);
          this.fadeInterval67 = null;
          return;
        }

        const elapsed = (performance.now() - startTime) / 1000;
        if (elapsed >= maxDurationSec) {
          this.track67.volume = 0;
          this.track67.pause();
          clearInterval(this.fadeInterval67);
          this.fadeInterval67 = null;
          return;
        }

        let targetVol = this.maxPlayVolume67; // 0.15 — потише и комфортно
        if (elapsed < fadeInEndSec) {
          targetVol = this.maxPlayVolume67 * (elapsed / fadeInEndSec);
        } else if (elapsed > fadeOutStartSec) {
          const fadeProgress = (elapsed - fadeOutStartSec) / (maxDurationSec - fadeOutStartSec);
          targetVol = this.maxPlayVolume67 * Math.max(0, 1 - fadeProgress);
        }

        this.track67.volume = this.isMuted ? 0 : Math.max(0, Math.min(this.maxPlayVolume67, targetVol));
      }, 60);
    } catch (e) {
      console.warn('Could not play Gazan 67 track', e);
    }
  }

  stop67MemeBeat() {
    this.isPlaying67 = false;
    if (this.fadeInterval67) {
      clearInterval(this.fadeInterval67);
      this.fadeInterval67 = null;
    }

    if (this.track67 && !this.track67.paused) {
      // Быстрое плавное затухание при вылете из ангара
      let currentVol = this.track67.volume;
      const fadeOut = setInterval(() => {
        if (this.isPlaying67 || !this.track67) {
          clearInterval(fadeOut);
          return;
        }
        currentVol -= 0.02;
        if (currentVol <= 0.005) {
          this.track67.volume = 0;
          this.track67.pause();
          clearInterval(fadeOut);
        } else {
          this.track67.volume = currentVol;
        }
      }, 45);
    }
  }

  // Subtle, soft UI tap
  playClick() {
    if (this.isMuted) return;
    this.resume();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(480, t + 0.035);

    gain.gain.setValueAtTime(0.05, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.045);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('heli_sound_muted', this.isMuted);

    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.28, t, 0.05);
    }
    if (this.track67) {
      this.track67.muted = this.isMuted;
      if (this.isMuted) this.track67.volume = 0;
    }
    return this.isMuted;
  }
}

export const sound = new SoundEngine();
