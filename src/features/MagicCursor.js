/* ============================================================
   FEATURE: SPARKLER CURSOR & AMBIENT FIREWORKS SPECTACULAR
   Particle trail wand following pointer + midnight fireworks bursts.
   ============================================================ */
import { $, rand } from '../core/utils.js';
import { initAudioContext, getAudioContext } from '../core/audio.js';

let cursorCanvas = null;
let cursorCtx = null;
let cursorParticles = [];
let cursorRAF = 0;
let lastPointerPos = { x: -1, y: -1 };

let fwCanvas = null;
let fwCtx = null;
let fwParticles = [];
let fwRockets = [];
let fwRAF = 0;
let fwRunning = false;

export function initCursorCanvas() {
  cursorCanvas = $('cursorCanvas');
  if (!cursorCanvas) return;
  cursorCtx = cursorCanvas.getContext('2d');

  function resizeCursor() {
    cursorCanvas.width = window.innerWidth;
    cursorCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCursor);
  resizeCursor();

  function isSuppressed(e) {
    if (document.body.classList.contains('modal-open')) return true;
    const modalIds = ['galleryModal', 'letterModal', 'lanternModal', 'giftModal', 'constellationModal', 'carromSlideModal'];
    for (let i = 0; i < modalIds.length; i++) {
      const m = $(modalIds[i]);
      if (m && m.classList.contains('is-open')) return true;
    }
    if (e && e.target && e.target.closest) {
      if (e.target.closest('button, .cake-card, .cake__toast, .toast__btn, .wish__actions, .replay, .music-box-btn')) {
        return true;
      }
    }
    return false;
  }

  function spawnCursorParticles(x, y, count = 2) {
    const colors = ['#ffd700', '#ffbe0b', '#fca311', '#fff6d6', '#ffffff', '#ffb4c8'];
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const spd = rand(0.4, 2.6);
      const isStar = Math.random() < 0.45;
      const isPetal = Math.random() < 0.15;
      cursorParticles.push({
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - rand(0.3, 0.9),
        size: isPetal ? rand(3.5, 5.5) : (isStar ? rand(2.5, 4.5) : rand(1.5, 2.8)),
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: rand(0.018, 0.035),
        type: isPetal ? 'petal' : (isStar ? 'star' : 'spark'),
        rot: rand(0, Math.PI * 2),
        vrot: rand(-0.06, 0.06),
      });
    }
    if (!cursorRAF) {
      cursorRAF = requestAnimationFrame(animateCursor);
    }
  }

  function onPointerMove(e) {
    if (isSuppressed(e)) return;
    const isTouch = e.pointerType === 'touch';
    if (isTouch && !window.bdayDone) return;
    const x = e.clientX !== undefined ? e.clientX : -1;
    const y = e.clientY !== undefined ? e.clientY : -1;
    if (x < 0 || y < 0) return;

    if (lastPointerPos.x >= 0) {
      const dx = x - lastPointerPos.x;
      const dy = y - lastPointerPos.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 10) {
        const steps = Math.min(3, Math.floor(dist / 18));
        for (let s = 1; s <= steps; s++) {
          const t = s / steps;
          spawnCursorParticles(lastPointerPos.x + dx * t, lastPointerPos.y + dy * t, 1);
        }
      }
    }
    lastPointerPos = { x, y };
    spawnCursorParticles(x, y, 1);
  }

  function onPointerDown(e) {
    if (isSuppressed(e)) return;
    const isTouch = e.pointerType === 'touch';
    if (isTouch && !window.bdayDone) return;
    const x = e.clientX !== undefined ? e.clientX : (e.touches && e.touches[0] ? e.touches[0].clientX : -1);
    const y = e.clientY !== undefined ? e.clientY : (e.touches && e.touches[0] ? e.touches[0].clientY : -1);
    if (x < 0 || y < 0) return;
    spawnCursorParticles(x, y, isTouch ? 4 : 10);
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  window.addEventListener('pointerdown', onPointerDown, { passive: true });
}

