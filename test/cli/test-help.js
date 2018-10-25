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
const debug = require('debug')('test:cli:help');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

describe('check cli options', function() {
  it('should return help information', async function() {
    const result = await exec('node ./src/cli.js --help');

    debug('result:', result);

    expect(result).to.have.property('stdout');
    expect(result).to.have.property('stderr');

    expect(result.stderr).to.be.empty;
    expect(result.stdout).to.match(/^Usage: w3c-linkchecker-local.+/);
  });
});
