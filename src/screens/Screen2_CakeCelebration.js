/* ============================================================
   SCREEN 2 CAKE CELEBRATION
   Interactive candle blowing, realistic smoke curls on wicks,
   festive side crackers & dazzling heart-shaped fireworks,
   sequential reveal of "Anu" and "Someone Worth Celebrating",
   seamlessly leading into Screen 3 (Tree Bloom)
   ============================================================ */
import gsap from 'gsap';
import { $, rand, reduceMotion } from '../core/utils.js';
import { getAudioContext, initAudioContext, cue } from '../core/audio.js';

let cakeWrap = null;
let blowPrompt = null;
let anuCenterStage = null;
let anuSideLeft = null;
let anuSideRight = null;
let flames = [];
let smokesContainer = null;
let fireworksCanvas = null;
let fwCtx = null;

let isScreen2Active = false;
let isBlown = false;
let isCelebrating = false;
let fwParticles = [];
let fwRockets = [];
let fwRAF = 0;
let onCompleteCallback = null;
let cakeFloatTL = null;

/* ------------------------------------------------------------
   IDLE FLOAT — soft bob while the cake waits to be blown
   Uses the wrap (already GSAP-driven) so glow, flames & prompt stay locked.
   ------------------------------------------------------------ */

export function stopCakeFloat() {
  if (cakeFloatTL) {
    cakeFloatTL.kill();
    cakeFloatTL = null;
  }
  if (cakeWrap) {
    gsap.killTweensOf(cakeWrap, 'y');
  }
}

export function startCakeFloat() {
  if (reduceMotion || !cakeWrap || cakeFloatTL) return;

  // Rest at y:0 (post-entrance), then bob lightly — never fights the entrance tween.
  gsap.set(cakeWrap, { y: 0 });
  cakeFloatTL = gsap.to(cakeWrap, {
    y: -8,
    duration: 2.85,
    ease: 'sine.inOut',
    yoyo: true,
    repeat: -1,
    force3D: true,
  });
}

/* ------------------------------------------------------------
   AUDIO SYNTHESIS FOR CELEBRATION
   ------------------------------------------------------------ */

function playBlowSound() {
  initAudioContext();
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const bufSize = ctx.sampleRate * 0.45;
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(420, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.4);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.28, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.45);
  } catch (err) {}
}

function playRocketLaunchSound() {
  initAudioContext();
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(1100, now + 0.38);

    gain.gain.setValueAtTime(0.05, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.42);
  } catch (e) {}
}

function playCrackerBurstSound(isHeart = false) {
  initAudioContext();
  const ctx = getAudioContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isHeart ? 140 : 110, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);

    gain.gain.setValueAtTime(isHeart ? 0.35 : 0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.55);

    const popsCount = isHeart ? 6 : 4;
    for (let i = 0; i < popsCount; i++) {
      const delay = 0.08 + Math.random() * 0.28;
      setTimeout(() => {
        if (!ctx) return;
        try {
          const t = ctx.currentTime;
          const popOsc = ctx.createOscillator();
          const popGain = ctx.createGain();
          popOsc.type = 'triangle';
          popOsc.frequency.setValueAtTime(rand(600, 1400), t);
          popGain.gain.setValueAtTime(0.12, t);
          popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
          popOsc.connect(popGain);
          popGain.connect(ctx.destination);
          popOsc.start(t);
          popOsc.stop(t + 0.07);
        } catch (e) {}
      }, delay * 1000);
    }
  } catch (e) {}
}

function playHeartChime() {
  initAudioContext();
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = [587.33, 659.25, 783.99, 880.0, 1046.5];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.95);
      } catch (e) {}
    }, idx * 65);
  });
}

function playFloralBloomChime() {
  initAudioContext();
  const ctx = getAudioContext();
  if (!ctx) return;
  // Radiant ascending harp arpeggio: E5, G#5, B5, E6, G#6
  const notes = [659.25, 830.61, 987.77, 1318.51, 1661.22];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.14, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 1.15);
      } catch (e) {}
    }, idx * 75);
  });
}

/* ------------------------------------------------------------
   FIREWORKS & CRACKERS ENGINE
   ------------------------------------------------------------ */

function ensureFireworksCanvas() {
  if (!fireworksCanvas) {
    fireworksCanvas = $('fireworksCanvas');
  }
  if (fireworksCanvas) {
    fwCtx = fireworksCanvas.getContext('2d');
    fireworksCanvas.width = window.innerWidth;
    fireworksCanvas.height = window.innerHeight;
  }
}

