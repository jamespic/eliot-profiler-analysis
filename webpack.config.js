var path = require('path')

module.exports = {
  entry: ['babel-polyfill', './src/js/index.js'],
  output: {
    path: path.resolve(__dirname, 'src/eliot_profiler_analysis/static'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {test: /\.(js|jsx)$/, use: 'babel-loader'}
    ]
  },
  devtool: '#sourcemap'
}
