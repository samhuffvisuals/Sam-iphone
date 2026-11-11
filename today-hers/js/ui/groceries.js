// Groceries: one list per store, sorted into that store's aisles as she types.
import { store, uid, MAX_CATEGORIES } from '../store.js';
import { haptic } from '../haptics.js';
import { toggleTask } from '../actions.js';
import { render } from './render.js';
import { openSheet } from './sheets.js';
import { cheer } from './buddy.js';
import { burst } from './effects.js';
import { toast } from './toast.js';
import { ICON, esc } from './icons.js';
import {
  SECTIONS, CHAINS, sectionOf, ensure, storeOf, itemsAt, leftAt, grouped, addItem, splitItems,
  teach, bought, usualStore, usuals, listText, makeStore,
} from '../grocery-data.js';

const save = () => store.save();
const PINK = '#ff9ec4';

/* ---------- the link to today ---------- */

const taskFor = (s, g, storeId) => s.tasks.find((t) => t.id === g.tasks[storeId] && t.dayKey === s.day.key);

// A home for grocery runs in the list: an existing Groceries/Errands group, or a new one.
function groceryCat(s) {
  const hit = s.categories.find((c) => /grocer|errand|shopping/i.test(c.name));
  if (hit) return hit.id;
  if (s.categories.length < MAX_CATEGORIES) {
    const c = { id: uid(), name: 'Groceries', emoji: '🛒', color: 'green' };
    s.categories.push(c);
    return c.id;
  }
  return 'general';
}

function putOnToday(s, g, storeId) {
  const st = storeOf(g, storeId);
  const order = s.tasks.reduce((m, t) => Math.min(m, t.order || 0), 0) - 1;
  const t = { id: uid(), text: `${st.name} run`, catId: groceryCat(s), type: 'today', order, dayKey: s.day.key, grocery: storeId };
  s.tasks.push(t);
  g.tasks[storeId] = t.id;
  delete s.settings.collapsed[t.catId];
  save();
  render({ animate: true });
}

// Keeps the "… run" task in step with the list: every item checked checks it off
// (and its Pokémon pops up), unchecking one opens it again.
function syncTask(s, g, storeId) {
  const items = itemsAt(g, storeId);
  const finished = items.length > 0 && items.every((i) => i.done);
  const t = taskFor(s, g, storeId);
  if (t) {
    if (finished !== !!s.day.done[t.id]) toggleTask(t.id);
    return;
  }
  if (finished) cheer();
}

/* ---------- main sheet ---------- */

