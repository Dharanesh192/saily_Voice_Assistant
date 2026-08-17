import React, { useEffect, useState, useRef } from 'react';

/**
 * Subtitles & Transcript Caption Overlay (Rollable Text Container)
 * Displays user live transcription ("Hey, can you help me...") or Saily assistant responses.
 */
export default function Subtitles({ text, isListening, isSpeaking, isProcessing }) {
  const [displayedText, setDisplayedText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!text) {
      if (isListening) {
        setDisplayedText("Listening to your voice...");
      } else if (isProcessing) {
        setDisplayedText("Saily is processing your command...");
      } else if (isSpeaking) {
        setDisplayedText("Saily speaking...");
      } else {
        setDisplayedText("Tap the mic or orange button to start speaking");
      }
      return;
    }

    setDisplayedText(text);
  }, [text, isListening, isSpeaking, isProcessing]);

  // Roll/scroll container automatically to bottom as text stream comes in
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText]);

  return (
    <div className="w-full max-w-xl mx-auto px-4 my-3 flex flex-col items-center justify-center z-10">
      {/* Rollable / Scrollable Caption Text Box */}
      <div
        ref={scrollRef}
        className="w-full px-4 py-2 text-center pointer-events-auto"
        style={{
          maxHeight: '80px',
          overflowY: 'auto',
          scrollBehavior: 'smooth',
        }}
      >
        <p className="text-base md:text-xl font-light tracking-wide text-zinc-200 leading-relaxed text-glow">
          "{displayedText}"
          {(isListening || isSpeaking) && (
            <span className="inline-block w-1.5 h-4 ml-1.5 bg-sky-400 align-middle rounded-full animate-blink" />
          )}
        </p>
      </div>

      {/* Subtitle status badge */}
      <div className="mt-2 flex items-center gap-2 pointer-events-none">
        <span
          className={`w-2 h-2 rounded-full animate-pulse ${
            isSpeaking
              ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
              : isListening
              ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
              : isProcessing
              ? 'bg-orange-400 shadow-[0_0_8px_#fb923c]'
              : 'bg-zinc-600'
          }`}
        />
        <span className="text-xs uppercase tracking-widest font-mono text-zinc-400">
          {isSpeaking
            ? 'Saily Speaking'
            : isListening
            ? 'Live Audio Stream'
            : isProcessing
            ? 'Processing Request'
            : 'Voice Standby'}
        </span>
      </div>
    </div>
  );
}
