# 釐清問題

使用者輸入格式錯誤的 Email（非空但缺少 @ 或不合法格式）時，系統應如何處理？

# 定位

Feature：登入 — Rule「Email 為必填」的邊界條件；目前 Example 只覆蓋「空值」情境

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 與「Email 為空」相同，操作失敗（合併為同一條 Rule） |
| B | 獨立 Rule：格式不合法時操作失敗（需新增 Rule 與 Example） |
| Short | 提供其他簡短答案（<=5 字） |

# 影響範圍

- `登入.feature`：若選 B，需新增一條 Pre-condition Rule 與 Example

# 優先級

Low
- 格式驗證通常由前端 input[type=email] 處理，對業務規則影響較小

---
# 解決記錄

- **回答**：B — 獨立一條 Rule「Email 格式必須正確」
- **更新的規格檔**：spec/features/登入.feature
- **變更內容**：新增 Pre-condition Rule「Email 格式必須正確」與對應 Example（輸入 "notanemail" 操作失敗）
