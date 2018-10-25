/**
 * This program and the accompanying materials are made available under the
 * terms of the Eclipse Public License v2.0 which accompanies this
 * distribution, and is available at https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 */

const url = require('url');
const getPort = require('get-port');
const express = require('express');
const colors = require('chalk');
const util = require('util');
const child_process = require('child_process');
const exec = util.promisify(child_process.exec);
const resolve = require('path').resolve;

// default options and values
const defaultOptions = {
  logger: console,

  verbose: false,
  noColor: false,

  baseUrl: '/',
  checklinkCommand: null,

  ignoreRobotsForbidden: false,
  ignoreBrokenFragments: false,
  ignoreRedirection: false,
};
const { CheckLinkOptions } = require('./cli-options');
// default command name of checklink
const CHECKLINK_COMMAND = 'checklink';
// default docker image to run checklink
const DOCKER_IMAGE = 'jackjiaibm/w3c-linkchecker';


class W3CLinkChecker {
  /**
   * W3CLinkChecker Constructor
   *
   * @param  {String} directory  directory or url to test
   * @param  {Object} options [description]
   * @return {[type]}         [description]
   */
  constructor(directory, options) {
    this.directory = directory;
    this.options = { ...defaultOptions, ...options };

    this.logger = this.options.logger;
    this.server = null;

    // disable chalk color
    if (this.options.noColor) {
      process.env.FORCE_COLOR = 0;
    }
  }

  /**
   * Check if a string is URL
   *
   * @param  {String}  str string to test
   * @return {Boolean}
   */
  isUrl(str) {
    const parsedUrl = url.parse(str);
    return !!parsedUrl.hostname;
  }

  /**
   * Try to serve the static files as HTTP server
   *
   * @param  {String} path    The OS path where the html locates
   * @param  {String} baseUrl Base url to serve the files
   * @param  {Number} port    HTTP server port
   * @return {Promise}
   */
  startHttpServer(path, baseUrl, port) {
    return new Promise((resolve, reject) => {
      this.options.verbose && this.logger.debug('%s %s: %s', colors.yellow('[debug][W3CLinkChecker.startHttpServer]'), 'starting server on path', path);
      if (baseUrl !== '/') {
        this.options.verbose && this.logger.debug('%s %s: %s', colors.yellow('[debug][W3CLinkChecker.startHttpServer]'), 'using base url', baseUrl);
      }

      const app = express();
      app.use(baseUrl, express.static(path));

      this.server = app.listen(port);
      this.server.on('listening', () => resolve(port));
      this.server.on('error', err => reject(err));
    });
  }

  /**
   * Run a command using spawn
   *
   * This method may throw exception if stderr is not empty
   *
   * @param  {String} cmd  Full command line
   * @return {String}      stdout if the command is successful
   */
  async runCommand(cmd) {
    let result;

    try {
      result = await exec(cmd);
    } catch (stderr) {
      result = {
        stderr,
      };
    }
    if (result) {
      if (result.stdout) {
        // trim the stdout
        result.stdout = result.stdout.trim();
      }
      if (result.stderr) {
        this.options.verbose && this.logger.debug('%s %s %s', colors.yellow('[debug][W3CLinkChecker.runCommand]'), colors.magenta('[warn]'), result.stderr);
      } else if (!result.stdout) {
        this.options.verbose && this.logger.debug('%s %s "%s" returns empty result', colors.yellow('[debug][W3CLinkChecker.runCommand]'), colors.magenta('[warn]'), cmd);
      } else {
        this.options.verbose && this.logger.debug('%s "%s" succeeded with output "%s"', colors.yellow('[debug][W3CLinkChecker.runCommand]'), colors.green(cmd), result.stdout);
        return result.stdout;
      }
    }

    throw new Error(`Failed to run '${cmd}', enable --verbose mode to check error messages`);
  }

