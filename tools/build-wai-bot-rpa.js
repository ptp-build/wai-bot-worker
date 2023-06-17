const os = require('os');
const shell = require('shelljs');

let dest_dir = "src/electron/assets/py"
let app_name = "wai-bot-rpa"
if (os.platform() === 'win32') {
  app_name += ".exe"
}
const cmd = `pyinstaller -F py-wai-bot-rpa/wai-bot-rpa.py --distpath ${dest_dir} --clean -n ${app_name}`;
console.log(`Executing command: ${cmd}`);
shell.exec(cmd);

if (os.platform() !== 'win32') {
  shell.exec(`chmod +x ${dest_dir}/${app_name}`);
}

