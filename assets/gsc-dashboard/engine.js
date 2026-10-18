(function (root) {
  "use strict";

  // Pure, deterministic calculations for the GSC panel. No DOM, no network, no storage.

  const DAY_MS = 86400000;
  const MAX_HISTORY_DAYS = 486; // Search Console keeps roughly 16 months of data.
  const DATA_LAG_DAYS = 3; // Final data usually trails by two to three days.
  const ROW_LIMIT = 25000;
  const PAGE_MULTIPLE = "__multiple__";
  const ROOT_LANGUAGE = "x-default";

  const RANGE_PRESETS = [
    { id: "7d", days: 7 },
    { id: "28d", days: 28 },
    { id: "3m", days: 91 },
    { id: "6m", days: 182 },
    { id: "12m", days: 364 },
    { id: "16m", days: 480 },
  ];

  const BUCKETS = [
    { id: "top3", min: 1, max: 3 },
    { id: "top10", min: 4, max: 10 },
    { id: "page2", min: 11, max: 20 },
    { id: "page3", min: 21, max: 30 },
    { id: "deep", min: 31, max: 50 },
    { id: "far", min: 51, max: Infinity },
  ];

  const DEFAULT_OPTIONS = {
    minImpressions: 20,
    minRankDelta: 1,
    lowCtrRatio: 0.75,
    maxRecommendations: 30,
    anomalyDropRatio: 0.3,
    anomalyRankDelta: 3,
    maxInsights: 8,
    strikingMin: 3,
    strikingMax: 20,
    cannibalMinShare: 0.1,
    decayDropRatio: 0.3,
    decayMinClicks: 10,
  };

  const FILTER_OPERATORS = {
    contains: "contains",
    notContains: "notContains",
    equals: "equals",
    notEquals: "notEquals",
    regex: "includingRegex",
    notRegex: "excludingRegex",
  };

  const ISO_639_1 = new Set(
    ("aa ab ae af ak am an ar as av ay az ba be bg bh bi bm bn bo br bs ca ce ch co cr cs cu cv cy da de dv dz ee el en eo es et eu " +
      "fa ff fi fj fo fr fy ga gd gl gn gu gv ha he hi ho hr ht hu hy hz ia id ie ig ii ik io is it iu ja jv ka kg ki kj kk kl km kn " +
      "ko kr ks ku kv kw ky la lb lg li ln lo lt lu lv mg mh mi mk ml mn mr ms mt my na nb nd ne ng nl nn no nr nv ny oc oj om or os " +
      "pa pi pl ps pt qu rm rn ro ru rw sa sc sd se sg si sk sl sm sn so sq sr ss st su sv sw ta te tg th ti tk tl tn to tr ts tt tw " +
      "ty ug uk ur uz ve vi vo wa wo xh yi yo za zh zu").split(" "),
  );

  function codedError(code, message) {
    const error = new Error(message || code);
    error.code = code;
    return error;
  }

  function pad2(value) {
    return String(value).padStart(2, "0");
  }

  function num(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function round(value, digits) {
    if (!Number.isFinite(value)) return value;
    const factor = 10 ** (digits || 0);
    return Math.round(value * factor) / factor;
  }

  // --- dates ------------------------------------------------------------------
  function toMs(iso) {
    const parts = String(iso).split("-").map(Number);
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  }

  function toIso(ms) {
    return new Date(ms).toISOString().slice(0, 10);
  }

  function isIsoDate(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) && toIso(toMs(value)) === value;
  }

  function addDays(iso, count) {
    return toIso(toMs(iso) + count * DAY_MS);
  }

  function diffDays(from, to) {
    return Math.round((toMs(to) - toMs(from)) / DAY_MS);
  }

  function localToday(now) {
    const date = now || new Date();
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }

  function oldestDate(today) {
    return addDays(today, -MAX_HISTORY_DAYS);
  }

  // mode "year" compares with the same days one year earlier (364 days keeps weekdays aligned).
  function resolveRange(presetId, today, lagDays, mode) {
    const preset = RANGE_PRESETS.find((item) => item.id === presetId) || RANGE_PRESETS[2];
    const lag = Number.isFinite(lagDays) ? lagDays : DATA_LAG_DAYS;
    const oldest = oldestDate(today);
    const end = addDays(today, -lag);
    let start = addDays(end, -(preset.days - 1));
    if (start < oldest) start = oldest;
    const yearly = mode === "year";
    const previousEnd = yearly ? addDays(end, -364) : addDays(start, -1);
    const previousStart = yearly ? addDays(start, -364) : addDays(previousEnd, -(preset.days - 1));
    return {
      id: preset.id,
      compare: yearly ? "year" : "previous",
      days: diffDays(start, end) + 1,
      start,
      end,
      previous: previousStart >= oldest ? { start: previousStart, end: previousEnd } : null,
    };
  }

  // The last `count` complete calendar months, oldest first.
  function monthWindows(today, count) {
    const [year, month] = today.split("-").map(Number);
    const oldest = oldestDate(today);
    const windows = [];
    for (let back = count || 12; back >= 1; back -= 1) {
      const first = toIso(Date.UTC(year, month - 1 - back, 1));
      const last = toIso(Date.UTC(year, month - back, 0));
      if (first >= oldest) windows.push({ key: first.slice(0, 7), start: first, end: last });
    }
    return windows;
  }

  // --- API request helpers ----------------------------------------------------
  function cleanFilter(filter) {
    const source = filter || {};
    const text = (entry) => {
      const value = String((entry && entry.value) || "").trim();
      const op = entry && FILTER_OPERATORS[entry.op] ? entry.op : "contains";
      return value ? { op, value } : null;
    };
    return {
      query: text(source.query),
      page: text(source.page),
      country: String(source.country || "").trim().toLowerCase(),
      device: String(source.device || "").trim().toUpperCase(),
    };
  }

  function isFilterEmpty(filter) {
    const clean = cleanFilter(filter);
    return !clean.query && !clean.page && !clean.country && !clean.device;
  }

  function buildFilterGroups(filter, extra) {
    const clean = cleanFilter(filter);
    const filters = [];
    for (const dimension of ["query", "page"]) {
      if (clean[dimension]) filters.push({ dimension, operator: FILTER_OPERATORS[clean[dimension].op], expression: clean[dimension].value });
    }
    if (clean.country) filters.push({ dimension: "country", operator: "equals", expression: clean.country });
    if (clean.device) filters.push({ dimension: "device", operator: "equals", expression: clean.device });
    for (const item of extra || []) filters.push(item);
    return filters.length ? [{ groupType: "and", filters }] : undefined;
  }

  function rowsFromResponse(response, dimensions) {
    const dims = dimensions || (response && response.dimensions) || [];
    const list = Array.isArray(response) ? response : (response && response.rows) || [];
    return list.map((raw) => {
      const row = { clicks: num(raw.clicks), impressions: num(raw.impressions), position: num(raw.position) };
      row.ctr = row.impressions ? row.clicks / row.impressions : 0;
      dims.forEach((dimension, index) => {
        row[dimension] = String(raw.keys && raw.keys[index] != null ? raw.keys[index] : raw[dimension] != null ? raw[dimension] : "");
      });
      return row;
    });
  }

  // --- aggregation ------------------------------------------------------------
  function normalizeKey(value) {
    return String(value == null ? "" : value).trim().toLowerCase();
  }

  // Search Console reports a result's jump-to links (/a.html#sec-1) as their own page rows.
  // They are the same page, so the fragment is dropped before pages are compared or summed.
  // "#!" and "#/" are client-side routes, which are different pages, and stay as they are.
  function pageKey(value) {
    const url = String(value == null ? "" : value);
    const hash = url.indexOf("#");
    if (hash < 0) return url;
    const next = url.charAt(hash + 1);
    return next === "!" || next === "/" ? url : url.slice(0, hash);
  }

  function finalize(group) {
    const position = group._weight ? group._positionSum / group._weight : 0;
    const out = { ...group, ctr: group.impressions ? group.clicks / group.impressions : 0, position: round(position, 2) };
    delete out._weight;
    delete out._positionSum;
    return out;
  }

  function accumulate(group, row) {
    const weight = row.impressions > 0 ? row.impressions : row.position > 0 ? 1 : 0;
    group.clicks += row.clicks;
    group.impressions += row.impressions;
    group._weight += weight;
    group._positionSum += row.position * weight;
  }

  function emptyGroup(seed) {
    return { ...seed, clicks: 0, impressions: 0, _weight: 0, _positionSum: 0 };
  }

  // Sum clicks/impressions and impression-weight position for every distinct value of `fields`.
  function group(rows, fields) {
    const list = Array.isArray(fields) ? fields : [fields];
    const groups = new Map();
    for (const row of rows) {
      const key = list.map((field) => (field === "query" ? normalizeKey(row[field]) : field === "page" ? pageKey(row[field]) : String(row[field] || ""))).join("\u0001");
      let entry = groups.get(key);
      if (!entry) {
        const seed = { key };
        for (const field of list) seed[field] = field === "page" ? pageKey(row[field]) : row[field] || "";
        entry = emptyGroup(seed);
        groups.set(key, entry);
      }
      accumulate(entry, row);
    }
    return Array.from(groups.values()).map(finalize);
  }

  function summarize(rows) {
    const total = emptyGroup({});
    for (const row of rows) accumulate(total, row);
    return finalize(total);
  }

  function percentChange(current, previous) {
    if (!previous) return current ? null : 0;
    return (current - previous) / previous;
  }

  function bucketFor(position) {
    if (!Number.isFinite(position) || position <= 0) return null;
    const rounded = Math.max(1, Math.round(position));
    return BUCKETS.find((bucket) => rounded >= bucket.min && rounded <= bucket.max) || null;
  }

  function rankBuckets(items) {
    const counts = BUCKETS.map((bucket) => ({ id: bucket.id, min: bucket.min, max: bucket.max, count: 0 }));
    let unknown = 0;
    for (const item of items) {
      const bucket = bucketFor(item.position);
      if (bucket) counts.find((entry) => entry.id === bucket.id).count += 1;
      else unknown += 1;
    }
    return { buckets: counts, unknown, total: items.length };
  }

  // Period-over-period comparison of two grouped lists that share a key.
  function compare(currentItems, previousItems, options) {
    const settings = { ...DEFAULT_OPTIONS, ...(options || {}) };
    const hasPrevious = Array.isArray(previousItems);
    const previousByKey = new Map((previousItems || []).map((item) => [item.key, item]));
    const seen = new Set();
    const out = [];
    const build = (current, previous) => {
      const base = current || previous;
      const item = {
        ...base,
        clicks: current ? current.clicks : 0,
        impressions: current ? current.impressions : 0,
        ctr: current ? current.ctr : 0,
        position: current ? current.position : 0,
        previous: previous || null,
        clickDelta: null,
        clickChange: null,
        impressionDelta: null,
        impressionChange: null,
        rankDelta: null,
        rankDirection: "flat",
        status: "stable",
      };
      if (!hasPrevious) return item;
      const prevClicks = previous ? previous.clicks : 0;
      const prevImpressions = previous ? previous.impressions : 0;
      item.clickDelta = item.clicks - prevClicks;
      item.clickChange = percentChange(item.clicks, prevClicks);
      item.impressionDelta = item.impressions - prevImpressions;
      item.impressionChange = percentChange(item.impressions, prevImpressions);
      if (current && previous && current.position > 0 && previous.position > 0) {
        item.rankDelta = round(previous.position - current.position, 2);
        if (item.rankDelta >= settings.minRankDelta) item.rankDirection = "improved";
        else if (item.rankDelta <= -settings.minRankDelta) item.rankDirection = "declined";
      }
      if (!previous || !prevImpressions) item.status = item.impressions ? "new" : "stable";
      else if (!current || !item.impressions) item.status = "lost";
      else if (item.clickDelta > 0 || (item.clickDelta === 0 && item.impressionDelta > 0)) item.status = "growing";
      else if (item.clickDelta < 0 || (item.clickDelta === 0 && item.impressionDelta < 0)) item.status = "decaying";
      return item;
    };
    for (const current of currentItems) {
      seen.add(current.key);
      out.push(build(current, previousByKey.get(current.key)));
    }
    for (const previous of previousItems || []) {
      if (!seen.has(previous.key)) out.push(build(null, previous));
    }
    return out;
  }

  // Fill every date between start and end so charts never skip a day.
  function dailySeries(rows, start, end) {
    const byDate = new Map(group(rows, "date").map((item) => [item.date, item]));
    const series = [];
    for (let date = start; date <= end; date = addDays(date, 1)) {
      const item = byDate.get(date);
      series.push(item ? { date, clicks: item.clicks, impressions: item.impressions, ctr: item.ctr, position: item.position } : { date, clicks: 0, impressions: 0, ctr: 0, position: 0 });
    }
    return series;
  }

  function sliceSeries(series, start, end) {
    return series.filter((point) => point.date >= start && point.date <= end);
  }

  // Bucket a daily series into trailing 7-day blocks, oldest first.
  function weeklyBuckets(series, weeks) {
    const count = weeks || 13;
    const out = [];
    for (let index = count - 1; index >= 0; index -= 1) {
      const endIndex = series.length - index * 7;
      const block = series.slice(Math.max(0, endIndex - 7), Math.max(0, endIndex));
      const total = summarize(block);
      out.push({ start: block.length ? block[0].date : null, end: block.length ? block[block.length - 1].date : null, clicks: total.clicks, impressions: total.impressions });
    }
    return out;
  }

  // --- page decay heatmap -----------------------------------------------------
  // months: [{ key, rows: [{ page, clicks, impressions }] }], oldest first.
  function buildDecayMap(months, options) {
    const settings = { ...DEFAULT_OPTIONS, ...(options || {}) };
    const pages = new Map();
    months.forEach((month, index) => {
      for (const row of month.rows) {
        if (!row.page) continue;
        const page = pageKey(row.page);
        let entry = pages.get(page);
        if (!entry) {
          entry = { page, clicks: months.map(() => 0), impressions: months.map(() => 0) };
          pages.set(page, entry);
        }
        entry.clicks[index] += row.clicks;
        entry.impressions[index] += row.impressions;
      }
    });
    const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
    const out = [];
    for (const entry of pages.values()) {
      const total = entry.clicks.reduce((sum, value) => sum + value, 0);
      const peak = Math.max(...entry.clicks, 0);
      const count = entry.clicks.length;
      const recent = mean(entry.clicks.slice(Math.max(0, count - 3)));
      let bestPrior = 0;
      for (let end = 3; end <= count - 3; end += 1) bestPrior = Math.max(bestPrior, mean(entry.clicks.slice(end - 3, end)));
      const activeMonths = entry.impressions.filter((value) => value > 0).length;
      const firstActive = entry.impressions.findIndex((value) => value > 0);
      let status = "steady";
      let change = null;
      if (count < 6 || firstActive > count - 6) status = "young";
      else if (bestPrior * 3 < settings.decayMinClicks) status = "quiet";
      else {
        change = (recent - bestPrior) / bestPrior;
        if (change <= -settings.decayDropRatio) status = "decaying";
        else if (change >= settings.decayDropRatio) status = "rising";
      }
      out.push({
        page: entry.page,
        clicks: entry.clicks,
        impressions: entry.impressions,
        levels: entry.clicks.map((value) => (peak > 0 && value > 0 ? Math.max(1, Math.ceil((value / peak) * 4)) : 0)),
        total,
        peak,
        recent: round(recent, 1),
        bestPrior: round(bestPrior, 1),
        lost: round(Math.max(0, bestPrior - recent), 1),
        change,
        status,
        activeMonths,
      });
    }
    const rank = { decaying: 0, steady: 1, rising: 1, young: 2, quiet: 3 };
    return out.sort((a, b) => rank[a.status] - rank[b.status] || b.lost - a.lost || b.total - a.total);
  }

  // --- new pages --------------------------------------------------------------
  // earlierPages: pages that already had impressions before the window.
  // recentRows: [{ page, date, clicks, impressions }] inside the window.
  function findNewPages(earlierPages, recentRows, window) {
    const known = new Set(Array.from(earlierPages, pageKey));
    const pages = new Map();
    for (const row of recentRows) {
      const page = pageKey(row.page);
      if (!page || known.has(page) || row.impressions <= 0) continue;
      let entry = pages.get(page);
      if (!entry) {
        entry = { page, firstSeen: row.date, clicks: 0, impressions: 0, byDate: new Map() };
        pages.set(page, entry);
      }
      if (row.date < entry.firstSeen) entry.firstSeen = row.date;
      entry.clicks += row.clicks;
      entry.impressions += row.impressions;
      entry.byDate.set(row.date, (entry.byDate.get(row.date) || 0) + row.impressions);
    }
    return Array.from(pages.values())
      .map((entry) => {
        const series = [];
        for (let date = entry.firstSeen; date <= window.end; date = addDays(date, 1)) series.push({ date, impressions: entry.byDate.get(date) || 0 });
        return { page: entry.page, firstSeen: entry.firstSeen, ageDays: diffDays(entry.firstSeen, window.end) + 1, clicks: entry.clicks, impressions: entry.impressions, series };
      })
      .sort((a, b) => (a.firstSeen < b.firstSeen ? 1 : a.firstSeen > b.firstSeen ? -1 : b.impressions - a.impressions));
  }

  // --- striking distance and cannibalization ----------------------------------
  function pagesByQuery(queryPageRows) {
    const map = new Map();
    for (const item of group(queryPageRows, ["query", "page"])) {
      if (!item.page) continue;
      const key = normalizeKey(item.query);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push({ page: item.page, clicks: item.clicks, impressions: item.impressions, ctr: item.ctr, position: item.position });
    }
    for (const pages of map.values()) pages.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions || a.position - b.position);
    return map;
  }

  function findStrikingDistance(queryItems, queryPageRows, options) {
    const settings = { ...DEFAULT_OPTIONS, ...(options || {}) };
    const pages = pagesByQuery(queryPageRows || []);
    return queryItems
      .filter((item) => item.position >= settings.strikingMin && item.position <= settings.strikingMax && item.impressions >= settings.minImpressions)
      .map((item) => ({ ...item, pages: pages.get(item.key) || [] }))
      .sort((a, b) => b.impressions - a.impressions || a.position - b.position);
  }

  function findCannibalization(queryPageRows, options) {
    const settings = { ...DEFAULT_OPTIONS, ...(options || {}) };
    const out = [];
    for (const [key, pages] of pagesByQuery(queryPageRows || [])) {
      const impressions = pages.reduce((sum, page) => sum + page.impressions, 0);
      if (impressions < settings.minImpressions) continue;
      const floor = Math.max(settings.minImpressions / 2, impressions * settings.cannibalMinShare);
      const contenders = pages.filter((page) => page.impressions >= floor).map((page) => ({ ...page, share: page.impressions / impressions }));
      if (contenders.length < 2) continue;
      const keep = contenders[0];
      const runnerUp = contenders[1];
      const reason = keep.clicks > runnerUp.clicks ? "clicks" : keep.impressions > runnerUp.impressions ? "impressions" : "position";
      out.push({ key, query: key, clicks: pages.reduce((sum, page) => sum + page.clicks, 0), impressions, pages: contenders, keep: keep.page, reason });
    }
    return out.sort((a, b) => b.impressions - a.impressions);
  }

  // --- language versions ------------------------------------------------------
  const LANGUAGE_SEGMENT = /^([a-z]{2})(?:[-_]([a-z]{2}|[a-z]{4}|\d{3}))?$/;

  function languageOfUrl(url) {
    const match = String(url || "").trim().match(/^https?:\/\/([^/?#]+)(\/[^?#]*)?/i);
    if (!match) return { code: ROOT_LANGUAGE, kind: "root" };
    const segment = ((match[2] || "/").split("/")[1] || "").toLowerCase();
    const bySegment = segment.match(LANGUAGE_SEGMENT);
    if (bySegment && ISO_639_1.has(bySegment[1])) return { code: segment.replace("_", "-"), kind: "subdir" };
    const labels = match[1].toLowerCase().split(".");
    const byHost = labels.length >= 3 ? labels[0].match(LANGUAGE_SEGMENT) : null;
    if (byHost && ISO_639_1.has(byHost[1])) return { code: labels[0].replace("_", "-"), kind: "subdomain" };
    return { code: ROOT_LANGUAGE, kind: "root" };
  }

  function groupByLanguage(currentPageRows, previousPageRows) {
    const tag = (rows) =>
      rows.map((row) => {
        const language = languageOfUrl(row.page);
        return { ...row, language: language.code, kind: language.kind };
      });
    const collect = (rows) => {
      const tagged = tag(rows);
      const kinds = new Map();
      const counts = new Map();
      for (const row of tagged) {
        kinds.set(row.language, row.kind);
        counts.set(row.language, (counts.get(row.language) || 0) + 1);
      }
      return group(tagged, "language").map((item) => ({ ...item, key: item.language, kind: kinds.get(item.language), pages: counts.get(item.language) || 0 }));
    };
    const compared = compare(collect(currentPageRows), previousPageRows ? collect(previousPageRows) : undefined);
    return compared.sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions);
  }

  function escapeRegex(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Page filter that isolates one detected language version; every other detected
  // version is excluded when asking for the root (no language marker) group.
  function languageFilter(target, all) {
    const part = (item) => (item.kind === "subdomain" ? `${escapeRegex(item.code)}\\.[^/]+` : `[^/]+/${escapeRegex(item.code)}(/|\\?|#|$)`);
    if (target.kind !== "root") return { dimension: "page", operator: "includingRegex", expression: `^https?://${part(target)}` };
    const others = (all || []).filter((item) => item.kind !== "root");
    if (!others.length) return null;
    return { dimension: "page", operator: "excludingRegex", expression: `^https?://(${others.map(part).join("|")})` };
  }

  // Expected CTR by position, measured from this site's own queries. Comparing a
  // position-12 query with the whole-site CTR would flag nearly everything, because
  // brand and top-1 queries pull the site average up.
  const CTR_BANDS = [[1, 1], [2, 2], [3, 3], [4, 5], [6, 10], [11, 20], [21, Infinity]];
  function ctrBaseline(queryItems) {
    const live = queryItems.filter((item) => item.impressions > 0 && item.position > 0);
    const overall = summarize(live);
    const bands = CTR_BANDS.map(([min, max]) => {
      const total = summarize(live.filter((item) => Math.round(item.position) >= min && Math.round(item.position) <= max));
      return { min, max, ctr: total.impressions >= 100 ? total.ctr : overall.ctr };
    });
    return (position) => {
      const rounded = Math.max(1, Math.round(position));
      return (bands.find((band) => rounded >= band.min && rounded <= band.max) || { ctr: overall.ctr }).ctr;
    };
  }

  // --- action queue (deterministic review candidates) -------------------------
  const RULE_BASE = { "decline-review": 50, "rewrite-11-20": 40, "page-ownership-review": 35, "snippet-review": 30, "rewrite-21-30": 20 };

  function buildQueue(comparisons, queryPageRows, summary, options) {
    const settings = { ...DEFAULT_OPTIONS, ...(options || {}) };
    const pages = pagesByQuery(queryPageRows || []);
    const expected = ctrBaseline(comparisons);
    const out = [];
    for (const item of comparisons) {
      if (item.impressions < settings.minImpressions) continue;
      const rules = [];
      const rounded = Math.round(item.position);
      if (item.position > 0 && rounded >= 11 && rounded <= 20) rules.push("rewrite-11-20");
      if (item.position > 0 && rounded >= 21 && rounded <= 30) rules.push("rewrite-21-30");
      if (item.rankDelta != null && item.rankDelta <= -settings.minRankDelta) rules.push("decline-review");
      if (item.position > 0 && rounded <= 10 && item.ctr < expected(item.position) * settings.lowCtrRatio) rules.push("snippet-review");
      const owners = (pages.get(item.key) || []).filter((page) => page.impressions >= settings.minImpressions / 2);
      if (owners.length >= 2) rules.push("page-ownership-review");
      if (!rules.length) continue;
      rules.sort((a, b) => RULE_BASE[b] - RULE_BASE[a]);
      const drop = item.rankDelta != null && item.rankDelta < 0 ? Math.min(20, -item.rankDelta * 2) : 0;
      const ownerPages = pages.get(item.key) || [];
      out.push({
        id: item.key,
        query: item.query,
        rule: rules[0],
        rules,
        page: owners.length >= 2 ? PAGE_MULTIPLE : ownerPages.length ? ownerPages[0].page : "",
        pageCount: ownerPages.length,
        position: item.position,
        impressions: item.impressions,
        clicks: item.clicks,
        ctr: item.ctr,
        rankDelta: item.rankDelta,
        score: round(RULE_BASE[rules[0]] + Math.log10(Math.max(item.impressions, 1)) * 10 + drop, 1),
      });
    }
    return out.sort((a, b) => b.score - a.score || b.impressions - a.impressions).slice(0, settings.maxRecommendations);
  }

  function buildAnomalies(comparisons, options) {
    const settings = { ...DEFAULT_OPTIONS, ...(options || {}) };
    const out = [];
    for (const item of comparisons) {
      const previous = item.previous;
      if (!previous || Math.max(item.impressions, previous.impressions) < settings.minImpressions) continue;
      const signals = [];
      if (item.rankDelta != null && item.rankDelta <= -settings.anomalyRankDelta) signals.push({ type: "rank", value: item.rankDelta });
      if (previous.clicks >= 5 && item.clickChange != null && item.clickChange <= -settings.anomalyDropRatio) signals.push({ type: "clicks", value: item.clickChange });
      if (item.impressionChange != null && item.impressionChange <= -settings.anomalyDropRatio) signals.push({ type: "impressions", value: item.impressionChange });
      if (signals.length) out.push({ ...item, signals, weight: signals.length * 1000 + previous.impressions });
    }
    return out.sort((a, b) => b.weight - a.weight).slice(0, settings.maxInsights);
  }

  function buildCtrOpportunities(queryItems, summary, options) {
    const settings = { ...DEFAULT_OPTIONS, ...(options || {}) };
    const expected = ctrBaseline(queryItems);
    return queryItems
      .filter((item) => item.position >= 4 && item.position <= 20 && item.impressions >= settings.minImpressions)
      .map((item) => ({ ...item, referenceCtr: expected(item.position) * settings.lowCtrRatio }))
      .filter((item) => item.ctr < item.referenceCtr)
      .map((item) => ({ ...item, missedClicks: round(item.impressions * (item.referenceCtr - item.ctr), 1) }))
      .sort((a, b) => b.missedClicks - a.missedClicks)
      .slice(0, settings.maxInsights);
  }

  // --- change notes -----------------------------------------------------------
  // Equal-length windows before and after a change. When the after window is not
  // complete yet, both sides shrink to the number of days that already have data.
  function noteWindows(date, days, lastDataDate) {
    const wanted = Math.max(1, Math.round(days) || 28);
    const available = lastDataDate >= date ? Math.min(wanted, diffDays(date, lastDataDate) + 1) : 0;
    if (!available) return { wanted, days: 0, complete: false, before: null, after: null, readyOn: addDays(date, wanted - 1) };
    return {
      wanted,
      days: available,
      complete: available >= wanted,
      before: { start: addDays(date, -available), end: addDays(date, -1) },
      after: { start: date, end: addDays(date, available - 1) },
      readyOn: addDays(date, wanted - 1),
    };
  }

  function compareNote(series, windows) {
    if (!windows.days) return null;
    const before = summarize(sliceSeries(series, windows.before.start, windows.before.end));
    const after = summarize(sliceSeries(series, windows.after.start, windows.after.end));
    return {
      before,
      after,
      clickChange: percentChange(after.clicks, before.clicks),
      impressionChange: percentChange(after.impressions, before.impressions),
      rankDelta: before.position > 0 && after.position > 0 ? round(before.position - after.position, 2) : null,
    };
  }

  // --- rank tracking ----------------------------------------------------------
  function parseKeywordList(text) {
    const seen = new Set();
    const out = [];
    String(text || "")
      .replace(/^﻿/, "")
      .split(/\r?\n/)
      .forEach((line, index) => {
        const cell = line.split(/[\t;,]/)[0].trim().replace(/^"(.*)"$/, "$1").replace(/""/g, '"').trim();
        if (!cell) return;
        if (index === 0 && /^(keywords?|quer(y|ies)|search terms?|關鍵[詞字]|关键[词字]|查詢|查询词?)$/i.test(cell)) return;
        const key = normalizeKey(cell);
        if (seen.has(key)) return;
        seen.add(key);
        out.push(cell);
      });
    return out.slice(0, 500);
  }

  // rows: [{ date, page, clicks, impressions, position }] for one exact query.
  function summarizeTracked(rows, range) {
    const within = (window) => (window ? rows.filter((row) => row.date >= window.start && row.date <= window.end) : []);
    const describe = (list) => {
      if (!list.length) return null;
      const total = summarize(list);
      const pages = group(list, "page").sort((a, b) => b.impressions - a.impressions || b.clicks - a.clicks);
      return { clicks: total.clicks, impressions: total.impressions, ctr: total.ctr, position: total.position, page: pages.length ? pages[0].page : "", pageCount: pages.length };
    };
    const current = describe(within(range));
    const previous = describe(within(range.previous));
    const start = range.previous ? range.previous.start : range.start;
    const series = dailySeries(rows, start, range.end).map((point) => ({ date: point.date, position: point.impressions > 0 ? point.position : null, clicks: point.clicks }));
    return {
      current,
      previous,
      rankDelta: current && previous && current.position > 0 && previous.position > 0 ? round(previous.position - current.position, 2) : null,
      pageChanged: Boolean(current && previous && current.page && previous.page && current.page !== previous.page),
      series,
    };
  }

  // --- export -----------------------------------------------------------------
  function compileMatcher(rule) {
    const value = String(rule.value || "");
    if (rule.op === "regex" || rule.op === "notRegex") {
      let pattern;
      try {
        pattern = new RegExp(value, "i");
      } catch (error) {
        throw codedError("badRegex", `Invalid regular expression: ${value}`);
      }
      return rule.op === "regex" ? (text) => pattern.test(text) : (text) => !pattern.test(text);
    }
    const needle = value.toLowerCase();
    if (rule.op === "equals") return (text) => text.toLowerCase() === needle;
    if (rule.op === "notEquals") return (text) => text.toLowerCase() !== needle;
    if (rule.op === "notContains") return (text) => !text.toLowerCase().includes(needle);
    return (text) => text.toLowerCase().includes(needle);
  }

  // spec.text: [{ field, op, value }]; spec.ranges: { clicks: [min, max], ctr: [min, max] (ratio), ... }
  function filterRows(rows, spec) {
    const matchers = ((spec && spec.text) || []).filter((rule) => String(rule.value || "").trim()).map((rule) => ({ field: rule.field, test: compileMatcher(rule) }));
    const ranges = Object.entries((spec && spec.ranges) || {}).filter(([, bounds]) => bounds && (Number.isFinite(bounds[0]) || Number.isFinite(bounds[1])));
    return rows.filter((row) => {
      for (const matcher of matchers) if (!matcher.test(String(row[matcher.field] || ""))) return false;
      for (const [field, bounds] of ranges) {
        const value = row[field];
        if (Number.isFinite(bounds[0]) && value < bounds[0]) return false;
        if (Number.isFinite(bounds[1]) && value > bounds[1]) return false;
      }
      return true;
    });
  }

  function csvCell(value) {
    if (value == null) return "";
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
    let text = String(value);
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`; // keep spreadsheets from running a query as a formula
    return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function toCsv(headers, rows) {
    return [headers, ...rows].map((line) => line.map(csvCell).join(",")).join("\r\n");
  }

  // --- URL inspection ---------------------------------------------------------
  function normalizeInspection(response) {
    const result = (response && (response.inspectionResult || response)) || {};
    const index = result.indexStatusResult || {};
    const google = index.googleCanonical || "";
    const user = index.userCanonical || "";
    const verdict = String(index.verdict || "VERDICT_UNSPECIFIED").toUpperCase();
    return {
      verdict,
      indexed: verdict === "PASS",
      coverageState: index.coverageState || "",
      indexingState: index.indexingState || "",
      robotsTxtState: index.robotsTxtState || "",
      pageFetchState: index.pageFetchState || "",
      crawledAs: index.crawledAs || "",
      lastCrawlTime: index.lastCrawlTime || "",
      googleCanonical: google,
      userCanonical: user,
      canonicalMismatch: Boolean(google && user && google !== user),
      sitemaps: Array.isArray(index.sitemap) ? index.sitemap : [],
      inspectionLink: result.inspectionResultLink || "",
    };
  }

  function parseUrlList(text) {
    const seen = new Set();
    const out = [];
    for (const piece of String(text || "").split(/[\s,]+/)) {
      const url = piece.trim();
      if (!/^https?:\/\/[^\s]+$/i.test(url) || seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
    return out;
  }

  root.SEOCoachGscEngine = {
    ROW_LIMIT,
    MAX_HISTORY_DAYS,
    DATA_LAG_DAYS,
    RANGE_PRESETS,
    BUCKETS,
    DEFAULT_OPTIONS,
    PAGE_MULTIPLE,
    ROOT_LANGUAGE,
    codedError,
    round,
    isIsoDate,
    addDays,
    diffDays,
    localToday,
    oldestDate,
    resolveRange,
    monthWindows,
    cleanFilter,
    isFilterEmpty,
    buildFilterGroups,
    rowsFromResponse,
    normalizeKey,
    pageKey,
    group,
    summarize,
    percentChange,
    bucketFor,
    rankBuckets,
    compare,
    dailySeries,
    sliceSeries,
    weeklyBuckets,
    buildDecayMap,
    findNewPages,
    pagesByQuery,
    findStrikingDistance,
    findCannibalization,
    languageOfUrl,
    groupByLanguage,
    languageFilter,
    ctrBaseline,
    buildQueue,
    buildAnomalies,
    buildCtrOpportunities,
    noteWindows,
    compareNote,
    parseKeywordList,
    summarizeTracked,
    filterRows,
    toCsv,
    normalizeInspection,
    parseUrlList,
  };
})(typeof window !== "undefined" ? window : globalThis);
