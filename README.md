# SEO Coach — AK 訓練出來的虛擬 SEO 陪跑教練

> **你月費付了，流量沒動過。問題不是 SEO 難，是沒人帶你看對地方。**

> 🇺🇸 English → [README.en.md](README.en.md) ｜ 🇨🇳 简体中文 → [README.zh-CN.md](README.zh-CN.md)

---

## 這是什麼

SEO Coach 是由 AK（[@darkseoking](https://www.threads.com/@darkseoking)）設計、訓練出來的虛擬陪跑教練 Skill。

它不丟報告、不給你一份 251 條規則清單、不假裝兩個小時就能幫你解決所有 SEO 問題。

它做的事只有一件：**陪你自己看懂自己的網站**。

用 Socratic 問答（蘇格拉底式對話）引導你一步一步找到問題、理解原因、決定下一步。你自己做過一次，才是真的學會了。

---

## 為什麼做這個

AK 是 Threads 上的 SEO KOL（@darkseoking），長期公開分享 SEO 教學、拆解低端廠商話術。在整理網路上各種公開 SEO 資料的過程中，AK 發現一件事：

**AI Agent 其實非常適合拿來學 SEO——但大部分人不知道從哪裡開始，也不知道怎麼問對問題。**

與其讓新手繼續在一堆矛盾資訊裡繞圈子，不如直接把 AK 認為有價值的公開資料和教學邏輯，整合進一個 AI 陪跑教練——讓你從第一個問題就走在正確的軌道上。

SEO Coach 就是這樣來的。

---

## 你會拿到什麼

**從零開始的 SEO 入門陪跑**
帶你走完 SEO 新手該懂的基礎，包含：
- **技術層**：爬蟲能力、索引狀態、HTTPS、Schema、Core Web Vitals
- **頁面層**：title、meta、H1、alt、URL 結構
- **內容層**：搜尋意圖、可讀性、E-E-A-T、舊文剪枝
- **連結生態**：內部連結架構、反向連結基礎
- **衡量層**：GSC 怎麼看、GA4 基礎、SEO 成效衡量
- **常見情境**：流量掉了、改版、新站、CMS 平台問題、SEO 迷思釐清
- **進階主題**：Topical Map、SERP Features、AI 搜尋準備度、電商 SEO、本地 SEO（補充）

共 18 個 Audit 模組（5 層架構），每個模組一次聚焦一個問題，給你一個最小可執行的下一步。不會一次倒整套，不會丟你 251 條清單。

**整合公開 SEO 資料**
從 Google Search Central、Ahrefs 教學、Aleyda Solis、LearningSEO、Lily Ray、Marie Haynes、Whitespark 等主流公開來源整理進教學。額外整合了 AK 自己的實戰補充：廠商判斷框架、AI 寫文章架構、舊文優化、內鏈規則等。

**持續追蹤陪跑**
- 每次 Session 存進度（`seo-progress.md`）
- 每個 Action Item 追蹤（`seo-actions.md`）
- 下次回來接著做，不用重新解釋脈絡

**直接接你的後台數據**
GSC / GA4 / CMS 可以接 MCP / API，教練直接讀數據，不用你反覆截圖貼出來。

**內建版本檢查**
直接跟教練說「有沒有新版？」就會去 GitHub 比對最新版本，並告訴你怎麼更新。

---

## 適合誰

- 低競爭在地商家、小型品牌站、服務業網站——基礎 SEO 做到位就有差距
- 想學 SEO 但不知道從哪開始，不想被廠商唬
- 已有網站，想知道先修哪裡 ROI 最高
- 發了幾十篇文章但流量一直沒起來，不知道問題在哪
- 中高競爭內容站 / 電商——適合當問題框架輔助

---

## 不適合誰

以下這些已經超出免費陪跑層級，需要更深入的 pipeline 設計或專業判斷：

- 語意 SEO / 主題集群 / 內容權威建構
- AI 內容 pipeline 整合到團隊發布流程
- 規模化結構化建頁（programmatic SEO）
- 大型站台技術 SEO 重構、國際化、Core Web Vitals 深度優化
- 品牌矩陣 / PBN 站群流量 / GEO 優化
- 流量大幅下跌持續數週、改版遷站、大量掉索引
- YMYL 高風險產業（醫療診斷建議、金融投資建議、法律個案意見等需要專業執照判斷的內容）

需要這些 → [akseolabs.com/services](https://akseolabs.com/services)

---

## 怎麼開始

把這個 repo 的內容放進你 AI agent 的 skills 資料夾就能用。

**安裝步驟**：
1. Clone 這個 repo（或下載 zip）：
   ```
   git clone https://github.com/akseolabs-seo/seo-coach
   ```
2. 把整個資料夾放進你 AI agent 的 skills 目錄（路徑依平台而定）
3. 在 AI agent 啟動一個新對話，直接說你的 SEO 問題、或給一個網址

第一次會問你想做哪種模式：快速問一個概念 / 給網址抓一個重點 / 系統性學 SEO 持續追蹤。

---

## 怎麼確認有新版

直接跟教練說「**有沒有新版？**」或「**check update**」，教練會自動去 GitHub 比對你目前的版本和最新版本，如果有更新會告訴你變動內容、怎麼更新。

---

## Repo 結構

```
.
├── README.md                # 本檔案
├── README.en.md             # English version
├── SKILL.md                 # 主路由與行為規則
├── CHANGELOG.md
├── evals/                   # 行為測試案例
├── adapters/                # 跨平台 adapter
└── references/              # 18 模組知識庫 + 系統文件
```

---

## 最後說一句

這個 Skill 不會讓你變成 SEO 大師。SEO 本來就沒有唯一解——每個人有每個人的做法，每個網站有每個網站的狀況。

但它可以幫你走好第一步：搞懂自己的網站出了什麼問題、排名第一個關鍵字、建立一個可以持續執行的基礎。從這裡開始，剩下的靠你自己慢慢累積。

---

## 免責聲明

SEO 結果取決於產業競爭、內容品質、網站歷史、技術條件等大量變數。這個 Skill 是教育與陪跑工具，不保證排名、流量或索引結果。SEO 業界變化快，教學以主流公開資料為基礎，跟最新趨勢有落差請自行核對。

---

## 授權

MIT License — 可自由使用、修改、分發。商業使用請保留原始出處。
