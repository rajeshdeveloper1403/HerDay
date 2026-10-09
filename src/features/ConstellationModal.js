/* ============================================================
   FEATURE: COSMIC STAR CONSTELLATION CONNECT ("DEVA SRI")
   Interactive star canvas connecting 7 stars with laser lines.
   ============================================================ */
import { $ } from '../core/utils.js';
import { playStarChime } from '../core/audio.js';
import { pushModalHistory, popModalHistory, registerModalCloser } from './ModalsManager.js';

let constellationConnected = false;
let constellationStars = [];
let constellationConnections = [];
let constellationCurrentStar = 0;
let constellationAnimId = 0;
let fireworkAtCallback = null;

export function openConstellationModal() {
  const modal = $('constellationModal');
  if (!modal) return;
  pushModalHistory('constellation');
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('modal-open');
  initConstellationCanvas();
}

export function closeConstellationModal(shouldPopHistory = true) {
  const modal = $('constellationModal');
  if (!modal || !modal.classList.contains('is-open')) return false;
  if (shouldPopHistory) popModalHistory('constellation');
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');

  if (constellationAnimId) {
    cancelAnimationFrame(constellationAnimId);
    constellationAnimId = 0;
  }
  return true;
}

export function initConstellationCanvas() {
  const canvas = $('constellationCanvas');
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = rect.width || 340;
  const h = rect.height || 340;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // 3 celestial stars representing "A-N-U"
  const starCoords = [
    { x: 0.28, y: 0.65, label: 'A' },
    { x: 0.50, y: 0.32, label: 'N' },
    { x: 0.72, y: 0.65, label: 'U' },
  ];

  constellationStars = starCoords.map((pt, i) => ({
    id: i,
    x: pt.x * w,
    y: pt.y * h,
    label: pt.label,
    visited: i === 0,
    pulse: 0,
  }));

  constellationConnections = [];
  constellationCurrentStar = 0;
  constellationConnected = false;

  const winFooter = $('constellationFooter');
  if (winFooter) winFooter.hidden = true;

  const bgStars = [];
  for (let i = 0; i < 45; i++) {
    bgStars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.4,
      alpha: 0.2 + Math.random() * 0.7,
      speed: 0.01 + Math.random() * 0.02,
    });
  }

  function loop() {
    ctx.clearRect(0, 0, w, h);

    // Draw twinkling cosmic dust
    bgStars.forEach((s) => {
      s.alpha += Math.sin(Date.now() * s.speed) * 0.015;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0.1, Math.min(1, s.alpha))})`;
      ctx.fill();
    });

    // Draw connected celestial laser lines
    ctx.lineWidth = 2.5;
    constellationConnections.forEach((conn) => {
      const p1 = constellationStars[conn.from];
      const p2 = constellationStars[conn.to];
      const grad = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
      grad.addColorStop(0, 'rgba(255, 215, 0, 0.95)');
      grad.addColorStop(1, 'rgba(255, 150, 0, 0.95)');
      ctx.strokeStyle = grad;
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
    ctx.shadowBlur = 0;

    // Draw stars and glowing halos
    constellationStars.forEach((star, idx) => {
      const isCurrent = idx === constellationCurrentStar;
      const isTarget = idx === constellationCurrentStar + 1;
      star.pulse += 0.06;

      if (star.visited || isTarget) {
        const haloR = (star.visited ? 16 : 22) + Math.sin(star.pulse) * 4;
        const grad = ctx.createRadialGradient(star.x, star.y, 2, star.x, star.y, haloR);
        grad.addColorStop(0, isTarget ? 'rgba(255, 215, 0, 0.65)' : 'rgba(255, 180, 50, 0.35)');
        grad.addColorStop(1, 'rgba(255, 215, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(star.x, star.y, haloR, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      const coreR = star.visited ? 6 : (isTarget ? 7 : 4);
      ctx.arc(star.x, star.y, coreR, 0, Math.PI * 2);
      ctx.fillStyle = star.visited ? '#ffffff' : (isTarget ? '#ffd700' : 'rgba(255, 255, 255, 0.5)');
      ctx.shadowColor = '#ffe082';
      ctx.shadowBlur = star.visited ? 12 : (isTarget ? 15 : 4);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = '600 12px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = star.visited ? '#ffe082' : (isTarget ? '#ffffff' : 'rgba(255, 255, 255, 0.45)');
      ctx.fillText(star.label, star.x, star.y - 10);
    });

    constellationAnimId = requestAnimationFrame(loop);
  }

  if (constellationAnimId) cancelAnimationFrame(constellationAnimId);
  constellationAnimId = requestAnimationFrame(loop);

  let isPointerDown = false;
  function handlePointer(clientX, clientY) {
    if (constellationConnected) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const nextIdx = constellationCurrentStar + 1;
    if (nextIdx < constellationStars.length) {
      const targetStar = constellationStars[nextIdx];
      const dist = Math.hypot(x - targetStar.x, y - targetStar.y);
      if (dist < 38) {
        constellationConnections.push({ from: constellationCurrentStar, to: nextIdx });
        constellationCurrentStar = nextIdx;
        targetStar.visited = true;
        playStarChime(nextIdx);

        if (navigator.vibrate) {
          navigator.vibrate(35);
        }

        if (nextIdx === constellationStars.length - 1) {
          constellationConnections.push({ from: nextIdx, to: 0 });
          constellationConnected = true;
          if (navigator.vibrate) {
            navigator.vibrate([60, 40, 100]);
          }
          if (winFooter) winFooter.hidden = false;
          if (fireworkAtCallback) {
            fireworkAtCallback(rect.left + w / 2, rect.top + h / 2);
          }
        }
      }
    }
  }

  canvas.onpointerdown = (e) => {
    isPointerDown = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    handlePointer(e.clientX, e.clientY);
  };

  canvas.onpointermove = (e) => {
    if (isPointerDown) {
      handlePointer(e.clientX, e.clientY);
    }
  };

  const endPointer = (e) => {
    isPointerDown = false;
    try { if (e && e.pointerId) canvas.releasePointerCapture(e.pointerId); } catch (err) {}
  };
  canvas.onpointerup = endPointer;
  canvas.onpointercancel = endPointer;
}

export function setupConstellation(options = {}) {
  fireworkAtCallback = options.fireworkAt;
  registerModalCloser('constellation', () => closeConstellationModal(false));

  const closeBtn = $('constellationCloseBtn');
  const backdrop = $('constellationBackdrop');
  const modal = $('constellationModal');
  if (!modal) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeConstellationModal(true));
  }
  if (backdrop) {
    backdrop.addEventListener('click', () => closeConstellationModal(true));
  }

  window.addEventListener('keydown', (e) => {
    if (modal.classList.contains('is-open') && e.key === 'Escape') {
      closeConstellationModal(true);
    }
  });

  let touchStartX = 0;
  let touchStartY = 0;
  modal.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches[0]) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }
  }, { passive: true });
  modal.addEventListener('touchend', (e) => {
    if (e.changedTouches && e.changedTouches[0]) {
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (dx > 65 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        closeConstellationModal(true);
      }
    }
  }, { passive: true });
}
