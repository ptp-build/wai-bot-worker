import pyautogui
import time
import sys
import json
import logging
import threading
import queue
from http.server import HTTPServer, BaseHTTPRequestHandler

# 设置默认的端口和文件名
DEFAULT_PORT = 5090
DEFAULT_FILENAME = "wai-rpa.log"

# 获取PORT和filename从argv
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
filename = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_FILENAME
log_format = '%(asctime)s - %(levelname)s - %(message)s'

# 配置日志
logging.basicConfig(filename=filename, filemode='a',
                    format=log_format,
                    level=logging.INFO)

console = logging.StreamHandler()
console.setLevel(logging.INFO)
console.setFormatter(logging.Formatter(log_format))
logging.getLogger("").addHandler(console)


# 创建队列
task_queue = queue.Queue()

# 创建锁
task_lock = threading.Lock()


def log(message, level=logging.INFO):
    """
    Log a message to the file.

    :param message: Message to be logged
    :param level: Level of the log (default is INFO)
    """
    if level == logging.CRITICAL:
        logging.critical(message)
    elif level == logging.ERROR:
        logging.error(message)
    elif level == logging.WARNING:
        logging.warning(message)
    elif level == logging.INFO:
        logging.info(message)
    else:
        logging.debug(message)


def worker():
    while True:
        # 从队列中取出steps
        steps = task_queue.get()
        if steps is None:
            break

        # 获取锁并运行steps
        with task_lock:
            for step in steps:
                cmd = step['cmd']
                if cmd == 'moveTo':
                    x = step['x']
                    y = step['y']
                    pyautogui.moveTo(x, y)
                elif cmd == 'click':
                    x = step['x']
                    y = step['y']
                    pyautogui.click(x, y)
                elif cmd == 'typewrite':
                    text = step['text']
                    pyautogui.typewrite(text)
                elif cmd == 'hotkey':
                    keys = step['keys']
                    pyautogui.hotkey(*keys)
                elif cmd == 'press':
                    pyautogui.press(step['key'])
                elif cmd == 'sleep':
                    sec = step['sec']
                    time.sleep(sec)

        task_queue.task_done()

# 启动worker线程
worker_thread = threading.Thread(target=worker)
worker_thread.start()

class SimpleAPIHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Accept")
        self.send_header("Access-Control-Allow-Credentials", "true")
        self.end_headers()
        self.wfile.write("")
    def setHeaders(self):
        self.send_response(200)
        self.send_header("Content-type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
    def send_json(self,response):
        self.setHeaders()
        self.wfile.write(json.dumps(response).encode())
    def do_GET(self):
        self.send_json({"status": 200})
    def do_DELETE(self):
        # Clear the task queue
        with task_lock:
            task_queue.queue.clear()
        self.send_json({"status": 200})
    def do_POST(self):
        """
        curl -X POST -H "Content-Type: application/json" -d @demo/openForceQuit-demo.json http://localhost:5090
        curl -X POST -H "Content-Type: application/json" -d @demo/payload-demo.json http://localhost:5090
        curl -X POST -H "Content-Type: application/json" -d @demo/spotlight-demo.json http://localhost:5090
        """
        content_length = int(self.headers['Content-Length'])
        raw_post_data = self.rfile.read(content_length)
        json_payload = json.loads(raw_post_data.decode())
        steps = json_payload["steps"]
        # 将steps放入队列
        task_queue.put(steps)
        log(steps)
        self.send_json({"status": 200})

if len(sys.argv) > 2:
    try:
        PORT = int(sys.argv[2])
    except ValueError:
        log("Invalid port number. Using default port "+ str(PORT))

with HTTPServer(("", PORT), SimpleAPIHandler) as httpd:
    queue_length = task_queue.qsize()
    print("[Task_queue] size:", queue_length)
    log(f"Serving API at http://localhost:{PORT}")
    httpd.serve_forever()


