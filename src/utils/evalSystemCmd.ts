const { exec, spawn } = require('child_process');

export function runCommand(command: string,args:any[]): Promise<string> {
  return new Promise((resolve, reject) => {
    console.log("[runCommand]",command, args)
    const py = spawn(command, args);
    let output = '';
    py.stdout.on('data', (data: string) => {
      output += data;
      console.log("[runCommand stdout]",Buffer.from(data).toString().trim())
    });

    py.stderr.on('data', (data: any) => {
      console.warn("[runCommand stderr]",Buffer.from(data).toString().trim())
      reject(data);
    });

    py.on('close', (code: number) => {
      console.log(code,output)
      console.warn("[runCommand close]",code,Buffer.from(output).toString().trim())
      if (code !== 0) {
        reject(`Python process exited with code ${code}`);
      }
    });
  });
}

export function getPythonExecName(){
  let pythonCommand;
  switch (process.platform) {
    case 'win32': // Windows
      pythonCommand = 'python'; // or 'python3' depending on the Python version installed
      break;
    case 'darwin': // macOS
    case 'linux': // Linux
      pythonCommand = '/usr/bin/python3';
      break;
    default:
      throw new Error('Unsupported platform');
  }
  return pythonCommand
}

export function runPyCode(args: string): Promise<string> {
  let pythonCommand = getPythonExecName();
  return runCommand(pythonCommand, ['-c', args]);
}

export function runPyCodeCmd(command: string): Promise<string> {
  return runCommandexec( `python -c "${command}"`)
}

export function runCommandexec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    exec(
      `${command}`,
      { stdout: process.stdout },
      (error: any, stdout: string, stderr: any) => {
        if (error) {
          console.warn(error);
          reject(error);
        } else if (stderr) {
          console.warn(stderr);
          reject(stderr);
        } else {
          resolve(stdout.trim());
        }
      }
    );
  });
}