function launchSideRocket(startX, startY, targetX, targetY, type) {
  playRocketLaunchSound();
  fwRockets.push({
    x: startX,
    y: startY,
    targetX,
    targetY,
    vx: (targetX - startX) / 26,
    vy: (targetY - startY) / 26,
    step: 0,
    maxSteps: 26,
    type,
  });

  if (!fwRAF) {
    fwRAF = requestAnimationFrame(animateFireworks);
  }
}

function burstCracker(cx, cy, type = 'willow') {
  const isHeart = type === 'heart';
  playCrackerBurstSound(isHeart);
  if (isHeart) playHeartChime();

  const isMobile = window.innerWidth <= 768;
  const goldPalette = ['#fff7ad', '#ffd166', '#ffbe0b', '#ffffff', '#fb8500'];
  const rosePalette = ['#ff70a6', '#ff9ebb', '#e879f9', '#ffd166', '#ffffff', '#c084fc'];
  const sparklePalette = ['#ffffff', '#fff3cd', '#ffd447', '#ff85a1'];

  const flash = $('s2CrackerFlash');
  if (flash) {
    gsap.fromTo(flash, { opacity: 0.28 }, { opacity: 0, duration: 0.35, ease: 'power2.out' });
  }

  if (type === 'heart') {
    const count = isMobile ? 80 : 130;
    const step = (Math.PI * 2) / count;
    for (let i = 0; i < count; i++) {
      const t = i * step;
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const spd = rand(0.32, 0.42);

      fwParticles.push({
        x: cx,
        y: cy,
        vx: hx * spd + rand(-0.3, 0.3),
        vy: hy * spd + rand(-0.3, 0.3),
        gravity: 0.038,
        drag: 0.965,
        alpha: 1,
        decay: rand(0.011, 0.018),
        color: rosePalette[Math.floor(Math.random() * rosePalette.length)],
        size: rand(2.4, 4.2),
        flicker: true,
        isHeartStar: true,
      });
    }

    const innerCount = isMobile ? 24 : 45;
    for (let i = 0; i < innerCount; i++) {
      const angle = rand(0, Math.PI * 2);
      const spd = rand(0.8, 3.6);
      fwParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.04,
        drag: 0.96,
        alpha: 1,
        decay: rand(0.014, 0.024),
        color: goldPalette[Math.floor(Math.random() * goldPalette.length)],
        size: rand(1.8, 3.2),
        flicker: true,
      });
    }
  } else if (type === 'anu') {
    const LETTER_MATRICES = {
      A: [
        [0,1,1,0],
        [1,0,0,1],
        [1,0,0,1],
        [1,1,1,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1]
      ],
      N: [
        [1,0,0,1],
        [1,1,0,1],
        [1,0,1,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1]
      ],
      U: [
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [0,1,1,0]
      ],
      S: [
        [0,1,1,1],
        [1,0,0,0],
        [1,0,0,0],
        [0,1,1,0],
        [0,0,0,1],
        [0,0,0,1],
        [1,1,1,0]
      ],
      I: [
        [1,1,1,1],
        [0,1,1,0],
        [0,1,1,0],
        [0,1,1,0],
        [0,1,1,0],
        [0,1,1,0],
        [1,1,1,1]
      ],
      D: [
        [1,1,1,0],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,1,1,0]
      ],
      H: [
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,1,1,1],
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1]
      ],
      Y: [
        [1,0,0,1],
        [1,0,0,1],
        [1,0,0,1],
        [0,1,1,0],
        [0,1,1,0],
        [0,1,1,0],
        [0,1,1,0]
      ]
    };

    const word = 'NANDHANA';
    const letterWidth = isMobile ? 14 : 22;
    const letterHeight = isMobile ? 26 : 40;
    const letterSpacing = isMobile ? 4 : 7;
    const totalW = word.length * letterWidth + (word.length - 1) * letterSpacing;
    const startX = cx - totalW / 2;
    const startY = cy - letterHeight / 2;

    let curX = startX;
    for (let l = 0; l < word.length; l++) {
      const char = word[l];
      const matrix = LETTER_MATRICES[char];
      if (matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const colW = letterWidth / cols;
        const rowH = letterHeight / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (matrix[r][c] === 1) {
              const targetX = curX + c * colW + colW / 2;
              const targetY = startY + r * rowH + rowH / 2;
              const angle = rand(0, Math.PI * 2);
              const dist = rand(24, 75);
              fwParticles.push({
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                targetX,
                targetY,
                isGlyph: true,
                life: 0,
                maxLife: 260,
                flickerRate: rand(0.08, 0.16),
                alpha: 1,
                decay: 0.005,
                color: goldPalette[l % goldPalette.length],
                size: isMobile ? 2.0 : 2.8,
                flicker: true,
              });
            }
          }
        }
      }
      curX += letterWidth + letterSpacing;
    }

    // Outer golden stardust bouquet around the Anu cracker
    const haloCount = isMobile ? 40 : 70;
    for (let i = 0; i < haloCount; i++) {
      const angle = rand(0, Math.PI * 2);
      const spd = rand(2.2, 7.5);
      fwParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.045,
        drag: 0.965,
        alpha: 1,
        decay: rand(0.012, 0.024),
        color: sparklePalette[Math.floor(Math.random() * sparklePalette.length)],
        size: rand(2.0, 3.6),
        flicker: true,
      });
    }
  } else if (type === 'peony') {
    const count = isMobile ? 65 : 110;
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const spd = rand(2.5, 8.5);
      fwParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.05,
        drag: 0.965,
        alpha: 1,
        decay: rand(0.012, 0.022),
        color: sparklePalette[Math.floor(Math.random() * sparklePalette.length)],
        size: rand(2.2, 3.8),
        flicker: true,
      });
    }
  } else {
    const count = isMobile ? 60 : 100;
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const spd = rand(2.0, 8.0);
      fwParticles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.065,
        drag: 0.965,
        alpha: 1,
        decay: rand(0.009, 0.017),
        color: goldPalette[Math.floor(Math.random() * goldPalette.length)],
        size: rand(2.0, 3.6),
        flicker: true,
      });
    }
  }
}

