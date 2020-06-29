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

const event = {
  'id': '3020a0d7-099b-42cd-b668-3f73fbca674d',
  'log': 'Room deactivated',
  'context': {
    'type': 'RoomState',
    'active': false
  },
  'createdAt': '2020-06-28T07:31:00.614Z',
  'updatedAt': '2020-06-28T07:31:00.614Z',
  'roomId': 2,
};

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

describe('IsBotInstalledInRoom', () => {
  let getGenericRoomStub;
  beforeEach(() => {
    getGenericRoomStub = sinon.stub(generic, 'get');
  });

  afterEach(() => {
    getGenericRoomStub.restore();
  });

  it('true if Bot is listed in Room', async () => {
    getGenericRoomStub.returns(Promise.resolve(room));
    const botName = 'test-Bot';
    // eslint-disable-next-line max-len
    const isBotInstalled = await bdk.isBotInstalledInRoom(event.roomId, botName);
    // eslint-disable-next-line no-unused-expressions
    expect(isBotInstalled).to.be.true;
  });

  it('OK false if bot not room', async () => {
    getGenericRoomStub.returns(Promise.resolve(room));
    const botName = 'robot';
    // eslint-disable-next-line max-len
    const isBotInstalled = await bdk.isBotInstalledInRoom(event.roomId, botName);
    // eslint-disable-next-line no-unused-expressions
    expect(isBotInstalled).to.be.false;
  });

  it('OK false if room is invalid ', async () => {
    const invalidRoom = {
      body: {
        id: 'e118e6f1-a6d5-4164-9c14-7344c733c3e6',
        name: 'test-room-type',
        isEnabled: true,
        Wrongbots: [
          'test-bot'
        ]
      }
    };
    getGenericRoomStub.returns(Promise.resolve(invalidRoom));
    const botName = 'robot';
    // eslint-disable-next-line max-len
    const isBotInstalled = await bdk.isBotInstalledInRoom(event.roomId, botName);
    // eslint-disable-next-line no-unused-expressions
    expect(isBotInstalled).to.be.false;
  });

  it('OK false if room is null ', async () => {
    const invalidRoom = null;
    getGenericRoomStub.returns(Promise.resolve(invalidRoom));
    const botName = 'robot';
    // eslint-disable-next-line max-len
    const isBotInstalled = await bdk.isBotInstalledInRoom(event.roomId, botName);
    // eslint-disable-next-line no-unused-expressions
    expect(isBotInstalled).to.be.false;
  });
});
