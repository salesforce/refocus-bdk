const sinon = require('sinon');
const u = require('../utilities.js');
const { easyJSON, complicatedJSON } = require('./utils');

describe('Escaping and Stringifying Objects: ', () => {
  it('Ok, easy JSON stringified and parsed again', (done) => {
    const stringified = u.escapeAndStringify(easyJSON);
    const reverted = u.parseAndUnescape(stringified);
    sinon.assert.match(reverted, easyJSON);
    done();
  });

  it('Ok, complicated JSON stringified and parsed again', (done) => {
    const stringified = u.escapeAndStringify(complicatedJSON);
    const reverted = u.parseAndUnescape(stringified);
    sinon.assert.match(reverted, complicatedJSON);
    done();
  });
});
