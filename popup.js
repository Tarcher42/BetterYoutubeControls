"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const checkboxKeys = [
    "isEnable",
    "isHideVideos",
    "isHideTabs",
    "hide_comments",
    "hide_comment_box",
    "hide_chat",
    "hide_home_feed",
    "hide_related",
    "hide_end_screens",
    "disable_ambient_glow",
    "scroll_volume"
  ];

  const selectKeys = [
    "video_quality",
    "default_speed"
  ];

  const subtitleEl = document.getElementById("status-subtitle");
  const settingsBtn = document.getElementById("btn-settings");

  let messagesDict = {};

  // --- CUSTOM TRANSLATOR (SUPPORTS MANUAL LANGUAGE SELECT) ---
  async function loadLocalization(lang) {
    let targetLang = lang || "en";
    if (targetLang === "sys") {
      targetLang = navigator.language.startsWith("tr") ? "tr" : "en";
    }

    try {
      const url = chrome.runtime.getURL(`_locales/${targetLang}/messages.json`);
      const res = await fetch(url);
      messagesDict = await res.json();
    } catch (e) {
      // Fallback to English on failure
      const url = chrome.runtime.getURL(`_locales/en/messages.json`);
      const res = await fetch(url);
      messagesDict = await res.json();
    }

    // Helper to extract message
    window.getMsg = (key, placeholders = []) => {
      let item = messagesDict[key];
      if (!item) return "";
      let msg = item.message;
      if (placeholders.length > 0) {
        placeholders.forEach((ph, i) => {
          msg = msg.replace(`$${i + 1}`, ph);
        });
        msg = msg.replace("$count$", placeholders[0]);
      }
      return msg;
    };

    localiseDOM();
  }

  function localiseDOM() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const translation = window.getMsg(key);
      if (translation) {
        el.textContent = translation;
      }
    });
    document.querySelectorAll("[data-i18n-title]").forEach(el => {
      const key = el.getAttribute("data-i18n-title");
      const translation = window.getMsg(key);
      if (translation) {
        el.title = translation;
      }
    });
  }

  // --- UPDATE UI STATES AND FILTER COUNT ---
  function updateUI(settings) {
    let activeCount = 0;

    // 1. Sync Checkboxes
    checkboxKeys.forEach((key) => {
      const el = document.getElementById(key);
      if (el) {
        let val = settings[key];
        if (val === undefined) {
          val = (key === "isHideTabs" || key === "hide_home_feed" || key === "hide_related" || key === "hide_end_screens" || key === "disable_ambient_glow") ? false : true;
        }
        el.checked = val;
        if (val) activeCount++;
      }
    });

    // 2. Sync Selects
    selectKeys.forEach((key) => {
      const el = document.getElementById(key);
      if (el) {
        let val = settings[key];
        if (val === undefined) {
          val = "auto";
        }
        el.value = val;
        if (val !== "auto") {
          activeCount++;
        }
      }
    });

    // 3. Update Title Count
    if (activeCount > 0) {
      if (activeCount === 1) {
        subtitleEl.textContent = window.getMsg("status_active_single") || "1 FILTER ACTIVE";
      } else {
        subtitleEl.textContent = window.getMsg("status_active", [activeCount.toString()]) || `${activeCount} FILTERS ACTIVE`;
      }
      subtitleEl.classList.add("active-filters");
    } else {
      subtitleEl.textContent = window.getMsg("status_disabled") || "ALL FILTERS DISABLED";
      subtitleEl.classList.remove("active-filters");
    }
  }

  // Fetch settings & localise
  chrome.storage.local.get(null, (settings) => {
    const lang = settings.language || "en";
    loadLocalization(lang).then(() => {
      updateUI(settings);
    });
  });

  // --- BIND EVENT LISTENERS ---
  checkboxKeys.forEach((key) => {
    const el = document.getElementById(key);
    if (el) {
      el.addEventListener("change", () => {
        const updateObj = {};
        updateObj[key] = el.checked;
        chrome.storage.local.set(updateObj, () => {
          triggerUIUpdate();
        });
      });
    }
  });

  selectKeys.forEach((key) => {
    const el = document.getElementById(key);
    if (el) {
      el.addEventListener("change", () => {
        const updateObj = {};
        updateObj[key] = el.value;
        chrome.storage.local.set(updateObj, () => {
          triggerUIUpdate();
        });
      });
    }
  });

  if (settingsBtn) {
    settingsBtn.addEventListener("click", () => {
      chrome.runtime.openOptionsPage();
    });
  }

  function triggerUIUpdate() {
    chrome.storage.local.get(null, (settings) => {
      updateUI(settings);
    });
  }
});
