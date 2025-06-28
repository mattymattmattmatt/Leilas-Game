// ============================================================================
//  input.js  —  Keyboard + Touch + (optional) DeviceOrientation manager
// ----------------------------------------------------------------------------
//  • Exports a single class `InputManager` which normalises the control state.
//  • Handles three schemes:   "land", "sea", "sky"  (can extend later).
//  • Consumers call:
//        const input = new InputManager(canvas);
//        input.setScheme('land');               // at level start
//        const keys = input.state;              // each frame (read‑only!)
// ============================================================================

export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;

    // Public, READ‑ONLY snapshot — mutate via internal helpers only
    this.state = {
      left:   false,
      right:  false,
      up:     false,   // generic up (jump or swim‑up)
      down:   false,   // swim‑down (sea) or dive (sky)
      jump:   false,   // alias for up in many levels
      attack: false,

      // raw sensor data (sky level)
      tiltX:  0, // beta  (front/back)
      tiltY:  0  // gamma (left/right)
    };

    /* --------------------- Keyboard --------------------- */
    const onKey = (e, down) => {
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA': this.state.left  = down; break;
        case 'ArrowRight':
        case 'KeyD': this.state.right = down; break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space': this.state.up   = this.state.jump = down; break;
        case 'ArrowDown':
        case 'KeyS': this.state.down  = down; break;
        case 'KeyB': if (down && !this.state.attack) {
                       this.state.attack = true;
                       this._emitAttack();
                     }
                     if (!down) this.state.attack = false;
                     break;
      }
    };
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup',   e => onKey(e, false));

    /* --------------------- Touch ------------------------ */
    this.activeTouches = new Set();
    ['touchstart','touchmove'].forEach(evt => {
      canvas.addEventListener(evt, e => {
        e.preventDefault();
        this.activeTouches.clear();
        for (const t of e.touches) {
          const r = canvas.getBoundingClientRect();
          const x = t.clientX - r.left;
          const y = t.clientY - r.top;
          const zone = this._zoneAt(x, y);
          if (zone) this.activeTouches.add(zone);
        }
        this._syncTouches();
      }, { passive:false });
    });
    canvas.addEventListener('touchend',   e => { e.preventDefault(); this._syncTouches(); }, { passive:false });
    canvas.addEventListener('touchcancel',e => { e.preventDefault(); this._syncTouches(); }, { passive:false });

    /* ----------------  Device Orientation --------------- */
    window.addEventListener('deviceorientation', e => {
      // beta (x) front/back, gamma (y) left/right
      this.state.tiltX = e.beta  || 0;
      this.state.tiltY = e.gamma || 0;
    });

    this.scheme = 'land'; // default until setScheme() called
  }

  /* ------------------------------------------------------ */
  /*  External API                                          */
  /* ------------------------------------------------------ */
  setScheme(scheme = 'land') {
    this.scheme = scheme;
  }

  // For button‑press sounds or punch animation triggers
  onAttack(cb) { this.attackCallback = cb; }

  /* ------------------------------------------------------ */
  /*  Internal helpers                                      */
  /* ------------------------------------------------------ */
  _emitAttack() {
    if (typeof this.attackCallback === 'function') this.attackCallback();
  }

  _resetDirectional() {
    this.state.left = this.state.right = this.state.up = this.state.down = this.state.jump = false;
  }

  _zoneAt(x, y) {
    const w = this.canvas.width;
    const h = this.canvas.height;

    switch (this.scheme) {
      /* ---------------- Land: 4 coloured quadrants ---------------- */
      case 'land': {
        if (x < w * 0.20)  return 'left';
        if (x > w * 0.80)  return 'right';
        if (y > h * 0.80)  return (x < w * 0.50) ? 'jump' : 'attack';
        return null;
      }

      /* ---------------- Sea: left/right + upper/lower swim -------- */
      case 'sea': {
        if (x < w * 0.20)  return 'left';
        if (x > w * 0.80)  return 'right';
        const halfH = h * 0.50;
        if (y < halfH) return 'up';        // tap top half to swim up
        if (y >= halfH) return 'down';     // bottom half swim down
        return null;
      }

      /* ---------------- Sky: simple tilt & tap‑attack ------------- */
      case 'sky': {
        // No directional zones; player tilts to steer.
        if (y > h * 0.80 && x > w * 0.50) return 'attack';
        return null;
      }
    }
  }

  _syncTouches() {
    // Clear directional flags each call
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
