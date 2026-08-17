import os
import json
import time

MEMORY_DIR = os.path.dirname(__file__)
PERSONALITY_FILE = os.path.join(MEMORY_DIR, "saily_personality.json")
HISTORY_FILE = os.path.join(MEMORY_DIR, "history.json")

# 2-Day Retention Policy (48 hours = 172,800 seconds)
RETENTION_SECONDS = 2 * 24 * 60 * 60

def load_personality_context():
    """
    Loads Saily's personality profile and returns a structured system prompt string.
    """
    if os.path.exists(PERSONALITY_FILE):
        try:
            with open(PERSONALITY_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                tone = data.get("personality", {}).get("tone", "Friendly and helpful")
                name = data.get("assistant_name", "Saily")
                capabilities = ", ".join(data.get("capabilities", []))
                rules = " ".join(data.get("security_rules", []))
                
                return (
                    f"You are {name}, an {data.get('role', 'AI Voice Assistant')}. "
                    f"Tone: {tone}. Capabilities: {capabilities}. "
                    f"Rules: {rules}. Keep responses clear, natural, and concise (1-3 sentences)."
                )
        except Exception as e:
            print(f"Warning: Could not read personality file: {e}")

    return "You are Saily, a helpful, friendly AI voice assistant. Keep responses clear and concise."

def purge_expired_history(history):
    """
    Filters out any conversation turns older than 2 days (48 hours).
    """
    now = time.time()
    valid_turns = []
    for turn in history:
        ts = turn.get("timestamp", now)
        if (now - ts) <= RETENTION_SECONDS:
            valid_turns.append(turn)
    return valid_turns

def save_chat_turn(user_text, assistant_reply, action="executed"):
    """
    Saves a conversation turn to persistent history.json in backend/Memory,
    enforcing a 2-day automatic expiration purge.
    """
    history = []
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                history = json.load(f)
        except Exception:
            history = []

    # Purge any entries older than 2 days
    history = purge_expired_history(history)

    turn = {
        "timestamp": time.time(),
        "date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "user": user_text,
        "assistant": assistant_reply,
        "action": action
    }
    history.append(turn)

    # Keep last 100 turns max
    if len(history) > 100:
        history = history[-100:]

    try:
        with open(HISTORY_FILE, "w", encoding="utf-8") as f:
            json.dump(history, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Warning: Failed to save conversation history: {e}")

def get_recent_history(limit=4):
    """
    Returns string summary of recent non-expired conversation turns for Gemini context.
    """
    if not os.path.exists(HISTORY_FILE):
        return ""

    try:
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            history = json.load(f)

        # Purge entries older than 2 days
        clean_history = purge_expired_history(history)

        # Re-save if items were purged
        if len(clean_history) != len(history):
            try:
                with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                    json.dump(clean_history, f, indent=2, ensure_ascii=False)
            except Exception:
                pass

        recent = clean_history[-limit:]
        if not recent:
            return ""
        
        lines = []
        for item in recent:
            lines.append(f"User: {item.get('user', '')}")
            lines.append(f"Saily: {item.get('assistant', '')}")
        return "\n".join(lines)
    except Exception:
        return ""
