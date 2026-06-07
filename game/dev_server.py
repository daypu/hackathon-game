#!/usr/bin/env python3
"""
dev_server.py - 开发用 HTTP 服务器
- 提供静态文件（替代 `python -m http.server`）
- 新增 POST /log endpoint：接收浏览器发来的 log，实时打印到终端

启动：cd game && python3 dev_server.py
"""
import sys
import json
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 8765  # 避开 8000（VSCode Node 插件常驻占用）


class Handler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # 静音常规 HTTP 访问日志，只显示游戏 log
        pass

    def end_headers(self):
        # CORS：允许任意来源（虽然同源也不需要，但保险）
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # 开发期：彻底禁缓存，每次都拉新文件（避免 PNG/JS 改了但浏览器用旧的）
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path == '/log':
            length = int(self.headers.get('Content-Length', 0))
            raw = self.rfile.read(length).decode('utf-8', errors='replace')
            try:
                data = json.loads(raw)
                level = data.get('level', 'log').upper()
                msg = data.get('msg', '')
            except Exception:
                level, msg = 'RAW', raw

            ts = time.strftime('%H:%M:%S')
            # 颜色：error=红，warn=黄，其他=灰
            color = {
                'ERROR': '\033[91m',
                'WARN':  '\033[93m',
                'LOG':   '\033[96m',
            }.get(level, '\033[0m')
            reset = '\033[0m'
            print(f'{color}[{ts}] [{level}] {msg}{reset}', flush=True)
            self.send_response(204)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()


if __name__ == '__main__':
    print(f'🎮 Dev server on http://localhost:{PORT}/  (Ctrl+C to stop)', flush=True)
    print(f'   浏览器 console.log → 终端实时显示', flush=True)
    print('-' * 60, flush=True)
    try:
        ThreadingHTTPServer(('', PORT), Handler).serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
