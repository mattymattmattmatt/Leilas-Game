// ============================================================================
//  states/character-select.js  —  Pick one of 24 heroes (8 per biome)
//  UI spec: Two rows × four columns (88×88 sprites). Player taps a slot to
//  select, then hits START. They can switch between Land / Sea / Sky tabs.
//  Once chosen, we transition to HeroIntroState with the character payload.
// ============================================================================

import HeroIntroState from './hero-intro.js';
import landChars      from '../characters/land.js';
import seaChars       from '../characters/sea.js';
import skyChars       from '../characters/sky.js';
import { ASSETS }     from '../config.js';

export default class CharacterSelectState {
  constructor(ctx, canvas, video, changeState) {
    this.ctx         = ctx;
    this.canvas      = canvas;
    this.video       = video;
    this.changeState = changeState;

    this.biomes = ['land', 'sea', 'sky'];
    this.charData = { land: landChars, sea: seaChars, sky: skyChars };
    this.currentBiome = 'land';
    this.selectedChar = null;

    this._buildDOM();
  }

  /* ----------------------------- State API ----------------------------- */
  onEnter(payload) {
    if (payload?.biome && this.biomes.includes(payload.biome)) {
      this.currentBiome = payload.biome;
    }
    this._populateGrid();
  }

  update() {
    /* no-op; UI driven via DOM */
  }

  draw() {
    /* character-select is pure DOM overlay — nothing to paint on canvas */
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  onExit() {
    this.overlay.remove();
  }

  /* ----------------------------- DOM Build ----------------------------- */
  _buildDOM() {
    // Root overlay
    this.overlay = document.createElement('div');
    this.overlay.id = 'characterSelect';

    // --- Biome Tabs ---
    const tabContainer = document.createElement('div');
    tabContainer.style.display = 'flex';
    tabContainer.style.gap = '12px';
    tabContainer.style.marginBottom = '24px';

    this.tabs = {};
    this.biomes.forEach(b => {
      const btn = document.createElement('button');
      btn.textContent = b.toUpperCase();
      btn.style.padding = '0.5rem 1rem';
      btn.style.border = 'none';
      btn.style.borderRadius = '8px';
      btn.style.cursor = 'pointer';
      btn.style.fontWeight = '600';
      btn.style.background = b === this.currentBiome ? 'var(--accent)' : '#555';
      btn.style.color = '#000';
      btn.addEventListener('click', () => {
        this.currentBiome = b;
        this.selectedChar = null;
        this._populateGrid();
        this._updateTabStyles();
        this._updateStartBtn();
      });
      tabContainer.appendChild(btn);
      this.tabs[b] = btn;
    });

    this.overlay.appendChild(tabContainer);

    // --- Grid ---
    this.grid = document.createElement('div');
    this.grid.className = 'char-grid';
    this.overlay.appendChild(this.grid);

    // --- Start Button ---
    this.startBtn = document.createElement('button');
    this.startBtn.id = 'startButton';
    this.startBtn.textContent = 'Start';
    this.startBtn.disabled = true;
    this.startBtn.addEventListener('click', () => {
      if (!this.selectedChar) return;
      this.changeState(HeroIntroState, { character: this.selectedChar });
    });

    this.overlay.appendChild(this.startBtn);

    document.body.appendChild(this.overlay);
  }

  _updateTabStyles() {
    Object.entries(this.tabs).forEach(([b, btn]) => {
      btn.style.background = (b === this.currentBiome) ? 'var(--accent)' : '#555';
    });
  }

  /* --------------------------- Populate Grid --------------------------- */
  _populateGrid() {
    this.grid.innerHTML = '';

    const list = this.charData[this.currentBiome];
    const basePath = `assets/characters/${this.currentBiome}/`;

    list.forEach(char => {
      const slot = document.createElement('div');
      slot.className = 'char-slot';

      const img = document.createElement('img');
      img.src = basePath + char.thumb;
      img.alt = char.name;
      slot.appendChild(img);

      slot.addEventListener('click', () => {
        // clear previous selection UI
        this.grid.querySelectorAll('.char-slot').forEach(s => s.classList.remove('selected'));
        slot.classList.add('selected');
        this.selectedChar = char;
        this._updateStartBtn();
      });

      this.grid.appendChild(slot);
    });
  }

  _updateStartBtn() {
    this.startBtn.disabled = !this.selectedChar;
  }
}