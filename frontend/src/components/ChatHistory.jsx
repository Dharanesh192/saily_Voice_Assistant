import React from 'react';
import { X, Bot, User, Trash2, Cpu } from 'lucide-react';

/**
 * Chat History & Command Logs Drawer
 */
export default function ChatHistory({ isOpen, onClose, history, onClearHistory }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-md transition-opacity">
      <div className="w-full max-w-md bg-zinc-950/90 border-l border-white/10 h-full p-6 flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-semibold text-white heading-font">Activity & Speech Logs</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Log List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center text-zinc-500">
              <Bot className="w-10 h-10 mb-2 stroke-[1.5] opacity-40" />
              <p className="text-sm">No speech interactions yet.</p>
              <p className="text-xs text-zinc-600 mt-1">Speak into the microphone to start recording.</p>
            </div>
          ) : (
            history.map((item, idx) => (
              <div key={idx} className="space-y-2">
                {/* User Prompt (Right Aligned) */}
                <div
                  className="flex items-start gap-2.5 justify-end"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-end',
                    gap: '0.625rem',
                    width: '100%',
                  }}
                >
                  <div
                    className="px-4 py-2.5 text-xs md:text-sm text-sky-200"
                    style={{
                      background: 'rgba(14, 165, 233, 0.15)',
                      border: '1px solid rgba(14, 165, 233, 0.3)',
                      borderRadius: '1.25rem 1.25rem 0.25rem 1.25rem',
                      maxWidth: '82%',
                    }}
                  >
                    {item.query}
                  </div>
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      borderRadius: '9999px',
                      background: 'rgba(14, 165, 233, 0.25)',
                      border: '1px solid rgba(14, 165, 233, 0.5)',
                      color: '#38bdf8',
                      flexShrink: 0,
                    }}
                  >
                    <User className="w-3.5 h-3.5" style={{ width: '14px', height: '14px' }} />
                  </div>
                </div>

                {/* Assistant Response (Left Aligned) */}
                <div
                  className="flex items-start gap-2.5"
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                    gap: '0.625rem',
                    width: '100%',
                  }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      width: '1.75rem',
                      height: '1.75rem',
                      borderRadius: '9999px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ffffff',
                      flexShrink: 0,
                    }}
                  >
                    <Bot className="w-3.5 h-3.5" style={{ width: '14px', height: '14px' }} />
                  </div>
                  <div
                    className="px-4 py-2.5 text-xs md:text-sm text-zinc-200"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '1.25rem 1.25rem 1.25rem 0.25rem',
                      maxWidth: '82%',
                    }}
                  >
                    <p>{item.response}</p>
                    {item.action && (
                      <span
                        className="inline-block text-[10px] font-mono px-2 py-0.5 rounded"
                        style={{
                          display: 'inline-block',
                          fontSize: '10px',
                          marginTop: '4px',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.1)',
                          color: '#7dd3fc',
                        }}
                      >
                        Action: {item.action}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <button
              onClick={onClearHistory}
              className="w-full py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Log History
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
