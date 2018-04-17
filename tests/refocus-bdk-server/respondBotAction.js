/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

const expect = require('chai').expect;
const sinon = require('sinon');
const _ = require('lodash');
const config = { refocusUrl: 'zzz', token: 'dummy' };
const bdk = require('../../refocus-bdk-server')(config);
const { respondBotActionResponse } = require('./utils');

describe('Responding to a botAction: ', () => {
  beforeEach(() => {
    sinon.stub(bdk, 'respondBotAction');
  });

  afterEach(() => {
    bdk.respondBotAction.restore();
  });

  it('Ok, responded to botAction', (done) => {
    // TODO
    done();
  });
});
