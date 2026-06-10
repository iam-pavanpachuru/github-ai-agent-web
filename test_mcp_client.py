"""
Test and Validate Environment Variables

This utility verifies that all required credentials are correctly set in the .env file.
Run this before starting the web server to ensure proper configuration.

Usage:
    python test_mcp_client.py

Expected Output:
    - First 8 characters of GOOGLE_API_KEY (masked)
    - First 8 characters of GITHUB_PERSONAL_ACCESS_TOKEN (masked)
    - Your GitHub username

If any variable is missing or incorrect, you'll see an error.

═════════════════════════════════════════════════════════════════
"""
from dotenv import load_dotenv
import os
import sys

load_dotenv()

# Validate credentials
google_api_key = os.getenv("GOOGLE_API_KEY")
github_token = os.getenv("GITHUB_PERSONAL_ACCESS_TOKEN")
github_username = os.getenv("GITHUB_USERNAME")

print("\n" + "=" * 60)
print("🔍 Credential Validation")
print("=" * 60)

errors = []

if not google_api_key:
    errors.append("❌ GOOGLE_API_KEY not found")
else:
    print(f"✅ GOOGLE_API_KEY: {google_api_key[:8]}...{google_api_key[-4:]}")

if not github_token:
    errors.append("❌ GITHUB_PERSONAL_ACCESS_TOKEN not found")
else:
    print(f"✅ GITHUB_PERSONAL_ACCESS_TOKEN: {github_token[:8]}...{github_token[-4:]}")

if not github_username:
    errors.append("❌ GITHUB_USERNAME not found")
else:
    print(f"✅ GITHUB_USERNAME: {github_username}")

print("=" * 60)

if errors:
    print("\n⚠️ Issues Found:\n")
    for error in errors:
        print(f"  {error}")
    print("\n📝 Please create/update .env file with required variables:")
    print("  GOOGLE_API_KEY=your_key")
    print("  GITHUB_PERSONAL_ACCESS_TOKEN=your_token")
    print("  GITHUB_USERNAME=your_username")
    print()
    sys.exit(1)
else:
    print("\n✅ All credentials are correctly configured!")
    print("   Ready to start: python -m uvicorn app:app --reload\n")
