# Backyard

An iPhone web app for backyard ultras: run a loop (4.167 mi by default) every hour, tap **Done** when you finish it, rest until the next loop starts, and go again. Miss the hour and you're out.

## Put it on your iPhone Home Screen

1. GitHub Pages must serve the branch this app is on: **Settings → Pages → Deploy from a branch**, pick the branch and `/ (root)`, then **Save**.
2. In **Safari** on your iPhone, open the Pages URL with `/backyard/` on the end, for example `https://samhuffvisuals.github.io/Sam-iphone/backyard/`.
3. Tap **Share → Add to Home Screen**.

Open it from the Home Screen icon. The Home Screen app keeps its own storage, separate from Safari.

## Racing

- **Race tab:** pick the loop distance (4.167 mi official, 4 mi, or custom), how often a loop starts (60 min is standard), and whether loop 1 starts now or at a set time. Then **Start race**.
- While you run, the screen shows the time left in the hour, time elapsed, GPS distance, pace, the pace you need to make the cutoff, and your route.
- **Hold DONE** for under a second when you finish the loop. Holding instead of tapping stops a bump in your pocket from ending a loop early. The rest countdown then runs until the next loop.
- Like a real backyard: whistles at 3, 2 and 1 minutes before each loop, a bell at the start, and voice callouts with 10 and 5 minutes left. Turn them off under **Results → ⋯**.
- The next loop starts on its own. If the hour runs out before you tap Done, the race ends as "Missed cutoff". **End race** finishes it yourself.

**Keep the app open with the screen on while racing.** The app keeps the screen awake. iPhone stops GPS and sound for web apps when the screen locks, but the race clock is always correct when you come back, because it runs off the real time.

## Results

- **Races:** every race with loops, miles and average loop time. Tap one for running vs. rest per loop, the route, splits, and share, rename or delete.
- **Stats:** most loops, total loops and miles, fastest loop, loops per race and average loop time over time, and personal records.
- **⋯ → Back up / Restore:** saves your races and friends to a file. Data lives only on your phone, so back up now and then.

## Friends

- Add your name, then **Invite friends** to send a link or code through Messages or anywhere else.
- When a friend opens your link (or pastes your code under **+**), you show up on their leaderboard. They send theirs back so they're on yours.
- The leaderboard ranks by most loops, total miles or fastest loop. Tap a friend to compare stats side by side.
- There's no server, so a friend's stats update when they send you a new invite after a race.
