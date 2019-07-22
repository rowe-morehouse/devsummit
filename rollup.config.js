import { terser } from 'rollup-plugin-terser';

import htmlCSSPlugin from './lib/html-css-plugin.js';
import postCSSBuild from './lib/postcss-build.js';
import eleventyPlugin from './lib/11ty-plugin.js';
import globInputPlugin from './lib/glob-input-plugin';
import httpServer from './lib/http-server';
import buildStartSequencePlugin from './lib/build-start-sequence-plugin';

export default async function({ watch }) {
  await Promise.all([postCSSBuild('src/**/*.css', '.build-tmp', { watch })]);
  if (watch) {
    httpServer();
  }

  return {
    input: {
      'nuke-sw': 'src/nuke-sw.js',
    },
    output: {
      dir: 'build',
      format: 'esm',
      assetFileNames: '[name]-[hash][extname]',
    },
    watch: {
      clearScreen: false,
      // Avoid watching intermediate files, else watch gets stuck in a loop.
      // 11ty source files are watched by eleventyPlugin.
      exclude: '.build-tmp/**/*.html',
    },
    plugins: [
      {
        resolveFileUrl({ fileName }) {
          return JSON.stringify('/' + fileName);
        },
      },
      buildStartSequencePlugin(),
      eleventyPlugin(),
      globInputPlugin('.build-tmp/**/*.html'),
      htmlCSSPlugin(),
      terser({ ecma: 8, module: true }),
    ],
  };
}