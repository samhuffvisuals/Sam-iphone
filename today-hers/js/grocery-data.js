// Groceries: the data side. Store lists, aisle sorting, learning. No DOM here.
//
// state.groceries = {
//   store: storeId,                       // the list that's open
//   stores: [{ id, name, emoji, order: [sectionId] }],
//   items: [{ id, text, sec, store, done }],
//   known: { [key]: { text, sec?, stores: { [storeId]: timesBought }, n, last } },
//   tasks: { [storeId]: taskId },         // "Trader Joe's run" on today
// }
import { uid } from './store.js';

export const SECTIONS = [
  { id: 'flowers', name: 'Flowers & cards', emoji: '💐' },
  { id: 'produce', name: 'Produce', emoji: '🥬' },
  { id: 'bakery', name: 'Bakery', emoji: '🥖' },
  { id: 'deli', name: 'Deli', emoji: '🥪' },
  { id: 'meat', name: 'Meat & seafood', emoji: '🥩' },
  { id: 'dairy', name: 'Dairy & eggs', emoji: '🥛' },
  { id: 'pantry', name: 'Pantry', emoji: '🥫' },
  { id: 'snacks', name: 'Snacks & sweets', emoji: '🍿' },
  { id: 'drinks', name: 'Drinks', emoji: '🧃' },
  { id: 'frozen', name: 'Frozen', emoji: '🧊' },
  { id: 'household', name: 'Household', emoji: '🧻' },
  { id: 'personal', name: 'Personal care', emoji: '🧴' },
  { id: 'pet', name: 'Pet', emoji: '🐾' },
  { id: 'other', name: 'Other', emoji: '🛍️' },
];
export const sectionOf = (id) => SECTIONS.find((x) => x.id === id) || SECTIONS.at(-1);

// Walking order for each kind of store. Frozen always comes late so it stays cold.
// These are typical layouts, not exact maps: she can reorder any store's aisles.
const LAYOUT = {
  generic: ['flowers', 'produce', 'bakery', 'deli', 'meat', 'dairy', 'pantry', 'snacks', 'drinks', 'frozen', 'household', 'personal', 'pet', 'other'],
  tj: ['flowers', 'produce', 'bakery', 'snacks', 'pantry', 'drinks', 'deli', 'meat', 'dairy', 'frozen', 'household', 'personal', 'pet', 'other'],
  costco: ['household', 'personal', 'pet', 'snacks', 'pantry', 'drinks', 'flowers', 'produce', 'meat', 'deli', 'dairy', 'bakery', 'frozen', 'other'],
  target: ['household', 'personal', 'pet', 'flowers', 'snacks', 'pantry', 'drinks', 'bakery', 'produce', 'deli', 'meat', 'dairy', 'frozen', 'other'],
  wholefoods: ['flowers', 'produce', 'bakery', 'deli', 'meat', 'dairy', 'pantry', 'snacks', 'drinks', 'personal', 'household', 'pet', 'frozen', 'other'],
  walmart: ['produce', 'bakery', 'deli', 'meat', 'dairy', 'pantry', 'snacks', 'drinks', 'household', 'personal', 'pet', 'flowers', 'frozen', 'other'],
  aldi: ['pantry', 'snacks', 'drinks', 'produce', 'bakery', 'meat', 'deli', 'dairy', 'household', 'personal', 'pet', 'flowers', 'frozen', 'other'],
};

// A few things people often pick up at each kind of store, to get the "usuals" going.
// Real usuals (what she actually buys there) take over as soon as she shops.
const STARTERS = {
  generic: ['Bananas', 'Eggs', 'Milk', 'Bread', 'Chicken breast', 'Spinach', 'Coffee', 'Toilet paper'],
  tj: ['Bananas', 'Avocados', 'Eggs', 'Flowers', 'Mandarin orange chicken', 'Cauliflower gnocchi', 'Everything but the bagel seasoning', 'Dark chocolate peanut butter cups'],
  costco: ['Paper towels', 'Toilet paper', 'Rotisserie chicken', 'Eggs', 'Berries', 'Sparkling water', 'Coffee beans', 'Trash bags'],
  target: ['Shampoo', 'Toothpaste', 'Paper towels', 'Snacks', 'Sparkling water', 'Dish soap', 'Candles', 'Cereal'],
  wholefoods: ['Avocados', 'Salmon', 'Berries', 'Greek yogurt', 'Sourdough bread', 'Kombucha', 'Almond milk', 'Spinach'],
  walmart: ['Paper towels', 'Milk', 'Eggs', 'Bread', 'Laundry detergent', 'Bananas', 'Chips', 'Dog food'],
  aldi: ['Eggs', 'Milk', 'Bread', 'Bananas', 'Cheese', 'Chicken breast', 'Pasta', 'Coffee'],
};

