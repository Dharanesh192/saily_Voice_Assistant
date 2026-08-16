import joblib
from backend.Actions.web import websearch
from backend.Actions.web import website
from backend.Actions.Local_cmd import system
from backend.Actions.Local_cmd import Applicate
from backend.Actions.Local_cmd import Runprogram
from backend.Actions.Gemini import gemini

MODEL_PATH = "backend/Decision/saily_model.pkl"

model = joblib.load(MODEL_PATH)

def predict_command(text):
    probabilities = model.predict_proba([text])[0]
    classes = model.classes_
    best_index = probabilities.argmax()
    keyword = str(classes[best_index])
    confidence = float(probabilities[best_index])
    function_map = {

        # -------------------------
        # System commands
        # -------------------------
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

        # -------------------------
        # Applications
        # -------------------------
        "calculator": "Application",
        "open file manager": "Application",
        "notepad": "Application",
        "terminal": "Application",
        "cmd": "Application",
        "vs code": "Application",
        "task manager": "Application",

        # -------------------------
        # Program execution
        # -------------------------
        "runprogram": "Runprogram",

        # -------------------------
        # Website
        # -------------------------
        "website": "website",

        # -------------------------
        # Web search
        # -------------------------
        "web search": "websearch",

        # -------------------------
        # Gemini
        # -------------------------
        "question": "gemini",
        "personality": "gemini",

        # -------------------------
        # Unknown / file operations
        # -------------------------
        "unknown": "Unknown",
    }

    function = function_map.get(keyword, "Unknown")

    result = {
        "Function": function,
        "keyword": keyword,
        "confidence": confidence
    }

    if result["Function"] == "system_commands":
        ans = system(result["keyword"])
        print(ans)

    elif result["Function"] == "Unknown":
        ans = gemini(text, "create")
        print(ans)

    elif result["Function"] == "Application":
        Applicate(result["keyword"])

    elif result["Function"] == "Runprogram":
        gemini(text, "file name")


    elif result["Function"] == "websearch":
        ans = websearch(text)
        print(ans)

    elif result["Function"] == "website":
        gemini(text, "website name")


    elif result["Function"] == "gemini":
        gemini(text,result["keyword"])

    else:
        gemini(text,"error")
