# PokeMMO Encounter Companion

A desktop-first second-screen companion app for browsing PokeMMO encounters by region, route, time of day, rarity, EV yield, and Pokemon name.

## Features

- Region and route navigation
- Route-first encounter browsing
- Global "All routes" search across regions
- Search and filters for encounter type, rarity, EV yield, time of day, and region
- Sort by Pokedex number, name, catch rate, level, and rarity
- Detailed Pokemon popup with base stats, profile data, type defense, evolution line, encounters, abilities, and moves
- Local JSON-backed Pokemon and move data
- Local route map assets
- Light and dark mode

## Local Development

Install dependencies:

```bash
npm install
```

Start the dev server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## GitHub Pages

This project includes a GitHub Actions workflow at:

```text
.github/workflows/deploy-pages.yml
```

After pushing to the `main` branch, GitHub will build the app and publish the `dist` folder to GitHub Pages.

In the GitHub repository settings:

1. Go to `Settings`.
2. Go to `Pages`.
3. Set `Build and deployment` source to `GitHub Actions`.

The deployed URL will usually be:

```text
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/
```

## Data

The app currently imports:

- `pokedex json.json`
- `src/data/moveData.json`
- route image assets in `public/`

These files are local so the deployed app does not need to call the PokeMMO info API at runtime.
