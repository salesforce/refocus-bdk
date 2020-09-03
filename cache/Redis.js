const redis = require('redis');
const defaultUrl = 'redis://127.0.0.1:6379/0';
const timeToLiveInSeconds = 60;
const defaultPassword = '';
const MAX_RETRIES = 3;

class Redis {
  build (logger, url = defaultUrl,
    password = defaultPassword) {
    let errors = 0;
    return new Promise((resolve) => {
      this.client = redis.createClient({ url, password });
      this.logger = logger;
      this.client.on('error', (error) => {
        this.logger.error(error);
        errors++;
        if (errors > MAX_RETRIES) resolve(false);
      });

      this.client.on('ready', () => {
        this.logger.info(`Connected to redis at ${url}`);
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
