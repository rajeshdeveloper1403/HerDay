/**
 * Composites Azhagiii's sketch portraits onto the physical open-sketchbook
 * plates — drawn ON the paper (multiply), never polaroid frames.
 * Run: node scripts/generate-azhagiii-spreads.mjs
 *
 * Layout (mixed sides — sketch alternates L/R):
 *  p0–p8 — Sketch1–9 with matching notes (content 1–9)
 *  p9    — dedication only (For Azhagiii…)
 */
import { createCanvas, loadImage } from 'canvas';
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const HER = join(ROOT, 'src', 'HerPics');
const PLATES = join(ROOT, 'public', 'photos', 'az-book', 'sketches');
const OUT = join(ROOT, 'public', 'photos', 'az-book');

const W = 1760;
const H = 1240;
const PAPER = {
  x: Math.round(W * 0.054),
  y: Math.round(H * 0.218),
  w: Math.round(W * 0.892),
  h: Math.round(H * 0.564),
};
const PAGE = {
  y: H * 0.248,
  h: H * 0.504,
  leftX: W * 0.086,
  leftW: W * 0.392,
  rightX: W * 0.522,
  rightW: W * 0.392,
};

const PLATE_FILES = [
  'marina-bay-sands.png',
  'gardens-by-the-bay.png',
  'merlion.png',
  'buddha-tooth.png',
  'joo-chiat.png',
  'lau-pa-sat.png',
  'marina-bay-skyline.png',
  'singapore-river.png',
  'botanic-gardens.png',
];

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

/** Fit the whole sketch inside the box (no crop) — shows fully. */
function containRect(img, dx, dy, dw, dh) {
  const ir = img.width / img.height;
  const tr = dw / dh;
  let w, h, x, y;
  if (ir > tr) {
    w = dw;
    h = dw / ir;
    x = dx;
    y = dy + (dh - h) / 2;
  } else {
    h = dh;
    w = dh * ir;
    x = dx + (dw - w) / 2;
    y = dy;
  }
  return { x, y, w, h };
}

/** Cover the box, optionally zoomed in (zoom 2 ≈ half the scene). */
function coverSource(img, dw, dh, zoom = 1, biasX = 0, biasY = 0) {
  const z = Math.max(1, zoom);
  const tr = dw / dh;
  const ir = img.width / img.height;
  let sw, sh;
  if (ir > tr) {
    sh = img.height / z;
    sw = sh * tr;
  } else {
    sw = img.width / z;
    sh = sw / tr;
  }
  let sx = (img.width - sw) * (0.5 + biasX);
  let sy = (img.height - sh) * (0.5 + biasY);
  sx = Math.max(0, Math.min(sx, img.width - sw));
  sy = Math.max(0, Math.min(sy, img.height - sh));
  return { sx, sy, sw, sh };
}

/** Rotate image by 90/180/270 so it matches the folder preview. */
function orientImage(img, rotateDeg) {
  const deg = ((rotateDeg % 360) + 360) % 360;
  if (!deg) return img;
  const swap = deg === 90 || deg === 270;
  const c = createCanvas(swap ? img.height : img.width, swap ? img.width : img.height);
  const ctx = c.getContext('2d');
  ctx.translate(c.width / 2, c.height / 2);
  ctx.rotate((deg * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  return c;
}

/** Knock out near-white sketch backdrop so it sits as ink on cream paper. */
function inkLayer(img) {
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, img.width, img.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    // soft knockout of paper-white / off-white plate
    if (lum > 232) {
      const t = Math.min(1, (lum - 232) / 18);
      d[i + 3] = Math.round(d[i + 3] * (1 - t));
    }
  }
  ctx.putImageData(data, 0, 0);
  return c;
}

function bleachPaper(ctx, seed) {
  const { x, y, w, h } = PAPER;
  const rand = rng(seed);
  const img = ctx.getImageData(x, y, w, h);
  const d = img.data;
  const mid = w * 0.5;
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      const i = (py * w + px) * 4;
      if (d[i + 3] < 12) continue;
      const n = (rand() - 0.5) * 8;
      const crease = Math.max(0, 1 - Math.abs(px - mid) / 18);
      const shade = crease * 22;
      d[i] = Math.max(0, Math.min(255, 244 + n - shade));
      d[i + 1] = Math.max(0, Math.min(255, 236 + n * 0.9 - shade * 0.92));
      d[i + 2] = Math.max(0, Math.min(255, 226 + n * 0.75 - shade * 0.8));
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, x, y);
}

