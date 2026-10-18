(function () {
  "use strict";

  // One object per tab: `load(ctx)` asks the connector for what the tab needs,
  // `render(data, ctx)` returns HTML, `actions` handle clicks. All maths is in engine.js.

  const P = window.__SEOCoachGscPanel;
  const { engine, data, store, fmt, chart, esc, t } = P;
  const ui = P.html;
  const views = (P.views = {});

  P.groups = [
    { id: "dashboard", views: ["overview", "sites"] },
    { id: "pages", views: ["decay", "newPages"] },
    { id: "keywords", views: ["rank", "striking", "cannibal"] },
    { id: "segments", views: ["intl", "segments"] },
    { id: "tools", views: ["indexing", "notes", "exportData"] },
    { id: "coach", views: ["queue"] },
  ];

  // --- shared loaders ---------------------------------------------------------
  const base = {
    async series(range, spec) {
      const start = range.previous ? range.previous.start : range.start;
      const result = await data.query({ dimensions: ["date"], start, end: range.end, ...(spec || {}) });
      const all = engine.dailySeries(result.rows, start, range.end);
      return {
        all,
        current: engine.sliceSeries(all, range.start, range.end),
        previous: range.previous ? engine.sliceSeries(all, range.previous.start, range.previous.end) : null,
      };
    },
    async grouped(dimension, range) {
      const [current, previous] = await Promise.all([
        data.query({ dimensions: [dimension], start: range.start, end: range.end }),
        range.previous ? data.query({ dimensions: [dimension], start: range.previous.start, end: range.previous.end }) : null,
      ]);
      const currentItems = engine.group(current.rows, dimension);
      const previousItems = previous ? engine.group(previous.rows, dimension) : undefined;
      return { current: currentItems, previous: previousItems, compared: engine.compare(currentItems, previousItems, P.state.options), partial: current.partial || Boolean(previous && previous.partial) };
    },
    queryPages(range) {
      return data.query({ dimensions: ["query", "page"], start: range.start, end: range.end });
    },
  };

  const queryEquals = (query) => [{ dimension: "query", operator: "equals", expression: query }];
  const col = (key, num) => ({ label: t(key), num: Boolean(num) });
  const partialNotice = (flag) => (flag ? ui.notice(t("common.partial", { limit: fmt.int(engine.ROW_LIMIT) }), "warn") : "");
  const comparisonNotice = (range) => (range.previous ? "" : ui.notice(t("common.noComparison"), "info"));
  const trackButton = (query) => `<button type="button" class="btn-icon" data-action="track" data-query="${esc(query)}" title="${esc(t("rank.trackThis"))}" aria-label="${esc(t("rank.trackThis"))}">＋</button>`;

  P.track = function track(query) {
    const text = String(query || "").trim();
    if (!text) return false;
    const tracked = store.getSite("tracked", []);
    if (tracked.some((item) => engine.normalizeKey(item) === engine.normalizeKey(text))) return false;
    tracked.push(text);
    store.setSite("tracked", tracked);
    return true;
  };

  P.dueNotes = function dueNotes() {
    if (!P.state.site) return 0;
    return store.getSite("notes", []).filter((note) => note.remindOn && !note.reviewed && note.remindOn <= P.state.today).length;
  };

  const shared = {
    track(el) {
      P.toast(t(P.track(el.dataset.query) ? "rank.added" : "rank.exists", { query: el.dataset.query }));
    },
  };

  // --- overview ---------------------------------------------------------------
  views.overview = {
    ui: { metric: "clicks", entity: "query", status: "all", sort: "clicks", search: "", limit: 50 },
    async load(ctx) {
      const [series, queries, pages, updates] = await Promise.all([base.series(ctx.range), base.grouped("query", ctx.range), base.grouped("page", ctx.range), data.updates()]);
      return { series, queries, pages, updates, notes: store.getSite("notes", []) };
    },
    movers(d) {
      const state = this.ui;
      const field = state.entity === "page" ? "page" : "query";
      const source = state.entity === "page" ? d.pages.compared : d.queries.compared;
      const needle = state.search.trim().toLowerCase();
      const counts = { all: source.length, growing: 0, decaying: 0, new: 0, lost: 0 };
      for (const item of source) if (counts[item.status] != null) counts[item.status] += 1;
      const sorters = {
        clicks: (a, b) => b.clicks - a.clicks || b.impressions - a.impressions,
        impressions: (a, b) => b.impressions - a.impressions,
        gain: (a, b) => (b.clickDelta || 0) - (a.clickDelta || 0),
        loss: (a, b) => (a.clickDelta || 0) - (b.clickDelta || 0),
        position: (a, b) => (a.position || 999) - (b.position || 999),
      };
      const list = source
        .filter((item) => (state.status === "all" || item.status === state.status) && (!needle || String(item[field]).toLowerCase().includes(needle)))
        .sort(sorters[state.sort] || sorters.clicks);
      return { field, list, counts };
    },
    // Daily points, or weekly blocks once the period is too long to read day by day.
    points(series) {
      if (!series) return null;
      const size = series.length > 100 ? 7 : 1;
      const out = [];
      for (let index = 0; index < series.length; index += size) {
        const block = series.slice(index, index + size);
        out.push({ ...engine.summarize(block), date: block[0].date });
      }
      return out;
    },
    render(d, ctx) {
      const state = this.ui;
      const range = ctx.range;
      const options = ctx.options;
      const current = engine.summarize(d.series.current);
      const previous = d.series.previous ? engine.summarize(d.series.previous) : null;
      const points = this.points(d.series.current);
      const previousPoints = this.points(d.series.previous);
      const blockSize = d.series.current.length > 100 ? 7 : 1;
      const metric = ["clicks", "impressions", "ctr", "position"].includes(state.metric) ? state.metric : "clicks";

      // Status screen: the four totals double as the chart selector.
      const ctrDelta = previous ? current.ctr - previous.ctr : null;
      const ctrHtml = ctrDelta == null ? "" : `<span class="delta ${ctrDelta > 0.00005 ? "is-up" : ctrDelta < -0.00005 ? "is-down" : "is-flat"}">${ctrDelta > 0.00005 ? "▲" : ctrDelta < -0.00005 ? "▼" : "■"} ${esc(fmt.decimal(Math.abs(ctrDelta) * 100, 2))} pt</span>`;
      const rankDelta = previous && previous.position > 0 && current.position > 0 ? previous.position - current.position : null;
      const tiles = [
        { id: "clicks", value: fmt.compact(current.clicks), delta: previous ? ui.change(engine.percentChange(current.clicks, previous.clicks), true) : "", hint: t("overview.clicksHint") },
        { id: "impressions", value: fmt.compact(current.impressions), delta: previous ? ui.change(engine.percentChange(current.impressions, previous.impressions), true) : "", hint: t("overview.impressionsHint") },
        { id: "ctr", value: fmt.pct(current.ctr, 2), delta: ctrHtml, hint: t("overview.ctrHint") },
        { id: "position", value: fmt.pos(current.position), delta: previous ? ui.rank(rankDelta) : "", hint: t("overview.positionHint") },
      ]
        .map((tile) => `<button type="button" class="stat ${tile.id === metric ? "is-active" : ""}" data-set="metric" data-value="${tile.id}" aria-pressed="${tile.id === metric}" title="${esc(tile.hint)}">
          <span class="stat-label">${esc(t(`metric.${tile.id}`))}</span>
          <strong class="stat-value">${esc(tile.value)}</strong>
          <span class="stat-delta">${tile.delta}</span>
        </button>`)
        .join("");
      const markers = d.notes
        .filter((note) => note.date >= range.start && note.date <= range.end)
        .map((note) => ({ index: Math.floor(engine.diffDays(range.start, note.date) / blockSize), text: `${fmt.date(note.date, true)} · ${note.title}` }));
      const noteCount = markers.length;
      const updates = d.updates.filter((update) => update.date >= range.start && update.date <= range.end);
      for (const update of updates) markers.push({ index: Math.floor(engine.diffDays(range.start, update.date) / blockSize), text: `${fmt.date(update.date, true)} · ${update.title}`, cls: "is-update" });
      const updatesHtml = updates.length
        ? `<div class="updates"><p class="muted"><span class="legend-key is-update"></span>${esc(t("overview.updateLegend"))}</p><ul>${updates.map((update) => `<li>${esc(fmt.date(update.date, true))}${update.end ? ` – ${esc(fmt.date(update.end, true))}` : ""} · ${update.url ? `<a href="${esc(update.url)}" target="_blank" rel="noopener noreferrer">${esc(update.title)}</a>` : esc(update.title)}</li>`).join("")}</ul></div>`
        : "";
      const labels = points.map((point) => fmt.date(point.date));
      const values = points.map((point) => point[metric]);
      const previousValues = previousPoints ? previousPoints.map((point) => point[metric]) : null;
      let chartHtml;
      if (metric === "clicks" || metric === "impressions") {
        chartHtml = chart.columns({ label: t("overview.trendTitle"), values, previous: previousValues, labels, markers, name: t("common.current"), previousName: t("common.previous") });
      } else {
        const format = metric === "ctr" ? (value) => fmt.pct(value, 1) : (value) => fmt.decimal(value, 1);
        const series = [];
        if (previousValues) series.push({ name: t("common.previous"), cls: "is-previous", values: previousValues });
        series.push({ name: t("common.current"), cls: "is-current", values, labels });
        chartHtml = chart.line({ label: t("overview.trendTitle"), series, labels, markers, format });
      }
      const status = `<section class="card status">
        <header class="card-head"><h2>${esc(t("overview.trendTitle"))}</h2>${blockSize > 1 ? ui.badge(t("overview.weekly")) : ""}</header>
        <div class="stat-row">${tiles}</div>
        ${chartHtml}
        <div class="legend"><span class="legend-key is-current"></span>${esc(fmt.period(range))}${range.previous ? `<span class="legend-key is-previous"></span>${esc(fmt.period(range.previous))}` : ""}${noteCount ? `<span class="legend-key is-marker"></span>${esc(t("overview.markerLegend"))}` : ""}</div>
        ${updatesHtml}
        ${range.previous ? "" : ui.notice(t("common.noComparison"), "info")}
      </section>`;

      // Rank ladder: one segmented bar instead of six separate bars.
      const buckets = engine.rankBuckets(d.queries.current.filter((item) => item.impressions > 0));
      const previousBuckets = d.queries.previous ? engine.rankBuckets(d.queries.previous.filter((item) => item.impressions > 0)) : null;
      const bucketLabel = (bucket) => (Number.isFinite(bucket.max) ? `${bucket.min}–${bucket.max}` : `${bucket.min}+`);
      const ladderBar = buckets.buckets.map((bucket, index) => (bucket.count > 0 ? `<span class="ladder-seg tone-${index}" style="flex:${bucket.count}" title="${bucketLabel(bucket)} · ${esc(fmt.int(bucket.count))}"></span>` : "")).join("");
      const ladderRows = buckets.buckets
        .map((bucket, index) => {
          const delta = previousBuckets ? bucket.count - previousBuckets.buckets[index].count : null;
          const deltaHtml = delta == null ? "" : `<span class="delta ${delta > 0 ? "is-up" : delta < 0 ? "is-down" : "is-flat"}">${delta > 0 ? "+" : ""}${esc(fmt.int(delta))}</span>`;
          return `<li><span class="swatch tone-${index}"></span><span class="ladder-label">${bucketLabel(bucket)}</span><strong>${esc(fmt.int(bucket.count))}</strong><span class="muted">${esc(fmt.pct(buckets.total ? bucket.count / buckets.total : 0, 0))}</span>${deltaHtml}</li>`;
        })
        .join("");
      const listedClicks = d.queries.current.reduce((sum, item) => sum + item.clicks, 0);
      const hidden = current.clicks > 0 ? Math.max(0, 1 - listedClicks / current.clicks) : 0;
      const ladder = ui.card({
        eyebrow: "RANK LADDER / QUERIES",
        title: t("overview.bucketTitle"),
        tools: ui.badge(fmt.int(buckets.total)),
        body: `<div class="ladder">${ladderBar}</div><ul class="ladder-list">${ladderRows}</ul>`,
        note: `${t("overview.bucketIntro")}${hidden > 0.01 ? ` ${t("overview.hiddenQueries", { share: fmt.pct(hidden, 0) })}` : ""}`,
      });

      // Where to look next: entry points into the other tabs, counted from this data.
      const strikingCount = d.queries.current.filter((item) => item.position >= options.strikingMin && item.position <= options.strikingMax && item.impressions >= options.minImpressions).length;
      const fallingPages = d.pages.compared.filter((item) => item.status === "decaying" || item.status === "lost").length;
      const quest = (href, count, label) => `<a class="quest" href="${href}"><strong class="quest-count">${esc(count)}</strong><span class="quest-label">${esc(label)}</span><span class="quest-go" aria-hidden="true">→</span></a>`;
      const quests = ui.card({
        eyebrow: "NEXT / WHERE TO LOOK",
        title: t("overview.questTitle"),
        body: `<div class="quests">
          ${quest("#striking", fmt.int(strikingCount), t("overview.quest.striking"))}
          ${range.previous ? quest("#decay", fmt.int(fallingPages), t("overview.quest.pages")) : ""}
          ${quest("#notes", fmt.int(P.dueNotes()), t("overview.quest.notes"))}
          ${quest("#queue", "", t("overview.quest.queue"))}
        </div>`,
        note: t("overview.questNote"),
      });

      // Winners and losers side by side, then the full ledger.
      const movers = this.movers(d);
      const source = movers.field === "page" ? d.pages.compared : d.queries.compared;
      const entityTabs = ui.tabs("entity", [{ id: "query", label: t("common.queries") }, { id: "page", label: t("common.pages") }], state.entity);
      const name = (item) => (movers.field === "page" ? ui.page(item.page) : ui.query(item.query));
      const board = (title, list, tone) => `<div class="board board-${tone}"><h3>${esc(title)}</h3>${list.length ? `<ol>${list.map((item) => `<li>${name(item)}<span class="board-num">${item.clickDelta > 0 ? "+" : ""}${esc(fmt.int(item.clickDelta))}</span>${ui.change(item.clickChange, item.status === "new")}</li>`).join("")}</ol>` : `<p class="muted">${esc(t("overview.boardEmpty"))}</p>`}</div>`;
      const boards = range.previous
        ? ui.card({
            eyebrow: "SCOREBOARD / CLICKS VS PREVIOUS PERIOD",
            title: t("overview.boardTitle"),
            tools: entityTabs,
            body: `<div class="boards">${board(t("overview.gainers"), source.filter((item) => item.clickDelta > 0).sort((a, b) => b.clickDelta - a.clickDelta).slice(0, 6), "up")}${board(t("overview.losers"), source.filter((item) => item.clickDelta < 0).sort((a, b) => a.clickDelta - b.clickDelta).slice(0, 6), "down")}</div>`,
            note: t("overview.moversNote"),
          })
        : "";
      const statuses = ["all", "growing", "decaying", "new", "lost"].filter((id) => id === "all" || range.previous);
      const statusSelect = `<select class="input" data-bind="status" aria-label="${esc(t("movers.statusLabel"))}">${statuses.map((id) => `<option value="${id}"${state.status === id ? " selected" : ""}>${esc(t(`movers.status.${id}`))} (${esc(fmt.int(movers.counts[id]))})</option>`).join("")}</select>`;
      const sortSelect = `<select class="input" data-bind="sort" aria-label="${esc(t("movers.sort"))}">${["clicks", "impressions", "gain", "loss", "position"].map((id) => `<option value="${id}"${state.sort === id ? " selected" : ""}>${esc(t(`movers.sort.${id}`))}</option>`).join("")}</select>`;
      const rows = movers.list.slice(0, state.limit).map((item) => [
        movers.field === "page" ? ui.page(item.page) : `${ui.query(item.query)}${trackButton(item.query)}`,
        esc(fmt.int(item.clicks)),
        ui.change(item.clickChange, item.status === "new"),
        esc(fmt.int(item.impressions)),
        ui.change(item.impressionChange, item.status === "new"),
        esc(fmt.pct(item.ctr)),
        esc(fmt.pos(item.position)),
        ui.rank(item.rankDelta),
      ]);
      const ledger = ui.card({
        eyebrow: "LEDGER / EVERY ROW",
        title: t("overview.ledgerTitle"),
        tools: `${range.previous ? "" : entityTabs}${ui.button("export", t("common.exportCsv"), { cls: "btn-ghost" })}`,
        body: `<div class="toolbar"><input class="input input-wide" type="search" data-bind="search" value="${esc(state.search)}" placeholder="${esc(t("common.search"))}" aria-label="${esc(t("common.search"))}" />${statusSelect}${sortSelect}</div>
          ${partialNotice(movers.field === "page" ? d.pages.partial : d.queries.partial)}
          ${ui.table([col(movers.field === "page" ? "common.page" : "common.query"), col("metric.clicks", 1), col("common.change", 1), col("metric.impressions", 1), col("common.change", 1), col("metric.ctr", 1), col("metric.position", 1), col("common.rankChange", 1)], rows)}
          ${ui.more("limit", rows.length, movers.list.length)}`,
      });

      const sourceCard = ui.card({
        eyebrow: "SOURCE / LIMITS",
        title: t("source.title"),
        body: `<dl class="facts">
          <div><dt>${esc(t("source.property"))}</dt><dd>${esc(ctx.site)}</dd></div>
          <div><dt>${esc(t("source.period"))}</dt><dd>${esc(fmt.period(range))}</dd></div>
          <div><dt>${esc(t("source.previous"))}</dt><dd>${esc(range.previous ? fmt.period(range.previous) : t("common.none"))}</dd></div>
          <div><dt>${esc(t("source.filter"))}</dt><dd>${esc(P.filterSummary(P.state.filter) || t("common.none"))}</dd></div>
          <div><dt>${esc(t("source.connector"))}</dt><dd>${esc(t(P.state.connection === "demo" ? "source.demo" : "source.live"))}</dd></div>
          <div><dt>${esc(t("source.rows"))}</dt><dd>${esc(t("source.rowsValue", { queries: fmt.int(d.queries.current.length), pages: fmt.int(d.pages.current.length) }))}</dd></div>
        </dl>`,
        note: t("source.note", { lag: engine.DATA_LAG_DAYS }),
      });

      return `${status}<div class="grid-2">${ladder}${quests}</div>${boards}${ledger}${sourceCard}`;
    },
    actions: {
      ...shared,
      export(el, api) {
        const view = views.overview;
        const movers = view.movers(api.data);
        const headers = [movers.field, "clicks", "previous_clicks", "impressions", "previous_impressions", "ctr", "position", "previous_position", "status"];
        P.downloadCsv(`gsc-${movers.field}`, headers, movers.list.map((item) => [item[movers.field], item.clicks, item.previous ? item.previous.clicks : "", item.impressions, item.previous ? item.previous.impressions : "", engine.round(item.ctr, 4), item.position || "", item.previous ? item.previous.position : "", item.status]));
      },
    },
  };

  // --- multi-site list --------------------------------------------------------
  views.sites = {
    needsSite: false,
    async load(ctx) {
      const end = ctx.lastData;
      const start = engine.addDays(end, -90);
      const items = await P.pool(P.state.sites, 3, async (site) => {
        try {
          const result = await data.query({ dimensions: ["date"], start, end, filter: false, site: site.siteUrl });
          const weeks = engine.weeklyBuckets(engine.dailySeries(result.rows, start, end), 13);
          const sum = (list) => list.reduce((total, week) => total + week.clicks, 0);
          return { ...site, weeks, clicks: sum(weeks), change: engine.percentChange(sum(weeks.slice(9)), sum(weeks.slice(5, 9))) };
        } catch (error) {
          return { ...site, error: P.errorText(error) };
        }
      });
      return { items: items.sort((a, b) => (b.clicks || 0) - (a.clicks || 0)) };
    },
    render(d) {
      if (!d.items.length) return ui.empty(t("sites.empty"));
      const cards = d.items
        .map((site) => {
          const active = site.siteUrl === P.state.site;
          const body = site.error
            ? ui.notice(site.error, "warn")
            : `<div class="site-spark">${chart.spark(site.weeks.map((week) => week.clicks), "is-wide")}</div>
               <div class="site-numbers"><strong>${esc(fmt.compact(site.clicks))}</strong><span class="muted">${esc(t("sites.clicks13w"))}</span>${ui.change(site.change, true)}</div>`;
          return `<article class="site-card ${active ? "is-active" : ""}">
            <header><h3 title="${esc(site.siteUrl)}">${esc(P.siteLabel(site.siteUrl))}</h3>${ui.badge(String(site.siteUrl).startsWith("sc-domain:") ? "DOMAIN" : "URL PREFIX")}</header>
            ${body}
            <footer>${active ? ui.badge(t("sites.current"), "good") : ""}${ui.button("open-site", t("sites.open"), { data: { site: site.siteUrl }, cls: active ? "btn-ghost" : "" })}</footer>
          </article>`;
        })
        .join("");
      return ui.card({ eyebrow: "PROPERTIES / LAST 13 WEEKS", title: t("sites.title"), intro: t("sites.intro"), body: `<div class="site-grid">${cards}</div>`, note: t("sites.note") });
    },
    actions: {
      "open-site"(el) {
        P.app.setSite(el.dataset.site, "overview");
      },
    },
  };

  // --- 12-month decay heatmap -------------------------------------------------
  views.decay = {
    ui: { status: "all", limit: 50 },
    async load(ctx) {
      const windows = engine.monthWindows(ctx.today, 12);
      const results = await P.pool(windows, 4, (window) => data.query({ dimensions: ["page"], start: window.start, end: window.end, rowLimit: 1000 }));
      const months = windows.map((window, index) => ({ key: window.key, rows: results[index].rows }));
      return { windows, map: engine.buildDecayMap(months, ctx.options), capped: results.some((result) => result.partial) };
    },
    render(d) {
      const state = this.ui;
      const counts = { all: d.map.length, decaying: 0, rising: 0, steady: 0 };
      for (const page of d.map) if (counts[page.status] != null) counts[page.status] += 1;
      const list = d.map.filter((page) => state.status === "all" || page.status === state.status);
      const tone = { decaying: "bad", rising: "good", steady: "", young: "info", quiet: "" };
      const rows = list.slice(0, state.limit).map((page) => [
        ui.page(page.page),
        ...page.levels.map((level, index) => `<span class="hm hm-${level}" title="${esc(`${d.windows[index].key} · ${fmt.int(page.clicks[index])} ${t("metric.clicks")}`)}">${page.clicks[index] > 0 ? esc(fmt.compact(page.clicks[index])) : "·"}</span>`),
        `<span title="${esc(`${t("decay.bestPrior")}: ${fmt.decimal(page.bestPrior, 0)}`)}">${esc(fmt.decimal(page.recent, 0))}</span>`,
        page.change == null ? `<span class="muted">—</span>` : ui.change(page.change),
        ui.badge(t(`decay.status.${page.status}`), tone[page.status]),
      ]);
      const columns = [col("common.page"), ...d.windows.map((window) => ({ label: fmt.month(window.key), cell: true })), col("decay.recent", 1), col("common.change", 1), col("decay.status")];
      const tableHtml = ui.table(columns, rows, t("decay.empty")).replace('class="table-scroll"', 'class="table-scroll matrix"');
      return ui.card({
        eyebrow: "DECAY MAP / 12 MONTHS",
        title: t("decay.title"),
        intro: t("decay.intro"),
        body: `<div class="toolbar">${ui.tabs("status", ["all", "decaying", "rising", "steady"].map((id) => ({ id, label: t(id === "all" ? "common.all" : `decay.status.${id}`), count: counts[id] })), state.status)}
          <span class="toolbar-fill"></span><span class="heat-legend">${esc(t("decay.less"))}${[0, 1, 2, 3, 4].map((level) => `<span class="hm hm-${level}"></span>`).join("")}${esc(t("decay.more"))}</span></div>
          ${d.capped ? ui.notice(t("decay.capped"), "warn") : ""}${tableHtml}${ui.more("limit", rows.length, list.length)}`,
        note: t("decay.note", { drop: fmt.pct(P.state.options.decayDropRatio, 0) }),
      });
    },
  };

  // --- new pages --------------------------------------------------------------
  views.newPages = {
    ui: { limit: 50 },
    async load(ctx) {
      const window = { start: engine.addDays(ctx.lastData, -181), end: ctx.lastData };
      const [earlier, recent] = await Promise.all([
        data.query({ dimensions: ["page"], start: engine.oldestDate(ctx.today), end: engine.addDays(window.start, -1) }),
        data.queryPaged({ dimensions: ["page", "date"], start: window.start, end: window.end }, 50000),
      ]);
      const known = earlier.rows.filter((row) => row.impressions > 0).map((row) => row.page);
      return { window, pages: engine.findNewPages(known, recent.rows, window), partial: earlier.partial || recent.partial };
    },
    render(d) {
      const rows = d.pages.slice(0, this.ui.limit).map((page) => [
        ui.page(page.page),
        esc(fmt.date(page.firstSeen, true)),
        esc(t("newPages.days", { days: fmt.int(page.ageDays) })),
        esc(fmt.int(page.impressions)),
        esc(fmt.int(page.clicks)),
        chart.spark(page.series.map((point) => point.impressions)),
      ]);
      return ui.card({
        eyebrow: "NEW PAGES / LAST 6 MONTHS",
        title: t("newPages.title"),
        tools: ui.badge(fmt.int(d.pages.length)),
        intro: t("newPages.intro", { period: fmt.period(d.window) }),
        body: `${d.partial ? ui.notice(t("newPages.partial"), "warn") : ""}${ui.table([col("common.page"), col("newPages.firstSeen"), col("newPages.age", 1), col("metric.impressions", 1), col("metric.clicks", 1), col("newPages.trend")], rows, t("newPages.empty"))}${ui.more("limit", rows.length, d.pages.length)}`,
        note: t("newPages.note"),
      });
    },
  };

  // --- rank tracking ----------------------------------------------------------
  views.rank = {
    async load(ctx) {
      const tracked = store.getSite("tracked", []);
      const range = ctx.range;
      const start = range.previous ? range.previous.start : range.start;
      const [suggestions, items] = await Promise.all([
        base.grouped("query", range),
        P.pool(tracked, 4, async (keyword) => {
          const result = await data.query({ dimensions: ["date", "page"], start, end: range.end, filter: false, extra: queryEquals(keyword) });
          return { keyword, ...engine.summarizeTracked(result.rows, range) };
        }),
      ]);
      const known = new Set(tracked.map(engine.normalizeKey));
      return { items, suggestions: suggestions.current.filter((item) => !known.has(item.key)).sort((a, b) => b.impressions - a.impressions).slice(0, 300) };
    },
    render(d, ctx) {
      const rows = d.items.map((item) => {
        const current = item.current;
        const pageCell = current
          ? `${ui.page(current.page)}${item.pageChanged ? ` <span class="badge badge-warn" title="${esc(t("rank.pageWas", { page: item.previous.page }))}">${esc(t("rank.pageChanged"))}</span>` : ""}`
          : `<span class="muted">${esc(t("rank.noData"))}</span>`;
        return [
          ui.query(item.keyword),
          esc(current ? fmt.pos(current.position) : "—"),
          ui.rank(item.rankDelta),
          chart.rankSpark(item.series.map((point) => point.position)),
          esc(current ? fmt.int(current.clicks) : "—"),
          esc(current ? fmt.int(current.impressions) : "—"),
          pageCell,
          `<button type="button" class="btn-icon" data-action="untrack" data-query="${esc(item.keyword)}" aria-label="${esc(t("common.remove"))}" title="${esc(t("common.remove"))}">×</button>`,
        ];
      });
      const form = `<div class="toolbar">
        <input class="input input-wide" id="rankInput" list="rankSuggestions" placeholder="${esc(t("rank.placeholder"))}" aria-label="${esc(t("rank.placeholder"))}" data-enter="add" />
        <datalist id="rankSuggestions">${d.suggestions.map((item) => `<option value="${esc(item.query)}"></option>`).join("")}</datalist>
        ${ui.button("add", t("rank.add"))}
        <label class="btn btn-ghost">${esc(t("rank.import"))}<input class="visually-hidden" type="file" accept=".csv,.txt,text/csv,text/plain" data-file="import" /></label>
        <span class="toolbar-fill"></span>${rows.length ? ui.button("export", t("common.exportCsv"), { cls: "btn-ghost" }) : ""}
      </div>`;
      return ui.card({
        eyebrow: "RANK TRACKING / EXACT QUERY",
        title: t("rank.title"),
        tools: ui.badge(fmt.int(d.items.length)),
        intro: t("rank.intro"),
        body: `${form}${comparisonNotice(ctx.range)}${ui.table([col("common.query"), col("metric.position", 1), col("common.rankChange", 1), col("rank.trend"), col("metric.clicks", 1), col("metric.impressions", 1), col("rank.page"), { label: "" }], rows, t("rank.empty"))}`,
        note: t("rank.note"),
      });
    },
    actions: {
      add(el, api) {
        const input = document.getElementById("rankInput");
        const value = input ? input.value.trim() : "";
        if (!value) return;
        P.toast(t(P.track(value) ? "rank.added" : "rank.exists", { query: value }));
        api.reload();
      },
      untrack(el, api) {
        const key = engine.normalizeKey(el.dataset.query);
        store.setSite("tracked", store.getSite("tracked", []).filter((item) => engine.normalizeKey(item) !== key));
        api.reload();
      },
      import(text, api) {
        const added = engine.parseKeywordList(text).filter((keyword) => P.track(keyword)).length;
        P.toast(t("rank.imported", { count: fmt.int(added) }));
        api.reload();
      },
      export(el, api) {
        P.downloadCsv("gsc-rank-tracking", ["query", "position", "previous_position", "clicks", "impressions", "page", "previous_page", "page_changed"], api.data.items.map((item) => [item.keyword, item.current ? item.current.position : "", item.previous ? item.previous.position : "", item.current ? item.current.clicks : "", item.current ? item.current.impressions : "", item.current ? item.current.page : "", item.previous ? item.previous.page : "", item.pageChanged ? "yes" : "no"]));
      },
    },
  };

  // --- striking distance ------------------------------------------------------
  views.striking = {
    ui: { limit: 30 },
    async load(ctx) {
      const [queries, queryPages] = await Promise.all([base.grouped("query", ctx.range), base.queryPages(ctx.range)]);
      const list = engine.findStrikingDistance(queries.compared.filter((item) => item.impressions > 0), queryPages.rows, ctx.options);
      const start = engine.addDays(ctx.range.end, -29);
      const trends = await P.pool(list.slice(0, 10), 4, async (item) => {
        const result = await data.query({ dimensions: ["date"], start, end: ctx.range.end, extra: queryEquals(item.query) });
        return engine.dailySeries(result.rows, start, ctx.range.end).map((point) => (point.impressions > 0 ? point.position : null));
      });
      return { list, trends, partial: queries.partial || queryPages.partial };
    },
    render(d, ctx) {
      const rows = d.list.slice(0, this.ui.limit).map((item, index) => [
        `${ui.query(item.query)}${trackButton(item.query)}`,
        esc(fmt.pos(item.position)),
        ui.rank(item.rankDelta),
        d.trends[index] ? chart.rankSpark(d.trends[index]) : `<span class="muted">—</span>`,
        esc(fmt.int(item.impressions)),
        esc(fmt.int(item.clicks)),
        esc(fmt.pct(item.ctr)),
        `<span class="page-stack">${item.pages.slice(0, 3).map((page) => ui.page(page.page)).join("")}${item.pages.length > 3 ? `<span class="muted">+${item.pages.length - 3}</span>` : ""}</span>`,
      ]);
      return ui.card({
        eyebrow: `STRIKING DISTANCE / POSITION ${ctx.options.strikingMin}–${ctx.options.strikingMax}`,
        title: t("striking.title"),
        tools: `${ui.badge(fmt.int(d.list.length))}${d.list.length ? ui.button("export", t("common.exportCsv"), { cls: "btn-ghost" }) : ""}`,
        intro: t("striking.intro", { min: ctx.options.strikingMin, max: ctx.options.strikingMax, impressions: fmt.int(ctx.options.minImpressions) }),
        body: `${partialNotice(d.partial)}${ui.table([col("common.query"), col("metric.position", 1), col("common.rankChange", 1), col("striking.trend"), col("metric.impressions", 1), col("metric.clicks", 1), col("metric.ctr", 1), col("striking.pages")], rows, t("striking.empty"))}${ui.more("limit", rows.length, d.list.length)}`,
        note: t("striking.note"),
      });
    },
    actions: {
      ...shared,
      export(el, api) {
        P.downloadCsv("gsc-striking-distance", ["query", "position", "impressions", "clicks", "ctr", "pages"], api.data.list.map((item) => [item.query, item.position, item.impressions, item.clicks, engine.round(item.ctr, 4), item.pages.map((page) => page.page).join(" | ")]));
      },
    },
  };

  // --- cannibalization --------------------------------------------------------
  views.cannibal = {
    ui: { limit: 20 },
    async load(ctx) {
      const queryPages = await base.queryPages(ctx.range);
      return { list: engine.findCannibalization(queryPages.rows, ctx.options), partial: queryPages.partial };
    },
    render(d, ctx) {
      const cases = d.list
        .slice(0, this.ui.limit)
        .map((item) => {
          const rows = item.pages.map((page) => [
            `${ui.page(page.page)}${page.page === item.keep ? ` ${ui.badge(t("cannibal.keep"), "good")}` : ""}`,
            `<span class="share"><span class="share-fill" style="width:${Math.round(page.share * 100)}%"></span></span><span class="share-text">${esc(fmt.pct(page.share, 0))}</span>`,
            esc(fmt.int(page.clicks)),
            esc(fmt.int(page.impressions)),
            esc(fmt.pos(page.position)),
          ]);
          return `<article class="case"><header><h3>${ui.query(item.query)}</h3><span class="muted">${esc(t("cannibal.summary", { pages: item.pages.length, impressions: fmt.int(item.impressions), clicks: fmt.int(item.clicks) }))}</span></header>
            ${ui.table([col("common.page"), col("cannibal.share"), col("metric.clicks", 1), col("metric.impressions", 1), col("metric.position", 1)], rows)}
            <p class="case-note">${esc(t(`cannibal.reason.${item.reason}`))}</p></article>`;
        })
        .join("");
      return ui.card({
        eyebrow: "CANNIBALIZATION / QUERY → PAGES",
        title: t("cannibal.title"),
        tools: `${ui.badge(fmt.int(d.list.length))}${d.list.length ? ui.button("export", t("common.exportCsv"), { cls: "btn-ghost" }) : ""}`,
        intro: t("cannibal.intro", { share: fmt.pct(ctx.options.cannibalMinShare, 0) }),
        body: `${partialNotice(d.partial)}${cases || ui.empty(t("cannibal.empty"))}${ui.more("limit", Math.min(this.ui.limit, d.list.length), d.list.length)}`,
        note: t("cannibal.note"),
      });
    },
    actions: {
      export(el, api) {
        const rows = api.data.list.flatMap((item) => item.pages.map((page) => [item.query, page.page, page.page === item.keep ? "keep-candidate" : "", engine.round(page.share, 4), page.clicks, page.impressions, page.position]));
        P.downloadCsv("gsc-cannibalization", ["query", "page", "suggestion", "impression_share", "clicks", "impressions", "position"], rows);
      },
    },
  };

  // --- language versions ------------------------------------------------------
  views.intl = {
    async load(ctx) {
      const pages = await base.grouped("page", ctx.range);
      const groups = engine.groupByLanguage(pages.current, pages.previous);
      const detected = groups.filter((item) => item.kind !== "root");
      if (!detected.length) return { groups: [], series: [] };
      const top = groups.slice(0, 8);
      const series = await P.pool(top, 3, async (item) => {
        const filter = engine.languageFilter(item, groups);
        if (!filter) return null;
        return (await base.series(ctx.range, { extra: [filter] })).current.map((point) => point.clicks);
      });
      return { groups: top, total: groups.length, series, partial: pages.partial };
    },
    render(d, ctx) {
      if (!d.groups.length) return ui.card({ eyebrow: "INTERNATIONAL / LANGUAGE VERSIONS", title: t("intl.title"), body: ui.empty(t("intl.empty")), note: t("intl.note") });
      const cards = d.groups
        .map((item, index) => `<article class="seg-card">
          <header><h3>${esc(item.language === engine.ROOT_LANGUAGE ? t("intl.root") : item.language)}</h3>${ui.badge(t(`intl.kind.${item.kind}`))}</header>
          <p class="muted">${esc(t("intl.pages", { count: fmt.int(item.pages) }))}</p>
          ${d.series[index] ? chart.spark(d.series[index], "is-wide") : ""}
          ${metricGrid(item, ctx.range)}
        </article>`)
        .join("");
      return ui.card({
        eyebrow: "INTERNATIONAL / LANGUAGE VERSIONS",
        title: t("intl.title"),
        tools: ui.badge(fmt.int(d.total)),
        intro: t("intl.intro"),
        body: `${partialNotice(d.partial)}${comparisonNotice(ctx.range)}<div class="seg-grid">${cards}</div>`,
        note: t("intl.note"),
      });
    },
  };

  P.metricGrid = metricGrid;
  function metricGrid(item, range) {
    const previous = range.previous ? item.previous : null;
    const cell = (label, value, delta) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd><dd>${delta}</dd></div>`;
    const ctrDelta = previous ? item.ctr - previous.ctr : null;
    const ctrHtml = ctrDelta == null ? "" : `<span class="delta ${ctrDelta > 0 ? "is-up" : ctrDelta < 0 ? "is-down" : "is-flat"}">${ctrDelta > 0 ? "▲" : ctrDelta < 0 ? "▼" : "■"} ${esc(fmt.decimal(Math.abs(ctrDelta) * 100, 2))} pt</span>`;
    return `<dl class="metric-grid">
      ${cell(t("metric.clicks"), fmt.compact(item.clicks), range.previous ? ui.change(item.clickChange, true) : "")}
      ${cell(t("metric.impressions"), fmt.compact(item.impressions), range.previous ? ui.change(item.impressionChange, true) : "")}
      ${cell(t("metric.ctr"), fmt.pct(item.ctr), ctrHtml)}
      ${cell(t("metric.position"), fmt.pos(item.position), range.previous ? ui.rank(item.rankDelta) : "")}
    </dl>`;
  }

  // --- segment trends ---------------------------------------------------------
  views.segments = {
    async load(ctx) {
      const segments = store.getSite("segments", []);
      const cards = await P.pool(segments, 3, async (segment) => {
        const series = await base.series(ctx.range, { filter: segment.filter });
        const current = engine.summarize(series.current);
        const previous = series.previous ? engine.summarize(series.previous) : null;
        const compared = engine.compare([{ ...current, key: segment.id }], previous ? [{ ...previous, key: segment.id }] : undefined, ctx.options)[0];
        return { segment, item: compared, clicks: series.current.map((point) => point.clicks) };
      });
      return { cards };
    },
    render(d, ctx) {
      const form = `<details class="panel" ${d.cards.length ? "" : "open"}><summary>${esc(t("segments.add"))}</summary>
        <div class="form-grid" id="segmentForm">
          <label class="field"><span>${esc(t("segments.name"))}</span><input class="input" data-field="name" maxlength="40" /></label>
          ${P.filterFields(P.state.filter)}
          <div class="form-actions">${ui.button("add", t("segments.save"))}</div>
        </div></details>`;
      const brandForm = `<details class="panel"><summary>${esc(t("segments.brandAdd"))}</summary>
        <div class="toolbar"><input class="input input-wide" id="brandTerms" placeholder="${esc(t("segments.brandTerms"))}" aria-label="${esc(t("segments.brandTerms"))}" />${ui.button("add-brand", t("segments.brandSave"))}</div></details>`;
      const cards = d.cards
        .map(({ segment, item, clicks }) => `<article class="seg-card">
          <header><h3>${esc(segment.name)}</h3></header>
          <p class="muted">${esc(P.filterSummary(segment.filter))}</p>
          ${chart.spark(clicks, "is-wide")}
          ${metricGrid(item, ctx.range)}
          <footer>${ui.button("apply", t("segments.apply"), { cls: "btn-ghost", data: { id: segment.id } })}${ui.button("remove", t("common.remove"), { cls: "btn-ghost", data: { id: segment.id } })}</footer>
        </article>`)
        .join("");
      return ui.card({
        eyebrow: "SEGMENTS / SAVED FILTERS",
        title: t("segments.title"),
        tools: ui.badge(fmt.int(d.cards.length)),
        intro: t("segments.intro"),
        body: `${form}${brandForm}${comparisonNotice(ctx.range)}${cards ? `<div class="seg-grid">${cards}</div>` : ui.empty(t("segments.empty"))}`,
        note: t("segments.note"),
      });
    },
    actions: {
      add(el, api) {
        const fields = P.readFields(document.getElementById("segmentForm"));
        const filter = P.fieldsToFilter(fields);
        if (!fields.name.trim() || engine.isFilterEmpty(filter)) return P.toast(t("segments.invalid"));
        const segments = store.getSite("segments", []);
        segments.push({ id: `s${Date.now().toString(36)}`, name: fields.name.trim(), filter });
        store.setSite("segments", segments);
        api.reload();
      },
      // One list of brand words becomes two segments: queries that mention the brand, and the rest.
      "add-brand"(el, api) {
        const terms = document.getElementById("brandTerms").value.split(/[,，、\n]/).map((term) => term.trim()).filter(Boolean);
        if (!terms.length) return P.toast(t("segments.invalid"));
        const pattern = terms.map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
        const make = (name, op) => ({ id: `s${Date.now().toString(36)}${op}`, name, filter: { query: { op, value: pattern }, page: { op: "contains", value: "" }, country: "", device: "" } });
        store.setSite("segments", [...store.getSite("segments", []), make(t("segments.brand"), "regex"), make(t("segments.nonBrand"), "notRegex")]);
        api.reload();
      },
      remove(el, api) {
        store.setSite("segments", store.getSite("segments", []).filter((segment) => segment.id !== el.dataset.id));
        api.reload();
      },
      apply(el) {
        const segment = store.getSite("segments", []).find((item) => item.id === el.dataset.id);
        if (segment) P.app.setFilter(segment.filter, "overview");
      },
    },
  };

  // --- indexing checks --------------------------------------------------------
  const freshIndexing = () => ({ text: "", sitemap: "", max: 50, running: false, stop: false, done: 0, total: 0, results: [] });
  views.indexing = {
    ui: freshIndexing(),
    onSiteChange() {
      this.ui.stop = true;
      this.ui = freshIndexing();
    },
    render(d, ctx) {
      const state = this.ui;
      if (!data.can("inspectUrl")) return ui.card({ eyebrow: "INDEXING / URL INSPECTION", title: t("indexing.title"), body: ui.empty(t("indexing.unavailable")) });
      const sitemap = data.can("fetchSitemapUrls")
        ? `<div class="toolbar"><input class="input input-wide" data-keep="sitemap" value="${esc(state.sitemap)}" placeholder="${esc(t("indexing.sitemapPlaceholder"))}" aria-label="${esc(t("indexing.sitemapPlaceholder"))}" />${ui.button("sitemap", t("indexing.loadSitemap"), { cls: "btn-ghost", disabled: state.running })}</div>`
        : ui.notice(t("indexing.noSitemap"), "info");
      const form = `${sitemap}
        <textarea class="input textarea" rows="5" data-keep="text" placeholder="${esc(t("indexing.placeholder"))}" aria-label="${esc(t("indexing.placeholder"))}">${esc(state.text)}</textarea>
        <div class="toolbar"><label class="field field-inline"><span>${esc(t("indexing.max"))}</span><input class="input input-num" type="number" min="1" max="200" data-keep="max" value="${esc(state.max)}" /></label>
          ${state.running ? ui.button("stop", t("indexing.stop")) : ui.button("run", t("indexing.run"))}
          ${state.running || state.total ? `<span class="muted">${esc(t("indexing.progress", { done: state.done, total: state.total }))}</span>` : ""}
          <span class="toolbar-fill"></span>${state.results.length ? ui.button("export", t("common.exportCsv"), { cls: "btn-ghost" }) : ""}</div>`;
      let results = "";
      if (state.results.length) {
        const indexed = state.results.filter((item) => item.indexed).length;
        const failed = state.results.filter((item) => item.error).length;
        const reasons = new Map();
        for (const item of state.results) if (!item.indexed && !item.error) reasons.set(item.coverageState || "—", (reasons.get(item.coverageState || "—") || 0) + 1);
        const rows = state.results.map((item) =>
          item.error
            ? [ui.page(item.url), ui.badge(t("indexing.failed"), "warn"), esc(item.error), "—", "—", "—"]
            : [
                ui.page(item.url),
                ui.badge(t(item.indexed ? "indexing.indexed" : "indexing.notIndexed"), item.indexed ? "good" : "bad"),
                esc(item.coverageState || "—"),
                esc(item.lastCrawlTime ? fmt.date(item.lastCrawlTime, true) : "—"),
                item.canonicalMismatch ? `<span class="badge badge-warn" title="${esc(item.googleCanonical)}">${esc(t("indexing.canonicalDiffers"))}</span>` : esc(item.googleCanonical ? t("indexing.canonicalSame") : "—"),
                esc([item.robotsTxtState, item.pageFetchState].filter(Boolean).join(" / ") || "—"),
              ],
        );
        results = `<div class="stat-grid stat-grid-3">${ui.stat(t("indexing.indexed"), fmt.int(indexed))}${ui.stat(t("indexing.notIndexed"), fmt.int(state.results.length - indexed - failed))}${ui.stat(t("indexing.failed"), fmt.int(failed))}</div>
          ${reasons.size ? `<div class="chips">${Array.from(reasons, ([reason, count]) => `<span class="chip is-static">${esc(reason)} <span class="chip-count">${count}</span></span>`).join("")}</div>` : ""}
          ${ui.table([col("common.page"), col("indexing.status"), col("indexing.coverage"), col("indexing.lastCrawl"), col("indexing.canonical"), col("indexing.fetch")], rows)}`;
      }
      return ui.card({ eyebrow: "INDEXING / URL INSPECTION", title: t("indexing.title"), intro: t("indexing.intro"), body: form + results, note: t("indexing.note") });
    },
    actions: {
      async sitemap(el, api) {
        const state = views.indexing.ui;
        try {
          const urls = await P.state.connector.fetchSitemapUrls({ siteUrl: P.state.site, sitemapUrl: state.sitemap.trim() });
          state.text = (urls || []).join("\n");
          P.toast(t("indexing.sitemapLoaded", { count: fmt.int((urls || []).length) }));
        } catch (error) {
          P.toast(P.errorText(error));
        }
        api.repaint();
      },
      async run(el, api) {
        const state = views.indexing.ui;
        const urls = engine.parseUrlList(state.text).slice(0, Math.min(200, Math.max(1, Number(state.max) || 50)));
        if (!urls.length) return P.toast(t("indexing.noUrls"));
        Object.assign(state, { running: true, stop: false, done: 0, total: urls.length, results: [] });
        api.repaint();
        for (const url of urls) {
          if (state.stop) break;
          try {
            state.results.push({ url, ...(await data.inspect(url)) });
          } catch (error) {
            state.results.push({ url, error: P.errorText(error) });
          }
          state.done += 1;
          if (views.indexing.ui !== state) return;
          api.repaint();
        }
        state.running = false;
        api.repaint();
      },
      stop() {
        views.indexing.ui.stop = true;
      },
      export() {
        const rows = views.indexing.ui.results.map((item) => [item.url, item.error ? "error" : item.indexed ? "indexed" : "not-indexed", item.coverageState || item.error || "", item.lastCrawlTime || "", item.googleCanonical || "", item.userCanonical || "", item.robotsTxtState || "", item.pageFetchState || ""]);
        P.downloadCsv("gsc-indexing", ["url", "status", "coverage_state", "last_crawl", "google_canonical", "user_canonical", "robots_txt", "page_fetch"], rows);
      },
    },
  };

  // --- change notes -----------------------------------------------------------
  const NOTE_KINDS = ["title", "content", "redesign", "technical", "links", "other"];
  views.notes = {
    async load(ctx) {
      const notes = store.getSite("notes", []).slice().sort((a, b) => (a.date < b.date ? 1 : -1));
      const cards = await P.pool(notes, 3, async (note) => {
        const windows = engine.noteWindows(note.date, note.days, ctx.lastData);
        if (!windows.days || windows.before.start < engine.oldestDate(ctx.today)) return { note, windows, result: null };
        const extra = note.page ? [{ dimension: "page", operator: /^https?:\/\//i.test(note.page) ? "equals" : "contains", expression: note.page }] : undefined;
        const response = await data.query({ dimensions: ["date"], start: windows.before.start, end: windows.after.end, filter: false, extra });
        return { note, windows, result: engine.compareNote(engine.dailySeries(response.rows, windows.before.start, windows.after.end), windows) };
      });
      return { cards };
    },
    render(d, ctx) {
      const form = `<details class="panel" ${d.cards.length ? "" : "open"}><summary>${esc(t("notes.add"))}</summary>
        <div class="form-grid" id="noteForm">
          <label class="field"><span>${esc(t("notes.date"))}</span><input class="input" type="date" data-field="date" value="${esc(ctx.today)}" max="${esc(ctx.today)}" /></label>
          <label class="field field-wide"><span>${esc(t("notes.what"))}</span><input class="input" data-field="title" maxlength="120" placeholder="${esc(t("notes.whatPlaceholder"))}" /></label>
          <label class="field"><span>${esc(t("notes.kind"))}</span><select class="input" data-field="kind">${NOTE_KINDS.map((kind) => `<option value="${kind}">${esc(t(`notes.kind.${kind}`))}</option>`).join("")}</select></label>
          <label class="field field-wide"><span>${esc(t("notes.page"))}</span><input class="input" data-field="page" placeholder="${esc(t("notes.pagePlaceholder"))}" /></label>
          <label class="field"><span>${esc(t("notes.window"))}</span><select class="input" data-field="days">${[7, 14, 28, 56].map((days) => `<option value="${days}"${days === 28 ? " selected" : ""}>${esc(t("notes.days", { days }))}</option>`).join("")}</select></label>
          <label class="field field-check"><input type="checkbox" data-field="remind" checked /><span>${esc(t("notes.remind"))}</span></label>
          <div class="form-actions">${ui.button("add", t("notes.save"))}</div>
        </div></details>`;
      const cards = d.cards
        .map(({ note, windows, result }) => {
          const due = note.remindOn && !note.reviewed && note.remindOn <= ctx.today;
          const status = !windows.days ? ui.badge(t("notes.pending", { date: fmt.date(windows.readyOn, true) }), "info") : windows.complete ? ui.badge(t("notes.complete", { days: windows.days }), "good") : ui.badge(t("notes.partial", { days: windows.days, wanted: windows.wanted }), "warn");
          const body = result
            ? ui.table(
                [{ label: "" }, col("notes.before", 1), col("notes.after", 1), col("common.change", 1)],
                [
                  [esc(t("metric.clicks")), esc(fmt.int(result.before.clicks)), esc(fmt.int(result.after.clicks)), ui.change(result.clickChange, true)],
                  [esc(t("metric.impressions")), esc(fmt.int(result.before.impressions)), esc(fmt.int(result.after.impressions)), ui.change(result.impressionChange, true)],
                  [esc(t("metric.position")), esc(fmt.pos(result.before.position)), esc(fmt.pos(result.after.position)), ui.rank(result.rankDelta)],
                ],
              ) + `<p class="case-note">${esc(t("notes.windows", { before: fmt.period(windows.before), after: fmt.period(windows.after) }))}</p>`
            : ui.notice(t(windows.days ? "notes.tooOld" : "notes.waiting"), "info");
          return `<article class="case ${due ? "is-due" : ""}">
            <header><h3>${esc(note.title)}</h3><span class="muted">${esc(fmt.date(note.date, true))}</span>${ui.badge(t(`notes.kind.${note.kind}`))}${status}${due ? ui.badge(t("notes.due"), "bad") : ""}</header>
            ${note.page ? `<p class="muted">${esc(t("notes.scope", { page: note.page }))}</p>` : ""}
            ${body}
            <footer>${note.remindOn && !note.reviewed ? `<span class="muted">${esc(t("notes.remindOn", { date: fmt.date(note.remindOn, true) }))}</span>${ui.button("review", t("notes.markReviewed"), { cls: "btn-ghost", data: { id: note.id } })}` : ""}${ui.button("remove", t("common.remove"), { cls: "btn-ghost", data: { id: note.id } })}</footer>
          </article>`;
        })
        .join("");
      return ui.card({
        eyebrow: "CHANGE NOTES / BEFORE VS AFTER",
        title: t("notes.title"),
        tools: ui.badge(fmt.int(d.cards.length)),
        intro: t("notes.intro"),
        body: `${form}${cards || ui.empty(t("notes.empty"))}`,
        note: t("notes.note"),
      });
    },
    actions: {
      add(el, api) {
        const fields = P.readFields(document.getElementById("noteForm"));
        if (!engine.isIsoDate(fields.date) || !fields.title.trim()) return P.toast(t("notes.invalid"));
        const days = Number(fields.days) || 28;
        const notes = store.getSite("notes", []);
        notes.push({ id: `n${Date.now().toString(36)}`, date: fields.date, title: fields.title.trim(), kind: fields.kind, page: fields.page.trim(), days, remindOn: fields.remind ? engine.addDays(fields.date, days + engine.DATA_LAG_DAYS) : "", reviewed: false });
        store.setSite("notes", notes);
        api.reload();
      },
      review(el, api) {
        store.setSite("notes", store.getSite("notes", []).map((note) => (note.id === el.dataset.id ? { ...note, reviewed: true } : note)));
        api.reload();
      },
      remove(el, api) {
        store.setSite("notes", store.getSite("notes", []).filter((note) => note.id !== el.dataset.id));
        api.reload();
      },
    },
  };

  // --- raw data export --------------------------------------------------------
  const EXPORT_DIMENSIONS = ["query", "page", "device", "country", "date"];
  const EXPORT_METRICS = ["clicks", "impressions", "ctr", "position"];
  const freshExport = () => ({ form: null, rows: null, dimensions: [], partial: false, fetched: 0, busy: false, error: "" });
  views.exportData = {
    ui: freshExport(),
    onSiteChange() {
      this.ui = freshExport();
    },
    render(d, ctx) {
      const state = this.ui;
      const global = P.state.filter;
      const form = state.form || { dim_query: true, limit: 1000, queryOp: global.query.op, queryValue: global.query.value, pageOp: global.page.op, pageValue: global.page.value, country: global.country, device: global.device };
      const filter = P.fieldsToFilter(form);
      const checks = EXPORT_DIMENSIONS.map((dimension) => `<label class="field field-check"><input type="checkbox" data-field="dim_${dimension}"${form[`dim_${dimension}`] ? " checked" : ""} /><span>${esc(t(`filter.${dimension}`))}</span></label>`).join("");
      const ranges = EXPORT_METRICS.map((metric) => `<label class="field"><span>${esc(t(`metric.${metric}`))}${metric === "ctr" ? " %" : ""}</span><span class="field-pair"><input class="input input-num" type="number" step="any" data-field="${metric}Min" placeholder="${esc(t("export.min"))}" value="${esc(form[`${metric}Min`] || "")}" /><input class="input input-num" type="number" step="any" data-field="${metric}Max" placeholder="${esc(t("export.max"))}" value="${esc(form[`${metric}Max`] || "")}" /></span></label>`).join("");
      let preview = "";
      if (state.error) preview = ui.notice(state.error, "warn");
      else if (state.rows) {
        const columns = [...state.dimensions.map((dimension) => col(`filter.${dimension}`)), ...EXPORT_METRICS.map((metric) => col(`metric.${metric}`, 1))];
        const rows = state.rows.slice(0, 50).map((row) => [...state.dimensions.map((dimension) => (dimension === "page" ? ui.page(row.page) : esc(row[dimension]))), esc(fmt.int(row.clicks)), esc(fmt.int(row.impressions)), esc(fmt.pct(row.ctr, 2)), esc(fmt.pos(row.position))]);
        preview = `${ui.notice(t("export.result", { kept: fmt.int(state.rows.length), fetched: fmt.int(state.fetched) }), state.partial ? "warn" : "info")}${state.partial ? ui.notice(t("common.partial", { limit: fmt.int(engine.ROW_LIMIT) }), "warn") : ""}${ui.table(columns, rows)}${state.rows.length > 50 ? `<p class="muted">${esc(t("export.previewNote"))}</p>` : ""}`;
      }
      return ui.card({
        eyebrow: "EXPORT / RAW ROWS",
        title: t("export.title"),
        intro: t("export.intro", { period: fmt.period(ctx.range), limit: fmt.int(engine.ROW_LIMIT) }),
        body: `<div id="exportForm">
          <fieldset class="fieldset"><legend>${esc(t("export.dimensions"))}</legend><div class="check-row">${checks}</div></fieldset>
          <fieldset class="fieldset"><legend>${esc(t("export.apiFilters"))}</legend><div class="form-grid">${P.filterFields(filter)}</div></fieldset>
          <fieldset class="fieldset"><legend>${esc(t("export.ranges"))}</legend><div class="form-grid">${ranges}</div></fieldset>
          <div class="toolbar"><label class="field field-inline"><span>${esc(t("export.limit"))}</span><input class="input input-num" type="number" min="1" max="${engine.ROW_LIMIT}" data-field="limit" value="${esc(form.limit || 1000)}" /></label>
            ${ui.button("pull", t(state.busy ? "common.loading" : "export.fetch"), { disabled: state.busy })}${state.rows && state.rows.length ? ui.button("download", t("export.download")) : ""}</div>
        </div>${preview}`,
        note: t("export.note"),
      });
    },
    actions: {
      async pull(el, api) {
        const state = views.exportData.ui;
        const fields = P.readFields(document.getElementById("exportForm"));
        const dimensions = EXPORT_DIMENSIONS.filter((dimension) => fields[`dim_${dimension}`]);
        Object.assign(state, { form: fields, error: "", rows: null });
        if (!dimensions.length) {
          state.error = t("export.needDimension");
          return api.repaint();
        }
        const bound = (value, scale) => (value === "" || value == null || !Number.isFinite(Number(value)) ? NaN : Number(value) * (scale || 1));
        const ranges = {};
        for (const metric of EXPORT_METRICS) ranges[metric] = [bound(fields[`${metric}Min`], metric === "ctr" ? 0.01 : 1), bound(fields[`${metric}Max`], metric === "ctr" ? 0.01 : 1)];
        state.busy = true;
        api.repaint();
        try {
          const result = await data.query({ dimensions, start: api.ctx.range.start, end: api.ctx.range.end, filter: P.fieldsToFilter(fields), rowLimit: Math.max(1, Math.min(engine.ROW_LIMIT, Number(fields.limit) || 1000)) });
          Object.assign(state, { rows: engine.filterRows(result.rows, { ranges }), fetched: result.rows.length, partial: result.rows.length >= engine.ROW_LIMIT, dimensions });
        } catch (error) {
          state.error = P.errorText(error);
        }
        state.busy = false;
        api.repaint();
      },
      download() {
        const state = views.exportData.ui;
        if (!state.rows) return;
        P.downloadCsv("gsc-export", [...state.dimensions, ...EXPORT_METRICS], state.rows.map((row) => [...state.dimensions.map((dimension) => row[dimension]), row.clicks, row.impressions, engine.round(row.ctr, 4), engine.round(row.position, 2)]));
      },
    },
  };

  // --- action queue (coach) ---------------------------------------------------
  const QUEUE_STATUSES = ["open", "reviewing", "in-progress", "done", "snoozed"];
  const RULE_FIELDS = [
    ["minImpressions", 0, 100000, 1],
    ["minRankDelta", 0.1, 50, 0.1],
    ["lowCtrRatio", 0.1, 1, 0.05],
    ["maxRecommendations", 1, 100, 1],
    ["anomalyDropRatio", 0.1, 0.9, 0.05],
    ["anomalyRankDelta", 1, 100, 0.5],
    ["maxInsights", 1, 30, 1],
  ];
  views.queue = {
    ui: { status: "all" },
    async load(ctx) {
      const [queries, queryPages] = await Promise.all([base.grouped("query", ctx.range), base.queryPages(ctx.range)]);
      const summary = engine.summarize(queries.current);
      const live = queries.compared.filter((item) => item.impressions > 0);
      return {
        summary,
        items: engine.buildQueue(live, queryPages.rows, summary, ctx.options),
        anomalies: ctx.range.previous ? engine.buildAnomalies(queries.compared, ctx.options) : null,
        ctr: engine.buildCtrOpportunities(queries.current, summary, ctx.options),
        partial: queries.partial || queryPages.partial,
      };
    },
    render(d, ctx) {
      const saved = store.getSite("queue", {});
      const statusOf = (id) => (saved[id] && saved[id].status) || "open";
      const counts = { all: d.items.length };
      for (const status of QUEUE_STATUSES) counts[status] = d.items.filter((item) => statusOf(item.id) === status).length;
      const visible = d.items.filter((item) => this.ui.status === "all" || statusOf(item.id) === this.ui.status);
      const list = visible
        .map((item, index) => {
          const entry = saved[item.id] || {};
          const pageHtml = item.page === engine.PAGE_MULTIPLE ? `<span class="badge badge-warn">${esc(t("queue.multiplePages", { count: item.pageCount }))}</span>` : ui.page(item.page);
          return `<article class="queue-item status-${esc(statusOf(item.id))}">
            <span class="queue-rank">${String(index + 1).padStart(2, "0")}</span>
            <div class="queue-main">
              <h3>${ui.query(item.query)}</h3>
              <div class="chips">${item.rules.map((rule) => `<span class="chip is-static">${esc(t(`queue.rule.${rule}.title`))}</span>`).join("")}</div>
              <p class="queue-action">${esc(t(`queue.rule.${item.rule}.action`))}</p>
              <p class="queue-metrics"><span>${esc(t("metric.position"))} ${esc(fmt.pos(item.position))}</span>${ui.rank(item.rankDelta)}<span>${esc(t("metric.impressions"))} ${esc(fmt.int(item.impressions))}</span><span>${esc(t("metric.clicks"))} ${esc(fmt.int(item.clicks))}</span><span>${esc(t("metric.ctr"))} ${esc(fmt.pct(item.ctr))}</span>${pageHtml}</p>
            </div>
            <div class="queue-side">
              <select class="input" data-change="status" data-id="${esc(item.id)}" aria-label="${esc(t("queue.status"))}">${QUEUE_STATUSES.map((status) => `<option value="${status}"${statusOf(item.id) === status ? " selected" : ""}>${esc(t(`queue.status.${status}`))}</option>`).join("")}</select>
              <input class="input" data-change="note" data-id="${esc(item.id)}" value="${esc(entry.note || "")}" placeholder="${esc(t("queue.notePlaceholder"))}" aria-label="${esc(t("queue.notePlaceholder"))}" maxlength="200" />
            </div>
          </article>`;
        })
        .join("");
      const rules = `<details class="panel"><summary>${esc(t("queue.rules"))}</summary><p class="muted">${esc(t("queue.rulesIntro"))}</p>
        <div class="form-grid" id="ruleForm">${RULE_FIELDS.map(([name, min, max, step]) => `<label class="field"><span>${esc(t(`queue.option.${name}`))}</span><input class="input input-num" type="number" data-field="${name}" min="${min}" max="${max}" step="${step}" value="${esc(ctx.options[name])}" /></label>`).join("")}
          <div class="form-actions">${ui.button("save-rules", t("queue.applyRules"))}${ui.button("reset-rules", t("queue.resetRules"), { cls: "btn-ghost" })}</div></div></details>`;
      const queueCard = ui.card({
        eyebrow: "RULE QUEUE / HUMAN REVIEW",
        title: t("queue.title"),
        tools: d.items.length ? ui.button("export", t("common.exportCsv"), { cls: "btn-ghost" }) : "",
        intro: t("queue.intro"),
        body: `${partialNotice(d.partial)}<div class="toolbar">${ui.tabs("status", ["all", ...QUEUE_STATUSES].map((id) => ({ id, label: t(id === "all" ? "common.all" : `queue.status.${id}`), count: counts[id] })), this.ui.status)}</div>${rules}${list || ui.empty(t("queue.empty"))}`,
        note: t("queue.note"),
      });
      const anomalyBody = !d.anomalies
        ? ui.empty(t("queue.anomalyNeedsCompare"))
        : d.anomalies.length
          ? `<ul class="insights">${d.anomalies.map((item) => `<li><strong>${esc(item.query)}</strong><span class="chips">${item.signals.map((signal) => `<span class="chip is-static is-bad">${esc(t(`queue.signal.${signal.type}`, { value: signal.type === "rank" ? fmt.decimal(Math.abs(signal.value), 1) : fmt.pct(Math.abs(signal.value), 0) }))}</span>`).join("")}</span></li>`).join("")}</ul>`
          : ui.empty(t("queue.anomalyEmpty"));
      const ctrBody = d.ctr.length
        ? `<ul class="insights">${d.ctr.map((item) => `<li><strong>${esc(item.query)}</strong><span class="muted">${esc(t("queue.ctrLine", { position: fmt.pos(item.position), ctr: fmt.pct(item.ctr), reference: fmt.pct(item.referenceCtr), impressions: fmt.int(item.impressions) }))}</span></li>`).join("")}</ul>`
        : ui.empty(t("queue.ctrEmpty"));
      return `${queueCard}<div class="grid-2">${ui.card({ eyebrow: "SIGNALS / PERIOD OVER PERIOD", title: t("queue.anomalies"), body: anomalyBody, note: t("queue.anomalyNote") })}${ui.card({ eyebrow: "SIGNALS / POSITION 4–20", title: t("queue.ctrTitle"), body: ctrBody, note: t("queue.ctrNote") })}</div>`;
    },
    actions: {
      status(el, api) {
        const saved = store.getSite("queue", {});
        saved[el.dataset.id] = { ...(saved[el.dataset.id] || {}), status: el.value };
        store.setSite("queue", saved);
        api.repaint();
      },
      note(el) {
        const saved = store.getSite("queue", {});
        saved[el.dataset.id] = { ...(saved[el.dataset.id] || {}), note: el.value };
        store.setSite("queue", saved);
      },
      "save-rules"(el, api) {
        const fields = P.readFields(document.getElementById("ruleForm"));
        for (const [name, min, max] of RULE_FIELDS) {
          const value = Number(fields[name]);
          if (Number.isFinite(value)) P.state.options[name] = Math.min(max, Math.max(min, value));
        }
        store.set("options", P.state.options);
        api.reload();
      },
      "reset-rules"(el, api) {
        P.state.options = { ...engine.DEFAULT_OPTIONS };
        store.remove("options");
        api.reload();
      },
      export(el, api) {
        const saved = store.getSite("queue", {});
        P.downloadCsv("gsc-action-queue", ["query", "rules", "position", "rank_delta", "impressions", "clicks", "ctr", "page", "status", "note"], api.data.items.map((item) => [item.query, item.rules.join(" | "), item.position, item.rankDelta == null ? "" : item.rankDelta, item.impressions, item.clicks, engine.round(item.ctr, 4), item.page === engine.PAGE_MULTIPLE ? "multiple" : item.page, (saved[item.id] && saved[item.id].status) || "open", (saved[item.id] && saved[item.id].note) || ""]));
      },
    },
  };
  // --- evidence lines (plain text for the coach's evidence card) ----------------
  const signed = (ratio) => (ratio == null ? "—" : `${ratio > 0 ? "+" : ""}${fmt.pct(ratio, 0)}`);
  const rankText = (delta) => (delta == null || Math.abs(delta) < 0.05 ? "" : ` (${delta > 0 ? "▲" : "▼"}${fmt.decimal(Math.abs(delta), 1)})`);
  views.overview.evidence = (d) => {
    const now = engine.summarize(d.series.current);
    const before = d.series.previous ? engine.summarize(d.series.previous) : null;
    const lines = [
      `${t("metric.clicks")} ${fmt.int(now.clicks)}${before ? ` (${signed(engine.percentChange(now.clicks, before.clicks))})` : ""}`,
      `${t("metric.impressions")} ${fmt.int(now.impressions)}${before ? ` (${signed(engine.percentChange(now.impressions, before.impressions))})` : ""}`,
      `${t("metric.ctr")} ${fmt.pct(now.ctr, 2)}`,
      `${t("metric.position")} ${fmt.pos(now.position)}${before && before.position > 0 ? rankText(before.position - now.position) : ""}`,
    ];
    const moved = d.queries.compared.filter((item) => item.clickDelta).sort((a, b) => b.clickDelta - a.clickDelta);
    if (moved.length && moved[0].clickDelta > 0) lines.push(`${t("overview.gainers")}: ${moved[0].query} (+${fmt.int(moved[0].clickDelta)})`);
    if (moved.length && moved[moved.length - 1].clickDelta < 0) lines.push(`${t("overview.losers")}: ${moved[moved.length - 1].query} (${fmt.int(moved[moved.length - 1].clickDelta)})`);
    return lines;
  };
  views.decay.evidence = (d) => {
    const list = d.map.filter((page) => page.status === "decaying");
    return [`${t("decay.status.decaying")}: ${fmt.int(list.length)} / ${fmt.int(d.map.length)}`, ...list.slice(0, 3).map((page) => `${P.urlPath(page.page)}: ${fmt.decimal(page.bestPrior, 0)} → ${fmt.decimal(page.recent, 0)} (${signed(page.change)})`)];
  };
  views.striking.evidence = (d) => [`${t("striking.title")}: ${fmt.int(d.list.length)}`, ...d.list.slice(0, 3).map((item) => `${item.query}: ${t("metric.position")} ${fmt.pos(item.position)}, ${t("metric.impressions")} ${fmt.int(item.impressions)}`)];
  views.cannibal.evidence = (d) => [`${t("cannibal.title")}: ${fmt.int(d.list.length)}`, ...d.list.slice(0, 3).map((item) => `${item.query}: ${item.pages.map((page) => `${P.urlPath(page.page)} ${fmt.pct(page.share, 0)}`).join(" | ")}`)];
  views.rank.evidence = (d) => d.items.map((item) => (item.current ? `${item.keyword}: ${t("metric.position")} ${fmt.pos(item.current.position)}${rankText(item.rankDelta)}, ${P.urlPath(item.current.page)}${item.pageChanged ? ` [${t("rank.pageChanged")}]` : ""}` : `${item.keyword}: ${t("rank.noData")}`));
  views.notes.evidence = (d) => d.cards.map(({ note, windows, result }) => (result ? `${note.date} ${note.title}: ${t("metric.clicks")} ${fmt.int(result.before.clicks)} → ${fmt.int(result.after.clicks)} (${signed(result.clickChange)}), ${t("notes.days", { days: windows.days })}` : `${note.date} ${note.title}: ${t("notes.waiting")}`));
  views.queue.evidence = (d) => d.items.slice(0, 5).map((item) => `${item.query}: ${item.rules.map((rule) => t(`queue.rule.${rule}.title`)).join(", ")}; ${t("metric.position")} ${fmt.pos(item.position)}, ${t("metric.impressions")} ${fmt.int(item.impressions)}`);
})();
