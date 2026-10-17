#!/usr/bin/env python3
# ══════════════════════════════════════════════════════════════
#  serve.py – kleiner Webserver nur für die Terminplanung.
#
#  Warum überhaupt ein Server?  Die App besteht aus JavaScript-
#  Modulen; Browser laden die aus Sicherheitsgründen nicht von
#  file://. Deshalb dieser Mini-Server (nur auf 127.0.0.1).
#
#  Eigenschaften:
#    · sucht sich selbst einen freien Port (Start 8777)
#    · sendet "no-store"-Kopfzeilen, damit nach Änderungen an
#      HTML/CSS/JS kein alter Stand aus dem Cache kommt
#    · öffnet die App automatisch im Standardbrowser
#    · beendet sich mit Strg+C
#
#  Aufruf:  python tools/serve.py [--port 8777] [--no-open]
# ══════════════════════════════════════════════════════════════

import argparse
import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser
from functools import partial

HOST = '127.0.0.1'


class Handler(http.server.SimpleHTTPRequestHandler):
    """Statische Dateien ausliefern, aber nie zwischenspeichern."""

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        # Nur Fehler zeigen, sonst wird das Fenster zugemüllt
        if args and str(args[1] if len(args) > 1 else '').startswith(('4', '5')):
            sys.stderr.write('  %s\n' % (fmt % args))


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def free_port(start):
    """Ersten freien Port ab `start` finden."""
    for port in range(start, start + 60):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
            try:
                probe.bind((HOST, port))
                return port
            except OSError:
                continue
    raise SystemExit('Kein freier Port zwischen %d und %d gefunden.' % (start, start + 60))


def already_running(port):
    """Laeuft auf diesem Port schon eine Terminplanung? Dann nicht doppelt starten."""
    try:
        with socket.create_connection((HOST, port), timeout=0.8) as sock:
            sock.settimeout(1.5)
            sock.sendall(b'GET /index.html HTTP/1.0\r\nHost: 127.0.0.1\r\n\r\n')
            data = b''
            # Kopfzeilen und Inhalt kommen oft in getrennten Paketen
            while len(data) < 16384:
                chunk = sock.recv(4096)
                if not chunk:
                    break
                data += chunk
                if b'Terminplanung' in data:
                    return True
            return b'Terminplanung' in data
    except OSError:
        return False


def main():
    parser = argparse.ArgumentParser(description='Webserver für die Terminplanung')
    parser.add_argument('--port', type=int, default=8777, help='Startport (Standard 8777)')
    parser.add_argument('--no-open', action='store_true', help='Browser nicht automatisch öffnen')
    parser.add_argument('--dir', default=None, help='Ordner mit index.html (Standard: Projektordner)')
    args = parser.parse_args()

    root = args.dir or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if not os.path.isfile(os.path.join(root, 'index.html')):
        raise SystemExit('index.html wurde in %s nicht gefunden.' % root)
    os.chdir(root)

    # Schon offen? Dann nur den Browser holen.
    if already_running(args.port):
        url = 'http://%s:%d/' % (HOST, args.port)
        print('Terminplanung laeuft bereits auf %s' % url)
        if not args.no_open:
            webbrowser.open(url)
        return

    port = free_port(args.port)
    url = 'http://%s:%d/' % (HOST, port)

    handler = partial(Handler, directory=root)
    with Server((HOST, port), handler) as httpd:
        print('=' * 58)
        print(' Terminplanung laeuft auf: %s' % url)
        print(' Ordner: %s' % root)
        print(' Beenden: Strg+C  (Fenster schliessen genuegt auch)')
        print('=' * 58)
        print()
        if not args.no_open:
            threading.Timer(0.7, lambda: webbrowser.open(url)).start()
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServer beendet.')


if __name__ == '__main__':
    main()
