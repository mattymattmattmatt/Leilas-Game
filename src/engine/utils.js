// ============================================================================
//  utils.js — Small, pure functions used across Leila's Game
//  These helpers have **no side-effects** and keep engine code tidy.
// ============================================================================

/* ------------------------------------------------------------------------- */
/*  Math helpers                                                              */
/* ------------------------------------------------------------------------- */
export const clamp = (v, min, max) => (v < min ? min : v > max ? max : v);
export const lerp  = (a, b, t)     => a + (b - a) * t;          // linear-interpolate
export const rand  = (min, max)    => Math.random() * (max - min) + min;
export const randInt = (min, max)  => Math.floor(rand(min, max + 1));
export const rndSign = () => (Math.random() < 0.5 ? -1 : 1);

/* ------------------------------------------------------------------------- */
/*  Array helpers                                                             */
/* ------------------------------------------------------------------------- */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export const pickRandom = arr => arr[Math.floor(Math.random() * arr.length)];

export function weightedRandom(weightedArr) {
  // weightedArr: [{ value:'goblin', weight:10 }, …]
  const total = weightedArr.reduce((sum, o) => sum + o.weight, 0);
  let r = Math.random() * total;
  for (const obj of weightedArr) {
    if ((r -= obj.weight) <= 0) return obj.value;
  }
  return weightedArr[weightedArr.length - 1].value; // fallback
}

/* ------------------------------------------------------------------------- */
/*  Timing helpers                                                            */
/* ------------------------------------------------------------------------- */
export const sleep = ms => new Promise(res => setTimeout(res, ms));

export function debounce(fn, delay = 200) {
  let id;
  return (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit = 100) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/* ------------------------------------------------------------------------- */
/*  Geometry helpers                                                          */
/* ------------------------------------------------------------------------- */
export const degToRad = deg => (deg * Math.PI) / 180;
export const radToDeg = rad => (rad * 180) / Math.PI;

// Checks if point is inside circle — handy for radial pickup effects
export const pointInCircle = (px, py, cx, cy, radius) =>
  (px - cx) ** 2 + (py - cy) ** 2 <= radius ** 2;

/* ------------------------------------------------------------------------- */
/*  Misc                                                                      */
/* ------------------------------------------------------------------------- */
export function uuid() {
  // Quick RFC-4122 v4 compliant ID (browser-safe, short)
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> (c / 4))).toString(16)
  );
}
