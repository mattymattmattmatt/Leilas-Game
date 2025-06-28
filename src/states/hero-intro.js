// ============================================================================
//  states/hero-intro.js  —  5‑second animated splash for the chosen character
//  • Plays a full‑screen <video> (pre‑existing element passed from main.js)
//  • After 5 s (or when video ends), transitions to GameplayState.
// ============================================================================

import GameplayState  from './gameplay.js';
import { ASSETS }     from '../config.js';
import { sleep }      from '../engine/utils.js';

export default class HeroIntroState {
  constructor(ctx, canvas, videoEl, changeState) {
    this.ctx         = ctx;
    this.canvas      = canvas;
    this.videoEl     = videoEl;
    this.changeState = changeState;

    this.timerId = null; // so we can cancel onExit if needed
  }

  /* ----------------------------------------------------------------------- */
  /*  Life‑cycle                                                              */
  /* ----------------------------------------------------------------------- */
  async onEnter({ character }) {
    this.character = character;

    // Determine video source
    const clipSrc = ASSETS.intros[character.id] || `assets/intros/char_${character.id}.mp4`;

    // Prepare & show video element
    this.videoEl.src = clipSrc;
    this.videoEl.style.display = 'block';
    this.videoEl.currentTime = 0;
    await this.videoEl.play().catch(() => {/* autoplay might fail on desktop */});

    // Fallback end handler if video shorter than 5 s
    this._onEnded = () => this._transition();
    this.videoEl.addEventListener('ended', this._onEnded);

    // Hard cutoff in case video is longer than 5 s
    this.timerId = setTimeout(() => this._transition(), 5000);
  }

  update() {/* nothing to update */}
  draw()   {/* clear canvas while video shows */
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  onExit() {
    clearTimeout(this.timerId);
    this.videoEl.pause();
    this.videoEl.style.display = 'none';
    this.videoEl.removeEventListener('ended', this._onEnded);
  }

  /* ----------------------------------------------------------------------- */
  /*  Helpers                                                                 */
  /* ----------------------------------------------------------------------- */
  _transition() {
    this.changeState(GameplayState, { character: this.character });
  }
}
