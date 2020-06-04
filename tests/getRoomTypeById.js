
/**
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

const expect = require('chai').expect;
const config = { refocusUrl: 'zzz', token: 'dummy' };
// eslint-disable-next-line max-len
const bdk = require('../refocus-bdk-server')(config);
const generic = require('../generic');
const sinon = require('sinon');

const roomType = {
  body: {
    id: 'e118e6f1-a6d5-4164-9c14-7344c733c3e6',
    name: 'test-room-type',
    isEnabled: true,
    bots: [
      'test-bot'
    ]
  }
};

describe('getRoomTypeById', () => {
  let getGenericRoomTypeStub;
  beforeEach(() => {
    getGenericRoomTypeStub = sinon.stub(generic, 'get');
  });

  afterEach(() => {
    getGenericRoomTypeStub.restore();
  });

  it('OK if roomTypeId matches response', async () => {
    getGenericRoomTypeStub.returns(Promise.resolve(roomType));
    const roomTypeId = 'e118e6f1-a6d5-4164-9c14-7344c733c3e6';
    const roomTypeBody = await bdk.getRoomTypeById(roomTypeId);
    expect(roomTypeBody.id).to.be.equal('e118e6f1-a6d5-4164-9c14-7344c733c3e6');
  });

  it('OK should Fail on a bad request', async () => {
    getGenericRoomTypeStub.returns(Promise.resolve(roomType));
    const roomTypeBody = await bdk.getRoomTypeById();
    // eslint-disable-next-line no-unused-expressions
    expect(roomTypeBody).to.be.null;
  });
});
