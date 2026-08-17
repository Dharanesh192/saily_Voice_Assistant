import joblib
from backend.Actions.web import websearch, website
from backend.Actions.Local_cmd import system, Applicate, Runprogram, create
from backend.Actions.Gemini import gemini

MODEL_PATH = "backend/Decision/saily_model.pkl"

try:
    model = joblib.load(MODEL_PATH)
except Exception as e:
    print(f"Warning: Model load failed from {MODEL_PATH}: {e}")
    model = None

def predict_command(text):
    text_lower = text.lower()

    # Instant Deletion Protection Shield
    if any(del_kw in text_lower for del_kw in ["delete", "remove", "rm ", "del ", "unlink"]):
        ans = "Permission is not granted for deleting things in the system"
        print(f"[Security Shield]: {ans}")
        return ans

    if not model:
        return gemini(text, "question")

    probabilities = model.predict_proba([text])[0]
    classes = model.classes_
    best_index = probabilities.argmax()
    keyword = str(classes[best_index])
    confidence = float(probabilities[best_index])

    function_map = {
        "show files": "system_commands",
        "show hidden files": "system_commands",
        "current directory": "system_commands",
        "change directory": "system_commands",
        "move directory": "system_commands",
        "sleep": "system_commands",
        "lock": "system_commands",
        "restart": "system_commands",
        "ip address": "system_commands",
        "hostname": "system_commands",
        "system info": "system_commands",
        "calculator": "Application",
        "open file manager": "Application",
        "notepad": "Application",
        "terminal": "Application",
        "cmd": "Application",
        "vs code": "Application",
        "task manager": "Application",
        "runprogram": "Runprogram",
        "website": "website",
        "web search": "websearch",
        "question": "gemini",
        "personality": "gemini",
        "unknown": "Unknown",
    }

    function = function_map.get(keyword, "Unknown")

    result = {
        "Function": function,
        "keyword": keyword,
        "confidence": confidence
    }

    if result["Function"] == "system_commands":
        raw_output = system(result["keyword"])
        if raw_output and len(raw_output) > 20:
            ans = gemini(raw_output, "system_summary")
        else:
            ans = raw_output or "Command executed successfully."
        print(f"[System Summary]: {ans}")
        return ans

    elif result["Function"] == "Unknown":
        try:
            res = gemini(text, "create")
            if isinstance(res, tuple) and len(res) == 3:
                action, name, target_dir = res
            elif isinstance(res, tuple) and len(res) == 2:
                action, name = res
                target_dir = ""
            else:
                action, name, target_dir = "create folder", str(res), ""

            if action == "delete":
                ans = "Permission is not granted for deleting things in the system"
                print(f"[Security Shield]: {ans}")
                return ans

            ans = create(action, name, target_dir)
            print(f"[Create Action]: {ans}")
            return ans
        except Exception:
            ans = gemini(text, "question")
            print(f"[Saily AI]: {ans}")
            return ans

    elif result["Function"] == "Application":
        app_name = gemini(text, "application")
        ans = Applicate(app_name)
        print(f"[Application Action]: {ans}")
        return ans

    elif result["Function"] == "Runprogram":
        file_name = gemini(text, "file name")
        ans = Runprogram(file_name)
        print(f"[Run Program Action]: {ans}")
        return ans

    elif result["Function"] == "websearch":
        ans = websearch(text)
        print(f"[Web Search]: {ans}")
        return ans

    elif result["Function"] == "website":
        web_url = gemini(text, "website name")
        ans = website(web_url)
        print(f"[Website Action]: {ans}")
        return ans

    elif result["Function"] == "gemini":
        ans = gemini(text, result["keyword"])
        print(f"[Saily AI]: {ans}")
        return ans

    else:
        ans = gemini(text, "error")
        print(f"[Error Handler]: {ans}")
        return ans

if __name__ == "__main__":
    test_query = input("Enter test voice command: ")
    predict_command(test_query)
