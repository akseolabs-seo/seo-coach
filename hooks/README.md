# 自動召喚 hook（選用）

技能本身不需要 hook 就能用——Claude Code 與 Codex 都會依 `SKILL.md` 的 `description` 自行判斷要不要載入。這個資料夾是給**想要更確定**的人：讓 seo-coach 在該出現的時候一定出現。

裝了之後：

- **在陪跑資料夾裡**（有 `seo-progress.md` / `seo-actions.md` / `seo-ga4-log.md`）→ session 一開始就載入技能並接續上次進度
- **在任何其他專案裡** → 只有當提問看起來是新手向 SEO 陪跑時才載入

沒裝也完全能用。這是加確定性，不是必要條件。

---

## 檔案

| 檔案 | 用途 |
|------|------|
| `seo_coach_router.py` | 偵測器。兩個平台共用同一支（stdin / stdout 契約相同） |
| `test_router.py` | 26 個 pipe test。改了觸發字要重跑 |
| `claude-code.settings.snippet.json` | Claude Code 設定片段 |
| `codex.hooks.snippet.json` | Codex 設定片段 |

需求：`python` 在 PATH 上（3.8+，無第三方套件）。

---

## Claude Code 安裝

1. 找到 `seo_coach_router.py` 的資料夾，例如 `~/.claude/skills/seo-coach/hooks`
2. 打開 `~/.claude/settings.json`（全域，所有專案）或某專案的 `.claude/settings.json`
3. 把 `claude-code.settings.snippet.json` 的兩個 event **合併**進既有的 `hooks` 物件，`<SKILL_DIR>` 換成步驟 1 的路徑

> **合併，不要覆蓋。** 已經有 `UserPromptSubmit` hook 的話，把新的 entry 加進那個陣列，不要整段換掉——直接覆蓋會把你其他的 router 弄不見。

4. 驗證（新開一個 session 才會生效）：

```bash
echo '{"hook_event_name":"UserPromptSubmit","prompt":"我是 SEO 新手，想學怎麼看 Search Console","cwd":"."}' | python <SKILL_DIR>/seo_coach_router.py
```

有輸出一段 JSON = 偵測器正常。之後在 Claude Code 裡問一句 SEO 新手問題，看它會不會自己載入 seo-coach。

**設定檔改了但沒生效**：Claude Code 只監看 session 開始時就存在的設定檔目錄。開一次 `/hooks` 重新載入，或重開 session。

---

## Codex 安裝

1. 打開（或建立）`$CODEX_HOME/hooks.json`，預設是 `~/.codex/hooks.json`
2. 把 `codex.hooks.snippet.json` 的內容合併進去，`<SKILL_DIR>` 換成路徑
3. Codex 對 hook 有信任機制，第一次執行會要你確認來源

**先驗證偵測器本身**（跟平台無關，一定要先過）：

```bash
echo '{"hook_event_name":"UserPromptSubmit","prompt":"我的網站流量掉了怎麼辦","cwd":"."}' | python <SKILL_DIR>/seo_coach_router.py
```

**已驗證到什麼程度**（2026-07-29，Codex 0.133.0）：hooks 引擎存在；事件名稱、stdin 欄位（`hook_event_name` / `prompt` / `cwd`）與輸出契約（`hookSpecificOutput.additionalContext`）與 Claude Code 相同——這些是從 Codex 執行檔內建的 JSON schema 讀出來的。**沒有**跑過端到端實測（隔離 `CODEX_HOME` 沒有認證，turn 起不來）。所以：偵測器本身已驗證，Codex 端的檔案位置與載入請以你自己第一次安裝時的結果為準；若 Codex 回報 `failed to parse hooks config`，先確認路徑與 JSON 格式。

---

## 跟其他 SEO 技能共存

如果你裝了不只一個 SEO 技能（整站 audit、語意內容、GEO、本地 SEO⋯⋯），router 注入的文字最後一句就是給這種情況用的：

> 若這個請求其實更適合另一個更專門的 SEO 技能，改用那一個。

它不會硬把所有 SEO 問題都吃進 seo-coach。但如果你已經有自己的 SEO router hook，兩個一起注入會讓模型收到兩份指示——這時候建議**只留一個**，或把觸發字調開（見下）。

---

## 調整觸發條件

觸發規則都在 `seo_coach_router.py` 最上面三個 regex：

| 變數 | 作用 |
|------|------|
| `STRONG` | 單獨命中就觸發（`robots.txt`、`GA4`、`收錄`、`流量掉`⋯⋯） |
| `SEO_CTX` + `BEGINNER` | 兩個都命中才觸發（弱 SEO 詞 × 新手訊號） |
| `SESSION_FILES` | 哪些檔案代表「這是陪跑資料夾」 |

改完**一定要跑一次** `python hooks/test_router.py`。測試裡有故意放的反例，例如「我下個月要去 Seoul 玩」——`seo` 是 `Seoul` 的前三個字母，沒有邊界保護就會誤觸發。

---

## 移除

把設定檔裡那兩個 entry 刪掉即可。router 腳本本身不寫任何檔案、不連網、任何例外都靜默 exit 0——最壞情況是它沒觸發，不會讓你的提問失敗。
