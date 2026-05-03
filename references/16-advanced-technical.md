# 進階技術 SEO 基礎認識

## JavaScript SEO 基礎

### 問題是什麼
傳統 HTML 內容，Googlebot 爬取後立刻能讀取。但如果內容是用 JavaScript 動態渲染的（React、Vue、Angular 等 SPA 框架），Googlebot 需要先「執行 JavaScript」才能看到內容——這個過程更耗費資源，且有延遲。

### 兩種渲染方式
| 方式 | 說明 | SEO 友好度 |
|------|------|-----------|
| SSR（Server-Side Rendering） | 伺服器直接送出完整 HTML | ✅ 最佳 |
| SSG（Static Site Generation） | 預先生成靜態 HTML | ✅ 最佳 |
| CSR（Client-Side Rendering） | HTML 骨架 + JS 渲染內容 | ⚠️ 需要額外測試 |

### 怎麼判斷你的網站有沒有 JS SEO 問題
1. Google Search Console → URL 檢查工具 → 查看「頁面抓取結果」
2. 比較「HTML 來源」和「渲染後的 HTML」是否一致
3. 如果重要內容只出現在渲染後 → 可能有問題

### 常見症狀
- Google 索引的版本缺少重要內容
- 爬行了很久但索引頁數很少
- 排名莫名偏低，技術面其他都正常

### 邊界
JS SEO 的深度診斷和修復需要前端開發配合，屬於專業 SEO 範疇。

---

## 爬行預算（Crawl Budget）

### 是什麼
Google 分配給每個網站的「爬行次數額度」。小型網站（< 1000 頁）基本上不用擔心，對大型電商（數萬頁以上）才是關鍵問題。

### 哪些頁面會浪費爬行預算
- 無限的篩選參數 URL（`?color=red&size=L&sort=price`）
- 沒有內容的空白頁面
- 大量重定向鏈
- 已封鎖但仍有大量連結指向的頁面

### 基本控制方法
- `robots.txt` 封鎖不需要爬取的參數 URL
- 減少頁面上的連結數量（不要有成千上萬個連結）
- Google Search Console → 設定 → 爬取統計資料（查看爬蟲造訪頻率）

### 邊界
爬行預算優化是大型網站的專業問題，小網站不需要擔心。

---

## 分頁優化（Paginations）

### 問題
部落格文章列表、產品列表往往有分頁（第 1 頁、第 2 頁...），這會產生問題：
- 分頁 2、3 的頁面連結很少 → 難被爬到
- 每頁的 meta description 可能相似 → 稀薄內容

### 現代做法
Google 已不再推薦使用 `rel="prev/next"`（已於 2019 年廢棄）。

**目前建議：**
1. 確保分頁能被爬到（有前後頁的導航連結）
2. 分頁加 canonical 指向第一頁（如果內容高度相似）
3. 或讓每個分頁都獨立索引（如果每頁有獨特的主要項目）
4. 提供「載入更多」或「無限滾動」的替代方案時，確保有 URL 變化

---

## 日誌檔分析（Log File Analysis）基礎認識

### 是什麼
伺服器 access log 記錄了所有對伺服器的請求，包含 Googlebot 的每一次爬取。分析 log file 能讓你看到 Google **實際**爬了什麼，而不是你以為 Google 看到的。

### 能發現什麼問題
- Googlebot 是否爬取了你不想讓它爬的頁面
- 哪些重要頁面沒有被爬到
- 爬蟲的造訪頻率是否正常
- 大量爬取但沒有索引的頁面（可能是品質問題）

### 基礎工具
- Screaming Frog Log File Analyser（需付費）
- Cloudflare 等 CDN 的分析面板（有部分爬蟲資訊）

### 邊界
Log file 分析是技術性較強的進階工作，需要伺服器存取權限和分析工具，屬於專業 SEO 範疇。

---

## Edge SEO 基礎認識

### 是什麼
在 CDN 邊緣節點（Cloudflare、Fastly 等）層級執行 SEO 相關的邏輯，不需要修改後端程式碼。

### 可以做的事（概念層）
- 在 CDN 層動態修改 HTTP header（meta robots）
- 注入結構化資料
- 處理重定向規則

### 對一般網站的意義
除非你的網站有嚴格的後端修改限制（例如無法改動程式碼的企業系統），否則不需要用到 Edge SEO。

### 邊界
Edge SEO 屬於高度技術性的進階工作，需要開發資源。
