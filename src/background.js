function hostnameFromUrl(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

function updateBadgeForTab(tabId, url) {
  const hostname = hostnameFromUrl(url);
  if (!hostname) {
    browser.action.setBadgeText({ tabId, text: "" });
    return;
  }
  getEnvironmentForHost(hostname).then((environment) => {
    if (environment === "production") {
      browser.action.setBadgeBackgroundColor({ tabId, color: "#cc0000" });
      browser.action.setBadgeText({ tabId, text: "P" });
    } else if (environment === "dev") {
      browser.action.setBadgeBackgroundColor({ tabId, color: "#e67e00" });
      browser.action.setBadgeText({ tabId, text: "D" });
    } else {
      browser.action.setBadgeText({ tabId, text: "" });
    }
  });
}

browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url) {
    updateBadgeForTab(tabId, tab.url);
  }
});

browser.tabs.onActivated.addListener((activeInfo) => {
  browser.tabs.get(activeInfo.tabId).then((tab) => {
    if (tab.url) {
      updateBadgeForTab(activeInfo.tabId, tab.url);
    }
  });
});

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local" || !changes.sites) return;

  browser.tabs.query({ active: true }).then((tabs) => {
    tabs.forEach((tab) => {
      if (tab.url) {
        updateBadgeForTab(tab.id, tab.url);
      }
    });
  });
});
