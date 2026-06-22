"use strict";

(() => {
  const docEl = document.documentElement;

  // --- OPTION STATE VARIABLES ---
  let scrollVolumeEnabled = true;
  let videoQualitySetting = "auto";
  let playbackSpeedSetting = "1";

  // --- ATTRIBUTE SYNCS (PREVENTS SCREEN FLICKER) ---
  const attrKeys = [
    "hide_comments",
    "hide_comment_box",
    "hide_chat",
    "hide_home_feed",
    "hide_related",
    "hide_end_screens",
    "disable_ambient_glow"
  ];

  function updateAttributes(settings) {
    attrKeys.forEach((key) => {
      if (settings.hasOwnProperty(key)) {
        docEl.setAttribute(`cc_${key}`, settings[key].toString());
      }
    });

    if (settings.hasOwnProperty("scroll_volume")) {
      scrollVolumeEnabled = settings.scroll_volume;
    }
    if (settings.hasOwnProperty("video_quality")) {
      videoQualitySetting = settings.video_quality;
      qualityAttempted = false; // Reset attempt when quality setting changes
      enforceQuality();
    }
    if (settings.hasOwnProperty("default_speed")) {
      playbackSpeedSetting = settings.default_speed;
      enforceSpeed();
    }
  }

  // Load initial settings
  chrome.storage.local.get([...attrKeys, "scroll_volume", "video_quality", "default_speed"], (settings) => {
    const parsedSettings = {};
    attrKeys.forEach((key) => {
      parsedSettings[key] = settings[key] !== undefined ? settings[key] : (key === "hide_home_feed" || key === "hide_related" || key === "hide_end_screens" || key === "disable_ambient_glow" ? false : true);
    });
    parsedSettings.scroll_volume = settings.scroll_volume !== undefined ? settings.scroll_volume : true;
    parsedSettings.video_quality = settings.video_quality !== undefined ? settings.video_quality : "auto";
    parsedSettings.default_speed = settings.default_speed !== undefined ? settings.default_speed : "1";

    updateAttributes(parsedSettings);
  });

  // Listen for storage changes
  chrome.storage.onChanged.addListener((changes) => {
    const updated = {};
    Object.keys(changes).forEach((key) => {
      updated[key] = changes[key].newValue;
    });
    updateAttributes(updated);
  });

  // --- MOUSE WHEEL VOLUME CONTROL ---
  document.addEventListener("wheel", (e) => {
    if (!scrollVolumeEnabled) return;

    const player = e.target.closest("#movie_player, .html5-video-player, ytd-player, #player-container");
    if (player) {
      e.preventDefault();
      
      const nativePlayer = document.getElementById("movie_player") || document.querySelector(".html5-video-player");
      if (nativePlayer) {
        const key = e.deltaY < 0 ? 38 : 40;
        const keyEvent = new KeyboardEvent("keydown", {
          keyCode: key,
          which: key,
          bubbles: true,
          cancelable: true
        });
        nativePlayer.dispatchEvent(keyEvent);
      }
    }
  }, { passive: false });

  // --- QUALITY & SPEED CONTROLS (100% EVENT-DRIVEN) ---
  let lastVideoId = "";
  let lastQualityTime = 0;

  function getVideoId() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("v");
  }

  function enforceQuality() {
    if (videoQualitySetting === "auto") return;

    const videoId = getVideoId();
    if (!videoId) {
      lastVideoId = "";
      return;
    }

    const now = Date.now();
    // Reset when loading a new video ID
    if (videoId !== lastVideoId) {
      lastVideoId = videoId;
      lastQualityTime = now;
    }

    // Only attempt quality change in the first 3 seconds of a video load to optimize CPU
    if (now - lastQualityTime > 3000) return;

    let targetQuality = "auto";
    if (videoQualitySetting === "480p") targetQuality = "large";
    else if (videoQualitySetting === "720p") targetQuality = "hd720";
    else if (videoQualitySetting === "1080p") targetQuality = "hd1080";
    else if (videoQualitySetting === "1440p") targetQuality = "hd1440";
    else if (videoQualitySetting === "2160p") targetQuality = "highres";
    else if (videoQualitySetting === "max") targetQuality = "highres";

    // Update localStorage so YouTube's player native load reads this preference
    try {
      const data = {
        data: targetQuality,
        expiration: Date.now() + 30 * 24 * 60 * 60 * 1000,
        creation: Date.now()
      };
      localStorage.setItem("yt-player-quality", JSON.stringify(data));
    } catch (e) {}

    const player = document.getElementById("movie_player");
    if (player && typeof player.setPlaybackQualityRange === "function") {
      player.setPlaybackQualityRange(targetQuality, "auto");
      player.setPlaybackQuality(targetQuality);
    }
  }

  function enforceSpeed() {
    const video = document.querySelector("video");
    if (video && playbackSpeedSetting) {
      const targetSpeed = parseFloat(playbackSpeedSetting);
      if (video.playbackRate !== targetSpeed) {
        video.playbackRate = targetSpeed;
      }
    }
  }

  // Event: Speed change by user or page (Force our speed)
  document.addEventListener("ratechange", (e) => {
    if (e.target.tagName === "VIDEO") {
      enforceSpeed();
    }
  }, true);

  // Event: Media elements play (Set speed & quality immediately)
  document.addEventListener("play", (e) => {
    if (e.target.tagName === "VIDEO") {
      enforceSpeed();
      
      // Enforce quality immediately and with staggered delays for player load
      enforceQuality();
      setTimeout(enforceQuality, 100);
      setTimeout(enforceQuality, 500);
      setTimeout(enforceQuality, 1000);
      setTimeout(enforceQuality, 2000);
    }
  }, true);

  // Event: Navigation finish (Set initial quality and reset tracking)
  document.addEventListener("yt-navigate-finish", () => {
    enforceSpeed();
    
    enforceQuality();
    setTimeout(enforceQuality, 100);
    setTimeout(enforceQuality, 500);
    setTimeout(enforceQuality, 1000);
    setTimeout(enforceQuality, 2000);
  });

  // --- YOUTUBE SHORTS BLOCKER FEATURE ---
  function reelShelfFilter() {
    const reels = document.querySelectorAll(
      "ytd-reel-shelf-renderer, ytm-reel-shelf-renderer"
    );
    for (const reel of reels) {
      reel.remove();
    }
  }

  function richShelfFilter() {
    const shelfs = document.querySelectorAll(
      "ytd-rich-shelf-renderer:has(h2>yt-icon:not([hidden]))"
    );
    for (const shelf of shelfs) {
      shelf.remove();
    }
  }

  function shortsFilter() {
    const shorts = document.querySelectorAll(
      "ytd-video-renderer ytd-thumbnail a, ytd-grid-video-renderer ytd-thumbnail a, ytm-video-with-context-renderer a.media-item-thumbnail-container"
    );
    const tags = [
      "YTD-VIDEO-RENDERER",
      "YTD-GRID-VIDEO-RENDERER",
      "YTM-VIDEO-WITH-CONTEXT-RENDERER"
    ];
    for (const i of shorts) {
      if (i.href.indexOf("shorts") !== -1) {
        let node = i.parentNode;
        while (node) {
          if (tags.includes(node.nodeName)) {
            node.remove();
            break;
          }
          node = node.parentNode;
        }
      }
    }
  }

  async function querySelectorPromise(selectors, limit = 5, interval = 100) {
    let element;
    for (let i = 0; i < limit; i++) {
      element = document.querySelector(selectors);
      if (element) return element;
      await new Promise((resolve) => setTimeout(resolve, interval));
    }
    return null;
  }

  async function querySelectorAllPromise(selectors, limit = 5, interval = 100) {
    let elements = document.querySelectorAll(selectors);
    if (elements.length !== 0) return elements;
    for (let i = 0; i < limit - 1; i++) {
      await new Promise((resolve) => setTimeout(resolve, interval));
      elements = document.querySelectorAll(selectors);
      if (elements.length !== 0) return elements;
    }
    return elements;
  }

  var config = {
    enable: true,
    hideTabs: false,
    hideShorts: true
  };

  class Extension {
    observer = null;
    filterList = [
      reelShelfFilter,
      richShelfFilter,
      shortsFilter
    ];

    constructor() {
      if (window.location.hostname.at(0) === "m") {
        window.addEventListener("state-navigatestart", (e) => {
          this.onNavigateStart(e.detail.href, true);
        });
      } else {
        document.addEventListener("yt-navigate-start", (e) => {
          this.onNavigateStart(e.target.baseURI);
        });
      }

      chrome.storage.onChanged.addListener(() => this.loadConfig());
      this.loadConfig();

      const url = Extension.convertToVideoURL(location.href);
      if (url && config.enable) {
        location.href = url;
      }
    }

    async onNavigateStart(destinationURL, mobile = false) {
      const videoURL = Extension.convertToVideoURL(destinationURL);
      if (videoURL && config.enable) {
        history.back();
        location.href = videoURL;
      } else if (videoURL && !mobile) {
        const elements = await querySelectorAllPromise(
          "#actions.ytd-reel-player-overlay-renderer",
          20,
          100
        );
        for (const element of elements) {
          if (element.parentNode?.querySelector(".youtube-shorts-block") == null) {
            element.insertAdjacentHTML(
              "afterbegin",
              `<div id="block" class="youtube-shorts-block" title="Watch as Normal Video">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" width="24px" viewBox="0 -960 960 960">
                  <path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h280v80H200v560h560v-280h80v280q0 33-23.5 56.5T760-120H200Zm188-212-56-56 372-372H560v-80h280v280h-80v-144L388-332Z"/>
                </svg>
                Normal Video
              </div>`
            );
            element.parentNode?.querySelector("#block")?.addEventListener("click", () => {
              document.querySelectorAll("video").forEach((e) => {
                e.pause();
              });
              window.open(Extension.convertToVideoURL(location.href));
            });
          }
        }
      }
    }

    async loadConfig() {
      const storage = await chrome.storage.local.get(["isEnable", "isHideVideos", "isHideTabs"]);
      if (typeof storage.isEnable === "boolean") {
        config.enable = storage.isEnable;
      }
      if (typeof storage.isHideVideos === "boolean") {
        config.hideShorts = storage.isHideVideos;
      }
      if (typeof storage.isHideTabs === "boolean") {
        config.hideTabs = storage.isHideTabs;
      }

      this.setObserve(config.enable && config.hideShorts);
      
      const applyTabClass = () => {
        if (!document.body) {
          window.addEventListener("DOMContentLoaded", applyTabClass, { once: true });
          return;
        }
        const extensionClass = "youtube-shorts-block";
        if (config.hideTabs) {
          document.body.classList.add(extensionClass);
        } else {
          document.body.classList.remove(extensionClass);
        }
      };
      applyTabClass();
    }

    async setObserve(isObserve) {
      if (isObserve) {
        if (this.observer !== null) return;
        const container = await querySelectorPromise("#content, #app");
        if (!container) {
          window.addEventListener("DOMContentLoaded", () => this.setObserve(isObserve), { once: true });
          return;
        }
        this.observer = new MutationObserver(() => this.domChanged());
        this.observer.observe(container, {
          childList: true,
          subtree: true
        });
        this.domChanged();
      } else {
        if (this.observer === null) return;
        this.observer.disconnect();
        this.observer = null;
      }
    }

    domChanged() {
      for (const filter of this.filterList) {
        filter();
      }
    }

    static convertToVideoURL(url) {
      const result = url.match(/shorts\/(.{11})\/?/);
      if (result) {
        return `https://www.youtube.com/watch?v=${result[1]}`;
      }
    }
  }

  const initExtension = () => {
    new Extension();
    enforceSpeed();
    enforceQuality();
  };

  if (document.body) {
    initExtension();
  } else {
    window.addEventListener("DOMContentLoaded", initExtension, { once: true });
  }
})();
