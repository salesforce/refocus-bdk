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
   * @param {string?} host - host to reach cache at (overrides default)
   * @param {number?} port - port to reach cache on (overrides default)
   * @returns {object} - connection to cache | null
   */
  async build(type, logger, host = null, port = null) {
    let instance;
    let builtSuccessfully = false;
    switch (type) {
      case this.clientTypes.REDIS: {
        instance = new Redis();
        builtSuccessfully = await instance.build(logger, host, port);
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
