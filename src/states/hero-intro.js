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
    this.captionEl = null;
    this._origStyles = null;
  }

  /* ----------------------------------------------------------------------- */
  /*  Life‑cycle                                                              */
  /* ----------------------------------------------------------------------- */
  async onEnter({ character }) {
    this.character = character;

    // Determine video source
    const id = character.id;
    const clipSrc = ASSETS.intros[id] || `assets/intros/char_${id}.mp4`;

    // Prepare & show video element (triple scale)
    this.videoEl.src = clipSrc;
    this.videoEl.style.display = 'block';
    this.videoEl.currentTime = 0;
    this._origStyles = {
      top: this.videoEl.style.top,
      transform: this.videoEl.style.transform,
    };
    this.videoEl.style.top = '50%';
    this.videoEl.style.transform = 'translate(-50%, -50%) scale(3)';

    // Caption below video
    this.captionEl = document.createElement('div');
    this.captionEl.id = 'heroCaption';
    this.captionEl.textContent = `Go! ${character.name}!`;
    document.body.appendChild(this.captionEl);
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
    if (this.captionEl) {
      this.captionEl.remove();
      this.captionEl = null;
    }
    if (this._origStyles) {
      this.videoEl.style.top = this._origStyles.top;
      this.videoEl.style.transform = this._origStyles.transform;
      this._origStyles = null;
    }
  }

  /* ----------------------------------------------------------------------- */
  /*  Helpers                                                                 */
  /* ----------------------------------------------------------------------- */
  _transition() {
    this.changeState(GameplayState, { character: this.character });
  }
}
