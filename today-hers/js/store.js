// Storage: one JSON blob in localStorage, plus export/import and first-run seeding.

// Its own key: this app shares an origin (and so localStorage) with other apps.
const KEY = 'today-hers.v1';
export const MAX_PACKS = 8;

// Curated pastel palette. Ticks and labels on top of these are drawn in plum ink.
export const PALETTE = [
  { id: 'red', hex: '#FF9AA2' },
  { id: 'orange', hex: '#FFBE98' },
  { id: 'yellow', hex: '#FFE08A' },
  { id: 'green', hex: '#A3E4B7' },
  { id: 'teal', hex: '#9DE0EC' },
  { id: 'blue', hex: '#A9C8FF' },
  { id: 'purple', hex: '#CDB4F5' },
  { id: 'pink', hex: '#FFAFD0' },
];

// Grocery stores, in the order their sections show in the Groceries category.
export const STORE_PICKS = [
  { name: 'Trader Joe’s', emoji: '🌺' },
  { name: 'Costco', emoji: '📦' },
  { name: 'Target', emoji: '🎯' },
  { name: 'Whole Foods', emoji: '🥑' },
  { name: 'Walmart', emoji: '⭐' },
  { name: 'Aldi', emoji: '🧺' },
  { name: 'Kroger', emoji: '🛒' },
  { name: 'Publix', emoji: '🛒' },
  { name: 'Safeway', emoji: '🛒' },
  { name: 'Sprouts', emoji: '🌱' },
  { name: 'H-E-B', emoji: '🛒' },
  { name: 'Wegmans', emoji: '🛒' },
  { name: 'Farmers market', emoji: '🧑‍🌾' },
];
const starterStores = () => STORE_PICKS.slice(0, 4).map((x, i) => ({ id: `store${i + 1}`, ...x }));

export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

function defaults() {
  return {
    v: 2,
    settings: {
      dayStart: 240, // minutes after midnight (4:00 AM)
      haptics: true,
      buddies: true, // a Pokémon pops up to celebrate each finished task
      collapsed: {},
      lastCat: 'general',
      lastType: 'today',
      storeCollapsed: {}, // store sections folded away in Groceries
    },
    categories: [{ id: 'general', name: 'General', emoji: '💖', color: 'pink' }],
    stores: starterStores(), // { id, name, emoji }, in display order
    // task: { id, text, catId, type: 'daily'|'today', order, days?: number[]|null, since?: dayKey, dayKey?: dayKey,
    //         subs?: [{ id, text, done }], subsOpen?: boolean, store?: storeId (groceries) }
    tasks: [],
    // pack: { id, name, emoji, catId, items: string[] } — one tap drops every item onto today
    packs: [],
    day: null, // { key: 'YYYY-MM-DD', done: { [taskId]: timestamp } }
    history: {}, // { 'YYYY-MM-DD': { d: done, t: total } }
    seeded: 0, // which starter set has been applied
    // everything ever added, for suggestions: { [lowercased text]: { text, catId, n, last } }
    recent: {},
    quote: null, // { key: dayKey, i } today's quote
    quotesSeen: [], // indexes already shown, so nothing repeats until the library is used up
    carry: null, // { from: dayKey, ids: [] } unfinished one-offs offered for carry-over
    friends: [], // Pokédex numbers of the Pokémon that have already popped up, so each one is new
  };
}

