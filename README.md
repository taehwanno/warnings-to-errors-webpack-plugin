# Warnings To Errors Webpack Plugin [![Build Status](https://circleci.com/gh/taehwanno/warnings-to-errors-webpack-plugin/tree/master.svg?style=shield&circle-token=bb46a55947094ef2eae0ac99f6d7ccff524e73a9)](https://circleci.com/gh/taehwanno/warnings-to-errors-webpack-plugin/tree/master)

**Table of contents**

- [Motivation](#motivation)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Motivation

Even if the build result with webpack has some warnings, the build can succeed with no error exit codes. This can be trouble if some developer not carefully sees the result of CI service. By changing all warnings to errors, webpack can recognize every warning as an error.

## Installation

```bash
$ npm i -D warnings-to-errors-webpack-plugin
# or
$ yarn add -D warnings-to-errors-webpack-plugin
```


## Usage

- **default**

```js
const WarningsToErrorsPlugin = require('warnings-to-errors-webpack-plugin');

module.exports = {
  // ...
  plugins: [
    new WarningsToErrorsPlugin(),
  ],
};
```

- **with [`warningsFilter`](https://webpack.js.org/configuration/stats/#statswarningsfilter) and [`ignoreWarnings`](https://webpack.js.org/configuration/other-options/#ignorewarnings)**

This plugin ignores warnings that are matched by `warningsFilter` or `ignoreWarnings` without recognizing them as errors.

```js
// webpack v5
{
  plugins: [
    new WarningsToErrorsPlugin(),
  ],
  ignoreWarnings: [
    {
      message: /compilation warning/,
    },
  ],
}
```

If you use `ignoreWarnings` and `warningsFilter ` options at the same time in webpack v5, the plugin will ignore all matched warnings in both. but recommend using `ignoreWarnings`.

```js
// webpack v5
{
  plugins: [
    new WarningsToErrorsPlugin(),
  ],
  ignoreWarnings: [
    {
      message: /compilation warning 1/,
    },
  ],
  stats: {
    warningsFilter: [
      /compilation warning 2/,
    ],
  },
}
```

```js
// webpack v2, v3 and v4
{
  plugins: [
    new WarningsToErrorsPlugin(),
  ],
  stats: {
    warningsFilter: [
      /compilation warning/,
    ],
  },
}
```

- **with [`NoEmitOnErrorsPlugin`](https://webpack.js.org/plugins/no-emit-on-errors-plugin/)**

Skip the emitting phase whenever there are warnings while compiling. this ensures that no assets are emitted that include warnings.

```js
// webpack >= v4
{
  optimization: {
    noEmitOnErrors: true,
  },
  plugins: [
    new WarningsToErrorsPlugin();
  ],
};
```

```js
// webpack v2 and v3
{
  plugins: [
    new WarningsToErrorsPlugin(),
    new NoEmitOnErrorsPlugin(),
  ],
};
```

## License

MIT © [Taehwan Noh](https://github.com/taehwanno)