// Stores she can add in one tap. kind picks the layout and starters.
export const CHAINS = [
  { name: 'Trader Joe’s', emoji: '🌺', kind: 'tj' },
  { name: 'Costco', emoji: '📦', kind: 'costco' },
  { name: 'Target', emoji: '🎯', kind: 'target' },
  { name: 'Whole Foods', emoji: '🥑', kind: 'wholefoods' },
  { name: 'Walmart', emoji: '⭐', kind: 'walmart' },
  { name: 'Aldi', emoji: '🧺', kind: 'aldi' },
  { name: 'Kroger', emoji: '🛒', kind: 'generic' },
  { name: 'Publix', emoji: '🛒', kind: 'generic' },
  { name: 'Safeway', emoji: '🛒', kind: 'generic' },
  { name: 'Sprouts', emoji: '🌱', kind: 'generic' },
  { name: 'H-E-B', emoji: '🛒', kind: 'generic' },
  { name: 'Wegmans', emoji: '🛒', kind: 'generic' },
  { name: 'Farmers market', emoji: '🧑‍🌾', kind: 'generic' },
];

const DEFAULT_STORES = ['Trader Joe’s', 'Costco', 'Target', 'Whole Foods'];

// Words that place an item in a section. Multi-word phrases beat single words,
// and longer phrases beat shorter ones ("peanut butter cups" → snacks, "peanut butter" → pantry).
const WORDS = {
  produce: 'apple banana avocado lettuce romaine spinach kale arugula greens salad tomato potato onion garlic carrot celery cucumber pepper zucchini broccoli cauliflower mushroom lemon lime orange mandarin clementine grape strawberry blueberry raspberry blackberry berry melon watermelon cantaloupe pineapple mango peach pear plum cherry kiwi herbs cilantro parsley basil mint dill ginger jalapeno squash corn asparagus cabbage yam shallot leek radish beet pomegranate fig fruit veggie vegetable scallion sprouts brussels|green beans|green onion|bell pepper|sweet potato|snap peas|bok choy',
  bakery: 'bread baguette bagel croissant muffin roll bun pita naan cake cupcake donut doughnut sourdough brioche pie tortilla|english muffin|hamburger buns|hot dog buns',
  deli: 'salami prosciutto hummus pepperoni sushi guacamole olives|deli meat|lunch meat|sliced turkey|rotisserie chicken|potato salad|chicken salad',
  meat: 'chicken beef steak pork bacon sausage salmon shrimp fish tuna turkey lamb ribs meatballs tilapia cod crab lobster scallops brisket chorizo|ground beef|ground turkey|chicken breast|chicken thighs|hot dogs|pork chops',
  dairy: 'milk egg butter cheese yogurt yoghurt cream creamer cheddar mozzarella parmesan feta brie ricotta kefir ghee gouda|sour cream|cream cheese|half and half|cottage cheese|oat milk|almond milk|greek yogurt|string cheese',
  frozen: 'frozen pizza popsicle waffles dumplings potstickers edamame ice fries gelato sorbet burrito gnocchi|ice cream|orange chicken|tater tots|frozen fruit|frozen veggies',
  pantry: 'rice pasta spaghetti penne noodles ramen flour sugar salt oil vinegar sauce marinara soup broth stock beans lentils chickpeas cereal oatmeal oats granola jelly jam honey syrup spices seasoning cinnamon ketchup mustard mayo mayonnaise salsa taco quinoa vanilla yeast dressing breadcrumbs couscous|peanut butter|almond butter|olive oil|black pepper|soy sauce|maple syrup|baking soda|baking powder|chocolate chips|canned tuna|tomato sauce|pasta sauce|bagel seasoning|everything but the bagel',
  snacks: 'chips crackers cookies popcorn pretzels nuts almonds cashews pistachios walnuts candy gum chocolate gummies jerky snacks bar bars|trail mix|granola bars|peanut butter cups|fruit snacks|dark chocolate|rice cakes',
  drinks: 'water seltzer lacroix juice soda coffee tea kombucha wine beer lemonade gatorade|sparkling water|coffee beans|coconut water|orange juice|la croix|cold brew',
  household: 'detergent sponges foil napkins bleach wipes batteries candles cleaner household|paper towels|toilet paper|trash bags|garbage bags|dish soap|dishwasher pods|laundry detergent|plastic wrap|ziploc bags|paper plates|dryer sheets|light bulbs',
  personal: 'shampoo conditioner toothpaste toothbrush deodorant lotion sunscreen razors vitamins medicine ibuprofen tylenol advil floss makeup mascara tampons pads tissues soap moisturizer|body wash|face wash|dry shampoo|q tips|cotton pads|hand soap|lip balm|nail polish',
  pet: 'litter kibble treats|dog food|cat food|dog treats|cat treats|poop bags|cat litter',
  flowers: 'flowers bouquet roses tulips peonies card gift balloons plant|birthday card|greeting card',
};

