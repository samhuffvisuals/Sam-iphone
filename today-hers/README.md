# Today ♡

A pastel daily task list that resets every morning, and a new Pokémon pops up to celebrate every task she finishes. It also has steps under tasks, a Groceries category with a section for each store, and packs she picks from.

It is a copy of the [Today](https://github.com/samhuffvisuals/today) app with a softer look and one new feature. Everything else works the same: daily tasks, one-tap packs, swipe to complete or delete, long-press to reorder, the history calendar, and backup and restore. It is a static PWA with no build step, no backend and no accounts. Her tasks are stored only on her phone.

## Put it on her iPhone Home Screen

1. GitHub Pages serves this folder with the rest of the repo, so the address is the Pages URL plus `/today-hers/` (something like `https://samhuffvisuals.github.io/Sam-iphone/today-hers/`).
2. Open that address in **Safari** on her iPhone.
3. Tap **Share → Add to Home Screen**, make sure **Open as Web App** is on, then tap **Add**.

Open it from the Home Screen icon before adding tasks. The Home Screen app keeps its own storage, separate from Safari.

## What's different from Today

- **Pastel look.** A light pink, lavender and mint theme, the rounded Fredoka font, softer cards, and a heart for the days-done counter. The day color moves from pink (nothing done) through peach and butter to mint (all done).
- **Pokémon friends.** Checking off a task makes a Pokémon spring up in the middle of the screen, hop around in a burst of sparkles and hearts, and say something nice. Every one is new: the app remembers who she has met, shows the cutest ones first, and repeats nobody until all 1,025 have turned up. Taps pass straight through the animation, so she never has to wait for it.
- **Her own starter list.** Two daily tasks, a Groceries category (she can add as many categories as she likes) and four packs (Self care, Clean house, Trip, Grocery staples) to start from. She can change or delete all of them.
- **Separate data.** It saves under its own key, so it never mixes with the original Today app, even on the same phone.

Turn the Pokémon off or on in **Settings → Feel → Pokémon friends**. The same row shows how many she has met.

## Steps (subtasks)

Any task can have steps underneath it, like *Clean living room* → *Dust shelves*, *Fluff pillows*.

- Add them from the long-press menu (**Add steps**), from **Add a step** under the steps, or in the task's edit screen (tap the task).
- The card shows how many are done (`1/3`) with an arrow. Tap it to fold the steps away or show them again.
- Checking the last step checks off the task, and a Pokémon celebrates. Unchecking a step opens the task again. Checking the task itself checks every step.
- Daily tasks start each day with their steps unchecked.

## Long-press a task

Hold a task and let go to get **Duplicate**, **Add steps**, **Edit** and **Delete**. Duplicate puts an unchecked copy right under the original, steps included, with Undo in case. To move a task, hold it and drag as before.

## Groceries

**Groceries** is a category like General or Home, with a section for each store: Trader Joe’s, Costco, Target and Whole Foods to start. Grocery items are ordinary tasks: check them off, swipe, drag, and finished ones clear away overnight. The Groceries category always shows, even when the list is empty.

- **Add to a store** with the **Add to Costco** row under that store, or pick the store in the add screen. **Add to Groceries** at the top is for things that can come from anywhere (they show under *Any store*).
- **Several at once:** `milk, eggs, bread` (or a pasted list, one per line) becomes three items. Names like *mac and cheese* stay whole.
- **Fold a store away** by tapping its name. The count shows how much is done there.
- **Reorder & edit stores** (under the list, or in Settings → Grocery stores): move stores up and down with the arrows, rename them, change the emoji, delete one, or add another (Walmart, Aldi, Kroger, Publix, Sprouts and more in one tap, or any name). Deleting a store keeps its items: they move to *Any store*.
- **Move an item** to another store by tapping it and picking the store.
- The **Grocery staples** pack lets her choose which store its items go to.

## Packs

Tap a pack to choose what goes on today. Everything starts picked: tap items to unpick them, or use **Select all** and **Unselect all**, then **Add to today**. Items already on today are marked and can't be added twice. Long-press a pack to edit it.

## Things to know

- **The Pokémon artwork needs a connection.** The pictures are loaded from [PokeAPI's public sprite collection](https://github.com/PokeAPI/sprites) and are not stored in this repo. The app loads the next one ahead of time so it appears instantly. With no connection, a little emoji celebrates instead, and nobody is counted as met.
- **Pokémon is a trademark of Nintendo, Creatures and Game Freak.** This is a personal fan project and is not affiliated with them.
- **Shipping updates.** The service worker caches the app for offline use. When you change a file, bump the version in `sw.js` (`today-hers-v2`, and so on). If you add a JS, CSS or font file, add it to the `ASSETS` list there too.

## Files

| File | What it does |
|---|---|
| `js/ui/buddy.js` | The Pokémon celebration: picks a new one, preloads its picture, runs the pop-up |
| `js/pokemon-data.js` | Pokémon names by Pokédex number, and the list of the cutest ones that go first |
| `css/app.css` | The pastel theme and all animations |
| `fonts/fredoka.woff2` | The Fredoka font (SIL Open Font License, see `fonts/OFL.txt`) |
| everything else | Unchanged in structure from Today: see that repo's README for how the daily reset, packs and haptics work |
