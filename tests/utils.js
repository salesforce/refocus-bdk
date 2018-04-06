/**
 * Copyright (c) 2018, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */

const actions = [
  {
    'name': 'newPost',
    'parameters': [
      {
        'name': 'text',
        'type': 'STRING'
      },
      {
        'name': 'group',
        'type': 'STRING'
      },
      {
        'name': 'isComment',
        'type': 'BOOLEAN'
      },
      {
        'name': 'mentions',
        'type': 'ARRAY'
      },
      {
        'name': 'templateName',
        'type': 'STRING'
      }
    ]
  },
  {
    'name': 'sendEmail',
    'parameters': [
      {
        'name': 'sender',
        'type': 'STRING'
      },
      {
        'name': 'subject',
        'type': 'STRING'
      },
      {
        'name': 'message',
        'type': 'STRING'
      },
      {
        'name': 'to',
        'type': 'ARRAY'
      },
      {
        'name': 'cc',
        'type': 'ARRAY'
      },
      {
        'name': 'bcc',
        'type': 'ARRAY'
      },
      {
        'name': 'templateName',
        'type': 'STRING'
      }
    ]
  }
];

const data = [
  {
    'name': 'commsBotTemplates',
    'type': 'STRING'
  },
  {
    'name': 'commsBotData',
    'type': 'STRING'
  },
  {
    'name': 'commsBotTimers',
    'type': 'STRING'
  },
  {
    'name': 'commsBotEmailHistory',
    'type': 'STRING'
  },
  {
    'name': 'commsBotChatterHistory',
    'type': 'STRING'
  }
];

const settings = [
  {
    'key': 'commsBotTemplates',
    'type': 'ARRAY',
    'helpText': 'This is an array of templates.'
  },
  {
    'key': 'commsBotData',
    'type': 'OBJECT',
    'helpText': 'These are all of the variables to be used for the template.'
  },
  {
    'key': 'commsBotTimers',
    'type': 'ARRAY',
    'helpText': 'This is an array of timer objects. '
  }
];

const bot = {
  name: 'IlikeBurrito',
  url: 'https://buritto-stand.com',
  active: true,
  version: '2.0.0',
  ui: 'tests/bot.zip',
  actions,
  data,
  settings
};

const botWithUI = {
  name: 'ICanDisplayTacos',
  url: 'https://taco-stand-with-ui.com',
  active: true,
  ui: 'tests/bot.zip',
  version: '3.0.0',
  actions,
  data,
  settings
};

module.exports = {
  actions,
  data,
  settings,
  bot,
  botWithUI,
};
