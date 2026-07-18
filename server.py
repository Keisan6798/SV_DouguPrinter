import http.server
import socketserver

PORT = 8000
DIRECTORY = "."

class RNGStaticHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Python 3.7+ 用の directory 引数付き初期化
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        # 静的アセットのCORS対応等
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    handler = RNGStaticHTTPRequestHandler
    
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print(f"============================================================")
        print(f" RNG PWA Static Server started successfully.")
        print(f" Serving at: http://localhost:{PORT}")
        print(f" To access from other devices (smartphone, Switch, etc.):")
        print(f"   Use the host PC's Local IP address (e.g. http://192.168.x.x:{PORT})")
        print(f"============================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")
