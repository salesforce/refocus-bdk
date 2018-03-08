/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * refocus-bdk-client.js
 *
 * This package is utility package for bot development to speed up development
 * and consolidate commonly used functions.
 *
 * Client-side version of the BDK.
 * Optimized for a browser execution environment.
 *
 */

const moment = require('moment');
const url = require('url');
const request = require('superagent');
// user is a global object provided by the Refocus server
// eslint-disable-next-line no-undef
const _user = JSON.parse(user.replace(/&quot;/g, '"'));
const API = '/v1';
const BOTS_ROUTE = '/bots';
const BOTACTIONS_ROUTE = '/botActions';
const BOTDATA_ROUTE = '/botData';
const ROOMS_ROUTE = '/rooms';
const EVENTS_ROUTE = '/events';
const ONE = 1;
const ZERO = 0;

/**
 * Returns console.logs depending on the URL parameters
 * {URL}?CONSOLE_LOG_LEVEL={logLevel}&FILTER={FILTER STRING}
 * or {URL}?log={logLevel}&FILTER={FILTER STRING}
 *
 * The log level is designed to mimic WinstonJS, so level of log you
 * choose every level lower than that will be shown in the. Default level
 * is info. You can filter the string by text using the filter parameter
 *
 * @param {String} type - Type of log
 * @param {String} msg - Message of log
 * @param {Object} obj - Associated object of message
 */
const logLevels = { error: 0, warn: 1, info: 2, verbose: 3,
  debug: 4, silly: 5 };
const logSev = { 0: 'error', 1: 'warn', 2: 'info', 3: 'verbose',
  4: 'debug', 5: 'silly' };
const logColors = { error: 'red', warn: 'goldenrod', info: 'green',
  verbose: 'purple', debug: 'blue', silly: 'grey' };

function debugMessage(type, msg, obj) { // eslint-disable-line require-jsdoc
  const adr = window.location.href;
  const q = url.parse(adr, true);
  const qdata = q.query ? q.query : {};
  const loggerQueryParam = qdata.CONSOLE_LOG_LEVEL || qdata.log;
  const levelSev = loggerQueryParam && logLevels[loggerQueryParam] ?
    logLevels[loggerQueryParam] : logSev.info;
  let level = '';
  for (let i=0; i <= levelSev; i++) {
    level += logSev[i] + ',';
  }

  const filter = qdata.FILTER ?
    qdata.FILTER.toLowerCase() :
    false;

  if ((!filter) || (msg.toLowerCase().includes(filter))) {
    if ((level) &&
        (level.includes(type.toLowerCase())) &&
        obj) {
      console.log( // eslint-disable-line no-console
        `%c ${moment().format('YYYY-MM-DD hh:mm:ss').trim()}` + `%c ${type}`+
        ':', 'color: black', 'color: '+ logColors[type],
        msg, obj
      );
    } else if ((level) &&
        (level.includes(type.toLowerCase()))) {
      console.log( // eslint-disable-line no-console
        `%c ${moment().format('YYYY-MM-DD hh:mm:ss').trim()}` + `%c ${type}` +
        ':', 'color: black', 'color: '+ logColors[type],
        msg,
      );
    }
  }
} // debugMessage

