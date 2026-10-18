(function () {
  "use strict";

  // Shell: connection handshake, navigation, top bar, global filter, detail drawer,
  // evidence cards and event routing.

  const P = window.__SEOCoachGscPanel;
  const { engine, data, store, esc, t, state, fmt, chart } = P;
  const ui = P.html;
  const viewIds = P.groups.flatMap((group) => group.views);
  const els = {};
  let token = 0;
  let current = null;

  const ctx = () => ({ site: state.site, range: P.range(), options: state.options, today: state.today, lastData: P.lastDataDate() });
  const connected = () => state.connection === "live" || state.connection === "demo";

  // --- shell rendering --------------------------------------------------------
  // Two-level menu: six areas on top, the tabs of the current area below.
  function renderNav() {
    const due = connected() ? P.dueNotes() : 0;
    const badge = due ? `<span class="nav-badge" title="${esc(t("notes.due"))}">${due}</span>` : "";
    const active = P.groups.find((group) => group.views.includes(state.view)) || P.groups[0];
    els.nav.innerHTML = P.groups
      .map((group) => `<a class="tab ${group === active ? "is-active" : ""}" href="#${group.views[0]}">${esc(t(`group.${group.id}`))}${group.views.includes("notes") ? badge : ""}</a>`)
      .join("");
    els.subnav.innerHTML = active.views
      .map((id) => `<a class="subtab ${id === state.view ? "is-active" : ""}" href="#${id}"${id === state.view ? ' aria-current="page"' : ""}>${esc(t(`nav.${id}`))}${id === "notes" ? badge : ""}</a>`)
      .join("");
  }

  function renderTopbar() {
    const live = connected();
    els.title.textContent = t(`nav.${state.view}`);
    els.controls.hidden = !live;
    els.demoBanner.hidden = state.connection !== "demo";
    els.status.className = `pill is-${state.connection}`;
    els.status.textContent = t(`status.${state.connection}`);
    els.evidence.hidden = !(live && current && current.view.evidence);
    if (!live) return;
    els.site.innerHTML = state.sites.map((site) => `<option value="${esc(site.siteUrl)}"${site.siteUrl === state.site ? " selected" : ""}>${esc(P.siteLabel(site.siteUrl))}</option>`).join("");
    els.range.innerHTML = engine.RANGE_PRESETS.map((preset) => `<option value="${preset.id}"${preset.id === state.rangeId ? " selected" : ""}>${esc(t(`range.${preset.id}`))}</option>`).join("");
    els.compare.innerHTML = ["previous", "year"].map((mode) => `<option value="${mode}"${mode === state.compare ? " selected" : ""}>${esc(t(`compare.${mode}`))}</option>`).join("");
    const summary = P.filterSummary(state.filter);
    els.filterToggle.textContent = t("filter.button");
    els.filterToggle.classList.toggle("is-active", Boolean(summary));
    els.filterSummary.textContent = summary;
    els.filterSummary.hidden = !summary;
    const range = P.range();
    els.period.textContent = range.previous ? `${fmt.period(range)} · ${t("compare.versus", { period: fmt.period(range.previous) })}` : fmt.period(range);
  }

  function renderFilterPanel() {
    els.filterFields.innerHTML = P.filterFields(state.filter);
  }

  function renderSettings() {
    els.locale.innerHTML = P.locale.list().map((item) => `<option value="${esc(item.tag)}"${item.tag === state.locale ? " selected" : ""}>${esc(item.name)}</option>`).join("");
    els.theme.value = state.theme;
  }

  function connectScreen() {
    const mode = state.connection;
    const setup = state.setup || {};
    let title = t("connect.title");
    let body = t("connect.body");
    if (mode === "error") {
      title = t("connect.errorTitle");
      body = state.connectionError;
    } else if (mode === "legacy") {
      title = t("connect.legacyTitle");
      body = t("connect.legacyBody");
    } else if (mode === "setup") {
      title = t("connect.setupTitle");
      body = t("connect.setupBody", { path: setup.defaultKeyPath || "" });
    }
    const retry = mode === "error" || mode === "setup";
    return `<section class="card connect">
      <h2>${esc(title)}</h2>
      <p>${esc(body)}</p>
      ${mode === "setup" && setup.hint ? ui.notice(setup.hint, "warn") : ""}
      <ol class="steps"><li>${esc(t("connect.step1"))}</li><li>${esc(t("connect.step2"))}</li><li>${esc(t("connect.step3"))}</li></ol>
      <div class="toolbar">${retry ? `<button type="button" class="btn" data-shell="retry">${esc(t("common.retry"))}</button>` : ""}<button type="button" class="btn ${retry ? "btn-ghost" : ""}" data-shell="demo">${esc(t("connect.demo"))}</button></div>
      <p class="card-intro">${esc(t("connect.privacy"))}</p>
    </section>`;
  }

  function paint() {
    if (!current) return;
    const active = document.activeElement;
    const focus = active && els.view.contains(active) && active.dataset.bind ? { key: active.dataset.bind, at: active.selectionStart } : null;
    els.view.innerHTML = current.view.render(current.data, ctx());
    if (focus) {
      const node = els.view.querySelector(`[data-bind="${focus.key}"]`);
      if (node) {
        node.focus();
        try {
          node.setSelectionRange(focus.at, focus.at);
        } catch (error) {
          /* not a text field */
        }
      }
    }
  }

  async function show() {
    const mine = (token += 1);
    current = null;
    renderNav();
    renderTopbar();
    if (state.connection === "checking") {
      els.view.innerHTML = `<div class="loading"><span class="loading-bar" aria-hidden="true"></span><p>${esc(t("status.checking"))}</p></div>`;
      return;
    }
    if (!connected()) {
      els.view.innerHTML = connectScreen();
      return;
    }
    const view = P.views[state.view];
    view.ui = view.ui || {};
    els.view.innerHTML = `<div class="loading" role="status"><span class="loading-bar" aria-hidden="true"></span><p>${esc(t("common.loading"))}</p></div>`;
    try {
      const loaded = view.load ? await view.load(ctx()) : {};
      if (mine !== token) return;
      current = { view, data: loaded };
      paint();
      renderTopbar();
    } catch (error) {
      if (mine !== token) return;
      els.view.innerHTML = `<section class="card"><h2>${esc(t("error.loadTitle"))}</h2><p>${esc(P.errorText(error))}</p><div class="toolbar"><button type="button" class="btn" data-shell="reload">${esc(t("common.retry"))}</button></div></section>`;
    }
  }

  const api = () => {
    const view = current && current.view;
    return {
      data: current ? current.data : {},
      ctx: ctx(),
      repaint: () => {
        if (current && current.view === view) paint();
      },
      reload: show,
    };
  };

  // --- evidence card ------------------------------------------------------------
  // Plain text in the shape of the coach's evidence card, so the student can paste
  // what the panel shows without a screenshot.
  function evidenceText() {
    const context = ctx();
    const range = context.range;
    const lines = current.view.evidence(current.data, context);
    return [
      `${t("evidence.title")} · ${t(`nav.${state.view}`)}`,
      `${t("evidence.source")}: ${t(state.connection === "demo" ? "source.demo" : "source.live")} · ${context.site}`,
      `${t("source.period")}: ${fmt.period(range)}`,
      `${t("source.previous")}: ${range.previous ? fmt.period(range.previous) : t("common.none")}`,
      `${t("source.filter")}: ${P.filterSummary(state.filter) || t("common.none")}`,
      `${t("evidence.checked")}: ${state.today}`,
      `${t("evidence.observed")}:`,
      ...lines.map((line) => `- ${line}`),
      `${t("evidence.supports")}: ${t("evidence.supportsText")}`,
      `${t("evidence.limits")}: ${t("evidence.limitsText")}`,
      `${t("evidence.next")}: `,
    ].join("\n");
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      const area = document.createElement("textarea");
      area.value = text;
      document.body.appendChild(area);
      area.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (failure) {
        ok = false;
      }
      area.remove();
      return ok;
    }
  }

  // --- detail drawer ------------------------------------------------------------
  // One query or one page: its trend, its totals, and the other side of the pair.
  let detailToken = 0;
  async function openDetail(type, value) {
    if (!connected() || !value) return;
    const mine = (detailToken += 1);
    const range = P.range();
    const other = type === "query" ? "page" : "query";
    const extra = [{ dimension: type, operator: "equals", expression: value }];
    const head = `<header class="card-head"><h2>${esc(type === "page" ? P.urlPath(value) : value)}</h2><div class="card-tools">${type === "query" ? `<button type="button" class="btn btn-ghost" data-track="${esc(value)}">${esc(t("rank.trackThis"))}</button>` : `<a class="btn btn-ghost" href="${esc(value)}" target="_blank" rel="noopener noreferrer">${esc(t("detail.open"))}</a>`}<button type="button" class="btn btn-ghost" data-close>${esc(t("detail.close"))}</button></div></header>`;
    els.detailBody.innerHTML = `${head}<div class="loading"><span class="loading-bar" aria-hidden="true"></span></div>`;
    if (!els.detail.open) els.detail.showModal();
    try {
      const start = range.previous ? range.previous.start : range.start;
      const [series, currentRows, previousRows] = await Promise.all([
        data.query({ dimensions: ["date"], start, end: range.end, extra }),
        data.query({ dimensions: [other], start: range.start, end: range.end, extra }),
        range.previous ? data.query({ dimensions: [other], start: range.previous.start, end: range.previous.end, extra }) : null,
      ]);
      if (mine !== detailToken) return;
      const all = engine.dailySeries(series.rows, start, range.end);
      const now = engine.sliceSeries(all, range.start, range.end);
      const before = range.previous ? engine.sliceSeries(all, range.previous.start, range.previous.end) : null;
      const item = engine.compare([{ ...engine.summarize(now), key: value }], before ? [{ ...engine.summarize(before), key: value }] : undefined, state.options)[0];
      const size = now.length > 100 ? 7 : 1;
      const blocks = (list) => {
        const out = [];
        for (let index = 0; index < list.length; index += size) out.push({ date: list[index].date, clicks: list.slice(index, index + size).reduce((sum, point) => sum + point.clicks, 0) });
        return out;
      };
      const points = blocks(now);
      const compared = engine.compare(engine.group(currentRows.rows, other), previousRows ? engine.group(previousRows.rows, other) : undefined, state.options).sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
      const rows = compared.slice(0, 25).map((row) => [other === "page" ? ui.page(row.page) : ui.query(row.query), esc(fmt.int(row.clicks)), ui.change(row.clickChange, row.status === "new"), esc(fmt.int(row.impressions)), esc(fmt.pos(row.position)), ui.rank(row.rankDelta)]);
      els.detailBody.innerHTML = `${head}
        ${P.metricGrid(item, range)}
        ${chart.columns({ label: value, values: points.map((point) => point.clicks), previous: before ? blocks(before).map((point) => point.clicks) : null, labels: points.map((point) => fmt.date(point.date)), name: t("common.current"), previousName: t("common.previous") })}
        <h3 class="detail-sub">${esc(t(type === "query" ? "detail.pagesFor" : "detail.queriesFor"))}</h3>
        ${ui.table([{ label: t(other === "page" ? "common.page" : "common.query") }, { label: t("metric.clicks"), num: true }, { label: t("common.change"), num: true }, { label: t("metric.impressions"), num: true }, { label: t("metric.position"), num: true }, { label: t("common.rankChange"), num: true }], rows)}`;
    } catch (error) {
      if (mine === detailToken) els.detailBody.innerHTML = `${head}${ui.notice(P.errorText(error), "warn")}`;
    }
  }

  // --- connection -------------------------------------------------------------
  async function attach(connector, kind) {
    state.connector = connector;
    state.connection = "checking";
    data.clearCache();
    show();
    try {
      const listed = await connector.listSites();
      const sites = (Array.isArray(listed) ? listed : (listed && listed.siteEntry) || []).filter((site) => site && site.siteUrl);
      if (!sites.length) throw engine.codedError("noSites");
      state.sites = sites;
      const saved = store.get("site", "");
      state.site = sites.some((site) => site.siteUrl === saved) ? saved : sites[0].siteUrl;
      state.connection = kind;
    } catch (error) {
      state.connection = "error";
      state.connectionError = P.errorText(error);
    }
    await show();
    if (connected() && state.pendingDetail) {
      const [type, ...rest] = state.pendingDetail.split(":");
      state.pendingDetail = "";
      if (type === "query" || type === "page") openDetail(type, rest.join(":"));
    }
  }

  // Order: a connector handed over by a host page, then the local gsc.mjs server,
  // then the connect screen (with the demo one click away).
  async function detect() {
    const found = window.SEOCoachGscConnector || window.SEOCoachGscApi;
    if (data.isConnector(found)) return attach(found, "live");
    let params = new URLSearchParams();
    try {
      params = new URLSearchParams(window.location.search);
    } catch (error) {
      /* no URL API */
    }
    state.pendingDetail = params.get("detail") || "";
    if (params.get("demo") === "1") return loadDemo();
    const local = window.SEOCoachGscLocal ? await window.SEOCoachGscLocal.probe() : null;
    if (local && local.hasKey) return attach(window.SEOCoachGscLocal.connector, "live");
    state.setup = local;
    state.connection = local ? "setup" : data.isLegacyConnector(found) ? "legacy" : "none";
    return show();
  }

  const loadDemo = () => attach(window.SEOCoachGscDemo.createDemoConnector(), "demo");

  function resetSiteScope() {
    state.filter = P.emptyFilter();
    for (const id of viewIds) if (P.views[id].onSiteChange) P.views[id].onSiteChange();
    renderFilterPanel();
  }

  function go(view) {
    if (!viewIds.includes(view)) return;
    if (window.location.hash === `#${view}`) {
      state.view = view;
      show();
    } else window.location.hash = view;
  }

  P.app = {
    reload: show,
    go,
    openDetail,
    setSite(site, view) {
      state.site = site;
      store.set("site", site);
      resetSiteScope();
      if (view && view !== state.view) go(view);
      else show();
    },
    setFilter(filter, view) {
      state.filter = JSON.parse(JSON.stringify(filter));
      renderFilterPanel();
      if (view && view !== state.view) go(view);
      else show();
    },
  };

  // --- events -----------------------------------------------------------------
  function onDetailLink(event) {
    const link = event.target.closest("[data-detail]");
    if (!link) return false;
    openDetail(link.dataset.detail, link.dataset.value);
    return true;
  }

  function onViewClick(event) {
    const shell = event.target.closest("[data-shell]");
    if (shell) {
      if (shell.dataset.shell === "demo") loadDemo();
      else if (shell.dataset.shell === "retry") detect();
      else show();
      return;
    }
    if (onDetailLink(event) || !current) return;
    const view = current.view;
    const setter = event.target.closest("[data-set]");
    if (setter) {
      view.ui[setter.dataset.set] = setter.dataset.value;
      return paint();
    }
    const more = event.target.closest("[data-more]");
    if (more) {
      view.ui[more.dataset.more] = (Number(view.ui[more.dataset.more]) || 50) + 50;
      return paint();
    }
    const action = event.target.closest("[data-action]");
    if (action && view.actions && view.actions[action.dataset.action]) view.actions[action.dataset.action](action, api());
  }

  function onViewInput(event) {
    if (!current) return;
    const target = event.target;
    if (target.dataset.bind) {
      current.view.ui[target.dataset.bind] = target.value;
      paint();
    } else if (target.dataset.keep) current.view.ui[target.dataset.keep] = target.value;
  }

  function readFile(input, handler) {
    if (!input.files || !input.files[0]) return;
    const reader = new FileReader();
    reader.onload = () => handler(String(reader.result || ""));
    reader.readAsText(input.files[0]);
    input.value = "";
  }

  function onViewChange(event) {
    if (!current) return;
    const target = event.target;
    const actions = current.view.actions || {};
    if (target.dataset.change && actions[target.dataset.change]) actions[target.dataset.change](target, api());
    if (target.dataset.file && actions[target.dataset.file]) {
      const handle = api();
      readFile(target, (text) => actions[target.dataset.file](text, handle));
    }
  }

  function onViewKey(event) {
    if (event.key !== "Enter" || !current || !event.target.dataset.enter) return;
    const handler = current.view.actions && current.view.actions[event.target.dataset.enter];
    if (handler) handler(event.target, api());
  }

  function bind() {
    els.view.addEventListener("click", onViewClick);
    els.view.addEventListener("input", onViewInput);
    els.view.addEventListener("change", onViewChange);
    els.view.addEventListener("keydown", onViewKey);
    els.detail.addEventListener("click", (event) => {
      if (event.target === els.detail || event.target.closest("[data-close]")) return els.detail.close();
      const track = event.target.closest("[data-track]");
      if (track) return P.toast(t(P.track(track.dataset.track) ? "rank.added" : "rank.exists", { query: track.dataset.track }));
      onDetailLink(event);
    });
    window.addEventListener("hashchange", () => {
      const view = window.location.hash.slice(1);
      if (viewIds.includes(view) && view !== state.view) {
        state.view = view;
        show();
      }
    });
    els.site.addEventListener("change", () => P.app.setSite(els.site.value));
    els.range.addEventListener("change", () => {
      state.rangeId = els.range.value;
      store.set("range", state.rangeId);
      show();
    });
    els.compare.addEventListener("change", () => {
      state.compare = els.compare.value;
      store.set("compare", state.compare);
      show();
    });
    els.refresh.addEventListener("click", () => {
      state.today = engine.localToday();
      data.clearCache();
      show();
    });
    els.evidence.addEventListener("click", async () => {
      if (!current || !current.view.evidence) return;
      P.toast(t((await copyText(evidenceText())) ? "evidence.copied" : "evidence.failed"));
    });
    els.filterToggle.addEventListener("click", () => {
      els.filterPanel.hidden = !els.filterPanel.hidden;
      els.filterToggle.setAttribute("aria-expanded", String(!els.filterPanel.hidden));
    });
    els.filterApply.addEventListener("click", () => {
      state.filter = P.fieldsToFilter(P.readFields(els.filterFields));
      els.filterPanel.hidden = true;
      show();
    });
    els.filterClear.addEventListener("click", () => {
      state.filter = P.emptyFilter();
      renderFilterPanel();
      show();
    });
    els.filterSave.addEventListener("click", () => {
      const filter = P.fieldsToFilter(P.readFields(els.filterFields));
      const name = els.segmentName.value.trim();
      if (!name || engine.isFilterEmpty(filter)) return P.toast(t("segments.invalid"));
      const segments = store.getSite("segments", []);
      segments.push({ id: `s${Date.now().toString(36)}`, name, filter });
      store.setSite("segments", segments);
      els.segmentName.value = "";
      P.toast(t("segments.saved", { name }));
    });
    els.locale.addEventListener("change", () => P.setLocale(els.locale.value, true));
    els.theme.addEventListener("change", () => P.setTheme(els.theme.value));
    els.exportState.addEventListener("click", () => P.download(`gsc-panel-notes-${state.today}.json`, JSON.stringify(store.dump(), null, 2), "application/json"));
    els.importState.addEventListener("change", () =>
      readFile(els.importState, (text) => {
        try {
          store.load(JSON.parse(text));
          window.location.reload();
        } catch (error) {
          P.toast(t("settings.importFailed"));
        }
      }),
    );
    els.demoExit.addEventListener("click", () => {
      state.connector = null;
      state.sites = [];
      state.site = "";
      data.clearCache();
      resetSiteScope();
      detect();
    });
    els.clear.addEventListener("click", () => {
      if (!window.confirm(t("settings.clearConfirm"))) return;
      const locale = state.locale;
      store.clearAll();
      state.options = { ...engine.DEFAULT_OPTIONS };
      state.rangeId = "3m";
      state.compare = "previous";
      resetSiteScope();
      P.setTheme("auto");
      state.locale = locale;
      renderSettings();
      P.toast(t("settings.cleared"));
      show();
    });
    if (window.matchMedia) window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", P.applyTheme);
  }

  function boot() {
    for (const [key, id] of Object.entries({
      nav: "nav", subnav: "subnav", view: "view", title: "viewTitle", controls: "controls", status: "connectionStatus", site: "siteSelect", range: "rangeSelect", compare: "compareSelect", period: "periodLabel", refresh: "refreshButton", evidence: "evidenceButton",
      filterToggle: "filterToggle", filterPanel: "filterPanel", filterFields: "filterFields", filterApply: "filterApply", filterClear: "filterClear", filterSave: "filterSave", filterSummary: "filterSummary", segmentName: "segmentName",
      locale: "localeSelect", theme: "themeSelect", clear: "clearDataButton", exportState: "exportStateButton", importState: "importStateInput", demoBanner: "demoBanner", demoExit: "demoExit", detail: "detail", detailBody: "detailBody",
    })) els[key] = document.getElementById(id);

    state.locale = P.locale.detect();
    P.onLocaleChange = () => {
      renderSettings();
      renderNav();
      renderTopbar();
      renderFilterPanel();
      if (current) paint();
      else show();
    };
    P.locale.apply();
    P.applyTheme();
    renderSettings();
    renderFilterPanel();
    const hash = window.location.hash.slice(1);
    if (viewIds.includes(hash)) state.view = hash;
    bind();
    detect();
    P.locale.autoload().then((tag) => {
      if (tag) P.setLocale(tag);
    });
  }

  window.SEOCoachGscDashboard = {
    version: 2,
    // Attach a host bridge after load. See references/59-gsc-dashboard.md for the contract.
    connect(connector) {
      if (!data.isConnector(connector)) return Promise.reject(engine.codedError("badConnector", "A connector needs listSites() and query()."));
      window.SEOCoachGscConnector = connector;
      return attach(connector, "live");
    },
    refresh() {
      data.clearCache();
      return show();
    },
    loadDemo,
    openDetail,
    registerLocale(tag, dictionary, options) {
      const ok = P.locale.register(tag, dictionary, options);
      if (ok) renderSettings();
      return ok;
    },
    listLocales() {
      return P.locale.list();
    },
    setLocale(tag) {
      return P.setLocale(tag, true);
    },
    getState() {
      return { connection: state.connection, site: state.site, range: P.range(), view: state.view, locale: state.locale };
    },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
