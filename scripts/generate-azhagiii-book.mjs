/**
 * Prints Azhagiii's portrait onto a worn VHS box (cover + spine)
 * at the same pixel ratios as the other library tapes.
 * Run: node scripts/generate-azhagiii-book.mjs
 */
import { createCanvas, loadImage } from 'canvas';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC = join(__dirname, 'azhagiii-src');
const OUT = join(__dirname, '..', 'public', 'photos');

const COVER_W = 694;
const COVER_H = 1318;
const SPINE_W = 368;
const SPINE_H = 2176;

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function coverFit(ctx, img, dx, dy, dw, dh, biasY = 0) {
  const ir = img.width / img.height;
  const tr = dw / dh;
  let sx, sy, sw, sh;
  if (ir > tr) {
    sh = img.height;
    sw = sh * tr;
    sx = (img.width - sw) / 2;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / tr;
    sx = 0;
    sy = (img.height - sh) * (0.5 + biasY);
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function paperGrain(ctx, w, h, amt, seed) {
  const rand = rng(seed);
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (rand() - 0.5) * amt;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n * 0.92));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * 0.78));
  }
  ctx.putImageData(img, 0, 0);
}

function fibers(ctx, w, h, n, seed, color) {
  const rand = rng(seed);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (let i = 0; i < n; i++) {
    ctx.globalAlpha = 0.04 + rand() * 0.08;
    const y = rand() * h;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(
      w * 0.3, y + (rand() - 0.5) * 8,
      w * 0.6, y + (rand() - 0.5) * 8,
      w, y + (rand() - 0.5) * 4
    );
    ctx.stroke();
  }
  ctx.restore();
}

function scratches(ctx, w, h, n, seed) {
  const rand = rng(seed);
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    ctx.strokeStyle = rand() > 0.5 ? 'rgba(255,248,230,0.18)' : 'rgba(40,22,10,0.16)';
    ctx.globalAlpha = 0.25 + rand() * 0.4;
    ctx.lineWidth = rand() > 0.85 ? 1.6 : 0.7;
    const x = rand() * w;
    const y = rand() * h;
    const len = 8 + rand() * 70;
    const a = rand() * Math.PI;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  ctx.restore();
}

