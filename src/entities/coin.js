// ============================================================================
//  entities/coin.js  —  Collectible coin worth 1 point / counter increment
//  Features:
//    • Simple spin animation (4 frames in a spritesheet or tint pulsing)
//    • `checkPickup(player)` returns true if player overlaps the coin
// ============================================================================

import { aabbIntersects } from '../engine/collision.js';

// Static sprite (32×32). Replace if you add a spritesheet later.
const COIN_IMG = new Image();
COIN_IMG.src = 'assets/ui/coin.png';

export default class Coin {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width  = 32;
    this.height = 32;

    // Pulse effect
    this.scale = 1;
    this.pulseDir = 1;
  }

  update(dt) {
    // Gentle pulsing
    this.scale += this.pulseDir * dt * 0.8;
    if (this.scale > 1.15) { this.scale = 1.15; this.pulseDir = -1; }
    if (this.scale < 0.85) { this.scale = 0.85; this.pulseDir = 1; }
  }

  /**
   * @param {Player} player
   * @returns {boolean}  true if picked up this frame
   */
  checkPickup(player) {
    if (aabbIntersects(this.x, this.y, this.width, this.height,
                       player.x - player.width/2, player.y - player.height, player.width, player.height)) {
      return true; // GameplayState will remove the coin & increment counter
    }
    return false;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x + this.width/2, this.y + this.height/2);
    ctx.scale(this.scale, this.scale);
    ctx.drawImage(COIN_IMG, -this.width/2, -this.height/2, this.width, this.height);
    ctx.restore();
  }
}