/**
 * Draw sketch as ink ON the page — full figure, no frame/tape/shadow.
 * opts: { rotate, zoom, biasX, biasY }
 *  zoom > 1 crops in (2 ≈ half the scene)
 */
function inkPlate(ctx, img, box, opts = {}) {
  const rotate = opts.rotate || 0;
  const zoom = opts.zoom || 1;
  const biasX = opts.biasX || 0;
  const biasY = opts.biasY || 0;

  const oriented = orientImage(img, rotate);
  const plate = inkLayer(oriented);
  const insetX = box.w * 0.02;
  const insetY = box.h * 0.015;
  const dx = box.x + insetX;
  const dy = box.y + insetY;
  const dw = box.w - insetX * 2;
  const dh = box.h - insetY * 2;

  let destX, destY, destW, destH;
  let src;
  if (zoom > 1.01) {
    destX = dx;
    destY = dy;
    destW = dw;
    destH = dh;
    src = coverSource(plate, dw, dh, zoom, biasX, biasY);
  } else {
    const r = containRect(plate, dx, dy, dw, dh);
    destX = r.x;
    destY = r.y;
    destW = r.w;
    destH = r.h;
    src = { sx: 0, sy: 0, sw: plate.width, sh: plate.height };
  }

  const feather = Math.max(18, Math.min(destW, destH) * 0.045);
  const tmp = createCanvas(Math.ceil(destW), Math.ceil(destH));
  const tctx = tmp.getContext('2d');
  tctx.drawImage(plate, src.sx, src.sy, src.sw, src.sh, 0, 0, destW, destH);
  // Soft edge fade only (no heavy radial) so full sketches stay readable
  tctx.globalCompositeOperation = 'destination-in';
  const eg = tctx.createLinearGradient(0, 0, 0, destH);
  eg.addColorStop(0, 'rgba(0,0,0,0)');
  eg.addColorStop(Math.min(0.12, feather / destH), 'rgba(0,0,0,1)');
  eg.addColorStop(1 - Math.min(0.12, feather / destH), 'rgba(0,0,0,1)');
  eg.addColorStop(1, 'rgba(0,0,0,0)');
  tctx.fillStyle = eg;
  tctx.fillRect(0, 0, destW, destH);
  const eg2 = tctx.createLinearGradient(0, 0, destW, 0);
  eg2.addColorStop(0, 'rgba(0,0,0,0)');
  eg2.addColorStop(Math.min(0.12, feather / destW), 'rgba(0,0,0,1)');
  eg2.addColorStop(1 - Math.min(0.12, feather / destW), 'rgba(0,0,0,1)');
  eg2.addColorStop(1, 'rgba(0,0,0,0)');
  tctx.fillStyle = eg2;
  tctx.fillRect(0, 0, destW, destH);

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  ctx.globalCompositeOperation = 'multiply';
  ctx.globalAlpha = 0.97;
  ctx.drawImage(tmp, destX, destY, destW, destH);
  ctx.restore();
}

function wrapWords(ctx, text, maxW) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (!words.length) return [''];
  const lines = [];
  let cur = words[0];
  for (let i = 1; i < words.length; i++) {
    const next = `${cur} ${words[i]}`;
    if (ctx.measureText(next).width <= maxW) cur = next;
    else {
      lines.push(cur);
      cur = words[i];
    }
  }
  lines.push(cur);
  return lines;
}

/** Largest italic Georgia size that keeps text on ONE line. */
function fitSingleLine(ctx, text, maxW, maxSize, minSize = 14) {
  for (let s = maxSize; s >= minSize; s -= 0.5) {
    ctx.font = `italic ${s}px Georgia`;
    if (ctx.measureText(text).width <= maxW) return s;
  }
  return minSize;
}

function measureBlocks(blocks) {
  let h = 0;
  for (const b of blocks) h += (b.lh || 0) + b.gap;
  return h;
}

/** Draw one line — left (novel body) or center (titles / epigraphs). */
function drawAlignedLine(ctx, text, x, y, maxW, align) {
  ctx.textAlign = align === 'left' ? 'left' : 'center';
  ctx.fillText(text, align === 'left' ? x : x + maxW / 2, y);
}

