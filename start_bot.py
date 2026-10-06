#!/usr/bin/env python3
"""
Pac-Rush Auto Bot Launcher
Starts the local server, launches browser, and monitors note.txt live!
"""

import os
import subprocess
import sys
import time
import webbrowser

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
NOTE_FILE = os.path.join(ROOT_DIR, "note.txt")
SERVER_SCRIPT = os.path.join(ROOT_DIR, "server.py")
GAME_URL = "http://localhost:8080"


def main():
    print("=" * 60)
    print("  PAC-RUSH GAME & NOTE LOGGER")
    print("=" * 60)

    # 1. Start Server
    print("[1/3] Starting game server...")
    server_process = subprocess.Popen([sys.executable, SERVER_SCRIPT], cwd=ROOT_DIR)
    time.sleep(1.2)

    # 2. Launch Browser
    print(f"[2/3] Opening game in browser: {GAME_URL}")
    webbrowser.open(GAME_URL)

    # 3. Live Monitor note.txt
    print("[3/3] Game running! Monitoring note.txt live (Press Ctrl+C to stop)...")
    print("-" * 60)
    print("Format in note.txt:")
    print("Time - Click - Score \n 1m 2s - 20 -  300")
    print("-" * 60)

    last_size = 0
    try:
        while True:
            if os.path.exists(NOTE_FILE):
                cur_size = os.path.getsize(NOTE_FILE)
                if cur_size > last_size:
                    with open(NOTE_FILE, "r", encoding="utf-8") as f:
                        f.seek(last_size)
                        new_content = f.read()
                        if new_content.strip():
                            print(new_content, end="")
                    last_size = cur_size
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\nStopping server and bot...")
    finally:
        server_process.terminate()
        print("Done!")


if __name__ == "__main__":
    main()
