# AI 搜尋準備度（AI Search Optimization）

## 核心概念
AI 搜尋（Google AI Overview、ChatGPT Search、Perplexity）改變了內容被「發現」的方式。傳統 SEO 是排名到搜尋結果頁，AI 搜尋是讓 AI 把你的內容當作可信來源「引用」。

**關鍵差異：**
| 傳統 SEO | AI 搜尋 |
|---------|--------|
| 爬取 → 索引 → 排名 | 擷取 → 合成 → 生成答案 |
| 目標：頁面排名第一 | 目標：被 AI 當來源引用 |
| 優化單一頁面 | 建立整體來源可信度 |

**好消息：** SEO 基礎（爬行、索引、速度、E-E-A-T）對 AI 搜尋仍然重要，不需要推翻一切重來。

---

## 技術準備

### 先讓一般搜尋能存取你的網站
Google 的 AI Overviews / AI Mode 沿用 Google Search 的基礎要求：頁面要能被 Googlebot 存取、索引，且可顯示 snippet。不要為了 AI 搜尋另外發明一套技術 SEO。

對 Google Search 的 AI features 來說，主要控制仍是 Googlebot、`noindex`、`nosnippet`、`data-nosnippet`、`max-snippet` 等 Search preview controls。`Google-Extended` 是用來控制部分 Google AI 訓練 / grounding 用途，不是讓你出現在 AI Overviews 的必要設定。

### 結構化資料對 AI 搜尋的重要性
- 不需要新增特殊的「AI schema」或 AI 專用檔案
- Structured data 仍然有用，但前提是和頁面可見內容一致
- Article / Organization / Product / LocalBusiness 等 schema 可幫助機器理解內容與實體，但不能替代真正有用、可信、可讀的內容

### 確保內容可被正確解析
- 避免讓重要內容只能在複雜 JavaScript 互動後才出現；不管是 Googlebot 或其他爬蟲，越容易以 HTML / 可渲染內容取得，越穩
- 使用語意化 HTML（`<article>`、`<section>`、`<h1>-<h6>`）
- 重要資訊用純文字，不只放在圖片裡

---

## 內容優化

### 對話式內容格式
AI 搜尋喜歡能直接回答問題的內容結構：

**好的格式：**
- 問題 → 直接答案（第一段就給答案，再展開解釋）
- FAQ 格式（每個問題都有獨立標題）
- 定義式寫法（「X 是什麼？X 是...」）

**不友善的格式：**
- 答案埋在大段敘述裡
- 需要讀完全文才能找到結論
- 過度行銷、不夠直接的寫法

### 引用友善的寫作
AI 系統傾向引用：
- 有明確事實、數據的內容
- 有清楚來源引用的內容
- 語言準確、不模糊的陳述
- 有作者和發布日期的內容

### 完整涵蓋主題
AI 偏好可以完整回答一個問題的單一來源，而非需要拼湊多個來源。讓你的頁面盡可能完整地回答目標主題的所有面向。

---

## E-E-A-T 在 AI 搜尋中仍然重要

AI 搜尋會更常把內容拆成答案、比較、引用來源；因此來源可信度、清楚的實體資訊和可驗證內容更重要。但不要把它講成一個可直接操作的「AI 排名分數」。
- 清楚的作者資訊（真實姓名、職稱、專業背景）
- 明確的品牌身份（About 頁面、聯絡資訊）
- 被其他可信來源提及或引用
- 內容有清楚的發布和更新日期

---

## 怎麼追蹤 AI 搜尋的曝光

目前沒有完美的工具追蹤 AI 引用，但可以：
1. **手動搜尋**：在 ChatGPT、Perplexity、Google AI Overview 搜尋你的品牌名和核心主題，觀察是否被引用
2. **Google Search Console**：Google AI features 的點擊 / 曝光會併入 Performance report 的 Web search type；目前不要期待有完整獨立的 AI Overview 報表
3. **Brand Monitoring 工具**：追蹤品牌提及

---

## 實用的快速改善清單

- [ ] 確認 Googlebot 沒有被 robots.txt、CDN、主機或登入牆擋住
- [ ] Structured data 與頁面可見內容一致，不標記假的或看不到的資訊
- [ ] 重要文章有清楚作者、日期、來源與更新紀錄
- [ ] 每個頁面的第一段直接回答主題問題
- [ ] 加入 FAQ 區塊（常見問題 + 直接回答）
- [ ] 確認 About 頁面有完整的品牌/作者資訊
- [ ] 在 ChatGPT/Perplexity 搜尋你的品牌和核心關鍵字，記錄現況

---

## 邊界聲明
以下建議尋求專業判斷：
- AEO（Answer Engine Optimization）完整策略
- AI 搜尋的競爭分析和引用差距分析
- 大規模的 AI 搜尋可見度監控系統建立
