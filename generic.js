const request = require('superagent');

const TOO_MANY_REQUESTS = 429;
/* eslint-disable no-process-env */
/* eslint-disable no-implicit-coercion*/
const MAX_RETRIES = process.env.MAX_RETRIES || 3; // eslint-disable-line
const MIN_POLLING_REFRESH = 5000;
const ZERO = 0;

/**
 * Get JSON from server asynchronous
 *
 * @param {String} route - URL for route
 * @param {String} apiToken - Refocus API Token
 * @param {Integers} tries - Number of tries used for the APIs
 * @param {Function} logger - Logger to use
 * @param {String} proxy - Proxy URL
 * @returns {Promise} - Route response
 */
function get(route, apiToken, tries, logger, proxy){
  let count = tries || ZERO;
  return new Promise((resolve, reject) => {
    const req = request.get(route);
    if (proxy) {
      req.proxy(proxy);
    }
    req
      .set('Authorization', apiToken)
      .end((error, res) => {
        if (error) {
          logger.error(
            `Get ${route} failed: ${error}`
          );

          return reject(error);
        }

        if ((res.status === TOO_MANY_REQUESTS) && (count < MAX_RETRIES)) {
          const retry = res.headers['Retry-After'] || MIN_POLLING_REFRESH;
          setTimeout(
            () => {
              get(route, proxy, apiToken, ++count)
                .then((retryRes) => {
                  return resolve(retryRes);
                });
            }, retry);
        }
        return resolve(res);
      });
  });
} // genericGet

/**
 * Patch JSON to server asynchronous
 *
 * @param {String} route - URL for route
 * @param {JSON} obj - the payload needed for route
 * @param {String} apiToken - Refocus API Token
 * @param {Integers} tries - Number of tries used for the APIs
 * @param {Function} logger - Logger to use
 * @param {String} proxy - Proxy URL
 * @returns {Promise} - Route response
 */
 function patch(route, obj, apiToken, tries, logger ,proxy) { // eslint-disable-line
  let count = tries || ZERO;
  return new Promise((resolve, reject) => {
    const req = request.patch(route);
    if (proxy) {
      req.proxy(proxy);
    }
    req
      .set('Authorization', apiToken)
      .send(obj)
      .end((error, res) => {
        if (error) {
          logger.error(
            `Get ${route} failed: ${error}`
          );

          return reject(error);
        }

        if ((res.status === TOO_MANY_REQUESTS) && (count < MAX_RETRIES)) {
          const retry = res.headers['Retry-After'] || MIN_POLLING_REFRESH;
          setTimeout(
            () => {
              patch(route, obj, proxy, apiToken, ++count)
                .then((retryRes) => {
                  return resolve(retryRes);
                });
            }, retry);
        }
        return resolve(res);
      });
  });
} // genericPatch

/**
 * Post JSON to server asynchronous
 *
 * @param {String} route - URL for route
 * @param {JSON} obj - the payload needed for route
 * @param {String} apiToken - Refocus API Token
 * @param {Integers} tries - Number of tries used for the APIs
 * @param {Function} logger - Logger to use
 * @param {String} proxy - Proxy URL
 * @returns {Promise} - Route response
 */
 function post(route, obj, apiToken, tries, logger ,proxy) { // eslint-disable-line
  let count = tries || ZERO;
  return new Promise((resolve, reject) => {
    const req = request.post(route);
    if (proxy) {
      req.proxy(proxy);
    }
    req
      .set('Authorization', apiToken)
      .send(obj)
      .end((error, res) => {
        if (error) {
          logger.error(
            `Get ${route} failed: ${error}`
          );

          return reject(error);
        }

        if ((res.status === TOO_MANY_REQUESTS) && (count < MAX_RETRIES)) {
          const retry = res.headers['Retry-After'] || MIN_POLLING_REFRESH;
          setTimeout(
            () => {
              post(route, obj, proxy, apiToken, ++count)
                .then((retryRes) => {
                  return resolve(retryRes);
                });
            }, retry);
        }
        return resolve(res);
      });
  });
} // genericPost

module.exports = {
  post,
  patch,
  get };
