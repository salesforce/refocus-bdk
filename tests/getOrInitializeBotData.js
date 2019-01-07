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
const sinon = require('sinon');
const rewire = require('rewire');
const serialize = require('serialize-javascript');

const _ = require('lodash');
const config = { refocusUrl: 'zzz', token: 'dummy' };
const bdk = rewire('../refocus-bdk-client.js');
const { bot, botWithUI } = require('./utils');
const roomId = 10;
const botName = "test";

global.user = '{&quot;email&quot;:&quot;test@test.com&quot;}';
global.window = { document: { }, location: { href: '' } };



describe('getOrInitializeBotData function >', () => {
  it('Ok, BotData exists, just retrieve it', (done) => {
    const testStr = "testing";
    const data = serialize(testStr)
    bdk.__set__('genericGet', () => {
      return new Promise((resolve) => {
        resolve({
          body: [{ "name": "test",
            "value": data}]
          });
      });
    });
    bdk.__get__('module.exports')(config).getOrInitializeBotData(roomId, botName, "test", {})
      .then((res) => {
        expect(JSON.parse(res)).to.equal(testStr);
        done();
      });
  });

  it('Ok, BotData does not exist, create it', (done) => {
    bdk.__set__('genericPost', () => {
      return new Promise((resolve) => {
        resolve({ body:
          { "name": "test2",
            "value": {}}
         });
      });
    });
    bdk.__get__('module.exports')(config).getOrInitializeBotData(roomId, botName, "test2", '')
      .then((res) => {
        expect(res)
          .to.equal('');
        done();
      });
  });
});
