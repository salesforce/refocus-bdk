/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable no-magic-numbers */

const expect = require('chai').expect;
const rewire = require('rewire');
const sinon = require('sinon');
const config = { refocusUrl: 'zzz', token: 'dummy',
  botName: 'test' };
const bdkServer = rewire('../refocus-bdk-server.js');
const { botActionsArray } = require('./utils');
const generic = require('../generic.js');

// Create environment for client code to work
global.user = '{&quot;email&quot;:&quot;test@test.com&quot;'+
  ',&quot;id&quot;:&quot;Test&quot;}';
global.window = { document: { }, location: { href: '' } };
const bdkClient = rewire('../refocus-bdk-client.js');

describe('BDK Client botActions: ', () => {
  beforeEach(() => {
    bdkClient.__set__('localStorage', { 'Name': 'User' });
  });

  it('Ok, createBotAction', (done) => {
    const postStub = sinon.stub(generic, 'post')
      .resolves({ body: { isPending: true } });
    bdkClient.__get__('module.exports')(config, config.botName)
      .createBotAction({})
      .then(() => {
        expect(postStub.firstCall.args[0])
          .to.equal(config.refocusUrl+'/v1/botActions');
        expect(postStub.firstCall.args[1].botId).to.equal(config.botName);
        expect(postStub.firstCall.args[1].userId).to.equal('Test');
        expect(postStub.firstCall.args[2]).to.equal(config.token);
        expect(postStub.calledOnce).to.equal(true);
      }).then(() => generic.post.restore())
      .then(() => done())
      .catch((err) => done(err));
  });
});

describe('BDK Server botActions: ', () => {
  it('Ok, getBotActions', (done) => {
    sinon.stub(generic, 'get')
      .resolves({ body: botActionsArray });

    bdkServer.__get__('module.exports')(config).getBotActions()
      .then((res) => {
        expect(res.body.length).to.equal(botActionsArray.length);
      }).then(() => generic.get.restore())
      .then(() => done());
  });
});
