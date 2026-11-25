// Sizzle & Serve — Warung Rush: mouse and keyboard input.
// One clear job: translate clicks and keys into state calls, nothing else.
// Hit regions come from state.ui, which the renderer rebuilds every frame.

import { INGREDIENTS } from './config.js';
import { setMuted, isMuted, unlockAudio, sfx } from './audio.js';
import { addIngredient, clearPlate, serveReadyDish, startCooking, startShift } from './state.js';

function pointIn(rect, x, y) {
  return rect && x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function handleClick(game, x, y) {
  unlockAudio();
  const ui = game.ui;

  if (game.screen === 'title') {
    if (pointIn(ui.startButton, x, y)) startShift(game);
    return;
  }
  if (game.screen === 'over') {
    if (pointIn(ui.restartButton, x, y)) startShift(game);
    return;
  }
  if (game.screen === 'paused') {
    if (pointIn(ui.resumeButton, x, y)) game.screen = 'playing';
    return;
  }

  // Top bar controls.
  if (pointIn(ui.muteButton, x, y)) {
    setMuted(!isMuted());
    return;
  }
  if (pointIn(ui.pauseButton, x, y)) {
    game.screen = 'paused';
    return;
  }

  // Ingredient bins along the counter.
  for (const ing of INGREDIENTS) {
    if (pointIn(ui[`bin_${ing.id}`], x, y)) {
      addIngredient(game, ing.id);
      return;
    }
  }

  if (pointIn(ui.cookButton, x, y)) {
    startCooking(game);
    return;
  }
  if (pointIn(ui.trashButton, x, y)) {
    clearPlate(game);
    return;
  }

  // Serve the ready dish: click the dish itself or the matching ticket.
  if (game.ready && pointIn(ui.readyDish, x, y)) {
    serveReadyDish(game);
    return;
  }
  for (const order of game.orders) {
    if (pointIn(ui[`order_${order.id}`], x, y)) {
      if (game.ready) serveReadyDish(game, order.id);
      return;
    }
  }
}

export function handleKey(game, key) {
  unlockAudio();
  const k = key.toLowerCase();

  if (k === 'm') {
    setMuted(!isMuted());
    return;
  }

  if (game.screen === 'title' && (key === 'Enter' || key === ' ')) {
    startShift(game);
    return;
  }
  if (game.screen === 'over' && (key === 'Enter' || k === 'r')) {
    startShift(game);
    return;
  }
  if (k === 'p' && (game.screen === 'playing' || game.screen === 'paused')) {
    game.screen = game.screen === 'playing' ? 'paused' : 'playing';
    return;
  }
  if (game.screen !== 'playing') return;

  const ing = INGREDIENTS.find((i) => i.key === k);
  if (ing) {
    addIngredient(game, ing.id);
    return;
  }
  if (key === ' ' || k === 'c') startCooking(game);
  else if (k === 's') serveReadyDish(game);
  else if (k === 't') clearPlate(game);
}

// Expose a tiny debug handle for the play-test script.
export function attachDebug(game) {
  window.__game = game;
}
