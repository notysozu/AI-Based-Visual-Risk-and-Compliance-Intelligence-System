import sys
import os

# Ensure the root directory is available in the Python module search path
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

from backend.main import app

# Expose app for Vercel Serverless Python runtime
handler = app
