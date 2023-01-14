import esbuild from "esbuild";
import fs from "fs/promises";
import path from "path";

const banner_js_esm = `
import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
const __dirname = '.';
`.trim();

// https://github.com/evanw/esbuild/issues/946#issuecomment-911869872
const common: esbuild.BuildOptions = {
  // identifiers까지 minifiy 적용하면 소스맵에 들어가는 이름도 뭉개진다
  // 적용할 경우 "at Ap (/var/task/src/apis.ts:71:9)" 같이 나온다.
  // 타입스크립트 파일명과 라인은 제대로 나와서 못 쓸 물건은 아니다 이름까지 제대로 나오면 좋겠다
  minifyIdentifiers: false,
  minifySyntax: true,
  minifyWhitespace: false, //true,
  bundle: true,
  sourcemap: true,
  treeShaking: true,
  platform: "node",
  target: "node18",
  external: ["aws-sdk", "pg-native"],
  format: "esm",
  banner: {
    js: banner_js_esm,
  },
};

async function writeEsmPackageJson(dirname: string) {
  const packageJson = {
    type: "module",
  };
  const file = path.resolve(dirname, "package.json");
  const data = JSON.stringify(packageJson, null, 2);
  await fs.writeFile(file, data);
}

async function mybuild(opts: esbuild.BuildOptions) {
  const result = await esbuild.build(opts);

  const fp_bundle = opts.outfile!;
  const fp_sourcemap = fp_bundle + ".map";

  function readableSize(val: number) {
    const mb = val / 1024 / 1024;
    return mb.toPrecision(2);
  }

  if (true) {
    const stat_bundle = await fs.stat(fp_bundle);
    console.log(`${fp_bundle}\t${readableSize(stat_bundle.size)}MB`);
  }

  if (opts.sourcemap !== undefined && opts.sourcemap !== false) {
    const stat_sourcemap = await fs.stat(fp_sourcemap);
    console.log(`${fp_sourcemap}\t${readableSize(stat_sourcemap.size)}MB`);
  }

  // out.mjs      3.4mb
  // out.mjs.map  4.0mb
  // console.log({
  //   result,
  // });
}

const fn_main = async () => {
  const fp_entrypoint = "./src/handlers.js";
  const fp_outfile = "./output/handlers.js";
  await mybuild({
    ...common,
    entryPoints: [fp_entrypoint],
    outfile: fp_outfile,
  });
};

async function main() {
  await Promise.allSettled([fn_main()]);
  await writeEsmPackageJson("./output");
}
await main();
