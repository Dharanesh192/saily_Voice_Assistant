/**
 * Web Audio API Manager
 * Captures microphone audio stream and provides real-time frequency data for visualizers.
 */
class AudioService {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.micStream = null;
    this.dataArray = null;
    this.source = null;
    this.isListening = false;
    this.listeners = new Set();
  }

  async startListening() {
    if (this.isListening) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      this.micStream = stream;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContextClass();

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;

      this.source = this.audioCtx.createMediaStreamSource(stream);
      this.source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);
      this.isListening = true;

      this.notifyStateChange(true);
      return true;
    } catch (err) {
      console.warn('Microphone permission or Web Audio init failed:', err);
      this.isListening = false;
      this.notifyStateChange(false);
      return false;
    }
  }

  stopListening() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close();
      this.audioCtx = null;
    }

    this.analyser = null;
    this.source = null;
    this.isListening = false;
    this.notifyStateChange(false);
  }

  // Gets real-time audio volume (0.0 to 1.0) and frequency spectrum array
  getAudioData() {
    if (!this.analyser || !this.dataArray || !this.isListening) {
      return { volume: 0, frequencyData: new Uint8Array(128) };
    }

    this.analyser.getByteFrequencyData(this.dataArray);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      sum += this.dataArray[i];
    }
    const average = sum / this.dataArray.length;
    const volume = Math.min(1.0, average / 128);

    return {
      volume,
      frequencyData: this.dataArray,
    };
  }

  onStateChange(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyStateChange(state) {
    this.listeners.forEach((cb) => cb(state));
  }
}

export const audioService = new AudioService();
