// ============================================================================
//  entities/player.js
//  A frame-driven hero class that supports idle, walk, jump, attack animations.
//  New in v0.3: lives, contact-damage knock-back, invulnerability frames.
// ============================================================================

import { aabbIntersects } from '../engine/collision.js';
import { GRAVITY, JUMP_FORCE, WALK_SPEED } from '../config.js';
import { spawnParticles } from './particle.js';

export default class Player {
  /**
   * @param {number}    x
   * @param {number}    y
   * @param {Character} character  — object from characters/land|sea|sky.js
   */
  constructor(x, y, character) {
    /* ---------------- Position & physics ---------------- */
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;

    this.width  = 64;
    this.height = 64;

    this.onGround = false;
    this.facing   = 1;       // 1 = right, –1 = left

    /* ---------------- Gameplay stats ------------------- */
    this.coins   = 0;
    this.lives   = 3;
    this.isDefeated = false;

    this.invTimer   = 0;     // blink time after taking damage
    this.INV_TIME   = 0.6;

    /* ---------------- Punch state ---------------------- */
    this.isPunching   = false;
    this.punchTimer   = 0;
    this.PUNCH_DURATION = 0.35;

    /* ---------------- Walk animation ------------------- */
    this.walkTimer = 0;
    this.walkFrame = 0;      // 0 = idle, 1 = walk1, 2 = walk2

    /* ---------------- Frame images --------------------- */
    const base = `assets/characters/${character.habitat}/`;
    const fr   = character.frames;
    const load = n => {
      const img = new Image();
      img.src = base + n;
      return img;
    };

    this.imgIdle   = load(fr.idle);
    this.imgWalk1  = load(fr.walk1);
    this.imgWalk2  = load(fr.walk2);
    this.imgJump   = load(fr.jump);
    this.imgAttack = load(fr.attack);
  }

  /* =========================================================================
     Public helpers
     =======================================================================*/
  initiatePunch() {
    if (this.isPunching || this.isDefeated) return;
    this.isPunching = true;
    this.punchTimer = this.PUNCH_DURATION;
  }

  /** Called by enemy / boss via callback */
  takeHit(dmg = 1) {
    if (this.invTimer > 0 || this.isDefeated) return;
    this.lives -= dmg;
    this.invTimer = this.INV_TIME;

    // Knock-back opposite facing
    this.vx = -this.facing * 200;
    this.vy = -180;

    spawnParticles(
      this.x,
      this.y - this.height / 2,
      12,
      { baseSpeed: 160, life: 0.5, startColor: '#ff8080', endColor: 'rgba(255,128,128,0)' }
    );

    if (this.lives <= 0) {
      this.isDefeated = true;
    }
  }

  /* =========================================================================
     Update
     =======================================================================*/
  /**
   * @param {number} dt            — deltaTime in seconds
   * @param {Object} inputState    — from InputManager (left, right, jump, attack)
   * @param {Array.<Platform>} platforms
   */
  update(dt, inputState, platforms) {
    if (this.isDefeated) return;

    /* ----- Horizontal movement ----- */
    if (inputState.left)       this.vx = -WALK_SPEED;
    else if (inputState.right) this.vx =  WALK_SPEED;
    else                       this.vx =  0;

    /* ----- Jump ----- */
    const wantsJump = inputState.up || inputState.jump;
    if (wantsJump && this.onGround) {
      this.vy = -JUMP_FORCE;
      this.onGround = false;
      spawnParticles(
        this.x, this.y,
        10,
        { baseSpeed: 90, life: 0.35, startColor: '#fff', endColor: 'rgba(255,255,255,0)' }
      );
    }

    /* ----- Apply physics ----- */
    this.vy += GRAVITY;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;

    /* ----- Punch timer ----- */
    if (this.isPunching) {
      this.punchTimer -= dt;
      if (this.punchTimer <= 0) this.isPunching = false;
    }

    /* ----- Collision with platforms ----- */
    this.onGround = false;
    for (const p of platforms) {
      if (
        aabbIntersects(
          this.x - this.width / 2,
          this.y - this.height,
          this.width, this.height,
          p.x, p.y, p.width, p.height
        )
      ) {
        // Land from above
        if (this.vy >= 0 && this.y - this.vy * dt <= p.y) {
          this.y = p.y;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }

    /* ----- Facing ----- */
    if (this.vx !== 0) this.facing = this.vx > 0 ? 1 : -1;

    /* ----- Walk animation ----- */
    if (Math.abs(this.vx) > 0.1 && this.onGround) {
      this.walkTimer += dt;
      if (this.walkTimer > 0.15) {
        this.walkTimer = 0;
        this.walkFrame = this.walkFrame === 1 ? 2 : 1;
      }
    } else {
      this.walkFrame = 0;
      this.walkTimer = 0;
    }

    /* ----- Invulnerability timer ----- */
    if (this.invTimer > 0) this.invTimer -= dt;
  }

  /* =========================================================================
     Draw
     =======================================================================*/
  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing, 1);

    // Blink white during invulnerability
    if (this.invTimer > 0 && Math.floor(this.invTimer * 20) % 2 === 0) {
      ctx.globalCompositeOperation = 'lighter';
    }

    ctx.drawImage(
      this._currentImg(),
      -this.width / 2, -this.height,
      this.width, this.height
    );
    ctx.restore();

    /* ---- (Optional) draw lives HUD icon here if you want ---- */
  }

  /* =========================================================================
     Internal helpers
     =======================================================================*/
  _currentImg() {
    if (this.invTimer > 0 && this.imgAttack.complete && this.imgAttack !== undefined) {
      // slight tint could be applied here; using attack frame if punching
    }
    if (this.isPunching && this.imgAttack.complete) return this.imgAttack;
    if (!this.onGround && this.imgJump.complete)    return this.imgJump;
    if (this.walkFrame === 1 && this.imgWalk1.complete) return this.imgWalk1;
    if (this.walkFrame === 2 && this.imgWalk2.complete) return this.imgWalk2;
    return this.imgIdle;
  }
}
