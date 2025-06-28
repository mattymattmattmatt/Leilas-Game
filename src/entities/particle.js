// ============================================================================
//  entities/particle.js  —  Lightweight particle class for eye‑candy effects
//  Usage examples (in gameplay or entity code):
//      import { spawnParticles, updateParticles, drawParticles } from
//        '../entities/particle.js';
//
//      // On coin pickup:
//      spawnParticles(player.x, player.y - 32, 10, {
//        baseSpeed:   80,
//        spread:      Math.PI,
//        life:        0.5,
//        startSize:   6,
//        endSize:     0,
//        startColor:  'rgba(255, 215, 0, 1)',  // gold
//        endColor:    'rgba(255, 215, 0, 0)'
//      });
//
//  In gameplay loop each frame:
//      updateParticles(dt);
//      drawParticles(ctx);
//
//  No class‑based manager is needed; the module keeps an internal array.
// ============================================================================

import { rand, randInt, lerp } from '../engine/utils.js';

const particles = []; // internal pool

export function spawnParticles(x, y, count = 8, opts = {}) {
  const {
    baseSpeed   = 100,
    spread      = Math.PI * 2,   // full circle
    life        = 0.6,           // seconds
    startSize   = 4,
    endSize     = 0,
    startColor  = 'rgba(255,255,255,1)',
    endColor    = 'rgba(255,255,255,0)'
  } = opts;

  for (let i = 0; i < count; i++) {
    const angle = rand(-spread / 2, spread / 2);
    const speed = baseSpeed * rand(0.6, 1.2);
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      age: 0,
      life,
      startSize,
      endSize,
      startRGBA: parseRGBA(startColor),
      endRGBA:   parseRGBA(endColor)
    });
  }
}

export function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.age += dt;
    if (p.age >= p.life) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Simple air drag
    p.vx *= 0.98;
    p.vy *= 0.98 + 40 * dt; // gravity-like drift
  }
}

export function drawParticles(ctx) {
  for (const p of particles) {
    const t = p.age / p.life;
    const size = lerp(p.startSize, p.endSize, t);
    const r = lerp(p.startRGBA.r, p.endRGBA.r, t);
    const g = lerp(p.startRGBA.g, p.endRGBA.g, t);
    const b = lerp(p.startRGBA.b, p.endRGBA.b, t);
    const a = lerp(p.startRGBA.a, p.endRGBA.a, t);
    ctx.fillStyle = `rgba(${r},${g},${b},${a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

/* ------------------------------------------------------------------------- */
/*  Helper: convert CSS rgba/hex → object                                     */
/* ------------------------------------------------------------------------- */
function parseRGBA(str) {
  if (str.startsWith('#')) {
    // hex: #rrggbb or #rgb
    const c = str.length === 7 ? str.slice(1) : str.slice(1).split('').map(x=>x+x).join('');
    const num = parseInt(c, 16);
    return { r:(num>>16)&255, g:(num>>8)&255, b:num&255, a:1 };
  }
  // assume rgba(r,g,b,a)
  const m = str.match(/rgba?\(([^)]+)\)/i);
  if (!m) return { r:255, g:255, b:255, a:1 };
  const parts = m[1].split(',').map(Number);
  return { r:parts[0]||0, g:parts[1]||0, b:parts[2]||0, a:parts[3]===undefined?1:parts[3] };
}
