// Sizzle & Serve — Warung Rush: entry point and frame loop.
// One clear job: own the canvas, the clock and the wiring between modules.

import { VIEW_H, VIEW_W } from './config.js';
import { newGame, update } from './state.js';
import { render } from './render.js';
import { attachDebug, handleClick, handleKey } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') ?? 1) || 1;
const game = newGame(seed);
attachDebug(game);

// A ?shot= URL puts the game into a fixed state for screenshots.
const shot = params.get('shot');
if (shot) applyShot(game, shot, seed);

function fitCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = VIEW_W * dpr;
  canvas.height = VIEW_H * dpr;
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function scaleMouse(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * VIEW_W,
    y: ((event.clientY - rect.top) / rect.height) * VIEW_H,
  };
}

canvas.addEventListener('click', (event) => {
  const { x, y } = scaleMouse(event);
  handleClick(game, x, y);
});

window.addEventListener('keydown', (event) => {
  if ([' ', 'ArrowUp', 'ArrowDown'].includes(event.key)) event.preventDefault();
  handleKey(game, event.key);
});

window.addEventListener('resize', fitCanvas);
fitCanvas();

function announce() {
  if (!statusEl) return;
  const ready = game.ready ? ` ${game.ready.recipeId} siap disajikan.` : '';
  statusEl.textContent =
    game.screen === 'playing'
      ? `Bermain. Skor ${game.score}, koin ${game.coins}, ${game.orders.length} order aktif.${ready}`
      : game.screen;
}

let last = performance.now();
let announcedAt = 0;

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  // A ?shot= URL freezes the clock so a screenshot shows the exact state
  // the shot set up, instead of the dish finishing mid-capture.
  if (!shot) update(game, dt);
  render(ctx, game);
  if (now - announcedAt > 1000) {
    announce();
    announcedAt = now;
  }
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
