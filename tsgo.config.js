module.exports = {
  // output: {
  //   doc: false
  // },
  rollupGlobals: {
    react: 'React',
    '@vue/reactivity': 'VueReactivity'
  },
  bundleOnly: [
    { type: 'umd', minify: false, resolveOnly: [/^(?!(react)|(@vue\/reactivity)).*?$/] },
    { type: 'umd', minify: true, resolveOnly: [/^(?!(react)|(@vue\/reactivity)).*?$/] },
    { type: 'cjs', minify: false, resolveOnly: [/^(?!(react)|(@vue\/reactivity)|(@vue\/shared)|(tslib)).*?$/] },
    { type: 'cjs', minify: true, resolveOnly: [/^(?!(react)|(@vue\/reactivity)|(@vue\/shared)|(tslib)).*?$/] },
    { type: 'esm-bundler', minify: false, resolveOnly: [/^(?!(react)|(@vue\/reactivity)|(@vue\/shared)|(tslib)).*?$/] }
    // 'esm-browser'
  ],
  bundleDefine: {
    __VERSION__: JSON.stringify(require('./package.json').version)
  }
}
