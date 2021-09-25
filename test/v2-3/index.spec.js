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
      mkdirp: function (path, callback) {
        callback();
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
        entry: './file',
        plugins: [
          new WarningsToErrorsPlugin(),
        ],
      }, (errors, warnings) => {
        errors.length.should.be.eql(0);
        warnings.length.should.be.eql(0);
        done();
      });
    });


    it("there is a warning in top-level compilation, but it's ignored using the 'stats.warningsFilter' config option", (done) => {
      getStats({
        entry: './file',
        plugins: [
          {
            apply(compiler) {
              compiler.plugin('make', (compilation, cb) => {
                compilation.warnings.push(new Error('warning for regular expression filter'));
                compilation.warnings.push(new Error('warning for string filter'));
                compilation.warnings.push(new Error('warning for function filter'));
                cb();
              });
            }
          },
          new WarningsToErrorsPlugin(),
        ],
        stats: {
          children: true,
          warningsFilter: [
            /regular expression filter/,
            'string filter',
            (warning) => warning.message.includes('function filter'),
          ],
        },
      }, (errors, warnings) => {
        errors.length.should.be.eql(0);
        warnings.length.should.be.eql(0);
        done();
      });
    });

    it("there is a warning in child compilation, but it's ignored using the 'stats.warningsFilter' config option", (done) => {
      getStats({
        entry: './file',
        plugins: [
          {
            apply(compiler) {
              compiler.plugin('make', (compilation, cb) => {
                const child = compilation.createChildCompiler('child', {});
                child.plugin('compilation', (childCompilation) => {
                  childCompilation.warnings.push(new Error('warning for regular expression filter in child compilation'));
                  childCompilation.warnings.push(new Error('warning for string filter in child compilation'));
                  childCompilation.warnings.push(new Error('warning for function filter in child compilation'));
                });
                child.runAsChild(cb);
              });
            }
          },
          new WarningsToErrorsPlugin(),
        ],
        stats: {
          warningsFilter: [
            /regular expression filter/,
            'string filter',
            (warning) => warning.message.includes('function filter'),
          ],
        },
      }, (errors, warnings, childrenErrors, childrenWarnings) => {
        errors.length.should.be.eql(0);
        warnings.length.should.be.eql(0);
        childrenErrors.length.should.be.eql(0);
        childrenWarnings.length.should.be.eql(0);
        done();
      });
    });
  });

  it('should have errors if there is an warning in top-level compilation', (done) => {
    getStats({
      entry: './file',
      plugins: [
        {
          apply(compiler) {
            compiler.plugin('make', (compilation, cb) => {
              compilation.errors.push(new Error('compilation error'));
              cb();
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

  it('should have errors if there is an warning in child compilation', (done) => {
    getStats({
      entry: './file',
      plugins: [
        {
          apply(compiler) {
            compiler.plugin('make', (compilation, cb) => {
              const child = compilation.createChildCompiler('child', {});
              child.plugin('compilation', (childCompilation) => {
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