function paintBlocks(ctx, blocks, box, color, scale, top, leftX, maxW) {
  const cx = leftX + maxW / 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x + 2, box.y + 2, box.w - 4, box.h - 4);
  ctx.clip();
  ctx.textBaseline = 'middle';

  let cy = top;
  for (const b of blocks) {
    if (b.kind === 'rule') {
      const rw = Math.min(maxW * (b.wide ? 0.55 : 0.34), b.wide ? 160 : 110) * Math.min(scale, 1.15);
      ctx.globalAlpha = b.alpha ?? 0.3;
      ctx.strokeStyle = color;
      ctx.lineWidth = b.wide ? 1.35 : 1.2;
      ctx.beginPath();
      ctx.moveTo(cx - rw / 2, cy + 2 * scale);
      ctx.lineTo(cx + rw / 2, cy + 2 * scale);
      ctx.stroke();
      cy += b.gap * scale;
      continue;
    }
    const size = parseFloat(b.font) || 16;
    const drawSize = size * scale;
    cy += (b.lh * scale) / 2;
    ctx.fillStyle = b.color || color;
    ctx.font = `${b.weight || 'normal'} ${drawSize.toFixed(2)}px Georgia`;
    ctx.globalAlpha = b.alpha;
    const align = b.align || 'center';
    drawAlignedLine(ctx, b.text, leftX, cy, maxW, align === 'center' ? 'center' : 'left');
    cy += (b.lh * scale) / 2 + b.gap * scale;
  }
  ctx.restore();
}

/**
 * Pro note — chapter title centered; body reads like a real book (roman + justify).
 */
function writeNote(ctx, note, box, color = '#3a3228') {
  const padX = box.w * 0.1;
  const padY = box.h * 0.05;
  const maxW = box.w - padX * 2;
  const leftX = box.x + padX;
  const innerH = box.h - padY * 2;
  const wrapW = maxW * 0.98;

  const trials = [
    { title: 30, quote: 16.5, body: 17.5, close: 15.5, row: 1.48, sec: 1 },
    { title: 27, quote: 15.5, body: 16.5, close: 14.5, row: 1.42, sec: 0.94 },
    { title: 24, quote: 14.5, body: 15.5, close: 14, row: 1.38, sec: 0.88 },
    { title: 21, quote: 14, body: 14.5, close: 13.5, row: 1.34, sec: 0.84 },
  ];

  const build = (t) => {
    const blocks = [];
    const add = (text, size, alpha, gapEnd, opts = {}) => {
      if (!text) return;
      const weight = opts.weight || 'normal';
      const font = `${weight} ${size}px Georgia`;
      ctx.font = font;
      const rows = wrapWords(ctx, text, wrapW);
      const lh = size * t.row;
      rows.forEach((row, i) => {
        blocks.push({
          kind: 'text',
          text: row,
          font,
          weight,
          alpha,
          lh,
          gap: i === rows.length - 1 ? gapEnd : 0,
          color: opts.color,
          align: opts.align || 'left',
          lastInPara: i === rows.length - 1,
        });
      });
    };

    if (note.title) {
      const ts = fitSingleLine(ctx, note.title, maxW, t.title, 15);
      blocks.push({
        kind: 'text',
        text: note.title,
        font: `italic ${ts}px Georgia`,
        weight: 'italic',
        alpha: 0.95,
        lh: ts * 1.25,
        gap: 8 * t.sec,
        align: 'center',
        lastInPara: true,
      });
    }
    blocks.push({ kind: 'rule', lh: 0, gap: 14 * t.sec });
    if (note.quote) {
      const q = note.quote.replace(/^["“]|["”]$/g, '');
      add(`“${q}”`, t.quote, 0.62, 18 * t.sec, { weight: 'italic', align: 'center' });
    }
    (note.body || []).forEach((para, pi) => {
      const last = pi === note.body.length - 1;
      add(para, t.body, 0.88, (last ? 16 : 14) * t.sec, { weight: 'normal', align: 'left' });
    });
    add(note.close, t.close, 0.78, 0, { weight: 'italic', align: 'left' });

    return { blocks, h: measureBlocks(blocks) };
  };

  let chosen = null;
  for (const t of trials) {
    const pack = build(t);
    if (pack.h <= innerH) {
      chosen = pack;
      break;
    }
    chosen = pack;
  }
  const scale = chosen.h > innerH ? Math.max(0.92, innerH / chosen.h) : 1;
  const top = box.y + padY + (innerH - chosen.h * scale) / 2;
  paintBlocks(ctx, chosen.blocks, box, color, scale, top, leftX, maxW);
}

