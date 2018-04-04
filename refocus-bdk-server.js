/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * refocus-bdk-server.js
 *
 * This package is utility package for bot development to speed up development
 * and consolidate commonly used functions.
 *
 * Server-side version of the BDK.
 * Optimized for non-DOM based javascript execution environment.
 *
 */

const moment = require('moment');
const request = require('superagent');
const requestProxy = require('superagent-proxy');
const io = require('socket.io-client');
const API = '/v1';
const BOTS_ROUTE = '/bots';
const BOTACTIONS_ROUTE = '/botActions';
const BOTDATA_ROUTE = '/botData';
const ROOMS_ROUTE = '/rooms';
const EVENTS_ROUTE = '/events';
const ui = 'web/dist/bot.zip';
const POLLING_DELAY = 8;
const POLLING_REFRESH = 5000;
const START_OF_ARRAY = 0;
const STATUS_CODE_OK = 200;
const STATUS_CODE_CREATED = 201;
const STATUS_CODE_NOT_FOUND = 404;

// Create logger
const winston = require('winston');
const fs = require('fs');
const logDir = 'log';
const winstonDailyRotateFile = require('winston-daily-rotate-file');

/* eslint-disable no-process-env */
const logging =
  process.env.BOT_LOGGING ? process.env.BOT_LOGGING.toLowerCase() : '';
const CONSOLE_LOG_LEVEL = process.env.CONSOLE_LOG_LEVEL || 'info';
const FILE_LOG_LEVEL = process.env.FILE_LOG_LEVEL || 'verbose';
const USE_POLLING = process.env.USE_POLLING;
/* eslint-enable no-process-env */

/* eslint no-sync: ["error", { allowAtRootLevel: true }] */
if (((logging === 'both') || (logging === 'file')) &&
    (!fs.existsSync(logDir))) {
  fs.mkdirSync(logDir);
}
/* eslint func-style: ["error", "declaration",
  { "allowArrowFunctions": true }] */
const tsFormat = () => moment().format('YYYY-MM-DD hh:mm:ss').trim();
const logger = new (winston.Logger)({
  transports: [
    // Console output
    new (winston.transports.Console)({
      timestamp: tsFormat,
      prettyPrint: true,
      colorize: true,
      silent: !(((logging === '') || (logging === 'both') ||
        (logging === 'console'))),
      level: CONSOLE_LOG_LEVEL
    }),
    // File output
    new (winstonDailyRotateFile)({
      filename: `${logDir}/-results.log`,
      timestamp: tsFormat,
      datePattern: 'yyyy-MM-dd ',
      prepend: true,
      silent: !(((logging === 'both') || (logging === 'file'))),
      level: FILE_LOG_LEVEL
    })
  ]
});

