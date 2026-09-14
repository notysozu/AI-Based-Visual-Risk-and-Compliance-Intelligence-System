/**
 * Web Audio API Ambient Soundscape Generator for Study Sessions.
 * 100% offline, zero external dependencies, zero latency, zero CORS or broken links.
 */

export type SoundscapeType = "none" | "lofi" | "rain" | "cafe" | "binaural" | "library";

export interface SoundscapeInfo {
  id: SoundscapeType;
  name: string;
  description: string;
  icon: string;
}

export const SOUNDSCAPES: SoundscapeInfo[] = [
  {
    id: "none",
    name: "Silent Focus",
    description: "Pure silence for distraction-free deep work",
    icon: "VolumeX",
  },
  {
    id: "lofi",
    name: "Lo-Fi Beats",
    description: "Warm chillhop Rhodes chord cycles & subtle vinyl crackle",
    icon: "Music",
  },
  {
    id: "rain",
    name: "Rain & Thunder",
    description: "Atmospheric rainfall and gentle low thunder rumbles",
    icon: "CloudRain",
  },
  {
    id: "cafe",
    name: "Cozy Cafe",
    description: "Warm coffee shop ambient hum and acoustic warmth",
    icon: "Coffee",
  },
  {
    id: "binaural",
    name: "40Hz Alpha Waves",
    description: "Binaural frequency targeting peak cognitive focus",
    icon: "Brain",
  },
  {
    id: "library",
    name: "Quiet Library",
    description: "Subtle acoustic air resonance of a university hall",
    icon: "BookOpen",
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
        } else {
          node.disconnect();
        }
      } catch {
        // ignore
      }
    });
    this.activeNodes = [];
    this.activeType = "none";
  }

  public play(type: SoundscapeType) {
    this.stop();
    if (type === "none") return;

    const ctx = this.initContext();
    this.activeType = type;

    switch (type) {
      case "lofi":
        this.startLofi(ctx);
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
    }
  }

  public playChime() {
    try {
      const ctx = this.initContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(528, now);
      osc.frequency.exponentialRampToValueAtTime(264, now + 2.5);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 2.6);
    } catch (e) {
      console.warn("Chime notice:", e);
    }
  }

  private startLofi(ctx: AudioContext) {
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * 0.02;
    }
    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const crackleFilter = ctx.createBiquadFilter();
    crackleFilter.type = "bandpass";
    crackleFilter.frequency.setValueAtTime(1200, ctx.currentTime);
    crackleFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    const crackleGain = ctx.createGain();
    crackleGain.gain.setValueAtTime(0.18, ctx.currentTime);

    whiteNoise.connect(crackleFilter);
    crackleFilter.connect(crackleGain);
    crackleGain.connect(this.masterGain!);
    whiteNoise.start();
    this.activeNodes.push(whiteNoise);

    const chords = [
      [174.61, 220.0, 261.63, 329.63],
      [164.81, 196.0, 246.94, 293.66],
      [146.83, 174.61, 220.0, 261.63],
      [130.81, 164.81, 196.0, 246.94],
    ];
    let chordIdx = 0;

    const playChord = () => {
      if (this.activeType !== "lofi") return;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        filter.type = "lowpass";
        filter.frequency.setValueAtTime(650, ctx.currentTime);

        const now = ctx.currentTime;
        oscGain.gain.setValueAtTime(0.001, now);
        oscGain.gain.linearRampToValueAtTime(0.035, now + 0.8);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 3.8);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(this.masterGain!);

        osc.start(now);
        osc.stop(now + 4.0);
        this.activeNodes.push(osc);
      });
    };

    playChord();
    const timerId = window.setInterval(playChord, 4000);
    this.activeNodes.push(timerId);
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
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

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
}

export const soundscapeEngine = new SoundscapeEngine();
