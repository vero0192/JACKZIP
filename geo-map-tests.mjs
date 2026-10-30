import assert from 'node:assert/strict';
import {validPoint} from './geo-map.js';
assert.ok(validPoint({postalLocation:{latitude:42.73,longitude:-71.32}}));
for(const location of [null,{latitude:null,longitude:null},{latitude:91,longitude:0},{latitude:0,longitude:181},{latitude:'42',longitude:'-71'}])assert.ok(!validPoint({postalLocation:location}));
console.log('Map coordinates: PASS (missing and invalid points are never fabricated)');
