import { Compiler } from 'webpack';

export = WarningsToErrorsPlugin;

declare class WarningsToErrorsPlugin {
  constructor();
  apply(compiler: Compiler): void;
}
