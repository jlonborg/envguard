function renderList() {
  const list = document.getElementById("site-list");
  getSites().then((sites) => {
    list.innerHTML = "";
    Object.keys(sites).sort().forEach((hostname) => {
      const environment = sites[hostname];
      const li = document.createElement("li");

      const label = document.createElement("span");
      label.textContent = hostname;
      label.title = hostname;

      const select = document.createElement("select");
      ["dev", "production"].forEach((env) => {
        const option = document.createElement("option");
        option.value = env;
        option.textContent = env;
        if (env === environment) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener("change", () => {
        setSite(hostname, select.value).then(renderList);
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.addEventListener("click", () => {
        removeSite(hostname).then(renderList);
      });

      li.appendChild(label);
      li.appendChild(select);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });
  });
}

function showStatusMessage(message) {
  const statusMessage = document.getElementById("status-message");
  statusMessage.textContent = message;
  statusMessage.hidden = false;
}

document.getElementById("add-current").addEventListener("click", () => {
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    const hostname = new URL(tabs[0].url).hostname;
    if (!hostname) {
      showStatusMessage("This page has no hostname and can't be tagged.");
      return;
    }
    setSite(hostname, "dev").then(renderList);
  });
});

document.getElementById("manual-add-btn").addEventListener("click", () => {
  const hostname = document.getElementById("manual-hostname").value.trim();
  const environment = document.getElementById("manual-environment").value;
  if (!hostname) return;
  setSite(hostname, environment).then(() => {
    document.getElementById("manual-hostname").value = "";
    renderList();
  });
});

renderList();