function animateFireworks() {
  if (!fwCtx || !fireworksCanvas) return;
  fwCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

  for (let i = fwRockets.length - 1; i >= 0; i--) {
    const r = fwRockets[i];
    r.step++;
    r.x += r.vx;
    r.y += r.vy;


    fwCtx.fillStyle = '#ffe082';
    fwCtx.globalAlpha = 0.4;
    fwCtx.beginPath();
    fwCtx.arc(r.x, r.y, 6, 0, Math.PI * 2);
    fwCtx.fill();

    fwCtx.fillStyle = '#ffffff';
    fwCtx.globalAlpha = 1;
    fwCtx.beginPath();
    fwCtx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
    fwCtx.fill();

    for (let s = 0; s < 3; s++) {
      fwParticles.push({
        x: r.x + rand(-2, 2),
        y: r.y + rand(2, 6),
        vx: rand(-0.6, 0.6),
        vy: rand(1.2, 3.0),
        gravity: 0.04,
        drag: 0.95,
        alpha: 0.85,
        decay: 0.05,
        color: '#ffc107',
        size: rand(1.2, 2.2),
        flicker: false,
      });
    }


    if (r.step >= r.maxSteps) {
      burstCracker(r.targetX, r.targetY, r.type);
      fwRockets.splice(i, 1);
    }
  }

  for (let i = fwParticles.length - 1; i >= 0; i--) {
    const p = fwParticles[i];

    if (p.isGlyph) {
      p.life++;
      if (p.life < 36) {
        p.x += (p.targetX - p.x) * 0.14;
        p.y += (p.targetY - p.y) * 0.14;
      }
      if (p.life > 60) {
        p.y += (p.life - 60) * 0.04;
        p.x += Math.sin(p.life * 0.1) * 0.5;
        p.alpha -= 0.022;
      }
      if (p.alpha <= 0 || p.life >= p.maxLife) {
        fwParticles.splice(i, 1);
        continue;
      }


      const flicker = (Math.sin(p.life * p.flickerRate) * 0.35 + 0.65) * p.alpha;
      fwCtx.fillStyle = p.color;
      fwCtx.globalAlpha = Math.max(0, flicker * 0.38);
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
      fwCtx.fill();

      fwCtx.fillStyle = '#ffffff';
      fwCtx.globalAlpha = Math.max(0, flicker);
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fwCtx.fill();

      continue;
    }

    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= p.drag;
    p.vy *= p.drag;
    p.alpha -= p.decay;

    if (p.alpha <= 0) {
      fwParticles.splice(i, 1);
      continue;
    }


    const flicker = p.flicker ? Math.random() * 0.4 + 0.6 : 1;
    const curA = Math.max(0, p.alpha * flicker);

    fwCtx.fillStyle = p.color;
    fwCtx.globalAlpha = curA * 0.35;
    fwCtx.beginPath();
    fwCtx.arc(p.x, p.y, p.size * 2.2, 0, Math.PI * 2);
    fwCtx.fill();

    fwCtx.fillStyle = p.isHeartStar ? '#ffffff' : p.color;
    fwCtx.globalAlpha = curA;
    fwCtx.beginPath();
    fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    fwCtx.fill();


  }

  if (fwRockets.length > 0 || fwParticles.length > 0) {
    fwRAF = requestAnimationFrame(animateFireworks);
  } else {
    fwRAF = 0;
  }
}