module.exports = (config) => {
  const SERVER = config.refocusUrl;
  const TOKEN = config.token;
  let PROXY_URL;

  /**
   * Define a set of log functions
   */
  const log = {
    error: (msg, obj) => logger.error(msg, obj),
    warn: (msg, obj) => logger.warn(msg, obj),
    info: (msg, obj) => logger.info(msg, obj),
    verbose: (msg, obj) => logger.verbose(msg, obj),
    debug: (msg, obj) => logger.debug(msg, obj),
    silly: (msg, obj) => logger.silly(msg, obj),
    realtime: (msg, obj) => {
      const name = obj.new ? obj.new.name : obj.name;
      logger.info('realtime: ' + msg, name);
      logger.verbose('realtime: ' + msg, obj);
    },
  };

  if (config.httpProxy) {
    requestProxy(request);
    PROXY_URL = config.httpProxy;
  }

  /**
   * Get JSON from server asynchronous
   *
   * @param {String} route - URL for route
   * @returns {Promise} - Route response
   */
  function genericGet(route){
    return new Promise((resolve) => {
      const req = request.get(route);
      if (PROXY_URL) {
        req.proxy(PROXY_URL);
      }
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
   * @param {JSON} obj - the payload needed for route
   * @returns {Promise} - Route response
   */
  function genericPatch(route, obj){
    return new Promise((resolve) => {
      const req = request.patch(route);
      if (PROXY_URL) {
        req.proxy(PROXY_URL);
      }
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
      if (PROXY_URL) {
        req.proxy(PROXY_URL);
      }
      req
        .set('Authorization', TOKEN)
        .send(obj)
        .end((error, res) => {
          resolve(res);
        });
    });
  } // genericPost

  /**
   * Connect to refocuses socket connections.
   *
   * @param {Express} app - App stream so we can push events to the server
   * @param {String} token - Socket Token needed to connect to Refocus socket
   */
  function refocusConnectSocket(app, token) {
    const socket = io.connect(SERVER, {
      'reconnect': true,
      'reconnection delay': 10,
      'transports': ['websocket'],
      upgrade: false,
      extraHeaders: {
        Authorization: token
      }
    });

    const settingsChangedEventName =
      'refocus.internal.realtime.room.settingsChanged';
    const initalizeEventName =
      'refocus.internal.realtime.bot.namespace.initialize';
    const botActionsAdd =
      'refocus.internal.realtime.bot.action.add';
    const botActionsUpdate =
      'refocus.internal.realtime.bot.action.update';
    const botDataAdd =
      'refocus.internal.realtime.bot.data.add';
    const botDataUpdate =
      'refocus.internal.realtime.bot.data.update';
    const botEventAdd =
      'refocus.internal.realtime.bot.event.add';

    socket.on(initalizeEventName, () => {
      logger.info('Socket Initialized');
    });

    socket.on(settingsChangedEventName, (data) => {
      const eventData = JSON.parse(data);
      const room = eventData[settingsChangedEventName];
      app.emit('refocus.room.settings', room);
      log.realtime('Room Settings', room);
    });

    socket.on(botActionsAdd, (data) => {
      const eventData = JSON.parse(data);
      const action = eventData[botActionsAdd];
      app.emit('refocus.bot.actions', action);
      log.realtime('Bot Action', action);
    });

    socket.on(botActionsUpdate, (data) => {
      const eventData = JSON.parse(data);
      const action = eventData[botActionsUpdate].new;
      app.emit('refocus.bot.actions', action);
      log.realtime('Bot Action', action);
    });

    socket.on(botDataAdd, (data) => {
      const eventData = JSON.parse(data);
      const botData = eventData[botDataAdd];
      app.emit('refocus.bot.data', botData);
      log.realtime('Bot Data', botData);
    });

    socket.on(botDataUpdate, (data) => {
      const eventData = JSON.parse(data);
      const botData = eventData[botDataUpdate].new;
      app.emit('refocus.bot.data', botData);
      log.realtime('Bot Data', botData);
    });

    socket.on(botEventAdd, (data) => {
      const eventData = JSON.parse(data);
      const botEvent = eventData[botEventAdd];
      app.emit('refocus.events', botEvent);
      log.realtime('Room Events', botEvent);
    });

    socket.on('connect', () => {
      logger.info('Socket Connected');
    });

    socket.on('disconnect', () => {
      logger.info('Socket Disconnected');
    });
  } // refocusConnectSocket

  /**
   * STOP GAP PROCESSES
   * Polling function that will hit the server over and over
   * to see if there is new updates to data or settings updates for
   * the UI to use. This polling can be replaced with sockets for
   * subscription based updates.
   *
   * @param {Express} app - App stream so we can push events to the server
   * @param {Object} options - Request options
   */
  function refocusConnectPolling(app, options){
    setInterval(() => {
      genericGet(SERVER+API+BOTACTIONS_ROUTE+options+'&isPending=true')
        .then((botActions) => {
          if (botActions && botActions.body) {
            botActions.body.forEach((botAction) => {
              const duration =
                moment.duration(
                  moment().diff(moment(botAction.updatedAt))
                ).asSeconds();
              if ((botAction.isPending) && (!botAction.response) &&
                 (duration < POLLING_DELAY)) {
                app.emit('refocus.bot.actions', botAction);
                log.realtime('Bot Action', botAction);
              }
            });
          }
        });
    }, POLLING_REFRESH);
  } // refocusConnectPolling

  /**
   * Installs a new Bot.
   * Executes a POST request against Refocus /v1/bots route
   *
   * @param {Blob} bot - The bundle of the UI blob
   * @returns {Promise} - The response of the bot install
   */
  function installBot(bot) {
    const {
      name,
      url,
      active = false,
      version = '1.0.0',
      actions = [],
      data = [],
      settings = []
    } = bot;

    return new Promise((resolve, reject) => {
      const req = request.post(`${SERVER}/v1/bots`);
      if (PROXY_URL) {
        req.proxy(PROXY_URL);
      }
      req
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', TOKEN)
        .field('name', name)
        .field('url', url)
        .field('active', active)
        .field('version', version)
        .field('actions', JSON.stringify(actions))
        .field('data', JSON.stringify(data))
        .field('settings', JSON.stringify(settings))
        .attach('ui', ui)
        .set('Accept', 'application/json')
        .end((err, res) => {
          if (!res) {
            logger.info(
              'Failed to install a bot. Check if Refocus server is running'
            );
            return;
          }
          const ok = (res.status === STATUS_CODE_OK) ||
            (res.status === STATUS_CODE_CREATED);
          if (err || !ok) {
            const [errorMessage] = res.body.errors;
            if (errorMessage) {
              if (errorMessage.message === 'name must be unique') {
                reject('duplicate');
              }
            }
            reject(err || !ok);
          } else {
            // Need to save this after install
            logger.info('Socket Authorization Token: ' + res.body.token);
            resolve(res);
          }
        });
    });
  } // installBot

  /**
   * Updates existing Bot.
   * Executes a PUT request against Refocus /v1/bots route
   *
   * @param {Blob} bot - The bundle of the UI blob
   * @returns {Promise} - The response of the bot install
   */
  function updateBot(bot) {
    const {
      name,
      url,
      active = false,
      version = '1.0.0',
      actions = [],
      data = [],
      settings = []
    } = bot;

    return new Promise((resolve, reject) => {
      const req = request.put(`${SERVER}/v1/bots/${name}`);
      if (PROXY_URL) {
        req.proxy(PROXY_URL);
      }
      req
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', TOKEN)
        .field('name', name)
        .field('url', url)
        .field('active', active)
        .field('version', version)
        .field('actions', JSON.stringify(actions))
        .field('data', JSON.stringify(data))
        .field('settings', JSON.stringify(settings))
        .attach('ui', ui)
        .set('Accept', 'application/json')
        .end((err, res) => {
          if (!res) {
            logger.error('Failed to update Bot ', name);
            logger.error('Check if Refocus server is running');
            return reject();
          }
          const ok = (res.status === STATUS_CODE_OK) ||
            (res.status === STATUS_CODE_CREATED);
          if (err || !ok) {
            if (!res.status === STATUS_CODE_NOT_FOUND) {
              logger.error('Error while updating Bot', { res, err });
              const [errorMessage] = res.body.errors;
              if (errorMessage) {
                if (errorMessage.type === 'SequelizeValidationError') {
                  reject('validation error');
                }
              }
            } else {
              logger.warn(`${bot.name} does not exist so cannot update,
                will try to install instead.`);
            }

            return reject(err || !ok);
          }
          return resolve(res);
        });
    });
  } // updateBot

  return {

    /**
    * Export logger
    */
    log,

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
        SERVER+API+BOTACTIONS_ROUTE+
        '?roomId='+room+'&botId='+bot+'&name='+name
      );
    }, // getBotActions

    /**
     * Create bot action by id/name
     *
     * @param {Object} botAction - botAction object
     * @returns {Promise} - Bot Action response
     */
    createBotAction: (botAction) => {
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
     * @param {array} parametersOverride - allows for parameters to be sent
     *   to over ride the parameters previously in action
     * @returns {Promise} - BotAction response
     */
    respondBotAction: (id, res, eventLog, parametersOverride) => {
      const responseObject = {
        'isPending': false,
        'response': res,
      };

      if (parametersOverride) {
        responseObject.parameters = parametersOverride;
      }

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
      const newBotData = {
        name,
        'roomId': parseInt(room, 10),
        'botId': bot,
        'value': botData
      };

      return genericPost(`${SERVER}${API}${ROOMS_ROUTE}/botData/upsert`,
        newBotData);
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
      const limitAmount = limit || 100;
      const offsetAmount = offset || 0;
      return genericGet(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}` +
        `&limit=${limitAmount}&offset=${offsetAmount}`);
    }, // getEvents

    /**
     * Find all events by room
     *
     * @param {String} room - ID of room
     * @returns {Promise} - All the events of the room
     */
    getAllEvents: (room) => {
      log.debug('Get all events for Room ', room);
      let limit;
      let offset; 
      return genericGet(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}`)
      .then((events) => {
        const allEvents = [];
        const total = events.header['x-total-count'];
        if (total > events.body.length) {
          limit = events.body.length;
          offset = 0;
          while (offset < total) {
            allEvents.push(
              return genericGet(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}` +
                `&limit=${limitAmount}&offset=${offsetAmount}`);
            );
            offset += limit;
          }

          return Promise.all(allEvents);
        }        
      })
      .then((eventLogs) => {
        let output = [];
        eventLogs.forEach((eventLog) => {
          output = output.concat(eventLog.body);
        });

        return output;
      });
    }, // getAllEvents

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
      return genericPost(SERVER+API+EVENTS_ROUTE, events);
    }, // createEvents

    /**
     * Abstraction from polling
     *
     * @param {Express} app - App stream so we can push events to the server
     * @param {String} token - Socket Token needed to connect to Refocus socket
     * @param {String} botName - name of a Bot
     */
    refocusConnect: (app, token, botName) => {
      let botId = '';
      let botRoute = '/';
      if (botName) {
        genericGet(SERVER+API+BOTS_ROUTE+'?name='+botName)
          .then((bots) => {
            if (bots && bots.body && bots.body.length) {
              botId = bots.body[START_OF_ARRAY].id;
              botRoute = '?botId=' + botId;
            }

            if (USE_POLLING) {
              refocusConnectPolling(app, botRoute);
            } else {
              refocusConnectSocket(app, token, botId);
            }
          });
      } else if (USE_POLLING) {
        refocusConnectPolling(app, botRoute);
      } else {
        refocusConnectSocket(app, token);
      }
    }, // refocusConnect

    /**
     * Installs or updates a bot depending on whether it has been
     * installed before or not.
     *
     * @param {JSON} packageJSON - Contains information such as
     *    actions, names, url etc
     */
    installOrUpdateBot: (packageJSON) => {
      const { metadata: { actions, data, settings },
        name, url, version } = packageJSON;
      const bot = { name, url, version, actions,
        data, settings, ui, active: true };

      // try to update a bot
      // this function is more common then installing a new bot
      // therefore executed first
      updateBot(bot)
        .then(() => {
          logger.info(`${name} successfully updated on: ${SERVER}`);
        })
        .catch((error) => {
          // err not found indicate that bot doesnt exist yet
          if (error && error.status === STATUS_CODE_NOT_FOUND) {
            // installs a new bot in refocus
            installBot(bot)
              .then(() => {
                logger.info(`${name} successfully installed on: ${SERVER}`);
              })
              .catch((installError) => {
                logger.error(`Unable to install bot ${name} on: ${SERVER}`);
                logger.error('Details: ', installError);
                throw new Error(`Unable to install bot ${name} on: ${SERVER}`);
              });
          } else {
            logger.error(
              `Something went wrong while updating ${name} on: ${SERVER}`
            );
            logger.error('Details: ', error);
            throw new Error(`Something went wrong while updating
              ${name} on: ${SERVER}`);
          }
        });
    } // installOrUpdateBot
  };
};
