// ============================================================================
//  entities/boss.js  —  Multi-phase side-scroll boss
//  Expected manifest:
//
//    const kingCrab = {
//      id: 'king-crab',
//      frames: {
//        idle:   'boss_king-crab_idle.png',
//        walk1:  'boss_king-crab_walk1.png',
//        walk2:  'boss_king-crab_walk2.png',
//        attack1:'boss_king-crab_attack1.png',
//        attack2:'boss_king-crab_attack2.png',
//        hurt:   'boss_king-crab_hurt.png'
//      },
//      stats:  { maxHealth: 20, speed: 55, touchDamage: 2 },
//      ai:     { walkTime: 2.0, attackTime: 1.5 }
//    };
//
//  Put PNGs in  assets/bosses/
//
// ============================================================================

import { aabbIntersects } from '../engine/collision.js';
import { GRAVITY } from '../config.js';
import { spawnParticles } from './particle.js';

export default class Boss {
  /**
   * @param {number}      x
   * @param {number}      y
   * @param {Object}      data        – boss manifest (frames, stats, ai)
   * @param {Array.<Platform>} platforms – ground reference
   */
  constructor(x, y, data, platforms) {
    this.x = x;
    this.y = y;

    this.vx = 0;
    this.vy = 0;

    this.width  = 128;
    this.height = 128;

    /* ------------- Stats & AI params ----------------- */
    this.maxHealth   = data.stats?.maxHealth ?? 10;
    this.health      = this.maxHealth;
    this.speed       = data.stats?.speed ?? 40;
    this.touchDamage = data.stats?.touchDamage ?? 2;

    this.walkTime    = data.ai?.walkTime ?? 2.5;
    this.attackTime  = data.ai?.attackTime ?? 1.8;

    this.state       = 'walk';   // 'walk' → 'attack' → repeat, then 'defeated'
    this.timer       = this.walkTime;

    this.phase       = 1;        // could use for pattern changes later
    this.isDefeated  = false;

    this.onGround    = false;
    this.direction   = -1;       // -1 left, 1 right

    this.platforms   = platforms;

    /* ------------- Invulnerability after hit --------- */
    this.invTimer    = 0;
    this.INV_TIME    = 0.35;

    /* ------------- Animation timers ------------------ */
    this.animTimer   = 0;
    this.walkFrame   = 0;
    this.attackFrame = 0;

    /* ------------- Load frames ----------------------- */
    const base = 'assets/bosses/';
    const f = data.frames;
    const load = name => {
      const img = new Image();
      img.src = base + name;
      return img;
    };

    this.imgIdle    = load(f.idle);
    this.imgWalk1   = load(f.walk1);
    this.imgWalk2   = load(f.walk2);
    this.imgAttack1 = load(f.attack1);
    this.imgAttack2 = load(f.attack2);
    this.imgHurt    = f.hurt ? load(f.hurt) : null;
  }

  /* ----------------------------------------------------------------------- */
  /*  Public API                                                              */
  /* ----------------------------------------------------------------------- */

  /** Decrements health; returns true if boss is defeated */
  takeHit(dmg = 1, knockDir = 1) {
    if (this.invTimer > 0 || this.isDefeated) return false;

    this.health -= dmg;
    this.invTimer = this.INV_TIME;
    this.vx = 220 * knockDir;
    this.vy = -180;

    spawnParticles(
      this.x,
      this.y - this.height / 2,
      16,
      { baseSpeed: 200, life: 0.6, startColor: '#ff6b6b', endColor: 'rgba(255,107,107,0)' }
    );

    if (this.health <= 0) {
      this.isDefeated = true;
      spawnParticles(
        this.x,
        this.y - this.height / 2,
        40,
        { baseSpeed: 260, life: 1.0, startColor: '#ffd86b', endColor: 'rgba(255,216,107,0)' }
      );
    }
    return this.isDefeated;
  }

