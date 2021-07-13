const path = require("path");
const nodeExternals = require("webpack-node-externals");

module.exports = {
  entry: "./src/server.ts",
  target: "node",
  module: {
    rules: [
      {
        test: /\.ts?$/,
        use: "ts-loader",
      },
    ],
  },
  externals: [nodeExternals()],
  devtool: "source-map",
  resolve: {
    extensions: [".ts", ".js"],
  },
  output: {
    filename: "bundle.js",
    sourceMapFilename: "bundle.js.map",
    pathinfo: true,
    path: path.resolve(__dirname, "build"),
  },
};
