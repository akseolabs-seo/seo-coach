# 技術 SEO（Technical SEO）

## 核心概念
技術 SEO 確保網站基礎架構讓搜尋引擎能正確抓取、渲染、理解和索引內容。技術問題影響最廣，也最容易被忽視。

---

## HTTPS / SSL

### 為什麼重要
- Google 2014 年起將 HTTPS 作為排名因素（輕度加分）
- 沒有 HTTPS，Chrome 會顯示「不安全」警告，影響信任和點擊率
- 混合內容（HTTPS 頁面載入 HTTP 資源）會觸發警告

### 怎麼檢查
- 瀏覽器網址列 → 確認有鎖頭圖示
- Chrome DevTools → Console → 查是否有 Mixed Content 錯誤

### 常見問題
- SSL 憑證過期（需定期更新）
- HTTPS 頁面中嵌入 HTTP 的圖片、腳本
- 內部連結仍使用 http:// 開頭

---

## WWW vs 非 WWW 重定向

選定一個版本，另一個版本 301 重定向到選定版本。所有版本最終應落在同一個 URL：
- `http://www.example.com`
- `https://www.example.com`
- `http://example.com`
- `https://example.com`

四個版本全部測試，確認都正確導向同一個最終 URL。

---

## URL 結構

### 好的 URL
- 簡短、有意義
- 使用連字號（hyphen）分隔，不用底線
- 全部小寫
- 避免多餘參數

✅ `example.com/blog/how-to-bake-sourdough/`
❌ `example.com/p?id=12345&cat=3`

### 注意
URL 結構一旦確定盡量不要改，改了要設 301 重定向，否則外部連結全部失效。

---

## 結構化資料（Schema Markup）

### 是什麼
用 JSON-LD 格式嵌入頁面，幫助 Google 理解內容的語義，並解鎖豐富搜尋結果（Rich Results）。

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "頁面標題",
  "author": {"@type": "Person", "name": "作者名稱"},
  "datePublished": "2024-01-15"
}
</script>
```

### 常用 Schema 類型
| Schema | 適用頁面 | 解鎖的 Rich Result |
|--------|---------|------------------|
| Article | 部落格文章 | 文章卡片 |
| Product | 產品頁 | 價格、評分 |
| FAQPage | FAQ 頁面 | 展開問答 |
| LocalBusiness | 本地商家 | 地圖、電話 |
| BreadcrumbList | 所有頁面 | 麵包屑路徑 |

### 怎麼測試
- Google Rich Results Test（`search.google.com/test/rich-results`）

### 常見錯誤
- Schema 資料與頁面實際內容不符
- JSON-LD 語法錯誤
- 遺漏必要欄位

---

## 行動裝置友善（Mobile-First）

Google 自 2019 年起採用行動版優先索引——主要以行動版評估排名。

### 基本要求
- Viewport meta tag：`<meta name="viewport" content="width=device-width, initial-scale=1">`
- RWD（響應式設計）
- 行動版與桌機版內容一致（不要隱藏重要內容）
- 字體大小至少 16px

### 怎麼檢查
- Chrome DevTools → 切換行動裝置模式（Ctrl+Shift+M）
- PageSpeed Insights / Lighthouse
- 實機檢查：文字是否可讀、按鈕是否好點、內容是否超出螢幕

注意：Search Console 的舊「行動裝置可用性」報告已退役，不要再把它當成檢查入口。

---

## 邊界
JavaScript 渲染問題（SPA/React）、Edge SEO、爬行預算優化、hreflang 多語系
→ 建議尋求專業 SEO 服務