  /**
   * @param {number}  dt
   * @param {Player}  player
   * @param {function} onPlayerHit – callback(damage) when boss touches player
   */
  update(dt, player, onPlayerHit = null) {
    if (this.isDefeated) return;

    /* -------- Simple finite-state AI -------- */
    this.timer -= dt;

    switch (this.state) {
      /* -- Walk towards player for walkTime -- */
      case 'walk':
        this._walkTowardPlayer(player);
        if (this.timer <= 0) {
          this.state = 'attack';
          this.timer = this.attackTime;
          this.attackFrame = 0;
        }
        break;

      /* -- Attack (charge) for attackTime -- */
      case 'attack':
        this._attackBehaviour(player);
        if (this.timer <= 0) {
          this.state = 'walk';
          this.timer = this.walkTime;
        }
        break;
    }

    /* -------- Gravity & Move -------- */
    this.vy += GRAVITY;
    this.x  += this.vx * dt;
    this.y  += this.vy * dt;

    /* -------- Ground collision -------- */
    this.onGround = false;
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
        if (this.vy >= 0 && this.y - this.vy * dt <= p.y) {
          this.y = p.y;
          this.vy = 0;
          this.onGround = true;
        }
      }
    }

    /* -------- Invulnerability timer -------- */
    if (this.invTimer > 0) this.invTimer -= dt;

    /* -------- Contact damage to player ------ */
    if (onPlayerHit && this.invTimer <= 0) {
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

    /* -------- Animation timing -------- */
    this._updateAnimation(dt);
  }

  /* --------------------------------------------------------------------- */
  /*  Draw                                                                  */
  /* --------------------------------------------------------------------- */
  draw(ctx, cameraX = 0, cameraY = 0) {
    if (this.isDefeated) return;

    ctx.save();
    ctx.translate(this.x - cameraX, this.y - cameraY);

    // Flip to face player direction
    ctx.scale(this.direction, 1);

    // Blink white during hurt invulnerability
    if (this.invTimer > 0 && Math.floor(this.invTimer * 20) % 2 === 0) {
      ctx.globalCompositeOperation = 'lighter';
    }

    ctx.drawImage(
      this._currentFrame(),
      -this.width / 2, -this.height,
      this.width, this.height
    );

    ctx.restore();

    /* -------- Health bar -------- */
    const barW = 140, barH = 12;
    ctx.fillStyle = '#000';
    ctx.fillRect(this.x - barW / 2 - cameraX, this.y - this.height - 26 - cameraY, barW, barH);
    ctx.fillStyle = '#ff4d4d';
    ctx.fillRect(
      this.x - barW / 2 - cameraX,
      this.y - this.height - 26 - cameraY,
      (this.health / this.maxHealth) * barW,
      barH
    );
  }

  /* --------------------------------------------------------------------- */
  /*  Private helpers                                                       */
  /* --------------------------------------------------------------------- */
  _walkTowardPlayer(player) {
    const dist = player.x - this.x;
    this.direction = dist >= 0 ? 1 : -1;
    this.vx = this.speed * this.direction;
  }

  _attackBehaviour(player) {
    // Charge once at start of attack state
    if (this.attackFrame === 0) {
      const dist = player.x - this.x;
      this.direction = dist >= 0 ? 1 : -1;
      this.vx = 320 * this.direction;
    }
  }

  _updateAnimation(dt) {
    this.animTimer += dt;

    if (this.state === 'attack') {
      // two-frame attack flicker
      if (this.animTimer > 0.10) {
        this.animTimer = 0;
        this.attackFrame = this.attackFrame === 1 ? 2 : 1;
      }
    } else if (this.state === 'walk') {
      if (Math.abs(this.vx) > 20 && this.onGround) {
        if (this.animTimer > 0.18) {
          this.animTimer = 0;
          this.walkFrame = this.walkFrame === 1 ? 2 : 1;
        }
      } else {
        this.walkFrame = 0;
      }
    }
  }

  _currentFrame() {
    if (this.invTimer > 0 && this.imgHurt) return this.imgHurt;

    if (this.state === 'attack') {
      return this.attackFrame === 2 && this.imgAttack2.complete
        ? this.imgAttack2
        : this.imgAttack1;
    }
    if (this.state === 'walk') {
      if (this.walkFrame === 1 && this.imgWalk1.complete) return this.imgWalk1;
      if (this.walkFrame === 2 && this.imgWalk2.complete) return this.imgWalk2;
    }
    return this.imgIdle;
  }
}
