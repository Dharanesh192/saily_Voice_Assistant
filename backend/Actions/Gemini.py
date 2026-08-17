import os
import re
import json
import platform
from dotenv import load_dotenv

# Import memory & personality helpers
from backend.Memory.conversation_memory import load_personality_context, get_recent_history

# Load environment variables from both backend/.env and root .env
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(BASE_DIR, ".env"))
load_dotenv(os.path.join(os.path.dirname(BASE_DIR), ".env"))
load_dotenv()

gemini_api_key = os.getenv("Gemini_API") or os.getenv("GEMINI_API_KEY")

genai_client = None

if gemini_api_key:
    try:
        from google import genai
        genai_client = genai.Client(api_key=gemini_api_key)
    except Exception as e:
        print(f"Warning: Could not initialize google.genai client: {e}")
else:
    print("Warning: Gemini API Key not found in environment variables.")

def call_gemini_api(prompt_text, system_instruction=""):
    """
    Helper to call Gemini API via official google.genai SDK.
    """
    if not genai_client:
        return None

    full_prompt = f"{system_instruction}\n\nUser Request: {prompt_text}" if system_instruction else prompt_text

    # Try supported models
    for model_name in ["gemini-2.5-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash-latest"]:
        try:
            response = genai_client.models.generate_content(
                model=model_name,
                contents=full_prompt,
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            print(f"Gemini API Model Error ({model_name}): {e}")
            continue
    return None

def gemini(question, action):
    """
    Multi-purpose Gemini AI Router handling specialized operational modes:
    1. 'question' / 'personality' -> Saily AI Q&A with persistent personality & chat memory
    2. 'create' -> Entity extraction for file/folder operations (action, name, target_dir)
    3. 'application' / 'Applicate' -> Application name mapping
    4. 'file name' / 'run_program' -> Target script filename extraction
    5. 'website name' / 'website' -> Web URL/domain extraction
    6. 'compiler_command' -> Universal compile & run command finder for any programming language
    7. 'app_launch_command' -> Dynamic launch command for unmapped desktop applications
    8. 'system_summary' -> Verbose terminal stdout summarizer for voice responses
    9. 'error' -> Error diagnosis and user-friendly explanation
    """
    clean_action = str(action).lower().strip()
    clean_question = str(question).strip()

    # -------------------------------------------------------------
    # Mode 1: AI Features, Personality & General Q&A (with Memory)
    # -------------------------------------------------------------
    if clean_action in ["question", "personality", "chat", "ai"]:
        personality_context = load_personality_context()
        chat_history = get_recent_history(limit=4)
        
        system_prompt = personality_context
        if chat_history:
            system_prompt += f"\n\nRecent Conversation History:\n{chat_history}"

        ai_response = call_gemini_api(clean_question, system_prompt)
        if ai_response:
            return ai_response
        return "I am Saily, your intelligent voice assistant. How else can I assist you?"

    # -------------------------------------------------------------
    # Mode 2: Multi-Directory File/Folder Operation Extraction
    # -------------------------------------------------------------
    elif clean_action in ["copy", "move", "rename", "create", "file_op", "folder_op"]:
        system_prompt = (
            "Extract file/folder command details from user request.\n"
            "Detect if user wants to delete/remove anything (Action: 'delete').\n"
            "Valid Actions: 'create folder', 'create file', 'copy file', 'move file', 'rename file', 'delete'.\n"
            "If user specifies a target folder (e.g. 'in the code folder'), extract 'target_dir'.\n"
            "Return JSON format ONLY: {\"action\": \"<valid_action>\", \"name\": \"<target_name>\", \"target_dir\": \"<target_dir_or_empty>\"}.\n"
            "Example: 'create main.py in code folder' -> {\"action\": \"create file\", \"name\": \"main.py\", \"target_dir\": \"code\"}\n"
            "Example: 'delete test.txt' -> {\"action\": \"delete\", \"name\": \"test.txt\", \"target_dir\": \"\"}"
        )
        ai_response = call_gemini_api(clean_question, system_prompt)
        if ai_response:
            try:
                json_match = re.search(r'\{.*\}', ai_response, re.DOTALL)
                if json_match:
                    data = json.loads(json_match.group(0))
                    act = data.get("action", "create folder")
                    name = data.get("name", "new_item")
                    tdir = data.get("target_dir", "")
                    return act, name, tdir
            except Exception:
                pass

        # Fallback parsing
        q_lower = clean_question.lower()
        if "delete" in q_lower or "remove" in q_lower or "del" in q_lower or "rm" in q_lower:
            return "delete", clean_question, ""
        
        if "file" in q_lower:
            words = clean_question.split()
            name = words[-1] if words else "new_file.txt"
            return "create file", name, ""
        else:
            words = clean_question.split()
            name = words[-1] if words else "new_folder"
            return "create folder", name, ""

    # -------------------------------------------------------------
    # Mode 3: App Finder for Applicate()
    # -------------------------------------------------------------
    elif clean_action in ["open", "applicate", "application", "app", "open_app"]:
        system_prompt = (
            "Map user request to exact supported application key or return app name.\n"
            "Valid Hardcoded Keys: 'calculator', 'open file manager', 'notepad', 'terminal', 'cmd', 'vs code', 'task manager'.\n"
            "If user asks for an app not in hardcoded keys (e.g. Spotify, Chrome, Discord), return the clean app name string.\n"
            "Return ONLY the key or app name string without quotes or punctuation."
        )
        ai_response = call_gemini_api(clean_question, system_prompt)
        if ai_response:
            clean_app = ai_response.lower().replace("'", "").replace('"', "").strip()
            return clean_app

        q_lower = clean_question.lower()
        if "calc" in q_lower: return "calculator"
        if "note" in q_lower: return "notepad"
        if "code" in q_lower or "vs" in q_lower: return "vs code"
        if "task" in q_lower: return "task manager"
        if "file" in q_lower or "explorer" in q_lower: return "open file manager"
        if "cmd" in q_lower: return "cmd"
        return clean_question

    # -------------------------------------------------------------
    # Mode 4: File Name Finder for Runprogram()
    # -------------------------------------------------------------
    elif clean_action in ["runprogram", "file name", "run_program", "script"]:
        system_prompt = (
            "Extract target script or program filename (with extension if present) from user speech.\n"
            "Return ONLY the file name string (e.g., 'main.py', 'test.js', 'app.rb')."
        )
        ai_response = call_gemini_api(clean_question, system_prompt)
        if ai_response:
            return ai_response.replace("'", "").replace('"', "").strip()

        words = clean_question.split()
        return words[-1] if words else "main.py"

    # -------------------------------------------------------------
    # Mode 5: Website URL Extractor for website()
    # -------------------------------------------------------------
    elif clean_action in ["website", "website name", "url", "web"]:
        system_prompt = (
            "Extract clean website domain name or full URL from user request.\n"
            "Example: 'open youtube' -> 'youtube.com', 'go to github' -> 'github.com'.\n"
            "Return ONLY the clean domain or URL string."
        )
        ai_response = call_gemini_api(clean_question, system_prompt)
        if ai_response:
            domain = ai_response.replace("'", "").replace('"', "").strip()
            if not domain.startswith("http") and not domain.endswith(".com") and not domain.endswith(".org") and not domain.endswith(".net"):
                domain += ".com"
            return domain

        words = clean_question.lower().split()
        target = words[-1] if words else "google"
        target = target.replace("https://", "").replace("http://", "").replace("www.", "")
        if "." not in target:
            target += ".com"
        return target

    # -------------------------------------------------------------
    # Mode 6: Universal Code Compiler & Run Command Finder
    # -------------------------------------------------------------
    elif clean_action in ["compiler_command", "compile", "run_cmd"]:
        os_type = platform.system()
        system_prompt = (
            f"Generate terminal command to compile and execute program file on {os_type}.\n"
            "Target file: " + clean_question + "\n"
            "Examples:\n"
            "  Windows: 'php app.php', 'ruby script.rb', 'swift main.swift'\n"
            "  Linux: 'php app.php', 'ruby script.rb', 'swift main.swift'\n"
            "Return ONLY the clean command string without markdown code fences."
        )
        ai_response = call_gemini_api(clean_question, system_prompt)
        if ai_response:
            clean_cmd = ai_response.replace("`", "").strip()
            return clean_cmd
        
        # Fallback basic interpreter runner
        name, ext = os.path.splitext(clean_question)
        ext = ext.lower()
        if ext == ".php": return f"php {clean_question}"
        if ext == ".rb": return f"ruby {clean_question}"
        if ext == ".swift": return f"swift {clean_question}"
        if ext == ".sh": return f"bash {clean_question}"
        return f"python {clean_question}"

    # -------------------------------------------------------------
    # Mode 7: Dynamic Unmapped Application Launch Command Finder
    # -------------------------------------------------------------
    elif clean_action in ["app_launch_command", "app_command", "unmapped_app"]:
        os_type = platform.system()
        system_prompt = (
            f"Generate exact terminal command to launch target application on {os_type}.\n"
            "Target application requested by user: " + clean_question + "\n"
            "Examples:\n"
            "  Windows: 'start spotify:', 'start chrome', 'start vlc', 'start mspaint', 'start discord:'\n"
            "  Linux: 'spotify', 'google-chrome', 'vlc', 'discord'\n"
            "Return ONLY the clean terminal launch command string without quotes or markdown code fences."
        )
        ai_response = call_gemini_api(clean_question, system_prompt)
        if ai_response:
            return ai_response.replace("`", "").replace("'", "").replace('"', "").strip()
        
        return f"start {clean_question}" if os_type == "Windows" else clean_question

    # -------------------------------------------------------------
    # Mode 8: System Command Raw Output Summarizer
    # -------------------------------------------------------------
    elif clean_action in ["system_summary", "summarize_system", "system_output"]:
        system_prompt = (
            "You are Saily, an intelligent desktop voice assistant.\n"
            "The user executed a system command and here is the raw terminal stdout.\n"
            "Extract the key answer (e.g. IPv4 address, host name, memory info, file list).\n"
            "Return a clear, natural, 1-sentence voice-friendly answer directly answering the command output.\n"
            "Do NOT include any 'User Question:' prefix, 'Raw Terminal Output:', or debug text.\n"
            "Example stdout with ipconfig -> Return 'Your IPv4 address is 10.252.97.99.'"
        )
        ai_response = call_gemini_api(clean_question, system_prompt)
        if ai_response:
            clean_res = re.sub(r'^(User Question|Raw Terminal Output|Your IP details|Summary):\s*', '', ai_response, flags=re.IGNORECASE).strip()
            return clean_res

        # Fallback local regex parsing if API call fails
        lines = [l.strip() for l in clean_question.split("\n") if l.strip()]
        ip_lines = [l for l in lines if ("IPv4 Address" in l or "IPv4" in l) and ":" in l]
        if ip_lines:
            ip_val = ip_lines[0].split(":")[-1].strip()
            return f"Your IPv4 address is {ip_val}."
        
        host_lines = [l for l in lines if "Host Name" in l and ":" in l]
        if host_lines:
            host_val = host_lines[0].split(":")[-1].strip()
            return f"Your system host name is {host_val}."

        return "Command executed successfully."

    # -------------------------------------------------------------
    # Mode 9: Error Recovery & User Troubleshooting
    # -------------------------------------------------------------
    elif clean_action in ["error", "fail", "fallback"]:
        system_prompt = (
            "The voice command resulted in an unexpected error or unknown request.\n"
            "Provide a polite, friendly error explanation and suggest how the user can rephrase."
        )
        ai_response = call_gemini_api(clean_question, system_prompt)
        if ai_response:
            return ai_response
        return f"I encountered an issue executing: '{clean_question}'. Please try rephrasing your command."

    return f"Saily AI: Processed '{clean_question}' for action '{clean_action}'."