// Sizzle & Serve — Warung Rush: deterministic states for screenshots.
// One clear job: given ?shot=<name>&seed=<n>, put the real game into the
// exact state a screenshot should show. No fake overlays, no drawn-on
// images: these are the game's own screens, driven by its own state.

import { recipeById } from './config.js';
import { newGame } from './state.js';

// Every shot is a real render of the game's own code in a browser.
export function applyShot(game, name, seed) {
  const fresh = newGame(seed);
  Object.assign(game, fresh);

  if (name === 'start') {
    game.screen = 'title';
    return;
  }

  game.screen = 'playing';
  game.time = 43;
  game.shiftLeft = 107;
  game.coins = 86;
  game.score = 1240;
  game.served = 7;
  game.combo = 3;
  game.bestCombo = 4;
  game.orders = [
    { id: 1, recipeId: 'nasi-goreng', patience: 26, maxPatience: 42, bornAt: 20 },
    { id: 2, recipeId: 'ayam-geprek', patience: 11, maxPatience: 42, bornAt: 32 },
    { id: 3, recipeId: 'mie-goreng', patience: 38, maxPatience: 42, bornAt: 41 },
  ];
  game.nextOrderId = 4;

  if (name === 'play') {
    // Mid-assembly: two of three ingredients on the plate, one dish frying.
    game.plate = ['nasi', 'telur'];
    game.cooking = { recipeId: 'mie-ayam', left: 1.4, total: 3.4 };
    game.toast = { text: 'Mie Ayam Pedas sedang dimasak…', until: 9999 };
    return;
  }

  if (name === 'serve') {
    // A finished dish waits in the serving window; its ticket is highlighted.
    game.ready = { recipeId: 'nasi-ayam' };
    game.orders = [
      { id: 1, recipeId: 'nasi-ayam', patience: 24, maxPatience: 42, bornAt: 22 },
      { id: 2, recipeId: 'ayam-geprek', patience: 9, maxPatience: 42, bornAt: 34 },
      { id: 3, recipeId: 'mie-goreng', patience: 36, maxPatience: 42, bornAt: 42 },
    ];
    game.toast = { text: 'Nasi Ayam Bakar matang — sajikan sekarang!', until: 9999 };
    return;
  }

  if (name === 'end') {
    game.screen = 'over';
    game.shiftLeft = 0;
    game.score = 4860;
    game.coins = 214;
    game.stats = { served: 18, expired: 2, wrong: 1 };
    game.bestCombo = 6;
    return;
  }

  // Unknown shot name: fall back to a plain mid-game view.
  game.plate = ['mie'];
}
