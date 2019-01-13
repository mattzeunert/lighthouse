'use strict';

const jsonld = require('jsonld');

jsonld.expand({
  '@context': {
    'image': {
      '@id': '@error',
    },
  },
});

// const expanded = [
//   {
//     '@type': [
//       'http://schema.org/Cat',
//     ],
//     'http://schema.org/items': [
//       {
//         '@value': 'a',
//         '@type': 'http://other.com/sth',
//       },
//       {
//         '@value': 'b',
//       },
//     ],
//   },
// ];

// jsonld.compact(expanded, 'http://schema.org').then(res => {
//   console.log(res);
// })
// ;