/** Birthday letter — book reading feel; wish centered as a closing blessing. */
function writeLetterPage(ctx, paras, box, opts = {}) {
  const padX = box.w * 0.1;
  const padY = box.h * 0.048;
  const maxW = box.w - padX * 2;
  const leftX = box.x + padX;
  const innerH = box.h - padY * 2;
  const wrapW = maxW * 0.98;
  const color = '#3a3228';

  const trials = [
    { head: 24, body: 15, wish: 14.5, wishHead: 19.5, row: 1.42, sec: 1 },
    { head: 22, body: 14.2, wish: 13.8, wishHead: 18, row: 1.36, sec: 0.92 },
    { head: 20, body: 13.4, wish: 13.2, wishHead: 16.5, row: 1.3, sec: 0.86 },
  ];

  const build = (t) => {
    const blocks = [];
    const add = (text, size, alpha, gapEnd, opts = {}) => {
      if (!text) return;
      const weight = opts.weight || 'normal';
      const font = `${weight} ${size}px Georgia`;
      ctx.font = font;
      const rows = wrapWords(ctx, text, wrapW);
      const lh = size * t.row;
      rows.forEach((row, i) => {
        blocks.push({
          kind: 'text',
          text: row,
          font,
          weight,
          alpha,
          lh,
          gap: i === rows.length - 1 ? gapEnd : 0,
          align: opts.align || 'justify',
          lastInPara: i === rows.length - 1,
          color: opts.color,
        });
      });
    };

    for (const p of paras) {
      if (p.kind === 'title') {
        const ts = fitSingleLine(ctx, p.text, maxW, t.head + 4, 15);
        blocks.push({
          kind: 'text',
          text: p.text,
          font: `italic ${ts}px Georgia`,
          weight: 'italic',
          alpha: 0.95,
          lh: ts * 1.28,
          gap: 8 * t.sec,
          align: 'center',
          lastInPara: true,
        });
        blocks.push({ kind: 'rule', lh: 0, gap: 14 * t.sec, wide: true });
      } else if (p.kind === 'rule') {
        blocks.push({ kind: 'rule', lh: 0, gap: 12 * t.sec, wide: true, alpha: 0.26 });
      } else if (p.kind === 'wishHead') {
        blocks.push({ kind: 'rule', lh: 0, gap: 8 * t.sec, wide: true, alpha: 0.4 });
        blocks.push({ kind: 'rule', lh: 0, gap: 12 * t.sec, wide: true, alpha: 0.22 });
        const ts = fitSingleLine(ctx, p.text, maxW, t.wishHead + 2, 15);
        blocks.push({
          kind: 'text',
          text: p.text,
          font: `italic ${ts}px Georgia`,
          weight: 'italic',
          alpha: 0.97,
          lh: ts * 1.28,
          gap: 12 * t.sec,
          color: '#241e18',
          align: 'center',
          lastInPara: true,
        });
      } else if (p.kind === 'wish') {
        add(p.text, t.wish + 0.4, 0.9, 10 * t.sec, { weight: 'normal', align: 'left' });
      } else if (p.kind === 'wishClose') {
        add(p.text, t.wish + 1, 0.95, 6 * t.sec, { weight: 'italic', align: 'center' });
        blocks.push({ kind: 'rule', lh: 0, gap: 0, wide: true, alpha: 0.28 });
      } else {
        add(p.text, t.body, p.alpha ?? 0.88, 11 * t.sec, { weight: 'normal', align: 'left' });
      }
    }

    return { blocks, h: measureBlocks(blocks) };
  };

  let chosen = null;
  for (const t of trials) {
    const pack = build(t);
    if (pack.h <= innerH) {
      chosen = pack;
      break;
    }
    chosen = pack;
  }
  const scale = chosen.h > innerH ? Math.max(0.9, innerH / chosen.h) : 1;
  const top = box.y + padY + Math.max(0, (innerH - chosen.h * scale) * (opts.alignTop ? 0.06 : 0.3));
  paintBlocks(ctx, chosen.blocks, box, color, scale, top, leftX, maxW);
}