// Validates and fills in anything missing. Throws on garbage.
export function normalize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Not a Today backup');
  const d = defaults();
  const s = { ...d, ...raw, settings: { ...d.settings, ...(raw.settings || {}) } };
  delete s.settings.theme;
  delete s.settings.sound;
  delete s.bestStreak;

  if (!Array.isArray(s.categories)) s.categories = [];
  s.categories = s.categories.filter((c) => c && c.id && typeof c.name === 'string');
  if (!s.categories.some((c) => c.id === 'general')) s.categories.unshift(d.categories[0]);
  const catIds = new Set(s.categories.map((c) => c.id));

  if (!Array.isArray(s.stores)) s.stores = starterStores();
  s.stores = s.stores
    .filter((x) => x && x.id && typeof x.name === 'string' && x.name.trim())
    .map((x) => ({ id: x.id, name: x.name.trim(), emoji: typeof x.emoji === 'string' && x.emoji ? x.emoji : '🛒' }));
  const storeIds = new Set(s.stores.map((x) => x.id));
  if (!s.settings.storeCollapsed || typeof s.settings.storeCollapsed !== 'object') s.settings.storeCollapsed = {};
  if (!catIds.has(s.settings.groceryCatId)) s.settings.groceryCatId = null;

  if (!Array.isArray(s.tasks)) s.tasks = [];
  s.tasks = s.tasks
    .filter((t) => t && t.id && typeof t.text === 'string')
    .map((t, i) => ({
      ...t,
      type: t.type === 'daily' ? 'daily' : 'today',
      catId: catIds.has(t.catId) ? t.catId : 'general',
      order: Number.isFinite(t.order) ? t.order : i,
      store: typeof t.store === 'string' && storeIds.has(t.store) ? t.store : null,
      subs: Array.isArray(t.subs)
        ? t.subs.filter((x) => x && x.id && typeof x.text === 'string' && x.text.trim()).map((x) => ({ id: x.id, text: x.text.trim(), done: !!x.done }))
        : [],
    }));

  if (!Array.isArray(s.packs)) s.packs = [];
  s.packs = s.packs
    .filter((p) => p && p.id && typeof p.name === 'string')
    .map((p) => ({
      id: p.id,
      name: p.name,
      emoji: typeof p.emoji === 'string' && p.emoji ? p.emoji : '📦',
      catId: catIds.has(p.catId) ? p.catId : 'general',
      items: Array.isArray(p.items) ? p.items.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [],
    }))
    .slice(0, MAX_PACKS);

  if (!s.history || typeof s.history !== 'object') s.history = {};
  for (const [k, h] of Object.entries(s.history)) {
    if (!h || typeof h !== 'object') { delete s.history[k]; continue; }
    if (Array.isArray(h.tasks)) h.tasks = h.tasks.filter((t) => t && typeof t.text === 'string').map((t) => ({ text: t.text, catId: typeof t.catId === 'string' ? t.catId : 'general', done: !!t.done, daily: !!t.daily }));
    else delete h.tasks;
  }
  if (s.day && (typeof s.day.key !== 'string' || typeof s.day.done !== 'object')) s.day = null;
  if (!s.settings.collapsed || typeof s.settings.collapsed !== 'object') s.settings.collapsed = {};
  s.seeded = Number.isFinite(s.seeded) ? s.seeded : 0;
  if (!s.recent || typeof s.recent !== 'object' || Array.isArray(s.recent)) s.recent = {};
  if (!s.quote || typeof s.quote.key !== 'string' || !Number.isInteger(s.quote.i)) s.quote = null;
  if (!Array.isArray(s.quotesSeen)) s.quotesSeen = [];
  s.friends = Array.isArray(s.friends) ? s.friends.filter((n) => Number.isInteger(n) && n > 0) : [];
  for (const [k, r] of Object.entries(s.recent)) {
    if (!r || typeof r.text !== 'string' || !r.text.trim()) delete s.recent[k];
    else s.recent[k] = { text: r.text.trim(), catId: catIds.has(r.catId) ? r.catId : 'general', n: Number.isFinite(r.n) ? r.n : 1, last: Number.isFinite(r.last) ? r.last : 0 };
  }
  delete s.app;
  delete s.exportedAt;
  return s;
}

/* ---------- starter set ---------- */

const SEED_VERSION = 1;

const SEED = {
  categories: [
    { key: 'me', name: 'Me', emoji: '🌷', color: 'purple' },
    { key: 'home', name: 'Home', emoji: '🏡', color: 'teal' },
  ],
  daily: [
    { cat: 'me', text: 'Drink water' },
    { cat: 'me', text: 'Move my body' },
  ],
  packs: [
    { cat: 'me', name: 'Self care', emoji: '🛁', items: ['Skincare', 'Stretch', 'Read a chapter'] },
    { cat: 'home', name: 'Clean house', emoji: '🧹', items: ['Clean living room', 'Vacuum', 'Take trash out', 'Laundry'] },
    { cat: 'home', name: 'Trip', emoji: '✈️', items: ['Pack for trip', 'Clean car', 'Laundry'] },
  ],
};

const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

// Adds the starter categories, daily tasks and packs once, without duplicating anything already there.
export function seed(state, dayKey) {
  if (state.seeded >= SEED_VERSION) return false;
  const catFor = {};
  for (const c of SEED.categories) {
    let found = state.categories.find((x) => same(x.name, c.name));
    if (!found) {
      found = { id: uid(), name: c.name, emoji: c.emoji, color: c.color };
      state.categories.push(found);
    }
    catFor[c.key] = found ? found.id : 'general';
  }
  let order = state.tasks.reduce((m, t) => Math.max(m, t.order || 0), 0);
  for (const t of SEED.daily) {
    if (state.tasks.some((x) => same(x.text, t.text))) continue;
    state.tasks.push({ id: uid(), text: t.text, catId: catFor[t.cat], type: 'daily', order: ++order, days: null, since: dayKey });
  }
  for (const p of SEED.packs) {
    if (state.packs.some((x) => same(x.name, p.name)) || state.packs.length >= MAX_PACKS) continue;
    state.packs.push({ id: uid(), name: p.name, emoji: p.emoji, catId: catFor[p.cat], items: [...p.items] });
  }
  state.seeded = SEED_VERSION;
  return true;
}

/* ---------- one-time updates ---------- */

// The one category that is her grocery list: it shows a section for each store.
export const isGroceryCat = (c) => !!c && !!c.id && c.id === store.state.settings.groceryCatId;
const looksGrocery = (c) => !!c && /grocer/i.test(c.name);