/* ------------------------------------------------------------
   CANDLE BLOWING & SMOKE SEQUENCE
   ------------------------------------------------------------ */

export function blowCandles() {
  if (!isScreen2Active || isBlown || isCelebrating) return;
  isBlown = true;
  isCelebrating = true;

  // 1. Permanently hide and kill the interactive "Tap to Blow" button
  if (cakeWrap) {
    cakeWrap.classList.add('is-blown');
  }
  if (blowPrompt) {
    blowPrompt.classList.add('is-blown');
    blowPrompt.style.setProperty('display', 'none', 'important');
    blowPrompt.style.setProperty('opacity', '0', 'important');
    blowPrompt.style.setProperty('visibility', 'hidden', 'important');
    blowPrompt.style.pointerEvents = 'none';
    gsap.killTweensOf(blowPrompt);
    gsap.set(blowPrompt, { opacity: 0, scale: 0, display: 'none' });
  }

  // 2. Play realistic breath blowing sound
  playBlowSound();

  // 3. Extinguish flames IMMEDIATELY & COMPLETELY — zero residual light shade!
  const flamesContainer = document.querySelector('.s2-flames');
  if (flamesContainer) {
    flamesContainer.classList.add('is-extinguished');
    flamesContainer.style.display = 'none';
    flamesContainer.style.opacity = '0';
  }
  if (cakeWrap) {
    cakeWrap.classList.add('is-blown');
  }
  flames = document.querySelectorAll('.s2-flame');
  flames.forEach((f) => {
    f.classList.add('is-extinguished');
    f.style.animation = 'none';
    f.style.display = 'none';
    f.style.opacity = '0';
    f.style.boxShadow = 'none';
    f.style.filter = 'none';
  });

  const cakeGlow = document.querySelector('.s2-cake-glow');
  if (cakeGlow) {
    cakeGlow.style.opacity = '0';
    cakeGlow.style.display = 'none';
  }

  // 4. Reveal realistic curly smoke wisps curling up from candle threads
  const smokeWisps = document.querySelectorAll('.s2-smoke-path');
  const smokeGroups = document.querySelectorAll('.s2-smoke-group');
  if (smokeWisps.length > 0) {
    gsap.set(smokesContainer, { opacity: 1 });
    smokeWisps.forEach((wisp, i) => {
      const len = wisp.getTotalLength ? wisp.getTotalLength() : 120;
      wisp.style.strokeDasharray = len;
      wisp.style.strokeDashoffset = len;

      const group = smokeGroups[i] || wisp;
      gsap.timeline({ delay: 0.08 + i * 0.03 })
        .to(wisp, {
          strokeDashoffset: 0,
          opacity: 0.85,
          duration: 0.8,
          ease: 'power2.out',
        })
        .to(group, {
          y: -45,
          x: rand(-8, 8),
          scale: 1.25,
          duration: 1.8,
          ease: 'sine.out',
        }, 0.2)
        .to(wisp, {
          opacity: 0,
          duration: 1.1,
          ease: 'power1.in',
        }, 1.2);
    });
  }

  // 5. Trigger the Cracker Celebration!
  ensureFireworksCanvas();
  const W = window.innerWidth;
  const H = window.innerHeight;
  const isMobile = W <= 768;

  // Wave 1: First side rockets launch (~0.40s after blow)
  setTimeout(() => {
    launchSideRocket(W * 0.14, H, W * 0.20, H * 0.35, 'willow');
    launchSideRocket(W * 0.86, H, W * 0.80, H * 0.35, 'peony');
  }, 400);

  // Wave 2: HEART CRACKERS BURST ON BOTH SIDES (~0.95s after blow)
  setTimeout(() => {
    launchSideRocket(W * 0.22, H, W * 0.22, H * 0.33, 'heart');
    launchSideRocket(W * 0.78, H, W * 0.78, H * 0.33, 'heart');
  }, 950);

  // Wave 3: ANU CRACKER BURST (AFTER heart crackers burst! ~1.85s after blow)
  setTimeout(() => {
    if (isMobile) {
      // In mobile: show the Anu cracker in the center stage below "Someone Worth Celebrating"
      let anuTargetX = W * 0.5;
      let anuTargetY = H * 0.48;
      if (anuCenterStage) {
        const rect = anuCenterStage.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          anuTargetX = rect.left + rect.width / 2;
          anuTargetY = rect.top + rect.height / 2;
        }
      }
      launchSideRocket(W * 0.50, H, anuTargetX, anuTargetY, 'anu');
    } else {
      // In laptop & big screens: show the Anu cracker in BOTH SIDES where crackers burst!
      launchSideRocket(W * 0.22, H, W * 0.22, H * 0.33, 'anu');
      launchSideRocket(W * 0.78, H, W * 0.78, H * 0.33, 'anu');
    }
  }, 1850);

  // When cracker sparkles form ANU, morph them into radiant blooming flowers! (~3.0s after blow)
  setTimeout(() => {
    morphCrackerToFlowers(isMobile);
  }, 3000);

  // Wave 4: Celebratory sparkling side bouquets accompanying the flower bloom (~3.8s after blow)
  setTimeout(() => {
    launchSideRocket(W * 0.12, H, W * 0.14, H * 0.24, 'peony');
    launchSideRocket(W * 0.88, H, W * 0.86, H * 0.24, 'willow');
  }, 3800);

  // 6. Complete celebration & smoothly transition to Screen 3 (Tree Bloom)
  // Displays flowers for several seconds, then transitions at ~7.4s!
  setTimeout(() => {
    cue('bloom');
    const bloom = $('bloom');
    if (bloom) {
      gsap.set(bloom, { autoAlpha: 1 });
      const bloomScale = Math.max(window.innerWidth, window.innerHeight) / 30;
      gsap.fromTo(
        bloom,
        { scale: 0.02 },
        {
          scale: bloomScale,
          duration: 0.75,
          ease: 'power2.in',
          onComplete: () => {
            if (onCompleteCallback) onCompleteCallback();
          },
        }
      );
    } else {
      if (onCompleteCallback) onCompleteCallback();
    }
  }, 7400);
}

