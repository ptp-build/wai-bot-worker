module.exports = {
  packagerConfig: {
    icon: 'src/electron/icons/favicon',
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'ptp-build',
          name: 'wai-bot-worker',
          draft: true,
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: './webpack.main.config.js',
        renderer: {
          config: './webpack.renderer.config.js',
          entryPoints: [
            {
              html: './src/electron/assets/index.html',
              js: './src/electron/js/renderer.ts',
              name: 'main_window',
              preload: {
                js: './src/electron/js/preload.js',
              },
            },
          ],
        },
      },
    },
  ],
};
