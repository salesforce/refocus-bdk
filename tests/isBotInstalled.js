
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

const event = {
  id: 'b44dc350-9706-4800-adb2-d0999152e408',
  log: 'Room Deactivated',
  actionType: null,
  context: {
    type: 'RoomState',
    active: false
  },
  Room: {
    id: 2,
    name: 'testRoom',
    RoomType: {
      id: 'e118e6f1-a6d5-4164-9c14-7344c733c3e6',
      name: 'testRoomType',
      Bots: [
        {
          id: '6812d9f4-191d-48c0-abff-8c013a697c76',
          name: 'test-bot'
        }
      ]
    }
  }
};
const bot = 'test-bot';

describe('check if bot is installed in Room:', () => {
  it('Ok, returns true if bot in RoomType is listed', () => {
    const action = bdk.isBotInstalledInRoom(event, bot), expectation = true;
    expect(action).to.equal(expectation);
  });
});
