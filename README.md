# ShadowKindjal-Stash

Custom plugins and tweaks for [Stash](https://github.com/stashapp/stash).

## Adding This Source to Stash

1. Enable **GitHub Pages** on this repository (**Settings > Pages**).
2. In Stash, go to **Settings > Plugins > Available Plugins** and click **Add Source**.
3. Enter the [`index.yml`](https://shadowkindjal.github.io/ShadowKindjal-Stash/index.yml) URL (`https://shadowkindjal.github.io/ShadowKindjal-Stash/index.yml`).
4. Click **Reload** / **Reload Plugins**, then install from **Available Plugins**.

## Manual Installation

1. Copy the desired folder inside `plugins/` (for example, `plugins/mobile-swipe-to-seek`) into your Stash `plugins/` directory.
2. Go to **Settings > Plugins** and click **Reload Plugins**.

## Plugins

- **[Mobile Swipe to Seek](./plugins/mobile-swipe-to-seek/README.md)** — Wakes the player overlay on touch, previews 9×9 `OSHash` sprite tiles along the scrub bar, and seeks relative to `.vjs-play-progress.vjs-slider-bar` on release.
