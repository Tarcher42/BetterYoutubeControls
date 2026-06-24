"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const checkboxKeys = [
    // Shorts
    "isEnable",
    "isHideVideos",
    "isHideTabs",

    // Comments
    "hide_comments",
    "hide_comment_box",
    "hide_chat",

    // Focus & Clutter
    "hide_home_feed",
    "hide_related",
    "hide_end_screens",
    "disable_ambient_glow",

    // Player Options
    "scroll_volume"
  ];

  const selectKeys = [
    "video_quality",
    "default_speed",
    "language"
  ];

  const exportBtn = document.getElementById("btn-export");
  const importTriggerBtn = document.getElementById("btn-import-trigger");
  const importFileEl = document.getElementById("import-file");

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
  }

  // --- UPDATE UI STATES ---
  function updateUI(settings) {
    // 1. Sync Checkboxes
    checkboxKeys.forEach((key) => {
      const el = document.getElementById(key);
      if (el) {
        let val = settings[key];
        if (val === undefined) {
          val = (key === "isHideTabs" || key === "hide_home_feed" || key === "hide_related" || key === "hide_end_screens" || key === "disable_ambient_glow") ? false : true;
        }
        el.checked = val;
      }
    });

    // 2. Sync Selects
    selectKeys.forEach((key) => {
      const el = document.getElementById(key);
      if (el) {
        let val = settings[key];
        if (val === undefined) {
          if (key === "video_quality") val = "auto";
          else if (key === "default_speed") val = "auto";
          else if (key === "language") val = "en";
        }
        el.value = val;
      }
    });
  }

  // Fetch initial config & localise
  chrome.storage.local.get(null, (settings) => {
    const lang = settings.language || "en";
    loadLocalization(lang).then(() => {
      updateUI(settings);
    });
  });

  // --- BIND CHECKBOX CHANGE LISTENERS ---
  checkboxKeys.forEach((key) => {
    const el = document.getElementById(key);
    if (el) {
      el.addEventListener("change", () => {
        const updateObj = {};
        updateObj[key] = el.checked;
        chrome.storage.local.set(updateObj);
      });
    }
  });

  // --- BIND SELECT CHANGE LISTENERS ---
  selectKeys.forEach((key) => {
    const el = document.getElementById(key);
    if (el) {
      el.addEventListener("change", () => {
        const updateObj = {};
        updateObj[key] = el.value;
        chrome.storage.local.set(updateObj, () => {
          if (key === "language") {
            location.reload();
          }
        });
      });
    }
  });

  // --- EXPORT CONFIGURATION ---
  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      chrome.storage.local.get(null, (settings) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
        const dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "better-youtube-settings.json");
        dlAnchorElem.click();
      });
    });
  }

  // --- IMPORT CONFIGURATION ---
  if (importTriggerBtn && importFileEl) {
    importTriggerBtn.addEventListener("click", () => {
      importFileEl.click();
    });

    importFileEl.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedSettings = JSON.parse(event.target.result);
          chrome.storage.local.clear(() => {
            chrome.storage.local.set(importedSettings, () => {
              alert(window.getMsg("msg_imported") || "Settings imported successfully!");
              location.reload();
            });
          });
        } catch (err) {
          alert(window.getMsg("msg_invalid") || "Invalid settings file!");
        }
      };
      reader.readAsText(file);
    });
  }
});
