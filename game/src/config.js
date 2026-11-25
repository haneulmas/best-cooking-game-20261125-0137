// Sizzle & Serve — Warung Rush: shared constants, recipes and the seeded RNG.
// One clear job: everything the other modules agree on lives here, nowhere else.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 150;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 42;
export const ORDER_SPAWN_EVERY = 11;
export const COOK_SECONDS = 3.2;
export const MAX_HEARTS = 3;

// Warm warung palette: cream plaster, terracotta tile, dark wood, teal chalkboard.
export const COLORS = {
  wall: '#f7e8c9',
  wallShadow: '#efd9ae',
  tile: '#c96f4a',
  tileDark: '#a85438',
  wood: '#8a5a33',
  woodDark: '#6e4525',
  woodLight: '#a9743f',
  counter: '#e8d5a8',
  board: '#2f5d50',
  boardEdge: '#24473d',
  chalk: '#f5efdc',
  cream: '#fff8e7',
  ink: '#33261a',
  muted: '#7a6a55',
  gold: '#f2b705',
  red: '#d64541',
  green: '#4caf6d',
  teal: '#1f8a70',
  plate: '#ffffff',
  flame: '#ff9f1c',
};

export const INGREDIENTS = [
  { id: 'nasi', name: 'Nasi', key: '1', color: '#fdf6e3', accent: '#e8d9a8', price: 0 },
  { id: 'telur', name: 'Telur', key: '2', color: '#ffd93b', accent: '#f0a500', price: 0 },
  { id: 'ayam', name: 'Ayam', key: '3', color: '#c98a4b', accent: '#8a5a33', price: 0 },
  { id: 'mie', name: 'Mie', key: '4', color: '#f7c948', accent: '#d99a16', price: 0 },
  { id: 'sayur', name: 'Sayur', key: '5', color: '#58b368', accent: '#2f7d3d', price: 0 },
  { id: 'sambal', name: 'Sambal', key: '6', color: '#e4572e', accent: '#a93226', price: 0 },
];

export const ingredientById = (id) => INGREDIENTS.find((i) => i.id === id);

// Original recipes, invented for this game. No real-world restaurant names.
export const RECIPES = [
  { id: 'nasi-goreng', name: 'Nasi Goreng Spesial', needs: ['nasi', 'telur', 'sambal'], coins: 12, time: 3.2 },
  { id: 'ayam-geprek', name: 'Ayam Geprek Pedas', needs: ['ayam', 'sambal', 'sayur'], coins: 14, time: 3.6 },
  { id: 'mie-goreng', name: 'Mie Goreng Jawa', needs: ['mie', 'telur', 'sayur'], coins: 12, time: 3.0 },
  { id: 'nasi-ayam', name: 'Nasi Ayam Bakar', needs: ['nasi', 'ayam', 'sayur'], coins: 15, time: 3.8 },
  { id: 'mie-ayam', name: 'Mie Ayam Pedas', needs: ['mie', 'ayam', 'sambal'], coins: 14, time: 3.4 },
];

export const recipeById = (id) => RECIPES.find((r) => r.id === id);

// Small deterministic RNG so screenshots and tests repeat exactly.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRecipe(rng, avoidId) {
  const pool = RECIPES.filter((r) => r.id !== avoidId);
  return pool[Math.floor(rng() * pool.length)];
}

// Same-ingredients test regardless of the order the cook added them.
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const sorted = [...plate].sort().join(',');
  return sorted === [...recipe.needs].sort().join(',');
}

export function recipeForPlate(plate) {
  return RECIPES.find((r) => plateMatchesRecipe(plate, r)) ?? null;
}
