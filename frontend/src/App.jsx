import React, { useState, useEffect, useRef } from 'react';
import { History, Settings } from 'lucide-react';
import ParticleOrbVisualizer from './components/ParticleOrbVisualizer';
import Subtitles from './components/Subtitles';
import ControlPanel from './components/ControlPanel';
import ChatHistory from './components/ChatHistory';
import SettingsModal from './components/SettingsModal';

import { audioService } from './services/audioService';
import { speechService } from './services/speechService';
import { processVoiceQuery, checkBackendHealth } from './services/backendApi';

export default function App() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [audioVolume, setAudioVolume] = useState(0);
  const [frequencyData, setFrequencyData] = useState(null);

  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [history, setHistory] = useState([]);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState({ online: false });

  const animLoopRef = useRef(null);

  // Check backend server status on mount
  useEffect(() => {
    checkBackendHealth().then((status) => setBackendStatus(status));
  }, []);

  // Sync assistant speaking state with SpeechService
  useEffect(() => {
    speechService.onSpeakingStateChange((speaking) => {
      setIsSpeaking(speaking);
    });
  }, []);

  // Real-time audio spectrum polling loop
  useEffect(() => {
    let active = true;

    const tick = () => {
      if (!active) return;

      if (audioService.isListening) {
        const data = audioService.getAudioData();
        setAudioVolume(data.volume);
        setFrequencyData(data.frequencyData);
      } else if (isSpeaking) {
        const vol = 0.2 + Math.abs(Math.sin(Date.now() / 150)) * 0.45;
        setAudioVolume(vol);
      } else {
        setAudioVolume(0);
      }

      animLoopRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      active = false;
      if (animLoopRef.current) cancelAnimationFrame(animLoopRef.current);
    };
  }, [isSpeaking]);

  // Handle Speech Recognition transcript updates
  const handleTranscript = async ({ final, interim, text }) => {
    setCurrentSubtitle(text);

    if (final && final.trim().length > 0) {
      speechService.stopListening();
      setIsListening(false);
      audioService.stopListening();

      await handleUserQuery(final);
    }
  };

  const abortControllerRef = useRef(null);
  const isMicModeActiveRef = useRef(false);

  // Start / Resume Microphone listening
  const startMicListening = async () => {
    const micSuccess = await audioService.startListening();
    if (micSuccess) {
      setIsListening(true);
      speechService.startListening(
        handleTranscript,
        (active) => {
          setIsListening(active);
        }
      );
    } else {
      setCurrentSubtitle("Microphone access denied or unavailable.");
      isMicModeActiveRef.current = false;
    }
  };

  // Process user utterance
  const handleUserQuery = async (queryText) => {
    // Abort any existing in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProcessing(true);
    setCurrentSubtitle(`"${queryText}"`);

    try {
      const result = await processVoiceQuery(queryText, controller.signal);

      setIsProcessing(false);
      setCurrentSubtitle(result.text);

      // Append to history
      setHistory((prev) => [
        { query: queryText, response: result.text, action: result.action, timestamp: new Date() },
        ...prev,
      ]);

      // Speak assistant reply, and ON COMPLETION check if continuous mic mode is active
      speechService.speak(result.text, () => {
        if (isMicModeActiveRef.current) {
          startMicListening();
        }
      });
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log("Voice request cancelled by user stop action.");
        return;
      }
      setIsProcessing(false);
      const errorMsg = "Sorry, I encountered an issue processing your request.";
      setCurrentSubtitle(errorMsg);
      speechService.speak(errorMsg, () => {
        if (isMicModeActiveRef.current) {
          startMicListening();
        }
      });
    }
  };

  // Toggle Microphone (ON = Continuous Conversation Mode, OFF = Stop Listening)
  const handleToggleMic = async () => {
    // If assistant is speaking, stop speech immediately
    if (isSpeaking) {
      speechService.stopSpeaking();
      setIsSpeaking(false);
    }

    if (isMicModeActiveRef.current || isListening) {
      // Turn Mic OFF
      isMicModeActiveRef.current = false;
      audioService.stopListening();
      speechService.stopListening();
      setIsListening(false);
    } else {
      // Turn Mic ON (Continuous Mode)
      isMicModeActiveRef.current = true;
      setCurrentSubtitle('');
      await startMicListening();
    }
  };

  // Emergency Stop / Action Button (Orange Button)
  const handleStopAll = () => {
    isMicModeActiveRef.current = false;
    // Instantly cancel active HTTP request to backend
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    speechService.stopSpeaking();
    speechService.stopListening();
    audioService.stopListening();
    setIsListening(false);
    setIsSpeaking(false);
    setIsProcessing(false);
    setCurrentSubtitle('Assistant stopped. Tap mic to begin.');
  };

  // Quick Prompt Chips
  const quickPrompts = [
    "Hey Saily, what can you do?",
    "What time is it right now?",
    "Search web for latest AI news",
    "Open browser application",
  ];

  return (
    <main
      className="relative w-screen h-screen bg-black text-white flex flex-col justify-between overflow-hidden"
      style={{ minHeight: '100vh', backgroundColor: '#000' }}
    >
      {/* Background Ambient Glow FX */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: '35%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(56,189,248,0.1) 0%, rgba(0,0,0,0) 70%)',
          borderRadius: '9999px',
        }}
      />

      {/* Top Header Row (Suggestions on Top-Left, Chat & Settings on Top-Right) */}
      <header className="relative z-20 px-6 py-4 flex items-start justify-between">
        {/* Top-Left: Suggestion Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2 max-w-xl">
          {quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleUserQuery(promptText)}
              className="text-xs px-3 py-1.5 font-medium transition-all"
              style={{
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#d4d4d8',
                cursor: 'pointer',
                backdropFilter: 'blur(12px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                e.currentTarget.style.color = '#d4d4d8';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
              }}
            >
              {promptText}
            </button>
          ))}
        </div>

        {/* Top-Right: Chat History & Settings Action Buttons */}
        <div className="flex items-center gap-2">
          {/* Chat History Button */}
          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center justify-center transition-all"
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#d4d4d8',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#d4d4d8';
            }}
            title="Activity & Chat History"
          >
            <History style={{ width: '18px', height: '18px' }} />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center justify-center transition-all"
            style={{
              width: '2.5rem',
              height: '2.5rem',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#d4d4d8',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.16)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#d4d4d8';
            }}
            title="Assistant Settings"
          >
            <Settings style={{ width: '18px', height: '18px' }} />
          </button>
        </div>
      </header>

      {/* Central Stage Container */}
      <section className="relative z-10 flex-1 flex flex-col items-center justify-start pt-1 md:pt-4 px-4 w-full">
        {/* 3D Particle Sphere Box */}
        <div
          className="relative flex items-center justify-center"
          style={{
            width: '320px',
            height: '320px',
            maxWidth: '100%',
            marginBottom: '1rem',
          }}
        >
          <ParticleOrbVisualizer
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
            audioVolume={audioVolume}
            frequencyData={frequencyData}
          />
        </div>

        {/* Rollable Subtitles (Positioned Clearly Below Sphere) */}
        <div className="w-full max-w-xl mx-auto flex flex-col items-center mb-16">
          <Subtitles
            text={currentSubtitle}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isProcessing={isProcessing}
          />
        </div>
      </section>

      {/* Floating Bottom Control Panel */}
      <ControlPanel
        isListening={isListening}
        isSpeaking={isSpeaking}
        onToggleMic={handleToggleMic}
        onStopAll={handleStopAll}
      />

      {/* Drawer & Modals */}
      <ChatHistory
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={() => setHistory([])}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        backendStatus={backendStatus}
      />
    </main>
  );
}
