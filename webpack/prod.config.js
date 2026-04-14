const { merge } = require('webpack-merge');
const commonConfig = require('./common.config');

// This variable should mirror the one from config/settings/production.py
const staticUrl = '/static/';

module.exports = merge(commonConfig, {
  mode: 'production',
  devtool: false,
  bail: true,
  output: {
    publicPath: `${staticUrl}webpack_bundles/`,
  },
});
