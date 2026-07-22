import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

# Tests must be deterministic, offline, and free of external provider cost even
# when a developer has configured Gemini in a local ignored .env file.
os.environ["OPSBRAIN_GEMINI_API_KEY"] = ""