function animateCursor() {
  if (!cursorCtx || !cursorCanvas) return;
  cursorCtx.clearRect(0, 0, cursorCanvas.width, cursorCanvas.height);

  for (let i = cursorParticles.length - 1; i >= 0; i--) {
    const p = cursorParticles[i];

    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.03;
    p.vx *= 0.98;
    p.alpha -= p.decay;
    p.rot += p.vrot;

    if (p.alpha <= 0) {
      cursorParticles.splice(i, 1);
      continue;
    }

    cursorCtx.save();
    cursorCtx.translate(p.x, p.y);
    cursorCtx.rotate(p.rot);

    if (p.type === 'star') {
      const r = p.size;
      cursorCtx.fillStyle = p.color;
      cursorCtx.globalAlpha = Math.max(0, p.alpha * 0.35);
      cursorCtx.beginPath();
      cursorCtx.arc(0, 0, r * 1.8, 0, Math.PI * 2);
      cursorCtx.fill();

      cursorCtx.fillStyle = '#ffffff';
      cursorCtx.globalAlpha = Math.max(0, p.alpha * 0.95);
      cursorCtx.beginPath();
      cursorCtx.moveTo(0, -r);
      cursorCtx.quadraticCurveTo(0, 0, r, 0);
      cursorCtx.quadraticCurveTo(0, 0, 0, r);
      cursorCtx.quadraticCurveTo(0, 0, -r, 0);
      cursorCtx.quadraticCurveTo(0, 0, 0, -r);
      cursorCtx.fill();
    } else if (p.type === 'petal') {
      cursorCtx.fillStyle = '#ffb703';
      cursorCtx.globalAlpha = Math.max(0, p.alpha * 0.35);
      cursorCtx.beginPath();
      cursorCtx.ellipse(0, 0, p.size * 0.9, p.size * 1.5, 0, 0, Math.PI * 2);
      cursorCtx.fill();
      cursorCtx.fillStyle = '#fca311';
      cursorCtx.globalAlpha = Math.max(0, p.alpha * 0.85);
      cursorCtx.beginPath();
      cursorCtx.ellipse(0, 0, p.size * 0.5, p.size, 0, 0, Math.PI * 2);
      cursorCtx.fill();
    } else {
      cursorCtx.fillStyle = p.color;
      cursorCtx.globalAlpha = Math.max(0, p.alpha * 0.32);
      cursorCtx.beginPath();
      cursorCtx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
      cursorCtx.fill();
      cursorCtx.fillStyle = '#ffffff';
      cursorCtx.globalAlpha = Math.max(0, p.alpha * 0.9);
      cursorCtx.beginPath();
      cursorCtx.arc(0, 0, p.size * 0.7, 0, Math.PI * 2);
      cursorCtx.fill();
    }

    cursorCtx.restore();
  }

  if (cursorParticles.length > 0) {
    cursorRAF = requestAnimationFrame(animateCursor);
  } else {
    cursorRAF = 0;
  }
}

export function initFireworksCanvas() {
  fwCanvas = $('fireworksCanvas');
  if (!fwCanvas) return;
  fwCtx = fwCanvas.getContext('2d');
  function resizeFw() {
    fwCanvas.width = window.innerWidth;
    fwCanvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeFw);
  resizeFw();
}

function playFireworkSound(isFinale = false) {
  initAudioContext();
  const audioCtx = getAudioContext();
  if (!audioCtx) return;
  const now = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(isFinale ? 130 : 100, now);
  osc.frequency.exponentialRampToValueAtTime(28, now + (isFinale ? 0.8 : 0.5));
  gain.gain.setValueAtTime(isFinale ? 0.4 : 0.25, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + (isFinale ? 0.9 : 0.6));
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(now);
  osc.stop(now + 1.0);
}

function launchRocket(startX, startY, targetX, targetY, type, onExplode) {
  fwRockets.push({
    x: startX,
    y: startY,
    targetX,
    targetY,
    vx: (targetX - startX) / 32,
    vy: (targetY - startY) / 32,
    step: 0,
    maxSteps: 32,
    type,
    onExplode,
  });
  if (!fwRAF) {
    fwRunning = true;
    fwRAF = requestAnimationFrame(animateFireworks);
  }
}

