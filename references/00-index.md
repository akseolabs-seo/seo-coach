# 00 — 知識庫索引 + 18 模組目錄

當需要深入解釋某個主題時，按表載入對應的 reference 檔。**只在用戶問到、或進入該模組時才讀**，不要一次全部載入。

---

## 知識庫對照表

| 主題 | 檔案 |
|------|------|
| 爬行能力（robots.txt, sitemap） | `references/01-crawlability.md` |
| 索引狀態（noindex, canonical） | `references/02-indexing.md` |
| 技術 SEO（HTTPS, schema, 行動版） | `references/03-technical-seo.md` |
| 頁面優化（title, meta, H1, alt） | `references/04-on-page.md` |
| 內容品質（搜尋意圖, 可讀性, 剪枝） | `references/05-content-quality.md` |
| E-E-A-T（信任信號） | `references/06-eeat.md` |
| 內部連結（anchor text, 孤兒頁面） | `references/07-internal-links.md` |
| 頁面速度（Core Web Vitals） | `references/08-page-speed.md` |
| 關鍵字基礎（GSC 分析, 搜尋意圖） | `references/09-keyword-basics.md` |
| 連結建設基礎（反向連結） | `references/10-links-backlinks.md` |
| CMS 特定問題（WP/Shopify/HTML） | `references/11-cms-specific.md` |
| 常見情境（排名下降, 改版, 新站） | `references/12-scenarios.md` |
| AI 搜尋準備度 | `references/13-ai-search.md` |
| 主題地圖（Topical Map） | `references/14-topical-map.md` |
| SERP 功能 / Google Discover / Knowledge Panel | `references/15-serp-features.md` |
| JS SEO / 爬行預算 / 分頁 / Log File | `references/16-advanced-technical.md` |
| 圖片 SEO + 影片 SEO | `references/17-media-optimization.md` |
| 電商 SEO：產品頁 + Faceted Navigation | `references/18-ecommerce-seo.md` |
| SEO 常見迷思 | `references/19-seo-myths.md` |
| 負面 SEO 防護 | `references/20-negative-seo.md` |
| SEO 成效衡量 / 向非SEO說明價值 | `references/21-seo-measurement.md` |
| Google 地圖 / Local SEO 低比重例外（GBP、NAP） | `references/22-local-seo.md` |
| Google Analytics 4 基礎 | `references/23-ga4-basics.md` |
| Google Search Console 完整操作指南 | `references/24-gsc-guide.md` |
| SEO 術語表（中英對照，80+ 詞彙） | `references/25-glossary.md` |
| Ahrefs SEO 初學者課程精華（Sam Oh，14 部影片） | `references/30-ahrefs-course-insights.md` |
| 初學者友善來源地圖（Google / Aleyda / Ahrefs / Lily / Marie / Whitespark） | `references/31-beginner-friendly-source-map.md` |
| Google 初學者底線原則 | `references/32-google-beginner-principles.md` |
| Coach 對話示例 | `references/33-coach-dialogue-examples.md` |
| AK 的「低端 SEO 廠商獵殺計畫」教學系列 | `references/34-darkseoking-threads.md` |
| 接 GSC／GA4／CMS 讓教練直接讀數據（MCP／API） | `references/35-data-integration.md` |
| 新手實戰 Playbooks（5 分鐘檢查、最小下一步） | `references/36-beginner-practical-playbooks.md` |
| 版本檢查（用戶觸發，比對 GitHub 最新版） | `references/37-update-check.md` |
| 教練風格行為定義（系統） | `references/sys-coach-styles.md` |
| 進度檔案與行動清單模板（系統） | `references/sys-file-templates.md` |
| 功課、冷卻、里程碑、小結卡（系統） | `references/sys-session-system.md` |

---

## Audit 模組架構（5 層 18 模組）

按 Tier 順序推進。每個模組共用對話節奏（見 SKILL.md 主檔）：Hook → 用戶回答 → 檢查指令 → 診斷 → 教學 → 行動項 → 進度確認 → 過渡。

### ▌Tier 1 — 技術基礎健診（所有網站必做）

**Module 1 — Crawlability**
Hook：「你知道 Google 是怎麼『發現』你的網站內容的嗎？」
工具：瀏覽器直開 `domain.com/robots.txt`、`domain.com/sitemap.xml`、GSC → 覆蓋率
Reference：`01-crawlability.md`

**Module 2 — Indexing**
Hook：「你有試過在 Google 搜尋 `site:你的網域` 嗎？結果多少頁？」
工具：`site:` 搜尋、GSC URL 檢查、Chrome DevTools
Reference：`02-indexing.md`

**Module 3 — Technical SEO**
Hook：「你知道為什麼 Google 偏好 HTTPS 網站嗎？」
工具：瀏覽器鎖頭、Google Rich Results Test
Reference：`03-technical-seo.md`（電商補充：`18-ecommerce-seo.md`）

**Module 4 — Page Speed**
Hook：「你上次等一個網頁超過 3 秒是什麼感覺？你覺得 Google 怎麼看這件事？」
工具：PageSpeed Insights、GSC → Core Web Vitals
Reference：`08-page-speed.md`（圖片速度：`17-media-optimization.md`）

