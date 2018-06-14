/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

const expect = require('chai').expect;
const rewire = require('rewire');
const config = { refocusUrl: 'zzz', token: 'dummy' };
const bdkServer = rewire('../refocus-bdk-server.js');
const { botActionsArray } = require('./utils');

// Create enviornment for client code to work
global.user = '{&quot;email&quot;:&quot;test@test.com&quot;}';
global.window = { document: { }, location: { href: '' } };
const bdkClient = rewire('../refocus-bdk-client.js');

describe('BDK Client botActions: ', () => {
  beforeEach(() => {
    bdkClient.__set__('localStorage', { 'Name': 'User' });
  });

  it('Ok, createBotAction', (done) => {
    bdkClient.__set__('genericPost', () => {
      return new Promise((resolve) => {
        resolve({ body: { isPending: true } });
      });
    });
    bdkClient.__get__('module.exports')(config).createBotAction({})
      .then((res) => {
        expect(res.body.isPending).to.equal(true);
        done();
      });
  });
});

describe('BDK Server botActions: ', () => {
  it('Ok, getBotActions', (done) => {
    bdkServer.__set__('genericGet', () => {
      return new Promise((resolve) => {
        resolve({ body: botActionsArray });
      });
    });
    bdkServer.__get__('module.exports')(config).getBotActions()
      .then((res) => {
        expect(res.body.length).to.equal(botActionsArray.length);
        done();
      });
  });

  it('Ok, respondBotAction', (done) => {
    bdkServer.__set__('genericPatch', () => {
      return new Promise((resolve) => {
        resolve({ body: { isPending: false, userId: 'testUserId' } });
      });
    });
    bdkServer.__set__('genericGet', () => {
      return new Promise((resolve) => {
        resolve({ body: { fullName: 'testFullName' } });
      });
    });
    bdkServer.__set__('genericPost', () => {
      return new Promise((resolve) => {
        resolve({ body: {
          eventObject: { context: { user: { fullName: 'testFullName' } } }
        } });
      });
    });
    bdkServer.__get__('module.exports')(config).respondBotAction()
      .then((res) => {
        expect(res.body.eventObject.context.user.fullName)
          .to.equal('testFullName');
        done();
      });
  });
});
