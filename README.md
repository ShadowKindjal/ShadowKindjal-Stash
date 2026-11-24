# Stash Plugins

A collection of custom plugins for [Stash](https://github.com/stashapp/stash).

## Installation

### Manual Install
1. Download or clone this repository.
2. Copy the desired plugin folder from `plugins/` (for example, `plugins/mobile-swipe-to-seek`) into your Stash `plugins/` directory.
3. In Stash, go to **Settings > Plugins** and click **Reload Plugins**.

*(Optional)* If you enable GitHub Pages for `index.yml`, you can also add your GitHub Pages index URL under **Settings > Plugins > Add Source**.

## Plugins

- **[Mobile Swipe to Seek](./plugins/mobile-swipe-to-seek/README.md)** — Wakes the player overlay on touch, previews 9×9 `OSHash` sprite tiles along the scrub bar, and seeks relative to `.vjs-play-progress.vjs-slider-bar` on release.
