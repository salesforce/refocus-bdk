/**
 * Copyright (c) 2018, salesforce.com, inc.
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

/* eslint consistent-return: 0 */
const moment = require('moment');
const request = require('superagent');
const requestProxy = require('superagent-proxy');
const HttpsProxyAgent = require('https-proxy-agent');
const generic = require('./generic.js');
const io = require('socket.io-client');
const serialize = require('serialize-javascript');
const API = '/v1';
const BOTS_ROUTE = '/bots';
const BOTACTIONS_ROUTE = '/botActions';
const BOTDATA_ROUTE = '/botData';
const ROOMS_ROUTE = '/rooms';
const ROOM_TYPES_ROUTE = '/roomTypes';
const EVENTS_ROUTE = '/events';
const EVENTS_BULK_ROUTE = '/events/bulk';
const USERS_ROUTE = '/users';
const MIN_POLLING_DELAY = 100;
const MIN_POLLING_REFRESH = 5000;
const MIN_HEARTBEAT_TIMER = 60000;
/* eslint-disable no-process-env */
/* eslint-disable no-implicit-coercion*/
const MAX_RETRIES = process.env.MAX_RETRIES || 3; // eslint-disable-line
const HEARTBEAT_OFF = process.env.HEARTBEAT_OFF || false;

let POLLING_DELAY =
  +process.env.POLLING_DELAY || MIN_POLLING_DELAY; // Second
POLLING_DELAY = POLLING_DELAY > MIN_POLLING_DELAY ?
  POLLING_DELAY : MIN_POLLING_DELAY;
let POLLING_REFRESH =
  +process.env.POLLING_REFRESH || MIN_POLLING_REFRESH; // Milliseconds
POLLING_REFRESH = POLLING_REFRESH > MIN_POLLING_REFRESH ?
  POLLING_REFRESH : MIN_POLLING_REFRESH;
let HEARTBEAT_TIMER =
  +process.env.HEARTBEAT_TIMER || MIN_HEARTBEAT_TIMER; // Milliseconds
HEARTBEAT_TIMER = HEARTBEAT_TIMER > MIN_HEARTBEAT_TIMER ?
  HEARTBEAT_TIMER : MIN_HEARTBEAT_TIMER;
