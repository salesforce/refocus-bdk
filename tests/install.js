/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

const expect = require('chai').expect;
const sinon = require('sinon');
const _ = require('lodash');
const config = { refocusUrl: 'zzz', token: 'dummy' };
const bdk = require('../refocus-bdk-server')(config);
const { bot, botWithUI } = require('./utils');

describe('New Bot Installation: ', () => {
  beforeEach(() => {
    sinon.stub(bdk, 'installBot');
  });

  afterEach(() => {
    bdk.installBot.restore();
  });

  it('Ok, Bot Installed (No UI)', (done) => {
    const botWithId = _.clone(bot);
    botWithId.id = 'botId';

    bdk.installBot.resolves({ body: botWithId });

    bdk.installBot(bot)
      .then((res) => {
        const installedBot = res.body;
        expect(installedBot).to.have.property('id');
        expect(installedBot.name).to.equal(bot.name);
        expect(installedBot.url).to.equal(bot.url);
        expect(installedBot.version).to.equal(bot.version);
        expect(installedBot.displayName).to.equal(bot.displayName);
        expect(installedBot.helpUrl).to.equal(bot.helpUrl);
        expect(installedBot.ownerUrl).to.equal(bot.ownerUrl);
        expect(installedBot.actions).to.deep.equal(bot.actions);
        done();
      })
      .catch((error) => {
        done(error);
      });
  });

  it('Ok, Bot Installed (With UI)', (done) => {
    const botWithId = _.clone(botWithUI);
    botWithId.id = 'botId';

    bdk.installBot.resolves({ body: botWithId });

    bdk.installBot(botWithUI)
      .then((res) => {
        const installedBot = res.body;
        expect(installedBot).to.have.property('id');
        expect(installedBot).to.have.property('ui');
        expect(installedBot.name).to.equal(botWithUI.name);
        expect(installedBot.url).to.equal(botWithUI.url);
        expect(installedBot.version).to.equal(botWithUI.version);
        expect(installedBot.actions).to.deep.equal(botWithUI.actions);
        done();
      })
      .catch((error) => {
        done(error);
      });
  });

  it('Fail, Attempt to install the same Bot twice', (done) => {
    const error = 'duplicate';

    bdk.installBot.rejects(error);

    bdk.installBot(bot)
      .then(done)
      .catch((err) => {
        // err object is returned by sinon
        if (err.name && (err.name === 'duplicate')) {
          done();
        } else if (err === 'duplicate') { // refocus returns string
          done();
        } else { // if none of the errors were returned fail test
          done(err);
        }
      });
  });
});