export function openGroceries(storeId) {
  const s = store.state;
  const g = ensure(s);
  if (storeId && g.stores.some((x) => x.id === storeId)) g.store = storeId;
  save();

  const sheet = openSheet({
    title: 'Groceries',
    className: 'grocery-sheet',
    onClose: () => render(),
    content: `
      <div class="g-stores" data-role="stores"></div>
      <form class="add-form g-add" autocomplete="off">
        <input class="field" type="text" data-role="input" maxlength="300" enterkeyhint="done"
               autocapitalize="sentences" autocomplete="off" aria-label="Add groceries">
        <button class="add-go" type="submit" aria-label="Add">${ICON.up}</button>
      </form>
      <p class="g-tip">Add a few at once: <b>milk, eggs, bread</b>. They sort themselves into aisles.</p>
      <div data-role="usuals"></div>
      <div data-role="list"></div>
      <div class="g-actions" data-role="actions"></div>`,
  });
  const $ = sheet.$;
  const input = $('[data-role=input]');
  const cur = () => storeOf(g, g.store);

  const paintStores = () => {
    $('[data-role=stores]').innerHTML =
      g.stores
        .map((st) => {
          const n = leftAt(g, st.id);
          return `<button type="button" class="g-store" data-store="${st.id}" aria-pressed="${st.id === g.store}">
            <span>${esc(st.emoji)}</span>${esc(st.name)}${n ? `<b>${n}</b>` : ''}</button>`;
        })
        .join('') + `<button type="button" class="g-store g-store-new" data-act="new-store" aria-label="Add a store">${ICON.plus}</button>`;
    input.placeholder = `Add to ${cur().name}…`;
    $('[data-role=stores] [aria-pressed=true]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  };

  const paintUsuals = () => {
    const list = usuals(g, g.store);
    $('[data-role=usuals]').innerHTML = list.length
      ? `<h3>Usuals at ${esc(cur().name)}</h3><div class="suggest">${list
          .map((t) => `<button type="button" class="sug" data-usual="${esc(t)}" style="--c:${PINK}"><i></i>${esc(t)}</button>`)
          .join('')}</div>`
      : '';
  };

  const paintList = () => {
    const groups = grouped(g, g.store);
    const box = $('[data-role=list]');
    if (!groups.length) {
      box.innerHTML = `<div class="g-empty"><div>🧺</div><p>Nothing on the ${esc(cur().name)} list yet.</p></div>`;
    } else {
      box.innerHTML = groups
        .map(({ sec, items }) => {
          const left = items.filter((i) => !i.done).length;
          return `<section class="g-sec"><h4><span>${sec.emoji}</span>${esc(sec.name)}<small>${left || '✓'}</small></h4>
            <ul>${items
              .map(
                (i) => `<li class="g-item${i.done ? ' done' : ''}" data-id="${i.id}">
                  <button type="button" class="g-check" aria-label="${i.done ? 'Uncheck' : 'Got'} ${esc(i.text)}" aria-pressed="${i.done}">${ICON.check}</button>
                  <span class="g-text">${esc(i.text)}</span>
                  <button type="button" class="g-more" aria-label="Edit ${esc(i.text)}">•••</button></li>`
              )
              .join('')}</ul></section>`;
        })
        .join('');
    }
    paintActions();
  };

  const paintActions = () => {
    const items = itemsAt(g, g.store);
    const got = items.filter((i) => i.done).length;
    const t = taskFor(s, g, g.store);
    $('[data-role=actions]').innerHTML = `
      ${items.length && !t ? `<button type="button" class="btn" data-act="today">Put “${esc(cur().name)} run” on today</button>` : ''}
      ${t ? `<p class="g-linked">${s.day.done[t.id] ? '✓ Done on today' : '✓ On today · finishing the list checks it off'}</p>` : ''}
      <div class="g-row">
        ${items.some((i) => !i.done) ? `<button type="button" class="btn ghost" data-act="share">Share list</button>` : ''}
        ${got ? `<button type="button" class="btn ghost" data-act="clear">Clear ${got} checked</button>` : ''}
      </div>
      <button type="button" class="btn ghost small" data-act="edit-store">Edit ${esc(cur().name)} · aisles</button>`;
  };

  const paintAll = () => {
    paintStores();
    paintUsuals();
    paintList();
  };
  paintAll();

  const add = (text) => {
    const parts = splitItems(text);
    let n = 0;
    let lastNew = null;
    for (const p of parts) {
      const r = addItem(g, p, g.store);
      if (!r) continue;
      n++;
      if (!r.merged) lastNew = r.item;
    }
    if (!n) return;
    save();
    haptic('tap');
    paintAll();
    syncTask(s, g, g.store);
    const el = lastNew && $(`.g-item[data-id="${lastNew.id}"]`);
    el?.classList.add('fresh');
    // It's usually bought somewhere else: offer to move it there.
    if (parts.length === 1 && lastNew) {
      const other = usualStore(g, lastNew.text, g.store);
      if (other) {
        toast(`You usually get this at ${other.name}`, {
          action: 'Move',
          onAction() {
            lastNew.store = other.id;
            save();
            paintAll();
          },
        });
        return;
      }
      toast(`${sectionOf(lastNew.sec).emoji} ${lastNew.text} → ${sectionOf(lastNew.sec).name}`, { duration: 2200 });
    } else if (n > 1) toast(`Added ${n} items`, { duration: 2200 });
  };

  $('.g-add').addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value;
    input.value = '';
    add(text);
  });
  // Pasting a whole list (one item per line) adds them all.
  input.addEventListener('paste', (e) => {
    const text = e.clipboardData?.getData('text') || '';
    if (!/\n/.test(text.trim())) return;
    e.preventDefault();
    add(text);
  });

  sheet.body.addEventListener('click', (e) => {
    const st = e.target.closest('[data-store]');
    if (st) {
      g.store = st.dataset.store;
      save();
      haptic('tap');
      return paintAll();
    }
    const u = e.target.closest('[data-usual]');
    if (u) return add(u.dataset.usual);

    const check = e.target.closest('.g-check');
    if (check) {
      const li = check.closest('.g-item');
      const item = g.items.find((i) => i.id === li.dataset.id);
      if (!item) return;
      item.done = !item.done;
      if (item.done) {
        bought(g, item);
        const r = check.getBoundingClientRect();
        burst(r.left + r.width / 2, r.top + r.height / 2, PINK);
      }
      save();
      haptic(item.done ? 'success' : 'tap');
      li.classList.toggle('done', item.done);
      setTimeout(() => {
        paintList();
        paintStores();
      }, 260);
      return syncTask(s, g, g.store);
    }
    const more = e.target.closest('.g-more');
    if (more) {
      haptic('tap');
      return openItem(g, more.closest('.g-item').dataset.id, paintAll);
    }

    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    haptic('tap');
    if (act === 'new-store') openStore(g, null, paintAll);
    else if (act === 'edit-store') openStore(g, g.store, paintAll);
    else if (act === 'today') {
      putOnToday(s, g, g.store);
      paintActions();
      toast(`Added “${cur().name} run” to today`);
    } else if (act === 'share') shareList(g);
    else if (act === 'clear') {
      const before = g.items;
      g.items = g.items.filter((i) => !(i.store === g.store && i.done));
      save();
      paintAll();
      toast('Cleared. They’re in your usuals now.', {
        action: 'Undo',
        onAction() {
          g.items = before;
          save();
          paintAll();
        },
      });
    }
  });
}

