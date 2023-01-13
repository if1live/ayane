const esbuild = require('esbuild');
/**
 * @type esbuild.BuildOptions
 */
const config = {
  // 클래스 이름이 뭉개지면 문제가 생길수 있다
  minifyIdentifiers: false,
  minifySyntax: true,
  minifyWhitespace: false, //true,
  bundle: true,
  sourcemap: true,
  treeShaking: true,
  platform: "node",
  target: "node18",
  external: ["aws-sdk"],
  format: "esm",
}

module.exports = (serverless) => config;