  /**
   * Run a command using spawn
   *
   * This method will print out stdout/stderr whenever available on running the command.
   *
   * This method won't throw exception if stderr is not empty.
   *
   * @param  {String} cmd  Command
   * @param  {Array}  args Arguments for the command
   * @return {Promise}     object of stdout and stderr if the command succeeds
   */
  spawnCommand(cmd, args) {
    return new Promise((resolve, reject) => {
      const ps = child_process.spawn(cmd, args);
      let stdout = [],
        stderr = [];

      ps.stdout.on('data', function(data) {
        process.stdout.write(data.toString());
        stdout.push(data.toString());
      });

      ps.stderr.on('data', function(data) {
        process.stdout.write(colors.red(data.toString()));
        stderr.push(data.toString());
      });

      ps.on('error', (err) => {
        process.stdout.write(colors.red(err.toString()));
        reject(err);
      });

      ps.on('close', function(code) {
        if (code === 0) {
          resolve({ stdout: stdout.join(''), stderr: stderr.join('') });
        } else {
          reject(new Error(`Failed to run '${cmd}', exit code ${code}`));
        }
      });
    });
  }

  /**
   * Local w3c link checker
   *
   * @return {String}   checklink command location, or docker if available
   */
  async locateW3cLinkChecker() {
    if (this.options.checklinkCommand) {
      return this.options.checklinkCommand;
    }

    // try to find checklink command in current OS
    let testCommand = `which ${CHECKLINK_COMMAND}`;
    if (process.platform === 'win32') {
      testCommand = `where.exe ${CHECKLINK_COMMAND}`;
    }
    try {
      const result = await this.runCommand(testCommand);
      return result;
    } catch (e) {
      // ignore error
    }

    // try to use docker
    try {
      await this.runCommand('docker -v');
      return 'docker';
    } catch (e) {
      // ignore error
    }

    throw new Error(`Failed to find w3c '${CHECKLINK_COMMAND}' command, try to specify '--checklink-command' option`);
  }

  /**
   * Parse checklink output and find errors
   *
   * @param  {String} stdout  output of checklink command
   * @return {Array}          array of errors
   */
  parseOutputErrors(stdout) {
    // locate errors
    //
    // Output pattern:
    //
    // Processing\t[utl]
    // ...
    // Valid links.|List of broken links and other issues:
    // ...
    // Anchors
    // Found [0-9]+ anchors.
    //
    // Broken links and other issues pattern:
    // [url]
    //   Line: [0-9]+
    //   Code: [http status code & text]
    //   To do: Some of the links to this resource point to broken URI fragments
    //   (such as index.html#fragment).
    // The following fragments need to be fixed:
    //   [hash]  Line: [0-9]+
    //   ...

    const _this = this;
    const lines = stdout && stdout.split('\n');
    let errors = [],
      error;
    let urlTested = null;
    let issuesSection = false;
    let fragmentSection = false;
    for (let line of lines) {
      line = line.trim();
      if (issuesSection) {
        if (line.indexOf('Anchors') > -1 ||
          line.match(/Found [0-9]+ anchor/) ||
          line.match(/Checked [0-9]+ document/)) {
          if (error) {
            errors.push(error);
            error = null;
          }

          issuesSection = false;
          fragmentSection = false;
        } else if (line.startsWith('http://') || line.startsWith('https://')) {
          if (error) {
            errors.push(error);
            error = null;
          }
          fragmentSection = false;

          error = {
            source: urlTested,
            target: line,
          };
        } else if (error && line.startsWith('Line: ')) {
          error.lines = line.substr(6);
        } else if (error && line.startsWith('Lines: ')) {
          error.lines = line.substr(7);
        } else if (error && line.startsWith('Code: ')) {
          error.code = line.substr(6);
        } else if (error && line.startsWith('To do: ')) {
          error.todo = line.substr(7);
        } else if (error && line.indexOf('The following fragments need to be fixed') > -1) {
          fragmentSection = true;
          error.fragments = [];
        } else if (error && fragmentSection && line.match(/^(\S+)\s+Lines?:\s+([0-9, ]+)$/)) {
          let m = line.match(/^(\S+)\s+Lines?:\s+([0-9, ]+)$/);
          error.fragments.push({
            hash: m[1],
            lines: m[2],
          });
        } else if (error && line) {
          error.todo += ' ' + line;
        }
      } else if (line.indexOf('List of broken links and other issues') > -1) {
        issuesSection = true;
      } else if (line.match(/Processing\s+(.+)/)) {
        if (error) {
          errors.push(error);
          error = null;
        }

        let m = line.match(/Processing\s+(.+)/);
        urlTested = m[1];
        issuesSection = false;
        fragmentSection = false;
      }
    }
    if (error) {
      errors.push(error);
      error = null;
    }

    // filter out errors
    let warnings = [];
    const filteredErrors = errors.filter((error) => {
      if (_this.options.ignoreRobotsForbidden && error && error.code &&
        error.code.indexOf('Forbidden by robots.txt') > -1) {
        warnings.push(error);
        return false;
      }
      if (_this.options.ignoreBrokenFragments && error && error.todo &&
        error.todo.indexOf('broken URI fragments') > -1) {
        warnings.push(error);
        return false;
      }
      if (_this.options.ignoreRedirection && error && error.code &&
        error.code.indexOf(' -> ') > -1) {
        warnings.push(error);
        return false;
      }

      return true;
    });

    return { errors: filteredErrors, warnings, };
  }

