# 爬行能力（Crawlability）

## 核心概念
搜尋引擎爬蟲（Googlebot）會定期造訪網站、讀取內容、更新索引。如果爬蟲無法順利存取頁面，那些頁面就不會出現在搜尋結果中——所有其他 SEO 努力都是白費。

**類比：** 爬蟲就像圖書館員，robots.txt 是門口的告示牌，sitemap 是書目索引，頁面本身是書。書要被借閱，首先要讓圖書館員找得到、進得來。

---

## robots.txt

### 是什麼
純文字檔案，放在網站根目錄（`domain.com/robots.txt`），告訴爬蟲哪些路徑可以爬、哪些不行。

### 重要規則
- `User-agent: *` → 適用所有爬蟲
- `Disallow: /` → 封鎖整個網站（非常危險！）
- `Disallow: /admin/` → 封鎖特定目錄
- `Allow: /` → 明確允許（通常不需要）
- `Sitemap: https://domain.com/sitemap.xml` → 告知 sitemap 位置

### 常見錯誤
- 開發環境設了 `Disallow: /` 上線後忘記改
- 不小心封鎖 CSS/JS 檔案（影響渲染）
- 同時有多個衝突的規則

### 怎麼檢查
1. 瀏覽器直接開 `yourdomain.com/robots.txt`
2. Google Search Console → 設定 → robots.txt 測試工具

### 邊界
- 複雜的多語系或動態網站的 robots.txt 策略
- 爬行預算優化（大型網站特有問題）
→ 建議尋求專業 SEO 服務

---

## XML Sitemap

### 是什麼
XML 格式的檔案，列出網站所有希望被索引的 URL，讓爬蟲更有效率地發現內容。

### 最佳實踐
- 只列應該被索引的 URL（不要放 noindex 頁面）
- 單一 sitemap 最多 50,000 URLs / 50MB，超過就用 Sitemap Index 拆分
- 提交到 Google Search Console

### 常見錯誤
- Sitemap 包含已刪除或重定向的 URL
- 沒有提交到 GSC
- URL 格式不一致（有的有 www、有的沒有）

### 怎麼檢查
1. 直接開 `yourdomain.com/sitemap.xml`
2. Google Search Console → Sitemap → 查提交狀態和錯誤

### CMS 產生 Sitemap
- **WordPress**：Yoast SEO / RankMath 自動生成
- **Shopify**：自動生成 `/sitemap.xml`
- **靜態 HTML**：需手動建立或用工具生成

---

## 爬行錯誤

### 常見錯誤類型
| 錯誤碼 | 意義 | 常見原因 |
|--------|------|---------|
| 404 | 頁面不存在 | 頁面刪除、URL 改變 |
| 301/302 | 重定向 | 正常情況，但鏈過長會耗費資源 |
| 5xx | 伺服器錯誤 | 主機問題、流量過大 |

### 怎麼找出爬行錯誤
- Google Search Console → 索引 → 頁面 → 查看「未收錄」原因
- Screaming Frog（免費版爬 500 URLs）→ Response Codes 分頁

### 修復策略
- 404 頁面若已移動 → 設 301 重定向到新 URL
- 404 頁面若已刪除且無替代 → 讓它 404，不要強制導回首頁

---

## 重定向鏈（Redirect Chains）

A → B → C → D 每個中間跳轉都消耗爬行資源，且傳遞的連結能量會減少。最佳實踐是讓 A 直接指向最終目的地。

### 怎麼檢查
Screaming Frog → Redirects → Filter: Redirect Chains
