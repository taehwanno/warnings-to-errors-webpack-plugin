'use strict';

class WarningsToErrorsPlugin {
  apply(compiler) {
    compiler.hooks.shouldEmit.tap('WarningsToErrorsPlugin', (compilation) => {
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
    });
  }
}

module.exports = WarningsToErrorsPlugin;
