from tavily import TavilyClient
import webbrowser

def websearch(question):
    client = TavilyClient("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")
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