const PHRASES = []; // [phrase, section], longest first
const SINGLE = new Map();
for (const [sec, list] of Object.entries(WORDS)) {
  const [single, ...multi] = list.split('|');
  for (const w of single.split(' ').filter(Boolean)) SINGLE.set(w, sec);
  for (const p of multi) PHRASES.push([p, sec]);
}
PHRASES.sort((a, b) => b[0].length - a[0].length);

const singular = (w) => {
  if (w.length > 4 && w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.length > 4 && /(oes|ches|shes|xes)$/.test(w)) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
};

// "2 lbs Chicken thighs" → "chicken thighs". Used for matching, de-duplicating and learning.
export function keyOf(text) {
  return String(text)
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9& -]/g, ' ')
    .replace(/^\s*(\d+([./]\d+)?\s*(x|lbs?|pounds?|oz|ounces?|kg|g|gal|gallons?|pk|packs?|bags?|boxes?|cans?|bottles?|dozen)?\s+(of\s+)?|(a|an|some)\s+(dozen\s+|bag\s+of\s+|box\s+of\s+|pack\s+of\s+)?)/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// The section an item belongs in: what she taught it, else the word lists.
export function classify(g, text) {
  const k = keyOf(text);
  if (g?.known[k]?.sec) return g.known[k].sec;
  const padded = ` ${k} `;
  for (const [p, sec] of PHRASES) if (padded.includes(` ${p} `) || padded.includes(` ${p}s `)) return sec;
  const words = k.split(' ');
  if (words.includes('frozen')) return 'frozen';
  // The last word is usually the thing itself ("chocolate milk", "chicken soup").
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    const hit = SINGLE.get(w) || SINGLE.get(singular(w));
    if (hit) return hit;
  }
  return 'other';
}

export function makeStore(name, emoji, kind = 'generic') {
  return { id: uid(), name, emoji, kind, order: [...(LAYOUT[kind] || LAYOUT.generic)] };
}

// Creates or repairs the groceries part of the state.
export function ensure(s) {
  let g = s.groceries;
  if (!g || typeof g !== 'object' || !Array.isArray(g.stores)) {
    g = s.groceries = { store: null, stores: [], items: [], known: {}, tasks: {} };
    for (const name of DEFAULT_STORES) {
      const c = CHAINS.find((x) => x.name === name);
      g.stores.push(makeStore(c.name, c.emoji, c.kind));
    }
  }
  g.stores = g.stores.filter((x) => x && x.id && typeof x.name === 'string');
  if (!g.stores.length) g.stores.push(makeStore('Grocery store', '🛒'));
  for (const st of g.stores) {
    const valid = (Array.isArray(st.order) ? st.order : []).filter((id) => SECTIONS.some((x) => x.id === id));
    st.order = [...new Set([...valid, ...LAYOUT.generic])];
    st.emoji = st.emoji || '🛒';
  }
  const ids = new Set(g.stores.map((x) => x.id));
  if (!ids.has(g.store)) g.store = g.stores[0].id;
  g.items = (Array.isArray(g.items) ? g.items : []).filter((i) => i && i.id && typeof i.text === 'string' && ids.has(i.store));
  if (!g.known || typeof g.known !== 'object') g.known = {};
  if (!g.tasks || typeof g.tasks !== 'object') g.tasks = {};
  return g;
}

export const storeOf = (g, id) => g.stores.find((x) => x.id === id) || g.stores[0];
export const itemsAt = (g, storeId) => g.items.filter((i) => i.store === storeId);
export const leftAt = (g, storeId) => g.items.filter((i) => i.store === storeId && !i.done).length;
export const leftEverywhere = (s) => (s.groceries ? s.groceries.items.filter((i) => !i.done).length : 0);

