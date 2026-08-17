/**
 * Web Speech API Service
 * Handles Speech-to-Text (STT) and Text-to-Speech (TTS) synthesis with fallback capabilities.
 */
class SpeechService {
  constructor() {
    this.recognition = null;
    this.synthesis = window.speechSynthesis;
    this.isRecognizing = false;
    this.isSpeaking = false;
    
    this.onTranscriptCallback = null;
    this.onStatusChangeCallback = null;
    this.onSpeakingStateChangeCallback = null;

    this.initRecognition();
  }

  initRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API is not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';

    this.recognition.onstart = () => {
      this.isRecognizing = true;
      if (this.onStatusChangeCallback) this.onStatusChangeCallback(true);
    };

    this.recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (this.onTranscriptCallback) {
        this.onTranscriptCallback({
          interim: interimTranscript,
          final: finalTranscript,
          text: finalTranscript || interimTranscript,
        });
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error !== 'no-speech') {
        this.isRecognizing = false;
        if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);
      }
    };

    this.recognition.onend = () => {
      if (this.isRecognizing) {
        try {
          this.recognition.start();
        } catch {
          this.isRecognizing = false;
          if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);
        }
      } else {
        if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);
      }
    };
  }

  startListening(onTranscript, onStatusChange) {
    this.onTranscriptCallback = onTranscript;
    this.onStatusChangeCallback = onStatusChange;

    if (this.recognition && !this.isRecognizing) {
      try {
        this.recognition.start();
        this.isRecognizing = true;
      } catch (err) {
        console.warn('Failed to start speech recognition:', err);
      }
    }
  }

  stopListening() {
    this.isRecognizing = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.warn('Failed to stop speech recognition:', err);
      }
    }
    if (this.onStatusChangeCallback) this.onStatusChangeCallback(false);
  }

  speak(text, onEnd) {
    if (!this.synthesis) {
      if (onEnd) onEnd();
      return;
    }

    this.stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Pick pleasant voice if available
    const voices = this.synthesis.getVoices();
    const preferredVoice = voices.find(
      (v) => (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en')
    );
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onstart = () => {
      this.isSpeaking = true;
      if (this.onSpeakingStateChangeCallback) this.onSpeakingStateChangeCallback(true);
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      if (this.onSpeakingStateChangeCallback) this.onSpeakingStateChangeCallback(false);
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      if (this.onSpeakingStateChangeCallback) this.onSpeakingStateChangeCallback(false);
      if (onEnd) onEnd();
    };

    this.synthesis.speak(utterance);
  }

  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isSpeaking = false;
      if (this.onSpeakingStateChangeCallback) this.onSpeakingStateChangeCallback(false);
    }
  }

  onSpeakingStateChange(callback) {
    this.onSpeakingStateChangeCallback = callback;
  }
}

export const speechService = new SpeechService();