/* ------------------------------------------------------------
   CRACKER TO FLOWERS TRANSFORMATION
   ------------------------------------------------------------ */

function morphCrackerToFlowers(isMobile) {
  playFloralBloomChime();

  if (isMobile) {
    if (anuCenterStage) gsap.set(anuCenterStage, { opacity: 1 });
    const centerGlow = anuCenterStage ? anuCenterStage.querySelector('.anu-spark-glow') : null;
    const centerFloral = anuCenterStage ? anuCenterStage.querySelector('.s2-anu-floral') : null;
    const centerChars = anuCenterStage ? anuCenterStage.querySelectorAll('.floral-char') : [];
    const centerBlossoms = anuCenterStage ? anuCenterStage.querySelectorAll('.blossom-pet') : [];

    if (centerGlow) {
      gsap.fromTo(
        centerGlow,
        { opacity: 0, scale: 0.5 },
        { opacity: 0.9, scale: 1.3, duration: 0.8, ease: 'power2.out', yoyo: true, repeat: 1 }
      );
    }
    if (centerFloral) {
      gsap.to(centerFloral, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out' });
    }
    if (centerChars.length > 0) {
      gsap.fromTo(
        centerChars,
        { opacity: 0, scale: 0.35, y: 16, force3D: true },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          force3D: true,
          duration: 0.8,
          stagger: 0.12,
          ease: 'back.out(1.8)',
        }
      );
    }
    if (centerBlossoms.length > 0) {
      gsap.fromTo(
        centerBlossoms,
        { opacity: 0, scale: 0, rotation: -60 },
        {
          opacity: 1,
          scale: 1,
          rotation: 0,
          duration: 0.9,
          stagger: 0.08,
          ease: 'elastic.out(1.2, 0.45)',
        }
      );
    }
  } else {
    // Laptop / Big Screens: Reveal and bloom BOTH sides where crackers burst!
    const sideStages = [anuSideLeft, anuSideRight].filter(Boolean);
    sideStages.forEach((stage, idx) => {
      gsap.set(stage, { opacity: 1 });
      const glow = stage.querySelector('.anu-spark-glow');
      const floral = stage.querySelector('.s2-anu-floral');
      const chars = stage.querySelectorAll('.floral-char');
      const blossoms = stage.querySelectorAll('.blossom-pet');

      if (glow) {
        gsap.fromTo(
          glow,
          { opacity: 0, scale: 0.5 },
          { opacity: 0.9, scale: 1.3, duration: 0.8, ease: 'power2.out', yoyo: true, repeat: 1, delay: idx * 0.05 }
        );
      }
      if (floral) {
        gsap.to(floral, { opacity: 1, scale: 1, duration: 0.7, ease: 'power2.out', delay: idx * 0.05 });
      }
      if (chars.length > 0) {
        gsap.fromTo(
          chars,
          { opacity: 0, scale: 0.35, y: 16, force3D: true },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            force3D: true,
            duration: 0.8,
            stagger: 0.1,
            ease: 'back.out(1.8)',
            delay: idx * 0.05,
          }
        );
      }
      if (blossoms.length > 0) {
        gsap.fromTo(
          blossoms,
          { opacity: 0, scale: 0, rotation: -60 },
          {
            opacity: 1,
            scale: 1,
            rotation: 0,
            duration: 0.9,
            stagger: 0.07,
            ease: 'elastic.out(1.2, 0.45)',
            delay: idx * 0.05,
          }
        );
      }
    });
  }

  // Atmospheric gentle floral stardust floating outwards
  if (fwCtx && fireworksCanvas) {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const flowerPalette = ['#ffd166', '#ff9ebb', '#e879f9', '#ffffff', '#ff70a6', '#fff3cd'];
    const centers = isMobile
      ? [{ x: W * 0.5, y: H * 0.48 }]
      : [
          { x: W * 0.22, y: H * 0.33 },
          { x: W * 0.78, y: H * 0.33 },
        ];

    centers.forEach((c) => {
      for (let i = 0; i < 35; i++) {
        const angle = rand(0, Math.PI * 2);
        const spd = rand(0.8, 3.2);
        fwParticles.push({
          x: c.x + rand(-45, 45),
          y: c.y + rand(-20, 20),
          vx: Math.cos(angle) * spd,
          vy: Math.sin(angle) * spd - rand(0.5, 1.5),
          gravity: 0.02,
          drag: 0.97,
          alpha: 1,
          decay: rand(0.008, 0.016),
          color: flowerPalette[Math.floor(Math.random() * flowerPalette.length)],
          size: rand(2.0, 3.8),
          flicker: true,
        });
      }
    });
    if (!fwRAF) {
      fwRAF = requestAnimationFrame(animateFireworks);
    }
  }
}

