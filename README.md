# Warnings To Errors Webpack Plugin [![Build Status](https://circleci.com/gh/taehwanno/warnings-to-errors-webpack-plugin/tree/master.svg?style=shield&circle-token=bb46a55947094ef2eae0ac99f6d7ccff524e73a9)](https://circleci.com/gh/taehwanno/warnings-to-errors-webpack-plugin/tree/master)

**Table of contents**

- [Motivation](#motivation)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Motivation

Even if build result with webpack has some warnings, build succeed with no error exit codes. This can be trouble if some developer not carefully sees the result of CI service. By changing warnings to errors, webpack can recognize every warning as errors.

This can happen especially if you use the `resolve.alias` option.

1. webpack configuration

```js
{
  resolve: {
    alias: {
      actions: 'app/state/actions.js'
    }
  }
}
```

2. `resolve.alias` file code

```js
// app/state/actions.js
export const loadUserList = () => {}
```

3. import `actions` in some file. build result has a warning :bug:

```js
// loadUserLists. Not a loadUserList.
import { loadUserLists } from 'actions';

// ...
```


## Installation

```bash
$ npm install --save-dev warnings-to-errors-webpack-plugin
```

Alternatively, using yarn.

```bash
$ yarn add --dev warnings-to-errors-webpack-plugin
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

- **with [`NoEmitOnErrorsPlugin`](https://webpack.js.org/plugins/no-emit-on-errors-plugin/)**

Skip the emitting phase whenever there are warnings while compiling. This ensures that no assets are emitted that include warnings.

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
