'use strict';

class WarningsToErrorsPlugin {
  apply(compiler) {
    if ('hooks' in compiler) {
      compiler.hooks.shouldEmit.tap('WarningsToErrorsPlugin', (compilation) => this.handleHook(compiler, compilation));
    } else {
      compiler.plugin('should-emit', (compilation) => this.handleHook(compiler, compilation));
    }
  }

  filterIgnoredWarnings(allWarnings, ignoredWarnings, compilation) {
    return allWarnings.filter(warning => !ignoredWarnings.some(ignore => ignore(warning, compilation)));
  }

  handleHook(compiler, compilation) {
    const ignoredWarnings = compiler.options.ignoreWarnings || [];
    if (compilation.warnings.length > 0) {
      const filteredWarnings = this.filterIgnoredWarnings(compilation.warnings, ignoredWarnings, compilation);
      compilation.errors = compilation.errors.concat(filteredWarnings);
      compilation.warnings = [];
    }

    compilation.children.forEach((child) => {
      if (child.warnings.length > 0) {
        const filteredWarnings = this.filterIgnoredWarnings(child.warnings, ignoredWarnings, compilation);
        child.errors = child.errors.concat(filteredWarnings);
        child.warnings = [];
      }
    });
  }
}

module.exports = WarningsToErrorsPlugin;
