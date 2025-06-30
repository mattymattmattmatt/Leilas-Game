// ============================================================================
//  config.js  —  Centralised constants & tweakables for Leila's Game
//  Import this file wherever you need a shared value. Avoid hard‑coding
//  numbers in multiple places; change it here and every module picks it up.
// ============================================================================

/* -------------------------------------------------------------------------- */
/*  General Game Settings                                                     */
/* -------------------------------------------------------------------------- */
export const GAME_TITLE       = "Leila's Game";
export const VERSION          = 'v0.1.0';
export const DEBUG_TOUCH_ZONES = false;  // set true to render coloured overlays

/* -------------------------------------------------------------------------- */
/*  Physics                                                                   */
/* -------------------------------------------------------------------------- */
export const GRAVITY        = 0.5;   // default gravity (land & sky)
export const WATER_GRAVITY  = 0.18;  // buoyancy effect in sea level
export const MAX_FALL_SPEED = 18;
export const JUMP_FORCE     = 12;    // default jump impulse

/* -------------------------------------------------------------------------- */
/*  Player Movement Speeds                                                    */
/* -------------------------------------------------------------------------- */
export const WALK_SPEED       = 2.2;
export const SPRINT_MULTIPLIER = 1.5;  // not used yet; maybe for power-ups
export const SWIM_SPEED        = 2.0;
export const FLY_SPEED         = 2.5;

/* -------------------------------------------------------------------------- */
/*  Coin & Score                                                              */
/* -------------------------------------------------------------------------- */
export const COINS_PER_LEVEL  = 20;
export const BONUS_PER_COIN   = 10;   // points per coin
export const BONUS_ALL_COINS  = 200;  // extra when level fully cleared

/* -------------------------------------------------------------------------- */
/*  Assets                                                                    */
/* -------------------------------------------------------------------------- */
export const ASSETS = {
  // Sprites (88 × 88 each)
  characters: {
    land: {
      fertle:  'assets/characters/land/char_fertle.webp',
      fygar:   'assets/characters/land/char_fygar.webp',
      // … add 6 more
    },
    sea: {
      // 8 sea characters
    },
    sky: {
      // 8 sky characters
    }
  },
  // 5‑second hero intro clips
  intros: {
    fertle: 'assets/intros/char_fertle.mp4',
    fygar:  'assets/intros/char_fygar.mp4',
    // additional intros can be placed in assets/intros/char_<id>.mp4
  },
  // UI icons
  ui: {
    coin: 'assets/ui/coin.png',
    life: 'assets/ui/life.png'
  },
  // Audio
  audio: {
    jump: 'assets/audio/jump.wav',
    punch: 'assets/audio/punch.wav',
    collect: 'assets/audio/collect-coin.wav',
    over: 'assets/audio/game-over.wav',
    bgm_land: 'assets/audio/bgm_land.mp3',
    bgm_sea:  'assets/audio/bgm_sea.mp3',
    bgm_sky:  'assets/audio/bgm_sky.mp3'
  }
};

/* -------------------------------------------------------------------------- */
/*  Levels                                                                    */
/* -------------------------------------------------------------------------- */
export const LEVEL_COUNTS = {
  land: 10,
  sea:  10,
  sky:  10
};

export const BIOMES = ['land', 'sea', 'sky'];
