# 釐清問題

建立旅程時，系統是否應同時產生該旅程的 invite_token？

# 定位

ERM：`trips.invite_token` 標記為 `[unique, not null]`，但 `建立旅程.feature` 完全未提及此欄位的產生時機。
Feature：`分享旅程.feature` 的所有 Example 都直接假設旅程已存在 invite_token（如 `And 旅程 "大阪旅遊" 的 invite_token 為 "abc123"`），顯示產生時機的規則目前未被任何 feature 明確定義。

# 多選題

| 選項 | 描述 |
|--------|-------------|
| A | 是，建立旅程時系統自動產生唯一的 invite_token，`建立旅程.feature` 應新增對應 Rule + Example |
| B | 否，invite_token 於使用者第一次執行分享時才產生（lazy generation），此規則應改寫入 `分享旅程.feature` |
| Short | 提供其他簡短答案（<=5 字）|

# 影響範圍

- `spec/features/建立旅程.feature` 或 `spec/features/分享旅程.feature`：其中之一需新增 Rule + Example
- `trips.invite_token` 的 `not null` 約束與實際產生時機需保持一致

# 優先級

Low
- Low：不影響核心建立旅程流程，但影響資料完整性一致性與 feature 間的規則歸屬

---
# 解決記錄

- **回答**：A - 是，建立旅程時系統自動產生唯一的 invite_token，`建立旅程.feature` 應新增對應 Rule + Example
- **更新的規格檔**：`spec/features/建立旅程.feature`
- **變更內容**：新增 Rule「建立後系統同時產生該旅程唯一的 invite_token」及對應 Example（建立旅程後旅程具有 invite_token）
