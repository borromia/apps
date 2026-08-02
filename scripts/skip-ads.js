// ==UserScript==
// @name        SkipAds and Allow PiP
// @description Attaches a keyboard shortcut to skip ads on SonyLiv
// @match       *://www.hotstar.com/**
// @match       *://www.netflix.com/**
// @match       *://www.southparkstudios.com/**
// @match       *://www.primevideo.com/**
// @version      2025-10-10
// ==/UserScript==


const getCurrentlyPlayingVideo = () => {
    return [...document.getElementsByTagName("video")].filter(v => !v.paused)[0]
}

const getFirstVideo = () => {
    return [...document.getElementsByTagName("video")][0]
}

document.showToastMsg = (message) => {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 24px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        animation: slideDown 0.3s ease-out;
        pointer-events: none;
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideUp 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

document.skipAds = () => {
    const allVideos = [...document.getElementsByTagName("video")]
    const ads = allVideos.filter(v => !v.paused)

    if (!ads || ads.length === 0) {
        return { success: false, reason: 'No video currently playing' }
    }

    const ad = ads[0]
    
    // Only skip if duration is less than 5 minutes (300 seconds)
    if (ad.duration >= 300) {
        return { success: false, reason: `Video too long (${Math.floor(ad.duration / 60)} mins)` }
    }

    ad.currentTime = ad.duration - 0.2
    return { success: true }
}

if (!document.keyPressListenersAttached) {
    document.addEventListener("keydown", (keyPressEvent) => {
        if (keyPressEvent.key.toLowerCase() === 's') {
            const result = document.skipAds()
            if (result.success) {
                console.warn(`Skipping Ads...`)
            } else {
                console.warn(`Cannot skip: ${result.reason}`)
                document.showToastMsg(`Cannot skip: ${result.reason}`)
            }
        }

        if (keyPressEvent.key.toLowerCase() === 'a') {
            if (document.autoSkipEnabled) {
                // Turn off auto-skip
                document.autoSkipEnabled = false
                clearInterval(document.autoSkipIntervalId)
                document.showToastMsg('Auto-skip disabled')
                console.info('Auto-skip disabled')
            } else {
                // Turn on auto-skip
                document.autoSkipEnabled = true
                document.showToastMsg('Auto-skip enabled')
                console.info('Auto-skip enabled')
                
                document.autoSkipIntervalId = setInterval(() => {
                    const result = document.skipAds()
                    if (result.success) {
                        console.warn('Auto-skipping ad...')
                    }
                }, 1000)
            }
        }

        if (keyPressEvent.key.toLowerCase() === 'p') {
            const vElem = getFirstVideo()
            console.info(`Picture in picture...`, vElem)

            // Safari-specific handling
            if (vElem.webkitSetPresentationMode) {
                if (vElem.webkitPresentationMode === 'picture-in-picture') {
                    vElem.webkitSetPresentationMode('inline');
                } else {
                    vElem.webkitSetPresentationMode('picture-in-picture');
                }
                return;
            }

            // Chrome / Standard Picture-in-Picture handling
            if (document.pictureInPictureElement === vElem) {
                document.exitPictureInPicture();
            } else if (document.pictureInPictureEnabled) {
                try {
                    vElem.requestPictureInPicture();
                } catch (err) {
                    console.error('Failed to enter Picture-in-Picture mode:', err);
                }
            } else {
                console.warn('Picture-in-Picture not supported in this browser.');
            }
        }
    })
    document.keyPressListenersAttached = true

    // Initialize auto-skip state
    document.autoSkipEnabled = false
    document.autoSkipIntervalId = null

//     const intervalId = setInterval(() => document.skipAds(), 1e3)
//     console.error('Attached skipAds listener with id:', intervalId)
}

const style = document.createElement('style');
style.textContent = `
  video::cue {
    font-size: 14px;
  }
  
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-10px);
    }
  }
`;
document.head.appendChild(style);

