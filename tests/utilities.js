/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

const sinon = require('sinon');
const u = require('../utilities.js');
const { easyJSON, complicatedJSON } = require('./utils');

describe('Escaping and Stringifying Objects: ', () => {
  it('Ok, easy JSON stringified and parsed again', (done) => {
    const stringified = u.escapeAndStringify(easyJSON);
    const reverted = u.parseAndUnescape(stringified);
    sinon.assert.match(reverted, easyJSON);
    done();
  });

  it('Ok, complicated JSON stringified and parsed again', (done) => {
    const stringified = u.escapeAndStringify(complicatedJSON);
    const reverted = u.parseAndUnescape(stringified);
    sinon.assert.match(reverted, complicatedJSON);
    done();
  });
});
