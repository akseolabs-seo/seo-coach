# GA4 陪跑軌道 eval run — 2026-07-29

**跑法**：`claude -p`（v2.1.220）headless，每題一個乾淨工作目錄，prompt 前綴要求先用 Skill 工具載入 seo-coach 再回覆。有 context 的題目先在該目錄放好 `seo-progress.md` / `seo-ga4-log.md`，並開放 Write/Edit 以驗證檔案真的寫得出來。
**判定**：依 `rubric.md`，逐 assertion 二元計分，全過才算該題 pass。判定者是本次 session（非獨立第三方）。

## 結果：6/6 pass（其中 1 題是修正 spec 後重跑才過）

| 題目 | 結果 | 備註 |
|------|------|------|
| `ga4-one-pointing-card` | ❌ → ✅ | 首跑 5 段，違反 `no-info-dump`（≤ 4 段）。修 spec 後重跑 4 段通過 |
| `ga4-api-only-when-earned` | ✅ | 明確說「現在還不用接」並給了值得接的條件；同時給一個 30 秒可完成的動作 |
| `ga4-gsc-gap-is-not-a-defect` | ✅ | 自行算出 24%、對到 10–20%／>30% 判準，還主動加了「日期沒對齊」這個更常見的假差距 |
| `ga4-api-does-not-replace-learning` | ✅ | 明講「你會把判斷力外包給我」，並設計成拉數 → 指路卡對同一個數字 |
| `ga4-proactive-translate-and-log` | ✅ | 真的建立了 `seo-ga4-log.md`、標基準線、來源標「用戶口述」並放進待校正區 |
| `ga4-log-only-observed-numbers` | ✅ | 拒絕補寫未觀察的數字，台帳檔案內容零變動 |

## 這次跑出來的兩個真實缺陷（已修）

**1. 指路卡格式與回應深度規則衝突** — 卡片有 7 個項目，模型自然輸出成 5 段，撞到主檔「2-4 段」的規則。
修法：`50-ga4-coaching-track.md` 指路卡格式段加一句「七項是內容清單，不是七段，輸出時壓成 3–4 段」。重跑後 4 段通過。

**2. GA4 選單字樣寫錯（繁中）** — 原本只寫「獲取 → 流量獲取」（簡中／部分版本用語）；fresh session 自己改用「客戶開發 → 流量開發」，代表模型知識與檔案不一致，而這正是本軌道最不該出錯的地方（整條軌道的價值就是指路精準）。
修法：`50`、`21`、`23` 三個檔的 GA4 路徑一律**雙中文字樣 + 英文原名**（Acquisition / Traffic acquisition / Engagement / Landing page / Events），並在檔頭寫明英文名是最穩的錨點、以用戶截圖為準。

## 尚未驗證

- GA4 實際介面的選單字樣（需要登入 GA4 帳號）。目前採雙標 + 英文原名 + 「以用戶截圖為準」的防禦寫法，不宣稱已核對過 2026-07 的線上介面。
- `51-ga4-api-connection.md` 的 Data API 設定流程未做端到端實跑（需要 GCP 專案與真實 GA4 property）。錯誤對照表是依 API 錯誤語意寫的，未逐條重現。
- 其餘 54 個既有 eval case 這次沒有重跑；本次改動只新增檔案與 GA4 相關分支，未改既有行為規則。
