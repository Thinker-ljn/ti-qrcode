var webpack = require('webpack')
var webpackConfig = require('./webpack.prod.conf')

var compiler = webpack(webpackConfig)
compiler.run(function (err, stats) {
  if (err) throw err
  process.stdout.write(stats.toString({
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false
  }) + '\n')
})