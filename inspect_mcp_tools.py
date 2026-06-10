"""
Inspect Available GitHub MCP Tools

This utility connects to the GitHub MCP (Model Context Protocol) server
and lists all available tools that can be used by the AI agent.

Use this to:
    ✅ Verify MCP server is working
    ✅ See available GitHub operations
    ✅ Debug tool availability issues
    ✅ Understand agent capabilities

Usage:
    python inspect_mcp_tools.py

Expected Output:
    - Total count of available tools
    - List of all tools with descriptions

═════════════════════════════════════════════════════════════════
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

load_dotenv()

TOKEN = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")

if not TOKEN:
    print("\n❌ Error: GITHUB_PERSONAL_ACCESS_TOKEN not found in .env file")
    print("   Run 'python test_mcp_client.py' first to validate credentials\n")
    sys.exit(1)


async def list_tools():
    """Connect to MCP server and list all available GitHub tools."""
    try:
        from langchain_mcp_adapters.client import MultiServerMCPClient
    except ImportError:
        print("\n❌ Error: langchain-mcp-adapters not installed")
        print("   Run: pip install -r requirements.txt\n")
        sys.exit(1)

    try:
        print("\n🔌 Connecting to GitHub MCP Server...")
        
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

        print(f"\n{'=' * 60}")
        print(f"✅ GitHub MCP Connected Successfully!")
        print(f"{'=' * 60}")
        print(f"\n📦 Total Available Tools: {len(tools)}\n")

        for i, tool in enumerate(tools, 1):
            print(f"{i}. {tool.name}")
            # Truncate long descriptions
            desc = (tool.description or "No description provided.").strip()
            if len(desc) > 100:
                desc = desc[:100] + "..."
            print(f"   {desc}\n")

        print(f"{'=' * 60}")
        print("✅ MCP server is working correctly!\n")

    except Exception as e:
        print(f"\n❌ Error connecting to MCP server:")
        print(f"   {str(e)}\n")
        print("📝 Troubleshooting tips:")
        print("   1. Verify Node.js is installed: node -v")
        print("   2. Reinstall MCP: npm install -g @modelcontextprotocol/server-github")
        print("   3. Check GitHub token validity\n")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(list_tools())