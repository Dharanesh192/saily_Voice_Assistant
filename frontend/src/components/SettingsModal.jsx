import React, { useState } from 'react';
import { X, Sliders, Server, Volume2, Globe } from 'lucide-react';

/**
 * Assistant Settings Modal
 */
export default function SettingsModal({ isOpen, onClose, backendStatus }) {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [voiceRate, setVoiceRate] = useState(1.0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div className="w-full max-w-md bg-zinc-950 border border-white/10 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-400" />
            <h3 className="text-lg font-semibold text-white heading-font">Saily Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="space-y-4 text-xs md:text-sm">
          {/* Backend Status indicator */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2.5">
              <Server className="w-4 h-4 text-zinc-400" />
              <div>
                <p className="font-medium text-white">Python Backend Server</p>
                <p className="text-[11px] text-zinc-400">{apiUrl}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono uppercase ${
              backendStatus?.online 
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
            }`}>
              {backendStatus?.online ? 'Connected' : 'Offline (Demo Mode)'}
            </span>
          </div>

          {/* API Base URL */}
          <div className="space-y-1.5">
            <label className="text-zinc-300 font-medium flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              Backend API Base URL
            </label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="http://localhost:8000"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400 transition-colors"
            />
          </div>

          {/* Voice Speech Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-zinc-300 font-medium flex items-center gap-2">
                <Volume2 className="w-3.5 h-3.5 text-sky-400" />
                Text-to-Speech Speed ({voiceRate}x)
              </label>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.4"
              step="0.1"
              value={voiceRate}
              onChange={(e) => setVoiceRate(parseFloat(e.target.value))}
              className="w-full accent-sky-400"
            />
          </div>

          {/* Auto Speak Toggle */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-zinc-300 font-medium">Automatic Voice Replies</span>
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`w-12 h-6 rounded-full transition-colors relative p-1 ${
                autoSpeak ? 'bg-sky-500' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  autoSpeak ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-black font-semibold text-sm transition-all shadow-[0_0_20px_rgba(56,189,248,0.3)]"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