function writeLines(ctx, lines, box, color = '#3a3228') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cx = box.x + box.w / 2;
  let cy = box.y + box.h * 0.28;
  lines.forEach((line) => {
    ctx.font = line.font;
    ctx.globalAlpha = line.alpha ?? 0.88;
    ctx.fillText(line.text, cx, cy);
    cy += line.gap ?? 48;
  });
  ctx.restore();
}

/* ---- ink doodles (hearts / flowers / stars) for a sketchbook feel ---- */
function strokeInk(ctx, alpha = 0.48) {
  ctx.strokeStyle = `rgba(58, 50, 40, ${alpha})`;
  ctx.fillStyle = `rgba(58, 50, 40, ${alpha * 0.55})`;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

function doodleHeart(ctx, x, y, s, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  strokeInk(ctx, 0.42);
  ctx.lineWidth = Math.max(1.2, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.3);
  ctx.bezierCurveTo(-s * 0.55, -s * 0.15, -s * 0.5, -s * 0.7, 0, -s * 0.35);
  ctx.bezierCurveTo(s * 0.5, -s * 0.7, s * 0.55, -s * 0.15, 0, s * 0.3);
  ctx.stroke();
  ctx.restore();
}

function doodleFlower(ctx, x, y, s, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  strokeInk(ctx, 0.4);
  ctx.lineWidth = Math.max(1.1, s * 0.07);
  const petals = 6;
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(
      Math.cos(a) * s * 0.35,
      Math.sin(a) * s * 0.35,
      s * 0.28,
      s * 0.16,
      a,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function doodleStar(ctx, x, y, s) {
  ctx.save();
  strokeInk(ctx, 0.36);
  ctx.lineWidth = Math.max(1, s * 0.1);
  ctx.beginPath();
  ctx.moveTo(x, y - s);
  ctx.lineTo(x, y + s);
  ctx.moveTo(x - s, y);
  ctx.lineTo(x + s, y);
  ctx.moveTo(x - s * 0.7, y - s * 0.7);
  ctx.lineTo(x + s * 0.7, y + s * 0.7);
  ctx.moveTo(x + s * 0.7, y - s * 0.7);
  ctx.lineTo(x - s * 0.7, y + s * 0.7);
  ctx.stroke();
  ctx.restore();
}

function doodleLeaf(ctx, x, y, s, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  strokeInk(ctx, 0.38);
  ctx.lineWidth = Math.max(1.1, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, s);
  ctx.quadraticCurveTo(s * 0.7, 0, 0, -s);
  ctx.quadraticCurveTo(-s * 0.7, 0, 0, s);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, s * 0.7);
  ctx.lineTo(0, -s * 0.7);
  ctx.stroke();
  ctx.restore();
}

function doodleSwirl(ctx, x, y, s) {
  ctx.save();
  strokeInk(ctx, 0.34);
  ctx.lineWidth = Math.max(1.1, s * 0.08);
  ctx.beginPath();
  ctx.arc(x, y, s * 0.55, 0.2, Math.PI * 1.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, s * 0.28, -0.4, Math.PI * 1.2);
  ctx.stroke();
  ctx.restore();
}

function doodleBud(ctx, x, y, s, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  strokeInk(ctx, 0.4);
  ctx.lineWidth = Math.max(1.1, s * 0.09);
  ctx.beginPath();
  ctx.moveTo(0, s * 0.85);
  ctx.lineTo(0, s * 0.15);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.15, s * 0.28, s * 0.42, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, s * 0.45);
  ctx.quadraticCurveTo(s * 0.45, s * 0.2, s * 0.55, -s * 0.05);
  ctx.stroke();
  ctx.restore();
}

function doodleDots(ctx, x, y, s) {
  ctx.save();
  strokeInk(ctx, 0.32);
  ctx.lineWidth = 1;
  const offs = [
    [0, 0],
    [s * 0.55, -s * 0.2],
    [-s * 0.4, s * 0.35],
    [s * 0.25, s * 0.5],
  ];
  for (const [dx, dy] of offs) {
    ctx.beginPath();
    ctx.arc(x + dx, y + dy, Math.max(1.2, s * 0.12), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function doodleBow(ctx, x, y, s, ang = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(ang);
  strokeInk(ctx, 0.38);
  ctx.lineWidth = Math.max(1.1, s * 0.08);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(-s * 0.55, -s * 0.45, -s * 0.85, 0);
  ctx.quadraticCurveTo(-s * 0.55, s * 0.45, 0, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(s * 0.55, -s * 0.45, s * 0.85, 0);
  ctx.quadraticCurveTo(s * 0.55, s * 0.45, 0, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

const DOODLE_KINDS = ['heart', 'flower', 'leaf', 'star', 'swirl', 'bud', 'dots', 'bow'];

/** Corner / margin doodles — kept away from the main portrait/text. */
function pageDoodles(ctx, box, seed) {
  const rand = rng(seed);
  const pad = Math.min(box.w, box.h) * 0.065;
  const pick = () => DOODLE_KINDS[Math.floor(rand() * DOODLE_KINDS.length)];
  // Corners only — keep the text column clear for clean alignment
  const spots = [
    { x: box.x + pad, y: box.y + pad, kind: 'flower', s: 22 + rand() * 10, a: -0.45 + rand() * 0.35 },
    { x: box.x + box.w - pad, y: box.y + pad * 1.05, kind: 'heart', s: 16 + rand() * 10, a: 0.15 + rand() * 0.35 },
    { x: box.x + pad * 1.05, y: box.y + box.h - pad, kind: 'leaf', s: 18 + rand() * 10, a: -1.2 + rand() * 0.45 },
    { x: box.x + box.w - pad, y: box.y + box.h - pad * 1.05, kind: 'star', s: 10 + rand() * 5, a: 0 },
    { x: box.x + pad * 2.2, y: box.y + pad * 0.9, kind: pick(), s: 9 + rand() * 6, a: rand() * 0.8 },
    { x: box.x + box.w - pad * 2.2, y: box.y + box.h - pad * 0.95, kind: pick(), s: 9 + rand() * 6, a: rand() * 0.5 },
  ];

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.clip();
  for (const d of spots) {
    if (d.kind === 'heart') doodleHeart(ctx, d.x, d.y, d.s, d.a);
    else if (d.kind === 'flower') doodleFlower(ctx, d.x, d.y, d.s, d.a);
    else if (d.kind === 'leaf') doodleLeaf(ctx, d.x, d.y, d.s, d.a);
    else if (d.kind === 'star') doodleStar(ctx, d.x, d.y, d.s);
    else if (d.kind === 'bud') doodleBud(ctx, d.x, d.y, d.s, d.a);
    else if (d.kind === 'dots') doodleDots(ctx, d.x, d.y, d.s);
    else if (d.kind === 'bow') doodleBow(ctx, d.x, d.y, d.s, d.a);
    else doodleSwirl(ctx, d.x, d.y, d.s);
  }
  ctx.restore();
}

async function makeSpread(templateFile, leftDraw, rightDraw, outName, doodleSeed = 1) {
  const book = await loadImage(join(PLATES, templateFile));
  const c = createCanvas(W, H);
  const ctx = c.getContext('2d');
  ctx.drawImage(book, 0, 0);
  bleachPaper(ctx, 17 + outName.charCodeAt(1) * 13);

  const left = { x: PAGE.leftX, y: PAGE.y, w: PAGE.leftW, h: PAGE.h };
  const right = { x: PAGE.rightX, y: PAGE.y, w: PAGE.rightW, h: PAGE.h };

  await leftDraw(ctx, left);
  await rightDraw(ctx, right);
  pageDoodles(ctx, left, doodleSeed * 17 + 3);
  pageDoodles(ctx, right, doodleSeed * 31 + 9);

  writeFileSync(join(OUT, outName), c.toBuffer('image/png'));
  console.log('wrote', outName);
}

mkdirSync(OUT, { recursive: true });

const s1 = await loadImage(join(HER, 'Sketch1.png'));
const s2 = await loadImage(join(HER, 'Sketch2.png'));
const s3 = await loadImage(join(HER, 'Sketch3.png'));
const s4 = await loadImage(join(HER, 'Sketch4.png'));
const s5 = await loadImage(join(HER, 'Sketch5.png'));
const s6 = await loadImage(join(HER, 'Sketch6.png'));
const s7 = await loadImage(join(HER, 'Sketch7.png'));
const s8 = await loadImage(join(HER, 'Sketch8.png'));
const s9 = await loadImage(join(HER, 'sketch9.png'));

const note = (content) => (ctx, box) => writeNote(ctx, content, box);
const lines = (items) => (ctx, box) => writeLines(ctx, items, box);
const sketch = (img, opts) => (ctx, box) => inkPlate(ctx, img, box, opts);

/* Condensed notes — meaning kept. Image order: Sketch3, Sketch1, Sketch2, then 4–9. */
const N1 = {
  title: 'Her Beautiful, Quiet Presence',
  quote: 'She didn’t have to say a word to become someone special to me.',
  body: [
    'The first time I saw her, she felt so different — gentle, quiet, and incredibly adorable. Her little smile and innocent eyes said everything. Just being herself was enough.',
    'She made an ordinary moment feel unforgettable without even realizing it. Maybe she never knew how precious she looked. But I did.',
    'Even today, that first glimpse still makes me smile — the most beautiful stories begin with the simplest moments.',
  ],
  close: 'She was quiet, she was adorable, and she became one of my favorite memories.',
};

const N2 = {
  title: 'Her Little, Adorable Smile',
  quote: 'The sweetest little smile in the world.',
  body: [
    'Once she was a little girl with the cutest smile, the most innocent eyes, and a heart full of little dreams — smiling without a reason, laughing at the smallest things.',
    'That little girl is still there in her smile today — the same innocence, the same sweetness, the same adorable spark.',
    'I hope she never loses that little girl’s smile, and always finds reasons to laugh and dreams to follow.',
  ],
  close: 'The little girl she once was will always be one of the most beautiful parts of who she is today.',
};

const N3 = {
  title: 'Her Cute and Innocent Little World',
  quote: 'A little soul with a heart full of sweetness.',
  body: [
    'There is something so precious about her innocence — the way she holds her little toy, the quietness in her eyes, the sweetness in her presence.',
    'She deserves a world where she always feels safe, loved, and free to be her adorable self.',
    'Soft quiet. Soft smile. Soft heart.',
  ],
  close: 'In her quiet little world, even the smallest things feel like love.',
};

const N4 = {
  title: 'Her Incredible Talent and Grace',
  quote: 'A heart full of grace, a soul full of endless talent.',
  body: [
    'She was never just a beautiful girl — she was a girl with so many wonderful talents. Her drawings, her writing, everything she created carried a little piece of her soul.',
    'To me, she was the greatest: grace and sweetness in everything she did. I hope she always remembers how talented she is.',
  ],
  close: 'Her talent is quiet proof of how brightly she was always meant to shine.',
};

const N5 = {
  title: 'Her Smile That Feels Like Home',
  quote: 'Some smiles become your favorite place in the world.',
  body: [
    'There is something so adorable about her sleepy little face — soft smile, sleepy eyes, that cute lazy expression. She isn’t even trying, and somehow she is still the cutest.',
    'I wish I could keep these little mornings forever. Even her sleepy moments make my heart smile.',
  ],
  close: 'Even her quietest mornings feel like home.',
};

const N6 = {
  title: 'The Tenderness She Deserves',
  quote: 'A little moment of love, a lifetime of tenderness.',
  body: [
    'Look how naturally children are drawn to her. That little kiss is the sweetest moment — proof of how lovable, gentle, and wonderful she is.',
    'Sometimes I look at this picture and imagine being that little kid. Haha — maybe I’m a little jealous! She deserves so much love and happiness every day.',
  ],
  close: 'She was made for tenderness — and she deserves every bit of it.',
};

const N7 = {
  title: 'Her Happiness in the Little Moments',
  quote: 'Her happiness is the kind of beauty that stays in your heart.',
  body: [
    'Surrounded by nature, she looks like a little piece of sunshine. She doesn’t need anything extraordinary to be extraordinary — her happiness is already enough.',
    'I love how the smallest moments make her smile, and how that smile stays long after. I hope life gives her countless reasons to laugh and shine.',
  ],
  close: 'Her happiness is the kind of beauty that stays.',
};

const N8 = {
  title: 'Her Soft and Beautiful Charm',
  quote: 'A little elegance, a little sweetness, and a whole lot of love.',
  body: [
    'Awww — look how cute she is. Soft dress, peaceful expression, that sweet little smile. Effortless charm that makes you want to say, “How can someone be this adorable?”',
    'Beyond her looks, it’s her kind heart and wonderful character. She deserves to feel just as beautiful and loved as she makes the world feel.',
  ],
  close: 'Soft charm. Soft heart. Softly unforgettable.',
};

const N9 = {
  title: 'Her Little Moments That Mean Everything',
  quote: 'Even the smallest moments with her become the sweetest memories.',
  body: [
    'Sometimes the simplest moments show how adorable she is — a little smile at her phone, a quiet moment in her own world, that shy expression she gets without realizing it.',
    'Her kindness shines in the smallest things. Just being herself makes ordinary moments beautiful.',
  ],
  close: 'Even her smallest moments become the sweetest memories.',
};

/* Order: Sketch3→N1, Sketch1→N2, Sketch2→N3, Sketch4–9→N4–9. Dedication on p9. */
await makeSpread(PLATE_FILES[0], note(N1), sketch(s3), 'p0.png', 1);
await makeSpread(PLATE_FILES[1], sketch(s1), note(N2), 'p1.png', 2);
await makeSpread(PLATE_FILES[2], note(N3), sketch(s2), 'p2.png', 3);
await makeSpread(PLATE_FILES[3], sketch(s4), note(N4), 'p3.png', 4);
await makeSpread(PLATE_FILES[4], note(N5), sketch(s5), 'p4.png', 5);
await makeSpread(PLATE_FILES[5], sketch(s6), note(N6), 'p5.png', 6);
await makeSpread(PLATE_FILES[6], note(N7), sketch(s7), 'p6.png', 7);
await makeSpread(PLATE_FILES[7], sketch(s8), note(N8), 'p7.png', 8);
await makeSpread(PLATE_FILES[8], note(N9), sketch(s9), 'p8.png', 9);

/* Last spread — full birthday letter across both pages; wish highlighted at bottom. */
const LETTER_LEFT = [
  { kind: 'title', text: 'Happy Birthday, Nandhana Azhagiiiyeaaaa!' },
  { text: 'I spent quite a bit of time thinking about what to write for you. Your birthday has always been a special day for me. So, this year, I felt like doing something a little different for you — and that’s why I made this little surprise.' },
  { text: 'It might not be something big. It might not even be perfect. But while making it, I thought about every little detail. Because the small efforts we make for the people who matter to us always carry a special meaning.' },
  { text: 'When I think about you, it’s not always the big moments that come to my mind first. Sometimes, it’s the little things that make a memory beautiful.' },
  { text: 'I just want you to always be happy. I hope you achieve everything you’re working towards. I hope you keep smiling, laughing, and creating lots of beautiful memories.' },
  { text: 'And one day, when you look back at this birthday, I hope this little surprise reminds you of one simple thing — that someone took a little extra time for you, thought about every small detail, and made something just for you.' },
  { text: 'Because you’re not just another person. You’re someone who will always have a special place in my life.' },
];

const LETTER_RIGHT = [
  { text: 'And I don’t think I need to explain that any further. Sometimes, the most beautiful things are the ones we understand without having to explain them.' },
  { text: 'Keep smiling. Always stay the same crazy, cute, jolly, and wonderful person you are. And one more thing… thank you for being such a beautiful memory in my life.' },
  { text: 'I’m doing all this not because of love or because I expect anything from you. It’s simply because some people become special in our lives in a way that doesn’t need a relationship or a label. And for me, you’re one of those people.' },
  { text: 'Some people will always remain special, no matter how life changes. And you’ll always be one of them.' },
  { kind: 'wishHead', text: 'Once again, Happiest Birthday, Nandhana!' },
  { kind: 'wish', text: 'May this new year of your life bring you endless happiness, beautiful surprises, success in everything you do, and countless reasons to smile. May all your dreams come true, may you always find happiness in the little things, and may life give you all the beautiful things you truly deserve.' },
  { kind: 'wish', text: 'Stay happy, stay crazy, stay cute, and keep being the wonderful person you are.' },
  { kind: 'wishClose', text: 'Wishing you a beautiful birthday and an even more beautiful year ahead!' },
];

await makeSpread(
  PLATE_FILES[0],
  (ctx, box) => writeLetterPage(ctx, LETTER_LEFT, box, { alignTop: true }),
  (ctx, box) => writeLetterPage(ctx, LETTER_RIGHT, box, { alignTop: true }),
  'p9.png',
  11,
);

console.log('done — single-line headings + birthday letter on p9');
