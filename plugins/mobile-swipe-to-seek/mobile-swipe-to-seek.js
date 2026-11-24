(function () {
  'use strict';

  if (window.__stashMobileSwipeToSeekLoaded) return;
  window.__stashMobileSwipeToSeekLoaded = true;

  const GRID_COLS = 9;
  const GRID_ROWS = 9;
  const TOTAL_TILES = GRID_COLS * GRID_ROWS; // 81
  const TILE_WIDTH = 160;
  const TILE_HEIGHT = 90;
  const OVERLAY_HIDE_DELAY_MS = 2500;

  let startX = 0;
  let startY = 0;
  let startRatio = 0;
  let startTime = 0;
  let targetTime = null;
  let swiping = false;
  let hideTimer = null;

  let player = null;
  let video = null;
  let thumb = null;
  let progressControl = null;
  let playProgressBar = null;
  let spriteUrl = '';

  const sceneHashCache = new Map();

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function clearHideTimer() {
    if (hideTimer !== null) {
      clearTimeout(hideTimer);
      hideTimer = null;
    }
  }

  function wakeOverlay(targetPlayer) {
    const p = targetPlayer || player || document.querySelector('.video-js');
    if (!p) return;
    clearHideTimer();
    p.classList.remove('vjs-user-inactive');
    p.classList.add('vjs-user-active');
  }

  function scheduleOverlayHide(targetPlayer, delayMs = OVERLAY_HIDE_DELAY_MS) {
    const p = targetPlayer || player;
    clearHideTimer();
    if (!p) return;
    hideTimer = setTimeout(() => {
      if (!swiping && p && p.isConnected) {
        p.classList.remove('vjs-user-active');
        p.classList.add('vjs-user-inactive');
      }
    }, delayMs);
  }

  function getOsHashFromDom() {
    const abbr = document.querySelector('abbr[title="OpenSubtitles Hash"]');
    if (abbr) {
      const dl = abbr.closest('dl');
      const truncated = dl ? dl.querySelector('.TruncatedText') : null;
      if (truncated && truncated.textContent.trim()) {
        return truncated.textContent.trim();
      }
      const dd = abbr.parentElement && abbr.parentElement.nextElementSibling;
      const ddTruncated = dd ? dd.querySelector('.TruncatedText') : null;
      if (ddTruncated && ddTruncated.textContent.trim()) {
        return ddTruncated.textContent.trim();
      }
    }

    const fallbackTruncated = document.querySelector('.scene-file-info .TruncatedText');
    return fallbackTruncated ? fallbackTruncated.textContent.trim() : '';
  }

  function getSceneIdFromUrl() {
    const match = location.pathname.match(/\/scenes\/(\d+)/);
    return match ? match[1] : '';
  }

  async function resolveSpriteUrl() {
    const domHash = getOsHashFromDom();
    if (domHash) {
      return `${location.origin}/scene/${encodeURIComponent(domHash)}_sprite.jpg`;
    }

    const sceneId = getSceneIdFromUrl();
    if (!sceneId) return '';

    if (sceneHashCache.has(sceneId)) {
      const cachedHash = sceneHashCache.get(sceneId);
      return cachedHash ? `${location.origin}/scene/${encodeURIComponent(cachedHash)}_sprite.jpg` : '';
    }

    try {
      const res = await fetch(`${location.origin}/graphql`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `
            query FindSceneHash($id: ID!) {
              findScene(id: $id) {
                files {
                  fingerprints {
                    type
                    value
                  }
                }
              }
            }
          `,
          variables: { id: sceneId },
        }),
      });
      if (!res.ok) return '';
      const json = await res.json();
      const files = json?.data?.findScene?.files || [];
      for (const file of files) {
        const fp = (file.fingerprints || []).find(
          (f) => String(f.type || '').toLowerCase() === 'oshash' && f.value
        );
        if (fp) {
          sceneHashCache.set(sceneId, fp.value.trim());
          return `${location.origin}/scene/${encodeURIComponent(fp.value.trim())}_sprite.jpg`;
        }
      }
      sceneHashCache.set(sceneId, '');
    } catch (_) {}

    return '';
  }

  function getSpriteOffsets(ratio) {
    const index = clamp(Math.floor(ratio * TOTAL_TILES), 0, TOTAL_TILES - 1);
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    return {
      x: -(col * TILE_WIDTH),
      y: -(row * TILE_HEIGHT),
    };
  }

  function getTrackWidth() {
    const refEl = progressControl || player;
    if (!refEl) return 1;
    return Math.max(refEl.getBoundingClientRect().width, 1);
  }

  function getPlayProgressRatio(trackWidth) {
    if (playProgressBar) {
      const barWidth = playProgressBar.getBoundingClientRect().width;
      if (barWidth > 0) {
        return clamp(barWidth / trackWidth, 0, 1);
      }
    }
    if (video && Number.isFinite(video.duration) && video.duration > 0) {
      return clamp((video.currentTime || 0) / video.duration, 0, 1);
    }
    return 0;
  }

  function updateSwipePreview(dx) {
    if (!player) return;

    wakeOverlay(player);

    const trackWidth = getTrackWidth();
    const targetRatio = clamp(startRatio + dx / trackWidth, 0, 1);

    const hasDuration = video && Number.isFinite(video.duration) && video.duration > 0;
    const duration = hasDuration ? video.duration : 1800;
    targetTime = hasDuration
      ? targetRatio * duration
      : Math.max(0, startTime + (dx / trackWidth) * 120);

    if (!thumb) return;

    const { x, y } = getSpriteOffsets(targetRatio);
    const maxX = Math.max(0, trackWidth - TILE_WIDTH);
    const tx = clamp(targetRatio * trackWidth - TILE_WIDTH / 2, 0, maxX);

    if (!spriteUrl) {
      spriteUrl = getOsHashFromDom()
        ? `${location.origin}/scene/${encodeURIComponent(getOsHashFromDom())}_sprite.jpg`
        : '';
    }

    thumb.style.width = `${TILE_WIDTH}px`;
    thumb.style.height = `${TILE_HEIGHT}px`;
    thumb.style.transform = `translateX(${tx.toFixed(1)}px)`;

    if (spriteUrl) {
      thumb.style.background = `url("${spriteUrl}") ${x}px ${y}px no-repeat`;
    }

    thumb.style.setProperty('opacity', '1', 'important');
  }

  function finishTouch() {
    const activePlayer = player;

    if (swiping && video && targetTime !== null && Number.isFinite(targetTime)) {
      if (Number.isFinite(video.duration) && video.duration > 0) {
        video.currentTime = clamp(targetTime, 0, video.duration);
      } else {
        video.currentTime = Math.max(0, targetTime);
      }
    }

    if (thumb) {
      thumb.style.removeProperty('opacity');
      thumb.style.opacity = '0';
    }

    if (activePlayer) {
      activePlayer.classList.remove('vjs-user-inactive');
      activePlayer.classList.add('vjs-user-active');
      scheduleOverlayHide(activePlayer, OVERLAY_HIDE_DELAY_MS);
    }

    startX = 0;
    startY = 0;
    startRatio = 0;
    startTime = 0;
    targetTime = null;
    swiping = false;
    player = null;
    video = null;
    thumb = null;
    progressControl = null;
    playProgressBar = null;
  }

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) return;

    const foundPlayer = e.target.closest('.video-js') || document.querySelector('.video-js');
    if (!foundPlayer) return;

    wakeOverlay(foundPlayer);

    if (
      e.target.closest(
        'button, .vjs-control-bar, .vjs-progress-control, .vjs-big-button-group, .vjs-menu, .vjs-modal-dialog'
      )
    ) {
      scheduleOverlayHide(foundPlayer, OVERLAY_HIDE_DELAY_MS);
      return;
    }

    player = foundPlayer;
    video = player.querySelector('video');
    thumb = player.querySelector('.vjs-vtt-thumbnail-display');
    progressControl = player.querySelector('.vjs-progress-control');
    playProgressBar = player.querySelector('.vjs-play-progress.vjs-slider-bar');
    spriteUrl = '';

    resolveSpriteUrl().then((resolved) => {
      if (resolved && player) {
        spriteUrl = resolved;
      }
    });

    const trackWidth = getTrackWidth();
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    startRatio = getPlayProgressRatio(trackWidth);
    startTime = video ? video.currentTime || 0 : 0;
    targetTime = null;
    swiping = false;
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!player || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (!swiping && Math.abs(dx) > 20 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiping = true;
    }

    if (swiping) {
      updateSwipePreview(dx);
    } else {
      wakeOverlay(player);
    }
  }, { passive: true });

  document.addEventListener('touchend', finishTouch, { passive: true });
  document.addEventListener('touchcancel', finishTouch, { passive: true });
})();
