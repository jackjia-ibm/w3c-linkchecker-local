#!/usr/bin/env node

/**
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v2.0 which accompanies this
 * distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const colors = require('chalk');
// load tool version
const pkg = require('../package.json');
// load other functions
const { P } = require('./utils');
const { W3CLinkChecker } = require('./index');
const { CliOptions } = require('./cli-options');

// parse arguments
const yargs = require('yargs');
const argv = yargs
  .version(pkg.version)
  .scriptName(pkg.name)
  .usage('Usage: $0 [options] <directory|url>')
  .options(CliOptions)
  .demandCommand()
  .help()
  .alias('h', 'help')
  .parse();

// validate directory argv
const directory = argv && argv._ && argv._[0];
if (!directory) {
  yargs.showHelp();
  process.exit(1);
}

if (argv.noColor) {
  process.env.FORCE_COLOR = 0;
}

// init logger
const logger = console;
if (argv.verbose) {
  // print argument debug info
  logger.debug('%s %s', colors.yellow('[debug]'), colors.blue('Command line arguments:'));
  logger.debug('%s %s: %s', colors.yellow('[debug]'), colors.cyan(directory.padStart(20)), colors.green(directory));
  for (let i in argv) {
    if (i === '$0' || i === '_') {
      continue;
    }
    logger.debug('%s %s: %s', colors.yellow('[debug]'), colors.cyan(String(i).padStart(20)), colors.green(argv[i]));
  }
  logger.debug();
}

// check started
P()
  .then(async () => {
    const wlc = new W3CLinkChecker(directory, { ...argv, logger, });
    return await wlc.check();
  })
  .then((result) => {
    let hasWarnings = false;
    if (result && result.warnings && result.warnings.length) {
      argv.verbose && logger.debug('%s Found warnings: %s', colors.yellow('[debug]'), JSON.stringify(result.warnings));

      logger.info();
      logger.info(colors.yellow('================================================================================='));
      logger.info(colors.yellow('Warning(s) of broken links and other issues (source target lines code fragments):'));
      for (let warning of result.warnings) {
        let fragments = [];
        if (warning.fragments) {
          for (let fragment of warning.fragments) {
            fragments.push(`#${fragment.hash}`);
          }
        }
        logger.info('- %s %s "%s" "%s" "%s"', warning.source || '-', warning.target || '-', warning.lines || '-', warning.code || '-', fragments.join(',') || '-');
      }
      logger.info(colors.yellow(`Total ${result.warnings.length} warning(s).`));
      logger.info();

      hasWarnings = true;
    }

    if (result && result.errors && result.errors.length) {
      argv.verbose && logger.debug('%s Found errors: %s', colors.yellow('[debug]'), JSON.stringify(result.errors));

      logger.error();
      logger.error(colors.red('==============================================================================='));
      logger.error(colors.red('Error(s) of broken links and other issues (source target lines code fragments):'));
      for (let error of result.errors) {
        let fragments = [];
        if (error.fragments) {
          for (let fragment of error.fragments) {
            fragments.push(`#${fragment.hash}`);
          }
        }
        logger.error('- %s %s "%s" "%s" "%s"', error.source || '-', error.target || '-', error.lines || '-', error.code || '-', fragments.join(',') || '-');
      }
      logger.error(colors.red(`Total ${result.errors.length} error(s).`));
      logger.error();
      process.exit(1);
      return;
    }

    if (!hasWarnings) {
      logger.info();
      logger.info(colors.green('========================'));
      logger.info(colors.green('Check ends successfully!'));
      logger.info();
    }

    argv.verbose && logger.debug('%s successfully exit', colors.yellow('[debug]'));
    process.exit(0);
  })
  .catch((err) => {
    if (err.stack) {
      logger.error('%s %s', colors.red('[error]'), err.stack);
    } else {
      logger.error('%s %s', colors.red('[error]'), err);
    }
    process.exit(1);
  });
