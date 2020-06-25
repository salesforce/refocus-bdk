/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-magic-numbers */

const expect = require('chai').expect;
const CacheFactory = require('../cache/CacheFactory');
const winston = require('winston');
const logger = new winston.Logger();

/**
   * @param {object} cache - instance of cache
   */
async function testCache(cache) {
  const shouldNotExist = await cache.hasBeenConsumed('test');
  expect(shouldNotExist).to.equal(false);
  const shouldExist = await cache.hasBeenConsumed('test');
  expect(shouldExist).to.equal(true);
}

describe('Testing cache creation', () => {
  it('Creates redis cache', async () => {
    const cacheFactory = new CacheFactory();
    const redisCache = await cacheFactory.build(cacheFactory.clientTypes.REDIS,
      logger, null, null);
    await testCache(redisCache);
  });

  it('Fails to create cache due to invalid type', (done) => {
    const cacheFactory = new CacheFactory();
    cacheFactory.build('invalidType', logger)
      .then((res) => done('expected cacheFactory to throw error,' +
      ` instead got ${res}`))
      .catch(() => done());
  });

  it('Returns null when connection to redis cannot be established', (done) => {
    const cacheFactory = new CacheFactory();
    const redisClientType = cacheFactory.clientTypes.REDIS;
    cacheFactory.build(redisClientType, logger, '127.0.0.1', 5123)
      .then((client) => {
        expect(client).to.equal(null);
        done();
      })
      .catch((err) => done(err));
  });
});
