// Sizzle & Serve — Warung Rush: every pixel the player sees.
// One clear job: draw the kitchen from state, and record the click regions
// in game.ui so input can answer them. Drawing never changes game state.

import { COLORS, INGREDIENTS, RECIPES, VIEW_H, VIEW_W, ingredientById, recipeById, recipeForPlate } from './config.js';
import { formatClock, plateRecipe } from './state.js';
import { isMuted } from './audio.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = '700', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(str, x, y);
}

function drawIngredient(ctx, id, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (id === 'nasi') {
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath();
    ctx.arc(0, 2, r, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d9c48f';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#e8d9a8';
    for (const [dx, dy] of [[-r * 0.4, -r * 0.3], [0, -r * 0.55], [r * 0.4, -r * 0.25]]) {
      ctx.beginPath();
      ctx.arc(dx, dy, r * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (id === 'telur') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd93b';
    ctx.beginPath();
    ctx.arc(0, -r * 0.05, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0a500';
    ctx.beginPath();
    ctx.arc(-r * 0.12, -r * 0.18, r * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (id === 'ayam') {
    ctx.fillStyle = '#c98a4b';
    ctx.beginPath();
    ctx.arc(-r * 0.15, r * 0.1, r * 0.62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a8642f';
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.05, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fdf6e3';
    ctx.lineWidth = r * 0.16;
    ctx.beginPath();
    ctx.moveTo(r * 0.35, -r * 0.3);
    ctx.lineTo(r * 0.75, -r * 0.7);
    ctx.moveTo(r * 0.35, -r * 0.3);
    ctx.lineTo(r * 0.8, -r * 0.15);
    ctx.stroke();
  } else if (id === 'mie') {
    ctx.strokeStyle = '#f7c948';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.8, i * r * 0.45);
      ctx.bezierCurveTo(-r * 0.3, i * r * 0.45 - r * 0.4, r * 0.3, i * r * 0.45 + r * 0.4, r * 0.8, i * r * 0.45);
      ctx.stroke();
    }
  } else if (id === 'sayur') {
    ctx.fillStyle = '#58b368';
    for (const [dx, dy, rot] of [[-r * 0.35, 0, -0.6], [0, -r * 0.25, 0], [r * 0.35, 0, 0.6]]) {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.28, r * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#2f7d3d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.3);
    ctx.lineTo(0, r * 0.7);
    ctx.stroke();
  } else if (id === 'sambal') {
    ctx.fillStyle = '#e4572e';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.8);
    ctx.quadraticCurveTo(r * 0.55, -r * 0.1, r * 0.35, r * 0.55);
    ctx.quadraticCurveTo(0, r * 0.85, -r * 0.35, r * 0.55);
    ctx.quadraticCurveTo(-r * 0.55, -r * 0.1, 0, -r * 0.8);
    ctx.fill();
    ctx.fillStyle = '#a93226';
    ctx.beginPath();
    ctx.arc(0, r * 0.05, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#58b368';
    ctx.fillRect(-r * 0.12, -r * 1.05, r * 0.24, r * 0.35);
  }
  ctx.restore();
}

function drawPlate(ctx, x, y, rx, ry, items) {
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(x, y + ry + 6, rx * 0.95, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.plate;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8cdb4';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#fdf6e3';
  ctx.beginPath();
  ctx.ellipse(x, y, rx * 0.68, ry * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  const spots = [[-rx * 0.32, -ry * 0.15], [0, -ry * 0.3], [rx * 0.32, -ry * 0.1], [-rx * 0.18, ry * 0.28], [rx * 0.22, ry * 0.3]];
  items.forEach((id, i) => {
    const [dx, dy] = spots[i % spots.length];
    drawIngredient(ctx, id, x + dx, y + dy, 22);
  });
}

function drawKitchenBack(ctx, time) {
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Terracotta tile band behind the counter.
  ctx.fillStyle = COLORS.tile;
  ctx.fillRect(0, 196, VIEW_W, 64);
  ctx.fillStyle = 'rgba(255,255,255,0.14)';
  for (let x = 0; x < VIEW_W; x += 64) ctx.fillRect(x, 196, 2, 64);
  ctx.fillRect(0, 227, VIEW_W, 2);
  // Sunny window on the wall.
  ctx.fillStyle = '#bfe3f0';
  rr(ctx, 1080, 66, 150, 104, 10);
  ctx.fill();
  ctx.strokeStyle = COLORS.woodDark;
  ctx.lineWidth = 6;
  rr(ctx, 1080, 66, 150, 104, 10);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1155, 66);
  ctx.lineTo(1155, 170);
  ctx.moveTo(1080, 118);
  ctx.lineTo(1230, 118);
  ctx.stroke();
  ctx.fillStyle = '#ffd93b';
  ctx.beginPath();
  ctx.arc(1115, 92, 14, 0, Math.PI * 2);
  ctx.fill();
  // Hanging pans, gently swaying, clear of the tickets and the window.
  const sway = Math.sin(time * 0.8) * 3;
  ctx.strokeStyle = COLORS.woodDark;
  ctx.lineWidth = 4;
  for (const [px, pr] of [[978, 26], [1032, 20]]) {
    ctx.beginPath();
    ctx.moveTo(px, 56);
    ctx.lineTo(px + sway, 76);
    ctx.stroke();
    ctx.fillStyle = '#5b6066';
    ctx.beginPath();
    ctx.arc(px + sway, 76 + pr, pr, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3c4043';
    ctx.beginPath();
    ctx.arc(px + sway, 76 + pr, pr * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  // Wooden counter top.
  ctx.fillStyle = COLORS.wood;
  ctx.fillRect(0, 470, VIEW_W, 26);
  ctx.fillStyle = COLORS.woodLight;
  ctx.fillRect(0, 470, VIEW_W, 6);
}

function drawTopBar(ctx, game) {
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(0, 0, VIEW_W, 56);
  text(ctx, 'SIZZLE & SERVE', 20, 36, 24, COLORS.gold, '800');
  text(ctx, 'Warung Rush', 258, 36, 16, COLORS.cream, '600');
  // Hearts.
  for (let i = 0; i < 3; i++) {
    const x = 400 + i * 34;
    ctx.fillStyle = i < game.hearts ? COLORS.red : '#5a4636';
    ctx.beginPath();
    ctx.moveTo(x, 36);
    ctx.bezierCurveTo(x - 14, 24, x - 12, 12, x, 18);
    ctx.bezierCurveTo(x + 12, 12, x + 14, 24, x, 36);
    ctx.closePath();
    ctx.fill();
  }
  // Shift clock, big and always visible.
  const urgent = game.shiftLeft <= 30;
  ctx.fillStyle = urgent ? COLORS.red : COLORS.cream;
  rr(ctx, 560, 8, 150, 40, 8);
  ctx.fill();
  text(ctx, `SHIFT ${formatClock(game.shiftLeft)}`, 635, 35, 22, urgent ? '#fff' : COLORS.ink, '800', 'center');
  text(ctx, `KOINS ${game.coins}`, 760, 36, 20, COLORS.gold, '800');
  text(ctx, `SKOR ${game.score}`, 900, 36, 20, COLORS.cream, '700');
  if (game.combo >= 2) text(ctx, `KOMBO x${game.combo}`, 1030, 36, 18, '#7CFC00', '800');
  // Mute and pause buttons.
  game.ui.muteButton = { x: 1170, y: 10, w: 40, h: 36 };
  game.ui.pauseButton = { x: 1218, y: 10, w: 40, h: 36 };
  for (const [rect, label] of [[game.ui.muteButton, isMuted() ? 'MUTE' : 'SUARA'], [game.ui.pauseButton, 'JEDA']]) {
    ctx.fillStyle = '#4a3a28';
    rr(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    text(ctx, label, rect.x + rect.w / 2, rect.y + 24, 11, COLORS.cream, '800', 'center');
  }
}

function drawOrders(ctx, game) {
  text(ctx, 'PAPAN ORDER', 20, 84, 16, COLORS.ink, '800');
  text(ctx, 'Klik tiket untuk menyajikan hidangan yang cocok', 150, 84, 13, COLORS.muted, '600');
  const slotW = 300;
  const gap = 14;
  for (let i = 0; i < 3; i++) {
    const x = 20 + i * (slotW + gap);
    const y = 94;
    const order = game.orders[i];
    ctx.fillStyle = order ? COLORS.board : '#e3d3ae';
    rr(ctx, x, y, slotW, 92, 10);
    ctx.fill();
    if (!order) {
      ctx.strokeStyle = '#c9b586';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      rr(ctx, x + 6, y + 6, slotW - 12, 80, 8);
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'Menunggu pelanggan…', x + slotW / 2, y + 52, 14, COLORS.muted, '600', 'center');
      continue;
    }
    const recipe = recipeById(order.recipeId);
    game.ui[`order_${order.id}`] = { x, y, w: slotW, h: 92 };
    const frac = Math.max(0, order.patience / order.maxPatience);
    const barColor = frac > 0.5 ? COLORS.green : frac > 0.25 ? COLORS.gold : COLORS.red;
    text(ctx, `#${order.id}  ${recipe.name}`, x + 14, y + 28, 17, COLORS.chalk, '800');
    recipe.needs.forEach((id, j) => {
      drawIngredient(ctx, id, x + 30 + j * 44, y + 52, 14);
    });
    text(ctx, `${recipe.coins} koin`, x + 178, y + 58, 14, COLORS.gold, '800');
    // Patience bar.
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    rr(ctx, x + 14, y + 70, slotW - 28, 10, 5);
    ctx.fill();
    ctx.fillStyle = barColor;
    rr(ctx, x + 14, y + 70, (slotW - 28) * frac, 10, 5);
    ctx.fill();
    if (game.ready && game.ready.recipeId === order.recipeId) {
      ctx.strokeStyle = COLORS.gold;
      ctx.lineWidth = 4;
      rr(ctx, x + 2, y + 2, slotW - 4, 88, 10);
      ctx.stroke();
      text(ctx, 'SIAP DISAJIKAN!', x + slotW - 14, y + 28, 12, COLORS.gold, '800', 'right');
    }
  }
}

function drawStove(ctx, game) {
  const x = 40;
  const y = 300;
  text(ctx, 'KOMPOR', x, y - 8, 15, COLORS.ink, '800');
  ctx.fillStyle = '#3c4043';
  rr(ctx, x, y, 300, 150, 12);
  ctx.fill();
  // Two burners; the left one holds the wok.
  for (const bx of [x + 75, x + 225]) {
    ctx.fillStyle = '#22252a';
    ctx.beginPath();
    ctx.ellipse(bx, y + 78, 58, 16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  const cooking = game.cooking;
  const flick = 0.75 + Math.sin(game.time * 14) * 0.25;
  if (cooking) {
    ctx.fillStyle = COLORS.flame;
    ctx.globalAlpha = flick;
    ctx.beginPath();
    ctx.moveTo(x + 45, y + 78);
    ctx.quadraticCurveTo(x + 75, y + 20, x + 105, y + 78);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  // Wok with the dish inside.
  ctx.fillStyle = '#6b7280';
  ctx.beginPath();
  ctx.ellipse(x + 75, y + 62, 62, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#4b5563';
  ctx.beginPath();
  ctx.ellipse(x + 75, y + 58, 52, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  if (cooking) {
    const recipe = recipeById(cooking.recipeId);
    recipe.needs.forEach((id, i) => drawIngredient(ctx, id, x + 52 + i * 24, y + 56, 11));
    const frac = 1 - cooking.left / cooking.total;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    rr(ctx, x + 14, y + 108, 272, 16, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.flame;
    rr(ctx, x + 14, y + 108, 272 * frac, 16, 8);
    ctx.fill();
    text(ctx, `Memasak ${recipe.name}… ${Math.ceil(cooking.left)} dtk`, x + 150, y + 140, 14, COLORS.cream, '700', 'center');
  } else {
    text(ctx, game.ready ? 'Wajan kosong — sajikan hidangannya!' : 'Wajan siap — rakit piring lalu MASAK', x + 150, y + 126, 13, '#b9c0c7', '600', 'center');
  }
}

function drawPlateArea(ctx, game) {
  const cx = 640;
  const cy = 372;
  text(ctx, 'PIRING RAKITAN', cx, 292, 15, COLORS.ink, '800', 'center');
  drawPlate(ctx, cx, cy, 150, 52, game.plate);
  const recipe = plateRecipe(game);
  if (game.plate.length === 0) {
    text(ctx, 'Klik bahan di bawah untuk merakit hidangan', cx, cy + 84, 14, COLORS.muted, '600', 'center');
  } else if (recipe) {
    text(ctx, `${recipe.name} — resep cocok!`, cx, cy + 84, 16, COLORS.teal, '800', 'center');
  } else {
    text(ctx, `Racikan: ${game.plate.map((id) => ingredientById(id).name).join(' + ')}`, cx, cy + 84, 15, COLORS.ink, '700', 'center');
  }
  // Cook and trash buttons sit beside the plate, so the status line
  // under the plate is never covered by them.
  game.ui.cookButton = { x: cx - 288, y: 352, w: 130, h: 40 };
  game.ui.trashButton = { x: cx + 158, y: 352, w: 120, h: 40 };
  const canCook = !!recipe && !game.cooking && !game.ready;
  ctx.fillStyle = canCook ? COLORS.flame : '#b9ac93';
  rr(ctx, game.ui.cookButton.x, game.ui.cookButton.y, 130, 40, 10);
  ctx.fill();
  text(ctx, 'MASAK [Spasi]', game.ui.cookButton.x + 65, game.ui.cookButton.y + 26, 13, '#fff', '800', 'center');
  ctx.fillStyle = '#8a7a63';
  rr(ctx, game.ui.trashButton.x, game.ui.trashButton.y, 120, 40, 10);
  ctx.fill();
  text(ctx, 'BUANG  [T]', game.ui.trashButton.x + 60, game.ui.trashButton.y + 26, 15, '#fff', '800', 'center');
}

function drawServingWindow(ctx, game) {
  const x = 940;
  const y = 300;
  text(ctx, 'JENDELA SAJI', x, y - 8, 15, COLORS.ink, '800');
  ctx.fillStyle = '#fff3d6';
  rr(ctx, x, y, 300, 150, 12);
  ctx.fill();
  ctx.strokeStyle = COLORS.woodDark;
  ctx.lineWidth = 4;
  rr(ctx, x, y, 300, 150, 12);
  ctx.stroke();
  if (game.ready) {
    const recipe = recipeById(game.ready.recipeId);
    // Steam.
    ctx.strokeStyle = 'rgba(120,120,120,0.5)';
    ctx.lineWidth = 3;
    for (const sx of [x + 120, x + 150, x + 180]) {
      ctx.beginPath();
      ctx.moveTo(sx, y + 46);
      ctx.quadraticCurveTo(sx + 6, y + 30, sx - 4, y + 16);
      ctx.stroke();
    }
    drawPlate(ctx, x + 150, y + 72, 110, 38, recipe.needs);
    game.ui.readyDish = { x: x + 20, y: y + 14, w: 260, h: 90 };
    text(ctx, `${recipe.name} — SIAP!`, x + 150, y + 122, 16, COLORS.teal, '800', 'center');
    text(ctx, 'Klik hidangan atau tiketnya untuk menyajikan  [S]', x + 150, y + 141, 12, COLORS.muted, '600', 'center');
  } else {
    game.ui.readyDish = null;
    text(ctx, 'Belum ada hidangan matang.', x + 150, y + 78, 15, COLORS.muted, '600', 'center');
    text(ctx, 'Hidangan yang selesai dimasak muncul di sini.', x + 150, y + 100, 12, COLORS.muted, '600', 'center');
  }
}

function drawBins(ctx, game) {
  text(ctx, 'BAHAN DI MEJA  —  klik atau tekan 1–6', 20, 516, 15, COLORS.ink, '800');
  const binW = 196;
  const gap = 14;
  INGREDIENTS.forEach((ing, i) => {
    const x = 20 + i * (binW + gap);
    const y = 526;
    const onPlate = game.plate.includes(ing.id);
    ctx.fillStyle = onPlate ? '#ffe9a8' : COLORS.cream;
    rr(ctx, x, y, binW, 128, 12);
    ctx.fill();
    ctx.strokeStyle = onPlate ? COLORS.gold : '#d8cdb4';
    ctx.lineWidth = onPlate ? 4 : 2;
    rr(ctx, x, y, binW, 128, 12);
    ctx.stroke();
    game.ui[`bin_${ing.id}`] = { x, y, w: binW, h: 128 };
    // Bowl.
    ctx.fillStyle = '#e8e0cc';
    ctx.beginPath();
    ctx.arc(x + binW / 2, y + 58, 46, 0, Math.PI);
    ctx.closePath();
    ctx.fill();
    drawIngredient(ctx, ing.id, x + binW / 2, y + 52, 30);
    text(ctx, ing.name, x + binW / 2, y + 102, 17, COLORS.ink, '800', 'center');
    ctx.fillStyle = COLORS.ink;
    rr(ctx, x + binW / 2 - 15, y + 110, 30, 18, 5);
    ctx.fill();
    text(ctx, ing.key, x + binW / 2, y + 124, 12, '#fff', '800', 'center');
  });
}

function drawToast(ctx, game) {
  if (!game.toast || game.time > game.toast.until) return;
  const w = Math.min(720, 20 + game.toast.text.length * 8.4);
  ctx.fillStyle = 'rgba(51,38,26,0.92)';
  rr(ctx, (VIEW_W - w) / 2, 668, w, 36, 18);
  ctx.fill();
  text(ctx, game.toast.text, VIEW_W / 2, 691, 15, '#fff8e7', '700', 'center');
}

function drawFlash(ctx, game) {
  if (!game.flash || game.time > game.flash.until) return;
  ctx.fillStyle = game.flash.kind === 'good' ? 'rgba(76,175,109,0.12)' : 'rgba(214,69,65,0.14)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
}

function drawTitle(ctx, game) {
  ctx.fillStyle = 'rgba(51,38,26,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.cream;
  rr(ctx, 240, 90, 800, 540, 20);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 5;
  rr(ctx, 240, 90, 800, 540, 20);
  ctx.stroke();
  text(ctx, 'SIZZLE & SERVE', 640, 170, 54, COLORS.ink, '800', 'center');
  text(ctx, 'Warung Rush — game memasak paling seru sedapur ini', 640, 208, 20, COLORS.muted, '600', 'center');
  text(ctx, 'Cara main', 640, 258, 20, COLORS.teal, '800', 'center');
  const lines = [
    '1.  Baca papan order — tiap pelanggan minta hidangan tertentu.',
    '2.  Klik bahan di meja (atau tekan 1–6) untuk merakitnya di piring.',
    '3.  Tekan MASAK, tunggu wajan selesai, lalu SAJIKAN sebelum sabar habis.',
    '4.  Sajikan cepat untuk tip, jaga kombo, dan bertahan satu shift penuh!',
  ];
  lines.forEach((line, i) => text(ctx, line, 640, 292 + i * 30, 16, COLORS.ink, '600', 'center'));
  text(ctx, 'Resep hari ini:', 640, 432, 16, COLORS.ink, '800', 'center');
  RECIPES.forEach((r, i) => {
    const x = 330 + (i % 3) * 230;
    const y = 446 + Math.floor(i / 3) * 50;
    // Icons in a row above the name, so nothing overlaps.
    r.needs.forEach((id, j) => drawIngredient(ctx, id, x + 85 + j * 30, y + 10, 11));
    text(ctx, r.name, x + 115, y + 32, 13, COLORS.ink, '700', 'center');
    text(ctx, `${r.coins} koin`, x + 115, y + 48, 12, COLORS.muted, '600', 'center');
  });
  game.ui.startButton = { x: 490, y: 552, w: 300, h: 56 };
  ctx.fillStyle = COLORS.flame;
  rr(ctx, 490, 552, 300, 56, 14);
  ctx.fill();
  text(ctx, 'MULAI SHIFT  [Enter]', 640, 589, 22, '#fff', '800', 'center');
}

function drawPaused(ctx, game) {
  ctx.fillStyle = 'rgba(51,38,26,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  text(ctx, 'JEDA', 640, 330, 54, '#fff', '800', 'center');
  text(ctx, 'Tekan P atau klik untuk lanjut memasak', 640, 372, 18, '#fff8e7', '600', 'center');
  game.ui.resumeButton = { x: 540, y: 400, w: 200, h: 50 };
  ctx.fillStyle = COLORS.flame;
  rr(ctx, 540, 400, 200, 50, 12);
  ctx.fill();
  text(ctx, 'LANJUT', 640, 433, 20, '#fff', '800', 'center');
}

function drawGameOver(ctx, game) {
  ctx.fillStyle = 'rgba(51,38,26,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.cream;
  rr(ctx, 340, 130, 600, 460, 20);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 5;
  rr(ctx, 340, 130, 600, 460, 20);
  ctx.stroke();
  text(ctx, game.hearts <= 0 ? 'WARUNG TUTUP!' : 'SHIFT SELESAI!', 640, 200, 44, COLORS.ink, '800', 'center');
  text(ctx, game.hearts <= 0 ? 'Terlalu banyak pelanggan kecewa.' : 'Kerja bagus, koki! Dapur bersih, pelanggan senang.', 640, 236, 17, COLORS.muted, '600', 'center');
  const rows = [
    ['Skor akhir', String(game.score)],
    ['Koin didapat', `${game.coins} koin`],
    ['Hidangan tersaji', String(game.stats.served)],
    ['Pelanggan pergi', String(game.stats.expired)],
    ['Kombo terbaik', `x${game.bestCombo}`],
  ];
  rows.forEach(([label, value], i) => {
    const y = 292 + i * 40;
    text(ctx, label, 420, y, 18, COLORS.ink, '600');
    text(ctx, value, 860, y, 18, COLORS.teal, '800', 'right');
  });
  game.ui.restartButton = { x: 490, y: 500, w: 300, h: 56 };
  ctx.fillStyle = COLORS.flame;
  rr(ctx, 490, 500, 300, 56, 14);
  ctx.fill();
  text(ctx, 'MAIN LAGI  [Enter]', 640, 537, 22, '#fff', '800', 'center');
}

export function render(ctx, game) {
  game.ui = {};
  drawKitchenBack(ctx, game.time);
  drawTopBar(ctx, game);
  drawOrders(ctx, game);
  drawStove(ctx, game);
  drawPlateArea(ctx, game);
  drawServingWindow(ctx, game);
  drawBins(ctx, game);
  drawToast(ctx, game);
  drawFlash(ctx, game);
  if (game.screen === 'title') drawTitle(ctx, game);
  else if (game.screen === 'paused') drawPaused(ctx, game);
  else if (game.screen === 'over') drawGameOver(ctx, game);
}
