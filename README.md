# GitHub AI DevOps Agent — Quick Overview

A web-first AI DevOps assistant that performs common GitHub tasks from plain-English instructions. Use the web dashboard to interact with the agent (FastAPI + Uvicorn). The repository contains a few helper scripts for validating credentials and inspecting available MCP tools.

## Quick Start

1. Create a Python 3.10+ virtual environment and install dependencies:

```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate
pip install -r requirements.txt
```

2. Add required environment variables (create `.env` in the project root):

```text
GOOGLE_API_KEY=your_gemini_api_key
GITHUB_PERSONAL_ACCESS_TOKEN=your_github_pat
GITHUB_USERNAME=your_github_username
```

3. Run the web server:

```bash
python -m uvicorn app:app --reload --port 8000
```

Open: http://127.0.0.1:8000

## Useful Commands

- Validate credentials: `python test_mcp_client.py`
- List MCP tools: `python inspect_mcp_tools.py`

## Project Structure

- `app.py` — FastAPI web server (main entrypoint)
- `static/` — Frontend assets: `index.html`, `style.css`, `app.js`
- `test_mcp_client.py` — Credentials validator
- `inspect_mcp_tools.py` — MCP tools inspector

## Environment Variables

- `GOOGLE_API_KEY` — Gemini API key (required)
- `GITHUB_PERSONAL_ACCESS_TOKEN` — GitHub PAT (scopes: `repo`, `workflow`, `read:org`) (required)
- `GITHUB_USERNAME` — Your GitHub username (required)

## Troubleshooting

- If the server won't start, verify the `.env` values and check port conflicts.
- If MCP tools are missing, make sure Node.js is installed and the MCP server is available.

## Contributing

Contributions welcome. This project is MIT licensed.