export function createFireworkBurst(cx, cy, type = 'willow') {
  playFireworkSound(type === 'devaSri');
  const paletteGold = ['#fff275', '#ffb703', '#fb8500', '#ffffff', '#ffd166'];
  const paletteRose = ['#c084fc', '#e879f9', '#a855f7', '#38bdf8', '#f472b6'];
  const isMobile = window.innerWidth <= 768;

  if (type === 'willow') {
    const count = isMobile ? 55 : 90;
    for (let i = 0; i < count; i++) {
      const angle = rand(0, Math.PI * 2);
      const spd = rand(1.5, 7.5);
      fwParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.06,
        drag: 0.97,
        alpha: 1,
        decay: rand(0.009, 0.018),
        color: paletteGold[Math.floor(Math.random() * paletteGold.length)],
        size: rand(1.8, 3.2),
        flicker: true,
      });
    }
  } else if (type === 'heart') {
    const step = isMobile ? 0.12 : 0.08;
    for (let t = 0; t < Math.PI * 2; t += step) {
      const hx = 16 * Math.pow(Math.sin(t), 3);
      const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const spd = rand(0.22, 0.28);
      fwParticles.push({
        x: cx, y: cy,
        vx: hx * spd,
        vy: hy * spd,
        gravity: 0.03,
        drag: 0.96,
        alpha: 1,
        decay: rand(0.012, 0.022),
        color: paletteRose[Math.floor(Math.random() * paletteRose.length)],
        size: rand(2.2, 3.8),
        flicker: true,
      });
    }
  } else if (type === 'sunflower') {
    const count = isMobile ? 48 : 80;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const spd = rand(4.5, 6.2);
      fwParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.04,
        drag: 0.96,
        alpha: 1,
        decay: rand(0.012, 0.022),
        color: '#ffb703',
        size: rand(2.5, 4.0),
        flicker: true,
      });
    }
    for (let i = 0; i < 25; i++) {
      const angle = rand(0, Math.PI * 2);
      const spd = rand(0.5, 2.2);
      fwParticles.push({
        x: cx, y: cy,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        gravity: 0.02,
        drag: 0.95,
        alpha: 1,
        decay: 0.016,
        color: '#8b4500',
        size: rand(2, 3),
        flicker: false,
      });
    }
  } else if (type === 'devaSri' || type === 'anu') {
    const LETTER_MATRICES = {
      A: [[0,1,1,0],[1,0,0,1],[1,0,0,1],[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,0,0,1]],
      N: [[1,0,0,1],[1,1,0,1],[1,0,1,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1]],
      U: [[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[0,1,1,0]],
      D: [[1,1,1,0],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,0]],
      H: [[1,0,0,1],[1,0,0,1],[1,0,0,1],[1,1,1,1],[1,0,0,1],[1,0,0,1],[1,0,0,1]],
    };

    const word = 'NANDHANA';
    const letterWidth = isMobile ? 18 : 28;
    const letterHeight = isMobile ? 30 : 44;
    const letterSpacing = isMobile ? 5 : 8;
    const totalWordWidth = word.length * letterWidth + (word.length - 1) * letterSpacing;
    const startX = cx - totalWordWidth / 2;
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
              const dist = rand(30, 90);

              fwParticles.push({
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                targetX,
                targetY,
                isGlyph: true,
                alpha: 1,
                life: 0,
                maxLife: 260,
                flickerRate: rand(0.08, 0.16),
                color: paletteGold[l % paletteGold.length],
                size: isMobile ? 1.9 : 2.5,
              });
            }
          }
        }
      }
      curX += letterWidth + letterSpacing;
    }
  }

  if (!fwRAF) {
    fwRunning = true;
    fwRAF = requestAnimationFrame(animateFireworks);
  }
}

export function fireworkAt(x, y, type = 'willow') {
  initFireworksCanvas();
  createFireworkBurst(x, y, type);
}