**Module 5 — CMS-Specific**
按平台走（WordPress / Shopify / 靜態 HTML）
Reference：`11-cms-specific.md`

---

### ▌Tier 2 — 頁面與內容品質

**Module 6 — On-Page**
Hook：「你覺得 title tag 和你在瀏覽器分頁看到的網頁標題，是同一個東西嗎？」
工具：Chrome DevTools、Screaming Frog（免費版 500 URLs）
Reference：`04-on-page.md`

**Module 7 — Content Quality**
Hook：「如果你是想搜尋這個關鍵字的用戶，你的頁面有沒有完整回答他的問題？」
工具：手動搜尋目標關鍵字，比較排名前三的頁面
Reference：`05-content-quality.md`

**Module 8 — E-E-A-T**
Hook：「你聽過 E-E-A-T 嗎？你覺得它對你的行業重要嗎？」
工具：肉眼審查（About 頁、作者資訊、聯絡方式）
Reference：`06-eeat.md`

**Module 9 — Topical Map**
Hook：「如果 Google 要評估你的網站是不是某個領域的專家，你覺得它會看什麼？」
工具：Google Autocomplete、People Also Ask、手繪主題地圖
Reference：`14-topical-map.md`

**Module 10 — Keyword Basics**
Hook：「你現在目標打的關鍵字，是你想用的詞，還是你的用戶真的在搜尋的詞？」
工具：GSC → 查詢、Google Autocomplete、Google Trends
Reference：`09-keyword-basics.md`

---

### ▌Tier 3 — 連結生態

**Module 11 — Internal Links**
Hook：「如果你把你的網站想成一個城市，你覺得內部連結是什麼？」
工具：Screaming Frog、Ahrefs Webmaster Tools（免費版）
Reference：`07-internal-links.md`

**Module 12 — Backlinks 基礎**
Hook：「你知道你的網站目前有多少其他網站連結過來嗎？」
工具：Ahrefs Webmaster Tools（免費）、GSC → 外部連結
Reference：`10-links-backlinks.md`

---

### ▌Tier 4 — 進階機會發掘

**Module 13 — SERP Features**
Hook：「你有沒有注意過搜尋結果頁除了藍色連結以外，還有哪些不同的區塊？」
工具：Google Rich Results Test、手動觀察 SERP
Reference：`15-serp-features.md`

**Module 14 — Image & Video SEO**
Hook：「你的圖片 alt text 是怎麼寫的？你知道 Google 為什麼需要它嗎？」
工具：Screaming Frog → Images、Google Rich Results Test
Reference：`17-media-optimization.md`

**Module 15 — AI Search Readiness**
Hook：「你有沒有試過在 ChatGPT 或 Perplexity 搜尋你的品牌名稱？結果怎樣？」
工具：直接在 ChatGPT / Perplexity 搜尋、Rich Results Test
Reference：`13-ai-search.md`

---

### ▌Tier 5 — 情境處理與防護

**Module 16 — SEO Scenarios**
按需使用：排名下降、改版、新站、Core Update 後恢復
Reference：`12-scenarios.md`

**Module 17 — Negative SEO 防護**
Hook：「你有沒有監控過你的網站是否有異常的反向連結突然出現？」
工具：Ahrefs Webmaster Tools、GSC → 外部連結
Reference：`20-negative-seo.md`

**Module 18 — SEO 成效衡量**
Hook：「你怎麼知道你做的 SEO 有沒有在發揮作用？你目前看什麼數字？」
工具：GSC → 成效、GA4 → 自然搜尋
Reference：`21-seo-measurement.md`

---

## 補充教育模組（按需插入，不佔主流程）

- **SEO 迷思免疫針**：自然停頓時插入（一個模組剛結束、用戶說出錯誤觀念時）→ `19-seo-myths.md`
- **進階技術概念**（JS SEO / 爬行預算 / 分頁 / Log File）：用戶有技術背景或主動問到 → `16-advanced-technical.md`
- **電商產品頁 + Faceted Navigation**：電商用戶 → `18-ecommerce-seo.md`
- **Google 地圖 / Local SEO 低比重例外**：只有用戶明確問 GBP、NAP、Google 地圖時才讀 `22-local-seo.md`；只做基本方向或轉介，不展開地圖排名服務
- **GA4 基礎**：用戶問數據怎麼看 → `23-ga4-basics.md`
- **GSC 從零設定**：用戶從來沒用過 GSC → `24-gsc-guide.md`
- **術語解釋**：用戶問到不懂的詞彙 → `25-glossary.md`
- **初學者白話補充**：用戶是新手、被術語卡住、需要更友善的解釋順序 → `31-beginner-friendly-source-map.md`
- **Google 底線校正**：用戶觀念很亂、被舊 SEO 技巧帶偏、需要最穩的基礎框架 → `32-google-beginner-principles.md`
- **自然對話校正**：需要更像真人教練的接話、收尾、邊界回應方式 → `33-coach-dialogue-examples.md`
- **被廠商報價打中**：用戶問「這個 SEO 服務值不值得買 / 我自己做得來嗎」→ `34-darkseoking-threads.md`
- **完全新手落地**：用戶不知道現在要做什麼、被工具嚇到、只需要第一個可執行檢查 → `36-beginner-practical-playbooks.md`
