// Web Audio API chime sound generator for market anomalies
class AudioAlertService {
  private audioCtx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // Lazy init
  }

  public setSoundEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getSoundEnabled(): boolean {
    return this.isEnabled;
  }

  public isAudioMuted(): boolean {
    return !this.isEnabled;
  }

  public toggleMute(): boolean {
    this.isEnabled = !this.isEnabled;
    return !this.isEnabled;
  }

  private initContext() {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public playAnomalyChime(severity: 'high' | 'medium' | 'normal' = 'normal', direction: 'bullish' | 'bearish' | 'neutral' = 'bullish') {
    if (!this.isEnabled) return;
    try {
      this.initContext();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = severity === 'high' ? 'triangle' : 'sine';
      
      const baseFreq = direction === 'bullish' ? 880 : direction === 'bearish' ? 520 : 660;
      const endFreq = direction === 'bullish' ? 1320 : direction === 'bearish' ? 392 : 660;

      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.15);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(severity === 'high' ? 0.15 : 0.08, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Audio context might be restricted before user interaction
    }
  }
}

export const audioAlertService = new AudioAlertService();
