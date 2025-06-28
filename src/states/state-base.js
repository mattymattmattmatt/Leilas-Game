// ============================================================================
//  states/state-base.js  —  Minimal abstract base class for game states.
//  Each concrete state should extend this to ensure a consistent interface
//  and to reuse common helpers (fade transitions, global event hooks, etc.).
//
//    import StateBase from './state-base.js';
//    export default class MyState extends StateBase {
//      async onEnter(payload) { /* custom boot logic */ }
//      update(dt)            { /* per‑frame logic   */ }
//      draw()                { /* render to canvas  */ }
//      onExit()              { /* cleanup           */ }
//    }
// ============================================================================

export default class StateBase {
  /**
   * @param {CanvasRenderingContext2D} ctx
   * @param {HTMLCanvasElement}        canvas
   * @param {HTMLVideoElement}         videoEl  – shared video element (may be unused)
   * @param {Function}                 change   – call change(NewState, payload) to switch
   */
  constructor(ctx, canvas, videoEl, change) {
    this.ctx         = ctx;
    this.canvas      = canvas;
    this.videoEl     = videoEl;
    this.changeState = change;

    // Optional fade overlay
    this._fadeAlpha = 0;   // range 0…1 (0 = transparent)
  }

  /* ----------------------------------------------------------------------- */
  /*  Lifecycle stubs (override as needed)                                   */
  /* ----------------------------------------------------------------------- */
  // eslint-disable-next-line no-unused-vars
  async onEnter(payload) {}
  // eslint-disable-next-line no-unused-vars
  update(dt) {}
  draw() {
    // Children call super.draw() to render fade overlay last
    if (this._fadeAlpha > 0) {
      this.ctx.save();
      this.ctx.globalAlpha = this._fadeAlpha;
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.restore();
    }
  }
  onExit() {}

  /* ----------------------------------------------------------------------- */
  /*  Helpers                                                                */
  /* ----------------------------------------------------------------------- */
  /**
   * Smoothly fades the overlay alpha to `target` over `duration` ms.
   * @param {number} target    – 0…1
   * @param {number} duration  – milliseconds
   */
  fadeTo(target = 1, duration = 500) {
    return new Promise(res => {
      const start   = performance.now();
      const init    = this._fadeAlpha;
      const delta   = target - init;
      const step = now => {
        const t = (now - start) / duration;
        if (t >= 1) {
          this._fadeAlpha = target;
          res();
          return;
        }
        this._fadeAlpha = init + delta * t;
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /** Quick helper to clear the entire canvas */
  clear(color = '#000') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }
}