// Adds the Groceries category (and a starter grocery pack) once. Anything left on the
// old per-store grocery lists moves onto today in that category.
export function migrate(state, dayKey) {
  if (state.settings.groceryCat) return false;
  let cat = state.categories.find(looksGrocery);
  if (!cat) {
    cat = { id: uid(), name: 'Groceries', emoji: '🛒', color: 'green' };
    state.categories.push(cat);
  }
  const catId = cat.id;
  if (!state.packs.some((p) => same(p.name, 'Grocery staples')) && state.packs.length < MAX_PACKS) {
    state.packs.push({ id: uid(), name: 'Grocery staples', emoji: '🛒', catId, items: ['Milk', 'Eggs', 'Bread', 'Bananas', 'Coffee', 'Paper towels'] });
  }
  const old = state.groceries;
  if (old && Array.isArray(old.stores) && old.stores.length) {
    state.stores = old.stores
      .filter((x) => x && x.id && typeof x.name === 'string')
      .map((x) => ({ id: x.id, name: x.name, emoji: x.emoji || '🛒' }));
  }
  const storeIds = new Set(state.stores.map((x) => x.id));
  if (old && Array.isArray(old.items)) {
    const onToday = new Set(state.tasks.filter((t) => t.type === 'daily' || t.dayKey === dayKey).map((t) => t.text.trim().toLowerCase()));
    let order = state.tasks.reduce((m, t) => Math.min(m, t.order || 0), 0) - 1;
    for (const it of old.items) {
      if (!it || it.done || typeof it.text !== 'string' || onToday.has(it.text.trim().toLowerCase())) continue;
      state.tasks.push({ id: uid(), text: it.text.trim(), catId, type: 'today', order: order--, dayKey, subs: [], store: storeIds.has(it.store) ? it.store : null });
      onToday.add(it.text.trim().toLowerCase());
    }
  }
  // Store-run tasks pointed at the old lists: they're plain tasks now.
  for (const t of state.tasks) delete t.grocery;
  delete state.groceries;
  state.settings.groceryCat = 1;
  return true;
}

// Makes sure there's a grocery list category for the stores to live in. Phones that
// had the old maximum of six categories never got one, so this adds it now, and moves
// the Grocery staples pack and anything already given a store into it.
export function ensureGroceryCat(state) {
  if ((state.settings.groceryCat || 0) >= 2) return false;
  let cat = state.categories.find((c) => c.id === state.settings.groceryCatId) || state.categories.find(looksGrocery);
  if (!cat) {
    cat = { id: uid(), name: 'Groceries', emoji: '🛒', color: 'green' };
    state.categories.push(cat);
  }
  state.settings.groceryCatId = cat.id;
  for (const p of state.packs) if (same(p.name, 'Grocery staples')) p.catId = cat.id;
  for (const t of state.tasks) if (t.store) t.catId = cat.id;
  delete state.settings.collapsed[cat.id];
  state.settings.groceryCat = 2;
  return true;
}

/* ---------- suggestions ---------- */

const MAX_RECENT = 300;
const norm = (t) => t.trim().toLowerCase().replace(/\s+/g, ' ');

// Remember a task name (and the group it went to) so it can be offered next time.
export function remember(state, text, catId, when = Date.now()) {
  const k = norm(text);
  if (!k) return;
  const r = state.recent[k];
  if (r) {
    r.n++;
    r.last = when;
    r.text = text.trim();
    if (catId) r.catId = catId;
  } else state.recent[k] = { text: text.trim(), catId: catId || 'general', n: 1, last: when };
  const keys = Object.keys(state.recent);
  if (keys.length > MAX_RECENT) {
    keys
      .sort((a, b) => state.recent[a].n - state.recent[b].n || state.recent[a].last - state.recent[b].last)
      .slice(0, keys.length - MAX_RECENT)
      .forEach((x) => delete state.recent[x]);
  }
}

// Best matches for what's being typed. Empty query: the most used. `exclude` is a Set of normalized texts already on today.
export function suggest(state, query, exclude = new Set(), limit = 6) {
  const q = norm(query || '');
  const words = q.split(' ').filter(Boolean);
  const scored = [];
  for (const [k, r] of Object.entries(state.recent)) {
    if (exclude.has(k)) continue;
    let score = 0;
    if (!q) score = 1;
    else if (k.startsWith(q)) score = 4;
    else if (words.every((w) => k.split(' ').some((kw) => kw.startsWith(w)))) score = 3;
    else if (k.includes(q)) score = 2;
    if (!score) continue;
    scored.push({ ...r, score });
  }
  scored.sort((a, b) => b.score - a.score || b.n - a.n || b.last - a.last);
  return scored.slice(0, limit);
}

/* ---------- persistence ---------- */

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {
    console.warn('Could not read saved data, starting fresh', e);
  }
  return defaults();
}

export const store = {
  state: load(),
  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store.state));
    } catch (e) {
      console.warn('Save failed', e);
    }
  },
};

export function exportData() {
  return JSON.stringify({ app: 'today-hers', exportedAt: new Date().toISOString(), ...store.state }, null, 2);
}

export function importData(text) {
  store.state = normalize(JSON.parse(text));
  store.save();
}

export function eraseAll() {
  try { localStorage.removeItem(KEY); } catch {}
  store.state = defaults();
}
