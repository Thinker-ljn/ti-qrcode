var express = require("express");
var webpackDevMiddleware = require("webpack-dev-middleware");
var webpack = require("webpack");
var webpackConfig = require("./webpack.dev.config");

var app = express();
var compiler = webpack(webpackConfig);

app.use(webpackDevMiddleware(compiler, {
  publicPath: "/", // Same as `output.publicPath` in most cases.
  stats: { colors: true }
}));

app.use(require("webpack-hot-middleware")(compiler));

app.listen(3000, function () {
  console.log("Listening on port 3000!");
});