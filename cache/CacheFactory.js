const Redis = require('./Redis');
const Cache = require('./Cache');

class CacheFactory {
  clientTypes = {
    REDIS: 'redis',
  }

  /**
   *
   * @param {string} type - one of the implemented clientTypes
   * @param {object} logger - instance of logger
   * @param {string?} url - url to reach cache at (overrides default)
   * @param {string?} password - password for redis cache
   * @returns {object} - connection to cache | null
   */
  async build(type, logger, url, password) {
    let instance;
    let builtSuccessfully = false;
    switch (type) {
      case this.clientTypes.REDIS: {
        instance = new Redis();
        builtSuccessfully = await instance.build(logger, url, password);
        break;
      }

      default: {
        throw new Error(`Invalid type, '${type} provided to ` +
          'CacheFactory.build');
      }
    }
    return builtSuccessfully ? new Cache(instance) : null;
  }
}

module.exports = CacheFactory;
