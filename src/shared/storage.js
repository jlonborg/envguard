function getSites() {
  return browser.storage.local.get("sites").then((result) => result.sites || {});
}

function getEnvironmentForHost(hostname) {
  return getSites().then((sites) => sites[hostname] || null);
}

function setSite(hostname, environment) {
  return getSites().then((sites) => {
    sites[hostname] = environment;
    return browser.storage.local.set({ sites });
  });
}

function removeSite(hostname) {
  return getSites().then((sites) => {
    delete sites[hostname];
    return browser.storage.local.set({ sites });
  });
}
