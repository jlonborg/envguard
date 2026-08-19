(function () {
  const BANNER_ID = "envguard-banner";
  const STYLE_ID = "envguard-style";

  function injectProductionBanner() {
    if (document.getElementById(BANNER_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${BANNER_ID} {
        display: block !important;
        position: relative !important;
        z-index: 2147483647 !important;
        background: #cc0000 !important;
        color: #fff;
        font-weight: bold;
        text-align: center;
        padding: 8px 0;
        font-family: sans-serif;
        font-size: 14px;
      }
    `;
    document.documentElement.appendChild(style);

    const banner = document.createElement("div");
    banner.id = BANNER_ID;
    banner.textContent = "⚠ PRODUCTION";

    const attach = () => document.body.prepend(banner);
    if (document.body) {
      attach();
    } else {
      document.addEventListener("DOMContentLoaded", attach, { once: true });
    }
  }

  function injectDevFrame() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .envguard-dev-frame {
        display: block !important;
        position: fixed !important;
        background: repeating-linear-gradient(45deg, orange, orange 10px, black 10px, black 20px) !important;
        z-index: 2147483647 !important;
        pointer-events: none;
      }
      .envguard-dev-frame.top { top: 0 !important; left: 0 !important; right: 0 !important; height: 10px !important; }
      .envguard-dev-frame.bottom { bottom: 0 !important; left: 0 !important; right: 0 !important; height: 10px !important; }
      .envguard-dev-frame.left { top: 0 !important; bottom: 0 !important; left: 0 !important; width: 10px !important; }
      .envguard-dev-frame.right { top: 0 !important; bottom: 0 !important; right: 0 !important; width: 10px !important; }
    `;
    document.documentElement.appendChild(style);

    const attach = () => {
      ["top", "bottom", "left", "right"].forEach((side) => {
        const bar = document.createElement("div");
        bar.className = `envguard-dev-frame ${side}`;
        document.body.appendChild(bar);
      });
    };
    if (document.body) {
      attach();
    } else {
      document.addEventListener("DOMContentLoaded", attach, { once: true });
    }
  }

  if (!location.hostname) return;

  getEnvironmentForHost(location.hostname).then((environment) => {
    if (environment === "production") {
      injectProductionBanner();
    } else if (environment === "dev") {
      injectDevFrame();
    }
  });
})();
