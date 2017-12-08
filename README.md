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
* Require the module in the file that you want to use it: const bdk = require('@salesforce/refocus-bdk')(config);
* If this bot is going to be hosted somewhere (eg Heroku), you will need an .npmrc file for authentication. This will be something like ```//registry.npmjs.org/:_authToken=${NPM_TOKEN}```. This means that when Heroku tries to install your modules, it will be able to authenticate correctly and install @salesforce/refocus-bdk.

### Coding Example
```javascript
const bdk = require('@salesforce/refocus-bdk')(config);
bdk.createBotData(roomId, botName, 'timers', JSON.stringify(timers))
```

### Available Functions
* installOrUpdateBot
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
