# refocus-bdk
This is the repository for the refocus-bdk. The bdk (bot developement kit) contains a set of utilities used by Refocus Bots to communicate with [Refocus Rooms](https://github.com/salesforce/refocus).

## Getting Started
These instructions will enable you to have a copy of this project up and running on your local machine for development and testing purposes.

### Prerequisites
* [Node.js](https://nodejs.org/en/)

### Usage
* When a developer wants to create a bot for IMC V2, they need to be added as a collaborator (read/write) to the @salesforce/refocus-bdk module, because it is a private module. This means that they need to have an account with npm. This can be created [here](https://www.npmjs.com/).
* In the terminal run ```npm login```.
* Include the dependency ```@salesforce/refocus-bdk``` in your package.json file.
* When npm install is run, it will make sure that you have correct permissions to use the @salesforce/refocus-bdk module.
* Require the module in the file that you want to use it: ```const bdk = require('@salesforce/refocus-bdk')(config);```
#### Heroku
* If this bot is going to be hosted somewhere (eg Heroku), you will need an .npmrc file for authentication.
* In the terminal run ```npm login```. Once you input your npm credentials, ```~/.npmrc``` will be created. You will need to change this file so its contents are something like this: ```//registry.npmjs.org/:_authToken=00000000-0000-0000-0000-000000000000```, where the 0's will be replaced by a token. This token is not like a session key and will remain valid until you change your password.
* Copy the .npmrc file into the root directory of your project (.npmrc will be a sibling of the node_modules folder).
* You should change the contents of the .npmrc file to something like: ```//registry.npmjs.org/:_authToken=${NPM_TOKEN}``` and add ```NPM_TOKEN``` as an env var.
* When Heroku tries to install your modules upon deploy, it will be able to authenticate correctly and install @salesforce/refocus-bdk.
* By default this package uses a socket connection to get updates from Refocus. However if desiered, polling can be used to get updates instead by setting an environment variable ```USE_POLLING = true```.

### Env Variables
Note: If you want to test this locally you will need some environment variables:
* ```USE_POLLING``` - If you want polling set this to true, else default to sockets
* ```BOT_LOGGING``` - If you want to enable logging to a log file set this to "file", if you want to set logging to a console log then set this to "console", if you want to have both set this to "both", if you want neither logging set this to "none", defaults to "console"
* ```CONSOLE_LOG_LEVEL``` - Set the level of console out you want to see, defaults to 'info'. All levels include error, warn, info, verbose, debug, silly see [WinstonJS](https://github.com/winstonjs/winston/tree/2.4.0) for more details
* ```FILE_LOG_LEVEL``` - Set the level of logging you want in your log file, defaults to 'verbose'. All levels include error, warn, info, verbose, debug, silly see [WinstonJS](https://github.com/winstonjs/winston/tree/2.4.0) for more details

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
* getEvents
* getAllEvents
* getActiveUsers
* log

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
* 1.6.0 Added Heartbeat function
