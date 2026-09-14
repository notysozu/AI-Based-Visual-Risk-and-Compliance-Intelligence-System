/**
 * Web Audio API Ambient Soundscape Generator for Study Sessions.
 * 100% offline, zero external dependencies, zero latency, zero CORS or broken links.
 */

export type SoundscapeType =
  | "none"
  | "lofi"
  | "rain"
  | "cafe"
  | "binaural"
  | "library"
  | "campfire"
  | "forest"
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
    name: "40Hz Alpha Waves",
    description: "Binaural frequency targeting peak cognitive focus",
    category: "ambient",
    icon: "Brain",
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
    icon: "Waves",
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
        // Safe tear down
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
      case "rain":
        this.startRain(ctx);
        break;
      case "cafe":
        this.startCafe(ctx);
        break;
      case "binaural":
        this.startBinaural(ctx);
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
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 chime

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

    // Subtle vinyl crackle
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
    oscRight.frequency.setValueAtTime(442, ctx.currentTime);
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
    // Low flame rumble
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

    // Random crackle pulses
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
    // Rustling wind through pines
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

  private startKeyboard(ctx: AudioContext) {
    // Tactile ASMR mechanical keystroke simulator
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
    // Deep pink noise (1/f)
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