  /**
   * Run broken link checker on target
   *
   * @return {Object}   an object including stdout, stderr, or errors (optional)
   */
  async check() {
    try {
      const isUrl = this.isUrl(this.directory);
      if (!isUrl) {
        this.directory = resolve(this.directory);
      }
      const checklink = await this.locateW3cLinkChecker();

      this.logger.info('checking links of "%s" ...', colors.blue(this.directory));

      // prepare command
      let command = null,
        args = [];
      if (checklink === 'docker') {
        command = 'docker';
        args = ['run', '--rm'];
        if (isUrl) {
          args = [...args,
            DOCKER_IMAGE,
            this.directory,
            ...CheckLinkOptions,
          ];
        } else {
          args = [...args,
            '-v', `${this.directory}:/usr/share/nginx/html${this.options.baseUrl}`,
            DOCKER_IMAGE,
            `http://localhost${this.options.baseUrl}`,
            ...CheckLinkOptions,
          ];
        }
      } else {
        command = checklink;
        if (isUrl) {
          args = [...args,
            this.directory,
            ...CheckLinkOptions,
          ];
        } else {
          const port = await getPort();
          await this.startHttpServer(this.directory, this.options.baseUrl, port);

          args = [...args,
            `http://localhost:${port}${this.options.baseUrl}`,
            ...CheckLinkOptions,
          ];
        }
      }
      // copy these boolean options directly to checklink
      for (let opt of ['summary', 'broken', 'directory', 'recursive', 'no-referer', 'quiet', 'verbose', 'indicator', 'hide-same-realm', 'suppress-temp-redirects', ]) {
        if (this.options[opt]) {
          args.push(`--${opt}`);
        }
      }
      // copy these string/number options directly to checklink
      for (let opt of ['depth', 'exclude', 'user', 'password', 'sleep', 'timeout', 'languages', 'cookies', 'connection-cache', 'domain', ]) {
        if (this.options[opt]) {
          args.push(`--${opt}`);
          args.push(this.options[opt]);
        }
      }
      // copy these array options directly to checklink
      for (let opt of ['location', 'exclude-docs', 'suppress-redirect', 'suppress-redirect-prefix', 'suppress-broken', 'suppress-fragment', ]) {
        if (this.options[opt]) {
          for (let one of this.options[opt]) {
            args.push(`--${opt}`);
            args.push(one);
          }
        }
      }
      this.logger.info('with command "%s %s" ...', colors.blue(command), colors.green(args.join(' ')));

      // run test
      const result = await this.spawnCommand(command, args);
      if (result && result.stdout) {
        const { errors, warnings, } = this.parseOutputErrors(result.stdout);
        if (errors && errors.length > 0) {
          result.errors = errors;
        }
        if (warnings && warnings.length > 0) {
          result.warnings = warnings;
        }
      }

      if (this.server) {
        this.options.verbose && this.logger.debug('%s %s', colors.yellow('[debug][W3CLinkChecker.check]'), 'closing server');
        this.server.close();
      }

      return result;
    } catch (err) {
      if (this.server) {
        this.options.verbose && this.logger.debug('%s %s', colors.yellow('[debug][W3CLinkChecker.check]'), 'closing server');
        this.server.close();
      }
      this.options.verbose && this.logger.debug('%s throwing error %s', colors.yellow('[debug][W3CLinkChecker.check]'), err);

      throw err;
    }
  }
}


module.exports = {
  W3CLinkChecker,
};