// Sections in this store's walking order, each with its items (still-needed first).
export function grouped(g, storeId) {
  const st = storeOf(g, storeId);
  const items = itemsAt(g, storeId);
  return st.order
    .map((sec) => ({ sec: sectionOf(sec), items: items.filter((i) => i.sec === sec).sort((a, b) => a.done - b.done) }))
    .filter((x) => x.items.length);
}

// Adds one item, or brings back the same item if it's already on this list. Returns { item, merged }.
export function addItem(g, text, storeId) {
  const clean = text.trim().replace(/\s+/g, ' ');
  const k = keyOf(clean);
  if (!k) return null;
  const dup = g.items.find((i) => i.store === storeId && keyOf(i.text) === k);
  if (dup) {
    dup.text = clean;
    dup.done = false;
    return { item: dup, merged: true };
  }
  const item = { id: uid(), text: clean, sec: classify(g, clean), store: storeId, done: false };
  g.items.push(item);
  const r = (g.known[k] ||= { text: clean, stores: {}, n: 0, last: 0 });
  r.text = clean;
  r.n++;
  r.last = Date.now();
  return { item, merged: false };
}

// "milk, eggs and bread" → three items. New lines, commas and "and" all split.
// "and" only splits a list that also has commas, and never inside names like "mac and cheese".
const KEEP_AND = /\b(half|mac|macaroni|salt|ham|chips|peanut butter|sweet|fish|cookies|rice|bread) (and|&) (?=half|cheese|pepper|salsa|jelly|sour|chips|cream|beans|butter)/gi;
export const splitItems = (text) => {
  const t = text.replace(KEEP_AND, (m, w, and) => `${w} ${and === '&' ? '\u0001' : '\u0000'} `);
  const andSplits = /,|\n/.test(t) ? /\n|,|;|\s+and\s+|\s+&\s+/i : /\n|,|;/;
  return t
    .split(andSplits)
    .map((x) => x.replace(/\u0000/g, 'and').replace(/\u0001/g, '&').trim())
    .filter(Boolean);
};

// She moved an item to another section: remember it for next time.
export function teach(g, item, sec) {
  item.sec = sec;
  const k = keyOf(item.text);
  (g.known[k] ||= { text: item.text, stores: {}, n: 1, last: Date.now() }).sec = sec;
}

// Checking an item off counts as buying it at that store.
export function bought(g, item) {
  const k = keyOf(item.text);
  const r = (g.known[k] ||= { text: item.text, stores: {}, n: 1, last: Date.now() });
  r.stores[item.store] = (r.stores[item.store] || 0) + 1;
  r.last = Date.now();
}

// Where she usually buys this, if it's clearly somewhere else.
export function usualStore(g, text, storeId) {
  const r = g.known[keyOf(text)];
  if (!r) return null;
  const [best, n] = Object.entries(r.stores).sort((a, b) => b[1] - a[1])[0] || [];
  if (!best || best === storeId || n < 2 || (r.stores[storeId] || 0) >= n) return null;
  return g.stores.find((x) => x.id === best) || null;
}

// One-tap "usuals" for a store: what she buys there most, then a few starters.
export function usuals(g, storeId, limit = 10) {
  const st = storeOf(g, storeId);
  const onList = new Set(itemsAt(g, storeId).filter((i) => !i.done).map((i) => keyOf(i.text)));
  const mine = Object.entries(g.known)
    .filter(([k, r]) => r.stores[storeId] && !onList.has(k))
    .sort((a, b) => b[1].stores[storeId] - a[1].stores[storeId] || b[1].last - a[1].last)
    .map(([, r]) => r.text);
  const seen = new Set(mine.map(keyOf));
  const starters = (STARTERS[st.kind] || STARTERS.generic).filter((t) => !seen.has(keyOf(t)) && !onList.has(keyOf(t)));
  return [...mine, ...starters].slice(0, limit);
}

// Plain text for sharing (texting the list to someone else who's at the store).
export function listText(g, storeId) {
  const st = storeOf(g, storeId);
  const lines = [`${st.emoji} ${st.name} list`];
  for (const { sec, items } of grouped(g, storeId)) {
    const need = items.filter((i) => !i.done);
    if (!need.length) continue;
    lines.push('', `${sec.emoji} ${sec.name}`, ...need.map((i) => `• ${i.text}`));
  }
  return lines.join('\n');
}
