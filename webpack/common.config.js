const path = require('path');
const BundleTracker = require('webpack-bundle-tracker');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  target: 'web',
  cache: {
    type: 'filesystem',
    cacheDirectory: path.resolve(__dirname, '../.webpack_cache'),
  },
  context: path.join(__dirname, '../'),
  entry: {
    project: path.resolve(__dirname, '../flamerelay/static/js/project'),
    vendors: path.resolve(__dirname, '../flamerelay/static/js/vendors'),
  },
  output: {
    path: path.resolve(__dirname, '../flamerelay/static/webpack_bundles/'),
    publicPath: '/static/webpack_bundles/',
    filename: 'js/[name]-[fullhash].js',
    chunkFilename: 'js/[name]-[hash].js',
  },
  plugins: [
    new BundleTracker({
      path: path.resolve(path.join(__dirname, '../')),
      filename: 'webpack-stats.json',
    }),
    new MiniCssExtractPlugin({ filename: 'css/[name].[contenthash].css' }),
  ],
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(png|gif|jpe?g|svg)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.css$/i,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: ['@tailwindcss/postcss'],
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
};
