const ExtractTextPlugin = require('extract-text-webpack-plugin')
var LodashModuleReplacementPlugin = require('lodash-webpack-plugin')
const path = require('path')

module.exports = {
  entry: ['babel-polyfill', './src/js/index.js'],
  output: {
    path: path.resolve(__dirname, 'src/eliot_profiler_analysis/static/bundle'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {test: /\.(js|jsx)$/, use: 'babel-loader'},
      {
        test: /\.(s[ac]ss)$/,
        use: ExtractTextPlugin.extract({
          use: [
            { loader: 'css-loader', options: { importLoaders: 1, sourceMap: true } },
            { loader: 'sass-loader', options: { sourceMap: true } }
          ],
          fallback: 'style-loader'}
        )
      },
      {
        test: /\.(woff|woff2|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
        loader: 'file-loader',
        options: {
          name: '[name].[sha256:hash:base64:4].[ext]'
        }
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('bundle.css')
  ],
  devtool: '#sourcemap'
}
