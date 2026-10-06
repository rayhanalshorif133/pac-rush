#!/usr/bin/env python3
"""
Pac-Rush Game & Note Logger Server
Serves the game, saves logs to note.txt, and auto-syncs to Google Sheets!
"""

import http.server
import json
import os
import sys
import urllib.request

# Ensure UTF-8 output on Windows consoles
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
NOTE_FILE_ROOT = os.path.join(BASE_DIR, "note.txt")
GAMEOVER_DIR = os.path.join(BASE_DIR, "game-over")
NOTE_FILE_GAMEOVER = os.path.join(GAMEOVER_DIR, "note.txt")
CONFIG_FILE = os.path.join(BASE_DIR, "google_sheet_config.json")
HEADER = "Time - Click - Score \n"


def load_sheet_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "sheet_id": "1syWTsKaf2nqY_Nru9m2vZrwjh-QqLjWYiaUguFGMIeQ",
        "sheet_url": "https://docs.google.com/spreadsheets/d/1syWTsKaf2nqY_Nru9m2vZrwjh-QqLjWYiaUguFGMIeQ/edit?usp=sharing",
        "webhook_url": ""
    }


def save_sheet_config(cfg):
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)


def ensure_note_files():
    """Ensure note.txt exists with header if empty, without overwriting existing data."""
    os.makedirs(GAMEOVER_DIR, exist_ok=True)
    for path in [NOTE_FILE_ROOT, NOTE_FILE_GAMEOVER]:
        if not os.path.exists(path) or os.path.getsize(path) == 0:
            with open(path, "w", encoding="utf-8") as f:
                f.write(HEADER)


def append_to_notes(line):
    """Appends a new record to note.txt files, preserving existing data."""
    ensure_note_files()
    for path in [NOTE_FILE_ROOT, NOTE_FILE_GAMEOVER]:
        has_content = os.path.exists(path) and os.path.getsize(path) > 0
        with open(path, "a", encoding="utf-8") as f:
            if not has_content:
                f.write(HEADER)
            f.write(line + "\n")
            f.flush()


import threading
try:
    import requests
except ImportError:
    requests = None


def sync_to_google_sheet(data):
    """Sends gameplay data to Google Sheet webhook asynchronously in background thread."""
    cfg = load_sheet_config()
    webhook_url = cfg.get("webhook_url", "").strip()
    if not webhook_url:
        print("[GOOGLE SHEET SYNC] Skipped: No webhook_url configured")
        return False, "No webhook_url configured"

    payload = {
        "time": data.get("time", ""),
        "click": data.get("click", 0),
        "score": data.get("score", 0),
        "line": data.get("line", "")
    }

    def _worker():
        try:
            if requests:
                resp = requests.post(webhook_url, json=payload, timeout=20)
                print(f"[GOOGLE SHEET SYNC] Success! HTTP {resp.status_code}")
            else:
                body = json.dumps(payload).encode("utf-8")
                req = urllib.request.Request(
                    webhook_url,
                    data=body,
                    headers={"Content-Type": "application/json"}
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    print(f"[GOOGLE SHEET SYNC] Success! {resp.status}")
        except Exception as err:
            print(f"[GOOGLE SHEET SYNC ERROR] {err}")

    thread = threading.Thread(target=_worker, daemon=True)
    thread.start()
    return True, "Syncing in background"


class GameRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, *")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_POST(self):
        if self.path == "/api/log":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                data = json.loads(post_body.decode("utf-8"))
                line = data.get("line", "")

                # 1. Append to local note.txt files
                append_to_notes(line)
                print(f"[NOTE RECORDED] {line}")

                # 2. Sync to Google Sheet
                sheet_synced, sheet_msg = sync_to_google_sheet(data)

                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "status": "ok",
                    "recorded": line,
                    "google_sheet_synced": sheet_synced,
                    "google_sheet_msg": sheet_msg
                }).encode("utf-8"))
            except Exception as e:
                print(f"[ERROR] Could not write log: {e}")
                self.send_response(500)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "error", "message": str(e)}).encode("utf-8"))

        elif self.path == "/api/set_sheet_webhook":
            content_length = int(self.headers.get("Content-Length", 0))
            post_body = self.rfile.read(content_length)
            try:
                data = json.loads(post_body.decode("utf-8"))
                webhook_url = data.get("webhook_url", "").strip()
                cfg = load_sheet_config()
                cfg["webhook_url"] = webhook_url
                save_sheet_config(cfg)
                print(f"[CONFIG] Updated Google Sheet webhook: {webhook_url[:40]}...")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok", "config": cfg}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()

        elif self.path == "/api/clear_notes":
            try:
                for path in [NOTE_FILE_ROOT, NOTE_FILE_GAMEOVER]:
                    with open(path, "w", encoding="utf-8") as f:
                        f.write(HEADER)
                print("[NOTE CLEARED] note.txt reset to header")
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"status": "ok"}).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def do_GET(self):
        if self.path == "/api/notes":
            ensure_note_files()
            if os.path.exists(NOTE_FILE_ROOT):
                with open(NOTE_FILE_ROOT, "r", encoding="utf-8") as f:
                    content = f.read()
            else:
                content = HEADER
            self.send_response(200)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.end_headers()
            self.wfile.write(content.encode("utf-8"))

        elif self.path == "/api/sheet_config":
            cfg = load_sheet_config()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps(cfg).encode("utf-8"))

        else:
            super().do_GET()


def run_server():
    os.chdir(BASE_DIR)
    ensure_note_files()
    cfg = load_sheet_config()

    server_address = ("", PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, GameRequestHandler)
    print("=" * 65)
    print(f"[SERVER] Pac-Rush Game Running at: http://localhost:{PORT}")
    print(f"[LOGGER] Saving notes to: {NOTE_FILE_ROOT}")
    print(f"[GOOGLE SHEET] Sheet URL: {cfg.get('sheet_url')}")
    print("=" * 65)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        httpd.server_close()


if __name__ == "__main__":
    run_server()
