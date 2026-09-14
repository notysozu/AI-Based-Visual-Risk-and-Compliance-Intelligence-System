/**
 * Web Audio API Ambient Soundscape Generator for Study Sessions.
 * 100% offline, zero external dependencies, zero latency, zero CORS or broken links.
 */

export type SoundscapeType =
  | "none"
  | "lofi"
  | "piano"
  | "rain"
  | "cafe"
  | "binaural"
  | "theta"
  | "library"
  | "campfire"
  | "forest"
  | "ocean"
  | "crickets"
  | "keyboard"
  | "pinknoise";

export interface SoundscapeInfo {
  id: SoundscapeType;
  name: string;
  description: string;
  category: "ambient" | "music" | "nature" | "asmr";
  icon: string;
}

export const SOUNDSCAPES: SoundscapeInfo[] = [
  {
    id: "none",
    name: "Silent Focus",
    description: "Pure silence for distraction-free deep work",
    category: "ambient",
    icon: "VolumeX",
  },
  {
    id: "lofi",
    name: "Lo-Fi Beats",
    description: "Warm chillhop Rhodes chord cycles & subtle vinyl crackle",
    category: "music",
    icon: "Music",
  },
  {
    id: "piano",
    name: "Dreamy Piano",
    description: "Minimalist acoustic piano notes drifting in gentle reverberation",
    category: "music",
    icon: "Piano",
  },
  {
    id: "rain",
    name: "Rain & Thunder",
    description: "Atmospheric rainfall and gentle low thunder rumbles",
    category: "nature",
    icon: "CloudRain",
  },
  {
    id: "cafe",
    name: "Cozy Cafe",
    description: "Warm coffee shop ambient hum and acoustic warmth",
    category: "ambient",
    icon: "Coffee",
  },
  {
    id: "binaural",
    name: "40Hz Gamma Waves",
    description: "Binaural frequency targeting high-level cognitive binding",
    category: "ambient",
    icon: "Brain",
  },
  {
    id: "theta",
    name: "6Hz Theta Waves",
    description: "Subtle binaural tone for meditative intuition and memory encoding",
    category: "ambient",
    icon: "Sparkles",
  },
  {
    id: "library",
    name: "Quiet Library",
    description: "Subtle acoustic air resonance of a university hall",
    category: "ambient",
    icon: "BookOpen",
  },
  {
    id: "campfire",
    name: "Warm Campfire",
    description: "Soothing fireplace glow and gentle organic crackles",
    category: "nature",
    icon: "Flame",
  },
  {
    id: "forest",
    name: "Pine Forest Breeze",
    category: "nature",
    description: "Gentle mountain wind rustling through pine trees",
    icon: "Trees",
  },
  {
    id: "ocean",
    name: "Ocean Surf Waves",
    category: "nature",
    description: "Periodic rolling ocean waves and soothing shoreline tide",
    icon: "Waves",
  },
  {
    id: "crickets",
    name: "Summer Night Crickets",
    category: "nature",
    description: "Peaceful twilight field crickets under starry skies",
    icon: "Moon",
  },
  {
    id: "keyboard",
    name: "Mechanical ASMR",
    category: "asmr",
    description: "Crisp tactile mechanical keystrokes for productive flow",
    icon: "Keyboard",
  },
  {
    id: "pinknoise",
    name: "Deep Pink Noise",
    category: "ambient",
    description: "Balanced 1/f frequency spectrum for deep memory consolidation",
    icon: "Sliders",
  },
];

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeType: SoundscapeType = "none";
  private activeNodes: (AudioNode | number)[] = [];
  private volume: number = 0.5;

  private initContext(): AudioContext {
    if (!this.ctx || this.ctx.state === "closed") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, this.ctx.currentTime + 0.05);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): SoundscapeType {
    return this.activeType;
  }

  public isPlaying(): boolean {
    return this.activeType !== "none" && this.activeNodes.length > 0;
  }

  public stop() {
    this.activeNodes.forEach((node) => {
      try {
        if (typeof node === "number") {
          window.clearInterval(node);
        } else if ("stop" in node && typeof (node as any).stop === "function") {
          (node as any).stop();
          node.disconnect();
        } else if ("disconnect" in node && typeof node.disconnect === "function") {
          node.disconnect();
        }
      } catch {
        // Safe teardown
      }
    });
    this.activeNodes = [];
    this.activeType = "none";
  }

  public play(type: SoundscapeType, volume: number = 0.5) {
    if (this.activeType === type && this.isPlaying()) return;
    this.stop();
    if (type === "none") return;

    const ctx = this.initContext();
    this.setVolume(volume);
    this.activeType = type;

    switch (type) {
      case "lofi":
        this.startLoFi(ctx);
        break;
      case "piano":
        this.startPiano(ctx);
        break;
      case "rain":
        this.startRain(ctx);
        break;
      case "cafe":
        this.startCafe(ctx);
        break;
      case "binaural":
        this.startBinaural(ctx);
        break;
      case "theta":
        this.startTheta(ctx);
        break;
      case "library":
        this.startLibrary(ctx);
        break;
      case "campfire":
        this.startCampfire(ctx);
        break;
      case "forest":
        this.startForest(ctx);
        break;
      case "ocean":
        this.startOcean(ctx);
        break;
      case "crickets":
        this.startCrickets(ctx);
        break;
      case "keyboard":
        this.startKeyboard(ctx);
        break;
      case "pinknoise":
        this.startPinkNoise(ctx);
        break;
    }
  }

  public playChime() {
    const ctx = this.initContext();
    const now = ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 1.2);

      osc.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 1.3);
    });
  }

  private startLoFi(ctx: AudioContext) {
    const chords = [
      [261.63, 329.63, 392.0, 493.88], // Cmaj7
      [220.0, 261.63, 329.63, 392.0],  // Am7
      [174.61, 220.0, 261.63, 329.63], // Fmaj7
      [196.0, 246.94, 293.66, 349.23], // G7
    ];

    let chordIndex = 0;
    const playChord = () => {
      if (this.activeType !== "lofi") return;
      const currentChord = chords[chordIndex % chords.length];
      chordIndex++;

      const now = ctx.currentTime;
      currentChord.forEach((f) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.07, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(850, now);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 4.0);
        this.activeNodes.push(osc);
      });
    };

    playChord();
    const interval = window.setInterval(playChord, 3800);
    this.activeNodes.push(interval);

    // Vinyl crackle
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.015;
    }
    const crackle = ctx.createBufferSource();
    crackle.buffer = noiseBuffer;
    crackle.loop = true;
    crackle.connect(this.masterGain!);
    crackle.start();
    this.activeNodes.push(crackle);
  }

  private startPiano(ctx: AudioContext) {
    // Pentatonic scale notes: C4, D4, E4, G4, A4, C5, D5, E5
    const notes = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25];
    const playNote = () => {
      if (this.activeType !== "piano") return;
      const f = notes[Math.floor(Math.random() * notes.length)];
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1200, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + 3.0);
      this.activeNodes.push(osc);
    };

    playNote();
    const interval = window.setInterval(playNote, 1400);
    this.activeNodes.push(interval);
  }

  private startRain(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
    }

    const rainSource = ctx.createBufferSource();
    rainSource.buffer = noiseBuffer;
    rainSource.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(1100, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.4, ctx.currentTime);

    rainSource.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    rainSource.start();
    this.activeNodes.push(rainSource);
  }

  private startCafe(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.04;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.Q.setValueAtTime(0.8, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.28, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();
    this.activeNodes.push(noise);
  }

  private startBinaural(ctx: AudioContext) {
    const merger = ctx.createChannelMerger(2);

    const oscLeft = ctx.createOscillator();
    oscLeft.type = "sine";
    oscLeft.frequency.setValueAtTime(432, ctx.currentTime);
    const gainLeft = ctx.createGain();
    gainLeft.gain.setValueAtTime(0.18, ctx.currentTime);
    oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0);

    const oscRight = ctx.createOscillator();
    oscRight.type = "sine";
    oscRight.frequency.setValueAtTime(472, ctx.currentTime); // 40Hz difference
    const gainRight = ctx.createGain();
    gainRight.gain.setValueAtTime(0.18, ctx.currentTime);
    oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1);

    merger.connect(this.masterGain!);

    oscLeft.start();
    oscRight.start();
    this.activeNodes.push(oscLeft, oscRight);
  }

  private startTheta(ctx: AudioContext) {
    const merger = ctx.createChannelMerger(2);

    const oscLeft = ctx.createOscillator();
    oscLeft.type = "sine";
    oscLeft.frequency.setValueAtTime(216, ctx.currentTime);
    const gainLeft = ctx.createGain();
    gainLeft.gain.setValueAtTime(0.18, ctx.currentTime);
    oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0);

    const oscRight = ctx.createOscillator();
    oscRight.type = "sine";
    oscRight.frequency.setValueAtTime(222, ctx.currentTime); // 6Hz difference
    const gainRight = ctx.createGain();
    gainRight.gain.setValueAtTime(0.18, ctx.currentTime);
    oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1);

    merger.connect(this.masterGain!);

    oscLeft.start();
    oscRight.start();
    this.activeNodes.push(oscLeft, oscRight);
  }

  private startLibrary(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.02;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(320, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();
    this.activeNodes.push(noise);
  }

  private startCampfire(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.04 * white) / 1.04;
      lastOut = output[i];
    }
    const rumble = ctx.createBufferSource();
    rumble.buffer = noiseBuffer;
    rumble.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);

    rumble.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    rumble.start();
    this.activeNodes.push(rumble);

    const crackleInterval = window.setInterval(() => {
      if (this.activeType !== "campfire") return;
      if (Math.random() > 0.4) {
        const now = ctx.currentTime;
        const crackleOsc = ctx.createOscillator();
        const crackleGain = ctx.createGain();
        crackleOsc.type = "square";
        crackleOsc.frequency.setValueAtTime(1800 + Math.random() * 1200, now);
        crackleGain.gain.setValueAtTime(0.08, now);
        crackleGain.exponentialRampToValueAtTime(0.001, now + 0.04);
        crackleOsc.connect(crackleGain);
        crackleGain.connect(this.masterGain!);
        crackleOsc.start(now);
        crackleOsc.stop(now + 0.05);
      }
    }, 180);
    this.activeNodes.push(crackleInterval);
  }

  private startForest(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 3;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.025;
    }
    const wind = ctx.createBufferSource();
    wind.buffer = noiseBuffer;
    wind.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(650, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);

    wind.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    wind.start();
    this.activeNodes.push(wind);
  }

  private startOcean(ctx: AudioContext) {
    // Ocean surf: modulated lowpass brown noise
    const bufferSize = ctx.sampleRate * 4;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
    }
    const surf = ctx.createBufferSource();
    surf.buffer = noiseBuffer;
    surf.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);

    surf.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    surf.start();
    this.activeNodes.push(surf);

    // Sine LFO for swell cycles
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 8-second wave period

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.25, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    lfo.start();
    this.activeNodes.push(lfo);
  }

  private startCrickets(ctx: AudioContext) {
    const cricketInterval = window.setInterval(() => {
      if (this.activeType !== "crickets") return;
      const now = ctx.currentTime;
      for (let j = 0; j < 3; j++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(4600 + Math.random() * 400, now + j * 0.04);

        gain.gain.setValueAtTime(0, now + j * 0.04);
        gain.gain.linearRampToValueAtTime(0.04, now + j * 0.04 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + j * 0.04 + 0.03);

        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + j * 0.04);
        osc.stop(now + j * 0.04 + 0.035);
      }
    }, 600 + Math.random() * 300);
    this.activeNodes.push(cricketInterval);
  }

  private startKeyboard(ctx: AudioContext) {
    const clickInterval = window.setInterval(() => {
      if (this.activeType !== "keyboard") return;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(1200 + Math.random() * 800, now);

      clickGain.gain.setValueAtTime(0.12, now);
      clickGain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(clickGain);
      clickGain.connect(this.masterGain!);
      osc.start(now);
      osc.stop(now + 0.04);
    }, 280 + Math.random() * 120);
    this.activeNodes.push(clickInterval);
  }

  private startPinkNoise(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
      b6 = white * 0.115926;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);

    noise.connect(gain);
    gain.connect(this.masterGain!);
    noise.start();
    this.activeNodes.push(noise);
  }
}

export const soundscapeEngine = new SoundscapeEngine();
