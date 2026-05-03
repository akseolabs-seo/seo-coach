# 索引狀態（Indexing）

## 核心概念
索引是 Google 把頁面內容收錄進資料庫的過程。**爬行 ≠ 索引** — 爬蟲看到了不代表會收錄，被收錄不代表會排名。

三個層次：爬行 → 索引 → 排名。很多人只看排名，但問題常出在索引層。

---

## 檢查索引狀態

### 快速方法
Google 搜尋 `site:yourdomain.com`
- 回傳數字是估計值，但可以看趨勢
- 結果明顯少於實際頁面數 → 有索引問題

### 精確方法
Google Search Console → 索引 → 頁面
- 「已索引的頁面」= 目前被收錄的頁面數
- 「未索引的頁面」= 有問題，需要看原因

### 常見的「未索引」原因
| 原因 | 意義 | 是否需要修復 |
|------|------|------------|
| noindex 標籤 | 頁面明確告知不要索引 | 看是否故意設定 |
| 已爬取但目前未收錄 | Google 看過但選擇不收 | 通常是內容品質問題 |
| 重複頁面，Google 選了非標準頁面 | Canonical 問題 | 需檢查 canonical 設定 |
| 404 | 頁面不存在 | 修復或設重定向 |

---

## Noindex 標籤

### 是什麼
放在 `<head>` 裡，告訴 Google 不要索引這個頁面：
```html
<meta name="robots" content="noindex">
```

### 合理使用的情況
- 管理後台、登入頁
- 重複的分類/標籤頁（部落格）
- 購物車、結帳頁
- 測試/暫存頁面

### 常見錯誤
- WordPress 開發時勾選「阻止搜尋引擎索引」，上線忘記取消
- Yoast/RankMath 某些頁面不小心設成 noindex

### 怎麼檢查
1. Chrome DevTools → Elements → 搜尋 `noindex`
2. `view-source:yourdomain.com` → Ctrl+F 搜尋 noindex
3. Google Search Console → URL 檢查工具

---

## Canonical 標籤

### 是什麼
告訴 Google「這個頁面的正式版本是哪個 URL」，解決重複內容問題。

```html
<link rel="canonical" href="https://www.example.com/page/">
```

### 常見的重複 URL 情況
- `http://` vs `https://`
- `www.` vs 沒有 `www.`
- 結尾有 `/` vs 沒有 `/`
- 有追蹤參數 `?utm_source=...` 的 URL
- Shopify 的 `/products/xxx` vs `/collections/yyy/products/xxx`

### 常見錯誤
- Canonical 指向重定向的 URL（應該直接指向最終 URL）
- 多個 canonical 標籤（只有第一個有效）
- Canonical 設錯，指向不相關的頁面

### 怎麼檢查
1. Chrome DevTools → Elements → 搜尋 `canonical`
2. Screaming Frog → Canonicals 分頁
3. GSC → URL 檢查工具 → 查看「Google 選擇的 canonical」

---

## 重複內容（Duplicate Content）

### 常見來源
- WWW/非WWW 版本都能打開
- HTTP/HTTPS 都能打開
- Shopify 產品在不同 collection 下的多個 URL
- WordPress 的分類、標籤、作者、日期頁

### 解決方式
1. 選定一個「正式版本」→ 設 canonical
2. 其他版本 → 301 重定向到正式版
3. 不需要被索引的版本 → 加 noindex

### 邊界
大型電商的 faceted navigation 重複內容策略、程式化 SEO 的重複內容控制
→ 建議尋求專業 SEO 服務
