'use strict';

class WarningsToErrorsPlugin {
  apply(compiler) {
    if ('hooks' in compiler) {
      compiler.hooks.shouldEmit.tap('WarningsToErrorsPlugin', this.handleHook);
    } else {
      compiler.plugin('should-emit', this.handleHook);
    }
  }

  handleHook(compilation) {
    if (compilation.warnings.length > 0) {
      compilation.errors = compilation.errors.concat(compilation.warnings);
      compilation.warnings = [];
    }

    compilation.children.forEach((child) => {
      if (child.warnings.length > 0) {
        child.errors = child.errors.concat(child.warnings);
        child.warnings = [];
      }
    });
  }
}

module.exports = WarningsToErrorsPlugin;