export function launchMidnightFireworks() {
  initFireworksCanvas();
  const W = window.innerWidth;
  const H = window.innerHeight;

  setTimeout(() => {
    launchRocket(W * 0.25, H, W * 0.32, H * 0.32, 'willow');
    launchRocket(W * 0.75, H, W * 0.68, H * 0.30, 'willow');
  }, 200);

  setTimeout(() => {
    launchRocket(W * 0.35, H, W * 0.40, H * 0.36, 'heart');
    launchRocket(W * 0.65, H, W * 0.60, H * 0.36, 'heart');
  }, 1600);

  setTimeout(() => {
    launchRocket(W * 0.5, H, W * 0.5, H * 0.26, 'sunflower');
  }, 3100);

  setTimeout(() => {
    launchRocket(W * 0.5, H, W * 0.5, H * 0.22, 'anu');
  }, 4500);
}

function animateFireworks() {
  if (!fwCtx || !fwCanvas) return;
  fwCtx.clearRect(0, 0, fwCanvas.width, fwCanvas.height);

  for (let i = fwRockets.length - 1; i >= 0; i--) {
    const r = fwRockets[i];
    r.x += r.vx;
    r.y += r.vy;
    r.step++;

    fwCtx.save();
    fwCtx.fillStyle = '#ffbe0b';
    fwCtx.shadowColor = '#ffd700';
    fwCtx.shadowBlur = 8;
    fwCtx.beginPath();
    fwCtx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
    fwCtx.fill();
    fwCtx.restore();

    if (r.step >= r.maxSteps) {
      createFireworkBurst(r.targetX, r.targetY, r.type);
      if (r.onExplode) r.onExplode(r.targetX, r.targetY);
      fwRockets.splice(i, 1);
    }
  }

  for (let i = fwParticles.length - 1; i >= 0; i--) {
    const p = fwParticles[i];

    if (p.isGlyph) {
      p.life++;
      if (p.life < 40) {
        p.x += (p.targetX - p.x) * 0.12;
        p.y += (p.targetY - p.y) * 0.12;
      }
      if (p.life > 190) {
        p.y += (p.life - 190) * 0.04;
        p.alpha -= 0.018;
      }
      if (p.alpha <= 0 || p.life >= p.maxLife) {
        fwParticles.splice(i, 1);
        continue;
      }

      fwCtx.save();
      const sparkle = (Math.sin(p.life * p.flickerRate) * 0.4 + 0.6) * p.alpha;
      const jx = rand(-0.7, 0.7);
      const jy = rand(-0.7, 0.7);
      fwCtx.fillStyle = '#ffb703';
      fwCtx.globalAlpha = Math.max(0, sparkle * 0.32);
      fwCtx.beginPath();
      fwCtx.arc(p.x + jx, p.y + jy, p.size * 2.2, 0, Math.PI * 2);
      fwCtx.fill();

      fwCtx.fillStyle = p.color;
      fwCtx.globalAlpha = Math.max(0, sparkle);
      fwCtx.beginPath();
      fwCtx.arc(p.x + jx, p.y + jy, p.size, 0, Math.PI * 2);
      fwCtx.fill();
      fwCtx.restore();
    } else {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0.04;
      p.vx *= p.drag || 0.97;
      p.vy *= p.drag || 0.97;
      p.alpha -= p.decay || 0.015;

      if (p.alpha <= 0) {
        fwParticles.splice(i, 1);
        continue;
      }

      fwCtx.save();
      const flicker = p.flicker ? Math.random() * 0.4 + 0.6 : 1;
      const curA = Math.max(0, p.alpha * flicker);
      fwCtx.fillStyle = p.color;
      fwCtx.globalAlpha = curA * 0.28;
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
      fwCtx.fill();

      fwCtx.globalAlpha = curA;
      fwCtx.beginPath();
      fwCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      fwCtx.fill();
      fwCtx.restore();
    }
  }

  if (fwRockets.length > 0 || fwParticles.length > 0) {
    fwRAF = requestAnimationFrame(animateFireworks);
  } else {
    fwRAF = 0;
    fwRunning = false;
  }
}
