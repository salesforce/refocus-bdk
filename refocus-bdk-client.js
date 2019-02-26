/**
 * Copyright (c) 2018, salesforce.com, inc.
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
const serialize = require('serialize-javascript');
// user is a global object provided by the Refocus server
// eslint-disable-next-line no-undef
const _user = JSON.parse(user.replace(/&quot;/g, '"')
  .replace(/apos;/g, "'"));// eslint-disable-line
const API = '/v1';
const BOTS_ROUTE = '/bots';
const BOTACTIONS_ROUTE = '/botActions';
const BOTDATA_ROUTE = '/botData';
const ROOMS_ROUTE = '/rooms';
const ROOM_TYPES_ROUTE = '/roomTypes';
const EVENTS_ROUTE = '/events';
const EVENTS_BULK_ROUTE = '/events/bulk';
const USERS_ROUTE = '/users';
const DEFAULT_LIMIT = 100;
const NO_OFFSET = 0;
const FIRST_ARRAY_EL = 0;
const ONE = 1;
const ZERO = 0;
const defaultMaxEvents = 2000;
const MIN_POLLING_REFRESH = 5000;
const TOO_MANY_REQUESTS = 429;
const MAX_RETRIES = process.env.MAX_RETRIES || 3; // eslint-disable-line
const maxEvents = process.env.MAX_EVENTS || // eslint-disable-line
  defaultMaxEvents;

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
        msg
      );
    }
  }
} // debugMessage

/**
 * Get JSON from server asynchronous
 *
 * @param {String} route - URL for route
 * @param {String} apiToken - Refocus API Token
 * @param {Integers} tries - Number of tries used for the APIs
 * @returns {Promise} - Route response
 */
function genericGet(route, apiToken, tries){
  let count = tries || ZERO;
  return new Promise((resolve) => {
    const req = request.get(route);
    req
      .set('Authorization', apiToken)
      .end((error, res) => {
        debugMessage('silly', 'Generic Get. ', res);
        if ((res.status === TOO_MANY_REQUESTS) && (count < MAX_RETRIES)) {
          const retry = res.headers['Retry-After'] || MIN_POLLING_REFRESH;
          setTimeout(() => {
            genericGet(route, apiToken, ++count)
              .then((retryRes) => {
                resolve(retryRes);
              });
          }, retry);
        } else {
          if (error) {
            debugMessage('error', 'Error: ', { error, res });
          }

          resolve(res);
        }
      });
  });
} // genericGet

/**
 * Patch JSON to server asynchronous
 *
 * @param {String} route - URL for route
 * @param  {JSON} obj - the payload needed for route
 * @param {String} apiToken - Refocus API Token
 * @param {Integers} tries - Number of tries used for the APIs
 * @returns {Promise} - Route response
 */
