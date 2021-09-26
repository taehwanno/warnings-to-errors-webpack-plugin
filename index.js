'use strict';

class WarningsToErrorsPlugin {
  apply(compiler) {
    if ('hooks' in compiler) {
      // For webpack v4+
      compiler.hooks.shouldEmit.tap('WarningsToErrorsPlugin', (compilation) => this.handleHook(compiler, compilation));
    } else {
      // For webpack v2, v3
      compiler.plugin('should-emit', (compilation) => this.handleHook(compiler, compilation));
    }
  }

  combineIgnores(compiler) {
    const ignoreWarnings = compiler.options.ignoreWarnings || [];
    const warningsFilter = (compiler.options.stats && compiler.options.stats.warningsFilter) || []
    return ignoreWarnings.concat(warningsFilter);
  }

  /**
   * In webpack v5, ignoreWarnings's every value in the config are converted to function with
   * "function (WebpackError, Compilation) => boolean" signature when creating webpack plugin.
   * but stats.warningsFilter has the same type as the passed value in webpack v2, v3 and v4 because it is not converted.
   * it can be string, regular expression and function with "function (WebpackError) => boolean" signature.
   *
   * As a result, because the function signature of v5 is compatible with v4's function
   * we will normalize warningsFilter's every value to function with "function (WebpackError) => boolean" signature.
   *
   * webpack v4 stats.warningsFilter
   * @see https://webpack.js.org/configuration/stats/#statswarningsfilter
   * webpack v5 ignoredWarnings
   * @see https://webpack.js.org/configuration/other-options/#ignorewarnings
   */
  normalizeIgnores(ignores) {
    return ignores.map((ignore) => {
      switch (typeof ignore) {
        case 'function':
          return ignore;
        case 'string':
          return (warning) => warning.message.includes(ignore);
        case 'object': {
          if (ignore instanceof RegExp) {
            return (warning) => ignore.test(warning.message);
          }
        }
        default:
          return ignore;
      }
    });
  }

  filterIgnoredWarnings(allWarnings, ignoredWarnings, compilation) {
    return allWarnings.filter(warning => !ignoredWarnings.some(ignore => ignore(warning, compilation)));
  }

  handleHook(compiler, compilation) {
    const ignores = this.combineIgnores(compiler);
    const normalizedIgnores = this.normalizeIgnores(ignores);

    if (compilation.warnings.length > 0) {
      const filteredWarnings = this.filterIgnoredWarnings(compilation.warnings, normalizedIgnores, compilation);
      compilation.errors = compilation.errors.concat(filteredWarnings);
      compilation.warnings = [];
    }

    compilation.children.forEach((child) => {
      if (child.warnings.length > 0) {
        const filteredWarnings = this.filterIgnoredWarnings(child.warnings, normalizedIgnores, compilation);
        child.errors = child.errors.concat(filteredWarnings);
        child.warnings = [];
      }
    });
  }
}

module.exports = WarningsToErrorsPlugin;