/* ------------------------------------------------------------
   INITIALIZATION & SETUP
   ------------------------------------------------------------ */

export function initCakeCelebration({ onCelebrationComplete } = {}) {
  onCompleteCallback = onCelebrationComplete;
  cakeWrap = $('s2CakeWrap');
  blowPrompt = $('s2BlowBtn');
  anuCenterStage = $('s2AnuStage');
  anuSideLeft = $('s2AnuSideLeft');
  anuSideRight = $('s2AnuSideRight');
  smokesContainer = $('s2Smokes');
  fireworksCanvas = $('fireworksCanvas');

  // CRITICAL: Block all pointer events initially so Screen 1 never triggers Screen 2
  isScreen2Active = false;
  isBlown = false;
  isCelebrating = false;

  if (cakeWrap) {
    cakeWrap.style.pointerEvents = 'none';
    cakeWrap.addEventListener('click', (e) => {
      if (!isScreen2Active || isBlown) return;
      e.stopPropagation();
      blowCandles();
    });
  }

  if (blowPrompt) {
    blowPrompt.style.pointerEvents = 'none';
    blowPrompt.addEventListener('click', (e) => {
      if (!isScreen2Active || isBlown) return;
      e.stopPropagation();
      blowCandles();
    });
  }

  // Pre-hide all stages initially
  const allStages = [anuCenterStage, anuSideLeft, anuSideRight].filter(Boolean);
  allStages.forEach((stage) => {
    gsap.set(stage, { opacity: 0 });
    const glow = stage.querySelector('.anu-spark-glow');
    const floral = stage.querySelector('.s2-anu-floral');
    const chars = stage.querySelectorAll('.floral-char');
    const blossoms = stage.querySelectorAll('.blossom-pet');
    if (glow) gsap.set(glow, { opacity: 0, scale: 0.5 });
    if (floral) gsap.set(floral, { opacity: 0, scale: 0.85 });
    if (chars.length > 0) gsap.set(chars, { opacity: 0, scale: 0.35, y: 16 });
    if (blossoms.length > 0) gsap.set(blossoms, { opacity: 0, scale: 0 });
  });

  ensureFireworksCanvas();
}

