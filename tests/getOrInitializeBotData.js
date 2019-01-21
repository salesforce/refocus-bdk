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
const bdk = rewire('../refocus-bdk-client.js');
const roomId = 10;
const botName = 'test';

global.user = '{&quot;email&quot;:&quot;test@test.com&quot;}';
global.window = { document: { }, location: { href: '' } };

describe('getOrInitializeBotData function >', () => {
  it('Ok, BotData exists, just retrieve it', (done) => {
    const expectedResponse = 'testing';
    const data = serialize(expectedResponse);
    bdk.__set__('genericGet', () => {
      return new Promise((resolve) => {
        resolve({
          body: [{ 'name': 'test',
            'value': data }]
        });
      });
    });
    bdk.__get__('module.exports')(config)
      .getOrInitializeBotData(roomId, botName, 'test', {})
      .then((res) => {
        expect(JSON.parse(res)).to.equal(expectedResponse);
        done();
      });
  });

  it('Ok, BotData does not exist, create it with a default value', (done) => {
    const defaultValue = '';
    bdk.__set__('genericPost', () => {
      return new Promise((resolve) => {
        resolve({ body:
          { 'name': 'test2',
            'value': {}
          }
        });
      });
    });
    bdk.__get__('module.exports')(config)
      .getOrInitializeBotData(roomId, botName, 'test2', defaultValue)
      .then((res) => {
        expect(res)
          .to.equal(defaultValue);
        done();
      });
  });
});
