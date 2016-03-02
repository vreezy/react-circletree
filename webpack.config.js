var webpack = require('webpack');
var path = require('path');

module.exports = {
  entry:  './index.js',
  output: {
    path: '.',
    filename: 'circletree.js'
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loaders: ['babel', 'eslint']
      }
    ]
  },
  eslint: {
    configFile: __dirname + '/.eslintrc'
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin()
  ]
};
