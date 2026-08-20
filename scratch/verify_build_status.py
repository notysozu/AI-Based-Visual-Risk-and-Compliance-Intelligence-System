import subprocess

res = subprocess.run("npm --prefix frontend run build", shell=True, capture_output=True, text=True)
print("Frontend build status code:", res.returncode)
