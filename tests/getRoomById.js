
/**
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

const expect = require('chai').expect;
const config = { refocusUrl: 'zzz', token: 'dummy' };
const bdk = require('../refocus-bdk-server')(config);
const generic = require('../generic');
const sinon = require('sinon');

const room = {
  'body': {
    'id': 2,
    'name': 'testRoom',
    'origin': 'other',
    'active': false,
    'bots': [
      'test-Bot'
    ],
    'type': 'e118e6f1-a6d5-4164-9c14-7344c733c3e6'
  }
};

describe('getRoomById', () => {
  let getGenericRoomStub;
  beforeEach(() => {
    getGenericRoomStub = sinon.stub(generic, 'get');
  });

  afterEach(() => {
    getGenericRoomStub.restore();
  });

  it('OK if roomId matches response', async () => {
    getGenericRoomStub.returns(Promise.resolve(room));
    const roomId = 2;
    const roomBody = await bdk.getRoomById(roomId);
    // eslint-disable-next-line no-unused-expressions
    expect(roomBody).to.not.be.null;
  });

  it('OK should fail when invalid id', async () => {
    getGenericRoomStub.returns(Promise.resolve(room));
    const roomBody = await bdk.getRoomById();
    // eslint-disable-next-line no-unused-expressions
    expect(roomBody).to.be.null;
  });

  it('OK should be null in when request fails', async () => {
    getGenericRoomStub.returns(Promise.resolve());
    const roomId = '3';
    const roomBody = await bdk.getRoomById(roomId);
    // eslint-disable-next-line no-unused-expressions
    expect(roomBody).to.be.null;
  });
});
