/**
 * Exports CarromBed.png — play bed only, exact physics coords (BOARD 500).
 * Run: node scripts/generate-carrom-bed.mjs
 */
import { createCanvas } from 'canvas';
import { writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'photos', 'CarromBed.png');

const BOARD = 500;
const POCKET_R = 24;
const BASELINE_Y = BOARD - 75;
const BASE_MIN = 75;
const BASE_MAX = BOARD - 75;
const POCKET_INSET = 4;
const POCKETS = [
  { x: POCKET_R + POCKET_INSET, y: POCKET_R + POCKET_INSET },
  { x: BOARD - POCKET_R - POCKET_INSET, y: POCKET_R + POCKET_INSET },
  { x: POCKET_R + POCKET_INSET, y: BOARD - POCKET_R - POCKET_INSET },
  { x: BOARD - POCKET_R - POCKET_INSET, y: BOARD - POCKET_R - POCKET_INSET },
];

const SCALE = 2; // retina

function fillGlossHeart(c, x, y, s) {
  c.save();
  c.translate(x, y);
  c.beginPath();
  c.moveTo(0, s * 0.82);
  c.bezierCurveTo(-s * 1.05, s * 0.12, -s * 1.0, -s * 0.72, 0, -s * 0.32);
  c.bezierCurveTo(s * 1.0, -s * 0.72, s * 1.05, s * 0.12, 0, s * 0.82);
  c.closePath();
  const hg = c.createRadialGradient(-s * 0.25, -s * 0.35, s * 0.08, 0, 0, s);
  hg.addColorStop(0, '#ffb8d8');
  hg.addColorStop(0.45, '#ef4a9a');
  hg.addColorStop(1, '#9a2060');
  c.fillStyle = hg;
  c.shadowColor = 'rgba(120, 30, 70, 0.35)';
  c.shadowBlur = 4;
  c.shadowOffsetY = 1;
  c.fill();
  c.shadowColor = 'transparent';
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.beginPath();
  c.ellipse(-s * 0.28, -s * 0.32, s * 0.22, s * 0.14, -0.45, 0, Math.PI * 2);
  c.fill();
  c.restore();
}

