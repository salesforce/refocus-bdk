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
* createEvents
* getEvents
* getActiveUsers

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