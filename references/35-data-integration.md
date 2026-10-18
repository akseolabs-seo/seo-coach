# 接 GSC／GA4／CMS — 讓教練直接讀數據

## 教練的預設做法

**長期陪跑時，能接就接；第一次新手快看時，先不要用整合設定卡住對話。**

新手第一輪先跑 `references/36-beginner-practical-playbooks.md` 的 5 分鐘檢查。等用戶需要看真實搜尋數據、願意持續追蹤，或已經反覆貼截圖時，再帶他接 MCP／API。

截圖貼數據只是「還沒接」時的暫時方案，不是長期建議；但不要讓新手以為沒接工具就不能開始。

GSC 的預設接法是一把唯讀的服務帳戶金鑰加上 skill 內建的本機工具：同一次設定同時接通瀏覽器面板與教練的讀數指令，逐步帶法、錯誤對照與安全規則 → `references/65-gsc-api-setup.md`；面板怎麼讀 → `references/59-gsc-dashboard.md`。

接 MCP／API 之後，我可以直接讀：
- GSC：查詢報告、頁面表現、Coverage／Indexing 狀態
- GA4：流量、來源、行為、轉換
- CMS：文章內容、分類、tag、媒體

---

## 什麼是 MCP

MCP（Model Context Protocol）是讓 AI 能呼叫外部工具／資料來源的協議。不同執行環境（Codex、Claude Code、桌面 app、公司內部 agent）支援方式不同；要先確認目前環境能不能安裝或呼叫對應 connector。

裝法不要硬背單一路徑。先問用戶使用的環境，再依該環境的文件設定 connector / MCP server / API credentials。

如果用戶使用 Claude Code，可參考：https://docs.claude.com/en/docs/claude-code/mcp；如果使用 Codex 或其他環境，改查該環境的 connector / MCP 文件。

---

## Google Search Console（GSC）

預設走 `references/65-gsc-api-setup.md`（Search Console API＋服務帳戶＋`assets/gsc-tools/gsc.mjs`），一輪帶一步。執行環境已有可用的 GSC MCP／connector 時也可以直接用，但仍要做 65 號檔的「接通的定義」：同一資源、同一段日期，和學員在 GSC 介面看到的數字對得起來。

---

## Google Analytics 4（GA4）

### 路徑 A：GA4 MCP
搜尋 "GA4 MCP" 或 "Google Analytics MCP"。

### 路徑 B：GA4 Data API
1. Google Cloud Console 啟用 Google Analytics Data API
2. 建立 service account，加到 GA4 property 的權限
3. 用 API 讀資料

**完整逐步（含每步「完成長什麼樣」、驗證查詢、錯誤對照表）→ `references/51-ga4-api-connection.md`**

API 文件：https://developers.google.com/analytics/devguides/reporting/data/v1

---

## CMS

### WordPress
- **WordPress MCP**：社群有版本，搜尋「WordPress MCP」
- **REST API**：WordPress 內建 `/wp-json/wp/v2/`，可讀文章、分類、tag、媒體。需要 application password 認證
- **WP-CLI**：可 SSH 進伺服器的話，直接用 wp-cli 抓資料

### Shopify
- Shopify Admin API + access token，我可以用 curl 直接呼叫
- 或找社群 Shopify MCP

### Webflow／Wix／Squarespace
- 大多沒有開放公開 API，只能用截圖／匯出資料

---

## 安全提醒

- 不要把 API key／OAuth token 直接貼到對話 — 設成環境變數或 MCP server 的設定檔
- 客戶網站要先確認你有授權再接資料來源
- 接完之後抓的資料會留在這個對話的 context，結束前自己評估要不要清

---

## 我能幫的範圍

✅ 我能：
- 教你怎麼設定 MCP／API
- 接好之後幫你解讀數據
- 比對「沒接時截圖能看到的」 vs 「接了之後能拉到的」差異

🚫 我不會：
- 替你申請 Google Cloud 帳號
- 替你產生 OAuth credentials
- 替你管理 API key 安全

---

## 從哪個開始接

只想接一個 → **從 GSC 開始**。它對 SEO 陪跑的價值最高（查詢、排名、CTR、Coverage 都在這）。

要接第二個 → **GA4**，逐步走 `references/51-ga4-api-connection.md`；接之前先確認用戶真的需要（已反覆貼截圖、要跨月比較或固定月報），不要拿 API 當入門門檻。

流程：
1. 先確認用戶已經完成基礎檢查，且真的需要真實數據
2. 用戶決定要接 GSC
3. 我問目前環境（使用 Codex / Claude Code / 其他 agent？Mac / Windows？已有 GCP 帳號嗎？）
4. 依 `references/65-gsc-api-setup.md` 一輪帶一步
5. 用戶測試我能不能讀到資料
6. 開始用
