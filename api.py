from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import re
from pathlib import Path
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
api = FastAPI()
MEMORY_FOLDER = "memory"

api.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # change to ai.guahh.net after confirming functionality
    allow_credentials=False,
)

def get_latest_memory_file():
    memory_dir = Path(MEMORY_FOLDER)
    if not memory_dir.exists():
        return None

    memory_files = list(memory_dir.glob("v*.json"))
    if not memory_files:
        return None

    def parse_version(filename):
        match = re.match(r'v(\d+)-(\d+)\.json', filename.name)
        if match:
            major, minor = map(int, match.groups())
            return major, minor
        return 0, 0

    latest_file = max(memory_files, key=lambda f: parse_version(f))
    return latest_file

@api.get("/memory/latest")
async def get_latest_memory():
    logger.info("Request for latest memory file")
    memory_file = get_latest_memory_file()
    if not memory_file or not memory_file.exists():
        logger.warning("No memory files found")
        raise HTTPException(status_code=404, detail="No memory files found")

    try:
        with open(memory_file, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        logger.info(f"Successfully loaded latest memory file: {memory_file.name}")
        return data
    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Error loading latest memory file {memory_file.name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading memory file: {str(e)}")

@api.get("/memory/v{version}-{subversion}")
async def get_specific_memory_version(version: int, subversion: int):
    logger.info(f"Request for specific memory version: v{version}-{subversion}")
    filename = f"v{version}-{subversion}.json"
    memory_file = Path(MEMORY_FOLDER) / filename

    if not memory_file.exists():
        logger.warning(f"Memory version {version}-{subversion} not found")
        raise HTTPException(status_code=404, detail=f"Memory version {version}-{subversion} not found")

    try:
        with open(memory_file, 'r', encoding='utf-8-sig') as f:
            data = json.load(f)
        logger.info(f"Successfully loaded latest memory file: {memory_file.name}")
        return data
    except (json.JSONDecodeError, IOError) as e:
        logger.error(f"Error loading latest memory file {memory_file.name}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error loading memory file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(api, host="127.0.0.1", port=5858, reload=True)