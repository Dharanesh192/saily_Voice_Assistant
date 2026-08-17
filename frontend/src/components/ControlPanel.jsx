import React from 'react';
import { Mic, MicOff } from 'lucide-react';

/**
 * Control Panel Toolbar
 * Centered compact toolbar containing Mic Toggle and Orange Action/Stop Button.
 */
export default function ControlPanel({
  isListening,
  isSpeaking,
  onToggleMic,
  onStopAll,
}) {
  return (
    <div
      className="fixed z-30 px-4"
      style={{
        bottom: '1.75rem',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'auto',
      }}
    >
      <div
        className="glass-panel p-2 px-4 flex items-center justify-center gap-3 shadow-2xl"
        style={{
          borderRadius: '9999px',
          background: 'rgba(18, 18, 22, 0.85)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {/* Mic Toggle Button */}
        <button
          onClick={onToggleMic}
          className="relative flex items-center justify-center"
          style={{
            width: '2.75rem',
            height: '2.75rem',
            borderRadius: '9999px',
            background: isListening ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.08)',
            border: isListening ? '1px solid rgba(16, 185, 129, 0.5)' : '1px solid rgba(255, 255, 255, 0.15)',
            color: isListening ? '#34d399' : '#d4d4d8',
            boxShadow: isListening ? '0 0 20px rgba(52, 211, 153, 0.4)' : 'none',
            transition: 'all 0.2s ease',
          }}
          title={isListening ? 'Mute Microphone' : 'Enable Microphone'}
        >
          {isListening ? (
            <>
              <Mic style={{ width: '18px', height: '18px' }} />
              <span
                style={{
                  position: 'absolute',
                  top: '2px',
                  right: '2px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#34d399',
                  borderRadius: '9999px',
                  border: '2px solid #000',
                }}
              />
            </>
          ) : (
            <MicOff style={{ width: '18px', height: '18px', color: '#a1a1aa' }} />
          )}
        </button>

        {/* Orange Circular Stop/Action Button (Matching User Layout) */}
        <button
          onClick={onStopAll}
          className="stop-btn-glow"
          title="Stop Assistant / Cancel Action"
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '3px',
              backgroundColor: '#f97316',
              boxShadow: '0 0 10px #f97316',
            }}
          />
        </button>
      </div>
    </div>
  );
}
