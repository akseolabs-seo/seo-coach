(function () {
  "use strict";

  const engine = window.SEOCoachGscEngine;
  const locales = window.SEOCoachGscLocales || {};
  const STORAGE_KEY = "seo-coach-gsc-dashboard-v1";
  const QUEUE_STORAGE_KEY = "seo-coach-gsc-dashboard-queue-v1";
  const LOCALE_STORAGE_KEY = "seo-coach-gsc-dashboard-locale-v1";
  const DEFAULT_LOCALE = "zh-Hant";
  const SUPPORTED_LOCALES = ["zh-Hant", "zh-Hans", "en", "ja", "ko"].filter((locale) => locales[locale]);
  const DEFAULT_OPTIONS = {
    minImpressions: 20,
    minRankDelta: 1,
    lowCtrRatio: 0.75,
    maxRecommendations: 30,
    anomalyDropRatio: 0.3,
    anomalyRankDelta: 3,
    maxInsights: 8,
  };
  const QUEUE_STATUS_KEYS = {
    open: "recommendations.queueOpen",
    reviewing: "recommendations.queueReviewing",
    "in-progress": "recommendations.queueInProgress",
    done: "recommendations.queueDone",
    snoozed: "recommendations.queueSnoozed",
  };
  const STATUS_KEYS = {
    improved: "keywords.filterRankUp",
    declined: "keywords.filterRankDown",
    "click-up": "keywords.filterClickUp",
    "click-down": "keywords.filterClickDown",
    "impression-up": "keywords.filterImpressionUp",
    "impression-down": "keywords.filterImpressionDown",
    new: "keywords.filterNew",
    lost: "keywords.filterLost",
    stable: "keywords.filterStable",
  };
  const BUCKET_KEYS = {
    top3: "bucket.top3",
    top10: "bucket.top10",
    page2: "bucket.page2",
    page3: "bucket.page3",
    page4: "bucket.page4",
    beyond50: "bucket.beyond50",
    unknown: "bucket.unknown",
  };
  const state = {
    current: null,
    previous: null,
    source: "local",
    options: { ...DEFAULT_OPTIONS },
    filter: "all",
    search: "",
    sort: "impressions",
    queue: {},
    queueFilter: "all",
    locale: detectLocale(),
    lastModel: null,
    detailKey: null,
    toastTimer: null,
    apiStatus: { kind: "loading", labelKey: "api.checking", noteKey: "api.initialNote", params: {}, canRefresh: false },
  };
  const refs = {};
  let apiImportPromise = null;
  let apiImportCompleted = false;

  const SAMPLE_CURRENT = [
    { query: "咖啡機清潔", page: "https://example.com/coffee-machine-cleaning/", clicks: 128, impressions: 1850, ctr: 0.0692, position: 7.1 },
    { query: "咖啡機清潔費用", page: "https://example.com/coffee-machine-cleaning/", clicks: 42, impressions: 740, ctr: 0.0568, position: 12.8 },
    { query: "咖啡機清潔費用", page: "https://example.com/coffee-machine-service/", clicks: 11, impressions: 180, ctr: 0.0611, position: 15.1 },
    { query: "辦公室咖啡機保養", page: "https://example.com/office-coffee-service/", clicks: 18, impressions: 620, ctr: 0.029, position: 18.2 },
    { query: "商用咖啡機租賃", page: "https://example.com/coffee-machine-rental/", clicks: 86, impressions: 960, ctr: 0.0896, position: 4.5 },
    { query: "咖啡機除垢", page: "https://example.com/coffee-machine-cleaning/", clicks: 74, impressions: 1120, ctr: 0.0661, position: 2.3 },
    { query: "咖啡豆保存", page: "https://example.com/coffee-bean-storage/", clicks: 12, impressions: 540, ctr: 0.0222, position: 24.7 },
    { query: "咖啡機漏水", page: "https://example.com/coffee-machine-repair/", clicks: 27, impressions: 440, ctr: 0.0614, position: 14.2 },
    { query: "咖啡機濾芯更換", page: "https://example.com/coffee-machine-maintenance/", clicks: 7, impressions: 290, ctr: 0.0241, position: 31.4 },
    { query: "咖啡機維修台北", page: "https://example.com/coffee-machine-repair/", clicks: 14, impressions: 510, ctr: 0.0275, position: 8.8 },
    { query: "全自動咖啡機清潔", page: "https://example.com/coffee-machine-cleaning/", clicks: 58, impressions: 800, ctr: 0.0725, position: 6.9 },
    { query: "咖啡機保養合約", page: "https://example.com/office-coffee-service/", clicks: 9, impressions: 220, ctr: 0.0409, position: 19.6 },
    { query: "咖啡機清潔推薦", page: "https://example.com/coffee-machine-cleaning/", clicks: 5, impressions: 150, ctr: 0.0333, position: 27.5 },
    { query: "義式咖啡機清潔", page: "https://example.com/espresso-cleaning/", clicks: 2, impressions: 190, ctr: 0.0105, position: 52.0 },
    { query: "辦公室咖啡服務", page: "https://example.com/office-coffee-service/", clicks: 63, impressions: 880, ctr: 0.0716, position: 3.0 },
    { query: "咖啡機清潔教學", page: "https://example.com/coffee-machine-cleaning-guide/", clicks: 16, impressions: 460, ctr: 0.0348, position: 16.1 },
    { query: "咖啡機水垢", page: "https://example.com/coffee-machine-cleaning-guide/", clicks: 13, impressions: 390, ctr: 0.0333, position: 29.4 },
    { query: "咖啡機租賃價格", page: "https://example.com/coffee-machine-rental/", clicks: 22, impressions: 330, ctr: 0.0667, position: 11.8 },
    { query: "咖啡機保養週期", page: "https://example.com/coffee-machine-maintenance/", clicks: 6, impressions: 130, ctr: 0.0462, position: 36.2 },
  ];

  const SAMPLE_PREVIOUS = [
    { query: "咖啡機清潔", page: "https://example.com/coffee-machine-cleaning/", clicks: 112, impressions: 1700, ctr: 0.0659, position: 9.2 },
    { query: "咖啡機清潔費用", page: "https://example.com/coffee-machine-cleaning/", clicks: 34, impressions: 680, ctr: 0.05, position: 16.4 },
    { query: "咖啡機清潔費用", page: "https://example.com/coffee-machine-service/", clicks: 8, impressions: 150, ctr: 0.0533, position: 19.4 },
    { query: "辦公室咖啡機保養", page: "https://example.com/office-coffee-service/", clicks: 25, impressions: 580, ctr: 0.0431, position: 13.2 },
    { query: "商用咖啡機租賃", page: "https://example.com/coffee-machine-rental/", clicks: 71, impressions: 940, ctr: 0.0755, position: 6.8 },
    { query: "咖啡機除垢", page: "https://example.com/coffee-machine-cleaning/", clicks: 70, impressions: 1070, ctr: 0.0654, position: 2.7 },
    { query: "咖啡豆保存", page: "https://example.com/coffee-bean-storage/", clicks: 16, impressions: 500, ctr: 0.032, position: 20.2 },
    { query: "咖啡機漏水", page: "https://example.com/coffee-machine-repair/", clicks: 24, impressions: 420, ctr: 0.0571, position: 14.7 },
    { query: "咖啡機濾芯更換", page: "https://example.com/coffee-machine-maintenance/", clicks: 4, impressions: 240, ctr: 0.0167, position: 38.2 },
    { query: "咖啡機維修台北", page: "https://example.com/coffee-machine-repair/", clicks: 20, impressions: 480, ctr: 0.0417, position: 6.4 },
    { query: "全自動咖啡機清潔", page: "https://example.com/coffee-machine-cleaning/", clicks: 49, impressions: 760, ctr: 0.0645, position: 8.9 },
    { query: "咖啡豆研磨粗細", page: "https://example.com/coffee-bean-guide/", clicks: 21, impressions: 410, ctr: 0.0512, position: 17.1 },
    { query: "義式咖啡機清潔", page: "https://example.com/espresso-cleaning/", clicks: 4, impressions: 210, ctr: 0.019, position: 49.2 },
    { query: "辦公室咖啡服務", page: "https://example.com/office-coffee-service/", clicks: 59, impressions: 810, ctr: 0.0728, position: 3.5 },
    { query: "咖啡機清潔教學", page: "https://example.com/coffee-machine-cleaning-guide/", clicks: 19, impressions: 470, ctr: 0.0404, position: 11.1 },
    { query: "咖啡機水垢", page: "https://example.com/coffee-machine-cleaning-guide/", clicks: 10, impressions: 360, ctr: 0.0278, position: 32.6 },
    { query: "咖啡機租賃價格", page: "https://example.com/coffee-machine-rental/", clicks: 15, impressions: 300, ctr: 0.05, position: 14.9 },
    { query: "咖啡機保養週期", page: "https://example.com/coffee-machine-maintenance/", clicks: 8, impressions: 170, ctr: 0.0471, position: 33.2 },
  ];

  function qs(selector) {
    return document.querySelector(selector);
  }

  function cacheRefs() {
    [
      "connectionStatus", "apiSourceStatus", "apiSourceLabel", "apiSourceNote", "refreshApiButton", "syncSummary",
      "localeSelect", "currentFiles", "previousFiles", "currentFileSummary", "previousFileSummary", "pasteInput", "pasteTarget",
      "pasteImportButton", "importMessage", "loadSampleButton", "emptySampleButton", "clearDataButton", "dashboardData", "emptyState",
      "kpiClicks", "kpiClicksDelta", "kpiImpressions", "kpiImpressionsDelta", "kpiCtr", "kpiCtrDelta", "kpiPosition", "kpiPositionDelta",
      "rankTotal", "rankDistribution", "rankUnknown", "comparisonLabel", "movementGrid", "risingList", "decliningList", "profileList",
      "keywordSearch", "keywordFilter", "keywordSort", "keywordTableBody", "keywordCountLabel", "queueFilter", "queueSummary",
      "recommendationList", "anomalyList", "anomalyCount", "ctrOpportunityList", "ctrOpportunityCount", "pageTableBody", "qualityGrid",
      "exportRecommendationsButton", "exportAnalysisButton", "printButton", "rulesPanel", "toggleRulesButton", "minImpressionsInput",
      "minRankDeltaInput", "lowCtrRatioInput", "maxRecommendationsInput", "anomalyDropRatioInput", "anomalyRankDeltaInput", "maxInsightsInput",
      "toast", "keywordDetailDialog", "detailDialogTitle", "detailDialogMeta", "detailDialogContent",
    ].forEach((id) => {
      refs[id] = document.getElementById(id);
    });
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function storageGet(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function storageSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      return false;
    }
  }

  function storageRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Private browsing or a blocked storage area should not stop the panel.
    }
  }

  function normalizeLocale(value) {
    const raw = String(value || "").replace(/_/g, "-").toLowerCase();
    const exact = SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === raw);
    if (exact) return exact;
    if (raw.startsWith("zh-tw") || raw.startsWith("zh-hk") || raw.startsWith("zh-hant")) return "zh-Hant";
    if (raw.startsWith("zh-cn") || raw.startsWith("zh-sg") || raw.startsWith("zh-hans")) return "zh-Hans";
    const base = raw.split("-")[0];
    return SUPPORTED_LOCALES.find((locale) => locale.toLowerCase() === base) || null;
  }

  function detectLocale() {
    const saved = normalizeLocale(storageGet(LOCALE_STORAGE_KEY));
    if (saved) return saved;
    const browserLocales = Array.isArray(navigator.languages) && navigator.languages.length ? navigator.languages : [navigator.language];
    for (const candidate of browserLocales) {
      const detected = normalizeLocale(candidate);
      if (detected) return detected;
    }
    return SUPPORTED_LOCALES.includes(DEFAULT_LOCALE) ? DEFAULT_LOCALE : SUPPORTED_LOCALES[0] || DEFAULT_LOCALE;
  }

  function translate(key, params) {
    const primary = locales[state.locale] || {};
    const fallback = locales[DEFAULT_LOCALE] || {};
    let value = primary[key] == null ? fallback[key] : primary[key];
    if (value == null) return key;
    return String(value).replace(/\{\{([\w.-]+)\}\}/g, (match, name) => {
      const replacement = params && Object.prototype.hasOwnProperty.call(params, name) ? params[name] : match;
      return replacement == null ? "" : String(replacement);
    });
  }

  function populateLocaleSelect() {
    if (!refs.localeSelect) return;
    refs.localeSelect.innerHTML = SUPPORTED_LOCALES.map((locale) => `<option value="${escapeHtml(locale)}">${escapeHtml(locales[locale].name || locale)}</option>`).join("");
    refs.localeSelect.value = state.locale;
  }

  function applyLocale() {
    document.documentElement.lang = state.locale;
    document.documentElement.dir = (locales[state.locale] && locales[state.locale].dir) || "ltr";
    document.title = translate("meta.title");
    const description = qs('meta[name="description"]');
    if (description) description.content = translate("meta.description");
    document.querySelectorAll("[data-i18n]").forEach((element) => {
      element.textContent = translate(element.dataset.i18n);
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.placeholder = translate(element.dataset.i18nPlaceholder);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", translate(element.dataset.i18nAria));
    });
    document.querySelectorAll("[data-i18n-content]").forEach((element) => {
      element.setAttribute("content", translate(element.dataset.i18nContent));
    });
    populateLocaleSelect();
    renderApiStatus();
    render();
    if (state.detailKey) renderKeywordDetail(state.detailKey);
  }

  function setLocale(value) {
    const locale = normalizeLocale(value);
    if (!locale || locale === state.locale) return;
    state.locale = locale;
    storageSet(LOCALE_STORAGE_KEY, locale);
    applyLocale();
  }

  function formatNumber(value, digits) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat(state.locale, {
      maximumFractionDigits: digits == null ? 0 : digits,
      minimumFractionDigits: digits || 0,
    }).format(value);
  }

  function formatPercent(value, digits) {
    if (!Number.isFinite(value)) return "—";
    return new Intl.NumberFormat(state.locale, {
      style: "percent",
      maximumFractionDigits: digits == null ? 2 : digits,
      minimumFractionDigits: digits == null ? 2 : digits,
    }).format(value);
  }

  function formatPosition(value) {
    return Number.isFinite(value) ? new Intl.NumberFormat(state.locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value) : "—";
  }

  function formatDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(state.locale, { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(date);
  }

  function formatDateTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(state.locale, { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function formatPeriod(range) {
    if (!range || (!range.start && !range.end)) return translate("quality.notAvailable");
    if (range.start === range.end) return formatDate(range.start);
    return `${formatDate(range.start) || "?"} → ${formatDate(range.end) || "?"}`;
  }

  function formatDelta(value, digits) {
    if (!Number.isFinite(value)) return "—";
    const sign = value > 0 ? "+" : "";
    return `${sign}${formatNumber(value, digits)}`;
  }

  function positionDeltaText(value) {
    if (!Number.isFinite(value) || Math.abs(value) < Number.EPSILON) return translate("delta.positionStable");
    return value > 0
      ? translate("delta.positionImproved", { value: formatPosition(value) })
      : translate("delta.positionDeclined", { value: formatPosition(Math.abs(value)) });
  }

  function numericDeltaText(value, suffix) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) < Number.EPSILON) return `0${suffix || ""}`;
    return `${value > 0 ? "+" : ""}${formatNumber(value)}${suffix || ""}`;
  }

  function bucketLabel(bucket) {
    if (!bucket) return translate("bucket.unknown");
    return translate(BUCKET_KEYS[bucket.id] || "bucket.unknown");
  }

  function pageLabel(value) {
    if (value === "多個頁面" || value === "多個页面" || value === "多ページ" || value === "여러 페이지") return translate("detail.multiplePages");
    if (value === "未提供頁面維度" || value === "未提供页面维度" || value === "Page ディメンションなし" || value === "Page 차원 없음") return translate("detail.noPageDimension");
    return value || translate("detail.noPageDimension");
  }

  function sampleDataset(rows, labelKey) {
    const isCurrent = labelKey === "sample.current";
    const datedRows = rows.map((row, index) => ({
      ...row,
      date: row.date || (isCurrent ? (index % 2 ? "2026-08-28" : "2026-08-01") : (index % 2 ? "2026-07-28" : "2026-07-01")),
    }));
    return engine.createDatasetFromRecords(datedRows, translate(labelKey), { format: "sample" });
  }

  function isApiRows(rows) {
    return Array.isArray(rows) && rows.some((row) => row && typeof row === "object" && Array.isArray(row.keys));
  }

  function toDataset(value, label) {
    if (!value) return null;
    if (typeof value === "string") return engine.createDatasetFromText(value, label || "injected.json");
    if (Array.isArray(value)) {
      if (isApiRows(value)) {
        const dataset = engine.createDatasetFromText(JSON.stringify({ rows: value }), `${label || "GSC API"}.json`, { format: "gsc-api" });
        dataset.sourceName = label || "GSC API";
        return dataset;
      }
      return engine.createDatasetFromRecords(value, label || "injected data");
    }
    if (typeof value !== "object") throw new Error("Injected data must be a CSV/JSON string or rows array.");

    const sourceName = value.sourceName || label || "injected data";
    const apiShape = Array.isArray(value.dimensions) || isApiRows(value.rows);
    const dataset = apiShape
      ? engine.createDatasetFromText(JSON.stringify(value), `${sourceName}.json`, { ...value, format: value.format || "gsc-api" })
      : Array.isArray(value.rows)
        ? engine.createDatasetFromRecords(value.rows, sourceName, value)
        : engine.createDatasetFromText(JSON.stringify(value), `${sourceName}.json`, value);
    dataset.sourceName = sourceName;
    if (value.format) dataset.format = value.format;
    return dataset;
  }

  function renderApiStatus() {
    if (!refs.apiSourceStatus) return;
    const status = state.apiStatus;
    refs.apiSourceStatus.className = `api-source-status ${status.kind || ""}`.trim();
    refs.apiSourceLabel.textContent = translate(status.labelKey, status.params);
    refs.apiSourceNote.textContent = translate(status.noteKey, status.params);
    refs.refreshApiButton.hidden = !status.canRefresh;
  }

  function setApiStatus(kind, labelKey, noteKey, params, canRefresh) {
    state.apiStatus = { kind, labelKey, noteKey, params: params || {}, canRefresh: Boolean(canRefresh) };
    renderApiStatus();
  }

  function getApiBridge() {
    const candidate = window.SEOCoachGscConnector || window.SEOCoachGscApi;
    if (!candidate || candidate.isConnected === false) return null;
    const load = typeof candidate === "function"
      ? candidate
      : typeof candidate.load === "function"
        ? candidate.load.bind(candidate)
        : typeof candidate.getDashboardData === "function"
          ? candidate.getDashboardData.bind(candidate)
          : typeof candidate.getData === "function"
            ? candidate.getData.bind(candidate)
            : null;
    return load ? { load } : null;
  }

  function autoImportFromApi(options) {
    const requestOptions = options || {};
    const force = requestOptions.force === true;
    if (!force && apiImportCompleted) return Promise.resolve(true);
    const bridge = getApiBridge();
    if (!bridge) {
      setApiStatus("idle", "api.noBridge", "api.noBridgeNote", {}, false);
      return Promise.resolve(false);
    }
    if (apiImportPromise) return apiImportPromise;

    setApiStatus("loading", "api.loading", "api.loadingNote", {}, false);
    showImportMessage(translate("api.importing"), "");
    const connectorRequest = {
      dimensions: ["query", "page"],
      rowLimit: 25000,
      dataState: "final",
      includePrevious: true,
      reason: "seo-coach-gsc-dashboard",
    };
    Object.keys(requestOptions).forEach((key) => {
      if (key !== "force") connectorRequest[key] = requestOptions[key];
    });

    apiImportPromise = Promise.resolve()
      .then(() => bridge.load(connectorRequest))
      .then((payload) => {
        const hasCurrent = payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "current");
        const hasPrevious = payload && typeof payload === "object" && Object.prototype.hasOwnProperty.call(payload, "previous");
        const current = toDataset(hasCurrent ? payload.current : payload, "GSC API / current");
        const previous = hasPrevious ? toDataset(payload.previous, "GSC API / comparison") : null;
        if (!current || !current.rows.length) throw new Error(translate("message.noQuery"));
        state.current = current;
        state.previous = previous && previous.rows.length ? previous : null;
        state.source = "api";
        persistState();
        render();
        apiImportCompleted = true;
        const params = { rows: formatNumber(current.rows.length) };
        setApiStatus("connected", state.previous ? "status.apiSynced" : "status.apiLoaded", state.previous ? "api.connectedBoth" : "api.connectedCurrent", params, true);
        showImportMessage(translate("api.success"), "success");
        showToast(translate("toast.apiComputed"));
        return true;
      })
      .catch((error) => {
        apiImportCompleted = false;
        setApiStatus("error", "api.error", "api.errorNote", { error: error.message || translate("message.noQuery") }, true);
        showImportMessage(translate("message.importError"), "error");
        return false;
      })
      .finally(() => {
        apiImportPromise = null;
      });
    return apiImportPromise;
  }

  function setData(target, dataset) {
    state[target] = dataset && dataset.rows && dataset.rows.length ? dataset : null;
    state.source = "manual";
    persistState();
    render();
  }

  async function importFiles(target, fileList) {
    const files = [...(fileList || [])];
    if (!files.length) return;
    const period = target === "current" ? translate("paste.current") : translate("paste.previous");
    showImportMessage(translate("message.reading", { period }), "");
    try {
      const datasets = await Promise.all(files.map(async (file) => engine.createDatasetFromText(await file.text(), file.name)));
      setData(target, engine.combineDatasets(datasets));
      showImportMessage(translate("message.imported", { period, rows: formatNumber(state[target].rows.length) }), "success");
      showToast(translate("toast.computed"));
    } catch (error) {
      showImportMessage(error.message || translate("message.importError"), "error");
      showToast(translate("message.importError"));
    }
  }

  function importPaste() {
    const text = refs.pasteInput.value.trim();
    if (!text) {
      showImportMessage(translate("message.pasteEmpty"), "error");
      return;
    }
    try {
      setData(refs.pasteTarget.value, engine.createDatasetFromText(text, text.startsWith("{") || text.startsWith("[") ? "pasted.json" : "pasted.csv"));
      refs.pasteInput.value = "";
      showImportMessage(translate("message.pasteImported"), "success");
    } catch (error) {
      showImportMessage(error.message || translate("message.invalidPaste"), "error");
    }
  }

  function loadSample() {
    state.current = sampleDataset(SAMPLE_CURRENT, "sample.current");
    state.previous = sampleDataset(SAMPLE_PREVIOUS, "sample.previous");
    state.source = "manual";
    persistState();
    render();
    showToast(translate("toast.sampleLoaded"));
  }

  function clearData() {
    state.current = null;
    state.previous = null;
    state.source = "manual";
    state.queue = {};
    state.lastModel = null;
    state.detailKey = null;
    storageRemove(STORAGE_KEY);
    storageRemove(QUEUE_STORAGE_KEY);
    if (refs.currentFiles) refs.currentFiles.value = "";
    if (refs.previousFiles) refs.previousFiles.value = "";
    if (refs.pasteInput) refs.pasteInput.value = "";
    closeKeywordDetail();
    showImportMessage(translate("message.cleared"), "success");
    render();
  }

  function persistState() {
    const saved = storageSet(STORAGE_KEY, JSON.stringify({ current: state.current, previous: state.previous, options: state.options }));
    if (!saved && (state.current || state.previous)) showImportMessage(translate("message.storageError"), "error");
  }

  function restoreDataset(saved, label) {
    if (!saved || !Array.isArray(saved.rows) || !saved.rows.length) return null;
    return engine.createDatasetFromRecords(saved.rows, saved.sourceName || label, {
      format: saved.format,
      skipped: saved.skipped,
      dateRange: saved.dateRange,
      propertyName: saved.propertyName,
      siteUrl: saved.siteUrl,
      dimensions: saved.dimensions,
      dataState: saved.dataState,
      rowLimit: saved.rowLimit,
      totalRows: saved.totalRows,
      partial: saved.partial,
      syncedAt: saved.syncedAt,
      scope: saved.scope,
    });
  }

  function restoreState() {
    try {
      const raw = storageGet(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state.current = restoreDataset(saved.current, translate("paste.current"));
        state.previous = restoreDataset(saved.previous, translate("paste.previous"));
        state.source = "local";
        state.options = Object.assign({}, DEFAULT_OPTIONS, saved.options || {});
      }
      const queueRaw = storageGet(QUEUE_STORAGE_KEY);
      if (queueRaw) {
        const savedQueue = JSON.parse(queueRaw);
        state.queue = savedQueue && typeof savedQueue === "object" ? savedQueue : {};
      }
      updateRuleInputs();
    } catch (error) {
      storageRemove(STORAGE_KEY);
      storageRemove(QUEUE_STORAGE_KEY);
      state.queue = {};
      showImportMessage(translate("message.restoreError"), "error");
    }
  }

  function persistQueue() {
    if (!storageSet(QUEUE_STORAGE_KEY, JSON.stringify(state.queue))) showImportMessage(translate("message.storageError"), "error");
  }

  function showImportMessage(text, tone) {
    if (!refs.importMessage) return;
    refs.importMessage.textContent = text;
    refs.importMessage.className = `import-message ${tone || ""}`.trim();
  }

  function showToast(text) {
    if (!refs.toast) return;
    refs.toast.textContent = text;
    refs.toast.classList.add("is-visible");
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(() => refs.toast.classList.remove("is-visible"), 2800);
  }

  function renderInputSummaries() {
    const renderOne = (element, dataset) => {
      if (!dataset) {
        element.textContent = translate("file.notImported");
        element.className = "file-summary";
        return;
      }
      element.textContent = `${formatNumber(dataset.rows.length)} · ${formatPeriod(dataset.dateRange)}`;
      element.className = "file-summary is-loaded";
    };
    renderOne(refs.currentFileSummary, state.current);
    renderOne(refs.previousFileSummary, state.previous);
  }

  function renderConnection() {
    const hasCurrent = Boolean(state.current && state.current.rows.length);
    const hasPrevious = Boolean(state.previous && state.previous.rows.length);
    refs.connectionStatus.className = `connection-pill ${hasCurrent ? (hasPrevious ? "is-live" : "is-partial") : "is-idle"}`;
    const labelKey = state.source === "api"
      ? (hasPrevious ? "status.apiSynced" : "status.apiLoaded")
      : hasCurrent
        ? (hasPrevious ? "status.bothLoaded" : "status.currentLoaded")
        : "status.waiting";
    refs.connectionStatus.innerHTML = `<span class="status-dot" aria-hidden="true"></span>${escapeHtml(translate(labelKey))}`;
  }

  function renderSyncSummary(model) {
    if (!refs.syncSummary || !model || !model.metadata.current) {
      if (refs.syncSummary) refs.syncSummary.hidden = true;
      return;
    }
    const meta = model.metadata.current;
    const source = state.source === "api" ? translate("sync.api") : translate("sync.local");
    const property = meta.propertyName || meta.siteUrl ? translate("sync.property", { value: meta.propertyName || meta.siteUrl }) : "";
    refs.syncSummary.innerHTML = `<span class="sync-summary-dot"></span><span>${escapeHtml(translate("sync.summary", { source, period: formatPeriod(meta.dateRange), property }))}</span>`;
    refs.syncSummary.hidden = false;
  }

  function setDelta(element, text, tone) {
    element.textContent = text;
    element.className = `stat-delta ${tone || ""}`.trim();
  }

  function renderKpis(model) {
    const current = model.summary;
    const previous = model.previousSummary;
    refs.kpiClicks.textContent = formatNumber(current.clicks);
    refs.kpiImpressions.textContent = formatNumber(current.impressions);
    refs.kpiCtr.textContent = formatPercent(current.ctr);
    refs.kpiPosition.textContent = formatPosition(current.position);
    if (!model.hasComparison || !previous) {
      [refs.kpiClicksDelta, refs.kpiImpressionsDelta, refs.kpiCtrDelta, refs.kpiPositionDelta].forEach((element) => setDelta(element, translate("delta.waiting"), ""));
      return;
    }
    setDelta(refs.kpiClicksDelta, `${numericDeltaText(current.clicks - previous.clicks)} ${translate("delta.vsPrevious")}`, current.clicks >= previous.clicks ? "positive" : "negative");
    setDelta(refs.kpiImpressionsDelta, `${numericDeltaText(current.impressions - previous.impressions)} ${translate("delta.vsPrevious")}`, current.impressions >= previous.impressions ? "positive" : "negative");
    const ctrDelta = current.ctr != null && previous.ctr != null ? (current.ctr - previous.ctr) * 100 : null;
    setDelta(refs.kpiCtrDelta, ctrDelta == null ? "—" : `${numericDeltaText(ctrDelta, translate("delta.percentagePoints"))} ${translate("delta.vsPrevious")}`, ctrDelta == null ? "" : ctrDelta >= 0 ? "positive" : "negative");
    const avgPositionDelta = previous.position != null && current.position != null ? previous.position - current.position : null;
    setDelta(refs.kpiPositionDelta, avgPositionDelta == null ? "—" : `${positionDeltaText(avgPositionDelta)} ${translate("delta.vsPrevious")}`, avgPositionDelta == null ? "" : avgPositionDelta >= 0 ? "positive" : "negative");
  }

  function renderRankDistribution(model) {
    const max = Math.max(1, ...model.distribution.map((bucket) => bucket.count));
    refs.rankTotal.textContent = translate("rank.queryCount", { count: formatNumber(model.queryCount) });
    refs.rankDistribution.innerHTML = model.distribution.map((bucket) => {
      const width = Math.max(2, (bucket.count / max) * 100);
      const percent = model.rankedQueryCount ? Math.round((bucket.count / model.rankedQueryCount) * 100) : 0;
      return `<div class="rank-row"><div class="rank-label"><span>${escapeHtml(bucketLabel(bucket))}</span><strong>${formatNumber(bucket.count)}</strong></div><div class="rank-track"><span class="rank-fill" style="--bar-width:${width}%"></span></div><span class="rank-percent">${percent}%</span></div>`;
    }).join("");
    refs.rankUnknown.textContent = model.unknownPositionCount
      ? translate("rank.unknown", { count: formatNumber(model.unknownPositionCount) })
      : translate("rank.allRanked");
  }

  function renderMovement(model) {
    refs.comparisonLabel.textContent = model.hasComparison ? translate("movement.compare") : translate("movement.onlyCurrent");
    const items = [
      ["rankUp", "movement.rankUp", "↗", "is-positive"],
      ["rankDown", "movement.rankDown", "↘", "is-negative"],
      ["clickUp", "movement.clickUp", "+", "is-positive"],
      ["clickDown", "movement.clickDown", "−", "is-negative"],
      ["new", "movement.new", "◎", "is-neutral"],
      ["lost", "movement.lost", "×", "is-negative"],
    ];
    refs.movementGrid.innerHTML = items.map(([key, labelKey, mark, tone]) => `<div class="movement-item ${tone}"><span class="movement-mark">${mark}</span><strong>${model.hasComparison ? formatNumber(model.movementSummary[key]) : "—"}</strong><span>${escapeHtml(translate(labelKey))}</span></div>`).join("");
  }

  function moverMarkup(item, tone) {
    const current = item.current || item.previous;
    if (!current) return "";
    const position = item.rankDelta == null ? "—" : positionDeltaText(item.rankDelta);
    return `<div class="signal-item"><div class="signal-query">${escapeHtml(item.query)}</div><div class="signal-meta"><span>${escapeHtml(formatPosition(current.position))}</span><span class="${tone}">${escapeHtml(position)}</span></div></div>`;
  }

  function renderMovers(model) {
    const rising = model.comparisons.filter((item) => item.rankDirection === "improved").sort((a, b) => b.rankDelta - a.rankDelta || b.current.impressions - a.current.impressions).slice(0, 4);
    const declining = model.comparisons.filter((item) => item.rankDirection === "declined").sort((a, b) => a.rankDelta - b.rankDelta || b.current.impressions - a.current.impressions).slice(0, 4);
    refs.risingList.innerHTML = rising.length ? rising.map((item) => moverMarkup(item, "is-positive")).join("") : `<p class="empty-inline">${escapeHtml(model.hasComparison ? translate("signal.noImprovement") : translate("signal.noComparison"))}</p>`;
    refs.decliningList.innerHTML = declining.length ? declining.map((item) => moverMarkup(item, "is-negative")).join("") : `<p class="empty-inline">${escapeHtml(model.hasComparison ? translate("signal.noDecline") : translate("signal.noComparison"))}</p>`;
  }

  function renderProfile(model) {
    const currentMeta = model.metadata.current;
    const previousMeta = model.metadata.previous;
    const skippedCurrent = currentMeta.skipped.missingQuery + currentMeta.skipped.invalidMetrics;
    const profile = [
      ["profile.currentPeriod", formatPeriod(currentMeta.dateRange)],
      ["profile.queries", formatNumber(model.queryCount)],
      ["profile.pages", model.pageCount ? formatNumber(model.pageCount) : translate("profile.noPages")],
      ["profile.skipped", skippedCurrent ? translate("profile.skippedValue", { count: formatNumber(skippedCurrent) }) : translate("profile.zeroSkipped")],
      ["profile.comparison", previousMeta ? translate("profile.loaded", { period: formatPeriod(previousMeta.dateRange) }) : translate("profile.notLoaded")],
    ];
    refs.profileList.innerHTML = profile.map(([labelKey, value]) => `<div class="profile-row"><span>${escapeHtml(translate(labelKey))}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
  }

  function getFilteredComparisons(model) {
    const query = state.search.trim().toLocaleLowerCase(state.locale);
    let rows = model.comparisons.filter((item) => {
      const matchesSearch = !query || item.query.toLocaleLowerCase(state.locale).includes(query);
      const matchesFilter = state.filter === "all" || item.filters.includes(state.filter);
      return matchesSearch && matchesFilter;
    });
    rows = rows.sort((a, b) => {
      if (state.sort === "query") return a.query.localeCompare(b.query, state.locale);
      if (state.sort === "rankDelta") return (b.rankDelta == null ? -Infinity : b.rankDelta) - (a.rankDelta == null ? -Infinity : a.rankDelta) || (b.current ? b.current.impressions : 0) - (a.current ? a.current.impressions : 0);
      if (state.sort === "clickDelta") return (b.clickDelta == null ? -Infinity : b.clickDelta) - (a.clickDelta == null ? -Infinity : a.clickDelta) || (b.current ? b.current.impressions : 0) - (a.current ? a.current.impressions : 0);
      return (b.current ? b.current.impressions : 0) - (a.current ? a.current.impressions : 0) || a.query.localeCompare(b.query, state.locale);
    });
    return rows;
  }

  function statusLabel(item) {
    if (!state.current || !state.previous) return translate("profile.currentPeriod");
    return translate(STATUS_KEYS[item.primary] || "keywords.filterStable");
  }

  function renderKeywordTable(model) {
    const rows = getFilteredComparisons(model);
    const visible = rows.slice(0, 120);
    refs.keywordTableBody.innerHTML = visible.length ? visible.map((item) => {
      const current = item.current;
      const previous = item.previous;
      const rankDelta = item.rankDelta == null ? "—" : positionDeltaText(item.rankDelta);
      const rankClass = item.rankDelta > 0 ? "positive-text" : item.rankDelta < 0 ? "negative-text" : "";
      const impressionDelta = item.impressionDelta == null ? "—" : formatDelta(item.impressionDelta);
      const clickDelta = item.clickDelta == null ? "—" : formatDelta(item.clickDelta);
      const page = current && current.pages.length === 1 ? current.pages[0] : "";
      return `<tr><th scope="row"><button class="query-button" type="button" data-query-detail="${escapeHtml(item.key)}">${escapeHtml(item.query)}</button><span class="query-page">${escapeHtml(page)}</span></th><td><strong>${formatPosition(current ? current.position : null)}</strong><span class="cell-sub">${escapeHtml(current ? bucketLabel(engine.getBucket(current.position)) : translate("table.previousData"))}</span></td><td class="${rankClass}">${escapeHtml(rankDelta)}<span class="cell-sub">${escapeHtml(previous ? translate("table.previous", { value: formatPosition(previous.position) }) : translate("table.noPrevious"))}</span></td><td class="${item.impressionDelta > 0 ? "positive-text" : item.impressionDelta < 0 ? "negative-text" : ""}">${escapeHtml(impressionDelta)}<span class="cell-sub">${current ? escapeHtml(translate("table.currentImpressions", { value: formatNumber(current.impressions) })) : "—"}</span></td><td class="${item.clickDelta > 0 ? "positive-text" : item.clickDelta < 0 ? "negative-text" : ""}">${escapeHtml(clickDelta)}<span class="cell-sub">${current ? escapeHtml(translate("table.currentClicks", { value: formatNumber(current.clicks) })) : "—"}</span></td><td>${formatPercent(current ? current.ctr : null)}</td><td><span class="status-tag status-${escapeHtml(item.primary)}">${escapeHtml(statusLabel(item))}</span></td><td><button class="table-action" type="button" data-query-detail="${escapeHtml(item.key)}">${escapeHtml(translate("action.viewDetails"))}</button></td></tr>`;
    }).join("") : `<tr><td colspan="8" class="table-empty">${escapeHtml(translate("table.empty"))}</td></tr>`;
    refs.keywordCountLabel.textContent = rows.length > 120
      ? translate("table.countLimited", { visible: formatNumber(visible.length), total: formatNumber(rows.length) })
      : translate("table.count", { visible: formatNumber(visible.length), total: formatNumber(rows.length) });
  }

  function getQueueEntry(id) {
    const saved = state.queue[id];
    return {
      status: saved && QUEUE_STATUS_KEYS[saved.status] ? saved.status : "open",
      note: saved && typeof saved.note === "string" ? saved.note : "",
    };
  }

  function recommendationReason(reason) {
    if (!reason || !reason.key) return "";
    const params = { ...(reason.params || {}) };
    if (params.impressions != null) params.impressions = formatNumber(Number(params.impressions));
    if (params.threshold != null) params.threshold = formatNumber(Number(params.threshold));
    if (params.count != null) params.count = formatNumber(Number(params.count));
    return translate(reason.key, params);
  }

  function localizedRecommendation(rec) {
    const title = rec.titleKey ? translate(rec.titleKey) : rec.title;
    const action = rec.actionKey ? translate(rec.actionKey) : rec.action;
    const reasons = Array.isArray(rec.reasonData) && rec.reasonData.length ? rec.reasonData.map(recommendationReason) : (rec.reasons || []);
    return { title, action, reasons };
  }

  function recommendationMarkup(rec) {
    const copy = localizedRecommendation(rec);
    const queue = getQueueEntry(rec.id);
    const scoreLabel = rec.score >= 85 ? translate("recommendations.priorityP1") : rec.score >= 70 ? translate("recommendations.priorityP2") : translate("recommendations.priorityP3");
    const scoreClass = rec.score >= 85 ? "priority-high" : rec.score >= 70 ? "priority-mid" : "priority-low";
    const statusOptions = Object.keys(QUEUE_STATUS_KEYS).map((status) => `<option value="${status}"${queue.status === status ? " selected" : ""}>${escapeHtml(translate(QUEUE_STATUS_KEYS[status]))}</option>`).join("");
    const reasons = copy.reasons.map((reason) => `<span>${escapeHtml(reason)}</span>`).join("");
    return `<article class="recommendation-item" data-recommendation-id="${escapeHtml(rec.id)}"><div class="rec-number">${escapeHtml(scoreLabel)}<span>${escapeHtml(translate("recommendations.score", { score: formatNumber(rec.score) }))}</span></div><div class="rec-main"><div class="rec-topline"><span class="rec-type ${scoreClass}">${escapeHtml(copy.title)}</span><span class="rec-bucket">${escapeHtml(bucketLabel({ id: rec.bucketId }))}</span></div><h3><button class="query-button recommendation-query" type="button" data-query-detail="${escapeHtml(engine.normalizeQuery(rec.query))}">${escapeHtml(rec.query)}</button></h3><p class="rec-page">${escapeHtml(pageLabel(rec.page))}</p><div class="rec-facts"><span>${escapeHtml(translate("recommendations.exposure", { value: formatNumber(rec.impressions) }))}</span><span>${escapeHtml(translate("recommendations.clicks", { value: formatNumber(rec.clicks) }))}</span><span>${escapeHtml(translate("recommendations.ctr", { value: formatPercent(rec.ctr) }))}</span><span>${escapeHtml(translate("recommendations.position", { value: formatPosition(rec.position) }))}</span></div><div class="rec-reasons">${reasons}</div><p class="rec-action"><span>${escapeHtml(translate("recommendations.nextStep"))}</span>${escapeHtml(copy.action)}</p><div class="rec-controls"><label><span>${escapeHtml(translate("recommendations.status"))}</span><select class="queue-status-select" data-queue-status="${escapeHtml(rec.id)}">${statusOptions}</select></label><label class="rec-note"><span>${escapeHtml(translate("recommendations.noteLabel"))}</span><textarea rows="2" data-queue-note="${escapeHtml(rec.id)}" placeholder="${escapeHtml(translate("recommendations.notePlaceholder"))}">${escapeHtml(queue.note)}</textarea></label></div></div></article>`;
  }

  function renderQueueSummary(model, visibleCount) {
    const recommendations = model ? model.recommendations : [];
    const done = recommendations.filter((rec) => getQueueEntry(rec.id).status === "done").length;
    refs.queueSummary.textContent = translate("recommendations.queueSummary", {
      shown: formatNumber(visibleCount == null ? recommendations.length : visibleCount),
      total: formatNumber(recommendations.length),
      done: formatNumber(done),
    });
  }

  function renderRecommendations(model) {
    const recommendations = model.recommendations.filter((rec) => state.queueFilter === "all" || getQueueEntry(rec.id).status === state.queueFilter);
    renderQueueSummary(model, recommendations.length);
    refs.recommendationList.innerHTML = recommendations.length
      ? recommendations.map(recommendationMarkup).join("")
      : `<div class="queue-empty"><span class="queue-empty-mark">✓</span><div><strong>${escapeHtml(translate("recommendations.noCandidate"))}</strong><p>${escapeHtml(translate("recommendations.healthy"))}</p></div></div>`;
  }

  function anomalySignalText(signal) {
    if (signal.key === "rank") return translate("insights.rankDrop", { value: formatPosition(signal.value) });
    if (signal.key === "clicks") return translate("insights.clickDrop", { value: (signal.value * 100).toFixed(1) });
    return translate("insights.impressionDrop", { value: (signal.value * 100).toFixed(1) });
  }

  function renderAnomalies(model) {
    refs.anomalyCount.textContent = model.hasComparison ? translate("insights.count", { count: formatNumber(model.anomalies.length) }) : translate("insights.noComparisonBadge");
    if (!model.hasComparison) {
      refs.anomalyList.innerHTML = `<p class="insight-empty">${escapeHtml(translate("insights.noComparison"))}</p>`;
      return;
    }
    refs.anomalyList.innerHTML = model.anomalies.length ? model.anomalies.map((anomaly) => `<article class="insight-item"><div class="insight-item-top"><button class="query-button" type="button" data-query-detail="${escapeHtml(engine.normalizeQuery(anomaly.query))}">${escapeHtml(anomaly.query)}</button><span class="insight-severity ${anomaly.severity === "high" ? "is-high" : ""}">${escapeHtml(translate(anomaly.severity === "high" ? "insights.severityHigh" : "insights.severityWatch"))}</span></div><div class="insight-facts">${anomaly.signals.map((signal) => `<span>${escapeHtml(anomalySignalText(signal))}</span>`).join("")}</div><span class="insight-sub">${escapeHtml(translate("recommendations.exposure", { value: formatNumber(anomaly.current.impressions) }))}</span></article>`).join("") : `<p class="insight-empty">${escapeHtml(translate("insights.noAnomalies"))}</p>`;
  }

  function renderCtrOpportunities(model) {
    refs.ctrOpportunityCount.textContent = translate("insights.count", { count: formatNumber(model.ctrOpportunities.length) });
    refs.ctrOpportunityList.innerHTML = model.ctrOpportunities.length ? model.ctrOpportunities.map((opportunity) => `<article class="insight-item"><div class="insight-item-top"><button class="query-button" type="button" data-query-detail="${escapeHtml(engine.normalizeQuery(opportunity.query))}">${escapeHtml(opportunity.query)}</button><span class="insight-bucket">${escapeHtml(bucketLabel({ id: engine.getBucket(opportunity.position).id }))}</span></div><div class="insight-facts"><span>${escapeHtml(translate("recommendations.exposure", { value: formatNumber(opportunity.impressions) }))}</span><span>${escapeHtml(translate("recommendations.ctr", { value: formatPercent(opportunity.ctr) }))}</span><span>${escapeHtml(translate("insights.opportunityGap", { value: formatPercent(opportunity.ctrGap, 2) }))}</span></div><span class="insight-sub">${escapeHtml(translate("insights.reference", { value: formatPercent(opportunity.referenceCtr) }))} · ${escapeHtml(pageLabel(opportunity.page))}</span></article>`).join("") : `<p class="insight-empty">${escapeHtml(translate("insights.noOpportunities"))}</p>`;
  }

  function renderPageTable(model) {
    const rows = model.currentPages.slice(0, 80);
    refs.pageTableBody.innerHTML = rows.length ? rows.map((page) => `<tr><th scope="row"><span class="page-cell">${escapeHtml(page.page)}</span></th><td>${formatNumber(page.impressions)}</td><td>${formatNumber(page.clicks)}</td><td>${formatPercent(page.ctr)}</td><td>${formatPosition(page.position)}</td><td>${formatNumber(page.queries.length)}</td></tr>`).join("") : `<tr><td colspan="6" class="table-empty">${escapeHtml(translate("pages.empty"))}</td></tr>`;
  }

  function renderQuality(model) {
    const current = model.metadata.current;
    const previous = model.metadata.previous;
    const qualityItem = (label, value, note, tone) => `<div class="quality-item ${tone || ""}"><span class="quality-label">${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(note)}</small></div>`;
    const currentSkipped = current.skipped.missingQuery + current.skipped.invalidMetrics;
    const previousSkipped = previous ? previous.skipped.missingQuery + previous.skipped.invalidMetrics : 0;
    const property = current.propertyName || current.siteUrl || translate("quality.notAvailable");
    const dimensions = current.dimensions.length ? current.dimensions.join(", ") : translate("quality.notAvailable");
    const returnedRows = current.totalRows != null ? `${formatNumber(current.rows)} / ${formatNumber(current.totalRows)}` : formatNumber(current.rows);
    refs.qualityGrid.innerHTML = [
      qualityItem(translate("quality.currentSource"), current.sourceName, translate("quality.rows", { format: current.format.toUpperCase(), rows: returnedRows }), ""),
      qualityItem(translate("quality.currentPeriod"), formatPeriod(current.dateRange), translate("quality.dateNote"), ""),
      qualityItem(translate("quality.property"), property, dimensions, ""),
      qualityItem(translate("quality.comparisonSource"), previous ? previous.sourceName : translate("quality.notLoaded"), previous ? translate("quality.rows", { format: previous.format.toUpperCase(), rows: formatNumber(previous.rows) }) : translate("quality.noComparison"), previous ? "is-good" : "is-warn"),
      qualityItem(translate("quality.skipped"), formatNumber(currentSkipped + previousSkipped), translate("quality.skippedNote"), currentSkipped + previousSkipped ? "is-warn" : "is-good"),
      qualityItem(translate("quality.freshness"), formatDateTime(current.syncedAt) || translate("quality.notAvailable"), translate("quality.dimensionsNote"), ""),
      qualityItem(current.partial ? translate("quality.partial") : translate("quality.complete"), current.partial ? translate("quality.partial") : translate("quality.complete"), current.partial ? translate("quality.partialNote") : translate("quality.completeNote"), current.partial ? "is-warn" : "is-good"),
    ].join("");
  }

  function renderModel() {
    const hasCurrent = Boolean(state.current && state.current.rows.length);
    refs.dashboardData.hidden = !hasCurrent;
    refs.emptyState.hidden = hasCurrent;
    if (!hasCurrent) {
      state.lastModel = null;
      if (refs.syncSummary) refs.syncSummary.hidden = true;
      return;
    }
    const model = engine.buildModel(state.current, state.previous, state.options);
    state.lastModel = model;
    renderSyncSummary(model);
    renderKpis(model);
    renderRankDistribution(model);
    renderMovement(model);
    renderMovers(model);
    renderProfile(model);
    renderKeywordTable(model);
    renderRecommendations(model);
    renderAnomalies(model);
    renderCtrOpportunities(model);
    renderPageTable(model);
    renderQuality(model);
    refs.keywordFilter.disabled = !model.hasComparison;
    refs.keywordFilter.title = model.hasComparison ? translate("keywords.filterLabel") : translate("signal.noComparison");
  }

  function render() {
    if (!refs.dashboardData) return;
    renderInputSummaries();
    renderConnection();
    renderApiStatus();
    renderModel();
  }

  function updateRuleInputs() {
    if (!refs.minImpressionsInput) return;
    refs.minImpressionsInput.value = state.options.minImpressions;
    refs.minRankDeltaInput.value = state.options.minRankDelta;
    refs.lowCtrRatioInput.value = state.options.lowCtrRatio;
    refs.maxRecommendationsInput.value = state.options.maxRecommendations;
    refs.anomalyDropRatioInput.value = state.options.anomalyDropRatio;
    refs.anomalyRankDeltaInput.value = state.options.anomalyRankDelta;
    refs.maxInsightsInput.value = state.options.maxInsights;
  }

  function updateOptions() {
    const clamp = (value, min, max, fallback) => {
      const number = Number(value);
      return Number.isFinite(number) ? Math.min(max, Math.max(min, number)) : fallback;
    };
    state.options = {
      minImpressions: clamp(refs.minImpressionsInput.value, 0, 100000000, DEFAULT_OPTIONS.minImpressions),
      minRankDelta: clamp(refs.minRankDeltaInput.value, 0.1, 100, DEFAULT_OPTIONS.minRankDelta),
      lowCtrRatio: clamp(refs.lowCtrRatioInput.value, 0.1, 1, DEFAULT_OPTIONS.lowCtrRatio),
      maxRecommendations: Math.round(clamp(refs.maxRecommendationsInput.value, 1, 100, DEFAULT_OPTIONS.maxRecommendations)),
      anomalyDropRatio: clamp(refs.anomalyDropRatioInput.value, 0.1, 0.9, DEFAULT_OPTIONS.anomalyDropRatio),
      anomalyRankDelta: clamp(refs.anomalyRankDeltaInput.value, 1, 100, DEFAULT_OPTIONS.anomalyRankDelta),
      maxInsights: Math.round(clamp(refs.maxInsightsInput.value, 1, 30, DEFAULT_OPTIONS.maxInsights)),
    };
    persistState();
    renderModel();
  }

  function csvCell(value) {
    const text = value == null ? "" : String(value);
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function downloadText(filename, content, mime) {
    const blob = new Blob([content], { type: mime || "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function exportRecommendations() {
    if (!state.current) return;
    const model = engine.buildModel(state.current, state.previous, state.options);
    const lines = [["priority", "score", "rule", "query", "page", "bucket", "position", "impressions", "clicks", "ctr", "status", "note", "reasons", "action"]];
    model.recommendations.forEach((rec) => {
      const copy = localizedRecommendation(rec);
      const queue = getQueueEntry(rec.id);
      lines.push([
        rec.score >= 85 ? "P1" : rec.score >= 70 ? "P2" : "P3",
        rec.score,
        rec.rule,
        rec.query,
        rec.page,
        bucketLabel({ id: rec.bucketId }),
        rec.position,
        rec.impressions,
        rec.clicks,
        rec.ctr,
        queue.status,
        queue.note,
        copy.reasons.join("; "),
        copy.action,
      ]);
    });
    downloadText("seo-coach-gsc-rewrite-queue.csv", "\uFEFF" + lines.map((line) => line.map(csvCell).join(",")).join("\r\n"), "text/csv;charset=utf-8");
    showToast(translate("toast.queueExported"));
  }

  function exportAnalysis() {
    if (!state.current) return;
    const model = engine.buildModel(state.current, state.previous, state.options);
    downloadText("seo-coach-gsc-analysis.json", JSON.stringify({ generatedAt: new Date().toISOString(), locale: state.locale, queue: state.queue, model }, null, 2), "application/json;charset=utf-8");
    showToast(translate("toast.analysisExported"));
  }

  function renderDetailMetric(data, labelKey) {
    if (!data) return `<div class="detail-period-empty">${escapeHtml(translate("detail.noData"))}</div>`;
    return `<div class="detail-period-label">${escapeHtml(translate(labelKey))}</div><div class="detail-metric-grid"><div><span>${escapeHtml(translate("detail.metricClicks"))}</span><strong>${formatNumber(data.clicks)}</strong></div><div><span>${escapeHtml(translate("detail.metricImpressions"))}</span><strong>${formatNumber(data.impressions)}</strong></div><div><span>${escapeHtml(translate("detail.metricCtr"))}</span><strong>${formatPercent(data.ctr)}</strong></div><div><span>${escapeHtml(translate("detail.metricPosition"))}</span><strong>${formatPosition(data.position)}</strong></div></div>`;
  }

  function renderKeywordDetail(queryKey) {
    if (!refs.detailDialogContent || !state.lastModel) return;
    const model = state.lastModel;
    const item = model.comparisons.find((comparison) => comparison.key === queryKey);
    if (!item) return;
    const current = item.current;
    const previous = item.previous;
    refs.detailDialogTitle.textContent = item.query;
    refs.detailDialogMeta.textContent = `${formatPeriod(model.metadata.current.dateRange)}${previous ? ` · ${formatPeriod(model.metadata.previous.dateRange)}` : ""}`;
    const pageRows = model.queryPages.filter((page) => page.key.startsWith(`${item.key}\u0000`));
    const matchedRecommendations = model.recommendations.filter((rec) => engine.normalizeQuery(rec.query) === item.key);
    const pagesMarkup = pageRows.length
      ? `<div class="detail-page-table"><div class="detail-page-row detail-page-header"><span>${escapeHtml(translate("detail.page"))}</span><span>${escapeHtml(translate("pages.impressions"))}</span><span>${escapeHtml(translate("pages.clicks"))}</span><span>${escapeHtml(translate("pages.position"))}</span></div>${pageRows.map((page) => `<div class="detail-page-row"><span title="${escapeHtml(page.page)}">${escapeHtml(page.page)}</span><span>${formatNumber(page.impressions)}</span><span>${formatNumber(page.clicks)}</span><span>${formatPosition(page.position)}</span></div>`).join("")}</div>`
      : `<p class="detail-muted">${escapeHtml(current ? translate("detail.noPage") : translate("detail.noData"))}</p>`;
    const recommendationMarkup = matchedRecommendations.length
      ? `<div class="detail-recommendations">${matchedRecommendations.map((rec) => { const copy = localizedRecommendation(rec); const queue = getQueueEntry(rec.id); return `<div><strong>${escapeHtml(copy.title)}</strong><span>${escapeHtml(translate(QUEUE_STATUS_KEYS[queue.status]))}</span></div>`; }).join("")}</div>`
      : `<p class="detail-muted">${escapeHtml(translate("detail.noRecommendation"))}</p>`;
    const change = model.hasComparison && (item.rankDelta != null || item.clickDelta != null || item.impressionDelta != null)
      ? `<div class="detail-change"><span>${escapeHtml(translate("detail.change"))}</span><strong>${escapeHtml(positionDeltaText(item.rankDelta))}</strong><span>${escapeHtml(formatDelta(item.clickDelta))} ${escapeHtml(translate("detail.metricClicks"))}</span><span>${escapeHtml(formatDelta(item.impressionDelta))} ${escapeHtml(translate("detail.metricImpressions"))}</span></div>`
      : `<p class="detail-muted">${escapeHtml(translate("detail.noPrevious"))}</p>`;
    refs.detailDialogContent.innerHTML = `<div class="detail-periods"><section class="detail-period">${renderDetailMetric(current, "detail.current")}</section><section class="detail-period">${renderDetailMetric(previous, "detail.previous")}</section></div>${change}<section class="detail-section"><h3>${escapeHtml(translate("detail.pageBreakdown"))}</h3>${pagesMarkup}</section><section class="detail-section"><h3>${escapeHtml(translate("detail.recommendation"))}</h3>${recommendationMarkup}</section><button class="text-button detail-jump" type="button" data-detail-jump="keywords">${escapeHtml(translate("detail.openQuery"))}</button>`;
  }

  function openKeywordDetail(queryKey) {
    if (!state.lastModel) return;
    state.detailKey = queryKey;
    renderKeywordDetail(queryKey);
    const dialog = refs.keywordDetailDialog;
    if (dialog && typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else if (dialog) {
      dialog.setAttribute("open", "");
    }
  }

  function closeKeywordDetail() {
    state.detailKey = null;
    const dialog = refs.keywordDetailDialog;
    if (!dialog) return;
    if (typeof dialog.close === "function" && dialog.open) dialog.close();
    else dialog.removeAttribute("open");
  }

  function updateQueue(id, patch) {
    state.queue[id] = { ...getQueueEntry(id), ...(state.queue[id] || {}), ...patch, updatedAt: new Date().toISOString() };
    if (!QUEUE_STATUS_KEYS[state.queue[id].status]) state.queue[id].status = "open";
    persistQueue();
  }

  function bindDropCard(card) {
    const target = card.dataset.target;
    const input = target === "current" ? refs.currentFiles : refs.previousFiles;
    card.addEventListener("dragover", (event) => {
      event.preventDefault();
      card.classList.add("is-dragging");
    });
    card.addEventListener("dragleave", () => card.classList.remove("is-dragging"));
    card.addEventListener("drop", (event) => {
      event.preventDefault();
      card.classList.remove("is-dragging");
      importFiles(target, event.dataTransfer.files);
    });
    input.addEventListener("change", () => importFiles(target, input.files));
  }

  function bindEvents() {
    document.querySelectorAll(".drop-card").forEach(bindDropCard);
    refs.localeSelect.addEventListener("change", (event) => setLocale(event.target.value));
    refs.loadSampleButton.addEventListener("click", loadSample);
    refs.emptySampleButton.addEventListener("click", loadSample);
    refs.clearDataButton.addEventListener("click", clearData);
    refs.refreshApiButton.addEventListener("click", () => autoImportFromApi({ force: true }));
    refs.pasteImportButton.addEventListener("click", importPaste);
    refs.keywordSearch.addEventListener("input", (event) => {
      state.search = event.target.value;
      renderModel();
    });
    refs.keywordFilter.addEventListener("change", (event) => {
      state.filter = event.target.value;
      renderModel();
    });
    refs.keywordSort.addEventListener("change", (event) => {
      state.sort = event.target.value;
      renderModel();
    });
    refs.queueFilter.addEventListener("change", (event) => {
      state.queueFilter = event.target.value;
      if (state.lastModel) renderRecommendations(state.lastModel);
    });
    refs.keywordTableBody.addEventListener("click", (event) => {
      const button = event.target.closest("[data-query-detail]");
      if (button) openKeywordDetail(button.dataset.queryDetail);
    });
    refs.anomalyList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-query-detail]");
      if (button) openKeywordDetail(button.dataset.queryDetail);
    });
    refs.ctrOpportunityList.addEventListener("click", (event) => {
      const button = event.target.closest("[data-query-detail]");
      if (button) openKeywordDetail(button.dataset.queryDetail);
    });
    refs.recommendationList.addEventListener("change", (event) => {
      const status = event.target.closest("[data-queue-status]");
      if (!status) return;
      updateQueue(status.dataset.queueStatus, { status: status.value });
      if (state.lastModel) renderQueueSummary(state.lastModel);
      showToast(translate("toast.queueSaved"));
    });
    refs.recommendationList.addEventListener("input", (event) => {
      const note = event.target.closest("[data-queue-note]");
      if (note) updateQueue(note.dataset.queueNote, { note: note.value });
    });
    refs.exportRecommendationsButton.addEventListener("click", exportRecommendations);
    refs.exportAnalysisButton.addEventListener("click", exportAnalysis);
    refs.printButton.addEventListener("click", () => window.print());
    refs.toggleRulesButton.addEventListener("click", () => {
      refs.rulesPanel.open = true;
      refs.rulesPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    [refs.minImpressionsInput, refs.minRankDeltaInput, refs.lowCtrRatioInput, refs.maxRecommendationsInput, refs.anomalyDropRatioInput, refs.anomalyRankDeltaInput, refs.maxInsightsInput].forEach((input) => input.addEventListener("change", updateOptions));
    refs.keywordDetailDialog.addEventListener("close", () => {
      state.detailKey = null;
    });
    refs.keywordDetailDialog.addEventListener("click", (event) => {
      if (event.target === refs.keywordDetailDialog) closeKeywordDetail();
      const jump = event.target.closest("[data-detail-jump]");
      if (jump) {
        closeKeywordDetail();
        const target = qs(`#${jump.dataset.detailJump}`);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }

  window.SEOCoachGscDashboard = {
    load(payload) {
      if (payload && Object.prototype.hasOwnProperty.call(payload, "current")) state.current = toDataset(payload.current, "injected current period");
      if (payload && Object.prototype.hasOwnProperty.call(payload, "previous")) state.previous = toDataset(payload.previous, "injected comparison period");
      state.source = "api";
      persistState();
      render();
      return true;
    },
    loadCurrent(value) {
      return this.load({ current: value });
    },
    loadPrevious(value) {
      return this.load({ previous: value });
    },
    connect(connector) {
      window.SEOCoachGscConnector = connector;
      apiImportCompleted = false;
      return autoImportFromApi({ force: true });
    },
    refreshFromApi() {
      return autoImportFromApi({ force: true });
    },
    setLocale(value) {
      setLocale(value);
      return state.locale;
    },
    getLocale() {
      return state.locale;
    },
    getAnalysis() {
      return state.current ? engine.buildModel(state.current, state.previous, state.options) : null;
    },
    clear() {
      clearData();
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    cacheRefs();
    restoreState();
    populateLocaleSelect();
    applyLocale();
    bindEvents();
    render();
    autoImportFromApi();
  });
})();
