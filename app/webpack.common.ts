import * as path from 'path'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import webpack from 'webpack'
import merge from 'webpack-merge'
import { getReplacements } from './app-info'

export const externals = ['7zip']

const outputDir = 'out'
export const replacements = getReplacements()

const commonConfig: webpack.Configuration = {
  optimization: {
    emitOnErrors: false,
  },
  externals: externals,
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, '..', outputDir),
    library: {
      name: '[name]',
      type: 'commonjs2',
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        include: path.resolve(__dirname, 'src'),
        use: [
          {
            loader: 'ts-loader',
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.node$/,
        loader: 'awesome-node-loader',
        options: {
          name: '[name].[ext]',
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.ts', '.tsx'],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
}

export const main = merge({}, commonConfig, {
  entry: { main: path.resolve(__dirname, 'src/main-process/main') },
  target: 'electron-main',
  plugins: [
    // Ensure protocol-url argv sanitization is the VERY FIRST thing that runs
    // in the main-process bundle. On Windows the protocol handler may pass
    // `x-github-client:/?code=...&state=...` as argv[1] directly (without the
    // `--protocol-launcher` sentinel), and Electron's C++ bootstrap will try
    // to resolve that URL as the "app path" / module to require, producing
    // the user-facing "Unable to find Electron app at ...\...?code=..." error
    // dialog. Injecting this rewrite at the very top of the bundle, BEFORE
    // any webpack bootstrap / import / require code runs, guarantees that
    // process.argv never contains a naked protocol URL when Electron (or
    // minimist later) reads it.
    new webpack.BannerPlugin({
      banner: [
        '(function(){',
        '  if(typeof process==="undefined"||!process.argv||process.argv.length<2){return}',
        '  var KNOWN=["x-github-client","x-github-desktop-auth","x-github-desktop-dev-auth","github-mac","github-windows"];',
        '  var STRICT=KNOWN.map(function(p){return p+"://"});',
        '  var LOOSE=KNOWN.map(function(p){return p+":"});',
        '  function isUrl(arg){',
        '    if(typeof arg!=="string"||arg.length===0){return false}',
        '    for(var i=0;i<STRICT.length;i++){if(arg.indexOf(STRICT[i])===0){return true}}',
        '    for(var j=0;j<LOOSE.length;j++){',
        '      if(arg.indexOf(LOOSE[j])===0){',
        '        var rest=arg.substring(LOOSE[j].length);',
        '        if(rest){var c=rest.charAt(0);if(c==="/"||c==="?"||c==="#"){return true}}',
        '      }',
        '    }',
        '    return /^[a-zA-Z][a-zA-Z0-9+\\-.]*:(?:\\/\\/|\\/|\\?|#)/.test(arg)',
        '  }',
        '  var argv=process.argv;var urls=[];var filtered=[];',
        '  for(var k=0;k<argv.length;k++){var a=argv[k];if(isUrl(a)){urls.push(a)}else{filtered.push(a)}}',
        '  if(urls.length){',
        '    filtered.push("--protocol-launcher");',
        '    for(var m=0;m<urls.length;m++){filtered.push(urls[m])}',
        '    process.argv=filtered',
        '  }',
        '})();',
      ].join('\n'),
      raw: true,
      entryOnly: true,
      include: /^main$/,
    }),
    new webpack.DefinePlugin(
      Object.assign({}, replacements, {
        __PROCESS_KIND__: JSON.stringify('main'),
      })
    ),
  ],
})

export const renderer = merge({}, commonConfig, {
  entry: { renderer: path.resolve(__dirname, 'src/ui/index') },
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.(jpe?g|png|gif|ico)$/,
        use: ['file?name=[path][name].[ext]'],
      },
      {
        test: /\.cmd$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'static', 'index.html'),
      chunks: ['renderer'],
    }),
    new webpack.NormalModuleReplacementPlugin(/^vscode-jsonrpc$/, resource => {
      resource.request = 'vscode-jsonrpc/lib/node/main.js'
    }),
    new webpack.NormalModuleReplacementPlugin(
      /vscode-jsonrpc[\\/]node(\.js)?$/,
      resource => {
        resource.request = 'vscode-jsonrpc/lib/node/main.js'
      }
    ),
    new webpack.DefinePlugin(
      Object.assign({}, replacements, {
        __PROCESS_KIND__: JSON.stringify('ui'),
      })
    ),
  ],
  resolve: {
    // Prevent the renderer from using browser-specific versions of modules
    aliasFields: [],
  },
})

export const crash = merge({}, commonConfig, {
  entry: { crash: path.resolve(__dirname, 'src/crash/index') },
  target: 'electron-renderer',
  plugins: [
    new HtmlWebpackPlugin({
      title: 'GitHub Desktop',
      filename: 'crash.html',
      chunks: ['crash'],
    }),
    new webpack.DefinePlugin(
      Object.assign({}, replacements, {
        __PROCESS_KIND__: JSON.stringify('crash'),
      })
    ),
  ],
})

export const cli = merge({}, commonConfig, {
  entry: { cli: path.resolve(__dirname, 'src/cli/main') },
  target: 'node',
  plugins: [
    new webpack.DefinePlugin(
      Object.assign({}, replacements, {
        __PROCESS_KIND__: JSON.stringify('cli'),
      })
    ),
  ],
})

export const highlighter = merge({}, commonConfig, {
  entry: { highlighter: path.resolve(__dirname, 'src/highlighter/index') },
  output: {
    library: {
      name: '[name]',
      type: 'var',
    },
    chunkFilename: 'highlighter/[name].js',
  },
  optimization: {
    chunkIds: 'named',
    splitChunks: {
      cacheGroups: {
        modes: {
          enforce: true,
          name: (mod: any) => {
            const builtInMode =
              /node_modules[\\\/]codemirror[\\\/]mode[\\\/](\w+)[\\\/]/i.exec(
                mod.resource
              )
            if (builtInMode) {
              return `mode/${builtInMode[1]}`
            }
            const external =
              /node_modules[\\\/]codemirror-mode-(\w+)[\\\/]/i.exec(
                mod.resource
              )
            if (external) {
              return `ext/${external[1]}`
            }
            return 'common'
          },
        },
      },
    },
  },
  target: 'webworker',
  plugins: [
    new webpack.DefinePlugin(
      Object.assign({}, replacements, {
        __PROCESS_KIND__: JSON.stringify('highlighter'),
      })
    ),
  ],
  resolve: {
    // We don't want to bundle all of CodeMirror in the highlighter. A web
    // worker doesn't have access to the DOM and most of CodeMirror's core
    // code is useless to us in that context. So instead we use this super
    // nifty subset of codemirror that defines the minimal context needed
    // to run a mode inside of node. Now, we're not running in node
    // but CodeMirror doesn't have to know about that.
    alias: {
      codemirror$: 'codemirror/addon/runmode/runmode.node.js',
      '../lib/codemirror$': '../addon/runmode/runmode.node.js',
      '../../lib/codemirror$': '../../addon/runmode/runmode.node.js',
      '../../addon/runmode/runmode$': '../../addon/runmode/runmode.node.js',
    },
  },
})

highlighter.module!.rules = [
  {
    test: /\.ts$/,
    include: path.resolve(__dirname, 'src/highlighter'),
    use: [
      {
        loader: 'ts-loader',
        options: {
          configFile: path.resolve(__dirname, 'src/highlighter/tsconfig.json'),
        },
      },
    ],
    exclude: /node_modules/,
  },
]
