// ---------------------------------------------------------------------------
//  data/bosses/index.js
//  Central registry for boss look-ups.
//  Add every new boss here so GameplayState can do:
//
//     const bData = bossTypes[levelJson.boss.id];
// ---------------------------------------------------------------------------

import kingBobber from './king-bobber.js';

export default {
  'king-bobber': kingBobber
};
