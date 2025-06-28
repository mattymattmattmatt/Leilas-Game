// ============================================================================
//  collision.js  —  tiny 2‑D collision helpers + simple Quadtree for broad phase
//  Works with axis‑aligned bounding boxes (AABB) which cover 95% of 2‑D games.
//  Exports
//    • aabbIntersects(ax, ay, aw, ah, bx, by, bw, bh) → boolean
//    • pointInRect(px, py, rx, ry, rw, rh)            → boolean
//    • clamp(value, min, max)                         → number
//    • Quadtree(bounds, maxObjects = 8, maxLevels = 5, level = 0)
//        ├─ insert(item)  // item must have .x, .y, .width, .height
//        ├─ retrieve(area)→ array of potential collisions
//        └─ clear()       // reset tree
//
//  Tip: Most entities can just use `aabbIntersects` each frame because Leila’s
//       Game rarely spawns > 100 dynamic objects at once. Use Quadtree only if
//       you notice frame drops with lots of coins / bullets on screen.
// ============================================================================

/* ------------------------------------------------------------------------ */
/*  Scalar helpers                                                          */
/* ------------------------------------------------------------------------ */
export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);

/* ------------------------------------------------------------------------ */
/*  AABB tests                                                              */
/* ------------------------------------------------------------------------ */
export function aabbIntersects(ax, ay, aw, ah, bx, by, bw, bh) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function pointInRect(px, py, rx, ry, rw, rh) {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/* ------------------------------------------------------------------------ */
/*  Quadtree (for optional broad‑phase culling)                              */
/* ------------------------------------------------------------------------ */
export class Quadtree {
  constructor(bounds, maxObjects = 8, maxLevels = 5, level = 0) {
    this.bounds      = bounds;         // { x, y, width, height }
    this.maxObjects  = maxObjects;
    this.maxLevels   = maxLevels;
    this.level       = level;
    this.objects     = [];
    this.nodes       = [];
  }

  /* Split current node into 4 subnodes */
  split() {
    const { x, y, width, height } = this.bounds;
    const hw = width  * 0.5;
    const hh = height * 0.5;

    this.nodes[0] = new Quadtree({ x: x + hw, y: y,      width: hw, height: hh }, this.maxObjects, this.maxLevels, this.level + 1); // NE
    this.nodes[1] = new Quadtree({ x: x,      y: y,      width: hw, height: hh }, this.maxObjects, this.maxLevels, this.level + 1); // NW
    this.nodes[2] = new Quadtree({ x: x,      y: y + hh, width: hw, height: hh }, this.maxObjects, this.maxLevels, this.level + 1); // SW
    this.nodes[3] = new Quadtree({ x: x + hw, y: y + hh, width: hw, height: hh }, this.maxObjects, this.maxLevels, this.level + 1); // SE
  }

  /* Determine which node the rect fits into; returns -1 if it straddles. */
  getIndex(rect) {
    const verticalMid   = this.bounds.x + this.bounds.width  * 0.5;
    const horizontalMid = this.bounds.y + this.bounds.height * 0.5;

    const top    = rect.y < horizontalMid && rect.y + rect.height < horizontalMid;
    const bottom = rect.y > horizontalMid;
    const left   = rect.x < verticalMid && rect.x + rect.width < verticalMid;
    const right  = rect.x > verticalMid;

    if (left) {
      if (top)    return 1; // NW
      if (bottom) return 2; // SW
    } else if (right) {
      if (top)    return 0; // NE
      if (bottom) return 3; // SE
    }
    return -1; // straddles multiple nodes
  }

  /* Insert object with x, y, width, height fields */
  insert(obj) {
    if (this.nodes.length) {
      const index = this.getIndex(obj);
      if (index !== -1) {
        this.nodes[index].insert(obj);
        return;
      }
    }

    this.objects.push(obj);

    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (!this.nodes.length) this.split();

      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i]);
        if (index !== -1) {
          this.nodes[index].insert(this.objects.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }

  /* Retrieve array of potential colliders for given rect */
  retrieve(rect, out = []) {
    const index = this.getIndex(rect);
    if (index !== -1 && this.nodes.length) {
      this.nodes[index].retrieve(rect, out);
    }
    out.push(...this.objects);
    return out;
  }

  clear() {
    this.objects.length = 0;
    for (const node of this.nodes) node?.clear();
    this.nodes.length = 0;
  }
}
