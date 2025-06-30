// ---------------------------------------------------------------------------
//  data/enemies/bobber.js
//  The “bobber” ground-patrol enemy used in sample Level 01.
//  Put the four PNGs in  assets/enemies/
//
//    enemy_bobber_idle.png
//    enemy_bobber_walk1.png
//    enemy_bobber_walk2.png
//    enemy_bobber_attack.png   ← optional (not used yet)
//
// ---------------------------------------------------------------------------

export default {
  id: 'bobber',

  frames: {
    idle:   'enemy_bobber_idle.png',
    walk1:  'enemy_bobber_walk1.png',
    walk2:  'enemy_bobber_walk2.png',
    attack: 'enemy_bobber_attack.png'   // (leave out or rename if you’ve only drawn three frames)
  },

  stats: {
    speed:       60,   // px per second
    health:       3,
    touchDamage:  1
  }
};
