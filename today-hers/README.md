# Today ♡

A pastel daily task list that resets every morning, and a new Pokémon pops up to celebrate every task she finishes.

It is a copy of the [Today](https://github.com/samhuffvisuals/today) app with a softer look and one new feature. Everything else works the same: daily tasks, one-tap packs, swipe to complete or delete, long-press to reorder, the history calendar, and backup and restore. It is a static PWA with no build step, no backend and no accounts. Her tasks are stored only on her phone.

## Put it on her iPhone Home Screen

1. GitHub Pages serves this folder with the rest of the repo, so the address is the Pages URL plus `/today-hers/` (something like `https://samhuffvisuals.github.io/Sam-iphone/today-hers/`).
2. Open that address in **Safari** on her iPhone.
3. Tap **Share → Add to Home Screen**, make sure **Open as Web App** is on, then tap **Add**.

Open it from the Home Screen icon before adding tasks. The Home Screen app keeps its own storage, separate from Safari.

## What's different from Today

- **Pastel look.** A light pink, lavender and mint theme, the rounded Fredoka font, softer cards, and a heart for the days-done counter. The day color moves from pink (nothing done) through peach and butter to mint (all done).
- **Pokémon friends.** Checking off a task makes a Pokémon spring up in the middle of the screen, hop around in a burst of sparkles and hearts, and say something nice. Every one is new: the app remembers who she has met, shows the cutest ones first, and repeats nobody until all 1,025 have turned up. Taps pass straight through the animation, so she never has to wait for it.
- **Her own starter list.** Two daily tasks and three packs (Self care, Clean house, Trip) to start from. She can change or delete all of them.
- **Separate data.** It saves under its own key, so it never mixes with the original Today app, even on the same phone.

Turn the Pokémon off or on in **Settings → Feel → Pokémon friends**. The same row shows how many she has met.

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
