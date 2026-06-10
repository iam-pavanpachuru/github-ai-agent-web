"""GitHub AI Agent - Web Dashboard Server

FastAPI application providing a beautiful web dashboard for controlling GitHub 
through natural language using AI. The application integrates with the GitHub MCP 
(Model Context Protocol) server for GitHub operations and uses Google Gemini for LLM reasoning.

═════════════════════════════════════════════════════════════════════════════════

🚀 Quick Start:
    python -m uvicorn app:app --reload
    Then open: http://127.0.0.1:8000

📝 Environment Variables Required (in .env):
    GOOGLE_API_KEY                  → Gemini API key from aistudio.google.com
    GITHUB_PERSONAL_ACCESS_TOKEN    → GitHub PAT with repo, workflow scopes
    GITHUB_USERNAME                 → Your GitHub username

🔌 API Endpoints:
    GET  /                  Serve dashboard UI (static/index.html)
    GET  /api/status        Get system status, username, and available tools
    GET  /api/stream-run    Execute task with real-time SSE streaming

✨ Features:
    • Real-time task streaming with Server-Sent Events (SSE)
    • Beautiful glassmorphic dashboard UI
    • Tool execution tracking and visualization
    • Activity feed with command history
    • Safety confirmation for destructive operations
    • Automatic model fallback on failures
    • Rich error messages and status updates

🏗️ Architecture:
    Web Dashboard UI
         ↓
    FastAPI Backend (async)
         ↓
    ReAct Agent (LangGraph)
         ↓
    Gemini LLM (reasoning)
         ↓
    Tool Layer
    ├─ GitHub MCP Server (30+ tools)
    └─ Custom Tools (delete_repository)
         ↓
    GitHub REST API

═════════════════════════════════════════════════════════════════════════════════
"""
import asyncio
import os
import json
import re
import requests
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

TOKEN = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
USERNAME = os.getenv("GITHUB_USERNAME")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import Tool

# =========================
# 🔧 CUSTOM DELETE TOOL
# =========================
def delete_github_repo(repo_name: str) -> str:
    """Delete a GitHub repository for the authenticated user.
    
    Args:
        repo_name: Repository name (not full URL)
        
    Returns:
        Status message with success or error details
    """
    url = f"https://api.github.com/repos/{USERNAME}/{repo_name}"
    headers = {
        "Authorization": f"token {TOKEN}",
        "Accept": "application/vnd.github+json"
    }
    response = requests.delete(url, headers=headers)
    if response.status_code == 204:
        return f"✅ Repository '{repo_name}' deleted successfully."
    elif response.status_code == 404:
        return f"❌ Repository '{repo_name}' not found."
    else:
        return f"❌ Failed to delete repo. Status: {response.status_code}, Response: {response.text}"

# Wrap as LangChain tool
delete_repo_tool = Tool(
    name="delete_repository",
    func=delete_github_repo,
    description="""
Delete a GitHub repository.
Input should be the repository name ONLY (not full URL).
Example:
devops-test-demo
"""
)

# Initialize FastAPI
app = FastAPI(title="GitHub AI Agent Service")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve Frontend static files
# Place static folder setup
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_dashboard() -> str:
    """Serve the web dashboard UI.
    
    Returns:
        HTML content of the dashboard
    """
    with open("static/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.get("/api/status")
async def get_status() -> dict:
    """Get system status: credentials, connected tools, and available models.
    
    Returns:
        JSON with status, username, models list, and available tools
    """
    if not TOKEN or not USERNAME or not GOOGLE_API_KEY:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": "Environment variables GITHUB_PERSONAL_ACCESS_TOKEN, GITHUB_USERNAME, or GOOGLE_API_KEY are missing."
            }
        )

    try:
        # Load tools dynamically to show what's available
        client = MultiServerMCPClient(
            {
                "github": {
                    "command": "npx",
                    "args": ["-y", "@modelcontextprotocol/server-github"],
                    "env": {
                        "GITHUB_PERSONAL_ACCESS_TOKEN": TOKEN
                    },
                    "transport": "stdio"
                }
            }
        )
        tools = await client.get_tools()
        tools_list = []
        for t in tools:
            tools_list.append({
                "name": t.name,
                "description": t.description or "No description provided."
            })
        
        # Add custom tool
        tools_list.append({
            "name": delete_repo_tool.name,
            "description": delete_repo_tool.description
        })

        return {
            "status": "connected",
            "username": USERNAME,
            "models": ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-3.1-flash-lite-preview"],
            "tools": tools_list
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={
                "status": "error",
                "message": f"Failed to connect to MCP Server: {str(e)}"
            }
        )

