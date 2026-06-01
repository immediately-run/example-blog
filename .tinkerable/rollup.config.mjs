import mdx from '@mdx-js/rollup';
import typescript from '@rollup/plugin-typescript';
import postcss from 'rollup-plugin-postcss';
import { nodeResolve } from '@rollup/plugin-node-resolve';

const config = {
  input: "index.tsx",
  external: ["@immediately-run/sdk/v1", /node_modules/],
  output: {
    dir: "build"
  },
  plugins: [
    nodeResolve({browser: true}),
    mdx({/* jsxImportSource: …, otherOptions… */}),
    typescript(),
    postcss({extract: true}),
  ]
}
export default config;
