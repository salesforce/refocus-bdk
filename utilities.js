const request = require('superagent');

/**
 * Get JSON from server asynchronous
 *
 * @param {String} route - URL for route
 * @param {String} apiToken - Refocus API Token
 * @param {String} proxy - Proxy URL
 * @returns {Promise} - Route response
 */
function genericGet(route, apiToken, proxy){
  return new Promise((resolve) => {
    const req = request.get(route);
    if (proxy) {
      req.proxy(proxy);
    }
    req
      .set('Authorization', apiToken)
      .end((error, res) => {
        resolve(res);
      });
  });
} // genericGet

/**
 * Patch JSON to server asynchronous
 *
 * @param {String} route - URL for route
 * @param {JSON} obj - the payload needed for route
 * @param {String} apiToken - Refocus API Token
 * @param {String} proxy - Proxy URL
 * @returns {Promise} - Route response
 */
function genericPatch(route, obj, apiToken, proxy){
  return new Promise((resolve) => {
    const req = request.patch(route);
    if (proxy) {
      req.proxy(proxy);
    }
    req
      .set('Authorization', apiToken)
      .send(obj)
      .end((error, res) => {
        resolve(res);
      });
  });
} // genericPatch

/**
 * Post JSON to server asynchronous
 *
 * @param {String} route - URL for route
 * @param {JSON} obj - the payload needed for route
 * @param {String} apiToken - Refocus API Token
 * @param {String} proxy - Proxy URL
 * @returns {Promise} - Route response
 */
function genericPost(route, obj, apiToken, proxy){
  return new Promise((resolve) => {
    const req = request.post(route);
    if (proxy) {
      req.proxy(proxy);
    }
    req
      .set('Authorization', apiToken)
      .send(obj)
      .end((error, res) => {
        resolve(res);
      });
  });
} // genericPost

module.exports = { genericGet, genericPatch, genericPost };
