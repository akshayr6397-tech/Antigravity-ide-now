/**
 * ASTROCAL — Cosmic Ambient Audio & Radio Telemetry Engine
 * Generates deep space resonances, pulsar telemetry beeps, and reminder chimes
 */

class SpaceAudio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.isMuted = true;
    this.ambientOsc = null;
    this.ambientGain = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleAudio() {
    this.ensureContext();
    this.isMuted = !this.isMuted;

    if (!this.isMuted) {
      this.masterGain.gain.setTargetAtTime(0.28, this.ctx.currentTime, 0.05);
      this.startDeepSpaceHum();
      this.playCelestialChime(523.25); // C5
    } else {
      this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      this.stopDeepSpaceHum();
    }

    return !this.isMuted;
  }

  startDeepSpaceHum() {
    if (this.ambientOsc) return;

    // 55 Hz A1 Sub-harmonic resonance
    this.ambientOsc = this.ctx.createOscillator();
    this.ambientGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    this.ambientOsc.type = 'sine';
    this.ambientOsc.frequency.setValueAtTime(55, this.ctx.currentTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(140, this.ctx.currentTime);

    this.ambientGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    this.ambientOsc.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    this.ambientOsc.start();
  }

  stopDeepSpaceHum() {
    if (this.ambientOsc) {
      try {
        this.ambientOsc.stop();
        this.ambientOsc.disconnect();
      } catch (e) {}
      this.ambientOsc = null;
    }
  }

  playCelestialChime(freq = 659.25, duration = 1.2) {
    if (this.isMuted) return;
    this.ensureContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration);
  }

  playPulsarBeep() {
    if (this.isMuted) return;
    this.ensureContext();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, now);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }
}

window.SpaceAudio = SpaceAudio;
