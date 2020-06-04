/* eslint-disable no-unused-expressions */

// /**
//  * Copyright (c) 2020, salesforce.com, inc.
//  * All rights reserved.
//  * Licensed under the BSD 3-Clause license.
//  * For full license text, see LICENSE.txt file in the repo root or
//  * https://opensource.org/licenses/BSD-3-Clause
//  */

const expect = require('chai').expect;
const config = { refocusUrl: 'zzz', token: 'dummy' };
// eslint-disable-next-line max-len
const bdk = require('../refocus-bdk-server')(config);
const generic = require('../generic');
const sinon = require('sinon');

const event = {
  id: 'b44dc350-9706-4800-adb2-d0999152e408',
  Room: {
    id: 2,
    name: 'testRoom',
    RoomType: {
      id: 'e118e6f1-a6d5-4164-9c14-7344c733c3e6',
      name: 'testRoomType'
    }
  }
};

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

describe('IsBotInstalledInRoom', () => {
  let getRoomTypeByIdStub;
  let getGenericRoomTypeStub;
  beforeEach(() => {
    getGenericRoomTypeStub = sinon.stub(generic, 'get');
    getRoomTypeByIdStub = sinon.stub(bdk, 'getRoomTypeById');
  });

  afterEach(() => {
    getRoomTypeByIdStub.restore();
    getGenericRoomTypeStub.restore();
  });

  it('true if Bot is listed in RoomType', async () => {
    getGenericRoomTypeStub.returns(Promise.resolve(roomType));
    getRoomTypeByIdStub.returns(Promise.resolve(roomType));
    const botName = 'test-bot';
    const isBotInstalled = await bdk.isBotInstalledInRoom(event, botName);
    expect(isBotInstalled).to.be.true;
  });

  it('OK false if bot not roomType ', async () => {
    getGenericRoomTypeStub.returns(Promise.resolve(roomType));
    getRoomTypeByIdStub.returns(Promise.resolve(roomType));
    const botName = 'robot';
    const isBotInstalled = await bdk.isBotInstalledInRoom(event, botName);
    expect(isBotInstalled).to.be.false;
  });
});
