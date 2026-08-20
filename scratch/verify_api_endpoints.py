import urllib.request, json

try:
    with urllib.request.urlopen("http://127.0.0.1:8000/health") as res:
        data = json.loads(res.read())
        print("API health check:", data)
except Exception as e:
    print("API health check offline or in mock environment:", e)
