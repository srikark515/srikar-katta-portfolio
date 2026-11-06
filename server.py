import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class FastFrameHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # Enable caching for high performance image sequence scrubbing
        if self.path.endswith(('.jpeg', '.jpg', '.png', '.webp', '.js', '.css', '.woff2', '.mp4', '.svg')):
            self.send_header('Cache-Control', 'public, max-age=604800, immutable')
        else:
            self.send_header('Cache-Control', 'no-cache')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        # Silent logger to prevent terminal flooding during rapid 239-frame scrubbing
        pass

def find_available_port(start_port=8080):
    import socket
    for port in range(start_port, start_port + 50):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('127.0.0.1', port)) != 0:
                return port
    return start_port

def run():
    default_port = 8080
    if len(sys.argv) > 1:
        try:
            default_port = int(sys.argv[1])
        except ValueError:
            pass
    port = find_available_port(default_port)
    server_address = ('127.0.0.1', port)
    ThreadingHTTPServer.allow_reuse_address = True
    httpd = ThreadingHTTPServer(server_address, FastFrameHandler)
    print(f"\n=======================================================", flush=True)
    print(f"  Smooth Scroll Frame Sequence Server Running!", flush=True)
    print(f"  Local link: http://localhost:{port}/", flush=True)
    print(f"=======================================================\n", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
    finally:
        httpd.server_close()

if __name__ == '__main__':
    run()
