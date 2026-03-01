import urllib.request
import json
req = urllib.request.Request("http://127.0.0.1:8000/dashboard-data")
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read())
    print("BACKEND DATA VERSION:", data.get('version'))
    d = data.get('data') or {}
    print("Emps:", len(d.get('employees', [])))
    print("Projs:", len(d.get('projects', [])))
    print("Tasks:", len(d.get('tasks', [])))
    print("Trans:", len(d.get('transactions', [])))
