// A Pokémon pops up in the middle of the screen and celebrates every finished task.
// Each one is new: the ones already met are remembered, and nobody repeats until
// the whole Pokédex has shown up. The artwork is loaded from PokeAPI's public sprite
// collection, one ahead of time, so the next friend is ready the moment a task is checked.
import { store } from '../store.js';
import { NAMES, CUTE } from '../pokemon-data.js';

const ART = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

const CHEERS = [
  'is so proud of you!',
  'says great job!',
  'is cheering for you!',
  'did a happy dance!',
  'thinks you’re amazing!',
  'says you’ve got this!',
  'came to celebrate!',
  'is doing a twirl for you!',
];
const SPARKS = ['✨', '💖', '🌸', '⭐', '💕', '✨', '🎀', '💫'];
const STANDINS = ['🌸', '💖', '🌈', '🦋', '⭐'];

const SHOW_MS = 2600;
const any = (list) => list[Math.floor(Math.random() * list.length)];

let el = null;
let next = null; // { id, img, ready, failed }
let timers = [];

function pick() {
  const s = store.state;
  let seen = new Set(s.friends);
  if (seen.size >= NAMES.length) {
    s.friends = [];
    seen = new Set();
  }
  // The cutest first, then everybody else.
  let pool = CUTE.filter((id) => !seen.has(id));
  if (!pool.length) pool = NAMES.map((_, i) => i + 1).filter((id) => !seen.has(id));
  return any(pool);
}

function prepare() {
  const id = pick();
  const img = new Image();
  const n = { id, img, ready: false, failed: false };
  img.className = 'buddy-img';
  img.alt = NAMES[id - 1];
  img.decoding = 'async';
  img.referrerPolicy = 'no-referrer';
  img.onload = () => (n.ready = true);
  img.onerror = () => (n.failed = true);
  img.src = ART(id);
  next = n;
}

function build() {
  el = document.createElement('div');
  el.id = 'buddy';
  el.setAttribute('role', 'status');
  el.innerHTML = `<div class="buddy-veil"></div>
    <div class="buddy-stage">
      <div class="buddy-halo"></div>
      <div class="buddy-sparks" aria-hidden="true"></div>
      <div class="buddy-slot"></div>
      <div class="buddy-bubble"><b></b><span></span><small></small></div>
    </div>`;
  document.getElementById('app').appendChild(el);
}

export function initBuddies() {
  build();
  if (store.state.settings.buddies !== false) prepare();
  // Back online after a failed load: try again so the next check has a friend ready.
  addEventListener('online', () => next?.failed && prepare());
}

// Returns true when something popped up.
export function cheer() {
  const s = store.state;
  if (s.settings.buddies === false || !el) return false;
  if (!next) prepare();

  const slot = el.querySelector('.buddy-slot');
  const [nameEl, lineEl, metEl] = el.querySelector('.buddy-bubble').children;

  if (next.ready) {
    slot.replaceChildren(next.img);
    nameEl.textContent = NAMES[next.id - 1];
    lineEl.textContent = any(CHEERS);
    if (!s.friends.includes(next.id)) s.friends.push(next.id);
    store.save();
    metEl.textContent = `New friend · ${s.friends.length} met`;
    prepare();
  } else {
    // No connection (or the picture is still on its way): a little stand-in celebrates instead.
    const e = document.createElement('span');
    e.className = 'buddy-emoji';
    e.textContent = any(STANDINS);
    slot.replaceChildren(e);
    nameEl.textContent = 'Yay!';
    lineEl.textContent = 'You did it!';
    metEl.textContent = '';
    if (next.failed) prepare();
  }

  const sparks = el.querySelector('.buddy-sparks');
  const n = 14;
  sparks.innerHTML = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
    const d = 150 + Math.random() * 70;
    const size = 18 + Math.random() * 16;
    return `<i style="--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d).toFixed(0)}px;--r:${Math.round(Math.random() * 120 - 60)}deg;--d:${Math.round(120 + Math.random() * 260)}ms;font-size:${size.toFixed(0)}px">${SPARKS[i % SPARKS.length]}</i>`;
  }).join('');

  timers.forEach(clearTimeout);
  el.classList.remove('show', 'out');
  void el.offsetWidth;
  el.classList.add('show');
  timers = [
    setTimeout(() => el.classList.add('out'), SHOW_MS),
    setTimeout(() => el.classList.remove('show', 'out'), SHOW_MS + 420),
  ];
  return true;
}
