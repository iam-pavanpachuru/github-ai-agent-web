"""
🚫 DEPRECATED - CLI Interface (No Longer Maintained)

This file is kept for reference only and is no longer actively maintained.

⚡ The application now operates EXCLUSIVELY through the web dashboard:

    Start the web server:
        python -m uvicorn app:app --reload
    
    Then open in your browser:
        http://127.0.0.1:8000

═════════════════════════════════════════════════════════════════

Web Dashboard Features:
    ✅ Real-time task streaming via Server-Sent Events
    ✅ Visual tool execution tracking
    ✅ Activity feed with complete history
    ✅ Beautiful glassmorphic UI
    ✅ Better error handling and feedback
    ✅ Session management

═════════════════════════════════════════════════════════════════

This file should NOT be executed. Use app.py instead.
"""

import sys

if __name__ == "__main__":
    print(__doc__)
    print("\n❌ CLI mode is deprecated. Please use the web dashboard.\n")
    sys.exit(1)