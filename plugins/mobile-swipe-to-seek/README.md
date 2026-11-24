# Mobile Swipe to Seek

Wakes the Video.js player overlay on touch, displays a `160×90` sprite preview from the scene's 9×9 `OSHash` sprite sheet (`<hash>_sprite.jpg`), moves `.vjs-vtt-thumbnail-display` horizontally with `translateX`, and seeks relative to `.vjs-play-progress.vjs-slider-bar` when touch ends.

## Features
- **Touch Overlay Wake:** Activates `vjs-user-active` on touch without interfering with buttons or control bar taps.
- **9×9 Sprite Preview:** Resolves `OSHash` from the DOM or Stash's GraphQL API and steps across `1440×810` (`160×90` tiles) as you swipe.
- **Relative Swipe Seek:** Computes target position relative to `.vjs-play-progress.vjs-slider-bar` and seeks on `touchend`.
- **Horizontal Gesture Support:** Applies `touch-action: pan-y` on the video player to reduce accidental browser back/forward swipes.
