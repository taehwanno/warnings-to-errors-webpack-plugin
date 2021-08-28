const path = require('path');
const should = require('should');
const webpack = require('webpack');
const WarningsToErrorsPlugin = require('../../');

const base = path.join(__dirname, '../fixtures');

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
        stats.children.map(child => child.errors),
        stats.children.map(child => child.warnings),
      );
    });
  }

  it('should not have errors if there is no warning', (done) => {
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
      childrenErrors[0].length.should.be.eql(1);
      childrenWarnings.length.should.be.eql(1);
      childrenWarnings[0].length.should.be.eql(0);
      done();
    });
  });
});