export function armCakeBlowPrompt() {
  // CRITICAL: If candles have already been blown or celebration started, NEVER re-arm or show prompt!
  if (isBlown || isCelebrating) return;

  isScreen2Active = true;

  if (cakeWrap) {
    cakeWrap.classList.remove('is-blown');
    cakeWrap.style.pointerEvents = 'auto';
    cakeWrap.style.cursor = 'pointer';
  }

  // Safety: ensure idle float is running once the cake is interactive
  startCakeFloat();

  if (blowPrompt) {
    blowPrompt.classList.remove('is-blown');
    blowPrompt.style.display = '';
    blowPrompt.style.pointerEvents = 'auto';
    gsap.killTweensOf(blowPrompt);
    gsap.to(blowPrompt, {
      opacity: 1,
      scale: 1,
      duration: 0.5,
      ease: 'back.out(1.4)',
    });
  }
}

export function resetCakeCelebration() {
  isScreen2Active = false;
  isBlown = false;
  isCelebrating = false;
  fwParticles = [];
  fwRockets = [];
  stopCakeFloat();
  if (fwRAF) {
    cancelAnimationFrame(fwRAF);
    fwRAF = 0;
  }
  if (fwCtx && fireworksCanvas) {
    fwCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
  }
  if (smokesContainer) {
    gsap.set(smokesContainer, { opacity: 0 });
  }
  if (blowPrompt) {
    blowPrompt.classList.remove('is-blown');
    blowPrompt.style.display = '';
    blowPrompt.style.pointerEvents = 'none';
    gsap.set(blowPrompt, { opacity: 0, scale: 0.85 });
  }
  if (cakeWrap) {
    cakeWrap.classList.remove('is-blown');
    cakeWrap.style.pointerEvents = 'none';
  }

  // Restore candle flames and cake glow
  const flamesContainer = document.querySelector('.s2-flames');
  if (flamesContainer) {
    flamesContainer.classList.remove('is-extinguished');
    flamesContainer.style.display = '';
    flamesContainer.style.opacity = '1';
  }
  flames = document.querySelectorAll('.s2-flame');
  flames.forEach((f) => {
    f.classList.remove('is-extinguished');
    f.style.display = '';
    f.style.opacity = '1';
    f.style.animation = '';
    f.style.boxShadow = '';
    f.style.filter = '';
  });
  const cakeGlow = document.querySelector('.s2-cake-glow');
  if (cakeGlow) {
    cakeGlow.style.display = '';
    cakeGlow.style.opacity = '1';
  }

  // Reset all Anu stages
  const allStages = [anuCenterStage, anuSideLeft, anuSideRight].filter(Boolean);
  allStages.forEach((stage) => {
    gsap.set(stage, { opacity: 0 });
    const glow = stage.querySelector('.anu-spark-glow');
    const floral = stage.querySelector('.s2-anu-floral');
    const chars = stage.querySelectorAll('.floral-char');
    const blossoms = stage.querySelectorAll('.blossom-pet');
    if (glow) gsap.set(glow, { opacity: 0, scale: 0.5 });
    if (floral) gsap.set(floral, { opacity: 0, scale: 0.85 });
    if (chars.length > 0) gsap.set(chars, { opacity: 0, scale: 0.35, y: 16 });
    if (blossoms.length > 0) gsap.set(blossoms, { opacity: 0, scale: 0 });
  });
}
