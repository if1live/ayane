import fs from "node:fs/promises";
import esbuild from "esbuild";

const banner_js_esm = `
import { createRequire as topLevelCreateRequire } from 'module';
const require = topLevelCreateRequire(import.meta.url);
const __dirname = '.';
`.trim();

/**
 * https://github.com/evanw/esbuild/issues/946#issuecomment-911869872
 * @type {esbuild.BuildOptions}
 */
const opts = {
  // identifiers까지 minifiy 적용하면 소스맵에 들어가는 이름도 뭉개진다
  // 적용할 경우 'at Ap (/var/task/src/apis.ts:71:9)' 같이 나온다.
  // 타입스크립트 파일명과 라인은 제대로 나와서 못 쓸 물건은 아니다 이름까지 제대로 나오면 좋겠다
  // minifyIdentifiers: false,
  // minifySyntax: true,
  // 번들 자체를 뜯어보기 편해서. 프로덕션에서는 true로 써야한다.
  // minifyWhitespace: false,

  // for production
  minify: true,

  bundle: true,
  sourcemap: true,
  treeShaking: true,
  platform: "node",
  external: ["@aws-sdk"],
  target: "node20",
  format: "esm",
  mainFields: ["module", "main"],
  banner: {
    js: banner_js_esm,
  },
};

/**
 * @param {number} val
 * @returns
 */
function readableSize(val) {
  const mb = val / 1024 / 1024;
  return mb.toPrecision(2);
}

/**
 * @param {esbuild.BuildOptions} opts
 * @returns
 */
async function mybuild(opts) {
  const result = await esbuild.build(opts);

  const fp_bundle = opts.outfile;
  const fp_sourcemap = `${fp_bundle}.map`;

  const stat_bundle = await fs.stat(fp_bundle);
  console.log(`${fp_bundle}\t${readableSize(stat_bundle.size)}MB`);

  if (opts.sourcemap !== undefined && opts.sourcemap !== false) {
    const stat_sourcemap = await fs.stat(fp_sourcemap);
    console.log(`${fp_sourcemap}\t${readableSize(stat_sourcemap.size)}MB`);
  }

  return result;
}

/**
 *
 * @param {string} fp_entrypoint
 * @param {string} filename
 * @param {esbuild.BuildOptions} opts
 */
const build = async (fp_entrypoint, filename, opts) => {
  const fp_outfile =
    opts.format === "esm"
      ? `./artifact/${filename.replace(".js", ".mjs")}`
      : `./artifact/${filename}`;

  await mybuild({
    ...opts,
    entryPoints: [fp_entrypoint],
    outfile: fp_outfile,
  });
};

await Promise.allSettled([build("./src/handlers.ts", "handlers.js", opts)]);
