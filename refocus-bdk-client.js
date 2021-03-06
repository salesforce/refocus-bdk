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
const generic = require('./generic.js');
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
const defaultMaxEvents = 2000;
const ZERO = 0; // eslint-disable-line
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
} // debugMessageGet

/**
 * Gets ID of bot from refocus
 * @param {string} refocusUrl - refocus url to query
 * @param {string} token - token for authenticating with refocus
 * @param {string} botName - name of bot to get Id for
 * @returns {string} bot id
 */
function getBotId(refocusUrl, token, botName) {
  return new Promise((resolve) => {
    generic.get(`${refocusUrl}${API}${BOTS_ROUTE}?name=${botName}`, token)
      .then((res) => {
        const botId = res.body[ZERO].id;
        resolve(botId);
      })
      .catch((error) => {
        // eslint-disable-next-line
        console.error(error);
        resolve(undefined);
      });
  });
}

module.exports = (config, botName='') => {
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
     * Get the bot ID from the name
     *
     * @returns {string} - Id of the bot from refocus
     */
    getBotId,

    /**
     * Find room by id/name
     *
     * @param {String} id - ID of room
     * @returns {Promise} - Room response
     */
    findRoom: (id) => {
      log.debug('Find Room ',
        { id, route: `${SERVER}${API}${ROOMS_ROUTE}/${id}` });
      return generic.get(`${SERVER}${API}${ROOMS_ROUTE}/${id}`,
        TOKEN, ZERO, log);
    }, // findRoom

    /**
     * Get a list of all active rooms
     *
     * @returns {Promise} - Resolves to a list of active rooms.
     */
    getActiveRooms: () => {
      return generic.get(`${SERVER}${API}${ROOMS_ROUTE}?active=true`,
        TOKEN, ZERO, log);
    }, // getActiveRooms

    getRoomTypes: () => {
      return generic.get(`${SERVER}${API}${ROOM_TYPES_ROUTE}`,
        TOKEN, ZERO, log);
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
      return generic.patch(`${SERVER}${API}${ROOMS_ROUTE}/${id}`, patch, TOKEN,
        ZERO, log);
    }, // updateSettings

    /**
     * Get users
     *
     * @param {String} id - ID of User
     * @returns {Promise} - User response
     */
    getUser: (id) => {
      log.debug('Getting User ', id);
      return generic.get(`${SERVER}${API}${USERS_ROUTE}/${id}`, TOKEN,
        ZERO, log);
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
      return generic.get(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}` +
      '&type=User&limit=500',
      TOKEN,
      ZERO, log)
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
      return generic.get(`${SERVER}${API}${BOTS_ROUTE}/${id}`, TOKEN,
        ZERO, log);
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
      return generic.get(`${SERVER}${API}${BOTACTIONS_ROUTE}/${id}`, TOKEN,
        ZERO, log);
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
        return generic.get(`${SERVER}${API}${BOTACTIONS_ROUTE}?roomId=${room}`,
          ZERO, log);
      } else if (!name) {
        return generic.get(
          `${SERVER}${API}${BOTACTIONS_ROUTE}?roomId=${room}&botId=${bot}`,
          TOKEN, ZERO, log);
      }
      return generic.get(
        `${SERVER}${API}${BOTACTIONS_ROUTE}` +
        `?roomId=${room}&botId=${bot}&name=${name}`, TOKEN, ZERO, log);
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
        botAction.botId = botName ? botName : botAction.botId;
      } catch (error) {
        log.error('Create bot action bdk', error);
      }
      return generic.post(`${SERVER}${API}${BOTACTIONS_ROUTE}`, botAction,
        TOKEN, ZERO, log);
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

      return generic.patch(`${SERVER}${API}${BOTACTIONS_ROUTE}/${id}`,
        responseObject, TOKEN, ZERO, log)
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
          return generic.post(`${SERVER}${API}${EVENTS_ROUTE}`, eventObject,
            TOKEN, ZERO, log);
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

      return generic.patch(`${SERVER}${API}${BOTACTIONS_ROUTE}/${id}`,
        responseObject, TOKEN, ZERO, log);
    }, // respondBotActionNoLog

    /**
     * Create bot data
     *
     * @param {String} room - Id room
     * @param {String} bot - Id of bot
     * @param {String} botDataName - Name of data
     * @param {*} value - Can already be serialized or any other data type
     * @returns {Promise} - Bot Data response
     */
    createBotData: (room, bot, botDataName, value) => {
      let newData = value;
      if (newData && typeof newData !== 'string') {
        newData = serialize(newData);
      }
      const Id = botName ? botName : bot;
      const botData = {
        'name': botDataName,
        'roomId': parseInt(room, 10),
        'botId': Id,
        'value': newData
      };
      log.debug('Creating Bot Data', botData);
      return generic.post(`${SERVER}${API}${BOTDATA_ROUTE}`, botData, TOKEN,
        ZERO, log);
    }, // createBotData

    /**
     * Find bot data by id/name
     *
     * @param {String} id - ID of bot data
     * @returns {Promise} - Bot Data response
     */
    findBotData: (id) => {
      log.debug('Getting Bot Data ', id);
      return generic.get(`${SERVER}${API}${BOTDATA_ROUTE}/${id}`, TOKEN,
        ZERO, log);
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
      const bName = botName ? botName : bot;
      log.debug('Getting Bot Data. ', { room, bName, name });
      if (!bName) {
        return log.error('getBotData needs botname');
      } if (!name) {
        return generic.get(`${SERVER}${API}${ROOMS_ROUTE}/` +
          `${room}/bots/${bName}/data`, TOKEN, ZERO, log);
      }
      return generic.get(`${SERVER}${API}${BOTDATA_ROUTE}` +
        `?roomId=${room}&botId=${bName}&name=${name}`, TOKEN, ZERO, log);
    }, // getBotData

    /**
     * Generic function for getting and parsing bot data in JSON form.
     *
     * @param {String} roomId - the id of the room to query
     * @param {String} botDataName - the name of the bot data to query
     * @param {String} bot - the name of the bot
     * @returns {Object} - the parsed bot data
     */
    getAndParseBotData(roomId, botDataName, bot) {
      if (!roomId || !botDataName) return null;
      let retBotData = null;
      try {
        return this.getBotData(roomId, bot, botDataName).then((botData) => {
          if (botData && botData.body && botData.body.length > ZERO) {
            retBotData = JSON.parse(botData.body[ZERO].value);
          }
          return retBotData;
        });
      } catch (err) {
        log.error(err);
        return null;
      }
    },

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
      return generic.patch(`${SERVER}${API}${BOTDATA_ROUTE}/${id}`, newBotData,
        TOKEN, ZERO, log);
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
      const bName = botName ? botName : bot;
      let newData = value;
      if (newData && typeof newData !== 'string') {
        newData = serialize(newData);
      }

      const newBotData = {
        name,
        'roomId': parseInt(room, 10),
        'botId': bName,
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
      return generic.get(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}` +
        `&limit=${limitAmount}&offset=${offsetAmount}`, TOKEN,
      ZERO, log);
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
      return generic.get(getRoute, TOKEN, ZERO, log)
        .then((events) => {
          const allEvents = [];
          const total = events.header['x-total-count'];
          if ((events.body) && (total > events.body.length)) {
            limit = events.body.length;
            offset = NO_OFFSET;
            while (offset < total && offset < maxEvents) {
              allEvents.push(
                generic.get(`${getRoute}&limit=${limit}&offset=${offset}`,
                  TOKEN, ZERO, log)
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
      return getBotId(SERVER, TOKEN, botName).then((id) => {
        log.debug('Creating a new Event. ', { room, msg, context, type });
        const events = {
          log: msg,
          roomId: room,
          actionType: type,
          botId: id
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
        return generic
          .post(`${SERVER}${API}${EVENTS_ROUTE}`, events, TOKEN, ZERO, log);
      });
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
      return generic.post(`${SERVER}${API}${EVENTS_BULK_ROUTE}`, events, TOKEN,
        ZERO, log);
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
      return generic.patch(`${SERVER}${API}${ROOMS_ROUTE}/${rId}`,
        roomObject, TOKEN, ZERO, log);
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
      return generic.patch(`${SERVER}${API}${ROOMS_ROUTE}/${rId}`,
        roomObject, TOKEN, ZERO, log);
    }, // updateRoomName

    getOrInitializeBotData: (room, botId, dataName, defaultValue) => {
      const bName = botName ? botName : botId;
      log.debug('Getting or Initialize BotData. ', { room, bName, dataName });
      return new Promise((resolve, reject) => {
        return generic.get(`${SERVER}${API}${BOTDATA_ROUTE}` +
        `?roomId=${room}&botId=${botId}&name=${dataName}`,
        TOKEN, ZERO, log)
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
              'botId': bName,
              'value': newData
            };
            return generic.post(`${SERVER}${API}${BOTDATA_ROUTE}`,
              botData, TOKEN, ZERO, log)
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
