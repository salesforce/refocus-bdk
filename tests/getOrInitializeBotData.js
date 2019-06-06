/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * tests/getOrInitializeBotData
 */

const expect = require('chai').expect;
const rewire = require('rewire');
const serialize = require('serialize-javascript');
const config = { refocusUrl: 'zzz', token: 'dummy' };
const roomId = 10;
const botName = 'test';
const sinon = require('sinon');
const generic = require('../generic.js');

global.user = '{&quot;email&quot;:&quot;test@test.com&quot;'+
  ',&quot;id&quot;:&quot;Test&quot;}';
global.window = { document: { }, location: { href: '' } };
const bdk = rewire('../refocus-bdk-client.js');

describe('getOrInitializeBotData function >', () => {
  it('Ok, BotData exists, just retrieve it', (done) => {
    const expectedResponse = 'testing';
    const data = serialize(expectedResponse);
    sinon.stub(generic, 'get').resolves({
      body: [{ 'name': 'test', 'value': data }]
    });
    bdk.__get__('module.exports')(config)
      .getOrInitializeBotData(roomId, botName, 'test', {})
      .then((res) => {
        expect(JSON.parse(res)).to.equal(expectedResponse);
        done();
      }).then(() => generic.get.restore());
  });

  it('Ok, BotData does not exist, create it with a default value', (done) => {
    const defaultValue = '';
    sinon.stub(generic, 'get').resolves({
      body: [{ 'name': 'test', 'value': null }]
    });
    sinon.stub(generic, 'post').resolves({ body: { 'name': 'test2',
      'value': {} }
    });
    bdk.__get__('module.exports')(config)
      .getOrInitializeBotData(roomId, botName, 'test2', defaultValue)
      .then((res) => {
        expect(res)
          .to.equal(defaultValue);
        done();
      }).then(() => generic.post.restore())
      .then(() => generic.get.restore());
  });
});
