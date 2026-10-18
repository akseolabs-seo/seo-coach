# 65 — 把 GSC 接進來（服務帳戶＋本機工具）

**reason**：讓反覆貼 GSC 截圖的學員用一把唯讀金鑰，同時接通面板（瀏覽器）與教練讀數據（CLI），並保留「自己在 GSC 介面看一次同一個數字」的學習迴圈。
**strip_when**：`assets/gsc-tools/gsc.mjs` 不再發佈，或 Search Console API 不再接受服務帳戶以使用者身分讀取資源。

資料核對：2026-10-08。Google Cloud 主控台選單常改字樣，**畫面以學員截圖為準**；不變的是四個判斷點：啟用哪個 API、建哪種身分、把它加到哪裡、怎麼驗證接通。工具需要 Node 18 以上，沒有其他相依套件。

## 先判斷要不要接

第一次設定約 10–20 分鐘。**先不要接**：第一輪的完全新手、只想看一個數字、還沒驗證 GSC 資源（→ `24-gsc-guide.md`）。這些情況留在 GSC 介面加截圖，學習效果更好。

出現以下任一訊號才開口提議：已貼過 3 次以上 GSC 截圖、要跨期間或一次看多頁、自己說「不想一直截圖」。沒有網站的學員不必接，面板的示範資料就能練（→ `48-practice-reading-drills.md`）。

## 逐步（一輪只帶一步）

學員自己點；教練只說這一步去哪裡、完成長什麼樣，等他回報或截圖再給下一步。**不要求學員把金鑰內容貼進對話**；需要 `client_email` 時請他只複製那一行，或直接看 `check` 的輸出。

| 步驟 | 學員做什麼 | 完成長什麼樣 |
|---|---|---|
| 1 專案 | `console.cloud.google.com` 建立或選一個專案 | 頁首的專案選單顯示該專案名稱；之後每一步都在同一個專案 |
| 2 啟用 API | 在該專案用上方搜尋列找「Google Search Console API」並啟用 | 該 API 頁面顯示已啟用（按鈕變成管理） |
| 3 服務帳戶 | IAM 與管理 → 服務帳戶 → 建立；名稱隨意，專案角色可留空（權限在 GSC 那邊給） | 清單出現一個結尾是 `.iam.gserviceaccount.com` 的帳戶 |
| 4 金鑰 | 點進該帳戶 → 金鑰分頁 → 新增金鑰 → 建立新的金鑰 → JSON | 瀏覽器下載一個 `.json` 檔；這個檔只能下載這一次 |
| 5 存放 | 把檔案改名並存成 `~/.seo-coach/gsc-service-account.json`（Windows 是使用者資料夾下的 `.seo-coach`） | 檔案在使用者資料夾內、不在任何專案或 git 資料夾裡 |
| 6 授權 | Search Console → 設定 → 使用者和權限 → 新增使用者，貼上金鑰裡的 `client_email`，權限選「受限」 | 使用者清單出現那個服務帳戶 |
| 7 檢查 | 在 skill 資料夾執行 `node assets/gsc-tools/gsc.mjs check` | 三步都是 `"ok": true`，第 3 步列出資源名稱 |
| 8 開面板 | `node assets/gsc-tools/gsc.mjs serve`，開啟它印出的 `http://127.0.0.1:8791/` | 面板顯示已連線並可選網站資源 |

- 金鑰放別處也可以：工具依序找 `--key <路徑>` → 環境變數 `GSC_SERVICE_ACCOUNT_KEY` → `GOOGLE_APPLICATION_CREDENTIALS` → 上面的預設路徑。
- 先跑了第 8 步但還沒放金鑰時，面板會顯示「本機服務已啟動，還差金鑰」與預設路徑；放好後重新整理即可。
- 第 4 步若被組織政策擋住（公司或學校的 Google 帳戶常見），不要繞過；請他改用個人帳戶建立的專案，或找管理員。
- 網域資源在工具裡的名稱是 `sc-domain:example.com`，網址前置字元資源是完整網址；以 `sites` 的輸出為準。

## 接通的定義

`check` 通過還不算。**同一個資源、同一段日期，CLI 或面板的總點擊要和學員在 GSC 成效報表看到的對得起來**，才算接通：

