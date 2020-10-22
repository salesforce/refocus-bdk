[![Build Status](https://travis-ci.org/salesforce/refocus-bdk.svg?branch=master)](https://travis-ci.org/salesforce/refocus-bdk)

# refocus-bdk
This is the repository for the refocus-bdk. The bdk (bot development kit) contains a set of utilities used by Refocus Bots to communicate with [Refocus Rooms](https://github.com/salesforce/refocus).

## Getting Started
These instructions will enable you to have a copy of this project up and running on your local machine for development and testing purposes.

### Prerequisites
* [Node.js](https://nodejs.org/en/)

### Env Variables
Note: If you want to test this locally you will need some environment variables:
* ```USE_POLLING``` - If you want polling set this to true, else default to sockets
* ```BOT_LOGGING``` - If you want to enable logging to a log file set this to "file", if you want to set logging to a console log then set this to "console", if you want to have both set this to "both", if you want neither logging set this to "none", defaults to "console"
* ```CONSOLE_LOG_LEVEL``` - Set the level of console out you want to see, defaults to 'info'. All levels include error, warn, info, verbose, debug, silly see [WinstonJS](https://github.com/winstonjs/winston/tree/2.4.0) for more details
* ```FILE_LOG_LEVEL``` - Set the level of logging you want in your log file, defaults to 'verbose'. All levels include error, warn, info, verbose, debug, silly see [WinstonJS](https://github.com/winstonjs/winston/tree/2.4.0) for more details
* ```HEARTBEAT_OFF``` - Turns off bot heartbeat to refocus
* ```HEARTBEAT_TIMER``` - how often in milliseconds the heartbeat is sent with a minimum of 1 minute


### Coding Example
```javascript
const bdk = require('@salesforce/refocus-bdk')(config);
bdk.createBotData(roomId, botName, 'timers', JSON.stringify(timers))
```

### Available Functions
* installOrUpdateBot
* getRoomId
* findRoom
* updateSettings
* findBot
* findBotAction
* getBotActions
* createBotAction
* respondBotAction
* respondBotActionNoLog
* createBotData
* findBotData
* getBotData
* changeBotData
* upsertBotData
* refocusConnectPolling
* refocusConnect
* getUserName
* getUserId
* getUserEmail
* getUserFullName
* createEvents
* bulkCreateEvents
* getEvents
* getAllEvents
* getActiveUsers
* log
* updateExternalId
* updateRoomName
* getActiveRooms
* getOrInitializeBotData
* getRoomTypes
* isBotInstalledInRoom

## Contributing
If you have any ideas on how this project could be improved, please feel free. The steps involved are:
* Fork the repo on GitHub.
* Clone this project to your machine.
* Commit changes to your own branch.
* Push your work back up to your fork.
* Submit a Pull Request so we can review it!

## Release History

Follows [semantic versioning](https://docs.npmjs.com/getting-started/semantic-versioning#semver-for-publishers)

* 1.0.1 Basic utilities, polling for actions, data and settings, basic support for sockets - actions only.
* 1.0.2 Bot auto-installation (or update) functionality.
* 1.0.3 Full sockets support. Toggle switch between polling and sockets.
* 1.1.1 Client & server side code separation. Basic proxy support for REST API requests via superagent.
* 1.1.2 Fix minor bug of missing dependencies and adds get user information functions added .tgz files to git ignore
* 1.2.0 Added Events routes and get room ID
* 1.2.1 Create event log with respondBotAction
* 1.2.2 Automatically try add user Id to action and events
* 1.3.0 Add active users function
* 1.3.1 Fix for TypeError: this.getUserId is not a function
* 1.3.2 Limit polling to be bot specific
* 1.3.3 Polling Bug Fix
* 1.3.4 Removed unused polling in backend
* 1.3.5 Polling only for active Bot Actions
* 1.4.0 Add WinstonJS logs and custom logs for client side
* 1.4.1 Support a new URL parameter to enable logging `{url}?log={logLevel}`
* 1.4.2 Various level logging for requests and linting
* 1.4.3 Linting check on pre-commit hook
* 1.4.4 Using upsert route for Bot Data
* 1.4.5 Fixed routes with string literals
* 1.4.6 `version` field support
* 1.4.7 User fullName support
* 1.5.0 Unit tests for installBot function. Pre-commit and pre-push hooks for linter and tests
* 1.5.1 Update Bot Action polling to have a timeout
* 1.5.2 Bug fixes
* 1.5.3 Events have user attached to their context
* 1.5.4 Get all events
* 1.5.5 Duplicate events created
* 1.5.6 Fix missing tokens
* 1.5.7 Added Get Users Route
* 1.5.8 Default full name back to user email if no full name exists
* 1.5.9 botAction tests
* 1.5.10 botData functions allow Object as a param and object is escaped before creating/patching
* 1.5.11 Fix apostrophe issue
* 1.5.12 Update ExternalId field
* 1.6.0 Added Heartbeat function
* 1.6.1 Can pass any data type into create / update botData
* 1.6.2 Fix Upsert Bug
* 1.6.3 Sending displayName on install/update
* 1.6.4 Update room name
* 1.6.5 Only log upsert error if there is an error.
* 1.6.6 Can filter Events by type.
* 1.6.7 Fix getBotData to not return all room data.
* 1.6.8 Get a list of all active rooms.
* 1.6.9 On client side, use window location for server url.
* 1.6.10 Send ownerUrl and helpUrl on install / update.
* 1.6.11 Made changes for new token workflow behind feature flag/backwards compatible.
* 1.6.12 Added bulkCreateEvents function.
* 1.6.13 Socket connection behind proxy.
* 1.6.14 Add the getOrInitializeBotData function
* 1.6.15 Fix bug with token workflow.
* 1.6.16 Retry if API limit has been reached.
* 1.6.17 getRoomTypes function.
* 1.6.18 Return reject bug.
* 1.6.19 Added log automatically to event.
* 1.6.20 Added botname from config to event.
* 1.6.21 Emit event for new room created.
* 1.6.22 Remove NEW_TOKEN_WORKFLOW toggle.
* 1.7.0 Pull out generic functions and fix tests
* 1.7.1 Fix bug with generic function.
* 1.8.0 Adding sorted by in get events and adding deactivate room
* 1.9.0  Added ability to connect to realtime app.
* 1.9.1  Added botId to clientside events.
* 1.9.2 Added logic to reconnect when refocus terminates websocket connection
* 1.9.3 Added function isBotInstalledInRoom.
* 1.9.4 Added function getRoomTypeById.
* 1.9.5 Added function getRoomById, removed getRoomTypeById.
* 1.10.0 Added optional support for multiple instances of bots (requires redis instance).
* 1.10.1 Added password option to cache initialisation for authentication.
* 1.10.2 Fixed bug in cache checking, when cache is not enabled.
* 1.10.3 Changed redis cache settings from host and port to url.
* 1.11.0 added method for getting and parsing botdata
* 1.11.1 added method for getting and parsing botdata to server.

