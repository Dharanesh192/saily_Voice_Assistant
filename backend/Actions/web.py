import webbrowser
import os
# pyrefly: ignore [missing-import]
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from tavily import TavilyClient

load_dotenv()  # Load environment variables from .env file

def websearch(question):
    try:
        Client_AI = os.getenv("Tavily_AI")
        if not Client_AI:
            return "Tavily AI API key not configured."
        client = TavilyClient(api_key=Client_AI)
        res = client.search(
            query=question,
            search_depth="basic",
            max_results=3,
            include_answer=True
        )
        answer = res.get("answer")
        if answer and len(str(answer).strip()) > 10:
            return str(answer).strip()

        results = res.get("results", [])
        if results and len(results) > 0:
            snippet = results[0].get("content", "").strip()
            if snippet:
                return snippet[:300]

        return f"I researched '{question}' on the web: No direct answer found."
    except Exception as e:
        return f"Search error: {e}"

def website(web):
    try:
        name = web.strip()
        clean_url = web.strip()
        if not clean_url.startswith("http://") and not clean_url.startswith("https://"):
            if not any(clean_url.endswith(ext) for ext in [".com", ".org", ".net", ".io", ".edu", ".gov", ".co"]):
                clean_url += ".com"
            clean_url = "https://www." + clean_url
        webbrowser.open(clean_url)
        return f"Website '{name}' opened successfully."
    except Exception as e:
        return f"Failed to open website '{name}' because of {e}"
