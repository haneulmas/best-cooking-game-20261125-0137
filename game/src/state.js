// Sizzle & Serve — Warung Rush: the whole game state and its rules.
// One clear job: orders, the plate, the stove, coins and the shift clock.
// Rendering never mutates state; input calls these functions and they decide.

import {
  COOK_SECONDS,
  INGREDIENTS,
  MAX_HEARTS,
  MAX_ORDERS,
  ORDER_PATIENCE,
  ORDER_SPAWN_EVERY,
  SHIFT_SECONDS,
  ingredientById,
  mulberry32,
  pickRecipe,
  plateMatchesRecipe,
  recipeById,
  recipeForPlate,
} from './config.js';
import { sfx } from './audio.js';

export function newGame(seed = 1) {
  return {
    seed,
    rng: mulberry32(seed),
    screen: 'title', // title | playing | paused | over
    time: 0,
    shiftLeft: SHIFT_SECONDS,
    spawnIn: 2.5,
    coins: 0,
    score: 0,
    served: 0,
    bestCombo: 0,
    combo: 0,
    hearts: MAX_HEARTS,
    orders: [],
    nextOrderId: 1,
    plate: [], // ingredient ids currently on the plate
    cooking: null, // { recipeId, left, total } while a dish fries
    ready: null, // { recipeId } once cooked, waiting to be served
    toast: null, // { text, until } floating message
    flash: null, // { kind, until } screen feedback: 'good' | 'bad'
    stats: { served: 0, expired: 0, wrong: 0 },
    ui: {}, // hit regions the renderer fills in each frame
  };
}

function showToast(game, text, seconds = 1.6) {
  game.toast = { text, until: game.time + seconds };
}

function flash(game, kind) {
  game.flash = { kind, until: game.time + 0.45 };
}

export function startShift(game) {
  const fresh = newGame(game.seed);
  Object.assign(game, fresh, { screen: 'playing' });
  spawnOrder(game);
  spawnOrder(game);
  showToast(game, 'Shift dimulai! Layani pelanggan sebelum sabar mereka habis.');
}

export function spawnOrder(game) {
  if (game.orders.length >= MAX_ORDERS) return;
  const avoid = game.orders.length ? game.orders[game.orders.length - 1].recipeId : null;
  const recipe = pickRecipe(game.rng, avoid);
  game.orders.push({
    id: game.nextOrderId++,
    recipeId: recipe.id,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
    bornAt: game.time,
  });
  sfx.ticket();
}

export function addIngredient(game, id) {
  if (game.screen !== 'playing') return;
  if (game.cooking || game.ready) return; // plate is busy: finish the dish first
  if (game.plate.length >= 3) {
    sfx.error();
    showToast(game, 'Piring penuh — masak dulu atau buang isinya (T).');
    return;
  }
  if (game.plate.includes(id)) {
    sfx.error();
    showToast(game, `${ingredientById(id).name} sudah ada di piring.`);
    return;
  }
  game.plate.push(id);
  sfx.chop();
}

export function clearPlate(game) {
  if (game.screen !== 'playing' || game.cooking || game.ready) return;
  if (!game.plate.length) return;
  game.plate = [];
  sfx.chop();
  showToast(game, 'Piring dikosongkan.');
}

export function plateRecipe(game) {
  return recipeForPlate(game.plate);
}

export function startCooking(game) {
  if (game.screen !== 'playing') return;
  if (game.cooking || game.ready) return;
  const recipe = plateRecipe(game);
  if (!recipe) {
    sfx.error();
    game.stats.wrong += 1;
    flash(game, 'bad');
    showToast(game, 'Bukan resep yang dikenal — cek papan order (T untuk buang).');
    return;
  }
  game.cooking = { recipeId: recipe.id, left: recipe.time, total: recipe.time };
  game.plate = [];
  sfx.sizzle();
}

export function serveReadyDish(game, orderId = null) {
  if (game.screen !== 'playing' || !game.ready) return;
  const dish = recipeById(game.ready.recipeId);
  const target =
    orderId != null
      ? game.orders.find((o) => o.id === orderId)
      : game.orders.find((o) => o.recipeId === dish.id);
  if (!target) {
    sfx.error();
    flash(game, 'bad');
    showToast(game, `Tidak ada yang memesan ${dish.name} sekarang.`);
    return;
  }
  const patienceLeft = target.patience / target.maxPatience;
  const tip = patienceLeft > 0.6 ? 4 : patienceLeft > 0.3 ? 2 : 0;
  game.orders = game.orders.filter((o) => o.id !== target.id);
  game.ready = null;
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  const earned = dish.coins + tip + Math.min(game.combo - 1, 5);
  game.coins += earned;
  game.score += earned * 100 + Math.round(patienceLeft * 200);
  game.served += 1;
  game.stats.served += 1;
  sfx.serve();
  flash(game, 'good');
  showToast(game, `${dish.name} tersaji! +${earned} koin${tip ? ` (termasuk tip ${tip})` : ''}`);
}

// Advance timers by dt seconds. Called once per animation frame.
export function update(game, dt) {
  if (game.screen !== 'playing') return;
  game.time += dt;
  game.shiftLeft = Math.max(0, game.shiftLeft - dt);

  game.spawnIn -= dt;
  if (game.spawnIn <= 0) {
    spawnOrder(game);
    game.spawnIn = ORDER_SPAWN_EVERY;
  }

  for (const order of game.orders) order.patience -= dt;
  const expired = game.orders.filter((o) => o.patience <= 0);
  if (expired.length) {
    game.orders = game.orders.filter((o) => o.patience > 0);
    game.hearts -= expired.length;
    game.combo = 0;
    game.stats.expired += expired.length;
    sfx.error();
    flash(game, 'bad');
    showToast(game, expired.length > 1 ? `${expired.length} pelanggan pergi kecewa!` : 'Pelanggan pergi kecewa — sabar mereka habis!');
  }

  if (game.cooking) {
    game.cooking.left -= dt;
    if (game.cooking.left <= 0) {
      game.ready = { recipeId: game.cooking.recipeId };
      game.cooking = null;
      sfx.ready();
      showToast(game, `${recipeById(game.ready.recipeId).name} matang — sajikan sekarang!`);
    }
  }

  if (game.shiftLeft <= 0 || game.hearts <= 0) {
    game.screen = 'over';
    sfx.shiftEnd();
  }
}

export function formatClock(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

export { INGREDIENTS, COOK_SECONDS };
