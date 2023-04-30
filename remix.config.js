/** @type {import('@remix-run/dev').AppConfig} */
module.exports = {
  serverDependenciesToBundle: [/^(?!(__STATIC_CONTENT_MANIFEST)$).*$/u],
  serverMinify: true,
  serverModuleFormat: 'esm',
  // YMMV with setting to `node`, most likely anything but simple code won’t work with the CF node compat layer
  serverPlatform: 'neutral',
  // Same as previous behaviour; using main fields like this is deprecated in favour of conditions
  serverMainFields: ['browser', 'module', 'main'],
  // Try the `workerd` condition first (this is new and slowly standardising), then `worker`, then `browser` (equivalent of `serverPlatform: browser` but without extra behaviour.
  serverConditions: ['workerd', 'worker', 'browser'],
  devServerBroadcastDelay: 1000,
  ignoredRouteFiles: ['**/.*'],
  server: './server.ts',
  // appDirectory: "app",
  // assetsBuildDirectory: "public/build",
  // serverBuildPath: "build/index.js",
  // publicPath: "/build/",
  future: {
    v2_errorBoundary: true,
    v2_meta: true,
    v2_normalizeFormMethod: true,
    v2_routeConvention: true,
    v2_allowOverwrite: true,
  },
};
