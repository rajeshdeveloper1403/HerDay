/* ============================================================
   FEATURE: HEART CENTER GIFT REVEAL
   Sweep the heart — petals fall one-by-one (same as ambient fall),
   revealing the gift. Outer rim stays so the heart shape never changes.
   ============================================================ */
import { $, clamp } from '../core/utils.js';
import {
  getHeartLayout,
  knockPetalsNear,
  getGiftClearRatio,
  resetKnockedPetals,
  clearGiftZone,
} from '../screens/Screen3_Tree.js';

let layer, hitCanvas, giftBtn, hintEl;
let wiping = false;
let revealed = false;
let active = false;
let layout = null;
let onOpenGift = null;
let resizeBound = null;

const REVEAL_AT = 0.48;

function positionLayer() {
  layout = getHeartLayout();
  if (!layer || !layout) return;

  const scene = document.querySelector('.scene');
  const sceneRect = scene ? scene.getBoundingClientRect() : { left: 0, top: 0, width: window.innerWidth };
  const viewW = window.innerWidth;

  // Need ~200px free to the right of the heart to show the side hint fully
  const spaceRight = viewW - (layout.cx + layout.rx);
  const useSide = spaceRight >= 188;

  const padL = Math.max(layout.rx, layout.ry) * 0.1;
  const padR = useSide
    ? Math.max(layout.rx, layout.ry) * 0.2 + 200
    : Math.max(layout.rx, layout.ry) * 0.12;
  const padTop = Math.max(layout.rx, layout.ry) * 0.12;
  // Extra bottom pad when hint docks under the heart (mobile / narrow)
  const padBot = useSide
    ? Math.max(layout.rx, layout.ry) * 0.12
    : Math.max(layout.rx, layout.ry) * 0.06 + 44;

  const left = layout.cx - layout.rx - padL - sceneRect.left;
  const top = layout.cy - layout.ry - padTop - sceneRect.top;
  const width = layout.rx * 2 + padL + padR;
  const height = layout.ry * 2 + padTop + padBot;

  layer.style.left = `${left}px`;
  layer.style.top = `${top}px`;
  layer.style.width = `${width}px`;
  layer.style.height = `${height}px`;

  layout.cxLocal = padL + layout.rx;
  layout.cyLocal = padTop + layout.ry;

  if (giftBtn) {
    // Centered in the heart; slightly taller for the bow so the box body sits mid-heart
    const size = Math.min(layout.rx, layout.ry) * 0.42;
    giftBtn.style.width = `${clamp(size, 64, 118)}px`;
    giftBtn.style.height = `${clamp(size * 1.12, 72, 132)}px`;
    giftBtn.style.left = `${layout.cxLocal}px`;
    giftBtn.style.top = `${layout.cyLocal}px`;
  }

  if (hintEl) {
    if (useSide) {
      // Desktop / wide: fully visible on the right of the heart
      hintEl.classList.remove('is-dock');
      hintEl.classList.add('is-side');
      hintEl.style.left = `${layout.cxLocal + layout.rx + 10}px`;
      hintEl.style.top = `${layout.cyLocal}px`;
    } else {
      // Mobile / narrow: tuck at heart tip — birthday text sits lower so nothing blends
      hintEl.classList.remove('is-side');
      hintEl.classList.add('is-dock');
      hintEl.style.left = `${layout.cxLocal}px`;
      hintEl.style.top = `${layout.cyLocal + layout.ry - 2}px`;
    }
  }

  if (hitCanvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = hitCanvas.clientWidth || width;
    const h = hitCanvas.clientHeight || height;
    hitCanvas.width = Math.round(w * dpr);
    hitCanvas.height = Math.round(h * dpr);
  }
}

function syncGiftOpacity(clearRatio) {
  if (!giftBtn || revealed) return;
  giftBtn.style.opacity = String(clamp(clearRatio * 1.35, 0, 1));
}

const wipePrev = { x: 0, y: 0, _has: false };

function sweepAt(clientX, clientY) {
  if (revealed || !active) return;

  const brush = Math.max(28, Math.min(layout?.rx || 70, layout?.ry || 70) * 0.34);
  let clearRatio = getGiftClearRatio();

  // Sample along the stroke so petals detach one-by-one while moving
  if (wipePrev._has) {
    const travel = Math.hypot(clientX - wipePrev.x, clientY - wipePrev.y);
    const n = Math.max(1, Math.min(6, Math.round(travel / 12) || 1));
    for (let i = 1; i <= n; i++) {
      const t = i / n;
      const ix = wipePrev.x + (clientX - wipePrev.x) * t;
      const iy = wipePrev.y + (clientY - wipePrev.y) * t;
      clearRatio = knockPetalsNear(ix, iy, brush).clearRatio;
    }
  } else {
    clearRatio = knockPetalsNear(clientX, clientY, brush).clearRatio;
  }

  wipePrev.x = clientX;
  wipePrev.y = clientY;
  wipePrev._has = true;

  syncGiftOpacity(clearRatio);
  if (clearRatio >= REVEAL_AT) completeReveal();
}

