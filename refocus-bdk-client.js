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
      let req = request.get(route);
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
   * @param {String} - URL for route
   * @param payload {JSON} - the payload needed for route
   * @returns {Promise} - Route response
   */
  function genericPatch(route, obj){
    return new Promise((resolve, reject) => {
      let req = request.patch(route);
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
   * @param url {String} - URL for route
   * @param payload {JSON} - the payload needed for route
   * @returns {Promise} - Route response
   */
  function genericPost(route, obj){
    return new Promise((resolve, reject) => {
      let req = request.post(route);
      req
      .set('Authorization', TOKEN)
      .send(obj)
      .end((error, res) => {
        resolve(res);
      });
    });
  } // genericPost

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
    const botDataAdd = 'refocus.internal.realtime.bot.data.add';
    const botDataUpdate = 'refocus.internal.realtime.bot.data.update';
    const botEventAdd = 'refocus.internal.realtime.bot.event.add';
    const botEventUpdate = 'refocus.internal.realtime.bot.event.update';

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

    socket.on(botDataAdd, function(data) {
      const eventData = JSON.parse(data);
      const botData = eventData[botDataAdd];
      app.emit('refocus.bot.data', botData);
    });

    socket.on(botDataUpdate, function(data) {
      const eventData = JSON.parse(data);
      const botData = eventData[botDataUpdate];
      app.emit('refocus.bot.data', botData);
    });

    socket.on(botEventAdd, function(data) {
      const eventData = JSON.parse(data);
      const botEvent = eventData[botEventAdd];
      app.emit('refocus.bot.data', botEvent);
    });

    socket.on(botEventUpdate, function(data) {
      const eventData = JSON.parse(data);
      const botEvent = eventData[botEventUpdate];
      app.emit('refocus.bot.data', botEvent);
    });

    socket.on('connect', function() {
       // Connected, let's sign-up for to receive messages for this room
       console.log("socket connected")
    });

    socket.on('disconnect', function() {
       // Connected, let's sign-up for to receive messages for this room
       console.log("socket disconnected")
    });
  } // refocusConnectSocket

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
      genericGet(SERVER+API+ROOMS_ROUTE+'/')
      .then((rooms) => {
        rooms.body.forEach(room => {
          var duration = moment.duration(moment().diff(moment(room.updatedAt))).asSeconds();
          if(duration < 8){
            app.emit('refocus.room.settings', room);
          }
        });
      });
      genericGet(SERVER+API+BOTACTIONS_ROUTE+'/')
      .then((botActions) => {
        botActions.body.forEach(botAction => {
          var duration = moment.duration(moment().diff(moment(botAction.updatedAt))).asSeconds();
          if((!botAction.response) && (duration < 8)){
            app.emit('refocus.bot.actions', botAction);
          }
        });
      });
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
  } // refocusConnectPolling

  return {
    /**
     * Get the current room ID from window
     */
    getRoomId: function getRoomId(){
      return window.location.pathname.split('rooms/').length > 1 ?
        parseInt(window.location.pathname.split('rooms/')[1]) :
        1;
    }, // getRoomId

    /**
     * Find room by id/name
     *
     * @param id {String} - ID of room
     * @returns {Promise} - Room response
     */
    findRoom: function(id){
      return genericGet(SERVER+API+ROOMS_ROUTE+'/'+id);
    }, // findRoom

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
    }, // updateSettings

      /**
     * Find bot by id/name
     *
     * @param id {String} - ID of bot
     * @returns {Promise} - Bot response
     */
    findBot: function(id){
      return genericGet(SERVER+API+BOTS_ROUTE+'/'+id);
    }, // findBot

    /**
     * Find bot action by id/name
     *
     * @param id {String} - ID of bot action
     * @returns {Promise} - Bot Action response
     */
    findBotAction: function(id){
      return genericGet(SERVER+API+BOTACTIONS_ROUTE+'/'+id);
    }, // findBotAction

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
    }, // getBotActions

    /**
     * Access user that is part of the room window
     * user object comes from Refocus view/rooms/index.pug
     */
    getUserName: function(){
      const _user = JSON.parse(user.replace(/&quot;/g, '"'));
      return _user.name;
    }, // getUserName

    getUserId(){
      const _user = JSON.parse(user.replace(/&quot;/g, '"'));
      return _user.id;
    }, // getUserId

    getUserEmail(){
      const _user = JSON.parse(user.replace(/&quot;/g, '"'));
      return _user.email;
    }, // getUserEmail

    /**
     * Create bot action by id/name
     *
     * @param botAction {Object} - botAction object
     * @returns {Promise} - Bot Action response
     */
    createBotAction: function(botAction){
      return genericPost(SERVER+API+BOTACTIONS_ROUTE+'/', botAction);
    }, // createBotAction

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
    }, // respondBotAction

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
    }, // createBotData

    /**
     * Find bot data by id/name
     *
     * @param id {String} - ID of bot data
     * @returns {Promise} - Bot Data response
     */
    findBotData: function(id){
      return genericGet(SERVER+API+BOTDATA_ROUTE+'/'+id);
    }, // findBotData

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
    }, // getBotData

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
    }, // changeBotData

    /**
     * Find events by room
     *
     * @param room {String} - ID of room
     */
    getEvents: function(room){
      return genericGet(SERVER+API+EVENTS_ROUTE+'?roomId='+room);
    }, // getEvents

    /**
     * Create an event
     *
     * @param room {Integer} - Room Id
     * @param msg {String} - Log String
     * @param context {Object} - JSON context
     * @returns {Promise} - Event response
     */
    createEvents: function(room, msg, context){
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
     * @param app {Express} - App stream so we can push events to the server
     */
    refocusConnect: function(app, token){
      if(process.env.USE_POLLING) {
        refocusConnectPolling(app);
      } else {
        refocusConnectSocket(app, token);
      }
    }, // refocusConnect
  };
};