@app.get("/api/stream-run")
async def stream_run(task: str = Query(...), confirm: bool = Query(False)):
    """
    Runs the agent task and streams real-time updates using Server-Sent Events (SSE).
    """
    # Safety confirmation check for deletions
    if "delete" in task.lower() and not confirm:
        # Try to extract the repository name using a regex
        match = re.search(r'delete\s+(?:the\s+)?(?:repository|repo)?\s*[`\'\"]?([a-zA-Z0-9\-_.]+)[`\'\"]?', task, re.IGNORECASE)
        repo_name = match.group(1) if match else "this repository"
        
        async def confirm_required_generator():
            yield f"data: {json.dumps({'type': 'confirm_required', 'repo': repo_name})}\n\n"
        return StreamingResponse(confirm_required_generator(), media_type="text/event-stream")

    async def event_generator():
        yield f"data: {json.dumps({'type': 'status', 'message': '🔌 Initializing GitHub MCP Server connection...'})}\n\n"
        
        try:
            client = MultiServerMCPClient(
                {
                    "github": {
                        "command": "npx",
                        "args": ["-y", "@modelcontextprotocol/server-github"],
                        "env": {
                            "GITHUB_PERSONAL_ACCESS_TOKEN": TOKEN
                        },
                        "transport": "stdio"
                    }
                }
            )
            mcp_tools = await client.get_tools()
            tools = mcp_tools + [delete_repo_tool]
            yield f"data: {json.dumps({'type': 'status', 'message': f'✅ GitHub MCP connected — {len(mcp_tools)} tools and 1 custom tool loaded.'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': f'❌ Failed to connect to MCP client: {str(e)}'})}\n\n"
            return

        models = [
            "gemini-3.1-flash-lite-preview",
            "gemini-2.5-flash"
        ]
        
        success = False
        for model_name in models:
            yield f"data: {json.dumps({'type': 'status', 'message': f'🚀 Starting run with model: {model_name}'})}\n\n"
            
            try:
                llm = ChatGoogleGenerativeAI(
                    model=model_name,
                    temperature=0,
                    max_retries=2,
                    request_timeout=60
                )
                agent = create_react_agent(llm, tools)
            except Exception as e:
                yield f"data: {json.dumps({'type': 'warning', 'message': f'⚠️ Model {model_name} init failed, skipping: {str(e)}'})}\n\n"
                continue

            try:
                yield f"data: {json.dumps({'type': 'status', 'message': '🧠 Agent is reasoning and executing actions...'})}\n\n"
                
                last_agent_message = ""
                # Execute agent with LangGraph streaming updates
                async for chunk in agent.astream({
                    "messages": [
                        {
                            "role": "user",
                            "content": f"""
You are a Senior DevOps engineer.

GitHub username: {USERNAME}

Rules:
- Use available tools when needed
- If deleting a repo, call delete_repository tool
- Be precise and safe
- When listing or searching repositories, always request perPage=100 to ensure ALL repositories are returned, not just the first page. Never stop at 25 or 30 results — fetch everything.

Task:
{task}
"""
                        }
                    ]
                }):
                    if "agent" in chunk:
                        msg = chunk["agent"]["messages"][-1]
                        if hasattr(msg, "tool_calls") and msg.tool_calls:
                            for tc in msg.tool_calls:
                                yield f"data: {json.dumps({'type': 'tool_call', 'tool': tc['name'], 'args': tc['args']})}\n\n"
                        elif msg.content:
                            thought_text = msg.content
                            if isinstance(thought_text, list):
                                thought_text = "".join([part.get("text", "") for part in thought_text if isinstance(part, dict) and "text" in part])
                            else:
                                thought_text = str(thought_text)
                            
                            last_agent_message = thought_text
                            yield f"data: {json.dumps({'type': 'thought', 'message': thought_text})}\n\n"
                    
                    elif "tools" in chunk:
                        msg = chunk["tools"]["messages"][-1]
                        yield f"data: {json.dumps({'type': 'tool_result', 'tool': msg.name, 'result': str(msg.content)})}\n\n"

                # Extract the final result from accumulated messages
                final_output = last_agent_message or "Task completed successfully."
                yield f"data: {json.dumps({'type': 'success', 'message': final_output})}\n\n"
                success = True
                break

            except Exception as e:
                yield f"data: {json.dumps({'type': 'warning', 'message': f'⚠️ Attempt with {model_name} failed: {str(e)}'})}\n\n"
                await asyncio.sleep(2)

        if not success:
            yield f"data: {json.dumps({'type': 'error', 'message': '❌ Max retries reached. All models failed to complete.'})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


# =========================
# 📖 APPLICATION START
# =========================
if __name__ == "__main__":
    """
    Entry point for the GitHub AI Agent web server.
    
    Usage:
        python -m uvicorn app:app --reload
    
    Then open in browser:
        http://127.0.0.1:8000
    
    The --reload flag enables auto-restart on code changes (development mode).
    Remove it for production.
    
    Environment Variables Required (from .env):
        - GOOGLE_API_KEY: Gemini API key
        - GITHUB_PERSONAL_ACCESS_TOKEN: GitHub personal access token
        - GITHUB_USERNAME: Your GitHub username
    
    Endpoints:
        GET  /                 → Serve dashboard UI
        GET  /api/status       → Get system status and tools
        GET  /api/stream-run   → Execute task with real-time streaming
    """
    import uvicorn
    
    print("\n" + "=" * 60)
    print("🚀 GitHub AI Agent - Web Server Starting")
    print("=" * 60)
    print("\n📍 Open in browser: http://127.0.0.1:8000\n")
    
    uvicorn.run(
        app,
        host="127.0.0.1",
        port=8000,
        reload=True,
        access_log=True
    )