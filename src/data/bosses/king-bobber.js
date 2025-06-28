// ---------------------------------------------------------------------------
//  data/bosses/king-bobber.js
//  Land-boss manifest: King-Bobber -- a hulking version of the bobber enemy.
//
//  Art assets — drop these PNGs in  assets/bosses/
//
//    boss_king-bobber_idle.png
//    boss_king-bobber_walk1.png
//    boss_king-bobber_walk2.png
//    boss_king-bobber_attack1.png
//    boss_king-bobber_attack2.png
//    boss_king-bobber_hurt.png      (optional but recommended)
//
//  Feel free to tweak stats or AI timers.
// ---------------------------------------------------------------------------

export default {
  id: 'king-bobber',

  frames: {
    idle:    'boss_king-bobber_idle.png',
    walk1:   'boss_king-bobber_walk1.png',
    walk2:   'boss_king-bobber_walk2.png',
    attack1: 'boss_king-bobber_attack1.png',
    attack2: 'boss_king-bobber_attack2.png',
    hurt:    'boss_king-bobber_hurt.png'
  },

  stats: {
    maxHealth:   24,   // takes 24 hits
    speed:       55,   // patrol speed (px/s)
    touchDamage:  2    // damage to player on contact
  },

  ai: {
    walkTime:    2.6,  // seconds spent walking before each charge
    attackTime:  1.8   // seconds spent in attack/charge state
  }
};
