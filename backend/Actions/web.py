import webbrowser
import os
from dotenv import load_dotenv
from tavily import TavilyClient

load_dotenv()  # Load environment variables from .env file

def websearch(question):
    Client_AI = os.getenv("Tavily_AI")
    client = TavilyClient(api_key=Client_AI)
    res = client.search(
        query = question,
        search_depth = "basic",
        max_results = 3,
        include_answer = True
    )
    return (res["answer"])

def website(web):
    try:
        web += ".com"
        webbrowser.open(web)
        return f"Website '{web}' opened successfully."
    except Exception as e:
        return f"Failed to open website '{web}'because of {e}"
