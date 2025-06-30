// ============================================================================
//  main.js  —  ENTRY POINT & STATE MANAGER
// ----------------------------------------------------------------------------
//  • Boots the canvas & global resize.
//  • Runs a simple finite‑state‑machine (character‑select → hero‑intro → level).
//  • Passes common objects (ctx, canvas, video) into each state instance.
//  • Uses requestAnimationFrame for the master game loop.
//
//  Expected State interface:
//    constructor(ctx, canvas, video, changeState)
//    onEnter(payload)   // optional data from previous state
//    update(dt)
//    draw()
//    onExit()          // optional cleanup
// ============================================================================

import IntroStoryState   from './states/intro-story.js';
import CharacterSelectState from './states/character-select.js';
import HeroIntroState       from './states/hero-intro.js';
import GameplayState        from './states/gameplay.js';

// ---------------------------- Canvas & Video -------------------------------
const canvas = document.getElementById('gameCanvas');
const ctx    = canvas.getContext('2d');

const introVideo = document.getElementById('introVideo');
introVideo.style.display = 'none'; // hidden until HeroIntroState uses it
introVideo.playsInline = true;     // iOS mobile requirement
introVideo.muted = true;           // auto‑play without user gesture

let GAME_WIDTH  = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;

function resizeCanvas() {
  // Force landscape: widest dimension → width
  GAME_WIDTH  = Math.max(window.innerWidth,  window.innerHeight);
  GAME_HEIGHT = Math.min(window.innerWidth,  window.innerHeight);
  canvas.width  = GAME_WIDTH;
  canvas.height = GAME_HEIGHT;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();
canvas.style.touchAction = 'none';           // disable pinch‑zoom / scroll

// ---------------------------- State Machine --------------------------------
let currentState = null;
let lastTime = performance.now();

function changeState(StateClass, payload = null) {
  if (currentState && currentState.onExit) currentState.onExit();
  currentState = new StateClass(ctx, canvas, introVideo, changeState);
  if (currentState.onEnter) currentState.onEnter(payload);
}

// Initial boot → Intro Screen
changeState(IntroStoryState);   // <-- boot story first

// ---------------------------- Main Loop ------------------------------------
function gameLoop(time) {
  const dt = (time - lastTime) / 1000; // seconds
  lastTime = time;

  // Guard against long tab‑switch pauses
  const cappedDt = Math.min(dt, 0.05);

  if (currentState) {
    currentState.update(cappedDt);
    currentState.draw();
  }

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

// ---------------------------- Dev Helpers ----------------------------------
// Press "P" to pause the RAF loop (handy while debugging)
let gamePaused = false;
window.addEventListener('keydown', e => {
  if (e.code === 'KeyP') {
    gamePaused = !gamePaused;
    if (!gamePaused) {
      lastTime = performance.now();
      requestAnimationFrame(gameLoop);
    }
  }
});
