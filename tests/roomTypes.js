/**
 * Copyright (c) 2019, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

const expect = require('chai').expect;
const rewire = require('rewire');
const config = { refocusUrl: 'zzz', token: 'dummy' };
const bdkServer = rewire('../refocus-bdk-server.js');
const sinon = require('sinon');
const generic = require('../generic.js');

// Create environment for client code to work
global.user = '{&quot;email&quot;:&quot;test@test.com&quot;}';
global.window = { document: { }, location: { href: '' } };
const bdkClient = rewire('../refocus-bdk-client.js');

const ONE = 1;

describe('BDK Client roomTypes: ', () => {
  beforeEach(() => {
    bdkClient.__set__('localStorage', { 'Name': 'User' });
  });

  it('Ok, get roomTypes', (done) => {
    sinon.stub(generic, 'get').resolves({ body:
      [{ id: 'abcdefg', name: 'RoomTypeName' }] });
    bdkClient.__get__('module.exports')(config).getRoomTypes()
      .then((res) => {
        expect(res.body.length).to.equal(ONE);
      }).then(() => generic.get.restore())
      .then(() => done());
  });
});

describe('BDK Server roomTypes: ', () => {
  it('Ok, getRoomTypes', (done) => {
    sinon.stub(generic, 'get').resolves({ body:
      [{ id: 'abcdefg', name: 'RoomTypeName' }] });
    bdkServer.__get__('module.exports')(config).getRoomTypes()
      .then((res) => {
        expect(res.body.length).to.equal(ONE);
      }).then(() => generic.get.restore())
      .then(() => done());
  });
});
