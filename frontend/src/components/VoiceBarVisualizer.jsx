import React from 'react';

/**
 * ChatGPT 4o Voice Mode Visualizer (Matching Image 1)
 * Displays sleek vertical pill equalizer bars with glowing animations and dynamic heights.
 */
export default function VoiceBarVisualizer({ isListening, isSpeaking, isProcessing, audioVolume, frequencyData }) {
  const barCount = 7;
  const barIndices = [0, 1, 2, 3, 4, 5, 6];

  return (
    <div className="relative flex items-center justify-center gap-2 md:gap-3 py-10 px-6">
      {/* Background ambient lighting */}
      <div 
        className={`absolute inset-0 rounded-full blur-3xl transition-opacity duration-700 pointer-events-none ${
          isSpeaking 
            ? 'bg-sky-500/20 opacity-80' 
            : isListening 
            ? 'bg-white/15 opacity-60' 
            : 'bg-white/5 opacity-30'
        }`}
      />

      {barIndices.map((idx) => {
        // Calculate pill height based on spectrum data or audio volume
        let heightPercent = 20;

        if (isListening && frequencyData && frequencyData.length > 0) {
          const sampleIdx = Math.floor((idx / barCount) * (frequencyData.length / 2));
          const freqVal = frequencyData[sampleIdx] / 255;
          heightPercent = Math.max(15, Math.min(100, (freqVal * 0.8 + audioVolume * 0.5) * 100));
        } else if (isSpeaking) {
          // Dynamic sine wave height when assistant is speaking
          const time = Date.now() / 150;
          const sineOffset = Math.sin(time + idx * 0.8) * 35;
          heightPercent = Math.max(20, Math.min(95, 50 + sineOffset));
        } else if (isProcessing) {
          const time = Date.now() / 200;
          heightPercent = 30 + Math.sin(time + idx * 0.5) * 20;
        } else {
          // Idle pill heights (center pill tallest matching image 1)
          const centerDist = Math.abs(idx - 3);
          heightPercent = 70 - centerDist * 14;
        }

        // Center pill styling matching ChatGPT 4o design
        const isCenter = idx === 3;

        return (
          <div
            key={idx}
            className="relative flex items-center justify-center transition-all duration-75 ease-out"
            style={{ height: '140px' }}
          >
            <div
              className={`w-3.5 md:w-5 rounded-full transition-all duration-100 ease-out shadow-lg ${
                isSpeaking
                  ? 'bg-gradient-to-t from-sky-400 to-white shadow-sky-400/40'
                  : isListening && audioVolume > 0.05
                  ? 'bg-white shadow-white/50'
                  : isCenter
                  ? 'bg-white shadow-white/40'
                  : 'bg-white/70 shadow-white/20'
              }`}
              style={{
                height: `${heightPercent}%`,
                minHeight: '16px',
                boxShadow: isSpeaking 
                  ? '0 0 20px rgba(56, 189, 248, 0.6)' 
                  : '0 0 15px rgba(255, 255, 255, 0.4)',
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
