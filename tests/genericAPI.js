/**
 * Copyright (c) 2ZERORETRY_TIME9, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or
 * https://opensource.org/licenses/BSD-3-Clause
 */
/* todo
 * come up with replacement tests
 */

// const expect = require('chai').expect;
// const rewire = require('rewire');
// const bdkServer = rewire('../refocus-bdk-server.js');

// // Create environment for client code to work
// global.user = '{&quot;email&quot;:&quot;test@test.com&quot;}';
// global.window = { document: { }, location: { href: '' } };
// const bdkClient = rewire('../refocus-bdk-client.js');

// const TOO_MANY_REQUESTS = 429;
// const SUCCESS = 200;
// const ZERO = 0;
// const TWO = 2;
// const FOUR = 4;
// const RETRY_TIME = 1;
// let count = ZERO;

// describe('BDK Client generic API: ', () => {
//   beforeEach(() => {
//     bdkClient.__set__('request', {
//       'get': () => {
//         return ({
//           'set': () => {
//             return ({
//               'end': (input) => {
//                 if (count > ZERO) {
//                   input({}, {
//                     'status': TOO_MANY_REQUESTS,
//                     'headers': {
//                       'Retry-After': RETRY_TIME
//                     }
//                   });
//                 } else {
//                   input({}, {
//                     'status': SUCCESS
//                   });
//                 }
//                 count--;
//               },
//             });
//           },
//         });
//       },
//       'post': () => {
//         return ({
//           'set': () => {
//             return ({
//               'send': () => {
//                 return ({
//                   'end': (input) => {
//                     if (count > ZERO) {
//                       input({}, {
//                         'status': TOO_MANY_REQUESTS,
//                         'headers': {
//                           'Retry-After': RETRY_TIME
//                         }
//                       });
//                     } else {
//                       input({}, {
//                         'status': SUCCESS
//                       });
//                     }
//                     count--;
//                   },
//                 });
//               },
//             });
//           },
//         });
//       },
//       'patch': () => {
//         return ({
//           'set': () => {
//             return ({
//               'send': () => {
//                 return ({
//                   'end': (input) => {
//                     if (count > ZERO) {
//                       input({}, {
//                         'status': TOO_MANY_REQUESTS,
//                         'headers': {
//                           'Retry-After': RETRY_TIME
//                         }
//                       });
//                     } else {
//                       input({}, {
//                         'status': SUCCESS
//                       });
//                     }
//                     count--;
//                   },
//                 });
//               },
//             });
//           },
//         });
//       },
//     });
//   });

//   it('Ok, genericGet no retrys', (done) => {
//     count = ZERO;
//     bdkClient.__get__('genericGet')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Ok, genericGet 2 retrys', (done) => {
//     count = TWO;
//     bdkClient.__get__('genericGet')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Fail, genericGet too many retries', (done) => {
//     count = FOUR;
//     bdkClient.__get__('genericGet')()
//       .then((res) => {
//         expect(res.status).to.equal(TOO_MANY_REQUESTS);
//         done();
//       });
//   });

//   it('Ok, genericPost no retrys', (done) => {
//     count = ZERO;
//     bdkClient.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Ok, genericPost 2 retrys', (done) => {
//     count = TWO;
//     bdkClient.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Fail, genericPost too many retries', (done) => {
//     count = FOUR;
//     bdkClient.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(TOO_MANY_REQUESTS);
//         done();
//       });
//   });

//   it('Ok, genericPatch no retrys', (done) => {
//     count = ZERO;
//     bdkClient.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Ok, genericPatch 2 retrys', (done) => {
//     count = TWO;
//     bdkClient.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Fail, genericPatch too many retries', (done) => {
//     count = FOUR;
//     bdkClient.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(TOO_MANY_REQUESTS);
//         done();
//       });
//   });
// });

// describe('BDK Server generic API: ', () => {
//   beforeEach(() => {
//     bdkServer.__set__('request', {
//       'get': () => {
//         return ({
//           'set': () => {
//             return ({
//               'end': (input) => {
//                 if (count > ZERO) {
//                   input(null, {
//                     'status': TOO_MANY_REQUESTS,
//                     'headers': {
//                       'Retry-After': RETRY_TIME
//                     }
//                   });
//                 } else {
//                   input(null, {
//                     'status': SUCCESS
//                   });
//                 }
//                 count--;
//               },
//             });
//           },
//         });
//       },
//       'post': () => {
//         return ({
//           'set': () => {
//             return ({
//               'send': () => {
//                 return ({
//                   'end': (input) => {
//                     if (count > ZERO) {
//                       input(null, {
//                         'status': TOO_MANY_REQUESTS,
//                         'headers': {
//                           'Retry-After': RETRY_TIME
//                         }
//                       });
//                     } else {
//                       input(null, {
//                         'status': SUCCESS
//                       });
//                     }
//                     count--;
//                   },
//                 });
//               },
//             });
//           },
//         });
//       },
//       'patch': () => {
//         return ({
//           'set': () => {
//             return ({
//               'send': () => {
//                 return ({
//                   'end': (input) => {
//                     if (count > ZERO) {
//                       input(null, {
//                         'status': TOO_MANY_REQUESTS,
//                         'headers': {
//                           'Retry-After': RETRY_TIME
//                         }
//                       });
//                     } else {
//                       input(null, {
//                         'status': SUCCESS
//                       });
//                     }
//                     count--;
//                   },
//                 });
//               },
//             });
//           },
//         });
//       },
//     });
//   });

//   it('Ok, genericGet no retrys', (done) => {
//     count = ZERO;
//     bdkServer.__get__('genericGet')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Ok, genericGet 2 retrys', (done) => {
//     count = TWO;
//     bdkServer.__get__('genericGet')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Fail, genericGet too many retries', (done) => {
//     count = FOUR;
//     bdkServer.__get__('genericGet')()
//       .then((res) => {
//         expect(res.status).to.equal(TOO_MANY_REQUESTS);
//         done();
//       });
//   });

//   it('Ok, genericPost no retrys', (done) => {
//     count = ZERO;
//     bdkServer.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Ok, genericPost 2 retrys', (done) => {
//     count = TWO;
//     bdkServer.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Fail, genericPost too many retries', (done) => {
//     count = FOUR;
//     bdkServer.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(TOO_MANY_REQUESTS);
//         done();
//       });
//   });

//   it('Ok, genericPatch no retrys', (done) => {
//     count = ZERO;
//     bdkServer.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Ok, genericPatch 2 retrys', (done) => {
//     count = TWO;
//     bdkServer.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(SUCCESS);
//         done();
//       });
//   });

//   it('Fail, genericPatch too many retries', (done) => {
//     count = FOUR;
//     bdkServer.__get__('genericPost')()
//       .then((res) => {
//         expect(res.status).to.equal(TOO_MANY_REQUESTS);
//         done();
//       });
//   });
// });