module.exports = (config) => {
  const SERVER = config.refocusUrl;
  const TOKEN = config.token;

  /**
   * Define a set of log functions
   */
  const log = {
    error: (msg, obj) => debugMessage('error', msg, obj),
    warn: (msg, obj) => debugMessage('warn', msg, obj),
    info: (msg, obj) => debugMessage('info', msg, obj),
    verbose: (msg, obj) => debugMessage('verbose', msg, obj),
    debug: (msg, obj) => debugMessage('debug', msg, obj),
    silly: (msg, obj) => debugMessage('silly', msg, obj),
    realtime: (msg, obj) => {
      const name = obj.new ? obj.new.name : obj.name;
      debugMessage('info', 'realtime: ' + msg, name);
      debugMessage('verbose', 'realtime: ' + msg, obj);
    },
  };

  /**
   * Get JSON from server asynchronous
   *
   * @param {String} route - URL for route
   * @returns {Promise} - Route response
   */
  function genericGet(route){
    return new Promise((resolve) => {
      const req = request.get(route);
      req
        .set('Authorization', TOKEN)
        .end((error, res) => {
          log.silly('Generic Get. ', res);
          if (error) {
            log.error('Error: ', { error, res });
          }
          resolve(res);
        });
    });
  } // genericGet

  /**
   * Patch JSON to server asynchronous
   *
   * @param {String} route - URL for route
   * @param  {JSON} obj - the payload needed for route
   * @returns {Promise} - Route response
   */
  function genericPatch(route, obj){
    return new Promise((resolve) => {
      const req = request.patch(route);
      req
        .set('Authorization', TOKEN)
        .send(obj)
        .end((error, res) => {
          log.silly('Generic Patch. ', res);
          if (error) {
            log.error('Error: ', { error, res });
          }
          resolve(res);
        });
    });
  } // genericPatch

  /**
   * Post JSON to server asynchronous
   *
   * @param {String} route - URL for route
   * @param {JSON} obj - the payload needed for route
   * @returns {Promise} - Route response
   */
  function genericPost(route, obj){
    return new Promise((resolve) => {
      const req = request.post(route);
      req
        .set('Authorization', TOKEN)
        .send(obj)
        .end((error, res) => {
          log.silly('Generic Post. ', res);
          if (error) {
            log.error('Error: ', { error, res });
          }
          resolve(res);
        });
    });
  } // genericPost

  return {

    /**
     * Get the current room ID from window
     *
     * @returns {Integer} - Room Id from URL
     */
    getRoomId: () => {
      return window.location.pathname.split('rooms/').length > ONE ?
        parseInt(window.location.pathname.split('rooms/')[ONE], 10) :
        ONE;
    }, // getRoomId

    /**
     * Find room by id/name
     *
     * @param {String} id - ID of room
     * @returns {Promise} - Room response
     */
    findRoom: (id) => {
      log.debug('Find Room ',
        { id, route: `${SERVER}${API}${ROOMS_ROUTE}/${id}` });
      return genericGet(`${SERVER}${API}${ROOMS_ROUTE}/${id}`);
    }, // findRoom

    /**
     * Update room settings
     *
     * @param {String} id - ID of room
     * @param {Object} newSettings - Settings object
     * @returns {Promise} - Room response
     */
    updateSettings: (id, newSettings) => {
      const patch = {
        'settings': newSettings,
      };
      log.debug('Updating Settings ', newSettings);
      return genericPatch(`${SERVER}${API}${ROOMS_ROUTE}/${id}`, patch);
    }, // updateSettings

    /**
     * Determine which users are active in a room by parsing the event
     * entries
     *
     * @param {Integer} room - ID of the room to get events from
     * @returns {Promise} - An object of the users currently in the room
     */
    getActiveUsers: (room) => {
      log.debug('Requesting active users for room ', room);
      return genericGet(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}`)
        .then((events) => {
          const users = [];
          const userEvents = events.body
            // Sort in decreasing value
            .sort((a, b) => moment(b.createdAt).diff(moment(a.createdAt)))
            .filter((event) => {
              if ((event.context) && (event.context.type)) {
                if (event.context.type === 'User') {
                  // Only get unqiue users
                  if (!users.includes(event.context.user.id)) {
                    users.push(event.context.user.id);
                    return true;
                  }
                }
              }
              return false;
            });

          const output = {};

          // Create list of events that are in the room
          userEvents.forEach((event) => {
            if (event.context.isActive) {
              const entry = event.context.user;
              entry.isActive = event.context.isActive;
              output[event.context.user.id] = entry;
            }
          });
          log.debug('Active users ', output);
          return output;
        });
    }, // getActiveUsers

    /**
     * Find bot by id/name
     *
     * @param {String} id - ID of bot
     * @returns {Promise} - Bot response
     */
    findBot: (id) => {
      log.debug('Find Bot ',
        { id, route: `${SERVER}${API}${BOTS_ROUTE}/${id}` });
      return genericGet(`${SERVER}${API}${BOTS_ROUTE}/${id}`);
    }, // findBot

    /**
     * Find bot action by id/name
     *
     * @param {String} id - ID of bot action
     * @returns {Promise} - Bot Action response
     */
    findBotAction: (id) => {
      log.debug('Find Bot Action ',
        { id, route: `${SERVER}${API}${BOTACTIONS_ROUTE}/${id}` });
      return genericGet(`${SERVER}${API}${BOTACTIONS_ROUTE}/${id}`);
    }, // findBotAction

    /**
     * Find bot action by room, bot, and name
     *
     * @param {String} room - ID of room
     * @param {String} bot - ID of bot
     * @param {String} name - Name of bot action
     * @returns {Promise} - Bot Action response
     */
    getBotActions: (room, bot, name) => {
      log.debug('Getting Bot Actions for Room',
        { room, bot, name });
      if (!bot) {
        return genericGet(`${SERVER}${API}${BOTACTIONS_ROUTE}?roomId=${room}`);
      } else if (!name) {
        return genericGet(
          `${SERVER}${API}${BOTACTIONS_ROUTE}?roomId=${room}&botId=${bot}`
        );
      }
      return genericGet(
        `${SERVER}${API}${BOTACTIONS_ROUTE}
        ?roomId=${room}&botId=${bot}&name=${name}`
      );
    }, // getBotActions

    /**
     * Access user that is part of the room window and gets name
     * user object comes from Refocus view/rooms/index.pug
     *
     * @returns {String} - User full name
     */
    getUserName: () => {
      return _user.name;
    }, // getUserName

    /**
     * Access user that is part of the room window and gets id
     * user object comes from Refocus view/rooms/index.pug
     *
     * @returns {String} - User Id
     */
    getUserId: () => {
      return _user.id;
    }, // getUserId

    /**
     * Access user that is part of the room window and gets email
     * user object comes from Refocus view/rooms/index.pug
     *
     * @returns {String} - User email
     */
    getUserEmail: () => {
      return _user.email;
    }, // getUserEmail

    /**
     * Create bot action by id/name
     *
     * @param {Object} botAction - botAction object
     * @returns {Promise} - Bot Action response
     */
    createBotAction: (botAction) => {
      log.debug('Creating Bot Action ', botAction);
      try {
        botAction.userId = _user.id;
      } catch (error) {
        log.error('Create bot action bdk', error);
      }
      return genericPost(`${SERVER}${API}${BOTACTIONS_ROUTE}`, botAction);
    }, // createBotAction

    /**
     * Update bot action response
     *
     * @param {String} id - ID of bot action
     * @param {Object} res - Response object
     * @param {Object} eventLog - (Optional) If an bot wants to override
     *   the log and/or context of the Event created by respondBotAction
     *   then they should send this paramater an object with the desired log
     *   and context.
     *   i.e)
     *     {
     *        log: 'A long message',
     *        context: {
     *          type: 'Debug'
     *        }
     *     }
     *
     * @returns {Promise} - BotAction response
     */
    respondBotAction: (id, res, eventLog) => {
      log.debug('Updating Bot Action with Event Log ', { id, res, eventLog });
      const responseObject = {
        'isPending': false,
        'response': res,
      };

      return genericPatch(`${SERVER}${API}${BOTACTIONS_ROUTE}/${id}`,
        responseObject)
        .then((instance) => {
          let eventObject = {};
          if (eventLog) {
            eventObject = eventLog;
          } else {
            eventObject = {
              log: instance.body.botId +
              ' succesfully performed ' +
              instance.body.name,
              context: {
                'type': 'Event',
              },
            };
          }

          eventObject.context = eventObject.context ? eventObject.context : {};
          eventObject.context.name = instance.body.name;
          eventObject.context.response = instance.body.response;
          eventObject.roomId = instance.body.roomId;
          eventObject.botId = instance.body.botId;
          eventObject.botActionId = instance.body.id;
          eventObject.userId = instance.body.userId;
          return genericPost(`${SERVER}${API}${EVENTS_ROUTE}`, eventObject);
        });
    }, // respondBotAction

    /**
     * Update bot action response with no event log
     *
     * @param {String} id - ID of bot action
     * @param {Object} res - Response object
     * @returns {Promise} - BotAction response
     */
    respondBotActionNoLog: (id, res) => {
      log.debug('Updating Bot Action. No Event Log ', { id, res });
      const responseObject = {
        'isPending': false,
        'response': res,
      };

      return genericPatch(`${SERVER}${API}${BOTACTIONS_ROUTE}/${id}`,
        responseObject);
    }, // respondBotActionNoLog

    /**
     * Create bot data
     *
     * @param {String} room - Id room
     * @param {String} bot - Id of bot
     * @param {String} botName - Name of data
     * @param {String} botValue - Value
     * @returns {Promise} - Bot Data response
     */
    createBotData: (room, bot, botName, botValue) => {
      const botData = {
        'name': botName,
        'roomId': parseInt(room, 10),
        'botId': bot,
        'value': botValue
      };
      log.debug('Creating Bot Data', botData);
      return genericPost(`${SERVER}${API}${BOTDATA_ROUTE}`, botData);
    }, // createBotData

    /**
     * Find bot data by id/name
     *
     * @param {String} id - ID of bot data
     * @returns {Promise} - Bot Data response
     */
    findBotData: (id) => {
      log.debug('Getting Bot Data ', id);
      return genericGet(`${SERVER}${API}${BOTDATA_ROUTE}/${id}`);
    }, // findBotData

    /**
     * Find bot data by room, bot, and name
     *
     * @param {String} room - ID of room
     * @param {String} bot - ID of bot
     * @param {String} name - Name of bot data
     * @returns {Promise} - Bot Data response
     */
    getBotData: (room, bot, name) => {
      log.debug('Getting Bot Data. ', { room, bot, name });
      if (!bot) {
        return genericGet(`${SERVER}${API}${ROOMS_ROUTE}/${room}/data`);
      } if (!name) {
        return genericGet(`${SERVER}${API}${ROOMS_ROUTE}/
          ${room}/bots/${bot}/data`);
      }
      return genericGet(`${SERVER}${API}${ROOMS_ROUTE}
        ?roomId=${room}&botId=${bot}&name=${name}`);
    }, // getBotData

    /**
     * Update bot data by id/name
     *
     * @param {String} id - Id of bot data
     * @param {Object} botData - botData object
     * @returns {Promise} - Bot Data response
     */
    changeBotData: (id, botData) => {
      log.debug('Updating Bot Data. ', { id, botData });
      const newBotData = {
        'value': botData
      };
      return genericPatch(`${SERVER}${API}${BOTDATA_ROUTE}/${id}`, newBotData);
    }, // changeBotData

    /**
     * Upsert bot data
     *
     * @param {String} room - ID of room.
     * @param {String} bot - ID of bot.
     * @param {String} name - Name of bot data.
     * @param {Object} botData - botData object.
     * @returns {Promise} - Bot Data response.
     */
    upsertBotData: (room, bot, name, botData) => {
      const changeBotData = {
        'value': botData
      };

      const newBotData = {
        name,
        'roomId': parseInt(room, 10),
        'botId': bot,
        'value': botData
      };

      log.debug('Upserting new Bot Data ', newBotData);

      return genericGet(`${SERVER}${API}${ROOMS_ROUTE}
        /${room}/bots/'${bot}/data`)
        .then((data) => {
          const _data = data.body
            .filter((bd) => bd.name === name)[ZERO];
          if (_data) {
            return genericPatch(`${SERVER}${API}${BOTDATA_ROUTE}/${_data.id}`,
              changeBotData);
          }
          return genericPost(`${SERVER}${API}${BOTDATA_ROUTE}/`, newBotData);
        });
    }, // upsertBotData

    /**
     * Find events by room
     *
     * @param {String} room - ID of room
     * @returns {Promise} - All the events of the room
     */
    getEvents: (room) => {
      log.debug('Get events for Room ', room);
      return genericGet(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}`);
    }, // getEvents

    /**
     * Create an event
     *
     * @param {Integer} room - Room Id
     * @param {String} msg - Log String
     * @param {Object} context - JSON context
     * @returns {Promise} - Event response
     */
    createEvents: (room, msg, context) => {
      log.debug('Creating a new Event. ', { room, msg, context });
      const events = {
        log: msg,
        roomId: room
      };
      if (context) {
        events.context = context;
      }
      try {
        events.userId = _user.id;
      } catch (error) {
        log.error('Event User Error', error);
      }
      return genericPost(`${SERVER}${API}${EVENTS_ROUTE}`, events);
    }, // createEvents
    log,
  };
};
