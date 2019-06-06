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
const config = { refocusUrl: 'zzz', token: 'dummy' };
const bdkServer = rewire('../refocus-bdk-server.js');
const sinon = require('sinon');
const generic = require('../generic.js');

// Create environment for client code to work
global.user = '{&quot;email&quot;:&quot;test@test.com&quot;}';
global.window = { document: { }, location: { href: '' } };
const bdkClient = rewire('../refocus-bdk-client.js');

describe('BDK Client Events: ', () => {
  beforeEach(() => {
    bdkClient.__set__('localStorage', { 'Name': 'User' });
  });

  it('Ok, Get Event < Limit', (done) => {
    const total = 3;
    sinon.stub(generic, 'get').resolves({ header: { 'x-total-count': total },
      body: ['test', 'test', 'test'] });

    bdkClient.__get__('module.exports')(config).getAllEvents('1')
      .then((res) => {
        expect(res.length).to.equal(total);
      }).then(() => generic.get.restore())
      .then(() => done());
  });

  it('Ok, Get Event > Limit', (done) => {
    const total = 100;
    sinon.stub(generic, 'get').resolves({ header: { 'x-total-count': total },
      body: ['test'] });
    bdkClient.__get__('module.exports')(config).getAllEvents('1')
      .then((res) => {
        expect(res.length).to.equal(total);
      }).then(() => generic.get.restore())
      .then(() => done());
  });

  it('Ok, bulk create sends correctly', (done) => {
    const arraySize = 2;
    const returnArray = [{ id: 0 }, { id: 1 }];
    sinon.stub(generic, 'post').resolves({ returnArray });

    bdkClient.__get__('module.exports')(config)
      .bulkCreateEvents([{ 'event1': 1 }, { 'event2': 1 }])
      .then((res) => {
        expect(res.returnArray.length).to.equal(arraySize);
      }).then(() => generic.post.restore())
      .then(() => done());
  });
});

describe('BDK Server Events: ', () => {
  it('Ok, Get Event < Limit', (done) => {
    const total = 3;
    sinon.stub(generic, 'get').resolves({ header: { 'x-total-count': total },
      body: ['test', 'test', 'test'] });

    bdkServer.__get__('module.exports')(config).getAllEvents('1')
      .then((res) => {
        expect(res.length).to.equal(total);
      }).then(() => generic.get.restore())
      .then(() => done());
  });

  it('Ok, Get Event > Limit', (done) => {
    const total = 100;
    sinon.stub(generic, 'get').resolves({ header: { 'x-total-count': total },
      body: ['test'] });

    bdkServer.__get__('module.exports')(config).getAllEvents('1')
      .then((res) => {
        expect(res.length).to.equal(total);
      }).then(() => generic.get.restore())
      .then(() => done());
  });
});
