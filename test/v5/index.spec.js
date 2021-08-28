const path = require('path');
const should = require('should');
const webpack = require('webpack');
const WarningsToErrorsPlugin = require('../../');

const base = path.join(__dirname, '../fixtures');
const { flatten } = require('../utils')

describe('WarningsToErrorsPlugin', () => {
  function customOutputFilesystem(c) {
    const files = {};
    c.outputFileSystem = {
      join: path.join.bind(path),
      mkdir: function (path, callback) {
        callback();
      },
      stat: function (path, callback) {
        callback(null, { isFile: () => true });
      },
      writeFile: function (name, content, callback) {
        files[name] = content.toString('utf-8');
        callback();
      }
    }
  }

  function getStats(options, callback) {
    options.context = base;
    const c = webpack(options);
    customOutputFilesystem(c);
    c.run((err, stats) => {
      if (err) throw err;
      should.strictEqual(typeof stats, 'object');
      stats = stats.toJson({
        errorDetails: false,
      });
      should.strictEqual(typeof stats, 'object');
      stats.should.have.property('errors');
      stats.should.have.property('warnings');
      Array.isArray(stats.errors).should.be.ok();
      Array.isArray(stats.warnings).should.be.ok();
      callback(
        stats.errors,
        stats.warnings,
        flatten(stats.children.map(child => child.errors)),
        flatten(stats.children.map(child => child.warnings)),
      );
    });
  }

  describe('should have no errors and no warnings if:', () => {
    it('there are no errors and no warnings', (done) => {
      getStats({
        mode: 'development',
        entry: './no-errors-and-warnings',
        plugins: [
          new WarningsToErrorsPlugin(),
        ],
      }, (errors, warnings) => {
        errors.length.should.be.eql(0);
        warnings.length.should.be.eql(0);
        done();
      });
    });

    it("there is a warning in top-level compilation, but it's ignored using the 'ignoreWarnings' config option", (done) => {
      getStats({
        mode: 'development',
        entry: './file',
        plugins: [
          {
            apply(compiler) {
              compiler.hooks.make.tap('MakeCompilationWarning', (compilation) => {
                compilation.warnings.push(new Error('This is a compilation warning'));
              });
            }
          },
          new WarningsToErrorsPlugin(),
        ],
        ignoreWarnings: [
          {
            message: /compilation warning/,
          },
        ],
      }, (errors, warnings) => {
        errors.length.should.be.eql(0);
        warnings.length.should.be.eql(0);
        done();
      });
    });

    it("there is a warning in child compilation, but it's ignored using the 'ignoreWarnings' config option", (done) => {
      getStats({
        mode: 'development',
        entry: './file',
        plugins: [
          {
            apply(compiler) {
              compiler.hooks.make.tapAsync('MakeChildCompilationWarnings', (compilation, cb) => {
                const child = compilation.createChildCompiler('child', {});
                child.hooks.compilation.tap('MakeChildCompilationWarnings', (childCompilation) => {
                  childCompilation.warnings.push(new Error('This is a warning in child compilation'));
                });
                child.runAsChild(cb);
              });
            }
          },
          new WarningsToErrorsPlugin(),
        ],
        ignoreWarnings: [
          {
            message: /warning in child/,
          }
        ],
      }, (errors, warnings, childrenErrors, childrenWarnings) => {
        errors.length.should.be.eql(0);
        warnings.length.should.be.eql(0);
        childrenErrors.length.should.be.eql(0);
        childrenWarnings.length.should.be.eql(0);
        done();
      });
    });
  });

  describe('should have errors if:', () => {
    it('there is an error in top-level compilation', (done) => {
      getStats({
        mode: 'development',
        entry: './file',
        plugins: [
          {
            apply(compiler) {
              compiler.hooks.make.tap('MakeCompilationWarning', (compilation) => {
                compilation.errors.push(new Error('This is a compilation error'));
              });
            }
          },
          new WarningsToErrorsPlugin(),
        ],
      }, (errors, warnings) => {
        errors.length.should.be.eql(1);
        warnings.length.should.be.eql(0);
        done();
      });
    });

    it('there is a warning in top-level compilation', (done) => {
      getStats({
        mode: 'development',
        entry: './file',
        plugins: [
          {
            apply(compiler) {
              compiler.hooks.make.tap('MakeCompilationWarning', (compilation) => {
                compilation.warnings.push(new Error('This is a compilation warning'));
              });
            }
          },
          new WarningsToErrorsPlugin(),
        ],
      }, (errors, warnings) => {
        errors.length.should.be.eql(1);
        warnings.length.should.be.eql(0);
        done();
      });
    });

    it('there is an error in child compilation', (done) => {
      getStats({
        mode: 'development',
        entry: './file',
        plugins: [
          {
            apply(compiler) {
              compiler.hooks.make.tapAsync('MakeChildCompilationWarnings', (compilation, cb) => {
                const child = compilation.createChildCompiler('child', {});
                child.hooks.compilation.tap('MakeChildCompilationWarnings', (childCompilation) => {
                  childCompilation.errors.push(new Error('child compilation'));
                });
                child.runAsChild(cb);
              });
            }
          },
          new WarningsToErrorsPlugin(),
        ],
      }, (errors, warnings, childrenErrors, childrenWarnings) => {
        errors.length.should.be.eql(0);
        warnings.length.should.be.eql(0);
        childrenErrors.length.should.be.eql(1);
        childrenWarnings.length.should.be.eql(0);
        done();
      });
    });

    it('there is a warning in child compilation', (done) => {
      getStats({
        mode: 'development',
        entry: './file',
        plugins: [
          {
            apply(compiler) {
              compiler.hooks.make.tapAsync('MakeChildCompilationWarnings', (compilation, cb) => {
                const child = compilation.createChildCompiler('child', {});
                child.hooks.compilation.tap('MakeChildCompilationWarnings', (childCompilation) => {
                  childCompilation.warnings.push(new Error('child compilation'));
                });
                child.runAsChild(cb);
              });
            }
          },
          new WarningsToErrorsPlugin(),
        ],
      }, (errors, warnings, childrenErrors, childrenWarnings) => {
        errors.length.should.be.eql(0);
        warnings.length.should.be.eql(0);
        childrenErrors.length.should.be.eql(1);
        childrenWarnings.length.should.be.eql(0);
        done();
      });
    });
  });
});
