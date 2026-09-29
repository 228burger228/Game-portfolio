// Pleasant, non-intrusive Web Audio sound effects + "67" Secret Hangar Meme Beat & Victory Fanfare

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('heli_sound_muted') === 'true';
    this.masterGain = null;
    this.memeBeatTimer = null;
    this.isPlaying67 = false;
    this.beatStep = 0;
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

  // Secret Sky Hangar "67" Meme Trap/Phonk Groove + Voice Line
  start67MemeBeat() {
    if (this.isPlaying67) return;
    this.isPlaying67 = true;
    this.resume();

    // Speak the meme phrase once using SpeechSynthesis if not muted
    if (!this.isMuted && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance("Шесть семь! Ты чё забыл здесь? Дай отдохнуть нормально!");
        utter.lang = 'ru-RU';
        utter.rate = 1.05;
        utter.pitch = 0.92;
        utter.volume = 0.85;
        window.speechSynthesis.speak(utter);
      } catch (e) {
        // Ignore speech errors
      }
    }

    this.beatStep = 0;
    const stepMs = 185; // ~162 BPM energetic 67 phonk/trap tempo

    // Melody pattern emphasizing the "6 - 7" two-note hook (D#5 -> E5 / F#5 -> G5)
    const hookNotes = [
      622.25, 659.25, 0, 622.25, 659.25, 0, 739.99, 659.25,
      622.25, 659.25, 0, 783.99, 739.99, 659.25, 587.33, 0
    ];
    const bassNotes = [
      77.78, 0, 77.78, 0, 82.41, 0, 92.50, 0,
      77.78, 0, 77.78, 82.41, 65.41, 0, 73.42, 0
    ];

    this.memeBeatTimer = setInterval(() => {
      if (this.isMuted || !this.ctx || !this.isPlaying67) return;
      const t = this.ctx.currentTime;
      const step = this.beatStep % 16;

      // 1. 808 Sub Bass Kick on bass steps
      const bassFreq = bassNotes[step];
      if (bassFreq > 0) {
        const sub = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        sub.type = 'sine';
        sub.frequency.setValueAtTime(bassFreq * 2.2, t);
        sub.frequency.exponentialRampToValueAtTime(bassFreq, t + 0.06);

        subGain.gain.setValueAtTime(0.22, t);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

        sub.connect(subGain);
        subGain.connect(this.masterGain);
        sub.start(t);
        sub.stop(t + 0.24);
      }

      // 2. "6 - 7" Phonk Bell / Synth Lead Hook
      const leadFreq = hookNotes[step];
      if (leadFreq > 0) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(leadFreq, t);

        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.11, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0005, t + 0.16);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.17);
      }

      // 3. Crisp Trap Hi-Hat tick on every step (accented on off-beats)
      const hatOsc = this.ctx.createOscillator();
      const hatGain = this.ctx.createGain();
      hatOsc.type = 'square';
      hatOsc.frequency.setValueAtTime(step % 2 === 0 ? 6400 : 8200, t);
      hatGain.gain.setValueAtTime(step % 4 === 2 ? 0.035 : 0.015, t);
      hatGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      hatOsc.connect(hatGain);
      hatGain.connect(this.masterGain);
      hatOsc.start(t);
      hatOsc.stop(t + 0.035);

      this.beatStep++;
    }, stepMs);
  }

  stop67MemeBeat() {
    this.isPlaying67 = false;
    if (this.memeBeatTimer) {
      clearInterval(this.memeBeatTimer);
      this.memeBeatTimer = null;
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
    return this.isMuted;
  }
}

export const sound = new SoundEngine();
