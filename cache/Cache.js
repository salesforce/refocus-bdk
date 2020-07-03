class Cache {
  constructor (client) {
    this.client = client;
  }

  /**
   * @param {string} realtimeEventId - event from websocket stream
   * @param {string} updatedAt - timestamp, avoids ignoring events with same id
   * @param {string} botName - botName to differentiate from other bot types
   * @param {string} type - one of botAction, botData, event
   * @returns {Promise}
   */
  async hasBeenConsumed(realtimeEventId, updatedAt, botName, type) {
    const key = `${type}${realtimeEventId}${updatedAt}${botName}`;
    const res = await this.client.checkIfKeyExists(key);
    return res;
  }
}
module.exports = Cache;
