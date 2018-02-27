var path = require('path');
var webpack = require("webpack");

module.exports = {
  entry: ['./src/index.js', 'webpack-hot-middleware/client?path=http://localhost:3000/__webpack_hmr&reload=true'],
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist')
  },
  devtool: "cheap-eval-source-map",
  plugins: [
    // Webpack 2.0 fixed this mispelling
    // new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.HotModuleReplacementPlugin(),
    // new webpack.NoErrorsPlugin()
    new webpack.NoEmitOnErrorsPlugin()
  ]
};