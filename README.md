# refocus-bdk
This is the repository for the refocus-bdk. The bdk (bot developement kit) contains a set of utilities used by Refocus Bots to communicate with [Refocus Rooms](https://github.com/salesforce/refocus).

## Getting Started
These instructions will enable you to have a copy of this project up and running on your local machine for development and testing purposes.

### Prerequisites
* [Node.js](https://nodejs.org/en/) 

### Usage
* When a developer wants to create a bot for IMC V2, they need to be added as a collaborator (read/write) to the @salesforce/refocus-bdk module, because it is a private module. This means that they need to have an account with npm. This can be created [here](https://www.npmjs.com/).
* In the terminal run “npm login”. Once you input your npm credentials, ~/.npmrc will be created. The contents of this file will be something like: //registry.npmjs.org/:_authToken=00000000-0000-0000-0000-000000000000, where the 0's will be replaced by a token. This token is not like a session key and will remain valid until you change your password.
* Copy the .npmrc file into the root directory of your project (.npmrc will be a sibling of the node_modules folder).
* Include the dependency @salesforce/refocus-bdk in your package.json file.
* When npm install is run, it will use this .npmrc file as authentication, to ensure that you have correct permissions to use the @salesforce/refocus-bdk module.
* Require the module in the file that you want to use it: const bdk = require('@salesforce/refocus-bdk')(config);
* If this bot is going to be hosted somewhere (eg Heroku), you should change the contents of the .npmrc file to something like //registry.npmjs.org/:_authToken=${NPM_TOKEN} , and add NPM_TOKEN as an environment variable in Heroku. This means that when Heroku tries to install your modules, it will be able to authenticate correctly and install @salesforce/refocus-bdk.

### Coding Example
```javascript
const bdk = require('@salesforce/refocus-bdk')(config);
bdk.createBotData(roomId, botName, 'timers', JSON.stringify(timers))
```

### Available Functions
* findRoom
* updateSettings
* findBot
* findBotAction
* getBotActions
* createBotAction
* respondBotAction
* createBotData
* findBotData
* getBotData
* changeBotData
* refocusConnectPolling
* refocusConnect

## Contributing
If you have any ideas on how this project could be improved, please feel free. The steps involved are:
* Fork the repo on GitHub.
* Clone this project to your machine.
* Commit changes to your own branch.
* Push your work back up to your fork.
* Submit a Pull Request so we can review it!
