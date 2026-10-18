(function () {
  "use strict";

  // Shared runtime for the panel: storage, locale, formatting, the connector data
  // layer, pixel charts and small HTML builders. Views live in views.js.

  const engine = window.SEOCoachGscEngine;
  const P = (window.__SEOCoachGscPanel = {});
  const STORAGE_PREFIX = "seo-coach-gsc-panel-v2:";
  const LOCALE_LOAD_TIMEOUT_MS = 3000;
  const LOCALE_TAG = /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,4})?$/;
  const registry = (window.SEOCoachGscLocales = window.SEOCoachGscLocales || {});

  P.engine = engine;
  P.ui = {};

  // --- storage ----------------------------------------------------------------
  const store = (P.store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(STORAGE_PREFIX + key);
        return raw == null ? fallback : JSON.parse(raw);
      } catch (error) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
        return true;
      } catch (error) {
        return false;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(STORAGE_PREFIX + key);
      } catch (error) {
        /* storage unavailable */
      }
    },
    clearAll() {
      try {
        Object.keys(localStorage)
          .filter((key) => key.startsWith(STORAGE_PREFIX))
          .forEach((key) => localStorage.removeItem(key));
      } catch (error) {
        /* storage unavailable */
      }
    },
    // Everything the student typed into the panel, as one portable object.
    dump() {
      const out = {};
      try {
        for (const key of Object.keys(localStorage)) if (key.startsWith(STORAGE_PREFIX)) out[key.slice(STORAGE_PREFIX.length)] = JSON.parse(localStorage.getItem(key));
      } catch (error) {
        /* storage unavailable */
      }
      return { panel: "seo-coach-gsc-panel", version: 2, saved: out };
    },
    load(file) {
      if (!file || file.panel !== "seo-coach-gsc-panel" || !file.saved || typeof file.saved !== "object") throw new Error("not a panel export");
      for (const [key, value] of Object.entries(file.saved)) store.set(key, value);
    },
    siteKey(name) {
      return `site:${P.state.site}:${name}`;
    },
    getSite(name, fallback) {
      return store.get(store.siteKey(name), fallback);
    },
    setSite(name, value) {
      return store.set(store.siteKey(name), value);
    },
  });

  // --- state ------------------------------------------------------------------
  const emptyFilter = () => ({ query: { op: "contains", value: "" }, page: { op: "contains", value: "" }, country: "", device: "" });
  P.emptyFilter = emptyFilter;

  P.state = {
    locale: "en",
    theme: store.get("theme", "auto"),
    connector: null,
    connection: "checking", // checking | none | legacy | live | demo | error
    connectionError: "",
    sites: [],
    site: "",
    rangeId: store.get("range", "3m"),
    compare: store.get("compare", "previous"),
    filter: emptyFilter(),
    view: "overview",
    options: { ...engine.DEFAULT_OPTIONS, ...store.get("options", {}) },
    today: engine.localToday(),
  };

  P.range = () => engine.resolveRange(P.state.rangeId, P.state.today, undefined, P.state.compare);
  P.lastDataDate = () => engine.addDays(P.state.today, -engine.DATA_LAG_DAYS);

  // --- locale -----------------------------------------------------------------
  function isDictionary(value) {
    return Boolean(value && typeof value === "object" && typeof value.name === "string" && (value.dir === "ltr" || value.dir === "rtl"));
  }

  function canonicalTag(value) {
    const text = String(value || "").trim().replace(/_/g, "-");
    if (!LOCALE_TAG.test(text)) return "";
    const [language, region] = text.split("-");
    if (!region) return language.toLowerCase();
    const tail = region.length === 4 ? region[0].toUpperCase() + region.slice(1).toLowerCase() : region.toUpperCase();
    return `${language.toLowerCase()}-${tail}`;
  }

  // Resolve a raw language tag to a locale that is already registered.
  function matchLocale(value) {
    const lower = String(value || "").trim().replace(/_/g, "-").toLowerCase();
    if (!lower) return null;
    const keys = Object.keys(registry).filter((key) => isDictionary(registry[key]));
    const find = (wanted) => keys.find((key) => key.toLowerCase() === wanted) || null;
    const exact = find(lower);
    if (exact) return exact;
    if (lower === "zh" || lower.startsWith("zh-")) return find(/hant|-tw|-hk|-mo/.test(lower) ? "zh-hant" : "zh-hans");
    return find(lower.split("-")[0]);
  }

  // Priority: ?lang= → manual choice in this browser → the coach's panel-config.js
  // (the language of the conversation) → browser language → English.
  function preferredTags() {
    const tags = [];
    try {
      tags.push(new URLSearchParams(window.location.search).get("lang"));
    } catch (error) {
      /* no URL API */
    }
    tags.push(store.get("locale", ""));
    tags.push(window.SEOCoachGscPanelConfig && window.SEOCoachGscPanelConfig.locale);
    const browser = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];
    return tags.concat(browser).filter(Boolean).map(String);
  }

  function detectLocale() {
    for (const tag of preferredTags()) {
      const hit = matchLocale(tag);
      if (hit) return hit;
    }
    return matchLocale("en") || Object.keys(registry)[0] || "en";
  }

  function loadLocaleScript(tag) {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
        resolve(ok);
      };
      const timer = setTimeout(() => finish(false), LOCALE_LOAD_TIMEOUT_MS);
      script.src = `locales/${encodeURIComponent(tag)}.js`;
      script.onload = () => finish(true);
      script.onerror = () => finish(false);
      document.head.appendChild(script);
    });
  }

  // A language the skill does not bundle is generated once by the coach as
  // locales/<tag>.js. Try the tags that outrank the locale we fell back to.
  async function autoloadPreferredLocale() {
    for (const raw of preferredTags()) {
      if (matchLocale(raw)) return null;
      const full = canonicalTag(raw);
      const candidates = Array.from(new Set([full, full.split("-")[0]])).filter(Boolean);
      for (const tag of candidates) {
        if ((await loadLocaleScript(tag)) && matchLocale(tag)) return matchLocale(tag);
      }
    }
    return null;
  }

  function registerLocale(tag, dictionary, options) {
    const key = canonicalTag(tag);
    if (!key || !isDictionary(dictionary)) return false;
    registry[key] = dictionary;
    if (options && options.activate) P.setLocale(key);
    return true;
  }

  function t(key, params) {
    const dictionary = registry[P.state.locale] || {};
    const fallback = registry.en || {};
    let text = dictionary[key] != null ? dictionary[key] : fallback[key] != null ? fallback[key] : key;
    if (params) text = String(text).replace(/\{\{([\w.-]+)\}\}/g, (match, name) => (params[name] != null ? params[name] : match));
    return text;
  }

  function applyI18n(scope) {
    const rootNode = scope || document;
    rootNode.querySelectorAll("[data-i18n]").forEach((node) => (node.textContent = t(node.getAttribute("data-i18n"))));
    rootNode.querySelectorAll("[data-i18n-aria]").forEach((node) => node.setAttribute("aria-label", t(node.getAttribute("data-i18n-aria"))));
    rootNode.querySelectorAll("[data-i18n-placeholder]").forEach((node) => node.setAttribute("placeholder", t(node.getAttribute("data-i18n-placeholder"))));
    rootNode.querySelectorAll("[data-i18n-content]").forEach((node) => node.setAttribute("content", t(node.getAttribute("data-i18n-content"))));
  }

  function applyLocale() {
    const dictionary = registry[P.state.locale] || {};
    document.documentElement.lang = P.state.locale;
    document.documentElement.dir = dictionary.dir || "ltr";
    document.title = t("meta.title");
    applyI18n(document);
  }

  P.setLocale = function setLocale(value, remember) {
    const hit = matchLocale(value);
    if (!hit) return false;
    P.state.locale = hit;
    if (remember) store.set("locale", hit);
    applyLocale();
    if (P.onLocaleChange) P.onLocaleChange();
    return true;
  };

  P.t = t;
  P.locale = { detect: detectLocale, autoload: autoloadPreferredLocale, register: registerLocale, apply: applyLocale, applyI18n, match: matchLocale, list: () => Object.keys(registry).filter((key) => isDictionary(registry[key])).map((key) => ({ tag: key, name: registry[key].name })) };

  // --- theme ------------------------------------------------------------------
  P.applyTheme = function applyTheme() {
    const dark = P.state.theme === "dark" || (P.state.theme === "auto" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  };

  P.setTheme = function setTheme(value) {
    P.state.theme = ["auto", "light", "dark"].includes(value) ? value : "auto";
    store.set("theme", P.state.theme);
    P.applyTheme();
  };

  // --- formatting -------------------------------------------------------------
  function intl(options) {
    try {
      return new Intl.NumberFormat(P.state.locale, options);
    } catch (error) {
      return new Intl.NumberFormat("en", options);
    }
  }

  const fmt = (P.fmt = {
    int(value) {
      return Number.isFinite(value) ? intl({ maximumFractionDigits: 0 }).format(value) : "—";
    },
    compact(value) {
      if (!Number.isFinite(value)) return "—";
      return Math.abs(value) < 10000 ? fmt.int(value) : intl({ notation: "compact", maximumFractionDigits: 1 }).format(value);
    },
    decimal(value, digits) {
      const places = digits == null ? 1 : digits;
      return Number.isFinite(value) ? intl({ minimumFractionDigits: places, maximumFractionDigits: places }).format(value) : "—";
    },
    pct(ratio, digits) {
      return Number.isFinite(ratio) ? `${fmt.decimal(ratio * 100, digits == null ? 1 : digits)}%` : "—";
    },
    pos(value) {
      return Number.isFinite(value) && value > 0 ? fmt.decimal(value, 1) : "—";
    },
    date(iso, withYear) {
      if (!iso) return "—";
      try {
        const options = withYear ? { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" } : { month: "short", day: "numeric", timeZone: "UTC" };
        return new Intl.DateTimeFormat(P.state.locale, options).format(new Date(`${String(iso).slice(0, 10)}T00:00:00Z`));
      } catch (error) {
        return String(iso).slice(0, 10);
      }
    },
    month(key) {
      try {
        return new Intl.DateTimeFormat(P.state.locale, { month: "short", timeZone: "UTC" }).format(new Date(`${key}-01T00:00:00Z`));
      } catch (error) {
        return key.slice(5);
      }
    },
    period(window) {
      return window ? `${fmt.date(window.start, true)} – ${fmt.date(window.end, true)}` : "—";
    },
  });

  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
  }
  P.esc = esc;

  P.urlPath = function urlPath(url) {
    const match = String(url || "").match(/^https?:\/\/[^/?#]+(.*)$/i);
    return match ? match[1] || "/" : String(url || "");
  };

  P.siteLabel = (siteUrl) => String(siteUrl || "").replace(/^sc-domain:/, "").replace(/^https?:\/\//, "").replace(/\/$/, "");

  // --- connector data layer ---------------------------------------------------
  const cache = new Map();

  function isConnector(value) {
    return Boolean(value && typeof value.query === "function" && typeof value.listSites === "function");
  }

  const data = (P.data = {
    isConnector,
    isLegacyConnector: (value) => Boolean(value && !isConnector(value) && typeof value.load === "function"),
    clearCache: () => cache.clear(),
    can: (method) => Boolean(P.state.connector && typeof P.state.connector[method] === "function"),

    // spec: { dimensions, start, end, filter (object | false), extra (API filters), rowLimit, startRow, site }
    request(spec) {
      const filter = spec.filter === false ? null : spec.filter || P.state.filter;
      const request = {
        siteUrl: spec.site || P.state.site,
        startDate: spec.start,
        endDate: spec.end,
        dimensions: spec.dimensions || [],
        type: "web",
        dataState: "final",
        rowLimit: Math.min(spec.rowLimit || engine.ROW_LIMIT, engine.ROW_LIMIT),
        startRow: spec.startRow || 0,
      };
      const groups = engine.buildFilterGroups(filter, spec.extra);
      if (groups) request.dimensionFilterGroups = groups;
      return request;
    },

    async query(spec) {
      const request = data.request(spec);
      const key = JSON.stringify(request);
      if (!cache.has(key)) {
        const pending = Promise.resolve()
          .then(() => P.state.connector.query(request))
          .then((response) => {
            const rows = engine.rowsFromResponse(response || {}, request.dimensions);
            return { rows, partial: rows.length >= request.rowLimit, request };
          });
        cache.set(key, pending);
        pending.catch(() => cache.delete(key));
      }
      return cache.get(key);
    },

    // Follow startRow paging until the API runs dry or maxRows is reached.
    async queryPaged(spec, maxRows) {
      const limit = maxRows || engine.ROW_LIMIT * 2;
      const rows = [];
      let partial = false;
      for (let startRow = 0; startRow < limit; startRow += engine.ROW_LIMIT) {
        const page = await data.query({ ...spec, rowLimit: engine.ROW_LIMIT, startRow });
        rows.push(...page.rows);
        if (page.rows.length < engine.ROW_LIMIT) break;
        if (startRow + engine.ROW_LIMIT >= limit) partial = true;
      }
      return { rows, partial };
    },

    // Google's published ranking updates, when the connector can supply them.
    updates() {
      const connector = P.state.connector;
      if (!connector || typeof connector.listUpdates !== "function") return Promise.resolve([]);
      if (!cache.has("updates")) cache.set("updates", Promise.resolve().then(() => connector.listUpdates({ since: engine.oldestDate(P.state.today) })).then((list) => (Array.isArray(list) ? list : [])).catch(() => []));
      return cache.get("updates");
    },

    async inspect(url) {
      const response = await P.state.connector.inspectUrl({ siteUrl: P.state.site, inspectionUrl: url, languageCode: P.state.locale });
      return engine.normalizeInspection(response);
    },
  });

  // Run async work over a list with a small concurrency cap; keeps API quota calm.
  P.pool = async function pool(items, limit, worker) {
    const results = new Array(items.length);
    let cursor = 0;
    const run = async () => {
      while (cursor < items.length) {
        const index = cursor;
        cursor += 1;
        results[index] = await worker(items[index], index);
      }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, run));
    return results;
  };

  // --- pixel charts -----------------------------------------------------------
  function niceMax(value) {
    if (!(value > 0)) return 4;
    const step = 10 ** Math.floor(Math.log10(value / 4));
    const unit = [1, 2, 2.5, 5, 10].find((candidate) => candidate * step * 4 >= value) * step;
    return unit * 4;
  }

  function steppedPath(points) {
    let path = "";
    let pen = false;
    for (const point of points) {
      if (!point) {
        pen = false;
        continue;
      }
      path += pen ? `H${point[0]}V${point[1]}` : `M${point[0]} ${point[1]}`;
      pen = true;
    }
    return path;
  }

  function bucketValues(values, size, mode) {
    if (values.length <= size) return values;
    const out = [];
    const span = values.length / size;
    for (let index = 0; index < size; index += 1) {
      const slice = values.slice(Math.floor(index * span), Math.floor((index + 1) * span)).filter((value) => value != null);
      if (!slice.length) out.push(mode === "mean" ? null : 0);
      else out.push(mode === "mean" ? slice.reduce((sum, value) => sum + value, 0) / slice.length : slice.reduce((sum, value) => sum + value, 0));
    }
    return out;
  }

  const chart = (P.chart = {
    // series: [{ values, cls, name }], labels: one per point, markers: [{ index, text }]
    line(options) {
      const W = 960;
      const H = 260;
      const box = { left: 52, right: 12, top: 16, bottom: 28 };
      const count = Math.max(...options.series.map((item) => item.values.length), 1);
      const max = niceMax(Math.max(...options.series.flatMap((item) => item.values.map((value) => value || 0)), 0));
      const innerW = W - box.left - box.right;
      const innerH = H - box.top - box.bottom;
      const x = (index) => Math.round(box.left + (count <= 1 ? 0 : (index * innerW) / (count - 1)));
      const y = (value) => Math.round(box.top + innerH * (1 - value / max));
      const format = options.format || fmt.compact;
      let svg = `<svg class="px-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(options.label || "")}" shape-rendering="crispEdges">`;
      for (let tick = 0; tick <= 4; tick += 1) {
        const value = (max / 4) * tick;
        svg += `<line class="px-grid" x1="${box.left}" x2="${W - box.right}" y1="${y(value)}" y2="${y(value)}"/><text class="px-axis" x="${box.left - 6}" y="${y(value) + 4}" text-anchor="end">${esc(format(value))}</text>`;
      }
      const labelEvery = Math.max(1, Math.ceil(count / 7));
      (options.labels || []).forEach((label, index) => {
        if (index % labelEvery === 0) svg += `<text class="px-axis" x="${x(index)}" y="${H - 8}" text-anchor="${index === 0 ? "start" : "middle"}">${esc(label)}</text>`;
      });
      for (const marker of options.markers || []) {
        if (marker.index < 0 || marker.index >= count) continue;
        svg += `<g class="px-marker ${marker.cls || ""}"><line x1="${x(marker.index)}" x2="${x(marker.index)}" y1="${box.top}" y2="${H - box.bottom}"/><rect x="${x(marker.index) - 4}" y="${box.top - 4}" width="8" height="8"/><title>${esc(marker.text)}</title></g>`;
      }
      for (const item of options.series) {
        const points = item.values.map((value, index) => (value == null ? null : [x(index), y(value)]));
        svg += `<path class="px-line ${item.cls || ""}" d="${steppedPath(points)}" fill="none"/>`;
      }
      const slot = count <= 1 ? innerW : innerW / (count - 1);
      for (let index = 0; index < count; index += 1) {
        const lines = options.series.filter((item) => item.values[index] != null).map((item) => `${item.name}: ${format(item.values[index])}${item.labels && item.labels[index] ? ` (${item.labels[index]})` : ""}`);
        svg += `<rect class="px-hit" x="${x(index) - slot / 2}" y="${box.top}" width="${slot}" height="${innerH}"><title>${esc(lines.join("\n"))}</title></rect>`;
      }
      return `${svg}</svg>`;
    },

    // Column chart for volumes. The previous period is drawn as a tick across each column.
    columns(options) {
      const W = 960;
      const H = 260;
      const box = { left: 52, right: 12, top: 16, bottom: 28 };
      const values = options.values;
      const previous = options.previous || [];
      const count = Math.max(values.length, 1);
      const max = niceMax(Math.max(...values, ...previous, 0));
      const innerW = W - box.left - box.right;
      const innerH = H - box.top - box.bottom;
      const slot = innerW / count;
      const barW = Math.max(1, Math.floor(slot * 0.68));
      const y = (value) => Math.round(box.top + innerH * (1 - value / max));
      const center = (index) => Math.round(box.left + index * slot + slot / 2);
      const format = options.format || fmt.compact;
      let svg = `<svg class="px-chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(options.label || "")}" shape-rendering="crispEdges">`;
      for (let tick = 0; tick <= 4; tick += 1) {
        const value = (max / 4) * tick;
        svg += `<line class="px-grid" x1="${box.left}" x2="${W - box.right}" y1="${y(value)}" y2="${y(value)}"/><text class="px-axis" x="${box.left - 6}" y="${y(value) + 4}" text-anchor="end">${esc(format(value))}</text>`;
      }
      const labelEvery = Math.max(1, Math.ceil(count / 8));
      values.forEach((value, index) => {
        const base = H - box.bottom;
        svg += `<rect class="px-bar" x="${center(index) - Math.floor(barW / 2)}" y="${y(value)}" width="${barW}" height="${Math.max(0, base - y(value))}"/>`;
        if (previous[index] != null) svg += `<rect class="px-prev" x="${Math.round(box.left + index * slot)}" y="${y(previous[index]) - 1}" width="${Math.ceil(slot)}" height="3"/>`;
        if (index % labelEvery === 0 && options.labels) svg += `<text class="px-axis" x="${center(index)}" y="${H - 8}" text-anchor="middle">${esc(options.labels[index])}</text>`;
      });
      for (const marker of options.markers || []) {
        if (marker.index < 0 || marker.index >= count) continue;
        svg += `<g class="px-marker ${marker.cls || ""}"><line x1="${center(marker.index)}" x2="${center(marker.index)}" y1="${box.top}" y2="${H - box.bottom}"/><rect x="${center(marker.index) - 5}" y="${box.top - 5}" width="10" height="10"/><title>${esc(marker.text)}</title></g>`;
      }
      values.forEach((value, index) => {
        const lines = [options.labels ? options.labels[index] : "", `${options.name}: ${format(value)}`];
        if (previous[index] != null) lines.push(`${options.previousName}: ${format(previous[index])}`);
        svg += `<rect class="px-hit" x="${box.left + index * slot}" y="${box.top}" width="${slot}" height="${innerH}"><title>${esc(lines.join("\n"))}</title></rect>`;
      });
      return `${svg}</svg>`;
    },

    // Column sparkline for volumes.
    spark(values, cls) {
      const bars = bucketValues(values, 30, "sum");
      const max = Math.max(...bars, 1);
      const width = 4;
      let svg = `<svg class="px-spark ${cls || ""}" viewBox="0 0 ${bars.length * width} 24" width="${bars.length * width}" height="24" preserveAspectRatio="none" aria-hidden="true" shape-rendering="crispEdges">`;
      bars.forEach((value, index) => {
        const height = value > 0 ? Math.max(2, Math.round((value / max) * 22)) : 1;
        svg += `<rect x="${index * width}" y="${24 - height}" width="${width - 1}" height="${height}"/>`;
      });
      return `${svg}</svg>`;
    },

    // Stepped sparkline for average position; a smaller number is drawn higher.
    rankSpark(values) {
      const points = bucketValues(values, 30, "mean");
      const present = points.filter((value) => value != null);
      if (!present.length) return `<span class="muted">—</span>`;
      const min = Math.min(...present);
      const max = Math.max(...present);
      const span = Math.max(max - min, 1);
      const coords = points.map((value, index) => (value == null ? null : [index * 4, Math.round(2 + ((value - min) / span) * 20)]));
      return `<svg class="px-spark px-spark-line" viewBox="0 0 ${points.length * 4} 24" width="${points.length * 4}" height="24" aria-hidden="true" shape-rendering="crispEdges"><path d="${steppedPath(coords)}" fill="none"/></svg>`;
    },
  });

  // --- HTML builders ----------------------------------------------------------
  const ui = (P.html = {
    // Signed percent change; `isNew` labels a value that had no previous period.
    change(ratio, isNew) {
      if (ratio == null) return isNew ? `<span class="delta is-new">${esc(t("common.new"))}</span>` : `<span class="delta is-flat">—</span>`;
      if (Math.abs(ratio) < 0.0005) return `<span class="delta is-flat">■ 0%</span>`;
      const up = ratio > 0;
      return `<span class="delta ${up ? "is-up" : "is-down"}">${up ? "▲" : "▼"} ${esc(fmt.pct(Math.abs(ratio), 0))}</span>`;
    },
    // Rank delta: positive means the position number got smaller (better).
    rank(delta) {
      if (delta == null) return `<span class="delta is-flat">—</span>`;
      if (Math.abs(delta) < 0.05) return `<span class="delta is-flat">■ 0</span>`;
      const up = delta > 0;
      return `<span class="delta ${up ? "is-up" : "is-down"}" title="${esc(t(up ? "common.rankBetter" : "common.rankWorse"))}">${up ? "▲" : "▼"} ${esc(fmt.decimal(Math.abs(delta), 1))}</span>`;
    },
    badge(text, tone) {
      return `<span class="badge ${tone ? `badge-${tone}` : ""}">${esc(text)}</span>`;
    },
    // A page opens the detail drawer; the arrow opens the page itself.
    page(url) {
      if (!url) return `<span class="muted">—</span>`;
      return `<span class="page-cell"><button type="button" class="link" data-detail="page" data-value="${esc(url)}" title="${esc(url)}">${esc(P.urlPath(url))}</button><a class="ext" href="${esc(url)}" target="_blank" rel="noopener noreferrer" aria-label="${esc(t("detail.open"))}" title="${esc(t("detail.open"))}">↗</a></span>`;
    },
    query(text) {
      return `<button type="button" class="link" data-detail="query" data-value="${esc(text)}">${esc(text)}</button>`;
    },
    // A titled surface. Long reading notes are folded into a disclosure so the data stays in front.
    card(options) {
      const head = options.title ? `<header class="card-head"><h2>${esc(options.title)}</h2>${options.tools ? `<div class="card-tools">${options.tools}</div>` : ""}</header>` : "";
      const note = options.note ? `<details class="note"><summary>${esc(t("common.readNote"))}</summary><p>${esc(options.note)}</p></details>` : "";
      return `<section class="card ${options.cls || ""}">${head}${options.intro ? `<p class="card-intro">${esc(options.intro)}</p>` : ""}${options.body || ""}${note}</section>`;
    },
    // columns: [{ label, num }]; rows: arrays of HTML strings
    table(columns, rows, emptyText) {
      if (!rows.length) return ui.empty(emptyText || t("common.noRows"));
      const cls = (column) => (column && column.num ? ' class="num"' : column && column.cell ? ' class="cell"' : "");
      const head = columns.map((column) => `<th scope="col"${cls(column)}>${esc(column.label)}</th>`).join("");
      const body = rows.map((cells) => `<tr>${cells.map((cell, index) => `<td${cls(columns[index])}>${cell}</td>`).join("")}</tr>`).join("");
      return `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
    },
    empty(text) {
      return `<div class="empty-box"><span class="empty-glyph" aria-hidden="true">▒</span><p>${esc(text)}</p></div>`;
    },
    notice(text, tone) {
      return `<p class="notice ${tone ? `notice-${tone}` : ""}">${esc(text)}</p>`;
    },
    // Chip group that writes view.ui[key] and repaints.
    tabs(key, items, active) {
      return `<div class="chips" role="group">${items.map((item) => `<button type="button" class="chip ${item.id === active ? "is-active" : ""}" data-set="${key}" data-value="${esc(item.id)}" aria-pressed="${item.id === active}">${esc(item.label)}${item.count != null ? ` <span class="chip-count">${esc(fmt.int(item.count))}</span>` : ""}</button>`).join("")}</div>`;
    },
    button(action, label, options) {
      const settings = options || {};
      const attrs = Object.entries(settings.data || {}).map(([name, value]) => ` data-${name}="${esc(value)}"`).join("");
      return `<button type="button" class="btn ${settings.cls || ""}" data-action="${action}"${attrs}${settings.disabled ? " disabled" : ""}>${esc(label)}</button>`;
    },
    more(key, shown, total) {
      return total > shown ? `<div class="more-row"><span class="muted">${esc(t("common.showing", { shown: fmt.int(shown), total: fmt.int(total) }))}</span><button type="button" class="btn btn-ghost" data-more="${key}">${esc(t("common.showMore"))}</button></div>` : "";
    },
    stat(label, value, deltaHtml, hint) {
      return `<article class="stat"><p class="stat-label">${esc(label)}</p><strong class="stat-value">${esc(value)}</strong><div class="stat-delta">${deltaHtml || ""}</div>${hint ? `<p class="stat-hint">${esc(hint)}</p>` : ""}</article>`;
    },
    opSelect(name, value) {
      return `<select class="input" data-field="${name}" aria-label="${esc(t("filter.operator"))}">${["contains", "notContains", "equals", "regex", "notRegex"].map((op) => `<option value="${op}"${op === value ? " selected" : ""}>${esc(t(`filter.op.${op}`))}</option>`).join("")}</select>`;
    },
    deviceSelect(name, value) {
      return `<select class="input" data-field="${name}" aria-label="${esc(t("filter.device"))}">${["", "MOBILE", "DESKTOP", "TABLET"].map((device) => `<option value="${device}"${device === value ? " selected" : ""}>${esc(t(`filter.device.${device || "all"}`))}</option>`).join("")}</select>`;
    },
  });

  P.filterSummary = function filterSummary(filter) {
    const clean = engine.cleanFilter(filter);
    const parts = [];
    for (const dimension of ["query", "page"]) {
      if (clean[dimension]) parts.push(`${t(`filter.${dimension}`)} ${t(`filter.op.${clean[dimension].op}`)} “${clean[dimension].value}”`);
    }
    if (clean.country) parts.push(`${t("filter.country")} = ${clean.country.toUpperCase()}`);
    if (clean.device) parts.push(`${t("filter.device")} = ${t(`filter.device.${clean.device}`)}`);
    return parts.join(" · ");
  };

  // Read every [data-field] inside a container into a plain object.
  P.readFields = function readFields(container) {
    const out = {};
    container.querySelectorAll("[data-field]").forEach((node) => {
      out[node.dataset.field] = node.type === "checkbox" ? node.checked : node.value;
    });
    return out;
  };

  P.fieldsToFilter = (fields) => ({
    query: { op: fields.queryOp || "contains", value: fields.queryValue || "" },
    page: { op: fields.pageOp || "contains", value: fields.pageValue || "" },
    country: fields.country || "",
    device: fields.device || "",
  });

  P.filterFields = function filterFields(filter) {
    const value = filter || emptyFilter();
    return `<label class="field"><span>${esc(t("filter.query"))}</span><span class="field-pair">${ui.opSelect("queryOp", value.query.op)}<input class="input" data-field="queryValue" value="${esc(value.query.value)}" /></span></label>
      <label class="field"><span>${esc(t("filter.page"))}</span><span class="field-pair">${ui.opSelect("pageOp", value.page.op)}<input class="input" data-field="pageValue" value="${esc(value.page.value)}" /></span></label>
      <label class="field"><span>${esc(t("filter.country"))}</span><input class="input" data-field="country" maxlength="3" placeholder="usa" value="${esc(value.country)}" /></label>
      <label class="field"><span>${esc(t("filter.device"))}</span>${ui.deviceSelect("device", value.device)}</label>`;
  };

  P.download = function download(filename, content, mime) {
    const blob = new Blob([mime && mime.includes("csv") ? "﻿" : "", content], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  P.downloadCsv = (name, headers, rows) => P.download(`${name}-${P.state.today}.csv`, engine.toCsv(headers, rows), "text/csv;charset=utf-8");

  let toastTimer = null;
  P.toast = function toast(text) {
    const node = document.getElementById("toast");
    if (!node) return;
    node.textContent = text;
    node.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove("is-visible"), 2600);
  };

  P.errorText = function errorText(error) {
    const code = error && error.code;
    const known = code && t(`error.${code}`);
    if (known && known !== `error.${code}`) return known;
    return (error && error.message) || t("error.unknown");
  };
})();
