import net from 'net';
import { exec } from 'child_process';

export function isPortInUse(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true);
      } else {
        resolve(false);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(false);
    });

    server.listen(port);
  });
}
export function killProcessUsingPort(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    exec(`lsof -i :${port} | awk 'NR!=1 {print $2}' | xargs kill -9`, error => {
      if (error) {
        console.error(`Failed to kill process on port ${port}:`, error);
        reject(error);
      } else {
        console.log(`Killed process on port ${port}`);
        resolve();
      }
    });
  });
}