async function shareList(g) {
  const text = listText(g, g.store);
  try {
    if (navigator.share) return await navigator.share({ text });
  } catch (e) {
    if (e?.name === 'AbortError') return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast('List copied');
  } catch {
    toast('Couldn’t share the list');
  }
}

/* ---------- one item ---------- */

function openItem(g, id, repaint) {
  const item = g.items.find((i) => i.id === id);
  if (!item) return;
  const sheet = openSheet({
    title: 'Item',
    content: `
      <input class="field" type="text" data-role="name" value="${esc(item.text)}" maxlength="140" aria-label="Item name">
      <h3>Aisle</h3>
      <div class="chips" data-role="secs">${SECTIONS.map(
        (x) => `<button type="button" class="chip" data-sec="${x.id}" style="--c:${PINK}" aria-pressed="${x.id === item.sec}">${x.emoji} ${esc(x.name)}</button>`
      ).join('')}</div>
      <p class="hint">Moving it teaches the app: next time it goes here on its own.</p>
      <h3>Store</h3>
      <div class="chips" data-role="stores">${g.stores
        .map((st) => `<button type="button" class="chip" data-store="${st.id}" style="--c:${PINK}" aria-pressed="${st.id === item.store}">${esc(st.emoji)} ${esc(st.name)}</button>`)
        .join('')}</div>
      <button type="button" class="btn" data-act="done">Done</button>
      <button type="button" class="btn danger" data-act="delete">Remove from list</button>`,
    onClose() {
      const name = sheet.$('[data-role=name]').value.trim();
      if (name && name !== item.text) item.text = name;
      store.save();
      repaint();
    },
  });
  sheet.body.addEventListener('click', (e) => {
    const sec = e.target.closest('[data-sec]');
    if (sec) {
      teach(g, item, sec.dataset.sec);
      sheet.$$('[data-sec]').forEach((b) => b.setAttribute('aria-pressed', String(b === sec)));
      return haptic('tap');
    }
    const st = e.target.closest('[data-store]');
    if (st) {
      item.store = st.dataset.store;
      sheet.$$('[data-store]').forEach((b) => b.setAttribute('aria-pressed', String(b === st)));
      return haptic('tap');
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'delete') g.items = g.items.filter((i) => i.id !== id);
    if (act) {
      haptic('tap');
      sheet.close();
    }
  });
}