/* eslint-enable no-process-env */
/* eslint-enable no-implicit-coercion*/
const DEFAULT_UI_PATH = 'web/dist/bot.zip';
const START_OF_ARRAY = 0;
const STATUS_CODE_OK = 200;
const STATUS_CODE_CREATED = 201;
const STATUS_CODE_NOT_FOUND = 404;
const DEFAULT_LIMIT = 100;
const NO_OFFSET = 0;

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
  let TOKEN = config.token;
  const botName = config.botName;
  const BOT_INSTALL_TOKEN = config.token;
  let SOCKET_TOKEN;
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
   * Connect to refocuses socket connections.
   *
   * @param {Express} app - App stream so we can push events to the server
   * @param {String} token - Socket Token needed to connect to Refocus socket
   */
  function refocusConnectSocket(app, token) {
    const opts = {
      reconnect: true,
      'reconnection delay': 10,
      transports: ['websocket'],
      upgrade: false,
      extraHeaders: {
        Authorization: token
      }
    };

    if (PROXY_URL) {
      opts.agent = new HttpsProxyAgent(PROXY_URL);
    }

    const socket = io.connect(SERVER, opts);

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

    socket.on(initalizeEventName, (data) => {
      const eventData = JSON.parse(data);
      const room = eventData[initalizeEventName];
      app.emit('refocus.internal.realtime.bot.namespace.initialize', room);
      log.realtime('New Room', room);
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
    const pendingActions = {};
    setInterval(() => {
      // Clear action queue
      for (const key in pendingActions) {
        if (pendingActions.hasOwnProperty(key)) {
          const timeAdded =
            moment.duration(
              moment().diff(moment(pendingActions[key].updatedAt))
            ).asSeconds();
          if (timeAdded > POLLING_DELAY) {
            delete pendingActions[key];
          }
        }
      }

      generic.get(SERVER+API+BOTACTIONS_ROUTE+options+'&isPending=true',
        TOKEN, MAX_RETRIES, log, PROXY_URL)
        .then((botActions) => {
          if (botActions && botActions.body) {
            botActions.body.forEach((botAction) => {
              const duration =
                moment.duration(
                  moment().diff(moment(botAction.updatedAt))
                ).asSeconds();

              // Check if an action is new
              const IS_ACTION_NEW = (botAction.isPending) &&
              (!botAction.response) &&
              (duration < POLLING_DELAY);

              // If an action is pending and has not been responded to yet but
              // the action is older than our polling delay called it timed out
              const IS_ACTION_TIMED_OUT = (botAction.isPending) &&
              (!botAction.response) &&
              (duration > POLLING_DELAY);

              if (IS_ACTION_NEW) {
                // Check if its a duplicate action
                if (!pendingActions.hasOwnProperty(botAction.id)) {
                  pendingActions[botAction.id] = botAction;
                  app.emit('refocus.bot.actions', botAction);
                  log.realtime('Bot Action', botAction);
                }
              } else if (IS_ACTION_TIMED_OUT) {
                const responseObject = {
                  'isPending': false,
                  'response': { 'error': 'Polling Request Timeout' },
                };

                generic.patch(
                  SERVER + API + BOTACTIONS_ROUTE + '/' + botAction.id,
                  responseObject, TOKEN, MAX_RETRIES, log, PROXY_URL)
                  .catch((error) => {
                    logger.error(
                      `Responding to ${botAction.id} failed: ${error}`
                    );
                  });
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
      displayName = '',
      url,
      helpUrl = '',
      ownerUrl = '',
      active = false,
      version = '1.0.0',
      actions = [],
      data = [],
      settings = [],
      ui = DEFAULT_UI_PATH,
    } = bot;

    return new Promise((resolve, reject) => {
      const req = request.post(`${SERVER}/v1/bots`);
      if (PROXY_URL) {
        req.proxy(PROXY_URL);
      }

      req
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', BOT_INSTALL_TOKEN)
        .field('name', name)
        .field('displayName', displayName)
        .field('url', url)
        .field('helpUrl', helpUrl)
        .field('ownerUrl', ownerUrl)
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
            SOCKET_TOKEN = res.body.token;
            TOKEN = res.body.token;
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
      displayName = '',
      url,
      helpUrl = '',
      ownerUrl = '',
      active = false,
      version = '1.0.0',
      actions = [],
      data = [],
      settings = [],
      ui = DEFAULT_UI_PATH,
    } = bot;

    return new Promise((resolve, reject) => {
      const req = request.put(`${SERVER}/v1/bots/${name}`);
      if (PROXY_URL) {
        req.proxy(PROXY_URL);
      }

      req
        .set('Content-Type', 'multipart/form-data')
        .set('Authorization', BOT_INSTALL_TOKEN)
        .field('name', name)
        .field('displayName', displayName)
        .field('url', url)
        .field('helpUrl', helpUrl)
        .field('ownerUrl', ownerUrl)
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

          SOCKET_TOKEN = res.body.token;
          TOKEN = res.body.token;
          return resolve(res);
        });
    });
  } // updateBot

  /**
    *
    * @param {string} name - Contains name of bot
    */
  function startHeartBeat(name){
    setInterval(() => {
      const currentTimestamp = new Date();
      const requestBody = { currentTimestamp };
      generic.post(SERVER+API+BOTS_ROUTE+'/'+name+'/heartbeat', requestBody,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
    }, HEARTBEAT_TIMER);
  } // heartBeat

  return {

    /**
    * Export logger
    */
    log,

    /**
    * export Install and Update functions
    * for unit testing
    */
    installBot,
    updateBot,

    /**
     * Find room by id/name
     *
     * @param {String} id - ID of room
     * @returns {Promise} - Room response
     */
    findRoom: (id) => {
      return generic.get(SERVER+API+ROOMS_ROUTE+'/'+id,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
    }, // findRoom

    /**
     * Get a list of all active rooms
     *
     * @returns {Promise} - Resolves to a list of active rooms.
     */
    getActiveRooms: () => {
      return generic.get(`${SERVER}${API}${ROOMS_ROUTE}?active=true`,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
    }, // getActiveRooms

    getRoomTypes: () => {
      return generic.get(`${SERVER}${API}${ROOM_TYPES_ROUTE}`,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
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
      return generic.patch(SERVER+API+ROOMS_ROUTE+'/'+id, patch,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
    }, // updateSettings

    /**
     * Get users
     *
     * @param {String} id - ID of User
     * @returns {Promise} - User response
     */
    getUser: (id) => {
      log.debug('Getting User ', id);
      return generic.get(`${SERVER}${API}${USERS_ROUTE}/${id}`,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
    }, // getUser

    /**
     * Determine which users are active in a room by parsing the event
     * entries
     *
     * @param {Integer} room - ID of the room to get events from
     * @returns {Promise} - An object of the users currently in the room
     */
    getActiveUsers: (room) => {
      return generic.get(SERVER+API+EVENTS_ROUTE+'?roomId='+room,
        TOKEN, MAX_RETRIES, log, PROXY_URL)
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
      return generic.get(SERVER+API+BOTS_ROUTE+'/'+id,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
    }, // findBot

    /**
     * Find bot action by id/name
     *
     * @param {String} id - ID of bot action
     * @returns {Promise} - Bot Action response
     */
    findBotAction: (id) => {
      return generic.get(SERVER+API+BOTACTIONS_ROUTE+'/'+id,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
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
        return generic.get(SERVER+API+BOTACTIONS_ROUTE+'?roomId='+room,
          TOKEN, MAX_RETRIES, log, PROXY_URL);
      } else if (!name) {
        return generic.get(
          SERVER+API+BOTACTIONS_ROUTE+'?roomId='+room+'&botId='+bot,
          TOKEN, MAX_RETRIES, log, PROXY_URL);
      }
      return generic.get(
        SERVER+API+BOTACTIONS_ROUTE+
        '?roomId='+room+'&botId='+bot+'&name='+name,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
    }, // getBotActions

    /**
     * Create bot action by id/name
     *
     * @param {Object} botAction - botAction object
     * @returns {Promise} - Bot Action response
     */
    createBotAction: (botAction) => {
      return generic.post(SERVER+API+BOTACTIONS_ROUTE+'/', botAction,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
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

      return generic.patch(SERVER+API+BOTACTIONS_ROUTE+'/'+id, responseObject,
        TOKEN, MAX_RETRIES, log, PROXY_URL)
        .then((instance) => {
          let eventObject = {};
          let userObj = {};
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

          if (instance.body.userId) {
            return generic.get(SERVER+API+USERS_ROUTE+'/'+instance.body.userId,
              TOKEN, MAX_RETRIES, log, PROXY_URL)
              .then((userRes, err) => {
                if (err) {
                  return generic.post(SERVER+API+EVENTS_ROUTE, eventObject,
                    TOKEN, MAX_RETRIES, log, PROXY_URL);
                }

                userObj = {
                  fullName: userRes.body.fullName,
                  name: userRes.body.name
                };

                eventObject.context.user = userObj;
                return generic.post(SERVER+API+EVENTS_ROUTE, eventObject,
                  TOKEN, MAX_RETRIES, log, PROXY_URL);
              });
          }

          return generic.post(SERVER+API+EVENTS_ROUTE, eventObject,
            TOKEN, MAX_RETRIES, log, PROXY_URL);
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

      return generic.patch(SERVER+API+BOTACTIONS_ROUTE+'/'+id, responseObject,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
    }, // respondBotActionNoLog

    /**
     * Find bot data by id/name
     *
     * @param {String} id - ID of bot data
     * @returns {Promise} - Bot Data response
     */
    findBotData: (id) => {
      return generic.get(SERVER+API+BOTDATA_ROUTE+'/'+id,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
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
        return generic.get(SERVER+API+ROOMS_ROUTE+'/'+room+'/data',
          TOKEN, MAX_RETRIES, log, PROXY_URL);
      } if (!name) {
        return generic.get(SERVER+API+ROOMS_ROUTE+'/'+room+'/bots/'+bot+'/data',
          TOKEN, MAX_RETRIES, log, PROXY_URL);
      }

      return generic.get(
        SERVER+API+BOTDATA_ROUTE+'?roomId='+room+'&botId='+bot+'&name='+name,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
    }, // getBotData

    /**
     * Create bot data
     *
     * @param {String} room - Id room
     * @param {String} bot - Id of bot
     * @param {String} name - Name of data
     * @param {*} value - Can already be serialized or any other data type
     * @returns {Promise} - Bot Data response
     */
    createBotData: (room, bot, name, value) => {
      let newData = value;
      if (newData && typeof newData !== 'string') {
        newData = serialize(newData);
      }

      const botData = {
        name,
        'roomId': parseInt(room, 10),
        'botId': bot,
        'value': newData
      };

      logger.info('Creating botData: ', name);
      return generic.post(SERVER+API+BOTDATA_ROUTE+'/', botData,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
    }, // createBotData

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

      logger.info('Updating botData: ', id);
      return generic.patch(SERVER+API+BOTDATA_ROUTE+'/'+id, newBotData,
        TOKEN, MAX_RETRIES, log, PROXY_URL);
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

      logger.info('Upserting new botData: ', name);

      return new Promise((resolve) => {
        const req = request.post(`${SERVER}${API}/botData/upsert`);
        if (PROXY_URL) {
          req.proxy(PROXY_URL);
        }
        req
          .set('Authorization', TOKEN)
          .set('Content-Type', 'application/json')
          .send(newBotData)
          .end((error, res) => {
            if (error) {
              logger.error('Upserting new botData error: ', error);
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
        `&limit=${limitAmount}&offset=${offsetAmount}`,
      TOKEN, MAX_RETRIES, log, PROXY_URL);
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
      return generic.get(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}`,
        TOKEN, MAX_RETRIES, log, PROXY_URL)
        .then((events) => {
          const allEvents = [];
          const total = events.header['x-total-count'];
          if ((events.body) && (total > events.body.length)) {
            limit = events.body.length;
            offset = NO_OFFSET;
            while (offset < total) {
              allEvents.push(
                generic.get(`${SERVER}${API}${EVENTS_ROUTE}?roomId=${room}` +
                  `&limit=${limit}&offset=${offset}`,
                TOKEN, MAX_RETRIES, log, PROXY_URL)
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
      const events = {
        log: msg,
        roomId: room,
        actionType: type,
        botId: botName
      };
      if (context) {
        events.context = context;
      }
      return generic.post(SERVER+API+EVENTS_ROUTE, events,
        PROXY_URL, TOKEN);
    }, // createEvents

    /**
     * Create multiple events at once
     * @param {Array} events - Array of events to be created
     * @returns {Promise} - Response to events
     */
    bulkCreateEvents: (events) => {
      log.debug('Bulk creating new Events. ', events);
      return generic.post(`${SERVER}${API}${EVENTS_BULK_ROUTE}`, events, TOKEN);
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
        roomObject, PROXY_URL, TOKEN);
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
        roomObject, PROXY_URL, TOKEN);
    }, // updateRoomName

    /**
     * Abstraction from polling
     *
     * @param {Express} app - App stream so we can push events to the server
     * @param {String} token - Socket Token needed to connect to Refocus socket
     * @param {String} name - name of a Bot
     */
    refocusConnect: (app, token, name) => {
      let botId = '';
      let botRoute = '/';
      const connectToken = SOCKET_TOKEN ? SOCKET_TOKEN : token;
      if (name) {
        generic.get(SERVER+API+BOTS_ROUTE+'?name='+name,
          PROXY_URL, TOKEN)
          .then((bots) => {
            if (bots && bots.body && bots.body.length) {
              botId = bots.body[START_OF_ARRAY].id;
              botRoute = '?botId=' + botId;
            }

            if (USE_POLLING) {
              refocusConnectPolling(app, botRoute);
            } else {
              refocusConnectSocket(app, connectToken, botId);
            }
          });
      } else if (USE_POLLING) {
        refocusConnectPolling(app, botRoute);
      } else {
        refocusConnectSocket(app, connectToken);
      }
    }, // refocusConnect

    /**
     * Installs or updates a bot depending on whether it has been
     * installed before or not.
     *
     * @param {JSON} packageJSON - Contains information such as
     *    actions, names, url etc
     * @returns {Promise} - promise for chaining
     */
    installOrUpdateBot: (packageJSON) => {
      const { metadata: { actions, data, settings },
        name, url, version, displayName, helpUrl, ownerUrl } = packageJSON;
      const bot = { name, url, helpUrl, ownerUrl, version, displayName, actions,
        data, settings, ui: DEFAULT_UI_PATH, active: true };

      // try to update a bot
      // this function is more common then installing a new bot
      // therefore executed first
      return new Promise((resolve) => {
        updateBot(bot)
          .then(() => {
            logger.info(`${name} successfully updated on: ${SERVER}`);
            if (!HEARTBEAT_OFF){
              startHeartBeat(name);
            }
            resolve();
          })
          .catch((error) => {
            // err not found indicate that bot doesnt exist yet
            if (error && error.status === STATUS_CODE_NOT_FOUND) {
              // installs a new bot in refocus
              installBot(bot)
                .then(() => {
                  logger.info(`${name} successfully installed on: ${SERVER}`);
                  if (!HEARTBEAT_OFF){
                    startHeartBeat(name);
                  }
                  resolve();
                })
                .catch((installError) => {
                  logger.error(`Unable to install bot ${name} on: ${SERVER}`);
                  logger.error('Details: ', installError);
                  throw new Error(`Unable to install bot ${name}
                    on: ${SERVER}`);
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
      });
    } // installOrUpdateBot
  };
};
