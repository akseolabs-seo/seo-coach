# CMS 特定問題（WordPress / Shopify / 靜態 HTML）

## WordPress

### 必裝 SEO 外掛
**Yoast SEO** 或 **RankMath**（擇一，不要同時裝）

| 功能 | Yoast SEO | RankMath |
|------|----------|---------|
| 免費版功能 | 基本 SEO | 功能更多（免費） |
| 介面 | 較直覺 | 功能較複雜 |
| Schema 支援 | 付費版才完整 | 免費版就有 |

**安裝後必做設定：**
1. 提供 Sitemap 並提交到 GSC
2. 設定首頁的 Title 和 Meta Description
3. 確認「阻止搜尋引擎索引此網站」選項已關閉
4. 設定社群媒體的 Open Graph 預設圖片

### 固定網址設定
`設定 → 固定網址 → 選「文章名稱」`
- ✅ `example.com/how-to-bake-sourdough/`（清楚）
- ❌ `example.com/?p=123`（無意義）

**注意：** 改變固定網址結構後，一定要設定 301 重定向，否則舊連結全部失效。

### 常見 WordPress SEO 問題

**1. 開發時的 noindex 沒關掉**
`設定 → 閱讀 → 搜尋引擎可見性` → 確認沒有打勾「阻止搜尋引擎索引此網站」

**2. 重複 Meta Tags（多外掛衝突）**
不要同時安裝 Yoast 和 RankMath，也不要讓主題自帶的 SEO 功能和外掛衝突。用 `view-source:` 檢查 `<head>` 裡有沒有多個 title 標籤。

**3. 分類/標籤頁的重複內容**
WordPress 自動生成分類頁、標籤頁、日期頁、作者頁。如果沒有足夠的獨特內容，這些可以設為 noindex。

**4. 圖片 Alt Text 遺漏**
上傳圖片時記得填寫「替代文字」（Alt text）欄位。

**5. 速度問題**
- 安裝快取外掛（LiteSpeed Cache 免費版很好用）
- 使用圖片壓縮外掛（Smush、ShortPixel）
- 避免安裝過多外掛

### WordPress 多站台（Multisite）
有額外的 SEO 複雜性，各子站的設定需要分別管理，建議尋求專業協助。

---

## Shopify

### Shopify SEO 的先天優勢
- 自動生成 sitemap.xml
- 自動設定 canonical（但有些問題，見下方）
- SSL 預設開啟
- 行動版友善

### Shopify 的特有 SEO 問題

**1. 重複 URL 問題（最常見）**
同一個產品可能存在兩個 URL：
- `/products/sourdough-bread-kit`
- `/collections/baking-kits/products/sourdough-bread-kit`

Shopify 會自動在第二個 URL 加上 canonical 指向第一個，但：
- 內部連結如果連到第二個 URL，仍然是次優的
- 解決方案：確保所有內部連結都使用 `/products/` 的 URL

**2. collection 頁面的重複內容**
多個 collection 包含同樣的產品列表 → 薄內容問題。
- 為每個 collection 頁面加入獨特的描述文字
- 至少 150-200 字的介紹段落

**3. 無法完全自訂 URL 結構**
Shopify 強制在 URL 中加入 `/products/` 和 `/collections/` 前綴，無法移除。這不是大問題，但要了解。

**4. App 衝突**
過多的 App 可能：
- 注入重複的 meta tag
- 增加頁面載入時間
- 添加不必要的 JavaScript

定期清理不使用的 App。

**5. 主題圖片優化**
Shopify 會自動提供 WebP 格式的圖片，但原始上傳圖片仍需壓縮後再上傳。

### Shopify SEO 設定位置
- 線上商店 → 偏好設定 → 搜尋引擎最佳化（可設定首頁 title/meta）
- 每個產品/collection 頁面的底部有 SEO 設定區塊
- 導航 → 連結清單（管理內部連結結構）

---

## 靜態 HTML 網站

### 優勢
- 載入速度快（沒有資料庫查詢）
- 結構簡單，易於控制
- 不依賴外掛

### 必須手動處理的事

**1. 每頁的 Meta Tags**
每個 .html 檔案都需要獨立設定：
```html
<head>
  <title>頁面標題 | 品牌名稱</title>
  <meta name="description" content="頁面描述，150-160字元">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="https://yourdomain.com/page/">
</head>
```

**2. 手動生成 Sitemap**
工具選擇：
- XML-Sitemaps.com（免費，爬取生成）
- Screaming Frog（匯出 XML sitemap）
- 手動維護（適合小網站）

**3. .htaccess 重定向（Apache 伺服器）**
www vs 非 www 重定向：
```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^www\.(.*)$ [NC]
RewriteRule ^(.*)$ https://%1/$1 [R=301,L]
```
HTTPS 強制：
```apache
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```

**4. 結構化資料需手動加入**
每個頁面的 `<head>` 或 `<body>` 結尾加入 JSON-LD。

**5. 沒有 CMS 的 SEO 工具**
使用 Screaming Frog 批次檢查所有頁面的 meta tag。

---

## Webflow / Wix / Squarespace

這三個平台都有內建的基本 SEO 設定，但各有限制：
- **Webflow**：SEO 功能較強，可控性高，適合設計師
- **Wix**：內建 Wix SEO 工具，但 URL 結構彈性較低
- **Squarespace**：介面友善，但進階 SEO 控制有限

共同注意事項：
- 確認 sitemap 自動提交
- 每頁的 title 和 meta description 要獨立設定
- 避免使用過多的動畫效果（影響 CLS）
