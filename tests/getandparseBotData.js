const sinon = require('sinon');
const expect = require('chai').expect;
const rewire = require('rewire');
const bdk = rewire('../refocus-bdk-client.js');
const generic = require('../generic.js');
const config = { refocusUrl: 'zzz', token: 'dummy' };
const botName = 'test';

describe('getAndParseBotData function >', () => {
  afterEach(() => {
    generic.get.restore();
  });

  it('Ok, returns null on null roomId', (done) => {
    const testData = {
      test: 'test'
    };
    sinon.stub(generic, 'get').resolves({
      body: [{
        value: JSON.stringify(testData) }]
    });
    expect(bdk.__get__('module.exports')(config)
      .getAndParseBotData(null, null, null)).to.equal(null);
    done();
  });

  it('Ok, calls JSON parse error and returns null on invalid ' +
    'JSON bot data', (done) => {
    const expectedResponse = 'testingblahblah';
    sinon.stub(generic, 'get').resolves({
      body: [{
        value: expectedResponse }]
    });
    expect(bdk.__get__('module.exports')(config)
      .getAndParseBotData(null, null, null)).to.equal(null);
    done();
  });

  it('Ok, returns JSON response on valid bot data', (done) => {
    const testData = {
      test: 'test'
    };
    sinon.stub(generic, 'get').resolves({
      body: [{
        value: JSON.stringify(testData) }]
    });
    bdk.__get__('module.exports')(config)
      .getAndParseBotData('123', 'quipTest', botName).then((res) => {
        expect(res).to.deep.equal(testData);
        done();
      });
  });
});