/* ---------- a store: add, rename, reorder aisles, delete ---------- */

function openStore(g, id, repaint) {
  const existing = id && g.stores.find((x) => x.id === id);
  const st = existing ? { ...existing, order: [...existing.order] } : { name: '', emoji: '🛒', kind: 'generic', order: makeStore('', '').order };
  const taken = new Set(g.stores.map((x) => x.name.toLowerCase()));

  const sheet = openSheet({
    title: existing ? existing.name : 'Add a store',
    content: `
      ${existing ? '' : `<div class="chips" data-role="chains">${CHAINS.filter((c) => !taken.has(c.name.toLowerCase()))
        .map((c) => `<button type="button" class="chip" data-chain="${esc(c.name)}" style="--c:${PINK}">${c.emoji} ${esc(c.name)}</button>`)
        .join('')}</div><h3>Or type one</h3>`}
      <div class="cat-row">
        <input class="field emoji-field" type="text" data-role="emoji" value="${esc(st.emoji)}" maxlength="4" aria-label="Store emoji">
        <input class="field" type="text" data-role="name" value="${esc(st.name)}" placeholder="Store name" maxlength="40" aria-label="Store name">
      </div>
      <h3>Aisle order</h3>
      <p class="hint" style="margin-top:0">The list follows this order through the store. Move aisles to match yours.</p>
      <ol class="g-order" data-role="order"></ol>
      <button type="button" class="btn" data-act="save">${existing ? 'Save' : 'Add store'}</button>
      ${existing && g.stores.length > 1 ? `<button type="button" class="btn danger" data-act="delete">Delete store</button>` : ''}`,
  });
  const $ = sheet.$;

  const paintOrder = () => {
    $('[data-role=order]').innerHTML = st.order
      .map((sid, i) => {
        const x = sectionOf(sid);
        return `<li><span>${x.emoji}</span><b>${esc(x.name)}</b>
          <button type="button" data-up="${i}" aria-label="Move ${esc(x.name)} earlier" ${i ? '' : 'disabled'}>↑</button>
          <button type="button" data-down="${i}" aria-label="Move ${esc(x.name)} later" ${i < st.order.length - 1 ? '' : 'disabled'}>↓</button></li>`;
      })
      .join('');
  };
  paintOrder();

  let armed = false;
  sheet.body.addEventListener('click', (e) => {
    const chain = e.target.closest('[data-chain]');
    if (chain) {
      const c = CHAINS.find((x) => x.name === chain.dataset.chain);
      const made = makeStore(c.name, c.emoji, c.kind);
      g.stores.push(made);
      g.store = made.id;
      store.save();
      haptic('success');
      sheet.close();
      return repaint();
    }
    const up = e.target.closest('[data-up]');
    const down = e.target.closest('[data-down]');
    if (up || down) {
      const i = Number((up || down).dataset[up ? 'up' : 'down']);
      const j = up ? i - 1 : i + 1;
      [st.order[i], st.order[j]] = [st.order[j], st.order[i]];
      haptic('tap');
      return paintOrder();
    }
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'save') {
      const name = $('[data-role=name]').value.trim();
      if (!name) return $('[data-role=name]').focus();
      const emoji = $('[data-role=emoji]').value.trim() || '🛒';
      if (existing) Object.assign(existing, { name, emoji, order: st.order });
      else {
        const made = { ...makeStore(name, emoji), order: st.order };
        g.stores.push(made);
        g.store = made.id;
      }
      store.save();
      haptic('success');
      sheet.close();
      repaint();
    } else if (act === 'delete') {
      const btn = e.target.closest('[data-act]');
      const n = itemsAt(g, id).length;
      if (!armed) {
        armed = true;
        btn.classList.add('armed');
        btn.textContent = n ? `Delete store and its ${n} ${n === 1 ? 'item' : 'items'}?` : 'Tap again to delete';
        return haptic('snap');
      }
      g.stores = g.stores.filter((x) => x.id !== id);
      g.items = g.items.filter((i) => i.store !== id);
      delete g.tasks[id];
      g.store = g.stores[0].id;
      store.save();
      haptic('tap');
      sheet.close();
      repaint();
    }
  });
}
