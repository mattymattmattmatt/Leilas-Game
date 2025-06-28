// ============================================================================
//  asset-loader.js  —  Promise‑based loader for images, audio and video.
//  Usage examples:
//    import {
//      loadImageMap,
//      loadAudioMap,
//      loadVideoMap,
//      preloadBundle
//    } from '../engine/asset-loader.js';
//
//    const images = await loadImageMap({
//      playerIdle: 'assets/characters/land/hero.webp',
//      coin:       'assets/ui/coin.png'
//    });
//
//    const sounds = await loadAudioMap({
//      jump: 'assets/audio/jump.wav',
//      bgm:  'assets/audio/bgm_land.mp3'
//    }, { loopKeys:['bgm'], volume:0.5 });
//
//    // or one‑shot preload:
//    const { images, audios, videos } = await preloadBundle({ images:{...}, audios:{...} });
// ============================================================================

/* ------------------------------------------------------------------------ */
/*  Caches (so repeated calls don’t redownload / re-create DOM elements)     */
/* ------------------------------------------------------------------------ */
const imageCache = new Map(); // url → HTMLImageElement
const audioCache = new Map(); // url → HTMLAudioElement
const videoCache = new Map(); // url → HTMLVideoElement

/* ------------------------------------------------------------------------ */
/*  Image Loading                                                            */
/* ------------------------------------------------------------------------ */
export function loadImage(url) {
  if (imageCache.has(url)) return Promise.resolve(imageCache.get(url));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = url;
    img.onload = () => { imageCache.set(url, img); resolve(img); };
    img.onerror = reject;
  });
}

export function loadImageMap(mapObj) {
  const keys   = Object.keys(mapObj);
  const promArr = keys.map(k => loadImage(mapObj[k]));
  return Promise.all(promArr).then(values => {
    const result = {};
    keys.forEach((k, i) => { result[k] = values[i]; });
    return result;
  });
}

/* ------------------------------------------------------------------------ */
/*  Audio Loading                                                            */
/* ------------------------------------------------------------------------ */
export function loadAudio(url, { loop=false, volume=1.0 }={}) {
  if (audioCache.has(url)) return Promise.resolve(audioCache.get(url));
  return new Promise(resolve => {
    const aud = new Audio(url);
    aud.preload = 'auto';
    aud.loop = loop;
    aud.volume = volume;
    aud.oncanplaythrough = () => { audioCache.set(url, aud); resolve(aud); };
    // In case of network error, resolve anyway so the game doesn’t stall
    aud.onerror = () => { console.warn(`Failed to load audio: ${url}`); resolve(aud); };
  });
}

export function loadAudioMap(mapObj, { loopKeys=[], volume=1.0 }={}) {
  const keys   = Object.keys(mapObj);
  const promArr = keys.map(k => loadAudio(mapObj[k], {
    loop: loopKeys.includes(k),
    volume
  }));
  return Promise.all(promArr).then(values => {
    const result = {};
    keys.forEach((k, i) => { result[k] = values[i]; });
    return result;
  });
}

/* ------------------------------------------------------------------------ */
/*  Video Loading                                                            */
/* ------------------------------------------------------------------------ */
export function loadVideo(url, { muted=true }={}) {
  if (videoCache.has(url)) return Promise.resolve(videoCache.get(url));
  return new Promise(resolve => {
    const vid = document.createElement('video');
    vid.src = url;
    vid.preload = 'auto';
    vid.muted = muted;
    vid.playsInline = true;
    vid.onloadeddata = () => { videoCache.set(url, vid); resolve(vid); };
    vid.onerror = () => { console.warn(`Failed to load video: ${url}`); resolve(vid); };
  });
}

export function loadVideoMap(mapObj, options={}) {
  const keys   = Object.keys(mapObj);
  const promArr = keys.map(k => loadVideo(mapObj[k], options));
  return Promise.all(promArr).then(values => {
    const result = {};
    keys.forEach((k, i) => { result[k] = values[i]; });
    return result;
  });
}

/* ------------------------------------------------------------------------ */
/*  Bundle Preloader: { images:{}, audios:{}, videos:{} }                   */
/* ------------------------------------------------------------------------ */
export function preloadBundle({ images={}, audios={}, videos={} }, audioOpts={}) {
  return Promise.all([
    loadImageMap(images),
    loadAudioMap(audios, audioOpts),
    loadVideoMap(videos)
  ]).then(([imgMap, audMap, vidMap]) => ({ images:imgMap, audios:audMap, videos:vidMap }));
}
