const expect = require('chai').expect;
const rewire = require('rewire');
const sinon = require('sinon');
const generic = require('../generic.js');
const config = { refocusUrl: 'zzz', token: 'dummy' };

global.user = '{&quot;email&quot;:&quot;test@test.com&quot;'+
  ',&quot;id&quot;:&quot;Test&quot;}';
global.window = { document: { }, location: { href: '' } };
const bdk = rewire('../refocus-bdk-client.js');

describe('getBotId function >', () => {
  beforeEach(() => {

  });
  afterEach(() => {
    generic.get.restore();
  });
  it('Ok, botName is defined. Fetches botId', (done) => {
    const testBotName = 'Dummy-Bot';
    const expectedId = 1234;
    sinon.stub(generic, 'get').resolves({ body: [{ id: expectedId }] });
    bdk.__get__('module.exports')(config)
      .getBotId(config.refocusUrl, config.token, testBotName)
      .then((res) => {
        expect(res).to.equal(expectedId);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });

  it('Ok, botName is not defined. Returns undefined', (done) => {
    const noBotName = '';
    const expectedResult = undefined;
    sinon.stub(generic, 'get').resolves({ body: [] });
    bdk.__get__('module.exports')(config)
      .getBotId(config.refocusUrl, config.token, noBotName)
      .then((res) => {
        expect(res).to.equal(expectedResult);
        done();
      })
      .catch((err) => {
        done(err);
      });
  });
});