function genericPatch(route, obj, apiToken, tries){
  let count = tries || ZERO;
  return new Promise((resolve) => {
    const req = request.patch(route);
    req
      .set('Authorization', apiToken)
      .send(obj)
      .end((error, res) => {
        debugMessage('silly', 'Generic Patch. ', res);
        if ((res.status === TOO_MANY_REQUESTS) && (count < MAX_RETRIES)) {
          const retry = res.headers['Retry-After'] || MIN_POLLING_REFRESH;
          setTimeout(() => {
            genericPatch(route, obj, apiToken, ++count)
              .then((retryRes) => {
                resolve(retryRes);
              });
          }, retry);
        } else {
          if (error) {
            debugMessage('error', 'Error: ', { error, res });
          }

          resolve(res);
        }
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
 * @returns {Promise} - Route response
 */
function genericPost(route, obj, apiToken, tries){
  let count = tries || ZERO;
  return new Promise((resolve) => {
    const req = request.post(route);
    req
      .set('Authorization', apiToken)
      .send(obj)
      .end((error, res) => {
        debugMessage('silly', 'Generic Post. ', res);
        if ((res.status === TOO_MANY_REQUESTS) && (count < MAX_RETRIES)) {
          const retry = res.headers['Retry-After'] || MIN_POLLING_REFRESH;
          setTimeout(() => {
            genericPost(route, obj, apiToken, ++count)
              .then((retryRes) => {
                resolve(retryRes);
              });
          }, retry);
        } else {
          if (error) {
            debugMessage('error', 'Error: ', { error, res });
          }

          resolve(res);
        }
      });
  });
} // genericPost

module.exports = (config) => {
  const SERVER = window.location.origin || config.refocusUrl;
  const TOKEN = window.userSession || config.token;

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
      return genericGet(`${SERVER}${API}${ROOMS_ROUTE}/${id}`, TOKEN);
    }, // findRoom

    /**
     * Get a list of all active rooms
     *
     * @returns {Promise} - Resolves to a list of active rooms.
     */
    getActiveRooms: () => {
      return genericGet(`${SERVER}${API}${ROOMS_ROUTE}?active=true`, TOKEN);
    }, // getActiveRooms

    getRoomTypes: () => {
      return genericGet(`${SERVER}${API}${ROOM_TYPES_ROUTE}`, TOKEN);
    }, // getRoomTypes

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
      return genericPatch(`${SERVER}${API}${ROOMS_ROUTE}/${id}`, patch, TOKEN);
    }, // updateSettings

    /**
     * Get users
     *
     * @param {String} id - ID of User
     * @returns {Promise} - User response
     */
    getUser: (id) => {
      log.debug('Getting User ', id);
      return genericGet(`${SERVER}${API}${USERS_ROUTE}/${id}`, TOKEN);
    }, // getUser

    /**
     * Determine which users are active in a room by parsing the event
     * entries
     *
     * @param {Integer} room - ID of the room to get events from
     * @returns {Promise} - An object of the users currently in the room
     */
    getActiveUsers: (room) => {
      log.debug('Requesting active users for room ', room);
      return genericGet(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}`, TOKEN)
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
      return genericGet(`${SERVER}${API}${BOTS_ROUTE}/${id}`, TOKEN);
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
      return genericGet(`${SERVER}${API}${BOTACTIONS_ROUTE}/${id}`, TOKEN);
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
        return genericGet(`${SERVER}${API}${BOTACTIONS_ROUTE}?roomId=${room}`,
          TOKEN);
      } else if (!name) {
        return genericGet(
          `${SERVER}${API}${BOTACTIONS_ROUTE}?roomId=${room}&botId=${bot}`,
          TOKEN
        );
      }
      return genericGet(
        `${SERVER}${API}${BOTACTIONS_ROUTE}` +
        `?roomId=${room}&botId=${bot}&name=${name}`, TOKEN
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
     * Access user that is part of the room window and gets fullName
     * user object comes from Refocus view/rooms/index.pug
     *
     * @returns {String} - User full name
     */
    getUserFullName: () => {
      return _user.fullName ? _user.fullName : _user.name;
    }, // getUserFullName

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
      return genericPost(`${SERVER}${API}${BOTACTIONS_ROUTE}`, botAction,
        TOKEN);
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
        responseObject, TOKEN)
        .then((instance) => {
          let eventObject = {};
          if (eventLog) {
            eventObject = eventLog;
          } else {
            eventObject = {
              log: instance.body.botId +
              ' successfully performed ' +
              instance.body.name,
              context: {
                'type': 'Event',
              },
            };
          }
          // adds name of action and an extra field set by bot developer
          // for better logging granularity
          const sumoLog = instance.body.actionLog ? instance.body.name +
           instance.body.actionLog : instance.body.name;
          eventObject.context = eventObject.context ? eventObject.context : {};
          eventObject.actionType = sumoLog;
          eventObject.context.name = instance.body.name;
          eventObject.context.response = instance.body.response;
          eventObject.roomId = instance.body.roomId;
          eventObject.botId = instance.body.botId;
          eventObject.botActionId = instance.body.id;
          eventObject.userId = instance.body.userId;
          return genericPost(`${SERVER}${API}${EVENTS_ROUTE}`, eventObject,
            TOKEN);
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
        responseObject, TOKEN);
    }, // respondBotActionNoLog

    /**
     * Create bot data
     *
     * @param {String} room - Id room
     * @param {String} bot - Id of bot
     * @param {String} botName - Name of data
     * @param {*} value - Can already be serialized or any other data type
     * @returns {Promise} - Bot Data response
     */
    createBotData: (room, bot, botName, value) => {
      let newData = value;
      if (newData && typeof newData !== 'string') {
        newData = serialize(newData);
      }
      const botData = {
        'name': botName,
        'roomId': parseInt(room, 10),
        'botId': bot,
        'value': newData
      };
      log.debug('Creating Bot Data', botData);
      return genericPost(`${SERVER}${API}${BOTDATA_ROUTE}`, botData, TOKEN);
    }, // createBotData

    /**
     * Find bot data by id/name
     *
     * @param {String} id - ID of bot data
     * @returns {Promise} - Bot Data response
     */
    findBotData: (id) => {
      log.debug('Getting Bot Data ', id);
      return genericGet(`${SERVER}${API}${BOTDATA_ROUTE}/${id}`, TOKEN);
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
        return log.error('getBotData needs botname');
      } if (!name) {
        return genericGet(`${SERVER}${API}${ROOMS_ROUTE}/` +
          `${room}/bots/${bot}/data`, TOKEN);
      }
      return genericGet(`${SERVER}${API}${BOTDATA_ROUTE}` +
        `?roomId=${room}&botId=${bot}&name=${name}`, TOKEN);
    }, // getBotData

    /**
     * Update bot data by id/name
     *
     * @param {String} id - Id of bot data
     * @param {*} value - Can already be serialized or any other data type
     * @returns {Promise} - Bot Data response
     */
    changeBotData: (id, value) => {
      let newData = value;
      if (newData && typeof newData !== 'string') {
        newData = serialize(newData);
      }
      const newBotData = {
        'value': newData
      };
      log.debug('Updating Bot Data. ', { id, newBotData });
      return genericPatch(`${SERVER}${API}${BOTDATA_ROUTE}/${id}`, newBotData,
        TOKEN);
    }, // changeBotData

    /**
     * Upsert bot data
     *
     * @param {String} room - ID of room.
     * @param {String} bot - ID of bot.
     * @param {String} name - Name of bot data.
     * @param {*} value - Can already be serialized or any other data type
     * @returns {Promise} - Bot Data response.
     */
    upsertBotData: (room, bot, name, value) => {
      let newData = value;
      if (newData && typeof newData !== 'string') {
        newData = serialize(newData);
      }

      const newBotData = {
        name,
        'roomId': parseInt(room, 10),
        'botId': bot,
        'value': newData
      };

      log.debug('Upserting new Bot Data ', newBotData);

      return new Promise((resolve) => {
        const req = request.post(`${SERVER}${API}/botData/upsert`);
        req
          .set('Authorization', TOKEN)
          .set('Content-Type', 'application/json')
          .send(newBotData)
          .end((error, res) => {
            debugMessage('silly', 'Generic Post. ', res);
            if (error) {
              debugMessage('error', 'Error: ', { error, res });
            }
            resolve(res);
          });
      });
    }, // upsertBotData

    /**
     * Find limited events by room
     *
     * @param {String} room - ID of room
     * @param {Integer} limit - Number of results
     * @param {Integer} offset - Offset value to get events
     * @returns {Promise} - All the events of the room
     */
    getEvents: (room, limit, offset) => {
      log.debug('Get specified events for Room ', room);
      const limitAmount = limit || DEFAULT_LIMIT;
      const offsetAmount = offset || NO_OFFSET;
      return genericGet(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}` +
        `&limit=${limitAmount}&offset=${offsetAmount}`, TOKEN);
    }, // getEvents

    /**
     * Find all events by room
     *
     * @param {String} room - ID of room
     * @param {String} type - Type of Event to filter by
     * @returns {Promise} - All the events of the room
     */
    getAllEvents: (room, type) => {
      log.debug('Get all events for Room ', room);
      const baseUrl =
        `${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}&sort=-createdAt`;
      const getRoute = type ? `${baseUrl}&type=${type}` : baseUrl;
      let limit;
      let offset;
      return genericGet(getRoute, TOKEN)
        .then((events) => {
          const allEvents = [];
          const total = events.header['x-total-count'];
          if ((events.body) && (total > events.body.length)) {
            limit = events.body.length;
            offset = NO_OFFSET;
            while (offset < total && offset < maxEvents) {
              allEvents.push(
                genericGet(`${getRoute}&limit=${limit}&offset=${offset}`,
                  TOKEN)
              );
              offset += limit;
            }

            return Promise.all(allEvents);
          }

          return [events];
        })
        .then((eventLogs) => {
          let output = [];
          eventLogs.forEach((eventLog) => {
            output = output.concat(eventLog.body);
          });

          return output;
        })
        .catch((error) => {
          return log.error('Get Events Error', error);
        });
    }, // getAllEvents

    /**
     * Create an event
     *
     * @param {Integer} room - Room Id
     * @param {String} msg - Log String
     * @param {Object} context - JSON context
     * @param {String} type - string to go into actionType
     * @returns {Promise} - Event response
     */
    createEvents: (room, msg, context, type) => {
      log.debug('Creating a new Event. ', { room, msg, context, type });
      const events = {
        log: msg,
        roomId: room,
        actionType: type
      };
      if (context) {
        events.context = context;
        events.context.user = _user;
      } else {
        events.context = {
          user: _user
        };
      }
      try {
        events.userId = _user.id;
      } catch (error) {
        log.error('Event User Error', error);
      }
      return genericPost(`${SERVER}${API}${EVENTS_ROUTE}`, events, TOKEN);
    }, // createEvents

    /**
     * Create multiple events at once
     *
     * @param {Array} events - Array of events to be created
     * Structure of event objects: {context, roomId, log}
     * @returns {Promise} - Response to events
    */
    bulkCreateEvents: (events) => {
      log.debug('Bulk creating new Events. ', events);
      return genericPost(`${SERVER}${API}${EVENTS_BULK_ROUTE}`, events, TOKEN);
    }, // bulkCreateEvents

    /**
     * Updates Room externalId
     *
     * @param {Integer} eId - External Id
     * @param {Integer} rId - Room Id
     * @returns {Promise} - Room response
    */
    updateExternalId: (eId, rId) => {
      const roomObject = {
        externalId: eId
      };
      return genericPatch(`${SERVER}${API}${ROOMS_ROUTE}/${rId}`,
        roomObject, TOKEN);
    }, // updateExternalId

    /**
     * Updates Room name
     *
     * @param {String} name - Room name
     * @param {Integer} rId - Room Id
     * @returns {Promise} - Room response
    */
    updateRoomName: (name, rId) => {
      const roomObject = {
        name
      };
      return genericPatch(`${SERVER}${API}${ROOMS_ROUTE}/${rId}`,
        roomObject, TOKEN);
    }, // updateRoomName

    getOrInitializeBotData: (room, botName, dataName, defaultValue) => {
      log.debug('Getting or Initialize BotData. ', { room, botName, dataName });
      return new Promise((resolve, reject) => {
        return genericGet(`${SERVER}${API}${BOTDATA_ROUTE}` +
        `?roomId=${room}&botId=${botName}&name=${dataName}`, TOKEN)
          .then((data) => {
            const _data = data.body.filter((bd) =>
              bd.name === dataName)[FIRST_ARRAY_EL];
            return _data;
          })
          .then((data) => {
            if (data) {
              const botDataValue = data.value;
              return botDataValue;
            }
            let newData = defaultValue;
            if (newData && typeof newData !== 'string') {
              newData = serialize(newData);
            }
            const botData = {
              'name': dataName,
              'roomId': parseInt(room, 10),
              'botId': botName,
              'value': newData
            };
            return genericPost(`${SERVER}${API}${BOTDATA_ROUTE}`,
              botData, TOKEN)
              .then(() => newData);
          })
          .then((botDataValue) => {
            resolve(botDataValue);
          })
          .catch((err) => {
            reject(err);
          });
      });
    },

    log,
  };
};
