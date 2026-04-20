const { merge } = require('webpack-merge');
const commonConfig = require('./common.config');

module.exports = merge(commonConfig, {
  mode: 'development',
  devtool: 'inline-source-map',
  watchOptions: {
    poll: 1000,
    ignored: [
      '**/node_modules/**',
      '**/webpack_bundles/**',
      '**/.webpack_cache/**',
      '**/webpack-stats.json',
    ],
  },
  devServer: {
    host: '0.0.0.0',
    allowedHosts: 'all',
    port: 3000,
    proxy: [
      {
        context: ['/'],
        target: 'http://django:8000',
      },
    ],
    client: {
      overlay: {
        errors: true,
        warnings: false,
        runtimeErrors: true,
      },
    },
    // We need hot=false (Disable HMR) to set liveReload=true
    hot: false,
    liveReload: true,
  },
});
