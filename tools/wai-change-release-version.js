const fs = require('fs');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
/**
export REPLACE_HOST=
export VERSION=1.0.1
node tools/wai-change-release-version.js

 */
const dirPath = "src/electron/assets/wai/desktop"
const orgHost = "localhost:5080"

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


const replaceInFile = (filePath, orgHost, replaceHost) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        console.error(`Failed to read: ${filePath}`, err);
        return;
      }

      // Replace the original host with the new host
      const updatedContent = data.replace(new RegExp(orgHost, 'g'), replaceHost);
      fs.writeFile(filePath, updatedContent, 'utf8', writeError => {
        if (writeError) {
          console.error(`Failed to write updated content to ${filePath}:`, writeError);
          reject('error');
        } else {
          console.log(`${filePath} updated successfully.`);
          resolve('');
        }
      });
    });
  });
};

/**
 *  遍历 dirPath 正的所有js file 含有 orgHost 的 替换成 replaceHost
 * @param orgHost
 * @param replaceHost
 */
async function replaceApi(orgHost,replaceHost){
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isFile() && path.extname(filePath) === '.js') {
      try {
        await replaceInFile(filePath, orgHost, replaceHost);
      } catch (error) {
        console.error(`Error processing ${filePath}`, error);
      }
    }
  }
}
(async () => {
  if (version) {
    try {
      if(process.env.REPLACE_HOST){
        await replaceApi(orgHost,process.env.REPLACE_HOST)
      }
      await replaceFileVersion(packageJsonPath, version);

      setTimeout(async () => {
        await handleGitCommands(version);
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  }
})();
