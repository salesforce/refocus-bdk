const sinon = require('sinon');
const u = require('../utilities.js');
const { easyJSON, complicatedJSON } = require('./utils');

describe('Escaping and Stringifying Objects: ', () => {
  it('Ok, easy JSON stringified', (done) => {
    const stringified = u.escapeAndStringify(easyJSON);
    const reverted = u.parseAndUnescape(stringified);
    sinon.assert.match(reverted, easyJSON);
    done();
  });

  it('Ok, complicated JSON stringified', (done) => {
    const stringified = u.escapeAndStringify(complicatedJSON);
    const reverted = u.parseAndUnescape(stringified);
    sinon.assert.match(reverted, complicatedJSON);
    done();
  });
});
