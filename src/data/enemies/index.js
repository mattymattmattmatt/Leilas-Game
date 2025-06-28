// ---------------------------------------------------------------------------
//  data/enemies/index.js
//  Master lookup table for every enemy type.
//
//  Import each new enemy file and export it by its id so GameplayState
//  can do:  const data = enemyTypes[e.type];
// ---------------------------------------------------------------------------

import bobber from './bobber.js';

export default {
  bobber
};
