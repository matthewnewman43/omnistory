({
  baseUrl: ".",
  mainConfigFile: "config.js",
  name: "almond.js", // assumes a production build using almond
  include: ['embed'],
  out: "embed.min.js",
  optimizeCss: "standard",
  stubModules: ['rv', 'amd-loader', 'text']
})