function paint3DBoard(c) {
  const bed = c.createLinearGradient(0, 0, BOARD, BOARD);
  bed.addColorStop(0, '#fff6ec');
  bed.addColorStop(0.35, '#f6e2c8');
  bed.addColorStop(0.7, '#efd5b4');
  bed.addColorStop(1, '#e8c9a4');
  c.fillStyle = bed;
  c.fillRect(0, 0, BOARD, BOARD);

  c.strokeStyle = 'rgba(150, 95, 55, 0.055)';
  c.lineWidth = 1;
  for (let y = 5; y < BOARD; y += 9) {
    c.beginPath();
    c.moveTo(0, y + ((y * 7) % 3) * 0.4);
    c.lineTo(BOARD, y);
    c.stroke();
  }

  const topShade = c.createLinearGradient(0, 0, 0, 22);
  topShade.addColorStop(0, 'rgba(255,255,255,0.35)');
  topShade.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = topShade;
  c.fillRect(0, 0, BOARD, 22);
  const botShade = c.createLinearGradient(0, BOARD - 28, 0, BOARD);
  botShade.addColorStop(0, 'rgba(90,40,50,0)');
  botShade.addColorStop(1, 'rgba(90,40,50,0.16)');
  c.fillStyle = botShade;
  c.fillRect(0, BOARD - 28, BOARD, 28);

  POCKETS.forEach((p, i) => {
    const rot = [(-45 * Math.PI) / 180, (45 * Math.PI) / 180, (-135 * Math.PI) / 180, (135 * Math.PI) / 180][i];
    c.save();
    c.translate(p.x, p.y);
    c.rotate(rot);
    c.beginPath();
    c.moveTo(0, POCKET_R * 1.08);
    c.bezierCurveTo(-POCKET_R * 1.28, POCKET_R * 0.14, -POCKET_R * 1.2, -POCKET_R * 0.95, 0, -POCKET_R * 0.4);
    c.bezierCurveTo(POCKET_R * 1.2, -POCKET_R * 0.95, POCKET_R * 1.28, POCKET_R * 0.14, 0, POCKET_R * 1.08);
    c.closePath();
    const gold = c.createLinearGradient(-POCKET_R, -POCKET_R, POCKET_R, POCKET_R);
    gold.addColorStop(0, '#fff6d0');
    gold.addColorStop(0.3, '#f0c45a');
    gold.addColorStop(0.65, '#d4a030');
    gold.addColorStop(1, '#8a6010');
    c.fillStyle = gold;
    c.shadowColor = 'rgba(160, 100, 20, 0.5)';
    c.shadowBlur = 8;
    c.fill();
    c.shadowColor = 'transparent';
    c.strokeStyle = 'rgba(255, 240, 180, 0.7)';
    c.lineWidth = 1.5;
    c.stroke();
    c.beginPath();
    c.moveTo(0, POCKET_R * 0.7);
    c.bezierCurveTo(-POCKET_R * 0.88, POCKET_R * 0.05, -POCKET_R * 0.84, -POCKET_R * 0.64, 0, -POCKET_R * 0.22);
    c.bezierCurveTo(POCKET_R * 0.84, -POCKET_R * 0.64, POCKET_R * 0.88, POCKET_R * 0.05, 0, POCKET_R * 0.7);
    c.closePath();
    const velvet = c.createRadialGradient(-2, -5, 1, 0, 2, POCKET_R * 0.85);
    velvet.addColorStop(0, '#7a2058');
    velvet.addColorStop(0.55, '#3a1028');
    velvet.addColorStop(1, '#0e050a');
    c.fillStyle = velvet;
    c.fill();
    c.restore();
  });

  const ink = '#e23a8a';
  c.strokeStyle = ink;
  c.fillStyle = ink;
  c.lineWidth = 2.4;
  c.lineCap = 'round';
  c.lineJoin = 'round';

  c.strokeRect(48, 48, BOARD - 96, BOARD - 96);
  c.lineWidth = 1.6;
  c.strokeRect(58, 58, BOARD - 116, BOARD - 116);
  c.lineWidth = 2.4;

  const cx = BOARD / 2;
  const cy = BOARD / 2;

  c.beginPath();
  c.arc(cx, cy, 76, 0, Math.PI * 2);
  c.stroke();
  c.beginPath();
  c.arc(cx, cy, 42, 0, Math.PI * 2);
  c.stroke();

  [
    [0, -16],
    [0, 16],
    [-16, 0],
    [14, 0],
  ].forEach(([ox, oy]) => fillGlossHeart(c, cx + ox * 0.4, cy + oy * 0.4, 11));

  c.fillStyle = '#ef4a9a';
  for (let a = 0; a < 8; a++) {
    const ang = (a * Math.PI) / 4 + Math.PI / 8;
    const dx = Math.cos(ang) * 28;
    const dy = Math.sin(ang) * 28;
    c.save();
    c.translate(cx + dx, cy + dy);
    c.rotate(Math.PI / 4);
    c.fillRect(-2.2, -2.2, 4.4, 4.4);
    c.restore();
  }

  c.fillStyle = '#f0c24a';
  [
    [cx, cy - 58],
    [cx, cy + 58],
    [cx - 58, cy],
    [cx + 58, cy],
  ].forEach(([x, y]) => {
    c.save();
    c.translate(x, y);
    c.rotate(Math.PI / 4);
    c.fillRect(-4.5, -4.5, 9, 9);
    c.restore();
  });

  const drawBaseH = (y0, y1) => {
    c.strokeStyle = ink;
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(BASE_MIN, y0);
    c.lineTo(BASE_MAX, y0);
    c.moveTo(BASE_MIN, y1);
    c.lineTo(BASE_MAX, y1);
    c.stroke();
    const midY = (y0 + y1) / 2;
    [BASE_MIN, BASE_MAX].forEach((x) => {
      const g = c.createRadialGradient(x - 3, midY - 3, 1, x, midY, 12);
      g.addColorStop(0, '#ff8ec0');
      g.addColorStop(0.55, '#e23a8a');
      g.addColorStop(1, '#a01858');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, midY, 12, 0, Math.PI * 2);
      c.fill();
    });
    fillGlossHeart(c, BOARD / 2, midY, 8);
  };
  const drawBaseV = (x0, x1) => {
    c.strokeStyle = ink;
    c.fillStyle = ink;
    c.beginPath();
    c.moveTo(x0, BASE_MIN);
    c.lineTo(x0, BASE_MAX);
    c.moveTo(x1, BASE_MIN);
    c.lineTo(x1, BASE_MAX);
    c.stroke();
    const midX = (x0 + x1) / 2;
    [BASE_MIN, BASE_MAX].forEach((y) => {
      const g = c.createRadialGradient(midX - 3, y - 3, 1, midX, y, 12);
      g.addColorStop(0, '#ff8ec0');
      g.addColorStop(0.55, '#e23a8a');
      g.addColorStop(1, '#a01858');
      c.fillStyle = g;
      c.beginPath();
      c.arc(midX, y, 12, 0, Math.PI * 2);
      c.fill();
    });
    fillGlossHeart(c, midX, BOARD / 2, 8);
  };
  drawBaseH(BASELINE_Y - 10, BASELINE_Y + 10);
  drawBaseH(75 - 10, 75 + 10);
  drawBaseV(75 - 10, 75 + 10);
  drawBaseV(BOARD - 75 - 10, BOARD - 75 + 10);

  c.strokeStyle = ink;
  c.lineWidth = 2;
  [
    [BASE_MIN + 4, BASE_MIN + 4, POCKETS[0].x + 8, POCKETS[0].y + 8],
    [BASE_MAX - 4, BASE_MIN + 4, POCKETS[1].x - 8, POCKETS[1].y + 8],
    [BASE_MIN + 4, BASE_MAX - 4, POCKETS[2].x + 8, POCKETS[2].y - 8],
    [BASE_MAX - 4, BASE_MAX - 4, POCKETS[3].x - 8, POCKETS[3].y - 8],
  ].forEach(([x0, y0, x1, y1]) => {
    c.beginPath();
    c.moveTo(x0, y0);
    c.lineTo(x1, y1);
    c.stroke();
    const ang = Math.atan2(y1 - y0, x1 - x0);
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x1 - Math.cos(ang - 0.45) * 8, y1 - Math.sin(ang - 0.45) * 8);
    c.moveTo(x1, y1);
    c.lineTo(x1 - Math.cos(ang + 0.45) * 8, y1 - Math.sin(ang + 0.45) * 8);
    c.stroke();
  });

  const vig = c.createRadialGradient(cx, cy, BOARD * 0.35, cx, cy, BOARD * 0.72);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(80, 30, 50, 0.07)');
  c.fillStyle = vig;
  c.fillRect(0, 0, BOARD, BOARD);
}

const canvas = createCanvas(BOARD * SCALE, BOARD * SCALE);
const ctx = canvas.getContext('2d');
ctx.scale(SCALE, SCALE);
paint3DBoard(ctx);

writeFileSync(OUT, canvas.toBuffer('image/png'));
console.log(`Wrote ${OUT} (${BOARD * SCALE}×${BOARD * SCALE}, physics BOARD=${BOARD})`);
