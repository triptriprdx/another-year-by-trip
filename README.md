# Another Year

A mobile-first life simulator. Build a character, choose a career, make decisions, and move through life one year at a time.

## Play

The game is designed for mobile browsers and saves the current life in the browser's local storage. Your save stays on the device and browser where you play; clearing site data will remove it.

## Gameplay

- Create a character aged 13–17 and choose a background.
- Choose a career: footballer, chess player, boxer, musician, artist, or cowboy. The cowboy career takes place in the Old West; actor is currently marked as work in progress.
- Each Advance Year action moves the calendar forward by exactly one year and presents a life event with choices.
- Spend time between years studying, resting, working, socializing, volunteering, and interacting with people.
- Train through career mini-games, improve skills, and unlock career milestones.
- Build relationships, purchase homes and transport, customize your character, and review your life history.
- The game can be played without an account or paid API.

## Save data

A single local save is stored under the browser's local storage. There is no cloud sync or cross-device save system at this stage.

## Development

Requirements: Bun.

```sh
bun install
bun run dev
```

Run the automated gameplay tests and production build:

```sh
bun run test
bun run build
```

GitHub Actions runs the same test and build checks on every push to `main`.

## Tech

- React + TypeScript
- TanStack Start
- Tailwind CSS
- chess.js for legal chess moves
- Vitest for gameplay engine tests
