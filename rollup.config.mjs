import typescript from '@rollup/plugin-typescript';

// const extensions = ['.js', '.jsx', '.ts', '.tsx'];

/** @type {import('rollup').RollupOptions} */
export default {
  input: ['src/client.ts', 'src/server.ts'],
  output: [
    {
      format: /** @type {const} */ ('cjs'),
      entryFileNames: '[name].js',
      dir: 'dist',
    },
  ],
  plugins: [
    typescript(),
    // // Allows node_modules resolution
    // nodeResolve({ extensions, preferBuiltins: true }),
    // // Allow bundling cjs modules. Rollup doesn't understand cjs
    // commonjs(),
    // // Compile TypeScript/JavaScript files
    // babel({
    //   extensions,
    //   include: ['src/**/*'],
    //   babelHelpers: 'bundled',
    // }),
  ],
  external: [
    'vscode',
    'vscode-languageclient/node',
    'vscode-languageserver/node',
    'vscode-languageserver-textdocument',
  ],
};