function completeReveal() {
  if (revealed) return;
  revealed = true;
  wiping = false;
  // Tiny tuck under the gift only — no circular crater / Tap-to-open gap
  clearGiftZone();
  if (hitCanvas) hitCanvas.style.pointerEvents = 'none';
  if (hintEl) hintEl.classList.add('is-gone');
  if (giftBtn) {
    giftBtn.classList.add('is-revealed');
    giftBtn.style.opacity = '1';
    giftBtn.style.pointerEvents = 'auto';
    giftBtn.setAttribute('aria-hidden', 'false');
  }
  if (layer) layer.classList.add('is-revealed');
}

function onPointerDown(e) {
  if (!active || revealed) return;
  wiping = true;
  wipePrev._has = false;
  sweepAt(e.clientX, e.clientY);
  try { hitCanvas.setPointerCapture(e.pointerId); } catch (_) {}
  e.preventDefault();
}

function onPointerMove(e) {
  if (!wiping || revealed) return;
  sweepAt(e.clientX, e.clientY);
  e.preventDefault();
}

function endWipe() {
  wiping = false;
  wipePrev._has = false;
}

function onGiftClick(e) {
  e.stopPropagation();
  if (!revealed) return;
  if (typeof onOpenGift === 'function') onOpenGift();
}

export function armHeartGift(layoutHint) {
  if (!layer) return;
  active = true;
  revealed = false;
  wiping = false;
  wipePrev._has = false;
  resetKnockedPetals();
  layer.hidden = false;
  layer.setAttribute('aria-hidden', 'false');
  layer.classList.add('is-active');
  layer.classList.remove('is-revealed');
  if (hitCanvas) {
    hitCanvas.style.opacity = '1';
    hitCanvas.style.pointerEvents = 'auto';
  }
  // Hint fades in after layout — avoids early flash before heart is ready
  if (hintEl) {
    hintEl.classList.add('is-gone');
    hintEl.classList.remove('is-ready');
  }
  if (giftBtn) {
    giftBtn.classList.remove('is-revealed');
    giftBtn.style.opacity = '0';
    giftBtn.style.pointerEvents = 'none';
    giftBtn.setAttribute('aria-hidden', 'true');
  }
  if (layoutHint) layout = layoutHint;
  requestAnimationFrame(() => {
    positionLayer();
    requestAnimationFrame(() => {
      if (!active || revealed || !hintEl) return;
      hintEl.classList.add('is-ready');
      hintEl.classList.remove('is-gone');
    });
  });
}

export function resetHeartGift() {
  active = false;
  revealed = false;
  wiping = false;
  wipePrev._has = false;
  resetKnockedPetals();
  if (layer) {
    layer.hidden = true;
    layer.setAttribute('aria-hidden', 'true');
    layer.classList.remove('is-active', 'is-revealed');
  }
  if (hitCanvas) {
    hitCanvas.style.opacity = '1';
    hitCanvas.style.pointerEvents = 'auto';
  }
  if (hintEl) hintEl.classList.remove('is-gone');
  if (giftBtn) {
    giftBtn.classList.remove('is-revealed');
    giftBtn.style.opacity = '0';
    giftBtn.style.pointerEvents = 'none';
  }
}

export function setupHeartGiftReveal({ onOpen } = {}) {
  layer = $('heartGiftLayer');
  hitCanvas = $('heartWipeCanvas');
  giftBtn = $('heartGiftBtn');
  hintEl = $('heartGiftHint');
  onOpenGift = onOpen;

  if (!layer || !hitCanvas) return;

  hitCanvas.addEventListener('pointerdown', onPointerDown);
  hitCanvas.addEventListener('pointermove', onPointerMove);
  hitCanvas.addEventListener('pointerup', endWipe);
  hitCanvas.addEventListener('pointercancel', endWipe);
  hitCanvas.addEventListener('pointerleave', endWipe);

  if (giftBtn) giftBtn.addEventListener('click', onGiftClick);

  resizeBound = () => {
    if (!active) return;
    positionLayer();
  };
  window.addEventListener('resize', resizeBound);
}