1. 教練執行 `summary --site <資源> --last 28`，報出期間與總點擊。
2. 學員在 GSC 介面把日期設成同一段，回報總點擊。
3. 一致 → 接通。不一致 → 先查資源（網域資源與網址前置字元資源不同）、日期（工具只取最終資料，結束日是今天往前 3 天）與搜尋類型（工具只取「網頁」），不說成資料壞掉。

## 錯誤對照

工具的錯誤是 `{ "error": { "code", "message", "hint" } }`；`check` 則在失敗的那一步附 `hint`。先讀 `hint`，再對下表。

| `code` | 意思 | 怎麼修 |
|---|---|---|
| `noKey` | 四個位置都找不到金鑰檔 | 回步驟 5，確認檔名與資料夾 |
| `badKey` | 檔案不是 JSON，或不是服務帳戶金鑰（例如下載成 OAuth 用戶端檔） | 回步驟 4 重新建立 JSON 金鑰 |
| `tokenFailed` | Google 不接受這把金鑰 | 金鑰是否已在 Google Cloud 被刪除；電腦時間是否正確 |
| `apiDisabled` | 金鑰所屬專案沒有啟用 API | 回步驟 2，確認是同一個專案 |
| `noSites` | API 正常，但沒有任何資源分享給這個服務帳戶 | 回步驟 6 |
| `noPermission` | 這個資源沒有加入該服務帳戶 | 回步驟 6，確認加在正確的資源、貼的是 `client_email` |
| `quota` | 碰到配額 | 等一分鐘再試；URL Inspection 每個資源每天約 2,000 次 |
| `badRequest` | 日期、維度或篩選寫法不被接受 | 日期用 `YYYY-MM-DD` 且在約 16 個月內；篩選照 `--help` 的格式 |

> 組織政策不允許建立服務帳戶金鑰時：工具也接受已授權使用者的 OAuth 憑證檔（JSON 內有 `client_id`、`client_secret`、`refresh_token`，即 Google 用戶端程式庫存下來的那種），放在同一個路徑即可；這種憑證不需要步驟 6，權限等同該 Google 帳號本身，務必只授權唯讀的 `webmasters.readonly`。

## 安全與撤銷

- 金鑰等同密碼：放在任何 git 資料夾之外，不貼對話、不寄信、不放雲端共用資料夾。
- 工具只申請唯讀範圍 `webmasters.readonly`，GSC 端也只給「受限」；它不能改網站或 GSC 設定。
- `serve` 只綁定 `127.0.0.1`，金鑰只由本機工具讀取，不會送到面板頁面。`--allow-host` 是給自己架反向代理的人用的，新手不需要。
- 撤銷任一種就失效：在 Google Cloud 該服務帳戶的金鑰分頁刪除金鑰，或在 GSC 的使用者和權限移除該使用者。
- 客戶或他人的網站要先取得授權才接；教練不替學員申請帳號、產生或保管金鑰。

## 教練自己讀數據

接通後教練可以在 session 內直接執行 CLI。輸出是 JSON，附一句 `boundary`（平均排名是期間平均、查詢列不含匿名查詢、兩期差異不是原因），判讀時要照著說。

| 學員的問題 | 指令 |
|---|---|
| 現在整體在哪裡 | `summary --site <p> [--last 28] [--compare previous\|year]` |
| 某個查詢或某一頁 | `query --site <p> --last N --dims query,page --filter "page contains /blog/"` |
| 某次修改或某次更新前後 | `around --site <p> --date YYYY-MM-DD [--days 14]`（前後等長） |
| 某個網址的索引狀態 | `inspect --site <p> --url <網址>` |
| Google 公布了什麼更新 | `updates [--days 180]`（不需要金鑰；判讀走 `66-algorithm-update-reading.md`） |

1. 每次報數字都說出資源與期間；`partial: true` 或 `complete: false` 要講成資料限制。
2. 只查學員這一輪問的範圍，不因為拉得到就多看幾頁或倒一張大表。
3. 輸出是證據卡的觀察欄（→ `60-evidence-and-judgment-cards.md`），假設與下一個區分檢查另外寫；指令沒跑成功就說沒跑成功。
4. 教練讀到的數字，仍請學員在面板或 GSC 介面看一次同一格；要指到單一查詢或頁面時用面板深連結（→ `59-gsc-dashboard.md`）。