function vignette(ctx, w, h, strength = 0.45) {
  const g = ctx.createRadialGradient(w * 0.5, h * 0.42, h * 0.2, w * 0.5, h * 0.5, h * 0.78);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, `rgba(28,16,8,${strength})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function edgeWear(ctx, w, h) {
  const inset = ctx.createLinearGradient(0, 0, 0, h);
  inset.addColorStop(0, 'rgba(255,246,220,0.18)');
  inset.addColorStop(0.08, 'rgba(255,246,220,0)');
  inset.addColorStop(0.88, 'rgba(40,22,8,0)');
  inset.addColorStop(1, 'rgba(20,10,4,0.38)');
  ctx.fillStyle = inset;
  ctx.fillRect(0, 0, w, h);
  const side = ctx.createLinearGradient(0, 0, w, 0);
  side.addColorStop(0, 'rgba(20,10,4,0.28)');
  side.addColorStop(0.08, 'rgba(20,10,4,0)');
  side.addColorStop(0.92, 'rgba(20,10,4,0)');
  side.addColorStop(1, 'rgba(20,10,4,0.32)');
  ctx.fillStyle = side;
  ctx.fillRect(0, 0, w, h);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawCentered(ctx, text, x, y) {
  ctx.fillText(text, x, y);
}

function makeCover(art) {
  const c = createCanvas(COVER_W, COVER_H);
  const ctx = c.getContext('2d');

  ctx.fillStyle = '#d8c4a4';
  ctx.fillRect(0, 0, COVER_W, COVER_H);

  const m = 18;
  ctx.save();
  roundRect(ctx, m, m, COVER_W - m * 2, COVER_H - m * 2, 6);
  ctx.clip();
  coverFit(ctx, art, m, m, COVER_W - m * 2, COVER_H - m * 2, -0.04);
  ctx.restore();

  ctx.save();
  roundRect(ctx, m, m, COVER_W - m * 2, COVER_H - m * 2, 6);
  ctx.strokeStyle = 'rgba(72,48,22,0.35)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  const fade = ctx.createLinearGradient(0, COVER_H * 0.62, 0, COVER_H);
  fade.addColorStop(0, 'rgba(18,10,6,0)');
  fade.addColorStop(0.4, 'rgba(18,10,6,0.22)');
  fade.addColorStop(1, 'rgba(18,10,6,0.78)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, COVER_H * 0.6, COVER_W, COVER_H * 0.4);

  const topWash = ctx.createLinearGradient(0, 0, 0, 150);
  topWash.addColorStop(0, 'rgba(18,10,6,0.42)');
  topWash.addColorStop(1, 'rgba(18,10,6,0)');
  ctx.fillStyle = topWash;
  ctx.fillRect(0, 0, COVER_W, 160);

  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,236,196,0.82)';
  ctx.font = '600 18px Georgia, "Times New Roman", serif';
  ctx.letterSpacing = '6px';
  drawCentered(ctx, 'A   L E O N   V A S A R I   F I L M', COVER_W / 2, 56);

  ctx.fillStyle = 'rgba(255,236,196,0.35)';
  ctx.fillRect(COVER_W / 2 - 70, 72, 140, 1);

  ctx.fillStyle = '#f8ecd2';
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  ctx.font = '700 56px Georgia, "Times New Roman", serif';
  drawCentered(ctx, 'HAPPY BIRTHDAY', COVER_W / 2, COVER_H * 0.78);

  ctx.font = '700 86px Georgia, "Times New Roman", serif';
  drawCentered(ctx, 'AZHAGIII', COVER_W / 2, COVER_H * 0.865);

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(232,196,120,0.88)';
  ctx.fillRect(COVER_W / 2 - 120, COVER_H * 0.905, 240, 1.5);

  ctx.fillStyle = '#1a120c';
  roundRect(ctx, COVER_W / 2 - 28, COVER_H - 78, 56, 22, 2);
  ctx.fill();
  ctx.fillStyle = '#e8c478';
  ctx.font = '700 11px Georgia, "Times New Roman", serif';
  drawCentered(ctx, 'VHS', COVER_W / 2, COVER_H - 63);

  vignette(ctx, COVER_W, COVER_H, 0.38);
  edgeWear(ctx, COVER_W, COVER_H);
  fibers(ctx, COVER_W, COVER_H, 28, 11, 'rgba(90,60,30,0.35)');
  scratches(ctx, COVER_W, COVER_H, 40, 23);
  paperGrain(ctx, COVER_W, COVER_H, 22, 7);

  ctx.strokeStyle = 'rgba(40,24,12,0.55)';
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, COVER_W - 8, COVER_H - 8);

  return c;
}

function spineTitle(ctx, text, x, y0, y1, color) {
  const avail = Math.max(40, y1 - y0);
  ctx.save();
  let size = 110;
  ctx.font = `700 ${size}px Georgia, "Times New Roman", serif`;
  let w = ctx.measureText(text).width || 1;
  size = Math.max(92, Math.min(126, size * (avail / w)));
  ctx.font = `700 ${size}px Georgia, "Times New Roman", serif`;
  w = ctx.measureText(text).width || 1;
  const fit = Math.min(1, avail / w);
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(20,12,6,0.45)';
  ctx.shadowBlur = 4;
  ctx.translate(x, (y0 + y1) / 2);
  ctx.rotate(Math.PI / 2);
  ctx.scale(fit, 1);
  ctx.fillText(text, 0, 0);
  ctx.restore();
  return w * fit;
}

function cutoutPortrait(img) {
  const c = createCanvas(img.width, img.height);
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, c.width, c.height);
  const d = data.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i];
    const g = d[i + 1];
    const b = d[i + 2];
    const avg = (r + g + b) / 3;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (avg > 198 && sat < 40) {
      d[i + 3] = avg > 236 ? 0 : Math.max(0, Math.round((236 - avg) * 8));
    } else if (avg > 188 && sat < 22 && d[i + 3] > 0) {
      d[i + 3] = Math.round(d[i + 3] * 0.35);
    }
  }
  ctx.putImageData(data, 0, 0);

  let minX = c.width;
  let minY = c.height;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3] > 16) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const tw = Math.max(1, maxX - minX + 1);
  const th = Math.max(1, maxY - minY + 1);
  const out = createCanvas(tw, th);
  out.getContext('2d').drawImage(c, minX, minY, tw, th, 0, 0, tw, th);
  return out;
}

function makeSpine(portrait) {
  const c = createCanvas(SPINE_W, SPINE_H);
  const ctx = c.getContext('2d');

  const paper = ctx.createLinearGradient(0, 0, SPINE_W, 0);
  paper.addColorStop(0, '#4a5344');
  paper.addColorStop(0.16, '#6f7b62');
  paper.addColorStop(0.5, '#85906f');
  paper.addColorStop(0.84, '#6a755c');
  paper.addColorStop(1, '#3f473a');
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, SPINE_W, SPINE_H);

  const age = ctx.createLinearGradient(0, 0, 0, SPINE_H);
  age.addColorStop(0, 'rgba(110,88,50,0.22)');
  age.addColorStop(0.45, 'rgba(90,70,40,0.04)');
  age.addColorStop(1, 'rgba(32,22,10,0.34)');
  ctx.fillStyle = age;
  ctx.fillRect(0, 0, SPINE_W, SPINE_H);

  const picW = SPINE_W - 24;
  const picH = Math.round(picW * (portrait.height / portrait.width));
  const picTop = 118;
  const picX = (SPINE_W - picW) / 2;
  const layer = createCanvas(SPINE_W, picTop + picH);
  const lctx = layer.getContext('2d');
  lctx.drawImage(portrait, picX, picTop, picW, picH);
  const fade = lctx.createLinearGradient(0, picTop + picH * 0.58, 0, picTop + picH);
  fade.addColorStop(0, 'rgba(0,0,0,0)');
  fade.addColorStop(1, 'rgba(0,0,0,1)');
  lctx.globalCompositeOperation = 'destination-out';
  lctx.fillStyle = fade;
  lctx.fillRect(0, picTop + picH * 0.58, SPINE_W, picH * 0.42);
  ctx.drawImage(layer, 0, 0);

  const titleTop = picTop + picH + 8;
  const titleBot = SPINE_H - 118;
  const titleLen = spineTitle(
    ctx,
    'HAPPY BIRTHDAY AZHAGIII',
    SPINE_W / 2,
    titleTop,
    titleBot,
    '#f3e6c6'
  );
  const titleMid = (titleTop + titleBot) / 2;
  ctx.fillStyle = 'rgba(232,196,120,0.5)';
  ctx.fillRect(32, titleMid - titleLen / 2 - 20, SPINE_W - 64, 1);
  ctx.fillRect(32, titleMid + titleLen / 2 + 20, SPINE_W - 64, 1);

  ctx.fillStyle = '#1a120c';
  roundRect(ctx, (SPINE_W - 92) / 2, SPINE_H - 78, 92, 36, 3);
  ctx.fill();
  ctx.fillStyle = '#e8c478';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 16px Georgia, "Times New Roman", serif';
  ctx.fillText('VHS', SPINE_W / 2, SPINE_H - 58);

  edgeWear(ctx, SPINE_W, SPINE_H);
  fibers(ctx, SPINE_W, SPINE_H, 44, 41, 'rgba(40,30,16,0.4)');
  scratches(ctx, SPINE_W, SPINE_H, 32, 19);
  paperGrain(ctx, SPINE_W, SPINE_H, 26, 13);

  ctx.strokeStyle = 'rgba(28,16,8,0.55)';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, SPINE_W - 6, SPINE_H - 6);

  return c;
}

const art = await loadImage(join(SRC, 'cover-art.jpg'));
const herPhoto = await loadImage(join(OUT, 'BookImage.png'));
const portrait = cutoutPortrait(herPhoto);
const cover = makeCover(art);
const spine = makeSpine(portrait);

writeFileSync(join(OUT, 'azhagiii-cover.png'), cover.toBuffer('image/png'));
writeFileSync(join(OUT, 'azhagiii-spine.png'), spine.toBuffer('image/png'));
console.log('wrote', COVER_W, 'x', COVER_H, 'cover and', SPINE_W, 'x', SPINE_H, 'spine');
