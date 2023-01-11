import type { AWS } from "@serverless/typescript";
import { hello } from "@functions/index";

const serverlessConfiguration: AWS = {
  service: "ayane",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild", "serverless-offline"],
  provider: {
    name: "aws",
    runtime: "nodejs18.x",
    region: "ap-northeast-1",
    architecture: "arm64",
    logRetentionInDays: 7,
    versionFunctions: false,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
  },
  // import the function via paths
  functions: {
    hello,
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node14",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
      watch: {
        pattern: ["./index.ts", "src/**/*.ts"],
        ignore: [".serverless/**/*", ".build"],
      },
    },
  },
};

module.exports = serverlessConfiguration;
