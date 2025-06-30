// ============================================================================
//  engine/input.js  —  Keyboard + Touch + DeviceOrientation manager
// ============================================================================

class InputManager {
  constructor(canvas = document.getElementById('gameCanvas')) {
    this.canvas = canvas;

    /* ---------------- Public, read-only snapshot ---------------- */
    this.state = {
      left: false, right: false,
      up: false, down: false,
      jump: false, attack: false,
      tiltX: 0, tiltY: 0
    };

    /* ---------------- Keyboard ---------------------------------- */
    const onKey = (e, down) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':  this.state.left  = down; break;
        case 'ArrowRight':
        case 'KeyD':  this.state.right = down; break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space': this.state.up =
                      this.state.jump = down; break;
        case 'ArrowDown':
        case 'KeyS':  this.state.down  = down; break;
        case 'KeyB':  if (down && !this.state.attack) {
                        this.state.attack = true;
                        this._emitAttack();
                      }
                      if (!down) this.state.attack = false;
                      break;
      }
    };
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup',   e => onKey(e, false));

    /* ---------------- Touch ------------------------------------- */
    this.activeTouches = new Set();
    ['touchstart','touchmove'].forEach(evt => {
      canvas.addEventListener(evt, e => {
        e.preventDefault();
        this.activeTouches.clear();
        const rect = canvas.getBoundingClientRect();
        for (const t of e.touches) {
          const x = t.clientX - rect.left;
          const y = t.clientY - rect.top;
          const zone = this._zoneAt(x, y);
          if (zone) this.activeTouches.add(zone);
        }
        this._syncTouches();
      }, { passive:false });
    });
    canvas.addEventListener('touchend',   e => { e.preventDefault(); this._syncTouches(); }, { passive:false });
    canvas.addEventListener('touchcancel',e => { e.preventDefault(); this._syncTouches(); }, { passive:false });

    /* ---------------- Device Orientation ------------------------ */
    window.addEventListener('deviceorientation', e => {
      this.state.tiltX = e.beta  || 0;   // front/back
      this.state.tiltY = e.gamma || 0;   // left/right
    });

    this.scheme = 'land';               // default
  }

  /* ================== External API ============================ */
  setScheme(scheme = 'land') { this.scheme = scheme; }

  onAttack(cb) { this.attackCallback = cb; }

  /* ================== Internal helpers ======================== */
  _emitAttack() { if (typeof this.attackCallback === 'function') this.attackCallback(); }

  _resetDirectional() {
    this.state.left = this.state.right = this.state.up =
    this.state.down = this.state.jump  = false;
  }

  _zoneAt(x, y) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    switch (this.scheme) {
      /* ----- Land: 4-zone layout -------------------------------- */
      case 'land':
        if (x < w * 0.20)  return 'left';
        if (x > w * 0.80)  return 'right';
        if (y > h * 0.80)  return (x < w * 0.50) ? 'jump' : 'attack';
        return null;

      /* ----- Sea: left/right + swim up/down ---------------------- */
      case 'sea':
        if (x < w * 0.20)  return 'left';
        if (x > w * 0.80)  return 'right';
        return (y < h * 0.50) ? 'up' : 'down';

      /* ----- Sky: tilt steer + tap attack ------------------------ */
      case 'sky':
        if (y > h * 0.80 && x > w * 0.50) return 'attack';
        return null;
    }
  }

  _syncTouches() {
    this._resetDirectional();
    this.state.attack = false;

    for (const z of this.activeTouches) {
      switch (z) {
        case 'left':   this.state.left  = true; break;
        case 'right':  this.state.right = true; break;
        case 'jump':
        case 'up':     this.state.up = this.state.jump = true; break;
        case 'down':   this.state.down = true; break;
        case 'attack': this.state.attack = true; break;
      }
    }
    if (this.state.attack) this._emitAttack();
  }
}

/* ===================================================================== */
/* EXPORTS                                                               */
/* ===================================================================== */

/* Singleton instance used everywhere */
const input = new InputManager();

/* Default export so `import input from '../engine/input.js'` works */
export default input;

/* Named export if you ever need the class */
export { InputManager };
