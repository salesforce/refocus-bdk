const redis = require('redis');
const defaultHost = '127.0.0.1';
const defaultPort = 6379;
const timeToLiveInSeconds = 60;

class Cache {
  constructor ({ host = defaultHost, port = defaultPort, logger }) {
    this.client = redis.createClient({ host, port });
    this.logger = logger;
    this.client.on('error', (error) => {
      this.logger.error(error);
    });

    this.client.on('ready', () => {
      this.logger.info(`Connected to redis at ${host}:${port}`);
    });
  }

  /**
   * @param {string} realtimeEventId - event from websocket stream
   * @param {string} updatedAt - timestamp, avoids ignoring events with same id
   * @param {string} type - one of botAction, botData, event
   * @returns {Promise}
   */
  hasBeenConsumed(realtimeEventId, updatedAt, type) {
    return new Promise((resolve) => {
      const key = `${type}${realtimeEventId}${updatedAt}`;
      this.client.set(key, '1', 'NX', 'ex', timeToLiveInSeconds, (err, res) => {
        if (err) {
          this.logger.error(err);
        }
        this.logger.debug(`bdk-cache: ${res ? 'new event, responding' :
          'event already responded to'}`);
        resolve(res !== 'OK');
      });
    });
  }
}
module.exports = Cache;
