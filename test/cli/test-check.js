/**
 * This program and the accompanying materials are made available under the terms of the
 * Eclipse Public License v2.0 which accompanies this distribution, and is available at
 * https://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-License-Identifier: EPL-2.0
 *
 * Copyright IBM Corporation 2018
 */

const expect = require('chai').expect;
const debug = require('debug')('test:cli:check');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const warningErrorLinePattern = /-\s+http:\/\/localhost(:[0-9]+|)\/\S*\s+http:\/\/localhost(:[0-9]+|)\/\S+\s+"[0-9, ]+"\s+"[0-9]{3}\s+[^"]+"\s+"(-|[^"]+)"/g;

describe('check broken links on example website', function() {
  it('should return 2 errors with default settings', async function() {
    let result;
    try {
      result = await exec('node ./src/cli.js ./example-website');
    } catch (err) {
      result = err;
    }

    debug('result:', result);

    expect(result).to.have.property('stdout');
    expect(result).to.have.property('stderr');

    const merr = result.stderr.match(warningErrorLinePattern);
    expect(merr).to.have.lengthOf(2);
    const mout = result.stdout.match(warningErrorLinePattern);
    expect(mout).to.be.null;

    expect(result.stderr).to.match(/Error\(s\) of broken links and other issues.+/);
    // link-3.html doesn't exist
    // http://localhost/link-3.html "19" "404 Not Found" "-"
    expect(result.stderr).to.match(/-\s+http:\/\/localhost(:[0-9]+|)\/\S*\s+http:\/\/localhost(:[0-9]+|)\/link-3\.html\s+"[0-9, ]+"\s+"404 Not Found"\s+"-"/);
    // link-2.html doesn't have "nonexists" hash
    // http://localhost/link-2.html "17, 18" "200 OK" "#nonexists"
    expect(result.stderr).to.match(/-\s+http:\/\/localhost(:[0-9]+|)\/\S*\s+http:\/\/localhost(:[0-9]+|)\/link-2\.html\s+"[0-9, ]+"\s+"200 OK"\s+"#nonexists"/);
  });

  it('should return 6 errors with --recursive', async function() {
    let result;
    try {
      result = await exec('node ./src/cli.js ./example-website --recursive');
    } catch (err) {
      result = err;
    }

    debug('result:', result);

    expect(result).to.have.property('stdout');
    expect(result).to.have.property('stderr');

    const merr = result.stderr.match(warningErrorLinePattern);
    expect(merr).to.have.lengthOf(6);
    const mout = result.stdout.match(warningErrorLinePattern);
    expect(mout).to.be.null;

    expect(result.stderr).to.match(/Error\(s\) of broken links and other issues.+/);
    // link-3.html doesn't exist
    // http://localhost/link-3.html "19" "404 Not Found" "-"
    expect(result.stderr).to.match(/-\s+http:\/\/localhost(:[0-9]+|)\/\S*\s+http:\/\/localhost(:[0-9]+|)\/link-3\.html\s+"[0-9, ]+"\s+"404 Not Found"\s+"-"/);
    // link-2.html doesn't have "nonexists" hash
    // http://localhost/link-2.html "17, 18" "200 OK" "#nonexists"
    expect(result.stderr).to.match(/-\s+http:\/\/localhost(:[0-9]+|)\/\S*\s+http:\/\/localhost(:[0-9]+|)\/link-2\.html\s+"[0-9, ]+"\s+"200 OK"\s+"#nonexists"/);
  });

  it('should return 1 error and 1 warning with --ignore-broken-fragments', async function() {
    let result;
    try {
      result = await exec('node ./src/cli.js ./example-website --ignore-broken-fragments');
    } catch (err) {
      result = err;
    }

    debug('result:', result);

    expect(result).to.have.property('stdout');
    expect(result).to.have.property('stderr');

    const merr = result.stderr.match(warningErrorLinePattern);
    expect(merr).to.have.lengthOf(1);
    const mout = result.stdout.match(warningErrorLinePattern);
    expect(mout).to.have.lengthOf(1);

    expect(result.stderr).to.match(/Error\(s\) of broken links and other issues.+/);
    // link-3.html doesn't exist
    // http://localhost/link-3.html "19" "404 Not Found" "-"
    expect(result.stderr).to.match(/-\s+http:\/\/localhost(:[0-9]+|)\/\S*\s+http:\/\/localhost(:[0-9]+|)\/link-3\.html\s+"[0-9, ]+"\s+"404 Not Found"\s+"-"/);

    expect(result.stdout).to.match(/Warning\(s\) of broken links and other issues.+/);
    // link-2.html doesn't have "nonexists" hash
    // http://localhost/link-2.html "17, 18" "200 OK" "#nonexists"
    expect(result.stdout).to.match(/-\s+http:\/\/localhost(:[0-9]+|)\/\S*\s+http:\/\/localhost(:[0-9]+|)\/link-2\.html\s+"[0-9, ]+"\s+"200 OK"\s+"#nonexists"/);
  });
});
