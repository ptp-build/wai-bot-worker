const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
/**

export VERSION=0.0.0
node tools/wai-change-release-version.js

 */

const packageJsonPath = './package.json';

const version = process.env.VERSION;

const replaceFileVersion = (packageJsonPath, version) => {
  return new Promise((resolve, reject) => {
    // Read package.json
    fs.readFile(packageJsonPath, 'utf8', (err, data) => {
      if (err) {
        console.error('Failed to read :' + packageJsonPath, err);
        return;
      }

      // Use regex to replace the version number
      const regex = /("version"\s*:\s*)"[^"]*"/;
      const replacement = `$1"${version}"`;
      const updatedContent = data.replace(regex, replacement);
      fs.writeFile(packageJsonPath, updatedContent, 'utf8', writeError => {
        if (writeError) {
          console.error(`Failed to write updated content to ${packageJsonPath}:`, writeError);
          reject('error');
        } else {
          console.log(packageJsonPath + ` version:${version} updated successfully.`);
          resolve('');
        }
      });
    });
  });
};

const handleGitCommands = async version => {
  const commands = [
    `git add .`,
    `git commit -m "Version ${version} release"`,
    `git tag -a v${version} -m "Version ${version} release"`,
    `git push origin v${version}`,
  ];

  for (let command of commands) {
    try {
      const { stdout } = await exec(command);
      console.log(`Successfully executed command: ${command}\n`, stdout);
      // console.log(stdout);
    } catch (error) {
      throw error;
      // console.error(error);
    }
  }
};

(async () => {
  if (version) {
    try {
      await replaceFileVersion(packageJsonPath, version);

      setTimeout(async () => {
        await handleGitCommands(version);
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  }
})();
