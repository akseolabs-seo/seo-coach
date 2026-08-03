# 51 — 把 GA4 接進來（Data API 陪跑）

**reason**: 讓陪跑從「用戶反覆貼截圖」升級成「教練直接讀 GA4」，同時保留用戶自己在介面看一次的學習迴圈。
**strip_when**: GA4 Data API 的授權方式或資源權限模型改變，本流程無法再完成一次成功的 runReport 驗證。

資料核對：2026-07-29。Google Cloud 主控台選單常改字樣，**畫面以用戶截圖為準**；不變的是四個判斷點：要啟用哪個 API、要建哪一種身分、要把它加到哪裡、怎麼驗證接通。

---

## 先判斷值不值得接

第一次設定大約 20–40 分鐘。**滿足 2 個以上訊號再開口提議**，不要拿它當入門門檻：

- 用戶已經貼過 3 次以上 GA4 截圖
- 要做跨月比較，或一次看十幾頁的表現
- 要每月固定回報同一組數字
- 用戶自己說「每次都要截圖很煩」

**先不要接**：只想看一個數字、只用一次、完全新手第一輪、沒有 Google Cloud 帳號也不想開。留在 `50-ga4-coaching-track.md` 的指路卡就好——貼截圖完全夠用，而且學習效果更好。

---

## 三條路（預設走 B）

| 路徑 | 適合誰 | 成本 |
|------|--------|------|
| **A. 現成 GA4 MCP connector** | 執行環境本來就支援 MCP、想最快接通 | 低，但要先確認該環境裝得起來（→ `35-data-integration.md`） |
| **B. Data API + service account**（推薦） | 大多數人。長期穩定、不用反覆重新登入 | 中，一次設定 |
| **C. OAuth 使用者授權** | 公司政策不允許建 service account | 中高，token 要維護 |

以下走 B。

---

## B 路線逐步（每一步都有「完成長什麼樣」）

### Step 0 — 找到 property ID（純數字）

GA4 → 管理（左下齒輪）→ 資源設定／資源詳情 → 右上角「資源 ID」，是一串 9–10 位數字。

**完成長相**：你手上有一串像 `123456789` 的數字。

> **第一名的卡關點**：`G-XXXXXXXXXX` 是**評估 ID（Measurement ID）**，那是給網頁追蹤碼用的。API 要的是**數字 property ID**，兩個不能互換。

### Step 1 — 建一個 Google Cloud 專案

`console.cloud.google.com` → 新增專案 → 名字隨便取（例：`seo-coach-ga4`）→ 建立。

**完成長相**：右上角專案選單顯示你剛建的專案名稱。後面每一步都要確認自己在**這個**專案裡。

### Step 2 — 啟用 Google Analytics Data API

在該專案裡用上方搜尋列打「Google Analytics Data API」→ 進入 → 啟用。

**完成長相**：按鈕從「啟用」變成「管理」。

### Step 3 — 建 service account 並下載金鑰

IAM 與管理 → 服務帳戶 → 建立服務帳戶 → 名稱隨意 → 建立並繼續 → **專案角色可以留空**（權限是在 GA4 那邊給的，不是在 GCP）→ 完成。
點進剛建好的服務帳戶 → 金鑰 → 新增金鑰 → 建立新的金鑰 → 選 **JSON** → 下載。

**完成長相**：拿到一個 `.json` 檔，打開裡面有一行 `client_email`，長得像 `xxx@專案名.iam.gserviceaccount.com`。

> **這個檔案等同密碼**。放在專案資料夾外的固定位置；不要進 git，不要貼進對話。

### Step 4 — 把 service account 加進 GA4 資源

GA4 → 管理 → 資源存取管理 → 右上「+」→ 新增使用者 → 貼上 Step 3 的 `client_email` → 角色選**檢視者（Viewer）** → **取消勾選「以電子郵件通知新使用者」**（那不是真人信箱）→ 新增。

**完成長相**：存取管理清單裡出現那個 `...iam.gserviceaccount.com`。

> 加在「帳戶存取管理」也可以，但至少要涵蓋你要查的那個資源。只給檢視者，不要給編輯權。

### Step 5 — 跑一次驗證查詢

```bash
pip install google-analytics-data
```

