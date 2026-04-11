
better do with Next.js

externals: {
    'node:fs/promises': 'commonjs node:fs/promises',
    'node:fs': 'commonjs node:fs',
    'node:path': 'commonjs node:path',
  },
  resolve: {
    fallback: {
      fs: false, // Disables polyfilling for the browser
    }
  },
    plugins: [
    new webpack.NormalModuleReplacementPlugin(/^node:/, (resource) => {
      resource.request = resource.request.replace(/^node:/, '');
    }),
  ],