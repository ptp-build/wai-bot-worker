import pyautogui
import time
import sys
import json
import logging
import threading
import queue
import uuid
import os
from pynput import mouse

from http.server import HTTPServer, BaseHTTPRequestHandler

DEFAULT_PORT = 5090
DEFAULT_FILENAME = ""

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
filename = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_FILENAME
log_format = '%(asctime)s - %(levelname)s - %(message)s'

if filename:
  logging.basicConfig(filename=filename, filemode='a',
                      format=log_format,
                      level=logging.INFO)

console = logging.StreamHandler()
console.setLevel(logging.INFO)
console.setFormatter(logging.Formatter(log_format))
logging.getLogger("").addHandler(console)

current_file_dir = os.path.dirname(os.path.abspath(__file__))

api_url = f"http://127.0.0.1:{PORT}"
help = """

Usage:

C_DIR=""
curl -X POST -H "Content-Type: application/json" -d @$C_DIR/demo/openForceQuit-demo.json {0}
curl -X POST -H "Content-Type: application/json" -d @$C_DIR/demo/payload-demo.json {0}
curl -X POST -H "Content-Type: application/json" -d @$C_DIR/demo/spotlight-demo.json {0}

-----------------------------

""".format(api_url,current_file_dir)
# 创建队列
task_queue = queue.Queue()

# 创建锁
task_lock = threading.Lock()

task_status = {}

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
        task = task_queue.get()
        if task is None:
            break
        task_id = task['task_id']
        steps = task['steps']

        log(f"process task: {task_id}")
        # 获取锁并运行steps
        with task_lock:
            task_status[task_id] = {'task_status': 'running', 'result': None}  # Set the task status to running
            for step in steps:
                log(step)
                cmd = step['cmd']
                if cmd == 'moveTo':
                    x = step['x']
                    y = step['y']
                    pyautogui.moveTo(x, y)
                elif cmd == 'click':
                    if x in step.keys() and y in step.keys():
                        x = step['x']
                        y = step['y']
                        pyautogui.click(x, y)
                    else:
                        pyautogui.click()
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
        task_status[task_id]['task_status'] = 'completed'  # Set the task status to completed
        task_queue.task_done()

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
        if self.path[1:6] == "click":
            def on_click(x, y, button, pressed):
                if pressed:
                    print('pyautogui.click({0}, {1})'.format(int(x), int(y)))
                    # Emit to HTTP stream response
                    response = {"x": int(x), "y": int(y)}
                    self.send_json(response)
            # Collect events until released
            with mouse.Listener(on_click=on_click) as listener:
                # When the HTTP page is closed, stop this loop
                listener.join()
        if self.path[1:5] == "task":
            task_id = self.path[6:]
            log(f"query status task_id: {task_id}")
            if task_id in task_status.keys():
                status = task_status[task_id]['task_status']
                response = {"status": "200", 'task_status': status}
                if status == 'completed':
                    response['result'] = task_status[task_id]['result']
                    del task_status[task_id]
                self.send_json(response)
            else:
                self.send_json({"status": "404", "msg": "Invalid task ID"})
        else:
            self.send_json({"status":"200","msg":"server is up!!"})

    def do_DELETE(self):
        if self.path[1:5] == "task":
            task_id = self.path[6:]
            if task_id in task_status:
                del task_status[task_id]
                self.send_json({"status": 200, "message": f"Task {task_id} deleted"})
            else:
                self.send_json({"status": 404, "message": "Invalid task ID"})
        elif self.path[1:] == "task/all":
            with task_lock:
                task_status.clear()
                task_queue.queue.clear()
            self.send_json({"status": 200, "message": "All tasks deleted"})
        else:
            self.send_json({"status": 400, "message": "Invalid endpoint"})
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        raw_post_data = self.rfile.read(content_length)
        json_payload = json.loads(raw_post_data.decode())
        task_id = str(uuid.uuid4())  # Generate a unique task ID
        task_status[task_id] = {'task_status': 'queued', 'result': None}  # Set the task status to queued
        self.send_json({"status": 200,'task_status': 'queued',"task_id":task_id})
        steps = json_payload["steps"]
        log(f"task_id: {task_id}, rpa steps: {steps}")
        task_queue.put({'task_id': task_id, 'steps': steps})  # Include the task ID when putting the steps in the queue

if len(sys.argv) > 2:
    try:
        PORT = int(sys.argv[2])
    except ValueError:
        log("Invalid port number. Using default port "+ str(PORT))

with HTTPServer(("", PORT), SimpleAPIHandler) as httpd:
    queue_length = task_queue.qsize()
    print("[Task_queue] size:", queue_length)
    log(api_url)
    print(help)
    httpd.serve_forever()


