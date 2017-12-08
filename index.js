/**
 * Copyright (c) 2017, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * /lib/refocus-bdk.js
 *
 * This package is utility package for bot development to speed up development
 * and consolidate commonly used functions.
 *
 */
'use strict';

const moment = require('moment');
const request = require('superagent');
const io = require('socket.io-client');
const API = '/v1';
const BOTS_ROUTE = '/bots';
const BOTACTIONS_ROUTE = '/botActions';
const BOTDATA_ROUTE = '/botData';
const ROOMS_ROUTE = '/rooms';
const EVENTS_ROUTE = '/events';
const ui = 'web/dist/bot.zip';

module.exports = function(config) {
  const SERVER = config.refocusUrl;
  const TOKEN = config.token;

  /**
   * Get JSON from server asynchronous
   *
   * @param url {String} - URL for route
   * @returns {Promise} - Route response
   */
  function genericGet(route){
    return new Promise((resolve, reject) => {
      request
      .get(route)
      .set('Authorization', TOKEN)
      .end((error, res) => {
        resolve(res);
      });
    });
  }

  /**
   * Patch JSON to server asynchronous
   *
   * @param {String} - URL for route
   * @param payload {JSON} - the payload needed for route
   * @returns {Promise} - Route response
   */
  function genericPatch(route, obj){
    return new Promise((resolve, reject) => {
      request
      .patch(route)
      .set('Authorization', TOKEN)
      .send(obj)
      .end((error, res) => {
        resolve(res);
      });
    });
  }

  /**
   * Post JSON to server asynchronous
   *
   * @param url {String} - URL for route
   * @param payload {JSON} - the payload needed for route
   * @returns {Promise} - Route response
   */
  function genericPost(route, obj){
    return new Promise((resolve, reject) => {
      request
      .post(route)
      .set('Authorization', TOKEN)
      .send(obj)
      .end((error, res) => {
        resolve(res);
      });
    });
  }

  function refocusConnectSocket(app, token) {
    const socket = io.connect(SERVER, {
      'reconnect': true,
      'reconnection delay': 10,
      'transports': ['websocket'],
      upgrade: false,
      extraHeaders: {
        Authorization: token
      }})

    const settingsChangedEventName = 'refocus.internal.realtime.room.settingsChanged';
    const initalizeEventName = 'refocus.internal.realtime.bot.namespace.initialize';
    const botActionsAdd = 'refocus.internal.realtime.bot.action.add';
    const botActionsUpdate = 'refocus.internal.realtime.bot.action.update';

    socket.on(initalizeEventName, function(data) {
       // Connected, let's sign-up for to receive messages for this room
       console.log("socket initialized")
    });

    socket.on(settingsChangedEventName, function(data) {
       // Connected, let's sign-up for to receive messages for this room
       const eventData = JSON.parse(data);
       const room = eventData[settingsChangedEventName];
       app.emit('refocus.room.settings', room);
    });

    socket.on(botActionsAdd, function(data) {
       const eventData = JSON.parse(data);
       const action = eventData[botActionsAdd];
       app.emit('refocus.bot.actions', action);
    });

    socket.on(botActionsUpdate, function(data) {
       const eventData = JSON.parse(data);
       const action = eventData[botActionsUpdate];
       app.emit('refocus.bot.actions', action);
    });

    socket.on('connect', function() {
       // Connected, let's sign-up for to receive messages for this room
       console.log("socket connected")
    });

    socket.on('disconnect', function() {
       // Connected, let's sign-up for to receive messages for this room
       console.log("socket disconnected")
    });
  } // setupSocketIOClient

  /**
   * STOP GAP PROCESSES
   * Polling function that will hit the server over and over
   * to see if there is new updates to data or settings updates for
   * the UI to use. This polling can be replaced with sockets for
   * subscription based updates.
   *
   * @param app {Express} - App stream so we can push events to the server
   */
  function refocusConnectPolling(app){
    setInterval(function() {
      // genericGet(SERVER+API+ROOMS_ROUTE+'/')
      // .then((rooms) => {
      //   rooms.body.forEach(room => {
      //     var duration = moment.duration(moment().diff(moment(room.updatedAt))).asSeconds();
      //     if(duration < 8){
      //       app.emit('refocus.room.settings', room);
      //     }
      //   });
      // });
      // genericGet(SERVER+API+BOTACTIONS_ROUTE+'/')
      // .then((botActions) => {
      //   botActions.body.forEach(botAction => {
      //     var duration = moment.duration(moment().diff(moment(botAction.updatedAt))).asSeconds();
      //     if((!botAction.response) && (duration < 8)){
      //       app.emit('refocus.bot.actions', botAction);
      //     }
      //   });
      // });
      genericGet(SERVER+API+BOTDATA_ROUTE+'/')
      .then((botData) => {
        botData.body.forEach(bd => {
          var duration = moment.duration(moment().diff(moment(bd.updatedAt))).asSeconds();
          if(duration < 8){
            app.emit('refocus.bot.data', bd);
          }
        });
      });
      genericGet(SERVER+API+EVENTS_ROUTE+'/')
      .then((events) => {
        events = events.body;
        if (events.length > 0) {
          var duration = moment.duration(moment().diff(moment(events[events.length - 1].updatedAt))).asSeconds();
          if (duration < 8) {
            app.emit('refocus.events', data[data.length - 1]);
          }
        }
      });
    }, 5000);
  }

  /**
   * Installs a new Bot.
   * Executes a POST request against Refocus /v1/bots route
   *
   */
  function installBot(bot) {

    const {
      name,
      url,
      ui,
      active = false,
      actions = [],
      data = [],
      settings = []
    } = bot;

    return new Promise((resolve, reject) => {
      request
      .post(`${SERVER}/v1/bots`)
      .set('Content-Type', 'multipart/form-data')
      .set('Authorization', TOKEN)
      .field('name', name)
      .field('url', url)
      .field('active', active)
      .field('actions', JSON.stringify(actions))
      .field('data', JSON.stringify(data))
      .field('settings', JSON.stringify(settings))
      .attach('ui', ui)
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (!res) {
          console.log('Failed to install a bot. Check if Refocus server is running');
          return;
        }
        const ok = (res.status === 200) || (res.status === 201);
        if (err || !ok) {
          const [ errorMessage ] = res.body.errors;
          if (errorMessage) {
            if (errorMessage.message === 'name must be unique') {
              reject('duplicate');
            }
          }
          reject(err || !ok);
        } else {
          //Need to save this after install
          console.log('Socket Authorization Token: ' + res.body.token);
          resolve(res);
        }
      });
    });
  }  // installBot

  /**
   * Updates existing Bot.
   * Executes a PUT request against Refocus /v1/bots route
   *
   */
  function updateBot(bot) {

    const {
      name,
      url,
      ui,
      active = false,
      actions = [],
      data = [],
      settings = []
    } = bot;

    return new Promise((resolve, reject) => {
      request
      .put(`${SERVER}/v1/bots/${name}`)
      .set('Content-Type', 'multipart/form-data')
      .set('Authorization', TOKEN)
      .field('name', name)
      .field('url', url)
      .field('active', active)
      .field('actions', JSON.stringify(actions))
      .field('data', JSON.stringify(data))
      .field('settings', JSON.stringify(settings))
      .attach('ui', ui)
      .set('Accept', 'application/json')
      .end((err, res) => {
        if (!res) {
          console.log('Failed to update a bot. Check if Refocus server is running');
          reject();
        } else {
          const ok = (res.status === 200) || (res.status === 201);
          if (err || !ok) {
            if(!res.status == 404) {
              console.log(`error: ${JSON.stringify(err)} res: ${JSON.stringify(res)}`);
              const [ errorMessage ] = res.body.errors;
              if (errorMessage) {
                if (errorMessage.type === 'SequelizeValidationError') {
                  reject('validation error');
                }
              }
            } else {
              console.log(`${bot.name} does not exist so cannot update, will try to install instead.`);
            }

            reject(err || !ok);
          } else {
            resolve(res);
          }
        }
      });
    });
  } // updateBot

  return {

    /**
     * Find room by id/name
     *
     * @param id {String} - ID of room
     * @returns {Promise} - Room response
     */
    findRoom: function(id){
      return genericGet(SERVER+API+ROOMS_ROUTE+'/'+id);
    },

    /**
     * Update room settings
     *
     * @param id {String} - ID of room
     * @param settings {Object} - Settings object
     * @returns {Promise} - Room response
     */
    updateSettings: function(id, settings){
      const patch = {
        "settings": settings,
      };
      return genericPatch(SERVER+API+ROOMS_ROUTE+'/'+id, patch);
    },

      /**
     * Find bot by id/name
     *
     * @param id {String} - ID of bot
     * @returns {Promise} - Bot response
     */
    findBot: function(id){
      return genericGet(SERVER+API+BOTS_ROUTE+'/'+id);
    },

    /**
     * Find bot action by id/name
     *
     * @param id {String} - ID of bot action
     * @returns {Promise} - Bot Action response
     */
    findBotAction: function(id){
      return genericGet(SERVER+API+BOTACTIONS_ROUTE+'/'+id);
    },

    /**
     * Find bot action by room, bot, and name
     *
     * @param room {String} - ID of room
     * @param bot {String} - ID of bot
     * @param name {String} - Name of bot action
     * @returns {Promise} - Bot Action response
     */
    getBotActions: function(room, bot, name){
      if (!bot) {
        return genericGet(SERVER+API+BOTACTIONS_ROUTE+'/'+room+'/action');
      } else if (!name) {
        return genericGet(SERVER+API+BOTACTIONS_ROUTE+'/'+room+'/bots/'+bot+'/action');
      } else {
        return genericGet(SERVER+API+BOTACTIONS_ROUTE+'/'+room+'/bots/'+bot+'/name/'+name+'/action');
      }
    },

    /**
     * Create bot action by id/name
     *
     * @param botAction {Object} - botAction object
     * @returns {Promise} - Bot Action response
     */
    createBotAction: function(botAction){
      return genericPost(SERVER+API+BOTACTIONS_ROUTE+'/', botAction);
    },

    /**
     * Update bot action response
     *
     * @param id {String} - ID of bot action
     * @param response {Object} - Response object
     * @returns {Promise} - BotAction response
     */
    respondBotAction: function(id, response){
      let responseObject = {
        "isPending": false,
        "response": response,
      };

      return genericPatch(SERVER+API+BOTACTIONS_ROUTE+'/'+id, responseObject);
    },

    /**
     * Create bot data
     *
     * @param room {String} - Id room
     * @param bot {String} - Id of bot
     * @param name {String} - Name of data
     * @param value {String} - Value
     * @returns {Promise} - Bot Data response
     */
    createBotData: function(room, bot, name, value){
      const botData = {
        "name": name,
        "roomId": parseInt(room),
        "botId": bot,
        "value": value
      };

      return genericPost(SERVER+API+BOTDATA_ROUTE+'/', botData);
    },

    /**
     * Find bot data by id/name
     *
     * @param id {String} - ID of bot data
     * @returns {Promise} - Bot Data response
     */
    findBotData: function(id){
      return genericGet(SERVER+API+BOTDATA_ROUTE+'/'+id);
    },


    /**
     * Find bot data by room, bot, and name
     *
     * @param room {String} - ID of room
     * @param bot {String} - ID of bot
     * @param name {String} - Name of bot data
     * @returns {Promise} - Bot Data response
     */
    getBotData: function(room, bot, name){
      if (!bot) {
        return genericGet(SERVER+API+ROOMS_ROUTE+'/'+room+'/data');
      } if (!name) {
        return genericGet(SERVER+API+ROOMS_ROUTE+'/'+room+'/bots/'+bot+'/data');
      } else {
        return genericGet(SERVER+API+ROOMS_ROUTE+'/'+room+'/bots/'+bot+'/name/'+name+'/data');
      }
    },

    /**
     * Update bot data by id/name
     *
     * @param id {String} - Id of bot data
     * @param botData {Object} - botData object
     * @returns {Promise} - Bot Data response
     */
    changeBotData: function(id, botData){
      const newBotData = {
        "value": botData
      };
      
      return genericPatch(SERVER+API+BOTDATA_ROUTE+'/'+id, newBotData);
    },

    /**
     * Abstraction from polling
     *
     * @param app {Express} - App stream so we can push events to the server
     */
    refocusConnect: function(app, token){
      refocusConnectPolling(app);
      refocusConnectSocket(app, token);
    },

    /**
     *  Installs or updates a bot depending on whether it has been 
     *  installed before or not.
     *
     *  @param packageJSON {JSON} - Contains information such as actions, names, url etc
     */
    installOrUpdateBot: function(packageJSON) {
      const { metadata: { actions, data, settings }, name, url } = packageJSON;
      const bot = { name, url, actions, data, settings, ui, active: true };

      // try to update a bot
      // this function is more common then installing a new bot
      // therefore executed first
      updateBot(bot)
      .then(res => {
        console.log(`bot ${name} successfully updated on: ${SERVER}`);
      })
      .catch(error => {
        // err not found indicate that bot doesnt exist yet
        if (error.status == 404) {
          // installs a new bot in refocus
          installBot(bot)
          .then(res => {
            console.log(`bot ${name} successfully installed on: ${SERVER}`);
          })
          .catch(error => {
            console.log(`unable to install bot ${name} on: ${SERVER}`);
            console.log(`Details: ${JSON.stringify(error)}`);
            process.exit(1);
          });
        }
        else {
          console.log(`Something went wrong while updating ${name} on: ${SERVER}`);
          console.log(`Details: ${JSON.stringify(error)}`);
          process.exit(1);
        }
      });
    }
  };
};