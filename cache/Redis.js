const redis = require('redis');
const defaultHost = '127.0.0.1';
const defaultPort = 6379;
const timeToLiveInSeconds = 60;

class Redis {
  build (logger, host = defaultHost, port = defaultPort) {
    return new Promise((resolve) => {
      this.client = redis.createClient({ host, port });
      this.logger = logger;
      this.client.on('error', (error) => {
        this.logger.error(error);
        resolve(false);
      });

      this.client.on('ready', () => {
        this.logger.info(`Connected to redis at ${host}:${port}`);
        resolve(true);
      });
    });
  }

  checkIfKeyExists(key) {
    return new Promise((resolve) => {
      this.client.set(key, '1', 'NX', 'ex', timeToLiveInSeconds, (err, res) => {
        if (err) {
          this.logger.error(err);
        }
        this.logger.debug(`bdk-cache-redis: ${res ? 'new event, responding' :
          'event already responded to'}`);
        resolve(res !== 'OK');
      });
    });
  }
}

module.exports = Redis;
