// ============================================================================
//  entities/platform.js  —  Static, axis‑aligned rectangle the player/enemies
//  can stand on. Keeps things dead‑simple: no slopes, no one‑way collisions.
//
//  Construction:   new Platform(x, y, width, height, type = 'ground')
//  • x, y       : left‑top world coordinates (y points downward)
//  • width      : pixels
//  • height     : pixels (for thin ledges, use 16‑32 px; thick ground 64+)
//  • type       : optional string for different sprites ("ground", "ice", …)
//
//  Public fields:  x, y, width, height, type
//  Public methods: draw(ctx)
// ============================================================================

export default class Platform {
  constructor(x, y, width, height, type = 'ground') {
    this.x = x;
    this.y = y;
    this.width  = width;
    this.height = height;
    this.type   = type;

    /* Attempt to load a biome/tile sprite. Falls back to coloured rect. */
    this._img = new Image();
    this._imgLoaded = false;
    this._img.src = `assets/level-tiles/${type}.png`;
    this._img.onload = () => (this._imgLoaded = true);
  }

  /**
   * Draws the platform. Uses a repeating texture if the sprite is loaded;
   * otherwise fills with a placeholder colour.
   */
  draw(ctx) {
    if (this._imgLoaded) {
      // Tile the image across the platform width & height
      const pattern = ctx.createPattern(this._img, 'repeat');
      ctx.fillStyle = pattern;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    } else {
      // Placeholder: greys for different types
      const colours = {
        ground : '#654321',
        ice    : '#66ccff',
        sky    : '#bbbbbb',
        water  : '#004488'
      };
      ctx.fillStyle = colours[this.type] || '#777';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }
}
