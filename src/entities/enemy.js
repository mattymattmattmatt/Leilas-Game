// ============================================================================
//  entities/enemy.js  —  Generic side-scroll enemy with idle / walk frames.
//  Frame manifest expected:
//
//    {
//      id: 'snapper',
//      frames: {
//        idle:  'enemy_snapper_idle.png',
//        walk1: 'enemy_snapper_walk1.png',
//        walk2: 'enemy_snapper_walk2.png',
//        attack: 'enemy_snapper_attack.png'   // (optional, not yet used)
//      },
//      stats: { speed: 70, health: 3 }
//    }
//
//  Place images in  assets/enemies/
//
// ============================================================================

import { aabbIntersects } from '../engine/collision.js';
import { GRAVITY } from '../config.js';
import { spawnParticles } from './particle.js';

export default class Enemy {
  /**
   * @param {number}  x           – world X coord (feet)
   * @param {number}  y           – world Y coord (feet)
   * @param {Object}  data        – enemy manifest object (see header)
   * @param {Array.<Platform>} platforms – reference for ground collisions
   */
  constructor(x, y, data, platforms) {
    this.x = x;
    this.y = y;

    this.vx = 0;
    this.vy = 0;

    this.width  = 64;
    this.height = 64;

    /* --------- stats & behaviour --------- */
    this.speed  = data.stats?.speed  ?? 60;
    this.health = data.stats?.health ?? 3;
    this.touchDamage = data.stats?.touchDamage ?? 1;

    this.direction = -1;     // -1 = left, 1 = right
    this.onGround  = false;
    this.isDefeated = false;

    this.invTimer = 0;
    this.INV_TIME = 0.25;    // seconds of invulnerability after hit

    this.walkTimer = 0;
    this.walkFrame = 0;

    this.platforms = platforms;

    /* --------- load frames --------- */
    const base = 'assets/enemies/';
    const f = data.frames;
    const load = name => {
      const img = new Image();
      img.src = base + name;
      return img;
    };
    this.imgIdle  = load(f.idle);
    this.imgWalk1 = load(f.walk1);
    this.imgWalk2 = load(f.walk2);
    this.imgAttack = f.attack ? load(f.attack) : null;
  }

  // -------------------------------------------------------------------------
  //  Public API
  // -------------------------------------------------------------------------

  /** Inflict damage; returns true if defeated */
  takeHit(dmg = 1, knockbackDir = 1) {
    if (this.invTimer > 0 || this.isDefeated) return false;
    this.health -= dmg;
    this.invTimer = this.INV_TIME;
    this.vx = 180 * knockbackDir;
    this.vy = -140;

    spawnParticles(
      this.x,
      this.y - this.height / 2,
      8,
      { baseSpeed: 120, life: 0.5, startColor: '#ff4040', endColor: 'rgba(255,64,64,0)' }
    );

    if (this.health <= 0) {
      this.isDefeated = true;
      spawnParticles(
        this.x,
        this.y - this.height / 2,
        20,
        { baseSpeed: 200, life: 0.8, startColor: '#ffdb4d', endColor: 'rgba(255,219,77,0)' }
      );
    }
    return this.isDefeated;
  }

  /**
   * @param {number} dt
   * @param {Player} player         – to check contact damage (optional)
   * @param {function} onPlayerHit  – callback(damage) when player touched
   */
  update(dt, player = null, onPlayerHit = null) {
    if (this.isDefeated) return;

    /* -------- AI: simple patrol -------- */
    this.vx = this.speed * this.direction;

    /* -------- Physics -------- */
    this.vy += GRAVITY;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;

    /* -------- Ground collisions -------- */
    this.onGround = false;
    let landed = false;

    for (const p of this.platforms) {
      if (
        aabbIntersects(
          this.x - this.width / 2,
          this.y - this.height,
          this.width,
          this.height,
          p.x, p.y, p.width, p.height
        )
      ) {
        // coming down onto platform
        if (this.vy >= 0 && this.y - this.vy * dt <= p.y) {
          this.y = p.y;
          this.vy = 0;
          this.onGround = true;
          landed = true;
        }
      }
    }

    /* -------- Flip at platform edges -------- */
    if (landed) {
      // look 4 px ahead to see if still on ground
      const probeX = this.x + this.direction * (this.width / 2 + 4);
      let onEdge = true;
      for (const p of this.platforms) {
        if (
          probeX >= p.x &&
          probeX <= p.x + p.width &&
          p.y === this.y // same platform height
        ) {
          onEdge = false;
          break;
        }
      }
      if (onEdge) this.direction *= -1;
    }

    /* -------- Walk frame animation -------- */
    if (Math.abs(this.vx) > 0.1 && this.onGround) {
      this.walkTimer += dt;
      if (this.walkTimer > 0.18) {
        this.walkTimer = 0;
        this.walkFrame = this.walkFrame === 1 ? 2 : 1;
      }
    } else {
      this.walkFrame = 0;
      this.walkTimer = 0;
    }

    /* -------- Invulnerability timer -------- */
    if (this.invTimer > 0) this.invTimer -= dt;

    /* -------- Player contact damage -------- */
    if (player && onPlayerHit && this.invTimer <= 0) {
      if (
        aabbIntersects(
          this.x - this.width / 2,
          this.y - this.height,
          this.width,
          this.height,
          player.x - player.width / 2,
          player.y - player.height,
          player.width,
          player.height
        )
      ) {
        onPlayerHit(this.touchDamage, this);
      }
    }
  }

  // -------------------------------------------------------------------------
  //  Render
  // -------------------------------------------------------------------------
  draw(ctx) {
    if (this.isDefeated) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.direction, 1);

    // Blink white when invulnerable
    if (this.invTimer > 0 && Math.floor(this.invTimer * 20) % 2 === 0) {
      ctx.globalCompositeOperation = 'lighter';
    }

    ctx.drawImage(this._currentImg(), -this.width / 2, -this.height, this.width, this.height);
    ctx.restore();
  }

  _currentImg() {
    if (this.walkFrame === 1 && this.imgWalk1.complete) return this.imgWalk1;
    if (this.walkFrame === 2 && this.imgWalk2.complete) return this.imgWalk2;
    return this.imgIdle;
  }
}
