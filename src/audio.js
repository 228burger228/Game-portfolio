// Procedural Web Audio API Sound Generator for Helicopter & Interactive Elements

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = localStorage.getItem('heli_sound_muted') === 'true';
    this.rotorGain = null;
    this.rotorFilter = null;
    this.rotorOsc = null;
    this.chopperGain = null;
    this.chopperOsc = null;
    this.noiseNode = null;
    this.isPlayingRotor = false;
    this.masterGain = null;
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupRotorLoop();
    } catch (e) {
      console.warn("Web Audio not supported or failed to initialize", e);
    }
  }

  setupRotorLoop() {
    if (!this.ctx) return;

    // 1. Low engine drone oscillator
    this.rotorOsc = this.ctx.createOscillator();
    this.rotorOsc.type = 'sawtooth';
    this.rotorOsc.frequency.setValueAtTime(45, this.ctx.currentTime);

    // 2. Lowpass filter for muffled engine rumble
    this.rotorFilter = this.ctx.createBiquadFilter();
    this.rotorFilter.type = 'lowpass';
    this.rotorFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
    this.rotorFilter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // 3. Chopper rhythm generator (LFO modulating gain for "chup-chup-chup" blade chop)
    this.chopperOsc = this.ctx.createOscillator();
    this.chopperOsc.type = 'square';
    this.chopperOsc.frequency.setValueAtTime(14, this.ctx.currentTime); // 14 blade passes per second

    const chopperDepth = this.ctx.createGain();
    chopperDepth.gain.setValueAtTime(0.4, this.ctx.currentTime);

    this.chopperGain = this.ctx.createGain();
    this.chopperGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

    this.chopperOsc.connect(chopperDepth);
    chopperDepth.connect(this.chopperGain.gain);

    // 4. Noise buffer for wind/blade rush
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.18, this.ctx.currentTime);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.chopperGain);

    // Connect engine osc
    this.rotorOsc.connect(this.rotorFilter);
    this.rotorFilter.connect(this.chopperGain);

    // Output gain for overall rotor sound
    this.rotorGain = this.ctx.createGain();
    this.rotorGain.gain.setValueAtTime(0, this.ctx.currentTime); // start silent until user interacts

    this.chopperGain.connect(this.rotorGain);
    this.rotorGain.connect(this.masterGain);

    this.rotorOsc.start();
    this.chopperOsc.start();
    noiseSource.start();
    this.isPlayingRotor = true;
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateRotorSound(speedFactor = 1.0, altitude = 1.0) {
    if (!this.ctx || !this.isPlayingRotor || this.isMuted) return;

    const t = this.ctx.currentTime;
    const clampedSpeed = Math.min(Math.max(speedFactor, 0.4), 2.2);

    // Frequency shifts up with speed
    const baseFreq = 40 + clampedSpeed * 22;
    this.rotorOsc.frequency.setTargetAtTime(baseFreq, t, 0.1);

    // Blade pass rate
    const chopRate = 11 + clampedSpeed * 8;
    this.chopperOsc.frequency.setTargetAtTime(chopRate, t, 0.1);

    // Volume level based on presence and altitude
    const targetVolume = 0.22 + (clampedSpeed * 0.12);
    this.rotorGain.gain.setTargetAtTime(targetVolume, t, 0.2);
  }

  playLanding() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Pleasant two-tone landing chime (F4 -> C5)
    [349.23, 523.25].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      gain.gain.setValueAtTime(0.001, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.25, t + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.12 + 0.6);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.65);
    });
  }

  playStarCollect() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    // Sparkling arpeggio (C5, E5, G5, C6)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.001, t + idx * 0.06);
      gain.gain.linearRampToValueAtTime(0.2, t + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.06 + 0.4);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.45);
    });
  }

  playClick() {
    if (!this.ctx || this.isMuted) return;
    this.resume();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('heli_sound_muted', this.isMuted);

    if (this.masterGain && this.ctx) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.35, t, 0.05);
    }
    return this.isMuted;
  }
}

export const sound = new SoundEngine();
