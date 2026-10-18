(function () {
  "use strict";

  // Connector for the local server started by `node assets/gsc-tools/gsc.mjs serve`.
  // It only ever calls same-origin `api/...` routes on this machine; the server holds
  // the service-account key and talks to Google. The key never reaches this page.

  const headers = { "content-type": "application/json", "x-gsc-panel": "1" };

  async function post(route, body) {
    const response = await fetch(`api/${route}`, { method: "POST", headers, body: JSON.stringify(body || {}) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const detail = payload.error || {};
      const error = new Error([detail.message || `HTTP ${response.status}`, detail.hint].filter(Boolean).join(" "));
      error.code = detail.code;
      throw error;
    }
    return payload;
  }

  window.SEOCoachGscLocal = {
    // Resolves to the server's status object, or null when the page is not served by gsc.mjs.
    async probe() {
      if (!/^https?:$/.test(window.location.protocol)) return null;
      try {
        const response = await fetch("api/status", { cache: "no-store" });
        if (!response.ok) return null;
        const status = await response.json();
        return status && status.ok ? status : null;
      } catch (error) {
        return null;
      }
    },
    connector: {
      version: 2,
      local: true,
      listSites: () => post("sites"),
      query: (request) => post("query", request),
      inspectUrl: (request) => post("inspect", request),
      fetchSitemapUrls: (request) => post("sitemap", request),
      listUpdates: (request) => post("updates", request),
    },
  };
})();
