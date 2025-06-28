// ============================================================================
//  states/gameplay.js   —  Runs ONE randomly-chosen level for the given hero
//  Flow:
//    • onEnter({ character })   → picks random JSON from biome folder
//    • Spawns Player, Coins, Enemies; Boss appears after all coins
//    • Handles input scheme switch (land / sea / sky)
//    • Emits "levelComplete" or "playerDefeated" event via changeState()
// ============================================================================

import StateBase      from './state-base.js';

import Player         from '../entities/player.js';
import Enemy          from '../entities/enemy.js';
import Boss           from '../entities/boss.js';
import Coin           from '../entities/coin.js';
import Platform       from '../entities/platform.js';

import enemyTypes     from '../data/enemies/index.js';
import bossTypes      from '../data/bosses/index.js';

import input          from '../engine/input.js';     // singleton InputManager
import { clamp, pickRandom }   from '../engine/utils.js';
import { COINS_PER_LEVEL, BIOMES } from '../config.js';

export default class GameplayState extends StateBase {
  // -----------------------------------------------------------------------
  //  Lifecycle
  // -----------------------------------------------------------------------
  async onEnter(params) {
    this.character = params.character;               // picked in CharacterSelect
    this.biome     = this.character.habitat;         // 'land' | 'sea' | 'sky'

    /* ---------------- Canvas & camera ---------------- */
    this.camX = 0;   this.camY = 0;

    /* ---------------- Entity arrays ------------------ */
    this.platforms = [];
    this.coins     = [];
    this.enemies   = [];
    this.boss      = null;

    /* ---------------- HUD state ---------------------- */
    this.coinsCollected = 0;

    /* ---------------- Input scheme ------------------- */
    input.setScheme(this.biome);

    /* ---------------- Load random level -------------- */
    const levelPath = this._pickRandomLevelPath();
    const levelJson = await (await fetch(levelPath)).json();

    this._buildLevelFromJson(levelJson);

    /* ---------------- Player ------------------------- */
    this.player = new Player(
      levelJson.playerStart.x,
      levelJson.playerStart.y,
      this.character
    );
  }

  // -----------------------------------------------------------------------
  //  Main loop
  // -----------------------------------------------------------------------
  update(dt) {
    /* ----------- Update player ----------- */
    this.player.update(dt, input.state, this.platforms);

    /* ----------- Coins ------------------- */
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i];
      if (c.checkPickup(this.player)) {
        this.coins.splice(i, 1);
        this.coinsCollected++;
      }
    }

    /* ----------- Spawn boss after coins --- */
    if (!this.boss && this.coinsCollected >= COINS_PER_LEVEL) {
      this._spawnBoss();
    }

    /* ----------- Enemies ------------------ */
    this.enemies = this.enemies.filter(e => !e.isDefeated);
    for (const e of this.enemies) {
      e.update(
        dt,
        this.player,
        dmg => this.player.takeHit?.(dmg)          // implement takeHit in Player
      );
    }

    /* ----------- Boss --------------------- */
    if (this.boss && !this.boss.isDefeated) {
      this.boss.update(
        dt,
        this.player,
        dmg => this.player.takeHit?.(dmg)
      );
    }

    /* ----------- Camera follows player ---- */
    this.camX = clamp(
      this.player.x - this.canvas.width / 2,
      0,
      Math.max(0, this.levelWidth - this.canvas.width)
    );
    this.camY = clamp(
      this.player.y - this.canvas.height / 2,
      0,
      Math.max(0, this.levelHeight - this.canvas.height)
    );

    /* ----------- Win / lose check --------- */
    if (this.boss && this.boss.isDefeated) {
      this.changeState('levelComplete', { biome:this.biome });
    }
    if (this.player.isDefeated) {
      this.changeState('gameOver', {});
    }
  }

  // -----------------------------------------------------------------------
  //  Render
  // -----------------------------------------------------------------------
  draw() {
    const ctx = this.ctx;

    /* ----------- Clear ------------ */
    ctx.fillStyle = this._bgColourForBiome();
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.translate(-this.camX, -this.camY);

    /* ----------- Platforms -------- */
    for (const p of this.platforms) p.draw(ctx);

    /* ----------- Coins ------------ */
    for (const c of this.coins) c.draw(ctx);

    /* ----------- Enemies ---------- */
    for (const e of this.enemies) e.draw(ctx);

    /* ----------- Boss ------------- */
    if (this.boss) this.boss.draw(ctx, this.camX, this.camY);

    /* ----------- Player ----------- */
    this.player.draw(ctx);

    ctx.restore();

    /* ----------- HUD -------------- */
    ctx.fillStyle = '#fff';
    ctx.font = '20px Poppins, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Coins: ${this.coinsCollected}/${COINS_PER_LEVEL}`, 12, 26);
  }

  // -----------------------------------------------------------------------
  //  Helpers
  // -----------------------------------------------------------------------
  _pickRandomLevelPath() {
    const id = Math.floor(Math.random() * 10) + 1;      // 1-10
    return `assets/levels/${this.biome}/${String(id).padStart(2, '0')}.json`;
  }

  _buildLevelFromJson(json) {
    /* ----- Platforms ----- */
    this.levelWidth  = 0;
    this.levelHeight = 0;

    for (const p of json.platforms) {
      this.platforms.push(new Platform(p.x, p.y, p.w, p.h, p.type));
      this.levelWidth  = Math.max(this.levelWidth,  p.x + p.w);
      this.levelHeight = Math.max(this.levelHeight, p.y);
    }

    /* ----- Coins --------- */
    for (const c of json.coins) {
      this.coins.push(new Coin(c.x, c.y));
    }

    /* ----- Enemies ------- */
    for (const e of json.enemies) {
      const data = enemyTypes[e.type];
      if (!data) {
        console.warn(`Unknown enemy type: ${e.type}`);
        continue;
      }
      this.enemies.push(new Enemy(e.x, e.y, data, this.platforms));
    }

    /* ----- Boss placeholder (spawn later) ---- */
    this.bossManifest = bossTypes[json.boss.id];
    this.bossSpawnX   = json.boss.x;
    this.bossSpawnY   = json.boss.y;
  }

  _spawnBoss() {
    if (!this.bossManifest) return;
    this.boss = new Boss(
      this.bossSpawnX,
      this.bossSpawnY,
      this.bossManifest,
      this.platforms
    );
  }

  _bgColourForBiome() {
    switch (this.biome) {
      case 'land': return '#4586ff';
      case 'sea':  return '#235dff';
      case 'sky':  return '#9cd2ff';
      default:     return '#000';
    }
  }

  onExit() {
    input.setScheme('land');   // reset to default so menus feel normal
  }
}
