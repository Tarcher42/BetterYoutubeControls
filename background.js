"use strict";

const DEFAULT_SETTINGS = {
  // Shorts
  isEnable: true,
  isHideVideos: true,
  isHideTabs: false,

  // Comments
  hide_comments: true,
  hide_comment_box: true,
  hide_chat: true,

  // Focus & Clutter
  hide_home_feed: false,
  hide_related: false,
  hide_end_screens: false,
  disable_ambient_glow: false,

  // Player Options
  scroll_volume: true,
  video_quality: "auto",      // Preferred video resolution ("auto", "480p", "720p", "1080p", "1440p", "2160p", "max")
  default_speed: "auto",         // Playback speed ("auto", "1", "1.25", "1.5", "1.75", "2", "2.5", "3", "3.5", "4")

  // Language Override
  language: "en"
};

// Initialize default storage values
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(null, (current) => {
    const toSet = {};
    for (const [key, val] of Object.entries(DEFAULT_SETTINGS)) {
      if (current[key] === undefined) {
        toSet[key] = val;
      }
    }
    if (Object.keys(toSet).length > 0) {
      chrome.storage.local.set(toSet);
    }
  });
});
