/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

const _ = require('lodash');

/**
 * Safely escape and stringify a JSON object
 *
 * @param {JSON} obj - JSON object to be escaped and stringified.
 * @returns {String} - Escaped and Stringified
 */
function escapeAndStringify(obj) {
  const objCopy = Object.assign({}, obj);
  for (const k in objCopy) {
    if (objCopy.hasOwnProperty(k)) {
      objCopy[k] = _.escape(objCopy[k]);
    }
  }

  return JSON.stringify(objCopy);
}

/**
 * Safely unescape and parse a stringified object
 *
 * @param {String} str - Stringified object to be parsed.
 * @returns {JSON} - Unescaped and parsed
 */
function parseAndUnescape(str) {
  const obj = JSON.parse(str);

  for (const k in obj) {
    if (obj.hasOwnProperty(k)) {
      obj[k] = _.unescape(obj[k]);
    }
  }

  return obj;
}

module.exports = { escapeAndStringify, parseAndUnescape };