```python
# ga4_check.py — 驗證連線：過去 28 天各管道的工作階段
import os
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import DateRange, Dimension, Metric, RunReportRequest

os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = r"C:\你的路徑\key.json"
PROPERTY_ID = "123456789"  # Step 0 拿到的數字

client = BetaAnalyticsDataClient()
resp = client.run_report(
    RunReportRequest(
        property=f"properties/{PROPERTY_ID}",
        dimensions=[Dimension(name="sessionDefaultChannelGroup")],
        metrics=[Metric(name="sessions")],
        date_ranges=[DateRange(start_date="28daysAgo", end_date="yesterday")],
    )
)
for row in resp.rows:
    print(row.dimension_values[0].value, row.metric_values[0].value)
```

**成功長相**：印出幾行像 `Organic Search 412` / `Direct 260` / `Referral 88`。

**最後一步才算真的接通**：把印出來的 Organic Search 數字，跟用戶在 `50-ga4-coaching-track.md` L2 指路卡裡看到的數字比一次。對得起來 → 接通且雙方看的是同一件事；對不起來 → 通常是日期區間或 property 選錯，不是資料壞掉。

---

## 錯誤對照表

| 訊息／症狀 | 意思 | 怎麼修 |
|-----------|------|--------|
| `403 PERMISSION_DENIED` | service account 沒被加進這個資源 | 回 Step 4，確認貼的是 `client_email`、且加在正確的 property |
| `404` / property not found | property ID 錯了 | 回 Step 0；確認不是拿 `G-XXXX` 去填 |
| `403 ... API has not been used / disabled` | 沒啟用 Data API，或啟用在別的專案 | 回 Step 2，確認專案就是金鑰所屬的那個 |
| `DefaultCredentialsError` | 找不到金鑰檔 | 檢查 `GOOGLE_APPLICATION_CREDENTIALS` 路徑；Windows 路徑記得用 `r"..."` |
| 回傳 0 rows，沒報錯 | 該區間真的沒資料，或 GA4 剛裝 | 改成 `90daysAgo` 再試；仍為 0 → 回 L1 指路卡確認有在收資料 |
| `RESOURCE_EXHAUSTED` | 超過配額 | 降低查詢頻率、縮小維度組合，不要一次拉大量維度 |
| 數字跟介面差一點點 | 時區、資料處理延遲、抽樣 | 兩邊都改成「到昨天為止」再比 |

---

## 接好之後常用的查詢清單

| 陪跑問題 | dimensions | metrics |
|---------|-----------|---------|
| 自然搜尋趨勢 | `date` | `sessions`（加上管道 = Organic Search 的篩選） |
| 哪一頁在帶自然流量 | `landingPage` | `sessions`, `engagementRate` |
| 自然流量有沒有帶來結果 | `sessionDefaultChannelGroup` | `keyEvents` |
| 手機 vs 電腦差異 | `deviceCategory` | `sessions`, `engagementRate` |
| 哪個國家／語言 | `country` | `sessions` |

`keyEvents` 若回報 invalid metric，改用 `conversions`（同一個概念在不同 API 版本的名稱）。
維度／指標完整清單：https://developers.google.com/analytics/devguides/reporting/data/v1/api-schema

---

## 安全與授權

- **金鑰不貼對話、不進 git**。用環境變數或本機固定路徑，`.gitignore` 加上 `*.json` 金鑰檔名
- **客戶網站要先取得授權**才接資料來源
- **只給檢視者權限**，不給編輯
- 抓下來的資料會留在這個對話的 context 裡，結束前自己評估要不要清

---

## 接好之後的陪跑規則

1. **API 不取代指路卡。** 教練拉到數字後，仍給對應的指路卡讓用戶自己在介面看一次同一個數字（→ `50-ga4-coaching-track.md`）。
2. **只報本輪實際回傳的數字。** 查詢沒跑成功就說沒跑成功，不能用「通常會是這樣」代替現場資料。
3. **能拉不等於要倒。** 每月固定看三個數字就好：自然搜尋工作階段、前 5 名到達頁、關鍵事件。不要因為拉得到就給用戶一份大表。
4. **拉到的數字一律進台帳。** 每次查詢回傳後當輪寫進 `seo-ga4-log.md`（來源標 `API`），並用人話翻譯 + 跟上次比——接了 API 之後這件事更重要，因為用戶不再是自己看到數字的那個人（→ `50-ga4-coaching-track.md` 的三件事）。
5. **把查詢交給用戶。** 驗證腳本存成檔案給他，讓他之後能自己跑同一支——這是「用著用著就學會」的關鍵一步。

---

## 我不會做的

- 替你申請 Google 帳號或 Google Cloud 帳號
- 替你產生、保管、輪替金鑰
- 替你設定 GTM 事件追蹤或自訂維度
- 替你做多管道歸因分析或 BI 報表整合
