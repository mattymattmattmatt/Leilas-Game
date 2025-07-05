// ============================================================================
//  states/intro-story.js  –  Full-screen story intro with looping video,
//  tap-to-advance text, and a “Start Adventure” button.
// ============================================================================

import StateBase from './state-base.js';

export default class IntroStoryState extends StateBase {
  async onEnter(params) {
    /* ---------- Assets ---------- */
    this.bgImg   = new Image();
    this.bgImg.src = 'assets/backgrounds/intro_bg.png';  // add this file
    this.videoEl = document.getElementById('introVideo');
    this.videoEl.src = 'assets/video/king_loop.mp4';      // add this file
    this.videoEl.loop = true;                             // keep playing

    // show intro elements
    this.videoEl.style.display = 'block';
    this.canvas.style.backgroundImage = "url('assets/backgrounds/intro_bg.png')";
    this.canvas.style.backgroundSize = 'cover';

    await this.videoEl.play().catch(()=>{});              // autoplay muted

    /* ---------- Text pages ------ */
    this.pages = STORY_PAGES;    // imported below
    this.pageIndex = 0;

    /* ---------- DOM overlay ----- */
    this.panel = document.createElement('div');
    this.panel.id = 'storyPanel';
    this.panel.innerHTML = `
      <p id="storyText"></p>
      <button id="storyNext">▼</button>
    `;
    document.body.appendChild(this.panel);

    this.textEl = document.getElementById('storyText');
    this.nextBtn = document.getElementById('storyNext');
    this._showPage(0);

   this.onClick = () => {
      if (!document.fullscreenElement) {
        const target = document.documentElement;
        if (target.requestFullscreen) {
          target.requestFullscreen()
            .then(() => {
              if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('landscape').catch(() => {});
              }
            })
            .catch(() => {});
        }
      }
      if (this.pageIndex < this.pages.length - 1) {
        this._showPage(++this.pageIndex);
      } else {
        this._finish();
      }
    };
    this.nextBtn.addEventListener('click', this.onClick);
  }

  /* No update/draw needed – DOM handles visuals */

  _showPage(i) {
    this.textEl.textContent = this.pages[i];
    if (i === this.pages.length - 1) {
      this.nextBtn.textContent = 'START ADVENTURE';
    }
  }

  _finish() {
    /* clean DOM */
    this.videoEl.pause();
    this.videoEl.loop = false;
    this.videoEl.style.display = 'none';
    this.canvas.style.backgroundImage = 'none';
    this.canvas.style.backgroundSize = '';
    this.nextBtn.removeEventListener('click', this.onClick);
    document.body.removeChild(this.panel);

    /* hand off to character select */
    this.changeState('characterSelect', {});
  }

  onExit() {
    /* safety: ensure video hidden */
    this.videoEl.pause();
    this.videoEl.loop = false;
    this.videoEl.style.display = 'none';
    this.canvas.style.backgroundImage = 'none';
    this.canvas.style.backgroundSize = '';
  }
}

/* ------------------------------------------------------------------------- */
/*  500-word story split into readable pages                                  */
/* ------------------------------------------------------------------------- */
const STORY_PAGES = [
`Greetings, brave traveller! I am King Morrel the Kindly, sovereign ruler of the Verdant Realm and guardian of its shimmering vaults. Until last night our kingdom flourished; our treasuries sparkled with golden Crowns, the very coins that keep villages mended, scholars funded and fields sown.`, 

`But under the cloak of moonless skies, a cabal of master thieves struck from three fronts. From the rolling plains they came on sand-painted steeds; from the fathomless coral trenches they swam with silent fins; and from the clouds themselves they swooped like shadows on silver wings.`, 

`Led by the monstrous triad of bosses—King-Bobber of the Badlands, the Abyssal Marauder of the Siren Seas and the Tempest Seraph of the Shattered Sky—they stole EVERY Crown, scattering them across thirty secret arenas.`, 

`Without those Crowns our granaries will empty, our healers will falter, and the joy of festival drums will vanish. Already the people barter with sorrow instead of song.`, 

`The royal guard has searched, but the thieves hid the coins behind puzzles, perilous ledges and armies of hench-creatures. We need a hero nimble of foot, steadfast in heart and unburdened by fear—**we need you**.`, 

`Choose your champion from the finest fighters of land, sea and sky. Each wields unique gifts suited to their realm: earth-born resilience, tide-woven agility or storm-kissed speed. When twenty Crowns of a stage are reclaimed, its lurking boss will reveal himself. Defeat him to secure the vault key and press onward.`, 

`Our sages fashioned spell-bound panels across the realm. Tap them to unfurl new lines of my tale, and when your resolve is set, strike the emblem below to begin your quest.`, 

`May the winds guide your strikes, the tides buoy your spirit, and the soil remember each courageous footstep. Return with the Crowns, restore hope to my people, and the bards will carve your legend in crystal for all ages to see.`
];
