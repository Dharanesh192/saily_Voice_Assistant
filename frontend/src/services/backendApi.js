/**
 * Backend API Client
 * Connects React frontend directly to Python FastAPI backend server (http://localhost:8000),
 * with fallback handling when the backend server is offline.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      return { online: true, data };
    }
  } catch {
    // Backend offline / standard fallback mode
  }
  return { online: false };
};

export const processVoiceQuery = async (queryText, signal = null) => {
  const cleanQuery = queryText.trim().toLowerCase();
  
  // Send transcribed text from frontend STT directly to Python FastAPI backend endpoint
  try {
    const fetchOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: queryText }),
    };

    if (signal) {
      fetchOptions.signal = signal;
    } else {
      fetchOptions.signal = AbortSignal.timeout(12000);
    }

    const response = await fetch(`${API_BASE_URL}/voice`, fetchOptions);

    if (response.ok) {
      const data = await response.json();
      return {
        text: data.reply || data.message || "Command executed successfully.",
        action: data.action || "response",
        source: "fastapi_backend",
      };
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.log("FastAPI backend not reachable, utilizing Saily fallback routing:", err.message);
  }

  // Fallback / Demo Assistant Intelligence if FastAPI server is stopped
  if (cleanQuery.includes("hello") || cleanQuery.includes("hey") || cleanQuery.includes("hi")) {
    return {
      text: "Hello! I am Saily, your intelligent voice assistant. How can I help you today?",
      action: "greeting",
      source: "saily_core",
    };
  }

  if (cleanQuery.includes("time") || cleanQuery.includes("clock")) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      text: `The current time is ${timeStr}.`,
      action: "get_time",
      source: "saily_core",
    };
  }

  if (cleanQuery.includes("date") || cleanQuery.includes("today")) {
    const now = new Date();
    const dateStr = now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    return {
      text: `Today is ${dateStr}.`,
      action: "get_date",
      source: "saily_core",
    };
  }

  if (cleanQuery.includes("open") || cleanQuery.includes("launch")) {
    const target = cleanQuery.replace(/open|launch/g, "").trim();
    return {
      text: `Opening ${target || "requested application"} for you.`,
      action: "launch_app",
      target: target,
      source: "saily_actions",
    };
  }

  return {
    text: `I processed your request: "${queryText}". Standing by for further commands.`,
    action: "general_response",
    source: "saily_neural",
  };
};
