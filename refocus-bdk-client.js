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
'use strict';

const moment = require('moment');
const request = require('superagent');
const io = require('socket.io-client');
const _user = JSON.parse(user.replace(/&quot;/g, '"'));
const API = '/v1';
const BOTS_ROUTE = '/bots';
const BOTACTIONS_ROUTE = '/botActions';
const BOTDATA_ROUTE = '/botData';
const ROOMS_ROUTE = '/rooms';
const EVENTS_ROUTE = '/events';
const POLLING_DELAY = 8;
const POLLING_REFRESH = 5000;
const ONE = 1;
const ZERO = 0;

/**
 * Returns console.logs depending on the URL parameters
 * {URL}?CONSOLE_LOG_LEVEL={logLevel}&FILTER={FILTER STRING}
 *
 * The log level is designed to mimic WinstonJS, so level of log you 
 * choose every level lower than that will be shown in the. Default level is info
 * You can filter the string by text using the filter parameter
 *
 * @param {String} type - Type of log
 * @param {String} msg - Message of log
 * @param {Object} obj - Associated object of message
 */
const logLevels = { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 }
const logSev = { 0: 'error', 1: 'warn', 2: 'info', 3: 'verbose', 4: 'debug', 5: 'silly' }
const logColors = { error: 'red', warn: 'goldenrod', info: 'green', verbose: 'purple', debug: 'blue', silly: 'grey' }

function debugMessage(type, msg, obj){
  const adr = window.location.href;
  const q = url.parse(adr, true);
  const qdata = q.query ? q.query : {};
  const levelSev = qdata['CONSOLE_LOG_LEVEL'] && logLevels[qdata['CONSOLE_LOG_LEVEL']] ? 
    logLevels[qdata['CONSOLE_LOG_LEVEL']] :
    2;
  let level = '';
  for(let i=0; i <= levelSev; i++){
    level += logSev[i] + ',';
  }

  const filter = qdata['FILTER'] ?
    qdata['FILTER'].toLowerCase() :
    false;

  if ((!filter) || (msg.toLowerCase().includes(filter))) {
    if ((level) &&
        (level.includes(type.toLowerCase())) &&
        obj) {
      console.log(
        `%c ${moment().format('YYYY-MM-DD hh:mm:ss').trim()}` + `%c ${type}` + ':',
        'color: black', 'color: '+ logColors[type],
        msg, obj
      );
     } else if ((level) &&
        (level.includes(type.toLowerCase()))) {
      console.log(
        `%c ${moment().format('YYYY-MM-DD hh:mm:ss').trim()}` + `%c ${type}` + ':',
        'color: black', 'color: '+ logColors[type],
        msg,
      );
    }
  }
} // debugMessage

module.exports = (config) => {
  const SERVER = config.refocusUrl;
  const TOKEN = config.token;

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
          resolve(res);
        });
    });
  } // genericPost

  return {
    /**
     * Define a set of log functions
     */
    log: {
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
    },    

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
      return genericGet(SERVER+API+ROOMS_ROUTE+'/'+id);
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
      return genericPatch(SERVER+API+ROOMS_ROUTE+'/'+id, patch);
    }, // updateSettings

    /**
     * Determine which users are active in a room by parsing the event
     * entries
     *
     * @param {Integer} room - ID of the room to get events from
     * @returns {Promise} - An object of the users currently in the room
     */
    getActiveUsers: (room) => {
      return genericGet(SERVER+API+EVENTS_ROUTE+'?roomId='+room)
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
      return genericGet(SERVER+API+BOTS_ROUTE+'/'+id);
    }, // findBot

    /**
     * Find bot action by id/name
     *
     * @param {String} id - ID of bot action
     * @returns {Promise} - Bot Action response
     */
    findBotAction: (id) => {
      return genericGet(SERVER+API+BOTACTIONS_ROUTE+'/'+id);
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
      if (!bot) {
        return genericGet(SERVER+API+BOTACTIONS_ROUTE+'?roomId='+room);
      } else if (!name) {
        return genericGet(
          SERVER+API+BOTACTIONS_ROUTE+'?roomId='+room+'&botId='+bot
        );
      }
      return genericGet(
        SERVER+API+BOTACTIONS_ROUTE
        +'?roomId='+room+'&botId='+bot+'&name='+name
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
      try {
        botAction.userId = _user.id;
      } catch (error) {
        console.log('Create bot action bdk', error);
      }
      return genericPost(SERVER+API+BOTACTIONS_ROUTE+'/', botAction);
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
      const responseObject = {
        'isPending': false,
        'response': res,
      };

      return genericPatch(SERVER+API+BOTACTIONS_ROUTE+'/'+id, responseObject)
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
          return genericPost(SERVER+API+EVENTS_ROUTE, eventObject);
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
      const responseObject = {
        'isPending': false,
        'response': res,
      };

      return genericPatch(SERVER+API+BOTACTIONS_ROUTE+'/'+id, responseObject);
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
      return genericPost(SERVER+API+BOTDATA_ROUTE+'/', botData);
    }, // createBotData

    /**
     * Find bot data by id/name
     *
     * @param {String} id - ID of bot data
     * @returns {Promise} - Bot Data response
     */
    findBotData: (id) => {
      return genericGet(SERVER+API+BOTDATA_ROUTE+'/'+id);
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
      if (!bot) {
        return genericGet(SERVER+API+ROOMS_ROUTE+'/'+room+'/data');
      } if (!name) {
        return genericGet(SERVER+API+ROOMS_ROUTE+'/'+room+'/bots/'+bot+'/data');
      }

      return genericGet(
        SERVER+API+BOTDATA_ROUTE+'?roomId='+room+'&botId='+bot+'&name='+name
      );
    }, // getBotData

    /**
     * Update bot data by id/name
     *
     * @param {String} id - Id of bot data
     * @param {Object} botData - botData object
     * @returns {Promise} - Bot Data response
     */
    changeBotData: (id, botData) => {
      const newBotData = {
        'value': botData
      };
      return genericPatch(SERVER+API+BOTDATA_ROUTE+'/'+id, newBotData);
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

      genericGet(SERVER+API+ROOMS_ROUTE+'/'+room+'/bots/'+bot+'/data')
        .then((data) => {
          const _data = data.body
            .filter((bd) => bd.name === name)[ZERO];
          if (_data) {
            return genericPatch(SERVER+API+BOTDATA_ROUTE+'/'+_data.id,
              changeBotData);
          }
          return genericPost(SERVER+API+BOTDATA_ROUTE+'/', newBotData);
        });
    }, // upsertBotData

    /**
     * Find events by room
     *
     * @param {String} room - ID of room
     * @returns {Promise} - All the events of the room
     */
    getEvents: (room) => {
      return genericGet(SERVER+API+EVENTS_ROUTE+'?roomId='+room);
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
        debugMessage('error', 'Event User Error', error);
      }
      return genericPost(SERVER+API+EVENTS_ROUTE, events);
    }, // createEvents

    /**
     * Abstraction from polling
     *
     * @param {Express} app - App stream so we can push events to the server
     * @param {String} token - Socket Token needed to connect to Refocus socket
     */
    refocusConnect: (app, token) => {
      if (process.env.USE_POLLING) {
        refocusConnectPolling(app);
      } else {
        refocusConnectSocket(app, token);
      }
    }, // refocusConnect
  };
};
