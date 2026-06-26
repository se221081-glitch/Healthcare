#!/usr/bin/env python3
"""
HealthTrack local dev server.
Serves static files + handles /api/logs (GET and POST) to persist health-data.json.

Usage:
    python3 server.py
    Then open http://localhost:8080/welcome.html
"""

import json
import os
from datetime import datetime
from http.server import HTTPServer, SimpleHTTPRequestHandler

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'health-data.json')
HOST = os.getenv('HOST', '127.0.0.1')
PORT = int(os.getenv('PORT', '8080'))


def load_data():
    if not os.path.exists(DATA_FILE):
        return {'logs': []}
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


class HealthTrackHandler(SimpleHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors_headers()
        self.end_headers()

    def do_GET(self):
        if self.path == '/api/logs':
            body = json.dumps(load_data(), ensure_ascii=False).encode('utf-8')
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Content-Length', str(len(body)))
            self._cors_headers()
            self.end_headers()
            self.wfile.write(body)
        else:
            super().do_GET()

    def do_POST(self):
        if self.path == '/api/logs':
            length = int(self.headers.get('Content-Length', 0))
            raw    = self.rfile.read(length)
            try:
                entry = json.loads(raw.decode('utf-8'))
                entry['savedAt'] = datetime.now().isoformat(timespec='seconds')

                data = load_data()
                # Upsert: one log per date — replace if same date exists
                data['logs'] = [l for l in data['logs'] if l.get('date') != entry.get('date')]
                data['logs'].append(entry)
                data['logs'].sort(key=lambda l: l.get('date', ''), reverse=True)
                save_data(data)

                body = json.dumps({'status': 'ok', 'savedAt': entry['savedAt']}).encode('utf-8')
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Content-Length', str(len(body)))
                self._cors_headers()
                self.end_headers()
                self.wfile.write(body)
                print(f"  [SAVED] Log for {entry.get('date')} → {DATA_FILE}")

            except Exception as exc:
                err = json.dumps({'status': 'error', 'message': str(exc)}).encode('utf-8')
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Content-Length', str(len(err)))
                self.end_headers()
                self.wfile.write(err)
        else:
            self.send_response(404)
            self.end_headers()

    def _cors_headers(self):
        self.send_header('Access-Control-Allow-Origin',  '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, fmt, *args):
        # Suppress static-file noise; only show API calls
        if '/api/' in (args[0] if args else ''):
            print(f"  {fmt % args}")


if __name__ == '__main__':
    os.chdir(BASE_DIR)
    server = HTTPServer((HOST, PORT), HealthTrackHandler)

    print(f"\n  HealthTrack server running\n")
    print(f"  Welcome    →  http://127.0.0.1:{PORT}/welcome.html")
    print(f"  Dashboard  →  http://127.0.0.1:{PORT}/dashboard.html")
    print(f"  Health Log →  http://127.0.0.1:{PORT}/health-log.html")
    print(f"  Report     →  http://127.0.0.1:{PORT}/report.html")
    print(f"\n  Data file  →  {DATA_FILE}")
    print(f"  Press Ctrl+C to stop.\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  Server stopped.')
